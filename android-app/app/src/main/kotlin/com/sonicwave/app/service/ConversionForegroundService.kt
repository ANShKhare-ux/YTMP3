package com.sonicwave.app.service

import android.Manifest
import android.app.Notification
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import com.sonicwave.app.MainActivity
import com.sonicwave.app.R
import com.sonicwave.app.SonicWaveApplication
import com.sonicwave.app.engine.ConversionEngine
import com.sonicwave.app.engine.ConversionJob
import com.sonicwave.app.engine.JobStatus
import com.sonicwave.app.engine.ResolvedMedia
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/**
 * Keeps media extraction and conversion alive in a foreground dataSync service
 * with live progress and completion notifications.
 */
class ConversionForegroundService : Service() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private var conversionTask: Job? = null
    private var progressObserverTask: Job? = null
    private var lastNotifiedProgress: Int = -1
    private var lastNotifiedStatus: JobStatus? = null

    companion object {
        const val ACTION_START_CONVERSION = "com.sonicwave.app.action.START_CONVERSION"
        const val ACTION_CANCEL_CONVERSION = "com.sonicwave.app.action.CANCEL_CONVERSION"

        const val EXTRA_URL = "extra_url"
        const val EXTRA_FORMAT = "extra_format"
        const val EXTRA_QUALITY = "extra_quality"
        const val EXTRA_SLIDE_INDEX = "extra_slide_index"
        const val EXTRA_MEDIA_TOKEN = "extra_media_token"

        private const val PROGRESS_NOTIFICATION_ID = 1001
        private const val RESULT_NOTIFICATION_ID = 1002
        private const val OPEN_APP_REQUEST_CODE = 2001
        private const val CANCEL_REQUEST_CODE = 2002

        private val pendingMediaCache = ConcurrentHashMap<String, ResolvedMedia>()

        fun startConversion(
            context: Context,
            url: String,
            format: String,
            quality: String,
            resolvedMedia: ResolvedMedia? = null,
            selectedSlideIndex: Int? = null
        ) {
            val token = resolvedMedia?.let { media ->
                UUID.randomUUID().toString().also { key ->
                    pendingMediaCache[key] = media
                }
            }

            val intent = Intent(context, ConversionForegroundService::class.java).apply {
                action = ACTION_START_CONVERSION
                putExtra(EXTRA_URL, url)
                putExtra(EXTRA_FORMAT, format)
                putExtra(EXTRA_QUALITY, quality)
                putExtra(EXTRA_SLIDE_INDEX, selectedSlideIndex ?: -1)
                if (token != null) {
                    putExtra(EXTRA_MEDIA_TOKEN, token)
                }
            }
            ContextCompat.startForegroundService(context, intent)
        }

        fun cancelConversion(context: Context) {
            val intent = Intent(context, ConversionForegroundService::class.java).apply {
                action = ACTION_CANCEL_CONVERSION
            }
            context.startService(intent)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_CANCEL_CONVERSION -> {
                handleCancelAction()
                return START_NOT_STICKY
            }
            ACTION_START_CONVERSION -> {
                val url = intent.getStringExtra(EXTRA_URL).orEmpty()
                val format = intent.getStringExtra(EXTRA_FORMAT).orEmpty().ifBlank { "mp3" }
                val quality = intent.getStringExtra(EXTRA_QUALITY).orEmpty().ifBlank { "320" }
                val slideIdx = intent.getIntExtra(EXTRA_SLIDE_INDEX, -1).takeIf { it >= 0 }
                val mediaToken = intent.getStringExtra(EXTRA_MEDIA_TOKEN)
                val resolvedMedia = mediaToken?.let { pendingMediaCache.remove(it) }

                if (url.isBlank()) {
                    stopSelfSafely()
                    return START_NOT_STICKY
                }

                val initialTitle = resolvedMedia?.title?.takeIf { it.isNotBlank() } ?: "SonicWave Conversion"
                val initialNotification = buildProgressNotification(
                    title = initialTitle,
                    statusText = "Preparing extraction...",
                    progress = 0,
                    indeterminate = true
                )
                promoteToForeground(initialNotification)
                startProgressObservation()

                conversionTask?.cancel()
                conversionTask = serviceScope.launch {
                    try {
                        ConversionEngine.startConversion(
                            context = applicationContext,
                            url = url,
                            format = format,
                            quality = quality,
                            resolvedMedia = resolvedMedia,
                            selectedSlideIndex = slideIdx
                        )
                    } finally {
                        postCompletionNotification(ConversionEngine.currentJob.value)
                        stopSelfSafely()
                    }
                }
            }
            else -> stopSelfSafely()
        }

        return START_NOT_STICKY
    }

    private fun handleCancelAction() {
        ConversionEngine.cancelConversion()
        conversionTask?.cancel()
        stopSelfSafely()
    }

    private fun promoteToForeground(notification: Notification) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                PROGRESS_NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
            )
        } else {
            startForeground(PROGRESS_NOTIFICATION_ID, notification)
        }
    }

    private fun startProgressObservation() {
        progressObserverTask?.cancel()
        lastNotifiedProgress = -1
        lastNotifiedStatus = null
        progressObserverTask = serviceScope.launch {
            ConversionEngine.currentJob.collectLatest { job ->
                if (job == null) return@collectLatest
                val progressInt = job.progress.toInt().coerceIn(0, 100)
                if (progressInt == lastNotifiedProgress && job.status == lastNotifiedStatus) {
                    return@collectLatest
                }
                if (job.status == JobStatus.RESOLVING ||
                    job.status == JobStatus.DOWNLOADING ||
                    job.status == JobStatus.PROCESSING
                ) {
                    lastNotifiedProgress = progressInt
                    lastNotifiedStatus = job.status
                    val statusText = when (job.status) {
                        JobStatus.RESOLVING -> "Resolving streams & metadata..."
                        JobStatus.DOWNLOADING -> "Downloading (${progressInt}%)" +
                            if (job.eta.isNotBlank()) " • ETA ${job.eta}" else ""
                        JobStatus.PROCESSING -> "Encoding & saving (${job.format.uppercase()})..."
                        JobStatus.IDLE,
                        JobStatus.COMPLETED,
                        JobStatus.FAILED,
                        JobStatus.CANCELLED -> return@collectLatest
                    }
                    val notification = buildProgressNotification(
                        title = job.title.ifBlank { "SonicWave Conversion" },
                        statusText = statusText,
                        progress = progressInt,
                        indeterminate = job.status == JobStatus.RESOLVING || (job.status == JobStatus.PROCESSING && progressInt >= 99)
                    )
                    notifySafely(PROGRESS_NOTIFICATION_ID, notification)
                }
            }
        }
    }

    private fun buildProgressNotification(
        title: String,
        statusText: String,
        progress: Int,
        indeterminate: Boolean
    ): Notification {
        val openIntent = PendingIntent.getActivity(
            this,
            OPEN_APP_REQUEST_CODE,
            Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val cancelIntent = PendingIntent.getService(
            this,
            CANCEL_REQUEST_CODE,
            Intent(this, ConversionForegroundService::class.java).apply {
                action = ACTION_CANCEL_CONVERSION
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, SonicWaveApplication.DOWNLOAD_CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(statusText)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setContentIntent(openIntent)
            .setProgress(100, progress, indeterminate)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Cancel", cancelIntent)
            .build()
    }

    private fun postCompletionNotification(job: ConversionJob?) {
        if (job == null) return
        if (job.status != JobStatus.COMPLETED && job.status != JobStatus.FAILED) return

        val openIntent = PendingIntent.getActivity(
            this,
            OPEN_APP_REQUEST_CODE,
            Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val title = if (job.status == JobStatus.COMPLETED) {
            "Saved: ${job.title.ifBlank { "SonicWave Media" }}"
        } else {
            "Download Failed"
        }

        val body = if (job.status == JobStatus.COMPLETED) {
            "${job.format.uppercase()} ready in Downloads/SonicWave"
        } else {
            job.errorMessage ?: "Conversion failed"
        }

        val notification = NotificationCompat.Builder(this, SonicWaveApplication.DOWNLOAD_CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setContentIntent(openIntent)
            .build()

        notifySafely(RESULT_NOTIFICATION_ID, notification)
    }

    private fun notifySafely(id: Int, notification: Notification) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val granted = ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
            if (!granted) return
        }
        val manager = getSystemService(NotificationManager::class.java)
        manager?.notify(id, notification)
    }

    private fun stopSelfSafely() {
        progressObserverTask?.cancel()
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() {
        conversionTask?.cancel()
        progressObserverTask?.cancel()
        serviceScope.cancel()
        super.onDestroy()
    }
}

package com.sonicwave.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import android.util.Log
import com.yausername.youtubedl_android.YoutubeDL
import com.yausername.ffmpeg.FFmpeg
import com.yausername.aria2c.Aria2c

class SonicWaveApplication : Application() {

    companion object {
        const val DOWNLOAD_CHANNEL_ID = "sonicwave_downloads"
        const val DOWNLOAD_CHANNEL_NAME = "SonicWave Downloads"
    }

    override fun onCreate() {
        super.onCreate()
        initEngines()
        createNotificationChannels()
    }

    private fun initEngines() {
        try {
            YoutubeDL.getInstance().init(this)
            FFmpeg.getInstance().init(this)
            Aria2c.getInstance().init(this)
            Log.d("SonicWave", "On-device engine (yt-dlp, FFmpeg, aria2c) initialized successfully")
        } catch (e: Exception) {
            Log.e("SonicWave", "Failed to initialize YoutubeDL on-device engine", e)
        }
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                DOWNLOAD_CHANNEL_ID,
                DOWNLOAD_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows live progress during media extraction and conversion"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }
}

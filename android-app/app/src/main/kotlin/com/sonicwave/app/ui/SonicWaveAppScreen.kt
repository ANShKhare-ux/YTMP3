package com.sonicwave.app.ui

import android.content.ClipDescription
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Environment
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.ContentPaste
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sonicwave.app.engine.ConversionEngine
import com.sonicwave.app.engine.JobStatus
import kotlinx.coroutines.launch
import java.io.File

// Spotify Design Palette
val SpotifyGreen = Color(0xFF1ED760)
val DarkBackground = Color(0xFF121212)
val SurfaceDark = Color(0xFF181818)
val SurfaceLight = Color(0xFF242424)
val HairlineBorder = Color(0xFF282828)
val TextPrimary = Color(0xFFFFFFFF)
val TextSecondary = Color(0xFFB3B3B3)
val AccentLavender = Color(0xFF828FFF)

@Composable
fun SonicWaveAppScreen(initialUrl: String = "") {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val focusManager = LocalFocusManager.current

    var urlInput by remember { mutableStateOf(initialUrl) }
    var selectedFormat by remember { mutableStateOf("mp3") }
    var selectedQuality by remember { mutableStateOf("320") }

    val currentJob by ConversionEngine.currentJob.collectAsState()

    LaunchedEffect(initialUrl) {
        if (initialUrl.isNotBlank()) {
            urlInput = initialUrl
        }
    }

    val animatedProgress by animateFloatAsState(
        targetValue = (currentJob?.progress ?: 0f) / 100f,
        animationSpec = tween(durationMillis = 300, easing = FastOutSlowInEasing),
        label = "progress"
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(16.dp))

        // Brand Crest & Header
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color(0xFF0F1011))
                    .border(1.dp, HairlineBorder, RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.MusicNote,
                    contentDescription = null,
                    tint = AccentLavender,
                    modifier = Modifier.size(20.dp)
                )
            }
            Spacer(modifier = Modifier.width(10.dp))
            Text(
                text = "SonicWave",
                color = TextPrimary,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = (-0.5).sp
            )
        }

        Spacer(modifier = Modifier.height(6.dp))

        // Status Pill
        Box(
            modifier = Modifier
                .clip(CircleShape)
                .background(Color(0x1A1ED760))
                .border(1.dp, Color(0x331ED760), CircleShape)
                .padding(horizontal = 10.dp, vertical = 4.dp)
        ) {
            Text(
                text = "ON-DEVICE ENGINE • 16-STREAM TURBO • AD-FREE",
                color = SpotifyGreen,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.5.sp
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Input Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(16.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, HairlineBorder)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Media URL",
                    color = TextSecondary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = urlInput,
                    onValueChange = { urlInput = it },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = {
                        Text(
                            "Paste YouTube, Instagram, TikTok, SoundCloud URL...",
                            color = Color(0xFF666666),
                            fontSize = 13.sp
                        )
                    },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Link,
                            contentDescription = null,
                            tint = SpotifyGreen
                        )
                    },
                    trailingIcon = {
                        Row {
                            if (urlInput.isNotBlank()) {
                                IconButton(onClick = { urlInput = "" }) {
                                    Icon(
                                        imageVector = Icons.Default.Clear,
                                        contentDescription = "Clear",
                                        tint = TextSecondary,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                            IconButton(onClick = {
                                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                if (clipboard.hasPrimaryClip() && clipboard.primaryClipDescription?.hasMimeType(ClipDescription.MIMETYPE_TEXT_PLAIN) == true) {
                                    val item = clipboard.primaryClip?.getItemAt(0)
                                    val pasteData = item?.text?.toString() ?: ""
                                    if (pasteData.isNotBlank()) {
                                        urlInput = pasteData
                                    }
                                }
                            }) {
                                Icon(
                                    imageVector = Icons.Default.ContentPaste,
                                    contentDescription = "Paste from clipboard",
                                    tint = AccentLavender,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = SpotifyGreen,
                        unfocusedBorderColor = HairlineBorder,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                        cursorColor = SpotifyGreen
                    ),
                    shape = RoundedCornerShape(10.dp),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Uri,
                        imeAction = ImeAction.Done
                    ),
                    keyboardActions = KeyboardActions(onDone = { focusManager.clearFocus() })
                )
            }
        }

        Spacer(modifier = Modifier.height(18.dp))

        // Format Selector
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(16.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, HairlineBorder)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Audio Formats (HQ Extraction)",
                    color = TextSecondary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FormatChip(
                        label = "MP3 (320k)",
                        isSelected = selectedFormat == "mp3" && selectedQuality == "320",
                        onClick = { selectedFormat = "mp3"; selectedQuality = "320" }
                    )
                    FormatChip(
                        label = "MP3 (256k)",
                        isSelected = selectedFormat == "mp3" && selectedQuality == "256",
                        onClick = { selectedFormat = "mp3"; selectedQuality = "256" }
                    )
                    FormatChip(
                        label = "M4A (AAC)",
                        isSelected = selectedFormat == "m4a",
                        onClick = { selectedFormat = "m4a"; selectedQuality = "best" }
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FormatChip(
                        label = "FLAC Lossless",
                        isSelected = selectedFormat == "flac",
                        onClick = { selectedFormat = "flac"; selectedQuality = "best" }
                    )
                    FormatChip(
                        label = "WAV PCM",
                        isSelected = selectedFormat == "wav",
                        onClick = { selectedFormat = "wav"; selectedQuality = "best" }
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = "Video Formats (1080p Muxing)",
                    color = TextSecondary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FormatChip(
                        label = "MP4 (1080p HD)",
                        isSelected = selectedFormat == "mp4" && selectedQuality == "1080",
                        icon = Icons.Default.Videocam,
                        onClick = { selectedFormat = "mp4"; selectedQuality = "1080" }
                    )
                    FormatChip(
                        label = "MP4 (720p)",
                        isSelected = selectedFormat == "mp4" && selectedQuality == "720",
                        icon = Icons.Default.Videocam,
                        onClick = { selectedFormat = "mp4"; selectedQuality = "720" }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Convert Button
        val isConverting = currentJob?.status == JobStatus.DOWNLOADING ||
                           currentJob?.status == JobStatus.RESOLVING ||
                           currentJob?.status == JobStatus.PROCESSING

        Button(
            onClick = {
                if (urlInput.isBlank()) {
                    Toast.makeText(context, "Please enter or paste a media link", Toast.LENGTH_SHORT).show()
                    return@Button
                }
                focusManager.clearFocus()
                scope.launch {
                    ConversionEngine.startConversion(
                        context = context,
                        url = urlInput.trim(),
                        format = selectedFormat,
                        quality = selectedQuality
                    )
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = if (isConverting) SurfaceLight else SpotifyGreen,
                contentColor = if (isConverting) TextSecondary else Color.Black
            ),
            shape = RoundedCornerShape(26.dp),
            enabled = !isConverting
        ) {
            if (isConverting) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = SpotifyGreen,
                    strokeWidth = 2.dp
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = if (currentJob?.status == JobStatus.PROCESSING) "Encoding Audio..." else "Downloading On-Device...",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold
                )
            } else {
                Icon(
                    imageVector = Icons.Default.Download,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Convert & Save to Phone",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // Live Progress Card
        AnimatedVisibility(visible = currentJob != null && currentJob?.status != JobStatus.IDLE) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 18.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, HairlineBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = when (currentJob?.status) {
                                JobStatus.RESOLVING -> "Resolving stream definitions..."
                                JobStatus.DOWNLOADING -> "Downloading (16-stream parallel)"
                                JobStatus.PROCESSING -> "Muxing & applying ID3 artwork..."
                                JobStatus.COMPLETED -> "Downloaded & Saved!"
                                JobStatus.FAILED -> "Conversion Failed"
                                else -> "Processing..."
                            },
                            color = when (currentJob?.status) {
                                JobStatus.COMPLETED -> SpotifyGreen
                                JobStatus.FAILED -> Color(0xFFEF4444)
                                else -> AccentLavender
                            },
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )

                        Text(
                            text = "${(currentJob?.progress ?: 0f).toInt()}%",
                            color = TextPrimary,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    LinearProgressIndicator(
                        progress = { animatedProgress },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(6.dp)
                            .clip(CircleShape),
                        color = SpotifyGreen,
                        trackColor = Color(0xFF333333)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    if (currentJob?.status == JobStatus.COMPLETED) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0x1A1ED760))
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.Folder,
                                contentDescription = null,
                                tint = SpotifyGreen,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = "Saved in Downloads/SonicWave",
                                    color = TextPrimary,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = "Ready to play in Spotify, Samsung Music & Files",
                                    color = TextSecondary,
                                    fontSize = 11.sp
                                )
                            }
                        }
                    } else if (currentJob?.status == JobStatus.FAILED) {
                        Text(
                            text = currentJob?.errorMessage ?: "An error occurred during extraction",
                            color = Color(0xFFEF4444),
                            fontSize = 12.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(30.dp))

        // Feature Highlights
        Text(
            text = "Supported: YouTube • Instagram Reels • TikTok • SoundCloud • Twitter/X",
            color = Color(0xFF777777),
            fontSize = 11.sp,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "100% executes locally on phone hardware with embedded yt-dlp & FFmpeg",
            color = Color(0xFF555555),
            fontSize = 10.sp,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
fun FormatChip(
    label: String,
    isSelected: Boolean,
    icon: androidx.compose.ui.graphics.vector.ImageVector? = null,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(if (isSelected) SpotifyGreen else SurfaceLight)
            .border(
                width = 1.dp,
                color = if (isSelected) SpotifyGreen else HairlineBorder,
                shape = RoundedCornerShape(8.dp)
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 8.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (icon != null) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = if (isSelected) Color.Black else TextSecondary,
                    modifier = Modifier.size(13.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
            }
            Text(
                text = label,
                color = if (isSelected) Color.Black else TextPrimary,
                fontSize = 12.sp,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
            )
        }
    }
}

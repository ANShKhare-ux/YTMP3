package com.sonicwave.app.ui

import android.content.ClipDescription
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
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
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.automirrored.filled.VolumeOff
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.ContentPaste
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material.icons.filled.VolumeOff
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
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
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
import androidx.core.content.FileProvider
import coil.compose.AsyncImage
import com.sonicwave.app.engine.ConversionEngine
import com.sonicwave.app.engine.JobStatus
import com.sonicwave.app.engine.ResolvedMedia
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
val WarningYellow = Color(0xFFEAB308)

@Composable
fun SonicWaveAppScreen(initialUrl: String = "") {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val focusManager = LocalFocusManager.current

    var urlInput by remember { mutableStateOf(initialUrl) }
    var resolvedMedia by remember { mutableStateOf<ResolvedMedia?>(null) }
    var isResolving by remember { mutableStateOf(false) }
    var activeSlideIndex by remember { mutableIntStateOf(0) }

    var selectedFormat by remember { mutableStateOf("mp3") }
    var selectedQuality by remember { mutableStateOf("320") }

    val currentJob by ConversionEngine.currentJob.collectAsState()

    // Trigger metadata resolution
    fun triggerResolve(targetUrl: String) {
        val trimmed = targetUrl.trim()
        if (trimmed.isBlank()) return
        focusManager.clearFocus()
        isResolving = true
        scope.launch {
            val result = ConversionEngine.resolveMedia(context, trimmed)
            isResolving = false
            result.onSuccess { media ->
                resolvedMedia = media
                activeSlideIndex = 0
                if (media.isPhoto) {
                    selectedFormat = if (media.isCarousel) "zip" else "jpg"
                    selectedQuality = "original"
                } else if (!media.hasAudio) {
                    selectedFormat = "mp4"
                    selectedQuality = "1080"
                }
            }.onFailure {
                Toast.makeText(context, "Could not fetch details: ${it.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    LaunchedEffect(initialUrl) {
        if (initialUrl.isNotBlank()) {
            urlInput = initialUrl
            triggerResolve(initialUrl)
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
            .padding(horizontal = 16.dp, vertical = 20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(12.dp))

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
                    tint = SpotifyGreen,
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
                text = "ON-DEVICE ENGINE • PHOTO & CAROUSEL READY • 16X TURBO",
                color = SpotifyGreen,
                fontSize = 9.5.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.5.sp
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Input Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(16.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, HairlineBorder)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(
                    text = "Social Media / Video URL",
                    color = TextSecondary,
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = urlInput,
                    onValueChange = {
                        urlInput = it
                        if (it.isBlank()) resolvedMedia = null
                    },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = {
                        Text(
                            "Paste Instagram, YouTube, TikTok, Reddit, X link...",
                            color = Color(0xFF666666),
                            fontSize = 12.5.sp
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
                                IconButton(onClick = {
                                    urlInput = ""
                                    resolvedMedia = null
                                }) {
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
                                        triggerResolve(pasteData)
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
                    keyboardActions = KeyboardActions(onDone = {
                        triggerResolve(urlInput)
                    })
                )

                Spacer(modifier = Modifier.height(10.dp))

                // Analyze / Preview Action Button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    Button(
                        onClick = { triggerResolve(urlInput) },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = SurfaceLight,
                            contentColor = TextPrimary
                        ),
                        shape = RoundedCornerShape(8.dp),
                        enabled = !isResolving && urlInput.isNotBlank()
                    ) {
                        if (isResolving) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(14.dp),
                                color = SpotifyGreen,
                                strokeWidth = 1.5.dp
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Analyzing Post...", fontSize = 11.5.sp)
                        } else {
                            Icon(Icons.Default.Search, contentDescription = null, modifier = Modifier.size(14.dp), tint = SpotifyGreen)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Inspect & Preview Media", fontSize = 11.5.sp)
                        }
                    }
                }
            }
        }

        // =========================================================================
        // INTERACTIVE MEDIA PREVIEW & CAROUSEL VIEWER
        // =========================================================================
        if (resolvedMedia != null) {
            val media = resolvedMedia!!
            val photos = media.photos
            val isCarousel = media.isCarousel && photos.size > 1
            val safeIdx = if (activeSlideIndex in photos.indices) activeSlideIndex else 0

            Spacer(modifier = Modifier.height(16.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, HairlineBorder)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    // Header Badges
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(Color(0x331ED760))
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = media.platform.uppercase(),
                                    color = SpotifyGreen,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            if (media.isCarousel) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(Color(0x26C084FC))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = "CAROUSEL (${photos.size} PHOTOS)",
                                        color = Color(0xFFC084FC),
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            } else if (media.isPhoto) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(Color(0x2660A5FA))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = "PHOTO",
                                        color = Color(0xFF60A5FA),
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }

                        if (!media.hasAudio) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.AutoMirrored.Filled.VolumeOff, contentDescription = null, tint = WarningYellow, modifier = Modifier.size(13.dp))
                                Spacer(modifier = Modifier.width(3.dp))
                                Text("Silent Post", color = WarningYellow, fontSize = 10.5.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = media.title,
                        color = TextPrimary,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = "By ${media.uploader}",
                        color = TextSecondary,
                        fontSize = 12.sp
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // =========================================================================
                    // CAROUSEL VIEWER (Multi-photo slider + filmstrip)
                    // =========================================================================
                    if (isCarousel) {
                        val currentSlideUrl = photos.getOrNull(safeIdx)?.url ?: media.thumbnail

                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(260.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color.Black),
                            contentAlignment = Alignment.Center
                        ) {
                            AsyncImage(
                                model = currentSlideUrl,
                                contentDescription = "Slide ${safeIdx + 1}",
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Fit
                            )

                            // Previous Arrow Button
                            if (safeIdx > 0) {
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.CenterStart)
                                        .padding(start = 8.dp)
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xCC000000))
                                        .clickable { activeSlideIndex = safeIdx - 1 },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.ChevronLeft,
                                        contentDescription = "Previous",
                                        tint = Color.White,
                                        modifier = Modifier.size(24.dp)
                                    )
                                }
                            }

                            // Next Arrow Button
                            if (safeIdx < photos.size - 1) {
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.CenterEnd)
                                        .padding(end = 8.dp)
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xCC000000))
                                        .clickable { activeSlideIndex = safeIdx + 1 },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.ChevronRight,
                                        contentDescription = "Next",
                                        tint = Color.White,
                                        modifier = Modifier.size(24.dp)
                                    )
                                }
                            }

                            // Top-Right Slide Counter Pill
                            Box(
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(8.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xB3000000))
                                    .border(1.dp, Color(0x33FFFFFF), CircleShape)
                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Text(
                                    text = "📸 Slide ${safeIdx + 1} of ${photos.size}",
                                    color = Color.White,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // Horizontal Thumbnail Filmstrip
                        Text(
                            text = "Tap slide to view or download directly:",
                            color = TextSecondary,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(modifier = Modifier.height(6.dp))

                        LazyRow(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            itemsIndexed(photos) { idx, slide ->
                                val isSelected = idx == safeIdx
                                Box(
                                    modifier = Modifier
                                        .size(64.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color(0xFF111111))
                                        .border(
                                            width = if (isSelected) 2.dp else 1.dp,
                                            color = if (isSelected) SpotifyGreen else HairlineBorder,
                                            shape = RoundedCornerShape(8.dp)
                                        )
                                        .clickable {
                                            activeSlideIndex = idx
                                            if (selectedFormat != "zip") selectedFormat = "jpg"
                                        }
                                ) {
                                    AsyncImage(
                                        model = slide.url,
                                        contentDescription = "Thumb ${idx + 1}",
                                        modifier = Modifier.fillMaxSize(),
                                        contentScale = ContentScale.Crop
                                    )

                                    // Slide Number Badge
                                    Box(
                                        modifier = Modifier
                                            .align(Alignment.TopStart)
                                            .background(Color(0xB3000000))
                                            .padding(horizontal = 4.dp, vertical = 1.dp)
                                    ) {
                                        Text("#${idx + 1}", color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                    }

                                    // 1-Tap Download Icon
                                    Box(
                                        modifier = Modifier
                                            .align(Alignment.BottomEnd)
                                            .size(22.dp)
                                            .background(Color(0xB3000000))
                                            .clickable {
                                                activeSlideIndex = idx
                                                selectedFormat = "jpg"
                                                scope.launch {
                                                    ConversionEngine.startConversion(
                                                        context = context,
                                                        url = media.url,
                                                        format = "jpg",
                                                        quality = "original",
                                                        resolvedMedia = media,
                                                        selectedSlideIndex = idx
                                                    )
                                                }
                                            },
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(Icons.Default.Download, contentDescription = "Download Slide", tint = SpotifyGreen, modifier = Modifier.size(13.dp))
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // Quick 1-Tap Action Pills for Carousel
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = {
                                    selectedFormat = "jpg"
                                    scope.launch {
                                        ConversionEngine.startConversion(
                                            context = context,
                                            url = media.url,
                                            format = "jpg",
                                            quality = "original",
                                            resolvedMedia = media,
                                            selectedSlideIndex = safeIdx
                                        )
                                    }
                                },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = SurfaceLight),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(13.dp), tint = SpotifyGreen)
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Slide #${safeIdx + 1} (.JPG)", fontSize = 11.5.sp, maxLines = 1)
                            }

                            Button(
                                onClick = {
                                    selectedFormat = "zip"
                                    scope.launch {
                                        ConversionEngine.startConversion(
                                            context = context,
                                            url = media.url,
                                            format = "zip",
                                            quality = "original",
                                            resolvedMedia = media
                                        )
                                    }
                                },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = SurfaceLight),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Icon(Icons.Default.PhotoLibrary, contentDescription = null, modifier = Modifier.size(13.dp), tint = Color(0xFFC084FC))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("All (${photos.size} .ZIP)", fontSize = 11.5.sp, maxLines = 1)
                            }
                        }
                    } else if (media.thumbnail.isNotBlank()) {
                        // Single Photo / Video Preview Thumbnail
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(180.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color.Black),
                            contentAlignment = Alignment.Center
                        ) {
                            AsyncImage(
                                model = media.thumbnail,
                                contentDescription = media.title,
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )

                            if (media.durationFormatted.isNotBlank()) {
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.BottomEnd)
                                        .padding(8.dp)
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(Color(0xCC000000))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = media.durationFormatted,
                                        color = Color.White,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(18.dp))

        // =========================================================================
        // FORMAT SELECTOR
        // =========================================================================
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(16.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, HairlineBorder)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                // If it's a photo/carousel post, show Photo Options first!
                if (resolvedMedia?.isPhoto == true) {
                    val count = resolvedMedia?.photos?.size ?: 1
                    Text(
                        text = "Photo & Carousel Options",
                        color = TextSecondary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        if (count > 1) {
                            FormatChip(
                                label = "All ($count Photos .ZIP)",
                                isSelected = selectedFormat == "zip",
                                icon = Icons.Default.PhotoLibrary,
                                onClick = { selectedFormat = "zip"; selectedQuality = "original" }
                            )
                        }
                        FormatChip(
                            label = if (count > 1) "Slide #${activeSlideIndex + 1} (.JPG)" else "Full Photo (.JPG)",
                            isSelected = selectedFormat == "jpg",
                            icon = Icons.Default.Image,
                            onClick = { selectedFormat = "jpg"; selectedQuality = "original" }
                        )
                        FormatChip(
                            label = if (count > 1) "Slide #${activeSlideIndex + 1} (.PNG)" else "Lossless (.PNG)",
                            isSelected = selectedFormat == "png",
                            icon = Icons.Default.Image,
                            onClick = { selectedFormat = "png"; selectedQuality = "original" }
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))
                }

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

        // =========================================================================
        // MAIN CONVERT & DOWNLOAD BUTTON
        // =========================================================================
        val isConverting = currentJob?.status == JobStatus.DOWNLOADING ||
                currentJob?.status == JobStatus.RESOLVING ||
                currentJob?.status == JobStatus.PROCESSING

        val buttonText = when {
            isConverting -> if (currentJob?.status == JobStatus.PROCESSING) "Finalizing..." else "Downloading On-Device..."
            selectedFormat == "zip" -> "DOWNLOAD ALL PHOTOS (.ZIP)"
            selectedFormat == "jpg" || selectedFormat == "png" -> {
                val count = resolvedMedia?.photos?.size ?: 1
                if (count > 1) "DOWNLOAD SLIDE #${activeSlideIndex + 1} (${selectedFormat.uppercase()})"
                else "DOWNLOAD PHOTO (${selectedFormat.uppercase()})"
            }
            selectedFormat == "mp4" -> "DOWNLOAD MP4 VIDEO (${selectedQuality}p)"
            else -> "CONVERT TO ${selectedFormat.uppercase()} (${selectedQuality}k)"
        }

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
                        quality = selectedQuality,
                        resolvedMedia = resolvedMedia,
                        selectedSlideIndex = activeSlideIndex
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
                    text = buttonText,
                    fontSize = 14.5.sp,
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
                    text = buttonText,
                    fontSize = 14.5.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // =========================================================================
        // LIVE PROGRESS & SUCCESS CARD
        // =========================================================================
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
                                JobStatus.RESOLVING -> "Resolving streams & media..."
                                JobStatus.DOWNLOADING -> "Downloading (16-stream acceleration)"
                                JobStatus.PROCESSING -> "Encoding & writing metadata..."
                                JobStatus.COMPLETED -> "Downloaded & Saved!"
                                JobStatus.FAILED -> "Download Failed"
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
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0x1A1ED760))
                                .padding(12.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
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
                                        text = "Visible in Gallery, Files, and Music Players",
                                        color = TextSecondary,
                                        fontSize = 11.sp
                                    )
                                }
                            }

                            // Open & Share Action Buttons
                            val outPath = currentJob?.outputPath ?: ""
                            if (outPath.isNotBlank()) {
                                val outFile = File(outPath)
                                if (outFile.exists()) {
                                    Spacer(modifier = Modifier.height(10.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Button(
                                            onClick = {
                                                try {
                                                    val uri = FileProvider.getUriForFile(
                                                        context,
                                                        "${context.packageName}.fileprovider",
                                                        outFile
                                                    )
                                                    val mime = when {
                                                        outFile.name.endsWith(".mp3") -> "audio/mpeg"
                                                        outFile.name.endsWith(".m4a") -> "audio/mp4"
                                                        outFile.name.endsWith(".wav") -> "audio/x-wav"
                                                        outFile.name.endsWith(".flac") -> "audio/flac"
                                                        outFile.name.endsWith(".mp4") -> "video/mp4"
                                                        outFile.name.endsWith(".zip") -> "application/zip"
                                                        outFile.name.endsWith(".png") -> "image/png"
                                                        else -> "image/jpeg"
                                                    }
                                                    val intent = Intent(Intent.ACTION_VIEW).apply {
                                                        setDataAndType(uri, mime)
                                                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                                    }
                                                    context.startActivity(Intent.createChooser(intent, "Open with"))
                                                } catch (e: Exception) {
                                                    Toast.makeText(context, "Could not open file: ${e.message}", Toast.LENGTH_SHORT).show()
                                                }
                                            },
                                            modifier = Modifier.weight(1f),
                                            colors = ButtonDefaults.buttonColors(containerColor = SurfaceLight),
                                            shape = RoundedCornerShape(8.dp)
                                        ) {
                                            Icon(Icons.AutoMirrored.Filled.OpenInNew, contentDescription = null, modifier = Modifier.size(13.dp), tint = SpotifyGreen)
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text("Open", fontSize = 12.sp)
                                        }

                                        Button(
                                            onClick = {
                                                try {
                                                    val uri = FileProvider.getUriForFile(
                                                        context,
                                                        "${context.packageName}.fileprovider",
                                                        outFile
                                                    )
                                                    val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                                        putExtra(Intent.EXTRA_STREAM, uri)
                                                        type = "*/*"
                                                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                                    }
                                                    context.startActivity(Intent.createChooser(shareIntent, "Share file"))
                                                } catch (e: Exception) {
                                                    Toast.makeText(context, "Could not share: ${e.message}", Toast.LENGTH_SHORT).show()
                                                }
                                            },
                                            modifier = Modifier.weight(1f),
                                            colors = ButtonDefaults.buttonColors(containerColor = SurfaceLight),
                                            shape = RoundedCornerShape(8.dp)
                                        ) {
                                            Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(13.dp), tint = AccentLavender)
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text("Share", fontSize = 12.sp)
                                        }
                                    }
                                }
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
            text = "Supported: Instagram (Posts, Reels & Carousels) • YouTube • TikTok • SoundCloud • Reddit • Twitter/X",
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
            .padding(horizontal = 10.dp, vertical = 7.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (icon != null) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = if (isSelected) Color.Black else TextSecondary,
                    modifier = Modifier.size(12.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
            }
            Text(
                text = label,
                color = if (isSelected) Color.Black else TextPrimary,
                fontSize = 11.5.sp,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
            )
        }
    }
}

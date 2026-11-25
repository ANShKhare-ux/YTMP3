package com.sonicwave.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.sonicwave.app.ui.SonicWaveAppScreen
import com.sonicwave.app.ui.theme.SonicWaveTheme

class MainActivity : ComponentActivity() {

    private val sharedUrl = mutableStateOf("")

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleShareIntent(intent)

        enableEdgeToEdge()
        setContent {
            SonicWaveTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFF121212)
                ) {
                    SonicWaveAppScreen(initialUrl = sharedUrl.value)
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleShareIntent(intent)
    }

    private fun handleShareIntent(intent: Intent?) {
        if (intent?.action == Intent.ACTION_SEND && intent.type == "text/plain") {
            val text = intent.getStringExtra(Intent.EXTRA_TEXT)
            if (!text.isNullOrBlank()) {
                val urlRegex = """https?://[^\s]+""".toRegex()
                val match = urlRegex.find(text)?.value ?: text.trim()
                sharedUrl.value = match
            }
        }
    }
}

# Pricing — SonicWave

> Official structured pricing and license specifications for SonicWave media downloader and offline player.

## Free (Full Open-Source License)
- **Price**: $0.00 USD / month (Free & Open Source under MIT License)
- **Billing**: None. No subscriptions, no credit card required, no in-app purchases.
- **Conversion Limits**: Unlimited conversions. Zero daily quotas or file duration limits.
- **Speed Limits**: Unlimited. Up to 16-stream parallel download acceleration.
- **File Size Limits**: None. Constrained only by available local disk space.
- **Platform**: Windows 10, Windows 11 (64-bit portable package · 1.3 MB).

### Included Capabilities & Specifications
- **Audio Output Codecs**: 
  - MP3 (320 kbps, 256 kbps, 192 kbps, 128 kbps CBR/VBR via FFmpeg `libmp3lame`)
  - AAC / M4A (Lossless stream copy with zero generation loss)
  - FLAC (Lossless compression up to 24-bit / 48kHz)
  - WAV (Uncompressed PCM studio audio)
- **Video Output Codecs**: 
  - MP4 in 1080p Full HD, 720p HD, and 480p SD with stereo AAC/MP3 multiplexing
- **Engine Acceleration**: 16 concurrent TCP download streams (`-N 16`) with 16MB buffer caching.
- **Privacy & Telemetry**: 100% offline local execution. Zero cloud tracking, zero analytics telemetry, and zero advertisements or malicious pop-ups.
- **Metadata Tagging**: Automated ID3v2.4 metadata injection including song title, artist/uploader name, and high-resolution album cover artwork.
- **Media Player**: Integrated in-app audition player with HTTP 206 byte-range seeking and real-time waveform visualization.
- **Maintenance**: 1-click upstream engine definitions updater via the `Ctrl+K` command palette.

## Comparison: SonicWave vs. Cloud Web Converters

| Specification | SonicWave (Local Engine) | Cloud Web Converters (e.g., Y2Mate, 320ytmp3) |
| :--- | :--- | :--- |
| **Price** | **$0.00 (100% Free)** | Often gated or subscription-prompted |
| **Advertisements** | **Zero ads or redirects** | Heavy pop-up ads, notification spam, fake download buttons |
| **Audio Quality** | **True 320 kbps CBR/VBR & Lossless FLAC** | Faux 320k (re-compressed from 128 kbps streams) |
| **Download Speed** | **Up to 45 MB/s (16 parallel threads)** | Throttled single-thread cloud queues |
| **Privacy** | **100% Private (Runs locally on PC)** | URLs and IP addresses logged on remote proxy servers |
| **Duration Limit** | **Unlimited (Multi-hour mixes, DJ sets)** | Capped at 15–30 minutes per conversion |
| **Batch Upgrades** | **1-Click upstream yt-dlp updater** | Broken whenever YouTube updates player code |

## Canonical Links
- Official Website: https://ytmp-3-five.vercel.app/
- Windows Package (1.3 MB): https://ytmp-3-five.vercel.app/SonicWave-v1.0.0-Windows.zip
- Documentation: https://ytmp-3-five.vercel.app/supported-platforms
- Source Code & Issues: https://github.com/ytmp3-converter/sonicwave

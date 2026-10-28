import React from 'react';
import DocsLayout from './DocsLayout';
import { useDocumentMetadata } from '../legal/useDocumentMetadata';
import {
  Music2,
  Video,
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Terminal,
  RefreshCw
} from 'lucide-react';

export default function SupportedPlatforms({ onNavigate }) {
  useDocumentMetadata({
    title: 'Supported Platforms & Media Formats — SonicWave Audio & Video Specs',
    description: 'Comprehensive guide to supported platforms (YouTube, SoundCloud, TikTok, Instagram, and 1,000+ sources), 320 kbps MP3, FLAC, WAV, AAC, and 1080p MP4 specs in SonicWave.',
    canonical: 'https://ytmp-3-five.vercel.app/supported-platforms'
  });

  return (
    <DocsLayout activeTab="platforms" onNavigate={onNavigate}>
      {/* Page Header */}
      <div className="legal-header-block">
        <div className="legal-eyebrow-tag">CODEC MATRIX &bull; SPECIFICATIONS &bull; PLATFORMS</div>
        <h1 className="legal-page-h1">Supported Platforms &amp; Format Specifications</h1>
        <p className="legal-effective-date">
          Technical Reference for SonicWave v1.0.0 &bull; Local FFmpeg 6.1.1 &amp; yt-dlp Engine
        </p>
      </div>

      {/* Summary Callout Card */}
      <div className="legal-callout-card">
        <h2 className="legal-callout-title">Architectural Summary: Lossless Extraction &amp; Local Multiplexing</h2>
        <p className="legal-callout-text">
          SonicWave bypasses cloud server bottlenecks by running the media extraction and transcode pipeline locally on your machine. All audio encoding is performed by an embedded FFmpeg binary utilizing <code>libmp3lame</code>, <code>flac</code>, and native stream copy demuxers.
        </p>
        <ul className="legal-summary-points">
          <li><strong>Audio formats:</strong> MP3 (128k to 320k CBR/VBR), AAC (M4A stream copy), Lossless FLAC, and Uncompressed WAV.</li>
          <li><strong>Video formats:</strong> MP4 in 1080p Full HD, 720p HD, and 480p SD with stereo AAC/MP3 multiplexing.</li>
          <li><strong>ID3 Metadata:</strong> Automated embedding of track title, artist name, and high-resolution album cover art.</li>
          <li><strong>Platform coverage:</strong> Over 1,000 websites supported via modular upstream extraction rules.</li>
        </ul>
      </div>

      {/* Section 1: Audio Formats Matrix */}
      <section className="legal-section">
        <h2>1. Audio Codec &amp; Bitrate Specifications</h2>
        <p>
          SonicWave provides four dedicated audio conversion profiles to balance between universal hardware compatibility, processing speed, and acoustic fidelity:
        </p>

        <div style={{ overflowX: 'auto', margin: '20px 0' }}>
          <table className="legal-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--cursor-hairline-strong)', color: 'var(--cursor-ink)' }}>
                <th style={{ padding: '12px 14px' }}>Format</th>
                <th style={{ padding: '12px 14px' }}>Bitrate Options</th>
                <th style={{ padding: '12px 14px' }}>Encoding Method</th>
                <th style={{ padding: '12px 14px' }}>Metadata &amp; Cover Art</th>
                <th style={{ padding: '12px 14px' }}>Best For</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--cursor-hairline)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--cursor-ink)' }}>MP3 (.mp3)</td>
                <td style={{ padding: '12px 14px' }}>320k, 256k, 192k, 128k</td>
                <td style={{ padding: '12px 14px' }}>FFmpeg <code>libmp3lame</code> (CBR/VBR)</td>
                <td style={{ padding: '12px 14px', color: 'var(--cursor-semantic-success)' }}>ID3v2.4 + High-Res Cover</td>
                <td style={{ padding: '12px 14px' }}>Universal playback on car stereos, MP3 players, and mobile apps.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--cursor-hairline)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--cursor-ink)' }}>M4A / AAC (.m4a)</td>
                <td style={{ padding: '12px 14px' }}>Source Native (~128k - 256k)</td>
                <td style={{ padding: '12px 14px' }}>Direct Stream Copy (0% recompression loss)</td>
                <td style={{ padding: '12px 14px', color: 'var(--cursor-semantic-success)' }}>MPEG-4 Metadata + Artwork</td>
                <td style={{ padding: '12px 14px' }}>Apple Music, iOS, iTunes, and instant near-zero conversion time.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--cursor-hairline)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--cursor-ink)' }}>FLAC (.flac)</td>
                <td style={{ padding: '12px 14px' }}>Variable (Lossless compression)</td>
                <td style={{ padding: '12px 14px' }}>FFmpeg <code>flac</code> encoder</td>
                <td style={{ padding: '12px 14px', color: 'var(--cursor-semantic-success)' }}>Vorbis Comments + Cover Art</td>
                <td style={{ padding: '12px 14px' }}>Archival storage, audiophile playback, and DAW editing.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--cursor-hairline)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--cursor-ink)' }}>WAV (.wav)</td>
                <td style={{ padding: '12px 14px' }}>1411 kbps (16-bit / 44.1 kHz)</td>
                <td style={{ padding: '12px 14px' }}>Uncompressed Linear PCM (<code>pcm_s16le</code>)</td>
                <td style={{ padding: '12px 14px', color: 'var(--cursor-ink-subtle)' }}>RIFF INFO Tags (Basic)</td>
                <td style={{ padding: '12px 14px' }}>DJ mixing, Ableton/FL Studio production, sound editing.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 2: Video Formats Matrix */}
      <section className="legal-section">
        <h2>2. Video Demuxing &amp; Multiplexing Specifications</h2>
        <p>
          Unlike simple downloaders that grab low-quality 720p streams with embedded low-bitrate audio, SonicWave uses local FFmpeg to independently pull the highest available video stream and the highest available audio stream, seamlessly multiplexing them into a clean container:
        </p>

        <div className="legal-grid-two">
          <div className="legal-card-box">
            <div className="legal-card-icon-title">
              <Video size={18} className="legal-card-icon" />
              <h3>1080p Full HD MP4</h3>
            </div>
            <p>
              Extracts 1920&times;1080 AVC/H.264 or VP9 video track, merges with highest bitrate audio stream into an MP4 container, and optimizes the file with the <code>faststart</code> flag for instant seeking.
            </p>
          </div>

          <div className="legal-card-box">
            <div className="legal-card-icon-title">
              <Video size={18} className="legal-card-icon" />
              <h3>720p HD &amp; 480p SD MP4</h3>
            </div>
            <p>
              Lightweight video options optimized for mobile storage, older laptops, and faster download speeds while retaining crisp stereo sound.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Supported Platforms */}
      <section className="legal-section">
        <h2>3. Platform Compatibility Matrix</h2>
        <p>
          SonicWave powers media extraction via a modular engine supporting over 1,000 domains. Here is the verified capability breakdown for the most widely used platforms:
        </p>

        <div style={{ overflowX: 'auto', margin: '20px 0' }}>
          <table className="legal-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--cursor-hairline-strong)', color: 'var(--cursor-ink)' }}>
                <th style={{ padding: '12px 14px' }}>Platform</th>
                <th style={{ padding: '12px 14px' }}>Content Types</th>
                <th style={{ padding: '12px 14px' }}>Audio Output</th>
                <th style={{ padding: '12px 14px' }}>Video Output</th>
                <th style={{ padding: '12px 14px' }}>Key Capabilities</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--cursor-hairline)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--cursor-ink)' }}>YouTube</td>
                <td style={{ padding: '12px 14px' }}>Videos, Shorts, Premieres, Music</td>
                <td style={{ padding: '12px 14px' }}>MP3 (up to 320k), M4A, FLAC, WAV</td>
                <td style={{ padding: '12px 14px' }}>MP4 (1080p, 720p, 480p)</td>
                <td style={{ padding: '12px 14px' }}>16-stream parallel acceleration, automated thumbnail artwork.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--cursor-hairline)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--cursor-ink)' }}>SoundCloud</td>
                <td style={{ padding: '12px 14px' }}>Tracks, DJ Sets, Podcasts</td>
                <td style={{ padding: '12px 14px' }}>MP3 (320k, 256k), M4A, WAV</td>
                <td style={{ padding: '12px 14px' }}>Audio Only</td>
                <td style={{ padding: '12px 14px' }}>Full waveform preview, uploader tagging, album art injection.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--cursor-hairline)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--cursor-ink)' }}>Instagram</td>
                <td style={{ padding: '12px 14px' }}>Reels, Public Video Posts</td>
                <td style={{ padding: '12px 14px' }}>MP3, M4A</td>
                <td style={{ padding: '12px 14px' }}>MP4 HD</td>
                <td style={{ padding: '12px 14px' }}>Clean video demuxing without watermark compression.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--cursor-hairline)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--cursor-ink)' }}>TikTok</td>
                <td style={{ padding: '12px 14px' }}>Public Video Clips, Sounds</td>
                <td style={{ padding: '12px 14px' }}>MP3 (Original Audio)</td>
                <td style={{ padding: '12px 14px' }}>MP4 Clean Video</td>
                <td style={{ padding: '12px 14px' }}>Audio stem isolation and high-resolution video stream copy.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--cursor-hairline)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--cursor-ink)' }}>Twitter / X</td>
                <td style={{ padding: '12px 14px' }}>Clips, Broadcasts, Spaces</td>
                <td style={{ padding: '12px 14px' }}>MP3, M4A</td>
                <td style={{ padding: '12px 14px' }}>MP4 HD</td>
                <td style={{ padding: '12px 14px' }}>Dynamic m3u8 playlist stream assembly into single file.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--cursor-hairline)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--cursor-ink)' }}>Reddit</td>
                <td style={{ padding: '12px 14px' }}>v.redd.it Hosted Media</td>
                <td style={{ padding: '12px 14px' }}>MP3, M4A</td>
                <td style={{ padding: '12px 14px' }}>MP4 Multiplex</td>
                <td style={{ padding: '12px 14px' }}>Solves Reddit&apos;s split DASH audio-video stream separation.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--cursor-hairline)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--cursor-ink)' }}>Other (1,000+)</td>
                <td style={{ padding: '12px 14px' }}>Bandcamp, Twitch, Vimeo, Bilibili</td>
                <td style={{ padding: '12px 14px' }}>All Supported Formats</td>
                <td style={{ padding: '12px 14px' }}>MP4</td>
                <td style={{ padding: '12px 14px' }}>Native upstream yt-dlp extractor support.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4: Transcoding vs Direct Stream Copy */}
      <section className="legal-section">
        <h2>4. Technical Deep-Dive: Transcoding vs. Stream Copy</h2>
        <p>
          We believe in complete transparency regarding digital audio quality:
        </p>
        <p>
          Most contemporary video streaming platforms store their source audio natively in lossy AAC or Opus containers (typically between 128 kbps and 160 kbps). When you select <strong>MP3 (320 kbps)</strong> in SonicWave, our embedded FFmpeg engine decodes the source stream and transcodes it into a pristine 320 kbps CBR MP3 file. This guarantees maximum bitrate allocation and prevents any additional compression degradation.
        </p>
        <p>
          However, transcoding cannot restore acoustic frequencies that were never present in the original broadcast. If your objective is <strong>100% bit-for-bit un-recompressed speed</strong>, choose <strong>M4A</strong> (which performs an instant direct stream copy in under 1 second) or <strong>FLAC</strong>.
        </p>
      </section>

      {/* Section 5: Upstream Engine Updates */}
      <section className="legal-section">
        <h2>5. 1-Click Engine Updates (Ctrl+K)</h2>
        <p>
          Streaming platforms regularly modify their player JavaScript, cipher algorithms, and token handshakes. When this occurs, conventional converters fail.
        </p>
        <p>
          SonicWave solves this with an integrated upstream updater:
        </p>
        <ol>
          <li>Press <code>Ctrl+K</code> (or <code>Cmd+K</code>) anywhere in the application to summon the Command Palette.</li>
          <li>Select <strong>&ldquo;Update Engine (yt-dlp)&rdquo;</strong>.</li>
          <li>SonicWave will pull the newest extraction definitions directly from the official upstream repository and hot-reload within seconds without requiring a reinstall.</li>
        </ol>
      </section>

      {/* Section 6: Lawful Archiving */}
      <section className="legal-section">
        <h2>6. Lawful Archiving &amp; Acceptable Use</h2>
        <p>
          SonicWave is engineered as an open-source tool for lawful personal archiving, educational research, offline backup of user-owned original content, and creative media analysis. Users must ensure that their media downloads comply with applicable copyright laws and platform terms of service. For complete details, review our <a href="/copyright-acceptable-use" onClick={(e) => { e.preventDefault(); onNavigate('copyright', '/copyright-acceptable-use'); }}>Copyright &amp; Acceptable Use Policy</a>.
        </p>
      </section>

      {/* Structured Data: TechArticle JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TechArticle",
          "headline": "SonicWave Supported Media Platforms and Format Specifications",
          "description": "Comprehensive specifications for audio bitrates (320 kbps MP3, FLAC, WAV, AAC), 1080p MP4 demuxing, and 1,000+ supported media sources in SonicWave.",
          "author": {
            "@type": "Organization",
            "name": "SonicWave Contributors"
          },
          "publisher": {
            "@type": "Organization",
            "name": "SonicWave",
            "url": "https://ytmp-3-five.vercel.app/"
          },
          "datePublished": "2026-10-28",
          "dateModified": "2026-10-28"
        })
      }} />
    </DocsLayout>
  );
}

import React from 'react';
import DocsLayout from './DocsLayout';
import { useDocumentMetadata } from '../legal/useDocumentMetadata';
import {
  AlertTriangle,
  Terminal,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  Server,
  Key
} from 'lucide-react';

export default function TroubleshootingGuide({ onNavigate }) {
  useDocumentMetadata({
    title: 'SonicWave Troubleshooting & Diagnostic Guide — Fix Common Issues',
    description: 'Diagnose and resolve common issues in SonicWave for Windows, including SmartScreen popups, extraction timeouts, bot detection errors, and FFmpeg binary checks.',
    canonical: 'https://ytmp-3-five.vercel.app/troubleshooting'
  });

  return (
    <DocsLayout activeTab="troubleshooting" onNavigate={onNavigate}>
      {/* Page Header */}
      <div className="legal-header-block">
        <div className="legal-eyebrow-tag">DIAGNOSTIC GUIDE &bull; ERROR RESOLUTION &bull; FAQ</div>
        <h1 className="legal-page-h1">SonicWave Troubleshooting Guide</h1>
        <p className="legal-effective-date">
          Diagnostic Procedures for SonicWave on Windows 10 &amp; 11 (64-Bit)
        </p>
      </div>

      {/* Summary Callout Card */}
      <div className="legal-callout-card">
        <h2 className="legal-callout-title">Fast Diagnostic Overview</h2>
        <p className="legal-callout-text">
          Because SonicWave operates 100% locally on your machine, you never have to deal with cloud queue lockouts, server downtime, or hidden conversion quotas. When an error occurs, it is almost always due to an outdated extraction rule or a Windows local permission prompt.
        </p>
        <ul className="legal-summary-points">
          <li><strong>Most common fix (90% of extraction issues):</strong> Update the upstream extraction engine via <code>Ctrl+K &rarr; Update Engine (yt-dlp)</code>.</li>
          <li><strong>Local execution logs:</strong> Inspect the live terminal console where <code>start.bat</code> is running for real-time error messages.</li>
          <li><strong>Direct support:</strong> If an issue persists, submit a report via our <a href="/contact" onClick={(e) => { e.preventDefault(); onNavigate('contact', '/contact'); }}>Support Channel</a> or GitHub Issues.</li>
        </ul>
      </div>

      {/* Issue 1: SmartScreen */}
      <section className="legal-section">
        <h2>1. &ldquo;Windows protected your PC&rdquo; (Microsoft Defender SmartScreen)</h2>
        <div className="legal-callout-card" style={{ borderLeftColor: '#3b82f6', background: 'rgba(59, 130, 246, 0.06)' }}>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--cursor-ink-muted)' }}>
            <strong>Symptom:</strong> A blue dialog appears when double-clicking <code>start.bat</code> or launching binaries on Windows 10 or Windows 11.
          </p>
        </div>
        <p>
          <strong>Why this happens:</strong> Microsoft Defender SmartScreen flags any newly released or independent open-source executable that does not possess an expensive commercial EV (Extended Validation) code-signing certificate. It is a reputation warning, not a virus notification.
        </p>
        <p><strong>Step-by-Step Resolution:</strong></p>
        <ol>
          <li>Click the small underlined <strong>&ldquo;More info&rdquo;</strong> link directly below the warning text.</li>
          <li>Click the <strong>&ldquo;Run anyway&rdquo;</strong> button that appears in the bottom right corner.</li>
          <li>Windows caches your permission, and the application will start without further prompts.</li>
        </ol>
      </section>

      {/* Issue 2: Extraction Failed / Bot Checks */}
      <section className="legal-section">
        <h2>2. &ldquo;Extraction Failed&rdquo; or &ldquo;Sign in to confirm you&apos;re not a bot&rdquo;</h2>
        <div className="legal-callout-card" style={{ borderLeftColor: '#ef4444', background: 'rgba(239, 68, 68, 0.06)' }}>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--cursor-ink-muted)' }}>
            <strong>Symptom:</strong> Pasting a media link results in an immediate red error stating extraction failed, or the console shows <code>HTTP 403 Forbidden</code> or <code>Sign in to confirm you&apos;re not a bot</code>.
          </p>
        </div>

        <h3>Resolution A: Perform a 1-Click Engine Update (Recommended)</h3>
        <p>
          Major video platforms regularly update their video delivery token handshakes. When this occurs, upstream definitions must be refreshed:
        </p>
        <ol>
          <li>Press <code>Ctrl+K</code> in the SonicWave web interface.</li>
          <li>Select <strong>&ldquo;Update Engine (yt-dlp)&rdquo;</strong>.</li>
          <li>Wait 5&ndash;10 seconds for the binary updater to download the newest rules from the official repository.</li>
          <li>Retry your conversion.</li>
        </ol>

        <h3>Resolution B: Use an Authenticated cookies.txt File</h3>
        <p>
          For age-restricted videos, private playlists, or platforms with strict IP bot-checks, export your browser session cookies using an open-source extension (such as &ldquo;Get cookies.txt LOCALLY&rdquo;) and save the file to:
        </p>
        <p>
          <code>server/cookies.txt</code>
        </p>
        <p>
          SonicWave will automatically detect and attach this file to authenticate your local requests safely. Your cookies never leave your computer.
        </p>
      </section>

      {/* Issue 3: Missing Binaries */}
      <section className="legal-section">
        <h2>3. Local FFmpeg or yt-dlp Binary Missing or Corrupt</h2>
        <div className="legal-callout-card" style={{ borderLeftColor: '#f59e0b', background: 'rgba(245, 158, 11, 0.06)' }}>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--cursor-ink-muted)' }}>
            <strong>Symptom:</strong> The terminal reports <code>yt-dlp not found</code> or <code>ffmpeg conversion failed: spawn ENOENT</code>.
          </p>
        </div>
        <p>
          SonicWave includes a built-in binary manager (<code>server/binManager.js</code>) that automatically provisions required binaries upon launching <code>start.bat</code>. If an aggressive antivirus removed the files or your internet dropped during initial bootstrap:
        </p>
        <ol>
          <li>Check that the directory <code>server/bin/</code> exists in your extracted folder.</li>
          <li>Manually download the latest <code>yt-dlp.exe</code> from the official repository (<a href="https://github.com/yt-dlp/yt-dlp/releases" target="_blank" rel="noopener noreferrer">github.com/yt-dlp/yt-dlp</a>) and place it in <code>server/bin/yt-dlp.exe</code>.</li>
          <li>Download the Windows essentials build of <code>ffmpeg.exe</code> from <a href="https://gyan.dev/ffmpeg/builds/" target="_blank" rel="noopener noreferrer">gyan.dev/ffmpeg</a> and place it in <code>server/bin/ffmpeg.exe</code>.</li>
          <li>Relaunch <code>start.bat</code>. The software will detect the verified executables immediately.</li>
        </ol>
      </section>

      {/* Issue 4: Port Conflicts */}
      <section className="legal-section">
        <h2>4. Port Conflict (&ldquo;EADDRINUSE: address already in use :::3001&rdquo;)</h2>
        <div className="legal-callout-card" style={{ borderLeftColor: '#8b5cf6', background: 'rgba(139, 92, 246, 0.06)' }}>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--cursor-ink-muted)' }}>
            <strong>Symptom:</strong> The terminal window closes immediately upon launch or prints <code>Error: listen EADDRINUSE: address already in use :::3001</code>.
          </p>
        </div>
        <p>
          This indicates that a previous instance of SonicWave or another background Node.js service is still listening on port 3001.
        </p>
        <p><strong>How to Clear Stranded Node Processes in PowerShell:</strong></p>
        <ol>
          <li>Open Windows PowerShell.</li>
          <li>Run the following command to terminate any lingering Node.js tasks:
            <pre style={{ background: 'var(--cursor-surface-2)', padding: '10px 14px', borderRadius: 6, fontSize: 13, border: '1px solid var(--cursor-hairline-strong)', margin: '10px 0' }}>
              <code>Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force</code>
            </pre>
          </li>
          <li>Relaunch <code>start.bat</code>.</li>
        </ol>
      </section>

      {/* Issue 5: Audio Bitrate Perceptions */}
      <section className="legal-section">
        <h2>5. Audio Bitrate Questions: Why Does 320k Sound Identical to the Source?</h2>
        <p>
          Some users question whether an MP3 converted from YouTube or TikTok is &ldquo;true&rdquo; 320 kbps:
        </p>
        <p>
          When you select 320 kbps MP3 in SonicWave, our FFmpeg engine encodes the audio stream at a constant 320,000 bits per second with zero subsequent compression loss. However, because source streaming platforms upload audio at around 128&ndash;160 kbps Opus/AAC, transcoding to 320 kbps cannot re-create acoustic frequencies that were eliminated during the uploader&apos;s original master compression.
        </p>
        <p>
          For zero transcode overhead and pure original stream extraction, select <strong>M4A</strong> (direct stream copy) or <strong>FLAC</strong>.
        </p>
      </section>

      {/* Structured Data: FAQPage JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "How do I fix the 'Windows protected your PC' SmartScreen popup?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Click 'More info' on the blue Windows Defender dialog, then click 'Run anyway'. SonicWave is open-source software and does not contain commercial certificates."
              }
            },
            {
              "@type": "Question",
              "name": "What should I do if media extraction fails with a bot error?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Press Ctrl+K in SonicWave and select 'Update Engine (yt-dlp)' to pull the newest platform definitions from the upstream repository."
              }
            },
            {
              "@type": "Question",
              "name": "How do I resolve port 3001 already in use error on Windows?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Run 'Get-Process node | Stop-Process -Force' in PowerShell to clear any stranded background Node processes, then relaunch start.bat."
              }
            }
          ]
        })
      }} />
    </DocsLayout>
  );
}

import React, { useState } from 'react';
import DocsLayout from './DocsLayout';
import DownloadSuccessModal, { triggerZipDownload, triggerExeDownload, triggerMacZipDownload } from '../DownloadSuccessModal';
import { useDocumentMetadata } from '../legal/useDocumentMetadata';
import {
  Download,
  Terminal,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FolderArchive,
  HardDrive,
  Cpu,
  Monitor,
  ExternalLink,
  ArrowRight,
  HelpCircle
} from 'lucide-react';

export default function InstallGuide({ onNavigate }) {
  const [isDownloadSuccessOpen, setIsDownloadSuccessOpen] = useState(false);
  const [downloadType, setDownloadType] = useState('exe');

  useDocumentMetadata({
    title: 'SonicWave Installation Guide : Windows & macOS Setup (64-Bit & Apple Silicon)',
    description: 'Step-by-step installation instructions for SonicWave on Windows 11/10 and macOS (Apple Silicon & Intel). Learn how to extract packages, launch start.bat or start.sh, and resolve SmartScreen or Gatekeeper warnings.',
    canonical: 'https://ytmp-3-five.vercel.app/install'
  });

  return (
    <DocsLayout activeTab="install" onNavigate={onNavigate}>
      {/* Page Header */}
      <div className="legal-header-block">
        <div className="legal-eyebrow-tag">WINDOWS 11 &amp; 10 &bull; MACOS (APPLE SILICON &amp; INTEL) &bull; SETUP GUIDE</div>
        <h1 className="legal-page-h1">SonicWave Installation Guide</h1>
        <p className="legal-effective-date">
          Applies to SonicWave v1.0.0+ &bull; Windows 64-Bit &amp; macOS Distributions
        </p>
      </div>

      {/* Quick Summary Callout Card */}
      <div className="legal-callout-card">
        <h2 className="legal-callout-title">At a Glance: Fast, Zero-Installer Setup</h2>
        <p className="legal-callout-text">
          SonicWave is distributed as a clean, portable Windows archive that runs locally on your PC. It does not write to the Windows Registry, does not bundle third-party adware, and requires no administrative privileges to extract and run.
        </p>
        <ul className="legal-summary-points">
          <li><strong>Distribution package:</strong> Standalone portable ZIP archive (1.3 MB).</li>
          <li><strong>Self-bootstrapping engine:</strong> Automatically verifies and provisions local <code>yt-dlp</code> and <code>ffmpeg</code> binaries on first run.</li>
          <li><strong>Zero registry pollution:</strong> Simply delete the folder when you wish to remove it.</li>
        </ul>
      </div>

      {/* Section 1: System Requirements */}
      <section className="legal-section">
        <h2>1. System Requirements &amp; Prerequisites</h2>
        <p>
          Before running SonicWave, verify that your computer meets the following minimum and recommended hardware specifications:
        </p>

        <div className="legal-grid-two">
          <div className="legal-card-box">
            <div className="legal-card-icon-title">
              <Monitor size={18} className="legal-card-icon" />
              <h3>Operating System</h3>
            </div>
            <p>
              <strong>Windows:</strong> Windows 11 (64-bit), Windows 10 (64-bit, Version 1903 or later).<br />
              <strong>macOS:</strong> macOS 12+ Monterey, Ventura, Sonoma, Sequoia (Apple Silicon M1/M2/M3/M4 &amp; Intel x64).<br />
              <em>Note: 32-bit (x86) legacy Windows editions are not supported.</em>
            </p>
          </div>

          <div className="legal-card-box">
            <div className="legal-card-icon-title">
              <Cpu size={18} className="legal-card-icon" />
              <h3>Hardware &amp; Memory</h3>
            </div>
            <p>
              <strong>RAM:</strong> 512 MB minimum, 2 GB recommended during active 16-stream parallel conversions.<br />
              <strong>Storage:</strong> 250 MB free disk space for engine binaries and temporary media buffers.
            </p>
          </div>

          <div className="legal-card-box">
            <div className="legal-card-icon-title">
              <Terminal size={18} className="legal-card-icon" />
              <h3>Node.js Runtime</h3>
            </div>
            <p>
              <strong>Required:</strong> Node.js v18.0.0 or later (Node.js v20 LTS recommended).<br />
              Verify your installation by running <code>node --version</code> in PowerShell or Command Prompt.
            </p>
          </div>

          <div className="legal-card-box">
            <div className="legal-card-icon-title">
              <HardDrive size={18} className="legal-card-icon" />
              <h3>Network &amp; Firewalls</h3>
            </div>
            <p>
              Standard broadband internet connection. Local communication between client and server occurs on loopback ports <code>3001</code> and <code>5173</code> without exposing ports to public networks.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Step-by-Step Installation */}
      <section className="legal-section">
        <h2>2. Step-by-Step Installation Walkthrough</h2>
        <p>
          Choose your preferred installation method below. We recommend the <strong>Custom Frameless GUI Installer (.exe)</strong> for the full native Windows experience with desktop shortcuts and automatic uninstaller support.
        </p>

        {/* Method 1: Custom GUI Installer */}
        <div className="legal-card-box" style={{ marginBottom: 24, border: '1px solid rgba(30, 215, 96, 0.3)', background: 'rgba(30, 215, 96, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: '#1ed760', color: '#000', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>RECOMMENDED</span>
              <h3 style={{ margin: 0, fontSize: 16 }}>Method 1: Custom Native GUI Installer (.exe)</h3>
            </div>
            <a
              href="/SonicWave-Custom-Installer.exe"
              download="SonicWave-Custom-Installer.exe"
              className="cursor-button-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, textDecoration: 'none', color: '#000', background: '#1ed760', fontWeight: 700, fontSize: 13 }}
              onClick={(e) => {
                e.preventDefault();
                setDownloadType('exe');
                triggerExeDownload();
                setIsDownloadSuccessOpen(true);
              }}
            >
              <Download size={14} /> Download Custom Installer (.exe) &mdash; 330 MB
            </a>
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 13.5, color: 'var(--cursor-ink-muted)' }}>
            A standalone Spotify-styled frameless GUI installer that copies the pre-packaged media engine, registers desktop and Start Menu shortcuts, and integrates with Windows Settings.
          </p>
          <ol style={{ margin: '0 0 0 18px', padding: 0, fontSize: 13.5, lineHeight: 1.8 }}>
            <li><strong>Download &amp; Run:</strong> Double-click <code>SonicWave-Custom-Installer.exe</code> from your Downloads folder.</li>
            <li><strong>Configure Preferences:</strong> Choose your install path (default: <code>AppData\Local\Programs\SonicWave</code>) and toggle shortcut preferences.</li>
            <li><strong>Install:</strong> Click <strong>Install SonicWave</strong>. The installer provisions the full media engine in seconds.</li>
            <li><strong>Launch:</strong> Click <strong>Launch SonicWave Now</strong> to open the true native window application.</li>
          </ol>
        </div>

        {/* Method 2: Portable ZIP Package */}
        <h3 style={{ fontSize: 15, marginTop: 16 }}>Method 2: Standalone Portable ZIP Package (.zip)</h3>
        <p style={{ fontSize: 13.5, color: 'var(--cursor-ink-muted)' }}>
          Best for USB drives, offline portable use, or running without installation:
        </p>
        <ol>
          <li>
            <strong>Step 1: Download the Portable Package</strong><br />
            Download the latest release ZIP directly from the official verified domain:
            <div style={{ margin: '10px 0 16px' }}>
              <a
                href="/SonicWave-v1.0.0-Windows.zip"
                download="SonicWave-v1.0.0-Windows.zip"
                className="cursor-button-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 13 }}
                onClick={(e) => {
                  e.preventDefault();
                  setDownloadType('zip');
                  triggerZipDownload();
                  setIsDownloadSuccessOpen(true);
                }}
              >
                <Download size={14} /> Download SonicWave v1.0.0 for Windows (.zip) &mdash; 1.3 MB
              </a>
            </div>
          </li>

          <li>
            <strong>Step 2: Extract the ZIP Archive</strong><br />
            Right-click <code>SonicWave-v1.0.0-Windows.zip</code> in your Downloads folder and select <strong>Extract All...</strong>. Choose a permanent location on your PC, such as <code>C:\SonicWave</code> or your personal Documents / Desktop folder.
          </li>

          <li>
            <strong>Step 3: Launch via start.bat</strong><br />
            Open the extracted folder and double-click <code>start.bat</code>. This batch launcher performs the following automated tasks:
            <ul>
              <li>Checks for a valid Node.js and npm environment on your machine.</li>
              <li>Installs necessary dependencies if first launched.</li>
              <li>Calls <code>server/binManager.js</code> to locate or automatically fetch the official <code>yt-dlp</code> and <code>ffmpeg</code> executables.</li>
              <li>Launches the local conversion server (port 3001) and application interface (port 5173).</li>
            </ul>
          </li>

          <li>
            <strong>Step 4: Start Converting &amp; Listening</strong><br />
            Your default web browser will automatically open to <code>http://localhost:5173</code>. Paste any supported media link, pick your format (such as 320 kbps MP3 or 1080p MP4), and convert immediately.
          </li>
        </ol>

        {/* Method 3: macOS Standalone Package */}
        <div className="legal-card-box" style={{ marginTop: 24, border: '1px solid rgba(94, 106, 210, 0.3)', background: 'rgba(94, 106, 210, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: '#5e6ad2', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>MACOS</span>
              <h3 style={{ margin: 0, fontSize: 16 }}>Method 3: macOS Standalone Package (.zip with start.sh)</h3>
            </div>
            <a
              href="/SonicWave-v1.0.0-macOS.zip"
              download="SonicWave-v1.0.0-macOS.zip"
              className="cursor-button-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 13 }}
              onClick={(e) => {
                e.preventDefault();
                setDownloadType('mac');
                triggerMacZipDownload();
                setIsDownloadSuccessOpen(true);
              }}
            >
              <Download size={14} /> Download SonicWave for macOS (.zip) &mdash; 2.7 MB
            </a>
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 13.5, color: 'var(--cursor-ink-muted)' }}>
            Fully compatible with Apple Silicon (M1/M2/M3/M4) and Intel Macs running macOS Monterey, Ventura, Sonoma, or Sequoia.
          </p>
          <ol style={{ margin: '0 0 0 18px', padding: 0, fontSize: 13.5, lineHeight: 1.8 }}>
            <li><strong>Download &amp; Unzip:</strong> Download <code>SonicWave-v1.0.0-macOS.zip</code> and double-click to unzip it into your Applications or user folder.</li>
            <li><strong>Open Terminal:</strong> Right-click the extracted <code>SonicWave</code> folder and select <strong>New Terminal at Folder</strong> (or navigate with <code>cd ~/Downloads/SonicWave</code>).</li>
            <li><strong>Launch start.sh:</strong> Make the script executable and launch by running:
              <div style={{ margin: '6px 0', padding: '8px 12px', background: 'rgba(0,0,0,0.4)', borderRadius: 6, fontFamily: 'monospace', fontSize: 13, color: '#1ed760' }}>
                chmod +x start.sh &amp;&amp; ./start.sh
              </div>
              The launcher verifies Node.js, auto-provisions yt-dlp &amp; FFmpeg for macOS, and launches the interface.
            </li>
            <li><strong>Convert &amp; Enjoy:</strong> SonicWave will open in your browser or native window at <code>http://localhost:5173</code>.</li>
          </ol>
        </div>
      </section>

      {/* Section 3: SmartScreen & Gatekeeper Resolution */}
      <section className="legal-section">
        <h2>3. Resolving Windows SmartScreen &amp; macOS Gatekeeper</h2>
        <p>
          When launching SonicWave for the first time, your operating system may display a security verification prompt:
        </p>

        <h3 style={{ fontSize: 15, marginTop: 16 }}>Windows Defender SmartScreen (&ldquo;Windows protected your PC&rdquo;)</h3>
        <p>
          When double-clicking <code>start.bat</code> or running binaries for the first time on Windows 10 or 11, you may encounter a blue Microsoft Defender SmartScreen popup stating:
        </p>

        <div className="legal-callout-card" style={{ borderLeftColor: '#f59e0b', background: 'rgba(245, 158, 11, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b', fontWeight: 600, marginBottom: 8 }}>
            <AlertTriangle size={18} />
            <span>Why Does Windows Show This Prompt?</span>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--cursor-ink-muted)', lineHeight: 1.6 }}>
            Microsoft Defender SmartScreen displays this notification for any newly released open-source application that has not paid hundreds of dollars annually for a commercial Microsoft code-signing certificate. It does <strong>not</strong> mean the software contains malware. SonicWave is 100% open source under the MIT License and contains zero telemetry or hidden payloads.
          </p>
        </div>

        <h4>How to Proceed Safely on Windows in 2 Clicks:</h4>
        <ol>
          <li>On the blue &ldquo;Windows protected your PC&rdquo; dialog, click the small underline link labeled <strong>&ldquo;More info&rdquo;</strong>.</li>
          <li>A new button labeled <strong>&ldquo;Run anyway&rdquo;</strong> will appear in the bottom-right corner. Click it to launch the application.</li>
        </ol>

        <h3 style={{ fontSize: 15, marginTop: 24 }}>macOS Gatekeeper (&ldquo;Unidentified Developer&rdquo; or &ldquo;App cannot be opened&rdquo;)</h3>
        <p>
          On macOS, Apple Gatekeeper may notify you that the script or binary was downloaded from the internet:
        </p>
        <ol>
          <li><strong>Quick Finder Bypass:</strong> In Finder, right-click (or Control-click) <code>start.sh</code> and choose <strong>Open</strong>. When macOS prompts with &ldquo;Are you sure you want to open it?&rdquo;, click <strong>Open</strong>.</li>
          <li><strong>Terminal Command:</strong> Alternatively, run this single terminal command to remove the quarantine flag:
            <div style={{ margin: '6px 0', padding: '6px 10px', background: 'rgba(0,0,0,0.4)', borderRadius: 6, fontFamily: 'monospace', fontSize: 12.5, color: '#38bdf8' }}>
              xattr -d com.apple.quarantine start.sh
            </div>
          </li>
        </ol>

        <p>
          Your operating system remembers this approval, so you will not be prompted again on future launches. You can also independently inspect the full source code on our public <a href="https://github.com/ANShKhare-ux/YTMP3" target="_blank" rel="noopener noreferrer">GitHub repository</a>.
        </p>
      </section>

      {/* Section 4: Portable USB Setup */}
      <section className="legal-section">
        <h2>4. Portable USB Flash Drive Workflow</h2>
        <p>
          Because SonicWave operates entirely self-contained without system installation hooks, you can run it directly from a removable USB flash drive or external solid-state drive:
        </p>
        <ul>
          <li>Extract the contents of <code>SonicWave-v1.0.0-Windows.zip</code> directly onto your USB flash drive (e.g., <code>E:\SonicWave</code>).</li>
          <li>Plug the USB drive into any 64-bit Windows computer with Node.js installed.</li>
          <li>Double-click <code>start.bat</code> directly from the flash drive. All temporary download buffers and conversion history remain on your flash drive, leaving zero traces on the host computer.</li>
        </ul>
      </section>

      {/* Section 5: Creating Shortcuts */}
      <section className="legal-section">
        <h2>5. Creating Desktop &amp; Taskbar Shortcuts</h2>
        <p>
          To access SonicWave conveniently from your Windows desktop or Start menu:
        </p>
        <ol>
          <li>Open your extracted <code>SonicWave</code> directory.</li>
          <li>Right-click <code>start.bat</code> and select <strong>Show more options &rarr; Send to &rarr; Desktop (create shortcut)</strong>.</li>
          <li>Right-click the newly created desktop shortcut, select <strong>Properties</strong>, and click <strong>Change Icon...</strong> to link to <code>favicon.ico</code> inside the package.</li>
          <li>Rename the shortcut to <strong>SonicWave</strong> for a clean desktop launcher experience.</li>
        </ol>
      </section>

      {/* Section 6: Clean Removal */}
      <section className="legal-section">
        <h2>6. Clean Uninstallation</h2>
        <p>
          Unlike conventional software that clutters your Windows Registry or leaves hidden services in <code>AppData\Local</code>, removing SonicWave takes exactly one step:
        </p>
        <p>
          Delete the extracted <code>SonicWave</code> directory from your drive. That is all. Zero registry entries, zero background services, and zero tracking tokens remain behind.
        </p>
      </section>

      {/* Structured Data: HowTo JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to Install and Launch SonicWave on Windows 11 and 10",
          "description": "Step-by-step instructions to download, extract, and run SonicWave portable media downloader for Windows.",
          "totalTime": "PT1M",
          "tool": [
            { "@type": "HowToTool", "name": "Windows 10 or 11 (64-bit)" },
            { "@type": "HowToTool", "name": "Node.js v18+" }
          ],
          "step": [
            {
              "@type": "HowToStep",
              "name": "Download the Portable ZIP",
              "text": "Download SonicWave-v1.0.0-Windows.zip from the official website.",
              "url": "https://ytmp-3-five.vercel.app/install#step1"
            },
            {
              "@type": "HowToStep",
              "name": "Extract Archive",
              "text": "Right-click the ZIP and extract files to a chosen directory like C:\\SonicWave.",
              "url": "https://ytmp-3-five.vercel.app/install#step2"
            },
            {
              "@type": "HowToStep",
              "name": "Launch start.bat",
              "text": "Double click start.bat to bootstrap yt-dlp and FFmpeg and launch local servers.",
              "url": "https://ytmp-3-five.vercel.app/install#step3"
            },
            {
              "@type": "HowToStep",
              "name": "Start Converting",
              "text": "Open your browser to http://localhost:5173 to convert and audition media.",
              "url": "https://ytmp-3-five.vercel.app/install#step4"
            }
          ]
        })
      }} />

      {/* SaaS Download Success Dialogbox */}
      <DownloadSuccessModal
        isOpen={isDownloadSuccessOpen}
        onClose={() => setIsDownloadSuccessOpen(false)}
        onNavigate={onNavigate}
        downloadType={downloadType}
        onSwitchType={(type) => setDownloadType(type)}
      />
    </DocsLayout>
  );
}

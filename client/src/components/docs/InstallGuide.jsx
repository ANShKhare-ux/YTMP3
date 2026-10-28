import React, { useState } from 'react';
import DocsLayout from './DocsLayout';
import DownloadSuccessModal, { triggerZipDownload } from '../DownloadSuccessModal';
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

  useDocumentMetadata({
    title: 'SonicWave Installation Guide — Windows 11 & 10 (64-Bit Setup)',
    description: 'Step-by-step installation instructions for SonicWave on Windows 11 and 10. Learn how to extract the portable zip, launch start.bat, and resolve SmartScreen warnings.',
    canonical: 'https://ytmp-3-five.vercel.app/install'
  });

  return (
    <DocsLayout activeTab="install" onNavigate={onNavigate}>
      {/* Page Header */}
      <div className="legal-header-block">
        <div className="legal-eyebrow-tag">WINDOWS 11 &amp; 10 (64-BIT) &bull; SETUP GUIDE</div>
        <h1 className="legal-page-h1">SonicWave Installation Guide</h1>
        <p className="legal-effective-date">
          Applies to SonicWave v1.0.0+ &bull; Portable Windows 64-Bit Distribution
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
              <strong>Supported:</strong> Windows 11 (64-bit), Windows 10 (64-bit, Version 1903 or later).<br />
              <em>Note: 32-bit (x86) Windows editions and ARM64 without x64 emulation are not supported by the bundled binaries.</em>
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
          Follow these four simple steps to get SonicWave running on your Windows PC in less than 30 seconds:
        </p>

        <ol>
          <li>
            <strong>Step 1: Download the Official Package</strong><br />
            Download the latest release ZIP directly from the official verified domain:
            <div style={{ margin: '10px 0 16px' }}>
              <a
                href="/SonicWave-v1.0.0-Windows.zip"
                download="SonicWave-v1.0.0-Windows.zip"
                className="cursor-button-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, textDecoration: 'none', color: '#fff', fontWeight: 600, fontSize: 13 }}
                onClick={(e) => {
                  e.preventDefault();
                  triggerZipDownload();
                  setIsDownloadSuccessOpen(true);
                }}
              >
                <Download size={14} /> Download SonicWave v1.0.0 for Windows (.zip)
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
              <li>Launches the local conversion server (port 3001) and web studio interface (port 5173).</li>
            </ul>
          </li>

          <li>
            <strong>Step 4: Start Converting &amp; Listening</strong><br />
            Your default web browser will automatically open to <code>http://localhost:5173</code>. Paste any supported media link, pick your format (such as 320 kbps MP3 or 1080p MP4), and convert immediately.
          </li>
        </ol>
      </section>

      {/* Section 3: SmartScreen Resolution */}
      <section className="legal-section">
        <h2>3. Resolving Windows SmartScreen (&ldquo;Windows protected your PC&rdquo;)</h2>
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

        <h3>How to Proceed Safely in 2 Clicks:</h3>
        <ol>
          <li>On the blue &ldquo;Windows protected your PC&rdquo; dialog, click the small underline link labeled <strong>&ldquo;More info&rdquo;</strong>.</li>
          <li>A new button labeled <strong>&ldquo;Run anyway&rdquo;</strong> will appear in the bottom-right corner. Click it to launch the application.</li>
        </ol>
        <p>
          Windows remembers this approval, so you will not be prompted again on future launches. You can also independently inspect the full source code on our public <a href="https://github.com/ANShKhare-ux/YTMP3" target="_blank" rel="noopener noreferrer">GitHub repository</a>.
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
              "name": "Open Web Studio",
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
      />
    </DocsLayout>
  );
}

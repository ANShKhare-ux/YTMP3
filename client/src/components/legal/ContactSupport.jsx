import React, { useState } from 'react';
import LegalLayout from './LegalLayout';
import { useDocumentMetadata } from './useDocumentMetadata';
import {
  HelpCircle,
  Bug,
  BookOpen,
  Terminal,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  RefreshCw,
  FolderArchive,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

function GitHubIcon({ size = 20, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

const TROUBLESHOOTING_GUIDES = [
  {
    id: 'updater',
    title: 'How do I update the extraction engine (yt-dlp)?',
    content: 'When upstream media platforms update their player code, extractions can fail. SonicWave includes a 1-click binary updater: In the application, press Ctrl+K (or ⌘K on macOS) to open the Command Palette, then select "Update Engine (yt-dlp)". This contacts the official GitHub Releases API and pulls the latest executable definitions directly into your local server directory in seconds.'
  },
  {
    id: 'start-bat',
    title: 'start.bat fails or reports missing Node.js',
    content: 'Ensure you have Node.js (version 20.x or 22.x LTS) installed from nodejs.org and that "node" is added to your Windows PATH environment variable. In PowerShell, if script execution policies block npm scripts, run "npm.cmd run dev" or right-click start.bat and select "Run as Administrator".'
  },
  {
    id: 'cookies',
    title: 'Platform blocks or "Sign in to confirm you are not a bot" errors',
    content: 'Platforms like YouTube and Instagram occasionally present bot challenges to cloud IP addresses or frequent downloaders. SonicWave supports an optional Netscape cookie jar: Export your browser cookies into a plain text file named "cookies.txt", place it in the "server/" folder, and restart start.bat. SonicWave passes these cookies locally to yt-dlp to satisfy upstream verification without uploading them anywhere.'
  },
  {
    id: 'disk-space',
    title: 'Where are my downloaded files saved?',
    content: 'During local conversion, files are written to "server/downloads/". When you click "Download" in the web UI, the browser saves the final MP3 or MP4 file to your standard Windows "Downloads" folder. SonicWave automatically cleans temporary server downloads older than 2 hours (120 minutes) to save hard drive space.'
  },
  {
    id: 'formats',
    title: 'Which audio and video formats are supported?',
    content: 'SonicWave supports audio extraction in MP3 (320k Studio CBR, 256k High, 192k Standard, 128k Light), AAC / M4A (instant direct stream copy), uncompressed WAV, and audiophile FLAC. For video, it packages MP4 files in 1080p Full HD, 720p HD, and 480p SD with stereo audio muxing.'
  }
];

export default function ContactSupport({ onNavigate }) {
  useDocumentMetadata({
    title: 'Contact & Support — SonicWave Media Utility',
    description: 'Get technical help with SonicWave. Access troubleshooting guides, binary update instructions, Windows setup help, and open-source GitHub support.',
    canonical: 'https://ytmp-3-five.vercel.app/contact'
  });

  const [openGuide, setOpenGuide] = useState('updater');

  const toggleGuide = (id) => {
    setOpenGuide((prev) => (prev === id ? null : id));
  };

  return (
    <LegalLayout activeTab="contact" onNavigate={onNavigate}>
      <header className="legal-header-block">
        <div className="legal-eyebrow-tag">
          <HelpCircle size={12} aria-hidden="true" />
          <span>HELP DESK &amp; COMMUNITY ASSISTANCE</span>
        </div>
        <h1 className="legal-page-h1">Contact &amp; Support</h1>
        <p className="legal-effective-date">Community-Driven Technical Support &bull; Open Source Project</p>
      </header>

      {/* Support Intro */}
      <div className="legal-callout-card">
        <h3 className="legal-callout-title">Support Channels &amp; Technical Inquiries</h3>
        <p className="legal-callout-text">
          SonicWave is an open-source technical utility maintained on GitHub. Because SonicWave is completely free and community-driven, we do not operate a commercial call center or paid ticketing queue. All official technical support, bug reports, engine updates, and feature discussions are conducted publicly and transparently through our GitHub repository.
        </p>
      </div>

      {/* Primary Support Cards */}
      <section className="legal-section">
        <h2>1. Verified Support Channels</h2>
        <div className="legal-grid-two">
          {/* GitHub Issues */}
          <div className="legal-contact-channel-card">
            <div className="legal-channel-header">
              <div className="legal-channel-icon-wrap">
                <GitHubIcon size={20} />
              </div>
              <div>
                <h3 className="legal-channel-title">GitHub Issue Tracker</h3>
                <span className="legal-channel-badge">Recommended</span>
              </div>
            </div>
            <p className="legal-channel-desc">
              For bug reports, engine extraction failures, Windows installation errors, and feature requests. Please search existing issues before submitting a duplicate report.
            </p>
            <a
              href="https://github.com/ANShKhare-ux/YTMP3/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-button-primary legal-channel-btn"
            >
              Open an Issue on GitHub <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>

          {/* GitHub Discussions / Repo */}
          <div className="legal-contact-channel-card">
            <div className="legal-channel-header">
              <div className="legal-channel-icon-wrap">
                <Terminal size={20} />
              </div>
              <div>
                <h3 className="legal-channel-title">Repository &amp; Documentation</h3>
                <span className="legal-channel-badge">Knowledge Base</span>
              </div>
            </div>
            <p className="legal-channel-desc">
              Inspect full architecture blueprints, API specifications, development guides, and packaging instructions directly in the project knowledge base.
            </p>
            <a
              href="https://github.com/ANShKhare-ux/YTMP3"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-button-secondary legal-channel-btn"
            >
              View Repository Docs <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* Interactive Self-Help Troubleshooting Section */}
      <section className="legal-section">
        <h2>2. Immediate Self-Help Troubleshooting</h2>
        <p>
          Before filing an issue, check whether your question is resolved in our verified technical knowledge base below:
        </p>

        <div className="legal-accordion-list">
          {TROUBLESHOOTING_GUIDES.map((item) => {
            const isOpen = openGuide === item.id;
            return (
              <div key={item.id} className={`legal-accordion-item ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="legal-accordion-trigger"
                  onClick={() => toggleGuide(item.id)}
                  aria-expanded={isOpen}
                >
                  <span className="legal-accordion-title">{item.title}</span>
                  {isOpen ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                </button>
                {isOpen && (
                  <div className="legal-accordion-content">
                    <p>{item.content}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Guidelines for Submitting Bug Reports */}
      <section className="legal-section">
        <h2>3. How to Report a Technical Bug</h2>
        <p>To help maintainers diagnose and resolve issues swiftly, include the following evidence in your GitHub report:</p>
        <ul className="legal-checklist">
          <li><strong>Operating System:</strong> e.g., Windows 11 (64-bit), Windows 10 (64-bit).</li>
          <li><strong>Engine Versions:</strong> Check the terminal output when running <code>start.bat</code> (e.g., <code>yt-dlp v2026.08.19</code>, <code>FFmpeg 6.1.1</code>).</li>
          <li><strong>Requested Format:</strong> Specific format and bitrate (e.g., MP3 320k, MP4 1080p).</li>
          <li><strong>Error Message:</strong> Copy and paste the exact terminal or console error message. Never include private authentication credentials or personal tokens.</li>
        </ul>
      </section>

      {/* Formal Administrative & Security Inquiries */}
      <section className="legal-section">
        <h2>4. Formal &amp; Administrative Notices</h2>
        <p>
          For legal inquiries, copyright notices, or security vulnerability disclosures:
        </p>
        <div className="legal-contact-box">
          <p>
            <strong>Security &amp; Legal Notices:</strong> Please submit inquiries through our GitHub repository issue tracker at <a href="https://github.com/ANShKhare-ux/YTMP3/issues" target="_blank" rel="noopener noreferrer">https://github.com/ANShKhare-ux/YTMP3/issues</a> with the label <code>[Security]</code> or <code>[Legal]</code>.
          </p>
          <p className="legal-note-text">
            <em>Note for rights holders: As SonicWave does not host or store files online, requests to remove third-party content must be directed to the third-party platform hosting that media.</em>
          </p>
        </div>
      </section>
    </LegalLayout>
  );
}

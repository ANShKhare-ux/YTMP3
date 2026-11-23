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
  AlertTriangle,
  Mail,
  Send,
  Copy,
  Check,
  Clock,
  ShieldAlert
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
    title: 'Contact & Support : SonicWave Media Utility',
    description: 'Get in touch with the SonicWave maintainers. Access direct email support, community troubleshooting guides, binary updates, and open-source GitHub issue tracking.',
    canonical: 'https://ytmp-3-five.vercel.app/contact'
  });

  const [openGuide, setOpenGuide] = useState('updater');
  const [copied, setCopied] = useState(false);
  const [formState, setFormState] = useState({ name: '', email: '', category: 'General Inquiry', message: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleGuide = (id) => {
    setOpenGuide((prev) => (prev === id ? null : id));
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('preetiansh16@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    // Open default mailto prefilled as convenience
    const subject = encodeURIComponent(`[SonicWave ${formState.category}] from ${formState.name || 'User'}`);
    const body = encodeURIComponent(`Sender Name: ${formState.name}\nSender Email: ${formState.email}\nCategory: ${formState.category}\n\nMessage:\n${formState.message}`);
    window.location.href = `mailto:preetiansh16@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <LegalLayout activeTab="contact" onNavigate={onNavigate}>
      <header className="legal-header-block">
        <div className="legal-eyebrow-tag">
          <HelpCircle size={12} aria-hidden="true" />
          <span>HELP DESK &amp; COMMUNITY ASSISTANCE</span>
        </div>
        <h1 className="legal-page-h1">Contact &amp; Support</h1>
        <p className="legal-effective-date">Community-Driven Technical Support &bull; Direct Inquiries &bull; Open Source Project</p>
      </header>

      {/* Support Intro */}
      <div className="legal-callout-card">
        <h3 className="legal-callout-title">Support Channels &amp; Technical Inquiries</h3>
        <p className="legal-callout-text">
          SonicWave is an open-source technical utility maintained on GitHub. We believe in total transparency and accessibility: whether you have questions about our software, need technical troubleshooting, have commercial or AdSense inquiries, or wish to report a bug, multiple verified communication channels are available below.
        </p>
        <div style={{ marginTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--spotify-green, #1ed760)', fontSize: '0.85rem' }}>
          <Clock size={14} />
          <span>Average response turnaround: <strong>24 to 48 hours</strong></span>
        </div>
      </div>

      {/* Primary Support Cards */}
      <section className="legal-section">
        <h2>1. Verified Communication Channels</h2>
        <div className="legal-grid-two">
          {/* Direct Email Channel */}
          <div className="legal-contact-channel-card" style={{ borderLeft: '3px solid var(--spotify-green, #1ed760)' }}>
            <div className="legal-channel-header">
              <div className="legal-channel-icon-wrap" style={{ background: 'rgba(30, 215, 96, 0.15)', color: '#1ed760' }}>
                <Mail size={20} />
              </div>
              <div>
                <h3 className="legal-channel-title">Direct Maintainer Email</h3>
                <span className="legal-channel-badge" style={{ background: '#1ed760', color: '#000' }}>Official Email</span>
              </div>
            </div>
            <p className="legal-channel-desc">
              For general inquiries, editorial questions, partnership or AdSense queries, and formal notices. Contact the project lead directly.
            </p>
            <div style={{ background: '#141517', padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <code style={{ color: '#fff', fontSize: '0.88rem' }}>preetiansh16@gmail.com</code>
              <button
                type="button"
                onClick={handleCopyEmail}
                style={{ background: 'transparent', border: 'none', color: copied ? '#1ed760' : '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                aria-label="Copy email address"
              >
                {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
            <a
              href="mailto:preetiansh16@gmail.com?subject=[SonicWave%20Inquiry]"
              className="cursor-button-primary legal-channel-btn"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Mail size={13} aria-hidden="true" /> Send Direct Email
            </a>
          </div>

          {/* GitHub Issues */}
          <div className="legal-contact-channel-card">
            <div className="legal-channel-header">
              <div className="legal-channel-icon-wrap">
                <GitHubIcon size={20} />
              </div>
              <div>
                <h3 className="legal-channel-title">GitHub Issue Tracker</h3>
                <span className="legal-channel-badge">Bug Reports</span>
              </div>
            </div>
            <p className="legal-channel-desc">
              For bug reports, engine extraction failures, Windows installation errors, and feature requests. Please search existing issues before submitting a duplicate report.
            </p>
            <a
              href="https://github.com/ANShKhare-ux/YTMP3/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-button-secondary legal-channel-btn"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
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
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              View Repository Docs <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>

          {/* About Us & Team Info */}
          <div className="legal-contact-channel-card">
            <div className="legal-channel-header">
              <div className="legal-channel-icon-wrap" style={{ background: 'rgba(130, 143, 255, 0.15)', color: '#828fff' }}>
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="legal-channel-title">About the Project &amp; Team</h3>
                <span className="legal-channel-badge">Transparency</span>
              </div>
            </div>
            <p className="legal-channel-desc">
              Learn about SonicWave's mission, our open-source philosophy, our ethical standards, and the engineering principles behind our local media engine.
            </p>
            <a
              href="/about"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate('about', '/about');
              }}
              className="cursor-button-secondary legal-channel-btn"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              Read About Us <ChevronDown size={13} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* Interactive Quick Contact Form */}
      <section className="legal-section">
        <h2>2. Send an Inquiry Message</h2>
        <p>
          Fill out the form below to initiate an inquiry directly with our engineering team:
        </p>

        {isSubmitted ? (
          <div className="legal-callout-card" style={{ borderLeft: '3px solid #1ed760' }}>
            <h4 style={{ color: '#1ed760', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <CheckCircle2 size={18} /> Thank You for Your Message
            </h4>
            <p className="legal-callout-text" style={{ marginTop: '0.5rem' }}>
              Your inquiry has been formulated and dispatched. If your email client didn't open automatically, you can always reach us directly at <strong>preetiansh16@gmail.com</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitForm} style={{ background: '#121316', border: '1px solid #23252a', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9fa6b2', marginBottom: '6px' }} htmlFor="contact-name">Your Name</label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: '#0a0a0c', border: '1px solid #2a2c33', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9fa6b2', marginBottom: '6px' }} htmlFor="contact-email">Your Email Address</label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  placeholder="e.g. alex@example.com"
                  value={formState.email}
                  onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: '#0a0a0c', border: '1px solid #2a2c33', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9fa6b2', marginBottom: '6px' }} htmlFor="contact-category">Inquiry Subject / Category</label>
              <select
                id="contact-category"
                value={formState.category}
                onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', background: '#0a0a0c', border: '1px solid #2a2c33', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }}
              >
                <option value="General Inquiry">General Question / Feedback</option>
                <option value="Technical Support">Technical Support / Installation Help</option>
                <option value="Bug Report">Bug Report / Extraction Failure</option>
                <option value="Advertising / AdSense">Advertising &amp; Sponsorship Inquiry</option>
                <option value="Copyright / DMCA">Copyright Notice / Legal Concern</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9fa6b2', marginBottom: '6px' }} htmlFor="contact-message">Your Message</label>
              <textarea
                id="contact-message"
                required
                rows={4}
                placeholder="Describe your inquiry, question, or issue in detail..."
                value={formState.message}
                onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', background: '#0a0a0c', border: '1px solid #2a2c33', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="cursor-button-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.9rem' }}
              >
                <Send size={14} /> Send Inquiry
              </button>
            </div>
          </form>
        )}
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
            <strong>Official Project &amp; Legal Email:</strong> <a href="mailto:preetiansh16@gmail.com">preetiansh16@gmail.com</a>
          </p>
          <p>
            <strong>Security &amp; Legal Notices:</strong> Inquiries may also be submitted through our GitHub repository issue tracker at <a href="https://github.com/ANShKhare-ux/YTMP3/issues" target="_blank" rel="noopener noreferrer">https://github.com/ANShKhare-ux/YTMP3/issues</a> with the label <code>[Security]</code> or <code>[Legal]</code>.
          </p>
          <p className="legal-note-text">
            <em>Note for rights holders: As SonicWave does not host or store files online, requests to remove third-party content must be directed to the third-party platform hosting that media.</em>
          </p>
        </div>
      </section>
    </LegalLayout>
  );
}

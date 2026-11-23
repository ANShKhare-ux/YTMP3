import React from 'react';
import LegalLayout from './LegalLayout';
import { useDocumentMetadata } from './useDocumentMetadata';
import {
  Info,
  ShieldCheck,
  Cpu,
  Heart,
  Globe,
  Terminal,
  Code2,
  CheckCircle2,
  Users,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Layers,
  Zap,
  Lock,
  BookOpen
} from 'lucide-react';

export default function AboutUs({ onNavigate }) {
  useDocumentMetadata({
    title: 'About Us : SonicWave Open-Source Media Project',
    description: 'Learn about SonicWave, our mission to provide clean local media conversion, our open-source philosophy, engineering standards, and the team behind the software.',
    canonical: 'https://ytmp-3-five.vercel.app/about'
  });

  return (
    <LegalLayout activeTab="about" onNavigate={onNavigate}>
      <header className="legal-header-block">
        <div className="legal-eyebrow-tag">
          <Info size={12} aria-hidden="true" />
          <span>OPEN-SOURCE ARCHITECTURE &amp; EDITORIAL MISSION</span>
        </div>
        <h1 className="legal-page-h1">About SonicWave</h1>
        <p className="legal-effective-date">Open-Source Media Technology &bull; Founded 2026 &bull; Maintained by Ansh Khare &amp; Contributors</p>
      </header>

      {/* Executive Overview Card */}
      <div className="legal-callout-card">
        <h3 className="legal-callout-title">The SonicWave Philosophy</h3>
        <p className="legal-callout-text">
          SonicWave was born to solve a pervasive problem across the modern internet: cloud media conversion websites have become predatory, insecure, and heavily throttled. Many existing tools bombard users with deceptive popups, inject malicious browser extensions, compromise user privacy, and aggressively compress audio down to muddy bitrates.
        </p>
        <p className="legal-callout-text" style={{ marginTop: '0.75rem' }}>
          We built SonicWave as an open-source, privacy-first alternative. By running conversion pipelines locally on the user&rsquo;s personal hardware via battle-tested open-source engines (<strong>yt-dlp</strong> and <strong>FFmpeg</strong>), SonicWave delivers authentic 320 kbps MP3 audio, 1080p MP4 video, and multi-threaded parallel downloads without collecting user data or hosting media on cloud servers.
        </p>
      </div>

      {/* Core Mission Section */}
      <section className="legal-section">
        <h2>1. Our Mission &amp; Purpose</h2>
        <p>
          Our mission is to empower creators, researchers, music enthusiasts, and everyday internet users with high-fidelity, transparent media archiving tools that respect personal privacy and digital freedom.
        </p>
        <div className="legal-grid-two">
          <div className="legal-card-box">
            <div className="legal-card-icon-title">
              <ShieldCheck size={18} className="legal-card-icon" style={{ color: 'var(--spotify-green, #1ed760)' }} aria-hidden="true" />
              <h3>Privacy by Design</h3>
            </div>
            <p>
              Media files, downloaded audio, and video URLs are never stored on a centralized SonicWave server. Media transcoding happens entirely within a local sandbox on your personal device.
            </p>
          </div>

          <div className="legal-card-box">
            <div className="legal-card-icon-title">
              <Zap size={18} className="legal-card-icon" style={{ color: '#828fff' }} aria-hidden="true" />
              <h3>16-Stream Turbo Acceleration</h3>
            </div>
            <p>
              While cloud conversion portals throttle speeds to sell &ldquo;premium&rdquo; tiers, SonicWave utilizes 16 parallel fragment streams to max out your device&rsquo;s network bandwidth natively.
            </p>
          </div>

          <div className="legal-card-box">
            <div className="legal-card-icon-title">
              <Lock size={18} className="legal-card-icon" style={{ color: '#38bdf8' }} aria-hidden="true" />
              <h3>Zero Bundled Adware or Malware</h3>
            </div>
            <p>
              SonicWave is clean software. We do not bundle third-party toolbars, search engine hijackers, cryptocurrency miners, or background tracking services. What you download is purely the tool.
            </p>
          </div>

          <div className="legal-card-box">
            <div className="legal-card-icon-title">
              <Code2 size={18} className="legal-card-icon" style={{ color: '#a855f7' }} aria-hidden="true" />
              <h3>100% Free &amp; Open Source</h3>
            </div>
            <p>
              Released under the permissive MIT license, our entire codebase is open, auditable, and freely inspectable by security researchers and software engineers worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* Engineering & Architecture Section */}
      <section className="legal-section">
        <h2>2. Engineering Architecture &amp; Technology Stack</h2>
        <p>
          SonicWave distinguishes itself through its modular, multi-platform engineering architecture designed for performance, reliability, and security:
        </p>
        <ul className="legal-checklist">
          <li>
            <strong>Decoupled Presentation &amp; Discovery Website:</strong> Our public web portal (hosted on Vercel&rsquo;s high-performance edge network) serves comprehensive technical documentation, codec guides, API specifications, and official installation binaries.
          </li>
          <li>
            <strong>Native Desktop Application (Electron + Express):</strong> The Windows desktop version bundles a lightweight local Node.js Express service (listening securely on <code>localhost:3001</code>) with an isolated Chromium runtime, providing a Spotify-themed studio with zero browser address bars or tab distractions.
          </li>
          <li>
            <strong>Self-Bootstrapping Engine Pipeline:</strong> Upon initial startup, SonicWave automatically provisions verified platform binaries for <code>yt-dlp</code> and <code>FFmpeg</code> into its local binary directory with SHA verification, ensuring smooth execution without manual system path editing.
          </li>
          <li>
            <strong>On-Device Mobile Architecture:</strong> For mobile users on Android, SonicWave features a native Android application packaging an embedded Python/FFmpeg engine that integrates directly into the system Share Sheet for 1-tap downloads.
          </li>
        </ul>
      </section>

      {/* The Team & Community Section */}
      <section className="legal-section">
        <h2>3. Who We Are: The Team &amp; Community</h2>
        <p>
          SonicWave was founded and is actively maintained by <strong>Ansh Khare</strong> (GitHub: <a href="https://github.com/ANShKhare-ux" target="_blank" rel="noopener noreferrer">@ANShKhare-ux</a>), a software engineer and UI/UX designer passionate about digital audio fidelity, developer tools, and open-source transparency.
        </p>
        <div className="legal-callout-card" style={{ marginTop: '1rem', borderLeft: '3px solid var(--spotify-green, #1ed760)' }}>
          <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} /> Open Source Collaboration
          </h4>
          <p className="legal-callout-text">
            The project flourishes thanks to contributions, bug reports, and feedback from open-source developers worldwide. We build upon the tireless work of the global open-source community, particularly the maintainers of <code>yt-dlp</code>, the <code>FFmpeg</code> project, React, and Electron.
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a
              href="https://github.com/ANShKhare-ux/YTMP3"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-button-primary legal-channel-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Terminal size={14} /> View GitHub Repository <ExternalLink size={12} />
            </a>
            <a
              href="/contact"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate('contact', '/contact');
              }}
              className="cursor-button-secondary legal-channel-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              Contact Maintainers <ArrowRight size={12} />
            </a>
          </div>
        </div>
      </section>

      {/* Editorial Standards & Documentation Integrity */}
      <section className="legal-section">
        <h2>4. Content Quality &amp; Editorial Standards</h2>
        <p>
          Every conversion guide, troubleshooting document, and architectural specification published on SonicWave is authored in-house with rigorous technical accuracy.
        </p>
        <ul>
          <li>
            <strong>Empirical Benchmarks:</strong> All bitrate numbers (e.g., 320 kbps Constant Bitrate, 128 kbps OPUS transcoding), codec parameters (<code>libmp3lame</code>, <code>aac</code>, <code>copy</code> stream pass-through), and speed measurements are verified against real FFmpeg output spectra.
          </li>
          <li>
            <strong>Continual Documentation Maintenance:</strong> Upstream platforms frequently modify their player APIs and extractor endpoints. We continually revise our <a href="/supported-platforms" onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate('platforms-guide', '/supported-platforms'); }}>Supported Platforms Guide</a> and <a href="/troubleshooting" onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate('troubleshooting', '/troubleshooting'); }}>Troubleshooting Knowledge Base</a> to provide working diagnostic steps.
          </li>
          <li>
            <strong>Human Review:</strong> We do not publish automated spam, mass programmatic link farms, or machine-spun text. All documentation is reviewed for readability, accessibility, and utility.
          </li>
        </ul>
      </section>

      {/* Copyright Ethics & Fair Use */}
      <section className="legal-section">
        <h2>5. Copyright Ethics &amp; Responsible Use</h2>
        <p>
          SonicWave strongly respects intellectual property rights, creators, and musicians. We maintain strict compliance policies:
        </p>
        <div className="legal-grid-two">
          <div className="legal-card-box">
            <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.5rem' }}>Personal Archiving &amp; Fair Use</h4>
            <p>
              SonicWave is designed strictly for lawful personal use, such as archiving copyright-free audio, independent content created under Creative Commons licenses, podcast episodes for offline study, educational commentary, and backup of personal media.
            </p>
          </div>
          <div className="legal-card-box">
            <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.5rem' }}>No Circumvention of Digital Rights</h4>
            <p>
              SonicWave does not bypass, strip, or decrypt DRM (Digital Rights Management) technologies like Widevine, FairPlay, or PlayReady. It interfaces only with public media streams intended for standard web delivery.
            </p>
          </div>
        </div>
        <p style={{ marginTop: '0.75rem' }}>
          For detailed guidelines or to submit copyright claims, review our <a href="/copyright-acceptable-use" onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate('copyright', '/copyright-acceptable-use'); }}>Copyright &amp; Acceptable Use Policy</a>.
        </p>
      </section>

      {/* Website Funding & Transparency */}
      <section className="legal-section">
        <h2>6. How We Fund the Project</h2>
        <p>
          Transparency about funding is essential for maintaining trust with our community and partners:
        </p>
        <ul>
          <li>
            <strong>No Paywalls or Hidden Subscriptions:</strong> The SonicWave software is completely free ($0/month) and will remain free forever under the MIT License.
          </li>
          <li>
            <strong>Non-Intrusive Public Advertising:</strong> To cover ongoing web hosting costs, domain renewals, CI/CD automated testing infrastructure, and project maintenance, we display non-intrusive standard web advertising on our public documentation website via trusted ad networks like Google AdSense.
          </li>
          <li>
            <strong>Ad-Free Desktop Experience:</strong> Advertisements appear solely on the public informational website. The standalone Windows desktop and Android applications contain zero advertising banners, zero popups, and zero promotional trackers.
          </li>
        </ul>
      </section>

      {/* Contact & Inquiries */}
      <section className="legal-section">
        <h2>7. Contact &amp; Community Inquiries</h2>
        <p>
          We value feedback, questions, and collaboration from our users. You can reach out directly:
        </p>
        <div className="legal-contact-box">
          <p>
            <strong>Official Project Email:</strong> <a href="mailto:anshkhare.ux@gmail.com">anshkhare.ux@gmail.com</a>
          </p>
          <p>
            <strong>GitHub Issue Tracker:</strong> <a href="https://github.com/ANShKhare-ux/YTMP3/issues" target="_blank" rel="noopener noreferrer">https://github.com/ANShKhare-ux/YTMP3/issues</a>
          </p>
          <p>
            <strong>Help Desk &amp; Self-Service Guides:</strong> <a href="/contact" onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate('contact', '/contact'); }}>SonicWave Contact &amp; Support Hub</a>
          </p>
        </div>
      </section>
    </LegalLayout>
  );
}

import React from 'react';
import LegalLayout from './LegalLayout';
import { useDocumentMetadata } from './useDocumentMetadata';
import { Scale, AlertCircle, Shield, CheckCircle, FileText, Ban } from 'lucide-react';

export default function CopyrightPolicy({ onNavigate }) {
  useDocumentMetadata({
    title: 'Copyright & Acceptable Use Policy — SonicWave',
    description: 'Guidelines on authorized media downloading, personal archiving, copyright compliance, and acceptable use of the SonicWave conversion utility.',
    canonical: 'https://ytmp-3-five.vercel.app/copyright-acceptable-use'
  });

  return (
    <LegalLayout activeTab="copyright" onNavigate={onNavigate}>
      <header className="legal-header-block">
        <div className="legal-eyebrow-tag">
          <Scale size={12} aria-hidden="true" />
          <span>INTELLECTUAL PROPERTY &amp; ACCEPTABLE USE</span>
        </div>
        <h1 className="legal-page-h1">Copyright &amp; Acceptable Use Policy</h1>
        <p className="legal-effective-date">Last Updated: October 27, 2026 &bull; Version 1.0.0</p>
      </header>

      {/* Overview Callout */}
      <div className="legal-callout-card">
        <h3 className="legal-callout-title">Core Principle: Respect Intellectual Property</h3>
        <p className="legal-callout-text">
          SonicWave is built as an open-source format-conversion tool. It is not an authorization mechanism, and it does not grant users rights or licenses to third-party creative content. Users must only download, transcode, or archive media they have the lawful right to access and store.
        </p>
        <ul className="legal-summary-points">
          <li><strong>Lawful Content Only:</strong> You may only process content that you own, that is published under open licenses (such as Creative Commons or Public Domain), or that you are authorized to archive under applicable copyright exceptions.</li>
          <li><strong>No Server-Side Media Storage:</strong> The SonicWave website does not host, index, store, or distribute user-converted media files. All conversions occur locally on the user&rsquo;s personal hardware.</li>
          <li><strong>No Commercial Redistribution:</strong> Using SonicWave to create unauthorized copies for sale, public broadcast, or commercial redistribution is strictly prohibited.</li>
        </ul>
      </div>

      <section className="legal-section">
        <h2>1. Purpose &amp; Guiding Philosophy</h2>
        <p>
          SonicWave respects the intellectual property rights of artists, musicians, filmmakers, broadcasters, and content creators worldwide. We expect all individuals using our website and desktop software to conduct themselves with the same standard of integrity.
        </p>
        <p>
          The software functions analogously to a browser, audio recorder, or media player: it is a neutral technical tool capable of format conversion. The existence of format-conversion capabilities does not mean that every media stream available on the Internet may be legally downloaded or distributed.
        </p>
      </section>

      <section className="legal-section">
        <h2>2. Permitted &amp; Lawful Uses</h2>
        <p>You may only use SonicWave to convert, download, or store digital media under the following conditions:</p>
        <div className="legal-grid-two">
          <div className="legal-card-box">
            <div className="legal-card-icon-title">
              <CheckCircle size={18} className="legal-card-icon text-green" aria-hidden="true" />
              <h3>1. Your Own Content</h3>
            </div>
            <p>
              Media that you personally created, produced, or recorded, where you hold all underlying copyrights and proprietary rights.
            </p>
          </div>

          <div className="legal-card-box">
            <div className="legal-card-icon-title">
              <CheckCircle size={18} className="legal-card-icon text-green" aria-hidden="true" />
              <h3>2. Explicit Authorization</h3>
            </div>
            <p>
              Media where the copyright holder has granted express written permission or published the work under an open license (such as Creative Commons or Public Domain).
            </p>
          </div>

          <div className="legal-card-box">
            <div className="legal-card-icon-title">
              <CheckCircle size={18} className="legal-card-icon text-green" aria-hidden="true" />
              <h3>3. Statutory Exemptions</h3>
            </div>
            <p>
              Content processed in strict accordance with statutory copyright exceptions recognized in your jurisdiction (such as fair use, fair dealing, or personal private archiving).
            </p>
          </div>

          <div className="legal-card-box">
            <div className="legal-card-icon-title">
              <CheckCircle size={18} className="legal-card-icon text-green" aria-hidden="true" />
              <h3>4. Educational / Analysis</h3>
            </div>
            <p>
              Legitimate format inspection, audio waveform analysis, accessibility transcoding, or educational research permitted under local law.
            </p>
          </div>
        </div>
      </section>

      <section className="legal-section">
        <h2>3. Prohibited &amp; Unacceptable Activities</h2>
        <p>The following activities are strictly prohibited when using the SonicWave Software or Website:</p>
        <ul>
          <li><strong>Unauthorized Downloading of Copyrighted Material:</strong> Downloading commercial music tracks, full-length movies, audiobooks, paywalled podcasts, or television broadcasts without the copyright owner&rsquo;s express authorization.</li>
          <li><strong>Commercial Exploitation:</strong> Selling, licensing, monetizing, or publicly broadcasting media converted or extracted using the Software without a valid commercial license.</li>
          <li><strong>Circumvention of Technological Protections:</strong> Using the Software to defeat, decrypt, or circumvent digital rights management (DRM) or access-control technologies where prohibited by applicable law.</li>
          <li><strong>Mass Harvester / Scraper Abuse:</strong> Utilizing the tool to conduct automated mass scraping, bulk harvesting, or denial-of-service traffic patterns against third-party media platforms.</li>
          <li><strong>False Representation:</strong> Falsely representing or implying that SonicWave has an official partnership, authorization, or affiliation with YouTube, Google, Meta, Instagram, TikTok, Twitter/X, SoundCloud, or any other media platform.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>4. Technical Nature of SonicWave &amp; Hosting Realities</h2>
        <p>
          It is essential to clarify the technical boundaries of what SonicWave does and does not control:
        </p>
        <ul>
          <li><strong>No Cloud Media Repository:</strong> SonicWave does not operate a central server that downloads, transcodes, indexes, or caches user media. The website (<code>https://ytmp-3-five.vercel.app/</code>) is a static showcase and distribution portal.</li>
          <li><strong>Local Execution:</strong> Conversions execute locally on the user&rsquo;s personal computer. Converted files exist only in the user&rsquo;s local <code>server/downloads/</code> directory on their personal drive.</li>
          <li><strong>No Remote File Custody:</strong> The SonicWave project maintainers have no technical visibility into, possession of, or ability to modify or delete files stored locally on an end user&rsquo;s private machine.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>5. Copyright Concerns &amp; Takedown Inquiries</h2>
        <p>
          Because SonicWave does not host, store, or transmit third-party media files, we cannot delete media hosted on third-party platforms (such as YouTube, Vimeo, or SoundCloud). Requests to remove content from those platforms must be directed to the respective hosting provider.
        </p>
        <p>
          However, we take the integrity of our open-source codebase and promotional materials seriously. If you are a copyright owner or authorized agent who believes that any material on the SonicWave <strong>website or repository</strong> (such as documentation, promotional screenshots, or code assets) infringes your copyright, please submit a detailed inquiry containing:
        </p>
        <ol>
          <li>Identification of the copyrighted work claimed to have been infringed;</li>
          <li>Identification of the specific URL, file path, or material on our website or repository that you claim is infringing;</li>
          <li>Sufficient contact information (including your name, email address, and organization);</li>
          <li>A statement that you have a good-faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law;</li>
          <li>A statement made under penalty of perjury that the information in your notification is accurate and that you are authorized to act on behalf of the owner.</li>
        </ol>
        <div className="legal-contact-box">
          <p><strong>Submission Channel:</strong> File a formal inquiry via our GitHub project repository: <a href="https://github.com/ANShKhare-ux/YTMP3/issues" target="_blank" rel="noopener noreferrer">https://github.com/ANShKhare-ux/YTMP3/issues</a></p>
          <p><strong>Notice:</strong> SonicWave does not maintain a statutory registered DMCA agent. Project maintainers review repository inquiries diligently in accordance with open-source project standards.</p>
        </div>
      </section>

      <section className="legal-section">
        <h2>6. Policy Updates</h2>
        <p>
          We may update this Copyright &amp; Acceptable Use Policy from time to time to address emerging legal developments or technological updates. Continued use of the Software or Website signifies acceptance of the updated terms.
        </p>
      </section>
    </LegalLayout>
  );
}

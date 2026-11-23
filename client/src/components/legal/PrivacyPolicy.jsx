import React from 'react';
import LegalLayout from './LegalLayout';
import { useDocumentMetadata } from './useDocumentMetadata';
import { Shield, HardDrive, Globe, Server, Lock, RefreshCw, AlertCircle } from 'lucide-react';

export default function PrivacyPolicy({ onNavigate }) {
  useDocumentMetadata({
    title: 'Privacy Policy : SonicWave Windows Media Converter',
    description: 'Learn how data, local media conversion, storage, and device privacy are handled across the SonicWave website and Windows utility.',
    canonical: 'https://ytmp-3-five.vercel.app/privacy'
  });

  return (
    <LegalLayout activeTab="privacy" onNavigate={onNavigate}>
      <header className="legal-header-block">
        <div className="legal-eyebrow-tag">
          <Shield size={12} aria-hidden="true" />
          <span>DATA TRANSPARENCY &amp; PRIVACY NOTICE</span>
        </div>
        <h1 className="legal-page-h1">Privacy Policy</h1>
        <p className="legal-effective-date">Last Updated: October 27, 2026 &bull; Version 1.0.0</p>
      </header>

      {/* Verified Overview Card */}
      <div className="legal-callout-card">
        <h3 className="legal-callout-title">Summary of Core Privacy Practices</h3>
        <p className="legal-callout-text">
          SonicWave is an open-source media conversion and playback utility. To provide complete transparency, this policy distinguishes the data practices of our public marketing website (hosted on Vercel) from those of the downloadable Windows desktop software (which executes locally on your hardware).
        </p>
        <ul className="legal-summary-points">
          <li><strong>Transparent Advertising &amp; Google AdSense:</strong> To support open-source hosting, continuous integration, and technical documentation maintenance, the public website displays non-intrusive advertisements served through Google AdSense. Third-party vendors, including Google, use cookies to serve ads based on prior visits. Users can opt out of personalized advertising at any time (see Section 4). The downloadable desktop software remains 100% ad-free and tracker-free.</li>
          <li><strong>Local Media Processing:</strong> Media downloading, extraction, and format transcoding in the desktop application are performed locally via <code>yt-dlp</code> and <code>FFmpeg</code> on your personal computer. Media files are not uploaded to a centralized SonicWave server.</li>
          <li><strong>Direct Upstream Requests:</strong> When you request media extraction, your local computer communicates directly with the target content platform (e.g., YouTube, SoundCloud). Those platforms receive your IP address and request headers directly.</li>
          <li><strong>Local Storage Control:</strong> Browser local storage is used strictly for functional state (UI theme and conversion history cache) and can be cleared by the user at any time.</li>
        </ul>
      </div>

      <section className="legal-section">
        <h2>1. Scope &amp; Architecture Overview</h2>
        <p>
          This Privacy Policy applies to the SonicWave website located at <code>https://ytmp-3-five.vercel.app/</code> (the &ldquo;Website&rdquo;) and the SonicWave desktop application and local conversion server (the &ldquo;Application&rdquo;).
        </p>
        <p>
          SonicWave is built with a dual architecture. Understanding where and how your data moves depends on which component you interact with:
        </p>
        <div className="legal-grid-two">
          <div className="legal-card-box">
            <div className="legal-card-icon-title">
              <Globe size={18} className="legal-card-icon" aria-hidden="true" />
              <h3>The Website (Vercel)</h3>
            </div>
            <p>
              A static web deployment providing product documentation, architectural specifications, and the official downloadable package. It does not ingest media or perform server-side conversions.
            </p>
          </div>
          <div className="legal-card-box">
            <div className="legal-card-icon-title">
              <HardDrive size={18} className="legal-card-icon" aria-hidden="true" />
              <h3>The Desktop App (Local PC)</h3>
            </div>
            <p>
              A standalone utility running a local Node.js Express service (<code>localhost:3001</code>) and local child processes (<code>yt-dlp</code> and <code>FFmpeg</code>). Conversions execute directly on your machine.
            </p>
          </div>
        </div>
      </section>

      <section className="legal-section">
        <h2>2. Data Collected by the Website</h2>
        <h3>2.1 Hosting Provider Infrastructure Logs</h3>
        <p>
          The Website is hosted on Vercel Inc. When you visit the Website, Vercel&rsquo;s edge routing servers automatically collect standard HTTP request logs. These logs typically include:
        </p>
        <ul>
          <li>Your Internet Protocol (IP) address;</li>
          <li>Your browser type, version, and operating system (User-Agent string);</li>
          <li>The date and time of the request;</li>
          <li>The referring URL and requested pages;</li>
          <li>HTTP response status and diagnostic network data.</li>
        </ul>
        <p>
          These server-level access logs are processed by Vercel for infrastructure stability, security analysis, DDoS detection, and edge routing compliance, subject to Vercel&rsquo;s Privacy Policy. The SonicWave maintainers do not operate a separate database of website visitor records.
        </p>

        <h3>2.2 Web Analytics &amp; Infrastructure</h3>
        <p>
          The Website uses Vercel Web Analytics (<code>@vercel/analytics</code>) to monitor aggregate visitor volume and page performance. Vercel Web Analytics does not record raw IP addresses, does not store personal data, and does not track users across independent websites. We do not sell visitor data or run clandestine tracking pixels.
        </p>

        <h3>2.3 Website Local Storage Usage</h3>
        <p>
          The Website operates in dark theme and uses browser local storage exclusively for functional UI state (such as audio player preferences or recent documentation bookmarks).
        </p>
      </section>

      <section className="legal-section">
        <h2>3. Data Practices of the Windows Desktop Application</h2>
        <h3>3.1 Local Media Conversion Pipeline</h3>
        <p>
          When you download and launch SonicWave on Windows (via <code>start.bat</code>), all media processing tasks operate through local child processes:
        </p>
        <ul>
          <li><strong>Metadata Resolution:</strong> When you submit a URL from a supported platform, the local <code>yt-dlp</code> binary fetches video metadata (title, artist, duration, thumbnail URL) directly from the source platform.</li>
          <li><strong>Media Extraction:</strong> The media stream is downloaded directly from the source platform to your computer&rsquo;s local storage directory (<code>server/downloads/</code>).</li>
          <li><strong>Audio &amp; Video Muxing:</strong> Local <code>FFmpeg</code> transcodes audio to your chosen format (MP3, WAV, FLAC, M4A) or packages MP4 video. No audio or video data is transmitted to SonicWave developers or external transcoding services.</li>
        </ul>

        <h3>3.2 Direct Communication with Third-Party Media Platforms</h3>
        <p>
          Because SonicWave executes <code>yt-dlp</code> directly on your PC, network connections to target platforms (such as YouTube, SoundCloud, Instagram, TikTok, Twitter/X, and Reddit) are established directly between your computer and those third-party services.
        </p>
        <p>
          Consequently, those platforms receive your IP address, device request headers, and the specific content URL you requested, exactly as if you were visiting that service directly in a browser. Their handling of that network request is governed by their respective terms of service and privacy policies.
        </p>

        <h3>3.3 Optional Cookie Authentication (<code>cookies.txt</code>)</h3>
        <p>
          If you optionally choose to place a <code>cookies.txt</code> file in your local <code>server/</code> folder to bypass platform bot detection or access age-restricted content that you are authorized to view, those session cookies are passed directly by <code>yt-dlp</code> to the target media platform on your behalf.
        </p>
        <p>
          SonicWave never extracts, transmits, or uploads your personal credentials or cookies to external servers. The file remains entirely on your machine.
        </p>

        <h3>3.4 Local Data Storage &amp; Automatic Eviction</h3>
        <p>
          The Application maintains two local data stores to provide an audition player and history:
        </p>
        <ul>
          <li><strong>Temporary Download Cache:</strong> Converted files are stored in <code>server/downloads/</code>. The backend includes an automated disk-cleaning mechanism (<code>cleanOldDownloads</code>) that evicts downloaded files older than 2 hours (120 minutes) to prevent disk saturation.</li>
          <li><strong>Persistent Conversion History:</strong> A record of up to 50 recent conversion titles, formats, thumbnails, and timestamps is stored locally in <code>server/data/history.json</code> and mirrored to browser <code>localStorage</code> (<code>sonicwave_history</code>).</li>
        </ul>
        <p>
          Users can clear their conversion history at any time using the &ldquo;Clear All History&rdquo; option in the converter library or via the Command Palette (<code>Ctrl+K</code>).
        </p>

        <h3>3.5 Engine Updates</h3>
        <p>
          When you invoke the &ldquo;Update Engine&rdquo; command in the Application, SonicWave queries the official public GitHub Releases API for <code>yt-dlp</code> (<code>https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest</code>) to inspect and download the latest verified executable. This communication is governed by GitHub&rsquo;s Privacy Statement.
        </p>
      </section>

      {/* Mandatory Google AdSense & Third-Party Advertising Disclosures */}
      <section className="legal-section">
        <h2>4. Third-Party Advertising, Cookies &amp; Google AdSense Compliance</h2>
        <p>
          To maintain free web hosting, automated build testing, and continuous open-source documentation updates, our public website (<code>https://ytmp-3-five.vercel.app/</code>) delivers non-intrusive standard web advertising served through Google AdSense.
        </p>

        <h3>4.1 Google AdSense &amp; Third-Party Cookies</h3>
        <ul>
          <li>
            <strong>Third-Party Vendors:</strong> Third-party vendors, including Google LLC, use cookies and web beacons to serve advertisements based on a user&rsquo;s prior visits to this website or other websites on the Internet.
          </li>
          <li>
            <strong>Advertising Cookies:</strong> Google&rsquo;s use of advertising cookies (such as DoubleClick and Google advertising cookies) enables it and its partners to serve targeted, relevant ads to our users based on their navigation history across our site and other destinations across the web.
          </li>
          <li>
            <strong>Desktop &amp; Mobile App Exemption:</strong> Advertisements appear exclusively on our public informational website. The downloadable desktop software (<code>SonicWave.exe</code>, portable zip) and Android APK are completely ad-free, contain no tracking beacons, and make no ad network connections.
          </li>
        </ul>

        <h3>4.2 User Opt-Out Choices &amp; Ad Personalization Controls</h3>
        <p>
          Users have complete control over personalized advertising preferences:
        </p>
        <ul>
          <li>
            <strong>Google Ad Settings:</strong> You can opt out of personalized advertising by visiting Google&rsquo;s Ads Settings page: <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">https://www.google.com/settings/ads</a>.
          </li>
          <li>
            <strong>Third-Party Advertising Opt-Out:</strong> Alternatively, you can opt out of a third-party vendor&rsquo;s use of cookies for personalized advertising by visiting the Network Advertising Initiative (NAI) opt-out page at <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">https://www.aboutads.info/choices/</a> or the Digital Advertising Alliance of Canada at <a href="https://youradchoices.ca/" target="_blank" rel="noopener noreferrer">https://youradchoices.ca/</a>.
          </li>
          <li>
            <strong>European EDAA Opt-Out:</strong> Users residing in the European Economic Area (EEA) and the United Kingdom can manage their cookie consent and behavioral advertising preferences at <a href="https://www.youronlinechoices.eu/" target="_blank" rel="noopener noreferrer">https://www.youronlinechoices.eu/</a>.
          </li>
        </ul>
        <p>
          For more information on how Google collects and processes data when you interact with sites using Google AdSense, please review Google&rsquo;s partner policy at <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">How Google uses information from sites or apps that use our services</a>.
        </p>
      </section>

      <section className="legal-section">
        <h2>5. Data Retention &amp; Security</h2>
        <p>
          Because SonicWave does not operate a user account system, cloud database, or centralized file store:
        </p>
        <ul>
          <li>We do not store passwords, user emails, or payment credentials.</li>
          <li>We have no access to the files you convert, the URLs you inspect, or the media stored on your machine.</li>
          <li>You retain full ownership and administrative control over your local Application directory, configuration, and downloaded files.</li>
        </ul>
        <p>
          Child process executions within SonicWave pass explicit argument arrays (via Node.js <code>child_process.execFile</code> and <code>spawn</code>) rather than unescaped shell strings, protecting against command injection vulnerabilities.
        </p>
      </section>

      <section className="legal-section">
        <h2>6. Your Privacy Rights &amp; Choices</h2>
        <p>Depending on your jurisdiction, you have the following rights and capabilities regarding SonicWave:</p>
        <ul>
          <li><strong>Erasing Local Data:</strong> You can wipe all history and stored preferences at any time by clearing your browser&rsquo;s local storage or deleting the <code>server/data/history.json</code> file.</li>
          <li><strong>Deleting Converted Media:</strong> You can delete all media files in <code>server/downloads/</code> manually or let the automated 2-hour TTL eviction routine remove them automatically.</li>
          <li><strong>Disabling Network Activity:</strong> When the Application is closed, no background services or daemons remain running on your computer.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>7. Changes to this Policy</h2>
        <p>
          We may update this Privacy Policy periodically to reflect architectural updates or regulatory changes. Any modifications will be posted to this page with an updated &ldquo;Last Updated&rdquo; timestamp. We encourage users to review this page periodically.
        </p>
      </section>

      <section className="legal-section">
        <h2>8. Privacy Inquiries &amp; Contact</h2>
        <p>
          If you have questions, feedback, or concerns regarding this Privacy Policy or SonicWave&rsquo;s technical data practices, please open an issue or inquiry on our official project repository:
        </p>
        <div className="legal-contact-box">
          <p><strong>Official Maintainer Email:</strong> <a href="mailto:preetiansh16@gmail.com">preetiansh16@gmail.com</a></p>
          <p><strong>Project Repository:</strong> <a href="https://github.com/ANShKhare-ux/YTMP3" target="_blank" rel="noopener noreferrer">https://github.com/ANShKhare-ux/YTMP3</a></p>
          <p><strong>Maintainer Communication:</strong> GitHub Issues &amp; Discussions (<a href="/contact" onClick={(e) => { e.preventDefault(); onNavigate('contact', '/contact'); }}>Contact &amp; Support Page</a>)</p>
        </div>
      </section>
    </LegalLayout>
  );
}

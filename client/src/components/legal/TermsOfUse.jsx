import React from 'react';
import LegalLayout from './LegalLayout';
import { useDocumentMetadata } from './useDocumentMetadata';
import { FileText, ShieldAlert, Cpu, AlertTriangle, Scale, CheckCircle2 } from 'lucide-react';

export default function TermsOfUse({ onNavigate }) {
  useDocumentMetadata({
    title: 'Terms of Use — SonicWave Windows Media Converter',
    description: 'Review the terms of use for SonicWave. Understand permitted personal use, software licensing under MIT, disclaimers, and user responsibilities.',
    canonical: 'https://ytmp-3-five.vercel.app/terms'
  });

  return (
    <LegalLayout activeTab="terms" onNavigate={onNavigate}>
      <header className="legal-header-block">
        <div className="legal-eyebrow-tag">
          <FileText size={12} aria-hidden="true" />
          <span>LEGAL AGREEMENT &amp; USAGE TERMS</span>
        </div>
        <h1 className="legal-page-h1">Terms of Use</h1>
        <p className="legal-effective-date">Last Updated: October 27, 2026 &bull; Version 1.0.0</p>
      </header>

      {/* Overview Callout */}
      <div className="legal-callout-card">
        <h3 className="legal-callout-title">Important Notice Before You Use SonicWave</h3>
        <p className="legal-callout-text">
          SonicWave is an open-source technical utility designed to assist users in extracting, transcoding, and auditioning digital audio and video on their personal computers. By accessing the SonicWave website or downloading, installing, or executing the software, you agree to these Terms of Use and our Copyright &amp; Acceptable Use Policy.
        </p>
        <ul className="legal-summary-points">
          <li><strong>Lawful Personal Use:</strong> You agree to use SonicWave only for content you own, have permission to download, or are authorized to archive under applicable copyright laws.</li>
          <li><strong>Open Source License:</strong> The underlying source code is released under the permissive MIT License.</li>
          <li><strong>No Circumvention Representation:</strong> SonicWave is not represented as granting you any rights or licenses to third-party content.</li>
          <li><strong>Provided &ldquo;As Is&rdquo;:</strong> The software and website are provided without warranties regarding uninterrupted platform availability.</li>
        </ul>
      </div>

      <section className="legal-section">
        <h2>1. Acceptance of Terms</h2>
        <p>
          These Terms of Use (&ldquo;Terms&rdquo;) constitute an agreement between you (&ldquo;User&rdquo; or &ldquo;you&rdquo;) and the SonicWave open-source project and its maintainers (&ldquo;SonicWave&rdquo;, &ldquo;we&rdquo;, or &ldquo;us&rdquo;).
        </p>
        <p>
          By accessing or using the website at <code>https://ytmp-3-five.vercel.app/</code> (the &ldquo;Website&rdquo;), or downloading, cloning, or running the SonicWave desktop bundle and server (the &ldquo;Software&rdquo;), you acknowledge that you have read, understood, and agreed to be bound by these Terms and our <a href="/privacy" onClick={(e) => { e.preventDefault(); onNavigate('privacy', '/privacy'); }}>Privacy Policy</a>. If you do not agree to these Terms, you must discontinue use of the Website and uninstall the Software.
        </p>
      </section>

      <section className="legal-section">
        <h2>2. Open Source Licensing &amp; Ownership</h2>
        <p>
          The SonicWave software codebase and packaging scripts are licensed under the terms of the <strong>MIT License</strong> (Copyright &copy; 2026 Ansh Khare and SonicWave Contributors).
        </p>
        <p>
          You are granted the right to inspect, copy, modify, merge, publish, and distribute copies of the Software in accordance with the MIT License terms. The full license text is maintained in the root <code>LICENSE</code> file of our public repository.
        </p>
        <p>
          Third-party media engines bundled with or called by SonicWave (specifically <code>yt-dlp</code> and <code>FFmpeg</code>) are independent open-source projects governed by their respective licenses (The Unlicense, GPL/LGPL). SonicWave claims no ownership over upstream engines.
        </p>
      </section>

      <section className="legal-section">
        <h2>3. Permitted Use &amp; User Responsibilities</h2>
        <p>
          SonicWave is provided as a general-purpose technical utility for format shifting, offline listening, and personal media archiving. You agree to use the Software and Website strictly in compliance with all applicable local, national, and international laws, regulations, and third-party contracts.
        </p>
        <p>You specifically agree and warrant that:</p>
        <ul>
          <li>You will only access, convert, download, or store content where you are the copyright holder, have obtained express authorization from the rights holder, or where your action is legally permissible under applicable copyright statutes (such as fair use, fair dealing, or personal private archiving exemptions).</li>
          <li>You will respect the terms of service, developer guidelines, and content policies of any third-party platform accessed through the Software (including YouTube, SoundCloud, Instagram, TikTok, and Twitter/X).</li>
          <li>You are solely responsible for all content you choose to fetch, transcode, store, or distribute using the Software.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>4. Prohibited Uses</h2>
        <p>You may not use the Website or Software for any unlawful, infringing, or abusive purpose, including but not limited to:</p>
        <ul>
          <li><strong>Copyright Infringement:</strong> Converting, downloading, or redistributing copyrighted commercial music, movies, audiobooks, or broadcasts without legal right or authorization;</li>
          <li><strong>Commercial Redistribution:</strong> Selling, renting, publicly performing, or broadcasting unauthorized copies of third-party media;</li>
          <li><strong>Abusive Infrastructure Load:</strong> Scripting excessive, parallel, or automated requests intended to flood, disrupt, or impair third-party hosting services or the SonicWave website;</li>
          <li><strong>Malicious Modification:</strong> Distributing altered or trojanized versions of SonicWave containing malware, spyware, unauthorized telemetry, or cryptominers.</li>
        </ul>
        <p>
          For comprehensive intellectual property rules, refer to our <a href="/copyright-acceptable-use" onClick={(e) => { e.preventDefault(); onNavigate('copyright', '/copyright-acceptable-use'); }}>Copyright &amp; Acceptable Use Policy</a>.
        </p>
      </section>

      <section className="legal-section">
        <h2>5. Technical Dependencies &amp; Limitations</h2>
        <p>SonicWave relies on external technologies and platform architectures that are beyond our control:</p>
        <ul>
          <li><strong>Upstream Platform Changes:</strong> Content streaming platforms frequently alter their website structures, authentication mechanisms, and API protocols. These changes can cause media extraction to fail temporarily until upstream <code>yt-dlp</code> definitions are updated.</li>
          <li><strong>No Guarantee of Compatibility:</strong> We do not guarantee that SonicWave will successfully extract media from any specific URL or platform at any given time.</li>
          <li><strong>Local Hardware Performance:</strong> Conversion speed, audio quality, and multi-thread capabilities depend on your personal computer&rsquo;s CPU, RAM, storage throughput, and local internet connection bandwidth.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>6. Disclaimer of Warranties</h2>
        <p>
          TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, THE WEBSITE, SOFTWARE, DOCUMENTATION, AND ALL RELATED SERVICES ARE PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo;, WITHOUT WARRANTY OF ANY KIND, EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE.
        </p>
        <p>
          THE AUTHORS AND CONTRIBUTORS EXPRESSLY DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, ACCURACY, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SOFTWARE WILL BE UNINTERRUPTED, TIMELY, SECURE, ACCURATE, OR ERROR-FREE, OR THAT ANY DEFECTS WILL BE CORRECTED.
        </p>
      </section>

      <section className="legal-section">
        <h2>7. Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED UNDER APPLICABLE LAW, IN NO EVENT SHALL THE AUTHORS, COPYRIGHT HOLDERS, MAINTAINERS, OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, LOSS OF USE, DATA, REVENUE, PROFITS, SYSTEM DAMAGE, OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OR INABILITY TO USE THE SOFTWARE OR WEBSITE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
        </p>
        <p>
          BECAUSE CERTAIN JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN WARRANTIES OR LIABILITIES, PORTIONS OF THE ABOVE LIMITATIONS MAY NOT APPLY TO YOU UNDER LOCAL MANDATORY CONSUMER PROTECTION STATUTES.
        </p>
      </section>

      <section className="legal-section">
        <h2>8. Modifications to Terms</h2>
        <p>
          We reserve the right to revise or update these Terms at any time. When changes occur, we will update the &ldquo;Last Updated&rdquo; date at the top of this page. Your continued use of the Website or Software after any such update constitutes your acceptance of the revised Terms.
        </p>
      </section>

      <section className="legal-section">
        <h2>9. Contact &amp; Questions</h2>
        <p>
          For questions, technical clarifications, or contributions related to these Terms of Use, please refer to our <a href="/contact" onClick={(e) => { e.preventDefault(); onNavigate('contact', '/contact'); }}>Contact &amp; Support Page</a> or open an inquiry on our public repository:
        </p>
        <div className="legal-contact-box">
          <p><strong>GitHub Repository:</strong> <a href="https://github.com/ANShKhare-ux/YTMP3" target="_blank" rel="noopener noreferrer">https://github.com/ANShKhare-ux/YTMP3</a></p>
        </div>
      </section>
    </LegalLayout>
  );
}

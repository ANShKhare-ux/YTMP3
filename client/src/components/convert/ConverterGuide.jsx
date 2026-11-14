import React, { useState } from 'react';
import DocsLayout from '../docs/DocsLayout';
import { CONVERTER_GUIDES } from './converterData';
import { useDocumentMetadata } from '../legal/useDocumentMetadata';
import { triggerZipDownload } from '../DownloadSuccessModal';
import DownloadSuccessModal from '../DownloadSuccessModal';
import {
  Download,
  Zap,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Layers,
  ArrowRight
} from 'lucide-react';

function WindowsIcon({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.801" />
    </svg>
  );
}

export default function ConverterGuide({ slug = 'youtube-to-mp3', onNavigate }) {
  const guide = CONVERTER_GUIDES[slug] || CONVERTER_GUIDES['youtube-to-mp3'];
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  useDocumentMetadata({
    title: guide.metaTitle,
    description: guide.metaDescription,
    canonical: guide.canonical
  });

  const handleDownload = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    triggerZipDownload();
    setIsDownloadModalOpen(true);
  };

  const handleGuideSwitch = (e, targetSlug) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(`convert-${targetSlug}`, `/convert/${targetSlug}`);
    } else {
      window.location.href = `/convert/${targetSlug}`;
    }
  };

  // Structured Data (HowTo & FAQPage)
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        '@id': `${guide.canonical}#article`,
        'headline': guide.title,
        'description': guide.metaDescription,
        'url': guide.canonical,
        'inLanguage': 'en-US',
        'publisher': {
          '@type': 'Organization',
          'name': 'SonicWave',
          'url': 'https://ytmp-3-five.vercel.app/'
        }
      },
      {
        '@type': 'HowTo',
        '@id': `${guide.canonical}#howto`,
        'name': `How to convert with SonicWave: ${guide.title}`,
        'description': guide.summary,
        'step': guide.steps.map((s) => ({
          '@type': 'HowToStep',
          'position': s.step,
          'name': s.title,
          'text': s.text
        }))
      },
      {
        '@type': 'FAQPage',
        '@id': `${guide.canonical}#faq`,
        'mainEntity': guide.faqs.map((f) => ({
          '@type': 'Question',
          'name': f.q,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': f.a
          }
        }))
      }
    ]
  };

  return (
    <DocsLayout activeTab="converters" onNavigate={onNavigate}>
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Conversion Category Selector Tabs */}
      <nav className="converter-subnav" aria-label="Conversion Guide Switcher" style={{ marginBottom: 28, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {Object.values(CONVERTER_GUIDES).map((item) => {
          const isActive = item.slug === guide.slug;
          return (
            <a
              key={item.slug}
              href={`/convert/${item.slug}`}
              onClick={(e) => handleGuideSwitch(e, item.slug)}
              className={`cursor-button-secondary ${isActive ? 'active-guide-btn' : ''}`}
              style={{
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                borderRadius: 8,
                backgroundColor: isActive ? 'var(--cursor-primary-bg, rgba(94, 106, 210, 0.15))' : 'var(--cursor-surface)',
                color: isActive ? 'var(--cursor-primary-text, #96a1ff)' : 'var(--cursor-subtle)',
                border: isActive ? '1px solid var(--cursor-primary-border, #5e6ad2)' : '1px solid var(--cursor-hairline)'
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.navLabel}
            </a>
          );
        })}
      </nav>

      {/* Page Header */}
      <div className="legal-header-block">
        <div className="legal-eyebrow-tag">{guide.eyebrow}</div>
        <h1 className="legal-page-h1">{guide.title}</h1>
        <p className="legal-effective-date">
          Official SonicWave Extraction Guide &bull; {guide.badge}
        </p>
      </div>

      {/* AI & Executive Citable Answer Box */}
      <div className="legal-callout-card" style={{ borderLeft: '3px solid var(--cursor-primary-border, #5e6ad2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Sparkles size={16} color="var(--cursor-primary-text, #96a1ff)" aria-hidden="true" />
          <h2 className="legal-callout-title" style={{ margin: 0, fontSize: 15 }}>
            Direct Summary &bull; Citable Answer
          </h2>
        </div>
        <p className="legal-callout-text" style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--cursor-ink)' }}>
          {guide.summary}
        </p>
      </div>

      {/* Lead Narrative */}
      <section className="legal-section" style={{ marginTop: 24 }}>
        <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--cursor-subtle)' }}>
          {guide.leadParagraph}
        </p>
      </section>

      {/* Action Banner Card */}
      <div
        className="cursor-card-spotlight"
        style={{
          margin: '28px 0',
          padding: '24px 28px',
          borderRadius: 12,
          border: '1px solid var(--cursor-hairline-strong)',
          background: 'var(--cursor-surface)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: 18, fontWeight: 600, color: 'var(--cursor-ink)' }}>
              Convert Locally on Windows (100% Free &amp; Ad-Free)
            </h3>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--cursor-subtle)' }}>
              Portable 1.3 MB ZIP &bull; No installation or cloud dependencies required &bull; Self-bootstrapping FFmpeg
            </p>
          </div>
          <button
            type="button"
            className="cursor-button-primary"
            onClick={handleDownload}
            style={{ padding: '10px 20px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <WindowsIcon size={16} />
            <span>Download SonicWave (.zip)</span>
          </button>
        </div>
      </div>

      {/* Section 1: Technical Specifications */}
      <section className="legal-section">
        <h2>1. Engine &amp; Codec Specifications</h2>
        <p>
          SonicWave coordinates low-level <code>yt-dlp</code> stream retrieval and <code>FFmpeg 6.1.1</code> transcode pipelines to ensure acoustic purity:
        </p>

        <div style={{ overflowX: 'auto', margin: '20px 0' }}>
          <table className="legal-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--cursor-hairline-strong)', color: 'var(--cursor-ink)' }}>
                <th style={{ padding: '12px 14px', width: '35%' }}>Technical Property</th>
                <th style={{ padding: '12px 14px' }}>SonicWave Implementation</th>
              </tr>
            </thead>
            <tbody>
              {guide.techSpecs.map((spec, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--cursor-hairline)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--cursor-ink)' }}>
                    {spec.label}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--cursor-subtle)' }}>
                    <code>{spec.value}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 2: SonicWave vs Cloud Web Converters */}
      <section className="legal-section">
        <h2>2. Benchmark Comparison: SonicWave vs. Cloud Web Converters</h2>
        <p>
          Why discerning audio engineers, music producers, and video creators avoid cloud-based converter websites:
        </p>

        <div style={{ overflowX: 'auto', margin: '20px 0' }}>
          <table className="legal-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--cursor-hairline-strong)', color: 'var(--cursor-ink)' }}>
                <th style={{ padding: '12px 14px' }}>Feature / Capability</th>
                <th style={{ padding: '12px 14px', color: 'var(--cursor-semantic-success, #1ed760)' }}>
                  SonicWave (Local)
                </th>
                <th style={{ padding: '12px 14px', color: 'var(--cursor-subtle)' }}>
                  Typical Web Converters
                </th>
              </tr>
            </thead>
            <tbody>
              {guide.comparison.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--cursor-hairline)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--cursor-ink)' }}>
                    {row.feature}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--cursor-ink)', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={14} color="#1ed760" aria-hidden="true" />
                      <span>{row.sonicWave}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--cursor-subtle)' }}>
                    {row.cloud}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 3: Step-by-Step Conversion Walkthrough */}
      <section className="legal-section">
        <h2>3. Step-by-Step Conversion Tutorial</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          {guide.steps.map((st) => (
            <div
              key={st.step}
              style={{
                display: 'flex',
                gap: 16,
                padding: '16px 20px',
                borderRadius: 10,
                border: '1px solid var(--cursor-hairline)',
                background: 'var(--cursor-surface-subtle)'
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: 'var(--cursor-primary-bg, rgba(94, 106, 210, 0.2))',
                  color: 'var(--cursor-primary-text, #96a1ff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0
                }}
              >
                {st.step}
              </div>
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: 15, fontWeight: 600, color: 'var(--cursor-ink)' }}>
                  {st.title}
                </h3>
                <p style={{ margin: 0, fontSize: 13.5, color: 'var(--cursor-subtle)', lineHeight: 1.55 }}>
                  {st.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4: Frequently Asked Questions */}
      <section className="legal-section">
        <h2>4. Frequently Asked Questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
          {guide.faqs.map((faq, idx) => (
            <details
              key={idx}
              className="legal-faq-item"
              style={{
                border: '1px solid var(--cursor-hairline)',
                borderRadius: 8,
                padding: '14px 18px',
                background: 'var(--cursor-surface)'
              }}
            >
              <summary
                style={{
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14.5,
                  color: 'var(--cursor-ink)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <HelpCircle size={15} color="var(--cursor-primary-text, #96a1ff)" aria-hidden="true" />
                <span>{faq.q}</span>
              </summary>
              <p
                style={{
                  margin: '12px 0 0 23px',
                  fontSize: 13.5,
                  color: 'var(--cursor-subtle)',
                  lineHeight: 1.6
                }}
              >
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Cross-linking to other guides */}
      <section className="legal-section" style={{ borderTop: '1px solid var(--cursor-hairline)', paddingTop: 28, marginTop: 36 }}>
        <h2>Explore More Conversion Guides</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 16 }}>
          {Object.values(CONVERTER_GUIDES)
            .filter((g) => g.slug !== guide.slug)
            .map((other) => (
              <a
                key={other.slug}
                href={`/convert/${other.slug}`}
                onClick={(e) => handleGuideSwitch(e, other.slug)}
                className="cursor-card-spotlight"
                style={{
                  padding: '14px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--cursor-hairline)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textDecoration: 'none',
                  color: 'var(--cursor-ink)'
                }}
              >
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{other.navLabel}</div>
                  <div style={{ fontSize: 12, color: 'var(--cursor-tertiary)' }}>{other.badge}</div>
                </div>
                <ArrowRight size={14} color="var(--cursor-subtle)" aria-hidden="true" />
              </a>
            ))}
        </div>
      </section>

      {/* Download Success Dialog */}
      <DownloadSuccessModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        onNavigate={onNavigate}
      />
    </DocsLayout>
  );
}

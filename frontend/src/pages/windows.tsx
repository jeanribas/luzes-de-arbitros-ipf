import Link from 'next/link';
import { useRouter } from 'next/router';

import { FooterBadges } from '@/components/FooterBadges';
import { getMessages } from '@/lib/i18n/messages';
import { type AppLocale } from '@/lib/i18n/config';
import { Seo } from '@/components/Seo';

export default function WindowsPage() {
  const router = useRouter();
  const locale = (router.locale ?? 'pt-BR') as AppLocale;
  const messages = getMessages(locale);
  const t = messages.windows;

  return (
    <>
      <Seo
        title={`Referee Lights · ${t.metaTitle}`}
        description={t.metaDescription}
        canonicalPath="/windows"
      />

      <div
        style={{
          minHeight: '100vh',
          background: '#020617',
          color: '#f1f5f9',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        }}
      >
        {/* Nav */}
        <nav
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            background: 'rgba(2,6,23,0.85)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid #1e293b',
            padding: '0 24px',
          }}
        >
          <div
            style={{
              maxWidth: 800,
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: 56,
            }}
          >
            <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.85rem' }}>
              &larr; {t.backHome}
            </Link>
            <a
              href="https://github.com/jeanribas/referee-lights/releases"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'linear-gradient(to right, #0ea5e9, #6366f1, #3b82f6)',
                color: '#fff',
                padding: '6px 16px',
                borderRadius: 16,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
              }}
            >
              {t.cta}
            </a>
          </div>
        </nav>

        {/* Header */}
        <section style={{ padding: '60px 24px 40px', textAlign: 'center' }}>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            {/* Windows icon */}
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="#0ea5e9" style={{ display: 'inline-block' }}>
                <path d="M3 12V6.75l8-1.25V12H3zm0 .5h8v6.5l-8-1.25V12.5zm9-7L22 4v8.5H12V5.5zm0 7.5h10V20l-10-1.5V13z" />
              </svg>
            </div>
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: 12 }}>
              {t.title}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: 500, margin: '0 auto' }}>
              {t.subtitle}
            </p>
          </div>
        </section>

        {/* Steps */}
        <section style={{ padding: '0 24px 48px' }}>
          <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {t.steps.map((step, i) => (
              <div
                key={i}
                style={{
                  background: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: 12,
                  padding: '24px 24px',
                  display: 'flex',
                  gap: 16,
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    minWidth: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1rem',
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>
                    {step.title}
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Requirements */}
        <section style={{ padding: '48px 24px', background: '#0a0f1a' }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 20 }}>
              {t.requirements.title}
            </h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {t.requirements.items.map((item, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    color: '#cbd5e1',
                    fontSize: '0.9rem',
                  }}
                >
                  <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>&#10003;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Troubleshooting */}
        <section style={{ padding: '48px 24px' }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 20 }}>
              {t.troubleshooting.title}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {t.troubleshooting.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: 12,
                    padding: 20,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 6, fontSize: '0.95rem' }}>
                    {item.q}
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '48px 24px 64px', textAlign: 'center' }}>
          <a
            href="https://github.com/jeanribas/referee-lights/releases"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'linear-gradient(to right, #0ea5e9, #6366f1, #3b82f6)',
              color: '#fff',
              padding: '14px 32px',
              borderRadius: 16,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              display: 'inline-block',
            }}
          >
            {t.cta}
          </a>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid #1e293b', padding: 24, textAlign: 'center' }}>
          <FooterBadges alwaysVisible />
        </footer>
      </div>
    </>
  );
}

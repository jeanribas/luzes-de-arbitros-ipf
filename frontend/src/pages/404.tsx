import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import type { AppLocale } from '@/lib/i18n/config';
import { getMessages } from '@/lib/i18n/messages';

const t404: Record<string, { title: string; desc: string; back: string }> = {
  'pt-BR': {
    title: 'Página não encontrada',
    desc: 'A página que você procura não existe ou foi movida.',
    back: 'Voltar para o início',
  },
  'en-US': {
    title: 'Page not found',
    desc: 'The page you are looking for doesn\'t exist or has been moved.',
    back: 'Back to home',
  },
  'es-ES': {
    title: 'Página no encontrada',
    desc: 'La página que buscas no existe o fue movida.',
    back: 'Volver al inicio',
  },
};

export default function Custom404() {
  const router = useRouter();
  const locale = (router.locale ?? 'pt-BR') as AppLocale;
  const messages = getMessages(locale);
  const t = t404[locale] ?? t404['pt-BR'];

  return (
    <>
      <Head>
        <title>404 · Referee Lights</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div
        style={{
          minHeight: '100vh',
          background: '#020617',
          color: '#f1f5f9',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Nav (same as home) ── */}
        <nav
          style={{
            background: 'rgba(2,6,23,0.85)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid #1e293b',
            padding: '0 12px',
          }}
        >
          <div
            style={{
              maxWidth: 1000,
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: 56,
            }}
          >
            <Link href="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
              <div style={{ display: 'flex', gap: 5 }}>
                <div style={{ width: 28, height: 28, borderRadius: 4, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div style={{ width: 28, height: 28, borderRadius: 4, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round"><line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" /></svg>
                </div>
                <div style={{ width: 28, height: 28, borderRadius: 4, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'baseline', fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em', textTransform: 'uppercase' as const, fontSize: '0.7rem', lineHeight: 1 }}>
                <span style={{ fontWeight: 700, color: '#fff' }}>Referee</span>
                <span style={{ fontWeight: 900, color: '#ef4444' }}>Lights</span>
              </div>
            </Link>
            <Link
              href="/admin"
              style={{
                background: 'linear-gradient(to right, #0ea5e9, #6366f1, #3b82f6)',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: 16,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
              }}
            >
              {messages.home.ctaAdmin}
            </Link>
          </div>
        </nav>

        {/* ── Content ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '40px 24px',
            background:
              'radial-gradient(ellipse at 50% 40%, rgba(239,68,68,0.08) 0%, transparent 60%)',
          }}
        >
          <div style={{ maxWidth: 480 }}>
            <div
              style={{
                fontSize: 'clamp(4rem, 10vw, 6rem)',
                fontWeight: 900,
                letterSpacing: '-0.04em',
                background: 'linear-gradient(135deg, #ef4444, #6366f1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1,
                marginBottom: 16,
              }}
            >
              404
            </div>
            <h1
              style={{
                fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              {t.title}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: 32, lineHeight: 1.6 }}>
              {t.desc}
            </p>
            <Link
              href="/"
              style={{
                background: 'linear-gradient(to right, #0ea5e9, #6366f1, #3b82f6)',
                color: '#fff',
                padding: '14px 28px',
                borderRadius: 16,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                display: 'inline-block',
              }}
            >
              {t.back}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

const DEFAULT_TITLE = 'Referee Lights · IPF Referee Lighting Platform';
const DEFAULT_DESCRIPTION =
  'Referee Lights sincroniza painel administrativo, display principal, legenda e consoles de árbitros para eventos IPF com PIN e QR Codes dinâmicos.';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://luzes-ipf.assist.com.br';

export const SEO_DEFAULTS = {
  siteName: 'Referee Lights',
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  twitterHandle: '@refereelights',
  themeColor: '#0B1628'
} as const;


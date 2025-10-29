import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

import { APP_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n/config';
import { SEO_DEFAULTS, SITE_URL } from '@/lib/seo/config';

type SeoProps = {
  title?: string;
  description?: string;
  canonicalPath?: string;
  image?: {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
    type?: string;
  };
  noIndex?: boolean;
};

export function Seo({ title, description, canonicalPath, image, noIndex }: SeoProps) {
  const router = useRouter();

  const locale = typeof router.locale === 'string' ? router.locale : DEFAULT_LOCALE;
  const resolvedTitle = title ?? SEO_DEFAULTS.title;
  const resolvedDescription = description ?? SEO_DEFAULTS.description;
  const rawPath = canonicalPath ?? router.asPath ?? '/';
  const pathWithoutQuery = rawPath.split('#')[0]?.split('?')[0] ?? '/';

  const normalizedPath = pathWithoutLocale(pathWithoutQuery);
  const localizedPath = buildLocalizedPath(locale, normalizedPath);
  const canonicalUrl = `${SITE_URL}${localizedPath}`;

  const alternates = useMemo(
    () =>
      APP_LOCALES.map((code) => {
        const href = `${SITE_URL}${buildLocalizedPath(code, normalizedPath)}`;
        return { hrefLang: code, href };
      }),
    [normalizedPath]
  );

  return (
    <Head>
      <title key="title">{resolvedTitle}</title>
      <meta key="description" name="description" content={resolvedDescription} />
      <meta key="og:site_name" property="og:site_name" content={SEO_DEFAULTS.siteName} />
      <meta key="og:title" property="og:title" content={resolvedTitle} />
      <meta key="og:description" property="og:description" content={resolvedDescription} />
      <meta key="og:url" property="og:url" content={canonicalUrl} />
      <meta key="og:locale" property="og:locale" content={locale} />
      <meta key="og:type" property="og:type" content="website" />
      <meta key="twitter:card" name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta key="twitter:title" name="twitter:title" content={resolvedTitle} />
      <meta key="twitter:description" name="twitter:description" content={resolvedDescription} />
      {SEO_DEFAULTS.twitterHandle ? (
        <meta key="twitter:site" name="twitter:site" content={SEO_DEFAULTS.twitterHandle} />
      ) : null}
      <link key="canonical" rel="canonical" href={canonicalUrl} />
      <meta key="theme-color" name="theme-color" content={SEO_DEFAULTS.themeColor} />
      {image ? (
        <>
          <meta key="og:image" property="og:image" content={image.url} />
          {image.type ? <meta key="og:image:type" property="og:image:type" content={image.type} /> : null}
          {image.width ? (
            <meta key="og:image:width" property="og:image:width" content={image.width.toString()} />
          ) : null}
          {image.height ? (
            <meta key="og:image:height" property="og:image:height" content={image.height.toString()} />
          ) : null}
          {image.alt ? <meta key="og:image:alt" property="og:image:alt" content={image.alt} /> : null}
          <meta key="twitter:image" name="twitter:image" content={image.url} />
          {image.alt ? <meta key="twitter:image:alt" name="twitter:image:alt" content={image.alt} /> : null}
        </>
      ) : null}
      {noIndex ? <meta key="robots" name="robots" content="noindex,nofollow" /> : null}
      {alternates.map((alt) => (
        <link key={`alt-${alt.hrefLang}`} rel="alternate" hrefLang={alt.hrefLang} href={alt.href} />
      ))}
      <link key="alt-x-default" rel="alternate" hrefLang="x-default" href={`${SITE_URL}${normalizedPath}`} />
    </Head>
  );
}

function buildLocalizedPath(locale: string, normalizedPath: string) {
  if (!normalizedPath || normalizedPath === '/') {
    return `/${locale}`;
  }
  return `/${locale}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`;
}

function pathWithoutLocale(path: string) {
  const cleaned = path.startsWith('/') ? path : `/${path}`;
  const matcher = new RegExp(`^/(?:${APP_LOCALES.join('|')})(/|$)`, 'i');
  return cleaned.replace(matcher, '/');
}

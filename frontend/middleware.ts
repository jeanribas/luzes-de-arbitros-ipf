import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { APP_LOCALES, DEFAULT_LOCALE } from './src/lib/i18n/config';

const LOCALES = APP_LOCALES;

const isPublicAsset = (pathname: string) => {
  if (pathname.startsWith('/_next')) return true;
  if (pathname.startsWith('/api')) return true;
  if (pathname.includes('.')) return true;
  return false;
};

const detectLocaleFromHeader = (headerValue: string | null) => {
  if (!headerValue) return undefined;

  const negotiatedLocale = headerValue
    .split(',')
    .map((entry) => entry.split(';')[0]?.trim())
    .find((language) => Boolean(language) && LOCALES.includes(language as typeof LOCALES[number]));

  if (negotiatedLocale && LOCALES.includes(negotiatedLocale as typeof LOCALES[number])) {
    return negotiatedLocale;
  }
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicAsset(pathname)) return NextResponse.next();

  const hasLocale = LOCALES.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
  if (hasLocale) return NextResponse.next();

  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  const headerLocale = detectLocaleFromHeader(request.headers.get('accept-language'));
  const locale = (cookieLocale && LOCALES.includes(cookieLocale as typeof LOCALES[number]))
    ? cookieLocale
    : headerLocale ?? DEFAULT_LOCALE;

  const response = NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
  response.cookies.set('NEXT_LOCALE', locale, { path: '/' });

  return response;
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)']
};

import type { AppProps } from 'next/app';
import { Analytics } from '@vercel/analytics/next';

import { Seo } from '@/components/Seo';

import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Seo />
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

import { getMessages } from '@/lib/i18n/messages';

export default function RefIndex() {
  const router = useRouter();
  const locale = typeof router.locale === 'string' ? router.locale : undefined;
  const messages = useMemo(() => getMessages(locale), [locale]);
  const refereeMessages = messages.referee;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-6 py-8 text-slate-100">
      <h1 className="text-lg font-semibold uppercase tracking-[0.4em]">{refereeMessages.selectorTitle}</h1>
      <div className="flex flex-col gap-4 text-center text-sm uppercase tracking-[0.3em]">
        <Link className="rounded-xl border border-slate-700 px-6 py-3" href="/ref/left">
          {refereeMessages.side.leftTitle}
        </Link>
        <Link className="rounded-xl border border-slate-700 px-6 py-3" href="/ref/center">
          {refereeMessages.center.title}
        </Link>
        <Link className="rounded-xl border border-slate-700 px-6 py-3" href="/ref/right">
          {refereeMessages.side.rightTitle}
        </Link>
      </div>
    </main>
  );
}

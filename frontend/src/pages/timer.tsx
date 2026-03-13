import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';

import { Seo } from '@/components/Seo';
import { FooterBadges } from '@/components/FooterBadges';
import IntervalCountdown from '@/components/IntervalCountdown';
import IntervalFull from '@/components/IntervalFull';
import TimerDisplay from '@/components/TimerDisplay';
import { useRoomSocket } from '@/hooks/useRoomSocket';
import { getMessages, type Messages } from '@/lib/i18n/messages';

export default function TimerPage() {
  const router = useRouter();
  const locale = typeof router.locale === 'string' ? router.locale : undefined;
  const messages = useMemo(() => getMessages(locale), [locale]);
  const displayMessages = messages.display;
  const commonMessages = messages.common;
  const roomId = typeof router.query.roomId === 'string' ? router.query.roomId : undefined;
  const adminPin = typeof router.query.pin === 'string' ? router.query.pin : undefined;

  const { state, error } = useRoomSocket('display', { roomId, adminPin });

  const intervalVisible = Boolean(
    state && state.intervalVisible && state.intervalConfiguredMs > 0 && state.intervalMs > 0
  );

  useEffect(() => {
    if (!router.isReady) return;
    const targetLocale = state?.locale;
    if (!targetLocale) return;
    if (router.locale === targetLocale) return;
    document.cookie = `NEXT_LOCALE=${targetLocale}; path=/; max-age=31536000`;
    void router.replace({ pathname: router.pathname, query: router.query }, undefined, { locale: targetLocale });
  }, [router, state?.locale]);

  if (!roomId || !adminPin) {
    return <MissingTimerCredentials messages={displayMessages} />;
  }

  return (
    <>
      <Seo
        title="Referee Lights · Timer"
        description="Quadro dedicado do cronômetro da plataforma Referee Lights."
        canonicalPath="/timer"
        noIndex
      />
      <main className="relative flex min-h-screen items-center justify-center bg-black px-6 py-8 text-white">
        {intervalVisible && state ? (
          <IntervalFull
            intervalMs={state.intervalMs}
            configuredMs={state.intervalConfiguredMs}
            running={state.intervalRunning}
            labels={displayMessages.interval}
          />
        ) : state ? (
          <div className="flex flex-col items-center gap-8">
            {state && (state.intervalConfiguredMs > 0 || state.intervalMs > 0) && state.intervalVisible && (
              <IntervalCountdown
                intervalMs={state.intervalMs}
                configuredMs={state.intervalConfiguredMs}
                running={state.intervalRunning}
                labels={displayMessages.countdown}
              />
            )}
            <TimerDisplay
              variant="display"
              remainingMs={state.timerMs}
              running={state.running}
              phase={state.phase}
            />
          </div>
        ) : (
          <p className="text-sm uppercase tracking-[0.4em] text-slate-400">{displayMessages.status.waiting}</p>
        )}
        <div className="fixed bottom-2 left-1/2 -translate-x-1/2 opacity-60 hover:opacity-100 transition">
          <FooterBadges />
        </div>
      </main>
      {error && <StatusBanner message={error} errors={commonMessages.errors} />}
    </>
  );
}

function StatusBanner({ message, errors }: { message: string; errors: Record<string, string> }) {
  const text = errors[message] ?? message;
  return (
    <div className="fixed left-1/2 top-6 z-40 -translate-x-1/2 rounded-full border border-white/20 bg-white/15 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
      {text}
    </div>
  );
}

function MissingTimerCredentials({ messages }: { messages: Messages['display'] }) {
  const translatedDescription = messages.missing.description.replace('/display?', '/timer?');
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 py-12 text-center text-white">
      <h1 className="text-2xl font-semibold uppercase tracking-[0.45em]">{messages.missing.title}</h1>
      <p className="max-w-xl text-sm text-white/70">{translatedDescription}</p>
      <Link
        href="/admin"
        className="rounded-full border border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/10"
      >
        {messages.missing.goToAdmin}
      </Link>
    </main>
  );
}

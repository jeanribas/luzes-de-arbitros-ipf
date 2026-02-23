import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';

import { DecisionLights } from '@/components/DecisionLights';
import IntervalCountdown from '@/components/IntervalCountdown';
import IntervalFull from '@/components/IntervalFull';
import { Seo } from '@/components/Seo';
import TimerDisplay from '@/components/TimerDisplay';
import { useEasyLifterBridge } from '@/hooks/useEasyLifterBridge';
import { useIntegrationConfig } from '@/hooks/useIntegrationConfig';
import { readQueryByKeys, readQueryValue, resolveEasyLifterSource } from '@/lib/easyLifterSource';
import { getMessages } from '@/lib/i18n/messages';

export default function IntegrationDisplayPage() {
  const router = useRouter();
  const locale = typeof router.locale === 'string' ? router.locale : undefined;
  const messages = useMemo(() => getMessages(locale), [locale]);
  const displayMessages = messages.display;
  const commonMessages = messages.common;
  const integrationMessages = commonMessages.integration;

  const roomId = readQueryByKeys(router.query, ['roomId', 'roomid', 'room']);
  const externalUrl = readQueryValue(router.query.externalUrl);
  const externalMeet = readQueryValue(router.query.externalMeet) ?? readQueryValue(router.query.meet);
  const externalOrigin = readQueryValue(router.query.externalOrigin);
  const { config: savedIntegration, loading: savedIntegrationLoading, error: savedIntegrationError } =
    useIntegrationConfig(roomId);

  const effectiveExternalUrl = externalUrl ?? savedIntegration?.externalUrl;
  const effectiveExternalMeet = externalMeet ?? savedIntegration?.meetCode;
  const effectiveExternalOrigin = externalOrigin ?? savedIntegration?.origin;

  const externalSource = useMemo(
    () => resolveEasyLifterSource(effectiveExternalUrl, effectiveExternalMeet, effectiveExternalOrigin),
    [effectiveExternalMeet, effectiveExternalOrigin, effectiveExternalUrl]
  );

  const { state, error: externalError } = useEasyLifterBridge({
    enabled: externalSource.enabled && !externalSource.error,
    meetCode: externalSource.meetCode,
    origin: externalSource.origin,
    crossTabSync: false
  });

  const error = externalSource.error ?? externalError ?? savedIntegrationError;
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

  if (!externalSource.enabled && savedIntegrationLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 py-12 text-center text-white">
        <p className="text-sm uppercase tracking-[0.4em] text-slate-400">{displayMessages.status.waiting}</p>
      </main>
    );
  }

  if (!externalSource.enabled) {
    return <MissingIntegrationSource integration={integrationMessages} />;
  }

  if (externalSource.error) {
    return (
      <MissingExternalSourceConfig
        message={externalSource.error}
        integration={integrationMessages}
        errors={commonMessages.errors}
      />
    );
  }

  return (
    <>
      <Seo
        title="Referee Lights · Integration Display"
        description={displayMessages.metaDescription ?? 'External integration display.'}
        canonicalPath="/integration/display"
        noIndex
      />
      <main className="relative flex min-h-screen flex-col bg-black px-6 pt-10 pb-6 text-white">
        {intervalVisible && state ? (
          <div className="flex flex-1 items-center justify-center">
            <IntervalFull
              intervalMs={state.intervalMs}
              configuredMs={state.intervalConfiguredMs}
              running={state.intervalRunning}
              labels={displayMessages.interval}
            />
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-40">
            <div className="flex w-full justify-center">
              {state ? (
                <DecisionLights state={state} showLightPlaceholders={false} forceConnectedPlaceholders />
              ) : (
                <p className="text-sm uppercase tracking-[0.4em] text-slate-400">
                  {displayMessages.status.waiting}
                </p>
              )}
            </div>
            <div className="flex flex-col items-center gap-10">
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
                remainingMs={state?.timerMs ?? 60_000}
                running={state?.running ?? false}
                phase={state?.phase ?? 'idle'}
              />
            </div>
          </div>
        )}
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

function MissingIntegrationSource({ integration }: { integration: ReturnType<typeof getMessages>['common']['integration'] }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 py-12 text-center text-white">
      <h1 className="text-2xl font-semibold uppercase tracking-[0.45em]">{integration.missingTitle}</h1>
      <p className="max-w-xl text-sm text-white/70">{integration.missingHint}</p>
      <p className="max-w-xl text-xs text-white/50">
        {integration.exampleLabel}: <code>/integration/display?externalUrl=https://easyliftersoftware.com/referee/lights?meet=3NJH7Y53</code>
      </p>
    </main>
  );
}

function MissingExternalSourceConfig({
  message,
  integration,
  errors
}: {
  message: string;
  integration: ReturnType<typeof getMessages>['common']['integration'];
  errors: Record<string, string>;
}) {
  const text = errors[message] ?? message;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 py-12 text-center text-white">
      <h1 className="text-2xl font-semibold uppercase tracking-[0.45em]">{integration.invalidSourceTitle}</h1>
      <p className="max-w-xl text-sm text-white/70">{text}</p>
      <p className="max-w-xl text-xs text-white/50">
        {integration.exampleLabel}: <code>/integration/display?externalUrl=https://easyliftersoftware.com/referee/lights?meet=3NJH7Y53</code>
      </p>
    </main>
  );
}

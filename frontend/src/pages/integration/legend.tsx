import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

import { DecisionLights } from '@/components/DecisionLights';
import { Seo } from '@/components/Seo';
import { useEasyLifterBridge } from '@/hooks/useEasyLifterBridge';
import { useIntegrationConfig } from '@/hooks/useIntegrationConfig';
import { useWakeLock } from '@/hooks/useWakeLock';
import { readQueryByKeys, readQueryValue, resolveEasyLifterSource } from '@/lib/easyLifterSource';
import { getMessages } from '@/lib/i18n/messages';

const DEFAULT_LEGEND_BG = 'transparent';
const COLOR_PRESETS = ['#000B1E', '#000000', '#0B0B0B', '#012A4A', '#111723', '#1A1A20'];

export default function IntegrationLegendPage() {
  const router = useRouter();
  const locale = typeof router.locale === 'string' ? router.locale : undefined;
  const messages = useMemo(() => getMessages(locale), [locale]);
  const legendMessages = messages.legend;
  const commonMessages = messages.common;
  const displayMessages = messages.display;
  const integrationMessages = commonMessages.integration;

  const roomId = readQueryByKeys(router.query, ['roomId', 'roomid', 'room']);
  const viewMode = readQueryValue(router.query.view);
  const isShareView = viewMode === 'share';
  const externalUrl = readQueryValue(router.query.externalUrl);
  const externalMeet = readQueryValue(router.query.externalMeet) ?? readQueryValue(router.query.meet);
  const externalOrigin = readQueryValue(router.query.externalOrigin);
  const legendBgQuery = readQueryValue(router.query.legendBg);
  const legendTimerQuery = readQueryValue(router.query.legendTimer);
  const legendDigitsQuery = readQueryValue(router.query.legendDigits);
  const legendPlaceholdersQuery = readQueryValue(router.query.legendPlaceholders);
  const legendFrameQuery = readQueryValue(router.query.legendFrame);

  const { config: savedIntegration, loading: savedIntegrationLoading, error: savedIntegrationError } =
    useIntegrationConfig(roomId);

  const effectiveExternalUrl = externalUrl ?? savedIntegration?.externalUrl;
  const effectiveExternalMeet = externalMeet ?? savedIntegration?.meetCode;
  const effectiveExternalOrigin = externalOrigin ?? savedIntegration?.origin;

  const externalSource = useMemo(
    () => resolveEasyLifterSource(effectiveExternalUrl, effectiveExternalMeet, effectiveExternalOrigin),
    [effectiveExternalMeet, effectiveExternalOrigin, effectiveExternalUrl]
  );

  const { state, status, error: externalError } = useEasyLifterBridge({
    enabled: externalSource.enabled && !externalSource.error,
    meetCode: externalSource.meetCode,
    origin: externalSource.origin,
    crossTabSync: false
  });

  const socketError = externalSource.error ?? externalError ?? savedIntegrationError;
  const socketErrorText = socketError ? commonMessages.errors[socketError] ?? socketError : null;
  const [menuOpen, setMenuOpen] = useState(false);
  const [bgColor, setBgColor] = useState(DEFAULT_LEGEND_BG);
  const [showPlaceholders, setShowPlaceholders] = useState(true);
  const [showDashedFrame, setShowDashedFrame] = useState(true);
  const [digitMode, setDigitMode] = useState<'mmss' | 'hhmmss'>('hhmmss');
  const [timerColor, setTimerColor] = useState('#FFFFFF');
  const [hydrated, setHydrated] = useState(false);
  const [savedConfig, setSavedConfig] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [keepAwake, setKeepAwake] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = window.localStorage.getItem('legendKeepAwake');
    if (stored === 'false') return false;
    return true;
  });

  useEffect(() => {
    if (!router.isReady || typeof window === 'undefined') return;

    const storedBg = window.localStorage.getItem('legendBg');
    const storedPlaceholders = window.localStorage.getItem('legendPlaceholders');
    const storedFrame = window.localStorage.getItem('legendFrame');
    const storedDigits = window.localStorage.getItem('legendDigits');
    const storedColor = window.localStorage.getItem('legendTimerColor');
    const storedWake = window.localStorage.getItem('legendKeepAwake');

    let nextBgColor = DEFAULT_LEGEND_BG;
    let nextShowPlaceholders = true;
    let nextShowDashedFrame = true;
    let nextDigitMode: 'mmss' | 'hhmmss' = 'hhmmss';
    let nextTimerColor = '#FFFFFF';
    let nextKeepAwake = storedWake !== 'false';

    if (storedBg && isLegendBgColor(storedBg)) {
      nextBgColor = storedBg;
    }
    if (storedPlaceholders === 'true' || storedPlaceholders === 'false') {
      nextShowPlaceholders = storedPlaceholders === 'true';
    }
    if (storedFrame === 'true' || storedFrame === 'false') {
      nextShowDashedFrame = storedFrame === 'true';
    }
    if (storedDigits === 'mmss' || storedDigits === 'hhmmss') {
      nextDigitMode = storedDigits;
    }
    if (storedColor && isHexColor(storedColor)) {
      nextTimerColor = storedColor;
    }

    if (legendBgQuery && isLegendBgColor(legendBgQuery)) {
      nextBgColor = legendBgQuery;
    }
    if (legendTimerQuery && isHexColor(legendTimerQuery)) {
      nextTimerColor = legendTimerQuery;
    }
    if (legendDigitsQuery === 'mmss' || legendDigitsQuery === 'hhmmss') {
      nextDigitMode = legendDigitsQuery;
    }
    if (legendPlaceholdersQuery === '1' || legendPlaceholdersQuery === 'true') {
      nextShowPlaceholders = true;
    } else if (legendPlaceholdersQuery === '0' || legendPlaceholdersQuery === 'false') {
      nextShowPlaceholders = false;
    }
    nextShowDashedFrame = parseBooleanQuery(legendFrameQuery, nextShowDashedFrame);

    setBgColor(nextBgColor);
    setShowPlaceholders(nextShowPlaceholders);
    setShowDashedFrame(nextShowDashedFrame);
    setDigitMode(nextDigitMode);
    setTimerColor(nextTimerColor);
    setKeepAwake(nextKeepAwake);
    setHydrated(true);
  }, [router.isReady, legendBgQuery, legendTimerQuery, legendDigitsQuery, legendPlaceholdersQuery, legendFrameQuery]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined' || isShareView) return;
    window.localStorage.setItem('legendBg', bgColor);
  }, [bgColor, hydrated, isShareView]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined' || isShareView) return;
    window.localStorage.setItem('legendPlaceholders', showPlaceholders ? 'true' : 'false');
  }, [showPlaceholders, hydrated, isShareView]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined' || isShareView) return;
    window.localStorage.setItem('legendFrame', showDashedFrame ? 'true' : 'false');
  }, [showDashedFrame, hydrated, isShareView]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined' || isShareView) return;
    window.localStorage.setItem('legendDigits', digitMode);
  }, [digitMode, hydrated, isShareView]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined' || isShareView) return;
    window.localStorage.setItem('legendTimerColor', timerColor);
  }, [timerColor, hydrated, isShareView]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined' || isShareView) return;
    window.localStorage.setItem('legendKeepAwake', keepAwake ? 'true' : 'false');
  }, [keepAwake, hydrated, isShareView]);

  const wakeActive = useWakeLock(keepAwake);

  useEffect(() => {
    if (!router.isReady) return;
    const targetLocale = state?.locale;
    if (!targetLocale) return;
    if (router.locale === targetLocale) return;
    document.cookie = `NEXT_LOCALE=${targetLocale}; path=/; max-age=31536000`;
    void router.replace({ pathname: router.pathname, query: router.query }, undefined, { locale: targetLocale });
  }, [router, state?.locale]);

  const intervalPrimary = useMemo(
    () => formatHms(state?.intervalMs ?? 0, digitMode === 'hhmmss'),
    [state?.intervalMs, digitMode]
  );
  const statusTarget = roomId ?? externalSource.meetCode;
  const statusSuffix = statusTarget ? legendMessages.statusRoomSuffix.replace('{roomId}', statusTarget) : '';
  const digitsModeLabel = digitMode === 'hhmmss' ? legendMessages.digitsModes.hhmmss : legendMessages.digitsModes.mmss;
  const digitsButtonLabel = legendMessages.buttons.digits.replace('{mode}', digitsModeLabel);
  const frameButtonLabel = showDashedFrame ? legendMessages.buttons.frameHide : legendMessages.buttons.frameShow;
  const wakeText = keepAwake ? displayMessages.wake.on : displayMessages.wake.off;
  const wakeButtonLabel = legendMessages.buttons.wake.replace('{state}', wakeText);
  const bgPickerValue = isHexColor(bgColor) ? bgColor : '#000B1E';
  const lightsFrameClassName = getLegendLightsFrameClassName(showDashedFrame);
  const shareLink = useMemo(() => {
    const params = new URLSearchParams();
    if (roomId) params.set('roomId', roomId);
    if (externalUrl) params.set('externalUrl', externalUrl);
    if (externalMeet) params.set('externalMeet', externalMeet);
    if (externalOrigin) params.set('externalOrigin', externalOrigin);
    params.set('view', 'share');
    params.set('legendBg', bgColor);
    params.set('legendTimer', timerColor);
    params.set('legendDigits', digitMode);
    params.set('legendPlaceholders', showPlaceholders ? '1' : '0');
    params.set('legendFrame', showDashedFrame ? '1' : '0');
    return `/integration/legend?${params.toString()}`;
  }, [
    roomId,
    externalUrl,
    externalMeet,
    externalOrigin,
    bgColor,
    timerColor,
    digitMode,
    showPlaceholders,
    showDashedFrame
  ]);

  const handleCopyShareLink = useCallback(async () => {
    if (typeof window === 'undefined' || !shareLink) return;
    const absoluteShareLink = `${window.location.origin}${shareLink}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(absoluteShareLink);
      } else {
        const helperInput = document.createElement('input');
        helperInput.value = absoluteShareLink;
        document.body.appendChild(helperInput);
        helperInput.select();
        document.execCommand('copy');
        document.body.removeChild(helperInput);
      }
      setCopiedShareLink(true);
      window.setTimeout(() => setCopiedShareLink(false), 1500);
    } catch {
      setCopiedShareLink(false);
    }
  }, [shareLink]);

  const handleSaveLegendConfig = useCallback(() => {
    if (typeof window === 'undefined' || isShareView) return;

    window.localStorage.setItem('legendBg', bgColor);
    window.localStorage.setItem('legendPlaceholders', showPlaceholders ? 'true' : 'false');
    window.localStorage.setItem('legendFrame', showDashedFrame ? 'true' : 'false');
    window.localStorage.setItem('legendDigits', digitMode);
    window.localStorage.setItem('legendTimerColor', timerColor);
    window.localStorage.setItem('legendKeepAwake', keepAwake ? 'true' : 'false');
    setSavedConfig(true);
    window.setTimeout(() => setSavedConfig(false), 1500);
  }, [isShareView, bgColor, showPlaceholders, showDashedFrame, digitMode, timerColor, keepAwake]);

  if (!externalSource.enabled && savedIntegrationLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 py-12 text-center text-white">
        <p className="text-sm uppercase tracking-[0.4em] text-slate-400">{legendMessages.waiting}</p>
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
        title="Referee Lights · Integration Legend"
        description={legendMessages.metaDescription ?? 'External integration legend.'}
        canonicalPath="/integration/legend"
        noIndex
      />
      <main
        className="flex min-h-screen flex-col gap-8 px-[clamp(12px,3vw,30px)] py-[clamp(10px,2.6vh,30px)] text-slate-100"
        style={{ backgroundColor: bgColor }}
      >
        {!isShareView && (
          <div className="rounded-3xl border border-white/10 bg-black/40 px-6 py-5 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
            <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold uppercase tracking-[0.45em] text-white">
                  {legendMessages.title}
                </h1>
                <span className="text-xs uppercase tracking-[0.35em] text-slate-300">
                  {commonMessages.labels.status}: {status}
                  {statusSuffix}
                </span>
                {socketErrorText ? (
                  <span className="text-[10px] uppercase tracking-[0.3em] text-red-300">
                    {legendMessages.errorPrefix} {socketErrorText}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/20"
                >
                  {menuOpen ? legendMessages.buttons.paletteClose : legendMessages.buttons.paletteOpen}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPlaceholders((prev) => !prev)}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/20"
                >
                  {showPlaceholders
                    ? legendMessages.buttons.placeholdersHide
                    : legendMessages.buttons.placeholdersShow}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDashedFrame((prev) => !prev)}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/20"
                >
                  {frameButtonLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setDigitMode((prev) => (prev === 'hhmmss' ? 'mmss' : 'hhmmss'))}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/20"
                >
                  {digitsButtonLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setKeepAwake((prev) => !prev)}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/20"
                >
                  {wakeButtonLabel}
                </button>
                <button
                  type="button"
                  onClick={handleSaveLegendConfig}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/20"
                >
                  {savedConfig ? legendMessages.share.saved : legendMessages.share.save}
                </button>
                <button
                  type="button"
                  onClick={() => void handleCopyShareLink()}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/20"
                >
                  {copiedShareLink ? legendMessages.share.copied : legendMessages.share.copy}
                </button>
              </div>
            </header>
          </div>
        )}

        {!isShareView && menuOpen && (
          <section className="flex flex-wrap gap-4 rounded-3xl border border-white/10 bg-black/40 p-6">
            <h2 className="w-full text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">
              {legendMessages.palette.title}
            </h2>
            <div className="flex flex-wrap gap-3">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setBgColor(color)}
                  className={`h-10 w-10 rounded-full border-2 transition ${
                    bgColor === color ? 'border-white' : 'border-white/30'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  <span className="sr-only">
                    {legendMessages.palette.selectColor.replace('{color}', color.toUpperCase())}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setBgColor('transparent')}
                className={`h-10 rounded-full border px-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-200 transition ${
                  bgColor === 'transparent'
                    ? 'border-white bg-white/20'
                    : 'border-white/30 bg-white/10 hover:bg-white/20'
                }`}
              >
                {legendMessages.palette.transparentBackground}
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-slate-300">
              <label className="flex items-center gap-3">
                <span>{legendMessages.palette.customColor}</span>
                <input
                  type="color"
                  value={bgPickerValue}
                  onChange={(event) => setBgColor(event.target.value)}
                  className="h-9 w-20 cursor-pointer rounded border border-white/30 bg-transparent"
                />
                <span className="text-[10px] text-slate-400">{bgColor.toUpperCase()}</span>
              </label>
              <label className="flex items-center gap-3">
                <span>{legendMessages.palette.timerColor}</span>
                <input
                  type="color"
                  value={timerColor}
                  onChange={(event) => setTimerColor(event.target.value)}
                  className="h-9 w-20 cursor-pointer rounded border border-white/30 bg-transparent"
                />
                <span className="text-[10px] text-slate-400">{timerColor.toUpperCase()}</span>
              </label>
              {!wakeActive && keepAwake && (
                <span className="text-[10px] text-amber-300">{legendMessages.wakeWarning}</span>
              )}
            </div>
          </section>
        )}

        <section className="flex flex-1 items-center justify-center">
          <div className="flex w-full max-w-[1700px] flex-col items-center justify-center gap-[clamp(20px,8vh,100px)]">
            <div className="flex w-full justify-center">
              {state ? (
                <div className={lightsFrameClassName}>
                  <div className="origin-top">
                    <DecisionLights
                      state={state}
                      showCardPlaceholders={showPlaceholders}
                      showLightPlaceholders={showPlaceholders}
                      showPendingRing={false}
                      sizeMode="legend"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-white/5 px-8 py-6 text-center text-sm text-slate-400">
                  {legendMessages.waiting}
                </div>
              )}
            </div>

            <div className="flex w-full justify-center">
              <LegendIntervalCard intervalLabel={intervalPrimary} color={timerColor} />
            </div>
          </div>
        </section>
      </main>
      {socketError ? <StatusBanner message={socketError} errors={commonMessages.errors} /> : null}
    </>
  );
}

function LegendIntervalCard({ intervalLabel, color }: { intervalLabel: string; color: string }) {
  return (
    <div
      className="font-display text-[clamp(3rem,14vw,9rem)] font-black leading-none tracking-tight"
      style={{ color }}
    >
      {intervalLabel}
    </div>
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
        {integration.exampleLabel}: <code>/integration/legend?externalUrl=https://easyliftersoftware.com/referee/lights?meet=3NJH7Y53</code>
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
        {integration.exampleLabel}: <code>/integration/legend?externalUrl=https://easyliftersoftware.com/referee/lights?meet=3NJH7Y53</code>
      </p>
    </main>
  );
}

function formatHms(ms: number, includeHours: boolean) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600).toString();
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  if (!includeHours) {
    const totalMinutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    return `${totalMinutes}:${seconds}`;
  }

  return `${hours}:${minutes}:${seconds}`;
}

function isLegendBgColor(value: string | undefined): value is string {
  return value === 'transparent' || isHexColor(value);
}

function isHexColor(value: string | undefined): value is string {
  return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value);
}

function parseBooleanQuery(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  if (value === '1' || value === 'true') return true;
  if (value === '0' || value === 'false') return false;
  return defaultValue;
}

function getLegendLightsFrameClassName(showDashedFrame: boolean): string {
  const baseClassName = 'rounded-[clamp(14px,4.2vh,2.2rem)] p-[clamp(18px,4.5vw,50px)]';
  if (!showDashedFrame) return baseClassName;
  return `${baseClassName} border-4 border-dashed border-black`;
}

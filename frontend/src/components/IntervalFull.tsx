const WARNING_OFFSET_MS = 3 * 60 * 1000;

interface IntervalFullProps {
  intervalMs: number;
  configuredMs: number;
  running: boolean;
}

export function IntervalFull({ intervalMs, configuredMs, running }: IntervalFullProps) {
  if (configuredMs <= 0) return null;

  const primary = formatHms(Math.max(0, intervalMs));
  const secondaryMs = Math.max(0, intervalMs - WARNING_OFFSET_MS);
  const secondary = formatHms(secondaryMs);

  return (
    <div className="mx-auto flex w-full max-w-[min(92vw,1200px)] flex-col items-center gap-12 text-white py-12">
      <div className="relative flex flex-col items-center gap-8 rounded-[48px] border border-white/10 bg-black/70 px-12 py-10 shadow-[0_22px_70px_rgba(0,0,0,0.6)]">
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 skew-x-[-12deg] rounded-md bg-white px-7 py-2 text-xs font-semibold uppercase tracking-[0.45em] text-slate-900">
          <span className="block skew-x-[12deg]">Próximo Round</span>
        </span>
        <span
          className={`font-display text-[clamp(4rem,16vw,14rem)] font-black leading-none tracking-tight transition-opacity duration-500 ${
            running ? 'opacity-100' : 'opacity-70'
          }`}
        >
          {primary}
        </span>
      </div>

      <div className="relative flex flex-col items-center gap-8 rounded-[48px] border border-white/10 bg-black/70 px-12 py-10 shadow-[0_22px_70px_rgba(0,0,0,0.6)]">
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 skew-x-[-12deg] rounded-md bg-white px-7 py-2 text-xs font-semibold uppercase tracking-[0.45em] text-slate-900">
          <span className="block skew-x-[12deg]">Tempo para troca das pedidas</span>
        </span>
        <span
          className={`font-display text-[clamp(3.2rem,14vw,12rem)] font-black leading-none tracking-tight text-[#ff1f1f] transition-opacity duration-500 ${
            secondaryMs > 0 && running ? 'opacity-100' : 'opacity-70'
          }`}
        >
          {secondary}
        </span>
      </div>
    </div>
  );
}

function formatHms(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export default IntervalFull;

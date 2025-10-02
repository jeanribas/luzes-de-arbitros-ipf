import Link from 'next/link';

export default function RefIndex() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-6 py-8 text-slate-100">
      <h1 className="text-lg font-semibold uppercase tracking-[0.4em]">Select Referee Position</h1>
      <div className="flex flex-col gap-4 text-center text-sm uppercase tracking-[0.3em]">
        <Link className="rounded-xl border border-slate-700 px-6 py-3" href="/ref/left">
          Left Referee
        </Link>
        <Link className="rounded-xl border border-slate-700 px-6 py-3" href="/ref/center">
          Center Referee
        </Link>
        <Link className="rounded-xl border border-slate-700 px-6 py-3" href="/ref/right">
          Right Referee
        </Link>
      </div>
    </main>
  );
}

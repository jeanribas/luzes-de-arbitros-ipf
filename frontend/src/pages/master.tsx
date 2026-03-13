import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

import { Seo } from '@/components/Seo';
import { getMessages } from '@/lib/i18n/messages';
import {
  masterAuth,
  getMasterStats,
  getMasterSessions,
  getMasterGeo,
  getMasterActive,
  getMasterTimeline,
  getMasterHourly,
  getMasterRoles,
  getMasterDuration,
  getMasterActivity,
  getMasterClicks,
  getMasterInstances,
  type MasterStats,
  type MasterSession,
  type MasterGeoResponse,
  type MasterActiveResponse,
  type MasterTimelineResponse,
  type MasterHourlyResponse,
  type MasterRolesResponse,
  type MasterDurationResponse,
  type MasterActivityResponse,
  type MasterClicksResponse,
  type MasterInstancesResponse
} from '@/lib/api';

const PAGE_SIZE = 20;
const REFRESH_INTERVAL = 30_000;

const CHART_COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6'];
const ROLE_COLORS: Record<string, string> = {
  admin: '#6366f1',
  display: '#22d3ee',
  left: '#f43f5e',
  center: '#f59e0b',
  right: '#10b981',
  viewer: '#8b5cf6'
};
const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  display: 'Display',
  left: 'Esquerdo',
  center: 'Central',
  right: 'Direito',
  viewer: 'Viewer'
};

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-slate-900/90 to-slate-800/40 p-5">
      <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 blur-2xl ${accent ?? 'bg-indigo-500'}`} />
      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">{label}</p>
      <p className="mt-1.5 text-3xl font-bold tabular-nums text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-white/[0.06] bg-gradient-to-br from-slate-900/90 to-slate-800/40 p-5 ${className}`}>
      <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">{title}</h2>
      {children}
    </section>
  );
}

const tooltipStyle = {
  contentStyle: { background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '12px' },
  labelStyle: { color: '#94a3b8' },
  itemStyle: { color: '#e2e8f0' }
};

export default function MasterPage() {
  const router = useRouter();
  const locale = typeof router.locale === 'string' ? router.locale : undefined;
  const messages = useMemo(() => getMessages(locale), [locale]);
  const m = messages.master;

  const [authenticated, setAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');

  const [stats, setStats] = useState<MasterStats | null>(null);
  const [sessions, setSessions] = useState<MasterSession[]>([]);
  const [sessionsOffset, setSessionsOffset] = useState(0);
  const [geo, setGeo] = useState<MasterGeoResponse | null>(null);
  const [active, setActive] = useState<MasterActiveResponse | null>(null);
  const [timeline, setTimeline] = useState<MasterTimelineResponse | null>(null);
  const [hourly, setHourly] = useState<MasterHourlyResponse | null>(null);
  const [roles, setRoles] = useState<MasterRolesResponse | null>(null);
  const [duration, setDuration] = useState<MasterDurationResponse | null>(null);
  const [activity, setActivity] = useState<MasterActivityResponse | null>(null);
  const [clicks, setClicks] = useState<MasterClicksResponse | null>(null);
  const [instances, setInstances] = useState<MasterInstancesResponse | null>(null);
  const [tab, setTab] = useState<'overview' | 'sessions' | 'geo' | 'family'>('overview');

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('master_token')) {
      setAuthenticated(true);
    }
  }, []);

  const handleLogin = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setLoginError(null);
      try {
        const res = await masterAuth(user, password);
        sessionStorage.setItem('master_token', res.token);
        setAuthenticated(true);
      } catch (err: unknown) {
        const code =
          err && typeof err === 'object' && 'code' in err && typeof (err as any).code === 'string'
            ? (err as any).code
            : '';
        if (code === 'master_not_configured') {
          setLoginError(m.login.notConfigured);
        } else {
          setLoginError(m.login.error);
        }
      }
    },
    [user, password, m.login.error, m.login.notConfigured]
  );

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('master_token');
    setAuthenticated(false);
    setStats(null);
    setSessions([]);
    setGeo(null);
    setActive(null);
    setTimeline(null);
    setHourly(null);
    setRoles(null);
    setDuration(null);
    setActivity(null);
    setClicks(null);
    setInstances(null);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [s, sess, g, a, tl, hr, rl, dur, act, cl, inst] = await Promise.all([
        getMasterStats(),
        getMasterSessions(PAGE_SIZE, sessionsOffset),
        getMasterGeo(),
        getMasterActive(),
        getMasterTimeline(),
        getMasterHourly(),
        getMasterRoles(),
        getMasterDuration(),
        getMasterActivity(),
        getMasterClicks(),
        getMasterInstances()
      ]);
      setStats(s);
      setSessions(sess.sessions);
      setGeo(g);
      setActive(a);
      setTimeline(tl);
      setHourly(hr);
      setRoles(rl);
      setDuration(dur);
      setActivity(act);
      setClicks(cl);
      setInstances(inst);
    } catch {
      handleLogout();
    }
  }, [sessionsOffset, handleLogout]);

  useEffect(() => {
    if (!authenticated) return;
    void fetchData();
    const id = setInterval(() => void fetchData(), REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [authenticated, fetchData]);

  const formatDate = useCallback(
    (iso: string) => {
      try {
        return new Date(iso).toLocaleString(locale ?? 'pt-BR');
      } catch {
        return iso;
      }
    },
    [locale]
  );

  const formatRelative = useCallback((timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return '< 1 min';
    if (diffMin < 60) return `${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    return `${diffH}h ${diffMin % 60}min`;
  }, []);

  const pageHead = (
    <Seo
      title={`Referee Lights · ${m.header.title}`}
      description={m.metaDescription}
      canonicalPath="/master"
      noIndex
    />
  );

  // ----- LOGIN -----
  if (!authenticated) {
    return (
      <>
        {pageHead}
        <main className="flex min-h-screen items-center justify-center bg-[#0a0e1a] px-6 py-16 text-white">
          <form
            onSubmit={handleLogin}
            className="w-full max-w-sm space-y-6 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-slate-900/90 to-slate-800/40 p-8 shadow-2xl backdrop-blur"
          >
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20">
                <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold uppercase tracking-[0.4em]">{m.login.title}</h1>
            </div>

            <label className="flex flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {m.login.userLabel}
              <input
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="min-h-[44px] rounded-lg border border-white/[0.06] bg-slate-950/80 px-3 text-sm font-medium text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {m.login.passwordLabel}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-[44px] rounded-lg border border-white/[0.06] bg-slate-950/80 px-3 text-sm font-medium text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
              />
            </label>

            {loginError && (
              <div className="rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-2 text-center text-sm text-red-300">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={!user || !password}
              className="w-full rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {m.login.submit}
            </button>
          </form>
        </main>
      </>
    );
  }

  // Prepare chart data
  const timelineData = timeline?.timeline.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString(locale ?? 'pt-BR', { day: '2-digit', month: 'short' })
  })) ?? [];

  const hourlyData = hourly?.hourly ?? [];

  const rolesData = (roles?.roles ?? []).map((r) => ({
    ...r,
    name: ROLE_LABELS[r.role] ?? r.role,
    fill: ROLE_COLORS[r.role] ?? '#6366f1'
  }));

  const activityData = (activity?.activity ?? []).map((a) => ({
    ...a,
    label: new Date(a.minute).toLocaleTimeString(locale ?? 'pt-BR', { hour: '2-digit', minute: '2-digit' })
  }));

  const geoBarData = (geo?.countries ?? []).slice(0, 10);

  const peakHour = hourlyData.reduce((max, h) => (h.count > max.count ? h : max), { hour: 0, count: 0 });

  // ----- DASHBOARD -----
  return (
    <>
      {pageHead}
      <main className="min-h-screen bg-[#0a0e1a] text-slate-100">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-white/[0.04] bg-[#0a0e1a]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20">
                <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h1 className="text-sm font-semibold uppercase tracking-[0.35em]">{m.header.title}</h1>
            </div>
            <div className="flex items-center gap-4">
              {/* Tabs */}
              <nav className="hidden items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1 sm:flex">
                {(['overview', 'sessions', 'geo', 'family'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${
                      tab === t ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {t === 'overview' ? 'Visão Geral' : t === 'sessions' ? 'Sessões' : t === 'geo' ? 'Geográfico' : 'Família'}
                  </button>
                ))}
              </nav>
              <div className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" title="Auto-refresh ativo" />
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
              >
                {m.header.logout}
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-6">
          {/* Mobile tabs */}
          <nav className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1 sm:hidden">
            {(['overview', 'sessions', 'geo', 'family'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 rounded-md px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] transition ${
                  tab === t ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t === 'overview' ? 'Geral' : t === 'sessions' ? 'Sessões' : t === 'geo' ? 'Geo' : 'Família'}
              </button>
            ))}
          </nav>

          {/* ===================== OVERVIEW TAB ===================== */}
          {tab === 'overview' && (
            <>
              {/* Stat cards */}
              {stats && (
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                  <StatCard label={m.stats.totalSessions} value={stats.totalSessions} accent="bg-indigo-500" />
                  <StatCard label={m.stats.totalConnections} value={stats.totalConnections} accent="bg-cyan-500" />
                  <StatCard label={m.stats.activeRooms} value={stats.activeRooms} accent="bg-emerald-500" />
                  <StatCard label={m.stats.uniqueIps} value={stats.uniqueIps} accent="bg-amber-500" />
                  {duration && (
                    <>
                      <StatCard label="Tempo médio" value={`${duration.avgMinutes} min`} sub="por conexão" accent="bg-rose-500" />
                      <StatCard label="Uso total" value={`${duration.totalHours}h`} sub="acumulado" accent="bg-violet-500" />
                    </>
                  )}
                </section>
              )}

              {/* Main charts row */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Timeline - large */}
                <ChartCard title="Sessões & Conexões — Últimos 30 dias" className="lg:col-span-2">
                  {timelineData.length === 0 ? (
                    <p className="py-12 text-center text-sm text-slate-600">Sem dados ainda.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={timelineData}>
                        <defs>
                          <linearGradient id="gradSessions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gradConnections" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={30} />
                        <Tooltip {...tooltipStyle} />
                        <Area type="monotone" dataKey="sessions" name="Sessões" stroke="#6366f1" fill="url(#gradSessions)" strokeWidth={2} />
                        <Area type="monotone" dataKey="connections" name="Conexões" stroke="#22d3ee" fill="url(#gradConnections)" strokeWidth={2} />
                        <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>

                {/* Roles pie */}
                <ChartCard title="Conexões por Papel">
                  {rolesData.length === 0 ? (
                    <p className="py-12 text-center text-sm text-slate-600">Sem dados.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={rolesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="count"
                          nameKey="name"
                          strokeWidth={0}
                        >
                          {rolesData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip {...tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
              </div>

              {/* Second row */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Hourly heatmap as bar chart */}
                <ChartCard title="Horários de Pico (últimos 30 dias)">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis
                        dataKey="hour"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        tickFormatter={(h) => `${String(h).padStart(2, '0')}h`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={30} />
                      <Tooltip
                        {...tooltipStyle}
                        labelFormatter={(h) => `${String(h).padStart(2, '0')}:00 – ${String(h).padStart(2, '0')}:59`}
                      />
                      <Bar dataKey="count" name="Conexões" radius={[4, 4, 0, 0]}>
                        {hourlyData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={entry.hour === peakHour.hour && peakHour.count > 0 ? '#f59e0b' : '#6366f1'}
                            opacity={entry.count === 0 ? 0.15 : 0.4 + (entry.count / Math.max(peakHour.count, 1)) * 0.6}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  {peakHour.count > 0 && (
                    <p className="mt-2 text-xs text-slate-500">
                      Pico: <span className="text-amber-400 font-medium">{String(peakHour.hour).padStart(2, '0')}h</span> com {peakHour.count} conexões
                    </p>
                  )}
                </ChartCard>

                {/* Recent activity (last 24h) */}
                <ChartCard title="Atividade — Últimas 24h">
                  {activityData.length === 0 ? (
                    <p className="py-12 text-center text-sm text-slate-600">Sem atividade recente.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={activityData}>
                        <defs>
                          <linearGradient id="gradActivity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={30} />
                        <Tooltip {...tooltipStyle} />
                        <Area type="monotone" dataKey="connections" name="Conexões" stroke="#10b981" fill="url(#gradActivity)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
              </div>

              {/* Active rooms */}
              <ChartCard title={m.active.title}>
                {!active || active.rooms.length === 0 ? (
                  <p className="text-sm text-slate-600">{m.active.empty}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.04] text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                          <th className="px-3 py-2">{m.active.room}</th>
                          <th className="px-3 py-2">{m.active.judges}</th>
                          <th className="px-3 py-2">{m.active.created}</th>
                          <th className="px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {active.rooms.map((r) => (
                          <tr key={r.id} className="border-b border-white/[0.02]">
                            <td className="px-3 py-2.5 font-mono text-xs text-indigo-300">{r.id}</td>
                            <td className="px-3 py-2.5">
                              <span className="inline-flex items-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full ${r.connectedJudges > 0 ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                                <span className="tabular-nums">{r.connectedJudges}/3</span>
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-slate-400">{formatRelative(r.createdAt)}</td>
                            <td className="px-3 py-2.5">
                              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                r.connectedJudges === 3 ? 'bg-emerald-500/15 text-emerald-400' :
                                r.connectedJudges > 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-500/15 text-slate-500'
                              }`}>
                                {r.connectedJudges === 3 ? 'Completa' : r.connectedJudges > 0 ? 'Parcial' : 'Vazia'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </ChartCard>

              {/* Link Clicks */}
              <ChartCard title="Cliques em Links Externos">
                {!clicks || clicks.clicks.length === 0 ? (
                  <p className="text-sm text-slate-600">Nenhum clique registrado.</p>
                ) : (
                  <div className="space-y-3">
                    {clicks.clicks.map((c) => {
                      const maxCount = clicks.clicks[0].count;
                      const pct = maxCount > 0 ? (c.count / maxCount) * 100 : 0;
                      const label = c.url.replace(/^https?:\/\//, '');
                      return (
                        <div key={c.url} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="truncate text-xs text-indigo-300">{label}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-500">
                                Último: {new Date(c.last_click).toLocaleString('pt-BR')}
                              </span>
                              <span className="min-w-[3rem] text-right text-sm font-bold tabular-nums text-white">{c.count}</span>
                            </div>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white/[0.04]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ChartCard>
            </>
          )}

          {/* ===================== SESSIONS TAB ===================== */}
          {tab === 'sessions' && (
            <ChartCard title={m.sessions.title}>
              {sessions.length === 0 ? (
                <p className="text-sm text-slate-600">{m.sessions.empty}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.04] text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">{m.sessions.roomId}</th>
                        <th className="px-3 py-2">{m.sessions.created}</th>
                        <th className="px-3 py-2">{m.sessions.connections}</th>
                        <th className="px-3 py-2">{m.sessions.country}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((s, i) => (
                        <tr key={s.id} className="border-b border-white/[0.02] transition hover:bg-white/[0.02]">
                          <td className="px-3 py-2.5 text-xs text-slate-600">{sessionsOffset + i + 1}</td>
                          <td className="px-3 py-2.5 font-mono text-xs text-indigo-300">{s.room_id}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-400">{formatDate(s.created_at)}</td>
                          <td className="px-3 py-2.5 tabular-nums">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                              {s.connection_count}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-slate-400">{s.top_country || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSessionsOffset((p) => Math.max(0, p - PAGE_SIZE))}
                  disabled={sessionsOffset === 0}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] text-slate-400 transition hover:bg-white/[0.06] disabled:opacity-30"
                >
                  {m.sessions.previous}
                </button>
                <span className="text-[10px] text-slate-600">
                  {sessionsOffset + 1}–{sessionsOffset + sessions.length}
                </span>
                <button
                  type="button"
                  onClick={() => setSessionsOffset((p) => p + PAGE_SIZE)}
                  disabled={sessions.length < PAGE_SIZE}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] text-slate-400 transition hover:bg-white/[0.06] disabled:opacity-30"
                >
                  {m.sessions.next}
                </button>
              </div>
            </ChartCard>
          )}

          {/* ===================== GEO TAB ===================== */}
          {tab === 'geo' && (
            <>
              {/* Geo bar chart */}
              <ChartCard title="Top Países por Conexões">
                {geoBarData.length === 0 ? (
                  <p className="py-12 text-center text-sm text-slate-600">{m.geo.empty}</p>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(200, geoBarData.length * 40)}>
                    <BarChart data={geoBarData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="country" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={50} />
                      <Tooltip {...tooltipStyle} />
                      <Bar dataKey="count" name="Conexões" radius={[0, 6, 6, 0]}>
                        {geoBarData.map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} opacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Countries table */}
                <ChartCard title={m.geo.countries}>
                  {!geo || geo.countries.length === 0 ? (
                    <p className="text-sm text-slate-600">{m.geo.empty}</p>
                  ) : (
                    <div className="space-y-2">
                      {geo.countries.map((c, i) => {
                        const max = geo.countries[0].count;
                        const pct = max > 0 ? (c.count / max) * 100 : 0;
                        return (
                          <div key={c.country} className="flex items-center gap-3">
                            <span className="w-8 text-right text-xs text-slate-600">{i + 1}</span>
                            <span className="w-10 text-xs font-semibold text-slate-300">{c.country}</span>
                            <div className="flex-1">
                              <div className="h-2 overflow-hidden rounded-full bg-white/[0.04]">
                                <div
                                  className="h-full rounded-full bg-indigo-500/60"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                            <span className="w-10 text-right text-xs tabular-nums text-slate-400">{c.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ChartCard>

                {/* Cities table */}
                <ChartCard title={m.geo.cities}>
                  {!geo || geo.cities.length === 0 ? (
                    <p className="text-sm text-slate-600">{m.geo.empty}</p>
                  ) : (
                    <div className="space-y-2">
                      {geo.cities.slice(0, 15).map((c, i) => {
                        const max = geo.cities[0].count;
                        const pct = max > 0 ? (c.count / max) * 100 : 0;
                        return (
                          <div key={`${c.city}-${c.country}`} className="flex items-center gap-3">
                            <span className="w-8 text-right text-xs text-slate-600">{i + 1}</span>
                            <span className="w-28 truncate text-xs text-slate-300">{c.city}</span>
                            <span className="w-8 text-[10px] text-slate-600">{c.country}</span>
                            <div className="flex-1">
                              <div className="h-2 overflow-hidden rounded-full bg-white/[0.04]">
                                <div
                                  className="h-full rounded-full bg-cyan-500/60"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                            <span className="w-10 text-right text-xs tabular-nums text-slate-400">{c.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ChartCard>
              </div>
            </>
          )}

          {/* ===================== FAMILY TAB ===================== */}
          {tab === 'family' && (
            <>
              {/* Summary cards */}
              {instances && instances.instances.length > 0 && (() => {
                const all = instances.instances;
                const now = Date.now();
                const online = all.filter((i) => (now - new Date(i.last_seen + 'Z').getTime()) < 10 * 60_000);
                const totalSess = all.reduce((s, i) => s + i.total_sessions, 0);
                const totalConn = all.reduce((s, i) => s + i.total_connections, 0);
                return (
                  <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Instâncias conhecidas" value={all.length} accent="bg-violet-500" />
                    <StatCard label="Online agora" value={online.length} sub="heartbeat < 10min" accent="bg-emerald-500" />
                    <StatCard label="Sessões (toda família)" value={totalSess} accent="bg-indigo-500" />
                    <StatCard label="Conexões (toda família)" value={totalConn} accent="bg-cyan-500" />
                  </section>
                );
              })()}

              <ChartCard title="Instâncias da Família">
                {!instances || instances.instances.length === 0 ? (
                  <p className="text-sm text-slate-600">Nenhuma instância registrada ainda. Instâncias enviam heartbeat a cada 5 minutos.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.04] text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Instance ID</th>
                          <th className="px-3 py-2">Plataforma</th>
                          <th className="px-3 py-2">Uptime</th>
                          <th className="px-3 py-2">Salas</th>
                          <th className="px-3 py-2">Sessões</th>
                          <th className="px-3 py-2">Conexões</th>
                          <th className="px-3 py-2">IPs</th>
                          <th className="px-3 py-2">Primeiro visto</th>
                          <th className="px-3 py-2">Último heartbeat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {instances.instances.map((inst) => {
                          const ago = Date.now() - new Date(inst.last_seen + 'Z').getTime();
                          const isOnline = ago < 10 * 60_000;
                          const uptimeH = Math.floor(inst.uptime_seconds / 3600);
                          const uptimeM = Math.floor((inst.uptime_seconds % 3600) / 60);
                          const uptimeStr = uptimeH > 0 ? `${uptimeH}h ${uptimeM}m` : `${uptimeM}m`;
                          return (
                            <tr key={inst.instance_id} className="border-b border-white/[0.02] transition hover:bg-white/[0.02]">
                              <td className="px-3 py-2.5">
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                  isOnline ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/15 text-slate-500'
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                                  {isOnline ? 'Online' : 'Offline'}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 font-mono text-[10px] text-indigo-300">{inst.instance_id.slice(0, 8)}...</td>
                              <td className="px-3 py-2.5 text-[10px] text-slate-500">{inst.platform}/{inst.arch} {inst.node_version}</td>
                              <td className="px-3 py-2.5 text-xs tabular-nums text-slate-400">{uptimeStr}</td>
                              <td className="px-3 py-2.5 tabular-nums">{inst.active_rooms}</td>
                              <td className="px-3 py-2.5 tabular-nums">{inst.total_sessions}</td>
                              <td className="px-3 py-2.5 tabular-nums">{inst.total_connections}</td>
                              <td className="px-3 py-2.5 tabular-nums">{inst.unique_ips}</td>
                              <td className="px-3 py-2.5 text-[10px] text-slate-500">{new Date(inst.first_seen + 'Z').toLocaleDateString('pt-BR')}</td>
                              <td className="px-3 py-2.5 text-[10px] text-slate-500">{new Date(inst.last_seen + 'Z').toLocaleString('pt-BR')}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </ChartCard>
            </>
          )}
        </div>
      </main>
    </>
  );
}

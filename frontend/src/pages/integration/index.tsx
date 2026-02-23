import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/router';

import { Seo } from '@/components/Seo';
import { useIntegrationConfig } from '@/hooks/useIntegrationConfig';
import {
  authGlobalIntegration,
  clearGlobalIntegrationConfig,
  saveGlobalIntegrationConfig
} from '@/lib/api';
import { getMessages } from '@/lib/i18n/messages';

export default function IntegrationHubPage() {
  const router = useRouter();
  const locale = typeof router.locale === 'string' ? router.locale : undefined;
  const messages = useMemo(() => getMessages(locale), [locale]);
  const adminMessages = messages.admin;
  const commonMessages = messages.common;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const { config, loading, error: loadError } = useIntegrationConfig(undefined, authenticated);

  const [inputValue, setInputValue] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authenticated) return;
    if (saving) return;
    setInputValue(config?.externalUrl ?? '');
  }, [authenticated, config?.externalUrl, saving]);

  const hasConfig = Boolean(config?.externalUrl?.trim() || inputValue.trim());
  const statusError = formatApiError(formError ?? loadError, commonMessages.errors);
  const authErrorText = formatApiError(authError, commonMessages.errors);

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      setAuthError('invalid_credentials');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setFormError(null);
    setNotice(null);

    try {
      await authGlobalIntegration(username.trim(), password.trim());
      setAuthenticated(true);
      setInputValue(config?.externalUrl ?? '');
    } catch (error: unknown) {
      setAuthError(getErrorCode(error));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSave = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setFormError('external_invalid_url');
      setNotice(null);
      return;
    }

    setSaving(true);
    setFormError(null);
    setNotice(null);
    try {
      const payload = await saveGlobalIntegrationConfig(username.trim(), password.trim(), trimmed);
      setInputValue(payload.integration?.externalUrl ?? trimmed);
      setNotice(adminMessages.integration.saved);
    } catch (error: unknown) {
      setFormError(getErrorCode(error));
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    setFormError(null);
    setNotice(null);
    try {
      await clearGlobalIntegrationConfig(username.trim(), password.trim());
      setInputValue('');
      setNotice(adminMessages.integration.cleared);
    } catch (error: unknown) {
      setFormError(getErrorCode(error));
    } finally {
      setSaving(false);
    }
  };

  if (!authenticated) {
    return (
      <>
        <Seo
          title="Referee Lights · Integration"
          description="Integration provider hub."
          canonicalPath="/integration"
          noIndex
        />
        <main className="flex min-h-screen flex-col gap-8 bg-slate-950 px-6 py-10 text-white md:px-10">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-semibold uppercase tracking-[0.4em]">{adminMessages.integration.title}</h1>
          </header>

          <section className="max-w-xl rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <p className="mb-5 text-sm text-slate-300">{adminMessages.integration.authHint}</p>
            <form className="space-y-3" onSubmit={handleAuth}>
              <label className="flex flex-col gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {adminMessages.integration.authUserLabel}
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    if (authError) setAuthError(null);
                  }}
                  className="min-h-[44px] rounded border border-slate-700 bg-slate-950 px-3 text-sm font-medium text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
                  disabled={authLoading}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {adminMessages.integration.authPasswordLabel}
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (authError) setAuthError(null);
                  }}
                  className="min-h-[44px] rounded border border-slate-700 bg-slate-950 px-3 text-sm font-medium text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
                  disabled={authLoading}
                />
              </label>
              <button
                type="submit"
                disabled={authLoading}
                className="min-h-[44px] w-full rounded bg-slate-200 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {adminMessages.integration.authSubmit}
              </button>
              {authErrorText && <p className="mt-3 text-xs text-rose-300">{authErrorText}</p>}
            </form>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Seo
        title="Referee Lights · Integration"
        description="Integration provider hub."
        canonicalPath="/integration"
        noIndex
      />
      <main className="flex min-h-screen flex-col gap-8 bg-slate-950 px-6 py-10 text-white md:px-10">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold uppercase tracking-[0.4em]">{adminMessages.integration.title}</h1>
        </header>

        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <p className="mb-5 text-sm text-slate-300">{adminMessages.integration.description}</p>

          <label className="flex flex-col gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              {adminMessages.integration.urlLabel}
            </span>
            <input
              type="url"
              value={inputValue}
              onChange={(event) => {
                setInputValue(event.target.value);
                if (formError) setFormError(null);
                if (notice) setNotice(null);
              }}
              placeholder={adminMessages.integration.urlPlaceholder}
              className="min-h-[44px] rounded border border-slate-700 bg-slate-950 px-3 text-sm font-medium text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
              disabled={saving}
            />
          </label>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="min-h-[44px] rounded bg-slate-200 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adminMessages.integration.save}
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={saving}
              className="min-h-[44px] rounded bg-slate-700 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adminMessages.integration.clear}
            </button>
          </div>

          {loading && <p className="mt-3 text-xs text-slate-400">{adminMessages.preview.waiting}</p>}
          {statusError && <p className="mt-3 text-xs text-rose-300">{statusError}</p>}
          {notice && <p className="mt-3 text-xs text-emerald-300">{notice}</p>}
          {hasConfig && (
            <div className="mt-3 w-fit rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-emerald-100">
              {adminMessages.integration.activeBadge}
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href="/integration/display"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-cyan-300/35 bg-cyan-500/15 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100 transition hover:bg-cyan-500/25"
          >
            {adminMessages.integration.goToDisplay}
          </Link>
          <Link
            href="/integration/legend"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-cyan-300/35 bg-cyan-500/15 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100 transition hover:bg-cyan-500/25"
          >
            {adminMessages.integration.goToLegend}
          </Link>
          <Link
            href="/integration/timer"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-cyan-300/35 bg-cyan-500/15 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100 transition hover:bg-cyan-500/25"
          >
            {adminMessages.integration.goToTimer}
          </Link>
        </section>
      </main>
    </>
  );
}

function getErrorCode(error: unknown) {
  if (error && typeof error === 'object' && 'code' in error && typeof (error as any).code === 'string') {
    return (error as any).code as string;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'request_failed';
}

function formatApiError(code: string | null | undefined, errors: Record<string, string>) {
  if (!code) return null;
  return errors[code] ?? code;
}

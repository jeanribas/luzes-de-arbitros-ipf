import { useEffect, useState } from 'react';

import { getGlobalIntegrationConfig, getIntegrationConfig, type IntegrationConfig } from '@/lib/api';

interface UseIntegrationConfigResult {
  config: IntegrationConfig | null;
  loading: boolean;
  error: string | null;
}

export function useIntegrationConfig(roomId: string | undefined, enabled = true): UseIntegrationConfigResult {
  const [config, setConfig] = useState<IntegrationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setConfig(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const request = roomId ? getIntegrationConfig(roomId) : getGlobalIntegrationConfig();

    request
      .then((payload) => {
        if (cancelled) return;
        setConfig(payload.integration);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const nextError =
          err && typeof err === 'object' && 'code' in err && typeof (err as any).code === 'string'
            ? ((err as any).code as string)
            : 'request_failed';
        setError(nextError);
        setConfig(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roomId, enabled]);

  return { config, loading, error };
}

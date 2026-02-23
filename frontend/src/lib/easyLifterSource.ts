export const DEFAULT_EASYLIFTER_ORIGIN = 'https://easyliftersoftware.com';

export function readQueryValue(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

export function readQueryByKeys(
  query: Record<string, string | string[] | undefined>,
  keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = readQueryValue(query[key]);
    if (value !== undefined) return value;
  }

  const loweredKeys = new Set(keys.map((key) => key.toLowerCase()));
  for (const [key, rawValue] of Object.entries(query)) {
    if (!loweredKeys.has(key.toLowerCase())) continue;
    const value = readQueryValue(rawValue);
    if (value !== undefined) return value;
  }

  return undefined;
}

export function resolveEasyLifterSource(
  externalUrl?: string,
  externalMeet?: string,
  externalOrigin?: string
): {
  enabled: boolean;
  origin?: string;
  meetCode?: string;
  error: string | null;
} {
  const hasExternalInput = Boolean(
    (externalUrl && externalUrl.trim()) ||
    (externalMeet && externalMeet.trim()) ||
    (externalOrigin && externalOrigin.trim())
  );

  if (!hasExternalInput) {
    return { enabled: false, error: null };
  }

  let meetCode = externalMeet?.trim();
  let origin = externalOrigin?.trim();

  if (externalUrl && externalUrl.trim()) {
    let parsed: URL;
    try {
      parsed = new URL(externalUrl.trim());
    } catch {
      return {
        enabled: true,
        error: 'external_invalid_url'
      };
    }

    if (!origin) {
      origin = parsed.origin;
    }
    if (!meetCode) {
      const meet = parsed.searchParams.get('meet');
      meetCode = meet?.trim() || undefined;
    }
  }

  if (!origin) {
    origin = DEFAULT_EASYLIFTER_ORIGIN;
  }

  if (!meetCode) {
    return {
      enabled: true,
      origin,
      error: 'external_missing_meet'
    };
  }

  return {
    enabled: true,
    origin,
    meetCode,
    error: null
  };
}

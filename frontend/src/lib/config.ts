const DEFAULT_WS = typeof window === 'undefined'
  ? 'http://localhost:3333'
  : `${window.location.protocol === 'https:' ? 'https' : 'http'}://${window.location.hostname}:3333`;

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

export function getWsUrl() {
  const envUrl = process.env.NEXT_PUBLIC_WS_URL;

  if (!envUrl) {
    return DEFAULT_WS;
  }

  if (typeof window === 'undefined') {
    return envUrl;
  }

  try {
    const parsed = new URL(envUrl);
    const currentHost = window.location.hostname;

    if (LOCAL_HOSTNAMES.has(parsed.hostname) && !LOCAL_HOSTNAMES.has(currentHost)) {
      parsed.hostname = currentHost;

      if (window.location.protocol === 'https:' && parsed.protocol !== 'https:') {
        parsed.protocol = 'https:';
      }

      return parsed.toString();
    }

    return envUrl;
  } catch {
    return envUrl;
  }
}

const DEFAULT_WS = typeof window === 'undefined'
  ? 'http://localhost:3333'
  : `${window.location.protocol === 'https:' ? 'https' : 'http'}://${window.location.hostname}:3333`;

export function getWsUrl() {
  return process.env.NEXT_PUBLIC_WS_URL ?? DEFAULT_WS;
}

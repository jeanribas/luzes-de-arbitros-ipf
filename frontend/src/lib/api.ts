import { getApiBaseUrl } from './config';

export interface JoinQrCodesResponse {
  roomId: string;
  adminPin: string;
  joinQRCodes: {
    left: { token: string };
    center: { token: string };
    right: { token: string };
  };
}

interface ApiError extends Error {
  code?: string;
  status?: number;
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const hasBody = body !== undefined;
  const headers: Record<string, string> = {};

  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    body: hasBody ? JSON.stringify(body) : undefined
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error: ApiError = new Error(
      typeof payload === 'object' && payload && 'error' in payload && typeof (payload as any).error === 'string'
        ? (payload as any).error
        : 'request_failed'
    );
    error.code =
      typeof payload === 'object' && payload && 'error' in payload && typeof (payload as any).error === 'string'
        ? (payload as any).error
        : 'request_failed';
    error.status = response.status;
    throw error;
  }

  return payload as T;
}

export function createRoom() {
  return postJson<JoinQrCodesResponse>('/rooms');
}

export function accessRoom(roomId: string, adminPin: string) {
  return postJson<JoinQrCodesResponse>(`/rooms/${encodeURIComponent(roomId)}/access`, { adminPin });
}

export function refreshRefereeTokens(roomId: string, adminPin: string) {
  return postJson<JoinQrCodesResponse>(`/rooms/${encodeURIComponent(roomId)}/refresh-ref-tokens`, { adminPin });
}

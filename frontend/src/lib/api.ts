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

export interface IntegrationConfig {
  provider: 'easylifter';
  externalUrl: string;
  origin: string;
  meetCode: string;
  updatedAt: number;
}

export interface IntegrationConfigResponse {
  integration: IntegrationConfig | null;
}

export interface IntegrationAuthResponse {
  ok: true;
}

interface ApiError extends Error {
  code?: string;
  status?: number;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, init);

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errorCode =
      typeof payload === 'object' && payload && 'error' in payload && typeof (payload as any).error === 'string'
        ? (payload as any).error
        : 'request_failed';

    const error: ApiError = new Error(errorCode);
    error.code = errorCode;
    error.status = response.status;
    throw error;
  }

  return payload as T;
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const hasBody = body !== undefined;
  const headers: Record<string, string> = {};

  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  return requestJson<T>(path, {
    method: 'POST',
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    body: hasBody ? JSON.stringify(body) : undefined
  });
}

async function getJson<T>(path: string): Promise<T> {
  return requestJson<T>(path);
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

export function getIntegrationConfig(roomId: string) {
  return getJson<IntegrationConfigResponse>(`/rooms/${encodeURIComponent(roomId)}/integration`);
}

export function getGlobalIntegrationConfig() {
  return getJson<IntegrationConfigResponse>('/integration/config');
}

export function authGlobalIntegration(username: string, password: string) {
  return postJson<IntegrationAuthResponse>('/integration/auth', {
    username,
    password
  });
}

export function saveIntegrationConfig(roomId: string, adminPin: string, externalUrl: string) {
  return postJson<IntegrationConfigResponse>(`/rooms/${encodeURIComponent(roomId)}/integration`, {
    adminPin,
    provider: 'easylifter',
    externalUrl
  });
}

export function saveGlobalIntegrationConfig(username: string, password: string, externalUrl: string) {
  return postJson<IntegrationConfigResponse>('/integration/config', {
    username,
    password,
    provider: 'easylifter',
    externalUrl
  });
}

export function clearIntegrationConfig(roomId: string, adminPin: string) {
  return postJson<IntegrationConfigResponse>(`/rooms/${encodeURIComponent(roomId)}/integration`, {
    adminPin,
    provider: 'easylifter',
    externalUrl: ''
  });
}

export function clearGlobalIntegrationConfig(username: string, password: string) {
  return postJson<IntegrationConfigResponse>('/integration/config', {
    username,
    password,
    provider: 'easylifter',
    externalUrl: ''
  });
}

import type { LmsBootstrapPayload } from '../types/lms';

const TOKEN_STORAGE_KEY = 'tin_hoc_thu_ba_auth_token';
const LOGGED_OUT_KEY = 'tin_hoc_thu_ba_logged_out';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.removeItem(LOGGED_OUT_KEY);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function markLoggedOut(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.setItem(LOGGED_OUT_KEY, 'true');
}

export function isExplicitlyLoggedOut(): boolean {
  return localStorage.getItem(LOGGED_OUT_KEY) === 'true';
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (isExplicitlyLoggedOut()) {
    headers['X-Explicit-Logged-Out'] = 'true';
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Lỗi kết nối máy chủ (${response.status})`);
  }
  return data as T;
}

export async function fetchBootstrap(): Promise<LmsBootstrapPayload> {
  return apiRequest<LmsBootstrapPayload>('/api/bootstrap');
}

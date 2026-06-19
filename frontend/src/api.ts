import type { DashboardResponse, RegionsDashboardResponse, User, Wave } from './types';

const API_BASE = import.meta.env.VITE_API_BASE ?? (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');

export function getToken(): string | null {
  return localStorage.getItem('nps_token');
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('nps_token', token);
  else localStorage.removeItem('nps_token');
}

function redirectToLogin() {
  setToken(null);
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

async function getErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) return response.statusText;
  try {
    const parsed = JSON.parse(text) as { detail?: unknown };
    if (typeof parsed.detail === 'string') return parsed.detail;
    if (parsed.detail) return JSON.stringify(parsed.detail);
  } catch {
    return text;
  }
  return text;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!response.ok) {
    const detail = await getErrorMessage(response);
    if (response.status === 401) {
      redirectToLogin();
      throw new Error('Сессия истекла. Войдите заново и повторите загрузку файла.');
    }
    if (response.status === 403) {
      throw new Error('Недостаточно прав для выполнения операции.');
    }
    throw new Error(detail || response.statusText);
  }
  return response.json() as Promise<T>;
}

async function requestBlob(path: string, options: RequestInit = {}): Promise<Blob> {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!response.ok) {
    const detail = await getErrorMessage(response);
    if (response.status === 401) {
      redirectToLogin();
      throw new Error('Сессия истекла. Войдите заново и повторите экспорт.');
    }
    throw new Error(detail || response.statusText);
  }
  return response.blob();
}

export const api = {
  async login(login: string, password: string) {
    return request<{ access_token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password })
    });
  },
  async forgotPassword(email: string) {
    return request<{ status: string; message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },
  me: () => request<User>('/api/auth/me'),
  waves: () => request<Wave[]>('/api/meta/waves'),
  lastUpdate: () => request<{ last_update: string | null }>('/api/meta/last-update'),
  dashboard: (path: string, wave: string, periodicity: string) =>
    request<DashboardResponse>(`${path}?wave=${encodeURIComponent(wave)}&periodicity=${periodicity}`),
  regions: (params: { wave: string; segment?: string; product?: string; settlement_type?: string }) => {
    const search = new URLSearchParams({ wave: params.wave });
    if (params.segment) search.set('segment', params.segment);
    if (params.product) search.set('product', params.product);
    if (params.settlement_type) search.set('settlement_type', params.settlement_type);
    return request<RegionsDashboardResponse>(`/api/dashboard/regions?${search.toString()}`);
  },
  fieldControl: (wave: string) => request<{ title: string; wave: string; rows: Array<Record<string, string | number>> }>(`/api/dashboard/field-control?wave=${encodeURIComponent(wave)}`),
  uploadValidate: (kind: 'nps' | 'calls', file: File) => {
    const body = new FormData();
    body.append('file', file);
    return request<Record<string, unknown>>(`/api/uploads/${kind}/validate`, { method: 'POST', body });
  },
  uploadCommit: (kind: 'nps' | 'calls', file: File) => {
    const body = new FormData();
    body.append('file', file);
    return request<Record<string, unknown>>(`/api/uploads/${kind}/commit`, { method: 'POST', body });
  },
  uploadHistory: () => request<Array<Record<string, string | number>>>('/api/uploads/history'),
  dictionary: (type: string) => request<Array<Record<string, string | number | boolean | null>>>(`/api/admin/dictionaries/${type}`),
  plans: () => request<Array<Record<string, string | number | null>>>('/api/admin/plans'),
  minimumBases: () => request<Array<Record<string, string | number>>>('/api/admin/minimum-bases'),
  users: () => request<User[]>('/api/admin/users'),
  exportPdf: async (scope: 'current' | 'all') => {
    const blob = await requestBlob(`/api/exports/pdf/${scope}`, { method: 'POST' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = scope === 'current' ? 'nps-current-page.pdf' : 'nps-all-pages.pdf';
    anchor.click();
    URL.revokeObjectURL(url);
  }
};

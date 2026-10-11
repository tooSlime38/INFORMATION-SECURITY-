import type { User, UserRole, UserStatus, AuditLog, BackupMetadata } from '../types';

let inMemoryToken: string | null = null;

export function setAccessToken(token: string | null) {
  inMemoryToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryToken;
}

interface RequestOptions extends RequestInit {
  retryOn401?: boolean;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function buildUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  return `${API_BASE_URL}${endpoint}`;
}

export async function request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { retryOn401 = true, headers = {}, ...rest } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Client-Platform': 'Web',
    ...(headers as Record<string, string>),
  };

  if (inMemoryToken) {
    requestHeaders['Authorization'] = `Bearer ${inMemoryToken}`;
  }

  const url = buildUrl(endpoint);
  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
    credentials: 'include', // Includes HttpOnly cookies
  });

  // Handle Token Refresh on 401
  if (response.status === 401 && retryOn401 && endpoint !== '/api/auth/refresh' && endpoint !== '/api/auth/login') {
    try {
      const refreshRes = await fetch(buildUrl('/api/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.data?.accessToken) {
          setAccessToken(refreshData.data.accessToken);
          // Retry original request once with new token
          return request<T>(endpoint, { ...options, retryOn401: false });
        }
      } else {
        setAccessToken(null);
      }
    } catch {
      setAccessToken(null);
    }
  }

  const json = await response.json();

  if (!response.ok) {
    const errorMsg = json.message || json.error?.code || `Request failed with status ${response.status}`;
    const err: any = new Error(errorMsg);
    err.status = response.status;
    err.data = json;
    throw err;
  }

  return json;
}

export const api = {
  // Auth
  register: (body: any) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  verify2fa: (body: any) => request('/api/auth/verify-2fa', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  refreshToken: () => request('/api/auth/refresh', { method: 'POST' }),

  // 2FA Management
  setup2fa: () => request('/api/auth/2fa/setup', { method: 'POST' }),
  enable2fa: (code: string) => request('/api/auth/2fa/enable', { method: 'POST', body: JSON.stringify({ code }) }),
  disable2fa: (body: any) => request('/api/auth/2fa/disable', { method: 'POST', body: JSON.stringify(body) }),

  // School Management System Endpoints
  getCourses: () => request<{ data: { courses: any[]; total: number } }>('/api/school/courses'),
  getAnnouncements: () => request<{ data: { announcements: any[] } }>('/api/school/announcements'),
  getMyEnrollments: () => request<{ data: any }>('/api/school/my-enrollments'),
  createCourse: (body: any) => request('/api/school/courses', { method: 'POST', body: JSON.stringify(body) }),
  deleteCourse: (id: string) => request(`/api/school/courses/${id}`, { method: 'DELETE' }),

  // User
  getMe: () => request<{ data: User }>('/api/users/me'),

  // Admin
  getUsers: () => request<{ data: { users: User[]; total: number } }>('/api/admin/users'),
  updateUserRole: (id: string, role: UserRole) =>
    request(`/api/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  updateUserStatus: (id: string, status: UserStatus) =>
    request(`/api/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteUser: (id: string) => request(`/api/admin/users/${id}`, { method: 'DELETE' }),
  getAuditLogs: () => request<{ data: { logs: AuditLog[]; total: number } }>('/api/admin/audit-logs'),
  getBackups: () => request<{ data: { backups: BackupMetadata[]; total: number } }>('/api/admin/backups'),
  createBackup: () => request('/api/admin/backups/create', { method: 'POST' }),
  restoreBackup: (id: string) => request(`/api/admin/backups/restore/${id}`, { method: 'POST' }),
};

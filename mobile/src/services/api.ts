import { SecureStorage } from './storage';

// In Android Emulator, host machine localhost is accessible at 10.0.2.2
// For iOS Simulator or physical devices on same Wi-Fi, change to your machine's LAN IP
let API_BASE_URL = 'http://localhost:5000';

let inMemoryAccessToken: string | null = null;

export function setApiBaseUrl(url: string) {
  API_BASE_URL = url.replace(/\/$/, '');
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
}

export async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Client-Platform': 'Expo-Mobile',
    ...(options.headers as Record<string, string>),
  };

  if (inMemoryAccessToken) {
    headers['Authorization'] = `Bearer ${inMemoryAccessToken}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, { ...options, headers });

  // Handle Token Refresh on 401
  if (response.status === 401 && endpoint !== '/api/auth/refresh' && endpoint !== '/api/auth/login') {
    const storedRefreshToken = await SecureStorage.getItem('refreshToken');
    if (storedRefreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Platform': 'Expo-Mobile',
          },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });

        if (refreshRes.ok) {
          const refreshJson = await refreshRes.json();
          if (refreshJson.data?.accessToken) {
            setAccessToken(refreshJson.data.accessToken);
            if (refreshJson.data?.refreshToken) {
              await SecureStorage.setItem('refreshToken', refreshJson.data.refreshToken);
            }
            // Retry original request
            headers['Authorization'] = `Bearer ${refreshJson.data.accessToken}`;
            const retryRes = await fetch(url, { ...options, headers });
            return await retryRes.json();
          }
        }
      } catch {
        await SecureStorage.removeItem('refreshToken');
        setAccessToken(null);
      }
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

export const mobileApi = {
  // Auth
  register: async (body: any) => {
    const res = await request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) });
    if (res.data?.refreshToken) {
      await SecureStorage.setItem('refreshToken', res.data.refreshToken);
    }
    return res;
  },
  login: async (body: any) => {
    const res = await request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) });
    if (res.data?.refreshToken) {
      await SecureStorage.setItem('refreshToken', res.data.refreshToken);
    }
    return res;
  },
  verify2fa: async (body: any) => {
    const res = await request('/api/auth/verify-2fa', { method: 'POST', body: JSON.stringify(body) });
    if (res.data?.refreshToken) {
      await SecureStorage.setItem('refreshToken', res.data.refreshToken);
    }
    return res;
  },
  logout: async () => {
    const storedRefreshToken = await SecureStorage.getItem('refreshToken');
    try {
      await request('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });
    } finally {
      await SecureStorage.removeItem('refreshToken');
      setAccessToken(null);
    }
  },

  // 2FA
  setup2fa: () => request('/api/auth/2fa/setup', { method: 'POST' }),
  enable2fa: (code: string) => request('/api/auth/2fa/enable', { method: 'POST', body: JSON.stringify({ code }) }),
  disable2fa: (body: any) => request('/api/auth/2fa/disable', { method: 'POST', body: JSON.stringify(body) }),

  // User
  getMe: () => request('/api/users/me'),

  // Admin
  getUsers: () => request('/api/admin/users'),
  updateUserRole: (id: string, role: string) =>
    request(`/api/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  updateUserStatus: (id: string, status: string) =>
    request(`/api/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteUser: (id: string) => request(`/api/admin/users/${id}`, { method: 'DELETE' }),
  getAuditLogs: () => request('/api/admin/audit-logs'),
  getBackups: () => request('/api/admin/backups'),
  createBackup: () => request('/api/admin/backups/create', { method: 'POST' }),
  restoreBackup: (id: string) => request(`/api/admin/backups/restore/${id}`, { method: 'POST' }),
};

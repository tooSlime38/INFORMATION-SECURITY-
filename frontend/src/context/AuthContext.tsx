import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAccessToken } from '../services/api';
import type { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<{ requires2FA: boolean }>;
  register: (username: string, password: string, confirmPassword: string) => Promise<void>;
  verify2fa: (code: string, isRecoveryCode?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  cancel2fa: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
    tempToken: null,
    requires2FA: false,
  });

  // On mount: attempt silent refresh using HttpOnly cookie
  useEffect(() => {
    async function initAuth() {
      try {
        const refreshRes = await api.refreshToken();
        if (refreshRes.data?.accessToken) {
          setAccessToken(refreshRes.data.accessToken);
          const meRes = await api.getMe();
          setState({
            user: meRes.data,
            accessToken: refreshRes.data.accessToken,
            isAuthenticated: true,
            isLoading: false,
            tempToken: null,
            requires2FA: false,
          });
          return;
        }
      } catch {
        // No active session cookie
      }
      setState((prev) => ({ ...prev, isLoading: false }));
    }

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const res = await api.login({ username, password });

      if (res.data.requires2FA) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          requires2FA: true,
          tempToken: res.data.tempToken,
        }));
        return { requires2FA: true };
      }

      setAccessToken(res.data.accessToken);
      setState({
        user: res.data.user,
        accessToken: res.data.accessToken,
        isAuthenticated: true,
        isLoading: false,
        tempToken: null,
        requires2FA: false,
      });
      return { requires2FA: false };
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw err;
    }
  };

  const register = async (username: string, password: string, confirmPassword: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const res = await api.register({ username, password, confirmPassword });
      setAccessToken(res.data.accessToken);
      setState({
        user: res.data.user,
        accessToken: res.data.accessToken,
        isAuthenticated: true,
        isLoading: false,
        tempToken: null,
        requires2FA: false,
      });
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw err;
    }
  };

  const verify2fa = async (code: string, isRecoveryCode = false) => {
    if (!state.tempToken) throw new Error('No active 2FA challenge');
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const res = await api.verify2fa({
        tempToken: state.tempToken,
        code,
        isRecoveryCode,
      });

      setAccessToken(res.data.accessToken);
      setState({
        user: res.data.user,
        accessToken: res.data.accessToken,
        isAuthenticated: true,
        isLoading: false,
        tempToken: null,
        requires2FA: false,
      });
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw err;
    }
  };

  const cancel2fa = () => {
    setState((prev) => ({
      ...prev,
      requires2FA: false,
      tempToken: null,
    }));
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setAccessToken(null);
      setState({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
        tempToken: null,
        requires2FA: false,
      });
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await api.getMe();
      setState((prev) => ({ ...prev, user: res.data }));
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        verify2fa,
        cancel2fa,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

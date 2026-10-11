import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, ShieldCheck, ShieldAlert, Key, Clock, Calendar, Hash, ArrowRight } from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Welcome Header */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-8 mb-8 backdrop-blur shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Authenticated Session Active</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome, {user.username}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Role-Based Authorization Level:{' '}
            <span
              className={`font-semibold ${
                user.role === 'ADMIN' ? 'text-purple-400' : 'text-emerald-400'
              }`}
            >
              {user.role}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate('security')}
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center space-x-2"
          >
            <Key className="w-4 h-4 text-emerald-400" />
            <span>Security Settings</span>
          </button>

          {user.role === 'ADMIN' && (
            <button
              onClick={() => onNavigate('admin')}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center space-x-2 shadow-lg"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Admin Panel</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Profile Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* 2FA Status Card */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Two-Factor Auth
            </span>
            {user.twoFactorEnabled ? (
              <span className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </span>
            ) : (
              <span className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                <Shield className="w-5 h-5" />
              </span>
            )}
          </div>
          <div className="text-xl font-bold text-white mb-1">
            {user.twoFactorEnabled ? 'TOTP Active' : 'Not Configured'}
          </div>
          <p className="text-xs text-slate-400">
            {user.twoFactorEnabled
              ? 'Your account requires an authenticator app code on login.'
              : 'Add an extra cryptographic defense layer with Google Authenticator.'}
          </p>
        </div>

        {/* Account Role Card */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Authorization Role
            </span>
            <span
              className={`p-2 rounded-xl ${
                user.role === 'ADMIN'
                  ? 'bg-purple-500/10 text-purple-400'
                  : 'bg-emerald-500/10 text-emerald-400'
              }`}
            >
              <Shield className="w-5 h-5" />
            </span>
          </div>
          <div className="text-xl font-bold text-white mb-1">{user.role}</div>
          <p className="text-xs text-slate-400">
            {user.role === 'ADMIN'
              ? 'Full administrative control over users, logs, and backups.'
              : 'Standard access to personal dashboard and security controls.'}
          </p>
        </div>

        {/* Account Status Card */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Account Status
            </span>
            <span className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
          </div>
          <div className="text-xl font-bold text-white mb-1">{user.status}</div>
          <p className="text-xs text-slate-400">Your account is verified and operational.</p>
        </div>
      </div>

      {/* Internal System Details */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-4">
          Internal Account Metadata
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-900/80 border border-slate-700/60 rounded-xl flex items-center space-x-3">
            <Hash className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div className="overflow-hidden">
              <div className="text-slate-400">Internal Document ID</div>
              <div className="font-mono text-slate-200 truncate">{user.id}</div>
            </div>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-700/60 rounded-xl flex items-center space-x-3">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <div className="text-slate-400">Account Created</div>
              <div className="text-slate-200">{new Date(user.createdAt).toLocaleString()}</div>
            </div>
          </div>

          {user.lastLoginAt && (
            <div className="p-3 bg-slate-900/80 border border-slate-700/60 rounded-xl flex items-center space-x-3 sm:col-span-2">
              <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div>
                <div className="text-slate-400">Last Authentication Timestamp</div>
                <div className="text-slate-200">{new Date(user.lastLoginAt).toLocaleString()}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, ShieldAlert, User, LogOut, LayoutDashboard, Key, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="bg-slate-800/90 backdrop-blur border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => onNavigate('landing')}
          >
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">SecureAuth</span>
              <span className="text-xs text-emerald-400 ml-2 px-1.5 py-0.5 bg-emerald-950/60 border border-emerald-800/50 rounded">
                RBAC &bull; 2FA
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === 'dashboard'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => onNavigate('security')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === 'security'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Key className="w-4 h-4" />
                  <span>Security</span>
                </button>

                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => onNavigate('admin')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === 'admin'
                        ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
                        : 'text-purple-400 hover:bg-purple-900/20'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 text-purple-400" />
                    <span>Admin Panel</span>
                  </button>
                )}

                {/* User Status / Role Pill */}
                <div className="flex items-center space-x-2 pl-2 border-l border-slate-700">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-white">{user?.username}</div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-end space-x-1">
                      <span>{user?.role}</span>
                      {user?.twoFactorEnabled ? (
                        <span title="2FA Active"><ShieldCheck className="w-3 h-3 text-emerald-400" /></span>
                      ) : (
                        <span title="2FA Disabled"><Shield className="w-3 h-3 text-amber-400" /></span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => logout()}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('login')}
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-3.5 py-1.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition-colors"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Shield,
  ShieldAlert,
  LogOut,
  LayoutDashboard,
  Key,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { user, isAuthenticated, logout } = useAuth();

  const getRoleBadge = (role?: string) => {
    if (role === 'ADMIN') {
      return { label: 'Admin / Registrar', style: 'bg-purple-950/70 border-purple-700/60 text-purple-300' };
    }
    if (role === 'USER') {
      return { label: 'Student / Faculty', style: 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300' };
    }
    return { label: 'Guest Visitor', style: 'bg-blue-950/70 border-blue-700/60 text-blue-300' };
  };

  const roleInfo = getRoleBadge(user?.role);

  return (
    <nav className="bg-slate-900/95 backdrop-blur border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & University Brand */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => onNavigate('landing')}
          >
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-white tracking-tight">Apex University</span>
                <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 bg-emerald-950/80 border border-emerald-800/60 rounded-full">
                  Portal
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">School Management System</div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-3">
            {/* Catalog Link (always visible) */}
            <button
              onClick={() => onNavigate('catalog')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                currentPage === 'catalog'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Course Catalog</span>
            </button>

            {isAuthenticated ? (
              <>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                    currentPage === 'dashboard'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>
                    {user?.role === 'GUEST'
                      ? 'Guest Portal'
                      : user?.role === 'ADMIN'
                      ? 'Admin Dashboard'
                      : 'Student Dashboard'}
                  </span>
                </button>

                <button
                  onClick={() => onNavigate('security')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                    currentPage === 'security'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Key className="w-4 h-4 text-emerald-400" />
                  <span>2FA Security</span>
                </button>

                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => onNavigate('admin')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                      currentPage === 'admin'
                        ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                        : 'text-purple-400 hover:bg-purple-950/30'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 text-purple-400" />
                    <span>School Console</span>
                  </button>
                )}

                {/* User Status / Role Pill */}
                <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
                  <div className="text-right">
                    <div className="text-xs font-bold text-white flex items-center justify-end space-x-1">
                      <span>{user?.username}</span>
                      {user?.twoFactorEnabled ? (
                        <span title="2FA Active">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        </span>
                      ) : (
                        <span title="2FA Disabled">
                          <Shield className="w-3.5 h-3.5 text-amber-400" />
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border mt-0.5 inline-block ${roleInfo.style}`}
                    >
                      {roleInfo.label}
                    </div>
                  </div>

                  <button
                    onClick={() => logout()}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl transition-colors"
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
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-4 py-1.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition-colors"
                >
                  Register Portal ID
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

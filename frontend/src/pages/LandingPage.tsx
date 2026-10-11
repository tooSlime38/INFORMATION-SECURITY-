import React from 'react';
import { Shield, KeyRound, Lock, Database, RefreshCw, Users, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: string) => void;
  isAuthenticated: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, isAuthenticated }) => {
  const pillars = [
    {
      icon: <UserIcon />,
      title: 'Username-Only Authentication',
      desc: 'Zero reliance on email or phone numbers. Enforces case-insensitive atomic username uniqueness in Firestore.',
      badge: 'Identification',
      color: 'emerald',
    },
    {
      icon: <Lock className="w-5 h-5 text-emerald-400" />,
      title: 'Argon2id Hashing + Salt + Pepper',
      desc: 'Protected with per-user 128-bit salts and a high-entropy server pepper held strictly outside the database.',
      badge: 'Password Security',
      color: 'emerald',
    },
    {
      icon: <KeyRound className="w-5 h-5 text-blue-400" />,
      title: 'AES-256-GCM AEAD Encryption',
      desc: 'TOTP secrets are symmetrically encrypted with 256-bit AES in Galois/Counter Mode with 12-byte nonces and 16-byte authentication tags.',
      badge: 'Cryptographic Protection',
      color: 'blue',
    },
    {
      icon: <Shield className="w-5 h-5 text-indigo-400" />,
      title: 'TOTP Two-Factor Authentication',
      desc: 'RFC 6238 time-based one-time passwords compatible with Google Authenticator, plus 8 SHA-256 hashed recovery codes.',
      badge: 'Multi-Factor Auth',
      color: 'indigo',
    },
    {
      icon: <Users className="w-5 h-5 text-purple-400" />,
      title: 'Role-Based Access Control',
      desc: 'Strict server-side authorization enforcing GUEST, USER, and ADMIN roles. Cannot be bypassed via client-side manipulation.',
      badge: 'Authorization',
      color: 'purple',
    },
    {
      icon: <Database className="w-5 h-5 text-amber-400" />,
      title: 'Automated Firestore Backups',
      desc: 'Scheduled and on-demand database snapshots with SHA-256 integrity checksums, history audit, and 1-click disaster recovery.',
      badge: 'Disaster Recovery',
      color: 'amber',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <Shield className="w-3.5 h-3.5" />
          <span>Information Security Academic Project</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
          Secure Role-Based Authentication System
        </h1>

        <p className="text-lg text-slate-300 mb-8 leading-relaxed">
          Demonstrating enterprise authentication, Two-Factor Authentication (TOTP), AES-256-GCM cryptographic protection, role-based authorization, and automated Firestore disaster recovery.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          {isAuthenticated ? (
            <button
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg transition-all"
            >
              <span>Go to User Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => onNavigate('register')}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg transition-all"
              >
                <span>Register Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('login')}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-xl transition-all"
              >
                <span>Sign In</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Six Architectural Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pillars.map((p, idx) => (
          <div
            key={idx}
            className="p-6 bg-slate-800/60 border border-slate-700/80 rounded-2xl hover:border-slate-600 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-slate-900 border border-slate-700/60 rounded-xl">
                {p.icon}
              </div>
              <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-700/40">
                {p.badge}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{p.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

function UserIcon() {
  return (
    <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

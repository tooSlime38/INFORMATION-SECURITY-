import React from 'react';
import {
  GraduationCap,
  Shield,
  KeyRound,
  Lock,
  Database,
  Users,
  BookOpen,
  ArrowRight,
  Award,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: string) => void;
  isAuthenticated: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, isAuthenticated }) => {
  const roles = [
    {
      role: 'GUEST',
      title: 'Guest / Prospective Student',
      color: 'blue',
      badge: 'Public Tier',
      desc: 'Browse active course catalogs, campus announcements, and academic calendars with read-only guest privileges.',
      features: ['Public Course Directory', 'Campus Announcements', 'Cybersecurity Compliance Notice'],
    },
    {
      role: 'USER',
      title: 'Enrolled Student / Faculty',
      color: 'emerald',
      badge: 'Academic Tier',
      desc: 'Access your student dashboard, view enrolled classes, midterm grades, and attendance. Protected by mandatory TOTP 2FA.',
      features: ['Course Enrollments & Timetable', 'GPA & Academic Standing', 'Personal 2FA Security Center'],
    },
    {
      role: 'ADMIN',
      title: 'School Administrator & Registrar',
      color: 'purple',
      badge: 'Governance Tier',
      desc: 'Full administrative governance: manage student/staff rosters, assign roles, inspect campus login audit trails, and run cloud backups.',
      features: ['Student & Staff Roster Governance', 'Live Campus Security Audit Trail', 'Automated Firestore Backups & Restore'],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <GraduationCap className="w-4 h-4" />
          <span>Apex University &bull; School Management System</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
          Secure Role-Based Campus Portal
        </h1>

        <p className="text-base sm:text-lg text-slate-300 mb-8 leading-relaxed">
          An enterprise-grade academic portal demonstrating <strong>Username + Password Authentication</strong>, <strong>Two-Factor Authentication (TOTP)</strong>, <strong>AES-256-GCM Encryption</strong>, and <strong>Automated Database Backups</strong> with three distinct authorization tiers.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => onNavigate('catalog')}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>Explore Course Catalog</span>
          </button>

          {isAuthenticated ? (
            <button
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold rounded-xl transition-all"
            >
              <span>Go to Your Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => onNavigate('register')}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-xl transition-all"
              >
                <span>Register Student ID</span>
              </button>
              <button
                onClick={() => onNavigate('login')}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-xl transition-all"
              >
                <span>Portal Sign In</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Three Role Portals */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white tracking-tight">Three-Tier Role Authorization</h2>
          <p className="text-sm text-slate-400 mt-1">Enforced strictly on the Node.js backend using Role-Based Access Control</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((r) => (
            <div
              key={r.role}
              className="bg-slate-800/70 border border-slate-700/80 rounded-3xl p-6 flex flex-col justify-between hover:border-slate-600 transition-all shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      r.role === 'ADMIN'
                        ? 'bg-purple-950 text-purple-300 border border-purple-800'
                        : r.role === 'USER'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-blue-950 text-blue-300 border border-blue-800'
                    }`}
                  >
                    {r.role} ROLE
                  </span>
                  <span className="text-[11px] text-slate-400">{r.badge}</span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{r.title}</h3>
                <p className="text-xs text-slate-300 mb-6 leading-relaxed">{r.desc}</p>

                <div className="space-y-2 pt-4 border-t border-slate-700/60 mb-6">
                  {r.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-xs text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  if (r.role === 'GUEST') onNavigate('catalog');
                  else if (!isAuthenticated) onNavigate('login');
                  else onNavigate('dashboard');
                }}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
              >
                <span>{r.role === 'GUEST' ? 'Explore Guest Catalog' : 'Access Portal Tier'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security Architecture Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-800/40 border border-slate-700/60 rounded-2xl">
          <Lock className="w-5 h-5 text-emerald-400 mb-2" />
          <h4 className="text-sm font-bold text-white mb-1">Argon2id + Salt + Pepper</h4>
          <p className="text-xs text-slate-400">Password hashing with 64MB memory cost and private server-side pepper.</p>
        </div>

        <div className="p-5 bg-slate-800/40 border border-slate-700/60 rounded-2xl">
          <KeyRound className="w-5 h-5 text-blue-400 mb-2" />
          <h4 className="text-sm font-bold text-white mb-1">AES-256-GCM AEAD</h4>
          <p className="text-xs text-slate-400">TOTP secrets encrypted with 256-bit symmetric key and tamper-proof auth tag.</p>
        </div>

        <div className="p-5 bg-slate-800/40 border border-slate-700/60 rounded-2xl">
          <Shield className="w-5 h-5 text-indigo-400 mb-2" />
          <h4 className="text-sm font-bold text-white mb-1">Google Authenticator</h4>
          <p className="text-xs text-slate-400">RFC 6238 TOTP codes paired with 8 hashed emergency recovery codes.</p>
        </div>

        <div className="p-5 bg-slate-800/40 border border-slate-700/60 rounded-2xl">
          <Database className="w-5 h-5 text-amber-400 mb-2" />
          <h4 className="text-sm font-bold text-white mb-1">Automated Backups</h4>
          <p className="text-xs text-slate-400">Full Firestore snapshots with SHA-256 checksums and 1-click restore.</p>
        </div>
      </div>
    </div>
  );
};

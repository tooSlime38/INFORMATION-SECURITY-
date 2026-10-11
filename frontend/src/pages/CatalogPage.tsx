import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BookOpen, Search, Clock, User, Bell, Shield, ArrowRight } from 'lucide-react';

interface CatalogPageProps {
  onNavigate: (page: string) => void;
  isAuthenticated: boolean;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({ onNavigate, isAuthenticated }) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, aRes] = await Promise.all([api.getCourses(), api.getAnnouncements()]);
        setCourses(cRes.data.courses);
        setAnnouncements(aRes.data.announcements);
      } catch (err) {
        console.error('Failed to load catalog data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const departments = ['ALL', ...Array.from(new Set(courses.map((c) => c.department)))];

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.instructor.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || c.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-8 mb-10 shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Academic Curriculum & Campus Notices</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            Apex University Academic Catalog
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            Explore active courses in Cybersecurity, Software Engineering, and Computer Science. Enrolled students and faculty must log in with Username + Password and TOTP Two-Factor Authentication.
          </p>

          {!isAuthenticated && (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate('register')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center space-x-2 shadow-lg"
              >
                <span>Register Portal Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('login')}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition-colors"
              >
                Sign In to Student Portal
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Courses Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search course code, title, professor..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedDept === dept
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700/60'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Loading course catalog...</div>
          ) : (
            <div className="space-y-4">
              {filteredCourses.map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-6 hover:border-slate-600 transition-all shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-emerald-400 text-sm px-2.5 py-1 bg-emerald-950/80 border border-emerald-800/60 rounded-lg">
                        {c.code}
                      </span>
                      <h3 className="text-lg font-bold text-white">{c.title}</h3>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-700">
                      {c.credits} Credits &bull; {c.department}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-4 leading-relaxed">{c.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-400 pt-3 border-t border-slate-700/60">
                    <div className="flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{c.instructor}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{c.schedule}</span>
                    </div>
                    <div className="text-right sm:text-right font-medium text-emerald-400">
                      Enrolled: {c.enrolledCount} / {c.capacity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Announcements & Security Notice */}
        <div className="space-y-6">
          {/* Announcements Card */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 shadow-lg">
            <h3 className="text-base font-bold text-white flex items-center space-x-2 mb-4">
              <Bell className="w-4 h-4 text-emerald-400" />
              <span>Campus Announcements</span>
            </h3>

            <div className="space-y-4">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-4 bg-slate-900/80 border border-slate-700/60 rounded-2xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        ann.category === 'SECURITY'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}
                    >
                      {ann.category}
                    </span>
                    <span className="text-[10px] text-slate-500">{ann.date}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1">{ann.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cybersecurity Policy Notice */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 shadow-lg">
            <h3 className="text-base font-bold text-white flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Academic Data Security</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              All student grade books, enrollment rosters, and faculty records are secured using:
            </p>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>Argon2id password hashing + salt + server pepper</li>
              <li>AES-256-GCM encryption for TOTP secrets</li>
              <li>Google Authenticator Two-Factor Authentication</li>
              <li>Automated daily Firestore database backups</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

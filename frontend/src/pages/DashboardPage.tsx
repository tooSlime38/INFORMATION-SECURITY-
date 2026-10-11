import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  GraduationCap,
  BookOpen,
  Award,
  ShieldCheck,
  ShieldAlert,
  Key,
  Clock,
  Calendar,
  Hash,
  ArrowRight,
  Info,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadStudentData() {
      if (user?.role === 'USER' || user?.role === 'ADMIN') {
        setIsLoading(true);
        try {
          const res = await api.getMyEnrollments();
          setEnrollments(res.data);
        } catch (err) {
          console.error('Failed to load academic records:', err);
        } finally {
          setIsLoading(false);
        }
      }
    }
    loadStudentData();
  }, [user]);

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Banner */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-8 mb-8 backdrop-blur shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Apex University Portal Session Active</span>
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <span>Welcome, {user.username}</span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                user.role === 'ADMIN'
                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                  : user.role === 'USER'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-blue-950 text-blue-300 border border-blue-800'
              }`}
            >
              {user.role} ROLE
            </span>
          </h1>

          <p className="text-slate-400 text-sm mt-1">
            {user.role === 'ADMIN'
              ? 'Administrator Access Level: Complete governance over academic records, faculty rosters, and database backups.'
              : user.role === 'USER'
              ? 'Enrolled Student / Faculty Member: Full access to course curriculum, attendance, and grade records.'
              : 'Guest Access Level: Public prospective student account. Read-only permissions across course catalog.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate('security')}
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center space-x-2"
          >
            <Key className="w-4 h-4 text-emerald-400" />
            <span>2FA Security</span>
          </button>

          {user.role === 'ADMIN' && (
            <button
              onClick={() => onNavigate('admin')}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center space-x-2 shadow-lg"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>School Admin Console</span>
            </button>
          )}

          {user.role === 'GUEST' && (
            <button
              onClick={() => onNavigate('catalog')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center space-x-2 shadow-lg"
            >
              <BookOpen className="w-4 h-4" />
              <span>Browse Catalog</span>
            </button>
          )}
        </div>
      </div>

      {/* ROLE 1: GUEST ROLE SPECIFIC VIEW */}
      {user.role === 'GUEST' && (
        <div className="bg-slate-800/60 border border-blue-900/60 rounded-3xl p-8 mb-8 shadow-xl">
          <div className="flex items-start space-x-4 mb-6">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400">
              <Info className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Guest / Prospective Student Portal</h2>
              <p className="text-sm text-slate-300 mt-1">
                You are currently signed in with a <strong>GUEST</strong> role. Guests can view the public course catalog, academic calendar, and faculty directory, but cannot register for official grades or access confidential student transcripts.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300 mb-6">
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-700/60">
              <h4 className="font-semibold text-white mb-1">What you can do:</h4>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                <li>Search the university curriculum & course descriptions</li>
                <li>Inspect cybersecurity accreditation and compliance rules</li>
                <li>Configure Two-Factor Authentication (TOTP) for your account</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-700/60">
              <h4 className="font-semibold text-white mb-1">Want to enroll as an official student?</h4>
              <p className="text-xs text-slate-400 mb-3">
                Log into an administrator account or ask your school registrar to elevate your role from <code>GUEST</code> to <code>USER</code>.
              </p>
              <button
                onClick={() => onNavigate('catalog')}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1"
              >
                <span>Browse available university courses</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROLE 2: USER (STUDENT / FACULTY) ROLE SPECIFIC VIEW */}
      {(user.role === 'USER' || user.role === 'ADMIN') && enrollments && (
        <>
          {/* Academic Standing Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Cumulative GPA
              </span>
              <div className="text-2xl font-black text-emerald-400">{enrollments.cumulativeGpa}</div>
              <span className="text-[11px] text-slate-400">Scale of 4.00</span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Completed Credits
              </span>
              <div className="text-2xl font-black text-white">{enrollments.completedCredits}</div>
              <span className="text-[11px] text-slate-400">+14 Credits in progress</span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Academic Standing
              </span>
              <div className="text-sm font-bold text-emerald-300 flex items-center space-x-1 mt-1">
                <Award className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="truncate">Dean's Honor List</span>
              </div>
              <span className="text-[11px] text-slate-400">Good Standing</span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Student ID
              </span>
              <div className="text-base font-mono font-bold text-white mt-1">{enrollments.studentId}</div>
              <span className="text-[11px] text-slate-400">Apex University Registry</span>
            </div>
          </div>

          {/* Enrolled Courses Table */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 shadow-xl mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <GraduationCap className="w-5 h-5 text-emerald-400" />
                  <span>Enrolled Courses & Academic Transcript</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Current Semester Schedule & Progress</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Course</th>
                    <th className="py-3 px-4">Instructor</th>
                    <th className="py-3 px-4">Schedule & Room</th>
                    <th className="py-3 px-4 text-center">Attendance</th>
                    <th className="py-3 px-4 text-right">Midterm Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {enrollments.enrolledCourses.map((c: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-700/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{c.title}</div>
                        <div className="text-xs text-emerald-400 font-mono">{c.code}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">{c.instructor}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        <div>{c.schedule}</div>
                        <div className="text-slate-500">{c.room}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {c.attendanceRate}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-emerald-400 text-base">{c.midtermGrade}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Account Security & Internal Metadata Card */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-4">
          Academic Account & Security Verification
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-900/80 border border-slate-700/60 rounded-xl flex items-center space-x-3">
            <Hash className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div className="overflow-hidden">
              <div className="text-slate-400">Internal Document UUID</div>
              <div className="font-mono text-slate-200 truncate">{user.id}</div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-900/80 border border-slate-700/60 rounded-xl flex items-center space-x-3">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <div className="text-slate-400">Account Registered</div>
              <div className="text-slate-200">{new Date(user.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-900/80 border border-slate-700/60 rounded-xl flex items-center space-x-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div>
              <div className="text-slate-400">Two-Factor Security</div>
              <div className={user.twoFactorEnabled ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {user.twoFactorEnabled ? 'TOTP Active' : 'Not Enabled'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

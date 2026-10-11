import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { User, UserRole, UserStatus, AuditLog, BackupMetadata } from '../types';
import {
  Users,
  ShieldAlert,
  Database,
  RefreshCw,
  Trash2,
  CheckCircle,
  Clock,
  Download,
  RotateCcw,
  BookOpen,
  Plus,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'courses' | 'audit' | 'backups'>('users');

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Courses state
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDept, setNewDept] = useState('Cybersecurity');
  const [newCredits, setNewCredits] = useState('3');
  const [newInstructor, setNewInstructor] = useState('');
  const [newSchedule, setNewSchedule] = useState('');

  // Audit Logs state
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Backups state
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.getUsers();
      setUsers(res.data.users);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await api.getCourses();
      setCourses(res.data.courses);
    } catch (err: any) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await api.getAuditLogs();
      setLogs(res.data.logs);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchBackups = async () => {
    setLoadingBackups(true);
    try {
      const res = await api.getBackups();
      setBackups(res.data.backups);
    } catch (err: any) {
      console.error('Failed to load backups:', err);
    } finally {
      setLoadingBackups(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'courses') fetchCourses();
    if (activeTab === 'audit') fetchLogs();
    if (activeTab === 'backups') fetchBackups();
  }, [activeTab]);

  const handleRoleChange = async (userId: string, role: UserRole) => {
    try {
      await api.updateUserRole(userId, role);
      setActionMessage(`Role updated to ${role}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    }
  };

  const handleStatusChange = async (userId: string, status: UserStatus) => {
    try {
      await api.updateUserStatus(userId, status);
      setActionMessage(`User account marked as ${status}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to change status');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to permanently delete user '${username}'?`)) return;
    try {
      await api.deleteUser(userId);
      setActionMessage(`User '${username}' deleted successfully`);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCourse({
        code: newCode,
        title: newTitle,
        department: newDept,
        credits: parseInt(newCredits, 10),
        instructor: newInstructor,
        schedule: newSchedule,
      });
      setActionMessage(`Course ${newCode} added to university catalog.`);
      setNewCode('');
      setNewTitle('');
      setNewInstructor('');
      setNewSchedule('');
      fetchCourses();
    } catch (err: any) {
      alert(err.message || 'Failed to create course');
    }
  };

  const handleDeleteCourse = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to remove course ${code}?`)) return;
    try {
      await api.deleteCourse(id);
      setActionMessage(`Course ${code} removed.`);
      fetchCourses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete course');
    }
  };

  const handleCreateBackup = async () => {
    setLoadingBackups(true);
    setActionMessage(null);
    try {
      const res = await api.createBackup();
      setActionMessage(`Automated snapshot created: ${res.data.id} (${res.data.totalDocuments} records)`);
      fetchBackups();
    } catch (err: any) {
      alert(err.message || 'Backup creation failed');
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (!confirm(`Warning: Restoring backup '${backupId}' will overwrite current database state. Proceed?`)) {
      return;
    }
    setLoadingBackups(true);
    setActionMessage(null);
    try {
      const res = await api.restoreBackup(backupId);
      setActionMessage(`Database successfully restored (${res.data.restoredDocuments} documents)`);
      fetchBackups();
    } catch (err: any) {
      alert(err.message || 'Restoration failed');
    } finally {
      setLoadingBackups(false);
    }
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.ipAddress?.includes(searchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Apex University Administration Console</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">School Registrar & Governance</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage Student & Faculty Accounts (GUEST / USER / ADMIN), Course Catalog, Campus Security Logs, and Database Backups.
        </p>
      </div>

      {actionMessage && (
        <div className="mb-6 p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl flex items-center justify-between text-emerald-300 text-sm shadow-lg">
          <div className="flex items-center space-x-2.5">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-xs hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-700/80 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-2 px-5 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'users'
              ? 'border-purple-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student & Staff Roster</span>
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`flex items-center space-x-2 px-5 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'courses'
              ? 'border-purple-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Course Catalog Governance</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center space-x-2 px-5 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'audit'
              ? 'border-purple-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Campus Security Audit Trail</span>
        </button>

        <button
          onClick={() => setActiveTab('backups')}
          className={`flex items-center space-x-2 px-5 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'backups'
              ? 'border-purple-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database Backups & Disaster Recovery</span>
        </button>
      </div>

      {/* TAB 1: USER ROSTER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 shadow-xl backdrop-blur">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Registered Accounts ({users.length})</h3>
              <p className="text-xs text-slate-400">Change authorization roles (GUEST, USER, ADMIN) or toggle active enrollment status.</p>
            </div>
            <button
              onClick={fetchUsers}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Portal Username</th>
                  <th className="py-3.5 px-4">Authorization Role</th>
                  <th className="py-3.5 px-4">Enrollment Status</th>
                  <th className="py-3.5 px-4">2FA Protection</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div>{u.username}</div>
                      <div className="text-[10px] text-slate-500 font-mono">ID: {u.id.substring(0, 12)}...</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="GUEST">GUEST (Visitor)</option>
                        <option value="USER">USER (Student / Staff)</option>
                        <option value="ADMIN">ADMIN (Registrar)</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() =>
                          handleStatusChange(u.id, u.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE')
                        }
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {u.status}
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          u.twoFactorEnabled
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-900 text-slate-500'
                        }`}
                      >
                        {u.twoFactorEnabled ? 'TOTP Active' : 'Off'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: COURSE CATALOG GOVERNANCE */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          {/* Add Course Form */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 shadow-xl backdrop-blur">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>Add New University Course</span>
            </h3>

            <form onSubmit={handleAddCourse} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Course Code
                </label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g. CS-450"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Course Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Cloud Security Engineering"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  required
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  placeholder="e.g. Cybersecurity"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Credits
                </label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  required
                  value={newCredits}
                  onChange={(e) => setNewCredits(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Instructor
                </label>
                <input
                  type="text"
                  value={newInstructor}
                  onChange={(e) => setNewInstructor(e.target.value)}
                  placeholder="e.g. Dr. Ada Lovelace"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Schedule
                </label>
                <input
                  type="text"
                  value={newSchedule}
                  onChange={(e) => setNewSchedule(e.target.value)}
                  placeholder="e.g. Mon / Wed 2:00 PM"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="sm:col-span-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-lg"
                >
                  Publish Course to Catalog
                </button>
              </div>
            </form>
          </div>

          {/* Existing Courses List */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 shadow-xl backdrop-blur">
            <h3 className="text-lg font-bold text-white mb-4">Active Course Catalog ({courses.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Credits</th>
                    <th className="py-3 px-4">Instructor</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {courses.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-700/20">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">{c.code}</td>
                      <td className="py-3 px-4 font-semibold text-white">{c.title}</td>
                      <td className="py-3 px-4 text-xs text-slate-400">{c.department}</td>
                      <td className="py-3 px-4 text-xs">{c.credits}</td>
                      <td className="py-3 px-4 text-xs text-slate-300">{c.instructor}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteCourse(c.id, c.code)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg"
                          title="Delete Course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 shadow-xl backdrop-blur">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-bold text-white">Campus Security Event Log ({filteredLogs.length})</h3>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search event, username, IP..."
                className="px-3.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={fetchLogs}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50"
              >
                <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 uppercase font-semibold text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">Event Type</th>
                  <th className="py-3 px-3">User</th>
                  <th className="py-3 px-3">IP Address</th>
                  <th className="py-3 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 font-mono">
                {filteredLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-700/20 transition-colors">
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.severity === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : log.severity === 'WARNING'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-900 text-blue-300 border border-slate-700'
                        }`}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-white">{log.eventType}</td>
                    <td className="py-3 px-3 text-slate-300">{log.username || '-'}</td>
                    <td className="py-3 px-3 text-slate-400">{log.ipAddress || '-'}</td>
                    <td className="py-3 px-3 text-slate-400 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DATABASE BACKUPS */}
      {activeTab === 'backups' && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 shadow-xl backdrop-blur">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-700/80">
            <div>
              <h3 className="text-xl font-bold text-white">Automated Student & Staff Database Backups</h3>
              <p className="text-xs text-slate-400 mt-1">
                Exports all Firestore collections (`users`, `usernames`, `twoFactor`, `courses`, `auditLogs`) with SHA-256 integrity verification.
              </p>
            </div>

            <button
              onClick={handleCreateBackup}
              disabled={loadingBackups}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>{loadingBackups ? 'Backing Up...' : 'Create Backup Snapshot'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Snapshot ID</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Total Records</th>
                  <th className="py-3.5 px-4">SHA-256 Integrity Checksum</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Disaster Recovery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {backups.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-white">
                      {b.id}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {new Date(b.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-400">
                      {b.totalDocuments}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                      {b.checksum ? `${b.checksum.substring(0, 16)}...` : '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleRestoreBackup(b.id)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center space-x-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Restore Snapshot</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

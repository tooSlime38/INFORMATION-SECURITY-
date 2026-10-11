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
  AlertTriangle,
  Info,
  Clock,
  Download,
  RotateCcw,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'backups'>('users');

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

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

  const handleCreateBackup = async () => {
    setLoadingBackups(true);
    setActionMessage(null);
    try {
      const res = await api.createBackup();
      setActionMessage(`Backup created: ${res.data.id} (${res.data.totalDocuments} documents)`);
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
          <span>Restricted Administrator Console</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Control Center</h1>
        <p className="text-slate-400 text-sm mt-1">
          Role-Based Access Control, Security Audit Trail, and Automated Database Backups.
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
      <div className="flex space-x-2 border-b border-slate-700/80 mb-8">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-2 px-5 py-3 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'users'
              ? 'border-purple-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Management</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center space-x-2 px-5 py-3 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'audit'
              ? 'border-purple-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Security Audit Trail</span>
        </button>

        <button
          onClick={() => setActiveTab('backups')}
          className={`flex items-center space-x-2 px-5 py-3 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'backups'
              ? 'border-purple-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database Backups & Disaster Recovery</span>
        </button>
      </div>

      {/* TAB 1: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 shadow-xl backdrop-blur">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Registered Users ({users.length})</h3>
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
                  <th className="py-3.5 px-4">Username</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">2FA</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">{u.username}</td>
                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="GUEST">GUEST</option>
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
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : 'bg-slate-900 text-slate-500'
                        }`}
                      >
                        {u.twoFactorEnabled ? 'Active' : 'Off'}
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

      {/* TAB 2: SECURITY AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 shadow-xl backdrop-blur">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-bold text-white">Security Event Log ({filteredLogs.length})</h3>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search event, user, IP..."
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

      {/* TAB 3: DATABASE BACKUPS */}
      {activeTab === 'backups' && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 shadow-xl backdrop-blur">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-700/80">
            <div>
              <h3 className="text-xl font-bold text-white">Automated Database Backups</h3>
              <p className="text-xs text-slate-400 mt-1">
                Creates full snapshots of all Firestore collections with SHA-256 integrity checksums.
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
                  <th className="py-3.5 px-4">Documents</th>
                  <th className="py-3.5 px-4">SHA-256 Checksum</th>
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
                        <span>Restore</span>
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

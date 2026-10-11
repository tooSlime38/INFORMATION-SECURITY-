import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { mobileApi, setAccessToken, setApiBaseUrl, getApiBaseUrl } from './src/services/api';
import { SecureStorage } from './src/services/storage';
import type { User, UserRole } from './src/types';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register' | '2fa' | 'dashboard' | 'security' | 'admin'>('login');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiUrl, setApiUrl] = useState<string>(getApiBaseUrl());
  const [showConfig, setShowConfig] = useState<boolean>(false);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [isRecoveryCode, setIsRecoveryCode] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 2FA Setup states
  const [setupData, setSetupData] = useState<{ qrCode: string; secret: string; recoveryCodes: string[] } | null>(null);
  const [confirm2faCode, setConfirm2faCode] = useState('');

  // Admin states
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [adminBackups, setAdminBackups] = useState<any[]>([]);
  const [adminTab, setAdminTab] = useState<'users' | 'logs' | 'backups'>('users');

  // Check existing session on boot
  useEffect(() => {
    async function checkSession() {
      try {
        const storedRefreshToken = await SecureStorage.getItem('refreshToken');
        if (storedRefreshToken) {
          const meRes = await mobileApi.getMe();
          setUser(meRes.data);
          setCurrentScreen('dashboard');
        }
      } catch {
        // No valid session
      } finally {
        setIsLoading(false);
      }
    }
    checkSession();
  }, []);

  const handleLogin = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await mobileApi.login({ username, password });
      if (res.data.requires2FA) {
        setTempToken(res.data.tempToken);
        setCurrentScreen('2fa');
      } else {
        setAccessToken(res.data.accessToken);
        setUser(res.data.user);
        setCurrentScreen('dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await mobileApi.register({ username, password, confirmPassword });
      setAccessToken(res.data.accessToken);
      setUser(res.data.user);
      setCurrentScreen('dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2fa = async () => {
    if (!tempToken) return;
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await mobileApi.verify2fa({
        tempToken,
        code: totpCode.trim(),
        isRecoveryCode,
      });
      setAccessToken(res.data.accessToken);
      setUser(res.data.user);
      setCurrentScreen('dashboard');
      setTempToken(null);
      setTotpCode('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid 2FA code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await mobileApi.logout();
    } finally {
      setUser(null);
      setAccessToken(null);
      setCurrentScreen('login');
      setIsLoading(false);
    }
  };

  const handleStart2faSetup = async () => {
    try {
      const res = await mobileApi.setup2fa();
      setSetupData(res.data);
    } catch (err: any) {
      Alert.alert('Setup Failed', err.message);
    }
  };

  const handleConfirm2fa = async () => {
    try {
      await mobileApi.enable2fa(confirm2faCode.trim());
      const meRes = await mobileApi.getMe();
      setUser(meRes.data);
      setSetupData(null);
      setConfirm2faCode('');
      Alert.alert('Success', '2FA is now active on your mobile account.');
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message);
    }
  };

  const handleLoadAdmin = async () => {
    try {
      if (adminTab === 'users') {
        const res = await mobileApi.getUsers();
        setAdminUsers(res.data.users);
      } else if (adminTab === 'logs') {
        const res = await mobileApi.getAuditLogs();
        setAdminLogs(res.data.logs);
      } else if (adminTab === 'backups') {
        const res = await mobileApi.getBackups();
        setAdminBackups(res.data.backups);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  useEffect(() => {
    if (currentScreen === 'admin') {
      handleLoadAdmin();
    }
  }, [currentScreen, adminTab]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Securing session...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header Bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Apex University Portal</Text>
        <TouchableOpacity onPress={() => setShowConfig(!showConfig)}>
          <Text style={styles.configBtn}>⚙️ Server</Text>
        </TouchableOpacity>
      </View>

      {/* Backend URL Config Drawer */}
      {showConfig && (
        <View style={styles.configDrawer}>
          <Text style={styles.configLabel}>Node.js API Endpoint:</Text>
          <TextInput
            style={styles.configInput}
            value={apiUrl}
            onChangeText={(text) => {
              setApiUrl(text);
              setApiBaseUrl(text);
            }}
            placeholder="http://localhost:5000"
            placeholderTextColor="#64748b"
          />
          <Text style={styles.configHint}>Tip: Use 10.0.2.2:5000 on Android Emulator, or your LAN IP on Wi-Fi</Text>
        </View>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* SCREEN: LOGIN */}
        {currentScreen === 'login' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>
            <Text style={styles.cardSubtitle}>Username & Password Only</Text>

            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#64748b"
              secureTextEntry
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}>
              <Text style={styles.primaryBtnText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setCurrentScreen('register')}>
              <Text style={styles.secondaryBtnText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SCREEN: REGISTER */}
        {currentScreen === 'register' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Register</Text>
            <Text style={styles.cardSubtitle}>New Username Registration</Text>

            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Choose username"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password (8+ chars, upper, lower, digit, symbol)"
              placeholderTextColor="#64748b"
              secureTextEntry
            />

            <Text style={styles.inputLabel}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm password"
              placeholderTextColor="#64748b"
              secureTextEntry
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister}>
              <Text style={styles.primaryBtnText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setCurrentScreen('login')}>
              <Text style={styles.secondaryBtnText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SCREEN: 2FA CHALLENGE */}
        {currentScreen === '2fa' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Two-Factor Verification</Text>
            <Text style={styles.cardSubtitle}>
              {isRecoveryCode ? 'Enter 10-char Emergency Recovery Code' : 'Enter 6-Digit Authenticator Code'}
            </Text>

            <TextInput
              style={[styles.input, styles.codeInput]}
              value={totpCode}
              onChangeText={(t) => setTotpCode(t.toUpperCase())}
              placeholder={isRecoveryCode ? 'ABC12-DEF34' : '123456'}
              placeholderTextColor="#64748b"
              maxLength={isRecoveryCode ? 15 : 6}
              autoCapitalize="characters"
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleVerify2fa}>
              <Text style={styles.primaryBtnText}>Verify Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.textBtn}
              onPress={() => {
                setIsRecoveryCode(!isRecoveryCode);
                setTotpCode('');
              }}
            >
              <Text style={styles.textBtnLabel}>
                {isRecoveryCode ? 'Use Authenticator App Code' : 'Use Emergency Recovery Code'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setCurrentScreen('login')}>
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SCREEN: DASHBOARD */}
        {currentScreen === 'dashboard' && user && (
          <View style={styles.card}>
            <View style={styles.profileBadge}>
              <Text style={styles.profileRole}>{user.role}</Text>
            </View>
            <Text style={styles.cardTitle}>Welcome, {user.username}</Text>
            <Text style={styles.cardSubtitle}>Authenticated Session</Text>

            <View style={styles.metaBox}>
              <Text style={styles.metaItem}>2FA Status: {user.twoFactorEnabled ? '✅ Enabled' : '⚠️ Disabled'}</Text>
              <Text style={styles.metaItem}>Account Status: {user.status}</Text>
              <Text style={styles.metaItem}>User ID: {user.id.substring(0, 18)}...</Text>
            </View>

            <TouchableOpacity style={styles.actionBtn} onPress={() => setCurrentScreen('security')}>
              <Text style={styles.actionBtnText}>🔐 Security & 2FA Settings</Text>
            </TouchableOpacity>

            {user.role === 'ADMIN' && (
              <TouchableOpacity style={styles.adminActionBtn} onPress={() => setCurrentScreen('admin')}>
                <Text style={styles.actionBtnText}>🛡️ Admin Control Panel</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SCREEN: SECURITY & 2FA SETTINGS */}
        {currentScreen === 'security' && user && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Security & 2FA</Text>
            <Text style={styles.cardSubtitle}>Manage TOTP Multi-Factor Authentication</Text>

            {user.twoFactorEnabled ? (
              <View style={styles.active2faBox}>
                <Text style={styles.active2faTitle}>✅ 2FA is Active</Text>
                <Text style={styles.active2faSub}>Account protected by time-based one-time passwords.</Text>
              </View>
            ) : (
              <View>
                {!setupData ? (
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleStart2faSetup}>
                    <Text style={styles.primaryBtnText}>Enable 2FA (Setup Wizard)</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.setupContainer}>
                    <Text style={styles.setupStep}>Step 1: Scan QR or copy secret</Text>
                    {setupData.qrCode ? (
                      <Image source={{ uri: setupData.qrCode }} style={styles.qrImage} />
                    ) : null}
                    <Text style={styles.secretText}>Secret: {setupData.secret}</Text>

                    <Text style={styles.setupStep}>Step 2: Save Recovery Codes</Text>
                    <View style={styles.recoveryGrid}>
                      {setupData.recoveryCodes.map((c, i) => (
                        <Text key={i} style={styles.recoveryCode}>
                          {c}
                        </Text>
                      ))}
                    </View>

                    <Text style={styles.setupStep}>Step 3: Enter 6-digit Code to Confirm</Text>
                    <TextInput
                      style={[styles.input, styles.codeInput]}
                      value={confirm2faCode}
                      onChangeText={setConfirm2faCode}
                      placeholder="123456"
                      placeholderTextColor="#64748b"
                      maxLength={6}
                      keyboardType="numeric"
                    />

                    <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirm2fa}>
                      <Text style={styles.primaryBtnText}>Confirm & Activate 2FA</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setCurrentScreen('dashboard')}>
              <Text style={styles.secondaryBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SCREEN: ADMIN PANEL */}
        {currentScreen === 'admin' && user?.role === 'ADMIN' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Admin Console</Text>
            <Text style={styles.cardSubtitle}>Users &bull; Audits &bull; Backups</Text>

            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tabBtn, adminTab === 'users' && styles.activeTabBtn]}
                onPress={() => setAdminTab('users')}
              >
                <Text style={styles.tabText}>Users</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, adminTab === 'logs' && styles.activeTabBtn]}
                onPress={() => setAdminTab('logs')}
              >
                <Text style={styles.tabText}>Audits</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, adminTab === 'backups' && styles.activeTabBtn]}
                onPress={() => setAdminTab('backups')}
              >
                <Text style={styles.tabText}>Backups</Text>
              </TouchableOpacity>
            </View>

            {adminTab === 'users' && (
              <View>
                {adminUsers.map((u) => (
                  <View key={u.id} style={styles.adminItem}>
                    <Text style={styles.adminItemTitle}>{u.username} ({u.role})</Text>
                    <Text style={styles.adminItemSub}>Status: {u.status} | 2FA: {u.twoFactorEnabled ? 'On' : 'Off'}</Text>
                  </View>
                ))}
              </View>
            )}

            {adminTab === 'logs' && (
              <View>
                {adminLogs.slice(0, 10).map((l, i) => (
                  <View key={i} style={styles.adminItem}>
                    <Text style={styles.adminItemTitle}>{l.eventType}</Text>
                    <Text style={styles.adminItemSub}>User: {l.username || 'System'} | IP: {l.ipAddress}</Text>
                  </View>
                ))}
              </View>
            )}

            {adminTab === 'backups' && (
              <View>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={async () => {
                    await mobileApi.createBackup();
                    handleLoadAdmin();
                  }}
                >
                  <Text style={styles.primaryBtnText}>📦 Create Backup Snapshot</Text>
                </TouchableOpacity>

                {adminBackups.map((b) => (
                  <View key={b.id} style={styles.adminItem}>
                    <Text style={styles.adminItemTitle}>{b.id}</Text>
                    <Text style={styles.adminItemSub}>Docs: {b.totalDocuments} | Status: {b.status}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setCurrentScreen('dashboard')}>
              <Text style={styles.secondaryBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  configBtn: { color: '#10b981', fontSize: 13, fontWeight: '600' },
  configDrawer: {
    backgroundColor: '#1e293b',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  configLabel: { color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', marginBottom: 4 },
  configInput: {
    backgroundColor: '#0f172a',
    color: '#fff',
    padding: 8,
    borderRadius: 8,
    fontSize: 13,
  },
  configHint: { color: '#64748b', fontSize: 10, marginTop: 4 },
  errorBanner: { backgroundColor: '#4c0519', padding: 12, marginHorizontal: 16, marginTop: 12, borderRadius: 10 },
  errorText: { color: '#f43f5e', fontSize: 12, fontWeight: '600' },
  scrollContent: { padding: 16 },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  cardSubtitle: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 20 },
  inputLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 6 },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 14,
  },
  codeInput: { textAlign: 'center', fontSize: 20, letterSpacing: 4, fontWeight: 'bold' },
  primaryBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  secondaryBtn: {
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryBtnText: { color: '#cbd5e1', fontSize: 13, fontWeight: '600' },
  textBtn: { alignItems: 'center', paddingVertical: 10 },
  textBtnLabel: { color: '#38bdf8', fontSize: 12 },
  profileBadge: { alignSelf: 'center', backgroundColor: '#064e3b', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 8 },
  profileRole: { color: '#34d399', fontSize: 11, fontWeight: 'bold' },
  metaBox: { backgroundColor: '#0f172a', borderRadius: 12, padding: 12, marginBottom: 16 },
  metaItem: { color: '#94a3b8', fontSize: 12, marginVertical: 3 },
  actionBtn: { backgroundColor: '#0369a1', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 10 },
  adminActionBtn: { backgroundColor: '#7e22ce', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 10 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  logoutBtn: { backgroundColor: '#881337', borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
  logoutBtnText: { color: '#fda4af', fontWeight: 'bold', fontSize: 12 },
  active2faBox: { backgroundColor: '#064e3b', borderRadius: 12, padding: 16, marginBottom: 16, alignItems: 'center' },
  active2faTitle: { color: '#34d399', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  active2faSub: { color: '#a7f3d0', fontSize: 12, textAlign: 'center' },
  setupContainer: { alignItems: 'center', marginVertical: 10 },
  setupStep: { color: '#34d399', fontSize: 12, fontWeight: 'bold', marginVertical: 8 },
  qrImage: { width: 180, height: 180, borderRadius: 12, marginVertical: 8 },
  secretText: { color: '#94a3b8', fontSize: 11, fontFamily: 'monospace', marginBottom: 10 },
  recoveryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginVertical: 8 },
  recoveryCode: { backgroundColor: '#0f172a', color: '#e2e8f0', padding: 6, borderRadius: 6, fontSize: 11, fontFamily: 'monospace' },
  tabRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  activeTabBtn: { backgroundColor: '#7e22ce' },
  tabText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  adminItem: { backgroundColor: '#0f172a', borderRadius: 10, padding: 10, marginVertical: 4 },
  adminItemTitle: { color: '#fff', fontSize: 13, fontWeight: '600' },
  adminItemSub: { color: '#64748b', fontSize: 11, marginTop: 2 },
  loadingText: { color: '#94a3b8', marginTop: 12, fontSize: 13 },
});

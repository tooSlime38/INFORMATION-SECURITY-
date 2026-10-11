import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ShieldCheck, ShieldAlert, KeyRound, Copy, Check, AlertCircle, ArrowRight, X } from 'lucide-react';

export const SecuritySettingsPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();

  // 2FA Setup Wizard States
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupData, setSetupData] = useState<{
    qrCode: string;
    secret: string;
    recoveryCodes: string[];
  } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  // Disable 2FA Modal States
  const [isDisabling, setIsDisabling] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [disableError, setDisableError] = useState<string | null>(null);
  const [isSubmittingDisable, setIsSubmittingDisable] = useState(false);

  const startSetup = async () => {
    setSetupError(null);
    try {
      const res = await api.setup2fa();
      setSetupData(res.data);
      setIsSettingUp(true);
    } catch (err: any) {
      setSetupError(err.message || 'Failed to initialize 2FA setup');
    }
  };

  const handleConfirmEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError(null);
    setIsVerifying(true);

    try {
      await api.enable2fa(verifyCode.trim());
      await refreshProfile();
      setIsSettingUp(false);
      setSetupData(null);
      setVerifyCode('');
    } catch (err: any) {
      setSetupError(err.message || 'Invalid 6-digit verification code');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisableError(null);
    setIsSubmittingDisable(true);

    try {
      await api.disable2fa({
        password: disablePassword,
        code: disableCode.trim(),
      });
      await refreshProfile();
      setIsDisabling(false);
      setDisablePassword('');
      setDisableCode('');
    } catch (err: any) {
      setDisableError(err.message || 'Failed to disable 2FA');
    } finally {
      setIsSubmittingDisable(false);
    }
  };

  const copyRecoveryCodes = () => {
    if (!setupData) return;
    navigator.clipboard.writeText(setupData.recoveryCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Security & Cryptography</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage Two-Factor Authentication (2FA) and inspect cryptographic parameters.
        </p>
      </div>

      {/* 2FA Main Card */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-8 shadow-xl backdrop-blur mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-700/80">
          <div className="flex items-start space-x-4">
            <div
              className={`p-3 rounded-2xl ${
                user.twoFactorEnabled
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
              }`}
            >
              {user.twoFactorEnabled ? (
                <ShieldCheck className="w-8 h-8" />
              ) : (
                <ShieldAlert className="w-8 h-8" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold text-white">TOTP Two-Factor Authentication</h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    user.twoFactorEnabled
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {user.twoFactorEnabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                {user.twoFactorEnabled
                  ? 'Your account is secured with RFC 6238 time-based one-time passwords.'
                  : 'Protect your account from unauthorized access by requiring an authenticator code.'}
              </p>
            </div>
          </div>

          <div>
            {user.twoFactorEnabled ? (
              <button
                onClick={() => setIsDisabling(true)}
                className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 rounded-xl text-sm font-semibold transition-colors"
              >
                Disable 2FA
              </button>
            ) : (
              !isSettingUp && (
                <button
                  onClick={startSetup}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg flex items-center space-x-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Configure 2FA</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* 2FA Setup Flow */}
        {isSettingUp && setupData && (
          <div className="mt-8 pt-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Set Up Authenticator App</span>
              </h3>
              <button
                onClick={() => setIsSettingUp(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {setupError && (
              <div className="mb-6 p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-start space-x-3 text-rose-300 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>{setupError}</div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Step 1: Scan QR Code */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 text-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 block mb-2">
                  Step 1: Scan QR Code
                </span>
                <p className="text-xs text-slate-400 mb-4">
                  Open Google Authenticator, Microsoft Authenticator, or another compatible app.
                </p>

                <div className="bg-white p-3 rounded-2xl inline-block shadow-md mb-4">
                  <img
                    src={setupData.qrCode}
                    alt="2FA QR Code"
                    className="w-48 h-48 mx-auto"
                  />
                </div>

                <div className="text-xs text-slate-400">
                  <span>Manual Entry Secret: </span>
                  <code className="bg-slate-800 px-2 py-1 rounded text-slate-200 font-mono select-all">
                    {setupData.secret}
                  </code>
                </div>
              </div>

              {/* Step 2: Emergency Recovery Codes */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                      Step 2: Backup Recovery Codes
                    </span>
                    <button
                      onClick={copyRecoveryCodes}
                      className="text-xs text-slate-300 hover:text-white flex items-center space-x-1"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Codes</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    Save these 8 one-time codes safely. They allow you to regain access if you lose your authenticator device.
                  </p>

                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 text-center">
                    {setupData.recoveryCodes.map((code, idx) => (
                      <div key={idx} className="p-1 bg-slate-900 rounded">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 3: Verify Code */}
                <form onSubmit={handleConfirmEnable} className="mt-6 pt-4 border-t border-slate-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 block mb-2">
                    Step 3: Confirm Setup
                  </span>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value)}
                      placeholder="6-digit code"
                      className="flex-1 px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-center text-sm font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={isVerifying || verifyCode.length !== 6}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center space-x-1.5"
                    >
                      <span>{isVerifying ? 'Activating...' : 'Activate 2FA'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Disable 2FA Modal */}
      {isDisabling && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Disable Two-Factor Authentication</h3>
            <p className="text-xs text-slate-400 mb-6">
              For security, enter your current password and your current authenticator code to confirm.
            </p>

            {disableError && (
              <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs">
                {disableError}
              </div>
            )}

            <form onSubmit={handleConfirmDisable} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  6-Digit TOTP Code
                </label>
                <input
                  type="text"
                  required
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  placeholder="123456"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-center tracking-widest text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDisabling(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDisable}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl shadow-lg"
                >
                  {isSubmittingDisable ? 'Disabling...' : 'Confirm Disable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

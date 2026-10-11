import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, LifeBuoy, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

interface TwoFactorChallengeProps {
  onNavigate: (page: string) => void;
}

export const TwoFactorChallenge: React.FC<TwoFactorChallengeProps> = ({ onNavigate }) => {
  const { verify2fa, cancel2fa } = useAuth();
  const [code, setCode] = useState('');
  const [isRecovery, setIsRecovery] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await verify2fa(code.trim(), isRecovery);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    cancel2fa();
    onNavigate('login');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-800/80 border border-slate-700 rounded-2xl p-8 shadow-2xl backdrop-blur">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 mb-3">
            {isRecovery ? <LifeBuoy className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Two-Factor Authentication</h2>
          <p className="text-sm text-slate-400 mt-1">
            {isRecovery
              ? 'Enter an emergency one-time recovery code'
              : 'Enter the 6-digit code from your Authenticator app'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-start space-x-3 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 text-center">
              {isRecovery ? 'Recovery Code' : '6-Digit TOTP Code'}
            </label>
            <input
              type="text"
              required
              autoFocus
              maxLength={isRecovery ? 15 : 6}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={isRecovery ? 'e.g. A1B2C-D3E4F' : '123456'}
              className="w-full py-3 px-4 bg-slate-900 border border-slate-700 rounded-xl text-center text-xl font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !code}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg transition-colors flex items-center justify-center space-x-2 text-sm"
          >
            <span>{isSubmitting ? 'Verifying...' : 'Verify & Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-700/60 flex items-center justify-between text-xs">
          <button
            onClick={() => {
              setIsRecovery(!isRecovery);
              setCode('');
              setError(null);
            }}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors flex items-center space-x-1"
          >
            {isRecovery ? (
              <span>Back to Authenticator app</span>
            ) : (
              <span>Lost device? Use recovery code</span>
            )}
          </button>

          <button
            onClick={handleCancel}
            className="text-slate-400 hover:text-slate-300 transition-colors flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
};

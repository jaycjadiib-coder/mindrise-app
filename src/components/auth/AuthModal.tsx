import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
  customMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
  customMessage
}) => {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Sync mode with initialMode prop when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, initialMode]);

  // Close on Escape key
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else if (mode === 'register') {
        await registerWithEmail(name, email, password);
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessMsg('A password reset link has been dispatched to your inbox.');
        setLoading(false);
        return;
      }

      setLoading(false);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setLoading(false);
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Incorrect email or password. Please verify your credentials or reset password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in.');
      } else {
        setError(err.message || 'Authentication encountered an issue. Please check your credentials.');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      setLoading(false);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setLoading(false);
      console.error(err);
      setError(err.message || 'Google sign in encountered an issue.');
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md cursor-pointer"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-indigo-500/40 bg-[#090D1C] p-6 sm:p-8 shadow-[0_0_60px_rgba(59,130,246,0.2)] animate-in fade-in zoom-in-95 duration-200 cursor-default text-slate-100"
      >
        {/* Glow ambient */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-48 h-48 bg-violet-600/20 blur-3xl rounded-full" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 w-48 h-48 bg-blue-600/20 blur-3xl rounded-full" />

        {/* Close Button (Wrong / Cross 'X' Button) */}
        <button
          type="button"
          id="auth-modal-close-button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 z-50 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white active:scale-90 transition-all cursor-pointer border border-white/10 shadow-lg pointer-events-auto"
          aria-label="Close modal"
          title="Close"
        >
          <X className="h-5 w-5 pointer-events-none" />
        </button>

        {/* Brand Header */}
        <div className="text-center relative">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 border border-blue-400/30 shadow-lg shadow-blue-600/30">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-4 font-serif text-2xl font-bold text-white tracking-tight">
            {mode === 'login' && 'Sign In to MindRise'}
            {mode === 'register' && 'Create Your Scholar Account'}
            {mode === 'forgot' && 'Reset Your Password'}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {mode === 'login' && 'Enter your premium library of 8.5M+ curated masterworks.'}
            {mode === 'register' && 'Begin reading, audio narration, and habit mastery in real-time.'}
            {mode === 'forgot' && 'Enter your email to receive recovery instructions.'}
          </p>
        </div>

        {/* Mandatory Login Notice Banner */}
        {customMessage && (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
            <Lock className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-amber-300 block">Sign In Mandatory</span>
              <span>{customMessage}</span>
            </div>
          </div>
        )}

        {/* Error / Success Notifications */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-900/50 bg-rose-950/40 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 rounded-xl border border-emerald-900/50 bg-emerald-950/40 p-3 text-xs text-emerald-300">
            {successMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-3.5 relative">
          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-medium text-slate-400">Full Name</label>
              <div className="relative mt-1">
                <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Marcus Vance"
                  className="w-full rounded-xl border border-indigo-950/80 bg-[#0E1428]/80 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-400">Email Address</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full rounded-xl border border-indigo-950/80 bg-[#0E1428]/80 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-slate-400">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[10px] text-blue-400 hover:text-blue-300 transition"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative mt-1">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-indigo-950/80 bg-[#0E1428]/80 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-medium text-slate-400">Confirm Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-indigo-950/80 bg-[#0E1428]/80 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 py-3 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 border border-white/20"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Sign In to MindRise'}
                  {mode === 'register' && 'Create Account & Enter'}
                  {mode === 'forgot' && 'Send Reset Link'}
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-indigo-950" />
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">or quick access with</span>
          <div className="h-px flex-1 bg-indigo-950" />
        </div>

        {/* Third Party & Demo Access */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-indigo-950/80 bg-[#0E1428]/60 py-2.5 text-xs font-medium text-slate-200 transition-all hover:border-indigo-500/50 hover:bg-[#151F38]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.8 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 20.4 7.5 23 12 23z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Footer toggle */}
        <div className="mt-6 text-center text-xs text-slate-400">
          {mode === 'login' ? (
            <>
              Don’t have an account?{' '}
              <button
                onClick={() => setMode('register')}
                className="font-medium text-blue-400 hover:text-blue-300 hover:underline"
              >
                Create one now
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                className="font-medium text-blue-400 hover:text-blue-300 hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

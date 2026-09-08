import React, { useState } from 'react';
import { User, Mail, Lock, X, Check, ShieldCheck, Sparkles, ArrowRight, KeyRound } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { resetPasswordForEmail } from '../services/auth';

export const AuthModal: React.FC = () => {
  const { showAuthModal, setShowAuthModal, signIn, signUp, authUser, signOut } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!showAuthModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const res = await signIn(email, password);
        if (res.error) {
          setErrorMessage(res.error);
        }
      } else if (mode === 'signup') {
        if (!name.trim()) {
          setErrorMessage('Please enter your full name.');
          setIsLoading(false);
          return;
        }
        const res = await signUp(name, email, password);
        if (res.error) {
          setErrorMessage(res.error);
        }
      } else if (mode === 'forgot') {
        const res = await resetPasswordForEmail(email);
        if (!res.success) {
          setErrorMessage(res.error || 'Password reset request failed');
        } else {
          setSuccessMessage('Password reset instructions sent to your email.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="auth_modal_backdrop"
      className="fixed inset-0 z-50 bg-[#111827]/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-[#1A1B1F] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 relative border border-[#E5E5E1] dark:border-[#2E3036] animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {authUser ? (
          /* Already Signed In View */
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 font-bold text-2xl flex items-center justify-center mx-auto border border-indigo-200 dark:border-indigo-800">
              {authUser.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-serif font-light text-[#111827] dark:text-white">
                {authUser.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{authUser.email}</p>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl flex items-center gap-3 text-left">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-900 dark:text-emerald-200">
                Your study streak, custom chapters, and revision logs are securely synced.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => setShowAuthModal(false)}
                className="w-full py-2.5 bg-[#4F46E5] hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm rounded-xl transition-colors shadow-xs"
              >
                Continue Studying
              </button>
              <button
                onClick={async () => {
                  await signOut();
                  setShowAuthModal(false);
                }}
                className="w-full py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold rounded-xl transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Sign Up / Forgot Password Form */
          <div className="space-y-5">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-[#4F46E5] dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Student Account</span>
              </div>
              <h2 className="text-2xl font-serif font-light text-[#111827] dark:text-white tracking-tight">
                {mode === 'signin' && 'Welcome back'}
                {mode === 'signup' && 'Create your account'}
                {mode === 'forgot' && 'Reset Password'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                {mode === 'signin' && 'Sign in to access your study schedules and streaks'}
                {mode === 'signup' && 'Start syncing your syllabus, revision alerts, and friend circle'}
                {mode === 'forgot' && 'Enter your email to receive a password reset link'}
              </p>
            </div>

            {/* Mode Switch Tabs */}
            {mode !== 'forgot' ? (
              <div className="flex rounded-xl bg-gray-100 dark:bg-[#141518] p-1 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    mode === 'signin'
                      ? 'bg-white dark:bg-[#23252B] text-[#111827] dark:text-white shadow-xs font-semibold'
                      : 'text-gray-500 hover:text-[#111827] dark:text-gray-400'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    mode === 'signup'
                      ? 'bg-white dark:bg-[#23252B] text-[#111827] dark:text-white shadow-xs font-semibold'
                      : 'text-gray-500 hover:text-[#111827] dark:text-gray-400'
                  }`}
                >
                  Create Account
                </button>
              </div>
            ) : null}

            {/* Error banner */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-300">
                {errorMessage}
              </div>
            )}

            {/* Success banner */}
            {successMessage && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Arjun Singh"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white text-xs sm:text-sm focus:border-[#4F46E5] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white text-xs sm:text-sm focus:border-[#4F46E5] focus:outline-none"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
                      Password
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setErrorMessage('');
                          setSuccessMessage('');
                        }}
                        className="text-[11px] text-[#4F46E5] dark:text-indigo-400 hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white text-xs sm:text-sm focus:border-[#4F46E5] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-[#4F46E5] hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-xs sm:text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Please wait...</span>
                ) : mode === 'signin' ? (
                  <span>Sign In</span>
                ) : mode === 'signup' ? (
                  <span>Create Account</span>
                ) : (
                  <span>Send Reset Link</span>
                )}
                <ArrowRight className="w-4 h-4" />
              </button>

              {mode === 'forgot' && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="text-xs text-[#4F46E5] dark:text-indigo-400 hover:underline"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              )}
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Continue exploring without signing in
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

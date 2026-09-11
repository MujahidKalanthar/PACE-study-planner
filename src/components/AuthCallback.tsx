import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { supabase } from '../services/auth';
import { useApp } from '../context/AppContext';

export const AuthCallback: React.FC = () => {
  const { setShowOnboarding, data, exams } = useApp() as any;
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const handleAuthRedirect = async () => {
      const hash = window.location.hash;
      const search = window.location.search;

      // Check for error parameters
      const params = new URLSearchParams(search || hash.replace(/^#/, '?'));
      const errorDescription = params.get('error_description') || params.get('error');

      if (errorDescription) {
        setStatus('error');
        setMessage(decodeURIComponent(errorDescription));
        return;
      }

      const hasTokens = hash.includes('access_token') || hash.includes('type=signup') || search.includes('code=');
      if (!hasTokens) return;

      setStatus('verifying');
      setMessage('Verifying your email and activating your account...');

      try {
        if (supabase) {
          // If code query parameter exists (PKCE auth flow)
          const code = params.get('code');
          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              setStatus('error');
              setMessage(error.message);
              return;
            }
          }

          // Fetch fresh session after token exchange
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            setStatus('error');
            setMessage(sessionError.message);
            return;
          }

          if (session?.user) {
            setStatus('success');
            setMessage('Your email has been verified successfully! Welcome to PACE.');

            // Clean up the URL hash/query without reloading
            if (window.history?.replaceState) {
              window.history.replaceState(null, '', window.location.pathname);
            }

            // Auto-trigger onboarding if user hasn't created a plan yet
            setTimeout(() => {
              if ((!exams || exams.length === 0) && setShowOnboarding) {
                setShowOnboarding(true);
              }
              // Hide banner after 6 seconds
              setTimeout(() => setStatus('idle'), 6000);
            }, 1200);
          }
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Verification failed.');
      }
    };

    handleAuthRedirect();
  }, [exams, setShowOnboarding]);

  if (status === 'idle') return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] sm:w-full animate-in slide-in-from-top-4 duration-300">
      <div
        className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-md ${
          status === 'verifying'
            ? 'bg-indigo-50/95 dark:bg-indigo-950/90 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
            : status === 'success'
            ? 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            : 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
        }`}
      >
        {status === 'verifying' && <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5 animate-pulse" />}
        {status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />}
        {status === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />}

        <div className="flex-1 text-xs sm:text-sm font-medium">
          <p>{message}</p>
        </div>

        <button
          onClick={() => setStatus('idle')}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs px-1.5 py-0.5"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

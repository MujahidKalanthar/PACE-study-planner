import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { SyllabusScreen } from './components/SyllabusScreen';
import { PlanScreen } from './components/PlanScreen';
import { ProgressScreen } from './components/ProgressScreen';
import { FriendsScreen } from './components/FriendsScreen';
import { MoreScreen } from './components/MoreScreen';
import { StudySessionModal } from './components/StudySessionModal';
import { SyllabusImportModal } from './components/SyllabusImportModal';
import { OnboardingModal } from './components/OnboardingModal';
import { NotificationsModal } from './components/NotificationsModal';
import { AuthModal } from './components/AuthModal';
import { AuthCallback } from './components/AuthCallback';
import { Footer } from './components/Footer';
import { Mail, Check, AlertCircle, Loader2 } from 'lucide-react';

const UnverifiedEmailBanner: React.FC = () => {
  const { authUser, resendVerification } = useApp();
  const [dismissed, setDismissed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  if (!authUser || authUser.emailConfirmed !== false || dismissed) return null;

  const handleResend = async () => {
    setIsSending(true);
    setStatusMsg(null);
    try {
      const res = await resendVerification(authUser.email);
      if (res.success) {
        setStatusMsg({ text: 'Verification email sent! Please check your inbox and spam folder.' });
      } else {
        setStatusMsg({ text: res.error || 'Failed to resend email.', isError: true });
      }
    } catch (e: any) {
      setStatusMsg({ text: e.message || 'Failed to resend.', isError: true });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            Please verify your email (<strong>{authUser.email}</strong>) to activate cloud sync and connect with study buddies.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {statusMsg ? (
            <span
              className={`text-xs font-medium flex items-center gap-1 ${
                statusMsg.isError ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {statusMsg.isError ? <AlertCircle className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              {statusMsg.text}
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={isSending}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-[11px] transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSending && <Loader2 className="w-3 h-3 animate-spin" />}
              Resend Verification
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="text-amber-700/60 dark:text-amber-300/60 hover:text-amber-900 dark:hover:text-amber-100 p-1 text-xs"
            title="Dismiss notice"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-[#121316] flex flex-col md:flex-row text-[#1A1A1A] dark:text-[#F3F4F6] selection:bg-indigo-100 selection:text-indigo-900 transition-colors">
      {/* Auth Callback redirect listener */}
      <AuthCallback />

      {/* Navigation (Desktop Sidebar & Mobile Bottom Bar) */}
      <Navigation />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#FDFCFB] dark:bg-[#121316] transition-colors">
        <UnverifiedEmailBanner />
        <Header />

        <main className="flex-1 px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
          {activeTab === 'home' && <HomeScreen />}
          {activeTab === 'syllabus' && <SyllabusScreen />}
          {activeTab === 'plan' && <PlanScreen />}
          {activeTab === 'progress' && <ProgressScreen />}
          {activeTab === 'friends' && <FriendsScreen />}
          {activeTab === 'more' && <MoreScreen />}
        </main>

        {/* Minimal, Professional Student Product Footer */}
        <Footer />
      </div>

      {/* Global Interactive Modals */}
      <StudySessionModal />
      <SyllabusImportModal />
      <OnboardingModal />
      <NotificationsModal />
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

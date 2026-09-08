import React from 'react';
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
import { Footer } from './components/Footer';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-[#121316] flex flex-col md:flex-row text-[#1A1A1A] dark:text-[#F3F4F6] selection:bg-indigo-100 selection:text-indigo-900 transition-colors">
      {/* Navigation (Desktop Sidebar & Mobile Bottom Bar) */}
      <Navigation />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#FDFCFB] dark:bg-[#121316] transition-colors">
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

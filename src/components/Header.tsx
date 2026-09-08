import React from 'react';
import { Bell, BookOpen, Moon, Sun, UserCheck, User, Flame } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Header: React.FC = () => {
  const {
    exams,
    planStatus,
    setShowSyllabusImport,
    unreadNotificationsCount,
    setShowNotificationsModal,
    profile,
    setTheme,
    authUser,
    setShowAuthModal,
    userStats,
  } = useApp();

  const sortedExams = [...exams].sort(
    (a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
  );
  const primaryExam = sortedExams[0];

  const todayDisplay = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const currentTheme = profile.theme || 'light';
  const toggleTheme = () => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FDFCFB]/90 dark:bg-[#16171A]/90 backdrop-blur-md border-b border-[#E5E5E1] dark:border-[#2E3036] px-4 sm:px-8 lg:px-12 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand / Mobile identity & date */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white font-bold text-xs md:hidden">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
          <div>
            <span className="text-sm font-bold text-[#111827] dark:text-white tracking-tight block leading-tight md:hidden uppercase">
              PACE
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium block">
              {todayDisplay}
            </span>
          </div>
        </div>

        {/* Right: Actions, Notifications, Theme, Auth, Exam pill */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Mobile Streak Indicator */}
          <div className="md:hidden flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40">
            <Flame className="w-3.5 h-3.5 fill-amber-500" />
            <span>{userStats.currentStreak}d</span>
          </div>

          {/* Exam status pill */}
          {primaryExam && (
            <div
              className={`hidden sm:flex px-3 py-1 rounded-full text-xs font-semibold items-center gap-1.5 ${
                planStatus.status === 'on_track'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                  : planStatus.status === 'catching_up'
                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  planStatus.status === 'on_track'
                    ? 'bg-emerald-500'
                    : planStatus.status === 'catching_up'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
              <span className="truncate max-w-[120px]">{primaryExam.name} •</span>
              <span className="shrink-0">{planStatus.daysLeft}d</span>
            </div>
          )}

          {/* Theme Toggle (Mobile & Desktop) */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {currentTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications Bell */}
          <button
            id="btn_notifications_trigger"
            onClick={() => setShowNotificationsModal(true)}
            className="relative p-2 text-gray-500 hover:text-[#4F46E5] dark:text-gray-400 dark:hover:text-indigo-400 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Syllabus Import Modal Trigger */}
          <button
            onClick={() => setShowSyllabusImport(true)}
            className="hidden xs:flex p-2 text-gray-500 hover:text-[#4F46E5] dark:text-gray-400 dark:hover:text-indigo-400 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Import Syllabus"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Auth / Account Profile Button */}
          <button
            onClick={() => setShowAuthModal(true)}
            className="p-1.5 text-xs font-semibold rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] hover:border-[#4F46E5] dark:hover:border-indigo-500 bg-white dark:bg-[#1A1B1F] transition-colors flex items-center gap-1.5"
            title={authUser ? `Signed in as ${authUser.email}` : 'Sign In / Account'}
          >
            {authUser ? (
              <>
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px] font-bold">
                  <UserCheck className="w-3 h-3" />
                </div>
                <span className="hidden sm:inline text-xs text-[#111827] dark:text-white truncate max-w-[80px]">
                  {authUser.name.split(' ')[0]}
                </span>
              </>
            ) : (
              <>
                <User className="w-4 h-4 text-gray-400" />
                <span className="hidden sm:inline text-xs text-gray-600 dark:text-gray-300">
                  Sign In
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

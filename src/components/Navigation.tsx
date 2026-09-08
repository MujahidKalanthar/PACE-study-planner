import React from 'react';
import {
  Home,
  BookOpen,
  Calendar,
  BarChart3,
  Users,
  MoreHorizontal,
  Flame,
  Clock,
  Moon,
  Sun,
} from 'lucide-react';
import { useApp, NavigationTab } from '../context/AppContext';

export const Navigation: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    profile,
    planStatus,
    exams,
    userStats,
    friendRequests,
    setTheme,
    setShowAuthModal,
    authUser,
  } = useApp();

  const primaryExam = exams.find((e) => e.isPrimary) || exams[0];

  const initials = (authUser?.name || profile.name || 'Arjun Singh')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  interface NavItem {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
    { id: 'plan', label: 'Your Plan', icon: Calendar },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
    {
      id: 'friends',
      label: 'Friends',
      icon: Users,
      badge: friendRequests.length > 0 ? friendRequests.length : undefined,
    },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ];

  const currentTheme = profile.theme || 'light';
  const toggleTheme = () => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        id="desktop_sidebar"
        className="hidden md:flex md:w-64 lg:w-72 border-r border-[#E5E5E1] dark:border-[#2E3036] flex-col p-6 lg:p-8 space-y-7 bg-white dark:bg-[#16171A] min-h-screen sticky top-0 transition-colors"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#4F46E5] rounded-xl flex items-center justify-center shrink-0 shadow-xs">
              <div className="w-3.5 h-3.5 bg-white rounded-full"></div>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight uppercase text-[#111827] dark:text-white block leading-none">
                PACE
              </span>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block mt-1">
                Study Planner
              </span>
            </div>
          </div>

          {/* Quick theme button */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {currentTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav_btn_${item.id}`}
                onClick={() => setActiveTab(item.id as NavigationTab)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-colors text-left ${
                  isActive
                    ? 'bg-[#F3F4F6] dark:bg-[#23252B] text-[#4F46E5] dark:text-indigo-400 font-semibold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-[#4F46E5] dark:hover:text-indigo-300 hover:bg-gray-50 dark:hover:bg-[#1F2025]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? 'text-[#4F46E5] dark:text-indigo-400' : 'text-gray-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-[#4F46E5] text-white text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Live Momentum & Exam Readiness Widget */}
        <div className="p-4 bg-[#FDFCFB] dark:bg-[#1D1E23] border border-[#E5E5E1] dark:border-[#2E3036] rounded-2xl space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">
              Study Momentum
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 text-xs">
              <Flame className="w-3.5 h-3.5 fill-amber-500" />
              <span>{userStats.currentStreak}d Streak</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-gray-600 dark:text-gray-300 text-xs pt-1 border-t border-gray-100 dark:border-gray-800">
            <span className="flex items-center gap-1 text-gray-400">
              <Clock className="w-3 h-3" />
              <span>Week study:</span>
            </span>
            <span className="font-semibold text-[#111827] dark:text-white">
              {userStats.formattedWeek}
            </span>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400 truncate">{primaryExam?.name || 'Target Exam'}</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                {planStatus.daysLeft}d left
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Profile Widget */}
        <div className="mt-auto pt-4 border-t border-[#E5E5E1] dark:border-[#2E3036]">
          <button
            onClick={() => setShowAuthModal(true)}
            className="w-full flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#202227] transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-bold text-[#4F46E5] dark:text-indigo-400 text-xs shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#111827] dark:text-white truncate">
                {authUser?.name || profile.name || 'Arjun Singh'}
              </p>
              <p className="text-[11px] text-gray-400 truncate">
                {authUser ? 'Account Synced' : 'Class ' + profile.classLevel}
              </p>
            </div>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        id="mobile_bottom_nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#16171A]/95 backdrop-blur-md border-t border-[#E5E5E1] dark:border-[#2E3036] px-2 py-1.5 flex items-center justify-around shadow-sm"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`mobile_nav_${item.id}`}
              onClick={() => setActiveTab(item.id as NavigationTab)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors relative ${
                isActive
                  ? 'text-[#4F46E5] dark:text-indigo-400'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5 mb-0.5" />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-[#4F46E5] text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

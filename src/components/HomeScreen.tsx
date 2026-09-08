import React from 'react';
import {
  Play,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  BookOpen,
  Clock,
  Zap,
  FlaskConical,
  Calculator,
  Dna,
  Flame,
  Award,
  Sparkles,
  Users,
  Plus,
  Calendar,
  Layers,
  Upload,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../services/plannerEngine';

export const HomeScreen: React.FC = () => {
  const {
    profile,
    plans,
    chapters,
    subjects,
    exam,
    planStatus,
    missedStudyNotice,
    handleMissedStudyAction,
    startStudy,
    toggleItemComplete,
    setActiveTab,
    setShowSyllabusImport,
    setShowOnboarding,
    userStats,
  } = useApp();

  const todayStr = formatDate(new Date());

  // Filter items planned for today
  const todayItems = plans.filter((p) => p.date === todayStr);

  // Calculate planned study time for today
  const totalTodayMinutes = todayItems.reduce(
    (acc, curr) =>
      acc + (curr.completed ? (curr.completedMinutes || curr.plannedMinutes) : curr.plannedMinutes),
    0
  );
  const hours = Math.floor(totalTodayMinutes / 60);
  const minutes = totalTodayMinutes % 60;
  const timeFormatted = `${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m` : '0m'}`;

  // Greeting based on current time of day
  const hourNow = new Date().getHours();
  const greeting =
    hourNow < 12 ? 'Good morning' : hourNow < 17 ? 'Good afternoon' : 'Good evening';

  // Overall syllabus progress calculations
  const totalChapters = chapters.length;
  const completedChapters = chapters.filter((c) => c.status === 'completed').length;
  const overallPercent = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  // Helper for subject icons
  const getSubjectIcon = (subjectName: string, isRevision: boolean) => {
    if (isRevision) return <RotateCcw className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    const lower = subjectName.toLowerCase();
    if (lower.includes('physic')) return <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    if (lower.includes('chem')) return <FlaskConical className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
    if (lower.includes('math')) return <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    if (lower.includes('bio')) return <Dna className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
    return <BookOpen className="w-5 h-5 text-[#4F46E5] dark:text-indigo-400" />;
  };

  const getSubjectBg = (subjectName: string, isRevision: boolean) => {
    if (isRevision) return 'bg-purple-50 dark:bg-purple-950/50';
    const lower = subjectName.toLowerCase();
    if (lower.includes('physic')) return 'bg-blue-50 dark:bg-blue-950/50';
    if (lower.includes('chem')) return 'bg-orange-50 dark:bg-orange-950/50';
    if (lower.includes('math')) return 'bg-emerald-50 dark:bg-emerald-950/50';
    if (lower.includes('bio')) return 'bg-rose-50 dark:bg-rose-950/50';
    return 'bg-indigo-50 dark:bg-indigo-950/50';
  };

  // If no subjects or no chapters exist, render a clean, motivating empty state
  if (subjects.length === 0 || chapters.length === 0) {
    return (
      <div id="home_screen_empty" className="max-w-4xl mx-auto space-y-8 pb-24 md:pb-12 pt-2">
        {/* Welcome Banner */}
        <div className="bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-3xl p-7 sm:p-10 space-y-6 shadow-xs relative overflow-hidden">
          <div className="space-y-2 relative z-10 max-w-xl">
            <span className="text-xs font-semibold tracking-wider uppercase text-[#4F46E5] dark:text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Personalized Academic Execution</span>
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-light tracking-tight text-[#111827] dark:text-white">
              {greeting}, {profile.name || 'Student'}
            </h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 leading-relaxed font-normal">
              Your study canvas is fresh and ready. Configure your exam and syllabus to automatically generate your balanced daily study roadmap.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 relative z-10">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#141518] border border-gray-100 dark:border-[#282A30] space-y-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="font-semibold text-xs text-[#111827] dark:text-white">
                Set Target Exam
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                Define your exam date (boards, entrance, or semester finals).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#141518] border border-gray-100 dark:border-[#282A30] space-y-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="font-semibold text-xs text-[#111827] dark:text-white">
                Add Your Syllabus
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                Create subjects & chapters, or import from syllabus text/PDF.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#141518] border border-gray-100 dark:border-[#282A30] space-y-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h3 className="font-semibold text-xs text-[#111827] dark:text-white">
                Daily Execution
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                Follow your daily study plan with built-in focus timer and spaced revisions.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-3 relative z-10">
            <button
              onClick={() => setShowOnboarding(true)}
              className="px-6 py-3 rounded-2xl bg-[#4F46E5] hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm transition-colors shadow-xs flex items-center gap-2"
            >
              <span>Quick Setup Wizard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('syllabus')}
              className="px-5 py-3 rounded-2xl border border-[#E5E5E1] dark:border-[#2E3036] hover:bg-gray-50 dark:hover:bg-[#23252B] text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-[#4F46E5] dark:text-indigo-400" />
              <span>Add Subjects Manually</span>
            </button>

            <button
              onClick={() => setShowSyllabusImport(true)}
              className="px-5 py-3 rounded-2xl border border-[#E5E5E1] dark:border-[#2E3036] hover:bg-gray-50 dark:hover:bg-[#23252B] text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4 text-[#4F46E5] dark:text-indigo-400" />
              <span>Import Syllabus / PDF</span>
            </button>
          </div>

          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        </div>
      </div>
    );
  }

  return (
    <div id="home_screen" className="max-w-7xl mx-auto space-y-7 pb-24 md:pb-12 pt-1">
      {/* 1. Header & Greeting */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif font-light tracking-tight text-[#111827] dark:text-white mb-1.5">
            {greeting}, {profile.name || 'Student'} <span className="not-italic">👋</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
            You have <span className="font-semibold text-gray-800 dark:text-gray-200">{timeFormatted}</span> of study planned for today.
          </p>
        </div>

        {/* Quick Highlights Badge Strip */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs font-semibold shadow-2xs">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span>{userStats.currentStreak} Day Streak</span>
          </div>

          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/50 text-[#4F46E5] dark:text-indigo-300 text-xs font-semibold shadow-2xs">
            <Clock className="w-4 h-4" />
            <span>{userStats.formattedWeek} this week</span>
          </div>
        </div>
      </header>

      {/* 2. Main 12-Column Editorial Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* CENTER COLUMN: DAILY TASKS (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          {/* Missed Study Notification Banner */}
          {missedStudyNotice && (
            <div
              id="missed_study_banner"
              className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/60 rounded-2xl p-5 transition-all duration-200"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-300">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div className="space-y-2 flex-1">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                      Plan update
                    </h4>
                    <p className="text-sm font-medium text-slate-800 dark:text-gray-200 mt-0.5">
                      {missedStudyNotice.message}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-gray-400 mt-0.5">
                      No worries. We can spread the remaining work across the next few days.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      id="btn_adjust_plan"
                      onClick={() => handleMissedStudyAction('adjust')}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs transition-colors shadow-xs"
                    >
                      Adjust plan
                    </button>
                    <button
                      id="btn_keep_plan"
                      onClick={() => handleMissedStudyAction('keep')}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-100/70 dark:bg-amber-900/40 hover:bg-amber-200/60 text-amber-900 dark:text-amber-200 font-medium text-xs transition-colors"
                    >
                      Keep plan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section Title */}
          <div className="flex items-center justify-between">
            <h2
              id="todays_study_heading"
              className="text-xs sm:text-sm uppercase tracking-[0.2em] font-bold text-gray-400 dark:text-gray-500"
            >
              Today's Study
            </h2>
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              {todayItems.filter((i) => i.completed).length} / {todayItems.length} completed
            </span>
          </div>

          {/* Task List */}
          {todayItems.length === 0 ? (
            <div className="bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#111827] dark:text-white">All done for today!</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  You've finished everything planned for today. Rest up or preview upcoming sessions.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('plan')}
                className="px-5 py-2 text-xs font-semibold text-[#4F46E5] dark:text-indigo-400 bg-[#F3F4F6] dark:bg-gray-800 hover:bg-indigo-50 rounded-full transition-colors"
              >
                See tomorrow's plan
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {todayItems.map((item) => {
                const chapter = chapters.find((c) => c.id === item.chapterId);
                const subject = subjects.find((s) => s.id === item.subjectId);
                const isRevision = item.type === 'revise';

                if (!chapter || !subject) return null;

                const iconBg = getSubjectBg(subject.name, isRevision);

                return (
                  <div
                    key={item.id}
                    id={`today_card_${item.id}`}
                    className={`p-5 bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-2xl flex items-center justify-between group hover:border-[#4F46E5] dark:hover:border-indigo-500 hover:shadow-xs transition-all ${
                      item.completed ? 'opacity-65 bg-gray-50/50 dark:bg-[#15161A]/50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-4 sm:space-x-5 min-w-0 flex-1 pr-3">
                      {/* Subject Icon Box */}
                      <div
                        className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0 border border-transparent dark:border-white/5`}
                      >
                        {getSubjectIcon(subject.name, isRevision)}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <h3
                          className={`font-semibold text-[#111827] dark:text-white text-sm sm:text-base truncate ${
                            item.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''
                          }`}
                        >
                          {chapter.name}
                        </h3>

                        {/* Subtopic pill or subtitle */}
                        {item.subtopicName ? (
                          <p className="text-xs text-[#4F46E5] dark:text-indigo-400 font-medium truncate flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] dark:bg-indigo-400 inline-block"></span>
                            <span>Topic: {item.subtopicName}</span>
                          </p>
                        ) : null}

                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {isRevision ? 'Revision' : subject.name} • {item.plannedMinutes} min
                        </p>
                      </div>
                    </div>

                    {/* Action button & completion toggle */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        onClick={() => toggleItemComplete(item.id)}
                        className="text-gray-300 dark:text-gray-600 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-1"
                        title={item.completed ? 'Mark unstudied' : 'Mark studied'}
                      >
                        {item.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400" />
                        )}
                      </button>

                      {item.completed ? (
                        <span className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full uppercase tracking-wider">
                          Done
                        </span>
                      ) : (
                        <button
                          id={`btn_start_${item.id}`}
                          onClick={() => {
                            const specificSub = item.subtopicId
                              ? chapter.subtopics?.find((st) => st.id === item.subtopicId)
                              : undefined;
                            startStudy(chapter, item, specificSub);
                          }}
                          className={`px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors shadow-xs ${
                            isRevision
                              ? 'border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50/50'
                              : 'bg-[#4F46E5] text-white hover:bg-indigo-700'
                          }`}
                        >
                          {isRevision ? 'Revise' : 'Start'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Social / Circle Teaser Card */}
          <div className="p-4 bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-2xl flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-[#4F46E5] dark:text-indigo-400 shrink-0" />
              <span>Study alongside friends for mutual motivation & daily nudges</span>
            </div>
            <button
              onClick={() => setActiveTab('friends')}
              className="font-semibold text-[#4F46E5] dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 shrink-0 ml-2"
            >
              Study Circle <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: STATUS & PROGRESS (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-6 sm:space-y-7">
          {/* EXAM STATUS CARD */}
          {exam ? (
            <div className="bg-indigo-900 dark:bg-[#1B1D2A] text-white rounded-3xl p-7 sm:p-8 relative overflow-hidden shadow-xl border border-indigo-800/40">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-5">
                  <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">
                    Exam Readiness
                  </p>
                  <span
                    className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                      planStatus.status === 'on_track'
                        ? 'bg-green-500 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {planStatus.status === 'on_track' ? 'On Track' : 'Catching Up'}
                  </span>
                </div>

                <h3 className="text-3xl sm:text-4xl font-serif font-normal mb-1.5 text-white">
                  {exam.name}
                </h3>
                <p className="text-indigo-100/70 text-xs sm:text-sm mb-6">
                  Target Date:{' '}
                  {new Date(exam.targetDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>

                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl sm:text-5xl font-bold">{planStatus.daysLeft}</span>
                  <span className="text-indigo-200 font-light text-base">days remaining</span>
                </div>

                <div className="mt-6 pt-5 border-t border-indigo-800/80 flex justify-between items-center text-xs">
                  <span className="text-indigo-300">Pace status</span>
                  <span className="font-bold text-white">{planStatus.headline}</span>
                </div>
              </div>

              {/* Decorative radial circles */}
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-800/30 rounded-full pointer-events-none" />
              <div className="absolute top-10 -right-10 w-24 h-24 bg-indigo-700/20 rounded-full pointer-events-none" />
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-3xl p-6 sm:p-7 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-[#4F46E5] dark:text-indigo-400">
                <Calendar className="w-5 h-5" />
                <h3 className="font-semibold text-sm text-[#111827] dark:text-white">
                  No Exam Date Set
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Add your exam target date in settings to unlock countdown milestones and pacing metrics.
              </p>
              <button
                onClick={() => setActiveTab('more')}
                className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-300 text-xs font-semibold rounded-xl"
              >
                Configure Exam
              </button>
            </div>
          )}

          {/* OVERALL PROGRESS WIDGET */}
          <div className="bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-xs sm:text-sm uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500">
                Syllabus Progress
              </h2>
              <span className="text-2xl font-serif text-[#111827] dark:text-white">
                {overallPercent}%
              </span>
            </div>

            {/* Subject Progress Bars */}
            <div className="space-y-4">
              {subjects.map((sub) => {
                const subChapters = chapters.filter((c) => c.subjectId === sub.id);
                const subCompleted = subChapters.filter((c) => c.status === 'completed').length;
                const subPercent =
                  subChapters.length > 0 ? Math.round((subCompleted / subChapters.length) * 100) : 0;

                return (
                  <div key={sub.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-400 tracking-wider">
                      <span>{sub.name.toUpperCase()}</span>
                      <span>{subPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${subPercent}%`,
                          backgroundColor: sub.color || '#4F46E5',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Editorial Insight Quote Box */}
            <div className="pt-2">
              <div className="p-4 bg-gray-50 dark:bg-[#16171A] border border-[#E5E5E1] dark:border-[#2E3036] rounded-2xl flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic">
                  "Consistent daily practice beats last-minute cramming every time. Your steady momentum will pay off on exam day."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

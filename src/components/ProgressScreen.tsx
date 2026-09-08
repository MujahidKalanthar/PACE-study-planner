import React from 'react';
import { Sparkles, TrendingUp, CheckCircle2, RotateCw, Clock, Flame, BookOpen, ListChecks, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ProgressScreen: React.FC = () => {
  const { chapters, subjects, plans, sessionLogs, planStatus, smartInsights, userStats, setActiveTab } = useApp();

  const totalChapters = chapters.length;
  const completedChapters = chapters.filter((c) => c.status === 'completed').length;
  const overallPercent = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  // Subtopics count
  const allSubtopics = chapters.flatMap((c) => c.subtopics || []);
  const completedSubtopics = allSubtopics.filter((st) => st.completed).length;
  const subtopicsPercent =
    allSubtopics.length > 0 ? Math.round((completedSubtopics / allSubtopics.length) * 100) : 0;

  // Revisions completed
  const totalRevisionsDone = chapters.reduce((acc, c) => acc + (c.revisionCount || 0), 0);

  // Subject breakdown percentages
  const subjectProgress = subjects.map((sub) => {
    const subChapters = chapters.filter((c) => c.subjectId === sub.id);
    const done = subChapters.filter((c) => c.status === 'completed').length;
    const total = subChapters.length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

    const subSubs = subChapters.flatMap((c) => c.subtopics || []);
    const doneSubs = subSubs.filter((st) => st.completed).length;

    return {
      ...sub,
      done,
      total,
      percent,
      subtopicsCount: subSubs.length,
      completedSubtopicsCount: doneSubs,
    };
  });

  if (chapters.length === 0) {
    return (
      <div id="progress_screen_empty" className="max-w-3xl mx-auto space-y-8 pb-24 md:pb-12 pt-2">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif font-light tracking-tight text-[#111827] dark:text-white mb-1">
            Progress & Mastery
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-normal">
            Track your academic momentum, study hours, and mastery
          </p>
        </div>

        <div className="bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 flex items-center justify-center mx-auto">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-serif font-light text-[#111827] dark:text-white">
              No Study Progress Yet
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              As you complete study sessions and spaced revision cycles, your syllabus coverage, real streaks, focus hours, and smart AI insights will be tracked here.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setActiveTab('syllabus')}
              className="px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Configure Syllabus</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="progress_screen" className="max-w-3xl mx-auto space-y-8 pb-24 md:pb-12 pt-2">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-serif font-light tracking-tight text-[#111827] dark:text-white mb-1">
          Progress
        </h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-normal">
          See your academic momentum, study hours, and mastery at a glance
        </p>
      </div>

      {/* 1. Overall Progress Big Card */}
      <div
        id="card_overall_progress"
        className="bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-3xl p-6 sm:p-7 space-y-5 shadow-xs"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <span className="text-xs font-semibold tracking-wider uppercase text-gray-400 dark:text-gray-500">
              Overall Syllabus Coverage
            </span>
            <div className="flex items-baseline gap-2.5">
              <span className="text-5xl sm:text-6xl font-serif font-light text-[#111827] dark:text-white tracking-tight">
                {overallPercent}%
              </span>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-normal">
                ({completedChapters} of {totalChapters} chapters)
              </span>
            </div>
          </div>

          <div
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${
              planStatus.status === 'on_track'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : planStatus.status === 'catching_up'
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                planStatus.status === 'on_track'
                  ? 'bg-emerald-500'
                  : planStatus.status === 'catching_up'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
            <span>{planStatus.headline}</span>
          </div>
        </div>

        {/* Big clean progress bar */}
        <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#4F46E5] rounded-full transition-all duration-500"
            style={{ width: `${overallPercent}%` }}
          />
        </div>

        {/* Subtopics summary strip */}
        {allSubtopics.length > 0 && (
          <div className="pt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-[#26282E]">
            <span className="flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5 text-[#4F46E5] dark:text-indigo-400" />
              <span>Subtopics Mastered:</span>
            </span>
            <span className="font-semibold text-[#111827] dark:text-white">
              {completedSubtopics} / {allSubtopics.length} ({subtopicsPercent}%)
            </span>
          </div>
        )}
      </div>

      {/* 2. Key Momentum Metrics Grid */}
      <section className="space-y-3" aria-labelledby="key_stats_heading">
        <h2 id="key_stats_heading" className="text-xl font-serif font-light text-[#111827] dark:text-white">
          Study Momentum
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Streak Card */}
          <div className="bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-2xl p-5 text-center space-y-1.5 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Flame className="w-5 h-5 fill-amber-500" />
            </div>
            <span className="block text-xs text-gray-400 dark:text-gray-500 font-medium">
              Study Streak
            </span>
            <span className="block text-xl font-serif text-[#111827] dark:text-white">
              {userStats.currentStreak} Days
            </span>
            <span className="block text-[11px] text-gray-400">Best: {userStats.bestStreak} days</span>
          </div>

          {/* Weekly Time Card */}
          <div className="bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-2xl p-5 text-center space-y-1.5 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 flex items-center justify-center mx-auto">
              <Clock className="w-5 h-5" />
            </div>
            <span className="block text-xs text-gray-400 dark:text-gray-500 font-medium">
              This Week's Time
            </span>
            <span className="block text-xl font-serif text-[#111827] dark:text-white">
              {userStats.formattedWeek}
            </span>
            <span className="block text-[11px] text-gray-400">Logged focus time</span>
          </div>

          {/* Spaced Revisions Card */}
          <div className="bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-2xl p-5 text-center space-y-1.5 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
              <RotateCw className="w-5 h-5" />
            </div>
            <span className="block text-xs text-gray-400 dark:text-gray-500 font-medium">
              Revisions Logged
            </span>
            <span className="block text-xl font-serif text-[#111827] dark:text-white">
              {totalRevisionsDone} Cycles
            </span>
            <span className="block text-[11px] text-gray-400">Spaced recall checks</span>
          </div>
        </div>
      </section>

      {/* 3. Subject Breakdown */}
      <section className="space-y-3" aria-labelledby="subject_breakdown_heading">
        <h2 id="subject_breakdown_heading" className="text-xl font-serif font-light text-[#111827] dark:text-white">
          Subject Breakdown
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {subjectProgress.map((sub) => (
            <div
              key={sub.id}
              id={`subject_progress_${sub.id}`}
              className="bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] hover:border-[#4F46E5] dark:hover:border-indigo-500 rounded-2xl p-5 transition-all space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#111827] dark:text-white">
                  {sub.name}
                </span>
                <span className="text-sm font-serif text-[#111827] dark:text-white">
                  {sub.percent}%
                </span>
              </div>

              <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${sub.percent}%`, backgroundColor: sub.color }}
                />
              </div>

              <div className="space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                <p>{sub.done} of {sub.total} chapters completed</p>
                {sub.subtopicsCount > 0 && (
                  <p className="text-[11px] text-gray-400">
                    {sub.completedSubtopicsCount} of {sub.subtopicsCount} subtopics
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Smart Insights */}
      {smartInsights.length > 0 && (
        <section className="space-y-3" aria-labelledby="smart_insights_heading">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#4F46E5] dark:text-indigo-400" />
            <h2 id="smart_insights_heading" className="text-xl font-serif font-light text-[#111827] dark:text-white">
              Observations
            </h2>
          </div>

          <div className="space-y-2.5">
            {smartInsights.map((insight) => (
              <div
                key={insight.id}
                className="p-4 bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-2xl flex items-start space-x-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300 shadow-2xs"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    insight.type === 'positive'
                      ? 'bg-emerald-500'
                      : insight.type === 'suggestion'
                      ? 'bg-amber-500'
                      : 'bg-[#4F46E5]'
                  }`}
                />
                <div className="space-y-0.5">
                  <span className="font-semibold text-xs text-[#111827] dark:text-white block">
                    {insight.title}
                  </span>
                  <p className="leading-relaxed text-xs text-gray-600 dark:text-gray-400">
                    {insight.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

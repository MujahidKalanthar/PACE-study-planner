import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Play,
  RotateCcw,
  CheckCircle2,
  CalendarDays,
  Clock3,
  X,
  Plus,
  BookOpen,
  History,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate, addDays, getDaysDiff } from '../services/plannerEngine';
import { PlannedStudyItem } from '../types';

const DAYS_PER_HISTORY_PAGE = 7;

export const PlanScreen: React.FC = () => {
  const {
    plans,
    chapters,
    subjects,
    timetable,
    startStudy,
    toggleItemComplete,
    rescheduleItem,
    setActiveTab,
    setShowSyllabusImport,
  } = useApp();

  // Active view: 'current' (upcoming + today) vs 'history' (paginated past days)
  const [activeView, setActiveView] = useState<'current' | 'history'>('current');
  const [currentPeriod, setCurrentPeriod] = useState<'today' | 'tomorrow' | 'week' | 'twoweeks'>('week');
  const [historyPage, setHistoryPage] = useState(1);

  const [reschedulingItem, setReschedulingItem] = useState<PlannedStudyItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');

  const todayStr = formatDate(new Date());
  const tomorrowStr = addDays(todayStr, 1);

  // Group plans by date
  const plansByDate = new Map<string, PlannedStudyItem[]>();
  for (const p of plans) {
    if (!plansByDate.has(p.date)) {
      plansByDate.set(p.date, []);
    }
    plansByDate.get(p.date)!.push(p);
  }

  // Current & Upcoming Dates
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    weekDates.push(addDays(todayStr, i));
  }

  const twoWeekDates: string[] = [];
  for (let i = 0; i < 14; i++) {
    twoWeekDates.push(addDays(todayStr, i));
  }

  const currentDatesToDisplay =
    currentPeriod === 'today'
      ? [todayStr]
      : currentPeriod === 'tomorrow'
      ? [tomorrowStr]
      : currentPeriod === 'week'
      ? weekDates
      : twoWeekDates;

  // Past & Historical Dates
  // Collect all distinct past dates that exist before today
  const allPastDates: string[] = [];
  const uniqueDates = Array.from(plansByDate.keys()).filter((d) => d < todayStr).sort((a, b) => b.localeCompare(a)); // latest first

  // If no past dates with plans exist yet, generate at least recent 7 days in the past for history navigation
  if (uniqueDates.length === 0) {
    for (let i = 1; i <= 14; i++) {
      allPastDates.push(addDays(todayStr, -i));
    }
  } else {
    allPastDates.push(...uniqueDates);
  }

  const totalHistoryPages = Math.max(1, Math.ceil(allPastDates.length / DAYS_PER_HISTORY_PAGE));
  const safeHistoryPage = Math.min(Math.max(1, historyPage), totalHistoryPages);

  const historyStartIndex = (safeHistoryPage - 1) * DAYS_PER_HISTORY_PAGE;
  const historyDatesToDisplay = allPastDates.slice(
    historyStartIndex,
    historyStartIndex + DAYS_PER_HISTORY_PAGE
  );

  const historyDateRangeLabel =
    historyDatesToDisplay.length > 0
      ? `${new Date(historyDatesToDisplay[historyDatesToDisplay.length - 1] + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${new Date(historyDatesToDisplay[0] + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
      : '';

  // Day format helper
  const getDayHeader = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const dayName = d.toLocaleDateString('en-IN', { weekday: 'long' });
    const dayItems = plansByDate.get(dateStr) || [];
    const totalMinutes = dayItems.reduce((acc, curr) => acc + curr.plannedMinutes, 0);
    const completedMinutes = dayItems.reduce((acc, curr) => acc + (curr.completed ? (curr.completedMinutes || curr.plannedMinutes) : 0), 0);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const timeStr = `${h > 0 ? `${h}h ` : ''}${m > 0 ? `${m}m` : '0m'}`;

    return {
      dayName,
      timeStr,
      completedMinutes,
      dateDisplay: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      totalMinutes,
    };
  };

  // Get commitments for day
  const getCommitmentsForDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = d.getDay();
    return timetable.filter((t) => t.days.includes(dayOfWeek));
  };

  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingItem || !rescheduleDate) return;
    rescheduleItem(reschedulingItem.id, rescheduleDate);
    setReschedulingItem(null);
  };

  if (chapters.length === 0 || plans.length === 0) {
    return (
      <div id="plan_screen_empty" className="max-w-3xl mx-auto space-y-8 pb-24 md:pb-12 pt-2">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif font-light tracking-tight text-[#111827] dark:text-white mb-1">
            Study Plan
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-normal">
            Your balanced daily study roadmap
          </p>
        </div>

        <div className="bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 flex items-center justify-center mx-auto">
            <CalendarIcon className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-serif font-light text-[#111827] dark:text-white">
              No Plan Generated Yet
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Once you add your subjects and chapters in the Syllabus tab, PACE will automatically build your customized day-by-day study schedule and spaced revision intervals.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('syllabus')}
              className="px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subjects to Syllabus</span>
            </button>
            <button
              onClick={() => setShowSyllabusImport(true)}
              className="px-5 py-2.5 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] hover:bg-gray-50 dark:hover:bg-[#23252B] text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-[#4F46E5] dark:text-indigo-400" />
              <span>Import Syllabus</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeDates = activeView === 'current' ? currentDatesToDisplay : historyDatesToDisplay;

  return (
    <div id="plan_screen" className="max-w-3xl mx-auto space-y-8 pb-24 md:pb-12 pt-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif font-light tracking-tight text-[#111827] dark:text-white mb-1">
            Your Plan
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-normal">
            Your balanced daily study roadmap & paginated study history
          </p>
        </div>

        {/* Top View Toggle: Current & Upcoming vs Plan History */}
        <div className="flex items-center gap-1 p-1 bg-[#F3F4F6] dark:bg-[#1A1B1F] border border-transparent dark:border-[#2E3036] rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveView('current')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === 'current'
                ? 'bg-white dark:bg-[#26282E] text-[#4F46E5] dark:text-indigo-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-[#111827] dark:hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Current & Upcoming</span>
          </button>
          <button
            onClick={() => setActiveView('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === 'history'
                ? 'bg-white dark:bg-[#26282E] text-[#4F46E5] dark:text-indigo-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-[#111827] dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Plan History</span>
          </button>
        </div>
      </div>

      {/* Controls for Current View */}
      {activeView === 'current' && (
        <div className="flex items-center gap-1.5 p-1 bg-[#F3F4F6] dark:bg-[#1A1B1F] border border-transparent dark:border-[#2E3036] rounded-xl w-full sm:w-auto">
          {(['today', 'tomorrow', 'week', 'twoweeks'] as const).map((mode) => (
            <button
              key={mode}
              id={`tab_plan_${mode}`}
              onClick={() => setCurrentPeriod(mode)}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs sm:text-sm font-medium capitalize transition-all ${
                currentPeriod === mode
                  ? 'bg-white dark:bg-[#26282E] text-[#4F46E5] dark:text-indigo-400 font-semibold shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              {mode === 'week' ? 'This week (7d)' : mode === 'twoweeks' ? 'Next 14 days' : mode}
            </button>
          ))}
        </div>
      )}

      {/* Controls for History View (Pagination Bar) */}
      {activeView === 'history' && (
        <div className="p-4 bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="space-y-0.5 text-center sm:text-left">
            <span className="text-xs font-semibold text-[#111827] dark:text-white block">
              Historical Study Logs
            </span>
            <span className="text-[11px] text-gray-400 block">
              Showing {historyDateRangeLabel} ({DAYS_PER_HISTORY_PAGE} days per page)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
              disabled={safeHistoryPage <= 1}
              className="px-3 py-1.5 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Newer</span>
            </button>

            <span className="text-xs font-semibold px-2 text-gray-700 dark:text-gray-300">
              Page {safeHistoryPage} of {totalHistoryPages}
            </span>

            <button
              onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
              disabled={safeHistoryPage >= totalHistoryPages}
              className="px-3 py-1.5 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-1"
            >
              <span>Older</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Days List */}
      <div className="space-y-6">
        {activeDates.map((dateStr) => {
          const { dayName, timeStr, dateDisplay, completedMinutes } = getDayHeader(dateStr);
          const dayItems = plansByDate.get(dateStr) || [];
          const commitments = getCommitmentsForDate(dateStr);
          const isToday = dateStr === todayStr;
          const isPast = dateStr < todayStr;

          return (
            <div key={dateStr} id={`plan_day_${dateStr}`} className="space-y-3">
              {/* Day Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-normal text-[#111827] dark:text-white text-lg sm:text-xl">
                    {dayName}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {timeStr}
                  </span>
                  {isToday && (
                    <span className="bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                      Today
                    </span>
                  )}
                  {isPast && (
                    <span className="text-gray-400 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                      Past
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                  {dateDisplay}
                </span>
              </div>

              {/* Fixed Commitments Badge (School / Coaching) */}
              {commitments.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap px-1 text-[11px] text-gray-500 dark:text-gray-400">
                  <span className="font-semibold text-gray-400 dark:text-gray-500">Timetable:</span>
                  {commitments.map((com) => (
                    <span
                      key={com.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#1A1B1F] text-gray-600 dark:text-gray-300"
                    >
                      <Clock3 className="w-3 h-3 text-gray-400" />
                      <span>
                        {com.title} ({com.startTime} - {com.endTime})
                      </span>
                    </span>
                  ))}
                </div>
              )}

              {/* Items Card List */}
              {dayItems.length === 0 ? (
                <div className="p-4 rounded-2xl border border-dashed border-[#E5E5E1] dark:border-[#2E3036] text-center text-xs text-gray-400 dark:text-gray-500 bg-white/40 dark:bg-[#1A1B1F]/40">
                  {isPast ? 'No study sessions logged on this day' : 'Rest day or catch-up buffer'}
                </div>
              ) : (
                <div className="space-y-2">
                  {dayItems.map((item) => {
                    const chapter = chapters.find((c) => c.id === item.chapterId);
                    const subject = subjects.find((s) => s.id === item.subjectId);
                    const isRevision = item.type === 'revise';

                    if (!chapter || !subject) return null;

                    return (
                      <div
                        key={item.id}
                        id={`plan_item_${item.id}`}
                        className={`p-4 bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] hover:border-[#4F46E5] dark:hover:border-indigo-500 rounded-2xl flex items-center justify-between gap-3 transition-all ${
                          item.completed ? 'opacity-70 bg-gray-50/50 dark:bg-[#15161A]/50' : ''
                        }`}
                      >
                        {/* Checkbox & Details */}
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <button
                            onClick={() => toggleItemComplete(item.id)}
                            className="text-gray-300 dark:text-gray-600 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0"
                            title={item.completed ? 'Mark uncompleted' : 'Mark completed'}
                          >
                            {item.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400" />
                            )}
                          </button>

                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-xs sm:text-sm font-semibold truncate ${
                                  item.completed
                                    ? 'line-through text-gray-400 dark:text-gray-500'
                                    : 'text-[#111827] dark:text-white'
                                }`}
                              >
                                {chapter.name}
                              </span>

                              {isRevision && (
                                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
                                  Revision
                                </span>
                              )}

                              {item.completed && (
                                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                                  Completed
                                </span>
                              )}
                            </div>

                            {/* Subtopic row */}
                            {item.subtopicName ? (
                              <p className="text-xs text-[#4F46E5] dark:text-indigo-400 font-medium truncate">
                                Topic: {item.subtopicName}
                              </p>
                            ) : null}

                            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: subject.color }}
                              />
                              <span>{subject.name}</span>
                              <span>•</span>
                              <span>{item.plannedMinutes} min</span>
                              {item.completed && item.completedMinutes && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-600 dark:text-emerald-400">
                                    Studied: {item.completedMinutes}m
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {!item.completed && (
                            <button
                              onClick={() => {
                                const specificSub = item.subtopicId
                                  ? chapter.subtopics?.find((st) => st.id === item.subtopicId)
                                  : undefined;
                                startStudy(chapter, item, specificSub);
                              }}
                              className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#4F46E5] text-white hover:bg-indigo-700 transition-colors flex items-center gap-1 shadow-2xs"
                            >
                              <Play className="w-3 h-3 fill-white" />
                              <span className="hidden sm:inline">Start</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setReschedulingItem(item);
                              setRescheduleDate(item.date);
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs"
                            title="Reschedule item"
                          >
                            <CalendarDays className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reschedule Modal */}
      {reschedulingItem && (
        <div className="fixed inset-0 z-50 bg-[#111827]/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1B1F] rounded-3xl max-w-sm w-full p-6 space-y-4 border border-[#E5E5E1] dark:border-[#2E3036] shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-serif font-light text-[#111827] dark:text-white">
                Reschedule Session
              </h3>
              <button
                onClick={() => setReschedulingItem(null)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReschedule} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  New Study Date
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReschedulingItem(null)}
                  className="px-3.5 py-2 text-xs text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

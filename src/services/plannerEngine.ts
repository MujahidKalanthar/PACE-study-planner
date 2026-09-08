import {
  Chapter,
  Exam,
  PlannedStudyItem,
  PlanStatus,
  StudentProfile,
  StudySessionLog,
  Subject,
  TimetableSlot,
  OnTrackLevel,
  SmartInsight,
} from '../types';

/**
 * Format a Date into 'YYYY-MM-DD' in local timezone.
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add days to a given YYYY-MM-DD date.
 */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

/**
 * Difference in days between two YYYY-MM-DD dates (target - current).
 */
export function getDaysDiff(fromStr: string, toStr: string): number {
  const from = new Date(fromStr + 'T00:00:00');
  const to = new Date(toStr + 'T00:00:00');
  const diffTime = to.getTime() - from.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate available study minutes for a particular day of the week,
 * taking into account school/coaching/tuition timetable commitments.
 */
export function getAvailableMinutesForDate(
  dateStr: string,
  baseDailyMinutes: number,
  timetableSlots: TimetableSlot[]
): number {
  const d = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon ...

  let committedMinutes = 0;
  for (const slot of timetableSlots) {
    if (slot.days.includes(dayOfWeek)) {
      const [startH, startM] = slot.startTime.split(':').map(Number);
      const [endH, endM] = slot.endTime.split(':').map(Number);
      const duration = (endH * 60 + endM) - (startH * 60 + startM);
      if (duration > 0) {
        committedMinutes += duration;
      }
    }
  }

  // If heavy commitments (> 8 hours), reduce study target gently by 25% with 30m floor
  if (committedMinutes >= 480) {
    return Math.max(30, Math.round(baseDailyMinutes * 0.75));
  } else if (committedMinutes >= 360) {
    return Math.max(45, Math.round(baseDailyMinutes * 0.85));
  }

  return Math.max(30, baseDailyMinutes);
}

/**
 * Compute the adaptive difficulty multiplier for a chapter.
 */
export function getAdaptiveChapterMinutes(
  chapter: Chapter,
  logs: StudySessionLog[]
): number {
  let multiplier = 1.0;

  if (chapter.difficulty === 'hard') multiplier += 0.25;
  if (chapter.difficulty === 'easy') multiplier -= 0.15;

  // Check logs for this specific chapter
  const chapterLogs = logs.filter((l) => l.chapterId === chapter.id);
  if (chapterLogs.length > 0) {
    const hardCount = chapterLogs.filter((l) => l.feedback === 'hard').length;
    const easyCount = chapterLogs.filter((l) => l.feedback === 'easy').length;
    if (hardCount > 0) multiplier += 0.15 * hardCount;
    if (easyCount > 0) multiplier -= 0.1 * easyCount;
  }

  const result = Math.round((chapter.estimatedMinutes || 45) * multiplier);
  return Math.max(15, Math.min(120, result));
}

/**
 * Calculate spacing interval for revision based on profile preset and revision count.
 */
export function getNextRevisionDays(
  revisionCount: number,
  preset: 'standard' | 'frequent' | 'relaxed' = 'standard'
): number {
  if (preset === 'frequent') {
    return revisionCount === 1 ? 1 : revisionCount === 2 ? 3 : 7;
  }
  if (preset === 'relaxed') {
    return revisionCount === 1 ? 5 : revisionCount === 2 ? 14 : 30;
  }
  // Standard: 3 -> 7 -> 21
  return revisionCount === 1 ? 3 : revisionCount === 2 ? 7 : 21;
}

/**
 * Core Study Plan Generator:
 * Generates daily study schedule without overwhelming the student.
 */
export function generateStudySchedule(params: {
  todayStr: string;
  daysToPlan?: number;
  exams: Exam[];
  subjects: Subject[];
  chapters: Chapter[];
  existingPlans: PlannedStudyItem[];
  timetable: TimetableSlot[];
  profile: StudentProfile;
  sessionLogs: StudySessionLog[];
}): PlannedStudyItem[] {
  const {
    todayStr,
    daysToPlan = 14,
    exams,
    subjects,
    chapters,
    existingPlans,
    timetable,
    profile,
    sessionLogs,
  } = params;

  if (chapters.length === 0) {
    return [];
  }

  // Primary exam (if any configured)
  const sortedExams = [...exams].sort((a, b) => {
    return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
  });
  const primaryExam = sortedExams[0] || null;

  // Find missed items from past days (before today) that were never completed
  const missedPastItems = profile.autoAdjustPlan !== false
    ? existingPlans.filter((item) => item.date < todayStr && !item.completed)
    : [];

  // Chapters needing initial study (not completed)
  const remainingChapters = chapters.filter((c) => c.status !== 'completed');

  // Completed chapters needing revision
  const shouldScheduleRevisions = profile.autoScheduleRevisions !== false;
  const chaptersNeedingRevision = shouldScheduleRevisions
    ? chapters.filter((c) => c.status === 'completed' && c.nextRevisionDate)
    : [];

  const updatedPlans: PlannedStudyItem[] = [];

  // Keep all past completed items intact
  const pastCompletedPlans = existingPlans.filter(
    (item) => item.date < todayStr && item.completed
  );
  updatedPlans.push(...pastCompletedPlans);

  // Queue for distributing missed items gently
  const pendingMissedQueue = [...missedPastItems];

  // Group chapters by subject for balanced rotation
  const chaptersBySubject = new Map<string, Chapter[]>();
  for (const c of remainingChapters) {
    if (!chaptersBySubject.has(c.subjectId)) {
      chaptersBySubject.set(c.subjectId, []);
    }
    chaptersBySubject.get(c.subjectId)!.push(c);
  }

  // Iterate day by day starting from todayStr
  for (let dayOffset = 0; dayOffset < daysToPlan; dayOffset++) {
    const currentDate = addDays(todayStr, dayOffset);
    const dayDailyCapacity = getAvailableMinutesForDate(
      currentDate,
      profile.dailyStudyMinutes || 120,
      timetable
    );

    let minutesAllocatedToday = 0;
    const itemsForDay: PlannedStudyItem[] = [];
    const alreadyPlannedChaptersThisDay = new Set<string>();

    // Check if user already had completed items on this date
    const existingDayItems = existingPlans.filter((p) => p.date === currentDate);
    const completedDayItems = existingDayItems.filter((p) => p.completed);

    for (const comp of completedDayItems) {
      itemsForDay.push(comp);
      minutesAllocatedToday += comp.completedMinutes || comp.plannedMinutes;
      alreadyPlannedChaptersThisDay.add(comp.chapterId);
    }

    // 1. Spaced Revision items due on or before this day
    if (shouldScheduleRevisions) {
      const dueRevisions = chaptersNeedingRevision.filter(
        (c) => c.nextRevisionDate && c.nextRevisionDate <= currentDate && !alreadyPlannedChaptersThisDay.has(c.id)
      );

      for (const revChapter of dueRevisions) {
        if (minutesAllocatedToday + 15 <= dayDailyCapacity) {
          const revTime = Math.min(25, Math.max(15, Math.round((revChapter.estimatedMinutes || 45) * 0.4)));
          itemsForDay.push({
            id: `plan_rev_${revChapter.id}_${currentDate}`,
            date: currentDate,
            chapterId: revChapter.id,
            subjectId: revChapter.subjectId,
            examId: primaryExam?.id || '',
            type: 'revise',
            plannedMinutes: revTime,
            completed: false,
            order: itemsForDay.length + 1,
          });
          minutesAllocatedToday += revTime;
          alreadyPlannedChaptersThisDay.add(revChapter.id);
        }
      }
    }

    // 2. Gentle catch-up of missed items (maximum 1 missed item per day)
    if (pendingMissedQueue.length > 0 && minutesAllocatedToday + 25 <= dayDailyCapacity) {
      const missed = pendingMissedQueue.shift()!;
      const ch = chapters.find((c) => c.id === missed.chapterId);
      if (ch && ch.status !== 'completed' && !alreadyPlannedChaptersThisDay.has(ch.id)) {
        itemsForDay.push({
          id: `plan_reschedule_${missed.id}_${currentDate}`,
          date: currentDate,
          chapterId: ch.id,
          subtopicId: missed.subtopicId,
          subtopicName: missed.subtopicName,
          subjectId: ch.subjectId,
          examId: primaryExam?.id || '',
          type: missed.type,
          plannedMinutes: missed.plannedMinutes,
          completed: false,
          order: itemsForDay.length + 1,
          notes: 'Rescheduled study',
        });
        minutesAllocatedToday += missed.plannedMinutes;
        alreadyPlannedChaptersThisDay.add(ch.id);
      }
    }

    // 3. Subject-balanced Chapter / Subtopic study
    const subjectIds = Array.from(chaptersBySubject.keys());

    for (const subId of subjectIds) {
      if (minutesAllocatedToday >= dayDailyCapacity) break;

      const subChapters = chaptersBySubject.get(subId) || [];
      const nextChapter = subChapters.find((c) => !alreadyPlannedChaptersThisDay.has(c.id));

      if (nextChapter) {
        // Check for uncompleted subtopic
        const uncompletedSub = nextChapter.subtopics?.find((st) => !st.completed);
        const estMin = uncompletedSub
          ? (uncompletedSub.estimatedMinutes || 20)
          : getAdaptiveChapterMinutes(nextChapter, sessionLogs);

        if (minutesAllocatedToday + estMin <= dayDailyCapacity + 15 || itemsForDay.length === 0) {
          itemsForDay.push({
            id: `plan_item_${nextChapter.id}_${uncompletedSub ? uncompletedSub.id : 'main'}_${currentDate}`,
            date: currentDate,
            chapterId: nextChapter.id,
            subtopicId: uncompletedSub?.id,
            subtopicName: uncompletedSub?.name,
            subjectId: nextChapter.subjectId,
            examId: primaryExam?.id || '',
            type: 'learn',
            plannedMinutes: estMin,
            completed: false,
            order: itemsForDay.length + 1,
          });
          minutesAllocatedToday += estMin;
          alreadyPlannedChaptersThisDay.add(nextChapter.id);
        }
      }
    }

    updatedPlans.push(...itemsForDay);
  }

  return updatedPlans;
}

/**
 * Calculates current streak and best streak from actual recorded session logs.
 */
export function calculateStreak(
  sessionLogs: StudySessionLog[],
  todayStr: string
): { currentStreak: number; bestStreak: number } {
  if (sessionLogs.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const uniqueDates = Array.from(new Set(sessionLogs.map((l) => l.date))).sort();

  if (uniqueDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const yesterdayStr = addDays(todayStr, -1);
  let currentStreak = 0;
  let checkDate = uniqueDates.includes(todayStr) ? todayStr : yesterdayStr;

  if (uniqueDates.includes(checkDate)) {
    while (uniqueDates.includes(checkDate)) {
      currentStreak++;
      checkDate = addDays(checkDate, -1);
    }
  }

  let bestStreak = 0;
  let tempStreak = 0;
  let prevDate: string | null = null;

  for (const d of uniqueDates) {
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diff = getDaysDiff(prevDate, d);
      if (diff === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    prevDate = d;
    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }
  }

  return {
    currentStreak: Math.max(currentStreak, 0),
    bestStreak: Math.max(bestStreak, currentStreak),
  };
}

/**
 * Calculate study hours and minutes from real session logs.
 */
export function calculateStudyHours(
  sessionLogs: StudySessionLog[],
  todayStr: string
): {
  todayMinutes: number;
  weekMinutes: number;
  overallMinutes: number;
  formattedWeek: string;
  formattedOverall: string;
} {
  const weekStartStr = addDays(todayStr, -6);

  let todayMinutes = 0;
  let weekMinutes = 0;
  let overallMinutes = 0;

  for (const log of sessionLogs) {
    const dur = log.durationMinutes || 0;
    overallMinutes += dur;
    if (log.date === todayStr) {
      todayMinutes += dur;
    }
    if (log.date >= weekStartStr && log.date <= todayStr) {
      weekMinutes += dur;
    }
  }

  const formatHoursMins = (totalMinutes: number) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  return {
    todayMinutes,
    weekMinutes,
    overallMinutes,
    formattedWeek: formatHoursMins(weekMinutes),
    formattedOverall: formatHoursMins(overallMinutes),
  };
}

/**
 * Computes on-track status cleanly and reassuringly.
 */
export function calculateOnTrackStatus(params: {
  todayStr: string;
  primaryExam: Exam | null;
  chapters: Chapter[];
  profile: StudentProfile;
  timetable: TimetableSlot[];
  sessionLogs: StudySessionLog[];
}): PlanStatus {
  const { todayStr, primaryExam, chapters, profile, sessionLogs } = params;

  const totalChapters = chapters.length;
  const completedChapters = chapters.filter((c) => c.status === 'completed').length;
  const uncompletedChapters = chapters.filter((c) => c.status !== 'completed');

  if (totalChapters === 0) {
    return {
      status: 'on_track',
      daysLeft: 0,
      daysBeforeExamFinished: 0,
      headline: "Welcome to PACE.",
      detail: "Add your subjects and chapters to generate your study plan.",
      completionPercentage: 0,
      totalChapters: 0,
      completedChapters: 0,
      remainingMinutes: 0,
      dailyRecommendedMinutes: profile.dailyStudyMinutes || 120,
    };
  }

  // Calculate remaining study minutes needed
  let remainingMinutes = 0;
  for (const ch of uncompletedChapters) {
    const est = getAdaptiveChapterMinutes(ch, sessionLogs);
    const done = ch.completedMinutes || 0;
    remainingMinutes += Math.max(15, est - done);
  }

  if (profile.autoScheduleRevisions !== false) {
    remainingMinutes += Math.round(totalChapters * 20);
  }

  const averageDailyMinutes = Math.max(30, profile.dailyStudyMinutes || 120);
  const daysNeeded = Math.ceil(remainingMinutes / averageDailyMinutes);
  const completionPercentage = Math.round((completedChapters / totalChapters) * 100);

  if (!primaryExam || !primaryExam.targetDate) {
    return {
      status: 'on_track',
      daysLeft: daysNeeded,
      daysBeforeExamFinished: 0,
      headline: "Plan active.",
      detail: `Estimated time to complete syllabus: ~${daysNeeded} days at your current study pace.`,
      completionPercentage,
      totalChapters,
      completedChapters,
      remainingMinutes,
      dailyRecommendedMinutes: averageDailyMinutes,
    };
  }

  const daysLeft = Math.max(1, getDaysDiff(todayStr, primaryExam.targetDate));
  const daysBeforeExamFinished = daysLeft - daysNeeded;

  let status: OnTrackLevel = 'on_track';
  let headline = "You're on track.";
  let detail = `Expected syllabus completion: ${Math.max(1, daysBeforeExamFinished)} days before ${primaryExam.name}.`;

  if (daysBeforeExamFinished < 0) {
    const deficitMinutes = Math.abs(daysBeforeExamFinished) * averageDailyMinutes;
    const additionalMinsPerDay = Math.ceil(deficitMinutes / daysLeft);
    status = 'behind';
    headline = "You're falling behind.";
    detail = `Consider adding ~${Math.min(60, additionalMinsPerDay)} min to your daily study to finish comfortably on time.`;
  } else if (daysBeforeExamFinished <= 2) {
    status = 'catching_up';
    headline = "You're a little behind.";
    detail = `We've adjusted your plan to keep pace with ${primaryExam.name}.`;
  } else {
    status = 'on_track';
    headline = "You're on track.";
    detail = `Expected syllabus completion: ${daysBeforeExamFinished} days before ${primaryExam.name}.`;
  }

  return {
    status,
    daysLeft,
    daysBeforeExamFinished,
    headline,
    detail,
    completionPercentage,
    totalChapters,
    completedChapters,
    remainingMinutes,
    dailyRecommendedMinutes: averageDailyMinutes,
  };
}

/**
 * Generate smart, conversational student insights based on study logs.
 */
export function generateSmartInsights(params: {
  chapters: Chapter[];
  subjects: Subject[];
  sessionLogs: StudySessionLog[];
  status: PlanStatus;
}): SmartInsight[] {
  const { chapters, subjects, sessionLogs, status } = params;
  const insights: SmartInsight[] = [];

  if (chapters.length === 0) {
    return [
      {
        id: 'ins_welcome',
        title: 'Getting Started',
        type: 'neutral',
        message: 'Add your subjects and chapters in the Syllabus tab to receive personalized daily study recommendations.',
      },
    ];
  }

  if (status.status === 'on_track' && status.daysBeforeExamFinished > 0) {
    insights.push({
      id: 'ins_ontrack',
      title: 'Healthy Pace',
      type: 'positive',
      message: `You're on track to finish your syllabus ${status.daysBeforeExamFinished} days before your exam date.`,
    });
  }

  const revisionsDue = chapters.filter((c) => c.status === 'completed' && c.nextRevisionDate);
  if (revisionsDue.length > 0) {
    insights.push({
      id: 'ins_rev',
      title: 'Spaced Revision',
      type: 'neutral',
      message: `You have ${revisionsDue.length} ${revisionsDue.length === 1 ? 'chapter' : 'chapters'} scheduled for spaced recall review.`,
    });
  }

  const hardLogs = sessionLogs.filter((l) => l.feedback === 'hard');
  if (hardLogs.length >= 2) {
    const hardChapter = chapters.find((c) => c.id === hardLogs[hardLogs.length - 1].chapterId);
    const sub = hardChapter ? subjects.find((s) => s.id === hardChapter.subjectId) : null;
    if (sub) {
      insights.push({
        id: 'ins_subject_weight',
        title: 'Adaptive Balance',
        type: 'suggestion',
        message: `${sub.name} is taking slightly more focus. We've quietly given your upcoming sessions extra breathing room.`,
      });
    }
  } else {
    insights.push({
      id: 'ins_consistency',
      title: 'Daily Momentum',
      type: 'positive',
      message: 'Consistent, small daily study sessions yield significantly higher long-term retention than weekend cramming.',
    });
  }

  return insights;
}

import { supabase } from './auth';
import {
  Chapter,
  Exam,
  PlannedStudyItem,
  StudentProfile,
  StudySessionLog,
  Subject,
  Subtopic,
  TimetableSlot,
  AppNotification,
  UserStudyStats,
} from '../types';

const isUUID = (str?: string): boolean =>
  Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

export interface LoadedUserData {
  profile?: Partial<StudentProfile>;
  exams: Exam[];
  subjects: Subject[];
  chapters: Chapter[];
  plans: PlannedStudyItem[];
  sessionLogs: StudySessionLog[];
  timetable: TimetableSlot[];
  notifications: AppNotification[];
}

/**
 * Loads all user data from Supabase tables for an authenticated user.
 */
export async function loadUserDataFromSupabase(userId: string): Promise<LoadedUserData | null> {
  if (!supabase || !isUUID(userId)) return null;

  try {
    const [
      profileRes,
      examsRes,
      subjectsRes,
      chaptersRes,
      subtopicsRes,
      tasksRes,
      sessionsRes,
      timetableRes,
      notifsRes,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('exams').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('subjects').select('*').eq('user_id', userId).order('order_index', { ascending: true }),
      supabase.from('chapters').select('*').eq('user_id', userId).order('order_index', { ascending: true }),
      supabase.from('subtopics').select('*').eq('user_id', userId).order('order_index', { ascending: true }),
      supabase.from('tasks').select('*').eq('user_id', userId).order('date', { ascending: true }),
      supabase.from('study_sessions').select('*').eq('user_id', userId).order('started_at', { ascending: false }),
      supabase.from('timetable_events').select('*').eq('user_id', userId),
      supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);

    // Map Subtopics grouped by chapter_id
    const subtopicsByChapter: Record<string, Subtopic[]> = {};
    if (subtopicsRes.data) {
      for (const st of subtopicsRes.data) {
        if (!subtopicsByChapter[st.chapter_id]) {
          subtopicsByChapter[st.chapter_id] = [];
        }
        subtopicsByChapter[st.chapter_id].push({
          id: st.id,
          chapterId: st.chapter_id,
          name: st.name,
          completed: Boolean(st.completed),
          estimatedMinutes: st.estimated_minutes || 20,
          order: st.order_index || 1,
          completedDate: st.completed_date || undefined,
        });
      }
    }

    // Map Chapters with subtopics
    const chapters: Chapter[] = (chaptersRes.data || []).map((ch: any) => ({
      id: ch.id,
      subjectId: ch.subject_id,
      name: ch.name,
      order: ch.order_index || 1,
      difficulty: ch.difficulty || 'medium',
      estimatedMinutes: ch.estimated_minutes || 45,
      status: ch.status || 'not_started',
      completedMinutes: ch.completed_minutes || 0,
      subtopics: subtopicsByChapter[ch.id] || [],
      lastStudiedDate: ch.last_studied_date || undefined,
      completedDate: ch.completed_date || undefined,
      revisionCount: ch.revision_count || 0,
      nextRevisionDate: ch.next_revision_date || undefined,
    }));

    const exams: Exam[] = (examsRes.data || []).map((e: any) => ({
      id: e.id,
      name: e.name,
      targetDate: e.target_date,
      color: e.color || '#3B82F6',
    }));

    const subjects: Subject[] = (subjectsRes.data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      color: s.color || '#3B82F6',
      order: s.order_index || 1,
    }));

    const plans: PlannedStudyItem[] = (tasksRes.data || []).map((t: any) => ({
      id: t.id,
      date: t.date,
      chapterId: t.chapter_id,
      subtopicId: t.subtopic_id || undefined,
      subtopicName: t.subtopic_name || undefined,
      subjectId: t.subject_id,
      examId: t.exam_id || undefined,
      type: t.type || 'learn',
      plannedMinutes: t.planned_minutes || 30,
      completed: Boolean(t.completed),
      completedMinutes: t.completed_minutes || 0,
      feedback: t.feedback || undefined,
      order: t.order_index || 1,
      notes: t.notes || undefined,
    }));

    const sessionLogs: StudySessionLog[] = (sessionsRes.data || []).map((sess: any) => ({
      id: sess.id,
      chapterId: sess.chapter_id,
      subtopicId: sess.subtopic_id || undefined,
      subtopicName: sess.subtopic_name || undefined,
      subjectId: sess.subject_id,
      date: sess.date,
      startedAt: sess.started_at,
      durationMinutes: sess.duration_minutes || 0,
      plannedItemId: sess.planned_item_id || undefined,
      feedback: sess.feedback || 'okay',
      progressMade: sess.progress_made || 'finished',
      notes: sess.notes || undefined,
    }));

    const timetable: TimetableSlot[] = (timetableRes.data || []).map((tt: any) => ({
      id: tt.id,
      title: tt.title,
      days: tt.days || [],
      startTime: tt.start_time,
      endTime: tt.end_time,
      category: tt.category || 'school',
    }));

    const notifications: AppNotification[] = (notifsRes.data || []).map((n: any) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      createdAt: n.created_at,
      read: Boolean(n.read),
      targetTab: n.target_tab || undefined,
      actionId: n.action_id || undefined,
    }));

    let profile: Partial<StudentProfile> | undefined;
    if (profileRes.data) {
      const p = profileRes.data;
      profile = {
        name: p.name,
        email: p.email,
        dailyStudyMinutes: p.daily_study_minutes || 135,
        theme: p.theme || 'light',
        autoAdjustPlan: p.auto_adjust_plan !== false,
        showStatsToFriends: p.show_stats_to_friends !== false,
        notifications: p.notifications || undefined,
      };
    }

    return {
      profile,
      exams,
      subjects,
      chapters,
      plans,
      sessionLogs,
      timetable,
      notifications,
    };
  } catch (err) {
    console.error('Failed to load user data from Supabase:', err);
    return null;
  }
}

// ----------------------------------------------------------------------
// Individual Table Sync Operations
// ----------------------------------------------------------------------

export async function syncProfileToDb(
  userId: string,
  profile: StudentProfile,
  stats?: UserStudyStats
): Promise<void> {
  if (!supabase || !isUUID(userId)) return;
  try {
    await supabase.from('profiles').upsert({
      id: userId,
      name: profile.name,
      email: profile.email,
      daily_study_minutes: profile.dailyStudyMinutes,
      auto_adjust_plan: profile.autoAdjustPlan,
      theme: profile.theme,
      show_stats_to_friends: profile.showStatsToFriends,
      notifications: profile.notifications,
      streak_days: stats?.currentStreak || 0,
      best_streak_days: stats?.bestStreak || 0,
      weekly_study_minutes: stats?.weekMinutes || 0,
      overall_study_minutes: stats?.overallMinutes || 0,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('syncProfileToDb warning:', e);
  }
}

export async function syncExamToDb(userId: string, exam: Exam): Promise<void> {
  if (!supabase || !isUUID(userId)) return;
  try {
    await supabase.from('exams').upsert({
      id: exam.id,
      user_id: userId,
      name: exam.name,
      target_date: exam.targetDate,
      color: exam.color || '#3B82F6',
      is_primary: true,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('syncExamToDb warning:', e);
  }
}

export async function deleteExamFromDb(userId: string, examId: string): Promise<void> {
  if (!supabase || !isUUID(userId)) return;
  try {
    await supabase.from('exams').delete().match({ id: examId, user_id: userId });
  } catch (e) {
    console.warn('deleteExamFromDb warning:', e);
  }
}

export async function syncSubjectToDb(userId: string, subject: Subject): Promise<void> {
  if (!supabase || !isUUID(userId)) return;
  try {
    await supabase.from('subjects').upsert({
      id: subject.id,
      user_id: userId,
      name: subject.name,
      color: subject.color,
      order_index: subject.order,
    });
  } catch (e) {
    console.warn('syncSubjectToDb warning:', e);
  }
}

export async function deleteSubjectFromDb(userId: string, subjectId: string): Promise<void> {
  if (!supabase || !isUUID(userId)) return;
  try {
    await supabase.from('subjects').delete().match({ id: subjectId, user_id: userId });
  } catch (e) {
    console.warn('deleteSubjectFromDb warning:', e);
  }
}

export async function syncChapterToDb(userId: string, chapter: Chapter): Promise<void> {
  if (!supabase || !isUUID(userId)) return;
  try {
    await supabase.from('chapters').upsert({
      id: chapter.id,
      user_id: userId,
      subject_id: chapter.subjectId,
      name: chapter.name,
      order_index: chapter.order,
      difficulty: chapter.difficulty,
      estimated_minutes: chapter.estimatedMinutes,
      status: chapter.status,
      completed_minutes: chapter.completedMinutes,
      last_studied_date: chapter.lastStudiedDate || null,
      completed_date: chapter.completedDate || null,
      revision_count: chapter.revisionCount || 0,
      next_revision_date: chapter.nextRevisionDate || null,
      updated_at: new Date().toISOString(),
    });

    if (chapter.subtopics && chapter.subtopics.length > 0) {
      const subtopicRows = chapter.subtopics.map((st) => ({
        id: st.id,
        user_id: userId,
        chapter_id: chapter.id,
        name: st.name,
        completed: st.completed,
        estimated_minutes: st.estimatedMinutes,
        order_index: st.order,
        completed_date: st.completedDate || null,
        updated_at: new Date().toISOString(),
      }));
      await supabase.from('subtopics').upsert(subtopicRows);
    }
  } catch (e) {
    console.warn('syncChapterToDb warning:', e);
  }
}

export async function deleteChapterFromDb(userId: string, chapterId: string): Promise<void> {
  if (!supabase || !isUUID(userId)) return;
  try {
    await supabase.from('chapters').delete().match({ id: chapterId, user_id: userId });
  } catch (e) {
    console.warn('deleteChapterFromDb warning:', e);
  }
}

export async function syncSubtopicToDb(userId: string, subtopic: Subtopic): Promise<void> {
  if (!supabase || !isUUID(userId)) return;
  try {
    await supabase.from('subtopics').upsert({
      id: subtopic.id,
      user_id: userId,
      chapter_id: subtopic.chapterId,
      name: subtopic.name,
      completed: subtopic.completed,
      estimated_minutes: subtopic.estimatedMinutes,
      order_index: subtopic.order,
      completed_date: subtopic.completedDate || null,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('syncSubtopicToDb warning:', e);
  }
}

export async function deleteSubtopicFromDb(userId: string, subtopicId: string): Promise<void> {
  if (!supabase || !isUUID(userId)) return;
  try {
    await supabase.from('subtopics').delete().match({ id: subtopicId, user_id: userId });
  } catch (e) {
    console.warn('deleteSubtopicFromDb warning:', e);
  }
}

export async function syncTasksToDb(userId: string, tasks: PlannedStudyItem[]): Promise<void> {
  if (!supabase || !isUUID(userId) || tasks.length === 0) return;
  try {
    const rows = tasks.map((t) => ({
      id: t.id,
      user_id: userId,
      date: t.date,
      chapter_id: t.chapterId,
      subtopic_id: t.subtopicId || null,
      subtopic_name: t.subtopicName || null,
      subject_id: t.subjectId,
      exam_id: t.examId || 'default',
      type: t.type,
      planned_minutes: t.plannedMinutes,
      completed: t.completed,
      completed_minutes: t.completedMinutes || 0,
      feedback: t.feedback || null,
      order_index: t.order,
      notes: t.notes || null,
      updated_at: new Date().toISOString(),
    }));

    // Upsert in batches of 50
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      await supabase.from('tasks').upsert(batch);
    }
  } catch (e) {
    console.warn('syncTasksToDb warning:', e);
  }
}

export async function deleteTaskFromDb(userId: string, taskId: string): Promise<void> {
  if (!supabase || !isUUID(userId)) return;
  try {
    await supabase.from('tasks').delete().match({ id: taskId, user_id: userId });
  } catch (e) {
    console.warn('deleteTaskFromDb warning:', e);
  }
}

export async function syncStudySessionToDb(userId: string, log: StudySessionLog): Promise<void> {
  if (!supabase || !isUUID(userId)) return;
  try {
    await supabase.from('study_sessions').upsert({
      id: log.id,
      user_id: userId,
      chapter_id: log.chapterId,
      subtopic_id: log.subtopicId || null,
      subtopic_name: log.subtopicName || null,
      subject_id: log.subjectId,
      date: log.date,
      started_at: log.startedAt,
      duration_minutes: log.durationMinutes,
      planned_item_id: log.plannedItemId || null,
      feedback: log.feedback,
      progress_made: log.progressMade,
      notes: log.notes || null,
    });
  } catch (e) {
    console.warn('syncStudySessionToDb warning:', e);
  }
}

export async function syncTimetableSlotToDb(userId: string, slot: TimetableSlot): Promise<void> {
  if (!supabase || !isUUID(userId)) return;
  try {
    await supabase.from('timetable_events').upsert({
      id: slot.id,
      user_id: userId,
      title: slot.title,
      days: slot.days,
      start_time: slot.startTime,
      end_time: slot.endTime,
      category: slot.category,
    });
  } catch (e) {
    console.warn('syncTimetableSlotToDb warning:', e);
  }
}

export async function deleteTimetableSlotFromDb(userId: string, slotId: string): Promise<void> {
  if (!supabase || !isUUID(userId)) return;
  try {
    await supabase.from('timetable_events').delete().match({ id: slotId, user_id: userId });
  } catch (e) {
    console.warn('deleteTimetableSlotFromDb warning:', e);
  }
}

export async function syncNotificationToDb(userId: string, notif: AppNotification): Promise<void> {
  if (!supabase || !isUUID(userId)) return;
  try {
    await supabase.from('notifications').upsert({
      id: notif.id,
      user_id: userId,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      read: notif.read,
      target_tab: notif.targetTab || null,
      action_id: notif.actionId || null,
      created_at: notif.createdAt,
    });
  } catch (e) {
    console.warn('syncNotificationToDb warning:', e);
  }
}

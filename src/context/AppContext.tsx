import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Chapter,
  Exam,
  PlannedStudyItem,
  PlanStatus,
  StudentProfile,
  StudySessionLog,
  Subject,
  TimetableSlot,
  SmartInsight,
  SessionFeedback,
  SessionProgress,
  Subtopic,
  Friend,
  FriendRequest,
  AppNotification,
  AuthUser,
  UserStudyStats,
} from '../types';
import { getInitialEmptyState } from '../data/initialState';
import {
  calculateOnTrackStatus,
  generateSmartInsights,
  generateStudySchedule,
  calculateStreak,
  calculateStudyHours,
  formatDate,
  addDays,
  getNextRevisionDays,
} from '../services/plannerEngine';
import {
  getCurrentUser,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  supabase,
} from '../services/auth';

function normalizeSubtopics(chId: string, subtopics: any[]): Subtopic[] {
  if (!Array.isArray(subtopics)) return [];
  return subtopics.map((st, idx) => {
    if (typeof st === 'string') {
      return {
        id: `subt_${chId}_${idx}`,
        chapterId: chId,
        name: st,
        completed: false,
        estimatedMinutes: 20,
        order: idx + 1,
      };
    }
    return {
      id: st.id || `subt_${chId}_${idx}`,
      chapterId: chId,
      name: st.name || 'Subtopic',
      completed: Boolean(st.completed),
      estimatedMinutes: Number(st.estimatedMinutes) || 20,
      order: st.order || idx + 1,
      completedDate: st.completedDate,
    };
  });
}

export type NavigationTab = 'home' | 'syllabus' | 'plan' | 'progress' | 'friends' | 'more';

interface AppContextType {
  // Academic Data
  exam: Exam | null;
  setExam: (examData: { name: string; targetDate: string; color?: string } | null) => void;
  exams: Exam[]; // For backwards-compat with any exam array checks
  subjects: Subject[];
  chapters: Chapter[];
  plans: PlannedStudyItem[];
  sessionLogs: StudySessionLog[];
  timetable: TimetableSlot[];
  profile: StudentProfile;

  // Social & Notifications
  friends: Friend[];
  friendRequests: FriendRequest[];
  notifications: AppNotification[];
  unreadNotificationsCount: number;

  // User Stats (Calculated strictly from real sessionLogs)
  userStats: UserStudyStats & { formattedWeek: string; formattedOverall: string };

  // Navigation & Modals
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  activeStudySession: { chapter: Chapter; plannedItem?: PlannedStudyItem; subtopic?: Subtopic } | null;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  showSyllabusImport: boolean;
  setShowSyllabusImport: (show: boolean) => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  showNotificationsModal: boolean;
  setShowNotificationsModal: (show: boolean) => void;

  // Insights & Status
  planStatus: PlanStatus;
  smartInsights: SmartInsight[];
  missedStudyNotice: { hasMissed: boolean; message: string; items: PlannedStudyItem[] } | null;

  // Study Session Controls
  startStudy: (chapter: Chapter, plannedItem?: PlannedStudyItem, subtopic?: Subtopic) => void;
  cancelStudy: () => void;
  finishStudy: (
    durationMinutes: number,
    feedback: SessionFeedback,
    progressMade: SessionProgress,
    notes?: string,
    completedSubtopicId?: string
  ) => void;
  toggleItemComplete: (itemId: string) => void;
  rescheduleItem: (itemId: string, targetDate: string) => void;

  // Subject CRUD
  addSubject: (name: string, color?: string) => void;
  updateSubject: (subjectId: string, updates: Partial<Subject>) => void;
  deleteSubject: (subjectId: string) => void;

  // Chapter & Subtopic CRUD
  addChapter: (chapter: {
    subjectId: string;
    name: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    estimatedMinutes?: number;
    subtopics?: string[];
  }) => void;
  updateChapter: (chapterId: string, updates: Partial<Chapter>) => void;
  deleteChapter: (chapterId: string) => void;
  addSubtopic: (chapterId: string, name: string, estimatedMinutes?: number) => void;
  updateSubtopic: (chapterId: string, subtopicId: string, updates: Partial<Subtopic>) => void;
  deleteSubtopic: (chapterId: string, subtopicId: string) => void;
  toggleSubtopicComplete: (chapterId: string, subtopicId: string) => void;

  // Timetable CRUD
  addTimetableSlot: (slot: Omit<TimetableSlot, 'id'>) => void;
  updateTimetableSlot: (slotId: string, updates: Partial<TimetableSlot>) => void;
  deleteTimetableSlot: (slotId: string) => void;

  // Plan CRUD
  addPlanItem: (item: Omit<PlannedStudyItem, 'id'>) => void;
  deletePlanItem: (itemId: string) => void;

  // Profile & Theme
  updateProfile: (updates: Partial<StudentProfile>) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Social Operations
  sendFriendRequest: (searchQuery: string) => { success: boolean; message: string };
  acceptFriendRequest: (requestId: string) => void;
  declineFriendRequest: (requestId: string) => void;
  removeFriend: (friendId: string) => void;
  nudgeFriend: (friendId: string) => void;

  // Notification Operations
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;

  // Auth Operations
  authUser: AuthUser | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;

  // Onboarding & Helpers
  completeOnboarding: (params: {
    name: string;
    examName: string;
    examDate: string;
    dailyHours: number;
    subjectsData?: any[];
  }) => void;
  importCustomSyllabusData: (subjectsData: any[]) => void;
  handleMissedStudyAction: (action: 'keep' | 'adjust') => void;
  clearAllData: () => void;
  resetToEmpty: () => void;
  resetToDemo: () => void; // alias
}

const STORAGE_KEY = 'pace_student_data_v3';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load stored state or start with completely fresh empty state
  const [data, setData] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.chapters)) {
          parsed.chapters = parsed.chapters.map((ch: any) => ({
            ...ch,
            subtopics: normalizeSubtopics(ch.id, ch.subtopics),
          }));
        }
        if (!parsed.friends) parsed.friends = [];
        if (!parsed.friendRequests) parsed.friendRequests = [];
        if (!parsed.notifications) parsed.notifications = [];
        if (!parsed.profile) parsed.profile = getInitialEmptyState().profile;
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse stored study data, starting clean:', e);
    }
    return getInitialEmptyState();
  });

  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [activeStudySession, setActiveStudySession] = useState<{
    chapter: Chapter;
    plannedItem?: PlannedStudyItem;
    subtopic?: Subtopic;
  } | null>(null);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSyllabusImport, setShowSyllabusImport] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [missedNoticeDismissed, setMissedNoticeDismissed] = useState(false);

  // Supabase Auth State
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    getCurrentUser().then((user) => {
      // If user signed in, sync user details
      if (user && user.email !== 'arjun.singh@example.com') {
        setAuthUser(user);
      } else {
        setAuthUser(null);
      }
    });

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const user: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Student',
            avatar: session.user.user_metadata?.avatar_url,
            createdAt: session.user.created_at,
          };
          setAuthUser(user);
          updateProfile({ name: user.name, email: user.email });
        } else if (_event === 'SIGNED_OUT') {
          setAuthUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [data]);

  // Dark Mode Application to <html> element
  useEffect(() => {
    const theme = data.profile?.theme || 'light';
    const root = document.documentElement;

    const applyDark = () => {
      root.classList.add('dark');
    };
    const removeDark = () => {
      root.classList.remove('dark');
    };

    if (theme === 'dark') {
      applyDark();
    } else if (theme === 'light') {
      removeDark();
    } else if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) applyDark();
      else removeDark();
    }
  }, [data.profile?.theme]);

  const todayStr = formatDate(new Date());

  // Exam computation
  const primaryExam = data.exams?.[0] || null;

  // On-track calculation
  const planStatus = calculateOnTrackStatus({
    todayStr,
    primaryExam,
    chapters: data.chapters || [],
    profile: data.profile,
    timetable: data.timetable || [],
    sessionLogs: data.sessionLogs || [],
  });

  // Calculate real streak and study hours strictly from sessionLogs
  const streakData = calculateStreak(data.sessionLogs || [], todayStr);
  const hoursData = calculateStudyHours(data.sessionLogs || [], todayStr);
  const userStats: UserStudyStats & { formattedWeek: string; formattedOverall: string } = {
    currentStreak: streakData.currentStreak,
    bestStreak: streakData.bestStreak,
    todayMinutes: hoursData.todayMinutes,
    weekMinutes: hoursData.weekMinutes,
    overallMinutes: hoursData.overallMinutes,
    formattedWeek: hoursData.formattedWeek,
    formattedOverall: hoursData.formattedOverall,
  };

  // Smart insights
  const smartInsights = generateSmartInsights({
    chapters: data.chapters || [],
    subjects: data.subjects || [],
    sessionLogs: data.sessionLogs || [],
    status: planStatus,
  });

  // Detect missed study
  const uncompletedPastItems = (data.plans || []).filter(
    (p: PlannedStudyItem) => p.date < todayStr && !p.completed
  );

  const missedStudyNotice =
    uncompletedPastItems.length > 0 && !missedNoticeDismissed && data.profile?.autoAdjustPlan !== false
      ? {
          hasMissed: true,
          items: uncompletedPastItems,
          message:
            uncompletedPastItems.length === 1
              ? `You had an unfinished study session yesterday.`
              : `You have ${uncompletedPastItems.length} pending study sessions from earlier this week.`,
        }
      : null;

  // Exam configuration
  const setExam = (examData: { name: string; targetDate: string; color?: string } | null) => {
    if (!examData) {
      setData((prev: any) => ({ ...prev, exams: [] }));
      return;
    }

    const newExam: Exam = {
      id: `exam_${Date.now()}`,
      name: examData.name.trim(),
      targetDate: examData.targetDate,
      color: examData.color || '#3B82F6',
    };

    const newPlans = generateStudySchedule({
      todayStr,
      daysToPlan: 14,
      exams: [newExam],
      subjects: data.subjects || [],
      chapters: data.chapters || [],
      existingPlans: data.plans || [],
      timetable: data.timetable || [],
      profile: data.profile,
      sessionLogs: data.sessionLogs || [],
    });

    setData((prev: any) => ({
      ...prev,
      exams: [newExam],
      plans: newPlans,
    }));
  };

  // Study Session Controls
  const startStudy = (chapter: Chapter, plannedItem?: PlannedStudyItem, subtopic?: Subtopic) => {
    setActiveStudySession({ chapter, plannedItem, subtopic });
  };

  const cancelStudy = () => {
    setActiveStudySession(null);
  };

  const finishStudy = (
    durationMinutes: number,
    feedback: SessionFeedback,
    progressMade: SessionProgress,
    notes?: string,
    completedSubtopicId?: string
  ) => {
    if (!activeStudySession) return;

    const { chapter, plannedItem, subtopic } = activeStudySession;
    const now = new Date();

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#4F46E5', '#10B981', '#8B5CF6', '#F59E0B'],
      });
    } catch {
      // safe fallback
    }

    const subId = completedSubtopicId || subtopic?.id || plannedItem?.subtopicId;
    const subName = subtopic?.name || plannedItem?.subtopicName;

    const newLog: StudySessionLog = {
      id: `log_${Date.now()}`,
      chapterId: chapter.id,
      subtopicId: subId,
      subtopicName: subName,
      subjectId: chapter.subjectId,
      date: todayStr,
      startedAt: now.toISOString(),
      durationMinutes,
      plannedItemId: plannedItem?.id,
      feedback,
      progressMade,
      notes,
    };

    // Update subtopics
    let updatedSubtopics = [...(chapter.subtopics || [])];
    if (subId) {
      updatedSubtopics = updatedSubtopics.map((st) => {
        if (st.id === subId) {
          return {
            ...st,
            completed: progressMade === 'finished' ? true : st.completed,
            completedDate: progressMade === 'finished' ? todayStr : st.completedDate,
          };
        }
        return st;
      });
    }

    const allSubtopicsDone =
      updatedSubtopics.length > 0 && updatedSubtopics.every((st) => st.completed);
    let newStatus = chapter.status;
    let newCompletedMinutes = (chapter.completedMinutes || 0) + durationMinutes;
    let newCompletedDate = chapter.completedDate;
    let newNextRevisionDate = chapter.nextRevisionDate;
    let newRevisionCount = chapter.revisionCount || 0;

    if (progressMade === 'finished' || allSubtopicsDone) {
      newStatus = 'completed';
      newCompletedDate = todayStr;
      newRevisionCount += 1;
      const daysToAdd = getNextRevisionDays(newRevisionCount, data.profile?.revisionIntervalPreset || 'standard');
      newNextRevisionDate = addDays(todayStr, daysToAdd);
    } else {
      newStatus = 'in_progress';
    }

    const updatedPlans = (data.plans || []).map((p: PlannedStudyItem) => {
      if (plannedItem && p.id === plannedItem.id) {
        return {
          ...p,
          completed: true,
          completedMinutes: durationMinutes,
          feedback,
        };
      }
      return p;
    });

    const updatedChapters = (data.chapters || []).map((c: Chapter) => {
      if (c.id === chapter.id) {
        return {
          ...c,
          subtopics: updatedSubtopics,
          status: newStatus,
          completedMinutes: newCompletedMinutes,
          completedDate: newCompletedDate,
          nextRevisionDate: newNextRevisionDate,
          revisionCount: newRevisionCount,
        };
      }
      return c;
    });

    const recomputedPlans = generateStudySchedule({
      todayStr,
      daysToPlan: 14,
      exams: data.exams || [],
      subjects: data.subjects || [],
      chapters: updatedChapters,
      existingPlans: updatedPlans,
      timetable: data.timetable || [],
      profile: data.profile,
      sessionLogs: [...(data.sessionLogs || []), newLog],
    });

    setData((prev: any) => ({
      ...prev,
      plans: recomputedPlans,
      chapters: updatedChapters,
      sessionLogs: [...(prev.sessionLogs || []), newLog],
    }));

    setActiveStudySession(null);
  };

  const toggleItemComplete = (itemId: string) => {
    const item = (data.plans || []).find((p: PlannedStudyItem) => p.id === itemId);
    if (!item) return;

    const newCompleted = !item.completed;
    const targetChapter = (data.chapters || []).find((c: Chapter) => c.id === item.chapterId);

    const updatedPlans = (data.plans || []).map((p: PlannedStudyItem) => {
      if (p.id === itemId) {
        return { ...p, completed: newCompleted, completedMinutes: newCompleted ? p.plannedMinutes : 0 };
      }
      return p;
    });

    let updatedChapters = data.chapters || [];
    if (targetChapter && newCompleted && item.type === 'learn') {
      updatedChapters = (data.chapters || []).map((c: Chapter) => {
        if (c.id === targetChapter.id) {
          let updatedSubs = c.subtopics;
          if (item.subtopicId) {
            updatedSubs = (c.subtopics || []).map((st) =>
              st.id === item.subtopicId ? { ...st, completed: true, completedDate: todayStr } : st
            );
          }
          const allDone = updatedSubs.length > 0 && updatedSubs.every((st) => st.completed);
          return {
            ...c,
            subtopics: updatedSubs,
            status: allDone || !item.subtopicId ? 'completed' : c.status,
            completedDate: todayStr,
            nextRevisionDate: addDays(todayStr, 3),
            revisionCount: (c.revisionCount || 0) + 1,
          };
        }
        return c;
      });
    }

    setData((prev: any) => ({
      ...prev,
      plans: updatedPlans,
      chapters: updatedChapters,
    }));
  };

  const rescheduleItem = (itemId: string, targetDate: string) => {
    const updatedPlans = (data.plans || []).map((p: PlannedStudyItem) => {
      if (p.id === itemId) {
        return { ...p, date: targetDate, notes: 'Rescheduled' };
      }
      return p;
    });

    setData((prev: any) => ({
      ...prev,
      plans: updatedPlans,
    }));
  };

  const handleMissedStudyAction = (action: 'keep' | 'adjust') => {
    setMissedNoticeDismissed(true);

    if (action === 'adjust') {
      const redistributed = generateStudySchedule({
        todayStr,
        daysToPlan: 14,
        exams: data.exams || [],
        subjects: data.subjects || [],
        chapters: data.chapters || [],
        existingPlans: data.plans || [],
        timetable: data.timetable || [],
        profile: data.profile,
        sessionLogs: data.sessionLogs || [],
      });

      setData((prev: any) => ({
        ...prev,
        plans: redistributed,
      }));
    }
  };

  // Subject CRUD
  const addSubject = (name: string, color = '#3B82F6') => {
    if (!name.trim()) return;
    const newSub: Subject = {
      id: `sub_${Date.now()}`,
      name: name.trim(),
      color,
      order: (data.subjects || []).length + 1,
    };

    setData((prev: any) => ({
      ...prev,
      subjects: [...(prev.subjects || []), newSub],
    }));
  };

  const updateSubject = (subjectId: string, updates: Partial<Subject>) => {
    setData((prev: any) => ({
      ...prev,
      subjects: (prev.subjects || []).map((s: Subject) => (s.id === subjectId ? { ...s, ...updates } : s)),
    }));
  };

  const deleteSubject = (subjectId: string) => {
    setData((prev: any) => ({
      ...prev,
      subjects: (prev.subjects || []).filter((s: Subject) => s.id !== subjectId),
      chapters: (prev.chapters || []).filter((c: Chapter) => c.subjectId !== subjectId),
      plans: (prev.plans || []).filter((p: PlannedStudyItem) => p.subjectId !== subjectId),
    }));
  };

  // Chapter & Subtopic CRUD
  const addChapter = (chapterData: {
    subjectId: string;
    name: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    estimatedMinutes?: number;
    subtopics?: string[];
  }) => {
    const newId = `ch_${Date.now()}`;
    const newChapter: Chapter = {
      id: newId,
      subjectId: chapterData.subjectId,
      name: chapterData.name.trim(),
      order: (data.chapters || []).filter((c: Chapter) => c.subjectId === chapterData.subjectId).length + 1,
      difficulty: chapterData.difficulty || 'medium',
      estimatedMinutes: chapterData.estimatedMinutes || 45,
      status: 'not_started',
      completedMinutes: 0,
      revisionCount: 0,
      subtopics: normalizeSubtopics(newId, chapterData.subtopics || []),
    };

    const newChapters = [...(data.chapters || []), newChapter];
    const newPlans = generateStudySchedule({
      todayStr,
      daysToPlan: 14,
      exams: data.exams || [],
      subjects: data.subjects || [],
      chapters: newChapters,
      existingPlans: data.plans || [],
      timetable: data.timetable || [],
      profile: data.profile,
      sessionLogs: data.sessionLogs || [],
    });

    setData((prev: any) => ({
      ...prev,
      chapters: newChapters,
      plans: newPlans,
    }));
  };

  const updateChapter = (chapterId: string, updates: Partial<Chapter>) => {
    const newChapters = (data.chapters || []).map((c: Chapter) => {
      if (c.id === chapterId) {
        const updated = { ...c, ...updates };
        if (updates.subtopics) {
          updated.subtopics = normalizeSubtopics(chapterId, updates.subtopics);
        }
        return updated;
      }
      return c;
    });

    setData((prev: any) => ({
      ...prev,
      chapters: newChapters,
    }));
  };

  const deleteChapter = (chapterId: string) => {
    const newChapters = (data.chapters || []).filter((c: Chapter) => c.id !== chapterId);
    const newPlans = (data.plans || []).filter((p: PlannedStudyItem) => p.chapterId !== chapterId);

    setData((prev: any) => ({
      ...prev,
      chapters: newChapters,
      plans: newPlans,
    }));
  };

  const addSubtopic = (chapterId: string, name: string, estimatedMinutes = 20) => {
    const chapter = (data.chapters || []).find((c: Chapter) => c.id === chapterId);
    if (!chapter || !name.trim()) return;

    const newSub: Subtopic = {
      id: `subt_${Date.now()}`,
      chapterId,
      name: name.trim(),
      completed: false,
      estimatedMinutes,
      order: (chapter.subtopics?.length || 0) + 1,
    };

    const updatedChapters = (data.chapters || []).map((c: Chapter) => {
      if (c.id === chapterId) {
        return {
          ...c,
          subtopics: [...(c.subtopics || []), newSub],
        };
      }
      return c;
    });

    setData((prev: any) => ({
      ...prev,
      chapters: updatedChapters,
    }));
  };

  const updateSubtopic = (chapterId: string, subtopicId: string, updates: Partial<Subtopic>) => {
    const updatedChapters = (data.chapters || []).map((c: Chapter) => {
      if (c.id === chapterId) {
        return {
          ...c,
          subtopics: (c.subtopics || []).map((st) =>
            st.id === subtopicId ? { ...st, ...updates } : st
          ),
        };
      }
      return c;
    });

    setData((prev: any) => ({
      ...prev,
      chapters: updatedChapters,
    }));
  };

  const deleteSubtopic = (chapterId: string, subtopicId: string) => {
    const updatedChapters = (data.chapters || []).map((c: Chapter) => {
      if (c.id === chapterId) {
        return {
          ...c,
          subtopics: (c.subtopics || []).filter((st) => st.id !== subtopicId),
        };
      }
      return c;
    });

    setData((prev: any) => ({
      ...prev,
      chapters: updatedChapters,
    }));
  };

  const toggleSubtopicComplete = (chapterId: string, subtopicId: string) => {
    const chapter = (data.chapters || []).find((c: Chapter) => c.id === chapterId);
    if (!chapter) return;

    const targetSub = chapter.subtopics?.find((st) => st.id === subtopicId);
    const newCompleted = !targetSub?.completed;

    const updatedSubtopics = (chapter.subtopics || []).map((st) => {
      if (st.id === subtopicId) {
        return {
          ...st,
          completed: newCompleted,
          completedDate: newCompleted ? todayStr : undefined,
        };
      }
      return st;
    });

    const allCompleted = updatedSubtopics.every((st) => st.completed);
    const newStatus = allCompleted ? 'completed' : updatedSubtopics.some((st) => st.completed) ? 'in_progress' : chapter.status;

    const updatedChapters = (data.chapters || []).map((c: Chapter) => {
      if (c.id === chapterId) {
        return {
          ...c,
          subtopics: updatedSubtopics,
          status: newStatus,
          completedDate: allCompleted ? todayStr : c.completedDate,
        };
      }
      return c;
    });

    setData((prev: any) => ({
      ...prev,
      chapters: updatedChapters,
    }));
  };

  // Timetable CRUD
  const addTimetableSlot = (slot: Omit<TimetableSlot, 'id'>) => {
    const newSlot: TimetableSlot = { ...slot, id: `tt_${Date.now()}` };
    const newTimetable = [...(data.timetable || []), newSlot];

    const newPlans = generateStudySchedule({
      todayStr,
      daysToPlan: 14,
      exams: data.exams || [],
      subjects: data.subjects || [],
      chapters: data.chapters || [],
      existingPlans: data.plans || [],
      timetable: newTimetable,
      profile: data.profile,
      sessionLogs: data.sessionLogs || [],
    });

    setData((prev: any) => ({
      ...prev,
      timetable: newTimetable,
      plans: newPlans,
    }));
  };

  const updateTimetableSlot = (slotId: string, updates: Partial<TimetableSlot>) => {
    const newTimetable = (data.timetable || []).map((t: TimetableSlot) =>
      t.id === slotId ? { ...t, ...updates } : t
    );
    setData((prev: any) => ({
      ...prev,
      timetable: newTimetable,
    }));
  };

  const deleteTimetableSlot = (slotId: string) => {
    const newTimetable = (data.timetable || []).filter((t: TimetableSlot) => t.id !== slotId);
    setData((prev: any) => ({
      ...prev,
      timetable: newTimetable,
    }));
  };

  // Plan CRUD
  const addPlanItem = (item: Omit<PlannedStudyItem, 'id'>) => {
    const newItem: PlannedStudyItem = {
      ...item,
      id: `plan_custom_${Date.now()}`,
    };
    setData((prev: any) => ({
      ...prev,
      plans: [...(prev.plans || []), newItem],
    }));
  };

  const deletePlanItem = (itemId: string) => {
    setData((prev: any) => ({
      ...prev,
      plans: (prev.plans || []).filter((p: PlannedStudyItem) => p.id !== itemId),
    }));
  };

  const updateProfile = (updates: Partial<StudentProfile>) => {
    const newProfile = { ...data.profile, ...updates };
    const newPlans = generateStudySchedule({
      todayStr,
      daysToPlan: 14,
      exams: data.exams || [],
      subjects: data.subjects || [],
      chapters: data.chapters || [],
      existingPlans: data.plans || [],
      timetable: data.timetable || [],
      profile: newProfile,
      sessionLogs: data.sessionLogs || [],
    });

    setData((prev: any) => ({
      ...prev,
      profile: newProfile,
      plans: newPlans,
    }));
  };

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    updateProfile({ theme });
  };

  // Social (Friends)
  const sendFriendRequest = (searchQuery: string): { success: boolean; message: string } => {
    if (!searchQuery.trim()) return { success: false, message: 'Please enter a name or username.' };

    const newFriend: Friend = {
      id: `fr_${Date.now()}`,
      name: searchQuery.trim(),
      avatar: searchQuery.trim().split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
      streakDays: 0,
      weeklyStudyMinutes: 0,
      showStats: true,
      nudgedToday: false,
    };

    setData((prev: any) => ({
      ...prev,
      friends: [...(prev.friends || []), newFriend],
    }));

    addNotification({
      type: 'friend_accepted',
      title: 'Study Buddy Added',
      message: `${newFriend.name} was added to your study circle!`,
      targetTab: 'friends',
    });

    return { success: true, message: `Connected with ${newFriend.name}!` };
  };

  const acceptFriendRequest = (requestId: string) => {
    const req = (data.friendRequests || []).find((r: FriendRequest) => r.id === requestId);
    if (!req) return;

    const newFriend: Friend = {
      id: `fr_${req.fromUserId}`,
      name: req.fromUserName,
      avatar: req.fromUserAvatar,
      streakDays: 0,
      weeklyStudyMinutes: 0,
      showStats: true,
      nudgedToday: false,
    };

    setData((prev: any) => ({
      ...prev,
      friends: [...(prev.friends || []), newFriend],
      friendRequests: (prev.friendRequests || []).filter((r: FriendRequest) => r.id !== requestId),
    }));

    addNotification({
      type: 'friend_accepted',
      title: 'Friend Request Accepted',
      message: `You and ${req.fromUserName} are now study buddies.`,
      targetTab: 'friends',
    });
  };

  const declineFriendRequest = (requestId: string) => {
    setData((prev: any) => ({
      ...prev,
      friendRequests: (prev.friendRequests || []).filter((r: FriendRequest) => r.id !== requestId),
    }));
  };

  const removeFriend = (friendId: string) => {
    setData((prev: any) => ({
      ...prev,
      friends: (prev.friends || []).filter((f: Friend) => f.id !== friendId),
    }));
  };

  const nudgeFriend = (friendId: string) => {
    const friend = (data.friends || []).find((f: Friend) => f.id === friendId);
    if (!friend) return;

    setData((prev: any) => ({
      ...prev,
      friends: (prev.friends || []).map((f: Friend) =>
        f.id === friendId ? { ...f, nudgedToday: true } : f
      ),
    }));

    addNotification({
      type: 'friend_nudge',
      title: `Nudge sent to ${friend.name}`,
      message: `You motivated ${friend.name} to study today! 👋`,
      targetTab: 'friends',
    });
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setData((prev: any) => ({
      ...prev,
      notifications: (prev.notifications || []).map((n: AppNotification) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  };

  const markAllNotificationsAsRead = () => {
    setData((prev: any) => ({
      ...prev,
      notifications: (prev.notifications || []).map((n: AppNotification) => ({ ...n, read: true })),
    }));
  };

  const addNotification = (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setData((prev: any) => ({
      ...prev,
      notifications: [newNotif, ...(prev.notifications || [])],
    }));
  };

  const unreadNotificationsCount = (data.notifications || []).filter((n: AppNotification) => !n.read).length;

  // Auth methods
  const signIn = async (email: string, password: string) => {
    const res = await signInWithEmail(email, password);
    if (res.error) return { error: res.error };
    if (res.user) {
      setAuthUser(res.user);
      setShowAuthModal(false);
      updateProfile({ name: res.user.name, email: res.user.email });
    }
    return {};
  };

  const signUp = async (name: string, email: string, password: string) => {
    const res = await signUpWithEmail(name, email, password);
    if (res.error) return { error: res.error };
    if (res.user) {
      setAuthUser(res.user);
      setShowAuthModal(false);
      updateProfile({ name: res.user.name, email: res.user.email });
    }
    return {};
  };

  const signOut = async () => {
    await signOutUser();
    setAuthUser(null);
  };

  // Import custom syllabus parsed by AI or manual input
  const importCustomSyllabusData = (subjectsData: any[]) => {
    if (!Array.isArray(subjectsData) || subjectsData.length === 0) return;

    const palette = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'];
    const newSubjects: Subject[] = [];
    const newChapters: Chapter[] = [];

    subjectsData.forEach((sub: any, sIdx: number) => {
      const subId = `sub_${Date.now()}_${sIdx}`;
      newSubjects.push({
        id: subId,
        name: sub.name || `Subject ${sIdx + 1}`,
        color: palette[sIdx % palette.length],
        order: (data.subjects || []).length + sIdx + 1,
      });

      if (Array.isArray(sub.chapters)) {
        sub.chapters.forEach((ch: any, cIdx: number) => {
          const chId = `ch_${Date.now()}_${sIdx}_${cIdx}`;
          newChapters.push({
            id: chId,
            subjectId: subId,
            name: ch.name || 'Chapter',
            order: cIdx + 1,
            difficulty: ch.difficulty || 'medium',
            estimatedMinutes: Number(ch.estimatedMinutes) || 45,
            status: 'not_started',
            completedMinutes: 0,
            subtopics: normalizeSubtopics(chId, ch.subtopics || []),
            revisionCount: 0,
          });
        });
      }
    });

    const mergedSubjects = [...(data.subjects || []), ...newSubjects];
    const mergedChapters = [...(data.chapters || []), ...newChapters];

    const newPlans = generateStudySchedule({
      todayStr,
      daysToPlan: 14,
      exams: data.exams || [],
      subjects: mergedSubjects,
      chapters: mergedChapters,
      existingPlans: data.plans || [],
      timetable: data.timetable || [],
      profile: data.profile,
      sessionLogs: data.sessionLogs || [],
    });

    setData((prev: any) => ({
      ...prev,
      subjects: mergedSubjects,
      chapters: mergedChapters,
      plans: newPlans,
    }));
  };

  // Complete full onboarding flow
  const completeOnboarding = (params: {
    name: string;
    examName: string;
    examDate: string;
    dailyHours: number;
    subjectsData?: any[];
  }) => {
    const dailyStudyMinutes = Math.round(params.dailyHours * 60);

    const updatedProfile: StudentProfile = {
      ...data.profile,
      name: params.name.trim(),
      dailyStudyMinutes,
    };

    const newExam: Exam = {
      id: `exam_${Date.now()}`,
      name: params.examName.trim() || 'My Exam',
      targetDate: params.examDate || addDays(todayStr, 30),
      color: '#3B82F6',
    };

    if (params.subjectsData && params.subjectsData.length > 0) {
      importCustomSyllabusData(params.subjectsData);
    }

    const newPlans = generateStudySchedule({
      todayStr,
      daysToPlan: 14,
      exams: [newExam],
      subjects: data.subjects || [],
      chapters: data.chapters || [],
      existingPlans: [],
      timetable: data.timetable || [],
      profile: updatedProfile,
      sessionLogs: [],
    });

    setData((prev: any) => ({
      ...prev,
      profile: updatedProfile,
      exams: [newExam],
      plans: newPlans,
    }));

    setShowOnboarding(false);
    setActiveTab('home');
  };

  const clearAllData = () => {
    const emptyState = getInitialEmptyState();
    setData(emptyState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyState));
    setActiveTab('home');
  };

  return (
    <AppContext.Provider
      value={{
        exam: primaryExam,
        setExam,
        exams: data.exams || [],
        subjects: data.subjects || [],
        chapters: data.chapters || [],
        plans: data.plans || [],
        sessionLogs: data.sessionLogs || [],
        timetable: data.timetable || [],
        profile: data.profile,
        friends: data.friends || [],
        friendRequests: data.friendRequests || [],
        notifications: data.notifications || [],
        unreadNotificationsCount,
        userStats,
        activeTab,
        setActiveTab,
        activeStudySession,
        showOnboarding,
        setShowOnboarding,
        showSyllabusImport,
        setShowSyllabusImport,
        showAuthModal,
        setShowAuthModal,
        showNotificationsModal,
        setShowNotificationsModal,
        planStatus,
        smartInsights,
        missedStudyNotice,
        startStudy,
        cancelStudy,
        finishStudy,
        toggleItemComplete,
        rescheduleItem,
        addSubject,
        updateSubject,
        deleteSubject,
        addChapter,
        updateChapter,
        deleteChapter,
        addSubtopic,
        updateSubtopic,
        deleteSubtopic,
        toggleSubtopicComplete,
        addTimetableSlot,
        updateTimetableSlot,
        deleteTimetableSlot,
        addPlanItem,
        deletePlanItem,
        updateProfile,
        setTheme,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        removeFriend,
        nudgeFriend,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,
        authUser,
        signIn,
        signUp,
        signOut,
        completeOnboarding,
        importCustomSyllabusData,
        handleMissedStudyAction,
        clearAllData,
        resetToEmpty: clearAllData,
        resetToDemo: clearAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

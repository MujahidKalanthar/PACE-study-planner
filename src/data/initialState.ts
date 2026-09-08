import {
  Chapter,
  Exam,
  PlannedStudyItem,
  StudentProfile,
  StudySessionLog,
  Subject,
  TimetableSlot,
  Friend,
  FriendRequest,
  AppNotification,
} from '../types';

export function getInitialEmptyState() {
  const exams: Exam[] = [];
  const subjects: Subject[] = [];
  const chapters: Chapter[] = [];
  const plans: PlannedStudyItem[] = [];
  const timetable: TimetableSlot[] = [];
  const sessionLogs: StudySessionLog[] = [];
  const friends: Friend[] = [];
  const friendRequests: FriendRequest[] = [];
  const notifications: AppNotification[] = [];

  const profile: StudentProfile = {
    name: '',
    dailyStudyMinutes: 120, // 2 hours default
    defaultSessionMinutes: 45,
    preferredSound: 'off',
    autoAdjustPlan: true,
    autoScheduleRevisions: true,
    revisionIntervalPreset: 'standard',
    theme: 'light',
    showStatsToFriends: true,
    notifications: {
      dailyMorningPlan: true,
      eveningReview: true,
      revisionAlerts: true,
      examAlerts: true,
      friendAlerts: true,
    },
  };

  return {
    exams,
    subjects,
    chapters,
    plans,
    timetable,
    profile,
    sessionLogs,
    friends,
    friendRequests,
    notifications,
  };
}

// Alias for backwards compatibility if referenced
export const getInitialDemoState = getInitialEmptyState;

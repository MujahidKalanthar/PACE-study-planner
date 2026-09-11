export type ChapterDifficulty = 'easy' | 'medium' | 'hard';
export type ChapterStatus = 'not_started' | 'in_progress' | 'completed';
export type StudyType = 'learn' | 'revise' | 'practice';
export type SessionFeedback = 'easy' | 'okay' | 'hard';
export type SessionProgress = 'finished' | 'partial' | 'started';
export type OnTrackLevel = 'on_track' | 'catching_up' | 'behind';

export interface Exam {
  id: string;
  name: string;
  targetDate: string; // YYYY-MM-DD
  color?: string;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface Subtopic {
  id: string;
  chapterId: string;
  name: string;
  completed: boolean;
  estimatedMinutes: number;
  order: number;
  completedDate?: string;
}

export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  order: number;
  difficulty: ChapterDifficulty;
  estimatedMinutes: number;
  status: ChapterStatus;
  completedMinutes: number;
  subtopics: Subtopic[];
  lastStudiedDate?: string;
  completedDate?: string;
  revisionCount: number;
  nextRevisionDate?: string;
}

export interface PlannedStudyItem {
  id: string;
  date: string; // YYYY-MM-DD
  chapterId: string;
  subtopicId?: string;
  subtopicName?: string;
  subjectId: string;
  examId?: string;
  type: StudyType;
  plannedMinutes: number;
  completed: boolean;
  completedMinutes?: number;
  feedback?: SessionFeedback;
  order: number;
  notes?: string;
}

export interface StudySessionLog {
  id: string;
  chapterId: string;
  subtopicId?: string;
  subtopicName?: string;
  subjectId: string;
  date: string; // YYYY-MM-DD
  startedAt: string;
  durationMinutes: number;
  plannedItemId?: string;
  feedback: SessionFeedback;
  progressMade: SessionProgress;
  notes?: string;
}

export interface TimetableSlot {
  id: string;
  title: string;
  days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  category: 'school' | 'coaching' | 'tuition' | 'other';
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt?: string;
  emailConfirmed?: boolean;
}

export interface StudentProfile {
  id?: string;
  email?: string;
  name: string;
  dailyStudyMinutes: number; // e.g. 120 (2 hours)
  defaultSessionMinutes?: number; // e.g. 45
  preferredSound?: 'off' | 'rain' | 'brown' | 'binaural';
  autoAdjustPlan: boolean;
  autoScheduleRevisions: boolean;
  revisionIntervalPreset?: 'standard' | 'frequent' | 'relaxed';
  theme: 'light' | 'dark' | 'system';
  showStatsToFriends: boolean;
  notifications: {
    dailyMorningPlan: boolean;
    eveningReview: boolean;
    revisionAlerts: boolean;
    examAlerts: boolean;
    friendAlerts: boolean;
  };
}

export type NotificationType =
  | 'revision'
  | 'reminder'
  | 'exam'
  | 'plan'
  | 'missed'
  | 'friend_nudge'
  | 'friend_request'
  | 'friend_accepted';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  targetTab?: 'home' | 'syllabus' | 'plan' | 'progress' | 'friends' | 'more';
  actionId?: string;
}

export interface Friend {
  id: string;
  name: string;
  avatar?: string;
  streakDays: number;
  weeklyStudyMinutes: number;
  showStats: boolean;
  nudgedToday?: boolean;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface UserStudyStats {
  currentStreak: number;
  bestStreak: number;
  todayMinutes: number;
  weekMinutes: number;
  overallMinutes: number;
}

export interface PlanStatus {
  status: OnTrackLevel;
  daysLeft: number;
  daysBeforeExamFinished: number;
  headline: string;
  detail: string;
  completionPercentage: number;
  totalChapters: number;
  completedChapters: number;
  remainingMinutes: number;
  dailyRecommendedMinutes: number;
}

export interface SmartInsight {
  id: string;
  title: string;
  type: 'positive' | 'neutral' | 'suggestion';
  message: string;
}

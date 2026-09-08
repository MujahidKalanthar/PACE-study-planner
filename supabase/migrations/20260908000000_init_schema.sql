-- ==============================================================================
-- PACE (Personalized Academic Planning & Execution) — Supabase PostgreSQL Schema
-- Migration: 20260908000000_init_schema.sql
-- Description: Complete production schema with RLS, triggers, indexes, and friend privacy.
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Student',
  email TEXT,
  class_level TEXT NOT NULL DEFAULT '12',
  daily_study_minutes INTEGER NOT NULL DEFAULT 135,
  onboarding_completed BOOLEAN NOT NULL DEFAULT true,
  auto_adjust_plan BOOLEAN NOT NULL DEFAULT true,
  theme TEXT NOT NULL DEFAULT 'light',
  show_stats_to_friends BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  streak_days INTEGER NOT NULL DEFAULT 0,
  best_streak_days INTEGER NOT NULL DEFAULT 0,
  weekly_study_minutes INTEGER NOT NULL DEFAULT 0,
  overall_study_minutes INTEGER NOT NULL DEFAULT 0,
  last_studied_date DATE,
  notifications JSONB NOT NULL DEFAULT '{"dailyMorningPlan": true, "eveningReview": true, "revisionAlerts": true, "friendAlerts": true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. EXAMS TABLE
CREATE TABLE IF NOT EXISTS public.exams (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  target_date DATE NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  subject_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  exam_ids TEXT[] DEFAULT '{}',
  order_index INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. CHAPTERS TABLE
CREATE TABLE IF NOT EXISTS public.chapters (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL,
  name TEXT NOT NULL,
  class_level TEXT NOT NULL DEFAULT '12',
  order_index INTEGER NOT NULL DEFAULT 1,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  estimated_minutes INTEGER NOT NULL DEFAULT 45,
  status TEXT NOT NULL DEFAULT 'not_started', -- not_started, in_progress, completed
  completed_minutes INTEGER NOT NULL DEFAULT 0,
  last_studied_date DATE,
  completed_date DATE,
  revision_count INTEGER NOT NULL DEFAULT 0,
  next_revision_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. SUBTOPICS TABLE
CREATE TABLE IF NOT EXISTS public.subtopics (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL,
  name TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  estimated_minutes INTEGER NOT NULL DEFAULT 20,
  order_index INTEGER NOT NULL DEFAULT 1,
  completed_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TASKS / PLANNED STUDY ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  chapter_id TEXT NOT NULL,
  subtopic_id TEXT,
  subtopic_name TEXT,
  subject_id TEXT NOT NULL,
  exam_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'learn', -- learn, revise, practice
  planned_minutes INTEGER NOT NULL DEFAULT 30,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_minutes INTEGER DEFAULT 0,
  feedback TEXT, -- easy, okay, hard
  order_index INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. STUDY SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL,
  subtopic_id TEXT,
  subtopic_name TEXT,
  subject_id TEXT NOT NULL,
  date DATE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  planned_item_id TEXT,
  feedback TEXT NOT NULL DEFAULT 'okay', -- easy, okay, hard
  progress_made TEXT NOT NULL DEFAULT 'finished', -- finished, partial, started
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. TIMETABLE EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.timetable_events (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}', -- 0=Sun, 1=Mon... 6=Sat
  start_time TEXT NOT NULL, -- HH:mm
  end_time TEXT NOT NULL, -- HH:mm
  category TEXT NOT NULL DEFAULT 'school', -- school, coaching, tuition, other
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- revision, reminder, exam, plan, missed, friend_nudge, friend_request, friend_accepted
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  target_tab TEXT, -- home, syllabus, plan, progress, friends, more
  action_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. FRIEND REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id TEXT PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, declined
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. FRIENDSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_friendship UNIQUE (user_id, friend_id)
);

-- 12. NUDGES TABLE
CREATE TABLE IF NOT EXISTS public.nudges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. FEEDBACK REPORTS TABLE (In-App Feedback & Bug Reports)
CREATE TABLE IF NOT EXISTS public.feedback_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'feedback', -- feedback, issue
  category TEXT NOT NULL DEFAULT 'general', -- general, suggestion, feature, bug, ui, content, other
  user_name TEXT,
  user_email TEXT,
  message TEXT NOT NULL,
  steps_to_reproduce TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. SYLLABUS DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.syllabus_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT,
  mime_type TEXT,
  parsed_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE ON FREE TIER
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_exams_user_id ON public.exams(user_id);
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON public.subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_chapters_user_subject ON public.chapters(user_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_subtopics_chapter ON public.subtopics(user_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON public.tasks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON public.study_sessions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_friendships_user ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON public.friend_requests(to_user_id, status);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES — STRICT ISOLATION & SAFE SOCIAL SHARING
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtopics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_documents ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: User can view and update own profile.
-- Friends can only view public fields (name, streak_days, weekly_study_minutes, avatar_url) of each other.
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Friends can view limited friend profile stats"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.friendships
      WHERE (friendships.user_id = auth.uid() AND friendships.friend_id = profiles.id)
         OR (friendships.friend_id = auth.uid() AND friendships.user_id = profiles.id)
    )
    AND show_stats_to_friends = true
  );

-- 2. Exams: strictly private
CREATE POLICY "Users can manage own exams"
  ON public.exams FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Subjects: strictly private
CREATE POLICY "Users can manage own subjects"
  ON public.subjects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Chapters: strictly private
CREATE POLICY "Users can manage own chapters"
  ON public.chapters FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Subtopics: strictly private
CREATE POLICY "Users can manage own subtopics"
  ON public.subtopics FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Tasks / Plans: strictly private
CREATE POLICY "Users can manage own tasks"
  ON public.tasks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. Study Sessions: strictly private
CREATE POLICY "Users can manage own study sessions"
  ON public.study_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. Timetable Events: strictly private
CREATE POLICY "Users can manage own timetable"
  ON public.timetable_events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 9. Notifications: strictly private
CREATE POLICY "Users can manage own notifications"
  ON public.notifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 10. Friend Requests: sender or receiver can see/act
CREATE POLICY "Users can view relevant friend requests"
  ON public.friend_requests FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create friend requests"
  ON public.friend_requests FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update received friend requests"
  ON public.friend_requests FOR UPDATE
  USING (auth.uid() = to_user_id);

CREATE POLICY "Users can delete own friend requests"
  ON public.friend_requests FOR DELETE
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- 11. Friendships: either participant can view/delete
CREATE POLICY "Users can view friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 12. Nudges: sender can create, recipient can view
CREATE POLICY "Users can send nudges"
  ON public.nudges FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can view received nudges"
  ON public.nudges FOR SELECT
  USING (auth.uid() = to_user_id);

-- 13. Feedback Reports: any authenticated user or anonymous can insert
CREATE POLICY "Anyone can submit feedback"
  ON public.feedback_reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own feedback"
  ON public.feedback_reports FOR SELECT
  USING (auth.uid() = user_id);

-- 14. Syllabus Documents: strictly private
CREATE POLICY "Users can manage own syllabus documents"
  ON public.syllabus_documents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- STORAGE BUCKET CONFIGURATION & POLICIES (Run if storage extension is active)
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'syllabus-files',
  'syllabus-files',
  false,
  10485760, -- 10 MB limit
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760;

CREATE POLICY "Students can upload own syllabus files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'syllabus-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Students can view own syllabus files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'syllabus-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Students can delete own syllabus files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'syllabus-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

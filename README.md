# PACE — Personalized Academic Planning & Execution

> **Know what to study. Every day.**

PACE is a full-stack, production-grade academic planning web application built to help Class 11, Class 12, JEE, NEET, and competitive exam students transform overwhelming syllabi into clear, calm, and adaptive daily study schedules.

---

## 💡 Product Philosophy & Core Idea

Preparing for high-stakes examinations is notoriously stressful. Students often waste hours deciding *what* to study next, creating impossible timetables, or giving up when a single missed day ruins a rigid schedule.

### *Simple on the outside. Smart underneath.*

PACE solves this by separating **curriculum organization** from **daily execution**:
1. **Students** get a distraction-free, elegant daily study checklist, focus timer, and progress tracker.
2. **The underlying system** handles syllabus hierarchy parsing, constraint satisfaction, deterministic schedule balancing, spaced revision timing, and adaptive rescheduling.

---

## 🎯 Key Engineering Decision: AI vs. Deterministic Logic

A foundational architectural decision in PACE is **not** delegating every task to a Large Language Model (LLM). Instead, the system strictly separates responsibility based on input characteristics:

```
┌──────────────────────────────────────────┐    ┌──────────────────────────────────────────┐
│      UNSTRUCTURED / AMBIGUOUS INPUT      │    │     STRUCTURED / PREDICTABLE LOGIC       │
│               (AI Domain)                │    │          (Deterministic Engine)          │
├──────────────────────────────────────────┤    ├──────────────────────────────────────────┤
│ • Messy syllabus PDFs & scan images      │    │ • Daily timetable generation             │
│ • Raw unstructured text copy-pastes      │    │ • Workload balancing across days         │
│ • Normalizing subject & chapter names    │    │ • Spaced revision interval calculation   │
├──────────────────────────────────────────┤    ├──────────────────────────────────────────┤
│ Tool: Google Gemini 3.6 Flash + Zod      │    │ Tool: Deterministic Scheduling Engine    │
└──────────────────────────────────────────┘    └──────────────────────────────────────────┘
```

### Why this hybrid architecture was chosen:
- **Predictability & Accuracy**: Scheduling requires exact mathematical precision against target exam dates and available minutes. LLMs frequently hallucinate dates or omit chapters.
- **Cost Efficiency**: AI is invoked **only once** during initial syllabus extraction. Once structured, dashboard views, task completions, and daily recalculations run with zero LLM API overhead.
- **Speed & Explainability**: The deterministic engine executes in under 5 milliseconds and provides clear, debuggable scheduling rationales.

---

## 🔄 AI Syllabus Pipeline

```
Unstructured Input (PDF / Image / Text)
                │
                ▼
   Text Extraction / OCR Parser
                │
                ▼
    Gemini 3.6 Flash Server-Side API
                │
                ▼
 Strict Schema Validation (Zod Type-Safety)
                │
                ▼
   Supabase PostgreSQL Persistence
                │
                ▼
  Interactive Student Review & Edits
                │
                ▼
   Deterministic Daily Planner Engine
```

### Server-Side Security & Key Protection
- The Gemini API calls execute strictly on the server (`/api/parse-syllabus` via Express or Vercel Serverless).
- API keys (`GEMINI_API_KEY`) are never exposed to the client bundle.
- Output payloads are strictly parsed using a Zod schema requiring valid `subjects` containing at least one `chapter` with difficulty ratings and estimated study durations.

---

## 🏗️ System Architecture

```
                                  ┌────────────────────────┐
                                  │    Student Browser     │
                                  │  (React 19 + Vite 6)   │
                                  └───────────┬────────────┘
                                              │
                     ┌────────────────────────┼────────────────────────┐
                     │                        │                        │
                     ▼                        ▼                        ▼
          ┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐
          │ Supabase Client    │   │ Express / Vercel   │   │ Planner Engine     │
          │ (Auth & Database)  │   │ Serverless API     │   │ (Deterministic)    │
          └──────────┬─────────┘   └──────────┬─────────┘   └──────────┬─────────┘
                     │                        │                        │
                     ▼                        ▼                        ▼
          ┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐
          │ PostgreSQL + RLS   │   │ Gemini 3.6 Flash   │   │ Daily Tasks &      │
          │ Database Storage   │   │ Resend Email API   │   │ Spaced Revisions   │
          └────────────────────┘   └────────────────────┘   └────────────────────┘
```

---

## 💻 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend UI** | React 19, TypeScript 5.8, Vite 6, TailwindCSS |
| **Icons & Motion** | Lucide React, Motion (Framer), Canvas Confetti |
| **Backend & API** | Node.js, Express 4, Vercel Serverless Functions (`@vercel/node`) |
| **AI Integration** | Google Gemini 3.6 Flash (`@google/genai`) |
| **Schema Validation** | Zod 4 |
| **Database & Auth** | Supabase (PostgreSQL with Row Level Security, GoTrue Auth) |
| **Email Delivery** | Resend API (`api.resend.com`) |
| **Testing** | Node / TSX Custom Unit Testing Framework |

---

## ✨ Key Product Features

### 📅 Deterministic & Adaptive Planner
- **Target Exam Countdown**: Dynamic status (`On Track`, `Ahead`, `Needs Focus`) computed from remaining total workload vs. days until exam.
- **Weekly Timetable Constraints**: Respects non-negotiable student commitments (e.g., coaching classes, school hours) per day of the week.
- **Adaptive Rescheduling**: Missed sessions or incomplete chapters are redistributed into future days without overwhelming the student.
- **Spaced Revision Trigger**: Completed chapters automatically generate spaced revision tasks at optimal intervals (1-day, 7-day, and 30-day reviews).

### 📚 Flexible Syllabus Management
- **Instant Starter Syllabi**: Zero-wait predefined templates for **Class 11 CBSE**, **Class 12 CBSE**, **JEE Main & Advanced (PCM)**, **NEET UG (PCB)**, **GATE CS**, and **Commerce**.
- **AI PDF / Scan Import**: Upload curriculum documents or paste syllabus text for automatic extraction into Subject → Chapter → Subtopic hierarchies.
- **Full Manual Control**: Add, rename, reorder, or adjust chapter difficulty ('easy', 'medium', 'hard') and time estimates.

### ⏱️ Focus Mode & Session Tracking
- **Interactive Timer**: Pomodoro or flexible custom countdown timer for distraction-free study.
- **Post-Session Reflection**: Quick difficulty rating ('easy', 'okay', 'hard') updates chapter confidence and fine-tunes future revision scheduling.
- **Streak & Hours Analytics**: Real-time tracking of current study streak, total study hours, and weekly progress.

### 👥 Study Circle (Social Accountability)
- **Real User Discovery**: Search registered students by name or email.
- **Robust 2-Step Friend Request Lifecycle**: Complete request → notification → accept/decline → reciprocal friendship database flow.
- **Privacy-First Sharing**: Students can toggle whether to share study statistics (streak days & weekly hours) with connected study buddies.
- **Encouragement Nudges**: Send single-tap study nudges to motivate classmates.

### 💬 In-App Feedback & Issue Reporting
- **In-App Submission Forms**: Direct in-app modals for feedback and bug reports without opening mailto links.
- **Resend Email Integration**: Structured HTML emails delivered to the product support inbox with safe technical metadata (user ID, current page, timestamp).
- **Supabase Backup Persistence**: All submissions are stored in `public.feedback_reports` to prevent data loss.

---

## 🗄️ Data Model Overview

The database schema is defined in [supabase/migrations/20260908000000_init_schema.sql](file:///c:/Users/mujah/Desktop/Projects/study%20planner/supabase/migrations/20260908000000_init_schema.sql):

- `auth.users`: Managed by Supabase Authentication.
- `public.profiles`: Student profile attributes (`name`, `email`, `avatar_url`, `streak_days`, `weekly_study_minutes`, `show_stats_to_friends`).
- `public.exams`: Active target exam name, target date, and accent color.
- `public.subjects`, `public.chapters`, `public.subtopics`: Relational hierarchy representing the student's curriculum.
- `public.study_sessions`: Log of completed study sessions with duration, notes, and feedback.
- `public.timetable_events`: Recurring daily commitments (school/coaching hours) reducing available study time.
- `public.notifications`: In-app system and social notifications.
- `public.friend_requests`: Pending, accepted, or declined friend requests between students.
- `public.friendships`: Reciprocal friendship bonds enabling social study circle views.
- `public.feedback_reports`: In-app user feedback and bug report submissions.

---

## 🔒 Security & Row Level Security (RLS)

Every table in the PostgreSQL database is protected with PostgreSQL **Row Level Security (RLS)** policies:

- **Isolated User Data**: `exams`, `subjects`, `chapters`, `subtopics`, `study_sessions`, `timetable_events`, and `notifications` restrict `SELECT`, `INSERT`, `UPDATE`, and `DELETE` exclusively to `auth.uid() = user_id`.
- **Public Profile Search**: Profiles are readable by authenticated users for search, but updates are restricted to `auth.uid() = id`.
- **Friend Request Scoping**: `friend_requests` allows reads and updates only if `auth.uid() = from_user_id OR auth.uid() = to_user_id`.
- **Friendship Reciprocity**: `friendships` allow insertion only when `auth.uid() = user_id OR auth.uid() = friend_id`.
- **Backend Key Isolation**: API keys (`GEMINI_API_KEY`, `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are maintained strictly in server-side environment variables and are never bundled into client JavaScript.

---

## 🧪 Automated Testing Suite

The repository contains a custom test suite covering core algorithm edge cases and schema validation rules.

Run tests using:
```bash
npm test
```

### Test Coverage Highlights:
1. **Planner Engine Tests** (`src/services/plannerEngine.test.ts`):
   - Balanced daily plan generation under normal workload.
   - Transition to "Needs Focus" / "Behind" when exam date is near.
   - Gentle redistribution of missed study sessions into future days.
   - Exclusion of completed chapters from initial study queues.
   - Spaced revision task inclusion.
   - Timetable commitment adjustments (e.g., weekday vs. weekend availability).
2. **AI Syllabus Parser Tests** (`src/services/aiSyllabusParser.test.ts`):
   - Faithfulness verification ensuring custom syllabi do not fallback to demo data.
   - Domain versatility (testing non-STEM curricula like Law).
   - Rejection of invalid payloads (empty subjects, zero-chapter subjects, missing names).

---

## 🚀 Deployment Architecture

PACE is optimized for production deployment on **Vercel** with a **Supabase** backend:

```
GitHub Repository ───> Vercel Deployment ───> Serverless API Endpoints + SPA Hosting
                             │
                             └───> Supabase Cloud Database (PostgreSQL + Auth)
```

### Key Environment Variables (`.env`)
```ini
# Server-side AI Key
GEMINI_API_KEY="your_gemini_api_key"

# Supabase Credentials
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# Email Delivery (Resend)
RESEND_API_KEY="re_your_resend_key"
SUPPORT_EMAIL="mujahidkalanthar@gmail.com"
```

---

## 📦 Local Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/MujahidKalanthar/PACE-study-planner.git
   cd PACE-study-planner
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your Gemini and Supabase API credentials.

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Run Production Build**:
   ```bash
   npm run build
   ```

---

## 🛣️ Product Roadmap (Future Improvements)

- [ ] **Mobile Native Packaging**: Wrap application using Capacitor for native iOS/Android App Store distribution.
- [ ] **External Calendar Sync**: Two-way synchronization with Google Calendar and Apple iCal for timetable events.
- [ ] **Multi-Language OCR**: Expand raw document extraction to support Hindi and regional language textbook scans.
- [ ] **Study Analytics Export**: PDF progress report export for parents and tutors.

---

<div align="center">
  <b>Built with care for students everywhere.</b><br/>
  <i>Personalized Academic Planning & Execution (PACE)</i>
</div>

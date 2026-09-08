import React, { useState } from 'react';
import { Sparkles, Calendar, BookOpen, Clock, ArrowRight, Check, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { addDays, formatDate } from '../services/plannerEngine';

export const OnboardingModal: React.FC = () => {
  const { showOnboarding, setShowOnboarding, completeOnboarding } = useApp();

  const [step, setStep] = useState(1);
  const [studentName, setStudentName] = useState('');
  const [examName, setExamName] = useState('');
  const [academicLevel, setAcademicLevel] = useState('');

  const todayStr = formatDate(new Date());
  const [examDate, setExamDate] = useState(addDays(todayStr, 60));
  const [dailyHours, setDailyHours] = useState(3); // 3 hours default

  if (!showOnboarding) return null;

  const popularExams = [
    'CBSE Class 12 Boards',
    'JEE Main & Advanced',
    'NEET UG',
    'GATE (Computer Science / Engg)',
    'CAT / Management Entrance',
    'UPSC Civil Services',
    'College Semester Finals',
    'Custom Exam / Goal',
  ];

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      completeOnboarding({
        name: studentName.trim() || 'Student',
        examName: examName.trim() || 'My Exam',
        examDate: examDate || addDays(todayStr, 60),
        dailyHours,
      });
    }
  };

  return (
    <div
      id="onboarding_modal"
      className="fixed inset-0 z-50 bg-[#111827]/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-[#1A1B1F] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden border border-[#E5E5E1] dark:border-[#2E3036] animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={() => setShowOnboarding(false)}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Close onboarding"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress Bar Dots */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === i
                  ? 'w-7 bg-[#4F46E5]'
                  : step > i
                  ? 'w-3 bg-indigo-200 dark:bg-indigo-900'
                  : 'w-3 bg-gray-200 dark:bg-gray-800'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Greeting & Name */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#4F46E5] dark:text-indigo-400">
                Welcome to PACE
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-light text-[#111827] dark:text-white tracking-tight">
                Let's set up your study plan.
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-normal">
                PACE turns your syllabus into a calm, automated daily study roadmap.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  What's your name?
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white focus:border-[#4F46E5] focus:outline-none text-xs sm:text-sm"
                  placeholder="e.g. Arjun"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Academic Level / Class (Optional)
                </label>
                <input
                  type="text"
                  value={academicLevel}
                  onChange={(e) => setAcademicLevel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white focus:border-[#4F46E5] focus:outline-none text-xs sm:text-sm"
                  placeholder="e.g. Class 12, Dropper, 3rd Year College, Self-Taught"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Exam Name */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#4F46E5] dark:text-indigo-400">
                Target Exam & Goal
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-light text-[#111827] dark:text-white tracking-tight">
                What are you preparing for?
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-normal">
                Type your exam or select a popular target below.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="Enter exam name (e.g. NEET 2026, GATE CS, CBSE Boards)..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white focus:border-[#4F46E5] focus:outline-none text-xs sm:text-sm font-medium"
                autoFocus
              />

              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Suggestions:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  {popularExams.map((examOpt) => (
                    <button
                      key={examOpt}
                      type="button"
                      onClick={() => setExamName(examOpt)}
                      className={`px-3 py-1.5 rounded-xl text-xs border transition-all ${
                        examName === examOpt
                          ? 'border-[#4F46E5] bg-indigo-50/60 dark:bg-indigo-950/40 text-[#4F46E5] dark:text-indigo-300 font-semibold'
                          : 'border-[#E5E5E1] dark:border-[#2E3036] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {examOpt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Exam Target Date */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#4F46E5] dark:text-indigo-400">
                Target Date
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-light text-[#111827] dark:text-white tracking-tight">
                When is your exam?
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-normal">
                PACE schedules your chapters and spaced revisions to comfortably complete before this date.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white font-medium focus:border-[#4F46E5] focus:outline-none"
              />

              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: 'In 30 days', days: 30 },
                  { label: 'In 60 days', days: 60 },
                  { label: 'In 90 days', days: 90 },
                  { label: 'In 180 days', days: 180 },
                ].map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => setExamDate(addDays(todayStr, preset.days))}
                    className="px-3.5 py-1.5 rounded-full border border-[#E5E5E1] dark:border-[#2E3036] text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Daily Study Hours */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#4F46E5] dark:text-indigo-400">
                Daily Study Goal
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-light text-[#111827] dark:text-white tracking-tight">
                How many hours can you study daily?
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-normal">
                Realistic, consistent daily effort beats cramming every single time.
              </p>
            </div>

            <div className="space-y-4 pt-4 text-center">
              <div className="text-4xl font-serif font-light text-[#111827] dark:text-white">
                {dailyHours} hours / day
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={dailyHours}
                onChange={(e) => setDailyHours(Number(e.target.value))}
                className="w-full accent-[#4F46E5]"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                (~{Math.round(dailyHours * 60)} minutes of self-study scheduled per day)
              </p>
            </div>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E5E5E1] dark:border-[#2E3036]">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-[#111827] dark:hover:text-white transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2.5 rounded-full bg-[#4F46E5] hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span>{step === 4 ? 'Create My Plan' : 'Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

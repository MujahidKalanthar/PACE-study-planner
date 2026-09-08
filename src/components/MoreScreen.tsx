import React, { useState } from 'react';
import {
  User,
  Calendar,
  Clock,
  Bell,
  Settings,
  Plus,
  Trash2,
  Check,
  Moon,
  Sun,
  Laptop,
  Shield,
  AlertTriangle,
  LogIn,
  LogOut,
  Sparkles,
  Volume2,
  VolumeX,
  Sliders,
  Download,
  Upload,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TimetableSlot, Exam } from '../types';

export const MoreScreen: React.FC = () => {
  const {
    profile,
    updateProfile,
    exam,
    setExam,
    timetable,
    addTimetableSlot,
    deleteTimetableSlot,
    clearAllData,
    setShowOnboarding,
    setShowSyllabusImport,
    setTheme,
    authUser,
    setShowAuthModal,
    signOut,
  } = useApp();

  // Commitment form state
  const [showAddCommitment, setShowAddCommitment] = useState(false);
  const [newCommitTitle, setNewCommitTitle] = useState('');
  const [newCommitStart, setNewCommitStart] = useState('08:00');
  const [newCommitEnd, setNewCommitEnd] = useState('14:00');
  const [newCommitDays, setNewCommitDays] = useState<number[]>([1, 2, 3, 4, 5]);

  // Exam editor state
  const [isEditingExam, setIsEditingExam] = useState(false);
  const [examNameInput, setExamNameInput] = useState(exam?.name || '');
  const [examDateInput, setExamDateInput] = useState(exam?.targetDate || '');
  const [examColorInput, setExamColorInput] = useState(exam?.color || '#3B82F6');

  // Confirmation modal for clear data
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const flashMessage = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleCreateCommitment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommitTitle.trim()) return;

    addTimetableSlot({
      title: newCommitTitle.trim(),
      days: newCommitDays,
      startTime: newCommitStart,
      endTime: newCommitEnd,
      category: 'school',
    });

    setNewCommitTitle('');
    setShowAddCommitment(false);
    flashMessage('Commitment saved!');
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examNameInput.trim() || !examDateInput) return;

    setExam({
      name: examNameInput.trim(),
      targetDate: examDateInput,
      color: examColorInput,
    });
    setIsEditingExam(false);
    flashMessage('Exam target updated!');
  };

  const handleExportData = () => {
    try {
      const dataStr = localStorage.getItem('pace_student_data_v3');
      if (!dataStr) return;
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pace_study_data_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      flashMessage('Data backup downloaded successfully.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed) {
          localStorage.setItem('pace_student_data_v3', JSON.stringify(parsed));
          window.location.reload();
        }
      } catch (err) {
        alert('Invalid JSON file format. Could not restore backup.');
      }
    };
    reader.readAsText(file);
  };

  const toggleDay = (d: number) => {
    if (newCommitDays.includes(d)) {
      setNewCommitDays(newCommitDays.filter((x) => x !== d));
    } else {
      setNewCommitDays([...newCommitDays, d].sort());
    }
  };

  const currentTheme = profile.theme || 'light';
  const currentSound = profile.preferredSound || 'off';
  const currentSessionMin = profile.defaultSessionMinutes || 45;
  const currentRevisionPreset = profile.revisionIntervalPreset || 'standard';

  return (
    <div id="more_screen" className="max-w-3xl mx-auto space-y-8 pb-24 md:pb-12 pt-2">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-serif font-light tracking-tight text-[#111827] dark:text-white mb-1">
          Preferences & Settings
        </h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-normal">
          Customize your study environment, focus timer, routine timetable, and planner engine
        </p>
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* 1. Theme Appearance Selection */}
      <section className="bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-3xl p-6 sm:p-7 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#4F46E5] dark:text-indigo-400" />
          <h2 className="text-xl font-serif font-light text-[#111827] dark:text-white">
            Appearance
          </h2>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Visual theme designed for comfortable long-duration studying day or night.
        </p>

        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
              currentTheme === 'light'
                ? 'border-[#4F46E5] bg-indigo-50/50 dark:bg-indigo-950/40 text-[#4F46E5] font-semibold'
                : 'border-[#E5E5E1] dark:border-[#2E3036] text-gray-600 dark:text-gray-400 hover:border-gray-400'
            }`}
          >
            <Sun className="w-5 h-5" />
            <span className="text-xs">Light Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
              currentTheme === 'dark'
                ? 'border-[#4F46E5] bg-indigo-50/50 dark:bg-indigo-950/40 text-[#4F46E5] font-semibold'
                : 'border-[#E5E5E1] dark:border-[#2E3036] text-gray-600 dark:text-gray-400 hover:border-gray-400'
            }`}
          >
            <Moon className="w-5 h-5" />
            <span className="text-xs">Dark Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
              currentTheme === 'system'
                ? 'border-[#4F46E5] bg-indigo-50/50 dark:bg-indigo-950/40 text-[#4F46E5] font-semibold'
                : 'border-[#E5E5E1] dark:border-[#2E3036] text-gray-600 dark:text-gray-400 hover:border-gray-400'
            }`}
          >
            <Laptop className="w-5 h-5" />
            <span className="text-xs">System</span>
          </button>
        </div>
      </section>

      {/* 2. Target Exam & Date Configuration */}
      <section className="bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-3xl p-6 sm:p-7 space-y-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#4F46E5] dark:text-indigo-400" />
            <h2 className="text-xl font-serif font-light text-[#111827] dark:text-white">
              Target Exam & Deadline
            </h2>
          </div>
          {exam && !isEditingExam && (
            <button
              onClick={() => {
                setExamNameInput(exam.name);
                setExamDateInput(exam.targetDate);
                setExamColorInput(exam.color || '#3B82F6');
                setIsEditingExam(true);
              }}
              className="text-xs font-semibold text-[#4F46E5] dark:text-indigo-400 hover:underline"
            >
              Edit Target
            </button>
          )}
        </div>

        {exam && !isEditingExam ? (
          <div className="p-4 rounded-2xl border border-[#E5E5E1] dark:border-[#2E3036] bg-gray-50/50 dark:bg-[#141518]/50 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: exam.color || '#3B82F6' }}
                />
                <h4 className="text-sm font-semibold text-[#111827] dark:text-white">
                  {exam.name}
                </h4>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Target Date: {new Date(exam.targetDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <button
              onClick={() => setExam(null)}
              className="text-xs text-rose-500 hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveExam} className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
              {exam ? 'Update Target Exam' : 'Set Your Target Exam'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Exam / Goal Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CBSE Boards, JEE, NEET, Semester Finals"
                  value={examNameInput}
                  onChange={(e) => setExamNameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141518] text-[#111827] dark:text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Exam Target Date
                </label>
                <input
                  type="date"
                  required
                  value={examDateInput}
                  onChange={(e) => setExamDateInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141518] text-[#111827] dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              {exam && (
                <button
                  type="button"
                  onClick={() => setIsEditingExam(false)}
                  className="px-3.5 py-1.5 text-xs text-gray-500"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#4F46E5] text-white text-xs font-semibold rounded-xl"
              >
                Save Exam Target
              </button>
            </div>
          </form>
        )}
      </section>

      {/* 3. Student Profile & Cloud Sync */}
      <section className="bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-3xl p-6 sm:p-7 space-y-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#4F46E5] dark:text-indigo-400" />
            <h2 className="text-xl font-serif font-light text-[#111827] dark:text-white">
              Student Profile
            </h2>
          </div>

          <button
            onClick={() => setShowAuthModal(true)}
            className="text-xs font-semibold text-[#4F46E5] dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            {authUser ? (
              <span>Account & Sync</span>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Sync</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div className="space-y-1">
            <label className="font-semibold text-gray-700 dark:text-gray-300">Student Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => updateProfile({ name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white focus:border-[#4F46E5] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-gray-700 dark:text-gray-300">Academic / Target Level</label>
            <input
              type="text"
              placeholder="e.g. Class 12, Dropper, College, Self-Taught"
              value={profile.classLevel || ''}
              onChange={(e) => updateProfile({ classLevel: e.target.value as any })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white focus:border-[#4F46E5] focus:outline-none"
            />
          </div>
        </div>

        {authUser && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
            <span>Signed in as <strong>{authUser.email}</strong></span>
            <button
              onClick={() => signOut()}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </section>

      {/* 4. Study & Focus Timer Preferences */}
      <section className="bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-3xl p-6 sm:p-7 space-y-5 shadow-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#4F46E5] dark:text-indigo-400" />
          <h2 className="text-xl font-serif font-light text-[#111827] dark:text-white">
            Focus Timer & Ambient Sound
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Default Session Length */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
              Default Session Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[25, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => updateProfile({ defaultSessionMinutes: mins })}
                  className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                    currentSessionMin === mins
                      ? 'border-[#4F46E5] bg-indigo-50/50 dark:bg-indigo-950/40 text-[#4F46E5] dark:text-indigo-300 font-semibold'
                      : 'border-[#E5E5E1] dark:border-[#2E3036] text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Ambient Focus Sound */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
              Ambient Focus Audio
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'off', label: 'Mute' },
                { id: 'rain', label: 'Rain' },
                { id: 'brown', label: 'Brown' },
                { id: 'binaural', label: 'Binaural' },
              ].map((snd) => (
                <button
                  key={snd.id}
                  type="button"
                  onClick={() => updateProfile({ preferredSound: snd.id as any })}
                  className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                    currentSound === snd.id
                      ? 'border-[#4F46E5] bg-indigo-50/50 dark:bg-indigo-950/40 text-[#4F46E5] dark:text-indigo-300 font-semibold'
                      : 'border-[#E5E5E1] dark:border-[#2E3036] text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {snd.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Daily Study Target & Planner Engine */}
      <section className="bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-3xl p-6 sm:p-7 space-y-6 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#4F46E5] dark:text-indigo-400" />
            <h2 className="text-xl font-serif font-light text-[#111827] dark:text-white">
              Planner & Spaced Revision
            </h2>
          </div>
          <span className="text-xl font-serif text-[#111827] dark:text-white">
            {(profile.dailyStudyMinutes / 60).toFixed(1)} hrs / day
          </span>
        </div>

        {/* Daily Target Hours Slider */}
        <div className="space-y-3">
          <input
            type="range"
            min={1}
            max={12}
            step={0.5}
            value={profile.dailyStudyMinutes / 60}
            onChange={(e) =>
              updateProfile({ dailyStudyMinutes: Math.round(Number(e.target.value) * 60) })
            }
            className="w-full accent-[#4F46E5]"
          />
          <div className="flex justify-between text-xs text-gray-400 font-medium">
            <span>1 hour</span>
            <span>2.5 hours</span>
            <span>5 hours</span>
            <span>8+ hours</span>
          </div>
        </div>

        {/* Engine Toggles */}
        <div className="space-y-4 pt-2 border-t border-[#E5E5E1] dark:border-[#2E3036]">
          {/* Auto adjust */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-[#111827] dark:text-white">
                Auto-Adjust Missed Study Sessions
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Automatically redistribute unstudied tasks across upcoming days without stress
              </p>
            </div>
            <input
              type="checkbox"
              checked={profile.autoAdjustPlan}
              onChange={(e) => updateProfile({ autoAdjustPlan: e.target.checked })}
              className="w-4 h-4 accent-[#4F46E5] rounded cursor-pointer"
            />
          </div>

          {/* Auto schedule revisions */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-[#111827] dark:text-white">
                Auto-Schedule Spaced Revisions
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Automatically insert recall check sessions on 1-3-7-15-30 day intervals
              </p>
            </div>
            <input
              type="checkbox"
              checked={profile.autoScheduleRevisions}
              onChange={(e) => updateProfile({ autoScheduleRevisions: e.target.checked })}
              className="w-4 h-4 accent-[#4F46E5] rounded cursor-pointer"
            />
          </div>

          {/* Revision interval preset */}
          {profile.autoScheduleRevisions && (
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Spaced Revision Cadence
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'frequent', label: 'Aggressive (1, 2, 4, 7d)' },
                  { id: 'standard', label: 'Standard (1, 3, 7, 15, 30d)' },
                  { id: 'relaxed', label: 'Relaxed (2, 5, 10, 20d)' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => updateProfile({ revisionIntervalPreset: preset.id as any })}
                    className={`py-2 px-2 text-center rounded-xl text-xs font-medium border transition-all ${
                      currentRevisionPreset === preset.id
                        ? 'border-[#4F46E5] bg-indigo-50/50 dark:bg-indigo-950/40 text-[#4F46E5] dark:text-indigo-300 font-semibold'
                        : 'border-[#E5E5E1] dark:border-[#2E3036] text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 6. Fixed Routine Timetable Commitments */}
      <section className="bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-3xl p-6 sm:p-7 space-y-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif font-light text-[#111827] dark:text-white">
              Fixed Timetable Commitments
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              School, coaching, tuition, or college hours blocked from study scheduling
            </p>
          </div>
          <button
            onClick={() => setShowAddCommitment(true)}
            className="text-xs font-semibold text-[#4F46E5] dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Slot</span>
          </button>
        </div>

        {timetable.length === 0 && !showAddCommitment && (
          <div className="p-4 rounded-2xl border border-dashed border-[#E5E5E1] dark:border-[#2E3036] text-center text-xs text-gray-400">
            No fixed commitments added yet. Add school or coaching hours to balance your daily study load.
          </div>
        )}

        <div className="space-y-2.5">
          {timetable.map((slot) => (
            <div
              key={slot.id}
              className="p-4 rounded-2xl border border-[#E5E5E1] dark:border-[#2E3036] bg-gray-50/50 dark:bg-[#141518]/50 flex items-center justify-between gap-3"
            >
              <div>
                <h4 className="text-sm font-semibold text-[#111827] dark:text-white">
                  {slot.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {slot.startTime} - {slot.endTime} • {slot.days.map((d) => dayNames[d]).join(', ')}
                </p>
              </div>
              <button
                onClick={() => deleteTimetableSlot(slot.id)}
                className="text-gray-400 hover:text-rose-500 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add commitment form */}
        {showAddCommitment && (
          <form
            onSubmit={handleCreateCommitment}
            className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-3"
          >
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
              New Routine Commitment
            </h4>
            <div className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="e.g. School or Coaching Timings"
                value={newCommitTitle}
                onChange={(e) => setNewCommitTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141518] text-[#111827] dark:text-white"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newCommitStart}
                    onChange={(e) => setNewCommitStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141518] text-[#111827] dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">End Time</label>
                  <input
                    type="time"
                    value={newCommitEnd}
                    onChange={(e) => setNewCommitEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141518] text-[#111827] dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-gray-500 block mb-1">Active Days</label>
                <div className="flex gap-1.5 flex-wrap">
                  {dayNames.map((name, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        newCommitDays.includes(i)
                          ? 'bg-[#4F46E5] text-white'
                          : 'bg-white dark:bg-[#141518] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCommitment(false)}
                className="px-3 py-1.5 text-xs text-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#4F46E5] text-white text-xs font-semibold rounded-xl"
              >
                Save Commitment
              </button>
            </div>
          </form>
        )}
      </section>

      {/* 7. Notification Preferences */}
      <section className="bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-3xl p-6 sm:p-7 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#4F46E5] dark:text-indigo-400" />
          <h2 className="text-xl font-serif font-light text-[#111827] dark:text-white">
            Notification Categories
          </h2>
        </div>

        <div className="space-y-3.5 text-xs sm:text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Daily Morning Study Plan</span>
            <input
              type="checkbox"
              checked={profile.notifications?.dailyMorningPlan ?? true}
              onChange={(e) =>
                updateProfile({
                  notifications: {
                    ...profile.notifications,
                    dailyMorningPlan: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 accent-[#4F46E5] rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Evening Study Progress Review</span>
            <input
              type="checkbox"
              checked={profile.notifications?.eveningReview ?? true}
              onChange={(e) =>
                updateProfile({
                  notifications: {
                    ...profile.notifications,
                    eveningReview: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 accent-[#4F46E5] rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Spaced Revision Reminders</span>
            <input
              type="checkbox"
              checked={profile.notifications?.revisionAlerts ?? true}
              onChange={(e) =>
                updateProfile({
                  notifications: {
                    ...profile.notifications,
                    revisionAlerts: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 accent-[#4F46E5] rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Exam Countdown Milestones</span>
            <input
              type="checkbox"
              checked={profile.notifications?.examAlerts ?? true}
              onChange={(e) =>
                updateProfile({
                  notifications: {
                    ...profile.notifications,
                    examAlerts: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 accent-[#4F46E5] rounded cursor-pointer"
            />
          </div>
        </div>
      </section>

      {/* 8. Privacy & Social */}
      <section className="bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-3xl p-6 sm:p-7 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#4F46E5] dark:text-indigo-400" />
          <h2 className="text-xl font-serif font-light text-[#111827] dark:text-white">
            Privacy & Circle Sharing
          </h2>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-[#111827] dark:text-white">
              Share Streak & Weekly Time with Study Circle
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Allows approved friends to see your daily streak and total weekly hours for mutual motivation
            </p>
          </div>
          <input
            type="checkbox"
            checked={profile.showStatsToFriends ?? true}
            onChange={(e) => updateProfile({ showStatsToFriends: e.target.checked })}
            className="w-4 h-4 accent-[#4F46E5] rounded cursor-pointer"
          />
        </div>
      </section>

      {/* 9. Data Backup & Reset */}
      <section className="p-6 sm:p-7 border border-[#E5E5E1] dark:border-[#2E3036] rounded-3xl space-y-4 bg-white dark:bg-[#1A1B1F]">
        <h3 className="text-sm font-semibold text-[#111827] dark:text-white">Data Management</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          Export your syllabus, session logs, and settings to a JSON file, or start fresh.
        </p>
        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            onClick={handleExportData}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Backup (JSON)</span>
          </button>

          <label className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Restore Backup</span>
            <input
              type="file"
              accept="application/json"
              onChange={handleImportData}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-2 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Data</span>
          </button>
        </div>
      </section>

      {/* Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-[#111827]/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1B1F] rounded-3xl max-w-sm w-full p-6 space-y-4 border border-[#E5E5E1] dark:border-[#2E3036] shadow-2xl">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-lg font-serif font-light text-[#111827] dark:text-white">
                Clear All Data?
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              This will reset your entire syllabus, exams, study logs, and timetable. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-2 text-xs text-gray-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllData();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
              >
                Yes, Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

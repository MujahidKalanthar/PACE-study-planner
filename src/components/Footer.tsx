import React, { useState } from 'react';
import { MessageSquare, AlertCircle, ShieldCheck, FileText, Heart, Sparkles, Check, X, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Footer: React.FC = () => {
  const [activeModal, setActiveModal] = useState<'feedback' | 'issue' | 'privacy' | 'terms' | null>(null);

  return (
    <>
      <footer className="w-full border-t border-[#E5E5E1] dark:border-[#2E3036] bg-transparent mt-auto transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400">
          {/* Left: Branding & Copyright */}
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-center sm:text-left">
            <span className="font-semibold text-gray-700 dark:text-gray-300 tracking-tight">
              © 2026 PACE
            </span>
            <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              Personalized Academic Planning & Execution
            </span>
            <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
            <span className="text-[11px] text-indigo-600/80 dark:text-indigo-400/80 font-medium">
              A MK Project
            </span>
          </div>

          {/* Right: Functional Secondary Links */}
          <nav className="flex items-center flex-wrap justify-center gap-3 sm:gap-4 text-xs font-medium">
            <button
              id="footer_btn_feedback"
              onClick={() => setActiveModal('feedback')}
              className="text-gray-500 dark:text-gray-400 hover:text-[#4F46E5] dark:hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Feedback</span>
            </button>

            <span className="text-gray-300 dark:text-gray-700">•</span>

            <button
              id="footer_btn_issue"
              onClick={() => setActiveModal('issue')}
              className="text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Report an issue</span>
            </button>

            <span className="text-gray-300 dark:text-gray-700">•</span>

            <button
              id="footer_btn_privacy"
              onClick={() => setActiveModal('privacy')}
              className="text-gray-500 dark:text-gray-400 hover:text-[#4F46E5] dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              Privacy
            </button>

            <span className="text-gray-300 dark:text-gray-700">•</span>

            <button
              id="footer_btn_terms"
              onClick={() => setActiveModal('terms')}
              className="text-gray-500 dark:text-gray-400 hover:text-[#4F46E5] dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              Terms
            </button>
          </nav>
        </div>
      </footer>

      {/* Dynamic Modals for Feedback, Report Issue, Privacy, and Terms */}
      {activeModal && (
        <FooterModal type={activeModal} onClose={() => setActiveModal(null)} />
      )}
    </>
  );
};

interface FooterModalProps {
  type: 'feedback' | 'issue' | 'privacy' | 'terms';
  onClose: () => void;
}

const FooterModal: React.FC<FooterModalProps> = ({ type, onClose }) => {
  const { authUser, profile } = useApp();

  const [feedbackCategory, setFeedbackCategory] = useState<string>('Feature suggestion');
  const [issueCategory, setIssueCategory] = useState<string>('Bug / Crash');
  const [senderName, setSenderName] = useState(authUser?.name || profile.name || '');
  const [senderEmail, setSenderEmail] = useState(authUser?.email || '');
  const [currentPage, setCurrentPage] = useState<string>(
    typeof window !== 'undefined' ? `${window.location.pathname}${window.location.hash || ''}` : 'Dashboard'
  );
  const [message, setMessage] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: type === 'feedback' ? 'feedback' : 'issue',
          category: type === 'feedback' ? feedbackCategory : issueCategory,
          name: senderName.trim(),
          email: senderEmail.trim(),
          message: message.trim(),
          stepsToReproduce: stepsToReproduce.trim(),
          currentPage: currentPage.trim(),
          userId: authUser?.id || null,
          metadata: {
            timestamp: new Date().toISOString(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
            appVersion: '1.0.0'
          }
        }),
      });

      const resData = await res.json().catch(() => ({}));

      if (res.ok && resData.success !== false) {
        setIsSuccess(true);
      } else {
        setErrorMsg(resData.error || 'Failed to send submission. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg('Network error. Unable to contact submission server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="footer_modal_backdrop"
      className="fixed inset-0 z-50 bg-[#111827]/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-[#1A1B1F] rounded-3xl max-w-lg w-full max-h-[88vh] flex flex-col p-6 sm:p-7 shadow-2xl relative border border-[#E5E5E1] dark:border-[#2E3036] animate-in zoom-in-95 duration-200 text-[#1A1A1A] dark:text-[#F3F4F6]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E5E1] dark:border-[#2E3036] pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            {type === 'feedback' && <MessageSquare className="w-5 h-5 text-[#4F46E5] dark:text-indigo-400" />}
            {type === 'issue' && <AlertCircle className="w-5 h-5 text-rose-500" />}
            {type === 'privacy' && <ShieldCheck className="w-5 h-5 text-emerald-500" />}
            {type === 'terms' && <FileText className="w-5 h-5 text-[#4F46E5] dark:text-indigo-400" />}
            <h3 className="text-xl font-serif font-light text-[#111827] dark:text-white">
              {type === 'feedback' && 'Share Feedback & Suggestions'}
              {type === 'issue' && 'Report an Issue'}
              {type === 'privacy' && 'Privacy Policy'}
              {type === 'terms' && 'Terms of Service'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. FEEDBACK FORM */}
          {type === 'feedback' && (
            isSuccess ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="text-lg font-serif font-light text-[#111827] dark:text-white">
                  Thank you for your feedback!
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                  Your feedback has been delivered to our support team and recorded.
                </p>
                <button
                  onClick={onClose}
                  className="mt-2 px-5 py-2 rounded-xl bg-[#4F46E5] text-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Have ideas to make daily studying simpler? Select a category and share your thoughts.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Category</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      'General feedback',
                      'Feature suggestion',
                      "Something isn't working",
                      'Other'
                    ].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFeedbackCategory(cat)}
                        className={`py-2 px-1 rounded-xl text-[11px] font-medium border text-center transition-all ${
                          feedbackCategory === cat
                            ? 'border-[#4F46E5] bg-indigo-50/70 dark:bg-indigo-950/50 text-[#4F46E5] dark:text-indigo-300 font-semibold'
                            : 'border-[#E5E5E1] dark:border-[#2E3036] text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700 dark:text-gray-300">Name (optional)</label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700 dark:text-gray-300">Email (optional)</label>
                    <input
                      type="email"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Your Message / Suggestion *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what's on your mind..."
                    className="w-full p-3 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white text-xs leading-relaxed focus:border-[#4F46E5] focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !message.trim()}
                    className="px-5 py-2 bg-[#4F46E5] hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Submit Feedback</span>
                    )}
                  </button>
                </div>
              </form>
            )
          )}

          {/* 2. REPORT AN ISSUE FORM */}
          {type === 'issue' && (
            isSuccess ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="text-lg font-serif font-light text-[#111827] dark:text-white">
                  Issue report received
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                  Your issue report has been delivered to support and recorded. We will review it shortly.
                </p>
                <button
                  onClick={onClose}
                  className="mt-2 px-5 py-2 rounded-xl bg-[#4F46E5] text-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Encountered a glitch, syllabus error, or timer issue? Let us know so we can fix it.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Issue Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {[
                      'Bug / Crash',
                      'Syllabus Error',
                      'UI Glitch',
                      'Performance',
                      'Other'
                    ].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setIssueCategory(cat)}
                        className={`py-2 px-1 rounded-xl text-[11px] font-medium border text-center transition-all ${
                          issueCategory === cat
                            ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-semibold'
                            : 'border-[#E5E5E1] dark:border-[#2E3036] text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe what went wrong..."
                    className="w-full p-3 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white text-xs leading-relaxed focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700 dark:text-gray-300">Page / Feature where issue occurred</label>
                    <input
                      type="text"
                      value={currentPage}
                      onChange={(e) => setCurrentPage(e.target.value)}
                      placeholder="e.g. Import -> Starter Syllabi"
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700 dark:text-gray-300">Contact Email (optional)</label>
                    <input
                      type="email"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Steps to reproduce (optional)
                  </label>
                  <input
                    type="text"
                    value={stepsToReproduce}
                    onChange={(e) => setStepsToReproduce(e.target.value)}
                    placeholder="e.g. Opened Focus mode -> Clicked +5m -> Timer paused"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !message.trim()}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Send Report</span>
                    )}
                  </button>
                </div>
              </form>
            )
          )}

          {/* 3. PRIVACY POLICY */}
          {type === 'privacy' && (
            <div className="space-y-3.5 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl text-emerald-900 dark:text-emerald-200 space-y-1">
                <span className="font-bold block">Student Data Guarantee:</span>
                <span>We never sell your academic data or track personal browsing. Your study history belongs exclusively to you.</span>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-gray-800 dark:text-white text-xs">1. What We Store</h4>
                <p>
                  PACE stores your target exam dates, chapter progress, study session durations, and timetable commitments to generate your personalized daily study schedule.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-gray-800 dark:text-white text-xs">2. Row Level Security & Friend Isolation</h4>
                <p>
                  All database tables are guarded with PostgreSQL Row Level Security (RLS). Friends in your study circle can only see your display name, avatar, day streak, and total weekly hours. Your detailed chapters, tasks, and private notes are strictly isolated.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-gray-800 dark:text-white text-xs">3. AI Processing</h4>
                <p>
                  Syllabus extraction files (PDFs/images/text) are parsed in memory solely for curriculum structuring and are not used to train public machine learning models.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-gray-800 dark:text-white text-xs">4. Data Deletion</h4>
                <p>
                  You can clear your local data at any time via Settings → Clear All Data or delete your synchronized account.
                </p>
              </div>
            </div>
          )}

          {/* 4. TERMS OF SERVICE */}
          {type === 'terms' && (
            <div className="space-y-3.5 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              <div className="space-y-1">
                <h4 className="font-bold text-gray-800 dark:text-white text-xs">1. Purpose</h4>
                <p>
                  PACE (Personalized Academic Planning & Execution) is an intelligent study planning companion built to help Class 11 and Class 12 students organize their exam preparations with calm consistency.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-gray-800 dark:text-white text-xs">2. User Responsibility</h4>
                <p>
                  Students are responsible for maintaining accurate exam dates and syllabus expectations. PACE acts as an adaptive assistant; students always retain full manual control to add, edit, or remove chapters and tasks.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-gray-800 dark:text-white text-xs">3. Fair Use & Study Circles</h4>
                <p>
                  The Study Circle feature is intended for positive student motivation and friendly accountability. Harassment, spam nudges, or misuse of social features is prohibited.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-gray-800 dark:text-white text-xs">4. Service Availability</h4>
                <p>
                  PACE is provided free of charge for students. While we strive for high uptime and offline resilience, students should retain primary copies of official exam schedules.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer (for Privacy/Terms) */}
        {(type === 'privacy' || type === 'terms') && (
          <div className="pt-3 mt-3 border-t border-[#E5E5E1] dark:border-[#2E3036] flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#4F46E5] text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Understood
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

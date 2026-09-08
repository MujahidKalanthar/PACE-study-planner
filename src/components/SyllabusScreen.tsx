import React, { useState } from 'react';
import {
  Check,
  Clock,
  Plus,
  RotateCw,
  Upload,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit3,
  X,
  BookOpen,
  Play,
  ListChecks,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Chapter, ChapterDifficulty, ChapterStatus, Subtopic, Subject } from '../types';

export const SyllabusScreen: React.FC = () => {
  const {
    subjects,
    chapters,
    setShowSyllabusImport,
    addSubject,
    updateSubject,
    deleteSubject,
    updateChapter,
    addChapter,
    deleteChapter,
    addSubtopic,
    updateSubtopic,
    deleteSubtopic,
    toggleSubtopicComplete,
    startStudy,
  } = useApp();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    subjects[0]?.id || ''
  );
  const [expandedChapterIds, setExpandedChapterIds] = useState<Set<string>>(new Set());

  // Subject Modal states
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectNameInput, setSubjectNameInput] = useState('');
  const [subjectColorInput, setSubjectColorInput] = useState('#3B82F6');

  // Chapter Modal states
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [newChapterName, setNewChapterName] = useState('');
  const [newChapterDifficulty, setNewChapterDifficulty] = useState<ChapterDifficulty>('medium');
  const [newChapterMinutes, setNewChapterMinutes] = useState(45);
  const [newChapterSubtopics, setNewChapterSubtopics] = useState('');

  // Subtopic Modal/Inline states
  const [addingSubtopicForChId, setAddingSubtopicForChId] = useState<string | null>(null);
  const [newSubtopicName, setNewSubtopicName] = useState('');
  const [newSubtopicMinutes, setNewSubtopicMinutes] = useState(20);
  const [editingSubtopic, setEditingSubtopic] = useState<{ chapterId: string; subtopic: Subtopic } | null>(null);

  const activeSubjectId =
    selectedSubjectId && subjects.some((s) => s.id === selectedSubjectId)
      ? selectedSubjectId
      : subjects[0]?.id || '';

  const currentSubject = subjects.find((s) => s.id === activeSubjectId);

  const subjectChapters = chapters.filter(
    (c) => c.subjectId === currentSubject?.id
  );

  const completedCount = subjectChapters.filter(
    (c) => c.status === 'completed'
  ).length;
  const totalCount = subjectChapters.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const allSubtopics = subjectChapters.flatMap((c) => c.subtopics || []);
  const completedSubtopics = allSubtopics.filter((st) => st.completed).length;

  const palette = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#6366F1'];

  const toggleChapterExpand = (chId: string) => {
    setExpandedChapterIds((prev) => {
      const next = new Set(prev);
      if (next.has(chId)) next.delete(chId);
      else next.add(chId);
      return next;
    });
  };

  const handleStatusCycle = (chapter: Chapter) => {
    let nextStatus: ChapterStatus = 'not_started';
    if (chapter.status === 'not_started') nextStatus = 'in_progress';
    else if (chapter.status === 'in_progress') nextStatus = 'completed';
    else nextStatus = 'not_started';

    const updatedSubs = (chapter.subtopics || []).map((st) => ({
      ...st,
      completed: nextStatus === 'completed',
      completedDate: nextStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined,
    }));

    updateChapter(chapter.id, {
      status: nextStatus,
      completedDate: nextStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined,
      subtopics: updatedSubs,
    });
  };

  // Subject Handlers
  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectNameInput.trim()) return;

    if (editingSubject) {
      updateSubject(editingSubject.id, {
        name: subjectNameInput.trim(),
        color: subjectColorInput,
      });
      setEditingSubject(null);
    } else {
      addSubject(subjectNameInput.trim(), subjectColorInput);
    }

    setSubjectNameInput('');
    setShowAddSubjectModal(false);
  };

  const handleDeleteSubject = (subjectId: string) => {
    if (window.confirm('Delete this subject and all its chapters?')) {
      deleteSubject(subjectId);
    }
  };

  // Chapter Handlers
  const handleSaveChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterName.trim() || !currentSubject) return;

    if (editingChapter) {
      updateChapter(editingChapter.id, {
        name: newChapterName.trim(),
        difficulty: newChapterDifficulty,
        estimatedMinutes: Number(newChapterMinutes) || 45,
      });
      setEditingChapter(null);
    } else {
      const subtopicsList = newChapterSubtopics
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      addChapter({
        subjectId: currentSubject.id,
        name: newChapterName.trim(),
        difficulty: newChapterDifficulty,
        estimatedMinutes: Number(newChapterMinutes) || 45,
        subtopics: subtopicsList,
      });
    }

    setNewChapterName('');
    setNewChapterSubtopics('');
    setShowAddChapterModal(false);
  };

  const handleDeleteChapter = (chapterId: string) => {
    if (window.confirm('Delete this chapter?')) {
      deleteChapter(chapterId);
    }
  };

  // Subtopic Handlers
  const handleInlineAddSubtopic = (chapterId: string) => {
    if (!newSubtopicName.trim()) return;
    addSubtopic(chapterId, newSubtopicName.trim(), Number(newSubtopicMinutes) || 20);
    setNewSubtopicName('');
    setAddingSubtopicForChId(null);
  };

  const handleSaveEditedSubtopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubtopic || !editingSubtopic.subtopic.name.trim()) return;

    updateSubtopic(editingSubtopic.chapterId, editingSubtopic.subtopic.id, {
      name: editingSubtopic.subtopic.name.trim(),
      estimatedMinutes: Number(editingSubtopic.subtopic.estimatedMinutes) || 20,
    });
    setEditingSubtopic(null);
  };

  return (
    <div id="syllabus_screen" className="max-w-3xl mx-auto space-y-8 pb-24 md:pb-12 pt-2">
      {/* Header & Global Syllabus Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif font-light tracking-tight text-[#111827] dark:text-white mb-1">
            Syllabus
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-normal">
            Organize subjects, chapters, and subtopics for your study plan
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn_import_syllabus_modal"
            onClick={() => setShowSyllabusImport(true)}
            className="px-4 py-2 rounded-full border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#1A1B1F] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-xs transition-colors inline-flex items-center gap-1.5 shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-[#4F46E5] dark:text-indigo-400" />
            <span>Import</span>
          </button>

          <button
            id="btn_add_subject_modal"
            onClick={() => {
              setEditingSubject(null);
              setSubjectNameInput('');
              setSubjectColorInput(palette[subjects.length % palette.length]);
              setShowAddSubjectModal(true);
            }}
            className="px-4 py-2 rounded-full border border-[#4F46E5] dark:border-indigo-500 text-[#4F46E5] dark:text-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 font-medium text-xs transition-colors inline-flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Add Subject</span>
          </button>

          {subjects.length > 0 && (
            <button
              id="btn_add_chapter_modal"
              onClick={() => {
                setEditingChapter(null);
                setNewChapterName('');
                setNewChapterSubtopics('');
                setShowAddChapterModal(true);
              }}
              className="px-5 py-2 rounded-full bg-[#4F46E5] hover:bg-indigo-700 text-white font-medium text-xs transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Chapter</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Empty State when zero subjects exist */}
      {subjects.length === 0 ? (
        <div className="bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-xl font-serif font-light text-[#111827] dark:text-white">
              No subjects in your syllabus yet
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Add your subjects (e.g. Physics, Chemistry, Biology, Mathematics, or History) or import an existing curriculum to generate your daily plan.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setEditingSubject(null);
                setSubjectNameInput('');
                setSubjectColorInput('#3B82F6');
                setShowAddSubjectModal(true);
              }}
              className="px-5 py-2.5 bg-[#4F46E5] hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Subject</span>
            </button>
            <button
              onClick={() => setShowSyllabusImport(true)}
              className="px-4 py-2.5 border border-[#E5E5E1] dark:border-[#2E3036] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm rounded-xl transition-colors"
            >
              Import Syllabus
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Subject Navigation Tabs with Edit/Delete Controls */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {subjects.map((sub) => {
              const isSelected = sub.id === currentSubject?.id;
              const subTotal = chapters.filter((c) => c.subjectId === sub.id).length;
              return (
                <div key={sub.id} className="relative group shrink-0">
                  <button
                    id={`tab_subject_${sub.id}`}
                    onClick={() => setSelectedSubjectId(sub.id)}
                    className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[#111827] dark:bg-white text-white dark:text-[#111827] shadow-xs font-semibold'
                        : 'bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] text-gray-600 dark:text-gray-400 hover:text-[#111827] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: sub.color }}
                    />
                    <span>{sub.name}</span>
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-gray-800 dark:bg-gray-200 text-gray-200 dark:text-gray-800'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {subTotal}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Progress & Management Card for Active Subject */}
          {currentSubject && (
            <div className="bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-3xl p-6 sm:p-7 space-y-4 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: currentSubject.color }}
                    />
                    <h2 className="text-xl font-serif font-light text-[#111827] dark:text-white">
                      {currentSubject.name}
                    </h2>
                    {/* Subject Edit / Delete Actions */}
                    <button
                      onClick={() => {
                        setEditingSubject(currentSubject);
                        setSubjectNameInput(currentSubject.name);
                        setSubjectColorInput(currentSubject.color);
                        setShowAddSubjectModal(true);
                      }}
                      className="p-1 text-gray-400 hover:text-[#4F46E5] dark:hover:text-indigo-400 rounded-md transition-colors"
                      title="Rename Subject"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(currentSubject.id)}
                      className="p-1 text-gray-400 hover:text-rose-500 rounded-md transition-colors"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {completedCount} of {totalCount} chapters completed
                    {allSubtopics.length > 0 && ` • ${completedSubtopics} of ${allSubtopics.length} subtopics`}
                  </p>
                </div>
                <span className="text-2xl font-serif text-[#111827] dark:text-white">{percent}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: currentSubject.color || '#4F46E5',
                  }}
                />
              </div>
            </div>
          )}

          {/* Chapters List with Subtopics Accordion */}
          <div className="space-y-3.5">
            {subjectChapters.length === 0 ? (
              <div className="bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] rounded-3xl p-8 text-center space-y-3">
                <BookOpen className="w-8 h-8 text-gray-400 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-base font-serif font-light text-[#111827] dark:text-white">
                    No chapters in {currentSubject?.name || 'this subject'} yet
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Add chapters and breakdown subtopics to structure your study routine.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingChapter(null);
                    setNewChapterName('');
                    setNewChapterSubtopics('');
                    setShowAddChapterModal(true);
                  }}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#4F46E5] hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
                >
                  Add Chapter
                </button>
              </div>
            ) : (
              subjectChapters.map((chapter) => {
                const isCompleted = chapter.status === 'completed';
                const isInProgress = chapter.status === 'in_progress';
                const isRevisionDue = isCompleted && chapter.nextRevisionDate;
                const subtopics = chapter.subtopics || [];
                const isExpanded = expandedChapterIds.has(chapter.id);
                const completedSubsCount = subtopics.filter((st) => st.completed).length;

                return (
                  <div
                    key={chapter.id}
                    id={`chapter_row_${chapter.id}`}
                    className="group bg-white dark:bg-[#1A1B1F] border border-[#E5E5E1] dark:border-[#2E3036] hover:border-[#4F46E5] dark:hover:border-indigo-500 rounded-2xl transition-all duration-150 shadow-2xs overflow-hidden"
                  >
                    {/* Chapter Summary Row */}
                    <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
                      {/* Status Cycle Button */}
                      <button
                        onClick={() => handleStatusCycle(chapter)}
                        className="shrink-0 transition-transform active:scale-95"
                        title="Cycle status: Not Started -> In Progress -> Completed"
                      >
                        {isCompleted ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : isInProgress ? (
                          <div className="w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-300 dark:border-amber-800">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 group-hover:border-gray-400 flex items-center justify-center" />
                        )}
                      </button>

                      {/* Chapter Info */}
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => toggleChapterExpand(chapter.id)}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={`text-sm sm:text-base font-semibold text-[#111827] dark:text-white truncate ${
                              isCompleted ? 'text-gray-400 dark:text-gray-500 line-through' : ''
                            }`}
                          >
                            {chapter.name}
                          </h3>
                          {isRevisionDue && (
                            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <RotateCw className="w-2.5 h-2.5" /> Revision due
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium flex-wrap">
                          <span className="capitalize">{chapter.difficulty}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> ~{chapter.estimatedMinutes} min
                          </span>
                          {subtopics.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-[#4F46E5] dark:text-indigo-400 font-semibold">
                                {completedSubsCount}/{subtopics.length} subtopics
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => startStudy(chapter)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#4F46E5] text-white hover:bg-indigo-700 transition-colors flex items-center gap-1 shadow-2xs"
                          title="Start full chapter focus session"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span className="hidden sm:inline">Study</span>
                        </button>

                        <button
                          onClick={() => {
                            setEditingChapter(chapter);
                            setNewChapterName(chapter.name);
                            setNewChapterDifficulty(chapter.difficulty);
                            setNewChapterMinutes(chapter.estimatedMinutes);
                            setShowAddChapterModal(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg transition-colors"
                          title="Edit Chapter"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteChapter(chapter.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg transition-colors"
                          title="Delete Chapter"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => toggleChapterExpand(chapter.id)}
                          className="p-1.5 text-gray-400 hover:text-[#111827] dark:hover:text-white rounded-lg transition-colors"
                          title={isExpanded ? 'Collapse subtopics' : 'Expand subtopics'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Subtopics Accordion */}
                    {isExpanded && (
                      <div className="px-4 sm:px-5 pb-4 pt-1 border-t border-gray-100 dark:border-[#26282E] bg-gray-50/50 dark:bg-[#16171A]/50 space-y-3">
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                            <ListChecks className="w-3.5 h-3.5" />
                            <span>Subtopics ({subtopics.length})</span>
                          </span>
                          <button
                            onClick={() => setAddingSubtopicForChId(chapter.id)}
                            className="text-[11px] font-semibold text-[#4F46E5] dark:text-indigo-400 hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add subtopic</span>
                          </button>
                        </div>

                        {/* Inline Subtopic Add Input */}
                        {addingSubtopicForChId === chapter.id && (
                          <div className="p-3 bg-white dark:bg-[#1A1B1F] border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-2 animate-in fade-in">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                autoFocus
                                value={newSubtopicName}
                                onChange={(e) => setNewSubtopicName(e.target.value)}
                                placeholder="Subtopic title (e.g. Derivations & Formulas)"
                                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141518] text-[#111827] dark:text-white"
                              />
                              <input
                                type="number"
                                value={newSubtopicMinutes}
                                onChange={(e) => setNewSubtopicMinutes(Number(e.target.value))}
                                placeholder="Mins"
                                className="w-16 px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141518] text-[#111827] dark:text-white"
                              />
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setAddingSubtopicForChId(null);
                                  setNewSubtopicName('');
                                }}
                                className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInlineAddSubtopic(chapter.id)}
                                className="px-3 py-1 text-xs bg-[#4F46E5] text-white rounded-lg font-medium hover:bg-indigo-700"
                              >
                                Add Subtopic
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Subtopics list */}
                        {subtopics.length === 0 ? (
                          <p className="text-xs text-gray-400 py-2 italic">
                            No subtopics added yet. Break down this chapter into bite-sized study blocks.
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {subtopics.map((st) => (
                              <div
                                key={st.id}
                                className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                                  st.completed
                                    ? 'bg-white/60 dark:bg-[#1A1B1F]/60 border-gray-200 dark:border-[#2E3036] opacity-75'
                                    : 'bg-white dark:bg-[#1E2026] border-gray-200 dark:border-[#2E3036] hover:border-indigo-300'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <button
                                    onClick={() => toggleSubtopicComplete(chapter.id, st.id)}
                                    className="shrink-0"
                                    title={st.completed ? 'Mark incomplete' : 'Mark completed'}
                                  >
                                    {st.completed ? (
                                      <div className="w-4 h-4 rounded-md bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                      </div>
                                    ) : (
                                      <div className="w-4 h-4 rounded-md border border-gray-300 dark:border-gray-600 hover:border-gray-400" />
                                    )}
                                  </button>

                                  <span
                                    className={`text-xs font-medium truncate ${
                                      st.completed
                                        ? 'line-through text-gray-400 dark:text-gray-500'
                                        : 'text-[#111827] dark:text-gray-200'
                                    }`}
                                  >
                                    {st.name}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[11px] text-gray-400">
                                    ~{st.estimatedMinutes || 20}m
                                  </span>

                                  <button
                                    onClick={() => startStudy(chapter, undefined, st)}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-300 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                                    title="Start focus session on this subtopic"
                                  >
                                    <Play className="w-2.5 h-2.5 fill-current" />
                                    <span>Focus</span>
                                  </button>

                                  <button
                                    onClick={() => deleteSubtopic(chapter.id, st.id)}
                                    className="p-1 text-gray-300 hover:text-rose-500 transition-colors"
                                    title="Delete subtopic"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Add / Edit Subject Modal */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 bg-[#111827]/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1B1F] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-[#E5E5E1] dark:border-[#2E3036] animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-serif font-light text-[#111827] dark:text-white">
                {editingSubject ? 'Edit Subject' : 'Add Subject'}
              </h3>
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Physics, Mathematics, Organic Chemistry"
                  value={subjectNameInput}
                  onChange={(e) => setSubjectNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white text-xs sm:text-sm focus:border-[#4F46E5] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Theme Color
                </label>
                <div className="flex items-center gap-2">
                  {palette.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSubjectColorInput(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        subjectColorInput === c ? 'ring-2 ring-offset-2 ring-[#4F46E5] scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Chapter Modal */}
      {showAddChapterModal && (
        <div className="fixed inset-0 z-50 bg-[#111827]/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1B1F] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-[#E5E5E1] dark:border-[#2E3036] animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-serif font-light text-[#111827] dark:text-white">
                {editingChapter ? 'Edit Chapter' : `Add Chapter to ${currentSubject?.name || 'Subject'}`}
              </h3>
              <button
                onClick={() => setShowAddChapterModal(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChapter} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Chapter Title
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Thermodynamics, Kinematics"
                  value={newChapterName}
                  onChange={(e) => setNewChapterName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white text-xs sm:text-sm focus:border-[#4F46E5] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Difficulty
                  </label>
                  <select
                    value={newChapterDifficulty}
                    onChange={(e) => setNewChapterDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white text-xs sm:text-sm"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Est. Minutes
                  </label>
                  <input
                    type="number"
                    value={newChapterMinutes}
                    onChange={(e) => setNewChapterMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white text-xs sm:text-sm"
                  />
                </div>
              </div>

              {!editingChapter && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Subtopics (comma-separated, optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1st Law, Heat Engines, Entropy"
                    value={newChapterSubtopics}
                    onChange={(e) => setNewChapterSubtopics(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white text-xs sm:text-sm focus:border-[#4F46E5] focus:outline-none"
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddChapterModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  {editingChapter ? 'Save Changes' : 'Save Chapter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

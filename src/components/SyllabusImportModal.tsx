import React, { useState } from 'react';
import {
  Upload,
  FileText,
  Check,
  Sparkles,
  X,
  BookOpen,
  ArrowRight,
  Loader2,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PRESET_COURSES } from '../data/curatedSyllabi';

export const SyllabusImportModal: React.FC = () => {
  const { showSyllabusImport, setShowSyllabusImport, importCustomSyllabusData, setExam, exam } =
    useApp();

  const [importMode, setImportMode] = useState<'preset' | 'ai_upload' | 'ai_text'>('preset');
  const [selectedPresetKey, setSelectedPresetKey] = useState(PRESET_COURSES[0].key);

  // AI text input state
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; base64: string; mimeType: string } | null>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<{ subjects: any[] } | null>(null);
  const [examName, setExamName] = useState(exam?.name || 'My Exam');

  if (!showSyllabusImport) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      setSelectedFile({
        name: file.name,
        base64: base64Data,
        mimeType: file.type || 'application/pdf',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleParseAI = async () => {
    if (!rawText.trim() && !selectedFile) return;

    setIsProcessing(true);
    try {
      const res = await fetch('/api/parse-syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawText,
          fileData: selectedFile?.base64,
          mimeType: selectedFile?.mimeType,
          examContext: examName,
        }),
      });

      if (!res.ok) throw new Error('Failed to parse syllabus');
      const data = await res.json();
      setParsedData(data);
    } catch (err) {
      console.error(err);
      // Clean fallback parser from plain text lines
      const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
      let currentSubject = 'General Subject';
      const extractedSubjects: { name: string; chapters: { name: string; estimatedMinutes: number; difficulty: 'medium'; subtopics: string[] }[] }[] = [];
      let currentChapters: { name: string; estimatedMinutes: number; difficulty: 'medium'; subtopics: string[] }[] = [];

      lines.forEach((line) => {
        if (line.includes(':')) {
          if (currentChapters.length > 0) {
            extractedSubjects.push({ name: currentSubject, chapters: [...currentChapters] });
            currentChapters = [];
          }
          const parts = line.split(':');
          currentSubject = parts[0].trim();
          const items = parts[1].split(',').map((s) => s.trim()).filter(Boolean);
          items.forEach((item) => {
            currentChapters.push({ name: item, estimatedMinutes: 45, difficulty: 'medium', subtopics: ['Core Topics'] });
          });
        } else {
          currentChapters.push({ name: line, estimatedMinutes: 45, difficulty: 'medium', subtopics: ['Basics'] });
        }
      });

      if (currentChapters.length > 0) {
        extractedSubjects.push({ name: currentSubject, chapters: currentChapters });
      }

      setParsedData({
        subjects: extractedSubjects.length > 0 ? extractedSubjects : [
          {
            name: examName || 'Extracted Course',
            chapters: [
              { name: 'Foundations & Basics', difficulty: 'medium', estimatedMinutes: 45, subtopics: ['Core Theory'] },
              { name: 'Advanced Applications', difficulty: 'medium', estimatedMinutes: 50, subtopics: ['Numericals & Practice'] },
            ],
          },
        ],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptPreset = () => {
    const preset = PRESET_COURSES.find((p) => p.key === selectedPresetKey);
    if (!preset) return;

    if (!exam) {
      setExam({
        name: preset.title,
        targetDate: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
      });
    }

    importCustomSyllabusData(preset.subjects);
    setShowSyllabusImport(false);
  };

  const handleAcceptParsed = () => {
    if (parsedData?.subjects) {
      if (!exam && examName) {
        setExam({
          name: examName,
          targetDate: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
        });
      }
      importCustomSyllabusData(parsedData.subjects);
    }
    setShowSyllabusImport(false);
  };

  return (
    <div
      id="syllabus_import_modal"
      className="fixed inset-0 z-50 bg-[#111827]/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-[#1A1B1F] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto border border-[#E5E5E1] dark:border-[#2E3036] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E5E1] dark:border-[#2E3036] pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-light text-[#111827] dark:text-white tracking-tight">
              Import Syllabus
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-normal mt-0.5">
              Choose a starter curriculum or extract chapters from your files with AI
            </p>
          </div>
          <button
            onClick={() => setShowSyllabusImport(false)}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        {!parsedData && (
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-[#141518] rounded-xl text-xs font-medium">
            <button
              onClick={() => setImportMode('preset')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                importMode === 'preset'
                  ? 'bg-white dark:bg-[#23252B] text-[#111827] dark:text-white shadow-xs font-semibold'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Starter Syllabi
            </button>
            <button
              onClick={() => setImportMode('ai_upload')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                importMode === 'ai_upload'
                  ? 'bg-white dark:bg-[#23252B] text-[#111827] dark:text-white shadow-xs font-semibold'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Upload PDF / Image
            </button>
            <button
              onClick={() => setImportMode('ai_text')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                importMode === 'ai_text'
                  ? 'bg-white dark:bg-[#23252B] text-[#111827] dark:text-white shadow-xs font-semibold'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Paste Text
            </button>
          </div>
        )}

        {/* 1. Mode: Starter Curated Syllabus */}
        {importMode === 'preset' && !parsedData && (
          <div className="space-y-4">
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {PRESET_COURSES.map((preset) => {
                const isSelected = selectedPresetKey === preset.key;
                const chapterCount = preset.subjects.reduce(
                  (acc, s) => acc + s.chapters.length,
                  0
                );
                return (
                  <div
                    key={preset.key}
                    onClick={() => setSelectedPresetKey(preset.key)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#4F46E5] dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs'
                        : 'border-[#E5E5E1] dark:border-[#2E3036] hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-xs sm:text-sm text-[#111827] dark:text-white block">
                          {preset.title}
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          {preset.subtitle}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 block">
                          {preset.subjects.length} Subjects
                        </span>
                        <span className="text-[11px] text-[#4F46E5] dark:text-indigo-400 font-semibold">
                          {chapterCount} chapters
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              id="btn_apply_preset"
              onClick={handleAcceptPreset}
              className="w-full py-3 bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Load Selected Syllabus</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2. Mode: AI PDF / Photo Upload */}
        {importMode === 'ai_upload' && !parsedData && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-[#E5E5E1] dark:border-[#2E3036] rounded-2xl p-6 text-center space-y-3 hover:border-[#4F46E5] transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mx-auto" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-[#111827] dark:text-white">
                  {selectedFile ? selectedFile.name : 'Upload PDF syllabus or chapter list photo'}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Supports coaching test series schedules, syllabus PDFs, or course outlines
                </p>
              </div>
              <label className="inline-block px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-[#4F46E5] dark:text-indigo-300 text-xs font-medium rounded-xl cursor-pointer transition-colors">
                <span>Browse file</span>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Exam / Subject Context
              </label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g. Term 1 Exam or GATE Prep"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white text-xs sm:text-sm"
              />
            </div>

            <button
              onClick={handleParseAI}
              disabled={!selectedFile || isProcessing}
              className="w-full py-3 bg-[#4F46E5] hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extracting Syllabus with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Parse & Extract Syllabus</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* 3. Mode: AI Paste Text */}
        {importMode === 'ai_text' && !parsedData && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Paste Syllabus / Chapter Names
              </label>
              <textarea
                rows={5}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="e.g.&#10;Physics: Kinematics, Laws of Motion, Work Energy Power&#10;Chemistry: Solutions, Electrochemistry&#10;Maths: Matrices, Integrals, Probability"
                className="w-full p-3 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white text-xs leading-relaxed focus:border-[#4F46E5] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Course / Exam Name
              </label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g. College Semester 4"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white text-xs sm:text-sm"
              />
            </div>

            <button
              onClick={handleParseAI}
              disabled={!rawText.trim() || isProcessing}
              className="w-full py-3 bg-[#4F46E5] hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Structuring Chapters...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Parse Chapters & Subtopics</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Extracted Preview Step */}
        {parsedData && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Found {parsedData.subjects.length} subjects with{' '}
                {parsedData.subjects.reduce((acc, s) => acc + s.chapters.length, 0)} chapters!
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-3 p-1">
              {parsedData.subjects.map((sub: any, i: number) => (
                <div
                  key={i}
                  className="p-3.5 bg-gray-50 dark:bg-[#141518] border border-[#E5E5E1] dark:border-[#2E3036] rounded-2xl space-y-1.5"
                >
                  <h4 className="font-semibold text-xs text-[#111827] dark:text-white uppercase tracking-wider">
                    {sub.name}
                  </h4>
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    {sub.chapters.map((ch: any, ci: number) => (
                      <div key={ci} className="flex justify-between">
                        <span>{ch.name}</span>
                        <span className="text-[11px] text-gray-400">~{ch.estimatedMinutes}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setParsedData(null)}
                className="flex-1 py-2.5 border border-[#E5E5E1] dark:border-[#2E3036] text-xs font-medium text-gray-700 dark:text-gray-300 rounded-xl"
              >
                Back / Retry
              </button>
              <button
                onClick={handleAcceptParsed}
                className="flex-1 py-2.5 bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Import to Syllabus
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

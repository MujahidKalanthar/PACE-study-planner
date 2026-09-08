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
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PRESET_COURSES } from '../data/curatedSyllabi';

export const SyllabusImportModal: React.FC = () => {
  const { showSyllabusImport, setShowSyllabusImport, importCustomSyllabusData, setExam, exam } =
    useApp();

  const [importMode, setImportMode] = useState<'preset' | 'ai_upload' | 'ai_text'>('preset');
  const [selectedPresetKey, setSelectedPresetKey] = useState(PRESET_COURSES[0].key);

  // AI text & file input state
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; base64: string; mimeType: string } | null>(null);

  // Processing & error states
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<{ subjects: any[] } | null>(null);
  const [examName, setExamName] = useState(exam?.name || 'My Course / Exam');

  if (!showSyllabusImport) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
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
    setErrorMessage(null);
    if (!rawText.trim() && !selectedFile) {
      setErrorMessage('Please paste your syllabus text or upload a syllabus file.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/parse-syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawText.trim() || undefined,
          fileData: selectedFile?.base64,
          mimeType: selectedFile?.mimeType,
          examContext: examName.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "We couldn't process your syllabus. Please try again or enter it manually.");
      }

      const data = await res.json();
      if (!data?.subjects || !Array.isArray(data.subjects) || data.subjects.length === 0) {
        throw new Error("We couldn't extract valid subjects and chapters. Please try again or enter it manually.");
      }

      setParsedData(data);
    } catch (err: any) {
      console.error('[Syllabus Import Error]:', err);
      setErrorMessage(err.message || "We couldn't process your syllabus. Please try again or enter it manually.");
      setParsedData(null);
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
      if (!exam && examName.trim()) {
        setExam({
          name: examName.trim(),
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
              Extract chapters from your uploaded syllabus with AI or select a starter curriculum
            </p>
          </div>
          <button
            onClick={() => setShowSyllabusImport(false)}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real Error Banner */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-start gap-3 text-xs text-rose-800 dark:text-rose-200 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">{errorMessage}</p>
              <p className="text-[11px] text-rose-700 dark:text-rose-300">
                You can also add your subjects and chapters manually in the Syllabus tab.
              </p>
            </div>
          </div>
        )}

        {/* Tab switch */}
        {!parsedData && (
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-[#141518] rounded-xl text-xs font-medium">
            <button
              onClick={() => {
                setErrorMessage(null);
                setImportMode('preset');
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                importMode === 'preset'
                  ? 'bg-white dark:bg-[#23252B] text-[#111827] dark:text-white shadow-xs font-semibold'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Starter Syllabi
            </button>
            <button
              onClick={() => {
                setErrorMessage(null);
                setImportMode('ai_upload');
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                importMode === 'ai_upload'
                  ? 'bg-white dark:bg-[#23252B] text-[#111827] dark:text-white shadow-xs font-semibold'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Upload PDF / Image
            </button>
            <button
              onClick={() => {
                setErrorMessage(null);
                setImportMode('ai_text');
              }}
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
                  {selectedFile ? selectedFile.name : 'Upload PDF syllabus or chapter list document'}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Supports syllabus PDFs, course outlines, curriculum sheets, or chapter photos
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
                Exam / Course Target Name
              </label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g. Physics Honors, GATE CS, Semester 3"
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
                  <span>Analyzing & Extracting with AI...</span>
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
                Paste Syllabus / Course Content
              </label>
              <textarea
                rows={5}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="e.g.&#10;Subject: Quantum Widget Studies&#10;Chapters:&#10;- Banana Mechanics&#10;- Orbital Sandwich Theory&#10;- Recursive Thermodynamics"
                className="w-full p-3 rounded-xl border border-[#E5E5E1] dark:border-[#2E3036] bg-white dark:bg-[#141518] text-[#111827] dark:text-white text-xs leading-relaxed focus:border-[#4F46E5] focus:outline-none font-mono"
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
                placeholder="e.g. Advanced Widget Science"
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
                  <span>Structuring Chapters with AI...</span>
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

        {/* Extracted Preview & Confirmation Step */}
        {parsedData && (
          <div className="space-y-4">
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Found {parsedData.subjects.length} subject(s) with{' '}
                {parsedData.subjects.reduce((acc, s) => acc + s.chapters.length, 0)} chapters!
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-3 p-1">
              {parsedData.subjects.map((sub: any, i: number) => (
                <div
                  key={i}
                  className="p-3.5 bg-gray-50 dark:bg-[#141518] border border-[#E5E5E1] dark:border-[#2E3036] rounded-2xl space-y-2"
                >
                  <h4 className="font-semibold text-xs text-[#111827] dark:text-white uppercase tracking-wider">
                    {sub.name}
                  </h4>
                  <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1.5">
                    {sub.chapters.map((ch: any, ci: number) => (
                      <div key={ci} className="p-2 rounded-xl bg-white dark:bg-[#1C1E24] border border-gray-100 dark:border-[#26282E] flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <span className="font-medium text-xs text-gray-800 dark:text-gray-200 block truncate">
                            {ch.name}
                          </span>
                          {ch.subtopics && ch.subtopics.length > 0 && (
                            <span className="text-[10px] text-gray-400 block truncate mt-0.5">
                              {ch.subtopics.join(', ')}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#4F46E5] dark:text-indigo-400 font-semibold shrink-0">
                          ~{ch.estimatedMinutes}m
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setParsedData(null)}
                className="flex-1 py-2.5 border border-[#E5E5E1] dark:border-[#2E3036] text-xs font-medium text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Back / Retry
              </button>
              <button
                onClick={handleAcceptParsed}
                className="flex-1 py-2.5 bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
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

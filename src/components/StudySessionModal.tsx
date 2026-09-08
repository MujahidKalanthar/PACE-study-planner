import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  X,
  CheckCircle,
  Sparkles,
  ListChecks,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Headphones,
  Maximize2,
  Minimize2,
  Plus,
  Flame,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SessionFeedback, SessionProgress } from '../types';

// Inspiring focus quotes that rotate
const FOCUS_MANTRAS = [
  'Silence the noise. One concept at a time.',
  'Deep work is the bridge between ambition and rank.',
  'Calm intensity beats rushed panic every time.',
  'Your future self will thank you for this session.',
  'Master the fundamentals; speed follows naturally.',
  'Stay in the pocket. Full immersion.',
];

type AmbientSoundType = 'off' | 'rain' | 'brown' | 'binaural';

export const StudySessionModal: React.FC = () => {
  const { activeStudySession, cancelStudy, finishStudy, subjects, toggleSubtopicComplete } =
    useApp();

  if (!activeStudySession) return null;

  const { chapter, plannedItem, subtopic } = activeStudySession;
  const subject = subjects.find((s) => s.id === chapter.subjectId);
  const targetMinutes =
    subtopic?.estimatedMinutes || plannedItem?.plannedMinutes || chapter.estimatedMinutes || 45;

  const [secondsRemaining, setSecondsRemaining] = useState(targetMinutes * 60);
  const [isRunning, setIsRunning] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mantraIndex, setMantraIndex] = useState(0);

  // Review step after student taps Finish
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState<SessionFeedback>('okay');
  const [progressMade, setProgressMade] = useState<SessionProgress>('finished');
  const [notes, setNotes] = useState('');

  // Ambient sound state
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>('off');
  const [ambientVolume, setAmbientVolume] = useState(0.3);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Subtopics checked in this session
  const [sessionCompletedSubtopicIds, setSessionCompletedSubtopicIds] = useState<Set<string>>(
    new Set(subtopic ? [subtopic.id] : [])
  );

  // Rotate mantras every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMantraIndex((prev) => (prev + 1) % FOCUS_MANTRAS.length);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    let timer: any = null;
    if (isRunning && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => Math.max(0, prev - 1));
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, secondsRemaining]);

  // Keyboard shortcut listener (Space = pause/play, Esc = exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showFeedbackModal) return;
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        setIsRunning((prev) => !prev);
      } else if (e.code === 'Escape') {
        e.preventDefault();
        if (elapsedSeconds > 60) {
          handleFinishClicked();
        } else {
          cancelStudy();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFeedbackModal, elapsedSeconds]);

  // Clean up audio on unmount or session exit
  useEffect(() => {
    return () => {
      stopAmbientSound();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const stopAmbientSound = () => {
    try {
      if (noiseNodeRef.current) {
        if ('stop' in noiseNodeRef.current && typeof (noiseNodeRef.current as any).stop === 'function') {
          (noiseNodeRef.current as any).stop();
        }
        noiseNodeRef.current.disconnect();
        noiseNodeRef.current = null;
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }
    } catch {
      // Ignore
    }
  };

  // Web Audio Ambient Synthesizer
  const playAmbientSound = (type: AmbientSoundType, vol = ambientVolume) => {
    stopAmbientSound();
    if (type === 'off') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(vol, ctx.currentTime);
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      if (type === 'brown') {
        // Brown noise (warm, deep focus hum)
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        whiteNoise.connect(masterGain);
        whiteNoise.start();
        noiseNodeRef.current = whiteNoise;
      } else if (type === 'rain') {
        // Soft rainfall sound (filtered noise + lowpass)
        const bufferSize = ctx.sampleRate * 3;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1100, ctx.currentTime);

        const filter2 = ctx.createBiquadFilter();
        filter2.type = 'highpass';
        filter2.frequency.setValueAtTime(220, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(filter2);
        filter2.connect(masterGain);
        whiteNoise.start();
        noiseNodeRef.current = whiteNoise;
      } else if (type === 'binaural') {
        // 40Hz Gamma Focus frequency (200Hz left, 240Hz right)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const merger = ctx.createChannelMerger(2);

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(196, ctx.currentTime);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(236, ctx.currentTime); // 40Hz diff

        osc1.connect(merger, 0, 0);
        osc2.connect(merger, 0, 1);
        merger.connect(masterGain);

        osc1.start();
        osc2.start();

        noiseNodeRef.current = {
          disconnect: () => {
            try {
              osc1.stop();
              osc2.stop();
              osc1.disconnect();
              osc2.disconnect();
              merger.disconnect();
            } catch {}
          },
        } as any;
      }
    } catch (e) {
      console.error('Ambient audio error', e);
    }
  };

  const handleSoundChange = (type: AmbientSoundType) => {
    setAmbientSound(type);
    playAmbientSound(type);
  };

  const handleVolumeChange = (newVol: number) => {
    setAmbientVolume(newVol);
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime(newVol, audioContextRef.current.currentTime);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const addFiveMinutes = () => {
    setSecondsRemaining((prev) => prev + 300);
  };

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const totalPlannedSeconds = targetMinutes * 60;
  const progressPercent = Math.min(
    100,
    Math.round(((totalPlannedSeconds - secondsRemaining) / totalPlannedSeconds) * 100)
  );

  const handleFinishClicked = () => {
    setIsRunning(false);
    stopAmbientSound();
    setAmbientSound('off');
    setShowFeedbackModal(true);
  };

  const toggleSubtopicInReview = (subId: string) => {
    setSessionCompletedSubtopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(subId)) next.delete(subId);
      else next.add(subId);
      return next;
    });
  };

  const handleFinalSubmit = () => {
    const studyDurationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

    // Update any subtopics checked during review
    if (chapter.subtopics && chapter.subtopics.length > 0) {
      chapter.subtopics.forEach((st) => {
        const shouldBeComplete = sessionCompletedSubtopicIds.has(st.id);
        if (shouldBeComplete !== st.completed) {
          toggleSubtopicComplete(chapter.id, st.id);
        }
      });
    }

    finishStudy(studyDurationMinutes, feedback, progressMade, notes);
  };

  const subjectColor = subject?.color || '#4F46E5';

  return (
    <div
      id="study_session_modal"
      className="fixed inset-0 z-50 bg-[#070709] text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden animate-in fade-in duration-300"
    >
      {/* Ambient background atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${subjectColor}25 0%, rgba(7, 7, 9, 0.95) 65%, #070709 100%)`,
        }}
      />
      {/* Subtle background grain grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />

      {/* 1. TOP HEADER: Status, Audio Controls, Fullscreen & Exit */}
      <header className="relative z-20 flex items-center justify-between w-full max-w-6xl mx-auto pt-2">
        {/* Left: Subject & Chapter Badge */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_12px_currentColor]"
            style={{ color: subjectColor, backgroundColor: subjectColor }}
          />
          <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-white/80 font-mono">
            {subject?.name || 'Study'}
          </span>
          <span className="text-white/30">•</span>
          <span className="text-xs sm:text-sm text-white/60 truncate max-w-[200px] sm:max-w-xs font-normal">
            {chapter.name}
          </span>
          {plannedItem?.type === 'revise' && (
            <span className="hidden sm:inline-block text-[11px] font-semibold text-purple-300 bg-purple-950/70 border border-purple-800/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Spaced Revision
            </span>
          )}
        </div>

        {/* Center: Live Pulse Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md">
          <span
            className={`w-2 h-2 rounded-full ${
              isRunning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
            }`}
          />
          <span className="text-[11px] font-mono tracking-wider uppercase text-white/70">
            {isRunning ? 'Deep Immersion Zone' : 'Timer Paused'}
          </span>
        </div>

        {/* Right: Sound, Fullscreen, Close */}
        <div className="flex items-center gap-2 relative">
          {/* Ambient Sound Toggle & Menu */}
          <div className="relative">
            <button
              onClick={() => setShowAudioMenu(!showAudioMenu)}
              className={`p-2.5 rounded-full border transition-all flex items-center gap-1.5 ${
                ambientSound !== 'off'
                  ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                  : 'bg-white/[0.05] border-white/10 hover:bg-white/10 text-white/70 hover:text-white'
              }`}
              title="Focus Soundscapes (Rain, Brown Noise, Binaural)"
            >
              {ambientSound === 'off' ? (
                <Headphones className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4 text-indigo-400" />
              )}
              <span className="hidden sm:inline text-xs font-mono capitalize">
                {ambientSound === 'off' ? 'Sound' : ambientSound}
              </span>
            </button>

            {/* Audio Dropdown */}
            {showAudioMenu && (
              <div className="absolute right-0 top-12 w-64 bg-[#141518]/95 border border-white/15 rounded-2xl p-4 shadow-2xl backdrop-blur-xl z-50 space-y-3 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                    <Headphones className="w-3.5 h-3.5 text-indigo-400" />
                    Focus Soundscapes
                  </span>
                  <button
                    onClick={() => setShowAudioMenu(false)}
                    className="text-white/40 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {(['off', 'rain', 'brown', 'binaural'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => handleSoundChange(type)}
                      className={`p-2 rounded-xl text-xs font-medium border text-left transition-all ${
                        ambientSound === type
                          ? 'border-indigo-500 bg-indigo-950/80 text-white font-semibold'
                          : 'border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.08]'
                      }`}
                    >
                      {type === 'off' && 'Muted (Silence)'}
                      {type === 'rain' && '🌧️ Soft Rain'}
                      {type === 'brown' && '☕ Brown Noise'}
                      {type === 'binaural' && '🧠 40Hz Focus'}
                    </button>
                  ))}
                </div>

                {ambientSound !== 'off' && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-white/50">
                      <span>Volume</span>
                      <span>{Math.round(ambientVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={ambientVolume}
                      onChange={(e) => handleVolumeChange(Number(e.target.value))}
                      className="w-full accent-indigo-400 h-1 bg-white/20 rounded-full"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-full bg-white/[0.05] border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close / Exit */}
          <button
            onClick={() => {
              if (elapsedSeconds > 60) {
                handleFinishClicked();
              } else {
                cancelStudy();
              }
            }}
            className="p-2.5 rounded-full bg-white/[0.05] border border-white/10 hover:bg-rose-950/50 hover:border-rose-700/50 text-white/70 hover:text-rose-300 transition-all"
            title="Exit Session (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. CENTER STAGE: Giant Aesthetic Timer, Breathing Glow Halo, Mission Target */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center my-auto py-6">
        {/* Breathing ambient ring container */}
        <div className="relative flex items-center justify-center">
          {/* Radial soft pulsating glow */}
          <div
            className={`absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full filter blur-3xl opacity-30 transition-all duration-1000 ${
              isRunning ? 'scale-105 opacity-40' : 'scale-95 opacity-15'
            }`}
            style={{ backgroundColor: subjectColor }}
          />

          {/* Glowing Minimal Circular Arc */}
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              {/* Background faint orbit track */}
              <circle
                cx="50%"
                cy="50%"
                r="44%"
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth="4"
                fill="transparent"
              />
              {/* Active progress halo with glow */}
              <circle
                cx="50%"
                cy="50%"
                r="44%"
                stroke={subjectColor}
                strokeWidth="5"
                fill="transparent"
                strokeDasharray="1000"
                strokeDashoffset={1000 - (1000 * progressPercent) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear drop-shadow-[0_0_12px_currentColor]"
              />
            </svg>

            {/* Huge Glowing Digits */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div
                className="font-mono font-extralight text-7xl sm:text-8xl md:text-9xl tracking-tight text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.18)] selection:bg-transparent"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {timeFormatted}
              </div>

              {/* Progress & Status */}
              <div className="flex items-center gap-2 mt-2 sm:mt-3">
                <span className="text-xs sm:text-sm font-mono text-white/50 tracking-wider">
                  {progressPercent}% Complete
                </span>
                <span className="text-white/20">•</span>
                <span className="text-xs sm:text-sm font-mono text-white/50">
                  {Math.floor(elapsedSeconds / 60)}m elapsed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Focus Target & Subtopic Quest */}
        <div className="mt-8 sm:mt-10 max-w-xl space-y-3 px-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-light text-white/95 tracking-tight">
            {chapter.name}
          </h1>

          {subtopic ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/15 text-indigo-300 text-xs sm:text-sm font-medium backdrop-blur-md shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Focus Target: {subtopic.name}</span>
            </div>
          ) : plannedItem?.subtopicName ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/15 text-indigo-300 text-xs sm:text-sm font-medium backdrop-blur-md shadow-lg">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Target: {plannedItem.subtopicName}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-white/60 text-xs sm:text-sm font-normal">
              <span>Target Goal: ~{targetMinutes} minutes deep focus</span>
            </div>
          )}

          {/* Focus Mantra ticker */}
          <p className="text-xs sm:text-sm text-white/40 italic transition-all duration-700 font-serif pt-1">
            "{FOCUS_MANTRAS[mantraIndex]}"
          </p>
        </div>
      </main>

      {/* 3. BOTTOM FLOATING CONTROL DOCK */}
      <footer className="relative z-20 flex flex-col items-center justify-center gap-3 w-full max-w-xl mx-auto pb-2">
        <div className="flex items-center gap-3 sm:gap-4 p-2 sm:p-2.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          {/* Quick +5 Minutes button */}
          <button
            onClick={addFiveMinutes}
            className="px-4 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/80 hover:text-white font-mono text-xs sm:text-sm transition-all flex items-center gap-1"
            title="Extend session by 5 minutes"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>5m</span>
          </button>

          {/* Pause / Resume button */}
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-6 sm:px-8 py-3 rounded-full font-medium text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg ${
              isRunning
                ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black font-semibold shadow-[0_0_25px_rgba(16,185,129,0.5)]'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Resume Focus</span>
              </>
            )}
            <span className="hidden sm:inline opacity-40 font-mono text-[10px] ml-1">[Space]</span>
          </button>

          {/* Finish & Record Session */}
          <button
            onClick={handleFinishClicked}
            className="px-5 sm:px-7 py-3 rounded-full text-white font-semibold text-xs sm:text-sm transition-all shadow-[0_0_25px_rgba(79,70,229,0.4)] hover:shadow-[0_0_35px_rgba(79,70,229,0.7)] flex items-center gap-2"
            style={{ backgroundColor: subjectColor }}
          >
            <CheckCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Finish Session</span>
          </button>
        </div>

        <p className="text-[11px] text-white/40 font-mono">
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70">Space</kbd> to pause •{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70">Esc</kbd> to finish
        </p>
      </footer>

      {/* 4. POST-SESSION CELEBRATION & LOG MODAL OVERLAY */}
      {showFeedbackModal && (
        <div
          id="focus_feedback_modal"
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-[#141518] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-white/15 animate-in zoom-in-95 duration-200 text-white">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
                <Flame className="w-3.5 h-3.5 fill-emerald-400" />
                <span>Session Completed!</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif font-light text-white tracking-tight">
                How did this session go?
              </h3>
              <p className="text-xs sm:text-sm text-white/60 mt-1">
                Logged{' '}
                <strong className="text-white font-semibold">
                  {Math.max(1, Math.round(elapsedSeconds / 60))} minutes
                </strong>{' '}
                of focused momentum for <span className="text-indigo-300">{chapter.name}</span>.
              </p>
            </div>

            {/* Subtopics Checklist in Chapter */}
            {chapter.subtopics && chapter.subtopics.length > 0 && (
              <div className="space-y-2 p-3.5 bg-white/[0.03] rounded-2xl border border-white/10">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Subtopics completed in this session:</span>
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {chapter.subtopics.map((st) => {
                    const isChecked = sessionCompletedSubtopicIds.has(st.id);
                    return (
                      <div
                        key={st.id}
                        onClick={() => toggleSubtopicInReview(st.id)}
                        className={`p-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all border ${
                          isChecked
                            ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-200 shadow-xs'
                            : 'bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/[0.08]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] ${
                              isChecked
                                ? 'bg-emerald-500 text-black font-bold'
                                : 'border border-white/30'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="truncate">{st.name}</span>
                        </div>
                        <span className="text-[10px] text-white/40">~{st.estimatedMinutes}m</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 1. Difficulty / Feeling */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/80">
                Perceived Difficulty
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'okay', 'hard'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setFeedback(lvl)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all ${
                      feedback === lvl
                        ? 'border-indigo-400 bg-indigo-950/80 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                        : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/30'
                    }`}
                  >
                    {lvl === 'easy' ? '🟢 Smooth' : lvl === 'okay' ? '🟡 Moderate' : '🔴 Tough'}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Progress Made */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/80">
                Goal Milestone
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProgressMade('finished')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    progressMade === 'finished'
                      ? 'border-indigo-400 bg-indigo-950/80 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                      : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/30'
                  }`}
                >
                  Finished planned goal
                </button>
                <button
                  type="button"
                  onClick={() => setProgressMade('partial')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    progressMade === 'partial'
                      ? 'border-indigo-400 bg-indigo-950/80 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                      : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/30'
                  }`}
                >
                  Need more time
                </button>
              </div>
            </div>

            {/* 3. Notes (Optional) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/80">
                Study Reflection (optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Mastered 12 PYQ derivations on flux & Gauss law"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-white/15 bg-white/[0.05] text-white placeholder-white/40 focus:border-indigo-400 focus:outline-none"
              />
            </div>

            {/* Submit Action */}
            <button
              onClick={handleFinalSubmit}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-[0_0_25px_rgba(79,70,229,0.5)] transition-all flex items-center justify-center gap-2"
            >
              <span>Save & Update Study Momentum</span>
              <Check className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

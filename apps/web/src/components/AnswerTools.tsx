'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Timer, TimerOff } from 'lucide-react';
import { cn } from '@/lib/cn';

type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

function getRecognition(): (new () => Recognition) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

const DURATIONS = [60, 120, 180];
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/**
 * Timer and voice-to-text for practising answers. Speech is turned into text
 * by the browser itself; no audio is sent to Jobora.
 */
export function AnswerTools({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [duration, setDuration] = useState(120);
  const [left, setLeft] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const recRef = useRef<Recognition | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const supported = Boolean(getRecognition());

  useEffect(() => {
    if (left === null || left <= 0) return;
    const t = setTimeout(() => setLeft((l) => (l === null ? null : l - 1)), 1000);
    return () => clearTimeout(t);
  }, [left]);

  useEffect(() => () => recRef.current?.stop(), []);

  const toggleVoice = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const Rec = getRecognition();
    if (!Rec) return;
    const rec = new Rec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || 'en-US';
    rec.onresult = (e) => {
      let finalText = '';
      let pending = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else pending += r[0].transcript;
      }
      if (finalText) {
        const base = valueRef.current;
        onChange(`${base}${base && !/\s$/.test(base) ? ' ' : ''}${finalText.trim()}`);
      }
      setInterim(pending);
    };
    rec.onerror = (e) => {
      setVoiceError(e.error === 'not-allowed' ? 'Allow microphone access to answer by voice.' : 'Voice input stopped. Try again.');
    };
    rec.onend = () => {
      setListening(false);
      setInterim('');
    };
    setVoiceError('');
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  const running = left !== null && left > 0;
  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {supported && (
          <button
            type="button"
            onClick={toggleVoice}
            aria-pressed={listening}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
              listening ? 'border-coral bg-coral-50 text-coral-700' : 'border-line bg-paper text-ink-muted hover:border-plum-200 hover:text-plum'
            )}
          >
            {listening ? <MicOff className="h-4 w-4" aria-hidden="true" /> : <Mic className="h-4 w-4" aria-hidden="true" />}
            {listening ? 'Stop speaking' : 'Answer by voice'}
          </button>
        )}
        <div className="flex items-center gap-1.5">
          <label htmlFor="answer-timer" className="sr-only">
            Answer time
          </label>
          <select
            id="answer-timer"
            value={duration}
            disabled={running}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="h-9 rounded-full border border-line bg-paper px-3 text-sm text-ink-muted"
          >
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d / 60} min
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setLeft(running ? null : duration)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-paper px-3.5 text-sm font-medium text-ink-muted hover:border-plum-200 hover:text-plum"
          >
            {running ? <TimerOff className="h-4 w-4" aria-hidden="true" /> : <Timer className="h-4 w-4" aria-hidden="true" />}
            {running ? 'Stop timer' : 'Start timer'}
          </button>
          {left !== null && (
            <span
              role="timer"
              aria-live={left <= 10 ? 'assertive' : 'off'}
              className={cn('min-w-[3.5rem] text-sm font-semibold tabular-nums', left === 0 ? 'text-danger' : left <= 20 ? 'text-coral-700' : 'text-plum')}
            >
              {left === 0 ? "Time's up" : fmt(left)}
            </span>
          )}
        </div>
      </div>
      {listening && (
        <p className="text-xs text-coral-700" aria-live="polite">
          Listening… {interim && <span className="italic text-ink-muted">{interim}</span>}
        </p>
      )}
      {voiceError && <p className="text-xs text-danger">{voiceError}</p>}
      {!supported && <p className="text-xs text-ink-subtle">Voice answers work in Chrome, Edge and Safari.</p>}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Keyboard,
  Mic,
  Square,
  Timer,
} from "lucide-react";
import MicWave from "@/components/MicWave";
import { LANGUAGES } from "@/lib/content";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { formatClock } from "@/lib/utils";
import type { Calibration } from "@/lib/types";

interface RecordStepProps {
  calibration: Calibration;
  onComplete: (transcript: string, elapsedSec: number) => void;
  onBack: () => void;
}

export default function RecordStep({ calibration, onComplete, onBack }: RecordStepProps) {
  const locale = LANGUAGES.find((item) => item.id === calibration.language)?.locale ?? "id-ID";
  const { supported, listening, finalText, interimText, error, start, stop, reset } =
    useSpeechRecognition(locale);

  const [manualMode, setManualMode] = useState(false);
  const [manualText, setManualText] = useState("");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const elapsedRef = useRef(0);
  const textRef = useRef("");
  const finishedRef = useRef(false);
  const runningRef = useRef(false);

  useEffect(() => {
    if (!supported) setManualMode(true);
  }, [supported]);

  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  useEffect(() => {
    textRef.current = manualMode
      ? manualText
      : `${finalText}${interimText ? ` ${interimText}` : ""}`.trim();
  }, [manualMode, manualText, finalText, interimText]);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    stop();
    setRunning(false);
    const transcript = textRef.current.trim();
    const used = Math.max(1, Math.min(calibration.duration, elapsedRef.current || 1));
    onComplete(transcript, used);
  }, [calibration.duration, onComplete, stop]);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      setElapsed((prev) => Math.min(calibration.duration, prev + 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [running, calibration.duration]);

  useEffect(() => {
    if (running && elapsed >= calibration.duration) {
      finish();
    }
  }, [running, elapsed, calibration.duration, finish]);

  const handleStart = () => {
    reset();
    finishedRef.current = false;
    setElapsed(0);
    setRunning(true);
    if (!manualMode) start();
  };

  const handleStop = () => {
    finish();
  };

  const progress = Math.min(100, (elapsed / calibration.duration) * 100);
  const remaining = Math.max(0, calibration.duration - elapsed);
  const words = textRef.current ? textRef.current.split(/\s+/).length : 0;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-gold">
            Step 2 · Delivery
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Panggungnya udah siap. Bicara natural aja.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            {calibration.persona} bakal dengerin. Jangan baca teks — jelasin kayak lagi
            cerita ke temen.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Ubah setelan
        </button>
      </div>

      <div className="rounded-3xl border border-line bg-surface p-5 shadow-[0_12px_40px_rgba(24,24,27,0.05)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                running
                  ? "bg-danger-soft text-danger"
                  : listening
                    ? "bg-forest-soft text-forest"
                    : "bg-ivory text-muted"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  running ? "animate-pulse bg-danger" : "bg-muted/50"
                }`}
              />
              {running ? "REC" : "SIAP"}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
              {calibration.duration / 60} menit · {calibration.language === "id" ? "ID" : "EN"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (running) handleStop();
              setManualMode((prev) => !prev);
            }}
            disabled={running}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ivory px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-ink disabled:opacity-40"
          >
            <Keyboard className="h-3.5 w-3.5" />
            {manualMode ? "Pakai mic" : "Ketik manual"}
          </button>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-5xl font-bold tracking-tight text-ink sm:text-6xl">
                {formatClock(remaining)}
              </span>
              <span className="font-mono text-xs uppercase tracking-wider text-muted">
                sisa waktu
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-line">
              <motion.div
                className="h-full rounded-full bg-forest"
                animate={{ width: `${progress}%` }}
                transition={{ ease: "linear", duration: 0.4 }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-muted">
              <span>{words} kata</span>
              <span className="inline-flex items-center gap-1">
                <Timer className="h-3 w-3" /> {formatClock(elapsed)} terpakai
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {!running ? (
              <button
                type="button"
                onClick={handleStart}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-forest-hover"
              >
                <Mic className="h-4 w-4" /> Mulai rekam
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStop}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-danger px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-danger/90"
              >
                <Square className="h-4 w-4" /> Stop & analisis
              </button>
            )}
            <p className="max-w-[190px] text-center text-[11px] leading-relaxed text-muted">
              Mic diproses di browser. Nggak ada rekaman audio yang dikirim ke server.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-line bg-ivory/70 px-3 py-2">
          <MicWave active={running && !manualMode} />
        </div>

        <AnimatePresence mode="wait">
          {manualMode ? (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-4"
            >
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                Transkrip manual
              </label>
              <textarea
                value={manualText}
                onChange={(event) => setManualText(event.target.value)}
                rows={8}
                disabled={running}
                placeholder="Tempel atau ketik transkrip pitch kamu di sini. Minimal beberapa kalimat biar analisisnya berguna."
                className="w-full resize-y rounded-xl border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-ink outline-none transition placeholder:text-muted/70 focus:border-forest disabled:opacity-70"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="font-mono text-[11px] text-muted">{manualText.trim().length} karakter</span>
                <button
                  type="button"
                  onClick={finish}
                  disabled={manualText.trim().length < 10}
                  className="inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white transition hover:bg-forest-hover disabled:opacity-40"
                >
                  Analisis transkrip <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="live"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-4"
            >
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Transkrip live
                </span>
                {listening ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest">
                    <Mic className="h-3 w-3" /> dengerin...
                  </span>
                ) : null}
              </div>
              <div className="scrollbar-hide h-40 overflow-y-auto rounded-xl border border-line bg-ivory px-4 py-3 text-sm leading-relaxed text-ink">
                {finalText || interimText ? (
                  <p>
                    {finalText}{" "}
                    <span className="text-muted/80 italic">{interimText}</span>
                  </p>
                ) : (
                  <p className="text-muted">
                    Transkrip bakal muncul di sini begitu kamu mulai bicara...
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error ? (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-gold-soft px-3 py-2.5 text-xs leading-relaxed text-gold">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {!supported && !manualMode ? (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-gold-soft px-3 py-2.5 text-xs leading-relaxed text-gold">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Browser ini belum support Web Speech API. Mode ketik manual otomatis aktif.
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          "Buka dengan hook 15 detik: masalah + kenapa sekarang.",
          "Sebut satu angka konkret, jangan cuma “banyak”.",
          "Tutup dengan ask yang jelas: funding, validasi, atau keputusan.",
        ].map((tip) => (
          <div key={tip} className="rounded-xl border border-line bg-surface/60 px-3.5 py-3 text-xs leading-relaxed text-muted">
            {tip}
          </div>
        ))}
      </div>
    </div>
  );
}

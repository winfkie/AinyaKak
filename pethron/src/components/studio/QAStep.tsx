"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Keyboard,
  Mic,
  MicOff,
  Sparkles,
  Trophy,
  Volume2,
} from "lucide-react";
import ScoreRing from "@/components/ScoreRing";
import { LANGUAGES } from "@/lib/content";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { speakText, stopSpeech } from "@/lib/utils";
import type { Language, QAEvaluation, QAQuestion, SessionType } from "@/lib/types";

interface QAStepProps {
  questions: QAQuestion[];
  language: Language;
  sessionType: SessionType;
  persona: string;
  onFinish: (evaluations: QAEvaluation[]) => void;
  onBack: () => void;
}

const DIFFICULTY_STYLE: Record<QAQuestion["difficulty"], string> = {
  ringan: "bg-forest-soft text-forest",
  menengah: "bg-gold-soft text-gold",
  berat: "bg-danger-soft text-danger",
};

export default function QAStep({
  questions,
  language,
  sessionType,
  persona,
  onFinish,
  onBack,
}: QAStepProps) {
  const locale = LANGUAGES.find((item) => item.id === language)?.locale ?? "id-ID";
  const { supported, listening, finalText, interimText, error, start, stop, reset } =
    useSpeechRecognition(locale);

  const [index, setIndex] = useState(0);
  const [manualMode, setManualMode] = useState(false);
  const [answer, setAnswer] = useState("");
  const [evaluations, setEvaluations] = useState<QAEvaluation[]>([]);
  const [evaluating, setEvaluating] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const question = questions[index];
  const currentEval = evaluations[index] ?? null;

  useEffect(() => {
    if (!supported) setManualMode(true);
  }, [supported]);

  useEffect(() => {
    reset();
    setAnswer("");
    setSubmitError(null);
    const timer = window.setTimeout(() => {
      if (questions[index]) speakText(questions[index].question, locale);
    }, 420);
    return () => {
      window.clearTimeout(timer);
      stopSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, locale]);

  useEffect(() => {
    if (!manualMode) {
      const combined = `${finalText}${interimText ? ` ${interimText}` : ""}`.trim();
      if (combined) setAnswer(combined);
    }
  }, [finalText, interimText, manualMode]);

  const submit = useCallback(async () => {
    if (!question || answer.trim().length < 8) return;
    setEvaluating(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/analyze-pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "answer",
          question: question.question,
          answer: answer.trim(),
          language,
          sessionType,
          persona,
        }),
      });
      const data = (await response.json()) as { ok: boolean; evaluation?: QAEvaluation; error?: string };
      if (!data.ok || !data.evaluation) {
        throw new Error(data.error || "Gagal menilai jawaban.");
      }
      setEvaluations((prev) => {
        const next = [...prev];
        next[index] = data.evaluation as QAEvaluation;
        return next;
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Gagal menilai jawaban. Coba lagi ya.");
    } finally {
      setEvaluating(false);
    }
  }, [answer, index, language, persona, question, sessionType]);

  const next = () => {
    if (index >= questions.length - 1) {
      onFinish(evaluations);
      return;
    }
    setIndex((prev) => prev + 1);
  };

  if (!question) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-gold">
            Step 4 · Q&A Defense
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Sekarang giliran jurinya nanya.
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          {questions.map((item, dotIndex) => (
            <span
              key={item.id}
              className={`h-2 rounded-full transition-all ${
                dotIndex === index
                  ? "w-6 bg-forest"
                  : dotIndex < index
                    ? "w-2 bg-forest/40"
                    : "w-2 bg-line"
              }`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="rounded-3xl border border-line bg-surface p-5 shadow-[0_12px_40px_rgba(24,24,27,0.05)] sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${DIFFICULTY_STYLE[question.difficulty]}`}>
                {question.difficulty}
              </span>
              <span className="font-mono text-[11px] text-muted">
                {index + 1}/{questions.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => speakText(question.question, locale)}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ivory px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-forest"
            >
              <Volume2 className="h-3.5 w-3.5" /> Dengerin
            </button>
          </div>

          <p className="mt-4 font-display text-xl font-semibold leading-snug text-ink sm:text-2xl">
            “{question.question}”
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            <span className="font-semibold text-ink/70">Maksud juri:</span> {question.intent}
          </p>

          {!currentEval ? (
            <>
              <div className="mt-5 rounded-2xl border border-line bg-ivory/70 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Jawaban kamu
                  </span>
                  <button
                    type="button"
                    onClick={() => setManualMode((prev) => !prev)}
                    disabled={listening}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-semibold text-muted transition hover:text-ink disabled:opacity-40"
                  >
                    <Keyboard className="h-3 w-3" /> {manualMode ? "Pakai mic" : "Ketik"}
                  </button>
                </div>

                {manualMode ? (
                  <textarea
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    rows={5}
                    placeholder="Jawab kayak di depan juri: akui pertanyaannya, kasih data, lalu tutup dengan dampak."
                    className="mt-2 w-full resize-y rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-ink outline-none transition focus:border-forest"
                  />
                ) : (
                  <div className="mt-2 min-h-[120px] rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-ink">
                    {answer ? (
                      <p>{answer}</p>
                    ) : (
                      <p className="text-muted">
                        Tekan tombol mic, lalu jawab dengan suara. Transkrip muncul di sini.
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  {!manualMode ? (
                    <button
                      type="button"
                      onClick={() => (listening ? stop() : start())}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                        listening
                          ? "bg-danger text-white hover:bg-danger/90"
                          : "bg-forest text-white hover:bg-forest-hover"
                      }`}
                    >
                      {listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                      {listening ? "Stop jawab" : "Jawab pakai suara"}
                    </button>
                  ) : (
                    <span className="font-mono text-[11px] text-muted">
                      {answer.trim() ? answer.trim().split(/\s+/).length : 0} kata
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={submit}
                    disabled={evaluating || answer.trim().length < 8}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-xs font-semibold text-white transition hover:bg-gold/90 disabled:opacity-40"
                  >
                    {evaluating ? "Juri mikir..." : "Kirim jawaban"}
                    {!evaluating ? <ArrowRight className="h-3.5 w-3.5" /> : null}
                  </button>
                </div>

                {error ? <p className="mt-2 text-[11px] text-gold">{error}</p> : null}
                {submitError ? <p className="mt-2 text-[11px] text-danger">{submitError}</p> : null}
              </div>

              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
                <Sparkles className="h-3 w-3 text-gold" /> Butuh 20–60 detik. Juri bakal nilai
                relevansi, data, dan struktur jawabanmu.
              </p>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 space-y-3"
            >
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-forest/20 bg-forest-soft/40 p-4 sm:flex-row sm:items-start">
                <ScoreRing score={currentEval.score} size={96} stroke={8} />
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-wide text-forest">
                    Q&A defense score
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-ink/90">{currentEval.feedback}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-gold/25 bg-gold-soft/50 p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gold">
                  <Trophy className="h-3.5 w-3.5" /> Golden answer
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/90">{currentEval.goldenAnswer}</p>
              </div>

              <details className="rounded-xl border border-line bg-ivory px-3.5 py-2.5">
                <summary className="cursor-pointer text-xs font-semibold text-muted">
                  Lihat jawaban kamu
                </summary>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink/80">
                  {currentEval.answer}
                </p>
              </details>

              <div className="flex flex-col-reverse items-stretch justify-between gap-2 pt-1 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-muted transition hover:text-ink"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Balik ke audit
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-forest-hover"
                >
                  {index >= questions.length - 1 ? "Lihat laporan lengkap" : "Pertanyaan berikutnya"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Loader2,
  Lock,
  Mic,
  RotateCcw,
  UserPlus,
} from "lucide-react";
import CalibrationStep from "./CalibrationStep";
import RecordStep from "./RecordStep";
import AuditStep from "./AuditStep";
import QAStep from "./QAStep";
import ScoreRing from "@/components/ScoreRing";
import { useAuth } from "@/components/AuthProvider";
import { analyzeFallback, generateQuestionsFallback } from "@/lib/analyzer";
import { planLabel } from "@/lib/plans";
import { canStartSession, getAccount, saveSession } from "@/lib/store";
import type {
  AuditResult,
  Calibration,
  QAEvaluation,
  QAQuestion,
  SessionReport,
} from "@/lib/types";

type Phase = "calibrate" | "record" | "analyzing" | "audit" | "questions" | "qa" | "done";

const LOADING_LINES = [
  "Ngebaca ulang pitch kamu...",
  "Ngitung tempo & filler words...",
  "Ngecek alur Problem → Solution → Business Model...",
  "Nyiapin catatan yang jujur tapi suportif...",
];

export default function StudioClient() {
  const { account, isLoggedIn, openAuth } = useAuth();
  const [phase, setPhase] = useState<Phase>("calibrate");
  const [calibration, setCalibration] = useState<Calibration | null>(null);
  const [transcript, setTranscript] = useState("");
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [evaluations, setEvaluations] = useState<QAEvaluation[]>([]);
  const [savedSession, setSavedSession] = useState<SessionReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [limitInfo, setLimitInfo] = useState({
    blocked: false,
    plan: "free" as "free" | "pro" | "team",
    used: 0,
    limit: 2,
  });

  useEffect(() => {
    const info = canStartSession();
    setLimitInfo({
      blocked: !info.allowed,
      plan: info.plan,
      used: info.used,
      limit: info.limit === Number.POSITIVE_INFINITY ? 999 : info.limit,
    });
  }, []);

  const runAudit = useCallback(async (text: string, durationSec: number, config: Calibration) => {
    setPhase("analyzing");
    setErrorMessage(null);
    try {
      const response = await fetch("/api/analyze-pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "audit",
          transcript: text,
          language: config.language,
          sessionType: config.sessionType,
          persona: config.persona,
          durationSec,
          pitchNotes: config.pitchNotes,
        }),
      });
      const data = (await response.json()) as { ok: boolean; audit?: AuditResult; error?: string };
      if (!data.ok || !data.audit) throw new Error(data.error || "Analisis gagal.");
      setAudit(data.audit);
      setPhase("audit");
    } catch {
      setAudit(
        analyzeFallback({
          transcript: text,
          language: config.language,
          durationSec,
          sessionType: config.sessionType,
        }),
      );
      setErrorMessage("Koneksi ke AI lagi rewel, jadi kami pakai analyzer lokal dulu.");
      setPhase("audit");
    }
  }, []);

  const handleStart = (config: Calibration) => {
    setCalibration(config);
    setAudit(null);
    setQuestions([]);
    setEvaluations([]);
    setSavedSession(null);
    setTranscript("");
    setPhase("record");
  };

  const handleRecordComplete = (text: string, durationSec: number) => {
    if (!calibration) return;
    setTranscript(text);
    void runAudit(text, durationSec, calibration);
  };

  const handleAuditNext = async () => {
    if (!calibration || !audit) return;
    setPhase("questions");
    setErrorMessage(null);
    try {
      const response = await fetch("/api/analyze-pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "questions",
          transcript,
          language: calibration.language,
          sessionType: calibration.sessionType,
          persona: calibration.persona,
        }),
      });
      const data = (await response.json()) as { ok: boolean; questions?: QAQuestion[] };
      if (!data.ok || !data.questions || data.questions.length === 0) {
        throw new Error("Pertanyaan gagal dibuat.");
      }
      setQuestions(data.questions.slice(0, 3));
      setPhase("qa");
    } catch {
      setQuestions(
        generateQuestionsFallback({
          transcript,
          language: calibration.language,
          sessionType: calibration.sessionType,
          persona: calibration.persona,
        }).slice(0, 3),
      );
      setErrorMessage("Koneksi ke AI lagi rewel, pertanyaan dibuat pakai mode lokal.");
      setPhase("qa");
    }
  };

  const handleQAFinish = (results: QAEvaluation[]) => {
    if (!calibration || !audit) return;
    const qaAverage =
      results.length > 0 ? results.reduce((sum, item) => sum + item.score, 0) / results.length : 0;
    const overallScore =
      Math.round((audit.readinessScore * 0.7 + qaAverage * 0.3) * 10) / 10;
    const currentAccount = getAccount();
    const session: SessionReport = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      mode: currentAccount ? "account" : "guest",
      ownerId: currentAccount?.id ?? "guest",
      calibration,
      transcript,
      audit,
      questions,
      qaResults: results,
      overallScore,
    };
    saveSession(session);
    setEvaluations(results);
    setSavedSession(session);
    setPhase("done");
  };

  const resetAll = () => {
    setPhase("calibrate");
    setCalibration(null);
    setTranscript("");
    setAudit(null);
    setQuestions([]);
    setEvaluations([]);
    setSavedSession(null);
    setErrorMessage(null);
  };

  if (phase === "calibrate") {
    return (
      <div className="px-4 py-10 sm:px-6 lg:py-14">
        <CalibrationStep
          onStart={handleStart}
          blocked={limitInfo.blocked}
          planLabelText={planLabel(limitInfo.plan)}
          used={limitInfo.used}
          limit={limitInfo.limit}
        />
      </div>
    );
  }

  if (phase === "record" && calibration) {
    return (
      <div className="px-4 py-10 sm:px-6 lg:py-14">
        <RecordStep
          calibration={calibration}
          onComplete={handleRecordComplete}
          onBack={() => setPhase("calibrate")}
        />
      </div>
    );
  }

  if (phase === "analyzing") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.6, ease: "linear" }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-forest text-white"
          >
            <Loader2 className="h-6 w-6" />
          </motion.div>
          <h2 className="mt-5 font-display text-xl font-bold text-ink">Lagi dengerin ulang...</h2>
          <p className="mt-1 text-sm text-muted">Bentar ya, coach lagi nyatet.</p>
          <div className="mt-5 space-y-2 text-left">
            {LOADING_LINES.map((line, index) => (
              <motion.p
                key={line}
                initial={{ opacity: 0.25 }}
                animate={{ opacity: [0.25, 1, 0.25] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3.2, delay: index * 0.8 }}
                className="flex items-center gap-2 text-xs text-muted"
              >
                <span className="h-1 w-1 rounded-full bg-gold" /> {line}
              </motion.p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "audit" && audit) {
    return (
      <div className="px-4 py-10 sm:px-6 lg:py-14">
        {errorMessage ? (
          <div className="mx-auto mb-4 w-full max-w-5xl rounded-xl bg-gold-soft px-4 py-2.5 text-xs text-gold">
            {errorMessage}
          </div>
        ) : null}
        <AuditStep
          audit={audit}
          transcript={transcript}
          onNext={handleAuditNext}
          onBack={() => setPhase("record")}
        />
      </div>
    );
  }

  if (phase === "questions") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-forest" />
          <p className="mt-3 text-sm font-medium text-ink">Juri lagi nyusun pertanyaan...</p>
          <p className="mt-1 text-xs text-muted">Nyari bagian paling goyang dari pitch kamu.</p>
        </div>
      </div>
    );
  }

  if (phase === "qa" && calibration && questions.length > 0) {
    return (
      <div className="px-4 py-10 sm:px-6 lg:py-14">
        <QAStep
          questions={questions}
          language={calibration.language}
          sessionType={calibration.sessionType}
          persona={calibration.persona}
          onFinish={handleQAFinish}
          onBack={() => setPhase("audit")}
        />
      </div>
    );
  }

  if (phase === "done" && savedSession) {
    const qaAverage =
      evaluations.length > 0
        ? evaluations.reduce((sum, item) => sum + item.score, 0) / evaluations.length
        : 0;
    return (
      <div className="px-4 py-10 sm:px-6 lg:py-14">
        <div className="mx-auto w-full max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-soft px-3 py-1 text-xs font-semibold text-forest">
            <CheckCircle2 className="h-3.5 w-3.5" /> Sesi tersimpan
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Kelar! Kamu baru aja naik satu level.
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Latihan kayak gini yang bikin pas hari-H kamu nggak kaget. Ulang 2–3 kali lagi
            dengan persona berbeda, hasilnya bakal kerasa banget.
          </p>

          <div className="mt-8 rounded-3xl border border-line bg-surface p-6 shadow-[0_16px_50px_rgba(24,24,27,0.06)]">
            <div className="flex flex-wrap items-center justify-center gap-8">
              <ScoreRing score={savedSession.overallScore} size={150} stroke={11} label="Overall" sublabel="readiness + Q&A" />
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-ivory px-4 py-3">
                  <p className="font-mono text-2xl font-bold text-ink">
                    {savedSession.audit.deliveryScore.toFixed(1)}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-muted">Delivery</p>
                </div>
                <div className="rounded-xl bg-ivory px-4 py-3">
                  <p className="font-mono text-2xl font-bold text-ink">{qaAverage.toFixed(1)}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted">Q&A</p>
                </div>
                <div className="rounded-xl bg-ivory px-4 py-3">
                  <p className="font-mono text-2xl font-bold text-ink">{savedSession.audit.wpm}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted">WPM</p>
                </div>
                <div className="rounded-xl bg-ivory px-4 py-3">
                  <p className="font-mono text-2xl font-bold text-ink">{savedSession.audit.fillerCount}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted">Filler</p>
                </div>
              </div>
            </div>

            {!isLoggedIn ? (
              <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-gold/25 bg-gold-soft p-4 text-left sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2.5">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <div>
                    <p className="text-sm font-semibold text-ink">Sesi ini masih mode guest.</p>
                    <p className="text-xs leading-relaxed text-muted">
                      Bikin akun biar progres kamu nggak ilang kalau cache browser dibersihin.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openAuth("register")}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-xs font-semibold text-white transition hover:bg-forest-hover"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Simpan akun permanen
                </button>
              </div>
            ) : (
              <p className="mt-5 text-xs text-muted">
                Tersimpan di akun <span className="font-semibold text-ink">{account?.name}</span>.
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <Link
              href="/history"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-forest-hover sm:w-auto"
            >
              <BarChart3 className="h-4 w-4" /> Lihat laporan lengkap
            </Link>
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink transition hover:border-forest/30 hover:text-forest sm:w-auto"
            >
              <RotateCcw className="h-4 w-4" /> Latihan lagi
            </button>
          </div>

          <Link
            href="/pricing"
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-muted transition hover:text-forest"
          >
            Mau sesi lebih panjang? Cek Pro Solo <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-16">
      <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-6 text-center">
        <Mic className="mx-auto h-6 w-6 text-muted" />
        <p className="mt-3 text-sm font-semibold text-ink">Sesi belum siap.</p>
        <p className="mt-1 text-xs text-muted">Coba mulai ulang dari kalibrasi.</p>
        <button
          type="button"
          onClick={resetAll}
          className="mt-4 rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white"
        >
          Mulai ulang
        </button>
      </div>
    </div>
  );
}

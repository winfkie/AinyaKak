"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { AlertCircle, Check, Minus, Sparkles } from "lucide-react";
import ScoreRing from "./ScoreRing";

const PRESETS = [
  { label: "First try", value: 4.2 },
  { label: "Mulai ngeh", value: 6.8 },
  { label: "Siap tempur", value: 8.9 },
];

function feedbackFor(score: number): string {
  if (score < 5) {
    return "Masih ada bagian yang goyang, tapi ini start yang oke banget. Rapiin dulu alur Problem → Solution, sisanya nyusul.";
  }
  if (score < 7.5) {
    return "Alurnya udah kebaca. Tinggal rapihin tempo dan buang filler biar makin nendang di depan juri.";
  }
  return "Keren banget alurnya, tinggal dipoles dikit biar juri makin yakin!";
}

export default function ScorecardPreview() {
  const [score, setScore] = useState(6.8);

  const data = useMemo(() => {
    const wpm = Math.round(104 + score * 8.4);
    const fillerCount = Math.max(0, Math.round(15 - score * 1.5));
    return {
      wpm,
      fillerCount,
      problem: score > 2.5,
      solution: score > 4.5,
      businessModel: score > 6.4,
      fillers: [
        { word: "eee", count: Math.max(0, Math.round(fillerCount * 0.4)) },
        { word: "kayak", count: Math.max(0, Math.round(fillerCount * 0.35)) },
        { word: "jujur", count: Math.max(0, Math.round(fillerCount * 0.25)) },
      ].filter((f) => f.count > 0),
    };
  }, [score]);

  return (
    <div className="relative">
      <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-br from-cobalt/15 via-transparent to-magenta/15 blur-xl" />
      <div className="overflow-hidden rounded-3xl glass-card">
        <div className="flex items-center justify-between border-b border-white/80 px-5 py-3.5 bg-white/40">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cobalt">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-magenta opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-magenta" />
            </span>
            Live Scorecard
          </div>
          <span className="rounded-full glass-pill px-2.5 py-0.5 font-metric text-[10px] font-bold text-muted">
            sesi 5 menit
          </span>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
          <ScoreRing score={score} label="Readiness" sublabel="dari 10" />

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl glass-pill px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Tempo</p>
                <p className="font-metric text-lg font-extrabold text-ink">
                  {data.wpm} <span className="text-xs font-medium text-muted">wpm</span>
                </p>
              </div>
              <div className="rounded-2xl glass-pill px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Filler Words</p>
                <p className="font-metric text-lg font-extrabold text-ink">
                  {data.fillerCount} <span className="text-xs font-medium text-muted">kata</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { key: "problem", label: "Problem" },
                { key: "solution", label: "Solution" },
                { key: "businessModel", label: "Business model" },
              ].map((item) => {
                const ok = data[item.key as "problem" | "solution" | "businessModel"];
                return (
                  <span
                    key={item.key}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                      ok
                        ? "border-mint/30 bg-mint-soft text-mint"
                        : "border-white/80 bg-white/60 text-muted"
                    }`}
                  >
                    {ok ? <Check className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    {item.label}
                  </span>
                );
              })}
            </div>

            {data.fillers.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {data.fillers.map((f) => (
                  <span
                    key={f.word}
                    className="rounded-full bg-magenta-soft px-2.5 py-0.5 font-metric text-[11px] font-bold text-magenta border border-magenta/20"
                  >
                    {f.word} ×{f.count}
                  </span>
                ))}
              </div>
            ) : (
              <p className="flex items-center gap-1 text-[11px] font-bold text-mint">
                <Sparkles className="h-3 w-3" /> Filler bersih banget, slay!
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-white/80 bg-white/50 px-5 py-4">
          <p className="flex gap-2 text-sm leading-relaxed text-ink font-medium">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-cobalt" />
            <motion.span key={feedbackFor(score)} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
              {feedbackFor(score)}
            </motion.span>
          </p>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-muted">
              <span>Coba geser skornya</span>
              <span className="font-metric font-extrabold text-cobalt">{score.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={0.1}
              value={score}
              onChange={(event) => setScore(Number(event.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/80 accent-cobalt"
              aria-label="Simulasi skor readiness"
            />
            <div className="flex gap-1.5 pt-1">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setScore(preset.value)}
                  className="rounded-full glass-pill px-3 py-1 text-[11px] font-bold text-muted transition hover:border-cobalt/40 hover:text-cobalt cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

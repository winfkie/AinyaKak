"use client";

import { ArrowLeft, ArrowRight, Check, Minus, Quote, Sparkles, Target, Waves } from "lucide-react";
import ScoreRing from "@/components/ScoreRing";
import type { AuditResult } from "@/lib/types";

interface AuditStepProps {
  audit: AuditResult;
  transcript: string;
  onNext: () => void;
  onBack: () => void;
}

export default function AuditStep({ audit, transcript, onNext, onBack }: AuditStepProps) {
  const narrativeItems = [
    { label: "Problem", ok: audit.narrative.problem },
    { label: "Solution", ok: audit.narrative.solution },
    { label: "Business model", ok: audit.narrative.businessModel },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-gold">
            Step 3 · Audit
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Nih hasil dengerin pertamamu.
          </h1>
        </div>
        <span className="rounded-full border border-line bg-surface px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted">
          {audit.source === "gemini" ? "Gemini AI" : "Analyzer lokal"}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-5 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Readiness</h2>
            <Target className="h-4 w-4 text-muted" />
          </div>
          <div className="mt-4 flex justify-center">
            <ScoreRing score={audit.readinessScore} size={160} stroke={11} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-ivory px-3 py-2 text-center">
              <p className="font-mono text-xl font-bold text-ink">{audit.deliveryScore.toFixed(1)}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted">Delivery</p>
            </div>
            <div className="rounded-xl bg-ivory px-3 py-2 text-center">
              <p className="font-mono text-xl font-bold text-ink">{audit.wpm}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted">WPM</p>
            </div>
          </div>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted">
            <Waves className="h-3 w-3" /> {audit.wordCount} kata · {audit.fillerCount} filler
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink">Catatan coach</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/90">{audit.feedback}</p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {narrativeItems.map((item) => (
              <span
                key={item.label}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  item.ok
                    ? "border-forest/20 bg-forest-soft text-forest"
                    : "border-line bg-ivory text-muted"
                }`}
              >
                {item.ok ? <Check className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                {item.label}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">{audit.narrative.note}</p>

          <div className="mt-4 border-t border-line pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Filler words</p>
            {audit.fillers.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {audit.fillers.map((filler) => (
                  <span
                    key={filler.word}
                    className="rounded-md bg-gold-soft px-2 py-1 font-mono text-[11px] text-gold"
                  >
                    {filler.word} ×{filler.count}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-forest">
                <Sparkles className="h-3 w-3" /> Bersih, nggak ada filler yang ganggu.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Quote className="h-4 w-4 text-gold" /> Kalimat yang bisa ditajamkan
          </h2>
          <div className="mt-3 space-y-3">
            {audit.rewrites.length > 0 ? (
              audit.rewrites.map((rewrite, index) => (
                <div key={`${rewrite.original}-${index}`} className="rounded-xl border border-line bg-ivory/70 p-3.5">
                  <p className="text-xs leading-relaxed text-muted line-through decoration-danger/40">
                    {rewrite.original}
                  </p>
                  <p className="mt-1.5 text-sm font-medium leading-relaxed text-ink">
                    {rewrite.sharper}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-forest">{rewrite.reason}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">
                Belum ada kalimat yang perlu dirombak besar. Coba tambahin data biar makin kuat.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-forest/20 bg-forest-soft/50 p-5">
            <h2 className="text-sm font-semibold text-forest">Yang udah keren</h2>
            <ul className="mt-2 space-y-1.5">
              {audit.strengths.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-relaxed text-ink/90">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-forest" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-gold/25 bg-gold-soft/60 p-5">
            <h2 className="text-sm font-semibold text-gold">Yang masih goyang</h2>
            <ul className="mt-2 space-y-1.5">
              {audit.improvements.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-relaxed text-ink/90">
                  <Minus className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <details className="mt-4 rounded-2xl border border-line bg-surface p-5">
        <summary className="cursor-pointer text-sm font-semibold text-ink">
          Lihat transkrip yang dianalisis
        </summary>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">{transcript}</p>
      </details>

      <div className="mt-5 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-muted transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Rekam ulang
        </button>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white transition hover:bg-forest-hover"
        >
          Lanjut dibantai juri AI <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

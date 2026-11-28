"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  Briefcase,
  Check,
  GraduationCap,
  Lock,
  Rocket,
  Sparkles,
  Wand2,
} from "lucide-react";
import { DURATIONS, LANGUAGES, PERSONAS, SAMPLE_DECKS, SESSION_TYPES } from "@/lib/content";
import type { Calibration, Language, SessionType } from "@/lib/types";

interface CalibrationStepProps {
  onStart: (calibration: Calibration) => void;
  blocked: boolean;
  planLabelText: string;
  used: number;
  limit: number;
}

const TYPE_ICONS = {
  startup: Rocket,
  "business-case": Briefcase,
  thesis: GraduationCap,
} as const;

export default function CalibrationStep({
  onStart,
  blocked,
  planLabelText,
  used,
  limit,
}: CalibrationStepProps) {
  const [sessionType, setSessionType] = useState<SessionType>("startup");
  const [duration, setDuration] = useState(300);
  const [language, setLanguage] = useState<Language>("id");
  const [persona, setPersona] = useState<string>(PERSONAS[0].name);
  const [notes, setNotes] = useState("");

  const activePersona = useMemo(
    () => PERSONAS.find((item) => item.name === persona) ?? PERSONAS[0],
    [persona],
  );

  const ready = notes.trim().length >= 20 && !blocked;

  const applySample = (sampleId: string) => {
    const sample = SAMPLE_DECKS.find((item) => item.id === sampleId);
    if (!sample) return;
    setSessionType(sample.kind);
    setDuration(sample.duration);
    setPersona(PERSONAS.find((p) => p.id === sample.personaId)?.name ?? PERSONAS[0].name);
    setNotes(sample.notes);
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-8">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-gold">
          Step 1 · Kalibrasi
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Set panggungnya dulu, biar latihannya pas.
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Pilih skenario yang paling mirip hari-H kamu. Nggak perlu sempurna — bisa
          diubah kapan aja sebelum mulai rekam.
        </p>
      </div>

      {blocked ? (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-gold/30 bg-gold-soft p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <div>
              <p className="text-sm font-semibold text-ink">
                Jatah {planLabelText} kamu udah kepakai ({used}/{limit} sesi bulan ini).
              </p>
              <p className="mt-0.5 text-sm text-muted">
                Upgrade ke Pro Solo buat sesi unlimited sampai 15 menit.
              </p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white transition hover:bg-forest-hover"
          >
            Lihat paket <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}

      <div className="space-y-5">
        {/* Session type */}
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink">Mau latihan apa?</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {SESSION_TYPES.map((type) => {
              const Icon = TYPE_ICONS[type.id];
              const active = sessionType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSessionType(type.id)}
                  className={`relative rounded-xl border p-4 text-left transition ${
                    active
                      ? "border-forest bg-forest-soft/60"
                      : "border-line bg-ivory hover:border-forest/30"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "text-forest" : "text-muted"}`} />
                  <p className="mt-2 text-sm font-semibold leading-snug text-ink">{type.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{type.hint}</p>
                  {active ? (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-forest text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        {/* Duration + language */}
        <div className="grid gap-5 sm:grid-cols-2">
          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="text-sm font-semibold text-ink">Durasi</h2>
            <div className="mt-3 flex gap-1.5 rounded-xl bg-ivory p-1">
              {DURATIONS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setDuration(item.value)}
                  className="relative flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition"
                >
                  {duration === item.value ? (
                    <motion.span
                      layoutId="duration-pill"
                      transition={{ type: "spring", stiffness: 260, damping: 24 }}
                      className="absolute inset-0 rounded-lg bg-surface shadow-sm"
                    />
                  ) : null}
                  <span className={duration === item.value ? "relative text-ink" : "relative text-muted"}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="text-sm font-semibold text-ink">Bahasa</h2>
            <div className="mt-3 flex gap-1.5 rounded-xl bg-ivory p-1">
              {LANGUAGES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLanguage(item.id)}
                  className="relative flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition"
                >
                  {language === item.id ? (
                    <motion.span
                      layoutId="language-pill"
                      transition={{ type: "spring", stiffness: 260, damping: 24 }}
                      className="absolute inset-0 rounded-lg bg-surface shadow-sm"
                    />
                  ) : null}
                  <span className={language === item.id ? "relative text-ink" : "relative text-muted"}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Persona */}
        <section className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-ink">Siapa yang bakal nanya?</h2>
            <span className="hidden text-xs text-muted sm:inline">{activePersona.tone}</span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {PERSONAS.map((item) => {
              const active = persona === item.name;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPersona(item.name)}
                  className={`rounded-xl border p-3.5 text-left transition ${
                    active
                      ? "border-forest bg-forest-soft/60"
                      : "border-line bg-ivory hover:border-forest/30"
                  }`}
                >
                  <p className="text-sm font-semibold text-ink">{item.name}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{item.focus}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Deck notes */}
        <section className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink">Ringkasan deck / materi</h2>
            <span className="font-mono text-[11px] text-muted">{notes.trim().length} karakter</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Tempel poin-poin penting: masalah, solusi, model bisnis, angka, dan risiko.
            Makin konkret, makin tajam pertanyaan jurinya.
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
              <Wand2 className="h-3.5 w-3.5" /> Coba contoh:
            </span>
            {SAMPLE_DECKS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => applySample(sample.id)}
                className="rounded-full border border-line bg-ivory px-2.5 py-1 text-[11px] font-medium text-muted transition hover:border-forest/30 hover:text-forest"
              >
                {sample.label}
              </button>
            ))}
          </div>

          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={8}
            placeholder="Contoh: Aplikasi X bantu mahasiswa jual jasa desain. Masalah: ... Solusi: ... Model bisnis: komisi 10%. Traction: 300 order/bulan..."
            className="mt-3 w-full resize-y rounded-xl border border-line bg-ivory px-4 py-3 text-sm leading-relaxed text-ink outline-none transition placeholder:text-muted/70 focus:border-forest focus:bg-surface"
          />
        </section>

        <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center">
          <p className="flex items-center gap-2 text-xs text-muted">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            Mode guest aktif — sesi ini langsung kesimpan di browser kamu.
          </p>
          <button
            type="button"
            disabled={!ready}
            onClick={() => onStart({ sessionType, duration, language, persona, pitchNotes: notes })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white transition hover:bg-forest-hover disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            Gas, mulai rekam <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        {!blocked && notes.trim().length < 20 ? (
          <p className="text-center text-xs text-muted">
            Isi ringkasan minimal 20 karakter (atau klik salah satu contoh deck) biar AI
            punya konteks.
          </p>
        ) : null}
      </div>
    </div>
  );
}

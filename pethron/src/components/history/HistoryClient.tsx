"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  ChevronDown,
  Download,
  FileText,
  Lock,
  Mic,
  Sparkles,
  Trash2,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { SESSION_TYPES } from "@/lib/content";
import { deleteSession, getAllSessions } from "@/lib/store";
import { formatDate, scoreColor } from "@/lib/utils";
import type { SessionReport } from "@/lib/types";

function typeLabel(session: SessionReport): string {
  return SESSION_TYPES.find((item) => item.id === session.calibration.sessionType)?.label ?? "Sesi";
}

function qaAverage(session: SessionReport): number {
  if (session.qaResults.length === 0) return 0;
  return session.qaResults.reduce((sum, item) => sum + item.score, 0) / session.qaResults.length;
}

function buildMarkdown(session: SessionReport): string {
  const lines: string[] = [];
  lines.push(`# Laporan Pethron — ${typeLabel(session)}`);
  lines.push("");
  lines.push(`Tanggal: ${formatDate(session.createdAt)}`);
  lines.push(`Persona juri: ${session.calibration.persona}`);
  lines.push(`Durasi: ${session.calibration.duration / 60} menit`);
  lines.push(`Overall score: ${session.overallScore.toFixed(1)}/10`);
  lines.push(`Delivery: ${session.audit.deliveryScore.toFixed(1)}/10 · WPM: ${session.audit.wpm} · Filler: ${session.audit.fillerCount}`);
  lines.push("");
  lines.push("## Catatan coach");
  lines.push(session.audit.feedback);
  lines.push("");
  lines.push("## Yang udah keren");
  session.audit.strengths.forEach((item) => lines.push(`- ${item}`));
  lines.push("");
  lines.push("## Yang masih goyang");
  session.audit.improvements.forEach((item) => lines.push(`- ${item}`));
  lines.push("");
  lines.push("## Filler words");
  lines.push(
    session.audit.fillers.length > 0
      ? session.audit.fillers.map((f) => `${f.word} ×${f.count}`).join(", ")
      : "Tidak ada filler berarti.",
  );
  lines.push("");
  lines.push("## Rewrite");
  session.audit.rewrites.forEach((rewrite, index) => {
    lines.push(`${index + 1}. Asli: ${rewrite.original}`);
    lines.push(`   Lebih tajam: ${rewrite.sharper}`);
    lines.push(`   Alasan: ${rewrite.reason}`);
  });
  lines.push("");
  lines.push("## Q&A defense");
  session.qaResults.forEach((item, index) => {
    lines.push(`### ${index + 1}. ${item.question}`);
    lines.push(`Jawaban kamu: ${item.answer}`);
    lines.push(`Skor: ${item.score.toFixed(1)}/10`);
    lines.push(`Feedback: ${item.feedback}`);
    lines.push(`Golden answer: ${item.goldenAnswer}`);
    lines.push("");
  });
  lines.push("## Transkrip");
  lines.push(session.transcript);
  return lines.join("\n");
}

function downloadReport(session: SessionReport) {
  const blob = new Blob([buildMarkdown(session)], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `pethron-${new Date(session.createdAt).toISOString().slice(0, 10)}-${session.id.slice(0, 6)}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function ProgressChart({ sessions }: { sessions: SessionReport[] }) {
  const ordered = [...sessions].sort((a, b) => a.createdAt - b.createdAt).slice(-8);
  const width = 620;
  const height = 190;
  const padX = 34;
  const padY = 26;

  if (ordered.length === 0) return null;

  const points = ordered.map((session, index) => {
    const x =
      ordered.length === 1
        ? width / 2
        : padX + (index * (width - padX * 2)) / (ordered.length - 1);
    const y = height - padY - (session.overallScore / 10) * (height - padY * 2);
    return { x, y, session };
  });

  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const area = `${path} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Grafik progres skor">
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B4332" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#1B4332" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 5, 10].map((tick) => {
          const y = height - padY - (tick / 10) * (height - padY * 2);
          return (
            <g key={tick}>
              <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#E6E2D8" strokeDasharray="3 4" />
              <text x={8} y={y + 3} fontSize="9" fill="#52525B" fontFamily="monospace">
                {tick}
              </text>
            </g>
          );
        })}
        <path d={area} fill="url(#chart-fill)" />
        <motion.path
          d={path}
          fill="none"
          stroke="#1B4332"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
        {points.map((point) => (
          <g key={point.session.id}>
            <circle cx={point.x} cy={point.y} r="4.5" fill="#FBF9F5" stroke={scoreColor(point.session.overallScore)} strokeWidth="2.5" />
            <text x={point.x} y={point.y - 11} fontSize="9.5" textAnchor="middle" fill="#18181B" fontFamily="monospace">
              {point.session.overallScore.toFixed(1)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function HistoryClient() {
  const { isLoggedIn, account, openAuth } = useAuth();
  const [sessions, setSessions] = useState<SessionReport[]>([]);
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setSessions(getAllSessions());
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);
    const onChange = () => refresh();
    window.addEventListener("pethron:sessions-changed", onChange);
    return () => window.removeEventListener("pethron:sessions-changed", onChange);
  }, [refresh]);

  const stats = useMemo(() => {
    if (sessions.length === 0) {
      return { total: 0, average: 0, best: 0, minutes: 0 };
    }
    const total = sessions.length;
    const average = sessions.reduce((sum, item) => sum + item.overallScore, 0) / total;
    const best = Math.max(...sessions.map((item) => item.overallScore));
    const minutes = sessions.reduce((sum, item) => sum + item.calibration.duration / 60, 0);
    return { total, average, best, minutes: Math.round(minutes) };
  }, [sessions]);

  const handleDelete = (id: string) => {
    deleteSession(id);
    setPendingDelete(null);
    refresh();
  };

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-forest" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:px-6 lg:py-24">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-soft text-forest">
          <BarChart3 className="h-6 w-6" />
        </div>
        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-ink">
          Belum ada jejak latihan.
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Riwayat bakal muncul di sini setelah sesi pertama kamu. Skor, filler words, dan
          Golden Answer semuanya kesimpan otomatis.
        </p>
        <Link
          href="/studio"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white transition hover:bg-forest-hover"
        >
          <Mic className="h-4 w-4" /> Mulai sesi pertama
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-gold">
            Performance log
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Progres kamu, kelihatan jelas.
          </h1>
          <p className="mt-2 text-sm text-muted">
            {isLoggedIn && account
              ? `Tersimpan di akun ${account.name}.`
              : "Mode guest — tersimpan di browser ini. Bikin akun biar aman."}
          </p>
        </div>
        <Link
          href="/studio"
          className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-forest-hover"
        >
          <Mic className="h-4 w-4" /> Sesi baru
        </Link>
      </div>

      {!isLoggedIn ? (
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-gold/25 bg-gold-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-xs leading-relaxed text-ink/80">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            Sesi guest bisa hilang kalau cache browser dibersihin. Simpan ke akun dalam 1 klik.
          </p>
          <button
            type="button"
            onClick={() => openAuth("register")}
            className="shrink-0 rounded-full bg-forest px-4 py-2 text-xs font-semibold text-white transition hover:bg-forest-hover"
          >
            Simpan akun permanen
          </button>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total sesi", value: String(stats.total), icon: FileText },
          { label: "Rata-rata", value: stats.average.toFixed(1), icon: TrendingUp },
          { label: "Skor terbaik", value: stats.best.toFixed(1), icon: Trophy },
          { label: "Total menit", value: String(stats.minutes), icon: BarChart3 },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-line bg-surface p-4">
            <item.icon className="h-4 w-4 text-muted" />
            <p className="mt-2 font-mono text-2xl font-bold text-ink">{item.value}</p>
            <p className="text-[11px] uppercase tracking-wide text-muted">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Readiness progression</h2>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
            {Math.min(sessions.length, 8)} sesi terakhir
          </span>
        </div>
        <ProgressChart sessions={sessions} />
      </div>

      <div className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold text-ink">Semua laporan</h2>
        {sessions.map((session) => {
          const open = expanded === session.id;
          const qaAvg = qaAverage(session);
          return (
            <div key={session.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : session.id)}
                  className="flex flex-1 items-start gap-3 text-left"
                >
                  <span
                    className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-bold text-white"
                    style={{ backgroundColor: scoreColor(session.overallScore) }}
                  >
                    {session.overallScore.toFixed(1)}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ink">{typeLabel(session)}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {formatDate(session.createdAt)} · {session.calibration.persona} ·{" "}
                      {session.calibration.duration / 60} menit
                    </span>
                    <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
                      <span>delivery {session.audit.deliveryScore.toFixed(1)}</span>
                      <span>qa {qaAvg.toFixed(1)}</span>
                      <span>{session.audit.fillerCount} filler</span>
                    </span>
                  </span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => downloadReport(session)}
                    className="inline-flex items-center gap-1 rounded-full border border-line bg-ivory px-3 py-1.5 text-[11px] font-semibold text-muted transition hover:text-forest"
                  >
                    <Download className="h-3.5 w-3.5" /> Export
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(session.id)}
                    className="rounded-full border border-line bg-ivory p-2 text-muted transition hover:border-danger/30 hover:text-danger"
                    aria-label="Hapus sesi"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : session.id)}
                    className="rounded-full border border-line bg-ivory p-2 text-muted transition hover:text-ink"
                    aria-label={open ? "Tutup detail" : "Buka detail"}
                  >
                    <motion.span animate={{ rotate: open ? 180 : 0 }} className="block">
                      <ChevronDown className="h-3.5 w-3.5" />
                    </motion.span>
                  </button>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {pendingDelete === session.id ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-danger/20 bg-danger-soft"
                  >
                    <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs font-medium text-danger">
                        Hapus laporan ini permanen? Nggak bisa dibalikin.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPendingDelete(null)}
                          className="rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-semibold text-muted"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(session.id)}
                          className="rounded-full bg-danger px-3 py-1.5 text-[11px] font-semibold text-white"
                        >
                          Ya, hapus
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <AnimatePresence initial={false}>
                {open ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    className="overflow-hidden border-t border-line"
                  >
                    <div className="space-y-4 bg-ivory/50 p-4">
                      <div>
                        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                          <Sparkles className="h-3.5 w-3.5 text-gold" /> Catatan coach
                        </p>
                        <p className="mt-1.5 text-sm leading-relaxed text-ink/90">{session.audit.feedback}</p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-line bg-surface p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-forest">
                            Yang udah keren
                          </p>
                          <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-muted">
                            {session.audit.strengths.map((item) => (
                              <li key={item}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-xl border border-line bg-surface p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gold">
                            Yang masih goyang
                          </p>
                          <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-muted">
                            {session.audit.improvements.map((item) => (
                              <li key={item}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {session.audit.rewrites.length > 0 ? (
                        <div className="rounded-xl border border-line bg-surface p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                            Rewrite
                          </p>
                          <div className="mt-2 space-y-2">
                            {session.audit.rewrites.map((rewrite, index) => (
                              <div key={`${rewrite.original}-${index}`} className="rounded-lg bg-ivory p-2.5">
                                <p className="text-[11px] text-muted line-through">{rewrite.original}</p>
                                <p className="mt-1 text-xs font-medium text-ink">{rewrite.sharper}</p>
                                <p className="mt-0.5 text-[10px] text-forest">{rewrite.reason}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                          Q&A defense
                        </p>
                        {session.qaResults.length > 0 ? (
                          session.qaResults.map((item, index) => (
                            <div key={`${item.question}-${index}`} className="rounded-xl border border-line bg-surface p-3">
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-xs font-semibold leading-relaxed text-ink">
                                  {index + 1}. {item.question}
                                </p>
                                <span
                                  className="shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold text-white"
                                  style={{ backgroundColor: scoreColor(item.score) }}
                                >
                                  {item.score.toFixed(1)}
                                </span>
                              </div>
                              <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                                {item.feedback}
                              </p>
                              <p className="mt-2 rounded-lg bg-gold-soft/60 px-2.5 py-2 text-[11px] leading-relaxed text-ink/80">
                                <span className="font-semibold text-gold">Golden answer: </span>
                                {item.goldenAnswer}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted">Sesi ini berhenti sebelum Q&A.</p>
                        )}
                      </div>

                      <details className="rounded-xl border border-line bg-surface px-3 py-2">
                        <summary className="cursor-pointer text-[11px] font-semibold text-muted">
                          Transkrip pitch
                        </summary>
                        <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-muted">
                          {session.transcript || "(tidak ada transkrip)"}
                        </p>
                      </details>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => downloadReport(session)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-forest px-3.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-forest-hover"
                        >
                          <Download className="h-3 w-3" /> Download laporan .md
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition hover:text-forest"
        >
          Mau sesi unlimited? Cek Pro Solo <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

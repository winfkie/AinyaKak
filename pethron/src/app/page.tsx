import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  Gauge,
  GraduationCap,
  MessagesSquare,
  Mic,
  Rocket,
  ShieldCheck,
  Sparkles,
  Timer,
  Wand2,
} from "lucide-react";
import ScorecardPreview from "@/components/ScorecardPreview";

const STEPS = [
  {
    icon: Gauge,
    title: "Set the stage dulu",
    body: "Pilih jenis sesi, durasi, bahasa, dan persona juri. Spill ringkasan deck kamu atau pakai sample deck yang udah siap.",
    tag: "30 detik",
  },
  {
    icon: Mic,
    title: "Spill ide kamu di sini",
    body: "Rekam pitch langsung pakai mic browser. Transkrip muncul live, timer jalan, waveform ikut gerak. Lagi di tempat ramai? Ketik aja.",
    tag: "3–15 menit",
  },
  {
    icon: MessagesSquare,
    title: "Q&A bareng juri AI",
    body: "Dapet skor delivery, audit filler words, rewrite kalimat goyang, plus 3 pertanyaan tajam & Golden Answer biar makin pede.",
    tag: "real-time",
  },
];

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "Skor yang nggak ngarang",
    body: "Readiness 0–10 dihitung dari tempo WPM, filler words, kejelasan, dan alur Problem → Solution → Business Model.",
  },
  {
    icon: Wand2,
    title: "Glow-up kalimat shaky",
    body: "Kalimat yang masih muter-muter atau terlalu casual dibalikin jadi versi yang lebih tajam & persuasif, tanpa ilangin vibe kamu.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy-first Guest Mode",
    body: "Langsung gas tanpa ribet login. Sesi tersimpan di browser kamu, baru sync ke akun kalau kamu mau simpan permanen.",
  },
  {
    icon: Timer,
    title: "Latihan di sela jadwal",
    body: "Sesi 3 menit buat quick warm-up, 10 menit buat full rehearsal. Bisa banget dipakai dari HP sambil nunggu giliran maju.",
  },
];

const AUDIENCE = [
  { icon: Rocket, label: "Founder muda", detail: "pitch ke VC & inkubator" },
  { icon: GraduationCap, label: "Mahasiswa", detail: "sidang skripsi & PKM" },
  { icon: BadgeCheck, label: "Tim lomba", detail: "business plan & case" },
];

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative">
        <div className="mx-auto grid w-full max-w-6xl items-start gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-24 lg:pt-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full glass-pill px-3.5 py-1.5 text-xs font-bold text-cobalt">
              <Sparkles className="h-3.5 w-3.5 text-magenta" />
              AI Pitch &amp; Defense Studio · Powered by Gemini 2.5
            </div>

            <h1 className="mt-5 font-display text-[2.5rem] font-extrabold leading-[1.06] tracking-tight text-ink sm:text-5xl lg:text-[3.5rem]">
              No more overthinking
              <br />
              <span className="y2k-text-gradient">sebelum naik panggung.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Spill ide kamu di sini! Pethron kasih feedback real-time biar pitch kamu makin
              on-point, ngitung filler words, dan ngetes kamu pakai pertanyaan juri yang tajam
              tapi tetap supportive.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/studio"
                className="group inline-flex items-center justify-center gap-2 rounded-full y2k-gradient px-7 py-3.5 text-sm font-bold text-white shadow-[0_10px_30px_rgba(37,99,235,0.28)] transition hover:scale-[1.02] hover:shadow-[0_12px_34px_rgba(236,72,153,0.34)]"
              >
                Gas latihan sekarang
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-full glass-pill px-6 py-3.5 text-sm font-bold text-ink transition hover:border-cobalt/40 hover:text-cobalt"
              >
                Intip paket &amp; Pro
              </Link>
            </div>

            <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted">
              <span className="inline-flex items-center gap-1.5 text-cobalt font-semibold">
                <ShieldCheck className="h-3.5 w-3.5 text-mint" /> Gratis 2 sesi pertama
              </span>
              <span className="text-muted/40">•</span>
              <span>Tanpa login</span>
              <span className="text-muted/40">•</span>
              <span>Mic langsung dari browser</span>
            </p>
          </div>

          <ScorecardPreview />
        </div>
      </section>

      {/* AUDIENCE STRIP */}
      <section className="border-y border-white/80 bg-white/45 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs font-bold uppercase tracking-wider text-cobalt">
            Dibikin khusus buat yang bentar lagi tampil
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {AUDIENCE.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cobalt-soft text-cobalt">
                  <item.icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm font-bold text-ink">{item.label}</span>
                <span className="text-xs text-muted">· {item.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 STEPS */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="max-w-2xl">
          <p className="font-metric text-xs font-bold uppercase tracking-widest text-magenta">
            Simple workflow
          </p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Tiga langkah, dari grogi jadi ready to slay.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Nggak perlu setup ribet. Buka studio, pilih skenario, dan mulai ngomong.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className="group relative overflow-hidden rounded-3xl glass-card p-6 transition hover:-translate-y-1 hover:shadow-[0_14px_40px_rgba(37,99,235,0.18)]"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cobalt-soft to-magenta-soft text-cobalt border border-white">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="font-metric text-xs font-bold text-magenta">0{index + 1}</span>
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
              <span className="mt-4 inline-flex rounded-full glass-pill px-3 py-1 font-metric text-[10px] font-bold uppercase tracking-wider text-cobalt">
                {step.tag}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-y border-white/80 bg-white/40 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <p className="font-metric text-xs font-bold uppercase tracking-widest text-magenta">
                What you get
              </p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                Feedback real-time biar pitch kamu makin on-point.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted">
                Bukan cuma bilang “bagus, lanjut”. Tiap sesi langsung ngasih insight actionable:
                bagian mana yang masih shaky, kalimat mana yang perlu di-polish, plus Golden Answer
                buat pertanyaan paling tricky.
              </p>
              <div className="mt-6 rounded-3xl glass-card p-5 border-l-4 border-l-magenta">
                <p className="text-sm font-bold text-cobalt flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-magenta" /> Contoh feedback coach
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink">
                  “Hook kamu udah solid banget, tapi bagian market size masih agak shaky nih — belum
                  ada angka pastinya. Juri pasti nanya ‘ini datanya dari mana?’. Let&apos;s add one
                  clear metric!”
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-3xl glass-card p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(236,72,153,0.14)]"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cobalt-soft text-cobalt">
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-display text-base font-bold text-ink">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="relative overflow-hidden rounded-[2rem] y2k-gradient px-6 py-12 text-center shadow-[0_20px_60px_rgba(37,99,235,0.28)] sm:px-12 sm:py-16 border border-white/40">
          <div className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full bg-white/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-pink-300/30 blur-3xl" />
          <p className="relative font-metric text-xs font-bold uppercase tracking-widest text-white/85">
            Your stage is waiting
          </p>
          <h2 className="relative mx-auto mt-3 max-w-2xl font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            Mending grogi sekarang bareng AI, daripada blank nanti di depan juri.
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
            Sesi pertama nggak sampai 5 menit. Buka studio, pilih sample deck atau spill ide kamu,
            dan langsung mulai!
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/studio"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-cobalt shadow-lg transition hover:scale-[1.02] hover:bg-cobalt-soft sm:w-auto"
            >
              Mulai latihan gratis <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/history"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/45 bg-white/15 backdrop-blur-md px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/25 sm:w-auto"
            >
              Intip riwayat skor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

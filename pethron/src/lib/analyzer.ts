import type {
  AuditResult,
  Language,
  NarrativeCheck,
  QAQuestion,
  QAEvaluation,
  Rewrite,
  SessionType,
} from "./types";
import { FILLER_WORDS } from "./content";

/* ------------------------------------------------------------------ */
/* Deterministic fallback analyzer                                     */
/* Used when GEMINI_API_KEY is absent or the Gemini call fails.        */
/* ------------------------------------------------------------------ */

const CASUAL_PATTERNS: { pattern: RegExp; sharper: string; reason: string }[] = [
  {
    pattern: /\bkayak(nya)?\b/gi,
    sharper: "seperti",
    reason: "Kata 'kayak' terasa spoken banget. 'Seperti' lebih rapi tanpa kehilangan gaya.",
  },
  {
    pattern: /\bbanget\b/gi,
    sharper: "sangat",
    reason: "Intensifier berlebihan bikin klaim terdengar subjektif di depan juri.",
  },
  {
    pattern: /\bjujur(nya)?\b/gi,
    sharper: "",
    reason: "Kalau jujur, juri malah mikir sisanya nggak jujur. Cut aja.",
  },
  {
    pattern: /\bkira-kira\b/gi,
    sharper: "sekitar",
    reason: "'Kira-kira' melemahkan angka. Pakai 'sekitar' plus data konkret.",
  },
  {
    pattern: /\bmungkin\b/gi,
    sharper: "kami memproyeksikan",
    reason: "Hedging bikin pitch kurang yakin. Ganti jadi proyeksi yang tegas.",
  },
  {
    pattern: /\bgitu\b/gi,
    sharper: "demikian",
    reason: "Filler percakapan. Buang biar kalimat lebih padat.",
  },
  {
    pattern: /\bgini\b/gi,
    sharper: "begini",
    reason: "Filler percakapan. Buang biar kalimat lebih padat.",
  },
  {
    pattern: /\bkeren banget\b/gi,
    sharper: "berdampak signifikan",
    reason: "Pujian subjektif kurang kuat dibanding klaim dampak.",
  },
  {
    pattern: /\bsuper\b/gi,
    sharper: "sangat",
    reason: "Kata 'super' terasa informal untuk presentasi formal.",
  },
  {
    pattern: /\blike\b/gi,
    sharper: "",
    reason: "Filler khas spoken English. Hapus biar lebih clean.",
  },
];

const PROBLEM_WORDS = [
  "masalah",
  "problem",
  "kendala",
  "tantangan",
  "pain",
  "sulit",
  "mahal",
  "ribet",
  "inefisien",
  "gap",
];
const SOLUTION_WORDS = [
  "solusi",
  "solution",
  "kami membangun",
  "kami menghadirkan",
  "platform",
  "aplikasi",
  "sistem",
  "layanan",
  "mengatasi",
  "menyelesaikan",
];
const MODEL_WORDS = [
  "model bisnis",
  "business model",
  "revenue",
  "pendapatan",
  "monetisasi",
  "langganan",
  "subscription",
  "komisi",
  "harga",
  "biaya",
  "margin",
  "unit economics",
  "gmv",
  "arpu",
  "cac",
  "ltv",
];

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function detectFillers(text: string): { word: string; count: number }[] {
  const lower = text.toLowerCase();
  const hits: { word: string; count: number }[] = [];
  for (const word of FILLER_WORDS) {
    const re = new RegExp(`\\b${word.replace("-", "\\-")}\\b`, "gi");
    const count = (lower.match(re) || []).length;
    if (count > 0) hits.push({ word, count });
  }
  return hits.sort((a, b) => b.count - a.count);
}

function detectRewrites(text: string, language: Language): Rewrite[] {
  const found: Rewrite[] = [];
  const seen = new Set<string>();
  for (const rule of CASUAL_PATTERNS) {
    const match = text.match(rule.pattern);
    if (match && match.length > 0 && !seen.has(rule.sharper + rule.pattern.source)) {
      seen.add(rule.sharper + rule.pattern.source);
      found.push({
        original: match[0],
        sharper: rule.sharper || (language === "id" ? "(hapus saja)" : "(drop it)"),
        reason: rule.reason,
      });
    }
  }
  return found.slice(0, 6);
}

function checkNarrative(text: string, language: Language): NarrativeCheck {
  const lower = text.toLowerCase();
  const has = (words: string[]) => words.some((w) => lower.includes(w));
  const problem = has(PROBLEM_WORDS);
  const solution = has(SOLUTION_WORDS);
  const businessModel = has(MODEL_WORDS);

  let note: string;
  if (language === "id") {
    if (problem && solution && businessModel) {
      note = "Alur Problem → Solution → Business Model udah kebaca. Tinggal dipoles dikit biar makin nendang.";
    } else if (!businessModel) {
      note = "Bagian model bisnis masih goyang. Juri pasti nanya 'duitnya dari mana?' — siapin angka konkret.";
    } else if (!problem) {
      note = "Masalahnya belum kerasa urgent. Kasih data atau cerita nyata biar juri ikut prihatin.";
    } else {
      note = "Solusi belum jelas bedanya dari yang udah ada. Tonjolin value proposition uniknya.";
    }
  } else {
    if (problem && solution && businessModel) {
      note = "Your Problem → Solution → Business Model arc reads clearly. A light polish will make it hit harder.";
    } else if (!businessModel) {
      note = "The business model is shaky. Expect the jury to ask 'where does the money come from?' — bring concrete numbers.";
    } else if (!problem) {
      note = "The problem doesn't feel urgent yet. Add data or a real story so the jury cares.";
    } else {
      note = "Your solution isn't clearly differentiated. Highlight the unique value proposition.";
    }
  }

  return { problem, solution, businessModel, note };
}

function clampScore(value: number): number {
  return Math.max(1, Math.min(10, Math.round(value * 10) / 10));
}

export function analyzeFallback(input: {
  transcript: string;
  language: Language;
  durationSec: number;
  sessionType: SessionType;
}): AuditResult {
  const { transcript, language, durationSec } = input;
  const words = countWords(transcript);
  const minutes = Math.max(durationSec / 60, 0.25);
  const wpm = Math.round(words / minutes);
  const fillers = detectFillers(transcript);
  const fillerCount = fillers.reduce((sum, f) => sum + f.count, 0);
  const rewrites = detectRewrites(transcript, language);
  const narrative = checkNarrative(transcript, language);

  let score = 10;
  score -= Math.min(fillerCount * 0.18, 2.4);
  score -= Math.min(rewrites.length * 0.22, 1.6);
  if (wpm < 90) score -= 0.9;
  if (wpm > 175) score -= 1.2;
  if (wpm >= 110 && wpm <= 155) score += 0.2;
  if (!narrative.problem) score -= 0.7;
  if (!narrative.solution) score -= 0.7;
  if (!narrative.businessModel) score -= 0.8;
  if (words < 40) score = Math.min(score, 4.5);
  const deliveryScore = clampScore(score);

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (language === "id") {
    if (wpm >= 110 && wpm <= 155) strengths.push("Tempo bicara kamu udah enak didengerin, nggak buru-buru.");
    if (fillerCount === 0) strengths.push("Nggak ada filler word — ini udah level presenter rapi.");
    if (narrative.problem) strengths.push("Kamu berhasil bikin masalahnya kerasa nyata.");
    if (narrative.solution) strengths.push("Solusi yang kamu tawarin jelas dan langsung nyambung.");
    if (wpm > 175) improvements.push("Tempo terlalu ngebut. Kasih jeda setelah poin penting biar juri sempat nyerna.");
    if (wpm < 90) improvements.push("Tempo agak lambat. Latih transisi antar slide biar alur lebih hidup.");
    if (fillerCount > 0) improvements.push(`Kurangi filler word (${fillerCount} kemunculan). Ganti dengan jeda pendek.`);
    if (rewrites.length > 0) improvements.push("Beberapa frasa masih terlalu casual. Cek rewrite di atas biar lebih persuasif.");
    if (!narrative.businessModel) improvements.push("Tambahkan model bisnis dan angka unit economics yang konkret.");
  } else {
    if (wpm >= 110 && wpm <= 155) strengths.push("Your pace is comfortable and easy to follow.");
    if (fillerCount === 0) strengths.push("Zero filler words — that's polished delivery.");
    if (narrative.problem) strengths.push("You made the problem feel real.");
    if (narrative.solution) strengths.push("Your solution is clear and connects directly.");
    if (wpm > 175) improvements.push("You're rushing. Pause after key points so the jury can absorb them.");
    if (wpm < 90) improvements.push("Your pace is slow. Tighten transitions between slides.");
    if (fillerCount > 0) improvements.push(`Cut filler words (${fillerCount} hits). Replace them with short pauses.`);
    if (rewrites.length > 0) improvements.push("Some phrasing is too casual — see the rewrites above.");
    if (!narrative.businessModel) improvements.push("Add a concrete business model and unit economics.");
  }

  if (strengths.length === 0) {
    strengths.push(language === "id" ? "Kamu udah berani mulai — itu langkah pertama yang paling susah." : "You showed up and started — that's the hardest part.");
  }
  if (improvements.length === 0) {
    improvements.push(language === "id" ? "Tinggal poles intonasi dan tambah data pendukung biar makin meyakinkan." : "Polish intonation and add supporting data for extra conviction.");
  }

  const feedback =
    language === "id"
      ? deliveryScore >= 8
        ? "Keren banget alurnya, tinggal dipoles dikit biar juri makin yakin!"
        : deliveryScore >= 6
          ? "Udah on the right track. Nih bagian yang masih agak goyang — rapihin dikit lagi ya."
          : "Santai, ini masih awal. Fokus dulu ke struktur cerita dan tempo, nanti kita poles bareng."
      : deliveryScore >= 8
        ? "Great flow — a small polish will make the jury fully buy in!"
        : deliveryScore >= 6
          ? "You're on the right track. Here's the part that still wobbles — tighten it up."
          : "Relax, this is early. Focus on story structure and pace first, then we polish together.";

  const readinessScore = clampScore(deliveryScore * 0.8 + (narrative.problem && narrative.solution && narrative.businessModel ? 2 : 0.8));

  return {
    deliveryScore,
    readinessScore,
    wpm,
    wordCount: words,
    fillerCount,
    fillers,
    rewrites,
    narrative,
    feedback,
    strengths,
    improvements,
    source: "fallback",
  };
}

export function generateQuestionsFallback(input: {
  transcript: string;
  language: Language;
  sessionType: SessionType;
  persona: string;
}): QAQuestion[] {
  const { transcript, language, sessionType } = input;
  const narrative = checkNarrative(transcript, language);
  const lower = transcript.toLowerCase();

  const id = () => Math.random().toString(36).slice(2, 10);

  if (language === "id") {
    const pool: QAQuestion[] = [];
    if (!narrative.businessModel) {
      pool.push({
        id: id(),
        question: "Model bisnisnya gimana sampai bisa sustainable? Jelasin unit economics dan kapan break-even-nya.",
        intent: "Nutup celah narasi model bisnis yang belum muncul di pitch.",
        difficulty: "berat",
      });
    }
    if (!narrative.problem) {
      pool.push({
        id: id(),
        question: "Kenapa masalah ini urgent dan pasarnya cukup besar? Kasih data konkret, jangan asumsi.",
        intent: "Nguji problem framing dan validasi pasar.",
        difficulty: "menengah",
      });
    }
    if (sessionType === "thesis") {
      pool.push({
        id: id(),
        question: "Apa keterbatasan metodologi penelitian kamu, dan gimana itu mempengaruhi validitas kesimpulan?",
        intent: "Nguji kesadaran metodologis dan kejujuran akademik.",
        difficulty: "berat",
      });
      pool.push({
        id: id(),
        question: "Kenapa sampel dan periode penelitian ini cukup representatif? Justifikasi pemilihannya.",
        intent: "Nguji rigor sampling dan generalisasi.",
        difficulty: "menengah",
      });
    }
    if (lower.includes("kompetitor") || lower.includes("kompetisi") || lower.includes("pesaing")) {
      pool.push({
        id: id(),
        question: "Kalau kompetitor besar tiru fitur utama kamu dalam 3 bulan, apa moat yang bikin kamu tetap menang?",
        intent: "Nguji ketahanan competitive advantage.",
        difficulty: "berat",
      });
    }
    pool.push({
      id: id(),
      question: "Bagian mana dari pitch tadi yang menurut kamu paling lemah, dan kenapa?",
      intent: "Nguji self-awareness dan kesiapan menerima kritik.",
      difficulty: "ringan",
    });
    pool.push({
      id: id(),
      question: "Kalau cuma satu angka yang harus diinget juri dari presentasi kamu, angka apa dan kenapa?",
      intent: "Nguji prioritas pesan dan data literacy.",
      difficulty: "menengah",
    });
    pool.push({
      id: id(),
      question: "Apa asumsi paling berisiko dalam proyeksi kamu, dan gimana rencana mitigasinya?",
      intent: "Nguji manajemen risiko dan kematangan rencana.",
      difficulty: "berat",
    });
    return pool.slice(0, 3);
  }

  const pool: QAQuestion[] = [];
  if (!narrative.businessModel) {
    pool.push({
      id: id(),
      question: "How does the business model stay sustainable? Walk us through unit economics and break-even.",
      intent: "Closes the missing business-model gap.",
      difficulty: "berat",
    });
  }
  if (!narrative.problem) {
    pool.push({
      id: id(),
      question: "Why is this problem urgent and the market large enough? Give concrete data, not assumptions.",
      intent: "Tests problem framing and market validation.",
      difficulty: "menengah",
    });
  }
  if (sessionType === "thesis") {
    pool.push({
      id: id(),
      question: "What are the methodological limitations of your study, and how do they affect your conclusions?",
      intent: "Tests methodological awareness and academic honesty.",
      difficulty: "berat",
    });
    pool.push({
      id: id(),
      question: "Why is your sample and study period representative enough? Justify the choices.",
      intent: "Tests sampling rigor and generalizability.",
      difficulty: "menengah",
    });
  }
  pool.push({
    id: id(),
    question: "If a large competitor copies your core feature in three months, what moat keeps you ahead?",
    intent: "Tests durability of competitive advantage.",
    difficulty: "berat",
  });
  pool.push({
    id: id(),
    question: "Which part of your pitch do you think is weakest, and why?",
    intent: "Tests self-awareness and coachability.",
    difficulty: "ringan",
  });
  pool.push({
    id: id(),
    question: "If the jury remembers only one number from your pitch, which one should it be and why?",
    intent: "Tests message prioritization and data literacy.",
    difficulty: "menengah",
  });
  pool.push({
    id: id(),
    question: "What is the riskiest assumption in your projection, and how would you mitigate it?",
    intent: "Tests risk management and planning maturity.",
    difficulty: "berat",
  });
  return pool.slice(0, 3);
}

export function evaluateAnswerFallback(input: {
  question: string;
  answer: string;
  language: Language;
}): QAEvaluation {
  const { question, answer, language } = input;
  const words = countWords(answer);
  const lower = answer.toLowerCase();
  const fillerHits = detectFillers(answer).reduce((sum, f) => sum + f.count, 0);
  const hasNumber = /\d/.test(answer);
  const hasBecause = language === "id" ? lower.includes("karena") : lower.includes("because");
  const hasStructure =
    lower.includes("pertama") ||
    lower.includes("kedua") ||
    lower.includes("first") ||
    lower.includes("second") ||
    lower.includes("1.") ||
    lower.includes("2.");

  let score = 5.5;
  if (words >= 20) score += 0.8;
  if (words >= 40) score += 0.8;
  if (words >= 70) score += 0.4;
  if (hasNumber) score += 1;
  if (hasBecause) score += 0.7;
  if (hasStructure) score += 0.6;
  if (fillerHits > 0) score -= Math.min(fillerHits * 0.3, 1.2);
  if (words < 8) score -= 2.5;
  if (words < 25) score -= 0.6;
  const finalScore = clampScore(score);

  const feedback =
    language === "id"
      ? finalScore >= 8
        ? "Jawaban kamu tajam dan meyakinkan. Tinggal jaga kontak mata sama juri biar makin nendang."
        : finalScore >= 6
          ? "Udah ada isinya, tapi masih bisa lebih konkret. Tambahin angka atau contoh nyata biar nggak terdengar normatif."
          : "Jawaban masih terlalu umum. Coba pakai pola: akui pertanyaan → kasih data → hubungkan ke dampak bisnis."
      : finalScore >= 8
        ? "Sharp, convincing answer. Hold eye contact with the jury and you're set."
        : finalScore >= 6
          ? "There's substance, but it can be more concrete. Add a number or real example so it doesn't sound generic."
          : "Too generic. Try: acknowledge the question → give data → tie it to business impact.";

  const goldenAnswer =
    language === "id"
      ? `Pola jawaban kece: "Pertanyaan bagus. Kami melihat ini dari dua sisi. Pertama, [data/angka konkret] menunjukkan [insight]. Kedua, kami sudah mitigasi lewat [aksi spesifik]. Dampaknya ke [metrik bisnis] sekitar [angka]. Ke depannya kami akan [next step] sambil terus memantau [indikator]."`
      : `Golden answer pattern: "Great question. We see this from two angles. First, [concrete data/number] shows [insight]. Second, we've mitigated it through [specific action]. The impact on [business metric] is around [number]. Next, we'll [next step] while monitoring [indicator]."`;

  return { question, answer, score: finalScore, feedback, goldenAnswer };
}

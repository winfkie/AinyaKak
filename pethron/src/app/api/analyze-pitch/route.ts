import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  analyzeFallback,
  evaluateAnswerFallback,
  generateQuestionsFallback,
} from "@/lib/analyzer";
import type {
  AuditResult,
  FillerHit,
  Language,
  NarrativeCheck,
  QAEvaluation,
  QAQuestion,
  Rewrite,
  SessionType,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AnalyzeBody {
  mode?: "audit" | "questions" | "answer";
  transcript?: string;
  language?: Language;
  sessionType?: SessionType;
  persona?: string;
  durationSec?: number;
  pitchNotes?: string;
  question?: string;
  answer?: string;
}

function getDefaultModel(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

function clamp(value: number, min = 1, max = 10): number {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function sanitizeAudit(
  raw: Partial<AuditResult>,
  fallback: AuditResult,
  transcript: string,
  durationSec: number,
): AuditResult {
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const wpm =
    typeof raw.wpm === "number" && raw.wpm > 0
      ? Math.round(raw.wpm)
      : Math.round(wordCount / Math.max(durationSec / 60, 0.25));

  const fillers: FillerHit[] = Array.isArray(raw.fillers)
    ? raw.fillers
        .filter((f) => f && typeof f.word === "string" && typeof f.count === "number")
        .map((f) => ({ word: f.word, count: Math.max(1, Math.round(f.count)) }))
    : fallback.fillers;

  const rewrites: Rewrite[] = Array.isArray(raw.rewrites)
    ? raw.rewrites
        .filter((r) => r && typeof r.original === "string" && typeof r.sharper === "string")
        .map((r) => ({
          original: r.original,
          sharper: r.sharper,
          reason: typeof r.reason === "string" ? r.reason : "Lebih tegas dan persuasif.",
        }))
    : fallback.rewrites;

  const narrativeRaw = raw.narrative as Partial<NarrativeCheck> | undefined;
  const narrative: NarrativeCheck = {
    problem: Boolean(narrativeRaw?.problem),
    solution: Boolean(narrativeRaw?.solution),
    businessModel: Boolean(narrativeRaw?.businessModel),
    note: typeof narrativeRaw?.note === "string" && narrativeRaw.note ? narrativeRaw.note : fallback.narrative.note,
  };

  const deliveryScore = clamp(Number(raw.deliveryScore ?? fallback.deliveryScore));
  const narrativeBonus =
    narrative.problem && narrative.solution && narrative.businessModel ? 2 : 0.8;
  const readinessScore = clamp(deliveryScore * 0.8 + narrativeBonus);

  return {
    deliveryScore,
    readinessScore,
    wpm,
    wordCount,
    fillerCount: fillers.reduce((sum, f) => sum + f.count, 0),
    fillers,
    rewrites,
    narrative,
    feedback:
      typeof raw.feedback === "string" && raw.feedback ? raw.feedback : fallback.feedback,
    strengths:
      Array.isArray(raw.strengths) && raw.strengths.length > 0
        ? raw.strengths.filter((s): s is string => typeof s === "string").slice(0, 4)
        : fallback.strengths,
    improvements:
      Array.isArray(raw.improvements) && raw.improvements.length > 0
        ? raw.improvements.filter((s): s is string => typeof s === "string").slice(0, 5)
        : fallback.improvements,
    source: "gemini",
  };
}

function sanitizeQuestions(raw: unknown, fallback: QAQuestion[]): QAQuestion[] {
  const list = Array.isArray(raw) ? raw : [];
  const cleaned: QAQuestion[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Partial<QAQuestion>;
    if (typeof candidate.question !== "string" || !candidate.question.trim()) continue;
    const difficulty: QAQuestion["difficulty"] =
      candidate.difficulty === "berat" || candidate.difficulty === "menengah" || candidate.difficulty === "ringan"
        ? candidate.difficulty
        : "menengah";
    cleaned.push({
      id: candidate.id && typeof candidate.id === "string" ? candidate.id : Math.random().toString(36).slice(2, 10),
      question: candidate.question.trim(),
      intent: typeof candidate.intent === "string" ? candidate.intent : "Nguji kedalaman pemahaman pitch.",
      difficulty,
    });
    if (cleaned.length === 3) break;
  }
  if (cleaned.length < 3) {
    for (const q of fallback) {
      if (cleaned.length === 3) break;
      if (!cleaned.some((c) => c.question === q.question)) cleaned.push(q);
    }
  }
  return cleaned.slice(0, 3);
}

function sanitizeEvaluation(raw: unknown, fallback: QAEvaluation): QAEvaluation {
  if (!raw || typeof raw !== "object") return fallback;
  const candidate = raw as Partial<QAEvaluation>;
  return {
    question: fallback.question,
    answer: fallback.answer,
    score: clamp(Number(candidate.score ?? fallback.score)),
    feedback:
      typeof candidate.feedback === "string" && candidate.feedback
        ? candidate.feedback
        : fallback.feedback,
    goldenAnswer:
      typeof candidate.goldenAnswer === "string" && candidate.goldenAnswer
        ? candidate.goldenAnswer
        : fallback.goldenAnswer,
  };
}

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const modelName = getDefaultModel();
  if (!apiKey) {
    console.error("[Pethron][Gemini] GEMINI_API_KEY tidak ditemukan di .env.local / environment.");
    return null;
  }
  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.75,
      responseMimeType: "application/json",
    },
  });
}

async function generateJson(prompt: string): Promise<unknown> {
  const modelName = getDefaultModel();
  const model = getModel();
  if (!model) return null;
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
    return JSON.parse(cleaned);
  } catch (error) {
    const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.error(`[Pethron][Gemini] Gagal memanggil model "${modelName}":`, detail);
    throw error;
  }
}

const COACH_PERSONA = `Kamu adalah "Pethron Coach": mentor pitch & defense yang cerdas, supportive, catchy, dan relatable buat anak muda/mahasiswa/founder Gen Z.
Gaya bahasa: Gen Z bilingual (campuran Bahasa Indonesia dan Bahasa Inggris yang natural, luwes, nggak lebay, dan tetap tajam secara substansi — contoh: "Hook kamu udah solid banget, tapi bagian unit economics masih agak shaky nih, let's sharpen that!" atau "Poin solusinya udah on-point, tinggal tambahin data traction biar juri auto yakin!").
Jangan pernah terdengar seperti dosen kaku, robot korporat, atau template generik. Substansi analisis wajib spesifik ke isi pitch user.`;

export async function POST(request: Request) {
  let body: AnalyzeBody;
  try {
    body = (await request.json()) as AnalyzeBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Body bukan JSON yang valid." }, { status: 400 });
  }

  const mode = body.mode ?? "audit";
  const language: Language = body.language === "en" ? "en" : "id";
  const sessionType: SessionType =
    body.sessionType === "business-case" || body.sessionType === "thesis" ? body.sessionType : "startup";
  const persona = body.persona || "Juri Lomba Nasional";
  const transcript = (body.transcript || "").trim();
  const durationSec = Math.max(60, Math.min(900, Number(body.durationSec) || 300));

  try {
    if (mode === "audit") {
      const fallback = analyzeFallback({ transcript, language, durationSec, sessionType });
      if (transcript.length < 10) {
        return NextResponse.json({ ok: true, audit: fallback });
      }
      const prompt = `${COACH_PERSONA}

Tugas: audit penyampaian pitch oral. Balas HANYA JSON valid dengan bentuk:
{
  "deliveryScore": number 0-10,
  "wpm": number,
  "fillers": [{ "word": string, "count": number }],
  "rewrites": [{ "original": string, "sharper": string, "reason": string }],
  "narrative": { "problem": boolean, "solution": boolean, "businessModel": boolean, "note": string },
  "feedback": string,
  "strengths": string[],
  "improvements": string[]
}

Aturan:
- deliveryScore menilai kejelasan, tempo, filler, dan kekuatan persuasif (0-10, satu desimal).
- Deteksi filler words: "eee", "anu", "kayak", "mungkin", "jujur", "um", "like", "hmm", "gitu", "gini", "sebenarnya", "kira-kira".
- rewrites: maksimal 5 frasa yang terlalu casual/kurang jelas, beri versi yang lebih tajam & persuasif. reason singkat dan suportif.
- narrative: cek apakah transkrip mengandung Problem, Solution, dan Business Model yang jelas.
- feedback, strengths, improvements: ${language === "id" ? "gaya bahasa Gen Z bilingual (campuran Indonesia-Inggris yang cerdas, supportive, catchy, dan relatable)" : "English, smart Gen Z supportive, catchy, and relatable"}, maksimal 2 kalimat per item, spesifik ke isi pitch (bukan generik).
- Jangan mengarang angka yang tidak ada di transkrip.

Konteks:
- Jenis sesi: ${sessionType}
- Persona juri: ${persona}
- Estimasi durasi: ${durationSec} detik
- Ringkasan deck: ${body.pitchNotes?.slice(0, 1200) || "(tidak ada)"}

Transkrip pitch:
"""
${transcript.slice(0, 9000)}
"""`;

      const parsed = await generateJson(prompt);
      if (!parsed || typeof parsed !== "object") {
        return NextResponse.json({ ok: true, audit: fallback });
      }
      const audit = sanitizeAudit(parsed as Partial<AuditResult>, fallback, transcript, durationSec);
      return NextResponse.json({ ok: true, audit });
    }

    if (mode === "questions") {
      const fallback = generateQuestionsFallback({ transcript, language, sessionType, persona });
      if (transcript.length < 10) {
        return NextResponse.json({ ok: true, questions: fallback, source: "fallback" });
      }
      const prompt = `${COACH_PERSONA}

Tugas: kamu berperan sebagai ${persona} dalam sesi tanya jawab adversarial. Buat 3 pertanyaan tajam yang spesifik ke pitch ini, menyerang bagian paling lemah (asumsi, angka, model bisnis, metodologi, kompetisi, atau risiko).

Balas HANYA JSON valid:
{ "questions": [ { "question": string, "intent": string, "difficulty": "ringan" | "menengah" | "berat" } ] }

Aturan:
- Tepat 3 pertanyaan, ${language === "id" ? "gaya bahasa Gen Z bilingual (campuran Indonesia-Inggris yang natural, tajam, dan relatable seperti juri/penguji modern)" : "English, sharp, natural, and engaging like a modern judge"}.
- Pertanyaan harus terdengar natural seperti juri sungguhan, bukan template.
- intent: alasan singkat & catchy kenapa juri nanyain poin itu.
- Jangan mengulang pertanyaan yang sama.

Konteks:
- Jenis sesi: ${sessionType}
- Persona: ${persona}

Transkrip pitch:
"""
${transcript.slice(0, 8000)}
"""`;

      const parsed = (await generateJson(prompt)) as { questions?: unknown } | null;
      const questions = sanitizeQuestions(parsed?.questions, fallback);
      return NextResponse.json({ ok: true, questions, source: parsed ? "gemini" : "fallback" });
    }

    if (mode === "answer") {
      const question = (body.question || "").trim();
      const answer = (body.answer || "").trim();
      const fallback = evaluateAnswerFallback({ question, answer, language });
      if (!answer) {
        return NextResponse.json({ ok: true, evaluation: fallback });
      }
      const prompt = `${COACH_PERSONA}

Tugas: nilai jawaban user atas pertanyaan juri. Balas HANYA JSON valid:
{ "score": number 0-10, "feedback": string, "goldenAnswer": string }

Aturan:
- score menilai relevansi, kedalaman, bukti/data, dan kejelasan struktur jawaban.
- feedback: ${language === "id" ? "gaya bahasa Gen Z bilingual (campuran Indonesia-Inggris yang cerdas, supportive, catchy, dan relatable)" : "English, smart, supportive & catchy"}, 1-2 kalimat, sebutkan apa yang sudah on-point dan apa yang perlu di-level up.
- goldenAnswer: contoh jawaban "slay, tajam & meyakinkan" yang bisa langsung dipakai, 3-5 kalimat, pakai struktur: akui pertanyaan → data/insight → dampak bisnis/metodologis → next step. ${language === "id" ? "Boleh bilingual Indonesia-Inggris yang profesional tapi tetap luwes" : "English"}.
- Jangan mengarang data spesifik yang tidak masuk akal; gunakan placeholder angka yang wajar bila perlu.

Konteks:
- Jenis sesi: ${sessionType}
- Persona juri: ${persona}
- Pertanyaan: ${question}
- Jawaban user: """
${answer.slice(0, 4000)}
"""`;

      const parsed = (await generateJson(prompt)) as Partial<QAEvaluation> | null;
      const evaluation = sanitizeEvaluation(parsed, fallback);
      return NextResponse.json({ ok: true, evaluation });
    }

    return NextResponse.json({ ok: false, error: "Mode tidak dikenal." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan tak terduga.";
    console.error(`[Pethron][analyze-pitch] Koneksi Gemini gagal (mode=${mode}, model=${getDefaultModel()}), memakai fallback lokal:`, error);
    // Graceful degradation: the deterministic analyzer keeps the product usable
    // even when Gemini is rate-limited or misconfigured.
    if (mode === "audit") {
      return NextResponse.json({
        ok: true,
        audit: analyzeFallback({ transcript, language, durationSec, sessionType }),
        warning: message,
      });
    }
    if (mode === "questions") {
      return NextResponse.json({
        ok: true,
        questions: generateQuestionsFallback({ transcript, language, sessionType, persona }),
        source: "fallback",
        warning: message,
      });
    }
    if (mode === "answer") {
      return NextResponse.json({
        ok: true,
        evaluation: evaluateAnswerFallback({
          question: body.question || "",
          answer: body.answer || "",
          language,
        }),
        warning: message,
      });
    }
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    model: getDefaultModel(),
  });
}

export type SessionType = "startup" | "business-case" | "thesis";
export type Language = "id" | "en";
export type PlanId = "free" | "pro" | "team";

export interface Calibration {
  sessionType: SessionType;
  duration: number; // seconds
  language: Language;
  persona: string;
  pitchNotes: string;
}

export interface FillerHit {
  word: string;
  count: number;
}

export interface Rewrite {
  original: string;
  sharper: string;
  reason: string;
}

export interface NarrativeCheck {
  problem: boolean;
  solution: boolean;
  businessModel: boolean;
  note: string;
}

export interface AuditResult {
  deliveryScore: number;
  readinessScore: number;
  wpm: number;
  wordCount: number;
  fillerCount: number;
  fillers: FillerHit[];
  rewrites: Rewrite[];
  narrative: NarrativeCheck;
  feedback: string;
  strengths: string[];
  improvements: string[];
  source: "gemini" | "fallback";
}

export interface QAQuestion {
  id: string;
  question: string;
  intent: string;
  difficulty: "ringan" | "menengah" | "berat";
}

export interface QAEvaluation {
  question: string;
  answer: string;
  score: number;
  feedback: string;
  goldenAnswer: string;
}

export interface SessionReport {
  id: string;
  createdAt: number;
  mode: "guest" | "account";
  ownerId: string;
  calibration: Calibration;
  transcript: string;
  audit: AuditResult;
  questions: QAQuestion[];
  qaResults: QAEvaluation[];
  overallScore: number;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string; // local-only demo auth, never send to a real backend
  createdAt: number;
  plan: PlanId;
  sessions: SessionReport[];
  guestMigrated: boolean;
}

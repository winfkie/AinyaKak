import path from "node:path";

export interface PaymentRecord {
  orderId: string;
  planId: string;
  planName: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  status: string;
  qrString: string | null;
  qrImageUrl: string | null;
  createdAt: number;
  paidAt?: number;
  payload: Record<string, unknown>;
  upstreamMessage?: string;
}

/**
 * Tiny persistence layer for QRIS orders.
 * - Memory map keeps the flow working on serverless/edge runtimes.
 * - A JSON file under `.pethron-data/` survives dev-server restarts locally.
 * A production deployment should swap this for a real database (see README).
 */
const globalStore = globalThis as unknown as { pethronPayments?: Map<string, PaymentRecord> };
const memory = globalStore.pethronPayments ?? new Map<string, PaymentRecord>();
globalStore.pethronPayments = memory;

const FILE_PATH = path.join(process.cwd(), ".pethron-data", "payments.json");

async function readFileStore(): Promise<PaymentRecord[]> {
  try {
    const fs = await import("node:fs/promises");
    const raw = await fs.readFile(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as PaymentRecord[]) : [];
  } catch {
    return [];
  }
}

async function writeFileStore(records: PaymentRecord[]): Promise<void> {
  try {
    const fs = await import("node:fs/promises");
    await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
    await fs.writeFile(FILE_PATH, JSON.stringify(records, null, 2), "utf8");
  } catch {
    // Read-only filesystem (serverless/edge): the memory store still serves the session.
  }
}

export async function savePayment(record: PaymentRecord): Promise<void> {
  memory.set(record.orderId, record);
  const records = await readFileStore();
  const next = records.filter((r) => r.orderId !== record.orderId);
  next.push(record);
  await writeFileStore(next);
}

export async function getPayment(orderId: string): Promise<PaymentRecord | null> {
  const cached = memory.get(orderId);
  if (cached) return cached;
  const records = await readFileStore();
  const found = records.find((r) => r.orderId === orderId) ?? null;
  if (found) memory.set(orderId, found);
  return found;
}

export async function updatePayment(
  orderId: string,
  patch: Partial<PaymentRecord>,
): Promise<PaymentRecord | null> {
  const existing = await getPayment(orderId);
  if (!existing) return null;
  const updated: PaymentRecord = { ...existing, ...patch };
  await savePayment(updated);
  return updated;
}

export type NormalizedStatus = "PENDING" | "PAID" | "EXPIRED" | "FAILED";

export function normalizePaymentStatus(raw: unknown): NormalizedStatus {
  const value = String(raw ?? "").toUpperCase().trim();
  if (!value) return "PENDING";
  if (["PAID", "SETTLED", "SUCCESS", "SUCCEEDED", "COMPLETED", "CAPTURED"].includes(value)) {
    return "PAID";
  }
  if (value.includes("EXPIRE")) return "EXPIRED";
  if (["FAILED", "DENIED", "CANCELLED", "CANCELED", "VOID", "REFUNDED"].includes(value)) {
    return "FAILED";
  }
  return "PENDING";
}

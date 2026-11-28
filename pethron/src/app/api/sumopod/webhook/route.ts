import { NextResponse } from "next/server";
import { normalizePaymentStatus, updatePayment } from "@/lib/payment-store";

export const dynamic = "force-dynamic";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function pickString(source: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

async function verifySignature(rawBody: string, header: string | null): Promise<boolean> {
  const secret = process.env.SUMOPOD_WEBHOOK_SECRET;
  if (!secret) return true; // Not configured yet: accept, but log a warning below.
  if (!header) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const hex = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return header === hex || header === `sha256=${hex}`;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature =
    request.headers.get("x-sumopod-signature") ||
    request.headers.get("x-callback-signature") ||
    request.headers.get("x-signature");

  if (!(await verifySignature(rawBody, signature))) {
    return NextResponse.json({ ok: false, error: "Signature tidak valid." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = asRecord(JSON.parse(rawBody));
  } catch {
    return NextResponse.json({ ok: false, error: "Payload bukan JSON." }, { status: 400 });
  }

  const data = asRecord(body.data ?? body);
  const orderId = pickString(data, ["order_id", "orderId", "external_id", "reference_id", "merchant_ref"]);
  if (!orderId) {
    return NextResponse.json({ ok: false, error: "order_id tidak ada di payload." }, { status: 400 });
  }

  const rawStatus = pickString(data, ["status", "transaction_status", "payment_status"]);
  const status = normalizePaymentStatus(rawStatus);
  const updated = await updatePayment(orderId, {
    status: rawStatus ? rawStatus.toUpperCase() : status,
    paidAt: status === "PAID" ? Date.now() : undefined,
  });

  if (!updated) {
    // Order might live on another instance (serverless). Acknowledge so Sumopod
    // does not retry forever, but flag it for observability.
    return NextResponse.json({ ok: true, orderId, status, known: false });
  }

  return NextResponse.json({ ok: true, orderId, status, known: true });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/sumopod/webhook",
    signatureConfigured: Boolean(process.env.SUMOPOD_WEBHOOK_SECRET),
  });
}

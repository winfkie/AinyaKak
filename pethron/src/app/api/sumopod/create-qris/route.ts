import { NextResponse } from "next/server";
import { PLANS } from "@/lib/plans";
import { savePayment, type PaymentRecord } from "@/lib/payment-store";
import type { PlanId } from "@/lib/types";

export const dynamic = "force-dynamic";

const BASE_URL = (process.env.SUMOPOD_BASE_URL || "https://api.sumopod.com/v1").replace(/\/+$/, "");
const CREATE_PATH = process.env.SUMOPOD_QRIS_PATH || "/qris/create";

interface CreateBody {
  planId?: PlanId;
  planName?: string;
  amount?: number;
  customerName?: string;
  customerEmail?: string;
}

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

function makeOrderId(planId: PlanId): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `PETHRON-${planId.toUpperCase()}-${stamp}-${rand}`;
}

export async function POST(request: Request) {
  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Body bukan JSON yang valid." }, { status: 400 });
  }

  const plan = PLANS.find((item) => item.id === body.planId && item.id !== "free");
  if (!plan) {
    return NextResponse.json(
      { ok: false, error: "Plan tidak valid. Pilih Pro Solo atau Team Pack." },
      { status: 400 },
    );
  }

  const customerName = (body.customerName || "").trim().slice(0, 80);
  const customerEmail = (body.customerEmail || "").trim().slice(0, 120);
  if (!customerName || !customerEmail) {
    return NextResponse.json(
      { ok: false, error: "Nama dan email wajib diisi buat nerbitin QRIS." },
      { status: 400 },
    );
  }

  const orderId = makeOrderId(plan.id);
  const origin = new URL(request.url).origin;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || origin).replace(/\/+$/, "");
  const amount = plan.price;

  const payload: Record<string, unknown> = {
    merchant_id: process.env.SUMOPOD_MERCHANT_ID || null,
    order_id: orderId,
    amount,
    currency: "IDR",
    payment_method: "QRIS",
    description: `Pethron ${plan.name} - 1 bulan`,
    customer: { name: customerName, email: customerEmail },
    callback_url: `${appUrl}/api/sumopod/webhook`,
    metadata: { planId: plan.id, planName: plan.name, product: "pethron" },
  };

  const baseRecord: PaymentRecord = {
    orderId,
    planId: plan.id,
    planName: plan.name,
    amount,
    customerName,
    customerEmail,
    status: "PENDING",
    qrString: null,
    qrImageUrl: null,
    createdAt: Date.now(),
    payload,
  };

  const apiKey = process.env.SUMOPOD_API_KEY;

  // No key yet: still return the exact request structure the app would send, so the
  // checkout screen can show a configuration banner instead of a dead end.
  if (!apiKey) {
    const record: PaymentRecord = {
      ...baseRecord,
      status: "CONFIG_MISSING",
      upstreamMessage: "SUMOPOD_API_KEY belum diisi di .env.local",
    };
    await savePayment(record);
    return NextResponse.json({
      ok: true,
      configMissing: true,
      orderId,
      planId: plan.id,
      planName: plan.name,
      amount,
      status: "CONFIG_MISSING",
      qrString: null,
      qrImageUrl: null,
      payload,
      message:
        "SUMOPOD_API_KEY belum ada. Isi dulu di .env.local, lalu restart dev server buat nerbitin QRIS beneran.",
    });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const response = await fetch(`${BASE_URL}${CREATE_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);

    const text = await response.text();
    let upstream: Record<string, unknown> = {};
    try {
      upstream = asRecord(JSON.parse(text));
    } catch {
      upstream = { raw: text.slice(0, 500) };
    }

    if (!response.ok) {
      const message =
        pickString(upstream, ["message", "error", "detail"]) ||
        `Sumopod menolak permintaan (HTTP ${response.status}).`;
      await savePayment({ ...baseRecord, status: "FAILED", upstreamMessage: message });
      return NextResponse.json(
        { ok: false, error: message, orderId, payload, upstream },
        { status: 502 },
      );
    }

    const data = asRecord(upstream.data ?? upstream);
    const qrString = pickString(data, [
      "qr_string",
      "qrString",
      "qris_string",
      "qr_payload",
      "qris_payload",
      "qr_content",
      "qr_code",
    ]);
    const qrImageUrl = pickString(data, [
      "qr_image_url",
      "qrImageUrl",
      "qr_url",
      "qrUrl",
      "qris_image_url",
      "image_url",
    ]);
    const rawStatus = pickString(data, ["status", "transaction_status", "payment_status"]);

    if (!qrString && !qrImageUrl) {
      const message = "Sumopod belum mengembalikan QRIS payload. Cek response mentah di bawah.";
      await savePayment({ ...baseRecord, status: "FAILED", upstreamMessage: message });
      return NextResponse.json(
        { ok: false, error: message, orderId, payload, upstream },
        { status: 502 },
      );
    }

    const record: PaymentRecord = {
      ...baseRecord,
      status: rawStatus ? rawStatus.toUpperCase() : "PENDING",
      qrString,
      qrImageUrl,
    };
    await savePayment(record);

    return NextResponse.json({
      ok: true,
      configMissing: false,
      orderId,
      planId: plan.id,
      planName: plan.name,
      amount,
      status: record.status,
      qrString,
      qrImageUrl,
      payload,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Sumopod timeout. Coba lagi sebentar."
        : error instanceof Error
          ? error.message
          : "Gagal menghubungi Sumopod.";
    await savePayment({ ...baseRecord, status: "FAILED", upstreamMessage: message });
    return NextResponse.json({ ok: false, error: message, orderId, payload }, { status: 502 });
  }
}

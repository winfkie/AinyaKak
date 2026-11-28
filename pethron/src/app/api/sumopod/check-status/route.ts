import { NextResponse } from "next/server";
import {
  getPayment,
  normalizePaymentStatus,
  updatePayment,
  type NormalizedStatus,
} from "@/lib/payment-store";

export const dynamic = "force-dynamic";

const BASE_URL = (process.env.SUMOPOD_BASE_URL || "https://api.sumopod.com/v1").replace(/\/+$/, "");
const STATUS_PATH = process.env.SUMOPOD_STATUS_PATH || "/qris/status/{orderId}";

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = (searchParams.get("orderId") || "").trim();
  if (!orderId) {
    return NextResponse.json({ ok: false, error: "orderId wajib dikirim." }, { status: 400 });
  }

  const local = await getPayment(orderId);
  if (!local) {
    return NextResponse.json({ ok: false, error: "Order tidak ditemukan." }, { status: 404 });
  }

  const apiKey = process.env.SUMOPOD_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      ok: true,
      orderId,
      status: normalizePaymentStatus(local.status),
      rawStatus: local.status,
      configMissing: true,
      paidAt: local.paidAt ?? null,
      message: "SUMOPOD_API_KEY belum diisi, status cuma bisa dibaca dari catatan lokal.",
    });
  }

  try {
    const url = `${BASE_URL}${STATUS_PATH.replace("{orderId}", encodeURIComponent(orderId))}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
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
      return NextResponse.json({
        ok: true,
        orderId,
        status: normalizePaymentStatus(local.status),
        rawStatus: local.status,
        paidAt: local.paidAt ?? null,
        warning:
          pickString(upstream, ["message", "error", "detail"]) ||
          `Sumopod status check gagal (HTTP ${response.status}).`,
      });
    }

    const data = asRecord(upstream.data ?? upstream);
    const rawStatus = pickString(data, ["status", "transaction_status", "payment_status"]);
    const status: NormalizedStatus = normalizePaymentStatus(rawStatus ?? local.status);
    const paidAt =
      status === "PAID" ? (local.paidAt ?? Date.now()) : local.paidAt;

    await updatePayment(orderId, {
      status: rawStatus ? rawStatus.toUpperCase() : local.status,
      paidAt,
    });

    return NextResponse.json({
      ok: true,
      orderId,
      status,
      rawStatus: rawStatus ?? local.status,
      paidAt: paidAt ?? null,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Sumopod timeout saat cek status."
        : error instanceof Error
          ? error.message
          : "Gagal cek status ke Sumopod.";
    return NextResponse.json({
      ok: true,
      orderId,
      status: normalizePaymentStatus(local.status),
      rawStatus: local.status,
      paidAt: local.paidAt ?? null,
      warning: message,
    });
  }
}

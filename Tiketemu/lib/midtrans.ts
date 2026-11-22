import "server-only";
import { createHash } from "crypto";

const isProd = process.env.MIDTRANS_IS_PRODUCTION === "true";
export const MIDTRANS_API = isProd ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com";
export const IS_SANDBOX = !isProd;

function authHeader() {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) throw new Error("MIDTRANS_SERVER_KEY belum diatur di environment.");
  return "Basic " + Buffer.from(key + ":").toString("base64");
}

async function panggil(path: string, init?: RequestInit) {
  const res = await fetch(MIDTRANS_API + path, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    cache: "no-store",
  });
  return res.json();
}

export type ChargeQris = {
  orderId: string;
  grossAmount: number;
  items: { id: string; price: number; quantity: number; name: string }[];
  customer: { first_name: string; email?: string };
  expiryMinutes: number;
};

/** Membuat transaksi QRIS lewat Midtrans Core API. */
export async function chargeQris(p: ChargeQris) {
  return panggil("/v2/charge", {
    method: "POST",
    body: JSON.stringify({
      payment_type: "qris",
      transaction_details: { order_id: p.orderId, gross_amount: p.grossAmount },
      item_details: p.items.map((i) => ({ ...i, name: i.name.slice(0, 50) })),
      customer_details: p.customer,
      qris: { acquirer: "gopay" },
      custom_expiry: { expiry_duration: p.expiryMinutes, unit: "minute" },
    }),
  });
}

/** Get Transaction Status: sumber kebenaran status pembayaran. */
export async function getStatus(orderId: string) {
  return panggil(`/v2/${encodeURIComponent(orderId)}/status`);
}

export async function cancelTransaksi(orderId: string) {
  return panggil(`/v2/${encodeURIComponent(orderId)}/cancel`, { method: "POST" });
}

/** signature_key = SHA512(order_id + status_code + gross_amount + ServerKey) */
export function verifikasiSignature(n: {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
}) {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key || !n.order_id || !n.status_code || !n.gross_amount || !n.signature_key) return false;
  const hitung = createHash("sha512")
    .update(n.order_id + n.status_code + n.gross_amount + key)
    .digest("hex");
  return hitung === n.signature_key;
}

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "edge";

interface SnapPayload {
  orderId: string;
  grossAmount: number;
  customerName: string;
  itemTitle: string;
}

export async function POST(req: NextRequest) {
  let body: SnapPayload;
  try {
    body = (await req.json()) as SnapPayload;
  } catch {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  const { orderId, grossAmount, customerName, itemTitle } = body;
  if (!orderId || typeof grossAmount !== "number") {
    return NextResponse.json({ error: "orderId & grossAmount wajib diisi" }, { status: 400 });
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    // Mode SIMULASI: jalankan alur checkout lengkap tanpa kredensial Midtrans.
    return NextResponse.json({ mode: "SIMULATION", orderId }, { status: 200 });
  }

  try {
    const auth = "Basic " + btoa(serverKey + ":");
    const res = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: auth
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: grossAmount
        },
        customer_details: {
          first_name: customerName || "Penyewa SILIH"
        },
        item_details: [
          {
            id: orderId,
            price: grossAmount,
            quantity: 1,
            name: (itemTitle || "Sewa Busana SILIH").slice(0, 50)
          }
        ],
        enabled_payments: ["gopay", "shopeepay", "qris", "bca_va", "bni_va", "bri_va", "permata_va"]
      })
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        { mode: "SIMULATION", orderId, upstreamError: detail.slice(0, 300) },
        { status: 200 }
      );
    }

    const data = (await res.json()) as { token?: string; redirect_url?: string };
    if (!data.token) {
      return NextResponse.json({ mode: "SIMULATION", orderId }, { status: 200 });
    }
    return NextResponse.json({ token: data.token, redirect_url: data.redirect_url }, { status: 200 });
  } catch {
    return NextResponse.json({ mode: "SIMULATION", orderId }, { status: 200 });
  }
}

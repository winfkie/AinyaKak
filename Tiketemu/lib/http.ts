import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export function ok(data: unknown = { ok: true }, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(pesan: string, status = 400) {
  return NextResponse.json({ error: pesan }, { status });
}

/** Ambil user yang login di API route, atau null. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

const MAKS_FILE = 4 * 1024 * 1024; // 4MB (batas body Vercel 4.5MB)
const TIPE_FILE = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function cekFile(file: unknown, wajib: boolean): File | null | string {
  if (!(file instanceof File) || file.size === 0) return wajib ? "File wajib diunggah." : null;
  if (file.size > MAKS_FILE) return "Ukuran file maksimal 4MB.";
  if (!TIPE_FILE.includes(file.type)) return "Format file harus JPG, PNG, WEBP, atau PDF.";
  return file;
}

export function namaFileAman(file: File) {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
}

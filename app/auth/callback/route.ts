import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Tujuan link konfirmasi email dari Supabase.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/", url.origin));
}

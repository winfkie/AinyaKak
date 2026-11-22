"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/";
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setLoading(true);
    setErr("");
    const { error } = await createClient().auth.signInWithPassword({
      email: String(f.get("email")).trim(),
      password: String(f.get("password")),
    });
    setLoading(false);
    if (error) {
      return setErr(
        error.message.includes("Email not confirmed")
          ? "Email belum dikonfirmasi. Cek kotak masuk email kamu."
          : "Email atau password salah."
      );
    }
    router.push(next.startsWith("/") ? next : "/");
    router.refresh();
  }

  return (
    <div className="card">
      <h1 className="text-2xl font-extrabold">Masuk</h1>
      <p className="mb-5 text-sm text-zinc-500">Selamat datang kembali di Ticketix.</p>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" required className="input" />
        </div>
        <div>
          <label className="label">Password</label>
          <input name="password" type="password" required className="input" />
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button disabled={loading} className="btn-primary w-full">{loading ? "Memproses…" : "Masuk"}</button>
      </form>
      <p className="mt-4 text-center text-sm text-zinc-500">
        Belum punya akun? <Link href="/daftar" className="font-semibold text-brand-600">Daftar</Link>
      </p>
    </div>
  );
}

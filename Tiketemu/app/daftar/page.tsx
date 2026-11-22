"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Daftar() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const nama = String(f.get("nama")).trim();
    const email = String(f.get("email")).trim();
    const password = String(f.get("password"));
    if (password.length < 6) return setErr("Password minimal 6 karakter.");

    setLoading(true);
    setErr("");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nama }, emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) return setErr(error.message);
    if (data.session) {
      router.push("/");
      router.refresh();
    } else {
      setInfo("Akun dibuat! Cek email kamu dan klik link konfirmasi, lalu masuk.");
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="text-2xl font-extrabold">Daftar akun</h1>
        <p className="mb-5 text-sm text-zinc-500">Satu akun untuk menjual dan membeli tiket.</p>
        {info ? (
          <p className="rounded-xl bg-green-50 p-4 text-sm text-green-800">{info}</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="label">Nama lengkap</label>
              <input name="nama" required minLength={2} className="input" />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" required className="input" />
            </div>
            <div>
              <label className="label">Password</label>
              <input name="password" type="password" required minLength={6} className="input" />
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <button disabled={loading} className="btn-primary w-full">{loading ? "Memproses…" : "Daftar"}</button>
          </form>
        )}
        <p className="mt-4 text-center text-sm text-zinc-500">
          Sudah punya akun? <Link href="/login" className="font-semibold text-brand-600">Masuk</Link>
        </p>
      </div>
    </div>
  );
}

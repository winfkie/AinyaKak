"use client";

import { RotateCcw, User, Shirt, Truck, ShieldCheck } from "lucide-react";
import { useSilih } from "@/context/SilihContext";

type Role = "RENTER" | "OWNER" | "COURIER" | "ADMIN";

const ROLES: { id: Role; label: string; icon: React.ReactNode }[] = [
  { id: "RENTER", label: "Penyewa", icon: <User size={16} /> },
  { id: "OWNER", label: "Pemilik Baju", icon: <Shirt size={16} /> },
  { id: "COURIER", label: "Kurir", icon: <Truck size={16} /> },
  { id: "ADMIN", label: "Admin", icon: <ShieldCheck size={16} /> }
];

export default function TopBar() {
  const { currentRole, currentProfile, setRole, resetData } = useSilih();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F172A] text-[#059669]">
              <Shirt size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-[#0F172A]">SILIH</h1>
              <p className="text-[11px] text-slate-500">
                Pinjam &amp; Bertukar Busana Mahasiswa • Tembalang &amp; Banyumanik
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {ROLES.map((r) => {
              const active = currentRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? "border-[#0F172A] bg-[#0F172A] text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {r.icon}
                  {r.label}
                </button>
              );
            })}
            <button
              onClick={resetData}
              title="Reset Data Demo"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <RotateCcw size={14} />
              Reset Data Demo
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
          <span className="badge bg-slate-100 text-slate-700">
            {currentProfile.name}
          </span>
          <span className="badge bg-emerald-50 text-[#059669]">
            {currentProfile.addressDetail}
          </span>
        </div>
      </div>
    </header>
  );
}

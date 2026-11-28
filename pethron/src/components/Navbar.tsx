"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { BarChart3, CreditCard, Home, LogOut, Mic, Sparkles } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { planLabel } from "@/lib/plans";
import { BrandLogo } from "./BrandLogo";

const LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/studio", label: "Studio", icon: Mic },
  { href: "/history", label: "History", icon: BarChart3 },
  { href: "/pricing", label: "Pricing", icon: CreditCard },
];

export default function Navbar() {
  const pathname = usePathname();
  const { account, isLoggedIn, openAuth, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-white/80 glass shadow-[0_4px_24px_rgba(37,99,235,0.08)]">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="shrink-0">
          <BrandLogo href="/" size="md" showTag />
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide rounded-full glass-pill p-1">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  active ? "text-white" : "text-muted hover:text-cobalt"
                }`}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-active"
                    transition={{ type: "spring", stiffness: 280, damping: 24 }}
                    className="absolute inset-0 rounded-full y2k-gradient shadow-[0_4px_14px_rgba(37,99,235,0.28)]"
                  />
                ) : null}
                <link.icon className="relative h-4 w-4 sm:hidden" />
                <span className="relative hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {isLoggedIn && account ? (
            <>
              <span className="hidden items-center gap-1 rounded-full border border-white/90 bg-cobalt-soft/85 px-2.5 py-1 text-xs font-bold text-cobalt shadow-sm sm:flex">
                <Sparkles className="h-3 w-3 text-magenta" /> {planLabel(account.plan)}
              </span>
              <span className="hidden max-w-[140px] truncate text-sm font-semibold text-ink md:inline">
                {account.name}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-full p-2 text-muted transition hover:bg-white/80 hover:text-magenta cursor-pointer"
                aria-label="Keluar dari akun"
                title="Keluar"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => openAuth("login")}
                className="hidden rounded-full px-3.5 py-2 text-sm font-semibold text-muted transition hover:text-cobalt sm:inline-flex cursor-pointer"
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => openAuth("register")}
                className="inline-flex items-center gap-1.5 rounded-full y2k-gradient px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(37,99,235,0.28)] transition hover:scale-[1.02] hover:shadow-[0_8px_22px_rgba(236,72,153,0.34)] cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Gas Latihan
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

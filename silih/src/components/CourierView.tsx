"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  BellRing,
  Download,
  Wallet,
  Truck,
  PackageCheck,
  PackageOpen,
  MapPin,
  Clock,
  MessageCircle,
  ArrowRight,
  Volume2,
  X
} from "lucide-react";
import { useSilih } from "@/context/SilihContext";
import { SectionTitle, StatCard } from "@/components/shared";
import ChatDrawer from "@/components/ChatDrawer";
import { getZone } from "@/lib/pricing";
import { rupiah, shortDate } from "@/lib/format";
import type { CourierTask } from "@/types/silih";

export default function CourierView() {
  const {
    courierTasks,
    orders,
    currentProfile,
    courierBalance,
    soundEnabled,
    toggleSound,
    takeTask,
    advanceTask
  } = useSilih();

  const [installable, setInstallable] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [chatTask, setChatTask] = useState<CourierTask | null>(null);
  const prevOpen = useRef(0);

  const openTasks = courierTasks.filter((t) => t.status === "OPEN");
  const myActive = courierTasks.filter(
    (t) => t.courierName === currentProfile.name && t.status !== "COMPLETED"
  );

  const deliveryOpen = openTasks.filter((t) => t.type === "DELIVERY");
  const returnOpen = openTasks.filter((t) => t.type === "RETURN");

  function playDing() {
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const now = ctx.currentTime;
      [880, 1320].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const t = now + i * 0.12;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.4);
      });
      setTimeout(() => ctx.close().catch(() => {}), 900);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      window.__silihInstallPrompt = e as BeforeInstallPromptEvent;
      setInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (soundEnabled && openTasks.length > prevOpen.current) {
      playDing();
      try {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("SILIH — Tiket Tugas Baru!", {
            body: "Ada tiket antar/jemput baru di radar kurir. Segera ambil tugas."
          });
        }
      } catch {
        // ignore
      }
    }
    prevOpen.current = openTasks.length;
  }, [openTasks.length, soundEnabled]);

  async function enableNotifications() {
    try {
      if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
        await Notification.requestPermission();
      }
    } catch {
      // ignore
    }
    if (!soundEnabled) toggleSound();
    playDing();
  }

  async function installApp() {
    const p = window.__silihInstallPrompt;
    if (p) {
      await p.prompt();
      window.__silihInstallPrompt = undefined;
      setInstallable(false);
    } else {
      setShowGuide(true);
    }
  }

  function actionLabel(task: CourierTask): string {
    if (task.type === "DELIVERY") {
      return task.status === "ASSIGNED_PICKING_UP"
        ? "Tiba di Lokasi Pemilik & Ambil Baju"
        : "Serahkan Baju ke Penyewa (Selesai Antar)";
    }
    return task.status === "ASSIGNED_PICKING_UP"
      ? "Tiba di Lokasi Penyewa & Jemput Baju"
      : "Kembalikan Baju ke Pemilik (Selesai Sewa)";
  }

  return (
    <div className="space-y-6">
      {/* Notification & PWA banner */}
      <section className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#059669]">
            {soundEnabled ? <BellRing size={20} /> : <Bell size={20} />}
          </div>
          <div>
            <p className="text-sm font-bold text-[#0F172A]">Radar Tugas Kurir</p>
            <p className="text-[11px] text-slate-500">
              Aktifkan notifikasi suara &amp; pop-up agar tidak melewatkan tiket baru.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={enableNotifications}
            className={soundEnabled ? "btn-accent text-xs" : "btn-primary text-xs"}
          >
            <Volume2 size={14} />
            {soundEnabled ? "Notifikasi Aktif" : "Aktifkan Notifikasi Suara & Pop-up Browser"}
          </button>
          <button onClick={installApp} className="btn-ghost text-xs">
            <Download size={14} /> Install Aplikasi (PWA)
          </button>
        </div>
      </section>

      <StatCard
        label="Dompet Kurir Mahasiswa"
        value={rupiah(courierBalance)}
        hint="Total pendapatan bersih yang sudah cair dari tugas antar & jemput selesai."
        tone="accent"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Radar: DELIVERY */}
        <div className="space-y-3">
          <SectionTitle
            icon={<PackageOpen size={16} />}
            title="Bursa Tugas — Antar Awal"
            subtitle={`${deliveryOpen.length} tiket menunggu kurir`}
          />
          {deliveryOpen.length === 0 && (
            <div className="card py-10 text-center text-xs text-slate-400">
              Belum ada tiket antar. Tiket muncul setelah penyewa membayar pesanan.
            </div>
          )}
          {deliveryOpen.map((t) => (
            <TaskCard key={t.id} task={t} onTake={() => takeTask(t.id)} />
          ))}
        </div>

        {/* Radar: RETURN */}
        <div className="space-y-3">
          <SectionTitle
            icon={<PackageCheck size={16} />}
            title="Bursa Tugas — Jemput Balik"
            subtitle={`${returnOpen.length} tiket menunggu kurir`}
          />
          {returnOpen.length === 0 && (
            <div className="card py-10 text-center text-xs text-slate-400">
              Belum ada tiket jemput. Muncul saat penyewa mengajukan penjemputan kembali.
            </div>
          )}
          {returnOpen.map((t) => (
            <TaskCard key={t.id} task={t} onTake={() => takeTask(t.id)} />
          ))}
        </div>
      </div>

      {/* Active tasks */}
      <div className="space-y-3">
        <SectionTitle
          icon={<Truck size={16} />}
          title="Panel Tugas Aktif"
          subtitle="Selesaikan langkah demi langkah. Upah cair otomatis saat tugas tuntas."
        />
        {myActive.length === 0 && (
          <div className="card py-10 text-center text-xs text-slate-400">
            Belum ada tugas aktif. Ambil tiket dari radar di atas.
          </div>
        )}
        {myActive.map((task) => {
          const order = orders.find((o) => o.id === task.orderId);
          return (
            <article key={task.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`badge ${
                      task.type === "DELIVERY"
                        ? "bg-emerald-50 text-[#059669]"
                        : "bg-amber-50 text-[#D97706]"
                    }`}
                  >
                    {task.type === "DELIVERY" ? "ANTAR AWAL" : "JEMPUT BALIK"}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {task.status === "ASSIGNED_PICKING_UP" ? "Menuju Lokasi" : "Dalam Perjalanan"}
                  </span>
                </div>
                <span className="text-sm font-bold text-[#059669]">{rupiah(task.fee)}</span>
              </div>

              <p className="mt-2 text-sm font-bold text-[#0F172A]">{task.itemTitle}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                <MapPin size={12} />
                <span className="font-semibold text-slate-700">{task.pickupName}</span>
                <span>({getZone(task.pickupZone).label})</span>
                <ArrowRight size={12} />
                <span className="font-semibold text-slate-700">{task.dropoffName}</span>
                <span>({getZone(task.dropoffZone).label})</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                {task.pickupAddress} → {task.dropoffAddress}
              </p>
              {task.meetingNotes && (
                <p className="mt-1 text-[11px] italic text-slate-400">Catatan: {task.meetingNotes}</p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => advanceTask(task.id)} className="btn-accent text-xs">
                  <Truck size={14} /> {actionLabel(task)}
                </button>
                <button onClick={() => setChatTask(task)} className="btn-ghost text-xs">
                  <MessageCircle size={14} /> Chat Pihak Terkait
                </button>
              </div>
              {order && (
                <p className="mt-2 text-[10px] text-slate-400">Order {order.id}</p>
              )}
            </article>
          );
        })}
      </div>

      {chatTask && (
        <ChatDrawer
          referenceId={chatTask.orderId}
          channel={chatTask.type === "DELIVERY" ? "DELIVERY_COURIER" : "RETURN_COURIER"}
          title={`Chat — ${chatTask.itemTitle}`}
          subtitle="Koordinasi dengan penyewa & pemilik baju"
          quickChips={[
            "Kak, saya sudah di depan gang kos ya",
            "Saya otw ke titik temu sesuai jadwal",
            "Titip di pos satpam sesuai catatan ya kak"
          ]}
          onClose={() => setChatTask(null)}
        />
      )}

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-bold text-[#0F172A]">Install SILIH ke Perangkat</h3>
              <button
                onClick={() => setShowGuide(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>
            <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-xs text-slate-600">
              <li>Buka menu browser (ikon ⋮ atau titik tiga).</li>
              <li>Pilih <span className="font-semibold">“Add to Home Screen”</span> / “Instal aplikasi”.</li>
              <li>Konfirmasi. Ikon SILIH muncul di layar utama.</li>
            </ol>
            <p className="mt-3 text-[11px] text-slate-400">
              {installable
                ? "Browser mendukung instalasi otomatis — klik tombol Install lagi bila prompt muncul."
                : "Fitur prompt otomatis belum tersedia di browser ini, ikuti panduan manual di atas."}
            </p>
            <button onClick={() => setShowGuide(false)} className="btn-primary mt-4 w-full text-xs">
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onTake }: { task: CourierTask; onTake: () => void }) {
  return (
    <article className="card p-4">
      <div className="flex items-center justify-between">
        <span
          className={`badge ${
            task.type === "DELIVERY" ? "bg-emerald-50 text-[#059669]" : "bg-amber-50 text-[#D97706]"
          }`}
        >
          {task.type === "DELIVERY" ? "ANTAR AWAL" : "JEMPUT BALIK"}
        </span>
        <span className="badge bg-slate-100 text-slate-600">
          <Clock size={12} />
          {task.scheduleType === "INSTANT"
            ? "INSTAN SEKARANG"
            : `TERJADWAL: ${shortDate(task.scheduledDate)}, ${task.scheduledTimeSlot} WIB`}
        </span>
      </div>

      <p className="mt-2 text-sm font-bold text-[#0F172A]">{task.itemTitle}</p>

      <div className="mt-2 space-y-1 text-[11px] text-slate-500">
        <p className="flex items-center gap-1">
          <MapPin size={12} className="text-[#059669]" />
          <span className="font-semibold text-slate-700">{task.pickupName}</span> •{" "}
          {getZone(task.pickupZone).label} — {task.pickupAddress}
        </p>
        <p className="flex items-center gap-1">
          <MapPin size={12} className="text-[#D97706]" />
          <span className="font-semibold text-slate-700">{task.dropoffName}</span> •{" "}
          {getZone(task.dropoffZone).label} — {task.dropoffAddress}
        </p>
      </div>

      {task.meetingNotes && (
        <p className="mt-1.5 text-[11px] italic text-slate-400">Catatan: {task.meetingNotes}</p>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Upah bersih</p>
          <p className="text-sm font-bold text-[#059669]">{rupiah(task.fee)}</p>
        </div>
        <button onClick={onTake} className="btn-primary text-xs">
          Ambil Tugas Ini
        </button>
      </div>
    </article>
  );
}

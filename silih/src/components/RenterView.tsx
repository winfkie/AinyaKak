"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Store,
  MessagesSquare,
  ClipboardList,
  Plus,
  MapPin,
  CalendarDays,
  Wallet,
  Truck,
  Send,
  ChevronRight,
  Package,
  RotateCw
} from "lucide-react";
import { useSilih } from "@/context/SilihContext";
import {
  ItemCard,
  ItemImage,
  ZoneBadge,
  STATUS_META,
  ORDER_STEPS,
  SectionTitle
} from "@/components/shared";
import ChatDrawer from "@/components/ChatDrawer";
import CheckoutModal from "@/components/CheckoutModal";
import { getZone, getSubAreas } from "@/lib/pricing";
import { rupiah, shortDate, timeAgo, todayISO } from "@/lib/format";
import type { ClothingItem, ZoneId } from "@/types/silih";

type Tab = "catalog" | "menfess" | "orders";

export default function RenterView() {
  const {
    items,
    menfess,
    orders,
    courierTasks,
    currentProfile,
    createMenfess,
    requestReturn,
    acceptDeal
  } = useSilih();

  const [tab, setTab] = useState<Tab>("catalog");
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Semua");
  const [size, setSize] = useState("Semua");
  const [zoneFilter, setZoneFilter] = useState("Semua");

  const [chatItem, setChatItem] = useState<ClothingItem | null>(null);
  const [checkout, setCheckout] = useState<{ item: ClothingItem; days?: number; price?: number } | null>(
    null
  );
  const [courierChat, setCourierChat] = useState<{
    orderId: string;
    channel: "DELIVERY_COURIER" | "RETURN_COURIER";
    title: string;
  } | null>(null);

  const [mContent, setMContent] = useState("");
  const [mBudget, setMBudget] = useState(30000);
  const [mDate, setMDate] = useState(todayISO());
  const [mZone, setMZone] = useState<ZoneId>(currentProfile.zone);
  const [mSubArea, setMSubArea] = useState(currentProfile.subArea);

  const filtered = useMemo(
    () =>
      items.filter((i) => {
        const matchSearch =
          !search ||
          i.title.toLowerCase().includes(search.toLowerCase()) ||
          i.ownerName.toLowerCase().includes(search.toLowerCase());
        const matchCat = cat === "Semua" || i.category === cat;
        const matchSize = size === "Semua" || i.size === size;
        const matchZone = zoneFilter === "Semua" || getZone(i.zone).label === zoneFilter;
        return matchSearch && matchCat && matchSize && matchZone;
      }),
    [items, search, cat, size, zoneFilter]
  );

  const myOrders = orders.filter((o) => o.renterName === currentProfile.name);
  const activeOrders = myOrders.filter((o) => o.status !== "COMPLETED").length;

  function submitMenfess() {
    if (!mContent.trim()) return;
    createMenfess({
      authorName: currentProfile.name,
      zone: mZone,
      subArea: mSubArea,
      content: mContent.trim(),
      budgetPerDay: mBudget,
      neededDate: mDate
    });
    setMContent("");
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-[#0F172A] px-5 py-6 text-white sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#059669]">
              Tembalang &amp; Banyumanik • Semarang
            </p>
            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
              Pinjam &amp; Bertukar Busana Mahasiswa
            </h2>
            <p className="mt-1 max-w-lg text-sm text-slate-300">
              Sewa jas, kebaya, batik &amp; dress dari tetangga kos. Diantar &amp; dijemput kurir
              mahasiswa, dana aman di escrow.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-center">
              <p className="text-lg font-bold text-[#059669]">{items.length}</p>
              <p className="text-[10px] text-slate-300">Busana</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-center">
              <p className="text-lg font-bold text-[#059669]">3</p>
              <p className="text-[10px] text-slate-300">Zona</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-center">
              <p className="text-lg font-bold text-[#059669]">{activeOrders}</p>
              <p className="text-[10px] text-slate-300">Pesanan Aktif</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {(
          [
            { id: "catalog" as Tab, label: "Etalase Busana Ready", icon: <Store size={15} /> },
            { id: "menfess" as Tab, label: "Menfess Cari Baju", icon: <MessagesSquare size={15} /> },
            {
              id: "orders" as Tab,
              label: "Pesanan Saya",
              icon: <ClipboardList size={15} />
            }
          ]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
              tab === t.id
                ? "bg-[#0F172A] text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.icon}
            {t.label}
            {t.id === "orders" && activeOrders > 0 && (
              <span className="ml-1 rounded-full bg-[#059669] px-1.5 py-0.5 text-[10px] font-bold text-white">
                {activeOrders}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "catalog" && (
        <div className="space-y-4">
          <div className="card p-3">
            <div className="grid gap-2 md:grid-cols-4">
              <div className="relative md:col-span-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input pl-9"
                  placeholder="Cari nama baju / pemilik…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select className="input" value={cat} onChange={(e) => setCat(e.target.value)}>
                <option value="Semua">Semua Kategori</option>
                <option value="Jas & Blazer">Jas &amp; Blazer</option>
                <option value="Kebaya & Batik">Kebaya &amp; Batik</option>
                <option value="Dress & Formal">Dress &amp; Formal</option>
                <option value="Kostum & Almamater">Kostum &amp; Almamater</option>
              </select>
              <select className="input" value={size} onChange={(e) => setSize(e.target.value)}>
                <option value="Semua">Semua Ukuran</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
              </select>
              <select
                className="input"
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
              >
                <option value="Semua">Semua Zona</option>
                <option value="Zona 1">Zona 1 — Tembalang Inti</option>
                <option value="Zona 2">Zona 2 — Tembalang Sekitar</option>
                <option value="Zona 3">Zona 3 — Banyumanik</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Menampilkan <span className="font-semibold text-[#0F172A]">{filtered.length}</span>{" "}
              busana
            </p>
            <button
              onClick={() => {
                setSearch("");
                setCat("Semua");
                setSize("Semua");
                setZoneFilter("Semua");
              }}
              className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#0F172A]"
            >
              <RotateCw size={12} /> Reset Filter
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onChat={() => setChatItem(item)}
                onRent={() => setCheckout({ item })}
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="py-12 text-center text-sm text-slate-400">
              Tidak ada busana yang cocok dengan filter.
            </p>
          )}
        </div>
      )}

      {tab === "menfess" && (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="card h-fit p-4">
            <SectionTitle
              icon={<Plus size={16} />}
              title="Buat Menfess"
              subtitle="Cari baju yang kamu butuhkan, biar pemilik baju yang menawarkan."
            />
            <div className="space-y-3">
              <div>
                <label className="label">Kebutuhan Baju</label>
                <textarea
                  className="input min-h-[90px] resize-none"
                  placeholder="Contoh: Butuh kebaya wisuda warna netral, ukuran M…"
                  value={mContent}
                  onChange={(e) => setMContent(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Zona</label>
                  <select
                    className="input"
                    value={mZone}
                    onChange={(e) => {
                      const z = e.target.value as ZoneId;
                      setMZone(z);
                      setMSubArea(getSubAreas(z)[0]);
                    }}
                  >
                    <option value="ZONA_1">Zona 1</option>
                    <option value="ZONA_2">Zona 2</option>
                    <option value="ZONA_3">Zona 3</option>
                  </select>
                </div>
                <div>
                  <label className="label">Sub-Area</label>
                  <select
                    className="input"
                    value={mSubArea}
                    onChange={(e) => setMSubArea(e.target.value)}
                  >
                    {getSubAreas(mZone).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Budget / Hari</label>
                  <input
                    type="number"
                    className="input"
                    value={mBudget}
                    onChange={(e) => setMBudget(Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="label">Tanggal Butuh</label>
                  <input
                    type="date"
                    className="input"
                    value={mDate}
                    onChange={(e) => setMDate(e.target.value)}
                  />
                </div>
              </div>
              <button onClick={submitMenfess} className="btn-primary w-full">
                <Send size={15} /> Posting Menfess
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <SectionTitle
              icon={<MessagesSquare size={16} />}
              title="Feed Menfess Mahasiswa"
              subtitle="Balasan pemilik baju langsung tertaut ke produk yang bisa disewa."
            />
            {menfess.map((post) => (
              <article key={post.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-[#0F172A]">
                      {post.authorName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0F172A]">{post.authorName}</p>
                      <p className="text-[10px] text-slate-400">
                        {post.subArea}, {getZone(post.zone).label} • {timeAgo(post.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className="badge bg-slate-100 text-slate-600">
                    <Wallet size={12} /> {rupiah(post.budgetPerDay)}/hari
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-700">{post.content}</p>
                <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                  <CalendarDays size={12} /> Dibutuhkan: {shortDate(post.neededDate)}
                </p>

                {post.replies.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                    {post.replies.map((r) => {
                      const item = items.find((i) => i.id === r.clothingItemId);
                      return (
                        <div key={r.id} className="rounded-xl border border-slate-200 p-2.5">
                          <p className="text-[11px] text-slate-500">
                            <span className="font-semibold text-[#0F172A]">{r.ownerName}</span>{" "}
                            menawarkan:
                          </p>
                          {item ? (
                            <div className="mt-2 flex items-center gap-3">
                              <ItemImage
                                src={item.imageUrl}
                                alt={item.title}
                                className="h-12 w-12 rounded-lg object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-[#0F172A]">
                                  {item.title}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  {rupiah(item.pricePerDay)}/hari • {item.size} •{" "}
                                  {getZone(item.zone).label}
                                </p>
                              </div>
                              <button
                                onClick={() => setCheckout({ item })}
                                className="btn-accent shrink-0 px-2.5 py-1.5 text-[11px]"
                              >
                                Sewa Produk Ini
                              </button>
                            </div>
                          ) : (
                            <p className="mt-1 text-[11px] text-slate-400">Produk tidak tersedia.</p>
                          )}
                          <p className="mt-1.5 text-[11px] italic text-slate-500">“{r.message}”</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            ))}
            {menfess.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-400">
                Belum ada menfess. Jadilah yang pertama!
              </p>
            )}
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-4">
          <SectionTitle
            icon={<ClipboardList size={16} />}
            title="Pesanan Saya"
            subtitle="Pantau progres antar, sewa, dan penjemputan kembali."
          />
          {myOrders.length === 0 && (
            <div className="card flex flex-col items-center gap-2 py-16 text-center">
              <Package size={28} className="text-slate-300" />
              <p className="text-sm text-slate-500">Belum ada pesanan.</p>
              <button onClick={() => setTab("catalog")} className="btn-ghost text-xs">
                Mulai sewa busana
              </button>
            </div>
          )}

          {myOrders.map((order) => {
            const idx = ORDER_STEPS.findIndex((s) => s.key === order.status);
            const pct = ((idx + 1) / ORDER_STEPS.length) * 100;
            const tasks = courierTasks.filter((t) => t.orderId === order.id);
            const delTask = tasks.find((t) => t.type === "DELIVERY");
            const retTask = tasks.find((t) => t.type === "RETURN");
            const meta = STATUS_META[order.status];

            return (
              <article key={order.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ItemImage
                      src={order.itemImage}
                      alt={order.itemTitle}
                      className="h-14 w-14 rounded-xl object-cover"
                    />
                    <div>
                      <p className="text-sm font-bold text-[#0F172A]">{order.itemTitle}</p>
                      <p className="text-[11px] text-slate-500">
                        {shortDate(order.startDate)} → {shortDate(order.endDate)} •{" "}
                        {order.durationDays} hari
                      </p>
                      <p className="text-[11px] text-slate-400">Order {order.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${meta.tone}`}>{meta.label}</span>
                    <p className="mt-1 text-sm font-bold text-[#059669]">{rupiah(order.grandTotal)}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-4">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#059669] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400">
                    {ORDER_STEPS.map((s, i) => (
                      <span
                        key={s.key}
                        className={i <= idx ? "font-semibold text-[#059669]" : ""}
                      >
                        {s.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {delTask?.courierName && (
                    <button
                      onClick={() =>
                        setCourierChat({
                          orderId: order.id,
                          channel: "DELIVERY_COURIER",
                          title: `Chat Kurir Antar — ${delTask.courierName}`
                        })
                      }
                      className="btn-ghost text-xs"
                    >
                      <Truck size={14} /> Chat Kurir Antar
                    </button>
                  )}
                  {retTask?.courierName && (
                    <button
                      onClick={() =>
                        setCourierChat({
                          orderId: order.id,
                          channel: "RETURN_COURIER",
                          title: `Chat Kurir Jemput — ${retTask.courierName}`
                        })
                      }
                      className="btn-ghost text-xs"
                    >
                      <Truck size={14} /> Chat Kurir Jemput
                    </button>
                  )}
                  {order.status === "ACTIVE_RENTAL" && (
                    <button onClick={() => requestReturn(order.id)} className="btn-warn text-xs">
                      <RotateCw size={14} /> Ajukan Penjemputan Kembali Sekarang
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setCheckout({
                        item:
                          items.find((i) => i.id === order.itemId) ?? {
                            id: order.itemId,
                            title: order.itemTitle,
                            category: "Jas & Blazer",
                            size: "M",
                            pricePerDay: order.rentalTotal / order.durationDays,
                            maxDays: 5,
                            ownerName: order.ownerName,
                            zone: order.ownerZone,
                            subArea: order.ownerSubArea,
                            addressDetail: order.ownerAddressDetail,
                            imageUrl: order.itemImage,
                            description: "",
                            isAvailable: true,
                            availableUntilText: ""
                          }
                      })
                    }
                    className="btn-ghost text-xs"
                  >
                    Sewa Lagi
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-500 sm:grid-cols-4">
                  <div>
                    <p className="font-semibold text-slate-700">Sewa</p>
                    <p>{rupiah(order.rentalTotal)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Ongkir 2 arah</p>
                    <p>{rupiah(order.totalShippingFee)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Platform</p>
                    <p>{rupiah(order.platformFee)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Jadwal jemput</p>
                    <p>
                      {shortDate(order.returnSchedule.date)} {order.returnSchedule.timeSlot}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {chatItem && (
        <ChatDrawer
          referenceId={chatItem.id}
          channel="NEGOTIATION"
          title={`Nego — ${chatItem.title}`}
          subtitle={`${chatItem.ownerName} • ${chatItem.subArea}, ${getZone(chatItem.zone).label}`}
          quickChips={[
            "Kak, ready buat besok?",
            "Bisa nego kalau sewa 3 hari?",
            "Detail LD/panjang bajunya kak?"
          ]}
          onClose={() => setChatItem(null)}
          onAcceptDeal={(chatId, days, price) => {
            acceptDeal(chatId);
            setChatItem(null);
            setCheckout({ item: chatItem, days, price });
          }}
        />
      )}

      {checkout && (
        <CheckoutModal
          item={checkout.item}
          lockedDays={checkout.days}
          lockedPrice={checkout.price}
          onClose={() => setCheckout(null)}
          onPaid={() => setTab("orders")}
        />
      )}

      {courierChat && (
        <ChatDrawer
          referenceId={courierChat.orderId}
          channel={courierChat.channel}
          title={courierChat.title}
          subtitle="Koordinasi titik temu dengan kurir mahasiswa"
          quickChips={["Sudah sampai mana kak?", "Titip di pos satpam ya kak", "Terima kasih kak!"]}
          onClose={() => setCourierChat(null)}
        />
      )}
    </div>
  );
}

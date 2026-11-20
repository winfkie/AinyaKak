"use client";

import { useMemo, useState } from "react";
import {
  Wallet,
  Lock,
  Plus,
  Shirt,
  MessagesSquare,
  Handshake,
  Send,
  ToggleLeft,
  ToggleRight,
  ImagePlus,
  BadgeCheck
} from "lucide-react";
import { useSilih } from "@/context/SilihContext";
import { SectionTitle, StatCard, ItemImage, ZoneBadge } from "@/components/shared";
import ChatDrawer from "@/components/ChatDrawer";
import { getZone, getSubAreas } from "@/lib/pricing";
import { rupiah, timeAgo } from "@/lib/format";
import type { ClothingItem, ZoneId } from "@/types/silih";

const CATEGORIES: ClothingItem["category"][] = [
  "Jas & Blazer",
  "Kebaya & Batik",
  "Dress & Formal",
  "Kostum & Almamater"
];
const SIZES: ClothingItem["size"][] = ["S", "M", "L", "XL"];

export default function OwnerView() {
  const {
    items,
    chats,
    menfess,
    currentProfile,
    addItem,
    toggleItemAvailability,
    sendDealOffer,
    replyMenfess,
    ownerActiveBalance,
    ownerEscrowHeld
  } = useSilih();

  const ownerItems = items.filter((i) => i.ownerName === currentProfile.name);
  const ownerItemIds = ownerItems.map((i) => i.id);

  const [chatItemId, setChatItemId] = useState<string | null>(null);
  const [dealDays, setDealDays] = useState(3);
  const [dealPrice, setDealPrice] = useState(90000);

  // add-item form
  const [fTitle, setFTitle] = useState("");
  const [fCategory, setFCategory] = useState<ClothingItem["category"]>("Jas & Blazer");
  const [fSize, setFSize] = useState<ClothingItem["size"]>("M");
  const [fZone, setFZone] = useState<ZoneId>(currentProfile.zone);
  const [fSubArea, setFSubArea] = useState(currentProfile.subArea);
  const [fAddress, setFAddress] = useState(currentProfile.addressDetail);
  const [fPrice, setFPrice] = useState(30000);
  const [fMaxDays, setFMaxDays] = useState(3);
  const [fImage, setFImage] = useState("");
  const [fDesc, setFDesc] = useState("");

  // menfess reply
  const [replyPostId, setReplyPostId] = useState<string | null>(null);
  const [replyItemId, setReplyItemId] = useState<string>("");
  const [replyMsg, setReplyMsg] = useState("");

  const conversations = useMemo(
    () =>
      ownerItemIds
        .map((id) => ({
          itemId: id,
          item: ownerItems.find((i) => i.id === id)!,
          messages: chats.filter((c) => c.channel === "NEGOTIATION" && c.referenceId === id)
        }))
        .filter((c) => c.messages.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chats, items, currentProfile.name]
  );

  const activeChatItem = ownerItems.find((i) => i.id === chatItemId) ?? null;

  function submitItem() {
    if (!fTitle.trim() || !fImage.trim()) return;
    addItem({
      title: fTitle.trim(),
      category: fCategory,
      size: fSize,
      pricePerDay: fPrice,
      maxDays: fMaxDays,
      ownerName: currentProfile.name,
      zone: fZone,
      subArea: fSubArea,
      addressDetail: fAddress,
      imageUrl: fImage.trim(),
      description: fDesc.trim() || "Busana siap sewa, kondisi rapi & bersih.",
      isAvailable: true,
      availableUntilText: "Ready setiap hari"
    });
    setFTitle("");
    setFImage("");
    setFDesc("");
  }

  function sendDeal() {
    if (!activeChatItem) return;
    sendDealOffer({
      channel: "NEGOTIATION",
      referenceId: activeChatItem.id,
      senderRole: "OWNER",
      senderName: currentProfile.name,
      text: `Penawaran deal: ${dealDays} hari — ${rupiah(dealPrice)}. Yuk cek kartu penawaran di atas.`,
      dealOffer: { days: dealDays, agreedRentalPrice: dealPrice, status: "PENDING" }
    });
  }

  function submitReply() {
    if (!replyPostId || !replyItemId) return;
    replyMenfess(replyPostId, {
      ownerName: currentProfile.name,
      clothingItemId: replyItemId,
      message: replyMsg.trim() || "Produk ini ready kak, bisa langsung disewa lewat SILIH."
    });
    setReplyPostId(null);
    setReplyItemId("");
    setReplyMsg("");
  }

  return (
    <div className="space-y-6">
      {/* Wallet */}
      <section className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Saldo Tertahan (Escrow)"
          value={rupiah(ownerEscrowHeld)}
          hint="Dana sewa ditahan sampai kurir menyelesaikan pengembalian."
          tone="warn"
        />
        <StatCard
          label="Saldo Aktif Siap Tarik"
          value={rupiah(ownerActiveBalance)}
          hint="Otomatis cair 100% saat baju kembali ke tanganmu."
          tone="accent"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: catalog management */}
        <div className="space-y-6">
          <div className="card p-4">
            <SectionTitle
              icon={<Shirt size={16} />}
              title="Etalase Busana Saya"
              subtitle={`${ownerItems.length} produk terdaftar atas nama ${currentProfile.name}.`}
            />
            <div className="space-y-3">
              {ownerItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-2.5"
                >
                  <ItemImage
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[#0F172A]">{item.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {rupiah(item.pricePerDay)}/hari • {item.size} • {item.category}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <ZoneBadge zone={item.zone} />
                      <span className="text-[10px] text-slate-400">{item.subArea}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleItemAvailability(item.id)}
                    className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold ${
                      item.isAvailable
                        ? "bg-emerald-50 text-[#059669]"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.isAvailable ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    {item.isAvailable ? "Tersedia" : "Nonaktif"}
                  </button>
                </div>
              ))}
              {ownerItems.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-400">
                  Belum ada produk. Tambahkan baju pertamamu di form kanan.
                </p>
              )}
            </div>
          </div>

          {/* Menfess replies */}
          <div className="card p-4">
            <SectionTitle
              icon={<MessagesSquare size={16} />}
              title="Balas Menfess Mahasiswa"
              subtitle="Tawarkan produkmu langsung ke mahasiswa yang sedang mencari baju."
            />
            <div className="space-y-3">
              {menfess.map((post) => (
                <div key={post.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#0F172A]">{post.authorName}</p>
                    <span className="text-[10px] text-slate-400">{timeAgo(post.createdAt)}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {post.subArea}, {getZone(post.zone).label} • budget {rupiah(post.budgetPerDay)}/hari
                  </p>
                  <p className="mt-1.5 text-xs text-slate-700">{post.content}</p>
                  {post.replies.length > 0 && (
                    <p className="mt-1.5 text-[10px] text-[#059669]">
                      {post.replies.length} balasan sudah masuk
                    </p>
                  )}

                  {replyPostId === post.id ? (
                    <div className="mt-2 space-y-2 rounded-lg bg-slate-50 p-2.5">
                      <select
                        className="input"
                        value={replyItemId}
                        onChange={(e) => setReplyItemId(e.target.value)}
                      >
                        <option value="">Pilih produk kamu…</option>
                        {ownerItems.map((it) => (
                          <option key={it.id} value={it.id}>
                            {it.title} — {rupiah(it.pricePerDay)}/hari
                          </option>
                        ))}
                      </select>
                      <input
                        className="input"
                        placeholder="Pesan singkat untuk pemosting…"
                        value={replyMsg}
                        onChange={(e) => setReplyMsg(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button onClick={submitReply} className="btn-accent flex-1 text-xs">
                          <Send size={13} /> Kirim Balasan
                        </button>
                        <button
                          onClick={() => setReplyPostId(null)}
                          className="btn-ghost text-xs"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setReplyPostId(post.id);
                        setReplyItemId(ownerItems[0]?.id ?? "");
                      }}
                      className="btn-ghost mt-2 text-xs"
                      disabled={ownerItems.length === 0}
                    >
                      <Handshake size={13} /> Balas dengan Produk
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: add item + inbox */}
        <div className="space-y-6">
          <div className="card p-4">
            <SectionTitle icon={<Plus size={16} />} title="Tambah Baju Baru" />
            <div className="space-y-3">
              <div>
                <label className="label">Nama Baju</label>
                <input
                  className="input"
                  value={fTitle}
                  onChange={(e) => setFTitle(e.target.value)}
                  placeholder="Contoh: Blazer Navy Formal"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Kategori</label>
                  <select
                    className="input"
                    value={fCategory}
                    onChange={(e) => setFCategory(e.target.value as ClothingItem["category"])}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Ukuran</label>
                  <select
                    className="input"
                    value={fSize}
                    onChange={(e) => setFSize(e.target.value as ClothingItem["size"])}
                  >
                    {SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Zona</label>
                  <select
                    className="input"
                    value={fZone}
                    onChange={(e) => {
                      const z = e.target.value as ZoneId;
                      setFZone(z);
                      setFSubArea(getSubAreas(z)[0]);
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
                    value={fSubArea}
                    onChange={(e) => setFSubArea(e.target.value)}
                  >
                    {getSubAreas(fZone).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Detail Alamat</label>
                <input
                  className="input"
                  value={fAddress}
                  onChange={(e) => setFAddress(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Harga / Hari</label>
                  <input
                    type="number"
                    className="input"
                    value={fPrice}
                    onChange={(e) => setFPrice(Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="label">Maks. Hari</label>
                  <input
                    type="number"
                    className="input"
                    value={fMaxDays}
                    onChange={(e) => setFMaxDays(Number(e.target.value) || 1)}
                  />
                </div>
              </div>
              <div>
                <label className="label">URL Foto</label>
                <input
                  className="input"
                  value={fImage}
                  onChange={(e) => setFImage(e.target.value)}
                  placeholder="https://images.unsplash.com/…"
                />
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-slate-300 p-2">
                  <ImagePlus size={16} className="text-slate-400" />
                  {fImage ? (
                    <ItemImage
                      src={fImage}
                      alt="preview"
                      className="h-12 w-12 rounded-md object-cover"
                    />
                  ) : (
                    <span className="text-[11px] text-slate-400">Preview otomatis muncul di sini</span>
                  )}
                </div>
              </div>
              <div>
                <label className="label">Deskripsi</label>
                <textarea
                  className="input min-h-[70px] resize-none"
                  value={fDesc}
                  onChange={(e) => setFDesc(e.target.value)}
                />
              </div>
              <button onClick={submitItem} className="btn-primary w-full">
                <Plus size={15} /> Simpan ke Etalase
              </button>
            </div>
          </div>

          <div className="card p-4">
            <SectionTitle
              icon={<MessagesSquare size={16} />}
              title="Inbox Chat & Deal"
              subtitle="Percakapan negosiasi dari penyewa."
            />
            <div className="space-y-2">
              {conversations.map((c) => (
                <button
                  key={c.itemId}
                  onClick={() => setChatItemId(c.itemId)}
                  className="flex w-full items-center gap-2 rounded-xl border border-slate-200 p-2.5 text-left transition hover:bg-slate-50"
                >
                  <ItemImage
                    src={c.item.imageUrl}
                    alt={c.item.title}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[#0F172A]">
                      {c.item.title}
                    </p>
                    <p className="truncate text-[10px] text-slate-500">
                      {c.messages[c.messages.length - 1]?.text || "Penawaran deal"}
                    </p>
                  </div>
                  <span className="badge bg-emerald-50 text-[#059669]">
                    {c.messages.length}
                  </span>
                </button>
              ))}
              {conversations.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-400">
                  Belum ada chat masuk. Penyewa akan menghubungimu lewat tombol “Chat &amp; Nego”.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {activeChatItem && (
        <ChatDrawer
          referenceId={activeChatItem.id}
          channel="NEGOTIATION"
          title={`Nego — ${activeChatItem.title}`}
          subtitle={`${rupiah(activeChatItem.pricePerDay)}/hari • ${activeChatItem.subArea}`}
          quickChips={[
            "Halo kak, baju masih ready ya",
            "Bisa sewa mulai kapan kak?",
            "Untuk ukuran ini pas di LD berapa ya?"
          ]}
          onClose={() => setChatItemId(null)}
        >
          <div className="border-t border-slate-200 bg-slate-50 p-3">
            <p className="mb-1.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <Handshake size={13} /> Buat Penawaran Deal
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Durasi (Hari)</label>
                <input
                  type="number"
                  min={1}
                  className="input"
                  value={dealDays}
                  onChange={(e) => setDealDays(Number(e.target.value) || 1)}
                />
              </div>
              <div>
                <label className="label">Harga Final (Rp)</label>
                <input
                  type="number"
                  className="input"
                  value={dealPrice}
                  onChange={(e) => setDealPrice(Number(e.target.value) || 0)}
                />
              </div>
            </div>
            <button onClick={sendDeal} className="btn-warn mt-2 w-full text-xs">
              <Send size={13} /> Kirim Penawaran Deal
            </button>
          </div>
        </ChatDrawer>
      )}
    </div>
  );
}

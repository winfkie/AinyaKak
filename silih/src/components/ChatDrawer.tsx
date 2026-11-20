"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Send, Handshake, CheckCircle2 } from "lucide-react";
import { useSilih } from "@/context/SilihContext";
import { rupiah, clockTime, timeAgo } from "@/lib/format";
import type { ChatMessage } from "@/types/silih";

interface Props {
  referenceId: string;
  channel: ChatMessage["channel"];
  title: string;
  subtitle?: string;
  quickChips?: string[];
  onClose: () => void;
  onAcceptDeal?: (chatId: string, days: number, price: number) => void;
  children?: React.ReactNode;
}

export default function ChatDrawer({
  referenceId,
  channel,
  title,
  subtitle,
  quickChips = [],
  onClose,
  onAcceptDeal,
  children
}: Props) {
  const { chats, sendChatMessage, currentRole, currentProfile } = useSilih();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(
    () => chats.filter((c) => c.channel === channel && c.referenceId === referenceId),
    [chats, channel, referenceId]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const senderRole: ChatMessage["senderRole"] =
    currentRole === "OWNER" ? "OWNER" : currentRole === "COURIER" ? "COURIER" : "RENTER";

  function send(msg: string) {
    const trimmed = msg.trim();
    if (!trimmed) return;
    sendChatMessage({
      channel,
      referenceId,
      senderRole,
      senderName: currentProfile.name,
      text: trimmed
    });
    setText("");
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">{title}</h3>
            {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
          {messages.length === 0 && (
            <p className="mt-8 text-center text-xs text-slate-400">
              Belum ada pesan. Mulai obrolan untuk menyepakati hari &amp; harga sewa.
            </p>
          )}
          {messages.map((m) => {
            const mine = m.senderRole === senderRole;
            return (
              <div key={m.id} className={`flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    mine
                      ? "bg-[#0F172A] text-white"
                      : "border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <p className="mb-0.5 text-[10px] font-semibold opacity-70">{m.senderName}</p>
                  <p>{m.text}</p>
                </div>

                {m.dealOffer && (
                  <div
                    className={`w-[85%] rounded-2xl border p-3 ${
                      m.dealOffer.status === "ACCEPTED"
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-amber-300 bg-amber-50"
                    }`}
                  >
                    <p className="flex items-center gap-1.5 text-[11px] font-bold text-[#0F172A]">
                      <Handshake size={13} />
                      Penawaran Deal Resmi: {m.dealOffer.days} Hari — Total{" "}
                      {rupiah(m.dealOffer.agreedRentalPrice)}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-600">
                      {rupiah(
                        Math.round(m.dealOffer.agreedRentalPrice / Math.max(1, m.dealOffer.days))
                      )}{" "}
                      / hari
                    </p>

                    {m.dealOffer.status === "PENDING" && currentRole === "OWNER" && (
                      <p className="mt-2 text-[11px] font-semibold text-[#D97706]">
                        Menunggu persetujuan penyewa…
                      </p>
                    )}
                    {m.dealOffer.status === "PENDING" && currentRole === "RENTER" && onAcceptDeal && (
                      <button
                        onClick={() =>
                          onAcceptDeal(
                            m.id,
                            m.dealOffer!.days,
                            m.dealOffer!.agreedRentalPrice
                          )
                        }
                        className="btn-accent mt-2 w-full px-3 py-2 text-xs"
                      >
                        Setuju &amp; Lanjut Checkout
                      </button>
                    )}
                    {m.dealOffer.status === "ACCEPTED" && (
                      <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-[#059669]">
                        <CheckCircle2 size={13} /> Deal disetujui penyewa
                      </p>
                    )}
                  </div>
                )}

                <span className="text-[10px] text-slate-400">
                  {clockTime(m.timestamp)} • {timeAgo(m.timestamp)}
                </span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {quickChips.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-slate-200 px-4 py-2">
            {quickChips.map((c) => (
              <button
                key={c}
                onClick={() => send(c)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:border-slate-400"
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {children}

        <div className="flex items-center gap-2 border-t border-slate-200 p-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send(text);
            }}
            placeholder="Tulis pesan…"
            className="input flex-1"
          />
          <button onClick={() => send(text)} className="btn-primary px-3">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

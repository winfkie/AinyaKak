import { STATUS_ORDER } from "@/lib/format";

export default function StatusBadge({ status }: { status: string }) {
  const s = STATUS_ORDER[status] ?? { label: status, warna: "bg-zinc-100 text-zinc-700" };
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${s.warna}`}>{s.label}</span>;
}

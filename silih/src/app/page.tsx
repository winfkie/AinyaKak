"use client";

import { useSilih } from "@/context/SilihContext";
import TopBar from "@/components/TopBar";
import RenterView from "@/components/RenterView";
import OwnerView from "@/components/OwnerView";
import CourierView from "@/components/CourierView";
import AdminLedgerView from "@/components/AdminLedgerView";

export default function Home() {
  const { currentRole } = useSilih();
  return (
    <div className="min-h-screen bg-white pb-24">
      <TopBar />
      <main className="mx-auto max-w-7xl px-4 py-6">
        {currentRole === "RENTER" && <RenterView />}
        {currentRole === "OWNER" && <OwnerView />}
        {currentRole === "COURIER" && <CourierView />}
        {currentRole === "ADMIN" && <AdminLedgerView />}
      </main>
    </div>
  );
}

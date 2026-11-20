import type { ZoneDefinition, ZoneId } from "@/types/silih";

export const PLATFORM_FEE = 5000;

export const ZONES: ZoneDefinition[] = [
  {
    id: "ZONA_1",
    name: "Zona 1 — Tembalang Inti",
    label: "Zona 1",
    subAreas: ["Banjarsari", "Sirojudin", "Gondang", "Baskoro", "Mulawarman"]
  },
  {
    id: "ZONA_2",
    name: "Zona 2 — Tembalang Sekitar",
    label: "Zona 2",
    subAreas: ["Bulusan", "Meteseh", "Mangunharjo", "Kramas"]
  },
  {
    id: "ZONA_3",
    name: "Zona 3 — Banyumanik",
    label: "Zona 3",
    subAreas: ["Ngesrep", "Sumurboto", "Pedalangan", "Srondol Wetan", "Tirto Agung"]
  }
];

export function getZone(id: ZoneId): ZoneDefinition {
  return ZONES.find((z) => z.id === id) ?? ZONES[0];
}

export function getSubAreas(id: ZoneId): string[] {
  return getZone(id).subAreas;
}

/**
 * Matriks ongkir satu kaki (single leg) antar zona layanan.
 * Origin === destination -> Rp5.000
 * Zona 1<->2 atau Zona 2<->3 -> Rp7.000
 * Zona 1<->3 -> Rp10.000
 */
export function calculateSingleLegShipping(origin: ZoneId, destination: ZoneId): number {
  if (origin === destination) return 5000;
  const nearPairs: Array<[ZoneId, ZoneId]> = [
    ["ZONA_1", "ZONA_2"],
    ["ZONA_2", "ZONA_1"],
    ["ZONA_2", "ZONA_3"],
    ["ZONA_3", "ZONA_2"]
  ];
  const isNear = nearPairs.some(([a, b]) => a === origin && b === destination);
  if (isNear) return 7000;
  const farPairs: Array<[ZoneId, ZoneId]> = [
    ["ZONA_1", "ZONA_3"],
    ["ZONA_3", "ZONA_1"]
  ];
  const isFar = farPairs.some(([a, b]) => a === origin && b === destination);
  if (isFar) return 10000;
  return 7000;
}

export function grandTotal(rentalTotal: number, singleLegShippingFee: number): number {
  return rentalTotal + singleLegShippingFee * 2 + PLATFORM_FEE;
}

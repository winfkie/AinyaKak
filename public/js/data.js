/* CFDSemarang — data zona & lapak (skema peta, tidak berskala).
 * Geometri: koridor vertikal Simpang Lima (bawah) → Jl. Pemuda → Tugu Muda (atas).
 * Zona D (Jl. Pahlawan) bercabang ke timur dari bundaran Tugu Muda.
 *
 * Ukuran MVP: 68 lapak (A16 · B20 · C16 · D16) — sesuai rencana (60–80).
 */
window.ZONES = [
  {
    code: "C",
    name: "Zona C — Tugu Muda / Lawang Sewu",
    sub: "Bundaran Tugu Muda",
    perSide: 8,
    // segmen vertikal peta (y-atas, y-bawah) — dekat bundaran
    roadY: [200, 540],
  },
  {
    code: "B",
    name: "Zona B — DP Mall",
    sub: "Jl. Pemuda / Jl. Simpang",
    perSide: 10,
    roadY: [560, 960],
  },
  {
    code: "A",
    name: "Zona A — Simpang Lima",
    sub: "Tepi Lapangan Pancasila",
    perSide: 8,
    roadY: [980, 1300],
  },
  {
    code: "D",
    name: "Zona D — Jl. Pahlawan / Kota Lama",
    sub: "Cabang timur dari Tugu Muda",
    perSide: 8,
    horizontal: { x1: 470, x2: 800, y: 150, height: 100 },
  },
];

// Geometri jalan utama (vertikal)
window.MAPGEO = {
  roadX: 320, roadW: 150,           // jalan vertikal
  spotSize: 34, spotPitch: 40,      // kotak lapak & jarak antar lapak
  spotInset: 6,                     // jarak lapak dari tepi jalan
  roundabout: { cx: 395, cy: 130, r: 72 },
  field: { x: 150, y: 1320, w: 490, h: 170 }, // Lapangan Pancasila (Simpang Lima)
};

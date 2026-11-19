import { bindings, defineConfig } from "cf/config";

/**
 * CFDSemarang — site + API Worker.
 * Static assets (public/) dilayani otomatis; hanya /api/* masuk ke Worker.
 * Rahasia (MIDTRANS_SERVER_KEY, ADMIN_PIN) disimpan sebagai Worker secret,
 * bukan di file ini.
 */
export default defineConfig({
  worker: {
    name: "cfdsemarang",
    compatibilityDate: "2026-11-01",
    entrypoint: "./src/index.js",
    assets: {
      // Hanya panggilan API yang diarahkan ke kode Worker.
      runWorkerFirst: ["/api/*"],
    },
    env: {
      DB: bindings.d1({
        name: "cfdsemarang-db",
        id: "bb25fcac-c911-4f73-aaff-101b7ad68222",
      }),
      MIDTRANS_SERVER_KEY: bindings.secret(),
      ADMIN_PIN: bindings.secret(),
      MIDTRANS_PRODUCTION: bindings.text("false"),
      // Kalau Midtrans gagal, booking tetap dicatat sebagai pending agar bisa
      // dikonfirmasi manual oleh admin. Set "false" untuk menolak booking.
      ALLOW_MANUAL_FALLBACK: bindings.text("true"),
    },
  },
});

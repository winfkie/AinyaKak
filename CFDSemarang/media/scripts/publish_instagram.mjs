#!/usr/bin/env node
/**
 * Publish video URL ke Instagram lewat endpoint admin Worker CFDSemarang.
 * Usage:
 *   ADMIN_PIN=... WORKER_BASE=https://cfdsemarang.aidanrn06.workers.dev \
 *   node publish_instagram.mjs "https://cdn.example.com/video.mp4" "Caption..."
 */
const [videoUrl, caption = ""] = process.argv.slice(2);
const base = process.env.WORKER_BASE || "http://127.0.0.1:8788";
const pin = process.env.ADMIN_PIN;
if (!pin) { console.error("ADMIN_PIN wajib"); process.exit(2); }
if (!videoUrl) { console.error("Usage: node publish_instagram.mjs <video_url> [caption]"); process.exit(2); }

const res = await fetch(new URL("/api/admin/instagram/publish", base), {
  method: "POST",
  headers: { "content-type": "application/json", "x-admin-pin": pin },
  body: JSON.stringify({ video_url: videoUrl, caption, media_type: "REELS", share_to_feed: true }),
});
const data = await res.json().catch(() => ({}));
console.log(JSON.stringify({ status: res.status, data }, null, 2));
if (!res.ok) process.exit(1);

#!/usr/bin/env node
/**
 * Generate voiceover MP3 dari ElevenLabs.
 * Usage:
 *   ELEVENLABS_API_KEY=... ELEVENLABS_VOICE_ID=... node generate_voiceover_elevenlabs.mjs "Teks narasi" ../out/voiceover.mp3
 */
import fs from "node:fs/promises";
import path from "node:path";

const [text, outArg] = process.argv.slice(2);
const apiKey = process.env.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_VOICE_ID;
const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
const outFile = path.resolve(process.cwd(), outArg || "../out/voiceover.mp3");

if (!apiKey || !voiceId) {
  console.error("ELEVENLABS_API_KEY dan ELEVENLABS_VOICE_ID wajib diisi.");
  process.exit(2);
}
if (!text) {
  console.error('Usage: node generate_voiceover_elevenlabs.mjs "Teks..." ../out/voiceover.mp3');
  process.exit(2);
}

const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
  method: "POST",
  headers: {
    "xi-api-key": apiKey,
    "Content-Type": "application/json",
    Accept: "audio/mpeg",
  },
  body: JSON.stringify({
    text,
    model_id: modelId,
    voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.25, use_speaker_boost: true },
  }),
});

if (!res.ok) {
  console.error("ElevenLabs error", res.status, await res.text());
  process.exit(1);
}

await fs.mkdir(path.dirname(outFile), { recursive: true });
const buf = Buffer.from(await res.arrayBuffer());
await fs.writeFile(outFile, buf);
console.log(JSON.stringify({ ok: true, outFile, bytes: buf.length }));

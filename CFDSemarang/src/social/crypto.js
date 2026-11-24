/* Enkripsi token Instagram untuk disimpan di D1.
 * Format: v1.<iv_b64url>.<ciphertext_b64url>
 * Kunci: IG_TOKEN_ENC_KEY (secret Worker), di-hash SHA-256 -> AES-GCM 256.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function b64urlEncode(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlDecode(str) {
  const b64 = String(str || "").replace(/-/g, "+").replace(/_/g, "/") + "===".slice((String(str || "").length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function getKey(env) {
  const secret = String(env.IG_TOKEN_ENC_KEY || "");
  if (!secret) throw new Error("IG_TOKEN_ENC_KEY belum diset");
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptToken(env, plain) {
  const key = await getKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(String(plain || "")));
  return `v1.${b64urlEncode(iv)}.${b64urlEncode(new Uint8Array(ct))}`;
}

export async function decryptToken(env, packed) {
  const key = await getKey(env);
  const parts = String(packed || "").split(".");
  if (parts.length !== 3 || parts[0] !== "v1") throw new Error("Format token terenkripsi tidak dikenal");
  const iv = b64urlDecode(parts[1]);
  const ct = b64urlDecode(parts[2]);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return decoder.decode(plain);
}

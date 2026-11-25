/* Helper Instagram API dengan Unified Login (Facebook Login for Business).
 * OAuth memakai config_id; token dan request API memakai graph.facebook.com.
 */

const GRAPH_HOST = "https://graph.facebook.com";
const GRAPH_VERSION = "v27.0";

function cleanText(v, max) {
  return String(v == null ? "" : v).replace(/\s+/g, " ").trim().slice(0, max);
}

async function graph(path, { method = "GET", token, params, body, form } = {}) {
  const url = new URL(`${GRAPH_HOST}/${GRAPH_VERSION}${path.startsWith("/") ? "" : "/"}${path}`);
  if (params) for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, String(v));
  const headers = {};
  let payload;
  if (form) {
    headers["content-type"] = "application/x-www-form-urlencoded";
    payload = new URLSearchParams();
    for (const [k, v] of Object.entries(form)) if (v != null) payload.set(k, String(v));
  } else if (body !== undefined) {
    headers["content-type"] = "application/json";
    payload = JSON.stringify(body);
  }
  if (token) headers.authorization = `Bearer ${token}`;

  const res = await fetch(url, { method, headers, body: payload });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data.error || {};
    const msg = err.error_user_msg || err.message || `Instagram API ${res.status}`;
    const e = new Error(msg);
    e.status = res.status;
    e.detail = err;
    e.raw = data;
    throw e;
  }
  return data;
}

export function igAppConfig(env, origin) {
  return {
    appId: cleanText(env.IG_APP_ID, 120),
    appSecret: cleanText(env.IG_APP_SECRET, 200),
    configId: cleanText(env.IG_CONFIG_ID, 120),
    redirectUri: cleanText(env.IG_REDIRECT_URI, 500) || `${origin}/api/admin/instagram/callback`,
    scopes: cleanText(env.IG_SCOPES, 300) || "instagram_basic,instagram_content_publish",
  };
}

export function buildAuthUrl(env, origin, state) {
  const cfg = igAppConfig(env, origin);
  if (!cfg.appId) throw new Error("IG_APP_ID belum diset");
  if (!cfg.configId) throw new Error("IG_CONFIG_ID belum diset (config_id dari Meta dashboard)");
  const url = new URL("https://www.facebook.com/dialog/oauth");
  url.searchParams.set("client_id", cfg.appId);
  url.searchParams.set("config_id", cfg.configId);
  url.searchParams.set("redirect_uri", cfg.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("display", "popup");
  url.searchParams.set("prompt", "login");
  url.searchParams.set("state", state);
  return { url: url.toString(), cfg };
}

export async function exchangeCodeForToken(env, origin, code) {
  const cfg = igAppConfig(env, origin);
  if (!cfg.appId || !cfg.appSecret) throw new Error("IG_APP_ID / IG_APP_SECRET belum diset");
  const data = await graph("/oauth/access_token", {
    params: {
      client_id: cfg.appId,
      client_secret: cfg.appSecret,
      redirect_uri: cfg.redirectUri,
      code,
    },
  });
  return {
    accessToken: data.access_token || "",
    tokenType: data.token_type || "bearer",
    expiresIn: data.expires_in ? Number(data.expires_in) : null,
    raw: data,
  };
}

export async function fetchMe(token) {
  const me = await graph("/me", { token, params: { fields: "client_business_id" } });
  const accounts = await graph("/me/assigned_instagram_accounts", {
    token,
    params: { fields: "id,username" },
  });
  const found = (accounts.data || []).find((item) => item && item.id) || {};
  const igUserId = String(found.id || "");
  if (!igUserId) throw new Error("Tidak ada Instagram account yang dibagikan ke app");

  let detail = {};
  try {
    detail = await graph(`/${igUserId}`, { token, params: { fields: "account_type,name,username" } });
  } catch {
    // Field tambahan tidak tersedia untuk sebagian akun; id + username cukup.
  }
  return {
    igUserId,
    username: detail.username || found.username || "",
    accountType: detail.account_type || "",
    name: detail.name || "",
    clientBusinessId: String(me.client_business_id || ""),
    raw: { me, accounts },
  };
}

export async function createVideoContainer(token, igUserId, { videoUrl, caption, coverUrl, shareToFeed = true, mediaType = "REELS" }) {
  return graph(`/${igUserId}/media`, {
    method: "POST",
    token,
    form: {
      media_type: mediaType,
      video_url: videoUrl,
      caption: caption || "",
      cover_url: coverUrl || undefined,
      share_to_feed: shareToFeed ? "true" : "false",
    },
  });
}

export async function getContainerStatus(token, containerId) {
  return graph(`/${containerId}`, {
    token,
    params: { fields: "status_code,status,id" },
  });
}

export async function publishContainer(token, igUserId, creationId) {
  return graph(`/${igUserId}/media_publish`, {
    method: "POST",
    token,
    form: { creation_id: creationId },
  });
}

export async function getMedia(token, mediaId) {
  return graph(`/${mediaId}`, {
    token,
    params: { fields: "id,media_type,media_product_type,permalink,thumbnail_url,timestamp,shortcode" },
  });
}

/* Helper Instagram Graph API (Instagram Login / graph.instagram.com).
 * Dipakai Worker untuk OAuth, container Reels, status, dan publish.
 */

const GRAPH_VERSION = "v23.0";
const GRAPH_HOST = "https://graph.instagram.com";

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
    redirectUri: cleanText(env.IG_REDIRECT_URI, 500) || `${origin}/api/admin/instagram/callback`,
    scopes: cleanText(env.IG_SCOPES, 300) || "instagram_business_basic,instagram_business_content_publish",
  };
}

export function buildAuthUrl(env, origin, state) {
  const cfg = igAppConfig(env, origin);
  if (!cfg.appId) throw new Error("IG_APP_ID belum diset");
  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", cfg.appId);
  url.searchParams.set("redirect_uri", cfg.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", cfg.scopes);
  url.searchParams.set("state", state);
  // force_reauth bisa ditambah jika admin ingin ganti akun.
  return { url: url.toString(), cfg };
}

export async function exchangeCodeForShortToken(env, origin, code) {
  const cfg = igAppConfig(env, origin);
  if (!cfg.appId || !cfg.appSecret) throw new Error("IG_APP_ID / IG_APP_SECRET belum diset");
  const data = await graph("/oauth/access_token", {
    method: "POST",
    form: {
      client_id: cfg.appId,
      client_secret: cfg.appSecret,
      grant_type: "authorization_code",
      redirect_uri: cfg.redirectUri,
      code,
    },
  });
  return { accessToken: data.access_token, userId: data.user_id ? String(data.user_id) : "", raw: data };
}

export async function exchangeForLongLivedToken(env, shortToken) {
  const cfg = igAppConfig(env, "");
  if (!cfg.appSecret) throw new Error("IG_APP_SECRET belum diset");
  const data = await graph("/access_token", {
    params: {
      grant_type: "ig_exchange_token",
      client_secret: cfg.appSecret,
      access_token: shortToken,
    },
  });
  return {
    accessToken: data.access_token,
    tokenType: data.token_type || "bearer",
    expiresIn: data.expires_in ? Number(data.expires_in) : null,
    raw: data,
  };
}

export async function refreshLongLivedToken(token) {
  const data = await graph("/refresh_access_token", {
    params: { grant_type: "ig_refresh_token", access_token: token },
  });
  return {
    accessToken: data.access_token,
    tokenType: data.token_type || "bearer",
    expiresIn: data.expires_in ? Number(data.expires_in) : null,
    raw: data,
  };
}

export async function fetchMe(token) {
  const data = await graph("/me", {
    token,
    params: { fields: "user_id,username,account_type,name,profile_picture_url" },
  });
  return {
    igUserId: String(data.user_id || data.id || ""),
    username: data.username || "",
    accountType: data.account_type || "",
    name: data.name || "",
    raw: data,
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

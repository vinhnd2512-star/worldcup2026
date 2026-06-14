async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function send(response, status, payload) {
  response.status(status).json(payload);
}

function env(name) {
  return process.env[name] || "";
}

async function supabaseFetch(path, options = {}) {
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  return fetch(`${env("SUPABASE_URL")}${path}`, { ...options, headers });
}

function cleanUsername(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

function friendlySignupError(text) {
  const lower = String(text || "").toLowerCase();
  if (lower.includes("already") || lower.includes("duplicate") || lower.includes("unique")) {
    return "Tài khoản hoặc email này đã tồn tại. Hãy đăng nhập hoặc chọn username khác.";
  }
  if (lower.includes("password")) return "Mật khẩu chưa hợp lệ. Vui lòng dùng mật khẩu tối thiểu 6 ký tự.";
  return text || "Không thể tạo tài khoản.";
}

async function cleanupAuthUser(userId) {
  if (!userId) return;
  try {
    await supabaseFetch(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, { method: "DELETE" });
  } catch {
    // Best-effort cleanup only; the endpoint still returns the original profile error.
  }
}

export default async function handler(request, response) {
  try {
    if (request.method !== "POST") {
      return send(response, 405, { error: "Method not allowed" });
    }
    if (!env("SUPABASE_URL") || !env("SUPABASE_SERVICE_ROLE_KEY")) {
      return send(response, 500, { error: "Supabase service env vars are missing" });
    }

    const body = await readJson(request);
    const username = cleanUsername(body.username);
    const displayName = String(body.display_name || "").trim();
    const password = String(body.password || "");
    const email = `${username}@worldcup.local`;

    if (!username || !displayName || password.length < 6) {
      return send(response, 400, { error: "username, display_name, and password length >= 6 are required" });
    }

    const existingProfile = await supabaseFetch(`/rest/v1/profiles?username=eq.${encodeURIComponent(username)}&select=id`);
    if (!existingProfile.ok) {
      return send(response, 500, { error: "Cannot verify username availability" });
    }
    const existingRows = await existingProfile.json();
    if (existingRows.length) {
      return send(response, 409, { error: "Tài khoản hoặc email này đã tồn tại. Hãy đăng nhập hoặc chọn username khác." });
    }

    const createResponse = await supabaseFetch("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username,
          display_name: displayName,
          role: "player"
        }
      })
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      return send(response, 400, { error: friendlySignupError(error) });
    }

    const created = await createResponse.json();
    const userId = created.user?.id || created.id;
    if (!userId) {
      return send(response, 500, { error: "Supabase did not return a user id" });
    }

    const profileResponse = await supabaseFetch("/rest/v1/profiles?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({
        id: userId,
        username,
        display_name: displayName,
        role: "player",
        is_active: true,
        wallet_balance: 0
      })
    });

    if (!profileResponse.ok) {
      const error = await profileResponse.text();
      await cleanupAuthUser(userId);
      return send(response, 500, { error: friendlySignupError(error) });
    }

    const profiles = await profileResponse.json();
    await supabaseFetch("/rest/v1/audit_logs", {
      method: "POST",
      body: JSON.stringify({
        actor_id: null,
        action: "public.signup",
        entity_type: "profile",
        entity_id: userId,
        details_json: { username, display_name: displayName }
      })
    });

    return send(response, 200, { user: profiles[0], email });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return send(response, 500, { error: message });
  }
}

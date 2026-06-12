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

async function supabaseFetch(path, options = {}) {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  return fetch(`${url}${path}`, { ...options, headers });
}

async function requireAdmin(request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const callerToken = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!callerToken) {
    return { error: "Missing caller token", status: 401 };
  }

  const callerResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${callerToken}`
    }
  });
  if (!callerResponse.ok) {
    return { error: "Invalid caller token", status: 401 };
  }

  const caller = await callerResponse.json();
  const profileResponse = await supabaseFetch(`/rest/v1/profiles?id=eq.${caller.id}&select=role,is_active`);
  if (!profileResponse.ok) {
    return { error: "Cannot verify admin profile", status: 403 };
  }
  const profiles = await profileResponse.json();
  if (!profiles[0] || profiles[0].role !== "admin" || profiles[0].is_active !== true) {
    return { error: "Admin role required", status: 403 };
  }

  return { caller };
}

export default async function handler(request, response) {
  try {
    if (request.method !== "POST") {
      return send(response, 405, { error: "Method not allowed" });
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return send(response, 500, { error: "Supabase service env vars are missing" });
    }

    const adminCheck = await requireAdmin(request);
    if (adminCheck.error) {
      return send(response, adminCheck.status, { error: adminCheck.error });
    }

    const body = await readJson(request);
    const userId = String(body.user_id || "").trim();
    const password = String(body.password || "");
    if (!userId || password.length < 6) {
      return send(response, 400, { error: "user_id and password length >= 6 are required" });
    }

    const resetResponse = await supabaseFetch(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
      method: "PUT",
      body: JSON.stringify({ password })
    });

    if (!resetResponse.ok) {
      const error = await resetResponse.text();
      return send(response, 400, { error });
    }

    await supabaseFetch("/rest/v1/audit_logs", {
      method: "POST",
      body: JSON.stringify({
        actor_id: adminCheck.caller.id,
        action: "admin.password_reset",
        entity_type: "profile",
        entity_id: userId,
        details_json: { user_id: userId }
      })
    });

    return send(response, 200, { status: "ok" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return send(response, 500, { error: message });
  }
}

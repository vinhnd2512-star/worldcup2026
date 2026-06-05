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

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return send(response, 405, { error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return send(response, 500, { error: "Supabase service env vars are missing" });
  }

  const callerToken = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!callerToken) {
    return send(response, 401, { error: "Missing caller token" });
  }

  const callerResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${callerToken}`
    }
  });
  if (!callerResponse.ok) {
    return send(response, 401, { error: "Invalid caller token" });
  }
  const caller = await callerResponse.json();

  const profileResponse = await supabaseFetch(`/rest/v1/profiles?id=eq.${caller.id}&select=role,is_active`);
  if (!profileResponse.ok) {
    return send(response, 403, { error: "Cannot verify admin profile" });
  }
  const profiles = await profileResponse.json();
  if (!profiles[0] || profiles[0].role !== "admin" || profiles[0].is_active !== true) {
    return send(response, 403, { error: "Admin role required" });
  }

  const body = await readJson(request);
  const username = String(body.username || "").trim().toLowerCase();
  const displayName = String(body.display_name || "").trim();
  const password = String(body.password || "");
  const startingPoints = Number(body.starting_points || 0);
  const email = String(body.email || `${username}@worldcup.local`).trim().toLowerCase();

  if (!username || !displayName || password.length < 6) {
    return send(response, 400, { error: "username, display_name, and password length >= 6 are required" });
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
    return send(response, 400, { error });
  }

  const created = await createResponse.json();
  const userId = created.user?.id || created.id;
  if (!userId) {
    return send(response, 500, { error: "Supabase did not return a user id" });
  }

  const patchResponse = await supabaseFetch(`/rest/v1/profiles?id=eq.${userId}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      username,
      display_name: displayName,
      role: "player",
      is_active: true,
      wallet_balance: startingPoints
    })
  });
  if (!patchResponse.ok) {
    const error = await patchResponse.text();
    return send(response, 500, { error });
  }
  const patched = await patchResponse.json();

  if (startingPoints !== 0) {
    await supabaseFetch("/rest/v1/wallet_ledger", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        actor_id: caller.id,
        amount: startingPoints,
        kind: "admin_topup",
        reason: "Initial points",
        balance_after: startingPoints
      })
    });
  }

  await supabaseFetch("/rest/v1/audit_logs", {
    method: "POST",
    body: JSON.stringify({
      actor_id: caller.id,
      action: "admin.user_create",
      entity_type: "profile",
      entity_id: userId,
      details_json: {
        username,
        display_name: displayName,
        starting_points: startingPoints
      }
    })
  });

  return send(response, 200, { user: patched[0] });
}

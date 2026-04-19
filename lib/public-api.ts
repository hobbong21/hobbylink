/**
 * Public API authentication + rate limiting. Use inside a route handler:
 *
 *   export async function GET(req: Request) {
 *     const auth = await authenticatePublicRequest(req)
 *     if (!auth.ok) return auth.response
 *     // auth.key contains user_id, tier, etc.
 *     // ... do read-only query
 *   }
 */
import { NextResponse } from "next/server"
import { hashApiKey, RATE_LIMITS } from "@/lib/api-keys"
import { rateLimit } from "@/lib/rate-limit"

interface AuthOk {
  ok: true
  key: {
    id: string
    user_id: string
    tier: "free" | "pro"
    scopes: string[]
  }
}

interface AuthFail {
  ok: false
  response: NextResponse
}

function bearer(req: Request): string | null {
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization")
  if (!header) return null
  if (!header.toLowerCase().startsWith("bearer ")) return null
  return header.slice(7).trim()
}

function err(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status })
}

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const srv = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !srv) return null
  // Dynamic import to keep the fn tree-shakable at build time.
  return import("@supabase/supabase-js").then((m) =>
    m.createClient(url, srv, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  )
}

export async function authenticatePublicRequest(req: Request): Promise<AuthOk | AuthFail> {
  const raw = bearer(req)
  if (!raw) {
    return {
      ok: false,
      response: err(401, "missing_api_key", "Authorization: Bearer <API 키> 헤더가 필요합니다."),
    }
  }

  const admin = await getAdmin()
  if (!admin) {
    return {
      ok: false,
      response: err(500, "server_misconfigured", "서버 설정 오류입니다. 관리자에게 문의하세요."),
    }
  }

  const hash = hashApiKey(raw)
  const { data: row, error } = await admin
    .from("api_keys")
    .select("id, user_id, tier, scopes, revoked_at")
    .eq("key_hash", hash)
    .maybeSingle()

  if (error || !row) {
    return { ok: false, response: err(401, "invalid_api_key", "유효하지 않은 API 키입니다.") }
  }
  if (row.revoked_at) {
    return { ok: false, response: err(401, "revoked_api_key", "폐기된 API 키입니다.") }
  }

  const tier = (row.tier as "free" | "pro") ?? "free"
  const cfg = RATE_LIMITS[tier] ?? RATE_LIMITS.free
  const rl = await rateLimit({
    key: `public-api:${row.id}`,
    limit: cfg.limit,
    windowMs: cfg.windowMs,
  })
  if (!rl.allowed) {
    const retryIn = Math.max(0, Math.ceil((rl.resetAt - Date.now()) / 1000))
    return {
      ok: false,
      response: NextResponse.json(
        { error: { code: "rate_limited", message: `Too many requests. Retry in ${retryIn}s.` } },
        { status: 429, headers: { "Retry-After": String(retryIn) } },
      ),
    }
  }

  // Best-effort usage bookkeeping — failures don't block the request.
  const hourKey = new Date()
  hourKey.setUTCMinutes(0, 0, 0)
  void admin
    .from("api_key_usage")
    .upsert(
      {
        key_id: row.id,
        window_hour: hourKey.toISOString(),
        request_count: 1,
      },
      { onConflict: "key_id,window_hour", ignoreDuplicates: false },
    )
    .then(async ({ error: upErr }) => {
      if (upErr) {
        // Manual increment fallback (Supabase can't upsert with +1).
        await admin.rpc("increment_api_usage", {
          p_key_id: row.id,
          p_window_hour: hourKey.toISOString(),
        })
      }
    })
  void admin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", row.id)

  return {
    ok: true,
    key: {
      id: row.id,
      user_id: row.user_id,
      tier,
      scopes: (row.scopes as string[]) ?? ["public:read"],
    },
  }
}

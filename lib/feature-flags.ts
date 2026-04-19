import { createClient } from "@/lib/supabase/server"

/**
 * Checks whether a feature flag is on for the current user and logs the
 * exposure (idempotent per user/flag). Safe to call from server components
 * / route handlers. Returns false when the flag doesn't exist.
 */
export async function isFlagEnabled(key: string): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data } = await supabase.rpc("is_flag_enabled", {
    p_key: key,
    p_user_id: user?.id ?? null,
  })
  const on = data === true
  if (user) {
    // Fire-and-forget. The RPC is idempotent per (user, flag) so spamming
    // this on every request is fine; downstream aggregation uses distinct.
    void supabase
      .rpc("log_flag_exposure", { p_key: key, p_on: on })
      .then(() => undefined)
  }
  return on
}

/** Records a named conversion for A/B analysis. */
export async function logConversion(kind: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await supabase.rpc("log_ab_conversion", { p_kind: kind })
}

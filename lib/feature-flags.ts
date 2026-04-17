import { createClient } from "@/lib/supabase/server"

/**
 * Checks whether a feature flag is on for the current user.
 * Safe to call from server components / route handlers. Returns false when
 * the flag doesn't exist — callers don't need to pre-register flags in code.
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
  return data === true
}

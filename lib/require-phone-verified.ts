/**
 * Step-up helper for server actions / route handlers that need a verified
 * phone (e.g. posting events beyond a threshold, high-value payouts, etc).
 * Throws with a Korean message so callers can bubble it directly to users.
 */
import { createClient } from "@/lib/supabase/server"

export async function requirePhoneVerified(): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("로그인이 필요합니다")

  const { data } = await supabase
    .from("profiles")
    .select("phone_verified_at")
    .eq("id", user.id)
    .maybeSingle()

  if (!data?.phone_verified_at) {
    throw new Error("이 작업을 하려면 전화번호 인증이 필요합니다. 설정 > 전화번호 인증에서 진행해주세요.")
  }
}

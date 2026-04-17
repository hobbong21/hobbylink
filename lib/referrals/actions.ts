"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Records who referred the current user, based on a referral code. Safe to
 * call repeatedly — uses the primary key on (referred_user_id) to avoid
 * double-counting.
 *
 * Uses the service-role admin client because the `referrals` table has no
 * INSERT RLS policy (by design, to prevent tampering).
 */
export async function recordReferral(code: string) {
  if (!code || code.length > 32) return { ok: false as const }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const }

  // Find the referrer.
  const { data: referrer } = await supabase
    .from("profiles")
    .select("id")
    .eq("referral_code", code)
    .maybeSingle()
  if (!referrer || referrer.id === user.id) return { ok: false as const }

  // Privileged insert.
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceRoleKey || !supabaseUrl) return { ok: false as const }

  const { createClient: createAdmin } = await import("@supabase/supabase-js")
  const admin = createAdmin(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { error } = await admin.from("referrals").upsert(
    {
      referred_user_id: user.id,
      referrer_user_id: referrer.id,
      referral_code: code,
    },
    { onConflict: "referred_user_id" },
  )
  if (error) return { ok: false as const }

  revalidatePath("/invite")
  return { ok: true as const }
}

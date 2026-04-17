import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/database.types"

export type Tier = "free" | "premium"

export interface SubscriptionInfo {
  tier: Tier
  status: "trialing" | "active" | "past_due" | "canceled" | "incomplete" | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

/** Returns the caller's current subscription, defaulting to free tier. */
export async function getMySubscription(): Promise<SubscriptionInfo> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return {
      tier: "free",
      status: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    }
  }

  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<Tables<"subscriptions">>()

  return {
    tier: (data?.tier as Tier) ?? "free",
    status: (data?.status as SubscriptionInfo["status"]) ?? null,
    currentPeriodEnd: data?.current_period_end ?? null,
    cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
  }
}

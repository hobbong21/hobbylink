import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createCheckoutSession } from "@/lib/billing/stripe"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return NextResponse.json({ ok: false, message: "로그인이 필요합니다" }, { status: 401 })
  }

  const priceId = process.env.STRIPE_PREMIUM_PRICE_ID
  if (!priceId) {
    return NextResponse.json(
      { ok: false, message: "결제 상품이 설정되지 않았습니다" },
      { status: 501 },
    )
  }

  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? ""
  const result = await createCheckoutSession({
    priceId,
    userId: user.id,
    userEmail: user.email,
    successUrl: `${origin}/settings?checkout=success`,
    cancelUrl: `${origin}/pricing?checkout=cancelled`,
  })

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 500 })
  }
  return NextResponse.json(result)
}

/**
 * Stripe helper.
 *
 * Uses dynamic import so the Stripe SDK is NOT pulled into the bundle unless
 * you actually configure Stripe (which requires installing the `stripe`
 * package: `pnpm add stripe`). With nothing configured, all helpers return
 * a structured `{ ok: false }` result that callers can surface to UI.
 */

export interface CheckoutSessionInput {
  priceId: string
  userId: string
  userEmail: string
  successUrl: string
  cancelUrl: string
}

export interface StripeResult<T> {
  ok: boolean
  data?: T
  message?: string
}

async function loadStripe() {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) return null
  try {
    // `stripe` is a peer — installed only when integration is enabled.
    const mod = await import(/* webpackIgnore: true */ "stripe")
    const Stripe = (mod as { default: new (secret: string) => unknown }).default
    return new Stripe(secret) as {
      checkout: {
        sessions: {
          create(params: Record<string, unknown>): Promise<{ url: string | null }>
        }
      }
      billingPortal: {
        sessions: {
          create(params: Record<string, unknown>): Promise<{ url: string }>
        }
      }
    }
  } catch {
    return null
  }
}

export async function createCheckoutSession(
  input: CheckoutSessionInput,
): Promise<StripeResult<{ url: string }>> {
  const stripe = await loadStripe()
  if (!stripe) {
    return {
      ok: false,
      message: "Stripe가 아직 설정되지 않았습니다. 관리자에게 문의하세요.",
    }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: input.priceId, quantity: 1 }],
      customer_email: input.userEmail,
      client_reference_id: input.userId,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      allow_promotion_codes: true,
    })
    if (!session.url) return { ok: false, message: "Stripe 세션 URL이 없습니다" }
    return { ok: true, data: { url: session.url } }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Stripe 요청 실패",
    }
  }
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string,
): Promise<StripeResult<{ url: string }>> {
  const stripe = await loadStripe()
  if (!stripe) return { ok: false, message: "Stripe가 설정되지 않았습니다" }
  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })
    return { ok: true, data: { url: portal.url } }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Stripe 포털 요청 실패",
    }
  }
}

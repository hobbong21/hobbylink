import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Stripe webhook endpoint.
 *
 * - Until `stripe` is installed + STRIPE_WEBHOOK_SECRET is set, returns 202
 *   so dashboard test deliveries don't fail.
 * - Once configured, verifies signatures and upserts rows into the
 *   `subscriptions` table using the service-role Supabase client.
 *
 * Stripe events handled:
 *   checkout.session.completed            → create subscription row
 *   customer.subscription.updated         → update tier/status/period
 *   customer.subscription.deleted         → mark canceled
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const stripeKey = process.env.STRIPE_SECRET_KEY

  if (!secret || !stripeKey) {
    return NextResponse.json(
      { ok: true, stub: true, message: "Stripe not configured; event ignored" },
      { status: 202 },
    )
  }

  const sig = req.headers.get("stripe-signature")
  if (!sig) {
    return NextResponse.json({ ok: false, message: "Missing signature" }, { status: 400 })
  }

  const body = await req.text()

  // Dynamic import so builds succeed without `stripe` installed.
  let Stripe: new (key: string) => {
    webhooks: { constructEvent: (b: string, sig: string, secret: string) => unknown }
  }
  try {
    const mod = (await import(/* webpackIgnore: true */ "stripe")) as {
      default: new (key: string) => {
        webhooks: { constructEvent: (b: string, sig: string, secret: string) => unknown }
      }
    }
    Stripe = mod.default
  } catch {
    return NextResponse.json(
      { ok: false, message: "Stripe SDK not installed. Run `pnpm add stripe`." },
      { status: 501 },
    )
  }

  const stripe = new Stripe(stripeKey)
  let event: { type: string; data: { object: Record<string, unknown> } }
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret) as typeof event
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        message: `Signature verification failed: ${err instanceof Error ? err.message : "unknown"}`,
      },
      { status: 400 },
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRole) {
    return NextResponse.json({ ok: false, message: "Supabase service role not configured" }, { status: 500 })
  }

  const { createClient } = await import("@supabase/supabase-js")
  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as {
          client_reference_id?: string
          customer?: string
          subscription?: string
        }
        if (session.client_reference_id) {
          await admin.from("subscriptions").upsert(
            {
              user_id: session.client_reference_id,
              tier: "premium",
              status: "active",
              provider: "stripe",
              provider_customer_id: session.customer ?? null,
              provider_subscription_id: session.subscription ?? null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          )
        }
        break
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as {
          id: string
          status: string
          current_period_end?: number
          cancel_at_period_end?: boolean
          customer?: string
        }
        // Find the row by provider_subscription_id.
        await admin
          .from("subscriptions")
          .update({
            status: sub.status,
            current_period_end: sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null,
            cancel_at_period_end: sub.cancel_at_period_end ?? false,
            tier: sub.status === "active" ? "premium" : "free",
            updated_at: new Date().toISOString(),
          })
          .eq("provider_subscription_id", sub.id)
        break
      }
      default:
        // Unhandled but acknowledged.
        break
    }
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        message: err instanceof Error ? err.message : "Processing failed",
      },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({ status: "ready" })
}

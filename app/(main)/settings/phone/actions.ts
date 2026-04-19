"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

/**
 * Phone verification uses Supabase Auth's built-in OTP flow. The caller
 * must have an SMS provider (Twilio, MessageBird, Vonage, or Textlocal)
 * configured in the Supabase project dashboard — see docs/sms.md.
 *
 * Flow:
 *   1. User enters phone → `sendPhoneOtp` triggers supabase.auth.updateUser
 *   2. User enters OTP   → `verifyPhoneOtp` calls supabase.auth.verifyOtp
 *   3. `profiles.phone_verified_at` auto-syncs via 044 trigger
 */

// Loose E.164 regex. Allows + and 7-15 digits. We do NOT validate country
// codes here; Supabase / the SMS provider will reject malformed numbers.
const PhoneSchema = z.string().regex(/^\+?[1-9]\d{6,14}$/, "국가번호를 포함한 국제 형식으로 입력해주세요")

const OtpSchema = z.string().regex(/^\d{4,8}$/, "4~8자리 숫자 코드를 입력해주세요")

export async function sendPhoneOtp(rawPhone: string) {
  const parsed = PhoneSchema.safeParse(rawPhone.trim())
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0].message }
  }
  const phone = parsed.data.startsWith("+") ? parsed.data : `+${parsed.data}`

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "로그인이 필요합니다" }

  // `updateUser({ phone })` emits an OTP to the new number. Supabase holds
  // the pending change server-side until `verifyOtp({ type: 'phone_change' })`.
  const { error } = await supabase.auth.updateUser({ phone })
  if (error) return { ok: false as const, message: error.message }

  return { ok: true as const }
}

export async function verifyPhoneOtp(rawPhone: string, rawOtp: string) {
  const phoneRes = PhoneSchema.safeParse(rawPhone.trim())
  if (!phoneRes.success) {
    return { ok: false as const, message: phoneRes.error.issues[0].message }
  }
  const otpRes = OtpSchema.safeParse(rawOtp.trim())
  if (!otpRes.success) {
    return { ok: false as const, message: otpRes.error.issues[0].message }
  }

  const phone = phoneRes.data.startsWith("+") ? phoneRes.data : `+${phoneRes.data}`

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    phone,
    token: otpRes.data,
    type: "phone_change",
  })
  if (error) return { ok: false as const, message: error.message }

  revalidatePath("/settings/phone")
  revalidatePath("/settings")
  return { ok: true as const }
}

export async function unlinkPhone() {
  // Supabase doesn't expose a clean "remove phone" call from the client SDK.
  // As a workaround we null out phone_verified_at on the profile mirror so
  // trusted-action gates stop treating the user as verified. The caller can
  // later re-link a different number, which overwrites auth.users.phone.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "로그인이 필요합니다" }

  const { error } = await supabase
    .from("profiles")
    .update({ phone_verified_at: null })
    .eq("id", user.id)
  if (error) return { ok: false as const, message: error.message }

  revalidatePath("/settings/phone")
  revalidatePath("/settings")
  return { ok: true as const }
}

/**
 * 토스페이먼츠 Billing Pay 연동 스텁.
 *
 * 한국 PG 연동을 위해 Stripe 대신/함께 사용할 수 있는 어댑터입니다. 실제 결제
 * 흐름을 연결하기 전까지는 `TOSS_SECRET_KEY` 미설정 시 `{ ok: false }`를 반환합니다.
 *
 * 참고: https://docs.tosspayments.com/reference/using-api/api-keys
 */

export interface TossCheckoutInput {
  userId: string
  userEmail: string
  priceKrw: number
  orderName: string
  successUrl: string
  failUrl: string
}

export interface TossResult<T> {
  ok: boolean
  data?: T
  message?: string
}

const BASE_URL = "https://api.tosspayments.com/v1"

/**
 * Creates a Billing Auth URL. The user is redirected there, and once they
 * complete auth TossPayments redirects to `successUrl?customerKey=...&
 * authKey=...` — your webhook then completes the subscription.
 */
export async function issueTossBillingAuth(
  input: TossCheckoutInput,
): Promise<TossResult<{ url: string }>> {
  const secret = process.env.TOSS_SECRET_KEY
  if (!secret) {
    return { ok: false, message: "토스페이먼츠가 설정되지 않았습니다" }
  }

  try {
    const res = await fetch(`${BASE_URL}/billing/authorizations/issue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}`,
      },
      body: JSON.stringify({
        customerKey: input.userId,
        successUrl: input.successUrl,
        failUrl: input.failUrl,
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      return { ok: false, message: `Toss ${res.status}: ${body}` }
    }
    const data = (await res.json()) as { url?: string }
    if (!data.url) return { ok: false, message: "Toss 응답에 URL이 없습니다" }
    return { ok: true, data: { url: data.url } }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "토스 요청 실패",
    }
  }
}

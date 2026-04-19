/**
 * Minimal ambient declaration for the `web-push` package. Installing
 * `@types/web-push` pulls in types that don't match the 3.6.x runtime
 * cleanly, so we declare only the functions we call from lib/push/send.ts.
 */
declare module "web-push" {
  export interface PushSubscription {
    endpoint: string
    keys: {
      p256dh: string
      auth: string
    }
  }

  export function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string,
  ): void

  export interface SendNotificationResult {
    statusCode: number
    body: string
    headers: Record<string, string>
  }

  export function sendNotification(
    subscription: PushSubscription,
    payload?: string | Buffer | null,
    options?: {
      TTL?: number
      urgency?: "very-low" | "low" | "normal" | "high"
      topic?: string
      headers?: Record<string, string>
    },
  ): Promise<SendNotificationResult>

  const _default: {
    setVapidDetails: typeof setVapidDetails
    sendNotification: typeof sendNotification
  }
  export default _default
}

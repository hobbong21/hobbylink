import type { Metadata } from "next"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

export const metadata: Metadata = { title: "서비스 상태" }

/**
 * Minimal status page. Hits /api/health on the server and renders the result.
 * Swap for statuspage.io or a proper uptime dashboard when ready.
 */
async function fetchHealth() {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    const res = await fetch(`${base}/api/health`, { cache: "no-store" })
    return (await res.json()) as { status: string; latencyMs?: number; error?: string }
  } catch (err) {
    return {
      status: "error",
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

export default async function StatusPage() {
  const health = await fetchHealth()
  const ok = health.status === "ok"

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">서비스 상태</h1>
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <CheckCircle2
              aria-hidden="true"
              className={ok ? "w-6 h-6 text-green-600" : "w-6 h-6 text-red-600"}
            />
            <div>
              <p className="font-medium">
                {ok ? "모든 시스템이 정상 작동 중입니다" : "일부 시스템 장애"}
              </p>
              {health.latencyMs !== undefined && (
                <p className="text-xs text-muted-foreground">
                  Supabase 응답 {health.latencyMs}ms
                </p>
              )}
              {health.error && (
                <p className="text-xs text-red-600">{health.error}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

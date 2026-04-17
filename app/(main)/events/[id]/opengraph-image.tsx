import { ImageResponse } from "next/og"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/**
 * Dynamic OG image for `/events/[id]`. Renders the event title + date +
 * location as SVG-ish layout so shared links show a rich preview. No
 * external fonts — relies on the platform default for safety.
 */
export default async function OgImage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: event } = await supabase
    .from("events")
    .select("title, event_date, location, hobbies(name, category)")
    .eq("id", params.id)
    .maybeSingle()

  const title = event?.title ?? "HobbyLink"
  const when = event?.event_date
    ? new Date(event.event_date).toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : ""
  const category =
    (
      event as { hobbies?: { category?: string; name?: string } | null } | null
    )?.hobbies?.category ?? null

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 72px",
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #1e1b4b 60%, #1e3a8a 100%)",
          color: "#ffffff",
          fontFamily:
            'system-ui, -apple-system, "Helvetica Neue", Apple SD Gothic Neo, sans-serif',
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#ffffff",
              color: "#0a0a0a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 28,
            }}
          >
            H
          </div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>HobbyLink</div>
          {category && (
            <div
              style={{
                marginLeft: "auto",
                padding: "8px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.15)",
                fontSize: 22,
              }}
            >
              {category}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              maxHeight: 220,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {title}
          </div>
          {when && (
            <div style={{ fontSize: 28, color: "rgba(255,255,255,0.85)" }}>
              {when}
            </div>
          )}
          {event?.location && (
            <div style={{ fontSize: 26, color: "rgba(255,255,255,0.70)" }}>
              📍 {event.location}
            </div>
          )}
        </div>

        <div style={{ fontSize: 22, color: "rgba(255,255,255,0.55)" }}>
          취미로 연결되는 오프라인 모임
        </div>
      </div>
    ),
    size,
  )
}

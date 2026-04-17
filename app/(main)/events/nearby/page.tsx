import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { NearbyForm } from "./nearby-form"
import { getNearbyEvents } from "@/lib/events"
import { EventsMap } from "@/components/kakao-map/events-map"
import { Calendar, Clock, MapPin } from "lucide-react"

interface NearbyPageProps {
  searchParams: Promise<{
    lat?: string
    lng?: string
    radius?: string
  }>
}

export default async function NearbyEventsPage({ searchParams }: NearbyPageProps) {
  const params = await searchParams
  const lat = params.lat ? Number(params.lat) : null
  const lng = params.lng ? Number(params.lng) : null
  const radius = params.radius ? Math.max(1, Math.min(100, Number(params.radius))) : 10

  const hasCoords =
    lat !== null && lng !== null && !Number.isNaN(lat) && !Number.isNaN(lng)

  const events = hasCoords ? await getNearbyEvents({ lat, lng }, radius, 50) : []

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">주변 이벤트</h1>
          <p className="text-muted-foreground mt-2">
            현재 위치를 기준으로 반경 내 오프라인 모임을 찾아보세요.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>위치 설정</CardTitle>
            <CardDescription>
              브라우저의 위치 정보 권한이 필요합니다. 좌표는 이 페이지 범위에서만 사용되며
              서버에 저장되지 않습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NearbyForm initialRadius={radius} />
          </CardContent>
        </Card>

        {hasCoords && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              반경 {radius}km 이내 ({events.length})
            </h2>
            {events.length > 0 && (
              <EventsMap
                center={{ lat: lat as number, lng: lng as number }}
                events={events
                  .filter((e) => e.latitude !== null && e.longitude !== null)
                  .map((e) => ({
                    id: e.id,
                    title: e.title,
                    lat: e.latitude!,
                    lng: e.longitude!,
                    distance_km: e.distance_km,
                  }))}
              />
            )}
            {events.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  해당 반경에 예정된 모임이 없습니다.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {events.map((e) => {
                  const date = new Date(e.event_date)
                  return (
                    <Card key={e.id}>
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <Link
                            href={`/events/${e.id}`}
                            className="font-semibold hover:underline"
                          >
                            {e.title}
                          </Link>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar aria-hidden="true" className="w-3 h-3" />
                              {date.toLocaleDateString("ko-KR")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock aria-hidden="true" className="w-3 h-3" />
                              {date.toLocaleTimeString("ko-KR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {e.location && (
                              <span className="flex items-center gap-1">
                                <MapPin aria-hidden="true" className="w-3 h-3" />
                                {e.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm flex-shrink-0">
                          <p className="font-medium">{e.distance_km.toFixed(1)} km</p>
                          <Button asChild size="sm" variant="outline" className="mt-2">
                            <Link href={`/events/${e.id}`}>자세히</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}

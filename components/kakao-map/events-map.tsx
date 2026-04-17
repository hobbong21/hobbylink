"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { KakaoMapScript } from "./script-loader"
import type { KakaoMap, KakaoMarker, KakaoMarkerClusterer } from "./types"

export interface EventPin {
  id: string
  title: string
  lat: number
  lng: number
  distance_km?: number
}

interface EventsMapProps {
  center: { lat: number; lng: number }
  events: EventPin[]
}

/**
 * Renders pins for a list of events on a Kakao map.
 *
 * The Kakao SDK ships a cluster library (`libraries=clusterer`) but we keep
 * the loader URL static at `libraries=services`. At current scale a naive
 * "drop all markers" approach is more than fine; swap to MarkerClusterer
 * once you routinely render 100+ pins on screen.
 *
 * If the app key is missing, renders nothing — the caller should also render
 * a list-based fallback.
 */
export function EventsMap({ center, events }: EventsMapProps) {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY
  const mapRef = useRef<HTMLDivElement | null>(null)
  const markers = useRef<KakaoMarker[]>([])
  const clusterer = useRef<KakaoMarkerClusterer | null>(null)
  const mapInstance = useRef<KakaoMap | null>(null)
  const [sdkReady, setSdkReady] = useState(false)
  const [selected, setSelected] = useState<EventPin | null>(null)

  useEffect(() => {
    if (!sdkReady || !mapRef.current) return
    const kakao = window.kakao?.maps
    if (!kakao) return

    const centerPos = new kakao.LatLng(center.lat, center.lng)
    const map = new kakao.Map(mapRef.current, { center: centerPos, level: 6 })
    mapInstance.current = map

    const created: KakaoMarker[] = []
    for (const e of events) {
      const pos = new kakao.LatLng(e.lat, e.lng)
      const marker = new kakao.Marker({ position: pos })
      kakao.event.addListener<unknown[]>(marker, "click", () => {
        setSelected(e)
        map.panTo(pos)
      })
      created.push(marker)
    }
    markers.current = created

    // Use MarkerClusterer when available and there are >20 pins; otherwise
    // drop markers straight onto the map for maximum detail.
    if (kakao.MarkerClusterer && created.length > 20) {
      const cluster = new kakao.MarkerClusterer({
        map,
        averageCenter: true,
        minLevel: 5,
        gridSize: 60,
      })
      cluster.addMarkers(created)
      clusterer.current = cluster
    } else {
      for (const m of created) m.setMap(map)
    }

    return () => {
      if (clusterer.current) {
        clusterer.current.clear()
        clusterer.current.setMap(null)
        clusterer.current = null
      }
      for (const m of markers.current) m.setMap(null)
      markers.current = []
    }
  }, [sdkReady, center.lat, center.lng, events])

  if (!appKey) return null

  return (
    <div className="space-y-2">
      <KakaoMapScript onReady={() => setSdkReady(true)} />
      <div
        ref={mapRef}
        className="w-full h-80 rounded-md overflow-hidden border bg-muted"
        role="application"
        aria-label="주변 모임 지도"
      />
      {selected && (
        <div className="p-3 rounded-md border bg-card flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium truncate">{selected.title}</p>
            {typeof selected.distance_km === "number" && (
              <p className="text-xs text-muted-foreground">
                {selected.distance_km.toFixed(1)} km 거리
              </p>
            )}
          </div>
          <Link
            href={`/events/${selected.id}`}
            className="text-sm text-primary underline whitespace-nowrap"
          >
            자세히 →
          </Link>
        </div>
      )}
    </div>
  )
}

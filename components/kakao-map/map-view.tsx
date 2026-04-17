"use client"

import { useEffect, useRef, useState } from "react"
import { KakaoMapScript } from "./script-loader"

interface MapViewProps {
  lat: number
  lng: number
  /** Optional popup text shown on the marker. */
  title?: string
}

/**
 * Read-only map view that drops a pin at (lat, lng).
 * Silently renders nothing when the Kakao app key isn't configured.
 */
export function MapView({ lat, lng, title }: MapViewProps) {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY
  const mapRef = useRef<HTMLDivElement | null>(null)
  const [sdkReady, setSdkReady] = useState(false)

  useEffect(() => {
    if (!sdkReady || !mapRef.current) return
    const kakao = window.kakao?.maps
    if (!kakao) return

    const center = new kakao.LatLng(lat, lng)
    const map = new kakao.Map(mapRef.current, { center, level: 4 })
    new kakao.Marker({ position: center, map })
    return () => {
      // Kakao Map has no explicit destroy; letting GC handle.
      void map
    }
  }, [sdkReady, lat, lng])

  if (!appKey) return null

  return (
    <div className="space-y-2">
      <KakaoMapScript onReady={() => setSdkReady(true)} />
      <div
        ref={mapRef}
        className="w-full h-64 rounded-md overflow-hidden border bg-muted"
        role="img"
        aria-label={title ? `${title} 위치 지도` : "위치 지도"}
      />
    </div>
  )
}

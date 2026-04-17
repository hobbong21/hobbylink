"use client"

import Script from "next/script"
import { useEffect, useState } from "react"

interface KakaoMapScriptProps {
  /** Optional callback when window.kakao is ready. */
  onReady?: () => void
}

/**
 * Loads the Kakao Maps SDK on demand via next/script. Uses
 * `autoload=false` + `kakao.maps.load()` so the script can be injected
 * declaratively and still initialize only after we know it's loaded.
 *
 * Env: NEXT_PUBLIC_KAKAO_MAP_APP_KEY
 */
export function KakaoMapScript({ onReady }: KakaoMapScriptProps) {
  const [ready, setReady] = useState(false)
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY

  useEffect(() => {
    if (ready) onReady?.()
  }, [ready, onReady])

  if (!appKey) return null

  // services: geocoder / places
  // clusterer: MarkerClusterer for dense pin views
  const src = `https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=${appKey}&libraries=services,clusterer`

  return (
    <Script
      src={src}
      strategy="afterInteractive"
      onLoad={() => {
        const w = window as typeof window & { kakao?: { maps: { load: (cb: () => void) => void } } }
        w.kakao?.maps?.load(() => setReady(true))
      }}
    />
  )
}

"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { KakaoMapScript } from "./script-loader"
import type { KakaoMap, KakaoMarker } from "./types"

interface LocationPickerProps {
  /** Form field names produced by this picker. */
  latName: string
  lngName: string
  addressName: string
  /** Initial coordinates to seed the map (defaults to Seoul City Hall). */
  initialLat?: number
  initialLng?: number
  initialAddress?: string
}

/**
 * Embeds a Kakao map and lets the user pick a location by clicking or
 * searching. Emits `<input type="hidden">` fields so a plain HTML <form>
 * (server action) picks up lat/lng/address with no extra wiring.
 *
 * If NEXT_PUBLIC_KAKAO_MAP_APP_KEY is not configured, renders a manual
 * lat/lng input fallback so the page still works.
 */
export function LocationPicker({
  latName,
  lngName,
  addressName,
  initialLat = 37.5665,
  initialLng = 126.978,
  initialAddress = "",
}: LocationPickerProps) {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY
  const [lat, setLat] = useState(initialLat)
  const [lng, setLng] = useState(initialLng)
  const [address, setAddress] = useState(initialAddress)
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)

  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstance = useRef<KakaoMap | null>(null)
  const markerInstance = useRef<KakaoMarker | null>(null)

  const [sdkReady, setSdkReady] = useState(false)

  useEffect(() => {
    if (!sdkReady || !mapRef.current) return
    const kakao = window.kakao?.maps
    if (!kakao) return

    const center = new kakao.LatLng(lat, lng)
    const map = new kakao.Map(mapRef.current, { center, level: 5 })
    const marker = new kakao.Marker({ position: center, map })

    mapInstance.current = map
    markerInstance.current = marker

    kakao.event.addListener<[{ latLng: { getLat(): number; getLng(): number } }]>(
      map,
      "click",
      (event) => {
        const pos = event.latLng
        const newLat = pos.getLat()
        const newLng = pos.getLng()
        setLat(newLat)
        setLng(newLng)
        marker.setPosition(new kakao.LatLng(newLat, newLng))
      },
    )
    // We deliberately depend only on sdkReady — further coordinate updates
    // happen imperatively on the existing map instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkReady])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const kakao = window.kakao?.maps
    if (!kakao?.services) {
      setError("주소 검색 서비스가 아직 로드되지 않았습니다.")
      return
    }
    const geocoder = new kakao.services.Geocoder()
    geocoder.addressSearch(query, (results, status) => {
      if (status !== kakao.services.Status.OK || results.length === 0) {
        setError("주소를 찾지 못했습니다.")
        return
      }
      const top = results[0]
      const newLat = Number(top.y)
      const newLng = Number(top.x)
      setLat(newLat)
      setLng(newLng)
      setAddress(top.address_name)
      if (mapInstance.current && markerInstance.current) {
        const pos = new kakao.LatLng(newLat, newLng)
        mapInstance.current.panTo(pos)
        markerInstance.current.setPosition(pos)
      }
    })
  }

  if (!appKey) {
    // Graceful fallback — manual lat/lng input.
    return (
      <div className="space-y-3 rounded-md border border-dashed p-4">
        <p className="text-xs text-muted-foreground">
          Kakao Maps 키가 설정되지 않아 수동 입력 모드로 표시됩니다. (
          <code className="font-mono">NEXT_PUBLIC_KAKAO_MAP_APP_KEY</code>)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Input
            type="number"
            step="any"
            placeholder="위도"
            value={lat}
            onChange={(e) => setLat(Number(e.target.value))}
            aria-label="위도"
          />
          <Input
            type="number"
            step="any"
            placeholder="경도"
            value={lng}
            onChange={(e) => setLng(Number(e.target.value))}
            aria-label="경도"
          />
          <Input
            placeholder="주소"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            aria-label="주소"
          />
        </div>
        <input type="hidden" name={latName} value={lat} />
        <input type="hidden" name={lngName} value={lng} />
        <input type="hidden" name={addressName} value={address} />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <KakaoMapScript onReady={() => setSdkReady(true)} />
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="주소 또는 장소명으로 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" size="sm">
          검색
        </Button>
      </form>
      <div
        ref={mapRef}
        className="w-full h-72 rounded-md overflow-hidden border bg-muted"
        aria-label="지도. 클릭해서 위치를 선택하세요."
      />
      <p className="text-xs text-muted-foreground">
        {address ? `선택된 주소: ${address}` : "지도를 클릭해 위치를 선택하세요."}
        <span className="ml-2 font-mono">
          ({lat.toFixed(5)}, {lng.toFixed(5)})
        </span>
      </p>
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="p-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded"
        >
          {error}
        </div>
      )}
      <input type="hidden" name={latName} value={lat} />
      <input type="hidden" name={lngName} value={lng} />
      <input type="hidden" name={addressName} value={address} />
    </div>
  )
}

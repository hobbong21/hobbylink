"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { KakaoMapScript } from "./script-loader"
import type { KakaoPlaces, KakaoPlaceResult } from "./types"

interface PickedPlace {
  name: string
  address: string
  lat: number
  lng: number
}

interface PlacesAutocompleteProps {
  onPick: (place: PickedPlace) => void
  placeholder?: string
}

/**
 * Combobox backed by Kakao Places `keywordSearch`. Debounced 250ms.
 * When the Kakao key is missing, renders a plain input that only bubbles
 * up free-text (no geocoding) — the caller should handle that fallback.
 */
export function PlacesAutocomplete({
  onPick,
  placeholder = "장소 검색",
}: PlacesAutocompleteProps) {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<KakaoPlaceResult[]>([])
  const [open, setOpen] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)
  const placesRef = useRef<KakaoPlaces | null>(null)

  useEffect(() => {
    if (!sdkReady) return
    const kakao = window.kakao?.maps
    if (!kakao?.services) return
    placesRef.current = new kakao.services.Places()
  }, [sdkReady])

  useEffect(() => {
    if (!placesRef.current || !query.trim()) {
      setResults([])
      return
    }
    const timer = window.setTimeout(() => {
      placesRef.current!.keywordSearch(query, (items, status) => {
        const kakao = window.kakao?.maps
        if (!kakao) return
        if (status !== kakao.services.Status.OK) {
          setResults([])
          return
        }
        setResults(items.slice(0, 6))
      })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [query])

  if (!appKey) {
    // Fallback: free-text only
    return (
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => {
          if (query.trim()) {
            onPick({ name: query, address: query, lat: 0, lng: 0 })
          }
        }}
        placeholder={placeholder}
      />
    )
  }

  return (
    <div className="relative">
      <KakaoMapScript onReady={() => setSdkReady(true)} />
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onFocus={() => query && setOpen(true)}
        placeholder={placeholder}
      />
      {open && results.length > 0 && (
        <div
          role="listbox"
          aria-label="장소 제안"
          className="absolute left-0 right-0 top-full mt-1 z-20 max-h-64 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md"
        >
          {results.map((r) => (
            <button
              key={`${r.place_name}-${r.x}-${r.y}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                const lat = Number(r.y)
                const lng = Number(r.x)
                onPick({
                  name: r.place_name,
                  address: r.road_address_name || r.address_name,
                  lat,
                  lng,
                })
                setQuery(r.place_name)
                setResults([])
                setOpen(false)
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50"
            >
              <p className="font-medium truncate">{r.place_name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {r.road_address_name || r.address_name}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

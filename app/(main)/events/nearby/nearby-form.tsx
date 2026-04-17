"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin } from "lucide-react"

interface NearbyFormProps {
  initialRadius: number
}

export function NearbyForm({ initialRadius }: NearbyFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [lat, setLat] = useState(searchParams.get("lat") ?? "")
  const [lng, setLng] = useState(searchParams.get("lng") ?? "")
  const [radius, setRadius] = useState(String(initialRadius))
  const [error, setError] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)

  const handleUseCurrentLocation = () => {
    setError(null)
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("이 브라우저는 위치 정보 기능을 지원하지 않습니다.")
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6))
        setLng(pos.coords.longitude.toFixed(6))
        setIsLocating(false)
      },
      (err) => {
        setError(`위치 정보를 가져올 수 없습니다: ${err.message}`)
        setIsLocating(false)
      },
      { enableHighAccuracy: false, timeout: 10_000 },
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!lat || !lng) {
      setError("위도·경도를 입력하거나 현재 위치를 사용해주세요.")
      return
    }
    const params = new URLSearchParams()
    params.set("lat", lat)
    params.set("lng", lng)
    params.set("radius", radius)
    router.push(`/events/nearby?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Button
        type="button"
        variant="outline"
        onClick={handleUseCurrentLocation}
        disabled={isLocating}
        className="gap-2"
      >
        <MapPin aria-hidden="true" className="w-4 h-4" />
        {isLocating ? "위치 확인 중..." : "현재 위치 사용"}
      </Button>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor="lat">위도</Label>
          <Input
            id="lat"
            type="number"
            step="any"
            min={-90}
            max={90}
            value={lat}
            onChange={(e) => setLat(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="lng">경도</Label>
          <Input
            id="lng"
            type="number"
            step="any"
            min={-180}
            max={180}
            value={lng}
            onChange={(e) => setLng(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="radius">반경 (km)</Label>
          <Input
            id="radius"
            type="number"
            min={1}
            max={100}
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
          />
        </div>
      </div>
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md"
        >
          {error}
        </div>
      )}
      <Button type="submit">검색</Button>
    </form>
  )
}

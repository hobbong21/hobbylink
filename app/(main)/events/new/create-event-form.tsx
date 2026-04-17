"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createEvent } from "../actions"
import { LocationPicker } from "@/components/kakao-map/location-picker"
import { PlacesAutocomplete } from "@/components/kakao-map/places-autocomplete"

interface CreateEventFormProps {
  hobbies: { id: string; name: string; category: string }[]
}

export function CreateEventForm({ hobbies }: CreateEventFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [hobbyId, setHobbyId] = useState<string>("")
  const [locationName, setLocationName] = useState("")
  const [locationAddress, setLocationAddress] = useState("")
  const [locationLat, setLocationLat] = useState<number | null>(null)
  const [locationLng, setLocationLng] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const onSubmit = (formData: FormData) => {
    setError(null)
    if (hobbyId) formData.set("hobby_id", hobbyId)
    startTransition(async () => {
      const result = await createEvent(formData)
      if (!result.ok) {
        setError(result.message)
        return
      }
      router.push(`/events/${result.eventId}`)
      router.refresh()
    })
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">제목</Label>
        <Input id="title" name="title" required maxLength={100} placeholder="예: 토요일 한강 자전거 라이딩" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">설명</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          maxLength={1000}
          placeholder="어떤 모임인지 간단히 설명해주세요"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event_date">일시</Label>
          <Input
            id="event_date"
            name="event_date"
            type="datetime-local"
            required
            min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_participants">최대 인원 (선택)</Label>
          <Input
            id="max_participants"
            name="max_participants"
            type="number"
            min={2}
            max={10000}
            placeholder="예: 10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="recurrence_frequency">반복 (선택)</Label>
          <select
            id="recurrence_frequency"
            name="recurrence_frequency"
            defaultValue=""
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">반복 안 함</option>
            <option value="weekly">매주</option>
            <option value="biweekly">격주</option>
            <option value="monthly">매월</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="recurrence_count">반복 횟수 (최대 20)</Label>
          <Input
            id="recurrence_count"
            name="recurrence_count"
            type="number"
            min={1}
            max={20}
            defaultValue={1}
            placeholder="1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">장소 이름</Label>
        <PlacesAutocomplete
          placeholder="예: 홍대 보드게임 카페"
          onPick={(place) => {
            setLocationName(place.name)
            setLocationAddress(place.address)
            setLocationLat(place.lat || null)
            setLocationLng(place.lng || null)
          }}
        />
        <Input
          id="location"
          name="location"
          maxLength={200}
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          placeholder="수동 입력도 가능"
        />
        <input type="hidden" name="location_address" value={locationAddress} />
        {locationLat !== null && locationLng !== null && (
          <>
            <input type="hidden" name="latitude" value={locationLat} />
            <input type="hidden" name="longitude" value={locationLng} />
          </>
        )}
      </div>

      {locationLat === null && (
        <div className="space-y-2">
          <Label>지도에서 위치 선택 (선택)</Label>
          <LocationPicker
            latName="latitude"
            lngName="longitude"
            addressName="location_address"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="hobby_id">관련 취미 (선택)</Label>
        <Select value={hobbyId} onValueChange={setHobbyId}>
          <SelectTrigger id="hobby_id">
            <SelectValue placeholder="취미 선택" />
          </SelectTrigger>
          <SelectContent>
            {hobbies.map((h) => (
              <SelectItem key={h.id} value={h.id}>
                {h.name} ({h.category})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "생성 중..." : "모임 만들기"}
      </Button>
    </form>
  )
}

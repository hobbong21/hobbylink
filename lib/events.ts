import { createClient } from "@/lib/supabase/server"
import { boundingBox, distanceKm, type LatLng } from "@/lib/geo"
import type { Tables } from "@/lib/database.types"

export interface NearbyEvent extends Tables<"events"> {
  distance_km: number
}

/**
 * Returns upcoming events within `radiusKm` of `center`, sorted by distance.
 * Uses a bounding-box prefilter in SQL, then exact Haversine in app code.
 */
export async function getNearbyEvents(
  center: LatLng,
  radiusKm: number,
  limit = 50,
): Promise<NearbyEvent[]> {
  const supabase = await createClient()
  const box = boundingBox(center, radiusKm)
  const now = new Date().toISOString()

  const { data } = await supabase
    .from("events")
    .select("*")
    .gte("event_date", now)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .gte("latitude", box.minLat)
    .lte("latitude", box.maxLat)
    .gte("longitude", box.minLng)
    .lte("longitude", box.maxLng)
    .order("event_date", { ascending: true })
    .limit(limit * 2)

  const rows = (data ?? []) as Tables<"events">[]

  return rows
    .filter((e) => e.latitude !== null && e.longitude !== null)
    .map((e) => ({
      ...e,
      distance_km: distanceKm(center, { lat: e.latitude!, lng: e.longitude! }),
    }))
    .filter((e) => e.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, limit)
}

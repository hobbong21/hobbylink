/**
 * Geospatial utilities.
 *
 * Keep everything here small and dependency-free — we don't want to bundle a
 * full geo library for distance math. If we need serious geospatial queries
 * (containment, polygons), migrate Postgres to PostGIS instead.
 */

export interface LatLng {
  lat: number
  lng: number
}

/** Great-circle distance between two points in kilometers (Haversine). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371 // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/**
 * Returns the min/max latitude and longitude that bound a circle of `radiusKm`
 * centered at `center`. Useful for prefiltering events in a WHERE clause
 * before computing the exact Haversine distance in app code.
 *
 * The longitude delta varies with latitude; this helper accounts for that.
 */
export function boundingBox(center: LatLng, radiusKm: number) {
  const latDelta = radiusKm / 111 // ≈ 111 km per degree latitude
  const lngDelta = radiusKm / (111 * Math.cos((center.lat * Math.PI) / 180))
  return {
    minLat: center.lat - latDelta,
    maxLat: center.lat + latDelta,
    minLng: center.lng - lngDelta,
    maxLng: center.lng + lngDelta,
  }
}

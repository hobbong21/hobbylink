import { describe, it, expect } from "vitest"
import { distanceKm, boundingBox } from "@/lib/geo"

describe("distanceKm", () => {
  it("returns ~0 for identical points", () => {
    const p = { lat: 37.5665, lng: 126.978 } // Seoul City Hall
    expect(distanceKm(p, p)).toBeLessThan(0.001)
  })

  it("matches known Seoul → Busan distance (~325 km) within tolerance", () => {
    const seoul = { lat: 37.5665, lng: 126.978 }
    const busan = { lat: 35.1796, lng: 129.0756 }
    const km = distanceKm(seoul, busan)
    expect(km).toBeGreaterThan(310)
    expect(km).toBeLessThan(340)
  })
})

describe("boundingBox", () => {
  it("brackets the center", () => {
    const center = { lat: 37.5665, lng: 126.978 }
    const bb = boundingBox(center, 10)
    expect(bb.minLat).toBeLessThan(center.lat)
    expect(bb.maxLat).toBeGreaterThan(center.lat)
    expect(bb.minLng).toBeLessThan(center.lng)
    expect(bb.maxLng).toBeGreaterThan(center.lng)
  })

  it("scales with radius", () => {
    const center = { lat: 0, lng: 0 }
    const small = boundingBox(center, 1)
    const large = boundingBox(center, 100)
    expect(large.maxLat - large.minLat).toBeGreaterThan(small.maxLat - small.minLat)
  })
})

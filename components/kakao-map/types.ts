/**
 * Minimal type definitions for the Kakao Maps SDK we actually use.
 * Kakao publishes official TS types at @types/kakao-maps-sdk; this file keeps
 * us dependency-free and matches the surface needed by our components.
 */

export interface KakaoLatLng {
  getLat(): number
  getLng(): number
}

export interface KakaoMap {
  setCenter(pos: KakaoLatLng): void
  getCenter(): KakaoLatLng
  panTo(pos: KakaoLatLng): void
}

export interface KakaoMarker {
  setPosition(pos: KakaoLatLng): void
  setMap(map: KakaoMap | null): void
}

export interface KakaoGeocoderResult {
  address_name: string
  x: string // longitude
  y: string // latitude
}

export interface KakaoGeocoder {
  addressSearch(
    query: string,
    callback: (results: KakaoGeocoderResult[], status: string) => void,
  ): void
}

export interface KakaoPlaceResult {
  place_name: string
  address_name: string
  road_address_name: string
  x: string // longitude
  y: string // latitude
}

export interface KakaoPlaces {
  keywordSearch(
    keyword: string,
    callback: (results: KakaoPlaceResult[], status: string) => void,
  ): void
}

export interface KakaoMarkerClusterer {
  addMarkers(markers: KakaoMarker[]): void
  clear(): void
  setMap(map: KakaoMap | null): void
}

export interface KakaoMapsNamespace {
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level?: number }) => KakaoMap
  LatLng: new (lat: number, lng: number) => KakaoLatLng
  Marker: new (options: { position: KakaoLatLng; map?: KakaoMap }) => KakaoMarker
  MarkerClusterer?: new (options: {
    map: KakaoMap
    averageCenter?: boolean
    minLevel?: number
    gridSize?: number
  }) => KakaoMarkerClusterer
  event: {
    addListener<Args extends unknown[]>(
      target: KakaoMap | KakaoMarker,
      type: string,
      handler: (...args: Args) => void,
    ): void
  }
  services: {
    Geocoder: new () => KakaoGeocoder
    Places: new () => KakaoPlaces
    Status: { OK: string }
  }
}

declare global {
  interface Window {
    kakao?: { maps: KakaoMapsNamespace & { load(cb: () => void): void } }
  }
}

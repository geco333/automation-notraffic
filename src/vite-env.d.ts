/// <reference types="vite/client" />

declare namespace google.maps {
  class Map {
    constructor(el: HTMLElement, opts?: object)
    fitBounds(bounds: LatLngBounds, padding?: object): void
  }
  class Marker {
    constructor(opts?: object)
    setMap(map: Map | null): void
  }
  class LatLngBounds {
    extend(point: { lat: number; lng: number }): void
  }
  class Size {
    constructor(w: number, h: number)
  }
  class Point {
    constructor(x: number, y: number)
  }
}

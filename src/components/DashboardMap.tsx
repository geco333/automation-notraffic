import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '@/hooks/useGoogleMaps'

/** Generate random points around a center (e.g. city) */
function randomPoints(
  centerLat: number,
  centerLng: number,
  radiusDeg: number,
  count: number
): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = []
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * 2 * Math.PI
    const r = radiusDeg * Math.sqrt(Math.random())
    points.push({
      lat: centerLat + r * Math.cos(angle),
      lng: centerLng + r * Math.sin(angle),
    })
  }
  return points
}

export function DashboardMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let map: google.maps.Map | null = null
    const markers: google.maps.Marker[] = []

    loadGoogleMaps()
      .then(() => {
        if (!containerRef.current || !window.google?.maps) return

        const center = { lat: 39.0997, lng: -94.5786 }
        map = new window.google.maps.Map(containerRef.current, {
          center,
          zoom: 11,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
          ],
        })

        const g = window.google.maps
        const points = randomPoints(center.lat, center.lng, 0.15, 14)
        const bounds = new g.LatLngBounds()

        points.forEach((p, i) => {
          const marker = new g.Marker({
            position: p,
            map,
            title: `Point ${i + 1}`,
          })
          markers.push(marker)
          bounds.extend(p)
        })

        if (points.length > 1) {
          map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 })
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error loading map'))

    return () => {
      markers.forEach((m) => m.setMap(null))
      map = null
    }
  }, [])

  if (error) {
    return (
      <div className="dashboard-map dashboard-map-error">
        <p>{error}</p>
      </div>
    )
  }

  return <div ref={containerRef} className="dashboard-map" aria-label="Signals map" />
}

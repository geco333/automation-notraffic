const API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyAeBTtgK4Q7HxmYb3MftYnESNUaL0AHsAM'

let loadPromise: Promise<void> | null = null

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'))
  if (window.google?.maps?.Map) return Promise.resolve()

  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const id = 'google-maps-api-script'
    if (document.getElementById(id)) {
      const check = setInterval(() => {
        if (window.google?.maps?.Map) {
          clearInterval(check)
          resolve()
        }
      }, 100)
      return
    }
    const script = document.createElement('script')
    script.id = id
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}`
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google?.maps?.Map) resolve()
      else reject(new Error('Google Maps failed to load'))
    }
    script.onerror = () => reject(new Error('Google Maps script failed to load'))
    document.head.appendChild(script)
  })

  return loadPromise
}

declare global {
  interface Window {
    google?: { maps: typeof google.maps }
  }
}

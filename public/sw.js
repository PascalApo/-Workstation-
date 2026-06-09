/* SSP Workstation Service Worker – Offline-Unterstützung */
const CACHE_NAME = 'ssp-workstation-v2'
// Basis-Pfad aus dem SW-Speicherort ableiten ('/' lokal, '/Workstation/' auf GitHub Pages)
const BASE = new URL('./', self.location).pathname
const APP_SHELL = [BASE]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // SPA-Navigation: Netz zuerst, sonst gecachte Shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE_NAME).then((c) => c.put(BASE, copy))
          return res
        })
        .catch(() => caches.match(BASE)),
    )
    return
  }

  // Gehashte Build-Assets: Cache zuerst (unveränderlich)
  if (url.pathname.startsWith(`${BASE}assets/`)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone()
            caches.open(CACHE_NAME).then((c) => c.put(request, copy))
            return res
          }),
      ),
    )
    return
  }

  // Übrige same-origin GETs (Icons, Manifest): stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE_NAME).then((c) => c.put(request, copy))
          return res
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})

// Gemeinsame Helfer für Popup und Background.
export const DEFAULT_APP_URL = 'http://localhost:5175'

export async function getAppUrl() {
  const { appUrl } = await chrome.storage.sync.get('appUrl')
  return (appUrl || DEFAULT_APP_URL).replace(/\/+$/, '')
}

export function buildQuickAddUrl(appUrl, { title, type, date, time, notes }) {
  const params = new URLSearchParams()
  params.set('title', title)
  if (type) params.set('type', type)
  if (date) params.set('date', date)
  if (time) params.set('time', time)
  if (notes) params.set('notes', notes)
  return `${appUrl}/quickadd?${params.toString()}`
}

/** Öffnet die Quick-Add-URL: vorhandenen App-Tab wiederverwenden, sonst neuen Tab. */
export async function openInApp(url, appUrl) {
  const origin = new URL(appUrl).origin
  const tabs = await chrome.tabs.query({})
  const existing = tabs.find((t) => t.url && t.url.startsWith(origin))
  if (existing?.id != null) {
    await chrome.tabs.update(existing.id, { url, active: true })
    if (existing.windowId != null) {
      await chrome.windows.update(existing.windowId, { focused: true })
    }
  } else {
    await chrome.tabs.create({ url })
  }
}

import { DEFAULT_APP_URL, buildQuickAddUrl, getAppUrl, openInApp } from './shared.js'

const form = document.getElementById('form')
const titleEl = document.getElementById('title')
const typeEl = document.getElementById('type')
const dateEl = document.getElementById('date')
const timeEl = document.getElementById('time')
const notesEl = document.getElementById('notes')
const appUrlEl = document.getElementById('appUrl')

// Aktuellen Tab als Vorschlag übernehmen
chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
  if (tab?.title && !titleEl.value) titleEl.placeholder = tab.title.slice(0, 60)
  if (tab?.url && !tab.url.startsWith('chrome')) notesEl.value = tab.url
})

getAppUrl().then((url) => {
  appUrlEl.value = url
})

appUrlEl.addEventListener('change', () => {
  const value = appUrlEl.value.trim() || DEFAULT_APP_URL
  chrome.storage.sync.set({ appUrl: value })
})

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const title = titleEl.value.trim() || (tab?.title ?? '').slice(0, 140)
  if (!title) return

  const appUrl = await getAppUrl()
  const url = buildQuickAddUrl(appUrl, {
    title,
    type: typeEl.value,
    date: dateEl.value,
    time: timeEl.value,
    notes: notesEl.value.trim(),
  })
  await openInApp(url, appUrl)
  window.close()
})

import { buildQuickAddUrl, getAppUrl, openInApp } from './shared.js'

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'ssp-add-selection',
    title: 'Auswahl als Aufgabe in SSP Workstation',
    contexts: ['selection'],
  })
  chrome.contextMenus.create({
    id: 'ssp-add-page',
    title: 'Seite als Aufgabe in SSP Workstation',
    contexts: ['page'],
  })
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const appUrl = await getAppUrl()
  const title =
    info.menuItemId === 'ssp-add-selection' && info.selectionText
      ? info.selectionText.slice(0, 140)
      : (tab?.title ?? 'Neue Aufgabe').slice(0, 140)
  const notes = tab?.url ?? ''
  const url = buildQuickAddUrl(appUrl, { title, type: 'task', notes })
  await openInApp(url, appUrl)
})

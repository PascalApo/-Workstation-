import type { IntegrationSettings } from '../types'

const STORAGE_KEY = 'ssp-integration-settings'

const defaults: IntegrationSettings = {}

export function getIntegrationSettings(): IntegrationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaults }
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return { ...defaults }
  }
}

export function saveIntegrationSettings(settings: IntegrationSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

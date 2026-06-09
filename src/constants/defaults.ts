import type { RoutineTemplates } from '../types'

export const MEETING_NOTE_TEMPLATE = `## Ziel des Meetings


## Besprochene Punkte


## Entscheidungen


## Offene Fragen


## Nächste Schritte (wer / bis wann)

`

export const DEFAULT_ROUTINE_TEMPLATES: RoutineTemplates = {
  daily_morning: [
    'Kalender & Nachrichten prüfen',
    'Top-3 Prioritäten für heute festlegen',
    'Offene Follow-ups von gestern checken',
    'Material für heutige Termine bereitlegen',
  ],
  daily_evening: [
    'Meeting-Notizen sichern & Follow-ups anlegen',
    'Offene Punkte für morgen notieren',
    'Aufgabenliste für morgen vorbereiten',
    'Kurzer Tagesrückblick schreiben',
  ],
  weekly_review: [
    'Was habe ich diese Woche gelernt?',
    'Was lief gut / was war schwierig?',
    'Offene Aufgaben für nächste Woche planen',
    'Wichtige Kontakte & Themen notieren',
  ],
}

export const PRIORITY_LABELS = {
  high: 'Hoch',
  medium: 'Mittel',
  low: 'Niedrig',
} as const

export const FOLLOW_UP_LABELS = {
  open: 'Offen',
  done: 'Erledigt',
  waiting: 'Warten auf Antwort',
} as const

export const RECURRENCE_LABELS = {
  daily: 'Täglich',
  weekly: 'Wöchentlich',
  monthly: 'Monatlich',
} as const

export const ROUTINE_LABELS = {
  daily_morning: 'Morgen-Routine',
  daily_evening: 'Abend-Routine',
  weekly_review: 'Wochen-Review',
} as const

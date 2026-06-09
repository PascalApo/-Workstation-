import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { CalendarEvent } from '../types'
import {
  FLOW_HOUR_HEIGHT,
  HOUR_END,
  HOUR_START,
  getEventDurationMinutes,
  minutesToTime,
  yToSnappedMinutes,
} from '../utils/calendar'

export interface DropTarget {
  date: string
  time?: string
  columnIndex: number
  allDay: boolean
}

interface DragSession {
  event: CalendarEvent
  pointerId: number
  offsetX: number
  offsetY: number
  startX: number
  startY: number
  durationMinutes: number
  hadTime: boolean
}

interface ColumnZone {
  date: string
  columnIndex: number
  allDay: boolean
  rect: DOMRect
}

interface CalendarDragContextValue {
  session: DragSession | null
  ghostPos: { x: number; y: number } | null
  dropTarget: DropTarget | null
  justDroppedId: string | null
  isDragging: boolean
  startDrag: (
    event: CalendarEvent,
    e: React.PointerEvent<HTMLElement>,
  ) => void
  clearZones: () => void
  registerZone: (zone: ColumnZone) => void
  registerTimedGrid: (rect: DOMRect | null) => void
  onEventClick: (event: CalendarEvent) => void
  setOnEventClick: (fn: (event: CalendarEvent) => void) => void
}

const CalendarDragContext = createContext<CalendarDragContextValue | null>(null)

interface ProviderProps {
  children: ReactNode
  onMove: (
    event: CalendarEvent,
    target: DropTarget,
    durationMinutes: number,
  ) => Promise<void>
}

export function CalendarDragProvider({ children, onMove }: ProviderProps) {
  const [session, setSession] = useState<DragSession | null>(null)
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(
    null,
  )
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)
  const [justDroppedId, setJustDroppedId] = useState<string | null>(null)

  const zonesRef = useRef<ColumnZone[]>([])
  const timedGridRef = useRef<DOMRect | null>(null)
  const hasMovedRef = useRef(false)
  const onMoveRef = useRef(onMove)
  const onEventClickRef = useRef<(e: CalendarEvent) => void>(() => {})

  onMoveRef.current = onMove

  const clearZones = useCallback(() => {
    zonesRef.current = []
  }, [])

  const registerZone = useCallback((zone: ColumnZone) => {
    const existing = zonesRef.current.findIndex(
      (z) => z.date === zone.date && z.allDay === zone.allDay,
    )
    if (existing >= 0) zonesRef.current[existing] = zone
    else zonesRef.current.push(zone)
  }, [])

  const registerTimedGrid = useCallback((rect: DOMRect | null) => {
    timedGridRef.current = rect
  }, [])

  const findDropTarget = useCallback(
    (clientX: number, clientY: number): DropTarget | null => {
      for (const zone of zonesRef.current) {
        const r = zone.rect
        if (
          clientX >= r.left &&
          clientX <= r.right &&
          clientY >= r.top &&
          clientY <= r.bottom
        ) {
          if (zone.allDay) {
            return {
              date: zone.date,
              columnIndex: zone.columnIndex,
              allDay: true,
            }
          }
          const grid = timedGridRef.current
          if (!grid) return null
          const mins = yToSnappedMinutes(clientY, grid.top)
          return {
            date: zone.date,
            time: minutesToTime(mins),
            columnIndex: zone.columnIndex,
            allDay: false,
          }
        }
      }
      return null
    },
    [],
  )

  const startDrag = useCallback(
    (event: CalendarEvent, e: React.PointerEvent<HTMLElement>) => {
      if (event.status === 'done') return
      e.preventDefault()
      e.stopPropagation()
      const rect = e.currentTarget.getBoundingClientRect()
      const duration = getEventDurationMinutes(event.startTime, event.endTime)
      hasMovedRef.current = false
      setSession({
        event,
        pointerId: e.pointerId,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        startX: e.clientX,
        startY: e.clientY,
        durationMinutes: duration,
        hadTime: !!event.startTime,
      })
      setGhostPos({ x: e.clientX, y: e.clientY })
      setDropTarget(null)
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [],
  )

  useEffect(() => {
    if (!session) return

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== session.pointerId) return
      if (
        Math.abs(e.clientX - session.startX) > 4 ||
        Math.abs(e.clientY - session.startY) > 4
      ) {
        hasMovedRef.current = true
      }
      setGhostPos({ x: e.clientX, y: e.clientY })
      setDropTarget(findDropTarget(e.clientX, e.clientY))
    }

    const onUp = async (e: PointerEvent) => {
      if (e.pointerId !== session.pointerId) return
      const target = findDropTarget(e.clientX, e.clientY)
      if (target && hasMovedRef.current) {
        await onMoveRef.current(session.event, target, session.durationMinutes)
        setJustDroppedId(session.event.id)
        setTimeout(() => setJustDroppedId(null), 700)
      }
      setSession(null)
      setGhostPos(null)
      setDropTarget(null)
    }

    const onCancel = (e: PointerEvent) => {
      if (e.pointerId !== session.pointerId) return
      setSession(null)
      setGhostPos(null)
      setDropTarget(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
    }
  }, [session, findDropTarget])

  const value: CalendarDragContextValue = {
    session,
    ghostPos,
    dropTarget,
    justDroppedId,
    isDragging: !!session,
    startDrag,
    clearZones,
    registerZone,
    registerTimedGrid,
    onEventClick: (e) => onEventClickRef.current(e),
    setOnEventClick: (fn) => {
      onEventClickRef.current = fn
    },
  }

  return (
    <CalendarDragContext.Provider value={value}>
      {children}
    </CalendarDragContext.Provider>
  )
}

export function useCalendarDrag() {
  const ctx = useContext(CalendarDragContext)
  if (!ctx)
    throw new Error('useCalendarDrag must be used within CalendarDragProvider')
  return ctx
}

export function getDropPreviewHeight(durationMinutes: number): number {
  return Math.max((durationMinutes / 60) * FLOW_HOUR_HEIGHT, 24)
}

export { HOUR_START, HOUR_END, FLOW_HOUR_HEIGHT }

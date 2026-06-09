export const TASK_MIME = 'application/ssp-task-id'
export const MEETING_MIME = 'application/ssp-meeting-id'

export function setTaskDragData(e: React.DragEvent, taskId: string) {
  e.dataTransfer.setData(TASK_MIME, taskId)
  e.dataTransfer.setData('text/plain', taskId)
  e.dataTransfer.effectAllowed = 'move'
}

export function getTaskDragId(e: React.DragEvent): string | null {
  return (
    e.dataTransfer.getData(TASK_MIME) ||
    e.dataTransfer.getData('task-id') ||
    null
  )
}

export function setMeetingDragData(e: React.DragEvent, meetingId: string) {
  e.dataTransfer.setData(MEETING_MIME, meetingId)
  e.dataTransfer.setData('text/plain', meetingId)
  e.dataTransfer.effectAllowed = 'move'
}

export function getMeetingDragId(e: React.DragEvent): string | null {
  return (
    e.dataTransfer.getData(MEETING_MIME) ||
    e.dataTransfer.getData('meeting-id') ||
    null
  )
}

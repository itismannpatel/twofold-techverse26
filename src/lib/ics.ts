/**
 * Minimal iCalendar (.ics) writer.
 *
 * Confirmed sessions can be exported as a calendar event that opens in Google
 * Calendar, Apple Calendar or Outlook — real calendar sync, no OAuth, no API
 * keys, works entirely offline.
 */

interface IcsEventInput {
  uid: string
  title: string
  description?: string
  location?: string
  start: string
  durationMinutes?: number
  organizerName?: string
  attendeeName?: string
}

const pad = (n: number) => String(n).padStart(2, '0')

function toIcsDate(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  )
}

/** Escape text per RFC 5545 and fold long lines at 75 octets. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

function fold(line: string): string {
  if (line.length <= 73) return line
  const chunks: string[] = []
  let rest = line
  while (rest.length > 73) {
    chunks.push(rest.slice(0, 73))
    rest = rest.slice(73)
  }
  chunks.push(rest)
  return chunks.join('\r\n ')
}

export function buildIcs(input: IcsEventInput): string {
  const start = new Date(input.start)
  const end = new Date(start.getTime() + (input.durationMinutes ?? 60) * 60000)

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Twofold//Skill Exchange//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${input.uid}@twofold.local`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeText(input.title)}`,
  ]

  if (input.description) lines.push(`DESCRIPTION:${escapeText(input.description)}`)
  if (input.location) lines.push(`LOCATION:${escapeText(input.location)}`)
  if (input.organizerName) lines.push(`ORGANIZER;CN=${escapeText(input.organizerName)}:mailto:noreply@twofold.local`)
  if (input.attendeeName) lines.push(`ATTENDEE;CN=${escapeText(input.attendeeName)}:mailto:guest@twofold.local`)

  lines.push(
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Skill exchange starting soon',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  )

  return lines.map(fold).join('\r\n')
}

export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.ics') ? filename : `${filename}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

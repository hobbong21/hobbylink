/**
 * Minimal iCalendar (RFC 5545) writer — no external dependency.
 * Good enough for single-event exports and small feeds (< a few hundred entries).
 * For recurring rules or complex timezones, swap this for the `ical-generator` lib.
 */

export interface ICalEvent {
  uid: string
  title: string
  description?: string
  location?: string
  start: Date
  /** Duration in minutes, defaults to 120. */
  durationMinutes?: number
  url?: string
}

/** Formats a date as `YYYYMMDDTHHMMSSZ` (UTC). */
function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  )
}

/** Escapes special iCal characters inside TEXT values. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
}

/** Folds a long line per RFC 5545 (75-octet max, continuation starts with space). */
function fold(line: string): string {
  if (line.length <= 75) return line
  const chunks: string[] = []
  let rest = line
  let first = true
  while (rest.length > 0) {
    const size = first ? 75 : 74
    chunks.push((first ? "" : " ") + rest.slice(0, size))
    rest = rest.slice(size)
    first = false
  }
  return chunks.join("\r\n")
}

export function renderICalendar(
  feedName: string,
  events: ICalEvent[],
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HobbyLink//HobbyLink Events 1.0//KO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(feedName)}`,
  ]

  for (const e of events) {
    const end = new Date(e.start.getTime() + (e.durationMinutes ?? 120) * 60_000)
    lines.push("BEGIN:VEVENT")
    lines.push(`UID:${e.uid}`)
    lines.push(`DTSTAMP:${formatDate(new Date())}`)
    lines.push(`DTSTART:${formatDate(e.start)}`)
    lines.push(`DTEND:${formatDate(end)}`)
    lines.push(`SUMMARY:${escapeText(e.title)}`)
    if (e.description) lines.push(`DESCRIPTION:${escapeText(e.description)}`)
    if (e.location) lines.push(`LOCATION:${escapeText(e.location)}`)
    if (e.url) lines.push(`URL:${e.url}`)
    lines.push("END:VEVENT")
  }

  lines.push("END:VCALENDAR")
  return lines.map(fold).join("\r\n") + "\r\n"
}

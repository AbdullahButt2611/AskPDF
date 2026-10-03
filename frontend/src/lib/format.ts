const byteUnits = ['B', 'KB', 'MB', 'GB']

export function formatBytes(bytes: number) {
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < byteUnits.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${byteUnits[unitIndex]}`
}

const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const timeDivisions: [Intl.RelativeTimeFormatUnit, number][] = [
  ['second', 60],
  ['minute', 60],
  ['hour', 24],
  ['day', 7],
  ['week', 4.35],
  ['month', 12],
  ['year', Number.POSITIVE_INFINITY],
]

export function formatRelativeTime(date: Date, now = new Date()) {
  let duration = (date.getTime() - now.getTime()) / 1000
  for (const [unit, amount] of timeDivisions) {
    if (Math.abs(duration) < amount) {
      return relativeTime.format(Math.round(duration), unit)
    }
    duration /= amount
  }
  return relativeTime.format(Math.round(duration), 'year')
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

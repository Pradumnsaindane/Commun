type LogLevel = 'info' | 'warn' | 'error'

export function logServer(level: LogLevel, event: string, fields: Record<string, string | number | boolean | null> = {}) {
  const payload = JSON.stringify({ source: 'commun', level, event, ...fields, timestamp: new Date().toISOString() })
  if (level === 'error') console.error(payload)
  else if (level === 'warn') console.warn(payload)
  else console.info(payload)
}

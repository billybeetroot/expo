import pako from 'pako'

export function decodeCheck(actionPayload: string): unknown {
  const bytes = Uint8Array.from(atob(actionPayload), (c) => c.charCodeAt(0))
  const json = pako.inflate(bytes, { to: 'string' })
  return JSON.parse(JSON.parse(json))
}

export function decodePlain(actionPayload: string): unknown {
  return JSON.parse(actionPayload)
}

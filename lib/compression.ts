import pako from 'pako'

export function decompressPayload(actionPayload: string): unknown {
  const bytes = Uint8Array.from(atob(actionPayload), (c) => c.charCodeAt(0))
  const json = pako.inflate(bytes, { to: 'string' })
  return JSON.parse(JSON.parse(json))
}

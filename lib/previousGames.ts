export type PreviousGame = {
  displayName: string
  gameName: string
  paytableName: string
}

const MAX_SLOTS = 5

export function parsePreviousGames(raw: string): PreviousGame[] {
  if (!raw || !raw.trim()) return []
  const parts = raw.split(',')
  const games: PreviousGame[] = []
  for (let i = 0; i + 2 < parts.length; i += 3) {
    const displayName = (parts[i] ?? '').trim()
    const gameName = (parts[i + 1] ?? '').trim()
    const paytableName = (parts[i + 2] ?? '').trim()
    if (displayName && gameName && paytableName) {
      games.push({ displayName, gameName, paytableName })
    }
  }
  return games.slice(0, MAX_SLOTS)
}

export function serializePreviousGames(games: PreviousGame[]): string {
  return games.map((g) => `${g.displayName},${g.gameName},${g.paytableName}`).join(',')
}

// Prepend a new game at the front, remove duplicates, truncate to MAX_SLOTS.
export function prependPreviousGame(raw: string, game: PreviousGame): string {
  const existing = parsePreviousGames(raw)
  const deduped = existing.filter(
    (g) => !(g.gameName === game.gameName && g.paytableName === game.paytableName)
  )
  const updated = [game, ...deduped].slice(0, MAX_SLOTS)
  return serializePreviousGames(updated)
}

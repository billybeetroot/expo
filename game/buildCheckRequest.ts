export interface CheckRequest extends Record<string, unknown> {
  name: 'check'
  hand: string        // JSON.stringify of 5-element array
  pt: string
  coinsPlayed: string
  coinValue: string
}

export function buildCheckRequest(
  noSpacesHand: string,
  pt: string,
  coinsPlayed: string,
  coinValue: string,
  isDeuces: boolean
): CheckRequest {
  if (noSpacesHand.length !== 10) {
    throw new Error(`Hand must be exactly 10 chars (5 cards), got: ${noSpacesHand.length}`)
  }
  if (noSpacesHand.includes('XX')) {
    throw new Error('Hand contains empty slots (XX)')
  }

  let temp = noSpacesHand
  if (isDeuces) {
    temp = temp.replace(/W/g, '2')
  }

  const httpHand: string[] = []
  for (let i = 0; i < temp.length; i += 2) {
    httpHand.push(temp.slice(i, i + 2))
  }

  return {
    name: 'check',
    hand: JSON.stringify(httpHand),
    pt,
    coinsPlayed,
    coinValue,
  }
}

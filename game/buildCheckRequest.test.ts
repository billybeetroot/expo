import { buildCheckRequest } from './buildCheckRequest'

describe('buildCheckRequest', () => {
  it('sets name to check', () => {
    const req = buildCheckRequest('AcKdThJh2s', 'Bonus_6_5', '5', '1', false)
    expect(req.name).toBe('check')
  })

  it('converts noSpacesHand to a JSON-stringified 5-element array', () => {
    const req = buildCheckRequest('AcKdThJh2s', 'Bonus_6_5', '5', '1', false)
    const hand = JSON.parse(req.hand)
    expect(hand).toEqual(['Ac', 'Kd', 'Th', 'Jh', '2s'])
  })

  it('passes pt, coinsPlayed, coinValue through', () => {
    const req = buildCheckRequest('AcKdThJh2s', 'Jacks_9_6', '3', '0.25', false)
    expect(req.pt).toBe('Jacks_9_6')
    expect(req.coinsPlayed).toBe('3')
    expect(req.coinValue).toBe('0.25')
  })

  it('converts W→2 before sending in deuces mode', () => {
    const req = buildCheckRequest('AcWdThJh2s', 'Deuces_25_15_9_5_3_2', '5', '1', true)
    const hand = JSON.parse(req.hand)
    expect(hand).toContain('2d')
    expect(hand.every((c: string) => !c.includes('W'))).toBe(true)
  })

  it('leaves non-deuces hand unchanged when isDeuces is false', () => {
    const req = buildCheckRequest('AcKdThJh2s', 'Bonus_6_5', '5', '1', false)
    const hand = JSON.parse(req.hand)
    expect(hand).toEqual(['Ac', 'Kd', 'Th', 'Jh', '2s'])
  })

  it('throws when hand is fewer than 10 chars (incomplete)', () => {
    expect(() =>
      buildCheckRequest('AcKd', 'Bonus_6_5', '5', '1', false)
    ).toThrow()
  })

  it('throws when hand still contains XX (empty slot)', () => {
    expect(() =>
      buildCheckRequest('AcKdThXXXX', 'Bonus_6_5', '5', '1', false)
    ).toThrow()
  })
})

import { formatHoldMessage } from './formatHoldMessage'

describe('formatHoldMessage', () => {
  it('returns CORRECT HOLD - WIN! when payValue > 0', () => {
    expect(formatHoldMessage('CORRECT HOLD.', null, 1, [], [], false))
      .toBe('CORRECT HOLD - WIN!')
  })

  it('returns CORRECT HOLD. when payValue = 0', () => {
    expect(formatHoldMessage('CORRECT HOLD.', null, 0, [], [], false))
      .toBe('CORRECT HOLD.')
  })

  it('returns BAD HOLD for should hold message with no win and no gamblerAlert', () => {
    expect(formatHoldMessage('You should hold: Ac 2d', null, 0, [], [], false))
      .toBe('BAD HOLD')
  })

  it('returns SUCCESSFUL HOLD. for should hold message with win', () => {
    expect(formatHoldMessage('You should hold: Ac 2d', null, 1, [], [], false))
      .toBe('SUCCESSFUL HOLD.')
  })

  it('returns CORRECT HOLD. for EQUAL_EV gamblerAlert regardless of held cards', () => {
    expect(formatHoldMessage('You should hold: Ac', 'EQUAL_EV', 0, [], [], false))
      .toBe('CORRECT HOLD.')
  })

  it('returns CORRECT HOLD - WIN! for EQUAL_EV with win', () => {
    expect(formatHoldMessage('You should hold: Ac', 'EQUAL_EV', 1, [], [], false))
      .toBe('CORRECT HOLD - WIN!')
  })

  it('detects equal-EV two-pair and rewrites to COULD HOLD EITHER PAIR', () => {
    const hand = ['5h', '9h', 'Jh', '5s', '9s']
    const evs: any = [['2.17', 17], ['2.17', 6], ['1.50', 0]]
    const msg = formatHoldMessage('CORRECT HOLD.', null, 0, evs, hand, false)
    expect(msg).toContain('COULD HOLD EITHER PAIR')
    expect(msg).toContain('5s')
    expect(msg).toContain('9s')
  })

  it('does not rewrite when EVs are not equal', () => {
    const hand = ['5h', '9h', 'Jh', '5s', '9s']
    const evs: any = [['2.17', 17], ['1.90', 6]]
    const msg = formatHoldMessage('CORRECT HOLD.', null, 0, evs, hand, false)
    expect(msg).toBe('CORRECT HOLD.')
  })

  it('passes through other messages unchanged', () => {
    const msg = formatHoldMessage('GAME OVER! - ROYAL FLUSH!', null, 11, [], [], false)
    expect(msg).toBe('GAME OVER! - ROYAL FLUSH!')
  })
})

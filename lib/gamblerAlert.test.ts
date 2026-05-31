import { interpretGamblerAlert, selectHoldOutcome } from './gamblerAlert'

describe('interpretGamblerAlert', () => {
  it('returns none for null', () => {
    expect(interpretGamblerAlert(null).kind).toBe('none')
  })

  it('returns none for empty string', () => {
    expect(interpretGamblerAlert('').kind).toBe('none')
  })

  it('returns suppress_bad_hold for EQUAL_EV', () => {
    expect(interpretGamblerAlert('EQUAL_EV').kind).toBe('suppress_bad_hold')
  })

  it('returns show_alert for any other string', () => {
    const result = interpretGamblerAlert('Hold 3 to a royal flush')
    expect(result.kind).toBe('show_alert')
    if (result.kind === 'show_alert') {
      expect(result.message).toBe('Hold 3 to a royal flush')
    }
  })
})

describe('selectHoldOutcome', () => {
  it('returns CORRECT HOLD when EQUAL_EV regardless of payValue', () => {
    expect(selectHoldOutcome('EQUAL_EV', 0)).toBe('CORRECT HOLD.')
    expect(selectHoldOutcome('EQUAL_EV', 5)).toBe('CORRECT HOLD.')
  })

  it('returns SUCCESSFUL HOLD when payValue > 0 and no EQUAL_EV', () => {
    expect(selectHoldOutcome(undefined, 3)).toBe('SUCCESSFUL HOLD.')
    expect(selectHoldOutcome('', 1)).toBe('SUCCESSFUL HOLD.')
  })

  it('returns BAD HOLD when payValue is 0 and no EQUAL_EV', () => {
    expect(selectHoldOutcome(undefined, 0)).toBe('BAD HOLD')
    expect(selectHoldOutcome(null, 0)).toBe('BAD HOLD')
  })
})

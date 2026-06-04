import { parseCardPhrase } from './cardPhraseParser'

describe('parseCardPhrase — cards', () => {
  it('ace of clubs', () => {
    expect(parseCardPhrase('ace of clubs')).toEqual({ type: 'card', token: 'Ac' })
  })

  it('king of diamonds', () => {
    expect(parseCardPhrase('king of diamonds')).toEqual({ type: 'card', token: 'Kd' })
  })

  it('ten of hearts', () => {
    expect(parseCardPhrase('ten of hearts')).toEqual({ type: 'card', token: 'Th' })
  })

  it('two of spades', () => {
    expect(parseCardPhrase('two of spades')).toEqual({ type: 'card', token: '2s' })
  })

  it('jack hearts (no "of")', () => {
    expect(parseCardPhrase('jack hearts')).toEqual({ type: 'card', token: 'Jh' })
  })

  it('queen diamond (singular suit)', () => {
    expect(parseCardPhrase('queen diamond')).toEqual({ type: 'card', token: 'Qd' })
  })

  it('9 of spades', () => {
    expect(parseCardPhrase('9 of spades')).toEqual({ type: 'card', token: '9s' })
  })

  it('10 of clubs', () => {
    expect(parseCardPhrase('10 of clubs')).toEqual({ type: 'card', token: 'Tc' })
  })

  it('case insensitive', () => {
    expect(parseCardPhrase('ACE OF CLUBS')).toEqual({ type: 'card', token: 'Ac' })
  })

  it('three of clubs', () => {
    expect(parseCardPhrase('three of clubs')).toEqual({ type: 'card', token: '3c' })
  })

  it('five of hearts', () => {
    expect(parseCardPhrase('five of hearts')).toEqual({ type: 'card', token: '5h' })
  })

  it('8 of diamonds', () => {
    expect(parseCardPhrase('8 of diamonds')).toEqual({ type: 'card', token: '8d' })
  })
})

describe('parseCardPhrase — commands', () => {
  it('"deal" returns command', () => {
    expect(parseCardPhrase('deal')).toEqual({ type: 'command', name: 'deal' })
  })

  it('"feel" maps to deal', () => {
    expect(parseCardPhrase('feel')).toEqual({ type: 'command', name: 'deal' })
  })

  it('"reset" returns command', () => {
    expect(parseCardPhrase('reset')).toEqual({ type: 'command', name: 'reset' })
  })

  it('"backspace" returns command', () => {
    expect(parseCardPhrase('backspace')).toEqual({ type: 'command', name: 'backspace' })
  })

  it('"black space" maps to backspace', () => {
    expect(parseCardPhrase('black space')).toEqual({ type: 'command', name: 'backspace' })
  })

  it('deal wins over card phrase in same utterance', () => {
    const result = parseCardPhrase('ace of clubs deal')
    expect(result).toEqual({ type: 'command', name: 'deal' })
  })
})

describe('parseCardPhrase — none', () => {
  it('empty string', () => {
    expect(parseCardPhrase('')).toEqual({ type: 'none' })
  })

  it('gibberish', () => {
    expect(parseCardPhrase('hello world')).toEqual({ type: 'none' })
  })

  it('partial card phrase', () => {
    expect(parseCardPhrase('ace of')).toEqual({ type: 'none' })
  })
})

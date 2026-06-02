import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import CardKeyboard from './CardKeyboard'

describe('CardKeyboard', () => {
  it('renders all 4 suit buttons', () => {
    const { getByLabelText } = render(
      <CardKeyboard enteredValue="" onHandChange={jest.fn()} />
    )
    expect(getByLabelText('Club')).toBeTruthy()
    expect(getByLabelText('Diamond')).toBeTruthy()
    expect(getByLabelText('Heart')).toBeTruthy()
    expect(getByLabelText('Spade')).toBeTruthy()
  })

  it('renders all 13 rank buttons', () => {
    const { getByLabelText } = render(
      <CardKeyboard enteredValue="" onHandChange={jest.fn()} />
    )
    for (const rank of ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K']) {
      expect(getByLabelText(rank)).toBeTruthy()
    }
  })

  it('renders #, *, and BS buttons', () => {
    const { getByLabelText } = render(
      <CardKeyboard enteredValue="" onHandChange={jest.fn()} />
    )
    expect(getByLabelText('Random deuces hand')).toBeTruthy()
    expect(getByLabelText('Random hand')).toBeTruthy()
    expect(getByLabelText('Backspace')).toBeTruthy()
  })

  it('pressing A then club calls onHandChange with Ac', () => {
    const mock = jest.fn()
    const { getByLabelText } = render(
      <CardKeyboard enteredValue="" onHandChange={mock} />
    )
    fireEvent.press(getByLabelText('A'))
    fireEvent.press(getByLabelText('Club'))
    expect(mock).toHaveBeenLastCalledWith('Ac', expect.any(String))
  })

  it('pressing a rank key calls onHandChange', () => {
    const mock = jest.fn()
    const { getByLabelText } = render(
      <CardKeyboard enteredValue="" onHandChange={mock} />
    )
    fireEvent.press(getByLabelText('A'))
    expect(mock).toHaveBeenCalled()
  })

  it('pressing BS calls onHandChange with shorter hand', () => {
    const mock = jest.fn()
    const { getByLabelText } = render(
      <CardKeyboard enteredValue="AcK" onHandChange={mock} />
    )
    fireEvent.press(getByLabelText('Backspace'))
    const [noSpacesHand] = mock.mock.calls[0]
    expect(noSpacesHand.length).toBeLessThan(3)
  })

  it('is disabled when disabled prop is true', () => {
    const mock = jest.fn()
    const { getByLabelText } = render(
      <CardKeyboard enteredValue="" onHandChange={mock} disabled />
    )
    fireEvent.press(getByLabelText('A'))
    expect(mock).not.toHaveBeenCalled()
  })
})

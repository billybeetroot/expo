import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import HandDisplay from './HandDisplay'

describe('HandDisplay', () => {
  it('renders 5 card slots', () => {
    const { getAllByTestId } = render(
      <HandDisplay app="LP" noSpacesHand="AcKdThJh2s" />
    )
    expect(getAllByTestId(/^card-slot-/)).toHaveLength(5)
  })

  it('renders cardbacks for XX slots', () => {
    const { getAllByTestId } = render(
      <HandDisplay app="LP" noSpacesHand="XXXXXXXXXX" />
    )
    const slots = getAllByTestId(/^card-slot-/)
    expect(slots).toHaveLength(5)
  })

  it('renders a partial hand without errors', () => {
    expect(() =>
      render(<HandDisplay app="LP" noSpacesHand="AcKd" />)
    ).not.toThrow()
  })

  it('FG mode: pressing a card calls onCardPress with its index', () => {
    const mock = jest.fn()
    const { getAllByTestId } = render(
      <HandDisplay
        app="FG"
        noSpacesHand="AcKdThJh2s"
        onCardPress={mock}
      />
    )
    fireEvent.press(getAllByTestId(/^card-slot-/)[0])
    expect(mock).toHaveBeenCalledWith(0)
  })

  it('FG mode: pressing second card calls onCardPress with index 1', () => {
    const mock = jest.fn()
    const { getAllByTestId } = render(
      <HandDisplay
        app="FG"
        noSpacesHand="AcKdThJh2s"
        onCardPress={mock}
      />
    )
    fireEvent.press(getAllByTestId(/^card-slot-/)[1])
    expect(mock).toHaveBeenCalledWith(1)
  })

  it('LP Results mode: cards are not pressable', () => {
    const mock = jest.fn()
    const { getAllByTestId } = render(
      <HandDisplay
        app="LP Results"
        noSpacesHand="AcKdThJh2s"
        onCardPress={mock}
      />
    )
    fireEvent.press(getAllByTestId(/^card-slot-/)[0])
    expect(mock).not.toHaveBeenCalled()
  })

  it('shows hold chip text when cardHoldText provided', () => {
    const { getByText } = render(
      <HandDisplay
        app="FG"
        noSpacesHand="AcKdThJh2s"
        cardHoldText={['HELD', ' ', ' ', ' ', ' ']}
      />
    )
    expect(getByText('HELD')).toBeTruthy()
  })
})

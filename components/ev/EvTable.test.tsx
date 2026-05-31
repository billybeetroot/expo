import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import EvTable from './EvTable'

const sampleHand = ['Ac', 'Kd', 'Th', 'Jh', '2s']

const makeResultsList = (count: number) =>
  Array.from({ length: count }, (_, i) => [
    i === 0 ? ['Ac', 'Kd'] : [],
    i === 0 ? ['Th', 'Jh', '2s'] : sampleHand,
    String((1.5 - i * 0.05).toFixed(2)),
  ])

describe('EvTable', () => {
  it('renders a row for each entry in resultsList', () => {
    const { getAllByTestId } = render(
      <EvTable
        resultsList={makeResultsList(5)}
        hand={sampleHand}
        evRowHighlight={0}
        onRowPress={jest.fn()}
      />
    )
    expect(getAllByTestId(/^ev-row-/)).toHaveLength(5)
  })

  it('renders all 32 rows when resultsList has 32 entries', () => {
    const { getAllByTestId } = render(
      <EvTable
        resultsList={makeResultsList(32)}
        hand={sampleHand}
        evRowHighlight={0}
        onRowPress={jest.fn()}
      />
    )
    expect(getAllByTestId(/^ev-row-/)).toHaveLength(32)
  })

  it('tapping a row calls onRowPress with its index', () => {
    const mock = jest.fn()
    const { getAllByTestId } = render(
      <EvTable
        resultsList={makeResultsList(5)}
        hand={sampleHand}
        evRowHighlight={0}
        onRowPress={mock}
      />
    )
    fireEvent.press(getAllByTestId(/^ev-row-/)[2])
    expect(mock).toHaveBeenCalledWith(2)
  })

  it('shows AVG PAYOUT values', () => {
    const { getByText } = render(
      <EvTable
        resultsList={[
          [['Ac', 'Kd'], ['Th', 'Jh', '2s'], '1.50'],
        ]}
        hand={sampleHand}
        evRowHighlight={0}
        onRowPress={jest.fn()}
      />
    )
    expect(getByText('$1.50')).toBeTruthy()
  })

  it('renders empty table without error', () => {
    expect(() =>
      render(
        <EvTable
          resultsList={[]}
          hand={sampleHand}
          evRowHighlight={0}
          onRowPress={jest.fn()}
        />
      )
    ).not.toThrow()
  })

  it('shadow mode shows WHAT WOULD IT HAVE BEEN header', () => {
    const { getByText } = render(
      <EvTable
        resultsList={makeResultsList(3)}
        hand={sampleHand}
        evRowHighlight={0}
        onRowPress={jest.fn()}
        shadowMode
      />
    )
    expect(getByText('WHAT WOULD IT HAVE BEEN?')).toBeTruthy()
  })
})

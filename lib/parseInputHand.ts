import { gameIcons } from './gameIcons'

const suits = 'cdhs'
const ranks = 'AW23456789TJQK'

const ParseInputHand = (
  inputMode: string,
  value: string,
  enteredValue: string,
  setEnteredValue: (val: string) => void
): { noSpacesHand: string; dispHand: string } => {
  const { club, diamond, heart, spade } = gameIcons

  let futureEnteredValue = ''

  if (enteredValue.length >= 10 && value !== 'BS') {
    futureEnteredValue = enteredValue
  } else if (value === 'BS') {
    if (inputMode === 'keyboard') {
      futureEnteredValue = enteredValue.slice(0, -1)
      setEnteredValue(futureEnteredValue)
    } else {
      futureEnteredValue = enteredValue.slice(0, -2)
      setEnteredValue(futureEnteredValue)
    }
  } else {
    futureEnteredValue = enteredValue + value
  }

  let noSpacesHand = ''
  let temp = futureEnteredValue

  // Step 1: normalize — put rank before suit in each pair
  if (temp.length % 2 === 0) {
    for (let i = 0; i < temp.length; i += 2) {
      if (suits.includes(temp.charAt(i))) {
        noSpacesHand += temp[i + 1] + temp[i]
      } else {
        noSpacesHand += temp[i] + temp[i + 1]
      }
    }
  } else {
    noSpacesHand = temp
  }

  // Step 2: filter — only keep valid rank+suit pairs
  temp = noSpacesHand
  noSpacesHand = ''
  const cards: string[] = []
  if (temp.length % 2 === 0) {
    for (let i = 0; i < temp.length; i += 2) {
      if (ranks.includes(temp.charAt(i)) && suits.includes(temp.charAt(i + 1))) {
        cards.push(temp[i] + temp[i + 1])
      }
    }
    noSpacesHand = cards.join('')
  } else {
    noSpacesHand = temp
  }

  // Step 3: deduplicate
  temp = noSpacesHand
  noSpacesHand = ''
  const seen: string[] = []
  if (temp.length % 2 === 0) {
    for (let i = 0; i < temp.length; i += 2) {
      const card = temp[i] + temp[i + 1]
      if (!seen.includes(card!)) seen.push(card!)
    }
    noSpacesHand = seen.join('')
  } else {
    noSpacesHand = temp
  }

  // Step 4: cap at 10 chars
  if (noSpacesHand.length > 10) {
    noSpacesHand = noSpacesHand.slice(0, 10)
  }

  // Step 5: build display string with suit glyphs
  let dispHand = ''
  for (let i = 0; i < noSpacesHand.length; i++) {
    const ch = noSpacesHand.charAt(i)
    if (ch === 'c') dispHand += club
    else if (ch === 'd') dispHand += diamond
    else if (ch === 'h') dispHand += heart
    else if (ch === 's') dispHand += spade
    else dispHand += ch
  }

  // Step 6: pad dispHand to length 10
  const padding = 10 - dispHand.length
  dispHand += Array(padding + 1).join(' ')

  return { noSpacesHand, dispHand }
}

export default ParseInputHand

import React from 'react'
import { Image, StyleSheet } from 'react-native'
import cardImageMap from '@/lib/cardImageMap'

interface CardImageProps {
  code: string // e.g. 'Ac', 'XX' for cardback
  width: number
  height: number
}

export default function CardImage({ code, width, height }: CardImageProps) {
  const source = code === 'XX' || !cardImageMap[code]
    ? cardImageMap['cardback']
    : cardImageMap[code]

  return (
    <Image
      source={source}
      style={{ width, height }}
      resizeMode="contain"
    />
  )
}

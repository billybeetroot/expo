import { useState, useCallback, useEffect, useRef } from 'react'
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition'
import * as Speech from 'expo-speech'
import detectIntent from '../utils/interpretCommand'
import { intentToPositions } from '../utils/applyHoldIntent'
import { buildHoldPhrase } from '../utils/buildHoldPhrase'

export type VoiceControlCallbacks = {
  hand: string[]                          // current 5-card hand e.g. ['Ac','Kd',...]
  onHold: (positions: number[]) => void   // apply hold positions to simStore
  onDraw: () => void                      // trigger DRAW
}

export function useVoiceControl(callbacks: VoiceControlCallbacks) {
  const [isListening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep a ref so the speech event handler always sees the latest callbacks
  // even after the hand changes mid-session.
  const callbacksRef = useRef(callbacks)
  useEffect(() => { callbacksRef.current = callbacks }, [callbacks])

  useSpeechRecognitionEvent('start', () => {
    setListening(true)
    setError(null)
  })

  useSpeechRecognitionEvent('end', () => {
    setListening(false)
  })

  useSpeechRecognitionEvent('error', (ev) => {
    setError(ev.error ?? 'Speech recognition error')
    setListening(false)
  })

  useSpeechRecognitionEvent('result', (ev) => {
    if (!ev.isFinal) return
    const transcript = ev.results[0]?.transcript ?? ''
    const intent = detectIntent(transcript)
    if (!intent) return

    const { hand, onHold, onDraw } = callbacksRef.current

    if (intent.intent === 'draw') {
      onDraw()
      return
    }

    const positions = intentToPositions(intent, hand)
    onHold(positions)

    // TTS echo: speak back which cards are being held
    const phrase = buildHoldPhrase(hand, positions)
    if (phrase) {
      Speech.speak(phrase, { language: 'en-US' })
    }
  })

  const start = useCallback(async () => {
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
    if (!granted) {
      setError('Microphone permission denied')
      return
    }
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      continuous: true,
      interimResults: false,
    })
  }, [])

  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop()
    Speech.stop()
  }, [])

  const toggle = useCallback(() => {
    if (isListening) stop()
    else start()
  }, [isListening, start, stop])

  useEffect(() => {
    return () => {
      ExpoSpeechRecognitionModule.stop()
    }
  }, [])

  return { isListening, error, start, stop, toggle }
}

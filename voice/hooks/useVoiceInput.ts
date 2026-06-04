import { useState, useCallback, useEffect } from 'react'
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition'
import { parseCardPhrase } from '../utils/cardPhraseParser'

export type VoiceInputCallbacks = {
  onCard: (token: string) => void   // 2-char code e.g. 'Ac'
  onDeal: () => void
  onReset: () => void
  onBackspace: () => void
}

export function useVoiceInput(callbacks: VoiceInputCallbacks) {
  const [isListening, setListening] = useState(false)
  const [partial, setPartial] = useState('')
  const [error, setError] = useState<string | null>(null)

  useSpeechRecognitionEvent('start', () => {
    setListening(true)
    setError(null)
  })

  useSpeechRecognitionEvent('end', () => {
    setListening(false)
    setPartial('')
  })

  useSpeechRecognitionEvent('error', (ev) => {
    setError(ev.error ?? 'Speech recognition error')
    setListening(false)
  })

  useSpeechRecognitionEvent('result', (ev) => {
    const transcript = ev.results[0]?.transcript ?? ''
    if (!ev.isFinal) {
      setPartial(transcript)
      return
    }

    setPartial('')
    const parsed = parseCardPhrase(transcript)

    if (parsed.type === 'card') {
      callbacks.onCard(parsed.token)
    } else if (parsed.type === 'command') {
      if (parsed.name === 'deal') callbacks.onDeal()
      else if (parsed.name === 'reset') callbacks.onReset()
      else if (parsed.name === 'backspace') callbacks.onBackspace()
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
      interimResults: true,
    })
  }, [])

  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop()
  }, [])

  const toggle = useCallback(() => {
    if (isListening) stop()
    else start()
  }, [isListening, start, stop])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      ExpoSpeechRecognitionModule.stop()
    }
  }, [])

  return { isListening, partial, error, start, stop, toggle }
}

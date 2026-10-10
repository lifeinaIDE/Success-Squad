import { useState, useEffect, useRef, useCallback } from 'react'
import {
  isSpeechSynthesisSupported,
  getHindiFemaleVoice,
  cleanTextForSpeech,
  splitIntoChunks
} from '../utils/speechUtils.js'

const VOICE_PREF_KEY = 'squadai_voice_enabled'

export function useSquadSpeech() {
  const supported = isSpeechSynthesisSupported()
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem(VOICE_PREF_KEY)
      return saved !== null ? JSON.parse(saved) : true // Default to true
    } catch {
      return true
    }
  })

  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [activeMessageId, setActiveMessageId] = useState(null)
  const [activeVoice, setActiveVoice] = useState(null)

  const queueRef = useRef([])
  const chunkIndexRef = useRef(0)
  const isPlayingRef = useRef(false)
  const currentUtteranceRef = useRef(null)
  const watchdogIntervalRef = useRef(null)

  // Load and cache best Hindi female voice
  const refreshVoice = useCallback(() => {
    if (!supported) return
    const voice = getHindiFemaleVoice()
    setActiveVoice(voice)
  }, [supported])

  useEffect(() => {
    if (!supported) return

    refreshVoice()

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = refreshVoice
    }

    return () => {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [supported, refreshVoice])

  // Save voice preference
  const toggleVoiceEnabled = useCallback(() => {
    setIsVoiceEnabled(prev => {
      const nextVal = !prev
      try {
        localStorage.setItem(VOICE_PREF_KEY, JSON.stringify(nextVal))
      } catch (err) {
        console.warn('Failed to save voice preference', err)
      }
      // If disabling voice while speaking, cancel ongoing speech
      if (!nextVal && isPlayingRef.current) {
        stopSpeech()
      }
      return nextVal
    })
  }, [])

  // Chrome keep-alive watchdog: periodically calls resume() to prevent 15s freeze
  const startWatchdog = useCallback(() => {
    if (watchdogIntervalRef.current) clearInterval(watchdogIntervalRef.current)
    watchdogIntervalRef.current = setInterval(() => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause()
          window.speechSynthesis.resume()
        }
      }
    }, 10000)
  }, [])

  const stopWatchdog = useCallback(() => {
    if (watchdogIntervalRef.current) {
      clearInterval(watchdogIntervalRef.current)
      watchdogIntervalRef.current = null
    }
  }, [])

  // Hard stop speech
  const stopSpeech = useCallback(() => {
    if (!supported) return

    stopWatchdog()
    queueRef.current = []
    chunkIndexRef.current = 0
    isPlayingRef.current = false
    currentUtteranceRef.current = null

    try {
      window.speechSynthesis.cancel()
    } catch (e) {
      console.warn('Speech cancellation error:', e)
    }

    setIsSpeaking(false)
    setIsPaused(false)
    setActiveMessageId(null)
  }, [supported, stopWatchdog])

  // Play next chunk in queue
  const playNextChunk = useCallback(() => {
    if (!supported || !isPlayingRef.current) return

    if (chunkIndexRef.current >= queueRef.current.length) {
      // Completed all chunks
      stopSpeech()
      return
    }

    const chunkText = queueRef.current[chunkIndexRef.current]
    chunkIndexRef.current += 1

    try {
      const utterance = new SpeechSynthesisUtterance(chunkText)
      currentUtteranceRef.current = utterance

      const voice = activeVoice || getHindiFemaleVoice()
      if (voice) {
        utterance.voice = voice
        utterance.lang = voice.lang || 'hi-IN'
      } else {
        utterance.lang = 'hi-IN'
      }

      // Natural Hindi female voice tone tuning
      utterance.rate = 0.96
      utterance.pitch = 1.05

      utterance.onend = () => {
        if (isPlayingRef.current) {
          playNextChunk()
        }
      }

      utterance.onerror = (event) => {
        // Canceled or interrupted is expected when user stops or switches
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          console.warn('SpeechSynthesis error:', event.error)
        }
        if (isPlayingRef.current) {
          playNextChunk()
        }
      }

      window.speechSynthesis.speak(utterance)
    } catch (err) {
      console.error('Failed to speak chunk:', err)
      stopSpeech()
    }
  }, [supported, activeVoice, stopSpeech])

  // Start speaking text
  const speakText = useCallback((text, messageId = null) => {
    if (!supported || !text) return

    // Immediately stop any existing speech
    stopSpeech()

    const cleaned = cleanTextForSpeech(text)
    if (!cleaned) return

    const chunks = splitIntoChunks(cleaned)
    if (chunks.length === 0) return

    queueRef.current = chunks
    chunkIndexRef.current = 0
    isPlayingRef.current = true

    setIsSpeaking(true)
    setIsPaused(false)
    setActiveMessageId(messageId)

    startWatchdog()
    playNextChunk()
  }, [supported, stopSpeech, startWatchdog, playNextChunk])

  // Pause
  const pauseSpeech = useCallback(() => {
    if (!supported || !isPlayingRef.current) return
    try {
      window.speechSynthesis.pause()
      setIsPaused(true)
    } catch (err) {
      console.warn('Speech pause error:', err)
    }
  }, [supported])

  // Resume
  const resumeSpeech = useCallback(() => {
    if (!supported || !isPlayingRef.current) return
    try {
      window.speechSynthesis.resume()
      setIsPaused(false)
    } catch (err) {
      console.warn('Speech resume error:', err)
    }
  }, [supported])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSpeech()
    }
  }, [stopSpeech])

  return {
    isSupported: supported,
    isVoiceEnabled,
    toggleVoiceEnabled,
    isSpeaking,
    isPaused,
    activeMessageId,
    activeVoiceName: activeVoice ? activeVoice.name : 'Hindi Natural Voice',
    speak: speakText,
    pause: pauseSpeech,
    resume: resumeSpeech,
    stop: stopSpeech
  }
}

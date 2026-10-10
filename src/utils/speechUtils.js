/**
 * Speech Synthesis Utilities for SquadAI
 * Handles Hindi female voice selection, text preprocessing, and chunked speech synthesis.
 */

/**
 * Check if the browser supports SpeechSynthesis
 */
export function isSpeechSynthesisSupported() {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  )
}

/**
 * Clean markdown, links, code, and symbols from AI response for natural spoken Hindi/English
 */
export function cleanTextForSpeech(text) {
  if (!text) return ''

  let clean = text

  // Remove markdown code blocks ```code```
  clean = clean.replace(/```[\s\S]*?```/g, ' ')

  // Remove inline code `code`
  clean = clean.replace(/`([^`]+)`/g, '$1')

  // Remove URLs
  clean = clean.replace(/https?:\/\/\S+/gi, '')

  // Convert markdown links [text](url) -> text
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

  // Remove bold / italic markdown (**text**, *text*, __text__, _text_)
  clean = clean.replace(/\*\*([^*]+)\*\*/g, '$1')
  clean = clean.replace(/\*([^*]+)\*/g, '$1')
  clean = clean.replace(/__([^_]+)__/g, '$1')
  clean = clean.replace(/_([^_]+)_/g, '$1')

  // Remove headers (# Header)
  clean = clean.replace(/^#+\s+/gm, '')

  // Remove bullet points and numbered list markers
  clean = clean.replace(/^[\*\-•]\s+/gm, '')
  clean = clean.replace(/^\d+\.\s+/gm, '')

  // Remove emojis and special icons without stripping Devanagari script (U+0900 to U+097F)
  clean = clean.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
  clean = clean.replace(/[⚠️✨💡🚀🌐📝👥🎉🔥]/g, '')

  // Replace multiple newlines or spaces with single space
  clean = clean.replace(/\s+/g, ' ').trim()

  return clean
}

/**
 * Split text into sentence chunks (max ~180 characters) to avoid Chromium SpeechSynthesis timeouts
 */
export function splitIntoChunks(text, maxChunkLen = 180) {
  if (!text) return []

  // Split on sentence boundary characters (English full stop, question mark, exclamation, or Hindi Purna Viram '।')
  const sentenceRegex = /[^.?!।\n]+[.?!।\n]+|[^.?!।\n]+$/g
  const sentences = text.match(sentenceRegex) || [text]

  const chunks = []
  let currentChunk = ''

  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (!trimmed) continue

    if (currentChunk.length + trimmed.length + 1 <= maxChunkLen) {
      currentChunk = currentChunk ? `${currentChunk} ${trimmed}` : trimmed
    } else {
      if (currentChunk) chunks.push(currentChunk)

      // If a single sentence is longer than maxChunkLen, split on commas or spaces
      if (trimmed.length > maxChunkLen) {
        const words = trimmed.split(' ')
        let subChunk = ''
        for (const word of words) {
          if (subChunk.length + word.length + 1 <= maxChunkLen) {
            subChunk = subChunk ? `${subChunk} ${word}` : word
          } else {
            if (subChunk) chunks.push(subChunk)
            subChunk = word
          }
        }
        if (subChunk) chunks.push(subChunk)
        currentChunk = ''
      } else {
        currentChunk = trimmed
      }
    }
  }

  if (currentChunk) chunks.push(currentChunk)
  return chunks
}

/**
 * Find the best natural-sounding Hindi female voice available in the user's browser
 */
export function getHindiFemaleVoice() {
  if (!isSpeechSynthesisSupported()) return null

  const voices = window.speechSynthesis.getVoices() || []
  if (voices.length === 0) return null

  // 1. Identify Hindi (hi / hi-IN) voices
  const hindiVoices = voices.filter(v => {
    const lang = (v.lang || '').toLowerCase().replace('_', '-')
    return lang.startsWith('hi') || lang.includes('hi-in')
  })

  // Known Hindi female voice keywords (Windows, Android, ChromeOS, macOS, iOS)
  const femaleKeywords = [
    'swara',     // Microsoft Swara Online (Natural) - Hindi (India) (Edge / Windows 11)
    'kalpana',   // Microsoft Kalpana (Hindi)
    'heera',     // Microsoft Heera (Hindi)
    'kavya',     // Natural Hindi
    'shruti',
    'priya',
    'anjali',
    'geeta',
    'sunita',
    'female',
    'woman',
    'mahila',
    'google हिन्दी', // Google Hindi on Chrome / Android
    'google hindi'
  ]

  // Priority 1: Hindi voice explicitly matching female names
  const femaleHindi = hindiVoices.find(v => {
    const name = (v.name || '').toLowerCase()
    return femaleKeywords.some(kw => name.includes(kw))
  })
  if (femaleHindi) return femaleHindi

  // Priority 2: Any available Hindi voice (Chrome's default 'Google हिन्दी' is female)
  if (hindiVoices.length > 0) return hindiVoices[0]

  // Priority 3: Fallback to Indian English female voice if Hindi is not installed
  const indianVoices = voices.filter(v => {
    const lang = (v.lang || '').toLowerCase().replace('_', '-')
    return lang.includes('en-in')
  })

  const femaleIndianEn = indianVoices.find(v => {
    const name = (v.name || '').toLowerCase()
    return ['neerja', 'female', 'priya', 'heera', 'google'].some(kw => name.includes(kw))
  })
  if (femaleIndianEn) return femaleIndianEn
  if (indianVoices.length > 0) return indianVoices[0]

  // Default to null (browser will use system default and apply lang="hi-IN")
  return null
}

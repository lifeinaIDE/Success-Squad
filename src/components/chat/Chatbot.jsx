import React, { useState, useEffect, useRef } from 'react'
import {
  MessageSquare,
  Sparkles,
  User,
  Send,
  X,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  Zap,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square
} from 'lucide-react'
import { sendGeminiChatMessage } from '../../services/geminiChatService.js'
import SquadAiLogo from './SquadAiLogo.jsx'
import { useSquadSpeech } from '../../hooks/useSquadSpeech.js'
import './Chatbot.css'

const STORAGE_KEY = 'squadai_chat_history'

const SUGGESTED_PROMPTS = [
  { icon: '🚀', text: 'Tell me all about E-Fest 2026!' },
  { icon: '📝', text: 'How do I register my team for events?' },
  { icon: '👥', text: 'Who leads the Success Squad team?' },
  { icon: '🌐', text: 'What is Connexaa and what startups are incubated?' },
  { icon: '💡', text: 'What is Vibe-Coding and the AI Bootcamp?' },
]

/**
 * Format markdown text (bold, inline code, links, bullet points) cleanly without external deps
 */
function FormattedMessage({ text }) {
  if (!text) return null

  // Split text into lines
  const lines = text.split('\n')
  const elements = []
  let currentList = []

  const parseInline = (lineStr, keyPrefix) => {
    // Replace markdown patterns: **bold**, `code`, [text](url)
    const parts = []
    const regex = /(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g
    let lastIndex = 0
    let match

    while ((match = regex.exec(lineStr)) !== null) {
      if (match.index > lastIndex) {
        parts.push(lineStr.substring(lastIndex, match.index))
      }

      const matchText = match[0]
      if (matchText.startsWith('**') && matchText.endsWith('**')) {
        parts.push(
          <strong key={`${keyPrefix}-b-${match.index}`}>
            {matchText.slice(2, -2)}
          </strong>
        )
      } else if (matchText.startsWith('`') && matchText.endsWith('`')) {
        parts.push(
          <code key={`${keyPrefix}-c-${match.index}`}>
            {matchText.slice(1, -1)}
          </code>
        )
      } else if (matchText.startsWith('[') && matchText.includes('](')) {
        const linkText = matchText.substring(1, matchText.indexOf(']('))
        const linkUrl = matchText.substring(matchText.indexOf('](') + 2, matchText.length - 1)
        parts.push(
          <a
            key={`${keyPrefix}-a-${match.index}`}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {linkText}
          </a>
        )
      }
      lastIndex = regex.lastIndex
    }

    if (lastIndex < lineStr.length) {
      parts.push(lineStr.substring(lastIndex))
    }

    return parts.length > 0 ? parts : lineStr
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')
    const isNumbered = /^\d+\.\s/.test(trimmed)

    if (isBullet || isNumbered) {
      const cleanContent = trimmed.replace(/^(\*|-|•|\d+\.)\s+/, '')
      currentList.push(
        <li key={`li-${idx}`}>
          {parseInline(cleanContent, `inline-${idx}`)}
        </li>
      )
    } else {
      if (currentList.length > 0) {
        elements.push(<ul key={`ul-${idx}`}>{currentList}</ul>)
        currentList = []
      }

      if (trimmed === '') {
        // empty line spacer
        elements.push(<div key={`br-${idx}`} style={{ height: 6 }} />)
      } else {
        elements.push(
          <p key={`p-${idx}`}>
            {parseInline(trimmed, `inline-${idx}`)}
          </p>
        )
      }
    }
  })

  if (currentList.length > 0) {
    elements.push(<ul key="ul-end">{currentList}</ul>)
  }

  return <div className="squad-markdown-content">{elements}</div>
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [showTeaser, setShowTeaser] = useState(true)
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  const speech = useSquadSpeech()

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Save to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch (err) {
      console.warn('Failed to persist chat to localStorage', err)
    }
  }, [messages])

  // Stop speaking when chat window is closed
  useEffect(() => {
    if (!isOpen) {
      speech.stop()
    }
  }, [isOpen, speech.stop])

  // Scroll to bottom on message update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading, isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setShowTeaser(false)
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [isOpen])

  // Handle escape key to close and stop speech
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        speech.stop()
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, speech.stop])

  const handleSend = async (textToSend = null) => {
    const text = (textToSend || input).trim()
    if (!text || isLoading) return

    // Stop ongoing speech before generating new response
    speech.stop()

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      // Build history for the API call (mapping role 'bot' -> 'model')
      const apiHistory = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text
      }))

      const aiResponse = await sendGeminiChatMessage(apiHistory, text)

      const botMessageId = (Date.now() + 1).toString()
      const botMessage = {
        id: botMessageId,
        role: 'bot',
        text: aiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }

      setMessages(prev => [...prev, botMessage])

      // Read AI response aloud in Hindi female voice if voice toggle is enabled
      if (speech.isVoiceEnabled && speech.isSupported) {
        speech.speak(aiResponse, botMessageId)
      }
    } catch (error) {
      console.error('Chatbot error:', error)
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: `⚠️ **Oops!** I couldn't reach the AI service right now (${error.message || 'Network error'}). Please try again in a moment.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClearHistory = () => {
    if (window.confirm('Clear your conversation with SquadAI?')) {
      speech.stop()
      setMessages([])
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCloseChat = () => {
    speech.stop()
    setIsOpen(false)
  }

  return (
    <>
      {/* ── Floating Launcher ── */}
      <div className="squad-chat-launcher">
        {showTeaser && !isOpen && (
          <div className="squad-chat-teaser" onClick={() => setIsOpen(true)}>
            <Sparkles size={14} color="#818cf8" />
            <span>Ask SquadAI ✨</span>
            <button
              className="squad-chat-teaser-close"
              title="Dismiss"
              onClick={(e) => {
                e.stopPropagation()
                setShowTeaser(false)
              }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        <button
          className="squad-chat-btn"
          onClick={() => {
            if (isOpen) {
              handleCloseChat()
            } else {
              setIsOpen(true)
            }
          }}
          aria-label={isOpen ? 'Close chat' : 'Open SquadAI assistant'}
          title="Chat with SquadAI"
        >
          {isOpen ? (
            <X size={24} />
          ) : (
            <SquadAiLogo size={36} isGlowing={true} />
          )}
          <div className="squad-chat-badge-pulse" />
        </button>
      </div>

      {/* ── Chat Window ── */}
      {isOpen && (
        <div className="squad-chat-window" role="dialog" aria-label="SquadAI Chat Window">
          {/* Header */}
          <div className="squad-chat-header">
            <div className="squad-chat-header-info">
              <div className="squad-chat-avatar">
                <SquadAiLogo
                  size={26}
                  isSpeaking={speech.isSpeaking && !speech.isPaused}
                  isGlowing={true}
                />
              </div>
              <div className="squad-chat-title-group">
                <h4>
                  SquadAI
                  <span className="squad-gemini-pill">Gemini 3.5</span>
                </h4>
                <div className="squad-chat-status">
                  <span className="squad-status-dot" />
                  <span>Success Squad Assistant</span>
                </div>
              </div>
            </div>

            <div className="squad-chat-header-actions">
              {/* Hindi Voice Settings Toggle */}
              <button
                className={`squad-btn-icon squad-voice-toggle ${speech.isVoiceEnabled ? 'is-active' : 'is-muted'} ${!speech.isSupported ? 'is-unsupported' : ''}`}
                onClick={speech.toggleVoiceEnabled}
                disabled={!speech.isSupported}
                title={
                  !speech.isSupported
                    ? 'Voice synthesis not supported in this browser'
                    : speech.isVoiceEnabled
                    ? 'Hindi Voice Responses: ON (Click to mute)'
                    : 'Hindi Voice Responses: OFF (Click to enable)'
                }
                aria-label={speech.isVoiceEnabled ? 'Mute Hindi Voice' : 'Enable Hindi Voice'}
              >
                {speech.isVoiceEnabled && speech.isSupported ? (
                  <Volume2 size={16} />
                ) : (
                  <VolumeX size={16} />
                )}
                <span className="squad-voice-hi-tag">हिन्दी</span>
              </button>

              {messages.length > 0 && (
                <button
                  className="squad-btn-icon"
                  onClick={handleClearHistory}
                  title="Clear conversation"
                  aria-label="Clear chat history"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                className="squad-btn-icon"
                onClick={handleCloseChat}
                title="Minimize chat"
                aria-label="Minimize chat"
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          {/* ── Voice Controls Banner (Active when speech is playing or paused) ── */}
          {(speech.isSpeaking || speech.isPaused) && (
            <div className="squad-voice-control-bar" role="region" aria-label="Speech playback controls">
              <div className="squad-voice-info">
                <div className={`squad-soundwave-bars ${speech.isPaused ? 'paused' : 'playing'}`}>
                  <span className="bar bar-1" />
                  <span className="bar bar-2" />
                  <span className="bar bar-3" />
                  <span className="bar bar-4" />
                </div>
                <div className="squad-voice-text-details">
                  <span className="squad-voice-status-title">
                    {speech.isPaused ? 'Voice Paused' : 'Speaking (Hindi Female Voice)'}
                  </span>
                  <span className="squad-voice-subtext">
                    {speech.activeVoiceName || 'Hindi Natural Voice'}
                  </span>
                </div>
              </div>

              <div className="squad-voice-ctrl-actions">
                {speech.isSpeaking && !speech.isPaused ? (
                  <button
                    className="squad-voice-ctrl-btn pause"
                    onClick={speech.pause}
                    title="Pause speech"
                    aria-label="Pause speech"
                  >
                    <Pause size={13} />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    className="squad-voice-ctrl-btn resume"
                    onClick={speech.resume}
                    title="Resume speech"
                    aria-label="Resume speech"
                  >
                    <Play size={13} />
                    <span>Resume</span>
                  </button>
                )}

                <button
                  className="squad-voice-ctrl-btn stop"
                  onClick={speech.stop}
                  title="Stop speech"
                  aria-label="Stop speech"
                >
                  <Square size={12} />
                  <span>Stop</span>
                </button>
              </div>
            </div>
          )}

          {/* Body */}
          <div className="squad-chat-body">
            {messages.length === 0 ? (
              <div className="squad-welcome-card">
                <div className="squad-welcome-icon">
                  <SquadAiLogo size={28} isGlowing={true} />
                </div>
                <h5>Welcome to SquadAI!</h5>
                <p>
                  I'm your AI guide for Success Squad. Ask me about upcoming events, E-Fest 2026, team registrations, or incubated startups!
                </p>

                <div className="squad-quick-prompts-label">Quick Suggestions</div>
                <div className="squad-quick-prompts">
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      className="squad-prompt-chip"
                      onClick={() => handleSend(prompt.text)}
                    >
                      <span>{prompt.icon}</span>
                      <span>{prompt.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`squad-message-row ${msg.role}`}>
                  <div className={`squad-message-avatar ${msg.role}`}>
                    {msg.role === 'user' ? (
                      <User size={15} />
                    ) : (
                      <SquadAiLogo
                        size={18}
                        isSpeaking={speech.activeMessageId === msg.id && speech.isSpeaking && !speech.isPaused}
                        isGlowing={speech.activeMessageId === msg.id}
                      />
                    )}
                  </div>
                  <div className="squad-message-bubble-wrapper">
                    <div className="squad-message-bubble">
                      <FormattedMessage text={msg.text} />
                    </div>
                    <div className="squad-message-meta">
                      <span>{msg.timestamp}</span>
                      {msg.role === 'bot' && !msg.isError && (
                        <>
                          {speech.isSupported && (
                            <button
                              className={`squad-voice-bubble-btn ${
                                speech.activeMessageId === msg.id && speech.isSpeaking ? 'active' : ''
                              }`}
                              onClick={() => {
                                if (speech.activeMessageId === msg.id && speech.isSpeaking) {
                                  if (speech.isPaused) {
                                    speech.resume()
                                  } else {
                                    speech.pause()
                                  }
                                } else {
                                  speech.speak(msg.text, msg.id)
                                }
                              }}
                              title={
                                speech.activeMessageId === msg.id && speech.isSpeaking
                                  ? speech.isPaused
                                    ? 'Resume Hindi speech'
                                    : 'Pause Hindi speech'
                                  : 'Listen in Hindi'
                              }
                              aria-label="Listen in Hindi"
                            >
                              {speech.activeMessageId === msg.id && speech.isSpeaking ? (
                                speech.isPaused ? <Play size={11} /> : <Pause size={11} />
                              ) : (
                                <Play size={11} />
                              )}
                              <span>
                                {speech.activeMessageId === msg.id && speech.isSpeaking
                                  ? speech.isPaused
                                    ? 'Resume'
                                    : 'Pause'
                                  : 'Listen'}
                              </span>
                            </button>
                          )}

                          {speech.activeMessageId === msg.id && speech.isSpeaking && (
                            <button
                              className="squad-voice-bubble-btn stop"
                              onClick={speech.stop}
                              title="Stop speech"
                              aria-label="Stop speech"
                            >
                              <Square size={10} />
                              <span>Stop</span>
                            </button>
                          )}

                          <button
                            className="squad-copy-btn"
                            onClick={() => handleCopy(msg.id, msg.text)}
                            title="Copy response"
                            aria-label="Copy response"
                          >
                            {copiedId === msg.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="squad-message-row bot">
                <div className="squad-message-avatar bot">
                  <SquadAiLogo size={18} isGlowing={true} />
                </div>
                <div className="squad-typing-indicator" aria-label="SquadAI is thinking">
                  <div className="squad-typing-dot" />
                  <div className="squad-typing-dot" />
                  <div className="squad-typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="squad-chat-footer">
            <form
              className="squad-chat-form"
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
            >
              <textarea
                ref={inputRef}
                rows={1}
                className="squad-chat-input"
                placeholder="Ask about events, startups, registration..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                type="submit"
                className="squad-send-btn"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                title="Send"
              >
                <Send size={16} />
              </button>
            </form>

            <div className="squad-chat-footer-brand">
              <span>
                <Zap size={11} color="#f59e0b" />
                Powered by Google Gemini
              </span>
              <span>Press Enter to send</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

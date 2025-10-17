import { useCallback, useEffect, useRef, useState } from 'react'
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk'
import { createAzureSpeechConfig, checkAzureSpeechSDK } from '../utils'
import { GENERAL_MODE } from '../constants'
import { useClassroomStore } from '../stores'

// ---------- Types ----------
export type Viseme = [number, number] // [timeMs, visemeId]

export interface SpeechMessage {
  id: string
  text: string
  audioPlayer: HTMLAudioElement | null
  visemes: Viseme[] | null
  visemeStartTime?: number
}

interface UseTeacherSpeechOptions {
  subscriptionKey?: string
  serviceRegion?: string
  voice?: string
  language?: string
  pitch?: number
  rate?: number
  /** Max characters per chunk. Tune if you still see truncation. */
  maxChunkLength?: number
  /** ms pause to insert between chunks to make speech sound natural */
  interChunkPauseMs?: number
}

// ---------- Helper utilities ----------
const DEFAULT_CHUNK_SIZE = 3000 // conservative default; adjust if needed
const DEFAULT_INTER_CHUNK_PAUSE = 200

function splitIntoChunks(text: string, maxLen: number): string[] {
  if (!text || text.length <= maxLen) return [text]

  // Try split by sentence-ending punctuation first to preserve natural flow
  const sentences = text.match(/[^.!?\n]+[.!?\n]?/g) || [text]
  const chunks: string[] = []
  let current = ''

  for (const s of sentences) {
    if ((current + s).length <= maxLen) {
      current += s
    } else {
      if (current) chunks.push(current)
      if (s.length <= maxLen) {
        current = s
      } else {
        // sentence longer than maxLen => split by words
        const words = s.split(/(\s+)/)
        current = ''
        for (const w of words) {
          if ((current + w).length <= maxLen) {
            current += w
          } else {
            if (current) chunks.push(current)
            current = w
          }
        }
      }
    }
  }

  if (current) chunks.push(current)
  return chunks.map(c => c.trim()).filter(Boolean)
}

// Note on audioOffset units: Azure Speech SDK viseme/audioOffset often comes in 100-nanosecond units (ticks).
// Dividing by 10000 converts ticks -> milliseconds. Keep this behavior but add comment for maintenance.
const audioOffsetToMs = (audioOffset: number) => audioOffset / 10000

// ---------- Hook implementation ----------
export const useTeacherSpeech = ({
  subscriptionKey = '',
  serviceRegion = '',
  voice = 'vi-VN-HoaiMyNeural',
  language = 'vi-VN',
  pitch = 0,
  rate = 1,
  maxChunkLength = DEFAULT_CHUNK_SIZE,
  interChunkPauseMs = DEFAULT_INTER_CHUNK_PAUSE
}: UseTeacherSpeechOptions = {}) => {
  const [state, setState] = useState<string>(GENERAL_MODE.IDLE)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  const setCurrentMessage = useClassroomStore(s => s.setCurrentMessage)

  // refs for SDK, playback and queue
  const synthesizerRef = useRef<SpeechSDK.SpeechSynthesizer | null>(null)
  const isSynthesizerClosedRef = useRef(false)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioUnlockedRef = useRef(false)

  const synthesisInProgressRef = useRef(false)
  const isPlayingRef = useRef(false)

  // queue holds pending texts (chunked) to speak sequentially
  const queueRef = useRef<Array<{ text: string; id: string; resolve: (val: any) => void; reject: (e: any) => void }>>([])
  const visemeAccumRef = useRef<Viseme[]>([])
  const visemeTimeOffsetRef = useRef(0) // ms accumulated before current chunk

  // ---------- AudioContext unlock ----------
  useEffect(() => {
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!Ctx) return
      audioContextRef.current = new Ctx()

      const unlock = async () => {
        try {
          await audioContextRef.current?.resume()
        } catch (e) {
          // ignore
        }
        audioUnlockedRef.current = true
      }

      document.addEventListener('click', unlock, { once: true, passive: true })
      return () => document.removeEventListener('click', unlock as EventListener)
    } catch (e) {
      // ignore
    }
  }, [])

  // ---------- Synthesizer lifecycle ----------
  const createSynthesizer = useCallback(() => {
    try {
      const { isAvailable, sdk } = checkAzureSpeechSDK()
      if (!isAvailable || !sdk) throw new Error('Azure Speech SDK is not available')

      const speechConfig = createAzureSpeechConfig(subscriptionKey || undefined, serviceRegion || undefined)
      if (!speechConfig) throw new Error('Failed to create speech configuration')

      speechConfig.speechSynthesisLanguage = language
      speechConfig.speechSynthesisVoiceName = voice

      // Some SDK versions don't expose these props; set safely
      try { (speechConfig as any).speechSynthesisPitchHz = pitch } catch (e) { /* ignore */ }
      try { (speechConfig as any).speechSynthesisRate = rate } catch (e) { /* ignore */ }

      const audioConfig = (SpeechSDK as any).AudioConfig.fromStreamOutput((SpeechSDK as any).AudioOutputStream.createPullStream())
      const synthesizer = new (SpeechSDK as any).SpeechSynthesizer(speechConfig, audioConfig)

      isSynthesizerClosedRef.current = false
      return synthesizer as SpeechSDK.SpeechSynthesizer
    } catch (err) {
      console.error('createSynthesizer error', err)
      return null
    }
  }, [subscriptionKey, serviceRegion, voice, language, pitch, rate])

  const cleanupSynthesizer = useCallback(() => {
    try {
      if (synthesizerRef.current && !isSynthesizerClosedRef.current) {
        synthesizerRef.current.close()
      }
    } catch (e) {
      console.warn('Error closing synthesizer', e)
    } finally {
      isSynthesizerClosedRef.current = true
      synthesizerRef.current = null
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
        const { isAvailable, error: sdkError } = checkAzureSpeechSDK()
        if (!isAvailable) {
          if (mounted) {
            setError(sdkError || 'Azure Speech SDK not available')
            setIsReady(false)
          }
          return
        }

        // small delay to allow environment readiness
        await new Promise(r => setTimeout(r, 300))

        const synth = createSynthesizer()
        if (!synth) throw new Error('Failed to create synthesizer')

        if (mounted) {
          synthesizerRef.current = synth
          setIsReady(true)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : String(err))
          setIsReady(false)
        }
      }
    }

    init()
    return () => {
      mounted = false
      // full cleanup
      stopAll()
      cleanupSynthesizer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createSynthesizer])

  // ---------- Core: speak chunk & queue handling ----------
  // speak a single chunk (SSML) and return after audio finishes playing
  const speakChunk = useCallback(async (chunk: string) => {
    if (!synthesizerRef.current) {
      const newSynth = createSynthesizer()
      if (!newSynth) throw new Error('Could not create synthesizer for chunk')
      synthesizerRef.current = newSynth
    }

    const synth = synthesizerRef.current!

    const visemesThisChunk: Viseme[] = []

    // Attach viseme handler for this chunk. Note: some SDKs fire visemes with audioOffset units that require conversion
    const handler = (_s: any, e: any) => {
      try {
        visemesThisChunk.push([audioOffsetToMs(e.audioOffset), e.visemeId])
      } catch (err) { /* ignore */ }
    }

    // Use SSML with a small trailing pause to help separation
    const ssml = `\n<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="${language}">\n  <voice name="${voice}">\n    ${chunk}\n    <break time="${interChunkPauseMs}ms"/>\n  </voice>\n</speak>\n`

    // attach event
    try {
      synth.visemeReceived = handler
    } catch (e) {
      // ignore if not supported
    }

    try {
      return new Promise<{ success: boolean }>((resolve, reject) => {
        try {
          synth.speakSsmlAsync(
            ssml,
            (result: any) => {
              try {
                const audioData = result.audioData
                const blob = new Blob([audioData], { type: 'audio/wav' })

                if (audioUrlRef.current) {
                  try { URL.revokeObjectURL(audioUrlRef.current) } catch (e) { /* ignore */ }
                }

                const audioUrl = URL.createObjectURL(blob)
                audioUrlRef.current = audioUrl

                const audioPlayer = new Audio()

                audioPlayer.oncanplaythrough = async () => {
                  try { await audioContextRef.current?.resume() } catch (e) { /* ignore */ }

                  // update playback/UI state
                  setState(GENERAL_MODE.SPEAKING)
                  isPlayingRef.current = true

                  // accumulate viseme times: convert local chunk viseme times to absolute timeline
                  const chunkStartOffset = visemeTimeOffsetRef.current
                  const adjustedVisemes = visemesThisChunk.map(v => [v[0] + chunkStartOffset, v[1]] as Viseme)
                  visemeAccumRef.current.push(...adjustedVisemes)

                  // set message for UI to render
                  const newMessage: SpeechMessage = {
                    id: Date.now().toString(),
                    text: chunk,
                    audioPlayer,
                    visemes: visemeAccumRef.current.slice(),
                    visemeStartTime: Date.now() - (audioPlayer.currentTime * 1000)
                  }

                  setCurrentMessage(newMessage)

                  audioPlayer.play().catch(err => {
                    console.error('audio play failed', err)
                    setState(GENERAL_MODE.ERROR)
                    setError('Failed to play audio')
                    isPlayingRef.current = false
                    synthesisInProgressRef.current = false
                    resolve({ success: false })
                  })
                }

                audioPlayer.onended = () => {
                  isPlayingRef.current = false
                  synthesisInProgressRef.current = false

                  // update accumulated viseme time offset: length of this audio
                  try {
                    // use audio duration if available else approximate by last viseme time
                    const durMs = (audioPlayer.duration && !isNaN(audioPlayer.duration)) ? audioPlayer.duration * 1000 : (visemesThisChunk.length ? (visemesThisChunk[visemesThisChunk.length - 1][0] + interChunkPauseMs) : 0)
                    visemeTimeOffsetRef.current += durMs
                  } catch (e) {
                    // ignore
                  }

                  // revoke URL and cleanup player
                  try { audioPlayer.src = '' } catch (e) { /* ignore */ }
                  try { if (audioUrlRef.current) { URL.revokeObjectURL(audioUrlRef.current); audioUrlRef.current = null } } catch (e) { /* ignore */ }

                  // let caller continue
                  resolve({ success: true })
                }

                audioPlayer.onerror = (e) => {
                  console.error('audio error', e)
                  isPlayingRef.current = false
                  synthesisInProgressRef.current = false
                  setState(GENERAL_MODE.ERROR)
                  setError('Audio playback error')
                  resolve({ success: false })
                }

                audioPlayer.src = audioUrl
                audioPlayer.load()

                // store current player to allow stop/cancel
                audioPlayerRef.current = audioPlayer
              } catch (e) {
                console.error('error in speakSsmlAsync success handler', e)
                resolve({ success: false })
              }
            },
            (err: any) => {
              console.error('speakSsmlAsync failed', err)
              if (err && err.toString().includes('disposed')) isSynthesizerClosedRef.current = true
              setState(GENERAL_MODE.ERROR)
              setError(`Speech synthesis failed: ${err}`)
              synthesisInProgressRef.current = false
              isPlayingRef.current = false
              resolve({ success: false })
            }
          )
        } catch (ex) {
          console.error('exception calling speakSsmlAsync', ex)
          if (ex instanceof Error && ex.message.includes('disposed')) isSynthesizerClosedRef.current = true
          setState(GENERAL_MODE.ERROR)
          setError(ex instanceof Error ? ex.message : 'Failed to generate speech')
          synthesisInProgressRef.current = false
          isPlayingRef.current = false
          resolve({ success: false })
        }
      })
    } catch (outerErr) {
      console.error('speakChunk outer error', outerErr)
      synthesisInProgressRef.current = false
      isPlayingRef.current = false
      setState(GENERAL_MODE.ERROR)
      setError(outerErr instanceof Error ? outerErr.message : String(outerErr))
      throw outerErr
    }
  }, [createSynthesizer, interChunkPauseMs, language, setCurrentMessage, voice])

  // process queue sequentially
  const processQueue = useCallback(async () => {
    if (synthesisInProgressRef.current) return
    synthesisInProgressRef.current = true

    while (queueRef.current.length > 0) {
      const item = queueRef.current.shift()!
      setError(null)
      setState(GENERAL_MODE.THINKING)

      try {
        // reset viseme accumulation for a new top-level speak call
        visemeAccumRef.current = []
        visemeTimeOffsetRef.current = 0

        // chunk the text
        const chunks = splitIntoChunks(item.text, maxChunkLength)

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i]
          setState(GENERAL_MODE.THINKING)

          // ensure synthesizer ready
          if (!synthesizerRef.current || isSynthesizerClosedRef.current) {
            const newSynth = createSynthesizer()
            if (!newSynth) throw new Error('Failed to create synthesizer')
            synthesizerRef.current = newSynth
          }

          // speak this chunk and wait for it to finish
          setState(GENERAL_MODE.THINKING)
          const res = await speakChunk(chunk)

          // if speaking failed for a chunk, break and reject
          if (!res.success) break

          // small delay between chunks to ensure browser resources freed
          await new Promise(r => setTimeout(r, 60))
        }

        // finish: clear current message and update state
        setState(GENERAL_MODE.IDLE)
        setCurrentMessage(null)
        item.resolve({ success: true })
      } catch (err) {
        console.error('processQueue item failed', err)
        item.reject(err)
        setState(GENERAL_MODE.ERROR)
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        synthesisInProgressRef.current = false
      }
    }

    synthesisInProgressRef.current = false
  }, [createSynthesizer, maxChunkLength, setCurrentMessage, speakChunk])

  // public speak: push into queue and start processing
  const speak = useCallback((text: string) => {
    return new Promise((resolve, reject) => {
      const id = Date.now().toString()
      queueRef.current.push({ text, id, resolve, reject })
      // start processing if not already
      processQueue().catch(err => {
        console.error('processQueue error', err)
      })
    })
  }, [processQueue])

  // stop everything: clear queue, stop current playback, close synthesizer
  const stopAll = useCallback(() => {
    queueRef.current = []

    synthesisInProgressRef.current = false
    isPlayingRef.current = false

    if (audioPlayerRef.current) {
      try {
        audioPlayerRef.current.onended = null
        audioPlayerRef.current.oncanplaythrough = null
        audioPlayerRef.current.onerror = null
        audioPlayerRef.current.pause()
        audioPlayerRef.current.src = ''
        audioPlayerRef.current.load()
      } catch (e) {
        // ignore
      }
      audioPlayerRef.current = null
    }

    if (audioUrlRef.current) {
      try { URL.revokeObjectURL(audioUrlRef.current) } catch (e) { /* ignore */ }
      audioUrlRef.current = null
    }

    cleanupSynthesizer()

    setCurrentMessage(null)
    setState(GENERAL_MODE.IDLE)
  }, [cleanupSynthesizer, setCurrentMessage])

  // expose stop / cleanup
  const cleanup = useCallback(() => {
    stopAll()
    cleanupSynthesizer()
  }, [cleanupSynthesizer, stopAll])

  return {
    speak,
    stop: stopAll,
    cleanup,
    state,
    error,
    isReady,
    isSpeaking: state === GENERAL_MODE.SPEAKING || isPlayingRef.current,
    queueLength: () => queueRef.current.length
  }
}

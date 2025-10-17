import { useState, useEffect, useCallback, useRef } from 'react'

interface UseVoiceRecognitionProps {
  language?: string
  continuous?: boolean
  silenceTimeout?: number
  onResult?: (text: string) => void
  onError?: (error: string) => void
}

export function useVoiceRecognition({
  language = 'vi-VN',
  continuous = false,
  silenceTimeout = 5000,
  onResult,
  onError
}: UseVoiceRecognitionProps = {}) {
  const [isListening, setIsListening] = useState<boolean>(false)
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)
  const [currentText, setCurrentText] = useState<string>('')
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const permissionCheckedRef = useRef<boolean>(false)
  const shouldBeListeningRef = useRef<boolean>(false)
  const lastSpeechTimestampRef = useRef<number>(0)
  const silenceTimerRef = useRef<number | null>(null)
  const noSpeechErrorCountRef = useRef<number>(0)
  const MAX_NO_SPEECH_ERRORS = 3
  const isRecognitionActiveRef = useRef<boolean>(false)

  const startSilenceDetection = useCallback(() => {
    if (silenceTimerRef.current !== null) {
      window.clearInterval(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    
    silenceTimerRef.current = window.setInterval(() => {
      const now = Date.now()
      const elapsed = now - lastSpeechTimestampRef.current
      
      if (elapsed > silenceTimeout && shouldBeListeningRef.current) {
        // console.log(`Silence detected for ${elapsed}ms, stopping voice recognition`)
        
        shouldBeListeningRef.current = false
        
        if (recognitionRef.current && isRecognitionActiveRef.current) {
          try {
            recognitionRef.current.stop()
            isRecognitionActiveRef.current = false
          } catch (error) {
            console.error('Error stopping recognition after silence:', error)
          }
        }
        
        setIsListening(false)
        
        if (silenceTimerRef.current !== null) {
          window.clearInterval(silenceTimerRef.current)
          silenceTimerRef.current = null
        }
      }
    }, 1000)
  }, [silenceTimeout])
  
  const stopSilenceDetection = useCallback(() => {
    if (silenceTimerRef.current !== null) {
      window.clearInterval(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (permissionCheckedRef.current) return
    
    const checkPermission = async () => {
      permissionCheckedRef.current = true

      if (navigator.permissions) {
        try {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
          
          if (result.state === 'granted') {
            setPermissionGranted(true)
            return
          } else if (result.state === 'denied') {
            setPermissionGranted(false)
            onError?.('Microphone access denied')
            return
          }
        } catch (error) {
          console.error('Error checking microphone permission:', error)
          onError?.('Microphone access denied')
        }
      }
      
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) return
      
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
        setPermissionGranted(true)
      } catch (error) {
        setPermissionGranted(false)
        console.error('Microphone permission denied:', error)
        onError?.('Microphone access denied')
      }
    }
    
    checkPermission()
  }, [onError])
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (permissionGranted === false) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      onError?.('Your browser does not support voice recognition')
      return
    }

    const recognitionInstance = new SpeechRecognition()
    
    recognitionInstance.lang = language
    recognitionInstance.continuous = continuous
    recognitionInstance.interimResults = true
    recognitionInstance.maxAlternatives = 1

    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      lastSpeechTimestampRef.current = Date.now()
      noSpeechErrorCountRef.current = 0
      
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join('')

      setCurrentText(transcript)
      onResult?.(transcript)
    }

    recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      
      switch (event.error) {
        case 'not-allowed':
          setPermissionGranted(false)
          onError?.('Microphone access denied')
          break
        case 'no-speech':
          noSpeechErrorCountRef.current += 1
          if (noSpeechErrorCountRef.current >= MAX_NO_SPEECH_ERRORS) {
            // console.log('Too many no-speech errors, stopping recognition')
            shouldBeListeningRef.current = false
            onError?.('No speech detected after several attempts')
          }
          break
        default:
          onError?.(event.error)
          break
      }
      setIsListening(false)
      isRecognitionActiveRef.current = false
      stopSilenceDetection()
    }
    
    recognitionInstance.onend = () => {
      // console.log('Recognition ended, should be listening:', shouldBeListeningRef.current)
      
      isRecognitionActiveRef.current = false
      
      if (shouldBeListeningRef.current) {
        try {
          setTimeout(() => {
            if (recognitionRef.current && shouldBeListeningRef.current) {
              recognitionRef.current.start()
              isRecognitionActiveRef.current = true
            } else {
              setIsListening(false)
              stopSilenceDetection()
            }
          }, 150)
        } catch (error) {
          console.error('Error restarting recognition:', error)
          setIsListening(false)
          stopSilenceDetection()
        }
      } else {
        setIsListening(false)
        stopSilenceDetection()
      }
    }

    recognitionRef.current = recognitionInstance
    isRecognitionActiveRef.current = false

    return () => {
      stopSilenceDetection()
      
      if (recognitionRef.current) {
        try {
          if (isListening) {
            recognitionRef.current.stop()
          }
        } catch (error) {
          console.error('Error cleaning up recognition:', error)
        }
      }
    }
  }, [language, continuous, onResult, onError, permissionGranted, isListening, stopSilenceDetection])

  const recreateRecognitionInstance = useCallback(() => {
    if (typeof window === 'undefined') return
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return
    
    if (recognitionRef.current && isRecognitionActiveRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.error('Error stopping current recognition instance:', error)
      }
    }
    
    const newInstance = new SpeechRecognition()
    
    newInstance.lang = language
    newInstance.continuous = continuous
    newInstance.interimResults = true
    newInstance.maxAlternatives = 1
    
    newInstance.onresult = (event: SpeechRecognitionEvent) => {
      lastSpeechTimestampRef.current = Date.now()
      noSpeechErrorCountRef.current = 0
      
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join('')

      setCurrentText(transcript)
      onResult?.(transcript)
    }
    
    newInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      
      switch (event.error) {
        case 'not-allowed':
          setPermissionGranted(false)
          onError?.('Microphone access denied')
          break
        case 'no-speech':
          noSpeechErrorCountRef.current += 1
          if (noSpeechErrorCountRef.current >= MAX_NO_SPEECH_ERRORS) {
            // console.log('Too many no-speech errors, stopping recognition')
            shouldBeListeningRef.current = false
            onError?.('No speech detected after several attempts')
          }
          break
        default:
          onError?.(event.error)
          break
      }
      setIsListening(false)
      isRecognitionActiveRef.current = false
      stopSilenceDetection()
    }
    
    newInstance.onend = () => {
      // console.log('Recognition ended, should be listening:', shouldBeListeningRef.current)
      
      isRecognitionActiveRef.current = false
      
      if (shouldBeListeningRef.current) {
        try {
          setTimeout(() => {
            if (recognitionRef.current && shouldBeListeningRef.current) {
              recognitionRef.current.start()
              isRecognitionActiveRef.current = true
            } else {
              setIsListening(false)
              stopSilenceDetection()
            }
          }, 150)
        } catch (error) {
          console.error('Error restarting recognition:', error)
          setIsListening(false)
          stopSilenceDetection()
        }
      } else {
        setIsListening(false)
        stopSilenceDetection()
      }
    }
    
    recognitionRef.current = newInstance
    isRecognitionActiveRef.current = false
  }, [language, continuous, onResult, onError, stopSilenceDetection])

  const startListening = useCallback(() => {
    if (permissionGranted === false) {
      onError?.('Microphone access denied. Please allow microphone access in your browser settings.')
      return
    }
    
    if (!recognitionRef.current) {
      onError?.('Speech recognition not initialized')
      return
    }
    
    if (isRecognitionActiveRef.current) {
      try {
        recognitionRef.current.stop()
        setTimeout(() => {
          startRecognition()
        }, 200)
        return
      } catch (stopError) {
        console.error('Error stopping existing recognition:', stopError)
      }
    } else {
      startRecognition()
    }
    
    function startRecognition() {
      try {
        lastSpeechTimestampRef.current = Date.now()
        shouldBeListeningRef.current = true
        recognitionRef.current?.start()
        isRecognitionActiveRef.current = true
        setIsListening(true)
        
        startSilenceDetection()
        noSpeechErrorCountRef.current = 0
      } catch (error) {
        console.error('Error starting recognition:', error)
        setIsListening(false)
        isRecognitionActiveRef.current = false
        
        if (error instanceof DOMException && error.name === 'InvalidStateError') {
          recreateRecognitionInstance()
          setTimeout(() => {
            if (recognitionRef.current) {
              try {
                lastSpeechTimestampRef.current = Date.now()
                recognitionRef.current.start()
                isRecognitionActiveRef.current = true
                setIsListening(true)
                startSilenceDetection()
              } catch (newError) {
                console.error('Failed to start new recognition instance:', newError)
                onError?.('Không thể khởi động lại nhận dạng giọng nói')
                isRecognitionActiveRef.current = false
              }
            }
          }, 300)
        } else {
          onError?.('Cannot activate voice recognition')
        }
      }
    }
  }, [onError, permissionGranted, recreateRecognitionInstance, startSilenceDetection])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return
    
    shouldBeListeningRef.current = false
    
    stopSilenceDetection()
    
    try {
      recognitionRef.current.stop()
      isRecognitionActiveRef.current = false
      setIsListening(false)
    } catch (error) {
      console.error('Error stopping recognition:', error)
      isRecognitionActiveRef.current = false
      setIsListening(false)
    }
  }, [stopSilenceDetection])

  return {
    isListening,
    startListening,
    stopListening,
    permissionGranted,
    currentText
  }
}
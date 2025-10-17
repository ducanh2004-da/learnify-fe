import { GeneralMode } from './general.type'
import { SpeechMessage } from '../hooks'

interface ClassroomState {
  initialLoad: boolean
  teacherMode: GeneralMode
  currentMessage: SpeechMessage | null
  isSpeaking: boolean
  isThinking: boolean
  cameraMode: GeneralMode
  selectedConversationId: string | null
  isLessonStarted: boolean
  isExplanationVisible: boolean
  
  setInitialLoad: (initialLoad: boolean) => void
  setTeacherMode: (mode: GeneralMode) => void
  setCurrentMessage: (message: SpeechMessage | null) => void
  setIsSpeaking: (isSpeaking: boolean) => void
  setIsThinking: (isThinking: boolean) => void
  setCameraMode: (mode: GeneralMode) => void
  setSelectedConversationId: (id: string | null) => void
  setIsLessonStarted: (isStarted: boolean) => void
  setIsExplanationVisible: (isVisible: boolean) => void

  startThinking: () => void
  stopAll: () => void
}

export type { ClassroomState }
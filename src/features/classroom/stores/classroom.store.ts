import { create } from 'zustand'
import { GENERAL_MODE } from '../constants'
import { ClassroomState } from '../types'

export const useClassroomStore = create<ClassroomState>((set) => ({
  initialLoad: false,
  teacherMode: GENERAL_MODE.IDLE,
  currentMessage: null,
  isSpeaking: false,
  isThinking: false,
  cameraMode: GENERAL_MODE.IDLE,
  selectedConversationId: null,
  isLessonStarted: false,
  isExplanationVisible: false,

  setInitialLoad: (initialLoad) => set({ initialLoad }),
  setTeacherMode: (mode) => set({ teacherMode: mode }),
  setCurrentMessage: (message) => set({ currentMessage: message }),
  setIsSpeaking: (isSpeaking) => set({ isSpeaking }),
  setIsThinking: (isThinking) => set({ isThinking }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setSelectedConversationId: (id) => set({ selectedConversationId: id }),
  setIsLessonStarted: (isLessonStarted) => set({ isLessonStarted }),
  setIsExplanationVisible: (isExplanationVisible) => set({ isExplanationVisible }),

  startThinking: () => set({
    teacherMode: GENERAL_MODE.THINKING,
    isSpeaking: false,
    isThinking: true,
    cameraMode: GENERAL_MODE.THINKING
  }),
  
  stopAll: () => set({
    teacherMode: GENERAL_MODE.IDLE,
    currentMessage: null,
    isSpeaking: false,
    isThinking: false,
    cameraMode: GENERAL_MODE.IDLE
  })
}))
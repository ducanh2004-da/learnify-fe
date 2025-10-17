import { useAnimations, useGLTF, Html } from '@react-three/drei'
import { ThreeElements, useFrame } from '@react-three/fiber'
import { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { MathUtils, randInt } from 'three/src/math/MathUtils.js'
import { useClassroomStore } from '../stores'
import { FADE_DURATION } from '../constants'
import { gsap, useGSAP } from '@/lib'

type TeacherProps = ThreeElements['group']

const Teacher = (props: TeacherProps) => {
  const { scene } = useGLTF('/models/teacher.glb')
  const { animations } = useGLTF('/models/teacher_animation.glb')
  
  const isSpeaking = useClassroomStore((state) => state.isSpeaking)
  const isThinking = useClassroomStore((state) => state.isThinking)
  const currentMessage = useClassroomStore((state) => state.currentMessage)
  
  const [blink, setBlink] = useState<boolean>(false)
  const [teacherAnimation, setTeacherAnimation] = useState<string>('Idle')
  
  const groupRef = useRef<THREE.Group>(null)
  const previousAnimationRef = useRef<string>('Idle')
  const animationTimeoutRef = useRef<number | null>(null)
  const shouldAutoChangeAnimRef = useRef<boolean>(false)
  const spinnerRef = useRef<HTMLDivElement>(null)
  
  const { actions, mixer } = useAnimations(animations, groupRef)

  useGSAP(() => {
    if (!spinnerRef.current) return
    
    if (isThinking) {
      gsap.fromTo(
        spinnerRef.current,
        { 
          opacity: 0, 
          scale: 0.5,
          display: 'none'
        },
        { 
          opacity: 1, 
          scale: 1, 
          display: 'flex',
          duration: 0.5, 
          ease: 'back.out(1.7)',
          transformOrigin: 'center center'
        }
      )
    } else {
      gsap.to(spinnerRef.current, {
        opacity: 0, 
        scale: 0.5,
        duration: 0.4, 
        ease: 'back.in(1.2)',
        transformOrigin: 'center center',
        onComplete: () => {
          if (spinnerRef.current) {
            spinnerRef.current.style.display = 'none'
          }
        }
      })
    }
  }, [isThinking])

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true)
      setTimeout(() => {
        setBlink(false)
      }, 200)
    }, 3000)
    
    return () => clearInterval(blinkInterval)
  }, [])

  const lerpMorphTarget = (targetName: string, value: number, speed: number = 0.01) => {
    scene.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.morphTargetDictionary) {
        const index = child.morphTargetDictionary[targetName]
        if (
          index !== undefined &&
          child.morphTargetInfluences &&
          child.morphTargetInfluences[index] !== undefined
        ) {
          child.morphTargetInfluences[index] = MathUtils.lerp(
            child.morphTargetInfluences[index],
            value,
            speed
          )
        }
      }
    })
  }
  
  const lerpMorphTargetByIndex = (targetIndex: number, value: number, speed: number = 0.01) => {
    scene.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.morphTargetInfluences) {
        if (
          targetIndex >= 0 && 
          targetIndex < child.morphTargetInfluences.length
        ) {
          child.morphTargetInfluences[targetIndex] = MathUtils.lerp(
            child.morphTargetInfluences[targetIndex],
            value,
            speed
          )
        }
      }
    })
  }
  
  const setAnimationSpeed = (animName: string, action: THREE.AnimationAction) => {
    if (animName.startsWith('Talking')) {
      action.timeScale = 0.6
    } else if (animName === 'Thinking') {
      action.timeScale = 0.7
    } else {
      action.timeScale = 1.0
    }
  }
  
  useEffect(() => {
    if (actions && actions.Idle) {
      // console.log('Setting up initial Idle animation')
      
      const idleAction = actions.Idle
      idleAction.reset()
      idleAction.play()
      idleAction.loop = THREE.LoopRepeat
      idleAction.repetitions = Infinity
      idleAction.clampWhenFinished = false
      
      idleAction.timeScale = 1.0
      
      previousAnimationRef.current = 'Idle'
      setTeacherAnimation('Idle')
    }
  }, [actions])
  
  // useEffect(() => {
  //   if (scene) {
  //     // console.log('Model loaded:', scene)
      
  //     scene.traverse((object) => {
  //       if (object instanceof THREE.SkinnedMesh && object.morphTargetDictionary) {
  //         // console.log('Found morph targets on:', object.name, Object.keys(object.morphTargetDictionary))
  //       }
  //     })
  //   }
  // }, [scene])

  useEffect(() => {
    const TALKING_ANIMATIONS = ['Talking_1', 'Talking_2', 'Talking_3']
    let nextAnimation: string
    
    if (isThinking) {
      nextAnimation = 'Thinking'
      shouldAutoChangeAnimRef.current = false
    } else if (currentMessage) {
      if (!teacherAnimation.startsWith('Talking_')) {
        const randomIndex = randInt(0, TALKING_ANIMATIONS.length - 1)
        nextAnimation = TALKING_ANIMATIONS[randomIndex]
        shouldAutoChangeAnimRef.current = false
      } else {
        nextAnimation = teacherAnimation
      }
    } else {
      nextAnimation = 'Idle'
      shouldAutoChangeAnimRef.current = false
    }
    
    if (nextAnimation !== teacherAnimation) {
      // console.log(`Changing animation from ${teacherAnimation} to ${nextAnimation}`)
      setTeacherAnimation(nextAnimation)
    }
  }, [currentMessage, isThinking, teacherAnimation])

  useFrame((_state, delta) => {
    const limitedDelta = Math.min(delta, 0.05)
    
    if (mixer) {
      mixer.update(limitedDelta)
    }
    
    lerpMorphTarget('eye_close', blink ? 1 : 0, 0.3)
    
    lerpMorphTarget('mouthSmile', isSpeaking ? 0.2 : 0, 0.1)
    
    if (currentMessage && currentMessage.visemes && currentMessage.audioPlayer) {
      for (let i = 0; i <= 21; i++) {
        if (i !== 0) {
          lerpMorphTargetByIndex(i, 0, 0.1)
        }
      }
      
      const audioTime = currentMessage.audioPlayer.currentTime * 1000
      
      let visemeFound = false
      
      for (let i = currentMessage.visemes.length - 1; i >= 0; i--) {
        const viseme = currentMessage.visemes[i]
        if (audioTime >= viseme[0]) {
          const visemeId = viseme[1]
          if (visemeId >= 0 && visemeId <= 21) {
            lerpMorphTargetByIndex(visemeId, 1, 0.2)
            visemeFound = true
            break
          }
        }
      }
      
      if (!visemeFound) {
        lerpMorphTarget('mouthSmile', 0.5, 0.1)
      }
    }

    scene.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.morphTargetDictionary) {
        const eyeMorphs = Object.entries(child.morphTargetDictionary)
          .filter(([name]) => name.toLowerCase().includes('eye') && name !== 'eye_close')
        
        for (const [name, index] of eyeMorphs) {
          if (name.toLowerCase().includes('up') || name.toLowerCase().includes('upward')) {
            if (child.morphTargetInfluences) {
              child.morphTargetInfluences[index] = 0
            }
          }
        }
      }
    })
  })

  useEffect(() => {
    if (!actions || !actions[teacherAnimation]) {
      console.warn(`Animation "${teacherAnimation}" not found in available actions:`, Object.keys(actions || {}))
      return
    }
    
    if (previousAnimationRef.current === teacherAnimation) {
      return
    }
    
    const prevAnim = actions[previousAnimationRef.current]
    const nextAnim = actions[teacherAnimation]
    
    previousAnimationRef.current = teacherAnimation
    
    if (prevAnim && prevAnim !== nextAnim) {
      prevAnim.fadeOut(FADE_DURATION.FADE_OUT)
    }
    
    // console.log(`Playing animation: ${teacherAnimation}`)
    nextAnim.reset().fadeIn(FADE_DURATION.FADE_IN).play()
    
    nextAnim.clampWhenFinished = false
    nextAnim.loop = THREE.LoopRepeat
    nextAnim.repetitions = Infinity
    
    setAnimationSpeed(teacherAnimation, nextAnim)
    
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
        animationTimeoutRef.current = null
      }
    }
  }, [teacherAnimation, actions])

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [])

  return (
    <group 
      ref={groupRef} 
      {...props}
    >
      <Html position={[0, 1.57, 0]}>
        <div 
          ref={spinnerRef}
          className="items-center justify-center"
          style={{ display: 'none', opacity: 0 }}
        >
          <div className="size-[2.75rem] bg-white/20 backdrop-blur-[16px] border border-white/20 rounded-full flex items-center justify-center drop-shadow-lg">
            <div className="size-[1.9rem] border-t-transparent border-b-transparent border-r-transparent border-l-white rounded-full animate-spin border-3 drop-shadow-lg" />
          </div>
        </div>
      </Html>
      <primitive object={scene} />
    </group>
  )
}

export default Teacher
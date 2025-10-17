import { CameraControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useRef, useCallback } from 'react'
import { useControls, button } from 'leva'
import { Vector3 } from 'three'
import { useClassroomStore } from '../stores'
import { CAMERA_POSITION, CAMERA_ZOOM, GENERAL_MODE } from '../constants'

const CameraManager = () => {
  const { camera } = useThree()
  const controlsRef = useRef<CameraControls>(null)
  
  const cameraMode = useClassroomStore((state) => state.cameraMode)
  
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    
    const currentIsSpeaking = useClassroomStore.getState().isSpeaking
    const currentIsThinking = useClassroomStore.getState().isThinking
    
    if (currentIsThinking || currentIsSpeaking) return
    
    if (controlsRef.current) {
      const zoomAmount = e.deltaY > 0 ? -camera.zoom / 4 : camera.zoom / 4
      controlsRef.current.zoom(zoomAmount, true)
    }
  }, [camera.zoom])

  useEffect(() => {
    if (!controlsRef.current) return
    
    const position = CAMERA_POSITION[GENERAL_MODE.IDLE]
    const zoom = CAMERA_ZOOM[GENERAL_MODE.IDLE]
    
    controlsRef.current.setPosition(
      position[0],
      position[1],
      position[2],
      true
    )
    
    controlsRef.current.zoomTo(zoom, true)
  }, [])

  useEffect(() => {
    if (!controlsRef.current) return
    
    // console.log(`Camera mode changed to: ${cameraMode}`)
    
    setTimeout(() => {
      if (controlsRef.current) {
        try {
          const position = CAMERA_POSITION[cameraMode] || CAMERA_POSITION[GENERAL_MODE.IDLE]
          const zoom = CAMERA_ZOOM[cameraMode] || CAMERA_ZOOM[GENERAL_MODE.IDLE]

          controlsRef.current.setPosition(
            position[0],
            position[1],
            position[2],
            true
          )
          
          controlsRef.current.zoomTo(zoom, true)
          
          // console.log(`Camera position and zoom set for mode: ${cameraMode}`)
        } catch (error) {
          console.error('Error setting camera position or zoom:', error)
        }
      }
    }, 100)
  }, [cameraMode])

  useEffect(() => {
    const canvas = document.querySelector('canvas')
    
    if (!canvas) return
    
    // console.log('Setting up wheel event listener')
    
    canvas.removeEventListener('wheel', handleWheel)
    
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    
    return () => {
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  useControls('Helper', {
    getCameraPosition: button(() => {
      if (controlsRef.current) {
        const position = new Vector3()
        controlsRef.current.getPosition(position)
        const zoom = controlsRef.current.camera.zoom
        
        console.log('Current camera:', position.toArray(), zoom)
      }
    }),
    
    testZoom: button(() => {
      if (controlsRef.current) {
        console.log('Testing zoom to 2.5...')
        controlsRef.current.zoomTo(2.5, true)
      } else {
        console.log('Controls not available')
      }
    })
  })
  
  return (
    <CameraControls
      ref={controlsRef}
      camera={camera}
      enabled={true}
      minZoom={1.75}
      maxZoom={3}
      polarRotateSpeed={-.3}
      azimuthRotateSpeed={-.3}
      mouseButtons={{
        left: 1,
        middle: 1,
        right: 1,
        wheel: 0
      }}
      touches={{
        one: 32,
        two: 512,
        three: 0
      }}
    />
  )
}

export default CameraManager
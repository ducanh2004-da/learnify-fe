import { useState, RefObject } from 'react'
import { gsap } from '@/lib'

export interface AnimationConfig {
  expandedWidth: string
  expandedHeight: string
  collapsedSize: string
  expandedBorderRadius: string
  collapsedBorderRadius: string
  onShowComplete?: () => void
  onHideComplete?: () => void
}

export interface AnimatedBoxRefs {
  containerRef: RefObject<HTMLDivElement | null>
  boxRef: RefObject<HTMLDivElement | null>
  expandIconRef: RefObject<HTMLDivElement | null>
  collapseButtonContainerRef: RefObject<HTMLDivElement | null>
  contentRef: RefObject<HTMLDivElement | null>
  titleRef?: RefObject<HTMLParagraphElement | null>
  subtitleRef?: RefObject<HTMLParagraphElement | null>
  controlsRef?: RefObject<HTMLDivElement | null>
}

export interface AnimatedBoxReturn {
  isVisible: boolean
  isAnimating: boolean
  showBox: () => void
  hideBox: () => void
  toggleBox: () => void
  setupVisibleState: () => void
  setupHiddenState: () => void
}

export const useAnimatedBox = (
  refs: AnimatedBoxRefs,
  config: AnimationConfig,
  initialVisible: boolean = true,
  onVisibilityChange?: (visible: boolean) => void
): AnimatedBoxReturn => {
  const [isVisible, setIsVisible] = useState(initialVisible)
  const [isAnimating, setIsAnimating] = useState<boolean>(false)

  const {
    boxRef,
    expandIconRef,
    collapseButtonContainerRef,
    contentRef,
    titleRef,
    subtitleRef,
    controlsRef
  } = refs

  const setupVisibleState = () => {
    if (!boxRef.current) return
    
    gsap.set(boxRef.current, {
      width: config.expandedWidth,
      height: config.expandedHeight,
      borderRadius: config.expandedBorderRadius,
      opacity: 1
    })

    if (contentRef.current) {
      gsap.set(contentRef.current, { opacity: 1, display: 'flex' })
    }

    if (controlsRef?.current) {
      gsap.set(controlsRef.current, { opacity: 1, display: 'flex' })
    }

    if (collapseButtonContainerRef.current) {
      gsap.set(collapseButtonContainerRef.current, { 
        opacity: 1,
        display: 'block'
      })
    }

    if (expandIconRef.current) {
      gsap.set(expandIconRef.current, { 
        opacity: 0,
        display: 'none' 
      })
    }
  }

  const setupHiddenState = () => {
    if (!boxRef.current) return
    
    gsap.set(boxRef.current, {
      width: config.collapsedSize,
      height: config.collapsedSize,
      borderRadius: config.collapsedBorderRadius,
      opacity: 1
    })
    
    if (contentRef.current) {
      gsap.set(contentRef.current, { opacity: 0, display: 'none' })
    }

    if (controlsRef?.current) {
      gsap.set(controlsRef.current, { opacity: 0, display: 'none' })
    }

    if (collapseButtonContainerRef.current) {
      gsap.set(collapseButtonContainerRef.current, { 
        opacity: 0,
        display: 'none'
      })
    }
    
    if (expandIconRef.current) {
      gsap.set(expandIconRef.current, { 
        opacity: 1,
        display: 'flex' 
      })
    }
  }

  const animateExpandIcon = (tl: gsap.core.Timeline, isShowing: boolean) => {
    if (!expandIconRef.current) return
    
    if (isShowing) {
      tl.to(expandIconRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 0.15,
        ease: 'power1.in',
        onComplete: () => {
          if (expandIconRef.current) {
            expandIconRef.current.style.display = 'none'
          }
        }
      })
    } else {
      tl.set(expandIconRef.current, {
        display: 'flex',
        opacity: 0,
        scale: 0.8
      }, '-=0.2')
      .to(expandIconRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.25,
        ease: 'back.out(1.7)'
      }, '-=0.1')
    }
  }

  const animateCollapseButton = (tl: gsap.core.Timeline, isShowing: boolean) => {
    if (!collapseButtonContainerRef.current) return
    
    if (isShowing) {
      tl.set(collapseButtonContainerRef.current, {
        display: 'block',
        opacity: 0
      }, '-=0.25')
      .to(collapseButtonContainerRef.current, {
        opacity: 1,
        duration: 0.2,
        ease: 'power1.out'
      }, '-=0.2')
    } else {
      tl.to(collapseButtonContainerRef.current, {
        opacity: 0,
        duration: 0.2,
        ease: 'power1.in',
        onComplete: () => {
          if (collapseButtonContainerRef.current) {
            collapseButtonContainerRef.current.style.display = 'none'
          }
        }
      }, '-=0.1')
    }
  }

  const animateContent = (tl: gsap.core.Timeline, isShowing: boolean) => {
    if (!contentRef.current) return
    
    if (isShowing) {
      tl.set(contentRef.current, { 
        display: 'flex',
        opacity: 0,
        y: 10
      }, '-=0.15')
      .to(contentRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.2,
        ease: 'power2.out'
      }, '-=0.1')
    } else {
      tl.to(contentRef.current, {
        opacity: 0,
        y: 10,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          if (contentRef.current) contentRef.current.style.display = 'none'
        }
      })
    }
  }

  const animateTitles = (tl: gsap.core.Timeline) => {
    if (!titleRef?.current || !subtitleRef?.current) return
    
    tl.fromTo([titleRef.current, subtitleRef.current], 
      { y: 10, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        duration: 0.2,
        stagger: 0.05,
        ease: 'power2.out' 
      },
      '-=0.1'
    )
  }

  const animateControls = (tl: gsap.core.Timeline, isShowing: boolean) => {
    if (!controlsRef?.current) return
    
    if (isShowing) {
      tl.set(controlsRef.current, { 
        display: 'flex',
        opacity: 0,
        y: 10
      }, '-=0.1')
      .to(controlsRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.25,
        ease: 'power2.out'
      }, '-=0.1')
    } else {
      tl.to(controlsRef.current, {
        opacity: 0,
        y: 10,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          if (controlsRef.current) controlsRef.current.style.display = 'none'
        }
      })
    }
  }

  const showBox = () => {
    if (isAnimating || isVisible) return
    
    setIsAnimating(true)
    
    const tl = gsap.timeline({
      onComplete: () => {
        setIsAnimating(false)
        config.onShowComplete?.()
      }
    })
    
    if (boxRef.current) {
      boxRef.current.style.pointerEvents = 'auto'
      
      animateExpandIcon(tl, true)
      
      tl.to(boxRef.current, {
        width: config.expandedWidth,
        height: config.expandedHeight,
        borderRadius: config.expandedBorderRadius,
        duration: 0.35,
        ease: 'back.out(1.2)',
      }, '-=0.1')
      
      animateCollapseButton(tl, true)
      
      animateContent(tl, true)
      
      if (titleRef?.current && subtitleRef?.current) {
        animateTitles(tl)
      }
      
      if (controlsRef?.current) {
        animateControls(tl, true)
      }
    }
    
    tl.call(() => {
      setIsVisible(true)
      onVisibilityChange?.(true)
    })
  }

  const hideBox = () => {
    if (isAnimating || !isVisible) return
    
    setIsAnimating(true)
    
    const tl = gsap.timeline({
      onComplete: () => {
        setIsAnimating(false)
        config.onHideComplete?.()
      }
    })
    
    if (boxRef.current) {
      if (controlsRef?.current) {
        animateControls(tl, false)
      }
      
      animateContent(tl, false)
      
      animateCollapseButton(tl, false)
      
      tl.to(boxRef.current, {
        width: config.collapsedSize,
        height: config.collapsedSize,
        borderRadius: config.collapsedBorderRadius,
        duration: 0.4,
        ease: 'back.in(1.2)'
      }, '-=0.2')
      
      animateExpandIcon(tl, false)
    }
    
    tl.call(() => {
      setIsVisible(false)
      onVisibilityChange?.(false)
    })
  }

  const toggleBox = () => {
    if (isAnimating) return
    
    if (isVisible) {
      hideBox()
    } else {
      showBox()
    }
  }

  return {
    isVisible,
    isAnimating,
    showBox,
    hideBox,
    toggleBox,
    setupVisibleState,
    setupHiddenState
  }
}

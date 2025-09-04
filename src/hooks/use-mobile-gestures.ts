'use client'

import { useEffect, useRef, useState } from 'react'

interface UseMobileGesturesProps {
  onPullToRefresh?: () => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
  refreshThreshold?: number
}

export function useMobileGestures({
  onPullToRefresh,
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  refreshThreshold = 80,
}: UseMobileGesturesProps) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const touchMoveRef = useRef<{ x: number; y: number } | null>(null)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    let startY = 0
    let startX = 0
    let isAtTop = false

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      startY = touch.clientY
      startX = touch.clientX
      // Chỉ đánh dấu isAtTop khi thực sự ở đầu trang (scroll position = 0)
      isAtTop = element.scrollTop <= 2 // Cho phép sai số nhỏ

      touchStartRef.current = { x: startX, y: startY }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return

      const touch = e.touches[0]
      const currentY = touch.clientY
      const currentX = touch.clientX
      const deltaY = currentY - startY
      const deltaX = currentX - startX

      touchMoveRef.current = { x: currentX, y: currentY }

      // Nếu không ở đầu trang hoặc scroll lên, reset pull-to-refresh state
      if (!isAtTop || deltaY < 0) {
        if (isPulling) {
          setIsPulling(false)
          setPullDistance(0)
        }
        return // Cho phép scroll bình thường
      }

      // Pull to refresh logic - chỉ khi thực sự ở đầu trang và kéo xuống
      if (isAtTop && deltaY > 10 && Math.abs(deltaX) < 30 && onPullToRefresh && element.scrollTop === 0) {
        // Chỉ preventDefault khi thực sự muốn kích hoạt pull-to-refresh
        if (deltaY > 20) { // Chỉ khi kéo xuống đủ xa
          e.preventDefault()
          setIsPulling(true)
          setPullDistance(Math.min(deltaY * 0.5, 100))
        }
      }

      // Prevent default scroll chỉ khi đang trong trạng thái pull-to-refresh thực sự
      if (isPulling && deltaY > 0 && element.scrollTop === 0) {
        e.preventDefault()
      }
    }

    const handleTouchEnd = () => {
      if (!touchStartRef.current || !touchMoveRef.current) {
        setIsPulling(false)
        setPullDistance(0)
        return
      }

      const deltaX = touchMoveRef.current.x - touchStartRef.current.x
      const deltaY = touchMoveRef.current.y - touchStartRef.current.y

      // Pull to refresh
      if (isPulling && pullDistance > refreshThreshold && onPullToRefresh) {
        setIsRefreshing(true)
        onPullToRefresh()

        // Reset after animation
        setTimeout(() => {
          setIsRefreshing(false)
          setIsPulling(false)
          setPullDistance(0)
        }, 1000)
      } else {
        setIsPulling(false)
        setPullDistance(0)
      }

      // Swipe gestures
      if (Math.abs(deltaX) > threshold && Math.abs(deltaY) < threshold) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight()
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft()
        }
      }

      touchStartRef.current = null
      touchMoveRef.current = null
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [
    threshold,
    refreshThreshold,
    onPullToRefresh,
    onSwipeLeft,
    onSwipeRight,
    isPulling,
    pullDistance,
  ])

  return {
    elementRef,
    isPulling,
    pullDistance,
    isRefreshing,
  }
}

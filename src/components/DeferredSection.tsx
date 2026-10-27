import { useEffect, useRef, useState, type ReactNode } from 'react'

interface DeferredSectionProps {
  id: string
  minHeight: number
  children: ReactNode
}

const PRELOAD_MARGIN = '800px 0px'

export function DeferredSection({ id, minHeight, children }: DeferredSectionProps) {
  const anchor = useRef<HTMLDivElement | null>(null)
  const shouldScroll = useRef(false)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const revealForHash = () => {
      if (window.location.hash === `#${id}`) {
        shouldScroll.current = true
        setActive(true)
      }
    }
    revealForHash()
    window.addEventListener('hashchange', revealForHash)
    return () => window.removeEventListener('hashchange', revealForHash)
  }, [id])

  useEffect(() => {
    if (!active || !shouldScroll.current) return
    shouldScroll.current = false
    const align = () => document.getElementById(id)?.scrollIntoView({ behavior: 'instant' })
    const frame = requestAnimationFrame(align)
    const timer = window.setTimeout(align, 500)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [active, id])

  useEffect(() => {
    if (active) return
    const node = anchor.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      setActive(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setActive(true)
          observer.disconnect()
        }
      },
      { rootMargin: PRELOAD_MARGIN },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [active])

  if (active) return <>{children}</>

  return <div ref={anchor} id={id} className="deferred-section" style={{ minHeight }} aria-hidden="true" />
}

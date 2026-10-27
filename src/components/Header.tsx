import { useEffect, useRef, useState } from 'react'
import { LogoMark, MoonIcon, SunIcon } from './Icons'

interface HeaderProps {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  generatedAt: string
}

const links = [
  { id: 'rankings', label: '模型榜' },
  { id: 'compare', label: '价格象限' },
  { id: 'plans', label: 'Coding 套餐' },
  { id: 'api', label: 'API 价格' },
  { id: 'arena', label: 'LMArena' },
  { id: 'pelican', label: '鹈鹕测试' },
  { id: 'sources', label: '数据源' },
]

export function Header({ theme, onToggleTheme, generatedAt }: HeaderProps) {
  const [active, setActive] = useState('rankings')
  const [scrolled, setScrolled] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const lockRef = useRef<string | null>(null)
  const settleTimer = useRef(0)
  const updateRef = useRef<() => void>(() => {})

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      if (lockRef.current) return
      const threshold = (headerRef.current?.offsetHeight ?? 72) + 24
      let current = links[0].id
      for (const link of links) {
        const section = document.getElementById(link.id)
        if (section && section.getBoundingClientRect().top <= threshold) current = link.id
      }
      const scrollBottom = window.innerHeight + window.scrollY
      if (scrollBottom >= document.documentElement.scrollHeight - 4) {
        current = links[links.length - 1].id
      }
      setActive(current)
    }
    updateRef.current = update
    const schedule = () => {
      if (lockRef.current) {
        window.clearTimeout(settleTimer.current)
        settleTimer.current = window.setTimeout(() => {
          lockRef.current = null
          update()
        }, 160)
        return
      }
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.clearTimeout(settleTimer.current)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  const handleNavClick = (id: string) => {
    setActive(id)
    lockRef.current = id
    window.clearTimeout(settleTimer.current)
    settleTimer.current = window.setTimeout(() => {
      lockRef.current = null
      updateRef.current()
    }, 400)
  }

  return (
    <header ref={headerRef} className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="header-inner">
        <a className="brand" href="#top" aria-label="AI Eyes 首页">
          <span className="brand-mark"><LogoMark size={32} /></span>
          <span className="brand-text">
            <strong>AI EYES</strong>
            <small>全球模型雷达</small>
          </span>
        </a>

        <nav className="main-nav" aria-label="页面导航">
          {links.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className={active === link.id ? 'is-active' : ''}
              aria-current={active === link.id ? 'location' : undefined}
              onClick={() => handleNavClick(link.id)}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="header-tools">
          <span className="live-badge" title={`数据快照于 ${generatedAt}`}>
            <span className="live-dot" />
            <span>SNAPSHOT</span>
          </span>
          <button
            className="icon-button theme-toggle"
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
          >
            {theme === 'dark' ? <SunIcon size={17} /> : <MoonIcon size={17} />}
          </button>
        </div>
      </div>
    </header>
  )
}

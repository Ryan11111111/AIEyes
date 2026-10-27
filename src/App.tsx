import { useCallback, useEffect, useMemo, useState } from 'react'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Leaderboard } from './components/Leaderboard'
import { ArenaLeaderboard } from './components/ArenaLeaderboard'
import { PelicanBench } from './components/PelicanBench'
import { ValueChart } from './components/ValueChart'
import { Plans } from './components/Plans'
import { ApiPrices } from './components/ApiPrices'
import { Sources } from './components/Sources'
import { DeferredSection } from './components/DeferredSection'
import { ModelDrawer } from './components/ModelDrawer'
import { LogoMark, ArrowUpRightIcon, RefreshIcon } from './components/Icons'
import { loadAppData } from './lib/data'
import { formatTimestamp } from './lib/format'
import type { AppData, Metric, Selection } from './lib/types'

type Theme = 'dark' | 'light'

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('ai-eyes-theme')
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    // storage can be unavailable in sandboxed previews
  }
  return 'dark'
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-mark"><LogoMark size={54} /></div>
      <span className="loading-brand">AI EYES</span>
      <p>正在校准模型雷达…</p>
      <div className="loading-bar"><i /></div>
    </div>
  )
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [payload, setPayload] = useState<AppData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selection, setSelection] = useState<Selection>(null)

  const fetchData = useCallback(async () => {
    setError(null)
    try {
      const data = await loadAppData()
      setPayload(data)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '数据加载失败')
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('ai-eyes-theme', theme)
    } catch {
      // ignore unavailable storage
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) metaTheme.setAttribute('content', theme === 'dark' ? '#070a0f' : '#f4f1ea')
  }, [theme])

  useEffect(() => {
    if (!payload) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const observer = reduced
      ? null
      : new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('is-visible')
                observer?.unobserve(entry.target)
              }
            })
          },
          { threshold: 0.06, rootMargin: '0px 0px 200px 0px' },
        )
    const seen = new WeakSet<Element>()
    const register = (element: Element) => {
      if (seen.has(element) || !element.classList.contains('reveal')) return
      seen.add(element)
      if (observer) observer.observe(element)
      else element.classList.add('is-visible')
    }
    const collect = (node: Element) => {
      register(node)
      node.querySelectorAll('.reveal').forEach(register)
    }
    document.querySelectorAll('.reveal').forEach(collect)

    const root = document.getElementById('root')
    let pending: Element[] = []
    let scheduled = false
    const flush = () => {
      scheduled = false
      const nodes = pending
      pending = []
      nodes.forEach(collect)
    }
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) pending.push(node)
        })
      }
      if (!scheduled && pending.length) {
        scheduled = true
        queueMicrotask(flush)
      }
    })
    if (root) mutations.observe(root, { childList: true, subtree: true })
    return () => {
      mutations.disconnect()
      observer?.disconnect()
    }
  }, [payload])

  const closeDrawer = useCallback(() => setSelection(null), [])

  const scoreMax = useMemo(() => {
    const max: Record<Metric, number> = { intelligence: 1, coding: 1, agentic: 1 }
    for (const model of payload?.models ?? []) {
      for (const metric of ['intelligence', 'coding', 'agentic'] as Metric[]) {
        const value = model[metric]
        if (typeof value === 'number' && value > max[metric]) max[metric] = value
      }
    }
    return max
  }, [payload])

  if (!payload) {
    if (error) {
      return (
        <div className="error-screen">
          <LogoMark size={48} />
          <h1>数据没有成功加载</h1>
          <p>{error}</p>
          <div className="error-actions">
            <button type="button" className="button button-primary" onClick={fetchData}>
              <RefreshIcon size={15} /> 重新加载
            </button>
            <a className="button button-ghost" href="https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json" target="_blank" rel="noreferrer">
              检查数据源 <ArrowUpRightIcon size={14} />
            </a>
          </div>
          <span className="error-hint">首次部署时，请先运行 npm run refresh 生成数据文件。</span>
        </div>
      )
    }
    return <LoadingScreen />
  }

  const { meta, models, apiModels, plans, pelican, loadArena } = payload

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">跳到主要内容</a>
      <Header theme={theme} onToggleTheme={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))} generatedAt={meta.generatedAt} />
      <main id="main">
        <Hero meta={meta} models={models} />
        <Leaderboard models={models} onSelect={(model) => setSelection({ kind: 'ranked', model })} />
        <DeferredSection id="compare" minHeight={880}>
          <ValueChart models={models} onSelect={(model) => setSelection({ kind: 'ranked', model })} />
        </DeferredSection>
        <DeferredSection id="plans" minHeight={1180}>
          <Plans plans={plans} fx={meta.fx.usdCny} verifiedAt={plans[0]?.verifiedAt ?? meta.generatedAt} />
        </DeferredSection>
        <DeferredSection id="api" minHeight={1420}>
          <ApiPrices models={apiModels} fx={meta.fx.usdCny} onSelect={(model) => setSelection({ kind: 'api', model })} />
        </DeferredSection>
        <DeferredSection id="arena" minHeight={1240}>
          <ArenaLeaderboard load={loadArena} />
        </DeferredSection>
        <DeferredSection id="pelican" minHeight={1020}>
          <PelicanBench data={pelican} />
        </DeferredSection>
        <DeferredSection id="sources" minHeight={720}>
          <Sources meta={meta} />
        </DeferredSection>
      </main>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <span className="footer-logo"><LogoMark size={34} /></span>
            <div>
              <strong>AI EYES</strong>
              <p>全球模型排名、API 价格与 Coding 套餐雷达。</p>
            </div>
          </div>
          <div className="footer-nav">
            <div>
              <span>浏览</span>
              <a href="#rankings">模型榜</a>
              <a href="#compare">价格象限</a>
              <a href="#arena">LMArena</a>
              <a href="#pelican">鹈鹕测试</a>
            </div>
            <div>
              <span>数据</span>
              <a href="#plans">Coding 套餐</a>
              <a href="#api">API 价格</a>
              <a href="#sources">数据源</a>
              <a href="https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json" target="_blank" rel="noreferrer">LiteLLM 价格库</a>
            </div>
          </div>
          <div className="footer-status">
            <div><span className="live-dot" /> 本地数据快照</div>
            <strong>{formatTimestamp(meta.generatedAt, { withYear: true })}</strong>
            <span>建议刷新 {formatTimestamp(meta.nextRefreshAt, { withYear: true })}</span>
            <a href="#top">回到顶部 ↑</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} AI Eyes · 独立数据整理项目</span>
          <span>排名来自 LMArena（CC BY 4.0） · 价格来自 LiteLLM（MIT） · 汇率来自 ECB · 套餐为人工核对</span>
        </div>
      </footer>

      <ModelDrawer selection={selection} fx={meta.fx.usdCny} scoreMax={scoreMax} onClose={closeDrawer} />
    </div>
  )
}

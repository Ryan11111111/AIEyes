import type { Meta, RankedModel } from '../lib/types'
import { formatCompact, formatPrice, formatScore, formatTimestamp, relativeStatus } from '../lib/format'
import { ArrowUpRightIcon, GlobeIcon, SparkIcon } from './Icons'

interface HeroProps {
  meta: Meta
  models: RankedModel[]
}

function RadarVisual({ models }: { models: RankedModel[] }) {
  const top = models
    .filter((model) => model.intelligence !== null)
    .sort((a, b) => (b.intelligence || 0) - (a.intelligence || 0))
    .slice(0, 14)
  const scores = top
    .map((model) => model.intelligence)
    .filter((value): value is number => typeof value === 'number')
  const min = scores.length ? Math.min(...scores) : 0
  const max = scores.length ? Math.max(...scores) : 1
  const span = max - min || 1

  return (
    <div className="radar-wrap" aria-hidden="true">
      <svg viewBox="0 0 320 320" className="radar-svg">
        <defs>
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity=".13" />
            <stop offset="72%" stopColor="var(--accent)" stopOpacity=".03" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="radarSweep" x1="160" y1="160" x2="160" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--accent)" stopOpacity=".28" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="160" cy="160" r="150" fill="url(#radarGlow)" />
        {[40, 80, 120, 150].map((radius) => (
          <circle key={radius} cx="160" cy="160" r={radius} className="radar-ring" />
        ))}
        <path d="M160 10v300M10 160h300" className="radar-axis" />
        <path d="m54 54 212 212M266 54 54 266" className="radar-axis radar-axis-faint" />
        <g className="radar-sweep">
          <path d="M160 160 L160 20 A140 140 0 0 1 258 76 Z" fill="url(#radarSweep)" />
          <path d="M160 160 L160 20" className="radar-sweep-line" />
        </g>
        {top.map((model, index) => {
          const ratio = Math.max(0, Math.min(1, ((model.intelligence ?? min) - min) / span))
          const angle = ((-90 + index * (360 / top.length)) * Math.PI) / 180
          const radius = 38 + ratio * 104
          const x = 160 + Math.cos(angle) * radius
          const y = 160 + Math.sin(angle) * radius
          return (
            <g key={`${model.name}-${index}`} className={`radar-blip ${model.region}`}>
              <circle cx={x} cy={y} r={index === 0 ? 5.4 : 3.2} className="radar-blip-core" />
              <circle cx={x} cy={y} r={index === 0 ? 12 : 7} className="radar-blip-halo" />
            </g>
          )
        })}
        <text x="160" y="156" textAnchor="middle" className="radar-center-label">ARENA</text>
        <text x="160" y="172" textAnchor="middle" className="radar-center-sub">SCORE</text>
        <text x="160" y="307" textAnchor="middle" className="radar-scale">{`${min.toFixed(0)} — ${max.toFixed(0)}`}</text>
      </svg>
    </div>
  )
}

export function Hero({ meta, models }: HeroProps) {
  const ranked = models
    .filter((model) => typeof model.intelligence === 'number')
    .sort((a, b) => (b.intelligence || 0) - (a.intelligence || 0))
  const top = ranked.slice(0, 8)
  const domestic = ranked.filter((model) => model.region === 'domestic').slice(0, 4)
  const ticker = [...top, ...domestic].slice(0, 9)
  const onlineSources = meta.sources.filter((source) => relativeStatus(source.status).tone === 'ok').length
  const cheapest = meta.stats.cheapestDomesticPlan

  return (
    <section className="hero" id="top">
      <div className="hero-grid">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="eyebrow-line" />
            <span>GLOBAL AI INTELLIGENCE · OPEN DATA</span>
          </div>
          <h1>
            看清每一个模型，
            <br />
            <em>算清每一笔成本。</em>
          </h1>
          <p className="hero-lede">
            聚合 LMArena 文本、代码与 Agent 三个社区盲测榜，LiteLLM 开放价格库，
            以及国内外主流 AI Coding 套餐。一个页面，完成模型选型与预算决策。
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#rankings">
              探索模型榜
              <ArrowUpRightIcon size={16} />
            </a>
            <a className="button button-ghost" href="#plans">
              对比 Coding 套餐
            </a>
          </div>
          <div className="hero-assurance">
            <span className="assurance-dot" />
            <span>数据截至 {formatTimestamp(meta.generatedAt)}</span>
            <span className="assurance-sep">/</span>
            <span>本地快照 · 手动刷新</span>
          </div>
        </div>

        <aside className="hero-panel">
          <div className="panel-topline">
            <span className="panel-label"><span className="live-dot" /> ARENA FEED</span>
            <span className="panel-status">{onlineSources}/{meta.sources.length} 数据源在线</span>
          </div>
          <RadarVisual models={models} />
          <div className="panel-stats">
            <div>
              <span>快照时间</span>
              <strong>{formatTimestamp(meta.generatedAt, { withYear: false })}</strong>
            </div>
            <div>
              <span>建议刷新</span>
              <strong>{formatTimestamp(meta.nextRefreshAt, { withYear: false })}</strong>
            </div>
          </div>
          <div className="panel-foot">
            <span><SparkIcon size={13} /> LMArena {meta.stats.rankedModels} · API {meta.stats.apiModels}</span>
            <span>1 USD ≈ ¥{meta.fx.usdCny.toFixed(2)}</span>
          </div>
        </aside>
      </div>

      <div className="stat-strip reveal">
        <div className="stat-cell">
          <span className="stat-label">追踪模型</span>
          <strong>{formatCompact(meta.stats.rankedModels)}</strong>
          <span className="stat-sub">国内 {meta.stats.domesticModels} · 海外 {meta.stats.globalModels}</span>
        </div>
        <div className="stat-cell">
          <span className="stat-label">开放价格库</span>
          <strong>{formatCompact(meta.stats.apiModels)}</strong>
          <span className="stat-sub">{meta.stats.freeApiModels} 个免费模型 · 每 1M tokens</span>
        </div>
        <div className="stat-cell">
          <span className="stat-label">覆盖厂商</span>
          <strong>{meta.stats.vendors}</strong>
          <span className="stat-sub">{meta.stats.platformVendors} 家 Coding 平台</span>
        </div>
        <div className="stat-cell">
          <span className="stat-label">Coding 套餐</span>
          <strong>{meta.stats.plans}</strong>
          <span className="stat-sub">
            国内入门档 {cheapest ? (cheapest.currency === 'CNY' ? `¥${cheapest.price}` : `$${cheapest.price}`) : '—'} 起
          </span>
        </div>
      </div>

      <div className="ticker reveal" role="region" aria-label="模型文本竞技场分数速览">
        <div className="ticker-label"><GlobeIcon size={14} /> TOP MODELS</div>
        <div className="ticker-viewport">
          <div className="ticker-track">
            {[0, 1].map((copy) => (
              <div className="ticker-group" key={copy} aria-hidden={copy === 1}>
                {ticker.map((model, index) => (
                  <span className="ticker-item" key={`${copy}-${model.name}`}>
                    <span className="ticker-rank">{String(index + 1).padStart(2, '0')}</span>
                    <span className="ticker-name">{model.name}</span>
                    <span className="ticker-score">{formatScore(model.intelligence)}</span>
                    <span className={`ticker-region ${model.region}`}>{model.region === 'domestic' ? 'CN' : 'GL'}</span>
                    <span className="ticker-price">{formatPrice(model.output, { compact: true })}<small>/1M</small></span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

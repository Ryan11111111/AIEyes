import { useEffect, useMemo, useState } from 'react'
import type { Metric, RankedModel, Region } from '../lib/types'
import {
  formatContext,
  formatPrice,
  formatScore,
  metricDigits,
  metricLabel,
  metricShortLabel,
  rankField,
  regionLabel,
  scorePercent,
} from '../lib/format'
import { ArrowUpRightIcon, CheckIcon, SearchIcon } from './Icons'
import { SectionHeader } from './SectionHeader'

interface LeaderboardProps {
  models: RankedModel[]
  onSelect: (model: RankedModel) => void
}

const metrics: Metric[] = ['intelligence', 'coding', 'agentic']

function PodiumCard({ model, rank, metric }: { model: RankedModel; rank: number; metric: Metric }) {
  const score = model[metric]
  return (
    <article className={`podium-card podium-${rank}`}>
      <div className="podium-top">
        <span className="podium-rank">{String(rank).padStart(2, '0')}</span>
        <span className={`region-chip ${model.region}`}>{regionLabel(model.region)}</span>
      </div>
      <div className="podium-vendor">{model.vendor}</div>
      <h3>{model.name}</h3>
      <div className="podium-score">
        {formatScore(score, metricDigits(metric))}
        <small>{metricLabel[metric]}</small>
      </div>
      <div className="podium-foot">
        <span>输出 {formatPrice(model.output, { compact: true })}<small>/1M</small></span>
        <span>{formatContext(model.context)} ctx</span>
      </div>
    </article>
  )
}

export function Leaderboard({ models, onSelect }: LeaderboardProps) {
  const [metric, setMetric] = useState<Metric>('intelligence')
  const [region, setRegion] = useState<'all' | Region>('all')
  const [vendor, setVendor] = useState('all')
  const [openOnly, setOpenOnly] = useState(false)
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(20)
  const [showPodium, setShowPodium] = useState(true)

  const vendors = useMemo(
    () => [...new Set(models.map((model) => model.vendor))].sort((a, b) => a.localeCompare(b, 'zh-CN')),
    [models],
  )

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return models
      .filter((model) => typeof model[metric] === 'number')
      .filter((model) => (region === 'all' ? true : model.region === region))
      .filter((model) => (vendor === 'all' ? true : model.vendor === vendor))
      .filter((model) => (openOnly ? model.openWeights === true : true))
      .filter((model) => {
        if (!normalized) return true
        return `${model.name} ${model.vendor} ${model.apiId || ''}`.toLowerCase().includes(normalized)
      })
      .sort((a, b) => (a[rankField[metric]] || 1e9) - (b[rankField[metric]] || 1e9))
  }, [models, metric, region, vendor, openOnly, query])

  useEffect(() => {
    setLimit(20)
  }, [metric, region, vendor, openOnly, query])

  const metricCounts = useMemo(() => {
    const counts: Record<Metric, number> = { intelligence: 0, coding: 0, agentic: 0 }
    for (const model of models) {
      if (typeof model.intelligence === 'number') counts.intelligence += 1
      if (typeof model.coding === 'number') counts.coding += 1
      if (typeof model.agentic === 'number') counts.agentic += 1
    }
    return counts
  }, [models])

  const topScore = filtered[0]?.[metric] || 1
  const podium = showPodium && !query && region === 'all' && vendor === 'all' && !openOnly
    ? filtered.slice(0, 3)
    : []
  const visible = filtered.slice(0, limit)
  const hasFilters = region !== 'all' || vendor !== 'all' || openOnly || query.trim().length > 0

  const resetFilters = () => {
    setRegion('all')
    setVendor('all')
    setOpenOnly(false)
    setQuery('')
  }

  return (
    <section className="section" id="rankings">
      <SectionHeader
        index="01"
        eyebrow="MODEL LEADERBOARD"
        title="模型能力总榜"
        description="以 LMArena 社区盲测为主轴，文本、代码与 Agent 三个榜分别排名；同一模型多档位取最高分，价格来自 LiteLLM 开放价格库。"
        actions={
          <div className="metric-tabs" role="tablist" aria-label="榜单维度">
            {metrics.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={metric === item}
                className={metric === item ? 'is-active' : ''}
                onClick={() => setMetric(item)}
              >
                {metricShortLabel[item]}
                <span>{metricCounts[item]}</span>
              </button>
            ))}
          </div>
        }
      />

      {podium.length === 3 ? (
        <div className="podium reveal">
          {podium.map((model, index) => (
            <PodiumCard key={`${model.name}-${index}`} model={model} rank={index + 1} metric={metric} />
          ))}
        </div>
      ) : null}

      <div className="toolbar reveal">
        <div className="segmented" role="group" aria-label="地区筛选">
          {(['all', 'domestic', 'global'] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={region === item ? 'is-active' : ''}
              onClick={() => setRegion(item)}
            >
              {item === 'all' ? '全部' : regionLabel(item)}
            </button>
          ))}
        </div>
        <label className="search-field">
          <SearchIcon size={15} />
          <input
            type="search"
            value={query}
            placeholder="搜索模型或厂商…"
            onChange={(event) => setQuery(event.target.value)}
            aria-label="搜索模型或厂商"
          />
          {query ? (
            <button type="button" className="search-clear" onClick={() => setQuery('')} aria-label="清空搜索">×</button>
          ) : null}
        </label>
        <label className="select-field">
          <span>厂商</span>
          <select value={vendor} onChange={(event) => setVendor(event.target.value)} aria-label="按厂商筛选">
            <option value="all">全部厂商</option>
            {vendors.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <button
          type="button"
          className={`filter-toggle ${openOnly ? 'is-active' : ''}`}
          onClick={() => setOpenOnly((value) => !value)}
          aria-pressed={openOnly}
        >
          <span className="check-box">{openOnly ? <CheckIcon size={11} /> : null}</span>
          仅看开源
        </button>
        {hasFilters ? (
          <button type="button" className="text-button" onClick={resetFilters}>重置</button>
        ) : null}
        <button type="button" className="text-button podium-toggle" onClick={() => setShowPodium((value) => !value)}>
          {showPodium ? '隐藏前三' : '显示前三'}
        </button>
      </div>

      <div className="table-shell reveal">
        <table className="data-table rankings-table">
          <thead>
            <tr>
              <th className="col-rank">排名</th>
              <th>模型</th>
              <th className="col-score">{metricLabel[metric]}</th>
              {metrics.filter((item) => item !== metric).map((item) => (
                <th key={item} className="col-secondary col-num">{metricShortLabel[item]}</th>
              ))}
              <th className="col-context col-num">上下文</th>
              <th className="col-price">输入 / 1M</th>
              <th className="col-price">输出 / 1M</th>
              <th className="col-action"><span className="sr-only">详情</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((model) => {
              const score = model[metric]
              return (
                <tr
                  key={`${model.vendor}-${model.name}`}
                  tabIndex={0}
                  onClick={() => onSelect(model)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onSelect(model)
                    }
                  }}
                  aria-label={`查看 ${model.name} 详情`}
                >
                  <td className="col-rank">
                    <span className={`rank-number ${(model[rankField[metric]] || 99) <= 3 ? 'is-top' : ''}`}>
                      {model[rankField[metric]] || '—'}
                    </span>
                  </td>
                  <td>
                    <div className="model-cell">
                      <div className="model-title-row">
                        <span className="model-name">{model.name}</span>
                        {model.openWeights ? <span className="tag tag-open">开源</span> : null}
                        {model.free ? <span className="tag tag-free">Free</span> : null}
                      </div>
                      <div className="model-sub">
                        <span className={`vendor-dot ${model.region}`} />
                        {model.vendor}
                        <span className="dot-sep">·</span>
                        {regionLabel(model.region)}
                      </div>
                    </div>
                  </td>
                  <td className="col-score">
                    <div className="score-cell">
                      <span className="score-value">{formatScore(score, metricDigits(metric))}</span>
                      <span className="score-track">
                        <span
                          className={`score-fill ${model.region}`}
                          style={{ width: `${scorePercent(score, topScore)}%` }}
                        />
                      </span>
                    </div>
                  </td>
                  {metrics.filter((item) => item !== metric).map((item) => (
                    <td key={item} className="col-secondary num">{formatScore(model[item], metricDigits(item))}</td>
                  ))}
                  <td className="col-context num">{formatContext(model.context)}</td>
                  <td className="col-price num">{formatPrice(model.input)}</td>
                  <td className="col-price num strong">{formatPrice(model.output)}</td>
                  <td className="col-action"><ArrowUpRightIcon size={15} className="row-arrow" /></td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {!filtered.length ? (
          <div className="empty-state">
            <SearchIcon size={22} />
            <strong>没有符合条件的模型</strong>
            <span>换个关键词、厂商或地区试试。</span>
            <button type="button" className="button button-ghost" onClick={resetFilters}>清除筛选</button>
          </div>
        ) : null}
      </div>

      <div className="table-footer reveal">
        <div className="table-note">
          共 <strong>{filtered.length}</strong> 个有分数的模型 · 点击行查看完整指标与价格
        </div>
        {limit < filtered.length ? (
          <button type="button" className="button button-ghost" onClick={() => setLimit((value) => value + 30)}>
            再加载 30 个
          </button>
        ) : null}
      </div>

      <p className="section-note reveal">
        排名为全站排名，不会因筛选而变化。分数来自 LMArena 社区盲测（CC BY 4.0），文本、代码与 Agent 分别取对应竞技场总榜；
        未覆盖的模型显示为 “—”。API 价格来自 LiteLLM（MIT），单位为美元 / 百万 tokens。
      </p>
    </section>
  )
}

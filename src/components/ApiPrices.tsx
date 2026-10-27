import { useEffect, useMemo, useState } from 'react'
import type { ApiModel, Region } from '../lib/types'
import { formatContext, formatPrice, formatScore, regionLabel } from '../lib/format'
import { ArrowUpRightIcon, CheckIcon, SearchIcon } from './Icons'
import { SectionHeader } from './SectionHeader'

interface ApiPricesProps {
  models: ApiModel[]
  fx: number
  onSelect: (model: ApiModel) => void
}

type SortMode = 'smart' | 'output-asc' | 'input-asc' | 'context-desc' | 'name-asc'

function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

export function ApiPrices({ models, fx, onSelect }: ApiPricesProps) {
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState<'all' | Region>('all')
  const [vendor, setVendor] = useState('all')
  const [sort, setSort] = useState<SortMode>('smart')
  const [currency, setCurrency] = useState<'USD' | 'CNY'>('USD')
  const [onlyTools, setOnlyTools] = useState(false)
  const [limit, setLimit] = useState(20)

  const vendors = useMemo(
    () => [...new Set(models.map((model) => model.vendor))].sort((a, b) => a.localeCompare(b, 'zh-CN')),
    [models],
  )

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const list = models
      .filter((model) => (region === 'all' ? true : model.region === region))
      .filter((model) => (vendor === 'all' ? true : model.vendor === vendor))
      .filter((model) => (onlyTools ? model.tools : true))
      .filter((model) => {
        if (!normalized) return true
        return `${model.name} ${model.id} ${model.vendor}`.toLowerCase().includes(normalized)
      })

    return [...list].sort((a, b) => {
      if (sort === 'output-asc') return (a.output ?? Infinity) - (b.output ?? Infinity)
      if (sort === 'input-asc') return (a.input ?? Infinity) - (b.input ?? Infinity)
      if (sort === 'context-desc') return (b.context ?? 0) - (a.context ?? 0)
      if (sort === 'name-asc') return a.name.localeCompare(b.name, 'zh-CN')
      const scoreA = a.intelligence ?? -Infinity
      const scoreB = b.intelligence ?? -Infinity
      if (scoreB !== scoreA) return scoreB - scoreA
      return (b.created ?? 0) - (a.created ?? 0)
    })
  }, [models, query, region, vendor, sort, onlyTools])

  useEffect(() => {
    setLimit(20)
  }, [query, region, vendor, sort, onlyTools])

  const summary = useMemo(() => {
    const free = models.filter((model) => model.free).length
    const tools = models.filter((model) => model.tools).length
    const priced = models.filter((model) => model.output !== null).map((model) => model.output as number).sort((a, b) => a - b)
    const median = priced.length ? priced[Math.floor(priced.length / 2)] : null
    return { free, tools, median }
  }, [models])

  const visible = filtered.slice(0, limit)
  const hasFilters = region !== 'all' || vendor !== 'all' || onlyTools || query.trim().length > 0
  const resetFilters = () => {
    setRegion('all')
    setVendor('all')
    setOnlyTools(false)
    setQuery('')
  }

  const exportCsv = () => {
    const header = ['model', 'vendor', 'region', 'text_arena', 'code_arena', 'context', 'input_usd_1m', 'output_usd_1m', 'cache_read_usd_1m', 'input_cny_1m', 'output_cny_1m', 'model_id']
    const rows = filtered.map((model) => [
      model.name,
      model.vendor,
      model.region,
      model.intelligence,
      model.coding,
      model.context,
      model.input,
      model.output,
      model.cacheRead,
      model.input === null ? null : Number((model.input * fx).toFixed(4)),
      model.output === null ? null : Number((model.output * fx).toFixed(4)),
      model.id,
    ])
    const content = `\ufeff${[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')}`
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `ai-eyes-api-prices-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="section" id="api">
      <SectionHeader
        index="04"
        eyebrow="API PRICE DIRECTORY"
        title="单模型 API 价格"
        description="来自 LiteLLM 开放价格库的输入、输出、缓存价格，按每百万 tokens 计。支持按地区、厂商和工具能力筛选，并可导出 CSV。"
        actions={
          <button type="button" className="button button-ghost export-button" onClick={exportCsv}>
            导出 CSV
            <ArrowUpRightIcon size={14} />
          </button>
        }
      />

      <div className="api-summary reveal">
        <div><span>目录模型</span><strong>{models.length}</strong><small>覆盖 {vendors.length} 家厂商</small></div>
        <div><span>免费模型</span><strong>{summary.free}</strong><small>输入输出均为 $0</small></div>
        <div><span>支持工具调用</span><strong>{summary.tools}</strong><small>可直接接入 Agent</small></div>
        <div><span>输出价中位数</span><strong>{formatPrice(summary.median, { currency, fx })}</strong><small>每 1M tokens · {currency}</small></div>
      </div>

      <div className="toolbar reveal">
        <div className="segmented" role="group" aria-label="API 模型地区筛选">
          {(['all', 'domestic', 'global'] as const).map((item) => (
            <button key={item} type="button" className={region === item ? 'is-active' : ''} onClick={() => setRegion(item)}>
              {item === 'all' ? '全部' : regionLabel(item)}
            </button>
          ))}
        </div>
        <label className="search-field">
          <SearchIcon size={15} />
          <input
            type="search"
            value={query}
            placeholder="搜索模型 ID 或厂商…"
            onChange={(event) => setQuery(event.target.value)}
            aria-label="搜索 API 模型"
          />
          {query ? <button type="button" className="search-clear" onClick={() => setQuery('')} aria-label="清空搜索">×</button> : null}
        </label>
        <label className="select-field">
          <span>厂商</span>
          <select value={vendor} onChange={(event) => setVendor(event.target.value)} aria-label="按厂商筛选">
            <option value="all">全部厂商</option>
            {vendors.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="select-field">
          <span>排序</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} aria-label="价格排序">
            <option value="smart">文本分优先</option>
            <option value="output-asc">输出价低到高</option>
            <option value="input-asc">输入价低到高</option>
            <option value="context-desc">上下文最大</option>
            <option value="name-asc">模型名 A→Z</option>
          </select>
        </label>
        <button
          type="button"
          className={`filter-toggle ${onlyTools ? 'is-active' : ''}`}
          onClick={() => setOnlyTools((value) => !value)}
          aria-pressed={onlyTools}
        >
          <span className="check-box">{onlyTools ? <CheckIcon size={11} /> : null}</span>
          可工具调用
        </button>
        <div className="currency-toggle" role="group" aria-label="计价货币">
          <button type="button" className={currency === 'USD' ? 'is-active' : ''} onClick={() => setCurrency('USD')}>USD</button>
          <button type="button" className={currency === 'CNY' ? 'is-active' : ''} onClick={() => setCurrency('CNY')}>CNY</button>
        </div>
        {hasFilters ? <button type="button" className="text-button" onClick={resetFilters}>重置</button> : null}
      </div>

      <div className="table-shell reveal">
        <table className="data-table api-table">
          <thead>
            <tr>
              <th>模型 / ID</th>
              <th className="col-context">厂商</th>
              <th className="col-num">文本</th>
              <th className="col-secondary col-num">代码</th>
              <th className="col-context col-num">上下文</th>
              <th className="col-price">输入 / 1M</th>
              <th className="col-price">输出 / 1M</th>
              <th className="col-secondary col-num">缓存读</th>
              <th className="col-action"><span className="sr-only">详情</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((model) => (
              <tr
                key={model.id}
                tabIndex={0}
                onClick={() => onSelect(model)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelect(model)
                  }
                }}
                aria-label={`查看 ${model.name} 价格详情`}
              >
                <td>
                  <div className="model-cell">
                    <div className="model-title-row">
                      <span className="model-name">{model.name}</span>
                      {model.free ? <span className="tag tag-free">Free</span> : null}
                      {model.openWeights ? <span className="tag tag-open">开源</span> : null}
                    </div>
                    <div className="model-sub mono">{model.id}</div>
                  </div>
                </td>
                <td className="col-context">
                  <div className="model-sub">
                    <span className={`vendor-dot ${model.region}`} />
                    {model.vendor}
                  </div>
                </td>
                <td className="num">
                  <span className="inline-score">{formatScore(model.intelligence)}</span>
                  {model.arenaRankIntelligence ? <small className="inline-rank">#{model.arenaRankIntelligence}</small> : null}
                </td>
                <td className="col-secondary num">{formatScore(model.coding)}</td>
                <td className="col-context num">{formatContext(model.context)}</td>
                <td className="col-price num">{formatPrice(model.input, { currency, fx })}</td>
                <td className="col-price num strong">{formatPrice(model.output, { currency, fx })}</td>
                <td className="col-secondary num">{formatPrice(model.cacheRead, { currency, fx })}</td>
                <td className="col-action"><ArrowUpRightIcon size={15} className="row-arrow" /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length ? (
          <div className="empty-state">
            <SearchIcon size={22} />
            <strong>没有匹配的模型</strong>
            <span>尝试清空关键词或切换厂商。</span>
            <button type="button" className="button button-ghost" onClick={resetFilters}>清除筛选</button>
          </div>
        ) : null}
      </div>

      <div className="table-footer reveal">
        <div className="table-note">
          显示 {Math.min(limit, filtered.length)} / {filtered.length} 个模型 · 1 USD ≈ ¥{fx.toFixed(2)} · 点击行查看完整价格
        </div>
        {limit < filtered.length ? (
          <button type="button" className="button button-ghost" onClick={() => setLimit((value) => value + 30)}>
            再加载 30 个
          </button>
        ) : null}
      </div>

      <p className="section-note reveal">
        LiteLLM 汇总厂商直营与托管渠道的公开标价，可能与批处理价、区域价或企业折扣不同；同一模型有多个渠道时，本页按模型去重并优先采用厂商直营价。
        标注 “Free” 的模型通常限速或限额度。缓存读/写价格仅在有数据时展示。
      </p>
    </section>
  )
}

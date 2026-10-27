import { useEffect, useMemo, useState } from 'react'
import type { ArenaData, Region } from '../lib/types'
import { ArrowUpRightIcon, SearchIcon } from './Icons'
import { SectionHeader } from './SectionHeader'

interface ArenaLeaderboardProps {
  load: () => Promise<ArenaData>
}

interface ArenaBoardProps {
  data: ArenaData
}

function formatScore(value: number, metric: 'rating' | 'ips'): string {
  return metric === 'ips' ? value.toFixed(3) : value.toFixed(1)
}

function formatCi(lower: number | null, upper: number | null, metric: 'rating' | 'ips'): string {
  if (lower === null || upper === null) return '—'
  const digits = metric === 'ips' ? 3 : 1
  return `${lower.toFixed(digits)} – ${upper.toFixed(digits)}`
}

function formatVotes(value: number | null): string {
  if (value === null) return '—'
  return new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function ArenaLeaderboard({ load }: ArenaLeaderboardProps) {
  const [data, setData] = useState<ArenaData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    load()
      .then((value) => {
        if (!cancelled) setData(value)
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'LMArena 数据加载失败')
      })
    return () => {
      cancelled = true
    }
  }, [load])

  if (!data) {
    return (
      <section className="section" id="arena">
        <SectionHeader
          index="05"
          eyebrow="ARENA LEADERBOARD"
          title="LMArena 竞技场榜"
          description="社区盲测的文本、代码与 Agent 排名；保留原始榜期、95% 置信区间与票数，不做二次加权。"
        />
        {error
          ? <div className="empty-state"><strong>LMArena 数据没有加载成功</strong><span>{error}</span></div>
          : <div className="deferred-skeleton" />}
      </section>
    )
  }

  return <ArenaBoard data={data} />
}

function ArenaBoard({ data }: ArenaBoardProps) {
  const [boardId, setBoardId] = useState(data.boards[0]?.id ?? 'text')
  const [categoryId, setCategoryId] = useState('overall')
  const [region, setRegion] = useState<'all' | Region>('all')
  const [vendor, setVendor] = useState('all')
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(20)

  const board = data.boards.find((item) => item.id === boardId) ?? data.boards[0]
  const category = board?.categories.find((item) => item.id === categoryId) ?? board?.categories[0]
  const metric = board?.metric ?? 'rating'

  useEffect(() => {
    if (!board) return
    if (!board.categories.some((item) => item.id === categoryId)) {
      setCategoryId(board.categories[0]?.id ?? 'overall')
    }
  }, [board, categoryId])

  const vendors = useMemo(
    () => [...new Set((category?.models ?? []).map((model) => model.vendor))].sort((a, b) => a.localeCompare(b, 'zh-CN')),
    [category],
  )

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return (category?.models ?? [])
      .filter((model) => (region === 'all' ? true : model.region === region))
      .filter((model) => (vendor === 'all' ? true : model.vendor === vendor))
      .filter((model) => {
        if (!normalized) return true
        return `${model.name} ${model.vendor} ${model.license}`.toLowerCase().includes(normalized)
      })
  }, [category, region, vendor, query])

  useEffect(() => {
    setLimit(20)
  }, [boardId, categoryId, region, vendor, query])

  const topModel = category?.models.find((model) => model.rank === 1) ?? category?.models[0]
  const visible = filtered.slice(0, limit)
  const hasFilters = region !== 'all' || vendor !== 'all' || query.trim().length > 0

  const selectBoard = (id: string) => {
    const next = data.boards.find((item) => item.id === id)
    setBoardId(id)
    setCategoryId(next?.categories[0]?.id ?? 'overall')
    setRegion('all')
    setVendor('all')
    setQuery('')
    setLimit(20)
  }

  const resetFilters = () => {
    setRegion('all')
    setVendor('all')
    setQuery('')
  }

  return (
    <section className="section" id="arena">
      <SectionHeader
        index="05"
        eyebrow="ARENA LEADERBOARD"
        title="LMArena 竞技场榜"
        description="社区盲测的文本、代码与 Agent 排名；保留原始榜期、95% 置信区间与票数，不做二次加权。"
        actions={
          <div className="metric-tabs" role="tablist" aria-label="LMArena 榜单">
            {data.boards.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={board?.id === item.id}
                className={board?.id === item.id ? 'is-active' : ''}
                onClick={() => selectBoard(item.id)}
              >
                {item.shortName}
                <span>{item.categories.find((entry) => entry.id === 'overall')?.models.length ?? item.categories[0]?.models.length ?? 0}</span>
              </button>
            ))}
          </div>
        }
      />

      <div className="api-summary arena-summary reveal">
        <div>
          <span>入榜模型</span>
          <strong>{category?.models.length ?? 0}</strong>
          <small>{board?.name ?? '暂无榜单'} · {category?.label ?? '—'}</small>
        </div>
        <div>
          <span>榜首</span>
          <strong className="summary-model">{topModel?.name ?? '—'}</strong>
          <small>{topModel?.vendor ?? '—'}</small>
        </div>
        <div>
          <span>{board?.metricLabel ?? '最高分'}</span>
          <strong>{topModel ? formatScore(topModel.score, metric) : '—'}</strong>
          <small>95% CI {topModel ? formatCi(topModel.lower, topModel.upper, metric) : '—'}</small>
        </div>
        <div>
          <span>榜期</span>
          <strong className="summary-date">{category?.date || '—'}</strong>
          <small>
            {topModel?.votes !== null && topModel?.votes !== undefined
              ? `${formatVotes(topModel.votes)} ${metric === 'ips' ? '次观测' : '票'}`
              : '社区盲测'}
          </small>
        </div>
      </div>

      <div className="toolbar reveal">
        <label className="select-field">
          <span>分类</span>
          <select
            value={category?.id ?? ''}
            onChange={(event) => setCategoryId(event.target.value)}
            aria-label="选择 LMArena 分类"
          >
            {(board?.categories ?? []).map((item) => (
              <option key={item.id} value={item.id}>{item.label}（{item.models.length}）</option>
            ))}
          </select>
        </label>
        <div className="segmented" role="group" aria-label="地区筛选">
          {(['all', 'domestic', 'global'] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={region === item ? 'is-active' : ''}
              onClick={() => setRegion(item)}
            >
              {item === 'all' ? '全部' : item === 'domestic' ? '国内' : '海外'}
            </button>
          ))}
        </div>
        <label className="search-field">
          <SearchIcon size={15} />
          <input
            type="search"
            value={query}
            placeholder="搜索模型、厂商或许可证…"
            onChange={(event) => setQuery(event.target.value)}
            aria-label="搜索 LMArena 模型"
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
        {hasFilters ? (
          <button type="button" className="text-button" onClick={resetFilters}>重置</button>
        ) : null}
      </div>

      <div className="table-shell reveal">
        <table className="data-table arena-table">
          <thead>
            <tr>
              <th className="col-rank">排名</th>
              <th>模型</th>
              <th className="col-score">{board?.metricLabel ?? '分数'}</th>
              <th className="col-ci">95% 置信区间</th>
              <th className="col-votes col-num">{metric === 'ips' ? '观测数' : '票数'}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((model) => (
              <tr key={`${model.name}-${model.rank ?? model.score}`}>
                <td className="col-rank">
                  <span className={`rank-number ${(model.rank ?? 99) <= 3 ? 'is-top' : ''}`}>{model.rank ?? '—'}</span>
                </td>
                <td>
                  <div className="model-cell">
                    <div className="model-title-row">
                      <span className="model-name">{model.name}</span>
                      {model.license && !/proprietary|other|unknown/i.test(model.license)
                        ? <span className="tag tag-open">开源</span>
                        : null}
                    </div>
                    <div className="model-sub">
                      <span className={`vendor-dot ${model.region}`} />
                      {model.vendor}
                      <span className="dot-sep">·</span>
                      {model.license || '未标注许可'}
                      <span className="dot-sep">·</span>
                      {model.region === 'domestic' ? '国内' : '海外'}
                    </div>
                  </div>
                </td>
                <td className="col-score"><span className="arena-score">{formatScore(model.score, metric)}</span></td>
                <td className="col-ci"><span className="arena-ci">{formatCi(model.lower, model.upper, metric)}</span></td>
                <td className="col-votes num">{formatVotes(model.votes)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!filtered.length ? (
          <div className="empty-state">
            <SearchIcon size={22} />
            <strong>没有符合条件的模型</strong>
            <span>换个分类、厂商或关键词试试。</span>
            <button type="button" className="button button-ghost" onClick={resetFilters}>清除筛选</button>
          </div>
        ) : null}
      </div>

      <div className="table-footer reveal">
        <div className="table-note">
          共 <strong>{filtered.length}</strong> 个模型 · 数据来自 LMArena（CC BY 4.0）
        </div>
        {limit < filtered.length ? (
          <button type="button" className="button button-ghost" onClick={() => setLimit((value) => value + 30)}>
            再加载 30 个
          </button>
        ) : null}
      </div>

      <p className="section-note reveal">
        Arena Score 来自社区盲测（Bradley-Terry），Agent 榜使用 IPS 分数；与上方总榜同源，这里的分类榜保留原始榜期、置信区间与票数。
        数据经 HuggingFace 镜像抓取，许可 CC BY 4.0。
        <a className="inline-link" href={data.source.url} target="_blank" rel="noreferrer">
          查看数据源 <ArrowUpRightIcon size={12} />
        </a>
      </p>
    </section>
  )
}

import { useEffect } from 'react'
import type { Metric, Selection } from '../lib/types'
import { formatContext, formatPrice, formatScore, metricDigits, metricLabel, regionLabel } from '../lib/format'
import { ArrowUpRightIcon, CloseIcon } from './Icons'

interface ModelDrawerProps {
  selection: Selection
  fx: number
  scoreMax: Record<Metric, number>
  onClose: () => void
}

export function ModelDrawer({ selection, fx, scoreMax, onClose }: ModelDrawerProps) {
  useEffect(() => {
    if (!selection) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [selection, onClose])

  if (!selection) return null
  const model = selection.model
  const isRanked = selection.kind === 'ranked'
  const ranks = selection.kind === 'ranked'
    ? {
        intelligence: selection.model.rank_intelligence ?? null,
        coding: selection.model.rank_coding ?? null,
        agentic: selection.model.rank_agentic ?? null,
      }
    : {
        intelligence: selection.model.arenaRankIntelligence,
        coding: selection.model.arenaRankCoding,
        agentic: selection.model.arenaRankAgentic,
      }
  const modalities = selection.kind === 'api' ? selection.model.modalities : null
  const tools = selection.kind === 'api' ? selection.model.tools : null
  const reasoning = selection.kind === 'api' ? selection.model.reasoning : null
  const maxOutput = selection.kind === 'api' ? selection.model.maxOutput : model.maxOutput
  const arenaName = selection.kind === 'api' ? selection.model.arenaName : null
  const priceMeta = selection.kind === 'api'
    ? selection.model.provider
    : (selection.model.apiId ? 'LiteLLM' : '未匹配到报价')
  const id = selection.kind === 'api' ? selection.model.id : selection.model.apiId
  const priceUrl = selection.kind === 'ranked'
    ? (selection.model.apiId ? selection.model.url : null)
    : selection.model.url

  return (
    <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <aside className="model-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <div className="drawer-head">
          <div>
            <div className="drawer-kicker">
              <span className={`region-chip ${model.region}`}>{regionLabel(model.region)}</span>
              <span>{model.vendor}</span>
              {model.openWeights ? <span className="tag tag-open">开源</span> : null}
            </div>
            <h2 id="drawer-title">{model.name}</h2>
            {arenaName && arenaName !== model.name ? <p className="drawer-subtitle">LMArena 名称：{arenaName}</p> : null}
            {id ? <p className="drawer-id">{id}</p> : null}
          </div>
          <button type="button" className="icon-button drawer-close" onClick={onClose} aria-label="关闭详情" autoFocus>
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="drawer-scores">
          {(['intelligence', 'coding', 'agentic'] as const).map((key) => {
            const value = model[key]
            return (
              <div className="drawer-score-card" key={key}>
                <span>{metricLabel[key]}</span>
                <strong>{formatScore(value, metricDigits(key))}</strong>
                <small>{ranks[key] ? `全球 #${ranks[key]}` : '暂无排名'}</small>
                <div className="drawer-meter">
                  <i style={{ width: `${typeof value === 'number' ? Math.max(0, Math.min(100, (value / scoreMax[key]) * 100)) : 0}%` }} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="drawer-section">
          <div className="drawer-section-head">
            <h3>API 定价</h3>
            <span>USD / 1M tokens</span>
          </div>
          <div className="drawer-price-grid">
            <div><span>输入</span><strong>{formatPrice(model.input)}</strong><small>≈ {formatPrice(model.input, { currency: 'CNY', fx })}</small></div>
            <div><span>输出</span><strong>{formatPrice(model.output)}</strong><small>≈ {formatPrice(model.output, { currency: 'CNY', fx })}</small></div>
            <div><span>缓存读</span><strong>{formatPrice(model.cacheRead)}</strong><small>≈ {formatPrice(model.cacheRead, { currency: 'CNY', fx })}</small></div>
            <div><span>缓存写</span><strong>{formatPrice(model.cacheWrite)}</strong><small>≈ {formatPrice(model.cacheWrite, { currency: 'CNY', fx })}</small></div>
          </div>
          <p className="drawer-hint">混合价格 {formatPrice(model.blended)} / 1M，按输入 3 : 输出 1 加权。</p>
        </div>

        <div className="drawer-section">
          <div className="drawer-section-head"><h3>模型参数</h3></div>
          <dl className="drawer-specs">
            <div><dt>上下文窗口</dt><dd>{formatContext(model.context)} tokens</dd></div>
            <div><dt>最大输出</dt><dd>{maxOutput ? `${formatContext(maxOutput)} tokens` : '—'}</dd></div>
            <div><dt>开源权重</dt><dd>{model.openWeights ? '是' : model.openWeights === false ? '否' : '未知'}</dd></div>
            <div><dt>工具调用</dt><dd>{tools === null ? '以 API 目录为准' : tools ? '支持' : '不支持'}</dd></div>
            <div><dt>推理模式</dt><dd>{reasoning === null ? '以 API 目录为准' : reasoning ? '支持' : '不支持'}</dd></div>
            <div><dt>输入 / 输出模态</dt><dd>{modalities || (isRanked ? '文本' : '—')}</dd></div>
            <div><dt>价格收录</dt><dd>{priceMeta}</dd></div>
          </dl>
        </div>

        <div className="drawer-footer">
          {priceUrl ? (
            <a className="button button-primary" href={priceUrl} target="_blank" rel="noreferrer">
              {isRanked ? '查看价格来源' : '查看官方定价'}
              <ArrowUpRightIcon size={15} />
            </a>
          ) : null}
          <a className={priceUrl ? 'button button-ghost' : 'button button-primary'} href="https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset" target="_blank" rel="noreferrer">
            LMArena 榜单
            <ArrowUpRightIcon size={15} />
          </a>
        </div>
        <p className="drawer-disclaimer">榜单分数与渠道价格会持续变化，采购或调用前请以官方页面为准。</p>
      </aside>
    </div>
  )
}

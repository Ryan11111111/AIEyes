import { useEffect, useMemo, useState } from 'react'
import type { Plan, Region } from '../lib/types'
import { formatNativePrice, planPriceCny } from '../lib/format'
import { ArrowUpRightIcon, GridIcon, ListIcon, SearchIcon } from './Icons'
import { SectionHeader } from './SectionHeader'

interface PlansProps {
  plans: Plan[]
  fx: number
  verifiedAt: string
}

type SortMode = 'featured' | 'price-asc' | 'price-desc'

function planHeadline(plan: Plan) {
  if (plan.fromPrice === 0 && plan.freeTier) {
    const paid = plan.tiers.filter((tier) => tier.price > 0).map((tier) => tier.price)
    return {
      main: '免费',
      suffix: paid.length ? `付费 ${formatNativePrice(Math.min(...paid), plan.currency)} 起` : '开放使用',
    }
  }
  return {
    main: formatNativePrice(plan.fromPrice, plan.currency),
    suffix: '/月起',
  }
}

function PlanCard({ plan, fx, index }: { plan: Plan; fx: number; index: number }) {
  const headline = planHeadline(plan)
  const secondary = plan.freeTier && plan.fromPrice === 0
    ? '含免费档'
    : plan.currency === 'CNY'
      ? `≈ ${formatNativePrice(plan.fromPrice / fx, 'USD')}`
      : `≈ ${formatNativePrice(plan.fromPrice * fx, 'CNY')}`
  const tiers = plan.tiers.slice(0, 3)
  const moreTiers = plan.tiers.length - tiers.length
  const models = plan.models.slice(0, 2)

  return (
    <article className={`plan-card ${plan.region}`}>
      <div className="plan-top">
        <div className="plan-vendor">
          <span className={`vendor-avatar ${plan.region}`}>{plan.vendor.slice(0, 1)}</span>
          <div>
            <strong>{plan.vendor}</strong>
            <span>{plan.vendorType}</span>
          </div>
        </div>
        <span className={`region-chip ${plan.region}`}>{plan.region === 'domestic' ? '国内' : '海外'}</span>
      </div>

      <div className="plan-title">
        <span className="plan-index">{String(index + 1).padStart(2, '0')}</span>
        <h3>{plan.product}</h3>
        {plan.badge ? <span className="plan-badge">{plan.badge}</span> : null}
      </div>
      <p className="plan-tagline">{plan.tagline}</p>

      <div className="plan-price-row">
        <div className="plan-price">
          <strong>{headline.main}</strong>
          <span>{headline.suffix}</span>
        </div>
        <div className="plan-price-alt">{secondary}<small>按当前汇率</small></div>
      </div>

      <div className="tier-chips">
        {tiers.map((tier) => (
          <span className="tier-chip" key={tier.name}>
            <span>{tier.name}</span>
            {tier.name.toLowerCase() !== 'free' ? (
              <b>{tier.price === 0 ? (plan.currency === 'CNY' ? '¥0' : '$0') : formatNativePrice(tier.price, plan.currency)}</b>
            ) : null}
          </span>
        ))}
        {moreTiers > 0 ? <span className="tier-more">+{moreTiers}</span> : null}
      </div>

      <ul className="plan-features">
        {plan.features.slice(0, 3).map((feature) => <li key={feature}>{feature}</li>)}
      </ul>

      <div className="plan-models">
        {models.map((model) => <span key={model}>{model}</span>)}
        {plan.models.length > models.length ? <span>+{plan.models.length - models.length}</span> : null}
      </div>

      <div className="plan-foot">
        <span className="verified">核对 {plan.verifiedAt.slice(5).replace('-', '/')}</span>
        <a href={plan.url} target="_blank" rel="noreferrer">
          官方定价 <ArrowUpRightIcon size={13} />
        </a>
      </div>
      {plan.note ? <p className="plan-note">{plan.note}</p> : null}
    </article>
  )
}

export function Plans({ plans, fx, verifiedAt }: PlansProps) {
  const [region, setRegion] = useState<'all' | Region>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortMode>('featured')
  const [view, setView] = useState<'cards' | 'table'>('cards')
  const [showAll, setShowAll] = useState(false)

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const list = plans
      .filter((plan) => (region === 'all' ? true : plan.region === region))
      .filter((plan) => {
        if (!normalized) return true
        return `${plan.product} ${plan.vendor} ${plan.models.join(' ')} ${plan.tagline}`.toLowerCase().includes(normalized)
      })
    if (sort === 'price-asc') return [...list].sort((a, b) => planPriceCny(a, fx) - planPriceCny(b, fx))
    if (sort === 'price-desc') return [...list].sort((a, b) => planPriceCny(b, fx) - planPriceCny(a, fx))
    return list
  }, [plans, region, query, sort, fx])

  useEffect(() => {
    setShowAll(false)
  }, [region, query, sort, view])

  const totalTiers = plans.reduce((sum, plan) => sum + plan.tiers.length, 0)
  const cheapestDomestic = [...plans]
    .filter((plan) => plan.region === 'domestic' && plan.fromPrice > 0)
    .sort((a, b) => planPriceCny(a, fx) - planPriceCny(b, fx))[0]
  const cheapestGlobal = [...plans]
    .filter((plan) => plan.region === 'global' && plan.fromPrice > 0)
    .sort((a, b) => planPriceCny(a, fx) - planPriceCny(b, fx))[0]
  const visibleCards = showAll ? filtered : filtered.slice(0, 9)
  const visibleRows = showAll ? filtered : filtered.slice(0, 14)
  const hasMore = view === 'cards' ? filtered.length > visibleCards.length : filtered.length > visibleRows.length

  return (
    <section className="section" id="plans">
      <SectionHeader
        index="03"
        eyebrow="AI CODING PLANS"
        title="Coding 套餐价格盘"
        description="从官方与公开渠道核对国内外主流 AI 编程订阅，统一换算成月付与人民币参考价。免费档、促销价和额度限制分开标注。"
        actions={
          <div className="view-switch" role="group" aria-label="套餐视图">
            <button type="button" className={view === 'cards' ? 'is-active' : ''} onClick={() => setView('cards')} aria-label="卡片视图">
              <GridIcon size={15} /> 卡片
            </button>
            <button type="button" className={view === 'table' ? 'is-active' : ''} onClick={() => setView('table')} aria-label="表格视图">
              <ListIcon size={15} /> 表格
            </button>
          </div>
        }
      />

      <div className="plan-summary reveal">
        <div>
          <span>收录产品</span>
          <strong>{plans.length}</strong>
          <small>{totalTiers} 个订阅档位</small>
        </div>
        <div>
          <span>国内入门档</span>
          <strong>{cheapestDomestic ? formatNativePrice(cheapestDomestic.fromPrice, cheapestDomestic.currency) : '—'}</strong>
          <small>{cheapestDomestic?.product || '暂无'}</small>
        </div>
        <div>
          <span>海外入门档</span>
          <strong>{cheapestGlobal ? formatNativePrice(cheapestGlobal.fromPrice, cheapestGlobal.currency) : '—'}</strong>
          <small>{cheapestGlobal?.product || '暂无'}</small>
        </div>
        <div>
          <span>价格核对</span>
          <strong className="summary-date">{verifiedAt.slice(5).replace('-', '/')}</strong>
          <small>以官方页面为准</small>
        </div>
      </div>

      <div className="toolbar reveal">
        <div className="segmented" role="group" aria-label="套餐地区筛选">
          {(['all', 'domestic', 'global'] as const).map((item) => (
            <button key={item} type="button" className={region === item ? 'is-active' : ''} onClick={() => setRegion(item)}>
              {item === 'all' ? '全部' : item === 'domestic' ? '国内' : '海外'}
            </button>
          ))}
        </div>
        <label className="search-field">
          <SearchIcon size={15} />
          <input
            type="search"
            value={query}
            placeholder="搜索产品、厂商或模型…"
            onChange={(event) => setQuery(event.target.value)}
            aria-label="搜索套餐"
          />
          {query ? <button type="button" className="search-clear" onClick={() => setQuery('')} aria-label="清空搜索">×</button> : null}
        </label>
        <label className="select-field">
          <span>排序</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} aria-label="套餐排序">
            <option value="featured">精选排序</option>
            <option value="price-asc">价格从低到高</option>
            <option value="price-desc">价格从高到低</option>
          </select>
        </label>
        <span className="toolbar-note">个人月付 · 不含税</span>
      </div>

      {view === 'cards' ? (
        <div className="plan-grid">
          {visibleCards.map((plan, index) => (
            <PlanCard key={plan.id} plan={plan} fx={fx} index={index} />
          ))}
        </div>
      ) : (
        <div className="table-shell">
          <table className="data-table plans-table">
            <thead>
              <tr>
                <th>平台 / 产品</th>
                <th>地区</th>
                <th>起价</th>
                <th>档位</th>
                <th>代表模型</th>
                <th className="col-context col-num">核对</th>
                <th className="col-action"><span className="sr-only">官网</span></th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((plan) => {
                const headline = planHeadline(plan)
                return (
                  <tr key={plan.id}>
                    <td>
                      <div className="model-cell">
                        <span className="model-name">{plan.product}</span>
                        <span className="model-sub">{plan.vendor} · {plan.vendorType}</span>
                      </div>
                    </td>
                    <td><span className={`region-chip ${plan.region}`}>{plan.region === 'domestic' ? '国内' : '海外'}</span></td>
                    <td>
                      <div className="table-price">
                        <strong>{headline.main}</strong>
                        <span>{headline.suffix}</span>
                      </div>
                    </td>
                    <td className="tier-cell">{plan.tiers.map((tier) => tier.name.toLowerCase() === 'free' ? tier.name : `${tier.name} ${tier.price === 0 ? (plan.currency === 'CNY' ? '¥0' : '$0') : formatNativePrice(tier.price, plan.currency)}`).join(' · ')}</td>
                    <td className="model-tags-cell">{plan.models.slice(0, 3).map((model) => <span key={model}>{model}</span>)}</td>
                    <td className="col-context num">{plan.verifiedAt.slice(5)}</td>
                    <td className="col-action">
                      <a href={plan.url} target="_blank" rel="noreferrer" aria-label={`打开 ${plan.product} 官方定价`}>
                        <ArrowUpRightIcon size={15} />
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!filtered.length ? (
        <div className="empty-state">
          <SearchIcon size={22} />
          <strong>没有匹配的套餐</strong>
          <span>试试清空搜索或切换地区。</span>
          <button type="button" className="button button-ghost" onClick={() => { setQuery(''); setRegion('all') }}>清除筛选</button>
        </div>
      ) : null}

      <div className="table-footer reveal">
        <div className="table-note">
          {filtered.length} 个产品 · 价格单位随产品标注 · 年付/连续包月优惠写入备注
        </div>
        {hasMore ? (
          <button type="button" className="button button-ghost" onClick={() => setShowAll(true)}>
            展开全部 {filtered.length} 个
          </button>
        ) : showAll && filtered.length > (view === 'cards' ? 9 : 14) ? (
          <button type="button" className="text-button" onClick={() => setShowAll(false)}>收起</button>
        ) : null}
      </div>

      <p className="section-note reveal">
        套餐权益与额度由人工按官方页面及公开横评核对，存在时滞；促销价、首月价可能随时结束。购买前请点击“官方定价”确认最新条款。
      </p>
    </section>
  )
}

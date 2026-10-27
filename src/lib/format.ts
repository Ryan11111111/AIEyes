import type { Metric, Region } from './types'

export const regionLabel = (region: Region): string => (region === 'domestic' ? '国内' : '海外')

export const metricLabel: Record<Metric, string> = {
  intelligence: '文本竞技场',
  coding: '代码竞技场',
  agentic: 'Agent 竞技场',
}

export const metricShortLabel: Record<Metric, string> = {
  intelligence: '文本',
  coding: '代码',
  agentic: 'Agent',
}

export const metricField: Record<Metric, 'intelligence' | 'coding' | 'agentic'> = {
  intelligence: 'intelligence',
  coding: 'coding',
  agentic: 'agentic',
}

export const rankField: Record<Metric, 'rank_intelligence' | 'rank_coding' | 'rank_agentic'> = {
  intelligence: 'rank_intelligence',
  coding: 'rank_coding',
  agentic: 'rank_agentic',
}

export function formatPrice(value: number | null | undefined, options: { currency?: 'USD' | 'CNY'; fx?: number; compact?: boolean } = {}): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  if (value === 0) return 'Free'
  const { currency = 'USD', fx = 7, compact = false } = options
  const converted = currency === 'CNY' ? value * fx : value
  return formatMoneyValue(converted, currency, compact)
}

export function formatNativePrice(value: number | null | undefined, currency: 'USD' | 'CNY' = 'USD'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  if (value === 0) return 'Free'
  const formatted = formatMoneyValue(value, currency, false)
  return formatted.includes('.') ? formatted.replace(/0+$/, '').replace(/\.$/, '') : formatted
}

function formatMoneyValue(converted: number, currency: 'USD' | 'CNY', compact: boolean): string {
  const symbol = currency === 'CNY' ? '¥' : '$'
  if (compact && converted >= 1000) return `${symbol}${(converted / 1000).toFixed(1)}k`
  if (converted >= 1) return `${symbol}${converted.toFixed(2)}`
  if (converted >= 0.1) return `${symbol}${converted.toFixed(3)}`
  return `${symbol}${converted.toFixed(4)}`
}

export function formatScore(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return value.toFixed(digits)
}

export function metricDigits(metric: Metric): number {
  return metric === 'agentic' ? 3 : 1
}

export function formatContext(value: number | null | undefined): string {
  if (!value) return '—'
  if (value >= 1_000_000) {
    const millions = value / 1_000_000
    return `${Number.isInteger(millions) ? millions.toFixed(0) : millions.toFixed(1)}M`
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`
  return String(value)
}

export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function formatTimestamp(iso: string | null | undefined, options: { withYear?: boolean; withTime?: boolean } = {}): string {
  if (!iso) return '—'
  const { withYear = false, withTime = true } = options
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: withYear ? 'numeric' : undefined,
    month: '2-digit',
    day: '2-digit',
    hour: withTime ? '2-digit' : undefined,
    minute: withTime ? '2-digit' : undefined,
    hour12: false,
  }).format(date)
}

export function formatFx(rate: number | null | undefined): string {
  if (!rate) return '—'
  return rate.toFixed(4)
}

export function formatPlanPrice(plan: { currency: 'USD' | 'CNY'; fromPrice: number }, fx: number) {
  const primary = plan.currency === 'CNY'
    ? formatPrice(plan.fromPrice, { currency: 'CNY' })
    : formatPrice(plan.fromPrice, { currency: 'USD' })
  const secondary = plan.currency === 'CNY'
    ? formatPrice(plan.fromPrice / fx, { currency: 'USD' })
    : formatPrice(plan.fromPrice * fx, { currency: 'CNY' })
  return { primary, secondary }
}

export function planPriceCny(plan: { currency: 'USD' | 'CNY'; fromPrice: number }, fx: number): number {
  return plan.currency === 'CNY' ? plan.fromPrice : plan.fromPrice * fx
}

export function scorePercent(value: number | null, max: number): number {
  if (value === null || max <= 0) return 0
  return Math.max(3, Math.min(100, (value / max) * 100))
}

export function relativeStatus(status: string): { label: string; tone: 'ok' | 'warn' | 'error' } {
  if (status === 'ok' || status === 'curated') return { label: status === 'curated' ? '人工核对' : '在线', tone: 'ok' }
  if (status === 'cached') return { label: '缓存', tone: 'warn' }
  if (status === 'fallback') return { label: '备用源', tone: 'warn' }
  return { label: '异常', tone: 'error' }
}

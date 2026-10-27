import { useMemo, useState } from 'react'
import type { Metric, RankedModel } from '../lib/types'
import { formatPrice, formatScore, metricDigits, metricLabel, metricShortLabel, rankField } from '../lib/format'
import { ArrowUpRightIcon } from './Icons'
import { SectionHeader } from './SectionHeader'

interface ValueChartProps {
  models: RankedModel[]
  onSelect: (model: RankedModel) => void
}

interface ChartPoint {
  model: RankedModel
  score: number
  price: number
  x: number
  y: number
}

const WIDTH = 900
const HEIGHT = 430
const PAD = { left: 54, right: 28, top: 28, bottom: 54 }
const metrics: Metric[] = ['intelligence', 'coding', 'agentic']

function axisPrice(value: number): string {
  if (value >= 10) return `$${value.toFixed(0)}`
  if (value >= 1) return `$${value.toFixed(1)}`
  if (value >= 0.1) return `$${value.toFixed(2)}`
  return `$${value.toFixed(3)}`
}

export function ValueChart({ models, onSelect }: ValueChartProps) {
  const [metric, setMetric] = useState<Metric>('intelligence')
  const [hovered, setHovered] = useState<ChartPoint | null>(null)

  const allPoints = useMemo(() => {
    return models
      .filter((model) => typeof model[metric] === 'number' && model.blended !== null)
      .map((model) => ({
        model,
        score: model[metric] as number,
        price: Math.max(model.blended as number, 0.005),
      }))
      .sort((a, b) => b.score - a.score)
  }, [models, metric])

  const points = useMemo(() => allPoints.slice(0, 80), [allPoints])

  const bounds = useMemo(() => {
    if (!points.length) {
      return { xMin: 0.01, xMax: 100, yMin: 0, yMax: 100, ticksX: [0.01, 0.1, 1, 10, 100] }
    }
    const prices = points.map((point) => point.price)
    const scores = points.map((point) => point.score)
    const xMin = Math.max(0.002, Math.min(...prices) * 0.72)
    const xMax = Math.max(0.01, Math.max(...prices) * 1.35)
    const scoreMin = Math.min(...scores)
    const scoreMax = Math.max(...scores)
    const padding = Math.max((scoreMax - scoreMin) * 0.06, metric === 'agentic' ? 0.01 : 1)
    const yMin = scoreMin - padding
    const yMax = scoreMax + padding
    const baseTicks = [0.003, 0.01, 0.03, 0.1, 0.3, 1, 3, 10, 30, 100, 300, 1000]
    const ticksX = baseTicks.filter((tick) => tick >= xMin && tick <= xMax)
    return { xMin, xMax, yMin, yMax, ticksX: ticksX.length > 1 ? ticksX : [xMin, xMax] }
  }, [points, metric])

  const plotWidth = WIDTH - PAD.left - PAD.right
  const plotHeight = HEIGHT - PAD.top - PAD.bottom
  const logMin = Math.log10(bounds.xMin)
  const logMax = Math.log10(bounds.xMax)
  const xScale = (price: number) => PAD.left + ((Math.log10(price) - logMin) / (logMax - logMin)) * plotWidth
  const yScale = (score: number) => PAD.top + (1 - (score - bounds.yMin) / (bounds.yMax - bounds.yMin)) * plotHeight

  const chartPoints: ChartPoint[] = points.map((point) => ({
    ...point,
    x: xScale(point.price),
    y: yScale(point.score),
  }))

  const yTicks = useMemo(() => {
    const count = 5
    return Array.from({ length: count }, (_, index) => bounds.yMin + ((bounds.yMax - bounds.yMin) * index) / (count - 1))
  }, [bounds])

  const yDigits = bounds.yMax - bounds.yMin < 5 ? 3 : 0

  const valuePicks = useMemo(() => {
    const cutoff = (allPoints[0]?.score ?? 0) * 0.7
    return allPoints
      .filter((point) => point.score >= cutoff)
      .map((point) => ({ ...point, value: point.score / Math.sqrt(point.price) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [allPoints])

  const labels = useMemo(() => {
    const selected: ChartPoint[] = []
    for (const point of chartPoints.slice(0, 10)) {
      if (selected.every((other) => Math.hypot(other.x - point.x, other.y - point.y) > 92)) {
        selected.push(point)
      }
      if (selected.length >= 4) break
    }
    return selected
  }, [chartPoints])

  return (
    <section className="section" id="compare">
      <SectionHeader
        index="02"
        eyebrow="ARENA SCORE × PRICE"
        title="能力与价格象限"
        description="横轴是混合价格，纵轴是所选竞技场分数。越靠左上，代表同样的钱能买到更强的能力。用同一把尺子，找到真正的性价比前沿。"
        actions={
          <div className="metric-tabs" role="tablist" aria-label="象限指标">
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
              </button>
            ))}
          </div>
        }
      />

      <div className="compare-grid">
        <div className="chart-card reveal">
          <div className="chart-head">
            <div>
              <span className="card-kicker">SCATTER / {metricShortLabel[metric].toUpperCase()}</span>
              <strong>{points.length} 个模型进入样本</strong>
            </div>
            <div className="chart-legend">
              <span><i className="legend-dot domestic" />国内</span>
              <span><i className="legend-dot global" />海外</span>
              <span className="legend-note">气泡越靠左上越划算</span>
            </div>
          </div>

          <div className="chart-wrap">
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="scatter-svg"
              role="img"
              aria-label={`${metricLabel[metric]}与混合价格散点图`}
            >
              {yTicks.map((tick) => (
                <g key={tick}>
                  <line x1={PAD.left} x2={WIDTH - PAD.right} y1={yScale(tick)} y2={yScale(tick)} className="chart-grid" />
                  <text x={PAD.left - 10} y={yScale(tick) + 3} textAnchor="end" className="chart-axis-text">
                    {tick.toFixed(yDigits)}
                  </text>
                </g>
              ))}
              {bounds.ticksX.map((tick) => (
                <g key={tick}>
                  <line x1={xScale(tick)} x2={xScale(tick)} y1={PAD.top} y2={HEIGHT - PAD.bottom} className="chart-grid chart-grid-vertical" />
                  <text x={xScale(tick)} y={HEIGHT - PAD.bottom + 20} textAnchor="middle" className="chart-axis-text">
                    {axisPrice(tick)}
                  </text>
                </g>
              ))}
              <text x={PAD.left} y={17} className="chart-axis-label">{metricLabel[metric]}</text>
              <text x={WIDTH - PAD.right} y={HEIGHT - 12} textAnchor="end" className="chart-axis-label">
                混合价格 $ / 1M tokens
              </text>

              <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={HEIGHT - PAD.bottom} className="chart-axis-line" />
              <line x1={PAD.left} x2={WIDTH - PAD.right} y1={HEIGHT - PAD.bottom} y2={HEIGHT - PAD.bottom} className="chart-axis-line" />

              {chartPoints.map((point) => (
                <g
                  key={`${point.model.vendor}-${point.model.name}`}
                  className={`scatter-point ${point.model.region} ${(point.model[rankField[metric]] ?? 99) <= 3 ? 'is-top' : ''}`}
                  onMouseEnter={() => setHovered(point)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onSelect(point.model)}
                >
                  <circle cx={point.x} cy={point.y} r={(point.model[rankField[metric]] ?? 99) <= 3 ? 7 : 4.5} className="scatter-dot" />
                  <circle cx={point.x} cy={point.y} r={13} className="scatter-hit" />
                </g>
              ))}

              {labels.map((point, index) => (
                <text
                  key={`label-${point.model.name}`}
                  x={point.x + 10 > WIDTH - 160 ? point.x - 10 : point.x + 10}
                  y={index % 2 === 0 ? point.y - 9 : point.y + 17}
                  textAnchor={point.x + 10 > WIDTH - 160 ? 'end' : 'start'}
                  className="scatter-label"
                >
                  {point.model.name}
                </text>
              ))}
            </svg>

            {hovered ? (
              <div
                className={`chart-tooltip ${hovered.x > WIDTH * 0.68 ? 'align-right' : ''}`}
                style={{ left: `${(hovered.x / WIDTH) * 100}%`, top: `${(hovered.y / HEIGHT) * 100}%` }}
              >
                <span className="tooltip-vendor">{hovered.model.vendor} · {hovered.model.region === 'domestic' ? '国内' : '海外'}</span>
                <strong>{hovered.model.name}</strong>
                <div className="tooltip-stats">
                  <span>{metricLabel[metric]} <b>{formatScore(hovered.score, metricDigits(metric))}</b></span>
                  <span>混合价 <b>{formatPrice(hovered.price)}</b></span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="chart-foot">
            <span>价格 = (输入 × 3 + 输出) / 4</span>
            <span>对数横轴 · 美元 / 100 万 tokens</span>
            <span>分数范围 {bounds.yMin.toFixed(yDigits)}–{bounds.yMax.toFixed(yDigits)}</span>
          </div>
        </div>

        <aside className="value-board reveal">
          <div className="value-board-head">
            <span className="card-kicker">VALUE FRONTIER</span>
            <h3>性价比前沿</h3>
            <p>用能力分除以价格平方根排序，过滤掉“贵但不够强”的选项。</p>
          </div>
          <div className="value-list">
            {valuePicks.map((point, index) => (
              <button
                key={point.model.name}
                type="button"
                className="value-item"
                onClick={() => onSelect(point.model)}
              >
                <span className="value-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="value-copy">
                  <strong>{point.model.name}</strong>
                  <span>{point.model.vendor} · {formatPrice(point.price)}<small>/1M</small></span>
                </span>
                <span className="value-score">
                  {formatScore(point.score, metricDigits(metric))}
                  <small>{metricShortLabel[metric]}</small>
                </span>
                <ArrowUpRightIcon size={14} />
              </button>
            ))}
          </div>
          <div className="value-board-foot">
            <div className="mini-meter">
              <span>图中样本</span>
              <div><i style={{ width: `${allPoints.length ? Math.min(100, (points.length / allPoints.length) * 100) : 0}%` }} /></div>
              <strong>{points.length} / {allPoints.length}</strong>
            </div>
            <p>已过滤掉没有价格或没有分数的模型；点击任意气泡查看完整指标。</p>
          </div>
        </aside>
      </div>
    </section>
  )
}

import type { PelicanData } from '../lib/types'
import { ArrowUpRightIcon, SparkIcon } from './Icons'
import { SectionHeader } from './SectionHeader'

interface PelicanBenchProps {
  data: PelicanData
}

function formatRate(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

function formatReward(value: number): string {
  return value.toFixed(3)
}

export function PelicanBench({ data }: PelicanBenchProps) {
  const samples = data.models.reduce((sum, model) => sum + model.samples, 0)
  const strongest = data.models[0]

  return (
    <section className="section" id="pelican">
      <SectionHeader
        index="06"
        eyebrow="PELICAN BENCHMARK"
        title="鹈鹕测试 · 专项观察"
        description="同一道「鹈鹕骑自行车」SVG 题，7 个前沿模型各跑约 20 次。看结构检查、视觉裁判，以及一个更有意思的指标：盲评能不能认出这是一只鹈鹕。"
        actions={
          <div className="pelican-actions">
            <a className="button button-ghost" href={data.source.url} target="_blank" rel="noreferrer">
              查看数据集 <ArrowUpRightIcon size={14} />
            </a>
            {data.jetty?.updated ? (
              <a className="button button-ghost" href="https://evaljetty.com/pelicans/" target="_blank" rel="noreferrer">
                Jetty 最新榜 · {data.jetty.updated} <ArrowUpRightIcon size={14} />
              </a>
            ) : null}
          </div>
        }
      />

      <div className="api-summary pelican-summary reveal">
        <div>
          <span>样本数</span>
          <strong>{samples}</strong>
          <small>{data.models.length} 个模型 · 每模型最多 20 次</small>
        </div>
        <div>
          <span>平均 reward 最高</span>
          <strong className="summary-model">{strongest?.displayName ?? '—'}</strong>
          <small>{strongest ? formatReward(strongest.meanReward) : '—'} / 1.000</small>
        </div>
        <div>
          <span>reward 中位数</span>
          <strong>{formatReward(data.coverage.medianReward)}</strong>
          <small>区间 {formatReward(data.coverage.minReward)} – {formatReward(data.coverage.maxReward)}</small>
        </div>
        <div>
          <span>盲评直接认成鹈鹕</span>
          <strong>{formatRate(data.coverage.pelicanRate)}</strong>
          <small>其余常被认成鹳、鸭或鹅</small>
        </div>
      </div>

      <div className="pelican-insight reveal">
        <div className="pelican-insight-number">
          <strong>{formatRate(data.coverage.pelicanRate)}</strong>
          <span>被直接认成鹈鹕</span>
        </div>
        <div className="pelican-insight-copy">
          <span className="card-kicker">WHAT THE JUDGE SAW</span>
          <p>{data.insight}</p>
          <p className="method-small">
            视觉裁判只看图、不告诉它题目，再让它描述画的是什么。这个盲评列比“像不像”更能暴露模型对物种特征的把握。
          </p>
        </div>
      </div>

      <div className="table-shell reveal">
        <table className="data-table pelican-table">
          <thead>
            <tr>
              <th>模型</th>
              <th>类型</th>
              <th className="col-score">平均 reward</th>
              <th className="col-num">结构分</th>
              <th className="col-num">语义分</th>
              <th className="col-num">满分样本</th>
              <th className="col-num">盲评认成鹈鹕</th>
              <th>常见误判</th>
            </tr>
          </thead>
          <tbody>
            {data.models.map((model) => (
              <tr key={model.model}>
                <td><span className="model-name" title={model.model}>{model.displayName}</span></td>
                <td>
                  <span className={`tag ${model.access === 'open' ? 'tag-open' : 'tag-free'}`}>
                    {model.access === 'open' ? '开源' : '闭源'}
                  </span>
                </td>
                <td className="col-score">
                  <div className="pelican-reward">
                    <span>{formatReward(model.meanReward)}</span>
                    <span className="pelican-bar">
                      <i style={{ width: `${Math.max(2, model.meanReward * 100)}%` }} />
                    </span>
                  </div>
                </td>
                <td className="num">{formatReward(model.structure)}</td>
                <td className="num">{formatReward(model.semantic)}</td>
                <td className="num">{model.perfect}/{model.samples}</td>
                <td className="num">{formatRate(model.pelicanRate)}</td>
                <td className="pelican-alt">
                  {model.topAlt ? `${model.topAlt} ×${model.topAltCount}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!data.models.length ? (
          <div className="empty-state">
            <SparkIcon size={22} />
            <strong>鹈鹕数据暂不可用</strong>
            <span>刷新数据后会自动恢复；也可以直接查看下方外链。</span>
          </div>
        ) : null}
      </div>

      <div className="pelican-links reveal">
        {data.links.map((link) => (
          <a className="pelican-link" key={link.url} href={link.url} target="_blank" rel="noreferrer">
            <span>
              <strong>{link.name}</strong>
              <small>{link.note}</small>
            </span>
            <ArrowUpRightIcon size={14} />
          </a>
        ))}
      </div>

      <p className="section-note reveal">
        评分口径：{data.scoring} “盲评认成鹈鹕”按视觉裁判的盲评 caption 统计。数据快照：{data.publishedAt || '未标注'}（HuggingFace 上游最后一次更新），许可 {data.source.license}。
        {data.jetty?.updated ? ` 更近的独立评测：Jetty 榜更新至 ${data.jetty.updated}，详见下方外链；两者口径不同，不混排。` : ''}
        鹈鹕测试与模型综合能力的相关性较弱，本页只做专项观察，不进入综合排名；Jetty 与 TeamoRouter 仅提供外链，未抓取其评分明细。
      </p>
    </section>
  )
}

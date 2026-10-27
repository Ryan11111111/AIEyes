import type { Meta } from '../lib/types'
import { formatTimestamp, relativeStatus } from '../lib/format'
import { ArrowUpRightIcon, DatabaseIcon, RefreshIcon, TerminalIcon } from './Icons'
import { SectionHeader } from './SectionHeader'

interface SourcesProps {
  meta: Meta
}

export function Sources({ meta }: SourcesProps) {
  const online = meta.sources.filter((source) => relativeStatus(source.status).tone === 'ok').length

  return (
    <section className="section" id="sources">
      <SectionHeader
        index="07"
        eyebrow="METHODOLOGY & SOURCES"
        title="数据与方法"
        description="每个数字都有出处。LMArena、LiteLLM、Frankfurter / ECB、鹈鹕数据集与人工核对套餐分别标注许可与状态，自动抓取与人工核对严格分开。"
        actions={
          <span className="source-health">
            <span className="live-dot" /> {online}/{meta.sources.length} 源在线
          </span>
        }
      />

      <div className="method-grid">
        <article className="method-card reveal">
          <span className="method-icon"><DatabaseIcon size={18} /></span>
          <span className="card-kicker">RANKING</span>
          <h3>排名口径</h3>
          <p>
            文本、代码、Agent 三个维度分别取 LMArena 对应竞技场总榜。同一模型多推理档位取最高分，
            名次按去重后的模型重排；分类榜保留原始榜期、置信区间与票数。
          </p>
          <ul>
            <li>文本竞技场：通用对话、知识、数学等综合盲测</li>
            <li>代码竞技场：前端生成与网页开发</li>
            <li>Agent 竞技场：基于真实会话信号的 IPS 分数</li>
            <li>LMArena 数据许可：CC BY 4.0，需署名并注明修改</li>
          </ul>
        </article>

        <article className="method-card reveal">
          <span className="method-icon"><TerminalIcon size={18} /></span>
          <span className="card-kicker">PRICING</span>
          <h3>价格口径</h3>
          <p>
            API 标价来自 LiteLLM 开放价格库，单位为美元 / 100 万 tokens。LiteLLM 汇总厂商直营与托管渠道报价；
            本页按模型去重，优先采用厂商直营价。
          </p>
          <div className="formula">混合价 = (输入 × 3 + 输出) ÷ 4</div>
          <p className="method-small">Coding 套餐为人工核对的个人月付标准价，人民币与美元按 Frankfurter / ECB 参考汇率互算，促销价单独标注。</p>
        </article>

        <article className="method-card reveal">
          <span className="method-icon"><RefreshIcon size={18} /></span>
          <span className="card-kicker">SNAPSHOT</span>
          <h3>数据快照与刷新</h3>
          <p>
            运行 <code className="inline-code">npm run refresh</code> 手动生成 JSON 快照；抓取失败时自动回退到最近一次成功缓存。
            GitHub 请求可通过 <code className="inline-code">GITHUB_TOKEN</code> 提高限额，token 只发送给 GitHub 域名。
          </p>
          <div className="refresh-meta">
            <div><span>本次生成</span><strong>{formatTimestamp(meta.generatedAt, { withYear: true })}</strong></div>
            <div><span>建议刷新</span><strong>{formatTimestamp(meta.nextRefreshAt, { withYear: true })}</strong></div>
            <div><span>LMArena 榜期</span><strong>{formatTimestamp(meta.upstreamUpdatedAt, { withYear: true })}</strong></div>
          </div>
          <code className="command-line">npm run refresh</code>
        </article>
      </div>

      <div className="source-list reveal">
        <div className="source-list-head">
          <h3>数据来源与状态</h3>
          <span>自动检查于 {formatTimestamp(meta.generatedAt, { withYear: true })}</span>
        </div>
        <div className="source-grid">
          {meta.sources.map((source) => {
            const status = relativeStatus(source.status)
            return (
              <a
                className="source-card"
                key={source.id}
                href={source.url || undefined}
                target={source.url ? '_blank' : undefined}
                rel={source.url ? 'noreferrer' : undefined}
              >
                <div className="source-card-top">
                  <span className={`status-pill ${status.tone}`}><i />{status.label}</span>
                  {source.url ? <ArrowUpRightIcon size={14} /> : null}
                </div>
                <strong>{source.name}</strong>
                <p>{source.note}</p>
                <span className="source-time">{formatTimestamp(source.checkedAt, { withYear: true })}</span>
              </a>
            )
          })}
        </div>
      </div>

      <div className="disclaimer-card reveal">
        <strong>许可与署名</strong>
        <p>{meta.disclaimer}</p>
        <p>
          LMArena 数据遵循{' '}
          <a className="inline-link" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>
          （LMArena Leaderboard Dataset），本页做了去重、同模型多档位取最高分与重新排名；鹈鹕数据集遵循{' '}
          <a className="inline-link" href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noreferrer">Apache-2.0</a>；
          LiteLLM 遵循{' '}
          <a className="inline-link" href="https://github.com/BerriAI/litellm/blob/main/LICENSE" target="_blank" rel="noreferrer">MIT</a>
          （Copyright (c) 2023 Berri AI）；Frankfurter 遵循{' '}
          <a className="inline-link" href="https://github.com/lineofflight/frankfurter/blob/main/LICENSE" target="_blank" rel="noreferrer">MIT</a>
          （Copyright (c) Hakan Ensari）。汇率 1 USD ≈ ¥{meta.fx.usdCny.toFixed(4)}，
          来源 {meta.fx.source}，更新于 {formatTimestamp(meta.fx.date, { withYear: true })}。本页面为独立整理，与所列厂商及数据源无隶属关系。
        </p>
      </div>
    </section>
  )
}

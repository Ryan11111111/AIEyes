import type { ReactNode } from 'react'

interface SectionHeaderProps {
  index: string
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
}

export function SectionHeader({ index, eyebrow, title, description, actions }: SectionHeaderProps) {
  return (
    <div className="section-header reveal">
      <div className="section-heading">
        <div className="section-index">
          <span>{index}</span>
          <span className="section-index-line" />
          <span className="eyebrow">{eyebrow}</span>
        </div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {actions ? <div className="section-actions">{actions}</div> : null}
    </div>
  )
}

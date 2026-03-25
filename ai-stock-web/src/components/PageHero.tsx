import type { ReactNode } from 'react'

type MetricItem = {
  value: ReactNode
  label: string
}

type PageHeroProps = {
  eyebrow: string
  title: string
  description?: string
  tags?: string[]
  metrics?: MetricItem[]
  compact?: boolean
}

function PageHero({ eyebrow, title, description, tags, metrics, compact = false }: PageHeroProps) {
  return (
    <section className={compact ? 'hero-panel slim-hero' : 'hero-panel web-hero'}>
      <div className="hero-copy">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
        {tags?.length ? (
          <div className="chip-row">
            {tags.map((tag) => (
              <span className="soft-chip" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {metrics?.length ? (
        <div className="metric-grid">
          {metrics.map((metric) => (
            <div className="metric-card" key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export default PageHero
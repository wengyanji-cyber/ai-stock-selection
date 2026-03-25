import type { ReactNode } from 'react'

type MetricItem = {
  value: ReactNode
  label: string
}

type AdminHeroProps = {
  eyebrow: string
  title: string
  description?: string
  metrics?: MetricItem[]
}

function AdminHero({ eyebrow, title, description, metrics }: AdminHeroProps) {
  return (
    <section className="hero-panel admin-hero">
      <div className="hero-copy">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {metrics?.length ? (
        <div className="metric-grid four-cols">
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

export default AdminHero
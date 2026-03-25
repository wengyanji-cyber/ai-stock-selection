import type { PropsWithChildren, ReactNode } from 'react'

type ContentPanelProps = PropsWithChildren<{
  kicker: string
  title?: ReactNode
}>

function ContentPanel({ kicker, title, children }: ContentPanelProps) {
  return (
    <article className="panel-card">
      <div className="section-kicker">{kicker}</div>
      {title ? <h2 className="panel-heading">{title}</h2> : null}
      {children}
    </article>
  )
}

export default ContentPanel
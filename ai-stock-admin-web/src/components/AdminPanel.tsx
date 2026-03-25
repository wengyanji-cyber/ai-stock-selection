import type { PropsWithChildren, ReactNode } from 'react'

type AdminPanelProps = PropsWithChildren<{
  kicker: string
  title?: ReactNode
}>

function AdminPanel({ kicker, title, children }: AdminPanelProps) {
  return (
    <section className="panel-card">
      <div className="section-kicker">{kicker}</div>
      {title ? <h2 className="panel-heading">{title}</h2> : null}
      {children}
    </section>
  )
}

export default AdminPanel
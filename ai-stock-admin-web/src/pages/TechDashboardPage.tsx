import AdminHero from '../components/AdminHero'
import AdminPanel from '../components/AdminPanel'
import { useAdminData } from '../hooks/useAdminData'
import { useQueueHealth } from '../hooks/useQueueHealth'

function TechDashboardPage() {
  const { data: adminData, source } = useAdminData()
  const { data: queueHealth, isLoading, source: queueSource, error, refresh } = useQueueHealth()
  const techCards = adminData.techCards
  const incidents = adminData.incidents

  return (
    <div className="page-stack">
      <AdminHero eyebrow="技术总览" title="把数据任务、规则配置和系统健康统一放进技术管理视图。" />
      <section className="stack-list">
        {techCards.map((item) => (
          <article className="panel-card" key={item.title}>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </section>
      <section className="content-grid admin-content-grid">
        <AdminPanel kicker="最新事件">
          <div className="stack-list compact-list">
            {incidents.map((item) => (
              <div className="info-card" key={item.title}>
                <div className="card-head">
                  <h2>{item.title}</h2>
                  <span className="soft-chip">{item.severity}</span>
                </div>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </AdminPanel>
        <AdminPanel kicker="技术侧优先级">
          <div className="action-toolbar">
            <button className="action-button" type="button" onClick={() => void refresh()} disabled={isLoading}>
              {isLoading ? '刷新中...' : '刷新队列状态'}
            </button>
          </div>
          <ul className="bullet-list">
            <li>先保证数据任务、规则开关、系统健康这些业务关键位可见。</li>
            <li>日志检索和复杂监控后续更适合接专业工具，不急着重造。</li>
            <li>把任务异常和运营异常放在同一后台，便于排障协同。</li>
          </ul>
          {error ? <div className="note-card error-card">队列接口异常：{error}</div> : null}
          <div className="stack-list compact-top-gap">
            {(queueHealth?.queues || []).map((queue) => (
              <div className="info-card" key={queue.name}>
                <div className="card-head">
                  <h2>{queue.name}</h2>
                  <span className="soft-chip">{queueHealth?.status || 'unknown'}</span>
                </div>
                <p>等待：{queue.waiting ?? '未取到'} / 运行中：{queue.active ?? '未取到'} / 已完成：{queue.completed ?? '未取到'}</p>
                <p>失败：{queue.failed ?? '未取到'} / 延迟：{queue.delayed ?? '未取到'}</p>
              </div>
            ))}
          </div>
          <div className="note-card">当前数据源：总览 {source === 'api' ? '后端接口' : '本地 mock 回退'}，队列 {queueSource === 'api' ? '后端接口' : '本地 mock 回退'}。</div>
        </AdminPanel>
      </section>
    </div>
  )
}

export default TechDashboardPage
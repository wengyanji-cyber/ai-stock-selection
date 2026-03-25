import AdminHero from '../components/AdminHero'
import AdminPanel from '../components/AdminPanel'
import { useAdminData } from '../hooks/useAdminData'

function OperationsDashboardPage() {
  const { data: adminData, source } = useAdminData()
  const operationCards = adminData.operationCards
  const funnel = adminData.funnel
  const todayActions = adminData.todayActions

  return (
    <div className="page-stack">
      <AdminHero
        eyebrow="运营总览"
        title="先看增长、试用和合规，再决定今天推什么内容。"
        metrics={[
          { value: adminData.summary.newUsers, label: '新增注册' },
          { value: adminData.summary.newTrials, label: '新增试用' },
          { value: adminData.summary.renewals, label: '今日续费' },
          { value: adminData.summary.riskConsults, label: '高风险咨询' },
        ]}
      />
      <section className="stack-list">
        {operationCards.map((item) => (
          <article className="panel-card" key={item.title}>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </section>
      <section className="content-grid admin-content-grid">
        <AdminPanel kicker="试用转化漏斗">
          <div className="funnel-list">
            {funnel.map((item) => (
              <div className="funnel-row" key={item.label}>
                <span>{item.label}</span>
                <div className="funnel-bar">
                  <div className="funnel-fill" style={{ width: `${item.value}%` }} />
                </div>
                <strong>{item.value}%</strong>
              </div>
            ))}
          </div>
        </AdminPanel>
        <AdminPanel kicker="今日动作建议">
          <ul className="bullet-list">
            {todayActions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="note-card">当前数据源：{source === 'api' ? '后端接口' : '本地 mock 回退'}。</div>
        </AdminPanel>
      </section>
    </div>
  )
}

export default OperationsDashboardPage
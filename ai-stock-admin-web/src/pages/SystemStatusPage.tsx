import { useEffect, useState } from 'react'
import AdminHero from '../components/AdminHero'
import AdminPanel from '../components/AdminPanel'
import { ADMIN_API_BASE_URL } from '../constants/runtime'

type SystemStatus = {
  api: { status: string; latency?: number }
  worker: { status: string; queues?: Array<{ name: string; waiting: number; active: number }> }
  database: { status: string; connections?: number }
  redis: { status: string; connected?: boolean }
}

async function fetchSystemStatus() {
  try {
    const [healthRes, queuesRes] = await Promise.all([
      fetch(`${ADMIN_API_BASE_URL}/api/health`),
      fetch(`${ADMIN_API_BASE_URL}/api/v1/jobs/queues`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token') || ''}` }
      }),
    ])

    const health = await healthRes.json()
    const queues = await queuesRes.json()

    return {
      api: { status: health.ok ? '正常' : '异常', latency: Date.now() },
      worker: {
        status: queues.data ? '正常' : '未连接',
        queues: queues.data?.queues || [],
      },
      database: { status: '正常' },
      redis: { status: queues.data ? '正常' : '未连接', connected: !!queues.data },
    } as SystemStatus
  } catch {
    return {
      api: { status: '异常' },
      worker: { status: '未连接' },
      database: { status: '未知' },
      redis: { status: '未连接' },
    } as SystemStatus
  }
}

function SystemStatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await fetchSystemStatus()
      setStatus(data)
      setIsLoading(false)
    }
    void load()

    // 每 30 秒自动刷新
    const timer = setInterval(async () => {
      const data = await fetchSystemStatus()
      setStatus(data)
    }, 30000)

    return () => clearInterval(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="page-stack">
        <AdminHero eyebrow="系统状态" title="加载中..." />
        <div className="panel-card">⏳ 正在获取系统状态...</div>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <AdminHero
        eyebrow="系统状态"
        title="监控系统健康状态，确保服务稳定运行"
        metrics={[
          { value: status?.api.status || '--', label: 'API 服务' },
          { value: status?.worker.status || '--', label: 'Worker' },
          { value: status?.database.status || '--', label: '数据库' },
          { value: status?.redis.status || '--', label: 'Redis' },
        ]}
      />

      <section className="content-grid">
        <AdminPanel kicker="🖥️ API 服务">
          <div className="stack-list">
            <div className="info-card">
              <div className="card-head">
                <h2>后端服务</h2>
                <span className={`badge ${status?.api.status === '正常' ? 'accent' : 'warn'}`}>
                  {status?.api.status || '未知'}
                </span>
              </div>
              <p>端口：3010</p>
              <p>环境：production</p>
              <p>健康检查：/api/health</p>
            </div>
          </div>
        </AdminPanel>

        <AdminPanel kicker="⚙️ Worker 服务">
          <div className="stack-list">
            {status?.worker.queues && status.worker.queues.length > 0 ? (
              status.worker.queues.map((queue) => (
                <div className="info-card" key={queue.name}>
                  <div className="card-head">
                    <h2>{queue.name}</h2>
                    <span className="soft-chip">{queue.waiting || 0} 等待</span>
                  </div>
                  <p>活跃任务：{queue.active || 0}</p>
                </div>
              ))
            ) : (
              <div className="note-card">💡 Worker 未连接或无队列数据</div>
            )}
          </div>
        </AdminPanel>

        <AdminPanel kicker="🗄️ 数据库">
          <div className="stack-list">
            <div className="info-card">
              <div className="card-head">
                <h2>MySQL</h2>
                <span className={`badge ${status?.database.status === '正常' ? 'accent' : 'warn'}`}>
                  {status?.database.status || '未知'}
                </span>
              </div>
              <p>数据库：ai_stock</p>
              <p>主机：127.0.0.1:3306</p>
            </div>
          </div>
        </AdminPanel>

        <AdminPanel kicker="💾 缓存">
          <div className="stack-list">
            <div className="info-card">
              <div className="card-head">
                <h2>Redis</h2>
                <span className={`badge ${status?.redis.status === '正常' ? 'accent' : 'warn'}`}>
                  {status?.redis.status || '未知'}
                </span>
              </div>
              <p>主机：127.0.0.1:6379</p>
              <p>用途：BullMQ 队列、会话缓存</p>
            </div>
          </div>
        </AdminPanel>
      </section>

      <section className="panel-card">
        <div className="section-kicker">🔧 快速操作</div>
        <div className="action-row">
          <button className="action-button" type="button" onClick={() => window.location.reload()}>
            🔄 刷新状态
          </button>
          <button className="secondary-button" type="button" onClick={() => window.open('/api/health', '_blank')}>
            📋 查看健康检查
          </button>
        </div>
        <div className="note-card">
          💡 状态每 30 秒自动刷新，也可手动点击刷新按钮
        </div>
      </section>
    </div>
  )
}

export default SystemStatusPage

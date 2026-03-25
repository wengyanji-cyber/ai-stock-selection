import AdminPanel from '../components/AdminPanel'
import DataTable from '../components/DataTable'
import { useJobRuns } from '../hooks/useJobRuns'

function formatTimeLabel(value: string | null) {
  if (!value) {
    return '未记录'
  }

  return value.replace('T', ' ').slice(0, 19)
}

function DataJobsPage() {
  const { items, isLoading, isDispatching, source, error, refresh, dispatch } = useJobRuns()

  return (
    <div className="page-stack">
      <AdminPanel kicker="数据任务" title="任务状态页是技术管理端最先需要的业务页面之一。">
        <div className="action-toolbar">
          <button className="action-button primary" type="button" onClick={() => void dispatch()} disabled={isDispatching}>
            {isDispatching ? '投递中...' : '投递 Demo 任务'}
          </button>
          <button className="action-button" type="button" onClick={() => void refresh()} disabled={isLoading}>
            {isLoading ? '刷新中...' : '刷新任务状态'}
          </button>
        </div>
        {error ? <div className="note-card error-card">任务接口异常：{error}</div> : null}
        {isLoading ? <div className="note-card">正在加载任务记录...</div> : null}
        {!isLoading && items.length === 0 ? <div className="note-card">当前没有任务记录，可先投递一组 demo 任务。</div> : null}
        {items.length > 0 ? (
          <DataTable
            headers={['任务编码', '状态', '队列', '计划时间']}
            rows={items.map((job) => [
              <div>
                <strong>{job.jobCode}</strong>
                <div className="subtle-meta">{job.resultSummary || '暂无摘要'}</div>
              </div>,
              <span className={`soft-chip inline-chip status-${job.status.toLowerCase()}`}>{job.status}</span>,
              job.queueName,
              formatTimeLabel(job.scheduledAt),
            ])}
          />
        ) : null}
        {items.length > 0 ? (
          <div className="stack-list compact-top-gap">
            {items.slice(0, 3).map((job) => (
              <div className="info-card" key={job.id}>
                <div className="card-head">
                  <h2>{job.jobCode}</h2>
                  <span className={`soft-chip inline-chip status-${job.status.toLowerCase()}`}>{job.status}</span>
                </div>
                <p>队列：{job.queueName}</p>
                <p>开始时间：{formatTimeLabel(job.startedAt)}</p>
                <p>完成时间：{formatTimeLabel(job.finishedAt)}</p>
                <p>耗时：{job.durationMs === null ? '未记录' : `${job.durationMs} ms`}</p>
                {job.errorMessage ? <div className="note-card error-card">错误：{job.errorMessage}</div> : null}
              </div>
            ))}
          </div>
        ) : null}
        <div className="note-card">当前数据源：{source === 'api' ? '后端接口' : '本地 mock 回退'}。</div>
      </AdminPanel>
    </div>
  )
}

export default DataJobsPage
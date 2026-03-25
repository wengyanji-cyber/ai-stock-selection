import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWatchlist } from '../hooks/useWatchlist'
import { getCurrentUserCode } from '../utils/session'

function WatchPage() {
  const navigate = useNavigate()
  const userCode = getCurrentUserCode()
  const { items: watchlist, isLoading, isSaving, source, error, refresh, addItem, removeItem, markItem } = useWatchlist(userCode)
  const [form, setForm] = useState({ stockCode: '', stockName: '', sectorName: '' })

  if (!userCode) {
    return (
      <div className="page-stack">
        <section className="panel-card">
          <div className="section-kicker">自选观察</div>
          <h2>当前还没有登录用户，无法保存个人自选观察。</h2>
          <p>先去登录或开通试用账号，再把候选股票加入你的个人观察列表。</p>
          <div className="action-row">
            <button className="primary-button" type="button" onClick={() => navigate('/login')}>
              去登录
            </button>
            <button className="secondary-button" type="button" onClick={() => navigate('/trial')}>
              开通试用
            </button>
          </div>
        </section>
      </div>
    )
  }

  async function handleAdd() {
    if (!form.stockCode.trim() || !form.stockName.trim()) {
      return
    }

    await addItem({
      stockCode: form.stockCode.trim(),
      stockName: form.stockName.trim(),
      sectorName: form.sectorName.trim() || '未分类',
    })
    setForm({ stockCode: '', stockName: '', sectorName: '' })
  }

  return (
    <div className="page-stack">
      <section className="hero-panel slim-hero">
        <div className="hero-copy">
          <span className="eyebrow">自选观察</span>
          <h1>把用户最关心的不是“今天推荐谁”，而是“我的股票现在怎样”。</h1>
        </div>
      </section>
      <div className="action-row">
        <button className="secondary-button" type="button" onClick={() => void refresh()} disabled={isLoading}>
          {isLoading ? '刷新中...' : '刷新自选状态'}
        </button>
      </div>
      <div className="note-card">当前用户：{userCode}</div>
      <section className="panel-card filter-panel">
        <div className="section-kicker">新增自选</div>
        <div className="filter-grid">
          <label className="form-field">
            <span>股票代码</span>
            <input value={form.stockCode} onChange={(event) => setForm((current) => ({ ...current, stockCode: event.target.value }))} placeholder="例如：300123" />
          </label>
          <label className="form-field">
            <span>股票名称</span>
            <input value={form.stockName} onChange={(event) => setForm((current) => ({ ...current, stockName: event.target.value }))} placeholder="例如：示例新股" />
          </label>
          <label className="form-field">
            <span>所属板块</span>
            <input value={form.sectorName} onChange={(event) => setForm((current) => ({ ...current, sectorName: event.target.value }))} placeholder="例如：AI算力链" />
          </label>
        </div>
        <div className="action-row">
          <button className="secondary-button" type="button" onClick={() => void handleAdd()} disabled={isSaving}>
            {isSaving ? '提交中...' : '加入自选观察'}
          </button>
        </div>
      </section>
      <div className="note-card">当前数据源：{source === 'api' ? '后端接口' : '本地 mock 回退'}。</div>
      {error ? <div className="note-card error-card">自选接口异常：{error}</div> : null}
      {isLoading ? <div className="note-card">正在加载自选观察...</div> : null}
      {!isLoading && watchlist.length === 0 ? <div className="note-card">当前没有自选观察数据。</div> : null}
      <section className="stack-list">
        {watchlist.map((item) => (
          <article className="panel-card" key={item.code}>
            <div className="card-head">
              <div>
                <h2>
                  {item.name} <span className="tiny-code">{item.code}</span>
                </h2>
                <p>{item.reason}</p>
              </div>
              <span className={`badge ${item.badge}`}>{item.status}</span>
            </div>
            <div className="note-card">建议动作：{item.advice}</div>
            <div className="action-row">
              <button className="secondary-button" type="button" onClick={() => navigate(`/diagnosis?code=${item.code}`)}>
                查看该股诊断
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() =>
                  void markItem({
                    stockCode: item.code,
                    status: '结构转强',
                    statusKey: 'stronger',
                    reason: '已进入重点观察区，等待确认持续放量。',
                    advice: '重点跟踪能否继续放量并站稳支撑位。',
                  })
                }
                disabled={isSaving}
              >
                标记转强
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() =>
                  void markItem({
                    stockCode: item.code,
                    status: '转弱预警',
                    statusKey: 'warning',
                    reason: '短线承接转弱，需重新评估是否继续跟踪。',
                    advice: '若跌破关键位则取消观察，不追弱势反抽。',
                  })
                }
                disabled={isSaving}
              >
                标记预警
              </button>
              <button className="secondary-button" type="button" onClick={() => void removeItem(item.code)} disabled={isSaving}>
                移除自选
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

export default WatchPage
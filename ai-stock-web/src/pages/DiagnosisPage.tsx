import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDiagnoses } from '../hooks/useDiagnoses'

function DiagnosisPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [keyword, setKeyword] = useState('')
  const { items: diagnosisList, source, error } = useDiagnoses(keyword)
  const [selectedCode, setSelectedCode] = useState(searchParams.get('code') || diagnosisList[0]?.code || '')

  useEffect(() => {
    const initialCode = searchParams.get('code') || diagnosisList[0]?.code || ''
    setSelectedCode(initialCode)
  }, [diagnosisList, searchParams])

  const selectedDiagnosis = useMemo(
    () => diagnosisList.find((item) => item.code === selectedCode) ?? diagnosisList[0],
    [diagnosisList, selectedCode],
  )

  function handleSelectCode(code: string) {
    setSelectedCode(code)
    setSearchParams({ code })
  }

  return (
    <div className="page-stack">
      <section className="hero-panel slim-hero">
        <div className="hero-copy">
          <span className="eyebrow">个股诊断</span>
          <h1>不是只给结论，而是同时给理由、风险和失效条件。</h1>
        </div>
      </section>
      <section className="content-grid diagnosis-layout">
        <article className="panel-card diagnosis-sidebar">
          <div className="section-kicker">快速切换</div>
          <label className="form-field">
            <span>搜索代码 / 名称 / 板块</span>
            <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="例如：300001 / 机器人" />
          </label>
          <div className="note-card">当前数据源：{source === 'api' ? '后端接口' : '本地 mock 回退'}。</div>
          {error ? <div className="note-card error-card">诊股接口异常：{error}</div> : null}
          <div className="stack-list compact-list">
            {diagnosisList.map((diagnosis) => (
              <button
                key={diagnosis.code}
                type="button"
                className={diagnosis.code === selectedDiagnosis?.code ? 'selector-card active' : 'selector-card'}
                onClick={() => handleSelectCode(diagnosis.code)}
              >
                <strong>
                  {diagnosis.name} <span className="tiny-code">{diagnosis.code}</span>
                </strong>
                <span>{diagnosis.sector}</span>
              </button>
            ))}
          </div>
        </article>
        {selectedDiagnosis ? (
          <article className="panel-card" key={selectedDiagnosis.code}>
            <div className="card-head">
              <div>
                <h2>
                  {selectedDiagnosis.name} <span className="tiny-code">{selectedDiagnosis.code}</span>
                </h2>
                <p>{selectedDiagnosis.summary}</p>
              </div>
              <div className="badge-group">
                <span className="soft-chip">{selectedDiagnosis.sector}</span>
                <span className="soft-chip">{selectedDiagnosis.trend}</span>
                <span className="soft-chip">{selectedDiagnosis.strength}</span>
              </div>
            </div>
            <div className="data-grid">
              <div className="data-card"><strong>观察区间</strong><span>{selectedDiagnosis.observe}</span></div>
              <div className="data-card"><strong>支撑位</strong><span>{selectedDiagnosis.support}</span></div>
              <div className="data-card"><strong>压力位</strong><span>{selectedDiagnosis.pressure}</span></div>
              <div className="data-card"><strong>止损位</strong><span>{selectedDiagnosis.stopLoss}</span></div>
            </div>
            <div className="content-grid single-gap">
              <div className="info-card">
                <h2>判断理由</h2>
                <ul className="bullet-list">
                  {selectedDiagnosis.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
              <div className="info-card">
                <h2>主要风险</h2>
                <ul className="bullet-list">
                  {selectedDiagnosis.risks.map((risk) => (
                    <li key={risk}>{risk}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="note-card">当前动作建议：{selectedDiagnosis.action}</div>
          </article>
        ) : null}
      </section>
    </div>
  )
}

export default DiagnosisPage
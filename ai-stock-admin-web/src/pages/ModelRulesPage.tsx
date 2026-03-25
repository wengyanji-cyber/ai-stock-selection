import { useEffect, useState } from 'react'
import { useModelRules } from '../hooks/useModelRules'
import type { ModelRule } from '../types/admin'

const emptyRule: ModelRule = {
  ruleCode: '',
  name: '',
  action: '启用',
  note: '',
  scene: '候选池',
  enabled: true,
  versionTag: 'v1',
}

function ModelRulesPage() {
  const { items: modelRules, isLoading, isSaving, source, error, refresh, toggleRule, saveRule, removeRule } = useModelRules()
  const [selectedRuleCode, setSelectedRuleCode] = useState('')
  const [form, setForm] = useState<ModelRule>(emptyRule)

  useEffect(() => {
    if (!selectedRuleCode) {
      setForm(emptyRule)
      return
    }

    const targetRule = modelRules.find((rule) => rule.ruleCode === selectedRuleCode)
    if (targetRule) {
      setForm(targetRule)
    }
  }, [modelRules, selectedRuleCode])

  async function handleSave() {
    if (!form.ruleCode.trim() || !form.name.trim()) {
      return
    }

    await saveRule(
      {
        ...form,
        ruleCode: form.ruleCode.trim(),
        name: form.name.trim(),
        note: form.note.trim(),
        scene: form.scene?.trim() || '未分类',
        versionTag: form.versionTag?.trim() || 'v1',
      },
      selectedRuleCode || undefined,
    )
    setSelectedRuleCode(form.ruleCode.trim())
  }

  return (
    <div className="page-stack">
      <section className="panel-card">
        <div className="section-kicker">模型与规则</div>
        <h2>先管理业务必须自研的规则，再考虑做复杂平台。</h2>
        <div className="action-toolbar">
          <button className="action-button" type="button" onClick={() => void refresh()} disabled={isLoading}>
            {isLoading ? '刷新中...' : '刷新规则'}
          </button>
          <button
            className="action-button"
            type="button"
            onClick={() => {
              setSelectedRuleCode('')
              setForm(emptyRule)
            }}
          >
            新建规则
          </button>
        </div>
        {error ? <div className="note-card error-card">规则接口异常：{error}</div> : null}
        {isLoading ? <div className="note-card">正在加载规则配置...</div> : null}
        <div className="panel-card compact-top-gap">
          <div className="section-kicker">规则编辑器</div>
          <div className="content-grid admin-content-grid compact-top-gap">
            <label className="form-field">
              <span>规则编码</span>
              <input value={form.ruleCode} onChange={(event) => setForm((current) => ({ ...current, ruleCode: event.target.value }))} placeholder="例如：turnover-boost-v1" />
            </label>
            <label className="form-field">
              <span>规则名称</span>
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="例如：换手率增强" />
            </label>
            <label className="form-field">
              <span>场景</span>
              <input value={form.scene || ''} onChange={(event) => setForm((current) => ({ ...current, scene: event.target.value }))} placeholder="例如：候选池" />
            </label>
            <label className="form-field">
              <span>版本</span>
              <input value={form.versionTag || ''} onChange={(event) => setForm((current) => ({ ...current, versionTag: event.target.value }))} placeholder="例如：v1.1" />
            </label>
            <label className="form-field">
              <span>动作文案</span>
              <input value={form.action} onChange={(event) => setForm((current) => ({ ...current, action: event.target.value }))} placeholder="例如：启用" />
            </label>
            <label className="form-field">
              <span>启用状态</span>
              <select value={form.enabled ? 'true' : 'false'} onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.value === 'true' }))}>
                <option value="true">启用</option>
                <option value="false">停用</option>
              </select>
            </label>
          </div>
          <label className="form-field compact-top-gap">
            <span>规则说明</span>
            <textarea value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} rows={4} placeholder="说明这个规则用于什么业务判断、什么边界下启用。" />
          </label>
          <div className="action-toolbar">
            <button className="action-button primary" type="button" onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? '保存中...' : selectedRuleCode ? '保存修改' : '创建规则'}
            </button>
            {selectedRuleCode ? (
              <button className="action-button" type="button" onClick={() => void removeRule(selectedRuleCode)} disabled={isSaving}>
                删除当前规则
              </button>
            ) : null}
          </div>
        </div>
        <div className="stack-list">
          {modelRules.map((rule) => (
            <div className="info-card" key={rule.ruleCode}>
              <div className="card-head">
                <h2>{rule.name}</h2>
                <span className="soft-chip">{rule.action}</span>
              </div>
              <p>{rule.note}</p>
              <div className="badge-group">
                <span className="soft-chip">场景：{rule.scene || '未分类'}</span>
                <span className="soft-chip">版本：{rule.versionTag || 'v1'}</span>
                <span className="soft-chip">{rule.enabled ? '已启用' : '已停用'}</span>
              </div>
              <div className="action-row">
                <button
                  className="action-button"
                  type="button"
                  onClick={() => {
                    setSelectedRuleCode(rule.ruleCode)
                    setForm(rule)
                  }}
                >
                  编辑规则
                </button>
                <button className="action-button" type="button" onClick={() => void toggleRule(rule)} disabled={isSaving}>
                  {rule.enabled ? '停用规则' : '启用规则'}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="note-card">当前数据源：{source === 'api' ? '后端接口' : '本地 mock 回退'}。</div>
      </section>
    </div>
  )
}

export default ModelRulesPage
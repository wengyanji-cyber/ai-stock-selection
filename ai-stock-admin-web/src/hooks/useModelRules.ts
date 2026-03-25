import { useEffect, useState } from 'react'
import { createModelRule, deleteModelRule, fetchModelRules, patchModelRule } from '../api/adminApi'
import type { ModelRule } from '../types/admin'

type ModelRulesState = {
  items: ModelRule[]
  isLoading: boolean
  isSaving: boolean
  source: 'api' | 'mock'
  error: string | null
}

export function useModelRules() {
  const [state, setState] = useState<ModelRulesState>({
    items: [],
    isLoading: true,
    isSaving: false,
    source: 'mock',
    error: null,
  })

  async function refresh() {
    setState((current) => ({ ...current, isLoading: true, error: null }))

    try {
      const result = await fetchModelRules()
      setState({
        items: result.data,
        isLoading: false,
        isSaving: false,
        source: result.source,
        error: null,
      })
    } catch (error) {
      setState((current) => ({
        ...current,
        isLoading: false,
        error: error instanceof Error ? error.message : '加载规则失败',
      }))
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function toggleRule(rule: ModelRule) {
    setState((current) => ({ ...current, isSaving: true, error: null }))

    try {
      const result = await patchModelRule({
        ruleCode: rule.ruleCode,
        name: rule.name,
        enabled: !rule.enabled,
        action: !rule.enabled ? '启用' : '停用',
        note: rule.note,
        scene: rule.scene,
        versionTag: rule.versionTag,
      })

      setState((current) => ({
        ...current,
        items: current.items.map((item) => (item.ruleCode === result.data.ruleCode ? result.data : item)),
        isSaving: false,
        source: result.source,
      }))
    } catch (error) {
      setState((current) => ({
        ...current,
        isSaving: false,
        error: error instanceof Error ? error.message : '更新规则失败',
      }))
    }
  }

  async function saveRule(input: ModelRule, previousRuleCode?: string) {
    setState((current) => ({ ...current, isSaving: true, error: null }))

    try {
      const exists = state.items.some((item) => item.ruleCode === (previousRuleCode || input.ruleCode))
      const result = exists ? await patchModelRule(input, previousRuleCode) : await createModelRule(input)

      setState((current) => ({
        ...current,
        items: exists
          ? current.items.map((item) => (item.ruleCode === (previousRuleCode || input.ruleCode) ? result.data : item))
          : [result.data, ...current.items],
        isSaving: false,
        source: result.source,
      }))
    } catch (error) {
      setState((current) => ({
        ...current,
        isSaving: false,
        error: error instanceof Error ? error.message : '保存规则失败',
      }))
    }
  }

  async function removeRule(ruleCode: string) {
    setState((current) => ({ ...current, isSaving: true, error: null }))

    try {
      const result = await deleteModelRule(ruleCode)
      if (result.removed) {
        setState((current) => ({
          ...current,
          items: current.items.filter((item) => item.ruleCode !== ruleCode),
          isSaving: false,
          source: result.source,
        }))
        return
      }

      setState((current) => ({ ...current, isSaving: false }))
    } catch (error) {
      setState((current) => ({
        ...current,
        isSaving: false,
        error: error instanceof Error ? error.message : '删除规则失败',
      }))
    }
  }

  return {
    ...state,
    refresh,
    toggleRule,
    saveRule,
    removeRule,
  }
}
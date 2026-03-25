import { useEffect, useState } from 'react'
import { fetchComplianceSummary } from '../api/adminApi'
import type { ComplianceSummary } from '../types/admin'

type ComplianceState = {
  data: ComplianceSummary | null
  isLoading: boolean
  source: 'api' | 'mock'
  error: string | null
}

export function useComplianceSummary() {
  const [state, setState] = useState<ComplianceState>({
    data: null,
    isLoading: true,
    source: 'mock',
    error: null,
  })

  async function refresh() {
    setState((current) => ({ ...current, isLoading: true, error: null }))

    try {
      const result = await fetchComplianceSummary()
      setState({ data: result.data, isLoading: false, source: result.source, error: null })
    } catch (error) {
      setState((current) => ({
        ...current,
        isLoading: false,
        error: error instanceof Error ? error.message : '加载合规巡检失败',
      }))
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  return {
    ...state,
    refresh,
  }
}
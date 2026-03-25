import { useEffect, useState } from 'react'
import { fetchDiagnoses } from '../api/demoApi'
import { demoData } from '../mock/demoData'
import type { Diagnosis } from '../types/demo'

type DiagnosesState = {
  items: Diagnosis[]
  isLoading: boolean
  source: 'api' | 'mock'
  error: string | null
}

export function useDiagnoses(keyword: string) {
  const [state, setState] = useState<DiagnosesState>({
    items: Object.values(demoData.diagnoses),
    isLoading: true,
    source: 'mock',
    error: null,
  })

  useEffect(() => {
    let active = true

    setState((current) => ({ ...current, isLoading: true, error: null }))

    void fetchDiagnoses(keyword)
      .then((result) => {
        if (!active) {
          return
        }

        setState({ items: result.data, isLoading: false, source: result.source, error: null })
      })
      .catch((error) => {
        if (!active) {
          return
        }

        setState((current) => ({
          ...current,
          isLoading: false,
          error: error instanceof Error ? error.message : '加载诊股列表失败',
        }))
      })

    return () => {
      active = false
    }
  }, [keyword])

  return state
}
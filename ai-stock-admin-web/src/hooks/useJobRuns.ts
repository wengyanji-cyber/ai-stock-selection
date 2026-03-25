import { useEffect, useState } from 'react'
import { dispatchDemoJobs, fetchJobRuns } from '../api/adminApi'
import type { JobRunItem } from '../types/admin'

type JobRunsState = {
  items: JobRunItem[]
  isLoading: boolean
  isDispatching: boolean
  source: 'api' | 'mock'
  error: string | null
}

export function useJobRuns() {
  const [state, setState] = useState<JobRunsState>({
    items: [],
    isLoading: true,
    isDispatching: false,
    source: 'mock',
    error: null,
  })

  async function loadRuns() {
    setState((current) => ({
      ...current,
      isLoading: true,
      error: null,
    }))

    try {
      const result = await fetchJobRuns()
      setState((current) => ({
        ...current,
        items: result.data,
        isLoading: false,
        source: result.source,
      }))
    } catch (error) {
      setState((current) => ({
        ...current,
        isLoading: false,
        error: error instanceof Error ? error.message : '加载任务记录失败',
      }))
    }
  }

  async function runDemoDispatch() {
    setState((current) => ({
      ...current,
      isDispatching: true,
      error: null,
    }))

    try {
      await dispatchDemoJobs()
      await loadRuns()
      setState((current) => ({
        ...current,
        isDispatching: false,
      }))
    } catch (error) {
      setState((current) => ({
        ...current,
        isDispatching: false,
        error: error instanceof Error ? error.message : '投递任务失败',
      }))
    }
  }

  useEffect(() => {
    void loadRuns()
  }, [])

  return {
    ...state,
    refresh: loadRuns,
    dispatch: runDemoDispatch,
  }
}
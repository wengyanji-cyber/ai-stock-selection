import { useEffect, useState } from 'react'
import { fetchQueueHealth } from '../api/adminApi'
import type { QueueHealth } from '../types/admin'

type QueueHealthState = {
  data: QueueHealth | null
  isLoading: boolean
  source: 'api' | 'mock'
  error: string | null
}

export function useQueueHealth() {
  const [state, setState] = useState<QueueHealthState>({
    data: null,
    isLoading: true,
    source: 'mock',
    error: null,
  })

  async function refresh() {
    setState((current) => ({ ...current, isLoading: true, error: null }))

    try {
      const result = await fetchQueueHealth()
      setState({ data: result.data, isLoading: false, source: result.source, error: null })
    } catch (error) {
      setState((current) => ({
        ...current,
        isLoading: false,
        error: error instanceof Error ? error.message : '加载队列状态失败',
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
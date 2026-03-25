import { useEffect, useState } from 'react'
import { fetchLatestReview } from '../api/demoApi'
import { demoData } from '../mock/demoData'
import type { ReviewSummary } from '../types/demo'

type LatestReviewState = {
  data: ReviewSummary
  isLoading: boolean
  source: 'api' | 'mock'
  error: string | null
}

export function useLatestReview() {
  const [state, setState] = useState<LatestReviewState>({
    data: demoData.review,
    isLoading: true,
    source: 'mock',
    error: null,
  })

  useEffect(() => {
    let active = true

    void fetchLatestReview()
      .then((result) => {
        if (!active) {
          return
        }

        setState({ data: result.data, isLoading: false, source: result.source, error: null })
      })
      .catch((error) => {
        if (!active) {
          return
        }

        setState((current) => ({
          ...current,
          isLoading: false,
          error: error instanceof Error ? error.message : '加载复盘失败',
        }))
      })

    return () => {
      active = false
    }
  }, [])

  return state
}
import { useEffect, useState } from 'react'
import { fetchMarketHome } from '../api/demoApi'
import { demoData } from '../mock/demoData'
import type { MarketHome } from '../types/demo'

type MarketHomeState = {
  data: MarketHome
  isLoading: boolean
  source: 'api' | 'mock'
  error: string | null
}

export function useMarketHome() {
  const [state, setState] = useState<MarketHomeState>({
    data: {
      marketSummary: demoData.marketSummary,
      marketTemperature: demoData.marketTemperature,
      marketTags: demoData.marketTags,
      sectors: demoData.sectors,
      focusCandidateCount: demoData.candidates.filter((item) => item.level === '重点候选').length,
    },
    isLoading: true,
    source: 'mock',
    error: null,
  })

  useEffect(() => {
    let active = true

    void fetchMarketHome()
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
          error: error instanceof Error ? error.message : '加载市场首页失败',
        }))
      })

    return () => {
      active = false
    }
  }, [])

  return state
}
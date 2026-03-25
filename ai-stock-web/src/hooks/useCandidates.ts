import { useEffect, useState } from 'react'
import { fetchCandidateDetails } from '../api/demoApi'
import { demoData } from '../mock/demoData'
import type { Candidate } from '../types/demo'

type CandidatesState = {
  items: Candidate[]
  isLoading: boolean
  source: 'api' | 'mock'
  error: string | null
}

export function useCandidates() {
  const [state, setState] = useState<CandidatesState>({
    items: demoData.candidates,
    isLoading: true,
    source: 'mock',
    error: null,
  })

  useEffect(() => {
    let active = true

    void fetchCandidateDetails()
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
          error: error instanceof Error ? error.message : '加载候选池失败',
        }))
      })

    return () => {
      active = false
    }
  }, [])

  return state
}
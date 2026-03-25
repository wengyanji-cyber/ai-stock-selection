import { useEffect, useState } from 'react'
import { fetchDemoData, readDemoData } from '../api/demoApi'
import type { DemoData } from '../types/demo'

type DemoDataState = {
  data: DemoData
  isLoading: boolean
  source: 'api' | 'mock'
}

export function useDemoData() {
  const [state, setState] = useState<DemoDataState>({
    data: readDemoData(),
    isLoading: true,
    source: 'mock',
  })

  useEffect(() => {
    let active = true

    void fetchDemoData().then((result) => {
      if (!active) {
        return
      }

      setState({
        data: result.data,
        isLoading: false,
        source: result.source,
      })
    })

    return () => {
      active = false
    }
  }, [])

  return state
}
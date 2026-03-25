import { useEffect, useState } from 'react'
import { fetchAdminData, readAdminData } from '../api/adminApi'
import type { AdminData } from '../types/admin'

type AdminDataState = {
  data: AdminData
  isLoading: boolean
  source: 'api' | 'mock'
}

export function useAdminData() {
  const [state, setState] = useState<AdminDataState>({
    data: readAdminData(),
    isLoading: true,
    source: 'mock',
  })

  useEffect(() => {
    let active = true

    void fetchAdminData().then((result) => {
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
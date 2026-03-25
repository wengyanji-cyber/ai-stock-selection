import { useEffect, useState } from 'react'
import { fetchUserProfile } from '../api/demoApi'
import type { UserProfile } from '../types/demo'

type UserProfileState = {
  profile: UserProfile | null
  isLoading: boolean
  source: 'api' | 'mock'
  error: string | null
}

export function useUserProfile(userCode: string) {
  const [state, setState] = useState<UserProfileState>({
    profile: null,
    isLoading: true,
    source: 'mock',
    error: null,
  })

  async function refresh() {
    if (!userCode) {
      setState({ profile: null, isLoading: false, source: 'mock', error: null })
      return
    }

    setState((current) => ({ ...current, isLoading: true, error: null }))

    try {
      const result = await fetchUserProfile()
      setState({
        profile: result.data,
        isLoading: false,
        source: result.source,
        error: null,
      })
    } catch (error) {
      setState((current) => ({
        ...current,
        isLoading: false,
        error: error instanceof Error ? error.message : '加载用户资料失败',
      }))
    }
  }

  useEffect(() => {
    void refresh()
  }, [userCode])

  return {
    ...state,
    refresh,
  }
}
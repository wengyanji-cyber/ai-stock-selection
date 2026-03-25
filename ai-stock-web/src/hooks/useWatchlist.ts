import { useEffect, useState } from 'react'
import { createWatchlistItem, fetchWatchlist, removeWatchlistItem, updateWatchlistItem } from '../api/demoApi'
import type { WatchItem } from '../types/demo'

type WatchlistState = {
  items: WatchItem[]
  isLoading: boolean
  isSaving: boolean
  source: 'api' | 'mock'
  error: string | null
}

export function useWatchlist(userCode: string) {
  const [state, setState] = useState<WatchlistState>({
    items: [],
    isLoading: true,
    isSaving: false,
    source: 'mock',
    error: null,
  })

  async function refresh() {
    if (!userCode) {
      setState({
        items: [],
        isLoading: false,
        isSaving: false,
        source: 'mock',
        error: null,
      })
      return
    }

    setState((current) => ({ ...current, isLoading: true, error: null }))

    try {
      const result = await fetchWatchlist()
      setState({
        items: result.data,
        isLoading: false,
        isSaving: false,
        source: result.source,
        error: null,
      })
    } catch (error) {
      setState((current) => ({
        ...current,
        isLoading: false,
        error: error instanceof Error ? error.message : '加载自选观察失败',
      }))
    }
  }

  useEffect(() => {
    void refresh()
  }, [userCode])

  async function addItem(input: { stockCode: string; stockName: string; sectorName: string }) {
    setState((current) => ({ ...current, isSaving: true, error: null }))

    try {
      const result = await createWatchlistItem(input)
      setState((current) => ({
        ...current,
        items: [...current.items.filter((item) => item.code !== result.data.code), result.data],
        isSaving: false,
        source: result.source,
      }))
      await refresh()
    } catch (error) {
      setState((current) => ({
        ...current,
        isSaving: false,
        error: error instanceof Error ? error.message : '新增自选失败',
      }))
    }
  }

  async function removeItem(stockCode: string) {
    setState((current) => ({ ...current, isSaving: true, error: null }))

    try {
      const result = await removeWatchlistItem(stockCode)
      if (result.removed) {
        setState((current) => ({
          ...current,
          items: current.items.filter((item) => item.code !== stockCode),
          isSaving: false,
          source: result.source,
        }))
      } else {
        setState((current) => ({ ...current, isSaving: false }))
      }
    } catch (error) {
      setState((current) => ({
        ...current,
        isSaving: false,
        error: error instanceof Error ? error.message : '删除自选失败',
      }))
    }
  }

  async function markItem(input: {
    stockCode: string
    status: string
    statusKey: WatchItem['statusKey']
    reason?: string
    advice?: string
  }) {
    setState((current) => ({ ...current, isSaving: true, error: null }))

    try {
      const result = await updateWatchlistItem(input)
      if (!result.data) {
        throw new Error('未找到对应自选项')
      }

      setState((current) => ({
        ...current,
        items: current.items.map((item) => (item.code === result.data?.code ? result.data : item)),
        isSaving: false,
        source: result.source,
      }))
    } catch (error) {
      setState((current) => ({
        ...current,
        isSaving: false,
        error: error instanceof Error ? error.message : '更新自选失败',
      }))
    }
  }

  return {
    ...state,
    refresh,
    addItem,
    removeItem,
    markItem,
  }
}
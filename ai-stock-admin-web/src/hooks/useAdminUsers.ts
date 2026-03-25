import { useEffect, useState } from 'react'
import { deleteAdminUser, fetchAdminUsers, patchAdminUser, resetAdminUserPassword } from '../api/adminApi'
import type { AdminUser } from '../types/admin'

type AdminUsersState = {
  items: AdminUser[]
  isLoading: boolean
  isSaving: boolean
  source: 'api' | 'mock'
  error: string | null
}

export function useAdminUsers() {
  const [state, setState] = useState<AdminUsersState>({
    items: [],
    isLoading: true,
    isSaving: false,
    source: 'mock',
    error: null,
  })

  async function refresh() {
    setState((current) => ({ ...current, isLoading: true, error: null }))

    try {
      const result = await fetchAdminUsers()
      setState({ items: result.data, isLoading: false, isSaving: false, source: result.source, error: null })
    } catch (error) {
      setState((current) => ({
        ...current,
        isLoading: false,
        error: error instanceof Error ? error.message : '加载用户列表失败',
      }))
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  return {
    ...state,
    refresh,
    async updateUser(input: { userCode: string; nickname?: string; membershipPlan?: string; status?: string }) {
      setState((current) => ({ ...current, isSaving: true, error: null }))

      try {
        const result = await patchAdminUser(input)
        setState((current) => ({
          ...current,
          items: current.items.map((item) => (item.userCode === input.userCode ? result.data : item)),
          isSaving: false,
          source: result.source,
        }))
      } catch (error) {
        setState((current) => ({
          ...current,
          isSaving: false,
          error: error instanceof Error ? error.message : '更新用户失败',
        }))
      }
    },
    async removeUser(userCode: string) {
      setState((current) => ({ ...current, isSaving: true, error: null }))

      try {
        const result = await deleteAdminUser(userCode)
        if (result.removed) {
          setState((current) => ({
            ...current,
            items: current.items.filter((item) => item.userCode !== userCode),
            isSaving: false,
            source: result.source,
          }))
          return
        }

        setState((current) => ({ ...current, isSaving: false }))
      } catch (error) {
        setState((current) => ({
          ...current,
          isSaving: false,
          error: error instanceof Error ? error.message : '删除用户失败',
        }))
      }
    },
    async resetPassword(userCode: string, newPassword: string) {
      setState((current) => ({ ...current, isSaving: true, error: null }))

      try {
        await resetAdminUserPassword({ userCode, newPassword })
        setState((current) => ({
          ...current,
          isSaving: false,
        }))
      } catch (error) {
        setState((current) => ({
          ...current,
          isSaving: false,
          error: error instanceof Error ? error.message : '重置密码失败',
        }))
      }
    },
  }
}
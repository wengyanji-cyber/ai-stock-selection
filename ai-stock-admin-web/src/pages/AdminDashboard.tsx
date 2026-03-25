import { useState, useEffect } from 'react'

interface MembershipPlan {
  id: number
  planCode: string
  planName: string
  price: number
  period: string
  dailyCandidates: number
  watchlistLimit: number
  isEnabled: boolean
  sortOrder: number
}

interface PaymentOrder {
  orderNo: string
  userCode: string
  planName: string
  amount: string
  status: string
  paidAt: string | null
  createdAt: string
}

export function AdminDashboard() {
  const token = localStorage.getItem('token')
  const [activeTab, setActiveTab] = useState<'plans' | 'orders' | 'users'>('plans')
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [orders, setOrders] = useState<PaymentOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null)

  useEffect(() => {
    loadData()
  }, [activeTab])

  async function loadData() {
    try {
      if (activeTab === 'plans') {
        const res = await fetch('/api/v1/admin/membership/plans', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setPlans(data.data || [])
      } else if (activeTab === 'orders') {
        const res = await fetch('/api/v1/admin/payment/orders', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setOrders(data.data || [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSavePlan(plan: Partial<MembershipPlan>) {
    try {
      const url = plan.planCode
        ? `/api/v1/admin/membership/plans/${plan.planCode}`
        : '/api/v1/admin/membership/plans'
      const method = plan.planCode ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(plan),
      })

      const data = await res.json()
      if (data.data) {
        alert('保存成功')
        setEditingPlan(null)
        loadData()
      } else {
        alert(`保存失败：${data.error}`)
      }
    } catch (error) {
      console.error('Failed to save plan:', error)
      alert('保存失败')
    }
  }

  async function handleDeletePlan(planCode: string) {
    if (!confirm(`确定删除套餐 ${planCode}？`)) return

    try {
      const res = await fetch(`/api/v1/admin/membership/plans/${planCode}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json()
      if (data.data) {
        alert('删除成功')
        loadData()
      } else {
        alert(`删除失败：${data.error}`)
      }
    } catch (error) {
      console.error('Failed to delete plan:', error)
      alert('删除失败')
    }
  }

  if (loading) {
    return <div className="p-8">加载中...</div>
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">运营端管理后台</h1>

      {/* 标签页 */}
      <div className="flex border-b mb-6">
        <button
          className={`px-6 py-3 font-semibold ${
            activeTab === 'plans'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('plans')}
        >
          套餐管理
        </button>
        <button
          className={`px-6 py-3 font-semibold ${
            activeTab === 'orders'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('orders')}
        >
          订单管理
        </button>
        <button
          className={`px-6 py-3 font-semibold ${
            activeTab === 'users'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('users')}
        >
          用户管理
        </button>
      </div>

      {/* 套餐管理 */}
      {activeTab === 'plans' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">套餐列表</h2>
            <button
              onClick={() => setEditingPlan({
                id: 0,
                planCode: '',
                planName: '',
                price: 0,
                period: 'month',
                dailyCandidates: 0,
                watchlistLimit: 0,
                isEnabled: true,
                sortOrder: 0,
              })}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              新建套餐
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{plan.planName}</h3>
                    <p className="text-sm text-gray-500">{plan.planCode}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm ${
                    plan.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {plan.isEnabled ? '启用' : '禁用'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-2xl font-bold text-blue-600">
                    ¥{plan.price}<span className="text-sm text-gray-500">/{plan.period}</span>
                  </p>
                  <p className="text-sm text-gray-600">每日候选：{plan.dailyCandidates} 只</p>
                  <p className="text-sm text-gray-600">自选股上限：{plan.watchlistLimit} 只</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingPlan(plan)}
                    className="flex-1 bg-blue-100 text-blue-600 py-2 rounded hover:bg-blue-200"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan.planCode)}
                    className="flex-1 bg-red-100 text-red-600 py-2 rounded hover:bg-red-200"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 订单管理 */}
      {activeTab === 'orders' && (
        <div>
          <h2 className="text-xl font-semibold mb-6">订单列表</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4">订单号</th>
                  <th className="text-left py-3 px-4">用户</th>
                  <th className="text-left py-3 px-4">套餐</th>
                  <th className="text-left py-3 px-4">金额</th>
                  <th className="text-left py-3 px-4">状态</th>
                  <th className="text-left py-3 px-4">支付时间</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.orderNo} className="border-t">
                    <td className="py-3 px-4 font-mono text-sm">{order.orderNo}</td>
                    <td className="py-3 px-4">{order.userCode}</td>
                    <td className="py-3 px-4">{order.planName}</td>
                    <td className="py-3 px-4">¥{order.amount}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        order.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status === 'PAID' ? '已支付' :
                         order.status === 'PENDING' ? '待支付' : '失败'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {order.paidAt ? new Date(order.paidAt).toLocaleString('zh-CN') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 用户管理 */}
      {activeTab === 'users' && (
        <div>
          <h2 className="text-xl font-semibold mb-6">用户管理</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">用户管理功能开发中...</p>
          </div>
        </div>
      )}

      {/* 编辑套餐弹窗 */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {editingPlan.planCode ? '编辑套餐' : '新建套餐'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">套餐代码</label>
                <input
                  type="text"
                  value={editingPlan.planCode}
                  onChange={(e) => setEditingPlan({ ...editingPlan, planCode: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="如：TRIAL, STANDARD"
                  disabled={!!editingPlan.planCode}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">套餐名称</label>
                <input
                  type="text"
                  value={editingPlan.planName}
                  onChange={(e) => setEditingPlan({ ...editingPlan, planName: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="如：试用版，标准版"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">价格</label>
                  <input
                    type="number"
                    value={editingPlan.price}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">周期</label>
                  <select
                    value={editingPlan.period}
                    onChange={(e) => setEditingPlan({ ...editingPlan, period: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="day">天</option>
                    <option value="month">月</option>
                    <option value="year">年</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">每日候选</label>
                  <input
                    type="number"
                    value={editingPlan.dailyCandidates}
                    onChange={(e) => setEditingPlan({ ...editingPlan, dailyCandidates: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">自选股上限</label>
                  <input
                    type="number"
                    value={editingPlan.watchlistLimit}
                    onChange={(e) => setEditingPlan({ ...editingPlan, watchlistLimit: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingPlan.isEnabled}
                    onChange={(e) => setEditingPlan({ ...editingPlan, isEnabled: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">启用</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleSavePlan(editingPlan)}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                保存
              </button>
              <button
                onClick={() => setEditingPlan(null)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

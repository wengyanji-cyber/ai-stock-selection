import { useState, useEffect } from 'react'

interface MembershipStats {
  planName: string
  isTrial: boolean
  trialDaysRemaining: number
  features: {
    dailyCandidates: number
    watchlistLimit: number
    diagnosisDepth: string
    pushNotifications: boolean
    dataExport: boolean
    strategyBacktest: boolean
  }
}

interface PaymentOrder {
  orderNo: string
  amount: string
  planName: string
  status: string
  paidAt: string | null
  createdAt: string
}

export function SubscriptionPage() {
  const token = localStorage.getItem('token')
  const [stats, setStats] = useState<MembershipStats | null>(null)
  const [orders, setOrders] = useState<PaymentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSubscriptionData()
  }, [])

  async function loadSubscriptionData() {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch('/api/v1/membership/stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/v1/payment/orders', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const statsData = await statsRes.json()
      const ordersData = await ordersRes.json()

      setStats(statsData.data)
      setOrders(ordersData.data)
    } catch (error) {
      console.error('Failed to load subscription data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpgrade(planCode: string) {
    try {
      const res = await fetch('/api/v1/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planCode, paymentMethod: 'wechat' }),
      })

      const data = await res.json()
      if (data.data) {
        alert(`订单创建成功：${data.data.orderNo}\n金额：¥${data.data.amount}\n请完成支付`)
        loadSubscriptionData()
      } else {
        alert(`创建失败：${data.error}`)
      }
    } catch (error) {
      console.error('Failed to create order:', error)
      alert('创建订单失败')
    }
  }

  if (loading) {
    return <div className="p-8">加载中...</div>
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">订阅管理</h1>

      {/* 当前套餐 */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">当前套餐</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-blue-600">{stats?.planName}</p>
            {stats?.isTrial && (
              <p className="text-sm text-gray-500 mt-1">
                试用剩余 {stats.trialDaysRemaining} 天
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-gray-600">每日候选</p>
            <p className="text-2xl font-semibold">{stats?.features.dailyCandidates} 只</p>
          </div>
        </div>
      </div>

      {/* 功能对比 */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">当前功能</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FeatureItem
            label="每日候选"
            value={stats?.features.dailyCandidates || 0}
            unit="只"
          />
          <FeatureItem
            label="自选股上限"
            value={stats?.features.watchlistLimit || 0}
            unit="只"
          />
          <FeatureItem
            label="诊断深度"
            value={stats?.features.diagnosisDepth || 'basic'}
            type="text"
          />
          <FeatureItem
            label="推送通知"
            value={stats?.features.pushNotifications ? '✓' : '✗'}
            type="text"
          />
          <FeatureItem
            label="数据导出"
            value={stats?.features.dataExport ? '✓' : '✗'}
            type="text"
          />
          <FeatureItem
            label="策略回测"
            value={stats?.features.strategyBacktest ? '✓' : '✗'}
            type="text"
          />
        </div>
      </div>

      {/* 套餐升级 */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">升级套餐</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PlanCard
            name="观察版"
            price={99}
            period="月"
            features={['5 只候选/天', '50 只自选股', '数据导出']}
            onUpgrade={() => handleUpgrade('OBSERVER')}
          />
          <PlanCard
            name="标准版"
            price={299}
            period="月"
            features={['10 只候选/天', '200 只自选股', '深度诊断', '策略回测', '推送通知']}
            onUpgrade={() => handleUpgrade('STANDARD')}
            highlight
          />
          <PlanCard
            name="高级版"
            price={999}
            period="月"
            features={['无限候选', '无限自选股', '专属客服', 'API 访问']}
            onUpgrade={() => handleUpgrade('ADVANCED')}
          />
        </div>
      </div>

      {/* 订单历史 */}
      {orders.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">订单历史</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">订单号</th>
                  <th className="text-left py-3 px-4">套餐</th>
                  <th className="text-left py-3 px-4">金额</th>
                  <th className="text-left py-3 px-4">状态</th>
                  <th className="text-left py-3 px-4">时间</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.orderNo} className="border-b">
                    <td className="py-3 px-4 font-mono text-sm">{order.orderNo}</td>
                    <td className="py-3 px-4">{order.planName}</td>
                    <td className="py-3 px-4">¥{order.amount}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function FeatureItem({
  label,
  value,
  unit,
  type = 'number',
}: {
  label: string
  value: number | string
  unit?: string
  type?: 'number' | 'text'
}) {
  return (
    <div className="text-center p-4 bg-gray-50 rounded-lg">
      <p className="text-gray-600 text-sm mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-800">
        {type === 'number' ? `${value}${unit || ''}` : value}
      </p>
    </div>
  )
}

function PlanCard({
  name,
  price,
  period,
  features,
  onUpgrade,
  highlight,
}: {
  name: string
  price: number
  period: string
  features: string[]
  onUpgrade: () => void
  highlight?: boolean
}) {
  return (
    <div
      className={`p-6 rounded-lg border-2 ${
        highlight ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      }`}
    >
      <h3 className="text-xl font-bold mb-2">{name}</h3>
      <p className="text-3xl font-bold text-blue-600 mb-1">
        ¥{price}
        <span className="text-sm text-gray-500">/{period}</span>
      </p>
      <ul className="space-y-2 my-6">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onUpgrade}
        className={`w-full py-3 rounded-lg font-semibold ${
          highlight
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
        }`}
      >
        立即升级
      </button>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-gray-100 text-gray-800',
  }

  const statusLabels: Record<string, string> = {
    PENDING: '待支付',
    PAID: '已支付',
    FAILED: '支付失败',
    EXPIRED: '已过期',
  }

  return (
    <span className={`px-3 py-1 rounded-full text-sm ${statusMap[status] || ''}`}>
      {statusLabels[status] || status}
    </span>
  )
}

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

type StockChartProps = {
  data: {
    dates: string[]
    prices: number[]
    volumes?: number[]
  }
  predictions?: {
    current: number
    target1d: number
    target3d: number
    target5d: number
  }
}

function StockChart({ data, predictions }: StockChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // 初始化图表
    chartInstance.current = echarts.init(chartRef.current)

    // 生成模拟K线数据（如果没有提供）
    const klineData = generateKlineData(data.prices)
    
    // 预测线数据
    const predictionData = predictions ? [
      { name: '当前', value: predictions.current, x: klineData.length - 1 },
      { name: '1日', value: predictions.target1d, x: klineData.length },
      { name: '3日', value: predictions.target3d, x: klineData.length + 2 },
      { name: '5日', value: predictions.target5d, x: klineData.length + 4 },
    ] : []

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '10%',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: '#ccc',
        borderWidth: 1,
        textStyle: {
          color: '#333',
        },
      },
      legend: {
        data: ['K线', '预测'],
        top: '5%',
        textStyle: {
          color: '#666',
        },
      },
      xAxis: {
        type: 'category',
        data: [...data.dates, '1日', '3日', '5日'],
        axisLine: {
          lineStyle: {
            color: '#ddd',
          },
        },
        axisLabel: {
          color: '#666',
          fontSize: 10,
        },
      },
      yAxis: {
        type: 'value',
        scale: true,
        axisLine: {
          lineStyle: {
            color: '#ddd',
          },
        },
        axisLabel: {
          color: '#666',
          formatter: (value: number) => `¥${value.toFixed(0)}`,
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0',
          },
        },
      },
      series: [
        {
          name: 'K线',
          type: 'candlestick',
          data: klineData,
          itemStyle: {
            color: '#ef4444', // 涨 - 红色
            color0: '#22c55e', // 跌 - 绿色
            borderColor: '#ef4444',
            borderColor0: '#22c55e',
          },
        },
        ...(predictions ? [{
          name: '预测',
          type: 'line',
          data: [
            ...Array(klineData.length - 1).fill(null),
            predictions.current,
            predictions.target1d,
            null,
            predictions.target3d,
            null,
            predictions.target5d,
          ],
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            color: '#3b82f6',
            width: 2,
            type: 'dashed',
          },
          itemStyle: {
            color: '#3b82f6',
          },
        }] : []),
      ],
    }

    chartInstance.current.setOption(option)

    // 响应式
    const handleResize = () => {
      chartInstance.current?.resize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chartInstance.current?.dispose()
    }
  }, [data, predictions])

  // 生成模拟K线数据
  function generateKlineData(prices: number[]) {
    const klineData: number[][] = []
    let basePrice = prices[0] || 100

    for (let i = 0; i < (prices.length || 30); i++) {
      const open = basePrice
      const close = prices[i] || basePrice * (1 + (Math.random() - 0.5) * 0.04)
      const low = Math.min(open, close) * (1 - Math.random() * 0.02)
      const high = Math.max(open, close) * (1 + Math.random() * 0.02)
      
      klineData.push([
        parseFloat(open.toFixed(2)),
        parseFloat(close.toFixed(2)),
        parseFloat(low.toFixed(2)),
        parseFloat(high.toFixed(2)),
      ])
      
      basePrice = close
    }

    return klineData
  }

  return (
    <div 
      ref={chartRef} 
      style={{ 
        width: '100%', 
        height: '300px',
        background: '#f8fafc',
        borderRadius: '8px',
      }} 
    />
  )
}

export default StockChart

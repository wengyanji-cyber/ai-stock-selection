#!/bin/bash
# AI Stock Selection - 定时任务执行脚本
# 用于触发数据抓取、分析等任务

set -e

PROJECT_ROOT="/root/.openclaw/workspace/ai-stock-selection"
API_BASE="http://127.0.0.1:3010"

echo "=== 执行定时任务 ==="
echo "时间：$(date)"

# 获取管理员 token（用于触发任务）
# 实际使用时应该从配置文件读取
TOKEN="admin_token_here"

case "${1:-all}" in
  "fetch")
    echo "触发数据抓取任务..."
    curl -s -X POST "$API_BASE/api/v1/jobs/demo-dispatch" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json"
    echo ""
    echo "✅ 数据抓取任务已触发"
    ;;
  
  "analyze")
    echo "触发数据分析任务..."
    curl -s -X POST "$API_BASE/api/v1/jobs/demo-dispatch" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json"
    echo ""
    echo "✅ 数据分析任务已触发"
    ;;
  
  "all")
    echo "触发所有任务..."
    curl -s -X POST "$API_BASE/api/v1/jobs/demo-dispatch" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json"
    echo ""
    echo "✅ 所有任务已触发"
    ;;
  
  *)
    echo "用法：$0 [fetch|analyze|all]"
    exit 1
    ;;
esac

echo "完成时间：$(date)"

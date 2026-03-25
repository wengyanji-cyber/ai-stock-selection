#!/bin/bash
# AI Stock Selection - 健康检查脚本
# 用于监控服务状态，异常时自动重启

set -e

API_BASE="http://127.0.0.1:3010"
RESTART_SCRIPT="/root/.openclaw/workspace/ai-stock-selection/scripts/restart.sh"

echo "=== 服务健康检查 ==="
echo "时间：$(date)"

# 检查后端服务
echo "检查后端 API..."
if curl -s --connect-timeout 5 "$API_BASE/api/health" > /dev/null; then
    echo "✅ 后端服务正常"
else
    echo "❌ 后端服务异常，尝试重启..."
    $RESTART_SCRIPT
    echo "✅ 服务已重启"
fi

# 检查 Redis 连接
echo "检查 Redis..."
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis 正常"
else
    echo "❌ Redis 异常"
fi

# 检查 MySQL 连接
echo "检查 MySQL..."
if mysql -u root -e "SELECT 1" > /dev/null 2>&1; then
    echo "✅ MySQL 正常"
else
    echo "❌ MySQL 异常"
fi

echo "=== 健康检查完成 ==="
echo "完成时间：$(date)"

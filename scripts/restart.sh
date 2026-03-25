#!/bin/bash
# AI Stock Selection - 服务重启脚本

set -e

PROJECT_ROOT="/root/.openclaw/workspace/ai-stock-selection"

echo "=== AI Stock Selection 服务重启 ==="
echo "重启时间：$(date)"

# 停止旧服务
$PROJECT_ROOT/scripts/stop.sh

# 等待
sleep 2

# 启动新服务
$PROJECT_ROOT/scripts/start.sh

echo ""
echo "✅ 服务重启完成"

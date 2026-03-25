#!/bin/bash
# AI Stock Selection - 服务停止脚本

set -e

echo "=== AI Stock Selection 服务停止 ==="
echo "停止时间：$(date)"

# 停止所有相关进程
echo "停止后端服务..."
pkill -f "node.*main.js" 2>/dev/null || true

echo "停止 Worker 服务..."
pkill -f "tsx.*worker" 2>/dev/null || true

echo "停止前端开发服务..."
pkill -f "vite" 2>/dev/null || true

sleep 2
echo "✅ 所有服务已停止"

#!/bin/bash
# AI Stock Selection - 生产环境启动脚本
# 用于系统启动时自动运行所有服务

set -e

PROJECT_ROOT="/root/.openclaw/workspace/ai-stock-selection"
LOG_DIR="/var/log/ai-stock"

# 创建日志目录
mkdir -p $LOG_DIR

echo "=== AI Stock Selection 服务启动 ==="
echo "启动时间：$(date)"

# 停止旧进程
echo "停止旧进程..."
pkill -f "node.*main.js" 2>/dev/null || true
pkill -f "tsx.*worker" 2>/dev/null || true
sleep 2

# 启动后端服务
echo "启动后端 API 服务..."
cd $PROJECT_ROOT/ai-stock-service
nohup npm start > $LOG_DIR/service.log 2>&1 &
SERVICE_PID=$!
echo "后端服务 PID: $SERVICE_PID"

# 启动 Worker 服务
echo "启动 Worker 服务..."
cd $PROJECT_ROOT/ai-stock-service
nohup npm run worker:demo > $LOG_DIR/worker.log 2>&1 &
WORKER_PID=$!
echo "Worker 服务 PID: $WORKER_PID"

# 等待服务启动
echo "等待服务启动..."
sleep 5

# 检查服务状态
if curl -s http://127.0.0.1:3010/api/health > /dev/null; then
    echo "✅ 后端服务启动成功"
else
    echo "❌ 后端服务启动失败"
    exit 1
fi

echo ""
echo "=== 服务启动完成 ==="
echo "后端 API: http://106.52.6.176:3010"
echo "Worker 服务：运行中"
echo "日志目录：$LOG_DIR"
echo ""

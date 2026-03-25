#!/bin/bash
# AI Stock Selection - 数据清理脚本
# 清理过期的日志、缓存等数据

set -e

LOG_DIR="/var/log/ai-stock"
RETENTION_DAYS=30

echo "=== 清理过期数据 ==="
echo "时间：$(date)"
echo "保留天数：$RETENTION_DAYS"

# 清理旧日志
if [ -d "$LOG_DIR" ]; then
    echo "清理旧日志文件..."
    find $LOG_DIR -name "*.log" -type f -mtime +$RETENTION_DAYS -delete
    echo "✅ 日志清理完成"
fi

# 清理数据库过期数据（需要时添加）
echo "清理数据库过期数据..."
# mysql -u root -e "DELETE FROM ai_stock.JobRun WHERE createdAt < DATE_SUB(NOW(), INTERVAL $RETENTION_DAYS DAY);"

echo "✅ 数据清理完成"
echo "完成时间：$(date)"

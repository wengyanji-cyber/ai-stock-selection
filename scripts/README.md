# AI Stock Selection - 运维脚本说明

## 📁 脚本列表

| 脚本 | 用途 | 说明 |
|------|------|------|
| `start.sh` | 启动服务 | 启动后端 API 和 Worker 服务 |
| `stop.sh` | 停止服务 | 停止所有相关服务 |
| `restart.sh` | 重启服务 | 完整重启所有服务 |
| `dispatch-jobs.sh` | 触发任务 | 手动触发数据抓取/分析任务 |
| `cleanup.sh` | 清理数据 | 清理过期日志和缓存 |
| `healthcheck.sh` | 健康检查 | 检查服务状态，异常时自动重启 |
| `crontab.txt` | 定时任务 | Cron 配置模板 |

## 🚀 快速开始

### 启动服务
```bash
./scripts/start.sh
```

### 停止服务
```bash
./scripts/stop.sh
```

### 重启服务
```bash
./scripts/restart.sh
```

### 查看日志
```bash
tail -f /var/log/ai-stock/service.log
tail -f /var/log/ai-stock/worker.log
tail -f /var/log/ai-stock/cron.log
```

## ⏰ 配置定时任务

1. 编辑 crontab：
```bash
crontab -e
```

2. 添加配置：
```bash
# 复制 crontab.txt 内容
cat /root/.openclaw/workspace/ai-stock-selection/scripts/crontab.txt >> ~/.crontab
crontab ~/.crontab
```

3. 验证配置：
```bash
crontab -l
```

## 📊 健康检查

手动执行健康检查：
```bash
./scripts/healthcheck.sh
```

配置定时健康检查（每 5 分钟）：
```bash
*/5 * * * * /root/.openclaw/workspace/ai-stock-selection/scripts/healthcheck.sh >> /var/log/ai-stock/healthcheck.log 2>&1
```

## 🔧 手动触发任务

触发数据抓取：
```bash
./scripts/dispatch-jobs.sh fetch
```

触发数据分析：
```bash
./scripts/dispatch-jobs.sh analyze
```

触发所有任务：
```bash
./scripts/dispatch-jobs.sh all
```

## 📝 日志管理

日志位置：`/var/log/ai-stock/`

- `service.log` - 后端 API 日志
- `worker.log` - Worker 服务日志
- `cron.log` - 定时任务日志
- `healthcheck.log` - 健康检查日志

清理 30 天前的日志：
```bash
./scripts/cleanup.sh
```

## ⚠️ 注意事项

1. 首次运行需要创建日志目录：
```bash
sudo mkdir -p /var/log/ai-stock
sudo chmod 755 /var/log/ai-stock
```

2. 确保脚本有执行权限：
```bash
chmod +x scripts/*.sh
```

3. 生产环境请修改 API token 和数据库配置

4. 定时任务仅在交易日执行（周一至周五）

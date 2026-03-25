# AI Stock Selection - 部署文档

## 📋 项目概述

AI 选股系统 - 基于实时行情的股票分析和推荐平台

### 技术栈
- **后端**: Node.js + Fastify + Prisma + MySQL + Redis + BullMQ
- **前端**: React + TypeScript + Vite + Ant Design
- **部署**: Linux + PM2/Nohup

---

## 🚀 快速部署

### 1. 环境要求
- Node.js 22+
- MySQL 8.0+
- Redis 7.0+
- Git

### 2. 克隆项目
```bash
cd /root/.openclaw/workspace
git clone https://github.com/wengyanji-cyber/ai-stock-selection.git
cd ai-stock-selection
```

### 3. 安装依赖
```bash
# 后端
cd ai-stock-service
npm install

# 管理后台
cd ../ai-stock-admin-web
npm install

# 用户端
cd ../ai-stock-web
npm install
```

### 4. 配置环境变量
```bash
# 后端配置
cd ai-stock-service
cp .env.example .env
# 编辑 .env 文件，配置数据库和 Redis 连接
```

### 5. 数据库初始化
```bash
cd ai-stock-service
npx prisma generate
npx prisma migrate dev --name init
```

### 6. 启动服务
```bash
# 使用启动脚本
./scripts/start.sh

# 或手动启动
# 后端
cd ai-stock-service && npm start &

# Worker
cd ai-stock-service && npm run worker:demo &

# 管理后台
cd ai-stock-admin-web && npm run dev -- --host 0.0.0.0 &

# 用户端
cd ai-stock-web && npm run dev -- --host 0.0.0.0 &
```

---

## 🌐 访问地址

| 服务 | 端口 | 地址 |
|------|------|------|
| 后端 API | 3010 | http://106.52.6.176:3010 |
| 管理后台 | 5173 | http://106.52.6.176:5173 |
| 用户端 | 5174 | http://106.52.6.176:5174 |

### 默认账号

**管理后台:**
- 账号：`admin_root`
- 密码：`admin123456`

**用户端:**
- 账号：`demo_user`
- 密码：`demo123456`

---

## 📁 目录结构

```
ai-stock-selection/
├── ai-stock-service/        # 后端服务
│   ├── src/
│   │   ├── modules/        # 业务模块
│   │   ├── workers/        # Worker 任务
│   │   └── lib/            # 工具库
│   ├── prisma/             # 数据库 Schema
│   └── .env                # 环境配置
├── ai-stock-admin-web/     # 管理后台
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   └── components/    # 通用组件
│   └── dist/              # 构建输出
├── ai-stock-web/          # 用户端
│   ├── src/
│   │   ├── pages/        # 页面组件
│   │   └── components/   # 通用组件
│   └── dist/             # 构建输出
├── scripts/               # 运维脚本
│   ├── start.sh          # 启动脚本
│   ├── stop.sh           # 停止脚本
│   ├── restart.sh        # 重启脚本
│   ├── healthcheck.sh    # 健康检查
│   └── dispatch-jobs.sh  # 任务触发
└── docs/                  # 文档
```

---

## 🔧 运维管理

### 服务管理
```bash
./scripts/start.sh      # 启动服务
./scripts/stop.sh       # 停止服务
./scripts/restart.sh    # 重启服务
./scripts/healthcheck.sh # 健康检查
```

### 日志查看
```bash
tail -f /var/log/ai-stock/service.log   # 后端日志
tail -f /var/log/ai-stock/worker.log    # Worker 日志
tail -f /var/log/ai-stock/cron.log      # 定时任务日志
```

### 定时任务
```bash
# 安装 crontab
crontab scripts/crontab.txt

# 查看配置
crontab -l
```

---

## 📊 数据库表

| 表名 | 说明 |
|------|------|
| AppUser | 用户账号 |
| MarketDailyBar | 市场日线数据 |
| CandidatePoolSnapshot | 候选池快照 |
| CandidateSignal | 候选信号 |
| DiagnosisSnapshot | 诊断快照 |
| WatchlistItem | 自选观察项 |
| JobRun | 任务执行记录 |
| UserSession | 用户会话 |
| PushTask | 推送任务 |
| ModelRuleConfig | 模型规则配置 |
| SourceSnapshot | 数据源快照 |

---

## 🔐 安全配置

### 防火墙配置
开放端口：3010, 5173, 5174
```bash
# 腾讯云安全组添加入站规则
端口：3010, 5173, 5174
协议：TCP
来源：0.0.0.0/0
```

### 数据库安全
- 设置 MySQL root 密码
- 限制远程访问
- 定期备份数据

### API 安全
- JWT Token 认证
- CORS 跨域配置
- 请求频率限制

---

## 🐛 故障排查

### 服务无法启动
```bash
# 查看日志
tail -100 /var/log/ai-stock/service.log

# 检查端口占用
netstat -tlnp | grep 3010

# 检查 Node 版本
node --version  # 需要 22+
```

### 数据库连接失败
```bash
# 检查 MySQL 状态
mysql -u root -e "SHOW DATABASES;"

# 检查连接配置
cat ai-stock-service/.env | grep DATABASE_URL
```

### Worker 不执行任务
```bash
# 查看 Worker 日志
tail -100 /var/log/ai-stock/worker.log

# 检查 Redis 连接
redis-cli ping

# 重启 Worker
pkill -f worker:demo
cd ai-stock-service && npm run worker:demo &
```

---

## 📈 性能优化

### 数据库优化
- 添加索引（已配置）
- 定期清理过期数据
- 使用连接池

### 缓存优化
- Redis 缓存热点数据
- 会话 Token 缓存
- 队列任务缓存

### 前端优化
- Vite 构建优化
- 代码分割
- 静态资源 CDN

---

## 📝 更新日志

### v0.1.0 (2026-03-25)
- ✅ 完成生产环境部署
- ✅ 启动 Worker 服务
- ✅ 添加运维脚本
- ✅ 优化用户界面文案
- ✅ 新增系统状态监控
- ✅ 新增股票详情页

---

## 📞 技术支持

- GitHub: https://github.com/wengyanji-cyber/ai-stock-selection
- 问题反馈：提交 Issue

# AI Stock Selection - 部署报告

## ✅ 部署完成时间
2026-03-25 14:18

## 📦 已部署组件

### 1. 后端服务 (ai-stock-service)
- **状态**: ✅ 运行中
- **端口**: 3010
- **访问地址**: http://127.0.0.1:3010
- **健康检查**: http://127.0.0.1:3010/api/health

### 2. 管理后台 (ai-stock-admin-web)
- **状态**: ✅ 构建完成
- **构建输出**: `/root/.openclaw/workspace/ai-stock-selection/ai-stock-admin-web/dist`
- **部署建议**: 使用 Nginx 或 Vite Preview 服务

### 3. 用户端 (ai-stock-web)
- **状态**: ✅ 构建完成
- **构建输出**: `/root/.openclaw/workspace/ai-stock-selection/ai-stock-web/dist`
- **部署建议**: 使用 Nginx 或 Vite Preview 服务

## 🗄️ 数据库

### MySQL
- **数据库**: ai_stock
- **连接**: mysql://root@127.0.0.1:3306/ai_stock
- **迁移状态**: ✅ 已完成 (20260325061716_init)

### Redis
- **连接**: redis://127.0.0.1:6379
- **状态**: ✅ 运行中

## 🚀 启动命令

### 后端服务
```bash
cd /root/.openclaw/workspace/ai-stock-selection/ai-stock-service
npm start
```

### 管理后台 (开发模式)
```bash
cd /root/.openclaw/workspace/ai-stock-selection/ai-stock-admin-web
npm run dev
```

### 用户端 (开发模式)
```bash
cd /root/.openclaw/workspace/ai-stock-selection/ai-stock-web
npm run preview
```

## 📝 配置文件

后端环境变量位于：
`/root/.openclaw/workspace/ai-stock-selection/ai-stock-service/.env`

```
PORT=3010
HOST=0.0.0.0
LOG_LEVEL=info
APP_ENV=prod
DATABASE_URL="mysql://root@127.0.0.1:3306/ai_stock"
REDIS_URL="redis://127.0.0.1:6379"
```

## ⚠️ 注意事项

1. **MySQL 密码**: 当前使用无密码 root 用户，生产环境建议设置密码
2. **前端服务**: 构建产物在 dist 目录，需要用 Web 服务器托管
3. **防火墙**: 如需外部访问，请开放 3010 端口

## 📊 API 测试

```bash
# 健康检查
curl http://127.0.0.1:3010/api/health

# 预期响应
{"ok":true,"app":"ai-stock-service","env":"prod","timestamp":"..."}
```

---
部署完成！🎉

# ai-stock-service

AI 选股项目第一版后端骨架，当前包含：

- Fastify HTTP 服务
- Prisma + MySQL schema 初版
- BullMQ + Redis 队列连接占位
- 用户端和管理端数据库驱动接口
- watchlist / model rule 独立业务表
- demo worker 与任务投递接口

## 本地启动

1. 复制 `.env.example` 为 `.env`
2. 安装依赖：`npm install`
3. 生成 Prisma Client：`npm run prisma:generate`
4. 初始化数据库表和演示数据：`npm run db:setup`
5. 启动开发服务：`npm run dev`

## 当前接口

- `GET /api/health`
- `GET /api/v1/web/demo-data`
- `GET /api/v1/market/overview`
- `GET /api/v1/candidates`
- `GET /api/v1/watchlist`
- `POST /api/v1/watchlist`
- `DELETE /api/v1/watchlist/:stockCode`
- `GET /api/v1/admin/demo-data`
- `GET /api/v1/admin/summary`
- `GET /api/v1/admin/model-rules`
- `PATCH /api/v1/admin/model-rules/:ruleCode`
- `GET /api/v1/jobs/queues`
- `GET /api/v1/jobs/runs`
- `POST /api/v1/jobs/demo-dispatch`

## 当前已落地数据表

- `SourceSnapshot`
- `MarketDailyBar`
- `CandidatePoolSnapshot`
- `CandidateSignal`
- `DiagnosisSnapshot`
- `ReviewSnapshot`
- `AppUser`
- `PushTask`
- `JobRun`
- `WatchlistItem`
- `ModelRuleConfig`

## 前端联调

- 用户端默认读取 `VITE_AI_STOCK_API_BASE_URL`，未配置时指向 `http://127.0.0.1:3010`
- 管理端默认读取 `VITE_AI_STOCK_API_BASE_URL`，未配置时指向 `http://127.0.0.1:3010`
- 当前前后端均支持接口失败后自动回退本地 mock 数据

## 数据库初始化

- 执行建表：`npm run db:migrate`
- 执行附加业务表迁移：`npm run db:migrate:watch-model`
- 导入演示数据：`npm run db:seed`
- 一键执行：`npm run db:setup`

## Worker

- 启动演示 worker：`npm run worker:demo`
- 通过 `POST /api/v1/jobs/demo-dispatch` 可投递一组抓取 / 分析 / 推送演示任务

## 下一步建议

- 接入 MySQL 并执行第一版迁移
- 接入 Redis，并把抓取/分析任务挂到 BullMQ
- 将前端 mock service 切换为异步 HTTP 调用
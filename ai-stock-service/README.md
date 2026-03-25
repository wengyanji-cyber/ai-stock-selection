# ai-stock-service

AI 选股项目后端服务，当前包含：

- Fastify HTTP 服务
- Prisma + MySQL schema 初版
- BullMQ + Redis 队列与 worker 执行链路
- 用户端和管理端数据库驱动接口
- watchlist / model rule 独立业务表
- 多源行情抓取、降级分析与任务投递接口

## 本地启动

1. 复制 `.env.example` 为 `.env`
2. 安装依赖：`npm install`
3. 生成 Prisma Client：`npm run prisma:generate`
4. 初始化数据库表和演示数据：`npm run db:setup`
5. 启动开发服务：`npm run dev`

`npm run db:setup` 已支持重复执行：若表、字段或索引已存在，会跳过对应迁移并继续执行 seed。

## 当前接口

- `GET /api/health`
- `POST /api/v1/auth/trial-login`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/users/password`
- `GET /api/v1/users/profile`
- `GET /api/v1/web/demo-data`
- `GET /api/v1/market/home`
- `GET /api/v1/market/overview`
- `GET /api/v1/candidates`
- `GET /api/v1/candidates/detail`
- `GET /api/v1/diagnoses`
- `GET /api/v1/reviews/latest`
- `GET /api/v1/watchlist`
- `POST /api/v1/watchlist`
- `PATCH /api/v1/watchlist/:stockCode`
- `DELETE /api/v1/watchlist/:stockCode`
- `GET /api/v1/admin/demo-data`
- `GET /api/v1/admin/summary`
- `GET /api/v1/admin/users`
- `PATCH /api/v1/admin/users/:userCode`
- `DELETE /api/v1/admin/users/:userCode`
- `POST /api/v1/admin/users/:userCode/reset-password`
- `GET /api/v1/admin/compliance`
- `GET /api/v1/admin/model-rules`
- `POST /api/v1/admin/model-rules`
- `PATCH /api/v1/admin/model-rules/:ruleCode`
- `DELETE /api/v1/admin/model-rules/:ruleCode`
- `GET /api/v1/jobs/queues`
- `GET /api/v1/jobs/runs`
- `POST /api/v1/jobs/demo-dispatch`
- `POST /api/v1/jobs/cleanup-failed`

## 当前已落地数据表

- `SourceSnapshot`
- `MarketDailyBar`
- `CandidatePoolSnapshot`
- `CandidateSignal`
- `DiagnosisSnapshot`
- `ReviewSnapshot`
- `AppUser`
- `UserSession`
- `PushTask`
- `JobRun`
- `WatchlistItem`
- `ModelRuleConfig`

## 前端联调

- 用户端默认读取 `VITE_AI_STOCK_API_BASE_URL`，未配置时指向 `http://127.0.0.1:3010`
- 管理端默认读取 `VITE_AI_STOCK_API_BASE_URL`，未配置时指向 `http://127.0.0.1:3010`
- 当前前后端均支持接口失败后自动回退本地 mock 数据
- 用户端登录后通过 Bearer Token 访问 `users/profile` 与 `watchlist` 等受保护接口
- 用户端进入受保护页面时会自动调用 `auth/refresh` 续期会话，失效后自动跳回登录页
- 用户端已支持已登录用户主动修改密码，修改后会撤销旧会话并签发新会话
- 管理端登录后通过 Bearer Token 访问 `admin/*` 受保护接口，且要求 `roleCode=ADMIN`
- `jobs/*` 任务接口同样要求管理员会话，避免匿名读取任务状态
- 管理端已支持直接为指定用户重置密码，重置后该用户旧会话会失效

## 数据库初始化

- 执行建表：`npm run db:migrate`
- 执行附加业务表迁移：`npm run db:migrate:watch-model`
- 执行鉴权会话表迁移：`npm run db:migrate:auth`
- 执行账号密码与角色字段迁移：`npm run db:migrate:account`
- 执行密码字段长度修复：`npm run db:migrate:account-fix`
- 导入演示数据：`npm run db:seed`
- 一键执行：`npm run db:setup`

## Worker

- 启动演示 worker：`npm run worker:demo`
- 通过 `POST /api/v1/jobs/demo-dispatch` 可投递一组抓取 / 分析 / 推送演示任务
- 通过 `POST /api/v1/jobs/cleanup-failed` 可清理 BullMQ 队列中的历史失败任务，以及数据库中的失败 `JobRun` 记录
- `market-fetch` 优先尝试 Eastmoney，失败后回退到 Sina 代表性样本，再失败时回退到内置演示行情
- `market-analyze` 会优先分析当日行情；若当日行情缺失，会回补最近一次可用行情，仍无数据时再回退到内置演示行情

## 当前说明

- 鉴权、会话、管理员权限控制已落地
- 真实行情抓取受外部源可用性影响，当前采用“真实源优先 + 备用源 + 内置回退”策略保证任务链路稳定
- 当前输出仍属于公开行情的粗粒度辅助分析，不构成收益承诺或交易建议
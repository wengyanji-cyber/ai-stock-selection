# ai-stock

AI 选股项目工作区。

## 当前目录

- `ai-stock-service`: Node.js 后端服务骨架，负责 API、任务编排、MySQL/Redis 接入

## 已完成

- 后端项目初始化
- 健康检查接口
- 市场概览与候选池演示接口
- 管理端汇总演示接口
- Prisma MySQL schema 初版
- BullMQ 队列探活占位

## 下一步

- 建第一版 Prisma migration
- 增加抓取任务、分析任务、推送任务 worker
- 让 `ai-stock-web` 和 `ai-stock-admin-web` 改走真实 HTTP 接口
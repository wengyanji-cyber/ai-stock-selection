# AI选股数据样例与接口字段字典

## 1. 文档目的

本文件用于统一首版 AI 选股产品在前后端联调、数据落库、候选生成、个股诊断、页面展示中的字段定义，减少团队对字段含义和命名的理解偏差。

本文件覆盖三部分内容：

1. 页面展示所需核心字段。
2. 接口输入输出建议。
3. 演示数据样例。

## 2. 字段设计原则

首版字段设计建议遵循以下原则：

1. 字段名保持稳定，避免频繁改名。
2. 优先表达业务含义，而不是数据库习惯缩写。
3. 一类信息只保留一个主字段，避免重复解释。
4. 页面展示字段和内部计算字段尽量分开。

## 3. 股票基础信息字段

建议字段如下：

1. stockCode：股票代码。
2. stockName：股票名称。
3. market：市场，首版固定为 A 股。
4. exchange：交易所，例如 SH、SZ。
5. industryName：行业名称。
6. conceptTags：概念标签列表。

示例：

```json
{
  "stockCode": "300001",
  "stockName": "示例科技",
  "market": "A",
  "exchange": "SZ",
  "industryName": "AI算力链",
  "conceptTags": ["算力", "人工智能", "高景气"]
}
```

## 4. 行情快照字段

建议字段如下：

1. tradeDate：交易日期。
2. openPrice：开盘价。
3. closePrice：收盘价。
4. highPrice：最高价。
5. lowPrice：最低价。
6. changePercent：涨跌幅。
7. volume：成交量。
8. turnoverAmount：成交额。
9. turnoverRate：换手率。
10. amplitude：振幅。
11. limitStatus：涨跌停状态。

示例：

```json
{
  "tradeDate": "2026-03-24",
  "openPrice": 18.42,
  "closePrice": 19.36,
  "highPrice": 19.88,
  "lowPrice": 18.10,
  "changePercent": 5.12,
  "volume": 1856231,
  "turnoverAmount": 356000000,
  "turnoverRate": 8.43,
  "amplitude": 9.67,
  "limitStatus": "none"
}
```

## 5. 板块信息字段

建议字段如下：

1. sectorCode：板块代码。
2. sectorName：板块名称。
3. sectorType：板块类型，例如行业、概念。
4. heatLevel：热度等级。
5. heatScore：热度分值。
6. trendStatus：强弱状态。
7. mainReason：主要关注理由。
8. riskHint：主要风险提示。

示例：

```json
{
  "sectorCode": "AI001",
  "sectorName": "AI算力链",
  "sectorType": "concept",
  "heatLevel": "high",
  "heatScore": 87,
  "trendStatus": "持续强势",
  "mainReason": "板块近两日热度明显升温，龙头联动性较强。",
  "riskHint": "部分高位个股波动放大，追高容错率下降。"
}
```

## 6. 候选股结果字段

这是页面和产品最核心的一组字段。

建议字段如下：

1. stockCode：股票代码。
2. stockName：股票名称。
3. sectorName：所属板块。
4. candidateLevel：候选级别，重点候选或扩展观察。
5. summary：一句话结论。
6. reasonList：关注理由列表。
7. observeMinPrice：观察区间下沿。
8. observeMaxPrice：观察区间上沿。
9. supportPrice：支撑位。
10. pressurePrice：压力位。
11. stopLossPrice：止损位。
12. invalidCondition：失效条件。
13. riskTags：风险标签列表。
14. opportunityScore：机会分。
15. heatScore：热度分。
16. stabilityScore：稳定性分。
17. riskScore：风险扣分。
18. finalScore：综合分。

示例：

```json
{
  "stockCode": "300001",
  "stockName": "示例科技",
  "sectorName": "AI算力链",
  "candidateLevel": "core",
  "summary": "短线结构偏强，可关注回踩支撑后的承接表现。",
  "reasonList": [
    "所属板块持续升温，资金关注度较高。",
    "个股放量突破阶段高点，量价结构较顺。",
    "换手活跃但暂未出现明显放量滞涨。"
  ],
  "observeMinPrice": 18.6,
  "observeMaxPrice": 19.1,
  "supportPrice": 18.42,
  "pressurePrice": 20.15,
  "stopLossPrice": 17.98,
  "invalidCondition": "跌破支撑位且板块同步转弱。",
  "riskTags": ["高波动", "热点分歧风险"],
  "opportunityScore": 82,
  "heatScore": 87,
  "stabilityScore": 74,
  "riskScore": 18,
  "finalScore": 225
}
```

## 7. 个股诊断结果字段

建议字段如下：

1. stockCode：股票代码。
2. stockName：股票名称。
3. diagnosisSummary：一句话诊断。
4. trendLevel：趋势等级。
5. strengthLevel：强弱评级。
6. sectorName：所属板块。
7. observeRangeText：观察区间文本。
8. supportPrice：支撑位。
9. pressurePrice：压力位。
10. stopLossPrice：止损位。
11. mainReasons：主要理由列表。
12. riskHints：风险提示列表。
13. actionAdvice：操作建议。
14. latestStatus：最新状态。

示例：

```json
{
  "stockCode": "300001",
  "stockName": "示例科技",
  "diagnosisSummary": "当前仍处于短线强势区间，但位置偏高，更适合等待回踩确认。",
  "trendLevel": "uptrend",
  "strengthLevel": "strong",
  "sectorName": "AI算力链",
  "observeRangeText": "18.60 - 19.10",
  "supportPrice": 18.42,
  "pressurePrice": 20.15,
  "stopLossPrice": 17.98,
  "mainReasons": [
    "板块热度仍处于高位。",
    "个股结构未明显走坏。",
    "量价关系暂时保持协调。"
  ],
  "riskHints": [
    "短期涨幅偏大。",
    "若板块午后分歧扩大，易出现冲高回落。"
  ],
  "actionAdvice": "更适合观察回踩后的承接，不建议远离支撑位追高。",
  "latestStatus": "continue_watch"
}
```

## 8. 自选观察字段

建议字段如下：

1. stockCode：股票代码。
2. stockName：股票名称。
3. sectorName：所属板块。
4. watchStatus：当前观察状态。
5. statusLabel：状态文案。
6. statusChangeReason：状态变化原因。
7. latestAdvice：最新建议。
8. riskTags：风险标签。
9. updatedAt：更新时间。

示例：

```json
{
  "stockCode": "300002",
  "stockName": "示例智能",
  "sectorName": "机器人",
  "watchStatus": "warning",
  "statusLabel": "转弱预警",
  "statusChangeReason": "板块仍有热度，但个股量能未继续放大。",
  "latestAdvice": "若重新站稳关键位并放量，可继续观察，否则应降低预期。",
  "riskTags": ["热点降温风险"],
  "updatedAt": "2026-03-24 14:35:00"
}
```

## 9. 首页接口建议

建议接口名称：

`GET /api/stock-ai/home`

返回结构建议：

1. marketSummary：盘前一句话。
2. marketTags：状态标签。
3. sectorList：重点板块列表。
4. coreCandidates：重点候选列表。
5. riskReminders：风险提醒列表。

## 10. 候选池接口建议

建议接口名称：

`GET /api/stock-ai/candidates`

请求参数建议：

1. sectorName：按板块筛选。
2. candidateLevel：按候选级别筛选。
3. riskLevel：按风险等级筛选。
4. date：按日期查看。

返回结构建议：

1. date：查询日期。
2. filterInfo：筛选条件。
3. coreList：重点候选列表。
4. watchList：扩展观察列表。

## 11. 个股诊断接口建议

建议接口名称：

`GET /api/stock-ai/diagnosis`

请求参数建议：

1. stockCode：股票代码。

返回结构建议：

1. diagnosisResult：诊断结果对象。
2. relatedSectorInfo：相关板块信息。
3. disclaimer：辅助决策提示。

## 12. 自选观察接口建议

建议接口名称：

1. `GET /api/stock-ai/watchlist`
2. `POST /api/stock-ai/watchlist`
3. `DELETE /api/stock-ai/watchlist/{stockCode}`

返回字段应统一采用自选观察字段定义。

## 13. 复盘页接口建议

建议接口名称：

`GET /api/stock-ai/review`

返回结构建议：

1. reviewSummary：市场回顾。
2. sectorPerformance：板块表现。
3. candidateReviewList：候选表现列表。
4. riskReviewList：风险兑现列表。
5. nextFocus：明日关注方向。

## 14. 前端枚举值建议

建议统一以下枚举：

1. candidateLevel：`core`、`watch`
2. heatLevel：`low`、`medium`、`high`
3. watchStatus：`stronger`、`continue_watch`、`warning`、`breakdown`
4. trendLevel：`uptrend`、`sideways`、`weakening`
5. strengthLevel：`strong`、`neutral`、`weak`

## 15. 空状态文案建议

建议统一空状态：

1. 候选池为空：当前没有符合条件的高优先级候选，建议先观察热点变化。
2. 诊股为空：请输入股票代码或名称后查看诊断结果。
3. 自选为空：把你关心的股票加入观察列表，系统会持续跟踪其状态变化。

## 16. 联调注意事项

前后端联调时建议优先锁定以下内容：

1. 候选股字段顺序和命名。
2. 点位字段统一为数值型。
3. 风险标签统一为字符串数组。
4. 结论和理由统一由接口直接返回，避免前端拼接。

## 17. 结论

字段字典的价值不在于写得多，而在于把核心输出稳定下来。首版只要把首页、候选池、个股诊断、自选观察、复盘这五类数据结构锁住，研发效率就会明显提高。
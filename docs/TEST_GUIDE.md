# 订阅系统测试指南

## 📍 访问地址

**公网 IP**: http://106.52.6.176

| 服务 | 地址 |
|------|------|
| 后端 API | http://106.52.6.176:3010 |
| 用户端 | http://106.52.6.176:5174/subscription |
| 运营端 | http://106.52.6.176:5173/ |

## 👥 测试账号

| 账号 | 密码 | 套餐 | 权限 |
|------|------|------|------|
| trial_user | test123456 | TRIAL | 3 候选/天，10 自选股 |
| observer_user | test123456 | OBSERVER | 5 候选/天，50 自选股，数据导出 |
| standard_user | test123456 | STANDARD | 10 候选/天，200 自选股，深度诊断 |
| advanced_user | test123456 | ADVANCED | 无限，全部功能 |
| admin_root | admin123456 | ENTERPRISE | 管理员权限 |

---

## 🔧 快速测试（推荐）

### 1. 登录测试
```bash
# 复制粘贴到终端执行
TOKEN=$(curl -s -X POST http://106.52.6.176:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userCode":"trial_user","password":"test123456"}' | jq -r '.data.accessToken')

echo "Token: $TOKEN"
```

### 2. 会员统计测试
```bash
curl -s http://106.52.6.176:3010/api/v1/membership/stats \
  -H "Authorization: Bearer $TOKEN" | jq '.data'
```

### 3. 候选池权限测试
```bash
# trial_user 应该看到候选列表
curl -s http://106.52.6.176:3010/api/v1/candidates \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'
```

### 4. 支付订单测试
```bash
# 创建支付订单
curl -s -X POST http://106.52.6.176:3010/api/v1/payment/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planCode":"STANDARD","paymentMethod":"wechat"}' | jq '.data'
```

---

## 📋 完整测试流程

### 测试 1：会员权限体系

```bash
echo "=== 测试会员权限 ==="

# 1. trial_user 测试
echo "1. trial_user 权限："
TOKEN=$(curl -s -X POST http://106.52.6.176:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userCode":"trial_user","password":"test123456"}' | jq -r '.data.accessToken')
echo "  会员套餐：$(curl -s http://106.52.6.176:3010/api/v1/membership/stats -H "Authorization: Bearer $TOKEN" | jq -r '.data.planName')"
echo "  候选池：$(curl -s http://106.52.6.176:3010/api/v1/candidates -H "Authorization: Bearer $TOKEN" | jq '.data | length') 只"

# 2. advanced_user 测试
echo "2. advanced_user 权限："
TOKEN=$(curl -s -X POST http://106.52.6.176:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userCode":"advanced_user","password":"test123456"}' | jq -r '.data.accessToken')
echo "  会员套餐：$(curl -s http://106.52.6.176:3010/api/v1/membership/stats -H "Authorization: Bearer $TOKEN" | jq -r '.data.planName')"
echo "  候选池：$(curl -s http://106.52.6.176:3010/api/v1/candidates -H "Authorization: Bearer $TOKEN" | jq '.data | length') 只"
```

### 测试 2：权限拦截

```bash
echo "=== 测试权限拦截 ==="

# trial_user 尝试访问深度诊断（应该被拦截）
TOKEN=$(curl -s -X POST http://106.52.6.176:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userCode":"trial_user","password":"test123456"}' | jq -r '.data.accessToken')

echo "trial_user 深度诊断（应该提示升级）："
curl -s "http://106.52.6.176:3010/api/v1/diagnoses?depth=deep" \
  -H "Authorization: Bearer $TOKEN" | jq '.error'
```

### 测试 3：支付流程

```bash
echo "=== 测试支付流程 ==="

TOKEN=$(curl -s -X POST http://106.52.6.176:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userCode":"trial_user","password":"test123456"}' | jq -r '.data.accessToken')

# 1. 创建订单
echo "1. 创建订单："
ORDER=$(curl -s -X POST http://106.52.6.176:3010/api/v1/payment/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planCode":"STANDARD","paymentMethod":"wechat"}' | jq -r '.data.orderNo')
echo "  订单号：$ORDER"

# 2. 查询订单
echo "2. 查询订单："
curl -s "http://106.52.6.176:3010/api/v1/payment/order/$ORDER" \
  -H "Authorization: Bearer $TOKEN" | jq '.data'

# 3. 模拟支付回调
echo "3. 模拟支付回调："
curl -s -X POST http://106.52.6.176:3010/api/v1/payment/wechat/notify \
  -H "Content-Type: application/json" \
  -d "{\"out_trade_no\":\"$ORDER\",\"transaction_id\":\"WX_TEST\"}" | jq '.'

# 4. 验证会员升级
echo "4. 验证会员升级："
curl -s http://106.52.6.176:3010/api/v1/membership/stats \
  -H "Authorization: Bearer $TOKEN" | jq '.data.planName'
```

### 测试 4：运营端管理

```bash
echo "=== 测试运营端管理 ==="

TOKEN=$(curl -s -X POST http://106.52.6.176:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userCode":"admin_root","password":"admin123456"}' | jq -r '.data.accessToken')

# 1. 查询套餐列表
echo "1. 套餐列表："
curl -s http://106.52.6.176:3010/api/v1/admin/membership/plans \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length' && echo " 个套餐"

# 2. 创建测试套餐
echo "2. 创建套餐："
curl -s -X POST http://106.52.6.176:3010/api/v1/admin/membership/plans \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planCode":"TEST","planName":"测试套餐","price":199,"dailyCandidates":8}' | jq '.data.planName'

# 3. 查询订单列表
echo "3. 订单列表："
curl -s http://106.52.6.176:3010/api/v1/admin/payment/orders \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length' && echo " 个订单"
```

---

## 🖥️ 前端测试

### 1. 用户端订阅页面
```
访问：http://106.52.6.176:5174/subscription
步骤：
1. 使用 trial_user / test123456 登录
2. 查看当前套餐信息
3. 点击"立即升级"创建订单
4. 查看订单历史
```

### 2. 运营端管理后台
```
访问：http://106.52.6.176:5173/
步骤：
1. 使用 admin_root / admin123456 登录
2. 查看套餐列表
3. 创建/编辑/删除套餐
4. 查看订单列表
```

---

## ✅ 测试检查清单

- [ ] 5 个测试账号都能正常登录
- [ ] 会员统计 API 返回正确的套餐信息
- [ ] trial_user 候选池被限制（3 只）
- [ ] advanced_user 候选池无限制
- [ ] trial_user 深度诊断被拦截
- [ ] 支付订单创建成功
- [ ] 支付回调后会员自动升级
- [ ] 运营端可以管理套餐
- [ ] 用户端订阅页面正常显示
- [ ] 运营端管理后台正常显示

---

## 🐛 问题排查

### 后端服务检查
```bash
# 检查服务状态
netstat -tlnp | grep 3010

# 查看日志
tail -50 /tmp/service.log

# 重启服务
pkill -9 node && cd /root/.openclaw/workspace/ai-stock-selection/ai-stock-service && node dist/main.js > /tmp/service.log 2>&1 &
```

### 前端服务检查
```bash
# 检查端口
netstat -tlnp | grep 5173
netstat -tlnp | grep 5174

# 重启前端
cd /root/.openclaw/workspace/ai-stock-selection/ai-stock-web && npm run dev &
```

---

## 📞 如需帮助

1. 检查后端日志：`tail -f /tmp/service.log`
2. 检查数据库：`mysql -u root -e "USE ai_stock; SELECT * FROM AppUser LIMIT 5;"`
3. 检查支付配置：查看 `.env` 文件中的支付参数

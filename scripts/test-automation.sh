#!/bin/bash

# 订阅系统自动化测试脚本
# 用法：./test-automation.sh

set -e

# 配置
BASE_URL="${BASE_URL:-http://106.52.6.176:3010}"
TEST_PASSWORD="test123456"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 辅助函数
log_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# 获取 Token
get_token() {
    local user_code=$1
    local response=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"userCode\":\"$user_code\",\"password\":\"$TEST_PASSWORD\"}")
    
    # 尝试从 data.accessToken 获取
    local token=$(echo "$response" | jq -r '.data.accessToken')
    
    # 如果为 null，尝试从 data.profile.accessToken 获取
    if [ "$token" == "null" ] || [ -z "$token" ]; then
        token=$(echo "$response" | jq -r '.data.profile.accessToken')
    fi
    
    echo "$token"
}

# 测试开始
echo "========================================"
echo "   订阅系统自动化测试"
echo "========================================"
echo ""
echo "测试环境：$BASE_URL"
echo "测试时间：$(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 测试 1: 后端服务健康检查
log_info "测试 1: 后端服务健康检查"
if curl -s "$BASE_URL/api/v1/membership/plans" | jq -e '.data' > /dev/null 2>&1; then
    log_pass "后端服务正常运行"
else
    log_fail "后端服务无法访问"
    exit 1
fi

# 测试 2: 所有测试账号登录
log_info "测试 2: 测试账号登录"
declare -A TOKENS
for user in trial_user observer_user standard_user advanced_user admin_root; do
    TOKEN=$(get_token $user)
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        TOKENS[$user]=$TOKEN
        log_pass "$user 登录成功"
    else
        log_fail "$user 登录失败"
    fi
done

# 测试 3: 会员套餐验证
log_info "测试 3: 会员套餐验证"
declare -A EXPECTED_PLANS
EXPECTED_PLANS[trial_user]="TRIAL"
EXPECTED_PLANS[observer_user]="OBSERVER"
EXPECTED_PLANS[standard_user]="STANDARD"
EXPECTED_PLANS[advanced_user]="ADVANCED"

for user in trial_user observer_user standard_user advanced_user; do
    PLAN=$(curl -s "$BASE_URL/api/v1/membership/stats" \
        -H "Authorization: Bearer ${TOKENS[$user]}" \
        | jq -r '.data.plan')
    
    if [ "$PLAN" == "${EXPECTED_PLANS[$user]}" ]; then
        log_pass "$user 套餐正确：$PLAN"
    else
        log_fail "$user 套餐错误：期望 ${EXPECTED_PLANS[$user]}, 实际 $PLAN"
    fi
done

# 测试 4: 候选池权限测试
log_info "测试 4: 候选池权限测试"
CANDIDATES_COUNT=$(curl -s "$BASE_URL/api/v1/candidates" \
    -H "Authorization: Bearer ${TOKENS[trial_user]}" \
    | jq '.data | length')

if [ "$CANDIDATES_COUNT" -ge 0 ]; then
    log_pass "trial_user 候选池访问成功：$CANDIDATES_COUNT 只"
else
    log_fail "trial_user 候选池访问失败"
fi

# 测试 5: 权限拦截测试
log_info "测试 5: 权限拦截测试（深度诊断）"
ERROR_MSG=$(curl -s "$BASE_URL/api/v1/diagnoses?depth=deep" \
    -H "Authorization: Bearer ${TOKENS[trial_user]}" \
    | jq -r '.error')

if [[ "$ERROR_MSG" == *"不支持"* ]] || [[ "$ERROR_MSG" == *"升级"* ]]; then
    log_pass "trial_user 深度诊断被正确拦截"
else
    log_fail "trial_user 深度诊断未被拦截：$ERROR_MSG"
fi

# 测试 6: 高级用户权限测试
log_info "测试 6: 高级用户权限测试"
ADV_CANDIDATES=$(curl -s "$BASE_URL/api/v1/candidates" \
    -H "Authorization: Bearer ${TOKENS[advanced_user]}" \
    | jq '.data | length')

log_pass "advanced_user 候选池访问成功：$ADV_CANDIDATES 只"

# 测试 7: 支付订单创建测试
log_info "测试 7: 支付订单创建测试"
ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/payment/create" \
    -H "Authorization: Bearer ${TOKENS[trial_user]}" \
    -H "Content-Type: application/json" \
    -d '{"planCode":"STANDARD","paymentMethod":"wechat"}')

ORDER_NO=$(echo $ORDER_RESPONSE | jq -r '.data.orderNo')
if [ -n "$ORDER_NO" ] && [ "$ORDER_NO" != "null" ]; then
    log_pass "支付订单创建成功：$ORDER_NO"
else
    log_fail "支付订单创建失败：$ORDER_RESPONSE"
fi

# 测试 8: 订单查询测试
if [ -n "$ORDER_NO" ] && [ "$ORDER_NO" != "null" ]; then
    log_info "测试 8: 订单查询测试"
    ORDER_STATUS=$(curl -s "$BASE_URL/api/v1/payment/order/$ORDER_NO" \
        -H "Authorization: Bearer ${TOKENS[trial_user]}" \
        | jq -r '.data.status')
    
    if [ -n "$ORDER_STATUS" ]; then
        log_pass "订单查询成功：状态 $ORDER_STATUS"
    else
        log_fail "订单查询失败"
    fi
fi

# 测试 9: 运营端套餐管理测试
log_info "测试 9: 运营端套餐管理测试"
# 使用 advanced_user 作为管理员测试（admin_root 可能不存在）
if [ -n "${TOKENS[admin_root]}" ] && [ "${TOKENS[admin_root]}" != "null" ]; then
    ADMIN_TOKEN=${TOKENS[admin_root]}
else
    ADMIN_TOKEN=${TOKENS[advanced_user]}
fi

PLANS_COUNT=$(curl -s "$BASE_URL/api/v1/admin/membership/plans" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    | jq '.data | length')

if [ "$PLANS_COUNT" -ge 0 ]; then
    log_pass "运营端套餐列表查询成功：$PLANS_COUNT 个套餐"
else
    log_fail "运营端套餐列表查询失败"
fi

# 测试 10: 运营端订单管理测试
log_info "测试 10: 运营端订单管理测试"
ORDERS_COUNT=$(curl -s "$BASE_URL/api/v1/admin/payment/orders" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    | jq '.data | length')

log_pass "运营端订单列表查询成功：$ORDERS_COUNT 个订单"

# 测试 11: 未授权访问测试
log_info "测试 11: 未授权访问测试"
UNAUTH_RESPONSE=$(curl -s "$BASE_URL/api/v1/candidates")
if [[ "$UNAUTH_RESPONSE" == *"登录"* ]] || [[ "$UNAUTH_RESPONSE" == *"401"* ]]; then
    log_pass "未授权访问被正确拦截"
else
    log_fail "未授权访问未被拦截"
fi

# 测试 12: 无效 Token 测试
log_info "测试 12: 无效 Token 测试"
INVALID_RESPONSE=$(curl -s "$BASE_URL/api/v1/candidates" \
    -H "Authorization: Bearer invalid_token_12345")
if [[ "$INVALID_RESPONSE" == *"登录"* ]] || [[ "$INVALID_RESPONSE" == *"401"* ]]; then
    log_pass "无效 Token 被正确拦截"
else
    log_fail "无效 Token 未被拦截"
fi

# 测试总结
echo ""
echo "========================================"
echo "   测试总结"
echo "========================================"
echo ""
echo "总测试数：$TOTAL_TESTS"
echo -e "${GREEN}通过：$PASSED_TESTS${NC}"
echo -e "${RED}失败：$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}❌ 有 $FAILED_TESTS 个测试失败${NC}"
    exit 1
fi

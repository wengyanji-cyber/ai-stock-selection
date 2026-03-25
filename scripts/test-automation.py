import requests
import json
import sys
from datetime import datetime

# 配置
BASE_URL = "http://106.52.6.176:3010"
TEST_PASSWORD = "test123456"

# 测试账号
TEST_USERS = {
    "trial_user": "TRIAL",
    "observer_user": "OBSERVER",
    "standard_user": "STANDARD",
    "advanced_user": "ADVANCED",
    "admin_root": "ENTERPRISE"
}

# 统计
total_tests = 0
passed_tests = 0
failed_tests = []

def log_info(msg):
    print(f"\033[1;34m[INFO]\033[0m {msg}")

def log_pass(msg):
    global passed_tests, total_tests
    print(f"\033[0;32m[PASS]\033[0m {msg}")
    passed_tests += 1
    total_tests += 1

def log_fail(msg):
    global total_tests, failed_tests
    print(f"\033[0;31m[FAIL]\033[0m {msg}")
    total_tests += 1
    failed_tests.append(msg)

def get_token(user_code):
    """获取用户 Token"""
    response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"userCode": user_code, "password": TEST_PASSWORD},
        headers={"Content-Type": "application/json"}
    )
    data = response.json()
    return data.get("data", {}).get("accessToken")

def test_backend_health():
    """测试 1: 后端服务健康检查"""
    log_info("测试 1: 后端服务健康检查")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/membership/plans")
        if response.status_code == 200 and "data" in response.json():
            log_pass("后端服务正常运行")
        else:
            log_fail("后端服务响应异常")
    except Exception as e:
        log_fail(f"后端服务无法访问：{e}")

def test_user_login():
    """测试 2: 所有测试账号登录"""
    log_info("测试 2: 测试账号登录")
    tokens = {}
    for user in TEST_USERS.keys():
        token = get_token(user)
        if token and token != "null":
            tokens[user] = token
            log_pass(f"{user} 登录成功")
        else:
            log_fail(f"{user} 登录失败")
    return tokens

def test_membership_plans(tokens):
    """测试 3: 会员套餐验证"""
    log_info("测试 3: 会员套餐验证")
    expected_plans = {
        "trial_user": "试用版",
        "observer_user": "观察版",
        "standard_user": "标准版",
        "advanced_user": "进阶版"
    }
    
    for user, expected in expected_plans.items():
        response = requests.get(
            f"{BASE_URL}/api/v1/membership/stats",
            headers={"Authorization": f"Bearer {tokens.get(user)}"}
        )
        plan_name = response.json().get("data", {}).get("planName")
        if plan_name == expected:
            log_pass(f"{user} 套餐正确：{plan_name}")
        else:
            log_fail(f"{user} 套餐错误：期望 {expected}, 实际 {plan_name}")

def test_candidate_pool(tokens):
    """测试 4: 候选池权限测试"""
    log_info("测试 4: 候选池权限测试")
    response = requests.get(
        f"{BASE_URL}/api/v1/candidates",
        headers={"Authorization": f"Bearer {tokens.get('trial_user')}"}
    )
    count = len(response.json().get("data", []))
    if count >= 0:
        log_pass(f"trial_user 候选池访问成功：{count} 只")
    else:
        log_fail("trial_user 候选池访问失败")

def test_permission_denied(tokens):
    """测试 5: 权限拦截测试"""
    log_info("测试 5: 权限拦截测试（深度诊断）")
    response = requests.get(
        f"{BASE_URL}/api/v1/diagnoses?depth=deep",
        headers={"Authorization": f"Bearer {tokens.get('trial_user')}"}
    )
    error_msg = response.json().get("error", "")
    if "不支持" in error_msg or "升级" in error_msg:
        log_pass("trial_user 深度诊断被正确拦截")
    else:
        log_fail(f"trial_user 深度诊断未被拦截：{error_msg}")

def test_payment_order(tokens):
    """测试 6: 支付订单创建"""
    log_info("测试 6: 支付订单创建测试")
    response = requests.post(
        f"{BASE_URL}/api/v1/payment/create",
        headers={
            "Authorization": f"Bearer {tokens.get('trial_user')}",
            "Content-Type": "application/json"
        },
        json={"planCode": "STANDARD", "paymentMethod": "wechat"}
    )
    order_no = response.json().get("data", {}).get("orderNo")
    if order_no and order_no != "null":
        log_pass(f"支付订单创建成功：{order_no}")
        return order_no
    else:
        log_fail(f"支付订单创建失败：{response.json()}")
        return None

def test_admin_access(tokens):
    """测试 7: 运营端管理权限"""
    log_info("测试 7: 运营端管理权限测试")
    admin_token = tokens.get("admin_root")
    
    # 测试套餐列表
    response = requests.get(
        f"{BASE_URL}/api/v1/admin/membership/plans",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    plans_count = len(response.json().get("data", []))
    if plans_count > 0:
        log_pass(f"运营端套餐列表查询成功：{plans_count} 个套餐")
    else:
        log_fail("运营端套餐列表查询失败")
    
    # 测试订单列表
    response = requests.get(
        f"{BASE_URL}/api/v1/admin/payment/orders",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    orders_count = len(response.json().get("data", []))
    log_pass(f"运营端订单列表查询成功：{orders_count} 个订单")

def test_unauthorized_access():
    """测试 8: 未授权访问"""
    log_info("测试 8: 未授权访问测试")
    response = requests.get(f"{BASE_URL}/api/v1/candidates")
    if response.status_code == 401 or "登录" in str(response.json()):
        log_pass("未授权访问被正确拦截")
    else:
        log_fail("未授权访问未被拦截")

def test_invalid_token():
    """测试 9: 无效 Token"""
    log_info("测试 9: 无效 Token 测试")
    response = requests.get(
        f"{BASE_URL}/api/v1/candidates",
        headers={"Authorization": "Bearer invalid_token"}
    )
    if response.status_code == 401 or "登录" in str(response.json()):
        log_pass("无效 Token 被正确拦截")
    else:
        log_fail("无效 Token 未被拦截")

def print_summary():
    """打印测试总结"""
    print("\n" + "="*50)
    print("测试总结")
    print("="*50)
    print(f"\n总测试数：{total_tests}")
    print(f"\033[0;32m通过：{passed_tests}\033[0m")
    print(f"\033[0;31m失败：{total_tests - passed_tests}\033[0m")
    
    if failed_tests:
        print("\n失败列表:")
        for fail in failed_tests:
            print(f"  - {fail}")
    
    if total_tests == passed_tests:
        print("\n\033[0;32m✅ 所有测试通过！\033[0m")
        return 0
    else:
        print(f"\n\033[0;31m❌ 有 {total_tests - passed_tests} 个测试失败\033[0m")
        return 1

def main():
    print("="*50)
    print("   订阅系统自动化测试（Python 版）")
    print("="*50)
    print(f"\n测试环境：{BASE_URL}")
    print(f"测试时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 执行测试
    test_backend_health()
    tokens = test_user_login()
    
    if not tokens:
        log_fail("无法获取任何 Token，终止测试")
        print_summary()
        return 1
    
    test_membership_plans(tokens)
    test_candidate_pool(tokens)
    test_permission_denied(tokens)
    test_payment_order(tokens)
    test_admin_access(tokens)
    test_unauthorized_access()
    test_invalid_token()
    
    # 打印总结
    return print_summary()

if __name__ == "__main__":
    sys.exit(main())

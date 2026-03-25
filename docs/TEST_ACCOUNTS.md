# 测试账号列表

> ⚠️ **重要**：这些账号仅用于测试，生产环境请删除或修改密码

## 📋 会员测试账号

所有测试账号密码均为：`test123456`

| 套餐 | 账号 | 密码 | 用途 |
|------|------|------|------|
| 试用版 | `trial_user` | test123456 | 测试试用用户权限 |
| 观察版 | `observer_user` | test123456 | 测试观察版权限 |
| 标准版 | `standard_user` | test123456 | 测试标准版权限 |
| 进阶版 | `advanced_user` | test123456 | 测试进阶版权限 |

## 🔑 管理员账号

| 角色 | 账号 | 密码 | 用途 |
|------|------|------|------|
| 超级管理员 | `admin_root` | admin123456 | 系统管理 |
| 运营人员 | `demo_user` | demo123456 | 日常运营 |

## 🧪 使用说明

### 1. 登录测试

```bash
# 试用用户登录
curl -X POST http://106.52.6.176:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userCode":"trial_user","password":"test123456"}'
```

### 2. 权限测试

```bash
# 访问候选池（试用用户）
curl http://106.52.6.176:3010/api/v1/candidates \
  -H "Authorization: Bearer <token>"
```

### 3. 预期行为

- **trial_user**: 只能查看 3 只候选，超出提示升级
- **observer_user**: 只能查看 5 只候选，可导出数据
- **standard_user**: 只能查看 10 只候选，可使用所有标准功能
- **advanced_user**: 无限制，可使用所有功能

## ⚠️ 安全提醒

1. **生产环境请删除这些测试账号**
2. **或者修改密码为强密码**
3. **不要将测试账号密码泄露给真实用户**
4. **定期更换测试账号密码**

## 🗑️ 删除测试账号

```sql
USE ai_stock;

DELETE FROM AppUser WHERE userCode IN (
  'trial_user',
  'observer_user',
  'standard_user',
  'advanced_user'
);
```

---

**最后更新**: 2026-03-25

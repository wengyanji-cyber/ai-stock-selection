import crypto from 'node:crypto'

const ITERATIONS = 120000
const KEY_LENGTH = 64
const DIGEST = 'sha512'

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex')
  const derived = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex')
  return `${salt}:${derived}`
}

// 生成 test123456 的哈希
const testHash = hashPassword('test123456')
console.log('test123456:', testHash)

// 生成 demo123456 的哈希
const demoHash = hashPassword('demo123456')
console.log('demo123456:', demoHash)

// 生成 admin123456 的哈希
const adminHash = hashPassword('admin123456')
console.log('admin123456:', adminHash)

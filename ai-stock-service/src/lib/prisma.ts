import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: process.env.APP_ENV === 'dev' ? ['query', 'error', 'warn'] : ['error'],
})

export { prisma }

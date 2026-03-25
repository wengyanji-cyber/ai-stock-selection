import crypto from 'node:crypto'
import type { FastifyRequest } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { hashPassword, verifyPassword } from './password.service.js'

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14

function parseBearerToken(request: FastifyRequest) {
  const authorization = request.headers.authorization
  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim()
  }

  const headerToken = request.headers['x-session-token']
  return typeof headerToken === 'string' ? headerToken.trim() : ''
}

export async function createUserSession(userId: bigint) {
  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomBytes(16).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  const session = await prisma.userSession.create({
    data: {
      userId,
      token,
      expiresAt,
      lastUsedAt: new Date(),
    },
  })

  return {
    accessToken: session.token,
    expiresAt: session.expiresAt.toISOString(),
  }
}

async function buildSessionPayload(userId: bigint, sessionToken: { accessToken: string; expiresAt: string }) {
  const user = await prisma.appUser.findUniqueOrThrow({
    where: { id: userId },
  })

  return {
    profile: toUserProfile(user),
    ...sessionToken,
  }
}

export async function resolveAuthSession(request: FastifyRequest) {
  const token = parseBearerToken(request)
  console.log('[Auth] Token from request:', token ? `${token.slice(0, 20)}...` : 'none')
  if (!token) {
    console.log('[Auth] No token found')
    return null
  }

  const session = await prisma.userSession.findFirst({
    where: {
      token,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  })

  console.log('[Auth] Session from DB:', session ? 'found' : 'not found')

  if (!session) {
    console.log('[Auth] Session not found or expired/revoked')
    return null
  }

  await prisma.userSession.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date() },
  })

  console.log('[Auth] Session valid, returning with user:', session.user.userCode)

  return session
}

export async function requireAuthSession(request: FastifyRequest) {
  const session = await resolveAuthSession(request)
  if (!session) {
    throw new Error('UNAUTHORIZED')
  }

  return session
}

export async function revokeAuthSession(request: FastifyRequest) {
  const token = parseBearerToken(request)
  if (!token) {
    return { removed: false }
  }

  const updated = await prisma.userSession.updateMany({
    where: {
      token,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  })

  return { removed: updated.count > 0 }
}

export async function refreshAuthSession(request: FastifyRequest) {
  const session = await requireAuthSession(request)

  const updated = await prisma.userSession.update({
    where: { id: session.id },
    data: {
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      lastUsedAt: new Date(),
    },
    include: { user: true },
  })

  return {
    profile: toUserProfile(updated.user),
    accessToken: updated.token,
    expiresAt: updated.expiresAt.toISOString(),
  }
}

function toUserProfile(user: {
  userCode: string
  nickname: string | null
  roleCode: string
  membershipPlan: string | null
  status: string
  lastLoginAt: Date | null
}) {
  return {
    userCode: user.userCode,
    nickname: user.nickname || user.userCode,
    roleCode: user.roleCode,
    membershipPlan: user.membershipPlan || 'TRIAL',
    status: user.status,
    lastLoginAt: user.lastLoginAt?.toISOString() || null,
  }
}

export async function registerUserAccount(input: {
  userCode?: string
  mobile?: string
  nickname?: string
  password: string
  roleCode?: string
}) {
  if (!input.password || input.password.trim().length < 8) {
    throw new Error('INVALID_PASSWORD')
  }

  const userCode = input.userCode?.trim() || `user_${Date.now().toString(36)}`
  const mobile = input.mobile?.trim() || null

  const duplicate = await prisma.appUser.findFirst({
    where: {
      OR: [{ userCode }, ...(mobile ? [{ mobile }] : [])],
    },
  })

  if (duplicate) {
    throw new Error('ACCOUNT_EXISTS')
  }

  const user = await prisma.appUser.create({
    data: {
      userCode,
      mobile,
      nickname: input.nickname?.trim() || userCode,
      passwordHash: hashPassword(input.password),
      roleCode: input.roleCode || 'USER',
      membershipPlan: input.roleCode === 'ADMIN' ? 'ENTERPRISE' : 'TRIAL',
      status: 'ACTIVE',
      lastLoginAt: new Date(),
    },
  })

  return {
    ...(await buildSessionPayload(user.id, await createUserSession(user.id))),
  }
}

export async function loginUserAccount(input: { userCode?: string; mobile?: string; password: string }) {
  if (!input.password) {
    throw new Error('INVALID_CREDENTIALS')
  }

  const user = await prisma.appUser.findFirst({
    where: input.userCode?.trim()
      ? { userCode: input.userCode.trim() }
      : input.mobile?.trim()
        ? { mobile: input.mobile.trim() }
        : undefined,
  })

  if (!user || !user.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
    throw new Error('INVALID_CREDENTIALS')
  }

  const updated = await prisma.appUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  return {
    ...(await buildSessionPayload(updated.id, await createUserSession(updated.id))),
  }
}

export async function changeCurrentUserPassword(request: FastifyRequest, input: { currentPassword: string; newPassword: string }) {
  if (!input.currentPassword || !input.newPassword) {
    throw new Error('INVALID_PASSWORD')
  }

  if (input.newPassword.trim().length < 8) {
    throw new Error('INVALID_PASSWORD')
  }

  const session = await requireAuthSession(request)
  const user = await prisma.appUser.findUnique({ where: { id: session.userId } })

  if (!user || !user.passwordHash || !verifyPassword(input.currentPassword, user.passwordHash)) {
    throw new Error('INVALID_CREDENTIALS')
  }

  await prisma.$transaction([
    prisma.appUser.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(input.newPassword),
        lastLoginAt: new Date(),
      },
    }),
    prisma.userSession.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ])

  return buildSessionPayload(user.id, await createUserSession(user.id))
}

export function assertRole(roleCode: string | undefined, allowedRoles: string[]) {
  if (!roleCode || !allowedRoles.includes(roleCode)) {
    throw new Error('FORBIDDEN')
  }
}

export async function requireRoleSession(request: FastifyRequest, allowedRoles: string[]) {
  const session = await requireAuthSession(request)
  assertRole(session.user.roleCode, allowedRoles)
  return session
}
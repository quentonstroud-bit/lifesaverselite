import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const sc = promisify(scrypt)
const N = 16384

export async function hashPassword(pw) {
  const salt = randomBytes(16)
  const key = await sc(pw, salt, 64, { N, r: 8, p: 1 })
  return `scrypt$${N}$${salt.toString('base64')}$${key.toString('base64')}`
}

// Always does the same work, even for a missing/garbled hash, to avoid leaking which emails have accounts.
const DUMMY = `scrypt$${N}$${Buffer.alloc(16).toString('base64')}$${Buffer.alloc(64).toString('base64')}`
export async function verifyPassword(pw, stored) {
  const parts = String(stored || DUMMY).split('$')
  const ok = parts.length === 4 && parts[0] === 'scrypt'
  const [, n, salt, hash] = ok ? parts : DUMMY.split('$')
  const key = await sc(pw, Buffer.from(salt, 'base64'), 64, { N: Number(n), r: 8, p: 1 })
  const expected = Buffer.from(hash, 'base64')
  return ok && key.length === expected.length && timingSafeEqual(key, expected)
}

export function validNewPassword(pw) {
  return typeof pw === 'string' && pw.length >= 10 && pw.length <= 200
}

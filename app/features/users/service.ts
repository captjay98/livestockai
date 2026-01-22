/**
 * Business logic for user operations.
 * All functions are side-effect-free and easily unit testable.
 */

import type { UserRecord } from './repository'

/**
 * Input types for user operations
 */
export interface CreateUserInput {
  email: string
  password: string
  name: string
  role: 'user' | 'admin'
}

export interface BanUserInput {
  userId: string
  reason?: string
  expiresAt?: string
}

export interface SetPasswordInput {
  userId: string
  newPassword: string
}

export interface UpdateRoleInput {
  userId: string
  role: 'user' | 'admin'
}

export interface RemoveUserInput {
  userId: string
}

/**
 * Validate user creation input
 */
export function validateCreateUserInput(
  data: CreateUserInput,
): { valid: true } | { valid: false; message: string } {
  if (!data.email || data.email.trim() === '') {
    return { valid: false, message: 'Email is required' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.email)) {
    return { valid: false, message: 'Invalid email format' }
  }

  if (!data.password || data.password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' }
  }

  if (!data.name || data.name.trim() === '') {
    return { valid: false, message: 'Name is required' }
  }

  if (data.name.length > 255) {
    return { valid: false, message: 'Name must be less than 255 characters' }
  }

  return { valid: true }
}

/**
 * Validate ban user input
 */
export function validateBanUserInput(
  data: BanUserInput,
): { valid: true } | { valid: false; message: string } {
  if (!data.userId) {
    return { valid: false, message: 'User ID is required' }
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(data.userId)) {
    return { valid: false, message: 'Invalid user ID format' }
  }

  if (data.expiresAt) {
    const date = new Date(data.expiresAt)
    if (isNaN(date.getTime())) {
      return { valid: false, message: 'Invalid expiration date format' }
    }
  }

  return { valid: true }
}

/**
 * Validate set password input
 */
export function validateSetPasswordInput(
  data: SetPasswordInput,
): { valid: true } | { valid: false; message: string } {
  if (!data.userId) {
    return { valid: false, message: 'User ID is required' }
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(data.userId)) {
    return { valid: false, message: 'Invalid user ID format' }
  }

  if (!data.newPassword || data.newPassword.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' }
  }

  return { valid: true }
}

/**
 * Validate update role input
 */
export function validateUpdateRoleInput(
  data: UpdateRoleInput,
): { valid: true } | { valid: false; message: string } {
  if (!data.userId) {
    return { valid: false, message: 'User ID is required' }
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(data.userId)) {
    return { valid: false, message: 'Invalid user ID format' }
  }

  if (data.role !== 'admin') {
    return { valid: false, message: 'Role must be admin or user' }
  }

  return { valid: true }
}

/**
 * Validate remove user input
 */
export function validateRemoveUserInput(
  data: RemoveUserInput,
): { valid: true } | { valid: false; message: string } {
  if (!data.userId) {
    return { valid: false, message: 'User ID is required' }
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(data.userId)) {
    return { valid: false, message: 'Invalid user ID format' }
  }

  return { valid: true }
}

/**
 * Check if user can be banned (business rules)
 */
export function canBanUser(
  adminUserId: string,
  targetUser: Pick<UserRecord, 'id' | 'role'>,
): { allowed: true } | { allowed: false; reason: string } {
  // Cannot ban yourself
  if (adminUserId === targetUser.id) {
    return { allowed: false, reason: 'Cannot ban yourself' }
  }

  // Cannot ban other admins
  if (targetUser.role === 'admin') {
    return { allowed: false, reason: 'Cannot ban admin users' }
  }

  return { allowed: true }
}

/**
 * Check if user can be deleted (business rules)
 */
export function canDeleteUser(
  adminUserId: string,
  targetUser: Pick<UserRecord, 'id' | 'role'>,
  ownedFarmCount: number,
): { allowed: true } | { allowed: false; reason: string } {
  // Cannot delete yourself
  if (adminUserId === targetUser.id) {
    return { allowed: false, reason: 'Cannot delete yourself' }
  }

  // Cannot delete other admins
  if (targetUser.role === 'admin') {
    return { allowed: false, reason: 'Cannot delete admin users' }
  }

  // Cannot delete user who is the last owner of a farm
  if (ownedFarmCount > 0) {
    return {
      allowed: false,
      reason:
        'Cannot delete user who is the last owner of a farm. Transfer ownership first.',
    }
  }

  return { allowed: true }
}

/**
 * Check if user can change their own role (business rules)
 */
export function canChangeRole(
  adminUserId: string,
  targetUserId: string,
): { allowed: true } | { allowed: false; reason: string } {
  if (adminUserId === targetUserId) {
    return { allowed: false, reason: 'Cannot change your own role' }
  }

  return { allowed: true }
}

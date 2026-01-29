/**
 * Pure business logic for access management.
 * All functions are side-effect-free and easily unit testable.
 */

export interface AccessGrant {
  id: string
  farmId: string
  grantedBy: string
  grantedTo: string
  expiresAt: Date
  createdAt: Date
  revokedAt?: Date | null
}

export interface AccessRequest {
  id: string
  farmId: string
  requesterId: string
  status: 'pending' | 'approved' | 'denied'
  createdAt: Date
}

/**
 * Validate access request before creation
 *
 * @param requesterId - ID of user requesting access
 * @param farmId - ID of farm being requested
 * @param existingRequests - Array of existing requests for this farm/user
 * @returns Error message or null if valid
 */
export function validateAccessRequest(
  requesterId: string,
  farmId: string,
  existingRequests: Array<AccessRequest>,
): string | null {
  if (!requesterId || !farmId) {
    return 'Requester ID and Farm ID are required'
  }

  const pendingRequest = existingRequests.find(
    (req) =>
      req.requesterId === requesterId &&
      req.farmId === farmId &&
      req.status === 'pending',
  )

  if (pendingRequest) {
    return 'You already have a pending request for this farm'
  }

  return null
}

/**
 * Calculate expiration date from duration in days
 *
 * @param durationDays - Number of days from now
 * @returns Future date
 */
export function calculateExpirationDate(durationDays: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + durationDays)
  return date
}

/**
 * Check if access grant is currently active
 *
 * @param grant - Access grant to check
 * @returns True if grant is active (not expired or revoked)
 */
export function isAccessActive(grant: AccessGrant): boolean {
  if (grant.revokedAt) return false
  return new Date() < grant.expiresAt
}

/**
 * Check if user can revoke an access grant
 *
 * @param grant - Access grant to check
 * @param userId - ID of user attempting revocation
 * @returns True if user can revoke (is the grantor)
 */
export function canRevokeAccess(grant: AccessGrant, userId: string): boolean {
  return grant.grantedBy === userId && !grant.revokedAt
}

/**
 * Check if creation is within edit window
 *
 * @param createdAt - Creation timestamp
 * @param windowHours - Edit window in hours
 * @returns True if within edit window
 */
export function isWithinEditWindow(
  createdAt: Date,
  windowHours: number,
): boolean {
  const now = new Date()
  const windowMs = windowHours * 60 * 60 * 1000
  return now.getTime() - createdAt.getTime() <= windowMs
}

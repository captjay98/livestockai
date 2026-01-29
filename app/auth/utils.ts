export function checkObserverAccess(farmId: string): void {
  // Minimal implementation - in real app would check permissions
  if (!farmId) {
    throw new Error('Farm ID required')
  }
}

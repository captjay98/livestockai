export const extension = {
  title: 'Extension Worker Mode',

  // Toast messages
  messages: {
    userAssigned: 'User assigned to district',
    selectBothFields: 'Please select both user and district',
    userRemoved: 'User removed from district',
    supervisorUpdated: 'Supervisor status updated',
    accessApproved: 'Access Approved',
    accessApprovedDesc: 'The extension worker can now access your farm data.',
    accessDenied: 'Access Denied',
    accessDeniedDesc: 'The access request has been denied.',
    accessRevoked: 'Access Revoked',
    accessRevokedDesc:
      'The extension worker no longer has access to your farm.',
    approveAccessFailed: 'Failed to approve access request',
    denyAccessFailed: 'Failed to deny access request',
    revokeAccessFailed: 'Failed to revoke access',
    error: 'Error',
  },

  // UI labels
  totalFarms: 'Total Farms',
  lastVisit: 'Last Visit:',
  noFarmsAffected: 'No farms affected',
  noAssignments: 'No assignments found',
  cannotDeactivate: 'Cannot deactivate',
  regionHasFarms: 'This region has {{count}} farm(s) assigned.',

  // Placeholders
  placeholders: {
    selectUser: 'Select user',
    selectDistrict: 'Select district',
    selectCountry: 'Select country',
    selectParentRegion: 'Select parent region',
    globalDefault: 'Global default (no region)',
    alertNotes: 'Add notes about this alert...',
    denyReason: 'e.g., Not authorized by farm management',
    revokeReason: 'e.g., Access no longer needed',
  },
  toggleSupervisor: 'Toggle supervisor status',
  removeFromDistrict: 'Remove from district',
}

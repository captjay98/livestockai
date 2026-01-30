export const extension = {
  title: 'Modo Trabajador de Extensión',

  // Toast messages
  messages: {
    userAssigned: 'Usuario asignado al distrito',
    selectBothFields: 'Por favor seleccione usuario y distrito',
    userRemoved: 'Usuario removido del distrito',
    supervisorUpdated: 'Estado de supervisor actualizado',
    accessApproved: 'Acceso Aprobado',
    accessApprovedDesc:
      'El trabajador de extensión ahora puede acceder a los datos de su granja.',
    accessDenied: 'Acceso Denegado',
    accessDeniedDesc: 'La solicitud de acceso ha sido denegada.',
    accessRevoked: 'Acceso Revocado',
    accessRevokedDesc:
      'El trabajador de extensión ya no tiene acceso a su granja.',
    approveAccessFailed: 'Error al aprobar solicitud de acceso',
    denyAccessFailed: 'Error al denegar solicitud de acceso',
    revokeAccessFailed: 'Error al revocar acceso',
    error: 'Error',
  },

  // UI labels
  totalFarms: 'Total de Granjas',
  lastVisit: 'Última Visita:',
  noFarmsAffected: 'Ninguna granja afectada',
  noAssignments: 'No se encontraron asignaciones',
  cannotDeactivate: 'No se puede desactivar',
  regionHasFarms: 'Esta región tiene {{count}} granja(s) asignada(s).',

  // Placeholders
  placeholders: {
    selectUser: 'Seleccionar usuario',
    selectDistrict: 'Seleccionar distrito',
    selectCountry: 'Seleccionar país',
    selectParentRegion: 'Seleccionar región padre',
    globalDefault: 'Predeterminado global (sin región)',
    alertNotes: 'Agregar notas sobre esta alerta...',
    denyReason: 'ej., No autorizado por la administración de la granja',
    revokeReason: 'ej., Acceso ya no necesario',
  },
  toggleSupervisor: 'Alternar estado de supervisor',
  removeFromDistrict: 'Remover del distrito',
}

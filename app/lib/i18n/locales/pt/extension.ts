export const extension = {
  title: 'Modo do Trabalhador de Extensão',

  // Toast messages
  messages: {
    userAssigned: 'Usuário atribuído ao distrito',
    selectBothFields: 'Por favor, selecione usuário e distrito',
    userRemoved: 'Usuário removido do distrito',
    supervisorUpdated: 'Status do supervisor atualizado',
    accessApproved: 'Acesso Aprobado',
    accessApprovedDesc:
      'O trabalhador de extensão agora pode acessar os dados da sua fazenda.',
    accessDenied: 'Acesso Negado',
    accessDeniedDesc: 'O pedido de acesso foi negado.',
    accessRevoked: 'Acesso Revogado',
    accessRevokedDesc:
      'O trabalhador de extensão não tem mais acesso à sua fazenda.',
    approveAccessFailed: 'Falha ao aprovar pedido de acesso',
    denyAccessFailed: 'Falha ao negar pedido de acesso',
    revokeAccessFailed: 'Falha ao revogar acesso',
    error: 'Erro',
  },

  // UI labels
  totalFarms: 'Total de Fazendas',
  lastVisit: 'Última Visita:',
  noFarmsAffected: 'Nenhuma fazenda afetada',
  noAssignments: 'Nenhuma atribuição encontrada',
  cannotDeactivate: 'Não é possível desativar',
  regionHasFarms: 'Esta região possui {{count}} fazenda(s) atribuída(s).',

  // Placeholders
  placeholders: {
    selectUser: 'Selecionar usuário',
    selectDistrict: 'Selecionar distrito',
    selectCountry: 'Selecionar país',
    selectParentRegion: 'Selecionar região pai',
    globalDefault: 'Padrão global (sem região)',
    alertNotes: 'Adicionar notas sobre este alerta...',
    denyReason: 'ex: Não autorizado pela gerência da fazenda',
    revokeReason: 'ex: Acesso não é mais necessário',
  },
  toggleSupervisor: 'Alternar status do supervisor',
  removeFromDistrict: 'Remover do distrito',
}

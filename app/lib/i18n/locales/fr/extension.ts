export const extension = {
  title: "Mode Travailleur d'Extension",

  // Toast messages
  messages: {
    userAssigned: 'Utilisateur assigné au district',
    selectBothFields: "Veuillez sélectionner l'utilisateur et le district",
    userRemoved: 'Utilisateur retiré du district',
    supervisorUpdated: 'Statut de superviseur mis à jour',
    accessApproved: 'Accès Approuvé',
    accessApprovedDesc:
      "Le travailleur d'extension peut maintenant accéder aux données de votre ferme.",
    accessDenied: 'Accès Refusé',
    accessDeniedDesc: "La demande d'accès a été refusée.",
    accessRevoked: 'Accès Révoqué',
    accessRevokedDesc:
      "Le travailleur d'extension n'a plus accès à votre ferme.",
    approveAccessFailed: "Échec de l'approbation de la demande d'accès",
    denyAccessFailed: "Échec du refus de la demande d'accès",
    revokeAccessFailed: "Échec de la révocation de l'accès",
    error: 'Erreur',
  },

  // UI labels
  totalFarms: 'Total des Fermes',
  lastVisit: 'Dernière Visite:',
  noFarmsAffected: 'Aucune ferme affectée',
  noAssignments: 'Aucune affectation trouvée',
  cannotDeactivate: 'Impossible de désactiver',
  regionHasFarms: 'Cette région a {{count}} ferme(s) assignée(s).',

  // Placeholders
  placeholders: {
    selectUser: 'Sélectionner utilisateur',
    selectDistrict: 'Sélectionner district',
    selectCountry: 'Sélectionner pays',
    selectParentRegion: 'Sélectionner région parente',
    globalDefault: 'Par défaut global (aucune région)',
    alertNotes: 'Ajouter des notes sur cette alerte...',
    denyReason: 'ex., Non autorisé par la direction de la ferme',
    revokeReason: 'ex., Accès plus nécessaire',
  },
  toggleSupervisor: 'Basculer le statut de superviseur',
  removeFromDistrict: 'Retirer du district',
}

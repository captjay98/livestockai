export const farms = {
  // Page headings
  title: 'Mes Fermes',
  description: "Gérez vos fermes d'élevage et vos installations",
  add: 'Ajouter une Ferme',
  create: 'Créer une Ferme',
  createFirst: 'Créez Votre Première Ferme',
  createFarm: 'Créer une Ferme',
  createNewFarm: 'Créer une Nouvelle Ferme',
  editFarm: 'Modifier la Ferme',
  updateFarm: 'Mettre à Jour la Ferme',
  updated: 'Ferme mise à jour',
  created: 'Ferme créée',

  // Form fields
  farmName: 'Nom de la Ferme',
  location: 'Emplacement',
  farmType: 'Spécialité Principale',
  namePlaceholder: 'Entrez le nom de la ferme',
  locationPlaceholder: "Entrez l'emplacement",
  createDescription: 'Ajouter une nouvelle ferme à votre compte',
  editDescription: 'Mettre à jour les détails de votre ferme',

  // Placeholders
  placeholders: {
    name: 'Entrez le nom de la ferme',
    location: "Entrez l'emplacement, ville ou région",
  },

  // Error messages
  error: {
    create: 'Échec de la création de la ferme',
    update: 'Échec de la mise à jour de la ferme',
    delete: 'Échec de la suppression de la ferme',
  },

  // Empty state
  empty: {
    title: "Vous n'avez pas encore de fermes",
    description:
      'Créez votre première ferme pour commencer à suivre le bétail, les dépenses et plus encore.',
  },

  // Detail page
  detail: {
    notFound: 'Ferme Non Trouvée',
    notFoundDesc:
      "La ferme que vous recherchez n'existe pas ou vous n'y avez pas accès.",
    back: 'Retour aux Fermes',
    tabs: {
      overview: 'Aperçu',
      facilities: 'Installations',
      activity: 'Activité',
      settings: 'Paramètres',
    },
  },

  // Dashboard stats
  dashboard: {
    livestock: 'Bétail',
    activeBatches: '{{count}} lots actifs',
    revenue: 'Revenus',
    salesTransactions: '{{count}} ventes',
    expenses: 'Dépenses',
    expenseRecords: '{{count}} enregistrements de dépenses',
  },

  // Quick actions
  quickActions: {
    tip: {
      title: 'Conseil Rapide',
      text: 'Utilisez les actions rapides pour gérer efficacement les opérations quotidiennes de votre ferme.',
    },
  },

  // Geofence
  geofenceConfig: 'Configuration du Géofence',
  geofenceDescription: 'Définir les limites géographiques de votre ferme',

  // Farm types
  types: {
    poultry: 'Volaille',
    aquaculture: 'Aquaculture',
    cattle: 'Bovins',
    goats: 'Chèvres',
    sheep: 'Moutons',
    apiary: 'Rucher',
    mixed: 'Mixte',
  },
}

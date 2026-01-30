export const mortality = {
  title: 'Registres de Mortalité',
  description:
    'Enregistrer la mortalité pour surveiller la santé et détecter les problèmes tôt.',
  recordLoss: 'Enregistrer Perte',
  recordLossTitle: 'Enregistrer Mortalité',
  allCauses: 'Toutes Causes',
  emptyTitle: 'Aucun registre de mortalité',
  emptyDescription:
    "Nous espérons que vous n'aurez pas besoin d'en ajouter bientôt.",
  recorded: 'Mortalité enregistrée',
  cause: 'Cause',
  selectCause: 'Sélectionner la cause',
  totalDeaths: 'Total Décès',
  healthAlerts: 'Alertes Santé',
  totalAlerts: '{{count}} alertes totales',
  recordedIncidents: 'Incidents enregistrés',
  causes: {
    disease: 'Maladie',
    predator: 'Prédateur',
    weather: 'Météo/Environnement',
    unknown: 'Inconnu',
    other: 'Autre',
  },
  error: {
    record: "Échec de l'enregistrement de la mortalité",
  },
  notesPlaceholder: "Décrire les symptômes ou l'incident...",
  records: 'Registres de Mortalité',
}

export const vaccinations = {
  title: 'Dossiers de Santé',
  description: 'Suivre les vaccinations et les médicaments pour vos troupeaux.',
  actions: {
    vaccinate: 'Enregistrer Vaccination',
    treat: 'Enregistrer Traitement',
  },
  tabs: {
    all: 'Tous les Dossiers',
    vaccinations: 'Vaccinations',
    treatments: 'Traitements',
  },
  labels: {
    batch: 'Lot',
    vaccineName: 'Nom du Vaccin',
    medicationName: 'Nom du Médicament',
    date: 'Date',
    dosage: 'Dosage',
    reason: 'Raison du Traitement',
    withdrawal: "Délai d'attente (jours)",
    nextDueDate: 'Prochaine Échéance',
    notes: 'Notes',
  },
  placeholders: {
    search: 'Rechercher par nom ou lot...',
    dosage: 'ex: 10ml',
    reason: 'ex: Coccidiose',
  },
  columns: {
    date: 'Date',
    type: 'Type',
    name: 'Nom',
    batch: 'Lot',
    details: 'Détails',
  },
  types: {
    prevention: 'Prévention',
    treatment: 'Traitement',
  },
  details: {
    next: 'Prochain',
    for: 'Pour',
    withdrawalSuffix: " jours d'attente",
  },
  alerts: {
    overdue: 'Vaccinations en retard',
    upcoming: 'Vaccinations à venir',
  },
  dialog: {
    vaccinationTitle: 'Enregistrer Vaccination',
    treatmentTitle: 'Enregistrer Traitement Médical',
  },
  messages: {
    vaccinationRecorded: 'Vaccination enregistrée avec succès',
    treatmentRecorded: 'Traitement enregistré avec succès',
    updated: 'Dossier de santé mis à jour avec succès',
    deleted: 'Dossier de santé supprimé avec succès',
  },
  empty: {
    title: 'Aucun dossier de santé',
    description: 'Commencez à suivre les vaccinations et traitements.',
  },
}

export const weight = {
  title: 'Échantillonnage de Poids',
  description:
    "Suivre la croissance en enregistrant des échantillons de poids périodiques. Comparer aux normes de l'industrie.",
  addSample: 'Ajouter Échantillon',
  addSampleTitle: 'Enregistrer Échantillon de Poids',
  editSampleTitle: 'Modifier Échantillon de Poids',
  deleteSampleTitle: 'Supprimer Échantillon de Poids',
  deleteConfirmation:
    'Êtes-vous sûr de vouloir supprimer cet échantillon de poids ?',
  saveSample: 'Enregistrer Échantillon',
  growthAlerts: 'Alertes de Croissance',
  animalsCount: '{{count}} animaux',
  avgWeight: 'Poids Moyen',
  sampleSize: "Taille de l'échantillon",
  recorded: 'Échantillon de poids enregistré',
  emptyTitle: 'Aucun échantillon de poids',
  emptyDescription: 'Suivez régulièrement le poids de votre bétail.',
  error: {
    record: "Échec de l'enregistrement de l'échantillon",
  },
}

export const waterQuality = {
  title: "Qualité de l'Eau",
  description:
    "Surveiller les conditions de l'étang (pH, température, oxygène) pour assurer une santé optimale des poissons.",
  addRecord: 'Ajouter Enregistrement',
  addRecordTitle: "Enregistrer Qualité de l'Eau",
  editRecordTitle: "Modifier Enregistrement Qualité de l'Eau",
  deleteRecordTitle: "Supprimer Enregistrement Qualité de l'Eau",
  deleteConfirmation:
    "Êtes-vous sûr de vouloir supprimer cet enregistrement de qualité de l'eau ?",
  saveRecord: 'Enregistrer',
  qualityAlerts: 'Alertes Qualité',
  selectFishBatch: 'Sélectionner lot de poissons',
  recorded: "Qualité de l'eau enregistrée",
  temp: 'Température ({{label}})',
  do: 'DO (mg/L)',
  ammonia: 'Ammoniac',
  emptyTitle: "Aucun enregistrement de qualité de l'eau",
  emptyDescription: "Surveillez régulièrement vos paramètres d'eau.",
  error: {
    record: "Échec de l'enregistrement",
  },
  labels: {
    ph: 'pH',
    temperature: 'Température',
    dissolvedOxygen: 'Oxygène Dissous (mg/L)',
    ammonia: 'Ammoniac (mg/L)',
  },
}

export const health = {
  mortality,
  vaccinations,
  weight,
  waterQuality,
}

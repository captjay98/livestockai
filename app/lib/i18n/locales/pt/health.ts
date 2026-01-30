export const mortality = {
  title: 'Registros de Mortalidade',
  description:
    'Registrar mortalidade para monitorar saúde e detectar problemas cedo.',
  recordLoss: 'Registrar Perda',
  recordLossTitle: 'Registrar Mortalidade',
  allCauses: 'Todas as Causas',
  emptyTitle: 'Sem registros de mortalidade',
  emptyDescription: 'Esperamos que você não precise adicionar nenhum tão cedo.',
  recorded: 'Mortalidade registrada',
  cause: 'Causa',
  selectCause: 'Selecionar causa',
  totalDeaths: 'Total Mortes',
  healthAlerts: 'Alertas de Saúde',
  totalAlerts: '{{count}} alertas totais',
  recordedIncidents: 'Incidentes registrados',
  causes: {
    disease: 'Doença',
    predator: 'Predador',
    weather: 'Clima/Ambiente',
    unknown: 'Desconhecido',
    other: 'Outro',
  },
  error: {
    record: 'Falha ao registrar mortalidade',
  },
  notesPlaceholder: 'Descrever sintomas ou incidente...',
  records: 'Registros de Mortalidade',
}

export const vaccinations = {
  title: 'Registros de Saúde',
  description: 'Rastrear vacinas e medicamentos para seus lotes.',
  actions: {
    vaccinate: 'Registrar Vacinação',
    treat: 'Registrar Tratamiento',
  },
  tabs: {
    all: 'Todos os Registros',
    vaccinations: 'Vacinações',
    treatments: 'Tratamentos',
  },
  labels: {
    batch: 'Lote',
    vaccineName: 'Nome da Vacina',
    medicationName: 'Nome do Medicamento',
    date: 'Data',
    dosage: 'Dosagem',
    reason: 'Razão do Tratamento',
    withdrawal: 'Período de Carência (dias)',
    nextDueDate: 'Próximo Vencimento',
    notes: 'Notas',
  },
  placeholders: {
    search: 'Buscar por nome ou lote...',
    dosage: 'ex: 10ml',
    reason: 'ex: Coccidiose',
  },
  columns: {
    date: 'Data',
    type: 'Tipo',
    name: 'Nome',
    batch: 'Lote',
    details: 'Detalhes',
  },
  types: {
    prevention: 'Prevenção',
    treatment: 'Tratamento',
  },
  details: {
    next: 'Próximo',
    for: 'Para',
    withdrawalSuffix: ' dias de carência',
  },
  alerts: {
    overdue: 'Vacinas Atrasadas',
    upcoming: 'Próximas Vacinas',
  },
  dialog: {
    vaccinationTitle: 'Registrar Vacinação',
    treatmentTitle: 'Registrar Tratamento',
  },
  messages: {
    vaccinationRecorded: 'Vacinação registrada',
    treatmentRecorded: 'Tratamento registrado',
    updated: 'Registro de saúde atualizado',
    deleted: 'Registro de saúde excluído',
  },
  empty: {
    title: 'Sem registros de saúde',
    description: 'Comece a rastrear vacinas e tratamentos.',
  },
}

export const weight = {
  title: 'Amostragem de Peso',
  description:
    'Rastrear crescimento registrando pesos periódicos. Comparar com padrões da indústria.',
  addSample: 'Adicionar Amostra',
  addSampleTitle: 'Registrar Amostra de Peso',
  editSampleTitle: 'Editar Amostra de Peso',
  deleteSampleTitle: 'Excluir Amostra de Peso',
  deleteConfirmation: 'Tem certeza que deseja excluir esta amostra?',
  saveSample: 'Salvar Amostra',
  growthAlerts: 'Alertas de Crescimento',
  animalsCount: '{{count}} animais',
  avgWeight: 'Peso Médio',
  sampleSize: 'Tamanho da Amostra',
  recorded: 'Amostra registrada',
  emptyTitle: 'Sem amostras de peso',
  emptyDescription: 'Rastreie o crescimento do seu gado regularmente.',
  error: {
    record: 'Falha ao salvar amostra',
  },
}

export const waterQuality = {
  title: 'Qualidade da Água',
  description:
    'Monitorar condições do tanque (pH, temp, oxigênio) para saúde ideal.',
  addRecord: 'Adicionar Registro',
  addRecordTitle: 'Registrar Qualidade da Água',
  editRecordTitle: 'Editar Registro Qualidade da Água',
  deleteRecordTitle: 'Excluir Registro Qualidade da Água',
  deleteConfirmation: 'Tem certeza que deseja excluir este registro?',
  saveRecord: 'Salvar Registro',
  qualityAlerts: 'Alertas de Qualidade',
  selectFishBatch: 'Selecionar lote de peixes',
  recorded: 'Qualidade da água registrada',
  temp: 'Temp ({{label}})',
  do: 'DO (mg/L)',
  ammonia: 'Amônia',
  emptyTitle: 'Sem registros de qualidade',
  emptyDescription: 'Monitore seus parâmetros de água regularmente.',
  error: {
    record: 'Falha ao salvar registro',
  },
  labels: {
    ph: 'pH',
    temperature: 'Temperatura',
    dissolvedOxygen: 'Oxigênio Dissolvido (mg/L)',
    ammonia: 'Amônia (mg/L)',
  },
}

export const health = {
  mortality,
  vaccinations,
  weight,
  waterQuality,
}

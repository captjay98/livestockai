export const mortality = {
  title: 'Registros de Mortalidad',
  description:
    'Registrar mortalidad para monitorear salud y detectar problemas.',
  recordLoss: 'Registrar Pérdida',
  recordLossTitle: 'Registrar Mortalidad',
  allCauses: 'Todas las Causas',
  emptyTitle: 'Sin registros de mortalidad',
  emptyDescription: 'Esperamos que no necesite añadir ninguno pronto.',
  recorded: 'Mortalidad registrada',
  cause: 'Causa',
  selectCause: 'Seleccionar causa',
  totalDeaths: 'Total Muertes',
  healthAlerts: 'Alertas de Salud',
  totalAlerts: '{{count}} alertas totales',
  recordedIncidents: 'Incidentes registrados',
  causes: {
    disease: 'Enfermedad',
    predator: 'Depredador',
    weather: 'Clima/Ambiente',
    unknown: 'Desconocido',
    other: 'Otro',
  },
  error: {
    record: 'Error al registrar mortalidad',
  },
  notesPlaceholder: 'Describir síntomas o incidente...',
  records: 'Registros de Mortalidad',
}

export const vaccinations = {
  title: 'Registros de Salud',
  description: 'Rastrear vacunaciones y tratamientos para sus lotes.',
  actions: {
    vaccinate: 'Registrar Vacunación',
    treat: 'Registrar Tratamiento',
  },
  tabs: {
    all: 'Todos los Registros',
    vaccinations: 'Vacunaciones',
    treatments: 'Tratamientos',
  },
  labels: {
    batch: 'Lote',
    vaccineName: 'Nombre de Vacuna',
    medicationName: 'Nombre de Medicamento',
    date: 'Fecha',
    dosage: 'Dosis',
    reason: 'Razón del Tratamiento',
    withdrawal: 'Tiempo de Retiro (días)',
    nextDueDate: 'Próximo Vencimiento',
    notes: 'Notas',
  },
  placeholders: {
    search: 'Buscar por nombre o lote...',
    dosage: 'ej. 10ml',
    reason: 'ej. Coccidiosis',
  },
  columns: {
    date: 'Fecha',
    type: 'Tipo',
    name: 'Nombre',
    batch: 'Lote',
    details: 'Detalles',
  },
  types: {
    prevention: 'Prevención',
    treatment: 'Tratamiento',
  },
  details: {
    next: 'Próximo',
    for: 'Para',
    withdrawalSuffix: ' días de retiro',
  },
  alerts: {
    overdue: 'Vacunaciones Atrasadas',
    upcoming: 'Próximas Vacunaciones',
  },
  dialog: {
    vaccinationTitle: 'Registrar Vacunación',
    treatmentTitle: 'Registrar Tratamiento',
  },
  messages: {
    vaccinationRecorded: 'Vacunación registrada',
    treatmentRecorded: 'Tratamiento registrado',
    updated: 'Registro de salud actualizado',
    deleted: 'Registro de salud eliminado',
  },
  empty: {
    title: 'Sin registros de salud',
    description: 'Comience a rastrear vacunaciones y tratamientos.',
  },
}

export const weight = {
  title: 'Muestreo de Peso',
  description:
    'Rastrear crecimiento registrando pesos periódicos. Comparar con estándares.',
  addSample: 'Añadir Muestra',
  addSampleTitle: 'Registrar Muestra de Peso',
  editSampleTitle: 'Editar Muestra de Peso',
  deleteSampleTitle: 'Eliminar Muestra de Peso',
  deleteConfirmation: '¿Está seguro de querer eliminar esta muestra?',
  saveSample: 'Guardar Muestra',
  growthAlerts: 'Alertas de Crecimiento',
  animalsCount: '{{count}} animales',
  avgWeight: 'Peso Promedio',
  sampleSize: 'Tamaño de Muestra',
  recorded: 'Muestra registrada',
  emptyTitle: 'Sin muestras de peso',
  emptyDescription: 'Rastree el crecimiento de su ganado regularmente.',
  error: {
    record: 'Error al guardar muestra',
  },
}

export const waterQuality = {
  title: 'Calidad del Agua',
  description:
    'Monitorear condiciones del estanque (pH, temp, oxígeno) para salud óptima.',
  addRecord: 'Añadir Registro',
  addRecordTitle: 'Registrar Calidad del Agua',
  editRecordTitle: 'Editar Registro',
  deleteRecordTitle: 'Eliminar Registro',
  deleteConfirmation: '¿Está seguro de querer eliminar este registro?',
  saveRecord: 'Guardar Registro',
  qualityAlerts: 'Alertas de Calidad',
  selectFishBatch: 'Seleccionar lote de peces',
  recorded: 'Calidad del agua registrada',
  temp: 'Temp ({{label}})',
  do: 'DO (mg/L)',
  ammonia: 'Amoníaco',
  emptyTitle: 'Sin registros de calidad',
  emptyDescription: 'Monitoree sus parámetros de agua regularmente.',
  error: {
    record: 'Error al guardar registro',
  },
  labels: {
    ph: 'pH',
    temperature: 'Temperatura',
    dissolvedOxygen: 'Oxígeno Disuelto (mg/L)',
    ammonia: 'Amoníaco (mg/L)',
  },
}

export const health = {
  mortality,
  vaccinations,
  weight,
  waterQuality,
}

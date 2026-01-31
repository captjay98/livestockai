export const farms = {
  // Page headings
  title: 'Minhas Fazendas',
  description: 'Gerencie suas fazendas de gado e instalações',
  add: 'Adicionar Fazenda',
  create: 'Criar Fazenda',
  createFirst: 'Crie Sua Primeira Fazenda',
  createFarm: 'Criar Fazenda',
  createNewFarm: 'Criar Nova Fazenda',
  editFarm: 'Editar Fazenda',
  updateFarm: 'Atualizar Fazenda',
  updated: 'Fazenda atualizada',
  created: 'Fazenda criada',

  // Form fields
  farmName: 'Nome da Fazenda',
  location: 'Localização',
  farmType: 'Foco Principal',
  namePlaceholder: 'Digite o nome da fazenda',
  locationPlaceholder: 'Digite a localização',
  createDescription: 'Adicionar uma nova fazenda à sua conta',
  editDescription: 'Atualizar os detalhes da sua fazenda',

  // Placeholders
  placeholders: {
    name: 'Digite o nome da fazenda',
    location: 'Digite a localização, cidade ou região',
  },

  // Error messages
  error: {
    create: 'Falha ao criar fazenda',
    update: 'Falha ao atualizar fazenda',
    delete: 'Falha ao excluir fazenda',
  },

  // Empty state
  empty: {
    title: 'Você ainda não tem fazendas',
    description:
      'Crie sua primeira fazenda para começar a rastrear gado, despesas e mais.',
  },

  // Detail page
  detail: {
    info: 'Informações da Fazenda',
    name: 'Nome',
    type: 'Tipo',
    location: 'Localização',
    created: 'Criado',
    notFound: 'Fazenda Não Encontrada',
    notFoundDesc:
      'A fazenda que você está procurando não existe ou você não tem acesso a ela.',
    back: 'Voltar às Fazendas',
    tabs: {
      overview: 'Visão Geral',
      facilities: 'Instalações',
      activity: 'Atividade',
      settings: 'Configurações',
    },
  },

  // Dashboard stats
  dashboard: {
    livestock: 'Gado',
    activeBatches: '{{count}} lotes ativos',
    revenue: 'Receita',
    salesTransactions: '{{count}} vendas',
    expenses: 'Despesas',
    expenseRecords: '{{count}} registros de despesas',
  },

  // Active batches
  activeBatches: {
    title: 'Lotes Ativos',
  },

  // Structures
  structures: {
    title: 'Estruturas',
    description: 'Estruturas e instalações da fazenda',
    types: {
      pond: 'Tanque',
      tarpaulin: 'Lona',
      cage: 'Gaiola',
      house: 'Casa',
      coop: 'Galinheiro',
      pen: 'Cercado',
      barn: 'Celeiro',
      shed: 'Galpão',
      hive: 'Colmeia',
    },
    statuses: {
      active: 'Ativo',
      inactive: 'Inativo',
      maintenance: 'Manutenção',
    },
  },

  // Recent activity
  recentActivity: {
    title: 'Atividade Recente',
    sales: 'Vendas',
    expenses: 'Despesas',
  },

  // Quick actions
  quickActions: {
    manageBatches: 'Gerenciar Lotes',
    recordExpense: 'Registrar Despesa',
    viewReports: 'Ver Relatórios',
    tip: {
      title: 'Dica Rápida',
      text: 'Use ações rápidas para gerenciar eficientemente as operações diárias da sua fazenda.',
    },
  },

  // Geofence
  geofenceConfig: 'Configuração de Geocerca',
  geofenceDescription: 'Configure os limites geográficos da sua fazenda',

  // Farm types
  types: {
    poultry: 'Aves',
    aquaculture: 'Aquicultura',
    cattle: 'Gado Bovino',
    goats: 'Cabras',
    sheep: 'Ovelhas',
    apiary: 'Apiário',
    mixed: 'Misto',
  },
}

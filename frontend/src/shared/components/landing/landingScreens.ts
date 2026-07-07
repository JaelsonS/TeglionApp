const BASE = '/landing/screens'
export const LANDING_SCREENS = {
  dashboard: `${BASE}/dashboard.png`,
  portalCliente: `${BASE}/portal-cliente.png`,
  empresas: `${BASE}/empresas.png`,
  documentosFicheiros: `${BASE}/documentos-ficheiros.png`,
  documentosArquivos: `${BASE}/documentos-arquivos.png`,
  documentosHistorico: `${BASE}/documentos-historico.png`,
  tarefasObrigacoes: `${BASE}/tarefas-obrigacoes.png`,
  tarefasCalendario: `${BASE}/tarefas-calendario.png`,
  tarefasManuais: `${BASE}/tarefas-manuais.png`,
  novaEmpresa: `${BASE}/nova-empresa.png`,
} as const

export type LandingScreenKey = keyof typeof LANDING_SCREENS

export const LANDING_CAROUSEL_SLIDES: {
  title: string
  copy: string
  src: string
  alt: string
}[] = [
  {
    title: 'Painel operacional',
    copy: 'Fecha o mês com prazos e pendências à vista — sem abrir dez separadores.',
    src: LANDING_SCREENS.dashboard,
    alt: 'Painel operacional do TegLion com KPIs e prioridades',
  },
  {
    title: 'Empresas',
    copy: 'Carteira com NIF, regime, obrigações pendentes e estado de cada cliente.',
    src: LANDING_SCREENS.empresas,
    alt: 'Lista de empresas no TegLion',
  },
  {
    title: 'Ficheiros',
    copy: 'Organiza documentos por empresa, pasta e período — com upload rápido.',
    src: LANDING_SCREENS.documentosFicheiros,
    alt: 'Gestão de ficheiros do escritório',
  },
  {
    title: 'Documentos — validação',
    copy: 'Pré-visualiza, aprova ou rejeita sem descarregar para pastas soltas.',
    src: LANDING_SCREENS.documentosArquivos,
    alt: 'Validação de documentos com pré-visualização',
  },
  {
    title: 'Histórico de submissões',
    copy: 'Histórico consolidado por cliente e período, com exportação CSV.',
    src: LANDING_SCREENS.documentosHistorico,
    alt: 'Histórico de submissões de documentos',
  },
  {
    title: 'Obrigações fiscais',
    copy: 'IVA, Modelo 22, IES, DMR e SAF-T organizados por vencimento.',
    src: LANDING_SCREENS.tarefasObrigacoes,
    alt: 'Lista de obrigações fiscais por empresa',
  },
  {
    title: 'Calendário de tarefas',
    copy: 'Vista mensal com código de cores: atraso, pendente, reunião e concluído.',
    src: LANDING_SCREENS.tarefasCalendario,
    alt: 'Calendário mensal de tarefas e obrigações',
  },
  {
    title: 'Tarefas manuais',
    copy: 'Kanban interno para a equipa — do pedido à conclusão.',
    src: LANDING_SCREENS.tarefasManuais,
    alt: 'Quadro Kanban de tarefas manuais',
  },
  {
    title: 'Nova empresa',
    copy: 'Regista clientes com validação de NIF e passos guiados.',
    src: LANDING_SCREENS.novaEmpresa,
    alt: 'Assistente para adicionar nova empresa',
  },
]

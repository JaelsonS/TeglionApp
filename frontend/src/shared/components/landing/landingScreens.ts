const BASE = '/landing/screens'
export const LANDING_SCREENS = {
  dashboard: `${BASE}/dashboard.png`,
  portalCliente: `${BASE}/portal-cliente.png`,
  /** Site público de escritório fictício (Maya Contabilidade) — captura real do produto. */
  paginaPublica: `${BASE}/pagina-publica.jpg`,
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
    copy: 'KPIs, pendências e atalhos — o fecho do mês começa aqui, sem dez separadores abertos.',
    src: LANDING_SCREENS.dashboard,
    alt: 'Painel operacional do Teglion com KPIs e prioridades',
  },
  {
    title: 'Clientes',
    copy: 'Carteira com NIF, regime e estado — base para documentos, tarefas e portal.',
    src: LANDING_SCREENS.empresas,
    alt: 'Lista de clientes no Teglion',
  },
  {
    title: 'Documentos — pedidos e ficheiros',
    copy: 'Peça ao cliente no portal; valide o que chega — rasto do pedido à aprovação.',
    src: LANDING_SCREENS.documentosFicheiros,
    alt: 'Gestão de ficheiros do gabinete',
  },
  {
    title: 'Documentos — validação',
    copy: 'Pré-visualize, aprove ou peça correção — sem pastas soltas no email.',
    src: LANDING_SCREENS.documentosArquivos,
    alt: 'Validação de documentos com pré-visualização',
  },
  {
    title: 'Histórico de submissões',
    copy: 'Auditoria por cliente e período, com exportação CSV.',
    src: LANDING_SCREENS.documentosHistorico,
    alt: 'Histórico de submissões de documentos',
  },
  {
    title: 'Obrigações por cliente',
    copy: 'Prazos fiscais por empresa — organização interna; a submissão oficial continua nos canais habituais.',
    src: LANDING_SCREENS.tarefasObrigacoes,
    alt: 'Lista de obrigações fiscais por cliente',
  },
  {
    title: 'Tarefas — calendário operativo',
    copy: 'Trabalho da equipa por mês — distinto do calendário fiscal legal e dos agendamentos com clientes.',
    src: LANDING_SCREENS.tarefasCalendario,
    alt: 'Calendário mensal de tarefas da equipa',
  },
  {
    title: 'Tarefas — quadro',
    copy: 'Kanban interno do gabinete — do pedido à conclusão.',
    src: LANDING_SCREENS.tarefasManuais,
    alt: 'Quadro Kanban de tarefas manuais',
  },
  {
    title: 'Portal do cliente',
    copy: 'O cliente entrega documentos, vê mensagens e serviços — no browser, sem instalar app.',
    src: LANDING_SCREENS.portalCliente,
    alt: 'Portal do cliente Teglion no browser',
  },
  {
    title: 'Página pública',
    copy: 'Site do gabinete com marca, serviços e marcação — o mesmo sistema, à vista do cliente final.',
    src: LANDING_SCREENS.paginaPublica,
    alt: 'Página pública de exemplo (Maya Contabilidade) no Teglion',
  },
  {
    title: 'Novo cliente',
    copy: 'Assistente com validação de NIF e convite ao portal.',
    src: LANDING_SCREENS.novaEmpresa,
    alt: 'Assistente para adicionar novo cliente',
  },
]

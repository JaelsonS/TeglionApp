import type { MayaFieldHelp } from '@/features/maya/content/types'

/** Campos do assistente «Adicionar novo cliente» (CreateCompanyWizard). */
export const CLIENT_CREATE_FIELDS: MayaFieldHelp[] = [
  {
    id: 'clientType',
    name: 'Tipo de cliente',
    meaning:
      'Empresa, Trabalhador Independente ou Particular. É o primeiro campo do passo Identificação e determina quais campos e passos aparecem a seguir.',
    why: 'O Teglion adapta o cadastro ao tipo: empresa pede dados societários e IVA; particular e independente mostram o passo Pessoa Singular.',
    required: true,
    example: 'Empresa',
    dependsOn:
      'Empresa: nome comercial, forma jurídica, tipo de contabilidade, início de actividade, CAE e regime de IVA. Particular: esses campos de empresa ficam ocultos e o IVA de empresa não é pedido da mesma forma. Independente e Particular: aparece o passo Pessoa Singular.',
    emptyConsequence: 'O assistente não avança sem o tipo.',
    usedWhere: 'Lista (coluna Tipo), ficha e filtros.',
  },
  {
    id: 'taxId',
    name: 'NIF',
    meaning:
      'Número de identificação fiscal do cliente. O assistente exige 9 dígitos, dígito de controlo válido e o botão «Validar NIF» antes de sair do passo Identificação.',
    why: 'Identifica o cliente na lista, na ficha e na pesquisa. Não inventa regras fiscais extra: valida o formato e o checksum que o formulário já aplica.',
    required: true,
    format: 'NIF português, 9 dígitos',
    example: '500 000 000',
    emptyConsequence:
      'Sem NIF válido, o assistente mostra um erro e não deixa Continuar. Use «Validar NIF».',
    usedWhere: 'Lista, pesquisa, ficha (topo e Perfil) e convites.',
  },
  {
    id: 'legalName',
    name: 'Designação social / Nome do cliente',
    meaning:
      'Em Empresa e Independente é a designação social. Em Particular o rótulo passa a «Nome do cliente».',
    why: 'É o nome legal do cadastro. Se não preencher nome comercial, este nome também serve de nome de apresentação.',
    required: true,
    example: 'Empresa Exemplo, Lda.  ou  João Silva',
    emptyConsequence: 'O assistente pede o nome antes de avançar.',
    usedWhere: 'Lista, ficha e pesquisas.',
  },
  {
    id: 'displayName',
    name: 'Nome comercial',
    meaning: 'Nome pelo qual o escritório trata o cliente no dia-a-dia.',
    why: 'Quando existe, é este o nome que costuma aparecer na lista e no título da ficha.',
    required: false,
    dependsOn: 'Só aparece quando o tipo é Empresa.',
    example: 'Exemplo',
    usedWhere: 'Lista e cabeçalho da ficha.',
  },
  {
    id: 'legalForm',
    name: 'Forma jurídica',
    meaning: 'Forma jurídica da empresa (lista do país, em Portugal inclui Lda., S.A., cooperativa, etc.).',
    required: false,
    dependsOn: 'Só aparece quando o tipo é Empresa.',
    example: 'Sociedade por Quotas',
    usedWhere: 'Ficha, abaixo do nome, quando está preenchida.',
  },
  {
    id: 'phone',
    name: 'Telefone',
    meaning: 'Contacto telefónico do cadastro, com selector de indicativo.',
    required: false,
    example: '+351 910 000 000',
    usedWhere: 'Ficha (topo e Perfil) e pesquisa na lista.',
  },
  {
    id: 'email',
    name: 'E-mail',
    meaning:
      'E-mail do cadastro. Não é obrigatório para criar o cliente, mas o convite ao portal precisa de um e-mail válido.',
    why: 'Sem e-mail, a ficha mostra «sem e-mail no cadastro» e o convite por correio fica bloqueado até completar o Perfil.',
    required: false,
    format: 'Endereço de e-mail',
    example: 'geral@exemplo.pt',
    usedWhere: 'Convite ao portal, comunicação e pesquisa na lista.',
  },
  {
    id: 'postalCode',
    name: 'Código postal',
    meaning:
      'Código postal português. Ao preencher, o Teglion tenta sugerir localidade e freguesia.',
    required: true,
    format: '0000-000',
    example: '4000-000',
    emptyConsequence: 'Não avança no passo Identificação sem um código postal válido.',
    usedWhere: 'Perfil → morada.',
  },
  {
    id: 'locality',
    name: 'Localidade',
    meaning: 'Localidade / concelho. Pode vir preenchida pelo código postal; pode editar.',
    required: true,
    example: 'Porto',
    emptyConsequence: 'O assistente pede a localidade antes de avançar.',
    usedWhere: 'Perfil → morada (no hub o campo equivalente chama-se Concelho).',
  },
  {
    id: 'parish',
    name: 'Freguesia',
    meaning: 'Freguesia da morada. Pode ser sugerida pelo código postal; pode editar.',
    required: false,
    example: 'Cedofeita',
    usedWhere: 'Perfil → morada.',
  },
  {
    id: 'street',
    name: 'Morada',
    meaning: 'Rua e número da sede ou da residência.',
    required: true,
    example: 'Avenida da República, 123',
    emptyConsequence: 'Não avança sem a morada.',
    usedWhere: 'Perfil → morada.',
  },
  {
    id: 'accountingType',
    name: 'Tipo de contabilidade',
    meaning: 'Enquadramento contabilístico que o escritório usa para este cliente (lista fixa do assistente).',
    required: true,
    dependsOn: 'Visível e obrigatório para Empresa e Independente. Oculto para Particular.',
    emptyConsequence: 'Nas regras em que o campo é obrigatório, o assistente não avança.',
    usedWhere: 'Ficha → Perfil → Enquadramento fiscal.',
  },
  {
    id: 'activityStartDate',
    name: 'Início de actividade',
    meaning: 'Data de início de actividade do cliente.',
    required: true,
    format: 'Data',
    example: '2020-01-15',
    dependsOn: 'Visível e obrigatório para Empresa e Independente. Oculto para Particular.',
    emptyConsequence: 'O assistente pede esta data antes de avançar, quando o tipo a mostra.',
    usedWhere: 'Ficha → Perfil.',
  },
  {
    id: 'shareCapital',
    name: 'Capital social',
    meaning: 'Capital social da empresa. Opcional.',
    required: false,
    dependsOn: 'Aparece para Empresa e Independente.',
    usedWhere: 'Ficha → Perfil.',
  },
  {
    id: 'caePrimary',
    name: 'CAE principal',
    meaning: 'Código de actividade económica principal. Pode pesquisar na lista ou escrever o código.',
    required: true,
    dependsOn: 'Visível e obrigatório para Empresa e Independente. Oculto para Particular.',
    emptyConsequence: 'O assistente pede o CAE principal antes de avançar, quando o tipo o mostra.',
    usedWhere: 'Ficha → Perfil.',
  },
  {
    id: 'caeSecondary',
    name: 'CAE secundário',
    meaning: 'Primeiro CAE secundário, opcional.',
    required: false,
    dependsOn: 'Aparece com o CAE principal, para Empresa e Independente.',
    usedWhere: 'Ficha → Perfil.',
  },
  {
    id: 'caeSecondary2',
    name: 'CAE secundário (2)',
    meaning: 'Segundo CAE secundário, opcional.',
    required: false,
    dependsOn: 'Aparece com o CAE principal, para Empresa e Independente.',
    usedWhere: 'Ficha → Perfil.',
  },
  {
    id: 'vatRegime',
    name: 'Regime de IVA',
    meaning: 'Regime de IVA da empresa. Lista do assistente (por exemplo Normal Trimestral, Isento).',
    required: true,
    dependsOn:
      'Não se pede da mesma forma a Particular. Se escolher Isento, aparece Motivo da isenção (obrigatório).',
    emptyConsequence: 'Nas empresas, o assistente pede o enquadramento fiscal completo antes de avançar.',
    usedWhere: 'Lista (coluna Regime IVA) e Perfil.',
  },
  {
    id: 'vatExemptionReason',
    name: 'Motivo da isenção',
    meaning: 'Razão pela qual o cliente está isento de IVA.',
    required: true,
    dependsOn: 'Só aparece quando o regime de IVA é Isento.',
    emptyConsequence: 'Se o regime for Isento, o assistente não avança sem o motivo.',
    usedWhere: 'Ficha → Perfil.',
  },
  {
    id: 'irsFramework',
    name: 'Enquadramento IRS / IRC',
    meaning: 'Como este cliente se enquadra para IRS ou IRC. Lista fixa do assistente.',
    required: true,
    emptyConsequence: 'O assistente pede este campo no passo Fiscal.',
    usedWhere: 'Ficha → Perfil.',
  },
  {
    id: 'socialSecurityArea',
    name: 'Área da Segurança Social',
    meaning: 'Área ou serviço da Segurança Social, para organização interna do escritório.',
    required: false,
    usedWhere: 'Ficha → Perfil.',
  },
  {
    id: 'socialSecurityOneYearExemption',
    name: 'Isenção de 1 ano',
    meaning: 'Indica se o cliente tem isenção de um ano na Segurança Social (Sim / Não).',
    required: false,
    example: 'Não',
    usedWhere: 'Ficha → Perfil.',
  },
  {
    id: 'socialSecurityStartDate',
    name: 'Data de início (Segurança Social)',
    meaning: 'Data de início relevante para a Segurança Social.',
    required: false,
    format: 'Data',
    usedWhere: 'Ficha → Perfil.',
  },
  {
    id: 'socialSecurityQuarterlyDeclaration',
    name: 'Entrega da declaração trimestral',
    meaning: 'Se o cliente entrega declaração trimestral à Segurança Social (Sim / Não).',
    required: false,
    example: 'Sim',
    usedWhere: 'Ficha → Perfil.',
  },
  {
    id: 'spouse',
    name: 'Cônjuge',
    meaning: 'Se o cliente tem cônjuge (Sim / Não). Campo do passo Pessoa Singular.',
    required: false,
    dependsOn: 'O passo Pessoa Singular só existe para Trabalhador Independente e Particular.',
    usedWhere: 'Ficha → Perfil (também visível depois do cadastro).',
  },
  {
    id: 'irsDelivery',
    name: 'Entrega de IRS',
    meaning: 'Se este cliente entrega IRS (Sim / Não). Não calcula o imposto nem abre a campanha IRS.',
    required: false,
    dependsOn: 'Passo Pessoa Singular (Independente e Particular).',
    usedWhere: 'Ficha → Perfil. A campanha IRS continua a ser configurada em IRS.',
  },
  {
    id: 'validateEInvoice',
    name: 'Validar e-Fatura',
    meaning: 'Nota interna sobre validação de e-Fatura (Sim / Não).',
    required: false,
    dependsOn: 'Passo Pessoa Singular (Independente e Particular).',
    usedWhere: 'Ficha → Perfil.',
  },
  {
    id: 'communicateHousehold',
    name: 'Comunicar agregado familiar',
    meaning: 'Nota interna sobre comunicação do agregado familiar (Sim / Não).',
    required: false,
    dependsOn: 'Passo Pessoa Singular (Independente e Particular).',
    usedWhere: 'Ficha → Perfil.',
  },
  {
    id: 'assignedStaff',
    name: 'Responsável na equipa',
    meaning: 'Membro da equipa do escritório que fica responsável por este cliente. Lista a partir da equipa.',
    why: 'Obriga a haver um dono interno do processo. Não cria acesso ao portal do cliente.',
    required: true,
    emptyConsequence: 'Não avança no passo Responsáveis sem indicar a pessoa.',
    usedWhere: 'Ficha → Perfil → Responsável no escritório.',
  },
  {
    id: 'contactName',
    name: 'Contacto — nome',
    meaning: 'Nome da pessoa de referência no cliente (opcional).',
    required: false,
    usedWhere: 'Ficha → Perfil → Contacto principal.',
  },
  {
    id: 'contactRole',
    name: 'Contacto — função',
    meaning: 'Função da pessoa de referência (opcional).',
    required: false,
    example: 'Gerente',
    usedWhere: 'Ficha → Perfil → Contacto principal.',
  },
  {
    id: 'contactEmail',
    name: 'Contacto — e-mail',
    meaning:
      'E-mail da pessoa de referência. Distinto do e-mail do cadastro usado no convite ao portal.',
    required: false,
    usedWhere: 'Ficha → Perfil → Contacto principal.',
  },
  {
    id: 'contactPhone',
    name: 'Contacto — telefone',
    meaning: 'Telefone da pessoa de referência (opcional).',
    required: false,
    usedWhere: 'Ficha → Perfil → Contacto principal.',
  },
  {
    id: 'services',
    name: 'Serviços contratados',
    meaning:
      'Caixas de selecção dos serviços activos do catálogo. Associa internamente o cliente a esses serviços. Não publica nada na página pública.',
    why: 'Serve para o escritório saber o que este cliente tem contratado. Os serviços criam-se e publicam-se em Serviços.',
    required: false,
    dependsOn:
      'Se o catálogo não tiver serviços activos, o assistente avisa e o cliente é criado sem serviços pré-seleccionados. Crie serviços em Serviços, não em Definições.',
    usedWhere: 'Ficha → Perfil → Serviços contratados.',
  },
  {
    id: 'notes',
    name: 'Observações',
    meaning:
      'Notas internas do escritório, no último passo do assistente. Só a equipa as vê — o cliente no portal não.',
    required: false,
    usedWhere: 'Ficha → Perfil → Notas internas. Distintas das Mensagens.',
  },
]

export const CLIENT_PROFILE_ONLY_FIELDS: MayaFieldHelp[] = [
  {
    id: 'district',
    name: 'Distrito',
    meaning:
      'Distrito da morada. No Perfil o campo é visível; no assistente de criação o distrito fica oculto e preenche-se pelo código postal.',
    required: false,
    usedWhere: 'Ficha → Perfil → morada.',
  },
  {
    id: 'municipality',
    name: 'Concelho',
    meaning: 'Concelho da morada. Equivale à Localidade do assistente de criação.',
    required: false,
    usedWhere: 'Ficha → Perfil → morada.',
  },
  {
    id: 'assignedStaffLabel',
    name: 'Etiqueta (legado)',
    meaning:
      'Texto livre legado do responsável. O campo principal é «Membro da equipa». Use a lista da equipa sempre que possível.',
    required: false,
    usedWhere: 'Ficha → Perfil → Responsável no escritório.',
  },
]

export const CLIENT_LIST_FIELDS: MayaFieldHelp[] = [
  {
    id: 'col-name',
    name: 'Coluna Cliente',
    meaning: 'Nome de apresentação, NIF e etiquetas. Clique na linha (ou no cartão) para abrir a ficha.',
  },
  {
    id: 'col-type',
    name: 'Coluna Tipo',
    meaning: 'Tipo resumido na lista: Lda, SA, ENI ou Outro, derivado dos dados do cadastro.',
  },
  {
    id: 'col-vat',
    name: 'Coluna Regime IVA',
    meaning: 'Regime de IVA normalizado para a lista (Normal, Isenção, Trimestral, Mensal, ou o texto original).',
  },
  {
    id: 'col-obligations',
    name: 'Coluna Obrigações pendentes',
    meaning: 'Quantidade de obrigações em aberto deste cliente. Não abre a ficha por si — use a linha ou o menu.',
  },
  {
    id: 'col-activity',
    name: 'Coluna Última actividade',
    meaning: 'Quando houve a última actividade registada neste cliente.',
  },
  {
    id: 'col-status',
    name: 'Coluna Estado',
    meaning:
      'Ativo (operação normal), Atenção (estado operacional de atenção ou crítico) ou Inativo (removido da carteira activa).',
  },
  {
    id: 'search',
    name: 'Pesquisa',
    meaning:
      'Filtra a lista no momento em que escreve. Compara com nome, nome completo, NIF, e-mail e telefone. O placeholder diz «nome ou NIF», mas e-mail e telefone também entram.',
    format: 'Texto livre, instantâneo, no próprio ecrã (não recarrega a página).',
    emptyConsequence:
      'Se não houver correspondência, vê «Nenhum cliente neste filtro». Apague o texto para limpar a pesquisa.',
  },
  {
    id: 'filter-type',
    name: 'Filtro Tipo',
    meaning: 'Todos, Lda, SA, ENI ou Outro. Esconda os tipos que não quer ver.',
  },
  {
    id: 'filter-vat',
    name: 'Filtro Regime',
    meaning: 'Filtra pelo regime de IVA normalizado da lista. «Todos» mostra qualquer regime.',
  },
  {
    id: 'filter-status',
    name: 'Filtro Estado',
    meaning:
      'Ativos (predefinição: esconde inactivos e os que estão em atenção/crítico), Atenção, Inativos (pede a lista com inactivos) ou Todos.',
  },
  {
    id: 'filter-tag',
    name: 'Filtro Etiqueta',
    meaning:
      'Só aparece se o escritório tiver etiquetas. Mostra clientes com essa etiqueta. «Todas» limpa o filtro.',
  },
]

export const CLIENT_CREATE_FIELD_IDS = CLIENT_CREATE_FIELDS.map((field) => field.id)

export const CLIENT_PROFILE_FIELDS: MayaFieldHelp[] = [
  ...CLIENT_CREATE_FIELDS.filter((field) => field.id !== 'legalForm' && field.id !== 'locality'),
  ...CLIENT_PROFILE_ONLY_FIELDS,
]

export function pickClientFields(fields: MayaFieldHelp[], ids: string[]): MayaFieldHelp[] {
  const map = new Map(fields.map((field) => [field.id, field]))
  return ids.flatMap((id) => {
    const field = map.get(id)
    return field ? [field] : []
  })
}

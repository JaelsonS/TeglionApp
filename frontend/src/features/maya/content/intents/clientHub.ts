import { CLIENT_PROFILE_FIELDS } from '@/features/maya/content/intents/clientFields'
import { defineIntent } from '@/features/maya/content/types'

export const CLIENT_HUB_INTENTS = [
  defineIntent({
    id: 'client-hub',
    title: 'O que é a ficha deste cliente?',
    shortDescription: 'ficha do cliente',
    answer:
      'Esta é a ficha (hub) de um cliente da carteira do escritório — não é o portal onde o cliente entra. Tabs: Resumo, Perfil, Actividade, Obrigações, Documentos, Tarefas e Comunicação. No topo: voltar à lista, etiquetas, convite ou gestão de acesso ao portal, atalho para Mensagens e Editar (abre o Perfil). Os números (obrigações pendentes, documentos por validar, tarefas abertas, mensagens não lidas) são só desta empresa. Não há tab de Solicitações nem de Notas: notas estão no Perfil; pedidos públicos estão em Serviços.',
    steps: [
      'Comece pelo Resumo para o estado',
      'Editar ou tab Perfil para corrigir o cadastro',
      'Documentos, Obrigações, Tarefas e Comunicação para o trabalho corrente',
      'Convide ao portal se ainda não tiver acesso e houver e-mail',
    ],
    deepLink: '/app/firm/clients',
    relatedIntents: [
      'client-hub-overview',
      'client-profile',
      'client-documents',
      'client-services',
      'client-requests',
      'client-notes',
      'client-history',
      'client-actions',
    ],
    followUpPrompt: 'Que parte da ficha quer perceber?',
    ctaLabel: 'Ir para Clientes',
    nextSteps: [
      { label: 'Resumo', intentId: 'client-hub-overview' },
      { label: 'Perfil / editar', intentId: 'client-profile' },
      { label: 'Documentos', intentId: 'client-documents' },
      { label: 'Serviços', intentId: 'client-services' },
      { label: 'Solicitações', intentId: 'client-requests' },
      { label: 'Acções', intentId: 'client-actions' },
    ],
  }),
  defineIntent({
    id: 'client-hub-overview',
    title: 'O que aparece no Resumo?',
    shortDescription: 'resumo do cliente',
    answer:
      'O Resumo é o painel inicial da ficha. Atalhos para Obrigações, Documentos, Tarefas e Mensagens. Indicador de risco desta empresa. Histórico de acesso ao portal (sem acesso, convite pendente, activo ou revogado). Próximos prazos. Alertas de risco e tarefas urgentes. Se existirem comunicados, vê se estão lidos, com confirmação pendente ou por ler. Actividade recente (até 6 eventos) com «Ver tudo» para a tab Actividade.',
    steps: [
      'Leia os números no topo da ficha',
      'Use os atalhos para saltar à tab certa',
      'Abra Actividade se precisar do histórico completo',
    ],
    deepLink: '/app/firm/clients',
    relatedIntents: ['client-hub', 'client-history', 'client-obligations', 'clients-invite'],
    ctaLabel: 'Ir para Clientes',
    nextSteps: [
      { label: 'Perfil', intentId: 'client-profile' },
      { label: 'Actividade', intentId: 'client-history' },
    ],
  }),
  defineIntent({
    id: 'client-profile',
    title: 'Está a editar os dados deste cliente',
    shortDescription: 'editar cliente',
    answer:
      'Não existe uma página /clients/…/edit. Editar (no topo) ou a tab Perfil abrem os mesmos dados do cadastro, em edição inline. O texto do ecrã diz: as alterações guardam automaticamente — não há botão Guardar no Perfil. Pode alterar tipo, nomes, NIF, morada, fiscal, contactos, responsável, serviços contratados e notas internas. A forma jurídica do assistente de criação não tem campo próprio neste Perfil. Há um campo legado «Etiqueta» do responsável: prefira o membro da equipa. No fundo, se existirem, aparecem alterações anteriores do perfil.',
    steps: [
      'Clique em Editar ou na tab Perfil',
      'Altere o campo',
      'Espere a gravação automática (cerca de um segundo depois de parar de escrever)',
      'Volte ao Resumo ou a outra tab',
    ],
    deepLink: '/app/firm/clients',
    relatedIntents: ['clients-create', 'client-services', 'client-notes', 'client-hub'],
    fields: CLIENT_PROFILE_FIELDS,
    followUpPrompt: 'Que campo quer perceber?',
    ctaLabel: 'Ir para Clientes',
    nextSteps: [
      { label: 'Serviços contratados', intentId: 'client-services' },
      { label: 'Notas internas', intentId: 'client-notes' },
      { label: 'Convite ao portal', intentId: 'clients-invite' },
    ],
    commonProblems: [
      {
        id: 'no-save-button',
        title: 'Onde está Guardar?',
        answer:
          'No Perfil não há Guardar: a ficha envia a alteração sozinha. No cadastro novo, o botão final é «Criar cliente».',
      },
    ],
  }),
  defineIntent({
    id: 'client-documents',
    title: 'Está nos documentos deste cliente',
    shortDescription: 'documentos do cliente',
    answer:
      'A tab Documentos da ficha lista pedidos de documentos desta empresa (título e estado). Não carrega ficheiros daqui nem apaga pedidos. Vazio: «Sem pedidos de documentos activos.» O botão «Abrir pedidos» vai a Documentos → Pedidos já com este cliente. Criar, acompanhar e validar entregas faz-se nesse módulo. Os documentos do cliente no portal ficam associados a estes pedidos — não há uma pasta solta nesta tab.',
    steps: [
      'Veja os pedidos activos nesta tab',
      'Clique em Abrir pedidos para criar ou gerir',
      'O cliente envia os ficheiros no portal quando o pedido existir',
    ],
    deepLink: '/app/firm/clients',
    relatedIntents: ['documents', 'documents-requests', 'client-hub', 'clients-invite'],
    ctaLabel: 'Ir para pedidos',
    nextSteps: [
      { label: 'Como funcionam os pedidos', intentId: 'documents-requests' },
      { label: 'Módulo Documentos', intentId: 'documents' },
    ],
    commonProblems: [
      {
        id: 'cannot-upload',
        title: 'Não consigo adicionar um ficheiro aqui',
        answer:
          'Esta tab não tem carregamento. Abra «Abrir pedidos» e crie um pedido de documentos para este cliente.',
      },
    ],
  }),
  defineIntent({
    id: 'client-services',
    title: 'Como funcionam os serviços deste cliente?',
    shortDescription: 'serviços do cliente',
    answer:
      'Não há tab Serviços na ficha. Os serviços associados estão no Perfil, em «Serviços contratados»: caixas dos serviços activos do catálogo. Marcar ou desmarcar guarda automaticamente. Isto é associação interna — não publica o serviço na página pública, não cria uma solicitação e não agenda. Os serviços criam-se, editam-se e publicam-se em Serviços. Se o catálogo estiver vazio, o Perfil diz que não há serviços configurados; crie-os em Serviços. Depois de associar, o escritório vê o que este cliente tem contratado; o cliente no portal não gere este bloco.',
    steps: [
      'Abra a ficha → Perfil',
      'Desça até Serviços contratados',
      'Marque ou desmarque',
      'Para criar um serviço novo, vá a Serviços',
    ],
    deepLink: '/app/firm/services',
    relatedIntents: ['service', 'client-profile', 'client-requests', 'irs-campaign'],
    ctaLabel: 'Ir para Serviços',
    nextSteps: [
      { label: 'Catálogo de serviços', intentId: 'service' },
      { label: 'Solicitações', intentId: 'client-requests' },
      { label: 'IRS para este cliente', intentId: 'irs-send' },
    ],
  }),
  defineIntent({
    id: 'client-requests',
    title: 'Onde vejo as solicitações deste cliente?',
    shortDescription: 'solicitações do cliente',
    answer:
      'A ficha do cliente não tem tab Solicitações. Há dois sítios em Serviços. Solicitações: pedidos que chegam da página pública (pessoa ainda não era cliente da carteira, ou veio pelo formulário público — incluindo IRS publicado). Cada pedido tem estado próprio nessa lista; daí a equipa trata e, se fizer sentido, o cadastro na carteira. Central: pedidos de quem já usa a app como cliente. A resposta do cliente a um formulário público aparece em Solicitações, não na lista IRS e não nesta ficha. Documentos pedidos pelo escritório aparecem na tab Documentos / módulo Pedidos, não em Solicitações.',
    steps: [
      'Pedidos do site: Serviços → Solicitações',
      'Pedidos de clientes da app: Serviços → Central',
      'Documentos que o escritório pediu: ficha → Documentos ou Documentos → Pedidos',
    ],
    deepLink: '/app/firm/services?tab=inquiries',
    relatedIntents: ['requests', 'requests-central', 'client-documents', 'irs-track', 'service'],
    ctaLabel: 'Ir para Solicitações',
    nextSteps: [
      { label: 'Solicitações públicas', intentId: 'requests' },
      { label: 'Central', intentId: 'requests-central' },
      { label: 'Acompanhar IRS', intentId: 'irs-track' },
    ],
    commonProblems: [
      {
        id: 'where-is-response',
        title: 'Onde vejo a resposta do cliente?',
        answer:
          'Formulário público (incluindo IRS): Serviços → Solicitações. Mensagem: ficha → Comunicação ou Mensagens. Ficheiro pedido pelo escritório: Documentos → Pedidos.',
      },
    ],
  }),
  defineIntent({
    id: 'client-notes',
    title: 'Para que servem as notas internas?',
    shortDescription: 'notas do cliente',
    answer:
      'Não há tab Notas. As notas são o campo Observações no Perfil («Notas internas — só visível ao escritório»). Servem para a equipa: contexto, combinados, alertas internos. Cria e edita no Perfil; a gravação é automática. Não há botão de eliminar separado: apague o texto e deixe gravar. Não substituem Mensagens (conversa com o cliente) nem comunicados. O portal do cliente não mostra estas observações. Alterações de perfil podem aparecer no histórico de alterações do Perfil e na Actividade como eventos de perfil.',
    steps: [
      'Abra Perfil',
      'Desça até Notas internas',
      'Escreva ou apague o texto',
      'Espere a gravação automática',
    ],
    deepLink: '/app/firm/clients',
    relatedIntents: ['client-profile', 'client-history', 'messages'],
    fields: CLIENT_PROFILE_FIELDS.filter((field) => field.id === 'notes'),
    ctaLabel: 'Ir para Clientes',
  }),
  defineIntent({
    id: 'client-history',
    title: 'Está na actividade deste cliente',
    shortDescription: 'histórico do cliente',
    answer:
      'A tab Actividade tem o feed visível e, abaixo, o histórico completo. Tipos: mensagem, documento, tarefa, obrigação, perfil, alerta e outros. Ocultar um evento pede confirmação e tira-o do feed sem apagar o registo — pode voltar a mostrá-lo. O histórico completo filtra por tipo, visível/oculto, pesquisa e datas, e permite ocultar todas as entradas do feed (com confirmação). «Ver tudo» no Resumo abre esta tab. Isto não é o histórico de acesso ao portal (esse está no Resumo).',
    steps: [
      'Use o feed para o dia-a-dia',
      'Abra o histórico completo para filtrar',
      'Oculte ruído do feed se precisar; o registo mantém-se',
    ],
    deepLink: '/app/firm/clients',
    relatedIntents: ['client-hub-overview', 'client-profile', 'messages'],
    ctaLabel: 'Ir para Clientes',
    fields: [
      {
        id: 'kind-message',
        name: 'Evento: Mensagem',
        meaning: 'Actividade de comunicação com este cliente.',
      },
      {
        id: 'kind-document',
        name: 'Evento: Documento',
        meaning: 'Pedido ou entrega de documentos.',
      },
      {
        id: 'kind-task',
        name: 'Evento: Tarefa',
        meaning: 'Tarefa ligada a este cliente.',
      },
      {
        id: 'kind-obligation',
        name: 'Evento: Obrigação',
        meaning: 'Prazo ou obrigação fiscal deste cliente.',
      },
      {
        id: 'kind-profile',
        name: 'Evento: Perfil',
        meaning: 'Alteração aos dados do cadastro.',
      },
      {
        id: 'kind-alert',
        name: 'Evento: Alerta',
        meaning: 'Alerta ou comunicado relacionado.',
      },
      {
        id: 'kind-activity',
        name: 'Evento: Outros',
        meaning: 'Outra actividade operacional.',
      },
    ],
  }),
  defineIntent({
    id: 'client-obligations',
    title: 'Está nas obrigações deste cliente',
    shortDescription: 'obrigações do cliente',
    answer:
      'A tab Obrigações lista prazos fiscais desta empresa (título, data, estado). Vazio: «Sem obrigações registadas para esta empresa.» Não cria obrigações nesta tab: «Abrir módulo completo» vai a Obrigações dos Clientes já com este cliente. A coluna da lista de clientes mostra quantas obrigações estão pendentes.',
    steps: [
      'Consulte os prazos nesta tab',
      'Abra o módulo completo para criar ou tratar',
    ],
    deepLink: '/app/firm/tasks/obligations',
    relatedIntents: ['obligations', 'client-hub', 'fiscal-calendar'],
    ctaLabel: 'Ir para Obrigações',
  }),
  defineIntent({
    id: 'client-tasks',
    title: 'Está nas tarefas deste cliente',
    shortDescription: 'tarefas do cliente',
    answer:
      'A tab Tarefas lista tarefas desta empresa. Vazio quando não há tarefas. Criar e concluir faz-se no módulo Tarefas, via «Abrir módulo completo» já filtrado neste cliente. Distinto de Obrigações (prazos fiscais) e de Solicitações (pedidos de serviço).',
    steps: [
      'Veja as tarefas desta ficha',
      'Abra o módulo Tarefas para criar ou editar',
    ],
    deepLink: '/app/firm/tasks',
    relatedIntents: ['tasks-manual', 'client-obligations', 'client-hub'],
    ctaLabel: 'Ir para Tarefas',
  }),
  defineIntent({
    id: 'client-messages',
    title: 'Está na comunicação deste cliente',
    shortDescription: 'mensagens do cliente',
    answer:
      'A tab Comunicação mostra a conversa com este cliente. O botão Mensagens no topo da ficha abre o módulo Mensagens já filtrado. Distinto das notas internas (só equipa) e dos comunicados (avisos). O cliente no portal vê as mensagens, não as observações do Perfil.',
    steps: [
      'Use a tab Comunicação para o fio desta empresa',
      'Ou abra Mensagens no topo da ficha',
    ],
    deepLink: '/app/firm/messages',
    relatedIntents: ['messages', 'client-notes', 'clients-invite'],
    ctaLabel: 'Ir para Mensagens',
  }),
  defineIntent({
    id: 'client-actions',
    title: 'Que acções existem na ficha?',
    shortDescription: 'acções do cliente',
    answer:
      'Na ficha: voltar à lista; etiquetas (ligar/desligar); convite ao portal ou Gerir acesso (revogar / reemitir — revogar não apaga dados); Mensagens; Editar (Perfil, gravação automática); mudar de tab. No Resumo, atalhos para obrigações, documentos, tarefas e mensagens. Em Documentos/Obrigações/Tarefas, abrir o módulo completo. Em Actividade, ocultar eventos do feed. Não há nesta ficha: eliminar cliente, criar solicitação, carregar documento, publicar serviço ou enviar IRS. Remover da carteira está no menu ⋯ da lista. A Maya não ensina a contornar permissões da equipa.',
    steps: [
      'Use o topo para convite, mensagens e editar',
      'Use as tabs para o trabalho do cliente',
      'Arquivar só na lista, com confirmação',
    ],
    deepLink: '/app/firm/clients',
    relatedIntents: [
      'clients-invite',
      'clients-archive',
      'client-profile',
      'client-documents',
      'client-history',
    ],
    ctaLabel: 'Ir para Clientes',
    fields: [
      {
        id: 'action-edit',
        name: 'Editar',
        meaning: 'Abre o Perfil desta ficha. Gravação automática.',
      },
      {
        id: 'action-invite',
        name: 'Convidar / Gerir acesso',
        meaning: 'Convite, revogação ou novo link. Revogar não apaga a ficha.',
      },
      {
        id: 'action-messages',
        name: 'Mensagens',
        meaning: 'Abre a conversa deste cliente.',
      },
      {
        id: 'action-tags',
        name: 'Etiquetas',
        meaning: 'Liga ou tira etiquetas do escritório neste cliente.',
      },
      {
        id: 'action-hide',
        name: 'Ocultar no feed',
        meaning: 'Tira o evento da Actividade visível; o histórico completo mantém o registo.',
      },
      {
        id: 'action-archive',
        name: 'Remover da carteira',
        meaning: 'Só na lista (menu ⋯). Marca inactivo após confirmação.',
      },
    ],
    nextSteps: [
      { label: 'Arquivar', intentId: 'clients-archive' },
      { label: 'Convite', intentId: 'clients-invite' },
      { label: 'Próximo passo', intentId: 'clients-next-steps' },
    ],
  }),
]

import { defineIntent } from '@/features/maya/content/types'

export const SERVICE_INTENTS = [
  defineIntent({
    id: 'service',
    title: 'Como criar um serviço?',
    shortDescription: 'catálogo de serviços',
    answer:
      'Um serviço é o que o escritório oferece (consultoria, IRS, etc.). Em Serviços → Catálogo active um modelo ou adicione um serviço. O editor tem 5 passos: 1. O que oferece · 2. Imagem · 3. Como solicita · 4. Publicação · 5. Pré-visualização. Guardar serviço grava; não publica. Publicado = visível na página pública (slug + opção marcada + Guardar). Pedidos do site vão para Solicitações. IRS tem área própria em IRS. A Central é só para clientes já na app.',
    steps: [
      'Abra Serviços → Catálogo',
      'Adicione ou active um serviço',
      'Preencha o nome (obrigatório) e o restante da oferta',
      'Configure o formulário se precisar de perguntas extra',
      'No passo Publicação, defina o slug, marque para o site e Guardar',
    ],
    deepLink: '/app/firm/services',
    relatedIntents: ['service-editor', 'service-form', 'service-publish', 'requests', 'irs-campaign'],
    followUpPrompt: 'Quer o detalhe dos campos, do formulário ou da publicação?',
    nextSteps: [
      { label: 'Campos e botões do editor', intentId: 'service-editor' },
      { label: 'Formulário e documentos', intentId: 'service-form' },
      { label: 'Publicar', intentId: 'service-publish' },
    ],
  }),
  defineIntent({
    id: 'service-editor',
    title: 'Campos do editor de serviço',
    shortDescription: 'editor de serviço',
    answer:
      'O editor completo abre a partir do Catálogo ou da área IRS (Editar / Criar serviço). Passo 1 — O que oferece: nome, duração, preço, texto de IVA, serviço activo, exige agendamento, descrição e pagamento. Passo 2 — imagem (só aplica depois de Guardar). Passo 3 — documentos e perguntas. Passo 4 — slug e publicar no site. Passo 5 — pré-visualização local. Botões: Cancelar fecha sem guardar. Guardar serviço grava e fecha. Duplicar (só em edição) cria cópia privada. Apagar pede confirmação e falha se já houver solicitações — nesse caso desactive o serviço.',
    steps: [
      'Passo 1: nome obrigatório; duração 15–480 min',
      'Marque «Exige agendamento» só se o cliente tiver de escolher horário',
      'Configure pagamento (cartão/MB WAY precisam da Stripe ligada pelo responsável)',
      'Passo 4: slug + publicar no site',
      'Guardar serviço',
    ],
    deepLink: '/app/firm/services',
    relatedIntents: ['service-form', 'service-publish', 'service-payment', 'irs-create-service'],
    fields: [
      {
        id: 'name',
        name: 'Nome *',
        meaning: 'Nome que o cliente vê.',
        example: 'Consultoria fiscal',
        required: true,
        emptyConsequence: 'O Teglion mostra «Indique o nome do serviço» e não guarda.',
        usedWhere: 'Catálogo, página pública, pedidos.',
      },
      {
        id: 'duration',
        name: 'Duração (min)',
        meaning: 'Duração estimada em minutos.',
        format: '15 a 480. Fora disto: «Duração inválida».',
        example: '60',
      },
      {
        id: 'price',
        name: 'Preço',
        meaning: 'Valor em euros mostrado ao cliente.',
        usedWhere: 'Página pública e listagens.',
      },
      {
        id: 'vat',
        name: 'Texto do IVA (página pública)',
        meaning: 'Frase sob o preço: sem frase, IVA incluído ou IVA acrescido.',
        why: 'Só texto visível — não altera o pagamento Stripe.',
        emptyConsequence: 'O preço aparece sem menção a IVA.',
      },
      {
        id: 'active',
        name: 'Serviço activo',
        meaning: 'Desligado = inactivo: não aparece para a equipa nem no site.',
        why: 'Alternativa segura a apagar quando já existem solicitações.',
      },
      {
        id: 'booking',
        name: 'Exige agendamento',
        meaning: 'O cliente escolhe um horário disponível na página pública.',
        dependsOn:
          '«Pedir pagamento ao marcar o horário» só fica disponível com esta opção ligada e com a Stripe pronta.',
        usedWhere: 'Página pública do serviço + disponibilidade em Agenda → Definições.',
      },
      {
        id: 'description',
        name: 'Descrição',
        meaning: 'Texto apresentado na página pública do serviço. Pode ficar vazio.',
        usedWhere: 'Página pública e pré-visualização.',
      },
      {
        id: 'banner',
        name: 'Imagem / banner',
        meaning: 'Foto do cartão e da página do serviço. JPG, PNG ou WebP.',
        emptyConsequence: 'A página mostra só texto.',
        usedWhere: 'A imagem só fica aplicada depois de Guardar o serviço.',
      },
      {
        id: 'logo',
        name: 'Mostrar logótipo do escritório na página deste serviço',
        meaning: 'Usa o logótipo de Definições → Identidade no topo da página deste serviço.',
      },
    ],
    nextSteps: [
      { label: 'Formulário', intentId: 'service-form' },
      { label: 'Pagamento', intentId: 'service-payment' },
      { label: 'Publicar', intentId: 'service-publish' },
    ],
  }),
  defineIntent({
    id: 'service-form',
    title: 'Formulário e documentos do serviço',
    shortDescription: 'formulário do serviço',
    answer:
      'No passo 3 — Como solicita: Documentos necessários (nome, instruções, Pedir logo ou Só sugerir depois) e Formulário de perguntas. Nome, e-mail, telefone e NIF já são pedidos no topo da página pública — não os repita. Se desligar «Incluir formulário de perguntas», a página pede só identificação. Tipos de pergunta: Texto, Texto longo, Número, Data, Escolha única, Escolha múltipla, Sim/Não. Em escolhas, cada opção pode pedir um documento se o cliente a seleccionar. Perguntas de escolha sem opções bloqueiam a publicação.',
    steps: [
      'Adicione documentos se este serviço precisar de comprovativos',
      'Pedir logo = o cliente envia ao submeter; Só sugerir depois = o escritório pede mais tarde na solicitação',
      'Ligue o formulário só se precisar de perguntas extra',
      'Não use rótulos Nome, Email, Telefone, Telemóvel, Contacto, NIF ou Contribuinte',
      'Nas escolhas, preencha as opções',
      'Guarde o serviço',
    ],
    deepLink: '/app/firm/services',
    relatedIntents: ['service-editor', 'irs-form-questions', 'service-publish'],
    fields: [
      {
        id: 'doc-title',
        name: 'Nome do documento',
        meaning: 'O que o cliente deve enviar (ex.: Caderneta predial).',
      },
      {
        id: 'doc-instructions',
        name: 'Instruções (opcional)',
        meaning: 'Como obter ou o que deve constar no ficheiro.',
      },
      {
        id: 'doc-timing',
        name: 'Pedir logo / Só sugerir depois',
        meaning:
          'Pedir logo: pedido automático na submissão. Só sugerir depois: aparece na solicitação para o escritório decidir.',
      },
      {
        id: 'form-enabled',
        name: 'Incluir formulário de perguntas',
        meaning: 'Desligado = só identificação de contacto na página pública.',
      },
      {
        id: 'q-label',
        name: 'Pergunta',
        meaning: 'Texto da pergunta extra deste serviço.',
        example: 'É casado(a)?',
      },
      {
        id: 'q-type',
        name: 'Tipo',
        meaning: 'Texto, texto longo, número, data, escolha única, escolha múltipla ou Sim/Não.',
      },
      {
        id: 'q-required',
        name: 'Obrigatória',
        meaning: 'O cliente não submete sem responder.',
      },
      {
        id: 'q-option-doc',
        name: 'Pedir documento se escolher esta opção',
        meaning: 'Dependência: ao seleccionar aquela opção, o Teglion pede o documento associado.',
      },
    ],
    commonProblems: [
      {
        id: 'reserved',
        title: 'Erro de perguntas duplicadas',
        answer:
          'O guardar falha se uma pergunta se chamar Nome, Email, Telefone, NIF (ou equivalentes). Apague ou mude o nome — esses campos já existem no topo da página.',
      },
    ],
  }),
  defineIntent({
    id: 'service-payment',
    title: 'Pagamento do serviço',
    shortDescription: 'pagamento no serviço',
    answer:
      'No passo 1, Pagamento: Cartões e MB WAY usam o Checkout Stripe — o valor fica na conta do escritório. Só ficam prontos quando o responsável liga a Stripe em Definições → Pagamentos. «Pedir pagamento ao marcar o horário» exige «Exige agendamento» e Stripe pronta; o horário só confirma depois do pagamento. Transferência bancária e Referência Multibanco são indicações fora do Checkout (orçamento/PDF). Isto não é a mensalidade Teglion (essa está em Plano).',
    steps: [
      'Se quiser online: o responsável conclui Pagamentos',
      'Volte ao serviço e escolha Cartões ou MB WAY',
      'Para exigir pagamento na marcação, ligue primeiro Exige agendamento',
      'Ou escolha transferência / Multibanco se cobra fora da plataforma',
      'Guarde o serviço',
    ],
    deepLink: '/app/firm/settings?tab=pagamentos',
    relatedIntents: ['payments', 'booking', 'service-editor', 'billing'],
    ownerOnly: true,
    ctaLabel: 'Abrir Pagamentos',
    fields: [
      {
        id: 'cards',
        name: 'Cartões',
        meaning: 'Checkout Stripe com cartão (e carteiras digitais quando a Stripe as mostrar).',
        dependsOn: 'Conta Stripe do escritório no estado Pronto.',
      },
      {
        id: 'mbway',
        name: 'MB WAY',
        meaning: 'O cliente confirma no telemóvel no Checkout Stripe.',
        dependsOn: 'Mesma conta Stripe pronta.',
      },
      {
        id: 'pay-on-book',
        name: 'Pedir pagamento ao marcar o horário',
        meaning: 'O cliente paga e só depois o horário fica confirmado.',
        dependsOn: 'Exige agendamento + Stripe pronta. Sem agendamento, a opção aparece desactivada.',
      },
      {
        id: 'transfer',
        name: 'Transferência bancária',
        meaning: 'Indica dados no orçamento ou PDF — fora do Checkout.',
      },
      {
        id: 'multibanco',
        name: 'Referência Multibanco',
        meaning: 'Indicação offline, como a transferência — não gera referência automática aqui.',
      },
    ],
  }),
  defineIntent({
    id: 'service-publish',
    title: 'Publicar um serviço',
    shortDescription: 'publicar serviço',
    answer:
      'No passo 4 — Publicação: o serviço só aparece no site com a opção marcada, um slug válido e depois de Guardar. Estados: Inactivo (desactivado), Só interno (ainda não no site), Quase publicado (marcou mas falta slug), Publicado (site). Pré-visualização é local — o link real só existe após guardar com publicação. A página pública do escritório também tem de estar publicada.',
    steps: [
      'Passo 4 — Publicação',
      'Slug (ex.: consultoria-fiscal)',
      'Marcar «Publicar na página pública do escritório»',
      'Guardar serviço',
      'Copiar o link ou abrir a página pública',
    ],
    deepLink: '/app/firm/services',
    relatedIntents: ['service-editor', 'public-page', 'requests', 'irs-publish'],
    fields: [
      {
        id: 'slug',
        name: 'Endereço público (slug)',
        meaning: 'Segmento do URL deste serviço.',
        example: 'consultoria-fiscal',
        format: 'Curto, em minúsculas, tipicamente com hífens',
        emptyConsequence: 'Com a publicação marcada, o estado fica «Quase publicado» até haver slug e Guardar.',
        usedWhere: '/o-seu-slug/servicos/este-slug',
      },
      {
        id: 'listed',
        name: 'Publicar na página pública do escritório',
        meaning: 'Inclui este serviço no site, depois de Guardar com slug.',
        emptyConsequence: 'Fica só interno — a equipa vê, o visitante não.',
      },
    ],
    nextSteps: [
      { label: 'Receber pedidos', intentId: 'requests' },
      { label: 'Página pública', intentId: 'public-page' },
    ],
  }),
  defineIntent({
    id: 'requests',
    title: 'Como receber pedidos da página pública?',
    shortDescription: 'Solicitações',
    answer:
      'Pedidos de novos contactos da página pública aparecem em Serviços → Solicitações. Não entram na lista IRS nem na Central. Precisa de um serviço publicado e da página pública publicada. Aqui contacta, pede documentos e avança o estado. Quando o contacto passar a cliente, crie-o em Clientes.',
    steps: [
      'Publique pelo menos um serviço',
      'Publique a página pública',
      'Partilhe o link',
      'Abra Serviços → Solicitações',
      'Trate o pedido e, se fizer sentido, crie o cliente',
    ],
    deepLink: '/app/firm/services?tab=inquiries',
    relatedIntents: ['service', 'public-page', 'requests-central', 'clients'],
    ctaLabel: 'Abrir Solicitações',
    nextSteps: [{ label: 'O que é a Central', intentId: 'requests-central' }],
  }),
  defineIntent({
    id: 'requests-central',
    title: 'O que é a Central de Serviços?',
    shortDescription: 'Central',
    answer:
      'A Central reúne pedidos de clientes que já estão na carteira e usam a app Teglion. A captação de desconhecidos pela página pública fica em Solicitações. Se estiver à espera de um pedido do site e olhar para a Central, não o vai encontrar.',
    steps: [
      'Use Solicitações para leads do site',
      'Use a Central para clientes já na app',
      'Os dois dependem de serviços configurados no Catálogo',
    ],
    deepLink: '/app/firm/services?tab=central',
    relatedIntents: ['requests', 'clients', 'service'],
    ctaLabel: 'Abrir a Central',
  }),
]

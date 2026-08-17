import { defineIntent } from '@/features/maya/content/types'

export const PORTAL_CLIENT_INTENTS = [
  defineIntent({
    id: 'portal-home',
    title: 'Como usar este portal',
    shortDescription: 'início do portal',
    surface: 'client',
    answer:
      'Este é o portal do seu escritório de contabilidade. Aqui envia o que lhe pedem, vê prazos, marca serviços e escreve à equipa. O Início mostra só o próximo passo — não precisa de caçar datas espalhadas.',
    steps: [
      'Olhe o cartão «Próximo passo» — é o que o escritório precisa agora',
      'Se houver um pedido, abra Pedidos e envie o documento',
      'Em Serviços vê o que o escritório oferece e pode pedir ou agendar',
      'Use Mensagens para falar com a equipa',
    ],
    deepLink: '/app/client',
    relatedIntents: ['portal-requests', 'portal-services', 'portal-messages'],
    followUpPrompt: 'Quer que eu explique Pedidos ou Serviços?',
    nextSteps: [
      { label: 'Ver pedidos', intentId: 'portal-requests' },
      { label: 'Ver serviços', intentId: 'portal-services' },
    ],
  }),
  defineIntent({
    id: 'portal-requests',
    title: 'O que são os pedidos',
    shortDescription: 'pedidos do escritório',
    surface: 'client',
    answer:
      'Pedidos são documentos ou informações que o seu contabilista precisa. Cada cartão diz o que enviar. Quando entregar, o escritório vê no Teglion — não precisa de mandar pelo WhatsApp.',
    steps: [
      'Abra Pedidos na barra de baixo',
      'Escolha o pedido pendente',
      'Envie o ficheiro ou a resposta pedida',
      'O estado passa a entregue quando o escritório confirmar',
    ],
    deepLink: '/app/client/requests',
    relatedIntents: ['portal-documents', 'portal-home'],
    ctaLabel: 'Abrir pedidos',
    commonProblems: [
      {
        id: 'nao-tenho-doc',
        title: 'Não tenho o documento',
        answer:
          'Escreva ao escritório em Mensagens e diga o que falta. Eles podem adiar o pedido ou indicar uma alternativa.',
      },
    ],
  }),
  defineIntent({
    id: 'portal-services',
    title: 'Serviços do escritório',
    shortDescription: 'catálogo para o cliente',
    surface: 'client',
    answer:
      'Em Serviços vê o que o escritório faz: IRS, IVA, consultoria, e outros. Cada cartão pode ter Agendar (escolhe um horário) ou Pedir (o escritório recebe uma mensagem). Não cria várias contas — fica tudo neste portal.',
    steps: [
      'Abra Serviços',
      'Escolha o serviço (estão agrupados quando o escritório definiu categorias)',
      'Se tiver horário, escolha o dia e confirme',
      'Se for sob pedido, toque em Pedir — a equipa recebe a mensagem',
    ],
    deepLink: '/app/client/services',
    relatedIntents: ['portal-booking', 'portal-messages', 'portal-home'],
    ctaLabel: 'Ver serviços',
  }),
  defineIntent({
    id: 'portal-booking',
    title: 'Marcar um horário',
    shortDescription: 'agendar com o escritório',
    surface: 'client',
    answer:
      'Alguns serviços pedem um horário. Escolhe o serviço, vê os espaços livres do escritório e confirma. O horário fica na agenda da equipa. Se não houver vagas, escreva em Mensagens.',
    steps: [
      'Abra Serviços e toque em Agendar',
      'Escolha um horário livre',
      'Confirme — recebe o registo neste portal',
    ],
    deepLink: '/app/client/services',
    relatedIntents: ['portal-services', 'portal-messages'],
    ctaLabel: 'Ir a Serviços',
  }),
  defineIntent({
    id: 'portal-messages',
    title: 'Falar com o escritório',
    shortDescription: 'mensagens',
    surface: 'client',
    answer:
      'Mensagens é a conversa segura com o seu escritório. Ficheiros e texto ficam no Teglion, com histórico. Use isto em vez de espalhar assuntos por e-mail e WhatsApp.',
    steps: [
      'Abra Mensagens',
      'Escreva o que precisa ou anexe um ficheiro',
      'A equipa responde aqui — o sino avisa quando houver novidade',
    ],
    deepLink: '/app/client/messages',
    relatedIntents: ['portal-requests', 'portal-firm-contact'],
    ctaLabel: 'Abrir mensagens',
  }),
  defineIntent({
    id: 'portal-documents',
    title: 'Enviar e ver documentos',
    shortDescription: 'documentos do cliente',
    surface: 'client',
    answer:
      'Em Documentos envia comprovativos ao escritório e vê o que eles lhe enviaram. O arquivo guarda o histórico. Isto não substitui o pedido pontual em Pedidos — os pedidos dizem exactamente o que falta agora.',
    steps: [
      'Abra Mais → Documentos',
      'Envie o ficheiro',
      'Para um pedido concreto, use Pedidos — liga o ficheiro ao que foi pedido',
    ],
    deepLink: '/app/client/documents',
    relatedIntents: ['portal-requests', 'portal-home'],
    ctaLabel: 'Abrir documentos',
  }),
  defineIntent({
    id: 'portal-deadlines',
    title: 'Os seus prazos',
    shortDescription: 'obrigações fiscais',
    surface: 'client',
    answer:
      'Prazos estão agrupados: em atraso, esta semana, mais tarde. Não precisa de um calendário cheio de datas. Toque numa linha para ver o detalhe e o que enviar.',
    steps: [
      'Abra Mais → Prazos',
      'Comece por «Em atraso», se existir',
      'Toque no prazo para ver instruções e documentos',
    ],
    deepLink: '/app/client/agenda',
    relatedIntents: ['portal-requests', 'portal-documents'],
    ctaLabel: 'Ver prazos',
  }),
  defineIntent({
    id: 'portal-account',
    title: 'Conta, avisos e a app',
    shortDescription: 'definições do portal',
    surface: 'client',
    answer:
      'Em Conta e ajuda está o seu perfil, as notificações do telemóvel, instalar o portal como aplicação, e a Maya. O rodapé AfDigital — Soluções Tecnológicas é quem opera o Teglion — o seu contrato e os seus dados fiscais são com o escritório.',
    steps: [
      'Abra Mais → Conta e ajuda',
      'Active notificações se quiser avisos no telemóvel',
      'Pode instalar o portal no ecrã inicial',
    ],
    deepLink: '/app/client/account',
    relatedIntents: ['portal-maya', 'portal-firm-contact'],
    ctaLabel: 'Abrir conta',
  }),
  defineIntent({
    id: 'portal-maya',
    title: 'O que a Maya faz aqui',
    shortDescription: 'assistente no portal',
    surface: 'client',
    answer:
      'Eu explico os ecrãs deste portal: pedidos, serviços, prazos e mensagens. Não vejo os seus documentos, NIFs nem conversas privadas. Não substituo o contabilista — para o seu caso concreto, fale com o escritório.',
    steps: [
      'Toque no botão Maya',
      'Escolha o tema do ecrã em que está',
      'Se precisar do escritório, abra Mensagens',
    ],
    deepLink: '/app/client',
    relatedIntents: ['portal-home', 'portal-firm-contact'],
  }),
  defineIntent({
    id: 'portal-firm-contact',
    title: 'Falar com uma pessoa',
    shortDescription: 'contacto do escritório',
    surface: 'client',
    answer:
      'Para a sua contabilidade, a pessoa certa é a equipa do escritório — use Mensagens ou marque um serviço. A AfDigital — Soluções Tecnológicas opera o Teglion (o programa); não trata da sua declaração nem dos seus prazos.',
    steps: [
      'Abra Mensagens para escrever ao escritório',
      'Ou peça um serviço em Serviços',
      'Em urgências fiscais, ligue ao escritório pelos contactos que eles lhe deram',
    ],
    deepLink: '/app/client/messages',
    relatedIntents: ['portal-messages', 'portal-services'],
    ctaLabel: 'Abrir mensagens',
  }),
]

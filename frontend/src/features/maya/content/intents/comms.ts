import { defineIntent } from '@/features/maya/content/types'

export const COMMS_INTENTS = [
  defineIntent({
    id: 'messages',
    title: 'Como usar as mensagens?',
    shortDescription: 'chat com clientes',
    answer:
      'Em Mensagens conversa com clientes da carteira: texto, anexos e histórico. O cliente lê no portal. O menu ⋯ permite fixar conversas no topo. Não substitui um pedido formal de documentos — esse rasto fica em Documentos. A lista vazia significa que ainda não há conversas ou não seleccionou um cliente.',
    steps: [
      'Seleccione um cliente na lista',
      'Escreva e anexe ficheiros se precisar',
      'Use ⋯ para fixar conversas importantes',
      'Para um comprovativo formal, abra Documentos → Pedidos',
    ],
    deepLink: '/app/firm/messages',
    relatedIntents: ['documents', 'clients', 'alerts'],
    ctaLabel: 'Abrir Mensagens',
  }),
  defineIntent({
    id: 'alerts',
    title: 'Para que serve a Central de Alertas?',
    shortDescription: 'comunicados a clientes',
    answer:
      'A Central de Alertas envia um comunicado (título e mensagem) a toda a carteira ou a clientes escolhidos, com rasto de quem leu ou confirmou. É para avisos pontuais (prazos, recados operacionais). Artigos longos vão para Notícias. Não é o chat (Mensagens) nem as notificações internas em Definições.',
    steps: [
      'Escreva o título e a mensagem',
      'Escolha toda a carteira ou clientes específicos',
      'Publique e acompanhe quem leu',
      'Para um artigo, use Notícias',
    ],
    deepLink: '/app/firm/alerts',
    relatedIntents: ['news', 'messages', 'clients'],
    ctaLabel: 'Abrir Alertas',
    fields: [
      {
        id: 'title',
        name: 'Título',
        meaning: 'Assunto curto do comunicado.',
        required: true,
      },
      {
        id: 'body',
        name: 'Mensagem',
        meaning: 'Texto do aviso que o cliente lê no portal.',
        required: true,
      },
      {
        id: 'audience',
        name: 'Destinatários',
        meaning: 'Toda a carteira ou uma selecção de clientes.',
      },
    ],
  }),
  defineIntent({
    id: 'news',
    title: 'Como publicar notícias?',
    shortDescription: 'notícias do portal',
    answer:
      'Em Notícias publica artigos para os clientes lerem no portal. Pode adicionar capa e marcar como destaque (notícia principal). Diferente da Central de Alertas: aqui o conteúdo é mais longo e informativo; o alerta é um recado pontual e rastreável.',
    steps: [
      'Escreva o artigo',
      'Adicione capa se quiser',
      'Marque destaque só se for a principal',
      'Publique para ficar visível no portal',
    ],
    deepLink: '/app/firm/news',
    relatedIntents: ['alerts', 'clients'],
    ctaLabel: 'Abrir Notícias',
  }),
]

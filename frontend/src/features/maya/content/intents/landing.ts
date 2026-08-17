import { defineIntent } from '@/features/maya/content/types'
import { authFirmRegisterUrl } from '@/shared/constants/authPaths'
import { BRAND } from '@/shared/config/brand'

export const LANDING_INTENTS = [
  defineIntent({
    id: 'landing-what',
    title: 'O que é o Teglion?',
    shortDescription: 'a plataforma',
    surface: 'landing',
    answer:
      'O Teglion é a plataforma de gestão para escritórios de contabilidade em Portugal: portal do cliente, página pública, serviços, prazos, documentos, mensagens e captação de pedidos. Não substitui o software de contabilidade clássico — organiza a relação com o cliente e o trabalho do dia. É um produto da AfDigital — Soluções Tecnológicas, e evoluímos o sistema todos os dias com o que os escritórios realmente usam.',
    steps: [
      'Veja o que o escritório ganha: um sítio só para clientes, serviços e prazos',
      'A página pública capta pedidos sem WhatsApp perdido',
      'O portal do cliente entrega documentos e confirma avisos',
      'Comece com 14 dias grátis — sem cartão na inscrição',
    ],
    deepLink: authFirmRegisterUrl(),
    relatedIntents: ['landing-trial', 'landing-page', 'landing-portal', 'landing-human'],
    ctaLabel: 'Criar conta grátis',
    followUpPrompt: 'Quer o trial, a página pública, ou falar com uma pessoa?',
    nextSteps: [
      { label: 'Começar 14 dias grátis', intentId: 'landing-trial' },
      { label: 'Página pública', intentId: 'landing-page' },
      { label: 'Falar com uma pessoa', intentId: 'landing-human' },
    ],
    commonProblems: [
      {
        id: 'nao-e-software-contab',
        title: 'Substitui o Sage / Primavera / TOConline?',
        answer:
          'Não. O Teglion organiza clientes, documentos, prazos e captação. O fecho contabilístico continua no software que o escritório já usa.',
      },
      {
        id: 'para-quem',
        title: 'É para o meu escritório?',
        answer:
          'Sim, se trabalha com clientes em Portugal e quer um portal, uma página pública e um sítio único para pedidos e prazos — em vez de e-mail e WhatsApp espalhados.',
      },
    ],
  }),
  defineIntent({
    id: 'landing-daily',
    title: 'Evoluímos todos os dias',
    shortDescription: 'produto em evolução',
    surface: 'landing',
    answer:
      'O Teglion não fica parado. A AfDigital — Soluções Tecnológicas lança melhorias contínuas: portal do cliente, página pública, agenda, avisos, pagamentos e a própria Maya. Quem entra hoje usa um produto vivo — e o trial serve precisamente para acompanhar essa evolução no seu escritório, sem compromisso.',
    steps: [
      'Abra o trial e explore o painel do escritório',
      'Publique a página pública e um primeiro serviço',
      'Convide um cliente de teste ao portal',
      'Diga-nos o que falta — falamos consigo no WhatsApp',
    ],
    deepLink: authFirmRegisterUrl(),
    relatedIntents: ['landing-what', 'landing-trial', 'landing-human'],
    ctaLabel: 'Ver o produto em 14 dias',
    followUpPrompt: 'Quer que eu explique o trial ou prefere falar com uma pessoa?',
  }),
  defineIntent({
    id: 'landing-trial',
    title: '14 dias grátis',
    shortDescription: 'trial do escritório',
    surface: 'landing',
    answer:
      'O trial de 14 dias deixa o escritório criar a conta, configurar a página pública, publicar serviços e convidar clientes. Não precisa de cartão para começar. No fim do período escolhe o plano — ou fala connosco se quiser uma demonstração guiada.',
    steps: [
      'Crie a conta do escritório',
      'Coloque o logótipo e publique a página',
      'Active um serviço (por exemplo IRS ou um pedido de documentos)',
      'Convide um cliente ao portal para ver o fluxo completo',
    ],
    deepLink: authFirmRegisterUrl(),
    relatedIntents: ['landing-what', 'landing-pricing', 'landing-human'],
    ctaLabel: 'Começar agora',
    nextSteps: [
      { label: 'Ver preços', intentId: 'landing-pricing' },
      { label: 'Falar no WhatsApp', intentId: 'landing-human' },
    ],
  }),
  defineIntent({
    id: 'landing-page',
    title: 'Página pública do escritório',
    shortDescription: 'site do escritório',
    surface: 'landing',
    answer:
      'Cada escritório tem uma página pública no Teglion: marca, serviços, áreas, contactos e pedidos. O cliente escolhe o serviço, preenche o formulário e o pedido chega ao painel — sem perder conversas no WhatsApp. No editor, em «1. Barra do topo», o escritório edita o texto de cada link e escolhe se rola nesta página, abre um serviço ou vai para um site https.',
    steps: [
      'Defina o nome e o logótipo',
      'Publique serviços no catálogo',
      'No editor, em «1. Barra do topo», edite o texto e o destino de cada link',
      'Partilhe o link da página com os clientes',
    ],
    deepLink: '/#produto',
    relatedIntents: ['landing-portal', 'landing-trial', 'landing-what'],
    ctaLabel: 'Ver como funciona',
  }),
  defineIntent({
    id: 'landing-portal',
    title: 'Portal do cliente',
    shortDescription: 'app do cliente',
    surface: 'landing',
    answer:
      'O portal é a app do cliente do escritório: envia documentos, vê prazos, marca serviços, lê avisos e escreve à equipa. Tudo com a marca do escritório. O cliente deixa de perguntar «o que falta?» por mensagem — o Início mostra o próximo passo.',
    steps: [
      'O escritório convida o cliente por e-mail',
      'O cliente entra no portal com a marca do escritório',
      'Vê pedidos, prazos e avisos num só sítio',
      'Confirma leituras urgentes e envia o que falta',
    ],
    deepLink: '/#produto',
    relatedIntents: ['landing-what', 'landing-trial', 'landing-page'],
    ctaLabel: 'Ver o produto',
  }),
  defineIntent({
    id: 'landing-pricing',
    title: 'Preços e planos',
    shortDescription: 'planos Teglion',
    surface: 'landing',
    answer:
      'Há um trial de 14 dias e planos para o escritório crescer com o número de clientes. Os valores estão na secção de preços desta página. Se o seu caso for particular — várias localizações, volume alto ou onboarding guiado — fale connosco no WhatsApp.',
    steps: [
      'Consulte os planos mais abaixo nesta página',
      'Comece grátis 14 dias para validar no seu escritório',
      'Se quiser uma proposta, fale com uma pessoa',
    ],
    deepLink: '/#precos',
    relatedIntents: ['landing-trial', 'landing-human'],
    ctaLabel: 'Ir aos preços',
  }),
  defineIntent({
    id: 'landing-human',
    title: 'Falar com uma pessoa',
    shortDescription: 'WhatsApp AfDigital',
    surface: 'landing',
    answer:
      'Eu explico o Teglion aqui na página. Se preferir falar com uma pessoa da AfDigital — Soluções Tecnológicas, o WhatsApp é o caminho mais rápido: tiramos dúvidas de produto, trial e onboarding. Não vejo os seus documentos nem dados de clientes — esta conversa é só sobre o produto.',
    steps: [
      'Abra o WhatsApp pelo botão abaixo',
      'Diga que veio da página do Teglion',
      'Se for só uma dúvida rápida, continue comigo aqui',
    ],
    deepLink: BRAND.phone.whatsapp,
    relatedIntents: ['landing-what', 'landing-trial'],
    ctaLabel: 'Abrir WhatsApp',
    followUpPrompt: 'Quer que eu explique o trial enquanto isso?',
  }),
]

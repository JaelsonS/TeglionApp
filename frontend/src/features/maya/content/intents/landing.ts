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
      'O Teglion é software SaaS de gestão para gabinetes de contabilidade em Portugal: portal do cliente, página pública, serviços, prazos, documentos, mensagens e captação de pedidos. Não substitui o software de contabilidade clássico — organiza a relação com o cliente e o trabalho do dia. Evoluímos o sistema todos os dias com o que os gabinetes realmente usam.',
    steps: [
      'Veja o que o gabinete ganha: um sítio só para clientes, serviços e prazos',
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
          'Não. O Teglion organiza clientes, documentos, prazos e captação. O fecho contabilístico continua no software que o gabinete já usa.',
      },
      {
        id: 'para-quem',
        title: 'É para o meu gabinete?',
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
      'O Teglion não fica parado. Lançamos melhorias contínuas: portal do cliente, página pública, agenda, avisos, pagamentos e a própria Maya. Quem entra hoje usa um produto vivo — e o trial serve precisamente para acompanhar essa evolução no seu gabinete, sem compromisso.',
    steps: [
      'Abra o trial e explore o painel do gabinete',
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
    shortDescription: 'trial do gabinete',
    surface: 'landing',
    answer:
      'O trial de 14 dias deixa o gabinete criar a conta, configurar a página pública, publicar serviços e convidar clientes. Não precisa de cartão para começar. No fim do período escolhe o plano — ou fala connosco se quiser uma demonstração guiada.',
    steps: [
      'Crie a conta do gabinete',
      'Logótipo do portal (Identidade) e publique a página pública',
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
    title: 'Página pública do gabinete',
    shortDescription: 'site do gabinete',
    surface: 'landing',
    answer:
      'Cada gabinete tem uma página pública no Teglion: marca, serviços, contactos e pedidos online. No editor (Definições → Página pública) configura logótipos só do site (independentes do portal), fotos por secção, destaque e publicação em teglion.com/o-seu-slug. Os serviços publicados no catálogo aparecem automaticamente no site.',
    steps: [
      'Logótipo do portal em Identidade; site público em Página pública',
      'Publique serviços no catálogo ou IRS',
      'Configure destaque, secções e publique o site',
      'Partilhe o link com clientes',
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
      'O portal é a app do cliente do gabinete: envia documentos, vê prazos, marca serviços, lê avisos e escreve à equipa. Tudo com a marca do gabinete. O cliente deixa de perguntar «o que falta?» por mensagem — o Início mostra o próximo passo.',
    steps: [
      'O gabinete convida o cliente por e-mail',
      'O cliente entra no portal com a marca do gabinete',
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
      'Há um trial de 14 dias e planos para o gabinete crescer com o número de clientes. Os valores estão na secção de preços desta página. Se o seu caso for particular — várias localizações, volume alto ou onboarding guiado — fale connosco no WhatsApp.',
    steps: [
      'Consulte os planos mais abaixo nesta página',
      'Comece grátis 14 dias para validar no seu gabinete',
      'Se quiser uma proposta, fale com uma pessoa',
    ],
    deepLink: '/#precos',
    relatedIntents: ['landing-trial', 'landing-human'],
    ctaLabel: 'Ir aos preços',
  }),
  defineIntent({
    id: 'landing-human',
    title: 'Falar com uma pessoa',
    shortDescription: 'WhatsApp Teglion',
    surface: 'landing',
    answer:
      'Eu explico o Teglion aqui na página. Se preferir falar com uma pessoa da equipa Teglion, o WhatsApp é o caminho mais rápido: tiramos dúvidas de produto, trial e onboarding. Não vejo os seus documentos nem dados de clientes — esta conversa é só sobre o produto.',
    steps: [
      'Abra o WhatsApp pelo botão abaixo',
      'Diga que veio da página do Teglion',
      'Se for só uma dúvida rápida, continue comigo aqui',
    ],
    deepLink: BRAND.phone.whatsapp,
    relatedIntents: ['landing-what', 'landing-trial', 'landing-manual'],
    ctaLabel: 'Abrir WhatsApp',
    followUpPrompt: 'Quer que eu explique o trial enquanto isso?',
  }),
  defineIntent({
    id: 'landing-manual',
    title: 'Manual do utilizador',
    shortDescription: 'guia completo Maya',
    surface: 'landing',
    answer:
      'Escrevi o Manual do Teglion na minha voz: primeiros passos, clientes, documentos, avenças, portal, segurança e FAQ. É público — pode ler antes de criar conta. Se já é cliente do gabinete, entre no portal; se é o responsável do gabinete, comece o trial e use a Maya dentro da app.',
    steps: [
      'Abra o Manual e escolha um capítulo',
      'Se fizer sentido, comece os 14 dias grátis',
      'Já é cliente de um gabinete? Entre no portal',
    ],
    deepLink: '/manual',
    relatedIntents: ['landing-what', 'landing-trial', 'landing-human'],
    ctaLabel: 'Abrir Manual',
    nextSteps: [
      { label: 'Começar trial', intentId: 'landing-trial' },
      { label: 'Falar com pessoa', intentId: 'landing-human' },
    ],
  }),
]

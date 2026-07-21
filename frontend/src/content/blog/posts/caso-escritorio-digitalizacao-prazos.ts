import type { BlogPost } from '@/content/blog/types'
import {
  articleSection,
  comparisonTable,
  internalLinksSection,
  keyTakeaways,
  legalCallout,
  proseParagraphs,
  quoteBlock,
  sectionDivider,
  teglionCtaBlock,
} from '@/content/blog/shared'

export const postCasoDigitalizacao: BlogPost = {
  slug: 'caso-escritorio-digitalizacao-prazos',
  title: 'Caso: escritório no Norte saiu do WhatsApp e recuperou o calendário fiscal',
  excerpt:
    'História anonimizada: Escritório A (Norte), equipa pequena, documentos por chat e prazos na memória de uma pessoa — o que mudou com portal estruturado e rituais de prazo.',
  publishedAt: '2026-07-20',
  updatedAt: '2026-07-20',
  author: 'Jaelson Santos',
  authorRole: 'Fundador do Teglion · Escreve sobre fiscalidade em Portugal',
  category: 'Escritórios',
  audience: ['escritorio'],
  featured: false,
  tags: ['caso de estudo', 'digitalização', 'prazos fiscais', 'portal cliente', 'escritório contabilidade'],
  readMinutes: 10,
  series: {
    id: 'operacoes-escritorio-teglion',
    title: 'Operações do escritório',
    description: 'Digitalizar, prazos, SAF-T e software — trilho operacional para escritórios de contabilidade.',
    part: 5,
    totalParts: 5,
  },
  coverImage: {
    src: '/blog/covers/caso.svg',
    alt: 'Caso: digitalização e prazos no escritório',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Caso: escritório digitaliza e recupera prazos fiscais',
    description:
      'Caso anonimizado de escritório de contabilidade no Norte: de WhatsApp caótico a portal e prazos. Horas poupadas, lições e erros a evitar.',
    keywords: [
      'caso escritório contabilidade',
      'digitalizar escritório',
      'prazos fiscais',
      'portal cliente contabilista',
      'WhatsApp documentos fiscais',
    ],
  },
  relatedSlugs: [
    'digitalizar-escritorio-contabilidade-portugal',
    'gestao-prazos-fiscais-escritorio-contabilidade',
    'saft-efatura-validacao-documentos-escritorio',
    'software-escritorio-contabilidade-portugal',
    'ferramentas-essenciais-contabilista-2026',
  ],
  blocks: [
    legalCallout(
      'Caso ilustrativo e anonimizado, baseado em padrões observados em escritórios PME. Números são ordens de grandeza para aprendizagem — não são garantia de resultados nem auditoria de um cliente real identificado.',
    ),
    keyTakeaways([
      'Escritório A (Norte): ~90 clientes activos, 4 pessoas na equipa — documentos chegavam sobretudo por WhatsApp e email.',
      'Antes: ~12–15 h/semana só em chase de documentos e «já enviei / não recebi».',
      'Depois de 90 dias com portal + ritual de prazos: chase baixou para cerca de 4–6 h/semana na mesma carteira.',
      'O ganho não foi «mais uma app» — foi estado do pedido + responsável + data interna antes do prazo legal.',
      'Piloto com 15 clientes resistentes; só depois rollout. Big bang na véspera do IVA falhou mentalmente na primeira tentativa.',
      'Métrica que convenceu o sócio: menos horas extras na semana do dia 20 e menos clientes a «desaparecer» com documentos.',
    ]),
    ...proseParagraphs(
      'O Escritório A fica no Norte. Não vamos dizer a cidade nem o nome comercial — o padrão importa mais do que a placa na porta. Quatro pessoas, cerca de noventa clientes activos (mistura de ENI, micro-Lda e alguns com um ou dois trabalhadores). ERP a funcionar. Clientes fiéis. E, mesmo assim, a semana do IVA era um festival de mensagens.',
      'A sócia técnica descrevia assim o problema: «Sabemos lançar. Não sabemos parar de pedir a mesma factura três vezes.» Este caso resume o que fizeram em três meses — e o que não voltariam a fazer.',
    ),
    quoteBlock(
      'O WhatsApp não era o inimigo. O inimigo era não ter estado: pedido, recebido, rejeitado, validado.',
      'Sócia técnica — Escritório A (Norte)',
    ),
    ...articleSection({
      h2: 'O ponto de partida',
      id: 'ponto-partida',
      paragraphs: [
        'Documentos: 70% por WhatsApp (fotos e PDFs), 25% por email, 5% em mão. Prazos: um calendário de parede + a memória da colaboradora mais antiga. SAF-T: importado quando o cliente «se lembrava» de exportar. e-Fatura: consultado sob pressão, não como hábito.',
        'Custo invisível: duas a três horas por dia em follow-up, concentradas nos dias 12–19. Horas extras não facturadas. Erros de versão (cliente enviava factura corrigida e o lançamento ficava com a antiga).',
      ],
      blocks: [
        comparisonTable({
          caption: 'Retrato antes da mudança (ordens de grandeza)',
          headers: ['Indicador', 'Antes', 'Notas'],
          rows: [
            ['Clientes activos', '~90', 'Mix ENI / Lda'],
            ['Equipa', '4', 'Inclui sócia técnica'],
            ['Chase de documentos', '12–15 h/semana', 'Estimativa interna'],
            ['Canal dominante', 'WhatsApp', 'Sem arquivo estruturado'],
            ['Falhas de prazo «por documento»', '2–4/ano', 'Corrigidas a tempo, com stress'],
          ],
        }),
      ],
    }),
    sectionDivider(),
    ...articleSection({
      h2: 'O que mudaram (sem trocar o ERP)',
      id: 'o-que-mudaram',
      paragraphs: [
        'Decidiram não fazer «revolução total». Mantiveram o ERP. Introduziram três peças: (1) portal do cliente para pedidos e upload; (2) ritual interno de prazos (dia 8 pedidos, dia 12 chase, dia 15 corte, dia 18–19 submissão); (3) estados visíveis para o cliente.',
        'Ferramentas de portal (no espírito do que o Teglion oferece a escritórios) passaram a ser o canal oficial. WhatsApp ficou para urgências pontuais — com regra: «se for documento do fecho, carrega no portal».',
      ],
      blocks: [
        {
          type: 'ol',
          items: [
            'Mapear 15 clientes «difíceis» para piloto (os que mais geravam chase)',
            'Criar templates de pedido mensal por perfil (isento IVA, trimestral, com salários)',
            'Treinar a equipa a rejeitar ilegíveis em vez de «tentar adivinhar»',
            'Afixar o calendário interno ao lado do calendário legal',
            'Medir horas de chase durante 4 semanas e mostrar ao sócio',
          ],
        },
      ],
    }),
    { type: 'link', label: 'Roteiro completo de digitalização do escritório', slug: 'digitalizar-escritorio-contabilidade-portugal' },
    { type: 'link', label: 'Método de gestão de prazos fiscais', slug: 'gestao-prazos-fiscais-escritorio-contabilidade' },
    teglionCtaBlock({
      variant: 'firm',
      title: 'Quer o mesmo tipo de ritual com portal?',
      text: 'Teglion dá ao escritório pedidos formais, histórico e menos dependência do chat — para a equipa viver o calendário, não a caixa de mensagens.',
    }),
    ...articleSection({
      h2: 'Resultados aos 90 dias',
      id: 'resultados',
      paragraphs: [
        'No piloto, 11 dos 15 clientes adoptaram o portal com pouca resistência depois da primeira rejeição clara («foto ilegível — reenviar PDF»). Quatro precisaram de chamada de 10 minutos com a sócia — o argumento que funcionou: «assim não perdemos a sua factura no meio de 200 chats».',
      ],
      blocks: [
        comparisonTable({
          caption: 'Antes vs depois (carteira completa, mês 3)',
          headers: ['Indicador', 'Antes', 'Depois (~90 dias)'],
          rows: [
            ['Horas/semana em chase', '12–15 h', '4–6 h'],
            ['Documentos via portal', '~5%', '~60% (em crescimento)'],
            ['Reenvios por ilegibilidade', 'Frequentes, tardios', 'Cedo, com estado «rejeitado»'],
            ['Sensação na semana do dia 20', 'Caos controlado', 'Ainda pressão, mas previsível'],
          ],
        }),
        {
          type: 'callout',
          variant: 'tip',
          title: 'O que não mediiram (e deviam)',
          text: 'No mês 1 esqueceram de contar horas. No mês 2 passaram a registar chase num simples timesheet. Sem número, o sócio comercial não priorizava o projecto.',
        },
      ],
    }),
    ...articleSection({
      h2: 'Erros que cometeram',
      id: 'erros',
      blocks: [
        {
          type: 'ul',
          items: [
            'Tentaram rollout a 90 clientes na mesma semana — a equipa não aguentou o suporte; recuaram para o piloto.',
            'Mensagens de rejeição vagos («está mal») geravam discussão; trocaram por checklists curtas.',
            'Não alinharam logo o fluxo SAF-T / e-Fatura com o portal — documentos chegavam duplicados. Corrigiram no mês 2 (ver artigo SAF-T).',
            'Um colaborador continuou a aceitar WhatsApp «só desta vez» — quebrou o hábito; a regra teve de ser reforçada em reunião.',
          ],
        },
        {
          type: 'link',
          label: 'SAF-T, e-Fatura e validação de documentos no escritório',
          slug: 'saft-efatura-validacao-documentos-escritorio',
        },
      ],
    }),
    ...articleSection({
      h2: 'Lições para outros escritórios',
      id: 'licoes',
      paragraphs: [
        'Digitalizar a relação com o cliente não substitui o ERP nem o TOC. Substitui o caos da última etapa com o cliente. Prazos precisam de dono e de data interna. O cliente colabora mais quando vê o estado do pedido — não quando recebe a quinta mensagem de voz às 22h. Se quer o roteiro completo, leia também digitalizar o escritório e a gestão de prazos fiscais.',
        'Se está no mesmo sítio que o Escritório A estava, comece por medir o chase durante duas semanas. O número costuma ser o melhor argumento interno.',
      ],
    }),
    teglionCtaBlock({
      variant: 'firm',
      title: 'Do piloto ao hábito',
      text: 'Monte um piloto com dezenas de clientes no Teglion, meça horas de follow-up e só depois faça rollout — o mesmo caminho do Escritório A, com menos improvisação.',
    }),
    ...internalLinksSection({
      title: 'Aprofundar o método',
      slugs: [
        'digitalizar-escritorio-contabilidade-portugal',
        'gestao-prazos-fiscais-escritorio-contabilidade',
        'saft-efatura-validacao-documentos-escritorio',
        'organizar-documentos-fiscais-arquivo-digital',
      ],
    }),
    legalCallout(),
  ],
}

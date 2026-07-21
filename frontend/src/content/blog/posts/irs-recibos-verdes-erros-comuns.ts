import type { BlogPost } from '@/content/blog/types'
import {
  affiliateSection,
  articleSection,
  internalLinksSection,
  keyTakeaways,
  legalCallout,
  proseParagraphs,
  sectionDivider,
} from '@/content/blog/shared'

export const postIrsErros: BlogPost = {
  slug: 'irs-recibos-verdes-erros-comuns',
  title: 'IRS para recibos verdes: 10 erros que custam caro',
  excerpt:
    'Esquecer rendimentos, não cruzar recibos emitidos, confundir regimes — os erros mais frequentes de independentes no IRS e como evitar coimas.',
  publishedAt: '2026-05-25',
  updatedAt: '2026-06-17',
  author: 'Jaelson Santos',
  authorRole: 'Fundador do TegLion · Dev de software · Contabilidade (BR) → fiscalidade PT',
  category: 'IRS',
  audience: ['independente', 'pme'],
  featured: false,
  tags: ['IRS', 'recibos verdes', 'erros', 'multas', 'trabalhador independente'],
  series: {
    id: 'zero-ao-primeiro-irs',
    title: 'Do zero ao primeiro IRS',
    description: 'Deduções, declaração, prazos e erros comuns — trilho para a primeira (ou próxima) entrega de IRS.',
    part: 4,
    totalParts: 4,
  },
  readMinutes: 8,
  coverImage: {
    src: '/blog/covers/irs.svg',
    alt: 'Erros comuns no IRS com recibos verdes',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Erros comuns no IRS para recibos verdes | Blog TegLion',
    description:
      'Evite multas e coimas no IRS: erros frequentes de quem trabalha com recibos verdes em Portugal, com explicação de cada um e como os prevenir.',
    keywords: ['IRS recibos verdes erros', 'multa IRS independente', 'declaração IRS freelancer', 'coimas IRS Portugal'],
  },
  relatedSlugs: [
    'declaracao-irs-guia-pratico',
    'regime-simplificado-vs-contabilidade-organizada',
    'prazos-irs-2026-independentes',
    'deducoes-irs-portugal-guia-completo',
  ],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'O IRS pré-preenchido ajuda, mas não substitui a conferência — erros do portal ou recibos em falta são sua responsabilidade.',
      'Todos os rendimentos da actividade devem estar declarados: plataformas, estrangeiro, pagamentos em numerário.',
      'Retenções na fonte mal declaradas geram imposto a mais ou acertos com a AT.',
      'Despesas pessoais misturadas com actividade são um dos motivos mais comuns de inspecção.',
      'Entregar no último dia sem margem impede correcções tranquilas.',
    ]),
    ...proseParagraphs(
      'Trabalhadores independentes entregam anexo B (ou enquadramento equivalente) no IRS. Parece simples — até aparecem rendimentos pré-preenchidos — mas erros repetem-se todos os anos e geram coimas ou impostos a mais.',
      'A Autoridade Tributária cruza recibos emitidos, movimentos bancários, declarações de terceiros e dados de plataformas. «Não sabia» raramente elimina a coima — por isso vale a pena percorrer esta lista antes de carregar em submeter.',
    ),
    { type: 'h2', id: 'erros', text: 'Os 10 erros mais comuns — e como evitar' },
    ...articleSection({
      h2: '1. Não declarar rendimentos de plataformas',
      id: 'erro-plataformas',
      paragraphs: [
        'Uber, Bolt, Airbnb, Fiverr, Upwork, Teachable e outras plataformas comunicam ou podem comunicar rendimentos à AT. Se facturou através delas e não emitiu recibo verde em Portugal, ou emitiu valores inferiores, há risco de acerto com juros e coimas.',
        'Solução: registe todos os pagamentos recebidos, emita recibo verde (ou factura) pelo valor correcto e declare no anexo da actividade. Se recebeu do estrangeiro, veja também o guia para freelancers estrangeiros.',
      ],
    }),
    ...articleSection({
      h2: '2. Valores de recibos que não batem certo',
      id: 'erro-totais',
      paragraphs: [
        'Exporte do Portal das Finanças a lista de recibos emitidos no ano e compare com o total que vai declarar. Diferenças de cêntimos podem ser arredondamentos; diferenças de centenas de euros são bandeira vermelha.',
        'Solução: folha de cálculo mensal com bruto acumulado. No dia da entrega, some uma última vez.',
      ],
    }),
    ...articleSection({
      h2: '3. Confundir despesas pessoais com despesas de actividade',
      id: 'erro-despesas',
      paragraphs: [
        'No regime simplificado, nem todas as despesas entram da mesma forma — e despesas claramente pessoais (supermercado familiar, ginásio, férias) não são dedutíveis.',
        'Na contabilidade organizada, só despesas necessárias à actividade com factura válida. Solução: conta bancária dedicada à actividade e arquivo de facturas por categoria.',
      ],
    }),
    ...articleSection({
      h2: '4. Esquecer retenções na fonte',
      id: 'erro-retencoes',
      paragraphs: [
        'Se clientes empresariais retiveram IRS, esse valor deve aparecer no IRS como retenção sofrida — senão paga imposto em duplicado.',
        'Solução: ao longo do ano, registe retenção por recibo. No IRS, valide linha a linha com os PDFs guardados.',
      ],
    }),
    sectionDivider(),
    ...articleSection({
      h2: '5. Não guardar comprovativo de entrega',
      id: 'erro-comprovativo',
      paragraphs: [
        'Após submeter, guarde PDF da declaração, comprovativo de entrega e referência de pagamento se houver imposto a pagar. Em caso de disputa ou inspecção, «entreguei» sem prova complica a defesa.',
      ],
    }),
    ...articleSection({
      h2: '6. Assumir que «pré-preenchido = correcto»',
      id: 'erro-pre-preenchido',
      paragraphs: [
        'O portal agrega dados de terceiros com atraso ou erros ocasionais. Rendimentos de emprego, pensões, arrendamento e mais podem aparecer incompletos ou duplicados.',
        'Solução: percorrer cada anexo como se estivesse vazio — confirmar cada valor com documento de suporte.',
      ],
    }),
    ...articleSection({
      h2: '7. Entregar no último dia',
      id: 'erro-prazo',
      paragraphs: [
        'Portais sobrecarregados, senhas expiradas, documentos em falta — tudo acontece na véspera do prazo. Quem entrega cedo tem tempo para corrigir e, se houver reembolso, recebe mais cedo.',
      ],
    }),
    ...articleSection({
      h2: '8. IBAN desactualizado',
      id: 'erro-iban',
      paragraphs: [
        'Reembolsos de IRS vão para o IBAN registado no portal. Mudou de banco e não actualizou? O dinheiro pode demorar ou exigir processo manual.',
      ],
    }),
    ...articleSection({
      h2: '9. Ignorar rendimentos do estrangeiro',
      id: 'erro-estrangeiro',
      paragraphs: [
        'Prestações a clientes fora de Portugal continuam, em regra, a ser rendimentos obtidos em Portugal se a actividade é exercida daqui. Dupla tributação e convenções internacionais complicam — mas omitir é pior.',
      ],
    }),
    ...articleSection({
      h2: '10. Não pedir ajuda a tempo',
      id: 'erro-ajuda',
      paragraphs: [
        'Imóveis, heranças, mudança de regime, primeira inspecção — há situações em que o custo de um contador é menor que o de um erro. Marque reunião em Março, não em Junho.',
      ],
    }),
    ...affiliateSection({
      heading: 'Evitar o erro antes de submeter',
      headingId: 'evitar',
      intro:
        'A maioria dos erros da lista acima nasce de pressa ou de números que nunca foram conferidos. Dois recursos ajudam quem quer entregar IRS com recibos verdes sem surpresas.',
      items: [
        {
          key: 'hotmartIrsReciboVerde',
          leadIn:
            'Este ebook aborda exactamente os pontos onde independentes tropeçam: cruzar recibos emitidos, calcular impostos e entregar IRS sozinho, com linguagem directa para Portugal.',
          title: 'IRS & Recibo Verde — guia prático (Hotmart)',
          description: 'Menos de 2 horas de leitura focada em obrigações reais de quem emite recibos verdes.',
          image: {
            src: '/blog/covers/irs.svg',
            alt: 'Calculadora e papéis fiscais',
          },
        },
        {
          key: 'amazonCasio991',
          leadIn:
            'Antes de carregar em «submeter», compare linha a linha: total de recibos emitidos no e-Fatura vs. valor que vai declarar.',
          title: 'Calculadora Casio fx-991ES Plus (Amazon)',
          description: 'Modelo recomendado no ensino português — útil para somas e verificações manuais.',
        },
      ],
    }),
    { type: 'link', label: 'Guia prático de declaração de IRS', slug: 'declaracao-irs-guia-pratico' },
    { type: 'link', label: 'Deduções no IRS — guia completo', slug: 'deducoes-irs-portugal-guia-completo' },
    ...internalLinksSection({
      title: 'Próximos passos',
      slugs: [
        'declaracao-irs-guia-pratico',
        'prazos-irs-2026-independentes',
        'deducoes-irs-portugal-guia-completo',
      ],
    }),
    legalCallout(),
  ],
}

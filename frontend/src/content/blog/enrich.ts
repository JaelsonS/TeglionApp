import { PILLAR_FAQ_BLOCKS } from '@/content/blog/pillar-faqs'
import { AFFILIATE_LINKS } from '@/content/blog/affiliates'
import type { BlogPost } from '@/content/blog/types'

export function enrichPost(post: BlogPost): BlogPost {
  const faqBlocks = PILLAR_FAQ_BLOCKS[post.slug] ?? []
  const educationalBlocks = buildEducationalExpansion(post)
  if (!faqBlocks.length && !educationalBlocks.length) return post
  return {
    ...post,
    blocks: [...post.blocks, ...faqBlocks, ...educationalBlocks],
    readMinutes: post.readMinutes + (faqBlocks.length ? 2 : 0) + 13,
  }
}

function buildEducationalExpansion(post: BlogPost): BlogPost['blocks'] {
  const profile = resolveCategoryProfile(post.category)
  const visuals = resolveCategoryVisuals(post.category)
  const topic = post.title.replace(/\s*\|\s*.*$/, '').trim()
  const tagHint = post.tags.slice(0, 2).join(' e ') || post.category
  const related = post.relatedSlugs.slice(0, 3)

  return [
    { type: 'h2', id: 'plano-implementacao', text: `Plano de 30 dias: aplicar «${topic}»` },
    {
      type: 'p',
      text: `Depois de ler este guia sobre ${topic.toLowerCase()}, o passo seguinte não é decorar mais teoria — é meter o tema em rotina. Em fiscalidade e contabilidade, ganha quem faz ciclos curtos (preparar, executar, rever) em vez de acumular tudo para a semana do prazo.`,
    },
    {
      type: 'p',
      text: profile.context,
    },
    {
      type: 'image',
      src: visuals.hero.src,
      alt: visuals.hero.alt,
      caption: visuals.hero.caption,
      width: 1200,
      height: 675,
    },
    {
      type: 'ol',
      items: [
        `Semana 1: mapear o que neste tema (${tagHint}) ainda depende de memória, email solto ou WhatsApp.`,
        'Semana 2: normalizar checklists, nomes de ficheiros e responsáveis por cada obrigação recorrente.',
        'Semana 3: validar com contabilista/gestor, fechar lacunas e testar o processo num caso real.',
        'Semana 4: medir erros evitados, horas poupadas e actualizar o método para o ciclo seguinte.',
      ],
    },
    { type: 'callout', variant: 'tip', title: 'Dica prática', text: profile.tip },
    { type: 'h2', id: 'exemplo-pratico', text: `Exemplo prático ligado a «${topic}»` },
    {
      type: 'p',
      text: `Escolha uma única frente ligada a este artigo e melhore só isso durante quatro semanas. Corrigir tudo de uma vez costuma falhar; fechar um ciclo bem feito em ${tagHint} cria hábito.`,
    },
    {
      type: 'p',
      text:
        'Na primeira semana, faça diagnóstico com dados simples: quantos pedidos ficaram pendentes, em que fase bloqueiam e qual o tempo médio até resolução. Na segunda semana, introduza uma checklist curta e um responsável claro por etapa. Na terceira, teste com casos reais. Na quarta, meça impacto e consolide o método.',
    },
    {
      type: 'p',
      text:
        'Uma recomendação útil para aumentar consistência é documentar decisões no momento em que ocorrem: quando muda regime, quando redefine taxa, quando altera fluxo de validação. Essa memória operacional evita regressão e facilita integração de novos colaboradores ou apoio externo.',
    },
    {
      type: 'ul',
      items: [
        'Métrica 1: tempo médio entre pedido e entrega do documento.',
        'Métrica 2: percentagem de tarefas concluídas antes do prazo.',
        'Métrica 3: número de retrabalhos por erro de classificação ou ausência de comprovativo.',
        'Métrica 4: horas de equipa gastas em follow-up manual.',
      ],
    },
    { type: 'h2', id: 'erros-que-custam-caro', text: 'Erros que custam caro (e como evitar)' },
    {
      type: 'ul',
      items: profile.riskyMistakes,
    },
    {
      type: 'p',
      text:
        'Para reduzir estes erros de forma consistente, transforme cada incidente num ajuste operacional objectivo: atualizar checklist, alterar ordem de validação, criar campo obrigatório ou rever instruções ao cliente. A regra é simples: erro repetido sem mudança de processo vira custo recorrente.',
    },
    {
      type: 'p',
      text:
        'Ao implementar este princípio, mantenha uma lista curta de "erros críticos" com dono e prazo de correcção. Sem dono, o problema volta; sem prazo, a solução nunca entra em produção. Gestão fiscal com qualidade depende tanto de técnica como de execução disciplinada.',
    },
    {
      type: 'h2',
      id: 'guiao-operacional-equipa',
      text: 'Guião operacional para equipas pequenas e freelancers',
    },
    {
      type: 'p',
      text: `Mesmo sozinho, pode tratar «${topic}» com cadência profissional: revisão semanal curta, fecho mensal e preparação do próximo prazo. Esta rotina evita a corrida de última hora.`,
    },
    {
      type: 'table',
      caption: `Ritmo operacional recomendado (ligado a ${post.category})`,
      headers: ['Periodicidade', 'Acção', 'Resultado esperado'],
      rows: [
        ['Semanal', 'Revisão de pendências e comprovativos', 'Menos acumulação e menos falhas de contexto'],
        ['Quinzenal', 'Conferência de prazos críticos AT/SS', 'Prevenção de atrasos com risco de coima'],
        ['Mensal', 'Fecho operacional com checklist', 'Base preparada para obrigações e reporte'],
        ['Trimestral', 'Revisão de processo e ferramentas', 'Melhoria contínua e redução de retrabalho'],
      ],
    },
    {
      type: 'h2',
      id: 'playbook-comunicacao',
      text: 'Playbook de comunicação com clientes e parceiros',
    },
    {
      type: 'p',
      text:
        'Grande parte dos atrasos nasce de instruções vagas. Mensagens como "envie os documentos" geram respostas incompletas. Prefira comunicação orientada por acção: o que enviar, em que formato, até quando, e qual o impacto de não cumprir o prazo.',
    },
    {
      type: 'ul',
      items: [
        'Mensagem inicial com lista fechada de documentos e data limite.',
        'Lembrete intermédio com pendências específicas, sem texto genérico.',
        'Confirmação de recepção e validação para evitar "já enviei" sem prova.',
        'Escalada com prioridade quando a pendência começa a afectar obrigação legal.',
      ],
    },
    {
      type: 'p',
      text:
        'Este playbook reduz atrito porque elimina ambiguidade. O cliente entende exactamente o que fazer, e a equipa deixa de improvisar respostas diferentes para o mesmo cenário.',
    },
    { type: 'h2', id: 'checklist-operacional', text: 'Checklist operacional para não falhar prazos' },
    {
      type: 'ul',
      items: [
        'Definir um calendário único (AT + Segurança Social + prazos internos do escritório/negócio).',
        'Guardar comprovativos com padrão fixo: AAAA-MM_tipo_documento_entidade_valor.',
        'Separar tarefas críticas (coima potencial) de tarefas administrativas de menor risco.',
        'Rever semanalmente pendências com estado: por iniciar, em curso, concluído, validado.',
        'Registar decisões fiscais (regime, taxa, retenção, excepções) para evitar retrabalho.',
        'Fechar o mês com mini-auditoria: o que correu bem, o que falhou e qual o ajuste concreto.',
      ],
    },
    {
      type: 'p',
      text:
        'Se estiver a implementar isto pela primeira vez, mantenha a checklist visível e curta. Uma checklist usada diariamente com 10 pontos vale mais do que um manual extenso que ninguém consulta. A maturidade operacional nasce da repetição disciplinada do básico.',
    },
    {
      type: 'image',
      src: visuals.workflow.src,
      alt: visuals.workflow.alt,
      caption: visuals.workflow.caption,
      width: 1200,
      height: 675,
    },
    {
      type: 'image',
      src: visuals.support.src,
      alt: visuals.support.alt,
      caption: visuals.support.caption,
      width: 1200,
      height: 675,
    },
    { type: 'h2', id: 'recursos-praticos', text: 'Recursos práticos para acelerar a execução' },
    {
      type: 'p',
      text: profile.resourcesLead,
    },
    {
      type: 'p',
      text: profile.affiliateParagraph,
    },
    {
      type: 'callout',
      variant: 'info',
      title: 'Transparência',
      text:
        'Alguns links acima são de afiliado. Se comprar através deles, podemos receber comissão sem custo extra para si. Só recomendamos recursos coerentes com o tema do artigo.',
    },
    {
      type: 'h2',
      id: 'plano-continuidade',
      text: 'Plano de continuidade para manter resultados no longo prazo',
    },
    {
      type: 'p',
      text:
        'Depois do primeiro ciclo, consolide em três frentes: documentação de processo, rotina de revisão e comunicação clara com clientes/partes envolvidas. O objectivo não é apenas cumprir o prazo seguinte, mas construir um sistema estável que continue a funcionar em meses mais exigentes.',
    },
    {
      type: 'ul',
      items: [
        'Documentação viva: actualizar procedimentos sempre que existir ajuste relevante.',
        'Revisão periódica: reservar tempo fixo para verificar aderência ao processo.',
        'Comunicação preventiva: enviar orientações antes de períodos de maior carga fiscal.',
        'Qualidade de dados: garantir padrão único de nomenclatura e arquivo.',
      ],
    },
    {
      type: 'p',
      text:
        'No médio prazo, o objectivo é tornar o processo previsível: menos urgências, menos mensagens fora de contexto e melhor experiência para quem depende do seu trabalho. Quanto mais claro for o método, menos energia é desperdiçada em apagar incêndios.',
    },
    ...(related.length
      ? [
        {
          type: 'internalLinks' as const,
          title: 'Aprofunde este tema com leitura complementar',
          intro:
            'Para ganhar domínio real, combine este artigo com os guias abaixo e aplique o plano de implementação em paralelo.',
          slugs: related,
        },
      ]
      : []),
  ]
}

function resolveCategoryVisuals(category: string) {
  if (category === 'IRS') {
    return {
      hero: {
        src: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=675&fit=crop&q=80',
        alt: 'Pessoa a analisar relatórios financeiros numa secretária',
        caption: 'Planeamento mensal evita erros acumulados na declaração anual de IRS.',
      },
      workflow: {
        src: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=675&fit=crop&q=80',
        alt: 'Folhas com números e calculadora sobre uma mesa',
        caption: 'Organização documental contínua facilita validações e reduz substituições.',
      },
      support: {
        src: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=1200&h=675&fit=crop&q=80',
        alt: 'Pessoa a apontar para tabela financeira em relatório impresso',
        caption: 'Acompanhamento periódico permite corrigir desvios antes da entrega final.',
      },
    }
  }

  if (category === 'IVA') {
    return {
      hero: {
        src: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&h=675&fit=crop&q=80',
        alt: 'Atendimento comercial com pagamento e emissão de factura',
        caption: 'Decisões de IVA bem preparadas protegem margem e previsibilidade comercial.',
      },
      workflow: {
        src: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1200&h=675&fit=crop&q=80',
        alt: 'Mãos a contar notas e recibos com portátil ao fundo',
        caption: 'Controlo operacional reduz erros de taxa, base tributável e calendário declarativo.',
      },
      support: {
        src: 'https://images.unsplash.com/photo-1559526324-593bc073d938?w=1200&h=675&fit=crop&q=80',
        alt: 'Calculadora e talões de compra sobre mesa de trabalho',
        caption: 'Conferência contínua de documentos melhora precisão no apuramento de IVA.',
      },
    }
  }

  if (category === 'Escritórios') {
    return {
      hero: {
        src: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=675&fit=crop&q=80',
        alt: 'Equipa em reunião num escritório moderno',
        caption: 'Padronização de processos melhora qualidade técnica e experiência do cliente.',
      },
      workflow: {
        src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=675&fit=crop&q=80',
        alt: 'Quadro com plano de trabalho e equipa em discussão',
        caption: 'Quando operação e comunicação seguem o mesmo método, o escritório escala com menos fricção.',
      },
      support: {
        src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=675&fit=crop&q=80',
        alt: 'Equipa a colaborar com portáteis numa mesa de reunião',
        caption: 'Alinhamento interno reduz retrabalho e melhora o tempo de resposta ao cliente.',
      },
    }
  }

  return {
    hero: {
      src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=675&fit=crop&q=80',
      alt: 'Dashboard financeiro aberto num portátil',
      caption: 'A execução disciplinada transforma conhecimento técnico em resultado operacional.',
    },
    workflow: {
      src: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&h=675&fit=crop&q=80',
      alt: 'Mão a preencher checklist ao lado de documentos',
      caption: 'Checklist simples, usada com frequência, reduz falhas e retrabalho.',
    },
    support: {
      src: 'https://images.unsplash.com/photo-1556155092-8707de31f9c4?w=1200&h=675&fit=crop&q=80',
      alt: 'Profissional a organizar notas e tarefas em ambiente de escritório',
      caption: 'Método claro e revisão contínua sustentam qualidade ao longo do tempo.',
    },
  }
}

function resolveCategoryProfile(category: string) {
  if (category === 'IRS') {
    return {
      context:
        'No IRS, o maior ganho vem de evitar acumulação para Abril-Junho: quando documentos e movimentos ficam organizados mês a mês, o preenchimento deixa de ser um stress anual e passa a ser uma revisão técnica.',
      tip: 'Reserve 30 minutos por semana para reconciliar rendimentos, despesas e comprovativos. Esta rotina simples evita a maioria das declarações de substituição.',
      riskyMistakes: [
        'Confiar só em memória para deduções e esquecer despesas com potencial impacto no imposto.',
        'Misturar despesas pessoais e profissionais sem separação documental clara.',
        'Entregar no último dia e perder tempo de correcção em caso de erro de validação.',
      ],
      resourcesLead:
        'Se prefere estudar com método, combine este artigo com materiais de apoio prático e mantenha uma lista de verificação mensal para IRS.',
      affiliateParagraph:
        `Um apoio útil é o [${AFFILIATE_LINKS.hotmartIrsReciboVerde.label}](${AFFILIATE_LINKS.hotmartIrsReciboVerde.url}), que ajuda a estruturar rendimentos e obrigações de forma faseada ao longo do ano fiscal.`,
    }
  }

  if (category === 'IVA') {
    return {
      context:
        'No IVA, decisões em cima do prazo custam margem e criam retrabalho. Quando a preparação é antecipada, fica mais simples decidir preços, taxa aplicável e momento certo de transição de regime.',
      tip: 'Trabalhe com um quadro simples por cliente/serviço: taxa aplicável, base tributável e tipo de documento. Repetição reduz erro.',
      riskyMistakes: [
        'Aplicar taxa errada por falta de tabela interna por serviço/produto.',
        'Ultrapassar limite de isenção sem plano de transição para software certificado.',
        'Não controlar impacto do IVA na margem ao definir preço final.',
      ],
      resourcesLead:
        'Para consolidar operação de facturação, vale a pena apoiar-se em guias curtos e objectivos, sobretudo na fase de arranque.',
      affiliateParagraph:
        `Para quem ainda está em fase inicial, o [${AFFILIATE_LINKS.hotmartReciboVerde7Dias.label}](${AFFILIATE_LINKS.hotmartReciboVerde7Dias.url}) pode servir como roteiro de base antes de escalar para cenários de IVA mais complexos.`,
    }
  }

  if (category === 'Escritórios') {
    return {
      context:
        'Em escritórios de contabilidade, a diferença entre operação estável e caos sazonal está na padronização: canal único com cliente, checklist comum da equipa e histórico auditável de pedidos.',
      tip: 'Implemente com clientes-piloto antes de generalizar. Teste processo, linguagem e tempos de resposta com um grupo pequeno.',
      riskyMistakes: [
        'Digitalizar ferramenta sem redesenhar processo interno da equipa.',
        'Ter múltiplos canais paralelos com o cliente (email + WhatsApp + chamadas sem registo).',
        'Não medir tempo de fecho de pedido/documento antes e depois da mudança.',
      ],
      resourcesLead:
        'Além de processo, a operação precisa de base técnica estável para equipa e clientes: produtividade, segurança e organização documental.',
      affiliateParagraph:
        `Na prática, combinações como [${AFFILIATE_LINKS.amazonM365Pessoal.label}](${AFFILIATE_LINKS.amazonM365Pessoal.url}) e [${AFFILIATE_LINKS.amazonBitdefender.label}](${AFFILIATE_LINKS.amazonBitdefender.url}) costumam ser suficientes para estruturar trabalho diário e reduzir risco operacional.`,
    }
  }

  return {
    context:
      'Neste tema, o padrão é o mesmo: decisões técnicas simples, repetidas com disciplina, geram resultados muito superiores a acções isoladas em cima do prazo.',
    tip: 'Defina um ritual semanal curto de revisão fiscal/contabilística e mantenha registo escrito do que foi decidido.',
    riskyMistakes: [
      'Adiar organização documental para o fim do mês ou fim do trimestre.',
      'Depender de um único canal informal para temas fiscais relevantes.',
      'Não transformar erros recorrentes em checklist para evitar repetição.',
    ],
    resourcesLead:
      'Para acelerar a execução sem perder qualidade, use recursos de apoio de forma complementar ao trabalho do seu contabilista.',
    affiliateParagraph:
      `Uma referência introdutória útil é [${AFFILIATE_LINKS.amazonLivroGestaoContabil.label}](${AFFILIATE_LINKS.amazonLivroGestaoContabil.url}), especialmente para consolidar fundamentos e linguagem técnica.`,
  }
}

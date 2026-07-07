import type { BlogBlock } from '@/content/blog/types'
import { faqSection } from '@/content/blog/shared'

/** FAQs pillar — injectados nos 5 artigos principais para schema FAQPage. */
export const PILLAR_FAQ_BLOCKS: Record<string, BlogBlock[]> = {
  'declaracao-irs-guia-pratico': faqSection({
    heading: 'Perguntas frequentes sobre IRS',
    headingId: 'faq-irs',
    items: [
      {
        question: 'Sou obrigado a entregar IRS todos os anos?',
        answer:
          'Depende dos rendimentos obtidos, retenções na fonte e do seu agregado familiar. Trabalhadores independentes com recibos verdes quase sempre têm de entregar. Confirme no Portal das Finanças ou com o seu contador.',
      },
      {
        question: 'Posso entregar IRS sozinho no Portal das Finanças?',
        answer:
          'Sim. Com NIF e senha (ou Chave Móvel Digital) pode preencher o Modelo 3 online. Se tiver rendimentos de várias fontes, imóveis ou actividade aberta, um contador reduz erros e optimiza deduções legais.',
      },
      {
        question: 'O que acontece se entregar IRS fora do prazo?',
        answer:
          'Há coimas e juros de mora. Quanto mais tarde, maior o custo. Marque o prazo final no calendário e prepare documentos com antecedência.',
      },
      {
        question: 'Preciso de guardar recibos e facturas quanto tempo?',
        answer:
          'Regra prática: pelo menos 4 anos após a entrega do IRS, alinhado com prazos de prescrição fiscal. Digitalize e organize por ano — o TegLion ajuda escritórios a pedir e validar documentos de clientes.',
      },
      {
        question: 'IRS dá sempre reembolso?',
        answer:
          'Não. O reembolso ocorre quando reteve mais imposto do que o devido. Se reteve de menos ou teve rendimentos não declarados ao longo do ano, pode haver imposto a pagar.',
      },
    ],
  }),
  'iva-quando-preciso-de-me-registar': faqSection({
    heading: 'Perguntas frequentes sobre IVA',
    headingId: 'faq-iva',
    items: [
      {
        question: 'Quando sou obrigado a registar-me para IVA?',
        answer:
          'Em geral, quando exerce actividade sujeita a IVA e ultrapassa limites de isenção ou opta voluntariamente. Artistas, profissionais liberais e comerciantes têm regras específicas — confirme com AT ou contador.',
      },
      {
        question: 'Posso estar isento de IVA como freelancer?',
        answer:
          'Sim, se cumprir requisitos de isenção (artigo 53.º do CIVA). A isenção não elimina todas as obrigações — pode haver declarações informativas.',
      },
      {
        question: 'Qual a diferença entre regime mensal e trimestral?',
        answer:
          'A periodicidade das entregas de IVA. Mensal: declarações todos os meses. Trimestral: a cada três meses. O regime depende do volume de negócios e tipo de actividade.',
      },
      {
        question: 'O que é a declaração periódica de IVA?',
        answer:
          'Documento onde reporta IVA liquidado (vendas) e dedutível (compras). Entrega online no Portal das Finanças até ao dia 20 do mês seguinte (ou prazo trimestral).',
      },
      {
        question: 'Esqueci-me de emitir factura — posso corrigir?',
        answer:
          'Sim, com mecanismos de regularização previstos na lei. Não acumule — quanto mais cedo corrigir, menor o risco de coimas.',
      },
    ],
  }),
  'obrigacoes-fiscais-mes-a-mes': faqSection({
    heading: 'Perguntas frequentes sobre obrigações mensais',
    headingId: 'faq-obrigacoes',
    items: [
      {
        question: 'Que obrigações tenho todos os meses como independente?',
        answer:
          'Tipicamente: emissão de recibos/facturas, Segurança Social (até dia 20), e IVA se aplicável. IRS é anual; SAF-T mensal se usar software certificado.',
      },
      {
        question: 'Como não esquecer prazos fiscais?',
        answer:
          'Use calendário partilhado com o contador, alertas no telemóvel e um sistema como o TegLion que centraliza prazos por cliente.',
      },
      {
        question: 'O contador trata de tudo automaticamente?',
        answer:
          'O contador orienta e submete declarações, mas precisa de documentos e informação sua a tempo. A responsabilidade final é sempre do contribuinte.',
      },
      {
        question: 'Posso deduzir despesas da actividade?',
        answer:
          'Sim, despesas necessárias à actividade e devidamente documentadas podem ser dedutíveis consoante o regime (simplificado ou organizado). Guarde facturas.',
      },
      {
        question: 'O que é o SAF-T?',
        answer:
          'Standard Audit File for Tax — ficheiro normalizado de facturação que empresas e alguns independentes comunicam à AT mensalmente, conforme enquadramento.',
      },
    ],
  }),
  'recibos-verdes-vs-faturacao': faqSection({
    heading: 'Perguntas frequentes: recibos verdes vs facturação',
    headingId: 'faq-recibos',
    items: [
      {
        question: 'Recibo verde e factura são a mesma coisa?',
        answer:
          'Não exactamente. Recibo verde (trabalho dependente/autónomo) regista rendimentos de prestação de serviços. Factura é documento de venda de bens ou serviços sujeitos a IVA, emitido por sujeito passivo.',
      },
      {
        question: 'Quando devo passar de recibos verdes para factura?',
        answer:
          'Quando se regista para IVA ou abre actividade comercial que exige facturação certificada. O contador define o momento certo consoante volume e CAE.',
      },
      {
        question: 'Posso emitir recibo verde e factura no mesmo mês?',
        answer:
          'Depende da estrutura da actividade. Misturar regimes sem orientação gera erros de IVA e IRS. Peça análise ao contador.',
      },
      {
        question: 'Software de facturação é obrigatório?',
        answer:
          'Para IVA e muitas actividades comerciais, sim — software certificado pela AT. Recibos verdes simples usam Portal das Finanças ou aplicações autorizadas.',
      },
      {
        question: 'Como o cliente recebe o documento?',
        answer:
          'Por e-mail, download do portal, ou e-Fatura. Guarde cópia PDF e registe no seu sistema de gestão.',
      },
    ],
  }),
  'quanto-custa-abrir-actividade-portugal': faqSection({
    heading: 'Perguntas frequentes: abrir actividade',
    headingId: 'faq-abrir',
    items: [
      {
        question: 'Quanto custa abrir actividade em Portugal?',
        answer:
          'Abrir actividade no Portal das Finanças é gratuito. Custos reais: contabilidade (30–150 €/mês), Segurança Social, software, eventual registo comercial se criar empresa.',
      },
      {
        question: 'Preciso de contador para abrir actividade?',
        answer:
          'Não é legalmente obrigatório para abrir, mas é fortemente recomendado para escolher CAE, regime de IVA e enquadramento IRS correctos desde o primeiro dia.',
      },
      {
        question: 'Trabalhador independente ou empresa (Lda)?',
        answer:
          'Independente: menos formalidade, responsabilidade ilimitada. Lda: responsabilidade limitada ao capital, mais custos de constituição e contabilidade organizada.',
      },
      {
        question: 'Quando começo a pagar Segurança Social?',
        answer:
          'Após abertura de actividade, com contribuições mensais (inicialmente sobre valor contributivo fixo ou declarado, conforme fase).',
      },
      {
        question: 'Posso abrir actividade estando desempregado?',
        answer:
          'Sim. Verifique impacto no subsídio de desemprego e benefícios — há regras de cumulação e comunicação à Segurança Social e IEFP.',
      },
    ],
  }),
  'prazos-irs-2026-independentes': faqSection({
    heading: 'Perguntas frequentes: prazos IRS 2026',
    headingId: 'faq-prazos-irs',
    items: [
      {
        question: 'Quando abre a campanha de IRS 2026?',
        answer:
          'A AT publica datas no Portal das Finanças, tipicamente a partir de Abril. Confirme o calendário oficial no ano — não dependa de datas de anos anteriores.',
      },
      {
        question: 'Trabalhador independente é obrigado a entregar IRS?',
        answer:
          'Na maioria dos casos sim, quando obteve rendimentos da actividade aberta. Excepções dependem de montantes e outras fontes de rendimento — valide no portal ou com contador.',
      },
      {
        question: 'Posso corrigir IRS depois de entregar?',
        answer:
          'Sim, mediante declaração de substituição ou mecanismos de rectificação previstos na lei, dentro dos prazos legais. Corrigir cedo reduz juros e complicações.',
      },
      {
        question: 'Entregar no último dia é mau?',
        answer:
          'O portal sobrecarrega-se, senhas expiram e documentos em falta aparecem tarde. Entregar cedo (se números conferidos) é melhor — especialmente se espera reembolso.',
      },
      {
        question: 'O contador entrega por mim?',
        answer:
          'Pode autorizar o contador via procuração ou entregar dados para ele submeter. A responsabilidade fiscal final continua a ser sua — confira antes de assinar.',
      },
    ],
  }),
  'escolher-software-faturacao-portugal': faqSection({
    heading: 'Perguntas frequentes: software de facturação',
    headingId: 'faq-software',
    items: [
      {
        question: 'Preciso de software certificado para recibos verdes?',
        answer:
          'Não. Recibos verdes simples emitem-se no Portal das Finanças / e-Fatura. Software certificado é necessário quando sujeito passivo de IVA ou certas actividades comerciais.',
      },
      {
        question: 'Como verifico se o software está certificado pela AT?',
        answer:
          'Consulte a lista oficial de programas certificados no site da Autoridade Tributária. Verifique número de certificação e validade.',
      },
      {
        question: 'Moloni ou InvoiceXpress — qual é melhor?',
        answer:
          'Depende do volume, integrações e orçamento. Compare preço, limite de documentos, SAF-T e suporte. Teste período experimental antes de subscrição anual.',
      },
      {
        question: 'O que é o SAF-T?',
        answer:
          'Ficheiro normalizado de facturação (Standard Audit File for Tax) que o contador usa para importar movimentos. Muitos softwares certificados exportam SAF-T PT.',
      },
      {
        question: 'Posso mudar de software no meio do ano?',
        answer:
          'Sim, com planeamento: exporte histórico, defina data de corte com o contador e configure séries no novo programa. Guarde backups do período anterior.',
      },
    ],
  }),
  'guia-completo-trabalhador-independente-portugal-2026': faqSection({
    heading: 'Perguntas frequentes: trabalhador independente',
    headingId: 'faq-independente',
    items: [
      {
        question: 'Qual a diferença entre recibos verdes e ENI?',
        answer:
          'ENI é o enquadramento (empresário em nome individual). Recibos verdes são o documento de venda emitido no e-Fatura. Abre actividade como ENI e emite recibos conforme o regime.',
      },
      {
        question: 'Posso trabalhar por conta de outrem e ter recibos verdes?',
        answer:
          'Sim, com regras de cumulação. Rendimentos de emprego e actividade independente declaram-se no IRS em anexos diferentes. Segurança Social pode ter vínculos distintos.',
      },
      {
        question: 'Quanto tempo demora a abrir actividade?',
        answer:
          'O início de actividade online pode ser imediato no portal, se tiver NIF e dados preparados. Segurança Social e conta bancária podem levar dias adicionais.',
      },
      {
        question: 'Preciso de contador desde o primeiro dia?',
        answer:
          'Não é obrigatório por lei para abrir, mas é fortemente recomendado para CAE, IVA e regime de contabilidade correctos.',
      },
      {
        question: 'Onde vejo todos os prazos do ano?',
        answer:
          'No blog TegLion temos calendário fiscal 2026 e artigo de obrigações mês a mês. Confirme sempre datas oficiais na AT e SS.',
      },
    ],
  }),
  'seguranca-social-trabalhador-independente': faqSection({
    heading: 'Perguntas frequentes: Segurança Social',
    headingId: 'faq-ss',
    items: [
      {
        question: 'Quando começo a pagar à Segurança Social?',
        answer:
          'Após abrir actividade e iniciar vínculo como trabalhador independente na SS. Há contribuições mensais mesmo em meses com pouca facturação, conforme regras do primeiro ano.',
      },
      {
        question: 'Qual o prazo de pagamento das contribuições?',
        answer:
          'Regra geral: até ao dia 20 de cada mês, referente ao mês anterior. Confirme no portal seguranca-social.pt e active débito directo.',
      },
      {
        question: 'Posso estar empregado e pagar SS como independente?',
        answer:
          'Sim, com regras de cumulação. Cada vínculo tem contributiva própria — o contador ou a SS esclarecem tetos e deduções aplicáveis.',
      },
      {
        question: 'Cessei actividade nas Finanças. E a SS?',
        answer:
          'Deve comunicar cessação também à Segurança Social. Manter actividade aberta só numa entidade continua a gerar obrigações na outra.',
      },
      {
        question: 'O que é o NISS?',
        answer:
          'Número de Identificação da Segurança Social — identifica o trabalhador perante a SS, tal como o NIF identifica perante as Finanças.',
      },
    ],
  }),
  'proteger-dados-fiscais-freelancer-portugal': faqSection({
    heading: 'Perguntas frequentes: segurança digital',
    headingId: 'faq-seguranca',
    items: [
      {
        question: 'Preciso de antivírus se uso Mac?',
        answer:
          'macOS tem protecções integradas, mas phishing e roubo de portátil afectam todos. Backup e gestor de passwords são essenciais em qualquer sistema.',
      },
      {
        question: 'OneDrive é seguro para recibos verdes?',
        answer:
          'Serviços cloud reputados encriptam dados em trânsito e em repouso. Active 2FA na conta Microsoft e use passwords únicas. Complemente com cópia offline anual.',
      },
      {
        question: 'O email da AT pediu a minha senha. É legítimo?',
        answer:
          'Não. A AT não pede passwords por email. Aceda sempre digitando portaldasfinancas.gov.pt no browser — não clique em links de emails suspeitos.',
      },
      {
        question: 'Devo usar VPN no café para emitir recibos?',
        answer:
          'Recomendado em Wi‑Fi público. VPN encripta o tráfego e reduz risco de interceptação de credenciais.',
      },
      {
        question: 'Freelancer tem obrigações RGPD?',
        answer:
          'Sim, ao tratar dados pessoais de clientes (NIF, contactos, contratos). Minimize dados, proteja acesso e não partilhe documentos sensíveis em canais inseguros.',
      },
    ],
  }),
  'como-emitir-recibo-verde-passo-a-passo': faqSection({
    heading: 'Perguntas frequentes: emitir recibo verde',
    headingId: 'faq-emitir',
    items: [
      {
        question: 'Posso emitir recibo verde sem actividade aberta?',
        answer:
          'Não. Precisa de início de actividade nas Finanças com CAE adequado antes de emitir documentos de venda.',
      },
      {
        question: 'O cliente precisa de dar o NIF?',
        answer:
          'Sim, para documento válido. Sem NIF correcto do adquirente, o recibo pode ser rejeitado para dedução ou gerar problemas no cruzamento de dados.',
      },
      {
        question: 'Posso corrigir um recibo emitido com erro?',
        answer:
          'Há mecanismos de anulação e emissão de documento rectificativo no portal. Não deixe erros acumulados — corrija assim que detectar.',
      },
      {
        question: 'Recibo verde tem IVA?',
        answer:
          'Se está isento de IVA, indica motivo de isenção. Se é sujeito passivo, em regra emite factura certificada com IVA — não recibo verde simples.',
      },
      {
        question: 'Quando devo emitir o recibo?',
        answer:
          'No momento da prestação ou logo após — não acumule meses de serviços num único recibo no último dia, salvo acordo contratual claro e conforme regras aplicáveis.',
      },
    ],
  }),
  'calendario-fiscal-portugal-2026-completo': faqSection({
    heading: 'Perguntas frequentes: calendário fiscal 2026',
    headingId: 'faq-calendario',
    items: [
      {
        question: 'Onde confirmo prazos oficiais de 2026?',
        answer:
          'Portal das Finanças, Segurança Social e Diário da República publicam calendários. Use o nosso artigo como mapa — valide sempre datas oficiais.',
      },
      {
        question: 'IRS e IVA têm o mesmo prazo?',
        answer:
          'Não. IRS é anual (campanha Abril–Junho/Julho). IVA é mensal ou trimestral. Segurança Social é mensal até dia 20.',
      },
      {
        question: 'Freelancer isento de IVA tem menos prazos?',
        answer:
          'Tem menos declarações de IVA, mas mantém SS mensal, arquivo, eventual SAF-T conforme regime, e IRS anual.',
      },
      {
        question: 'O que acontece se falhar um prazo?',
        answer:
          'Coimas, juros e possível execução fiscal. Regularize o quanto antes — atraso prolongado agrava custos.',
      },
      {
        question: 'Contador lembra todos os prazos?',
        answer:
          'Orienta e submete o que está no contrato, mas a responsabilidade final é do contribuinte. Use calendário partilhado ou software como o TegLion para prazos por cliente.',
      },
    ],
  }),
  'estudar-contabilidade-portugal-guia-estudantes': faqSection({
    heading: 'Perguntas frequentes: estudar contabilidade',
    headingId: 'faq-estudantes',
    items: [
      {
        question: 'Preciso de calculadora científica para estudar contabilidade?',
        answer:
          'Sim, na prática. Exames e exercícios exigem cálculos rápidos com memórias. Modelos como Casio fx-991ES Plus são o padrão em Portugal.',
      },
      {
        question: 'Licenciatura ou CET — qual escolher?',
        answer:
          'Licenciatura universitária é o caminho clássico para certificação OCC. CET e cursos técnicos podem ser entrada ou complemento — confirme requisitos actuais em occ.pt e na instituição.',
      },
      {
        question: 'Posso aprender contabilidade sozinho sem faculdade?',
        answer:
          'Conceitos base sim — com livros e cursos. Para exercer como contabilista certificado em Portugal, o percurso OCC com formação e estágio é obrigatório.',
      },
      {
        question: 'O que é o estágio OCC?',
        answer:
          'Período de formação prática supervisionada por contabilista certificado, necessário para inscrição na Ordem. É onde a teoria encontra prazos e clientes reais.',
      },
      {
        question: 'Que matérias são mais difíceis?',
        answer:
          'Varia por pessoa — Fiscalidade e Contabilidade Geral costumam exigir mais prática repetida. Organização e método pesam tanto quanto «talento para números».',
      },
    ],
  }),
  'digitalizar-escritorio-contabilidade-portugal': faqSection({
    heading: 'Perguntas frequentes: digitalizar escritório',
    headingId: 'faq-digitalizar',
    items: [
      {
        question: 'Portal do cliente substitui o ERP contabilístico?',
        answer:
          'Não. ERP trata contabilidade formal; portal resolve pedidos de documentos, comunicação e prazos com o cliente. Complementam-se.',
      },
      {
        question: 'Clientes idosos resistem ao portal — o que fazer?',
        answer:
          'Migração gradual, suporte telefónico na primeira entrega, e mostrar benefício concreto (lista do que falta). Mantenha excepção documentada para casos específicos.',
      },
      {
        question: 'WhatsApp é aceitável para documentos fiscais?',
        answer:
          'É arriscado para RGPD e prova de entrega. Canal oficial com registo (portal ou email corporativo estruturado) protege o escritório.',
      },
      {
        question: 'Quanto tempo demora a digitalizar um escritório?',
        answer:
          'Com piloto de 5–10 clientes, 30–90 dias para processo estável. Rollout completo depende do tamanho da carteira e da equipa.',
      },
      {
        question: 'O TegLion serve escritórios pequenos?',
        answer:
          'Sim — pensado para escritórios que querem portal do cliente, pedidos de documentos e prazos sem complexidade de ERP. Teste grátis 14 dias.',
      },
    ],
  }),
  'contabilidade-explicada-leigos-portugal': faqSection({
    heading: 'Perguntas frequentes: contabilidade para leigos',
    headingId: 'faq-leigos',
    items: [
      {
        question: 'Qual a diferença entre contabilidade e finanças?',
        answer:
          'Contabilidade regista e organiza movimentos económicos. «Finanças» no dia a dia em Portugal costuma referir-se à Autoridade Tributária (impostos). Estão ligados mas não são a mesma coisa.',
      },
      {
        question: 'Recibo verde é factura?',
        answer:
          'É um documento de venda do trabalhador independente no regime português. Factura com IVA é outro tipo de documento, obrigatório para muitos sujeitos passivos de IVA.',
      },
      {
        question: 'Todo o mundo paga IRS?',
        answer:
          'Depende dos rendimentos, retenções e agregado familiar. Muitos trabalhadores têm de entregar declaração anual mesmo que o resultado seja «não pagar mais imposto».',
      },
      {
        question: 'Posso ser meu próprio contador?',
        answer:
          'Pode tratar de declarações simples sozinho. Para actividade aberta, IVA e situações complexas, um contabilista certificado (OCC) compensa em multas evitadas e tempo.',
      },
      {
        question: 'Por onde começo a aprender?',
        answer:
          'Leia guias introdutórios no blog TegLion, um livro em português para não contadores, e se gostar explore formação formal ou cursos práticos sobre recibos verdes e IRS.',
      },
    ],
  }),
  'ferramentas-essenciais-contabilista-2026': faqSection({
    heading: 'Perguntas frequentes: ferramentas do contabilista',
    headingId: 'faq-ferramentas',
    items: [
      {
        question: 'Qual calculadora comprar para contabilidade?',
        answer:
          'Casio fx-991ES Plus ou equivalente com funções científicas e memórias — padrão em exames e no escritório para verificações rápidas.',
      },
      {
        question: 'Microsoft 365 é necessário num escritório?',
        answer:
          'É o padrão de facto para Excel, email e OneDrive. Active 2FA e organize pastas por cliente com permissões adequadas.',
      },
      {
        question: 'Que software para pedir documentos aos clientes?',
        answer:
          'Portal do cliente dedicado (ex.: TegLion) com lista de pedidos e estado — evita caixa de email caótica e melhora RGPD.',
      },
      {
        question: 'Antivírus é obrigatório para contabilistas?',
        answer:
          'Não é lei específica, mas é diligência profissional ao tratar dados fiscais de terceiros. Combine com backup e gestor de passwords.',
      },
      {
        question: 'ERP substitui portal do cliente?',
        answer:
          'Não. ERP foca contabilidade; portal foca relação e entrega de documentos com o contribuinte. Escritórios maduros usam ambos.',
      },
    ],
  }),
  'gestao-prazos-fiscais-escritorio-contabilidade': faqSection({
    heading: 'Perguntas frequentes: prazos no escritório',
    headingId: 'faq-prazos-escritorio',
    items: [
      {
        question: 'Qual o prazo mais crítico para escritórios?',
        answer:
          'Dia 20 (SS e IVA mensal) e campanha IRS concentram volume. O risco real é documento em falta dias antes — não só a submissão final.',
      },
      {
        question: 'Como alertar clientes em falta?',
        answer:
          'Ritmo fixo: pedido dia 5, lembrete dia 10, escalada dia 15. Portal com lista visível reduz «não sabia que faltava».',
      },
      {
        question: 'Uma pessoa pode gerir prazos de 100 clientes?',
        answer:
          'Com sistema (calendário por cliente, responsáveis, checklists) sim; só com memória e Excel, o risco de falha é alto.',
      },
      {
        question: 'O que fazer se o cliente entrega sempre tarde?',
        answer:
          'Contrato ou carta de exclusões, taxa de urgência, ou recusa de submissão em prazo impossível — documente política do escritório.',
      },
      {
        question: 'Software de prazos vs agenda de parede?',
        answer:
          'Use ambos se funcionar: software para alertas e histórico; parede para visão de equipa na segunda-feira.',
      },
    ],
  }),
}

export const PILLAR_SLUGS = Object.keys(PILLAR_FAQ_BLOCKS)

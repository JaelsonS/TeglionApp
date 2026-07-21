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
  'como-escolher-contabilista-portugal': faqSection({
    heading: 'Perguntas frequentes: escolher contabilista',
    headingId: 'faq-escolher-contabilista',
    items: [
      {
        question: 'O contabilista tem de ser inscrito na OCC?',
        answer:
          'Para actos reservados a técnicos oficiais de contas, sim — confirme inscrição na Ordem dos Contabilistas Certificados. Peça número de cédula e valide no site da OCC.',
      },
      {
        question: 'Quanto custa um contabilista para freelancer em Portugal?',
        answer:
          'Faixas típicas de 40–150 €/mês para independentes simples; PME e Lda sobem conforme volume e complexidade. Peça proposta por escrito com o que está incluído (IRS, IVA, SS, pedidos de documentos).',
      },
      {
        question: 'Quando devo mudar de contabilista?',
        answer:
          'Atrasos recorrentes, falta de resposta, erros no Portal das Finanças ou ausência de portal/checklist são sinais. Planeie a transição entre trimestres para não perder prazos.',
      },
      {
        question: 'Preciso de contabilista se só emito recibos verdes?',
        answer:
          'Não é obrigatório em todos os casos, mas reduz risco em IRS, IVA e Segurança Social. Se a facturação cresce ou abre Lda, o TOC torna-se quase indispensável.',
      },
      {
        question: 'O que pedir na primeira reunião?',
        answer:
          'CAE, regime (simplificado/organizado), software de facturação, prazos de entrega de documentos, canal de comunicação e se há portal do cliente — evite «só WhatsApp».',
      },
    ],
  }),
  'portal-financas-guia-completo-iniciantes': faqSection({
    heading: 'Perguntas frequentes: Portal das Finanças',
    headingId: 'faq-portal-financas',
    items: [
      {
        question: 'Como obter senha do Portal das Finanças?',
        answer:
          'Pode pedir senha no portal (envio por correio) ou usar Chave Móvel Digital / autenticação.gov. Guarde a senha num gestor — não partilhe por WhatsApp.',
      },
      {
        question: 'O que consigo fazer no e-Fatura?',
        answer:
          'Emitir recibos verdes, consultar facturas associadas ao NIF, gerir despesas e validar documentos relevantes para IRS e IVA, conforme o seu enquadramento.',
      },
      {
        question: 'Perdi a senha — o que faço?',
        answer:
          'Use a recuperação no portal ou autenticação.gov. Se tiver Chave Móvel Digital activa, muitas vezes consegue entrar sem a senha antiga.',
      },
      {
        question: 'Portal das Finanças e Segurança Social são a mesma coisa?',
        answer:
          'Não. Finanças (AT) trata impostos e facturação; Segurança Social trata contribuições e NISS. Independentes usam ambos todos os meses.',
      },
      {
        question: 'Posso autorizar o contabilista a aceder?',
        answer:
          'Sim, via procurações/autorizações no portal. Defina o âmbito (consulta vs submissão) e revogue quando mudar de TOC.',
      },
    ],
  }),
  'software-escritorio-contabilidade-portugal': faqSection({
    heading: 'Perguntas frequentes: software para escritórios',
    headingId: 'faq-software-escritorio',
    items: [
      {
        question: 'WhatsApp serve para gerir documentos de clientes?',
        answer:
          'Serve para urgências, não como arquivo. Mensagens misturam conversas, sem checklist nem histórico auditável — o risco de prazo perdido sobe.',
      },
      {
        question: 'O que um escritório OCC precisa em 2026?',
        answer:
          'Portal do cliente, pedidos de documentos, calendário de prazos, validação SAF-T/e-Fatura e comunicação rastreável — além do software de contabilidade clássico.',
      },
      {
        question: 'Quanto tempo demora digitalizar um escritório?',
        answer:
          'Piloto de 2–4 semanas com 10–20 clientes costuma bastar para provar o fluxo; migração total depende do volume e da disciplina da equipa.',
      },
      {
        question: 'Software de facturação e portal do escritório são a mesma coisa?',
        answer:
          'Não. Facturação emite documentos certificados; o portal organiza pedidos, prazos e comunicação com o cliente. Idealmente integram-se.',
      },
      {
        question: 'Como convencer a equipa a deixar o email?',
        answer:
          'Comece por um ritual semanal (segunda: prazos; quarta: documentos em falta) e mostre tempo recuperado — mudança por hábito, não por software sozinho.',
      },
    ],
  }),
  'abrir-empresa-individual-eni': faqSection({
    heading: 'Perguntas frequentes: abrir ENI',
    headingId: 'faq-eni',
    items: [
      {
        question: 'ENI e trabalhador independente são a mesma coisa?',
        answer:
          'Na prática, empresário em nome individual é a forma de abrir actividade a solo. «Trabalhador independente» descreve o estatuto fiscal/SS — muitas vezes coincidem.',
      },
      {
        question: 'Preciso de capital mínimo para abrir ENI?',
        answer:
          'Não há capital social como numa Lda. Há custos de início (eventuais taxas, software, SS) e obrigações contínuas — veja o guia de custos no blog.',
      },
      {
        question: 'Posso passar de ENI a Lda depois?',
        answer:
          'Sim. Muitos negócios começam ENI e migram quando a facturação, responsabilidade ou imagem comercial o justificam. Planeie com TOC antes do «dia D».',
      },
      {
        question: 'Tenho de ter contabilista para ENI?',
        answer:
          'Depende do regime e complexidade. Em regime simplificado muitos começam sozinhos; com IVA, retenções ou crescimento, um TOC reduz erros caros.',
      },
      {
        question: 'Onde se abre a actividade?',
        answer:
          'No Portal das Finanças (início de actividade). Depois trate NISS/SS e, se aplicável, software de facturação certificado.',
      },
    ],
  }),
  'abrir-sociedade-lda-portugal-passo-a-passo': faqSection({
    heading: 'Perguntas frequentes: abrir Lda',
    headingId: 'faq-abrir-lda',
    items: [
      {
        question: 'Quanto capital preciso para uma Lda?',
        answer:
          'O capital social mínimo legal é baixo face ao passado, mas reserve margem para notário/registo, contabilidade organizada e fundo de maneio dos primeiros meses.',
      },
      {
        question: 'Empresa na hora vs processo clássico?',
        answer:
          'Empresa na Hora é mais rápido para estruturas simples; processos com pacto social à medida ou várias quotas podem precisar de canal tradicional. Confirme nomes e CAE antes.',
      },
      {
        question: 'Lda obriga a contabilidade organizada?',
        answer:
          'Sim, sociedades estão tipicamente em contabilidade organizada com TOC. Orçamente honorários mensais antes de constituir.',
      },
      {
        question: 'Quanto tempo demora abrir uma Lda?',
        answer:
          'Com documentação pronta, Empresa na Hora pode ser no próprio dia; com banco, NISS colectivo e facturação, conte 1–4 semanas para estar operacional.',
      },
      {
        question: 'ENI ou Lda — o que escolher?',
        answer:
          'ENI é mais simples no arranque; Lda limita responsabilidade e pode fazer sentido com facturação alta, sócios ou risco comercial. Cruze com o guia de IRC no blog.',
      },
    ],
  }),
  'irc-sociedades-lda-portugal-guia': faqSection({
    heading: 'Perguntas frequentes: IRC e Lda',
    headingId: 'faq-irc-lda',
    items: [
      {
        question: 'Qual a diferença entre IRS e IRC?',
        answer:
          'IRS taxa pessoas (incl. ENI); IRC taxa lucros das sociedades. Na Lda o sócio pode ainda ter IRS sobre lucros distribuídos (dividendos), conforme regras em vigor.',
      },
      {
        question: 'A Lda paga sempre menos imposto que o ENI?',
        answer:
          'Não automaticamente. Depende da taxa efectiva, encargos, distribuição de lucros e custos de compliance. Simule com o TOC com números reais.',
      },
      {
        question: 'O que é PEC / pagamentos por conta?',
        answer:
          'Adiantamentos de IRC ao longo do ano com base no imposto do exercício anterior (com excepções). Falhar prazos gera juros — calendário do escritório é crítico.',
      },
      {
        question: 'Preciso de TOC para IRC?',
        answer:
          'Na prática sim: contabilidade organizada, IES e cumprimento de prazos. Escolher TOC com experiência em PME evita surpresas na declaração.',
      },
      {
        question: 'Quando faz sentido passar de ENI a Lda por imposto?',
        answer:
          'Quando o lucro e o risco justificam a estrutura — não só «porque ouvi dizer». Cruze responsabilidade limitada, imagem e custo administrativo.',
      },
    ],
  }),
  'regime-simplificado-vs-contabilidade-organizada': faqSection({
    heading: 'Perguntas frequentes: regimes de contabilidade',
    headingId: 'faq-regimes',
    items: [
      {
        question: 'O que é o regime simplificado?',
        answer:
          'Regime em que o rendimento tributável se apura com coeficientes sobre facturação, com menos obrigações contabilísticas do que a contabilidade organizada.',
      },
      {
        question: 'Quando sou obrigado a passar a organizado?',
        answer:
          'Há limiares de facturação e situações (ex.: certas sociedades) que impõem ou tornam preferível o organizado. Confirme limiares actuais com AT/TOC.',
      },
      {
        question: 'Organizado é sempre melhor?',
        answer:
          'Permite deduzir custos reais com rigor, mas custa mais (TOC, software). Se tem poucas despesas, o simplificado pode ser suficiente no início.',
      },
      {
        question: 'Posso mudar de regime a meio do ano?',
        answer:
          'Em regra as opções e mudanças respeitam prazos e formalidades no início de actividade ou em períodos definidos — não improvise; alinhe com o contabilista.',
      },
      {
        question: 'Lda pode estar em simplificado?',
        answer:
          'Sociedades estão tipicamente em contabilidade organizada. O simplificado é mais associado a independentes/ENI que cumprem condições.',
      },
    ],
  }),
  'quando-passar-de-isento-a-iva': faqSection({
    heading: 'Perguntas frequentes: sair da isenção de IVA',
    headingId: 'faq-sair-isencao-iva',
    items: [
      {
        question: 'Qual o sinal de que ultrapassei a isenção?',
        answer:
          'Volume de negócios a aproximar o limiar do art. 53.º, ou opção voluntária. Monitorize facturação acumulada mês a mês — não espere pelo fim do ano.',
      },
      {
        question: 'Tenho de mudar de software ao passar a IVA?',
        answer:
          'Se emite só recibos verdes isentos, prepare software certificado ou configuração correcta no e-Fatura para liquidar IVA e comunicar SAF-T se aplicável.',
      },
      {
        question: 'Os preços ao cliente sobem 23%?',
        answer:
          'Depende se trabalha B2B (cliente pode deduzir) ou B2C. Negocie transparência: preço + IVA vs preço «tudo incluído».',
      },
      {
        question: 'Posso voltar à isenção depois?',
        answer:
          'Há regras e prazos para regressar à isenção. Não assuma que é automático — confirme com TOC antes de planear.',
      },
      {
        question: 'O que preparar 60 dias antes?',
        answer:
          'TOC, software, grelha de preços, calendário de declarações periódicas e comunicação aos clientes habituais.',
      },
    ],
  }),
  'irs-recibos-verdes-erros-comuns': faqSection({
    heading: 'Perguntas frequentes: erros no IRS com recibos verdes',
    headingId: 'faq-erros-irs-rv',
    items: [
      {
        question: 'Qual o erro mais caro nos recibos verdes?',
        answer:
          'Não cruzar o que emitiu no e-Fatura com o que declara no Modelo 3 — omissões e duplicações geram inspecções e coimas.',
      },
      {
        question: 'Esqueci retenções na fonte — e agora?',
        answer:
          'Regularize na declaração e, se necessário, com o TOC. Guarde comprovativos dos clientes que reterem; sem papel, o risco de inconsistência sobe.',
      },
      {
        question: 'Despesas pessoais entram no IRS da actividade?',
        answer:
          'Não misture. Só custos da actividade, com factura a seu NIF e enquadramento correcto no regime. Pessoais seguem deduções à coleta quando aplicáveis.',
      },
      {
        question: 'Posso corrigir IRS já entregue?',
        answer:
          'Sim, via declaração de substituição dentro dos prazos. Quanto mais cedo, menor o impacto de juros/coimas.',
      },
      {
        question: 'Recibos verdes estrangeiros entram no IRS português?',
        answer:
          'Se for residente fiscal em Portugal, a regra geral é tributação mundial — com possíveis créditos por imposto pago no estrangeiro. Casos complexos: TOC + documentação.',
      },
    ],
  }),
  'retencao-fonte-recibos-verdes': faqSection({
    heading: 'Perguntas frequentes: retenção na fonte',
    headingId: 'faq-retencao',
    items: [
      {
        question: 'Quando o cliente deve reter IRS no recibo verde?',
        answer:
          'Quando a lei obriga retenção na fonte sobre aquele rendimento (ex.: certos serviços a entidades que retêm). O recibo deve reflectir a taxa e o líquido correctamente.',
      },
      {
        question: 'A retenção é o imposto final?',
        answer:
          'É um adiantamento. No IRS anual apura-se o imposto devido; pode haver reembolso ou valor a pagar.',
      },
      {
        question: 'Que taxa de retenção usar?',
        answer:
          'Depende da natureza do rendimento e regras em vigor. Confirme a taxa legal actual — não copie um recibo antigo sem validar.',
      },
      {
        question: 'Cliente estrangeiro também retém?',
        answer:
          'Muitas vezes não, ou aplica regras diferentes. Documente o país do cliente e alinhe com o TOC para evitar falhas no Modelo 3.',
      },
      {
        question: 'Como reflectir retenções no IRS?',
        answer:
          'Some o imposto retido nos campos próprios do Modelo 3 e guarde os recibos. Divergências com a AT costumam vir de totais mal somados.',
      },
    ],
  }),
  'saft-efatura-validacao-documentos-escritorio': faqSection({
    heading: 'Perguntas frequentes: SAF-T e e-Fatura',
    headingId: 'faq-saft-efatura',
    items: [
      {
        question: 'O que é o SAF-T (PT)?',
        answer:
          'Ficheiro standard de auditoria fiscal com movimentos de facturação/contabilidade, comunicado à AT conforme obrigações do contribuinte e do software.',
      },
      {
        question: 'Porque o escritório pede SAF-T ao cliente?',
        answer:
          'Para cruzar facturação emitida com o que chega por PDF/WhatsApp e detectar buracos antes das declarações — poupa horas no fecho do mês.',
      },
      {
        question: 'e-Fatura substitui o SAF-T?',
        answer:
          'Não. São canais complementares. O e-Fatura ajuda a ver documentos associados ao NIF; o SAF-T traz a visão do software certificado.',
      },
      {
        question: 'Cliente só envia fotos no chat — chega?',
        answer:
          'Não como processo. Exija portal ou pasta padronizada; fotos soltas atrasam validação e aumentam risco de documento ilegível.',
      },
      {
        question: 'Com que frequência validar?',
        answer:
          'Ritmo mensal alinhado ao fecho (antes do dia 15–20). Escritórios maduros fazem checklist por cliente, não «quando der».',
      },
    ],
  }),
  'organizar-documentos-fiscais-arquivo-digital': faqSection({
    heading: 'Perguntas frequentes: arquivo digital fiscal',
    headingId: 'faq-arquivo-digital',
    items: [
      {
        question: 'Quanto tempo guardar documentos fiscais?',
        answer:
          'Regra prática: pelo menos 4 anos após o período a que respeitam (alinhado a prazos de fiscalização). Digitalize e faça backup.',
      },
      {
        question: 'Qual a melhor estrutura de pastas?',
        answer:
          'Ano → tipo (recibos, compras, banco, SS, IRS) → mês. Nomes de ficheiro com data ISO (2026-03-15_fornecedor.pdf) aceleram pesquisas.',
      },
      {
        question: 'PDF ou foto do telemóvel?',
        answer:
          'PDF legível preferível. Foto só se nítida e completa; o TOC deve conseguir ler NIF, valores e datas sem zoom eterno.',
      },
      {
        question: 'Posso apagar originais em papel?',
        answer:
          'Depende do documento e da política do TOC. Muitos aceitam digital desde que a qualidade e a integridade estejam garantidas — confirme antes de destruir.',
      },
      {
        question: 'Como partilhar arquivo com o contabilista?',
        answer:
          'Portal do cliente ou pasta partilhada com permissões — evite WhatsApp como arquivo mestre.',
      },
    ],
  }),
  'freelancer-estrangeiro-portugal': faqSection({
    heading: 'Perguntas frequentes: freelancer estrangeiro',
    headingId: 'faq-freelancer-estrangeiro',
    items: [
      {
        question: 'Preciso de NIF para trabalhar a recibos verdes?',
        answer:
          'Sim. Sem NIF não abre actividade nem emite recibos no Portal das Finanças. Trate identificação e morada fiscal cedo.',
      },
      {
        question: 'Residência fiscal em Portugal — o que muda?',
        answer:
          'Em regra, residentes são tributados sobre rendimentos mundiais. Dias de permanência e laços pessoais/económicos importam — casos limítrofes: aconselhe-se.',
      },
      {
        question: 'Brasileiros têm regras especiais?',
        answer:
          'Há convenções e formalidades (NIF, SS, eventualmente vistos/autorizações). O processo fiscal português aplica-se; não copie só tutoriais de outro país.',
      },
      {
        question: 'Posso emitir recibos a clientes no estrangeiro?',
        answer:
          'Sim, com atenção a IVA (regras de localização), retenções e documentação. Software e TOC evitam erros de enquadramento.',
      },
      {
        question: 'Segurança Social sendo estrangeiro?',
        answer:
          'Com actividade aberta em Portugal, em regra há enquadramento na SS portuguesa (com excepções de destacamento/A1). Valide o seu caso antes do primeiro mês.',
      },
    ],
  }),
  'caso-escritorio-digitalizacao-prazos': faqSection({
    heading: 'Perguntas frequentes sobre este caso',
    headingId: 'faq-caso-escritorio',
    items: [
      {
        question: 'Este caso é de um cliente real?',
        answer:
          'É uma história anonimizada e ilustrativa com base em padrões comuns de escritórios pequenos em Portugal — não é testemunho nominal.',
      },
      {
        question: 'Quanto tempo até ver resultados?',
        answer:
          'No relato, rituais de prazo e portal estruturado mostram ganhos em cerca de 90 dias — o seu ritmo depende da disciplina da equipa.',
      },
      {
        question: 'Preciso de software caro para digitalizar?',
        answer:
          'Não. O salto maior é processo (pedidos, responsáveis, checklist). Ferramentas como o TegLion aceleram, mas sem hábito o software não salva.',
      },
      {
        question: 'Por onde começar amanhã?',
        answer:
          'Liste clientes com prazo nos próximos 20 dias, peça documentos em falta num canal único e marque um ritual semanal de 30 minutos.',
      },
      {
        question: 'O que ler a seguir?',
        answer:
          'Os guias de digitalizar escritório, gestão de prazos e SAF-T/e-Fatura no blog TegLion — formam a série de operações.',
      },
    ],
  }),
  'caso-pme-transicao-eni-lda': faqSection({
    heading: 'Perguntas frequentes sobre este caso',
    headingId: 'faq-caso-eni-lda',
    items: [
      {
        question: 'Os números do caso são reais?',
        answer:
          'São ilustrativos e arredondados para ensinar o raciocínio — não são aconselhamento fiscal personalizado nem garantia de poupança.',
      },
      {
        question: 'Quando uma PME deve considerar Lda?',
        answer:
          'Facturação a crescer, risco comercial, entrada de sócio ou necessidade de imagem perante bancos/clientes — sempre com simulação TOC.',
      },
      {
        question: 'O que o TOC pediu antes do «dia D»?',
        answer:
          'No relato: mapa de custos, calendário de obrigações, software e contas — a transição falha quando se constitui a sociedade sem operação preparada.',
      },
      {
        question: 'Posso manter ENI e abrir Lda em paralelo?',
        answer:
          'Por vezes faz-se durante a transição, com cuidado a não misturar facturação e património. Estrutura incorrecta cria problemas fiscais — alinhe com TOC.',
      },
      {
        question: 'Que artigos do blog completam este caso?',
        answer:
          'Abrir Lda passo a passo e o guia de IRC/sociedades — use o caso como motivação e os guias como checklist.',
      },
    ],
  }),
}

export const PILLAR_SLUGS = Object.keys(PILLAR_FAQ_BLOCKS)

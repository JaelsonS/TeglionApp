import type { LegalDocument } from '@/features/legal/contabil/types'
import { CONTABIL_LEGAL_VERSIONS } from '@/features/legal/contabil/versions'

export const privacyDocument: LegalDocument = {
  key: 'privacy',
  title: 'Política de Privacidade',
  subtitle: 'Regulamento (UE) 2016/679 (RGPD) e Lei n.º 58/2019',
  updatedAtLabel: 'Versão',
  updatedAtValue: '18 de agosto de 2026',
  version: CONTABIL_LEGAL_VERSIONS.privacy,
  intro: [
    'Esta Política descreve como a AfDigital — Soluções Tecnológicas trata dados pessoais ao desenvolver e operar o produto Teglion (website, aplicação web e serviços associados). Teglion é o nome comercial do software; não é uma empresa nem parte contratual autónoma.',
    'O tratamento decorre da prestação de software a escritórios de contabilidade (B2B) e do acesso de clientes finais convidados pelo escritório (B2B2C indirecto). Os papéis RGPD variam por fluxo de dados, como se descreve abaixo.',
  ],
  sections: [
    {
      id: 'responsavel',
      title: '1. Quem opera o produto (conta, faturação e site)',
      paragraphs: [
        'Para dados de registo do escritório, faturação da subscrição, suporte e o site teglion.com, o responsável pelo tratamento é a AfDigital — Soluções Tecnológicas, prestada por Jaelson Silva dos Santos, NIF 331 759 276, Coimbra, Portugal, afdigitalweb.st@gmail.com, +351 916 447 990.',
        'Pedidos relativos a esta conta ou ao site: afdigitalweb.st@gmail.com.',
      ],
    },
    {
      id: 'papel-escritorio',
      title: '2. Dados dos clientes finais do escritório',
      paragraphs: [
        'Nome, NIF, documentos fiscais, mensagens e obrigações dos clientes finais são, em regra, tratados pelo escritório de contabilidade como Responsável pelo Tratamento. A AfDigital, ao prestar o Teglion, trata esses dados como Subcontratante nos termos do DPA em /dpa, só para operar o software e segundo instruções do escritório.',
        'Para exercer direitos sobre dados fiscais ou documentos, o titular deve contactar prioritariamente o seu escritório de contabilidade.',
      ],
    },
    {
      id: 'categorias',
      title: '3. Categorias de dados tratados',
      bullets: [
        'Dados de identificação e contacto: nome, e-mail, telefone, NIF, morada.',
        'Dados de autenticação: credenciais (armazenadas de forma segura), tokens de sessão, registos de login.',
        'Dados fiscais e empresariais: obrigações, prazos, valores, CAE, regime de IVA, notas internas.',
        'Documentos: PDF, imagens e outros ficheiros carregados pelas partes.',
        'Comunicações: mensagens entre escritório e cliente na Plataforma.',
        'Metadados técnicos: endereço IP, user-agent, data/hora de acções, logs de auditoria.',
        'Dados de consentimento legal: versão dos termos aceites, timestamp, IP (registo de escritório).',
      ],
      paragraphs: [],
    },
    {
      id: 'finalidades',
      title: '4. Finalidades e bases legais (art. 6.º RGPD)',
      bullets: [
        'Execução do contrato de licença SaaS (art. 6.º/1/b): operar contas, portal, armazenamento, mensagens.',
        'Interesse legítimo (art. 6.º/1/f): segurança, prevenção de fraude, melhoria do serviço, logs técnicos proporcionais.',
        'Cumprimento de obrigação legal (art. 6.º/1/c): conservação de registos fiscais/contabilísticos quando aplicável ao Operador.',
        'Consentimento (art. 6.º/1/a): cookies não essenciais e comunicações de marketing, quando activadas.',
      ],
      paragraphs: [],
    },
    {
      id: 'armazenamento',
      title: '5. Armazenamento e segurança',
      paragraphs: [
        'Os dados são alojados em infraestrutura cloud com base de dados PostgreSQL e armazenamento de ficheiros (Supabase Storage), com isolamento por escritório (multi-tenant).',
        'Aplicamos medidas técnicas e organizativas adequadas: HTTPS, controlo de acesso por perfil, hashing de palavras-passe, registo de actividade, backups e princípio do menor privilégio.',
        'Nenhum sistema é 100% seguro; em caso de violação de dados notificaremos o escritório e, quando aplicável, a CNPD no prazo legal.',
      ],
    },
    {
      id: 'subcontratantes',
      title: '6. Subcontratantes e transferências',
      paragraphs: [
        'A AfDigital recorre a prestadores de infraestrutura e comunicação (lista no DPA), seleccionados com cláusulas de protecção de dados (art. 28.º RGPD).',
        'Os dados são tratados preferencialmente no Espaço Económico Europeu. Qualquer transferência para terceiros países só ocorrerá com garantias adequadas (cláusulas-tipo, decisão de adequação) e instrução do responsável quando o escritório for controlador.',
      ],
    },
    {
      id: 'retencao',
      title: '7. Prazos de conservação',
      paragraphs: [
        'Dados da conta do escritório: durante a subscrição e até 90 dias após encerramento, salvo obrigação legal superior.',
        'Dados dos clientes finais na Plataforma: definidos pelo escritório responsável; o Operador elimina ou devolve após rescisão conforme DPA, salvo backup temporário.',
        'Logs de segurança e consentimentos legais: conservados pelo período necessário para defesa de direitos e prova de conformidade (em regra até 5 anos).',
        'O escritório pode configurar políticas internas de arquivo de documentos fiscais nos prazos legais aplicáveis à sua actividade.',
      ],
    },
    {
      id: 'direitos',
      title: '8. Direitos dos titulares',
      bullets: [
        'Acesso, rectificação, apagamento, limitação, portabilidade e oposição (arts. 15.º–22.º RGPD).',
        'Retirar consentimento quando o tratamento se baseie nele, sem afectar tratamentos anteriores lícitos.',
        'Apresentar reclamação à Comissão Nacional de Protecção de Dados (CNPD), www.cnpd.pt.',
      ],
      paragraphs: [
        'Pedidos relativos a dados tratados pelo escritório: contactar o escritório. Pedidos relativos à conta do escritório ou ao site: afdigitalweb.st@gmail.com.',
      ],
    },
    {
      id: 'menores',
      title: '9. Menores',
      paragraphs: [
        'O Serviço não se destina a menores de 16 anos sem supervisão do responsável legal. O escritório não deve inserir dados de menores salvo base legal válida.',
      ],
    },
    {
      id: 'decisoes-auto',
      title: '10. Decisões automatizadas',
      paragraphs: [
        'A Plataforma pode apresentar alertas de prazos e indicadores de risco operacional com base em regras configuradas. Não adoptamos decisões com efeitos jurídicos exclusivamente automatizados sobre titulares sem intervenção humana do escritório.',
      ],
    },
    {
      id: 'alteracoes',
      title: '11. Alterações',
      paragraphs: [
        'Podemos actualizar esta Política. A versão vigente está indicada no topo. Alterações relevantes serão comunicadas ou exigirão nova aceitação no acesso à conta.',
      ],
    },
  ],
}

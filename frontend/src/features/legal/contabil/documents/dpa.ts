import type { LegalDocument } from '@/features/legal/contabil/types'
import { CONTABIL_LEGAL_VERSIONS } from '@/features/legal/contabil/versions'

export const dpaDocument: LegalDocument = {
  key: 'dpa',
  title: 'Acordo de Subcontratação de Tratamento de Dados (DPA)',
  subtitle: 'Artigo 28.º do Regulamento (UE) 2016/679 (RGPD)',
  updatedAtLabel: 'Versão',
  updatedAtValue: '22 de maio de 2026',
  version: CONTABIL_LEGAL_VERSIONS.dpa,
  intro: [
    'O presente Acordo de Tratamento de Dados («DPA») complementa os Termos de Utilização e aplica-se quando o escritório de contabilidade («Controlador», «Escritório», «você») utiliza a plataforma TegLion («Processador», «Plataforma», «nós») para tratar dados pessoais dos seus clientes finais.',
    'Ao aceitar este DPA no registo ou na re-aceitação exigida por nova versão, o representante do Escritório declara ter poderes para vincular a entidade e compromete-se a cumprir as obrigações de controlador nos termos do RGPD.',
    'Prestador do software: Jaelson Silva dos Santos, NIF 331 759 276, Coimbra, Portugal.',
  ],
  sections: [
    {
      id: 'definicoes',
      title: '1. Definições',
      paragraphs: [
        '«Dados Pessoais», «Tratamento», «Titular», «Responsável pelo Tratamento» (Controlador), «Subcontratante» (Processador), «Violação de Dados Pessoais» e «Autoridade de Controlo» têm o significado do RGPD.',
        '«Instruções documentadas» são as configurações, convites a clientes, cargas documentais e demais utilização da Plataforma efectuada pelo Escritório, mais eventuais instruções escritas enviadas para jaelsonsilva345@gmail.com.',
      ],
    },
    {
      id: 'objecto',
      title: '2. Objecto e duração',
      paragraphs: [
        'O Processador trata Dados Pessoais apenas para prestar o Serviço SaaS: alojamento seguro, portal do cliente, mensagens, obrigações fiscais, documentos, notificações, registo de actividade e funcionalidades descritas nos Termos.',
        'A duração do tratamento coincide com a vigência da subscrição e termina com a rescisão, aplicando-se as regras de devolução e eliminação da cláusula 11.',
      ],
    },
    {
      id: 'natureza-dados',
      title: '3. Natureza e categorias de dados',
      bullets: [
        'Identificação e contacto de colaboradores do Escritório e de clientes finais.',
        'Dados fiscais e empresariais (NIF, obrigações, prazos, valores, regime de IVA).',
        'Documentos fiscais e contabilísticos (PDF, imagens, anexos).',
        'Comunicações trocadas na Plataforma.',
        'Metadados técnicos: IP, user-agent, carimbos temporais, logs de auditoria.',
      ],
      paragraphs: [
        'Categorias de titulares: utilizadores do Escritório, clientes finais (empresas e, quando aplicável, particulares) convidados pelo Escritório.',
      ],
    },
    {
      id: 'instrucoes',
      title: '4. Instruções do Controlador',
      paragraphs: [
        'O Processador só trata Dados Pessoais segundo instruções documentadas do Escritório, salvo obrigação legal da União ou de Estado-Membro que imponha tratamento — caso em que o Processador informará o Escritório, salvo proibição legal.',
        'O Escritório é responsável pela licitude das instruções, bases legais, informação aos titulares e resposta a pedidos de exercício de direitos.',
      ],
    },
    {
      id: 'confidencialidade',
      title: '5. Confidencialidade',
      paragraphs: [
        'O Processador garante que o pessoal autorizado está sujeito a dever de confidencialidade contratual ou legal adequado.',
        'Não acedemos ao conteúdo dos documentos para fins alheios à prestação do Serviço, suporte técnico solicitado ou cumprimento legal.',
      ],
    },
    {
      id: 'seguranca',
      title: '6. Medidas de segurança (art. 32.º RGPD)',
      bullets: [
        'Isolamento multi-tenant por escritório (firm_id) em base de dados e políticas de acesso.',
        'Armazenamento de ficheiros em bucket privado (Supabase Storage) com URLs assinadas e controlo por perfil.',
        'Comunicação criptografada (TLS/HTTPS).',
        'Gestão de credenciais com hashing e tokens de sessão.',
        'Registo de actividade e logs de auditoria para acções sensíveis.',
        'Backups e procedimentos de recuperação conforme boas práticas do fornecedor de cloud.',
        'Revisão periódica de acessos e actualização de dependências críticas.',
      ],
      paragraphs: [],
    },
    {
      id: 'subprocessadores',
      title: '7. Subcontratantes autorizados (subprocessadores)',
      paragraphs: [
        'O Escritório autoriza o Processador a recorrer aos seguintes tipos de subcontratantes, sujeitos a contrato escrito com cláusulas equivalentes ao art. 28.º RGPD:',
        'Lista actualizada disponível mediante pedido a jaelsonsilva345@gmail.com. Alterações materiais serão comunicadas com prazo mínimo de 30 dias para objecção fundamentada; na ausência de objecção no prazo, considera-se aceite a continuação do Serviço ou alternativa razoável oferecida.',
      ],
      bullets: [
        'Supabase Inc. (ou entidade contratual aplicável) — base de dados PostgreSQL, autenticação e armazenamento de objectos na UE/EEE quando configurado na região europeia.',
        'Prestador de hosting / CDN da aplicação web.',
        'Serviço de e-mail transaccional para convites, recuperação de palavra-passe e notificações.',
        'Prestador de SMS, se activado pelo Escritório.',
      ],
    },
    {
      id: 'transferencias',
      title: '8. Transferências internacionais',
      paragraphs: [
        'Os dados devem permanecer no EEE. Se for necessária transferência para terceiro país, aplicar-se-ão Cláusulas Contratuais-Tipo da Comissão Europeia ou outra garantia do art. 46.º RGPD, com avaliação de impacto quando exigível.',
      ],
    },
    {
      id: 'assistencia',
      title: '9. Assistência ao Controlador',
      paragraphs: [
        'O Processador assiste o Escritório, na medida do razoavelmente possível, no cumprimento das obrigações relativas a pedidos dos titulares (arts. 15.º–22.º), segurança, notificação de violações (arts. 33.º e 34.º) e avaliações de impacto (art. 35.º), mediante custos proporcionais se o volume de pedidos for manifestamente excessivo.',
      ],
    },
    {
      id: 'violacoes',
      title: '10. Violações de dados pessoais',
      paragraphs: [
        'O Processador notifica o Escritório sem demora injustificada após tomar conhecimento de uma violação que possa afectar Dados Pessoais tratados na Plataforma, fornecendo informação disponível para permitir notificação à CNPD e, se aplicável, aos titulares.',
        'A notificação inicial pode ser incompleta; informações adicionais serão fornecidas à medida da investigação.',
      ],
    },
    {
      id: 'eliminacao',
      title: '11. Devolução e eliminação',
      paragraphs: [
        'Após cessação do contrato, o Processador elimina ou devolve os Dados Pessoais conforme instrução do Escritório, salvo conservação exigida por lei da União ou portuguesa (ex.: prova de consentimentos legais, facturação).',
        'Cópias em backups são sobrescritas ou eliminadas no ciclo normal de retenção de backups (em regra até 90 dias).',
        'O Escritório pode exportar dados antes do encerramento através das funcionalidades disponíveis ou pedido de suporte.',
      ],
    },
    {
      id: 'auditoria',
      title: '12. Auditoria e informação',
      paragraphs: [
        'O Processador disponibiliza informação necessária para demonstrar conformidade com o art. 28.º RGPD e permite auditorias razoáveis do Escritório, no máximo uma vez por ano civil salvo incidente grave, com aviso prévio de 30 dias e sujeitas a confidencialidade e horário comercial, sem acesso a dados de outros escritórios.',
        'Podem substituir-se auditorias presenciais por relatórios de conformidade de subcontratantes ou certificações reconhecidas, quando disponíveis.',
      ],
    },
    {
      id: 'responsabilidade',
      title: '13. Responsabilidade',
      paragraphs: [
        'Cada parte responde perante titulares e autoridades pelas violações do RGPD que lhe sejam imputáveis. Em tratamento conjunto não previsto, aplicam-se as regras gerais de responsabilidade solidária apenas quando legalmente exigível.',
        'Limitações de responsabilidade dos Termos aplicam-se a reclamações entre Escritório e Processador, sem prejuízo de direitos imperativos dos titulares.',
      ],
    },
    {
      id: 'prioridade',
      title: '14. Ordem de precedência',
      paragraphs: [
        'Em caso de conflito entre este DPA e os Termos quanto ao tratamento de dados, prevalece este DPA. Em caso de conflito com legislação imperativa de protecção de dados, prevalece a lei.',
      ],
    },
    {
      id: 'contacto-dpa',
      title: '15. Contacto',
      paragraphs: [
        'Questões sobre tratamento de dados e este DPA: jaelsonsilva345@gmail.com · Política de Privacidade: /privacidade.',
      ],
    },
  ],
}

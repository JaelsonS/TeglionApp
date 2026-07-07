import type { LegalDocument } from '@/features/legal/contabil/types'
import { CONTABIL_LEGAL_VERSIONS } from '@/features/legal/contabil/versions'

export const cookiesDocument: LegalDocument = {
  key: 'cookies',
  title: 'Política de Cookies',
  subtitle: 'Directiva 2002/58/CE (ePrivacy) e RGPD',
  updatedAtLabel: 'Versão',
  updatedAtValue: '22 de maio de 2026',
  version: CONTABIL_LEGAL_VERSIONS.cookies,
  intro: [
    'Esta política explica o uso de cookies e tecnologias similares no website e na aplicação TegLion.',
    'Cookies essenciais são necessários para login, segurança e preferências básicas. Cookies não essenciais (ex.: analítica) só são activados após consentimento explícito no banner de cookies.',
  ],
  sections: [
    {
      id: 'o-que-sao',
      title: '1. O que são cookies',
      paragraphs: [
        'Cookies são pequenos ficheiros armazenados no seu dispositivo quando visita um site. Podem ser de sessão ou persistentes, próprios ou de terceiros.',
      ],
    },
    {
      id: 'essenciais',
      title: '2. Cookies estritamente necessários',
      bullets: [
        'Sessão de autenticação (access/refresh token em cookie httpOnly ou equivalente).',
        'Protecção CSRF e segurança da sessão.',
        'Preferência de idioma ou tema quando guardada localmente.',
        'Registo da escolha de cookies (consentimento ou rejeição de não essenciais).',
      ],
      paragraphs: [
        'Base legal: interesse legítimo / execução do contrato. Não requerem consentimento para serem depositados, por serem indispensáveis ao serviço solicitado.',
      ],
    },
    {
      id: 'nao-essenciais',
      title: '3. Cookies não essenciais',
      paragraphs: [
        'Podemos utilizar cookies de medição de audiência ou desempenho apenas se activar «Aceitar» no banner. Enquanto não consentir, esses scripts não são carregados.',
        'Não utilizamos cookies de publicidade comportamental de terceiros na versão actual do produto.',
      ],
    },
    {
      id: 'gestao',
      title: '4. Gestão de preferências',
      paragraphs: [
        'Pode aceitar ou rejeitar cookies não essenciais no banner apresentado na primeira visita. Pode alterar a escolha eliminando cookies no browser ou contactando-nos.',
        'A rejeição de não essenciais não impede o login nem o uso das funcionalidades principais.',
      ],
    },
    {
      id: 'terceiros',
      title: '5. Cookies de terceiros',
      paragraphs: [
        'Se integrarmos ferramentas de terceiros (ex.: analytics), esses prestadores podem depositar cookies próprios sujeitos às suas políticas. Listaremos actualizações nesta página.',
      ],
    },
    {
      id: 'contacto',
      title: '6. Contacto',
      paragraphs: ['Questões: jaelsonsilva345@gmail.com · Política de Privacidade: /privacidade.'],
    },
  ],
}

/** Marca e domínio oficial Teglion — escritórios de contabilidade em Portugal. */
const BRAND = {
  name: 'Teglion',
  domain: 'teglion.com',
  logPrefix: '[Teglion]',
  emails: {
    /** Caixa real (receber / mailto / notificações internas). */
    hello: 'jaelsonsilva345@gmail.com',
    support: 'jaelsonsilva345@gmail.com',
    commercial: 'jaelsonsilva345@gmail.com',
    /**
     * Remetentes Brevo (só envio — domínio autenticado, sem inbox).
     * O From: da app vem de FROM_EMAIL / EMAIL_FROM_* no env.
     */
    sendContact: 'contato@teglion.com',
    sendSupport: 'suporte@teglion.com',
    sendCommercial: 'comercial@teglion.com',
  },
  /** Origens HTTPS aceites em produção */
  productionOrigins: [
    'https://teglion.com',
    'https://www.teglion.com',
    'https://app.teglion.com',
  ],
};

module.exports = { BRAND };

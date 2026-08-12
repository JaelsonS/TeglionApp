const crypto = require('crypto');

/** Bump quando o texto legal mudar — exige novo aceite antes de novo Account Link. */
const CONNECT_TERMS_VERSION = 'connect_payment_responsibility_v1';

const CONNECT_TERMS_TITLE = 'Pagamentos online — responsabilidade e Stripe Connect';

/**
 * Texto oficial apresentado ao dono do escritório antes do onboarding Connect.
 * Guardar hash SHA-256 deste texto exacto em cada aceite.
 */
const CONNECT_TERMS_BODY = `Pagamentos online no Teglion (Stripe Connect)

1. O que é o Teglion
O Teglion é um software (SaaS) para o seu escritório de contabilidade. Fornecemos a infraestrutura tecnológica: página pública, agendamentos, estados internos e ligação técnica à Stripe. O Teglion não é banco, não é processador de pagamentos e não custodia o dinheiro dos seus clientes.

2. Quem processa e recebe o dinheiro
Os pagamentos dos seus clientes finais são processados pela Stripe, através de uma conta Stripe Connect associada ao seu escritório (Connected Account). O valor pago pelo cliente pelo seu serviço segue para a sua conta Stripe / conta bancária ligada na Stripe — não para a conta da Teglion.

3. Quem é responsável
• O seu escritório é o prestador do serviço e o responsável comercial perante o cliente (preço, entrega, qualidade, facturação fiscal do serviço, reembolsos e disputas, nos termos aplicáveis).
• A Stripe é responsável pelas operações próprias da infraestrutura de pagamentos (processamento, compliance de pagamentos, KYC da conta Connect, payouts, etc.), nos termos do contrato Stripe consigo.
• A Teglion é responsável apenas pela orquestração tecnológica (criar o Checkout, receber webhooks, actualizar estados no software e apresentar informação). A Teglion não decide disputas de pagamento nem detém os fundos dos seus clientes.

4. Assinatura Teglion vs pagamentos dos clientes
A mensalidade/plano que o escritório paga à Teglion (Stripe Billing) é um fluxo separado. Os pagamentos que os clientes finais fazem pelos seus serviços (Stripe Connect) são outro fluxo. Não são misturados.

5. Dados de cartão
Os dados de cartão nunca são introduzidos nem armazenados no Teglion. O pagamento decorre no Checkout hospedado pela Stripe (PCI).

6. Aceitação
Ao continuar e ligar a Stripe, confirma que leu e compreendeu esta política, que aceita que a Teglion não custodia nem é responsável pelo dinheiro dos seus clientes, e que a relação de pagamento com os seus clientes decorre via Stripe na sua Connected Account.`;

function connectTermsTextSha256() {
  return crypto.createHash('sha256').update(CONNECT_TERMS_BODY, 'utf8').digest('hex');
}

function getConnectTermsPayload() {
  return {
    version: CONNECT_TERMS_VERSION,
    title: CONNECT_TERMS_TITLE,
    body: CONNECT_TERMS_BODY,
    sha256: connectTermsTextSha256(),
  };
}

module.exports = {
  CONNECT_TERMS_VERSION,
  CONNECT_TERMS_TITLE,
  CONNECT_TERMS_BODY,
  connectTermsTextSha256,
  getConnectTermsPayload,
};

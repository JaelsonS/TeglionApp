const crypto = require('crypto');
const { getPlatformFeePercentLabel } = require('./connect-fees');

/** Bump quando o texto legal mudar — exige novo aceite antes de novo Account Link. */
const CONNECT_TERMS_VERSION = 'connect_payment_responsibility_v2';

const CONNECT_TERMS_TITLE = 'Pagamentos online — responsabilidade, Stripe Connect e taxa Teglion';

function buildConnectTermsBody() {
  const feePct = getPlatformFeePercentLabel();
  return `Pagamentos online no Teglion (Stripe Connect)

1. O que é o Teglion
O Teglion é um software (SaaS) para o seu escritório de contabilidade. Fornecemos a infraestrutura tecnológica: página pública, agendamentos, estados internos e ligação técnica à Stripe, incluindo a orquestração do Checkout e a confirmação automática do pagamento no software. O Teglion não é banco e não custodia o dinheiro dos seus clientes.

2. Quem processa e recebe o dinheiro
Os pagamentos dos seus clientes finais são processados pela Stripe, através de uma conta Stripe Connect associada ao seu escritório (Connected Account / Express). O valor pago pelo cliente pelo seu serviço é cobrado na sua conta Stripe; após as taxas abaixo, o saldo disponível segue para a sua conta bancária ligada na Stripe — não fica na conta da Teglion como custódia.

3. Custos e taxas (transparência)
Há dois tipos de custos, distintos:
• Taxas da Stripe (processamento de pagamentos, conversão, disputas, etc.): são cobradas pela Stripe segundo o contrato e a tabela de preços Stripe aplicáveis à sua Connected Account. A Teglion não define essas taxas da Stripe.
• Taxa de serviço da plataforma Teglion (${feePct}% do valor de cada pagamento online processado via Teglion): é uma application fee (taxa de aplicação) retida automaticamente no momento do pagamento. Remunera o serviço tecnológico do Teglion — página pública, motor de agendamento com reserva temporária (hold), Checkout Stripe, webhooks, actualização de estados, e a manutenção da integração Connect. Não é uma “comissão oculta” sobre o dinheiro do cliente: está descrita aqui, é cobrada de forma automática e transparente no fluxo Stripe, e o escritório continua a ser quem vende o serviço ao cliente final.

Exemplo: se o cliente paga 100,00 €, a taxa Teglion de ${feePct}% sobre esse valor é retida automaticamente no momento do pagamento (ex.: 2% de 100,00 € = 2,00 €). O restante (menos as taxas Stripe) fica no saldo da sua conta Connect.

4. Quem é responsável
• O seu escritório é o prestador do serviço e o responsável comercial perante o cliente (preço, entrega, qualidade, facturação fiscal do serviço, reembolsos e disputas comerciais, nos termos aplicáveis).
• A Stripe é responsável pelas operações próprias da infraestrutura de pagamentos (processamento, compliance de pagamentos, KYC da conta Connect, payouts, etc.), nos termos do contrato Stripe consigo.
• A Teglion é responsável pela orquestração tecnológica descrita acima e pela cobrança da taxa de serviço da plataforma. A Teglion não decide disputas de pagamento do cliente final nem detém os fundos dos seus clientes como depositário.

5. Assinatura Teglion vs pagamentos dos clientes
A mensalidade/plano que o escritório paga à Teglion (Stripe Billing) é um fluxo separado. Os pagamentos que os clientes finais fazem pelos seus serviços (Stripe Connect) são outro fluxo. A taxa de serviço de ${feePct}% aplica-se apenas aos pagamentos Connect dos clientes finais, não substitui a mensalidade do software.

6. Dados de cartão
Os dados de cartão nunca são introduzidos nem armazenados no Teglion. O pagamento decorre no Checkout hospedado pela Stripe (PCI).

7. Aceitação
Ao continuar e ligar a Stripe (ou ao aceitar esta versão actualizada), confirma que leu e compreendeu esta política, incluindo a taxa de serviço Teglion de ${feePct}% por pagamento online, que a Teglion não custodia o dinheiro dos seus clientes, e que a relação de pagamento com os seus clientes decorre via Stripe na sua Connected Account.`;
}

const CONNECT_TERMS_BODY = buildConnectTermsBody();

function connectTermsTextSha256() {
  return crypto.createHash('sha256').update(CONNECT_TERMS_BODY, 'utf8').digest('hex');
}

function getConnectTermsPayload() {
  return {
    version: CONNECT_TERMS_VERSION,
    title: CONNECT_TERMS_TITLE,
    body: CONNECT_TERMS_BODY,
    sha256: connectTermsTextSha256(),
    platformFeePercent: getPlatformFeePercentLabel(),
  };
}

module.exports = {
  CONNECT_TERMS_VERSION,
  CONNECT_TERMS_TITLE,
  CONNECT_TERMS_BODY,
  connectTermsTextSha256,
  getConnectTermsPayload,
};

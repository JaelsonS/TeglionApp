# Variáveis de ambiente

Visão por categoria — sem listar valor real de nenhum segredo aqui, de propósito.

## Categorias

- **Banco e storage**: credenciais de conexão ao Supabase, incluindo a chave de acesso administrativo que o backend usa (ver [MULTI-TENANCY.md](../04-ARQUITETURA/MULTI-TENANCY.md) para o que essa chave implica).
- **Autenticação**: segredos usados para assinar e validar os tokens de sessão.
- **Criptografia de dado sensível**: chave usada para cifrar campo específico em banco (por exemplo, token de integração externa).
- **Email (Brevo)**: chave de API do provedor de envio transacional.
- **Pagamento (Stripe)**: chave da conta da plataforma, segredo de verificação de webhook — separado para o billing do Teglion e para o Stripe Connect (dois webhooks distintos, duas variáveis de segredo distintas).
- **Cache e limitação de taxa (Redis)**: string de conexão.
- **Integração Google**: credencial OAuth para Calendar e Drive.
- **Observabilidade**: identificador de projeto do serviço de rastreamento de erro — hoje opcional na inicialização, o que é, em si, um risco documentado em [MONITORING.md](./MONITORING.md).

## O lembrete mais importante

A auditoria de 12/08/2026 encontrou segredos reais de produção — não de teste — presentes em arquivos locais de ambiente, não commitados, mas lidos repetidamente ao longo de sessões de auditoria sem nunca terem sido trocados. É o primeiro item do [Sprint 0](../02-ROADMAP/SPRINT-0.md). A regra daqui para frente é simples: valor de produção nunca deveria estar num ambiente de desenvolvedor. Para desenvolvimento local, usar sempre valor de teste — mesmo que copiar o valor real pareça mais rápido no momento.

## Onde configurar de verdade

Produção usa as variáveis de ambiente configuradas diretamente no painel do Render (backend) e da Vercel (frontend) — não um arquivo. Um `.env.example` existe no repositório, sem valor real, servindo de referência de quais variáveis existem, não de onde os valores de produção vivem.

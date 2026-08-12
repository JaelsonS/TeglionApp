# Segurança

Postura geral do Teglion, verificada em código na auditoria de 12/08/2026 — não presumida. Este documento é a referência principal; [MULTI-TENANT-SECURITY.md](./MULTI-TENANT-SECURITY.md) aprofunda o risco mais importante (isolamento entre escritórios), [SECURITY-GATES.md](./SECURITY-GATES.md) cobre quando cada verificação de segurança realmente roda, e [BACKUPS.md](./BACKUPS.md)/[DISASTER-RECOVERY.md](./DISASTER-RECOVERY.md) cobrem recuperação de desastre.

## O que está bem implementado, com evidência

**CSRF**: proteção double-submit real, com comparação de tempo constante (`timingSafeEqual`) entre cookie e header, aplicada globalmente com uma lista restrita de exceções (rotas públicas e webhooks).

**CORS**: allowlist estrita por ambiente. Em produção, sem wildcard — só origens `https://` explicitamente permitidas.

**Cabeçalhos de segurança**: Helmet no backend; no frontend, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` e CSP com hash `sha256` no `script-src` (não `unsafe-inline`).

**Autenticação**: JWT em cookies `httpOnly`, hash de senha com Argon2id (com migração transparente de hashes antigos), bloqueio de força bruta persistido em banco de dados — independente do Redis, então continua funcionando mesmo se o Redis cair.

**Autorização**: verificação de permissão (`requirePermission`/`requireRole`) aplicada de forma consistente nas rotas de escritório. O papel `CLIENT` não tem nenhuma permissão de gestão de escritório — testado e confirmado.

**Proteção contra acesso cruzado a recurso (IDOR/BOLA)**: em todos os módulos verificados (documentos, tarefas, mensagens, clientes, obrigações, consultas, pedidos de serviço, leads, alertas), toda busca por ID combina o ID do recurso com o `firm_id` do usuário autenticado — nunca confia num ID vindo de fora sem essa checagem. Tentativa de acessar recurso de outro escritório retorna 404 genérico, não um erro que revele que o recurso existe.

**Webhook do Stripe**: assinatura verificada antes de processar qualquer evento, com proteção real contra reprocessamento do mesmo evento (constraint única no banco, não só checagem em memória).

## Riscos residuais reais

**Isolamento entre escritórios depende inteiramente de disciplina de código, não do banco de dados.** O backend acessa o Supabase com uma chave que ignora as políticas de segurança do banco. Isso é detalhado em [MULTI-TENANT-SECURITY.md](./MULTI-TENANT-SECURITY.md) — é o risco mais importante deste documento inteiro.

**Sanitização de log é inconsistente.** Existe uma função que remove informação sensível antes de logar, usada no tratamento central de erro — mas dezenas de chamadas de log espalhadas pelo código não passam por ela.

**Monitoramento de erro é opcional na inicialização.** O sistema sobe em produção mesmo sem a chave de configuração do monitoramento de erro definida — silenciosamente, sem travar o processo, mas também sem avisar ninguém que a proteção não está ativa.

## O que não foi verificado nesta auditoria

Compliance formal (termos de uso, política de privacidade, requisitos legais específicos de Portugal como o Livro de Reclamações) não foi escopo desta rodada de auditoria — não presuma que está adequado só porque não está listado como risco aqui.

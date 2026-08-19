# Autenticação

> **Fontes consolidadas neste documento:** `docs/04-ARQUITETURA/AUTH.md` (removido após esta migração, 19/08/2026). Verificação de código adicional feita nesta reescrita: `backend/src/utils/auth-cookies.js`, `backend/src/modules/auth/login-security.service.js`, `backend/src/utils/password-crypto.js`, `backend/src/config/env.js`, `backend/src/modules/firm/team.service.js`, `backend/src/modules/firm/team.service.test.js`, `.git log` (commits `c9d02e6` e `f1c3121`).

## Por que autenticação própria, não Supabase Auth

Decisão deliberada, não um atalho evitado por falta de tempo: manter controle total sobre o modelo de papel (funcionário do escritório vs. cliente) e sobre o fluxo de convite, que tem regra específica do domínio contábil (convite por e-mail, aceite, vínculo a um escritório específico). Usar o Auth do Supabase teria significado encaixar esse modelo dentro de um sistema de usuários genérico não pensado para multi-tenant com dois tipos de ator.

## Como funciona a sessão — `IMPLEMENTADO`

JWT guardado em cookie `httpOnly` — nunca em `localStorage` — o que reduz a superfície de roubo de token via script malicioso no navegador (XSS não consegue ler o cookie). O cookie é `Secure` em produção e usa `SameSite` configurável por ambiente; o path é restrito a `/api`.

Dois tokens:

- **Acesso**, vida curta — 15 minutos por padrão (`JWT_ACCESS_EXPIRES_IN`, configurável).
- **Renovação (refresh)**, vida mais longa — 7 dias por padrão, 30 dias com "lembrar-me" marcado — com rotação a cada uso.

## Senha — `IMPLEMENTADO`

Hash com Argon2id, o algoritmo mais robusto entre as opções comuns hoje, com migração transparente de hashes antigos em formato mais fraco — o usuário não precisa trocar de senha manualmente para a migração acontecer; ela ocorre no próximo login bem-sucedido.

## Bloqueio de força bruta — `IMPLEMENTADO`

Contagem de tentativas falhas persistida em banco de dados (tabela dedicada, via `login-attempts.repository.js`), não em memória nem no Redis — essa proteção continua funcionando mesmo se o Redis, usado para outras finalidades como limitação geral de taxa, estiver fora do ar. Duas camadas:

- **Atraso progressivo**: cada tentativa falha adiciona um atraso de até 3 segundos antes da resposta, dificultando automação simples.
- **Bloqueio duro**: passado o número máximo de falhas numa janela de tempo, a conta é travada por um período (`429 ACCOUNT_LOCKED`, com `retryAfterSeconds`) — e o evento é registrado na trilha de auditoria de segurança (`security-audit.service.js`).

## Papéis — visão rápida

Dois grandes grupos: usuário do escritório (`firm_user`, com sub-papéis `FIRM_OWNER`, `FIRM_STAFF`, `FIRM_CONSULTANT`) e cliente (`client`, o usuário final atendido pelo escritório). O papel de cliente não tem, em nenhum lugar verificado, acesso a rota exclusiva de gestão do escritório. Modelo completo de papéis e permissões em [`AUTHORIZATION.md`](./AUTHORIZATION.md).

## Proteção de rota — `IMPLEMENTADO`

Toda rota que exige autenticação passa por um middleware que extrai e valida o usuário a partir do cookie antes de qualquer lógica de negócio rodar. Rotas que exigem um papel ou permissão específica usam `requirePermission`/`requireRole` em cima disso, aplicado de forma consistente nas rotas de escritório verificadas.

## Dois gaps que os documentos antigos registravam como abertos — e que já foram corrigidos

Esta seção existe porque a documentação anterior (12/08/2026) descrevia dois riscos reais que, verificados de novo em código nesta reescrita (19/08/2026), **não existem mais**. Registrar isso aqui, com evidência, é mais útil do que apagar silenciosamente a menção — mostra que o problema foi levado a sério e fechado.

### Sessão de funcionário desativado não era revogada — corrigido, `IMPLEMENTADO`

**O problema que existia:** quando o dono de um escritório desativava um membro da equipe, o sistema marcava a pessoa como inativa no banco e parava por aí — o fluxo de renovação de sessão nunca verificava essa marcação, e o refresh token continuava válido, renovando-se indefinidamente.

**A correção, verificada em código:** `deactivateMember` em `backend/src/modules/firm/team.service.js` (linha ~300) agora chama `authRefreshSessionsRepository.deleteAllForActor('firm_user', memberId)` na mesma operação que marca o usuário como inativo — o mesmo padrão já usado para clientes em `revokeClientAccess`. O código traz um comentário explícito referenciando essa correção. Existe teste automatizado cobrindo o cenário (`team.service.test.js`, casos `deactivateMember: revoga todas as sessões de refresh do membro desativado`), executado e confirmado passando durante esta revisão.

**Origem da correção:** commit `c9d02e6` ("fix(sprint-0): fecha 4 dos 7 blockers da auditoria de 12/08/2026"), 13/08/2026 — o próprio Sprint 0 já registrava este item como `✅ Feito` em `docs/historico/SPRINT-0.md`, mas os documentos de arquitetura/segurança (`AUTH.md`, `MULTI-TENANT-SECURITY.md`) nunca foram atualizados para refletir isso. Essa é exatamente a falha de manutenção de documentação que esta reestruturação tenta resolver.

### Escalação de STAFF a FIRM_OWNER (SEC-H1) — corrigido, `IMPLEMENTADO`

Ver detalhe completo, com evidência de teste, em [`AUTHORIZATION.md`](./AUTHORIZATION.md#sec-h1--escalação-de-staff-a-firm_owner). Resumo: também foi corrigido no mesmo commit de 13/08, com guarda explícita no serviço de equipe e 8 testes automatizados dedicados.

## O que não foi verificado nesta revisão

Fluxo de recuperação de senha (reset por e-mail) não foi reauditado em detalhe nesta rodada — os tokens (`password_reset_tokens`, `email_confirmation_tokens`) aparecem classificados como "token lifecycle (seguro)" na varredura estática de isolamento (ver `SECURITY_TESTING.md`), mas isso é uma checagem automática de padrão, não um teste funcional completo do fluxo. Autenticação via Google OAuth (login social) não é coberta neste documento — ver [`docs/architecture/INTEGRATIONS.md`](../architecture/INTEGRATIONS.md) para o que existe de integração Google; o gate de segurança (`SECURITY_TESTING.md`) trata OAuth do calendário, não login social geral.

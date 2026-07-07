# Execução de Roles e Telas — Plano de Entrega

Este é o meu plano para avançar rápido sem fragilizar o produto.

## Objetivo

Eu quero que cada role tenha telas claras, permissões consistentes e comportamento previsível.

## Roles alvo

- FIRM_OWNER
- FIRM_STAFF
- FIRM_CONSULTANT
- CLIENT

## Regra estrutural

1. Toda rota API autenticada tem verificação explícita de permissão.
2. Toda tela escondida no frontend também é bloqueada no backend.
3. Nenhuma permissão é inferida só por UI.

## Matriz mínima por role

### FIRM_OWNER

- Acesso total do escritório.
- Pode gerir equipa, permissões, billing e settings.

### FIRM_STAFF

- Acesso operacional diário.
- Sem poderes críticos de billing e gestão global de equipa.

### FIRM_CONSULTANT

- Acesso restrito a carteira atribuída.
- Sem ações globais do escritório.

### CLIENT

- Acesso exclusivo ao próprio portal e dados próprios.

## Execução por blocos

## Bloco 1 — Segurança de autorização

1. Revisar endpoints por módulo e mapear permissão exigida.
2. Cobrir lacunas com middleware de autorização.
3. Adicionar teste de negação por role em rotas críticas.

## Bloco 2 — Telas do escritório

1. Firm Dashboard: widgets por role.
2. Clientes/Hub: bloquear ações de gestão para role sem permissão.
3. Documentos/Tarefas/Obrigações: botão e ação com a mesma regra de permissão.
4. Settings/Team/Billing: visibilidade e acesso exclusivos do owner.

## Bloco 3 — Telas do cliente

1. Garantir isolamento completo por client e firm.
2. Rever requests, documentos, mensagens e obrigações em modo estrito.
3. Validar deep-links com bloqueio robusto em API.

## Bloco 4 — Qualidade e robustez

1. Criar checklist por tela com cenários allow/deny.
2. Incluir testes E2E mínimos por role crítica.
3. Medir regressão em release readiness.

## Critérios de pronto por tela

Eu só marco uma tela como pronta quando:

1. Role permitida executa ação com sucesso.
2. Role não permitida recebe erro consistente (401/403/404 conforme contrato).
3. UI não exibe ação indevida.
4. Teste automático cobre pelo menos um cenário de bloqueio.

## Ordem prática de implementação

1. Team e Permissions
2. Billing e Settings
3. Dashboard e Clientes
4. Documentos e Tarefas
5. Portal Cliente (revisão final de isolamento)

## Entrega semanal

Toda semana eu fecho:

1. Mapa de permissões atualizado.
2. Telas revisadas por bloco.
3. Evidência de teste automático.
4. Nota de release com impacto e rollback.

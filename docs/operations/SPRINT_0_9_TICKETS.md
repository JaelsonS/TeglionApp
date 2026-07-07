# TegLion - Sprint 0.9: Backlog tecnico por tickets

**Status:** backlog tecnico para execucao faseada, sem implementacao de codigo
**Data:** 06 Jul 2026
**Base oficial:** [SPRINT_0_9_GESTAO_EQUIPAS.md](SPRINT_0_9_GESTAO_EQUIPAS.md)

Este documento transforma a Sprint 0.9 em tickets pequenos, independentes e revisaveis. A regra principal e simples: cada ticket deve poder ser implementado, testado e validado antes do proximo, sem exigir uma grande reestrutura em varios modulos ao mesmo tempo.

## Regras comuns a todos os tickets

- Reutilizar sempre que possivel a base herdada do SaaSude/TegLion.
- Preservar compatibilidade total com clientes ja cadastrados.
- Evitar alterar schema, auth e UI ao mesmo tempo sem necessidade.
- Manter RLS, guards e audit trail como defesa em profundidade.
- Cada ticket deve terminar com uma validacao objetiva: teste automatizado, verificacao manual ou ambos.
- Nenhum ticket deve depender de uma migracao ampla espalhada por muitos modulos.

## Ticket 1 - Tela Gestao de Funcionarios (somente listagem)

**Objetivo**

Disponibilizar a primeira tela de Gestao de Funcionarios em modo apenas leitura, mostrando a equipa atual sem permitir alteracoes.

**Motivacao**

Este e o menor corte funcional para validar a base da funcionalidade de equipa, reaproveitando o bundle de settings e a lista ja existente de membros.

**Escopo**

- Exibir lista de funcionarios.
- Exibir nome, e-mail, role e estado basico.
- Manter o comportamento somente leitura.
- Tratar estados vazios e erro de carregamento.
- Preservar o layout atual de settings.

**Arquivos que serao alterados**

- frontend/src/features/firm/pages/FirmSettingsPage.tsx
- frontend/src/features/firm/settings/FirmSettingsTeamSection.tsx
- frontend/src/shared/types/firmSettings.ts
- frontend/src/infrastructure/api/contabil/firmSettings.ts, se o bundle precisar de algum campo adicional.

**Arquivos reutilizados**

- frontend/src/shared/types/firmSettings.ts
- frontend/src/infrastructure/api/contabil/firmSettings.ts
- frontend/src/features/firm/settings/FirmSettingsTeamSection.tsx
- frontend/src/features/firm/pages/FirmSettingsPage.tsx

**Dependencias**

- Nenhuma dependencia nova de backend.
- Apenas a estrutura atual de settings e o bundle de equipa.

**Riscos**

- Expor dados a mais do que o necessario.
- Reforcar uma tela read-only com tecnicas que dificultem a evolucao para edicao posterior.

**Critrios de aceite**

- A pagina abre e mostra a equipa atual.
- Nao existem botoes de criar, editar ou convidar.
- Um utilizador autorizado consegue ver a lista.
- Um utilizador nao autorizado continua bloqueado pelos guards existentes.

**Estratgia de rollback**

- Reverter apenas as alteracoes de UI.
- Sem impacto em schema, auth ou permissoes.

**Testes obrigatorios**

- Teste de renderizacao do componente de lista.
- Verificacao manual da pagina com um owner ou staff autorizado.
- Confirmacao de que nao foi alterado o contrato da API.

**Complexidade**

- Baixa

## Ticket 2 - Criar Funcionario

**Objetivo**

Permitir criar um funcionario como registo de equipa, com dados basicos e role inicial.

**Motivacao**

A criacao e a primeira mutacao real do modulo. Ela precisa nascer pequena para nao misturar convite, permissao e onboarding no mesmo passo.

**Escopo**

- Criar endpoint de criacao de membro.
- Validar duplicidade de e-mail.
- Definir role inicial.
- Registar o evento em audit log.
- Mostrar formulario simples na UI.

**Arquivos que serao alterados**

- backend/src/routes/contabil/firm-domain.routes.js
- backend/src/modules/firm/firm-settings.service.js, se a logica ficar agregada ao modulo atual.
- backend/src/modules/firm/firm-team.service.js, se for melhor extrair um service novo.
- backend/src/db/supabase/repositories/firm-users.repository.js
- frontend/src/features/firm/settings/FirmSettingsTeamSection.tsx, para acionar a acao de criacao.
- frontend/src/features/firm/components/FirmTeamCreateDialog.tsx, se a UI nova for isolada.

**Arquivos reutilizados**

- backend/src/utils/permissions.js
- backend/src/middlewares/role.middleware.js
- backend/src/services/audit/security-audit.service.js
- backend/src/db/supabase/repositories/firm-users.repository.js
- frontend/src/shared/types/firmSettings.ts

**Dependencias**

- Ticket 1 para validar a area de equipa.
- Ticket 7 para estabilizar o modelo de roles, se a criacao precisar do seletor final de papel.

**Riscos**

- Criar duplicados por e-mail.
- Introduzir estados inconsistentes entre membro, convite e sessao.
- Vazamento de dados entre tenants se a validacao de contexto falhar.

**Critrios de aceite**

- Um utilizador com permissao consegue criar um funcionario.
- Um e-mail duplicado e bloqueado.
- A lista reflete o novo membro apos refresh.
- O evento de auditoria e gravado.

**Estratgia de rollback**

- Desativar a rota e a acao de UI.
- Se existir service novo, mantelo isolado para remocao posterior sem afetar o resto do modulo.

**Testes obrigatorios**

- Teste de validacao do payload.
- Teste de autorizacao.
- Teste de insercao no repository.
- Verificacao manual do fluxo criar -> listar.

**Complexidade**

- Media

## Ticket 3 - Editar Funcionario

**Objetivo**

Permitir editar dados basicos do funcionario, incluindo nome, role, departamento e estado ativo.

**Motivacao**

A edicao fecha o ciclo minimo de manutencao de um membro. Sem isso, a equipa fica presa a recriar registros para qualquer alteracao.

**Escopo**

- Atualizar dados de perfil do membro.
- Permitir alterar role dentro das regras aceitas.
- Preparar o campo de departamento para uso futuro ou imediato.
- Permitir ativar/desativar membro quando aplicavel.
- Auditar toda a mutacao.

**Arquivos que serao alterados**

- backend/src/routes/contabil/firm-domain.routes.js
- backend/src/modules/firm/firm-settings.service.js ou backend/src/modules/firm/firm-team.service.js
- backend/src/db/supabase/repositories/firm-users.repository.js
- frontend/src/features/firm/settings/FirmSettingsTeamSection.tsx
- frontend/src/features/firm/components/FirmTeamEditDialog.tsx, se a UI nova ficar isolada.
- frontend/src/shared/types/firmSettings.ts

**Arquivos reutilizados**

- backend/src/utils/permissions.js
- backend/src/middlewares/role.middleware.js
- backend/src/services/audit/security-audit.service.js
- backend/src/db/supabase/repositories/firm-users.repository.js
- frontend/src/features/firm/pages/FirmSettingsPage.tsx

**Dependencias**

- Ticket 2, se a edicao for acoplada a membros ja existentes.
- Ticket 7, para o conjunto final de roles.
- Ticket 9, se o departamento ja fizer parte da edicao.

**Riscos**

- Permitir alteracao indevida de owner ou papel sensivel.
- Quebrar a referencia atual de permissao ao trocar a role.
- Deixar o formulario inconsistente com o backend.

**Critrios de aceite**

- A edicao salva e persiste.
- O valor alterado aparece na lista e no bundle.
- Alteracoes sensiveis ficam registradas em audit.
- O sistema impede mudancas proibidas, como auto-escalonamento indevido.

**Estratgia de rollback**

- Reverter a rota e a UI de edicao.
- Manter os dados existentes sem transformacoes irreversiveis.

**Testes obrigatorios**

- Teste de patch de membro.
- Teste de autorizacao para roles diferentes.
- Teste de UI do formulario de edicao.

**Complexidade**

- Media

## Ticket 4 - Convite

**Objetivo**

Permitir enviar, reenviar e revogar convites de funcionarios usando o padrao ja existente de convite e expiracao.

**Motivacao**

O convite e o ponto de entrada do onboarding. Reaproveitar o padrao de cliente reduz risco e evita criar uma segunda logica de token desnecessaria.

**Escopo**

- Criar convite de funcionario.
- Reenviar convite pendente.
- Revogar convite antes da aceitacao.
- Exibir estado do convite na UI.
- Enviar notificacao com o fluxo atual de e-mail.

**Arquivos que serao alterados**

- backend/src/modules/firm/invites.service.js
- backend/src/db/supabase/repositories/invites.repository.js
- backend/src/routes/contabil/firm-domain.routes.js
- backend/src/services/notifications/contabil-notifications.service.js, se a notificacao precisar de um novo tipo.
- frontend/src/features/firm/components/FirmTeamInviteDialog.tsx, se a UI nova for isolada.
- frontend/src/features/firm/settings/FirmSettingsTeamSection.tsx

**Arquivos reutilizados**

- backend/src/modules/firm/invites.service.js
- backend/src/db/supabase/repositories/invites.repository.js
- backend/src/services/email/brevo-email.service.js
- backend/src/services/audit/security-audit.service.js
- frontend/src/features/firm/components/FirmClientInviteButton.tsx, como referencia de UX.

**Dependencias**

- Ticket 2, porque o convite faz mais sentido sobre um membro criado ou predefinido.
- Ticket 5 e Ticket 6, porque o token de convite alimenta a confirmacao e o primeiro acesso.

**Riscos**

- Confundir convite de cliente com convite de funcionario.
- Reutilizar token de forma errada.
- Entregar e-mail com conteudo ou links inconsistentes.

**Critrios de aceite**

- O convite e criado e aparece no estado correto.
- O resend gera novo envio ou nova expiracao conforme a regra definida.
- Revogar invalida o acesso futuro.
- Todas as acoes ficam auditadas.

**Estratgia de rollback**

- Desligar as acoes de convite sem apagar membros ja criados.
- Tokens antigos expiram naturalmente.

**Testes obrigatorios**

- Teste de criacao de convite.
- Teste de revogacao.
- Teste de envio de notificacao em ambiente controlado.
- Verificacao manual do estado do membro apos o convite.

**Complexidade**

- Media

## Ticket 5 - Confirmacao de e-mail

**Objetivo**

Criar o fluxo de confirmacao do e-mail a partir do convite para garantir que o endereco pertence ao funcionario convidado.

**Motivacao**

A confirmacao de e-mail e o primeiro checkpoint de seguranca do onboarding. Ela reduz erro humano e evita que o primeiro acesso aconteca com um contacto invalido.

**Escopo**

- Ler token de convite.
- Mostrar estado do convite.
- Confirmar o e-mail do utilizador.
- Tratar expirado, revogado e ja utilizado.
- Encaminhar para o passo seguinte do onboarding.

**Arquivos que serao alterados**

- backend/src/modules/auth/contabil-auth.service.js, se o fluxo reutilizar a camada existente.
- backend/src/routes/contabil-auth.routes.js
- backend/src/modules/firm/invites.service.js, se a validacao do token ficar concentrada aqui.
- frontend/src/features/auth/pages/TeamInviteConfirmationPage.tsx, se for criado um fluxo dedicado.
- frontend/src/features/auth/pages/ClientInviteRegisterPage.tsx, se a mesma pagina puder ser generalizada.

**Arquivos reutilizados**

- backend/src/modules/auth/contabil-auth.service.js
- backend/src/modules/firm/invites.service.js
- backend/src/db/supabase/repositories/invites.repository.js
- frontend/src/features/auth/pages/ClientInviteRegisterPage.tsx, como referencia de UX e validacao.

**Dependencias**

- Ticket 4, pois depende do convite emitido.

**Riscos**

- Reutilizar o mesmo endpoint de cliente sem separar claramente o contexto de funcionario.
- Aceitar token expirado ou revogado.
- Gerar confusao entre confirmacao de e-mail e definicao de senha.

**Critrios de aceite**

- Token valido confirma o e-mail corretamente.
- Token invalido ou expirado e bloqueado.
- O utilizador recebe orientacao clara para o proximo passo.

**Estratgia de rollback**

- Desativar o route handler dedicado.
- Manter os convites existentes intactos.

**Testes obrigatorios**

- Teste de token valido.
- Teste de token expirado.
- Teste de token revogado.
- Verificacao manual do caminho ate a pagina de onboarding.

**Complexidade**

- Media

## Ticket 6 - Primeiro acesso

**Objetivo**

Finalizar o primeiro acesso do funcionario, permitindo criar senha e entrar no sistema com sessao valida.

**Motivacao**

Sem este passo o fluxo fica incompleto. O usuario confirma o e-mail, mas ainda nao entra na plataforma como membro ativo.

**Escopo**

- Definir senha inicial.
- Finalizar onboarding.
- Criar sessao autenticada.
- Garantir refresh e logout coerentes.
- Auditar o primeiro acesso.

**Arquivos que serao alterados**

- backend/src/modules/auth/contabil-auth.service.js
- backend/src/routes/contabil-auth.routes.js
- backend/src/utils/password-crypto.js, se houver reutilizacao ou validacao extra.
- frontend/src/features/auth/pages/FirstAccessPage.tsx, se a pagina for separada.
- frontend/src/features/auth/pages/TeamInviteConfirmationPage.tsx, se a transicao ficar integrada.

**Arquivos reutilizados**

- backend/src/modules/auth/contabil-auth.service.js
- backend/src/middlewares/auth.middleware.js
- backend/src/services/audit/security-audit.service.js
- backend/src/utils/session-user.js
- frontend/src/features/auth/pages/ClientInviteRegisterPage.tsx, como referencia de primeiro acesso.

**Dependencias**

- Ticket 5.
- O fluxo atual de refresh e login.

**Riscos**

- Criar um fail-open no primeiro acesso.
- Permitir acesso sem sessao devidamente emitida.
- Duplicar regras ja existentes no login.

**Critrios de aceite**

- O usuario define senha e entra na aplicacao.
- A sessao e criada e renovada corretamente.
- O acesso nao quebra o fluxo atual de login/logout.
- O evento fica auditado.

**Estratgia de rollback**

- Desativar a pagina ou endpoint novo sem mexer no login principal.
- Manter os tokens antigos a expirar naturalmente.

**Testes obrigatorios**

- Teste de definicao de senha.
- Teste de emissao de sessao.
- Teste de login subsequente.
- E2E do fluxo convite -> confirmacao -> primeiro acesso.

**Complexidade**

- Alta

## Ticket 7 - Roles

**Objetivo**

Consolidar o modelo de roles para equipa, reduzindo ambiguidade entre papel, acesso e nome legivel.

**Motivacao**

Sem um mapa canonico de roles, a equipa fica sujeita a labels legadas e regras diferentes entre frontend, backend e banco.

**Escopo**

- Definir roles canonicas.
- Normalizar labels legadas.
- Ajustar exibicao de roles no frontend.
- Garantir que a criacao e a edicao usam o mesmo enum.
- Preservar compatibilidade com usuarios antigos.

**Arquivos que serao alterados**

- backend/src/utils/permissions.js
- backend/src/db/supabase/repositories/firm-users.repository.js
- frontend/src/shared/constants/contabilRoles.ts
- frontend/src/shared/types/firmSettings.ts
- frontend/src/shared/utils/authNormalize.ts

**Arquivos reutilizados**

- backend/src/utils/permissions.js
- backend/src/db/supabase/repositories/firm-users.repository.js
- frontend/src/shared/constants/contabilRoles.ts
- frontend/src/shared/utils/authNormalize.ts

**Dependencias**

- Nenhuma dependencia estrutural nova.
- Idealmente antes de Tickets 2, 3, 8 e 9.

**Riscos**

- Quebrar compatibilidade com roles legadas como FIRM_CONSULTANT.
- Divergencia entre valor persistido e label exibida.

**Critrios de aceite**

- A mesma role e exibida igual em toda a aplicacao.
- Users antigos continuam autenticando sem perda de acesso.
- A tabela de roles nao cria novos significados sem necessidade.

**Estratgia de rollback**

- Restaurar o mapeamento anterior de roles.
- Manter o valor antigo no banco e apenas reverter a camada de exibicao.

**Testes obrigatorios**

- Teste do mapeamento de roles.
- Teste de normalize de auth.
- Teste de exibicao nas telas de settings e listagem.

**Complexidade**

- Media

## Ticket 8 - Permissoes

**Objetivo**

Formalizar a matriz de permissoes da equipa e aplicar enforcement consistente em rotas e guards.

**Motivacao**

As permissoes sao o centro da seguranca do modulo. Elas precisam ficar fechadas antes de abrir edicao ampla de membros, convites e departamentos.

**Escopo**

- Centralizar matriz de permissoes.
- Garantir enforcement por role.
- Expor capabilities coerentes no frontend, se necessario.
- Revisar guards existentes para a nova matriz.
- Preservar o fail-closed.

**Arquivos que serao alterados**

- backend/src/utils/permissions.js
- backend/src/middlewares/role.middleware.js
- backend/src/routes/contabil/firm-domain.routes.js
- backend/src/middlewares/firm-owner.middleware.js, se algum caso precisar ser refinado.
- frontend/src/shared/types/firmSettings.ts, se capabilities adicionais forem expostas.

**Arquivos reutilizados**

- backend/src/utils/permissions.js
- backend/src/middlewares/role.middleware.js
- backend/src/middlewares/firm-owner.middleware.js
- frontend/src/shared/components/layout/ProtectedRoute.tsx
- frontend/src/shared/components/layout/RequireRole.tsx
- frontend/src/shared/components/layout/RequireFirmAccess.tsx

**Dependencias**

- Ticket 7.
- Tickets 2, 3 e 4, para validar as acoes protegidas.

**Riscos**

- Bloquear indevidamente owners ou admins.
- Permitir um caminho de escrita sem guard.
- Introduzir inconsistencias entre backend e frontend.

**Critrios de aceite**

- Cada acao de equipa responde com 403 quando nao permitida.
- O owner continua com acesso total apenas nos fluxos previstos.
- A matriz cobre as acoes principais sem abrir brechas.

**Estratgia de rollback**

- Reverter a matriz e os guards modificados.
- Manter os endpoints existentes para o restante do sistema.

**Testes obrigatorios**

- Testes unitarios da matriz.
- Testes de autorizacao por rota.
- Verificacao manual com perfis diferentes.

**Complexidade**

- Alta

## Ticket 9 - Departamentos

**Objetivo**

Criar e manter departamentos como entidade organizacional separada da role.

**Motivacao**

Departamento nao e permissao. Separar as duas coisas reduz confusao de negocio e evita que o organograma vire uma matriz de acesso disfarcada.

**Escopo**

- Criar tabela e repository de departamentos.
- Listar departamentos da empresa.
- Criar, editar e remover departamentos.
- Associar funcionario a um departamento.
- Permitir membros sem departamento quando necessario.

**Arquivos que serao alterados**

- backend/src/db/supabase/repositories/departments.repository.js, novo arquivo.
- backend/src/modules/firm/departments.service.js, novo arquivo, se houver service dedicado.
- backend/src/modules/firm/departments.controller.js, novo arquivo, se houver controller dedicado.
- backend/src/routes/contabil/firm-domain.routes.js
- supabase/tables.sql
- supabase/rls.sql
- supabase/policies.sql
- frontend/src/features/firm/components/FirmTeamEditDialog.tsx ou um componente de selecao de departamento.
- frontend/src/shared/types/firmSettings.ts

**Arquivos reutilizados**

- backend/src/utils/permissions.js
- backend/src/middlewares/role.middleware.js
- backend/src/services/audit/security-audit.service.js
- backend/src/db/supabase/repositories/firm-users.repository.js
- frontend/src/features/firm/settings/FirmSettingsTeamSection.tsx

**Dependencias**

- Ticket 7, para separar papel de area interna.
- Tickets 2 e 3, se a atribuicao de departamento ja entrar no formulario de membro.

**Riscos**

- Migracao de schema afetar usuarios antigos sem departamento.
- Remocao de departamento com membros ativos.
- Null references em listas, filtros e formularios.

**Critrios de aceite**

- Um departamento pode ser criado e listado.
- Um funcionario pode ser associado a um departamento.
- Membros antigos sem departamento continuam a carregar sem erro.
- A exclusao e bloqueada ou tratada com regra segura quando houver membros vinculados.

**Estratgia de rollback**

- Manter a coluna nullable e esconder a UI se necessario.
- Reverter apenas a migracao nova e o repository dedicado, sem mexer no restante da equipa.

**Testes obrigatorios**

- Teste de migracao e repository.
- Teste de autorizacao.
- Verificacao manual de listagem e edicao com e sem departamento.

**Complexidade**

- Alta

## Ticket 10 - Auditoria

**Objetivo**

Padronizar e expandir a auditoria de toda a gestao de equipa.

**Motivacao**

A auditoria nao deve ser apenas um append final. Ela e a prova de seguranca do modulo e precisa cobrir criacao, edicao, convite, permissao e departamento.

**Escopo**

- Normalizar nomes de eventos de equipa.
- Garantir payload estruturado e minimo necessario.
- Gravar acao, actor, alvo e contexto do tenant.
- Rever consultas ou telas de auditoria, se existirem.
- Evitar dados sensiveis desnecessarios no log.

**Arquivos que serao alterados**

- backend/src/services/audit/security-audit.service.js
- backend/src/modules/firm/firm-settings.service.js, se ainda emitir eventos de settings relacionados.
- backend/src/modules/firm/invites.service.js
- backend/src/modules/auth/contabil-auth.service.js
- backend/src/modules/firm/departments.service.js, se existir.
- backend/src/modules/firm/firm-team.service.js, se existir.
- frontend/src/features/firm/pages/FirmSettingsPage.tsx, apenas se a tela de auditoria ficar acoplada a settings.

**Arquivos reutilizados**

- backend/src/services/audit/security-audit.service.js
- backend/src/db/supabase/repositories/audit.repository.js
- backend/src/modules/auth/contabil-auth.service.js
- backend/src/modules/firm/invites.service.js

**Dependencias**

- Tickets 2, 3, 4, 5, 6, 8 e 9, porque os eventos de auditoria precisam refletir os fluxos reais.

**Riscos**

- Excesso de ruido no log.
- Vazamento de informacao sensivel no payload.
- Perda de consistencia entre acao executada e evento registado.

**Critrios de aceite**

- Cada acao relevante da equipa gera evento de auditoria.
- O payload e util para analise forense sem expor dados desnecessarios.
- Os eventos continuam compativeis com a infra atual de audit.

**Estratgia de rollback**

- Reverter apenas os novos tipos de eventos.
- Manter os eventos ja usados pelo sistema atual.

**Testes obrigatorios**

- Testes do service de audit.
- Verificacao de cada fluxo de mutacao com confirmacao do registro.
- Revisao manual de payloads para nao incluir informacao sensivel demais.

**Complexidade**

- Media

## Ordem ideal de implementacao

A ordem abaixo reduz risco e evita que varios modulos mudem ao mesmo tempo.

1. Ticket 1 - Tela Gestao de Funcionarios (somente listagem)
2. Ticket 7 - Roles
3. Ticket 8 - Permissoes
4. Ticket 9 - Departamentos
5. Ticket 2 - Criar Funcionario
6. Ticket 3 - Editar Funcionario
7. Ticket 4 - Convite
8. Ticket 5 - Confirmacao de e-mail
9. Ticket 6 - Primeiro acesso
10. Ticket 10 - Auditoria

## Observacao final

A ordem acima privilegia validacao incremental: primeiro a leitura da equipa, depois o modelo de acesso e organizacao, depois as mutacoes, depois o onboarding e, por fim, a auditoria completa.

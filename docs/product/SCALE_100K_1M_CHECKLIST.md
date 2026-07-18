# TegLion — Checklist Mestre 100k → 1M

**Documento executivo oficial**
**Última actualização:** Julho 2026
**Baseado em:** [ROADMAP.md](./ROADMAP.md), [ARCHITECTURE.md](../engineering/ARCHITECTURE.md), [STATUS.md](../operations/STATUS.md)

Este documento traduz a visão do TegLion para um plano executável, com **400 checkpoints** ordenados por prioridade e por fase.

## Como usar

- `P0`: obrigatório e urgente para reduzir risco, suportar produção e preparar escala.
- `P1`: alto impacto e deve entrar logo após os blocos críticos.
- `P2`: importante para robustez, eficiência e diferenciação.
- `P3`: expansão futura, enterprise, moat e optimizações avançadas.

## Meta de saída

Quando os 400 itens abaixo estiverem concluídos, o TegLion deverá estar:

- operacionalmente pronto para **100 mil utilizadores**;
- arquitecturalmente preparado para expansão rumo a **1 milhão de utilizadores**;
- alinhado com segurança moderna, defesa em profundidade e práticas **OWASP**;
- com UX/UI clara para escritórios de contabilidade e clientes finais;
- com base limpa para operações, crescimento comercial e evolução internacional.

---

## Fase 0 — Urgente: Produção estável e segura

> **Auditoria de status (18/Jul/2026):** revisão linha-a-linha do código, CI e `docs/`
> para separar o que está de facto implementado/enforced do que é só aspiração
> neste documento. `[x]` = feito e com enforcement real (código/CI). Itens sem
> `[x]` ficam com uma nota "Status real" a dizer exactamente o que falta —
> evitar o falso positivo de "documentado" == "implementado".

- [ ] `F0-01 [P0]` Tornar staging obrigatório antes de qualquer deploy para produção.
  - Status real: **PARCIAL**. Processo documentado (`docs/operations/DEPLOY_STAGING.md`, `BRANCHING.md`), mas nada no CI/branch rules bloqueia deploy para `main` sem passar por `staging` primeiro.
- [ ] `F0-02 [P0]` Proteger `main` com branch rules, CI obrigatório e review obrigatório.
  - Status real: **PARCIAL**. CI corre em PR/push (`.github/workflows/ci.yml`), mas não há `CODEOWNERS` no repo e as branch rules do GitHub não são versionadas/verificáveis aqui — falta confirmar manualmente nas settings do repositório.
- [ ] `F0-03 [P0]` Garantir ambientes totalmente isolados para `local`, `staging` e `produção`.
  - Status real: **PARCIAL**. Isolamento documentado, mas sem `.env.staging.example` no repo nem confirmação versionada de projecto Supabase de staging separado do de produção.
- [ ] `F0-04 [P0]` Automatizar backup diário e validar restauração real de base de dados.
  - Status real: **NÃO FEITO**. Só recomendação em `docs/operations/STORAGE.md` ("activar backups no Supabase"); sem script/cron de backup e sem teste de restore documentado.
- [ ] `F0-05 [P0]` Formalizar runbook de rollback de frontend, backend e migrations.
  - Status real: **PARCIAL**. Existe secção de rollback em `DEPLOY_PRODUCTION.md`/`SECURITY.md`, mas migrations são só "forward-only" (sem plano de rollback de schema) e não há registo de um drill de rollback executado.
- [ ] `F0-06 [P0]` Tornar `release:readiness` gate obrigatório antes de merge para `main`.
  - Status real: **PARCIAL**. Script existe (`tools/ci/release-readiness.mjs`, `npm run release:readiness`), mas **não corre no `.github/workflows/ci.yml`** — não bloqueia merge.
- [ ] `F0-07 [P0]` Tornar `tenant isolation` obrigatório em CI e schedule diário/semanal.
  - Status real: **PARCIAL**. `backend/scripts/tenant-isolation-test.js` existe e roda localmente (`npm run test:tenant-isolation`), mas não está no CI nem tem workflow com `schedule:` (cron).
- [ ] `F0-08 [P0]` Activar rate limits com Redis sem modo fail-open em produção final.
  - Status real: **PARCIAL**. Redis store implementado (`backend/src/utils/rate-limit-store.js`), mas ainda tem fallback fail-open (`failOpenRedisResponse`) quando Redis está indisponível — por design, para não derrubar o produto, mas contraria o item literal do checklist.
- [ ] `F0-09 [P0]` Colocar WAF na borda com regras OWASP e proteção anti-bot.
  - Status real: **NÃO FEITO**. Sem configuração de WAF/Cloudflare no repo; só menção como "planeado" em `SECURITY.md`.
- [ ] `F0-10 [P0]` Centralizar gestão de segredos com rotação periódica documentada.
  - Status real: **PARCIAL**. Segredos via GitHub Environments + scan de secrets no CI (`tools/ci/secret-scan.mjs`), mas sem política/calendário de rotação operacionalizado.
- [ ] `F0-11 [P0]` Medir uptime real com monitorização externa e alertas imediatos.
  - Status real: **NÃO FEITO**. Sem integração com UptimeRobot/Better Stack/etc.
- [ ] `F0-12 [P0]` Validar CSP, HSTS, secure cookies, SameSite e headers de segurança.
  - Status real: **PARCIAL**. Helmet + CSP configurados no backend e headers no `frontend/vercel.json`, cookies `secure`/`sameSite` correctos — mas CSP ainda com `'unsafe-inline'` residual (ver `SECURITY.md`).
- [x] `F0-13 [P0]` Implementar healthchecks por dependência crítica, não apenas health geral.
  - Evidência: `/health` com ping à DB + `/api/public/health/integrations` a verificar Redis/Stripe/Brevo/Storage individualmente.
- [x] `F0-14 [P0]` Garantir auditoria de login, reset, convite e alterações sensíveis.
  - Evidência: `security-audit.service.js`, `login-attempts.repository.js`, eventos `team.invite.*`, tabela `audit_logs`.
- [x] `F0-15 [P0]` Formalizar política de incidentes com severidade P0/P1/P2/P3.
  - Evidência: `docs/security/SECURITY.md` (tabela de severidade) + `docs/operations/INCIDENT_RUNBOOK.md`.
- [ ] `F0-16 [P0]` Criar baseline de performance e erro para produção actual.
  - Status real: **PARCIAL**. Sentry FE/BE + `request-timing.middleware.js` + `benchmark-dashboard.js` existem, mas falta um baseline formal com números-alvo registados.
- [ ] `F0-17 [P0]` Definir SLO inicial de API, login, upload e listagens críticas.
  - Status real: **NÃO FEITO**. Só metas genéricas em `ROADMAP.md`/`PERFORMANCE_CHARTER.md`, sem números e *owners* definidos.
- [ ] `F0-18 [P0]` Adicionar alertas para crescimento anormal de storage e queries lentas.
  - Status real: **NÃO FEITO**. Existe apenas log de slow request (`SLOW_REQUEST_MS`); sem alerta de storage nem de queries lentas na DB.
- [ ] `F0-19 [P0]` Documentar dependências de terceiros e plano de contingência por serviço.
  - Status real: **PARCIAL**. Stack de terceiros documentada (`STATUS.md`, `ARCHITECTURE.md`), mas sem plano de contingência/failover por fornecedor.
- [ ] `F0-20 [P0]` Garantir que todo endpoint sensível exige scoping de `firmId` no backend.
  - Status real: **PARCIAL**. `requireUserFirmId` usado consistentemente (~22 módulos) e `docs/security/TENANT_ISOLATION_REPORT.md` existe, mas o relatório está "aprovado com avisos" e o teste de isolamento não é obrigatório em CI (ver F0-07).
- [ ] `F0-21 [P0]` Executar pentest externo e corrigir findings críticos antes de expansão forte.
  - Status real: **NÃO FEITO**.
- [ ] `F0-22 [P0]` Implementar dashboards executivos de produção para fundadores e engenharia.
  - Status real: **NÃO FEITO**. Só dashboards de produto (para clientes), nenhum dashboard de operação/SRE.
- [ ] `F0-23 [P0]` Criar checklist pós-deploy de produção com smoke automatizado e manual.
  - Status real: **PARCIAL**. `smoke:pilot`, `production-smoke-manual.js` e `GO_LIVE_CHECKLIST.md` existem, mas o smoke pós-deploy não corre automaticamente no pipeline de produção.
- [ ] `F0-24 [P0]` Criar política de freeze para deploys em janelas fiscais críticas.
  - Status real: **NÃO FEITO**.
- [x] `F0-25 [P0]` Fechar gaps de logging estruturado para correlação fim-a-fim por request.
  - Evidência: `request-context.middleware.js` (`X-Request-Id`) + logger estruturado (Winston JSON) + morgan com request-id.

## Fase 1 — Clareza de UX do escritório

- [ ] `F1-01 [P0]` Redesenhar copy principal do dashboard para linguagem de contadora, não técnica.
- [ ] `F1-02 [P0]` Mostrar 3 prioridades do dia no topo do dashboard.
- [ ] `F1-03 [P0]` Criar visão “o que vence hoje / amanhã / esta semana”.
- [ ] `F1-04 [P0]` Destacar estados críticos com linguagem clara e ação recomendada.
- [ ] `F1-05 [P0]` Padronizar botões primários, secundários e perigosos em todo o app.
- [ ] `F1-06 [P0]` Unificar espaçamentos, tipografia e hierarchy visual do painel.
- [ ] `F1-07 [P0]` Reduzir densidade excessiva em páginas com tabelas e filtros.
- [ ] `F1-08 [P0]` Criar empty states úteis com explicação e call to action.
- [ ] `F1-09 [P0]` Criar skeleton loaders consistentes para rotas críticas.
- [ ] `F1-10 [P0]` Melhorar navegação “Mais” para evitar descoberta escondida de módulos.
- [ ] `F1-11 [P1]` Criar pesquisa global com atalhos por cliente, documento e obrigação.
- [ ] `F1-12 [P1]` Permitir filtros salvos por utilizador para tarefas e documentos.
- [ ] `F1-13 [P1]` Criar centro pessoal “meu trabalho” para cada colaborador.
- [ ] `F1-14 [P1]` Criar assistente de onboarding do escritório em 3 a 5 passos.
- [ ] `F1-15 [P1]` Guiar primeira activação: cliente, pedido, documento, tarefa, obrigação.
- [ ] `F1-16 [P1]` Explicar conceitos fiscais complexos com labels simples e tooltips úteis.
- [ ] `F1-17 [P1]` Rever acessibilidade WCAG AA em páginas de maior uso diário.
- [ ] `F1-18 [P1]` Criar breadcrumb contextual em páginas profundas.
- [ ] `F1-19 [P1]` Introduzir padrão consistente de drawer, modal e split view.
- [ ] `F1-20 [P1]` Uniformizar ações em massa entre clientes, documentos e obrigações.
- [ ] `F1-21 [P2]` Criar personalização leve do dashboard por papel/cargo.
- [ ] `F1-22 [P2]` Criar modo “visão simplificada” para escritórios menos digitais.
- [ ] `F1-23 [P2]` Criar glossário de termos fiscais e operacionais no produto.
- [ ] `F1-24 [P2]` Criar barra lateral com agrupamento semântico por fluxo de trabalho.
- [ ] `F1-25 [P2]` Preparar guia visual formal do TegLion para UX/UI consistente.

## Fase 2 — Equipa, cargos, departamentos e permissões

- [ ] `F2-01 [P0]` Finalizar modelo de dados de colaborador com cargo/função como primeira classe.
- [ ] `F2-02 [P0]` Finalizar modelo de departamento com gestão activa/inactiva.
- [ ] `F2-03 [P0]` Garantir que apenas o dono define cargo, departamento e acesso do colaborador.
- [ ] `F2-04 [P0]` Mostrar no perfil do membro o cargo definido pelo dono do escritório.
- [ ] `F2-05 [P0]` Mostrar no perfil do membro o departamento atual de forma clara.
- [ ] `F2-06 [P0]` Remover linguagem técnica desnecessária do cadastro de equipa.
- [ ] `F2-07 [P0]` Explicar diferença entre colaborador, owner e nível de acesso.
- [ ] `F2-08 [P0]` Corrigir definitivamente endpoints de permissões por membro.
- [ ] `F2-09 [P0]` Criar experiência de edição rápida de membro na mesma tela.
- [ ] `F2-10 [P0]` Criar regras de visão para membro ver a mesma tela com limitações adequadas.
- [ ] `F2-11 [P1]` Criar catálogo sugerido de cargos para escritórios contábeis.
- [ ] `F2-12 [P1]` Permitir owner promover/rebaixar acesso com regras de segurança.
- [ ] `F2-13 [P1]` Bloquear remoção do último owner do escritório.
- [ ] `F2-14 [P1]` Auditar todas as mutações de equipa com actor, alvo e before/after.
- [ ] `F2-15 [P1]` Criar convites com expiração, reenvio e revogação confiáveis.
- [ ] `F2-16 [P1]` Melhorar email de convite com cargo, departamento e contexto do escritório.
- [ ] `F2-17 [P1]` Criar onboarding do colaborador com confirmação de e-mail e regras claras.
- [ ] `F2-18 [P1]` Permitir owner definir responsável padrão por cliente/departamento.
- [ ] `F2-19 [P1]` Criar matriz de permissões legível por negócio e não por código.
- [ ] `F2-20 [P1]` Permitir permissões herdadas do nível e customizações por exceção.
- [ ] `F2-21 [P2]` Criar equipas multidisciplinares por carteira de clientes.
- [ ] `F2-22 [P2]` Criar agenda e workload por colaborador e departamento.
- [ ] `F2-23 [P2]` Criar logs de acessos recentes por membro.
- [ ] `F2-24 [P2]` Criar exportação de equipa e permissões para auditoria.
- [ ] `F2-25 [P2]` Criar histórico organizacional do escritório por período.

## Fase 3 — Clientes, carteira e CRM operacional

- [ ] `F3-01 [P0]` Melhorar criação de cliente para 1 fluxo simples e rápido.
- [ ] `F3-02 [P0]` Importar clientes por CSV com validação e preview.
- [ ] `F3-03 [P0]` Criar perfil 360 do cliente com dados, documentos, tarefas e comunicação.
- [ ] `F3-04 [P0]` Destacar estado da relação do cliente: saudável, atenção, crítico.
- [ ] `F3-05 [P0]` Mostrar próximos documentos esperados por cliente.
- [ ] `F3-06 [P0]` Mostrar próximas obrigações por cliente.
- [ ] `F3-07 [P0]` Permitir responsável principal e responsável secundário por cliente.
- [ ] `F3-08 [P0]` Criar filtros de carteira por responsável, estado, segmento e risco.
- [ ] `F3-09 [P1]` Criar notas internas estruturadas por cliente.
- [ ] `F3-10 [P1]` Criar timeline unificada de actividade do cliente.
- [ ] `F3-11 [P1]` Criar tags e segmentos dinâmicos de clientes.
- [ ] `F3-12 [P1]` Criar detecção de duplicados de clientes.
- [ ] `F3-13 [P1]` Criar merge de clientes com trilha de auditoria.
- [ ] `F3-14 [P1]` Validar NIF e dados fiscais com integrações confiáveis.
- [ ] `F3-15 [P1]` Criar onboarding do cliente para novos escritórios.
- [ ] `F3-16 [P1]` Criar indicadores de risco de atraso por cliente.
- [ ] `F3-17 [P1]` Criar agrupamento por holdings e grupos empresariais.
- [ ] `F3-18 [P2]` Criar campos customizáveis por escritório.
- [ ] `F3-19 [P2]` Criar exportação de carteira por filtros avançados.
- [ ] `F3-20 [P2]` Criar favoritos e acessos rápidos por cliente.
- [ ] `F3-21 [P2]` Criar vista kanban por etapa de relacionamento.
- [ ] `F3-22 [P2]` Criar vista por saúde da carteira.
- [ ] `F3-23 [P2]` Criar score de valor do cliente para retenção e cross-sell.
- [ ] `F3-24 [P3]` Criar previsão de churn por cliente com sinais de comportamento.
- [ ] `F3-25 [P3]` Criar benchmark anonimizado de carteira por escritório.

## Fase 4 — Documentos, coleta e workflow

- [ ] `F4-01 [P0]` Simplificar pedido de documentos com templates prontos.
- [ ] `F4-02 [P0]` Tornar upload mobile do cliente extremamente simples.
- [ ] `F4-03 [P0]` Permitir múltiplos uploads por lote com progresso visível.
- [ ] `F4-04 [P0]` Criar preview inline de PDF e imagem sem sair do fluxo.
- [ ] `F4-05 [P0]` Ligar documentos diretamente a obrigação, tarefa e cliente.
- [ ] `F4-06 [P0]` Criar estados claros: recebido, em análise, rejeitado, validado.
- [ ] `F4-07 [P0]` Permitir rejeição com motivo estruturado e simples para o cliente.
- [ ] `F4-08 [P0]` Criar lembretes automáticos para pedidos pendentes.
- [ ] `F4-09 [P0]` Criar vista “documentos bloqueando o mês”.
- [ ] `F4-10 [P1]` Criar checklist documental por obrigação recorrente.
- [ ] `F4-11 [P1]` Criar versionamento de documentos sensíveis.
- [ ] `F4-12 [P1]` Detectar ficheiros duplicados por hash e por heurística.
- [ ] `F4-13 [P1]` Criar pesquisa de documentos por texto, período, cliente e categoria.
- [ ] `F4-14 [P1]` Criar bulk approve, bulk reject e bulk archive.
- [ ] `F4-15 [P1]` Criar exportação ZIP com regras de permissão e auditoria.
- [ ] `F4-16 [P1]` Criar mapa de calor de pendências documentais.
- [ ] `F4-17 [P1]` Adicionar verificação anti-malware e scanning de uploads.
- [ ] `F4-18 [P1]` Criar políticas automáticas de retenção documental.
- [ ] `F4-19 [P2]` Criar workflow de validação por dupla aprovação para documentos críticos.
- [ ] `F4-20 [P2]` Criar importação de documentos por e-mail.
- [ ] `F4-21 [P2]` Criar recepção de documentos via WhatsApp Business.
- [ ] `F4-22 [P2]` Criar upload por link temporário controlado.
- [ ] `F4-23 [P2]` Criar integração com Drive/Dropbox/OneDrive para migração.
- [ ] `F4-24 [P3]` Criar watermark opcional em downloads sensíveis.
- [ ] `F4-25 [P3]` Criar assinatura digital e integração com assinatura eletrónica.

## Fase 5 — Motor fiscal e obrigações

- [ ] `F5-01 [P0]` Consolidar calendário fiscal PT completo e testado.
- [ ] `F5-02 [P0]` Criar visão “fecha o mês” com sequência operacional real.
- [ ] `F5-03 [P0]` Criar obrigação por cliente com recorrência segura.
- [ ] `F5-04 [P0]` Criar alertas de risco: vence hoje, amanhã, 48h, em atraso.
- [ ] `F5-05 [P0]` Criar filtros por estado, período, tipo e responsável.
- [ ] `F5-06 [P0]` Criar detalhe de obrigação com histórico, documentos e leitura do cliente.
- [ ] `F5-07 [P0]` Criar ação rápida de concluir, reabrir e comentar obrigação.
- [ ] `F5-08 [P1]` Criar dependências entre obrigações relacionadas.
- [ ] `F5-09 [P1]` Criar templates fiscais por perfil de cliente.
- [ ] `F5-10 [P1]` Criar bulk update seguro de obrigações.
- [ ] `F5-11 [P1]` Criar calendário mensal e vista kanban de obrigações.
- [ ] `F5-12 [P1]` Criar mapa de risco da carteira por tipo fiscal.
- [ ] `F5-13 [P1]` Criar indicador de capacidade operacional por equipa.
- [ ] `F5-14 [P1]` Criar notificações automáticas 7/3/1 dia antes do prazo.
- [ ] `F5-15 [P1]` Criar escalation automática se cliente não enviar documento crítico.
- [ ] `F5-16 [P1]` Criar relatórios fiscais operacionais do escritório.
- [ ] `F5-17 [P2]` Integrar consultas externas fiscais quando legalmente permitido.
- [ ] `F5-18 [P2]` Preparar submissões automáticas com validação humana.
- [ ] `F5-19 [P2]` Criar feriados regionais e exceções de calendário.
- [ ] `F5-20 [P2]` Criar lock/reopen de períodos fiscais com auditoria.
- [ ] `F5-21 [P2]` Criar simuladores de penalidades e impacto de atraso.
- [ ] `F5-22 [P3]` Criar benchmark anónimo de performance fiscal por escritório.
- [ ] `F5-23 [P3]` Criar recomendações preditivas de risco fiscal com IA.
- [ ] `F5-24 [P3]` Criar cockpit executivo de compliance do escritório.
- [ ] `F5-25 [P3]` Criar base multi-country do motor fiscal por `CountryConfig`.

## Fase 6 — Portal cliente e experiência B2B2C

- [ ] `F6-01 [P0]` Tornar o portal cliente autoexplicativo em menos de 30 segundos.
- [ ] `F6-02 [P0]` Destacar “o que falta entregar” como bloco principal do portal.
- [ ] `F6-03 [P0]` Simplificar linguagem do portal para empresário não técnico.
- [ ] `F6-04 [P0]` Tornar upload de documentos possível em 2 a 3 toques no mobile.
- [ ] `F6-05 [P0]` Criar tracking visual do estado do documento enviado.
- [ ] `F6-06 [P0]` Manter branding do escritório de forma elegante e profissional.
- [ ] `F6-07 [P0]` Criar onboarding visual curto do cliente ao primeiro acesso.
- [ ] `F6-08 [P1]` Criar notificações push relevantes e não intrusivas.
- [ ] `F6-09 [P1]` Criar digest semanal do cliente com pendências e próximos passos.
- [ ] `F6-10 [P1]` Criar FAQ contextual com respostas simples por fluxo.
- [ ] `F6-11 [P1]` Criar mensagens com anexos e histórico confiável.
- [ ] `F6-12 [P1]` Criar alertas fiscais legíveis e acionáveis para o cliente.
- [ ] `F6-13 [P1]` Criar notícias e conteúdos relevantes do escritório.
- [ ] `F6-14 [P1]` Criar agendamento de consulta pelo portal.
- [ ] `F6-15 [P1]` Criar relatórios anuais do cliente em PDF bonitos e claros.
- [ ] `F6-16 [P2]` Criar portal multi-utilizador para empresas com vários responsáveis.
- [ ] `F6-17 [P2]` Criar permissões por contacto do cliente.
- [ ] `F6-18 [P2]` Criar custom domain do portal para escritórios premium.
- [ ] `F6-19 [P2]` Criar login com biometria ou passkeys quando aplicável.
- [ ] `F6-20 [P2]` Criar experiência offline parcial para uploads interrompidos.
- [ ] `F6-21 [P2]` Criar portal acessível a utilizadores menos digitais e seniores.
- [ ] `F6-22 [P3]` Criar gamificação leve de organização documental.
- [ ] `F6-23 [P3]` Criar score de prontidão documental do cliente.
- [ ] `F6-24 [P3]` Criar portal multilingue PT/EN/ES por escritório.
- [ ] `F6-25 [P3]` Criar app nativa cliente se PWA atingir limites reais.

## Fase 7 — Comunicação e colaboração

- [ ] `F7-01 [P0]` Consolidar mensagens por cliente em threads claras.
- [ ] `F7-02 [P0]` Criar templates de mensagem para casos frequentes.
- [ ] `F7-03 [P0]` Permitir variáveis de template como nome, período e documento.
- [ ] `F7-04 [P0]` Criar notas internas invisíveis ao cliente.
- [ ] `F7-05 [P0]` Criar centro de notificações unificado por utilizador.
- [ ] `F7-06 [P1]` Criar regras de prioridade e SLA de resposta.
- [ ] `F7-07 [P1]` Criar pesquisa em mensagens e anexos.
- [ ] `F7-08 [P1]` Criar menções internas entre membros da equipa.
- [ ] `F7-09 [P1]` Criar digest matinal para colaboradores.
- [ ] `F7-10 [P1]` Criar preferências de notificação por canal.
- [ ] `F7-11 [P1]` Criar quiet hours e regras anti-spam.
- [ ] `F7-12 [P1]` Integrar WhatsApp Business de forma auditável.
- [ ] `F7-13 [P1]` Melhorar deliverability de e-mails com SPF, DKIM e DMARC.
- [ ] `F7-14 [P1]` Criar comunicação em massa por segmento de clientes.
- [ ] `F7-15 [P1]` Criar read receipts e confirmação de leitura onde faz sentido.
- [ ] `F7-16 [P2]` Criar fila de atendimento e ownership por thread.
- [ ] `F7-17 [P2]` Criar regras automáticas de encaminhamento por assunto.
- [ ] `F7-18 [P2]` Criar dashboard de tempos médios de resposta.
- [ ] `F7-19 [P2]` Criar satisfação pós-atendimento.
- [ ] `F7-20 [P2]` Criar integração com helpdesk externo quando necessário.
- [ ] `F7-21 [P2]` Criar relatórios de comunicação por cliente e equipa.
- [ ] `F7-22 [P3]` Criar assistente IA para rascunho de respostas.
- [ ] `F7-23 [P3]` Criar tradução assistida de mensagens.
- [ ] `F7-24 [P3]` Criar categorização automática de conversas.
- [ ] `F7-25 [P3]` Criar copiloto de follow-up e recuperação de silêncio.

## Fase 8 — Billing, monetização e comercial

- [ ] `F8-01 [P0]` Consolidar planos e pricing oficiais no produto e na documentação.
- [ ] `F8-02 [P0]` Garantir coerência entre Stripe, landing e área autenticada.
- [ ] `F8-03 [P0]` Criar tela de billing realmente explicativa para o escritório.
- [ ] `F8-04 [P0]` Mostrar trial, fim do trial e risco de bloqueio com clareza.
- [ ] `F8-05 [P1]` Criar invoices e histórico de pagamentos acessíveis.
- [ ] `F8-06 [P1]` Criar gestão de método de pagamento self-service.
- [ ] `F8-07 [P1]` Criar fluxo de recuperação de pagamento falhado.
- [ ] `F8-08 [P1]` Criar downgrade/upgrade de plano sem suporte manual.
- [ ] `F8-09 [P1]` Criar addons futuros por storage, equipa e integrações.
- [ ] `F8-10 [P1]` Criar limites claros por plano com copy justa.
- [ ] `F8-11 [P1]` Criar trial onboarding orientado à conversão.
- [ ] `F8-12 [P1]` Criar nudges de ativação para reduzir churn precoce.
- [ ] `F8-13 [P1]` Criar tracking de trial-to-paid por cohort.
- [ ] `F8-14 [P1]` Criar cupons, campanhas e referrals rastreáveis.
- [ ] `F8-15 [P2]` Criar faturação anual, mensal e enterprise.
- [ ] `F8-16 [P2]` Criar cobrança por número de colaboradores ou módulos premium.
- [ ] `F8-17 [P2]` Criar centro comercial para case studies e ROI do escritório.
- [ ] `F8-18 [P2]` Criar calculadora de ROI na landing e no trial.
- [ ] `F8-19 [P2]` Criar NPS e health score por conta pagante.
- [ ] `F8-20 [P2]` Criar playbooks de Customer Success por estágio do cliente.
- [ ] `F8-21 [P3]` Criar marketplace de serviços pagos dentro do portal.
- [ ] `F8-22 [P3]` Criar revenue analytics por segmento de escritório.
- [ ] `F8-23 [P3]` Criar previsão de MRR/ARR no painel executivo.
- [ ] `F8-24 [P3]` Criar cobrança white-label para grandes grupos.
- [ ] `F8-25 [P3]` Criar contratos enterprise com billing customizável.

## Fase 9 — Segurança, OWASP e compliance

- [ ] `F9-01 [P0]` Mapear o produto contra OWASP ASVS e OWASP Top 10.
- [ ] `F9-02 [P0]` Criar backlog de hardening por categoria OWASP.
- [ ] `F9-03 [P0]` Cobrir autenticação, autorização e session management com testes dedicados.
- [ ] `F9-04 [P0]` Aplicar MFA para owners e acessos administrativos.
- [ ] `F9-05 [P0]` Implementar gestão de sessões ativas e revogação.
- [ ] `F9-06 [P0]` Fortalecer prevenção contra enumeração de utilizadores.
- [ ] `F9-07 [P0]` Fortalecer proteção contra brute force e credential stuffing.
- [ ] `F9-08 [P0]` Garantir validação de uploads por tipo, conteúdo e tamanho.
- [ ] `F9-09 [P0]` Garantir sanitização e encoding contra XSS e injection.
- [ ] `F9-10 [P0]` Reforçar CSRF e double-submit em todas as rotas mutáveis.
- [ ] `F9-11 [P1]` Criar processo de patching contínuo de dependências vulneráveis.
- [ ] `F9-12 [P1]` Criar scanner de secrets no CI e no histórico git.
- [ ] `F9-13 [P1]` Criar threat model dos fluxos críticos do sistema.
- [ ] `F9-14 [P1]` Criar classificação de dados e matrizes de retenção.
- [ ] `F9-15 [P1]` Criar auditoria imutável para eventos administrativos críticos.
- [ ] `F9-16 [P1]` Criar exportação de auditoria para compliance externa.
- [ ] `F9-17 [P1]` Criar política de menor privilégio por serviço e pessoa.
- [ ] `F9-18 [P1]` Criar revisão trimestral de acessos humanos e técnicos.
- [ ] `F9-19 [P1]` Criar rotação de credenciais e chaves com cadência definida.
- [ ] `F9-20 [P1]` Criar processo formal de resposta a vulnerabilidades divulgadas.
- [ ] `F9-21 [P2]` Preparar DPA, RGPD export e delete workflow robustos.
- [ ] `F9-22 [P2]` Preparar trilha para SOC 2 / ISO 27001 se virar requisito comercial.
- [ ] `F9-23 [P2]` Criar IP allowlists e controls enterprise.
- [ ] `F9-24 [P2]` Criar suporte a SAML e SSO enterprise.
- [ ] `F9-25 [P2]` Criar passkeys/WebAuthn para experiência premium segura.

## Fase 10 — Arquitectura limpa e dívida técnica

- [ ] `F10-01 [P0]` Eliminar god files restantes no frontend e backend.
- [ ] `F10-02 [P0]` Impor limites de tamanho por ficheiro em CI.
- [ ] `F10-03 [P0]` Consolidar padrão Route → Controller → Service → Repository.
- [ ] `F10-04 [P0]` Eliminar chamadas HTTP diretas fora da camada de API.
- [ ] `F10-05 [P0]` Unificar modelos de tipos de domínio entre frontend e backend.
- [ ] `F10-06 [P0]` Consolidar sistema de permissões e labels de negócio.
- [ ] `F10-07 [P1]` Criar event bus interno para ações de domínio.
- [ ] `F10-08 [P1]` Migrar tarefas pesadas para filas assíncronas reais.
- [ ] `F10-09 [P1]` Criar regras de arquitectura automatizadas em lint/CI.
- [ ] `F10-10 [P1]` Padronizar errors tipados e códigos de erro.
- [ ] `F10-11 [P1]` Melhorar boundaries entre módulos de domínio.
- [ ] `F10-12 [P1]` Remover acoplamentos residuais a legado clínico.
- [ ] `F10-13 [P1]` Consolidar `CountryConfig` como fonte única de diferenças de país.
- [ ] `F10-14 [P1]` Criar camadas de adapter para integrações externas.
- [ ] `F10-15 [P1]` Padronizar naming e conventions transversais.
- [ ] `F10-16 [P2]` Criar package interno de design system reutilizável.
- [ ] `F10-17 [P2]` Criar package interno de shared schemas e validators.
- [ ] `F10-18 [P2]` Criar ADRs formais para decisões arquiteturais relevantes.
- [ ] `F10-19 [P2]` Formalizar policy de depreciação de endpoints.
- [ ] `F10-20 [P2]` Criar catálogos de domínios e ownership por equipa.
- [ ] `F10-21 [P2]` Reduzir side effects em componentes críticos de UI.
- [ ] `F10-22 [P2]` Padronizar query keys, invalidations e mutation patterns.
- [ ] `F10-23 [P3]` Preparar extração de serviços quando houver pressão real.
- [ ] `F10-24 [P3]` Avaliar BFF especializado se complexidade de frontend escalar muito.
- [ ] `F10-25 [P3]` Preparar arquitetura de plugin/module marketplace sem quebrar core.

## Fase 11 — Plataforma, SRE e escala para 100 mil utilizadores

- [ ] `F11-01 [P0]` Introduzir observabilidade completa com métricas, logs e traces.
- [ ] `F11-02 [P0]` Criar dashboards SRE por rota, fila, erro e latência.
- [ ] `F11-03 [P0]` Medir p50, p95 e p99 das rotas críticas.
- [ ] `F11-04 [P0]` Criar alertas de saturação de CPU, memória, filas e storage.
- [ ] `F11-05 [P0]` Garantir deploy horizontal do backend sem estado local crítico.
- [ ] `F11-06 [P0]` Tornar Redis peça obrigatória e resiliente da plataforma.
- [ ] `F11-07 [P0]` Criar workers dedicados por tipo de job.
- [ ] `F11-08 [P0]` Criar retentativas seguras, idempotência e dead-letter queues.
- [ ] `F11-09 [P0]` Criar controlo de concorrência para jobs sensíveis.
- [ ] `F11-10 [P1]` Criar caching bem desenhado para leituras pesadas.
- [ ] `F11-11 [P1]` Criar budgets e controlo de custo por serviço.
- [ ] `F11-12 [P1]` Auditar queries lentas e adicionar índices apropriados.
- [ ] `F11-13 [P1]` Definir estratégia de particionamento lógico de dados quentes.
- [ ] `F11-14 [P1]` Definir estratégia de arquivamento de dados frios.
- [ ] `F11-15 [P1]` Separar cargas de leitura, escrita e processamento assíncrono.
- [ ] `F11-16 [P1]` Criar runbooks de saturação e scaling rápido.
- [ ] `F11-17 [P1]` Criar chaos drills controlados por componente crítico.
- [ ] `F11-18 [P1]` Criar testes de carga graduais para 10k, 50k e 100k utilizadores.
- [ ] `F11-19 [P1]` Criar baseline de throughput de uploads simultâneos.
- [ ] `F11-20 [P2]` Criar multi-region readiness para ativos estáticos e edge.
- [ ] `F11-21 [P2]` Criar estratégia de feature flags para rollouts seguros.
- [ ] `F11-22 [P2]` Criar status page pública e comunicação de incidentes.
- [ ] `F11-23 [P2]` Criar engenharia de capacidade trimestral.
- [ ] `F11-24 [P2]` Criar DRP/BCP testado com exercícios reais.
- [ ] `F11-25 [P2]` Preparar stack para salto posterior a 1 milhão sem reescrita central.

## Fase 12 — Dados, BI e inteligência operacional

- [ ] `F12-01 [P1]` Definir modelo analítico oficial do negócio.
- [ ] `F12-02 [P1]` Criar eventos de produto consistentes no frontend e backend.
- [ ] `F12-03 [P1]` Criar métricas de activation, retention, expansion e churn.
- [ ] `F12-04 [P1]` Criar dashboards por conta, carteira, colaborador e cliente final.
- [ ] `F12-05 [P1]` Criar tracking de tempo poupado por escritório.
- [ ] `F12-06 [P1]` Criar tracking de uploads no prazo por cliente.
- [ ] `F12-07 [P1]` Criar tracking de carga operacional por departamento.
- [ ] `F12-08 [P1]` Criar relatórios executivos do escritório dentro do produto.
- [ ] `F12-09 [P1]` Criar health score por conta do TegLion.
- [ ] `F12-10 [P1]` Criar cohorts de trial, retenção e expansão de módulos.
- [ ] `F12-11 [P2]` Criar warehouse leve para analytics sem degradar produção.
- [ ] `F12-12 [P2]` Criar catálogo de dados e ownership por métrica.
- [ ] `F12-13 [P2]` Criar políticas de qualidade de dados.
- [ ] `F12-14 [P2]` Criar benchmark anónimo entre escritórios por cluster.
- [ ] `F12-15 [P2]` Criar deteção de anomalias em uso e performance.
- [ ] `F12-16 [P2]` Criar previsão de risco operacional e picos fiscais.
- [ ] `F12-17 [P2]` Criar relatórios para Customer Success e vendas.
- [ ] `F12-18 [P2]` Criar exports e APIs seguras para BI externo.
- [ ] `F12-19 [P3]` Criar motores de recomendação por perfil de escritório.
- [ ] `F12-20 [P3]` Criar copiloto analítico para gestão do escritório.
- [ ] `F12-21 [P3]` Criar modelos de capacidade e forecast por equipa.
- [ ] `F12-22 [P3]` Criar inteligência de pricing baseada em adoção e valor.
- [ ] `F12-23 [P3]` Criar insights de cross-sell e upsell automáticos.
- [ ] `F12-24 [P3]` Criar previsão de churn com sinais multivariados.
- [ ] `F12-25 [P3]` Criar benchmark europeu por país e segmento quando houver escala.

## Fase 13 — QA, release governance e qualidade contínua

- [ ] `F13-01 [P0]` Tornar testes de smoke obrigatórios por ambiente.
- [ ] `F13-02 [P0]` Criar E2E completo do fluxo piloto real.
- [ ] `F13-03 [P0]` Criar E2E do fluxo de equipa e permissões.
- [ ] `F13-04 [P0]` Criar E2E do fluxo de convite e onboarding de cliente.
- [ ] `F13-05 [P0]` Criar E2E do fluxo fiscal crítico fim-a-fim.
- [ ] `F13-06 [P0]` Criar suites separadas para rápido, nightly e pre-release.
- [ ] `F13-07 [P1]` Criar testes de contrato para APIs críticas.
- [ ] `F13-08 [P1]` Criar testes de carga automatizados em pipeline programado.
- [ ] `F13-09 [P1]` Criar regressão visual para rotas chave.
- [ ] `F13-10 [P1]` Criar dados de teste determinísticos por tenant.
- [ ] `F13-11 [P1]` Criar ambiente efémero de preview por PR crítica.
- [ ] `F13-12 [P1]` Criar release notes automáticas por deploy.
- [ ] `F13-13 [P1]` Criar policy de feature flag cleanup pós-release.
- [ ] `F13-14 [P1]` Criar checklist formal de product QA manual.
- [ ] `F13-15 [P1]` Criar matriz de compatibilidade browser e mobile.
- [ ] `F13-16 [P2]` Criar laboratório de QA para dados edge cases.
- [ ] `F13-17 [P2]` Criar score de qualidade por módulo.
- [ ] `F13-18 [P2]` Criar qualidade de release com tendências por sprint.
- [ ] `F13-19 [P2]` Criar canary releases controlados para produção.
- [ ] `F13-20 [P2]` Criar deploy gates baseados em métricas reais pós-release.
- [ ] `F13-21 [P2]` Criar política de testes de acessibilidade automatizados.
- [ ] `F13-22 [P2]` Criar quality playbook para contributors e parceiros.
- [ ] `F13-23 [P3]` Criar test intelligence para priorização automática de suites.
- [ ] `F13-24 [P3]` Criar rollback automatizado por threshold de erro.
- [ ] `F13-25 [P3]` Criar ambiente sintético de produção para ensaios complexos.

## Fase 14 — Internacionalização e multi-country

- [ ] `F14-01 [P1]` Consolidar i18n como sistema único do frontend.
- [ ] `F14-02 [P1]` Remover strings hardcoded remanescentes nas rotas principais.
- [ ] `F14-03 [P1]` Criar base PT-PT canónica para todo o produto.
- [ ] `F14-04 [P1]` Criar variação PT-BR apoiada por `CountryConfig`.
- [ ] `F14-05 [P1]` Separar regras fiscais, legais e de conteúdo por país.
- [ ] `F14-06 [P1]` Criar formatos de moeda, data e fiscalidade configuráveis.
- [ ] `F14-07 [P1]` Garantir que formulários fiscais dependem de `countryCode`.
- [ ] `F14-08 [P1]` Criar camada de conteúdo legal e help por país.
- [ ] `F14-09 [P2]` Preparar Espanha como primeiro novo país europeu prioritário.
- [ ] `F14-10 [P2]` Preparar Itália como segundo país europeu prioritário.
- [ ] `F14-11 [P2]` Preparar fluxos BR completos com diferenças reais de operação.
- [ ] `F14-12 [P2]` Criar fallback robusto para países parcialmente suportados.
- [ ] `F14-13 [P2]` Criar catálogo de obrigações por país.
- [ ] `F14-14 [P2]` Criar matriz de integrações por país.
- [ ] `F14-15 [P2]` Criar documentação comercial e técnica por mercado.
- [ ] `F14-16 [P2]` Criar QA por locale e timezone.
- [ ] `F14-17 [P2]` Criar pricing e billing por país quando necessário.
- [ ] `F14-18 [P2]` Criar suporte multi-idioma no portal cliente.
- [ ] `F14-19 [P3]` Criar machine-readable registry de compliance por país.
- [ ] `F14-20 [P3]` Criar motor de expansão geográfica com rollout por feature flag.
- [ ] `F14-21 [P3]` Criar partnerships locais por mercado e validação fiscal real.
- [ ] `F14-22 [P3]` Criar benchmark de adoção por país.
- [ ] `F14-23 [P3]` Criar analytics de internacionalização e conversão.
- [ ] `F14-24 [P3]` Criar governance para novos países sem degradar core.
- [ ] `F14-25 [P3]` Criar readiness pack para lançamento multi-país simultâneo.

## Fase 15 — Operação, suporte, Customer Success e growth

- [ ] `F15-01 [P1]` Criar playbooks de onboarding para novos escritórios.
- [ ] `F15-02 [P1]` Criar playbooks de activação da primeira semana.
- [ ] `F15-03 [P1]` Criar CS motions para trial, churn risk e expansão.
- [ ] `F15-04 [P1]` Criar central de ajuda autoatualizável.
- [ ] `F15-05 [P1]` Criar academy para escritórios com formação por módulo.
- [ ] `F15-06 [P1]` Criar vídeos curtos por fluxo crítico.
- [ ] `F15-07 [P1]` Criar sistema de certificação para escritórios parceiros.
- [ ] `F15-08 [P1]` Criar programa de referrals de escritórios.
- [ ] `F15-09 [P1]` Criar case studies estruturados por segmento.
- [ ] `F15-10 [P1]` Criar landing pages por ICP e dor principal.
- [ ] `F15-11 [P2]` Criar templates de proposta comercial com ROI do TegLion.
- [ ] `F15-12 [P2]` Criar benchmark de maturidade digital do escritório.
- [ ] `F15-13 [P2]` Criar score de adopção interna da equipa.
- [ ] `F15-14 [P2]` Criar detecção de contas “estagnadas” com playbook de recuperação.
- [ ] `F15-15 [P2]` Criar serviço de onboarding premium para escritórios maiores.
- [ ] `F15-16 [P2]` Criar NPS do escritório e do cliente final de forma separada.
- [ ] `F15-17 [P2]` Criar support segmentation por valor e criticidade.
- [ ] `F15-18 [P2]` Criar SLA interno por tipo de conta e risco.
- [ ] `F15-19 [P2]` Criar dashboards de suporte, CS e expansão.
- [ ] `F15-20 [P3]` Criar marketplace de integrações e parceiros.
- [ ] `F15-21 [P3]` Criar programa para consultores externos especializados em TegLion.
- [ ] `F15-22 [P3]` Criar comunidade de escritórios com partilha de boas práticas.
- [ ] `F15-23 [P3]` Criar eventos e webinars recorrentes para retenção e growth.
- [ ] `F15-24 [P3]` Criar plataforma de feedback contínuo com votação.
- [ ] `F15-25 [P3]` Criar moat humano/ecossistema difícil de copiar.

## Fase 16 — Preparação para 1 milhão de utilizadores

- [ ] `F16-01 [P2]` Definir visão arquitetural específica para 1M utilizadores.
- [ ] `F16-02 [P2]` Criar mapa de bottlenecks prováveis a 10x de escala.
- [ ] `F16-03 [P2]` Separar claramente workloads de leitura, escrita e processamento.
- [ ] `F16-04 [P2]` Definir estratégia de sharding lógico ou segmentação por tenant cluster.
- [ ] `F16-05 [P2]` Definir estratégia de arquivamento de tenants inativos.
- [ ] `F16-06 [P2]` Preparar APIs assíncronas para operações pesadas.
- [ ] `F16-07 [P2]` Preparar batch processing e reprocessamento seguro em massa.
- [ ] `F16-08 [P2]` Criar limites defensivos por tenant para abuso e custo.
- [ ] `F16-09 [P2]` Criar quotas inteligentes por storage e processamento.
- [ ] `F16-10 [P2]` Criar multi-region edge strategy para latência internacional.
- [ ] `F16-11 [P2]` Criar estratégia de banco de dados para crescimento de índices e vacuum.
- [ ] `F16-12 [P2]` Criar stress tests de 1M contas e padrões sintéticos realistas.
- [ ] `F16-13 [P2]` Criar observabilidade por tenant cluster.
- [ ] `F16-14 [P2]` Criar governance de custos de IA em larga escala.
- [ ] `F16-15 [P2]` Criar arquitetura resiliente para filas gigantes e bursts fiscais.
- [ ] `F16-16 [P2]` Criar pipelines de dados separados do OLTP principal.
- [ ] `F16-17 [P2]` Criar política de tiering de contas e workloads enterprise.
- [ ] `F16-18 [P2]` Criar readiness para feature-compute isolado por módulo pesado.
- [ ] `F16-19 [P3]` Avaliar microserviços apenas quando houver ganho real comprovado.
- [ ] `F16-20 [P3]` Preparar tenancy global com compliance regional.
- [ ] `F16-21 [P3]` Criar modelo comercial e operacional para grandes grupos multinacionais.
- [ ] `F16-22 [P3]` Criar mecanismos de delegação e hierarquia multi-escritório.
- [ ] `F16-23 [P3]` Criar performance budgets obrigatórios por módulo novo.
- [ ] `F16-24 [P3]` Criar revisão semestral de capacidade rumo a 1M.
- [ ] `F16-25 [P3]` Definir a fronteira entre monólito modular excelente e plataforma distribuída.

---

## Resumo executivo por prioridade

### P0 — Fazer já

- estabilidade de produção
- segurança e isolamento
- UX principal do escritório
- equipa, cargos, departamentos e permissões
- fluxo documental e fiscal core
- portal cliente extremamente claro
- governança de release

### P1 — Fazer em seguida

- automações operacionais
- analytics e inteligência operacional
- billing self-service maduro
- suporte e customer success estruturados
- internacionalização realista
- observabilidade e performance robustas

### P2/P3 — Preparar crescimento e moat

- enterprise e compliance avançada
- marketplace e ecossistema
- multi-country profundo
- 1M readiness
- copilotos e IA avançada
- optimizações arquitecturais futuras

---

## Critério formal de conclusão desta checklist

O TegLion só pode ser considerado pronto para 100 mil utilizadores quando:

- os itens `P0` estiverem concluídos;
- pelo menos 80% dos itens `P1` estiverem concluídos;
- testes, observabilidade e segurança estiverem institucionalizados;
- a experiência do escritório e do cliente final estiver clara, rápida e confiável;
- a plataforma suportar crescimento sem depender de heroísmo operacional.

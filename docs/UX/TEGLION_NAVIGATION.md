# Navegação Proposta — Teglion

**Depende de:** [`TEGLION_INFORMATION_ARCHITECTURE.md`](./TEGLION_INFORMATION_ARCHITECTURE.md) (justificação de cada agrupamento).
**Estado:** proposta. `firmNavConfig.ts` real não foi tocado.

## Árvore de menu proposta

```
TEGLION

Visão geral
  Painel                        /app/firm/dashboard          (sem mudança)

Clientes
  Todos os clientes             /app/firm/clients             (sem mudança de rota; rótulo "Empresas" → "Clientes")
  Leads                         /app/firm/leads               [NOVO]
  Solicitações                  /app/firm/clients/inquiries    (movido; era /app/firm/services?tab=inquiries)

Serviços
  Catálogo de serviços          /app/firm/services/catalog     (movido; era /app/firm/agenda?panel=settings, bloco 2)
  Central de Serviços           /app/firm/services             (sem mudança de rota)

Agenda
  Calendário                    /app/firm/agenda               (sem mudança de rota)
  Disponibilidade               /app/firm/agenda/availability   (movido; era /app/firm/agenda?panel=settings, bloco 1)
  Google Calendar               /app/firm/agenda/google-calendar (movido; era /app/firm/agenda?panel=settings, bloco 3)

Tarefas
  Visão geral                   /app/firm/tasks/overview       (sem mudança)
  Obrigações fiscais            /app/firm/tasks/obligations    (sem mudança)
  Manuais                       /app/firm/tasks/manual         (sem mudança)
  Calendário                    /app/firm/tasks/calendar       (sem mudança)
  Por cliente                   /app/firm/tasks/clients        (sem mudança)
  Prazos legais                 /app/firm/fiscal-calendar      (sem mudança de rota; rótulo "Calendário fiscal" → "Prazos legais")

Comunicação
  Mensagens                     /app/firm/messages             (sem mudança)
  Documentos                    /app/firm/documents            (sem mudança, 3 sub-abas internas mantidas)
  Alertas                       /app/firm/alerts               (sem mudança de rota; rótulo unificado)
  Notícias                      /app/firm/news                 (sem mudança de rota; agora presente em TODAS as superfícies de nav)

Página pública
  Minha página                  /app/firm/public-page          [NOVO]

Definições
  Identidade                    /app/firm/settings?tab=identidade    (sem mudança)
  Escritório                    /app/firm/settings?tab=escritorio    (sem mudança)
  Perfil                        /app/firm/settings?tab=perfil        (sem mudança)
  Equipa                        /app/firm/settings?tab=equipa        (sem mudança)
  Integrações                   /app/firm/settings?tab=integracoes   [NOVO — reaproveita GoogleCalendarIntegrationPanel]
  Notificações                  /app/firm/settings?tab=notificacoes  (sem mudança)
  Encerrar conta                /app/firm/settings?tab=encerrar      (sem mudança)

Plano                           /app/firm/billing              (mantém-se fora de Definições, item de topo próprio — ver IA doc secção 7)
```

11 grupos de topo (incluindo Plano solto) em vez dos actuais 5 grupos + 2 itens soltos (Serviços, Plano) — mas cada grupo agora corresponde a uma intenção reconhecível, não a "o que já existia tecnicamente".

---

## Mapa rota-antiga → rota-nova

| Rota/local antigo | Rota/local novo | Tipo de mudança |
|---|---|---|
| `/app/firm/clients` | `/app/firm/clients` | Nenhuma — só rótulo do menu |
| `/app/firm/services?tab=inquiries` | `/app/firm/clients/inquiries` | Redirect necessário (era aba de "Serviços", passa a rota própria dentro de "Clientes") |
| `/app/firm/agenda?panel=settings` (bloco Disponibilidade) | `/app/firm/agenda/availability` | Redirect necessário |
| `/app/firm/agenda?panel=settings` (bloco Catálogo) | `/app/firm/services/catalog` | Redirect necessário — este é o mais visível de todos, é a correção do achado #1 |
| `/app/firm/agenda?panel=settings` (bloco Integrações) | `/app/firm/agenda/google-calendar` | Redirect necessário |
| `/app/firm/services` (tab central) | `/app/firm/services` | Nenhuma |
| `/app/firm/fiscal-calendar` | `/app/firm/fiscal-calendar` | Nenhuma — só rótulo |
| `/app/firm/alerts` | `/app/firm/alerts` | Nenhuma — só rótulo unificado dentro da própria página |
| (não existia) | `/app/firm/leads` | Rota nova |
| (não existia) | `/app/firm/public-page` | Rota nova |
| (não existia) | `/app/firm/settings?tab=integracoes` | Aba nova dentro de rota existente |

**Todos os links antigos guardados (favoritos, emails enviados, etc.) devem continuar a funcionar** — a implementação precisa de manter `<Navigate replace>` das rotas antigas para as novas, seguindo exactamente o padrão já usado hoje em `ContabilAppRouter.tsx` para `/app/firm/obligations → /app/firm/tasks/obligations` (linha 232) e os vários redirects do lado do cliente (linhas 268-272). Não é uma técnica nova a introduzir, é reaproveitar o padrão já em uso.

---

## Correção das 4 superfícies de navegação

O audit (secção 1) encontrou 4 configurações de navegação diferentes e não sincronizadas (`FIRM_NAV_GROUPS`, `FIRM_NAV_RAIL_MAIN`/`_BOTTOM`, `FIRM_NAV_MOBILE_PRIMARY`/`_MORE`), com "Notícias" ausente de 3 das 4. A recomendação é gerar as 3 configurações derivadas (rail, mobile primary, mobile more) a partir de uma única lista de 11 grupos, em vez de as manter como arrays escritos à mão em paralelo — isto é uma mudança de manutenibilidade de código, não de UX em si, mas é o que garante que uma correção de menu (como esta) não se perde de novo a cada superfície.

**Ordem sugerida para o rail/mobile** (dado que nem todos os 11 grupos cabem num rail de ícones sem rolagem): Painel, Clientes, Serviços, Agenda, Tarefas, Mensagens, Documentos — os 7 mais usados no dia-a-dia — com Comunicação (Alertas/Notícias), Página pública, Definições e Plano agrupados no "Mais", exactamente como o padrão já existente hoje para itens secundários.

---

## O que NÃO muda

- Nenhuma API de backend, nenhum contrato de dados, nenhuma tabela.
- Nenhuma lógica de RBAC/multi-tenancy/autenticação.
- Os componentes internos de cada tela (`AgendaServicesCatalogPanel.tsx`, `ServiceInquiriesWorkspace.tsx`, etc.) continuam a existir tal como são — só mudam de rota/menu.
- O portal do cliente (`/app/client/*`) — fora do âmbito desta fase; teria a sua própria revisão de nomenclatura descrita no audit (secção 7.2), a decidir depois.

# Arquitetura de Informação Proposta — Teglion

**Depende de:** [`TEGLION_UX_AUDIT.md`](./TEGLION_UX_AUDIT.md) (estado real, com todas as referências de código).
**Estado:** proposta. Nada foi implementado. Todas as rotas, componentes e APIs mencionadas abaixo já existem — isto é reagrupamento e renomeação, não construção de novas funcionalidades, excepto onde marcado explicitamente **[NOVO]**.

## Princípio

A árvore actual (`firmNavConfig.ts`) foi construída em torno de quando cada módulo foi implementado, não em torno do que a utilizadora está a tentar fazer. O sintoma mais claro disto (secção 3 do audit): a tela onde se cria e publica um Serviço vive dentro de "Consultorias", enquanto o item de menu chamado "Serviços" trata de outra coisa. A proposta abaixo agrupa por **intenção** — "quero criar um serviço", "quero atender um cliente" — preservando 100% das APIs e rotas de backend já existentes.

---

## 1. Clientes

**Junta:** `/app/firm/clients` (Empresas), `/app/firm/clients/:id` (cockpit), e a aba "Solicitações" hoje dentro de "Serviços".

**Porquê Solicitações muda de sítio:** uma Solicitação é, por definição, alguém (Lead ou Client) a tentar chegar ao escritório — é um evento centrado na *pessoa*, não no *serviço*. Hoje vive dentro de "Serviços" só porque tecnicamente referencia um `service_id`; conceptualmente pertence ao mesmo lugar onde já se gere quem são os clientes e leads do escritório.

**Resolve directamente:** o achado #4 do audit ("Leads não têm lar") — ao juntar Clientes + Leads + Solicitações no mesmo grupo, um Lead deixa de ser um dado que só aparece por acidente dentro de uma Solicitação e passa a ter, no mínimo, uma lista própria **[NOVO — tela de lista de Leads]**. A API já suporta isto parcialmente (`contabilLeadsApi.getById` existe); precisaria de um `list()` novo no backend, que é uma extensão aditiva, não uma reescrita.

**Sub-áreas propostas:**
- **Todos os clientes** = `/app/firm/clients` actual, sem mudança de rota/API, só renomeação de "Empresas" → "Clientes" para deixar de excluir implicitamente pessoas singulares (achado da secção 2.2 do audit).
- **Leads** [NOVO] — lista agregada, reaproveitando o mesmo detalhe já usado dentro de Solicitações.
- **Solicitações** = `ServiceInquiriesWorkspace.tsx` movido de sítio no menu, zero mudança de componente ou API.

---

## 2. Serviços

**Junta:** o "Catálogo de serviços" hoje escondido em Agenda → Definições (`AgendaServicesCatalogPanel.tsx`), e a "Central de Serviços" (pipeline pós-venda, `ServicesWorkspace.tsx`) hoje sob o item de menu "Serviços".

**Porquê isto é a mudança mais importante de toda a proposta:** é a correcção directa do achado #1 do audit — o item de menu chamado "Serviços" nunca levava a "gerir serviços". Ao mover o catálogo para aqui, o nome do menu finalmente corresponde ao que a tela faz. Nenhum componente muda de sítio no código — `AgendaServicesCatalogPanel.tsx` continua a existir tal como está, só passa a ser renderizado sob uma rota diferente.

**IRS não vira uma secção própria.** Confirmado no audit (secção 3.3): IRS é, estruturalmente, só um nome de 2-3 entradas dentro do catálogo — inventar uma secção "IRS" separada duplicaria a lógica de negócio que a brief pediu explicitamente para não duplicar. Em vez disso:
- Corrigir o campo `category` (já existe no tipo de dados, nunca é lido pela UI, per audit 3.3) para agrupar visualmente o catálogo por categoria — IRS aparece como uma categoria entre outras, sem código novo de domínio.
- Um serviço activado que pertença à categoria IRS mostra-se, na Central de Serviços e nas Solicitações, com um filtro/etiqueta "IRS" reaproveitando esse mesmo campo — visibilidade sem duplicação.

**Sub-áreas propostas:**
- **Catálogo de serviços** = `AgendaServicesCatalogPanel.tsx`, com a adição do filtro por categoria (correcção pequena, não nova arquitectura) e um botão "Publicar" explícito que separa gravar de tornar público (resolve o achado da secção 3.2 sobre publicação silenciosa).
- **Central de Serviços** = `ServicesWorkspace.tsx`, sem mudanças.
- **[Opcional, fase posterior]** uma acção "Converter em pedido" ligando uma Solicitação aprovada a um novo registo em Central de Serviços — resolve a desconexão da secção 2.2 do audit, mas é aditivo, não bloqueante para esta reorganização.

---

## 3. Agenda

**Junta:** o calendário/marcações (o que sobra de `AgendaWorkspace.tsx` depois do Catálogo de Serviços sair), Disponibilidade (`AgendaAvailabilityPanel.tsx`), e Google Calendar (`GoogleCalendarIntegrationPanel.tsx`).

**Porquê isto continua a fazer sentido como um grupo próprio:** ao contrário de Serviços (que é configuração), Agenda é operação do dia-a-dia — ver e criar reuniões. Disponibilidade e Google Calendar ficam aqui porque ambos só têm sentido no contexto de "quando é que o escritório está livre" — não são configurações genéricas de conta, são regras de agendamento.

**Resolve:** a confusão de nomes "Consultorias"/"Agenda"/"Consultorias / Agenda" (3 nomes para a mesma tela, audit secção 3.1) — passa a ter um nome único e estável em todo o produto: **Agenda**.

**Sub-áreas propostas:**
- **Calendário** = a vista de marcações actual.
- **Disponibilidade** = `AgendaAvailabilityPanel.tsx`, sem mudanças de componente, só de localização no menu.
- **Google Calendar** = `GoogleCalendarIntegrationPanel.tsx`. Ver [`TEGLION_USER_FLOWS.md`](./TEGLION_USER_FLOWS.md) para o texto de UX proposto (Fase 11 da brief) — a UI actual já é razoável ("Ligar Google Calendar" / estado "Ligado como {email}" / "Desconectar"), só precisa de sair do fundo de uma página de configurações genérica para ser mais fácil de encontrar.

---

## 4. Tarefas

**Sem mudanças estruturais** — as 5 sub-abas já existentes (Visão geral, Obrigações fiscais, Manuais, Calendário, Por cliente) continuam exactamente como estão; são já um bom exemplo de organização dentro do produto.

**Mudança de nome, não de rota:** "Calendário fiscal" (`/app/firm/fiscal-calendar`) passa a chamar-se **"Prazos legais"** no menu — resolve directamente a colisão de nomes da secção 5.2 do audit (o mesmo nome "Calendário fiscal" descrevendo, em dois sítios, dados completamente diferentes: um almanaque nacional vs. registos reais por cliente). O componente (`FiscalCalendarWorkspace.tsx`) e a rota não mudam, só o rótulo do menu e o `h1` da própria página.

**Correcções pequenas, não arquitectónicas** (documentadas para não se perderem, mas não bloqueiam a reorganização): ligar o botão "Exportar" sem handler e o toggle Semana/Dia sem efeito (secção 5.3 do audit) — são bugs, cabem em qualquer sprint de implementação, não precisam de decisão de IA.

---

## 5. Comunicação

**Junta:** Mensagens, Documentos (3 abas), Central de Alertas, Notícias — mantém-se como grupo, já fazia sentido.

**Uma mudança de nome:** "Central de Alertas" e "Alertas" (2 nomes já inconsistentes) e "Central de comunicação" (3º nome, dentro da própria página) colapsam para um único rótulo: **Alertas**. `AlertsWorkspace.tsx:314` precisa de actualizar o seu próprio `h1` interno para bater com o menu — pequena correcção de texto, sem mudança de componente.

**Não fundir Alertas e Notícias no lado do staff**, apesar do cliente já os ver fundidos (audit secção 4.2). Motivo: do lado do staff são fluxos de trabalho genuinamente diferentes — Alertas tem segmentação de destinatários + confirmação de leitura + analytics; Notícias é um CMS simples sem nada disso. Fundir esconderia essa diferença de capacidades. Ficam como dois itens dentro do mesmo grupo "Comunicação", não uma página.

**Fora do âmbito desta fase, documentado para decisão futura:** o silo de documentos de `service_inquiries` vs. o módulo Documentos "normal" (audit secção 4.2) é uma questão de modelo de dados no backend, não só de menu — fica registado aqui como dívida a resolver depois, sem bloquear a reorganização de navegação.

---

## 6. Página pública [grupo NOVO na navegação, componentes existentes]

**Hoje não existe como conceito de menu.** É a correcção mais directa do achado da secção 8.3 do audit — o URL público (`teglion.com/seu-slug`) está hoje invisível até à utilizadora cavar 4 camadas dentro de Agenda → Definições → um serviço específico → Definições avançadas.

**O que muda:** um ecrã novo e pequeno que **não duplica nada** — mostra o slug do escritório (já existe em `user.tenant.slug`), lista os serviços já marcados como públicos (reaproveita `contabilAccountingServicesApi.list()`, já filtrando por `isPubliclyListed`), e um botão "Pré-visualizar" que abre a página pública real (não o mock — corrige directamente o achado da secção 3.2 sobre o preview não reflectir a realidade).

**Sub-áreas propostas:**
- **Minha página** [NOVO, ecrã pequeno] — mostra a URL, link de copiar, lista de serviços publicados com atalho de 1 clique para "Catálogo de Serviços" caso queiram publicar mais.
- Não duplica a configuração de cada serviço — essa continua a viver em "Serviços → Catálogo de serviços", só passa a ser referenciada a partir daqui.

---

## 7. Configurações

**Sem mudanças às 6 abas existentes** (Identidade, Escritório, Perfil, Equipa, Notificações, Encerrar conta) — já são coerentes e o RBAC granular (secção 6 do audit) já está bem construído, só precisa de ficar mais visível de fora.

**Uma adição:** aba **Integrações** [NOVO, mas sem lógica nova] — mostra o estado da ligação Google Calendar (reaproveita `GoogleCalendarIntegrationPanel.tsx` tal como está, só renderizado também aqui, ou com um link directo para Agenda → Google Calendar se preferirem não duplicar o componente em dois sítios). Resolve o achado da secção 6 do audit: "não existe nenhuma aba Integrações", apesar de ser o local onde a maioria dos utilizadores de SaaS espera encontrar ligações a serviços externos.

**Plano/Faturação — decisão em aberto, não bloqueante:** o audit nota que "Plano" e "Definições" são hoje irmãos no menu com o mesmo peso hierárquico que "Encerrar conta" sugeriria. Duas opções: (a) manter "Plano" como item de topo próprio (é o que já funciona hoje, risco zero), ou (b) movê-lo para dentro de Definições como 7ª aba. Recomendo (a) para esta fase — billing é sensível o suficiente para não se querer misturar com uma reorganização de UX mais ampla; revisitar depois se fizer sentido.

---

## Tabela-resumo: de onde vem cada coisa

| Novo grupo | Sub-item | Componente/rota actual | Muda de componente? |
|---|---|---|---|
| Clientes | Todos os clientes | `FirmClientsPage.tsx` (`/app/firm/clients`) | Não, só rótulo |
| Clientes | Leads | — | **Novo ecrã**, reaproveita `contabilLeadsApi` |
| Clientes | Solicitações | `ServiceInquiriesWorkspace.tsx` | Não, só grupo de menu |
| Serviços | Catálogo de serviços | `AgendaServicesCatalogPanel.tsx` | Não, só grupo de menu + filtro de categoria + botão Publicar |
| Serviços | Central de Serviços | `ServicesWorkspace.tsx` | Não |
| Agenda | Calendário | `AgendaWorkspace.tsx` (resto) | Não |
| Agenda | Disponibilidade | `AgendaAvailabilityPanel.tsx` | Não, só grupo de menu |
| Agenda | Google Calendar | `GoogleCalendarIntegrationPanel.tsx` | Não, só grupo de menu |
| Tarefas | (5 abas actuais) | sem mudança | Não |
| Tarefas | Prazos legais | `FiscalCalendarWorkspace.tsx` (renomeado) | Não, só rótulo |
| Comunicação | Mensagens/Documentos/Alertas/Notícias | sem mudança de rota | Não, "Alertas" ganha nome único |
| Página pública | Minha página | — | **Novo ecrã pequeno**, sem lógica nova |
| Definições | (6 abas actuais) + Integrações | sem mudança | Integrações é nova aba, componente reaproveitado |

Nenhuma API de backend precisa de mudar de contrato para esta reorganização acontecer — é 100% reagrupamento de rotas/menu no frontend, com duas excepções pequenas e aditivas (endpoint `list()` para Leads; leitura do campo `category` já existente). Ver [`TEGLION_NAVIGATION.md`](./TEGLION_NAVIGATION.md) para a árvore de menu concreta e o mapeamento rota-a-rota.

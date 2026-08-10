# Fluxos de Utilizador — Actual vs. Proposto

**Depende de:** [`TEGLION_UX_AUDIT.md`](./TEGLION_UX_AUDIT.md) (evidência) e [`TEGLION_NAVIGATION.md`](./TEGLION_NAVIGATION.md) (rotas novas).
**Estado:** proposta. Os números "actual" vêm de leitura directa do código citada no audit; os números "proposto" assumem a nova árvore de navegação já implementada, sem nenhuma lógica de negócio nova.

---

## Fluxo 1 — Criar e publicar um serviço (incluindo um "estilo IRS")

**Actual — 6+ cliques, atravessando uma página cujo nome não sugere nada disto:**

1. Menu → "Consultorias" (nome não sugere "criar serviço")
2. Botão "Definições" no topo (o `h1` continua a dizer "Agenda")
3. Scroll até ao 2º de 3 blocos empilhados
4. "Activar do catálogo" (popover) → seleccionar → "Activar seleccionados" — **não existe "criar do zero"**
5. Ícone de engrenagem sem rótulo próprio → expande gaveta "Definições avançadas"
6. Preencher formulário de captação, documentos, slug — tudo atrás do mesmo botão "Guardar", sem confirmação diferenciada de "isto vai ficar público"

Preview disponível é um mock que o próprio código admite não reflectir a realidade (`ServiceFormPreview.tsx:21-27`); o link para a página pública real só aparece depois de já ter gravado.

**Proposto — 3 cliques, num menu que já diz "Serviços":**

1. Menu → "Serviços" → "Catálogo de serviços" (2 cliques, nome bate com a intenção)
2. "Criar serviço" ou "Duplicar" — mesmo mecanismo de hoje, só com um botão de criação directa adicionado à lista existente (não é lógica nova, é expor `POST /contabil/accounting-services`, que já existe na API mas nunca é chamado pelo frontend hoje)
3. Preencher e "Publicar" (botão próprio, separado de "Guardar rascunho") — usa o link real da página pública, não o mock

IRS deixa de precisar de "ser encontrado" — aparece como categoria dentro da lista (usando o campo `category` já existente nos dados, hoje nunca lido pela UI), não como destino separado.

---

## Fluxo 2 — Ligar o Google Calendar

**Actual — 2 cliques, mas escondido:** Menu "Consultorias" → "Definições" → scroll até ao 3º de 3 blocos. Copy actual já é boa (*"Ligue a sua conta Google para preparar o envio de consultas para o Google Calendar"*, estado "Ligado como {email}", botão "Desconectar"), o problema é só descoberta, não o texto em si.

**Proposto — 2 cliques, num menu que já diz "Google Calendar":** Menu "Agenda" → "Google Calendar". Mesmo componente (`GoogleCalendarIntegrationPanel.tsx`), zero mudança de UI interna — só deixa de estar atrás de um botão "Definições" sem contexto.

**Nota separada, fora do âmbito de UX:** a auditoria técnica anterior desta sessão (ver histórico da conversa) já identificou e está a ser resolvida uma questão de scopes OAuth não aprovados no Google Cloud Console — isso é independente de onde o botão vive no menu.

---

## Fluxo 3 — Onboarding de um escritório novo (primeiros 10 minutos)

**Actual:**
1. Regista-se (nome do escritório, dono, email, password) — nunca vê nem lhe perguntam sobre a URL pública.
2. Aterra directamente no Dashboard operacional completo, com 5 painéis todos vazios ao mesmo tempo.
3. Checklist de 4 passos sobreposto: perfil/logo → primeira empresa → "convidar cliente" (**bug: nunca fica marcado como concluído**, `FirmOnboardingWizard.tsx:70`) → criar obrigação/tarefa.
4. Nenhum dos 4 passos menciona Serviços, IRS, página pública ou Google Calendar — as próprias coisas que esta iniciativa quer tornar visíveis já nascem ausentes do primeiro contacto com o produto.

**Proposto:**
1. Registo sem mudanças (não é prioridade mexer no formulário de signup nesta fase).
2. Dashboard continua a ser a tela de aterragem (não vale a pena construir uma rota de onboarding própria só para isto), mas o widget de checklist ganha um 5º passo: **"Publique o seu primeiro serviço"** → aponta directamente para `/app/firm/services/catalog`, fechando o ciclo até "Página pública" ficar com conteúdo real.
3. Corrigir o bug do passo "Convidar cliente" (`completed.invite` hardcoded a `false`) — isto é uma correcção de lógica, não de arquitectura, mas fica registada aqui porque está no mesmo componente a ser tocado.
4. **Minha página** (novo ecrã) passa a ser o lugar natural para onde apontar depois do 1º serviço estar publicado — fecha visualmente o círculo "criei um serviço → aqui está o link para partilhar".

---

## Fluxo 4 — Criar a página pública do escritório

**Actual:** não existe como fluxo dedicado. A URL pública (`teglion.com/seu-slug`) só se torna visível como efeito colateral de publicar um serviço individual (Fluxo 1, passo 6) — nada no registo, no Dashboard ou em Definições aponta para lá. Confirmado por grep: zero menções a "slug" ou URL pública em `FirmSettingsPage.tsx`.

**Proposto:** ecrã novo "Página pública → Minha página", pequeno e sem lógica de negócio nova:
- Mostra a URL do escritório (`teglion.com/{slug}`) com botão de copiar.
- Lista os serviços já publicados (reaproveita a mesma chamada já usada no Catálogo, filtrada por `isPubliclyListed`).
- Link "Pré-visualizar" que abre a página pública real — nunca o mock.
- Se não houver nenhum serviço publicado ainda, estado vazio com CTA directo para "Catálogo de serviços" em vez de texto morto.

Isto cobre directamente os pontos 1-11 da Fase 7 da brief original (activar página → identidade → serviços → publicar → marcações → disponibilidade → Google Calendar → contactos → pré-visualizar → publicar) sem construir nenhuma tela nova de configuração — tudo já existe espalhado, só passa a ter um ponto de entrada único que aponta para os sítios certos.

---

## Ordem de implementação recomendada

Seguindo a regra da brief ("não tentar redesenhar tudo de uma vez"), por menor risco de quebrar algo já a funcionar em produção com uma piloto real a usar o sistema diariamente:

| Ordem | O quê | Risco | Porquê nesta posição |
|---|---|---|---|
| 1 | Corrigir bugs decorativos já identificados (botão "Notificar cliente" sem acção, "Exportar" sem handler, toggle Semana/Dia sem efeito, bug do passo "Convidar cliente" no onboarding) | Muito baixo — são correcções isoladas, sem tocar em navegação | Ganham confiança e são triviais de verificar isoladamente, antes de mexer em algo maior |
| 2 | Renomear sem mover rota: "Empresas"→"Clientes", "Calendário fiscal"→"Prazos legais", unificar "Central de Alertas"/"Alertas"/"Central de comunicação" num nome só | Muito baixo — só texto, zero mudança de rota ou lógica | Resolve várias das inconsistências de nomenclatura do audit sem nenhum risco de quebrar links/bookmarks |
| 3 | Mover "Catálogo de serviços" de Agenda→Definições para "Serviços" (a mudança de maior impacto) | Médio — precisa de redirects cuidadosos das rotas antigas | É a correcção do achado #1, a que mais destrava a percepção de "onde é que eu configuro um serviço" |
| 4 | Criar ecrã "Leads" e "Minha página" (os dois ecrãs novos, ambos pequenos e sem lógica de negócio nova) | Baixo-médio — telas novas, mas reaproveitando APIs já existentes (mais um `list()` novo para Leads) | Fecha os dois gaps mais citados no audit, depois da navegação já estar reorganizada à sua volta |
| 5 | Unificar as 4 configurações de navegação (drawer/rail/mobile) numa fonte única, adicionar "Integrações" a Definições | Baixo | Consolidação de manutenção, evita que a correcção do passo 2/3 se perca de novo numa das 4 superfícies |
| 6 | Design system — Select, EmptyState duplicado, toast (ver `TEGLION_DESIGN_SYSTEM.md`) | Baixo, mas alto volume (dezenas de ficheiros) | Trabalho mecânico, melhor feito depois da navegação estabilizar para não misturar dois tipos de diff no mesmo período |
| 7 | Responsividade, acessibilidade, microcopy (Fases 13-15 da brief) | Baixo | Revisão final, depois de tudo o resto já estar no lugar definitivo |

Cada passo é committável e revisível isoladamente — nenhum bloqueia o seguinte, e é possível parar em qualquer ponto desta lista com o produto sempre num estado consistente e melhor do que estava antes desse passo.

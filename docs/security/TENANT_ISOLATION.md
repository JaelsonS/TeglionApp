# Isolamento entre escritórios (multi-tenant)

> **Fontes consolidadas neste documento:** `docs/06-SEGURANCA/MULTI-TENANT-SECURITY.md`, `docs/06-SEGURANCA/SECURITY-GATES.md` (arquivos removidos após esta migração, 19/08/2026). Verificação de código adicional feita nesta reescrita (19/08/2026): `.github/workflows/ci.yml`, `backend/src/services/tracking/view-tracking.service.js`, `backend/src/db/supabase/repositories/**`, `backend/scripts/tenant-isolation-test.js`, `docs/ROADMAP.md` (itens 0.1 e 0.4).

Este é o documento mais importante da pasta `security/`. A pergunta que ele responde: **um usuário de um escritório consegue ver dado de outro escritório?**

Resposta curta: **hoje, não pelas rotas normais do produto — exceto um caminho confirmado e já registrado como prioridade máxima de correção (ver abaixo).** Essa resposta é verificada em código, não presumida, e vem com a explicação de exatamente por que ela é verdadeira e o que a sustenta.

## Como o isolamento é garantido de verdade

### A fronteira real é o filtro `firm_id`, aplicado pela aplicação — não pelo banco

O backend acessa o Supabase com uma chave de acesso total (`service_role`). Essa chave **ignora Row Level Security (RLS) por definição** — é assim que o `service_role` funciona no Postgres/Supabase, não é uma configuração específica do Teglion. Isso significa que, para o tráfego real do produto, políticas RLS escritas no schema do banco não estão no caminho da requisição.

A fronteira de isolamento real é a camada de aplicação: **toda consulta que toca dado de um escritório precisa, manualmente, filtrar por `firm_id`.** Exemplo real, de um dos 52 arquivos de repositório do backend (`backend/src/db/supabase/repositories/contabil/documents.repository.js`):

```js
.eq('firm_id', firmId)   // repetido em cada consulta que lê ou escreve documento
```

Esse padrão foi verificado de forma consistente na camada de repositórios — documentos, tarefas, mensagens, clientes, obrigações, consultas/agendamentos, pedidos de serviço, leads, alertas, conexões de Google Calendar, e pagamentos via Stripe Connect — sempre combinando o ID do recurso pedido com o `firm_id` do usuário autenticado, nunca aceitando um `firm_id` vindo de fora sem validar contra a sessão.

### RLS existe, mas é defesa em profundidade — não a fronteira primária

É importante não deixar essa frase soar mais forte do que é: RLS **não protege o tráfego real do produto**, porque o backend nunca passa por ela. Onde RLS está ativa hoje (`IMPLEMENTADO`, com matriz confirmada), ela protege contra um cenário diferente e mais estreito: acesso direto ao banco via PostgREST/Supabase client com uma chave que **não** seja `service_role` (por exemplo, se um JWT de usuário final algum dia for usado diretamente contra o Supabase, ou um erro de configuração expuser a chave `anon`).

**Matriz confirmada — 4 tabelas críticas (auditoria 13/08/2026):**

| Tabela | RLS produção | RLS staging | Policy | Risco residual se `service_role` vazar |
|---|---|---|---|---|
| `stripe_webhook_events` | ON | ON | deny-all | baixo — sem `firm_id`; protegido por idempotência Stripe |
| `auth_login_attempts` | ON | ON | deny-all | baixo — usado só para lockout |
| `obligation_templates` | ON | ON | firm_staff | baixo — tenant via `firm_id` |
| `obligation_recurrence_rules` | ON | ON | firm_staff | baixo — tenant via `firm_id` |

Migration: `20260927020000_sprint0_rls_defense_in_depth.sql` (aplicada em staging e produção). Storage (`contabil-documents`) também tem `public: false` com 5 policies scoped a `firm/{firm_id}/…`, equivalentes em produção e staging.

**Isso não significa "RLS ON em todas as tabelas public".** Uma versão anterior deste documento (`docs/security/TEGLION_SECURITY_GATE.md`, item P0.03) afirmava isso de forma mais ampla do que a evidência sustenta — a matriz confirmada por auditoria cobre essas 4 tabelas nomeadas mais o módulo de Stripe Connect e o Storage. Para o restante das ~40+ tabelas do schema, o estado de RLS é `A VALIDAR` — não foi confirmado nem que está ligado nem que está desligado nesta rodada de documentação. Isso não muda o risco prático (o backend não depende de RLS para nenhuma tabela), mas é uma afirmação que não deve ser repetida sem essa qualificação.

## O teste que comprova isso — e por que ele importa mais do que parece

Existe um script de aproximadamente 590 linhas (`backend/scripts/tenant-isolation-test.js`) que testa diretamente o risco mais caro do produto: vazamento de dado entre escritórios. Ele cria dois escritórios sintéticos em staging e tenta, sistematicamente, ler e escrever dado de um a partir do contexto do outro.

**Este teste roda automaticamente, hoje, em todo PR/push — `IMPLEMENTADO`.** Isso corrige uma afirmação desatualizada que os documentos-fonte deste arquivo (`MULTI-TENANT-SECURITY.md`, de 12/08) ainda continham: "o único teste automatizado que pegaria essa regressão não roda sozinho em lugar nenhum hoje." Isso deixou de ser verdade em 13/08/2026, quando o gate entrou em produção — os documentos antigos nunca foram atualizados depois disso, o que esta reescrita corrige.

Evidência direta, lida em `.github/workflows/ci.yml` (linhas 57–72) durante esta revisão:

```yaml
- name: Tenant isolation test (staging)
  env:
    SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.STAGING_SUPABASE_SERVICE_ROLE_KEY }}
    ...
  run: |
    if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
      echo "::error::STAGING_SUPABASE_URL / STAGING_SUPABASE_SERVICE_ROLE_KEY em falta."
      exit 1
    fi
    ...
    npm run test:tenant-isolation -w backend
```

O comportamento é **fail-closed**: se os secrets de staging (`STAGING_SUPABASE_URL`, `STAGING_SUPABASE_SERVICE_ROLE_KEY`) não estiverem cadastrados no GitHub, o job falha com `exit 1` — o pipeline não passa em silêncio, ele quebra o merge. O script roda contra o projeto Supabase de staging dedicado (`teglion-staging`), nunca contra produção — ele escreve dados sintéticos reais nesse ambiente.

Além do teste de isolamento contra staging, cada PR também roda um scanner estático (parte de `test:security-static`) que procura por consultas `.eq('id', …)` sem `.eq('firm_id', …)` acompanhando — hoje configurado para não falhar o build (`TENANT_ISOLATION_FAIL_ON_WARNINGS=false`), só sinalizar. Uma classificação desses avisos (auditoria 13/08) resultou em 0 avisos após allowlist de casos legítimos (tokens de convite, tabelas sem conceito de tenant) e endurecimento de queries genuinamente frouxas.

## O risco real, confirmado e em aberto hoje: rastreamento de visualizações

Duas leituras em `backend/src/services/tracking/view-tracking.service.js` filtram **só por `id`**, sem `firm_id`:

```js
// recordView() — linha ~71
const { data: entity } = await sb.from(table).select('view_count, first_viewed_at').eq('id', entityId).maybeSingle();

// recordView() — linha ~87-91 (retorno de contagem)
const { data: entity } = await sb.from(table).select('view_count, last_viewed_at').eq('id', entityId).maybeSingle();
```

(A escrita, no meio dessas duas leituras, está corretamente filtrada: `.eq('id', entityId).eq('firm_id', firmId)`. Só as duas leituras que compõem a resposta ao chamador não têm o filtro.)

**Impacto:** um usuário autenticado com papel `CLIENT` de qualquer escritório que descubra o UUID de um documento ou obrigação de outro escritório consegue, através dos endpoints `POST /api/me/contabil/documents/:id/view` e `.../obligations/:id/view`, ler `view_count` e `lastViewedAt` desse recurso — metadado de outro tenant, não o conteúdo do documento em si, mas ainda assim um vazamento cross-tenant real e confirmado por leitura direta de código.

**Status:** `NÃO CORRIGIDO` — registrado como item **P0 (0.1)** no [`ROADMAP.md`](../ROADMAP.md#01--corrigir-vazamento-cross-tenant-confirmado-no-rastreamento-de-visualizações), com critério de conclusão definido (as duas leituras passam a filtrar também por `firm_id`; teste automatizado cobrindo o cenário). Este documento não esconde o problema — ele é o risco mais concreto e acionável descrito nesta pasta inteira. Consulte o `ROADMAP.md` para o estado de progresso mais atual; este documento não deve ser tratado como fonte de verdade sobre se já foi corrigido.

## Ponto de atenção estrutural — não é vulnerabilidade hoje, mas é risco de desenho

Algumas funções internas de repositório (por exemplo, comentários/mensagens vinculados a uma tarefa ou a um pedido de serviço) filtram só pelo ID do registro pai, sem repetir o filtro de `firm_id` na própria função interna. Hoje isso não é explorável, porque todo lugar que chama essas funções já validou o registro pai antes de chegar nelas. Mas é exatamente o padrão que produziu o vazamento do rastreamento de visualizações acima — uma função que parece segura porque hoje só é chamada de um jeito seguro, até que um desenvolvedor futuro a reaproveite num endpoint novo sem perceber que falta essa camada.

## Por que a resposta não é um "sim" simples

Zero rede de segurança no banco de dados (na prática, para o tráfego real) significa que um único filtro de `firm_id` esquecido, num endpoint novo, é um vazamento silencioso até alguém encontrar. O gate de CI (fail-closed contra staging) e o scanner estático reduzem bastante a chance disso passar despercebido — mas o scanner não bloqueia o build hoje, só avisa, e o teste de isolamento cobre os fluxos que o script foi escrito para cobrir, não necessariamente todo endpoint novo automaticamente. A resposta honesta é: **isolamento é verificado, testado automaticamente no CI, com uma falha real conhecida e rastreada — não "está tudo garantido para sempre".**

## O que não foi verificado nesta revisão

Estado de RLS nas tabelas fora da matriz de 4 tabelas críticas — marcado `A VALIDAR` acima. Cobertura exata do script de isolamento (quais entidades/endpoints ele testa) não foi lida linha a linha nesta revisão — ver o próprio arquivo `backend/scripts/tenant-isolation-test.js` para o escopo real.

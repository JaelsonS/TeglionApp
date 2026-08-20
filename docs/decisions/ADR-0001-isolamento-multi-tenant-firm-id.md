# ADR-0001 — Isolamento multi-tenant por `firm_id`, com RLS como defesa em profundidade

## Status

Aceito. Decisão já em vigor — documentei retroativamente em 18/08/2026.

## Contexto

O Teglion é multi-tenant: cada escritório de contabilidade (`firm`) tem seus próprios clientes, obrigações, documentos, tarefas, mensagens e cobranças, e nenhum escritório pode ver ou alterar dados de outro. Isso não é um requisito de produto secundário para mim — é a condição mínima para o sistema existir. Um vazamento entre escritórios (o cliente A vendo dados do escritório B, ou um escritório vendo dados de outro) é o pior tipo de falha que o Teglion pode ter.

O banco de dados é Postgres via Supabase. O Supabase oferece Row Level Security (RLS) nativa, e eu uso isso — mas meu backend, na prática, acessa o banco usando a chave `service_role`, que **ignora RLS por definição** (é assim que o Supabase foi desenhado: `service_role` é a chave de confiança total, usada por servidores de confiança). Isso significa que, para o tráfego real da aplicação, RLS sozinha não isola nada.

## Problema

Como eu garanto que uma consulta ao banco, feita pelo backend em nome de um usuário do escritório X, nunca retorne nem altere dados de outro escritório, dado que a camada que teoricamente faria essa checagem (RLS) está desligada para a conexão que meu backend usa?

## Decisão

Garanto o isolamento entre escritórios primariamente por um filtro explícito por `firm_id` em toda consulta feita nos repositórios de acesso a dados (`backend/src/db/supabase/repositories/**`). Toda leitura, escrita, atualização e remoção de um registro pertencente a um escritório inclui `.eq('firm_id', firmId)` (ou equivalente) na query, com o `firmId` vindo do usuário autenticado na requisição — nunca de um parâmetro que o cliente da API possa manipular livremente sem validação.

`grep -rl "eq('firm_id'" backend/src/db/supabase/repositories | wc -l` confirma 31 arquivos de repositório aplicando esse padrão.

RLS também está ativa no meu Postgres, com uma função `public.current_firm_id()` (lê `firm_id` de `auth.jwt()`) usada em políticas `USING`/`WITH CHECK` em várias tabelas (confirmei em `supabase/migrations/*.sql`, por exemplo `20260918000000_firm_fiscal_calendar.sql` e `20260930000000_firm_entity_tag_links.sql`). Mas essa camada protege sobretudo acessos que não passam pelo backend com `service_role` — não é, hoje, a fronteira que protege o tráfego normal da aplicação.

## Alternativas consideradas

- **Confiar só em RLS, sem filtro explícito no backend.** Descartei isso, ainda que implicitamente, pela forma como construí o sistema: como meu backend usa `service_role`, essa opção deixaria o isolamento inteiramente dependente de RLS estar corretamente configurada em toda tabela, sempre — um único erro de configuração de política (ou uma tabela nova sem RLS habilitada) exporia todos os dados de todos os escritórios, sem nenhuma segunda camada de proteção.
- **Usar a chave `anon`/autenticada do Supabase no backend, deixando RLS fazer o trabalho.** Não foi o caminho que escolhi — meu backend precisa de operações administrativas (criação de conta, jobs internos, integrações) que exigem `service_role`. Migrar todo o acesso para uma chave sujeita a RLS teria implicações maiores de arquitetura que não explorei aqui.

## Motivos da decisão

- O filtro explícito por `firm_id` é auditável por leitura direta de código, repositório por repositório — não depende de eu confiar numa configuração de política SQL espalhada em dezenas de migrations.
- É a camada que efetivamente protege o tráfego real, dado que `service_role` ignora RLS.
- RLS continua valendo como segunda camada para mim: protege contra acessos que não passam pelos repositórios do backend (ex.: uma conexão direta ao banco, uma função Edge, ou um erro futuro de arquitetura que troque `service_role` por uma chave sujeita a RLS).

## Consequências positivas

- Isolamento auditável e explícito: consigo responder "esse repositório filtra por `firm_id`?" lendo o arquivo, sem precisar simular JWTs ou entender toda a árvore de políticas RLS.
- Duas camadas de defesa (filtro explícito + RLS) significam que uma falha isolada em uma delas não vira automaticamente uma falha total.

## Consequências negativas

- O filtro por `firm_id` é uma disciplina manual, repositório por repositório, endpoint por endpoint. Não tenho hoje um mecanismo estrutural (um wrapper único de acesso a dados, por exemplo) que torne impossível escrever uma query sem esse filtro — dá para esquecer.
- Essa consequência não é teórica para mim: já encontrei uma falha real desse tipo. Os endpoints `POST /api/me/contabil/documents/:id/view` e `.../obligations/:id/view`, em `backend/src/services/tracking/view-tracking.service.js`, leem `view_count` e `lastViewedAt` filtrando só por `id`, sem `firm_id` — um cliente de qualquer escritório que descubra o UUID de um documento ou obrigação de outro escritório consegue ler essa metadata (a escrita/UPDATE já estava corretamente filtrada; só as duas leituras não estavam). Ver `docs/ROADMAP.md`, item 0.1, estado `PRÓXIMO`, prioridade P0.
- Porque `service_role` ignora RLS, esse tipo de esquecimento **não é pego pela RLS** — a segunda camada de defesa não cobre esse caso específico, porque a conexão que erra é a mesma que está isenta de RLS.

## Riscos

- Novo código (novo repositório, novo endpoint, uma query "rápida" que eu escreva direto num controller) pode reintroduzir o mesmo tipo de falha do item 0.1 a qualquer momento, porque a proteção depende de disciplina minha, não de um mecanismo que bloqueia estruturalmente o erro.
- É por isso que tenho um teste de isolamento entre tenants automatizado no CI (`backend/scripts/tenant-isolation-test.js`, executado no step "Tenant isolation test (staging)" em `.github/workflows/ci.yml`, linhas 57-81), rodando contra um projeto Supabase de staging real e falhando o pipeline (fail-closed) se os secrets de staging estiverem ausentes. Esse teste é a rede de segurança que criei precisamente porque sei que o filtro manual pode falhar — ver `docs/ROADMAP.md`, item 0.4 (`CONCLUÍDO`).

## Impacto futuro

- Qualquer tabela nova que eu criar para armazenar dados por escritório precisa nascer com `firm_id NOT NULL` e com todo acesso passando por um repositório que filtra por ele — isso devia entrar no meu checklist de revisão de qualquer PR que crie uma tabela ou repositório novo.
- Vale eu considerar, como evolução futura (fora do escopo desta decisão), um mecanismo estrutural que torne o filtro por `firm_id` obrigatório por construção (ex.: um query builder que exige o tenant como parâmetro), em vez de depender só de convenção que eu sigo e que o teste pega.
- Trato a correção do item 0.1 do roadmap como prioridade P0, não como um bug isolado — é a prova de que esse risco é ativo, não hipotético.

## Relação com outros ADRs

- ADR-0002 (país como propriedade do tenant): depende do mesmo princípio de isolamento por `firm_id` que usei aqui — país nunca pode ser usado como substituto ou atalho para esse filtro.
- ADR-0003 (Supabase como plataforma): explica por que `service_role` bypassar RLS é uma característica da plataforma que escolhi, não um bug — e por que isso exige a disciplina que descrevi aqui.

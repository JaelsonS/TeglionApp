# ADR-0002 — País como propriedade do tenant (escritório), nunca do usuário, nunca usado para autorização

## Status

Aceito. Decisão já em vigor, documentada retroativamente em 18/08/2026.

## Contexto

O Teglion nasceu em Portugal e está se preparando para operar também no Brasil (ver `docs/ROADMAP.md`, Fase 3 e Fase 4). Isso levanta uma pergunta de modelagem de dados que precisa de resposta antes de qualquer expansão: onde o país de operação vive no schema — no escritório, no usuário individual, ou em cada cliente?

Um escritório de contabilidade opera sob uma jurisdição fiscal principal: as regras, calendário fiscal, moeda e formato de identidade fiscal (NIF vs. CNPJ/CPF) são propriedades do escritório como organização, não de cada pessoa que trabalha nele ou de cada cliente que ele atende.

## Problema

Onde armazenar "país" no modelo de dados, de forma que a informação sirva para adaptar comportamento (calendário fiscal, moeda, formulários) sem nunca se tornar, mesmo sem intenção, um mecanismo de controle de acesso paralelo ao isolamento por `firm_id` (ver ADR-0001)?

## Decisão

País é uma propriedade do escritório (tenant), armazenada em `firms.country_code` (`TEXT DEFAULT 'PT'`, ver `supabase/tables.sql`), e não existe em nenhum outro lugar do schema principal: não há coluna `country_code` em `clients`, nem em `firm_users`. Um escritório tem um país; os usuários e clientes dentro dele herdam esse contexto através do próprio escritório, não têm um país próprio armazenado.

País nunca é usado como critério de autorização. Auditoria em 18/08/2026, lendo todas as migrations em `supabase/migrations/*.sql`, confirmou que nenhuma política RLS usa `country_code` em cláusula `USING` ou `WITH CHECK` — a única propriedade usada para isolar acesso entre tenants é `firm_id`, via `public.current_firm_id()`.

## Alternativas consideradas

- **País por usuário (`firm_users.country_code` ou similar).** Rejeitada explicitamente: um escritório opera sob uma jurisdição fiscal principal — não faz sentido de produto ou de modelo um contador dentro do mesmo escritório "ser" de um país diferente do escritório em que trabalha. Isso também multiplicaria a superfície de inconsistência (o que acontece se dois usuários do mesmo escritório tiverem países diferentes?) sem nenhum caso de uso real que justifique a complexidade.
- **País por cliente (`clients.country_code`).** Também não existe hoje. Não foi encontrada evidência de que isso tenha sido considerado e rejeitado deliberadamente — é simplesmente uma propriedade que não existe no schema atual. Um cliente de um escritório brasileiro é, por definição de produto atual, um cliente operando sob a jurisdição desse escritório.

## Motivos da decisão

- Reflete a realidade de negócio: jurisdição fiscal é uma propriedade do escritório, não do indivíduo.
- Mantém uma única fonte de verdade para "que regras se aplicam aqui" — `firm.country_code` — em vez de espalhar a mesma informação (e o risco de ela divergir) por várias tabelas.
- Ao nunca usar país como critério de autorização, evita criar um segundo eixo de controle de acesso que precisaria ser mantido em sincronia com o isolamento por `firm_id` — um único eixo (`firm_id`) é mais simples de auditar e mais difícil de errar.

## Consequências positivas

- Simplicidade: para saber "que país é este escritório", basta uma leitura em `firms`, sem precisar reconciliar valores potencialmente divergentes de usuário para usuário.
- Superfície de risco menor: como país nunca autoriza nada, um valor errado ou ausente em `country_code` pode, no pior caso, mostrar o calendário fiscal errado ou a moeda errada (um bug de produto) — nunca abrir acesso indevido a dados de outro escritório.

## Consequências negativas

- Não há hoje um mecanismo para um escritório com operação genuinamente multi-jurisdição (ex.: uma rede de escritórios com filiais em países diferentes usando a mesma conta) — o modelo assume um país por escritório. Isso não é um problema no estágio atual (4 escritórios pilotos, nenhum caso assim), mas é uma limitação estrutural conhecida.
- Se no futuro alguém adicionar `country` a queries de relatório ou agregação (por exemplo, um relatório cross-tenant para uso interno da Teglion), existe o risco de essa coluna ser usada, por engano ou atalho, como se fosse um filtro de isolamento — não é, e nunca deve substituir o filtro por `firm_id`. Isso é um risco a vigiar, não um problema já ocorrido.

## Riscos

- O principal risco é conceitual, não técnico hoje: alguém no futuro assumir que `country_code` pode servir como atalho de segmentação de dados (por exemplo, "mostra só os dados dos escritórios do Brasil") sem perceber que isso não é — e nunca deve virar — um mecanismo de autorização. `country_code` pode aparecer dentro de uma query já isolada por `firm_id`, como filtro adicional de relatório, mas nunca no lugar dele.

## Impacto futuro

- Qualquer relatório, dashboard interno ou automação que precise segmentar por país deve fazer isso como um filtro complementar dentro de uma consulta já isolada por `firm_id` (ou explicitamente fora do contexto de tenant, como uma métrica interna da Teglion sobre todos os escritórios — nunca misturando os dois papéis na mesma query sem deixar isso explícito).
- Se o produto algum dia precisar de multi-jurisdição dentro do mesmo escritório, isso exige uma decisão nova, não uma extensão silenciosa deste modelo.

## Relação com outros ADRs

- Depende diretamente do princípio estabelecido em ADR-0001: `firm_id` é o único eixo de isolamento entre tenants. Este ADR existe para deixar explícito que país não é, e não deve se tornar, um segundo eixo.
- Relaciona-se com ADR-0006 (tipo de obrigação `CUSTOM`): o país do escritório é o que determina se o calendário fiscal automático está disponível (`config.features.fiscalCalendar`) ou se o escritório opera com obrigações personalizadas.

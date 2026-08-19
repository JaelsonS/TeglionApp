# ADR-0003 — Supabase como plataforma (Postgres + Auth + Storage + RLS)

## Status

Aceito. Decisão já em vigor, documentada retroativamente em 18/08/2026.

## Contexto

O Teglion precisa de banco de dados relacional, algum mecanismo de autenticação/identidade, armazenamento de arquivos (documentos enviados por clientes e escritórios) e, dado que é multi-tenant, uma camada de controle de acesso a nível de linha. Isso pode ser montado juntando peças separadas (Postgres gerenciado + serviço de auth próprio ou terceiro + S3 ou equivalente + lógica de autorização só na aplicação), ou usando uma plataforma que já entrega várias dessas peças integradas.

A equipe que construiu o Teglion é pequena — o roadmap descreve o estado atual como 4 escritórios pilotos, sem evidência de operação em escala maior ainda.

## Problema

Como montar a infraestrutura de dados do Teglion (banco, storage, mecanismo de controle de acesso) de um jeito que uma equipe pequena consiga operar e manter, sem multiplicar o número de peças móveis e fornecedores a coordenar?

## Decisão

O Teglion usa Supabase como plataforma de dados: Postgres gerenciado, Auth, Storage e Row Level Security (RLS), todos da mesma plataforma. O backend acessa o Supabase via `@supabase/supabase-js` (`^2.106.0`, confirmado em `backend/package.json`), com um cliente administrativo centralizado (`getSupabaseAdmin()`, em `backend/src/db/supabase/client.js`) usando a chave `service_role`. Armazenamento de documentos usa um bucket privado do Supabase Storage (`backend/src/services/storage/contabil-storage.service.js`).

Vale reforçar, em ligação direta com o ADR-0001: o backend usa `service_role`, que ignora RLS — então RLS aqui é uma camada de defesa em profundidade, não o mecanismo primário de isolamento entre escritórios (esse é o filtro explícito por `firm_id` nos repositórios).

## Alternativas consideradas

Não há evidência no repositório de uma avaliação formal e documentada de alternativas (ex.: Postgres gerenciado por outro provedor + serviço de auth separado + S3). O que existe é a decisão já tomada e implementada. Documentamos aqui o raciocínio prático mais provável, sem inventar um processo de avaliação que não está registrado.

## Motivos da decisão

- Uma única plataforma cobrindo banco, autenticação e storage reduz o número de peças móveis, contratos, painéis de administração e superfícies de configuração que uma equipe pequena precisa manter — o que importa mais no estágio atual do Teglion do que a flexibilidade de trocar cada peça independentemente.
- RLS nativa no Postgres do Supabase permite ter uma segunda camada de proteção de dados sem precisar construir esse mecanismo do zero.

## Consequências positivas

- Velocidade de desenvolvimento: menos integrações para configurar e depurar, um único lugar para ver logs de banco, auth e storage.
- RLS disponível "de fábrica" como defesa em profundidade (ver ADR-0001), mesmo que hoje o tráfego principal do backend não passe por ela.

## Consequências negativas

- Acoplamento a um fornecedor específico: migrar para outra plataforma no futuro (por decisão técnica, comercial, ou por limite de escala) exigiria trabalho não trivial em três frentes ao mesmo tempo — banco, auth e storage — em vez de trocar uma peça isolada.
- O uso de `service_role` para acesso administrativo do backend, que é necessário para as operações que o Teglion precisa fazer, tem como efeito colateral que RLS não protege o tráfego principal da aplicação (ver ADR-0001). Isso exige disciplina extra no backend — o filtro explícito por `firm_id` em cada repositório — que não seria necessário da mesma forma se a arquitetura de acesso fosse diferente. Essa é uma consequência direta e honesta de ter escolhido esta plataforma: ela dá RLS "de graça", mas a forma como o backend precisa consumi-la anula boa parte desse benefício por padrão.

## Riscos

- Qualquer interrupção ou degradação de serviço do Supabase afeta banco, autenticação e storage ao mesmo tempo — não há isolamento de falha entre essas três camadas, porque são o mesmo fornecedor.
- Mudanças de precificação, limites de plano, ou descontinuação de funcionalidades do Supabase afetam o Teglion de forma mais ampla do que afetariam se cada peça fosse de um fornecedor diferente.

## Impacto futuro

- Qualquer decisão futura de sair do Supabase (parcial ou totalmente) precisa considerar o impacto simultâneo em banco, auth e storage, e precisa preservar o modelo de isolamento por `firm_id` descrito no ADR-0001 independentemente da plataforma escolhida.
- Se a equipe crescer e a disciplina manual de filtro por `firm_id` se tornar um gargalo de revisão, vale reconsiderar se o acesso do backend deveria migrar de `service_role` para uma chave sujeita a RLS em algum subconjunto de operações — isso mudaria o equilíbrio descrito neste ADR, mas é uma decisão nova, não implícita nesta.

## Relação com outros ADRs

- ADR-0001 depende diretamente desta escolha de plataforma: a razão pela qual RLS é defesa em profundidade (e não a fronteira primária) é uma consequência direta de como o Teglion usa o Supabase.
- ADR-0004 (autenticação própria) é uma decisão que roda em cima desta plataforma, mas não usa o Supabase Auth diretamente para autenticação de usuários do Teglion — ver esse ADR para o porquê.

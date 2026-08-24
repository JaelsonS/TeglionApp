# Due Diligence Técnica — Teglion

Este documento existe para uma situação específica: alguém de fora — um investidor técnico, um comprador avaliando aquisição, um engenheiro sênior decidindo se entra no time — quer saber, sem depender de conversa, o que uma investigação séria no código e na infraestrutura do Teglion encontraria hoje.

Ele não substitui uma due diligence real. Ele organiza o que já foi comprovado por auditoria técnica interna (a mais recente, completa, feita em 18/08/2026) e aponta exatamente onde a investigação de um terceiro deveria olhar com mais cuidado. Onde algo não foi confirmado, está escrito `Pendente de documentação/evidência` — não uma resposta inventada para parecer melhor.

---

## Como ler este documento

Cada área tem um veredito rápido e depois o detalhe. O veredito não é uma nota de 0 a 10 — é uma frase honesta sobre o que se sabe e o que não se sabe.

---

## Arquitetura

**Veredito:** Monólito modular bem estruturado para o estágio atual (4 escritórios), com decisões de isolamento corretas na base. Não foi testado além da escala atual — qualquer afirmação sobre suportar volume maior é hipótese de engenharia, não fato comprovado.

Backend em Node/Express, frontend em React/Vite, banco Postgres via Supabase (que também fornece autenticação e armazenamento de arquivos), Stripe para cobrança, Google Calendar/Drive como integrações de produtividade, Brevo para e-mail e SMS transacional. A separação em módulos por domínio (clientes, documentos, obrigações, mensagens, agendamento, faturamento) é consistente — não é um monólito desorganizado, é um monólito com fronteiras internas claras.

Detalhe completo: [`docs/architecture/`](../architecture/). Decisões registradas formalmente: [`docs/decisions/`](../decisions/).

## Multi-tenancy e isolamento entre clientes (escritórios)

**Veredito:** O modelo é correto — isolamento por `firm_id`, aplicado de forma consistente na camada de repositório, com um teste automatizado no pipeline de CI que falha o build se esse isolamento quebrar. Existe hoje uma falha confirmada e específica (não sistêmica), já identificada e priorizada para correção.

Cada escritório é um tenant. Um usuário pertence a um escritório; um cliente final pertence a um escritório. Toda consulta de dados operacionais no backend filtra por `firm_id`. O banco tem Row Level Security (RLS) como camada adicional, mas o backend acessa via `service_role`, que ignora RLS — ou seja, a fronteira real de proteção é o filtro explícito no código, não a RLS sozinha. Isso é uma decisão de arquitetura válida, mas significa que a disciplina de sempre filtrar por `firm_id` é o que realmente protege os dados, e é por isso que existe um teste de isolamento rodando automaticamente a cada mudança de código.

Uma auditoria de 18/08/2026 confirmou, por leitura direta de código, uma falha real: dois endpoints de rastreamento de visualização de documentos/obrigações leem dados filtrando só por identificador, sem filtrar por escritório — um usuário de um escritório pode, nesse ponto específico, ler quando outro escritório visualizou um documento seu, se souber o identificador exato. É uma falha real, não hipotética, já registrada com prioridade máxima em [`docs/ROADMAP.md`](../ROADMAP.md) (item 0.1). Fora desse ponto específico, o padrão de isolamento auditado nos módulos principais (clientes, documentos, mensagens, cobrança, tarefas, agendamento) está correto.

Detalhe completo: [`docs/security/TENANT_ISOLATION.md`](../security/TENANT_ISOLATION.md).

## Segurança

**Veredito:** Postura de segurança acima da média para o estágio (gate automatizado no CI, disciplina de "implementado vs. parcial vs. não existe" na própria documentação interna), com lacunas concretas e conhecidas, não escondidas.

O que está confirmado como implementado: autenticação própria com JWT em cookie httpOnly, coordenação de sessão entre abas do navegador, RBAC por papel (dono do escritório, equipe, cliente), rate limiting em endpoints sensíveis (login, recuperação de senha), proteção CSRF, e um teste automatizado de isolamento entre tenants rodando no CI.

O que está confirmado como não implementado ou incompleto: autenticação multifator (MFA) — não encontrada no código durante a auditoria. Exportação ou apagamento efetivo de dados pessoais a pedido do titular — hoje o sistema só arquiva (soft-delete), não apaga de fato; isso é uma lacuna igual para GDPR (Portugal/UE) e para LGPD (se e quando o Brasil entrar em produção). Um achado de escalação de privilégio (usuário da equipe conseguindo se promover a dono do escritório) foi registrado em uma auditoria anterior e não tem confirmação documentada de correção — está marcado como pendência de verificação prioritária.

Nenhum resultado de teste de penetração por terceiro, certificação de segurança (SOC 2, ISO 27001) ou auditoria externa formal existe até o momento — `Pendente de documentação/evidência`.

Detalhe completo: [`docs/security/`](../security/).

## Banco de dados e proteção de dados

**Veredito:** Schema flexível (uso de campos JSONB para dados variáveis, sem enums rígidos do Postgres que dificultariam expansão internacional), com uma lacuna de rastreabilidade histórica (parte do schema base foi aplicada manualmente, fora do sistema de migrations versionadas).

Backup automatizado existe (Postgres → Cloudflare R2), e já foi testado com sucesso duas vezes (13/08/2026), com tempo de recuperação observado na prática. Um RPO/RTO formal como meta ainda não foi definido — o que existe é o resultado do teste real, que é uma evidência forte, mas não é a mesma coisa que uma meta contratual definida.

Detalhe completo: [`docs/database/`](../database/).

## Propriedade intelectual e dependências

**Veredito:** `Pendente de documentação/evidência` para a maior parte desta seção — não foi feita, até o momento desta auditoria, uma varredura formal de licenças de dependências de terceiros nem uma confirmação de titularidade de propriedade intelectual do código.

O que se sabe: o projeto usa bibliotecas open source amplamente adotadas no ecossistema Node/React (Express, React, Stripe SDK, Supabase client, entre outras) — não há indício de dependências obscuras ou abandonadas na superfície observada. Uma varredura formal de vulnerabilidades de dependências (`npm audit` ou equivalente, com avaliação de risco real de cada item, não só a contagem bruta) ainda não foi documentada como processo recorrente.

## Infraestrutura e custos operacionais

**Veredito:** Infraestrutura gerenciada (Render para backend, Vercel para frontend, Supabase para banco/auth/storage, Cloudflare R2 para backup) — reduz complexidade operacional para uma equipe pequena, mas os custos reais em escala maior não foram modelados neste documento. `Pendente de documentação/evidência` quanto a projeção de custo por escritório em diferentes volumes.

Detalhe completo: [`docs/infrastructure/`](../infrastructure/).

## Escalabilidade

**Veredito:** Nenhuma capacidade de escala além do volume atual (4 escritórios) foi comprovada por teste de carga real. Existe uma análise de engenharia sobre onde os primeiros gargalos apareceriam (ver roadmap), baseada em código lido, não em medição sob carga.

Isso não significa que o sistema não escale — significa que a afirmação "escala para X" não pode ser feita com honestidade sem o teste. O caminho de escala planejado, estágio por estágio, com o que precisa ser comprovado em cada um, está em [`docs/ROADMAP.md`](../ROADMAP.md), seção "Caminho de escala: 4 → 100.000 escritórios".

## Testes automatizados

**Veredito:** Existe suíte de testes real (não é um projeto sem nenhum teste), com destaque para um teste de isolamento entre tenants que roda no CI. Cobertura de teste como métrica numérica não foi medida — `Pendente de documentação/evidência` quanto a percentual de cobertura.

Detalhe completo: [`docs/testing/TESTING.md`](../testing/TESTING.md).

## Operação e continuidade

**Veredito:** Processo de deploy documentado e usado na prática (staging antes de produção), com um gate de segurança automatizado que bloqueia merge se secrets de staging estiverem ausentes. Não existe, até onde foi confirmado, um processo formal de plantão (on-call) fora do horário em que o fundador está disponível — o que é esperado para o estágio atual (4 escritórios pilotos), mas é um ponto real a resolver antes de operar em escala com clientes pagantes dependentes de disponibilidade contínua.

## O que uma due diligence real deveria aprofundar

Esta lista não é uma tentativa de esconder problemas — é o oposto: é a lista do que um comprador ou investidor técnico sério perguntaria, e que este documento, sozinho, não responde com evidência suficiente:

1. Teste de carga real, não hipótese de engenharia.
2. Varredura formal de dependências e licenças de terceiros.
3. Confirmação por escrito (jurídica, não técnica) da titularidade de propriedade intelectual do código e da marca.
4. Auditoria de segurança por terceiro independente (pentest formal).
5. Confirmação de correção do achado de escalação de privilégio mencionado acima.
6. Correção da falha de isolamento confirmada (item 0.1 do roadmap) — verificar se já foi corrigida no momento da leitura deste documento.
7. Validação jurídica de LGPD antes de qualquer operação real no Brasil.
8. Projeção de custo de infraestrutura em diferentes volumes de escritórios.

Cada um destes itens tem um responsável e um estado real em [`docs/ROADMAP.md`](../ROADMAP.md) — este documento não deveria ser lido isoladamente, deveria ser lido junto com o roadmap para saber o que já mudou desde a data desta versão.

# Arquitetura de dados

> Fontes consolidadas: `docs/04-ARQUITETURA/STORAGE.md` (removido após esta migração) e as partes sobre dado e armazenamento de `docs/04-ARQUITETURA/ARCHITECTURE.md` e `BACKEND.md`. O schema relacional em si (tabelas, colunas, RLS, migrations) é documentado à parte — ver `docs/database/DATABASE.md`; este documento foca em onde e como o dado *vive*, não no seu schema.

## Duas naturezas de dado, dois lugares diferentes

Guardo dado operacional (estruturado, relacional) e conteúdo de arquivo (binário) em dois sistemas diferentes, ambos dentro do mesmo projeto Supabase, mas com propriedades bem distintas:

- **Postgres (Supabase)** — todo dado operacional: escritório, usuário, cliente, obrigação, tarefa, mensagem, agendamento, configuração. Estruturado, consultável, com relação entre tabelas. Todo esse dado carrega `firm_id` como coluna de propriedade do tenant (ver [MULTI_TENANCY.md](./MULTI_TENANCY.md)).
- **Supabase Storage** — o conteúdo binário de arquivo (documento enviado por cliente ou escritório). Não é consultável como uma tabela; é armazenamento de objeto, endereçado por chave.

Um documento, no Teglion, é sempre as duas coisas ao mesmo tempo: uma linha na tabela de documentos (metadado — nome, tipo, cliente dono, data, quem enviou, `firm_id`) e um objeto no bucket de Storage (o conteúdo em si). A linha aponta para a chave do objeto; o objeto, sozinho, sem a linha correspondente, não tem contexto de dono.

## Armazenamento de arquivo

Criei um bucket privado dedicado a documento de cliente (`contabil-documents`, ver `backend/src/services/storage/contabil-storage.service.js`) — não público, não acessível sem autenticação, nunca listável de fora do backend.

### Estrutura da chave

Salvo cada arquivo com um caminho que já embute o `firm_id` e o `client_id` do dono do documento, além de um identificador único. Isso torna a chave do arquivo não adivinhável por tentativa, mesmo que alguém quisesse acessar um caminho diretamente sem passar pela aplicação.

### Como o download funciona

Por padrão, sempre por um proxy do próprio backend: meu backend baixa o arquivo do Supabase Storage e devolve o conteúdo diretamente na resposta HTTP, nunca expondo uma URL assinada do Supabase diretamente ao navegador. Escolhi esse caminho porque evita um padrão comum de risco (URL assinada vazando por log, histórico de navegador ou compartilhamento acidental) e mantém o backend como ponto único de decisão sobre quem pode baixar o quê, a cada requisição — não só no momento de gerar um link.

Deixei uma exceção pontual: o download de documento entregue através do mini-portal de captação de serviço usa uma URL assinada direta, em vez do proxy — ainda restrita à equipe do escritório e ainda vinculada ao `firm_id` correto antes de ser gerada, mas um padrão diferente do resto do sistema. Vale unificar por consistência, ainda que isso não configure um risco de vazamento cross-tenant confirmado.

### Proteção em camada

Montei três camadas independentes que protegem contra acesso cruzado a documento:

1. **Aplicação** — toda busca de documento exige `firm_id` e, quando o ator é cliente, também `client_id`, extraídos da sessão autenticada.
2. **Caminho do arquivo** — não adivinhável, porque embute os identificadores do dono mais um identificador único.
3. **Políticas do Supabase Storage** — diferente do banco relacional (onde a `service_role` do meu backend ignora RLS, ver [MULTI_TENANCY.md](./MULTI_TENANCY.md)), o acesso ao Storage passa por um caminho que efetivamente respeita as próprias políticas de segurança do serviço. É a única das três camadas onde a proteção "de plataforma" está realmente em vigor sobre o tráfego real, não só declarada no schema.

### Upload

Não baseio a validação de tipo de arquivo só no que o navegador declara — verifico o conteúdo binário contra a assinatura real do formato antes de aceitar o upload, o que impede um arquivo malicioso disfarçado com uma extensão inofensiva.

## Dado efêmero: Redis

Uso Redis no Teglion para dado que não precisa (e não deve) viver no Postgres operacional: cache de leitura, limitação de taxa de requisição, e a única fila real do sistema hoje (lembrete de obrigação por escritório — ver [BACKEND.md](./BACKEND.md)). Não é fonte de verdade para nenhum dado de negócio; é estado auxiliar, descartável, que posso reconstruir a qualquer momento.

## Onde aprofundar

- `docs/database/DATABASE.md` — schema relacional, migrations, índices, RLS.
- [MULTI_TENANCY.md](./MULTI_TENANCY.md) — por que `firm_id` é a fronteira real de isolamento, no banco e no Storage.
- [`docs/product/PRODUCT.md`](../product/PRODUCT.md) — o fluxo de documento do ponto de vista de produto (categorização, pedido de documento, validação pelo escritório).

# Redis — Setup de Produção (Render ou Upstash)

> Fonte: `docs/operations/REDIS_RENDER_SETUP.md` (pasta antiga, removida após esta consolidação). Editado para PT-BR, sem reescrita de conteúdo técnico.

## Objetivo

Uso Redis para rate limit, lock e fila de jobs. Em produção **multi-instância**, isso é obrigatório. Com **uma única instância** no plano free do Render, o fallback in-memory funciona para o piloto — mas não é a configuração que recomendo assim que existir mais de um escritório pagante.

## Opção A — Upstash Redis (recomendado no plano free)

Upstash tem tier gratuito, TLS, e funciona bem com o Render sem precisar do Redis pago da própria Render.

1. Crio conta em [upstash.com](https://upstash.com) → Redis → Create database.
2. Escolho a região mais próxima do Render (ex. `eu-west-1` / Frankfurt se a API estiver na EU).
3. Copio a **Redis URL** (`rediss://...` com TLS).
4. No Render → Environment do backend, coloco `REDIS_URL` = URL `rediss://...` do Upstash.
5. Salvo → redeploy.
6. Nos logs, confirmo que **não** aparece fallback in-memory contínuo.

Os limites do free tier Upstash dão conta do piloto (rate limit + lockout). Não é "ilimitado", mas é seguro e robusto para poucos escritórios + clientes.

## Opção B — Redis nativo no Render (pago)

1. No Render, crio serviço Redis na mesma região da API.
2. Uso a **Internal URL** em `REDIS_URL` (mais rápido e privado).
3. Em desenvolvimento local: uso External URL com TLS, ou removo `REDIS_URL`.

## Configurar a API

No serviço backend do Render, defino:

- `REDIS_URL`: Upstash `rediss://...` **ou** Internal URL do Redis Render.

Regra que sigo:

- Produção: sempre URL com TLS (`rediss://`) quando o Redis está fora da rede privada.
- Desenvolvimento local: External URL com TLS ou removo `REDIS_URL`.

## Validar conexão

Depois do deploy do backend, confiro nos logs:

- Mensagem de Redis ativo, sem fallback para memory store.
- Ausência de warning de fail-open em rate limit.

## Teste funcional mínimo

1. Faço múltiplos requests rápidos em rota protegida e confirmo a limitação.
2. Testo login repetido com credenciais erradas e confirmo o lockout.
3. Rodo o gate completo com `npm run release:readiness`.

## Segurança e operação

1. Não commito `REDIS_URL` no Git.
2. Prefiro TLS (`rediss://`) e região próxima da API.
3. Monitoro uso de memória e conexões ativas (dashboard Upstash ou Render).
4. Configuro alerta para erro de conexão Redis.

## Troubleshooting rápido

Se aparecer fallback para memory store, sigo esta ordem:

1. Confiro se `REDIS_URL` está definida no ambiente certo.
2. Confiro se a URL é `rediss://` (TLS) correta.
3. Confiro se API e Redis estão na mesma região (ou com latência aceitável).
4. Reinicio o deploy da API depois de salvar a variável.

Se o erro for local, com URL interna do Render:

1. Troco para External URL / Upstash temporariamente.
2. Ou removo `REDIS_URL` local para não bloquear o desenvolvimento.

## Definição de pronto

Redis está pronto quando:

- Não existe warning de fallback em produção.
- Rate limit e lockout estão de fato funcionando.
- O gate de release passa com Redis ativo.

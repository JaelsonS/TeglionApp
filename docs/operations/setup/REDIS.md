# Redis — Setup de Produção (Render ou Upstash)

> Fonte: `docs/operations/REDIS_RENDER_SETUP.md` (pasta antiga, removida após esta consolidação). Editado para PT-BR, sem reescrita de conteúdo técnico.

## Objetivo

Redis é usado para rate limit, lock e fila de jobs. Em produção **multi-instância**, isso é obrigatório. Com **uma única instância** no plano free do Render, o fallback in-memory funciona para o piloto — mas não é a configuração recomendada assim que existir mais de um escritório pagante.

## Opção A — Upstash Redis (recomendado no plano free)

Upstash tem tier gratuito, TLS, e funciona bem com o Render sem precisar do Redis pago da própria Render.

1. Criar conta em [upstash.com](https://upstash.com) → Redis → Create database.
2. Região: a mais próxima do Render (ex. `eu-west-1` / Frankfurt se a API estiver na EU).
3. Copiar a **Redis URL** (`rediss://...` com TLS).
4. No Render → Environment do backend: `REDIS_URL` = URL `rediss://...` do Upstash.
5. Save → redeploy.
6. Nos logs, confirmar que **não** aparece fallback in-memory contínuo.

Limites típicos do free tier Upstash: suficientes para o piloto (rate limit + lockout). Não é "ilimitado", mas é seguro e robusto para poucos escritórios + clientes.

## Opção B — Redis nativo no Render (pago)

1. No Render, criar serviço Redis na mesma região da API.
2. Usar **Internal URL** em `REDIS_URL` (mais rápido e privado).
3. Em desenvolvimento local: External URL com TLS, ou remover `REDIS_URL`.

## Configurar a API

No serviço backend do Render, definir:

- `REDIS_URL`: Upstash `rediss://...` **ou** Internal URL do Redis Render.

Regra a seguir:

- Produção: sempre URL com TLS (`rediss://`) quando o Redis está fora da rede privada.
- Desenvolvimento local: External URL com TLS ou remover `REDIS_URL`.

## Validar conexão

Depois do deploy do backend, verificar nos logs:

- Mensagem de Redis ativo, sem fallback para memory store.
- Ausência de warning de fail-open em rate limit.

## Teste funcional mínimo

1. Fazer múltiplos requests rápidos em rota protegida e confirmar limitação.
2. Testar login repetido com credenciais erradas e confirmar lockout.
3. Rodar o gate completo com `npm run release:readiness`.

## Segurança e operação

1. Não commitar `REDIS_URL` no Git.
2. Preferir TLS (`rediss://`) e região próxima da API.
3. Monitorar uso de memória e conexões ativas (dashboard Upstash ou Render).
4. Configurar alerta para erro de conexão Redis.

## Troubleshooting rápido

Se aparecer fallback para memory store:

1. Confirmar se `REDIS_URL` está definida no ambiente certo.
2. Confirmar se a URL é `rediss://` (TLS) correta.
3. Confirmar se API e Redis estão na mesma região (ou com latência aceitável).
4. Reiniciar o deploy da API depois de salvar a variável.

Se o erro for local, com URL interna do Render:

1. Trocar para External URL / Upstash temporariamente.
2. Ou remover `REDIS_URL` local para não bloquear o desenvolvimento.

## Definição de pronto

Redis está pronto quando:

- Não existe warning de fallback em produção.
- Rate limit e lockout estão de fato funcionando.
- O gate de release passa com Redis ativo.

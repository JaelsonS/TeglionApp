# Redis — Setup de Produção (Render ou Upstash)

Este é o meu passo a passo para deixar Redis activo de forma estável com a API no Render.

## Objetivo

Eu uso Redis para rate limit, lock e fila de jobs. Em produção **multi-instância**, isto é obrigatório. Com **uma só instância** no plano free do Render, o fallback in-memory funciona para o piloto.

## Opção A — Upstash Redis (recomendado no plano free)

Upstash tem tier gratuito, TLS, e funciona bem com Render sem precisar do Redis pago da Render.

1. Criar conta em [upstash.com](https://upstash.com) → Redis → Create database.
2. Região: a mais próxima do Render (ex. `eu-west-1` / Frankfurt se a API estiver na EU).
3. Copiar a **Redis URL** (`rediss://...` com TLS).
4. No Render → Environment do backend:
   - `REDIS_URL` = URL `rediss://...` do Upstash
5. Save → redeploy.
6. Nos logs, confirmar que **não** aparece fallback in-memory contínuo.

Limites típicos do free tier Upstash: suficientes para piloto (rate limit + lockout). Não é “ilimitado”, mas é seguro e robusto para 1 escritório + clientes.

## Opção B — Redis nativo no Render (pago)

1. No Render, criar serviço Redis na mesma região da API.
2. Usar **Internal URL** em `REDIS_URL` (mais rápido e privado).
3. Em desenvolvimento local: External URL com TLS, ou remover `REDIS_URL`.

## Configurar a API

No serviço backend do Render, eu defino:

- `REDIS_URL`: Upstash `rediss://...` **ou** Internal URL do Redis Render.

Regra que eu sigo:

- Produção: sempre URL com TLS (`rediss://`) quando o Redis está fora da rede privada.
- Desenvolvimento local: External URL com TLS ou removo `REDIS_URL`.

## Validar conexão

Depois do deploy do backend, eu verifico logs e procuro:

- Mensagem de Redis activo sem fallback para memory store.
- Ausência de warning de fail-open em rate limit.

## Teste funcional mínimo

1. Faço múltiplos requests rápidos em rota protegida e confirmo limitação.
2. Testo login repetido com credenciais erradas e confirmo lockout.
3. Rodo o gate completo com `npm run release:readiness`.

## Segurança e operação

1. Eu não comito `REDIS_URL` no Git.
2. Prefiro TLS (`rediss://`) e região próxima da API.
3. Eu monitorizo uso de memória e conexões activas (dashboard Upstash ou Render).
4. Eu configuro alerta para erro de conexão Redis.

## Troubleshooting rápido

Se eu vir fallback para memory store:

1. Confirmo se `REDIS_URL` está definida no ambiente certo.
2. Confirmo se a URL é `rediss://` (TLS) correcta.
3. Confirmo se API e Redis estão na mesma região (ou latência aceitável).
4. Reinicio deploy da API após salvar env.

Se eu estiver no local e receber erro de URL interna Render:

1. Troco para External URL / Upstash temporariamente.
2. Ou removo `REDIS_URL` local para não bloquear desenvolvimento.

## Definição de pronto

Eu considero Redis pronto quando:

- Não existe warning de fallback em produção.
- Rate limit e lockout estão efectivamente a funcionar.
- Gate de release passa com Redis activo.

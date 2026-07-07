# Redis no Render — Setup de Produção

Este é o meu passo a passo para deixar Redis activo de forma estável no Render.

## Objetivo

Eu uso Redis para rate limit, lock e fila de jobs. Em produção multi-instância, isto é obrigatório.

## 1. Criar Redis no Render

1. No Render, eu crio um novo serviço Redis.
2. Eu escolho região próxima da API (idealmente a mesma região).
3. Eu guardo duas URLs:
- Internal URL: uso interno na rede Render.
- External URL: uso fora da rede Render.

## 2. Configurar a API

No serviço backend do Render, eu defino:

- REDIS_URL: uso a Internal URL do Redis.

Regra que eu sigo:

- Produção no Render: prefiro Internal URL.
- Desenvolvimento local: uso External URL com TLS ou removo REDIS_URL.

## 3. Validar conexão

Depois do deploy do backend, eu verifico logs e procuro:

- Mensagem de Redis activo sem fallback para memory store.
- Ausência de warning de fail-open em rate limit.

## 4. Teste funcional mínimo

Eu executo estes testes após subir Redis:

1. Faço múltiplos requests rápidos em rota protegida e confirmo limitação.
2. Testo login repetido com credenciais erradas e confirmo lockout.
3. Rodo o gate completo com:
- npm run release:readiness

## 5. Segurança e operação

1. Eu não comito REDIS_URL no Git.
2. Eu rodo Redis e API no mesmo provider/rede quando possível.
3. Eu monitorizo uso de memória e conexões activas.
4. Eu configuro alerta para erro de conexão Redis.

## 6. Troubleshooting rápido

Se eu vir fallback para memory store:

1. Confirmo se REDIS_URL está definida no ambiente certo.
2. Confirmo se a URL é Internal URL correta do serviço Redis.
3. Confirmo se API e Redis estão na mesma região.
4. Reinicio deploy da API após salvar env.

Se eu estiver no local e receber erro de URL interna Render:

1. Troco para External URL temporariamente.
2. Ou removo REDIS_URL local para não bloquear desenvolvimento.

## Definição de pronto

Eu considero Redis pronto quando:

- Não existe warning de fallback em produção.
- Rate limit e lockout estão efectivamente a funcionar.
- Gate de release passa com Redis activo.

# Burp — superfície pública / portal (manual Jaelson)

**Ambiente:** staging apenas. **Não** produção.

## Casos a executar

| # | Caso | Esperado |
| --- | --- | --- |
| 1 | Token A → path/pedido B | 403/404 genérico |
| 2 | requestId B noutro inquiry | 403/404 |
| 3 | inquiryId B | 403/404 |
| 4 | firmId B no body | ignorado / 403 |
| 5 | tag B noutro pedido | rejeitada / filtrada |
| 6 | MIME adulterado no upload | rejeição |
| 7 | Extensão adulterada | rejeição |
| 8 | Ficheiro demasiado grande | 413/400 |
| 9 | Polyglot / conteúdo proibido | rejeição |
| 10 | Replay token Turnstile | 403 |
| 11 | Spam reply | 429 |
| 12 | POST sem Turnstile | 403 `TURNSTILE_MISSING` |
| 13 | POST Turnstile inválido | 403 |

## Nunca deve aparecer

dados privados · stack trace · firm diferente · `storageKey` · token interno

## Resultado

Preencher após execução Burp. Até lá: **MANUAL / NOT RUN**.

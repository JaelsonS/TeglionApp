# Maya Coach — redesign da Página pública

Produto **Teglion** (AfDigital). Auditoria e estado da **fase 1** (Coach Mode).

## Antes (staging pós PR #166–#168)

| Problema | Causa |
|----------|--------|
| Parede de blocos | `mayaSetup=1` empilhava rail, stepper, chat, questionário, checklist A/B/C e preview |
| Sem estúdio fora do query param | Utilizador normal só via checklist + secções vazias |
| Três «Mayas» | FAB, chat estúdio, AskMaya com mensagens diferentes |
| Footer «duplo» | Preview embebido alto + rodapé legal do site + crédito shell |
| IA = questionário | 6+ passos em vez de exemplo completo substituível |

## Depois (fase 1)

| Entrega | Comportamento |
|---------|----------------|
| **Modo Simples / Avançado** | Simples por defeito (`sessionStorage`); Avançado = editor anterior (checklist completa, extras, estúdio IA se `coach=1`) |
| **Coluna Maya Coach** | Chat único (`MayaPublicSiteCopilotChat`) + faixa por zona A/B |
| **Progresso compacto** | Banner «N de M passos» em Simples; checklist grande só em Avançado |
| **Exemplo AfDigital** | `POST /contabil/maya-setup/demo-seed` — rascunho rico, serviços públicos, agenda; **não publica** |
| **Redirect** | `mayaSetup=1` → `tab=pagina-publica&coach=1` |
| **Layout** | Grelha coach + editor; preview com `max-height` menor em Simples |

### Oculto em modo Simples

- `MayaPublicSiteSetupRail`
- `MayaPublicSiteInlineSetup` (questionário completo)
- `PublicSitePublishReadinessChecklist` (substituído pelo banner)
- Banner «preview questionário não guardado»
- Parágrafo longo introdutório em B · Secções
- Estúdio IA completo (Avançado + `coach=1` mantém legado)

### Visível em modo Simples

- Toggle Simples / Avançado
- Chat Maya (guias + advise IA se entitlement)
- Faixa coach em **A** (link/publicar) e **B** (secção aberta)
- Painel «Ver exemplo completo (AfDigital)» (se `demoOffice` nas capabilities)
- A · B · C (C colapsado por defeito), preview ao vivo

## Fase 2 (fora deste pacote mínimo)

- Prompt único → generate + apply demo numa acção confirmada
- Tour pós-seed (realce no preview «substitua aqui»)

## UAT (staging)

1. Definições → Página pública → modo **Simples**, uma coluna Maya, sem checklist grande.
2. Owner com demo activo → «Exemplo AfDigital» → preview com textos/secções; slug **não** publicado automaticamente.
3. Abrir **A** → faixa Maya; abrir secção **hero** → faixa B; chat mostra dica «Agora».
4. Footer shell = uma linha AfDigital; scroll da página não empurra footer gigante.
5. **Avançado** → checklist e controlos anteriores intactos.
6. Link antigo `mayaSetup=1` redirecciona para `coach=1`.

## Env (demo seed)

Ver `.env.example` — `MAYA_DEMO_OFFICE_*` e `MAYA_DEMO_ASSETS_*`.

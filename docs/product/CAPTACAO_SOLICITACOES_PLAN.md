# Captação & Solicitações — Plano aprovado (ajustado)

**Estado:** Fase A feita · Fase B/C em curso · UI/UX das 4 telas a seguir  
**Branding:** usar tokens do sistema (`--cb-brand`, `--primary`, componentes shadcn existentes). Não introduzir paletas azuis genéricas dos mockups — só a **organização** dos ecrãs.

## Produção

- Google Calendar Fase 1 e Google Drive Fase 2 já em `main` (`7e0a0df`).
- Fase A (obrigado + sem docs automáticos) em `main` (`d9164de`).
- Fase B/C (shell Serviços + inbox + etiquetas) em branch `feat/captacao-fase-b-c-services-inbox`.

## Esclarecimento de etiquetas (aprovado)

A **contadora** cria as etiquetas (nome + cor).  
No Catálogo/serviço, define regras: “se a resposta for X → aplicar etiqueta Y”.  
Quando o pedido chega a Solicitações, já vem com a cor e o nome que ela definiu.

Não usar categorias fixas do sistema (“Atenção/Fácil”) como única opção — essas podem existir como **sugestões** ao criar etiquetas, mas a fonte de verdade é a lista dela.

## Fases

| Fase | Conteúdo | Estado |
|------|----------|--------|
| **A** | Email/ecrã de obrigado; sem checklist automática; sem CTA “enviar documentos” na submissão | Feito |
| **B** | Reformular shell Serviços (tabs) com componentes/branding actuais | Em curso |
| **C** | Inbox Solicitações + badges de etiquetas da contadora | Em curso |
| **D** | Pedido multi-item (docs + perguntas) | Próximo |
| **E** | Confirmar agendamento → email | Próximo |
| **F** | Editor Catálogo auto-explicativo + regras de etiquetas | Próximo |
| **G** | `visibleIf` completo (depois) | Depois |

Stripe Connect (Fase 3 integrações) só depois deste bloco.

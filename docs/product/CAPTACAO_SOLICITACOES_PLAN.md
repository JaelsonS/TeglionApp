# Captação & Solicitações — Plano aprovado (ajustado)

**Estado:** Fase A em implementação · UI/UX das 4 telas a seguir  
**Branding:** usar tokens do sistema (`--cb-brand`, `--primary`, componentes shadcn existentes). Não introduzir paletas azuis genéricas dos mockups — só a **organização** dos ecrãs.

## Produção

- Google Calendar Fase 1 e Google Drive Fase 2 já em `main` (`7e0a0df`).
- Esta iniciativa (obrigado + etiquetas) segue em branch própria até merge.

## Esclarecimento de etiquetas (aprovado)

A **contadora** cria as etiquetas (nome + cor).  
No Catálogo/serviço, define regras: “se a resposta for X → aplicar etiqueta Y”.  
Quando o pedido chega a Solicitações, já vem com a cor e o nome que ela definiu.

Não usar categorias fixas do sistema (“Atenção/Fácil”) como única opção — essas podem existir como **sugestões** ao criar etiquetas, mas a fonte de verdade é a lista dela.

## Fases

| Fase | Conteúdo |
|------|----------|
| **A** | Email/ecrã de obrigado; sem checklist automática; sem CTA “enviar documentos” na submissão |
| **B** | Reformular shell Serviços (tabs) com componentes/branding actuais |
| **C** | Inbox Solicitações + badges de etiquetas da contadora |
| **D** | Pedido multi-item (docs + perguntas) |
| **E** | Confirmar agendamento → email |
| **F** | Editor Catálogo auto-explicativo + regras de etiquetas |
| **G** | `visibleIf` completo (depois) |

Stripe Connect (Fase 3 integrações) só depois deste bloco.

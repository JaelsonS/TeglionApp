# Estúdio da página pública

Produto **Teglion** · AfDigital — Soluções Tecnológicas.

## O que é

Um único ecrã em **Definições → Página pública** (`mayaSetup=1`):

| Zona | Função |
|------|--------|
| **Passos 1–2–3** | Contar → Rever → Publicar |
| **Chat Maya** | Perguntas em texto — guias estáticos (grátis) + respostas IA curtas (add-on `ai`) |
| **Questionário** | Rascunho com IA (1 geração/sessão) |
| **Preview** | Ao vivo (telemóvel/tablet/desktop + nova aba) |
| **Secções** | Edição manual profissional (imagens, legal, publicar) |

## O que não é

- Não publica automaticamente.
- Não substitui aconselhamento fiscal.
- A Maya guia (FAB) continua disponível em todo o escritório; no estúdio o chat está integrado.

## Assistente de activação

Continua a ser o **mapa geral** do escritório (perfil → página → serviços → clientes). O estúdio é o sítio certo para **construir a página**.

## API

- `POST /contabil/maya-setup/advise` — dúvidas curtas (mesmo entitlement que Setup IA).
- `POST …/sessions/:id/generate` — proposta completa (consumo principal).

Ver também `docs/product/MAYA_OFFICE_ACTIVATION.md`.

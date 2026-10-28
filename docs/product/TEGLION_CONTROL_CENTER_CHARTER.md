# Teglion Control Center (AfDigital Ops)

**Actualizado:** 28 de outubro de 2026  
**Operador:** AfDigital — Soluções Tecnológicas (Teglion é o produto, não a entidade jurídica)

## O que eu construí

Eu criei o Control Center para a AfDigital operar o SaaS com responsabilidade: ver gabinetes, actuar quando há abuso, acompanhar saúde e **não** misturar isso com a área do escritório comercial.

É um painel interno (`/app/ops`), separado da experiência do contabilista e do portal do cliente.

## O que o operador pode fazer (visão de produto)

- Ver gabinetes (incluindo os que acabaram de se registar) e actividade recente
- Suspender / reactivar / gerir trial / cancelar (sem apagar dados fiscais)
- Consultar auditoria e tentativas de login (metadados — sem conteúdo fiscal de clientes)
- Acompanhar sinais de abuso e erros (Sentry)
- Gerir bloqueios de abuso na API (denylist) quando necessário
- Exportar relatórios operacionais (CSV)

## Modelo de segurança (o que eu exijo)

1. O Center só liga com flag de ambiente dedicada — desligado por defeito.
2. Só contas AfDigital autorizadas (configuração no servidor; **nunca** documento emails aqui).
3. Reutilizo a sessão do produto (cookies HttpOnly) + **MFA obrigatória** no operador.
4. Contas ops aterraram em `/app/ops` — não navegam o painel firm como se fossem um gabinete.
5. Clientes do portal **nunca** acedem.
6. Acções do Center geram audit logs com papel de plataforma.
7. Sem chave administrativa no browser.
8. Dados no Center: **metadados**. Excluo NIF de clientes, documentos, conteúdo fiscal, hashes e códigos de recuperação.

Detalhes operacionais (variáveis exactas, procedimentos de emergência) ficam no **runbook interno** da AfDigital, fora deste repo público.

## Ondas (estado)

| Onda | Conteúdo | Estado |
|------|----------|--------|
| 0–1 | Authz, listas, gestão básica de gabinetes | Em produção (gated) |
| 2 | Novos gabinetes, trial/cancel, geo, abuso, Sentry | Em produção (gated) |
| 3 | Defesa na API (denylist) + UI ops | Em produção (gated) |
| 3b+ | Endurecimento edge / crescimento (NPS, campanhas) | Planejado |

## Soft launch e escala

Depois do soft launch (29/10/2026) eu cresço **gradualmente**:

- Semana 1: volume baixo; plantão humano; Center ligado só com MFA
- Semanas seguintes: só aumento de capacidade (2.ª instância API) **com Redis partilhado saudável**
- Sem Redis estável eu **não** faço scale-out horizontal — rate limits e lockouts partem-se entre processos

## Fora de âmbito (por agora)

- Impersonation de utilizadores de gabinete
- Hard-delete fiscal
- Campanhas massivas no dia da divulgação
- Documentar no GitHub público checklists de ataque ou limiares exactos de abuso

Carta relacionada (produto fiscal V10): [`V10_OPS_FISCAL_CHARTER.md`](./V10_OPS_FISCAL_CHARTER.md)  
Roadmap: [`../ROADMAP.md`](../ROADMAP.md)

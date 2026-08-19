# Resposta a incidentes de segurança

> **Fontes consolidadas neste documento:** nenhum documento-fonte dedicado a resposta a incidentes de segurança foi encontrado em `docs/06-SEGURANCA/` ou `docs/security/` — este documento é escrito a partir do que foi verificado em código nesta reescrita (19/08/2026): `backend/src/services/audit/security-audit.service.js`, e a menção a Sentry em `docs/06-SEGURANCA/SECURITY.md` (removido após esta migração). Não confundir com runbooks operacionais de incidente de produto/infraestrutura (deploy quebrado, outage) — esses existem em `docs/operations/INCIDENT_RUNBOOK.md` e `docs/07-OPERACAO/INCIDENTS.md`, fora do escopo deste documento e mantidos por outra frente da documentação.

Este documento é sobre um tipo específico de incidente: suspeita ou confirmação de vazamento de dado entre escritórios, comprometimento de conta, ou exploração de uma vulnerabilidade de segurança. É deliberadamente mais curto que os outros documentos desta pasta — porque não existe hoje um processo formal de resposta a incidente de segurança, e inventar um processo detalhado que não é seguido na prática seria pior do que admitir a lacuna.

## O que existe hoje

**Trilha de auditoria para detecção — `PARCIAL`.** `backend/src/services/audit/security-audit.service.js` grava eventos sensíveis (login falho, conta bloqueada, reset de senha, mutação de equipe — incluindo tentativas de escalação de privilégio como as cobertas por SEC-H1, acesso e mutação de documento/cliente/obrigação) com IP, user agent e ator. Isso dá material para investigar um incidente depois que alguém percebe que ele aconteceu — não é, por si só, um sistema de alerta que avisa proativamente durante o incidente.

**Monitoramento de erro — `PARCIAL`.** Sentry está integrado para reportar erros 5xx, mas é opcional na inicialização — o sistema sobe em produção mesmo sem a chave configurada, sem travar e sem avisar ninguém. Isso significa que não há garantia de que todo ambiente de produção real está de fato emitindo para o Sentry hoje sem uma verificação direta do valor da variável de ambiente em produção.

**Capacidade técnica de conter uma sessão comprometida — `IMPLEMENTADO`.** Existe o mecanismo (`authRefreshSessionsRepository.deleteAllForActor`) para revogar todas as sessões de um ator específico — usado hoje na desativação de funcionário e na revogação de acesso de cliente (ver `AUTHENTICATION.md`). Isso significa que, tecnicamente, é possível reagir a "esta conta foi comprometida" revogando sessão na hora — mas não existe um runbook escrito descrevendo quando e como um operador humano deveria acionar isso durante um incidente.

## O que falta formalizar — `NÃO IMPLEMENTADO`

Não existe hoje, em nenhum documento encontrado:

- **Um runbook de resposta a incidente de segurança** — quem é acionado, em que ordem, com qual autoridade para tomar decisões como revogar sessões em massa, desligar uma integração, ou colocar o sistema em modo de manutenção.
- **Um processo de triagem de severidade** — o que diferencia um incidente que exige comunicação imediata ao cliente de um que pode ser corrigido silenciosamente e revisado depois.
- **Um plano de comunicação de violação de dados** — para os escritórios pilotos (clientes B2B do Teglion) e, por extensão, para os clientes finais deles. Isso é relevante tanto por obrigação legal (GDPR em Portugal exige notificação em prazo definido para certas categorias de incidente; LGPD terá exigência equivalente quando a expansão ao Brasil acontecer) quanto por confiança — um escritório de contabilidade que descobre um vazamento pela imprensa antes de ouvir do fornecedor não continua cliente.
- **Um contato de segurança designado** — não foi encontrado um e-mail, canal ou processo formal para alguém (interno ou externo, incluindo um pesquisador de segurança que encontre uma falha) reportar um problema de segurança encontrado.
- **Retenção e revisão periódica da trilha de auditoria** — a trilha existe (ver acima), mas não há evidência de um processo de revisão regular dela, nem uma política de por quanto tempo esses registros são mantidos.

## Por que isso importa no estágio atual

Com 4 escritórios pilotos pagantes e um risco cross-tenant já confirmado e em aberto (ver `TENANT_ISOLATION.md`), a pergunta "o que fazemos se descobrirmos que esse vazamento foi explorado de verdade, não só teoricamente possível" não tem resposta escrita hoje. Isso não bloqueia operar o produto no estágio de piloto, mas é uma lacuna que fica mais cara de resolver depois de um incidente real do que antes — e é exatamente o tipo de item que uma due diligence de aquisição ou um auditor de segurança externo vai perguntar primeiro.

## O que não foi verificado nesta revisão

Não foi verificado se existe algum processo informal (combinado verbalmente entre a equipe, não documentado) que já cobre parte disso na prática — este documento reflete apenas o que está escrito e verificável em código ou documentação, não o que pode existir só na cabeça de quem opera o sistema hoje.

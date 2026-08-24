# Resposta a incidentes de segurança

> **Fontes que consolidei neste documento:** não encontrei nenhum documento-fonte dedicado a resposta a incidentes de segurança em `docs/06-SEGURANCA/` ou `docs/security/` — escrevo este documento a partir do que verifiquei em código nesta reescrita (19/08/2026): `backend/src/services/audit/security-audit.service.js`, e a menção a Sentry em `docs/06-SEGURANCA/SECURITY.md` (removido depois desta migração). Não confundir com runbooks operacionais de incidente de produto/infraestrutura (deploy quebrado, outage) — esses existem em `docs/operations/INCIDENT_RUNBOOK.md` e `docs/07-OPERACAO/INCIDENTS.md`, fora do escopo deste documento e mantidos por outra frente da minha documentação.

Este documento é sobre um tipo específico de incidente: suspeita ou confirmação de vazamento de dado entre escritórios, comprometimento de conta, ou exploração de uma vulnerabilidade de segurança. É deliberadamente mais curto que os outros documentos desta pasta — porque hoje não tenho um processo formal de resposta a incidente de segurança, e inventar um processo detalhado que não sigo na prática seria pior do que admitir a lacuna.

## O que já tenho hoje

**Trilha de auditoria para detecção — `PARCIAL`.** `backend/src/services/audit/security-audit.service.js` grava eventos sensíveis (login falho, conta bloqueada, reset de senha, mutação de equipe — incluindo tentativas de escalação de privilégio como as cobertas por SEC-H1, acesso e mutação de documento/cliente/obrigação) com IP, user agent e ator. Isso me dá material pra investigar um incidente depois que percebo que ele aconteceu — não é, por si só, um sistema de alerta que me avisa proativamente durante o incidente.

**Monitoramento de erro — `PARCIAL`.** Integrei o Sentry pra reportar erros 5xx, mas é opcional na inicialização — o sistema sobe em produção mesmo sem eu ter configurado a chave, sem travar e sem avisar ninguém. Isso significa que não tenho garantia de que todo ambiente de produção real está de fato emitindo para o Sentry hoje sem eu checar diretamente o valor da variável de ambiente em produção.

**Capacidade técnica de conter uma sessão comprometida — `IMPLEMENTADO`.** Tenho o mecanismo (`authRefreshSessionsRepository.deleteAllForActor`) pra revogar todas as sessões de um ator específico — uso isso hoje na desativação de funcionário e na revogação de acesso de cliente (ver `AUTHENTICATION.md`). Isso significa que, tecnicamente, consigo reagir a "esta conta foi comprometida" revogando sessão na hora — mas não tenho um runbook escrito descrevendo quando e como eu (ou outro operador) deveria acionar isso durante um incidente.

## O que ainda preciso formalizar — `NÃO IMPLEMENTADO`

Não tenho hoje, em nenhum documento que encontrei:

- **Um runbook de resposta a incidente de segurança** — quem acionar, em que ordem, com qual autoridade para tomar decisões como revogar sessões em massa, desligar uma integração, ou colocar o sistema em modo de manutenção.
- **Um processo de triagem de severidade** — o que diferencia um incidente que exige comunicação imediata ao cliente de um que posso corrigir silenciosamente e revisar depois.
- **Um plano de comunicação de violação de dados** — para os escritórios pilotos (meus clientes B2B) e, por extensão, para os clientes finais deles. Isso é relevante tanto por obrigação legal (GDPR em Portugal exige notificação em prazo definido para certas categorias de incidente; LGPD vai exigir o equivalente quando eu expandir para o Brasil) quanto por confiança — um escritório de contabilidade que descobre um vazamento pela imprensa antes de ouvir de mim não continua cliente.
- **Um contato de segurança designado** — não tenho um e-mail, canal ou processo formal pra alguém (interno ou externo, incluindo um pesquisador de segurança que encontre uma falha) reportar um problema de segurança encontrado.
- **Retenção e revisão periódica da trilha de auditoria** — tenho a trilha (ver acima), mas não tenho evidência de um processo de revisão regular dela, nem uma política de por quanto tempo mantenho esses registros.

## Por que isso importa no estágio atual

Com 4 escritórios pilotos pagantes e um risco cross-tenant que já confirmei e está em aberto (ver `TENANT_ISOLATION.md`), a pergunta "o que faço se descobrir que esse vazamento foi explorado de verdade, não só teoricamente possível" não tem resposta escrita hoje. Isso não me impede de operar o produto no estágio de piloto, mas é uma lacuna que fica mais cara de resolver depois de um incidente real do que antes — e é exatamente o tipo de item que uma due diligence de aquisição ou um auditor de segurança externo vai perguntar primeiro.

## O que não verifiquei nesta revisão

Não verifiquei se já tenho algum processo informal (combinado verbalmente comigo mesmo ou com a equipe, não documentado) que cobre parte disso na prática — este documento reflete apenas o que está escrito e verificável em código ou documentação, não o que pode existir só na minha cabeça hoje.

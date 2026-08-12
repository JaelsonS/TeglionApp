# Incidentes

Visão geral. Para o passo a passo de resposta a incidente, use [../operations/INCIDENT_RUNBOOK.md](../operations/INCIDENT_RUNBOOK.md).

## O ponto de partida de qualquer incidente hoje

Depende diretamente da lacuna descrita em [MONITORING.md](./MONITORING.md): se o rastreamento de erro estiver ativo em produção, o incidente provavelmente já está registrado com contexto antes mesmo de o cliente reclamar. Se não estiver, o primeiro sinal de um problema é o próprio cliente avisando — o que já é tarde, e sem contexto automático de causa.

## Os dois cenários de maior impacto, e onde cada um está coberto

**Perda de dado ou indisponibilidade do banco.** O cenário mais grave possível — coberto em [DISASTER-RECOVERY.md](../06-SEGURANCA/DISASTER-RECOVERY.md), com o estado real (nunca testado) documentado sem suavizar.

**Vazamento de dado entre escritórios.** Coberto em [MULTI-TENANT-SECURITY.md](../06-SEGURANCA/MULTI-TENANT-SECURITY.md) — o que fazer se isso for suspeitado não está detalhado ainda como runbook específico; hoje seria tratado como um incidente de segurança genérico via [../operations/INCIDENT_RUNBOOK.md](../operations/INCIDENT_RUNBOOK.md).

## Antes de crescer a base de escritórios pagantes

Vale registrar, sem rodeio: um sistema que descobre incidente pela reclamação do cliente, em vez de por alerta automático, funciona quando existe um único escritório piloto acompanhado de perto pela própria equipe. Não escala do mesmo jeito quando existem múltiplos escritórios pagantes que a equipe não está olhando o tempo inteiro. Fechar a lacuna de monitoramento é, por isso, também uma questão de prontidão operacional para crescer — não só de boa prática técnica.

# Recuperação de desastre

A pergunta que este documento responde: **se o banco de dados de produção desaparecer amanhã, conseguimos recuperar?**

## Estado real, sem suavizar

Não sabemos, porque nunca foi testado. Essa frase sozinha é, na avaliação da auditoria de 12/08/2026, o risco de maior impacto potencial identificado em todo o sistema — não porque seja provável que aconteça, mas porque, se acontecer, é irreversível. Diferente de um bug de código, que se corrige e segue, perda de dado sem um restore validado não tem segunda chance.

Isso não é uma suposição — é o que a própria equipe já havia registrado internamente antes deste marco de documentação: um teste de restore real nunca foi feito, e não há confirmação de que a recuperação pontual (PITR) está ativa no plano de produção atual do Supabase (ver [BACKUPS.md](./BACKUPS.md)). Também não existe registro de um simulado de rollback de migração de banco.

## O que um plano de recuperação de desastre real precisaria ter

Isto é recomendação — descreve o que falta, não o que já existe:

- **Um teste de restore periódico**, feito num ambiente separado (nunca em produção), confirmando que os dados voltam íntegros e medindo quanto tempo isso leva.
- **RPO definido** (quanto dado, no máximo, a empresa aceita perder num incidente — determina a frequência mínima de backup).
- **RTO definido** (quanto tempo, no máximo, o produto pode ficar fora do ar até estar de volta — determina se o processo de restore atual é rápido o suficiente).
- **Um runbook simples**: se o banco sumir agora, quem faz o quê, em que ordem, com qual credencial.

## Por que isso é bloqueador antes de venda aberta

Vender assinatura para múltiplos escritórios é assumir responsabilidade pelos dados fiscais e de cliente de cada um deles. Fazer essa promessa sem nunca ter testado a recuperação é um risco que a empresa estaria assumindo silenciosamente, sem ter decidido conscientemente assumir. É por isso que este item está no [Sprint 0](../02-ROADMAP/SPRINT-0.md) como prioridade máxima, antes de qualquer trabalho de produto novo.

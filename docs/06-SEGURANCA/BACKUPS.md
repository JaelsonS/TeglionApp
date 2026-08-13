# Backups

O que existe hoje, com honestidade sobre o que não foi possível confirmar.

## Estado real

O banco de dados de produção roda em Supabase **Pro**, com backup automático da plataforma (e PITR conforme configuração do projecto).

**Segunda camada (externa):** backup lógico diário `pg_dump` → Cloudflare R2 — ver [BACKUP_R2.md](../operations/BACKUP_R2.md) e [BACKUP_RESTORE.md](../operations/BACKUP_RESTORE.md).

Para arquivos (documentos de cliente, imagens), o armazenamento vive no Supabase Storage; **ainda sem** réplica externa no R2 (fase futura).

## O que isso significa

"Existe backup nativo" não basta. A pergunta certa é: **já restaurou um dump externo com sucesso?** Até o primeiro drill em Postgres temporário, tratar a camada R2 como "implementada, restore por validar".


## Recomendação (documentada aqui, não implementada)

Antes de tratar isso como resolvido:

1. Confirmar diretamente no painel do Supabase se PITR está ativo no projeto de produção, e qual é a janela de retenção real.
2. Confirmar a política de backup do bucket de storage separadamente — backup de banco e backup de arquivo não são necessariamente a mesma configuração.
3. Depois disso, o próximo passo não é "backup existe" — é testar um restore de verdade, coberto em [DISASTER-RECOVERY.md](./DISASTER-RECOVERY.md).

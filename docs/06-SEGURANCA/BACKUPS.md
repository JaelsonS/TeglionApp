# Backups

O que existe hoje, com honestidade sobre o que não foi possível confirmar.

## Estado real

O banco de dados de produção roda em Supabase, que oferece backup automático e recuperação pontual (PITR) como recurso da plataforma, dependendo do plano contratado. Não foi possível confirmar, a partir do código e da documentação do projeto, se o Point-in-Time Recovery está de fato ativo no plano de produção usado hoje — essa é uma configuração do lado do painel do Supabase, fora do que o repositório consegue revelar.

Para arquivos (documentos de cliente, imagens), o armazenamento também vive no Supabase Storage, sujeito à mesma incerteza de configuração de backup do lado da plataforma.

## O que isso significa

"Existe backup" não é a pergunta certa — a maioria das plataformas gerenciadas de banco de dados tem alguma forma de backup por padrão. A pergunta certa é: **se for preciso usar esse backup, alguém já confirmou que funciona?** Hoje a resposta é não. Nenhum restore foi testado.

## Recomendação (documentada aqui, não implementada)

Antes de tratar isso como resolvido:

1. Confirmar diretamente no painel do Supabase se PITR está ativo no projeto de produção, e qual é a janela de retenção real.
2. Confirmar a política de backup do bucket de storage separadamente — backup de banco e backup de arquivo não são necessariamente a mesma configuração.
3. Depois disso, o próximo passo não é "backup existe" — é testar um restore de verdade, coberto em [DISASTER-RECOVERY.md](./DISASTER-RECOVERY.md).

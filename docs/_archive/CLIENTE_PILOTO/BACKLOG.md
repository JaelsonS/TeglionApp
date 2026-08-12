# Backlog do Produto

## Definições / Equipa (próximo)
- Preferências granulares de e-mail (avisos por módulo)
- Domínio autenticado no Brevo (Primary inbox em produção)
- Edição inline de departamento / cargo na lista de colaboradores
- Auditoria visível de alterações de permissões

## Cadastro
- [x] Tipo de Cliente
- [x] Validação de NIF no cadastro
- [x] Particulares sem Regime de IVA (IRS mantém-se)
- [x] Localidade + Freguesia no cadastro; lookup CP preenche freguesia
- Campos fiscais dinâmicos por tipo de cliente (refinar restantes)

## Clientes
- Expansão do perfil fiscal
- Histórico de alterações cadastrais
- Refinamento da vista detalhada do cliente

## Agenda Fiscal
- Conclusão de fluxos pendentes
- Melhorias de alertas e prazos

## Documentos
- Validação e triagem automática
- Melhorias de anexos e categorização

## Funcionários / Equipa
- [x] Criar colaborador com acesso directo
- [x] Convite por e-mail
- [x] Departamentos e cargos
- Gestão de responsáveis por cliente
- Distribuição de tarefas e permissões (refinar UX)

## Permissões
- Perfis por papel operacional
- Restrições granulares por módulo

## Financeiro
- Integração Stripe mínima (cobrança / plano)
- Consolidação de estados financeiros

## Portal do Cliente
- Melhorias de navegação móvel
- Ajustes de dashboard e chat

## Integrações
- Automação fiscal
- Ligações com serviços externos

## Segurança / Operação
- [x] Sentry em FE/BE (alertas)
- Redis/Upstash para rate limit e sessões
- Auditoria de acções críticas
- Smoke de caminho de venda (signup → trial → plano)

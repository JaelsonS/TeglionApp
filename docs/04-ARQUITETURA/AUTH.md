# Autenticação

Autenticação própria, não Supabase Auth — decisão deliberada para manter controle total sobre o modelo de papel (funcionário do escritório vs. cliente) e sobre o fluxo de convite, que tem regra específica do domínio contábil.

## Como funciona

JWT guardado em cookie `httpOnly` — nunca em `localStorage`, o que reduz a superfície de roubo de token via script malicioso no navegador. Dois tokens: um de acesso, de vida curta (em torno de quinze minutos), e um de renovação, de vida mais longa, com rotação a cada uso.

Senha é armazenada com Argon2id — o algoritmo de hash mais robusto entre as opções comuns hoje —, com migração transparente de hashes antigos em formato mais fraco, sem exigir que o usuário troque de senha manualmente para migrar.

Tentativa de força bruta é bloqueada com contagem persistida em banco de dados, não em memória ou no Redis — o que significa que essa proteção continua funcionando mesmo se o Redis, usado para outras finalidades como limitação geral de taxa, estiver fora do ar.

## Papéis

Dois grandes grupos: usuário do escritório (`firm_user`, com sub-papéis de permissão — dono, membro da equipe) e cliente (`client`, o usuário final atendido pelo escritório). O papel de cliente não tem, em nenhum lugar verificado, acesso a rota exclusiva de gestão do escritório — testado diretamente na auditoria de 12/08/2026.

## O gap conhecido

Quando um funcionário é desativado, o sistema marca isso no banco, mas o fluxo de renovação de sessão nunca verifica essa marcação — o token de renovação daquela pessoa continua válido e se renovando indefinidamente. O padrão correto (revogar todas as sessões no momento da desativação) já existe no código para o caso de cliente, só não foi replicado para funcionário. Detalhe completo, com a justificativa de por que isso é prioridade, em [MULTI-TENANT-SECURITY.md](../06-SEGURANCA/MULTI-TENANT-SECURITY.md) e no [Sprint 0](../02-ROADMAP/SPRINT-0.md).

## Proteção de rota

Toda rota que exige autenticação passa por um middleware que extrai e valida o usuário a partir do cookie antes de qualquer lógica de negócio rodar. Rotas que exigem um papel específico usam um middleware de verificação de permissão em cima disso — aplicado de forma consistente nas rotas de escritório verificadas.

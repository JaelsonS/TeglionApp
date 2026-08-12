# Sprint 0 — Fechar os blockers

Prioridade máxima. Nada do Sprint 1 compensa deixar isto em aberto.

Esta lista vem inteira da [auditoria de 12/08/2026](../06-SEGURANCA/MULTI-TENANT-SECURITY.md) — não é uma lista de "coisas que seria bom fazer", é a lista exata de riscos que a auditoria confirmou em código, com caminho de correção conhecido. Nenhum item aqui é hipótese. Cada um tem um arquivo, uma linha, um cenário de exploração ou de falha.

O critério de saída do Sprint 0 é simples: **os sete itens abaixo resolvidos** é o que separa "temos um piloto que funciona com uma contadora que confia na gente" de "podemos colocar o segundo, terceiro, quarto escritório pagante sem cruzar os dedos".

## 1. Revogar sessão ao desativar um funcionário

Hoje, quando o dono de um escritório desativa um membro da equipe, o sistema marca `is_active = false` no banco e para por aí. O fluxo de refresh de token nunca checa essa flag — só valida se a assinatura do escritório está em dia. Resultado: o refresh token de um funcionário demitido continua válido, se renovando por mais 30 dias a cada uso, indefinidamente. Ele continua acessando clientes, documentos, mensagens e obrigações do escritório depois de ter sido desligado.

O padrão certo já existe no código — só não foi replicado. Quando um acesso de cliente é revogado, o sistema já apaga todas as sessões daquele ator (`revokeClientAccess` → `deleteAllForActor`). É o mesmo princípio, aplicado ao ator errado hoje.

**Critério de pronto:** desativar um membro da equipe apaga as sessões de refresh dele na mesma operação. Testar: desativar um usuário de teste, confirmar que o cookie de refresh dele para de funcionar imediatamente.

## 2. Travar o double-booking

O fluxo público de agendamento lê a disponibilidade, decide que o horário está livre, e só depois insere a consulta — sem transação, sem lock, sem nenhuma restrição no banco que impeça duas inserções para o mesmo horário. Existe um mecanismo antiduplicata no sistema, mas ele só é usado no fluxo manual da equipe; o fluxo público de booking não passa por ele.

Isso não é uma falha de segurança — é uma falha de produto que vai aparecer na frente do cliente do escritório assim que dois leads tentarem marcar o mesmo horário ao mesmo tempo, o que é um cenário normal, não extremo, para uma página pública de agendamento.

**Critério de pronto:** o banco impede fisicamente duas consultas confirmadas no mesmo horário para o mesmo escritório (constraint de exclusão, não só checagem em memória). A segunda tentativa recebe um erro claro de horário indisponível, não um agendamento fantasma.

## 3. Provar que o backup funciona

Ninguém testou um restore. Essa frase, sozinha, é o item de maior risco desta lista — não porque seja provável que o banco suma amanhã, mas porque se sumir, hoje não sabemos se conseguimos trazer os dados de volta. Não há confirmação de que o Point-in-Time Recovery está ativo no plano de produção do Supabase.

**Critério de pronto:** rodar um restore de verdade (em um projeto/ambiente separado, não em produção) a partir de um backup real, confirmar que os dados voltam íntegros, documentar o tempo que levou. Depois disso, repetir esse teste em uma cadência definida — não é algo que se faz uma vez e esquece.

## 4. Colocar o teste de isolamento entre escritórios para rodar sozinho

Existe um script de 563 linhas que testa exatamente o risco mais caro do produto — vazamento de dados entre escritórios. Ele não roda no CI. Não roda no processo de release. A última execução registrada é de maio, e o próprio time já marcou esse resultado como desatualizado. Ou seja: o único teste automatizado que pegaria uma regressão de isolamento antes de chegar em produção não protege nada hoje, porque ninguém o aciona.

**Critério de pronto:** o teste de isolamento roda automaticamente em todo PR que toca `backend/src/**`, contra um ambiente isolado (não a base de produção partilhada, que é a razão pela qual ele foi desligado do CI da primeira vez). Se ele falhar, o merge é bloqueado.

## 5. Rodar os segredos de produção

As chaves reais de produção — Stripe, Supabase, JWT, Brevo, Google, Redis — estão em texto plano em arquivos locais que nunca foram para o Git, mas que já foram lidos por várias sessões de auditoria desde agosto. Elas nunca foram trocadas. Local não versionado não é a mesma coisa que seguro.

**Critério de pronto:** todas as chaves listadas na auditoria de segurança são rotacionadas, os valores antigos deixam de funcionar, e existe uma regra simples daqui para frente: chave de produção não vai para máquina de desenvolvedor.

## 6. Parar de reenviar o mesmo lembrete por email

O job que envia lembretes de obrigação roda a cada hora. O canal de SMS tem uma janela de deduplicação de 24 horas — o mesmo lembrete não é reenviado no mesmo dia. O canal de email não tem essa proteção. Na prática, o mesmo lembrete pode sair até 24 vezes por dia para o mesmo cliente, sobre a mesma obrigação, enquanto a condição persistir.

Isso não aconteceu ainda de forma visível porque o volume de obrigações reais é baixo hoje. Com mais de um escritório operando de verdade, esse volume sobe, e esse bug vira reclamação de cliente e risco real para a reputação da conta de email — inclusive para os outros emails transacionais que o produto depende (convite, redefinição de senha).

**Critério de pronto:** o canal de email tem a mesma proteção de deduplicação que o SMS já tem — um lembrete específico não sai duas vezes no mesmo ciclo.

## 7. Fazer a suíte de testes de backend rodar de verdade no CI

O comando que o CI executa hoje roda um único arquivo de teste. Existem 37. Os outros 36 — incluindo os testes de agendamento, de billing, de todas as integrações de Google Calendar — só rodam se alguém lembrar de disparar manualmente. O webhook do Stripe, que é o caminho financeiro mais crítico do produto, não tem nenhum teste automatizado cobrindo ele.

**Critério de pronto:** o CI roda a suíte completa de backend, não um arquivo isolado. Falha de teste bloqueia merge, do mesmo jeito que já bloqueia no frontend.

---

Não há um item de "polimento de UX" ou "feature nova" nesta lista de propósito. Sprint 0 não é sobre deixar o produto mais bonito ou mais completo — é sobre fechar exatamente os riscos que a auditoria encontrou, e só eles. O que vem depois está no [Sprint 1](./SPRINT-1.md).

# Sprint 1 — Primeira receita

Só começa depois do [Sprint 0](./SPRINT-0.md) fechado. Prioridade muito alta, mas não é sobre adicionar funcionalidade — é sobre conseguir colocar o próximo escritório real dentro do Teglion e receber dinheiro dele, sem gambiarra manual no meio do caminho.

A pergunta que define o que entra aqui: **o que falta, especificamente, para o segundo escritório pagante existir?** Não é sobre deixar o produto mais completo — isso é Sprint 2 e 3.

## O que já está pronto e não precisa ser refeito

O código de billing funciona: checkout, portal do cliente, webhook com assinatura verificada, idempotência real contra evento duplicado, gate de acesso que reavalia o status da assinatura a cada refresh de token. Isso não é trabalho pendente — é a base sobre a qual este sprint se apoia.

## 1. Confirmar que produção está com as chaves certas

As chaves Stripe já são live no ambiente local (não é mais test mode, ao contrário do que a documentação antiga registrava). O que não dá para confirmar só lendo o código é se o ambiente de produção no Render está com essas mesmas chaves e com os Price IDs corretos configurados. Depois da rotação de segredos do Sprint 0, essa confirmação precisa ser feita de novo — com os valores novos, não os antigos.

## 2. Autenticar o domínio de envio no Brevo

SPF/DKIM do domínio de produção ainda não está confirmado como concluído. Sem isso, a entregabilidade de todo email transacional — convite, redefinição de senha, lembrete, confirmação de agendamento — sofre, e a conta fica mais exposta a bloqueio justamente na fase em que mais precisa estar confiável (primeiros clientes pagantes, primeiras impressões).

## 3. Smoke test de ponta a ponta do fluxo de receita

Cadastro de escritório → trial de 14 dias sem cartão → checkout → assinatura ativa → login funcionando com a conta paga. Esse fluxo precisa ser validado de propósito, de ponta a ponta, com um caso real — não presumido porque cada parte isolada funciona.

## 4. Onboarding do escritório sem depender de alguém da equipe do lado

Hoje existe um fluxo de cadastro, mas ele foi validado principalmente com acompanhamento direto durante o piloto. Para o segundo escritório pagante entrar sozinho, o caminho entre "criar conta" e "primeiro cliente cadastrado, primeiro documento pedido" precisa fazer sentido sem alguém do time explicando por telefone.

## 5. Canal mínimo de suporte

Quando o segundo escritório pagante tiver um problema, precisa existir um lugar certo para reportar e alguém responsável por responder — mesmo que seja simples (email dedicado, WhatsApp da equipe). Não precisa ser um sistema de tickets. Precisa existir e estar visível dentro do produto.

## 6. Cobrança de falha de pagamento — decisão consciente

A auditoria encontrou que hoje uma falha de pagamento suspende o acesso do escritório imediatamente, sem janela de tolerância. Para o primeiro punhado de clientes pagantes isso pode ser aceitável — mas é uma decisão que vale tomar conscientemente agora (avisar o cliente antes de suspender, dar um dia ou dois de graça) em vez de descobrir isso quando um cliente real perder acesso no meio de um fechamento de mês.

---

Não tem 50 itens de propósito. O critério de saída é único: **um escritório novo, sem ser o piloto atual e sem intervenção manual da equipe em nenhuma etapa, consegue se cadastrar, pagar e começar a usar.** Quando isso for verdade, o próximo passo é fazer esse escritório usar o produto todos os dias — [Sprint 2](./SPRINT-2.md).

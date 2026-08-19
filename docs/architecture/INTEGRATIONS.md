# Integrações

> Fontes consolidadas: `docs/05-INTEGRACOES/BREVO.md`, `GOOGLE-CALENDAR.md`, `GOOGLE-DRIVE.md`, `STRIPE-CONNECT.md`, `STRIPE.md` (pasta `05-INTEGRACOES/` removida por inteiro após esta migração). Guia de configuração operacional de cada uma (chave de ambiente, passo a passo de setup) fica em `docs/operations/` — este documento é sobre o que cada integração faz e como ela se autentica, não como configurá-la.

O Teglion se integra com quatro serviços externos: Google (Calendar e Drive), Stripe (billing próprio e Stripe Connect) e Brevo (email e SMS). Todas as integrações seguem o mesmo princípio geral: o backend é sempre o intermediário — o frontend nunca fala diretamente com a API de nenhum desses serviços, exceto pelo próprio widget do Google Picker (Drive) e do Checkout do Stripe, que são abertos no navegador mas cujo resultado é sempre validado pelo backend antes de virar dado no sistema.

## Google Calendar

Um membro da equipe conecta o próprio Google Calendar ao Teglion através de um fluxo OAuth padrão, protegido contra CSRF — o estado da requisição é validado antes de trocar o código de autorização. A conexão fica vinculada ao escritório **e** à pessoa que conectou, não ao escritório como um todo. Módulo: `backend/src/modules/integrations/google-calendar/`.

Os tokens de acesso e renovação ficam cifrados no banco, com o mesmo esquema usado em outro dado sensível do sistema. Quando alguém reconecta, a conexão antiga é substituída de forma limpa, sem duplicar registro. Quando o acesso é revogado do lado do Google, ou o token expira de um jeito que exige nova autorização, o sistema detecta isso explicitamente e avisa na interface, em vez de falhar silenciosamente.

A sincronização é de mão única: evento criado no Teglion (agendamento) é enviado para o Google Calendar da pessoa conectada. No sentido contrário, o sistema só lê disponibilidade ocupada — não sincroniza o conteúdo completo do calendário pessoal, só usa isso para não oferecer, na agenda pública, um horário já ocupado por compromisso externo. Essa leitura usa um cache curto (alguns minutos): um bloqueio feito manualmente no Google Calendar pode levar até esse tempo para refletir na página pública de agendamento.

Fuso horário é tratado de forma explícita: o fuso configurado para o agendamento do escritório é o mesmo propagado até o evento criado no Google Calendar, restrito a um conjunto definido de fusos válidos (ver [INTERNATIONALIZATION.md](./INTERNATIONALIZATION.md) e `docs/ROADMAP.md`, Fase 3, para a limitação de que essa lista hoje não inclui fuso brasileiro).

Não é sincronização bidirecional completa — o Teglion não importa e reflete tudo que acontece no calendário pessoal de quem conectou, só lê disponibilidade. Escolha de escopo, não limitação técnica escondida.

## Google Drive

Dentro do fluxo de mensagens, um membro da equipe pode abrir o seletor de arquivo do próprio Google Drive (o "Picker" oficial do Google) e escolher um arquivo para anexar diretamente, sem precisar baixar do Drive e depois subir manualmente no Teglion. Módulo: `backend/src/modules/integrations/google-drive/`.

A integração pede o escopo mais restrito possível do Drive — acesso só ao arquivo especificamente escolhido no seletor, não acesso geral à conta de quem está usando. O token de acesso usado para essa importação é temporário e nunca fica salvo no banco — existe só durante a operação de importar aquele arquivo.

O arquivo importado passa pelo mesmo caminho de validação que qualquer upload manual — a mesma verificação de tipo de arquivo, o mesmo vínculo obrigatório com o escritório e o cliente certos, extraídos sempre da sessão autenticada de quem está importando (ver [DATA_ARCHITECTURE.md](./DATA_ARCHITECTURE.md)). Não existe um caminho separado e menos protegido só porque a origem é o Google Drive em vez do computador da pessoa.

Não é sincronização de pasta nem espelho do Drive dentro do Teglion — é um atalho pontual para trazer um arquivo específico para dentro de uma conversa, no momento em que é preciso.

## Stripe — billing do Teglion

Este é o Stripe usado para o escritório pagar a assinatura da plataforma — diferente do Stripe Connect abaixo, onde o cliente final do escritório paga o escritório. Módulo principal: `backend/src/modules/billing/`; cliente Stripe em `backend/src/services/stripe/stripe-client.js`.

Checkout, criação e busca de cliente no Stripe, portal de autoatendimento para o escritório gerenciar a própria assinatura, e processamento de webhook (`/api/public/stripe/webhook`, registrado com corpo bruto antes do parser JSON global — ver [API.md](./API.md)) com verificação de assinatura antes de aceitar qualquer evento. A proteção contra reprocessar o mesmo evento duas vezes é real: existe uma restrição no banco que impede duas gravações do mesmo identificador de evento.

O acesso do escritório ao produto é reavaliado a cada renovação do token de sessão — a cada quinze minutos, aproximadamente — então uma mudança de status de assinatura (cancelamento, pagamento recusado) se reflete rápido, não só no próximo login. Se a chave do Stripe não estiver configurada em algum ambiente, o sistema degrada de forma controlada, recusando a operação específica que dependia dele, sem derrubar o resto do produto.

Modelo comercial hoje: plano único, dois ciclos de cobrança, com 14 dias de teste grátis sem pedir cartão — valor exato e ressalvas operacionais (tolerância de falha de pagamento, duração real do teste grátis) ficam em [`docs/product/BUSINESS_MODEL.md`](../product/BUSINESS_MODEL.md), não repetidas aqui.

## Stripe Connect — pagamento do cliente final ao escritório

Módulo: `backend/src/modules/connect/`. O escritório cria uma conta Stripe Express através do fluxo padrão de onboarding do Stripe (Account Links) — só o dono do escritório pode iniciar essa conexão, e só depois de aceitar explicitamente uma política de pagamento online, com o aceite registrado de forma auditável (IP, navegador, versão e hash do texto aceito).

Com a conta pronta, um serviço do catálogo pode ser marcado como exigindo pagamento no ato do agendamento. Nesse caso, o cliente final paga por um Checkout do Stripe processado diretamente na conta do escritório (não na conta do Teglion), com uma taxa de plataforma retida automaticamente sobre o valor. O agendamento fica reservado como "aguardando pagamento" por um tempo limitado; se o pagamento não se completar nesse prazo, a reserva expira e o horário volta a ficar disponível.

A confirmação de pagamento passa por webhook dedicado (`/api/public/stripe/connect/webhook`, separado do webhook de billing), com a mesma verificação de assinatura e a mesma proteção contra reprocessamento duplicado do billing principal. Estorno é tratado: o pagamento é marcado como estornado, mas o agendamento em si permanece confirmado — cancelar o agendamento é decisão manual do escritório, não automática.

Ativação é por variável de ambiente, desligada por padrão — ligar isso em produção é uma decisão consciente de negócio, não um estado silenciosamente ativo.

## Brevo — email e SMS

Todo email transacional do produto passa por aqui: convite de cliente e de membro de equipe, confirmação de cadastro, redefinição de senha, boas-vindas, aviso de tarefa e obrigação nova, lembrete de prazo, confirmação de agendamento, aviso de documento recebido. Serviços: `backend/src/services/email/brevo-email.service.js` e `brevo-sms.service.js`.

Se a chave de configuração do Brevo não estiver definida, o sistema não trava — o envio é simplesmente pulado de forma controlada. O conteúdo dos template escapa corretamente o dado do usuário antes de montar o HTML do email, reduzindo o risco de um nome ou campo malicioso injetar conteúdo indevido no email enviado.

O envio de lembrete de obrigação roda a cada hora, para todo escritório ativo. O canal de SMS tem proteção contra reenvio do mesmo lembrete no mesmo dia; o canal de email, hoje, não tem essa mesma proteção — risco operacional real conforme o volume de obrigações e escritórios cresce, tratado como item de prioridade no `docs/ROADMAP.md`. Sem retry automático em caso de falha de envio, e sem limitador de taxa de envio em massa dedicado.

## Autenticação e autorização — resumo por integração

| Integração | Quem autoriza | Onde o token fica | Escopo |
|---|---|---|---|
| Google Calendar | Membro da equipe, por OAuth | Cifrado no banco, vinculado a escritório + pessoa | Calendário da pessoa conectada |
| Google Drive | Membro da equipe, por Picker OAuth | Nunca persistido — só durante a importação | Só o arquivo escolhido no seletor |
| Stripe (billing) | Dono do escritório, via portal Stripe | Não se aplica (Stripe hospeda o checkout/portal) | Assinatura do escritório |
| Stripe Connect | Dono do escritório, via Account Links | Conta Stripe Express do próprio escritório | Pagamento recebido pelo escritório |
| Brevo | Chave de API do Teglion (nível de aplicação, não por usuário) | Variável de ambiente | Envio em nome do Teglion, para qualquer escritório |

## Onde aprofundar

- [API.md](./API.md) — como os webhooks do Stripe se encaixam no roteamento da API.
- [DATA_ARCHITECTURE.md](./DATA_ARCHITECTURE.md) — validação de arquivo importado via Drive.
- `docs/operations/` — passo a passo de configuração de cada integração (`GOOGLE_CALENDAR_SETUP.md`, `GOOGLE_DRIVE_PICKER_SETUP.md`, `STRIPE_SETUP.md`, `STRIPE_CONNECT_SETUP.md`, `BREVO_DOMAIN_SETUP.md`).
- `docs/ROADMAP.md` — itens pendentes de cada integração (deduplicação de lembrete no Brevo, teste automatizado de webhook, corrida de condição no agendamento pago).

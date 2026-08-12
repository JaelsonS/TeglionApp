# Visão 2030

Sem previsão de faturamento, sem número de clientes inventado. Isto é sobre o tipo de empresa que o Teglion se torna se a tese se confirmar — não uma promessa financeira.

## Produto

O Teglion deixa de ser "o sistema onde o escritório organiza clientes e documentos" e passa a ser o sistema operacional do escritório de contabilidade — o lugar de onde o dono do escritório enxerga tudo: quem são os clientes, o que está pendente, quanto entra de receita, onde está o gargalo da semana. Módulos que hoje são independentes (documentos, obrigações, mensagens, agenda, captação) convergem para uma visão só, em vez de telas separadas que o usuário precisa cruzar mentalmente.

## Tecnologia

O núcleo técnico amadurece nos pontos que a auditoria de 2026 identificou como dívida consciente, não ignorada: isolamento entre escritórios deixa de depender só de disciplina de código e passa a ter uma segunda camada real no banco de dados. Observabilidade deixa de ser "descobrimos pelo Sentry, se estiver configurado" e passa a ter métricas e alertas ativos. Processamento pesado (email, sincronização, geração de relatório) sai de dentro da requisição HTTP e vira trabalho assíncrono de verdade, com fila, retry e monitoramento — não a exceção isolada que existe hoje. Nenhum desses pontos exige reescrever o sistema; exige terminar de construir o que já foi desenhado corretamente, mas não finalizado.

## Mercado

Portugal continua sendo a base — é onde o produto nasceu, onde tem cliente real, e onde a regulação fiscal é mais bem compreendida pelo time. Expansão para outros mercados de língua portuguesa e, depois, Europa, acontece quando o modelo em Portugal provar que se sustenta sozinho — não como aposta paralela.

## Automação e IA

Hoje o Teglion organiza o trabalho manual do escritório; não o substitui. O caminho plausível de médio prazo é IA aplicada a tarefas específicas e verificáveis — sugerir categorização de um documento recebido, rascunhar uma resposta a um cliente para o contador revisar, identificar um prazo em risco antes que vire atraso. Não é automação genérica: é reduzir cliques em tarefas que hoje o contador faz manualmente, mantendo ele no controle da decisão final.

## Ecossistema e integrações

Google Calendar e Google Drive já mostram o padrão: integrar com as ferramentas que o escritório já usa em vez de forçar migração completa para dentro do Teglion. O próximo passo natural nessa linha é Stripe Connect — permitir que o próprio escritório receba pagamento dos seus clientes através da plataforma — cuja base já está construída, ainda desligada por padrão em produção (ver [STRIPE-CONNECT.md](../05-INTEGRACOES/STRIPE-CONNECT.md)) — e integrações com sistemas contábeis/fiscais locais conforme cada mercado exigir.

## Escala

O teste real não é "quantos escritórios cabem tecnicamente" — é "quantos escritórios o produto consegue atender bem, com onboarding que não depende de alguém da equipe explicar por telefone, suporte que responde rápido, e cobrança que funciona sozinha". Chegar a centenas de escritórios de forma saudável é mais sobre operação madura do que sobre servidor maior.

---

Se der certo, o Teglion não é mais "um sistema que uma contadora usa". É a camada onde escritórios de contabilidade e serviços profissionais administram a relação inteira com os próprios clientes — começando em Portugal, sem pressa de provar isso em nenhum outro lugar antes da hora.

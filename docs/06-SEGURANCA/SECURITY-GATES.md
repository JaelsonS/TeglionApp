# Gates de segurança — o que roda automaticamente e o que não roda

Esta é a distinção mais importante deste documento: existe uma diferença grande entre "o teste existe" e "o teste protege alguma coisa". Um teste que só roda quando alguém lembra de digitar o comando não é uma rede de segurança — é um documento com sintaxe de código.

**Atualizado durante a execução do Sprint 0** — dois dos três gaps abaixo já foram fechados; o texto original desta seção (que dizia "não roda sozinho" para os dois) está preservado no histórico do arquivo para quem quiser ver o antes/depois.

## O que roda sozinho, em todo PR/push

- Checagem de tipos e testes do frontend.
- Build do frontend.
- Um scan estático de segurança do backend (padrões conhecidos de risco no código).
- Varredura de segredos (evita que uma chave real seja commitada por engano).
- **A suíte completa de testes de backend** — 337 testes, todos os 37 arquivos. Corrigido no Sprint 0: o script `test:backend` da raiz do monorepo rodava um único arquivo (`file-magic-bytes.test.js`); agora chama a suíte real do workspace de backend. Os outros 36 arquivos — agendamento, cobrança, Google Calendar, entre outros — agora bloqueiam merge se falharem, igual ao frontend já fazia.

Isso é real e roda automaticamente hoje.

## O que existe, pronto, mas ainda depende de uma peça externa

**O teste de isolamento entre escritórios.** O step já está no `.github/workflows/ci.yml`, condicionado a dois secrets do GitHub (`STAGING_SUPABASE_URL`, `STAGING_SUPABASE_SERVICE_ROLE_KEY`). Enquanto esses dois secrets não existirem no repositório, o step roda, imprime um aviso e sai limpo — não quebra o pipeline de ninguém, mas também não protege nada ainda. No momento em que existir um projeto Supabase de staging e os dois secrets forem cadastrados, o teste passa a rodar de verdade em todo PR que toca `backend/**`, sem precisar tocar no workflow de novo.

Continua sendo verdade que a última execução real e completa deste teste é anterior a este marco de documentação, e que ele nunca correu automaticamente até agora — o que muda é que a partir de agora o único item que falta é operacional (criar o projeto de staging), não mais um item de código pendente.

## Por que isso importava mais do que parecia

Antes desta correção, era fisicamente possível publicar uma mudança de código em produção sem nenhuma verificação automatizada — nem da suíte de backend inteira, nem do isolamento entre escritórios. A disciplina de sempre filtrar por `firm_id` era (e continua sendo) consistente, verificada manualmente — mas consistente não é o mesmo que garantido.

## O que ainda falta — ação fora do código

Criar um projeto Supabase de staging e cadastrar `STAGING_SUPABASE_URL`/`STAGING_SUPABASE_SERVICE_ROLE_KEY` como secrets do repositório no GitHub. Sem isso, o step de isolamento continua desativado, mesmo já estando pronto no workflow. Detalhe completo em [SPRINT-0.md](../02-ROADMAP/SPRINT-0.md).

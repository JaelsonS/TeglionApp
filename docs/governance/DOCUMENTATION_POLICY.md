# Como a documentação se mantém viva

Documentação desatualizada é pior do que documentação ausente — ela engana em vez de admitir que não sabe. Escrevi esta política para que a reestruturação de agosto de 2026 não vire, em seis meses, o mesmo problema que ela tentou resolver: uma pilha de documentos otimistas, desconectados do estado real do código.

## A regra central

**Atualizo o documento correspondente na mesma hora em que o código ou o processo muda — nunca depois, nunca "quando sobrar tempo".** Se a atualização da documentação não cabe no mesmo PR ou no mesmo dia da mudança, trato isso como um sinal de que a mudança está maior do que deveria — não uso isso como justificativa para adiar o documento.

## Onde cada tipo de mudança é registrado

| Tipo de mudança | Atualizar |
|---|---|
| Arquitetural (decisão de como o sistema é construído — schema, isolamento, escolha de tecnologia, padrão que substitui outro) | Criar ou atualizar um ADR em `docs/decisions/` |
| Produto (o que o Teglion faz, para quem, como um módulo se comporta) | Atualizar o documento correspondente em `docs/product/` |
| Infraestrutura ou processo de deploy | Atualizar `docs/infrastructure/` ou `docs/operations/`, conforme o assunto |
| Segurança (autenticação, autorização, isolamento entre tenants, proteção de dado) | Atualizar `docs/security/` |
| Prioridade (o que fazer a seguir, o que subiu ou desceu de importância) | Atualizar `docs/ROADMAP.md` — **nunca** criar uma lista de tarefas paralela em outro documento |

A regra sobre prioridade eu levo a sério: `docs/ROADMAP.md` é a única fonte de verdade sobre o que vem a seguir. Um documento de arquitetura pode até mencionar que algo está pendente, mas não guardo ali uma lista própria de próximos passos competindo com o roadmap — é exatamente assim que a documentação se fragmenta e passa a se contradizer.

## Por que isso importa mais do que parece: a lição de 18/08/2026

Durante a auditoria que motivou esta reestruturação de documentação, encontrei **9 documentos que continuavam descrevendo riscos do Sprint 0 como abertos, um dia inteiro depois desses mesmos riscos terem sido marcados como resolvidos** em `docs/historico/SPRINT-0.md`. Não foi um erro de digitação isolado — foi o sintoma de um hábito que eu ainda não tinha: o de atualizar a documentação narrativa (a que explica o sistema em prosa, para quem vai ler depois) no mesmo momento em que o código ou o processo mudava. Atualizei o documento de origem (`SPRINT-0.md`); os outros nove, que citavam o mesmo risco em outro contexto, ficaram pra trás.

O custo disso não é abstrato: um investidor, um novo engenheiro ou uma auditoria externa que lesse qualquer um desses nove documentos ia sair com uma leitura errada do risco real do produto — desatualizada por até um dia inteiro, num sistema que muda todo dia. Escrevi essa política especificamente para que isso não se repita. Não é uma boa prática genérica que copiei de outro lugar; é resposta direta a um problema que já aconteceu aqui, neste repositório.

## Como evitar que aconteça de novo

1. **Quando vejo um documento citando um fato que também aparece em outro lugar, trato isso como sinal de alerta, não como detalhe.** Se o mesmo risco, status ou métrica aparece em mais de um documento, levo a atualização até todos eles — ou, melhor ainda, deixo o fato morar em um único lugar e faço os outros linkarem para lá em vez de repetir.
2. **Quando encontro uma afirmação que não bate mais com o código, corrijo na hora.** Não abro uma tarefa para "revisar documentação depois" — foi assim que os nove documentos ficaram desatualizados da primeira vez.
3. **Mudança de prioridade nunca vira lista de tarefas nova.** Vai para `docs/ROADMAP.md`. Se um documento técnico sente necessidade de listar "próximos passos" próprios, é sinal de que ele está tentando fazer o papel do roadmap — aí eu removo a lista e linko para o item correspondente no roadmap.
4. **Antes de descrever algo como implementado, verifico lendo o código real** — não copio de uma versão antiga do mesmo documento nem de uma intenção registrada em algum outro lugar. Quando não tenho certeza suficiente, escrevo `Não comprovado atualmente` ou `A validar` — nunca invento.
5. **Não atualizo documentos históricos (`docs/historico/`) retroativamente para "parecerem certos" — deixo eles congelados como registro do que se sabia naquele momento.** A correção acontece nos documentos de estado atual (`product/`, `architecture/`, `security/`, `ROADMAP.md`), não reescrevendo o passado.

## Quem é responsável

Quem faz a mudança é quem atualiza a documentação correspondente — não é trabalho de uma pessoa dedicada a documentação, revisando depois. Isso é coerente com o restante desta política: se a atualização depende de alguém que não fez a mudança original, o atraso é garantido — e foi exatamente esse atraso que gerou o problema de 18/08/2026.

## Onde isso está registrado também

`docs/README.md` resume esta mesma política de forma mais curta, na seção "Como manter esta documentação viva", e aponta para este documento para mais detalhes. Se os dois textos divergirem no futuro, isso já seria, por si só, uma instância do problema que esta política existe para evitar — e corrijo assim que notar, sem ficar debatendo.

# Diferenciais

Comparado com o que um escritório de contabilidade pequeno/médio realmente usa hoje — não com concorrência hipotética, com a alternativa real.

## Frente a WhatsApp + email + planilha

É a comparação mais honesta, porque é o que a esmagadora maioria dos escritórios desse porte usa de fato. Ali, o diferencial do Teglion é estrutural: documento, prazo, cliente e conversa vivem amarrados uns aos outros, não em quatro lugares que ninguém cruza. Isso não é sofisticação técnica — é o motivo mais concreto para um escritório trocar de ferramenta.

## Frente a um CRM genérico

Um CRM genérico não sabe o que é uma obrigação de IVA, não tem calendário fiscal português pré-carregado, não separa "cliente empresa com CAE" de "cliente particular sem IVA" como conceito nativo. Ele resolveria pedaço de "cliente e comunicação", mas o escritório teria que adaptar tudo o resto por fora. O Teglion nasce com o vocabulário certo — é o diferencial de [POSICIONAMENTO.md](./POSICIONAMENTO.md) aplicado na prática.

## Frente a um software de contabilidade tradicional

Software de contabilidade certificado (o que gera IES, SAF-T, obrigações declarativas) não é substituído pelo Teglion, nem tenta ser — é o oposto: o Teglion cobre exatamente o que esse tipo de sistema não cobre: relação com cliente, comunicação, captação, organização de documento antes de virar lançamento contábil.

## O que é diferencial real hoje e o que ainda não é

Sendo direto sobre o que a auditoria de 2026 confirmou: **isolamento entre escritórios, portal do cliente, integração real com Google Calendar/Drive, e a base de pagamento do cliente final via Stripe Connect** são concretos hoje — funcionam, foram verificados em código, não são promessa (o Connect está desligado por padrão e com lacuna de teste, mas a base existe, ver [STRIPE-CONNECT.md](../05-INTEGRACOES/STRIPE-CONNECT.md)). Já **billing com planos diferenciados por tier** não é diferencial hoje porque não existe ainda como regra de negócio — existe só a interface técnica que vai sustentar isso no futuro (ver [FEATURE-GATING.md](../08-BUSINESS/FEATURE-GATING.md)), não é algo para vender como pronto agora.

## O diferencial que ainda está para ser construído

O maior diferencial potencial do Teglion não é nenhuma funcionalidade isolada — é a experiência de "abrir um único lugar e ver tudo que importa sobre a operação do escritório hoje". Isso ainda não está inteiramente entregue; é o objetivo dos sprints de retenção e produto do [roadmap](../02-ROADMAP/ROADMAP.md).

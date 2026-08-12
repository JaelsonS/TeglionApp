# Página pública

**Status: IMPLEMENTADO** para o que foi verificado; algumas partes não entraram no escopo desta rodada de auditoria — sinalizado abaixo com honestidade, não presumido como certo.

## O que é

A vitrine pública de cada escritório — identificada por um endereço próprio (slug), com marca, cor, serviços publicados, e os pontos de entrada para [captação de serviço](./IRS.md) e [agendamento](./BOOKING.md) sem exigir login do visitante.

## O padrão de segurança que sustenta tudo isso

Toda página pública resolve primeiro qual escritório está sendo servido através do identificador na própria URL — nunca aceita um identificador de escritório vindo direto de um parâmetro que pudesse ser manipulado. A partir desse escritório resolvido, toda consulta seguinte (serviço, disponibilidade, formulário) herda esse contexto. Verificado como consistente: nenhum caminho encontrado onde a página pública de um escritório pudesse, por engano, mostrar serviço, preço ou disponibilidade de outro escritório.

## O que não foi verificado nesta rodada

SEO, performance de carregamento, domínio personalizado, e conteúdo legal específico de Portugal (termos, política de privacidade, Livro de Reclamações) não foram aprofundados nesta auditoria. Isso não significa que estão com problema — significa que não foram checados com o mesmo rigor do resto, e não deveriam ser presumidos como prontos sem essa checagem específica.

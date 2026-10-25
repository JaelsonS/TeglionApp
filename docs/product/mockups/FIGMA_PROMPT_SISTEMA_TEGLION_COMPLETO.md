# Prompt Figma — Mockups completos do sistema Teglion


## PROMPT

```
Cria um sistema completo de mockups UI (desktop 1440×900 e mobile 390×844) para o Teglion — SaaS B2B para escritórios de contabilidade em Portugal.

IDENTIDADE DE MARCA
- Nome do produto: Teglion (nunca “empresa Teglion”; é marca de produto).
- Tom: profissional, calmo, claro, português de Portugal (pt-PT).
- Visual: claro (light mode), tipografia expressiva mas legível, sem purple AI genérico, sem cream+terracotta cliché, sem dark mode por omissão.
- Cor principal (brand): azul profundo / navy profissional (#0B3A6E ou equivalente). Neutros quentes-frios limpos. Accent discreto para estados activos.
- Layout shell do escritório: sidebar esquerda com grupos + topbar com breadcrumb do escritório activo + conteúdo.
- Sidebar desktop: expansível com nomes; pode colapsar para rail de ícones COM tooltips — EXCEPTO em Definições, onde a sidebar principal fica sempre expandida.
- Em Definições existe um segundo menu interno (secções) SEMPRE com nomes legíveis (nunca só ícones; sem botão de minimizar o menu interno).
- Uma única entrada de menu “Calculadoras” (ícone Calculator) — nunca 6 ícones repetidos no sidebar.
- Sem cards decorativos no hero; cards só onde há interacção.
- Mostrar dados realistas PT: NIF, euros (€), nomes de escritório tipo “Silva & Associados”, clientes “AF Digital, Lda.”, prazos fiscais PT.

ESTRUTURA DO PRODUTO (3 superfícies)

A) APP DO ESCRITÓRIO (staff) — /app/firm/…
B) PORTAL DO CLIENTE — /app/client/…
C) PÁGINA PÚBLICA do escritório — teglion.com/{slug} (captação sem login)

Gera frames completos (não wireframes esqueléticos) para CADA ecrã listado, com estados: vazio, carregado, e 1 estado de erro/aviso quando fizer sentido.

═══════════════════════════════════════
A) APP DO ESCRITÓRIO — MENU E ECRÃS
═══════════════════════════════════════

SHELL
1. Shell desktop expandido — sidebar com grupos + topbar + conteúdo Painel
2. Shell desktop colapsado — rail de ícones + tooltips ao hover
3. Shell tablet — rail de ícones
4. Shell mobile — topbar + bottom nav
5. Banner de trial (owner) no topo

VISÃO GERAL
6. Painel (dashboard): prioridades do dia, tarefas, agenda, actividade recente, atalhos (NÃO listar 6 calculadoras no menu)

CLIENTES
7. Lista de clientes (empresa/particular, pesquisa, filtros, estados activo/inactivo)
8. Ficha do cliente (hub): dados fiscais, actividade, documentos, mensagens, obrigações, acessos oficiais (cofre), portal
9. Criar / editar cliente
10. Convite para portal do cliente

PAGAMENTOS (operacional)
11. Pagamentos / avenças do escritório — lista de cobranças, estados, cliente vinculado
12. Detalhe / editar cobrança

IMÓVEIS E RENDAS
13. Lista de imóveis e rendas internas
14. Detalhe de imóvel / contrato de renda

SAF-T
15. SAF-T (leitura) — importação / consulta de ficheiros SAF-T (não edição contabilística completa)

OBRIGAÇÕES DOS CLIENTES
16. Obrigações por cliente — estados (aguardando, atraso, concluída), lembretes

GESTOR DE OPERAÇÕES
17. Tarefas — lista/quadro, prioridades, filtros
18. Agendamentos (agenda do escritório) — dia/semana, disponibilidade, consulta
19. Área IRS — fila de captação IRS / casos de serviço IRS (não confundir com calculadora)
20. Serviços — catálogo de serviços do escritório (preço, publicável, booking, formulário)
21. Calendário fiscal — prazos genéricos do escritório (IVA, IES, etc.), distinto de Obrigações
22. Calculadoras (HUB) — UMA página com 6 cards (IVA, IRS, SS, Retenção, IMT, IRC); ao clicar abre MODAL/painel grande com a calculadora específica (simulação de apoio, disclaimer legal)
23. Modal Calculadora IVA (exemplo completo)
24. Modal Calculadora IRS
25. Modal Calculadora Segurança Social
26. Modal Retenção na fonte
27. Modal IMT
28. Modal IRC

COMUNICAÇÃO
29. Documentos — pedidos, ficheiros, histórico; validade e lembretes
30. Mensagens — thread escritório↔cliente com anexos
31. Central de Alertas — broadcast para todos ou lista de clientes; agendar; lidos
32. Notícias — feed simples para clientes

CONFIGURAÇÕES
33. Plano / Billing SaaS — trial, mensal, anual (subscrição Teglion — separado de Stripe Connect)
34. Definições — layout: sidebar principal expandida + menu interno COM NOMES (Identidade, Página pública, Escritório, Pagamentos, Perfil, Segurança, Equipa, Etiquetas, Notificações, Ajuda, Sobre, Encerrar)
35. Definições › Identidade — logótipo + pré-visualizações menu/portal
36. Definições › Página pública — editor do site partilhável
37. Definições › Escritório — nome, contactos, dados fiscais
38. Definições › Pagamentos (Stripe Connect) — receber dos clientes na conta do escritório; estados Connect (não ligado / pendente / activo)
39. Definições › Perfil — nome, e-mail, palavra-passe, cofre de acessos oficiais
40. Definições › Segurança — MFA / sessões
41. Definições › Equipa — colaboradores, convites, departamentos, papéis
42. Definições › Etiquetas
43. Definições › Notificações
44. Definições › Ajuda e suporte / Sobre o Teglion
45. Definições › Encerrar conta (zona de perigo)

ASSISTENTE
46. Maya (assistente) — painel flutuante / conversa contextual com deep links
47. Onboarding / activação do escritório (wizard)

AUTH ESCRITÓRIO
48. Login escritório
49. Registo / convite
50. Desafio MFA

═══════════════════════════════════════
B) PORTAL DO CLIENTE
═══════════════════════════════════════

51. Login cliente
52. Dashboard cliente
53. Pedidos / pedidos de documentos
54. Documentos do cliente
55. Mensagens
56. Obrigações do cliente
57. Alertas / actualizações
58. Conta / perfil do cliente
59. Arquivo

═══════════════════════════════════════
C) PÁGINA PÚBLICA + CAPTAÇÃO
═══════════════════════════════════════

60. Landing pública do escritório (slug) — marca do escritório, serviços, CTA
61. Fluxo de captação de serviço (ex.: IRS) — formulário multi-etapa sem login
62. Agendamento público + (opcional) checkout Stripe Connect
63. Mini-portal do lead (token) — pedidos de documentos ao lead

═══════════════════════════════════════
REGRAS UX OBRIGATÓRIAS NOS MOCKUPS
═══════════════════════════════════════

- Sidebar: ícones únicos por item (sem calculadoras repetidas).
- Definições: menu interno sempre com labels; sem toggle de colapsar o menu interno; destaque claro do item activo (barra + fundo brand suave).
- Calculadoras: 1 item no menu → hub → modal.
- Distinguir visualmente: “Plano” (subscrição Teglion) vs “Pagamentos Connect” (dinheiro dos clientes).
- Distinguir: Calendário fiscal (prazos do escritório) vs Obrigações (por cliente).
- Distinguir: Área IRS (captação/casos) vs Calculadora IRS (simulação).
- Disclaimers em calculadoras: “simulação de apoio, não declaração oficial”.
- Acessibilidade: contraste AA, focus rings, tooltips no rail colapsado.
- Entregar: cover do projecto + índice de frames + componentes (sidebar, topbar, buttons, inputs, badges, modais, empty states) + todos os ecrãs acima.
- Idioma da UI: português de Portugal.
- Incluir variante mobile dos ecrãs críticos: Painel, Clientes, Mensagens, Documentos, Definições, Hub Calculadoras, Portal cliente, Página pública.

Gera primeiro o design system (cores, tipo, componentes) e depois os ecrãs na ordem A → B → C.
```

---


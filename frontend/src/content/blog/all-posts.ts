import type { BlogPost } from '@/content/blog/types'
import { enrichPost } from '@/content/blog/enrich'
import { postProtegerDados } from '@/content/blog/posts/proteger-dados-fiscais-freelancer-portugal'
import { postAbrirEni } from '@/content/blog/posts/abrir-empresa-individual-eni'
import { postComoEmitirReciboVerde } from '@/content/blog/posts/como-emitir-recibo-verde-passo-a-passo'
import { postDeclaracaoIrs } from '@/content/blog/posts/declaracao-irs-guia-pratico'
import { postEscolherSoftware } from '@/content/blog/posts/escolher-software-faturacao-portugal'
import { postFreelancerEstrangeiro } from '@/content/blog/posts/freelancer-estrangeiro-portugal'
import { postIrsErros } from '@/content/blog/posts/irs-recibos-verdes-erros-comuns'
import { postIva } from '@/content/blog/posts/iva-quando-preciso-de-me-registar'
import { postObrigacoesMes } from '@/content/blog/posts/obrigacoes-fiscais-mes-a-mes'
import { postPassarIsentoIva } from '@/content/blog/posts/quando-passar-de-isento-a-iva'
import { postQuantoCustaAbrir } from '@/content/blog/posts/quanto-custa-abrir-actividade-portugal'
import { postPrazosIrs2026 } from '@/content/blog/posts/prazos-irs-2026-independentes'
import { postRecibos } from '@/content/blog/posts/recibos-verdes-vs-faturacao'
import { postRegimeSimplificado } from '@/content/blog/posts/regime-simplificado-vs-contabilidade-organizada'
import { postRetencaoFonte } from '@/content/blog/posts/retencao-fonte-recibos-verdes'
import { postSegurancaSocial } from '@/content/blog/posts/seguranca-social-trabalhador-independente'
import { postGuiaCompletoIndependente } from '@/content/blog/posts/guia-completo-trabalhador-independente-portugal-2026'
import { postCalendarioFiscal2026 } from '@/content/blog/posts/calendario-fiscal-portugal-2026-completo'
import { postDeducoesIrs } from '@/content/blog/posts/deducoes-irs-portugal-guia-completo'
import { postEscolherContabilista } from '@/content/blog/posts/como-escolher-contabilista-portugal'
import { postOrganizarDocumentos } from '@/content/blog/posts/organizar-documentos-fiscais-arquivo-digital'
import { postPortalFinancas } from '@/content/blog/posts/portal-financas-guia-completo-iniciantes'
import { postEstudarContabilidade } from '@/content/blog/posts/estudar-contabilidade-portugal-guia-estudantes'
import { postFerramentasContabilista } from '@/content/blog/posts/ferramentas-essenciais-contabilista-2026'
import { postDigitalizarEscritorio } from '@/content/blog/posts/digitalizar-escritorio-contabilidade-portugal'
import { postContabilidadeLeigos } from '@/content/blog/posts/contabilidade-explicada-leigos-portugal'
import { postGestaoPrazosEscritorio } from '@/content/blog/posts/gestao-prazos-fiscais-escritorio-contabilidade'

const RAW_POSTS: BlogPost[] = [
  postGestaoPrazosEscritorio,
  postContabilidadeLeigos,
  postDigitalizarEscritorio,
  postFerramentasContabilista,
  postEstudarContabilidade,
  postCalendarioFiscal2026,
  postDeducoesIrs,
  postGuiaCompletoIndependente,
  postPortalFinancas,
  postOrganizarDocumentos,
  postEscolherContabilista,
  postProtegerDados,
  postComoEmitirReciboVerde,
  postSegurancaSocial,
  postQuantoCustaAbrir,
  postIrsErros,
  postEscolherSoftware,
  postRetencaoFonte,
  postFreelancerEstrangeiro,
  postRegimeSimplificado,
  postPassarIsentoIva,
  postPrazosIrs2026,
  postDeclaracaoIrs,
  postAbrirEni,
  postObrigacoesMes,
  postIva,
  postRecibos,
]

export const BLOG_POSTS: BlogPost[] = RAW_POSTS.map(enrichPost)

/** Carrega artigo completo — sem importar o catálogo (menos JS na página do post). */
export async function fetchBlogPost(slug: string) {
  const { loadBlogPost } = await import('@/content/blog/post-loaders')
  return loadBlogPost(slug)
}

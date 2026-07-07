export const contabilQueryKeys = {
  clients: {
    all: ['contabil', 'clients'] as const,
    list: (page: number, limit: number) => ['contabil', 'clients', 'list', page, limit] as const,
    detail: (clientId: string) => ['contabil', 'clients', 'detail', clientId] as const,
    hub: (clientId: string) => ['contabil', 'clients', 'hub', clientId] as const,
  },
  messages: {
    unread: ['contabil', 'messages', 'unread'] as const,
    threads: ['contabil', 'messages', 'threads'] as const,
  },
}

import { describe, expect, it } from 'vitest'

import { buildTaskEditPatch, type TaskEditValues } from '@/features/firm/tasks/TaskEditDialog'

function base(overrides: Partial<TaskEditValues> = {}): TaskEditValues {
  return {
    title: 'Solicitar documentos IRS',
    description: '',
    priority: 'NORMAL',
    dueDate: '',
    assigneeId: '',
    clientIds: [],
    ...overrides,
  }
}

describe('buildTaskEditPatch', () => {
  it('envia clientIds como array, mesmo vazio (tarefa sem cliente)', () => {
    const patch = buildTaskEditPatch(base())
    expect(patch.clientIds).toEqual([])
  })

  it('envia todos os clientes selecionados', () => {
    const patch = buildTaskEditPatch(base({ clientIds: ['client-a', 'client-b', 'client-c'] }))
    expect(patch.clientIds).toEqual(['client-a', 'client-b', 'client-c'])
  })

  it('normaliza campos vazios para null (não string vazia)', () => {
    const patch = buildTaskEditPatch(base({ description: '  ', dueDate: '', assigneeId: '' }))
    expect(patch.description).toBeNull()
    expect(patch.dueDate).toBeNull()
    expect(patch.assigneeId).toBeNull()
  })

  it('mantém título e descrição sem espaços nas pontas', () => {
    const patch = buildTaskEditPatch(base({ title: '  Rever processo  ', description: '  Notas internas  ' }))
    expect(patch.title).toBe('Rever processo')
    expect(patch.description).toBe('Notas internas')
  })
})

export type SortType = 'string' | 'number' | 'date'

const ESTADO_ORDER: Record<string, number> = {
  pendiente: 0,
  parcial: 1,
  pagada: 2,
}

function getValueByPath<T>(item: T, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => {
    if (o != null && typeof o === 'object' && k in o) {
      return (o as Record<string, unknown>)[k]
    }
    return undefined
  }, item as unknown)
}

function compareValues(
  a: unknown, b: unknown,
  direction: 'asc' | 'desc',
  type: SortType,
  field: string,
): number {
  // Null/undefined sort to end
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1

  // Estado custom business order
  if (field === 'estado') {
    const aOrder = ESTADO_ORDER[a as string]
    const bOrder = ESTADO_ORDER[b as string]
    if (aOrder !== undefined && bOrder !== undefined) {
      const cmp = aOrder - bOrder
      return direction === 'asc' ? cmp : -cmp
    }
    if (aOrder !== undefined) return -1
    if (bOrder !== undefined) return 1
  }

  let comparison: number
  switch (type) {
    case 'string':
      comparison = String(a).localeCompare(String(b), 'es')
      break
    case 'number':
      comparison = Number(a) - Number(b)
      break
    case 'date':
      comparison = new Date(a as string).getTime() - new Date(b as string).getTime()
      break
    default:
      comparison = 0
  }

  return direction === 'asc' ? comparison : -comparison
}

export function sortData<T>(
  data: T[],
  field: string,
  direction: 'asc' | 'desc',
  type: SortType,
): T[] {
  return [...data].sort((a, b) => {
    const valA = getValueByPath(a, field)
    const valB = getValueByPath(b, field)
    return compareValues(valA, valB, direction, type, field)
  })
}

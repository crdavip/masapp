export function formatCOP(value: number | string): string {
  const num = typeof value === 'string' ? Number(value) : value
  if (isNaN(num)) return '$0'
  return '$' + Math.round(num).toLocaleString('es-CO')
}

export function truncate(text: string | null | undefined, max: number): string {
  if (!text) return ''
  if (text.length <= max) return text
  return text.slice(0, max) + '...'
}

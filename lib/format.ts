export function formatCOP(value: number | string): string {
  const num = typeof value === 'string' ? Number(value) : value
  if (isNaN(num)) return '$0'
  return '$' + Math.round(num).toLocaleString('es-CO')
}

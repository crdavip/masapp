import { describe, it, expect } from 'vitest'
import { truncate } from '../../lib/format'

describe('truncate', () => {
  it('returns full string when shorter than max', () => {
    expect(truncate('Calle 123', 50)).toBe('Calle 123')
  })

  it('truncates with ellipsis when longer than max', () => {
    const long = 'Avenida Siempre Viva 1234, Barrio Centro, Ciudad de Bogotá D.C.'
    const result = truncate(long, 50)
    expect(result).toHaveLength(53) // 50 chars + '...'
    expect(result.endsWith('...')).toBe(true)
    expect(result.slice(0, 50)).toBe(long.slice(0, 50))
  })

  it('returns empty string for null input', () => {
    expect(truncate(null, 50)).toBe('')
  })

  it('returns empty string for undefined input', () => {
    expect(truncate(undefined, 50)).toBe('')
  })
})

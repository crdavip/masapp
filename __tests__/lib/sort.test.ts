import { describe, it, expect } from 'vitest'
import { sortData } from '../../lib/sort'

describe('sortData', () => {
  it('sorts strings ascending case-insensitively', () => {
    const data = [{ nombre: 'Zeta' }, { nombre: 'álfa' }]
    const result = sortData(data, 'nombre', 'asc', 'string')
    expect(result[0].nombre).toBe('álfa')
    expect(result[1].nombre).toBe('Zeta')
  })

  it('sorts strings descending', () => {
    const data = [{ nombre: 'A' }, { nombre: 'B' }, { nombre: 'C' }]
    const result = sortData(data, 'nombre', 'desc', 'string')
    expect(result[0].nombre).toBe('C')
    expect(result[1].nombre).toBe('B')
    expect(result[2].nombre).toBe('A')
  })

  it('sorts Decimal strings as numbers', () => {
    const data = [{ precio: '15000' }, { precio: '8000' }]
    const result = sortData(data, 'precio', 'asc', 'number')
    expect(result[0].precio).toBe('8000')
    expect(result[1].precio).toBe('15000')
  })

  it('sorts numbers descending', () => {
    const data = [{ cantidad: 5 }, { cantidad: 10 }, { cantidad: 3 }]
    const result = sortData(data, 'cantidad', 'desc', 'number')
    expect(result[0].cantidad).toBe(10)
    expect(result[1].cantidad).toBe(5)
    expect(result[2].cantidad).toBe(3)
  })

  it('returns empty array for empty input', () => {
    const result = sortData([], 'nombre', 'asc', 'string')
    expect(result).toEqual([])
  })

  it('sorts null/undefined values to end ascending', () => {
    const data = [
      { nombre: 'B' },
      { nombre: null },
      { nombre: 'A' },
      { nombre: undefined },
    ]
    const result = sortData(data, 'nombre', 'asc', 'string')
    expect(result[0].nombre).toBe('A')
    expect(result[1].nombre).toBe('B')
    expect(result[2].nombre).toBeNull()
    expect(result[3].nombre).toBeUndefined()
  })

  it('sorts dates ascending', () => {
    const data = [
      { fecha: '2024-06-01T00:00:00.000Z' },
      { fecha: '2024-01-15T00:00:00.000Z' },
      { fecha: '2024-03-01T00:00:00.000Z' },
    ]
    const result = sortData(data, 'fecha', 'asc', 'date')
    expect(result[0].fecha).toBe('2024-01-15T00:00:00.000Z')
    expect(result[1].fecha).toBe('2024-03-01T00:00:00.000Z')
    expect(result[2].fecha).toBe('2024-06-01T00:00:00.000Z')
  })

  it('sorts dates descending', () => {
    const data = [
      { fecha: '2024-01-15T00:00:00.000Z' },
      { fecha: '2024-06-01T00:00:00.000Z' },
    ]
    const result = sortData(data, 'fecha', 'desc', 'date')
    expect(result[0].fecha).toBe('2024-06-01T00:00:00.000Z')
    expect(result[1].fecha).toBe('2024-01-15T00:00:00.000Z')
  })

  it('sorts by nested dot-path key', () => {
    const data = [
      { cliente: { nombre: 'Zeta' } },
      { cliente: { nombre: 'Ángel' } },
    ]
    const result = sortData(data, 'cliente.nombre', 'asc', 'string')
    expect(result[0].cliente.nombre).toBe('Ángel')
    expect(result[1].cliente.nombre).toBe('Zeta')
  })

  it('sorts estado ascending pendiente → parcial → pagada', () => {
    const data = [
      { estado: 'pagada' },
      { estado: 'pendiente' },
      { estado: 'parcial' },
    ]
    const result = sortData(data, 'estado', 'asc', 'string')
    expect(result[0].estado).toBe('pendiente')
    expect(result[1].estado).toBe('parcial')
    expect(result[2].estado).toBe('pagada')
  })

  it('sorts estado descending pagada → parcial → pendiente', () => {
    const data = [
      { estado: 'pendiente' },
      { estado: 'pagada' },
      { estado: 'parcial' },
    ]
    const result = sortData(data, 'estado', 'desc', 'string')
    expect(result[0].estado).toBe('pagada')
    expect(result[1].estado).toBe('parcial')
    expect(result[2].estado).toBe('pendiente')
  })

  it('does not mutate the original array', () => {
    const data = [{ nombre: 'B' }, { nombre: 'A' }]
    const snapshot = [data[0], data[1]]
    sortData(data, 'nombre', 'asc', 'string')
    expect(data[0]).toBe(snapshot[0])
    expect(data[1]).toBe(snapshot[1])
  })

  it('handles missing nested path gracefully', () => {
    const data = [
      { cliente: { nombre: 'A' } },
      { cliente: {} },
      { cliente: { nombre: 'C' } },
    ]
    const result = sortData(data, 'cliente.nombre', 'asc', 'string')
    expect(result[0].cliente.nombre).toBe('A')
    expect(result[1].cliente.nombre).toBe('C')
    // middle item has no nombre — sorts to end
    expect(result[2].cliente).toEqual({})
  })
})

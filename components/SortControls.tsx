'use client'

import { ArrowUpDown } from 'lucide-react'
import type { SortType } from '@/lib/sort'

export type SortOption = {
  label: string
  value: string
  type: SortType
}

export type SortControlsProps = {
  options: SortOption[]
  field: string
  direction: 'asc' | 'desc'
  onChange: (field: string, direction: 'asc' | 'desc') => void
  itemCount: number
}

export default function SortControls({
  options,
  field,
  direction,
  onChange,
  itemCount,
}: SortControlsProps) {
  if (itemCount <= 1) return null

  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      <select
        value={field}
        onChange={(e) => onChange(e.target.value, direction)}
        className="flex-1 min-w-[140px] border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        aria-label="Campo de ordenación"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onChange(field, direction === 'asc' ? 'desc' : 'asc')}
        className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
        title={direction === 'asc' ? 'Orden descendente' : 'Orden ascendente'}
      >
        <ArrowUpDown size={16} className="text-gray-600" />
      </button>
    </div>
  )
}

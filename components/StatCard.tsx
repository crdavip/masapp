import type { LucideIcon } from 'lucide-react'

export default function StatCard({
  icon: Icon,
  label,
  value,
  color = 'text-gray-800',
}: {
  icon: LucideIcon
  label: string
  value: string | number
  color?: string
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 flex items-center gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
        <Icon size={20} className="text-blue-700" />
      </div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-gray-500 truncate">{label}</p>
        <p className={`text-lg sm:text-2xl font-bold truncate ${color}`}>{value}</p>
      </div>
    </div>
  )
}

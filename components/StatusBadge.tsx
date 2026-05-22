import { Clock, CircleCheck, Ban } from 'lucide-react'

const config = {
  pendiente: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', icon: Clock },
  parcial: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', icon: Ban },
  pagada: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', icon: CircleCheck },
}

export default function StatusBadge({ estado }: { estado: string }) {
  const c = config[estado as keyof typeof config] || config.pendiente
  const Icon = c.icon

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      <Icon size={12} />
      {estado.charAt(0).toUpperCase() + estado.slice(1)}
    </span>
  )
}

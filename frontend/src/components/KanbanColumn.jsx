import { useDroppable } from '@dnd-kit/core'
import KanbanCard from './KanbanCard'

const BORDER_COLOR = {
  saved:     'border-gray-700',
  applied:   'border-blue-800',
  need_prep: 'border-amber-800',
  interview: 'border-yellow-800',
  offer:     'border-emerald-800',
}

const HEADER_COLOR = {
  saved:     'text-gray-400',
  applied:   'text-blue-400',
  need_prep: 'text-amber-400',
  interview: 'text-yellow-400',
  offer:     'text-emerald-400',
}

export default function KanbanColumn({ id, title, jobs, onContextMenu }) {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div className="flex flex-col gap-2 min-w-[240px] w-[240px]">
      <div className="flex items-center justify-between px-1">
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${HEADER_COLOR[id] ?? 'text-gray-400'}`}>
          {title}
        </h3>
        <span className="text-xs text-gray-600 font-mono">{jobs.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 min-h-[120px] rounded-xl border p-2 transition-colors
          ${isOver ? 'bg-gray-800/60' : 'bg-gray-900/30'}
          ${BORDER_COLOR[id] ?? 'border-gray-700'}`}
      >
        {jobs.map(job => (
          <KanbanCard key={job.id} job={job} onContextMenu={onContextMenu} />
        ))}
        {jobs.length === 0 && (
          <p className="text-xs text-gray-700 text-center py-6">—</p>
        )}
      </div>
    </div>
  )
}

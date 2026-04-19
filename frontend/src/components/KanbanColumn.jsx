import { useDroppable } from '@dnd-kit/core'
import KanbanCard from './KanbanCard'

const BULLET = {
  saved:     'bg-paper border-ink',
  applied:   'bg-[#bcbcbc] border-ink',
  need_prep: 'bg-amber-400 border-amber-600',
  interview: 'bg-emerald-500 border-emerald-ink',
  offer:     'bg-emerald-ink border-emerald-ink',
  rejected:  'bg-[#c84040] border-[#9a2020]',
  closed:    'bg-ink-4 border-ink-3',
  accepted:  'bg-emerald-500 border-emerald-ink',
}

export default function KanbanColumn({ id, title, jobs, onContextMenu }) {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div className="flex flex-col flex-[0_0_220px] w-[220px]">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 mb-1 border-b-[1.5px] border-dashed border-line-soft">
        <span className={`w-2.5 h-2.5 rounded-full border-[1.5px] shrink-0 ${BULLET[id] ?? BULLET.saved}`} />
        <h3 className="font-sketch text-[20px] font-bold text-ink leading-none flex-1">{title}</h3>
        <span className="font-code text-[11px] text-ink-4">{jobs.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 min-h-[520px] rounded-[10px] border-[1.5px] border-ink p-2.5 transition-colors
          ${isOver ? 'bg-emerald-wash' : 'bg-paper-2'}`}
      >
        {jobs.map(job => (
          <KanbanCard key={job.id} job={job} onContextMenu={onContextMenu} />
        ))}
        {jobs.length === 0 && (
          <p className="font-code text-xs text-ink-4 text-center mt-8">—</p>
        )}
      </div>
    </div>
  )
}

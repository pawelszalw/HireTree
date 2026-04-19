import { useDraggable } from '@dnd-kit/core'
import { Link } from 'react-router-dom'

export default function KanbanCard({ job, onContextMenu }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: job.id })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onContextMenu={onContextMenu ? (e) => onContextMenu(e, job) : undefined}
      className={`bg-paper border-[1.5px] rounded-[6px] p-2.5 select-none transition-all
        ${isDragging
          ? 'opacity-30 border-line-soft cursor-grabbing'
          : 'border-ink cursor-grab shadow-[1px_1px_0_rgba(0,0,0,0.06)] hover:shadow-[2px_2px_0_rgba(0,0,0,0.08)]'
        }`}
    >
      <div className="flex items-start justify-between gap-1">
        <Link
          to={`/jobs/${job.id}`}
          onClick={e => e.stopPropagation()}
          className="font-sketch font-bold text-[16px] text-ink leading-tight hover:text-emerald-ink transition-colors flex-1"
        >
          {job.title}
        </Link>
        {job.match_score != null && (
          <span className="font-code text-[10px] font-bold text-emerald-ink shrink-0 mt-0.5">
            {job.match_score}%
          </span>
        )}
      </div>
      {job.company && (
        <p className="font-code text-[10px] text-ink-3 mt-0.5">{job.company}</p>
      )}
      {job.stack?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {job.stack.slice(0, 3).map(tech => (
            <span key={tech} className="font-code text-[9px] px-1.5 py-[1px] bg-paper-2 border border-line-soft rounded text-ink-3">
              {tech}
            </span>
          ))}
          {job.stack.length > 3 && (
            <span className="font-code text-[9px] text-ink-4">+{job.stack.length - 3}</span>
          )}
        </div>
      )}
    </div>
  )
}

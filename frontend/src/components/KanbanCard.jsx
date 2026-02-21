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
      className={`bg-gray-900 border rounded-lg p-3 select-none transition-colors
        ${isDragging
          ? 'opacity-30 border-gray-700 cursor-grabbing'
          : 'border-gray-800 cursor-grab hover:border-gray-700'
        }`}
    >
      <Link
        to={`/jobs/${job.id}`}
        onClick={e => e.stopPropagation()}
        className="text-sm font-medium text-gray-100 leading-tight hover:text-emerald-400 transition-colors"
      >
        {job.title}
      </Link>
      {job.company && (
        <p className="text-xs text-gray-500 mt-0.5">{job.company}</p>
      )}
      {job.stack?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {job.stack.slice(0, 3).map(tech => (
            <span key={tech} className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
              {tech}
            </span>
          ))}
          {job.stack.length > 3 && (
            <span className="text-xs text-gray-600">+{job.stack.length - 3}</span>
          )}
        </div>
      )}
      {job.match_score != null && (
        <div className="flex items-center gap-1.5 mt-2">
          <div className="flex-1 bg-gray-800 rounded-full h-1 overflow-hidden">
            <div
              className={`h-1 rounded-full ${
                job.match_score >= 75 ? 'bg-emerald-500' :
                job.match_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${job.match_score}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-500 shrink-0">{job.match_score}%</span>
        </div>
      )}
    </div>
  )
}

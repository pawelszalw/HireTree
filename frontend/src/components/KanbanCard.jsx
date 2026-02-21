import { useDraggable } from '@dnd-kit/core'

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
      <p className="text-sm font-medium text-gray-100 leading-tight">{job.title}</p>
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
    </div>
  )
}

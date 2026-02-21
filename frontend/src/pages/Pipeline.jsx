import { useState, useEffect, useCallback } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import KanbanColumn from '../components/KanbanColumn'
import ContextMenu from '../components/ContextMenu'
import { fetchJobs, updateJobStatus } from '../api/clip'

const ACTIVE_COLUMNS = ['saved', 'applied', 'need_prep', 'interview', 'offer']
const ARCHIVED_STATUSES = ['rejected', 'closed', 'accepted']

function CardPreview({ job }) {
  return (
    <div className="bg-gray-900 border border-emerald-500/40 rounded-lg p-3 shadow-2xl cursor-grabbing select-none">
      <p className="text-sm font-medium text-gray-100 leading-tight">{job.title}</p>
      {job.company && <p className="text-xs text-gray-500 mt-0.5">{job.company}</p>}
      {job.stack?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {job.stack.slice(0, 3).map(tech => (
            <span key={tech} className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
              {tech}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Pipeline() {
  const { t } = useTranslation()
  const [jobs, setJobs] = useState([])
  const [activeJob, setActiveJob] = useState(null)
  const [contextMenu, setContextMenu] = useState(null) // { x, y, job }
  const [showArchived, setShowArchived] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  useEffect(() => {
    fetchJobs().then(setJobs).catch(() => {})
  }, [])

  const moveJob = useCallback(async (jobId, newStatus) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j))
    setContextMenu(null)
    try {
      await updateJobStatus(jobId, newStatus)
    } catch {
      // silently revert on error by re-fetching
      fetchJobs().then(setJobs).catch(() => {})
    }
  }, [])

  const handleDragStart = ({ active }) => {
    setActiveJob(jobs.find(j => j.id === active.id) ?? null)
  }

  const handleDragEnd = ({ active, over }) => {
    setActiveJob(null)
    if (!over) return
    const job = jobs.find(j => j.id === active.id)
    if (!job || job.status === over.id) return
    moveJob(job.id, over.id)
  }

  const handleContextMenu = (e, job) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, job })
  }

  const archivedJobs = jobs.filter(j => ARCHIVED_STATUSES.includes(j.status))

  return (
    <div className="flex flex-col gap-6" onClick={() => setContextMenu(null)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">{t('pipeline.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('pipeline.subtitle')}</p>
        </div>
        {archivedJobs.length > 0 && (
          <button
            onClick={e => { e.stopPropagation(); setShowArchived(v => !v) }}
            className="text-xs text-gray-500 hover:text-gray-300 border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
          >
            {showArchived
              ? t('pipeline.hideArchived')
              : t('pipeline.showArchived', { count: archivedJobs.length })}
          </button>
        )}
      </div>

      {/* Kanban board */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ACTIVE_COLUMNS.map(col => (
            <KanbanColumn
              key={col}
              id={col}
              title={t(`status.${col}`)}
              jobs={jobs.filter(j => j.status === col)}
              onContextMenu={handleContextMenu}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeJob && <CardPreview job={activeJob} />}
        </DragOverlay>
      </DndContext>

      {/* Archived section */}
      {showArchived && archivedJobs.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {t('pipeline.archived')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {archivedJobs.map(job => (
              <div
                key={job.id}
                onContextMenu={e => handleContextMenu(e, job)}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 opacity-60 cursor-context-menu"
              >
                <p className="text-sm font-medium text-gray-300">{job.title}</p>
                {job.company && <p className="text-xs text-gray-500 mt-0.5">{job.company}</p>}
                <span className="text-xs text-gray-600 mt-2 inline-block">
                  {t(`status.${job.status}`)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          job={contextMenu.job}
          onMove={(status) => moveJob(contextMenu.job.id, status)}
          onClose={() => setContextMenu(null)}
          activeColumns={ACTIVE_COLUMNS}
          archivedStatuses={ARCHIVED_STATUSES}
        />
      )}
    </div>
  )
}

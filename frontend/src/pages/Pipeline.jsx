import { useState, useEffect, useCallback } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import KanbanColumn from '../components/KanbanColumn'
import ContextMenu from '../components/ContextMenu'
import { fetchJobs, updateJobStatus } from '../api/clip'
import { useJobClipListener } from '../hooks/useJobClipListener'

const ACTIVE_COLUMNS = ['saved', 'applied', 'need_prep', 'interview', 'offer']
const ARCHIVED_STATUSES = ['rejected', 'closed', 'accepted']

function CardPreview({ job }) {
  return (
    <div className="bg-paper border-[1.5px] border-emerald-ink rounded-[6px] p-2.5 shadow-md cursor-grabbing select-none -rotate-1">
      <p className="font-sketch font-bold text-[16px] text-ink leading-tight">{job.title}</p>
      {job.company && <p className="font-code text-[10px] text-ink-3 mt-0.5">{job.company}</p>}
      {job.stack?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {job.stack.slice(0, 3).map(tech => (
            <span key={tech} className="font-code text-[9px] px-1.5 py-[1px] bg-paper-2 border border-line-soft rounded text-ink-3">
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
  const [contextMenu, setContextMenu] = useState(null)
  const [showArchived, setShowArchived] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  useEffect(() => {
    fetchJobs().then(setJobs).catch(() => {})
  }, [])
  useJobClipListener(setJobs)

  const moveJob = useCallback(async (jobId, newStatus) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j))
    setContextMenu(null)
    try {
      await updateJobStatus(jobId, newStatus)
    } catch {
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
    <div className="flex flex-col gap-5" onClick={() => setContextMenu(null)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sketch text-3xl font-bold text-ink">{t('pipeline.title')}</h1>
          <p className="font-code text-[10px] text-ink-4 mt-0.5">{t('pipeline.subtitle')}</p>
        </div>
        {archivedJobs.length > 0 && (
          <button
            onClick={e => { e.stopPropagation(); setShowArchived(v => !v) }}
            className="font-code text-xs text-ink-3 border border-line-soft hover:border-ink-3 px-3 py-1.5 rounded transition-colors"
          >
            {showArchived
              ? t('pipeline.hideArchived')
              : t('pipeline.showArchived', { count: archivedJobs.length })}
          </button>
        )}
      </div>

      {/* Kanban board */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
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
          <h2 className="font-sketch text-xl font-bold text-ink-3 mb-3">{t('pipeline.archived')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {archivedJobs.map(job => (
              <div
                key={job.id}
                onContextMenu={e => handleContextMenu(e, job)}
                className="bg-paper-2 border-[1.5px] border-dashed border-line-soft rounded-lg p-3 opacity-60 cursor-context-menu"
              >
                <p className="font-sketch font-bold text-base text-ink">{job.title}</p>
                {job.company && <p className="font-code text-[10px] text-ink-3 mt-0.5">{job.company}</p>}
                <span className="font-code text-[10px] text-ink-4 mt-2 inline-block">
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

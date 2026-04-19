import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

export default function ContextMenu({ x, y, job, onMove, onClose, activeColumns, archivedStatuses }) {
  const { t } = useTranslation()
  const ref = useRef(null)

  useEffect(() => {
    const handleMouseDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const isArchived = archivedStatuses.includes(job.status)
  const moveTo = activeColumns.filter(col => col !== job.status)
  const archiveTo = archivedStatuses.filter(s => s !== job.status)

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', top: y, left: x, zIndex: 9999 }}
      onClick={e => e.stopPropagation()}
      className="bg-paper border-[1.5px] border-ink rounded-lg shadow-[3px_3px_0_rgba(0,0,0,0.1)] py-1 min-w-[190px]"
    >
      {!isArchived && (
        <>
          <p className="font-code text-[9px] text-ink-4 px-3 pt-2 pb-1 uppercase tracking-[1.5px]">
            {t('contextMenu.moveTo')}
          </p>
          {moveTo.map(col => (
            <button
              key={col}
              onClick={() => onMove(col)}
              className="w-full text-left font-hand text-sm text-ink-2 hover:bg-paper-2 hover:text-ink px-3 py-1.5 transition-colors"
            >
              {t(`status.${col}`)}
            </button>
          ))}
          <div className="border-t border-dashed border-line-soft my-1" />
        </>
      )}

      <p className="font-code text-[9px] text-ink-4 px-3 pt-2 pb-1 uppercase tracking-[1.5px]">
        {t('contextMenu.archive')}
      </p>
      {archiveTo.map(s => (
        <button
          key={s}
          onClick={() => onMove(s)}
          className="w-full text-left font-hand text-sm text-ink-3 hover:bg-paper-2 hover:text-[#c84040] px-3 py-1.5 transition-colors"
        >
          {t(`status.${s}`)}
        </button>
      ))}

      {isArchived && (
        <>
          <div className="border-t border-dashed border-line-soft my-1" />
          <p className="font-code text-[9px] text-ink-4 px-3 pt-2 pb-1 uppercase tracking-[1.5px]">
            {t('contextMenu.restore')}
          </p>
          {activeColumns.map(col => (
            <button
              key={col}
              onClick={() => onMove(col)}
              className="w-full text-left font-hand text-sm text-ink-2 hover:bg-paper-2 hover:text-ink px-3 py-1.5 transition-colors"
            >
              {t(`status.${col}`)}
            </button>
          ))}
        </>
      )}
    </div>
  )
}

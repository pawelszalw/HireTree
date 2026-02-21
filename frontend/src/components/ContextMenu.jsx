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
      className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl py-1 min-w-[190px]"
    >
      {!isArchived && (
        <>
          <p className="text-xs text-gray-600 px-3 pt-2 pb-1 uppercase tracking-wider">
            {t('contextMenu.moveTo')}
          </p>
          {moveTo.map(col => (
            <button
              key={col}
              onClick={() => onMove(col)}
              className="w-full text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-gray-100 px-3 py-2 transition-colors"
            >
              {t(`status.${col}`)}
            </button>
          ))}
          <div className="border-t border-gray-800 my-1" />
        </>
      )}

      <p className="text-xs text-gray-600 px-3 pt-2 pb-1 uppercase tracking-wider">
        {t('contextMenu.archive')}
      </p>
      {archiveTo.map(s => (
        <button
          key={s}
          onClick={() => onMove(s)}
          className="w-full text-left text-sm text-gray-400 hover:bg-gray-800 hover:text-red-300 px-3 py-2 transition-colors"
        >
          {t(`status.${s}`)}
        </button>
      ))}

      {isArchived && (
        <>
          <div className="border-t border-gray-800 my-1" />
          <p className="text-xs text-gray-600 px-3 pt-2 pb-1 uppercase tracking-wider">
            {t('contextMenu.restore')}
          </p>
          {activeColumns.map(col => (
            <button
              key={col}
              onClick={() => onMove(col)}
              className="w-full text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-gray-100 px-3 py-2 transition-colors"
            >
              {t(`status.${col}`)}
            </button>
          ))}
        </>
      )}
    </div>
  )
}

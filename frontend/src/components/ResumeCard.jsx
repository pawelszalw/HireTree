import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function ResumeCard({ resume, onSetActive, onRename, onDelete }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(resume.name)

  const handleRename = () => {
    setEditing(false)
    const trimmed = name.trim()
    if (trimmed && trimmed !== resume.name) {
      onRename(resume.id, trimmed)
    } else {
      setName(resume.name)
    }
  }

  return (
    <div
      className={`bg-gray-900 border rounded-xl p-5 flex flex-col gap-3 transition-colors
        ${resume.is_active ? 'border-emerald-700' : 'border-gray-800 hover:border-gray-700'}`}
    >
      {resume.is_active && (
        <span className="text-xs text-emerald-400 font-medium">● {t('profile.active')}</span>
      )}

      {editing ? (
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={e => {
            if (e.key === 'Enter') handleRename()
            if (e.key === 'Escape') { setName(resume.name); setEditing(false) }
          }}
          className="text-sm font-semibold bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-100 focus:outline-none focus:border-emerald-500"
        />
      ) : (
        <h3
          className="text-sm font-semibold text-gray-100 cursor-pointer hover:text-emerald-400 transition-colors"
          onClick={() => setEditing(true)}
          title={t('profile.clickToRename')}
        >
          {resume.name}
        </h3>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
        <span>{resume.skills?.length ?? 0} {t('profile.skills')}</span>
        <span>·</span>
        <span>{resume.source === 'manual' ? 'Manual' : 'CV'}</span>
        {resume.current_role && (
          <>
            <span>·</span>
            <span className="truncate">{resume.current_role}</span>
          </>
        )}
      </div>

      <div className="flex gap-2 mt-auto pt-1">
        {!resume.is_active && (
          <button
            onClick={() => onSetActive(resume.id)}
            className="flex-1 text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 py-1.5 rounded-lg transition-colors"
          >
            {t('profile.setActive')}
          </button>
        )}
        <button
          onClick={() => onDelete(resume.id)}
          className="text-xs text-gray-600 hover:text-red-400 transition-colors px-2 ml-auto"
        >
          {t('profile.delete')}
        </button>
      </div>
    </div>
  )
}

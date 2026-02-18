import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { updateSkill } from '../api/clip'

const RECENCY_STYLES = {
  'current':        'bg-emerald-900 text-emerald-400 border-emerald-800',
  '1-2 years ago':  'bg-yellow-900 text-yellow-400 border-yellow-800',
  '3+ years ago':   'bg-gray-800 text-gray-500 border-gray-700',
}

const RECENCY_LABELS = {
  'current':        'skillProfile.current',
  '1-2 years ago':  'skillProfile.recentLabel',
  '3+ years ago':   'skillProfile.outdatedLabel',
}

export default function SkillEditor({ skill: initialSkill, onUpdate }) {
  const { t } = useTranslation()
  const [skill, setSkill] = useState(initialSkill)
  const [noteOpen, setNoteOpen] = useState(!!initialSkill.note)
  const [noteDraft, setNoteDraft] = useState(initialSkill.note || '')

  const displayRating = skill.user_rating ?? null
  const aiRating = skill.ai_confidence ?? 3
  const effectiveRating = displayRating ?? aiRating

  const handleStarClick = async (star) => {
    const newRating = star === skill.user_rating ? null : star
    const updated = { ...skill, user_rating: newRating }
    setSkill(updated)
    onUpdate?.(updated)
    try {
      await updateSkill(skill.name, { user_rating: newRating })
    } catch {
      // revert on failure
      setSkill(skill)
      onUpdate?.(skill)
    }
  }

  const handleNoteBlur = async () => {
    if (noteDraft === skill.note) return
    const updated = { ...skill, note: noteDraft }
    setSkill(updated)
    onUpdate?.(updated)
    try {
      await updateSkill(skill.name, { note: noteDraft })
    } catch {
      setSkill(skill)
      onUpdate?.(skill)
    }
  }

  const recencyStyle = RECENCY_STYLES[skill.recency] ?? RECENCY_STYLES['3+ years ago']
  const recencyLabel = RECENCY_LABELS[skill.recency]
    ? t(RECENCY_LABELS[skill.recency])
    : skill.recency

  const isAiEstimate = displayRating === null

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3 py-1.5">
        {/* Skill name */}
        <span className="text-sm text-gray-200 w-36 shrink-0 truncate" title={skill.name}>
          {skill.name}
        </span>

        {/* Recency badge */}
        <span className={`text-xs px-2 py-0.5 rounded border ${recencyStyle} shrink-0`}>
          {recencyLabel}
        </span>

        {/* Stars */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => handleStarClick(star)}
              className={`text-base leading-none transition-colors ${
                star <= effectiveRating
                  ? isAiEstimate ? 'text-gray-500' : 'text-emerald-400'
                  : 'text-gray-700'
              } hover:text-emerald-400`}
              title={isAiEstimate && star <= aiRating ? t('skillProfile.aiEstimate') : ''}
            >
              ★
            </button>
          ))}
        </div>

        {/* Label: AI estimate or Your rating */}
        <span className="text-xs text-gray-600 shrink-0">
          {isAiEstimate ? t('skillProfile.aiEstimate') : t('skillProfile.manualOverride')}
        </span>

        {/* Note toggle */}
        <button
          onClick={() => setNoteOpen(o => !o)}
          className="ml-auto text-xs text-gray-600 hover:text-gray-400 transition-colors shrink-0"
        >
          {noteOpen ? '▲' : '▼'} {t('skillProfile.addNote')}
        </button>
      </div>

      {/* Note field */}
      {noteOpen && (
        <input
          type="text"
          value={noteDraft}
          onChange={e => setNoteDraft(e.target.value)}
          onBlur={handleNoteBlur}
          placeholder={t('skillProfile.addNote')}
          className="text-xs bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-500 ml-39"
        />
      )}
    </div>
  )
}

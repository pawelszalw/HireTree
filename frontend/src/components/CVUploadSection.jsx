import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { uploadCV, fetchCV, buildManualProfile, refineProfile } from '../api/clip'
import SkillEditor from './SkillEditor'
import WorkHistoryForm from './WorkHistoryForm'

const RECENCY_TIERS = [
  { key: 'current',        icon: '🟢', labelKey: 'skillProfile.current' },
  { key: '1-2 years ago',  icon: '🟡', labelKey: 'skillProfile.recentLabel' },
  { key: '3+ years ago',   icon: '⬜', labelKey: 'skillProfile.outdatedLabel' },
]

export default function CVUploadSection({ onCVLoaded }) {
  const { t } = useTranslation()
  const fileInputRef = useRef(null)

  const [cv, setCv]               = useState(null)
  const [status, setStatus]       = useState(null) // null | 'loading' | 'error'
  const [error, setError]         = useState('')
  const [showManual, setShowManual] = useState(false)
  const [refineOpen, setRefineOpen] = useState(false)

  useEffect(() => {
    fetchCV()
      .then(data => { if (data) setCv(data) })
      .catch(() => {})
  }, [])

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (fileInputRef.current) fileInputRef.current.value = ''

    setStatus('loading')
    setError('')
    try {
      const data = await uploadCV(file)
      setCv(data)
      setStatus(null)
      setShowManual(false)
      onCVLoaded?.()
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  const handleManualSubmit = async (entries) => {
    const data = await buildManualProfile(entries)
    setCv(data)
    setShowManual(false)
    onCVLoaded?.()
  }

  const handleRefineSubmit = async (entries) => {
    const data = await refineProfile(entries)
    setCv(data)
    setRefineOpen(false)
  }

  const handleSkillUpdate = (updatedSkill) => {
    setCv(prev => ({
      ...prev,
      skills: prev.skills.map(s =>
        s.name === updatedSkill.name ? updatedSkill : s
      ),
    }))
  }

  // ── No profile yet ────────────────────────────────────────────────────────
  if (!cv) {
    return (
      <section className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-8 flex flex-col items-center gap-4 text-center">
        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xl">📄</div>

        {!showManual ? (
          <>
            <div>
              <p className="font-medium text-gray-300">{t('cvUpload.title')}</p>
              <p className="text-xs text-gray-600 mt-1">{t('cvUpload.description')}</p>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={status === 'loading'}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-600 text-white px-5 py-2 rounded-lg transition-colors"
            >
              {status === 'loading' ? t('cvUpload.uploading') : t('cvUpload.button')}
            </button>

            <button
              onClick={() => setShowManual(true)}
              className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
            >
              {t('cvUpload.orManual')}
            </button>
          </>
        ) : (
          <div className="w-full text-left">
            <WorkHistoryForm onSubmit={handleManualSubmit} />
            <button
              onClick={() => setShowManual(false)}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors mt-3"
            >
              ← Back
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={handleFileChange}
        />
      </section>
    )
  }

  // ── Profile loaded ────────────────────────────────────────────────────────
  const skillsByTier = RECENCY_TIERS.map(tier => ({
    ...tier,
    skills: cv.skills.filter(s => s.recency === tier.key),
  })).filter(tier => tier.skills.length > 0)

  const uncategorised = cv.skills.filter(
    s => !RECENCY_TIERS.some(t => t.key === s.recency)
  )

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-base shrink-0">📄</div>
          <div>
            <p className="font-medium text-gray-200 text-sm">
              {cv.current_role || t('cvUpload.title')}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('cvUpload.years', { count: cv.years_experience })}
              {' · '}
              <span className="text-gray-600">
                {cv.source === 'manual' ? 'Manual' : 'From CV'}
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={status === 'loading'}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors shrink-0"
        >
          {status === 'loading' ? t('cvUpload.uploading') : t('cvUpload.replace')}
        </button>
      </div>

      {/* Summary */}
      {cv.summary && (
        <p className="text-xs text-gray-500 italic leading-relaxed">{cv.summary}</p>
      )}

      {/* Skills by recency tier */}
      <div className="flex flex-col gap-4">
        {skillsByTier.map(tier => (
          <div key={tier.key}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {tier.icon} {t(tier.labelKey)}
            </p>
            <div className="flex flex-col divide-y divide-gray-800">
              {tier.skills.map(skill => (
                <SkillEditor
                  key={skill.name}
                  skill={skill}
                  onUpdate={handleSkillUpdate}
                />
              ))}
            </div>
          </div>
        ))}

        {uncategorised.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Other
            </p>
            <div className="flex flex-col divide-y divide-gray-800">
              {uncategorised.map(skill => (
                <SkillEditor
                  key={skill.name}
                  skill={skill}
                  onUpdate={handleSkillUpdate}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Refinement panel */}
      {!cv.refined && (
        <div className="border-t border-gray-800 pt-4">
          {!refineOpen ? (
            <button
              onClick={() => setRefineOpen(true)}
              className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              + {t('skillProfile.refineTitle')}
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-medium text-gray-300">{t('skillProfile.refineTitle')}</p>
                <p className="text-xs text-gray-600 mt-0.5">{t('skillProfile.refineDescription')}</p>
              </div>
              <WorkHistoryForm
                onSubmit={handleRefineSubmit}
                submitLabel={t('skillProfile.refineSubmit')}
                submittingLabel={t('workHistory.submitting')}
                isRefine
              />
              <button
                onClick={() => setRefineOpen(false)}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors self-start"
              >
                ← Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {cv.refined && (
        <p className="text-xs text-gray-600 border-t border-gray-800 pt-3">
          {t('skillProfile.refineUsed')}
        </p>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={handleFileChange}
      />
    </section>
  )
}

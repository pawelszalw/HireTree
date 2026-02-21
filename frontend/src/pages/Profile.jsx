import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ResumeCard from '../components/ResumeCard'
import AddResumeModal from '../components/AddResumeModal'
import SkillEditor from '../components/SkillEditor'
import { fetchResumes, patchResume, deleteResume, patchResumeSkill } from '../api/clip'

const RECENCY_TIERS = [
  { key: 'current',       icon: '🟢', labelKey: 'skillProfile.current' },
  { key: '1-2 years ago', icon: '🟡', labelKey: 'skillProfile.recentLabel' },
  { key: '3+ years ago',  icon: '⬜', labelKey: 'skillProfile.outdatedLabel' },
]

export default function Profile() {
  const { t } = useTranslation()
  const [resumes, setResumes] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchResumes().then(setResumes).catch(() => {})
  }, [])

  const activeResume = resumes.find(r => r.is_active) ?? resumes[0] ?? null

  const refetch = () => fetchResumes().then(setResumes).catch(() => {})

  const handleSetActive = async (id) => {
    setResumes(prev => prev.map(r => ({ ...r, is_active: r.id === id })))
    try { await patchResume(id, { is_active: true }) } catch { refetch() }
  }

  const handleRename = async (id, name) => {
    setResumes(prev => prev.map(r => r.id === id ? { ...r, name } : r))
    try { await patchResume(id, { name }) } catch { refetch() }
  }

  const handleDelete = async (id) => {
    setResumes(prev => {
      const filtered = prev.filter(r => r.id !== id)
      const wasActive = prev.find(r => r.id === id)?.is_active
      if (wasActive && filtered.length > 0) filtered[0] = { ...filtered[0], is_active: true }
      return filtered
    })
    try { await deleteResume(id) } catch { refetch() }
  }

  const handleSkillUpdate = (resumeId, updatedSkill) => {
    setResumes(prev => prev.map(r =>
      r.id === resumeId
        ? { ...r, skills: r.skills.map(s => s.name === updatedSkill.name ? updatedSkill : s) }
        : r
    ))
  }

  const handleAdded = (newResume) => {
    setResumes(prev => {
      const base = newResume.is_active ? prev.map(r => ({ ...r, is_active: false })) : prev
      return [...base, newResume]
    })
  }

  const skillsByTier = activeResume
    ? RECENCY_TIERS
        .map(tier => ({ ...tier, skills: activeResume.skills.filter(s => s.recency === tier.key) }))
        .filter(tier => tier.skills.length > 0)
    : []

  const uncategorised = activeResume
    ? activeResume.skills.filter(s => !RECENCY_TIERS.some(t => t.key === s.recency))
    : []

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100">{t('profile.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('profile.subtitle')}</p>
      </div>

      {/* Resumes section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            {t('profile.resumesTitle')}
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            {t('profile.addResume')}
          </button>
        </div>

        {resumes.length === 0 ? (
          <div className="border border-dashed border-gray-800 rounded-xl py-10 text-center">
            <p className="text-sm text-gray-600">{t('profile.noResumes')}</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              {t('profile.addResume')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map(r => (
              <ResumeCard
                key={r.id}
                resume={r}
                onSetActive={handleSetActive}
                onRename={handleRename}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>

      {/* Active resume skills */}
      {activeResume && activeResume.skills?.length > 0 && (
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-base shrink-0">📄</div>
            <div>
              <p className="font-medium text-gray-200 text-sm">
                {activeResume.current_role || activeResume.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('cvUpload.years', { count: activeResume.years_experience })}
                {' · '}
                <span className="text-gray-600">{activeResume.source === 'manual' ? 'Manual' : 'From CV'}</span>
                {' · '}
                <span className="text-emerald-600">{activeResume.name}</span>
              </p>
            </div>
          </div>

          {activeResume.summary && (
            <p className="text-xs text-gray-500 italic leading-relaxed">{activeResume.summary}</p>
          )}

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
                      onSave={(skillName, patch) => patchResumeSkill(activeResume.id, skillName, patch)}
                      onUpdate={(updated) => handleSkillUpdate(activeResume.id, updated)}
                    />
                  ))}
                </div>
              </div>
            ))}
            {uncategorised.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Other</p>
                <div className="flex flex-col divide-y divide-gray-800">
                  {uncategorised.map(skill => (
                    <SkillEditor
                      key={skill.name}
                      skill={skill}
                      onSave={(skillName, patch) => patchResumeSkill(activeResume.id, skillName, patch)}
                      onUpdate={(updated) => handleSkillUpdate(activeResume.id, updated)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {showAddModal && (
        <AddResumeModal
          onClose={() => setShowAddModal(false)}
          onAdded={handleAdded}
        />
      )}
    </div>
  )
}

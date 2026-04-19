import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchJob, updateJobStatus, reparseJob, deleteJob, patchJob } from '../api/clip'

const ALL_STATUSES = ['saved', 'applied', 'need_prep', 'interview', 'offer', 'rejected', 'closed', 'accepted']

function MatchRing({ score }) {
  const filled = score != null ? (score / 100) * 264 : 0
  return (
    <div className="relative w-[130px] h-[130px] shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#e6e5df" strokeWidth="9" />
        {score != null && (
          <circle
            cx="50" cy="50" r="42"
            fill="none"
            stroke="#10b981"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${filled} 264`}
            pathLength="264"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-code text-[28px] font-bold text-emerald-ink leading-none">
          {score != null ? `${score}%` : '—'}
        </span>
        <span className="font-code text-[9px] text-ink-4 mt-0.5">
          {score != null ? 'match' : 'no cv'}
        </span>
      </div>
    </div>
  )
}

function Tag({ children, variant = 'default' }) {
  const styles = {
    default: 'bg-paper-2 border-line-soft text-ink-2',
    have: 'bg-emerald-wash border-emerald-ink text-emerald-ink',
    miss: 'bg-paper-2 border-dashed border-line-soft text-ink-3 line-through',
  }
  return (
    <span className={`font-code text-[11px] px-2 py-[3px] rounded border-[1.5px] ${styles[variant]}`}>
      {children}
    </span>
  )
}

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [statusChanging, setStatusChanging] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [reparsing, setReparsing] = useState(false)
  const [reparseError, setReparseError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [editingApplyUrl, setEditingApplyUrl] = useState(false)
  const [applyUrlDraft, setApplyUrlDraft] = useState('')
  const statusMenuRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    setError(false)
    fetchJob(Number(id))
      .then(setJob)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    const handle = (e) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target)) {
        setShowStatusMenu(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const handleSaveApplyUrl = async () => {
    const updated = await patchJob(job.id, { apply_url: applyUrlDraft.trim() })
    setJob(j => ({ ...j, apply_url: updated.apply_url }))
    setEditingApplyUrl(false)
  }

  const handleDelete = async () => {
    if (!window.confirm(t('jobDetail.deleteConfirm'))) return
    setDeleting(true)
    try {
      await deleteJob(job.id)
      navigate('/jobs')
    } finally {
      setDeleting(false)
    }
  }

  const handleReparse = async () => {
    setReparsing(true)
    setReparseError(null)
    try {
      const updated = await reparseJob(job.id)
      setJob(updated)
    } catch (err) {
      setReparseError(err.message)
    } finally {
      setReparsing(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    if (!job || newStatus === job.status) return
    setStatusChanging(true)
    setShowStatusMenu(false)
    try {
      const updated = await updateJobStatus(job.id, newStatus)
      setJob(j => ({ ...j, status: updated.status }))
    } finally {
      setStatusChanging(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="font-hand text-base text-ink-3">{t('jobDetail.notFound')}</p>
        <button onClick={() => navigate(-1)} className="font-code text-xs text-emerald-ink hover:underline">
          {t('jobDetail.back')}
        </button>
      </div>
    )
  }

  const {
    title, company, location, salary, mode, seniority, contract,
    stack = [], description, url, apply_url, status, clippedAt,
    match_score, matched = [], missing = [],
  } = job

  const matchedSet = new Set(matched.map(s => s.toLowerCase()))
  const missingSet = new Set(missing.map(s => s.toLowerCase()))

  return (
    <div className="flex flex-col gap-0 max-w-5xl">
      {/* Back */}
      <button
        onClick={() => navigate('/jobs')}
        className="self-start font-code text-[11px] text-ink-3 hover:text-ink transition-colors mb-4"
      >
        {t('jobDetail.back')}
      </button>

      {/* Header */}
      <div className="flex gap-5 items-start pb-5 border-b-[1.5px] border-dashed border-line-soft mb-6">
        <div className="w-16 h-16 rounded-lg bg-paper-3 border-[1.5px] border-line-soft flex items-center justify-center font-code text-sm text-ink-4 shrink-0">
          {(company?.[0] ?? '?').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          {company && <p className="font-code text-[11px] text-ink-3 mb-1">{company}</p>}
          <h1 className="font-sketch text-4xl font-bold text-ink leading-tight mb-2">{title}</h1>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 font-code text-[11px] px-2.5 py-1 border-[1.5px] border-line-soft rounded-full bg-paper">
              <span className="w-2 h-2 rounded-full bg-emerald-500 border border-emerald-ink shrink-0" />
              {t(`status.${status}`)}
            </span>
            {location && <Tag>{location}</Tag>}
            {seniority && <Tag>{seniority}</Tag>}
            {contract && <Tag>{contract}</Tag>}
            {salary && <Tag>{salary}</Tag>}
          </div>
        </div>
        <MatchRing score={match_score} />
      </div>

      {/* Two-col */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

        {/* Left: stack + description */}
        <div>
          {stack.length > 0 && (
            <div className="mb-6">
              <h2 className="font-sketch text-2xl font-bold text-ink mb-2">{t('jobDetail.stack')}</h2>
              <div className="flex flex-wrap gap-1.5">
                {stack.map(tech => {
                  const tl = tech.toLowerCase()
                  const variant = matchedSet.has(tl) ? 'have' : missingSet.has(tl) ? 'miss' : 'default'
                  return <Tag key={tech} variant={variant}>{tech}</Tag>
                })}
              </div>
            </div>
          )}

          {description && (
            <div>
              <h2 className="font-sketch text-2xl font-bold text-ink mb-2">{t('jobDetail.description')}</h2>
              <p className="font-hand text-base text-ink-2 leading-relaxed whitespace-pre-wrap">{description}</p>
            </div>
          )}
        </div>

        {/* Right: sticky action rail */}
        <aside>
          <div
            className="bg-paper-2 border-[1.5px] border-ink rounded-lg p-4 flex flex-col gap-3 sticky top-6"
          >
            <p className="font-code text-[10px] tracking-[1.5px] uppercase text-ink-4">Actions</p>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate(`/simulator?job=${job.id}`)}
                className="w-full font-code text-xs bg-ink text-paper py-2 px-3 rounded border-2 border-ink hover:bg-ink-2 transition-colors text-left"
              >
                ▶ {t('jobDetail.simulate')}
              </button>

              {apply_url && !editingApplyUrl && (
                <a
                  href={apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full font-code text-xs bg-paper border-[1.5px] border-ink text-ink-2 py-2 px-3 rounded hover:bg-paper-3 transition-colors"
                >
                  ↗ {t('jobDetail.apply')}
                </a>
              )}

              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full font-code text-xs bg-paper border-[1.5px] border-ink text-ink-2 py-2 px-3 rounded hover:bg-paper-3 transition-colors"
                >
                  ↗ {t('jobDetail.viewOriginal')}
                </a>
              )}

              <button
                onClick={handleReparse}
                disabled={reparsing}
                className="w-full font-code text-xs bg-paper border-[1.5px] border-ink text-ink-2 py-2 px-3 rounded hover:bg-paper-3 transition-colors disabled:opacity-50 text-left"
              >
                ↻ {reparsing ? t('jobDetail.reparsing') : t('jobDetail.reparse')}
              </button>

              {/* Status dropdown */}
              <div className="relative" ref={statusMenuRef}>
                <button
                  onClick={() => setShowStatusMenu(v => !v)}
                  disabled={statusChanging}
                  className="w-full font-code text-xs bg-paper border-[1.5px] border-line-soft text-ink-3 py-2 px-3 rounded hover:border-ink-3 transition-colors disabled:opacity-50 text-left"
                >
                  {t('jobDetail.changeStatus')} ▾
                </button>
                {showStatusMenu && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-paper border-[1.5px] border-ink rounded shadow-[2px_2px_0_rgba(0,0,0,0.1)] z-20 py-1">
                    {ALL_STATUSES.map(s => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={`w-full text-left font-code text-xs px-3 py-1.5 transition-colors ${
                          s === status ? 'bg-emerald-wash text-emerald-ink' : 'text-ink-2 hover:bg-paper-2'
                        }`}
                      >
                        {t(`status.${s}`)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Apply URL */}
              {editingApplyUrl ? (
                <div className="flex flex-col gap-1.5">
                  <input
                    autoFocus
                    type="url"
                    value={applyUrlDraft}
                    onChange={e => setApplyUrlDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveApplyUrl(); if (e.key === 'Escape') setEditingApplyUrl(false) }}
                    placeholder="https://..."
                    className="bg-paper border-[1.5px] border-ink rounded px-2 py-1.5 font-hand text-sm text-ink placeholder:text-ink-4 focus:outline-none w-full"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveApplyUrl}
                      className="flex-1 font-code text-[10px] bg-ink text-paper py-1.5 rounded border-2 border-ink"
                    >
                      {t('jobDetail.save')}
                    </button>
                    <button
                      onClick={() => setEditingApplyUrl(false)}
                      className="font-code text-[10px] text-ink-4 px-2"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setApplyUrlDraft(apply_url || ''); setEditingApplyUrl(true) }}
                  className="w-full font-code text-xs border border-dashed border-line-soft text-ink-4 py-2 px-3 rounded hover:border-ink-3 hover:text-ink-3 transition-colors text-left"
                >
                  {apply_url ? t('jobDetail.editApplyUrl') : t('jobDetail.setApplyUrl')}
                </button>
              )}

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full font-code text-[10px] text-[#c84040] border border-dashed border-[#e0b5b5] py-2 px-3 rounded hover:border-[#c84040] transition-colors disabled:opacity-50 text-left"
              >
                {deleting ? t('jobDetail.deleting') : t('jobDetail.delete')}
              </button>
            </div>

            {reparseError && (
              <p className="font-code text-[10px] text-red-600">{reparseError}</p>
            )}

            {/* Missing skills */}
            {missing.length > 0 && (
              <div className="pt-3 border-t border-dashed border-line-soft">
                <p className="font-code text-[10px] tracking-[1.5px] uppercase text-ink-4 mb-2">
                  Missing ({missing.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {missing.map(s => <Tag key={s} variant="miss">{s}</Tag>)}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

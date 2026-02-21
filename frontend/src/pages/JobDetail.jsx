import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchJob, updateJobStatus } from '../api/clip'

const STATUS_STYLES = {
  saved:     'bg-gray-700 text-gray-300',
  applied:   'bg-blue-900 text-blue-300',
  need_prep: 'bg-purple-900 text-purple-300',
  interview: 'bg-yellow-900 text-yellow-300',
  offer:     'bg-emerald-900 text-emerald-300',
  rejected:  'bg-red-900 text-red-400',
  closed:    'bg-gray-800 text-gray-500',
  accepted:  'bg-teal-900 text-teal-300',
}

const ACTIVE_STATUSES = ['saved', 'applied', 'need_prep', 'interview', 'offer']

function scoreColor(score) {
  if (score >= 75) return 'bg-emerald-500'
  if (score >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
}

function MetaChip({ label, value }) {
  if (!value) return null
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-gray-200 mt-0.5 capitalize">{value}</p>
    </div>
  )
}

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusChanging, setStatusChanging] = useState(false)

  useEffect(() => {
    fetchJob(Number(id))
      .then(setJob)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  const handleStatusChange = async (newStatus) => {
    if (!job || newStatus === job.status) return
    setStatusChanging(true)
    try {
      const updated = await updateJobStatus(job.id, newStatus)
      setJob(j => ({ ...j, status: updated.status }))
    } finally {
      setStatusChanging(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500 text-sm">
        Loading...
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-gray-400">{t('jobDetail.notFound')}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-emerald-400 hover:text-emerald-300">
          {t('jobDetail.back')}
        </button>
      </div>
    )
  }

  const {
    title, company, location, salary, mode, seniority, contract,
    stack = [], description, url, status, clippedAt,
    match_score, matched = [], missing = [],
  } = job

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="self-start text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        {t('jobDetail.back')}
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 leading-tight">{title}</h1>
          {company && <p className="text-gray-400 mt-1">{company}{location ? ` · ${location}` : ''}</p>}
        </div>
        <span className={`text-sm px-3 py-1 rounded-full font-medium whitespace-nowrap ${STATUS_STYLES[status] ?? 'bg-gray-700 text-gray-300'}`}>
          {t(`status.${status}`)}
        </span>
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-2">
        <MetaChip label={t('jobDetail.seniority')} value={seniority} />
        <MetaChip label={t('jobDetail.mode')} value={mode} />
        <MetaChip label={t('jobDetail.contract')} value={contract} />
        <MetaChip label={t('jobDetail.salary')} value={salary} />
        {clippedAt && (
          <MetaChip
            label={t('jobDetail.savedOn')}
            value={new Date(clippedAt).toLocaleDateString()}
          />
        )}
      </div>

      {/* Two-column: stack + match */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Tech stack */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            {t('jobDetail.stack')}
          </h2>
          {stack.length === 0 ? (
            <p className="text-sm text-gray-600">{t('jobDetail.noStack')}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {stack.map(tech => (
                <span key={tech} className="text-sm bg-gray-800 text-gray-300 px-2.5 py-1 rounded-lg">
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Match score */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            {t('jobDetail.matchScore')}
          </h2>

          {stack.length === 0 ? (
            <p className="text-sm text-gray-600">{t('jobDetail.noStack')}</p>
          ) : match_score == null ? (
            <p className="text-sm text-gray-600">{t('jobDetail.noResume')}</p>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full ${scoreColor(match_score)} transition-all`}
                    style={{ width: `${match_score}%` }}
                  />
                </div>
                <span className="text-xl font-bold text-gray-100 w-14 text-right">{match_score}%</span>
              </div>

              {missing.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">{t('jobDetail.missing')}</p>
                  <div className="flex flex-wrap gap-1">
                    {missing.map(s => (
                      <span key={s} className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                        − {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {matched.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">{t('jobDetail.matched')}</p>
                  <div className="flex flex-wrap gap-1">
                    {matched.map(s => (
                      <span key={s} className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            {t('jobDetail.description')}
          </h2>
          <p className="text-gray-300 leading-relaxed">{description}</p>
        </div>
      )}

      {/* Change status */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          {t('jobDetail.changeStatus')}
        </h2>
        <div className="flex flex-wrap gap-2">
          {ACTIVE_STATUSES.map(s => (
            <button
              key={s}
              disabled={statusChanging || s === status}
              onClick={() => handleStatusChange(s)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                s === status
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 cursor-default'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
              }`}
            >
              {t(`status.${s}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap pb-4">
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200 px-4 py-2 rounded-lg transition-colors"
          >
            {t('jobDetail.viewOriginal')} ↗
          </a>
        )}
        <button
          onClick={() => navigate('/simulator')}
          className="text-sm bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {t('jobDetail.simulate')}
        </button>
      </div>

    </div>
  )
}

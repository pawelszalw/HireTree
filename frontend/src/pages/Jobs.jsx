import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import AddJobModal from '../components/AddJobModal'
import { fetchJobs } from '../api/clip'
import { useJobClipListener } from '../hooks/useJobClipListener'

const STAGE_DOT = {
  saved:     'bg-paper border-ink',
  applied:   'bg-ink-3 border-ink',
  need_prep: 'bg-amber-400 border-amber-600',
  interview: 'bg-emerald-500 border-emerald-ink',
  offer:     'bg-emerald-ink border-emerald-ink',
  rejected:  'bg-red-500 border-red-700',
  closed:    'bg-ink-4 border-ink-3',
  accepted:  'bg-emerald-500 border-emerald-ink',
}

function MatchChip({ score }) {
  if (score == null) return <span className="font-code text-xs text-ink-4">—</span>
  if (score >= 80) return (
    <span className="inline-flex items-baseline gap-0.5 font-code text-xs px-2 py-0.5 border-[1.5px] rounded-full bg-emerald-wash border-emerald-ink text-emerald-ink">
      <b>{score}</b><span className="text-[10px]">%</span>
    </span>
  )
  if (score >= 60) return (
    <span className="inline-flex items-baseline gap-0.5 font-code text-xs px-2 py-0.5 border-[1.5px] rounded-full bg-[#fff6d9] border-[#c9a516] text-[#7a6610]">
      <b>{score}</b><span className="text-[10px]">%</span>
    </span>
  )
  return (
    <span className="inline-flex items-baseline gap-0.5 font-code text-xs px-2 py-0.5 border-[1.5px] rounded-full bg-paper-2 border-line-soft text-ink-3">
      <b>{score}</b><span className="text-[10px]">%</span>
    </span>
  )
}

function StageDot({ status }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full border-[1.5px] shrink-0 ${STAGE_DOT[status] ?? STAGE_DOT.saved}`} />
      <span className="font-code text-[11px] text-ink-3">{status?.replace('_', ' ')}</span>
    </span>
  )
}

export default function Jobs() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    fetchJobs()
      .then(setJobs)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])
  useJobClipListener(setJobs)

  const handleModalClose = (refetch = false) => {
    setShowModal(false)
    if (refetch) load()
  }

  return (
    <div className="flex flex-col gap-5">
      {showModal && <AddJobModal onClose={handleModalClose} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sketch text-3xl font-bold text-ink">{t('dashboard.savedJobs')}</h1>
          {!loading && (
            <p className="font-code text-[10px] text-ink-4 mt-0.5">{jobs.length} {jobs.length === 1 ? 'offer' : 'offers'}</p>
          )}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="font-code text-xs bg-ink text-paper px-3 py-1.5 rounded border-2 border-ink hover:bg-ink-2 transition-colors"
        >
          {t('dashboard.addManually')}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="border-[1.5px] border-ink rounded-lg overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 border-b border-dashed border-line-soft last:border-0 animate-pulse bg-paper-2/60" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="border-[1.5px] border-dashed border-line-soft rounded-lg py-16 text-center">
          <p className="font-hand text-base text-ink-4">{t('dashboard.empty')}</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-3 font-code text-xs text-emerald-ink hover:underline"
          >
            {t('dashboard.addManually')}
          </button>
        </div>
      ) : (
        <div className="border-[1.5px] border-ink rounded-lg overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-paper-2 border-b-[1.5px] border-ink">
                <th className="font-code text-[10px] tracking-[1.5px] uppercase text-ink-4 text-left px-3 py-2.5">
                  {t('jobs.colCompany')}
                </th>
                <th className="font-code text-[10px] tracking-[1.5px] uppercase text-ink-4 text-left px-3 py-2.5 hidden sm:table-cell">
                  {t('jobs.colStack')}
                </th>
                <th className="font-code text-[10px] tracking-[1.5px] uppercase text-ink-4 text-left px-3 py-2.5">
                  {t('jobs.colMatch')}
                </th>
                <th className="font-code text-[10px] tracking-[1.5px] uppercase text-ink-4 text-left px-3 py-2.5 hidden md:table-cell">
                  {t('jobs.colStage')}
                </th>
                <th className="font-code text-[10px] tracking-[1.5px] uppercase text-ink-4 text-left px-3 py-2.5 hidden lg:table-cell">
                  {t('jobs.colAdded')}
                </th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr
                  key={job.id}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="border-b border-dashed border-line-soft hover:bg-paper-2 cursor-pointer transition-colors last:border-0"
                >
                  <td className="px-3 py-3 align-middle">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-paper-3 border border-line-soft shrink-0 flex items-center justify-center font-code text-[9px] text-ink-4">
                        {(job.company?.[0] ?? '?').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-sketch text-base font-bold text-ink leading-tight">{job.title}</p>
                        {job.company && (
                          <p className="font-code text-[10px] text-ink-3">{job.company}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 align-middle hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(job.stack ?? []).slice(0, 4).map(tech => (
                        <span key={tech} className="font-code text-[9px] px-1.5 py-[1px] bg-paper-2 border border-line-soft rounded text-ink-3">
                          {tech}
                        </span>
                      ))}
                      {(job.stack ?? []).length > 4 && (
                        <span className="font-code text-[9px] text-ink-4">+{job.stack.length - 4}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <MatchChip score={job.match_score} />
                  </td>
                  <td className="px-3 py-3 align-middle hidden md:table-cell">
                    <StageDot status={job.status} />
                  </td>
                  <td className="px-3 py-3 align-middle hidden lg:table-cell">
                    {job.clippedAt ? (
                      <span className="font-code text-[10px] text-ink-4">
                        {new Date(job.clippedAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="font-code text-[10px] text-ink-4">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

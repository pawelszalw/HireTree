import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const STATUS_STYLES = {
  saved:     'bg-gray-700 text-gray-300',
  applied:   'bg-blue-900 text-blue-300',
  need_prep: 'bg-purple-900 text-purple-300',
  interview: 'bg-yellow-900 text-yellow-300',
  offer:     'bg-emerald-900 text-emerald-300',
  rejected:  'bg-red-900 text-red-400',
  closed:    'bg-gray-800 text-gray-500',
  accepted:  'bg-emerald-900 text-emerald-300',
}

function scoreColor(score) {
  if (score == null) return 'bg-gray-600'
  if (score >= 75) return 'bg-emerald-500'
  if (score >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
}

export default function JobCard({ job }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { title, company, stack = [], salary, mode, seniority, match_score, matched = [], missing = [], status } = job
  const [showGaps, setShowGaps] = useState(false)

  return (
    <div
      onClick={() => navigate(`/jobs/${job.id}`)}
      className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-4 hover:border-gray-700 transition-colors cursor-pointer"
    >

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-100 leading-tight">{title}</h3>
          <p className="text-sm text-gray-400 mt-0.5">{company}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${STATUS_STYLES[status] ?? 'bg-gray-700 text-gray-300'}`}>
          {t(`status.${status}`)}
        </span>
      </div>

      {/* Stack tags */}
      {stack.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {stack.map(tech => (
            <span key={tech} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
              {tech}
            </span>
          ))}
        </div>
      )}

      {/* Meta */}
      {(salary || mode || seniority) && (
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {seniority && <span className="capitalize">{seniority}</span>}
          {mode && <span>{mode}</span>}
          {salary && <span>{salary}</span>}
        </div>
      )}

      {/* Match score bar */}
      {stack.length > 0 && (
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">{t('jobCard.matchScore')}</span>
            <span className="font-medium text-gray-300">
              {match_score != null ? `${match_score}%` : '—'}
            </span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            {match_score != null && (
              <div
                className={`h-full ${scoreColor(match_score)} rounded-full transition-all`}
                style={{ width: `${match_score}%` }}
              />
            )}
          </div>
        </div>
      )}

      {/* Gap analysis panel */}
      {showGaps && (
        <div className="flex flex-col gap-3 pt-1 border-t border-gray-800">
          {stack.length === 0 && (
            <p className="text-xs text-gray-500">{t('jobCard.noStack')}</p>
          )}
          {missing.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1.5">{t('jobCard.missing')}</p>
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
              <p className="text-xs text-gray-500 mb-1.5">{t('jobCard.matched')}</p>
              <div className="flex flex-wrap gap-1">
                {matched.map(s => (
                  <span key={s} className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    ✓ {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {stack.length > 0 && missing.length === 0 && (
            <p className="text-xs text-emerald-400">All skills matched!</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={e => { e.stopPropagation(); setShowGaps(g => !g) }}
          className="flex-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg transition-colors"
        >
          {showGaps ? t('jobCard.hideGaps') : t('jobCard.gapAnalysis')}
        </button>
        <button
          onClick={e => e.stopPropagation()}
          className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg transition-colors"
        >
          {t('jobCard.simulateInterview')}
        </button>
      </div>

    </div>
  )
}

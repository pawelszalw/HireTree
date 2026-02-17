import { useTranslation } from 'react-i18next'

const STATUS_STYLES = {
  saved:     'bg-gray-700 text-gray-300',
  applied:   'bg-blue-900 text-blue-300',
  interview: 'bg-yellow-900 text-yellow-300',
  offer:     'bg-emerald-900 text-emerald-300',
  rejected:  'bg-red-900 text-red-400',
}

export default function JobCard({ job }) {
  const { t } = useTranslation()
  const { title, company, stack = [], salary, mode, matchScore, status } = job

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-4 hover:border-gray-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-100 leading-tight">{title}</h3>
          <p className="text-sm text-gray-400 mt-0.5">{company}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${STATUS_STYLES[status]}`}>
          {t(`status.${status}`)}
        </span>
      </div>

      {/* Stack tags */}
      <div className="flex flex-wrap gap-1.5">
        {stack.map(tech => (
          <span key={tech} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
            {tech}
          </span>
        ))}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>{salary}</span>
        <span>{mode}</span>
      </div>

      {/* Match score */}
      {matchScore != null && (
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">{t('jobCard.matchScore')}</span>
            <span className="text-gray-300 font-medium">{matchScore}%</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${matchScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button className="flex-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg transition-colors">
          {t('jobCard.gapAnalysis')}
        </button>
        <button className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg transition-colors">
          {t('jobCard.simulateInterview')}
        </button>
      </div>
    </div>
  )
}

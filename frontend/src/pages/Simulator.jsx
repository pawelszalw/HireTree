import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export default function Simulator() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">
      <div className="text-center flex flex-col gap-3 pt-4">
        <h1 className="text-3xl font-bold text-gray-100">{t('interviewSimulator.title')}</h1>
        <p className="text-gray-400">{t('interviewSimulator.description')}</p>
      </div>

      <div className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-14 flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl">
          🎙
        </div>
        <p className="text-lg font-semibold text-gray-200">Coming soon</p>
        <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
          The interview simulator will generate questions tailored to a job offer's tech stack and seniority level.
          Answer them, receive AI feedback, and track your improvement over time.
        </p>
        <Link to="/" className="mt-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
          Browse job offers →
        </Link>
      </div>
    </div>
  )
}

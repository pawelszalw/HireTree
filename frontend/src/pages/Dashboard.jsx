import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import ResumeBanner from '../components/ResumeBanner'
import { fetchJobs, fetchCV } from '../api/clip'

const PIPELINE_STAGES = ['saved', 'applied', 'need_prep', 'interview', 'offer']

export default function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [hasCV, setHasCV] = useState(null)

  useEffect(() => {
    fetchJobs().then(setJobs).catch(() => {})
    fetchCV().then(data => setHasCV(!!data)).catch(() => setHasCV(false))
  }, [])

  const counts = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage] = jobs.filter(j => j.status === stage).length
    return acc
  }, {})

  const total = jobs.length

  return (
    <div className="flex flex-col gap-8">

      {/* Resume banner */}
      {hasCV === false && (
        <ResumeBanner onUploadClick={() => navigate('/profile')} />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100">{t('dashboard.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* Pipeline stats */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            {t('dashboard.pipeline')}
          </h2>
          <Link to="/pipeline" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            {t('nav.pipeline')} →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {PIPELINE_STAGES.map(stage => (
            <Link
              key={stage}
              to="/pipeline"
              className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl px-4 py-3 text-center transition-colors"
            >
              <p className="text-2xl font-bold text-gray-100">{counts[stage]}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t(`status.${stage}`)}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Saved jobs quick link */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            {t('dashboard.savedJobs')}
          </h2>
          <Link to="/jobs" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            {t('nav.jobs')} →
          </Link>
        </div>
        <Link
          to="/jobs"
          className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl px-6 py-4 flex items-center justify-between transition-colors"
        >
          <div>
            <p className="text-3xl font-bold text-gray-100">{total}</p>
            <p className="text-sm text-gray-500 mt-0.5">{t('dashboard.savedJobs')}</p>
          </div>
          <span className="text-gray-600 text-xl">→</span>
        </Link>
      </section>

      {/* Quick actions */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <Link
            to="/simulator"
            className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center gap-3 min-h-36 text-center transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-gray-800 group-hover:bg-gray-700 flex items-center justify-center text-xl transition-colors">
              💬
            </div>
            <div>
              <p className="font-medium text-gray-300">{t('interviewSimulator.title')}</p>
              <p className="text-xs text-gray-600 mt-1">{t('interviewSimulator.description')}</p>
            </div>
          </Link>

          <Link
            to="/learning"
            className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center gap-3 min-h-36 text-center transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-gray-800 group-hover:bg-gray-700 flex items-center justify-center text-xl transition-colors">
              📚
            </div>
            <div>
              <p className="font-medium text-gray-300">{t('learningSimulator.title')}</p>
              <p className="text-xs text-gray-600 mt-1">{t('learningSimulator.description')}</p>
            </div>
          </Link>

        </div>
      </section>

    </div>
  )
}

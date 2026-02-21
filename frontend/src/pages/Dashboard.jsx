import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import JobCard from '../components/JobCard'
import AddJobModal from '../components/AddJobModal'
import ResumeBanner from '../components/ResumeBanner'
import { fetchJobs, fetchCV } from '../api/clip'

const PIPELINE_STAGES = ['saved', 'applied', 'interview', 'offer', 'rejected']

export default function Dashboard() {
  const { t } = useTranslation()
  const [showModal, setShowModal] = useState(false)
  const [jobs, setJobs] = useState([])
  const [hasCV, setHasCV] = useState(null) // null=loading, false=missing, true=present
  const navigate = useNavigate()

  const loadJobs = () => {
    fetchJobs()
      .then(setJobs)
      .catch(() => {})
  }

  useEffect(() => { loadJobs() }, [])
  useEffect(() => {
    fetchCV().then(data => setHasCV(!!data)).catch(() => setHasCV(false))
  }, [])

  const pipelineCounts = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage] = jobs.filter(j => j.status === stage).length
    return acc
  }, {})

  const handleModalClose = (refetch = false) => {
    setShowModal(false)
    if (refetch) loadJobs()
  }

  return (
    <div className="flex flex-col gap-8">
      {showModal && <AddJobModal onClose={handleModalClose} />}

      {/* Resume banner */}
      {hasCV === false && (
        <ResumeBanner onUploadClick={() => navigate('/profile')} />
      )}

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100">{t('dashboard.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* Pipeline summary */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {t('dashboard.pipeline')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {PIPELINE_STAGES.map(stage => (
            <div key={stage} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-bold text-gray-100">{pipelineCounts[stage]}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t(`status.${stage}`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Offers grid */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            {t('dashboard.savedJobs')}
          </h2>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            {t('dashboard.addManually')}
          </button>
        </div>

        {jobs.length === 0 ? (
          <div className="border border-dashed border-gray-800 rounded-xl py-12 text-center">
            <p className="text-sm text-gray-600">{t('dashboard.empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center gap-3 min-h-40 text-center">
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xl">💬</div>
          <div>
            <p className="font-medium text-gray-300">{t('interviewSimulator.title')}</p>
            <p className="text-xs text-gray-600 mt-1">{t('interviewSimulator.description')}</p>
          </div>
          <button disabled className="text-xs bg-gray-800 text-gray-600 px-4 py-2 rounded-lg cursor-not-allowed">
            {t('interviewSimulator.button')}
          </button>
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center gap-3 min-h-40 text-center">
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xl">📚</div>
          <div>
            <p className="font-medium text-gray-300">{t('learningSimulator.title')}</p>
            <p className="text-xs text-gray-600 mt-1">{t('learningSimulator.description')}</p>
          </div>
          <button disabled className="text-xs bg-gray-800 text-gray-600 px-4 py-2 rounded-lg cursor-not-allowed">
            {t('learningSimulator.button')}
          </button>
        </section>

      </div>


    </div>
  )
}

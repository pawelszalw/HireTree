import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import JobCard from '../components/JobCard'
import AddJobModal from '../components/AddJobModal'
import { fetchJobs } from '../api/clip'

export default function Jobs() {
  const { t } = useTranslation()
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

  const handleModalClose = (refetch = false) => {
    setShowModal(false)
    if (refetch) load()
  }

  return (
    <div className="flex flex-col gap-6">
      {showModal && <AddJobModal onClose={handleModalClose} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">{t('dashboard.savedJobs')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="text-sm bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {t('dashboard.addManually')}
        </button>
      </div>

      {/* Job grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 h-48 animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="border border-dashed border-gray-800 rounded-xl py-16 text-center flex flex-col items-center gap-3">
          <p className="text-sm text-gray-600">{t('dashboard.empty')}</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            {t('dashboard.addManually')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}

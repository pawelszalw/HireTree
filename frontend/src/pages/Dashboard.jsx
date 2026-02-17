import { useTranslation } from 'react-i18next'
import JobCard from '../components/JobCard'

const MOCK_JOBS = [
  {
    id: 1,
    title: 'QA Automation Engineer',
    company: 'Allegro',
    stack: ['Playwright', 'Python', 'Jenkins', 'Jira'],
    salary: '14 000 – 18 000 PLN',
    mode: 'Remote',
    matchScore: 72,
    status: 'saved',
  },
  {
    id: 2,
    title: 'Senior QA Engineer',
    company: 'Revolut',
    stack: ['Cypress', 'TypeScript', 'AWS', 'k6'],
    salary: '20 000 – 26 000 PLN',
    mode: 'Hybrid',
    matchScore: 55,
    status: 'applied',
  },
  {
    id: 3,
    title: 'Test Automation Lead',
    company: 'CD Projekt Red',
    stack: ['Selenium', 'Java', 'TestNG', 'CI/CD'],
    salary: '18 000 – 24 000 PLN',
    mode: 'On-site',
    matchScore: 88,
    status: 'interview',
  },
]

const PIPELINE_STAGES = ['saved', 'applied', 'interview', 'offer', 'rejected']
const PIPELINE_COUNTS  = { saved: 4, applied: 2, interview: 1, offer: 0, rejected: 1 }

export default function Dashboard() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-8">

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
              <p className="text-2xl font-bold text-gray-100">{PIPELINE_COUNTS[stage]}</p>
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
          <button className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            {t('dashboard.addManually')}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_JOBS.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </section>

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Interview simulator placeholder */}
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

        {/* Learning simulator placeholder */}
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

      {/* CV / Skills placeholder */}
      <section className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-8 flex flex-col items-center gap-3 text-center">
        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xl">📄</div>
        <div>
          <p className="font-medium text-gray-300">{t('cvUpload.title')}</p>
          <p className="text-xs text-gray-600 mt-1">{t('cvUpload.description')}</p>
        </div>
        <button className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg transition-colors">
          {t('cvUpload.button')}
        </button>
      </section>

    </div>
  )
}

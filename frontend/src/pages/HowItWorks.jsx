import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

function BrowserFrame({ url, children }) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-700 shadow-xl bg-gray-950">
      <div className="bg-gray-800 px-3 py-2 flex items-center gap-1.5 border-b border-gray-700">
        <div className="w-2.5 h-2.5 rounded-full bg-gray-600" />
        <div className="w-2.5 h-2.5 rounded-full bg-gray-600" />
        <div className="w-2.5 h-2.5 rounded-full bg-gray-600" />
        <div className="ml-2 bg-gray-700/60 rounded px-3 py-0.5 text-[10px] text-gray-500 flex-1 max-w-[200px] truncate">
          {url}
        </div>
      </div>
      <div className="p-3 text-[11px]">
        {children}
      </div>
    </div>
  )
}

function SkillBar({ name, pct, variant = 'current' }) {
  const bar = variant === 'current' ? 'bg-emerald-500' : variant === 'recent' ? 'bg-blue-500' : 'bg-gray-600'
  const badge =
    variant === 'current'
      ? 'text-emerald-400 bg-emerald-400/10'
      : variant === 'recent'
      ? 'text-blue-400 bg-blue-400/10'
      : 'text-gray-500 bg-gray-700'
  const label = variant === 'current' ? 'Current' : variant === 'recent' ? '1-2y ago' : '3+ years'
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 text-gray-300 truncate">{name}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-1.5">
        <div className={`${bar} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${badge}`}>{label}</span>
    </div>
  )
}

export default function HowItWorks() {
  const { t } = useTranslation()
  const steps = t('howItWorks.steps', { returnObjects: true })

  return (
    <div className="flex flex-col gap-12 max-w-3xl mx-auto">

      {/* Hero */}
      <div className="text-center flex flex-col gap-3 pt-4">
        <h1 className="text-3xl font-bold text-gray-100">{t('howItWorks.title')}</h1>
        <p className="text-gray-400">{t('howItWorks.subtitle')}</p>
      </div>

      {/* Problem callout */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-2">
        <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
          {t('howItWorks.problemTitle')}
        </p>
        <p className="text-gray-300 leading-relaxed">{t('howItWorks.problemText')}</p>
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-4">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-4 items-start">
            <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-sm font-bold text-emerald-400">
              {i + 1}
            </div>
            <div className="pt-1">
              <p className="font-semibold text-gray-100">{step.title}</p>
              <p className="text-sm text-gray-500 mt-0.5">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Screenshots */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-gray-200">See it in action</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Skills profile */}
          <BrowserFrame url="hiretree.io/profile">
            <div className="flex flex-col gap-2">
              <p className="text-gray-300 font-semibold mb-1">Your Skills Profile</p>
              <SkillBar name="TypeScript" pct={88} variant="current" />
              <SkillBar name="React" pct={82} variant="current" />
              <SkillBar name="Node.js" pct={70} variant="current" />
              <SkillBar name="Docker" pct={52} variant="recent" />
              <SkillBar name="PostgreSQL" pct={38} variant="outdated" />
            </div>
          </BrowserFrame>

          {/* Match score card */}
          <BrowserFrame url="hiretree.io/">
            <div className="flex flex-col gap-2">
              <p className="text-gray-300 font-semibold mb-1">Job overview</p>
              <div className="bg-gray-800 rounded-lg p-2.5 flex flex-col gap-2">
                <div>
                  <p className="font-semibold text-gray-100">Senior Frontend Developer</p>
                  <p className="text-gray-500 text-[10px]">Allegro · Warsaw · Remote</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '78%' }} />
                  </div>
                  <span className="text-emerald-400 font-bold">78%</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full">
                    − Docker
                  </span>
                  <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full">
                    − Redux
                  </span>
                  <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full">
                    − AWS
                  </span>
                </div>
              </div>
            </div>
          </BrowserFrame>

          {/* Pipeline kanban — full width */}
          <div className="md:col-span-2">
            <BrowserFrame url="hiretree.io/pipeline">
              <div className="flex flex-col gap-2">
                <p className="text-gray-300 font-semibold mb-1">Job Pipeline</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    {
                      label: 'Saved',
                      color: 'border-gray-600',
                      jobs: ['UX Engineer · Figma', 'Fullstack Dev · Shopify'],
                    },
                    {
                      label: 'Applied',
                      color: 'border-blue-500/40',
                      jobs: ['Frontend Dev · Spotify'],
                    },
                    {
                      label: 'Interview',
                      color: 'border-yellow-500/40',
                      jobs: ['Senior React · Allegro'],
                    },
                    {
                      label: 'Offer',
                      color: 'border-emerald-500/40',
                      jobs: [],
                    },
                  ].map(col => (
                    <div key={col.label} className={`border ${col.color} rounded-lg p-2`}>
                      <p className="text-[10px] font-semibold text-gray-400 mb-1.5">{col.label}</p>
                      {col.jobs.map(j => (
                        <div key={j} className="bg-gray-800 rounded p-1.5 mb-1 text-[10px] text-gray-300 leading-tight">
                          {j}
                        </div>
                      ))}
                      {col.jobs.length === 0 && (
                        <div className="text-gray-700 text-[10px] text-center py-3">—</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </BrowserFrame>
          </div>

        </div>
      </div>

      {/* CTA */}
      <div className="text-center pb-4">
        <Link
          to="/"
          className="inline-block bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          {t('howItWorks.ctaButton')}
        </Link>
      </div>

    </div>
  )
}

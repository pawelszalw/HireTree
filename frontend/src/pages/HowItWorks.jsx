import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

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

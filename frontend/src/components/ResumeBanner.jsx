import { useTranslation } from 'react-i18next'

export default function ResumeBanner({ onUploadClick }) {
  const { t } = useTranslation()

  return (
    <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="text-amber-400 text-lg">⚠</span>
        <div>
          <p className="text-sm font-medium text-amber-300">{t('resumeBanner.title')}</p>
          <p className="text-xs text-amber-700 mt-0.5">{t('resumeBanner.description')}</p>
        </div>
      </div>
      <button
        onClick={onUploadClick}
        className="text-xs bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
      >
        {t('resumeBanner.button')}
      </button>
    </div>
  )
}

import { useTranslation } from 'react-i18next'

export default function Navbar() {
  const { t, i18n } = useTranslation()

  const toggleLang = () =>
    i18n.changeLanguage(i18n.language === 'en' ? 'pl' : 'en')

  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold text-xl tracking-tight">HireTree</span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-gray-400">
          <a href="#" className="hover:text-gray-100 transition-colors">{t('nav.jobs')}</a>
          <a href="#" className="hover:text-gray-100 transition-colors">{t('nav.simulator')}</a>
          <a href="#" className="hover:text-gray-100 transition-colors">{t('nav.learning')}</a>
        </nav>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLang}
            className="text-xs font-mono text-gray-500 hover:text-gray-300 border border-gray-700 hover:border-gray-500 px-2 py-1 rounded transition-colors"
          >
            {i18n.language === 'en' ? 'EN' : 'PL'}
          </button>
          <button className="text-sm text-gray-400 hover:text-gray-100 transition-colors">
            {t('nav.login')}
          </button>
          <button className="text-sm bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-1.5 rounded-lg transition-colors">
            {t('nav.register')}
          </button>
        </div>
      </div>
    </header>
  )
}

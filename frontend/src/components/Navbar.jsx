import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const toggleLang = () => i18n.changeLanguage(i18n.language === 'en' ? 'pl' : 'en')

  return (
    <header className="border-b-[1.5px] border-ink bg-paper-2 px-6 h-12 flex items-center gap-4 shrink-0">
      <NavLink to="/" className="flex items-center gap-2">
        <div
          className="w-[16px] h-[16px] bg-emerald-500 border-2 border-ink shrink-0"
          style={{ borderRadius: '60% 10% 60% 10%', transform: 'rotate(-18deg)' }}
        />
        <span className="font-sketch font-bold text-xl text-ink leading-none">HireTree</span>
      </NavLink>
      <div className="flex-1" />
      <NavLink
        to="/how-it-works"
        className="font-code text-xs text-ink-3 hover:text-ink transition-colors"
      >
        {t('nav.howItWorks')}
      </NavLink>
      <button
        onClick={toggleLang}
        className="font-code text-[10px] text-ink-4 border border-line-soft px-2 py-0.5 rounded hover:border-ink-3 transition-colors"
      >
        {i18n.language === 'en' ? 'EN' : 'PL'}
      </button>
      <NavLink to="/login" className="font-code text-xs text-ink-3 hover:text-ink transition-colors">
        {t('nav.login')}
      </NavLink>
      <NavLink
        to="/register"
        className="font-code text-xs bg-emerald-500 text-white border-2 border-ink px-3 py-1 rounded hover:bg-emerald-400 transition-colors"
      >
        {t('nav.register')}
      </NavLink>
    </header>
  )
}

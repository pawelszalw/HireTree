import { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const linkClass = ({ isActive }) =>
  `hover:text-gray-100 transition-colors ${isActive ? 'text-gray-100' : 'text-gray-400'}`

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const toggleLang = () =>
    i18n.changeLanguage(i18n.language === 'en' ? 'pl' : 'en')

  useEffect(() => {
    const handle = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold text-xl tracking-tight">HireTree</span>
        </div>

        <nav className="flex items-center gap-6 text-sm">
          <NavLink to="/" end className={linkClass}>{t('nav.jobs')}</NavLink>
          <NavLink to="/pipeline" className={linkClass}>{t('nav.pipeline')}</NavLink>
          <NavLink to="/how-it-works" className={linkClass}>{t('nav.howItWorks')}</NavLink>
          <a href="#" className="text-gray-400 hover:text-gray-100 transition-colors">{t('nav.simulator')}</a>
          <a href="#" className="text-gray-400 hover:text-gray-100 transition-colors">{t('nav.learning')}</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleLang}
            className="text-xs font-mono text-gray-500 hover:text-gray-300 border border-gray-700 hover:border-gray-500 px-2 py-1 rounded transition-colors"
          >
            {i18n.language === 'en' ? 'EN' : 'PL'}
          </button>

          {/* Avatar dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 hover:border-gray-500 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-10 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl py-1 min-w-[160px]">
                <NavLink
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors"
                >
                  {t('nav.profile')}
                </NavLink>
                <div className="border-t border-gray-800 my-1" />
                <button className="w-full text-left px-4 py-2 text-sm text-gray-600 cursor-not-allowed">
                  {t('nav.login')}
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-600 cursor-not-allowed">
                  {t('nav.register')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

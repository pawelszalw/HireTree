import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

export default function Footer() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-800 bg-gray-950 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">

        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold text-lg tracking-tight">HireTree</span>
          <span className="text-gray-700">·</span>
          <span className="text-xs text-gray-600">© {year}</span>
        </div>

        {/* Links */}
        <nav className="flex items-center gap-5 text-sm">
          {user && (
            <>
              <NavLink to="/jobs" className="text-gray-500 hover:text-gray-300 transition-colors">
                {t('nav.jobs')}
              </NavLink>
              <NavLink to="/pipeline" className="text-gray-500 hover:text-gray-300 transition-colors">
                {t('nav.pipeline')}
              </NavLink>
              <NavLink to="/simulator" className="text-gray-500 hover:text-gray-300 transition-colors">
                {t('nav.simulator')}
              </NavLink>
              <NavLink to="/learning" className="text-gray-500 hover:text-gray-300 transition-colors">
                {t('nav.learning')}
              </NavLink>
            </>
          )}
          <NavLink to="/how-it-works" className="text-gray-500 hover:text-gray-300 transition-colors">
            {t('nav.howItWorks')}
          </NavLink>
        </nav>

      </div>
    </footer>
  )
}

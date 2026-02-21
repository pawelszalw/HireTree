import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

const linkClass = ({ isActive }) =>
  `hover:text-gray-100 transition-colors ${isActive ? 'text-gray-100' : 'text-gray-400'}`

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
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

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logout()
    navigate('/login')
  }

  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold text-xl tracking-tight">HireTree</span>
        </div>

        <nav className="flex items-center gap-6 text-sm">
          {user && (
            <>
              <NavLink to="/" end className={linkClass}>{t('nav.jobs')}</NavLink>
              <NavLink to="/pipeline" className={linkClass}>{t('nav.pipeline')}</NavLink>
            </>
          )}
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

          {user ? (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen(o => !o)}
                className="flex items-center gap-2 h-8 pl-1 pr-2 rounded-full bg-gray-800 border border-gray-700 hover:border-gray-500 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {user.email[0].toUpperCase()}
                </div>
                <span className="text-xs text-gray-400 max-w-[120px] truncate hidden sm:block">
                  {user.email}
                </span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-10 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl py-1 min-w-[180px]">
                  <div className="px-4 py-2 border-b border-gray-800">
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <NavLink
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors"
                  >
                    {t('nav.profile')}
                  </NavLink>
                  <div className="border-t border-gray-800 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <NavLink
                to="/login"
                className="text-sm text-gray-400 hover:text-gray-100 transition-colors"
              >
                {t('nav.login')}
              </NavLink>
              <NavLink
                to="/register"
                className="text-sm bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-1.5 rounded-lg transition-colors"
              >
                {t('nav.register')}
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

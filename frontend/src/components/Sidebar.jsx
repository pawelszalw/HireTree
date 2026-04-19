import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/useAuth'

const NAV_ITEMS = [
  { to: '/jobs', labelKey: 'nav.jobs', shortcut: 'J' },
  { to: '/pipeline', labelKey: 'nav.pipeline', shortcut: 'P' },
  { to: '/market', labelKey: 'nav.market', shortcut: 'M' },
]


function NavItem({ to, labelKey, shortcut }) {
  const { t } = useTranslation()
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-2.5 py-1.5 rounded-md font-hand text-base transition-colors ${
          isActive ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-paper-3'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className="flex-1">{t(labelKey)}</span>
          <span className={`font-code text-[10px] ${isActive ? 'text-paper/60' : 'text-ink-4'}`}>
            {shortcut}
          </span>
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const toggleLang = () => i18n.changeLanguage(i18n.language === 'en' ? 'pl' : 'en')

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="w-[220px] shrink-0 bg-paper-2 border-r-[1.5px] border-ink flex flex-col min-h-screen sticky top-0 self-start h-screen">
      {/* Logo */}
      <div className="px-3.5 pt-5 pb-4">
        <NavLink to="/" className="flex items-center gap-2">
          <div
            className="w-[18px] h-[18px] bg-emerald-500 border-2 border-ink shrink-0"
            style={{ borderRadius: '60% 10% 60% 10%', transform: 'rotate(-18deg)' }}
          />
          <span className="font-sketch font-bold text-2xl text-ink leading-none">HireTree</span>
        </NavLink>
      </div>

      {/* Main nav */}
      <nav className="flex flex-col gap-0.5 px-2">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <div className="flex-1" />

      {/* Bottom: user + controls */}
      <div className="border-t-[1.5px] border-ink p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-ink flex items-center justify-center font-code text-[10px] font-bold text-white shrink-0">
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <span className="font-code text-[11px] text-ink-2 truncate flex-1">{user?.email}</span>
        </div>
        <div className="flex items-center gap-2 px-2">
          <button
            onClick={toggleLang}
            className="font-code text-[10px] text-ink-4 border border-line-soft px-2 py-0.5 rounded hover:border-ink-3 transition-colors"
          >
            {i18n.language === 'en' ? 'EN' : 'PL'}
          </button>
          <button
            onClick={handleLogout}
            className="font-code text-[10px] text-ink-4 hover:text-ink-2 transition-colors ml-auto"
          >
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </aside>
  )
}

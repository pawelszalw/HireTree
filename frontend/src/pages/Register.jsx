import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/useAuth'

export default function Register() {
  const { t } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError(t('auth.passwordMismatch'))
      return
    }
    if (password.length < 8) {
      setError(t('auth.passwordTooShort'))
      return
    }
    setLoading(true)
    try {
      await register(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <div
            className="w-5 h-5 bg-emerald-500 border-2 border-ink shrink-0"
            style={{ borderRadius: '60% 10% 60% 10%', transform: 'rotate(-18deg)' }}
          />
          <span className="font-sketch font-bold text-3xl text-ink leading-none">HireTree</span>
        </div>
        <p className="font-code text-xs text-ink-4">{t('auth.registerSubtitle')}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-paper-2 border-[1.5px] border-ink rounded-lg p-6 flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label className="font-code text-[10px] tracking-[1px] uppercase text-ink-4">
            {t('auth.email')}
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
            placeholder="you@example.com"
            className="bg-paper border-[1.5px] border-line-soft rounded px-3 py-2 font-hand text-base text-ink placeholder:text-ink-4 focus:outline-none focus:border-ink transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-code text-[10px] tracking-[1px] uppercase text-ink-4">
            {t('auth.password')}
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="bg-paper border-[1.5px] border-line-soft rounded px-3 py-2 font-hand text-base text-ink placeholder:text-ink-4 focus:outline-none focus:border-ink transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-code text-[10px] tracking-[1px] uppercase text-ink-4">
            {t('auth.confirmPassword')}
          </label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            placeholder="••••••••"
            className="bg-paper border-[1.5px] border-line-soft rounded px-3 py-2 font-hand text-base text-ink placeholder:text-ink-4 focus:outline-none focus:border-ink transition-colors"
          />
        </div>

        {error && <p className="font-code text-[10px] text-[#c84040]">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-ink text-paper font-code text-sm py-2.5 rounded border-2 border-ink hover:bg-ink-2 disabled:opacity-50 transition-colors mt-1"
        >
          {loading ? t('auth.registering') : t('auth.createAccount')}
        </button>
      </form>

      <p className="font-code text-center text-xs text-ink-4">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="text-emerald-ink hover:underline transition-colors">
          {t('auth.login')}
        </Link>
      </p>
    </div>
  )
}

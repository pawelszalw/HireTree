import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const emptyEntry = () => ({
  company: '',
  role: '',
  period: '',
  description: '',
  technologies: '',
})

export default function WorkHistoryForm({ onSubmit, submitLabel, submittingLabel, isRefine = false }) {
  const { t } = useTranslation()
  const [entries, setEntries] = useState([emptyEntry()])
  const [status, setStatus] = useState(null) // null | 'loading' | 'error'
  const [error, setError] = useState('')

  const update = (index, field, value) => {
    setEntries(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e))
  }

  const addEntry = () => setEntries(prev => [...prev, emptyEntry()])

  const removeEntry = (index) => {
    if (entries.length === 1) return
    setEntries(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const filled = entries.filter(e => e.company.trim() || e.role.trim() || e.description.trim())
    if (filled.length === 0) return

    setStatus('loading')
    setError('')
    try {
      await onSubmit(filled)
      setStatus(null)
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  const inputClass = "w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!isRefine && (
        <p className="text-sm font-medium text-gray-300">{t('workHistory.title')}</p>
      )}

      {entries.map((entry, index) => (
        <div key={index} className="flex flex-col gap-2 p-4 bg-gray-800 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              Position {index + 1}
            </span>
            {entries.length > 1 && (
              <button
                type="button"
                onClick={() => removeEntry(index)}
                className="text-xs text-gray-600 hover:text-red-400 transition-colors"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={entry.company}
              onChange={e => update(index, 'company', e.target.value)}
              placeholder={t('workHistory.company')}
              className={inputClass}
            />
            <input
              type="text"
              value={entry.role}
              onChange={e => update(index, 'role', e.target.value)}
              placeholder={t('workHistory.role')}
              className={inputClass}
            />
          </div>

          <input
            type="text"
            value={entry.period}
            onChange={e => update(index, 'period', e.target.value)}
            placeholder={t('workHistory.period')}
            className={inputClass}
          />

          <textarea
            value={entry.description}
            onChange={e => update(index, 'description', e.target.value)}
            placeholder={t('workHistory.description')}
            rows={2}
            className={`${inputClass} resize-none`}
          />

          <input
            type="text"
            value={entry.technologies}
            onChange={e => update(index, 'technologies', e.target.value)}
            placeholder={t('workHistory.technologies')}
            className={inputClass}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addEntry}
        className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors self-start"
      >
        {t('workHistory.addPosition')}
      </button>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="text-sm bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-600 text-white px-5 py-2 rounded-lg transition-colors self-start"
      >
        {status === 'loading'
          ? (submittingLabel ?? t('workHistory.submitting'))
          : (submitLabel ?? t('workHistory.submit'))}
      </button>
    </form>
  )
}

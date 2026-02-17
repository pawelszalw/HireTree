import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { clipJob } from '../api/clip'

export default function AddJobModal({ onClose }) {
  const { t } = useTranslation()
  const [url, setText_url]     = useState('')
  const [rawText, setRawText]  = useState('')
  const [status, setStatus]    = useState(null) // null | 'loading' | 'success' | 'error'
  const [error, setError]      = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    setError('')

    try {
      await clipJob({ url, raw_text: rawText })
      setStatus('success')
      setTimeout(() => onClose(true), 1000)
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg flex flex-col gap-5 p-6">

        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-100">{t('addJobModal.title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-300 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {status === 'success' ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <span className="text-3xl">✓</span>
            <p className="text-emerald-400 text-sm">{t('addJobModal.success')}</p>
            <button
              onClick={onClose}
              className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-5 py-2 rounded-lg transition-colors"
            >
              {t('addJobModal.cancel')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">{t('addJobModal.urlLabel')}</label>
              <input
                type="url"
                value={url}
                onChange={e => setText_url(e.target.value)}
                placeholder={t('addJobModal.urlPlaceholder')}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">{t('addJobModal.textLabel')}</label>
              <textarea
                required
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder={t('addJobModal.textPlaceholder')}
                rows={8}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              />
            </div>

            {status === 'error' && (
              <p className="text-xs text-red-400">{t('addJobModal.error')}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg transition-colors"
              >
                {t('addJobModal.cancel')}
              </button>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="flex-1 text-sm bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                {status === 'loading' ? t('addJobModal.submitting') : t('addJobModal.submit')}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { clipJob } from '../api/clip'

export default function AddJobModal({ onClose }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [url, setUrl]         = useState('')
  const [rawText, setRawText] = useState('')
  const [status, setStatus]   = useState(null)
  const [duplicateId, setDuplicateId] = useState(null)
  const [error, setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    setError('')
    try {
      const result = await clipJob({ url, raw_text: rawText })
      if (result.duplicate) {
        setDuplicateId(result.id)
        setStatus('duplicate')
      } else {
        setStatus('success')
        setTimeout(() => onClose(true), 1000)
      }
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-paper border-[1.5px] border-ink rounded-xl w-full max-w-lg flex flex-col gap-5 p-6 shadow-[4px_4px_0_rgba(0,0,0,0.12)]">

        <div className="flex items-center justify-between">
          <h2 className="font-sketch text-2xl font-bold text-ink">{t('addJobModal.title')}</h2>
          <button
            onClick={onClose}
            className="font-code text-ink-4 hover:text-ink text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <span className="font-sketch text-4xl text-emerald-ink">✓</span>
            <p className="font-hand text-base text-emerald-ink">{t('addJobModal.success')}</p>
          </div>
        )}

        {status === 'duplicate' && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <span className="text-3xl">📌</span>
            <p className="font-hand text-base text-ink-2">{t('addJobModal.duplicate')}</p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="font-code text-xs bg-paper-2 border border-line-soft text-ink-2 px-4 py-2 rounded hover:bg-paper-3 transition-colors"
              >
                {t('addJobModal.cancel')}
              </button>
              <button
                onClick={() => { onClose(); navigate(`/jobs/${duplicateId}`) }}
                className="font-code text-xs bg-ink text-paper px-4 py-2 rounded border-2 border-ink hover:bg-ink-2 transition-colors"
              >
                {t('addJobModal.viewExisting')}
              </button>
            </div>
          </div>
        )}

        {status !== 'success' && status !== 'duplicate' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <label className="font-code text-[10px] tracking-[1px] uppercase text-ink-4">
                {t('addJobModal.urlLabel')}
              </label>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder={t('addJobModal.urlPlaceholder')}
                className="bg-paper-2 border-[1.5px] border-line-soft rounded px-3 py-2 font-hand text-base text-ink placeholder:text-ink-4 focus:outline-none focus:border-ink transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-code text-[10px] tracking-[1px] uppercase text-ink-4">
                {t('addJobModal.textLabel')}
              </label>
              <textarea
                required
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder={t('addJobModal.textPlaceholder')}
                rows={8}
                className="bg-paper-2 border-[1.5px] border-line-soft rounded px-3 py-2 font-hand text-base text-ink placeholder:text-ink-4 focus:outline-none focus:border-ink transition-colors resize-none"
              />
            </div>

            {status === 'error' && (
              <p className="font-code text-[10px] text-[#c84040]">{error || t('addJobModal.error')}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 font-code text-xs bg-paper-2 border border-line-soft text-ink-2 py-2 rounded hover:bg-paper-3 transition-colors"
              >
                {t('addJobModal.cancel')}
              </button>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="flex-1 font-code text-xs bg-ink text-paper py-2 rounded border-2 border-ink hover:bg-ink-2 disabled:opacity-50 transition-colors"
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

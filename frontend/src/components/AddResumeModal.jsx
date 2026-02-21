import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { createResumeFromCV, createResumeManual } from '../api/clip'
import WorkHistoryForm from './WorkHistoryForm'

export default function AddResumeModal({ onClose, onAdded }) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [mode, setMode] = useState('upload')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const data = await createResumeFromCV(file, name || file.name.replace(/\.[^.]+$/, ''))
      onAdded(data)
      onClose()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleManualSubmit = async (entries) => {
    setLoading(true)
    setError('')
    try {
      const data = await createResumeManual(name || 'My Resume', entries)
      onAdded(data)
      onClose()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-100">{t('addResumeModal.title')}</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 transition-colors text-xl leading-none">✕</button>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">{t('addResumeModal.nameLabel')}</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t('addResumeModal.namePlaceholder')}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {['upload', 'manual'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 text-xs py-1.5 rounded-md transition-colors
                ${mode === m ? 'bg-gray-700 text-gray-100' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {t(`addResumeModal.${m}`)}
            </button>
          ))}
        </div>

        {/* Upload mode */}
        {mode === 'upload' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="text-sm bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-600 text-white px-6 py-2.5 rounded-lg transition-colors"
            >
              {loading ? t('addResumeModal.submitting') : t('addResumeModal.uploadCV')}
            </button>
            <p className="text-xs text-gray-600">PDF or DOCX</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* Manual mode */}
        {mode === 'manual' && (
          <WorkHistoryForm
            onSubmit={handleManualSubmit}
            submitLabel={loading ? t('addResumeModal.submitting') : t('addResumeModal.submit')}
            submittingLabel={t('addResumeModal.submitting')}
          />
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </div>
  )
}

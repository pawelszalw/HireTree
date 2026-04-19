import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchInterview } from '../api/clip'

const DIFFICULTY_STYLES = {
  easy:   'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  hard:   'bg-red-500/10 text-red-400 border border-red-500/20',
}

const ASSESSMENTS = [
  { key: 'knew',   icon: '✓', active: 'bg-emerald-600 hover:bg-emerald-500 text-white' },
  { key: 'unsure', icon: '~', active: 'bg-yellow-600 hover:bg-yellow-500 text-white' },
  { key: 'missed', icon: '✗', active: 'bg-red-700   hover:bg-red-600   text-white' },
]

// ---------------------------------------------------------------------------
// Pick-job placeholder (no ?job= in URL)
// ---------------------------------------------------------------------------
function PickJob({ t }) {
  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">
      <div className="text-center flex flex-col gap-3 pt-4">
        <h1 className="text-3xl font-bold text-gray-100">{t('interviewSimulator.title')}</h1>
        <p className="text-gray-400">{t('interviewSimulator.description')}</p>
      </div>
      <div className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-14 flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl">
          🎙
        </div>
        <p className="text-lg font-semibold text-gray-200">{t('interviewSimulator.pickJob')}</p>
        <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
          {t('interviewSimulator.pickJobHint')}
        </p>
        <Link to="/jobs" className="mt-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
          {t('interviewSimulator.browseJobs')} →
        </Link>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Done / results screen
// ---------------------------------------------------------------------------
function DoneScreen({ session, scores, onRestart, t }) {
  const total   = session.questions.length
  const knew    = Object.values(scores).filter(v => v === 'knew').length
  const unsure  = Object.values(scores).filter(v => v === 'unsure').length
  const missed  = Object.values(scores).filter(v => v === 'missed').length

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 pt-4">
      <div className="text-center flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-gray-100">{t('interviewSimulator.done')}</h1>
        <p className="text-gray-400">
          {session.job_title}{session.company ? ` · ${session.company}` : ''}
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-7 flex flex-col gap-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide">
          {t('interviewSimulator.doneSubtitle', { total })}
        </p>

        <div className="flex flex-col gap-2.5">
          {[
            { key: 'knew',   icon: '✓', color: 'text-emerald-400', count: knew   },
            { key: 'unsure', icon: '~', color: 'text-yellow-400',  count: unsure },
            { key: 'missed', icon: '✗', color: 'text-red-400',     count: missed },
          ].map(row => (
            <div key={row.key} className="flex items-center gap-3">
              <span className={`font-medium w-5 ${row.color}`}>{row.icon}</span>
              <span className="text-gray-300">{t(`interviewSimulator.${row.key}`)}</span>
              <span className={`ml-auto font-semibold tabular-nums ${row.color}`}>{row.count}</span>
            </div>
          ))}
        </div>

        {/* Stacked score bar */}
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
          {knew   > 0 && <div className="h-full bg-emerald-500" style={{ width: `${knew   / total * 100}%` }} />}
          {unsure > 0 && <div className="h-full bg-yellow-500" style={{ width: `${unsure / total * 100}%` }} />}
          {missed > 0 && <div className="h-full bg-red-500"    style={{ width: `${missed / total * 100}%` }} />}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onRestart}
          className="flex-1 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
        >
          {t('interviewSimulator.restart')}
        </button>
        <Link
          to="/jobs"
          className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors text-center"
        >
          {t('interviewSimulator.backToJobs')}
        </Link>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function Simulator() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const jobId = searchParams.get('job')

  const [session,  setSession]  = useState(null)
  const [idx,      setIdx]      = useState(0)
  const [revealed, setRevealed] = useState(new Set())   // Set of question ids
  const [scores,   setScores]   = useState({})          // { questionId: 'knew'|'unsure'|'missed' }
  const [done,     setDone]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    if (!jobId) return
    setLoading(true)
    setError(null)
    setSession(null)
    setDone(false)
    fetchInterview(Number(jobId))
      .then(data => { setSession(data); setIdx(0); setRevealed(new Set()); setScores({}) })
      .catch(err  => setError(err.message))
      .finally(() => setLoading(false))
  }, [jobId])

  if (!jobId)   return <PickJob t={t} />
  if (loading)  return <div className="flex items-center justify-center min-h-64 text-gray-400 text-sm">{t('interviewSimulator.loading')}</div>
  if (error)    return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4 pt-8">
      <p className="text-red-400">{error}</p>
      <Link to="/jobs" className="text-sm text-emerald-400 hover:text-emerald-300">← {t('interviewSimulator.browseJobs')}</Link>
    </div>
  )
  if (!session) return null

  if (done) return (
    <DoneScreen
      session={session}
      scores={scores}
      t={t}
      onRestart={() => { setIdx(0); setRevealed(new Set()); setScores({}); setDone(false) }}
    />
  )

  const questions = session.questions
  const q         = questions[idx]
  const isLast    = idx === questions.length - 1
  const isRevealed = revealed.has(q.id)

  const reveal  = () => setRevealed(prev => new Set([...prev, q.id]))
  const assess  = key => setScores(prev => ({ ...prev, [q.id]: key }))
  const goNext  = () => isLast ? setDone(true) : setIdx(i => i + 1)
  const goPrev  = () => setIdx(i => i - 1)

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5 pt-4">

      {/* Progress header */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm text-gray-500 truncate">
            {session.job_title}{session.company ? ` · ${session.company}` : ''}
          </p>
          <p className="text-sm text-gray-500 shrink-0 ml-3">
            {t('interviewSimulator.question', { current: idx + 1, total: questions.length })}
          </p>
        </div>
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${(idx / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-5">

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs bg-gray-800 text-gray-300 px-2.5 py-1 rounded-full font-medium">
            {q.skill}
          </span>
          {q.difficulty && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${DIFFICULTY_STYLES[q.difficulty] ?? DIFFICULTY_STYLES.medium}`}>
              {t(`interviewSimulator.difficulty.${q.difficulty}`, { defaultValue: q.difficulty })}
            </span>
          )}
          {q.category && (
            <span className="text-xs text-gray-600">{q.category}</span>
          )}
        </div>

        {/* Question text */}
        <p className="text-lg font-medium text-gray-100 leading-relaxed">{q.question}</p>

        {/* Reveal → answer → self-assessment */}
        {!isRevealed ? (
          <button
            onClick={reveal}
            className="self-start px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
          >
            {t('interviewSimulator.revealAnswer')}
          </button>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="border-t border-gray-800 pt-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Answer</p>
              <p className="text-gray-300 text-sm leading-relaxed">{q.answer}</p>
            </div>

            {/* Self-assessment */}
            <div>
              <p className="text-xs text-gray-500 mb-2">{t('interviewSimulator.selfAssessment')}</p>
              <div className="flex gap-2">
                {ASSESSMENTS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => assess(opt.key)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      scores[q.id] === opt.key
                        ? opt.active
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                    }`}
                  >
                    {opt.icon} {t(`interviewSimulator.${opt.key}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={goPrev}
          disabled={idx === 0}
          className="px-5 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 text-sm transition-colors"
        >
          {t('interviewSimulator.prev')}
        </button>
        <button
          onClick={goNext}
          className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
        >
          {isLast ? t('interviewSimulator.done') : t('interviewSimulator.next')}
        </button>
      </div>

    </div>
  )
}

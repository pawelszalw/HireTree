import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchMarket } from '../api/clip'

const CATEGORIES = ['backend', 'frontend', 'data', 'devops', 'testing', 'ai']

function SkillBar({ name, pct, rank }) {
  const isTop3 = rank < 3
  return (
    <div className="flex items-center gap-3">
      <span className="font-code text-[11px] text-ink-3 w-4 text-right shrink-0">{rank + 1}</span>
      <div className="w-[160px] shrink-0">
        <span className={`font-hand text-sm ${isTop3 ? 'text-ink font-bold' : 'text-ink-2'}`}>{name}</span>
      </div>
      <div className="flex-1 h-[10px] bg-paper-3 rounded-full border border-line-soft overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isTop3 ? 'bg-emerald-ink' : 'bg-ink-3'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-code text-[11px] text-ink-3 w-8 text-right shrink-0">{pct}%</span>
    </div>
  )
}

function SeniorityBar({ data }) {
  const { t } = useTranslation()
  const segments = [
    { key: 'junior', label: t('market.junior'), pct: data.junior, color: 'bg-sky-300' },
    { key: 'mid',    label: t('market.mid'),    pct: data.mid,    color: 'bg-emerald-400' },
    { key: 'senior', label: t('market.senior'), pct: data.senior, color: 'bg-ink-2' },
  ]
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-5 rounded-full overflow-hidden border border-line-soft gap-px">
        {segments.map(s => (
          <div
            key={s.key}
            className={`${s.color} transition-all duration-500`}
            style={{ width: `${s.pct}%` }}
          />
        ))}
      </div>
      <div className="flex gap-4">
        {segments.map(s => (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full border border-line-soft ${s.color}`} />
            <span className="font-code text-[10px] text-ink-3">{s.label} {s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Market() {
  const { t } = useTranslation()
  const [category, setCategory] = useState('backend')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchMarket(category)
      .then(setData)
      .finally(() => setLoading(false))
  }, [category])

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="font-sketch text-3xl font-bold text-ink">{t('market.title')}</h1>
        <p className="font-hand text-sm text-ink-3 mt-1">{t('market.subtitle')}</p>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`font-code text-[11px] px-3 py-1.5 rounded border transition-colors ${
              category === cat
                ? 'bg-ink text-paper border-ink'
                : 'bg-paper-2 text-ink-3 border-line-soft hover:border-ink-3'
            }`}
          >
            {t(`market.categories.${cat}`)}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-ink-3 font-hand text-sm">
          <div className="w-4 h-4 border-2 border-emerald-ink border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      )}

      {!loading && data && (
        <div className="flex flex-col gap-6">
          {/* Stats row */}
          <div className="flex gap-4">
            <div className="bg-paper-2 border-[1.5px] border-ink rounded-[6px] px-4 py-3 flex flex-col gap-0.5">
              <span className="font-code text-[22px] font-bold text-emerald-ink leading-none">
                {data.total.toLocaleString()}
              </span>
              <span className="font-hand text-[11px] text-ink-3">{t('market.offers')}</span>
            </div>
            <div className="bg-paper-2 border-[1.5px] border-ink rounded-[6px] px-4 py-3 flex flex-col gap-0.5">
              <span className="font-code text-[22px] font-bold text-emerald-ink leading-none">
                {data.remote_pct}%
              </span>
              <span className="font-hand text-[11px] text-ink-3">{t('market.remote')}</span>
            </div>
            <div className="bg-paper-2 border-[1.5px] border-ink rounded-[6px] px-4 py-3 flex-1 flex flex-col gap-1.5">
              <span className="font-hand text-[11px] text-ink-3">{t('market.seniority')}</span>
              {data.seniority && <SeniorityBar data={data.seniority} />}
            </div>
          </div>

          {/* Skill frequency */}
          <div className="bg-paper-2 border-[1.5px] border-ink rounded-[6px] p-4">
            <div className="flex items-baseline justify-between mb-3">
              <span className="font-sketch text-base font-bold text-ink">{t('market.skillFrequency')}</span>
              <span className="font-code text-[10px] text-ink-4">{t('market.skillHint')}</span>
            </div>
            <div className="flex flex-col gap-2">
              {data.skills.map((skill, i) => (
                <SkillBar key={skill.name} name={skill.name} pct={skill.pct} rank={i} />
              ))}
            </div>
          </div>

          <p className="font-code text-[10px] text-ink-4">{t('market.source')}</p>
        </div>
      )}
    </div>
  )
}

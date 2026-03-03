import { useEffect } from 'react'
import { fetchJobs } from '../api/clip'

// Listens for the 'hiretree:job-clipped' CustomEvent dispatched by the
// browser extension after a successful clip, then refetches the job list.
export function useJobClipListener(setJobs) {
  useEffect(() => {
    const handler = () => fetchJobs().then(setJobs).catch(() => {})
    window.addEventListener('hiretree:job-clipped', handler)
    return () => window.removeEventListener('hiretree:job-clipped', handler)
  }, [setJobs])
}

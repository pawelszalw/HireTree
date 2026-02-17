const API_URL = import.meta.env.VITE_API_URL ?? ''

export async function clipJob({ url, raw_text }) {
  const res = await fetch(`${API_URL}/api/clip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, raw_text }),
  })

  if (!res.ok) throw new Error(`Server error: ${res.status}`)
  return res.json()
}

export async function fetchJobs() {
  const res = await fetch(`${API_URL}/api/jobs`)
  if (!res.ok) throw new Error(`Server error: ${res.status}`)
  return res.json()
}

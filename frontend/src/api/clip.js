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

export async function uploadCV(file) {
  const formData = new FormData()
  formData.append('file', file)
  // Do NOT set Content-Type — browser sets multipart/form-data with boundary automatically
  const res = await fetch(`${API_URL}/api/cv`, { method: 'POST', body: formData })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `Server error: ${res.status}`)
  }
  return res.json()
}

export async function fetchCV() {
  const res = await fetch(`${API_URL}/api/cv`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Server error: ${res.status}`)
  return res.json()
}

export async function buildManualProfile(entries) {
  const res = await fetch(`${API_URL}/api/profile/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `Server error: ${res.status}`)
  }
  return res.json()
}

export async function refineProfile(entries) {
  const res = await fetch(`${API_URL}/api/profile/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `Server error: ${res.status}`)
  }
  return res.json()
}

export async function updateSkill(skillName, patch) {
  const res = await fetch(`${API_URL}/api/cv/skills/${encodeURIComponent(skillName)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `Server error: ${res.status}`)
  }
  return res.json()
}

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

export async function updateJobStatus(id, status) {
  const res = await fetch(`${API_URL}/api/jobs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
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

// ---------------------------------------------------------------------------
// Resume endpoints (multi-resume)
// ---------------------------------------------------------------------------

export async function fetchResumes() {
  const res = await fetch(`${API_URL}/api/resumes`)
  if (!res.ok) throw new Error(`Server error: ${res.status}`)
  return res.json()
}

export async function createResumeFromCV(file, name) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('name', name)
  const res = await fetch(`${API_URL}/api/resumes`, { method: 'POST', body: formData })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `Server error: ${res.status}`)
  }
  return res.json()
}

export async function createResumeManual(name, entries) {
  const res = await fetch(`${API_URL}/api/resumes/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, entries }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `Server error: ${res.status}`)
  }
  return res.json()
}

export async function patchResume(id, patch) {
  const res = await fetch(`${API_URL}/api/resumes/${id}`, {
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

export async function deleteResume(id) {
  const res = await fetch(`${API_URL}/api/resumes/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Server error: ${res.status}`)
}

export async function patchResumeSkill(resumeId, skillName, patch) {
  const res = await fetch(
    `${API_URL}/api/resumes/${resumeId}/skills/${encodeURIComponent(skillName)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }
  )
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `Server error: ${res.status}`)
  }
  return res.json()
}

// ---------------------------------------------------------------------------
// Skill endpoint (legacy — operates on active resume)
// ---------------------------------------------------------------------------

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

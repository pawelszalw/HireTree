const API_URL = import.meta.env.VITE_API_URL ?? ''
const CREDS = { credentials: 'include' }
const JSON_CREDS = { ...CREDS, headers: { 'Content-Type': 'application/json' } }

async function handleResponse(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `Server error: ${res.status}`)
  }
  return res.json()
}

export async function clipJob({ url, raw_text }) {
  return handleResponse(await fetch(`${API_URL}/api/clip`, {
    method: 'POST', ...JSON_CREDS,
    body: JSON.stringify({ url, raw_text }),
  }))
}

export async function fetchJobs() {
  return handleResponse(await fetch(`${API_URL}/api/jobs`, CREDS))
}

export async function fetchJob(id) {
  return handleResponse(await fetch(`${API_URL}/api/jobs/${id}`, CREDS))
}

export async function updateJobStatus(id, status) {
  return handleResponse(await fetch(`${API_URL}/api/jobs/${id}`, {
    method: 'PATCH', ...JSON_CREDS,
    body: JSON.stringify({ status }),
  }))
}

export async function uploadCV(file) {
  const formData = new FormData()
  formData.append('file', file)
  return handleResponse(await fetch(`${API_URL}/api/cv`, { method: 'POST', ...CREDS, body: formData }))
}

export async function fetchCV() {
  const res = await fetch(`${API_URL}/api/cv`, CREDS)
  if (res.status === 404 || res.status === 401) return null
  if (!res.ok) throw new Error(`Server error: ${res.status}`)
  return res.json()
}

export async function buildManualProfile(entries) {
  return handleResponse(await fetch(`${API_URL}/api/profile/manual`, {
    method: 'POST', ...JSON_CREDS,
    body: JSON.stringify({ entries }),
  }))
}

export async function refineProfile(entries) {
  return handleResponse(await fetch(`${API_URL}/api/profile/refine`, {
    method: 'POST', ...JSON_CREDS,
    body: JSON.stringify({ entries }),
  }))
}

// ---------------------------------------------------------------------------
// Resume endpoints (multi-resume)
// ---------------------------------------------------------------------------

export async function fetchResumes() {
  return handleResponse(await fetch(`${API_URL}/api/resumes`, CREDS))
}

export async function createResumeFromCV(file, name) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('name', name)
  return handleResponse(await fetch(`${API_URL}/api/resumes`, { method: 'POST', ...CREDS, body: formData }))
}

export async function createResumeManual(name, entries) {
  return handleResponse(await fetch(`${API_URL}/api/resumes/manual`, {
    method: 'POST', ...JSON_CREDS,
    body: JSON.stringify({ name, entries }),
  }))
}

export async function patchResume(id, patch) {
  return handleResponse(await fetch(`${API_URL}/api/resumes/${id}`, {
    method: 'PATCH', ...JSON_CREDS,
    body: JSON.stringify(patch),
  }))
}

export async function deleteResume(id) {
  const res = await fetch(`${API_URL}/api/resumes/${id}`, { method: 'DELETE', ...CREDS })
  if (!res.ok) throw new Error(`Server error: ${res.status}`)
}

export async function patchResumeSkill(resumeId, skillName, patch) {
  return handleResponse(await fetch(
    `${API_URL}/api/resumes/${resumeId}/skills/${encodeURIComponent(skillName)}`,
    { method: 'PATCH', ...JSON_CREDS, body: JSON.stringify(patch) }
  ))
}

// ---------------------------------------------------------------------------
// Skill endpoint (legacy — operates on active resume)
// ---------------------------------------------------------------------------

export async function updateSkill(skillName, patch) {
  return handleResponse(await fetch(`${API_URL}/api/cv/skills/${encodeURIComponent(skillName)}`, {
    method: 'PATCH', ...JSON_CREDS,
    body: JSON.stringify(patch),
  }))
}

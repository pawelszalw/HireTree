// Vite dev-only plugin that simulates the backend API in memory.
// Jobs are stored per server session (reset on restart).
// Replace with real FastAPI backend when ready.

const jobs = []

function json(res, data, status = 200) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.end(JSON.stringify(data))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try { resolve(JSON.parse(body)) }
      catch (err) { reject(err) }
    })
  })
}

export function mockApiPlugin() {
  return {
    name: 'mock-api',
    configureServer(server) {
      console.log('[mock-api] ready — POST /api/clip  GET|PATCH|DELETE /api/jobs/:id  POST /api/jobs/:id/reparse  GET /api/auth/me')

      // Handle CORS preflight from browser extension
      server.middlewares.use('/api', (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
          res.statusCode = 204
          res.end()
          return
        }
        next()
      })

      // Auth endpoints — auto-login as dev user in mock mode
      server.middlewares.use('/api/auth', async (req, res) => {
        const mockUser = { id: 'mock-user', email: 'dev@hiretree.io', created_at: new Date().toISOString() }
        // Set a mock cookie so the browser extension can authenticate in dev mode
        res.setHeader('Set-Cookie', 'access_token=mock-dev-token; Path=/; SameSite=Lax')
        if (req.url === '/me')       return json(res, mockUser)
        if (req.url === '/login')    return json(res, mockUser)
        if (req.url === '/register') return json(res, mockUser)
        if (req.url === '/logout')   return json(res, { success: true })
        json(res, { error: 'Not found' }, 404)
      })

      // POST /api/clip — receive a clipped job offer
      server.middlewares.use('/api/clip', async (req, res) => {
        if (req.method !== 'POST') return json(res, { error: 'Method not allowed' }, 405)

        try {
          const payload = await readBody(req)

          if (payload.url) {
            const existing = jobs.find(j => j.url === payload.url)
            if (existing) {
              console.log(`[mock-api] duplicate url — existing id: ${existing.id}`)
              return json(res, { received: true, duplicate: true, id: existing.id })
            }
          }

          const job = {
            id:          Date.now(),
            url:         payload.url ?? '',
            apply_url:   payload.apply_url ?? '',
            raw_text:    payload.raw_text ?? '',
            title:       payload.url ?? 'Untitled',
            company:     '',
            stack:       [],
            salary:      '',
            mode:        '',
            seniority:   '',
            status:      'saved',
            clippedAt:   new Date().toISOString(),
            match_score: null,
            matched:     [],
            missing:     [],
          }

          jobs.push(job)

          console.log(`[mock-api] clip saved — total: ${jobs.length} | url: ${job.url}`)

          json(res, { received: true, id: job.id })
        } catch (err) {
          console.error('[mock-api] clip error:', err.message)
          json(res, { error: err.message }, 400)
        }
      })

      // GET /api/market?category=backend — aggregated skill stats (mock data)
      server.middlewares.use('/api/market', (req, res) => {
        if (req.method !== 'GET') return json(res, { error: 'Method not allowed' }, 405)
        const url = new URL(req.url, 'http://localhost')
        const category = url.searchParams.get('category') || 'backend'

        const DATA = {
          backend: {
            total: 1840,
            remote_pct: 62,
            seniority: { junior: 18, mid: 52, senior: 30 },
            skills: [
              { name: 'REST API', count: 1288, pct: 70 },
              { name: 'Python', count: 1197, pct: 65 },
              { name: 'SQL', count: 1012, pct: 55 },
              { name: 'Docker', count: 1104, pct: 60 },
              { name: 'AWS', count: 736, pct: 40 },
              { name: 'Java', count: 828, pct: 45 },
              { name: 'PostgreSQL', count: 920, pct: 50 },
              { name: 'Node.js', count: 736, pct: 40 },
              { name: 'Kubernetes', count: 552, pct: 30 },
              { name: 'Redis', count: 552, pct: 30 },
              { name: 'TypeScript', count: 460, pct: 25 },
              { name: 'Spring', count: 644, pct: 35 },
              { name: 'FastAPI', count: 460, pct: 25 },
              { name: 'C#', count: 368, pct: 20 },
              { name: 'Go', count: 276, pct: 15 },
            ],
          },
          frontend: {
            total: 720,
            remote_pct: 71,
            seniority: { junior: 22, mid: 55, senior: 23 },
            skills: [
              { name: 'JavaScript', count: 648, pct: 90 },
              { name: 'HTML/CSS', count: 576, pct: 80 },
              { name: 'React', count: 540, pct: 75 },
              { name: 'TypeScript', count: 504, pct: 70 },
              { name: 'Next.js', count: 324, pct: 45 },
              { name: 'CSS', count: 468, pct: 65 },
              { name: 'Vue', count: 252, pct: 35 },
              { name: 'TailwindCSS', count: 252, pct: 35 },
              { name: 'Redux', count: 216, pct: 30 },
              { name: 'Angular', count: 216, pct: 30 },
              { name: 'Webpack', count: 180, pct: 25 },
              { name: 'REST API', count: 396, pct: 55 },
              { name: 'Git', count: 432, pct: 60 },
              { name: 'Figma', count: 180, pct: 25 },
            ],
          },
          data: {
            total: 530,
            remote_pct: 58,
            seniority: { junior: 12, mid: 48, senior: 40 },
            skills: [
              { name: 'Python', count: 424, pct: 80 },
              { name: 'SQL', count: 398, pct: 75 },
              { name: 'Pandas', count: 291, pct: 55 },
              { name: 'Statistics', count: 265, pct: 50 },
              { name: 'Machine Learning', count: 238, pct: 45 },
              { name: 'BigQuery', count: 185, pct: 35 },
              { name: 'Spark', count: 159, pct: 30 },
              { name: 'TensorFlow', count: 159, pct: 30 },
              { name: 'Power BI', count: 132, pct: 25 },
              { name: 'PyTorch', count: 132, pct: 25 },
              { name: 'Tableau', count: 106, pct: 20 },
              { name: 'Airflow', count: 106, pct: 20 },
              { name: 'dbt', count: 79, pct: 15 },
            ],
          },
          devops: {
            total: 410,
            remote_pct: 66,
            seniority: { junior: 8, mid: 45, senior: 47 },
            skills: [
              { name: 'Docker', count: 348, pct: 85 },
              { name: 'CI/CD', count: 328, pct: 80 },
              { name: 'Linux', count: 307, pct: 75 },
              { name: 'Kubernetes', count: 287, pct: 70 },
              { name: 'AWS', count: 307, pct: 75 },
              { name: 'Terraform', count: 225, pct: 55 },
              { name: 'Azure', count: 164, pct: 40 },
              { name: 'Jenkins', count: 184, pct: 45 },
              { name: 'Ansible', count: 164, pct: 40 },
              { name: 'Python', count: 143, pct: 35 },
              { name: 'GCP', count: 123, pct: 30 },
              { name: 'Helm', count: 102, pct: 25 },
              { name: 'GitOps', count: 82, pct: 20 },
            ],
          },
          testing: {
            total: 340,
            remote_pct: 54,
            seniority: { junior: 28, mid: 50, senior: 22 },
            skills: [
              { name: 'Manual Testing', count: 255, pct: 75 },
              { name: 'Agile/Scrum', count: 238, pct: 70 },
              { name: 'JIRA', count: 221, pct: 65 },
              { name: 'Selenium', count: 204, pct: 60 },
              { name: 'Postman', count: 187, pct: 55 },
              { name: 'REST API', count: 187, pct: 55 },
              { name: 'Python', count: 170, pct: 50 },
              { name: 'SQL', count: 136, pct: 40 },
              { name: 'Java', count: 136, pct: 40 },
              { name: 'Cypress', count: 119, pct: 35 },
              { name: 'TestNG', count: 85, pct: 25 },
              { name: 'Playwright', count: 102, pct: 30 },
              { name: 'BDD', count: 68, pct: 20 },
            ],
          },
          ai: {
            total: 290,
            remote_pct: 70,
            seniority: { junior: 5, mid: 40, senior: 55 },
            skills: [
              { name: 'Python', count: 261, pct: 90 },
              { name: 'Machine Learning', count: 232, pct: 80 },
              { name: 'LLM / Prompt Eng.', count: 203, pct: 70 },
              { name: 'PyTorch', count: 174, pct: 60 },
              { name: 'TensorFlow', count: 145, pct: 50 },
              { name: 'NLP', count: 145, pct: 50 },
              { name: 'Statistics', count: 116, pct: 40 },
              { name: 'OpenAI API', count: 116, pct: 40 },
              { name: 'RAG', count: 87, pct: 30 },
              { name: 'SQL', count: 87, pct: 30 },
              { name: 'MLOps', count: 87, pct: 30 },
              { name: 'Hugging Face', count: 58, pct: 20 },
              { name: 'LangChain', count: 58, pct: 20 },
            ],
          },
        }

        const result = DATA[category] ?? DATA['backend']
        return json(res, { category, ...result, source: 'mock', cached_at: new Date().toISOString() })
      })

      // /api/jobs — list, get, patch, delete, reparse, interview
      server.middlewares.use('/api/jobs', async (req, res) => {
        const idMatch        = req.url?.match(/^\/(\d+)\/?$/)
        const reparseMatch   = req.url?.match(/^\/(\d+)\/reparse\/?$/)
        const interviewMatch = req.url?.match(/^\/(\d+)\/interview\/?$/)

        // GET /api/jobs/:id/interview
        if (req.method === 'GET' && interviewMatch) {
          const id  = parseInt(interviewMatch[1])
          const job = jobs.find(j => j.id === id)
          if (!job) return json(res, { detail: 'Not found' }, 404)
          const mockQuestions = [
            { id: 1, skill: 'JavaScript', question: 'What is the difference between `==` and `===`?', answer: '`==` coerces types before comparing; `===` checks both value and type. Always prefer `===`.', category: 'basics', difficulty: 'easy' },
            { id: 2, skill: 'JavaScript', question: 'Explain event loop and microtasks vs macrotasks.', answer: 'Microtasks (Promise callbacks) run after the current task and before the next macrotask (setTimeout, I/O). The event loop processes one macrotask, then drains the microtask queue.', category: 'concurrency', difficulty: 'hard' },
            { id: 3, skill: 'React',      question: 'What is the difference between controlled and uncontrolled components?', answer: 'Controlled: React state drives the value (value + onChange). Uncontrolled: the DOM manages its own state, accessed via refs.', category: 'basics', difficulty: 'easy' },
            { id: 4, skill: 'React',      question: 'When would you use useCallback and useMemo?', answer: 'useCallback memoises a function reference to prevent child re-renders. useMemo memoises an expensive computed value. Use only when profiling shows a real issue.', category: 'performance', difficulty: 'medium' },
            { id: 5, skill: 'Git',        question: 'What is the difference between `git merge` and `git rebase`?', answer: 'Merge preserves history with a merge commit. Rebase replays commits on top of another branch for a linear history. Never rebase shared branches.', category: 'workflow', difficulty: 'medium' },
          ]
          return json(res, {
            session_id: 1,
            job_title:  job.title  || 'Mock Job',
            company:    job.company || 'Mock Company',
            seniority:  job.seniority || '',
            total:      mockQuestions.length,
            questions:  mockQuestions,
          })
        }

        // GET /api/jobs
        if (!idMatch && !reparseMatch && !interviewMatch) {
          if (req.method !== 'GET') return json(res, { error: 'Method not allowed' }, 405)
          return json(res, jobs)
        }

        const id  = parseInt((idMatch ?? reparseMatch)[1])
        const job = jobs.find(j => j.id === id)
        if (!job) return json(res, { error: 'Not found' }, 404)

        // GET /api/jobs/:id
        if (req.method === 'GET') return json(res, job)

        // PATCH /api/jobs/:id — update status and/or apply_url
        if (req.method === 'PATCH') {
          try {
            const patch = await readBody(req)
            if (patch.status    !== undefined) job.status    = patch.status
            if (patch.apply_url !== undefined) job.apply_url = patch.apply_url
            return json(res, job)
          } catch (err) {
            return json(res, { error: err.message }, 400)
          }
        }

        // DELETE /api/jobs/:id
        if (req.method === 'DELETE') {
          const idx = jobs.findIndex(j => j.id === id)
          jobs.splice(idx, 1)
          console.log(`[mock-api] deleted job ${id} — total: ${jobs.length}`)
          res.statusCode = 204
          res.end()
          return
        }

        // POST /api/jobs/:id/reparse — no AI in mock, return job unchanged
        if (req.method === 'POST' && reparseMatch) {
          console.log(`[mock-api] reparse job ${id} — returning as-is (no AI in mock)`)
          return json(res, job)
        }

        json(res, { error: 'Method not allowed' }, 405)
      })
    },
  }
}

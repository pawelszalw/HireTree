// Vite dev-only plugin that simulates the backend API in memory.
// Jobs are stored per server session (reset on restart).
// Replace with real FastAPI backend when ready.

const jobs = []

function json(res, data, status = 200) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
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
      console.log('[mock-api] ready — POST /api/clip  GET /api/jobs')

      // POST /api/clip — receive a clipped job offer
      server.middlewares.use('/api/clip', async (req, res) => {
        if (req.method !== 'POST') return json(res, { error: 'Method not allowed' }, 405)

        try {
          const payload = await readBody(req)

          const job = {
            id:        Date.now(),
            url:       payload.url ?? '',
            raw_text:  payload.raw_text ?? '',
            title:     payload.url ?? 'Untitled',
            status:    'saved',
            clippedAt: new Date().toISOString(),
          }

          jobs.push(job)

          console.log(`[mock-api] clip saved — total: ${jobs.length} | url: ${job.url}`)

          json(res, { received: true, id: job.id })
        } catch (err) {
          console.error('[mock-api] clip error:', err.message)
          json(res, { error: err.message }, 400)
        }
      })

      // GET /api/jobs — return all clipped jobs
      // PATCH /api/jobs/:id — update a job's status
      server.middlewares.use('/api/jobs', async (req, res) => {
        const idMatch = req.url?.match(/^\/(\d+)\/?$/)

        if (!idMatch) {
          if (req.method !== 'GET') return json(res, { error: 'Method not allowed' }, 405)
          return json(res, jobs)
        }

        const id = parseInt(idMatch[1])
        const job = jobs.find(j => j.id === id)
        if (!job) return json(res, { error: 'Not found' }, 404)

        if (req.method === 'PATCH') {
          try {
            const patch = await readBody(req)
            if (patch.status !== undefined) job.status = patch.status
            return json(res, job)
          } catch (err) {
            return json(res, { error: err.message }, 400)
          }
        }

        json(res, { error: 'Method not allowed' }, 405)
      })
    },
  }
}

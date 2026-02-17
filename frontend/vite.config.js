import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function mockApiPlugin() {
  const jobs = []

  return {
    name: 'mock-api',
    configureServer(server) {
      console.log('[mock-api] ready')

      server.middlewares.use('/api/clip', (req, res) => {
        console.log(`[mock-api] ${req.method} /api/clip`)

        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const payload = JSON.parse(body)

            const job = {
              id:       Date.now(),
              url:      payload.url,
              raw_text: payload.raw_text,
              title:    payload.url,
              status:   'saved',
              clippedAt: new Date().toISOString(),
            }

            jobs.push(job)

            console.log('\n── Clip saved ─────────────────────')
            console.log('URL:     ', job.url)
            console.log('Text len:', job.raw_text?.length, 'chars')
            console.log('Total jobs:', jobs.length)
            console.log('───────────────────────────────────\n')

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ received: true, id: job.id }))
          } catch (err) {
            console.error('[mock-api] error:', err.message)
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })

      server.middlewares.use('/api/jobs', (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(jobs))
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), mockApiPlugin()],
  server: {
    cors: true,
  },
})

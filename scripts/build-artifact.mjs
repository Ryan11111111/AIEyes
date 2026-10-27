import fs from 'node:fs/promises'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist', 'index.html')
const OUT_DIR = path.join(ROOT, 'artifact')
const OUT = path.join(OUT_DIR, 'AI-Eyes.html')

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'))
}

async function main() {
  const models = await readJson(path.join(ROOT, 'public', 'data', 'models.json'))
  const plans = await readJson(path.join(ROOT, 'public', 'data', 'plans.json'))
  const arena = await readJson(path.join(ROOT, 'public', 'data', 'lmarena.json'))
  const pelican = await readJson(path.join(ROOT, 'public', 'data', 'pelican.json'))
  const meta = await readJson(path.join(ROOT, 'public', 'data', 'meta.json'))
  const html = await fs.readFile(DIST, 'utf8')

  const payload = {
    models: models.models,
    apiModels: models.apiModels,
    plans: plans.plans,
    arenaGzip: gzipSync(Buffer.from(JSON.stringify(arena))).toString('base64'),
    pelican,
    meta,
  }
  const serialized = JSON.stringify(payload).replace(/</g, '\\u003c')
  const injection = `<script type="application/json" id="ai-eyes-data">${serialized}</script>`
  if (!html.includes('</body>')) throw new Error('dist/index.html 缺少 </body>')
  const output = html.replace('</body>', `${injection}</body>`)

  await fs.mkdir(OUT_DIR, { recursive: true })
  await fs.writeFile(OUT, output)
  const size = (await fs.stat(OUT)).size
  console.log(`Artifact written to ${OUT} (${(size / 1024).toFixed(0)} KB, embedded data)`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

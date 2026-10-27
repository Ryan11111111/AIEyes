import type { AppData, AppPayload, ArenaData } from './types'

interface EmbeddedPayload {
  models: AppPayload['models']
  apiModels: AppPayload['apiModels']
  plans: AppPayload['plans']
  pelican: AppPayload['pelican']
  meta: AppPayload['meta']
  arena?: ArenaData
  arenaGzip?: string
}

async function decompressGzipJson<T>(base64: string): Promise<T> {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
  return JSON.parse(await new Response(stream).text()) as T
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error(`${url} 请求失败 (${response.status})`)
  return response.json() as Promise<T>
}

function readEmbedded(): EmbeddedPayload | null {
  const node = document.getElementById('ai-eyes-data')
  if (!node?.textContent) return null
  return JSON.parse(node.textContent) as EmbeddedPayload
}

function createArenaLoader(embedded: EmbeddedPayload | null): () => Promise<ArenaData> {
  let pending: Promise<ArenaData> | null = null

  const decode = (): Promise<ArenaData> => {
    if (embedded?.arena) return Promise.resolve(embedded.arena)
    if (embedded?.arenaGzip) return decompressGzipJson<ArenaData>(embedded.arenaGzip)
    return fetchJson<ArenaData>('data/lmarena.json')
  }

  return () => {
    pending ??= decode()
    return pending
  }
}

export async function loadAppData(): Promise<AppData> {
  const embedded = readEmbedded()
  if (embedded) {
    return {
      models: embedded.models,
      apiModels: embedded.apiModels,
      plans: embedded.plans,
      pelican: embedded.pelican,
      meta: embedded.meta,
      loadArena: createArenaLoader(embedded),
    }
  }

  const [models, plans, pelican, meta] = await Promise.all([
    fetchJson<{ models: AppPayload['models']; apiModels: AppPayload['apiModels'] }>('data/models.json'),
    fetchJson<{ plans: AppPayload['plans'] }>('data/plans.json'),
    fetchJson<AppPayload['pelican']>('data/pelican.json'),
    fetchJson<AppPayload['meta']>('data/meta.json'),
  ])

  return {
    models: models.models,
    apiModels: models.apiModels,
    plans: plans.plans,
    pelican,
    meta,
    loadArena: createArenaLoader(null),
  }
}

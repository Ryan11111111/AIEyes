export type Region = 'domestic' | 'global'
export type Metric = 'intelligence' | 'coding' | 'agentic'

export interface RankedModel {
  name: string
  vendor: string
  region: Region
  intelligence: number | null
  coding: number | null
  agentic: number | null
  rank_intelligence?: number
  rank_coding?: number
  rank_agentic?: number
  apiId: string | null
  context: number | null
  maxOutput: number | null
  input: number | null
  output: number | null
  cacheRead: number | null
  cacheWrite: number | null
  openWeights: boolean | null
  free: boolean
  blended: number | null
  url: string
  source: string
}

export interface ApiModel {
  id: string
  name: string
  vendor: string
  region: Region
  provider: string
  created: number | null
  context: number | null
  maxOutput: number | null
  input: number | null
  output: number | null
  cacheRead: number | null
  cacheWrite: number | null
  modalities: string | null
  openWeights: boolean
  tools: boolean
  reasoning: boolean
  free: boolean
  url: string
  blended: number | null
  intelligence: number | null
  coding: number | null
  agentic: number | null
  arenaName: string | null
  arenaRankIntelligence: number | null
  arenaRankCoding: number | null
  arenaRankAgentic: number | null
}

export interface PlanTier {
  name: string
  price: number
  note: string
}

export interface Plan {
  id: string
  product: string
  vendor: string
  vendorType: string
  region: Region
  currency: 'USD' | 'CNY'
  fromPrice: number
  freeTier: boolean
  badge: string
  tagline: string
  tiers: PlanTier[]
  features: string[]
  models: string[]
  url: string
  sourceLabel: string
  verifiedAt: string
  note: string
}

export interface SourceStatus {
  id: string
  name: string
  url: string
  status: 'ok' | 'cached' | 'error' | 'curated' | 'fallback'
  checkedAt: string
  note: string
}

export interface Meta {
  generatedAt: string
  nextRefreshAt: string
  timezone: string
  upstreamUpdatedAt: string | null
  fx: {
    usdCny: number
    source: string
    date: string
    status: string
  }
  stats: {
    rankedModels: number
    apiModels: number
    plans: number
    vendors: number
    domesticModels: number
    globalModels: number
    openWeights: number
    freeApiModels: number
    medianOutputPrice: number | null
    cheapestDomesticPlan: { product: string; price: number; currency: string } | null
    topModel: { name: string; vendor: string; score: number } | null
    platformVendors: number
    arenaModels: number
    pelicanModels: number
    pelicanSamples: number
  }
  sources: SourceStatus[]
  disclaimer: string
}

export interface ArenaModel {
  name: string
  vendor: string
  region: Region
  license: string
  score: number
  lower: number | null
  upper: number | null
  votes: number | null
  rank: number | null
}

export interface ArenaCategory {
  id: string
  label: string
  date: string
  models: ArenaModel[]
}

export interface ArenaBoard {
  id: string
  name: string
  shortName: string
  description: string
  metric: 'rating' | 'ips'
  metricLabel: string
  date: string
  categories: ArenaCategory[]
}

export interface ArenaData {
  generatedAt: string
  source: {
    name: string
    url: string
    license: string
    note: string
  }
  boards: ArenaBoard[]
}

export interface PelicanModel {
  model: string
  displayName: string
  access: 'open' | 'closed'
  samples: number
  meanReward: number
  structure: number
  semantic: number
  perfect: number
  pelicanRate: number
  topAlt: string | null
  topAltCount: number
}

export interface PelicanData {
  generatedAt: string
  publishedAt: string | null
  source: {
    name: string
    url: string
    license: string
    note: string
  }
  scoring: string
  insight: string
  models: PelicanModel[]
  coverage: {
    samples: number
    minReward: number
    medianReward: number
    maxReward: number
    pelicanRate: number
  }
  jetty?: {
    updated: string | null
    runs: number
    lineages: number
    passCount: number
    top: {
      agent: string
      model: string
      judgeTotal: number
      selfTotal: number
      cohort: string
    }[]
  } | null
  links: {
    name: string
    url: string
    note: string
  }[]
}

export interface AppPayload {
  models: RankedModel[]
  apiModels: ApiModel[]
  plans: Plan[]
  pelican: PelicanData
  meta: Meta
}

export interface AppData extends AppPayload {
  loadArena: () => Promise<ArenaData>
}

export type Selection =
  | { kind: 'ranked'; model: RankedModel }
  | { kind: 'api'; model: ApiModel }
  | null

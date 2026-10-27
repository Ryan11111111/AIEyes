import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parquetReadObjects } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = path.join(ROOT, 'public', 'data')
const CACHE_DIR = path.join(ROOT, 'data', '.cache')
const PLAN_FILE = path.join(ROOT, 'data', 'coding-plans.json')
const UA = 'AI-Eyes/1.0 (+https://github.com/)'

const LITELLM_RAW = 'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json'
const LITELLM_PAGE = 'https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json'

const SOURCES = {
  litellm: {
    name: 'LiteLLM Model Prices',
    url: LITELLM_RAW,
    cache: 'litellm-model-prices.json',
  },
  pelican: {
    name: 'Pelican SVG Drawings',
    url: 'https://hf-mirror.com/datasets/sergiopaniego/pelican-svg-drawings/resolve/main/data.jsonl',
    cache: 'pelican-data.jsonl',
  },
  pelicanMeta: {
    name: 'Pelican Dataset Metadata',
    url: 'https://hf-mirror.com/api/datasets/sergiopaniego/pelican-svg-drawings',
    cache: 'pelican-meta.json',
  },
  fx: {
    name: 'Frankfurter (ECB)',
    url: 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=CNY',
    cache: 'fx-frankfurter.json',
  },
  fxFallback: {
    name: 'Frankfurter (ECB)',
    url: 'https://api.frankfurter.app/latest?from=USD&to=CNY',
    cache: 'fx-frankfurter-app.json',
  },
}

const LMARENA = {
  name: 'LMArena Leaderboard',
  url: 'https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset',
  license: 'CC BY 4.0',
  base: 'https://hf-mirror.com/datasets/lmarena-ai/leaderboard-dataset/resolve/main',
  boards: [
    {
      id: 'text',
      name: '文本竞技场',
      shortName: '文本',
      file: 'text/latest-00000-of-00001.parquet',
      cache: 'lmarena-text-latest.parquet',
      description: '通用对话、编程、中文、数学与指令遵循等分类的社区盲测排名。',
      metricLabel: 'Arena Score',
    },
    {
      id: 'webdev',
      name: '代码竞技场',
      shortName: '代码',
      file: 'webdev/latest-00000-of-00001.parquet',
      cache: 'lmarena-webdev-latest.parquet',
      description: 'Code Arena 的前端生成与网页开发分类排名。',
      metricLabel: 'Arena Score',
    },
    {
      id: 'agent',
      name: 'Agent 竞技场',
      shortName: 'Agent',
      file: 'agent/latest-00000-of-00001.parquet',
      cache: 'lmarena-agent-latest.parquet',
      description: '基于真实 Agent 会话信号的 IPS 分数与排名。',
      metricLabel: 'IPS 分数',
    },
  ],
}

const PELICAN = {
  name: 'Pelican SVG Drawings',
  url: 'https://huggingface.co/datasets/sergiopaniego/pelican-svg-drawings',
  license: 'Apache-2.0',
}

const ARENA_CATEGORY_LABELS = {
  overall: '总榜',
  coding: '编程',
  chinese: '中文',
  english: '英文',
  math: '数学',
  instruction_following: '指令遵循',
  creative_writing: '创意写作',
  hard_prompts: '高难题',
  hard_prompts_english: '英文高难题',
  longer_query: '长查询',
  multi_turn: '多轮',
  non_english: '非英语',
  expert: '专家',
  exclude_ties: '排除平局',
  polish: '波兰语',
  french: '法语',
  german: '德语',
  japanese: '日语',
  korean: '韩语',
  russian: '俄语',
  spanish: '西班牙语',
  image_to_webdev: '图生网页',
  webdev: 'WebDev',
  'webdev-html': 'HTML',
  'webdev-react': 'React',
  industry_business_and_management_and_financial_operations: '商业 / 金融',
  industry_entertainment_and_sports_and_media: '娱乐 / 体育 / 媒体',
  industry_legal_and_government: '法律 / 政府',
  industry_life_and_physical_and_social_science: '生命 / 物理 / 社科',
  industry_mathematical: '数学行业',
  industry_medicine_and_healthcare: '医疗健康',
  industry_software_and_it_services: '软件 / IT',
  industry_writing_and_literature_and_language: '写作 / 文学 / 语言',
}

const ARENA_CATEGORY_ORDER = [
  'overall', 'coding', 'chinese', 'math', 'instruction_following', 'creative_writing',
  'hard_prompts', 'hard_prompts_english', 'longer_query', 'multi_turn', 'non_english',
  'english', 'expert', 'exclude_ties', 'polish', 'french', 'german', 'japanese',
  'korean', 'russian', 'spanish',
]

const ARENA_VENDOR_HINTS = [
  [/^claude/i, 'anthropic'],
  [/^(gpt|chatgpt|o[1-9])/i, 'openai'],
  [/^gemini/i, 'google'],
  [/^qwen/i, 'alibaba'],
  [/^deepseek/i, 'deepseek'],
  [/^kimi/i, 'moonshotai'],
  [/^(glm|chatglm)/i, 'z-ai'],
  [/^grok/i, 'xai'],
  [/^llama/i, 'meta'],
  [/^(mistral|mixtral|magistral|devstral)/i, 'mistralai'],
  [/^command/i, 'cohere'],
  [/^nemotron/i, 'nvidia'],
  [/^phi/i, 'microsoft'],
  [/^minimax/i, 'minimax'],
  [/^hunyuan/i, 'tencent'],
  [/^ernie/i, 'baidu'],
  [/^doubao/i, 'bytedance'],
  [/^step/i, 'stepfun'],
  [/^mimo/i, 'xiaomi'],
  [/^longcat/i, 'longcat'],
  [/^yi-/i, '01-ai'],
  [/^internlm/i, 'internlm'],
]

const PELICAN_MODEL_NAMES = {
  'gpt-5.6-sol': 'GPT-5.6 Sol',
  'moonshotai/Kimi-K3': 'Kimi K3',
  'zai-org/GLM-5.2': 'GLM-5.2',
  'Qwen/Qwen3.6-27B': 'Qwen3.6-27B',
  'claude-opus-5': 'Claude Opus 5',
  'claude-fable-5': 'Claude Fable 5',
  'nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B-NVFP4': 'Nemotron 3 Ultra 550B',
}

const BIRD_LABELS = {
  pelican: '鹈鹕',
  stork: '鹳',
  duck: '鸭',
  goose: '鹅',
  swan: '天鹅',
  flamingo: '火烈鸟',
  heron: '鹭',
  crane: '鹤',
  seagull: '海鸥',
  gull: '海鸥',
  bird: '普通鸟',
  chicken: '鸡',
  turkey: '火鸡',
  ostrich: '鸵鸟',
  penguin: '企鹅',
  parrot: '鹦鹉',
  owl: '猫头鹰',
  eagle: '鹰',
}

const VENDORS = {
  anthropic: { name: 'Anthropic', region: 'global' },
  openai: { name: 'OpenAI', region: 'global' },
  google: { name: 'Google', region: 'global' },
  gemini: { name: 'Google', region: 'global' },
  meta: { name: 'Meta', region: 'global' },
  'meta-llama': { name: 'Meta', region: 'global' },
  'meta_llama': { name: 'Meta', region: 'global' },
  'x-ai': { name: 'xAI', region: 'global' },
  xai: { name: 'xAI', region: 'global' },
  mistralai: { name: 'Mistral AI', region: 'global' },
  mistral: { name: 'Mistral AI', region: 'global' },
  cohere: { name: 'Cohere', region: 'global' },
  nvidia: { name: 'NVIDIA', region: 'global' },
  amazon: { name: 'Amazon', region: 'global' },
  amazon_nova: { name: 'Amazon', region: 'global' },
  microsoft: { name: 'Microsoft', region: 'global' },
  ibm: { name: 'IBM', region: 'global' },
  'ibm-granite': { name: 'IBM', region: 'global' },
  ai21: { name: 'AI21 Labs', region: 'global' },
  openrouter: { name: 'OpenRouter', region: 'global' },
  'aion-labs': { name: 'Aion Labs', region: 'global' },
  sakana: { name: 'Sakana AI', region: 'global' },
  poolside: { name: 'Poolside', region: 'global' },
  thedrummer: { name: 'TheDrummer', region: 'global' },
  unbiased: { name: 'Unbiased', region: 'global' },
  scaledown: { name: 'ScaleDown', region: 'global' },
  perceptron: { name: 'Perceptron', region: 'global' },
  'inference-net': { name: 'Inference.net', region: 'global' },
  relace: { name: 'Relace', region: 'global' },
  morph: { name: 'Morph', region: 'global' },
  sao10k: { name: 'Sao10K', region: 'global' },
  recursive: { name: 'Recursive', region: 'global' },
  elorian: { name: 'Elorian', region: 'global' },
  typesafe: { name: 'TypeSafe', region: 'global' },
  fireworks: { name: 'Fireworks AI', region: 'global' },
  'prism-ml': { name: 'Prism ML', region: 'global' },
  'dots-studio': { name: 'Dots Studio', region: 'global' },
  writer: { name: 'Writer', region: 'global' },
  cognitivecomputations: { name: 'Cognitive Computations', region: 'global' },
  'anthracite-org': { name: 'Anthracite', region: 'global' },
  mancer: { name: 'Mancer', region: 'global' },
  undi95: { name: 'Undi95', region: 'global' },
  gryphe: { name: 'Gryphe', region: 'global' },
  moondream: { name: 'Moondream', region: 'global' },
  databricks: { name: 'Databricks', region: 'global' },
  snowflake: { name: 'Snowflake', region: 'global' },
  openchat: { name: 'OpenChat', region: 'global' },
  rekaai: { name: 'Reka AI', region: 'global' },
  upstage: { name: 'Upstage', region: 'global' },
  lgai: { name: 'LG AI Research', region: 'global' },
  naver: { name: 'Naver', region: 'global' },
  skt: { name: 'SK Telecom', region: 'global' },
  kt: { name: 'Korea Telecom', region: 'global' },
  sarvam: { name: 'Sarvam AI', region: 'global' },
  tii: { name: 'TII', region: 'global' },
  swissai: { name: 'Swiss AI Initiative', region: 'global' },
  liquid: { name: 'Liquid AI', region: 'global' },
  allenai: { name: 'Allen Institute for AI', region: 'global' },
  nousresearch: { name: 'Nous Research', region: 'global' },
  perplexity: { name: 'Perplexity', region: 'global' },
  'arcee-ai': { name: 'Arcee AI', region: 'global' },
  arcee: { name: 'Arcee AI', region: 'global' },
  reka: { name: 'Reka AI', region: 'global' },
  inception: { name: 'Inception', region: 'global' },
  reflection: { name: 'Reflection', region: 'global' },
  servicenow: { name: 'ServiceNow', region: 'global' },
  sapiens: { name: 'Sapiens AI', region: 'global' },
  celeris: { name: 'Celeris', region: 'global' },
  multiverse: { name: 'Multiverse Computing', region: 'global' },
  apodex: { name: 'Apodex', region: 'global' },
  thinkingmachines: { name: 'Thinking Machines', region: 'global' },
  'prime-intellect': { name: 'Prime Intellect', region: 'global' },
  'nex-agi': { name: 'Nex AGI', region: 'global' },
  motif: { name: 'Motif Technologies', region: 'global' },

  qwen: { name: '阿里云 Qwen', region: 'domestic' },
  alibaba: { name: '阿里云 Qwen', region: 'domestic' },
  dashscope: { name: '阿里云 Qwen', region: 'domestic' },
  qwencloud: { name: '阿里云 Qwen', region: 'domestic' },
  'qwen-ai-platform': { name: '阿里云 Qwen', region: 'domestic' },
  deepseek: { name: 'DeepSeek', region: 'domestic' },
  moonshotai: { name: '月之暗面 Kimi', region: 'domestic' },
  moonshot: { name: '月之暗面 Kimi', region: 'domestic' },
  'z-ai': { name: '智谱 Z.ai', region: 'domestic' },
  zai: { name: '智谱 Z.ai', region: 'domestic' },
  zhipu: { name: '智谱 Z.ai', region: 'domestic' },
  inclusionai: { name: '蚂蚁 InclusionAI', region: 'domestic' },
  minimax: { name: 'MiniMax', region: 'domestic' },
  xiaomi: { name: '小米 MiMo', region: 'domestic' },
  baidu: { name: '百度 ERNIE', region: 'domestic' },
  bytedance: { name: '字节跳动', region: 'domestic' },
  'bytedance-seed': { name: '字节跳动 Seed', region: 'domestic' },
  volcengine: { name: '字节跳动 火山方舟', region: 'domestic' },
  tencent: { name: '腾讯', region: 'domestic' },
  kwaipilot: { name: '快手 KwaiKAT', region: 'domestic' },
  'xingchen-agi': { name: '科大讯飞 星辰', region: 'domestic' },
  stepfun: { name: '阶跃星辰', region: 'domestic' },
  openbmb: { name: 'OpenBMB', region: 'domestic' },
  longcat: { name: '美团 LongCat', region: 'domestic' },
  'china-mobile': { name: '中国移动', region: 'domestic' },
  nanbeige: { name: '南北阁', region: 'domestic' },
  ai9stars: { name: 'AI9Stars', region: 'domestic' },
  kwaikat: { name: '快手 KwaiKAT', region: 'domestic' },
  kwai: { name: '快手 KwaiKAT', region: 'domestic' },
  antgroup: { name: '蚂蚁集团', region: 'domestic' },
  huawei: { name: '华为', region: 'domestic' },
  iflytek: { name: '科大讯飞', region: 'domestic' },
  sensetime: { name: '商汤', region: 'domestic' },
  meituan: { name: '美团', region: 'domestic' },
  '01-ai': { name: '零一万物', region: 'domestic' },
  baichuan: { name: '百川智能', region: 'domestic' },
  kunlun: { name: '昆仑万维', region: 'domestic' },
  thudm: { name: '智谱 / 清华', region: 'domestic' },
  internlm: { name: '上海 AI Lab', region: 'domestic' },
}

const CREATOR_VENDOR = {
  'Alibaba': '阿里云 Qwen',
  'Qwen': '阿里云 Qwen',
  'DeepSeek': 'DeepSeek',
  'Kimi': '月之暗面 Kimi',
  'Moonshot AI': '月之暗面 Kimi',
  'Z AI': '智谱 Z.ai',
  'Zhipu AI': '智谱 Z.ai',
  'InclusionAI': '蚂蚁 InclusionAI',
  'MiniMax': 'MiniMax',
  'Xiaomi': '小米 MiMo',
  'Baidu': '百度 ERNIE',
  'ByteDance Seed': '字节跳动 Seed',
  'ByteDance': '字节跳动',
  'Tencent': '腾讯',
  'StepFun': '阶跃星辰',
  'OpenBMB': 'OpenBMB',
  'LongCat': '美团 LongCat',
  'China Mobile': '中国移动',
  'Nanbeige': '南北阁',
  'AI9Stars': 'AI9Stars',
  'KwaiKAT': '快手 KwaiKAT',
  'Huawei': '华为',
  'iFlytek': '科大讯飞',
  'SenseTime': '商汤',
  'Meituan': '美团',
  '01.AI': '零一万物',
  'Baichuan': '百川智能',
  'Kunlun': '昆仑万维',
  'NVIDIA': 'NVIDIA',
  'SpaceXAI': 'xAI',
  'Mistral': 'Mistral AI',
  'Google': 'Google',
  'OpenAI': 'OpenAI',
  'Anthropic': 'Anthropic',
  'Meta': 'Meta',
  'Amazon': 'Amazon',
  'Microsoft': 'Microsoft',
  'IBM': 'IBM',
  'Cohere': 'Cohere',
  'LG AI Research': 'LG AI Research',
  'Upstage': 'Upstage',
  'Naver': 'Naver',
  'SK Telecom': 'SK Telecom',
  'Korea Telecom': 'Korea Telecom',
  'Sarvam': 'Sarvam AI',
  'TII UAE': 'TII',
  'Swiss AI Initiative': 'Swiss AI Initiative',
  'Liquid AI': 'Liquid AI',
  'Allen Institute for AI': 'Allen Institute for AI',
  'Nous Research': 'Nous Research',
  'Perplexity': 'Perplexity',
  'Arcee AI': 'Arcee AI',
  'Reka AI': 'Reka AI',
  'Inception': 'Inception',
  'Reflection': 'Reflection',
  'ServiceNow': 'ServiceNow',
  'Sapiens AI': 'Sapiens AI',
  'Celeris': 'Celeris',
  'Thinking Machines': 'Thinking Machines',
  'Prime Intellect': 'Prime Intellect',
  'Nex AGI': 'Nex AGI',
}

const DOMESTIC_CREATORS = new Set([
  'Alibaba', 'Qwen', 'DeepSeek', 'Kimi', 'Moonshot AI', 'Z AI', 'Zhipu AI', 'InclusionAI',
  'MiniMax', 'Xiaomi', 'Baidu', 'ByteDance Seed', 'ByteDance', 'Tencent', 'StepFun',
  'OpenBMB', 'LongCat', 'China Mobile', 'Nanbeige', 'AI9Stars', 'KwaiKAT', 'Huawei',
  'iFlytek', 'SenseTime', 'Meituan', '01.AI', 'Baichuan', 'Kunlun',
])

const DOMESTIC_PREFIXES = new Set([
  'qwen', 'alibaba', 'dashscope', 'qwencloud', 'deepseek', 'moonshotai', 'moonshot',
  'z-ai', 'zhipu', 'inclusionai', 'minimax', 'xiaomi', 'baidu', 'bytedance',
  'bytedance-seed', 'volcengine', 'tencent', 'stepfun', 'openbmb', 'longcat',
  'china-mobile', 'nanbeige', 'ai9stars', 'kwaikat', 'kwai', 'antgroup', 'huawei',
  'iflytek', 'sensetime', 'meituan', '01-ai', 'baichuan', 'kunlun', 'thudm', 'internlm',
  'kwaipilot', 'xingchen-agi',
])

const TRAILING_DATE_RE = /(?:^|\s)((?:20\d{6})|(?:(?:0?[1-9]|1[0-2])[0-3]\d))$/

const CHAT_MODES = new Set(['chat', 'completion', 'responses'])

const FIRST_PARTY_PROVIDERS = new Set([
  'openai', 'anthropic', 'gemini', 'google', 'xai', 'deepseek', 'moonshot',
  'dashscope', 'qwen_ai_platform', 'qwencloud', 'zai', 'zhipu', 'minimax',
  'mistral', 'cohere', 'meta', 'meta_llama', 'amazon', 'amazon_nova', 'nvidia',
  'ibm', 'ai21', 'perplexity', 'volcengine', 'baidu', 'bytedance', 'tencent',
  'stepfun', 'xiaomi', 'internlm',
])

const KNOWN_HOSTS = new Set([
  'azure', 'azure_ai', 'bedrock', 'bedrock_converse', 'bedrock_mantle',
  'vertex_ai', 'vertex_ai-language-models', 'vertex_ai-anthropic_models',
  'vertex_ai-llama_models', 'fireworks_ai', 'together_ai', 'groq', 'cerebras',
  'deepinfra', 'novita', 'nebius', 'sambanova', 'lambda_ai', 'hyperbolic',
  'nscale', 'openrouter', 'cloudflare', 'databricks', 'replicate', 'baseten',
  'anyscale', 'ovhcloud', 'llamagate', 'gmi', 'aihubmix', 'oci', 'watsonx',
  'snowflake', 'vercel_ai_gateway',
])

const EXCLUDED_PROVIDERS = new Set([
  'ollama', 'abliteration', 'github_copilot', 'opencode_go', 'stability',
  'voyage', 'deepgram', 'fal_ai', 'moderation', 'image_generation', 'openrouter',
])

const VENDOR_PREFIXES = [
  'nvidia', 'meta', 'google', 'openai', 'anthropic', 'mistral', 'deepseek',
  'qwen', 'moonshot', 'zai', 'minimax', 'amazon', 'microsoft', 'baidu',
  'bytedance', 'tencent', 'stepfun', 'xiaomi', 'longcat', 'ibm', 'cohere',
  'ai21', 'arcee', 'nous', 'allen', 'tii',
]

const MODEL_VENDOR_HINTS = [
  [/^claude/i, 'anthropic'],
  [/^(gpt|chatgpt|davinci|babbage|o[1-9](?:-|$))/i, 'openai'],
  [/^(gemini|gemma|palm|medgemma)/i, 'google'],
  [/^grok/i, 'xai'],
  [/^deepseek/i, 'deepseek'],
  [/^(qwen|qwq)/i, 'qwen'],
  [/^(kimi|moonshot)/i, 'moonshotai'],
  [/^(glm|chatglm|zhipu)/i, 'z-ai'],
  [/^minimax/i, 'minimax'],
  [/^llama/i, 'meta'],
  [/^(mistral|mixtral|magistral|devstral|codestral|pixtral|ministral|voxtral)/i, 'mistralai'],
  [/^(command|embed|rerank)/i, 'cohere'],
  [/^nemotron/i, 'nvidia'],
  [/^phi/i, 'microsoft'],
  [/^nova/i, 'amazon'],
  [/^granite/i, 'ibm'],
  [/^jamba/i, 'ai21'],
  [/^sonar/i, 'perplexity'],
  [/^hunyuan/i, 'tencent'],
  [/^ernie/i, 'baidu'],
  [/^(doubao|skylark|seed)/i, 'bytedance'],
  [/^step[-_]?\d/i, 'stepfun'],
  [/^mimo/i, 'xiaomi'],
  [/^longcat/i, 'longcat'],
  [/^yi-/i, '01-ai'],
  [/^internlm/i, 'internlm'],
]

const OPEN_WEIGHT_HINTS = [
  /llama/i, /qwen/i, /qwq/i, /deepseek/i, /mistral/i, /mixtral/i, /magistral/i,
  /devstral/i, /codestral/i, /pixtral/i, /ministral/i, /gemma/i, /glm/i,
  /gpt-oss/i, /phi/i, /granite/i, /olmo/i, /nemotron/i, /minimax/i, /hunyuan/i,
  /ernie/i, /doubao/i, /seed-oss/i, /yi-/i, /internlm/i, /step[-_]?\d/i, /mimo/i,
  /longcat/i, /kimi-k2/i,
]

const QUALIFIER_TAIL_RE = /(?:[\s_-]+(?:beta(?:\s*\d+)?|preview|experimental|exp|instant|thinking|non-thinking|turbo|chat|fast|reasoning|latest|free))+$/i
const DATE_TAIL_RE = /(?:[\s_.-]*)(?:20\d{6}|20\d{2}[-_.]\d{2}[-_.]\d{2}|\d{2}[-_.]\d{2}[-_.]\d{2})$/i
const VERSION_TAIL_RE = /[-_]v\d+(?::\d+)?$/i
const VERSION_MAJOR_ZERO_RE = /[-_]\d+\.0$/i
const VERSION_ZERO_RE = /[-_.]0$/i
const PAREN_TAIL_RE = /\s*\([^()]*\)\s*$/

function cleanArenaName(raw) {
  let name = String(raw || '').replace(/\s+/g, ' ').trim()
  for (let i = 0; i < 4; i += 1) {
    const next = name.replace(PAREN_TAIL_RE, '').replace(TRAILING_DATE_RE, '').trim()
    if (next === name) break
    name = next
  }
  return name
}

function normKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '')
}

function titleCase(value) {
  return String(value || '')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function vendorInfo(prefix, creatorName) {
  if (creatorName && CREATOR_VENDOR[creatorName]) {
    return {
      name: CREATOR_VENDOR[creatorName],
      region: DOMESTIC_CREATORS.has(creatorName) ? 'domestic' : 'global',
    }
  }
  const normalizedPrefix = String(prefix || '').replace(/^~/, '')
  const known = VENDORS[normalizedPrefix]
  if (known) return known
  return {
    name: creatorName || titleCase(normalizedPrefix || 'Unknown'),
    region: DOMESTIC_PREFIXES.has(normalizedPrefix) || DOMESTIC_CREATORS.has(creatorName) ? 'domestic' : 'global',
  }
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function perMillion(value) {
  const number = toNumber(value)
  if (number === null || number < 0) return null
  return Number((number * 1_000_000).toFixed(6))
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function loadLocalEnv() {
  try {
    const text = await fs.readFile(path.join(ROOT, '.env.local'), 'utf8')
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const separator = trimmed.indexOf('=')
      if (separator < 0) continue
      const key = trimmed.slice(0, separator).trim()
      let value = trimmed.slice(separator + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (key && !(key in process.env)) process.env[key] = value
    }
  } catch {
    // .env.local is optional
  }
}

function githubAuth(url) {
  const token = process.env.GITHUB_TOKEN || process.env.AIEYES_GITHUB_TOKEN
  if (!token) return {}
  try {
    const host = new URL(url).hostname
    if (host === 'raw.githubusercontent.com' || host === 'github.com' || host === 'api.github.com') {
      return { Authorization: `Bearer ${token}` }
    }
  } catch {
    return {}
  }
  return {}
}

async function request(url, { json }) {
  const headers = {
    'User-Agent': UA,
    Accept: json ? 'application/json' : 'text/html,application/xhtml+xml',
  }
  const auth = githubAuth(url)
  Object.assign(headers, auth)
  let response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(60000),
    redirect: 'follow',
  })
  if ((response.status === 401 || response.status === 403) && auth.Authorization) {
    const retryHeaders = { ...headers }
    delete retryHeaders.Authorization
    response = await fetch(url, {
      headers: retryHeaders,
      signal: AbortSignal.timeout(60000),
      redirect: 'follow',
    })
  }
  return response
}

async function fetchSource(source, { json = false, minLength = 1000 } = {}) {
  const cachePath = path.join(CACHE_DIR, source.cache)
  let lastError = null
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await request(source.url, { json })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const text = await response.text()
      if (text.length < minLength) throw new Error(`response too short (${text.length})`)
      await fs.mkdir(CACHE_DIR, { recursive: true })
      await fs.writeFile(cachePath, text)
      return { text, status: 'ok', fetchedAt: new Date().toISOString() }
    } catch (error) {
      lastError = error
      if (attempt < 2) await sleep(1200 * (attempt + 1))
    }
  }
  try {
    const cached = await fs.readFile(cachePath, 'utf8')
    return { text: cached, status: 'cached', fetchedAt: new Date().toISOString(), error: String(lastError?.message || lastError) }
  } catch {
    return { text: '', status: 'error', fetchedAt: new Date().toISOString(), error: String(lastError?.message || lastError) }
  }
}

async function fetchBinarySource(source) {
  const cachePath = path.join(CACHE_DIR, source.cache)
  let lastError = null
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await request(source.url, { json: false })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const buffer = Buffer.from(await response.arrayBuffer())
      if (buffer.byteLength < 1000) throw new Error(`response too short (${buffer.byteLength})`)
      await fs.mkdir(CACHE_DIR, { recursive: true })
      await fs.writeFile(cachePath, buffer)
      return { buffer, status: 'ok', fetchedAt: new Date().toISOString() }
    } catch (error) {
      lastError = error
      if (attempt < 2) await sleep(1200 * (attempt + 1))
    }
  }
  try {
    const buffer = await fs.readFile(cachePath)
    return {
      buffer,
      status: 'cached',
      fetchedAt: new Date().toISOString(),
      error: String(lastError?.message || lastError),
    }
  } catch {
    return {
      buffer: null,
      status: 'error',
      fetchedAt: new Date().toISOString(),
      error: String(lastError?.message || lastError),
    }
  }
}

function toArrayBuffer(buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
}

function aggregateResults(results) {
  const errors = results.filter((entry) => entry.status === 'error')
  const cached = results.filter((entry) => entry.status === 'cached')
  const status = errors.length
    ? (cached.length || results.some((entry) => entry.status === 'ok') ? 'cached' : 'error')
    : (cached.length ? 'cached' : 'ok')
  return {
    status,
    fetchedAt: new Date().toISOString(),
    error: errors.length
      ? errors.map((entry) => `${entry.id}: ${entry.error}`).join('；')
      : null,
  }
}

function roundTo(value, digits) {
  return value === null ? null : Number(value.toFixed(digits))
}

function arenaCategoryLabel(id) {
  return ARENA_CATEGORY_LABELS[id] || id.replace(/_/g, ' ')
}

function arenaCategoryRank(id) {
  const index = ARENA_CATEGORY_ORDER.indexOf(id)
  return index === -1 ? 999 : index
}

function arenaVendor(organization, modelName) {
  const org = String(organization || '').trim()
  if (org) {
    return vendorInfo(org.toLowerCase(), org)
  }
  for (const [pattern, prefix] of ARENA_VENDOR_HINTS) {
    if (pattern.test(modelName)) return vendorInfo(prefix)
  }
  return { name: '未标注', region: 'global' }
}

function normalizeArenaRow(row, boardId) {
  const name = String(row.model_name || '').trim()
  const organization = String(row.organization || '').trim()
  const license = String(row.license || '').trim()
  const vendor = arenaVendor(organization, name)
  const isAgent = boardId === 'agent'
  const digits = isAgent ? 4 : 2
  const score = roundTo(toNumber(isAgent ? row.score : row.rating), digits)
  if (score === null || !name) return null
  const votes = toNumber(isAgent ? row.observation_count : row.vote_count)
  const rank = toNumber(row.rank)
  return {
    name,
    vendor: vendor.name,
    region: vendor.region,
    license,
    score,
    lower: roundTo(toNumber(isAgent ? row.score_ci_lower : row.rating_lower), digits),
    upper: roundTo(toNumber(isAgent ? row.score_ci_upper : row.rating_upper), digits),
    votes: votes === null ? null : Math.round(votes),
    rank: rank === null ? null : Math.round(rank),
  }
}

function normalizeArenaBoard(board, rows) {
  const grouped = new Map()
  const dates = new Map()
  for (const row of rows) {
    const model = normalizeArenaRow(row, board.id)
    if (!model) continue
    const category = String(row.category || 'overall')
    if (!grouped.has(category)) grouped.set(category, [])
    grouped.get(category).push(model)
    const date = String(row.leaderboard_publish_date || '')
    if (date > (dates.get(category) || '')) dates.set(category, date)
  }

  const categories = [...grouped.entries()]
    .map(([id, models]) => ({
      id,
      label: arenaCategoryLabel(id),
      date: dates.get(id) || '',
      models: models.sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9)),
    }))
    .sort((a, b) => arenaCategoryRank(a.id) - arenaCategoryRank(b.id) || a.label.localeCompare(b.label, 'zh-CN'))

  return {
    id: board.id,
    name: board.name,
    shortName: board.shortName,
    description: board.description,
    metric: board.id === 'agent' ? 'ips' : 'rating',
    metricLabel: board.metricLabel,
    date: categories.reduce((max, category) => (category.date > max ? category.date : max), ''),
    categories,
  }
}

function litellmBase(key) {
  let name = String(key).split('/').pop()
  name = name.replace(/@.*$/, '')
  name = name.replace(/:(?:0|default|free)$/i, '')
  name = name.replace(/^(?:us-gov|us|eu|au|jp|global|apac|ca|sa|uk)\./i, '')
  name = name.replace(/^(?:anthropic|meta|mistral|cohere|amazon|nvidia|deepseek|qwen|moonshot|zai|z-ai|google|openai)\./i, '')
  name = name.replace(/[-_]v\d+(?::\d+)?$/i, '')
  name = name.replace(/[-_.](?:20\d{6}|\d{4}[-_.]\d{2}[-_.]\d{2})$/i, '')
  name = name.replace(/[-_]latest$/i, '')
  return name.toLowerCase()
}

function addVariant(out, value) {
  const normalized = normKey(value)
  if (normalized.length >= 2) out.add(normalized)
}

function variantFamily(value) {
  const out = new Set()
  let current = String(value || '').replace(/\s+/g, ' ').trim()
  addVariant(out, current)
  for (let i = 0; i < 6; i += 1) {
    const next = current
      .replace(PAREN_TAIL_RE, '')
      .replace(DATE_TAIL_RE, '')
      .replace(VERSION_TAIL_RE, '')
      .replace(VERSION_MAJOR_ZERO_RE, '')
      .replace(VERSION_ZERO_RE, '')
      .replace(QUALIFIER_TAIL_RE, '')
      .replace(/[-_\s]+$/, '')
      .trim()
    if (next === current) break
    current = next
    addVariant(out, current)
  }
  for (const variant of [...out]) {
    for (const prefix of VENDOR_PREFIXES) {
      if (variant.startsWith(prefix) && variant.length > prefix.length + 2) {
        out.add(variant.slice(prefix.length))
      }
    }
  }
  return [...out]
}

function entryScore(entry) {
  const provider = entry.provider
  let score = FIRST_PARTY_PROVIDERS.has(provider) ? 100 : KNOWN_HOSTS.has(provider) ? 40 : 10
  if (!entry.key.includes('/')) score += 20
  if (QUALIFIER_TAIL_RE.test(entry.base)) score -= 4
  if (DATE_TAIL_RE.test(entry.base)) score -= 2
  if (entry.v.input_cost_per_token !== undefined) score += 5
  if (entry.v.output_cost_per_token !== undefined) score += 5
  if (entry.v.max_input_tokens) score += 3
  if (entry.v.supports_function_calling) score += 2
  if (entry.v.supports_reasoning) score += 1
  return score
}

function catalogGroupKey(base) {
  const variants = variantFamily(base)
  if (!variants.length) return normKey(base)
  return variants.reduce((shortest, current) => (current.length < shortest.length ? current : shortest))
}

function buildCatalog(raw) {
  const today = new Date().toISOString().slice(0, 10)
  const groups = new Map()
  for (const [key, value] of Object.entries(raw)) {
    if (key === 'sample_spec' || !value || typeof value !== 'object') continue
    const mode = value.mode || 'chat'
    if (!CHAT_MODES.has(mode)) continue
    if (value.deprecation_date && value.deprecation_date < today) continue
    if (EXCLUDED_PROVIDERS.has(value.litellm_provider)) continue
    if (value.input_cost_per_token === undefined && value.output_cost_per_token === undefined) continue
    const base = litellmBase(key)
    if (!base || base.length < 2) continue
    const groupKey = catalogGroupKey(base)
    const entry = { key, base, provider: value.litellm_provider || 'unknown', v: value }
    if (!groups.has(groupKey)) groups.set(groupKey, [])
    groups.get(groupKey).push(entry)
  }

  const catalog = []
  for (const entries of groups.values()) {
    entries.sort((a, b) => entryScore(b) - entryScore(a))
    const primary = entries[0]
    const merged = { ...primary.v }
    for (const entry of entries.slice(1)) {
      for (const [field, value] of Object.entries(entry.v)) {
        if (merged[field] === undefined && value !== undefined) merged[field] = value
      }
    }
    if (merged.input_cost_per_token === undefined && merged.output_cost_per_token === undefined) continue
    if (merged.deprecation_date && merged.deprecation_date < today) continue
    catalog.push({ id: primary.key, base: primary.base, provider: primary.provider, v: merged, variants: entries.length })
  }
  return catalog
}

function catalogVendor(base, provider) {
  const lower = String(base).toLowerCase()
  const providerKey = String(provider || '').toLowerCase()
  if (providerKey === 'meta' || providerKey === 'meta_llama') return VENDORS.meta
  if (providerKey === 'google' || providerKey === 'gemini') return VENDORS.google
  if (providerKey === 'amazon' || providerKey === 'amazon_nova') return VENDORS.amazon
  for (const [pattern, prefix] of MODEL_VENDOR_HINTS) {
    if (pattern.test(lower)) return vendorInfo(prefix)
  }
  if (VENDORS[providerKey]) return VENDORS[providerKey]
  return vendorInfo(providerKey)
}

function isOpenLicense(license) {
  return Boolean(license) && !/proprietary|unknown|other|closed/i.test(license)
}

function looksOpenWeights(base) {
  return OPEN_WEIGHT_HINTS.some((pattern) => pattern.test(base))
}

function modalityString(v) {
  const input = Array.isArray(v.supported_modalities) ? v.supported_modalities : null
  const output = Array.isArray(v.supported_output_modalities) ? v.supported_output_modalities : null
  if (input?.length && output?.length) return `${input.join('+')} → ${output.join('+')}`
  const extras = []
  if (v.supports_vision) extras.push('image')
  if (v.supports_audio_input) extras.push('audio')
  if (v.supports_pdf_input) extras.push('pdf')
  return extras.length ? `text+${extras.join('+')} → text` : 'text → text'
}

const PRETTY_ACRONYMS = new Set([
  'gpt', 'glm', 'llm', 'vl', 'ocr', 'tts', 'stt', 'moe', 'fp8', 'fp16', 'bf16',
  'awq', 'gguf', 'api', 'mcp', 'omni', 'r1', 'vl', 'id',
])

function prettifyModelId(base) {
  return String(base || '')
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => {
      if (PRETTY_ACRONYMS.has(part.toLowerCase())) return part.toUpperCase()
      if (/^\d+(?:\.\d+)*$/.test(part)) return part
      if (/^v\d+$/i.test(part)) return part.toUpperCase()
      return part.charAt(0).toUpperCase() + part.slice(1)
    })
    .join(' ')
}

function buildRankedModels(boards, catalog) {
  const catalogLookup = new Map()
  for (const entry of catalog) {
    for (const variant of variantFamily(entry.base)) {
      if (!catalogLookup.has(variant)) catalogLookup.set(variant, entry)
    }
  }

  const metricBoard = { intelligence: 'text', coding: 'webdev', agentic: 'agent' }
  const merged = new Map()
  for (const [metric, boardId] of Object.entries(metricBoard)) {
    const board = boards.find((item) => item.id === boardId)
    const overall = board?.categories.find((category) => category.id === 'overall')
    for (const row of overall?.models ?? []) {
      const name = cleanArenaName(row.name)
      if (!name) continue
      const key = `${row.vendor}|${normKey(name)}`
      const current = merged.get(key) || {
        name,
        vendor: row.vendor,
        region: row.region,
        license: row.license,
        intelligence: null,
        coding: null,
        agentic: null,
      }
      const score = roundTo(row.score, metric === 'agentic' ? 4 : 2)
      if (score !== null && (current[metric] === null || score > current[metric])) current[metric] = score
      if (!current.license && row.license) current.license = row.license
      merged.set(key, current)
    }
  }

  const models = [...merged.values()]
  for (const metric of ['intelligence', 'coding', 'agentic']) {
    models
      .filter((model) => typeof model[metric] === 'number')
      .sort((a, b) => b[metric] - a[metric])
      .forEach((model, index) => {
        model[`rank_${metric}`] = index + 1
      })
  }

  for (const model of models) {
    let matched = null
    for (const variant of variantFamily(model.name)) {
      const found = catalogLookup.get(variant)
      if (found) {
        matched = found
        break
      }
    }
    const input = matched ? perMillion(matched.v.input_cost_per_token) : null
    const output = matched ? perMillion(matched.v.output_cost_per_token) : null
    model.apiId = matched?.id || null
    model.context = matched ? toNumber(matched.v.max_input_tokens) ?? toNumber(matched.v.max_tokens) : null
    model.maxOutput = matched ? toNumber(matched.v.max_output_tokens) : null
    model.input = input
    model.output = output
    model.cacheRead = matched ? perMillion(matched.v.cache_read_input_token_cost) : null
    model.cacheWrite = matched ? perMillion(matched.v.cache_creation_input_token_cost) : null
    model.openWeights = isOpenLicense(model.license) || (matched ? looksOpenWeights(matched.base) : false)
    model.free = input === 0 && output === 0
    model.blended = input !== null && output !== null
      ? Number((((input * 3) + output) / 4).toFixed(4))
      : null
    model.url = matched?.v.source || LMARENA.url
    model.source = matched ? 'LMArena + LiteLLM' : 'LMArena'
    delete model.license
  }

  models.sort((a, b) => {
    const scoreA = a.intelligence ?? -Infinity
    const scoreB = b.intelligence ?? -Infinity
    if (scoreB !== scoreA) return scoreB - scoreA
    const codeA = a.coding ?? -Infinity
    const codeB = b.coding ?? -Infinity
    if (codeB !== codeA) return codeB - codeA
    return (b.agentic ?? -Infinity) - (a.agentic ?? -Infinity)
  })

  return models
}

function buildApiModels(catalog, rankedModels) {
  const rankedLookup = new Map()
  for (const model of rankedModels) {
    for (const variant of variantFamily(model.name)) {
      if (!rankedLookup.has(variant)) rankedLookup.set(variant, model)
    }
  }

  const models = catalog.map((entry) => {
    let matched = null
    for (const variant of variantFamily(entry.base)) {
      const found = rankedLookup.get(variant)
      if (found) {
        matched = found
        break
      }
    }
    const vendor = matched?.vendor || catalogVendor(entry.base, entry.provider).name
    const region = matched?.region || catalogVendor(entry.base, entry.provider).region
    const input = perMillion(entry.v.input_cost_per_token)
    const output = perMillion(entry.v.output_cost_per_token)
    return {
      id: entry.id,
      name: matched?.name || prettifyModelId(entry.base),
      vendor,
      region,
      provider: entry.provider,
      created: null,
      context: toNumber(entry.v.max_input_tokens) ?? toNumber(entry.v.max_tokens),
      maxOutput: toNumber(entry.v.max_output_tokens),
      input,
      output,
      cacheRead: perMillion(entry.v.cache_read_input_token_cost),
      cacheWrite: perMillion(entry.v.cache_creation_input_token_cost),
      modalities: modalityString(entry.v),
      openWeights: Boolean(matched?.openWeights) || looksOpenWeights(entry.base),
      tools: entry.v.supports_function_calling === true,
      reasoning: entry.v.supports_reasoning === true,
      free: input === 0 && output === 0,
      url: entry.v.source || LITELLM_PAGE,
      blended: input !== null && output !== null
        ? Number((((input * 3) + output) / 4).toFixed(4))
        : null,
      intelligence: matched?.intelligence ?? null,
      coding: matched?.coding ?? null,
      agentic: matched?.agentic ?? null,
      arenaName: matched?.name || null,
      arenaRankIntelligence: matched?.rank_intelligence ?? null,
      arenaRankCoding: matched?.rank_coding ?? null,
      arenaRankAgentic: matched?.rank_agentic ?? null,
    }
  })

  models.sort((a, b) => {
    const scoreA = a.intelligence ?? -Infinity
    const scoreB = b.intelligence ?? -Infinity
    if (scoreB !== scoreA) return scoreB - scoreA
    return (b.created || 0) - (a.created || 0)
  })
  return models
}

function pelicanDisplayName(id) {
  if (PELICAN_MODEL_NAMES[id]) return PELICAN_MODEL_NAMES[id]
  return String(id).split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function captionBirds(caption) {
  const text = String(caption || '').toLowerCase()
  return Object.keys(BIRD_LABELS).filter((word) => {
    const plural = new RegExp(`\\b${word}s?\\b`, 'i')
    if (plural.test(text)) return true
    return word === 'goose' && /\bgeese\b/i.test(text)
  })
}

function topBird(counter) {
  let best = null
  for (const [key, count] of counter) {
    if (!best || count > best.count) best = { key, count }
  }
  return best
}

function normalizePelican(rows, publishedAt) {
  const byModel = new Map()
  const overallAlternatives = new Map()
  let pelicanCount = 0

  for (const row of rows) {
    const model = String(row.model || 'Unknown')
    const reward = toNumber(row.reward) ?? 0
    const item = byModel.get(model) || {
      model,
      access: row.access === 'open' ? 'open' : 'closed',
      samples: 0,
      reward: 0,
      structure: 0,
      semantic: 0,
      perfect: 0,
      pelican: 0,
      alternatives: new Map(),
    }
    item.samples += 1
    item.reward += reward
    item.structure += toNumber(row.structure_score) ?? 0
    item.semantic += toNumber(row.semantic_score) ?? 0
    if (reward >= 0.999) item.perfect += 1

    const birds = captionBirds(row.judge_blind_caption)
    if (birds.includes('pelican')) {
      item.pelican += 1
      pelicanCount += 1
    }
    for (const bird of birds) {
      if (bird === 'pelican') continue
      item.alternatives.set(bird, (item.alternatives.get(bird) || 0) + 1)
      overallAlternatives.set(bird, (overallAlternatives.get(bird) || 0) + 1)
    }
    byModel.set(model, item)
  }

  const models = [...byModel.values()]
    .map((item) => {
      const alternative = topBird(item.alternatives)
      return {
        model: item.model,
        displayName: pelicanDisplayName(item.model),
        access: item.access,
        samples: item.samples,
        meanReward: Number((item.reward / item.samples).toFixed(3)),
        structure: Number((item.structure / item.samples).toFixed(3)),
        semantic: Number((item.semantic / item.samples).toFixed(3)),
        perfect: item.perfect,
        pelicanRate: Number((item.pelican / item.samples).toFixed(3)),
        topAlt: alternative ? BIRD_LABELS[alternative.key] : null,
        topAltCount: alternative ? alternative.count : 0,
      }
    })
    .sort((a, b) => b.meanReward - a.meanReward)

  const rewards = rows.map((row) => toNumber(row.reward) ?? 0).sort((a, b) => a - b)
  const middle = Math.floor(rewards.length / 2)
  const median = rewards.length
    ? (rewards.length % 2 ? rewards[middle] : (rewards[middle - 1] + rewards[middle]) / 2)
    : 0
  const specificAlternatives = new Map(
    [...overallAlternatives].filter(([key]) => key !== 'bird'),
  )
  const overallAlternative = topBird(specificAlternatives) || topBird(overallAlternatives)
  const total = rows.length
  const insight = total
    ? `${total} 次绘制中，只有 ${((pelicanCount / total) * 100).toFixed(1)}% 被盲评直接认成鹈鹕${overallAlternative ? `；其余最常被认成「${BIRD_LABELS[overallAlternative.key]}」` : ''}。`
    : '暂无鹈鹕评测数据。'

  return {
    models,
    coverage: {
      samples: total,
      minReward: Number((rewards[0] ?? 0).toFixed(3)),
      medianReward: Number(median.toFixed(3)),
      maxReward: Number((rewards[rewards.length - 1] ?? 0).toFixed(3)),
      pelicanRate: total ? Number((pelicanCount / total).toFixed(3)) : 0,
    },
    insight,
    publishedAt,
  }
}

function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return null
  return Number(value.toFixed(digits))
}

function computeNextRefresh(now) {
  const offset = 8 * 60 * 60 * 1000
  const chinaNow = new Date(now.getTime() + offset)
  let target = Date.UTC(
    chinaNow.getUTCFullYear(),
    chinaNow.getUTCMonth(),
    chinaNow.getUTCDate(),
    6,
    10,
    0,
  )
  if (chinaNow.getTime() >= target) target += 24 * 60 * 60 * 1000
  return new Date(target - offset).toISOString()
}

async function loadFx() {
  for (const [source, status] of [[SOURCES.fx, 'ok'], [SOURCES.fxFallback, 'fallback']]) {
    const result = await fetchSource(source, { json: true, minLength: 40 })
    if (!result.text) continue
    try {
      const data = JSON.parse(result.text)
      const cny = toNumber(data.rates?.CNY)
      if (cny) {
        return {
          rate: Number(cny.toFixed(4)),
          source: new URL(source.url).hostname,
          date: data.date || new Date().toISOString(),
          status: result.status === 'cached' ? 'cached' : status,
        }
      }
    } catch {
      // try the next source
    }
  }
  return { rate: 7.1, source: 'fallback', date: new Date().toISOString(), status: 'fallback' }
}

function sourceStatus(id, name, url, result, note) {
  return {
    id,
    name,
    url,
    status: result.status,
    checkedAt: result.fetchedAt,
    note: result.error ? `抓取异常，使用最近缓存：${result.error}` : note,
  }
}

async function main() {
  await loadLocalEnv()
  await fs.mkdir(OUT_DIR, { recursive: true })
  await fs.mkdir(CACHE_DIR, { recursive: true })

  const [litellmResult, fx, pelicanResult, pelicanMetaResult, ...lmarenaFetches] = await Promise.all([
    fetchSource(SOURCES.litellm, { json: true }),
    loadFx(),
    fetchSource(SOURCES.pelican),
    fetchSource(SOURCES.pelicanMeta, { json: true }),
    ...LMARENA.boards.map((board) => fetchBinarySource({
      ...board,
      url: `${LMARENA.base}/${board.file}`,
    })),
  ])

  const lmarenaEntries = await Promise.all(LMARENA.boards.map(async (board, index) => {
    const result = lmarenaFetches[index]
    if (!result.buffer) return { id: board.id, board, rows: [], result }
    try {
      const rows = await parquetReadObjects({
        file: toArrayBuffer(result.buffer),
        compressors,
      })
      return { id: board.id, board, rows, result }
    } catch (error) {
      console.error(`LMArena ${board.id} parse failed:`, error.message)
      return {
        id: board.id,
        board,
        rows: [],
        result: { ...result, status: 'error', error: error.message },
      }
    }
  }))
  const arenaBoards = lmarenaEntries
    .map((entry) => normalizeArenaBoard(entry.board, entry.rows))
    .filter((board) => board.categories.length > 0)
  const lmarenaResult = aggregateResults(lmarenaEntries.map((entry) => ({
    id: entry.id,
    status: entry.result.status,
    error: entry.result.error,
  })))

  let litellmRaw = {}
  if (litellmResult.text) {
    try {
      litellmRaw = JSON.parse(litellmResult.text)
    } catch (error) {
      console.error('LiteLLM parse failed:', error.message)
    }
  }
  const catalog = buildCatalog(litellmRaw)
  const rankedModels = buildRankedModels(arenaBoards, catalog)
  const apiModels = buildApiModels(catalog, rankedModels)

  let pelicanRows = []
  if (pelicanResult.text) {
    pelicanRows = pelicanResult.text
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line)
        } catch {
          return null
        }
      })
      .filter(Boolean)
  }
  let pelicanPublishedAt = null
  if (pelicanMetaResult.text) {
    try {
      pelicanPublishedAt = String(JSON.parse(pelicanMetaResult.text).lastModified || '').slice(0, 10) || null
    } catch {
      // metadata is optional
    }
  }
  const pelican = normalizePelican(pelicanRows, pelicanPublishedAt)

  const plansRaw = JSON.parse(await fs.readFile(PLAN_FILE, 'utf8'))
  const plans = plansRaw.plans

  const now = new Date()
  const domesticModels = rankedModels.filter((model) => model.region === 'domestic')
  const globalModels = rankedModels.filter((model) => model.region === 'global')
  const pricedApi = apiModels.filter((model) => model.output !== null)
  const medianOutput = pricedApi.length
    ? [...pricedApi].sort((a, b) => a.output - b.output)[Math.floor(pricedApi.length / 2)].output
    : null
  const cheapestPlan = plans
    .filter((plan) => plan.region === 'domestic' && plan.fromPrice > 0)
    .sort((a, b) => a.fromPrice - b.fromPrice)[0] || null

  const topModel = [...rankedModels]
    .filter((model) => model.intelligence !== null)
    .sort((a, b) => b.intelligence - a.intelligence)[0] || null

  const textOverall = arenaBoards
    .find((board) => board.id === 'text')
    ?.categories.find((category) => category.id === 'overall')
  const arenaModelCount = rankedModels.filter((model) => model.intelligence !== null).length

  const arenaData = {
    generatedAt: now.toISOString(),
    source: {
      name: LMARENA.name,
      url: LMARENA.url,
      license: LMARENA.license,
      note: '通过 hf-mirror 抓取 text / webdev / agent 三个 latest 榜单；保留榜期、95% 置信区间与票数。',
    },
    boards: arenaBoards,
  }

  const pelicanData = {
    generatedAt: now.toISOString(),
    publishedAt: pelican.publishedAt,
    source: {
      name: PELICAN.name,
      url: PELICAN.url,
      license: PELICAN.license,
      note: '139 个 SVG 样本，7 个模型 × 约 20 次；含结构检查、视觉裁判与盲评 caption。',
    },
    scoring: 'reward = 0.35 × structure + 0.65 × semantic；structure 为 7 项确定性几何检查通过率，semantic 为视觉裁判分。',
    insight: pelican.insight,
    models: pelican.models,
    coverage: pelican.coverage,
    jetty: null,
    links: [
      {
        name: 'Jetty Pelican Benchmark',
        url: 'https://evaljetty.com/pelicans/',
        note: '独立视觉裁判榜，口径与 HuggingFace 数据集不同；仅外链，不抓取其评分明细。',
      },
      {
        name: 'TeamoRouter 鹈鹕测试',
        url: 'https://teamorouter.cn/zh/pelican-benchmark',
        note: '4 个模型每 30 分钟生成一次；仅外链，不抓取 API。',
      },
      {
        name: 'Simon Willison · Pelican 标签',
        url: 'https://simonwillison.net/tags/pelican-riding-a-bicycle/',
        note: '鹈鹕测试的原始来源与长期记录。',
      },
      {
        name: 'sergiopaniego/pelican-svg-drawings',
        url: PELICAN.url,
        note: '本页统计所用数据集，Apache-2.0。',
      },
    ],
  }

  const arenaDates = arenaBoards.map((board) => board.date).filter(Boolean).sort()
  const upstreamDate = arenaDates[arenaDates.length - 1] || null

  const meta = {
    generatedAt: now.toISOString(),
    nextRefreshAt: computeNextRefresh(now),
    timezone: 'Asia/Shanghai',
    upstreamUpdatedAt: upstreamDate ? new Date(`${upstreamDate}T00:00:00Z`).toISOString() : null,
    fx: {
      usdCny: fx.rate,
      source: fx.source,
      date: fx.date,
      status: fx.status,
    },
    stats: {
      rankedModels: rankedModels.length,
      apiModels: apiModels.length,
      plans: plans.length,
      vendors: new Set(rankedModels.map((model) => model.vendor)).size,
      domesticModels: domesticModels.length,
      globalModels: globalModels.length,
      openWeights: rankedModels.filter((model) => model.openWeights).length,
      freeApiModels: apiModels.filter((model) => model.free).length,
      medianOutputPrice: formatNumber(medianOutput, 4),
      cheapestDomesticPlan: cheapestPlan ? {
        product: cheapestPlan.product,
        price: cheapestPlan.fromPrice,
        currency: cheapestPlan.currency,
      } : null,
      topModel: topModel ? {
        name: topModel.name,
        vendor: topModel.vendor,
        score: topModel.intelligence,
      } : null,
      platformVendors: new Set(plans.map((plan) => plan.vendor)).size,
      arenaModels: arenaModelCount,
      pelicanModels: pelicanData.models.length,
      pelicanSamples: pelicanData.coverage.samples,
    },
    sources: [
      sourceStatus('lmarena', LMARENA.name, LMARENA.url, lmarenaResult, '文本 / 代码 / Agent 三个社区盲测榜；CC BY 4.0；经 HF 镜像抓取'),
      sourceStatus('litellm', SOURCES.litellm.name, LITELLM_PAGE, litellmResult, '单模型公开标价、上下文、模态与工具能力；MIT；按模型去重'),
      sourceStatus('fx', 'USD → CNY 汇率', SOURCES.fx.url, { status: fx.status, fetchedAt: now.toISOString(), error: null }, `1 USD ≈ ${fx.rate} CNY（${fx.source}，ECB 参考汇率）`),
      sourceStatus('pelican', PELICAN.name, PELICAN.url, pelicanResult, '7 个模型 × 约 20 次鹈鹕 SVG；Apache-2.0'),
      {
        id: 'plans',
        name: 'Coding 套餐人工核对',
        url: '',
        status: 'curated',
        checkedAt: plansRaw.verifiedAt,
        note: '基于厂商官方定价页与公开横评逐项核对，促销价单独标注',
      },
    ],
    disclaimer: '排名来自 LMArena 社区盲测（CC BY 4.0），API 标价来自 LiteLLM 开放价格库（MIT），汇率来自 Frankfurter / ECB，鹈鹕测试来自 HuggingFace 数据集（Apache-2.0），Coding 套餐为人工核对。不同榜单口径不可直接混排，价格与权益可能随时调整，购买前请以厂商官方页面为准。',
  }

  const payload = {
    generatedAt: meta.generatedAt,
    models: rankedModels,
    apiModels,
  }

  await fs.writeFile(path.join(OUT_DIR, 'models.json'), JSON.stringify(payload))
  await fs.writeFile(path.join(OUT_DIR, 'plans.json'), JSON.stringify({
    generatedAt: meta.generatedAt,
    verifiedAt: plansRaw.verifiedAt,
    note: plansRaw.note,
    plans,
  }))
  await fs.writeFile(path.join(OUT_DIR, 'meta.json'), JSON.stringify(meta, null, 2))
  await fs.writeFile(path.join(OUT_DIR, 'lmarena.json'), JSON.stringify(arenaData))
  await fs.writeFile(path.join(OUT_DIR, 'pelican.json'), JSON.stringify(pelicanData))

  const distData = path.join(ROOT, 'dist', 'data')
  try {
    await fs.access(path.join(ROOT, 'dist'))
    await fs.mkdir(distData, { recursive: true })
    for (const file of ['models.json', 'plans.json', 'meta.json', 'lmarena.json', 'pelican.json']) {
      await fs.copyFile(path.join(OUT_DIR, file), path.join(distData, file))
    }
  } catch {
    // dist does not exist yet
  }

  console.log(JSON.stringify({
    generatedAt: meta.generatedAt,
    models: rankedModels.length,
    apiModels: apiModels.length,
    plans: plans.length,
    domestic: domesticModels.length,
    global: globalModels.length,
    arenaModels: arenaModelCount,
    arenaBoards: arenaBoards.length,
    pelicanModels: pelicanData.models.length,
    pelicanSamples: pelicanData.coverage.samples,
    fx: meta.fx,
    sources: meta.sources.map((source) => `${source.id}:${source.status}`),
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

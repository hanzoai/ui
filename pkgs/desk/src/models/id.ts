/**
 * HOW A MODEL ID IS SHAPED, and what a lab is called.
 *
 * A model id is `org/slug`, or a bare slug for one of ours. That is the whole
 * subject of this file: three pure functions over a string, and the two tables
 * they read.
 *
 * IT IS NOT A CATALOGUE, and the difference decides which package it lives in.
 * Which models exist is a question for the gateway — `@hanzo/ai` answers it,
 * live and scoped to the reader's organization. What a name MEANS is known
 * without asking anyone, so it is a table, and a table shipped beside the
 * catalogue is a snapshot of the catalogue that goes stale. Nothing here reads
 * the network and nothing here needs to.
 */

export function getOrgAndSlug(modelId: string): { org: string; slug: string } {
  if (modelId.includes('/')) {
    const [org, ...rest] = modelId.split('/')
    return { org, slug: rest.join('/') }
  }
  return { org: 'hanzo', slug: modelId }
}

// Some labs reach the gateway under two namespaces — `meta-llama` and `meta`,
// `bytedance-seed` and `bytedance` — and a leading `~` marks a latest-alias
// namespace of a lab already present. Fold them onto one canonical org so a lab
// is one lab.
//
// `ProviderMark`'s OF map folds these same two namespaces for the mark, and its
// other rows are a different question — a mark's slug, not a lab's name, which
// is why `anthropic` appears there as `claude` and cannot appear here. The two
// rows they share are pinned by `id.test.ts` so they cannot drift apart.
const ORG_ALIASES: Record<string, string> = {
  'meta-llama': 'meta',
  'bytedance-seed': 'bytedance',
}

export function canonicalOrg(org?: string): string {
  if (!org) return 'hanzo'
  const base = org.replace(/^~/, '')
  // Own rows only. A plain object answers `toString` and `constructor` from the
  // prototype, and a namespace is a string off the wire, so a plain lookup hands
  // back a function where the signature promises a name.
  return Object.hasOwn(ORG_ALIASES, base) ? ORG_ALIASES[base] : base
}

/** What a lab is called, where its namespace is not already its name. */
const ORG_DISPLAY_NAMES: Record<string, string> = {
  hanzo: 'Hanzo',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  'meta-llama': 'Meta',
  'x-ai': 'xAI',
  mistralai: 'Mistral',
  deepseek: 'DeepSeek',
  qwen: 'Qwen',
  nvidia: 'NVIDIA',
  'z-ai': 'Z.ai',
  'arcee-ai': 'Arcee AI',
  minimax: 'Minimax',
  allenai: 'Allen AI',
  nousresearch: 'Nous Research',
  liquid: 'Liquid AI',
  moonshotai: 'Moonshot AI',
  amazon: 'Amazon',
  perplexity: 'Perplexity',
  baidu: 'Baidu',
  cohere: 'Cohere',
  'bytedance-seed': 'ByteDance Seed',
  openrouter: 'OpenRouter',
  microsoft: 'Microsoft',
  inflection: 'Inflection',
  sao10k: 'Sao10K',
  'aion-labs': 'Aion Labs',
  thedrummer: 'TheDrummer',
  stepfun: 'StepFun',
  relace: 'Relace',
  morph: 'Morph',
  inception: 'Inception',
  neversleep: 'NeverSleep',
  upstage: 'Upstage',
  writer: 'Writer',
  xiaomi: 'Xiaomi',
  'nex-agi': 'Nex-AGI',
  essentialai: 'EssentialAI',
  'prime-intellect': 'Prime Intellect',
  deepcogito: 'DeepCogito',
  kwaipilot: 'KwaiPilot',
  'ibm-granite': 'IBM Granite',
  alibaba: 'Alibaba',
  opengvlab: 'OpenGVLab',
  meituan: 'Meituan',
  ai21: 'AI21',
  bytedance: 'ByteDance',
  switchpoint: 'Switchpoint',
  cognitivecomputations: 'Cognitive Computations',
  tencent: 'Tencent',
  tngtech: 'TNG Tech',
  eleutherai: 'EleutherAI',
  alfredpros: 'AlfredPros',
  raifle: 'Raifle',
  'anthracite-org': 'Anthracite',
  alpindale: 'Alpindale',
  mancer: 'Mancer',
  undi95: 'Undi95',
  gryphe: 'Gryphe',
  meta: 'Meta',
  inclusionai: 'inclusionAI',
  thinkingmachines: 'Thinking Machines',
  rekaai: 'Reka AI',
  sakana: 'Sakana AI',
  perceptron: 'Perceptron',
}

export function orgDisplayName(org?: string): string {
  if (!org) return 'Hanzo'
  return Object.hasOwn(ORG_DISPLAY_NAMES, org) ? ORG_DISPLAY_NAMES[org] : org
}

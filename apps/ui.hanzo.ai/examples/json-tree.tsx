import { JsonTree } from "@hanzo/ui"

const RESPONSE = {
  id: "dec_8f2c",
  model: "kai",
  answers: {
    team: {
      type: "choice",
      choice: "infrastructure",
      confidence: 0.94,
      probabilities: { infrastructure: 0.94, billing: 0.02, developer_support: 0.04 },
    },
    critical: { type: "noul", noul: 0.88, confidence: 0.91 },
  },
  usage: { input_tokens: 61, output_tokens: 0 },
  latency_ms: 18.4,
}

/** Default — two levels open, the rest behind a count, with Expand all, Collapse all and Copy. */
export function Default() {
  return <JsonTree data={RESPONSE} title="Response" />
}

/** Closed — `depth={0}` starts with only the root row. */
export function Closed() {
  return <JsonTree data={RESPONSE} depth={0} />
}

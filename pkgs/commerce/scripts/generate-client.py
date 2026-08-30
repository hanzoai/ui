"""Write @hanzo/commerce/client from the document that describes the API.

The hand-written client had drifted: eleven of its twenty-six addresses did not
exist, and nothing said so until a call returned a 404 in production. A client
derived from the document cannot drift — an address that is renamed upstream
renames here, and one that is removed stops compiling.

One method per operation, named by its operationId, because that id is the API's
own name for the operation and is what every other generated client in this
estate uses. Path parameters are positional in the order the path names them;
query and body arrive together in one options object, so a call site reads as
the request it makes.
"""
import json, pathlib, re
import yaml

S = pathlib.Path('/home/z/.cache/go-tmp/claude-1000/-home-z-work-lux/ff17b0af-81f5-40f6-b5b6-b3972efbcb9a/scratchpad')
ops = json.loads((S / 'ops.json').read_text())
_doc = yaml.safe_load(pathlib.Path('/home/z/work/hanzo/cloud/openapi.yaml').read_text())
SCHEMAS = (_doc.get('components') or {}).get('schemas') or {}
PRIM = {'string': 'string', 'integer': 'number', 'number': 'number', 'boolean': 'boolean'}


def shape(s, depth=0):
    """A schema as TypeScript. Names a $ref rather than inlining it, so one
    definition serves every operation that answers with it."""
    if not isinstance(s, dict):
        return 'unknown'
    if '$ref' in s:
        return s['$ref'].rsplit('/', 1)[-1]
    if s.get('type') == 'array':
        return shape(s.get('items') or {}, depth) + '[]'
    if s.get('type') == 'object' or 'properties' in s:
        props = s.get('properties') or {}
        if not props:
            return 'Record<string, unknown>'
        req = set(s.get('required') or [])
        pad = '  ' * (depth + 1)
        rows = ''.join(f'{pad}{k}{"" if k in req else "?"}: {shape(v, depth + 1)}\n' for k, v in props.items())
        return '{\n' + rows + '  ' * depth + '}'
    if s.get('enum'):
        return ' | '.join(json.dumps(e) for e in s['enum'])
    return PRIM.get(s.get('type'), 'unknown')


def types(roots):
    """Each named type and everything it names, so nothing dangles."""
    seen, queue, out = set(), list(roots), []
    while queue:
        name = queue.pop(0)
        if name in seen or name not in SCHEMAS:
            continue
        seen.add(name)
        body = shape(SCHEMAS[name])
        out.append(f'/** From the document. */\nexport interface {name} {body}\n')
        queue += [n for n in re.findall(r'\b([A-Z]\w+)\b', body) if n in SCHEMAS and n not in seen]
    return '\n'.join(out)


def camel(s: str) -> str:
    parts = [p for p in re.split(r'[_\-/]', s) if p]
    return parts[0] + ''.join(p[:1].upper() + p[1:] for p in parts[1:])


def args(path: str):
    return re.findall(r'\{([^}]+)\}', path)


def render(o):
    name = camel(o['id'])
    ps = args(o['path'])
    sig = [f'{camel(p)}: string' for p in ps]
    q = [x for x in o['params'] if x.get('in') == 'query']
    opts = []
    if q:
        opts.append('query?: Record<string, string | number | boolean | undefined>')
    if o['body']:
        opts.append('body?: unknown')
    opts.append('token?: string')
    opts.append('headers?: Record<string, string>')
    sig.append('opts: { ' + '; '.join(opts) + ' } = {}')

    lit = o['path']
    for p in ps:
        lit = lit.replace('{' + p + '}', '${encodeURIComponent(' + camel(p) + ')}')

    doc = o['summary'] or f"{o['method'].upper()} {o['path']}"
    return (
        f'  /** {doc} */\n'
        f'  {name}<T = unknown>({", ".join(sig)}): Promise<T> {{\n'
        f'    return this.request<T>({o["method"].upper()!r}, `{lit}`, opts)\n'
        f'  }}\n'
    )


HEAD = '''/**
 * @hanzo/commerce/client — the Commerce and Billing API, as the document
 * describes it.
 *
 * GENERATED from `cloud/openapi.yaml`. Do not hand-edit: a method here exists
 * because an operation exists, and it is named by that operation's own id. The
 * previous client was written by hand and eleven of its twenty-six addresses had
 * stopped existing, which nothing reported until a call 404'd.
 *
 * Two surfaces, orthogonal and both here because a store needs both: `commerce`
 * is the storefront — cart, catalog, product, variant, discount, store — and
 * `billing` is the ledger — balance, credits, invoices, methods, subscriptions,
 * usage. They share one noun, `plans`.
 *
 *   const commerce = new Commerce({ baseUrl: 'https://api.hanzo.ai', token })
 *   const balance = await commerce.getBillingBalance()
 */

/** Where to reach the API, and as whom. */
export interface CommerceClientConfig {
  baseUrl?: string
  token?: string
  /** Milliseconds before a request is abandoned. Default 30s. */
  timeoutMs?: number
}

/**
 * A refusal, carrying what the service said about it.
 *
 * RFC 9457 problem documents are what this API answers with, so `detail` is the
 * member to read; `status` is the code. The raw body is kept because a problem
 * document may carry extension members this class does not name.
 */
export class CommerceApiError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
    readonly body: unknown,
  ) {
    super(detail || `commerce: ${status}`)
    this.name = 'CommerceApiError'
  }
}

export const DEFAULT_BASE_URL = 'https://api.hanzo.ai'

export class Commerce {
  private readonly baseUrl: string
  private token: string | undefined
  private readonly timeoutMs: number

  constructor(config: CommerceClientConfig = {}) {
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\\/$/, '')
    this.token = config.token
    this.timeoutMs = config.timeoutMs ?? 30_000
  }

  /** Use this token from now on — after a sign-in, or a refresh. */
  setToken(token: string): void {
    this.token = token
  }

  /**
   * One request, one place.
   *
   * A per-call token overrides the client's, which is what a server rendering
   * for one user among many needs: the client is shared, the identity is not.
   *
   * Public because a few addresses this API serves are in neither document.
   * Everything the documents DO describe has a method below; reach for this only
   * when nothing there fits, and say why at the call site.
   */
  async request<T>(
    method: string,
    path: string,
    opts: {
      query?: Record<string, string | number | boolean | undefined>
      body?: unknown
      token?: string
      headers?: Record<string, string>
    } = {},
  ): Promise<T> {
    const url = new URL(this.baseUrl + path)
    for (const [k, v] of Object.entries(opts.query ?? {})) {
      if (v !== undefined) url.searchParams.set(k, String(v))
    }

    const token = opts.token ?? this.token
    const timer = AbortSignal.timeout(this.timeoutMs)
    const res = await fetch(url, {
      method,
      signal: timer,
      headers: {
        accept: 'application/json',
        ...(opts.body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...opts.headers,
      },
      ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
    })

    if (res.status === 204) return undefined as T
    const text = await res.text()
    const body = text ? safeJson(text) : undefined

    if (!res.ok) {
      const d = body as { detail?: string; title?: string; msg?: string } | undefined
      throw new CommerceApiError(res.status, d?.detail ?? d?.title ?? d?.msg ?? text.slice(0, 200), body)
    }
    // The /v1 envelope carries the value under `data`; a typed body is itself.
    const env = body as { status?: string; data?: unknown } | undefined
    return (env && typeof env === 'object' && 'data' in env ? env.data : body) as T
  }
'''

TAIL = '''}

/** A body that is not JSON is still evidence; keep it rather than throwing. */
function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

let shared: Commerce | undefined

/**
 * The process-wide client.
 *
 * One instance because the base url and the timeout are properties of the
 * deployment, not of a call. Pass a token per call where the identity varies.
 */
export function hanzoCommerce(config: CommerceClientConfig = {}): Commerce {
  if (!shared) shared = new Commerce(config)
  return shared
}
'''

body = ''.join(render(o) for o in sorted(ops, key=lambda o: (o['path'], o['method'])))
# the types are top-level, so they go before the class opens — appending them
# after HEAD would place them inside its body
out = HEAD.replace(
    'export class Commerce {',
    types(('Transaction', 'Subscription', 'CreditGrant')) + '\nexport class Commerce {',
) + '\n' + body + TAIL
pathlib.Path('/home/z/work/hanzo/ui/pkgs/commerce/client.ts').write_text(out)
print(f'  {len(ops)} operations written; {len(out.splitlines())} lines')

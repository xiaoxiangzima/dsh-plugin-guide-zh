/**
 * Host half of the Plugin Guide bundle.
 *
 * Two routes for the Chinese guide page:
 *  - GET  /api/plugin-guide/data : installed bundles + live skills, each with
 *    the display metadata the shipped UI uses.
 *  - POST /api/plugin-guide/set  : same-origin enable/disable that delegates to
 *    the Plugin Manager's own `setBundleEnabled`.
 *
 * Descriptions that the page has no hand-written Chinese for are translated by
 * the session's default model once and cached on disk, so new plugins and skills
 * become Chinese automatically and later loads cost nothing.
 */

import { createHash } from 'node:crypto'
import { readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const name = 'plugin-guide-zh'

export const inject = ['webServer']

const ROUTE_LIST = '/api/plugin-guide/data'
const ROUTE_TOGGLE = '/api/plugin-guide/set'
const SELF_PACKAGE = 'dsh-plugin-guide-zh'

const CACHE_PATH = join(dirname(fileURLToPath(import.meta.url)), '.zh-cache.json')
const CACHE_LIMIT = 600
const BATCH_LIMIT = 30
const DESCRIPTION_LIMIT = 240

/** Pick the text the running locale should see out of a localized value. */
function pickText(value) {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    for (const key of ['zh', 'zh-CN', 'zh-cn', 'en']) {
      const text = value[key]
      if (typeof text === 'string' && text.length > 0) return text
    }
    for (const text of Object.values(value)) {
      if (typeof text === 'string' && text.length > 0) return text
    }
  }
  return undefined
}

/** Only the page that served the request may change a bundle. */
function isSameOrigin(req) {
  const origin = req.headers.origin
  if (!origin) return true
  const host = req.headers.host
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

function readJson(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new Error('请求体过大'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8').trim()
        resolve(text ? JSON.parse(text) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function projectRows(rows) {
  if (!Array.isArray(rows)) return []
  return rows.map((row) => ({
    rowId: String(row && row.rowId ? row.rowId : ''),
    moduleName: String(row && row.moduleName ? row.moduleName : ''),
    title: pickText(row && row.meta ? row.meta.title : undefined) ?? null,
    description: pickText(row && row.meta ? row.meta.description : undefined) ?? null,
  }))
}

function projectBundle(bundle) {
  if (!bundle || typeof bundle !== 'object') return null
  if (typeof bundle.name !== 'string' || bundle.name.length === 0) return null
  const meta = bundle.meta && typeof bundle.meta === 'object' ? bundle.meta : {}
  return {
    name: bundle.name,
    official: bundle.official === true,
    availability: typeof bundle.availability === 'string' ? bundle.availability : 'unknown',
    version: typeof bundle.version === 'string' ? bundle.version : null,
    enabled: bundle.enabled === true,
    installed: bundle.installed === true,
    source: typeof bundle.source === 'string' ? bundle.source : null,
    title: pickText(meta.title) ?? null,
    description: pickText(meta.description) ?? (typeof bundle.description === 'string' ? bundle.description : null),
    rows: projectRows(bundle.rows),
  }
}

async function projectSkills(ctx, logger) {
  const registry = ctx.get('skills')
  if (!registry || typeof registry.list !== 'function') return []

  const scopes = [undefined]
  const agents = ctx.get('agents')
  if (agents && typeof agents.list === 'function') {
    for (const agent of agents.list()) {
      if (agent && agent.ctx) scopes.push(agent.ctx)
    }
  }

  const merged = new Map()
  for (const scope of scopes) {
    try {
      const summaries = await registry.list(scope ? { scope } : {})
      if (!Array.isArray(summaries)) continue
      for (const skill of summaries) {
        const skillName = skill && typeof skill.name === 'string' ? skill.name : ''
        if (skillName.length === 0 || merged.has(skillName)) continue
        merged.set(skillName, skill)
      }
    } catch (error) {
      const message = error && error.message ? String(error.message) : String(error)
      if (logger && typeof logger.warn === 'function') logger.warn('listing skills failed for a scope: ' + message)
    }
  }

  return [...merged.values()].map((skill) => ({
    name: String(skill.name),
    description: String(skill.description || ''),
    whenToUse: typeof skill.whenToUse === 'string' ? skill.whenToUse : null,
    source: typeof skill.source === 'string' ? skill.source : null,
    userInvocable: !(skill.invocation && skill.invocation.userInvocable === false),
  }))
}

/* ----------------------------------------------------------- translation */

let cachePromise = null

async function loadCache() {
  if (!cachePromise) {
    cachePromise = readFile(CACHE_PATH, 'utf8')
      .then((text) => {
        const parsed = JSON.parse(text)
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
      })
      .catch(() => ({}))
  }
  return cachePromise
}

async function saveCache(cache) {
  const names = Object.keys(cache)
  if (names.length > CACHE_LIMIT) {
    for (const drop of names.slice(0, names.length - CACHE_LIMIT)) delete cache[drop]
  }
  const temporary = CACHE_PATH + '.tmp'
  try {
    await writeFile(temporary, JSON.stringify(cache), 'utf8')
    await rename(temporary, CACHE_PATH)
  } catch {
    // A read-only checkout simply loses the cache; the page still works.
  }
}

function digest(text) {
  return createHash('sha1').update(text).digest('hex').slice(0, 12)
}

function parseTranslation(text) {
  if (typeof text !== 'string') return null
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    const parsed = JSON.parse(text.slice(start, end + 1))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    const out = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string' && value.trim().length > 0) out[key] = value.trim()
    }
    return Object.keys(out).length > 0 ? out : null
  } catch {
    return null
  }
}

function buildPrompt(items) {
  const lines = items.map(
    (item, index) =>
      index +
      1 +
      '. [' +
      item.kind +
      '] ' +
      item.name +
      ': ' +
      String(item.description).replace(/\s+/g, ' ').slice(0, DESCRIPTION_LIMIT),
  )
  return [
    '你在给一个中文界面的插件/技能说明页做翻译。下面每行是“序号. [plugin 或 skill] 名称: 英文描述”。',
    '请为每一项写一句简体中文说明，要求：',
    '1. 说明它“做什么”，不超过 60 个汉字；',
    '2. 保留必要英文专有名词（如 MCP、Cordis、Token），其余用中文；',
    '3. 不要客套、不要引号、不要重复名称；',
    '4. 只输出一个 JSON 对象 {"名称": "中文说明", ...}，不要输出任何其他文字或代码块标记。',
    '',
    ...lines,
  ].join('\n')
}

async function streamOnce(chat, options) {
  let deltaText = ''
  let blockText = ''
  let reasoning = 0
  let chunks = 0
  let finishKind = ''
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 60000)
  try {
    const stream = chat.stream({ ...options, signal: controller.signal })
    for await (const chunk of stream) {
      if (!chunk) continue
      chunks++
      if (chunk.type === 'text-delta' && typeof chunk.text === 'string') deltaText += chunk.text
      if (chunk.type === 'reasoning-delta' && typeof chunk.text === 'string') reasoning += chunk.text.length
      if (chunk.type === 'block-end' && chunk.block && chunk.block.type === 'text' && typeof chunk.block.text === 'string') {
        blockText += chunk.block.text
      }
      if (chunk.type === 'finish') {
        finishKind = chunk.reason && chunk.reason.kind ? String(chunk.reason.kind) : 'unknown'
        if (chunk.reason && chunk.reason.kind === 'error') {
          const failure = chunk.reason.failure || {}
          return { error: '模型调用失败：' + String(failure.code || '') + ' ' + String(failure.message || '') }
        }
        break
      }
    }
  } finally {
    clearTimeout(timer)
  }
  const text = blockText.length > 0 ? blockText : deltaText
  return { text, chunks, finishKind, reasoning }
}

async function translateWithModel(ctx, logger, items) {
  const chat = ctx.get('llm')
  const defaults = ctx.get('agentDefaultModel')
  if (!chat || typeof chat.stream !== 'function') {
    return { error: '没有可用的模型服务（ctx.llm 缺失）' }
  }
  if (!defaults || typeof defaults.currentSelection !== 'function') {
    return { error: '没有默认模型（agentDefaultModel 缺失）' }
  }
  let selection
  try {
    selection = defaults.currentSelection()
  } catch (error) {
    return { error: '读取默认模型失败：' + (error && error.message ? error.message : String(error)) }
  }
  const provider = selection && typeof selection.provider === 'string' ? selection.provider : ''
  const model = selection && typeof selection.model === 'string' ? selection.model : ''
  if (provider.length === 0 || model.length === 0) return { error: '默认模型没有 provider/model' }

  const base = {
    provider,
    model,
    temperature: 0,
    maxTokens: 6000,
    messages: [{ role: 'user', content: [{ type: 'text', text: buildPrompt(items) }] }],
  }
  // The session default model may spend its whole budget on reasoning, so try a
  // low effort first and keep plain / cheap-purpose retries as fallbacks.
  const attempts = [
    { ...base, reasoningEffort: 'low' },
    { ...base },
    { ...base, maxTokens: 8000, purpose: 'session-title' },
  ]

  let lastError = ''
  for (const options of attempts) {
    try {
      const outcome = await streamOnce(chat, options)
      if (outcome.error) {
        lastError = outcome.error
        continue
      }
      const map = parseTranslation(outcome.text)
      if (map) return { map }
      lastError =
        '模型没有返回可解析的 JSON（片段 ' +
        outcome.chunks +
        '，finish=' +
        (outcome.finishKind || '无') +
        '，正文 ' +
        outcome.text.length +
        ' 字，思考 ' +
        outcome.reasoning +
        ' 字）'
    } catch (error) {
      lastError = error && error.message ? String(error.message) : String(error)
    }
  }
  if (logger && typeof logger.warn === 'function') logger.warn('auto translation failed: ' + lastError)
  return { error: lastError || '未知错误' }
}

/** Attach `zh` to every entry, translating the ones the cache does not hold yet. */
async function attachChinese(ctx, logger, bundles, skills) {
  const cache = await loadCache()
  const targets = []
  for (const entry of bundles) {
    if (entry.description && entry.description.length > 0) {
      entry.descriptionHash = digest(entry.description)
      targets.push({ kind: 'plugin', name: entry.name, description: entry.description, entry })
    }
  }
  for (const entry of skills) {
    if (entry.description && entry.description.length > 0) {
      entry.descriptionHash = digest(entry.description)
      targets.push({ kind: 'skill', name: entry.name, description: entry.description, entry })
    }
  }

  const missing = []
  for (const target of targets) {
    const hit = cache[target.name]
    if (hit && hit.h === target.entry.descriptionHash && typeof hit.zh === 'string') {
      target.entry.zh = hit.zh
      continue
    }
    if (missing.length < BATCH_LIMIT) missing.push(target)
  }
  if (missing.length === 0) return { translated: 0, status: 'cached' }

  const outcome = await translateWithModel(ctx, logger, missing)
  if (!outcome || !outcome.map) {
    return { translated: 0, status: 'unavailable', error: outcome && outcome.error ? outcome.error : '未知错误' }
  }
  const translated = outcome.map

  let count = 0
  for (const target of missing) {
    const zh = translated[target.name]
    if (typeof zh !== 'string' || zh.length === 0) continue
    target.entry.zh = zh
    cache[target.name] = { h: target.entry.descriptionHash, zh }
    count++
  }
  if (count > 0) await saveCache(cache)
  return { translated: count, status: count > 0 ? 'translated' : 'empty' }
}

function sendJson(res, status, body) {
  const text = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(text),
    'cache-control': 'no-store',
  })
  res.end(text)
}

export function apply(ctx) {
  const logger = typeof ctx.logger === 'function' ? ctx.logger(name) : undefined

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: ROUTE_LIST,
        handler: async (_req, res) => {
          const manager = ctx.get('pluginManager')
          if (!manager || typeof manager.listBundles !== 'function') {
            sendJson(res, 200, {
              ok: false,
              error: 'plugin-manager 未启用，读不到插件清单',
              bundles: [],
              skills: [],
            })
            return
          }
          try {
            const raw = await manager.listBundles()
            const bundles = Array.isArray(raw) ? raw.map(projectBundle).filter(Boolean) : []
            const skills = await projectSkills(ctx, logger)
            let translation = { translated: 0, status: 'skipped' }
            try {
              translation = await attachChinese(ctx, logger, bundles, skills)
            } catch (error) {
              const message = error && error.message ? String(error.message) : String(error)
              if (logger && typeof logger.warn === 'function') logger.warn('attaching Chinese failed: ' + message)
            }
            sendJson(res, 200, { ok: true, bundles, skills, translation })
          } catch (error) {
            const message = error && error.message ? String(error.message) : String(error)
            if (logger && typeof logger.warn === 'function') logger.warn(`listing bundles failed: ${message}`)
            sendJson(res, 200, { ok: false, error: message, bundles: [], skills: [] })
          }
        },
      }),
    'plugin-guide-zh: list route',
  )

  // TEMPORARY diagnostic: report where a needle appears inside one shipped
  // client bundle. Read-only, bounded to node_modules, removed after use.

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: ROUTE_TOGGLE,
        handler: async (req, res) => {
          if (req.method !== 'POST') {
            sendJson(res, 405, { ok: false, error: '只接受 POST' })
            return
          }
          if (!isSameOrigin(req)) {
            sendJson(res, 403, { ok: false, error: '已拒绝跨站请求' })
            return
          }
          const manager = ctx.get('pluginManager')
          if (!manager || typeof manager.setBundleEnabled !== 'function') {
            sendJson(res, 200, { ok: false, error: 'plugin-manager 未启用，无法切换插件' })
            return
          }
          let body
          try {
            body = await readJson(req)
          } catch (error) {
            sendJson(res, 400, { ok: false, error: '请求格式错误' })
            return
          }
          const target = typeof body.name === 'string' ? body.name : ''
          const enabled = body.enabled === true
          if (target.length === 0) {
            sendJson(res, 400, { ok: false, error: '缺少插件名' })
            return
          }
          if (target === SELF_PACKAGE) {
            sendJson(res, 200, { ok: false, error: '不能在这里停用这个说明页本身' })
            return
          }
          try {
            const bundles = await manager.listBundles()
            const bundle = Array.isArray(bundles) ? bundles.find((item) => item && item.name === target) : undefined
            if (!bundle) {
              sendJson(res, 200, { ok: false, error: `没有找到插件 ${target}` })
              return
            }
            if (bundle.availability !== 'profile') {
              sendJson(res, 200, {
                ok: false,
                error: '这是核心或安装内置的插件，不能在这里停用；需要的话请用「已装管理」或「商店」',
              })
              return
            }
            const result = await manager.setBundleEnabled(target, enabled)
            sendJson(res, 200, {
              ok: true,
              result: {
                changed: result && result.changed === true,
                application: result && typeof result.application === 'string' ? result.application : 'unknown',
                error: result && result.error && result.error.diagnostic ? String(result.error.diagnostic) : null,
                warnings: result && Array.isArray(result.warnings) ? result.warnings.map(String) : [],
              },
            })
          } catch (error) {
            const message = error && error.message ? String(error.message) : String(error)
            if (logger && typeof logger.warn === 'function') logger.warn(`toggling ${target} failed: ${message}`)
            sendJson(res, 200, { ok: false, error: message })
          }
        },
      }),
    'plugin-guide-zh: toggle route',
  )

  if (logger && typeof logger.info === 'function') {
    logger.info(`ready — GET ${ROUTE_LIST}, POST ${ROUTE_TOGGLE}`)
  }
}

/**
 * 脚本公共工具模块
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ── 路径工具 ──

/** 获取调用者脚本所在目录（替代 __dirname） */
export function getDirname(metaUrl: string) {
  return dirname(fileURLToPath(metaUrl))
}

/** 项目 web/ 目录 */
export function getWebRoot(metaUrl: string) {
  return resolve(getDirname(metaUrl), '..')
}

/** web/public/data/ 目录 */
export function getDataDir(metaUrl: string) {
  return resolve(getWebRoot(metaUrl), 'public', 'data')
}

// ── CLI 参数解析 ──

export function parseArgs(): Record<string, string | true> {
  return Object.fromEntries(
    process.argv.slice(2).map(a => {
      const [k, v] = a.replace(/^--/, '').split('=')
      return [k, v ?? true]
    }),
  )
}

// ── 网络请求 ──

export async function fetchWithRetry<T = unknown>(
  url: string,
  options: RequestInit = {},
  retries = 3,
): Promise<T | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options)
      if (res.status === 404 || res.status === 403) return null
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
      return (await res.json()) as T
    } catch (e: any) {
      if (i === retries - 1) throw e
      await sleep(1000 * (i + 1))
    }
  }
  return null
}

/**
 * fetchWithRetry 但返回原始 Response（用于需要检查 headers 等场景）
 */
export async function fetchRawWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
): Promise<Response | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options)
      if (res.status === 404 || res.status === 403) return null
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
      return res
    } catch (e: any) {
      if (i === retries - 1) throw e
      await sleep(1000 * (i + 1))
    }
  }
  return null
}

// ── 文件 I/O ──

export function writeJson(filePath: string, data: unknown, pretty = false) {
  const dir = dirname(filePath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(filePath, pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data))
}

export function readJson<T = unknown>(filePath: string): T | null {
  if (!existsSync(filePath)) return null
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8')) as T
  } catch {
    return null
  }
}

// ── 并发批处理 ──

export async function runBatch<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
  delayMs = 200,
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map(fn))
    results.push(...batchResults)
    if (i + concurrency < items.length && delayMs > 0) {
      await sleep(delayMs)
    }
  }
  return results
}

// ── 杂项 ──

export function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}

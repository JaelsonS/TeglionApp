import { useEffect, useState } from 'react'

const STORAGE_KEY = 'cb-client-news-read'
const READ_CHANGED = 'cb-client-news-read-changed'

function readSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as string[]
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

function writeSet(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
  } catch {
    /* ignore */
  }
}

export function isNewsArticleRead(articleId: string): boolean {
  return readSet().has(articleId)
}

export function markNewsArticleRead(articleId: string) {
  const set = readSet()
  if (!set.has(articleId)) {
    set.add(articleId)
    writeSet(set)
    window.dispatchEvent(new CustomEvent(READ_CHANGED))
  }
}

/** Bump when localStorage read-set changes — keeps unread counters in sync. */
export function useClientNewsReadVersion(): number {
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1)
    window.addEventListener(READ_CHANGED, bump)
    return () => window.removeEventListener(READ_CHANGED, bump)
  }, [])
  return version
}

export function countUnreadNews(articleIds: string[]): number {
  const set = readSet()
  return articleIds.filter((id) => id && !set.has(id)).length
}

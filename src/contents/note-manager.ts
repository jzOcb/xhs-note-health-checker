import type { PlasmoCSConfig } from "plasmo"

import {
  extractSensitiveHits,
  getLevelMeta,
  type LevelHistory,
  type NoteDiagnostics,
  type Snapshot,
  STORAGE_KEYS
} from "~lib/xhs"

export const config: PlasmoCSConfig = {
  matches: ["https://creator.xiaohongshu.com/*"],
  run_at: "document_start",
  world: "MAIN"
}

const TARGET_PATH = "/api/galaxy/v2/creator/note/user/posted"

let latestNotes: NoteDiagnostics[] = []

const styleId = "xhs-health-checker-style"

const ensureStyles = () => {
  if (document.getElementById(styleId)) {
    return
  }

  const style = document.createElement("style")
  style.id = styleId
  style.textContent = `
  .xhs-health-inline { display: inline-flex; align-items: center; gap: 6px; margin-left: 8px; vertical-align: middle; }
  .xhs-health-badge { display: inline-flex; align-items: center; border-radius: 999px; font-size: 12px; line-height: 1; padding: 4px 8px; font-weight: 600; border: 1px solid rgba(0,0,0,.08); }
  .xhs-health-flag { font-size: 14px; line-height: 1; cursor: help; }
  `
  document.documentElement.appendChild(style)
}

const isTargetUrl = (url: string) => {
  try {
    const parsed = new URL(url, window.location.origin)
    return parsed.pathname.includes(TARGET_PATH)
  } catch {
    return url.includes(TARGET_PATH)
  }
}

const extractNoteArray = (payload: any): any[] => {
  const candidates = [
    payload?.data?.notes,
    payload?.data?.note_list,
    payload?.data?.items,
    payload?.data?.list,
    payload?.data?.data?.notes,
    payload?.notes,
    payload?.note_list,
    payload?.items,
    payload?.list
  ]

  for (const item of candidates) {
    if (Array.isArray(item)) {
      return item
    }
  }

  return []
}

const normalizeTagCount = (note: any) => {
  const arrayCandidates = [
    note?.tag_list,
    note?.tags,
    note?.topic_list,
    note?.topics,
    note?.hash_tag_list,
    note?.hashtag_list
  ]

  for (const candidate of arrayCandidates) {
    if (Array.isArray(candidate)) {
      return candidate.length
    }
  }

  const numericCandidates = [note?.tag_count, note?.topic_count, note?.hashtag_count]
  for (const candidate of numericCandidates) {
    if (typeof candidate === "number") {
      return candidate
    }
  }

  return 0
}

const normalizeNotes = (payload: any): NoteDiagnostics[] => {
  const now = Date.now()

  return extractNoteArray(payload)
    .map((note: any) => {
      const noteId = String(
        note?.note_id ?? note?.noteId ?? note?.id ?? note?.item_id ?? note?.display_id ?? ""
      )
      const title = String(note?.title ?? note?.note_title ?? note?.name ?? "").trim()
      const levelValue = Number(note?.level ?? note?.distribution_level ?? note?.status_level ?? NaN)
      const level = Number.isFinite(levelValue) ? levelValue : 1
      const tagCount = normalizeTagCount(note)
      const sensitiveHits = extractSensitiveHits(title)
      const levelMeta = getLevelMeta(level)

      return {
        noteId,
        title,
        level,
        levelLabel: levelMeta.label,
        levelColor: levelMeta.color,
        sensitiveHits,
        tagCount,
        tagWarning: tagCount > 5,
        timestamp: now
      }
    })
    .filter((note) => note.noteId && note.title)
}

const findTitleElement = (note: NoteDiagnostics): HTMLElement | null => {
  const escapedTitle = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(note.title) : note.title

  const idTargets = Array.from(
    document.querySelectorAll<HTMLElement>(
      `a[href*="${note.noteId}"], [data-note-id="${note.noteId}"], [data-id="${note.noteId}"]`
    )
  )

  const idMatch = idTargets.find((node) => (node.textContent || "").includes(note.title))
  if (idMatch) {
    return idMatch
  }

  const exactText = Array.from(document.querySelectorAll<HTMLElement>("h1,h2,h3,h4,a,span,p,div"))
    .filter((el) => {
      const text = (el.textContent || "").trim()
      return text === note.title || text.includes(note.title)
    })
    .sort((a, b) => (a.textContent?.length || 0) - (b.textContent?.length || 0))[0]

  if (exactText) {
    return exactText
  }

  if (escapedTitle) {
    const fallback = document.querySelector<HTMLElement>(`[title="${escapedTitle}"]`)
    if (fallback) {
      return fallback
    }
  }

  return null
}

const removeExisting = (anchor: HTMLElement) => {
  const existing = anchor.parentElement?.querySelectorAll('[data-xhs-health-badge="1"]')
  existing?.forEach((node) => node.remove())
}

const renderBadgeForNote = (note: NoteDiagnostics) => {
  const target = findTitleElement(note)
  if (!target || !target.parentElement) {
    return
  }

  removeExisting(target)

  const meta = getLevelMeta(note.level)

  const wrapper = document.createElement("span")
  wrapper.className = "xhs-health-inline"
  wrapper.dataset.xhsHealthBadge = "1"

  const badge = document.createElement("span")
  badge.className = "xhs-health-badge"
  badge.textContent = meta.label
  badge.style.background = meta.color
  badge.style.color = meta.textColor
  badge.title = `level = ${note.level}（仅供参考，非官方）`
  wrapper.appendChild(badge)

  if (note.sensitiveHits.length > 0) {
    const sensitive = document.createElement("span")
    sensitive.className = "xhs-health-flag"
    sensitive.textContent = "⚠️"
    sensitive.title = `命中敏感词：${note.sensitiveHits.join("、")}`
    wrapper.appendChild(sensitive)
  }

  if (note.tagWarning) {
    const tag = document.createElement("span")
    tag.className = "xhs-health-flag"
    tag.textContent = "📛"
    tag.title = `标签/话题数量 ${note.tagCount}，超过建议上限 5`
    wrapper.appendChild(tag)
  }

  target.insertAdjacentElement("afterend", wrapper)
}

const renderAllBadges = () => {
  ensureStyles()
  latestNotes.forEach(renderBadgeForNote)
}

const updateHistory = (notes: NoteDiagnostics[]) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY)
    const history: LevelHistory = raw ? JSON.parse(raw) : {}

    for (const note of notes) {
      const records = history[note.noteId] || []
      const latest = records[records.length - 1]
      if (!latest || latest.level !== note.level) {
        records.push({ level: note.level, timestamp: note.timestamp })
        history[note.noteId] = records.slice(-60)
      }
    }

    const snapshot: Snapshot = {
      notes,
      updatedAt: Date.now()
    }

    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history))
    localStorage.setItem(STORAGE_KEYS.SNAPSHOT, JSON.stringify(snapshot))
  } catch (error) {
    console.warn("[XHS Health Checker] localStorage update failed:", error)
  }
}

const handlePayload = async (payload: any) => {
  const notes = normalizeNotes(payload)
  if (notes.length === 0) {
    return
  }

  latestNotes = notes
  renderAllBadges()

  try {
    updateHistory(notes)
  } catch (error) {
    console.warn("[XHS Health Checker] storage update failed:", error)
  }
}

const patchFetch = () => {
  const originalFetch = window.fetch

  window.fetch = async (...args) => {
    const response = await originalFetch(...args)

    try {
      const request = args[0]
      const url = typeof request === "string" ? request : request?.url || ""
      if (isTargetUrl(url)) {
        const cloned = response.clone()
        const payload = await cloned.json()
        void handlePayload(payload)
      }
    } catch (error) {
      console.warn("[XHS Health Checker] fetch parse failed:", error)
    }

    return response
  }
}

const patchXhr = () => {
  const originalOpen = XMLHttpRequest.prototype.open

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null
  ) {
    ;(this as any).__xhsHealthUrl = typeof url === "string" ? url : url?.toString() || ""
    return originalOpen.call(this, method, url, async ?? true, username, password)
  }

  const originalSend = XMLHttpRequest.prototype.send

  XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
    this.addEventListener("load", () => {
      const url = (this as any).__xhsHealthUrl || ""
      if (!isTargetUrl(url)) {
        return
      }

      try {
        if (this.responseType === "json") {
          void handlePayload(this.response)
          return
        }

        const raw = this.responseText
        if (!raw) {
          return
        }

        const payload = JSON.parse(raw)
        void handlePayload(payload)
      } catch (error) {
        console.warn("[XHS Health Checker] xhr parse failed:", error)
      }
    })

    return originalSend.call(this, body)
  }
}

const bootstrap = () => {
  patchFetch()
  patchXhr()

  const observer = new MutationObserver(() => {
    if (latestNotes.length > 0) {
      renderAllBadges()
    }
  })

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  })
}

bootstrap()

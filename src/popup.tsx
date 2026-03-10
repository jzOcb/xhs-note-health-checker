import { useEffect, useMemo, useState, type CSSProperties } from "react"

import {
  getLevelMeta,
  LEVEL_HELP,
  type LevelHistory,
  type NoteDiagnostics,
  type Snapshot,
  STORAGE_KEYS
} from "~lib/xhs"

type PopupState = {
  snapshot: Snapshot | null
  history: LevelHistory
}

const containerStyle: CSSProperties = {
  width: 380,
  padding: 14,
  background: "#fafaf9",
  color: "#292524",
  fontFamily:
    "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
}

const cardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e7e5e4",
  borderRadius: 10,
  padding: 10,
  marginTop: 10
}

const titleStyle: CSSProperties = {
  fontSize: 16,
  margin: 0,
  fontWeight: 700
}

const mutedStyle: CSSProperties = {
  fontSize: 12,
  color: "#78716c",
  marginTop: 4
}

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  fontSize: 13,
  padding: "4px 0"
}

const badgeStyle = (level: number): CSSProperties => {
  const meta = getLevelMeta(level)
  return {
    background: meta.color,
    color: meta.textColor,
    borderRadius: 999,
    padding: "2px 8px",
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: "nowrap"
  }
}

const formatTime = (ts: number) => new Date(ts).toLocaleString()

const levelSort = (a: number, b: number) => b - a

function IndexPopup() {
  const [state, setState] = useState<PopupState>({ snapshot: null, history: {} })

  useEffect(() => {
    chrome.storage.local
      .get([STORAGE_KEYS.SNAPSHOT, STORAGE_KEYS.HISTORY])
      .then((result) => {
        setState({
          snapshot: (result?.[STORAGE_KEYS.SNAPSHOT] || null) as Snapshot | null,
          history: (result?.[STORAGE_KEYS.HISTORY] || {}) as LevelHistory
        })
      })
      .catch((error) => {
        console.warn("[XHS Health Checker] popup load failed:", error)
      })
  }, [])

  const notes = state.snapshot?.notes || []

  const levelDistribution = useMemo(() => {
    const map = new Map<number, number>()
    notes.forEach((note) => {
      map.set(note.level, (map.get(note.level) || 0) + 1)
    })
    return Array.from(map.entries()).sort(([a], [b]) => levelSort(a, b))
  }, [notes])

  const limitedNotes = useMemo(() => notes.filter((note) => note.level < 1), [notes])

  const reasonText = (note: NoteDiagnostics) => {
    const reasons = [] as string[]
    if (note.level < 1) {
      reasons.push("level 低于 1")
    }
    if (note.sensitiveHits.length > 0) {
      reasons.push(`敏感词：${note.sensitiveHits.join("、")}`)
    }
    if (note.tagWarning) {
      reasons.push(`标签/话题 ${note.tagCount} 个`) 
    }
    return reasons.join(" | ") || "无明显风险"
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>XHS Note Health Checker</h1>
      <div style={mutedStyle}>level 定义为逆向推断，非官方，仅供参考</div>

      <div style={cardStyle}>
        <div style={{ ...rowStyle, paddingTop: 0 }}>
          <span>总笔记数</span>
          <strong>{notes.length}</strong>
        </div>
        <div style={rowStyle}>
          <span>最后更新</span>
          <span>{state.snapshot ? formatTime(state.snapshot.updatedAt) : "暂无"}</span>
        </div>
      </div>

      <div style={cardStyle}>
        <strong style={{ fontSize: 13 }}>Level 分布</strong>
        {levelDistribution.length === 0 ? (
          <div style={mutedStyle}>尚未在笔记管理页抓到接口响应</div>
        ) : (
          levelDistribution.map(([level, count]) => (
            <div key={level} style={rowStyle}>
              <span style={badgeStyle(level)}>{getLevelMeta(level).label}</span>
              <span>{count}</span>
            </div>
          ))
        )}
      </div>

      <div style={cardStyle}>
        <strong style={{ fontSize: 13 }}>限流笔记（level &lt; 1）</strong>
        {limitedNotes.length === 0 ? (
          <div style={mutedStyle}>未发现限流笔记</div>
        ) : (
          limitedNotes.map((note) => {
            const history = state.history[note.noteId] || []
            return (
              <div key={note.noteId} style={{ marginTop: 8, borderTop: "1px dashed #e7e5e4", paddingTop: 8 }}>
                <div style={{ ...rowStyle, padding: 0 }}>
                  <span style={badgeStyle(note.level)}>{note.levelLabel}</span>
                  <a
                    href={`https://creator.xiaohongshu.com/publish/publish?noteId=${note.noteId}`}
                    target="_blank"
                    rel="noreferrer"
                    title="编辑笔记"
                    style={{ textDecoration: "none", fontSize: 13, cursor: "pointer" }}
                  >
                    ✏️
                  </a>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.35 }}>{note.title}</div>
                <div style={{ ...mutedStyle, marginTop: 2 }}>原因：{reasonText(note)}</div>
                <div style={{ ...mutedStyle, marginTop: 2 }}>
                  {(() => {
                    if (history.length === 0) return "首次检测"
                    const first = history.find((h) => h.level === note.level)
                    if (!first) return `首次检测到 ${note.levelLabel}`
                    const days = Math.floor((Date.now() - first.timestamp) / 86400000)
                    if (days === 0) return "今天首次检测到"
                    return `首次检测于 ${days} 天前`
                  })()}
                </div>
              </div>
            )
          })
        )}
      </div>

      <div style={cardStyle}>
        <strong style={{ fontSize: 13 }}>Level 说明（仅供参考）</strong>
        {LEVEL_HELP.map((line) => (
          <div key={line} style={mutedStyle}>
            {line}
          </div>
        ))}
      </div>
    </div>
  )
}

export default IndexPopup

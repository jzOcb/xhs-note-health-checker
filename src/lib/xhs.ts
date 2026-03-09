export type LevelRecord = {
  level: number
  timestamp: number
}

export type LevelHistory = Record<string, LevelRecord[]>

export type NoteDiagnostics = {
  noteId: string
  title: string
  level: number
  levelLabel: string
  levelColor: string
  sensitiveHits: string[]
  tagCount: number
  tagWarning: boolean
  timestamp: number
}

export type Snapshot = {
  notes: NoteDiagnostics[]
  updatedAt: number
}

export const STORAGE_KEYS = {
  HISTORY: "xhs_level_history",
  SNAPSHOT: "xhs_latest_snapshot"
} as const

export const SENSITIVE_WORDS = [
  "自动化",
  "自动发布",
  "AI生成",
  "内容工厂",
  "批量",
  "全自动",
  "自动工作流",
  "AI自动"
]

// Level definitions are community reverse-engineered and for reference only.
export const LEVEL_HELP = [
  "4: 正常推荐 🟢",
  "2: 基本正常 🟡",
  "1: 新帖初始 ⚪",
  "-1: 轻度限流 🔴",
  "-5: 中度限流 🔴🔴",
  "-102: 严重限流 ⛔（不可逆，需删除重发用全新图片）"
]

export const getLevelMeta = (level: number) => {
  if (level === -102) {
    return { label: "L-102 严重", color: "#2b0a0a", textColor: "#ffe6e6" }
  }

  if (level <= -5) {
    return { label: `L${level} 中度`, color: "#7f1d1d", textColor: "#ffe6e6" }
  }

  if (level === -1) {
    return { label: "L-1 限流", color: "#dc2626", textColor: "#fff1f2" }
  }

  if (level === 1) {
    return { label: "L1 新帖", color: "#facc15", textColor: "#422006" }
  }

  if (level >= 4) {
    return { label: "L4 正常", color: "#166534", textColor: "#ecfdf5" }
  }

  if (level >= 2) {
    return { label: `L${level} 基本`, color: "#86efac", textColor: "#14532d" }
  }

  return { label: `L${level}`, color: "#64748b", textColor: "#f8fafc" }
}

export const extractSensitiveHits = (title: string) => {
  const normalized = title || ""
  return SENSITIVE_WORDS.filter((word) => normalized.includes(word))
}

export const getTrendArrow = (history: LevelRecord[] = []) => {
  if (history.length < 2) {
    return "→"
  }

  const latest = history[history.length - 1]?.level
  const previous = history[history.length - 2]?.level

  if (latest > previous) {
    return "↑"
  }

  if (latest < previous) {
    return "↓"
  }

  return "→"
}

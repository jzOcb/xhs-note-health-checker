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

// 敏感词库 (beta) — 基于社区整理，非官方，持续更新
export const SENSITIVE_WORDS = [
  // AI / 自动化
  "AI生成", "AI自动", "AI创作", "自动化", "自动发布", "自动工作流",
  "全自动", "批量", "内容工厂", "矩阵号",
  // 极限词 / 绝对化
  "最好", "最佳", "最强", "最便宜", "最低价", "全网最低",
  "第一", "NO.1", "TOP1", "唯一", "顶级", "极致", "巅峰",
  "独一无二", "全国第一", "世界级", "国家级",
  // 虚假承诺
  "包过", "稳赚不赔", "零风险", "永久", "万能", "100%",
  // 医疗功效夸大
  "根治", "特效", "一次见效", "立竿见影", "秒变",
  "一洗白", "一抹就瘦", "防脱发", "改善睡眠",
  // 站外引流
  "微信", "加V", "+V", "VX", "wx",
  // 诱导互动
  "互粉", "互关", "求关注", "求点赞", "求收藏", "一键三连",
  // 营销限时
  "秒杀", "抢疯了", "再不抢就没了", "随时涨价",
  // 迷信
  "招财进宝", "旺夫"
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

import type { PlasmoCSConfig } from "plasmo"
import { STORAGE_KEYS } from "~lib/xhs"

export const config: PlasmoCSConfig = {
  matches: ["https://creator.xiaohongshu.com/*"],
  run_at: "document_idle"
}

// Bridge: periodically sync localStorage -> chrome.storage for popup access
const sync = () => {
  try {
    const history = localStorage.getItem(STORAGE_KEYS.HISTORY)
    const snapshot = localStorage.getItem(STORAGE_KEYS.SNAPSHOT)
    
    const data: Record<string, any> = {}
    if (history) data[STORAGE_KEYS.HISTORY] = JSON.parse(history)
    if (snapshot) data[STORAGE_KEYS.SNAPSHOT] = JSON.parse(snapshot)
    
    if (Object.keys(data).length > 0) {
      chrome.storage.local.set(data)
    }
  } catch (e) {
    // silent
  }
}

// Sync every 3 seconds and on page visibility change
setInterval(sync, 3000)
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") sync()
})

// Initial sync after short delay
setTimeout(sync, 1500)

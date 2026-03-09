import type { PlasmoCSConfig } from "plasmo"

// Kept only to neutralize the default scaffold content script.
export const config: PlasmoCSConfig = {
  matches: ["https://invalid.local/*"]
}

export {}

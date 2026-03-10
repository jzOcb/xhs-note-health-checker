#!/usr/bin/env python3
"""Post-build: add note-manager.ts as static MAIN world content script in manifest.json"""
import json, glob, os

manifest_path = os.path.expanduser("~/clawd/xhs-level-checker/build/chrome-mv3-prod/manifest.json")

with open(manifest_path) as f:
    manifest = json.load(f)

# Find the note-manager JS file
build_dir = os.path.dirname(manifest_path)
nm_files = glob.glob(os.path.join(build_dir, "note-manager.*.js"))
if not nm_files:
    print("ERROR: note-manager.*.js not found!")
    exit(1)

nm_filename = os.path.basename(nm_files[0])
print(f"Found: {nm_filename}")

# Check if already added
for cs in manifest.get("content_scripts", []):
    if nm_filename in cs.get("js", []):
        print("Already in manifest, skipping")
        exit(0)

# Add static MAIN world content script
manifest["content_scripts"].append({
    "matches": ["https://creator.xiaohongshu.com/*"],
    "js": [nm_filename],
    "run_at": "document_start",
    "world": "MAIN"
})

with open(manifest_path, "w") as f:
    json.dump(manifest, f)

print(f"Added {nm_filename} as static MAIN world content script")

# Privacy Policy — XHS Note Health Checker

**Last updated:** March 9, 2026

## Overview

XHS Note Health Checker is a Chrome extension that helps Xiaohongshu (小红书) creators monitor the health status of their published notes. This policy explains what data the extension accesses and how it is handled.

## Data Collection

**We do not collect, transmit, or store any personal data on external servers.**

All data processing happens locally in your browser.

## Data Access

The extension accesses the following data **only on `creator.xiaohongshu.com`**:

- **Note metadata**: Title, level status, and tag count from the XHS Creator Dashboard API responses
- **Local storage**: Note health history is stored in your browser's `localStorage` and `chrome.storage.local` for the popup display and historical tracking

## Data Storage

- All data is stored **locally in your browser** using `localStorage` and `chrome.storage.local`
- No data is sent to any external server, analytics service, or third party
- Data can be cleared by removing the extension or clearing browser data

## Permissions

| Permission | Purpose |
|---|---|
| `scripting` | Inject content script to read note health data from the XHS Creator Dashboard |
| `storage` | Store note health history locally for the popup panel |
| `host_permissions: creator.xiaohongshu.com` | Access the XHS Creator Dashboard only |

## Third-Party Services

This extension does not use any third-party services, analytics, or tracking.

## Changes

We may update this policy from time to time. Changes will be posted in the GitHub repository.

## Contact

If you have questions about this privacy policy, please open an issue on our [GitHub repository](https://github.com/jzOcb/xhs-note-health-checker).

## Open Source

This extension is open source under the MIT License. You can review the complete source code at:
https://github.com/jzOcb/xhs-note-health-checker

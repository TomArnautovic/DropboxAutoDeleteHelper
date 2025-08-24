Duplicate Cleaner for Dropbox (Unofficial)

A lightweight Chrome extension that helps you clean up duplicate files on the Dropbox → Duplicates page by:

Expanding all groups

Selecting all duplicates except the first (keeper)

Bulk-deleting the selected files with modal confirmation

Not affiliated with or endorsed by Dropbox. Actions run only in your browser on dropbox.com.

✨ Features

One-click Expand All: opens every accordion/group on the Duplicates page.

Tick All: selects every checkbox except the first item in each group (keeps one copy).

Bulk Delete: clicks each group’s Delete selected and confirms the modal.

Stays within the Dropbox web UI—no servers, no analytics, no tracking.

⚠️ Safety

This tool deletes files you select on the Dropbox Duplicates page. Deletions go to Dropbox Deleted files/Trash according to your Dropbox plan/policy, but treat deletions as irreversible.

Always scan selections before running Bulk Delete.

UI selectors may change if Dropbox updates their site; if something stops working, please open an issue.

📥 Install (Developer / Unpacked)

Clone or download this repo.

Open chrome://extensions and enable Developer mode.

Click Load unpacked and select the project folder.

The extension icon will appear in your toolbar.

A Chrome Web Store link will be added here once published.

🚀 Usage

Open the Dropbox Duplicates page:
https://www.dropbox.com/find_duplicates?path=%2F

Click the extension icon to open the popup.

Click Expand All and wait until everything is expanded.

Click Tick All to select duplicates (skips the first row in each group).

Click Bulk Delete. The extension will:

Click Delete selected for the current group

Auto-confirm the Delete button in the modal

Move to the next group

You’ll see diagnostic logs in the DevTools Console prefixed with [DDC].

🔑 Permissions

activeTab – to interact with the current Dropbox tab when you click the popup.

scripting – to inject the content script if needed.

storage – to remember simple UI preferences (if used).

Host: https://www.dropbox.com/* – restricts the script to Dropbox.

No data is sent anywhere—everything runs locally in your browser.

🧩 Project Structure
.
├── manifest.json
├── popup.html
├── popup.js
├── content.js
└── icons/
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png


content.js – logic for expanding groups, ticking checkboxes, and bulk deletion (modal handling).

popup.html/js – simple UI with three buttons: Expand All, Tick All, Bulk Delete.

manifest.json – Chrome MV3 config (minimal permissions, host-scoped).

🛠️ Development

Keep selectors resilient to UI changes (favor roles/aria attributes and visible text: “Delete selected”, “Delete”).

Avoid inline scripts in HTML (MV3 CSP).

Test flows:

Groups already expanded

Groups partially expanded

Single-item groups (nothing to delete)

Modal confirm presence/absence

Quick dev cycle

Edit content.js/popup.js.

Go to chrome://extensions → Reload your unpacked extension.

Hard refresh the Dropbox tab and watch the Console ([DDC] logs).

🧰 Troubleshooting

“Couldn’t reach the page”
Make sure you’re on a dropbox.com tab (preferably the Duplicates page) and logged in.

Only first group seems to act
Click Expand All first; wait until logs show EXPAND: done. Then Tick All, then Bulk Delete.

“Modal confirm not found”
Sometimes the modal takes a moment—try running Bulk Delete again. If Dropbox changed markup, please open an issue with the modal’s HTML snippet.

Nothing happens when clicking Delete selected
Check the Console for [DDC] logs. If the button text/structure changed, please share a snippet.

📝 Privacy Policy (TL;DR)

This extension does not collect, store, or transmit any personal data. All actions occur locally within your browser on dropbox.com. No analytics, no third-party tracking.

(If you publish to the Chrome Web Store, add a link to a hosted Privacy Policy page here.)

🤝 Contributing

Issues and PRs are welcome! If you submit changes, please include:

A brief description of the fix/enhancement

Test notes (which flows you exercised)

Any updated selectors or fallback strategies

📄 License

MIT — see LICENSE.

📣 Disclaimer

This is an unofficial helper tool for the Dropbox web UI. Dropbox is a trademark of Dropbox, Inc. This project is not affiliated with, endorsed, or sponsored by Dropbox.

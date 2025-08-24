Dropbox Duplicate Cleaner (Unofficial)

A lightweight Chrome extension to help clean up duplicate files on Dropbox’s Duplicates page.

It automates the manual workflow by:

Expanding all duplicate groups

Selecting all duplicates except the first (keeper)

Bulk-deleting the selected files with modal confirmation

⚠️ Not affiliated with or endorsed by Dropbox.
All actions run only in your browser on dropbox.com
.

✨ Features

Expand All → Opens every accordion/group on the Duplicates page.

Tick All → Selects every checkbox except the first in each group (keeps one copy).

Bulk Delete → Clicks “Delete selected” for each group and confirms the modal.

Safe & local → Runs entirely within the Dropbox web UI—no servers, analytics, or tracking.

⚠️ Safety Notes

Deletions move to Dropbox’s Deleted files / Trash according to your plan/policy. Treat them as irreversible.

Always scan selections before running Bulk Delete.

Dropbox may change their UI. If selectors stop working, please open an issue
.

📥 Install (Developer / Unpacked Mode)

Since this extension isn’t published to the Chrome Web Store yet, you can install it manually:

Clone or download this repository.

git clone https://github.com/TomArnautovic/DropboxAutoDeleteHelper.git


Or click Code → Download ZIP and extract it.

Open chrome://extensions/ in Chrome.

Enable Developer mode (toggle in the top right).

Click Load unpacked and select the project folder (the one containing manifest.json).

The extension icon will appear in your toolbar.

🚀 Usage

Open the Dropbox Duplicates page:
👉 https://www.dropbox.com/find_duplicates?path=%2F

Click the extension icon in your Chrome toolbar.

Use the popup buttons in order:

Expand All → Wait until all groups are open (Console shows EXPAND: done).

Tick All → Selects all but the first file in each group.

Bulk Delete → Runs through each group:

Clicks “Delete selected”

Confirms the modal

Moves on to the next group

Diagnostic logs appear in DevTools Console ([DDC] ...).

🔑 Permissions

activeTab → interact with the Dropbox tab you click from.

scripting → inject the content script.

storage → remember simple UI preferences (if enabled).

https://www.dropbox.com/* → restricts operation to Dropbox only.

No data leaves your browser. Nothing is collected, stored, or transmitted.

🧩 Project Structure
ddc-extension/
├── manifest.json
├── popup.html
├── popup.js
├── content.js
└── icons/
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png


content.js → logic for expanding, ticking, and bulk deletion (incl. modal handling).

popup.html/js → simple popup UI with 3 buttons.

manifest.json → Chrome MV3 config with minimal permissions.

🛠️ Development

Avoid inline scripts (MV3 CSP).

Prefer resilient selectors (roles, aria attributes, visible text).

Test with:

Groups already expanded

Groups partially expanded

Single-item groups (nothing to delete)

Modal confirm presence/absence

Quick dev cycle
# Edit content.js or popup.js
# Then reload your extension and refresh Dropbox
chrome://extensions → Reload


Hard-refresh the Dropbox tab and watch Console logs ([DDC]).

🧰 Troubleshooting

“Couldn’t reach the page” → Make sure you’re on dropbox.com
, preferably the Duplicates page.

Only first group acts → Always click Expand All first; wait for EXPAND: done.

“Modal confirm not found” → Modal may take a moment; try again. If Dropbox changed markup, please open an issue with a snippet.

Nothing happens → Open DevTools Console and check for [DDC] logs.

📝 Privacy Policy

This extension does not collect, store, or transmit any personal data.
All actions occur locally within your browser on dropbox.com.
No analytics, no tracking, no external requests.

🤝 Contributing

Pull requests welcome! Please include:

Description of your change

Test notes (flows you tried)

Updated selectors/fallbacks if needed

📄 License

MIT
 — free to use, modify, and distribute.

📣 Disclaimer

This is an unofficial helper for Dropbox’s web UI.
Dropbox® is a trademark of Dropbox, Inc. This project is not affiliated with, endorsed by, or sponsored by Dropbox.

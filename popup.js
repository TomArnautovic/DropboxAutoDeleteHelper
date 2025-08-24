// popup.js — DDC Minimal UI v0.6.0
const $ = (id) => document.getElementById(id);
const status = (t) => { const el = $('status'); if (el) el.textContent = t; };

// show popup version (supports a few ids; use whichever your HTML has)
const POPUP_VER = '0.6.0';
['popupVersion', 'version', 'appVersion', 'ver'].forEach(id => {
    const el = $(id);
    if (el) el.textContent = `v${POPUP_VER}`;
});

async function getActiveTabId() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.id;
}

async function pingContent(tabId) {
    try {
        return await chrome.tabs.sendMessage(tabId, { type: 'DDC_PING' });
    } catch {
        return null;
    }
}

async function ensureContent(tabId) {
    let pong = await pingContent(tabId);
    if (pong && pong.ok) return true;

    // MV3: inject content.js if it isn't present
    await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js'],
    });

    pong = await pingContent(tabId);
    return !!(pong && pong.ok);
}

// Buttons: Expand All, Tick All, Bulk Delete, Stop
$('expandAll')?.addEventListener('click', async () => {
    status('Expanding…');
    const tabId = await getActiveTabId();
    if (!tabId) return status('No active tab');
    const ok = await ensureContent(tabId);
    if (!ok) return status('Couldn’t reach the page. Is Dropbox open?');
    await chrome.tabs.sendMessage(tabId, { type: 'DDC_EXPAND_ALL' });
    status('Expand requested');
});

$('tickAll')?.addEventListener('click', async () => {
    status('Ticking…');
    const tabId = await getActiveTabId();
    if (!tabId) return status('No active tab');
    const ok = await ensureContent(tabId);
    if (!ok) return status('Couldn’t reach the page. Is Dropbox open?');
    await chrome.tabs.sendMessage(tabId, { type: 'DDC_TICK_ALL' });
    status('Tick requested');
});

$('bulkDelete')?.addEventListener('click', async () => {
    status('Deleting…');
    const tabId = await getActiveTabId();
    if (!tabId) return status('No active tab');
    const ok = await ensureContent(tabId);
    if (!ok) return status('Couldn’t reach the page. Is Dropbox open?');

    // No delay passed; content.js defaults to zero between groups
    await chrome.tabs.sendMessage(tabId, {
        type: 'DDC_BULK_DELETE',
        config: {} // keep empty to use content.js defaults
    });
    status('Delete requested');
});

$('stop')?.addEventListener('click', async () => {
    const tabId = await getActiveTabId();
    if (!tabId) return;
    await chrome.tabs.sendMessage(tabId, { type: 'DDC_STOP' });
    status('Stopping…');
});

// content.js — DDC Minimal v7.6 (expand / tick / single-click bulk delete)

(() => {
    if (window.top !== window) return;
    if (document.documentElement.hasAttribute('data-ddc-active')) return;
    document.documentElement.setAttribute('data-ddc-active', '1');

    const VER = '7.6';
    const state = { busy: false, stop: false };
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

    const isVisible = (el) => {
        if (!el) return false;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
        const r = el.getClientRects?.();
        return !!r && r.length > 0 && (r[0].width > 0 || r[0].height > 0);
    };

    const flash = (el, css = '3px solid magenta', ms = 400) => {
        if (!el) return;
        const old = el.style.outline;
        el.style.outline = css;
        setTimeout(() => { el.style.outline = old; }, ms);
    };

    const findScroller = () =>
        document.querySelector('#maestro-content-portal') ||
        document.scrollingElement || document.documentElement;

    async function scrollToBottom(passes = 3, wait = 700) {
        const sc = findScroller();
        if (!sc) return;
        for (let i = 0; i < passes; i++) {
            if (state.stop) return;
            sc.scrollTop = sc.scrollHeight;
            sc.dispatchEvent(new Event('scroll', { bubbles: true }));
            await sleep(wait);
        }
    }

    // ---------- Groups & rows ----------
    const allAccordionItems = () =>
        Array.from(document.querySelectorAll('.dig-Accordion-item, [class*="Accordion-item"]'));

    const headerBtn = (g) =>
        g.querySelector('h2 .dig-Accordion-header-trigger, .dig-Accordion-header-trigger, button[aria-controls][aria-expanded]');

    const isOpen = (g) => {
        const b = headerBtn(g);
        if (b && b.hasAttribute('aria-expanded')) return b.getAttribute('aria-expanded') === 'true';
        const p = g.querySelector('[role="region"], .dig-Accordion-panel, [class*="Accordion-panel"]');
        return !!(p && !p.hidden && p.getAttribute('aria-hidden') !== 'true');
    };

    const openIfClosed = async (g) => {
        const b = headerBtn(g);
        if (!b || b.getAttribute('aria-expanded') === 'true') return false;
        b.scrollIntoView({ block: 'center' });
        b.click();
        await sleep(120);
        return true;
    };

    const expandedGroups = () => allAccordionItems().filter(isOpen);

    const rowsIn = (g) => {
        const all = Array.from(g.querySelectorAll('[role="row"]'));
        return all.filter(r => !/\bTable-row--header\b/.test(r.className || ''));
    };

    const rowCheckbox = (row) =>
        row.querySelector('input[type="checkbox"]:not([data-testid="main-checkbox"])');

    async function waitForRows(g, min = 2, timeout = 2500) {
        const t0 = Date.now();
        while (Date.now() - t0 < timeout) {
            const rows = rowsIn(g);
            if (rows.length >= min) return rows;
            await sleep(80);
        }
        return rowsIn(g);
    }

    // ---------- Hover helpers ----------
    function hoverHeader(g) {
        const h = g.querySelector('h2') || g;
        const r = h.getBoundingClientRect();
        const opts = { bubbles: true, clientX: r.left + 10, clientY: r.top + 10 };
        h.dispatchEvent(new MouseEvent('mouseenter', opts));
        h.dispatchEvent(new MouseEvent('mouseover', opts));
        h.dispatchEvent(new MouseEvent('mousemove', opts));
    }

    // ---------- Find "Delete Selected" in this group ----------
    function findDeleteSelectedButton(g) {
        // Exact structure you posted
        const spans = Array.from(
            g.querySelectorAll('button[data-dig-button="true"] span[data-dig-button-content="true"]')
        ).filter(isVisible);

        const exact = spans.find(sp => /^delete selected$/i.test(norm(sp.textContent)));
        if (exact) return { btn: exact.closest('button'), where: 'group-structured' };

        // Any visible button in this group with that text
        const btn2 = Array.from(g.querySelectorAll('button,[role="button"]'))
            .filter(isVisible)
            .find(b => /^delete selected$/i.test(norm(b.textContent)) ||
                /^delete selected$/i.test(norm(b.getAttribute('aria-label') || '')));
        if (btn2) return { btn: btn2, where: 'group-any' };

        // Global, but bound to this group by nearest accordion ancestor
        const globals = Array.from(document.querySelectorAll('button,[role="button"]'))
            .filter(isVisible)
            .filter(b => /^delete selected$/i.test(norm(b.textContent)) ||
                /^delete selected$/i.test(norm(b.getAttribute('aria-label') || '')));
        for (const b of globals) {
            const acc = b.closest('.dig-Accordion-item, [class*="Accordion-item"]');
            if (acc === g) return { btn: b, where: 'global-closest' };
        }
        return null;
    }

    async function waitEnabled(btn, timeout = 4000) {
        const t0 = Date.now();
        while (Date.now() - t0 < timeout) {
            const disabled = btn.disabled || btn.getAttribute('aria-disabled') === 'true';
            if (!disabled) return true;
            await sleep(80);
        }
        return !(btn.disabled || btn.getAttribute('aria-disabled') === 'true');
    }

    function clickOnce(el) {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = rect.left + Math.min(20, Math.max(2, rect.width * 0.6));
        const y = rect.top + Math.min(12, Math.max(2, rect.height * 0.5));
        const base = { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, pointerId: 1, pointerType: 'mouse' };
        el.focus?.();
        el.dispatchEvent(new PointerEvent('pointerover', base));
        el.dispatchEvent(new PointerEvent('pointerenter', base));
        el.dispatchEvent(new PointerEvent('pointerdown', base));
        el.dispatchEvent(new MouseEvent('mousedown', base));
        el.dispatchEvent(new PointerEvent('pointerup', base));
        el.dispatchEvent(new MouseEvent('mouseup', base));
        el.dispatchEvent(new MouseEvent('click', base));
        // NO extra el.click() — we want exactly one click path
    }

    // ---------- Modal detection & confirm ----------
    const DIALOG_SEL = [
        '.ReactModal__Content',
        '.dig-Modal',
        '[role="dialog"][aria-modal="true"]',
        '[role="dialog"]',
        '[aria-modal="true"]',
    ].join(',');
    const OVERLAY_SEL = '.ReactModal__Overlay';

    const pickTopByZ = (nodes) => {
        let best = null, bestZ = -1;
        for (const el of nodes || []) {
            if (!isVisible(el)) continue;
            const zStr = getComputedStyle(el).zIndex || '0';
            const z = zStr === 'auto' ? 0 : (parseInt(zStr, 10) || 0);
            if (z >= bestZ) { best = el; bestZ = z; }
        }
        return best;
    };

    const getActiveDialog = () => {
        const dialogs = Array.from(document.querySelectorAll(DIALOG_SEL)).filter(isVisible);
        const topDialog = pickTopByZ(dialogs);
        if (topDialog) return topDialog;

        const overlays = Array.from(document.querySelectorAll(OVERLAY_SEL)).filter(isVisible);
        const topOverlay = pickTopByZ(overlays);
        if (!topOverlay) return null;

        const nested = topOverlay.querySelector(DIALOG_SEL);
        if (nested && isVisible(nested)) return nested;

        const parent = topOverlay.parentElement || document.body;
        const sibDialogs = Array.from(parent.querySelectorAll(DIALOG_SEL)).filter(isVisible);
        return pickTopByZ(sibDialogs);
    };

    async function waitForModal(timeout = 12000) {
        const t0 = Date.now();
        while (Date.now() - t0 < timeout) {
            const dlg = getActiveDialog();
            if (dlg) return dlg;
            await sleep(80);
        }
        return null;
    }

    function findDeleteOnDialog(layer) {
        // Look for the primary Delete button
        const spans = Array.from(layer.querySelectorAll('span[data-dig-button-content="true"]')).filter(isVisible);
        for (const sp of spans) {
            const t = norm(sp.textContent);
            if (/^(delete|delete permanently|move to trash|remove)$/i.test(t)) {
                const btn = sp.closest('button,[role="button"]');
                if (btn) return btn;
            }
        }
        const btns = Array.from(layer.querySelectorAll('button,[role="button"]')).filter(isVisible);
        for (const b of btns) {
            const t = norm(b.textContent);
            const aria = norm(b.getAttribute('aria-label') || '');
            if (/^(delete|delete permanently|move to trash|remove)$/i.test(t) || /delete|trash|remove/i.test(aria)) {
                return b;
            }
        }
        const footer = layer.querySelector('.dig-Modal-footer, [class*="Modal-footer"]');
        if (footer) {
            const prim = Array.from(footer.querySelectorAll('button,[role="button"]'))
                .find(b => /\bButton--primary\b/.test(b.className) || /^delete$/i.test(norm(b.textContent)));
            if (prim) return prim;
        }
        return null;
    }

    async function pressEnterFallback(times = 3, gap = 120) {
        for (let i = 0; i < times; i++) {
            const tgt = getActiveDialog() || document.activeElement || document.body;
            tgt.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', code: 'Enter' }));
            tgt.dispatchEvent(new KeyboardEvent('keyup',   { bubbles: true, key: 'Enter', code: 'Enter' }));
            await sleep(gap);
        }
    }

    // Click the group "Delete Selected" ONCE, then wait for modal. One optional fallback click.
    async function clickDeleteSelectedAndWait(g, btn, { preModalDelayMs = 300, modalTimeoutMs = 6000 } = {}) {
        flash(btn, '3px solid magenta', 600);
        btn.scrollIntoView({ block: 'center' });

        clickOnce(btn);                         // <- single click only
        await sleep(Math.max(0, Number(preModalDelayMs)));

        let dlg = await waitForModal(modalTimeoutMs);
        if (dlg) return dlg;

        // One fallback attempt only
        console.warn('[DDC] No modal yet — trying one fallback native click');
        btn.click?.();
        await sleep(Math.max(0, Number(preModalDelayMs)));

        dlg = await waitForModal(modalTimeoutMs);
        return dlg || null;
    }

    async function confirmModalDelete({ confirmDelayMs = 200 } = {}) {
        const layer = await waitForModal(12000);
        if (!layer) return false;
        await sleep(Math.max(0, Number(confirmDelayMs)));

        const delBtn = findDeleteOnDialog(layer);
        if (!delBtn) {
            console.warn('[DDC] Modal confirm button not found — Enter fallback');
            await pressEnterFallback(4, 120);
            return !getActiveDialog();
        }

        flash(delBtn, '3px solid red', 500);
        clickOnce(delBtn);                      // <- single click only
        await sleep(150);

        // If dialog stubbornly remains, one Enter fallback (not a wave)
        if (getActiveDialog()) {
            await pressEnterFallback(1, 120);
        }
        return !getActiveDialog();
    }

    async function waitModalGoneOrRowsChanged(g, beforeCount, timeout = 20000) {
        const t0 = Date.now();
        while (Date.now() - t0 < timeout) {
            const layer = getActiveDialog();
            const now = rowsIn(g).length;
            if (!layer || now < beforeCount || !document.contains(g)) return true;
            await sleep(120);
        }
        return false;
    }

    async function ensureSelections(g) {
        const rows = rowsIn(g).filter(isVisible);
        if (rows.length <= 1) return false;
        let changed = false;
        for (let i = 1; i < rows.length; i++) {
            const cb = rowCheckbox(rows[i]);
            if (cb && !cb.checked) {
                cb.click();
                cb.dispatchEvent(new Event('change', { bubbles: true }));
                changed = true;
                await sleep(8);
            }
        }
        return changed;
    }

    // ---------- Public actions ----------
    async function expandAll() {
        if (state.busy) return;
        state.busy = true; state.stop = false;
        try {
            console.log('[DDC] EXPAND: start');
            await scrollToBottom(3, 700);
            for (let pass = 0; pass < 8; pass++) {
                if (state.stop) break;
                let opened = 0;
                while (!state.stop) {
                    const btn =
                        document.querySelector('button.dig-Accordion-header-trigger[aria-expanded="false"]') ||
                        document.querySelector('button[aria-controls][aria-expanded="false"]');
                    if (!btn) break;
                    btn.scrollIntoView({ block: 'center' });
                    btn.click();
                    opened++;
                    await sleep(60);
                }
                console.log(`[DDC] EXPAND pass ${pass + 1}: opened=${opened}`);
                if (opened === 0) break;
                await scrollToBottom(1, 400);
                await sleep(120);
            }
            console.log('[DDC] EXPAND: done');
        } catch (e) {
            console.error('[DDC] EXPAND error:', e);
        } finally {
            state.busy = false;
        }
    }

    async function tickAll() {
        if (state.busy) return;
        state.busy = true; state.stop = false;
        try {
            const gs = expandedGroups();
            console.log('[DDC] TICK: expanded groups', gs.length);
            for (const g of gs) {
                if (state.stop) break;
                await openIfClosed(g);
                g.scrollIntoView({ block: 'center' });
                await sleep(60);
                const rows = await waitForRows(g, 2, 2500);
                if (rows.length <= 1) continue;
                for (let i = 1; i < rows.length; i++) {
                    const cb = rowCheckbox(rows[i]);
                    if (cb && !cb.checked) {
                        cb.click();
                        cb.dispatchEvent(new Event('change', { bubbles: true }));
                        await sleep(8);
                    }
                }
            }
            console.log('[DDC] TICK: done');
        } catch (e) {
            console.error('[DDC] TICK error:', e);
        } finally {
            state.busy = false;
        }
    }

    async function bulkDelete({ delayMs = 1600, preModalDelayMs = 300, confirmDelayMs = 200 } = {}) {
        if (state.busy) return;
        state.busy = true; state.stop = false;
        try {
            let gs = expandedGroups();
            console.log('[DDC] DELETE: expanded groups', gs.length, 'delayMs', delayMs);

            for (let idx = 0; idx < gs.length; idx++) {
                if (state.stop) break;

                gs = expandedGroups(); // refresh
                if (idx >= gs.length) break;
                const g = gs[idx];

                await openIfClosed(g);
                g.scrollIntoView({ block: 'center' });
                hoverHeader(g);
                await sleep(120);

                const rows = await waitForRows(g, 2, 2500);
                const before = rows.length;
                if (before <= 1) continue;

                await ensureSelections(g);

                const found = findDeleteSelectedButton(g);
                if (!found || !found.btn) {
                    console.warn(`[DDC] Delete Selected NOT found (group ${idx + 1})`);
                    continue;
                }

                const { btn, where } = found;
                const disabled = btn.disabled || btn.getAttribute('aria-disabled') === 'true';
                console.log(`[DDC] Found Delete Selected (group ${idx + 1}, ${where}) — disabled=${disabled}`, btn);

                if (disabled) await waitEnabled(btn, 4000);

                const dlg = await clickDeleteSelectedAndWait(g, btn, {
                    preModalDelayMs,
                    modalTimeoutMs: 6000
                });

                if (!dlg) {
                    console.warn(`[DDC] Modal did not appear (group ${idx + 1})`);
                    continue;
                }

                const ok = await confirmModalDelete({ confirmDelayMs });
                if (!ok) console.warn(`[DDC] Modal confirm failed (group ${idx + 1})`);

                await waitModalGoneOrRowsChanged(g, before, 20000);
                await sleep(Math.max(200, Number(delayMs)));
            }

            console.log('[DDC] DELETE: done');
        } catch (e) {
            console.error('[DDC] DELETE error:', e);
        } finally {
            state.busy = false;
        }
    }

    // Messaging
    chrome.runtime.onMessage.addListener((msg, _s, send) => {
        if (msg?.type === 'DDC_PING') { send?.({ ok: true, ver: VER, href: location.href }); return true; }
        if (msg?.type === 'DDC_STOP') { state.stop = true; console.log('[DDC] STOP requested'); return true; }
        if (msg?.type === 'DDC_EXPAND_ALL')  { expandAll(); return true; }
        if (msg?.type === 'DDC_TICK_ALL')    { tickAll();   return true; }
        if (msg?.type === 'DDC_BULK_DELETE') { bulkDelete(msg.config || {}); return true; }
    });

    // Expose for console testing
    window.DDC = { version: VER, expandAll, tickAll, bulkDelete };
})();

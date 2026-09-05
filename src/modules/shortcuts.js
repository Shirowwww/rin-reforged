/* ------------------------------------------------------------------
   Keyboard navigation.

   Single-key bindings only fire when nothing is focused that would
   swallow them, so typing "j" in the reply box still types a j.
   ------------------------------------------------------------------ */

const SHORTCUTS = [
    { keys: "Ctrl K", what: "Search or jump to anything" },
    { keys: "j / k", what: "Next / previous post, or row of a listing" },
    { keys: "Enter", what: "Open the row under the cursor" },
    { keys: "n / p", what: "Next / previous page of the topic" },
    { keys: "g then i", what: "Board index" },
    { keys: "g then f", what: "The forum this topic is in" },
    { keys: "g then t", what: "Top of the page" },
    { keys: "g then b", what: "Bottom of the page" },
    { keys: "r", what: "Reply to this topic" },
    { keys: "s", what: "Focus the filter or search box" },
    { keys: ",", what: "Open settings" },
    { keys: "?", what: "This list" },
];

function typingInField(target) {
    if (!target) return false;
    if (target.isContentEditable) return true;
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function scrollToPost(direction) {
    const anchors = Array.from(document.querySelectorAll('a[name^="p"]'))
        .filter((node) => /^p\d+$/.test(node.getAttribute("name") || ""));
    if (!anchors.length) return;

    const top = window.scrollY + 70;
    // Each anchor's position is read once and kept with it.
    const placed = anchors.map((node) => ({ node, at: node.getBoundingClientRect().top + window.scrollY }));
    let target = null;
    if (direction > 0) {
        target = placed.find((entry) => entry.at > top + 10);
    } else {
        for (const entry of placed) {
            if (entry.at < top - 10) target = entry;
        }
    }
    if (!target) target = direction > 0 ? placed[placed.length - 1] : placed[0];
    window.scrollTo({ top: target.at - 60, behavior: scrollBehaviour() });
}

/**
 * j and k on a listing: the cursor walks the rows the way it walks the
 * posts of a topic, and Enter opens the one it is on, because the row's
 * title link is what gets the focus. Returns false where there is no
 * listing, so the caller falls back to posts.
 */
function moveListCursor(direction) {
    const pick = 'td[data-rr-col="title"] a.topictitle, td[data-rr-col="title"] a.forumlink';
    const rows = Array.from(document.querySelectorAll("table[data-rr-list] tr"))
        .filter((row) => row.querySelector(pick) && row.offsetParent !== null);
    if (!rows.length) return false;

    const at = rows.findIndex((row) => row.hasAttribute("data-rr-cursor"));
    let next;
    if (at < 0) next = direction > 0 ? 0 : rows.length - 1;
    else next = Math.min(rows.length - 1, Math.max(0, at + direction));
    if (at >= 0) rows[at].removeAttribute("data-rr-cursor");
    rows[next].setAttribute("data-rr-cursor", "");
    rows[next].scrollIntoView({ block: "nearest", behavior: scrollBehaviour() });
    const link = rows[next].querySelector(pick);
    if (link) link.focus({ preventScroll: true });
    return true;
}

function goPage(direction) {
    const info = pagination();
    const href = direction > 0 ? info.next : info.previous;
    if (href && (direction > 0 ? info.hasNext : info.hasPrevious)) location.href = href;
    else toast(direction > 0 ? "Last page" : "First page");
}

let shortcutSheet = null;

function openShortcutSheet() {
    // Pressing ? twice used to stack a second copy over the first, and
    // Escape only ever closed the top one.
    if (shortcutSheet) { shortcutSheet(); return; }

    const sheet = el("div.rr-sheet", {
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Keyboard shortcuts",
        tabindex: "-1",
    });

    const closeButton = el("button.rr-icon-btn.rr-sheet__close", {
        type: "button",
        title: "Close",
        "aria-label": "Close the shortcut list",
    }, [icon("close")]);

    sheet.append(el("div.rr-sheet__head", {}, [
        el("h2", {}, ["Keyboard shortcuts"]),
        closeButton,
    ]));

    const list = el("dl");
    for (const row of SHORTCUTS) {
        list.append(el("dt", {}, [el("span.rr-kbd", {}, [row.keys])]));
        list.append(el("dd", {}, [row.what]));
    }
    sheet.append(list);

    const overlay = el("div.rr-overlay", {}, [sheet]);
    const previous = document.activeElement;
    let release = () => {};

    const close = () => {
        overlay.remove();
        document.removeEventListener("keydown", onKey, true);
        release();
        shortcutSheet = null;
    };
    const onKey = (event) => { if (event.key === "Escape") { event.preventDefault(); close(); } };

    closeButton.addEventListener("click", close);
    overlay.addEventListener("mousedown", (event) => { if (event.target === overlay) close(); });
    document.addEventListener("keydown", onKey, true);
    document.body.append(overlay);

    release = trapFocus(sheet, previous instanceof HTMLElement ? previous : null);
    sheet.focus();
    shortcutSheet = close;
}

function initShortcuts() {
    if (!settings.get("shortcuts")) return;

    let awaitingG = false;
    let gTimer = 0;

    document.addEventListener("keydown", (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        if (typingInField(event.target)) return;
        // Any of the script's own dialogs owns the keyboard while open.
        if (document.querySelector(".rr-palette, .rr-sheet, .rr-panel, .rr-lightbox")) return;

        const key = event.key;

        if (awaitingG) {
            clearTimeout(gTimer);
            awaitingG = false;
            if (key === "i") { location.href = "./index.php"; return; }
            if (key === "f") {
                const crumb = Array.from(document.querySelectorAll("a.breadcrumbs, .rr-nav__crumbs a")).pop();
                if (crumb) crumb.click();
                return;
            }
            if (key === "t") { window.scrollTo({ top: 0, behavior: scrollBehaviour() }); return; }
            if (key === "b") { window.scrollTo({ top: document.body.scrollHeight, behavior: scrollBehaviour() }); return; }
            // Anything else was not a g-prefixed jump. Falling through
            // rather than returning means "g" then "j" still moves a
            // post, instead of being swallowed as a mistyped chord.
        }

        switch (key) {
            case "g":
                awaitingG = true;
                gTimer = setTimeout(() => { awaitingG = false; }, 900);
                break;
            case "j": event.preventDefault(); if (!moveListCursor(1)) scrollToPost(1); break;
            case "k": event.preventDefault(); if (!moveListCursor(-1)) scrollToPost(-1); break;
            case "n": goPage(1); break;
            case "p": goPage(-1); break;
            case "r": {
                /* The quick reply first, when there is one: "r" used to
                   leave for the full posting page past the form that was
                   already on this one. */
                const quick = document.querySelector(".rr-reply textarea, .rr-reply > button.rr-btn");
                if (quick) {
                    event.preventDefault();
                    if (quick.tagName === "BUTTON") quick.click();
                    else quick.focus();
                    break;
                }
                const reply = document.querySelector('a[href*="mode=reply"]');
                if (reply) reply.click();
                break;
            }
            case "s": {
                event.preventDefault();
                const box = document.querySelector(".rr-toolbar__filter input")
                    || document.querySelector('input[name="keywords"]');
                if (box) { box.focus(); box.select(); }
                else if (settings.get("palette")) openPalette();
                break;
            }
            case ",": event.preventDefault(); openSettings(); break;
            case "?": event.preventDefault(); openShortcutSheet(); break;
            default: break;
        }
    });
}

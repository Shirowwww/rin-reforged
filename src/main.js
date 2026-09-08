/* Two boot phases: document-start (theme + stylesheet, before the old
   styling can flash) and DOM ready (everything touching markup, each
   module guarded so one failure can't blank the page). */

const RR_VERSION = "__VERSION__";

function injectStyles() {
    const host = document.head || document.documentElement;
    if (!host || document.getElementById("rr-style")) return;
    const style = document.createElement("style");
    style.id = "rr-style";
    style.textContent = RR_CSS;
    host.append(style);
}

/** CS.RIN.RU Enhanced overlaps in places; when both run, it keeps the
    features it already owns. */
function detectEnhanced() {
    const present = Boolean(document.getElementById("configButton") || document.getElementById("ajaxload"));
    document.documentElement.toggleAttribute("data-rr-coexist", present && settings.get("coexist"));
    return present;
}

function guard(name, fn) {
    try {
        fn();
    } catch (err) {
        console.error("[RIN Reforged] " + name + " failed:", err);
    }
}

/* <body> stays hidden via CSS until data-rr-ready lands, avoiding a
   flash of the board's own layout before this script rebuilds it. It
   lands at the end of the late phase, on failure inside it, or via the
   watchdog below if the late phase never runs — never leave it unset. */
const READY_WATCHDOG = 4000;

function markReady() {
    const root = document.documentElement;
    if (root && !root.hasAttribute("data-rr-ready")) root.setAttribute("data-rr-ready", "");
}

function bootEarly() {
    registerSchema(SETTINGS_SCHEMA);
    guard("theme", initTheme);
    injectStyles();
}

/* Write-only inits run first; read-then-write ones (below the marker)
   run last. The board is nested tables, so a read-after-write forces a
   full layout — tens of ms each. Interleaved, that was 5 layouts per
   load instead of 1; measured live, folding quotes alone cost 36.7 ms
   and the breadcrumb strip 54.9 ms. Keep new modules on the correct
   side of the marker. */
function bootLate() {
    guard("coexistence", detectEnhanced);
    guard("icons", initIcons);
    guard("navbar", initNavbar);
    guard("lists", initLists);
    guard("topic index", initTopicIndex);
    guard("index", initBoardIndex);
    guard("topic", initTopic);
    guard("releases", initReleases);
    guard("quiet", initQuiet);
    guard("steam", initSteamPreview);
    guard("compose", initCompose);
    guard("posting", initPostingMemory);
    guard("toolbar", initPostingToolbar);
    guard("review", initTopicReview);
    guard("people", initPeople);
    guard("palette", initPalette);
    guard("shortcuts", initShortcuts);
    guard("spacing", dropStrayBreaks);
    guard("numbers", groupBoardNumbers);
    guard("chrome", initChrome);
    guard("menu", initSettingsUI);

    /* ---- reads the page back; nothing below writes for the ones
            after it to have to lay out again ---- */
    guard("crumbs", tidyCrumbStrip);
    guard("search", frameStraySearch);
    guard("separators", dropStraySeparators);
    guard("quotes", initQuotes);
    guard("ink", readableBoardInk);

    guard("anchor", settleFragment);
    markReady();

    // Enhanced loads at document-idle, so recheck after it may have arrived.
    setTimeout(() => guard("coexistence", detectEnhanced), 2000);
}

// documentElement can be missing at document-start, hence whenRoot; each
// phase is guarded separately so one failing doesn't stop the next.
guard("boot:early", () => whenRoot(bootEarly));
guard("boot:styles", () => whenBody(() => guard("styles", injectStyles)));
guard("boot:late", () => whenReady(() => { try { bootLate(); } finally { markReady(); } }));

// Last resort: a page held back forever is worse than the flash this avoids.
setTimeout(markReady, READY_WATCHDOG);

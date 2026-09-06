/* ------------------------------------------------------------------
   Boot.

   Two phases:
     document-start  theme attributes and the stylesheet, so the old
                     styling never flashes
     DOM ready       everything that needs the markup

   Each module is wrapped so one failure cannot take the rest of the
   script down with it; a broken feature should leave a readable forum,
   not a blank page.
   ------------------------------------------------------------------ */

const RR_VERSION = "__VERSION__";

function injectStyles() {
    const host = document.head || document.documentElement;
    if (!host || document.getElementById("rr-style")) return;
    const style = document.createElement("style");
    style.id = "rr-style";
    style.textContent = RR_CSS;
    host.append(style);
}

/** CS.RIN.RU Enhanced is widely installed and overlaps in a few places.
    When both are running, the older script keeps the features it
    already owns. */
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

function bootEarly() {
    registerSchema(SETTINGS_SCHEMA);
    guard("theme", initTheme);
    injectStyles();
}

function bootLate() {
    guard("coexistence", detectEnhanced);
    guard("icons", initIcons);
    guard("navbar", initNavbar);
    guard("lists", initLists);
    guard("index", initBoardIndex);
    guard("topic", initTopic);
    guard("releases", initReleases);
    guard("quotes", initQuotes);
    guard("quiet", initQuiet);
    guard("steam", initSteamPreview);
    guard("compose", initCompose);
    guard("posting", initPostingMemory);
    guard("people", initPeople);
    guard("palette", initPalette);
    guard("shortcuts", initShortcuts);
    guard("crumbs", tidyCrumbStrip);
    guard("spacing", dropStrayBreaks);
    guard("separators", dropStraySeparators);
    guard("numbers", groupBoardNumbers);
    guard("ink", readableBoardInk);
    guard("chrome", initChrome);
    guard("menu", initSettingsUI);

    // Enhanced runs at document-idle, so a second look after the page
    // settles catches it when it loads after this script.
    setTimeout(() => guard("coexistence", detectEnhanced), 2000);
}

// documentElement can still be missing at document-start, so the early
// phase waits for it rather than assuming the parser got there first.
// Each phase is guarded on its own: one failing must not stop the next
// from being scheduled.
guard("boot:early", () => whenRoot(bootEarly));
guard("boot:styles", () => whenBody(() => guard("styles", injectStyles)));
guard("boot:late", () => whenReady(bootLate));

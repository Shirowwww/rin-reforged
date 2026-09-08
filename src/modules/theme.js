// Theme application: runs at document-start (before the original stylesheet
// can flash) and again on every settings change.

const ACCENTS = {
    brass:  { accent: "#e0a338", soft: "#4a3a1c", text: "#0e1013", light: "#a5701a", lightSoft: "#f5e6c8", lightText: "#ffffff" },
    rin:    { accent: "#d46234", soft: "#40200f", text: "#120703", light: "#a8451d", lightSoft: "#f8e0d5", lightText: "#ffffff" },
    steam:  { accent: "#66c0f4", soft: "#173a52", text: "#0c1116", light: "#1c6ea4", lightSoft: "#d8ecf9", lightText: "#ffffff" },
    moss:   { accent: "#6bbd85", soft: "#1e3a28", text: "#0d1712", light: "#22754a", lightSoft: "#d9efe1", lightText: "#ffffff" },
    rose:   { accent: "#e0748c", soft: "#42212a", text: "#180d10", light: "#a83b58", lightSoft: "#f8dee5", lightText: "#ffffff" },
    violet: { accent: "#a795d8", soft: "#2e2842", text: "#120f1c", light: "#5f4a9c", lightSoft: "#e6e0f6", lightText: "#ffffff" },
};

function resolveTheme(choice) {
    if (choice !== "auto") return choice;
    const light = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    return light ? "paper" : "native";
}

function applyTheme() {
    const root = document.documentElement;
    if (!root) return;
    const theme = resolveTheme(settings.get("theme"));
    const isLight = theme === "paper";

    root.setAttribute("data-rr", "");
    root.setAttribute("data-rr-theme", theme);
    root.setAttribute("data-rr-density", settings.get("density"));
    root.setAttribute("data-rr-width", settings.get("width"));
    root.setAttribute("data-rr-page", PAGE.isTopic ? "topic" : PAGE.isForum ? "forum" : PAGE.isIndex ? "index" : PAGE.isSearch ? "search" : "other");
    root.setAttribute("data-rr-icons", settings.get("modernIcons") ? "on" : "off");
    root.setAttribute("data-rr-nav", settings.get("navbar") ? "on" : "off");
    // Distinct from the top-bar setting: board links or masthead alone also
    // replace the header. Set early to avoid a flash; navbar.js corrects it
    // if nothing was actually built.
    root.setAttribute("data-rr-header",
        settings.get("navbar") || settings.get("boardLinks") || settings.get("masthead") ? "rr" : "board");
    root.setAttribute("data-rr-sticky", settings.get("stickyHeads") ? "on" : "off");
    root.toggleAttribute("data-rr-still", Boolean(settings.get("reduceMotion")));

    root.style.setProperty("--rr-fs", settings.get("fontSize") + "px");

    const accent = ACCENTS[settings.get("accent")] || ACCENTS.brass;
    const ink = isLight ? accent.light : accent.accent;
    const soft = isLight ? accent.lightSoft : accent.soft;
    root.style.setProperty("--rr-accent", ink);
    root.style.setProperty("--rr-accent-soft", soft);
    root.style.setProperty("--rr-accent-text", isLight ? accent.lightText : accent.text);
    // Accent-as-text on its own soft wash (filter chip, tab count) read 3.3:1
    // on the light theme; lifted toward black/white until it clears 4.5.
    const lifted = readableInk(parseColour(ink), parseColour(soft), 4.5);
    root.style.setProperty("--rr-accent-on-soft", lifted ? rgbText(lifted) : ink);
    root.style.setProperty("color-scheme", isLight ? "light" : "dark");
}

/** The forum ships no viewport tag, so phones get the 1000px page scaled down unreadable. */
function ensureViewport() {
    // <head> may not exist yet at document-start; safe to wait since layout hasn't happened.
    const place = () => {
        if (!document.head) return false;
        let meta = document.querySelector('meta[name="viewport"]');
        if (!meta) {
            meta = document.createElement("meta");
            meta.name = "viewport";
            document.head.append(meta);
        }
        meta.content = "width=device-width, initial-scale=1, viewport-fit=cover";
        return true;
    };

    if (place()) return;
    const observer = new MutationObserver(() => { if (place()) observer.disconnect(); });
    observer.observe(document, { childList: true, subtree: true });
}

function initTheme() {
    applyTheme();
    ensureViewport();
    settings.onChange((id) => {
        if (["theme", "accent", "density", "fontSize", "width", "modernIcons", "navbar", "boardLinks", "masthead", "reduceMotion"].includes(id) || id === "*") {
            applyTheme();
        }
    });
    if (window.matchMedia) {
        const query = window.matchMedia("(prefers-color-scheme: light)");
        const listener = () => { if (settings.get("theme") === "auto") applyTheme(); };
        if (query.addEventListener) query.addEventListener("change", listener);
        else if (query.addListener) query.addListener(listener);
    }
}

// The board's own inline colours (group-coloured usernames at 2.5:1 dark /
// 1.9:1 light, the login-to-see-link marker at 3.1) are lifted in lightness
// only, by the smallest step that clears contrast against their actual
// backdrop; the original value is kept on the element. One shared threshold,
// slightly above the usual 4.5, so this pass and test/contrast.js can't disagree.
const INK_TARGET = 4.75;

function readableBoardInk() {
    if (!settings.get("readableInk")) return;

    // Lift toward the theme's own strongest text colour, so results land in-palette.
    const toward = parseColour(
        getComputedStyle(document.documentElement).getPropertyValue("--rr-text-strong").trim())
        || null;

    const behind = new Map();
    const backdropFor = (node) => {
        const parent = node.parentElement;
        if (!parent) return null;
        if (!behind.has(parent)) behind.set(parent, backdropOf(node));
        return behind.get(parent);
    };

    for (const node of document.querySelectorAll('#wrapcentre [style*="color"], .rr-nav [style*="color"]')) {
        const written = node.style.color;
        if (!written || node.hasAttribute("data-rr-ink")) continue;

        const colour = parseColour(getComputedStyle(node).color);
        const bg = backdropFor(node);
        if (!colour || !bg) continue;

        const lifted = readableInk(colour, bg, INK_TARGET, toward);
        if (!lifted) continue;

        node.setAttribute("data-rr-ink", written);
        node.style.color = rgbText(lifted);
    }
}

/** A parsed colour back as CSS. */
function rgbText(colour) {
    return "rgb(" + Math.round(colour.r) + ", " + Math.round(colour.g) + ", " + Math.round(colour.b) + ")";
}

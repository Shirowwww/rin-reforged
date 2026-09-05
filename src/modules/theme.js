/* ------------------------------------------------------------------
   Theme application.

   Runs at document-start so the page never flashes the original
   stylesheet, and re-runs on every settings change.
   ------------------------------------------------------------------ */

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
    root.toggleAttribute("data-rr-still", Boolean(settings.get("reduceMotion")));

    root.style.setProperty("--rr-fs", settings.get("fontSize") + "px");

    const accent = ACCENTS[settings.get("accent")] || ACCENTS.brass;
    const ink = isLight ? accent.light : accent.accent;
    const soft = isLight ? accent.lightSoft : accent.soft;
    root.style.setProperty("--rr-accent", ink);
    root.style.setProperty("--rr-accent-soft", soft);
    root.style.setProperty("--rr-accent-text", isLight ? accent.lightText : accent.text);
    /* The accent used as text on its own soft wash — a pressed filter
       chip, the count on a settings tab. On the light theme the raw
       accent read at 3.3:1 there; it is lifted toward black or white
       until it clears 4.5, and left as it is where it already does. */
    const lifted = readableInk(parseColour(ink), parseColour(soft), 4.5);
    root.style.setProperty("--rr-accent-on-soft", lifted ? rgbText(lifted) : ink);
    root.style.setProperty("color-scheme", isLight ? "light" : "dark");
}

/** The forum ships no viewport tag, which is why phones get a 1000px
    page scaled down to unreadable. */
function ensureViewport() {
    // <head> may not exist yet at document-start; the tag is only
    // needed before layout, so waiting for it is fine.
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
        if (["theme", "accent", "density", "fontSize", "width", "modernIcons", "navbar", "reduceMotion"].includes(id) || id === "*") {
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

/* ---- The board's own colours, kept and made readable --------------- */

/* Every colour the *script* paints is measured against WCAG AA by
   test/contrast.js and every one of them passes. The board's own are a
   different matter and not the script's to redesign — except that they
   are on the same page, in the same type sizes, and several of them
   are genuinely hard to read: group-coloured usernames come out at
   2.5:1 on the dark themes and 1.9:1 on the light one, and the
   "[[Please login to see this link.]]" marker at 3.1.
 *
 * So they are kept and lifted: same hue, same saturation, the smallest
 * change in lightness that reaches the threshold against whatever is
 * behind them. Only colours the board wrote inline, only where they
 * fail, and never more than they have to. The original is kept on the
 * element so nothing is lost.
 *
 * It has its own switch, because a board's colours are part of how it
 * looks and somebody may prefer them exactly as they are. */
/* 4.5 for everything, including the large text WCAG lets off at 3.
   Two thresholds meant the pass and test/contrast.js could disagree
   about one span in a signature and each be right, which is a bad way
   to spend an afternoon; and being stricter than the standard on
   somebody else's colours only ever makes them easier to read. */
const INK_TARGET = 4.75;

function readableBoardInk() {
    if (!settings.get("readableInk")) return;

    // The end of the mix: the theme's own strongest text colour, so a
    // lifted username lands in this palette rather than beside it.
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
        node.style.color = "rgb(" + [lifted.r, lifted.g, lifted.b]
            .map((v) => Math.round(v)).join(", ") + ")";
    }
}

/** A parsed colour back as CSS. */
function rgbText(colour) {
    return "rgb(" + Math.round(colour.r) + ", " + Math.round(colour.g) + ", " + Math.round(colour.b) + ")";
}

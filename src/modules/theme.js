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
    root.setAttribute("data-rr-icons", settings.get("modernIcons") ? "on" : "off");
    root.setAttribute("data-rr-nav", settings.get("navbar") ? "on" : "off");
    root.toggleAttribute("data-rr-still", Boolean(settings.get("reduceMotion")));

    root.style.setProperty("--rr-fs", settings.get("fontSize") + "px");

    const accent = ACCENTS[settings.get("accent")] || ACCENTS.brass;
    root.style.setProperty("--rr-accent", isLight ? accent.light : accent.accent);
    root.style.setProperty("--rr-accent-soft", isLight ? accent.lightSoft : accent.soft);
    root.style.setProperty("--rr-accent-text", isLight ? accent.lightText : accent.text);
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

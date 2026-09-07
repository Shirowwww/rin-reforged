/* ------------------------------------------------------------------
   DOM helpers and the icon set.

   Nothing in this script parses markup. Post content is only ever
   moved, cloned or read as textContent, and the icon set — the last
   place that did — is built with createElementNS. That keeps the
   interface working under a Trusted Types policy, where innerHTML and
   DOMParser both throw.
   ------------------------------------------------------------------ */

/**
 * Build an element.
 *   el("button.rr-btn", { onclick, "aria-pressed": "true" }, ["Save"])
 * Tag supports .class and #id shorthand. Children may be nodes or
 * strings; strings become text nodes, never markup.
 */
function el(tag, attrs = {}, children = []) {
    const [name, ...rest] = tag.split(/(?=[.#])/);
    const node = document.createElement(name || "div");
    for (const token of rest) {
        if (token[0] === ".") node.classList.add(token.slice(1));
        else if (token[0] === "#") node.id = token.slice(1);
    }
    for (const [key, value] of Object.entries(attrs)) {
        if (value === null || value === undefined || value === false) continue;
        if (key === "style" && typeof value === "object") Object.assign(node.style, value);
        else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value);
        else if (key === "text") node.textContent = value;
        else if (value === true) node.setAttribute(key, "");
        else node.setAttribute(key, value);
    }
    for (const child of [].concat(children)) {
        if (child === null || child === undefined || child === false) continue;
        node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return node;
}

function on(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    return () => target.removeEventListener(type, handler, options);
}

/**
 * Run fn once <html> exists.
 *
 * At document-start the script can be running before the parser has
 * produced anything at all, so documentElement is not a given. Every
 * theme attribute and the stylesheet depend on it.
 */
function whenRoot(fn) {
    if (document.documentElement) { fn(); return; }
    const observer = new MutationObserver(() => {
        if (document.documentElement) { observer.disconnect(); fn(); }
    });
    observer.observe(document, { childList: true });
}

/**
 * Run fn once <body> exists.
 *
 * Observes `document` rather than documentElement, which is not
 * guaranteed to exist yet at document-start and is not a valid observe
 * target when it does not.
 */
function whenBody(fn) {
    if (document.body) { fn(); return; }
    const observer = new MutationObserver(() => {
        if (document.body) { observer.disconnect(); fn(); }
    });
    observer.observe(document, { childList: true, subtree: true });
}

function whenReady(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
}

/**
 * Keep Tab inside a dialog while it is open.
 *
 * Every overlay in this script draws a scrim over the page, which says
 * "nothing behind this is reachable" to anyone using a mouse and says
 * nothing at all to anyone using a keyboard: Tab walks straight out of
 * the dialog and into a page they cannot see. Returns a teardown.
 */
function trapFocus(container, restoreTo) {
    const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), ' +
        'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const onKey = (event) => {
        if (event.key !== "Tab") return;
        const items = Array.from(container.querySelectorAll(FOCUSABLE))
            .filter((node) => node.offsetParent !== null || node === document.activeElement);
        if (!items.length) { event.preventDefault(); container.focus(); return; }

        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    container.addEventListener("keydown", onKey);
    return () => {
        container.removeEventListener("keydown", onKey);
        if (restoreTo && document.contains(restoreTo)) restoreTo.focus();
    };
}

function debounce(fn, wait) {
    let timer = 0;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), wait);
    };
}

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

/**
 * May the interface animate?
 *
 * The stylesheet already answers this for transitions, twice: a media
 * query for the system setting and an attribute for the one in the
 * panel. Scrolling does not go through the stylesheet — a `behavior`
 * option passed to scrollTo or scrollIntoView beats the CSS
 * `scroll-behavior` property by design — so every one of the seven
 * places this script scrolls was gliding the page regardless of what
 * either setting said. Reading it back here is what makes the switch
 * mean what it says.
 */
function motionAllowed() {
    if (settings.get("reduceMotion")) return false;
    return !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

/** "smooth" or "auto", for a scroll option. */
function scrollBehaviour() { return motionAllowed() ? "smooth" : "auto"; }

/* ---- Parsing a page this script fetched --------------------------- */

/* Two features fetch a page of the board and read it — the quick
   reply, and the releases walk — and DOMParser is the only way to turn
   HTML into a document.

   Under `require-trusted-types-for 'script'` parseFromString throws,
   verified rather than assumed. cs.rin.ru does not send that header
   today; the video players a game thread embeds do, and a board can
   add one any day. The escape hatch is a policy, which works unless
   the CSP also names an allow-list that excludes it — and where even
   that is refused this returns null and the caller says so, rather
   than throwing inside a click handler. */
let htmlPolicy;

function trustedHtml(html) {
    if (typeof window.trustedTypes !== "object" || !window.trustedTypes) return html;
    if (htmlPolicy === undefined) {
        try {
            // The content is a page of the board this script is already
            // running on, fetched same-origin, and it is only ever read
            // — never inserted. There is nothing here to sanitise that
            // the document it came from had not already accepted.
            htmlPolicy = window.trustedTypes.createPolicy("rin-reforged-page", { createHTML: (input) => input });
        } catch (err) {
            console.warn("[RIN Reforged] no Trusted Types policy available:", err);
            htmlPolicy = null;
        }
    }
    return htmlPolicy ? htmlPolicy.createHTML(html) : html;
}

/** A fetched page as a document, or null if this browser will not let
    us make one. Never inserted into the page: only read. */
function parseDocument(html) {
    try {
        return new DOMParser().parseFromString(trustedHtml(html), "text/html");
    } catch (err) {
        console.warn("[RIN Reforged] cannot parse a fetched page:", err);
        return null;
    }
}

/* ---- Colour ------------------------------------------------------- */

/* The board paints usernames from their group, as an inline style on
   the link, and several of those are #BF0000 or darker on a near-black
   page — 2.5:1, against the 4.5 that 13px text is held to.

   Those colours are how the board tells you who is talking, so what
   follows keeps the hue and the saturation and moves only the
   lightness, by the smallest step that makes the name readable on
   whatever is actually behind it. A red name stays a red name. */

function parseColour(text) {
    const raw = String(text).trim();

    /* Hex, because a custom property read off the root comes back as
       whatever was typed into the stylesheet rather than as a resolved
       rgb(). Reading #f6f6f6 by pulling the digits out of it gives
       rgb(6, 6, 6) — which is not near-white, it is near-black, and a
       colour lifted toward it goes the wrong way on every theme whose
       text colour happens to contain a digit. */
    const hex = raw.match(/^#([0-9a-f]{3,8})$/i);
    if (hex) {
        const digits = hex[1].length <= 4
            ? hex[1].split("").map((c) => c + c).join("")
            : hex[1];
        const byte = (at) => parseInt(digits.slice(at, at + 2), 16);
        return {
            r: byte(0), g: byte(2), b: byte(4),
            a: digits.length >= 8 ? byte(6) / 255 : 1,
        };
    }

    const parts = (raw.match(/[\d.]+/g) || []).map(Number);
    if (parts.length < 3) return null;
    // color-mix() resolves to color(srgb r g b / a), 0-1 per channel.
    const scale = /^color\(/.test(raw) ? 255 : 1;
    return {
        r: parts[0] * scale,
        g: parts[1] * scale,
        b: parts[2] * scale,
        a: parts.length > 3 ? parts[3] : 1,
    };
}

function relativeLuminance({ r, g, b }) {
    const channel = (value) => {
        const v = value / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(one, two) {
    const a = relativeLuminance(one);
    const b = relativeLuminance(two);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const INK_STEPS = 40;

/**
 * The same colour, made readable against `behind`, by mixing it toward
 * `toward` — the theme's own strong text colour — a fortieth at a time
 * until it reaches `target`. Returns null when it already reads, and
 * when nothing on the way there does.
 *
 * Mixing rather than raising the lightness, and this is the second
 * attempt. Climbing the lightness axis keeps the saturation, so the
 * board's #BF0000 came out at pure rgb(255, 38, 38) — readable and
 * neon, on a board whose author has already said in as many words that
 * the red was too loud. Mixing toward the text colour desaturates as
 * it lightens and lands somewhere near the softened red this script
 * already chose for its links: the same colour, quieter and legible,
 * rather than the same colour turned up.
 */
function readableInk(colour, behind, target, toward) {
    if (!colour || !behind) return null;
    if (contrastRatio(colour, behind) >= target) return null;

    const auto = relativeLuminance(behind) > 0.5
        ? { r: 0, g: 0, b: 0, a: 1 }
        : { r: 255, g: 255, b: 255, a: 1 };
    const lifted = mixToward(colour, behind, target, toward || auto);
    /* The theme's text colour is light, and a light box inside a dark
       post — a code block the board paints #ccc — cannot be reached
       that way. The other direction can. */
    if (!lifted && toward) return mixToward(colour, behind, target, auto);
    return lifted;
}

function mixToward(colour, behind, target, end) {
    for (let step = 1; step <= INK_STEPS; step += 1) {
        const mix = step / INK_STEPS;
        const blend = {
            r: colour.r + (end.r - colour.r) * mix,
            g: colour.g + (end.g - colour.g) * mix,
            b: colour.b + (end.b - colour.b) * mix,
            a: 1,
        };
        if (contrastRatio(blend, behind) < target) continue;
        /* One step past the first that clears it: the same name appears
           on a plain row and on a striped one, and those are different
           backgrounds. A fortieth is not a visible difference in the
           colour and it is the difference between passing everywhere
           and passing where it was measured. */
        const over = Math.min(step + 1, INK_STEPS) / INK_STEPS;
        return {
            r: colour.r + (end.r - colour.r) * over,
            g: colour.g + (end.g - colour.g) * over,
            b: colour.b + (end.b - colour.b) * over,
            a: 1,
        };
    }
    return null;
}

/** One colour over another, both opaque afterwards. */
function overColour(top, bottom) {
    return {
        r: top.r * top.a + bottom.r * (1 - top.a),
        g: top.g * top.a + bottom.g * (1 - top.a),
        b: top.b * top.a + bottom.b * (1 - top.a),
        a: 1,
    };
}

/**
 * What is actually painted behind a node.
 *
 * Composited rather than "the first ancestor that is opaque enough":
 * a tag, a chip and a hovered row are all a tint over something else,
 * and stopping at the first one that happens to be solid measures the
 * wrong colour by however much the tints above it were worth.
 */
function backdropOf(node) {
    const chain = [];
    for (let at = node.parentElement; at; at = at.parentElement) {
        chain.push(at);
        const colour = parseColour(getComputedStyle(at).backgroundColor);
        if (colour && colour.a >= 1) break;
    }
    let stack = { r: 255, g: 255, b: 255, a: 1 };
    for (const at of chain.reverse()) {
        const colour = parseColour(getComputedStyle(at).backgroundColor);
        if (colour && colour.a > 0) stack = overColour(colour, stack);
    }
    return stack;
}

/* ---- Numbers ------------------------------------------------------ */

/* This board counts in the millions and prints the counts as one run of
   digits: 3097072 posts, 168938 views, 61469 topics. At that length a
   number stops being read and becomes a length — nobody reads 3097072,
   they see "long". Grouped, it is three million at a glance.

   The separator is a narrow no-break space (U+202F) and not a comma: a
   comma is the decimal separator for half this board's readers, to
   whom 3,097,072 has two decimal points in it. No-break, so it cannot
   leave a lone digit at the end of a wrapped line.

   Regrouped, never rounded: "3.1M" is a different fact. And only
   quantities — a build id, an AppID or a post number is a name spelled
   in digits — so nothing here sweeps a page; every caller names what
   it is handing in. */
const DIGIT_GROUP = "\u202f";

/* Where the grouping starts. Four digits where the caller knows the
   number is a count; five where it only knows it probably is, because
   2026 is a year and a year is a name — grouping one is an error the
   reader has to undo. */
const GROUP_FROM_COUNT = 4;
const GROUP_FROM_GUESS = 5;

/** 3097072 -> "3 097 072". Anything that is not a plain run of digits,
    or is short enough to read as it is, comes back untouched. */
function groupDigits(text, from) {
    const raw = String(text).trim();
    if (!/^\d+$/.test(raw)) return raw;
    if (raw.length < (from || GROUP_FROM_COUNT)) return raw;
    return raw.replace(/\B(?=(\d{3})+(?!\d))/g, DIGIT_GROUP);
}

/**
 * Regroup every long run of digits inside a node, once.
 *
 * The board's own text stays on the title attribute, so the run of
 * digits it printed can still be read off and copied.
 */
function groupNumbersIn(node, from) {
    if (!node || node.hasAttribute("data-rr-grouped")) return;

    const least = from || GROUP_FROM_COUNT;
    const runs = new RegExp("\\d{" + least + ",}", "g");
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const changes = [];
    let text;
    while ((text = walker.nextNode())) {
        const grouped = text.textContent.replace(runs, (run) => groupDigits(run, least));
        if (grouped !== text.textContent) changes.push([text, grouped]);
    }
    if (!changes.length) return;

    const before = node.textContent.replace(/\s+/g, " ").trim();
    for (const [node_, grouped] of changes) node_.textContent = grouped;
    node.setAttribute("data-rr-grouped", "");
    if (!node.getAttribute("title")) node.setAttribute("title", before);
}

/**
 * The same, for anything whose *whole* text is one number.
 *
 * Used where the surrounding markup is the board's rather than this
 * script's — the statistics line, a profile's counters — and where a
 * run of digits could as easily be somebody's username.
 */
function groupCountElements(selector, root) {
    for (const node of (root || document).querySelectorAll(selector)) {
        if (!/^\s*\d{5,}\s*$/.test(node.textContent)) continue;
        groupNumbersIn(node, GROUP_FROM_GUESS);
    }
}

/* ---- Icons ------------------------------------------------------- */

const ICON_PATHS = {
    search:    '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    settings:  '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    mail:      '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/>',
    user:      '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    star:      '<path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.8l6.5-.9z"/>',
    arrowUp:   '<path d="M12 20V5"/><path d="m5 12 7-7 7 7"/>',
    arrowDown: '<path d="M12 4v15"/><path d="m19 12-7 7-7-7"/>',
    link:      '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
    copy:      '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    quote:     '<path d="M7 15c-2 0-3-1.3-3-3.2C4 8.7 6 6.3 9 5l.8 1.7C7.9 7.6 7 8.8 7 10c1.7 0 3 1.1 3 2.6C10 14 8.8 15 7 15z"/><path d="M17 15c-2 0-3-1.3-3-3.2 0-3.1 2-5.5 5-6.8l.8 1.7C17.9 7.6 17 8.8 17 10c1.7 0 3 1.1 3 2.6 0 1.4-1.2 2.4-3 2.4z"/>',
    close:     '<path d="M6 6 18 18M18 6 6 18"/>',
    chevron:   '<path d="m9 6 6 6-6 6"/>',
    chevronL:  '<path d="m15 6-6 6 6 6"/>',
    pageFirst: '<path d="m17 6-6 6 6 6"/><path d="M8 5v14"/>',
    pageLast:  '<path d="m7 6 6 6-6 6"/><path d="M16 5v14"/>',
    chevronD:  '<path d="m6 9 6 6 6-6"/>',
    external:  '<path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    home:      '<path d="M4 10 12 3l8 7v10a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
    layers:    '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    clock:     '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    keyboard:  '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M8 14h8"/>',
    filter:    '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    game:      '<rect x="2" y="7" width="20" height="11" rx="4"/><path d="M7 11v3M5.5 12.5h3M16 12h.01M18.5 14h.01"/>',
    check:     '<path d="m5 12 5 5 9-10"/>',
    reply:     '<path d="M9 10 4 15l5 5"/><path d="M4 15h10a6 6 0 0 0 6-6V5"/>',
    heart:     '<path d="M12 20.3 4.6 13a4.7 4.7 0 0 1 0-6.7 4.7 4.7 0 0 1 6.7 0l.7.7.7-.7a4.7 4.7 0 0 1 6.7 0 4.7 4.7 0 0 1 0 6.7z"/>',
    sliders:   '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h10M18 18h2"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>',
    fold:      '<path d="m7 9 5 5 5-5"/><path d="M4 5h16"/><path d="M4 19h16"/>',
    /* A topic in the palette: a sheet with lines on it. Boards are
       layers and bookmarks are stars; this is the third thing in that
       list and had been borrowing one of the other two. */
    topic:     '<path d="M5 4h9l5 5v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M14 4v5h5"/><path d="M8 13h7M8 17h5"/>',
    // The board's own emblem, redrawn: the masthead is a crosshair over
    // a Steam valve, and the crosshair is the half that survives being
    // shrunk to 20px.
    crosshair: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2"/><path d="M12 1.5v5M12 17.5v5M1.5 12h5M17.5 12h5"/>',
    clip:      '<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',

    /* The writing toolbar. Each of these has to read at 13px against a
       word, so they are the plainest shape that says the thing: two
       angle brackets for code, bullets and rules for the two kinds of
       list, a frame with a sun in it for an image, a play triangle for
       the video embed, a struck-through eye for the spoiler. */
    code:      '<path d="M9 7 4 12l5 5M15 7l5 5-5 5"/>',
    list:      '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="18" r="1.2"/>',
    listnum:   '<path d="M10 6h10M10 12h10M10 18h10M4 5.5 5.5 5v4M3.6 15.2a1.4 1.4 0 1 1 2.5.9L3.6 19h3"/>',
    image:     '<rect x="3" y="4.5" width="18" height="15" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="m4 17 4.5-4.5 4 4L16 13l4 4"/>',
    play:      '<rect x="2.5" y="4.5" width="19" height="15" rx="4"/><path d="m10 8.8 5.2 3.2-5.2 3.2z"/>',
    hide:      '<path d="M2.5 12S6.4 5.8 12 5.8 21.5 12 21.5 12 17.6 18.2 12 18.2 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.7"/><path d="M4 20 20 4"/>',
};

/* Each icon's shapes, built once as real nodes and cloned after.

   The definitions above are written as markup because that is how they
   are read and edited, but neither svg.innerHTML nor DOMParser
   survives a require-trusted-types-for policy — and a throw inside
   icon() takes the whole calling module with it, top bar included. The
   vocabulary is three self-closing tags with plain attributes, all
   written in this file, so two expressions and createElementNS read it
   back exactly and leave no markup sink to be gated. */
const SHAPE_RE = /<([a-z]+)\s+([^>]*?)\s*\/>/gi;
const ATTR_RE = /([\w-]+)="([^"]*)"/g;
const SVG_NS = "http://www.w3.org/2000/svg";

const ICON_CACHE = new Map();

function iconShapes(name) {
    if (ICON_CACHE.has(name)) return ICON_CACHE.get(name);

    const shapes = [];
    const markup = ICON_PATHS[name] || "";
    SHAPE_RE.lastIndex = 0;
    let shape;
    while ((shape = SHAPE_RE.exec(markup)) !== null) {
        const node = document.createElementNS(SVG_NS, shape[1]);
        ATTR_RE.lastIndex = 0;
        let attr;
        while ((attr = ATTR_RE.exec(shape[2])) !== null) {
            node.setAttribute(attr[1], attr[2]);
        }
        shapes.push(node);
    }

    ICON_CACHE.set(name, shapes);
    return shapes;
}

/** An inline SVG icon. The shapes are literals defined above, never
    user content. */
function icon(name, size) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    if (size) { svg.style.width = size + "px"; svg.style.height = size + "px"; }

    for (const shape of iconShapes(name)) svg.append(shape.cloneNode(true));
    return svg;
}

/* ---- Feedback ---------------------------------------------------- */

let toastHost = null;

function toast(message) {
    if (!toastHost) {
        /* A live region, so "Link copied" is said as well as shown. */
        toastHost = el("div.rr-toasts", { role: "status", "aria-live": "polite" });
        document.body.append(toastHost);
    }
    const node = el("div.rr-toast", {}, [message]);
    toastHost.append(node);
    setTimeout(() => {
        node.style.transition = "opacity 200ms ease";
        node.style.opacity = "0";
        setTimeout(() => node.remove(), 220);
    }, 1800);
}

async function copyText(text, okMessage) {
    try {
        await navigator.clipboard.writeText(text);
        toast(okMessage || "Copied");
        return true;
    } catch {
        // Clipboard API needs a secure context and a user gesture; fall
        // back to a throwaway textarea so this still works over Tor.
        const box = el("textarea", { style: { position: "fixed", opacity: "0" } });
        box.value = text;
        document.body.append(box);
        box.select();
        let ok = false;
        try { ok = document.execCommand("copy"); } catch { ok = false; }
        box.remove();
        toast(ok ? (okMessage || "Copied") : "Could not copy");
        return ok;
    }
}

/* ---- Matching what somebody typed ---------------------------------- */

/* Case, accents and apostrophes folded away, so "dragons" finds
   "Dragon's" and "denuvo" finds "DENUVO". */
function foldText(text) {
    return String(text || "")
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        // Apostrophes go altogether: "clancys" finds "Clancy's", and so
        // does "clancy's" typed with either apostrophe.
        .replace(/['\u2019\u02bc]/g, "");
}

/**
 * Does `text` contain every word of `query`, in any order?
 *
 * The filter box and the command palette used to look for the whole
 * query as one run of characters, so "cracks hypervisor" found nothing
 * in "Hypervisor cracks support" and a second word typed after the first
 * narrowed the list to nothing instead of narrowing it further. A
 * query is words; each one has to be somewhere in the title.
 */
function matchesWords(text, query) {
    const words = foldText(query).split(/\s+/).filter(Boolean);
    if (!words.length) return true;
    const hay = foldText(text);
    return words.every((word) => hay.includes(word));
}

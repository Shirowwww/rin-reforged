/* Topics in the palette, and a look inside one. Filters titles this
   browser has already seen instead of searching the board (which has a
   ~30s flood interval); resting on a result fetches its first page once. */

// 800 topics is ~110 KB, well within localStorage and about 8 listings' worth.
const TOPIC_BUCKET = "topics";
const TOPIC_LIMIT = 800;

// Long enough to arrow past a few rows without firing a fetch on each.
const PREVIEW_DWELL = 260;

// Below this the pane has no room (features.css hides it here too) and a
// phone is the worst place to spend 110 KB on a fetch nobody can see.
const PREVIEW_MIN_WIDTH = 1200;

// Measured live: refused around 1s/8s/8s, answered at 20s. A warning, not a
// block — the board enforces its own flood interval regardless.
const SEARCH_INTERVAL = 30000;

// Session id, lang= and &start=/#unread all vary per link for the same
// topic; this collapses them to one id so they don't count as four.
function topicKey(href) {
    const id = String(href || "").match(/[?&]t=(\d+)/);
    return id ? id[1] : null;
}

function canonicalTopicHref(href) {
    const id = topicKey(href);
    if (!id) return null;
    const forum = String(href).match(/[?&]f=(\d+)/);
    return "./viewtopic.php?" + (forum ? "f=" + forum[1] + "&" : "") + "t=" + id;
}

function knownTopics() {
    const held = bucket.get(TOPIC_BUCKET, []);
    return Array.isArray(held) ? held : [];
}

/** The board a listing is showing, for the line under a title. */
function listingBoardName() {
    const crumbs = Array.from(document.querySelectorAll("#wrapcentre a.breadcrumbs, .rr-nav__crumbs a"));
    const last = crumbs[crumbs.length - 1];
    const name = last ? last.textContent.replace(/\s+/g, " ").trim() : "";
    return name && name.length <= 48 ? name : null;
}

// Runs on any page listing `a.topictitle` rows; writes once, at the end,
// only when something actually changed.
function harvestTopics() {
    if (!settings.get("paletteTopics")) return;

    const rows = topicRows();
    if (!rows.length) return;

    const board = listingBoardName();
    const now = Date.now();
    const held = knownTopics();
    const byId = new Map(held.map((entry) => [entry.i, entry]));
    let changed = false;

    for (const row of rows) {
        if (!row.id || !row.title) continue;
        const href = canonicalTopicHref(row.link.getAttribute("href"));
        if (!href) continue;
        const before = byId.get(row.id);
        // Re-read every time: a renamed topic is a different search target.
        const entry = {
            i: row.id,
            t: row.title.slice(0, 140),
            h: href,
            b: board || (before && before.b) || null,
            s: now,
        };
        if (!before || before.t !== entry.t || before.b !== entry.b) changed = true;
        byId.set(row.id, entry);
    }
    if (!changed && byId.size === held.length) return;

    // Newest sighting first, so the cap drops the oldest, not Map insertion order.
    const next = Array.from(byId.values()).sort((a, b) => b.s - a.s).slice(0, TOPIC_LIMIT);

    // If storage is full, half an index still answers most queries.
    if (!bucket.set(TOPIC_BUCKET, next) && next.length > 40) {
        bucket.set(TOPIC_BUCKET, next.slice(0, Math.floor(next.length / 2)));
    }
}

// Only ever called with a query — an empty box is answered by the
// palette's own bookmarks/recent groups instead.
function matchingTopics(needle, limit) {
    if (!needle || !settings.get("paletteTopics")) return [];

    const found = [];
    for (const entry of knownTopics()) {
        if (!matchesWords(entry.t, needle)) continue;
        found.push(entry);
        // A margin over `limit` for the sort below to choose from.
        if (found.length >= limit * 4) break;
    }

    // A title starting with the query ranks above one that merely
    // contains it; ties go to the most recently seen.
    const folded = foldText(needle);
    const rank = (entry) => (foldText(entry.t).startsWith(folded) ? 0 : 1);
    found.sort((a, b) => rank(a) - rank(b) || b.s - a.s);
    return found.slice(0, limit);
}

/** Palette rows for those, in the shape collectItems() builds. */
function topicPaletteItems(needle, limit) {
    return matchingTopics(needle, limit).map((entry) => ({
        label: entry.t,
        icon: "topic",
        hint: entry.b || t("topic"),
        href: entry.h,
        preview: entry.h,
    }));
}

// Choosing a search navigates away, so there's no response to read — only
// the time of the last request, enough to say "not yet" before the board does.
function noteBoardSearch() {
    bucket.set("lastSearch", Date.now());
}

/** Seconds still to wait, or 0 when a search is worth trying. */
function searchCooldown() {
    const last = Number(bucket.get("lastSearch", 0));
    if (!Number.isFinite(last) || !last) return 0;
    const left = SEARCH_INTERVAL - (Date.now() - last);
    // A stamp from a clock set back would otherwise read as hours of wait.
    if (left <= 0 || left > SEARCH_INTERVAL) return 0;
    return Math.ceil(left / 1000);
}

// In-memory only — a preview is a glance at 110 KB that has no business in
// storage; arrowing over the same topic again just reuses the promise.
const previewCache = new Map();

/** Trim a run of post text to something that fits a pane. */
function previewBlurb(body) {
    if (!body) return "";
    const text = body.textContent.replace(/\s+/g, " ").trim();
    if (text.length <= 260) return text;
    // On a word, so the cut does not land mid-title.
    const cut = text.slice(0, 260);
    const space = cut.lastIndexOf(" ");
    return (space > 180 ? cut.slice(0, space) : cut) + "…";
}

// The board's CSP (img-src 'self' https: data:) allows a post's own imgur/Steam
// art here too; smilies and template icons are excluded by path and size floor.
function previewImage(doc, body) {
    if (!body) return null;
    for (const img of body.querySelectorAll("img")) {
        const src = img.getAttribute("src") || "";
        if (!src || /\/(?:images|imageset|smilies)\//i.test(src)) continue;
        const width = parseInt(img.getAttribute("width") || "0", 10);
        if (width && width < 120) continue;
        try {
            return new URL(src, doc.baseURI || location.href).href;
        } catch {
            return null;
        }
    }
    return null;
}

/** What the topic's own page says about itself. */
function readTopicPage1(doc, href) {
    const found = posts(doc);
    const first = found[0] || null;
    const heading = doc.querySelector("#pageheader h2, a.titles");
    const crumbs = Array.from(doc.querySelectorAll("#wrapcentre a.breadcrumbs"));
    const pages = doc.body.textContent.match(/(?:Page|Страница)\s+\d+\s+(?:of|из)\s+(\d+)/i);

    // headCell not head: `head` is a band topic.js draws, and this document
    // never went near topic.js. Date matched by shape, not the label before it.
    const posted = first && first.headCell
        ? first.headCell.textContent.replace(/\s+/g, " ").trim()
        : "";
    const when = posted.match(/(\d{1,2}\s+[A-Za-zА-Яа-я]{3,}\s+\d{4}(?:,?\s+\d{1,2}:\d{2})?)/);

    return {
        href,
        title: heading ? heading.textContent.replace(/\s+/g, " ").trim() : null,
        board: crumbs.length ? crumbs[crumbs.length - 1].textContent.trim() : null,
        pages: pages ? Number(pages[1]) : 1,
        author: first && first.author ? first.author.textContent.trim() : null,
        when: when ? when[1].trim().slice(0, 40) : null,
        blurb: first ? previewBlurb(first.body) : "",
        image: first ? previewImage(doc, first.body) : null,
    };
}

// The promise itself is cached, so hovering the same topic again while the
// first fetch is still in flight waits on it instead of starting another.
function previewTopic(href) {
    const id = topicKey(href);
    if (!id) return Promise.reject(new Error("not a topic"));
    if (previewCache.has(id)) return previewCache.get(id);

    const job = (async () => {
        const response = await fetch(href, { credentials: "same-origin" });
        if (!response.ok) throw new Error("the board answered " + response.status);
        const doc = parseDocument(await response.text());
        if (!doc) throw new Error("that page could not be read");
        return readTopicPage1(doc, href);
    })();

    // Not kept on failure — the next hover should retry rather than repeat an
    // old error.
    job.catch(() => previewCache.delete(id));
    previewCache.set(id, job);
    return job;
}

function previewSkeleton() {
    return el("div.rr-preview__wait", {}, [t("Reading that topic…")]);
}

// Width isn't reliable in the markup, so this waits for the actual file and
// removes itself if it turns out too small or fails to load.
function previewArt(src) {
    const art = el("img.rr-preview__art", {
        src,
        alt: "",
        loading: "lazy",
        referrerpolicy: "no-referrer",
    });
    art.addEventListener("load", () => {
        if (art.naturalWidth && art.naturalWidth < 120) art.remove();
    });
    art.addEventListener("error", () => art.remove());
    return art;
}

function renderPreview(pane, info) {
    const meta = [
        info.board,
        info.pages > 1 ? t("{n} pages", { n: info.pages }) : null,
    ].filter(Boolean).join(" · ");

    // Filtered before append(): Node.append() renders a null child as the
    // text "null" (el() drops it, append() doesn't).
    const parts = [
        info.image ? previewArt(info.image) : null,
        el("div.rr-preview__title", {}, [info.title || t("this topic")]),
        meta ? el("div.rr-preview__meta", {}, [meta]) : null,
        info.author
            ? el("div.rr-preview__by", {}, [
                t("Opened by {who}", { who: info.author }) + (info.when ? " · " + info.when : ""),
            ])
            : null,
        info.blurb ? el("p.rr-preview__blurb", {}, [info.blurb]) : null,
        el("div.rr-preview__foot", {}, [t("Enter to open")]),
    ].filter(Boolean);

    pane.textContent = "";
    pane.append(...parts);
}

// Pane goes in the overlay, not the panel: the panel clips its own corners
// (cutting off a right-hung child), and a sibling in its centred row would
// shove the list 170px left on first open.
function attachTopicPreview(overlay, currentItem) {
    if (!settings.get("palettePreview")) return () => {};
    if (window.innerWidth < PREVIEW_MIN_WIDTH) return () => {};

    const pane = el("aside.rr-preview", { hidden: true, "aria-live": "polite" });
    overlay.append(pane);

    let timer = 0;
    let shown = null;

    const clear = () => {
        window.clearTimeout(timer);
        timer = 0;
    };

    const show = (href) => {
        const id = topicKey(href);
        if (!id || id === shown) return;
        // Re-checked here too, in case the window narrowed since the
        // palette opened — no fetch for a pane the stylesheet now hides.
        if (window.innerWidth < PREVIEW_MIN_WIDTH) return;
        shown = id;
        pane.hidden = false;
        pane.textContent = "";
        pane.append(previewSkeleton());
        previewTopic(href).then(
            (info) => { if (shown === id) renderPreview(pane, info); },
            (err) => {
                if (shown !== id) return;
                pane.textContent = "";
                pane.append(el("div.rr-preview__wait", {}, [String(err.message || err)]));
            },
        );
    };

    const settle = () => {
        clear();
        const item = currentItem();
        const href = item && item.preview;
        if (!href) return;
        // Already cached: skip the dwell, nothing to wait for.
        if (previewCache.has(topicKey(href))) { show(href); return; }
        timer = window.setTimeout(() => show(href), PREVIEW_DWELL);
    };

    return settle;
}

// This index is the largest of what "Clear data" forgets, and lives on its
// own key so store.replace({}) doesn't reach it — it has to be dropped by name.
function forgetTopicIndex() {
    bucket.drop(TOPIC_BUCKET);
    bucket.drop("lastSearch");
}

function initTopicIndex() {
    // Caught here (not navbar.js) so a rebuilt search box still counts
    // against the flood interval; capture since the board's handler may
    // stop the event.
    document.addEventListener("submit", (event) => {
        const form = event.target;
        if (!(form instanceof HTMLFormElement)) return;
        if (/search\.php/.test(form.getAttribute("action") || "")) noteBoardSearch();
    }, true);

    // After first paint: nothing reads the index until Ctrl+K.
    const later = window.requestIdleCallback || ((fn) => window.setTimeout(fn, 400));
    later(() => {
        try {
            harvestTopics();
        } catch (err) {
            console.warn("[RIN Reforged] topic index:", err);
        }
    });
}

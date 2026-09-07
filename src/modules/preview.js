/* ------------------------------------------------------------------
   Topics in the palette, and a look inside one.

   Two features that only make sense together.

   The board has one search box and it reloads the page, so the palette
   offers a row that hands the query to search.php. That is the right
   escape hatch and the wrong first answer: you cannot see what you are
   choosing between until after a page load, and this board will not
   let you search twice in a row anyway — phpBB's flood interval on
   cs.rin.ru is about half a minute, measured, and a search typed one
   letter at a time would burn it on the prefixes and be refused on the
   word.

   So nothing here searches. Every listing this browser opens is
   already a hundred topic titles arriving for free; they are kept, and
   typing filters what has been seen. That is instant, costs no
   request, and cannot be rate limited.

   And resting on one fetches its first page, once, to show what is in
   it — the board it is in, how long it runs, who opened it and what
   they said. viewtopic.php has no flood interval; a page is 40-110 KB
   and about 350ms.
   ------------------------------------------------------------------ */

/* Eight hundred topics is 110 KB, which localStorage holds ten times
   over, and about eight listings' worth — far more than anyone types
   against in one sitting, and small enough that the write at the end
   of a listing is not felt. */
const TOPIC_BUCKET = "topics";
const TOPIC_LIMIT = 800;

/* How long the reader has to stay on a row before it is fetched.

   Long enough that arrowing from the top of the list to the fourth
   entry does not ask for four pages, short enough that stopping on
   one feels like it answered rather than like it thought about it. */
const PREVIEW_DWELL = 260;

/* The pane hangs off the centre line, past the palette's own 320px
   half and a 12px gap, so the room it has is what is left of the
   half-window after those. At 1200px that bottoms out at 256px, which
   still holds a title and four lines of a post; below it there is not
   enough left to read, and the fetch would be spent on something
   nobody can see. features.css hides the pane at the same width; this
   is what stops the request. A phone is also the worst place to spend
   110 KB. */
const PREVIEW_MIN_WIDTH = 1200;

/* Measured on the live board: one search, then refusals at +1s, +8s
   and +8s again, then an answer at +20s. "A few minutes" is what the
   board says and about half a minute is what it does, so this is a
   warning and never a block — the number is the board's to enforce. */
const SEARCH_INTERVAL = 30000;

/* ---- What this browser has seen ----------------------------------- */

/**
 * One canonical URL for a topic.
 *
 * The board hangs a session id on every link, stamps `lang=` on some,
 * and points a title at `&start=225` or `#unread` depending on where
 * it was picked up. All of those are the same topic, and left alone
 * they would be four entries in the index and four fetches for one
 * preview.
 */
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

/**
 * Keep the topics on this page.
 *
 * Runs on anything that lists topics — a forum, a search result, the
 * active-topics page — because all three are `a.topictitle` and the
 * reader does not care which one a title was picked up from.
 *
 * Written once per page, at the end, and only when something actually
 * changed: a listing revisited unchanged costs a read and no write.
 */
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
        // The title is re-read every time on purpose: a topic renamed
        // to "[Release] … v2.1" is a different thing to search for.
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

    // Newest sighting first, so the cap drops what has not been seen
    // in longest rather than whatever the Map happened to hold last.
    const next = Array.from(byId.values()).sort((a, b) => b.s - a.s).slice(0, TOPIC_LIMIT);

    /* A full quota is not a reason to lose the feature. Half of an
       index still answers most of what is typed at it, and the next
       listing fills it back up to whatever fits. */
    if (!bucket.set(TOPIC_BUCKET, next) && next.length > 40) {
        bucket.set(TOPIC_BUCKET, next.slice(0, Math.floor(next.length / 2)));
    }
}

/**
 * Topics matching what has been typed, best first.
 *
 * Only ever with a query: eight hundred titles in no order is not a
 * list anybody reads, and the palette's own groups — bookmarks, the
 * recent ones — are the answer to an empty box.
 */
function matchingTopics(needle, limit) {
    if (!needle || !settings.get("paletteTopics")) return [];

    const found = [];
    for (const entry of knownTopics()) {
        if (!matchesWords(entry.t, needle)) continue;
        found.push(entry);
        // Twice the limit, so the sort below has something to choose
        // from without walking the whole index into an array.
        if (found.length >= limit * 4) break;
    }

    /* A title that starts with the query is what was meant more often
       than one that merely contains it — "elden" should reach Elden
       Ring before "The Elden Ring of a longer name" — and after that
       the most recently seen wins, which on this board means the most
       recently active. */
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

/* ---- The board's flood interval ----------------------------------- */

/* The palette navigates away when a search is chosen, so there is no
   answer to read: what the board did with the request is only visible
   on the page that replaces this one. What can be known is when the
   last one was asked for, which is enough to say "not yet" before the
   board says "not at all". */
function noteBoardSearch() {
    bucket.set("lastSearch", Date.now());
}

/** Seconds still to wait, or 0 when a search is worth trying. */
function searchCooldown() {
    const last = Number(bucket.get("lastSearch", 0));
    if (!Number.isFinite(last) || !last) return 0;
    const left = SEARCH_INTERVAL - (Date.now() - last);
    // A stamp from the future — a clock put back, a machine restored
    // from a backup — would otherwise read as a wait of hours. Nothing
    // longer than the interval itself can be real.
    if (left <= 0 || left > SEARCH_INTERVAL) return 0;
    return Math.ceil(left / 1000);
}

/* ---- Looking inside one ------------------------------------------- */

/* Kept for as long as the tab is open, not written down: a preview is
   a glance at something that changes, and one page of one topic is
   110 KB that has no business in storage. Arrowing up and down a list
   of ten therefore asks for ten pages once and none of them again. */
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

/**
 * The first image of the opening post, if it is one worth showing.
 *
 * The board's CSP is `img-src 'self' https: data:`, so a post's own
 * imgur or Steam art loads here as well as it does on the page it came
 * from. Smilies and the template's own icons do not count as art: they
 * live under styles/ and are the reason for the size floor.
 */
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

    /* headCell, not head: `head` is the band topic.js draws, and this
       document was parsed out of a fetch and never went near topic.js.
       The template's own cell is what a detached page has, and it
       reads "Post subject: … Posted: Sunday, 12 Oct 2014, 22:49" —
       both halves in one run of text, in whichever of the board's two
       languages the reader is in. The date is picked out by its shape
       rather than by the word in front of it, which also drops the
       weekday nobody needs. */
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

/**
 * Fetch and read one topic's first page.
 *
 * One request per topic per tab, and one in flight per topic however
 * many times the cursor passes over it: the promise itself is what is
 * cached, so a second ask while the first is still out waits on it
 * rather than starting another.
 */
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

    // A failure is not kept: the next hover should be allowed to try
    // again rather than repeat an error from ten minutes ago.
    job.catch(() => previewCache.delete(id));
    previewCache.set(id, job);
    return job;
}

/* ---- The pane ------------------------------------------------------ */

function previewSkeleton() {
    return el("div.rr-preview__wait", {}, [t("Reading that topic…")]);
}

/**
 * The picture, on condition that it turns out to be one.
 *
 * Whether an image is worth showing cannot be settled from the markup:
 * the width attribute is optional and most posts leave it off, so the
 * only honest test is the file itself. Until it arrives the element is
 * there and empty; a 16px sprite blown up to the pane's full width, or
 * a host that refuses to serve it, takes itself back out rather than
 * standing at the top of the pane as a smear or a broken-image box.
 */
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

    /* Filtered, not passed straight to append(): el() drops a null
       child, and Node.append() turns one into the text "null" — which
       is what a topic whose opening post has no picture put above its
       own title. */
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

/**
 * Wire a palette's cursor to a pane beside it.
 *
 * Called by the palette once, with the overlay it just built and a way
 * to ask what the cursor is on.
 *
 * The pane goes in the overlay, not in the panel: the panel clips its
 * own corners, so a child hung off its right edge would be cut off at
 * it, and a sibling laid out beside it in the overlay's centred row
 * would shove the list 170px to the left the first time one opened.
 * Positioned against the centre line instead, the list never moves.
 */
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
        // Checked again here, not only when the palette opened: a
        // window narrowed since then has the stylesheet hiding the
        // pane, and a fetch for something nobody can see is the one
        // request this feature has no excuse for.
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
        // Already read: no reason to make the reader wait out a dwell
        // for something that is in memory.
        if (previewCache.has(topicKey(href))) { show(href); return; }
        timer = window.setTimeout(() => show(href), PREVIEW_DWELL);
    };

    return settle;
}

/* ---- Forgetting it ------------------------------------------------- */

/* "Clear data" in the settings panel says it forgets bookmarks, reading
   history, hidden members and the Releases cache — everything the
   script keeps for itself. The index of titles is that too, and it is
   the largest of them; it lives on its own key rather than in rr:data,
   so store.replace({}) does not reach it and it has to be named. */
function forgetTopicIndex() {
    bucket.drop(TOPIC_BUCKET);
    bucket.drop("lastSearch");
}

/* ---- Boot ---------------------------------------------------------- */

function initTopicIndex() {
    /* A search from the board's own box spends the same interval the
       palette's row does. Caught here rather than in navbar.js so the
       box can be rebuilt without anyone remembering to tell this.
       Capture, because the board's own handler may stop the event. */
    document.addEventListener("submit", (event) => {
        const form = event.target;
        if (!(form instanceof HTMLFormElement)) return;
        if (/search\.php/.test(form.getAttribute("action") || "")) noteBoardSearch();
    }, true);

    /* After the page is drawn. A hundred titles and one write is not
       worth a millisecond of the first paint, and nothing reads the
       index until Ctrl+K. */
    const later = window.requestIdleCallback || ((fn) => window.setTimeout(fn, 400));
    later(() => {
        try {
            harvestTopics();
        } catch (err) {
            console.warn("[RIN Reforged] topic index:", err);
        }
    });
}

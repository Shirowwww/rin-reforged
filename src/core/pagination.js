/* ------------------------------------------------------------------
   Pagination.

   phpBB prints "1, 2, 3 ... 19, Next" and never a link to an arbitrary
   page, so anything that wants to jump has to work the offsets out.

   The approach follows the one worked out in the wefalltomorrow fork of
   CS.RIN.RU Enhanced, rewritten without jQuery: read the numbered
   anchors, derive the posts-per-page step from any two of them, and
   synthesise the href for pages that have no link.
   ------------------------------------------------------------------ */

/** Numbered page anchors on the page, as { page: {href, start} }. */
function pageLinkMap(root = document) {
    const map = new Map();
    for (const link of root.querySelectorAll("a[href]")) {
        const label = link.textContent.trim();
        if (!/^\d+$/.test(label)) continue;              // skip Go, Next, Previous
        const href = link.getAttribute("href");
        if (!href || !/viewtopic|viewforum|search/.test(href)) continue;

        const page = parseInt(label, 10);
        if (map.has(page)) continue;                     // first occurrence wins
        const match = href.match(/[?&]start=(\d+)/);
        map.set(page, { href, start: match ? parseInt(match[1], 10) : 0 });
    }
    return map;
}

/** Posts per page, derived from the offsets of two numbered links. */
function pageStep(map) {
    const entries = Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < entries.length - 1; i += 1) {
        const [page1, first] = entries[i];
        const [page2, second] = entries[i + 1];
        if (page2 <= page1) continue;
        const step = (second.start - first.start) / (page2 - page1);
        if (Number.isInteger(step) && step > 0) return step;
    }
    return null;
}

/** Total page count, from the "Page 1 of 19" the template prints. */
function totalPages() {
    let best = null;
    for (const cell of document.querySelectorAll("td.nav, .nav, .pagination")) {
        // "Page 1 of 19", or "Страница 1 из 19" on the Russian interface.
        // No \b before "из": a JavaScript word boundary is ASCII-only and
        // never fires next to a Cyrillic letter.
        const match = cell.textContent.match(/(?:^|\s)(?:of|из)\s+(\d+)(?!\d)/);
        if (!match) continue;
        const value = parseInt(match[1], 10);
        if (value > 0 && (best === null || value > best)) best = value;
    }
    return best;
}

/** The page being viewed, from the bold entry in the pagination strip. */
function currentPage() {
    const start = Number(PAGE.start) || 0;
    const map = pageLinkMap();
    const step = pageStep(map);
    if (step) return Math.floor(start / step) + 1;

    for (const strong of document.querySelectorAll("td.nav strong, .nav strong")) {
        const text = strong.textContent.trim();
        if (/^\d+$/.test(text)) return parseInt(text, 10);
    }
    return 1;
}

/**
 * A URL for the given page number: a real link when the template
 * printed one, otherwise the current URL with start= rewritten.
 */
function pageHref(page) {
    if (page < 1) return null;

    const map = pageLinkMap();
    const known = map.get(page);
    if (known) return known.href;

    const step = pageStep(map);
    if (step === null) return null;

    const start = (page - 1) * step;
    const url = new URL(location.href);
    if (start === 0) url.searchParams.delete("start");
    else url.searchParams.set("start", String(start));
    return url.toString();
}

/** Everything a caller usually needs, in one read. */
function pagination() {
    const total = totalPages();
    const current = currentPage();
    return {
        current,
        total,
        step: pageStep(pageLinkMap()),
        hasNext: total !== null && current < total,
        hasPrevious: current > 1,
        first: pageHref(1),
        last: total ? pageHref(total) : null,
        next: pageHref(current + 1),
        previous: pageHref(current - 1),
    };
}

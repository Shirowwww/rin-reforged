/* Folding quotes: other scripts fix long quoted replies by rebuilding the
   quote node, which loses links/nested quotes and breaks under Trusted
   Types. This only clips with overflow+mask, so the DOM, a11y tree and
   find-in-page stay intact. */

/** Quote blocks in post content, outermost first. Excludes spoilers, which
    also wear `.quotecontent` on this board and already fold themselves. */
function quoteBlocks(root = document) {
    return Array.from(root.querySelectorAll(".postbody .quotecontent, .postbody blockquote"))
        .filter((node) => !(node.parentElement && node.parentElement.classList.contains("spoiler")));
}

/** The heading above a quote ("Someone wrote:"): subsilver2's div.quotetitle,
    or a <blockquote>'s own <cite> — the toggle joins whichever exists. */
function quoteHeading(quote) {
    const previous = quote.previousElementSibling;
    if (previous && previous.classList.contains("quotetitle")) return previous;
    const cite = quote.firstElementChild;
    if (cite && cite.tagName === "CITE") return cite;
    return null;
}

/** Fold height for this quote, or null if it fits within `lines`. Reads
    only — see initQuotes for why reads and writes are kept apart. */
function measureQuote(quote, lines) {
    if (quote.hasAttribute("data-rr-quote")) return null;

    // scrollHeight includes padding but max-height (below) is content-box;
    // subtract padding here or a quote right at the limit gets folded to a
    // box it already fits.
    const style = getComputedStyle(quote);
    const lineHeight = parseFloat(style.lineHeight) || 20;
    const padding = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
    const content = quote.scrollHeight - padding;
    const limit = lineHeight * lines;
    if (content <= limit + lineHeight * 0.5) return null; // half a line of slack
    return limit;
}

/** Fold one quote to `limit` pixels, with the control to open it. Writes only. */
function foldQuote(quote, limit) {
    quote.setAttribute("data-rr-quote", "folded");
    quote.style.setProperty("--rr-quote-max", limit + "px");

    const label = () => (quote.getAttribute("data-rr-quote") === "folded" ? "Show the rest" : "Fold this quote");

    const toggle = el("button.rr-quote-toggle", {
        type: "button",
        "aria-expanded": "false",
    }, [icon("chevronD", 12), el("span", {}, [label()])]);

    const setOpen = (open) => {
        if (open) quote.removeAttribute("data-rr-quote");
        else quote.setAttribute("data-rr-quote", "folded");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.lastChild.textContent = label();
    };
    toggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        setOpen(quote.getAttribute("data-rr-quote") === "folded");
    });

    // Clicking the clipped body opens it too, not just the toggle; links stay links.
    quote.addEventListener("click", (event) => {
        if (quote.getAttribute("data-rr-quote") !== "folded") return;
        if (event.target.closest("a, button, input, textarea, select")) return;
        setOpen(true);
    });

    const heading = quoteHeading(quote);
    if (heading) heading.append(toggle);
    else quote.before(toggle);

    return true;
}

function initQuotes() {
    if (!PAGE.isTopic || !settings.get("foldQuotes")) return;

    const lines = clamp(Number(settings.get("foldQuotesLines")) || 6, 3, 16);

    // All quotes measured first, then folded — interleaving read/write forces a layout per quote.
    const plan = quoteBlocks().map((quote) => ({ quote, limit: measureQuote(quote, lines) }));

    let folded = 0;
    for (const { quote, limit } of plan) {
        if (limit === null) continue;
        // Skip quotes already hidden inside an outer fold (outermost fold first, in document order).
        if (quote.parentElement && quote.parentElement.closest('[data-rr-quote="folded"]')) continue;
        foldQuote(quote, limit);
        folded += 1;
    }
    return folded;
}

/* ------------------------------------------------------------------
   Folding quotes.

   A reply that quotes three paragraphs to add one line reads as four
   paragraphs, and a page of those is most of what makes a long thread
   hard to skim. Every script that has tried to fix this on this board
   has done it by rebuilding the quote node — read the text out, throw
   the node away, put a new one back. That loses whatever was inside:
   the links, the nested quotes, the handlers another script attached,
   and, under a Trusted Types policy, it does not run at all.

   Nothing here removes anything. A folded quote is the same nodes in
   the same place with a smaller box drawn around them: `overflow` and
   a mask do the folding, so the text stays laid out, stays in the
   accessibility tree, stays findable by the browser's own find-in-page,
   and stays visible to the finder, which reads the DOM.

   That is the whole difference between "folded" and "gone", and it is
   the reason the earlier attempt was refused.
   ------------------------------------------------------------------ */

/** Quote blocks in post content, outermost first. */
function quoteBlocks(root = document) {
    return Array.from(root.querySelectorAll(".postbody .quotecontent, .postbody blockquote"));
}

/**
 * The heading the board prints above a quote ("Someone wrote:").
 *
 * subsilver2 emits div.quotetitle immediately before div.quotecontent.
 * A <blockquote> carries its own <cite> inside instead. Either is a
 * label already sitting where the control belongs, so the toggle joins
 * it rather than adding a strip of its own.
 */
function quoteHeading(quote) {
    const previous = quote.previousElementSibling;
    if (previous && previous.classList.contains("quotetitle")) return previous;
    const cite = quote.firstElementChild;
    if (cite && cite.tagName === "CITE") return cite;
    return null;
}

/**
 * How tall the fold would be for this quote, or null when it fits
 * within `lines` and is left alone. Reads only — see initQuotes for
 * why the reads and the writes are kept apart.
 */
function measureQuote(quote, lines) {
    if (quote.hasAttribute("data-rr-quote")) return null;

    // Measured, not guessed: a quote of two long lines and a quote of
    // six short ones are the same number of characters and only one of
    // them is worth folding.
    //
    // Both numbers have to be content-box or the comparison is off by
    // the padding: max-height below sizes the content box, while
    // scrollHeight counts the padding too. Read together, a quote of
    // exactly the limit measured a line and a bit over it and got
    // folded to a box it already fitted — a control, a mask and a
    // click, for nothing hidden.
    const style = getComputedStyle(quote);
    const lineHeight = parseFloat(style.lineHeight) || 20;
    const padding = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
    const content = quote.scrollHeight - padding;
    const limit = lineHeight * lines;
    // Half a line of slack, so a quote that spills by a word is left
    // alone rather than folded to save four pixels.
    if (content <= limit + lineHeight * 0.5) return null;
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

    // Clicking the clipped body opens it too — the mask is an obvious
    // "there is more here" and a reader should not have to find the
    // control to act on it. Not on a link, which is still a link.
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

    /* Every quote is measured first and only then is any of them
       changed. Reading a height after writing to the page forces a
       layout, one per quote when the two are interleaved; read
       together they cost one. */
    const plan = quoteBlocks().map((quote) => ({ quote, limit: measureQuote(quote, lines) }));

    let folded = 0;
    for (const { quote, limit } of plan) {
        if (limit === null) continue;
        // A quote nested inside one that is already folded would draw a
        // control nobody can reach until the outer one opens, and the
        // outer fold already hides it. Outermost come first in document
        // order, so the outer fold is in place by the time the inner
        // one is asked about.
        if (quote.parentElement && quote.parentElement.closest('[data-rr-quote="folded"]')) continue;
        foldQuote(quote, limit);
        folded += 1;
    }
    return folded;
}

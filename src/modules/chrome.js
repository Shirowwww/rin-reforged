/* ------------------------------------------------------------------
   Page furniture: reading progress and the floating jump buttons.

   Both are position:fixed and outside the forum markup, so neither can
   push the layout around.
   ------------------------------------------------------------------ */

/**
 * How far down the page you are.
 *
 * A reading indicator drawn at y=0 and part-filled at load is a
 * loading indicator that has stalled, which is how this one was
 * reported. So it sits on the bottom edge of the sticky bar rather
 * than floating, stays out of the way until the page has actually been
 * scrolled, and is a real progressbar with a name and a value.
 */
function initProgress() {
    if (!settings.get("progress")) return;

    const bar = el("div.rr-progress", {
        role: "progressbar",
        "aria-label": "How far down this page you are",
        "aria-valuemin": "0",
        "aria-valuemax": "100",
        "aria-valuenow": "0",
        "data-rr-idle": "",
    });
    document.body.append(bar);

    let ticking = false;
    const update = () => {
        const doc = document.documentElement;
        const scrollable = doc.scrollHeight - doc.clientHeight;
        const percent = scrollable > 0 ? clamp((window.scrollY / scrollable) * 100, 0, 100) : 0;
        bar.style.width = percent.toFixed(2) + "%";
        bar.setAttribute("aria-valuenow", String(Math.round(percent)));
        // A page with nothing below the fold has no progress to report,
        // and a page still at the top has not started.
        bar.toggleAttribute("data-rr-idle", scrollable <= 0 || percent < 0.5);
        ticking = false;
    };
    on(window, "scroll", () => {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    // A page that grows after load — images arriving, a spoiler opened,
    // the releases panel filling in — changes the denominator, and
    // without this the bar keeps answering the old question until the
    // next scroll.
    /* The first reading is not taken here.
     *
     * `scrollHeight` makes the browser lay the whole page out before it
     * can answer, and this runs while the stylesheet is still holding
     * the page back — so the reader waits for a number that says
     * "you are at the top", which is the state the bar is already
     * drawn in. A ResizeObserver's first callback arrives after the
     * layout the first paint needed anyway, so it costs nothing. */
    if (window.ResizeObserver) new ResizeObserver(() => update()).observe(document.documentElement);
    else requestAnimationFrame(update);
}

/* The two floating buttons.

   A rounded square in the bottom right corner with a single downward
   arrow in it and no words anywhere near it is the least phpBB thing
   on the page, and it was reported as exactly that: an unidentifiable
   control. It had a `title`, which is a second of hovering away and
   invisible to anyone who never hovers it.

   So both get the same instant label the top bar's icons now get,
   drawn above and to the right so it stays inside the window in the
   one corner where a centred tooltip could not. */
function initJumpButtons() {
    if (!settings.get("backToTop")) return;

    const tip = (node, text) => {
        labelled(node, text);
        node.setAttribute("data-rr-tip-side", "above");
        return node;
    };

    const up = tip(el("button", { type: "button", hidden: true }, [icon("arrowUp")]),
        "Back to top (g then t)");
    up.addEventListener("click", () => window.scrollTo({ top: 0, behavior: scrollBehaviour() }));

    // Hidden until the first reading says otherwise, so a page with
    // nothing below the fold never shows it at all.
    const down = tip(el("button", { type: "button", hidden: true }, [icon("arrowDown")]),
        "Jump to the end (g then b)");
    down.addEventListener("click", () => window.scrollTo({ top: document.body.scrollHeight, behavior: scrollBehaviour() }));

    const fab = el("div.rr-fab", {}, [up, down]);
    document.body.append(fab);

    const update = () => {
        const doc = document.documentElement;
        up.hidden = window.scrollY < 400;
        down.hidden = window.scrollY > doc.scrollHeight - doc.clientHeight - 400;
    };
    on(window, "scroll", update, { passive: true });
    // Same reason as the progress bar: reading the page height here
    // costs a full layout inside the gate that holds the page back,
    // and the answer only decides whether a button in the corner is
    // drawn. One frame later it is free.
    requestAnimationFrame(update);
}

/** The board renders a donation overlay on every visit until its cookie
    is set. Nothing here removes it; it is only made keyboard-closable,
    which the original markup is not. */
function fixOverlayFocus() {
    const overlay = document.getElementById("overlay");
    if (!overlay || overlay.style.display === "none") return;
    const close = document.getElementById("overlayconfirmbtn");
    if (!close) return;
    close.setAttribute("role", "button");
    close.setAttribute("tabindex", "0");
    on(document, "keydown", (event) => {
        if (event.key === "Escape" && overlay.style.display !== "none") close.click();
    });
}

function initChrome() {
    initProgress();
    initJumpButtons();
    fixOverlayFocus();
}

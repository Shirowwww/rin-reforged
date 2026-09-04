/* ------------------------------------------------------------------
   Page furniture: reading progress and the floating jump buttons.

   Both are position:fixed and outside the forum markup, so neither can
   push the layout around.
   ------------------------------------------------------------------ */

/**
 * How far down the page you are.
 *
 * This is a *reading* indicator and it was drawn exactly like a
 * *loading* one: a thin accent-coloured bar pinned to the top left
 * corner of the window, which is where every browser and half the web
 * puts the thing that fills up while a page arrives. On a long topic
 * opened at a saved position it therefore appeared already part-filled
 * and then sat there, and read as a download that had stalled at 15%
 * and never finished — which is exactly what it was reported as.
 *
 * Nothing about the measurement was wrong. Three things about the
 * presentation were:
 *
 *  - it floated at y=0 rather than belonging to anything, so it now
 *    sits on the bottom edge of the sticky top bar and reads as that
 *    bar's own rule filling in;
 *  - it appeared at page load already part-way along, so it now stays
 *    out of the way until the page has actually been scrolled;
 *  - it said nothing about itself, so it is a real progressbar with a
 *    name and a value that can be read aloud and asserted in a test.
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
    if (window.ResizeObserver) new ResizeObserver(() => update()).observe(document.documentElement);
    update();
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

    const down = tip(el("button", { type: "button" }, [icon("arrowDown")]),
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
    update();
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

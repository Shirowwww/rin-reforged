/* Page furniture: reading progress and the floating jump buttons, both
   position:fixed and outside the forum markup so neither shifts the layout. */

/** A progress bar drawn part-filled at load reads as a stalled loading
 *  indicator (reported as a bug), so it sits on the sticky bar's bottom
 *  edge and stays hidden until the page has actually scrolled. */
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
        bar.toggleAttribute("data-rr-idle", scrollable <= 0 || percent < 0.5);
        ticking = false;
    };
    on(window, "scroll", () => {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    // Re-measure when the page grows after load (images, a spoiler, the releases panel).
    // Not measured here up front: scrollHeight forces a full layout while the
    // stylesheet still holds the page hidden. ResizeObserver's first callback
    // arrives after that layout happens anyway, so it's free.
    if (window.ResizeObserver) new ResizeObserver(() => update()).observe(document.documentElement);
    else requestAnimationFrame(update);
}

// An unlabeled arrow button was reported as unidentifiable; a `title` tooltip
// wasn't enough, so both buttons get the same instant label the top bar icons use.
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
    // Deferred one frame for the same layout-cost reason as the progress bar above.
    requestAnimationFrame(update);
}

/** Only makes the board's own donation overlay keyboard-closable (Escape); doesn't remove it. */
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

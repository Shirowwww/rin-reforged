/* ------------------------------------------------------------------
   The board index.

   Two things dominate it: a list of every one of the 500-odd people
   currently online, and a login form. Both are folded down to what a
   reader actually wants at a glance, with the full version one click
   away.
   ------------------------------------------------------------------ */

/** "In total there are 513 users online :: 326 registered, ..." */
function onlineSummary(text, names) {
    const total = text.match(/there are\s+(\d+)\s+users? online|всего\s+(\d+)\s+пользовател/i);
    const registered = text.match(/(\d+)\s+(?:registered|зарегистрированн)/i);
    const guests = text.match(/(\d+)\s+(?:guests?|гост)/i);
    const hidden = text.match(/(\d+)\s+(?:hidden|скрыт)/i);

    const parts = [];
    if (total) parts.push(t("{n} online", { n: total[1] || total[2] }));
    else if (names) parts.push(t("{n} browsing", { n: names }));   // a forum or topic foot: "Users browsing this forum: …"
    if (registered) parts.push(t("{n} registered", { n: registered[1] }));
    if (hidden) parts.push(t("{n} hidden", { n: hidden[1] }));
    if (guests) parts.push(t("{n} guests", { n: guests[1] }));
    return parts.join(" · ");
}

/**
 * The cell holding the list of everyone online.
 *
 * Found by what it contains rather than by the heading above it. The
 * heading used to be the anchor — a cell whose text is exactly "Who is
 * online" — and this board is bilingual: on its Russian half that
 * heading is "Кто сейчас на конференции" and the whole feature silently
 * did nothing. A cell holding several hundred links to member profiles
 * is the same cell in either language.
 */
function whoIsOnlineCell() {
    let best = null;
    let most = 0;
    for (const cell of document.querySelectorAll("#wrapcentre td.row1, #wrapcentre td.row2")) {
        // Not the forum listing: a row there has one or two profile
        // links in it, never thirty.
        if (cell.querySelector("a.forumlink, a.topictitle")) continue;
        const count = cell.querySelectorAll("a[href*='viewprofile']").length;
        if (count > most) { most = count; best = cell; }
    }
    return most >= 30 ? best : null;      // a short list is fine as it is
}

function collapseWhoIsOnline() {
    const body = whoIsOnlineCell();
    if (!body) return;

    const names = body.querySelectorAll("a[href*='viewprofile']");
    const summary = onlineSummary(body.textContent, names.length);

    // Moved, not rebuilt: every name keeps its link, its role colour
    // and anything another script attached to it.
    const holder = el("div");
    while (body.firstChild) holder.append(body.firstChild);

    let open = store.get("whoIsOnlineOpen", false);
    holder.hidden = !open;

    const label = () => (open ? t("Hide the list") : t("Show all {n} names", { n: names.length }));
    const toggle = el("button.rr-btn", {
        type: "button",
        "data-variant": "quiet",
        "aria-expanded": open ? "true" : "false",
    }, [icon("chevronD"), label()]);

    toggle.addEventListener("click", () => {
        open = !open;
        holder.hidden = !open;
        toggle.lastChild.textContent = label();
        toggle.firstChild.style.transform = open ? "rotate(180deg)" : "";
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        store.set("whoIsOnlineOpen", open);
    });

    body.append(
        el("div.rr-online", {}, [
            el("span.rr-online__summary", {}, [summary || names.length + " people online"]),
            toggle,
        ]),
        holder,
    );
}

/**
 * The index prints the same search box twice, above and below the forum
 * list, each in a full-width strip of its own. With search in the top
 * bar both are redundant; without it, the first one stays.
 */
function dropDuplicateSearch() {
    const boxes = Array.from(document.querySelectorAll("#wrapcentre #search-box"));
    const keepFirst = !settings.get("navbar");

    boxes.forEach((box, index) => {
        if (keepFirst && index === 0) return;
        const strip = box.closest("table.tablebg");
        if (strip && !strip.querySelector("a.forumlink, a.topictitle")) strip.style.display = "none";
    });
}

/* ---- Category collapse ------------------------------------------- */

/**
 * The board's own "collapse this category" control.
 *
 * It is an `<input type="button">` carrying `value=" "` — a single
 * space — and drawn entirely by a 12x12 background image the board
 * injects in a <style> block. Two things follow, and neither was being
 * handled.
 *
 * It has no accessible name. `value` is what names an input button,
 * and a space is not a name: a screen reader reaches a button and can
 * say nothing about it, on the one control that folds a whole category
 * of the board away. The heading beside it is the name, so that is what
 * goes on it.
 *
 * And it cannot be redrawn from the stylesheet alone. An <input> is a
 * replaced element: `::before` and `::after` generate nothing on it, so
 * the chevron an earlier version of this drew that way rendered as an
 * empty box with a border — worse than the GIF it replaced, and on the
 * light theme invisible. The glyph therefore has to be the value, which
 * is where the board already puts one.
 *
 * The board's own handler is untouched: the click is still its click,
 * and `flipf()` reads the class rather than the value, so writing one
 * cannot confuse it.
 */
function tidyCategoryToggles() {
    for (const toggle of document.querySelectorAll("#wrapcentre .ccclose, #wrapcentre .ccopen")) {
        if (toggle.hasAttribute("data-rr-cc")) continue;
        toggle.setAttribute("data-rr-cc", "");

        // The heading is in a sibling cell — the control gets a cell to
        // itself — so the row is what has to be read.
        const heading = toggle.closest("tr")?.textContent.replace(/\s+/g, " ").trim().slice(0, 60);

        const sync = () => {
            const collapsed = toggle.classList.contains("ccopen");
            const name = t(collapsed ? "Show " : "Hide ") + (heading || t("this category"));
            toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
            toggle.setAttribute("title", name);
            toggle.setAttribute("aria-label", name);
            // Decorative: aria-label above is what is read out. The same
            // glyph either way; the stylesheet turns the closed one to
            // point right, so the pair reads closed ▸ / open ▾ rather
            // than ▸ / ▴, which pointed two ways at once.
            const glyph = "\u25BE";
            if (toggle.tagName === "INPUT") toggle.value = glyph;
            else toggle.textContent = glyph;
        };

        // An <input type="button"> is already a button and already a
        // tab stop. A <div> with an onclick, which other phpBB styles
        // use for the same control, is neither — so both are covered
        // rather than assuming which one this board ships.
        if (toggle.tagName !== "INPUT" && toggle.tagName !== "BUTTON") {
            toggle.setAttribute("role", "button");
            toggle.setAttribute("tabindex", "0");
            toggle.addEventListener("keydown", (event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                toggle.click();
            });
        }

        /* The box, set inline rather than from the stylesheet.

           The board sizes this control from a <style> block it writes
           into the body, and the generic input[type=button] styling in
           forum.css also matches it; between them a class rule loses
           the padding, the border and — measurably — the font size,
           which resolved to 0px and made the glyph invisible whatever
           it was. An inline style is what the icon pass already uses
           to take an imageset GIF out of the way, and it is the one
           thing neither of those can outrank. Colour and hover stay in
           the stylesheet, where they can follow the theme. */
        Object.assign(toggle.style, {
            width: "24px",
            height: "24px",
            minWidth: "0",
            padding: "0",
            fontSize: "12px",
            lineHeight: "1",
            backgroundImage: "none",
        });

        sync();
        // The board's handler swaps the class rather than telling
        // anyone, so the state is read back off it afterwards.
        toggle.addEventListener("click", () => setTimeout(sync, 0));
    }
}

function initBoardIndex() {
    // The list of who is online ends every forum and every topic too —
    // 272 names and 360px under the last post — and the fold is the
    // same fold: it finds the cell by what is in it, not by page.
    if (settings.get("foldWhoIsOnline")) collapseWhoIsOnline();
    if (!PAGE.isIndex) return;
    dropDuplicateSearch();
    tidyCategoryToggles();
}

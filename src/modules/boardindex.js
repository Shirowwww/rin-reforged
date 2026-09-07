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

function collapseWhoIsOnline(body) {
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
 * The board's own "collapse this category" control: an `<input
 * type="button">` carrying `value=" "`, drawn by a 12x12 background
 * image from a <style> block, alone at the right end of a cell that
 * spans three columns — a thousand pixels from the heading it belongs
 * to, with no accessible name, on a row that gives no other sign it
 * opens at all.
 *
 * Redrawing it where it stood was a losing fight: an <input> is a
 * replaced element, so `::before` generates nothing on it, and between
 * the board's own <style> and the generic input[type=button] rules a
 * class selector kept losing the size and the font — which is how the
 * control came to be a bare text triangle. So it is hidden and kept
 * for its handler, which is the part that matters: `flipf()` reads its
 * class, flips it, and shows or hides the category. A chevron beside
 * the heading clicks it, and the heading cell folds on a click of its
 * own, the way a listing's section heading already does.
 */
function tidyCategoryToggles() {
    for (const native of document.querySelectorAll("#wrapcentre .ccclose, #wrapcentre .ccopen")) {
        if (native.hasAttribute("data-rr-cc")) continue;
        native.setAttribute("data-rr-cc", "");

        // The heading is in a sibling cell — the control gets a cell to
        // itself — so the row is what has to be walked to reach it.
        const row = native.closest("tr");
        const cell = row && row.querySelector("td.cat");
        if (!cell) continue;
        const heading = cell.textContent.replace(/\s+/g, " ").trim().slice(0, 60);

        native.style.display = "none";

        const fold = el("button.rr-catfold", { type: "button" }, [icon("chevronD", 13)]);
        const sync = () => {
            const collapsed = native.classList.contains("ccopen");
            const name = t(collapsed ? "Show " : "Hide ") + (heading || t("this category"));
            row.toggleAttribute("data-rr-folded", collapsed);
            fold.setAttribute("aria-expanded", collapsed ? "false" : "true");
            fold.setAttribute("title", name);
            fold.setAttribute("aria-label", name);
        };
        // The board's handler swaps the class rather than telling
        // anyone, so the state is read back off it afterwards.
        const flip = () => {
            native.click();
            setTimeout(sync, 0);
        };

        fold.addEventListener("click", flip);
        // The heading itself is a link to the category's own page, so a
        // click on the words still goes there; the rest of the cell
        // folds.
        cell.addEventListener("click", (event) => {
            if (event.target instanceof Element && event.target.closest("a, input, select, button")) return;
            flip();
        });

        cell.classList.add("rr-catfold-cell");
        cell.prepend(fold);
        sync();
    }
}

function initBoardIndex() {
    // The list of who is online ends every forum and every topic too —
    // 272 names and 360px under the last post — and the fold is the
    // same fold: it finds the cell by what is in it, not by page.
    //
    // Marked whether or not it folds: the legend under it says red
    // means an administrator, and the board sends these four hundred
    // names as bare links, so painting them all link-red said every one
    // of them was staff. The mark is what the stylesheet quiets them
    // with; a name the board did colour keeps its colour, an inline
    // style outranking anything here.
    const online = whoIsOnlineCell();
    if (online) {
        online.setAttribute("data-rr-online", "");
        if (settings.get("foldWhoIsOnline")) collapseWhoIsOnline(online);
    }
    if (!PAGE.isIndex) return;
    dropDuplicateSearch();
    tidyCategoryToggles();
}

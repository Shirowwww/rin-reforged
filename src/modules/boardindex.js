/* The board index: an online list of 500-odd names and a login form,
   both folded to a glance with the full version one click away. */

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

/** Found by content (30+ profile links), not the "Who is online" heading —
 *  that text differs on the Russian half and silently broke this before. */
function whoIsOnlineCell() {
    let best = null;
    let most = 0;
    for (const cell of document.querySelectorAll("#wrapcentre td.row1, #wrapcentre td.row2")) {
        // Skip the forum listing: a row there has at most a couple of profile links.
        if (cell.querySelector("a.forumlink, a.topictitle")) continue;
        const count = cell.querySelectorAll("a[href*='viewprofile']").length;
        if (count > most) { most = count; best = cell; }
    }
    return most >= 30 ? best : null;
}

function collapseWhoIsOnline(body) {
    const names = body.querySelectorAll("a[href*='viewprofile']");
    const summary = onlineSummary(body.textContent, names.length);

    // Moved, not rebuilt, so each name keeps its link, colour and listeners.
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

/** The index has this search box twice; with the top bar's search both are
 *  redundant, without it the first one stays. */
function dropDuplicateSearch() {
    const boxes = Array.from(document.querySelectorAll("#wrapcentre #search-box"));
    const keepFirst = !settings.get("navbar");

    boxes.forEach((box, index) => {
        if (keepFirst && index === 0) return;
        const strip = box.closest("table.tablebg");
        if (strip && !strip.querySelector("a.forumlink, a.topictitle")) strip.style.display = "none";
    });
}

/** The board's native toggle is an unlabeled 12x12 background-image button
 *  far from its heading and can't be restyled (replaced element, its own
 *  <style> wins) — so it's hidden and driven via its ccopen/ccclose class,
 *  with a chevron by the heading and the whole cell clickable instead. */
function tidyCategoryToggles() {
    for (const native of document.querySelectorAll("#wrapcentre .ccclose, #wrapcentre .ccopen")) {
        if (native.hasAttribute("data-rr-cc")) continue;
        native.setAttribute("data-rr-cc", "");

        // The heading lives in a sibling cell, so walk up to the row to reach it.
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
        // The board's handler swaps the class but fires no event, so re-read it after.
        const flip = () => {
            native.click();
            setTimeout(sync, 0);
        };

        fold.addEventListener("click", flip);
        // The heading text is still a link to its own page; only the rest of the cell folds.
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
    // The same online-users list ends every forum and topic page too.
    const online = whoIsOnlineCell();
    if (online && settings.get("foldWhoIsOnline")) collapseWhoIsOnline(online);
    if (!PAGE.isIndex) return;
    dropDuplicateSearch();
    tidyCategoryToggles();
}

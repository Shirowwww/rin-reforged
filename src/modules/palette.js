/* ------------------------------------------------------------------
   Command palette.

   The forum has one search box that reloads the page, and no way to
   reach a board without going back to the index. Ctrl+K covers both,
   plus bookmarks, recent topics and every script action.

   The forum list is cached the first time the index is visited, so the
   jump list keeps working from any page.
   ------------------------------------------------------------------ */

let paletteHost = null;

/* ---- Searching the board ------------------------------------------ */

/* Left unset, phpBB searches with sr=posts and sf=all — the raw text
   of every post, quotes included, so a thread twelve people quoted the
   same release in came back as twelve results pointing at it. The
   board's own boxes have shipped sr=topics for years; this asks for
   the same. How deep to look is a real choice, so sf is remembered.

   Keyed by the board's own sf value, which is what the search box's
   options (navbar.js, addSearchOptions) store. */
const SEARCH_DEPTH = {
    titleonly: { sf: "titleonly", hint: "titles" },
    firstpost: { sf: "firstpost", hint: "titles + first post" },
    all:       { sf: "all",       hint: "every post" },
};

/**
 * The board's search URL for a query, from wherever the reader is.
 * Scoped to the current board when there is one, the way the board's
 * own "Search this forum" box is.
 */
/**
 * Which forum a search from the palette goes to, or null for the board.
 *
 * The same answer the box in the bar gives, from the same two places:
 * the breadcrumb, because half the links on this board carry no forum
 * id and PAGE.forumId is null on any topic reached from a listing;
 * and the remembered choice, so the palette and the box cannot
 * disagree about where a search goes.
 */
function paletteSearchPlace() {
    if (!(PAGE.isForum || PAGE.isTopic)) return null;
    const trail = forumTrail();
    if (!trail.length) return null;
    const here = trail[trail.length - 1];
    const up = parentForum(trail);
    const kept = searchPrefs().where;
    if (kept === "board") return null;
    if (kept === "here") return here;
    if (kept === "up") return up || here;
    // Nobody has chosen: the forum above a topic, the forum itself on
    // a listing. See parentForum().
    return PAGE.isTopic ? (up || here) : here;
}

function boardSearchUrl(query) {
    const depth = SEARCH_DEPTH[searchDepthChoice()] || SEARCH_DEPTH.titleonly;
    const place = paletteSearchPlace();
    const url = new URL("./search.php", location.href);
    url.searchParams.set("keywords", query);
    url.searchParams.set("terms", "all");
    url.searchParams.set("sf", depth.sf);
    url.searchParams.set("sr", "topics");
    if (place) url.searchParams.set("fid[]", place.id);
    return url.toString();
}

function cacheForumList() {
    if (!PAGE.isIndex) return;

    const forums = forumRows().map((entry) => {
        // The topic count sits in the cell the listing labels "topics";
        // it is the only ranking signal on the page, and it puts Main
        // Forum above boards nobody posts in.
        const cell = entry.row.querySelector('td[data-rr-col="topics"]');
        const topics = cell ? parseInt(cell.textContent.replace(/\D/g, ""), 10) : 0;
        return {
            id: entry.id,
            title: entry.title,
            href: "./viewforum.php?f=" + entry.id,
            topics: Number.isFinite(topics) ? topics : 0,
        };
    });

    forums.sort((a, b) => b.topics - a.topics);
    if (forums.length) store.set("forums", forums);
}

/** The board's own donation link, wherever the template put it. */
function donateHref() {
    const link = Array.from(document.querySelectorAll('#wrapheader a[href], .rr-boardbar a[href]'))
        .find((a) => /donat/i.test(a.getAttribute("href") || "") || /donat/i.test(a.textContent || ""));
    return link ? link.getAttribute("href") : null;
}

function paletteActions() {
    const actions = [
        { label: "Open settings", icon: "settings", run: () => openSettings() },
        { label: "Keyboard shortcuts", icon: "keyboard", run: () => openShortcutSheet() },
        { label: "Board index", icon: "home", href: "./index.php" },
        // The board is hosted on donations and is asking for them. The
        // masthead's own link is lifted into the board bar; this is the
        // same destination, reachable from anywhere without going back
        // to the top of the page.
        { label: "Donate to the board", icon: "heart", href: donateHref() || "./donate.php" },
        { label: "View active topics", icon: "clock", href: "./search.php?search_id=active_topics" },
        { label: "View unanswered posts", icon: "clock", href: "./search.php?search_id=unanswered" },
        {
            label: "Switch theme",
            icon: "layers",
            run: () => {
                const order = ["native", "slate", "carbon", "paper"];
                const next = order[(order.indexOf(settings.get("theme")) + 1) % order.length];
                settings.set("theme", next);
                toast("Theme: " + next);
            },
        },
    ];

    if (PAGE.isTopic) {
        actions.unshift({
            label: "Copy link to this topic",
            icon: "link",
            run: () => copyText(location.origin + location.pathname + "?t=" + PAGE.topicId, "Topic link copied"),
        });
        actions.unshift({
            label: "Jump to the last page",
            icon: "arrowDown",
            run: () => {
                const info = pagination();
                if (info.last && info.hasNext) location.href = info.last;
                else toast("Already on the last page");
            },
        });
    }
    return actions;
}

function collectItems() {
    const groups = [];

    /* A bookmark and a recent topic are topics, so they get the pane
       beside the palette too (preview.js): the palette opens on these
       two lists, and resting on one is the first thing anybody does
       with it. `preview` is the URL to read; a board or an action has
       none and gets no pane. */
    const bookmarks = store.get("bookmarks", []);
    if (bookmarks.length) {
        groups.push({
            title: "Bookmarks",
            items: bookmarks.map((item) => ({
                label: item.title, icon: "star", hint: t("topic"), href: item.href, preview: item.href,
            })),
        });
    }

    const forums = store.get("forums", []);
    if (forums.length) {
        groups.push({
            title: t("Boards"),
            items: forums.map((item) => ({
                label: item.title, icon: "layers", hint: t("board"), href: item.href,
            })),
        });
    }

    const history = store.get("history", []);
    if (history.length) {
        groups.push({
            title: t("Recent"),
            items: history.slice(0, 12).map((item) => ({
                label: item.title, icon: "clock", hint: t("topic"), href: item.href, preview: item.href,
            })),
        });
    }

    /* On a topic page the actions are about this topic — copy its
       link, jump to its last page — and were under seven boards and six
       recent topics, below the fold of the palette. First, there. */
    const actions = { title: t("Actions"), items: paletteActions() };
    if (PAGE.isTopic) groups.unshift(actions);
    else groups.push(actions);
    return groups;
}

function openPalette() {
    if (paletteHost) return;
    // The settings panel and the shortcut sheet are modal. Ctrl+K over
    // one of them used to draw the palette on top, with two focus traps
    // fighting over Tab and Escape closing whichever listener ran last.
    if (document.querySelector(".rr-panel, .rr-sheet")) return;

    const groups = collectItems();
    const input = el("input.rr-palette__input", {
        type: "text",
        placeholder: t("Search the forum, or jump to a board"),
        "aria-label": "Search or jump to",
        autocomplete: "off",
        spellcheck: "false",
        role: "combobox",
        "aria-expanded": "true",
        "aria-controls": "rr-palette-list",
        "aria-autocomplete": "list",
    });
    // A listbox nobody is told about. The input is what has focus, so
    // the highlighted option has to be named on the input — without
    // aria-activedescendant a screen reader reads the box and never
    // says what pressing Enter would do.
    const list = el("ul.rr-palette__list", { role: "listbox", id: "rr-palette-list" });
    const panel = el("div.rr-palette", { role: "dialog", "aria-modal": "true", "aria-label": "Command palette" }, [input, list]);
    const overlay = el("div.rr-overlay", {}, [panel]);

    let flat = [];
    let cursor = 0;

    const searchItem = (query) => {
        /* It says where it will look. The row said "the forum" and
           searched the board the reader was in — and later named the
           last crumb, which on a topic page is the topic. */
        const place = paletteSearchPlace();
        const cooldown = searchCooldown();
        return {
            label: place
                ? t("Search {forum} for {q}", { forum: place.name, q: query })
                : t("Search the forum for {q}", { q: query }),
            icon: "search",
            /* The board allows one search about every half minute and
               answers the ones in between with "you cannot use search
               at this time" — a page load spent to be told no. The row
               still works; it says what it is about to cost. */
            hint: cooldown
                ? t("wait {n}s", { n: cooldown })
                : (SEARCH_DEPTH[searchDepthChoice()]?.hint || "Enter"),
            href: boardSearchUrl(query),
            run: () => {
                noteBoardSearch();
                location.href = boardSearchUrl(query);
            },
        };
    };

    const render = (query) => {
        list.textContent = "";
        flat = [];
        const needle = query.trim().toLowerCase();

        if (needle) list.append(renderGroup(t("Search"), [searchItem(query.trim())], flat));

        /* Topics this browser has already walked past, filtered as you
           type (preview.js). Above the boards and below the search
           row: what someone typing a game name wants is the thread,
           and the row that hands the query to the board is the one
           thing that can find a thread nobody here has seen. */
        const seen = needle ? topicPaletteItems(needle, 8) : [];
        if (seen.length) list.append(renderGroup(t("Topics"), seen, flat));

        for (const group of groups) {
            const matches = needle
                ? group.items.filter((item) => matchesWords(item.label, needle)).slice(0, 8)
                : group.items.slice(0, group.title === t("Boards") ? 7 : 6);
            if (matches.length) list.append(renderGroup(group.title, matches, flat));
        }

        if (!flat.length) list.append(el("div.rr-palette__empty", {}, [t("Nothing matches that")]));
        cursor = 0;
        highlight();
    };

    const renderGroup = (title, items, sink) => {
        const fragment = document.createDocumentFragment();
        fragment.append(el("li.rr-palette__group", { role: "presentation" }, [title]));
        for (const item of items) {
            // An entry that navigates carries its URL. A listbox option
            // cannot be an <a> without breaking the role, so the URL
            // rides on the element and middle-click and Ctrl+click are
            // handled here — opening a board or a bookmark in a new tab
            // is the first thing anyone tries.
            const node = el("li.rr-palette__item", {
                role: "option",
                id: "rr-palette-opt-" + sink.length,
                "aria-selected": "false",
                "data-href": item.href || null,
            }, [
                icon(item.icon || "chevron"),
                el("span.rr-palette__label", {}, [item.label]),
                item.hint ? el("span.rr-palette__hint", {}, [item.hint]) : null,
            ]);

            const go = item.run || (() => { location.href = item.href; });
            node.addEventListener("click", (event) => {
                if (item.href && (event.ctrlKey || event.metaKey || event.shiftKey)) {
                    window.open(item.href, "_blank", "noopener");
                    return;
                }
                close();
                go();
            });
            node.addEventListener("auxclick", (event) => {
                if (event.button === 1 && item.href) {
                    event.preventDefault();
                    window.open(item.href, "_blank", "noopener");
                }
            });
            node.addEventListener("mousemove", () => { cursor = sink.indexOf(node); highlight(); });
            sink.push(node);
            node._run = go;
            // What the preview pane reads off the cursor (preview.js).
            node._item = item;
            fragment.append(node);
        }
        return fragment;
    };

    // A pane beside the panel, fed by whatever the cursor is on
    // (preview.js). Returns a no-op where there is no room for it.
    const onCursor = attachTopicPreview(overlay, () => (flat[cursor] ? flat[cursor]._item : null));

    const highlight = () => {
        flat.forEach((node, index) => node.setAttribute("aria-selected", index === cursor ? "true" : "false"));
        const current = flat[cursor];
        if (current) {
            current.scrollIntoView({ block: "nearest" });
            input.setAttribute("aria-activedescendant", current.id);
        } else {
            input.removeAttribute("aria-activedescendant");
        }
        onCursor();
    };

    const previous = document.activeElement;
    let release = () => {};
    const close = () => {
        overlay.remove();
        paletteHost = null;
        release();
        document.removeEventListener("keydown", onKey, true);
    };

    const onKey = (event) => {
        if (event.key === "Escape") { event.preventDefault(); close(); }
        else if (event.key === "ArrowDown") { event.preventDefault(); cursor = Math.min(cursor + 1, flat.length - 1); highlight(); }
        else if (event.key === "ArrowUp") { event.preventDefault(); cursor = Math.max(cursor - 1, 0); highlight(); }
        else if (event.key === "Home" && flat.length) { event.preventDefault(); cursor = 0; highlight(); }
        else if (event.key === "End" && flat.length) { event.preventDefault(); cursor = flat.length - 1; highlight(); }
        else if (event.key === "Enter") {
            event.preventDefault();
            const node = flat[cursor];
            if (!node) return;
            const href = node.getAttribute("data-href");
            if (href && (event.ctrlKey || event.metaKey)) {
                window.open(href, "_blank", "noopener");
                return;
            }
            if (node._run) { close(); node._run(); }
        }
    };

    input.addEventListener("input", debounce(() => render(input.value), 60));
    overlay.addEventListener("mousedown", (event) => { if (event.target === overlay) close(); });
    document.addEventListener("keydown", onKey, true);

    document.body.append(overlay);
    paletteHost = overlay;
    render("");
    release = trapFocus(panel, previous instanceof HTMLElement ? previous : null);
    input.focus();
}

function initPalette() {
    cacheForumList();
    if (!settings.get("palette")) return;
    document.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            openPalette();
        }
    });
}

// Command palette (Ctrl+K): search, bookmarks, recent topics, script actions.
// Forum list is cached on first index visit so the jump list works anywhere.

let paletteHost = null;

// Unset, phpBB defaults to sr=posts/sf=all — a quoted post duplicates results
// per quote. Keyed by the board's own sf value (see navbar.js addSearchOptions).
const SEARCH_DEPTH = {
    titleonly: { sf: "titleonly", hint: "titles" },
    firstpost: { sf: "firstpost", hint: "titles + first post" },
    msgonly:   { sf: "msgonly",   hint: "post text" },
    all:       { sf: "all",       hint: "every post" },
};

// Author filter, kept only in memory — a persisted name would silently
// narrow every later search with no chip on screen to show it.
let searchAuthor = "";

// Which forum a search goes to (or null for the whole board) — mirrors the
// navbar box's own logic, since PAGE.forumId is null on listing-reached topics.
function paletteSearchPlace() {
    const kept = searchPrefs().where;
    // Named f:<id> so the navbar box (which only knows here/up/board) falls
    // back to its default instead of misreading a room it has no word for.
    if (kept && kept.slice(0, 2) === "f:") {
        const id = kept.slice(2);
        const name = knownForumName(id);
        return name ? { id: id, name: name } : null;
    }
    if (!(PAGE.isForum || PAGE.isTopic)) return null;
    const trail = forumTrail();
    if (!trail.length) return null;
    const here = trail[trail.length - 1];
    const up = parentForum(trail);
    if (kept === "board") return null;
    if (kept === "here") return here;
    if (kept === "up") return up || here;
    // Default: the topic's parent forum, or the forum itself on a listing.
    return PAGE.isTopic ? (up || here) : here;
}

function boardSearchUrl(query) {
    const depth = SEARCH_DEPTH[searchDepthChoice()] || SEARCH_DEPTH.titleonly;
    const place = paletteSearchPlace();
    const url = new URL("./search.php", location.href);
    // A query with no words is valid as long as an author is set (a member's
    // whole history in a room).
    if (query) url.searchParams.set("keywords", query);
    if (searchAuthor) url.searchParams.set("author", searchAuthor);
    url.searchParams.set("terms", searchChoice("terms", SEARCH_TERMS));
    url.searchParams.set("sf", depth.sf);
    url.searchParams.set("sr", searchChoice("sr", SEARCH_SHOW));
    if (place) url.searchParams.set("fid[]", place.id);
    return url.toString();
}

// The chooser at the head of the field lets a search be aimed (room, depth,
// terms, author) before it's sent, instead of inheriting whatever the navbar
// box was last set to. Sorting/date-range/excerpt length stay on the results page.

const FORUM_TREE_KEY = "forumTree";

// Forum list: the search form's <select> is complete (per-account visibility)
// but rarely visited; the index is seen by everyone but knows less. Index
// fills the list until the form has been opened once.
function storeForumTree(rooms, source) {
    if (!rooms.length) return;
    const kept = store.get(FORUM_TREE_KEY, null);
    if (source === "index" && kept && kept.source === "form") return;
    store.set(FORUM_TREE_KEY, { source: source, rooms: rooms });
}

function forumTree() {
    const kept = store.get(FORUM_TREE_KEY, null);
    return kept && Array.isArray(kept.rooms) ? kept.rooms : [];
}

// Depth = indent the template wrote ("&nbsp; &nbsp;" per level, 3 chars/level).
// A depth-0 row with deeper rows under it and none above is a category heading
// (e.g. "English Forums"), not a searchable room.
function cacheSearchFormForums() {
    const select = document.querySelector('select[name="fid[]"]');
    if (!select) return;

    const rooms = Array.from(select.options).map((option) => {
        const raw = option.textContent || "";
        const title = raw.replace(/[\s ]+/g, " ").trim();
        const lead = raw.length - raw.replace(/^[\s ]+/, "").length;
        return { id: option.value, title: title, depth: Math.min(Math.round(lead / 3), 3) };
    }).filter((room) => /^\d+$/.test(room.id) && room.title);

    rooms.forEach((room, index) => {
        const next = rooms[index + 1];
        if (!room.depth && next && next.depth > room.depth) room.cat = true;
    });
    storeForumTree(rooms, "form");
}

/** The same list off the index, which is poorer but always seen. */
function cacheIndexForums() {
    const rooms = [];
    for (const entry of forumRows()) {
        rooms.push({ id: entry.id, title: entry.title, depth: 0 });
        for (const link of entry.row.querySelectorAll("a.subforum")) {
            const match = (link.getAttribute("href") || "").match(/[?&]f=(\d+)/);
            if (match) rooms.push({ id: match[1], title: link.textContent.trim(), depth: 1 });
        }
    }
    storeForumTree(rooms, "index");
}

// `where` is shared with the navbar box, which only knows here/up/board — a
// picked room matching one of those is stored as that word, else as `f:<id>`.
function scopeValueFor(id) {
    const trail = forumTrail();
    const here = trail.length ? trail[trail.length - 1] : null;
    const up = parentForum(trail);
    if (here && String(here.id) === String(id)) return "here";
    if (up && String(up.id) === String(id)) return "up";
    return "f:" + id;
}

function paletteScopeRooms() {
    const tree = forumTree();
    if (tree.length) return tree;

    // No cache yet (index/search form never opened) — fall back to the breadcrumb.
    const trail = forumTrail();
    const here = trail.length ? trail[trail.length - 1] : null;
    const up = parentForum(trail);
    const rooms = [];
    if (up) rooms.push({ id: String(up.id), title: up.name, depth: 0 });
    if (here && (!up || up.id !== here.id)) rooms.push({ id: String(here.id), title: here.name, depth: up ? 1 : 0 });
    return rooms;
}

// `onPick` redraws the palette: the search row names room/depth/author, so a
// choice here that skipped the redraw would leave a stale answer showing.
function buildPaletteScope(onPick) {
    const rooms = el("div.rr-palette__rooms", { role: "group", "aria-label": t("Where to search") });
    const inSeg = el("div.rr-seg", { role: "group", "aria-label": t("What to search") });
    const termsSeg = el("div.rr-seg", { role: "group", "aria-label": t("Terms") });
    const showSeg = el("div.rr-seg", { role: "group", "aria-label": t("Show") });
    const author = el("input.rr-palette__author", {
        type: "text",
        placeholder: t("Any member"),
        "aria-label": t("Author"),
        autocomplete: "off",
        spellcheck: "false",
    });

    const where = el("span.rr-search__where");
    const button = labelled(
        el("button.rr-search__opts.rr-palette__scope", { type: "button", "aria-expanded": "false" }, [icon("sliders", 13), where]),
        t("Search options"));

    const pop = el("div.rr-palette__pop", { role: "group", "aria-label": t("Search options"), hidden: true }, [
        el("div.rr-palette__poprow", {}, [el("span.rr-search__rowlabel", {}, [t("Where")]), rooms]),
        el("div.rr-search__row", {}, [el("span.rr-search__rowlabel", {}, [t("Look in")]), inSeg]),
        el("div.rr-search__row", {}, [el("span.rr-search__rowlabel", {}, [t("Terms")]), termsSeg]),
        el("div.rr-search__row", {}, [el("span.rr-search__rowlabel", {}, [t("Show")]), showSeg]),
        el("div.rr-search__row", {}, [el("span.rr-search__rowlabel", {}, [t("Author")]), author]),
    ]);

    // Matched by forum id, not stored word — "here" and "f:10" can be the same room.
    const sync = () => {
        const place = paletteSearchPlace();
        const id = place ? String(place.id) : null;
        const depth = searchDepthChoice();
        where.textContent = place ? shortForumName(place.name) : t("Whole board");
        // Room is already shown on the chip; the accent flags the other options.
        button.toggleAttribute("data-rr-active", depth !== "titleonly"
            || Boolean(searchAuthor)
            || searchChoice("terms", SEARCH_TERMS) !== "all"
            || searchChoice("sr", SEARCH_SHOW) !== "topics");
        for (const node of rooms.querySelectorAll("button")) {
            node.setAttribute("aria-pressed", (node.dataset.forum || null) === id ? "true" : "false");
        }
        for (const node of inSeg.children) {
            node.setAttribute("aria-pressed", node.dataset.value === depth ? "true" : "false");
        }
        for (const node of termsSeg.children) {
            node.setAttribute("aria-pressed", node.dataset.value === searchChoice("terms", SEARCH_TERMS) ? "true" : "false");
        }
        for (const node of showSeg.children) {
            node.setAttribute("aria-pressed", node.dataset.value === searchChoice("sr", SEARCH_SHOW) ? "true" : "false");
        }
    };

    const choose = (key, value) => { setSearchPref(key, value); sync(); onPick(); };

    const room = (label, forum, depth) => {
        const node = el("button.rr-palette__room", { type: "button", title: label }, [label]);
        if (forum) node.dataset.forum = forum;
        node.style.paddingLeft = 8 + depth * 12 + "px";
        node.addEventListener("click", () => choose("where", forum ? scopeValueFor(forum) : "board"));
        return node;
    };

    rooms.append(room(t("Whole board"), null, 0));
    for (const entry of paletteScopeRooms()) {
        if (entry.cat) {
            rooms.append(el("div.rr-palette__roomcat", {}, [entry.title]));
            continue;
        }
        rooms.append(room(entry.title, String(entry.id), entry.depth || 0));
    }

    const segment = (seg, options, key) => {
        for (const option of options) {
            const node = el("button", { type: "button" }, [t(option.label)]);
            node.dataset.value = option.value;
            node.addEventListener("click", () => choose(key, option.value));
            seg.append(node);
        }
    };
    segment(inSeg, SEARCH_IN, "sf");
    segment(termsSeg, SEARCH_TERMS, "terms");
    segment(showSeg, SEARCH_SHOW, "sr");

    author.value = searchAuthor;
    author.addEventListener("input", debounce(() => {
        searchAuthor = author.value.trim();
        sync();
        onPick();
    }, 120));

    const close = () => {
        pop.hidden = true;
        button.setAttribute("aria-expanded", "false");
    };
    const open = () => {
        pop.hidden = false;
        button.setAttribute("aria-expanded", "true");
        // Focus the current selection so arrow keys have a starting point.
        const first = rooms.querySelector('button[aria-pressed="true"]') || rooms.firstElementChild;
        if (first) first.focus();
        if (first) first.scrollIntoView({ block: "nearest" });
    };
    button.addEventListener("click", () => {
        if (pop.hidden) open();
        else { close(); button.focus(); }
    });

    // Enter in the author field closes the popover and returns focus to the query.
    author.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        close();
        onPick("focus");
    });

    sync();
    return { button: button, pop: pop, sync: sync, close: close, isOpen: () => !pop.hidden };
}

function cacheForumList() {
    if (!PAGE.isIndex) return;

    const forums = forumRows().map((entry) => {
        // Topic count is the only ranking signal available; sorts busy boards first.
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

    // Two lists for two questions: traffic order for "which board do I mean",
    // board order (with subforums) for "which board do I search".
    cacheIndexForums();
}

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
        // Reuses the masthead's donation link so it's reachable without scrolling up.
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

    // Bookmarks/recent topics get a preview pane (preview.js) via `preview`;
    // boards and actions have none.
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

    // On a topic page, put topic-specific actions first (used to be buried
    // below boards/recent topics).
    const actions = { title: t("Actions"), items: paletteActions() };
    if (PAGE.isTopic) groups.unshift(actions);
    else groups.push(actions);
    return groups;
}

function openPalette() {
    if (paletteHost) return;
    // Settings panel/shortcut sheet are modal; avoid stacking focus traps.
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
    // Focus stays on the input, so aria-activedescendant names the highlighted
    // option for screen readers.
    const list = el("ul.rr-palette__list", { role: "listbox", id: "rr-palette-list" });
    // bar is the positioning anchor for the scope popover.
    const bar = el("div.rr-palette__bar", {}, [input]);
    const panel = el("div.rr-palette", { role: "dialog", "aria-modal": "true", "aria-label": "Command palette" }, [bar, list]);
    const overlay = el("div.rr-overlay", {}, [panel]);

    let flat = [];
    let cursor = 0;

    const searchItem = (query) => {
        const place = paletteSearchPlace();
        const cooldown = searchCooldown();
        return {
            // Four full sentences rather than one assembled from bolted-together pieces.
            label: searchAuthor
                ? (query
                    ? (place
                        ? t("Search {forum} for {q} by {who}", { forum: place.name, q: query, who: searchAuthor })
                        : t("Search the forum for {q} by {who}", { q: query, who: searchAuthor }))
                    : (place
                        ? t("Everything {who} posted in {forum}", { who: searchAuthor, forum: place.name })
                        : t("Everything {who} posted", { who: searchAuthor })))
                : (place
                    ? t("Search {forum} for {q}", { forum: place.name, q: query })
                    : t("Search the forum for {q}", { q: query })),
            icon: "search",
            // Board rate-limits searches (~30s); hint shows the wait instead of a
            // wasted page load that just says no.
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

        // An author alone is a valid search, with or without a query.
        if (needle || searchAuthor) list.append(renderGroup(t("Search"), [searchItem(query.trim())], flat));

        // Previously-seen topics (preview.js), shown above boards: a game name
        // most likely means an existing thread, not a new search.
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
            // data-href carries the URL since role="option" can't be an <a>;
            // handles middle-click/ctrl-click to open in a new tab.
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

    // Preview pane beside the panel (preview.js); no-op when there's no room.
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

    searchAuthor = "";
    const scope = buildPaletteScope((what) => {
        render(input.value);
        if (what === "focus") input.focus();
    });
    bar.prepend(scope.button);
    bar.append(scope.pop);

    const previous = document.activeElement;
    let release = () => {};
    const close = () => {
        overlay.remove();
        paletteHost = null;
        release();
        document.removeEventListener("keydown", onKey, true);
    };

    const onKey = (event) => {
        // Captures on document, so while the popover is open it must defer to
        // it — else Enter/Escape would hit the palette instead of the popover.
        if (scope.isOpen()) {
            if (event.key !== "Escape") return;
            event.preventDefault();
            event.stopPropagation();
            scope.close();
            scope.button.focus();
            return;
        }
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
    // Click anywhere else in the palette closes the scope popover.
    panel.addEventListener("mousedown", (event) => {
        if (scope.isOpen() && !scope.pop.contains(event.target) && !scope.button.contains(event.target)) scope.close();
    });
    document.addEventListener("keydown", onKey, true);

    document.body.append(overlay);
    paletteHost = overlay;
    render("");
    release = trapFocus(panel, previous instanceof HTMLElement ? previous : null);
    input.focus();
}

function initPalette() {
    cacheForumList();
    // Only the full search form's page prints the whole forum tree.
    cacheSearchFormForums();
    if (!settings.get("palette")) return;
    document.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            openPalette();
        }
    });
}

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
    msgonly:   { sf: "msgonly",   hint: "post text" },
    all:       { sf: "all",       hint: "every post" },
};

/* The author to search for, from the chooser's own field.
 *
 * Not stored with the rest: a remembered room narrows a search in a
 * way the chip prints on itself, and a remembered name would narrow
 * every later search to one member with nothing on screen saying so.
 * It lives as long as the palette is open. */
let searchAuthor = "";

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
    const kept = searchPrefs().where;
    /* A board picked from the palette's own chooser, which offers the
       whole cached list rather than the two or three rooms the page
       you are on happens to sit in. It is named `f:<id>` so the box in
       the bar, which only knows "here", "up" and "board", falls back
       to its own default instead of trying to honour a room it has no
       segment for. */
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
    // Nobody has chosen: the forum above a topic, the forum itself on
    // a listing. See parentForum().
    return PAGE.isTopic ? (up || here) : here;
}

function boardSearchUrl(query) {
    const depth = SEARCH_DEPTH[searchDepthChoice()] || SEARCH_DEPTH.titleonly;
    const place = paletteSearchPlace();
    const url = new URL("./search.php", location.href);
    // The board takes a search with no words in it as long as there is
    // a name on it, which is what "everything this member posted in
    // Releases" is.
    if (query) url.searchParams.set("keywords", query);
    if (searchAuthor) url.searchParams.set("author", searchAuthor);
    url.searchParams.set("terms", searchChoice("terms", SEARCH_TERMS));
    url.searchParams.set("sf", depth.sf);
    url.searchParams.set("sr", searchChoice("sr", SEARCH_SHOW));
    if (place) url.searchParams.set("fid[]", place.id);
    return url.toString();
}

/* ---- The chooser at the head of the palette's field -----------------

   The palette hands its query to the board, and it did that with
   whatever the box in the bar had last been set to — chosen on another
   page, invisible from here. The row said where the search was going
   and there was no way to send it anywhere else without closing the
   palette and finding a search box.

   So what the full search form asks — which rooms, how deep, every
   word or any word, threads or posts, whose posts — is asked here
   instead, from one control at the head of the field. The form itself
   is a page load away and comes back as a page of results; this is the
   same query, aimed before it is sent.

   Not all of it: sorting, the date range and how many characters of a
   post to print back are choices about a page of results, and the
   place to make those is the page of results. */

const FORUM_TREE_KEY = "forumTree";

/**
 * Every room the reader may search, in the board's own order.
 *
 * Two sources, and the better one wins. The full search form prints
 * the whole tree in one <select> — categories, forums, subforums,
 * indented with non-breaking spaces — as the reader's own account sees
 * it, so a member with a restricted room gets it and everyone else
 * does not. The index knows less: top-level forums and the subforum
 * links under them, and no idea of what it cannot see. The index is
 * visited by everyone and the search form by almost nobody, so the
 * index fills the list until the form has been opened once.
 */
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

/* The search form's own list of rooms.
 *
 * Depth is the indent the template wrote: "&nbsp; &nbsp;" per level,
 * three characters once the entities are text. A row with something
 * deeper under it and nothing above it is a category — "English
 * Forums" holds no topics of its own — so it is a heading here rather
 * than somewhere a search can be sent. */
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

/**
 * The rooms the chooser offers, and what picking one is stored as.
 *
 * `where` is shared with the box in the bar, which knows three words:
 * the room you are in, the one above it, and the whole board. A room
 * picked from the tree that happens to be one of those is stored as
 * that word, so the box keeps honouring it; anything else is stored as
 * `f:<id>`, which the box does not recognise and falls back from. */
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

    // Nothing cached yet — this browser has opened neither the index
    // nor the search form. The breadcrumb still knows two rooms.
    const trail = forumTrail();
    const here = trail.length ? trail[trail.length - 1] : null;
    const up = parentForum(trail);
    const rooms = [];
    if (up) rooms.push({ id: String(up.id), title: up.name, depth: 0 });
    if (here && (!up || up.id !== here.id)) rooms.push({ id: String(here.id), title: here.name, depth: up ? 1 : 0 });
    return rooms;
}

/**
 * The control, its popover, and every pressed state kept in line with
 * what is stored.
 *
 * `onPick` redraws the palette behind it: the row that hands the query
 * to the board names the room, says how deep it will look and whose
 * posts it will look at, so a choice that did not redraw would leave
 * the answer to the question the reader just asked sitting one line
 * under the control.
 */
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

    /* Rooms are matched on the forum id rather than on the stored word:
       the same room is "here" from inside it and `f:10` from the tree,
       and both have to light the same row. */
    const sync = () => {
        const place = paletteSearchPlace();
        const id = place ? String(place.id) : null;
        const depth = searchDepthChoice();
        where.textContent = place ? shortForumName(place.name) : t("Whole board");
        // The room is printed on the chip, so the accent is kept for
        // everything that is not — how deep it looks, whose posts, any
        // word rather than all of them — the same way the box in the
        // bar spends it.
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
        // Somewhere to arrow from, and the answer to "where is it set"
        // under the cursor.
        const first = rooms.querySelector('button[aria-pressed="true"]') || rooms.firstElementChild;
        if (first) first.focus();
        if (first) first.scrollIntoView({ block: "nearest" });
    };
    button.addEventListener("click", () => {
        if (pop.hidden) open();
        else { close(); button.focus(); }
    });

    /* Enter in the author field is the reader saying they are done
       here, not asking for a member list: it puts the choices away and
       hands focus back to the query, where Enter runs the search. */
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

    /* Ranked by traffic for the jump list above; in the board's own
       order, subforums and all, for the chooser. Two lists because
       they answer different questions: "which board do I mean" wants
       Main Forum first, "which board do I search" wants Releases
       under it. */
    cacheIndexForums();
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
    // The field and the control that says where its query goes are one
    // strip; the popover hangs off it, so the strip is what it is
    // positioned against.
    const bar = el("div.rr-palette__bar", {}, [input]);
    const panel = el("div.rr-palette", { role: "dialog", "aria-modal": "true", "aria-label": "Command palette" }, [bar, list]);
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
            /* Four sentences rather than one with pieces bolted on: a
               name and no words is a whole search on this board — what
               did this member post in Releases — and reads as one. */
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

        // A name in the chooser is a search on its own, with or without
        // words to go with it.
        if (needle || searchAuthor) list.append(renderGroup(t("Search"), [searchItem(query.trim())], flat));

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
        /* This listener is on the document and captures, so with the
           choices open it would still be the one answering: Enter would
           run the highlighted row rather than press the button under
           the cursor, and Escape would take the whole palette down
           when the reader only meant to put the choices away. */
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
    // Anywhere else in the palette puts the choices away, the way
    // clicking off any other popover does.
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
    // The full search form, met on its own page. Nothing else on the
    // board prints the whole tree.
    cacheSearchFormForums();
    if (!settings.get("palette")) return;
    document.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            openPalette();
        }
    });
}

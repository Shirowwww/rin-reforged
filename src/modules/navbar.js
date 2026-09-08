// Top bar: links are lifted from the masthead rather than hardcoded, so a board-side menu change carries over.

function findHeaderLink(...needles) {
    const links = Array.from(document.querySelectorAll("#wrapheader a, #menubar a"));
    for (const needle of needles) {
        const hit = links.find((a) => (a.getAttribute("href") || "").includes(needle));
        if (hit) return hit.getAttribute("href");
    }
    return null;
}

function buildCrumbs() {
    const wrap = el("nav.rr-nav__crumbs", { "aria-label": "Breadcrumb" });
    const source = document.querySelector("p.breadcrumbs");

    if (source) {
        const links = Array.from(source.querySelectorAll("a"));
        links.forEach((link, index) => {
            if (index) wrap.append(el("span.rr-nav__sep", {}, ["/"]));
            wrap.append(el("a", { href: link.getAttribute("href") }, [link.textContent.trim()]));
        });
    }

    // Breadcrumb stops at the forum; append the topic title so it stays visible while scrolling a long thread.
    const heading = document.querySelector("#pageheader h2 a.titles, #pageheader h2");
    if (heading && PAGE.isTopic) {
        if (wrap.children.length) wrap.append(el("span.rr-nav__sep", {}, ["/"]));
        const { rest } = splitPrefix(heading.textContent.trim());
        wrap.append(el("a", { href: "#top", title: rest }, [rest]));
        return wrap;
    }

    // On pages where the breadcrumb is just "Board index" (UCP, member list, profile), parse the window title instead.
    if (wrap.querySelectorAll("a").length <= 1 && !PAGE.isIndex && !PAGE.isForum) {
        const parts = document.title.split(/\s+[•·]\s+/).slice(1)
            .map((part) => part.trim())
            .filter((part) => part && !/^index page$/i.test(part)
                && !Array.from(wrap.querySelectorAll("a")).some((a) => a.textContent.trim() === part));
        parts.forEach((part, index) => {
            if (wrap.children.length) wrap.append(el("span.rr-nav__sep", {}, ["/"]));
            const last = index === parts.length - 1;
            wrap.append(el("span.rr-nav__here", last ? { "aria-current": "page" } : {}, [part]));
        });
    }
    return wrap;
}

function findLogo() {
    return document.querySelector(
        '#logodesc img[src*="site_logo"], #wrapheader img[src*="site_logo"], #wrapheader img[src*="logo"]'
    );
}

// Board's wordmark as an inline <svg> path, not an <img>/CSS mask: the board's `img-src 'self'` CSP blocks data: URIs for both (confirmed live). Filled with currentColor so it inks per theme.
const BRAND_MARK = "M26 0h13v1h-13zM99 0h4v1h-4zM113 0h3v1h-3zM2 0h14v2h-14zM62 0h14v2h-14zM86 0h3v2h-3zM26 1h14v1h-14zM137 0h15v3h-15zM99 1h5v2h-5zM1 2h15v1h-15zM25 2h15v1h-15zM61 2h16v1h-16zM1 3h4v1h-4zM12 3h4v1h-4zM25 3h4v1h-4zM36 3h4v1h-4zM61 3h5v1h-5zM72 3h5v1h-5zM99 3h6v1h-6zM112 1h4v4h-4zM137 3h4v2h-4zM37 4h2v1h-2zM73 4h3v1h-3zM99 4h7v1h-7zM161 0h4v6h-4zM1 4h3v2h-3zM13 4h3v2h-3zM25 4h3v2h-3zM99 5h8v1h-8zM173 0h4v7h-4zM148 3h4v4h-4zM61 4h4v3h-4zM72 5h4v2h-4zM137 5h3v2h-3zM25 6h13v1h-13zM99 6h9v1h-9zM85 2h4v6h-4zM112 5h3v3h-3zM161 6h3v2h-3zM103 7h6v1h-6zM136 7h16v1h-16zM25 7h14v2h-14zM61 7h15v2h-15zM98 7h4v2h-4zM104 8h5v1h-5zM111 8h4v1h-4zM85 8h3v2h-3zM136 8h15v2h-15zM26 9h13v1h-13zM61 9h14v1h-14zM105 9h10v1h-10zM12 10h3v1h-3zM66 10h6v1h-6zM106 10h9v1h-9zM142 10h7v1h-7zM136 10h4v2h-4zM24 11h3v1h-3zM67 11h5v1h-5zM107 11h7v1h-7zM123 11h4v1h-4zM143 11h5v1h-5zM0 6h4v7h-4zM172 7h4v6h-4zM160 8h4v5h-4zM98 9h3v4h-3zM36 10h3v3h-3zM11 11h4v2h-4zM23 12h4v1h-4zM68 12h5v1h-5zM144 12h5v1h-5zM60 10h4v4h-4zM47 11h4v3h-4zM108 12h6v2h-6zM136 12h3v2h-3zM23 13h16v1h-16zM145 13h4v1h-4zM84 10h4v5h-4zM0 13h15v2h-15zM69 13h5v2h-5zM160 13h15v2h-15zM23 14h15v1h-15zM109 14h5v1h-5zM145 14h5v1h-5zM122 12h5v4h-5zM97 13h4v3h-4zM46 14h5v2h-5zM135 14h4v2h-4zM0 15h14v1h-14zM24 15h14v1h-14zM70 15h5v1h-5zM110 15h4v1h-4zM146 15h5v1h-5zM160 15h14v1h-14zM60 14h3v3h-3zM84 15h3v2h-3zM1 16h11v1h-11zM25 16h11v1h-11zM47 16h3v1h-3zM71 16h4v1h-4zM98 16h2v1h-2zM123 16h3v1h-3zM136 16h2v1h-2zM147 16h3v1h-3zM162 16h11v1h-11z";

function buildBrand() {
    const strapline = document.querySelector("#logodesc h1, #wrapheader h1");
    const brand = el("a.rr-nav__brand", {
        href: "./index.php",
        "aria-label": "CS.RIN.RU — board index",
        title: strapline ? strapline.textContent.replace(/\s+/g, " ").trim() : "CS RIN - Steam Underground",
    });

    const mark = document.createElementNS(SVG_NS, "svg");
    mark.setAttribute("viewBox", "0 0 177 17");
    mark.setAttribute("fill", "currentColor");
    mark.setAttribute("aria-hidden", "true");
    mark.classList.add("rr-nav__logo");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", BRAND_MARK);
    mark.append(path);

    brand.append(mark);
    return brand;
}

/* ---- One search shape ---------------------------------------------- */

// Wraps the board's own search form (moved, not rebuilt, so action/hidden inputs/session tokens survive) in the palette-trigger frame.
function adoptBoardSearch(form) {
    if (!form || form.closest(".rr-search")) return form;

    const field = form.querySelector('input[type="text"], input[type="search"], input.inputbox');
    const submit = form.querySelector('input[type="submit"], button[type="submit"]');

    if (field) {
        // Board fakes a placeholder via value + onclick/onblur; Tab-focus users submit that literal text. Use a real placeholder instead.
        const prompt = (field.getAttribute("value") || "").trim();
        const inline = (field.getAttribute("onclick") || "") + (field.getAttribute("onblur") || "");
        if (prompt && inline.includes(prompt.slice(0, 8))) {
            field.setAttribute("placeholder", prompt);
            field.value = "";
            field.removeAttribute("value");
            field.removeAttribute("onclick");
            field.removeAttribute("onblur");
        }
        if (!field.getAttribute("aria-label")) {
            field.setAttribute("aria-label", field.getAttribute("placeholder") || "Search");
        }
        field.classList.add("rr-search__input");
        field.removeAttribute("size");
        field.before(icon("search", 14));
    }

    if (submit) submit.classList.add("rr-search__go");
    form.classList.add("rr-search__form");
    const frame = el("div.rr-search", {}, [form]);
    addSearchOptions(frame, form, field, submit);
    return frame;
}

/* ---- Where a search looks ------------------------------------------ */

// Board's own boxes only offer a fixed search; these hidden-field combos let a click choose depth/scope instead. Preference persists in this browser.
const SEARCH_IN = [
    { value: "titleonly", label: "Titles" },
    { value: "firstpost", label: "First post" },
    { value: "msgonly", label: "Message text" },
    { value: "all", label: "All posts" },
];

// Rest of the full form's options, kept in sync so the box and the palette can't disagree.
const SEARCH_TERMS = [
    { value: "all", label: "All words" },
    { value: "any", label: "Any word" },
];

const SEARCH_SHOW = [
    { value: "topics", label: "Topics" },
    { value: "posts", label: "Posts" },
];

// PAGE.forumId is null on a topic reached from a listing (viewtopic.php?t=… carries no forum id) — read the forum from the breadcrumb trail instead. Trail comes back outermost first.
function forumTrail() {
    const out = [];
    const source = document.querySelector("p.breadcrumbs") || document.querySelector(".rr-nav__crumbs");
    for (const link of source ? source.querySelectorAll("a") : []) {
        const match = (link.getAttribute("href") || "").match(/viewforum\.php\?f=(\d+)/);
        if (!match) continue;
        if (out.some((entry) => entry.id === match[1])) continue;
        out.push({ id: match[1], name: link.textContent.trim() });
    }
    return out;
}

// Board moves topics into transient subforums (e.g. Temporarily Restricted); the parent forum is what "this forum" actually means. Needs depth >= 3 since the first crumb is a topic-less category.
function parentForum(trail) {
    return trail.length >= 3 ? trail[trail.length - 2] : null;
}

function shortForumName(name) {
    const said = String(name || "").trim();
    return said.length > 24 ? said.slice(0, 23).trimEnd() + "\u2026" : said;
}

const SEARCH_PREFS_KEY = "searchPrefs";

// `where` starts null (not "here") so "nobody chose" is distinguishable from "chose this forum" — each gets a different default.
function searchPrefs() {
    const kept = store.get(SEARCH_PREFS_KEY, null);
    return Object.assign({ sf: "titleonly", where: null, terms: "all", sr: "topics" },
        kept && typeof kept === "object" ? kept : {});
}

function searchChoice(key, options) {
    const kept = searchPrefs()[key];
    return options.some((option) => option.value === kept) ? kept : options[0].value;
}

function setSearchPref(key, value) {
    const next = searchPrefs();
    next[key] = value;
    store.set(SEARCH_PREFS_KEY, next);
}

function searchDepthChoice() {
    const sf = searchPrefs().sf;
    return SEARCH_IN.some((option) => option.value === sf) ? sf : "titleonly";
}

/* ---- The popover both search boxes share ---------------------------

   onChange(place, depth, first) fires on every choice and once at start with first=true — on a forum/topic it rewrites hidden fields for Search; on a results page (query already ran) it re-runs the search instead. */
function buildSearchPopover(frame, field, submit, config) {
    const places = config.places;
    let where = config.where;
    let depth = config.depth;

    const whereSeg = el("div.rr-seg", { role: "group", "aria-label": t("Where to search") });
    const inSeg = el("div.rr-seg", { role: "group", "aria-label": t("What to search") });
    const inRow = el("div.rr-search__row", {}, [el("span.rr-search__rowlabel", {}, [t("Look in")]), inSeg]);

    // Current room is printed on the trigger itself, visible without opening the popover.
    const whereNow = el("span.rr-search__where", { "aria-hidden": "true" });
    const opts = labelled(
        el("button.rr-search__opts", { type: "button", "aria-expanded": "false" }, [icon("sliders", 13), whereNow]),
        t("Search options"));

    const chosen = () => places.find((entry) => entry.value === where) || places[places.length - 1];

    const sync = (first) => {
        const place = chosen();
        inRow.hidden = place.value === "topic";
        for (const button of whereSeg.children) {
            button.setAttribute("aria-pressed", button.dataset.value === where ? "true" : "false");
        }
        for (const button of inSeg.children) {
            button.setAttribute("aria-pressed", button.dataset.value === depth ? "true" : "false");
        }
        whereNow.textContent = place.label;
        labelled(opts, t("Search options — looking in {where}", { where: place.full || place.label }));
        // Room name is on the trigger now; the active-dot marks only the other axis (search depth).
        opts.toggleAttribute("data-rr-active", place.value !== "topic" && depth !== "titleonly");
        config.onChange(place, depth, Boolean(first));
    };

    for (const place of places) {
        const button = el("button", { type: "button", title: place.full || null }, [place.label]);
        button.dataset.value = place.value;
        button.addEventListener("click", () => { where = place.value; sync(); });
        whereSeg.append(button);
    }
    for (const option of SEARCH_IN) {
        const button = el("button", { type: "button" }, [t(option.label)]);
        button.dataset.value = option.value;
        button.addEventListener("click", () => { depth = option.value; sync(); });
        inSeg.append(button);
    }

    const pop = el("div.rr-search__pop", { role: "group", "aria-label": t("Search options"), hidden: true }, [
        el("div.rr-search__row", {}, [el("span.rr-search__rowlabel", {}, [t("Where")]), whereSeg]),
        inRow,
    ]);

    const close = () => {
        pop.hidden = true;
        opts.setAttribute("aria-expanded", "false");
        document.removeEventListener("mousedown", onOutside, true);
        document.removeEventListener("keydown", onKey, true);
    };
    const onOutside = (event) => { if (!frame.contains(event.target)) close(); };
    const onKey = (event) => { if (event.key === "Escape") { close(); opts.focus(); } };
    const open = () => {
        if (!pop.hidden) return;
        pop.hidden = false;
        opts.setAttribute("aria-expanded", "true");
        document.addEventListener("mousedown", onOutside, true);
        document.addEventListener("keydown", onKey, true);
    };
    opts.addEventListener("click", () => { if (pop.hidden) open(); else close(); });

    // ArrowDown opens the popover like a combobox, without leaving the keyboard mid-query.
    if (field) {
        field.addEventListener("keydown", (event) => {
            if (event.key !== "ArrowDown" || event.altKey || event.ctrlKey || event.metaKey) return;
            event.preventDefault();
            open();
            const first = whereSeg.querySelector('button[aria-pressed="true"]') || whereSeg.firstElementChild;
            if (first) first.focus();
        });
    }

    if (submit) submit.before(opts);
    else (frame.querySelector("form") || frame).append(opts);
    frame.append(pop);
    sync(true);
    return { close: close };
}

/* ---- The box on a forum or a topic ---------------------------------- */

function addSearchOptions(frame, form, field, submit) {
    const hidden = (name) => form.querySelector('input[type="hidden"][name="' + name + '"]');
    const topicId = hidden("t") ? hidden("t").value : null;
    const trail = forumTrail();
    const here = trail.length ? trail[trail.length - 1] : null;
    const up = parentForum(trail);
    const forumId = (hidden("fid[]") && hidden("fid[]").value)
        || (here && here.id)
        || (PAGE.forumId ? String(PAGE.forumId) : null);

    // A results page refines rather than starts a new search; hand it to addResultOptions instead.
    if (PAGE.isSearch) return addResultOptions(frame, field, submit);
    if (!topicId && !forumId) return;

    const setHidden = (name, value) => {
        let input = hidden(name);
        if (value === null) { if (input) input.remove(); return; }
        if (!input) { input = el("input", { type: "hidden", name }); form.append(input); }
        input.value = value;
    };

    // Named rather than described ("Main Forum", not "This forum") — which room you're in matters on a board that moves topics.
    const places = [];
    if (topicId) places.push({ value: "topic", label: t("This topic") });
    if (here) places.push({ value: "here", label: shortForumName(here.name), full: here.name, forum: here.id });
    else if (forumId) places.push({ value: "here", label: t("This forum"), forum: forumId });
    if (up && here && up.id !== here.id) {
        places.push({ value: "up", label: shortForumName(up.name), full: up.name, forum: up.id });
    }
    places.push({ value: "board", label: t("Whole board") });

    const prefs = searchPrefs();
    const offered = new Set(places.map((place) => place.value));

    // Default: from a topic, the parent forum (people open this to find "what else is like this", not search within the thread); from a listing, the listing itself.
    const fallback = topicId && offered.has("up") ? "up" : (offered.has("here") ? "here" : "board");

    buildSearchPopover(frame, field, submit, {
        places: places,
        where: offered.has(prefs.where) ? prefs.where : fallback,
        depth: searchDepthChoice(),
        onChange: (place, depth, first) => {
            if (place.value === "topic") {
                setHidden("t", topicId);
                setHidden("fid[]", null);
                setHidden("sf", "msgonly");
                setHidden("sr", null);
            } else {
                setHidden("t", null);
                setHidden("fid[]", place.forum || null);
                setHidden("sf", depth);
                // Send the sr/terms the palette remembers, not the board box's own defaults.
                setHidden("sr", searchChoice("sr", SEARCH_SHOW));
                setHidden("terms", searchChoice("terms", SEARCH_TERMS));
            }
            if (!first) {
                setSearchPref("where", place.value);
                setSearchPref("sf", depth);
                if (field) field.focus();
            }
            if (field) {
                field.setAttribute("placeholder", place.value === "topic" ? t("Search this topic")
                    : place.value === "board" ? t("Search the whole board")
                    : t("Search {forum}", { forum: place.full || place.label }));
                field.setAttribute("aria-label", field.getAttribute("placeholder"));
                // Field's placeholder already names the room, so the trigger stops repeating it (data-rr-echo) until typed text covers it.
                frame.setAttribute("data-rr-echo", "");
            }
        },
    });
}

/* ---- Re-aiming a search you are already looking at ------------------

   Results page can only refine, not move, a search — phpBB keeps the whole query in the URL, so re-run it with one field (scope/depth) changed. */
function searchQuery() {
    const here = new URLSearchParams(location.search);
    if (here.get("keywords")) return here;
    // A POST search has the query in the form's action instead of the URL.
    const form = document.querySelector('#search-box form[action*="keywords="], form[action*="keywords="]');
    const action = form ? form.getAttribute("action") || "" : "";
    const at = action.indexOf("?");
    const fallback = new URLSearchParams(at > -1 ? action.slice(at + 1) : "");
    return fallback.get("keywords") ? fallback : here;
}

function knownForumName(id) {
    const hit = store.get("forums", []).find((entry) => String(entry.id) === String(id));
    if (hit) return hit.title;
    // Index only lists top boards; subforums live in the tree cached by palette.js (forumTree) — check there too.
    const room = forumTree().find((entry) => String(entry.id) === String(id));
    return room ? room.title : null;
}

function addResultOptions(frame, field, submit) {
    const query = searchQuery();
    const keywords = query.get("keywords");
    // "Active topics"/"unanswered" are keyword-less searches — nothing to re-aim.
    if (!keywords) return;

    const forumId = query.get("fid[]");
    const places = [];
    if (forumId) {
        const name = knownForumName(forumId);
        places.push(name
            ? { value: "here", label: shortForumName(name), full: name, forum: forumId }
            : { value: "here", label: t("That forum"), forum: forumId });
    }
    places.push({ value: "board", label: t("Whole board") });

    const depths = new Set(SEARCH_IN.map((option) => option.value));
    const sf = query.get("sf");

    buildSearchPopover(frame, field, submit, {
        places: places,
        where: forumId ? "here" : "board",
        depth: depths.has(sf) ? sf : "titleonly",
        onChange: (place, depth, first) => {
            // The first call is the page reporting where it looked.
            if (first) return;
            setSearchPref("sf", depth);
            const url = new URL("./search.php", location.href);
            url.searchParams.set("keywords", keywords);
            url.searchParams.set("terms", query.get("terms") || "all");
            url.searchParams.set("sr", query.get("sr") || "topics");
            url.searchParams.set("sf", depth);
            if (place.value === "here" && place.forum) url.searchParams.set("fid[]", place.forum);
            location.href = url.toString();
        },
    });
}


/** Frames a board search box in place, rather than moving it to the end of its cell. */
function frameBoardSearch(form) {
    if (!form || form.closest(".rr-search")) return null;
    const parent = form.parentElement;
    const after = form.nextSibling;
    const framed = adoptBoardSearch(form);
    if (framed === form || !parent) return null;
    parent.insertBefore(framed, after);
    return framed;
}

/**
 * Board writes #topic-search three times (breadcrumb x2 + sort strip); the sort-strip copy is the only one left in the template's own shape.
 * Runs after other modules so an already-moved box is skipped.
 */
function frameStraySearch() {
    for (const form of document.querySelectorAll(
        "#wrapcentre form#topic-search, #wrapcentre form#forum-search, #wrapcentre #search-box form")) {
        if (!form.getClientRects().length) continue;
        frameBoardSearch(form);
    }
}

/* ---- Board bar ---------------------------------------------------- */

// Masthead's remaining links (rules, FAQ, chat, donate, register, lang) get hidden with it by the stylesheet; rebuilt here as one row, in masthead order.

/* Destinations the navbar already offers as an icon of its own.

   Recorded as it builds them rather than guessed at with a pattern.
   The pattern that was here matched the inbox and the login link, and
   missed the one that mattered: signed in, the account icon points at
   `ucp.php`, and `ucp.php` is also the masthead's "User Control Panel"
   — so the row carried a 150px chip for a link already sitting three
   inches above it, and it carried it in the one place where width was
   short. What the bar actually took is not something to infer. */
const NAV_TOOK = new Set();

/** Same href with/without a session id (?sid=) is one destination. */
function linkKey(href) {
    return String(href || "").replace(/[?&]sid=[a-f0-9]+/, "").replace(/[?&]$/, "");
}

/** Board-bar link: the original anchor is moved (not copied), so its session id and any other userscript's attachments survive. */
// Donate link gets no special styling now, just a title naming its purpose — the palette still offers it from anywhere.
const DONATE_RE = /donat/i;

function isDonateLink(link) {
    return DONATE_RE.test(link.getAttribute("href") || "")
        || DONATE_RE.test(link.textContent || "");
}

function boardBarLink(link) {
    const label = link.textContent.replace(/\s+/g, " ").trim();
    const image = link.querySelector("img");

    link.classList.add("rr-boardbar__link");

    // Language switch links have no text; the flag image is treated as the label.
    if (!label && image) {
        image.classList.add("rr-boardbar__flag");
        image.style.display = "";
        return link;
    }

    // Everything else pairs an icon with a redundant label; keep just the label.
    link.textContent = label;
    if (isDonateLink(link)) {
        link.classList.add("rr-boardbar__donate");
        link.setAttribute("title", label + " — the board is hosted on donations");
    }
    return link;
}

/* Groups links as views/board/account, with account hard right beside the language switch (mirrors the masthead's own two-row split). Classified by href pattern, not label, since labels are translated: a "view" is a saved search (search_id=), not the search form itself. */
const BOARD_BAR_GROUPS = [
    { id: "views", label: "Threads", re: /search\.php\?[^#]*search_id=/ },
    { id: "board", label: "Board", re: null },      // whatever is neither of the others
    { id: "account", label: "Account", end: true,
        re: /ucp\.php|mode=(?:login|logout|register)|viewprofile|profile\.php/ },
];

/* Board's view links all start with "View" ("View unanswered posts", etc.) — dead weight that overflows a narrow window. Shared leading words are dropped from the visible label but kept in title/aria-label. */
function trimSharedPrefix(links) {
    if (links.length < 2) return;
    const words = links.map((link) => link.textContent.trim().split(/\s+/));
    let shared = 0;
    while (words.every((parts) => parts.length > shared + 1 && parts[shared] === words[0][shared])) shared++;
    if (!shared) return;

    for (const link of links) {
        const full = link.textContent.trim();
        const rest = full.split(/\s+/).slice(shared).join(" ");
        link.textContent = rest.charAt(0).toUpperCase() + rest.slice(1);
        link.setAttribute("title", full);
        link.setAttribute("aria-label", full);
    }
}

function boardBarGroup(href) {
    return BOARD_BAR_GROUPS.find((group) => group.re && group.re.test(href))
        || BOARD_BAR_GROUPS.find((group) => !group.re);
}

// Board's language switch is two unlabelled flags with no indication of the current one — rebuilt as a segmented control with codes, using the board's own anchors so hrefs/session ids survive.
function currentLanguage() {
    const lang = (document.documentElement.getAttribute("lang") || "").toLowerCase();
    return lang.startsWith("ru") ? "ru" : lang.startsWith("en") ? "en" : null;
}

function buildLanguageSwitch(links) {
    if (links.length < 2) return null;

    const here = currentLanguage();
    const group = el("div.rr-langswitch", { role: "group", "aria-label": "Board language" });

    for (const link of links) {
        const code = (link.getAttribute("href").match(/[?&]lang=([a-z-]+)/i) || [])[1];
        if (!code) return null;
        const short = code.slice(0, 2).toLowerCase();
        const image = link.querySelector("img");
        const name = image ? (image.getAttribute("alt") || short.toUpperCase()) : short.toUpperCase();

        link.classList.add("rr-langswitch__option");
        link.textContent = "";
        if (image) {
            image.classList.add("rr-boardbar__flag");
            image.style.display = "";
            link.append(image);
        }
        link.append(el("span.rr-langswitch__code", {}, [short.toUpperCase()]));
        link.setAttribute("title", name);
        link.setAttribute("aria-label", name);
        if (here && short === here) {
            // Still a real link (clicking it is harmless) but marked as current.
            link.setAttribute("aria-current", "true");
        }
        group.append(link);
    }
    return group;
}

/* A guest browsing in Russian gets lang=ru appended to *every* nav link, not just the language switch — so lang= alone misidentifies Rules/FAQ/Register as language pills. Require a flag image, a language-named label, or a bare index.php?lang=. */
function isLanguageLink(link, href) {
    if (!/[?&]lang=/.test(href)) return false;
    if (link.querySelector('img[src*="uk.png"], img[src*="ru.png"], img[src*="/flags/"], img[src*="lang_"]')) return true;
    if (/^\s*(?:english|русский|en|ru)\s*$/i.test(link.textContent)) return true;
    // Bare lang= only identifies the index — search.php?lang=ru is just the search page in Russian.
    const path = href.replace(/[?#].*$/, "");
    if (!/(?:^|\/)index\.php$|^\.?\/?$/.test(path)) return false;
    const query = href.replace(/^[^?]*\??/, "").replace(/&?sid=[a-f0-9]+/, "");
    return /^&?lang=[a-z_-]+&?$/i.test(query);
}

function buildBoardBar() {
    const groups = new Map();
    const languages = [];
    const seen = new Set();

    const groupNode = (id) => {
        if (!groups.has(id)) groups.set(id, el("div.rr-boardbar__group", { "data-rr-group": id }));
        return groups.get(id);
    };

    const take = (link) => {
        const href = link.getAttribute("href") || "";
        if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
        const key = linkKey(href);
        if (seen.has(key) || NAV_TOOK.has(key)) return;
        seen.add(key);
        if (isLanguageLink(link, href)) { languages.push(link); return; }
        const group = groupNode(boardBarGroup(href).id);
        group.append(boardBarLink(link));
    };

    // Board's own "unanswered/active" strip floats with nothing around it; folded in to lead the row.
    for (const strip of document.querySelectorAll("#wrapcentre p.searchbar")) {
        for (const link of Array.from(strip.querySelectorAll("a[href]"))) take(link);
        if (!strip.querySelector("a[href], form")) strip.remove();
    }

    for (const link of Array.from(document.querySelectorAll("#wrapheader a[href]"))) {
        if (link.querySelector('img[src*="site_logo"], img[src*="logo"]')) continue;
        take(link);
    }

    const views = groups.get("views");
    if (views) trimSharedPrefix(Array.from(views.querySelectorAll(".rr-boardbar__link")));

    // Groups render in declared order (empty ones skipped); `end`-marked groups go right, before the language switch.
    const main = el("div.rr-boardbar__main");
    const end = el("div.rr-boardbar__end");
    for (const group of BOARD_BAR_GROUPS) {
        const node = groups.get(group.id);
        if (node && node.children.length) (group.end ? end : main).append(node);
    }

    const language = buildLanguageSwitch(languages);
    if (language) end.append(language);
    else for (const link of languages) end.append(boardBarLink(link));

    if (!main.children.length && !end.children.length) return null;

    // On phone the full row wraps to 3 lines; "unanswered/active" (the links every guide tells people to bookmark) stay visible, the rest folds behind More.
    const more = el("button.rr-boardbar__more", {
        type: "button",
        "aria-expanded": "false",
        "aria-label": t("More board links"),
    }, [t("More"), icon("chevronD", 12)]);

    const bar = el("nav.rr-boardbar", { "aria-label": t("Board links") }, [main, end, more]);

    more.addEventListener("click", () => {
        const open = bar.toggleAttribute("data-rr-open");
        more.firstChild.textContent = t(open ? "Less" : "More");
        more.setAttribute("aria-expanded", open ? "true" : "false");
    });

    return bar;
}

/**
 * Names an icon-only control via aria-label + data-rr-tip (drawn on hover/focus). No `title`: the browser's native tooltip used to appear a beat after the drawn one, showing the same text twice.
 */
function labelled(node, text) {
    node.removeAttribute("title");
    node.setAttribute("aria-label", text);
    node.setAttribute("data-rr-tip", text);
    return node;
}

function buildNavbar() {
    const bar = el("header.rr-nav", { role: "banner" });
    // Bar spans edge-to-edge but its contents track the content column, so they line up with the board bar/listing below.
    const inner = el("div.rr-nav__inner");
    bar.append(inner);
    inner.append(buildBrand());

    inner.append(buildCrumbs());

    const actions = el("div.rr-nav__actions");

    if (settings.get("palette")) {
        const search = el("button.rr-nav__search", { type: "button", "aria-label": t("Search and jump (Ctrl+K)") }, [
            icon("search"),
            el("span", {}, [t("Search or jump to")]),
            el("span.rr-kbd.rr-nav__kbd", {}, [navigator.platform.startsWith("Mac") ? "⌘K" : "Ctrl K"]),
        ]);
        search.addEventListener("click", () => openPalette());
        inner.append(search);
    } else {
        const searchHref = findHeaderLink("search.php");
        if (searchHref) {
            NAV_TOOK.add(linkKey(searchHref));
            actions.append(labelled(el("a.rr-icon-btn", { href: searchHref }, [icon("search")]), t("Search")));
        }
    }

    const pmHref = findHeaderLink("i=pm", "ucp.php?i=pm");
    if (pmHref) {
        NAV_TOOK.add(linkKey(pmHref));
        const unread = unreadMessages();
        const label = unread > 0
            ? t("Private messages — {n} unread", { n: unread })
            : t("Private messages");
        const button = labelled(el("a.rr-icon-btn", { href: pmHref }, [icon("mail")]), label);
        if (unread > 0) button.append(el("span.rr-badge", {}, [String(unread)]));
        actions.append(button);
    }

    const ucpHref = findHeaderLink("mode=login", "ucp.php");
    if (ucpHref) {
        NAV_TOOK.add(linkKey(ucpHref));
        const label = t(isLoggedIn() ? "Your account" : "Log in");
        actions.append(labelled(el("a.rr-icon-btn", { href: ucpHref }, [icon("user")]), label));
    }

    // Hairline divider: distinguishes the script's settings icon from the board's own icons beside it, without becoming a second toolbar.
    actions.append(el("span.rr-nav__divide", { "aria-hidden": "true" }));

    const settingsButton = labelled(
        el("button.rr-icon-btn", { type: "button" }, [icon("settings")]),
        t("RIN Reforged settings"));
    settingsButton.addEventListener("click", () => openSettings());
    actions.append(settingsButton);

    inner.append(actions);
    return bar;
}

/* ---- The board's own masthead ------------------------------------- */

/**
 * Masthead art survives on the index at full size — it's the board's identity, not chrome. Rebuilt as a new <img> rather than moving the original, which stays hidden (not removed) since other userscripts read #wrapheader.
 */
function buildMasthead() {
    const source = findLogo();
    const src = source && source.getAttribute("src");
    if (!src) return null;

    const strapline = document.querySelector("#logodesc h1, #wrapheader h1");
    const art = el("img.rr-masthead__art", {
        src,
        alt: "CS.RIN.RU",
        decoding: "async",
    });

    const banner = el("div.rr-masthead", {}, [
        el("a.rr-masthead__link", {
            href: "./index.php",
            "aria-label": "Board index",
            title: strapline ? strapline.textContent.replace(/\s+/g, " ").trim() : "CS.RIN.RU",
        }, [art]),
    ]);

    // A broken image is worse than no banner at all.
    art.addEventListener("error", () => banner.remove(), { once: true });
    return banner;
}

/**
 * Board name + strapline, read (not moved) from #wrapheader, which stays hidden for other userscripts reading it. Needed once the top bar already carries the name elsewhere, so a bar-less page isn't just art with no label.
 */
function buildBoardName() {
    const heading = document.querySelector("#logodesc h1, #wrapheader h1");
    if (!heading) return null;

    const name = heading.textContent.replace(/\s+/g, " ").trim();
    if (!name) return null;

    const block = el("div.rr-boardname", {}, [el("h1.rr-boardname__title", {}, [name])]);

    const strapline = heading.parentElement
        && heading.parentElement.querySelector("span.gen, span.gensmall");
    const line = strapline ? strapline.textContent.replace(/\s+/g, " ").trim() : "";
    if (line) block.append(el("p.rr-boardname__strap", {}, [line]));

    return block;
}

/**
 * Skip-to-content link — the board has none, and the top bar puts several tab stops before the first topic. Target needs tabindex="-1" or the browser scrolls without moving focus.
 */
function addSkipLink() {
    const main = document.querySelector("#wrapcentre");
    if (!main || document.querySelector(".rr-skip")) return;

    if (!main.id) main.id = "rr-main";
    main.setAttribute("tabindex", "-1");

    const skip = el("a.rr-skip", { href: "#" + main.id }, [t("Skip to content")]);
    skip.addEventListener("click", (event) => {
        event.preventDefault();
        main.focus();
        main.scrollIntoView();
    });
    document.body.prepend(skip);
}

/** Script's own controls (search/settings) for pages with no top bar — otherwise switching the bar off removes the only way to reach them. */
function buildHeaderTools() {
    const tools = el("div.rr-headertools");

    if (settings.get("palette")) {
        const search = labelled(
            el("button.rr-icon-btn", { type: "button" }, [icon("search")]),
            t("Search and jump (Ctrl+K)"));
        search.addEventListener("click", () => openPalette());
        tools.append(search);
    }

    const panel = labelled(
        el("button.rr-icon-btn", { type: "button" }, [icon("settings")]),
        t("RIN Reforged settings"));
    panel.addEventListener("click", () => openSettings());
    tools.append(panel);

    return tools;
}

function initNavbar() {
    const bar = settings.get("navbar") ? buildNavbar() : null;
    if (bar) document.body.prepend(bar);
    addSkipLink();                 // prepended after, so it lands first

    const centre = document.querySelector("#wrapcentre");
    const board = settings.get("boardLinks") ? buildBoardBar() : null;
    // Masthead shows on the index (bar carries identity elsewhere) or on any page when there's no bar at all.
    const banner = settings.get("masthead") && (PAGE.isIndex || !bar) ? buildMasthead() : null;
    const name = banner && !bar ? buildBoardName() : null;

    if (board && !bar) (board.querySelector(".rr-boardbar__end") || board).append(buildHeaderTools());

    // Masthead art + name + board-bar combine into one header block: side by side when there's a top bar, stacked (data-rr-stack) when there isn't.
    const parts = [banner, name, board].filter(Boolean);
    if (centre && parts.length > 1) {
        centre.prepend(el("div.rr-header", { "data-rr-stack": bar ? null : "" }, parts));
    } else if (centre && parts.length) {
        centre.prepend(parts[0]);
    }

    // Reveal the board's own masthead only when nothing here replaced it; set optimistically in theme.js at document-start to avoid a flash, corrected here.
    document.documentElement.setAttribute("data-rr-header", bar || board || banner ? "rr" : "board");

    if (!bar) return;
    // #top now sits under the sticky bar; offset scroll so both "back to top" and post-link jumps (settleFragment) land below it, not behind it.
    document.documentElement.style.scrollPaddingTop = "calc(var(--rr-nav-h, 48px) + 14px)";
}

/**
 * subsilver2 spaces strips with bare <br> rather than margins; once a strip is folded into one of this script's bars, the <br> is left stranded as an empty band (a sibling combinator still sees a hidden element).
 * Runs after every module so late-inserted bars are covered too.
 */
function dropStrayBreaks() {
    const bars = ".rr-header, .rr-topicbar, .rr-toolbar, .rr-boardbar, .rr-releases, .rr-quickreply";
    for (const bar of document.querySelectorAll(bars)) {
        for (const side of ["previousElementSibling", "nextElementSibling"]) {
            let node = bar[side];
            while (node && node.tagName === "BR") {
                const next = node[side];
                node.remove();
                node = next;
            }
        }
    }
}

/* ---- Separators the template left behind --------------------------- */

/* subsilver2 hardcodes `|` separators beside conditional links rather than generating them between survivors, leaving orphaned or doubled bars when links are hidden (e.g. logged out). Same job as dropStrayBreaks() but for `|` instead of <br>.
   Matches a text node of nothing but spacing/bars, allowing several — a doubled separator is one text node in the DOM, so a single-bar-per-node rule would miss it. */
const SEPARATOR_TEXT = /^[\s |·•]*[|·•][\s |·•]*$/;
// Board's own spacing, so a strip doesn't line-break at the punctuation.
const SEPARATOR_KEPT = " | ";

function occupies(node) {
    if (node.nodeType === 3) return Boolean(node.textContent.replace(/[\s ]/g, ""));
    if (node.nodeType !== 1) return false;
    if (node.tagName === "BR") return false;
    return node.getClientRects().length > 0;
}

/**
 * Drops `|` separators with no visible content before, none after, or preceded by another separator — never touches real content. Returns true if the strip ends up with nothing visible.
 */
function tidySeparators(strip) {
    // A hidden strip is skipped entirely — nothing "occupies" it, so every separator would look orphaned and get stripped even though the cell may reappear.
    if (!strip.getClientRects().length) return false;

    const nodes = Array.from(strip.childNodes);
    let pendingSeparators = [];
    let seenContent = false;
    let content = 0;

    for (const node of nodes) {
        if (node.nodeType === 3 && SEPARATOR_TEXT.test(node.textContent)) {
            // Held, not removed yet — whether it belongs depends on what follows.
            if (!seenContent) node.remove();
            else pendingSeparators.push(node);
            continue;
        }
        if (!occupies(node)) continue;
        // First held separator earns its place (normalised, in case it carried two); any further ones were duplicates.
        for (const [i, held] of pendingSeparators.entries()) {
            if (i) held.remove();
            else held.textContent = SEPARATOR_KEPT;
        }
        pendingSeparators = [];
        seenContent = true;
        content += 1;
    }
    // Nothing came after them.
    for (const held of pendingSeparators) held.remove();
    return content === 0;
}

// Includes cells the script already emptied of links — that's exactly what strands their punctuation.
const SEPARATOR_STRIPS = "#wrapcentre td.gensmall, #wrapcentre td.nav, #wrapcentre td.cat,"
    + " #wrapcentre p.searchbar, #wrapcentre span.gensmall, #wrapcentre .postbody + .gensmall";

// Hiding a cell in a data-table row (not blanking it) shifts every later cell left, out from under its header — hit on the Team page's empty e-mail column.
function isGridCell(cell) {
    if (cell.tagName !== "TD") return false;
    const row = cell.parentElement;
    if (!row || row.children.length < 3) return false;
    const table = cell.closest("table");
    return Boolean(table && table.querySelector(":scope > tbody > tr > th"));
}

/**
 * Runs after every module (see dropStrayBreaks). A cell left with only punctuation is hidden, not emptied, so its column stops being reserved — was a `td` at 100% width holding one character.
 */
function dropStraySeparators() {
    for (const strip of document.querySelectorAll(SEPARATOR_STRIPS)) {
        const empty = tidySeparators(strip);
        if (!empty) continue;
        if (strip.querySelector("form, input, select, textarea, img")) continue;
        if (isGridCell(strip)) continue;
        if (strip.tagName === "TD") strip.style.display = "none";
    }
}

/**
 * Breadcrumb strip is its own full-width table; once the bar carries the breadcrumb and toolbars take the search box, it's an empty 18px band. Runs after the other modules so it can tell if anything still needs it.
 */
function tidyCrumbStrip() {
    if (document.documentElement.getAttribute("data-rr-header") !== "rr") return;

    for (const crumbs of document.querySelectorAll("#wrapcentre p.breadcrumbs")) {
        const strip = crumbs.closest("table.tablebg");
        if (!strip) continue;
        // No bar means this breadcrumb isn't duplicated elsewhere, so the strip earns its place regardless of what else is in it.
        if (crumbs.getClientRects().length) {
            strip.setAttribute("data-rr-crumbstrip", "");
            frameBoardSearch(strip.querySelector("#search-box form, form#forum-search, form#topic-search"));
            continue;
        }
        // A control still present but not drawn (see dedupeSearchBoxes for the hidden duplicate) doesn't count — measured via getClientRects, not assumed.
        const controls = Array.from(strip.querySelectorAll("form, input, select, textarea"));
        if (!controls.some((node) => node.getClientRects().length)) { strip.style.display = "none"; continue; }
        // Survives for its search box alone (profile, member list, UCP — no listing toolbar to move it into); styled as a plain row rather than a card, and the box gets the same frame as every other search box.
        strip.setAttribute("data-rr-crumbstrip", "");
        frameBoardSearch(strip.querySelector("#search-box form, form#forum-search, form#topic-search"));
    }
}

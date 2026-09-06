/* ------------------------------------------------------------------
   The top bar.

   Replaces a 340px masthead with 48px. Links are lifted out of the
   original header rather than hardcoded, so a board-side change to the
   menu carries over instead of leaving a dead URL behind.
   ------------------------------------------------------------------ */

/** Find a link in the original masthead by what its href contains. */
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

    // On a topic page the breadcrumb stops at the forum, so the topic
    // title is appended: it is the one thing worth keeping on screen
    // while scrolling a 19 page thread.
    const heading = document.querySelector("#pageheader h2 a.titles, #pageheader h2");
    if (heading && PAGE.isTopic) {
        if (wrap.children.length) wrap.append(el("span.rr-nav__sep", {}, ["/"]));
        const { rest } = splitPrefix(heading.textContent.trim());
        wrap.append(el("a", { href: "#top", title: rest }, [rest]));
        return wrap;
    }

    /* The control panel, the member list, a profile: the board's
       breadcrumb on those is "Board index" and nothing else, but the
       window title knows where you are — "CS RIN • User Control Panel
       • View messages". The parts after the board's name are the rest
       of the trail. */
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

/** Where the template put the masthead art, whatever it is called. */
function findLogo() {
    return document.querySelector(
        '#logodesc img[src*="site_logo"], #wrapheader img[src*="site_logo"], #wrapheader img[src*="logo"]'
    );
}

/* The board's wordmark, traced off its own art into one path.

   Not an <img>, and not a CSS mask either: the board sends `img-src
   'self'`, so a data: URI is refused in both — checked on the live
   board, where the masked version drew a filled grey rectangle where
   the name should be. An inline <svg> is DOM rather than a fetched
   image and is not governed by that directive, which is what the icon
   set already relies on.

   Filled with currentColor, so the mark is the bar's own ink on every
   theme rather than the light grey the file is painted in, and there
   is no plate behind it. */
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

/* The board's own search form, given the frame the palette trigger
   has: one field with the search glyph at its head and whatever it
   submits with tucked inside its right edge. Two boxes doing the same
   job in two visual languages was the thing to fix; the rule the rest
   of the interface follows is that a control has the button radius and
   a pill is a label.

   The form is the board's own, moved, so its action, its hidden inputs
   and its tokens are untouched. */
function adoptBoardSearch(form) {
    if (!form || form.closest(".rr-search")) return form;

    const field = form.querySelector('input[type="text"], input[type="search"], input.inputbox');
    const submit = form.querySelector('input[type="submit"], button[type="submit"]');

    if (field) {
        /* The board fakes a placeholder: the prompt is the value, and
           two inline handlers clear it on click and put it back on
           blur. Anyone reaching the box with Tab therefore submits the
           words "Search this topic" as a query, and the box always
           looks filled in. A real placeholder does the same job
           correctly, so the value becomes one and the handlers that
           existed only to manage it go. */
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

/* The board's own boxes are fixed: "Search this forum" searches titles
   in this forum, "Search this topic" searches the text of this topic,
   and anything else is the full search form on another page. The
   choice people actually make — this forum or the whole board, titles
   or every post — is two hidden inputs away, so it is offered here, in
   the same box, behind one small control. The form that is submitted
   is still the board's own; only what its hidden fields say changes.

   The choice is kept in this browser, so a reader who always wants to
   search every post sets it once. */
const SEARCH_IN = [
    { value: "titleonly", label: "Titles" },
    { value: "firstpost", label: "First post" },
    { value: "all", label: "All posts" },
];

const SEARCH_PREFS_KEY = "searchPrefs";

function searchPrefs() {
    const kept = store.get(SEARCH_PREFS_KEY, null);
    return Object.assign({ sf: "titleonly", where: "here" }, kept && typeof kept === "object" ? kept : {});
}

function setSearchPref(key, value) {
    const next = searchPrefs();
    next[key] = value;
    store.set(SEARCH_PREFS_KEY, next);
}

/** The depth the palette's own search asks for. */
function searchDepthChoice() {
    const sf = searchPrefs().sf;
    return SEARCH_IN.some((option) => option.value === sf) ? sf : "titleonly";
}

function addSearchOptions(frame, form, field, submit) {
    const hidden = (name) => form.querySelector('input[type="hidden"][name="' + name + '"]');
    const topicId = hidden("t") ? hidden("t").value : null;
    const forumId = hidden("fid[]") ? hidden("fid[]").value : (PAGE.forumId ? String(PAGE.forumId) : null);
    // Only the two boxes that search a place: a "Search these results"
    // box on a results page refines a query, and its fields are not
    // ours to move.
    if (!topicId && !hidden("fid[]")) return;

    const setHidden = (name, value) => {
        let input = hidden(name);
        if (value === null) { if (input) input.remove(); return; }
        if (!input) { input = el("input", { type: "hidden", name }); form.append(input); }
        input.value = value;
    };

    const places = [];
    if (topicId) places.push({ value: "topic", label: t("This topic") });
    if (forumId) places.push({ value: "here", label: t("This forum") });
    places.push({ value: "board", label: t("Whole board") });

    const prefs = searchPrefs();
    // A topic's box starts on the topic, as the board draws it; a
    // forum's on the forum. The remembered choice only reaches as far
    // as this box can honour it.
    let where = topicId ? "topic" : (prefs.where === "board" ? "board" : "here");
    let depth = searchDepthChoice();

    const inRow = el("div.rr-search__row");
    const whereSeg = el("div.rr-seg", { role: "group", "aria-label": t("Where to search") });
    const inSeg = el("div.rr-seg", { role: "group", "aria-label": t("What to search") });

    const apply = () => {
        if (where === "topic") {
            setHidden("t", topicId);
            setHidden("fid[]", null);
            setHidden("sf", "msgonly");
            setHidden("sr", null);
        } else {
            setHidden("t", null);
            setHidden("fid[]", where === "here" ? forumId : null);
            setHidden("sf", depth);
            setHidden("sr", "topics");
            setHidden("terms", "all");
        }
        inRow.hidden = where === "topic";
        for (const button of whereSeg.children) button.setAttribute("aria-pressed", button.dataset.value === where ? "true" : "false");
        for (const button of inSeg.children) button.setAttribute("aria-pressed", button.dataset.value === depth ? "true" : "false");
        if (field) {
            field.setAttribute("placeholder", where === "topic" ? t("Search this topic")
                : where === "here" ? t("Search this forum") : t("Search the whole board"));
            field.setAttribute("aria-label", field.getAttribute("placeholder"));
        }
        // Says, from across the bar, that this box does not search the
        // default place any more.
        opts.toggleAttribute("data-rr-active", where === "board" || (where !== "topic" && depth !== "titleonly"));
    };

    for (const place of places) {
        const button = el("button", { type: "button" }, [place.label]);
        button.dataset.value = place.value;
        button.addEventListener("click", () => {
            where = place.value;
            if (!topicId) setSearchPref("where", where);
            apply();
        });
        whereSeg.append(button);
    }
    for (const option of SEARCH_IN) {
        const button = el("button", { type: "button" }, [t(option.label)]);
        button.dataset.value = option.value;
        button.addEventListener("click", () => {
            depth = option.value;
            setSearchPref("sf", depth);
            apply();
        });
        inSeg.append(button);
    }

    const pop = el("div.rr-search__pop", { role: "group", "aria-label": t("Search options"), hidden: true }, [
        el("div.rr-search__row", {}, [el("span.rr-search__rowlabel", {}, [t("Where")]), whereSeg]),
        inRow,
    ]);
    inRow.append(el("span.rr-search__rowlabel", {}, [t("Look in")]), inSeg);

    const opts = labelled(el("button.rr-search__opts", { type: "button", "aria-expanded": "false" }, [icon("sliders", 13)]),
        t("Search options"));
    const close = () => {
        pop.hidden = true;
        opts.setAttribute("aria-expanded", "false");
        document.removeEventListener("mousedown", onOutside, true);
        document.removeEventListener("keydown", onKey, true);
    };
    const onOutside = (event) => { if (!frame.contains(event.target)) close(); };
    const onKey = (event) => { if (event.key === "Escape") { close(); opts.focus(); } };
    opts.addEventListener("click", () => {
        if (!pop.hidden) { close(); return; }
        pop.hidden = false;
        opts.setAttribute("aria-expanded", "true");
        document.addEventListener("mousedown", onOutside, true);
        document.addEventListener("keydown", onKey, true);
    });

    if (submit) submit.before(opts);
    else form.append(opts);
    frame.append(pop);
    apply();
}

/** Frame one of the board's own search boxes where it stands, rather
    than at the end of whatever cell it was in. */
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
 * The board writes `#topic-search` three times on a topic page: into
 * the breadcrumb strip at each end, and into the sort strip under the
 * posts. The first goes to the topic bar and the last is hidden as a
 * duplicate; the one in the sort strip is left where it is, and it was
 * the only search box on the board still wearing the template's shape
 * — a bare field beside a bordered button, beside three select menus
 * that have been redrawn.
 *
 * Runs after every module, so a box another one has already moved is
 * left alone.
 */
function frameStraySearch() {
    for (const form of document.querySelectorAll(
        "#wrapcentre form#topic-search, #wrapcentre form#forum-search, #wrapcentre #search-box form")) {
        if (!form.getClientRects().length) continue;
        frameBoardSearch(form);
    }
}

/* ---- Board bar ---------------------------------------------------- */

/* The masthead is the board's only route to its rules, its FAQ, the
   chat, the donation page, registration and the English/Russian
   switch. rr-nav lifts the search box, the inbox and the account link
   out of it and the stylesheet then hides the rest, which takes those
   six links with it. They come back here, as one slim row at the top of
   the content, in the order the masthead used. */

/** Destinations the navbar already offers as an icon of its own. */
const NAV_LIFTED = /[?&]i=pm|mode=login(?:&|$)/;

/**
 * One entry in the board bar.
 *
 * The original anchor is moved rather than copied, so the session id in
 * its href, and anything another userscript has attached to it, both
 * survive.
 */
/* The board runs on donations. The link to that page used to get an
   outline and a heart, which made it the one loud thing in a row of
   quiet ones; it is an ordinary link in the row now, named so the
   narrow layout can still keep it in view, and the palette still
   offers it from anywhere. */
const DONATE_RE = /donat/i;

function isDonateLink(link) {
    return DONATE_RE.test(link.getAttribute("href") || "")
        || DONATE_RE.test(link.textContent || "");
}

function boardBarLink(link) {
    const label = link.textContent.replace(/\s+/g, " ").trim();
    const image = link.querySelector("img");

    link.classList.add("rr-boardbar__link");

    // The language switch is two flags with no text beside them: there
    // the image is the label, and it is the one the board's Russian
    // half looks for.
    if (!label && image) {
        image.classList.add("rr-boardbar__flag");
        image.style.display = "";
        return link;
    }

    // Everything else pairs a 12px GIF with a label that says the same
    // thing, so the label alone is enough.
    link.textContent = label;
    if (isDonateLink(link)) {
        link.classList.add("rr-boardbar__donate");
        link.setAttribute("title", label + " — the board is hosted on donations");
    }
    return link;
}

/* Twelve links in the order the masthead printed them is a list, not a
   menu. They are three kinds of thing:

     views    — ways of looking at threads (unanswered, active, search)
     board    — what the board is (rules, FAQ, chat, donate, the rest)
     account  — you (register, log in, log out, profile)

   In that order, so the account group ends the row beside the language
   switch, where the things about the reader sit together. Grouping is
   also what stops `Logout [ name ]` wrapping alone onto a second line.

   Classified by destination, not by label: the labels are translated
   and the hrefs are not. */
const BOARD_BAR_GROUPS = [
    { id: "views", label: "Threads", re: /search\.php/ },
    { id: "board", label: "Board", re: null },      // whatever is neither of the others
    { id: "account", label: "Account", re: /ucp\.php|mode=(?:login|logout|register)|viewprofile|profile\.php/ },
];

function boardBarGroup(href) {
    return BOARD_BAR_GROUPS.find((group) => group.re && group.re.test(href))
        || BOARD_BAR_GROUPS.find((group) => !group.re);
}

/* The board is bilingual and its own switch is two 16px flags with no
   text, no label and no indication of which one you are on — the one
   piece of the masthead that was carried over unchanged because it
   already had no words to carry. Read as a control it says nothing:
   two small pictures, one of which is already true.

   So the same two links become a segmented control with the language
   codes beside the flags and the current one marked, which is what the
   rest of this interface uses for a two-way choice. The anchors are the
   board's own, moved rather than rebuilt, so the hrefs and any session
   id in them survive. */
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
            // Still a link — the board sets the cookie from it, and
            // clicking the language you are already on is harmless —
            // but marked as where you are.
            link.setAttribute("aria-current", "true");
        }
        group.append(link);
    }
    return group;
}

/* The board's two language links are `index.php?lang=en` and
   `index.php?lang=ru`, each with a flag. But a guest who has switched
   to Russian gets `lang=ru` stamped on *every* navigation link, and
   reading the parameter alone turned Rules, FAQ, Register and Search
   into a row of pills that all said "RU" while the bar behind them
   emptied. A language link carries a flag, or a language for a name,
   or nothing in its query but the language. */
function isLanguageLink(link, href) {
    if (!/[?&]lang=/.test(href)) return false;
    if (link.querySelector('img[src*="uk.png"], img[src*="ru.png"], img[src*="/flags/"], img[src*="lang_"]')) return true;
    if (/^\s*(?:english|русский|en|ru)\s*$/i.test(link.textContent)) return true;
    // Only the index takes a bare lang=: search.php?lang=ru&sid=… is the
    // search page, in Russian.
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
        const key = href.replace(/[?&]sid=[a-f0-9]+/, "").replace(/[?&]$/, "");
        if (seen.has(key)) return;
        seen.add(key);
        if (isLanguageLink(link, href)) { languages.push(link); return; }
        const group = groupNode(boardBarGroup(href).id);
        group.append(boardBarLink(link));
    };

    // "View unanswered posts | View active topics" is the board's own
    // strip. It currently floats above the listing with nothing around
    // it; here it leads the row.
    for (const strip of document.querySelectorAll("#wrapcentre p.searchbar")) {
        for (const link of Array.from(strip.querySelectorAll("a[href]"))) take(link);
        if (!strip.querySelector("a[href], form")) strip.remove();
    }

    for (const link of Array.from(document.querySelectorAll("#wrapheader a[href]"))) {
        if (link.querySelector('img[src*="site_logo"], img[src*="logo"]')) continue;
        if (NAV_LIFTED.test(link.getAttribute("href") || "")) continue;
        take(link);
    }

    // In the order declared, not the order the masthead happened to
    // print them: a group that is empty on this page simply is not
    // drawn.
    const main = el("div.rr-boardbar__main");
    for (const group of BOARD_BAR_GROUPS) {
        const node = groups.get(group.id);
        if (node && node.children.length) main.append(node);
    }

    const end = el("div.rr-boardbar__end");
    const language = buildLanguageSwitch(languages);
    if (language) end.append(language);
    else for (const link of languages) end.append(boardBarLink(link));

    if (!main.children.length && !end.children.length) return null;

    // On a phone eight links and two flags wrap to three lines and take
    // 90px before any content. The two entry points people actually
    // start from stay put — every guide to this board says to bookmark
    // "View unanswered posts" — and the rest folds behind one control.
    // The stylesheet decides at what width; this is only the switch.
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
 * Give a control a name, said three ways.
 *
 * These are glyphs with nothing beside them. `aria-label` is what a
 * screen reader announces; `data-rr-tip` is what the stylesheet draws
 * on hover and on focus, straight away. Both say the same words, from
 * one argument, so they cannot drift apart. There is deliberately no
 * `title`: the browser's own tooltip arrived a second after the drawn
 * one and sat on top of it, the same words twice.
 */
function labelled(node, text) {
    node.removeAttribute("title");
    node.setAttribute("aria-label", text);
    node.setAttribute("data-rr-tip", text);
    return node;
}

function buildNavbar() {
    const bar = el("header.rr-nav", { role: "banner" });
    /* The bar runs edge to edge; its contents keep to the content
       column, so the brand and the icons line up with the board bar and
       the listing under them on a wide monitor instead of sitting at
       the screen's edges half a metre from either. */
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
            actions.append(labelled(el("a.rr-icon-btn", { href: searchHref }, [icon("search")]), t("Search")));
        }
    }

    const pmHref = findHeaderLink("i=pm", "ucp.php?i=pm");
    if (pmHref) {
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
        const label = t(isLoggedIn() ? "Your account" : "Log in");
        actions.append(labelled(el("a.rr-icon-btn", { href: ucpHref }, [icon("user")]), label));
    }

    /* The board's controls end here and this script's begins.

       Three unlabelled glyphs in a row read as three of the same
       thing, and two of them belong to the forum while the third opens
       a panel the forum knows nothing about. A hairline is the whole
       distinction: enough that the cog is not read as a fourth board
       feature, not so much that it becomes a second toolbar. The
       tooltip says the rest — it names the script. */
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
 * The board's face, kept.
 *
 * The 340px masthead is traded for a 48px bar on every page of a
 * thread, but the art in it is not chrome — the crosshair over a Steam
 * valve is what the board looks like. So it comes back once, on the
 * index, at the size the board draws it.
 *
 * A new <img> at the same file rather than the original moved out of
 * #wrapheader: that block is hidden rather than removed precisely
 * because other userscripts read it.
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

    // A file that will not load leaves a broken image where the board's
    // name should be, which is worse than not showing it.
    art.addEventListener("error", () => banner.remove(), { once: true });
    return banner;
}

/**
 * A skip link, as the first thing Tab reaches.
 *
 * The board has none, and the top bar this script adds puts a brand, a
 * breadcrumb, a search box and four buttons in front of the content on
 * every single page. Without a way past them, reaching the first topic
 * from the keyboard is eight tabs, every time.
 *
 * The target needs to be focusable or the browser moves the scroll
 * position and leaves focus behind, so it is given tabindex="-1".
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

function initNavbar() {
    if (!settings.get("navbar")) return;

    const bar = buildNavbar();
    document.body.prepend(bar);
    addSkipLink();                 // prepended after, so it lands first

    const centre = document.querySelector("#wrapcentre");
    const board = settings.get("boardLinks") ? buildBoardBar() : null;
    const banner = PAGE.isIndex && settings.get("masthead") ? buildMasthead() : null;

    /* The board's own art and the row of links it used to sit above,
       as one header block.

       They were two blocks stacked: 380px of picture with a thousand
       pixels of nothing beside it, and the links on their own line
       underneath. Beside each other they compose — the art anchors the
       left, the links fill the space it was leaving empty, and the
       page you land on gets its first listing row a hundred pixels
       higher. The stylesheet drops back to stacking them below the
       width where that stops fitting.

       Only the index has a masthead; everywhere else this is the
       board bar on its own, exactly as before. */
    if (centre && banner && board) centre.prepend(el("div.rr-header", {}, [banner, board]));
    else if (centre && board) centre.prepend(board);
    else if (centre && banner) centre.prepend(banner);

    // The forum anchors "back to top" at <a name="top">, which now sits
    // under the sticky bar; offset it so jumps land in the right place.
    // The same padding is what lands a post under the bar rather than
    // behind it when a link to one is followed (see settleFragment).
    document.documentElement.style.scrollPaddingTop = "calc(var(--rr-nav-h, 48px) + 14px)";
}

/**
 * <br> the template used as spacing, left stranded beside a block this
 * script injected.
 *
 * subsilver2 separates its strips with bare <br> rather than margins.
 * Where a strip has been folded into one of the script's own bars the
 * <br> stays behind as a 19px band: that is what sat between the action
 * bar and the filter bar, and what stopped the two being drawn as one
 * card, since a sibling combinator still sees a hidden element.
 *
 * Runs after every module, so a bar inserted late is covered too.
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

/* subsilver2 types the bars between its link strips into the template
   beside each link rather than generating them between the links that
   survive, and the links are conditional. So a reader who cannot see
   one gets its separator anyway — "Unsubscribe topic | Bookmark topic
   | | E-mail friend", or a lone `|` at the end of a cell that is still
   100% wide. Neither is visible logged out, which is why they survived
   this long.

   Same job dropStrayBreaks() does for the template's <br> spacing: a
   separator only belongs between two things that are there. */
/* A text node made of nothing but spacing and bars, holding at least
   one bar. It has to allow several: `</a>&nbsp;|&nbsp; &nbsp;|&nbsp;
   <a>` is a *single* text node in the DOM, so a rule written for one
   bar per node sees the doubled separator as ordinary text and leaves
   it exactly where it is. */
const SEPARATOR_TEXT = /^[\s |·•]*[|·•][\s |·•]*$/;
/* What one that earns its place is rewritten to. The board's own
   spacing, so a strip cannot break across lines at its punctuation. */
const SEPARATOR_KEPT = " | ";

/** Does this node take up room on the page? */
function occupies(node) {
    if (node.nodeType === 3) return Boolean(node.textContent.replace(/[\s ]/g, ""));
    if (node.nodeType !== 1) return false;
    if (node.tagName === "BR") return false;
    return node.getClientRects().length > 0;
}

/**
 * Drop the separators in one strip that separate nothing.
 *
 * Walks the strip's own child nodes in order. A separator is dropped
 * when there is no visible content before it, none after it, or the
 * thing before it was also a separator. Everything else is left
 * exactly as the board wrote it — this removes punctuation, never
 * content.
 *
 * Returns true if the strip has nothing visible left in it at all.
 */
function tidySeparators(strip) {
    /* Inside a strip that is not rendered at all, nothing "occupies"
       anything, so every separator would read as orphaned and the
       punctuation of a cell that may yet be shown again would be
       thrown away. A hidden strip is left exactly as it is. */
    if (!strip.getClientRects().length) return false;

    const nodes = Array.from(strip.childNodes);
    let pendingSeparators = [];
    let seenContent = false;
    let content = 0;

    for (const node of nodes) {
        if (node.nodeType === 3 && SEPARATOR_TEXT.test(node.textContent)) {
            // Held rather than kept: whether it belongs depends on
            // whether anything follows it.
            if (!seenContent) node.remove();
            else pendingSeparators.push(node);
            continue;
        }
        if (!occupies(node)) continue;
        // Something real: the first held separator earns its place —
        // normalised, in case it was carrying two — and any others
        // after it are duplicates.
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

/* Where the board writes those strips. Anything the script has already
   taken links out of is included: emptying a cell is exactly what
   leaves its punctuation stranded. */
const SEPARATOR_STRIPS = "#wrapcentre td.gensmall, #wrapcentre td.nav, #wrapcentre td.cat,"
    + " #wrapcentre p.searchbar, #wrapcentre span.gensmall, #wrapcentre .postbody + .gensmall";

/* A cell that is one column of a data table.

   Hiding such a cell does not blank the column, it removes it: every
   cell after it in that row slides one place left, out from under its
   own header. The Team page, where the board leaves the e-mail cell of
   a member with no address holding one &nbsp;, drew four values under
   five headings because of it. */
function isGridCell(cell) {
    if (cell.tagName !== "TD") return false;
    const row = cell.parentElement;
    if (!row || row.children.length < 3) return false;
    const table = cell.closest("table");
    return Boolean(table && table.querySelector(":scope > tbody > tr > th"));
}

/**
 * Runs after every module, for the same reason dropStrayBreaks() does:
 * a strip is only stranded once something has been moved out of it.
 *
 * A cell left with nothing but punctuation is hidden rather than
 * emptied, so the row it is in stops reserving a column for it — that
 * acre of nothing was a `td` at width 100% holding one character.
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
 * The breadcrumb strip is a full-width table of its own. Once the top
 * bar carries the breadcrumb and the toolbars have taken the search
 * box, what is left is an empty 18px band.
 *
 * Runs after the other modules, so it can tell whether anything still
 * needs that strip.
 */
function tidyCrumbStrip() {
    if (!settings.get("navbar")) return;

    for (const crumbs of document.querySelectorAll("#wrapcentre p.breadcrumbs")) {
        const strip = crumbs.closest("table.tablebg");
        if (!strip) continue;
        // A control that is still in the strip but no longer drawn does
        // not earn it a place: the board writes its search box into the
        // strip at the top of the page and the one at the bottom, and
        // the second copy is hidden by then (see dedupeSearchBoxes).
        // Measured rather than assumed, so a control hidden by any
        // route counts the same.
        const controls = Array.from(strip.querySelectorAll("form, input, select, textarea"));
        if (!controls.some((node) => node.getClientRects().length)) { strip.style.display = "none"; continue; }
        /* It survives for its search box alone — on a profile, the
           member list, the control panel, where there is no listing
           toolbar to move that box into. Drawn as a card it is a
           full-width grey band holding one field at its right-hand
           end; named here, the stylesheet draws it as a plain row.

           And the box itself gets the frame every other search box on
           this board now has, rather than staying the template's field
           beside a bordered button — which is the shape everything
           else was moved away from. */
        strip.setAttribute("data-rr-crumbstrip", "");
        frameBoardSearch(strip.querySelector("#search-box form, form#forum-search, form#topic-search"));
    }
}

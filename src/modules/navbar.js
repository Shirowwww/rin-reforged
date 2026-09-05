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

/* The board's own masthead art, and the window on to it.

   The masthead is 380x109 and mostly picture: an emblem on the left,
   CS.RIN.RU set in a squared face beside it, a strapline underneath.
   Shrunk whole to navbar height the wordmark lands at 7px, which is why
   an earlier version redrew it — and a redraw of a logo is a different
   logo.

   Cropping it keeps the board's actual art. The window is the wordmark
   alone: at 32px it stands 14px tall and reads exactly as the board
   sets it, where the emblem beside it is a dark shape on a dark plate
   that turns to a smudge at any size that fits in a bar.

   The board ships two of these and serves whichever the page asks for
   — site_logo-1 has a red crosshair over a Steam valve and the "Steam
   Underground Community" strapline, site_logo-2 a rifleman and
   "NonSteam Gaming Servers" — and the wordmark sits in a different
   place in each. One set of offsets framed the strapline on half the
   board's pages, so each file gets its own.

   These are pixel offsets into specific files. A file that is not one
   of them, or one whose dimensions have changed, falls back to the
   name set as type rather than showing a crop of the wrong thing. */
const LOGO_ART = {
    "site_logo-1": { natural: [380, 109], crop: [186, 6, 190, 42] },
    "site_logo-2": { natural: [380, 109], crop: [180, 18, 196, 32] },
};

const LOGO_HEIGHT = 26;

/** The crop for a logo URL, or null if it is not one this knows. */
function logoCrop(src) {
    for (const [name, art] of Object.entries(LOGO_ART)) {
        if (src.includes(name)) return art;
    }
    return null;
}

/** Where the template put the masthead art, whatever it is called. */
function findLogo() {
    return document.querySelector(
        '#logodesc img[src*="site_logo"], #wrapheader img[src*="site_logo"], #wrapheader img[src*="logo"]'
    );
}

function buildBrand() {
    const strapline = document.querySelector("#logodesc h1, #wrapheader h1");
    const source = findLogo();

    const brand = el("a.rr-nav__brand", {
        href: "./index.php",
        "aria-label": "Board index",
        title: strapline ? strapline.textContent.replace(/\s+/g, " ").trim() : "CS RIN - Steam Underground",
        // Until the art is measured the type wordmark is what shows, so
        // the bar is never briefly empty.
        "data-rr-logo": "type",
    });

    // The fallback, and what a board with different art gets: the name
    // in the wide tracking the wordmark uses.
    brand.append(el("span.rr-nav__word", {}, ["CS.RIN.RU"]));

    const src = source && source.getAttribute("src");
    const spec = src && logoCrop(src);
    if (!spec) return brand;

    const art = el("img.rr-nav__art", { src, alt: "CS.RIN.RU", decoding: "async" });
    const window_ = el("span.rr-nav__logo", { "aria-hidden": "true" }, [art]);

    const accept = () => {
        const [width, height] = spec.natural;
        if (art.naturalWidth !== width || art.naturalHeight !== height) {
            window_.remove();
            return;
        }
        for (const [name, value] of Object.entries(logoCropVars(spec))) {
            document.documentElement.style.setProperty(name, value);
        }
        brand.setAttribute("data-rr-logo", "art");
    };
    if (art.complete && art.naturalWidth) accept();
    else {
        art.addEventListener("load", accept, { once: true });
        art.addEventListener("error", () => window_.remove(), { once: true });
    }

    brand.prepend(window_);
    return brand;
}

/** One crop, as the custom properties the stylesheet reads. */
function logoCropVars(spec) {
    const [naturalW, naturalH] = spec.natural;
    const [x, y, cropW, cropH] = spec.crop;
    const scale = LOGO_HEIGHT / cropH;
    return {
        "--rr-logo-w": Math.round(cropW * scale) + "px",
        "--rr-logo-h": LOGO_HEIGHT + "px",
        "--rr-logo-img-w": Math.round(naturalW * scale) + "px",
        "--rr-logo-img-h": Math.round(naturalH * scale) + "px",
        "--rr-logo-x": "-" + Math.round(x * scale) + "px",
        "--rr-logo-y": "-" + Math.round(y * scale) + "px",
    };
}

/* ---- One search shape ---------------------------------------------- */

/* There were two.

   The palette trigger in the top bar was a fully rounded pill with a
   `Ctrl K` chip — the command-palette look every editor written since
   2020 has. The board's own search boxes, which this script moves into
   the topic bar and the listing toolbar, are a rectangular input beside
   a rectangular submit button. Both on screen at once, doing the same
   job, in two different visual languages, next to a `Reply` button with
   a third corner radius.

   The rule now is the one the rest of the interface already follows:
   **a control has the button radius; a pill is a label.** Tags, filter
   chips and the "latest version" badge stay pills because they are read
   rather than pressed. Everything you click is 7px.

   This is the second half: the board's form, given the same frame as
   the palette trigger — one field with the search glyph at its head and
   whatever it submits with tucked inside its right edge. The form is
   the board's own, moved, so its action, its hidden inputs and its
   tokens are untouched. */
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
    return el("div.rr-search", {}, [form]);
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
/* The board runs on donations and is asking for them right now: the
   overlay it shows every visitor says so. The link to that page was
   one of six greys in the masthead, and this row inherited that. It
   gets an outline and a heart — enough to find at a glance, not
   enough to shout, and still the board's own link with the board's own
   wording. */
const DONATE_RE = /donat/i;

function isDonateLink(link) {
    return DONATE_RE.test(link.getAttribute("href") || "")
        || DONATE_RE.test(link.textContent || "");
}

function boardBarLink(link) {
    const label = link.textContent.replace(/\s+/g, " ").trim();
    const image = link.querySelector("img");
    const donate = settings.get("donateHighlight") && isDonateLink(link);

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

    if (donate) {
        // The label goes in a span of its own so the narrow layout can
        // drop it and keep the heart. On a phone this row folds behind
        // a More control, and folding away the one link the board is
        // currently asking people to use — right after giving it an
        // outline — is emphasis nobody sees. As an icon it costs 26px
        // and stays on screen; the label it loses is on the link's
        // accessible name instead, so nothing is lost to a reader who
        // is not looking at it.
        link.textContent = "";
        link.classList.add("rr-boardbar__donate");
        link.append(icon("heart", 12), el("span.rr-boardbar__donate-label", {}, [label]));
        link.setAttribute("aria-label", label);
        link.setAttribute("title", label + " — the board is hosted on donations");
    }
    return link;
}

/* Twelve links in a row, in the order the masthead happened to print
   them, is a list of twelve things rather than a menu. They are three
   different kinds of thing and always were:

     views    — ways of looking at threads (unanswered, active, search)
     board    — what the board is (rules, FAQ, chat, donate, and
                anything else the masthead carries)
     account  — you (register, log in, log out, profile)

   Grouping them is also what stops `Logout [ name ]` landing alone on
   a second line: it was the twelfth item in one wrapping flex row, so
   it wrapped, and one word on its own line reads as a mistake. In the
   account group it sits with the two links it belongs with.

   Classified by destination, not by label, because the labels are
   translated and the hrefs are not. */
const BOARD_BAR_GROUPS = [
    { id: "views", label: "Threads", re: /search\.php/ },
    { id: "account", label: "Account", re: /ucp\.php|mode=(?:login|logout|register)|viewprofile|profile\.php/ },
    { id: "board", label: "Board", re: /(?:)/ },      // the rest
];

function boardBarGroup(href) {
    for (const group of BOARD_BAR_GROUPS) {
        if (group.re.test(href)) return group;
    }
    return BOARD_BAR_GROUPS[BOARD_BAR_GROUPS.length - 1];
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
        const node = boardBarLink(link);
        group.append(node);
        // Which group the donation link landed in, so the narrow layout
        // can keep that one showing while it folds the rest away.
        if (node.classList.contains("rr-boardbar__donate")) group.setAttribute("data-rr-donate", "");
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
        "aria-label": "More board links",
    }, ["More", icon("chevronD", 12)]);

    const bar = el("nav.rr-boardbar", { "aria-label": "Board links" }, [main, end, more]);

    more.addEventListener("click", () => {
        const open = bar.toggleAttribute("data-rr-open");
        more.setAttribute("aria-expanded", open ? "true" : "false");
    });

    return bar;
}

/**
 * Give a control a name, said three ways.
 *
 * These are glyphs with nothing beside them. `title` is the browser's
 * own tooltip and takes about a second of hovering to appear, which is
 * a second of not knowing what a button does; `aria-label` is what a
 * screen reader announces; `data-rr-tip` is what the stylesheet draws
 * on hover and on focus, straight away. All three say the same words,
 * from one argument, so they cannot drift apart.
 */
function labelled(node, text) {
    node.setAttribute("title", text);
    node.setAttribute("aria-label", text);
    node.setAttribute("data-rr-tip", text);
    return node;
}

function buildNavbar() {
    const bar = el("header.rr-nav", { role: "banner" });
    bar.append(buildBrand());

    bar.append(buildCrumbs());

    const actions = el("div.rr-nav__actions");

    if (settings.get("palette")) {
        const search = el("button.rr-nav__search", { type: "button", "aria-label": "Search and jump (Ctrl+K)" }, [
            icon("search"),
            el("span", {}, ["Search or jump to"]),
            el("span.rr-kbd.rr-nav__kbd", {}, [navigator.platform.startsWith("Mac") ? "⌘K" : "Ctrl K"]),
        ]);
        search.addEventListener("click", () => openPalette());
        bar.append(search);
    } else {
        const searchHref = findHeaderLink("search.php");
        if (searchHref) {
            actions.append(el("a.rr-icon-btn", { href: searchHref, title: "Search" }, [icon("search")]));
        }
    }

    const pmHref = findHeaderLink("i=pm", "ucp.php?i=pm");
    if (pmHref) {
        const unread = unreadMessages();
        const label = unread > 0
            ? "Private messages — " + unread + " unread"
            : "Private messages";
        const button = labelled(el("a.rr-icon-btn", { href: pmHref }, [icon("mail")]), label);
        if (unread > 0) button.append(el("span.rr-badge", {}, [String(unread)]));
        actions.append(button);
    }

    const ucpHref = findHeaderLink("mode=login", "ucp.php");
    if (ucpHref) {
        const label = isLoggedIn() ? "Your account" : "Log in";
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
        "RIN Reforged settings");
    settingsButton.addEventListener("click", () => openSettings());
    actions.append(settingsButton);

    bar.append(actions);
    return bar;
}

/* ---- The board's own masthead ------------------------------------- */

/**
 * The board's face, kept.
 *
 * The 340px masthead is replaced by a 48px bar, and that trade is
 * worth making on every page of a thread. But the art in it is not
 * chrome: a crosshair over a Steam valve with CS.RIN.RU set beside it
 * is what the board looks like, and a redesign that shows a 26px crop
 * of the wordmark and nothing else looks like any forum at all.
 *
 * So it comes back once, on the index, at the size the board draws it.
 * One page, 109px, where you land — everywhere else the bar carries
 * the wordmark and the content starts at the top.
 *
 * The node is a new <img> pointing at the same file rather than the
 * original moved out of #wrapheader: that block is hidden rather than
 * removed precisely because other userscripts read it, and this must
 * not be the thing that breaks them.
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
    if (!settings.get("skipLink")) return;
    const main = document.querySelector("#wrapcentre");
    if (!main || document.querySelector(".rr-skip")) return;

    if (!main.id) main.id = "rr-main";
    main.setAttribute("tabindex", "-1");

    const skip = el("a.rr-skip", { href: "#" + main.id }, ["Skip to content"]);
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
    document.documentElement.style.scrollPaddingTop = "60px";
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

/* subsilver2 writes its little link strips as literal text:

       <a ...>Unsubscribe topic</a>&nbsp;|&nbsp;
       <a ...>Bookmark topic</a>&nbsp;|&nbsp;
       <a ...>E-mail friend</a>

   The links are conditional. The bars between them are not — they are
   typed into the template beside each link rather than generated
   between the ones that survive. So a reader who cannot see one of
   those links gets its separator anyway, and the strip reads
   "Unsubscribe topic | Bookmark topic | | E-mail friend"; where the
   missing link is the last one, the bar is left hanging on its own at
   the far end of a cell that is still 100% wide, which is the lone `|`
   floating in an acre of nothing.
   
   Both were reported from the live board and neither is visible logged
   out, which is why they survived this long.

   This is the same job dropStrayBreaks() does for the template's <br>
   spacing, on the other thing it uses as punctuation: a separator only
   belongs between two things that are actually there. */
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
        if (controls.some((node) => node.getClientRects().length)) continue;
        strip.style.display = "none";
    }
}

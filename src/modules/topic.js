/* ------------------------------------------------------------------
   Reading a topic.

   A game thread opens with a Steam dump: header art, details, the full
   store description, system requirements and screenshots. That is
   thousands of words before the first reply that anyone came for.

   The card below keeps the details, folds the marketing copy, and puts
   the lookups people actually leave for (SteamDB, PCGamingWiki) one
   click away instead of one search away.
   ------------------------------------------------------------------ */

const REPLY_LINK = 'a[href*="mode=reply"], a[href*="mode=post"]';

/* How many opened topics the palette's Recent list keeps. It was a
   setting; nobody needs to tune it. */
const HISTORY_LIMIT = 100;

const EXTERNAL_LOOKUPS = [
    { id: "steamdb", label: "SteamDB", url: (appId) => "https://steamdb.info/app/" + appId + "/" },
    { id: "store", label: "Store page", url: (appId) => "https://store.steampowered.com/app/" + appId + "/" },
    { id: "charts", label: "SteamCharts", url: (appId) => "https://steamcharts.com/app/" + appId },
    { id: "protondb", label: "ProtonDB", url: (appId) => "https://www.protondb.com/app/" + appId },
];

function buildGameCard(info, body) {
    const card = el("section.rr-game", { "aria-label": "Game details" });

    if (info.header) {
        card.append(el("img.rr-game__art", {
            src: info.header,
            alt: "",
            loading: "lazy",
            referrerpolicy: "no-referrer",
        }));
    }

    const title = info.title || topicTitle() || "Game";

    const bodyCol = el("div.rr-game__body", {}, [
        el("h2.rr-game__title", {}, [title]),
    ]);

    if (info.appId) {
        bodyCol.append(el("div.rr-game__appid", {}, ["AppID " + info.appId]));
    }

    const wanted = ["Developer", "Publisher", "Release Date", "Genre(s)", "Language(s)", "Version"];
    const list = el("dl.rr-game__meta");
    let rows = 0;
    for (const label of wanted) {
        const value = info.fields[label];
        if (!value || /please login/i.test(value)) continue;
        list.append(el("dt", {}, [label.replace("(s)", "s")]));
        list.append(el("dd", {}, [value.length > 220 ? value.slice(0, 217) + "…" : value]));
        rows += 1;
    }
    if (rows) bodyCol.append(list);

    if (info.appId) {
        const links = el("div.rr-game__links");
        for (const lookup of EXTERNAL_LOOKUPS) {
            links.append(el("a.rr-btn", {
                href: lookup.url(info.appId),
                target: "_blank",
                rel: "noopener noreferrer",
            }, [lookup.label, icon("external", 12)]));
        }
        links.append(el("a.rr-btn", {
            href: "https://www.pcgamingwiki.com/api/appid.php?appid=" + info.appId,
            target: "_blank",
            rel: "noopener noreferrer",
        }, ["PCGamingWiki", icon("external", 12)]));
        bodyCol.append(links);
    }

    // The store link is the one thing guests cannot see; say so rather
    // than showing an empty row.
    const store = info.fields["Store Page"];
    if (store && /please login/i.test(store) && !info.appId) {
        bodyCol.append(el("p.rr-field__desc", {}, ["Log in to see the store link in the post below."]));
    }

    card.append(bodyCol);
    body.before(card);

    // The header art is now in the card; leaving the original in the
    // post shows the same image twice, one above the other. Hidden
    // rather than removed — it is a node somebody else's post put
    // there, another script may be looking for it, and nothing here
    // needs it gone, only out of the way.
    if (info.header) {
        for (const img of body.querySelectorAll("img")) {
            if (img.getAttribute("src") === info.header) {
                const line = img.nextElementSibling;
                img.style.display = "none";
                if (line && line.tagName === "BR") line.style.display = "none";
                break;
            }
        }
    }
    return card;
}

/**
 * Rewrite the topic heading the way listing rows are rewritten, so the
 * prefix reads as the same tag in both places.
 */
function decorateHeading() {
    const heading = document.querySelector("#pageheader h2");
    if (!heading || heading.querySelector(".rr-tag")) return;

    const link = heading.querySelector("a.titles") || heading;
    const { prefix, kind, rest } = splitPrefix(link.textContent.trim());
    if (!prefix) return;

    const raw = link.textContent;
    const at = raw.indexOf(rest);
    if (rest && at > 0) stripLeading(link, at);
    else link.textContent = rest;
    heading.prepend(el("span.rr-tag", { "data-tag": kind, style: { cursor: "default" } }, [prefix]));
    // Kept for anything that needs the bare title afterwards: reading it
    // back off the heading would pick the tag up again.
    heading.dataset.rrTitle = rest;
}

/** The topic title without its prefix, whether or not it had one. */
function topicTitle() {
    const heading = document.querySelector("#pageheader h2");
    if (!heading) return "";
    if (heading.dataset.rrTitle) return heading.dataset.rrTitle;
    const link = heading.querySelector("a.titles");
    return splitPrefix((link || heading).textContent.trim()).rest;
}

/**
 * One action bar for the topic.
 *
 * The template scatters these across four strips: a search box in its
 * own full-width table, a reply image button, "Page 1 of 19", and the
 * numbered page links. They belong on one line.
 */
/* One card, two rows, and the rule is written down rather than left to
   whatever fits.

   What was here was a single wrapping flex row holding, in the order
   the template happened to print them: a filled Reply button, the
   words "Page 1 of 1", four bare links, an outlined button with the
   same weight as Reply, and a search box. Three kinds of control on
   one line with nothing saying which mattered, one flexible spacer
   opening an arbitrary gap in the middle of the links, and a layout
   that reacted to how many controls a topic happened to have: on a one
   page topic the search sat inline, on a thirty-three page one the
   pager pushed it on to a line of its own. Same interface, two shapes,
   for a reason no reader could name.

   The rule now:

     Row 1 - this topic. What you do here (Reply), what you can do to
             what is on screen (open the spoilers, jump to your first
             unread), and where in the topic you are (the pager).
     Row 2 - everywhere else. The topic before and after this one, the
             print view, and the box that searches inside it.

   Both rows exist on every topic, whatever its page count, so the bar
   is the same shape on a one page thread and a thirty-three page one.
   A row nothing landed in is not drawn - but nothing moves between
   rows to make that happen. */
function topicBarRow(name) {
    return el("div.rr-topicbar__row", { "data-rr-row": name });
}

/* Every child of a cluster is named, once it is filled.

   The stylesheet draws the hairlines between them and rounds the two
   ends, and the obvious way to write that is `.rr-cluster > * + *` —
   a selector whose rightmost part is the universal one, which the
   engine then tests against every element on the page. On a listing
   that is four thousand elements and it measured 30ms of style work.
   A class costs nothing to match. */
function sealCluster(node) {
    for (const child of node.children) child.classList.add("rr-cluster__item");
    return node;
}

function buildTopicBar() {
    const header = document.querySelector("#pageheader");
    if (!header || header.querySelector(".rr-topicbar")) return;

    const bar = el("div.rr-topicbar", { "data-rr-rows": "" });
    const info = pagination();

    const here = topicBarRow("here");
    const away = topicBarRow("away");
    bar.append(here, away);

    const reply = document.querySelector(REPLY_LINK);
    if (reply) {
        const button = el("a.rr-btn", { href: reply.getAttribute("href"), "data-variant": "primary" }, [
            icon("reply", 13),
            t(/mode=post/.test(reply.getAttribute("href")) ? "New topic" : "Reply"),
        ]);
        here.append(button);
        /* The *cell* the reply button is in, not the table it is in.
           subsilver2 puts the reply button, "Page 16 of 16", the post
           count and the member's own topic actions in one row of one
           table, so hiding the table to get rid of the duplicated
           button took Unsubscribe topic, Bookmark topic and E-mail
           friend with it — silently, and only for members, which is
           why nothing here had noticed. */
        const cell = reply.closest("td");
        if (cell) cell.style.display = "none";
        else {
            const strip = reply.closest("table");
            if (strip) strip.style.display = "none";
        }
    }

    /* Secondary, and drawn as secondary. "Open all N spoilers" was an
       outlined button of exactly the same size and weight as Reply,
       which is the loudest thing this bar can say about a control that
       reveals text the page has already loaded. */
    if (settings.get("spoilerAll")) {
        const inputs = spoilerInputs();
        if (inputs.length >= 2) {
            /* It stays, and closes them again on the second press. It
               used to remove itself once pressed, which took the focus
               with it and left a reader with thirty open spoilers and
               no way back. The state is read off the page rather than
               assumed: with spoilers opened at load, this starts as
               the control that closes them. */
            const count = inputs.length;
            let open = spoilerInputs("hide").length === count;
            const control = el("button.rr-btn.rr-fold", { type: "button", "data-variant": "quiet" });
            const relabel = () => {
                control.replaceChildren(icon("chevronD", 13), t(open ? "Close all {n} spoilers" : "Open all {n} spoilers", { n: count }));
                control.setAttribute("aria-expanded", open ? "true" : "false");
                control.toggleAttribute("data-rr-open", open);
            };
            relabel();
            control.addEventListener("click", () => {
                for (const input of spoilerInputs(open ? "hide" : "show")) input.click();
                open = !open;
                relabel();
            });
            here.append(control);
        }
    }

    /* The board's own "First unread post", printed for members in the
       strip that also holds the reply button. It is the same journey
       people.js builds a link for when the board prints none, so it is
       taken as it is — the board's href carries the #unread anchor —
       and people.js leaves the bar alone when it finds one here. */
    const unread = document.querySelector('#wrapcentre td.nav > a[href*="view=unread"]');
    if (unread) {
        const cell = unread.closest("td");
        unread.classList.add("rr-btn");
        unread.setAttribute("data-variant", "quiet");
        unread.setAttribute("title", "Jump to the first post you have not read");
        unread.textContent = "";
        unread.append(icon("arrowDown", 13), "First unread");
        here.append(unread);
        if (cell) cell.style.display = "none";
    }

    // people.js drops "First unread" in here, in front of this.
    here.append(el("span.rr-topicbar__spacer"));

    /* Where in the topic you are. On a topic with one page that is not
       a fact worth a control, a label, or the space either takes:
       "Page 1 of 1" answered a question nobody with the whole thing in
       front of them was asking. */
    if (info.total && info.total > 1) {
        here.append(settings.get("quickPager")
            ? buildPagerGroup(info)
            : el("span.rr-topicbar__count", {}, [t("Page {a} of {b}", { a: info.current, b: info.total })]));
    }

    /* Two clusters, not six loose words: where to go next, and what a
       member can do to this topic. Each is one light box with a
       hairline between its items, so the row reads as two things
       rather than a list of everything. */
    const nav = el("div.rr-cluster.rr-topicbar__cluster");
    adoptTopicNav(nav);
    const member = el("div.rr-cluster.rr-topicbar__cluster");
    adoptMemberActions(member);
    for (const cluster of [nav, member]) if (cluster.children.length) away.append(sealCluster(cluster));
    away.append(el("span.rr-topicbar__spacer"));

    const form = document.querySelector("#topic-search, #search-box form");
    if (form) {
        const strip = form.closest("table.tablebg");
        away.append(el("div.rr-topicbar__search", {}, [adoptBoardSearch(form)]));
        // What is left of that strip is the breadcrumb, which the top
        // bar already carries.
        if (strip) strip.style.display = "none";
    }

    // A row nothing landed in but its own spacer is not drawn.
    for (const row of [here, away]) {
        if (!row.querySelector(":scope > :not(.rr-topicbar__spacer)")) row.remove();
    }

    header.after(bar);
    tidyBoardPagerStrip(bar, here);

    // The numbered strip under the title says the same thing as the
    // pager, less usefully.
    for (const strip of header.querySelectorAll("p.gensmall, span.gensmall")) {
        if (/Go to page|На страницу/.test(strip.textContent)) strip.style.display = "none";
    }
}

/* What the board says about where you are, once this bar says it too.

   phpBB draws a strip above and below the posts carrying "Page 16 of
   16" and "[ 239 posts ]". The action bar now carries the first as a
   pager you can type into, so the board's copies are a band of the
   screen each, twice per page, saying something already on screen —
   and on a topic that fits on one page, "Page 1 of 1" twice.

   Cell by cell rather than strip by strip, because the member's own
   topic actions share that row and they are not a duplicate of
   anything. The post count is worth keeping, so the first one found
   moves into the bar; the rest go with the page counters. */
const PAGE_OF_RE = /^\s*(?:Page\s+\d+\s+of\s+\d+|Страница\s+\d+\s+из\s+\d+)\s*$/;
/* "[ 239 posts ]" — or, on the Russian interface, "[ Сообщений: 239 ]"
   and "[ Тем: 61487 ]", the word first. */
const POST_COUNT_RE = /^\s*\[\s*(?:([\d\s]+)\s+(posts?|topics?)|(Сообщений|Тем):\s*([\d\s]+))\s*\]\s*$/i;

function postCount(text) {
    const m = text.match(POST_COUNT_RE);
    if (!m) return null;
    const digits = (m[1] || m[4]).replace(/\s+/g, "");
    const unit = (m[2] || m[3]).toLowerCase();
    return digits + " " + (unit === "сообщений" ? "сообщений" : unit === "тем" ? "тем" : unit);
}

function tidyBoardPagerStrip(bar, row) {
    // The listing bar lifts its own "[ N topics ]" before calling this,
    // and the board prints the strip twice, above and below the table.
    // Starting from "not yet counted" put a second count in the bar on
    // every forum listing — "841 topics  841 topics".
    let counted = Boolean(bar.querySelector(".rr-topicbar__count"));

    for (const cell of document.querySelectorAll("#wrapcentre td.nav, #wrapcentre td.gensmall")) {
        if (cell.querySelector("a[href], form, input, select")) continue;
        const text = cell.textContent.replace(/\s+/g, " ");

        if (PAGE_OF_RE.test(text)) { cell.style.display = "none"; continue; }

        const count = postCount(text);
        if (!count) continue;
        if (!counted) {
            counted = true;
            row.append(el("span.rr-topicbar__count", {}, [count]));
        }
        cell.style.display = "none";
    }

    hideEmptyBoardStrips(bar);
}

/* Is anything between `node` and `root` hidden inline? The strips are
   emptied cell by cell, and a cell inside a hidden cell is as gone as
   its parent. */
function hiddenWithin(node, root) {
    for (let n = node; n && n !== root; n = n.parentElement) {
        if (n.style && n.style.display === "none") return true;
    }
    return false;
}

/* A row of a board strip with every cell hidden is still a row: a 20px
   band with a border and nothing in it, between the Releases panel and
   the first post. textContent sees through display:none — the hidden
   cells' "|" separators and the reply link they still hold counted as
   life — so only what is not hidden counts. */
function hideEmptyBoardStrips(bar) {
    for (const strip of document.querySelectorAll("#wrapcentre table.tablebg")) {
        if (bar && strip.contains(bar)) continue;
        if (strip.querySelector(".postbody, .rr-releases, form")) continue;
        const cells = Array.from(strip.querySelectorAll("td"));
        if (!cells.length) continue;
        const alive = cells.some((cell) => {
            if (hiddenWithin(cell, strip)) return false;
            const own = Array.from(cell.childNodes)
                .filter((n) => n.nodeType === 3).map((n) => n.textContent).join("")
                .replace(/[\s\u00a0|]+/g, "");
            if (own) return true;
            return Array.from(cell.querySelectorAll("img, a, input, select, button"))
                .some((node) => !hiddenWithin(node, strip));
        });
        if (!alive) strip.style.display = "none";
    }
}

/* "Previous topic", "Subscribe topic", "E-mail friend": on a phone the
   second row of the bar is three lines of these. The noun is the same
   on every one and the row says it already, so it is marked optional
   and the narrow layout drops it — "Previous · Next · Subscribe". */
function labelWithOptionalTail(link, label) {
    const m = label.match(/^(.*\S)(\s+(?:topic|friend|тема|другу))$/i);
    link.textContent = "";
    // The noun keeps its own space and the stylesheet takes the flex
    // gap off it: a word space, not a 6px slot.
    if (m) link.append(document.createTextNode(m[1]), el("span.rr-opt", {}, [m[2]]));
    else link.append(document.createTextNode(label));
}

/* The board's forum-rules box, which subsilver2 writes with
   `style="margin-bottom: 2px"` typed into the tag. An inline style
   beats every rule in this stylesheet without a fight, so the box sat
   2px above the topic title: two blocks with nothing to do with each
   other, touching. Block spacing is a token here; this hands the box
   back to it. */
function spaceForumRules() {
    for (const cell of document.querySelectorAll("#wrapcentre td.row3")) {
        const box = cell.closest("table.tablebg");
        if (box && box.style.marginBottom) box.style.marginBottom = "";
    }
}

/**
 * Print view, Previous topic and Next topic.
 *
 * The template gives those three links a full-width bar of their own,
 * 40px tall and empty but for a word at each end. They are ordinary
 * topic actions, so they join the other ones; the strip they came from
 * is then empty and goes.
 */
function adoptTopicNav(bar) {
    const strip = Array.from(document.querySelectorAll("#wrapcentre table.tablebg"))
        .find((table) => table.querySelector('td.cat a[href*="view=print"], td.cat a[href*="view=next"]'));
    if (!strip) return;

    const wanted = [
        { match: /view=previous/, label: "Previous topic" },
        { match: /view=next/, label: "Next topic" },
        // The one of the three that really does leave the page.
        { match: /view=print/, label: "Print view", glyph: "external" },
    ];

    for (const { match, label, glyph } of wanted) {
        const link = Array.from(strip.querySelectorAll("a[href]"))
            .find((a) => match.test(a.getAttribute("href") || ""));
        if (!link) continue;
        link.classList.add("rr-btn", "rr-topicnav");
        link.setAttribute("data-variant", "quiet");
        const shown = t(label);
        link.setAttribute("title", shown);
        labelWithOptionalTail(link, shown);
        if (glyph) link.append(icon(glyph, 12));
        bar.append(link);
    }

    if (!strip.querySelector("a[href], form, input")) strip.style.display = "none";
}

/**
 * Subscribe topic, Bookmark topic and E-mail friend.
 *
 * The three things a member can do to a topic besides answering it.
 * subsilver2 prints them for members only, in a `td.nav` of the same
 * strip as the reply button — which buildTopicBar hides cell by cell
 * precisely so these survive — and a second time under the posts. Left
 * where they were they made a grey band of their own between the bar
 * and the first post, with a "First unread post" at the far end that
 * the bar already carries. They are topic actions; they join the
 * others, once, with the words the board gave them ("Unsubscribe
 * topic" when you already are).
 */
const MEMBER_ACTION = 'a[href*="watch=topic"], a[href*="bookmark="], a[href*="mode=email"]';

function adoptMemberActions(bar) {
    // td.nav on the live board; a td.gensmall in the strip's other
    // shape. Either way it is the cell holding the three links.
    const cells = Array.from(document.querySelectorAll("#wrapcentre td.nav, #wrapcentre td.gensmall"))
        .filter((cell) => cell.querySelector(MEMBER_ACTION) && !cell.closest(".rr-topicbar"));
    if (!cells.length) return;

    for (const link of cells[0].querySelectorAll(MEMBER_ACTION)) {
        const label = link.textContent.replace(/\s+/g, " ").trim() || link.getAttribute("title") || "";
        if (!label) continue;
        link.classList.add("rr-btn", "rr-topicnav");
        link.setAttribute("data-variant", "quiet");
        link.setAttribute("title", label);
        labelWithOptionalTail(link, label);
        bar.append(link);
    }
    for (const cell of cells) cell.style.display = "none";
}

function buildPagerGroup(info) {
    const jump = el("input.rr-pager__input", {
        type: "number",
        min: "1",
        max: String(info.total),
        value: String(info.current),
        "aria-label": t("Go to page"),
    });
    const go = () => {
        const target = clamp(parseInt(jump.value, 10) || 1, 1, info.total);
        const href = pageHref(target);
        if (href) location.href = href;
        else toast(t("Could not work out that page"));
    };
    jump.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); go(); } });
    jump.addEventListener("change", go);

    /* "Next" and "Last" sat three controls away from "Next topic" and
       "Previous topic" in the same weight and the same colour: two
       different journeys wearing one costume. Two things separate them
       now and either would do on its own — they are in different rows
       of the bar, and these say what they move. A page.

       The four steps and the page box are one boxed control, with a
       hairline between its parts. The two ends are the arrows alone,
       and their names are drawn the instant they are pointed at, so
       "⇥" is never a guess: it says "Last page". */
    /* `word` is what is drawn; `label` is the whole name, on the title
       and for a screen reader. The ends draw the arrow alone and say
       their name on hover. */
    const step = (href, label, glyph, word) => {
        const link = el("a.rr-pager__step", { href }, glyph === "pageFirst" || glyph === "chevronL"
            ? [icon(glyph, 13), word || null]
            : [word || null, icon(glyph, 13)]);
        if (!word) return labelled(link, label);
        link.setAttribute("title", label);
        link.setAttribute("aria-label", label);
        return link;
    };

    return sealCluster(el("div.rr-pager.rr-cluster", { role: "group", "aria-label": t("Pages of this topic") }, [
        info.hasPrevious ? step(info.first, t("First page"), "pageFirst") : null,
        info.hasPrevious ? step(info.previous, t("Previous page"), "chevronL", t("Previous")) : null,
        el("span.rr-pager__where", {}, [
            el("span.rr-pager__label", {}, [t("Page")]),
            jump,
            el("span.rr-pager__label", {}, [t("of {n}", { n: info.total })]),
        ]),
        info.hasNext ? step(info.next, t("Next page"), "chevron", t("Next")) : null,
        info.hasNext ? step(info.last, t("Last page"), "pageLast") : null,
    ]));
}

/* ---- What a rank line says, and in which language ------------------ */

/* This board prints both halves of a user's rank on every page,
   whichever language the page is in: "Super flooder Почетный
   графоман", "I live here Три раза сломал клаву :)", and — for anyone
   who has never been given one — "Beginner Без звания", which is
   Russian for "no rank". So an English forum shows a Russian phrase
   under a name, and for most posters the phrase means the field is
   empty.
   
   Where a rank carries both languages, the page's own language decides
   which half to show. Where it carries only one it is left alone: a
   rank that is Latin-only is not a translation of anything, and
   dropping it because the page is Russian would empty the line under
   every administrator on the board.

   The original stays on the title attribute, so nothing is actually
   taken away. */
const CYRILLIC_RE = /[\u0400-\u04FF]/;

function localiseRank(text) {
    const clean = text.replace(/\s+/g, " ").trim();
    const lang = currentLanguage();
    if (!CYRILLIC_RE.test(clean) || !lang) return clean;

    /* On the English interface the Russian words go; on the Russian
       one the Latin ones do — "I live here Три раза сломал клаву :)"
       reads "Три раза сломал клаву :)" there. A word with no letters
       of either kind (":)", "<3") sides with whichever half stays. */
    const LATIN_RE = /[A-Za-z]/;
    const kept = lang === "en"
        ? clean.split(" ").filter((word) => !CYRILLIC_RE.test(word))
        : clean.split(" ").filter((word) => !LATIN_RE.test(word) || CYRILLIC_RE.test(word));
    /* Punctuation that belonged to the half that just went. "I live
       here Три раза сломал клаву :)" is one rank in two languages with
       the smiley on the end of the Russian half, and dropping the
       Russian words alone leaves "I live here :)" — the tail of a
       sentence that is no longer there. A trailing run with no letters
       in it goes with them. A rank that is *only* punctuation, like
       "Super-Donor <3", never reaches this: it has no Cyrillic in it
       and was returned untouched three lines ago. */
    while (kept.length && !/[A-Za-z0-9\u0400-\u04FF]/.test(kept[kept.length - 1])) kept.pop();
    return kept.join(" ").replace(/[\s|·,;:/–—-]+$/, "").trim();
}

/* "Joined: Thursday, 13 Feb 2020, 13:07 · Posts: 2180" does not fit
   the line it is on, and clipping it landed the ellipsis inside the
   time — "13 Feb 2020, 13:…" — which reads as a broken value rather
   than as a shortened sentence.

   The rest of the interface already shortens dates the same way: the
   weekday goes, the full thing stays on hover. A join *date* has no
   use for a clock either. Shortened, the line fits, so nothing is
   clipped at all — and the width cap that did the clipping is gone
   with it. */
const JOIN_TIME_RE = /(\d{4}),\s*\d{1,2}:\d{2}(?::\d{2})?/g;

function shortenPostMeta(text) {
    return text
        .replace(/(?:\b(?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day|Понедельник|Вторник|Среда|Четверг|Пятница|Суббота|Воскресенье),\s*/gi, "")
        .replace(JOIN_TIME_RE, "$1")
        /* The post count, and only the post count. This line is
           "Joined: 15 Nov 2005 · Posts: 12575", and a sweep over it
           that grouped from four digits would turn the year into
           "2 005". The count is named right there in the text; the
           year is not. */
        .replace(/((?:Posts|Сообщения):\s*)(\d+)/i, (all, label, count) => label + groupDigits(count))
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Rebuild a post as a header strip over a full-width message.
 *
 * The template puts the author in a 150px column beside the message,
 * so a two-line reply still occupies the height of an avatar, a rank,
 * a join date and a post count. Moving that into one line above the
 * message recovers the space and reads the way every forum written
 * this century reads.
 *
 * Nothing is deleted: the original cell is hidden, and the nodes are
 * moved rather than copied, so links and handlers survive.
 */
function modernisePost(post) {
    const cell = post.table.querySelector("td.profile");
    if (!cell || cell.classList.contains("rr-profile")) return;
    cell.classList.add("rr-profile");

    const details = Array.from(cell.querySelectorAll(".postdetails"));
    const avatar = cell.querySelector('img[src*="avatar"], img[src*="file.php"]');

    // The first detail block is the rank line ("Administrator",
    // "I live here"); the ones after it are Joined and Posts.
    const META_RE = /joined|posts|зарегистрирован|сообщени/i;
    const rank = details.find((node) => !META_RE.test(node.textContent));
    const meta = details.filter((node) => META_RE.test(node.textContent));

    const head = el("div.rr-posthead");

    if (avatar) {
        avatar.classList.add("rr-posthead__avatar");
        avatar.removeAttribute("width");
        avatar.removeAttribute("height");
        head.append(avatar);
    }

    const identity = el("div.rr-posthead__who");
    if (post.author) {
        // The name is a <b> in the header row; a link to the profile is
        // more useful, when the template gives us one.
        const profileLink = cell.querySelector('a[href*="viewprofile"]')
            || post.table.querySelector('a[href*="viewprofile"]');
        const name = el("span.rr-posthead__name", {}, [post.author.textContent.trim()]);
        if (profileLink) {
            const wrapped = el("a", { href: profileLink.getAttribute("href") }, [name]);
            // Role colour is an inline style on the profile link.
            const colour = profileLink.style.color;
            if (colour) name.style.color = colour;
            identity.append(wrapped);
        } else {
            identity.append(name);
        }
    }
    if (rank) {
        const full = rank.textContent.replace(/\s+/g, " ").trim();
        const shown = localiseRank(full);
        if (shown) identity.append(el("span.rr-posthead__rank", { title: full }, [shown.slice(0, 60)]));
    }
    head.append(identity);

    if (meta.length) {
        // The template runs "Joined: ...Posts: 2180Location: here"
        // together in one block often enough that the separators have
        // to be put back — before every label, not only Posts.
        const summary = meta
            .map((node) => node.textContent.replace(/\s+/g, " ").trim())
            .join(" · ")
            .replace(/(\S)\s*((?:Posts|Location|Gender|Age|Occupation|Interests|Website|Joined|Warnings|Rank|Сообщения|Откуда|Пол|Возраст|Род занятий|Интересы|Сайт|Зарегистрирован|Предупреждения):)/g, "$1 · $2");
        head.append(el("span.rr-posthead__meta", { title: summary }, [shortenPostMeta(summary)]));
    }

    head.append(el("span.rr-posthead__spacer"));

    // The posted date lives in its own row above the message; on one
    // line with the author it stops being a row of its own.
    if (post.headCell) {
        const posted = Array.from(post.headCell.querySelectorAll("b"))
            .find((node) => /^(?:Posted|Добавлено):/i.test(node.textContent));
        if (posted && posted.nextSibling) {
            const when = posted.nextSibling.textContent.trim();
            if (when) {
                // The weekday goes, as everywhere else; the full date
                // stays on the title.
                head.append(el("time.rr-posthead__date", { title: when }, [when.replace(WEEKDAY_RE, "")]));
                posted.parentElement.style.display = "none";
            }
        }
    }

    post.body.before(head);
    post.head = head;

    // The template's own header row held the author name, the subject
    // and the date. All three are in the new header now, so the row is
    // an empty band with 12px of padding.
    const originalRow = post.anchor.closest("tr");
    if (originalRow && !originalRow.querySelector(".postbody")) originalRow.style.display = "none";

    hideEmptyPostRows(post.table);
}

/**
 * subsilver2 leaves a row for the edit / delete controls and another
 * for the "Top" link under every post. For a reader without those
 * permissions they are 90px of nothing.
 */
function hideEmptyPostRows(table) {
    for (const row of table.querySelectorAll("tr")) {
        if (row.querySelector(".postbody, .rr-posthead")) continue;
        if (row.querySelector("input, textarea, select")) continue;
        if (row.textContent.trim()) continue;
        row.style.display = "none";
    }
}

function foldSteamBlurb(body, fromTitle) {
    const start = fromTitle || steamBlurbStart(body);
    if (!start) return;

    const folded = [];
    let cursor = start;
    while (cursor) {
        const next = cursor.nextSibling;
        folded.push(cursor);
        cursor = next;
    }
    if (folded.length < 3) return;

    const holder = el("div");
    for (const node of folded) holder.append(node);

    /* The original post is shown by default: the card above it is a
       summary, and the post is what was actually written — the
       download notes, the links, the caveats. The fold stays as a
       control, and a reader who closes it is remembered. The Steam
       description alone (no card to summarise it) still starts
       folded. */
    const label = t(fromTitle ? "the original post" : "the full Steam description");
    let open = fromTitle ? store.get("originalPostOpen", true) !== false : false;
    const toggle = el("button.rr-btn.rr-fold", { type: "button", "data-variant": "quiet" }, [
        icon("chevronD"),
        "",
    ]);
    const sync = () => {
        holder.hidden = !open;
        toggle.lastChild.textContent = t(open ? "Hide " : "Show ") + label;
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.toggleAttribute("data-rr-open", open);
    };
    toggle.addEventListener("click", () => {
        open = !open;
        sync();
        if (fromTitle) store.set("originalPostOpen", open);
    });
    sync();

    body.append(toggle, holder);
}

/* ---- Per-post tools ---------------------------------------------- */

function postUrl(postId) {
    return location.origin + location.pathname.replace(/[^/]*$/, "") +
        "viewtopic.php?p=" + postId + "#p" + postId;
}

/* What the board's per-post controls are, read off where they go.

   icons.js names each one from its image's alt text, which works until
   the board ships an image without one — and then the control is a
   bare 12px silhouette on the end of a row of labelled buttons, which
   is what was reported. The destination is the one thing that is
   always there, so it is what the fallback reads. */
const POST_CONTROL_NAMES = [
    { re: /mode=viewprofile/, label: "Profile" },
    { re: /[?&]i=pm|mode=post&[^"]*u=/, label: "Send private message" },
    { re: /mode=email/, label: "E-mail" },
    { re: /mode=report/, label: "Report this post" },
    { re: /mode=(?:edit|editpost)/, label: "Edit post" },
    { re: /mode=delete/, label: "Delete post" },
    { re: /mode=quote/, label: "Reply with quote" },
    { re: /[?&]p=\d+.*#p\d+$/, label: "Link to this post" },
];

/** Give a control a visible label, if it has not got one already. */
function nameControl(control) {
    if (control.querySelector(".rr-ctl__label") || control.textContent.trim()) return control;

    const href = control.getAttribute("href") || "";
    const known = POST_CONTROL_NAMES.find((entry) => entry.re.test(href));
    const label = known ? known.label
        : (control.getAttribute("title") || "").trim();
    if (!label) return control;

    control.setAttribute("title", label);
    control.append(el("span.rr-ctl__label", {}, [label]));
    return control;
}

/** Everything in a post's control row, named the way the top bar's
    icons are: instantly, rather than after a second of hovering. */
function labelPostTools(tools) {
    for (const control of tools.children) {
        if (control.classList.contains("rr-postnum")) continue;
        const name = (control.getAttribute("aria-label") || control.getAttribute("title") || "").trim();
        if (name) labelled(control, name);
        control.setAttribute("data-rr-tip-side", "above");
    }
}

function addPostTools(post, index) {
    if (!post.headCell) return;

    // "Post subject: Re: <the topic title>" is the default phpBB fills
    // in; it repeats the heading on every single post.
    for (const label of post.headCell.querySelectorAll("b")) {
        if (!/^Post subject:/i.test(label.textContent)) continue;
        const subject = (label.nextSibling && label.nextSibling.textContent || "").trim();
        if (/^Re:/i.test(subject) || !subject || subject === topicTitle()) {
            label.parentElement.style.display = "none";
        }
        break;
    }

    const tools = el("div.rr-posttools");

    /* One control per destination.

       The board draws its own "Reply with quote" under every post and
       this row added another, as an icon, pointing at the same URL:
       two controls, one address, side by side, one of them labelled
       and one of them not. Whichever arrives second is the one that
       goes.

       Compared by destination with the session id taken out, because
       phpBB stamps a different one into every link on the page. */
    const destinations = new Set();
    const wanted = (node) => {
        const href = (node.getAttribute("href") || "").replace(/[?&]sid=[a-f0-9]+/, "");
        if (!href) return true;
        if (destinations.has(href)) return false;
        destinations.add(href);
        return true;
    };

    /* The board's own permalink to this post is a 12px target icon in
       an anchor, which icons.js labels from its alt text — and its alt
       text is the single word "Post". Sat in a row of controls it
       reads as "post something", it is the only text button among the
       icons at the head of the row, and it goes to precisely where the
       copy-link button beside it copies. One address, two controls,
       one of them named after a verb it does not do.

       So the two become one: the post number, which was a decorative
       span, becomes the link, and the board's control is left in place
       and hidden. */
    const permalink = Array.from(post.table.querySelectorAll("a.rr-ctl")).find((control) => {
        const href = control.getAttribute("href") || "";
        return /[?&]p=\d+/.test(href) && /#p\d+$/.test(href);
    });
    if (permalink) permalink.style.display = "none";

    const numberLabel = "#" + (index + 1);
    const numberTitle = permalink
        ? "Post " + (index + 1) + " on this page — open it on its own"
        : "Post " + (index + 1) + " on this page";
    tools.append(permalink
        ? el("a.rr-postnum", { href: permalink.getAttribute("href"), title: numberTitle }, [numberLabel])
        : el("span.rr-postnum", { title: numberTitle }, [numberLabel]));

    const linkButton = labelled(
        el("button.rr-icon-btn", { type: "button" }, [icon("link")]), t("Copy link to this post"));
    linkButton.addEventListener("click", () => copyText(postUrl(post.id), "Post link copied"));
    tools.append(linkButton);

    /* Every mirror in this post, one to a line. A release post carries
       three to six of them and queueing them in a download manager
       meant opening each in turn. */
    const own = ownContent(post.body);
    const mirrors = Array.from(own.querySelectorAll("a[href]"))
        .map((a) => a.getAttribute("href"))
        .filter((href) => href && isOffsite(href));
    const unique = mirrors.filter((href, at) => mirrors.indexOf(href) === at);
    if (unique.length > 1) {
        const linksButton = labelled(
            el("button.rr-icon-btn", { type: "button" }, [icon("layers")]),
            t("Copy every link in this post"));
        linksButton.addEventListener("click", () => {
            copyText(unique.map((href) => new URL(href, location.href).href).join("\n"),
                t(unique.length === 1 ? "{n} link copied" : "{n} links copied", { n: unique.length }));
        });
        tools.append(linksButton);
    }

    /* The archive password this post names, if it names one. */
    if (settings.get("finder")) {
        const password = passwordIn(own.textContent);
        if (password) {
            const chip = el("button.rr-pass", {
                type: "button",
                title: t("Copy the password"),
            }, [el("span.rr-pass__label", {}, [t("Password")]), el("code.rr-pass__value", {}, [password])]);
            chip.addEventListener("click", () => copyText(password, t("Password copied")));
            tools.append(chip);
        }
    }

    const quoteButton = labelled(
        el("button.rr-icon-btn", { type: "button" }, [icon("quote")]), t("Copy as a quote"));
    quoteButton.addEventListener("click", () => {
        const author = post.author ? post.author.textContent.trim() : "";
        const text = post.body.textContent.trim().replace(/\n{3,}/g, "\n\n");
        copyText("[quote=\"" + author + "\"]" + text + "[/quote]", "Quote copied");
    });
    tools.append(quoteButton);

    /* Deliberately not added when the board's own labelled control for
       the same URL is about to join the row below. */
    const replyLink = post.table.querySelector('a[href*="mode=quote"]');
    if (replyLink && !post.table.querySelector("a.rr-ctl[href*='mode=quote']")) {
        const reply = labelled(
            el("a.rr-icon-btn", { href: replyLink.getAttribute("href") }, [icon("reply")]),
            "Reply with quote");
        if (wanted(reply)) tools.append(reply);
    }

    // Controls the board drew as a bare GIF, relabelled by icons.js.
    // They sit in a footer strip of their own under every post; here
    // they join the other per-post actions, which is one place to look
    // instead of two and one row less per post.
    for (const control of post.table.querySelectorAll("a.rr-ctl")) {
        if (control === permalink) continue;
        const row = control.closest("tr");
        if (!wanted(control)) { control.style.display = "none"; continue; }
        tools.append(nameControl(control));
        if (row && !row.textContent.trim() && !row.querySelector("a[href], input")) {
            row.style.display = "none";
        }
    }

    // Anything else the board drew as a bare image in this post's
    // control rows and icons.js could not name from its alt text. A
    // silhouette with nothing beside it is not a control anybody can
    // use, and one of them was sitting on the end of every post.
    for (const orphan of post.table.querySelectorAll("a > img.rr-legacy-img")) {
        const link = orphan.closest("a");
        if (!link || link.closest(".postbody") || link.closest(".rr-posttools")) continue;
        if (link.textContent.trim()) continue;
        link.classList.add("rr-ctl");
        nameControl(link);
        if (!link.querySelector(".rr-ctl__label")) continue;
        orphan.style.display = "none";
        tools.append(link);
    }

    const holder = post.head
        || post.headCell.querySelector('div[style*="right"]')
        || post.headCell;
    holder.append(tools);
    labelPostTools(tools);
}

/* ---- Where you stopped reading ------------------------------------ */

/* phpBB tracks unread posts for members and for nobody else, and even
   for a member it says so with a bold row in a listing rather than a
   line in the thread. This browser knows which post was the newest
   here the last time this topic was open; the first one after it gets
   the divider a mail client would draw. */
function markNewSince(all, seen) {
    if (!seen || !seen.lastPost || !seen.at) return;
    const fresh = all.find((post) => (Number(post.id) || 0) > seen.lastPost);
    if (!fresh || fresh === all[0]) return;
    /* The board's language, not the browser's: "New since 4 sept." in
       an English interface is one word in the wrong tongue. */
    const locale = /^ru/i.test(document.documentElement.lang || "") ? "ru-RU" : "en-GB";
    const when = new Date(seen.at);
    const label = Number.isFinite(when.getTime())
        ? t("New since {when}", { when: when.toLocaleDateString(locale, { day: "numeric", month: "short" }) })
        : t("New since your last visit");
    const rule = el("div.rr-since", { role: "separator", "aria-label": label }, [
        el("span.rr-since__label", {}, [label]),
    ]);
    fresh.table.before(rule);
}

/* The page this topic was left on. A forty page thread opens at page
   one however far in you were, and the board's own "first unread"
   needs an account. */
function offerResume(seen) {
    const here = pagination();
    if (!seen || !seen.page || !here.total || here.total < 2) return;
    if (seen.page === here.current || seen.page > here.total) return;
    const href = pageHref(seen.page);
    if (!href) return;
    const row = document.querySelector('.rr-topicbar__row[data-rr-row="here"]');
    if (!row) return;
    const link = el("a.rr-btn.rr-resume", {
        href,
        "data-variant": "quiet",
        title: t("You were reading page {n} of this topic", { n: seen.page }),
    }, [icon("clock", 13), t("Back to page {n}", { n: seen.page })]);
    const spacer = row.querySelector(".rr-topicbar__spacer");
    if (spacer) spacer.before(link);
    else row.append(link);
}

/* ---- Signatures --------------------------------------------------- */

/* The board draws a signature's divider as a run of underscores in the
   message body. collapseSignature drops it on a post, where the
   signature is a node of its own; a private message has no such node
   and kept the underscores. Anywhere one is left, it becomes the rule
   the rest of the script draws. */
function replaceUnderscoreRules(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const found = [];
    let node;
    while ((node = walker.nextNode())) {
        if (/^\s*_{5,}\s*$/.test(node.textContent)) found.push(node);
    }
    for (const text of found) {
        const rule = el("hr.rr-rule");
        text.replaceWith(rule);
        // The <br> the template puts on either side of it would leave
        // the rule floating in a band of its own.
        for (const side of ["previousSibling", "nextSibling"]) {
            const sibling = rule[side];
            if (sibling && sibling.nodeType === 1 && sibling.tagName === "BR") sibling.remove();
        }
    }
}


function collapseSignature(post) {
    if (!post.signature) return;

    // Every signature is set apart the same way — the small muted face,
    // a rule instead of the board's row of underscores. A short one
    // used to keep the underscores and the post's own type, so two
    // posts in a row ended in two different ways.
    post.signature.classList.add("rr-signature");
    for (const node of Array.from(post.signature.childNodes).slice(0, 3)) {
        if (node.nodeType === 3 && /^\s*_{5,}\s*$/.test(node.textContent)) node.remove();
        else if (node.nodeType === 1 && node.tagName === "BR" && !post.signature.textContent.trim()) node.remove();
    }

    // Signatures are one text node broken by <br>, so counting newlines
    // finds nothing; the line breaks and the length are the signal.
    // Only a long one is folded.
    const breaks = post.signature.querySelectorAll("br").length;
    const length = post.signature.textContent.trim().length;
    if (breaks <= 4 && length <= 220) return;

    post.signature.setAttribute("data-rr-sig", "collapsed");
    const toggle = el("button.rr-sig-toggle", { type: "button" }, [t("Show signature")]);
    toggle.addEventListener("click", () => {
        const collapsed = post.signature.getAttribute("data-rr-sig") === "collapsed";
        if (collapsed) post.signature.removeAttribute("data-rr-sig");
        else post.signature.setAttribute("data-rr-sig", "collapsed");
        toggle.textContent = t(collapsed ? "Hide signature" : "Show signature");
    });
    post.signature.before(toggle);
}

/* ---- Spoilers ----------------------------------------------------- */

/** The board wraps spoilers in div.spoiler with an inline-onclick Show
    button, so the toggles are found by clicking their own buttons.
    With no state asked for, every spoiler button; with "show" or
    "hide", the ones currently saying that. */
function spoilerInputs(saying) {
    const all = Array.from(document.querySelectorAll('.spoiler input[type="button"]'))
        .filter((input) => /^(?:show|hide)$/i.test((input.value || "").trim()));
    if (!saying) return all;
    return all.filter((input) => (input.value || "").trim().toLowerCase() === saying);
}

/* Spoilers open at load.

   On this board a spoiler is where the links are: a release post
   hides its mirrors, its password and its notes behind five of them,
   and reading the post means clicking every one. Opened at load the
   post reads top to bottom, and the "Close all" control in the bar
   puts them back. The board's own handler does the opening, so the
   button still says Hide and still works. */
function openSpoilersAtLoad() {
    for (const input of spoilerInputs("show")) input.click();
}

/* The board draws every spoiler's Show button with `font-size: 10px`
   typed into the tag, under the 11px floor everything else on the page
   is held to — and it stayed there through four sweeps, because a sweep
   that asks about small text asks td, p, span and a, and this is an
   input. The board also injects a <style> for these controls, so a
   stylesheet rule loses; an inline style from here is the one thing
   that reliably wins (see csrin-css-cascade). */
function liftSpoilerButtons() {
    for (const input of document.querySelectorAll('.spoiler input[type="button"]')) {
        input.style.fontSize = "var(--rr-fs-xs)";
        input.style.width = "auto";
        input.style.padding = "2px 8px";
    }
}

/* ---- Images -------------------------------------------------------- */

function initLightbox() {
    document.addEventListener("click", (event) => {
        const img = event.target;
        if (!(img instanceof HTMLImageElement)) return;
        if (!img.closest(".postbody") && !img.closest(".rr-game")) return;
        if (img.closest("a")) return;                  // a linked image keeps its link
        if (img.naturalWidth < 200) return;            // icons and smilies

        event.preventDefault();
        event.stopPropagation();

        /* A dialog, not a backdrop with an image on it: a control that
           closes it, the keyboard kept inside while it is open, and the
           focus given back to the image's post when it goes. */
        const previous = document.activeElement;

        /* The other pictures in the same post: a repack's screenshots
           and a proof-it-works set are posted in a row, and opening
           them one at a time meant closing the box between each. */
        const holder = img.closest(".postbody, .rr-game") || document;
        const gallery = Array.from(holder.querySelectorAll("img")).filter((node) => {
            if (node.closest("a")) return false;
            return node === img || node.naturalWidth >= 200;
        });
        let at = Math.max(0, gallery.indexOf(img));

        const shown = el("img", { src: img.currentSrc || img.src, alt: img.alt || "" });
        const closeButton = el("button.rr-icon-btn.rr-lightbox__close", {
            type: "button",
            "aria-label": t("Close the image"),
        }, [icon("close")]);
        const counter = el("span.rr-lightbox__count");
        const back = el("button.rr-icon-btn.rr-lightbox__step", {
            type: "button", "aria-label": t("Previous image"),
        }, [icon("chevronL")]);
        const forward = el("button.rr-icon-btn.rr-lightbox__step.rr-lightbox__step--next", {
            type: "button", "aria-label": t("Next image"),
        }, [icon("chevron")]);
        const show = (index) => {
            at = (index + gallery.length) % gallery.length;
            const next = gallery[at];
            shown.src = next.currentSrc || next.src;
            shown.alt = next.alt || "";
            counter.textContent = (at + 1) + " / " + gallery.length;
        };

        const box = el("div.rr-lightbox", {
            role: "dialog",
            "aria-modal": "true",
            "aria-label": img.alt || t("Image"),
            tabindex: "-1",
        }, [shown, closeButton]);
        if (gallery.length > 1) {
            box.append(back, forward, counter);
            show(at);
        }

        let release = () => {};
        const close = () => { box.remove(); document.removeEventListener("keydown", onKey); release(); };
        const onKey = (e) => {
            if (e.key === "Escape") close();
            else if (gallery.length > 1 && e.key === "ArrowRight") { e.preventDefault(); show(at + 1); }
            else if (gallery.length > 1 && e.key === "ArrowLeft") { e.preventDefault(); show(at - 1); }
        };
        // A click on the picture or a control is not a click on the way
        // out; everything else closes it, as it did before.
        box.addEventListener("click", (e) => { if (e.target === box) close(); });
        shown.addEventListener("click", () => { if (gallery.length > 1) show(at + 1); else close(); });
        back.addEventListener("click", () => show(at - 1));
        forward.addEventListener("click", () => show(at + 1));
        document.addEventListener("keydown", onKey);
        document.body.append(box);
        release = trapFocus(box, previous instanceof HTMLElement ? previous : null);
        closeButton.focus();
    }, true);
}

/* ---- Off-site links ------------------------------------------------ */

function markExternalLinks() {
    const here = location.hostname;
    const confirmFirst = settings.get("confirmExternal");
    for (const link of document.querySelectorAll(".postbody a[href^='http']")) {
        let host;
        try { host = new URL(link.href).hostname; } catch { continue; }
        if (host === here || host.endsWith(".rin.ru")) continue;
        if (link.querySelector(".rr-host")) continue;
        /* The setting that existed and did nothing: with it on, an
           off-site link asks first and shows the whole address, which
           a shortened or a disguised link otherwise never does. */
        if (confirmFirst && !link.rrConfirms) {
            link.rrConfirms = true;
            link.addEventListener("click", (event) => {
                if (event.defaultPrevented) return;
                if (!window.confirm(t("Leave the forum for this address?") + "\n\n" + link.href)) event.preventDefault();
            });
        }
        // "https://store.steampowered.com/app/… store.steampowered.com":
        // a link whose text is the address already says where it goes.
        if (link.textContent.toLowerCase().includes(host.replace(/^www\./, "").toLowerCase())) continue;

        link.append(el("span.rr-host", {
            style: {
                marginLeft: "5px",
                fontSize: "var(--rr-fs-xs)",
                color: "var(--rr-faint)",
                fontFamily: "var(--rr-font-mono)",
            },
        }, [host.replace(/^www\./, "")]));
        link.setAttribute("rel", "noopener noreferrer");
    }
}

/* ---- Landing on a post ---------------------------------------------- */

/* Every link to a post — the Releases panel, "View the latest post",
   a permalink somebody pasted, the board's own first-unread jump —
   ends in #p123456, and the board's anchor for that is an <a name>
   in the author cell beside the post. The modern layout hides that
   cell, and a browser cannot scroll to something that is not drawn:
   the page loaded, nothing moved, and a second click on the same link
   did nothing either. So every post's own table carries the id, which
   is what a fragment looks for first, and it is always on screen.

   That fixes where the anchor is. Where the page is by the time the
   browser looks for it is the other half: the fragment is honoured
   during parsing, before the top bar, the topic bar, the releases
   panel and the game card have been put above the posts, so the post
   the reader asked for ended up a screen below where the browser
   left them. Once everything is in place the page is walked to the
   fragment again, and the post is flashed so it is unmistakable. */
function fragmentTarget(hash) {
    let name;
    try { name = decodeURIComponent((hash || "").replace(/^#/, "")); } catch { return null; }
    if (!/^(?:p\d+|unread|top)$/.test(name)) return null;
    const node = document.getElementById(name) || document.querySelector('a[name="' + name + '"]');
    if (!node) return null;
    return node.closest("table.tablebg") || node;
}

function landOn(target, smooth) {
    target.scrollIntoView({ block: "start", behavior: smooth ? scrollBehaviour() : "auto" });
    if (target.matches("table.tablebg")) flash(target);
}

/** Does this link point at a post on the page in front of us? */
function inPageTarget(link) {
    let url;
    try { url = new URL(link.getAttribute("href") || "", location.href); } catch { return null; }
    if (!url.hash || url.origin !== location.origin) return null;
    const target = fragmentTarget(url.hash);
    if (!target) return null;
    const strip = (u) => u.pathname + u.search.replace(/[?&]sid=[a-f0-9]+/g, "");
    if (strip(url) === strip(new URL(location.href))) return target;
    // viewtopic.php?p=123#p123 names the post rather than the page,
    // and the post is here.
    if (/viewtopic\.php$/.test(url.pathname) && /^#p\d+$/.test(url.hash)
        && url.searchParams.get("p") === url.hash.slice(2)) return target;
    return null;
}

function settleFragment() {
    if (!PAGE.isTopic) return;
    for (const post of posts()) {
        if (!document.getElementById("p" + post.id)) post.table.id = "p" + post.id;
    }

    const target = fragmentTarget(location.hash);
    let settled = null;
    if (target) {
        landOn(target, false);
        settled = window.scrollY;
    }
    // Images arriving above the post move it again. Settled once more
    // when the page has finished, unless the reader has scrolled since.
    if (target && document.readyState !== "complete") {
        window.addEventListener("load", () => {
            if (settled !== null && Math.abs(window.scrollY - settled) < 4) landOn(target, false);
        }, { once: true });
    }
    window.addEventListener("hashchange", () => {
        const next = fragmentTarget(location.hash);
        if (next) landOn(next, true);
    });
    // A link to a post on this page glides to it rather than reloading
    // the page to land on it.
    document.addEventListener("click", (event) => {
        if (event.button !== 0 || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
        if (!link || link.closest(".rr-releases")) return;
        const here = inPageTarget(link);
        if (!here) return;
        event.preventDefault();
        const hash = new URL(link.getAttribute("href"), location.href).hash;
        if (hash !== location.hash) history.replaceState(null, "", hash);
        landOn(here, true);
    });
}

/* ---- Entry point ---------------------------------------------------- */

function initTopic() {
    if (!PAGE.isTopic) return;

    /* Read before it is written over: where this topic was left, and
       which post was the newest here at the time. */
    let seen = null;
    if (settings.get("history") && PAGE.topicId) {
        seen = store.get("history", []).find((item) => item.id === String(PAGE.topicId)) || null;
    }

    const all = posts();

    if (settings.get("history") && PAGE.topicId) {
        markVisited(String(PAGE.topicId));
        const heading = document.querySelector("#pageheader h2 a.titles, #pageheader h2");
        if (heading) {
            const list = store.get("history", []).filter((item) => item.id !== String(PAGE.topicId));
            const here = pagination();
            const newest = all.reduce((top, post) => Math.max(top, Number(post.id) || 0), 0);
            list.unshift({
                id: String(PAGE.topicId),
                title: heading.textContent.trim(),
                href: "./viewtopic.php?t=" + PAGE.topicId,
                at: Date.now(),
                page: here.current || 1,
                // Never lower: coming back to page 1 of a topic already
                // read to the end does not un-read it.
                lastPost: Math.max(Number(seen && seen.lastPost) || 0, newest),
            });
            store.set("history", list.slice(0, HISTORY_LIMIT));
        }
    }

    // Named, so the stylesheet can tell a post's table from a listing's
    // and a strip's: it is the one that must not clip what floats
    // over its edge (the tooltips on its controls).
    for (const post of all) post.table.setAttribute("data-rr-post", "");

    const modern = settings.get("postLayout") === "modern";
    if (modern) {
        document.documentElement.setAttribute("data-rr-posts", "modern");
        // Before the card, so the card lands under the author line
        // rather than above it.
        all.forEach(modernisePost);
    }

    // The Enhanced script builds a Steam header of its own over the
    // first post; with it present and the setting on, this one stands
    // down (see detectEnhanced).
    const coexisting = document.documentElement.hasAttribute("data-rr-coexist");
    if (settings.get("gameCard") && !coexisting && all.length && PAGE.start === 0) {
        const info = parseGameInfo(all[0].body);
        if (info && (info.appId || Object.keys(info.fields).length >= 3)) {
            // Written down whether or not the preview is switched on:
            // it costs one key and it is what makes the preview
            // instant, and free, for a topic that has been opened
            // once. See steam.js.
            if (info.appId && PAGE.topicId) steamRememberApp(PAGE.topicId, info.appId);
            buildGameCard(info, all[0].body);
            // The card already carries the title and the detail rows,
            // so the fold starts at the game heading rather than
            // further down at About The Game.
            const heading = all[0].body.querySelector('span[style*="150%"], span[style*="130%"]');
            const anchor = heading ? (heading.closest("span[style*=color]") || heading) : null;
            foldSteamBlurb(all[0].body, anchor);
        }
    }

    decorateHeading();
    liftSpoilerButtons();
    // Before the bar is built: its "Close all N spoilers" reads the
    // state off the page.
    if (settings.get("spoilersOpen")) openSpoilersAtLoad();
    buildTopicBar();
    spaceForumRules();

    all.forEach((post, index) => {
        if (settings.get("postTools")) addPostTools(post, index);
        if (settings.get("collapseSigs")) collapseSignature(post);
    });

    if (settings.get("lightbox")) initLightbox();
    if (settings.get("history") && settings.get("resumeReading")) {
        markNewSince(all, seen);
        offerResume(seen);
    }
    if (settings.get("linkifyBare")) markExternalLinks();
}

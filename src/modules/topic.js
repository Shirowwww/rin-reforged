/* A game thread opens with a Steam dump, thousands of words before the
   first reply. The card below keeps the details, folds the marketing
   copy, and puts SteamDB/PCGamingWiki one click away. */

const REPLY_LINK = 'a[href*="mode=reply"], a[href*="mode=post"]';

const HISTORY_LIMIT = 100; // palette's Recent list; was a setting, nobody tunes it

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

    // Guests cannot see the store link; say so rather than an empty row.
    const store = info.fields["Store Page"];
    if (store && /please login/i.test(store) && !info.appId) {
        bodyCol.append(el("p.rr-field__desc", {}, ["Log in to see the store link in the post below."]));
    }

    card.append(bodyCol);
    body.before(card);

    // Already shown in the card; hide the duplicate rather than remove it
    // (another script may still be looking for that node).
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

// Rewrite the topic heading the way listing rows are, so the prefix
// reads as the same tag in both places.
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
    // Kept: reading the title back off the heading would pick the tag up again.
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

/* One action bar, replacing the four strips the template scatters. Row
   assignment is fixed, not fit-based, so the bar is the same shape on a
   1-page and a 33-page thread: row 1 is this topic (reply, on-screen
   actions, where you are); row 2 is everywhere else (prev/next, print,
   search). A row nothing landed in is not drawn. */
function topicBarRow(name) {
    return el("div.rr-topicbar__row", { "data-rr-row": name });
}

// `.rr-cluster > * + *` for the hairlines would end in a universal
// selector the engine tests against every element (measured 30ms on a
// big listing); a class costs nothing to match, so children get one.
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
        // Hide the *cell*, not the table: subsilver2 packs the reply
        // button, the pager and the member's topic actions into one row
        // of one table, so hiding the table silently ate Unsubscribe/
        // Bookmark/E-mail too (members-only, which is why it went unnoticed).
        const cell = reply.closest("td");
        if (cell) cell.style.display = "none";
        else {
            const strip = reply.closest("table");
            if (strip) strip.style.display = "none";
        }
    }

    // Drawn as secondary — "Open all N spoilers" is not as loud as Reply.
    if (settings.get("spoilerAll")) {
        const inputs = spoilerInputs();
        if (inputs.length >= 2) {
            // Toggles rather than removing itself on press (that used to
            // take focus with it, leaving 30 open spoilers stuck open).
            // State is read off the page: if spoilers opened at load, it
            // starts as "close".
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

    // The board's own "First unread post" (members only); people.js
    // builds its own version only when this one isn't found, so this
    // must be found. Descendant selector, not child: icons.js wraps the
    // link in a span.rr-linkrow first, so `td.nav > a` matched fixtures
    // but never the live board, leaving an empty strip and a duplicate.
    const unread = document.querySelector('#wrapcentre td.nav a[href*="view=unread"]');
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

    // Not drawn on a 1-page topic: "Page 1 of 1" answers nothing.
    if (info.total && info.total > 1) {
        here.append(settings.get("quickPager")
            ? buildPagerGroup(info)
            : el("span.rr-topicbar__count", {}, [t("Page {a} of {b}", { a: info.current, b: info.total })]));
    }

    // Two clusters (where to go next / what a member can do here), not
    // six loose words, so the row reads as two things.
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
    // Before the strips are tidied, so a strip this empties is one of
    // the empty ones hideEmptyBoardStrips() then takes away.
    dropPagerAbovePosts();
    tidyBoardPagerStrip(bar, here);
}

// Hides the board's "Go to page…" strip above the posts (the bar's own
// pager already says it); the copy under the posts stays for a reader
// who scrolled to the end. Two shapes carry it: a p.gensmall under the
// title, and the board strip's right-hand cell.
function dropPagerAbovePosts() {
    if (!settings.get("quickPager")) return;
    const first = posts()[0];
    const strips = document.querySelectorAll(
        "#wrapcentre p.gensmall, #wrapcentre span.gensmall, #wrapcentre td.gensmall");
    for (const strip of strips) {
        if (!/^\s*(?:Go to page|На страницу)/.test(strip.textContent)) continue;
        if (first && !(strip.compareDocumentPosition(first.table) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
        strip.style.display = "none";
    }
}

// phpBB repeats "Page 16 of 16" and "[ 239 posts ]" above and below the
// posts; the bar's pager already covers the first. Cell by cell, not
// strip by strip, because the member's own topic actions share that row.
// The post count is worth keeping — the first one found moves into the bar.
const PAGE_OF_RE = /^\s*(?:Page\s+\d+\s+of\s+\d+|Страница\s+\d+\s+из\s+\d+)\s*$/;
// Russian interface: "[ Сообщений: 239 ]" / "[ Тем: 61487 ]", word first.
const POST_COUNT_RE = /^\s*\[\s*(?:([\d\s]+)\s+(posts?|topics?)|(Сообщений|Тем):\s*([\d\s]+))\s*\]\s*$/i;

function postCount(text) {
    const m = text.match(POST_COUNT_RE);
    if (!m) return null;
    const digits = (m[1] || m[4]).replace(/\s+/g, "");
    const unit = (m[2] || m[3]).toLowerCase();
    return digits + " " + (unit === "сообщений" ? "сообщений" : unit === "тем" ? "тем" : unit);
}

function tidyBoardPagerStrip(bar, row) {
    // Start "already counted" if the listing bar lifted its own count
    // first — else the strip's second copy doubles it: "841 topics 841 topics".
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

// A cell inside a cell hidden by the emptying above is as gone as its parent.
function hiddenWithin(node, root) {
    for (let n = node; n && n !== root; n = n.parentElement) {
        if (n.style && n.style.display === "none") return true;
    }
    return false;
}

// A row with every cell hidden is still a 20px band with a border.
// textContent sees through display:none (a hidden "|" separator counted
// as life), so only the not-hidden text counts.
function boardStrips() {
    const out = new Set(document.querySelectorAll("#wrapcentre table.tablebg"));
    // The "First unread post" strip is a classless bare table, missed by
    // table.tablebg — a board strip by what it holds, not what it's called.
    for (const cell of document.querySelectorAll("#wrapcentre td.nav")) {
        const table = cell.closest("table");
        if (table && !table.querySelector(".postbody")) out.add(table);
    }
    return out;
}

function hideEmptyBoardStrips(bar) {
    for (const strip of boardStrips()) {
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

// "Previous topic"/"Subscribe topic"/"E-mail friend" repeat their noun;
// mark it optional so narrow layout can drop it to "Previous · Next · Subscribe".
function labelWithOptionalTail(link, label) {
    const m = label.match(/^(.*\S)(\s+(?:topic|friend|тема|другу))$/i);
    link.textContent = "";
    // A word space, not a 6px flex gap — the noun keeps its own space.
    if (m) link.append(document.createTextNode(m[1]), el("span.rr-opt", {}, [m[2]]));
    else link.append(document.createTextNode(label));
}

// Print view, Previous topic, Next topic: pulled out of the template's
// own 40px-tall bar and joined with the other topic actions; that strip
// then goes if left empty.
function adoptTopicNav(bar) {
    const strip = Array.from(document.querySelectorAll("#wrapcentre table.tablebg"))
        .find((table) => table.querySelector('td.cat a[href*="view=print"], td.cat a[href*="view=next"]'));
    if (!strip) return;

    const wanted = [
        { match: /view=previous/, label: "Previous topic" },
        { match: /view=next/, label: "Next topic" },
        { match: /view=print/, label: "Print view", glyph: "external" }, // the one that really leaves the page
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

// Subscribe/Bookmark/E-mail friend: members-only, printed twice by
// subsilver2 (the reply strip and again under the posts — buildTopicBar
// hides that strip's cells precisely so these survive). Joined once here
// with the board's own wording ("Unsubscribe topic" when already watching).
const MEMBER_ACTION = 'a[href*="watch=topic"], a[href*="bookmark="], a[href*="mode=email"]';

function adoptMemberActions(bar) {
    // td.nav on the live board, td.gensmall in the strip's other shape.
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

    // "Next"/"Last" used to look identical to "Next topic"/"Previous
    // topic" — different rows now, plus these say what they move (a page).
    // The four steps + page box are one boxed control; the end arrows draw
    // unlabelled and name themselves on hover so "⇥" is never a guess.
    // `word` is what's drawn, `label` is the full name (title/aria).
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

// The board prints both language halves of a rank on every page — "I
// live here Три раза сломал клаву :)", "Beginner Без звания" (Russian
// for "no rank") — so an English forum shows Russian under most names.
// Page language decides which half to keep; a Latin-only rank is left
// alone (not a translation of anything, and dropping it on the Russian
// interface would blank every administrator's rank). Original text
// stays on the title attribute.
const CYRILLIC_RE = /[\u0400-\u04FF]/;

function localiseRank(text) {
    const clean = text.replace(/\s+/g, " ").trim();
    const lang = currentLanguage();
    if (!CYRILLIC_RE.test(clean) || !lang) return clean;

    // On English the Russian words go, on Russian the Latin ones do. A
    // word with no letters of either kind (":)", "<3") sides with
    // whichever half stays.
    const LATIN_RE = /[A-Za-z]/;
    const kept = lang === "en"
        ? clean.split(" ").filter((word) => !CYRILLIC_RE.test(word))
        : clean.split(" ").filter((word) => !LATIN_RE.test(word) || CYRILLIC_RE.test(word));
    // Trailing punctuation belonging to the half just dropped (e.g. a
    // smiley on the end of the Russian half) goes with it. A rank that
    // is only punctuation never reaches here — no Cyrillic, returned above.
    while (kept.length && !/[A-Za-z0-9\u0400-\u04FF]/.test(kept[kept.length - 1])) kept.pop();
    return kept.join(" ").replace(/[\s|·,;:/–—-]+$/, "").trim();
}

// "Joined: Thursday, 13 Feb 2020, 13:07 · Posts: 2180" doesn't fit its
// line; clipping put the ellipsis inside the time ("13 Feb 2020, 13:…").
// A join date has no use for a clock, so drop it — the line then fits
// without clipping at all.
const JOIN_TIME_RE = /(\d{4}),\s*\d{1,2}:\d{2}(?::\d{2})?/g;

function shortenPostMeta(text) {
    return text
        .replace(/(?:\b(?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day|Понедельник|Вторник|Среда|Четверг|Пятница|Суббота|Воскресенье),\s*/gi, "")
        .replace(JOIN_TIME_RE, "$1")
        // Group only the post count, not the year: a blind 4-digit group
        // would turn "2005" into "2 005".
        .replace(/((?:Posts|Сообщения):\s*)(\d+)/i, (all, label, count) => label + groupDigits(count))
        .replace(/\s+/g, " ")
        .trim();
}

// Rebuilds a post as a header strip over a full-width message, instead
// of the template's 150px author column that makes a two-line reply as
// tall as an avatar. Nodes are moved, not copied, so handlers survive;
// the original cell is hidden, not deleted.
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
        // The template runs "Joined:...Posts: 2180Location: here"
        // together often enough to need separators put back before every label.
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

    // The old header row (author, subject, date) is now empty padding.
    const originalRow = post.anchor.closest("tr");
    if (originalRow && !originalRow.querySelector(".postbody")) originalRow.style.display = "none";

    hideEmptyPostRows(post.table);
}

// subsilver2's edit/delete and "Top" rows are 90px of nothing for a
// reader without those permissions.
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

    // The original post starts open (it's what was actually written —
    // download notes, links, caveats); closing it is remembered. The
    // Steam description alone, with no card summarising it, starts folded.
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

// Fallback names for per-post controls, read off their href: icons.js
// names each from its image's alt text, which fails silently into a bare
// silhouette when the board ships an image without one.
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

// Named instantly, like the top bar's icons, rather than after hovering.
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

    // One control per destination: the board's own "Reply with quote"
    // and this row's icon used to both point at the same URL. Compared
    // with the session id stripped, since phpBB stamps a fresh one into
    // every link.
    const destinations = new Set();
    const wanted = (node) => {
        const href = (node.getAttribute("href") || "").replace(/[?&]sid=[a-f0-9]+/, "");
        if (!href) return true;
        if (destinations.has(href)) return false;
        destinations.add(href);
        return true;
    };

    // The board's own permalink icon labels itself "Post" (its alt
    // text) and goes exactly where the copy-link button beside it
    // copies — so the post number becomes the link instead, and the
    // board's control is hidden.
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

    // Every mirror in this post, one per line — a release post carries
    // 3-6 and queueing them meant opening each in turn.
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

    // Controls the board drew as a bare GIF (relabelled by icons.js),
    // moved from their own footer strip into the other per-post actions.
    for (const control of post.table.querySelectorAll("a.rr-ctl")) {
        if (control === permalink) continue;
        const row = control.closest("tr");
        if (!wanted(control)) { control.style.display = "none"; continue; }
        tools.append(nameControl(control));
        if (row && !row.textContent.trim() && !row.querySelector("a[href], input")) {
            row.style.display = "none";
        }
    }

    // A bare-image control icons.js couldn't name from alt text — an
    // unnamed silhouette sat on the end of every post.
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

// phpBB marks unread only in listings, never inline in a thread. This
// draws the mail-client-style divider from what was newest last visit.
function markNewSince(all, seen) {
    if (!seen || !seen.lastPost || !seen.at) return;
    const fresh = all.find((post) => (Number(post.id) || 0) > seen.lastPost);
    if (!fresh || fresh === all[0]) return;
    // The board's language, not the browser's.
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

// A private message keeps the board's underscore-run signature divider
// (collapseSignature drops it on posts, where the signature is its own
// node); turn any leftover run into the script's own rule.
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

    // Every signature is styled the same (muted, a rule not underscores);
    // a short one used to be left untouched, so two posts in a row differed.
    post.signature.classList.add("rr-signature");
    for (const node of Array.from(post.signature.childNodes).slice(0, 3)) {
        if (node.nodeType === 3 && /^\s*_{5,}\s*$/.test(node.textContent)) node.remove();
        else if (node.nodeType === 1 && node.tagName === "BR" && !post.signature.textContent.trim()) node.remove();
    }

    // One text node broken by <br>, so <br> count + length is the
    // length signal, not newlines. Only a long one is folded.
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

// Spoilers toggle via the board's own inline-onclick Show/Hide button,
// so this clicks that button rather than reimplementing the toggle.
function spoilerInputs(saying) {
    const all = Array.from(document.querySelectorAll('.spoiler input[type="button"]'))
        .filter((input) => /^(?:show|hide)$/i.test((input.value || "").trim()));
    if (!saying) return all;
    return all.filter((input) => (input.value || "").trim().toLowerCase() === saying);
}

// A release post hides mirrors, password and notes behind several
// spoilers; open them all at load via the board's own handler (so
// buttons still say Hide and still work) — the bar's "Close all" undoes it.
function openSpoilersAtLoad() {
    for (const input of spoilerInputs("show")) input.click();
}

// The board's spoiler buttons carry an inline `font-size: 10px`, missed
// by sweeps that check td/p/span/a but not input, and the board's own
// injected <style> beats a stylesheet rule — only an inline style here wins.
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

        const previous = document.activeElement;

        // Other pictures in the same post join the gallery — a repack's
        // screenshots used to mean closing the box between each.
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
        // With this setting on, an off-site link asks first and shows
        // the whole address, which a disguised link otherwise never does.
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

        link.append(el("span.rr-host", {}, [host.replace(/^www\./, "")]));
        link.setAttribute("rel", "noopener noreferrer");
    }
}

/* ---- Landing on a post ---------------------------------------------- */

// #p123456 anchors to an <a name> in the author cell, which the modern
// layout hides — a browser can't scroll to an undrawn node, so the post's
// own table also carries the id. That fixes *where* the anchor is; the
// fragment is also honoured during parsing, before the bars/card are
// inserted above the posts, so scrolling is redone once they've landed.
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

    // Marks the table that must not clip its controls' tooltips.
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
            // Remembered regardless of whether the preview is on — see steam.js.
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

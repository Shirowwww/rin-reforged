// Forum and topic listings: column labels for mobile, prefix tags, and a client-side filter.

const COLUMN_NAMES = {
    forum: "title",
    topics: "topics",
    posts: "posts",
    "last post": "last",
    replies: "replies",
    author: "author",
    views: "views",
    // Member list, PM folders, control panel — same date/rank shapes as a listing.
    "#": "num",
    username: "author",
    joined: "date",
    sent: "date",
    "last updated": "date",
    rank: "rank",
    subject: "title",
    mark: "mark",
    message: "action",
    "e-mail": "action",
    website: "action",
    // Russian UI headers — half the board reads them; unmapped, nothing below got treated.
    "форум": "title",
    "темы": "topics",
    "сообщения": "posts",
    "последнее сообщение": "last",
    "ответы": "replies",
    "автор": "author",
    "просмотры": "views",
    "имя пользователя": "author",
    "зарегистрирован": "date",
    "отправлено": "date",
    "звание": "rank",
    "тема": "title",
    "отметить": "mark",
    "сообщение": "action",
    "сайт": "action",
};

// Tags cells with data-rr-col from the <th> row, so it survives a template that adds or drops a column.
function labelColumns(table) {
    const headRow = table.querySelector("tr:has(th)") || table.querySelector("th")?.parentElement;
    if (!headRow) return;
    // Not always the first row — a forum listing has a "Mark forums read" strip above it.
    headRow.setAttribute("data-rr-head", "");

    // Only a listing reads a spanning header as the title column — on a profile that
    // misread "Joined:" as an icon column and its date as a title.
    const listing = Boolean(table.querySelector("a.topictitle, a.forumlink, .topictitle a"));

    const columns = [];
    const heads = Array.from(headRow.querySelectorAll("th"));
    heads.forEach((th, index) => {
        const span = parseInt(th.getAttribute("colspan") || "1", 10);
        const text = th.textContent.trim().toLowerCase();

        // Empty header = read/unread marker column; search results give it its own header.
        if (!text) {
            columns.push("icon");
            for (let i = 1; i < span; i += 1) columns.push(null);
            return;
        }

        // Spanning header = title column, read by span not by word: "Topics" is also
        // a counting column, so word-matching on search results mislabeled titles as counts.
        if (span > 1) {
            if (!listing) {
                for (let i = 0; i < span; i += 1) columns.push(null);
                return;
            }
            for (let i = 1; i < span; i += 1) columns.push(index === 0 && i === 1 ? "icon" : null);
            columns.push("title");
            return;
        }

        // Member list's date column is a joining date — flagged for the phone card.
        if (text === "joined" || text === "зарегистрирован") table.setAttribute("data-rr-joined", "");
        columns.push(COLUMN_NAMES[text] || null);
    });
    if (!columns.length) return;

    for (const row of table.querySelectorAll("tr")) {
        const cells = row.children;
        if (cells.length !== columns.length) continue;   // category and spacer rows
        for (let i = 0; i < cells.length; i += 1) {
            if (columns[i]) cells[i].setAttribute("data-rr-col", columns[i]);
        }
    }

    // Headings get the same names as their cells, or heading and column alignment
    // disagree (Author sat left in the heading, centred in every row).
    let at = 0;
    for (const th of heads) {
        const span = parseInt(th.getAttribute("colspan") || "1", 10);
        // A heading spanning icon+title labels the title — the half with words in it.
        const name = columns[span > 1 ? at + span - 1 : at];
        if (name) th.setAttribute("data-rr-col", name);
        at += span;
    }
}

const COUNT_COLUMNS = ["topics", "posts", "replies", "views"];

function groupListingNumbers(table) {
    const selector = COUNT_COLUMNS.map((name) => 'td[data-rr-col="' + name + '"]').join(", ");
    for (const cell of table.querySelectorAll(selector)) groupNumbersIn(cell);
}

// Only cells this script built, or elements whose whole text is one number — never a
// page sweep, since AppIDs/post numbers/build ids are also just digits.
function groupBoardNumbers() {
    // Post header line excluded — it mixes a join year with the count and groups itself.
    for (const node of document.querySelectorAll(".rr-topicbar__count, .rr-online__summary")) {
        groupNumbersIn(node);
    }
    // "Total posts N | Total topics N" — each figure is already wrapped in its own
    // <strong>. Profile counters would fit too but are skipped: they're all behind
    // login, so no page here can reach one to test it.
    groupCountElements("#wrapcentre p.gensmall strong");
}

/* ---- Prefixes ---------------------------------------------------- */

function decorateTitle(entry, onTagClick) {
    const { prefix, kind, rest } = splitPrefix(entry.title);
    if (!prefix) return null;

    // Template renders the prefix as coloured spans in the link; rebuilt as a tag
    // beside it. With no filter behind it (a short listing) it's a label, not a
    // control that answers a click with nothing.
    const tag = onTagClick
        ? el("button.rr-tag", { type: "button", "data-tag": kind, title: t("Show only {x}", { x: prefix }) }, [prefix])
        : el("span.rr-tag", { "data-tag": kind }, [prefix]);
    if (onTagClick) {
        tag.addEventListener("click", (event) => {
            event.preventDefault();
            onTagClick(prefix.toLowerCase());
        });
    }

    // Only the prefix moves; the rest of the title stays put (see stripLeading()).
    const raw = entry.link.textContent;
    const at = raw.indexOf(rest);
    if (rest && at > 0) stripLeading(entry.link, at);
    else entry.link.textContent = rest;
    entry.link.before(tag);
    entry.row.setAttribute("data-rr-prefix", prefix.toLowerCase());
    return prefix.toLowerCase();
}

/* ---- Visited / bookmarked --------------------------------------- */

function visitedSet() {
    return new Set(store.get("visited", []));
}

function markVisited(topicId) {
    if (!topicId) return;
    const list = store.get("visited", []);
    const index = list.indexOf(topicId);
    if (index !== -1) list.splice(index, 1);
    list.unshift(topicId);
    store.set("visited", list.slice(0, 800));
}

function bookmarkList() { return store.get("bookmarks", []); }

function isBookmarked(topicId) {
    return bookmarkList().some((item) => item.id === topicId);
}

function toggleBookmark(topicId, title, href) {
    const list = bookmarkList();
    const index = list.findIndex((item) => item.id === topicId);
    if (index === -1) {
        list.unshift({ id: topicId, title, href, at: Date.now() });
        store.set("bookmarks", list.slice(0, 400));
        return true;
    }
    list.splice(index, 1);
    store.set("bookmarks", list);
    return false;
}

function addBookmarkStar(entry) {
    const star = el("button.rr-icon-btn.rr-star", {
        type: "button",
        title: t("Bookmark this topic"),
        "aria-label": "Bookmark " + entry.title,
        "aria-pressed": isBookmarked(entry.id) ? "true" : "false",
    }, [icon("star", 13)]);

    star.addEventListener("click", (event) => {
        event.preventDefault();
        const now = toggleBookmark(entry.id, entry.title, entry.link.getAttribute("href"));
        star.setAttribute("aria-pressed", now ? "true" : "false");
        toast(now ? "Bookmarked" : "Bookmark removed");
    });

    // In the marker gutter rather than after the title, which on a long topic name
    // pushed the star to a line of its own; the gutter never wraps.
    const gutter = entry.row.querySelector('td[data-rr-col="icon"]');
    if (gutter) gutter.append(star);
    else entry.link.after(star);

    // Named on the row, not just the cell: the phone card (responsive.css)
    // pulls the star out to the card's own corner and needs to know which
    // title cells must keep their text clear of it.
    entry.row.setAttribute("data-rr-star", "");
}

/* ---- First unread --------------------------------------------- */

/** Unread = status image in the _unread set, or alt "Unread posts" — either survives the icon pass. */
function rowIsUnread(row) {
    if (row.querySelector('.rr-dot[data-state="unread"]')) return true;
    for (const img of row.querySelectorAll("img")) {
        if (/_unread/.test(img.getAttribute("src") || "")) return true;
        if (/^unread posts/i.test(img.getAttribute("alt") || "")) return true;
    }
    return false;
}

/**
 * Points the title (not just the little arrow) at view=unread — phpBB's own route,
 * moved onto the control people actually click. Logged-in only: for a guest,
 * view=unread redirects to the last post instead.
 */
function retargetToUnread(entry) {
    if (!entry.id || !rowIsUnread(entry.row)) return false;

    const href = entry.link.getAttribute("href") || "";
    if (/view=unread/.test(href)) return true;

    let url;
    try { url = new URL(href, location.href); } catch { return false; }
    if (!/viewtopic\.php$/.test(url.pathname)) return false;

    url.searchParams.delete("start");
    url.searchParams.set("view", "unread");
    entry.link.setAttribute("href", url.pathname + url.search + "#unread");
    entry.link.setAttribute("title", "Opens at the first post you have not read");
    entry.row.setAttribute("data-rr-unread", "1");
    return true;
}

/* ---- Filter bar --------------------------------------------------- */

// Below this row count the filter is furniture (searches a list you can already see
// all of). The board's own refine box — a round trip — still gets a place regardless.
const FILTER_MIN_ROWS = 5;

/**
 * The board prints #search-box twice (top and bottom breadcrumb strips) plus a third
 * copy of its own on a search results page. Duplicates are hidden, not removed:
 * another script (CS.RIN.RU Enhanced) looks for the first #search-box, so that copy
 * is the one kept.
 */
function dedupeSearchBoxes() {
    const boxes = Array.from(document.querySelectorAll('[id="search-box"]'));
    for (const box of boxes.slice(1)) {
        box.setAttribute("data-rr-dupe", "");
        box.style.display = "none";
    }

    // Results header's own copy is a bare cell rather than a named block; dropped
    // only if a #search-box remains to take its place.
    if (!boxes.length) return;
    for (const field of document.querySelectorAll('input[name="add_keywords"]')) {
        if (field.closest('[id="search-box"]')) continue;
        const cell = field.closest("td");
        if (!cell) continue;
        cell.setAttribute("data-rr-dupe", "");
        cell.style.display = "none";
    }
}

/** Opens/closes the prefix menu with the same manners as the search box's options popover. */
function wireTagMenu(frame, trigger, field) {
    const pop = frame.querySelector(".rr-toolbar__tagpop");

    const close = () => {
        pop.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
        document.removeEventListener("mousedown", onOutside, true);
        document.removeEventListener("keydown", onKey, true);
    };
    const onOutside = (event) => { if (!frame.contains(event.target)) close(); };
    const onKey = (event) => { if (event.key === "Escape") { close(); trigger.focus(); } };
    const open = () => {
        if (!pop.hidden) return;
        pop.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
        document.addEventListener("mousedown", onOutside, true);
        document.addEventListener("keydown", onKey, true);
    };

    trigger.addEventListener("click", () => { if (pop.hidden) open(); else close(); });
    pop.addEventListener("click", (event) => { if (event.target.closest("button")) close(); });
    if (field) {
        field.addEventListener("keydown", (event) => {
            if (event.key !== "ArrowDown" || event.altKey || event.ctrlKey || event.metaKey) return;
            event.preventDefault();
            open();
            const first = pop.querySelector('button[aria-pressed="true"]') || pop.querySelector("button");
            if (first) first.focus();
        });
    }
}

/** `rich` builds the whole bar (filter box, prefix chips, count); otherwise it only
 *  hosts the board's own refine box — see FILTER_MIN_ROWS. */
function buildToolbar(entries, prefixes, rich) {
    const state = { text: "", tag: null, unread: false };

    const count = el("span.rr-toolbar__count");

    const apply = () => {
        let shown = 0;
        for (const entry of entries) {
            const matchesText = matchesWords(entry.title, state.text);
            const matchesTag = !state.tag || entry.row.getAttribute("data-rr-prefix") === state.tag;
            const matchesUnread = !state.unread || entry.unread;
            const visible = matchesText && matchesTag && matchesUnread;
            entry.row.toggleAttribute("data-rr-hidden", !visible);
            if (visible) shown += 1;
        }
        count.textContent = shown === entries.length
            ? t("{n} on this page", { n: entries.length })
            : t("{a} of {b} on this page", { a: shown, b: entries.length });
    };

    // Needs the rr- class: unclassed inputs inherit a 22em floor meant for a
    // size="25" field from 2003, refused to shrink, and pushed the prefix trigger off a phone.
    const input = el("input.rr-toolbar__input", {
        type: "search",
        placeholder: t("Filter this page by title"),
        "aria-label": t("Filter topics on this page"),
    });
    input.addEventListener("input", debounce(() => { state.text = input.value.trim(); apply(); }, 90));
    input.addEventListener("keydown", (event) => {
        if (event.key === "Escape") { input.value = ""; state.text = ""; apply(); }
    });

    // Nine chips side by side out-coloured the listing itself; collapsed behind one
    // trigger that shows the active prefix's name.
    const tagRow = el("div.rr-toolbar__tags");
    const tagName = el("span.rr-toolbar__tagname", { "aria-hidden": "true" });
    const tagBtn = el("button.rr-toolbar__tagbtn", { type: "button", "aria-expanded": "false" },
        [tagName, icon("chevronD", 12)]);

    const syncTags = () => {
        let on = null;
        for (const button of tagRow.children) {
            const pressed = button.dataset.value === state.tag;
            button.setAttribute("aria-pressed", pressed ? "true" : "false");
            if (pressed) on = button;
        }
        tagName.textContent = on ? on.textContent : t("Tag");
        tagBtn.toggleAttribute("data-rr-active", Boolean(on));
        // The trigger wears the colour of the prefix it is holding, so
        // the one chip that is on is still legible as itself.
        if (on && on.dataset.tag) tagBtn.setAttribute("data-tag", on.dataset.tag);
        else tagBtn.removeAttribute("data-tag");
        labelled(tagBtn, on
            ? t("Showing only {x} — pick another or clear", { x: on.textContent })
            : t("Show only one kind of topic"));
    };

    const setTag = (tag) => {
        state.tag = state.tag === tag ? null : tag;
        syncTags();
        apply();
    };
    // "Unread" gets a permanent chip (unlike prefixes): it's the question most
    // readers arrive with, and binary rather than one-of-nine.
    const quick = el("div.rr-toolbar__quick");
    const unreadCount = entries.filter((entry) => entry.unread).length;
    if (unreadCount && unreadCount < entries.length) {
        const unreadChip = el("button.rr-tag.rr-tag--unread", {
            type: "button",
            "aria-pressed": "false",
            title: t("Show only the topics with unread posts"),
        }, [t("Unread")]);
        unreadChip.addEventListener("click", () => {
            state.unread = !state.unread;
            unreadChip.setAttribute("aria-pressed", state.unread ? "true" : "false");
            apply();
        });
        quick.append(unreadChip);
    }

    for (const [name, kind] of prefixes) {
        const button = el("button.rr-tag", {
            type: "button",
            "data-tag": kind,
            "aria-pressed": "false",
            title: t("Show only {x}", { x: name }),
        }, [name]);
        button.dataset.value = name.toLowerCase();
        button.addEventListener("click", () => setTag(name.toLowerCase()));
        tagRow.append(button);
    }

    const bar = el("div.rr-toolbar", { role: "search" });
    if (rich) {
        const frame = el("div.rr-toolbar__filter", {}, [icon("filter"), input]);
        // Only worth a trigger once there's more than one chip to choose between.
        if (tagRow.children.length > 1) {
            frame.append(tagBtn, el("div.rr-toolbar__tagpop", {
                role: "group", "aria-label": t("Show only one kind of topic"), hidden: true,
            }, [tagRow]));
            wireTagMenu(frame, tagBtn, input);
            syncTags();
        }
        bar.append(frame);
        if (quick.children.length) bar.append(quick);
        bar.append(count);
    }

    // Board's own search box moves here to save a band of its own. Hidden when the
    // palette can search this forum instead — except with the palette off, or on a
    // results page, where it narrows results the palette can't reach.
    const boardSearch = document.querySelector("#search-box form, #topic-search");
    if (boardSearch) {
        const strip = boardSearch.closest("td.row5") || boardSearch.closest("table");
        const spare = settings.get("palette") && !PAGE.isSearch;
        // Parked on <body> rather than removed — CS.RIN.RU Enhanced looks for this
        // form, and an empty bar is never placed so isn't safe to park it in.
        if (spare) {
            boardSearch.setAttribute("data-rr-dupe", "");
            boardSearch.style.display = "none";
            document.body.append(boardSearch);
        } else {
            bar.append(el("div.rr-toolbar__board", {}, [adoptBoardSearch(boardSearch)]));
        }
        if (strip && !strip.textContent.trim()) {
            const holder = strip.closest("table");
            if (holder) holder.style.display = "none";
        }
    }

    apply();
    return { bar, setTag, tag: () => state.tag, empty: !bar.children.length };
}

/* ---- Forum action bar --------------------------------------------- */

/** Merges four separate header strips — a "Post new topic" button, "Page 1 of 615",
 *  "[ 61469 topics ]" and the numbered links — into one bar, matching the topic view. */
function buildForumBar() {
    const heading = document.querySelector("#wrapcentre > h2, #pageheader h2");
    if (!heading || document.querySelector(".rr-topicbar")) return null;

    const bar = el("div.rr-topicbar");
    const info = pagination();

    const post = document.querySelector('a[href*="mode=post"]');
    if (post) {
        bar.append(el("a.rr-btn", { href: post.getAttribute("href"), "data-variant": "primary" }, [t("New topic")]));
        const strip = post.closest("table");
        if (strip) strip.style.display = "none";
    }

    if (info.total && info.total > 1) {
        bar.append(buildPagerGroup(info));
    }

    heading.after(bar);
    // Lifts "Page X of Y" / "[ N topics ]" into the bar, same pass as the topic page.
    tidyBoardPagerStrip(bar, bar);

    // Subscribe/Mark-read links; members only, so a no-op on a logged-out page.
    adoptForumActions(bar);

    // Duplicate "Go to page" strip above the table — hidden here as the topic page
    // hides its own copy, keeping only the one below.
    if (settings.get("quickPager")) {
        const strip = Array.from(document.querySelectorAll("#wrapcentre td.gensmall"))
            .find((cell) => /^\s*(?:Go to page|На страницу)/.test(cell.textContent) && cell.querySelector('a[onclick*="jumpto"]'));
        if (strip) hideWithEmptyRow(strip);
    }

    // Forum name moved into the bar (was its own line above it, duplicating the
    // breadcrumb) — moved rather than rebuilt so its heading level and link survive.
    heading.classList.add("rr-topicbar__title");
    bar.prepend(heading);

    return bar;
}

/**
 * Subscribe-forum / Mark-topics-read: subsilver2 prints these members-only links
 * twice (above and below the listing) in a band of their own. Folded into the bar
 * here, the same move the topic page makes for its own actions.
 */
const FORUM_ACTION = 'a[href*="watch=forum"], a[href*="mark=topics"]';

// tr.nav (two cells, no class of their own) inside the listing's td.cat, top and
// bottom; td.nav / td.gensmall are the shapes the strip takes elsewhere on the board.
const FORUM_ACTION_CELLS = "#wrapcentre tr.nav > td, #wrapcentre td.nav, #wrapcentre td.gensmall";

function adoptForumActions(bar) {
    const cells = Array.from(document.querySelectorAll(FORUM_ACTION_CELLS))
        .filter((cell) => cell.querySelector(FORUM_ACTION) && !cell.closest(".rr-topicbar"));
    if (!cells.length) return;

    // Both copies are walked, because the board does not always print
    // the same pair top and bottom; the first of each kind wins.
    const seen = new Set();
    const actions = [];
    for (const cell of cells) {
        for (const link of cell.querySelectorAll(FORUM_ACTION)) {
            const kind = /mark=topics/.test(link.getAttribute("href") || "") ? "mark" : "watch";
            if (seen.has(kind)) continue;
            const label = link.textContent.replace(/\s+/g, " ").trim() || link.getAttribute("title") || "";
            if (!label) continue;
            seen.add(kind);
            link.classList.add("rr-btn", "rr-forumnav");
            link.setAttribute("data-variant", "quiet");
            link.setAttribute("title", label);
            actions.push(link);
        }
    }
    if (!actions.length) return;

    bar.append(el("span.rr-topicbar__spacer"));
    for (const link of actions) bar.append(link);

    // Emptying the cells isn't enough — markShapes gives the wrapping td.cat's row a
    // surface of its own, so the row must be hidden too or the empty band remains.
    for (const cell of cells) {
        hideWithEmptyRow(cell);
        const cat = cell.closest("td.cat");
        if (!cat || cat.querySelector("a[href], input, select, h4")) continue;
        const row = cat.parentElement;
        if (row && row.tagName === "TR") row.style.display = "none";
    }
}

/* ---- Last post ----------------------------------------------------- */

// Weekday ("Tuesday, ") dropped from the line (kept on the title) so the date and
// poster fit beside each other.
const WEEKDAY_RE = /^(\s*)(?:(?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day|Понедельник|Вторник|Среда|Четверг|Пятница|Суббота|Воскресенье),\s*/i;

/** Drops the weekday from text nodes under `node`; returns whether it changed anything,
 *  so the caller can keep the full date on the title. */
function dropWeekday(node, depth = 0) {
    let changed = false;
    for (const child of node.childNodes) {
        if (child.nodeType === 3 && WEEKDAY_RE.test(child.textContent)) {
            // "$1" keeps the space after the weekday: "Posted: 24 Jul", not "Posted:24 Jul".
            child.textContent = child.textContent.replace(WEEKDAY_RE, "$1");
            changed = true;
        } else if (child.nodeType === 1 && depth < 3 && /^(B|STRONG|SPAN|EM|DIV|P)$/.test(child.tagName)) {
            // A profile's "Joined:" value is one tag down: <b>Thursday, …</b>;
            // a search result's "Posted:" is in a floated <div> of its own.
            if (dropWeekday(child, depth + 1)) changed = true;
        }
    }
    return changed;
}

function hideWithEmptyRow(cell) {
    cell.style.display = "none";
    const row = cell.parentElement;
    if (!row || row.tagName !== "TR") return;
    const alive = Array.from(row.children).some((c) => c.style.display !== "none"
        && (c.textContent.trim() || c.querySelector("img, a, input, form, select")));
    if (alive) return;
    row.style.display = "none";
    const table = row.closest("table");
    if (table && !Array.from(table.querySelectorAll("tr")).some((r) => r.style.display !== "none")) {
        table.style.display = "none";
    }
}

// Lone date cells (Joined/Sent/announcement dates) get the same weekday-drop as
// Last post — on the message list a 144px cell wrapped the full date to two lines.
function tightenDateCells() {
    // td.gen/genmed: profile/control-panel date cells start with the weekday itself
    // (the label is in the previous cell); a post's date cell never does — the regex
    // anchor tells them apart.
    // td.gensmall: a search-result date, but not on a topic page, where that same
    // cell is the post's own date and the topic module reads it for its header.
    const cells = document.querySelectorAll(
        '#wrapcentre td[data-rr-col="date"], #wrapcentre p.topicdetails, #wrapcentre td.gen, #wrapcentre td.genmed, #wrapcentre b.gen, #wrapcentre b.genmed'
        + (PAGE.isTopic ? "" : ", #wrapcentre td.gensmall"),
    );
    for (const cell of cells) {
        if (cell.hasAttribute("data-rr-date")) continue;
        // Read before stripping, so the title can carry the whole date. The weekday
        // may follow a label ("Posted: Friday, …"), so each text node is checked, not the cell.
        const full = cell.textContent.replace(/\s+/g, " ").trim();
        if (!dropWeekday(cell)) continue;
        cell.setAttribute("data-rr-date", "");
        if (!cell.hasAttribute("title")) cell.setAttribute("title", full);
    }
}

// "Page 1 of 1" says nothing on a single-page folder or subscriptions list — dropped,
// unlike other pages where it's the only "Go to page" strip they have.
const LONE_PAGE_RE = /^\s*(?:Page\s+1\s+of\s+1|Страница\s+1\s+из\s+1)\s*$/;
const LEADING_LONE_PAGE_RE = /^\s*(?:Page\s+1\s+of\s+1|Страница\s+1\s+из\s+1)\s+/;

function dropLonePageCounters() {
    // td.gensmall and span.nav: the search results page prints its
    // counter in a span inside a floated div.
    for (const cell of document.querySelectorAll("#wrapcentre td.nav, #wrapcentre td.gensmall, #wrapcentre span.nav")) {
        if (cell.querySelector("a[href], form")) continue;
        const text = cell.textContent.replace(/\s+/g, " ");
        if (LONE_PAGE_RE.test(text)) { cell.style.display = "none"; continue; }

        // Counter may share a cell with "[ Search found N match ]" — only the run of
        // nodes up to the second number is removed.
        if (!LEADING_LONE_PAGE_RE.test(text)) continue;
        let seen = "";
        for (const node of Array.from(cell.childNodes)) {
            seen += node.textContent;
            node.remove();
            if (LONE_PAGE_RE.test(seen.replace(/\s+/g, " "))) break;
        }
        const first = cell.firstChild;
        if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, "");
    }
}

// PM folder marks messages with a 10px spacer gif (invisible here, the board's
// colours never load) that still shifted subjects 8px right on rows that had one.
// Redrawn as a coloured square; rows without one get an empty placeholder the same size.
const PM_MARK = 'span[class^="pm_"][class$="_colour"]';

function alignMessageMarkers() {
    const cells = Array.from(document.querySelectorAll('#wrapcentre td[data-rr-col="title"]'));
    if (!cells.some((cell) => cell.querySelector(PM_MARK))) return;
    for (const cell of cells) {
        const row = cell.parentElement;
        if (row) row.setAttribute("data-rr-pm-row", "");
        const mark = cell.querySelector(PM_MARK);
        if (mark) {
            mark.classList.add("rr-pm-mark");
            const kind = (mark.className.match(/pm_(\w+)_colour/) || [])[1];
            if (kind) mark.setAttribute("title", kind[0].toUpperCase() + kind.slice(1) + " message");
            continue;
        }
        // Board writes "&nbsp; " after its marker — matched here so unmarked rows align.
        cell.prepend(el("span.rr-pm-mark", { "aria-hidden": "true" }), "\u00a0 ");
    }
}

// Member list's Rank column is the same bilingual rank as a post's profile, but on a
// page the post module never reaches — Russian half moved to the title here.
function localiseRankCells() {
    // td.postdetails[align=center]: the rank under the name on a profile.
    const cells = document.querySelectorAll('td[data-rr-col="rank"], #wrapcentre td.postdetails[align="center"]');
    for (const cell of cells) {
        const full = cell.textContent.replace(/\s+/g, " ").trim();
        const short = localiseRank(full);
        // A rank with no Latin half is left as it is rather than emptied.
        if (!short || short === full) continue;
        for (const child of Array.from(cell.childNodes)) {
            if (child.nodeType === 3) child.remove();
        }
        cell.prepend(short);
        cell.setAttribute("title", full);
    }
}

/**
 * Folds the Last-post cell's two <p> lines (date, poster) into one — that stack was
 * the tallest thing in a listing row, setting the height of all 108 on a page. Nodes
 * are moved, not rewritten, so the poster's link, colour and jump-arrow survive intact.
 */
function tightenLastPost(cell) {
    const lines = Array.from(cell.children).filter((node) => node.tagName === "P");
    if (lines.length < 2) return;

    const first = lines[0];
    const full = cell.textContent.replace(/\s+/g, " ").trim();

    dropWeekday(first);

    for (const rest of lines.slice(1)) {
        if (!rest.textContent.trim() && !rest.querySelector("a, img")) { rest.remove(); continue; }
        first.append(el("span.rr-sep", { "aria-hidden": "true" }, ["·"]));
        while (rest.firstChild) first.append(rest.firstChild);
        rest.remove();
    }

    first.classList.add("rr-lastpost");
    first.setAttribute("title", full);
}

/* ---- Sections of a listing ---------------------------------------- */

// Section rows ("Announcements", "Topics") fold their run on click, remembered by
// name across listings. Rows stay in the DOM (filter/sort/find-in-page still see
// them), just hidden. The last section is never foldable — a listing that can fold
// away entirely reads as empty by accident.
const FOLDED_SECTIONS_KEY = "foldedSections";

function foldedSections() {
    const kept = store.get(FOLDED_SECTIONS_KEY, null);
    return kept && typeof kept === "object" ? kept : {};
}

// A section row is either td.cat+h4 (search results, the index), or a spanning
// td.row3 holding just a bold word (a forum listing's "Announcements", "Stickies").
// The second shape is tagged here so the stylesheet can draw it as a section head.
function sectionOf(row) {
    let cell = row.querySelector(":scope > td.cat");
    if (cell) {
        // Not the index's categories: the board folds those itself.
        if (row.getAttribute("data-rr-cat-row") !== "" || row.querySelector("td.catdiv, .ccopen, .ccclose")) return null;
        const heading = cell.querySelector("h4");
        return heading ? { cell, heading } : null;
    }
    if (row.children.length !== 1) return null;
    cell = row.firstElementChild;
    if (cell.tagName !== "TD" || !cell.classList.contains("row3") || !cell.hasAttribute("colspan")) return null;
    const heading = cell.querySelector(":scope > b, :scope > span > b, :scope > strong");
    if (!heading || cell.querySelector("a, input, select, img") || cell.textContent.trim().length > 60) return null;
    row.setAttribute("data-rr-cat-row", "section");
    cell.setAttribute("data-rr-section", "");
    return { cell, heading };
}

function initSectionFolds(table) {
    const rows = Array.from(table.querySelectorAll(":scope > tbody > tr"));
    // Section rows are all identified first — a run's end depends on knowing the next one.
    const heads = rows.map(sectionOf);
    const sections = [];
    rows.forEach((row, index) => {
        const found = heads[index];
        if (!found) return;
        const { cell, heading } = found;
        const run = [];
        for (let j = index + 1; j < rows.length; j += 1) {
            const next = rows[j];
            if (heads[j] || next.hasAttribute("data-rr-cat-row") || next.querySelector(":scope > th")) break;
            run.push(next);
        }
        const topics = run.filter((r) => r.querySelector("a.topictitle")).length;
        if (topics) sections.push({ row, cell, heading, run, topics });
    });
    if (sections.length < 2) return;

    const remembered = foldedSections();
    for (const section of sections.slice(0, -1)) {
        const name = section.heading.textContent.replace(/\s+/g, " ").trim();
        const key = name.toLowerCase();
        let folded = Boolean(remembered[key]);

        const countLabel = el("span.rr-section__count", {}, [t("{n} topics", { n: section.topics })]);
        section.cell.classList.add("rr-section");
        section.cell.prepend(icon("chevronD", 13));
        section.cell.append(countLabel);
        section.cell.setAttribute("role", "button");
        section.cell.setAttribute("tabindex", "0");

        const sync = () => {
            section.row.toggleAttribute("data-rr-folded", folded);
            for (const r of section.run) r.toggleAttribute("data-rr-section-folded", folded);
            section.cell.setAttribute("aria-expanded", folded ? "false" : "true");
            section.cell.setAttribute("title", t(folded ? "Show this section" : "Fold this section"));
        };
        const flip = () => {
            folded = !folded;
            const next = foldedSections();
            if (folded) next[key] = true;
            else delete next[key];
            store.set(FOLDED_SECTIONS_KEY, next);
            sync();
        };
        section.cell.addEventListener("click", (event) => {
            if (event.target instanceof Element && event.target.closest("a, input, select, button")) return;
            flip();
        });
        section.cell.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            flip();
        });
        sync();
    }
}

/* ---- The control panel's menu ------------------------------------- */

// Control panel's nav sections give no visual sign of which unfold — found only by
// clicking. Closed items get a chevron pointing at what they open, the open one a
// chevron pointing down at its pages, which step in under it.
function decorateNavLists() {
    for (const table of document.querySelectorAll("#wrapcentre table.tablebg[data-rr-navlist]")) {
        for (const cell of table.querySelectorAll(":scope > tbody > tr > td")) {
            const current = cell.querySelector(":scope > b.nav");
            const link = cell.querySelector(":scope > a.nav");
            if (current) {
                cell.setAttribute("data-rr-navitem", "open");
                current.prepend(icon("chevronD", 13));
                for (const marker of cell.querySelectorAll("ul.nav li > b")) {
                    if (/^[\s »]*$/.test(marker.textContent)) marker.remove();
                }
            } else if (link) {
                cell.setAttribute("data-rr-navitem", "closed");
                link.append(icon("chevron", 13));
            }
        }
    }
}

// Sub-forums table shares the index's "Forum" heading; relabeled "Subforums" so it
// doesn't read as a second, shorter index above the topics.
function labelSubforums() {
    if (!PAGE.isForum) return;
    for (const table of document.querySelectorAll("#wrapcentre table[data-rr-list]")) {
        if (!table.querySelector("a.forumlink") || table.querySelector("a.topictitle")) continue;
        const head = table.querySelector(':scope > tbody > tr[data-rr-head] > th[data-rr-col="title"]');
        if (!head) continue;
        // The words may already be inside the sort button (initColumnSort).
        const holder = head.querySelector("button") || head;
        const words = Array.from(holder.childNodes).find((node) => node.nodeType === 3 && node.textContent.trim());
        if (words) words.textContent = " " + t("Subforums") + " ";
    }
}

/* ---- Entry point --------------------------------------------------- */

// Replaces :has() selectors that cost 240ms of style work — re-checked on every DOM
// change, and this script touches ~600 cells per listing — with attributes set once.
function markShapes() {
    for (const cell of document.querySelectorAll("#wrapcentre td.cat")) {
        const row = cell.parentElement;
        // "controls" is set on the row too — the phone stylesheet pulls the sort
        // strip away from the card via a margin on the row, not the cell.
        let kind = cell.childNodes.length ? "" : "empty";
        if (cell.querySelector(':scope > table, select, input[type="submit"]')) {
            cell.setAttribute("data-rr-cat", "controls");
            kind = "controls";
        } else if (cell.getAttribute("align") === "right" && !cell.querySelector("h4")) {
            cell.setAttribute("data-rr-cat", "plain");
        }
        if (row && row.tagName === "TR") {
            row.setAttribute("data-rr-cat-row", kind);
        }
    }

    // The posting form's font colour palette: one table of swatches.
    const swatch = document.querySelector('td[bgcolor] > a[onclick*="bbfontstyle"]');
    if (swatch) {
        const table = swatch.closest("table");
        if (table) {
            table.setAttribute("data-rr-palette", "");
            for (const cell of table.querySelectorAll("td[bgcolor]")) cell.setAttribute("data-rr-swatch", "");
        }
    }

    // Link-list tables (control panel Options, message folders) and their
    // message-colour legend — otherwise each row becomes a phone card, and a
    // 9-item menu becomes a wall of them.
    for (const table of document.querySelectorAll("#wrapcentre table.tablebg")) {
        const cells = Array.from(table.querySelectorAll(":scope > tbody > tr > td"));
        if (!cells.length) continue;
        if (cells.every((cell) => cell.querySelector("a.nav, b.nav, span.nav") && !cell.querySelector("input, select, .postbody"))) {
            table.setAttribute("data-rr-navlist", "");
        }
        const swatch = (cell) => /(^|\s)pm_\w+_colour(\s|$)/.test(cell.className);
        if (cells.some(swatch) && cells.every((cell) => swatch(cell) || cell.children.length <= 1)) {
            table.setAttribute("data-rr-pm-legend", "");
        }
    }

    // Permissions notice ("You can post new topics…") is the table right after the
    // jump-to form's — tagged here so the stylesheet can gap it without a :has().
    const jump = document.querySelector('form[name="jumpbox"]');
    const jumpTable = jump && jump.closest("table");
    if (jumpTable && jumpTable.nextElementSibling && jumpTable.nextElementSibling.tagName === "TABLE") {
        jumpTable.nextElementSibling.setAttribute("data-rr-after-jump", "");
    }

    // A checkbox/radio alone in the first cell, with its label text in the next.
    for (const input of document.querySelectorAll(
        '#wrapcentre td:first-child > input[type="checkbox"]:only-child, #wrapcentre td:first-child > input[type="radio"]:only-child')) {
        const row = input.closest("tr");
        if (!row) continue;
        row.setAttribute("data-rr-check-row", "");
        // Template never marks these words as the control's label — clicking did
        // nothing, unlike every other form.
        const words = input.parentElement && input.parentElement.nextElementSibling;
        if (!words || words.querySelector("input, select, textarea, button")) continue;
        words.setAttribute("data-rr-check-label", "");
        words.addEventListener("click", (event) => {
            if (event.target instanceof Element && event.target.closest("a")) return;
            input.click();
        });
    }

    // "Top" row's link is already hidden (forum.css, replaced by the floating
    // button) — leaves an empty band the width of the post, worse as a padded card on a phone.
    for (const row of document.querySelectorAll("#wrapcentre table.tablebg > tbody > tr")) {
        const first = row.firstElementChild;
        if (!first || first.tagName !== "TD") continue;
        const links = first.querySelectorAll("a");
        if (links.length !== 1) continue;
        const href = links[0].getAttribute("href") || "";
        if (href !== "#wrapheader" && href !== "#top") continue;
        if (first.textContent.trim() !== links[0].textContent.trim()) continue;
        row.setAttribute("data-rr-top-row", "");
    }
}

/**
 * Member list / message folders / Who's online are listings too, but a post table
 * shares the same row1/row2 classes without being one — so the shape is checked
 * (a header row, 3+ striped rows, a member/message link, nothing post- or form-like).
 */
function isRoster(table) {
    if (PAGE.isTopic || profileView()) return false;
    if (!table.querySelector("th")) return false;
    if (table.querySelector(".postbody, textarea, table")) return false;
    // row1/row2 sits on the cells (message folder, Who's online) or on the <tr> itself (member list).
    const striped = (node) => Boolean(node) && /(^|\s)row[12](\s|$)/.test(node.className || "");
    const rows = Array.from(table.querySelectorAll(":scope > tbody > tr"))
        .filter((row) => striped(row) || striped(row.firstElementChild));
    if (rows.length < 3) return false;
    return Boolean(table.querySelector('a[href*="mode=viewprofile"], .topictitle a'));
}

/** Whole title cell opens the topic (the row highlights edge-to-edge on hover, but
 *  most of the cell was dead space under that light). Links, controls and text
 *  selections are left alone; Ctrl/⌘ opens a new tab. */
function initRowClick() {
    let any = false;
    for (const table of document.querySelectorAll("table[data-rr-list]")) {
        if (!table.querySelector('td[data-rr-col="title"] a.topictitle, td[data-rr-col="title"] a.forumlink')) continue;
        table.setAttribute("data-rr-rowclick", "");
        any = true;
    }
    if (!any) return;
    document.addEventListener("click", (event) => {
        if (event.button !== 0 || event.defaultPrevented) return;
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;
        const cell = target.closest('table[data-rr-rowclick] td[data-rr-col="title"]');
        if (!cell) return;
        if (target.closest("a, button, input, select, label, [role='button']")) return;
        if (window.getSelection && String(window.getSelection()).trim()) return;
        const link = cell.querySelector("a.topictitle, a.forumlink");
        if (!link) return;
        if (event.ctrlKey || event.metaKey) window.open(link.href, "_blank", "noopener");
        else location.href = link.href;
    });
}

/**
 * Profiles print every field the template knows (ICQ, AIM, Yahoo, MSN, Jabber,
 * Occupation, Interests…) blank on nearly every account. A row whose label ends in
 * a colon and whose value cell has no text, link or image is dropped — judged by
 * shape, not by field name, so a filled-in field of any name stays.
 */
// PAGE.isProfile covers all of memberlist.php (the roster as well as one member's
// page) — this checks for the latter.
function profileView() {
    return PAGE.isProfile && /mode=viewprofile/.test(location.search);
}

function hideEmptyProfileRows() {
    for (const row of document.querySelectorAll("#wrapcentre table.tablebg tr")) {
        const cells = Array.from(row.children).filter((node) => node.tagName === "TD");
        if (cells.length !== 2) continue;
        // "PM: [button]" beside "Groups: [select]" also look like label+value, but
        // they're two forms side by side — the phone stacks those instead.
        if (cells.some((cell) => cell.querySelector("table, form"))) continue;
        const label = cells[0].textContent.replace(/\s+/g, " ").trim();
        if (!/:$/.test(label)) continue;
        const value = cells[1];
        if (value.querySelector("a, img, input, select, button, textarea")
            || value.textContent.replace(/[\s\u00a0]+/g, "")) {
            // A label and its value: the phone keeps them on one line.
            row.setAttribute("data-rr-pair", "");
            continue;
        }
        row.hidden = true;
        row.setAttribute("data-rr-empty-row", "");
    }
}

// Turns page links into small chips (current page marked, "..." kept as a quiet
// mark). Two shapes come through here: "[ Go to page: 1 … 43 ]" under a long topic's
// title, and the "Go to page 1, 2, 3 … 615 Next" strip a listing ends with.
function chipPager(holder) {
    if (holder.hasAttribute("data-rr-minipager")) return;
    if (!holder.querySelector("a[href]") || !/(Go to page|На страницу)/.test(holder.textContent)) return;
    const russian = /На страницу/.test(holder.textContent);
    // Gathered in reading order before anything moves — a node's neighbours change once it does.
    const items = [];
    const walk = (node) => {
        for (const child of Array.from(node.childNodes)) {
            if (child.nodeType === 3) { if (/…|\.\.\./.test(child.textContent)) items.push("gap"); continue; }
            if (child.nodeType !== 1) continue;
            if (child.matches("a[href], strong")) items.push(child);
            else if (!child.querySelector("a") && /…|\.\.\./.test(child.textContent)) items.push("gap");
            else walk(child);
        }
    };
    walk(holder);
    const row = el("span.rr-minipager", { "aria-label": russian ? "На страницу" : "Go to page" });
    const jump = items.find((node) => node !== "gap" && /jumpto/.test(node.getAttribute("onclick") || ""));
    if (jump) {
        jump.classList.add("rr-minipager__label");
        row.append(jump);
    } else {
        row.append(el("span.rr-minipager__label", {}, [russian ? "На страницу" : "Go to page"]));
    }
    let last = null;
    for (const item of items) {
        if (item === jump) continue;
        if (item === "gap") {
            if (last && last !== "gap") row.append(el("span.rr-minipager__gap", { "aria-hidden": "true" }, ["…"]));
            last = "gap";
            continue;
        }
        const number = /^\d+$/.test(item.textContent.trim());
        if (item.tagName === "STRONG" && !number) continue;
        item.classList.add("rr-minipager__page");
        if (item.tagName === "STRONG") item.classList.add("rr-minipager__page--here");
        else if (!number) item.classList.add("rr-minipager__step");
        row.append(item);
        last = item;
    }
    holder.textContent = "";
    holder.append(row);
    holder.setAttribute("data-rr-minipager", "");
}

function tidyPagers() {
    for (const p of document.querySelectorAll('td[data-rr-col="title"] p.gensmall')) chipPager(p);
    // "[ Go to page: 1 … 263, 264, 265 ]" under a subscribed topic or a bookmark: the
    // same shape as under a listing title, in a cell this script does not label.
    for (const strip of document.querySelectorAll("#wrapcentre p.gensmall, #wrapcentre span.gensmall")) {
        if (strip.closest(".rr-topicbar, .rr-minipager, .rr-releases")) continue;
        if (!/(?:Go to page|На страницу)\s*:/.test(strip.textContent)) continue;
        chipPager(strip);
    }
    for (const jump of document.querySelectorAll('#wrapcentre a[onclick*="jumpto"]')) {
        if (jump.closest(".rr-topicbar, .rr-minipager")) continue;
        const holder = jump.closest("b") || jump.closest("td, p, span");
        if (!holder) continue;
        chipPager(holder);
        // The strip is a bare table dropped between two cards, with
        // nothing to hold them apart; named so the stylesheet can.
        const table = holder.closest("table");
        if (table && !table.matches(".tablebg, .forumline") && /^(wrapcentre|pagecontent)$/.test(table.parentElement.id)) {
            table.setAttribute("data-rr-strip", "");
        }
    }
}

// The board hides a missing-email cell with inline display:none, which removes it
// from a real table rather than blanking it — every later cell slides one column
// left. Restores the empty cell wherever the row and header still agree on the
// column count. Only the board's own inline hiding is undone, only before this
// script hides anything of its own.
function restoreGridCells(table) {
    const header = table.querySelector(":scope > tbody > tr[data-rr-head], :scope > tbody > tr:first-child");
    if (!header) return;
    const columns = header.querySelectorAll(":scope > th, :scope > td").length;
    if (columns < 3) return;
    for (const row of table.querySelectorAll(":scope > tbody > tr")) {
        const cells = row.querySelectorAll(":scope > td");
        if (cells.length !== columns) continue;
        for (const cell of cells) {
            if (cell.style.display === "none") cell.style.removeProperty("display");
        }
    }
}

// Roster headers align to match their (often centred) column, or a left-aligned
// header names nothing in particular over a centred one.
function alignRosterHeaders(table) {
    const header = table.querySelector(":scope > tbody > tr[data-rr-head], :scope > tbody > tr:first-child");
    if (!header) return;
    const heads = Array.from(header.querySelectorAll(":scope > th"));
    if (!heads.length) return;
    const rows = Array.from(table.querySelectorAll(":scope > tbody > tr"));
    const body = rows.slice(rows.indexOf(header) + 1)
        .find((row) => row.querySelectorAll(":scope > td").length === heads.length
            && !row.querySelector(":scope > td[colspan]"));
    if (!body) return;
    const cells = body.querySelectorAll(":scope > td");
    heads.forEach((head, index) => {
        if (head.hasAttribute("data-rr-col")) return;
        const align = (cells[index].getAttribute("align") || "").toLowerCase();
        if (align === "center" || align === "right") head.style.textAlign = align;
    });
}

// Roster's email/website cells are padded with &nbsp; even when empty — on phone
// that drew as an empty dark chip in the card.
function markEmptyCells(table) {
    for (const cell of table.querySelectorAll(":scope > tbody > tr > td")) {
        if (cell.textContent.replace(/[\s\u00a0]+/g, "")) continue;
        if (cell.querySelector("a, img, input, button, select, svg")) continue;
        cell.setAttribute("data-rr-empty", "");
    }
}

// Template writes link rows as bare text with punctuation between them
// ("Previous PM | Next PM", "[ Add friend | Add foe ]") — rendered as pipes at four
// different heights. Replaced with a row and a gap, which is what the punctuation
// was standing in for.
const LINK_STRIP_JUNK = /^[\s |:·,;\[\]()–—-]*$/;

function tidyLinkStrips() {
    const cells = document.querySelectorAll(
        "#wrapcentre td.gen, #wrapcentre td.gensmall, #wrapcentre td.genmed, #wrapcentre td.nav,"
        + " #wrapcentre p.gensmall, #wrapcentre span.gensmall, #wrapcentre div.gensmall",
    );
    for (const cell of cells) {
        if (cell.closest(".rr-topicbar, .rr-toolbar, .rr-releases, .postbody, table[data-rr-list]")) continue;
        if (cell.querySelector("img, input, select, textarea, table, .rr-minipager")) continue;
        const links = Array.from(cell.children).filter((node) => node.tagName === "A");
        if (links.length < 2 || links.length !== cell.children.length) continue;
        // Only punctuation between them, or this is a sentence with
        // links in it rather than a strip of controls.
        if (!Array.from(cell.childNodes).every((node) => node.nodeType !== 3 || LINK_STRIP_JUNK.test(node.textContent))) continue;
        for (const node of Array.from(cell.childNodes)) {
            if (node.nodeType === 3) node.remove();
        }
        const row = el("span.rr-linkrow");
        if ((cell.getAttribute("align") || "").toLowerCase() === "right") row.setAttribute("data-rr-align", "right");
        cell.append(row);
        for (const link of links) row.append(link);
    }
}

// Board's own broken images (e.g. an avatar box for a member with none) are hidden;
// a broken image inside a post is left as-is — that hole is honest, it's the poster's.
function dropBrokenImages() {
    for (const img of document.querySelectorAll("#wrapcentre img")) {
        if (img.closest(".postbody, .rr-game, .rr-lightbox")) continue;
        const drop = () => { img.style.display = "none"; };
        const src = img.getAttribute("src");
        // No source at all, or one the browser has already given up on.
        if (!src || (img.complete && img.naturalWidth === 0)) drop();
        else img.addEventListener("error", drop, { once: true });
    }
}

/* ---- Sorting the page you are on ---------------------------------- */

// Client-side sort only (phpBB has no server-side reorder for rows already sent).
// Sorted within each run between the template's own section rows, so a pinned
// announcement never lands among the topics.
const SORT_KIND = {
    replies: "number", views: "number", topics: "number", posts: "number", num: "number",
    date: "date", last: "date",
    title: "text", author: "text", rank: "text",
};

const SORT_MONTHS = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// Board's date format after the weekday is dropped. Relative times ("4 minutes
// ago", "Today") read from the title attribute set when they were shortened.
function boardTime(text) {
    const said = String(text || "");
    const match = /(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})(?:,\s*(\d{1,2}):(\d{2}))?/.exec(said);
    if (match) {
        const month = SORT_MONTHS[match[2].toLowerCase()];
        if (month !== undefined) {
            return Date.UTC(Number(match[3]), month, Number(match[1]), Number(match[4] || 0), Number(match[5] || 0));
        }
    }
    if (/^\s*(?:today|сегодня)/i.test(said) || /\bago\b|назад/i.test(said)) return Date.now();
    return null;
}

function sortKey(row, index, kind) {
    const cell = row.children[index];
    if (!cell) return kind === "text" ? "" : -Infinity;
    if (kind === "number") {
        const digits = cell.textContent.replace(/[\s\u00a0\u202f,]/g, "");
        const value = parseFloat(digits);
        return Number.isFinite(value) ? value : -Infinity;
    }
    if (kind === "date") {
        const dated = cell.hasAttribute("title") ? cell : cell.querySelector("[title]");
        const time = boardTime(dated ? dated.getAttribute("title") : "") ?? boardTime(cell.textContent);
        return time === null ? -Infinity : time;
    }
    return cell.textContent.replace(/\s+/g, " ").trim().toLowerCase();
}

// subsilver2 alternates row1/row2 *across columns*, not rows — a topic row comes out
// striped in vertical bands instead of by row. Shade is written to a separate
// attribute instead (the board's own classes are left alone, in case another script reads them).
function restripe(rows) {
    rows.forEach((row, index) => row.setAttribute("data-rr-stripe", index % 2 ? "b" : "a"));
}

/** Data rows split into runs by the template's own section rows — a run is the unit
 *  a sort reorders within, and it is what the stripe runs down. */
function listingRuns(table) {
    const head = table.querySelector(":scope > tbody > tr[data-rr-head]");
    if (!head || !head.querySelector("th")) return [];
    // Columns, not cells — the first heading spans the unread marker plus the title.
    const width = Array.from(head.children)
        .reduce((total, cell) => total + parseInt(cell.getAttribute("colspan") || "1", 10), 0);

    const all = Array.from(table.querySelectorAll(":scope > tbody > tr"));
    const runs = [];
    let run = null;
    for (const row of all.slice(all.indexOf(head) + 1)) {
        const data = row.children.length === width
            && !row.querySelector("th")
            && !row.hasAttribute("data-rr-cat-row")
            && !row.querySelector(":scope > td[colspan]");
        if (!data) { run = null; continue; }
        if (!run) { run = []; runs.push(run); }
        run.push(row);
    }
    return runs;
}

function initColumnSort(table) {
    const head = table.querySelector(":scope > tbody > tr[data-rr-head]");
    if (!head || !head.querySelector("th")) return;
    const sortable = listingRuns(table).filter((rows) => rows.length > 2);
    if (!sortable.length) return;
    const original = sortable.map((rows) => rows.slice());
    // Anchor read once, before any sort — re-reading it after a sort would give
    // whichever row had ended up last, scattering rows through their own run on restore.
    const anchors = sortable.map((rows) => rows[rows.length - 1].nextSibling);
    // "#" is a page position, not a row property — sorted rows keep the number in
    // place rather than carrying it with them.
    const numbers = sortable.map((rows) => rows.map((row) => {
        const cell = row.querySelector(':scope > td[data-rr-col="num"]');
        return cell ? cell.textContent : null;
    }));

    let current = null;

    const place = (rows, at) => {
        const parent = rows[0].parentElement;
        for (const row of rows) parent.insertBefore(row, anchors[at]);
        restripe(rows);
        rows.forEach((row, index) => {
            const text = numbers[at][index];
            if (text === null) return;
            const cell = row.querySelector(':scope > td[data-rr-col="num"]');
            if (cell) cell.textContent = text;
        });
    };

    const apply = (index, kind, direction) => {
        sortable.forEach((rows, at) => {
            const order = original[at];
            if (!direction) { place(order.slice(), at); return; }
            const decorated = order.map((row, position) => ({ row, position, key: sortKey(row, index, kind) }));
            decorated.sort((a, b) => {
                let side = 0;
                if (typeof a.key === "string" || typeof b.key === "string") {
                    side = String(a.key).localeCompare(String(b.key), undefined, { numeric: true, sensitivity: "base" });
                } else {
                    side = a.key === b.key ? 0 : (a.key < b.key ? -1 : 1);
                }
                // A stable tie: two rows with the same count keep the
                // order the board sent them in.
                return (direction === "asc" ? side : -side) || a.position - b.position;
            });
            place(decorated.map((entry) => entry.row), at);
        });
    };

    let at = 0;
    for (const th of head.children) {
        const span = parseInt(th.getAttribute("colspan") || "1", 10);
        // A spanning heading names the last of the columns it covers —
        // the title, where the ones before it are the marker gutter.
        const index = span > 1 ? at + span - 1 : at;
        at += span;
        if (th.tagName !== "TH") continue;
        const kind = SORT_KIND[th.getAttribute("data-rr-col")];
        if (!kind || !th.textContent.trim()) continue;

        const mark = el("span.rr-sortmark", { "aria-hidden": "true" });
        const button = el("button.rr-sortbtn", { type: "button" });
        while (th.firstChild) button.append(th.firstChild);
        button.append(mark);
        th.append(button);
        th.setAttribute("data-rr-sortable", "");

        button.addEventListener("click", () => {
            const same = current && current.th === th;
            const direction = !same ? "asc" : current.direction === "asc" ? "desc" : null;
            for (const other of head.children) {
                other.removeAttribute("data-rr-sorted");
                const otherMark = other.querySelector(".rr-sortmark");
                if (otherMark) otherMark.textContent = "";
            }
            apply(index, kind, direction);
            current = direction ? { th, direction } : null;
            if (direction) {
                th.setAttribute("data-rr-sorted", direction);
                mark.textContent = direction === "asc" ? "\u2191" : "\u2193";
                th.setAttribute("aria-sort", direction === "asc" ? "ascending" : "descending");
            } else {
                th.removeAttribute("aria-sort");
            }
        });
    }
}

/* ---- A folder's Mark column --------------------------------------- */

// No bulk-select existed — deleting a dozen messages was a dozen clicks. Adds a
// select-all in the heading and shift-click range select, like any mail client.
function initMarkColumn(table) {
    const boxes = Array.from(table.querySelectorAll(':scope > tbody > tr > td input[type="checkbox"]'));
    if (boxes.length < 3) return;
    const head = table.querySelector(':scope > tbody > tr[data-rr-head] > th[data-rr-col="mark"]');
    if (!head || head.querySelector("input")) return;

    const all = el("input.rr-markall", { type: "checkbox", title: t("Mark everything on this page") });
    all.addEventListener("change", () => {
        for (const box of boxes) {
            if (box.checked === all.checked) continue;
            box.checked = all.checked;
            box.dispatchEvent(new Event("change", { bubbles: true }));
        }
    });
    head.append(all);

    let anchor = null;
    for (const box of boxes) {
        box.addEventListener("click", (event) => {
            if (event.shiftKey && anchor && anchor !== box) {
                const from = boxes.indexOf(anchor);
                const to = boxes.indexOf(box);
                for (let i = Math.min(from, to); i <= Math.max(from, to); i += 1) {
                    boxes[i].checked = box.checked;
                }
            }
            anchor = box;
        });
    }
}

/* ---- The rules notice folds ---------------------------------------- */

// Identical 217-290px notice repeats above every topic in a restricted forum — worth
// reading once, a line after. Open on first sight (a reader who has never seen the
// rules needs to meet them), folded after. Keyed by the notice's own text, not the
// forum, so an edited notice is shown again.
const RULES_FOLD_KEY = "rulesFold";

function rulesFolds() {
    const kept = store.get(RULES_FOLD_KEY, null);
    return kept && typeof kept === "object" ? kept : {};
}

// djb2 hash of the normalised text — two forums sharing wording share a store key;
// an edited notice gets a new key and reappears.
function rulesKey(text) {
    const said = text.replace(/\s+/g, " ").trim().toLowerCase();
    let hash = 5381;
    for (let i = 0; i < said.length; i += 1) hash = (((hash << 5) + hash) ^ said.charCodeAt(i)) >>> 0;
    return hash.toString(36);
}

/** Folds one notice: `heading` (or null, when the board printed none) becomes the
 *  toggle button's label, `content` moves into a body the button hides — the card
 *  keeps its existing shape and colours. */
function foldRulesNotice(card, heading, content) {
    if (!content.length || card.querySelector(".rr-rules__toggle")) return;

    const body = el("div.rr-rules__body");
    for (const node of content) body.append(node);

    // Board's own heading moves into the button rather than being replaced — the
    // stylesheet, and anything else reading this card, already looks for that element.
    const label = heading || el("span.rr-rules__name", {}, [t("Forum rules")]);
    const toggle = el("button.rr-rules__toggle", { type: "button" }, [icon("chevronD", 13), label]);

    const key = rulesKey(body.textContent);
    const kept = rulesFolds();
    // First time: open, then immediately written closed — so opening it back up is
    // the only thing that keeps it open on the next page of the same forum.
    const first = !Object.prototype.hasOwnProperty.call(kept, key);
    let open = first || kept[key] === "open";
    if (first) {
        kept[key] = "closed";
        store.set(RULES_FOLD_KEY, kept);
    }

    const sync = () => {
        card.toggleAttribute("data-rr-folded", !open);
        body.hidden = !open;
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        labelled(toggle, open ? t("Hide the forum rules") : t("Read the forum rules"));
    };
    toggle.addEventListener("click", () => {
        open = !open;
        const now = rulesFolds();
        now[key] = open ? "open" : "closed";
        store.set(RULES_FOLD_KEY, now);
        sync();
    });

    card.prepend(toggle);
    toggle.after(body);
    sync();
}

// subsilver2's rules box (a lone td.row3) has two problems left alone: an inline
// `margin-bottom: 2px` beats any stylesheet rule and glues it to the topic title
// below, and it keeps listing-row styling (inset, hairline, same ground) so it reads
// as a slab of text with no edges. Tagged here; the stylesheet dresses it properly.
function markForumRules() {
    // Live board writes div.forumrules directly, not the td.row3 subsilver2 and the
    // fixtures ship — the td.row3 handling below never actually matched on cs.rin.ru.
    for (const box of document.querySelectorAll("#wrapcentre div.forumrules")) {
        if (box.hasAttribute("data-rr-rules")) continue;
        box.setAttribute("data-rr-rules", "");
        tameRulesEmphasis(box);
        // Template's <br> spacing (both sides plus one under the heading) is now
        // redundant — the card has its own margins.
        for (const side of ["previousElementSibling", "nextElementSibling"]) {
            const near = box[side];
            if (near && near.tagName === "BR") near.style.display = "none";
        }
        const heading = box.querySelector("h3, h4");
        if (heading && heading.nextElementSibling && heading.nextElementSibling.tagName === "BR") {
            heading.nextElementSibling.style.display = "none";
        }
        // Everything but the heading is the rules; the heading becomes
        // the control that shows them.
        const content = Array.from(box.childNodes).filter((node) => node !== heading);
        foldRulesNotice(box, heading, content);
    }

    for (const cell of document.querySelectorAll("#wrapcentre td.row3")) {
        const box = cell.closest("table.tablebg");
        if (!box || box.hasAttribute("data-rr-rules")) continue;

        // Checked by content (no header row, no topic links), not by nesting depth —
        // a cell-count check failed on the live board, where the rules are wrapped in
        // an extra table subsilver2 doesn't show in the fixtures.
        if (box.querySelector("th, a.topictitle, a.forumlink")) continue;
        if (!cell.querySelector("h4, p.rules, .postbody")) continue;

        box.setAttribute("data-rr-rules", "");
        if (box.style.marginBottom) box.style.marginBottom = "";
        tameRulesEmphasis(cell);

        // The cell (td.row3), not the table, is the card the stylesheet dresses —
        // toggle and body go inside it.
        const heading = cell.querySelector("h4, p.rules, h3");
        const content = Array.from(cell.childNodes).filter((node) => node !== heading);
        foldRulesNotice(cell, heading, content);
    }
}

// Board's [size=150] BBCode becomes inline font-size:150%, which beats the
// stylesheet — 22px shouting over three lines above a smaller topic title. Dropped
// rather than clamped: even 120% still overpowers, so emphasis has to come from the
// card/rail/colour instead. Inline colour (#FFBF00, not in this theme system) is
// cleared the same way so the stylesheet can paint its own per-theme warning colour.
const RULES_MAX_EMPHASIS = 100;

function tameRulesEmphasis(cell) {
    for (const node of cell.querySelectorAll('[style*="font-size"]')) {
        const written = /^\s*(\d+(?:\.\d+)?)\s*(%|em|rem)\s*$/.exec(node.style.fontSize);
        if (!written) continue;
        const percent = written[2] === "%" ? Number(written[1]) : Number(written[1]) * 100;
        if (percent <= RULES_MAX_EMPHASIS) continue;
        node.style.removeProperty("font-size");
        // Typed in beside it, and it fights the leading the card sets.
        node.style.removeProperty("line-height");
    }
    for (const node of cell.querySelectorAll('[style*="color"]')) node.style.removeProperty("color");
}

/** row1..row5, the classes subsilver2 bands a table with. */
const ROW_CLASS_RE = /\brow[1-5]\b/;
/** A label cell: "Message subject:", "From:" — the colon is the tell. */
const LABEL_RE = /:\s*$/;

// Field tables (e.g. a PM's "Subject:/From:/Sent:/To:" header) put the row1/row2
// class on the <tr>, not the <td> — so this stylesheet's td.row1 inset never applied,
// and labels sat at 4px padding while the panel below sat at 14px. Told apart by
// shape: two cells, a label ending in a colon, no header row, no topic links.
function markFieldTables() {
    for (const table of document.querySelectorAll("#wrapcentre table.tablebg")) {
        if (table.hasAttribute("data-rr-fields")) continue;
        if (table.querySelector("th, a.topictitle, a.forumlink, .postbody, textarea")) continue;

        const rows = Array.from(table.querySelectorAll(":scope > tbody > tr"));
        if (rows.length < 2) continue;

        const fields = rows.every((row) => {
            if (!ROW_CLASS_RE.test(row.className)) return false;
            const cells = Array.from(row.children).filter((cell) => cell.tagName === "TD");
            if (cells.length !== 2) return false;
            // The cell must not carry a row class of its own, or the
            // padding it already has is the one this would double.
            if (cells.some((cell) => ROW_CLASS_RE.test(cell.className))) return false;
            return LABEL_RE.test(cells[0].textContent);
        });
        if (!fields) continue;

        table.setAttribute("data-rr-fields", "");
        for (const row of rows) {
            const cells = Array.from(row.children).filter((cell) => cell.tagName === "TD");
            cells[0].setAttribute("data-rr-field", "label");
            cells[1].setAttribute("data-rr-field", "value");
        }
    }
}

function initLists() {
    markShapes();
    markForumRules();
    markFieldTables();
    groupSortControls();
    for (const table of document.querySelectorAll("table.tablebg")) {
        restoreGridCells(table);
        labelColumns(table);
        // row1/row2 alternate down a listing but wrap whole posts in a topic — same
        // classes, opposite meaning, so which kind of table this is has to be tagged.
        const roster = isRoster(table);
        if (table.querySelector("a.topictitle, a.forumlink") || roster) {
            table.setAttribute("data-rr-list", "");
            groupListingNumbers(table);
        }
        // Member roster (not a message folder) — the phone lays cards out name-first
        // and drops template-empty cells.
        if (roster && !table.querySelector(".topictitle a, a.topictitle, a.forumlink")) {
            table.setAttribute("data-rr-roster", "");
            alignRosterHeaders(table);
            markEmptyCells(table);
        }
        if (table.hasAttribute("data-rr-list")) {
            for (const run of listingRuns(table)) restripe(run);
            if (settings.get("sortColumns")) initColumnSort(table);
            initMarkColumn(table);
            if (table.querySelector("a.topictitle")) initSectionFolds(table);
        }
    }
    decorateNavLists();
    // After the sort buttons exist, so the words are found inside one.
    labelSubforums();
    if (settings.get("rowClick")) initRowClick();
    if (profileView()) {
        // Named on the root so the phone can stack the profile's two
        // columns without a :has() on the table.
        document.documentElement.setAttribute("data-rr-profile", "");
        hideEmptyProfileRows();
    }
    tidyPagers();
    // Icon legend: the index's table is class="legend", a listing's has no class at
    // all — dot cells and spacers are tagged so the phone can lay each dot beside its words.
    for (const table of document.querySelectorAll("#wrapcentre table.legend, #wrapcentre table:not([class])")) {
        if (table.hasAttribute("data-rr-legend") || table.querySelector("table, input, select, a")) continue;
        const cells = Array.from(table.querySelectorAll(":scope > tbody > tr > td"));
        const dot = (cell) => !cell.textContent.trim() && cell.querySelector(".rr-dot")
            && Array.from(cell.children).every((child) => child.matches("img, .rr-dot"));
        const words = (cell) => cell.textContent.replace(/[\s\u00a0]+/g, "") && !cell.querySelector("img, .rr-dot, b, table");
        const dots = cells.filter(dot);
        if (dots.length < 2) continue;
        if (!cells.every((cell) => dot(cell) || words(cell) || !cell.textContent.replace(/[\s\u00a0]+/g, ""))) continue;
        table.setAttribute("data-rr-legend", "");
        for (const cell of dots) cell.setAttribute("data-rr-legend-dot", "");
        markEmptyCells(table);
    }
    // The message folder's sort form sits in a bare table of its own
    // under the list; named so it can take a card's gap.
    const sortForm = document.querySelector('#wrapcentre form[name="sortmsg"]');
    const sortTable = sortForm && sortForm.closest("table");
    if (sortTable && !sortTable.matches(".tablebg, .forumline")) sortTable.setAttribute("data-rr-sortfoot", "");

    dedupeSearchBoxes();
    tidyLinkStrips();
    dropBrokenImages();

    // A PM's signature divider is a run of underscores in the body (no signature
    // node like a post has). Posts are left alone — there it's already a rule, not text.
    if (!PAGE.isTopic) {
        for (const body of document.querySelectorAll("#wrapcentre .postbody")) replaceUnderscoreRules(body);
    }

    // Before the page-kind gate — the member list, message folders and control panel
    // are none of those kinds and need this too.
    tightenDateCells();
    localiseRankCells();
    dropLonePageCounters();
    alignMessageMarkers();

    if (!PAGE.isForum && !PAGE.isIndex && !PAGE.isSearch) return;

    // Before topic rows are looked for — the index has none (it lists forums), so
    // this ran only on the forum page, leaving the same Last-post column one line
    // there and two lines on the index in front of it.
    for (const cell of document.querySelectorAll('td[data-rr-col="last"]')) tightenLastPost(cell);

    const entries = topicRows();
    if (!entries.length) return;

    if (PAGE.isForum || PAGE.isSearch) buildForumBar();

    const visited = settings.get("hideVisited") ? visitedSet() : null;
    const seenPrefixes = new Map();
    const unreadRouting = settings.get("unreadFromList") && !PAGE.isSearch && isLoggedIn();

    // Prefix becomes a clickable chip only when there are filter chips for it to drive.
    const filtering = settings.get("listFilter") && entries.length >= FILTER_MIN_ROWS;

    let setTag = () => {};
    for (const entry of entries) {
        // Read once, here: the chip that filters on it and the routing
        // below both want the answer and it does not change.
        entry.unread = rowIsUnread(entry.row);
        if (settings.get("prefixTags")) {
            const { prefix, kind } = splitPrefix(entry.title);
            const applied = decorateTitle(entry, filtering ? (value) => setTag(value) : null);
            if (applied && prefix) seenPrefixes.set(prefix, kind);
        }
        if (settings.get("bookmarks") && entry.id) addBookmarkStar(entry);
        if (unreadRouting) retargetToUnread(entry);
        if (visited && entry.id && visited.has(entry.id)) {
            entry.row.setAttribute("data-rr-visited", "1");
        }
    }

    if (settings.get("listFilter")) {
        const prefixes = Array.from(seenPrefixes.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(0, 8);
        const toolbar = buildToolbar(entries, prefixes, filtering);
        setTag = toolbar.setTag;

        // Action bar and filter bar merge into one (was 123px of chrome as two
        // stacked cards) — done in JS since they aren't siblings in the template.
        // An empty bar is never placed at all.
        const actions = document.querySelector(".rr-topicbar");
        if (toolbar.empty) {
            /* nothing to place */
        } else if (actions) {
            actions.append(toolbar.bar);
        } else {
            const table = entries[0].row.closest("table.tablebg");
            if (table) table.before(toolbar.bar);
        }
    }
}

// Sort strip's label+select pairs are flat siblings separated only by a space, which
// wraps like any other space — "Sort by:" broke onto its own line on a phone. Each
// label and its controls up to the next label are grouped into one span so a wrap
// only ever falls between pairs.
function groupSortControls() {
    for (const label of document.querySelectorAll(
        '#wrapcentre td.cat[data-rr-cat="controls"] span.gensmall, #wrapcentre form[name="sortmsg"] span.gensmall',
    )) {
        const group = el("span.rr-ctrl-group");
        label.before(group);
        group.append(label);
        let next = group.nextSibling;
        while (next && !(next.nodeType === 1
            && (next.matches("span.gensmall") || next.matches('input[type="submit"], input[type="button"]')))) {
            const node = next;
            next = next.nextSibling;
            // Template's &nbsp;/spaces are dropped — the group's own gap replaces
            // them (left in, they'd become empty flex items).
            if (node.nodeType === 3 && !node.textContent.trim()) { node.remove(); continue; }
            group.append(node);
        }
    }
}

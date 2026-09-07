/* ------------------------------------------------------------------
   Forum and topic listings.

   Three jobs:
     - label the columns so the mobile stylesheet can restack them
     - turn [Info] / [Release] / [Problem] prefixes into a real,
       clickable taxonomy
     - filter 61,000 topics without a round trip
   ------------------------------------------------------------------ */

const COLUMN_NAMES = {
    forum: "title",
    topics: "topics",
    posts: "posts",
    "last post": "last",
    replies: "replies",
    author: "author",
    views: "views",
    /* The member list, the private message folders and the control
       panel's own tables. Named so the same treatment reaches them —
       a "Joined" or "Sent" column carries the same weekday date as a
       listing's Last post column, and the "Rank" column carries the
       same two-language rank as a post's profile. */
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
    /* The Russian interface. Half the board reads it, and with the
       headers unread nothing below them was: counts ungrouped, dates
       with their weekday, the last-post column on two lines. */
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

/**
 * Tag every cell with data-rr-col, derived from the <th> row so the
 * mapping survives a template that adds or drops a column.
 */
function labelColumns(table) {
    const headRow = table.querySelector("tr:has(th)") || table.querySelector("th")?.parentElement;
    if (!headRow) return;
    /* Named, because it is not always the table's first row: a forum
       listing opens with the "Mark forums read" strip above it. */
    headRow.setAttribute("data-rr-head", "");

    /* Only a listing reads a spanning header as the title column. A
       profile's "User statistics" spans its label and value cells, and
       read that way made the "Joined:" label an icon column and its
       date a title. A message folder's title is a span with the link
       inside, so that shape counts too. */
    const listing = Boolean(table.querySelector("a.topictitle, a.forumlink, .topictitle a"));

    const columns = [];
    const heads = Array.from(headRow.querySelectorAll("th"));
    heads.forEach((th, index) => {
        const span = parseInt(th.getAttribute("colspan") || "1", 10);
        const text = th.textContent.trim().toLowerCase();

        /* A header with no words in it heads the read/unread marker. A
           search results page gives that column a header of its own,
           where a forum listing spans it together with the title. */
        if (!text) {
            columns.push("icon");
            for (let i = 1; i < span; i += 1) columns.push(null);
            return;
        }

        /* A header spanning more than one column heads the title,
           whatever the template calls it — "Forum" on the index,
           "Topics" in a listing. Read off the span rather than the
           word, because "Topics" is also the name of a counting column
           on the index: taking it at its word on a search results page
           labelled the topic titles a count, which took the marker
           gutter and the full-width title column off that page and put
           the number grouping through the titles.

           The columns before the last are the marker and the spacer
           the template keeps beside it. */
        if (span > 1) {
            if (!listing) {
                for (let i = 0; i < span; i += 1) columns.push(null);
                return;
            }
            for (let i = 1; i < span; i += 1) columns.push(index === 0 && i === 1 ? "icon" : null);
            columns.push("title");
            return;
        }

        // The member list is the one roster whose date column is a
        // joining date; the phone card says so in front of it.
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

    /* The headings, by the same names as the cells under them.

       Without this a heading's alignment and its column's alignment
       were two decisions written in two places, and they disagreed:
       Author sat left in the heading and centred in every row of it. A
       column is one column. */
    let at = 0;
    for (const th of heads) {
        const span = parseInt(th.getAttribute("colspan") || "1", 10);
        // A heading that spans the status icon and the title labels the
        // title, which is the half of it with words in.
        const name = columns[span > 1 ? at + span - 1 : at];
        if (name) th.setAttribute("data-rr-col", name);
        at += span;
    }
}

/* The columns that hold a count rather than a word. */
const COUNT_COLUMNS = ["topics", "posts", "replies", "views"];

/** Regroup the digits in every counting column of one listing. */
function groupListingNumbers(table) {
    const selector = COUNT_COLUMNS.map((name) => 'td[data-rr-col="' + name + '"]').join(", ");
    for (const cell of table.querySelectorAll(selector)) groupNumbersIn(cell);
}

/* Where else on this board a long number is a quantity.

   Everything here is either a cell this script built and knows the
   contents of, or an element whose whole text is one number — never a
   sweep over the page, because an AppID, a post number and a Steam
   build id are all names that happen to be spelled in digits. */
function groupBoardNumbers() {
    /* Cells this script built and knows the contents of. The post
       header line is not here: it carries a join year beside its post
       count, and it groups the count itself where it is written. */
    for (const node of document.querySelectorAll(".rr-topicbar__count, .rr-online__summary")) {
        groupNumbersIn(node);
    }
    /* "Statistics :: Total posts 3097072 | Total topics 112579", and
       the activity line under it. The board wraps each figure in its
       own <strong>, which is exactly the shape this wants.

       A profile's own counters would suit it too, and they are not
       here: every profile and the member list are behind a login on
       this board, so nothing in the harness or on the open board can
       reach one. A selector no page can exercise is a selector nobody
       finds out about until it is wrong. */
    groupCountElements("#wrapcentre p.gensmall strong");
}

/* ---- Prefixes ---------------------------------------------------- */

function decorateTitle(entry, onTagClick) {
    const { prefix, kind, rest } = splitPrefix(entry.title);
    if (!prefix) return null;

    // The template renders the prefix as coloured spans inside the
    // link; drop them and rebuild it as a tag beside the link. With no
    // filter behind it — a listing too short to be worth filtering —
    // the same tag is drawn as a label rather than a button, because a
    // control that answers a click with nothing is worse than a word.
    const tag = onTagClick
        ? el("button.rr-tag", { type: "button", "data-tag": kind, title: t("Show only {x}", { x: prefix }) }, [prefix])
        : el("span.rr-tag", { "data-tag": kind }, [prefix]);
    if (onTagClick) {
        tag.addEventListener("click", (event) => {
            event.preventDefault();
            onTagClick(prefix.toLowerCase());
        });
    }

    // The prefix, and only the prefix: whatever else the title holds
    // stays where it is. See stripLeading().
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

    // In the marker gutter rather than after the title.
    //
    // After the title it is one more inline box on the end of a line
    // that already wraps, so on a long topic name the star dropped to a
    // line of its own and took 20px of row with it. Beside the
    // read/unread dot it can never wrap, it lines up down the page, and
    // the two things it sits with are the other two facts about the row
    // rather than part of its name.
    const gutter = entry.row.querySelector('td[data-rr-col="icon"]');
    if (gutter) gutter.append(star);
    else entry.link.after(star);

    // Named on the row, not just the cell: the phone card (responsive.css)
    // pulls the star out to the card's own corner and needs to know which
    // title cells must keep their text clear of it.
    entry.row.setAttribute("data-rr-star", "");
}

/* ---- First unread --------------------------------------------- */

/**
 * Does this row have posts the reader has not seen?
 *
 * The board says so twice: the status image is one of the _unread set,
 * and its alt text reads "Unread posts". Either is enough, and both
 * survive the icon pass, which hides the image but keeps the node —
 * so this works whether or not the legacy imagery was replaced.
 */
function rowIsUnread(row) {
    if (row.querySelector('.rr-dot[data-state="unread"]')) return true;
    for (const img of row.querySelectorAll("img")) {
        if (/_unread/.test(img.getAttribute("src") || "")) return true;
        if (/^unread posts/i.test(img.getAttribute("alt") || "")) return true;
    }
    return false;
}

/**
 * Point a topic title at the first post the reader has not read.
 *
 * The board can already do this — it is what the little arrow beside
 * the row does — but the title, which is the thing anyone actually
 * clicks, drops you on page one of a thread you are on page nineteen
 * of. phpBB answers `view=unread` on viewtopic.php, so this is the
 * board's own route, moved on to the control people use.
 *
 * Only for rows that have unread posts, and only with an account:
 * unread state is per-account, and for a guest `view=unread` is a
 * redirect to the last post, which is not what the title should do.
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

/* Under this many rows the filter is furniture: a box that searches a
   list you can already see all of, a count that says "1 on this page"
   and a chip that filters one row down to one row. The board's own
   refine box still gets its place in the bar — that one is a round
   trip and works whatever the page holds. */
const FILTER_MIN_ROWS = 5;

/**
 * The board draws its refine box more than once.
 *
 * `#search-box` is written into the breadcrumb strip at the top of the
 * page *and* the one at the bottom — the same id, the same form, twice
 * — and a search results page adds a third copy of its own in the
 * results header, labelled "Search these results:" with a Go button
 * rather than a Search button. Three boxes, one job, two different
 * button captions.
 *
 * One survives. The duplicates are hidden rather than removed, because
 * the first `#search-box` is the one CS.RIN.RU Enhanced looks for and
 * that is the copy kept.
 */
function dedupeSearchBoxes() {
    const boxes = Array.from(document.querySelectorAll('[id="search-box"]'));
    for (const box of boxes.slice(1)) {
        box.setAttribute("data-rr-dupe", "");
        box.style.display = "none";
    }

    // The results header's own copy, which is a bare cell rather than a
    // named block. Only dropped when one of the boxes above is left to
    // take its place; the cell beside it carries "Search term used:"
    // and stays either way.
    if (!boxes.length) return;
    for (const field of document.querySelectorAll('input[name="add_keywords"]')) {
        if (field.closest('[id="search-box"]')) continue;
        const cell = field.closest("td");
        if (!cell) continue;
        cell.setAttribute("data-rr-dupe", "");
        cell.style.display = "none";
    }
}

/**
 * `rich` builds the whole bar: filter box, prefix chips, count. Without
 * it the bar is only a home for the board's own refine box — see
 * FILTER_MIN_ROWS.
 */
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

    const input = el("input", {
        type: "search",
        placeholder: t("Filter this page by title"),
        "aria-label": t("Filter topics on this page"),
    });
    input.addEventListener("input", debounce(() => { state.text = input.value.trim(); apply(); }, 90));
    input.addEventListener("keydown", (event) => {
        if (event.key === "Escape") { input.value = ""; state.text = ""; apply(); }
    });

    const tagRow = el("div.rr-toolbar__tags");
    const setTag = (tag) => {
        state.tag = state.tag === tag ? null : tag;
        for (const button of tagRow.children) {
            button.setAttribute("aria-pressed", button.dataset.value === state.tag ? "true" : "false");
        }
        apply();
    };
    /* Everything on this page with something new in it. The board says
       so with a dot beside the row and gives no way to ask for only
       those. */
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
        tagRow.append(unreadChip);
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
        bar.append(el("div.rr-toolbar__filter", {}, [icon("filter"), input]));
        // One chip filters every row down to every row. Chips are worth
        // their line only once there is a choice to make between them.
        if (tagRow.children.length > 1) bar.append(tagRow);
        bar.append(count);
    }

    // The board's own "Search this forum" box sits in a strip of its
    // own above the listing. It belongs next to the filter, so it moves
    // here rather than being duplicated.
    const boardSearch = document.querySelector("#search-box form, #topic-search");
    if (boardSearch) {
        const strip = boardSearch.closest("td.row5") || boardSearch.closest("table");
        bar.append(el("div.rr-toolbar__board", {}, [adoptBoardSearch(boardSearch)]));
        if (strip && !strip.textContent.trim()) {
            const holder = strip.closest("table");
            if (holder) holder.style.display = "none";
        }
    }

    apply();
    return { bar, setTag, tag: () => state.tag, empty: !bar.children.length };
}

/* ---- Forum action bar --------------------------------------------- */

/**
 * The listing header is four separate strips: a "Post new topic" image
 * button, "Page 1 of 615", "[ 61469 topics ]" and the numbered links.
 * They become one bar, matching the topic view.
 */
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
    /* "Page 1 of 615" and "[ 61469 topics ]", which the bar now
       carries: the same pass the topic page uses, so the count is
       lifted here in whichever language the board printed it. */
    tidyBoardPagerStrip(bar, bar);

    /* "Go to page 1, 2, 3, 4, 5 … 137  Next", right-aligned above the
       table: the same journey as the pager in the bar, in a row of its
       own. The topic page hides its copy above the posts and keeps the
       one below; the listing does the same. */
    if (settings.get("quickPager")) {
        const strip = Array.from(document.querySelectorAll("#wrapcentre td.gensmall"))
            .find((cell) => /^\s*(?:Go to page|На страницу)/.test(cell.textContent) && cell.querySelector('a[onclick*="jumpto"]'));
        if (strip) hideWithEmptyRow(strip);
    }

    // The forum name led a line of its own directly above this bar,
    // repeating what the breadcrumb says two lines further up and
    // costing a band of the screen to do it. Inside the bar it labels
    // the controls that act on it, and the band is gone. The node is
    // moved, so its heading level and any link inside it survive.
    heading.classList.add("rr-topicbar__title");
    bar.prepend(heading);

    return bar;
}

/* ---- Last post ----------------------------------------------------- */

/* "Tuesday, 01 Sep 2026, 18:10" — the weekday is four words of a date
   nobody reads a weekday off. Kept on the title, dropped from the line
   so the date and the poster fit beside each other. */
const WEEKDAY_RE = /^(\s*)(?:(?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day|Понедельник|Вторник|Среда|Четверг|Пятница|Суббота|Воскресенье),\s*/i;

/** Drop the weekday from the text nodes directly under `node`. Returns
 *  whether anything changed, so the caller can keep the full date on
 *  the title. */
function dropWeekday(node, depth = 0) {
    let changed = false;
    for (const child of node.childNodes) {
        if (child.nodeType === 3 && WEEKDAY_RE.test(child.textContent)) {
            // "$1" keeps the space the weekday followed: "Posted: Friday, 24 Jul"
            // is "Posted: 24 Jul", not "Posted:24 Jul".
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

/* Hide a cell, and the row and table it leaves empty. */
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

/* A date on its own in a cell — "Joined" on the member list, "Sent" in
   a message folder, the announcement dates in the control panel. Same
   weekday, same treatment as the Last post column; the cell is 144px
   wide on the message list and the full date wrapped onto two lines
   in every row. */
function tightenDateCells() {
    /* td.gen / td.genmed: "Joined:" in the control panel and on a
       profile puts its label in one cell and the date in the next, so
       the date cell's text starts with the weekday. A post's own date
       cell never does — it starts with "Posted:" or is the topic
       module's — and the anchor on the regex keeps them apart. */
    /* td.gensmall: "Posted: Friday, 24 Jul 2026" over a search result.
       Not on a topic page, where that cell is the post's own date and
       the topic module reads it, weekday and all, for the header. */
    const cells = document.querySelectorAll(
        '#wrapcentre td[data-rr-col="date"], #wrapcentre p.topicdetails, #wrapcentre td.gen, #wrapcentre td.genmed, #wrapcentre b.gen, #wrapcentre b.genmed'
        + (PAGE.isTopic ? "" : ", #wrapcentre td.gensmall"),
    );
    for (const cell of cells) {
        if (cell.hasAttribute("data-rr-date")) continue;
        // Read before the change, so the title can carry the whole date.
        // The weekday may follow a label — "Posted: Friday, …" on a
        // search result — so each text node is asked, not the cell.
        const full = cell.textContent.replace(/\s+/g, " ").trim();
        if (!dropWeekday(cell)) continue;
        cell.setAttribute("data-rr-date", "");
        if (!cell.hasAttribute("title")) cell.setAttribute("title", full);
    }
}

/* "Page 1 of 1" over a message folder or a subscriptions list: a page
   counter for one page, on pages with no action bar to fold it into.
   Nothing to navigate, nothing to say. Counters on other pages stay —
   beside them is the only "Go to page" strip those pages have. */
const LONE_PAGE_RE = /^\s*(?:Page\s+1\s+of\s+1|Страница\s+1\s+из\s+1)\s*$/;
const LEADING_LONE_PAGE_RE = /^\s*(?:Page\s+1\s+of\s+1|Страница\s+1\s+из\s+1)\s+/;

function dropLonePageCounters() {
    // td.gensmall and span.nav: the search results page prints its
    // counter in a span inside a floated div.
    for (const cell of document.querySelectorAll("#wrapcentre td.nav, #wrapcentre td.gensmall, #wrapcentre span.nav")) {
        if (cell.querySelector("a[href], form")) continue;
        const text = cell.textContent.replace(/\s+/g, " ");
        if (LONE_PAGE_RE.test(text)) { cell.style.display = "none"; continue; }

        /* "Page 1 of 1 [ Search found 1 match ]" — the counter shares
           its cell with a fact worth keeping. The counter is the run
           of nodes up to the second number; that run goes, the rest
           stays. */
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

/* A private message folder marks replied, marked, friend and foe
   messages with a 10px spacer gif floated in front of the subject.
   Invisible here — the board's colours never arrive — but still 10px
   and a space wide, so the subjects on the rows that had one started
   8px to the right of the others. The marker is drawn as a coloured
   square with its meaning on the title, and the rows without one get
   an empty one of the same size. */
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
        // The board writes "&nbsp; " after its marker; the rows without one
        // begin with whitespace the cell swallows, and a space here joins
        // it rather than adding to it.
        cell.prepend(el("span.rr-pm-mark", { "aria-hidden": "true" }), "\u00a0 ");
    }
}

/* "Advanced forumer Завсегдатай" in the member list's Rank column: the
   same bilingual rank a post's profile shows, on a page the post
   module never looks at. The Russian half went on to the title. */
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
 * Fold the Last post cell's two lines into one.
 *
 * The template prints the date in one <p> and the poster in another,
 * and that stack is the tallest thing in a listing row: it set the
 * height of all 108 rows on a page. Joined with a separator the same
 * two facts take one line, and the row loses a third of its height.
 *
 * Nodes are moved rather than rewritten, so the poster's link, its role
 * colour and the jump-to-post arrow all come across intact. If the pair
 * is too wide for the column it simply wraps back to two lines, which
 * is where it started.
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

/* "Global Announcements", "Announcements", "Topics": the template's own
   section rows, which head a run of topic rows and do nothing else.
   Each folds its run on a click now, and the fold is remembered by the
   section's name — fold the announcements once and every listing opens
   with them folded. The rows are still in the page (find-in-page, the
   filter, the sort and the keyboard cursor all still see them), only
   not drawn. The last section of a table is left as it is: a listing
   whose every topic can be folded away is a listing that reads as
   empty by accident. */
const FOLDED_SECTIONS_KEY = "foldedSections";

function foldedSections() {
    const kept = store.get(FOLDED_SECTIONS_KEY, null);
    return kept && typeof kept === "object" ? kept : {};
}

/* A listing's section row, in either of the two shapes the template
   uses: a td.cat with an h4 (search results, the index), or one
   spanning td.row3 holding a bold word and nothing else (a forum
   listing's "Global Announcements", "Announcements", "Stickies",
   "Topics"). The second is named here so the stylesheet can draw it
   as the section head it is rather than as a row. */
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
    // Every section row is named first, then the runs are read: a run
    // ends at the next section row, which has to be known as one by
    // then.
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

/* The left column of the control panel is a list of sections. The one
   you are in is bold with its pages under it; the others are links
   that open theirs. Nothing said so: each was a word on a row, and
   which words would unfold something was found by clicking. The
   closed ones carry a chevron pointing at what they open, the open one
   a chevron pointing down at its pages, and its pages step in under
   it. */
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

/* The table of sub-forums above a listing has the same "Forum" heading
   as the index and no name of its own; heading it "Subforums" is what
   keeps it from reading as a second, shorter, index above the topics. */
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

/* The shapes the stylesheet needs to know about, named once here.

   These were `:has()` selectors — `tr:has(> td.cat) > td`, `td.cat:has(
   select)`, `table:not(:has(table)):has(td[bgcolor] > a[onclick])` — and
   they cost the listing 240ms of style work: a `:has()` on a table or a
   row is re-checked every time anything inside changes, and this script
   changes six hundred cells on a listing. An attribute set once is
   free to match. */
function markShapes() {
    for (const cell of document.querySelectorAll("#wrapcentre td.cat")) {
        const row = cell.parentElement;
        // "controls" rides along onto the row too: the sort strip at
        // the foot of a listing is the last row of the same table the
        // results render in, and the phone stylesheet needs to pull it
        // away from that table's card on the row, not the cell — a
        // margin on the cell would sit inside the row's own padding.
        // A cell that matches the controls shape always has content (a
        // select, a table, a submit button), so kind starts as the
        // empty string for it every time — an "only override if kind
        // is already truthy" guard here would test a value that is
        // always falsy at this point and would never fire.
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

    // Tables that are lists of links rather than data — the control
    // panel's Options column, the message folders — and the
    // message-colour legend beside them. On a phone each row is a card
    // otherwise, and a menu of nine cards is a wall.
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

    // The permissions notice ("You can post new topics…") is the table
    // right after the one holding the jump-to form, with nothing between
    // them. Named here so the stylesheet can give it its gap without a
    // :has() on a table.
    const jump = document.querySelector('form[name="jumpbox"]');
    const jumpTable = jump && jump.closest("table");
    if (jumpTable && jumpTable.nextElementSibling && jumpTable.nextElementSibling.tagName === "TABLE") {
        jumpTable.nextElementSibling.setAttribute("data-rr-after-jump", "");
    }

    // A form row that is a checkbox or radio alone in its first cell,
    // with the words in the next.
    for (const input of document.querySelectorAll(
        '#wrapcentre td:first-child > input[type="checkbox"]:only-child, #wrapcentre td:first-child > input[type="radio"]:only-child')) {
        const row = input.closest("tr");
        if (!row) continue;
        row.setAttribute("data-rr-check-row", "");
        /* The words in the next cell are the control's label and the
           template never says so: clicking them did nothing, where on
           every other form it toggles the box. */
        const words = input.parentElement && input.parentElement.nextElementSibling;
        if (!words || words.querySelector("input, select, textarea, button")) continue;
        words.setAttribute("data-rr-check-label", "");
        words.addEventListener("click", (event) => {
            if (event.target instanceof Element && event.target.closest("a")) return;
            input.click();
        });
    }

    // The "Top" row under every post. The link back to the header is
    // already hidden (forum.css) — the floating button does that job
    // now — so a row whose first cell holds nothing else is a band of
    // empty space the width of the post, worse on a phone where the
    // row is padded like a card.
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
 * The member list, a message folder and Who is online are listings too
 * — rows of members or messages under a header row — and got none of a
 * listing's treatment: no zebra, numbers left ragged, the header as the
 * template set it. A post table wears the same row1/row2 classes and is
 * not a listing, so the shape is checked rather than the class: a
 * header row, three or more rows opening with a row cell, a member or
 * message link somewhere, and nothing that belongs to a post or a form.
 */
function isRoster(table) {
    if (PAGE.isTopic || profileView()) return false;
    if (!table.querySelector("th")) return false;
    if (table.querySelector(".postbody, textarea, table")) return false;
    /* The row class sits on the cells in a message folder and on Who is
       online, and on the <tr> itself in the member list. Either counts. */
    const striped = (node) => Boolean(node) && /(^|\s)row[12](\s|$)/.test(node.className || "");
    const rows = Array.from(table.querySelectorAll(":scope > tbody > tr"))
        .filter((row) => striped(row) || striped(row.firstElementChild));
    if (rows.length < 3) return false;
    return Boolean(table.querySelector('a[href*="mode=viewprofile"], .topictitle a'));
}

/**
 * The whole title cell opens the topic. The row lights up on hover
 * from edge to edge and three quarters of the title cell were dead
 * space under that light: a promise the row did not keep. A click on a
 * link, a control or a text selection is left alone; Ctrl or ⌘ opens
 * in a new tab the way it does on a link.
 */
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
 * A profile prints every field the template knows — ICQ, AIM, Yahoo,
 * MSN, Jabber, Occupation, Interests — with nothing after the colon on
 * nearly every account. A row whose label ends in a colon and whose
 * value cell holds no text, link or image is a row about nothing, and
 * goes. Judged by shape, not by name, so a filled-in field of any
 * name stays.
 */
/* PAGE.isProfile is true of all of memberlist.php — the roster as well
   as one member's page. This is the one member's page. */
function profileView() {
    return PAGE.isProfile && /mode=viewprofile/.test(location.search);
}

function hideEmptyProfileRows() {
    for (const row of document.querySelectorAll("#wrapcentre table.tablebg tr")) {
        const cells = Array.from(row.children).filter((node) => node.tagName === "TD");
        if (cells.length !== 2) continue;
        // The outer table's two columns — "PM: [button]" beside
        // "Groups: [select]" — read as a label and a value too; they are
        // two forms side by side, and the phone stacks those.
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

/* The template's page links as a row of small chips, the words kept
   as a label, the current page marked, the " ... " between two runs
   of pages kept as a quiet mark. Two shapes come through here: the
   "[ Go to page: 1 … 41, 42, 43 ]" under a long topic's title, bare
   text around the links, and the "Go to page 1, 2, 3 … 615  Next"
   strip a listing ends with, where the words are themselves a link
   that asks for a page number. */
function chipPager(holder) {
    if (holder.hasAttribute("data-rr-minipager")) return;
    if (!holder.querySelector("a[href]") || !/(Go to page|На страницу)/.test(holder.textContent)) return;
    const russian = /На страницу/.test(holder.textContent);
    // The links, the bold current page and the gaps, in reading order,
    // gathered before anything moves: a node's neighbours change once
    // it has.
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
    /* "[ Go to page: 1 … 263, 264, 265 ]" under a subscribed topic or a
       bookmark: the same shape as the one under a listing title, in a
       cell this script does not label. Matched by its words instead. */
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

/* A data table whose header says five columns and whose rows draw four.

   The board hides a cell outright — `style="display: none"` in the
   markup it sends — where a member has no e-mail address on the Team
   page. In a real table that does not blank the column, it removes it:
   every cell after it slides one column left and the row stops lining
   up with its own header. The cell is put back, empty, wherever the
   row and the header still agree on how many cells there are.

   Only the board's own inline hiding is undone, and only before this
   script hides anything of its own. */
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

/* A roster's header sits over cells the template centres. Left over a
   centred column, a header names nothing in particular. */
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

/* The template pads a roster's e-mail and website cells with &nbsp;
   whether or not the member has one; on a phone each of those became
   an empty dark chip in the card. */
function markEmptyCells(table) {
    for (const cell of table.querySelectorAll(":scope > tbody > tr > td")) {
        if (cell.textContent.replace(/[\s\u00a0]+/g, "")) continue;
        if (cell.querySelector("a, img, input, button, select, svg")) continue;
        cell.setAttribute("data-rr-empty", "");
    }
}

/* A cell that is a row of links and the punctuation between them.

   The template writes "Previous PM in history | Next PM in history |
   Previous PM | Next PM", "[ Add friend | Add foe ]" and "Mark all ::
   Unmark all" as bare text around the links. Read out, that punctuation
   is noise; on the page it is a row of pipes at four different heights.
   The links become a row with a gap, which is what the pipes were for. */
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

/* An image the board points at nothing — the avatar box of a member
   who has none — draws as the browser's broken-image mark. Only the
   board's own furniture is dropped; a picture inside a post is the
   poster's, and a hole where it was is the honest thing to show. */
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

/* phpBB offers no way to reorder the hundred rows it has already sent.
   The headings of a listing become controls that do — in this browser,
   on the rows that are here: nothing is fetched and nothing is sent.

   Rows are sorted inside each run of them, and the template's own
   section rows ("Global Announcements", "Announcements") end a run, so
   a pinned announcement never lands in the middle of the topics. */
const SORT_KIND = {
    replies: "number", views: "number", topics: "number", posts: "number", num: "number",
    date: "date", last: "date",
    title: "text", author: "text", rank: "text",
};

const SORT_MONTHS = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/* "02 Sep 2026, 09:49", which is what the board writes and what this
   script leaves after the weekday goes. A row that says "4 minutes
   ago" carries the whole date on its title, put there when it was
   shortened; a row that says "Today" is today. */
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

/* Which shade each row is drawn in.

   subsilver2 hands out row1 and row2 by hand and alternates them
   *across the columns* of one row: a topic row comes out as six
   vertical bands, and every row of the index is split in two at the
   counts. Banding is meant to carry the eye from a title across to its
   last post, and drawn that way it cuts the line up instead.

   So the shade is written on the row, in an attribute of this
   script's own — the board's classes are left exactly as they are,
   since they carry nothing but the shade and another script may be
   reading them — and a sort simply writes it again. */
function restripe(rows) {
    rows.forEach((row, index) => row.setAttribute("data-rr-stripe", index % 2 ? "b" : "a"));
}

/**
 * The data rows of a listing, in the runs the template separates with
 * its own section rows ("Global Announcements", "Topics").
 *
 * A run is what a sort reorders inside, so a pinned announcement never
 * lands among the topics, and it is what the stripe runs down.
 */
function listingRuns(table) {
    const head = table.querySelector(":scope > tbody > tr[data-rr-head]");
    if (!head || !head.querySelector("th")) return [];
    /* Columns, not cells: a listing spans its first heading over the
       unread marker and the title, so five headings sit over six
       cells. */
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
    /* Where the run ends, read once. Read again after a sort it would
       be whichever row had moved to the end, and putting the rows back
       in the board's order would scatter them through their own run. */
    const anchors = sortable.map((rows) => rows[rows.length - 1].nextSibling);
    /* The "#" column is the board's own count down the page, not a
       property of the row: reordered rows keep the numbers where they
       were rather than carrying them along. */
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

/* One checkbox a row, no way to take them all and no way to take a run
   of them: deleting a dozen old messages was a dozen clicks. A control
   in the heading takes the page, and shift-click takes a range, the
   way every mail client has since 1996. */
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

/* The forum-rules box.

   subsilver2 writes it as a table of one `td.row3` above everything
   else on a forum, a topic and the posting form, and this board fills
   it for members only — which is why it is easy to miss. Two things
   are wrong with it left alone.

   The template types `style="margin-bottom: 2px"` into the tag, and an
   inline style beats every rule in this stylesheet without a fight, so
   the box sat 2px above the topic title: two blocks with nothing to do
   with each other, touching. And the cell keeps the styling of a
   listing row — a row's inset, a hairline drawn along the bottom of a
   card that has no second row, the same ground as everything else —
   so the one block on the page that is a notice read as a slab of
   text with no edges and no heading.

   Tagged here; the stylesheet dresses it as the notice it is.  */
function markForumRules() {
    for (const cell of document.querySelectorAll("#wrapcentre td.row3")) {
        const box = cell.closest("table.tablebg");
        if (!box || box.hasAttribute("data-rr-rules")) continue;
        // One cell in the whole table, holding a heading or the link
        // that stands in for one. A listing's own section rows are
        // td.row3 too — "Global Announcements", "Topics" — and those
        // sit in a table of a hundred cells.
        if (box.querySelectorAll("td, th").length !== 1) continue;
        if (!cell.querySelector("h4, p.rules, .postbody")) continue;
        box.setAttribute("data-rr-rules", "");
        if (box.style.marginBottom) box.style.marginBottom = "";
    }
}

function initLists() {
    markShapes();
    markForumRules();
    groupSortControls();
    for (const table of document.querySelectorAll("table.tablebg")) {
        restoreGridCells(table);
        labelColumns(table);
        // A listing, as opposed to a post or a strip of chrome. The
        // stylesheet needs to know which is which: row1/row2 alternate
        // down a listing and wrap whole posts in a topic, so the same
        // two classes mean opposite things on the two kinds of page.
        const roster = isRoster(table);
        if (table.querySelector("a.topictitle, a.forumlink") || roster) {
            table.setAttribute("data-rr-list", "");
            groupListingNumbers(table);
        }
        // A roster of members — the member list, Who is online — as
        // opposed to a folder of messages: the phone lays its cards out
        // name first, and drops the cells the template left empty.
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
    // The icon legend under a listing: the index names its table
    // "legend", a listing's has no class at all. The dot cells and the
    // spacer between pairs are named, so the phone can lay each dot
    // beside its words and break the line on the spacer.
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

    /* A private message draws its signature divider as a run of
       underscores in the body, with no signature node for the topic
       pass to find. Posts are left alone: there the divider is already
       a rule, and a run of underscores inside a message is the poster's
       own drawing. */
    if (!PAGE.isTopic) {
        for (const body of document.querySelectorAll("#wrapcentre .postbody")) replaceUnderscoreRules(body);
    }

    /* Before the page-kind gate: the member list, the message folders
       and the control panel are none of those kinds and were getting
       none of this. */
    tightenDateCells();
    localiseRankCells();
    dropLonePageCounters();
    alignMessageMarkers();

    if (!PAGE.isForum && !PAGE.isIndex && !PAGE.isSearch) return;

    // Before the topic rows are looked for, not after. The index has no
    // topic rows at all — it lists forums — so everything below the
    // early return never ran there, and the Last post column read on
    // one line in a forum listing and on two on the page in front of
    // it. It is the same column.
    for (const cell of document.querySelectorAll('td[data-rr-col="last"]')) tightenLastPost(cell);

    const entries = topicRows();
    if (!entries.length) return;

    if (PAGE.isForum || PAGE.isSearch) buildForumBar();

    const visited = settings.get("hideVisited") ? visitedSet() : null;
    const seenPrefixes = new Map();
    const unreadRouting = settings.get("unreadFromList") && !PAGE.isSearch && isLoggedIn();

    // A prefix in a title is a button that drives the filter chips. On
    // a page with no chips there is nothing for it to drive, so it is
    // drawn as a label instead of a control that does nothing.
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

        // The action bar and the filter bar carry one job between them
        // and sat as two separate cards with a gap, one above the other:
        // 123px of chrome before the first topic on the page. The filter
        // becomes the action bar's second row instead. They are not
        // siblings in the template, so this cannot be done in CSS.
        //
        // A bar with nothing in it is not placed at all: on a short
        // listing with no board search box there is no filter left to
        // draw, and an empty card is worse than no card.
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

/* The sort strip's controls are flat siblings — a label, the select
   it names, sometimes a second select, then the next label — with
   nothing but a space between one and the next. Wrapped at the
   browser's own discretion that space is a break point like any
   other, and a narrow phone card broke "Sort by:" onto one line and
   the select that names it onto the next. Each label and the
   controls up to the next label (or the row's own submit) become one
   span, so a wrap can only fall between one pair and the next, never
   inside one. Runs on both shapes this cell comes in: the search
   results page holds the label and its selects directly, a topic's
   holds them one level down in the sort form beside the search box —
   a descendant selector reaches either. */
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
            // The &nbsp; and bare spaces the template used to hold
            // these apart: the group's own gap replaces them, and left
            // in they would sit alongside it as an empty flex item.
            if (node.nodeType === 3 && !node.textContent.trim()) { node.remove(); continue; }
            group.append(node);
        }
    }
}

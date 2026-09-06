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
    const state = { text: "", tag: null };

    const count = el("span.rr-toolbar__count");

    const apply = () => {
        let shown = 0;
        for (const entry of entries) {
            const matchesText = matchesWords(entry.title, state.text);
            const matchesTag = !state.tag || entry.row.getAttribute("data-rr-prefix") === state.tag;
            const visible = matchesText && matchesTag;
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
        if (prefixes.length > 1) bar.append(tagRow);
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
    return { bar, setTag, empty: !bar.children.length };
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

    // "[ 61469 topics ]" is worth keeping, but not on its own line.
    for (const cell of document.querySelectorAll("#wrapcentre td.gensmall, #wrapcentre span.gensmall")) {
        const match = cell.textContent.match(/\[\s*([\d\s]+)\s*(topics|posts)\s*\]/i);
        if (!match) continue;
        bar.append(el("span.rr-topicbar__count", {}, [match[1].trim() + " " + match[2].toLowerCase()]));
        cell.style.display = "none";
        break;
    }

    heading.after(bar);
    // The board's own "Page 1 of 615" and "[ 61469 topics ]" strips,
    // which the bar now carries. The topic page had this pass and the
    // listing did not, and the sweep found the band on every forum.
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

/* ---- Announcements ------------------------------------------------ */

function collapseAnnouncements(entries) {
    const pinned = entries.filter((entry) => entry.row.getAttribute("data-rr-prefix") === "important");
    if (pinned.length < 3) return;

    let open = false;
    const toggle = el("button.rr-btn", { type: "button", "data-variant": "quiet" }, [
        icon("chevronD"),
        t("{n} pinned announcements", { n: pinned.length }),
    ]);
    const setState = () => {
        for (const entry of pinned) entry.row.style.display = open ? "" : "none";
        toggle.firstChild.style.transform = open ? "rotate(180deg)" : "";
    };
    toggle.addEventListener("click", () => { open = !open; setState(); });
    setState();

    const firstRow = pinned[0].row;
    const holder = el("tr", {}, [
        el("td", { colspan: String(firstRow.children.length), style: { padding: "6px 12px" } }, [toggle]),
    ]);
    firstRow.before(holder);
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
        const label = cells[0].textContent.replace(/\s+/g, " ").trim();
        if (!/:$/.test(label)) continue;
        const value = cells[1];
        if (value.querySelector("a, img, input, select, button, textarea")) continue;
        if (value.textContent.replace(/[\s\u00a0]+/g, "")) continue;
        row.hidden = true;
        row.setAttribute("data-rr-empty-row", "");
    }
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

function initLists() {
    markShapes();
    groupSortControls();
    for (const table of document.querySelectorAll("table.tablebg")) {
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
            markEmptyCells(table);
        }
    }
    if (settings.get("rowClick")) initRowClick();
    if (profileView()) hideEmptyProfileRows();

    dedupeSearchBoxes();

    /* Before the page-kind gate: the member list, the message folders
       and the control panel are none of those kinds and were getting
       none of this. */
    if (settings.get("tightRows")) tightenDateCells();
    localiseRankCells();
    dropLonePageCounters();
    alignMessageMarkers();

    if (!PAGE.isForum && !PAGE.isIndex && !PAGE.isSearch) return;

    // Before the topic rows are looked for, not after. The index has no
    // topic rows at all — it lists forums — so everything below the
    // early return never ran there, and the Last post column read on
    // one line in a forum listing and on two on the page in front of
    // it. It is the same column.
    if (settings.get("tightRows")) {
        for (const cell of document.querySelectorAll('td[data-rr-col="last"]')) tightenLastPost(cell);
    }

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

    if (settings.get("hideAnnouncements")) collapseAnnouncements(entries);
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
        '#wrapcentre td.cat[data-rr-cat="controls"] span.gensmall',
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

/* ------------------------------------------------------------------
   Reading the page.

   Everything that knows about phpBB markup lives here, so when the
   forum template changes there is one file to fix rather than ten.

   Structure this relies on (subsilver2 / rinDark, verified against the
   live board):
     - one <table class="tablebg"> per post
     - post anchor  a[name="p123456"]
     - author       b.postauthor
     - body         div.postbody   (a second one is the signature,
                                    it starts with the ____ rule)
     - topic rows   a.topictitle inside td.row1
   ------------------------------------------------------------------ */

const PAGE = (() => {
    const path = location.pathname.split("/").pop() || "index.php";
    const params = new URLSearchParams(location.search);
    const num = (key) => {
        const value = parseInt(params.get(key) || "", 10);
        return Number.isFinite(value) ? value : null;
    };
    return {
        file: path,
        isIndex: path === "index.php" || path === "",
        isForum: path === "viewforum.php",
        isTopic: path === "viewtopic.php",
        isSearch: path === "search.php",
        isPosting: path === "posting.php",
        isUCP: path === "ucp.php",
        isProfile: path === "memberlist.php",
        forumId: num("f"),
        topicId: num("t"),
        postId: num("p"),
        start: num("start") || 0,
        params,
    };
})();

/** phpBB hides links behind a placeholder for guests; several features
    only make sense once the reader is logged in. */
function isLoggedIn() {
    return Boolean(document.querySelector('a[href*="mode=logout"]'));
}

/** Unread private messages, read off the UCP link phpBB renders. */
function unreadMessages() {
    const link = Array.from(document.querySelectorAll('a[href*="ucp.php"]'))
        .find((a) => /new message/i.test(a.textContent));
    if (!link) return 0;
    const match = link.textContent.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

/* ---- Topic rows -------------------------------------------------- */

/**
 * Every topic row in a forum listing, with the pieces the list module
 * needs. Rows the template uses for spacing are skipped.
 */
function topicRows() {
    return Array.from(document.querySelectorAll("a.topictitle"))
        .map((link) => {
            const cell = link.closest("td");
            const row = link.closest("tr");
            if (!cell || !row) return null;
            const href = link.getAttribute("href") || "";
            const idMatch = href.match(/[?&]t=(\d+)/);
            return {
                row,
                cell,
                link,
                id: idMatch ? idMatch[1] : null,
                title: link.textContent.trim(),
            };
        })
        .filter(Boolean);
}

/** Forum rows on the index page. */
function forumRows() {
    return Array.from(document.querySelectorAll("a.forumlink"))
        .map((link) => {
            const row = link.closest("tr");
            const href = link.getAttribute("href") || "";
            const match = href.match(/[?&]f=(\d+)/);
            return row && match ? { row, link, id: match[1], title: link.textContent.trim() } : null;
        })
        .filter(Boolean);
}

/* ---- Posts ------------------------------------------------------- */

/**
 * Posts on the current topic page, in document order.
 * Returns { table, id, anchor, author, head, headCell, body, signature }.
 *
 * `root` is the document to read, which is this one unless something
 * has fetched another page of the same topic and wants the posts out
 * of it — see releases.js. Nothing in here touches the document it is
 * given, so a detached parse is as valid a subject as the live page.
 *
 * `head` is read back off the page rather than only set when topic.js
 * builds it: every caller runs its own posts() pass, and one running
 * afterwards would otherwise fall through to the template's header
 * row, which the modern layout hides. That is how the "hide posts by
 * someone" control ended up on a row nobody could see.
 */
function posts(root = document) {
    const out = [];
    for (const anchor of root.querySelectorAll('a[name^="p"]')) {
        const id = (anchor.getAttribute("name") || "").slice(1);
        if (!/^\d+$/.test(id)) continue;
        const table = anchor.closest("table.tablebg");
        if (!table) continue;
        const bodies = Array.from(table.querySelectorAll("div.postbody"));
        if (!bodies.length) continue;
        // A trailing postbody that opens with the ____ rule is the
        // signature, not part of the message.
        let signature = null;
        if (bodies.length > 1) {
            const last = bodies[bodies.length - 1];
            if (/^\s*_{5,}/.test(last.textContent)) signature = last;
        }
        out.push({
            table,
            id,
            anchor,
            author: table.querySelector("b.postauthor"),
            head: table.querySelector(".rr-posthead"),
            headCell: anchor.closest("td")?.parentElement?.querySelector("td.gensmall") || null,
            body: bodies[0],
            signature,
        });
    }
    return out;
}

/* ---- Steam metadata ---------------------------------------------- */

const STEAM_APP_RE = /(?:store_item_assets\/steam|steam(?:community)?cdn[^/]*)?\/apps?\/(\d{3,8})\//i;

/**
 * Pull the game details out of a first post written with the forum's
 * SteamInfo BBCode generator.
 *
 * The AppID is taken from the header image URL rather than the store
 * link, because the store link is replaced by a placeholder for guests
 * while the image URL stays intact.
 */
function parseGameInfo(body) {
    if (!body) return null;

    const info = { appId: null, header: null, fields: {}, title: null };

    for (const img of body.querySelectorAll("img")) {
        const src = img.getAttribute("src") || "";
        const match = src.match(STEAM_APP_RE) || src.match(/\/apps\/(\d{3,8})\//);
        if (match && /header|capsule|library/i.test(src)) {
            info.appId = match[1];
            info.header = src;
            break;
        }
    }
    if (!info.appId) {
        const storeLink = body.querySelector('a[href*="store.steampowered.com/app/"]');
        const match = storeLink && storeLink.getAttribute("href").match(/\/app\/(\d{3,8})/);
        if (match) info.appId = match[1];
    }

    // The generator emits "<b>Label:</b> value" pairs on one line each.
    const wanted = /^(Store Page|Genre\(s\)|Developer|Publisher|Release Date|Language\(s\)|Operating system\(s\)|Version|Steam AppID)\s*:?$/i;
    for (const node of body.querySelectorAll('span[style*="bold"], b, strong')) {
        const label = node.textContent.replace(/:\s*$/, "").trim();
        if (!wanted.test(label)) continue;
        const parts = [];
        let cursor = node.nextSibling;
        while (cursor && !(cursor.nodeType === 1 && cursor.tagName === "BR")) {
            parts.push(cursor.textContent || "");
            cursor = cursor.nextSibling;
        }
        const value = parts.join(" ").replace(/\s+/g, " ").trim();
        if (value) info.fields[label] = value;
    }

    const heading = body.querySelector('span[style*="150%"], span[style*="130%"]');
    if (heading) info.title = heading.textContent.trim();

    return info.appId || Object.keys(info.fields).length ? info : null;
}

/**
 * Where the Steam boilerplate starts in a first post, so it can be
 * folded away. Returns the node to fold from, or null.
 */
function steamBlurbStart(body) {
    for (const node of body.querySelectorAll('span[style*="bold"], b, strong')) {
        if (/^(About The Game|System Requirements|Screenshots)$/i.test(node.textContent.trim())) {
            return node.closest("span[style]") || node;
        }
    }
    return null;
}

/* ---- Topic prefixes ---------------------------------------------- */

const PREFIX_KINDS = {
    info: "info",
    release: "release",
    releases: "release",
    problem: "problem",
    problems: "problem",
    important: "important",
    tutorial: "tutorial",
    guide: "tutorial",
    request: "request",
    requests: "request",
    scs: "scs",
    poll: "neutral",
    news: "neutral",
    discussion: "neutral",
};

/**
 * Take the first `count` characters off an element, node by node.
 *
 * The alternative is `link.textContent = rest`, which is one line and
 * throws away every child the link had. On this board that happens to
 * be safe — 330 titles across four boards carry exactly one thing
 * inside them, the coloured spans the template wraps the prefix in,
 * and those are the characters being removed anyway. It is safe by
 * coincidence rather than by construction, and the day somebody's
 * title carries an image or a link, one line would silently eat it.
 *
 * This removes the prefix and nothing else.
 */
function stripLeading(node, count) {
    let left = count;
    for (const child of Array.from(node.childNodes)) {
        if (left <= 0) break;
        const text = child.textContent || "";
        if (text.length <= left) { left -= text.length; child.remove(); continue; }
        if (child.nodeType === 3) { child.textContent = text.slice(left); }
        else { stripLeading(child, left); }
        left = 0;
    }
}

/**
 * Split "[Info] Dragon's Dogma 2" into its prefix and the real
 * title. Topics often carry two, as in "[Release] [Userscript] ...",
 * so every leading bracket group is taken.
 */
function splitPrefix(title) {
    const prefixes = [];
    let rest = title.trim();

    while (prefixes.length < 3) {
        const match = rest.match(/^\[\s*([^\]]{1,20})\s*\]\s*(.*)$/s);
        if (!match) break;
        prefixes.push(match[1].trim());
        rest = match[2].trim();
    }

    if (!prefixes.length) return { prefix: null, prefixes: [], kind: null, rest };

    // The first recognised prefix decides the colour; an unknown one
    // stays neutral rather than borrowing a meaning it does not have.
    const kind = prefixes
        .map((name) => PREFIX_KINDS[name.toLowerCase()])
        .find(Boolean) || "neutral";

    return { prefix: prefixes[0], prefixes, kind, rest };
}

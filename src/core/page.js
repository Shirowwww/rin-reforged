/* Every phpBB/subsilver2 selector this script relies on lives in this
   file — the one place to fix if the forum template changes:
     - post table    table.tablebg (one per post)
     - post anchor   a[name="p123456"]
     - author        b.postauthor
     - body          div.postbody (a second one is the signature,
                                   starting with the ____ rule)
     - topic rows    a.topictitle inside td.row1
     - forum rows    a.forumlink */

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

/** phpBB replaces the logout link with a placeholder for guests. */
function isLoggedIn() {
    return Boolean(document.querySelector('a[href*="mode=logout"]'));
}

function unreadMessages() {
    const link = Array.from(document.querySelectorAll('a[href*="ucp.php"]'))
        .find((a) => /new message/i.test(a.textContent));
    if (!link) return 0;
    const match = link.textContent.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

// Skips template spacer rows via the final filter(Boolean).
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

/**
 * Posts in document order: { table, id, anchor, author, head, headCell,
 * body, signature }. `root` defaults to this document but releases.js
 * passes a detached page fetched separately — nothing here mutates it.
 * `head` is read back live rather than cached, since topic.js may not
 * have built it yet for a given caller; skipping that once put a
 * "hide posts by" control on a row the modern layout hides.
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
        // A trailing postbody starting with the ____ rule is the signature.
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

const STEAM_APP_RE = /(?:store_item_assets\/steam|steam(?:community)?cdn[^/]*)?\/apps?\/(\d{3,8})\//i;

// Reads the AppID from the header image, not the store link: the store
// link is replaced by a guest placeholder but the image URL stays intact.
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

    // The SteamInfo BBCode generator emits "<b>Label:</b> value" per line.
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

// Node to fold the Steam boilerplate from, or null.
function steamBlurbStart(body) {
    for (const node of body.querySelectorAll('span[style*="bold"], b, strong')) {
        if (/^(About The Game|System Requirements|Screenshots)$/i.test(node.textContent.trim())) {
            return node.closest("span[style]") || node;
        }
    }
    return null;
}

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

// Removes the first `count` characters node by node, preserving any
// child elements — unlike `link.textContent = rest`, which would
// silently eat an image or link if a title ever carried one.
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

// Splits "[Info] Dragon's Dogma 2" into prefixes and title; topics often
// stack two, as in "[Release] [Userscript] ...".
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

    // First recognised prefix decides the colour; unknown stays neutral.
    const kind = prefixes
        .map((name) => PREFIX_KINDS[name.toLowerCase()])
        .find(Boolean) || "neutral";

    return { prefix: prefixes[0], prefixes, kind, rest };
}

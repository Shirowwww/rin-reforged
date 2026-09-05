/* ------------------------------------------------------------------
   Reading a post as a release.

   The single hardest thing to do on this board is answer "where is the
   current version". A game thread runs to hundreds of posts, releases
   and reuploads are ordinary replies, and the search box returns whole
   posts rather than the line you wanted.

   This is the half that reads: what a post carries, what it says on
   its own, and how much of that adds up to a release rather than a
   reply about one. releases.js is the half that shows it — one panel,
   this page or the whole topic.

   Nothing here fetches anything. It reads the page that is already
   loaded and guesses at nothing beyond what a post says.
   ------------------------------------------------------------------ */

const RELEASE_WORDS = [
    "clean steam files", "steam files", "reupload", "re-upload",
    "update", "updated", "patch", "hotfix", "repack", "crack",
    "build", "denuvo", "dlc unlocker", "goldberg", "emulator",
    // A hypervisor crack is a release of its own kind on this board,
    // with its own how-to threads and its own requirements.
    "hypervisor", "title update",
];

/* Three ways a post names which one it is, and they are not the same
   thing.
 *
 * The first is a version with a v on it: v1.4.2, ver. 2.0, version
 * 1.10.
 *
 * The second is a Steam build id, which is eight digits and beats
 * every real version it is compared against — kept apart so nothing
 * downstream has to guess which it is holding.
 *
 * The third is the one this board actually uses for the games it cares
 * most about, and it has no v anywhere in it. Ubisoft ships **Title
 * Updates**, and the release posts say so in the publisher's words:
 * "Game version is Title Update 1.0.7",
 * "Assassins.Creed.Black.Flag.Resynced.Title.Update.1.0.4.zip",
 * "to make space for Title Update 1.0.5". Read by a pattern that
 * required a v, all thirty-three pages of that topic had no version in
 * them at all. The number after the label is the game's version — the
 * post says as much — so that is what it is read as, and it compares
 * with every other version the same way.
 *
 * The label has to be followed by a *dotted* number, so "update 2 of
 * 3" and "patch to 4 files" are not versions. */
/* What may follow the digits.

   A single letter — 1.4.2b is a version — but only one, and only where
   it is not the first letter of a word: "1.0.7Learn" is 1.0.7 with a
   sentence welded to it, not version 1.0.7L. And nothing that is
   itself a digit, so a partial match cannot be mistaken for the whole.

   This was a plain `\b`, which cannot tell those apart: against
   "1.0.7Learn" it refused the match and backtracked to "1.0". */
const VERSION_SUFFIX = "(?:[a-z](?![a-z]))?(?!\\d)";

const VERSION_RE = new RegExp([
    "\\b(?:v(?:er(?:sion)?)?\\.?\\s?)(\\d+(?:\\.\\d+){1,3}" + VERSION_SUFFIX + ")",
    "\\bbuild\\s+(\\d{5,9})\\b",
    "\\b(?:title[\\s.]+update|update|patch|tu)d?[\\s.]+(?:to[\\s.]+)?v?(\\d+(?:\\.\\d+){1,3}" + VERSION_SUFFIX + ")",
    /* A bare three-part number: "Deluxe Edition 1.2.3 GOG". Nothing but
       a version is written that way — a date has a year in front, an IP
       has four parts, a price has two — and release titles on this
       board carry one without a v more often than with. Two parts alone
       is left to the labelled forms: 2.5 is also a price and a score. */
    "(?<![\\w.])(\\d{1,4}\\.\\d{1,3}\\.\\d{1,4}" + VERSION_SUFFIX + ")(?![\\w.])",
].join("|"), "i");

/* A date is not a version.

   Off the live board: "Assassins.Creed.Black.Flag.Resynced.v1.0-v1.0.x
   .Plus.30. Trainer.Updated.2026.09.02 -FLiNG". The pattern that reads
   "Updated 1.0.5" as a version reads "Updated.2026.09.02" the same
   way, and 2026.09.02 beats every real version this board will ever
   see — so one trainer post stamped with the day it was built would
   have announced the game as being on 2026.

   The shape is checked rather than the digits: a first part in a
   plausible year, a second that could be a month, and a third, if
   there is one, that could be a day. Software that genuinely versions
   by year — 2024.1.5 — is refused along with it, and that is the right
   trade on a board where every game version is 1.x or 2.x.

   The number is still shown if the post carries nothing else; this
   only stops it being read as a version to compare. */
function looksLikeDate(version) {
    const parts = version.split(".").map((part) => parseInt(part, 10));
    if (parts.length < 2 || parts.length > 3) return false;
    const year = (n) => n >= 1990 && n <= 2099;
    const month = (n) => n >= 1 && n <= 12;
    const day = (n) => n >= 1 && n <= 31;
    // 2026.09.02, and 2026.09
    if (year(parts[0]) && month(parts[1]) && (parts.length === 2 || day(parts[2]))) return true;
    // 12.09.2026 — the other way round, which is how half this board
    // writes a date and which the bare three-part form let straight
    // through as version twelve.
    return parts.length === 3 && day(parts[0]) && month(parts[1]) && year(parts[2]);
}

/**
 * Every version-shaped thing a post says, in the order it says them.
 *
 * Reading only the first match was enough while anything matching was
 * a version. It stopped being enough once a date could match: the
 * first match had to be *taken*, so a post whose opening line was a
 * build date had no version at all rather than the one three lines
 * further down.
 */
const VERSION_RE_ALL = new RegExp(VERSION_RE.source, "gi");

function versionsIn(text) {
    const all = VERSION_RE_ALL;
    all.lastIndex = 0;
    const found = { version: null, build: null, named: false };
    let match;
    while ((match = all.exec(text)) !== null) {
        if (match[2]) {
            if (!found.build) found.build = match[2];
            continue;
        }
        const number = match[1] || match[3] || match[4];
        if (!number || looksLikeDate(number)) continue;
        /* Whether the post *called* it a version — a v in front, or
           "Title Update" / "updated to" leading in — or whether it is
           a bare three-part number read off the prose. Both go on the
           row. Only the first is evidence about the game: "Updated
           ACBlackFlagFix to 2.8.3!" is a mod's changelog, and off the
           live board 2.8.3 beat 1.0.7 to the headline the moment bare
           numbers started to count. */
        if (!found.version) {
            found.version = number;
            found.named = Boolean(match[1] || match[3]);
        }
    }
    /* "Updated from 1.0.5 to 1.0.7": the first version in the post is
       the one it left behind. Only this wording moves the answer — a
       later "v2.8.3" on its own is still a mod's changelog. */
    const step = FROM_TO_RE.exec(text);
    if (step && !looksLikeDate(step[2]) && compareVersions(step[2], step[1]) > 0) {
        found.version = step[2];
        found.named = true;
    }
    return found;
}

const FROM_TO_RE = /\bfrom\s+v?\.?\s?(\d+(?:\.\d+){1,3}[a-z]?)\s+to\s+v?\.?\s?(\d+(?:\.\d+){1,3}[a-z]?)\b/i;

/** Numeric, part by part: 1.0.10 is newer than 1.0.9. */
function compareVersions(a, b) {
    const left = String(a).split(/[.\-_]/).map((part) => parseInt(part, 10) || 0);
    const right = String(b).split(/[.\-_]/).map((part) => parseInt(part, 10) || 0);
    const length = Math.max(left.length, right.length);
    for (let index = 0; index < length; index += 1) {
        const diff = (left[index] || 0) - (right[index] || 0);
        if (diff) return diff;
    }
    return 0;
}

/** Hosts that are the forum itself rather than somewhere to download. */
function isOffsite(href) {
    try {
        const host = new URL(href, location.href).hostname;
        return host !== location.hostname && !host.endsWith(".rin.ru");
    } catch {
        return false;
    }
}

/**
 * What a post says on its own, with everything it quotes removed.
 *
 * The board renders a quote as div.quotetitle + div.quotecontent inside
 * the postbody, so reading the postbody whole means reading every
 * earlier post anyone replied to. A "thanks, the link is dead" reply
 * that quotes a release then carries that release's version number, its
 * release words and its [[Please login to see this link.]] markers, and
 * scores exactly like the release itself — which is why one upload used
 * to appear once for the post that made it and again for every reply
 * quoting it.
 *
 * Scoring a post on its own words is what stops that. The clone is
 * detached, so nothing the reader sees is touched.
 */
function ownContent(body) {
    const copy = body.cloneNode(true);
    for (const quote of copy.querySelectorAll(".quotecontent, .quotetitle, blockquote, cite")) {
        quote.remove();
    }
    spaceOutLines(copy);
    return copy;
}

/* A <br> contributes no text.

   The board writes a release post as one line per fact separated by
   <br>, so `textContent` returns them welded together: "Game version
   is Title Update 1.0.7Learn more here on HV releases". Two things go
   wrong at every one of those seams, and both were live on the board.

   The version comes back short. `1.0.7` followed immediately by a
   letter has no word boundary after it, so the pattern backtracks to
   the longest ending that does have one — `1.0` — and the panel
   reported a game on 1.0 that was on 1.0.7.

   And release words stop matching. `\bupdate\b` needs a boundary in
   front of it, and there is none in the middle of "filesUpdate", so a
   post offering clean Steam files and an update came back as neither.

   One space per line break fixes both, on the detached copy only.
   Block elements get one at each end for the same reason. */
const LINE_BREAKS = "br, p, div, li, tr, h1, h2, h3, h4, blockquote, pre";

function spaceOutLines(copy) {
    for (const node of copy.querySelectorAll(LINE_BREAKS)) {
        node.before(document.createTextNode(" "));
        node.after(document.createTextNode(" "));
    }
}

/**
 * What a post looks like at a glance: how many off-site links it
 * carries, whether it names a version, and which release words it uses.
 */
function describePost(post) {
    const own = ownContent(post.body);
    const text = own.textContent;
    const lower = text.toLowerCase();

    const links = Array.from(own.querySelectorAll("a[href]"))
        .filter((a) => isOffsite(a.getAttribute("href")));

    // Guests see "[[Please login to see this link.]]" instead of an
    // anchor, so those count as links too.
    const hidden = own.querySelectorAll(".link_removed").length;

    const words = RELEASE_WORDS.filter((word) => lower.includes(word));
    /* A dotted version and a Steam build id are both matched by
       VERSION_RE and they are not the same thing. "build 24127279" is
       an eight digit number that beats every real version it is
       compared against — which is how the whole-topic index came to
       announce v24127279 as the latest release of a game whose actual
       latest was 1.2.4. They are kept apart here so nothing downstream
       has to guess which it is holding. */
    const named = versionsIn(text);

    const score =
        (links.length + hidden) * 3 +
        words.length * 2 +
        (named.version || named.build ? 3 : 0) +
        // `own`, not `post.body`. The whole module exists because a
        // reply that quotes a release is not a release, and this one
        // term was still reading the quote: a "thanks" quoting a post
        // with a code block scored for the code block.
        (own.querySelector(".code, .codetitle, .spoiler") ? 1 : 0);

    return {
        post,
        links: links.length + hidden,
        words,
        version: named.version,
        versionNamed: named.named,
        build: named.build,
        score,
        date: postDate(post),
    };
}

function postDate(post) {
    if (!post.headCell) return null;
    // "Posted:", or "Добавлено:" on the Russian interface.
    const match = post.headCell.textContent.match(/(?:Posted|Добавлено):\s*(.+?)(?:\s{2,}|$)/);
    return match ? match[1].trim() : null;
}

function authorName(post) {
    return post.author ? post.author.textContent.trim() : "unknown";
}

function flash(node) {
    if (!motionAllowed()) {
        // No fade for anyone who asked for no motion: the outline still
        // says which post, it just stops rather than dissolves.
        node.style.outline = "2px solid var(--rr-accent)";
        node.style.outlineOffset = "2px";
        setTimeout(() => { node.style.outline = ""; node.style.outlineOffset = ""; }, 1600);
        return;
    }
    node.style.transition = "outline-color 900ms ease";
    node.style.outline = "2px solid var(--rr-accent)";
    node.style.outlineOffset = "2px";
    setTimeout(() => {
        node.style.outlineColor = "transparent";
        setTimeout(() => {
            // Including the transition. Left behind, it stayed on the
            // post for the rest of the page's life and animated any
            // outline anything else put there later.
            node.style.outline = "";
            node.style.outlineOffset = "";
            node.style.transition = "";
        }, 900);
    }, 700);
}

/**
 * Show only the posts that carry links.
 *
 * This one does hide, with `display: none`, and it is the only thing
 * in the script that does. That is deliberate and it is not a fold: a
 * fold is a smaller box around content you are still reading, and this
 * is a filter you switched on to make everything else go away. It is
 * off by default, it says how many posts it is showing when you use
 * it, and switching it off puts every post back.
 */
function buildLinkFilter(all, rows) {
    const flagged = new Set(rows.map((row) => row.id));
    let on = false;

    const button = el("button.rr-btn", { type: "button", "aria-pressed": "false" }, [
        icon("filter", 13),
        t("Only posts with links"),
    ]);
    button.addEventListener("click", () => {
        on = !on;
        button.setAttribute("aria-pressed", on ? "true" : "false");
        for (const post of all) {
            const keep = !on || flagged.has(post.id);
            post.table.style.display = keep ? "" : "none";
        }
        /* The Releases list, when it is showing the whole topic, holds
           rows for posts that are not on this page; the filter used to
           hide the page's posts and leave that list as it was. */
        for (const row of document.querySelectorAll(".rr-releases__row")) {
            row.toggleAttribute("data-rr-nolink", on && row.getAttribute("data-links") === "0");
        }
        toast(on ? t("{n} posts shown", { n: rows.length }) : t("All posts shown"));
    });
    return button;
}

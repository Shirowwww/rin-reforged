#!/usr/bin/env node
/* ------------------------------------------------------------------
   Behavioural checks.

   check.js proves the script does not throw and the page does not
   overflow. It cannot tell that a feature has quietly stopped working,
   which is how the links the board keeps its rules and its chat behind
   ended up hidden, and how the finder ended up listing one upload
   several times over.

   Every check here asserts something a reader would notice.

       node test/prepare.js
       python test/serve.py &
       RR_CHROME=/path/to/chrome node test/features.js
   ------------------------------------------------------------------ */

const BASE = process.env.RR_BASE || "http://localhost:8731";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * Refuse to run against pages built from an older bundle.
 *
 * prepare.js bakes the script into these pages, so forgetting to re-run
 * it after an edit produces a full run of results that describe the
 * previous build. That reads exactly like a passing test, and once cost
 * an afternoon chasing a feature that was already working.
 */
async function assertFreshBuild(tab) {
    const dist = path.join(__dirname, "..", "dist", "rin-reforged.user.js");
    const stamp = crypto.createHash("sha1").update(fs.readFileSync(dist)).digest("hex").slice(0, 12);
    const served = await tab.evaluate(() => {
        const meta = document.querySelector('meta[name="rr-bundle"]');
        return meta ? meta.getAttribute("content") : null;
    });
    if (served !== stamp) {
        console.error("");
        console.error("These pages were built from a different bundle (page " + served + ", dist " + stamp + ").");
        console.error("Run:  node build.js && node test/prepare.js");
        console.error("");
        process.exit(2);
    }
}


const INDEX = "/forum/index.php";
const FORUM = "/forum/viewforum.php?f=10";
const TOPIC = "/forum/topic/viewtopic.php?f=10&t=133316";
const REPLIES = "/forum/replies/viewtopic.php?f=14&t=75717&start=225";
const QUOTES = "/forum/quotes/viewtopic.php?f=14&t=75717&start=225";
const MEMBER = "/forum/member/viewtopic.php?f=14&t=75717&start=225";
const LOCKED = "/forum/locked/viewtopic.php?f=14&t=75717&start=225";
const CHATTER = "/forum/chatter/viewtopic.php?f=14&t=75717&start=225";
/* A topic that fits on one page, which is most of the board and which
   nothing here had. */
const SINGLE = "/forum/single/viewtopic.php?f=14&t=75717";
/* Two pages of a hypervisor release, written in the words the board
   uses for one. Off cs.rin.ru f=41 t=157669. */
const HV = "/forum/hypervisor/viewtopic.php?f=41&t=940000";
const UNREAD = "/forum/unread/viewforum.php?f=10";
/* Search results: a listing the board draws from a template of its
   own, with a refine box written into the page three times over. */
const SEARCH = "/forum/search/search.php?keywords=steam+api";
/* The same page with a single result — the shape of "View your posts"
   for most accounts. */
const SEARCH_ONE = "/forum/searchone/search.php?search_id=egosearch";
/* The pages only a member sees — synthesised, see make-member-fixtures.js. */
const MEMBERS = "/forum/members/memberlist.php";
const PM = "/forum/ucp/ucp.php?i=pm&folder=inbox";
const PROFILE_M = "/forum/profilem/memberlist.php?mode=viewprofile&u=1";
/* Five pages of one topic. The middle page on purpose: the index has
   to read forwards and backwards from wherever it is started, and use
   the page already on screen rather than fetching it again. */
const THREAD = "/forum/thread/viewtopic.php?f=14&t=920000&start=12";
/* Twenty pages, one release each, versions 1 to 20. Nineteen fetches
   is what a real release thread costs and nothing exercised it. */
const LONG = "/forum/long/viewtopic.php?f=14&t=930000";
/* The same page, served with require-trusted-types-for. */
const LONG_TT = "/forum/long/viewtopic.php?f=14&t=930000&tt=1";

/* Every kind the finder can put on a row, and every family the panel
   maps them to. Read out of the source rather than listed again here,
   so adding a kind without giving it a colour is a failing check
   rather than a grey chip nobody notices. */
const RELEASES_SRC = fs.readFileSync(
    path.join(__dirname, "..", "src", "modules", "releases.js"), "utf8");
const RELEASE_KIND_IDS = Array.from(
    RELEASES_SRC.slice(RELEASES_SRC.indexOf("const RELEASE_KINDS"), RELEASES_SRC.indexOf("const RELEASE_FAMILY"))
        .matchAll(/\{\s*id:\s*"([a-z]+)"/g)).map((m) => m[1]);
const RELEASE_FAMILIES = Object.fromEntries(Array.from(
    RELEASES_SRC.slice(RELEASES_SRC.indexOf("const RELEASE_FAMILY"), RELEASES_SRC.indexOf("/** The family a kind"))
        .matchAll(/^\s{4}([a-z]+):\s*"([a-z]+)",/gm)).map((m) => [m[1], m[2]]));

/* Every setting the schema declares. The panel has to carry a control
   for each: a feature whose switch nobody can find is half a feature,
   and a schema entry with no home in the panel is exactly that. */
const SCHEMA_IDS = Array.from(
    fs.readFileSync(path.join(__dirname, "..", "src", "core", "schema.js"), "utf8")
        .matchAll(/^\s*id:\s*"([a-zA-Z]\w*)",\s*label:/gm)
).map((match) => match[1]);

/* Each check is { name, url, run }, plus an optional `fresh: true`.
   run() executes in the page and returns null when it passes, or a
   string saying what it found.

   Pages are shared between checks on the same URL, which is fast and
   fine for reading the DOM. A check that opens a dialog, moves focus or
   changes a setting leaves that behind for the next one — `fresh` gives
   it a page of its own. `width` does the same at a chosen viewport.

   `settings` and `data` seed storage before the first navigation, which
   is the only way to test a feature that ships switched off. A check
   that carries either always gets a context of its own, so nothing it
   turns on leaks into the next one.

   `offline: true` refuses every request that leaves the test origin and
   reports what was attempted. It is how "this reads the cache and talks
   to nobody" is proved rather than asserted.

   `slow: true` answers each page of a topic more slowly than the last,
   which is how cs.rin.ru behaves once it has had a few dozen requests
   in quick succession: it does not send 429, it queues, and six
   requests sent together come back at two, four, six, eight, ten and
   twelve seconds. Measured off the live board. The walk has to read
   that staircase as the board asking for room. */

const CHECKS = [
    /* ---- Board links the masthead was the only route to ---------- */
    {
        name: "board links: rules, FAQ, chat, donate reachable",
        url: INDEX,
        run: () => {
            const labels = Array.from(document.querySelectorAll("a"))
                .filter((a) => a.getBoundingClientRect().width > 0)
                .map((a) => a.textContent.replace(/\s+/g, " ").trim().toLowerCase());

            const missing = ["forum rules", "faq", "chat", "donate"]
                .filter((want) => !labels.includes(want));
            return missing.length ? "not reachable: " + missing.join(", ") : null;
        },
    },
    {
        name: "board links: English/Russian switch survives",
        url: INDEX,
        run: () => {
            const flags = Array.from(document.querySelectorAll('a[href*="lang="]'))
                .filter((a) => a.getBoundingClientRect().width > 0);
            return flags.length >= 2 ? null : "only " + flags.length + " language link(s) visible";
        },
    },
    {
        name: "board links: unanswered / active topics kept",
        url: FORUM,
        run: () => {
            const labels = Array.from(document.querySelectorAll("a"))
                .filter((a) => a.getBoundingClientRect().width > 0)
                .map((a) => a.textContent.toLowerCase());
            const missing = ["unanswered", "active topics"]
                .filter((want) => !labels.some((label) => label.includes(want)));
            return missing.length ? "not reachable: " + missing.join(", ") : null;
        },
    },

    /* ---- Per-post controls the board draws as bare GIFs ----------- */
    {
        name: "posts keep their Reply with quote control",
        url: REPLIES,
        run: () => {
            const posts = document.querySelectorAll('a[name^="p"]').length;
            const shown = Array.from(document.querySelectorAll('a[href*="mode=quote"]'))
                .filter((a) => a.getBoundingClientRect().width > 0).length;
            return shown >= posts ? null : shown + " visible quote links for " + posts + " posts";
        },
    },
    {
        name: "posts keep their Profile link",
        url: REPLIES,
        run: () => {
            // The author name is also a profile link, and it is visible
            // either way, so counting every profile link would pass
            // while the board's own control stayed hidden. Only the one
            // the template draws as a bare GIF is asked about here.
            const controls = Array.from(document.querySelectorAll('a[href*="mode=viewprofile"]'))
                .filter((a) => a.querySelector('img[src*="icon_user_profile"]'));
            if (!controls.length) return "the template drew no profile control";

            // A box with no size is invisible, and so is one painted at
            // zero opacity: the first is how the control was lost, the
            // second is how it could quietly be lost again.
            const seen = (node) => {
                if (node.getBoundingClientRect().width === 0) return false;
                for (let n = node; n && n !== document.body; n = n.parentElement) {
                    if (parseFloat(getComputedStyle(n).opacity) < 0.15) return false;
                    if (getComputedStyle(n).visibility === "hidden") return false;
                }
                return true;
            };
            const hidden = controls.filter((a) => !seen(a));
            return hidden.length ? hidden.length + " of " + controls.length + " profile controls are invisible" : null;
        },
    },
    {
        name: "no link is left clickable but invisible",
        url: REPLIES,
        run: () => {
            // A link with a real href, laid out, and no size at all is a
            // control that is still in the page and can no longer be
            // found: the exact shape of the bug that hid Quote and
            // Profile behind a display:none GIF.
            const orphans = Array.from(document.querySelectorAll("a[href]")).filter((a) => {
                const href = a.getAttribute("href");
                if (!href || href.startsWith("#") || href.startsWith("javascript:")) return false;
                if (a.getBoundingClientRect().width > 0) return false;
                return a.offsetParent !== null;      // a hidden strip is fine
            });
            return orphans.length
                ? orphans.length + " invisible link(s), first: " + orphans[0].getAttribute("href").slice(0, 60)
                : null;
        },
    },

    /* ---- The finder ---------------------------------------------- */
    {
        name: "finder lists no post whose evidence is only quoted",
        url: REPLIES,
        run: () => {
            const RELEASE_WORDS = [
                "clean steam files", "steam files", "reupload", "re-upload",
                "update", "updated", "patch", "hotfix", "repack", "crack",
                "build", "denuvo", "dlc unlocker", "goldberg", "emulator",
            ];
            const VERSION_RE = /\b(?:v(?:er(?:sion)?)?\.?\s?)(\d+(?:\.\d+){1,3}[a-z]?)\b|\bbuild\s+(\d{5,9})\b/i;

            const bad = [];
            for (const link of document.querySelectorAll(".rr-releases__link")) {
                // The row links to the page and the anchor now, not to a
                // bare fragment: the same panel lists posts on other
                // pages, which have to be real links.
                const id = ((link.getAttribute("href") || "").match(/#p(\d+)$/) || [])[1] || "";
                const anchor = document.querySelector('a[name="p' + id + '"]');
                const table = anchor && anchor.closest("table.tablebg");
                const body = table && table.querySelector("div.postbody");
                if (!body) { bad.push(id + " (post not found)"); continue; }

                const own = body.cloneNode(true);
                for (const q of own.querySelectorAll(".quotecontent, .quotetitle, blockquote, cite")) q.remove();
                const text = own.textContent;
                const lower = text.toLowerCase();

                const hasLink = own.querySelector("a[href^='http'], .link_removed") !== null;
                const hasWord = RELEASE_WORDS.some((w) => lower.includes(w));
                const hasVersion = VERSION_RE.test(text);

                if (!hasLink && !hasWord && !hasVersion) bad.push(id);
            }
            return bad.length
                ? bad.length + " listed post(s) carry nothing of their own: " + bad.join(", ")
                : null;
        },
    },
    {
        name: "finder lists each post once",
        url: REPLIES,
        run: () => {
            const ids = Array.from(document.querySelectorAll(".rr-releases__link"))
                .map((a) => a.getAttribute("href"));
            const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
            return dupes.length ? "repeated: " + Array.from(new Set(dupes)).join(", ") : null;
        },
    },
    {
        name: "finder lists no two entries reading the same",
        url: REPLIES,
        run: () => {
            const lines = Array.from(document.querySelectorAll(".rr-releases__row"))
                .map((li) => li.textContent.replace(/\s+/g, " ").trim());
            const dupes = lines.filter((line, i) => lines.indexOf(line) !== i);
            return dupes.length ? "repeated: " + Array.from(new Set(dupes))[0] : null;
        },
    },

    /* ---- The finder, against the case it used to get wrong -------- */
    {
        name: "quotes: a reply that only quotes a release is not listed",
        url: QUOTES,
        run: () => {
            const listed = Array.from(document.querySelectorAll(".rr-releases__link"))
                .map((a) => ((a.getAttribute("href") || "").match(/#p(\d+)$/) || [])[1] || "");
            // 900002-900004 carry a version, three release words and two
            // hidden links each — all of them quoted from 900001.
            const wrong = ["900002", "900003", "900004"].filter((id) => listed.includes(id));
            return wrong.length
                ? "listed quote-only replies: " + wrong.join(", ") + " (listed: " + listed.join(", ") + ")"
                : null;
        },
    },
    {
        name: "quotes: the release itself is still listed",
        url: QUOTES,
        run: () => {
            const listed = Array.from(document.querySelectorAll(".rr-releases__link"))
                .map((a) => ((a.getAttribute("href") || "").match(/#p(\d+)$/) || [])[1] || "");
            const missing = ["900001", "900005"].filter((id) => !listed.includes(id));
            return missing.length ? "not listed: " + missing.join(", ") : null;
        },
    },
    {
        name: "quotes: chatter is not listed",
        url: QUOTES,
        run: () => {
            const listed = Array.from(document.querySelectorAll(".rr-releases__link"))
                .map((a) => ((a.getAttribute("href") || "").match(/#p(\d+)$/) || [])[1] || "");
            return listed.includes("900006") ? "listed a post with nothing in it" : null;
        },
    },

    /* ---- Search results -------------------------------------------- */
    {
        name: "search results: one refine box, not three",
        url: SEARCH,
        run: () => {
            /* The board writes `add_keywords` into the page three times
               over: the breadcrumb strip at the top, the one at the
               bottom, and the results header. Same search, three boxes,
               and two different button captions. */
            const shown = Array.from(document.querySelectorAll('input[name="add_keywords"]'))
                .filter((node) => node.getBoundingClientRect().width > 0);
            if (shown.length === 1) return null;
            return shown.length + " refine boxes on the page";
        },
    },
    {
        name: "search results: the one box left is the one that works",
        url: SEARCH,
        run: () => {
            const field = Array.from(document.querySelectorAll('input[name="add_keywords"]'))
                .find((node) => node.getBoundingClientRect().width > 0);
            if (!field) return "no refine box at all";
            const form = field.closest("form");
            if (!form) return "the box is not in a form";
            if (!form.querySelector('[type="submit"]')) return "no way to submit it";
            // Moved into the filter bar rather than left where it was.
            return form.closest(".rr-toolbar") ? null : "not in the filter bar";
        },
    },
    {
        name: "search results: one result gets no filter, count or chip",
        url: SEARCH_ONE,
        run: () => {
            const rows = document.querySelectorAll("a.topictitle").length;
            if (rows !== 1) return "the fixture has " + rows + " rows, not 1";
            const junk = [];
            if (document.querySelector(".rr-toolbar__filter")) junk.push("a filter box");
            if (document.querySelector(".rr-toolbar__count")) junk.push("a count");
            if (document.querySelector(".rr-toolbar__tags")) junk.push("filter chips");
            if (document.querySelector("button.rr-tag")) junk.push("a clickable prefix");
            return junk.length ? "filtering one row with " + junk.join(", ") : null;
        },
    },
    {
        name: "search results: the refine box survives the short page",
        url: SEARCH_ONE,
        run: () => {
            const shown = Array.from(document.querySelectorAll('input[name="add_keywords"]'))
                .filter((node) => node.getBoundingClientRect().width > 0);
            return shown.length === 1 ? null : shown.length + " refine boxes on the page";
        },
    },
    {
        name: "search results: the marker and title columns are labelled",
        url: SEARCH,
        run: () => {
            /* The board heads this table with a blank cell and a
               "Topics" heading spanning two columns. Read as a word
               rather than as a span, "Topics" is the index's counting
               column: the marker gutter disappeared and the titles went
               through the number grouping. */
            const row = document.querySelector("a.topictitle")?.closest("tr");
            if (!row) return "no result rows";
            const at = (name) => row.querySelector('td[data-rr-col="' + name + '"]');
            if (!at("icon")) return "no marker column";
            const title = at("title");
            if (!title || !title.contains(document.querySelector("a.topictitle"))) {
                return "the title column is not the one holding the title";
            }
            return null;
        },
    },
    {
        name: "search results: the sort strip is not dressed as content",
        url: SEARCH,
        run: () => {
            /* The accent edge marks a block of content. "Display posts
               from previous / Sort by / Go" is a row of form controls
               and was wearing it. */
            const cell = Array.from(document.querySelectorAll("td.cat"))
                .find((node) => node.querySelector("select"));
            if (!cell) return "no sort strip on the page";
            const shadow = getComputedStyle(cell).boxShadow;
            return shadow === "none" ? null : "accent edge: " + shadow;
        },
    },

    /* ---- The read/unread marker ------------------------------------ */
    {
        name: "listings: the read mark is visible against the page",
        url: SEARCH,
        run: () => {
            /* A filled dot in the line colour is a smudge on a dark
               page, and a listing where every row is read is a column
               of them saying nothing. 3:1 is the contrast a mark this
               small has to clear to be seen at all. */
            const dot = document.querySelector('.rr-dot[data-state="read"]');
            if (!dot) return "no read marker on the page";

            const rgb = (value) => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
            const lum = (value) => {
                const parts = rgb(value).map((channel) => {
                    const c = channel / 255;
                    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
                });
                return 0.2126 * parts[0] + 0.7152 * parts[1] + 0.0722 * parts[2];
            };
            // The mark is a ring, so its colour is the border's.
            const style = getComputedStyle(dot);
            const ink = style.borderTopColor;

            let behind = dot.parentElement;
            let paper = "rgb(255, 255, 255)";
            while (behind) {
                const bg = getComputedStyle(behind).backgroundColor;
                const alpha = (bg.match(/[\d.]+/g) || [])[3];
                if (bg && bg !== "transparent" && alpha !== "0") { paper = bg; break; }
                behind = behind.parentElement;
            }

            const a = lum(ink);
            const b = lum(paper);
            const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
            return ratio >= 3 ? null : "contrast " + ratio.toFixed(2) + ":1 (" + ink + " on " + paper + ")";
        },
    },
    {
        name: "listings: a topic already opened is marked once, not twice",
        url: FORUM,
        data: { visited: ["104887"] },
        run: () => {
            /* Read state used to be said twice and faintly: a grey dot
               beside a title greyed out to match. The mark carries it
               now, and the title keeps its contrast. */
            const link = document.querySelector('a.topictitle[href*="t=104887"]');
            if (!link) return "the seeded topic is not on the page";
            const row = link.closest("tr");
            if (!row || !row.hasAttribute("data-rr-visited")) return "the row was not marked visited";

            const other = Array.from(document.querySelectorAll("a.topictitle"))
                .find((node) => !node.closest("tr").hasAttribute("data-rr-visited"));
            if (!other) return "every row on the page counts as visited";

            const colour = (node) => getComputedStyle(node).color;
            if (colour(link) !== colour(other)) {
                return "the title is dimmed as well: " + colour(link) + " against " + colour(other);
            }
            const dot = row.querySelector('.rr-dot[data-state="read"]');
            if (!dot) return "no read marker to carry it";
            const fill = getComputedStyle(dot).backgroundColor;
            const alpha = (fill.match(/[\d.]+/g) || [])[3];
            return fill !== "transparent" && alpha !== "0" ? null : "the marker says nothing either";
        },
    },

    /* ---- Searching the board -------------------------------------- */
    {
        name: "search: the board's own boxes keep their parameters",
        url: FORUM,
        run: () => {
            // The template ships sr=topics and sf=titleonly on the forum
            // search box. Moving that form into the toolbar must carry
            // the hidden inputs with it, or the search silently widens
            // to one row per matching post.
            const form = document.querySelector("#forum-search, #search-box form");
            if (!form) return "the forum search box is gone";
            const value = (name) => {
                const node = form.querySelector('[name="' + name + '"]');
                return node ? node.value : null;
            };
            const problems = [];
            if (value("sr") !== "topics") problems.push("sr=" + value("sr"));
            if (value("sf") !== "titleonly") problems.push("sf=" + value("sf"));
            if (!form.querySelector('[name="fid[]"]')) problems.push("no fid[]");
            return problems.length ? "lost: " + problems.join(", ") : null;
        },
    },
    {
        name: "search: the topic box still searches inside the topic",
        url: TOPIC,
        run: () => {
            const form = document.querySelector("#topic-search");
            if (!form) return "the topic search box is gone";
            const t = form.querySelector('[name="t"]');
            const sf = form.querySelector('[name="sf"]');
            if (!t || !t.value) return "no topic id, so it would search the whole board";
            if (!sf || sf.value !== "msgonly") return "sf=" + (sf && sf.value);
            return null;
        },
    },
    {
        name: "search: Ctrl+K asks for one row per topic",
        fresh: true,
        url: FORUM,
        run: () => {
            const trigger = document.querySelector(".rr-nav__search");
            if (!trigger) return "no palette trigger in the top bar";
            trigger.click();
            const input = document.querySelector(".rr-palette__input");
            if (!input) return "the palette did not open";
            input.value = "dogma";
            input.dispatchEvent(new Event("input", { bubbles: true }));

            return new Promise((resolve) => setTimeout(() => {
                const entry = document.querySelector('.rr-palette__item[data-href*="search.php"]');
                if (!entry) return resolve("no search entry with a URL");
                const url = new URL(entry.getAttribute("data-href"), location.href);
                const problems = [];
                if (url.searchParams.get("sr") !== "topics") {
                    problems.push("sr=" + url.searchParams.get("sr") + " (would return one row per matching post)");
                }
                if (!url.searchParams.get("sf")) problems.push("no sf (would search quoted text too)");
                if (url.searchParams.get("keywords") !== "dogma") problems.push("keywords lost");
                document.querySelector(".rr-overlay")?.remove();
                resolve(problems.length ? problems.join(", ") : null);
            }, 150));
        },
    },
    {
        name: "palette: entries can be opened in a new tab",
        fresh: true,
        url: FORUM,
        run: () => {
            const trigger = document.querySelector(".rr-nav__search");
            trigger.click();
            const items = Array.from(document.querySelectorAll(".rr-palette__item"));
            const navigating = items.filter((n) => /board|topic/.test(
                (n.querySelector(".rr-palette__hint") || {}).textContent || ""));
            document.querySelector(".rr-overlay")?.remove();
            if (!navigating.length) return null;          // nothing cached yet on this page
            const bare = navigating.filter((n) => !n.getAttribute("data-href"));
            return bare.length ? bare.length + " navigating entries carry no URL" : null;
        },
    },

    /* ---- Replying ------------------------------------------------- */
    {
        name: "quick reply appears for a member on an open topic",
        url: MEMBER,
        run: () => document.querySelector(".rr-reply")
            ? null
            : "no quick reply, though the board printed a reply link",
    },
    {
        name: "quick reply stays away on a locked topic",
        url: LOCKED,
        run: () => {
            if (!document.querySelector('a[href*="mode=logout"]')) return "fixture is not logged in";
            return document.querySelector(".rr-reply")
                ? "offered a reply box on a topic with no reply link"
                : null;
        },
    },

    /* ---- Keyboard and focus --------------------------------------- */
    {
        name: "a skip link is the first thing Tab reaches",
        url: FORUM,
        run: () => {
            const skip = document.querySelector(".rr-skip");
            if (!skip) return "no skip link";

            const focusable = Array.from(document.querySelectorAll(
                'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )).filter((n) => n.offsetParent !== null || n === skip);
            if (focusable[0] !== skip) {
                return "first focusable is " + focusable[0].tagName + "." + focusable[0].className;
            }

            const target = document.querySelector(skip.getAttribute("href"));
            if (!target) return "the skip link points at nothing";
            if (target.getAttribute("tabindex") !== "-1") {
                return "the target is not focusable, so focus would stay behind";
            }
            return null;
        },
    },
    {
        name: "the skip link is visible once focused",
        fresh: true,
        url: FORUM,
        run: () => {
            const skip = document.querySelector(".rr-skip");
            skip.focus();
            /* It slides in, so the box has to be read after the
               transition — and *after the transition*, not after a
               number of milliseconds. A headless browser produces
               frames when it feels like it, and the 250 ms this used
               to sleep for was enough until the page grew busier at
               load; then the check started failing on a slide that had
               simply not finished yet. `finished` is the signal the
               guess was standing in for, and an empty list resolves at
               once, which is the reduced-motion case. */
            return Promise.all(skip.getAnimations().map((run) => run.finished)).then(() => {
                const box = skip.getBoundingClientRect();
                const style = getComputedStyle(skip);
                skip.blur();
                if (box.top < 0 || box.left < 0) return "still off screen when focused";
                if (box.width < 40 || box.height < 16) return "focused but has no size";
                if (parseFloat(style.opacity) < 0.9) return "focused but transparent";
                return null;
            });
        },
    },
    {
        name: "the shortcut sheet does not stack",
        fresh: true,
        url: FORUM,
        run: () => {
            document.body.focus();
            const press = () => document.dispatchEvent(
                new KeyboardEvent("keydown", { key: "?", bubbles: true }));
            press(); press(); press();
            const open = document.querySelectorAll(".rr-sheet").length;
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
            const left = document.querySelectorAll(".rr-sheet").length;
            if (open > 1) return open + " sheets opened at once";
            if (left > 0) return "Escape left " + left + " sheet(s) behind";
            return null;
        },
    },
    {
        name: "the shortcut sheet can be closed without a mouse",
        fresh: true,
        url: FORUM,
        run: () => {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "?", bubbles: true }));
            const sheet = document.querySelector(".rr-sheet");
            if (!sheet) return "the sheet did not open";
            const problems = [];
            if (document.activeElement !== sheet && !sheet.contains(document.activeElement)) {
                problems.push("focus was left outside it");
            }
            if (!sheet.querySelector("button")) problems.push("no close control");
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
            return problems.length ? problems.join(", ") : null;
        },
    },
    {
        name: "settings controls follow a change made elsewhere",
        fresh: true,
        url: FORUM,
        run: () => {
            const cog = Array.from(document.querySelectorAll(".rr-nav__actions button"))
                .find((b) => /settings/i.test(b.getAttribute("aria-label") || ""));
            if (!cog) return "no settings button";
            cog.click();
            const panel = document.querySelector(".rr-panel");
            if (!panel) return "the panel did not open";

            const row = panel.querySelector('[data-field="theme"] .rr-seg');
            if (!row) return "no theme control";
            const pressed = () => Array.from(row.children)
                .find((b) => b.getAttribute("aria-pressed") === "true");
            const before = pressed() && pressed().dataset.value;

            // Change the theme the way the palette's action does.
            const other = Array.from(row.children).find((b) => b.dataset.value !== before);
            other.click();
            const mid = pressed() && pressed().dataset.value;

            // And back, through a route the panel does not know about.
            document.documentElement.dispatchEvent(new Event("x"));
            const revert = Array.from(row.children).find((b) => b.dataset.value === before);
            revert.click();

            document.querySelector(".rr-panel .rr-icon-btn[title*='Close']")?.click();
            return mid === other.dataset.value ? null : "the control did not follow the change";
        },
    },

    /* ---- Listing layout ------------------------------------------- */
    {
        name: "the forum name labels the action bar, not a band of its own",
        url: FORUM,
        run: () => {
            const title = document.querySelector(".rr-topicbar__title");
            if (!title) return "the forum name is not in the bar";
            if (!/h[1-6]/i.test(title.tagName)) return "it stopped being a heading (" + title.tagName + ")";
            if (!title.textContent.trim()) return "the heading is empty";
            const bar = document.querySelector(".rr-topicbar");
            if (!bar.contains(title)) return "it is not inside the bar";
            // And nothing was left behind where it used to sit.
            const strays = Array.from(document.querySelectorAll("#wrapcentre > h2, #wrapcentre > form > h2"))
                .filter((h) => h.getBoundingClientRect().height > 0);
            return strays.length ? strays.length + " heading(s) still on a line of their own" : null;
        },
    },
    {
        name: "last post shows the date and the poster on one line",
        url: FORUM,
        run: () => {
            const cells = Array.from(document.querySelectorAll('td[data-rr-col="last"]'))
                .filter((td) => td.textContent.trim());
            if (!cells.length) return "no last-post cells";

            const stacked = cells.filter((td) =>
                Array.from(td.children).filter((n) => n.tagName === "P").length > 1);
            if (stacked.length) return stacked.length + " of " + cells.length + " still stacked";

            // The poster has to have come across with its link intact.
            const withLink = cells.filter((td) => td.querySelector("a[href]"));
            if (!withLink.length) return "the poster link did not survive the join";

            // And the full date, weekday included, stays reachable.
            const line = cells.find((td) => td.querySelector("p.rr-lastpost"));
            const title = line && line.querySelector("p.rr-lastpost").getAttribute("title");
            return title && title.length > 8 ? null : "the full date was not kept on hover";
        },
    },

    /* ---- On a phone ------------------------------------------------ */
    {
        name: "no cell draws its content outside itself",
        url: SEARCH_ONE,
        width: 390,
        run: () => {
            /* The template pins cells by hand — `.cat { height: 25px }`
               in the board's stylesheet, `height="30"` on the
               statistics cell. As table cells those are minimums and
               the row grows past them; unpacked into blocks for a phone
               they are the height, and anything that wraps to a second
               line is simply drawn outside its own card, over whatever
               is under it. Nothing overflows the *page*, so this is
               invisible to an overflow check. */
            const spills = [];
            for (const cell of document.querySelectorAll("#wrapcentre td, #wrapcentre th")) {
                const box = cell.getBoundingClientRect();
                if (!box.height) continue;
                for (const kid of cell.children) {
                    const k = kid.getBoundingClientRect();
                    if (!k.height || k.bottom - box.bottom <= 2) continue;
                    spills.push((cell.className || cell.tagName) + " by " + Math.round(k.bottom - box.bottom) + "px");
                    break;
                }
            }
            return spills.length ? spills.slice(0, 3).join("; ") : null;
        },
    },
    {
        name: "no cell draws its content outside itself, on the index",
        url: INDEX,
        width: 390,
        run: () => {
            const spills = [];
            for (const cell of document.querySelectorAll("#wrapcentre td, #wrapcentre th")) {
                const box = cell.getBoundingClientRect();
                if (!box.height) continue;
                for (const kid of cell.children) {
                    const k = kid.getBoundingClientRect();
                    if (!k.height || k.bottom - box.bottom <= 2) continue;
                    spills.push((cell.className || cell.tagName) + " by " + Math.round(k.bottom - box.bottom) + "px");
                    break;
                }
            }
            return spills.length ? spills.slice(0, 3).join("; ") : null;
        },
    },
    {
        name: "the board links fold on a narrow screen",
        url: FORUM,
        width: 390,
        run: () => {
            const bar = document.querySelector(".rr-boardbar");
            if (!bar) return "no board bar";
            const more = bar.querySelector(".rr-boardbar__more");
            if (!more || !more.getBoundingClientRect().width) return "no fold control at 390px";

            const links = Array.from(bar.querySelectorAll(".rr-boardbar__link"));
            const shown = links.filter((a) => a.getBoundingClientRect().width > 0);
            if (shown.length >= links.length) return "nothing was folded";
            if (bar.getBoundingClientRect().height > 44) {
                return "still " + Math.round(bar.getBoundingClientRect().height) + "px tall";
            }
            return null;
        },
    },
    {
        name: "the folded board links all come back",
        url: FORUM,
        width: 390,
        run: () => {
            const bar = document.querySelector(".rr-boardbar");
            const links = Array.from(bar.querySelectorAll(".rr-boardbar__link"));
            bar.querySelector(".rr-boardbar__more").click();
            const hidden = links.filter((a) => a.getBoundingClientRect().width === 0);
            const expanded = bar.querySelector(".rr-boardbar__more").getAttribute("aria-expanded");
            if (hidden.length) return hidden.length + " link(s) still hidden after opening";
            if (expanded !== "true") return "aria-expanded is " + expanded;
            return null;
        },
    },

    {
        name: "the board links keep both entry points at a tablet width",
        url: FORUM,
        width: 700,
        run: () => {
            /* Between 561 and 720px the row folds but still has room
               for two links; below 561 it keeps one. Two bands, two
               rules, and only the narrow one had ever been looked at. */
            const bar = document.querySelector(".rr-boardbar");
            if (!bar) return "no board bar";
            const more = bar.querySelector(".rr-boardbar__more");
            if (!more || !more.getBoundingClientRect().width) return "no fold control at 700px";

            const views = bar.querySelector('[data-rr-group="views"]');
            const shown = Array.from(views.children).filter((a) => a.getBoundingClientRect().width > 0);
            if (shown.length !== 2) return shown.length + " entry point(s) showing, wanted 2";

            const height = bar.getBoundingClientRect().height;
            return height <= 46 ? null : "the row is " + Math.round(height) + "px tall";
        },
    },

    {
        name: "index: the board's art and its links are one header",
        url: INDEX,
        run: () => {
            const art = document.querySelector(".rr-masthead");
            const links = document.querySelector(".rr-boardbar");
            if (!art || !links) return "the index has no masthead or no board links";

            const header = document.querySelector(".rr-header");
            if (!header || !header.contains(art) || !header.contains(links)) {
                return "they are still two blocks stacked";
            }
            // Side by side at a desktop width: 380px of art with a
            // thousand pixels of nothing beside it was the complaint.
            const a = art.getBoundingClientRect();
            const b = links.getBoundingClientRect();
            if (b.left < a.right) return "the links are not beside the art";
            if (Math.abs(a.bottom - b.bottom) > 4) return "they do not share a baseline";

            // And the art is untouched: the board's own file, at the
            // size the board draws it.
            const img = art.querySelector(".rr-masthead__art");
            if (img && img.naturalWidth) {
                const box = img.getBoundingClientRect();
                if (Math.abs(box.width - img.naturalWidth) > 1) {
                    return "the art was scaled to " + Math.round(box.width) + "px";
                }
            }
            return null;
        },
    },
    {
        name: "index: the header stacks again on a narrow screen",
        url: INDEX,
        width: 390,
        run: () => {
            const art = document.querySelector(".rr-masthead");
            const links = document.querySelector(".rr-boardbar");
            if (!art || !links) return "the index has no masthead or no board links";
            const a = art.getBoundingClientRect();
            const b = links.getBoundingClientRect();
            if (b.top < a.bottom - 4) return "still side by side at 390px";
            return document.body.scrollWidth - window.innerWidth > 1
                ? "the page overflows by " + (document.body.scrollWidth - window.innerWidth) + "px"
                : null;
        },
    },

    /* ---- Icons ---------------------------------------------------- */
    {
        name: "icons draw their shapes without parsing markup",
        url: FORUM,
        run: () => {
            const svgs = Array.from(document.querySelectorAll(".rr-nav svg, .rr-btn svg"));
            if (!svgs.length) return "no icons in the interface";

            const empty = svgs.filter((svg) => svg.children.length === 0);
            if (empty.length) return empty.length + " of " + svgs.length + " icons are empty";

            // Every shape has to be a real SVG-namespace node: an
            // HTML-namespace <path> renders as nothing at all.
            const wrongNs = svgs.flatMap((svg) => Array.from(svg.children))
                .filter((n) => n.namespaceURI !== "http://www.w3.org/2000/svg");
            if (wrongNs.length) return wrongNs.length + " shapes are in the wrong namespace";

            // And the attributes have to have come across, or the shape
            // is present and invisible.
            const bare = svgs.flatMap((svg) => Array.from(svg.children))
                .filter((n) => n.attributes.length === 0);
            return bare.length ? bare.length + " shapes carry no attributes" : null;
        },
    },

    /* ---- Things the board did that must still work --------------- */
    {
        name: "topic page keeps a working reply route",
        url: TOPIC,
        run: () => {
            const shown = Array.from(document.querySelectorAll('a[href*="mode=reply"], a[href*="mode=post"]'))
                .filter((a) => a.getBoundingClientRect().width > 0).length;
            return shown ? null : "no visible reply control";
        },
    },
    {
        name: "pagination still reaches every page",
        url: FORUM,
        run: () => {
            const pager = document.querySelector(".rr-pager");
            if (!pager) return "no pager";
            /* Read by name rather than by the text on the face: the
               first and last steps are an arrow, with the name on
               aria-label — which is also what has to be right for
               anyone not looking at the arrow. */
            const names = Array.from(pager.querySelectorAll("a")).map((a) =>
                (a.getAttribute("aria-label") || a.textContent).replace(/\s+/g, " ").trim());
            const missing = ["Next page", "Last page"].filter((want) => !names.includes(want));
            if (missing.length) return "pager missing: " + missing.join(", ");
            // And each one is reachable, not just labelled.
            const dead = Array.from(pager.querySelectorAll("a")).filter((a) => !a.getAttribute("href"));
            return dead.length ? dead.length + " step(s) with no destination" : null;
        },
    },

    /* ---- Folding quotes ------------------------------------------- */
    {
        name: "quotes: a long quote is folded",
        url: QUOTES,
        settings: { foldQuotesLines: 3 },
        run: () => {
            const folded = document.querySelectorAll('[data-rr-quote="folded"]');
            if (!folded.length) return "nothing was folded on a page built out of quotes";
            const toggles = document.querySelectorAll(".rr-quote-toggle");
            if (!toggles.length) return folded.length + " folded quotes and no control to open them";
            const bad = Array.from(toggles).filter((b) => b.getAttribute("aria-expanded") !== "false");
            return bad.length ? bad.length + " toggle(s) do not say they are collapsed" : null;
        },
    },
    {
        name: "quotes: folding takes nothing out of the page",
        url: QUOTES,
        settings: { foldQuotesLines: 3 },
        run: () => {
            // The whole reason the earlier attempt at this was refused.
            // A folded quote has to be smaller, not absent: still laid
            // out, still in the accessibility tree, still found by
            // Ctrl+F. All three fail the moment it is display:none,
            // visibility:hidden or detached.
            const problems = [];
            for (const quote of document.querySelectorAll('[data-rr-quote="folded"]')) {
                const style = getComputedStyle(quote);
                if (!document.contains(quote)) problems.push("detached");
                else if (style.display === "none") problems.push("display:none");
                else if (style.visibility === "hidden") problems.push("visibility:hidden");
                else if (!quote.getClientRects().length) problems.push("not laid out");
                else if (!quote.textContent.trim()) problems.push("emptied");
                else if (quote.scrollHeight <= quote.clientHeight + 1) problems.push("nothing was actually clipped");
            }
            return problems.length ? problems.length + " folded quote(s): " + problems[0] : null;
        },
    },
    {
        name: "quotes: a folded quote still reads in full",
        url: QUOTES,
        settings: { foldQuotesLines: 3 },
        run: () => {
            // The release everyone quotes says "clean steam files". If
            // folding cost the page that text, the finder, the board's
            // own search and a screen reader all lose it too.
            const quote = document.querySelector('[data-rr-quote="folded"]');
            if (!quote) return "nothing folded";
            if (!quote.textContent.toLowerCase().includes("clean steam files")) return "the quoted text is gone";
            if (quote.getAttribute("aria-hidden") === "true") return "hidden from assistive technology";
            return null;
        },
    },
    {
        name: "quotes: the fold opens and closes",
        fresh: true,
        url: QUOTES,
        settings: { foldQuotesLines: 3 },
        run: () => {
            const toggle = document.querySelector(".rr-quote-toggle");
            if (!toggle) return "no toggle";
            const quote = toggle.closest(".quotetitle").nextElementSibling;
            toggle.click();
            if (quote.hasAttribute("data-rr-quote")) return "clicking did not open it";
            if (toggle.getAttribute("aria-expanded") !== "true") return "aria-expanded did not follow";
            toggle.click();
            if (quote.getAttribute("data-rr-quote") !== "folded") return "clicking again did not fold it back";
            return null;
        },
    },

    /* ---- Folding chatter ------------------------------------------ */
    {
        name: "chatter: short replies with nothing in them fold",
        url: CHATTER,
        settings: { quietPosts: true },
        run: () => {
            const missing = ["910001", "910002", "910003", "910004", "910009"].filter((id) => {
                const anchor = document.querySelector('a[name="p' + id + '"]');
                const table = anchor && anchor.closest("table.tablebg");
                return !table || !table.hasAttribute("data-rr-quiet");
            });
            return missing.length ? "not folded: " + missing.join(", ") : null;
        },
    },
    {
        name: "chatter: a short reply that says something is left alone",
        url: CHATTER,
        settings: { quietPosts: true },
        run: () => {
            // One per reason: a problem report, a question, a link, a
            // version number, and a post that is simply long enough.
            const why = {
                "910005": "reports a dead link",
                "910006": "asks a question",
                "910007": "carries a link",
                "910008": "names a version",
                "910010": "is not short",
            };
            const wrong = Object.keys(why).filter((id) => {
                const anchor = document.querySelector('a[name="p' + id + '"]');
                const table = anchor && anchor.closest("table.tablebg");
                return table && table.hasAttribute("data-rr-quiet");
            });
            return wrong.length
                ? "folded a post that " + why[wrong[0]] + " (" + wrong.join(", ") + ")"
                : null;
        },
    },
    {
        name: "chatter: folding takes nothing out of the page",
        url: CHATTER,
        settings: { quietPosts: true },
        run: () => {
            const problems = [];
            for (const table of document.querySelectorAll("table.tablebg[data-rr-quiet]")) {
                const body = table.querySelector("div.postbody");
                if (!body) { problems.push("no body left"); continue; }
                const style = getComputedStyle(body);
                if (style.display === "none") problems.push("display:none");
                else if (style.visibility === "hidden") problems.push("visibility:hidden");
                else if (!body.getClientRects().length) problems.push("not laid out");
                else if (!body.textContent.trim()) problems.push("emptied");
            }
            return problems.length ? problems.length + " folded reply/replies: " + problems[0] : null;
        },
    },
    {
        name: "chatter: a folded reply opens",
        fresh: true,
        url: CHATTER,
        settings: { quietPosts: true },
        run: () => {
            const chip = document.querySelector(".rr-quiet-chip");
            if (!chip) return "no control on a folded reply";
            const table = chip.closest("table.tablebg");
            const before = table.querySelector("div.postbody").getBoundingClientRect().height;
            chip.click();
            if (table.hasAttribute("data-rr-quiet")) return "clicking did not open it";
            const after = table.querySelector("div.postbody").getBoundingClientRect().height;
            return after >= before ? null : "the reply did not grow when opened";
        },
    },
    {
        name: "chatter: a folded reply is one line, however long it is",
        width: 480,
        url: CHATTER,
        settings: { quietPosts: true },
        run: () => {
            // The invariant, and the thing that was quietly not true:
            // the message was set to display:inline, where overflow and
            // max-height do not apply at all, so a long "thank you so
            // much for taking the time" laid itself out in full and
            // only short replies looked folded. The phone stylesheet
            // then undid it a second time by unpacking the cell.
            const bodies = Array.from(
                document.querySelectorAll("table.tablebg[data-rr-quiet] div.postbody"));
            if (!bodies.length) return "nothing folded";
            const long = bodies.filter((b) => b.textContent.trim().length > 90);
            if (!long.length) return "no folded reply here is long enough to prove anything";

            const tall = bodies.filter((b) => {
                const line = parseFloat(getComputedStyle(b).lineHeight) || 20;
                return b.getBoundingClientRect().height > line * 1.6;
            });
            return tall.length
                ? tall.length + " folded reply/replies take more than one line"
                : null;
        },
    },
    {
        name: "chatter: the fold is reversible from the topic bar",
        fresh: true,
        url: CHATTER,
        settings: { quietPosts: true },
        run: () => {
            const control = Array.from(document.querySelectorAll(".rr-topicbar .rr-btn"))
                .find((b) => /short repl/i.test(b.textContent));
            if (!control) return "no control in the topic bar";
            control.click();
            const left = document.querySelectorAll("table.tablebg[data-rr-quiet]").length;
            if (left) return left + " replies still folded after unfolding everything";
            control.click();
            return document.querySelectorAll("table.tablebg[data-rr-quiet]").length
                ? null
                : "folding them back did nothing";
        },
    },
    {
        name: "chatter: nothing folds when the setting is off",
        url: CHATTER,
        settings: {},
        run: () => document.querySelector("[data-rr-quiet]")
            ? "folded replies with the setting off"
            : null,
    },

    /* ---- First unread from a listing ------------------------------ */
    {
        name: "unread: an unread row's title opens at the first unread post",
        url: UNREAD,
        // Off by default since 0.11: a title opens page one unless asked.
        fresh: true,
        settings: { unreadFromList: true },
        run: () => {
            const rows = Array.from(document.querySelectorAll("tr[data-rr-unread]"));
            if (rows.length < 4) return "only " + rows.length + " rows were treated as unread";
            const bad = rows.filter((row) => {
                const href = row.querySelector("a.topictitle").getAttribute("href") || "";
                return !/view=unread/.test(href) || !/#unread$/.test(href);
            });
            return bad.length ? bad.length + " unread rows still point at page one" : null;
        },
    },
    {
        name: "titles: taking the prefix off keeps everything after it",
        url: UNREAD,
        run: () => {
            // `link.textContent = rest` is one line and throws away
            // every child the link had. It is safe on this board only
            // because the sole thing inside a title happens to be the
            // prefix being removed — safe by coincidence, not by
            // construction.
            const badge = document.querySelector("a.topictitle img.rr-fixture-badge");
            if (!badge) return "the badge inside the title did not survive the prefix strip";
            const link = badge.closest("a.topictitle");
            if (!/Marked Game/.test(link.textContent)) return "the title text was lost too";
            if (/\[\s*Release\s*\]/.test(link.textContent)) return "the prefix was not taken off";
            const tag = link.previousElementSibling;
            return tag && tag.classList.contains("rr-tag") ? null : "no tag was put in its place";
        },
    },
    {
        name: "unread: a row that is already read is left alone",
        url: UNREAD,
        run: () => {
            const rows = Array.from(document.querySelectorAll("tr"))
                .filter((row) => row.querySelector("a.topictitle") && !row.hasAttribute("data-rr-unread"));
            if (!rows.length) return "every row was treated as unread";
            const wrong = rows.filter((row) =>
                /view=unread/.test(row.querySelector("a.topictitle").getAttribute("href") || ""));
            return wrong.length ? wrong.length + " read rows were retargeted" : null;
        },
    },
    {
        name: "unread: a logged-out reader's titles are untouched",
        url: FORUM,
        run: () => {
            if (document.querySelector('a[href*="mode=logout"]')) return "fixture is logged in";
            const wrong = Array.from(document.querySelectorAll("a.topictitle"))
                .filter((a) => /view=unread/.test(a.getAttribute("href") || ""));
            return wrong.length ? wrong.length + " titles retargeted with no account" : null;
        },
    },

    /* ---- A hypervisor release, in the board's own words ------------ */

    /* Three separate things were wrong about the thirty-three page
       Black Flag Resynced topic and none could be reproduced from any
       other saved page. */
    {
        name: "releases: a version with no v on it is still a version",
        url: HV,
        run: () => {
            const rows = Array.from(document.querySelectorAll(".rr-releases__row"));
            if (!rows.length) return "nothing on this page reads as a release";

            const find = (who) => rows.find((r) =>
                (r.querySelector(".rr-releases__who") || {}).textContent === who);

            /* "Game version is Title Update 1.0.7". Ubisoft ships Title
               Updates; a pattern that wants a v finds no version in
               thirty-three pages of this topic. */
            const release = find("DenuvOwO");
            if (!release) return "the release post was not listed at all";
            const version = release.querySelector(".rr-releases__version").textContent.trim();
            if (version === "\u2014") return "Title Update 1.0.7 was read as no version at all";
            /* And read whole. A <br> contributes no text, so the number
               is welded to the next line — "1.0.7Learn more here" — and
               a trailing word boundary backtracks to "1.0". */
            if (version === "v1.0") return "the version was cut short at the line break: " + version;
            return version === "v1.0.7" ? null : "read as " + version + ", wanted v1.0.7";
        },
    },
    {
        name: "releases: a bare number in a changelog does not become the game's version",
        url: HV,
        settle: 500,
        fresh: true,
        run: () => {
            const control = Array.from(document.querySelectorAll(".rr-releases__tab"))
                .find((n) => /All \d+ page/.test(n.textContent));
            control.click();
            return new Promise((resolve) => {
                const deadline = Date.now() + 30000;
                const look = () => {
                    const tab = Array.from(document.querySelectorAll(".rr-releases__tab"))
                        .find((n) => /All \d+ page|Reading /.test(n.textContent));
                    if (!tab || tab.disabled) {
                        if (Date.now() > deadline) return resolve("the walk never finished");
                        return void setTimeout(look, 150);
                    }
                    const said = (document.querySelector(".rr-releases__latest") || {}).textContent || "";
                    /* "Updated TestGameFix to 2.8.3!" — a mod's version,
                       read as a bare three-part number. It is on its row
                       and it is not the headline. */
                    if (/2\.8\.3/.test(said)) return resolve("a mod's changelog number became the headline: " + said);
                    if (!/1\.0\.7/.test(said)) return resolve("the headline says " + said);
                    const row = Array.from(document.querySelectorAll(".rr-releases__row"))
                        .find((r) => (r.querySelector(".rr-releases__who") || {}).textContent === "Lumi_");
                    if (!row) return resolve("the changelog post was dropped");
                    const shown = row.querySelector(".rr-releases__version").textContent.trim();
                    return resolve(shown === "v2.8.3" ? null : "its row shows " + shown + ", wanted v2.8.3");
                };
                setTimeout(look, 150);
            });
        },
    },
    {
        name: "releases: 1.06 and 1.0.6 are the same release",
        url: HV,
        settle: 500,
        fresh: true,
        run: () => {
            /* This board writes one Title Update both ways, and read as
               two parts 1.06 is one-point-six — which beats 1.0.7 on
               the second digit. The live topic announced a game on 1.06
               whose newest release was 1.0.7. */
            const list = document.querySelector(".rr-releases__list");
            if (!list) return "no list";
            const probe = document.createElement("li");
            probe.className = "rr-releases__row";
            // Nothing to poke at from the page: this is arithmetic, so
            // it is checked through the one thing that exposes it — the
            // headline, on a topic that contains both spellings.
            const control = Array.from(document.querySelectorAll(".rr-releases__tab"))
                .find((n) => /All \d+ page/.test(n.textContent));
            control.click();
            return new Promise((resolve) => {
                const deadline = Date.now() + 30000;
                const look = () => {
                    const tab = Array.from(document.querySelectorAll(".rr-releases__tab"))
                        .find((n) => /All \d+ page|Reading /.test(n.textContent));
                    if (!tab || tab.disabled) {
                        if (Date.now() > deadline) return resolve("the walk never finished");
                        return void setTimeout(look, 150);
                    }
                    const said = (document.querySelector(".rr-releases__latest") || {}).textContent || "";
                    if (/1\.06/.test(said)) return resolve("1.06 was read as 1.6 and won: " + said);
                    return resolve(/1\.0\.7/.test(said) ? null : "the headline says " + said);
                };
                setTimeout(look, 150);
            });
        },
    },
    {
        name: "releases: a build date is not a version",
        url: HV,
        run: () => {
            /* Off the live board, on a trainer post:
               "…Plus.30. Trainer.Updated.2026.09.02 -FLiNG". The rule
               that reads "Updated 1.0.5" as a version reads that the
               same way, and 2026.09.02 beats every real version this
               board will ever see. */
            const rows = Array.from(document.querySelectorAll(".rr-releases__row"));
            if (!rows.length) return "nothing on this page reads as a release";
            const dated = rows.filter((r) => /20\d\d\u202f?\.?\d/.test(
                (r.querySelector(".rr-releases__version") || {}).textContent || ""));
            if (dated.length) {
                return "a date is showing as a version: "
                    + dated[0].querySelector(".rr-releases__version").textContent.trim();
            }
            // And the post it came from still has the version it
            // actually names, earlier in the same line.
            const who = (row) => (row.querySelector(".rr-releases__who") || {}).textContent;
            const fling = rows.find((r) => who(r) === "kanggg");
            if (!fling) return "the trainer post was not listed";
            const version = fling.querySelector(".rr-releases__version").textContent.trim();
            return version === "v1.0"
                ? null
                : "the trainer post reads " + version + ", wanted the v1.0 it names";
        },
    },
    {
        name: "releases: a hypervisor crack says so",
        url: HV,
        run: () => {
            const tags = Array.from(document.querySelectorAll(".rr-releases__tag"))
                .map((t) => t.textContent.trim());
            if (!tags.includes("Hypervisor")) {
                return "no post was marked as one: " + Array.from(new Set(tags)).join(", ");
            }
            // Announced two ways in these posts — "…Resynced
            // HYPERVISOR" in a title line and "on HV releases"
            // underneath — and both have to count.
            const rows = Array.from(document.querySelectorAll(".rr-releases__row"));
            const marked = rows.filter((r) => /Hypervisor/.test(r.textContent));
            if (marked.length < 2) return "only " + marked.length + " post(s) recognised";

            // And it is coloured as what it is: something that makes
            // the game run, beside Crack rather than beside Trainer.
            const tag = document.querySelector('.rr-releases__tag[data-kind="hypervisor"]');
            if (!tag) return "the tag carries no kind";
            return tag.getAttribute("data-family") === "run"
                ? null
                : "filed under " + tag.getAttribute("data-family");
        },
    },
    {
        name: "releases: somebody else's version is not the game's",
        url: HV,
        settle: 500,
        fresh: true,
        run: () => {
            const control = Array.from(document.querySelectorAll(".rr-releases__tab"))
                .find((n) => /All \d+ page/.test(n.textContent));
            if (!control) return "no way to read the whole topic";
            control.click();

            return new Promise((resolve) => {
                const deadline = Date.now() + 30000;
                const look = () => {
                    const tab = Array.from(document.querySelectorAll(".rr-releases__tab"))
                        .find((n) => /All \d+ page|Reading /.test(n.textContent));
                    if (!tab || tab.disabled) {
                        if (Date.now() > deadline) return resolve("the walk never finished");
                        return void setTimeout(look, 150);
                    }
                    const latest = document.querySelector(".rr-releases__latest");
                    if (!latest) return resolve("the whole-topic read has no headline");
                    const said = latest.textContent.trim();

                    /* A post about achievement popups says "Download
                       v9.9.9 or later lightweight AchievementOverlay by
                       Oleg Savelyev". That is somebody else's utility,
                       and on the live board its version beat the game's
                       on the second digit and became the headline. */
                    if (/9\.9\.9/.test(said)) {
                        return resolve("the headline is a third-party tool's version: " + said);
                    }
                    if (!/1\.0\.7/.test(said)) return resolve("the headline says " + said + ", wanted v1.0.7");

                    /* The tool is still listed. Only the one line is
                       decided differently. It is found by who posted it
                       rather than by the 9.9.9: the same post also says
                       "cheat tables for 1.0.4", and a bare three-part
                       number now reads as a version, so the row carries
                       the game version the tables are for — which is the
                       better reading of that post. */
                    const rows = Array.from(document.querySelectorAll(".rr-releases__row"));
                    const tool = rows.find((r) => (r.querySelector(".rr-releases__who") || {}).textContent === "ant_sh");
                    return resolve(tool ? null : "the tool post was dropped from the list instead");
                };
                setTimeout(look, 150);
            });
        },
    },

    {
        name: "releases: a page with nothing on it still offers the rest of the topic",
        url: "/forum/thread/viewtopic.php?f=14&t=920000&start=6",
        run: () => {
            /* Page two of the five page thread is chatter with one
               release; whichever page of a multi-page topic has no
               release of its own, the panel must still be there,
               because it is the only route to the pages that do. Four
               request threads in a row on the live board had no panel
               at all. */
            const panel = document.querySelector(".rr-releases");
            if (!panel) return "no panel on a page of a five page topic";
            const whole = Array.from(panel.querySelectorAll(".rr-releases__tab"))
                .find((n) => /All \d+ pages/.test(n.textContent));
            if (!whole) return "the whole-topic control is missing";
            return whole.disabled ? "the whole-topic control is disabled" : null;
        },
    },
    {
        name: "releases: a one page topic with nothing on it gets no panel",
        url: SINGLE,
        settings: { finder: true },
        run: () => {
            // SINGLE has two releases; the assertion is about the rule,
            // so strip them and re-ask: with no rows and one page there
            // must be nothing to say.
            const rows = document.querySelectorAll(".rr-releases__row").length;
            return rows > 0 ? null : (document.querySelector(".rr-releases") ? "an empty panel on a one page topic" : null);
        },
    },
    {
        name: "focus: a submit button keeps its ring",
        url: TOPIC,
        fresh: true,
        run: () => {
            const go = document.querySelector(".rr-search__go");
            if (!go) return "no submit button in the topic search";
            go.focus();
            // Programmatic focus does not set :focus-visible in every
            // engine; read the rule rather than the state.
            const rules = [];
            for (const sheet of document.styleSheets) {
                let list; try { list = Array.from(sheet.cssRules); } catch { continue; }
                for (const r of list) {
                    if (!r.selectorText || !/outline/.test(r.style.cssText)) continue;
                    for (const sel of r.selectorText.split(",")) {
                        const one = sel.trim().replace(/:focus(-visible|-within)?/g, "");
                        try { if (go.matches(one)) rules.push({ sel: sel.trim(), outline: r.style.outline || r.style.outlineStyle }); } catch { /* */ }
                    }
                }
            }
            const killer = rules.find((r) => /:focus/.test(r.sel) && !/focus-visible/.test(r.sel) && /none/.test(r.outline));
            return killer ? "a rule strips the ring from this button: " + killer.sel.slice(0, 60) : null;
        },
    },

    {
        name: "print: a folded signature opens on paper",
        url: REPLIES,
        media: "print",
        run: () => {
            const folded = Array.from(document.querySelectorAll('[data-rr-sig="collapsed"]'));
            if (!folded.length) return "no folded signature on this page";
            /* Quotes and short replies unfolded on paper; signatures were
               the one fold that stayed shut, because theirs is
               display:none rather than a clip. Every one has to be laid
               out, and the control that would have opened it has to be
               gone with the other controls. */
            const shut = folded.filter((s) => getComputedStyle(s).display === "none");
            if (shut.length) return shut.length + " of " + folded.length + " signatures still hidden in print";
            const toggles = Array.from(document.querySelectorAll(".rr-sig-toggle"))
                .filter((t) => getComputedStyle(t).display !== "none");
            return toggles.length ? toggles.length + " signature control(s) printed" : null;
        },
    },
    {
        name: "print: nothing fixed is left to repeat on every sheet",
        url: REPLIES,
        media: "print",
        run: () => {
            const stuck = [];
            for (const node of document.querySelectorAll("body *")) {
                const style = getComputedStyle(node);
                if (style.display === "none") continue;
                if (style.position !== "fixed" && style.position !== "sticky") continue;
                stuck.push(node.tagName + "." + String(node.className).split(" ")[0]);
            }
            // The skip link was position:fixed and translated off the top,
            // which print media draws at the head of every page.
            return stuck.length ? "still fixed or sticky in print: " + stuck.slice(0, 4).join(", ") : null;
        },
    },

    /* ---- The releases panel ---------------------------------------- */
    {
        name: "releases: both scopes are offered on a one page topic too",
        url: SINGLE,
        run: () => {
            const tabs = Array.from(document.querySelectorAll(".rr-releases__tab"));
            if (tabs.length !== 2) {
                return tabs.length + " scope(s) on a one page topic: it reads as a label, not a control";
            }
            const whole = tabs[1];
            if (!whole.disabled) return "the whole-topic scope is offered on a topic that has one page";
            if (!whole.getAttribute("title")) return "disabled without saying why";
            return null;
        },
    },
    {
        name: "releases: every kind the finder knows has a colour",
        url: THREAD,
        arg: { ids: RELEASE_KIND_IDS, families: RELEASE_FAMILIES },
        run: (spec) => {
            /* Two halves, and both used to fail. Every kind the finder
               can put on a row has to belong to a family, and every
               family has to paint something — five of the eleven kinds
               were coloured and six came out grey, which read as a
               taxonomy and was really a list of the ones somebody had
               got round to. */
            const missing = spec.ids.filter((id) => !spec.families[id]);
            if (missing.length) return "no family for: " + missing.join(", ");

            const probe = document.createElement("span");
            probe.className = "rr-releases__tag";
            probe.textContent = "x";
            document.body.append(probe);
            probe.setAttribute("data-family", "other");
            const neutral = getComputedStyle(probe).color;

            const themes = ["native", "slate", "carbon", "paper"];
            const root = document.documentElement;
            const was = root.getAttribute("data-rr-theme");
            const problems = [];

            for (const theme of themes) {
                root.setAttribute("data-rr-theme", theme);
                const painted = new Map();
                for (const family of Array.from(new Set(Object.values(spec.families)))) {
                    probe.setAttribute("data-family", family);
                    const colour = getComputedStyle(probe).color;
                    if (colour === neutral) { problems.push(theme + ": " + family + " paints nothing"); continue; }
                    /* Six families that come out as five colours is
                       five families with a mistake in them. The first
                       mapping put "what makes it start" and "what stops
                       it" on two tokens that are the same red on the
                       board's own palette. */
                    if (painted.has(colour)) {
                        problems.push(theme + ": " + family + " and " + painted.get(colour) + " are the same colour");
                    }
                    painted.set(colour, family);
                }
            }
            if (was) root.setAttribute("data-rr-theme", was);
            probe.remove();
            return problems.length ? problems.slice(0, 3).join("; ") : null;
        },
    },
    {
        name: "releases: a build id, a version and nothing are three different things",
        url: THREAD,
        run: () => {
            const cells = Array.from(document.querySelectorAll(".rr-releases__version"));
            if (!cells.length) return "no rows to look at";
            const kinds = new Set(cells.map((c) => c.getAttribute("data-rr-kind")));
            if (kinds.has(null) || kinds.has("")) return "a version cell with no kind on it";
            for (const cell of cells) {
                const kind = cell.getAttribute("data-rr-kind");
                const text = cell.textContent.trim();
                if (kind === "version" && !/^v\d/.test(text)) return "a version that does not read as one: " + text;
                if (kind === "build" && !/^build/i.test(text)) return "a build id dressed as a version: " + text;
                if (kind === "none" && !cell.getAttribute("title")) {
                    return "an empty version with no explanation";
                }
                if (kind === "none" && !cell.getAttribute("aria-label")) {
                    return "an em dash and nothing for a screen reader";
                }
            }
            return null;
        },
    },
    {
        name: "releases: dates read the way the rest of the board's do",
        url: THREAD,
        run: () => {
            const when = Array.from(document.querySelectorAll(".rr-releases__when"));
            if (!when.length) return "no dated rows";
            for (const cell of when) {
                if (/(Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day/.test(cell.textContent)) {
                    return "weekday still printed: " + cell.textContent.trim();
                }
                if (!cell.getAttribute("title")) return "the full date is not kept on hover";
            }
            return null;
        },
    },
    {
        name: "releases: reading it again asks for two pages, not twenty",
        fresh: true,
        settle: 500,
        url: LONG,
        run: () => {
            const asked = () => performance.getEntriesByType("resource")
                .filter((e) => /viewtopic/.test(e.name) && /start=/.test(e.name)).length;

            const control = Array.from(document.querySelectorAll(".rr-releases__tab"))
                .find((n) => /All \d+ page/.test(n.textContent));
            const before = asked();
            control.click();

            const settled = () => {
                const tab = Array.from(document.querySelectorAll(".rr-releases__tab"))
                    .find((n) => /All \d+ page|Reading /.test(n.textContent));
                return tab && !tab.disabled;
            };
            const wait = (then) => {
                const deadline = Date.now() + 40000;
                const look = () => {
                    if (settled()) return then();
                    if (Date.now() > deadline) return then("timed out");
                    setTimeout(look, 200);
                };
                setTimeout(look, 200);
            };

            return new Promise((resolve) => {
                wait((timeout) => {
                    if (timeout) return resolve(timeout);
                    const first = asked() - before;
                    if (first !== 19) return resolve("first scan asked for " + first + " pages, wanted 19");

                    const again = Array.from(document.querySelectorAll(".rr-releases .rr-btn"))
                        .find((b) => /read it again/i.test(b.textContent));
                    if (!again) return resolve("no Read it again control");
                    const mark = asked();
                    again.click();
                    wait((late) => {
                        if (late) return resolve(late);
                        const second = asked() - mark;
                        if (second > 3) {
                            return resolve("reading it again asked for " + second + " pages: the cache did nothing");
                        }
                        const rows = document.querySelectorAll(".rr-releases__row").length;
                        return resolve(rows === 20 ? null : rows + " rows after reading it again, wanted 20");
                    });
                });
            });
        },
    },

    /* ---- The topic action bar ------------------------------------- */

    /* The bar used to react to how many controls a topic happened to
       have: on a one page topic the search sat inline, on a twenty
       page one the pager pushed it on to a line of its own. Two shapes
       for the same interface, for a reason a reader could not name. */
    {
        name: "topic bar: the same two rows on a one page topic and a long one",
        url: SINGLE,
        run: () => {
            const rows = Array.from(document.querySelectorAll(".rr-topicbar__row"));
            if (rows.length !== 2) return rows.length + " rows on a one page topic";
            const here = document.querySelector('.rr-topicbar__row[data-rr-row="here"]');
            const away = document.querySelector('.rr-topicbar__row[data-rr-row="away"]');
            if (!here || !away) return "the rows are not the two that were declared";
            // The search is in the second row on every topic, so it can
            // never be seen to move between them.
            if (!away.querySelector(".rr-topicbar__search")) return "the search is not in the second row";
            if (here.querySelector(".rr-topicbar__search")) return "the search is in the first row";
            return null;
        },
    },
    {
        name: "topic bar: twenty pages does not change its shape",
        url: LONG,
        run: () => {
            const rows = Array.from(document.querySelectorAll(".rr-topicbar__row"));
            if (rows.length !== 2) return rows.length + " rows on a twenty page topic";
            const here = document.querySelector('.rr-topicbar__row[data-rr-row="here"]');
            if (!here.querySelector(".rr-pager")) return "the pager is not in the first row";
            const away = document.querySelector('.rr-topicbar__row[data-rr-row="away"]');
            if (here.querySelector(".rr-topicbar__search")) return "the search moved rows";
            return away ? null : "no second row";
        },
    },
    {
        name: "topic bar: page controls cannot be read as topic controls",
        url: LONG,
        run: () => {
            const pager = document.querySelector(".rr-pager");
            const nav = Array.from(document.querySelectorAll(".rr-topicnav"));
            if (!pager || !nav.length) return "nothing to tell apart on this page";

            // Different rows.
            const pagerRow = pager.closest(".rr-topicbar__row").getAttribute("data-rr-row");
            const navRow = nav[0].closest(".rr-topicbar__row").getAttribute("data-rr-row");
            if (pagerRow === navRow) return "both sets of controls are in the " + pagerRow + " row";

            // And no two controls anywhere in the bar answer to the
            // same name.
            const all = Array.from(document.querySelectorAll(".rr-topicbar a, .rr-topicbar button"));
            const names = all.map((n) => (n.getAttribute("aria-label") || n.textContent).trim().toLowerCase())
                .filter(Boolean);
            const seen = new Set();
            for (const name of names) {
                if (seen.has(name)) return "two controls both called " + JSON.stringify(name);
                seen.add(name);
            }
            return null;
        },
    },
    {
        name: "topic bar: Page 1 of 1 is not a control",
        url: SINGLE,
        run: () => {
            const bar = document.querySelector(".rr-topicbar");
            if (!bar) return "no topic bar";
            return /Page\s+1\s+of\s+1/.test(bar.textContent)
                ? '"Page 1 of 1" still takes room on a single page topic'
                : null;
        },
    },
    {
        name: "topic bar: one action carries the weight of a primary button",
        url: TOPIC,
        run: () => {
            const primaries = Array.from(document.querySelectorAll(".rr-topicbar .rr-btn"))
                .filter((b) => b.getAttribute("data-variant") === "primary");
            if (primaries.length > 1) {
                return primaries.length + " primary buttons: " + primaries.map((b) => b.textContent.trim()).join(", ");
            }
            // And nothing secondary is drawn at the same weight: an
            // unmarked .rr-btn is the outlined default, which is what
            // "Open all N spoilers" used to be.
            const loud = Array.from(document.querySelectorAll('.rr-topicbar__row[data-rr-row="here"] .rr-btn'))
                .filter((b) => !b.getAttribute("data-variant"));
            return loud.length
                ? loud.length + " secondary control(s) at full weight: " + loud[0].textContent.trim()
                : null;
        },
    },
    {
        name: "topic bar: the prefix badge sits on the title's own line",
        url: TOPIC,
        run: () => {
            const heading = document.querySelector("#pageheader h2");
            const badge = heading && heading.querySelector(".rr-tag");
            if (!badge) return "no prefix on this topic";
            const link = heading.querySelector("a.titles") || heading;
            const a = badge.getBoundingClientRect();
            const b = link.getBoundingClientRect();
            const drift = Math.abs((a.top + a.height / 2) - (b.top + b.height / 2));
            return drift > 3 ? "badge is " + drift.toFixed(1) + "px off the title's centre" : null;
        },
    },
    {
        name: "topic bar: the forum rules box is not glued to the title",
        url: LONG,
        run: () => {
            const cell = document.querySelector("#wrapcentre td.row3");
            const box = cell && cell.closest("table.tablebg");
            if (!box) return "no forum rules box on this page";
            const next = box.nextElementSibling;
            if (!next) return "nothing follows the rules box";
            const gap = next.getBoundingClientRect().top - box.getBoundingClientRect().bottom;
            return gap < 12 ? "only " + Math.round(gap) + "px between the rules and what follows" : null;
        },
    },

    /* ---- Post chrome ---------------------------------------------- */
    {
        name: "posts: an untranslated rank does not leak into the English board",
        url: TOPIC,
        run: () => {
            const cyrillic = /[Ѐ-ӿ]/;
            const leaked = Array.from(document.querySelectorAll(".rr-posthead__rank"))
                .filter((node) => cyrillic.test(node.textContent))
                .map((node) => node.textContent.trim());
            if (leaked.length) return leaked.length + " rank(s) still in Russian: " + leaked[0];

            // And the English half is still there rather than the whole
            // line having been thrown away.
            const named = Array.from(document.querySelectorAll(".rr-posthead__rank"))
                .filter((node) => node.textContent.trim());
            return named.length ? null : "every rank was dropped, not just the untranslated half";
        },
    },
    {
        name: "posts: the joined line is shortened, not cut mid-value",
        url: TOPIC,
        run: () => {
            const lines = Array.from(document.querySelectorAll(".rr-posthead__meta"));
            if (!lines.length) return "no meta line on any post";
            for (const line of lines) {
                const text = line.textContent;
                if (/\d{1,2}:\s*$|\d{1,2}:…/.test(text)) return "cut inside a time: " + text;
                if (/(Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day/.test(text)) return "weekday kept: " + text;
                // Clipped by CSS rather than shortened at the source.
                if (line.scrollWidth - line.clientWidth > 1) {
                    return "still clipped: " + text + " (" + line.scrollWidth + " into " + line.clientWidth + ")";
                }
                if (!line.getAttribute("title")) return "the full date is not kept on hover";
            }
            return null;
        },
    },
    {
        name: "posts: every control in the row says what it is",
        url: TOPIC,
        run: () => {
            const tools = document.querySelector(".rr-posttools");
            if (!tools) return "no per-post controls";
            const shown = Array.from(tools.children).filter((n) => n.getBoundingClientRect().width);
            const nameless = shown.filter((node) => {
                const name = (node.getAttribute("aria-label") || node.getAttribute("title")
                    || node.textContent || "").trim();
                return !name;
            });
            if (nameless.length) return nameless.length + " control(s) with no name";

            // And named where it can be read without hovering for a
            // second: the icons in this row carry no words at all.
            const silent = shown.filter((node) =>
                !node.textContent.trim() && !node.getAttribute("data-rr-tip"));
            if (silent.length) return silent.length + " icon(s) that only answer to a slow tooltip";

            // No two controls going to the same place. The board draws
            // its own "Reply with quote" and this row used to add
            // another, as an icon, pointing at the same URL.
            const seen = new Map();
            for (const node of shown) {
                const href = (node.getAttribute("href") || "").replace(/[?&]sid=[a-f0-9]+/, "");
                if (!href) continue;
                if (seen.has(href)) {
                    return "two controls for one destination: "
                        + (seen.get(href).textContent.trim() || seen.get(href).getAttribute("aria-label"))
                        + " and " + (node.textContent.trim() || node.getAttribute("aria-label"));
                }
                seen.set(href, node);
            }

            // "Post" was the board's permalink, labelled from its alt
            // text, doing what the number beside it now does.
            const labels = Array.from(tools.children)
                .map((node) => node.textContent.trim());
            if (labels.includes("Post")) return 'the ambiguous "Post" control is still there';
            const number = tools.querySelector(".rr-postnum");
            if (!number) return "no post number";
            if (number.tagName !== "A") return "the post number is not the link it replaced";
            return null;
        },
    },

    /* ---- The board's own colours, kept and made readable ----------- */
    {
        name: "ink: a username the board coloured is readable, and still that colour",
        url: FORUM,
        run: () => {
            const lifted = Array.from(document.querySelectorAll("[data-rr-ink]"));
            if (!lifted.length) return "nothing was lifted on a page full of coloured names";

            const parse = (text) => {
                const parts = (text.match(/[\d.]+/g) || []).map(Number);
                return { r: parts[0], g: parts[1], b: parts[2] };
            };
            const channel = (v) => {
                v /= 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            };
            const luma = (c) => 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
            const ratio = (a, b) => {
                const x = luma(a), y = luma(b);
                return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
            };
            const behind = (node) => {
                for (let at = node.parentElement; at; at = at.parentElement) {
                    const c = getComputedStyle(at).backgroundColor;
                    const parts = (c.match(/[\d.]+/g) || []).map(Number);
                    if (parts.length >= 3 && (parts[3] === undefined || parts[3] >= 1)) return parse(c);
                }
                return { r: 0, g: 0, b: 0 };
            };

            for (const node of lifted.slice(0, 12)) {
                const was = parse(node.getAttribute("data-rr-ink"));
                const now = parse(getComputedStyle(node).color);
                const bg = behind(node);

                // Readable where it was not.
                if (ratio(now, bg) < 4.5) {
                    return "still " + ratio(now, bg).toFixed(2) + ":1 after lifting "
                        + node.textContent.trim().slice(0, 16);
                }
                if (ratio(was, bg) >= 4.5) return "a colour that already read was changed anyway";

                /* And still recognisably the colour the board chose:
                   the channel that led still leads. #BF0000 lifted to
                   pure red is readable and is not what this board looks
                   like. */
                const order = (c) => [["r", c.r], ["g", c.g], ["b", c.b]]
                    .sort((a, b) => b[1] - a[1]).map((pair) => pair[0]).join("");
                if (order(was) !== order(now)) {
                    return "the hue moved: " + node.getAttribute("data-rr-ink")
                        + " became " + getComputedStyle(node).color;
                }
            }
            return null;
        },
    },
    {
        name: "ink: switched off, the board's colours are exactly its own",
        url: FORUM,
        settings: { readableInk: false },
        run: () => {
            if (document.querySelector("[data-rr-ink]")) return "a colour was lifted with the switch off";
            const coloured = document.querySelector(".username-coloured");
            if (!coloured) return "no coloured username on this page";
            const written = (coloured.getAttribute("style") || "").match(/color:\s*([^;]+)/);
            if (!written) return "the board did not write a colour here";
            // What the board wrote is what is drawn.
            const probe = document.createElement("span");
            probe.style.color = written[1];
            document.body.append(probe);
            const wanted = getComputedStyle(probe).color;
            probe.remove();
            return getComputedStyle(coloured).color === wanted
                ? null
                : "drawn as " + getComputedStyle(coloured).color + ", the board wrote " + wanted;
        },
    },

    /* ---- Counts and columns ---------------------------------------- */
    {
        name: "listings: a long count is grouped, and still says what it was",
        url: FORUM,
        run: () => {
            const cells = Array.from(document.querySelectorAll(
                'table[data-rr-list] td[data-rr-col="views"], table[data-rr-list] td[data-rr-col="posts"]'));
            const long = cells.filter((c) => /\d/.test(c.textContent) && c.textContent.replace(/\D/g, "").length >= 5);
            if (!long.length) return "no counts long enough to need grouping on this page";

            for (const cell of long) {
                const text = cell.textContent.trim();
                // A narrow no-break space between every three digits,
                // and nothing that could be read as a decimal point.
                if (/\d{5,}/.test(text)) return "still one run of digits: " + text;
                if (/[.,]/.test(text)) return "grouped with a decimal separator: " + text;
                if (!/ /.test(text)) return "grouped with the wrong space: " + JSON.stringify(text);
                if (!cell.getAttribute("title")) return "the board's own figure was not kept: " + text;
                if (cell.getAttribute("title").replace(/\D/g, "") !== text.replace(/\D/g, "")) {
                    return "the grouped figure is not the same number: " + text;
                }
            }
            return null;
        },
    },
    {
        name: "listings: a thousand is grouped, a year is not",
        url: FORUM,
        run: () => {
            const replies = Array.from(document.querySelectorAll('td[data-rr-col="replies"]'))
                .map((c) => c.textContent.trim());
            const fourDigit = replies.filter((t) => t.replace(/\D/g, "").length === 4);
            if (!fourDigit.length) return "no four-digit counts on this page";
            const ungrouped = fourDigit.filter((t) => /^\d{4}$/.test(t));
            if (ungrouped.length) {
                return "a thousand left as one run: " + ungrouped[0]
                    + " (it sits in a column between 545 and 16 736)";
            }
            // And the last-post column, which carries years rather than
            // counts, is untouched.
            const dates = Array.from(document.querySelectorAll('td[data-rr-col="last"]'))
                .map((c) => c.textContent).filter((t) => / /.test(t));
            return dates.length ? "a date was grouped: " + dates[0].trim().slice(0, 40) : null;
        },
    },
    {
        name: "posts: the join year is a year, the post count is a count",
        url: REPLIES,
        run: () => {
            const lines = Array.from(document.querySelectorAll(".rr-posthead__meta"))
                .map((n) => n.textContent);
            if (!lines.length) return "no meta lines";
            for (const line of lines) {
                if (/\d \d{3}(?=[^:]*$)/.test(line) && /Joined[^·]* /.test(line)) {
                    return "the join year was grouped: " + line;
                }
                if (/Joined:[^·]* /.test(line)) return "the join date was grouped: " + line;
            }
            const long = lines.filter((l) => /Posts:\s*\d{4,}/.test(l));
            return long.length ? "a four-figure post count left ungrouped: " + long[0] : null;
        },
    },
    {
        name: "listings: a number is never a name",
        url: TOPIC,
        run: () => {
            /* Grouping is for quantities. An AppID, a post number and a
               Steam build id are names spelled in digits, and a space
               in the middle of one makes it wrong rather than
               readable. */
            const appid = document.querySelector(".rr-game__appid");
            if (appid && / /.test(appid.textContent)) return "the AppID was grouped: " + appid.textContent;
            const nums = Array.from(document.querySelectorAll(".rr-postnum"))
                .filter((n) => / /.test(n.textContent));
            if (nums.length) return "a post number was grouped";
            const builds = Array.from(document.querySelectorAll('.rr-releases__version[data-rr-kind="build"]'))
                .filter((n) => / /.test(n.textContent));
            return builds.length ? "a Steam build id was grouped" : null;
        },
    },
    {
        name: "listings: a column and its heading agree on where the text goes",
        url: FORUM,
        run: () => {
            const table = document.querySelector("table[data-rr-list]");
            if (!table) return "no listing on this page";
            const heads = Array.from(table.querySelectorAll("th[data-rr-col]"));
            if (!heads.length) return "no heading carries a column name";

            for (const th of heads) {
                const name = th.getAttribute("data-rr-col");
                const cell = table.querySelector('td[data-rr-col="' + name + '"]');
                if (!cell) continue;
                const head = getComputedStyle(th).textAlign;
                const body = getComputedStyle(cell).textAlign;
                if (head !== body) return name + ": heading " + head + ", cells " + body;
            }

            // And a count column lines its digits up rather than
            // setting them in a proportional face.
            const count = table.querySelector('td[data-rr-col="views"], td[data-rr-col="posts"]');
            if (count && !/tabular-nums/.test(getComputedStyle(count).fontVariantNumeric)) {
                return "counts are not set on tabular figures";
            }
            return count && getComputedStyle(count).textAlign === "right"
                ? null
                : "counts are not right aligned";
        },
    },

    /* ---- The top bar ----------------------------------------------- */
    {
        name: "top bar: the three icons are named, and named the same way",
        url: FORUM,
        run: () => {
            const actions = document.querySelector(".rr-nav__actions");
            if (!actions) return "no actions in the top bar";
            const buttons = Array.from(actions.querySelectorAll("a, button"));
            if (buttons.length < 2) return "only " + buttons.length + " control(s) to compare";

            // aria-label for the screen reader, data-rr-tip for the drawn
            // tooltip — and no title, which drew the browser's own tooltip
            // over the drawn one a second later: the same words twice.
            const nameless = buttons.filter((node) =>
                !(node.getAttribute("aria-label") || "").trim()
                || !(node.getAttribute("data-rr-tip") || "").trim());
            if (nameless.length) return nameless.length + " icon(s) without both names";
            const doubled = buttons.filter((node) => node.hasAttribute("title"));
            if (doubled.length) return doubled.length + " icon(s) carry a title as well, so two tooltips";

            // One colour. `html[data-rr] a` is (0,1,1) and .rr-icon-btn
            // is (0,1,0), so the ones built as links used to come out
            // in the board's red while the ones built as buttons stayed
            // grey: three controls side by side, two of them coloured
            // as if they meant something the third did not.
            const colours = new Set(buttons.map((node) => getComputedStyle(node).color));
            return colours.size === 1
                ? null
                : buttons.length + " icons in " + colours.size + " colours: "
                    + Array.from(colours).join(" / ");
        },
    },
    {
        name: "top bar: an icon says what it is without waiting a second for it",
        url: FORUM,
        fresh: true,
        run: () => {
            const button = document.querySelector(".rr-nav__actions [data-rr-tip]");
            if (!button) return "nothing in the top bar carries a label";
            const before = getComputedStyle(button, "::after").display;
            if (before !== "none") return "the label is drawn before it is asked for";
            // A hidden-but-laid-out label on a control at the window's
            // edge was 41px of horizontal overflow on every page.
            if (document.body.scrollWidth - window.innerWidth > 1) {
                return "the page overflows by " + (document.body.scrollWidth - window.innerWidth) + "px";
            }
            button.focus();
            const shown = getComputedStyle(button, "::after");
            if (shown.display === "none") return "focusing it shows nothing";
            return shown.content.includes("settings") || shown.content.length > 4
                ? null
                : "the label is empty: " + shown.content;
        },
    },
    {
        name: "top bar: one search shape, not two",
        url: TOPIC,
        run: () => {
            const palette = document.querySelector(".rr-nav__search");
            const board = document.querySelector(".rr-search");
            if (!palette || !board) return "only one of the two search controls is on this page";

            const radius = (node) => getComputedStyle(node).borderTopLeftRadius;
            if (radius(palette) !== radius(board)) {
                return "two corner radii: " + radius(palette) + " and " + radius(board);
            }
            const height = (node) => Math.round(node.getBoundingClientRect().height);
            if (Math.abs(height(palette) - height(board)) > 2) {
                return "two heights: " + height(palette) + " and " + height(board);
            }
            // And nothing that is pressed is a pill any more.
            const reply = Array.from(document.querySelectorAll(".rr-topicbar .rr-btn"))
                .find((b) => /reply/i.test(b.textContent));
            const donate = document.querySelector(".rr-boardbar__donate");
            for (const control of [reply, donate].filter(Boolean)) {
                if (parseFloat(getComputedStyle(control).borderTopLeftRadius) > 20) {
                    return "still a pill: " + control.textContent.trim();
                }
            }
            return null;
        },
    },
    {
        name: "top bar: the board's twelve links are grouped by what they are",
        url: FORUM,
        run: () => {
            const groups = Array.from(document.querySelectorAll(".rr-boardbar__group"));
            if (groups.length < 2) return "the row is still flat: " + groups.length + " group(s)";
            const names = groups.map((g) => g.getAttribute("data-rr-group"));
            if (new Set(names).size !== names.length) return "a group appears twice: " + names.join(", ");

            // Nothing is left loose outside a group, which is how one
            // link ended up alone on a second line.
            const main = document.querySelector(".rr-boardbar__main");
            const loose = Array.from(main.children).filter((n) => !n.classList.contains("rr-boardbar__group"));
            if (loose.length) return loose.length + " link(s) outside every group";

            // And the row is one line at a desktop width.
            const bar = document.querySelector(".rr-boardbar");
            return bar.getBoundingClientRect().height <= 46
                ? null
                : "the row is " + Math.round(bar.getBoundingClientRect().height) + "px tall";
        },
    },
    {
        name: "top bar: the language switch is a switch, and says which one you are on",
        url: FORUM,
        run: () => {
            const group = document.querySelector(".rr-langswitch");
            if (!group) return "the two flags are still two bare flags";
            const options = Array.from(group.querySelectorAll(".rr-langswitch__option"));
            if (options.length !== 2) return options.length + " language(s)";
            for (const option of options) {
                if (!/^(EN|RU)$/.test(option.textContent.trim())) {
                    return "an option with no code on it: " + JSON.stringify(option.textContent.trim());
                }
                if (!option.getAttribute("aria-label")) return "an option with no name";
                if (!/lang=/.test(option.getAttribute("href") || "")) return "an option that goes nowhere";
            }
            const current = options.filter((o) => o.getAttribute("aria-current"));
            if (current.length !== 1) return current.length + " options marked as the current language";
            return current[0].textContent.trim() === "EN" ? null : "marks RU current on an English page";
        },
    },

    /* ---- Reading progress ------------------------------------------ */
    {
        name: "progress: the reading bar is not a stalled loading bar",
        url: REPLIES,
        fresh: true,
        run: () => {
            const bar = document.querySelector(".rr-progress");
            if (!bar) return "no reading indicator";

            // It says what it is, rather than being an anonymous
            // coloured sliver in the corner where loading bars live.
            if (bar.getAttribute("role") !== "progressbar") return "it is not a progressbar";
            if (!bar.getAttribute("aria-label")) return "it has no name";

            // At the top of a page there is nothing to report, and a
            // part-filled bar at y=0 was read as a download stuck at
            // 15%.
            window.scrollTo(0, 0);
            if (!bar.hasAttribute("data-rr-idle")) return "it shows something before the page is scrolled";
            if (parseFloat(getComputedStyle(bar).opacity) > 0.01) return "it is visible at the top of the page";

            // And it belongs to the top bar rather than floating above
            // everything.
            const nav = document.querySelector(".rr-nav");
            if (!nav) return "no top bar to attach to";
            const gap = Math.abs(bar.getBoundingClientRect().bottom - nav.getBoundingClientRect().bottom);
            if (gap > 2) return "it sits " + Math.round(gap) + "px away from the bar's edge";

            window.scrollTo(0, 600);
            return new Promise((resolve) => setTimeout(() => {
                const filled = parseFloat(bar.style.width);
                resolve(filled > 0 && Number(bar.getAttribute("aria-valuenow")) > 0
                    ? null
                    : "scrolling moved nothing: width " + bar.style.width);
            }, 250));
        },
    },
    {
        name: "progress: the corner buttons say what they do",
        url: REPLIES,
        run: () => {
            const fab = document.querySelector(".rr-fab");
            if (!fab) return "no jump buttons";
            const buttons = Array.from(fab.querySelectorAll("button"));
            const nameless = buttons.filter((b) =>
                !(b.getAttribute("aria-label") || "").trim() || !b.getAttribute("data-rr-tip"));
            if (nameless.length) return nameless.length + " unlabelled button(s) in the corner";
            // Their labels hang off their own right edge, or they push
            // the page sideways from the corner they live in.
            const shown = buttons.filter((b) => !b.hidden);
            if (!shown.length) return "both buttons are hidden";
            return shown[0].getAttribute("data-rr-tip-side") === "above"
                ? null
                : "the label would open off the bottom of the window";
        },
    },

    /* ---- Separators the template left behind ---------------------- */

    /* Both of these are logged-in-only, which is why they survived so
       long: every saved page in this harness is a guest view where the
       whole strip is empty. The member fixture prints it. */
    {
        name: "separators: the member's topic actions join the bar without their bars",
        url: MEMBER,
        run: () => {
            // The strip's links are adopted into a cluster in the topic
            // bar; its punctuation stays behind in a cell that is then
            // hidden. None of it may come along.
            const cluster = Array.from(document.querySelectorAll(".rr-topicbar .rr-cluster"))
                .find((node) => /Unsubscribe topic/.test(node.textContent));
            if (!cluster) return "the member topic actions are not in the topic bar";

            if (/\|/.test(cluster.textContent)) return "a separator came along: " + cluster.textContent.trim();

            // And the links themselves are untouched: this moves
            // controls, never loses one.
            const labels = Array.from(cluster.querySelectorAll("a")).map((a) => a.textContent.replace(/\s+/g, " ").trim());
            const wanted = ["Unsubscribe topic", "Bookmark topic", "E-mail friend"];
            const lost = wanted.filter((label) => !labels.includes(label));
            if (lost.length) return "lost a link: " + lost.join(", ");

            const stranded = Array.from(document.querySelectorAll("#wrapcentre td.gensmall, #wrapcentre td.nav"))
                .find((cell) => /\|/.test(cell.textContent) && !cell.querySelector("a") && cell.getBoundingClientRect().width);
            return stranded ? "the emptied strip is still drawn" : null;
        },
    },
    {
        name: "separators: a cell left holding only punctuation stops taking room",
        url: MEMBER,
        run: () => {
            // Every strip the pass looks at, after it has run: none may
            // still be a visible box whose entire content is a bar.
            const strips = Array.from(document.querySelectorAll(
                "#wrapcentre td.gensmall, #wrapcentre td.nav, #wrapcentre p.searchbar"));
            const stranded = strips.filter((cell) => {
                const text = cell.textContent.replace(/[\s ]+/g, "").trim();
                return /^[|·•]+$/.test(text) && cell.getBoundingClientRect().width > 0;
            });
            return stranded.length
                ? stranded.length + " cell(s) still showing nothing but a separator"
                : null;
        },
    },

    /* ---- The donation link ---------------------------------------- */
    {
        name: "donate: the donation link is in the row, quiet, and still the board's own",
        url: INDEX,
        run: () => {
            const link = document.querySelector(".rr-boardbar__donate");
            if (!link) return "the donation link is not in the board bar";
            if (!link.getBoundingClientRect().width) return "invisible";
            const href = link.getAttribute("href") || "";
            if (!/donat/i.test(href)) return "points somewhere else: " + href.slice(0, 50);
            // No heart, no outline of its own: one link among the others.
            if (link.querySelector("svg")) return "still carries an icon";
            const own = getComputedStyle(link);
            const other = getComputedStyle(link.parentElement.querySelector(".rr-boardbar__link:not(.rr-boardbar__donate)") || link);
            if (own.backgroundColor !== other.backgroundColor) return "drawn on its own background";
            return null;
        },
    },

    /* ---- The settings panel --------------------------------------- */
    {
        name: "settings: every feature in the schema has a control",
        fresh: true,
        url: FORUM,
        arg: SCHEMA_IDS,
        run: (ids) => {
            document.querySelector(".rr-nav__actions button[aria-label*='settings']").click();
            const panel = document.querySelector(".rr-panel");
            if (!panel) return "the panel did not open";
            const missing = ids.filter((id) => !panel.querySelector('[data-field="' + id + '"]'));
            return missing.length
                ? missing.length + " setting(s) have no row: " + missing.slice(0, 4).join(", ")
                : null;
        },
    },
    {
        name: "settings: the panel is categorised, one category at a time",
        fresh: true,
        url: FORUM,
        run: () => {
            document.querySelector(".rr-nav__actions button[aria-label*='settings']").click();
            const tabs = Array.from(document.querySelectorAll(".rr-panel__tab"));
            if (tabs.length < 6) return "only " + tabs.length + " categories";

            const shown = () => Array.from(document.querySelectorAll(".rr-group"))
                .filter((g) => g.getBoundingClientRect().height > 0);
            if (shown().length !== 1) return shown().length + " categories on screen at once";

            tabs[3].click();
            const open = shown();
            if (open.length !== 1) return "picking a category showed " + open.length + " of them";
            if (open[0].dataset.group !== tabs[3].dataset.group) return "the wrong category opened";
            if (tabs[3].getAttribute("aria-selected") !== "true") return "the rail did not follow";
            return null;
        },
    },
    {
        name: "settings: search reaches across every category",
        fresh: true,
        url: FORUM,
        run: () => {
            document.querySelector(".rr-nav__actions button[aria-label*='settings']").click();
            const box = document.querySelector(".rr-panel__search");
            box.value = "quote";
            box.dispatchEvent(new Event("input", { bubbles: true }));
            return new Promise((resolve) => setTimeout(() => {
                const rows = Array.from(document.querySelectorAll(".rr-field"))
                    .filter((row) => row.getBoundingClientRect().height > 0);
                if (!rows.length) return resolve("nothing matched that");
                // "Fold long quotes" is under Reading and "Quote what
                // you select" under Posting: a search that only looks in
                // the open category finds one of them.
                const groups = new Set(rows.map((row) => row.closest(".rr-group").dataset.group));
                if (groups.size < 2) return resolve("only found matches in " + Array.from(groups).join(", "));
                const stray = rows.filter((row) => !row.dataset.search.includes("quote"));
                resolve(stray.length ? stray.length + " rows shown that do not match" : null);
            }, 200));
        },
    },
    {
        name: "settings: a dependent control is hidden while its parent is off",
        fresh: true,
        url: FORUM,
        run: () => {
            document.querySelector(".rr-nav__actions button[aria-label*='settings']").click();
            const panel = document.querySelector(".rr-panel");
            // The pair lives under Search, and the panel opens on
            // Appearance: a control in a category nobody opened is
            // hidden for a reason that has nothing to do with this.
            const tab = panel.querySelector('.rr-panel__tab[data-group="find"]');
            if (!tab) return "no Search category";
            tab.click();
            const parent = panel.querySelector('[data-field="finder"] .rr-switch');
            const child = panel.querySelector('[data-field="topicIndex"]');
            if (!parent || !child) return "the pair is not in the panel";
            if (!child.getBoundingClientRect().height) return "hidden while its parent is on";
            parent.click();
            if (child.getBoundingClientRect().height) return "still shown after its parent was turned off";
            parent.click();
            return child.getBoundingClientRect().height ? null : "did not come back";
        },
    },

    /* ---- Steam preview -------------------------------------------- */
    {
        name: "steam: a cached game previews on hover with no network call",
        fresh: true,
        offline: true,
        settle: 500,
        url: UNREAD,
        settings: { steamPreview: true, steamLookup: false },
        data: {
            steamApps: { "159345": "271590" },
            steamData: {
                "271590": {
                    at: Date.now(),
                    game: {
                        appId: "271590", name: "Grand Theft Auto V", header: null,
                        released: "13 Apr, 2015", score: "96",
                        tags: ["Action", "Adventure"],
                        blurb: "A cached blurb, served out of this browser.",
                        free: false, kind: "game",
                    },
                },
            },
        },
        run: () => {
            const link = document.querySelector('a.topictitle[href*="t=159345"]');
            if (!link) return "the seeded topic is not on this page";
            link.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
            return new Promise((resolve) => setTimeout(() => {
                const card = document.querySelector(".rr-steam");
                if (!card) return resolve("no card appeared");
                const text = card.textContent;
                if (!text.includes("Grand Theft Auto V")) return resolve("not the cached game: " + text.slice(0, 60));
                if (!text.includes("271590")) return resolve("no AppID on the card");
                if (!text.includes("96")) return resolve("no score on the card");
                if (!text.includes("13 Apr, 2015")) return resolve("no release date on the card");
                if (!card.querySelector(".rr-steam__tag")) return resolve("no tags on the card");
                resolve(null);
            }, 700));
        },
    },
    {
        name: "steam: nothing previews and nothing is fetched when it is off",
        fresh: true,
        offline: true,
        url: UNREAD,
        settings: {},
        run: () => {
            document.querySelector("a.topictitle")
                .dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
            return new Promise((resolve) => setTimeout(() => {
                resolve(document.querySelector(".rr-steam") ? "a card appeared with the setting off" : null);
            }, 600));
        },
    },
    {
        name: "steam: an uncached game says so rather than reaching out",
        fresh: true,
        offline: true,
        url: UNREAD,
        settings: { steamPreview: true, steamLookup: false },
        run: () => {
            document.querySelector("a.topictitle")
                .dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
            return new Promise((resolve) => setTimeout(() => {
                const card = document.querySelector(".rr-steam");
                if (!card) return resolve("no card and no explanation");
                resolve(/cache|settings/i.test(card.textContent) ? null : "said: " + card.textContent.slice(0, 60));
            }, 700));
        },
    },

    {
        name: "steam: an unknown game is looked up by name and cached",
        fresh: true,
        stub: [
            {
                match: "/api/storesearch",
                body: { total: 1, items: [{ id: 570, name: "Dota 2", tiny_image: "", price: {} }] },
            },
            {
                match: "/api/appdetails",
                body: {
                    "570": {
                        success: true,
                        data: {
                            type: "game", name: "Dota 2", is_free: true,
                            short_description: "Every day, millions of players worldwide enter the battle.",
                            header_image: "", release_date: { coming_soon: false, date: "9 Jul, 2013" },
                            genres: [{ description: "Action" }, { description: "Strategy" }],
                            metacritic: { score: 90 },
                        },
                    },
                },
            },
        ],
        url: UNREAD,
        settings: { steamPreview: true, steamLookup: true },
        run: () => {
            const link = document.querySelector("a.topictitle");
            link.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
            /* The card says "Looking this one up…" while the two
               requests are in flight, so the check waits for it to
               stop saying that rather than for a fixed 1400 ms — which
               was long enough most of the time, and a failure that
               reads exactly like a broken lookup the rest of it. */
            const settled = () => {
                const card = document.querySelector(".rr-steam");
                return card && !/looking this one up/i.test(card.textContent);
            };
            return new Promise((resolve) => {
                const deadline = Date.now() + 15000;
                const look = () => {
                    if (!settled() && Date.now() < deadline) return void setTimeout(look, 100);
                    resolve();
                };
                look();
            }).then(() => {
                const card = document.querySelector(".rr-steam");
                if (!card) return "no card appeared";
                if (!card.textContent.includes("Dota 2")) {
                    return "the looked-up game did not reach the card: " + card.textContent.slice(0, 60);
                }
                if (!card.textContent.includes("Free to play")) return "is_free was dropped";
                if (!card.textContent.includes("9 Jul, 2013")) return "the release date was dropped";
                // And the answer was written down, so the next hover
                // over the same row costs nothing.
                let stored = {};
                try { stored = JSON.parse(localStorage.getItem("rr:data") || "{}"); } catch { /* private mode */ }
                if (!stored.steamData || !stored.steamData["570"]) return "the lookup was not cached";
                return null;
            });
        },
    },
    {
        name: "steam: a title is all that is ever sent, and only once",
        fresh: true,
        stub: [
            { match: "/api/storesearch", body: { total: 0, items: [] } },
        ],
        url: UNREAD,
        settings: { steamPreview: true, steamLookup: true },
        run: () => {
            // Hovering the same row four times must not be four
            // requests: a miss is written down the way a hit is.
            const link = document.querySelector("a.topictitle");
            for (let i = 0; i < 4; i += 1) {
                link.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
                link.dispatchEvent(new PointerEvent("pointerout", { bubbles: true }));
            }
            link.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
            return new Promise((resolve) => setTimeout(() => {
                let stored = {};
                try { stored = JSON.parse(localStorage.getItem("rr:data") || "{}"); } catch { /* private mode */ }
                const misses = stored.steamMisses || {};
                const terms = Object.keys(misses);
                if (!terms.length) return resolve("the miss was not remembered, so it would be asked again");
                // The term is the title with the board's own bookkeeping
                // taken off it — no user, no session, no URL.
                const term = terms[0];
                if (/sid=|http|viewtopic/.test(term)) return resolve("more than a game name was sent: " + term);
                resolve(null);
            }, 1400));
        },
    },

    {
        name: "steam: with no grant it says so, instead of blaming Steam",
        fresh: true,
        offline: true,
        url: UNREAD,
        settings: { steamPreview: true, steamLookup: true },
        // The manager's grant, withdrawn: this is the reader whose
        // userscript manager gave the script GM_setValue and nothing
        // else. The board's connect-src 'self' then refuses the
        // request before it leaves, and every game on the board used
        // to come back as "Steam has nothing under that name".
        noGrant: true,
        run: () => {
            document.querySelector("a.topictitle")
                .dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
            return new Promise((resolve) => setTimeout(() => {
                const card = document.querySelector(".rr-steam");
                if (!card) return resolve("no card and no explanation");
                const text = card.textContent;
                if (/has nothing under that name/i.test(text)) {
                    return resolve("blamed Steam for a request that never left");
                }
                resolve(/GM_xmlhttpRequest|could not reach/i.test(text)
                    ? null
                    : "said: " + text.slice(0, 70));
            }, 900));
        },
    },

    /* ---- Accessibility -------------------------------------------- */
    {
        name: "motion: turning animation off actually stops it",
        fresh: true,
        url: FORUM,
        settings: { reduceMotion: true },
        run: () => {
            const speed = getComputedStyle(document.documentElement).getPropertyValue("--rr-speed").trim();
            if (speed !== "0ms") return "--rr-speed is " + speed;
            const button = document.querySelector(".rr-btn");
            const duration = button && getComputedStyle(button).transitionDuration;
            return duration && parseFloat(duration) > 0.01 ? "buttons still transition over " + duration : null;
        },
    },
    {
        name: "skip link: always there, and first in the tab order",
        fresh: true,
        url: FORUM,
        run: () => {
            const skip = document.querySelector(".rr-skip");
            if (!skip) return "no skip link";
            return document.body.firstElementChild === skip ? null : "not the first thing in the page";
        },
    },

    /* ---- The index page ------------------------------------------- */
    {
        name: "index: the category collapse control is usable and can be seen",
        url: INDEX,
        run: () => {
            // The board ships this as <input type="button" value=" ">
            // drawn entirely by a background image: a button with a
            // single space for a name, which is no name at all.
            const toggles = Array.from(document.querySelectorAll(".ccclose, .ccopen"));
            if (!toggles.length) return "the index drew no collapse control";

            const problems = [];
            for (const toggle of toggles) {
                const box = toggle.getBoundingClientRect();
                const style = getComputedStyle(toggle);
                const focusable = /^(INPUT|BUTTON|A)$/.test(toggle.tagName)
                    || toggle.getAttribute("tabindex") === "0";
                const name = (toggle.getAttribute("aria-label") || "").trim();
                const glyph = (toggle.tagName === "INPUT" ? toggle.value : toggle.textContent).trim();

                if (!focusable) problems.push("not reachable by keyboard");
                else if (name.length < 4) problems.push("no accessible name");
                else if (!toggle.hasAttribute("aria-expanded")) problems.push("does not say its state");
                else if (box.width < 16 || box.height < 16) {
                    problems.push("only " + Math.round(box.width) + "x" + Math.round(box.height));
                }
                // The arrow is the input's value, because ::after
                // generates nothing on a replaced element. Drawn at 0px
                // — which is what the board's own cascade resolved it
                // to — the control is a bordered empty box.
                else if (!glyph) problems.push("nothing drawn in it");
                else if (parseFloat(style.fontSize) < 9) problems.push("its glyph is set at " + style.fontSize);
            }
            return problems.length ? toggles.length + " toggles: " + problems[0] : null;
        },
    },
    {
        name: "index: collapsing a category says so",
        fresh: true,
        url: INDEX,
        run: () => {
            const toggle = document.querySelector(".ccclose, .ccopen");
            if (!toggle) return "no collapse control";
            const before = toggle.getAttribute("aria-expanded");
            const nameBefore = toggle.getAttribute("aria-label");
            toggle.click();
            return new Promise((resolve) => setTimeout(() => {
                if (toggle.getAttribute("aria-expanded") === before) {
                    return resolve("aria-expanded stayed " + before);
                }
                if (toggle.getAttribute("aria-label") === nameBefore) {
                    return resolve("still says \"" + nameBefore + "\" after flipping");
                }
                resolve(null);
            }, 60));
        },
    },
    {
        name: "index: last post reads the same way it does in a listing",
        url: INDEX,
        run: () => {
            // The index lists forums, not topics, and the module that
            // joins this column used to give up before reaching it the
            // moment it found no topic rows. The same column then read
            // on one line in a forum listing and on two on the page in
            // front of it.
            const cells = Array.from(document.querySelectorAll('td[data-rr-col="last"]'))
                .filter((td) => td.textContent.trim());
            if (!cells.length) return "no last-post cells on the index";
            const stacked = cells.filter((td) =>
                Array.from(td.children).filter((n) => n.tagName === "P").length > 1);
            return stacked.length ? stacked.length + " of " + cells.length + " still stacked" : null;
        },
    },
    {
        name: "index: Who is online folds without being read in English",
        url: INDEX,
        run: () => {
            const block = document.querySelector(".rr-online");
            if (!block) return "the list was not folded";
            const toggle = block.querySelector(".rr-btn");
            if (!toggle) return "no control to open it";
            if (toggle.getAttribute("aria-expanded") !== "false") return "it did not start folded";
            // The names are still in the page, only hidden behind the
            // control — nothing was thrown away to fold them.
            const names = block.parentElement.querySelectorAll("a[href*='viewprofile']");
            return names.length > 30 ? null : "only " + names.length + " names survived the fold";
        },
    },

    /* ---- The whole-topic index -------------------------------------- */
    {
        name: "index: reads every page of the topic, and the current one only once",
        fresh: true,
        settle: 500,
        url: THREAD,
        run: () => {
            const tab = Array.from(document.querySelectorAll(".rr-releases__tab"))
                .find((n) => /All \d+ pages/.test(n.textContent));
            if (!tab) return "no way to read the whole topic";
            tab.click();
            return new Promise((resolve) => setTimeout(() => {
                const panel = document.querySelector(".rr-releases");
                if (!panel) return resolve("no index appeared");
                const note = panel.querySelector(".rr-releases__note").textContent;
                if (!/5 pages read/.test(note)) return resolve("note says: " + note.slice(0, 60));
                resolve(null);
            }, 4000));
        },
    },
    {
        name: "index: lists every release across all five pages",
        fresh: true,
        settle: 500,
        url: THREAD,
        run: () => {
            Array.from(document.querySelectorAll(".rr-releases__tab"))
                .find((n) => /All \d+ pages/.test(n.textContent)).click();
            return new Promise((resolve) => setTimeout(() => {
                const rows = Array.from(document.querySelectorAll(".rr-releases__row"))
                    .map((n) => n.textContent.replace(/\s+/g, " ").trim());
                // Fifteen things were posted in this topic. Anything
                // fewer means a page was missed or a kind was not
                // recognised; anything more means chatter got in.
                if (rows.length !== 17) return resolve(rows.length + " rows, expected 17");

                // One page must be represented by each of its three.
                const pages = rows.map((r) => (r.match(/p\.(\d)$/) || [])[1]);
                const perPage = { "1": 3, "2": 3, "3": 3, "4": 3, "5": 5 };
                for (const [page, want] of Object.entries(perPage)) {
                    const got = pages.filter((p) => p === page).length;
                    if (got !== want) return resolve("page " + page + " contributed " + got + " rows, expected " + want);
                }
                resolve(null);
            }, 4000));
        },
    },
    {
        name: "index: the newest version wins, and 1.10 is after 1.3",
        fresh: true,
        settle: 500,
        url: THREAD,
        run: () => {
            Array.from(document.querySelectorAll(".rr-releases__tab"))
                .find((n) => /All \d+ pages/.test(n.textContent)).click();
            return new Promise((resolve) => setTimeout(() => {
                const latest = document.querySelector(".rr-releases__latest");
                if (!latest) return resolve("nothing said which version is current");
                // Compared as a string, "1.3.0" sorts after "1.10.0",
                // which is the wrong answer to the only question anyone
                // opens a release thread with.
                if (!/v1\.10\.0/.test(latest.textContent)) return resolve("said " + latest.textContent);
                const marked = document.querySelectorAll(".rr-releases__version[data-rr-latest]");
                return resolve(marked.length ? null : "no row is marked as the latest");
            }, 4000));
        },
    },
    {
        name: "index: a Steam build id is not a version",
        fresh: true,
        settle: 500,
        url: THREAD,
        run: () => {
            Array.from(document.querySelectorAll(".rr-releases__tab"))
                .find((n) => /All \d+ pages/.test(n.textContent)).click();
            return new Promise((resolve) => setTimeout(() => {
                // "build 24127279" is eight digits. Read as a version it
                // beats every real one in the topic, and the index then
                // announces it as the latest release — which is the one
                // question the whole panel exists to answer.
                const latest = document.querySelector(".rr-releases__latest");
                if (!latest) return resolve("nothing said which version is current");
                if (/24127279/.test(latest.textContent)) return resolve("a build id was called the latest version");
                if (!/v1\.10\.0/.test(latest.textContent)) return resolve("said " + latest.textContent);

                const build = Array.from(document.querySelectorAll(".rr-releases__version"))
                    .find((n) => /24127279/.test(n.textContent));
                if (!build) return resolve("the build post was dropped instead");
                if (/^v/.test(build.textContent.trim())) return resolve("shown as " + build.textContent);
                resolve(build.dataset.rrKind === "build" ? null : "not marked as a build");
            }, 4000));
        },
    },
    {
        name: "index: a reply that only quotes a release is not a release",
        fresh: true,
        settle: 500,
        url: THREAD,
        run: () => {
            Array.from(document.querySelectorAll(".rr-releases__tab"))
                .find((n) => /All \d+ pages/.test(n.textContent)).click();
            return new Promise((resolve) => setTimeout(() => {
                const authors = Array.from(document.querySelectorAll(".rr-releases__who"))
                    .map((n) => n.textContent.trim());
                if (authors.includes("Quoter")) return resolve("listed the reply that only quotes one");
                if (authors.includes("Reader")) return resolve("listed chatter");
                resolve(null);
            }, 4000));
        },
    },
    {
        name: "index: a link labelled Mirror does not make every post a reupload",
        fresh: true,
        settle: 500,
        url: THREAD,
        run: () => {
            Array.from(document.querySelectorAll(".rr-releases__tab"))
                .find((n) => /All \d+ pages/.test(n.textContent)).click();
            return new Promise((resolve) => setTimeout(() => {
                // Every upload in this topic labels its links "Mirror
                // 1", "Mirror 2", the way the board does. Reading those
                // as prose tagged all fifteen as reuploads, including
                // the first release, which by definition is not one.
                const rows = Array.from(document.querySelectorAll(".rr-releases__row"));
                const reuploads = rows.filter((r) => /\breupload\b/i.test(r.getAttribute("data-kinds") || ""));
                if (reuploads.length !== 2) {
                    return resolve(reuploads.length + " rows tagged Reupload, expected the 2 that say so");
                }
                const who = reuploads.map((r) => r.querySelector(".rr-releases__who").textContent.trim());
                resolve(who.every((n) => n === "Mirrorman") ? null : "tagged: " + who.join(", "));
            }, 4000));
        },
    },
    {
        name: "index: a language pack is a thing that was posted",
        fresh: true,
        settle: 500,
        url: THREAD,
        run: () => {
            Array.from(document.querySelectorAll(".rr-releases__tab"))
                .find((n) => /All \d+ pages/.test(n.textContent)).click();
            return new Promise((resolve) => setTimeout(() => {
                // No version, and none of the finder's fifteen release
                // words, so the finder's own bar dropped it — in an
                // index whose job is to list every kind of thing.
                const kinds = Array.from(document.querySelectorAll(".rr-releases__row"))
                    .map((r) => r.getAttribute("data-kinds") || "");
                const missing = ["language", "trainer", "dlc", "online"]
                    .filter((kind) => !kinds.some((k) => k.split(" ").includes(kind)));
                resolve(missing.length ? "never listed: " + missing.join(", ") : null);
            }, 4000));
        },
    },
    {
        name: "index: the filters narrow it",
        fresh: true,
        settle: 500,
        url: THREAD,
        run: () => {
            Array.from(document.querySelectorAll(".rr-releases__tab"))
                .find((n) => /All \d+ pages/.test(n.textContent)).click();
            return new Promise((resolve) => setTimeout(() => {
                const chip = Array.from(document.querySelectorAll(".rr-releases__chip"))
                    .find((n) => n.dataset.kind === "repack");
                if (!chip) return resolve("no Repack filter, though three were posted");
                chip.click();
                const shown = Array.from(document.querySelectorAll(".rr-releases__row"))
                    .filter((r) => !r.hidden);
                // Two in English and one in Russian, which is the point.
                if (shown.length !== 3) return resolve(shown.length + " rows shown, expected 3 repacks");
                chip.click();
                const back = Array.from(document.querySelectorAll(".rr-releases__row")).filter((r) => !r.hidden);
                resolve(back.length === 17 ? null : "unfiltering left " + back.length + " rows");
            }, 4000));
        },
    },
    {
        name: "index: an index already taken is not taken again",
        fresh: true,
        offline: true,
        settle: 600,
        url: THREAD,
        data: {
            topicIndex: {
                "920000": {
                    at: Date.now() - 3600000,
                    total: 5,
                    scanned: 5,
                    done: true,
                    rows: [
                        { id: "920025", page: 5, author: "Uploader", date: "Monday, 25 Jan 2026, 10:00",
                          version: "1.10.0", links: 2, kinds: ["steamfiles"], labels: ["Clean Steam files"],
                          excerpt: "Clean steam files for v1.10.0", score: 9 },
                    ],
                },
            },
        },
        run: () => {
            // Reading nineteen pages of somebody else's board is not
            // something to repeat because a tab was reopened. `offline`
            // on this check refuses every request that leaves the test
            // origin, so a rescan would show up as a failure rather
            // than as a slow pass.
            const panel = document.querySelector(".rr-releases");
            if (!panel) return "the kept index was not offered back";
            const rows = document.querySelectorAll(".rr-releases__row");
            if (rows.length !== 1) return rows.length + " rows from a one-row cache";
            const note = panel.querySelector(".rr-releases__note").textContent;
            return /hour ago|minutes ago/.test(note) ? null : "does not say when it was taken: " + note;
        },
    },
    {
        name: "releases: the two scopes are one panel",
        url: REPLIES,
        run: () => {
            // They were two panels one under the other, listing the
            // same kind of thing about the same posts in two different
            // row shapes.
            if (document.querySelectorAll(".rr-releases").length !== 1) {
                return document.querySelectorAll(".rr-releases").length + " panels";
            }
            const tabs = Array.from(document.querySelectorAll(".rr-releases__tab"));
            if (tabs.length !== 2) return tabs.length + " scopes on a 16 page topic";
            if (tabs[0].getAttribute("aria-selected") !== "true") return "does not open on this page";
            // The link filter came along with it rather than staying
            // loose in the topic bar — and it sits with the scope
            // control rather than at the far end of the card, because
            // the two of them answer the same question.
            const filter = document.querySelector(".rr-releases__controls .rr-releases__only");
            if (!filter || !/only posts with links/i.test(filter.textContent)) {
                return "the link filter is not grouped with the scope control";
            }
            const controls = filter.closest(".rr-releases__controls");
            if (!controls.contains(tabs[0])) return "the two filters are still in different places";
            return null;
        },
    },

    {
        name: "index: nineteen fetches, twenty pages, in order",
        fresh: true,
        settle: 500,
        url: LONG,
        run: () => {
            Array.from(document.querySelectorAll(".rr-releases__tab"))
                .find((n) => /All \d+ pages/.test(n.textContent)).click();
            return new Promise((resolve) => setTimeout(() => {
                const rows = Array.from(document.querySelectorAll(".rr-releases__row"));
                if (rows.length !== 20) return resolve(rows.length + " rows from 20 pages");

                // Newest first, page 20 down to page 1, none missing
                // and none read twice.
                const pages = rows.map((r) => Number((r.textContent.match(/p\.(\d+)$/) || [])[1]));
                for (let i = 0; i < 20; i += 1) {
                    if (pages[i] !== 20 - i) return resolve("row " + i + " is page " + pages[i]);
                }
                const latest = document.querySelector(".rr-releases__latest");
                return resolve(/v20\.0\.0/.test(latest ? latest.textContent : "")
                    ? null
                    : "latest says " + (latest && latest.textContent));
            }, 11000));
        },
    },
    {
        name: "index: a board that starts queueing is given room",
        fresh: true,
        slow: true,
        settle: 500,
        url: LONG,
        run: () => {
            Array.from(document.querySelectorAll(".rr-releases__tab"))
                .find((n) => /All \d+ page/.test(n.textContent)).click();
            return new Promise((resolve) => {
                const deadline = Date.now() + 60000;
                const look = () => {
                    const tab = Array.from(document.querySelectorAll(".rr-releases__tab"))
                        .find((n) => /All \d+ page|Reading /.test(n.textContent));
                    if (tab && !tab.disabled) {
                        const note = document.querySelector(".rr-releases__note");
                        if (!note) return resolve("no note after the walk");
                        if (!note.querySelector(".rr-releases__eased")) {
                            return resolve("the walk never eased off: " + note.textContent.slice(0, 80));
                        }
                        // And it still read the whole topic rather than
                        // giving up on it.
                        const rows = document.querySelectorAll(".rr-releases__row").length;
                        if (rows !== 20) return resolve(rows + " rows from 20 pages after easing off");
                        return resolve(null);
                    }
                    if (Date.now() > deadline) return resolve("the walk never finished");
                    setTimeout(look, 250);
                };
                look();
            });
        },
    },
    {
        name: "index: a topic parses under Trusted Types",
        fresh: true,
        settle: 700,
        url: LONG_TT,
        run: () => {
            // Verified rather than assumed: under
            // require-trusted-types-for 'script' the only way to turn
            // fetched HTML into a document throws, and the walk lives
            // or dies on the policy the script creates for it.
            Array.from(document.querySelectorAll(".rr-releases__tab"))
                .find((n) => /All \d+ pages/.test(n.textContent)).click();
            return new Promise((resolve) => setTimeout(() => {
                if (typeof window.trustedTypes !== "object") return resolve("the header did not apply");
                let refused = false;
                try { new DOMParser().parseFromString("<b>x</b>", "text/html"); }
                catch { refused = true; }
                if (!refused) return resolve("Trusted Types is not being enforced here");

                const rows = document.querySelectorAll(".rr-releases__row");
                resolve(rows.length === 20 ? null : rows.length + " rows: the walk could not read the pages");
            }, 11000));
        },
    },
    {
        name: "index: a kept index says when the topic has moved on",
        fresh: true,
        offline: true,
        settle: 600,
        url: THREAD,
        data: {
            topicIndex: {
                "920000": {
                    at: Date.now() - 7200000, total: 5, scanned: 5, done: true,
                    // Taken when the newest post was 920014, which is
                    // in the middle of page 3 — so the page in front of
                    // us has posts it never saw.
                    newest: 920014,
                    rows: [{ id: "920013", page: 3, author: "Uploader", date: "Monday, 13 Jan 2026, 10:00",
                             version: "1.2.0", build: null, links: 2, kinds: ["steamfiles"],
                             labels: ["Clean Steam files"], excerpt: "", score: 9 }],
                },
            },
        },
        run: () => {
            // A topic gaining replies without gaining a page used to be
            // invisible: the index was offered back as if it were
            // current.
            const stale = document.querySelector(".rr-releases__stale");
            if (!stale) return "nothing said the topic had moved on";
            if (!/newer post/.test(stale.textContent)) return "says: " + stale.textContent;
            const note = document.querySelector(".rr-releases__note");
            return /new since/.test(note.getAttribute("aria-label") || "")
                ? null
                : "the spoken version does not mention it";
        },
    },
    {
        name: "index: the note reads as a sentence, not as run-together spans",
        fresh: true,
        offline: true,
        settle: 600,
        url: THREAD,
        data: {
            topicIndex: {
                "920000": {
                    at: Date.now() - 3600000, total: 5, scanned: 5, done: true, newest: 999999,
                    rows: [{ id: "920025", page: 5, author: "Uploader", date: "x", version: "1.10.0",
                             build: null, links: 2, kinds: ["steamfiles"], labels: ["Clean Steam files"],
                             excerpt: "", score: 9 }],
                },
            },
        },
        run: () => {
            const note = document.querySelector(".rr-releases__note");
            if (!note) return "no note";
            // By eye the gaps between the spans are the punctuation, so
            // the visible line is meant to concatenate — what matters
            // is that they are separate boxes with space between them,
            // and that something readable is offered alongside. Read
            // aloud, "Latest posted: v1.10.05 pages read" was one word.
            const spans = Array.from(note.children).filter((n) => n.textContent.trim());
            if (spans.length < 2) return "the note is one run of text";
            const gap = spans[1].getBoundingClientRect().left - spans[0].getBoundingClientRect().right;
            if (gap < 4) return "the two halves are " + Math.round(gap) + "px apart";
            const said = note.getAttribute("aria-label") || "";
            if (!said) return "nothing is offered to a screen reader";
            if (/v1\.10\.05/.test(said)) return "the spoken line runs together: " + said;
            return /version 1\.10\.0/.test(said) && /pages read/.test(said)
                ? null
                : "says: " + said;
        },
    },
    {
        name: "index: a release described in Russian is still a release",
        fresh: true,
        settle: 500,
        url: THREAD,
        run: () => {
            // The board is bilingual. Its Russian forums are shut to
            // guests, so this vocabulary could not be grounded in
            // reading them — it is limited to terms that cannot mean
            // anything else in a release post, and this is the check
            // that they actually fire.
            Array.from(document.querySelectorAll(".rr-releases__tab"))
                .find((n) => /All \d+ pages/.test(n.textContent)).click();
            return new Promise((resolve) => setTimeout(() => {
                const row = Array.from(document.querySelectorAll(".rr-releases__row"))
                    .find((r) => /Perevodchik/.test(r.textContent));
                if (!row) return resolve("the Russian post was not listed at all");
                const kinds = (row.getAttribute("data-kinds") || "").split(" ");
                const missing = ["repack", "crack", "language"].filter((k) => !kinds.includes(k));
                resolve(missing.length ? "did not recognise: " + missing.join(", ") + " (got " + kinds.join(",") + ")" : null);
            }, 4000));
        },
    },

    /* ---- Printing -------------------------------------------------- */
    {
        name: "print: a folded quote prints in full",
        fresh: true,
        media: "print",
        url: QUOTES,
        settings: { foldQuotesLines: 3 },
        run: () => {
            // A fold is an affordance — "there is more, click here" —
            // and paper has no click. A quote still clipped once the
            // print stylesheet applies comes out cut off mid-sentence.
            const folded = Array.from(document.querySelectorAll("[data-rr-quote]"));
            if (!folded.length) return "nothing was folded, so this proves nothing";
            const clipped = folded.filter((q) => q.scrollHeight > q.clientHeight + 1);
            if (clipped.length) return clipped.length + " of " + folded.length + " quotes still clipped";
            const stray = Array.from(document.querySelectorAll(".rr-quote-toggle"))
                .filter((n) => getComputedStyle(n).display !== "none");
            return stray.length ? stray.length + " fold control(s) would be printed" : null;
        },
    },
    {
        name: "print: a folded reply prints in full",
        fresh: true,
        media: "print",
        width: 480,
        url: CHATTER,
        settings: { quietPosts: true },
        run: () => {
            const folded = Array.from(document.querySelectorAll("table.tablebg[data-rr-quiet]"));
            if (!folded.length) return "nothing was folded, so this proves nothing";

            // At 480px the long one wraps, so a one-line clamp really
            // does clip it. Without that this check passes on a page
            // where every reply happens to fit on one line anyway.
            const bodies = folded.map((t) => t.querySelector("div.postbody")).filter(Boolean);
            const wrapping = bodies.filter((b) => b.textContent.trim().length > 90);
            if (!wrapping.length) return "no reply here is long enough to be clipped";

            // The fold clips sideways — one line, ellipsised — so this
            // is the axis to read. Measuring the other one is how this
            // check passed for a while against a fold that was not
            // clipping anything at all.
            const problems = bodies.filter((b) => b.scrollWidth > b.clientWidth + 1
                || b.scrollHeight > b.clientHeight + 1
                || getComputedStyle(b).display === "none"
                || getComputedStyle(b).whiteSpace === "nowrap");
            if (problems.length) return problems.length + " reply/replies would print clipped";
            const stray = Array.from(document.querySelectorAll(".rr-quiet-chip"))
                .filter((n) => getComputedStyle(n).display !== "none");
            return stray.length ? stray.length + " fold control(s) would be printed" : null;
        },
    },

    /* ---- An unsent reply -------------------------------------------- */
    {
        name: "draft: an unsent reply survives leaving the page",
        fresh: true,
        url: MEMBER,
        data: { drafts: { "75717": { at: Date.now(), text: "Half a sentence I had not finished" } } },
        run: () => {
            const holder = document.querySelector(".rr-reply");
            if (!holder) return "no quick reply";
            if (!holder.hasAttribute("data-rr-draft")) return "nothing said there was a draft";
            const button = holder.querySelector(".rr-btn");
            if (!/finish/i.test(button.textContent)) return "the button says " + button.textContent.trim();
            if (!/Half a sentence/.test(button.getAttribute("title") || "")) {
                return "the draft is not on the control";
            }
            return null;
        },
    },
    {
        name: "quick reply: the board's own form loads, tokens and all",
        fresh: true,
        url: MEMBER,
        run: () => {
            const holder = document.querySelector(".rr-reply");
            if (!holder) return "no quick reply";
            holder.querySelector(".rr-btn").click();
            return new Promise((resolve) => setTimeout(() => {
                const form = holder.querySelector("form.rr-reply__form");
                if (!form) return resolve("the form never loaded");
                const box = form.querySelector('textarea[name="message"]');
                if (!box) return resolve("no message box");
                // The point of loading the board's form rather than
                // building one: whatever phpBB needs back has to come
                // across untouched.
                const missing = ["creation_time", "form_token", "lastclick"]
                    .filter((name) => !form.querySelector('input[name="' + name + '"]'));
                if (missing.length) return resolve("lost: " + missing.join(", "));
                if (!/posting\.php/.test(form.getAttribute("action") || "")) {
                    return resolve("posts to " + form.getAttribute("action"));
                }
                resolve(null);
            }, 900));
        },
    },
    {
        name: "draft: what you type is kept, and sending clears it",
        fresh: true,
        url: MEMBER,
        run: () => {
            const kept = () => {
                try { return (JSON.parse(localStorage.getItem("rr:data") || "{}").drafts || {})["75717"]; }
                catch { return undefined; }
            };
            if (kept()) return "started with a draft already stored";

            const holder = document.querySelector(".rr-reply");
            holder.querySelector(".rr-btn").click();
            return new Promise((resolve) => setTimeout(() => {
                const box = holder.querySelector('textarea[name="message"]');
                if (!box) return resolve("the form never loaded");

                box.value = "A sentence I have not finished";
                box.dispatchEvent(new Event("input", { bubbles: true }));

                setTimeout(() => {
                    const stored = kept();
                    if (!stored) return resolve("typing was not kept");
                    if (stored.text !== "A sentence I have not finished") {
                        return resolve("kept: " + JSON.stringify(stored.text));
                    }
                    // Submitting is the one thing that means done. The
                    // event is dispatched rather than the button
                    // pressed, so the harness is not asked to accept a
                    // post.
                    holder.querySelector("form").dispatchEvent(
                        new Event("submit", { bubbles: true, cancelable: true }));
                    resolve(kept() ? "sending did not clear it" : null);
                }, 700);
            }, 900));
        },
    },
    {
        name: "draft: a draft nobody came back to is not kept forever",
        fresh: true,
        url: MEMBER,
        // Forty days old. A reply somebody abandoned over a month ago
        // is not a reply they are coming back to, and keeping every
        // one of them turns this into an archive of unfinished
        // sentences nobody asked for.
        data: { drafts: { "75717": { at: Date.now() - 40 * 86400000, text: "Long forgotten" } } },
        run: () => {
            const holder = document.querySelector(".rr-reply");
            if (!holder) return "no quick reply";
            if (holder.hasAttribute("data-rr-draft")) return "a month-old draft was still offered";
            let left = {};
            try { left = JSON.parse(localStorage.getItem("rr:data") || "{}").drafts || {}; } catch { /* private */ }
            return left["75717"] ? "it is still in storage" : null;
        },
    },

    /* ---- Motion ------------------------------------------------------ */
    {
        name: "motion: with animation off, jumps land at once",
        fresh: true,
        url: REPLIES,
        settings: { reduceMotion: true },
        run: () => {
            // scrollTo({behavior}) beats the CSS scroll-behavior
            // property by design, so the switch only means anything if
            // the script reads it back. A smooth scroll is still near
            // the top a frame later; an instant one is not.
            const entry = document.querySelector(".rr-releases__link");
            if (!entry) return "no finder entry to jump from";
            window.scrollTo(0, 0);
            entry.click();
            return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => {
                resolve(window.scrollY > 100 ? null : "still at " + Math.round(window.scrollY) + "px two frames later");
            })));
        },
    },
    {
        name: "motion: with animation on, jumps still arrive",
        fresh: true,
        url: REPLIES,
        run: () => {
            const entry = document.querySelector(".rr-releases__link");
            if (!entry) return "no finder entry to jump from";
            window.scrollTo(0, 0);
            entry.click();
            return new Promise((resolve) => setTimeout(() => {
                resolve(window.scrollY > 100 ? null : "never got there");
            }, 900));
        },
    },

    /* ---- Regressions ---------------------------------------------- */
    {
        name: "hiding someone works with per-post actions switched off",
        url: MEMBER,
        settings: { postTools: false, hideUsers: true },
        run: () => {
            // The control was appended to the strip the per-post actions
            // build, so turning those off took this with it, silently,
            // while its own switch still said it was on.
            const posts = document.querySelectorAll('a[name^="p"]').length;
            const controls = Array.from(document.querySelectorAll(".rr-posttools button[aria-pressed]"))
                .filter((b) => /posts by/i.test(b.getAttribute("aria-label") || b.getAttribute("title") || ""));
            if (controls.length < posts) return controls.length + " hide controls for " + posts + " posts";
            const invisible = controls.filter((b) => !b.getBoundingClientRect().width);
            return invisible.length ? invisible.length + " of them are invisible" : null;
        },
    },
    {
        name: "hiding someone is reversible without reloading the page",
        fresh: true,
        url: MEMBER,
        run: () => {
            const control = document.querySelector(".rr-posttools [data-rr-hide]");
            if (!control) return "no hide control";
            const name = control.getAttribute("data-rr-hide");
            const mine = Array.from(document.querySelectorAll("table.tablebg"))
                .filter((t) => {
                    const author = t.querySelector("b.postauthor");
                    return author && author.textContent.trim() === name;
                });
            if (!mine.length) return "found no posts by " + name;

            // Something folded before this ran must still be folded
            // after: bringing a post back must not also unfold whatever
            // the reader had folded inside it.
            const foldedBefore = document.querySelectorAll('[data-rr-quote="folded"]').length;

            control.click();
            const notes = mine.filter((t) => t.querySelector(".rr-hidden-note"));
            if (notes.length !== mine.length) return notes.length + " of " + mine.length + " posts collapsed";
            // Collapsed, not removed.
            if (!mine[0].querySelector("div.postbody")) return "the post was taken out of the page";

            document.querySelector(".rr-hidden-note .rr-btn").click();
            if (mine[0].querySelector(".rr-hidden-note")) return "Show did not bring the post back";
            const body = mine[0].querySelector("div.postbody");
            if (!body || body.hidden) return "the message stayed hidden";

            const foldedAfter = document.querySelectorAll('[data-rr-quote="folded"]').length;
            return foldedAfter === foldedBefore
                ? null
                : "restoring the post unfolded " + (foldedBefore - foldedAfter) + " quote(s) with it";
        },
    },
    /* ---- The pages only a member sees ----------------------------- */
    {
        name: "member list: columns named, ranks in one language, dates on one line",
        url: MEMBERS,
        run: () => {
            const heads = Array.from(document.querySelectorAll("th[data-rr-col]")).map((h) => h.getAttribute("data-rr-col"));
            for (const want of ["num", "author", "date", "posts", "rank", "action"]) {
                if (!heads.includes(want)) return "no column labelled " + want + " (got " + heads.join(",") + ")";
            }
            // A listing — striped, aligned, its numbers grouped — but not a
            // topic listing: no whole-cell click, no filter toolbar.
            const roster = document.querySelector("table[data-rr-list]");
            if (!roster) return "the member list is not treated as a listing";
            if (roster.hasAttribute("data-rr-rowclick") || document.querySelector(".rr-toolbar")) {
                return "the member list was taken for a topic listing";
            }

            const ranks = Array.from(document.querySelectorAll('td[data-rr-col="rank"]'));
            const first = ranks[0];
            if (!first || first.textContent.trim() !== "Advanced forumer") return "rank reads " + JSON.stringify(first && first.textContent.trim());
            if (!/Завсегдатай/.test(first.getAttribute("title") || "")) return "the Russian half is not kept on the title";
            const donor = ranks.find((cell) => /Super-Donor/.test(cell.textContent));
            if (!donor || donor.textContent.trim() !== "Super-Donor <3") return "a rank with no Russian half was changed: " + JSON.stringify(donor && donor.textContent.trim());

            const date = document.querySelector('td[data-rr-col="date"]');
            if (!date || date.textContent.trim() !== "15 Aug 2003, 05:06") return "date reads " + JSON.stringify(date && date.textContent.trim());
            if (!/^Friday, 15 Aug 2003/.test(date.getAttribute("title") || "")) return "the weekday is not kept on the title";
            if (getComputedStyle(date).whiteSpace !== "nowrap") return "a date cell may still wrap";

            const lone = Array.from(document.querySelectorAll("td.nav")).find((cell) => /Page 1 of 1/.test(cell.textContent));
            if (lone && lone.getBoundingClientRect().width > 0) return '"Page 1 of 1" still drawn over a one-page list';
            return null;
        },
    },
    {
        name: "message folder: subjects line up, markers drawn, sent dates on one line",
        url: PM,
        run: () => {
            const heads = Array.from(document.querySelectorAll("th[data-rr-col]")).map((h) => h.getAttribute("data-rr-col"));
            for (const want of ["title", "author", "date", "mark"]) {
                if (!heads.includes(want)) return "no column labelled " + want + " (got " + heads.join(",") + ")";
            }
            const subjects = Array.from(document.querySelectorAll('td[data-rr-col="title"] a[href*="mode=view"]'));
            if (subjects.length !== 4) return subjects.length + " subject links";
            const lefts = new Set(subjects.map((a) => Math.round(a.getBoundingClientRect().left)));
            if (lefts.size !== 1) return "subjects start at " + Array.from(lefts).join(", ");

            const marks = document.querySelectorAll('td[data-rr-col="title"] .rr-pm-mark');
            if (marks.length !== 4) return marks.length + " markers for 4 rows";
            const replied = document.querySelector(".pm_replied_colour.rr-pm-mark");
            if (!replied || getComputedStyle(replied).backgroundColor === "rgba(0, 0, 0, 0)") return "the replied marker has no colour";
            const legend = document.querySelector("td.pm_marked_colour");
            if (!legend || getComputedStyle(legend).boxShadow === "none") return "the legend row carries no colour";

            const sent = document.querySelector('td[data-rr-col="date"] p.topicdetails');
            if (!sent || sent.textContent.trim() !== "02 Sep 2026, 16:21") return "sent reads " + JSON.stringify(sent && sent.textContent.trim());
            if (getComputedStyle(sent).whiteSpace !== "nowrap") return "a sent date may still wrap";

            // The control panel's section links: either painted as
            // links, or drawn as the menu rows they are — with the
            // chevron that says the row opens something.
            const nav = document.querySelector("a.nav");
            const body = getComputedStyle(document.body).color;
            const menuRow = nav && nav.closest('td[data-rr-navitem="closed"]') && nav.querySelector("svg");
            if (!nav || (!menuRow && getComputedStyle(nav).color === body)) return "the control panel's section links are painted as text";
            return null;
        },
    },
    {
        name: "profile: spanning header is not a listing, joined date and rank read as elsewhere",
        url: PROFILE_M,
        run: () => {
            if (document.querySelector("#wrapcentre td[data-rr-col]")) return "the profile table was labelled as a listing";
            const joined = Array.from(document.querySelectorAll("#wrapcentre b.gen")).find((b) => /\d{4}, \d{2}:\d{2}/.test(b.textContent));
            if (!joined || joined.textContent.trim() !== "13 Feb 2020, 13:38") return "joined reads " + JSON.stringify(joined && joined.textContent.trim());
            const rank = document.querySelector('td.postdetails[align="center"]');
            if (!rank || rank.textContent.trim() !== "Beginner") return "rank reads " + JSON.stringify(rank && rank.textContent.trim());
            if (!/Без звания/.test(rank.getAttribute("title") || "")) return "the Russian half is not kept on the title";
            return null;
        },
    },
    {
        name: "code box: the highlighter's light box takes the theme",
        url: REPLIES,
        run: () => {
            const box = document.querySelector(".codebox");
            if (!box) return "no code box on the page";
            const bg = getComputedStyle(box).backgroundColor;
            if (/rgb\(20[0-9], 20[0-9], 20[0-9]\)/.test(bg)) return "the box is still the board's light grey: " + bg;
            const line = box.querySelector("li.li1, li.li2, .text");
            if (line && getComputedStyle(line).backgroundColor !== "rgba(0, 0, 0, 0)") return "a code line keeps its own background: " + getComputedStyle(line).backgroundColor;
            const text = box.querySelector(".text");
            if (text && !/mono|Consolas|Menlo|Courier|JetBrains|Cascadia|SFMono/i.test(getComputedStyle(text).fontFamily)) return "code is not in the monospace face: " + getComputedStyle(text).fontFamily.slice(0, 40);
            const header = box.querySelector(".codeheader");
            if (header && getComputedStyle(header).backgroundColor === bg) return "the header is not set off from the box";
            return null;
        },
    },
    {
        name: "one-result search: the page counter goes, the match count stays",
        url: SEARCH_ONE,
        run: () => {
            const strip = Array.from(document.querySelectorAll("#wrapcentre div.gensmall")).find((d) => /Search found/.test(d.textContent));
            if (!strip) return "no match count on the page";
            const shown = strip.innerText.replace(/\s+/g, " ").trim();
            if (/Page 1 of 1/.test(shown)) return '"Page 1 of 1" still drawn beside the match count';
            if (!/Search found 1 match/.test(shown)) return "match count reads " + JSON.stringify(shown);
            return null;
        },
    },
    /* ---- The desktop pass (0.9.0) ---------------------------------- */
    {
        name: "nav: the bar's content keeps to the content column on a wide screen",
        width: 2560,
        url: FORUM,
        run: () => {
            const inner = document.querySelector(".rr-nav__inner");
            const wrap = document.querySelector("#wrapcentre");
            if (!inner || !wrap) return "no .rr-nav__inner or no #wrapcentre";
            const a = inner.getBoundingClientRect();
            const b = wrap.getBoundingClientRect();
            const off = Math.max(Math.abs(a.left - b.left), Math.abs(a.right - b.right));
            return off > 24 ? "the bar's content is " + Math.round(off) + "px off the content column at 2560px" : null;
        },
    },
    {
        name: "member list: the roster is a listing (zebra, aligned numbers, grouped counts)",
        url: MEMBERS,
        run: () => {
            const table = Array.from(document.querySelectorAll("table[data-rr-list]"))
                .find((t) => t.querySelector('a[href*="mode=viewprofile"]'));
            if (!table) return "the member table has no data-rr-list";
            const posts = Array.from(table.querySelectorAll('td[data-rr-col="posts"]')).map((c) => c.textContent.trim());
            const big = posts.find((text) => text.replace(/\D/g, "").length >= 4);
            if (big && /^\d+$/.test(big)) return "a four-digit post count is not grouped: " + big;
            const th = table.querySelector('th[data-rr-col="posts"]');
            const td = table.querySelector('td[data-rr-col="posts"]');
            if (th && td && getComputedStyle(th).textAlign !== getComputedStyle(td).textAlign) {
                return "the Posts header is aligned " + getComputedStyle(th).textAlign + " over cells aligned " + getComputedStyle(td).textAlign;
            }
            return null;
        },
    },
    {
        name: "message folder: the message table is a listing",
        url: PM,
        run: () => {
            const table = Array.from(document.querySelectorAll("table[data-rr-list]")).find((t) => t.querySelector(".topictitle a"));
            return table ? null : "the message folder's table has no data-rr-list";
        },
    },
    {
        name: "profile: a row with nothing after the colon is not shown",
        url: PROFILE_M,
        run: () => {
            const shown = Array.from(document.querySelectorAll("#wrapcentre table.tablebg tr")).filter((row) => {
                if (row.hidden) return false;
                const cells = Array.from(row.children).filter((n) => n.tagName === "TD");
                if (cells.length !== 2) return false;
                if (!/:$/.test(cells[0].textContent.trim())) return false;
                return !cells[1].querySelector("a, img, input") && !cells[1].textContent.replace(/[\s\u00a0]+/g, "");
            });
            return shown.length ? shown.length + " empty row(s) still shown" : null;
        },
    },
    {
        name: "rows: the whole title cell opens the topic",
        url: FORUM,
        run: () => (document.querySelector("table[data-rr-list][data-rr-rowclick]") ? null : "no listing is marked for the row click"),
    },
    {
        name: "toasts: the host is a live region",
        url: TOPIC,
        run: () => {
            const button = document.querySelector('[data-rr-tip*="Copy link"], [aria-label*="Copy link"]');
            if (!button) return "no copy-link control to raise a toast with";
            button.click();
            return new Promise((done) => setTimeout(() => {
                const host = document.querySelector(".rr-toasts");
                if (!host) return done("no toast host after the click");
                done(host.getAttribute("role") === "status" && host.getAttribute("aria-live") === "polite"
                    ? null : "the toast host is not a polite live region");
            }, 300));
        },
    },
    {
        name: "settings: the footer says what its buttons do",
        fresh: true,
        url: FORUM,
        run: () => {
            document.querySelector(".rr-nav__actions button[aria-label*='settings']").click();
            const labels = Array.from(document.querySelectorAll(".rr-panel__foot .rr-btn")).map((b) => b.textContent.trim());
            for (const want of ["Copy settings", "Paste settings", "Clear data", "Reset"]) {
                if (!labels.includes(want)) return "no \"" + want + "\" in the footer: " + labels.join(" / ");
            }
            return null;
        },
    },
    {
        name: "settings: a search hit under a switched-off parent is still shown",
        fresh: true,
        url: FORUM,
        settings: { foldQuotes: false },
        run: () => {
            document.querySelector(".rr-nav__actions button[aria-label*='settings']").click();
            const search = document.querySelector(".rr-panel__search");
            search.value = "fold a quote over";
            search.dispatchEvent(new Event("input", { bubbles: true }));
            return new Promise((done) => setTimeout(() => {
                const row = document.querySelector('.rr-field[data-field="foldQuotesLines"]');
                if (!row) return done("no row for foldQuotesLines");
                if (!row.hasAttribute("data-rr-dep-off")) return done("the row is not marked dependent-off, so the case is not exercised");
                done(row.getBoundingClientRect().height > 0 ? null : "the matching row is counted but not shown");
            }, 250));
        },
    },
    {
        name: "width: Full keeps a measure on a post",
        url: TOPIC,
        settings: { width: "full" },
        run: () => {
            const body = document.querySelector(".postbody");
            if (!body) return "no post";
            const max = getComputedStyle(body).maxWidth;
            return max === "none" ? "Full mode leaves a post's lines uncapped" : null;
        },
    },
    {
        name: "width: Reading narrows the frame on a topic page, not on a listing",
        width: 1920,
        url: TOPIC,
        settings: { width: "reading" },
        run: () => {
            const wrap = document.querySelector("#wrapcentre");
            const width = wrap.getBoundingClientRect().width;
            // 1440 is the ceiling: the narrowest at which the board bar's
            // two groups of links still share one line.
            return width > 1450 ? "the topic frame is " + Math.round(width) + "px wide in Reading mode at 1920px" : null;
        },
    },
    {
        name: "colour: the accent as text on its soft wash reads at AA, on paper too",
        url: FORUM,
        settings: { theme: "paper", accent: "brass" },
        run: () => {
            const cs = getComputedStyle(document.documentElement);
            const parse = (text) => {
                const t = text.trim();
                const hex = t.match(/^#([0-9a-f]{6})$/i);
                if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16));
                const parts = t.match(/[\d.]+/g);
                return parts ? parts.slice(0, 3).map(Number) : null;
            };
            const lum = ([r, g, b]) => {
                const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
                return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
            };
            const ink = parse(cs.getPropertyValue("--rr-accent-on-soft"));
            const soft = parse(cs.getPropertyValue("--rr-accent-soft"));
            if (!ink || !soft) return "could not read --rr-accent-on-soft / --rr-accent-soft";
            const a = lum(ink), b = lum(soft);
            const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
            return ratio < 4.5 ? "accent on its soft wash reads at " + ratio.toFixed(2) + ":1" : null;
        },
    },
    {
        name: "palette: on a topic page the actions come first",
        url: TOPIC,
        run: () => {
            document.querySelector(".rr-nav__search").click();
            const first = document.querySelector(".rr-palette__group");
            if (!first) return "the palette has no groups";
            return first.textContent.trim() === "Actions" ? null : "the first group is " + first.textContent.trim();
        },
    },
    {
        name: "palette: the search row names the board it will look in",
        url: FORUM,
        run: () => {
            document.querySelector(".rr-nav__search").click();
            const input = document.querySelector(".rr-palette__input");
            input.value = "denuvo";
            input.dispatchEvent(new Event("input", { bubbles: true }));
            return new Promise((done) => setTimeout(() => {
                const item = document.querySelector(".rr-palette__item");
                const text = item ? item.textContent : "";
                if (!/^Search /.test(text.trim())) return done("the first row is not the search: " + text.trim().slice(0, 60));
                done(/Search the forum for/.test(text) ? "the row says \"the forum\" for a search scoped to one board" : null);
            }, 150));
        },
    },
    {
        name: "signatures: every signature is set apart, long or short",
        url: REPLIES,
        run: () => {
            const all = document.querySelectorAll(".rr-signature").length;
            if (!all) return "no signature on a page of 25 posts";
            const rules = Array.from(document.querySelectorAll(".postbody, .rr-post__body")).filter((n) => /_{5,}/.test(n.textContent));
            return rules.length ? rules.length + " post(s) still show the underscore divider" : null;
        },
    },
];

async function main() {
    let chromium;
    try { ({ chromium } = require("playwright-core")); }
    catch { console.error("run: npm i -D playwright-core"); process.exit(2); }

    const browser = await chromium.launch(
        process.env.RR_CHROME ? { executablePath: process.env.RR_CHROME } : {}
    );
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

    let failures = 0;
    const cache = new Map();

    /** A context with this check's settings and data already in place. */
    const contextFor = async (check) => {
        const ctx = await browser.newContext({
            viewport: { width: check.width || 1440, height: check.width ? 844 : 900 },
        });
        // The grant a userscript manager provides, provided.
        //
        // The board answers connect-src 'self', so the script refuses
        // to start a Steam lookup at all unless GM_xmlhttpRequest is
        // there — which is correct, and which means a harness with no
        // shim tests the refusal rather than the lookup. This is the
        // manager's half: same signature, same callbacks, and here it
        // is a plain fetch because the test origin sends no CSP.
        if (!check.noGrant) await ctx.addInitScript(() => {
            window.GM_xmlhttpRequest = ({ url, onload, onerror, ontimeout, timeout }) => {
                const stop = setTimeout(() => ontimeout && ontimeout(), timeout || 10000);
                fetch(url, { credentials: "omit" })
                    .then((res) => res.text().then((text) => {
                        clearTimeout(stop);
                        onload && onload({ status: res.status, responseText: text });
                    }))
                    .catch((err) => { clearTimeout(stop); onerror && onerror(err); });
            };
        });

        // The script reads storage before it touches the DOM, so this
        // has to land before the first navigation.
        await ctx.addInitScript((seed) => {
            try {
                if (seed.settings) localStorage.setItem("rr:settings", seed.settings);
                if (seed.data) localStorage.setItem("rr:data", seed.data);
            } catch { /* private mode */ }
        }, {
            settings: check.settings ? JSON.stringify(check.settings) : null,
            data: check.data ? JSON.stringify(check.data) : null,
        });
        return ctx;
    };

    for (const check of CHECKS) {
        const own = Boolean(check.fresh || check.width || check.settings || check.data
            || check.offline || check.stub || check.noGrant || check.media || check.slow);
        let tab = own ? null : cache.get(check.url);
        const disposable = !tab;
        let ctx = null;

        if (!tab) {
            ctx = own ? await contextFor(check) : context;
            tab = await ctx.newPage();
            const blocked = [];
            if (check.slow) {
                /* A queue, not a rate limit: every answer is slower
                   than the one before it, and none of them is an
                   error. 250 ms of staircase per page is enough to
                   cross the walk's own threshold in a handful of
                   pages without making the check take a minute. */
                let step = 0;
                await tab.route("**/viewtopic*start=*", async (route) => {
                    step += 1;
                    await new Promise((done) => setTimeout(done, 200 + step * 260));
                    route.continue();
                });
            }
            if (check.offline || check.stub) {
                await tab.route("**/*", (route) => {
                    const url = route.request().url();
                    if (url.startsWith(BASE)) { route.continue(); return; }
                    // A stubbed endpoint answers with canned JSON, so
                    // the lookup path can be exercised without asking
                    // Valve anything. Everything else is still refused
                    // and still reported.
                    const stub = (check.stub || []).find((entry) => url.includes(entry.match));
                    if (stub) {
                        route.fulfill({
                            status: 200,
                            contentType: "application/json",
                            // The page fetches this cross-origin, so
                            // without this the browser refuses the
                            // answer before the script ever sees it.
                            headers: { "Access-Control-Allow-Origin": "*" },
                            body: JSON.stringify(stub.body),
                        });
                        return;
                    }
                    blocked.push(url);
                    route.abort();
                });
            }
            tab._blocked = blocked;
            await tab.goto(BASE + check.url, { waitUntil: "domcontentloaded" });
            // Printing is a media query away, and it is the one place
            // where a fold really would lose content.
            if (check.media) await tab.emulateMedia({ media: check.media });
            if (!cache.size) await assertFreshBuild(tab);
            await tab.waitForTimeout(check.settle || 350);
            if (!own) cache.set(check.url, tab);
        }

        let problem;
        try { problem = await tab.evaluate(check.run, check.arg); }
        catch (err) { problem = "threw: " + String(err).slice(0, 120); }

        if (!problem && check.offline) {
            await tab.waitForTimeout(200);
            const leaked = tab._blocked.filter((url) => !/^data:|^blob:/.test(url));
            if (leaked.length) problem = "left the origin: " + leaked[0].slice(0, 70);
        }

        if (own && disposable) { await tab.close(); if (ctx && ctx !== context) await ctx.close(); }

        if (problem) { failures += 1; console.log("FAIL " + check.name.padEnd(58) + problem); }
        else console.log("ok   " + check.name);
    }

    await browser.close();
    console.log(failures ? "\n" + failures + " checks failed" : "\nall " + CHECKS.length + " checks passed");
    process.exit(failures ? 1 : 0);
}

main();

#!/usr/bin/env node
/* ------------------------------------------------------------------
   Test harness.

   Turns the saved forum pages in test/fixtures into a small local site
   that renders like the real board, with the built userscript attached:

     - pages keep their .php names in per-case folders, so the script
       reads a realistic location (viewforum.php?f=10) with no shim
     - the original stylesheet is served locally; cs.rin.ru sends
       Cross-Origin-Resource-Policy: same-origin, so nothing can be hot
       linked from a test origin
     - the bundle is inlined last

   Serve test/pages over HTTP and open, for example,
   http://localhost:8731/forum/viewforum.php?f=10

   Output goes to test/pages/. Nothing here ships.
   ------------------------------------------------------------------ */

const fs = require("fs");
const path = require("path");
const https = require("https");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const IN = path.join(__dirname, "fixtures");
const OUT = path.join(__dirname, "pages");

const STYLESHEET = "https://cs.rin.ru/forum/styles/rinDark/theme/stylesheet.css";
const ASSETS = "https://cs.rin.ru/forum/styles/rinDark/";

/* Images the pages still show after the reskin, fetched so they can be
   served locally: the board sends Cross-Origin-Resource-Policy:
   same-origin, so nothing here can hot-link them.

   The two flags matter more than they look. They are the whole content
   of the language switch, they are in shot of every screenshot the
   README publishes, and without them the top of every page carries two
   broken-image icons — which is what the published screenshots showed. */
const IMAGES = [
    { url: "imageset/site_logo-1.png", as: "logo.png", match: /src="\.\/styles\/[^"]*site_logo[^"]*"/g },
    { url: "theme/images/uk.png", as: "uk.png", match: /src="\.\/styles\/[^"]*\/uk\.png"/g },
    { url: "theme/images/ru.png", as: "ru.png", match: /src="\.\/styles\/[^"]*\/ru\.png"/g },
];

/* Twenty pages of a synthetic topic, at the offsets phpBB would use.
   Listed by hand would be twenty near-identical lines. */
const LONG_THREAD = Array.from({ length: 20 }, (_, i) => ({
    fixture: "viewtopic-long-" + (i + 1) + ".html",
    out: "forum/long/viewtopic" + (i === 0 ? "" : ".start-" + (i * 2)) + ".php",
}));

const PAGES = [
    { fixture: "index.html", out: "forum/index.php" },
    { fixture: "viewforum.html", out: "forum/viewforum.php" },
    { fixture: "viewtopic.html", out: "forum/topic/viewtopic.php" },
    /* The same topic one room deeper — Main Forum » Temporarily
       Restricted Topics — which is where this board puts a game once
       it is cracked, and the case the search box's default exists for:
       searching the room a topic was moved to finds the handful of
       topics that happen to be in that state today. Built off the same
       fixture rather than saved twice; the breadcrumb is the only
       difference that matters. */
    {
        fixture: "viewtopic.html",
        out: "forum/deep/viewtopic.php",
        tweak: (html) => html.replace(
            /(<a class="breadcrumbs" href="\.\/viewforum\.php\?f=10[^"]*">Main Forum<\/a>)/g,
            (crumb) => crumb + ' &#187; <a class="breadcrumbs" href="./viewforum.php?f=41">Temporarily Restricted Topics</a>'),
    },
    { fixture: "viewtopic-replies.html", out: "forum/replies/viewtopic.php" },
    // Synthesised by make-quotes-fixture.js: the release-plus-quoting-
    // replies case none of the saved threads happens to contain.
    { fixture: "viewtopic-quotes.html", out: "forum/quotes/viewtopic.php" },
    // A topic that fits on one page. Everything else saved here is a
    // page of a long thread, so the short case — which is most of the
    // board — had no page to be tested on.
    { fixture: "viewtopic-single.html", out: "forum/single/viewtopic.php" },
    // Five posts, each one a way the Releases panel used to read a
    // post wrong. Synthesised by make-quotes-fixture.js.
    { fixture: "viewtopic-kinds.html", out: "forum/kinds/viewtopic.php" },
    // A hypervisor release naming its version the way the publisher
    // does, and a post naming somebody else's utility version beside
    // it. Both off the live board; neither is in any saved thread.
    { fixture: "viewtopic-hypervisor-1.html", out: "forum/hypervisor/viewtopic.php" },
    { fixture: "viewtopic-hypervisor-2.html", out: "forum/hypervisor/viewtopic.start-5.php" },
    { fixture: "viewtopic-member.html", out: "forum/member/viewtopic.php" },
    { fixture: "viewtopic-locked.html", out: "forum/locked/viewtopic.php" },
    // The quick reply fetches this from beside the page it is on, so
    // it has to sit in the member folder rather than at the root.
    { fixture: "posting.html", out: "forum/member/posting.php" },
    // Ten short posts, five of them chatter and five of them not, for
    // the noise filter.
    { fixture: "viewtopic-chatter.html", out: "forum/chatter/viewtopic.php" },
    // The listing as a member sees it, with unread rows, for the
    // first-unread routing on topic titles.
    { fixture: "viewforum-unread.html", out: "forum/unread/viewforum.php" },
    // Five pages of one topic, at the offsets phpBB would use, so the
    // whole-topic index has a topic to walk. serve.py picks the
    // .start-N variant off the query string.
    { fixture: "viewtopic-thread-1.html", out: "forum/thread/viewtopic.php" },
    { fixture: "viewtopic-thread-2.html", out: "forum/thread/viewtopic.start-6.php" },
    { fixture: "viewtopic-thread-3.html", out: "forum/thread/viewtopic.start-12.php" },
    { fixture: "viewtopic-thread-4.html", out: "forum/thread/viewtopic.start-18.php" },
    { fixture: "viewtopic-thread-5.html", out: "forum/thread/viewtopic.start-24.php" },
    { fixture: "profile.html", out: "forum/profile/memberlist.php" },
    /* The pages only a member sees, synthesised by
       make-member-fixtures.js: the member list, a message folder and a
       member's profile, with the column shapes and the two-language
       ranks the first signed-in pass found there. */
    { fixture: "memberlist.html", out: "forum/members/memberlist.php" },
    { fixture: "ucp-pm.html", out: "forum/ucp/ucp.php" },
    { fixture: "profile-member.html", out: "forum/profilem/memberlist.php" },
    /* Search results, which are a listing the board draws with a
       template of its own: its own header row, its own refine box
       written into the page three times over, and a "Sort by" strip a
       forum listing does not have. */
    { fixture: "search.html", out: "forum/search/search.php" },
    /* The same page with one result on it — the shape of "View your
       posts" for most accounts, and the case where a filter box, a
       count and a prefix chip are all furniture. */
    { fixture: "search-one.html", out: "forum/searchone/search.php" },
    ...LONG_THREAD,
];

function get(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
            if (res.statusCode !== 200) { reject(new Error(url + " -> " + res.statusCode)); return; }
            let body = "";
            res.setEncoding("utf8");
            res.on("data", (chunk) => { body += chunk; });
            res.on("end", () => resolve(body));
        }).on("error", reject);
    });
}

function getBinary(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
            if (res.statusCode !== 200) { reject(new Error(url + " -> " + res.statusCode)); return; }
            const chunks = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => resolve(Buffer.concat(chunks)));
        }).on("error", reject);
    });
}

/** Replacement strings run through $-substitution, which eats the $$ in
    the helper names. Every injection goes through a function instead. */
const insert = (html, pattern, text) => html.replace(pattern, () => text);

async function main() {
    fs.mkdirSync(OUT, { recursive: true });

    const source = fs.readFileSync(path.join(ROOT, "dist", "rin-reforged.user.js"), "utf8");
    const stamp = crypto.createHash("sha1").update(source).digest("hex").slice(0, 12);
    const bundle = source.replace(/<\/script/gi, () => "<\/script");

    let css = "/* stylesheet unavailable */";
    try {
        css = await get(STYLESHEET);
    } catch (err) {
        console.warn("could not fetch the original stylesheet: " + err.message);
    }

    const images = [];
    for (const image of IMAGES) {
        try {
            images.push(Object.assign({ bytes: await getBinary(ASSETS + image.url) }, image));
        } catch (err) {
            console.warn("could not fetch " + image.url + ": " + err.message);
        }
    }

    for (const page of PAGES) {
        const target = path.join(OUT, page.out);
        const depth = page.out.split("/").length - 1;
        const up = "../".repeat(depth - 1) || "./";

        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.mkdirSync(path.join(path.dirname(target), "styles"), { recursive: true });
        fs.writeFileSync(path.join(path.dirname(target), "styles", "forum.css"), css, "utf8");
        for (const image of images) {
            fs.writeFileSync(path.join(path.dirname(target), "styles", image.as), image.bytes);
        }

        let html = fs.readFileSync(path.join(IN, page.fixture), "utf8");
        if (page.tweak) html = page.tweak(html);

        // Point the stylesheet and the logo at the local copies, and drop
        // the scripts; cs.rin.ru sends CORP: same-origin, so nothing can
        // be hot linked from a test origin.
        html = html.replace(/href="\.\/styles\/[^"]*stylesheet\.css"/g, () => 'href="./styles/forum.css"');
        for (const image of images) {
            html = html.replace(image.match, () => 'src="./styles/' + image.as + '"');
        }
        html = html.replace(/<script[^>]*src="[^"]*"[^>]*>\s*<\/script>/gi, () => "");
        // Embedded players hold WebGL contexts open and stall screenshots.
        html = html.replace(/<iframe[\s\S]*?<\/iframe>/gi, () => "");

        // The bundle is baked into these pages, so a page built before
        // the last edit looks exactly like a passing test. This stamp
        // lets the checkers refuse to run against a stale build.
        html = insert(html, /<\/head>/i,
            '<meta name="rr-bundle" content="' + stamp + '"></head>');
        html = insert(html, /<\/body>/i, "<script>" + bundle + "</script></body>");
        fs.writeFileSync(target, html, "utf8");
        console.log("test/pages/" + page.out + "  (up: " + up + ")");
    }
    console.log("bundle " + stamp);
}

main();

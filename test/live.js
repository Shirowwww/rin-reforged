#!/usr/bin/env node
/* ------------------------------------------------------------------
   A pass over the live board.

   The saved pages inline the bundle at the end of <body>. The real
   script runs at document-start, before <head> exists and often before
   <html> does, and three bugs have already been found that only appear
   under those conditions. Nothing about boot order can be trusted until
   it has run against cs.rin.ru itself.

   addInitScript is what makes this a real test: it runs the bundle at
   document-start, the way a userscript manager does.

       node build.js
       RR_CHROME=/path/to/chrome node test/live.js

   Read-only. It opens pages, reads the DOM and closes. Nothing is
   posted, and nothing that needs an account is exercised.
   ------------------------------------------------------------------ */

const fs = require("fs");
const path = require("path");

const BOARD = "https://cs.rin.ru/forum/";

const PAGES = [
    { name: "index", url: BOARD + "index.php" },
    { name: "viewforum", url: BOARD + "viewforum.php?f=10" },
    { name: "topic", url: BOARD + "viewtopic.php?f=10&t=133316" },
    // The board's own tech support thread: years of people answering
    // each other, which is where quoting actually happens and so where
    // the quote folding has anything to do. How many fold on any given
    // page is not fixed and is reported rather than required; what is
    // required is that none of them lost its content to being folded.
    { name: "thread", url: BOARD + "viewtopic.php?f=10&t=98066" },
    /* A hundred rows of a real listing the board draws from the search
       template rather than the forum one, with the read/unread markers
       of an account that has read nothing. The saved search page has
       26 rows and one refine box; this is the long list. */
    { name: "active", url: BOARD + "search.php?search_id=active_topics" },
];

const WIDTHS = [
    { label: "desktop", width: 1440, height: 900 },
    { label: "phone", width: 390, height: 844 },
];

/** What has to be true on every page, whatever it is. */
function inspect() {
    const box = (sel) => {
        const node = document.querySelector(sel);
        if (!node) return null;
        const r = node.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
    };
    return {
        themed: document.documentElement.hasAttribute("data-rr"),
        overflow: document.body.scrollWidth - window.innerWidth,
        nav: box(".rr-nav"),
        // The masthead art is same-origin here, so this is the first
        // place the crop is measured against the real file.
        logo: (() => {
            const brand = document.querySelector(".rr-nav__brand");
            const art = document.querySelector(".rr-nav__art");
            return {
                mode: brand ? brand.getAttribute("data-rr-logo") : null,
                natural: art ? art.naturalWidth + "x" + art.naturalHeight : null,
                shown: box(".rr-nav__logo"),
            };
        })(),
        boardLinks: Array.from(document.querySelectorAll(".rr-boardbar__link"))
            .map((a) => a.textContent.trim() || a.getAttribute("href")),
        skip: Boolean(document.querySelector(".rr-skip")),
        // A link that is laid out and has no size at all is a control
        // that cannot be found. This is the check that caught Quote and
        // Profile being hidden behind their GIFs.
        invisibleLinks: Array.from(document.querySelectorAll("a[href]")).filter((a) => {
            const href = a.getAttribute("href");
            if (!href || href.startsWith("#") || href.startsWith("javascript:")) return false;
            return a.getBoundingClientRect().width === 0 && a.offsetParent !== null;
        }).length,
        tinyText: Array.from(document.querySelectorAll("#wrapcentre td, #wrapcentre p"))
            .filter((n) => parseFloat(getComputedStyle(n).fontSize) < 11).length,
        finder: document.querySelectorAll(".rr-releases__row").length,
        posts: document.querySelectorAll('a[name^="p"]').length,

        /* The board writes the same refine box into the breadcrumb
           strip at the top of the page and the one at the bottom, and a
           search results page adds a third in its own header. Whatever
           the page, one search never wants two boxes. */
        refineBoxes: Array.from(document.querySelectorAll('input[name="add_keywords"], #search-box input[type="text"]'))
            .filter((node) => node.getBoundingClientRect().width > 0).length,

        /* ---- v0.4 ---------------------------------------------- */

        // The donation link, which the board is currently asking
        // people to use. It has to be the board's own link, still
        // pointing where the board points it.
        donate: (() => {
            const link = document.querySelector(".rr-boardbar__donate");
            if (!link) return null;
            const box = link.getBoundingClientRect();
            return { href: link.getAttribute("href"), w: Math.round(box.width), icon: Boolean(link.querySelector("svg")) };
        })(),

        // Folded quotes, and — the point of the whole exercise —
        // whether anything was taken out of the page to fold them.
        quotes: (() => {
            const all = document.querySelectorAll(".postbody .quotecontent, .postbody blockquote");
            const folded = Array.from(document.querySelectorAll('[data-rr-quote="folded"]'));
            const broken = folded.filter((q) => {
                const style = getComputedStyle(q);
                return style.display === "none"
                    || style.visibility === "hidden"
                    || !q.getClientRects().length
                    || !q.textContent.trim();
            });
            return { total: all.length, folded: folded.length, broken: broken.length };
        })(),

        // Logged out, no row has unread posts and no title may have
        // been retargeted.
        retargeted: Array.from(document.querySelectorAll("a.topictitle"))
            .filter((a) => /view=unread/.test(a.getAttribute("href") || "")).length,
        loggedIn: Boolean(document.querySelector('a[href*="mode=logout"]')),
    };
}

async function main() {
    let chromium;
    try { ({ chromium } = require("playwright-core")); }
    catch { console.error("run: npm i -D playwright-core"); process.exit(2); }

    const bundle = fs.readFileSync(
        path.join(__dirname, "..", "dist", "rin-reforged.user.js"), "utf8");

    const browser = await chromium.launch(
        process.env.RR_CHROME ? { executablePath: process.env.RR_CHROME } : {}
    );

    let failures = 0;

    for (const size of WIDTHS) {
        const context = await browser.newContext({
            viewport: { width: size.width, height: size.height },
        });
        await context.addInitScript(bundle);

        for (const page of PAGES) {
            const tab = await context.newPage();
            // Only what happens in the board's own document counts.
            //
            // addInitScript injects into every frame, and a game thread
            // embeds video players. The real script carries @noframes,
            // so it never runs in those — but the harness's copy does,
            // and it inherits their Trusted Types policy and their
            // permissions policy. Every error that came back from this
            // page on the first run was one of theirs.
            const errors = [];
            const mine = (url) => !url || url.includes("cs.rin.ru") || url.includes("csrinru");

            // The Steam preview ships off, and the README promises this
            // script reads the page it is on and nothing else. That is
            // a claim about the network, so it is checked on the
            // network rather than asserted.
            //
            // Only the endpoints the script itself can construct count.
            // A game topic is full of Steam CDN images because the
            // board's own posts embed them — the header art in a first
            // post is a steamstatic URL written by the person who
            // posted it — and refusing those would be testing the
            // board's content, not this script's behaviour.
            const reached = [];
            await tab.route("**/*", (route) => {
                const url = route.request().url();
                if (/store\.steampowered\.com\/api\/|api\.steampowered\.com|steamdb\.info/.test(url)) {
                    reached.push(url);
                    route.abort();
                    return;
                }
                route.continue();
            });
            tab.on("pageerror", (err) => errors.push(String(err)));
            tab.on("console", (msg) => {
                if (msg.type() !== "error") return;
                const text = msg.text();
                if (/Failed to load resource/.test(text)) return;
                if (!mine((msg.location() || {}).url)) return;
                errors.push(text);
            });

            let result;
            try {
                await tab.goto(page.url, { waitUntil: "domcontentloaded", timeout: 45000 });
                await tab.waitForTimeout(1200);
                result = await tab.evaluate(inspect);
            } catch (err) {
                result = { failed: String(err).slice(0, 120) };
            }

            const problems = [];
            if (result.failed) problems.push(result.failed);
            else {
                if (!result.themed) problems.push("theme not applied");
                if (result.overflow > 1) problems.push("overflows by " + result.overflow + "px");
                if (!result.nav) problems.push("no top bar");
                if (result.logo.mode !== "art") {
                    problems.push("logo fell back to type (" + result.logo.natural + ")");
                }
                if (!result.skip) problems.push("no skip link");
                if (result.invisibleLinks) problems.push(result.invisibleLinks + " invisible links");
                if (result.tinyText) problems.push(result.tinyText + " nodes under 11px");
                if (size.label === "desktop" && result.boardLinks.length < 4) {
                    problems.push("only " + result.boardLinks.length + " board links");
                }
                if (errors.length) problems.push(errors.length + " script errors: " + errors[0].slice(0, 140));

                if (size.label === "desktop" && !result.donate) problems.push("the donation link is not marked");
                else if (result.donate && !/donat/i.test(result.donate.href || "")) {
                    problems.push("the marked donation link points at " + result.donate.href);
                }
                else if (result.donate && !result.donate.w) problems.push("the donation link is marked but has no size");

                if (result.quotes.broken) {
                    problems.push(result.quotes.broken + " folded quote(s) were taken out of the page");
                }
                if (!result.loggedIn && result.retargeted) {
                    problems.push(result.retargeted + " titles retargeted to unread with no account");
                }
                if (result.refineBoxes > 1) {
                    problems.push(result.refineBoxes + " search boxes for one search");
                }

                if (reached.length) {
                    problems.push("asked Steam a question with the preview off: " + reached[0].slice(0, 70));
                }
            }

            const label = (size.label + "/" + page.name).padEnd(22);
            if (problems.length) { failures += 1; console.log("FAIL " + label + problems.join("; ")); }
            else {
                const extra = result.posts
                    ? "  " + result.posts + " posts, " + result.finder + " in the finder, " +
                      result.quotes.folded + "/" + result.quotes.total + " quotes folded"
                    : "  " + result.boardLinks.length + " board links";
                console.log("ok   " + label + extra);
            }

            await tab.close();
        }
        await context.close();
    }

    await browser.close();
    console.log(failures ? "\n" + failures + " live checks failed" : "\nthe live board is happy");
    process.exit(failures ? 1 : 0);
}

main();

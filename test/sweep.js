#!/usr/bin/env node
/* ------------------------------------------------------------------
   A sweep over the live board.

   The fixtures are a dozen pages. The board is a few hundred thousand,
   in two languages, with topics that are one post long and topics that
   are twelve hundred pages long, code blocks, spoilers, embedded
   players, six kinds of prefix and every shape of post a bulletin
   board has accumulated since 2003. Every bug found so far that the
   fixtures missed was found by opening a real page and looking.

   So this opens fifty of them — the index, every English forum, the
   Russian ones, a spread of topics chosen off the listings for their
   prefix and their size, and the deep pages of the long ones — with
   the built script injected at document-start the way a userscript
   manager runs it, and asks each page the same twenty questions. What
   comes back is a list of things to fix, each with the page it was
   seen on, rather than an impression.

   Read-only, paced, and sequential: the board queues a client that
   asks too fast, and fifty pages at one every two seconds is a person
   browsing.

       node test/sweep.js                 # 50 pages
       node test/sweep.js --pages 20
       node test/sweep.js --save          # keep each page's HTML for a fixture
   ------------------------------------------------------------------ */

const fs = require("fs");
const path = require("path");

const ROOT = "https://cs.rin.ru/forum/";
const OUT = path.join(__dirname, "sweep");
const PACE = 1800;      /* ms between pages */

const arg = (name, fallback) => {
    const at = process.argv.indexOf("--" + name);
    return at >= 0 && process.argv[at + 1] ? process.argv[at + 1] : fallback;
};
const WANT = Number(arg("pages", 50));
const SAVE = process.argv.includes("--save");
/* The same questions at another width, or with the script set up
   differently. A phone is a different layout entirely and the light
   theme is a different palette; the features that ship switched off
   have only ever been exercised on fixtures.

       node test/sweep.js --width 390
       node test/sweep.js --settings '{"theme":"paper"}'
       node test/sweep.js --settings '{"quietPosts":true,"foldQuotesLines":3}' */
const WIDTH = Number(arg("width", 1440));
const SETTINGS = arg("settings", null);
/* One page rather than the tour: a shape the tour does not reach, such
   as a search result page.

       node test/sweep.js --url "search.php?search_id=active_topics" */
const ONLY = arg("url", null);

/* The board's English forums, off its own index, and the Russian
   general one so a page in the other language is in the sweep. */
const FORUMS = [10, 29, 32, 38, 14, 20, 19, 1, 5];

/* The script's own colour functions, so question 14 measures a page
   exactly the way the script did when it decided what to lift. */
const DOM_SRC = fs.readFileSync(path.join(__dirname, "..", "src", "core", "dom.js"), "utf8");
const COLOUR_CODE = DOM_SRC.slice(DOM_SRC.indexOf("function parseColour"), DOM_SRC.indexOf("/* ---- Numbers ---"));

/**
 * The questions. Runs in the page.
 *
 * Each returns a list of short strings, one per thing seen; an empty
 * list is a pass. They are deliberately cheap — a sweep that takes a
 * second a page is one that gets run.
 */
function askThePage(COLOUR_CODE) {
    const found = [];
    const note = (kind, text) => found.push(kind + ": " + String(text).replace(/\s+/g, " ").trim().slice(0, 110));
    const visible = (node) => {
        const box = node.getBoundingClientRect();
        return box.width > 0 && box.height > 0;
    };
    const lang = (document.documentElement.getAttribute("lang") || "").toLowerCase();

    /* 1. The page fits the window. */
    const overflow = document.body.scrollWidth - window.innerWidth;
    if (overflow > 1) note("overflow", overflow + "px wider than the window");

    /* 2. Nothing the script drew appears twice. */
    for (const one of [".rr-nav", ".rr-topicbar", ".rr-releases", ".rr-boardbar", ".rr-header", ".rr-toolbar"]) {
        const count = document.querySelectorAll(one).length;
        if (count > 1) note("duplicate", count + " x " + one);
    }

    /* 3. Text under the floor. */
    let tiny = 0;
    for (const node of document.querySelectorAll("#wrapcentre td, #wrapcentre p, #wrapcentre span, #wrapcentre a")) {
        if (!node.textContent.trim() || !visible(node)) continue;
        if (parseFloat(getComputedStyle(node).fontSize) < 11) tiny += 1;
    }
    if (tiny) note("tiny-text", tiny + " visible elements under 11px");

    /* 4. Controls with no name. */
    for (const node of document.querySelectorAll(".rr-nav a, .rr-nav button, .rr-posttools > *, .rr-fab button, .rr-topicbar a, .rr-topicbar button")) {
        if (!visible(node)) continue;
        const name = (node.getAttribute("aria-label") || node.getAttribute("title") || node.textContent || "").trim();
        if (!name) note("nameless-control", node.tagName + "." + node.className);
    }

    /* 5. Separators separating nothing. */
    for (const cell of document.querySelectorAll("#wrapcentre td, #wrapcentre p, #wrapcentre span")) {
        if (!visible(cell) || cell.classList.contains("rr-sep")) continue;
        const text = cell.textContent.replace(/[\s ]+/g, " ").trim();
        if (/^[|·•]+$/.test(text)) note("lone-separator", cell.tagName + "." + cell.className + " holds only " + text);
        else if (/\|\s*\|/.test(text) && text.length < 200) note("double-separator", text);
    }

    /* 6. Russian leaking into an English page, and the reverse. */
    if (lang.startsWith("en")) {
        for (const rank of document.querySelectorAll(".rr-posthead__rank")) {
            if (/[Ѐ-ӿ]/.test(rank.textContent)) note("untranslated-rank", rank.textContent);
        }
    }

    /* 7. The releases panel says something sensible. */
    for (const version of document.querySelectorAll(".rr-releases__version")) {
        const text = version.textContent.trim();
        if (/^v?(19|20)\d\d\./.test(text)) note("date-as-version", text);
        if (/^v\d{5,}/.test(text)) note("huge-version", text);
    }
    const latest = document.querySelector(".rr-releases__latest");
    if (latest && /(19|20)\d\d\.\d/.test(latest.textContent)) note("date-as-latest", latest.textContent);

    /* 8. Images this script asked for that did not arrive. */
    for (const img of document.querySelectorAll(".rr-nav img, .rr-masthead img, .rr-langswitch img, .rr-game__art")) {
        if (img.complete && img.naturalWidth === 0) note("broken-image", img.getAttribute("src"));
    }

    /* 9. Empty boxes left standing. */
    for (const table of document.querySelectorAll("#wrapcentre table.tablebg")) {
        if (!visible(table)) continue;
        if (table.textContent.trim()) continue;
        if (table.querySelector("img, input, a[href], form")) continue;
        note("empty-box", "a visible table.tablebg with nothing in it, " + Math.round(table.getBoundingClientRect().height) + "px tall");
    }

    /* 10. Runs of <br> that survived as spacing. */
    /* Only the <br> that still take room. The stylesheet hides the
       board's own spacing breaks now; a hidden one is not a gap, and a
       check that counts nodes rather than pixels would keep reporting
       what a reader can no longer see. */
    let runs = 0;
    const shows = (node) => node.getClientRects().length > 0;
    for (const br of document.querySelectorAll("#wrapcentre > br, #pagecontent > br")) {
        if (!shows(br)) continue;
        let count = 1;
        let next = br.nextElementSibling;
        while (next && next.tagName === "BR" && shows(next)) { count += 1; next = next.nextElementSibling; }
        if (count >= 2 && br.previousElementSibling && br.previousElementSibling.tagName !== "BR") runs += 1;
    }
    if (runs) note("br-runs", runs + " run(s) of two or more <br> between blocks");

    /* 11. The action bar has become a stack. */
    const bar = document.querySelector(".rr-topicbar[data-rr-rows]");
    if (bar && bar.getBoundingClientRect().height > (window.innerWidth < 700 ? 220 : 130)) {
        note("tall-bar", "topic bar is " + Math.round(bar.getBoundingClientRect().height) + "px tall");
    }

    /* 12. "Page N of M" still drawn by the board. */
    for (const cell of document.querySelectorAll("#wrapcentre td.nav")) {
        if (visible(cell) && /^\s*Page\s+\d+\s+of\s+\d+\s*$/.test(cell.textContent.replace(/\s+/g, " "))) {
            note("board-pager", cell.textContent.trim());
        }
    }

    /* 13. Counts that were not grouped. */
    for (const cell of document.querySelectorAll('td[data-rr-col="views"], td[data-rr-col="posts"], td[data-rr-col="replies"], td[data-rr-col="topics"]')) {
        if (/\d{5,}/.test(cell.textContent)) note("ungrouped", cell.textContent.trim());
    }

    /* 14. Coloured text still hard to read after the lift — measured
       with the script's own colour code, handed in from src/core/dom.js,
       so this and the script cannot disagree about what is behind a
       span. A copy written here did, and reported an olive marker on a
       dark cell as 1.9:1 when it was 5.8. */
    const colour = new Function(COLOUR_CODE + "\nreturn { parseColour, backdropOf, contrastRatio };")();
    let dim = 0;
    let dimSample = "";
    for (const node of document.querySelectorAll('#wrapcentre [style*="color"]')) {
        if (!node.style.color || !visible(node) || !node.textContent.trim()) continue;
        const fg = colour.parseColour(getComputedStyle(node).color);
        if (!fg) continue;
        const ratio = colour.contrastRatio(fg, colour.backdropOf(node));
        if (ratio < 4.4) {
            dim += 1;
            if (!dimSample) dimSample = JSON.stringify(node.textContent.trim().slice(0, 20)) + " at " + ratio.toFixed(2)
                + (node.getAttribute("data-rr-ink") ? " (lifted from " + node.getAttribute("data-rr-ink") + ")" : " (not lifted)");
        }
    }
    if (dim) note("dim-ink", dim + " coloured text(s) under 4.4:1, e.g. " + dimSample);

    /* 15. Two controls in one post going to the same place. */
    const seenTools = new Set();
    for (const tools of document.querySelectorAll(".rr-posttools")) {
        const hrefs = new Set();
        for (const control of tools.querySelectorAll("a[href]")) {
            const href = control.getAttribute("href").replace(/[?&]sid=[a-f0-9]+/, "");
            if (hrefs.has(href) && !seenTools.has(href)) { seenTools.add(href); note("duplicate-tool", href.slice(-50)); }
            hrefs.add(href);
        }
    }

    /* 16. Text clipped inside a nowrap box this script made. */
    /* Not the breadcrumb: its last link is the page title and is
       ellipsised on purpose, which on a phone is every page. */
    for (const node of document.querySelectorAll(".rr-posthead__meta, .rr-posthead__rank, .rr-releases__who")) {
        if (visible(node) && node.scrollWidth - node.clientWidth > 2) {
            note("clipped", node.className + " clips " + JSON.stringify(node.textContent.trim().slice(0, 40)));
        }
    }

    /* 17. The panel's kinds. Anything the finder listed with no kind and
       no links is a post it should not have listed. */
    for (const row of document.querySelectorAll(".rr-releases__row")) {
        if (!row.querySelector(".rr-releases__tag")) note("kindless-row", row.textContent.trim().slice(0, 60));
    }

    /* 18. Hidden but focusable. */
    let ghosts = 0;
    for (const node of document.querySelectorAll("#wrapcentre a[href], #wrapcentre button")) {
        if (visible(node)) continue;
        /* checkVisibility() is false for anything under a display:none
           ancestor, wherever the rule that hid it lives — which is the
           case the first version of this check missed: it read inline
           styles only, and reported the board's "Top" link fifteen
           times a page because the cell around it was hidden by the
           stylesheet. Such a link is out of the tab order already. */
        if (typeof node.checkVisibility === "function" ? !node.checkVisibility() : false) continue;
        if (node.closest(".rr-skip, [data-rr-quiet], .rr-signature, .spoiler, .rr-panel")) continue;
        ghosts += 1;
    }
    if (ghosts > 3) note("ghost-controls", ghosts + " links or buttons laid out at zero size but not hidden");

    return found;
}

/** Topics off a listing page, spread across prefixes and sizes. */
function pickTopics() {
    const rows = Array.from(document.querySelectorAll("a.topictitle")).map((a) => {
        const row = a.closest("tr");
        const cell = row && row.querySelector('td[data-rr-col="replies"]');
        const replies = cell ? Number(cell.textContent.replace(/\D/g, "")) || 0 : 0;
        const tag = (row && row.querySelector(".rr-tag")) ? row.querySelector(".rr-tag").textContent.trim() : "none";
        const href = a.getAttribute("href").replace(/[?&]sid=[a-f0-9]+/, "").replace(/#.*$/, "");
        const m = href.match(/t=(\d+)/);
        return m ? { t: m[1], f: (href.match(/f=(\d+)/) || [])[1], replies, tag, title: a.textContent.trim().slice(0, 50) } : null;
    }).filter(Boolean);
    return rows;
}

async function main() {
    let chromium;
    try { ({ chromium } = require("playwright-core")); }
    catch { console.error("run: npm i -D playwright-core"); process.exit(2); }

    const bundle = fs.readFileSync(path.join(__dirname, "..", "dist", "rin-reforged.user.js"), "utf8");
    const browser = await chromium.launch(
        process.env.RR_CHROME ? { executablePath: process.env.RR_CHROME } : {});
    const context = await browser.newContext({
        viewport: { width: WIDTH, height: WIDTH < 700 ? 844 : 900 },
    });
    if (SETTINGS) {
        JSON.parse(SETTINGS);                                  // fail here, not in the page
        await context.addInitScript((value) => {
            try { localStorage.setItem("rr:settings", value); } catch { /* private mode */ }
        }, SETTINGS);
    }
    await context.addInitScript(bundle);
    if (SAVE) fs.mkdirSync(OUT, { recursive: true });

    const tab = await context.newPage();
    const errors = [];
    tab.on("pageerror", (err) => errors.push(String(err).slice(0, 160)));
    tab.on("console", (msg) => {
        const text = msg.text();
        if (msg.type() !== "error") return;
        if (/Failed to load resource|net::ERR|youtube|googlevideo|Trusted Type|Permissions policy violation/i.test(text)) return;
        errors.push(text.slice(0, 160));
    });

    const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
    const tally = new Map();
    const perPage = [];
    let opened = 0;

    const visit = async (label, url) => {
        if (opened >= WANT) return null;
        opened += 1;
        errors.length = 0;
        const started = Date.now();
        try {
            await tab.goto(ROOT + url, { waitUntil: "domcontentloaded", timeout: 45000 });
        } catch (err) {
            perPage.push({ label, url, findings: ["navigation: " + String(err).slice(0, 80)] });
            return null;
        }
        await sleep(900);
        await tab.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))));

        let findings = [];
        try { findings = await tab.evaluate(askThePage, COLOUR_CODE); }
        catch (err) { findings = ["asking: " + String(err).slice(0, 100)]; }
        for (const error of errors) findings.push("script-error: " + error);

        const meta = await tab.evaluate(() => ({
            title: document.title.replace(/CS RIN - Steam Underground/, "").replace(/^\W+/, "").slice(0, 50),
            posts: document.querySelectorAll(".postbody").length,
            pages: (document.body.textContent.match(/Page \d+ of (\d+)/) || [])[1] || "",
        }));

        if (SAVE) {
            const html = await tab.content();
            fs.writeFileSync(path.join(OUT, label.replace(/[^a-z0-9-]/gi, "_") + ".html"), html, "utf8");
        }

        for (const finding of findings) {
            const kind = finding.split(":")[0];
            tally.set(kind, (tally.get(kind) || 0) + 1);
        }
        perPage.push({ label, url, meta, findings, ms: Date.now() - started });
        console.log(
            (findings.length ? "!! " : "ok ") + String(opened).padStart(2) + "  " + label.padEnd(22)
            + (meta.title || "").padEnd(42) + (findings.length ? "  " + findings.length + " finding(s)" : ""));
        await sleep(PACE);
        return findings;
    };

    if (ONLY) {
        for (const url of ONLY.split(",")) await visit(url.slice(0, 22), url.trim());
    }

    /* The index, then a listing of each forum, discovering topics as
       it goes. */
    if (!ONLY) await visit("index", "index.php");
    const topics = [];
    for (const f of ONLY ? [] : FORUMS) {
        await visit("forum f=" + f, "viewforum.php?f=" + f);
        try {
            const picked = await tab.evaluate(pickTopics);
            for (const topic of picked) topics.push(Object.assign({ forum: f }, topic));
        } catch { /* a login page has no listing */ }
    }
    // Page two of the main forum: rows the first page never shows.
    if (!ONLY) await visit("forum f=10 p2", "viewforum.php?f=10&start=50");

    /* Topics: one of each prefix seen, the biggest few, the smallest
       few, and whatever is left up to the budget. */
    const byTag = new Map();
    for (const topic of topics) {
        if (!byTag.has(topic.tag)) byTag.set(topic.tag, topic);
    }
    const chosen = new Map();
    for (const topic of byTag.values()) chosen.set(topic.t, topic);
    const bySize = topics.slice().sort((a, b) => b.replies - a.replies);
    for (const topic of bySize.slice(0, 6)) chosen.set(topic.t, topic);
    for (const topic of bySize.slice(-6)) chosen.set(topic.t, topic);
    for (const topic of topics) {
        if (chosen.size >= 30) break;
        chosen.set(topic.t, topic);
    }

    for (const topic of chosen.values()) {
        if (opened >= WANT) break;
        const url = "viewtopic.php?f=" + (topic.f || topic.forum) + "&t=" + topic.t;
        const findings = await visit("[" + topic.tag + "] t=" + topic.t, url);
        // The last page of anything long: where the update thread is
        // actually read, and where the nav strips differ.
        if (findings !== null && topic.replies >= 60 && opened < WANT) {
            const pages = Math.ceil((topic.replies + 1) / 15);
            await visit("  └ last page", url + "&start=" + ((pages - 1) * 15));
        }
    }

    await browser.close();

    /* The report: what was seen, how often, and where. */
    console.log("\n" + opened + " pages opened at " + WIDTH + "px" + (SETTINGS ? " with " + SETTINGS : ""));
    const kinds = Array.from(tally.entries()).sort((a, b) => b[1] - a[1]);
    if (!kinds.length) { console.log("nothing to report"); return; }

    console.log("\nfindings by kind:");
    for (const [kind, count] of kinds) console.log("  " + String(count).padStart(4) + "  " + kind);

    console.log("\nby page:");
    for (const page of perPage) {
        if (!page.findings.length) continue;
        console.log("\n  " + page.label + "  " + ROOT + page.url);
        const seen = new Set();
        for (const finding of page.findings) {
            if (seen.has(finding)) continue;
            seen.add(finding);
            console.log("      " + finding);
        }
    }

    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(perPage, null, 1), "utf8");
    console.log("\nfull report: test/sweep/report.json");
}

main();

#!/usr/bin/env node
/* ------------------------------------------------------------------
   The screenshots the README shows, regenerated from the test pages.

   Both halves of every before/after pair. A shot marked `raw` is taken
   with JavaScript disabled in the browser context: the test pages have
   the bundle inlined at the end of <body>, so switching JavaScript off
   is exactly "the board as it ships, same page, same width, same
   moment" — which is the only honest thing to put next to an "after".

       node build.js && node test/prepare.js
       python test/serve.py &
       RR_CHROME=/path/to/chrome node test/shots.js
   ------------------------------------------------------------------ */

const path = require("path");
const BASE = process.env.RR_BASE || "http://localhost:8731";
const OUT = path.join(__dirname, "..", "docs", "screenshots");

const INDEX = "/forum/index.php";
const FORUM = "/forum/viewforum.php?f=10";
const TOPIC = "/forum/topic/viewtopic.php?f=10&t=133316";
const CHATTER = "/forum/chatter/viewtopic.php?f=14&t=75717&start=225";
const THREAD = "/forum/thread/viewtopic.php?f=14&t=920000&start=12";
const QUOTES = "/forum/quotes/viewtopic.php?f=14&t=75717&start=225";

const SHOTS = [
    /* ---- Before: the board as it ships -------------------------- */
    { name: "viewforum-1440", url: FORUM, raw: true, viewport: [1440, 900], clip: [0, 0, 1440, 820] },
    { name: "topic-mobile", url: TOPIC, raw: true, viewport: [390, 844], clip: [0, 0, 390, 844] },

    /* ---- After --------------------------------------------------- */
    { name: "forum-dark", url: FORUM, viewport: [1440, 900], clip: [0, 0, 1440, 820] },
    { name: "topic-game-card", url: TOPIC, viewport: [1440, 980], clip: [0, 0, 1440, 900] },
    { name: "topic-mobile-after", url: TOPIC, viewport: [390, 844], clip: [0, 0, 390, 844] },

    // The panel, opened. Cropped to the panel itself rather than the
    // page behind it.
    {
        name: "settings",
        url: FORUM,
        viewport: [1440, 900],
        clip: [720, 0, 720, 900],
        before: () => document.querySelector(".rr-nav__actions button[title*='settings']").click(),
    },
    {
        name: "palette",
        url: FORUM,
        viewport: [1440, 900],
        clip: [380, 60, 680, 500],
        before: () => document.querySelector(".rr-nav__search").click(),
    },

    /* ---- v0.4 --------------------------------------------------- */
    {
        name: "folded-quote",
        url: QUOTES,
        viewport: [1240, 900],
        settings: { foldQuotesLines: 3 },
        // Scrolled to a quote that actually folded rather than to a
        // fixed offset: which ones do depends on how the text wraps.
        before: () => {
            const quote = document.querySelector('[data-rr-quote="folded"]');
            if (quote) quote.closest("table.tablebg").scrollIntoView({ block: "center" });
        },
        clip: [0, 120, 1160, 560],
    },
    {
        name: "releases",
        url: THREAD,
        // The frame follows the window now, so the crop follows the
        // panel: a fixed rectangle cut the right-hand third off it.
        viewport: [1420, 1120],
        settle: 4200,
        before: () => {
            const tab = Array.from(document.querySelectorAll(".rr-releases__tab"))
                .find((n) => /All \d+ pages/.test(n.textContent));
            if (tab) tab.click();
        },
        clipTo: ".rr-releases",
    },
];

async function main() {
    let chromium;
    try { ({ chromium } = require("playwright-core")); }
    catch { console.error("run: npm i -D playwright-core"); process.exit(2); }

    const fs = require("fs");
    fs.mkdirSync(OUT, { recursive: true });

    const browser = await chromium.launch(
        process.env.RR_CHROME ? { executablePath: process.env.RR_CHROME } : {}
    );

    for (const shot of SHOTS) {
        const context = await browser.newContext({
            viewport: { width: shot.viewport[0], height: shot.viewport[1] },
            // The bundle is inlined in these pages, so switching
            // JavaScript off is how a "before" is taken.
            javaScriptEnabled: !shot.raw,
        });
        if (shot.settings) {
            await context.addInitScript((stored) => {
                try { localStorage.setItem("rr:settings", stored); } catch { /* private mode */ }
            }, JSON.stringify(shot.settings));
        }
        const tab = await context.newPage();
        await tab.goto(BASE + shot.url, { waitUntil: "domcontentloaded" });
        await tab.waitForTimeout(600);
        if (shot.before) { await tab.evaluate(shot.before); await tab.waitForTimeout(shot.settle || 300); }

        // A raw page has no viewport tag, so a phone gets a 1000px
        // layout scaled down — which is the point of the picture.
        let box = null;
        if (shot.clipTo) {
            // A crop that follows the block rather than a rectangle
            // that has to be re-guessed every time the layout moves.
            box = await tab.evaluate((selector) => {
                const node = document.querySelector(selector);
                if (!node) return null;
                const r = node.getBoundingClientRect();
                return { x: Math.max(0, r.x - 8), y: Math.max(0, r.y - 8),
                    width: r.width + 16, height: r.height + 16 };
            }, shot.clipTo);
        }
        if (!box) {
            const [x, y, width, height] = shot.clip || [0, 0, shot.viewport[0], shot.viewport[1]];
            box = { x, y, width, height };
        }
        await tab.screenshot({ path: path.join(OUT, shot.name + ".png"), clip: box });
        console.log("docs/screenshots/" + shot.name + ".png");
        await context.close();
    }

    await browser.close();
}

main();

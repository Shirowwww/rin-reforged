#!/usr/bin/env node
/* ------------------------------------------------------------------
   What the script costs to run.

   Every other measurement here is about what the script *does*. This
   one is about what it takes: the board is read on whatever machine
   its readers have, on pages with three hundred posts, and a redesign
   that costs a second of frozen tab on the biggest thread is a worse
   redesign than one that costs nothing.

   Numbers, per page:

     scripting   total time the main thread spent in JavaScript, from
                 the browser's own performance timeline
     boot        from the first byte of the document to the moment the
                 top bar exists, which is when the page stops looking
                 like the board and starts looking like this
     layout      how many forced synchronous layouts the script caused
                 — reading a geometry property after writing to the DOM
                 is what turns a linear pass into a quadratic one
     dom         nodes on the page, as the scale the rest is against

       node test/perf.js
       node test/perf.js --runs 5
   ------------------------------------------------------------------ */

const BASE = process.env.RR_BASE || "http://localhost:8731";

const PAGES = [
    { name: "index", url: "/forum/index.php" },
    { name: "viewforum", url: "/forum/viewforum.php?f=10" },
    { name: "topic", url: "/forum/topic/viewtopic.php?f=10&t=133316" },
    { name: "replies", url: "/forum/replies/viewtopic.php?f=14&t=75717&start=225" },
];

const RUNS = Number((process.argv.find((a) => a.startsWith("--runs=")) || "").split("=")[1])
    || (process.argv.includes("--runs") ? Number(process.argv[process.argv.indexOf("--runs") + 1]) : 0)
    || 3;

function median(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
}

/** One page, once. */
async function once(context, page) {
    const tab = await context.newPage();
    const client = await context.newCDPSession(tab);
    await client.send("Performance.enable");

    await tab.goto(BASE + page.url, { waitUntil: "load" });
    await tab.waitForFunction(() => document.documentElement.hasAttribute("data-rr"), null, { timeout: 20000 });
    // Let the late phase finish before reading the counters.
    await tab.evaluate(() => new Promise((done) => setTimeout(done, 400)));

    const metrics = {};
    for (const entry of (await client.send("Performance.getMetrics")).metrics) {
        metrics[entry.name] = entry.value;
    }

    const inPage = await tab.evaluate(() => {
        const nav = performance.getEntriesByType("navigation")[0] || {};
        const bar = document.querySelector(".rr-nav");
        return {
            nodes: document.getElementsByTagName("*").length,
            posts: document.querySelectorAll(".postbody").length,
            rows: document.querySelectorAll("table[data-rr-list] tr").length,
            domContentLoaded: nav.domContentLoadedEventEnd || 0,
            loaded: nav.loadEventEnd || 0,
            barPresent: Boolean(bar),
        };
    });

    await client.detach();
    await tab.close();
    return {
        scripting: (metrics.ScriptDuration || 0) * 1000,
        layoutTime: (metrics.LayoutDuration || 0) * 1000,
        recalc: (metrics.RecalcStyleDuration || 0) * 1000,
        layouts: metrics.LayoutCount || 0,
        recalcs: metrics.RecalcStyleCount || 0,
        loaded: inPage.loaded,
        nodes: inPage.nodes,
        posts: inPage.posts,
        rows: inPage.rows,
    };
}

async function main() {
    let chromium;
    try { ({ chromium } = require("playwright-core")); }
    catch { console.error("run: npm i -D playwright-core"); process.exit(2); }

    const browser = await chromium.launch(
        process.env.RR_CHROME ? { executablePath: process.env.RR_CHROME } : {});
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

    console.log("median of " + RUNS + " runs, 1440x900\n");
    console.log("page        nodes  posts   script   style   layout   loaded");
    for (const page of PAGES) {
        const runs = [];
        for (let i = 0; i < RUNS; i += 1) runs.push(await once(context, page));
        const pick = (key) => median(runs.map((r) => r[key]));
        console.log([
            page.name.padEnd(10),
            String(pick("nodes")).padStart(6),
            String(pick("posts")).padStart(6),
            (pick("scripting").toFixed(0) + " ms").padStart(9),
            (pick("recalc").toFixed(0) + " ms").padStart(8),
            (pick("layoutTime").toFixed(0) + " ms").padStart(9),
            (pick("loaded").toFixed(0) + " ms").padStart(9),
        ].join(" "));
    }

    await browser.close();
}

main();

#!/usr/bin/env node
/* ------------------------------------------------------------------
   How long the Releases panel takes to read a whole topic, and how
   many requests it costs.

   Two modes, and both matter.

   `--local` runs against the twenty page fixture with a delay added to
   every page request, so a change can be measured repeatably without
   asking the board for anything. The delay is not invented: it is the
   time-to-first-byte measured against cs.rin.ru from here.

   `--live` runs against the board itself, read-only, and is the number
   that counts. One scan is what a reader clicking the button once
   costs, which is the whole point of the panel.

       node test/scan.js --local
       node test/scan.js --local --repeat        (and then "Read it again")
       RR_LIVE_TOPIC=109435 node test/scan.js --live
   ------------------------------------------------------------------ */

const fs = require("fs");
const path = require("path");

const BASE = process.env.RR_BASE || "http://localhost:8731";
const LOCAL_TOPIC = "/forum/long/viewtopic.php?f=14&t=930000";
const LIVE_TOPIC = process.env.RR_LIVE_TOPIC || "109435";
const LIVE_FORUM = process.env.RR_LIVE_FORUM || "10";
/* Measured with curl against cs.rin.ru: 0.58 s to first byte for a
   viewtopic page, 23.6 KB gzipped over 141 KB of markup. The harness
   answers instantly, so without this every scan measures how fast
   localhost is. */
const LATENCY = Number(process.env.RR_LATENCY || 580);

const PAGE_RE = /viewtopic\.php/;
const SCAN_TIMEOUT = 300000;

function report(name, ms, requests, rows, extra) {
    const line = [
        name.padEnd(16),
        ((ms / 1000).toFixed(2) + " s").padStart(8),
        String(requests).padStart(3) + " requests",
        String(rows).padStart(3) + " rows",
    ];
    if (extra) line.push(extra);
    console.log("  " + line.join("   "));
}

/** The whole-topic control, once it has stopped working. */
function settled() {
    const control = Array.from(document.querySelectorAll(".rr-releases__tab"))
        .find((node) => /All \d+ page|Reading /.test(node.textContent));
    return Boolean(control) && !control.disabled;
}

async function measure(tab, start) {
    await tab.evaluate(start);
    await tab.waitForFunction(settled, null, { timeout: SCAN_TIMEOUT });
    return tab.evaluate(() => ({
        ms: performance.now() - window.__rrScanStart,
        rows: document.querySelectorAll(".rr-releases__row").length,
        note: (document.querySelector(".rr-releases__note") || {}).textContent || "",
    }));
}

const clickWholeTopic = () => {
    const control = Array.from(document.querySelectorAll(".rr-releases__tab"))
        .find((node) => /All \d+ page/.test(node.textContent));
    if (!control) throw new Error("no whole-topic control on this page");
    window.__rrScanStart = performance.now();
    control.click();
};

const clickReadAgain = () => {
    const again = Array.from(document.querySelectorAll(".rr-releases .rr-btn"))
        .find((node) => /read it again/i.test(node.textContent));
    if (!again) throw new Error("no Read it again control");
    window.__rrScanStart = performance.now();
    again.click();
};

async function localRun(chromium, repeat) {
    const browser = await chromium.launch(
        process.env.RR_CHROME ? { executablePath: process.env.RR_CHROME } : {});
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

    const seen = { requests: 0, peak: 0, inFlight: 0 };
    await context.route("**/*", async (route) => {
        const url = route.request().url();
        if (!PAGE_RE.test(url) || !url.includes("start=")) return route.continue();
        seen.requests += 1;
        seen.inFlight += 1;
        seen.peak = Math.max(seen.peak, seen.inFlight);
        await new Promise((done) => setTimeout(done, LATENCY));
        seen.inFlight -= 1;
        return route.continue();
    });

    const tab = await context.newPage();
    tab.on("pageerror", (err) => console.log("  ! " + String(err).slice(0, 140)));
    await tab.goto(BASE + LOCAL_TOPIC, { waitUntil: "domcontentloaded" });
    await tab.waitForTimeout(400);

    console.log("local: 20 pages, " + LATENCY + " ms added to every page request");
    const first = await measure(tab, clickWholeTopic);
    report("first scan", first.ms, seen.requests, first.rows, "peak " + seen.peak + " in flight");

    if (repeat) {
        const before = seen.requests;
        const again = await measure(tab, clickReadAgain);
        report("read it again", again.ms, seen.requests - before, again.rows);
    }

    await browser.close();
}

async function liveRun(chromium, repeat) {
    const bundle = fs.readFileSync(path.join(__dirname, "..", "dist", "rin-reforged.user.js"), "utf8");
    const browser = await chromium.launch(
        process.env.RR_CHROME ? { executablePath: process.env.RR_CHROME } : {});
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    // document-start, the way a userscript manager runs it.
    await context.addInitScript(bundle);

    /* The board's own response time swings by an order of magnitude
       from one minute to the next — 0.4 s a page at its quickest and
       close to 4 s at its slowest, measured across a single afternoon.
       Wall-clock alone therefore says more about when the run happened
       than about the code, so each request's own timing is added up
       beside it: how much of the run was the board answering, and what
       one page cost on average while it did. */
    const seen = { requests: 0, peak: 0, inFlight: 0, waited: 0, slowest: 0 };
    const counts = (req) => PAGE_RE.test(req.url()) && req.url().includes("start=");
    context.on("request", (req) => {
        if (!counts(req)) return;
        seen.requests += 1;
        seen.inFlight += 1;
        seen.peak = Math.max(seen.peak, seen.inFlight);
    });
    const done = (req) => {
        if (!counts(req)) return;
        seen.inFlight -= 1;
        const timing = req.timing();
        if (timing && timing.responseEnd > 0) {
            const ms = timing.responseEnd - timing.requestStart;
            seen.waited += ms;
            seen.slowest = Math.max(seen.slowest, ms);
        }
    };
    context.on("requestfinished", done);
    context.on("requestfailed", done);

    const tab = await context.newPage();
    const refused = [];
    tab.on("response", (res) => {
        /* Only the walk's own requests. The board answers the *first*
           navigation with a 401 and a JavaScript challenge that sets a
           cookie and redirects — that is how cs.rin.ru greets every
           client, and counting it as a refusal would report a rate
           limit that is not there. */
        if (!res.url().includes("start=")) return;
        if (PAGE_RE.test(res.url()) && res.status() >= 400) {
            refused.push(res.status() + " " + res.url().slice(-46));
        }
    });

    const url = "https://cs.rin.ru/forum/viewtopic.php?f=" + LIVE_FORUM + "&t=" + LIVE_TOPIC;
    await tab.goto(url, { waitUntil: "domcontentloaded" });
    /* How long to let the page settle before asking. A game topic's
       first post is a Steam dump — header art, screenshots — and those
       images are still arriving over the same connection the walk is
       about to use, which is worth being able to vary rather than
       guess at. */
    await tab.waitForTimeout(Number(process.env.RR_SETTLE || 1800));

    const label = await tab.evaluate(() => {
        const control = Array.from(document.querySelectorAll(".rr-releases__tab"))
            .find((node) => /All \d+ page/.test(node.textContent));
        return control ? control.textContent : null;
    });
    console.log("live: " + url);
    console.log("  the control says: " + label);

    seen.requests = 0;
    seen.waited = 0;
    const result = await measure(tab, clickWholeTopic);
    const per = seen.requests ? Math.round(seen.waited / seen.requests) : 0;
    report("whole topic", result.ms, seen.requests, result.rows,
        "peak " + seen.peak + " in flight, " + per + " ms a page, slowest "
        + Math.round(seen.slowest) + " ms");

    if (repeat) {
        const before = seen.requests;
        const waited = seen.waited;
        const again = await measure(tab, clickReadAgain);
        const perAgain = seen.requests > before
            ? Math.round((seen.waited - waited) / (seen.requests - before)) : 0;
        report("read it again", again.ms, seen.requests - before, again.rows,
            perAgain + " ms a page");
    }

    console.log(refused.length
        ? "  ! refused: " + refused.slice(0, 4).join(", ")
        : "  nothing the walk asked for was refused: no rate limit, no error");
    console.log("  " + result.note.replace(/\s+/g, " ").trim().slice(0, 130));

    // What it actually found, which is the point of the panel.
    if (process.argv.includes("--rows")) {
        const rows = await tab.evaluate(() => Array.from(document.querySelectorAll(".rr-releases__row"))
            .map((row) => {
                const cell = (name) => (row.querySelector(".rr-releases__" + name) || {}).textContent || "";
                return [
                    cell("version").trim().padEnd(12),
                    Array.from(row.querySelectorAll(".rr-releases__tag")).map((t) => t.textContent).join("+").padEnd(28),
                    cell("who").trim().padEnd(16),
                    cell("page").trim(),
                ].join("  ");
            }));
        console.log();
        for (const row of rows) console.log("    " + row);
    }

    await browser.close();
}

async function main() {
    let chromium;
    try { ({ chromium } = require("playwright-core")); }
    catch { console.error("run: npm i -D playwright-core"); process.exit(2); }

    const repeat = process.argv.includes("--repeat");
    if (process.argv.includes("--live")) await liveRun(chromium, repeat);
    else await localRun(chromium, repeat);
}

main();

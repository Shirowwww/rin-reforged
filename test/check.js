#!/usr/bin/env node
/* ------------------------------------------------------------------
   A quick pass over every test page, in a real browser.

   Checks the things that are easy to break and tedious to spot by eye:
   script errors, horizontal overflow, unstyled leftovers, and whether
   each feature actually attached itself.

       node test/prepare.js
       python test/serve.py &
       node test/check.js

   Needs Playwright available (npx playwright install chromium once).
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


const PAGES = [
    { name: "index", url: "/forum/index.php", expect: ["rr-nav", "rr-online"] },
    { name: "viewforum", url: "/forum/viewforum.php?f=10", expect: ["rr-nav", "rr-toolbar", "rr-tag", "rr-topicbar"] },
    { name: "topic", url: "/forum/topic/viewtopic.php?f=10&t=133316", expect: ["rr-nav", "rr-game", "rr-topicbar", "rr-posthead"] },
    { name: "replies", url: "/forum/replies/viewtopic.php?f=14&t=75717&start=225", expect: ["rr-nav", "rr-releases", "rr-posthead"] },
    { name: "profile", url: "/forum/profile/memberlist.php?mode=viewprofile&u=217703", expect: ["rr-nav"] },
    { name: "search", url: "/forum/search/search.php?keywords=steam+api", expect: ["rr-nav", "rr-toolbar"] },
    { name: "search-one", url: "/forum/searchone/search.php?search_id=egosearch", expect: ["rr-nav", "rr-toolbar"] },
];

/* The first is the reference desktop every settings variant is run at.
   The four after it are the desktop sizes the frame has to behave at
   now that it is fluid rather than a fixed 1200px column: 1280 is a
   laptop, 1600 and 1920 are the common desktops, and 2560 is where a
   frame with no ceiling would start setting 200-character lines.
   They run against the default settings only — a settings matrix at
   seven widths is 315 page loads to answer a layout question. */
const WIDTHS = [
    { label: "desktop", width: 1440, height: 900 },
    { label: "laptop-1280", width: 1280, height: 900, frame: true },
    { label: "desk-1600", width: 1600, height: 950, frame: true },
    { label: "desk-1920", width: 1920, height: 1000, frame: true },
    { label: "wide-2560", width: 2560, height: 1080, frame: true },
    { label: "tablet", width: 820, height: 1180 },
    { label: "phone", width: 390, height: 844 },
];

/* What the frame has to do at those widths.

   Two rules, and the second is what makes the first honest. The frame
   has to reach `minShare` of the window *or* `ceiling`, whichever
   comes first — a fixed 1200px column uses 62% of a 1920px window and
   fails that, while a fluid frame that has hit its ceiling at 2560
   passes without the rule having to be weakened. And it may not pass
   the ceiling, which is what stops the correction running the other
   way into 200-character lines on the widest screens.

   `ceiling` is the design, written down: --rr-content-max in
   tokens.css is min(1560px, 95vw). */
const FRAME = { minShare: 0.78, ceiling: 1560 };

/* Settings that change layout rather than only colour. Each is applied
   before the page loads, so the script boots with it in place. */
const VARIANTS = [
    { label: "default", settings: {} },                     // native
    { label: "slate", settings: { theme: "slate" } },
    { label: "paper", settings: { theme: "paper" } },
    { label: "carbon-compact", settings: { theme: "carbon", density: "compact", fontSize: 12 } },
    { label: "roomy-full", settings: { density: "roomy", width: "full", fontSize: 20 } },
    { label: "classic-posts", settings: { postLayout: "classic" } },
    // The two features that ship off. Nothing else in the matrix ever
    // renders a folded reply or a preview card, so nothing else would
    // notice either of them overflowing a phone.
    { label: "folds-on", settings: { quietPosts: true, foldQuotesLines: 3 } },
    { label: "steam-on", settings: { steamPreview: true, steamLookup: false } },
    { label: "everything-off", settings: {
        navbar: false, palette: false, prefixTags: false, listFilter: false,
        gameCard: false, finder: false, postTools: false, modernIcons: false,
        quickPager: false, bookmarks: false, foldWhoIsOnline: false,
    } },
];

async function main() {
    let chromium;
    try {
        ({ chromium } = require("playwright-core"));
    } catch {
        console.error("run: npm i -D playwright-core");
        process.exit(2);
    }

    // playwright-core ships no browser; RR_CHROME points at one that is
    // already on the machine (the MCP server installs them under
    // ~/AppData/Local/ms-playwright on Windows).
    const browser = await chromium.launch(
        process.env.RR_CHROME ? { executablePath: process.env.RR_CHROME } : {}
    );
    let failures = 0;
    let checkedBuild = false;

    const run = async (size, variant) => {
        const context = await browser.newContext({ viewport: { width: size.width, height: size.height } });
        // The script reads localStorage before it touches the DOM, so
        // the variant has to be in place before the first navigation.
        await context.addInitScript((stored) => {
            try { localStorage.setItem("rr:settings", stored); } catch { /* private mode */ }
        }, JSON.stringify(variant.settings));

        for (const page of PAGES) {
            const expect = Object.keys(variant.settings).length ? ["rr-nav"] : page.expect;
            const tab = await context.newPage();
            const errors = [];
            tab.on("pageerror", (err) => errors.push(String(err)));
            tab.on("console", (msg) => {
                const text = msg.text();
                // 404s for images the board will not serve cross-origin
                // are an artefact of the harness, not a finding.
                if (msg.type() === "error" && !/Failed to load resource/.test(text)) errors.push(text);
            });

            await tab.goto(BASE + page.url, { waitUntil: "domcontentloaded" });
            if (!checkedBuild) { checkedBuild = true; await assertFreshBuild(tab); }
            await tab.waitForTimeout(350);

            /* Read the settled page, not a frame of it.
             *
             * Several of these measurements are colours, and a colour
             * that is mid-transition reads as whatever it started from.
             * That is how the light theme came to report five
             * "near-black blocks" on one page in one run out of three:
             * the board's own stylesheet arrives after the first
             * paint, the cells change colour, and a busy headless
             * browser had not advanced the 140ms transition by the
             * time the check looked. Waiting for the animations
             * themselves rather than for another guess at a number of
             * milliseconds makes the run repeatable. */
            await tab.evaluate(() => Promise.all(
                document.getAnimations().map((run) => run.finished.catch(() => {}))
            ));

            const result = await tab.evaluate((expect) => {
                const doc = document.documentElement;
                return {
                    themed: doc.hasAttribute("data-rr"),
                    overflow: document.body.scrollWidth - window.innerWidth,
                    missing: expect.filter((cls) => !document.querySelector("." + cls)),
                    // 11px is the floor the tokens guarantee; anything
                    // below it means a selector was missed and the
                    // original 62.5% sizing is still in play.
                    tinyText: Array.from(document.querySelectorAll("#wrapcentre td, #wrapcentre p"))
                        .filter((node) => parseFloat(getComputedStyle(node).fontSize) < 11).length,

                    /* The frame, and everything that has to follow it.

                       A component with a max-width of its own looks
                       fine at 1440 and leaves a gutter at 1920, which
                       is exactly the bug the fixed column was. So the
                       frame is measured against the window, and each
                       full-width block is measured against the frame's
                       content box. */
                    frame: (() => {
                        const centre = document.querySelector("#wrapcentre");
                        if (!centre) return null;
                        const style = getComputedStyle(centre);
                        const inner = centre.getBoundingClientRect().width
                            - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
                        const narrow = [];
                        /* Direct children of the frame only. A block
                           deliberately sharing a row with something
                           else — the board links beside the masthead
                           on the index — is not failing to follow the
                           frame; the row around it is what has to. */
                        const blocks = "#wrapcentre > .rr-header, #wrapcentre > .rr-topicbar, "
                            + "#wrapcentre > .rr-toolbar, #wrapcentre > .rr-boardbar, "
                            + "#wrapcentre > .rr-releases, "
                            + "#wrapcentre > table.tablebg, #wrapcentre > table.forumline";
                        for (const node of document.querySelectorAll(blocks)) {
                            const box = node.getBoundingClientRect();
                            if (!box.width) continue;
                            if (inner - box.width > 4) {
                                narrow.push((node.className || node.tagName) + " " + Math.round(box.width));
                            }
                        }
                        return {
                            width: centre.getBoundingClientRect().width,
                            inner: inner,
                            window: window.innerWidth,
                            narrow: narrow.slice(0, 3),
                        };
                    })(),

                    // On a light theme, anything still painting itself
                    // near-black is the original stylesheet showing
                    // through a selector that was missed. This is how
                    // the tr.row1 leak was found.
                    darkPatches: document.documentElement.getAttribute("data-rr-theme") !== "paper" ? 0 :
                        Array.from(document.querySelectorAll("#wrapcentre *")).filter((node) => {
                            const bg = getComputedStyle(node).backgroundColor;
                            const rgb = bg.match(/\d+/g);
                            if (!rgb || rgb.length < 3) return false;
                            if (rgb[3] !== undefined && Number(rgb[3]) === 0) return false;   // transparent
                            const luma = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
                            return luma < 0.25 && node.getBoundingClientRect().height > 24;
                        }).length,
                };
            }, variant.label === "everything-off" ? [] : expect);

            const problems = [];
            if (!result.themed) problems.push("theme not applied");
            if (result.overflow > 1) problems.push("overflows by " + result.overflow + "px");
            if (result.missing.length) problems.push("missing: " + result.missing.join(", "));
            if (result.tinyText) problems.push(result.tinyText + " nodes under 11px");
            if (result.darkPatches) problems.push(result.darkPatches + " dark patches on a light theme");
            if (size.frame && result.frame) {
                const want = Math.min(FRAME.ceiling, FRAME.minShare * result.frame.window);
                if (result.frame.width < want - 1) {
                    problems.push("frame is " + Math.round(result.frame.width) + "px, wanted "
                        + Math.round(want) + " on a " + result.frame.window + "px window");
                }
                if (result.frame.width > FRAME.ceiling + 4) {
                    problems.push("frame grew to " + Math.round(result.frame.width) + "px, past the ceiling");
                }
                if (result.frame.narrow.length) {
                    problems.push("does not follow the frame: " + result.frame.narrow.join(", "));
                }
            }
            if (errors.length) problems.push(errors.length + " script errors: " + errors[0].slice(0, 120));

            const label = (size.label + "/" + variant.label + "/" + page.name).padEnd(38);
            if (problems.length) {
                failures += 1;
                console.log("FAIL " + label + problems.join("; "));
            } else {
                console.log("ok   " + label);
            }

            await tab.close();
        }
        await context.close();
    };

    const at = (label) => WIDTHS.find((size) => size.label === label);

    for (const size of WIDTHS) await run(size, VARIANTS[0]);
    for (const variant of VARIANTS.slice(1)) await run(at("desktop"), variant);
    for (const variant of VARIANTS.slice(1, 4)) await run(at("phone"), variant);

    await browser.close();
    console.log(failures ? "\n" + failures + " checks failed" : "\nall checks passed");
    process.exit(failures ? 1 : 0);
}

main();

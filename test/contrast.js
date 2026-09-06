#!/usr/bin/env node
/* ------------------------------------------------------------------
   Is any of this actually readable?

   Four themes and about forty colour tokens, all of them chosen by eye
   against a screenshot. That is the right way to choose them and the
   wrong way to check them: "muted grey on a dark surface" is a
   judgement, and 3.9:1 is a number.

   This walks every element on every test page that draws text, works
   out what colour that text really is against what colour is really
   behind it — compositing back up the tree through anything
   transparent — and reports every pair below the WCAG AA threshold for
   its size. Same rules the rest of the web is held to: 4.5:1 for body
   text, 3:1 for large text (18.66px, or 14px bold).

   It fails the run on anything the script itself paints. The board's
   own colours are reported and not failed: this redesign is allowed to
   improve them, but a page it has not touched is not its bug.

       node test/contrast.js
       node test/contrast.js --all      (list passes too)
   ------------------------------------------------------------------ */

const BASE = process.env.RR_BASE || "http://localhost:8731";

const PAGES = [
    { name: "index", url: "/forum/index.php" },
    { name: "viewforum", url: "/forum/viewforum.php?f=10" },
    { name: "topic", url: "/forum/topic/viewtopic.php?f=10&t=133316" },
    { name: "replies", url: "/forum/replies/viewtopic.php?f=14&t=75717&start=225" },
    { name: "hypervisor", url: "/forum/hypervisor/viewtopic.php?f=41&t=940000" },
    /* The reply form: the writing toolbar and the topic review, which
       are the only place this script paints on a form. */
    { name: "posting", url: "/forum/member/posting.php?mode=reply&f=10&t=133316" },
];

const THEMES = ["native", "slate", "carbon", "paper"];

/* Anything the script drew is ours to answer for. Everything else is
   the board's own markup, reported for information. */
const OURS = /^rr-/;

/** Runs in the page. */
function audit(ownPrefix) {
    const isOurs = new RegExp(ownPrefix);

    /* Chrome resolves `color-mix()` to `color(srgb r g b / a)`, where
       the channels are 0-1 rather than 0-255. Read as bytes those are
       all but black, which turns every tag, chip and outlined button
       in this interface — everything whose background is a mix — into
       a contrast failure that is not there. */
    const parse = (colour) => {
        const parts = (colour.match(/[\d.]+/g) || []).map(Number);
        if (parts.length < 3) return null;
        const scale = /^color\(/.test(colour) ? 255 : 1;
        return {
            r: parts[0] * scale,
            g: parts[1] * scale,
            b: parts[2] * scale,
            a: parts.length > 3 ? parts[3] : 1,
        };
    };

    const over = (top, bottom) => ({
        r: top.r * top.a + bottom.r * (1 - top.a),
        g: top.g * top.a + bottom.g * (1 - top.a),
        b: top.b * top.a + bottom.b * (1 - top.a),
        a: 1,
    });

    const luminance = ({ r, g, b }) => {
        const channel = (value) => {
            const v = value / 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };

    const ratio = (fg, bg) => {
        const a = luminance(fg);
        const b = luminance(bg);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    };

    /** What is really behind this element, compositing up the tree. */
    const backdrop = (node) => {
        let stack = { r: 255, g: 255, b: 255, a: 1 };
        const chain = [];
        for (let at = node; at && at !== document.documentElement.parentNode; at = at.parentElement) {
            chain.push(at);
        }
        chain.reverse();
        for (const at of chain) {
            const colour = parse(getComputedStyle(at).backgroundColor);
            if (colour && colour.a > 0) stack = over(colour, stack);
        }
        return stack;
    };

    /** Text this element draws itself, rather than through a child. */
    const ownText = (node) => {
        let text = "";
        for (const child of node.childNodes) {
            if (child.nodeType === 3) text += child.textContent;
        }
        return text.replace(/\s+/g, " ").trim();
    };

    /* Does this script's own stylesheet set a colour on this element? */
    const own = document.getElementById("rr-style");
    const colourRules = [];
    if (own && own.sheet) {
        const collect = (list) => {
            for (const rule of list) {
                if (rule.cssRules) { collect(Array.from(rule.cssRules)); continue; }
                if (!rule.selectorText || !rule.style || !rule.style.color) continue;
                colourRules.push(rule.selectorText);
            }
        };
        collect(Array.from(own.sheet.cssRules));
    }
    const paintsColour = (node) => colourRules.some((selector) => {
        for (const one of selector.split(",")) {
            try { if (node.matches(one.trim())) return true; } catch { /* :focus-visible etc. */ }
        }
        return false;
    });

    const findings = [];
    for (const node of document.querySelectorAll("body *")) {
        const text = ownText(node);
        if (text.length < 2) continue;

        const box = node.getBoundingClientRect();
        if (!box.width || !box.height) continue;

        const style = getComputedStyle(node);
        if (style.visibility === "hidden" || Number(style.opacity) < 0.1) continue;

        const fg = parse(style.color);
        if (!fg) continue;
        const bg = backdrop(node);
        const seen = fg.a < 1 ? over(fg, bg) : fg;

        const size = parseFloat(style.fontSize);
        const weight = Number(style.fontWeight) || 400;
        const large = size >= 18.66 || (size >= 14 && weight >= 700);
        const need = large ? 3 : 4.5;
        const got = ratio(seen, bg);

        /* Whose colour is this?
         *
         * Not "does it have an rr- class": an unclassed <span> inside
         * the palette trigger is this script's text, and a username
         * inside a post header is the *board's* — phpBB paints those
         * from the group colour, inline, per user.
         *
         * So the question is which sheet the winning declaration came
         * from. An inline style is the board's data. Otherwise it is
         * this script's if any rule in its own stylesheet sets a
         * colour on this element, because that sheet is last and its
         * selectors carry html[data-rr]. */
        const classes = (node.className || "").toString().split(/\s+/).filter(Boolean);
        const mine = !node.style.color && paintsColour(node);

        findings.push({
            pass: got >= need,
            got: Math.round(got * 100) / 100,
            need,
            mine,
            where: node.tagName.toLowerCase() + (classes.length ? "." + classes.slice(0, 2).join(".") : ""),
            fg: style.color,
            size: Math.round(size * 10) / 10,
            sample: text.slice(0, 28),
        });
    }
    return findings;
}

async function main() {
    let chromium;
    try { ({ chromium } = require("playwright-core")); }
    catch { console.error("run: npm i -D playwright-core"); process.exit(2); }

    const showAll = process.argv.includes("--all");
    const browser = await chromium.launch(
        process.env.RR_CHROME ? { executablePath: process.env.RR_CHROME } : {});

    const ours = new Map();
    const theirs = new Map();
    let checked = 0;

    for (const theme of THEMES) {
        const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        await context.addInitScript((value) => {
            try { localStorage.setItem("rr:settings", value); } catch { /* private mode */ }
        }, JSON.stringify({ theme }));

        for (const page of PAGES) {
            const tab = await context.newPage();
            await tab.goto(BASE + page.url, { waitUntil: "domcontentloaded" });
            await tab.waitForTimeout(400);
            await tab.evaluate(() => Promise.all(
                document.getAnimations().map((run) => run.finished.catch(() => {}))));

            const findings = await tab.evaluate(audit, OURS.source);
            checked += findings.length;
            for (const finding of findings) {
                if (finding.pass && !showAll) continue;
                const bucket = finding.mine ? ours : theirs;
                const key = theme + "  " + finding.where + "  " + finding.size + "px";
                const worst = bucket.get(key);
                if (!worst || finding.got < worst.got) {
                    bucket.set(key, Object.assign({ page: page.name, theme }, finding));
                }
            }
            await tab.close();
        }
        await context.close();
    }

    const report = (title, bucket) => {
        console.log("\n" + title + " — " + bucket.size + (bucket.size === 1 ? " pair" : " pairs"));
        const rows = Array.from(bucket.entries()).sort((a, b) => a[1].got - b[1].got);
        for (const [key, finding] of rows) {
            console.log("  " + String(finding.got).padStart(5) + " : 1"
                + "  (needs " + finding.need + ")  "
                + key.padEnd(52) + "  " + JSON.stringify(finding.sample));
        }
    };

    console.log(checked + " text elements measured across "
        + THEMES.length + " themes and " + PAGES.length + " pages");
    report("This script's own colours", ours);
    report("The board's own colours, for information", theirs);

    await browser.close();
    if (ours.size) {
        console.log("\n" + ours.size + " of this script's colour pairs are below AA");
        process.exit(1);
    }
    console.log("\nevery colour this script paints meets AA");
}

main();

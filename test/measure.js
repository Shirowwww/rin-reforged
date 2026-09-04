#!/usr/bin/env node
/* Geometry probe: numbers for the before/after spacing report. */
const BASE = process.env.RR_BASE || "http://localhost:8731";
const { chromium } = require("playwright-core");

const PROBES = [
  {
    name: "viewforum",
    url: "/forum/viewforum.php?f=10",
    run: () => {
      const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? +(s[Math.floor(s.length / 2)]).toFixed(1) : 0; };
      const rows = Array.from(document.querySelectorAll("table[data-rr-list] tr"))
        .filter((r) => r.querySelector("a.topictitle"));
      const rowH = rows.map((r) => r.getBoundingClientRect().height);
      const lastCells = Array.from(document.querySelectorAll('td[data-rr-col="last"]'))
        .filter((td) => td.textContent.trim());
      const meta = lastCells.map((td) => {
        const p = td.querySelector("p");
        return p ? parseFloat(getComputedStyle(p).lineHeight) : 0;
      });
      const bar = document.querySelector(".rr-topicbar");
      const tool = document.querySelector(".rr-toolbar");
      const cs = bar && getComputedStyle(bar);
      const ts = tool && getComputedStyle(tool);
      // pagination strips the template leaves in the page
      const pag = Array.from(document.querySelectorAll("#wrapcentre td, #wrapcentre p, #wrapcentre span"))
        .filter((n) => /Go to page/.test(n.textContent) && n.children.length < 30)
        .map((n) => ({ tag: n.tagName + "." + n.className, h: +n.getBoundingClientRect().height.toFixed(1) }));
      const strips = Array.from(document.querySelectorAll("#wrapcentre table"))
        .filter((t) => /Go to page/.test(t.textContent) && !t.querySelector("a.topictitle"))
        .map((t) => +t.getBoundingClientRect().height.toFixed(1));
      return {
        rows: rows.length,
        rowHeightMedian: med(rowH),
        rowHeightMin: +Math.min(...rowH).toFixed(1),
        lastPostLineHeight: med(meta),
        topicbarPad: cs && cs.padding,
        topicbarH: bar ? +bar.getBoundingClientRect().height.toFixed(1) : null,
        toolbarPad: ts && ts.padding,
        toolbarMargin: ts && ts.margin,
        paginationNodes: pag,
        paginationStripHeights: strips,
        firstRowTop: rows.length ? +rows[0].getBoundingClientRect().top.toFixed(1) : null,
        docHeight: document.documentElement.scrollHeight,
      };
    },
  },
  {
    name: "topic",
    url: "/forum/topic/viewtopic.php?f=10&t=133316",
    run: () => {
      const bar = document.querySelector(".rr-topicbar");
      const finder = document.querySelector(".rr-releases");
      const game = document.querySelector(".rr-game");
      const heads = Array.from(document.querySelectorAll(".rr-posthead"));
      const csv = (n) => n ? { h: +n.getBoundingClientRect().height.toFixed(1), pad: getComputedStyle(n).padding, margin: getComputedStyle(n).margin } : null;
      const quotes = Array.from(document.querySelectorAll(".quotecontent"))
        .map((q) => +q.getBoundingClientRect().height.toFixed(1));
      return {
        topicbar: csv(bar),
        finder: csv(finder),
        gameCard: csv(game),
        postheadH: heads.length ? +heads[0].getBoundingClientRect().height.toFixed(1) : null,
        postheadMetaLH: heads.length ? getComputedStyle(heads[0].querySelector(".rr-posthead__meta") || heads[0]).lineHeight : null,
        quotes: quotes.length,
        quoteHeights: quotes.slice(0, 6),
        docHeight: document.documentElement.scrollHeight,
      };
    },
  },
  {
    name: "replies",
    url: "/forum/replies/viewtopic.php?f=14&t=75717&start=225",
    run: () => {
      const tables = Array.from(document.querySelectorAll("table.tablebg"))
        .filter((t) => t.querySelector("div.postbody"));
      const hs = tables.map((t) => +t.getBoundingClientRect().height.toFixed(1));
      const s = hs.slice().sort((a, b) => a - b);
      const short = tables.filter((t) => t.querySelector("div.postbody").textContent.trim().length < 80).length;
      return {
        posts: tables.length,
        postHeightMedian: s.length ? s[Math.floor(s.length / 2)] : 0,
        postHeightMin: s[0], postHeightMax: s[s.length - 1],
        shortPosts: short,
        quotes: document.querySelectorAll(".quotecontent").length,
        docHeight: document.documentElement.scrollHeight,
      };
    },
  },
  {
    name: "index",
    url: "/forum/index.php",
    run: () => {
      const rows = Array.from(document.querySelectorAll("tr")).filter((r) => r.querySelector("a.forumlink"));
      const hs = rows.map((r) => r.getBoundingClientRect().height);
      const s = hs.slice().sort((a, b) => a - b);
      const bb = document.querySelector(".rr-boardbar");
      return {
        forums: rows.length,
        forumRowMedian: s.length ? +s[Math.floor(s.length / 2)].toFixed(1) : 0,
        boardbarH: bb ? +bb.getBoundingClientRect().height.toFixed(1) : null,
        boardbarPad: bb ? getComputedStyle(bb).padding : null,
        docHeight: document.documentElement.scrollHeight,
      };
    },
  },
];

(async () => {
  const browser = await chromium.launch(process.env.RR_CHROME ? { executablePath: process.env.RR_CHROME } : {});
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const out = {};
  for (const p of PROBES) {
    const tab = await ctx.newPage();
    await tab.goto(BASE + p.url, { waitUntil: "domcontentloaded" });
    await tab.waitForTimeout(400);
    out[p.name] = await tab.evaluate(p.run);
    await tab.close();
  }
  await browser.close();
  console.log(JSON.stringify(out, null, 2));
})();

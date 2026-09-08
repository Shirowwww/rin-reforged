// ==UserScript==
// @name            RIN Reforged
// @name:fr         RIN Reforged
// @namespace       https://github.com/Shirowwww/rin-reforged
// @version         0.13.3
// @description     A full redesign of CS.RIN.RU: modern themes, real mobile support, game info cards, command palette, keyboard navigation and a settings panel.
// @description:fr  Refonte complete de CS.RIN.RU : themes modernes, support mobile, fiches de jeu, palette de commandes, navigation clavier et panneau de reglages.
// @author          Shirowwww
// @license         Unlicense
// @homepageURL     https://github.com/Shirowwww/rin-reforged
// @supportURL      https://github.com/Shirowwww/rin-reforged/issues
// @downloadURL     https://raw.githubusercontent.com/Shirowwww/rin-reforged/main/dist/rin-reforged.user.js
// @updateURL       https://raw.githubusercontent.com/Shirowwww/rin-reforged/main/dist/rin-reforged.user.js
// @icon            https://cs.rin.ru/forum/favicon.ico
// @match           *://cs.rin.ru/forum/*
// @match           *://csrinrutkb3tshptdctl5lyei4et35itl22qvk5ktdcat6aeavy6nhid.onion/forum/*
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_deleteValue
// @grant           GM_addStyle
// @grant           GM_registerMenuCommand
// @grant           GM_openInTab
// @grant           GM_xmlhttpRequest
// @connect         store.steampowered.com
// @run-at          document-start
// @noframes
// ==/UserScript==


/* Built from src/ by build.js. Edit the sources, not this file. */

(function () {
"use strict";

const RR_CSS = `/* == tokens.css == */
/* Every colour the redesign uses is declared here, once, on :root; themes
   are attribute switches on <html>. Nothing below writes a raw hex value. */

html[data-rr] {
    /* Slate & Brass, the default: blue-leaning rather than pure black,
       which halates behind light text on OLED over hours of reading. */
    --rr-bg:            #0e1013;
    --rr-bg-sunken:     #08090b;
    --rr-surface:       #15181d;
    --rr-surface-2:     #1c2026;
    --rr-surface-3:     #252a31;
    /* Pitched to stay visible against --rr-surface, not to disappear —
       a hairline too faint reads as one undifferentiated block. */
    --rr-line:          #2f353e;
    --rr-line-strong:   #454e5a;

    --rr-text:          #dfe4ea;
    --rr-text-strong:   #f2f5f8;
    --rr-muted:         #8b95a3;
    /* Quiet has a floor: smallest lift that clears 4.6 against
       --rr-surface/-2 and --rr-bg-sunken; test/contrast.js enforces it. */
    --rr-faint:         #7f8997;

    /* One accent, spent on actions and active state only. */
    --rr-accent:        #e0a338;
    --rr-accent-soft:   #4a3a1c;
    --rr-accent-text:   #0e1013;
    --rr-link:          #7fb4de;
    --rr-link-visited:  #9d93cf;

    /* Maps to the forum's own topic prefixes — colour carries information. */
    --rr-tag-info:      #6ea8d8;
    --rr-tag-release:   #6bbd85;
    --rr-tag-problem:   #d97a6c;
    --rr-tag-important: #e0a338;
    --rr-tag-tutorial:  #a795d8;
    --rr-tag-request:   #d8a0c4;
    --rr-tag-scs:       #63b8b0;
    --rr-tag-neutral:   #8b95a3;

    --rr-ok:            #6bbd85;
    --rr-warn:          #e0a338;
    --rr-danger:        #d9635a;

    --rr-selection:     #2f4a63;

    /* Type */
    --rr-font: "Inter", "Inter var", ui-sans-serif, "Segoe UI Variable Text",
               "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
    --rr-font-mono: ui-monospace, "Cascadia Code", "JetBrains Mono", "SF Mono",
               Menlo, Consolas, "DejaVu Sans Mono", monospace;

    --rr-fs:            15px;   /* overridden by the font-size setting */
    /* Floored so the -2/-3 steps don't drop below 10/9px at the smallest
       setting. */
    --rr-fs-sm:         max(12px, calc(var(--rr-fs) - 2px));
    --rr-fs-xs:         max(11px, calc(var(--rr-fs) - 3px));
    --rr-fs-lg:         calc(var(--rr-fs) + 3px);
    --rr-lh:            1.7;
    /* Supporting detail (author line, last-post line, pagination). 1.4 read
       as a stacked block at 13px. */
    --rr-lh-meta:       1.55;
    /* The title itself: 1.35 is tight on this board's frequent 2-line
       titles. */
    --rr-lh-title:      1.45;
    --rr-measure:       78ch;

    /* Space - a 4px base, so densities stay on the same rhythm. */
    --rr-s1: 4px;
    --rr-s2: 8px;
    --rr-s3: 12px;
    --rr-s4: 16px;
    --rr-s5: 24px;
    --rr-s6: 32px;

    /* So anything sitting on the top bar's edge doesn't duplicate its height. */
    --rr-nav-h: 48px;

    /* Tighter than the original 12px, which made every card read as a
       template down a page of cards. */
    --rr-radius:      6px;
    --rr-radius-lg:   9px;
    --rr-radius-pill: 999px;

    /* Only genuinely floating things get a shadow; surfaces separate by
       value and a hairline instead. */
    --rr-shadow-pop: 0 8px 24px -6px rgba(0, 0, 0, .55), 0 2px 6px rgba(0, 0, 0, .35);

    /* Tightened past 6px made a listing a wall; 9px is where a row has a
       top and bottom again (a topic row now fits ~60px vs the board's
       34px, a deliberate trade). Compact keeps the old number. */
    --rr-row-pad:     9px;
    --rr-post-gap:    var(--rr-s5);

    /* Fluid with a ceiling — a fixed column suits prose, not a frame that
       also holds a 6-column listing. Separate from --rr-measure (prose
       line length) so widening one doesn't lengthen the other. */
    --rr-content-max: min(1560px, 95vw);

    /* 8px against a 10px radius read as content pressed into the corner. */
    --rr-card-pad:    14px;

    --rr-speed: 140ms;
}

/* The board's own palette (near-black #070707, grey text, red links/tags —
   most of what makes a screenshot recognisable) on the redesign's layout
   and spacing. Red pulled slightly off pure #FF0000, which vibrates
   against black, but no further. Default theme; Slate/Carbon stay quieter. */
html[data-rr][data-rr-theme="native"] {
    /* Off the board's #070707 for the same anti-halation reason as Slate —
       identity is in the neutral cast, grey text and red, not the last 3%
       of black. bg/surface spread further apart than a flat ladder would
       give, so cards lift off the ground instead of the hairline alone
       marking where one ends. */
    --rr-bg:            #0b0b0b;
    --rr-bg-sunken:     #060606;
    --rr-surface:       #171717;
    --rr-surface-2:     #1e1e1e;
    --rr-surface-3:     #2c2c2c;
    --rr-line:          #333333;
    --rr-line-strong:   #4d4d4d;

    --rr-text:          #cccccc;
    --rr-text-strong:   #ffffff;
    --rr-muted:         #aaaaaa;
    --rr-faint:         #878787;

    /* At the board's own saturation, \`a:link { color: red }\` reads as a
       page shouting; same hue, conversational volume. */
    --rr-link:          #d1786b;
    --rr-link-visited:  #a8807c;

    /* [Important] is red on the real board and amber here — the single
       most visible place the redesign departs from it. */
    --rr-tag-important: #cf6152;
    --rr-tag-problem:   #cf6152;
    --rr-tag-release:   #4faa60;
    --rr-tag-info:      #4088b3;
    --rr-tag-neutral:   #999999;

    --rr-ok:            #4faa60;
    --rr-danger:        #cf6152;

    --rr-selection:     #45211c;
}

/* Carbon - neutral grey for anyone who finds the blue cast distracting. */
html[data-rr][data-rr-theme="carbon"] {
    --rr-bg:          #131313;
    --rr-bg-sunken:   #0c0c0c;
    --rr-surface:     #1a1a1a;
    --rr-surface-2:   #222222;
    --rr-surface-3:   #2b2b2b;
    --rr-line:        #383838;
    --rr-line-strong: #525252;
    --rr-text:        #e2e2e2;
    --rr-text-strong: #f6f6f6;
    --rr-muted:       #949494;
    --rr-faint:       #8a8a8a;
    --rr-selection:   #3d3d3d;
    /* "No blue cast" includes links, which stayed Slate's blue; tags keep
       their hues (Info is blue on every theme, which is what reads as Info). */
    --rr-link:          #d6b98a;
    --rr-link-visited:  #b3a48c;
}

/* Paper - a real light theme, warm enough not to glare at night. */
html[data-rr][data-rr-theme="paper"] {
    --rr-bg:            #f4f5f7;
    --rr-bg-sunken:     #e8eaee;
    --rr-surface:       #ffffff;
    --rr-surface-2:     #f4f5f7;
    --rr-surface-3:     #e9ebef;
    --rr-line:          #d2d6de;
    --rr-line-strong:   #b0b7c2;
    --rr-text:          #22262c;
    --rr-text-strong:   #0d1014;
    --rr-muted:         #5d646e;
    --rr-faint:         #626972;
    --rr-accent:        #a5701a;
    --rr-accent-soft:   #f5e6c8;
    /* The board's inline #FFCC00 is 10:1 on dark themes (left alone) but
       1.4:1 here — same hue, dark enough to read on --rr-surface-2. */
    --rr-notice-ink:    #6b5000;
    --rr-accent-text:   #ffffff;
    --rr-link:          #1f5f96;
    --rr-link-visited:  #6b4d9e;
    --rr-tag-info:      #1f6294;
    --rr-tag-release:   #24734a;
    --rr-tag-problem:   #a83c2c;
    --rr-tag-important: #96660f;
    --rr-tag-tutorial:  #6a4fa3;
    --rr-tag-request:   #9c4f80;
    --rr-tag-scs:       #14706a;
    --rr-tag-neutral:   #5d646e;
    --rr-ok:            #24734a;
    --rr-warn:          #96660f;
    --rr-danger:        #a83c2c;
    --rr-selection:     #cfe0f0;
    --rr-shadow-pop: 0 8px 24px -8px rgba(20, 26, 34, .22), 0 2px 6px rgba(20, 26, 34, .10);
}

/* Compact keeps the old forum's information-per-screen; Roomy is for long
   reading sessions. */
html[data-rr][data-rr-density="compact"] {
    --rr-lh: 1.5;
    --rr-lh-meta: 1.4;
    --rr-lh-title: 1.35;
    --rr-card-pad: 7px;
    --rr-row-pad: 3px;
    --rr-post-gap: var(--rr-s2);
    --rr-s5: 16px;
    --rr-s6: 22px;
}
html[data-rr][data-rr-density="roomy"] {
    --rr-lh: 1.8;
    --rr-lh-meta: 1.65;
    --rr-lh-title: 1.5;
    --rr-card-pad: 18px;
    --rr-row-pad: 14px;
    --rr-post-gap: var(--rr-s6);
}

/* Wide keeps the same slope and lifts the ceiling; Full drops both. */
html[data-rr][data-rr-width="wide"]  { --rr-content-max: min(1980px, 97vw); --rr-measure: 92ch; }
/* A listing wants the whole window, but a post is still prose — 120ch
   avoids the 300-char lines \`none\` gave a 2560px screen. */
html[data-rr][data-rr-width="full"]  { --rr-content-max: none;              --rr-measure: 120ch; }

/* On a topic page the frame closes in on the text (1560px left a
   two-fifths dead strip beside a post on a wide monitor); 1440 is the
   narrowest the board bar's two link groups still share a line. A listing
   keeps the full frame since it has columns to fill it. */
html[data-rr][data-rr-width="reading"][data-rr-page="topic"] { --rr-content-max: min(1440px, 95vw); }

html[data-rr][data-rr-nav="off"] { --rr-nav-h: 0px; }

@media (prefers-reduced-motion: reduce) {
    html[data-rr] { --rr-speed: 0ms; }
}
/* Same, asked for explicitly rather than read off the system. */
html[data-rr][data-rr-still] { --rr-speed: 0ms; scroll-behavior: auto; }
html[data-rr][data-rr-still] *,
html[data-rr][data-rr-still] *::before,
html[data-rr][data-rr-still] *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
}

/* Reserved either way, so a scrollbar-less page doesn't shift centred
   content 15px against the next one. Desktop only — the narrow layout is
   fluid and centres nothing. */
@media (min-width: 861px) {
    html[data-rr] { scrollbar-gutter: stable; }
}

/* == forum.css == */
/* Reskin of the phpBB (subsilver2 / rinDark) markup. The board is nested
   layout tables with inline widths/colours, so a few rules need
   !important to win; everything else relies on the html[data-rr] prefix
   for specificity. */

html[data-rr] body,
html[data-rr] body.ltr {
    background: var(--rr-bg);
    color: var(--rr-text);
    font-family: var(--rr-font);
    font-size: var(--rr-fs);
    line-height: var(--rr-lh);
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    overflow-wrap: break-word;
}

html[data-rr] ::selection { background: var(--rr-selection); color: var(--rr-text-strong); }

/* Body stays hidden until main.js sets data-rr-ready (or a 4s watchdog
   fires), so the board's own colours never flash first; the root paints
   the theme's background so there's nothing else to paint the window
   dark. \`opacity\`, not \`visibility\` — visibility is inherited and
   recalculates every descendant on lift; measured 44ms difference on a
   listing. */
html[data-rr] { background: var(--rr-bg); }
html[data-rr]:not([data-rr-ready]) body,
html[data-rr]:not([data-rr-ready]) body.ltr { opacity: 0; }

/* phpBB sets 62.5% on <body> and sizes descendants in em; reset here so
   one font-size setting drives them all. */
html[data-rr] .gen,
html[data-rr] .genmed,
html[data-rr] .gensmall,
html[data-rr] .postbody,
html[data-rr] .postdetails,
html[data-rr] .nav,
html[data-rr] .topicdetails,
html[data-rr] .topicauthor,
html[data-rr] .forumdesc,
html[data-rr] .breadcrumbs,
html[data-rr] .copyright,
html[data-rr] th,
html[data-rr] td,
html[data-rr] p,
html[data-rr] li,
html[data-rr] input,
html[data-rr] select,
html[data-rr] textarea {
    font-family: var(--rr-font);
    font-size: var(--rr-fs);
    line-height: var(--rr-lh);
    color: var(--rr-text);
}

html[data-rr] .gensmall,
html[data-rr] .forumdesc,
html[data-rr] .topicdetails,
html[data-rr] .copyright { font-size: var(--rr-fs-sm); color: var(--rr-muted); }

html[data-rr] a { color: var(--rr-link); text-decoration: none; }
html[data-rr] a:hover { color: var(--rr-text-strong); text-decoration: underline; text-underline-offset: 2px; }
html[data-rr] a:focus-visible,
html[data-rr] button:focus-visible,
html[data-rr] input:focus-visible,
html[data-rr] select:focus-visible,
html[data-rr] textarea:focus-visible,
html[data-rr] [tabindex]:focus-visible {
    outline: 2px solid var(--rr-accent);
    outline-offset: 2px;
    border-radius: 3px;
}

/* ---- Page frame --------------------------------------------------- */

/* The whole page is one layout table; left as a table it computes a
   minimum width from its widest cell, which is why the board scrolled
   sideways on a phone. Turning the wrapper into blocks removes that
   floor. */
html[data-rr] table.bodyline,
html[data-rr] table.bodyline > tbody,
html[data-rr] table.bodyline > tbody > tr,
html[data-rr] table.bodyline > tbody > tr > td {
    display: block;
    width: auto;
    max-width: none;
    background: transparent;
    border: 0;
    padding: 0;
}

html[data-rr] #wrapcentre,
html[data-rr] #wrapfooter {
    max-width: var(--rr-content-max);
    margin: 0 auto;
    padding: 0 var(--rr-s5);
    box-sizing: border-box;
}
html[data-rr] #wrapcentre { padding-top: var(--rr-s5); padding-bottom: var(--rr-s6); }

/* subsilver2 spaces blocks with bare <br>, and every block here already
   carries its own margin — a second gap on top of the first. These are
   the stray ones between the header and content and between two tables
   (dropStrayBreaks in main.js handles the ones beside the script's own
   bars). */
html[data-rr] #wrapcentre > br,
html[data-rr] #pagecontent > br { display: none; }

/* The 340px masthead is replaced by rr-nav; the node stays in the DOM
   (other userscripts read it) but leaves the flow. Keyed on whether
   anything replaced it, not on the bar alone: with the bar off but board
   links on, uncovering the original stacked two headers. */
html[data-rr][data-rr-header="rr"] #wrapheader { display: none; }

/* ---- Tables --------------------------------------------------------- */

/* Gap between posts/blocks. The token existed from the start but was
   never applied — the only separation was whatever <br> the template
   happened to leave, which is why a thread read as one slab. */
html[data-rr] table.tablebg,
html[data-rr] table.forumline {
    margin-bottom: var(--rr-post-gap);
    background: var(--rr-line);
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius-lg);
    border-spacing: 0 !important;
    border-collapse: separate;
    overflow: hidden;
    width: 100%;
}
/* \`clip\` doesn't make the table a scroll container the way \`hidden\`
   does, and a sticky heading inside a scroll container that never
   scrolls can't stick. */
html[data-rr] table.tablebg[data-rr-list] { overflow: clip; }

/* A post's table clips nothing: with overflow hidden, its hover
   tooltips (drawn above the control, inside the header strip at the top
   of the table) were cut to a sliver — reported as "tooltips go behind
   the post". The table paints the surface and cells go transparent, so
   corners stay rounded without the clip. */
html[data-rr] table.tablebg[data-rr-post] {
    overflow: visible;
    background: var(--rr-surface);
    /* The post's inside edge, named once so the author band (ui.css,
       .rr-posthead) can pull itself back out to it. */
    --rr-post-pad: 18px;
    --rr-post-pad-top: 12px;
}
html[data-rr] table.tablebg[data-rr-post] > tbody > tr,
html[data-rr] table.tablebg[data-rr-post] > tbody > tr > td.row1,
html[data-rr] table.tablebg[data-rr-post] > tbody > tr > td.row2 { background: transparent; }
/* A post gets more inset than a listing row (a post is read, a row is
   scanned) — not a folded reply, which owns its own padding
   (features.css). \`tr.row1 > td\` as well as \`td.row1\`: the board writes
   the class on the row and leaves cells bare, so the cell-only branch
   never matched here. */
html[data-rr] table.tablebg[data-rr-post]:not([data-rr-quiet]) > tbody > tr > td.row1,
html[data-rr] table.tablebg[data-rr-post]:not([data-rr-quiet]) > tbody > tr > td.row2,
html[data-rr] table.tablebg[data-rr-post]:not([data-rr-quiet]) > tbody > tr.row1 > td,
html[data-rr] table.tablebg[data-rr-post]:not([data-rr-quiet]) > tbody > tr.row2 > td {
    padding: var(--rr-post-pad-top) var(--rr-post-pad) 14px;
}
/* subsilver2 wraps the message in one more table (cellspacing="5") and
   the original sheet pads every cell — 7px of chrome between the band's
   cell and the post's own inset. Flattened so --rr-post-pad is the only
   inset. Direct children only: a quote/code block is a table too,
   deeper in. */
html[data-rr] table.tablebg[data-rr-post] > tbody > tr > td > table { border-spacing: 0; }
html[data-rr] table.tablebg[data-rr-post] > tbody > tr > td > table > tbody > tr > td { padding: 0; }

/* The board's \`th a, th a:visited { color: #CCCCCC !important }\` loads
   after this sheet, so only the same flag reaches it — without it the
   member list's sortable headers were pale grey on paler grey. */
html[data-rr] th a,
html[data-rr] th a:visited { color: inherit !important; }
html[data-rr] th a:hover { color: var(--rr-text-strong) !important; text-decoration: none; }
/* Column headings: a darker strip than the rows, so it's never taken for
   one of the lighter, bolder section-heading bands below it. */
html[data-rr] th {
    background: var(--rr-bg-sunken);
    color: var(--rr-muted);
    font-size: var(--rr-fs-xs);
    font-weight: 600;
    letter-spacing: .02em;
    text-align: left;
    padding: var(--rr-s2) var(--rr-s3);
    border: 0;
    border-bottom: 1px solid var(--rr-line);
    background-image: none;
    height: auto;
    white-space: nowrap;
}

/* Category bars, toned down from the original. The accent mark is a
   short rounded bar drawn inside the cell rather than a stripe down its
   edge — a stripe ran into the table's rounded corner and came out cut
   at an angle. */
html[data-rr] td.cat,
html[data-rr] td.catHead,
html[data-rr] td.catBottom,
html[data-rr] th.thHead {
    position: relative;
    background: color-mix(in srgb, var(--rr-accent) 5%, var(--rr-surface-2));
    color: var(--rr-text-strong);
    font-weight: 650;
    font-size: var(--rr-fs-sm);
    padding: var(--rr-s2) var(--rr-s3) var(--rr-s2) 20px;
    border: 0;
    border-bottom: 1px solid var(--rr-line);
    /* The board pins these at height:25px, fine for a heading but the
       same class also carries the "Display posts / Sort by / Go" strip,
       which wraps to two lines on a phone and spilled out of the box. */
    height: auto;
}
html[data-rr] td.cat:not([data-rr-cat])::before,
html[data-rr] td.catHead::before,
html[data-rr] th.thHead::before {
    content: "";
    position: absolute;
    left: 9px;
    top: 50%;
    width: 3px;
    height: 14px;
    margin-top: -7px;
    border-radius: 2px;
    background: var(--rr-accent);
}
html[data-rr] td.cat h4,
html[data-rr] td.cat a { color: var(--rr-text-strong); margin: 0; font-size: var(--rr-fs-sm); }

/* Tinting the whole row (not just the one non-empty cell) stops the bar
   reading as one that runs out halfway. A stronger hairline than a
   listing row: two collapsed category headings stack with nothing
   between them, and at --rr-line (a hair off the tint) they read as one
   slab with two titles. */
html[data-rr] tr[data-rr-cat-row] > td {
    background: color-mix(in srgb, var(--rr-accent) 5%, var(--rr-surface-2));
    border-bottom: 1px solid var(--rr-line-strong);
}
/* Strips that aren't section heads — "Mark forums read" alone, the sort
   controls — stay plain. */
html[data-rr] tr[data-rr-cat-row="plain"] > td,
html[data-rr] tr[data-rr-cat-row="controls"] > td { background: var(--rr-surface-2); }

/* The collapse control (boardindex.js, tidyCategoryToggles): the board's
   <input> is hidden and clicked from here; the cell it used to occupy
   stays empty to keep columns aligned. */
html[data-rr] td.catdiv { text-align: right; }
html[data-rr] td.cat.rr-catfold-cell { cursor: pointer; user-select: none; }
html[data-rr] tr[data-rr-cat-row] > td.cat.rr-catfold-cell:hover {
    background: color-mix(in srgb, var(--rr-accent) 10%, var(--rr-surface-2));
}
html[data-rr] td.cat.rr-catfold-cell > h4 { display: inline; vertical-align: middle; }
html[data-rr] button.rr-catfold {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    margin-right: 4px;
    padding: 0;
    vertical-align: middle;
    background: none;
    border: 0;
    border-radius: var(--rr-radius);
    color: var(--rr-faint);
    cursor: pointer;
    transition: background var(--rr-speed) ease, color var(--rr-speed) ease, transform var(--rr-speed) ease;
}
html[data-rr] button.rr-catfold > svg { width: 13px; height: 13px; }
html[data-rr] button.rr-catfold:hover { background: var(--rr-surface-3); color: var(--rr-text-strong); }
html[data-rr] tr[data-rr-folded] > td.cat > button.rr-catfold { transform: rotate(-90deg); }

/* Named by lists.js (markShapes): "controls" for a cell holding a table,
   select or submit; "plain" for a lone "Mark forums read". Neither is a
   heading, so no accent wash — that marks a block of content. */
html[data-rr] td.cat[data-rr-cat] {
    background: var(--rr-surface-2);
    padding-left: var(--rr-s3);
    font-weight: 400;
}
html[data-rr] td.cat[data-rr-cat="controls"] a { color: var(--rr-muted); font-weight: 500; }
html[data-rr] td.cat[data-rr-cat="controls"] a:hover { color: var(--rr-text-strong); }

/* The template puts these classes on <tr> as well as <td>, and the
   original sheet only colours both together — a row left uncovered
   keeps its near-black background, invisible on dark, glaring on light. */
html[data-rr] tr.row1,
html[data-rr] tr.row2,
html[data-rr] tr.row3,
html[data-rr] tr.row4,
html[data-rr] tr.row5 { background: var(--rr-surface); }
html[data-rr] tr.row4,
html[data-rr] tr.row5 { background: var(--rr-surface-2); }

html[data-rr] td.row1,
html[data-rr] td.row2,
html[data-rr] td.row3,
html[data-rr] td.row4,
html[data-rr] td.row5 {
    background: var(--rr-surface);
    border: 0;
    border-bottom: 1px solid var(--rr-line);
    padding: var(--rr-row-pad) var(--rr-s3);
    vertical-align: middle;
    transition: background var(--rr-speed) ease;
}
html[data-rr] td.row4,
html[data-rr] td.row5 { background: var(--rr-surface-2); }

/* Alternating rows. The board's own row1/row2 alternates per column, not
   per row, so it can't stripe a whole title-to-last-post line; the shade
   is instead read off an attribute lists.js writes on the row
   (restripe), covering every cell including the marker gutter. Listings
   only — in a topic the same classes wrap whole posts. */
/* Only while the table is still a grid: on a phone a row is a card and
   the shade belongs to the card, not a per-cell stripe. */
@media (min-width: 861px) {
    html[data-rr] table[data-rr-list] > tbody > tr[data-rr-stripe] > td { background: var(--rr-surface); }
    html[data-rr] table[data-rr-list] > tbody > tr[data-rr-stripe="b"] > td { background: var(--rr-surface-2); }
    html[data-rr] table[data-rr-list] > tbody > tr[data-rr-stripe]:hover > td { background: var(--rr-surface-3); }
}
/* Below that width, or on a listing shape this script couldn't read, the
   board's own banding is what's left. */
html[data-rr] table[data-rr-list] td.row2 { background: var(--rr-surface-2); }
/* On the member list the post count sat flush against the rank's left
   edge ("147 Advanced forumer" read as one string); a gutter, kept in
   the header too so they stay aligned. */
html[data-rr] table[data-rr-list] th[data-rr-col="posts"],
html[data-rr] table[data-rr-list] td[data-rr-col="posts"] { padding-right: 28px; }

/* The member list stripes rows rather than cells: <tr class="row2"> over
   plain td.gen. Same shade, read off the row. */
html[data-rr] table[data-rr-list] > tbody > tr.row2 > td { background: var(--rr-surface-2); }
html[data-rr] table[data-rr-list] > tbody > tr.row1:hover > td,
html[data-rr] table[data-rr-list] > tbody > tr.row2:hover > td { background: var(--rr-surface-3); }

/* Whole-row hover, which the markup can't express itself. Listings only:
   the same classes also wrap the Who-is-online block, the login form and
   profile cells, where a hover-lit block promised a click that led
   nowhere. */
html[data-rr] table[data-rr-list] tr:hover > td.row1,
html[data-rr] table[data-rr-list] tr:hover > td.row2 { background: var(--rr-surface-3); }
/* Whole-row click too (lists.js): the title cell's empty three-quarters
   opens the topic, so the hover isn't a promise the row breaks. */
html[data-rr] table[data-rr-list][data-rr-rowclick] td[data-rr-col="title"] { cursor: pointer; }
html[data-rr] table[data-rr-list][data-rr-rowclick] td[data-rr-col="title"] a,
html[data-rr] table[data-rr-list][data-rr-rowclick] td[data-rr-col="title"] button { cursor: pointer; }
/* The words beside a lone checkbox toggle it too (lists.js). */
html[data-rr] td[data-rr-check-label] { cursor: pointer; }

/* \`tr:last-child\` alone underlined every last row of every <tbody>, and
   the index opens a separate tbody per category — so a category heading,
   being last row of the tbody above it, lost its underline and two
   headings in a row read as one slab. */
html[data-rr] table > tbody:last-child > tr:last-child > td { border-bottom: 0; }

/* The marker gutter (read/unread, bookmark). Scoped to listings on
   purpose: lists.js labels "icon" on any table it can find a header row
   for, and on the login page that landed on a prose cell — nowrap there
   stretched the page to 3275px. Every column rule below carries the same
   scope. */
html[data-rr] table[data-rr-list] td[data-rr-col="icon"] {
    /* min-width, not width: the title column asks for 100% and would
       otherwise squeeze this one onto the marker. */
    min-width: 44px;
    padding-left: var(--rr-s2);
    padding-right: 0;
    white-space: nowrap;
    text-align: left;
}
html[data-rr] table[data-rr-list] td[data-rr-col="icon"] .rr-dot { margin: 0 2px; }
html[data-rr] .rr-star {
    width: 22px;
    height: 22px;
    vertical-align: middle;
    /* Quiet until hovered or meaningful: a column of bright stars beside
       unstarred rows is noise. */
    opacity: .28;
}
html[data-rr] tr:hover .rr-star,
html[data-rr] .rr-star:focus-visible,
html[data-rr] .rr-star[aria-pressed="true"] { opacity: 1; }
html[data-rr] .rr-star[aria-pressed="true"] { color: var(--rr-accent); }

/* A listing cell holds one line; the forum description under a name sets
   its own line-height instead. */
html[data-rr] td.row1,
html[data-rr] td.row2 { line-height: var(--rr-lh-meta); }

/* Replies/views/author/last-post are supporting detail, not four columns
   of body text — the template wraps each in a <p>, and two stacked in
   the Last-post cell were what set every row's height. */
html[data-rr] td.row1 p,
html[data-rr] td.row2 p,
html[data-rr] td.row1 > span.gensmall,
html[data-rr] td.row2 > span.gensmall {
    margin: 0;
    line-height: var(--rr-lh-meta);
    font-size: var(--rr-fs-sm);
}
html[data-rr] td.row1 p.topicauthor,
html[data-rr] td.row2 p.topicauthor { color: var(--rr-muted); }

/* The joined Last-post line wraps rather than clipping — a truncated
   username is worse than two lines. */
html[data-rr] p.rr-lastpost { line-height: var(--rr-lh-meta); }
html[data-rr] p.rr-lastpost .rr-sep { color: var(--rr-faint); margin: 0 5px; }

/* Automatic table layout sizes a column to its widest content and
   ignores pixel widths on cells, so instead these columns are told they
   never wrap — a count or heading then claims exactly its own width and
   everything left over goes to the title, the one column with no
   natural width whose wrapping sets the row height. */
html[data-rr] table[data-rr-list] th,
html[data-rr] table[data-rr-list] td[data-rr-col="replies"],
html[data-rr] table[data-rr-list] td[data-rr-col="views"],
html[data-rr] table[data-rr-list] td[data-rr-col="topics"],
html[data-rr] table[data-rr-list] td[data-rr-col="posts"] { white-space: nowrap; }

/* One alignment per column, heading and cells together, keyed on the
   column name lists.js puts on both — the template used to align each
   cell separately with an align attribute, so Author disagreed with its
   own heading and Views right-aligned under a centred heading. Counts
   are right-aligned on tabular figures so digits stack column-wise;
   everything with words is left aligned. */
html[data-rr] table[data-rr-list] [data-rr-col="replies"],
html[data-rr] table[data-rr-list] [data-rr-col="views"],
html[data-rr] table[data-rr-list] [data-rr-col="topics"],
html[data-rr] table[data-rr-list] [data-rr-col="posts"] {
    text-align: right;
    font-variant-numeric: tabular-nums;
}
html[data-rr] table[data-rr-list] [data-rr-col="title"],
html[data-rr] table[data-rr-list] [data-rr-col="author"],
html[data-rr] table[data-rr-list] [data-rr-col="last"] { text-align: left; }
html[data-rr] table[data-rr-list] [data-rr-col="icon"] { text-align: center; }

/* The board writes align="center" on every count cell, and an attribute
   beats a stylesheet rule of equal weight. */
html[data-rr] table[data-rr-list] td[data-rr-col][align] { text-align: inherit; }
html[data-rr] table[data-rr-list] tr > td[data-rr-col="replies"][align],
html[data-rr] table[data-rr-list] tr > td[data-rr-col="views"][align],
html[data-rr] table[data-rr-list] tr > td[data-rr-col="topics"][align],
html[data-rr] table[data-rr-list] tr > td[data-rr-col="posts"][align] { text-align: right; }
html[data-rr] table[data-rr-list] tr > td[data-rr-col="author"][align],
html[data-rr] table[data-rr-list] tr > td[data-rr-col="last"][align] { text-align: left; }

/* The title column claims what's left — under automatic layout a cell
   asking for 100% gets every pixel the others don't need, which is the
   one width declaration the algorithm honours. Without it, joining the
   last-post lines widened that column at the title's expense. The
   heading is matched by name rather than position: a forum listing spans
   the marker and title in one heading cell, while search results head
   the marker alone — \`th:first-child\` there handed the whole page to the
   marker gutter and squeezed titles into a 177px column. */
html[data-rr] table[data-rr-list] td[data-rr-col="title"],
html[data-rr] table[data-rr-list] th[data-rr-col="title"] { width: 100%; }

/* On a search-results page with long titles, the 100% title column
   starved Last-post down to 108px / three lines. A floor wide enough for
   a date and a name keeps it on one line. */
html[data-rr] table[data-rr-list] td[data-rr-col="last"] { min-width: 17ch; }
@media (min-width: 861px) {
    /* One line by construction: if the column is too narrow, width comes
       off the title rather than wrapping the arrow. */
    html[data-rr] table[data-rr-list] .rr-lastpost { white-space: nowrap; }
}

/* A lone date ("Joined", "Sent") never needs to wrap once the weekday's
   off it. */
html[data-rr] [data-rr-date] { white-space: nowrap; }

/* The control panel's section links carry .nav, which the size reset
   above renders as body text — "Profile" and friends read as headings,
   which nobody clicks. They're links. */
html[data-rr] a.nav { color: var(--rr-link); }
html[data-rr] a.nav:hover { color: var(--rr-link); text-decoration: underline; }

/* The posting form's filehost warning sits at 10.4px, under this
   interface's normal floor. */
html[data-rr] .link_unsafe_note,
html[data-rr] .link_unsafe_note .tooltip { font-size: var(--rr-fs-xs); }

/* The posting form types width:30/40/50px into each BBCode button, and
   the 16px padding these get left "Quote" an 8px box — "Quot", "Coc",
   "URI". Width follows the word instead. */
html[data-rr] input.btnbbcode[type="button"] {
    width: auto !important;
    min-width: 2.4em;
    padding-left: 10px;
    padding-right: 10px;
}

/* The font-colour palette: 141 swatches, each a 7x6px link around a
   spacer gif — smaller than a full stop. Doubling each side quadruples
   the target. */
html[data-rr] td[data-rr-swatch] > a {
    display: block;
    width: 14px;
    height: 14px;
}
html[data-rr] td[data-rr-swatch] > a > img {
    display: block;
    width: 100%;
    height: 100%;
}
html[data-rr] td[data-rr-swatch] {
    width: 14px !important;
    height: 14px !important;
    padding: 0 !important;
    border-radius: 2px;
}
html[data-rr] td[data-rr-swatch]:hover { outline: 2px solid var(--rr-text-strong); outline-offset: -1px; }
/* The template lays 141 swatches six to a row (25 rows, taller than the
   message box beside it); nine to a row is 16 rows, matching the box.
   The !important on display targets the narrow layout, whose
   #wrapcentre-scoped table rules would otherwise stack these into a
   1750px column. */
html[data-rr] table[data-rr-palette] {
    display: flex !important;
    flex-wrap: wrap;
    gap: 3px;
    width: 150px;
    margin: 0 auto;
}
html[data-rr] table[data-rr-palette] tbody,
html[data-rr] table[data-rr-palette] tr { display: contents !important; }
html[data-rr] table[data-rr-palette] td { display: block !important; flex: 0 0 auto; }

/* The board's radios/checkboxes are 13px, flush against their word. One
   size, one gap, the accent for the mark. */
html[data-rr] input[type="radio"],
html[data-rr] input[type="checkbox"] {
    width: 15px;
    height: 15px;
    margin: 0 6px 0 0;
    vertical-align: -3px;
    accent-color: var(--rr-accent);
}

/* Private-message markers: the coloured squares the folder legend
   describes. */
html[data-rr] .rr-pm-mark {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 3px;
    vertical-align: -1px;
    float: none !important;
    background: var(--rr-pm, transparent);
}
html[data-rr] .rr-pm-mark img { display: none; }
html[data-rr] .pm_marked_colour { --rr-pm: var(--rr-warn); }
html[data-rr] .pm_replied_colour { --rr-pm: var(--rr-tag-info); }
html[data-rr] .pm_friend_colour { --rr-pm: var(--rr-ok); }
html[data-rr] .pm_foe_colour { --rr-pm: var(--rr-danger); }
html[data-rr] td.pm_marked_colour,
html[data-rr] td.pm_replied_colour,
html[data-rr] td.pm_friend_colour,
html[data-rr] td.pm_foe_colour { box-shadow: inset 4px 0 0 var(--rr-pm); }

html[data-rr] .forumlink,
html[data-rr] .topictitle {
    color: var(--rr-text-strong);
    font-size: var(--rr-fs);
    font-weight: 600;
    line-height: var(--rr-lh-title);
}
html[data-rr] .forumlink:hover,
html[data-rr] .topictitle:hover { color: var(--rr-accent); text-decoration: none; }
html[data-rr] .forumdesc { margin: 5px 0 0; line-height: 1.5; max-width: var(--rr-measure); }

html[data-rr] .breadcrumbs { margin: 0; font-size: var(--rr-fs-sm); color: var(--rr-muted); }
html[data-rr] a.breadcrumbs { color: var(--rr-muted); font-weight: 500; }
html[data-rr] a.breadcrumbs:hover { color: var(--rr-text); }

html[data-rr] h1, html[data-rr] h2, html[data-rr] h3 {
    color: var(--rr-text-strong);
    font-weight: 650;
    letter-spacing: -.01em;
    line-height: 1.2;
    margin: 0 0 var(--rr-s3);
}
html[data-rr] #pageheader h2 {
    font-size: calc(var(--rr-fs) + 5px);
    /* Flex row with baseline alignment: the tag and the title share a
       baseline whatever their sizes, which an inline-flex badge could
       only approximate. */
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0;
}
html[data-rr] #pageheader h2 > .rr-tag { align-self: center; }
html[data-rr] #pageheader h2 a.titles { color: var(--rr-text-strong); }

/* ---- A table of fields --------------------------------------------- */

/* Marked by lists.js (markFieldTables): a private message's header, and
   anything else the board writes as label/value rows. The template puts
   row1 on the <tr> and leaves cells plain, so every td.row1-keyed inset
   in this sheet missed them until now. Same inset as any other card,
   label quiet and value not, no hairline under the last row. */
html[data-rr] table.tablebg[data-rr-fields] > tbody > tr > td {
    padding: var(--rr-row-pad) var(--rr-card-pad);
    background: var(--rr-surface);
    border: 0;
    border-bottom: 1px solid var(--rr-line);
    vertical-align: top;
}
html[data-rr] table.tablebg[data-rr-fields] > tbody > tr:last-child > td { border-bottom: 0; }
html[data-rr] table.tablebg[data-rr-fields] > tbody > tr > td[data-rr-field="label"] {
    width: 1%;
    padding-right: var(--rr-s5);
    color: var(--rr-faint);
    white-space: nowrap;
}
/* The template bolds the label and leaves the value plain, backwards:
   the label repeats on every message, the value is what was opened to
   be read. */
html[data-rr] table.tablebg[data-rr-fields] td[data-rr-field="label"] b { font-weight: 600; }
html[data-rr] table.tablebg[data-rr-fields] > tbody > tr > td[data-rr-field="value"] { color: var(--rr-text); }

/* ---- The forum-rules notice ----------------------------------------- */

/* The live shape: a bare div.forumrules dropped into #wrapcentre with
   the board's black ground and dark-red hairline, above the topic title.
   Addressed separately from the table shape below since they share no
   element. */
html[data-rr] div.forumrules[data-rr-rules] {
    position: relative;
    margin: var(--rr-s3) 0 var(--rr-s5);
    padding: var(--rr-s4) var(--rr-s5) var(--rr-s4) 26px;
    background: var(--rr-surface-2);
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius-lg);
    color: var(--rr-muted);
    font-size: var(--rr-fs-sm);
    line-height: var(--rr-lh);
}
html[data-rr] div.forumrules[data-rr-rules]::before {
    content: "";
    position: absolute;
    left: 12px;
    top: calc(var(--rr-s4) + 3px);
    width: 3px;
    height: 14px;
    border-radius: 2px;
    background: var(--rr-warn);
}
/* The theme's colours rather than the board's inline #FFBF00 — lists.js
   clears the inline colour so this reaches it; weight carries the
   emphasis size used to. */
html[data-rr] div.forumrules[data-rr-rules] > span,
html[data-rr] div.forumrules[data-rr-rules] > span span { color: var(--rr-warn); }
html[data-rr] div.forumrules[data-rr-rules] ul,
html[data-rr] div.forumrules[data-rr-rules] ol {
    margin: var(--rr-s2) 0 0;
    padding-left: var(--rr-s5);
    color: var(--rr-muted);
}
html[data-rr] div.forumrules[data-rr-rules] li { margin: 2px 0; }

/* ---- The notice folds ----------------------------------------------- */

/* Read once, a line after that. The board's own heading becomes the
   toggle, so the card keeps its ground/rail/inset either way with no new
   element carrying the chevron. Folded, the card is one line. */
html[data-rr] .rr-rules__toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    margin: 0 0 var(--rr-s3);
    padding: 0;
    background: none;
    border: 0;
    border-radius: 0;
    color: var(--rr-faint);
    font: 650 var(--rr-fs-xs) / 1.4 var(--rr-font);
    letter-spacing: .04em;
    text-transform: uppercase;
    text-align: left;
    cursor: pointer;
}
html[data-rr] .rr-rules__toggle:hover { color: var(--rr-text-strong); }
/* The heading is the button's label now; :is() is needed to beat the
   competing rule \`html[data-rr] div.forumrules[data-rr-rules] h3\` on
   specificity (a plain descendant selector loses, and a tie would depend
   on source order) — it lost silently before, and the 12px margin it
   left pushed the chevron 6px below the words it points at, since a flex
   row centres on margin boxes. */
html[data-rr] [data-rr-rules] button.rr-rules__toggle > :is(h3, h4, p.rules, .rr-rules__name),
html[data-rr] button.rr-rules__toggle > :is(h3, h4, p.rules, .rr-rules__name) {
    margin: 0;
    color: inherit;
    font: inherit;
    letter-spacing: inherit;
    text-transform: inherit;
}
html[data-rr] .rr-rules__toggle > svg {
    width: 13px;
    height: 13px;
    flex: none;
    color: var(--rr-faint);
}
/* Folded: the chevron points at what it would open, and the room the
   heading kept for the rules below goes with them. */
html[data-rr] [data-rr-folded] > .rr-rules__toggle { margin-bottom: 0; }
html[data-rr] [data-rr-folded] > .rr-rules__toggle > svg { transform: rotate(-90deg); }
html[data-rr] .rr-rules__body[hidden] { display: none; }
/* Marked by lists.js (markForumRules): prose, not a listing row, so it
   gets a heading told apart from the body, the tinted ground and accent
   mark used elsewhere for "this is a heading", and no hairline under a
   card with one row. */
html[data-rr] table.tablebg[data-rr-rules] > tbody > tr > td.row3 {
    position: relative;
    padding: var(--rr-s4) var(--rr-s5) var(--rr-s4) 26px;
    /* A plain token, not the accent color-mix() the category heads use:
       that mix resolves too late and was read against the previous
       theme's background — on light that meant #FFCC00 on white. */
    background: var(--rr-surface-2);
    border-bottom: 0;
    vertical-align: top;
}
html[data-rr] table.tablebg[data-rr-rules] > tbody > tr > td.row3::before {
    content: "";
    position: absolute;
    left: 12px;
    top: calc(var(--rr-s4) + 3px);
    width: 3px;
    height: 14px;
    border-radius: 2px;
    background: var(--rr-accent);
}
/* subsilver2 wraps the rules in one more table where they're filled in,
   and pads every cell it finds — a second inset on top of the card's
   own. Flattened. */
html[data-rr] table.tablebg[data-rr-rules] table { border-spacing: 0; width: 100%; }
html[data-rr] table.tablebg[data-rr-rules] table > tbody > tr > td { padding: 0; background: none; border: 0; }

html[data-rr] div.forumrules[data-rr-rules] h3,
html[data-rr] table.tablebg[data-rr-rules] h3,
html[data-rr] table.tablebg[data-rr-rules] h4,
html[data-rr] table.tablebg[data-rr-rules] p.rules {
    margin: 0 0 var(--rr-s3);
    font-size: var(--rr-fs-xs);
    font-weight: 650;
    letter-spacing: .04em;
    text-transform: uppercase;
    color: var(--rr-faint);
}
html[data-rr] table.tablebg[data-rr-rules] .postbody {
    font-size: var(--rr-fs-sm);
    line-height: var(--rr-lh);
    color: var(--rr-muted);
}
/* The board's inline colour, only unreadable on the paper theme. Themed
   pass (theme.js, readableBoardInk) lifts inline colours generally but
   skips this one: measured, this cell's background still computes as
   the board's own #232323 when that pass runs, so #FFCC00 reads as fine
   there and only the light theme needs the override. */
html[data-rr][data-rr-theme="paper"] table.tablebg[data-rr-rules] .postbody [style*="color"] {
    color: var(--rr-notice-ink) !important;
}
/* The board writes rules with <br><br> between paragraphs; a <ul> under
   them arrives with the browser's own 40px indent on top of the cell's. */
html[data-rr] table.tablebg[data-rr-rules] ul,
html[data-rr] table.tablebg[data-rr-rules] ol { margin: var(--rr-s2) 0; padding-left: var(--rr-s5); }
html[data-rr] table.tablebg[data-rr-rules] li { margin: 2px 0; }

/* ---- Posts ----------------------------------------------------------- */

html[data-rr] .postbody {
    font-family: var(--rr-font);
    font-size: var(--rr-fs);
    line-height: var(--rr-lh);
    color: var(--rr-text);
    max-width: var(--rr-measure);
}
html[data-rr] .postbody img { max-width: 100%; height: auto; border-radius: var(--rr-radius); }
html[data-rr] .postdetails { color: var(--rr-muted); font-size: var(--rr-fs-sm); }
html[data-rr] .postauthor { color: var(--rr-text-strong); font-weight: 650; font-size: var(--rr-fs); }

/* Author column: quiet supporting detail, not a second column of equal
   weight. */
html[data-rr] td.profile {
    background: var(--rr-surface-2);
    width: 168px;
    vertical-align: top;
}
html[data-rr] td.profile,
html[data-rr] td.profile .postdetails {
    font-size: var(--rr-fs-xs);
    color: var(--rr-faint);
    line-height: 1.5;
}
html[data-rr] td.profile b,
html[data-rr] td.profile strong { color: var(--rr-muted); font-weight: 600; }
html[data-rr] td.profile img {
    max-width: 110px;
    height: auto;
    border-radius: var(--rr-radius);
    margin: var(--rr-s2) 0;
}
/* The inner table carries width="150"; a real width stops auto layout
   collapsing the column to 60px. */
html[data-rr] td.profile > table { width: 150px !important; }

/* ---- Modern post layout ---------------------------------------------- */

/* With the author moved into a header strip, the column and the
   template's subject row have nothing left to show. */
html[data-rr][data-rr-posts="modern"] td.profile { display: none; }
html[data-rr][data-rr-posts="modern"] table.tablebg > tbody > tr > td[valign="top"] { width: auto; }
html[data-rr][data-rr-posts="modern"] b.postauthor { display: none; }
html[data-rr][data-rr-posts="modern"] table.tablebg > tbody > tr > td[align="center"][valign="middle"] { display: none; }
html[data-rr][data-rr-posts="modern"] table.tablebg th { display: none; }

/* The template pads under a message with bare <br> that used to separate
   the signature and edit controls; restyled, each post ended in 40px of
   empty line boxes. */
html[data-rr][data-rr-posts="modern"] .rr-posthead ~ br { display: none; }

html[data-rr] .spoiler {
    background: var(--rr-surface-2);
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius);
    padding: var(--rr-s3) var(--rr-s4);
    margin: var(--rr-s4) 0;
}
/* The content box keeps its padding/margin when the board hides the text
   inside it, or every closed spoiler is a header over 50px of nothing.
   The box goes with its text — the board toggles the inner div between
   inline and none. */
html[data-rr] .spoiler > div.quotecontent:not(:has(> div[style*="inline"])) { display: none; }
html[data-rr] .spoiler > div[style*="margin-bottom"]:last-child { margin-bottom: 0 !important; }
html[data-rr] .spoiler input[type="button"] {
    width: auto !important;
    font-size: var(--rr-fs-xs) !important;
    padding: 3px 10px !important;
    background: var(--rr-surface-3);
    color: var(--rr-text);
    border: 1px solid var(--rr-line-strong);
    border-radius: var(--rr-radius);
    cursor: pointer;
}

html[data-rr] .postbody a { color: var(--rr-link); }
html[data-rr] .postbody a:visited { color: var(--rr-link-visited); }
/* Where an off-site link goes, printed after it (topic.js) — a rule of
   its own rather than inherited, so it stays quiet on hover too. */
html[data-rr] .rr-host {
    margin-left: 5px;
    font-size: var(--rr-fs-xs);
    font-family: var(--rr-font-mono);
    color: var(--rr-faint);
}

html[data-rr] blockquote,
html[data-rr] .quotecontent {
    background: var(--rr-surface-2);
    border: 0;
    border-left: 3px solid var(--rr-line-strong);
    border-radius: 0 var(--rr-radius) var(--rr-radius) 0;
    margin: var(--rr-s4) 0;
    padding: var(--rr-s3) var(--rr-s4);
    color: var(--rr-muted);
    font-size: var(--rr-fs-sm);
}
html[data-rr] blockquote blockquote,
html[data-rr] .quotecontent .quotecontent { background: var(--rr-surface-3); }
html[data-rr] .quotetitle,
html[data-rr] blockquote > cite {
    display: block;
    color: var(--rr-text);
    font-style: normal;
    font-weight: 600;
    font-size: var(--rr-fs-xs);
    margin-bottom: var(--rr-s1);
    border: 0;
    background: none;
    padding: 0;
}

html[data-rr] .codetitle,
html[data-rr] .code,
html[data-rr] pre {
    font-family: var(--rr-font-mono);
    font-size: var(--rr-fs-sm);
    line-height: 1.55;
}
html[data-rr] .codetitle {
    background: var(--rr-surface-3);
    color: var(--rr-muted);
    border: 1px solid var(--rr-line);
    border-bottom: 0;
    border-radius: var(--rr-radius) var(--rr-radius) 0 0;
    padding: var(--rr-s1) var(--rr-s2);
    font-family: var(--rr-font);
    font-size: var(--rr-fs-xs);
}
html[data-rr] .code {
    background: var(--rr-bg-sunken);
    color: var(--rr-text);
    border: 1px solid var(--rr-line);
    border-radius: 0 0 var(--rr-radius) var(--rr-radius);
    padding: var(--rr-s4);
    overflow-x: auto;
}

/* The board's syntax-highlighter block (.codebox > .codeheader >
   .codeholder > .text > ol > li) ships its own stylesheet painting it
   #c9c9c9 with #ccc lines — a light box mid-dark-post, tokens coloured
   for that light box (an olive link there read at 1.9:1). The box takes
   the theme's sunken surface; the tokens take the theme's colours. */
html[data-rr] .postbody .codebox,
html[data-rr] .codebox {
    margin: var(--rr-s3) 0;
    width: auto !important;
    max-width: 100%;
    background: var(--rr-bg-sunken) !important;
    border: 1px solid var(--rr-line) !important;
    border-radius: var(--rr-radius);
    overflow: hidden;
}
html[data-rr] .codebox .codeheader {
    /* surface-2, not surface-3: on the light theme surface-3 is a shade
       from the sunken box and the header vanished into it. */
    background: var(--rr-surface-2) !important;
    color: var(--rr-muted) !important;
    border: 0 !important;
    border-bottom: 1px solid var(--rr-line) !important;
    padding: var(--rr-s1) var(--rr-s3);
    font: 600 var(--rr-fs-xs) / 1.6 var(--rr-font);
}
html[data-rr] .codebox .codeheader b { color: var(--rr-muted); font-weight: 600; }
html[data-rr] .codebox .codeheader a { color: var(--rr-link); font-weight: 500; }
html[data-rr] .codebox .codeholder,
html[data-rr] .codebox .text {
    background: transparent !important;
    border: 0 !important;
    color: var(--rr-text) !important;
}
html[data-rr] .codebox .text {
    font-family: var(--rr-font-mono) !important;
    font-size: var(--rr-fs-sm) !important;
    line-height: 1.55;
    padding: var(--rr-s2) var(--rr-s3);
    overflow-x: auto;
}
html[data-rr] .codebox ol {
    margin: 0;
    padding-left: 3.2em;
    color: var(--rr-faint);
}
html[data-rr] .codebox li,
html[data-rr] .codebox li.li1,
html[data-rr] .codebox li.li2 {
    background: transparent !important;
    color: var(--rr-text) !important;
    border: 0 !important;
    margin: 0;
    padding: 0 0 0 var(--rr-s2);
}
html[data-rr] .codebox li::marker { color: var(--rr-faint); }
/* GeSHi's token classes, in the theme's palette instead of the light
   box's dark blues and browns. */
html[data-rr] .codebox .kw1, html[data-rr] .codebox .kw2,
html[data-rr] .codebox .kw3, html[data-rr] .codebox .kw4 { color: var(--rr-tag-info) !important; }
html[data-rr] .codebox .st0, html[data-rr] .codebox .st_h { color: var(--rr-tag-release) !important; }
html[data-rr] .codebox .co1, html[data-rr] .codebox .co2,
html[data-rr] .codebox .coMULTI { color: var(--rr-faint) !important; font-style: italic; }
html[data-rr] .codebox .nu0 { color: var(--rr-warn) !important; }
html[data-rr] .codebox .sy0, html[data-rr] .codebox .sy1,
html[data-rr] .codebox .br0 { color: var(--rr-text) !important; }
html[data-rr] .codebox .re0, html[data-rr] .codebox .re1,
html[data-rr] .codebox .me1 { color: var(--rr-tag-tutorial) !important; }

html[data-rr] .username-coloured,
html[data-rr] .postauthor a { font-weight: 600; }

html[data-rr] hr { border: 0; border-top: 1px solid var(--rr-line); margin: var(--rr-s4) 0; background: none; height: 0; }

/* ---- Forms ------------------------------------------------------------ */

/* Only the board's own fields — \`input[type="text"]\` is more specific
   than a class, so this block used to win against the script's own
   fields too: the palette's search box came out rounded/bordered/sunken
   with an accent focus ring it shouldn't have. Excluded the same way the
   sizing rule below does. */
html[data-rr] input[type="text"]:not([class*="rr-"]),
html[data-rr] input[type="password"]:not([class*="rr-"]),
html[data-rr] input[type="search"]:not([class*="rr-"]),
html[data-rr] input[type="email"]:not([class*="rr-"]),
html[data-rr] select:not([class*="rr-"]),
html[data-rr] textarea:not([class*="rr-"]),
html[data-rr] .inputbox:not([class*="rr-"]),
html[data-rr] .post:not([class*="rr-"]) {
    background: var(--rr-bg-sunken);
    color: var(--rr-text);
    border: 1px solid var(--rr-line-strong);
    border-radius: var(--rr-radius);
    padding: var(--rr-s2) var(--rr-s3);
    font-family: var(--rr-font);
    font-size: var(--rr-fs-sm);
    line-height: 1.4;
    transition: border-color var(--rr-speed) ease;
    box-sizing: border-box;
    max-width: 100%;
}
html[data-rr] textarea,
html[data-rr] textarea.post { font-family: var(--rr-font); line-height: var(--rr-lh); }
/* The attachment field wasn't in the list above, and the board paints
   every \`input\` near-black — on light themes it read as a black bar with
   the browser's own "Choose file" button inside it. */
html[data-rr] input[type="file"] {
    background: var(--rr-bg-sunken);
    color: var(--rr-text);
    border: 1px solid var(--rr-line-strong);
    border-radius: var(--rr-radius);
    padding: var(--rr-s2) var(--rr-s3);
    font-family: var(--rr-font);
    font-size: var(--rr-fs-sm);
    max-width: 100%;
}
/* The template sizes fields with size="25"/"45" (a fixed character count
   from 2003), cramped on a fluid layout. Board fields get a floor in
   ems; the script's own controls size themselves. */
html[data-rr] #wrapcentre input[type="text"]:not([class*="rr-"]):not([size="1"]):not([size="2"]):not([size="3"]):not([size="4"]):not([size="5"]):not([size="6"]),
html[data-rr] #wrapcentre input[type="search"]:not([class*="rr-"]),
html[data-rr] #wrapcentre input[type="password"]:not([class*="rr-"]),
html[data-rr] #wrapcentre input[type="email"]:not([class*="rr-"]) {
    width: auto;
    min-width: min(100%, 22em);
}
html[data-rr] input:not([class*="rr-"]):hover,
html[data-rr] select:not([class*="rr-"]):hover,
html[data-rr] textarea:not([class*="rr-"]):hover { border-color: var(--rr-faint); }
/* Focus shows as a coloured border rather than a doubled ring — but only
   on fields, since a submit button matches \`input\` too and has no border
   to colour; a live Tab pass found the board's own Search button with no
   focus indicator at all before this. The four :not()s make this
   specific enough to beat the script's own controls, which is why the
   command palette used to draw a permanent accent-red rule under its own
   search box. */
html[data-rr] input:not([class*="rr-"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]):focus,
html[data-rr] select:not([class*="rr-"]):focus,
html[data-rr] textarea:not([class*="rr-"]):focus { border-color: var(--rr-accent); outline: none; }
html[data-rr] ::placeholder { color: var(--rr-faint); }

html[data-rr] input.button1,
html[data-rr] input.button2,
html[data-rr] input[type="submit"],
html[data-rr] input[type="button"],
html[data-rr] input[type="reset"] {
    background: var(--rr-surface-3);
    color: var(--rr-text);
    border: 1px solid var(--rr-line-strong);
    border-radius: var(--rr-radius);
    padding: var(--rr-s2) var(--rr-s4);
    font-family: var(--rr-font);
    font-size: var(--rr-fs-sm);
    font-weight: 600;
    cursor: pointer;
    transition: background var(--rr-speed) ease, border-color var(--rr-speed) ease;
}
html[data-rr] input.button1:hover,
html[data-rr] input[type="submit"]:hover {
    background: var(--rr-accent);
    border-color: var(--rr-accent);
    color: var(--rr-accent-text);
}

/* ---- Legacy imagery -------------------------------------------------- */

/* The GIF interface is swapped in JS (icons.js); these style what
   replaces it. Read state becomes a dot rather than a beveled checkbox. */
html[data-rr] img[src$="spacer.gif"] { display: none; }

/* Three states, one mark, each legible alone. Read used to be a filled
   dot in --rr-line-strong — a smudge against the page — so it's a ring
   now in the same grey as meta text; a row already visited fills the
   ring grey. Unread stays a filled accent dot, the one state worth the
   accent colour. The ring is a border (not a shadow) so the locked
   variant can add its own box-shadow. This is also the only signal for
   read state — the title used to grey out too, which cost it contrast
   for a redundant mark. */
.rr-dot {
    display: inline-block;
    box-sizing: border-box;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    border: 2px solid var(--rr-muted);
    background: transparent;
    vertical-align: middle;
}
.rr-dot[data-state="unread"] { border-color: var(--rr-accent); background: var(--rr-accent); }
html[data-rr] [data-rr-visited] .rr-dot[data-state="read"] { background: var(--rr-muted); }
.rr-dot[data-locked] { box-shadow: 0 0 0 2px var(--rr-surface), 0 0 0 3px var(--rr-line-strong); opacity: .6; }

.rr-latest { color: var(--rr-faint); vertical-align: -2px; }
a:hover > .rr-latest { color: var(--rr-accent); }

/* The attachment glyph (icons.js): a fact about the topic, not a
   control, so it stays muted and sits after the title. */
.rr-attach { color: var(--rr-faint); vertical-align: -2px; margin-left: 4px; }

/* "[ Go to page: 1 ... 41, 42, 43 ]" under a long topic's title used to
   render at the same 13px as the title's meta line (\`td.row1 p\` above is
   more specific) and its numbers had no hit target beyond 12px of
   touching text. Both selectors below carry the cell to win the
   specificity fight, and each number gets real padding. */
html[data-rr] td.row1 p.rr-pagejump,
html[data-rr] td.row2 p.rr-pagejump {
    margin: 5px 0 0;
    color: var(--rr-faint);
    font-size: var(--rr-fs-xs);
    line-height: 1.35;
}
/* Padding on an inline box widens the hit target without touching the
   line box, so a 108-row page (seventy of them carrying this strip)
   doesn't spend height on it. A flex row was tried first, but it also
   pulled the template's own commas into flex items, spacing them off
   the numbers: "41 , 42 , 43". */
html[data-rr] p.rr-pagejump a {
    /* Padding is the hit target; the negative margin gives the spacing
       back so commas still hug the number in front of them. */
    padding: 2px 5px;
    margin: 0 -3px;
    border-radius: 4px;
    color: var(--rr-muted);
    font-variant-numeric: tabular-nums;
}
html[data-rr] p.rr-pagejump a:hover {
    background: var(--rr-surface-3);
    color: var(--rr-text-strong);
    text-decoration: none;
}

/* ---- Duplicated chrome ------------------------------------------------ */

/* The breadcrumb now lives in the top bar; the template's copy, its
   empty category strip and the space around the forum title are
   redundant once it does. */
html[data-rr][data-rr-nav="on"] td.row5 > p.breadcrumbs { display: none; }
/* Keyed on whether this script drew the header, not on the bar: with the
   bar off, this strip is still the board's own, under a header the
   script built — it drew a full-width grey band with the breadcrumb
   jammed against the search field. */
html[data-rr][data-rr-header="rr"] td.row5 {
    padding: var(--rr-s2) var(--rr-s3);
    border-radius: var(--rr-radius-lg);
}
html[data-rr][data-rr-header="rr"] td.row5:has(> #search-box) {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    /* On a phone the crumb and box won't share a line; without this the
       crumb was squeezed to one word per row. */
    flex-wrap: wrap;
    gap: var(--rr-s3);
}
/* \`:has()\` matches even a page-hidden search box, so this cell is a flex
   row on every listing; with the bar off the crumb was pushed to the far
   right with the box. Each takes an end; where the box is hidden the
   crumb is the sole item and lands at the start. */
html[data-rr][data-rr-nav="off"] td.row5:has(> #search-box) { justify-content: space-between; }

/* The strip left holding only the board's search box (navbar.js,
   tidyCrumbStrip) on pages with no listing toolbar to move it into — no
   card, no fill, no border, just a row with a field at the end. */
html[data-rr] #wrapcentre table.tablebg[data-rr-crumbstrip] {
    background: none;
    border: 0;
    border-radius: 0;
    margin-bottom: var(--rr-s3);
}
html[data-rr] #wrapcentre table[data-rr-crumbstrip] td.row5 { background: none; padding: 0; }

/* The template floats the links in this paragraph, so without a
   containing block the heading below rides up onto the same line. */
html[data-rr] p.searchbar {
    display: flow-root;
    margin: 0 0 var(--rr-s3);
    font-size: var(--rr-fs-sm);
}
html[data-rr] p.searchbar > span { float: none !important; }
html[data-rr] p.searchbar a { color: var(--rr-muted); }
html[data-rr] p.searchbar a:hover { color: var(--rr-accent); }

html[data-rr] #pageheader { margin-bottom: var(--rr-s3); }
html[data-rr] #pageheader h2 { margin: 0; }
/* The template spaces blocks with bare <br>; once the strips around them
   are restyled or hidden each is a 19px band of nothing — the one under
   <body> put 25px between the top bar and the first line of content. */
html[data-rr] #pageheader br,
html[data-rr] body > br,
html[data-rr] #wrapcentre > br { display: none; }

/* The forum name renders as a bare <h2> outside #pageheader on listing
   pages, set at page-title size with 24px above it — repeating what the
   breadcrumb already says, twice the weight, a whole screen-band of its
   own. Rendered at the section size instead. */
html[data-rr] #wrapcentre > h2,
html[data-rr] #wrapcentre > form > h2 {
    font-size: var(--rr-fs-lg);
    margin: var(--rr-s4) 0 var(--rr-s2);
}
html[data-rr] #wrapcentre > p.searchbar:first-child { margin-top: 0; }
html[data-rr][data-rr-nav="on"] #wrapcentre { padding-top: var(--rr-s4); }

/* Category strips the template leaves empty. */
html[data-rr] td.cat:empty,
html[data-rr] tr[data-rr-cat-row="empty"] { display: none; }

html[data-rr] #overlay {
    background: rgba(10, 12, 16, .72);
    backdrop-filter: blur(3px);
}
html[data-rr] #overlaytext {
    background: var(--rr-surface);
    color: var(--rr-text);
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius-lg);
    box-shadow: var(--rr-shadow-pop);
    padding: var(--rr-s5);
    max-width: 560px;
}
html[data-rr] #overlayconfirmbtn {
    background: var(--rr-accent);
    color: var(--rr-accent-text);
    border-radius: var(--rr-radius);
    font-weight: 600;
}

/* The control panel marks the current folder with <li class="row2">,
   which only the board's stylesheet coloured — #232323 on light. */
html[data-rr] li.row1,
html[data-rr] li.row2 {
    background: var(--rr-surface-2);
    border-radius: 4px;
    padding: 1px 6px !important;
    margin: 0 -6px;
}

/* A multi-select drawn five rows tall for a list of thirty forums. */
html[data-rr] select[multiple] { min-height: 12em; }

/* "Top" (back to the header) is hidden with the post footer on desktop,
   restored on a phone where the footer is a flex row — the floating
   button does this job at every width. */
html[data-rr] a[href="#wrapheader"] { display: none; }

/* The row that link lived in survives the general "empty post row"
   cleanup because it isn't textually empty — its cell floats a
   profile-icon link the modernised header already carries. A row with
   only a floated child collapses to ~20px on desktop; on the phone card
   layout the same cell is 49px of empty band under every post.
   !important: the phone row rule in responsive.css carries an id plus
   more type selectors and would otherwise win on specificity regardless
   of source order. */
html[data-rr] tr[data-rr-top-row] { display: none !important; }

/* Search-result highlighting uses the board's \`.posthilit\`: pure yellow
   behind dark text on every theme. A wash of the warning colour instead,
   text keeping its own colour. */
html[data-rr] .posthilit {
    background: color-mix(in srgb, var(--rr-warn) 32%, transparent);
    color: var(--rr-text-strong);
    border-radius: 3px;
    padding: 0 2px;
}

/* A YouTube embed is written as <iframe width="560" height="315">; on a
   340px-wide phone post the frame ignored that. It follows the width it
   has instead, keeping its shape. */
html[data-rr] .postbody iframe,
html[data-rr] .postbody embed,
html[data-rr] .postbody object,
html[data-rr] .postbody video {
    max-width: 100%;
}
html[data-rr] .postbody iframe[src*="youtube"],
html[data-rr] .postbody iframe[src*="youtu.be"],
html[data-rr] .postbody iframe[src*="vimeo"] {
    aspect-ratio: 16 / 9;
    height: auto;
    border-radius: var(--rr-radius);
}

/* A moved topic: the template's beveled GIF was the one marker the icon
   pass left as-is. A hollow diamond, the dot's own size. */
html[data-rr] .rr-dot[data-state="moved"] {
    background: transparent;
    border: 2px solid var(--rr-faint);
    border-radius: 2px;
    transform: rotate(45deg) scale(.85);
}

/* A roster prints "Send private message" on every one of forty rows;
   drawn as full buttons they were the loudest thing on the page. */
html[data-rr] table[data-rr-list] td .rr-ctl {
    padding: 1px 8px;
    font-size: var(--rr-fs-xs);
    background: transparent;
}


/* ---- What the template leaves between things -------------------------- */

/* A 1px spacer row: an <img src="spacer.gif"> in a cell the board paints
   black. The image is dropped elsewhere; the cell itself still drew a
   black band between a private message and the next search result. */
html[data-rr] td.spacer {
    background: none !important;
    height: 0;
    padding: 0;
    /* A zero line box, not a zero font — the size floor this sheet
       guarantees is measured on every cell, spacers included. */
    line-height: 0;
}

/* Replaces the board's run of underscores (topic.js,
   replaceUnderscoreRules) at a signature's weight. */
html[data-rr] hr.rr-rule {
    margin: var(--rr-s3) 0;
    border: 0;
    border-top: 1px solid var(--rr-line);
    background: none;
    height: 0;
}

/* ---- The topic review under the reply form ---------------------------- */

/* The last few posts, reprinted in a scrollable box so you can answer
   without leaving the form. The board draws them as one continuous
   table — a hairline of table background between posts and a zebra a
   shade apart reads as one long post with a name in the middle of it.
   Each becomes its own card here, out of the rows the board already
   prints (compose.js, initTopicReview). */
html[data-rr] [data-rr-review] {
    /* The template types the height into the element; five cards plus
       the air between them need a little more of it than five glued
       rows did. */
    height: 360px !important;
    padding: var(--rr-s3);
    background: var(--rr-surface);
    overscroll-behavior: contain;
}
html[data-rr] table[data-rr-reviewbox] > tbody > tr > td { padding: 0; }
/* The inner table is a tablebg too, so it arrives wearing the same card
   treatment as everything else — the cards become its rows instead. */
html[data-rr] table[data-rr-review-list] {
    margin: 0;
    border: 0;
    border-radius: 0;
    background: none;
    overflow: visible;
}

/* The two opening headings name columns of a table nobody reads as a
   table; kept, quietly. */
html[data-rr] table[data-rr-review-list] > tbody > tr[data-rr-head] > th {
    background: none;
    border: 0;
    padding: 0 var(--rr-s3) var(--rr-s2);
    color: var(--rr-faint);
    font-size: var(--rr-fs-xs);
    letter-spacing: .04em;
    text-transform: uppercase;
}

html[data-rr] tr[data-rr-review-row] > td {
    background: var(--rr-surface-2);
    padding: var(--rr-s2) var(--rr-s3);
    vertical-align: top;
}
/* The author cell spans the pair, drawing the whole left side. */
html[data-rr] td[data-rr-review-cell="author"] {
    border: 1px solid var(--rr-line);
    border-right: 0;
    border-radius: var(--rr-radius) 0 0 var(--rr-radius);
    padding-top: var(--rr-s3);
}
html[data-rr] tr[data-rr-review-row="head"] > td:not([data-rr-review-cell]) {
    border: 1px solid var(--rr-line);
    border-left: 0;
    border-bottom: 0;
    border-radius: 0 var(--rr-radius) 0 0;
    padding-top: var(--rr-s3);
}
html[data-rr] tr[data-rr-review-row="body"] > td {
    border: 1px solid var(--rr-line);
    border-left: 0;
    border-top: 0;
    border-radius: 0 0 var(--rr-radius) 0;
    padding-bottom: var(--rr-s3);
}
/* The spacer row is a 1px image the reskin already hides; it's the air
   between two cards now. */
html[data-rr] tr[data-rr-review-row="gap"] > td.spacer {
    height: var(--rr-s3);
    padding: 0;
    background: none;
    border: 0;
}

/* Whose post it is, said once — the template wraps the name in its own
   150px table. */
html[data-rr] td[data-rr-review-cell="author"] > table { width: auto !important; }
html[data-rr] td[data-rr-review-cell="author"] td { text-align: left !important; padding: 0; }

/* "Post subject: Re: <the topic>" repeated on all five is the thread's
   own title said five more times — supporting detail, not a heading. */
html[data-rr] tr[data-rr-review-row="head"] .gensmall { color: var(--rr-faint); }
html[data-rr] tr[data-rr-review-row="head"] .gensmall b { color: var(--rr-faint); font-weight: 400; }
html[data-rr] tr[data-rr-review-row="body"] .gensmall b { color: var(--rr-muted); font-weight: 600; }

/* == ui.css == */
/* Everything here is prefixed .rr- and owns its own markup, so nothing
   fights phpBB's specificity. */

.rr-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--rr-surface-2);
    color: var(--rr-text);
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius);
    padding: 7px 12px;
    font: 600 var(--rr-fs-sm) / 1.15 var(--rr-font);
    cursor: pointer;
    white-space: nowrap;
    transition: background var(--rr-speed) ease, border-color var(--rr-speed) ease, color var(--rr-speed) ease;
}
.rr-btn:hover { background: var(--rr-surface-3); border-color: var(--rr-line-strong); color: var(--rr-text-strong); }
.rr-btn:active { transform: translateY(1px); }
.rr-btn[data-variant="primary"] { background: var(--rr-accent); border-color: var(--rr-accent); color: var(--rr-accent-text); }
.rr-btn[data-variant="primary"]:hover { filter: brightness(1.08); }
.rr-btn[data-variant="quiet"] { background: transparent; border-color: transparent; color: var(--rr-muted); }
.rr-btn[data-variant="quiet"]:hover { background: var(--rr-surface-2); color: var(--rr-text); }
.rr-btn[aria-pressed="true"] { background: var(--rr-accent-soft); border-color: var(--rr-accent); color: var(--rr-accent-on-soft, var(--rr-accent)); }
/* Stays quiet when open — the turned chevron already says the state. */
.rr-btn[data-variant="quiet"][data-rr-open] { background: transparent; border-color: transparent; color: var(--rr-text); }
.rr-btn[data-variant="quiet"][data-rr-open]:hover { background: var(--rr-surface-2); }
.rr-btn:disabled, .rr-btn[aria-busy="true"] { opacity: .6; cursor: progress; }
.rr-btn svg { width: 14px; height: 14px; flex: none; }

.rr-icon-btn {
    display: inline-grid;
    place-items: center;
    /* border-box needed: a <button> is border-box by UA default but an
       <a> stays content-box, so the same 30px drew two different
       squares depending on which tag built the control. */
    box-sizing: border-box;
    width: 30px;
    height: 30px;
    padding: 0;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--rr-radius);
    color: var(--rr-muted);
    cursor: pointer;
    transition: background var(--rr-speed) ease, color var(--rr-speed) ease;
}
.rr-icon-btn:hover { background: var(--rr-surface-2); color: var(--rr-text-strong); }
.rr-icon-btn svg { width: 16px; height: 16px; }

/* html[data-rr] a is (0,1,1) vs .rr-icon-btn's (0,1,0) — without this,
   icon buttons built as <a> (private messages, account) inherited
   link-red while the ones built as <button> stayed grey. */
html[data-rr] a.rr-icon-btn { color: var(--rr-muted); }

/* Normalises three different heights in one strip (an 18px number,
   25px text buttons, 30px icon buttons) into one row of tools. */
html[data-rr] .rr-posttools .rr-icon-btn { width: 26px; height: 26px; }

/* The first-unread arrow after a listing title (icons.js). */
html[data-rr] a.rr-unread-jump {
    width: 22px;
    height: 22px;
    margin-left: 2px;
    vertical-align: middle;
    color: var(--rr-muted);
}
html[data-rr] a.rr-unread-jump:hover { color: var(--rr-accent); background: var(--rr-surface-3); }
html[data-rr] tr[data-rr-unread] a.rr-unread-jump { display: none; }
html[data-rr] .rr-posttools .rr-postnum {
    display: inline-flex;
    align-items: center;
    height: 25px;
    padding: 0 6px;
    box-sizing: border-box;
}
html[data-rr] a.rr-icon-btn:hover { color: var(--rr-text-strong); text-decoration: none; }

/* ---- Skip link ---------------------------------------------------- */

/* Off screen until focused, the only time it's useful and the only
   time it must be impossible to miss. */
.rr-skip {
    position: fixed;
    top: 8px;
    left: 8px;
    z-index: 3000;
    padding: 10px 16px;
    background: var(--rr-accent);
    color: var(--rr-accent-text);
    border-radius: var(--rr-radius);
    font: 600 var(--rr-fs-sm) / 1 var(--rr-font);
    box-shadow: var(--rr-shadow-pop);
    transform: translateY(-200%);
    transition: transform var(--rr-speed) ease;
}
/* html[data-rr] a (0,1,1) beat .rr-skip (0,1,0), so the one control
   whose whole job is to be unmissable was drawing link-red on the
   accent at 1.2:1 — invisible since it's only ever seen while focused. */
html[data-rr] a.rr-skip { color: var(--rr-accent-text); }
.rr-skip:focus {
    transform: none;
    color: var(--rr-accent-text);
    text-decoration: none;
}
/* The skip target must not keep a ring once jumped to. */
html[data-rr] #wrapcentre:focus { outline: none; }

/* Left visible rather than hidden so a control the icon pass missed
   still shows; this only stops an oversized one stretching its row. */
html[data-rr] img.rr-legacy-img { max-width: 100%; height: auto; vertical-align: middle; }

/* ---- Top navigation --------------------------------------------- */

.rr-nav {
    position: sticky;
    top: 0;
    z-index: 900;
    /* border-box: --rr-nav-h sizes a sticky heading's offset and
       scroll-padding-top, so this must be the whole bar or that math
       is a pixel off. */
    box-sizing: border-box;
    height: var(--rr-nav-h);
    padding: 0 var(--rr-s4);
    background: color-mix(in srgb, var(--rr-bg) 88%, transparent);
    backdrop-filter: blur(10px) saturate(140%);
    border-bottom: 1px solid var(--rr-line);
}
/* Bar is full-bleed; content inside follows the content column —
   without this the brand sat at x=16 and the icons hugged the screen
   edge on a 2560px monitor, a 500px zig-zag against the bar below. */
.rr-nav__inner {
    display: flex;
    align-items: center;
    gap: var(--rr-s3);
    height: 100%;
    width: 100%;
    max-width: var(--rr-content-max);
    margin: 0 auto;
    min-width: 0;
}
/* Box is taller than the 15px wordmark on purpose (a 15px link is hard
   to hit); hairline is drawn, not bordered, so growing the target
   doesn't grow the rule. 18px matches .rr-nav__divide. */
.rr-nav__brand {
    position: relative;
    display: flex;
    align-items: center;
    flex: none;
    height: 34px;
    padding-right: var(--rr-s3);
    line-height: 1;
}
.rr-nav__brand::after {
    content: "";
    position: absolute;
    top: 50%;
    right: 0;
    width: 1px;
    height: 18px;
    margin-top: -9px;
    background: var(--rr-line);
}
/* html[data-rr] a outranks a bare class and painted the name in the
   board's link red. */
html[data-rr] a.rr-nav__brand { color: var(--rr-text); }
html[data-rr] a.rr-nav__brand:hover { text-decoration: none; color: var(--rr-text-strong); }

/* Inline <svg> (navbar.js) filled with currentColor — height is the
   only number to set; viewBox gives the width. */
.rr-nav__logo {
    display: block;
    height: 15px;
    width: auto;
}

/* ---- Board links -------------------------------------------------- */

/* The row the masthead used to carry: slim and above the content
   rather than inside it. */
.rr-boardbar {
    display: flex;
    align-items: center;
    gap: var(--rr-s2) var(--rr-s3);
    flex-wrap: wrap;
    margin: 0 0 var(--rr-s4);
    padding: 0 0 var(--rr-s3);
    border-bottom: 1px solid var(--rr-line);
    font-size: var(--rr-fs-sm);
}
.rr-boardbar__main,
.rr-boardbar__end {
    display: flex;
    align-items: center;
    gap: var(--rr-s2);
    flex-wrap: wrap;
    min-width: 0;
}
/* basis stays auto, not 0 — on the index the bar shares its row with a
   380px masthead; asking for nothing left the left half 190px wide
   with each group stacked one link per line. Asking for what it
   wants, it takes the line when the two won't share one. */
.rr-boardbar__main { flex: 1 1 auto; }
.rr-boardbar__end { flex: 0 0 auto; margin-left: auto; }

/* Each group is one light box (hairline round it, hairline between
   links) so the row reads as three things without headings; nothing
   in it is louder than anything else, donation link included. */
.rr-boardbar__group {
    display: inline-flex;
    align-items: stretch;
    /* Wraps rather than overflows — signed in, the five view links ran
       off a 1100px window's edge, "View your posts" half off screen. */
    flex-wrap: wrap;
    min-width: 0;
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius);
    background: color-mix(in srgb, var(--rr-surface) 70%, transparent);
}
/* Keyed on the link's own class rather than \`> :first-child\`, for the
   reason at .rr-cluster below: a universal rightmost part is tested
   against every element on the page. */
.rr-boardbar__link + .rr-boardbar__link { border-left: 1px solid var(--rr-line); }
.rr-boardbar__link:first-child { border-radius: calc(var(--rr-radius) - 1px) 0 0 calc(var(--rr-radius) - 1px); }
.rr-boardbar__link:last-child { border-radius: 0 calc(var(--rr-radius) - 1px) calc(var(--rr-radius) - 1px) 0; }
.rr-boardbar__link:only-child { border-radius: calc(var(--rr-radius) - 1px); }
/* html[data-rr] a (0,1,1) beats a bare class — eleven quiet chips were
   coming out in link red on the very page where this row is the header. */
html[data-rr] a.rr-boardbar__link {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    color: var(--rr-muted);
    font-weight: 500;
    white-space: nowrap;
    transition: background var(--rr-speed) ease, color var(--rr-speed) ease;
}
html[data-rr] a.rr-boardbar__link:hover { color: var(--rr-text-strong); background: var(--rr-surface-2); text-decoration: none; }
html[data-rr] a.rr-boardbar__link:visited { color: var(--rr-muted); }
/* Search and the settings panel, where there's no top bar to hold
   them — hairlined off the board's own links, the same distinction
   the bar draws at its own right end. */
.rr-headertools {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding-left: var(--rr-s2);
    border-left: 1px solid var(--rr-line);
}

.rr-boardbar__flag {
    display: block;
    width: 16px;
    height: auto;
    border-radius: 2px;
    opacity: .75;
    transition: opacity var(--rr-speed) ease;
}
.rr-boardbar__link:hover .rr-boardbar__flag { opacity: 1; }

/* ---- The language switch ------------------------------------------ */

/* Two flags with no words or current state, given the settings
   panel's segmented-control shape for a two-way choice. */
.rr-langswitch {
    display: inline-flex;
    padding: 2px;
    gap: 2px;
    background: var(--rr-surface-2);
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius);
}
html[data-rr] a.rr-langswitch__option {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 8px;
    border-radius: 4px;
    color: var(--rr-muted);
    font: 600 var(--rr-fs-xs) / 1.5 var(--rr-font);
    letter-spacing: .03em;
}
html[data-rr] a.rr-langswitch__option:hover {
    color: var(--rr-text-strong);
    background: var(--rr-surface-3);
    text-decoration: none;
}
html[data-rr] a.rr-langswitch__option[aria-current] {
    background: var(--rr-surface-3);
    color: var(--rr-text-strong);
}
html[data-rr] a.rr-langswitch__option[aria-current] .rr-boardbar__flag { opacity: 1; }
.rr-langswitch__option .rr-boardbar__flag { opacity: .6; }
.rr-langswitch__option:hover .rr-boardbar__flag { opacity: 1; }

/* The fold. Hidden entirely where the row fits on one line. */
.rr-boardbar__more { display: none; }

@media (max-width: 720px) {
    .rr-boardbar { gap: var(--rr-s2); padding-bottom: var(--rr-s2); }
    .rr-boardbar__more {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-left: auto;
        padding: 2px 8px;
        background: var(--rr-surface-2);
        color: var(--rr-muted);
        border: 1px solid var(--rr-line);
        border-radius: var(--rr-radius);
        font: 600 var(--rr-fs-sm) / 1.6 var(--rr-font);
        cursor: pointer;
    }
    .rr-boardbar__more[aria-expanded="true"] svg { transform: rotate(180deg); }

    /* "Unanswered posts" and "Active topics" stay — what every guide
       to this board says to bookmark. Signed in, three more views
       (unread, new, yours) fold like everything else; the board
       identity and language switch wait behind More too. */
    .rr-boardbar:not([data-rr-open]) .rr-boardbar__main > :not([data-rr-group="views"]),
    .rr-boardbar:not([data-rr-open]) [data-rr-group="views"] > :nth-child(n+3),
    .rr-boardbar:not([data-rr-open]) .rr-boardbar__end:not(:has(> .rr-headertools)) { display: none; }
    /* Except this script's own two — on a page with no top bar this
       row is the only place search and settings live, and folding
       them away put the panel two taps deep on a phone. */
    .rr-boardbar:not([data-rr-open]) .rr-boardbar__end > :not(.rr-headertools) { display: none; }
    .rr-boardbar__main, .rr-boardbar__end { gap: var(--rr-s2) var(--rr-s3); }

    /* Left to wrap rather than forced full-width — full-width pushed
       More onto a line of its own, alone at the far right and a full
       row below the fold it controls. */
    .rr-boardbar[data-rr-open] { flex-wrap: wrap; position: relative; }
    /* Signed in there's no language switch to share a line with, so
       More still fell to its own line a bar's height below the fold —
       pinned to the corner instead, where the thumb found it folded. */
    .rr-boardbar[data-rr-open] .rr-boardbar__more { position: absolute; top: 2px; right: 4px; margin-left: 0; }
    .rr-boardbar[data-rr-open] .rr-boardbar__main > [data-rr-group="views"] { padding-right: 78px; }
}

/* ---- Restored board controls -------------------------------------- */

/* The board drew this as a bare GIF inside a link; the image is
   hidden and this label takes its place. */
html[data-rr] a.rr-ctl {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius);
    background: var(--rr-surface-2);
    color: var(--rr-muted);
    font-size: var(--rr-fs-xs);
    font-weight: 600;
    line-height: 1.4;
    white-space: nowrap;
    vertical-align: middle;
}
html[data-rr] a.rr-ctl:hover {
    background: var(--rr-surface-3);
    border-color: var(--rr-line-strong);
    color: var(--rr-text-strong);
    text-decoration: none;
}
.rr-nav__crumbs {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    flex: 1;
    font-size: var(--rr-fs-sm);
    color: var(--rr-muted);
    overflow: hidden;
}
.rr-nav__crumbs a { color: var(--rr-muted); white-space: nowrap; }
.rr-nav__crumbs a:last-child { color: var(--rr-text); font-weight: 600; overflow: hidden; text-overflow: ellipsis; }
.rr-nav__sep { color: var(--rr-faint); }
.rr-nav__actions { display: flex; align-items: center; gap: 2px; flex: none; }

/* One search shape, shared by the palette trigger and the board's own
   forms in the topic bar and listing toolbar — it read as a label
   pill before; this is a control. */
.rr-nav__search,
.rr-search {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    min-width: 190px;
    padding: 0 4px 0 10px;
    background: var(--rr-bg-sunken);
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius);
    color: var(--rr-faint);
    font-size: var(--rr-fs-sm);
    cursor: pointer;
    transition: border-color var(--rr-speed) ease;
    box-sizing: border-box;
}
.rr-nav__search { padding-right: 10px; }
.rr-nav__search:hover,
.rr-search:hover { border-color: var(--rr-line-strong); color: var(--rr-muted); }
.rr-nav__search svg,
.rr-search svg { width: 14px; height: 14px; flex: none; }
.rr-nav__kbd { margin-left: auto; }

/* The board's form inside that frame: the input drops its own border
   and background (the frame is the border now), and the submit
   becomes a trailing affordance, like the Ctrl K chip in the palette
   trigger. */
.rr-search:focus-within { border-color: var(--rr-accent); }
.rr-search__form { display: flex; align-items: center; gap: 4px; flex: 1; min-width: 0; }
/* Matched by element (input.rr-search__input), not the bare class —
   the board's own field reset also matches via \`input[type="text"]\`,
   one level more specific than a class, so it won the tie and the
   input never shrank to the pill's 26px until matched the same way. */
html[data-rr] input.rr-search__input {
    flex: 1;
    min-width: 0;
    height: 26px;
    padding: 0;
    background: none;
    border: 0;
    border-radius: 0;
    color: var(--rr-text);
    font-size: var(--rr-fs-sm);
    box-sizing: border-box;
}
html[data-rr] input.rr-search__input:focus-visible { outline: none; }
/* Submit sits inside the frame as plain text now, not a boxed button
   inside a boxed field. Matched by element (input.rr-search__go) for
   the same specificity reason as the input above — the board's
   input.button1 rule otherwise wins. */
html[data-rr] input.rr-search__go {
    flex: none;
    height: 24px;
    padding: 0 8px;
    background: transparent;
    border: 0;
    border-radius: 4px;
    color: var(--rr-muted);
    font: 600 var(--rr-fs-xs) / 1 var(--rr-font);
    cursor: pointer;
    box-sizing: border-box;
    transition: background var(--rr-speed) ease, color var(--rr-speed) ease;
}
html[data-rr] input.rr-search__go:hover {
    background: var(--rr-surface-3);
    border: 0;
    color: var(--rr-text-strong);
}

/* ---- Where the search looks ---------------------------------------- */

/* One control at the end of the field opens the two choices the
   board's own box never offered: this forum or the whole board,
   titles or every post (navbar.js, addSearchOptions). Accented while
   set away from the default so it reads from across the bar. */
.rr-search { position: relative; }
/* Trigger carries the target room's name, sized to it and no wider —
   a bare glyph said options existed but not what they were set to. */
html[data-rr] button.rr-search__opts {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    flex: none;
    min-width: 24px;
    max-width: 148px;
    height: 24px;
    padding: 0 6px 0 4px;
    background: transparent;
    border: 0;
    border-radius: 4px;
    color: var(--rr-faint);
    cursor: pointer;
    transition: background var(--rr-speed) ease, color var(--rr-speed) ease;
}
html[data-rr] button.rr-search__opts:hover,
html[data-rr] button.rr-search__opts[aria-expanded="true"] { background: var(--rr-surface-3); color: var(--rr-text-strong); }
/* The trigger's own hover tooltip sits right where the popover's first
   row lands, covering the answer with a repeat of the question — it
   stands down once the popover is open. */
html[data-rr] button.rr-search__opts[aria-expanded="true"]::after { display: none; }
html[data-rr] button.rr-search__opts[data-rr-active] { color: var(--rr-accent); }
html[data-rr] button.rr-search__opts svg { width: 13px; height: 13px; flex: none; }
.rr-search__where {
    overflow: hidden;
    font: 600 var(--rr-fs-xs) / 1 var(--rr-font);
    text-overflow: ellipsis;
    white-space: nowrap;
}
.rr-search__where:empty { display: none; }
/* Hidden while the field's own placeholder already names the room
   ("Search Main Forum"); appears once a query is in the way of it. */
html[data-rr] .rr-search[data-rr-echo] input.rr-search__input:placeholder-shown ~ .rr-search__opts .rr-search__where {
    display: none;
}
.rr-search__pop {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 950;
    min-width: 300px;
    max-width: min(360px, 90vw);
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: var(--rr-s2);
    background: var(--rr-surface);
    border: 1px solid var(--rr-line-strong);
    border-radius: var(--rr-radius);
    box-shadow: var(--rr-shadow-pop);
    cursor: default;
    color: var(--rr-text);
}
.rr-search__pop[hidden] { display: none; }
/* Rooms are named in full now ("Temporarily Restricted Topics"), so
   the row wraps rather than pushing the popover off screen. */
.rr-search__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--rr-s2) var(--rr-s3);
}
.rr-search__row .rr-seg { flex-wrap: wrap; }
.rr-search__row[hidden] { display: none; }
.rr-search__rowlabel {
    font: 600 var(--rr-fs-xs) / 1 var(--rr-font);
    color: var(--rr-faint);
    white-space: nowrap;
}

.rr-kbd {
    font: 600 11px/1 var(--rr-font-mono);
    color: var(--rr-faint);
    background: var(--rr-surface-2);
    border: 1px solid var(--rr-line);
    border-radius: 4px;
    padding: 3px 5px;
    white-space: nowrap;
}

.rr-badge {
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: var(--rr-radius-pill);
    background: var(--rr-danger);
    color: #fff;
    font: 700 10px/16px var(--rr-font);
    text-align: center;
    position: absolute;
    top: 1px;
    right: 0;
}
.rr-nav__actions > * { position: relative; }

/* The line between the board's controls and this script's. */
.rr-nav__divide {
    width: 1px;
    height: 18px;
    margin: 0 5px;
    background: var(--rr-line-strong);
    flex: none;
}

/* ---- Tooltips ----------------------------------------------------- */

/* Draws the control's name (from title/aria-label) right away on
   hover or keyboard focus, instead of waiting on the browser's own
   delayed tooltip. Pointer events off so the label never sits between
   the cursor and the button it describes. */
html[data-rr] [data-rr-tip] { position: relative; }
html[data-rr] [data-rr-tip]::after {
    content: attr(data-rr-tip);
    position: absolute;
    top: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 960;
    padding: 4px 8px;
    background: var(--rr-surface-3);
    border: 1px solid var(--rr-line-strong);
    border-radius: var(--rr-radius);
    box-shadow: var(--rr-shadow-pop);
    color: var(--rr-text-strong);
    font: 600 var(--rr-fs-xs) / 1.4 var(--rr-font);
    white-space: nowrap;
    pointer-events: none;
    /* display, not visibility — a hidden-but-laid-out label on a
       control at the window's right edge was 41px of horizontal
       overflow on every page. */
    display: none;
}
html[data-rr] [data-rr-tip]:hover::after,
html[data-rr] [data-rr-tip]:focus-visible::after,
/* A tip on a wrapper rather than the control itself (the writing
   toolbar: an input draws no pseudo-element) answers to the control's
   focus since the wrapper never takes any. Scoped to its own children
   so it costs nothing on the rest of the page. */
html[data-rr] [data-rr-tip]:has(> :focus-visible)::after { display: block; }
/* A control that opened something already says what it did — the
   label would land on top of it. */
html[data-rr] [data-rr-tip][aria-expanded="true"]::after { display: none; }
/* Near the right edge the label would still push the page sideways
   while shown, so it hangs off its own right edge — the top bar's
   last control and the jump-buttons corner both sit against the window. */
html[data-rr] [data-rr-tip][data-rr-tip-side="right"]::after,
html[data-rr] .rr-nav__actions > :last-child[data-rr-tip]::after { left: auto; right: 0; transform: none; }
html[data-rr] [data-rr-tip][data-rr-tip-side="above"]::after,
html[data-rr] [data-rr-tip][data-rr-tip-side="above-left"]::after,
html[data-rr] [data-rr-tip][data-rr-tip-side="above-right"]::after { top: auto; bottom: calc(100% + 6px); }
/* A wrapping button bar means which edge a button sits at is only
   known once hovered; compose.js measures then and picks one of these. */
html[data-rr] [data-rr-tip][data-rr-tip-side="above-left"]::after { left: 0; right: auto; transform: none; }
html[data-rr] [data-rr-tip][data-rr-tip-side="above-right"]::after { left: auto; right: 0; transform: none; }

/* ---- Reading progress ------------------------------------------- */

/* On the sticky bar's bottom edge, not floating top-left. --rr-nav-h
   (set by theme.js) keeps it in place if the bar is switched off. */
.rr-progress {
    position: fixed;
    top: calc(var(--rr-nav-h, 48px) - 2px);
    left: 0;
    height: 2px;
    width: 0;
    background: var(--rr-accent);
    z-index: 950;
    transition: width 80ms linear, opacity var(--rr-speed) ease;
}
/* Nothing to report yet: top of the page, or nothing below the fold. */
.rr-progress[data-rr-idle] { opacity: 0; }

/* ---- Topic prefix tags ------------------------------------------ */

.rr-tag {
    display: inline-flex;
    align-items: center;
    /* An inline-flex box sits on the line box's bottom margin edge by
       default, so in a heading two sizes larger than the tag, the
       badge hung below the words it labels — centred instead. */
    vertical-align: middle;
    height: 18px;
    padding: 0 7px;
    margin-right: 7px;
    border-radius: var(--rr-radius-pill);
    font: 600 var(--rr-fs-xs) / 1 var(--rr-font);
    letter-spacing: .01em;
    vertical-align: 1px;
    color: var(--rr-tag-neutral);
    background: color-mix(in srgb, var(--rr-tag-neutral) 15%, transparent);
    border: 1px solid color-mix(in srgb, var(--rr-tag-neutral) 32%, transparent);
    cursor: pointer;
    flex: none;
}
/* Same badge as a label on a listing too short to filter — it names
   the topic kind and must answer no click. */
span.rr-tag { cursor: default; }

/* Tag hues are the board's own taxonomy (two are the board's own red)
   and land under 4.5:1 at 12px on a 15% tint. Rather than move the
   palette, the ink alone is nudged toward the theme's extreme —
   lighter on dark, darker on light — from one rule that never needs
   to know which. Tint and border stay on the pure token. */
.rr-tag[data-tag] {
    color: color-mix(in srgb, var(--rr-tag-ink) 84%, var(--rr-text-strong));
    background: color-mix(in srgb, var(--rr-tag-ink) 15%, transparent);
    border-color: color-mix(in srgb, var(--rr-tag-ink) 32%, transparent);
}
/* Declared on the attribute, not on .rr-tag — the filter's own trigger
   wears a prefix's ink without being a tag; only the pair of rules
   above ever paints a chip. */
[data-tag="info"]      { --rr-tag-ink: var(--rr-tag-info); }
[data-tag="release"]   { --rr-tag-ink: var(--rr-tag-release); }
[data-tag="problem"]   { --rr-tag-ink: var(--rr-tag-problem); }
[data-tag="important"] { --rr-tag-ink: var(--rr-tag-important); }
[data-tag="tutorial"]  { --rr-tag-ink: var(--rr-tag-tutorial); }
[data-tag="request"]   { --rr-tag-ink: var(--rr-tag-request); }
[data-tag="scs"]       { --rr-tag-ink: var(--rr-tag-scs); }

/* ---- Toolbar above topic lists ---------------------------------- */

.rr-toolbar {
    display: flex;
    align-items: center;
    gap: var(--rr-s3);
    flex-wrap: wrap;
    margin: 0 0 var(--rr-s3);
    padding: var(--rr-card-pad);
    background: var(--rr-surface);
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius-lg);
}
.rr-toolbar__filter {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1 1 220px;
    min-width: 180px;
    height: 34px;
    padding: 0 4px 0 12px;
    background: var(--rr-bg-sunken);
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius);
}
.rr-toolbar__filter svg { width: 14px; height: 14px; color: var(--rr-faint); flex: none; }
.rr-toolbar__filter input {
    flex: 1;
    background: none;
    border: 0;
    outline: none;
    color: var(--rr-text);
    font: var(--rr-fs-sm) / 1.2 var(--rr-font);
    min-width: 0;
    padding: 0;
}
.rr-toolbar__count { color: var(--rr-faint); font-size: var(--rr-fs-xs); margin-left: auto; white-space: nowrap; }

/* The board's own search sits in the same bar as the page filter, so a
   rule keeps "narrow what's here" from reading as one control with
   "search the whole board". */
.rr-toolbar__board {
    display: flex;
    align-items: center;
    padding-left: var(--rr-s3);
    border-left: 1px solid var(--rr-line);
}
.rr-toolbar__board .rr-search { min-width: 200px; }
.rr-toolbar__quick { display: flex; gap: 4px; flex-wrap: wrap; flex: none; }
.rr-toolbar__quick .rr-tag { margin: 0; opacity: .55; }
.rr-toolbar__quick .rr-tag[aria-pressed="true"] { opacity: 1; }

/* Prefixes sit behind one trigger at the filter box's end — the
   hairline is separation enough since it belongs to the control it
   narrows, not a control of its own. */
.rr-toolbar__tagbtn {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: none;
    height: 26px;
    padding: 0 6px 0 10px;
    background: none;
    border: 0;
    border-left: 1px solid var(--rr-line);
    border-radius: 0;
    color: var(--rr-faint);
    font: 500 var(--rr-fs-xs) / 1 var(--rr-font);
    cursor: pointer;
}
.rr-toolbar__tagbtn:hover { color: var(--rr-text); }
.rr-toolbar__tagbtn svg { width: 12px; height: 12px; flex: none; opacity: .7; }
.rr-toolbar__tagbtn[data-rr-active] {
    color: color-mix(in srgb, var(--rr-tag-ink, var(--rr-text)) 84%, var(--rr-text-strong));
}
.rr-toolbar__tagbtn[aria-expanded="true"] { color: var(--rr-text); }

.rr-toolbar__tagpop {
    position: absolute;
    z-index: 950;
    top: calc(100% + 6px);
    right: -1px;
    max-width: min(320px, 80vw);
    padding: 10px;
    background: var(--rr-surface-2);
    border: 1px solid var(--rr-line-strong);
    border-radius: var(--rr-radius);
    box-shadow: var(--rr-shadow-pop);
}
.rr-toolbar__tagpop[hidden] { display: none; }
.rr-toolbar__tags { display: flex; gap: 4px; flex-wrap: wrap; }
.rr-toolbar__tags .rr-tag { margin: 0; opacity: .62; }
.rr-toolbar__tags .rr-tag:hover,
.rr-toolbar__tags .rr-tag[aria-pressed="true"] { opacity: 1; }

tr[data-rr-hidden] { display: none; }

/* ---- Quick reply -------------------------------------------------- */

.rr-reply {
    margin: var(--rr-post-gap) 0 var(--rr-s3);
    padding: var(--rr-card-pad);
    background: var(--rr-surface);
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius-lg);
}
.rr-reply__form { display: flex; flex-direction: column; gap: var(--rr-s3); }
.rr-reply__text {
    width: 100%;
    min-height: 130px;
    resize: vertical;
    background: var(--rr-bg-sunken);
    border: 1px solid var(--rr-line-strong);
    border-radius: var(--rr-radius);
    color: var(--rr-text);
    padding: var(--rr-s3);
    font: var(--rr-fs) / var(--rr-lh) var(--rr-font);
    box-sizing: border-box;
}
/* The board's field rules no longer reach this script's own controls
   (forum.css), so an accent focus border is declared here directly. */
html[data-rr] textarea.rr-reply__text:focus { border-color: var(--rr-accent); outline: none; }
.rr-reply__actions { display: flex; gap: var(--rr-s2); align-items: center; }

.rr-quote-bubble {
    position: absolute;
    z-index: 1500;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    background: var(--rr-surface-3);
    color: var(--rr-text-strong);
    border: 1px solid var(--rr-line-strong);
    border-radius: var(--rr-radius-pill);
    box-shadow: var(--rr-shadow-pop);
    font: 600 var(--rr-fs-xs) / 1 var(--rr-font);
    cursor: pointer;
}
.rr-quote-bubble:hover { background: var(--rr-accent); color: var(--rr-accent-text); border-color: var(--rr-accent); }

/* ---- Who is online ------------------------------------------------ */

.rr-online {
    display: flex;
    align-items: center;
    gap: var(--rr-s3);
    flex-wrap: wrap;
}
.rr-online__summary {
    font-size: var(--rr-fs-sm);
    color: var(--rr-text);
    font-variant-numeric: tabular-nums;
}


/* ---- Topic action bar -------------------------------------------- */

.rr-topicbar {
    display: flex;
    align-items: center;
    gap: var(--rr-s2) var(--rr-s3);
    flex-wrap: wrap;
    margin: 0 0 var(--rr-s4);
    padding: var(--rr-card-pad);
    background: var(--rr-surface);
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius-lg);
}
/* Filter nested as the bar's second row: one card with a rule across
   it, not two cards with a gap. Its own padding and a negative margin
   cancel out at the seam, so both have to move together or the two
   rows sit at different insets. */
.rr-topicbar > .rr-toolbar {
    flex-basis: 100%;
    margin: var(--rr-card-pad) calc(-1 * var(--rr-card-pad)) calc(-1 * var(--rr-card-pad));
    padding: var(--rr-card-pad);
    background: transparent;
    border: 0;
    border-top: 1px solid var(--rr-line);
    border-radius: 0 0 calc(var(--rr-radius-lg) - 1px) calc(var(--rr-radius-lg) - 1px);
}

.rr-topicbar__title {
    margin: 0 var(--rr-s2) 0 0 !important;
    font-size: var(--rr-fs-lg) !important;
    line-height: 1.25;
    flex: none;
    max-width: 40%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Two rows, always: this topic, then everywhere else — a hairline
   between them says so without a heading. */
.rr-topicbar[data-rr-rows] { display: block; padding: 0; }
.rr-topicbar__row {
    display: flex;
    align-items: center;
    gap: var(--rr-s2) var(--rr-s3);
    flex-wrap: wrap;
    padding: var(--rr-card-pad);
}
.rr-topicbar__row + .rr-topicbar__row {
    border-top: 1px solid var(--rr-line);
    /* Where you go next, not what you do here: quieter, and shorter. */
    padding-top: var(--rr-s2);
    padding-bottom: var(--rr-s2);
}
.rr-topicbar[data-rr-rows] > .rr-toolbar { margin-top: 0; }

.rr-topicbar__spacer { flex: 1; min-width: var(--rr-s3); }
.rr-topicbar__count { color: var(--rr-muted); font-size: var(--rr-fs-sm); }
.rr-topicbar__search .rr-search { min-width: 210px; }
.rr-topicbar .rr-pager { margin: 0; }

/* Subscribing, bookmarking, marking read — acting on the forum or
   topic, not on what's in it — sit once at the bar's far end, as
   quiet as the topic page gives leaving a topic. html[data-rr] a.nav
   colours these accent by default (they arrive as the board's nav
   links) and outranks the quiet variant by a whole class, hence the
   long selector. */
html[data-rr] a.rr-forumnav {
    color: var(--rr-muted);
    font-weight: 500;
    font-size: var(--rr-fs-xs);
}
html[data-rr] a.rr-forumnav:hover { color: var(--rr-text); text-decoration: none; }

/* Leaving this topic is quieter than acting on it. */
.rr-topicbar__row[data-rr-row="away"] .rr-btn {
    font-weight: 500;
    font-size: var(--rr-fs-xs);
    padding: 4px 8px;
}
.rr-topicbar__row[data-rr-row="away"] .rr-search { height: 28px; }

/* ---- Pager ------------------------------------------------------- */

/* One boxed control, hairlined between the steps and the page box —
   most of what keeps "Next" from reading as "Next topic" on the row
   below. Arrows alone; names shown on hover (tooltips, below). */
.rr-pager { margin: 0; }
.rr-pager__where {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 10px;
}
.rr-pager__label { color: var(--rr-faint); font-size: var(--rr-fs-sm); white-space: nowrap; }
html[data-rr] a.rr-pager__step {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0 9px;
    color: var(--rr-muted);
    font: 600 var(--rr-fs-xs) / 1 var(--rr-font);
    white-space: nowrap;
    transition: background var(--rr-speed) ease, color var(--rr-speed) ease;
}
html[data-rr] a.rr-pager__step:hover { background: var(--rr-surface-2); color: var(--rr-text-strong); text-decoration: none; }
html[data-rr] a.rr-pager__step svg { width: 13px; height: 13px; flex: none; }
.rr-pager__input {
    width: 52px;
    height: 24px;
    padding: 0 6px;
    background: var(--rr-bg-sunken);
    border: 1px solid var(--rr-line);
    border-radius: 4px;
    color: var(--rr-text);
    font: var(--rr-fs-sm) / 1 var(--rr-font-mono);
    text-align: center;
}
html[data-rr] input.rr-pager__input:focus { border-color: var(--rr-accent); outline: none; }
.rr-pager [hidden] { display: none; }

/* ---- A cluster of controls ------------------------------------------ */

/* Several small controls that belong together, drawn as one light box
   with a hairline between them: the pager, the topic bar's "Previous
   topic / Next topic / Print view" and its "Subscribe / Bookmark /
   E-mail friend" — one box, not six loose buttons. No overflow clip:
   tooltips on the controls inside draw outside it. */
.rr-cluster {
    display: inline-flex;
    align-items: stretch;
    min-height: 30px;
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius);
    background: color-mix(in srgb, var(--rr-surface) 70%, transparent);
    box-sizing: border-box;
}
.rr-cluster__item { border-radius: 0; }
.rr-cluster__item + .rr-cluster__item { border-left: 1px solid var(--rr-line); }
.rr-cluster__item:first-child { border-radius: calc(var(--rr-radius) - 1px) 0 0 calc(var(--rr-radius) - 1px); }
.rr-cluster__item:last-child { border-radius: 0 calc(var(--rr-radius) - 1px) calc(var(--rr-radius) - 1px) 0; }
.rr-cluster__item:only-child { border-radius: calc(var(--rr-radius) - 1px); }
/* Every child carries .rr-cluster__item (topic.js, sealCluster) rather
   than using \`.rr-cluster > * + *\` — that selector's rightmost part is
   universal, tested against every element on the page. Six such rules
   cost a listing 30ms of style recalculation, measured; keyed on a
   class, they cost nothing. */
html[data-rr] .rr-cluster__item.rr-btn,
html[data-rr] a.rr-cluster__item.rr-btn {
    border-top: 0;
    border-right: 0;
    border-bottom: 0;
    background: transparent;
    color: var(--rr-muted);
    padding: 5px 10px;
}
html[data-rr] .rr-cluster__item.rr-btn:hover,
html[data-rr] a.rr-cluster__item.rr-btn:hover { background: var(--rr-surface-2); color: var(--rr-text-strong); }
html[data-rr] .rr-cluster__item.rr-btn:first-child { border-left: 0; }
.rr-topicbar__row[data-rr-row="away"] .rr-cluster { min-height: 28px; }

/* ---- Folds ------------------------------------------------------------ */

/* Every control that opens or closes something turns its chevron the
   same way: the original post, the Steam description, Who is online,
   the Releases panel, a listing's sections. */
html[data-rr] .rr-fold > svg,
html[data-rr] .rr-releases__toggle > svg:first-child,
html[data-rr] td.cat.rr-section > svg { transition: transform var(--rr-speed) ease; }
html[data-rr] .rr-fold[data-rr-open] > svg { transform: rotate(180deg); }

/* A forum listing's own section rows (one spanning td.row3 with a bold
   word, lists.js sectionOf) drawn as the section heads they are — the
   same tint and mark as a td.cat, at the same size. */
html[data-rr] td.row3[data-rr-section] {
    position: relative;
    padding: var(--rr-s2) var(--rr-s3) var(--rr-s2) 20px;
    color: var(--rr-text-strong);
    font-size: var(--rr-fs-sm);
    font-weight: 650;
    line-height: var(--rr-lh);
}
html[data-rr] td.row3[data-rr-section] > b,
html[data-rr] td.row3[data-rr-section] > span > b { color: inherit; font-weight: inherit; font-size: inherit; }
html[data-rr] td.row3[data-rr-section]::before {
    content: "";
    position: absolute;
    left: 9px;
    top: 50%;
    width: 3px;
    height: 14px;
    margin-top: -7px;
    border-radius: 2px;
    background: var(--rr-accent);
}

/* A listing's section head folds its run on click (lists.js,
   initSectionFolds). Chevron points down at an open run, right at a
   folded one; the count says what's behind it. */
html[data-rr] td.rr-section { cursor: pointer; user-select: none; transition: background var(--rr-speed) ease; }
html[data-rr] tr[data-rr-cat-row] > td.rr-section:hover { background: color-mix(in srgb, var(--rr-accent) 10%, var(--rr-surface-2)); }
html[data-rr] td.rr-section:focus-visible { outline: 2px solid var(--rr-accent); outline-offset: -2px; }
html[data-rr] td.rr-section > svg { width: 13px; height: 13px; margin-right: 6px; vertical-align: -2px; color: var(--rr-faint); transition: transform var(--rr-speed) ease; }
html[data-rr] td.rr-section > h4 { display: inline; }
html[data-rr] td.rr-section > .rr-section__count {
    margin-left: 10px;
    font: 500 var(--rr-fs-xs) / 1 var(--rr-font);
    color: var(--rr-muted);
}
html[data-rr] tr[data-rr-folded] > td.rr-section > svg { transform: rotate(-90deg); }
html[data-rr] tr[data-rr-section-folded] { display: none; }

/* ---- The control panel's menu ----------------------------------------- */

/* Each section of the control panel is a row that opens: closed rows
   end in a chevron, the open one turns it down with its pages stepped
   in under it (lists.js, decorateNavLists). */
html[data-rr] td[data-rr-navitem="closed"] { padding: 0; }
html[data-rr] td[data-rr-navitem="closed"] > a.nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--rr-s2);
    padding: 10px var(--rr-s3);
    color: var(--rr-text);
    font-weight: 600;
    transition: background var(--rr-speed) ease, color var(--rr-speed) ease;
}
html[data-rr] td[data-rr-navitem="closed"] > a.nav:hover {
    background: var(--rr-surface-2);
    color: var(--rr-text-strong);
    text-decoration: none;
}
html[data-rr] td[data-rr-navitem="closed"] > a.nav > svg { width: 13px; height: 13px; flex: none; color: var(--rr-faint); }
html[data-rr] td[data-rr-navitem="closed"] > a.nav:hover > svg { color: var(--rr-accent); }
html[data-rr] td[data-rr-navitem="open"] > b.nav {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--rr-text-strong);
    font-weight: 650;
}
html[data-rr] td[data-rr-navitem="open"] > b.nav > svg { width: 13px; height: 13px; flex: none; color: var(--rr-accent); }
html[data-rr] td[data-rr-navitem="open"] ul.nav {
    list-style: none;
    margin: 6px 0 2px 6px !important;
    padding: 0 0 0 12px !important;
    border-left: 2px solid var(--rr-line);
}
html[data-rr] td[data-rr-navitem="open"] ul.nav li { padding: 3px 0; font-size: var(--rr-fs-sm); }

/* ---- Game card --------------------------------------------------- */

/* A section at the head of the first post, not a card inside a card:
   the art and the details, a hairline, then the post. */
.rr-game {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: var(--rr-s5);
    margin: 0 0 var(--rr-s5);
    padding: 0 0 var(--rr-s5);
    border-bottom: 1px solid var(--rr-line);
}
.rr-game__art { width: 100%; border-radius: var(--rr-radius); display: block; }
.rr-game__body { min-width: 0; }
.rr-game__title {
    margin: 0 0 var(--rr-s1);
    font: 650 var(--rr-fs-lg) / 1.2 var(--rr-font);
    color: var(--rr-text-strong);
    letter-spacing: -.01em;
}
.rr-game__meta {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    gap: 6px var(--rr-s4);
    margin: var(--rr-s4) 0 0;
    font-size: var(--rr-fs-sm);
    /* Short values (a developer, a date) sat with a metre of nothing
       beside them on a wide card — capped to what a long line needs. */
    max-width: 72ch;
}
.rr-game__meta dt { color: var(--rr-faint); white-space: nowrap; }
.rr-game__meta dd { margin: 0; color: var(--rr-text); }
.rr-game__appid {
    font-family: var(--rr-font-mono);
    font-size: var(--rr-fs-sm);
    color: var(--rr-muted);
}
.rr-game__links { display: flex; flex-wrap: wrap; gap: 6px; margin-top: var(--rr-s3); }

/* ---- Post chrome ------------------------------------------------- */

/* The author band was a line of text with a rule under it, at the
   message's own inset — name, rank, join date, post count, date and
   six controls, all the same size and ground. Which was the author
   took reading. Pulled to the post's own edges on a quieter surface
   instead, header reads as header; the inset comes from the post's
   own token so the two can never drift apart. */
.rr-posthead {
    display: flex;
    align-items: center;
    gap: var(--rr-s2) var(--rr-s3);
    flex-wrap: wrap;
    margin: calc(-1 * var(--rr-post-pad-top, 0px)) calc(-1 * var(--rr-post-pad, 0px)) var(--rr-s4);
    padding: 9px var(--rr-post-pad, 0px);
    background: var(--rr-surface-2);
    border-bottom: 1px solid var(--rr-line);
}
/* Sized to read as a face, centred on the line it belongs to, on a
   plate so a mostly-transparent avatar still reads as a circle. */
.rr-posthead__avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    flex: none;
    margin: 0;
    align-self: center;
    background: var(--rr-surface-3);
    box-shadow: 0 0 0 1px var(--rr-line);
}
.rr-posthead__who { display: flex; align-items: baseline; gap: var(--rr-s2); min-width: 0; }
.rr-posthead__name { font-weight: 650; color: var(--rr-text-strong); font-size: var(--rr-fs); }
.rr-posthead__rank {
    font-size: var(--rr-fs-xs);
    color: var(--rr-faint);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 22ch;
}
.rr-posthead__meta {
    font-size: var(--rr-fs-xs);
    line-height: var(--rr-lh-meta);
    color: var(--rr-faint);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    /* No fixed cap. 28ch cut "Joined: Thursday, 13 Feb 2020, 13:07"
       down to "13:…"; shortened at the source now, and where it still
       doesn't fit it gives way to its neighbours rather than to a
       number written here. */
    min-width: 0;
    flex: 0 1 auto;
}
/* Per-post actions were invisible until hovered — a step back from the
   board's own always-visible Quote/Profile controls: a control nobody
   can see is a control nobody uses. Rest dimmed instead: quiet enough
   not to compete with the message, present enough to be found. */
.rr-posttools {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    /* Wraps — on a phone at the largest text size a post number, three
       icon buttons and two GIF-drawn controls don't fit one line, and
       that's how "hide posts by" first pushed the page sideways. */
    flex-wrap: wrap;
    gap: 2px;
    margin-left: auto;
    min-width: 0;
    max-width: 100%;
    opacity: .5;
    transition: opacity var(--rr-speed) ease;
}
tr:hover .rr-posttools,
.rr-posthead:hover .rr-posttools,
.rr-posttools:hover,
.rr-posttools:focus-within { opacity: 1; }
@media (hover: none) { .rr-posttools { opacity: 1; } }

/* The post number doubles as the link to the post, taking over the
   job of the board's own inert "Post" control. */
html[data-rr] .rr-postnum {
    font: 600 var(--rr-fs-xs) / 1 var(--rr-font-mono);
    color: var(--rr-faint);
    padding: 3px 5px;
    border-radius: 4px;
    background: var(--rr-surface-2);
}
html[data-rr] a.rr-postnum:hover {
    color: var(--rr-text-strong);
    background: var(--rr-surface-3);
    text-decoration: none;
}

.rr-sig-toggle {
    display: block;
    margin: var(--rr-s2) 0 0;
    font-size: var(--rr-fs-xs);
    color: var(--rr-faint);
    background: none;
    border: 0;
    padding: 0;
    cursor: pointer;
}
.rr-sig-toggle:hover { color: var(--rr-muted); }
[data-rr-sig="collapsed"] { display: none; }

/* The board draws the divider as a run of underscores; a rule reads
   better and doesn't wrap. */
.rr-signature {
    position: relative;
    margin-top: var(--rr-s3);
    padding-top: var(--rr-s3);
    border-top: 1px solid var(--rr-line);
    font-size: var(--rr-fs-sm);
    color: var(--rr-faint);
}
.rr-signature img { max-height: 90px; width: auto; }

/* ---- Command palette --------------------------------------------- */

.rr-overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    justify-content: center;
    background: rgba(6, 8, 11, .55);
    backdrop-filter: blur(2px);
}
.rr-palette {
    width: min(640px, calc(100vw - 32px));
    /* The overlay is a flex row, so without this the box stretches to
       the height allowed rather than needed — a one-answer search drew
       500px of empty panel under it. */
    align-self: flex-start;
    max-height: min(60vh, 520px);
    margin-top: 12vh;
    display: flex;
    flex-direction: column;
    background: var(--rr-surface);
    border: 1px solid var(--rr-line-strong);
    border-radius: var(--rr-radius-lg);
    box-shadow: var(--rr-shadow-pop);
    /* Not clipped: the scope popover hangs off the top strip, taller
       than the strip itself, and overflow:hidden cut it off mid-way.
       Nothing here paints into the corners, so the radius holds
       without a clip. */
    overflow: visible;
}
/* Matched by element (input.rr-palette__input), not the bare class,
   for the reason input.rr-search__input carries the same shape above:
   the board's field rules reach this input via \`input[type="text"]:focus\`
   too, and a class alone loses that tie — which lit the divider under
   the box accent-red for as long as the palette was open, which is
   always. The box itself is the panel; the field draws nothing of
   its own. */
html[data-rr] input.rr-palette__input {
    /* The strip is a flex row and the field is what stretches in it;
       the strip is what doesn't shrink. The field used to be a
       shrinkable item beside a list of forty boards and gave up 13 of
       its 48px to them, opening the palette on a field shorter than
       its own rows. */
    flex: 1 1 auto;
    min-width: 0;
    height: 48px;
    padding: 0 var(--rr-s4) 0 var(--rr-s2);
    background: none;
    border: 0;
    border-radius: 0;
    color: var(--rr-text-strong);
    font: var(--rr-fs-lg) / 1 var(--rr-font);
    outline: none;
    box-sizing: border-box;
}
/* Where a query is aimed, at the head of the field that carries it:
   which board, and how deep (palette.js, buildPaletteScope). The
   hairline belongs to the strip now, so the field draws none of its
   own — see the focus note below for why it has to say so twice. */
.rr-palette__bar {
    position: relative;
    flex: none;
    display: flex;
    align-items: center;
    padding-left: var(--rr-s3);
    border-bottom: 1px solid var(--rr-line);
}
/* Room names run long ("Temporarily Restricted Topics"); this trigger
   sits in front of the field rather than at a bar's end, so it gets a
   little more width than the one in the search bar. */
html[data-rr] button.rr-palette__scope { max-width: 170px; height: 28px; }
.rr-palette__pop {
    position: absolute;
    top: calc(100% + 6px);
    left: var(--rr-s3);
    z-index: 950;
    min-width: 320px;
    max-width: min(420px, calc(100vw - 64px));
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: var(--rr-s2);
    background: var(--rr-surface);
    border: 1px solid var(--rr-line-strong);
    border-radius: var(--rr-radius);
    box-shadow: var(--rr-shadow-pop);
    cursor: default;
    color: var(--rr-text);
}
.rr-palette__pop[hidden] { display: none; }
/* A column, not a row of pills — twenty rooms with subforums indented
   is a tree, and a tree that wraps is a wall. Scrolls at about eight
   rows, where the popover stops outgrowing the palette. */
.rr-palette__poprow { display: flex; flex-direction: column; gap: var(--rr-s1); }
.rr-palette__rooms {
    max-height: 208px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 2px;
    background: var(--rr-surface-2);
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius);
}
html[data-rr] button.rr-palette__room {
    display: block;
    /* Not a flex item sharing the height out — twenty rows in a 208px
       scroller drew twenty 10px slivers of text. A row is the height
       it needs; the list scrolls instead. */
    flex: none;
    width: 100%;
    padding: 5px 8px;
    background: none;
    border: 0;
    border-radius: 4px;
    color: var(--rr-text);
    cursor: pointer;
    font: var(--rr-fs-xs) / 1.4 var(--rr-font);
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
html[data-rr] button.rr-palette__room:hover { background: var(--rr-surface-3); color: var(--rr-text-strong); }
html[data-rr] button.rr-palette__room[aria-pressed="true"] {
    background: var(--rr-surface-3);
    color: var(--rr-text-strong);
    font-weight: 600;
}
/* A category holds no topics of its own — a heading, not somewhere a
   search can be sent. */
.rr-palette__roomcat {
    flex: none;
    padding: var(--rr-s2) 8px 2px;
    font: 600 var(--rr-fs-xs) / 1 var(--rr-font);
    color: var(--rr-faint);
    letter-spacing: .03em;
}
html[data-rr] input.rr-palette__author {
    flex: 1 1 140px;
    min-width: 0;
    max-width: 190px;
    height: 26px;
    padding: 0 8px;
    background: var(--rr-surface-2);
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius);
    color: var(--rr-text-strong);
    font: var(--rr-fs-xs) / 1 var(--rr-font);
    box-sizing: border-box;
}
html[data-rr] input.rr-palette__author:focus { border-color: var(--rr-accent); outline: none; }
/* Four :not()s make the board's own focus-accent rule specific enough
   to win here — the palette's field is focused from the moment it
   opens, so that rule painted the divider red as a permanent line
   rather than a focus state. The divider belongs to the strip; the
   field has no border to fight over, on load and under :focus alike. */
html[data-rr] input.rr-palette__input:focus { border: 0; }
.rr-palette__list {
    overflow-y: auto;
    padding: var(--rr-s1);
    margin: 0;
    list-style: none;
    border-radius: 0 0 var(--rr-radius-lg) var(--rr-radius-lg);
}
.rr-palette__group {
    padding: var(--rr-s2) var(--rr-s3) var(--rr-s1);
    font: 600 var(--rr-fs-xs) / 1 var(--rr-font);
    color: var(--rr-faint);
}
.rr-palette__item {
    display: flex;
    align-items: center;
    gap: var(--rr-s3);
    padding: 10px var(--rr-s4);
    border-radius: var(--rr-radius);
    cursor: pointer;
    color: var(--rr-text);
    font-size: var(--rr-fs-sm);
}
.rr-palette__item[aria-selected="true"] { background: var(--rr-surface-3); color: var(--rr-text-strong); }
.rr-palette__item svg { width: 15px; height: 15px; color: var(--rr-faint); flex: none; }
.rr-palette__label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rr-palette__hint { color: var(--rr-faint); font-size: var(--rr-fs-xs); flex: none; }
.rr-palette__empty { padding: var(--rr-s5); text-align: center; color: var(--rr-faint); font-size: var(--rr-fs-sm); }

/* ---- Settings panel ---------------------------------------------- */

.rr-panel {
    position: fixed;
    top: 0; right: 0;
    height: 100vh;
    width: min(720px, 100vw);
    z-index: 2100;
    display: grid;
    grid-template-rows: auto 1fr auto;
    background: var(--rr-surface);
    border-left: 1px solid var(--rr-line-strong);
    box-shadow: var(--rr-shadow-pop);
}
/* Every row of the panel is a grid item, whose automatic minimum size
   is its own content's — an unfittable head or a control wider than
   the sheet made the whole *panel* wider than the window it's pinned
   to. They may shrink; what's inside them wraps or scrolls instead. */
.rr-panel__head,
.rr-panel__body,
.rr-panel__foot,
.rr-panel__rail,
.rr-panel__pages { min-width: 0; }
.rr-panel__head {
    display: flex;
    align-items: center;
    gap: var(--rr-s3);
    padding: var(--rr-s3) var(--rr-s4);
    border-bottom: 1px solid var(--rr-line);
    min-width: 0;
}
.rr-panel__id { display: flex; align-items: baseline; gap: 6px; flex: none; }
.rr-panel__title { font: 650 var(--rr-fs-lg) / 1.2 var(--rr-font); color: var(--rr-text-strong); margin: 0; }
.rr-panel__ver { font: var(--rr-fs-xs) / 1 var(--rr-font-mono); color: var(--rr-faint); }
/* Same shape as the palette's field, for the same reason: this one is
   type="search", which the board's field rules also reach. */
html[data-rr] input.rr-panel__search {
    flex: 1;
    min-width: 0;
    height: 32px;
    padding: 0 10px;
    background: var(--rr-bg-sunken);
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius);
    color: var(--rr-text);
    font: var(--rr-fs-sm) / 1 var(--rr-font);
    outline: none;
    box-sizing: border-box;
}
html[data-rr] input.rr-panel__search:focus { border-color: var(--rr-accent); }

/* The rail scrolls on its own so a long category can't push the
   categories off the bottom. */
.rr-panel__body {
    display: grid;
    grid-template-columns: 186px 1fr;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
}
.rr-panel__rail {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: var(--rr-s2);
    overflow-y: auto;
    background: var(--rr-bg-sunken);
    border-right: 1px solid var(--rr-line);
}
.rr-panel__tab {
    display: flex;
    align-items: center;
    gap: var(--rr-s2);
    width: 100%;
    padding: 9px 11px;
    background: none;
    border: 0;
    border-radius: var(--rr-radius);
    color: var(--rr-muted);
    font: 600 var(--rr-fs-sm) / 1.4 var(--rr-font);
    text-align: left;
    cursor: pointer;
    transition: background var(--rr-speed) ease, color var(--rr-speed) ease;
}
.rr-panel__tab svg { width: 15px; height: 15px; flex: none; color: var(--rr-faint); }
.rr-panel__tabname { flex: 1; min-width: 0; }
.rr-panel__tab:hover { background: var(--rr-surface-2); color: var(--rr-text); }
.rr-panel__tab[aria-selected="true"] {
    background: var(--rr-surface-3);
    color: var(--rr-text-strong);
}
.rr-panel__tab[aria-selected="true"] svg { color: var(--rr-accent); }
.rr-panel__tabcount:not(:empty) {
    flex: none;
    min-width: 18px;
    padding: 1px 5px;
    border-radius: var(--rr-radius-pill);
    background: var(--rr-accent-soft);
    color: var(--rr-accent-on-soft, var(--rr-accent));
    font: 700 var(--rr-fs-xs) / 1.5 var(--rr-font-mono);
    text-align: center;
}
/* A category with nothing matching the search is dimmed, not removed
   — the rail keeps its shape while typing. */
.rr-panel__tab[data-rr-empty] { opacity: .35; }
.rr-panel__tab[data-rr-empty] .rr-panel__tabcount { background: none; color: var(--rr-faint); }

.rr-panel__pages { overflow-y: auto; padding: var(--rr-s4) var(--rr-s5) var(--rr-s5); min-height: 0; }
.rr-panel__empty { padding: var(--rr-s6) 0; text-align: center; color: var(--rr-faint); font-size: var(--rr-fs-sm); }
.rr-panel__empty[hidden] { display: none; }

.rr-panel__foot {
    display: flex;
    gap: var(--rr-s2);
    padding: var(--rr-s3) var(--rr-s4);
    border-top: 1px solid var(--rr-line);
    background: var(--rr-surface-2);
}
.rr-panel__foot .rr-spacer { flex: 1; }

.rr-group { margin-bottom: var(--rr-s6); }
.rr-group[data-rr-off] { display: none; }
.rr-group__title {
    margin: 0 0 var(--rr-s1);
    font: 650 var(--rr-fs-lg) / 1.3 var(--rr-font);
    color: var(--rr-text-strong);
}
.rr-group__note { margin: 0 0 var(--rr-s3); font-size: var(--rr-fs-sm); line-height: 1.6; color: var(--rr-muted); max-width: 62ch; }
/* While a search is running the heading says which box the match was
   filed under, so the rail and the page agree. */
.rr-group[data-rr-searching] .rr-group__note { display: none; }

/* A row is words on the left and a control on the right, until the
   control is wider than the room left over — then it takes a line of
   its own rather than squeezing the words into a column. Previously
   five theme buttons beside a three-line sentence wrapped it at about
   thirty characters next to three hundred pixels of nothing. */
.rr-field {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    /* space-between rather than a margin on the control: on a shared
       line it's pushed to the right edge, and on its own line it
       starts at the left, under the words. A margin would strand it
       at the right of an otherwise empty row. */
    justify-content: space-between;
    gap: var(--rr-s3) var(--rr-s5);
    padding: var(--rr-s4) 0;
    border-top: 1px solid var(--rr-line);
}
.rr-field:first-of-type { border-top: 0; }
/* The basis is the wrap threshold, not a width — 16rem is where a
   label sentence stops reading as a column of two-word lines, so a
   wider control takes its own line instead of squeezing them in. */
.rr-field__text { flex: 1 1 16rem; min-width: 0; }
.rr-field__label { display: block; font: 600 var(--rr-fs-sm) / var(--rr-lh-meta) var(--rr-font); color: var(--rr-text); }
.rr-field__desc { display: block; margin-top: 4px; font-size: var(--rr-fs-xs); line-height: 1.6; color: var(--rr-muted); max-width: 56ch; }
.rr-field__control { flex: 0 0 auto; display: flex; align-items: center; gap: var(--rr-s2); padding-top: 2px; }
.rr-field[hidden],
.rr-field[data-rr-dep-off],
.rr-field[data-rr-nomatch] { display: none; }
/* A search hit under a parent that's switched off is still a hit:
   shown, dimmed, rather than counted on the tab and then missing. */
.rr-group[data-rr-searching] .rr-field[data-rr-dep-off]:not([data-rr-nomatch]) { display: flex; opacity: .6; }
/* Stepped in under its parent so "off because the thing above is off"
   is visible rather than inferred. */
.rr-field[data-rr-dep] { padding-left: var(--rr-s3); }
.rr-rangewrap { display: flex; align-items: center; gap: var(--rr-s2); }

.rr-switch {
    position: relative;
    width: 38px;
    height: 22px;
    flex: none;
    border-radius: var(--rr-radius-pill);
    background: var(--rr-surface-3);
    border: 1px solid var(--rr-line-strong);
    cursor: pointer;
    transition: background var(--rr-speed) ease, border-color var(--rr-speed) ease;
    padding: 0;
}
.rr-switch::after {
    content: "";
    position: absolute;
    top: 2px; left: 2px;
    width: 16px; height: 16px;
    border-radius: 50%;
    background: var(--rr-muted);
    transition: transform var(--rr-speed) ease, background var(--rr-speed) ease;
}
.rr-switch[aria-checked="true"] { background: var(--rr-accent); border-color: var(--rr-accent); }
.rr-switch[aria-checked="true"]::after { transform: translateX(16px); background: var(--rr-accent-text); }

.rr-seg { display: inline-flex; background: var(--rr-surface-2); border: 1px solid var(--rr-line); border-radius: var(--rr-radius); padding: 2px; gap: 2px; }
.rr-seg button {
    background: none;
    border: 0;
    border-radius: 4px;
    padding: 4px 9px;
    font: 600 var(--rr-fs-xs) / 1.3 var(--rr-font);
    color: var(--rr-muted);
    cursor: pointer;
}
.rr-seg button[aria-pressed="true"] { background: var(--rr-surface-3); color: var(--rr-text-strong); }

.rr-range { width: 130px; accent-color: var(--rr-accent); }
.rr-range-val { font: var(--rr-fs-xs) / 1 var(--rr-font-mono); color: var(--rr-muted); min-width: 34px; text-align: right; }

/* Accent chips never share a line with anything, so they start at the
   left of their own row rather than being pushed right by the row's
   \`margin-left: auto\`. On a phone the field is already a column and
   needs none of it: \`flex-basis: 100%\` there is a *height*, which is
   how the chips came to overrun the sheet. */
@media (min-width: 641px) {
    .rr-field[data-field="accent"] > .rr-field__control { flex-basis: 100%; padding-top: 0; }
}
.rr-swatches { display: flex; flex-wrap: wrap; gap: 4px; max-width: 100%; }
.rr-swatch {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    /* Never narrower than its own name — a fixed 62px cut "RIN orange"
       off both sides of the pressed swatch's box, since the nowrap
       label overflowed rather than wrapping. */
    min-width: 62px;
    padding: 7px 8px 6px;
    background: none;
    border: 1px solid transparent;
    border-radius: var(--rr-radius);
    color: var(--rr-muted);
    font: 500 var(--rr-fs-xs) / 1.2 var(--rr-font);
    cursor: pointer;
    transition: background var(--rr-speed) ease, color var(--rr-speed) ease, border-color var(--rr-speed) ease;
}
.rr-swatch__dot {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--rr-swatch);
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .25);
    color: #0e1013;
    transition: transform var(--rr-speed) ease;
}
.rr-swatch__dot svg { width: 13px; height: 13px; opacity: 0; stroke-width: 3; }
.rr-swatch__name { white-space: nowrap; }
.rr-swatch:hover { background: var(--rr-surface-2); color: var(--rr-text); }
.rr-swatch:hover .rr-swatch__dot { transform: scale(1.08); }
.rr-swatch[aria-pressed="true"] {
    background: var(--rr-surface-2);
    border-color: var(--rr-line-strong);
    color: var(--rr-text-strong);
}
.rr-swatch[aria-pressed="true"] .rr-swatch__dot svg { opacity: 1; }
.rr-swatch[aria-pressed="true"] .rr-swatch__name { font-weight: 600; }

/* ---- Lightbox ---------------------------------------------------- */

.rr-lightbox {
    position: fixed;
    inset: 0;
    z-index: 2200;
    display: grid;
    place-items: center;
    background: rgba(6, 8, 11, .88);
    cursor: zoom-out;
}
.rr-lightbox img {
    max-width: 94vw;
    max-height: 92vh;
    border-radius: var(--rr-radius);
    box-shadow: var(--rr-shadow-pop);
}
.rr-lightbox__close {
    position: fixed;
    top: 14px;
    right: 18px;
    width: 40px;
    height: 40px;
    color: #f0f0f0;
    background: rgba(20, 22, 26, .7);
    border: 1px solid rgba(255, 255, 255, .18);
}
.rr-lightbox__close:hover { background: rgba(40, 42, 48, .9); color: #fff; }
.rr-lightbox__close:focus-visible { outline: 2px solid var(--rr-accent); outline-offset: 2px; }

/* ---- Floating actions -------------------------------------------- */

/* The corner is the one place a centred tooltip cannot go. */
.rr-fab [data-rr-tip]::after { left: auto; right: 0; transform: none; }

.rr-fab {
    position: fixed;
    right: var(--rr-s4);
    bottom: var(--rr-s4);
    z-index: 880;
    display: flex;
    flex-direction: column;
    gap: var(--rr-s2);
}
.rr-fab button {
    width: 38px; height: 38px;
    display: grid; place-items: center;
    background: var(--rr-surface-2);
    color: var(--rr-muted);
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius);
    cursor: pointer;
    box-shadow: var(--rr-shadow-pop);
    transition: color var(--rr-speed) ease, background var(--rr-speed) ease, opacity var(--rr-speed) ease;
}
.rr-fab button:hover { color: var(--rr-text-strong); background: var(--rr-surface-3); }
.rr-fab button svg { width: 17px; height: 17px; }
.rr-fab button[hidden] { display: none; }

/* ---- Toast ------------------------------------------------------- */

.rr-toasts {
    position: fixed;
    left: 50%;
    bottom: var(--rr-s5);
    transform: translateX(-50%);
    z-index: 2300;
    display: flex;
    flex-direction: column;
    gap: var(--rr-s2);
    align-items: center;
    pointer-events: none;
}
.rr-toast {
    background: var(--rr-surface-3);
    color: var(--rr-text-strong);
    border: 1px solid var(--rr-line-strong);
    border-radius: var(--rr-radius-pill);
    padding: 7px 16px;
    font: 600 var(--rr-fs-sm) / 1 var(--rr-font);
    box-shadow: var(--rr-shadow-pop);
}

/* ---- Shortcut sheet ---------------------------------------------- */

.rr-sheet__head {
    display: flex;
    align-items: center;
    gap: var(--rr-s3);
    margin-bottom: var(--rr-s3);
}
.rr-sheet__head h2 { margin: 0; flex: 1; }
.rr-sheet__close { flex: none; }

.rr-sheet {
    width: min(560px, calc(100vw - 32px));
    margin: auto;
    background: var(--rr-surface);
    border: 1px solid var(--rr-line-strong);
    border-radius: var(--rr-radius-lg);
    box-shadow: var(--rr-shadow-pop);
    padding: var(--rr-s5);
    max-height: 80vh;
    overflow-y: auto;
}
.rr-sheet h2 { margin: 0 0 var(--rr-s4); font-size: var(--rr-fs-lg); }
.rr-sheet dl { display: grid; grid-template-columns: 120px 1fr; gap: var(--rr-s3) var(--rr-s5); margin: 0; }
.rr-sheet dt { text-align: right; }
.rr-sheet dd { margin: 0; font-size: var(--rr-fs-sm); color: var(--rr-muted); }

/* ---- Bookmarked topic marker ------------------------------------- */

.rr-star { color: var(--rr-faint); }
.rr-star[aria-pressed="true"] { color: var(--rr-accent); }
.rr-star[aria-pressed="true"] svg { fill: currentColor; }

/* ---- Scrollbars --------------------------------------------------- */

/* Only inside the script's own panels — the page keeps the browser's. */
.rr-palette__list,
.rr-panel__body,
.rr-sheet {
    scrollbar-width: thin;
    scrollbar-color: var(--rr-line-strong) transparent;
}
.rr-palette__list::-webkit-scrollbar,
.rr-panel__body::-webkit-scrollbar,
.rr-sheet::-webkit-scrollbar { width: 10px; }
.rr-palette__list::-webkit-scrollbar-track,
.rr-panel__body::-webkit-scrollbar-track,
.rr-sheet::-webkit-scrollbar-track { background: transparent; }
.rr-palette__list::-webkit-scrollbar-thumb,
.rr-panel__body::-webkit-scrollbar-thumb,
.rr-sheet::-webkit-scrollbar-thumb {
    background: var(--rr-line-strong);
    border: 3px solid transparent;
    border-radius: var(--rr-radius-pill);
    background-clip: content-box;
}
.rr-palette__list::-webkit-scrollbar-thumb:hover,
.rr-panel__body::-webkit-scrollbar-thumb:hover,
.rr-sheet::-webkit-scrollbar-thumb:hover { background: var(--rr-faint); background-clip: content-box; }

.rr-posthead__spacer { flex: 1; min-width: var(--rr-s2); }
.rr-posthead__date { font-size: var(--rr-fs-xs); color: var(--rr-faint); white-space: nowrap; }
.rr-posthead .rr-posttools { margin-left: 0; }

/* ---- Hidden posts -------------------------------------------------- */

.rr-hidden-note {
    display: flex;
    align-items: center;
    gap: var(--rr-s3);
    padding: var(--rr-s2) 0;
    font-size: var(--rr-fs-sm);
    line-height: var(--rr-lh-meta);
    color: var(--rr-faint);
}

/* On a phone the groups stack and lose their hairline; the pull left
   that hides a desktop hairline then cut the first letters off "User
   Control Panel" and "Forum rules". */
@media (max-width: 720px) {
    .rr-boardbar__main { margin-left: 0; }
    .rr-boardbar__group { padding-left: 0; border-left: 0; margin-right: 0; }
}

/* The optional noun on a topic-bar link (" topic", " friend") is its
   own flex item, so the button's 6px gap sat on top of its own
   leading space. Taken back here so "Previous topic" is spaced like
   two words. */
.rr-topicbar .rr-opt { margin-left: -6px; white-space: pre; }

/* A crumb that is a place, not a link — the control panel section the
   window title named. It shares the same shrinking flex row as the
   linked crumbs before it, but had none of their ellipsis treatment:
   a flex item's automatic minimum width is its full nowrap content
   width unless overflow is something other than visible, so on a
   narrow phone it refused to shrink and was guillotined by the crumb
   bar's own clip instead of ellipsized. */
.rr-nav__here {
    color: var(--rr-text-strong);
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
}

/* ---- Quick reply toolbar ------------------------------------------ */

.rr-reply__tools { display: flex; flex-wrap: wrap; gap: 4px; margin: 0 0 6px; }
.rr-reply__tools .rr-btn { padding: 3px 9px; font-size: var(--rr-fs-xs); min-width: 30px; }
.rr-reply__tools .rr-btn[data-tool="b"] { font-weight: 700; }
.rr-reply__tools .rr-btn[data-tool="i"] { font-style: italic; }
.rr-reply__tools .rr-btn[data-tool="u"] { text-decoration: underline; }

/* ---- Keyboard cursor on a listing ---------------------------------- */

/* j/k walk the rows the way they walk the posts of a topic; the row
   under the cursor is marked like a hovered row, plus an accent
   hairline so hover and selection read differently. */
html[data-rr] table[data-rr-list] tr[data-rr-cursor] > td { background: var(--rr-surface-3); }
html[data-rr] table[data-rr-list] tr[data-rr-cursor] > td:first-child { box-shadow: inset 3px 0 0 var(--rr-accent); }

/* ---- The mini pager under a topic title ------------------------- */

/* "[ Go to page: 1 … 41, 42, 43 ]" as a label and a row of chips
   (lists.js, tidyMiniPagers). */
.rr-minipager { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 3px 4px; font-weight: 400; }
.rr-minipager__label { margin-right: 3px; font-size: var(--rr-fs-xs); color: var(--rr-faint); }
/* In a listing's strip the words are the board's own link that asks
   for a page number; kept, quietly. */
html[data-rr] a.rr-minipager__label { color: var(--rr-muted); font-weight: 500; text-decoration: none; }
html[data-rr] a.rr-minipager__label:hover { color: var(--rr-text-strong); }
html[data-rr] a.rr-minipager__page,
html[data-rr] strong.rr-minipager__page {
    display: inline-block;
    min-width: 1.6em;
    padding: 0 6px;
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius-pill);
    background: var(--rr-surface-2);
    color: var(--rr-muted);
    font: 600 var(--rr-fs-xs) / 1.7 var(--rr-font);
    text-align: center;
}
html[data-rr] a.rr-minipager__page:hover { color: var(--rr-text-strong); border-color: var(--rr-line-strong); text-decoration: none; }
html[data-rr] strong.rr-minipager__page--here { background: var(--rr-accent); border-color: var(--rr-accent); color: var(--rr-accent-text); }
html[data-rr] a.rr-minipager__step { min-width: 0; padding: 0 9px; }
.rr-minipager__gap { color: var(--rr-faint); font-size: var(--rr-fs-xs); }

/* ---- Loose strips between cards --------------------------------- */

/* Bare tables the template drops between cards with nothing holding
   them apart: a listing's "Go to page" strip, "Page 1 of 5" over Who
   is online, the message folder's sort form. */
html[data-rr] #wrapcentre table[data-rr-strip],
html[data-rr] #wrapcentre table[data-rr-sortfoot] { margin: var(--rr-s3) 0; }
html[data-rr] #wrapcentre table[data-rr-strip] td.nav,
html[data-rr] #wrapcentre table[data-rr-strip] td.pagination { font-size: var(--rr-fs-sm); color: var(--rr-muted); }
/* A bare span dropped between two cards ("Delete all board cookies |
   The team") — given a line of its own, quiet. */
html[data-rr] #wrapcentre > span.gensmall {
    display: block;
    margin: var(--rr-s2) var(--rr-s1) var(--rr-s3);
    font-size: var(--rr-fs-xs);
    color: var(--rr-faint);
}

/* ---- Sort controls --------------------------------------------- */

/* Each label and the select(s) it names, glued into one span by
   lists.js (groupSortControls); nowrap keeps a wrap from landing
   inside a pair, only between one pair and the next. */
html[data-rr] .rr-ctrl-group {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
}
html[data-rr] td.cat[data-rr-cat="controls"] > .rr-ctrl-group + .rr-ctrl-group,
html[data-rr] td.cat[data-rr-cat="controls"] > .rr-ctrl-group + input { margin-left: var(--rr-s3); }
html[data-rr] td.cat[data-rr-cat="controls"] > form,
html[data-rr] #wrapcentre form[name="sortmsg"] {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--rr-s2) var(--rr-s3);
    vertical-align: middle;
}
/* The topic search under the posts: the template floats its box, and
   the button wrapped under the input in the width the float left it.
   One line instead, beside the sort form. */
html[data-rr] #search-box_thread,
html[data-rr] #wrapcentre #search-box:not([data-rr-dupe]) {
    float: none !important;
    display: inline-flex;
    width: auto !important;
    vertical-align: middle;
    margin: 0 var(--rr-s4) 0 0;
}
html[data-rr] #wrapcentre #search-box:not([data-rr-dupe]) form,
html[data-rr] #search-box_thread form {
    display: inline-flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: var(--rr-s2);
    width: auto !important;
    margin: 0;
    white-space: nowrap;
}
/* The field inherits the board's default text-field floor (size="22"
   in ems), wider than the line here — fixed width instead, no floor,
   no growing. */
html[data-rr] #wrapcentre td.cat[data-rr-cat="controls"] #search-box_thread input[type="text"],
html[data-rr] #wrapcentre #search-box:not([data-rr-dupe]) input[type="text"] {
    width: 14em !important;
    min-width: 0 !important;
    flex: 0 0 auto !important;
}

/* ---- A post's header, on a desktop ------------------------------- */

/* Left to wrap, the tools dropped to a second line while the date
   stayed alone at the right of the first. The meta line gives way
   first: it already ends in an ellipsis and isn't a control. */
@media (min-width: 861px) {
    html[data-rr] .rr-posthead { flex-wrap: nowrap; }
    html[data-rr] .rr-posthead__meta { flex: 0 100 auto; }
    /* The tools may still wrap inside themselves rather than push the
       page sideways, which is what a 1280px window with a long
       "Location:" did. */
    html[data-rr] .rr-posthead .rr-posttools { flex: 0 1 auto; }
}
/* Wide enough that the controls always fit once the meta has given
   way: they stop shrinking, so the last icon no longer drops to a
   line of its own. Below this they may still wrap internally, which
   is the one thing that must never push the page sideways. */
@media (min-width: 1100px) {
    html[data-rr] .rr-posthead .rr-posttools { flex: 0 0 auto; }
}

/* ---- Strips of links the template joins with pipes ---------------- */

/* "Previous PM in history | Next PM | …", "[ Add friend | Add foe ]",
   "Mark all :: Unmark all": the punctuation goes and the gap says the
   same thing. */
html[data-rr] .rr-linkrow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--rr-s2) var(--rr-s3);
}
html[data-rr] .rr-linkrow > a {
    color: var(--rr-muted);
    font-size: var(--rr-fs-sm);
    font-weight: 500;
    text-decoration: none;
}
html[data-rr] .rr-linkrow > a:hover { color: var(--rr-text-strong); }
html[data-rr] td[align="right"] > .rr-linkrow,
html[data-rr] .rr-linkrow[data-rr-align="right"] { justify-content: flex-end; }

/* ---- A listing's headings ---------------------------------------- */

/* Kept in view while their own listing is on screen — the top bar is
   48px of sticky chrome above them when it's drawn. */
html[data-rr][data-rr-sticky="on"] table[data-rr-list] > tbody > tr[data-rr-head] > th {
    position: sticky;
    top: 0;
    z-index: 3;
    background: var(--rr-bg-sunken);
}
html[data-rr][data-rr-sticky="on"][data-rr-nav="on"] table[data-rr-list] > tbody > tr[data-rr-head] > th {
    top: var(--rr-nav-h, 48px);
}

/* A heading that sorts: a button that reads as the heading it
   replaced until it is pointed at. */
html[data-rr] th[data-rr-sortable] { padding: 0; }
html[data-rr] button.rr-sortbtn {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    padding: var(--rr-s2) var(--rr-s3);
    background: none;
    border: 0;
    color: inherit;
    font: inherit;
    letter-spacing: inherit;
    text-align: inherit;
    cursor: pointer;
}
html[data-rr] th[data-rr-col="replies"] button.rr-sortbtn,
html[data-rr] th[data-rr-col="views"] button.rr-sortbtn,
html[data-rr] th[data-rr-col="topics"] button.rr-sortbtn,
html[data-rr] th[data-rr-col="posts"] button.rr-sortbtn,
html[data-rr] th[data-rr-col="num"] button.rr-sortbtn { justify-content: flex-end; }
html[data-rr] button.rr-sortbtn:hover { color: var(--rr-text-strong); }
html[data-rr] button.rr-sortbtn:focus-visible { outline: 2px solid var(--rr-accent); outline-offset: -2px; }
html[data-rr] th[data-rr-sorted] button.rr-sortbtn { color: var(--rr-text-strong); }
.rr-sortmark { font-size: var(--rr-fs-xs); line-height: 1; opacity: .9; }

html[data-rr] input.rr-markall { margin: 0; vertical-align: middle; accent-color: var(--rr-accent); }

html[data-rr] .rr-tag--unread { display: inline-flex; align-items: center; }
html[data-rr] .rr-tag--unread::before {
    content: "";
    width: 6px;
    height: 6px;
    margin-right: 5px;
    border-radius: 50%;
    background: var(--rr-accent);
}

/* ---- The lightbox, with more than one picture in it --------------- */

html[data-rr] .rr-lightbox__step {
    position: absolute;
    top: 50%;
    left: 16px;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    background: rgba(20, 22, 26, .72);
    color: #fff;
    border-radius: 50%;
}
html[data-rr] .rr-lightbox__step--next { left: auto; right: 16px; }
html[data-rr] .rr-lightbox__step:hover { background: rgba(40, 42, 48, .9); }
html[data-rr] .rr-lightbox__step:focus-visible { outline: 2px solid var(--rr-accent); outline-offset: 2px; }
.rr-lightbox__count {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    padding: 3px 10px;
    border-radius: var(--rr-radius-pill);
    background: rgba(20, 22, 26, .72);
    color: #fff;
    font: 500 var(--rr-fs-xs) / 1.6 var(--rr-font);
}

/* ---- The writing toolbar ------------------------------------------ */

/* The board's BBCode buttons, regrouped by compose.js into five
   groups (letter styles, blocks, fetched-from-elsewhere, hidden, the
   board's own generator) — was two undivided rows of grey rectangles.
   Groups are told apart by space alone, not a hairline: a hairline
   would read fine right up until the bar wraps on a narrow window and
   a line opens with a divider against nothing. */
.rr-bbtools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 7px var(--rr-s5);
    margin: 0 0 var(--rr-s2);
}
.rr-bbtools__group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
}

/* The tooltip hangs off this wrapper rather than the button — an
   input is a replaced element and draws no pseudo-element. */
.rr-bbtool {
    position: relative;
    display: inline-flex;
    align-items: center;
}
.rr-bbtool > svg {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--rr-muted);
    /* The icon sits over the button it belongs to; a click on it is a
       click on the button. */
    pointer-events: none;
    transition: color var(--rr-speed) ease;
}
.rr-bbtool:hover > svg { color: var(--rr-accent); }

html[data-rr] .rr-bbtool > input.btnbbcode {
    width: auto !important;
    min-width: 34px;
    height: 30px;
    padding: 0 11px;
    background: var(--rr-surface-2);
    border-color: var(--rr-line);
    color: var(--rr-text);
    font-size: var(--rr-fs-sm);
    font-weight: 600;
}
html[data-rr] .rr-bbtool > svg + input.btnbbcode { padding-left: 29px; }
html[data-rr] .rr-bbtool > input.btnbbcode:hover {
    background: var(--rr-surface-3);
    border-color: var(--rr-line-strong);
    color: var(--rr-text-strong);
}
html[data-rr] .rr-bbtool > input.btnbbcode:active { background: var(--rr-line); }

/* Four buttons whose caption is the effect: they wear it. */
html[data-rr] .rr-bbtool > input[data-rr-face="bold"] { font-weight: 800; }
html[data-rr] .rr-bbtool > input[data-rr-face="italic"] { font-style: italic; }
html[data-rr] .rr-bbtool > input[data-rr-face="underline"] { text-decoration: underline; }
html[data-rr] .rr-bbtool > input[data-rr-face="strike"] { text-decoration: line-through; }

/* The font size menu, stranded by the template at the end of the
   first row with a label of its own. */
.rr-bbtool--menu > span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: var(--rr-muted);
    font-size: var(--rr-fs-sm);
    white-space: nowrap;
}
html[data-rr] .rr-bbtool--menu select { height: 30px; padding: 0 6px; }

/* The read-only field the board wrote its explanations into stays in
   the page — helpline() sets its value on every mouseover of every
   button and a removed one throws on all of them — and just stops
   reading as a second Subject box. */
html[data-rr] input[data-rr-helpbox] { display: none; }
html[data-rr] tr[data-rr-helprow] > td { padding: 0 0 var(--rr-s2); }

/* The heading over the colour palette, moved into the swatches' own
   cell (compose.js, movePaletteHeading). */
html[data-rr] .rr-palette-head {
    margin-bottom: var(--rr-s2);
    color: var(--rr-faint);
    font-size: var(--rr-fs-xs);
    letter-spacing: .04em;
    text-transform: uppercase;
}

/* == features.css == */
/* Folding here means max-height + a mask, never display:none or
   visibility:hidden — the content stays laid out, read aloud, and found
   by Ctrl+F; only the box around it shrinks. */

/* ---- Folded quotes ------------------------------------------------ */

html[data-rr] .postbody [data-rr-quote="folded"] {
    max-height: var(--rr-quote-max, 7em);
    overflow: hidden;
    cursor: zoom-in;
    /* Fade signals more content than a hard clip does. */
    -webkit-mask-image: linear-gradient(to bottom, #000 55%, rgba(0, 0, 0, .12) 100%);
            mask-image: linear-gradient(to bottom, #000 55%, rgba(0, 0, 0, .12) 100%);
}
html[data-rr] .postbody [data-rr-quote="folded"]:hover {
    -webkit-mask-image: linear-gradient(to bottom, #000 70%, rgba(0, 0, 0, .3) 100%);
            mask-image: linear-gradient(to bottom, #000 70%, rgba(0, 0, 0, .3) 100%);
}

.rr-quote-toggle {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    margin-left: var(--rr-s2);
    padding: 2px 8px;
    background: var(--rr-surface-3);
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius-pill);
    color: var(--rr-muted);
    font: 600 var(--rr-fs-xs) / 1.5 var(--rr-font);
    cursor: pointer;
    vertical-align: baseline;
}
.rr-quote-toggle:hover { background: var(--rr-surface-2); color: var(--rr-text-strong); border-color: var(--rr-line-strong); }
.rr-quote-toggle svg { width: 11px; height: 11px; transition: transform var(--rr-speed) ease; }
.rr-quote-toggle[aria-expanded="true"] svg { transform: rotate(180deg); }

/* ---- Folded chatter ----------------------------------------------- */

/* Original post is untouched — only clipped to one line, not replaced
   by a summary of it. */
html[data-rr] table.tablebg[data-rr-quiet] { opacity: .72; }
html[data-rr] table.tablebg[data-rr-quiet]:hover { opacity: 1; }

html[data-rr] table.tablebg[data-rr-quiet] > tbody > tr > td { padding-top: 4px; padding-bottom: 4px; }

html[data-rr] table.tablebg[data-rr-quiet] .rr-posthead {
    display: inline-flex;
    margin: 0 var(--rr-s2) 0 0;
    padding: 0;
    border: 0;
    background: none;
    vertical-align: middle;
}
html[data-rr] table.tablebg[data-rr-quiet] .rr-posthead__avatar,
html[data-rr] table.tablebg[data-rr-quiet] .rr-posthead__rank,
html[data-rr] table.tablebg[data-rr-quiet] .rr-posthead__meta,
html[data-rr] table.tablebg[data-rr-quiet] .rr-posthead__spacer,
html[data-rr] table.tablebg[data-rr-quiet] .rr-posttools,
html[data-rr] table.tablebg[data-rr-quiet] .rr-signature,
html[data-rr] table.tablebg[data-rr-quiet] .rr-sig-toggle { display: none; }
html[data-rr] table.tablebg[data-rr-quiet] .rr-posthead__name { font-size: var(--rr-fs-xs); font-weight: 600; }
html[data-rr] table.tablebg[data-rr-quiet] .rr-posthead__date { display: none; }

/* \`display: inline\` on the message quietly undid the fold — overflow
   and max-height don't apply to a non-replaced inline box, so a short
   reply just laid out in full. A flex row makes the message a
   clippable flex item instead.

   Blocks, not a table: a table sizes to its content and this grew to
   2044px sideways. The whole chain matters, not just the outer rows —
   subsilver2 wraps a post in an extra \`<table cellspacing="5">\` live
   (absent from the fixtures) that repeated the bug at 2756px. Bare
   \`td\` (not scoped further) also beats \`td.profile{display:none}\`,
   which otherwise puts the author column back on every folded reply. */
html[data-rr] table.tablebg[data-rr-quiet],
html[data-rr] table.tablebg[data-rr-quiet] table,
html[data-rr] table.tablebg[data-rr-quiet] tbody,
html[data-rr] table.tablebg[data-rr-quiet] tr,
html[data-rr] table.tablebg[data-rr-quiet] td:has(.postbody) { display: block; }
html[data-rr] table.tablebg[data-rr-quiet] td:has(> .postbody) {
    display: flex;
    align-items: baseline;
    gap: var(--rr-s2);
}
html[data-rr] table.tablebg[data-rr-quiet] .postbody {
    flex: 1 1 auto;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    /* Ellipsis, not a hard clip — the text stays intact for find-in-page. */
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: var(--rr-fs-sm);
    line-height: var(--rr-lh-meta);
    color: var(--rr-faint);
    cursor: zoom-in;
}
html[data-rr] table.tablebg[data-rr-quiet] .postbody br { display: none; }

/* Also hides the template's trailing <br>s, the empty control strip,
   and any signature (a second .postbody) — a folded reply is one line,
   all in. */
html[data-rr] table.tablebg[data-rr-quiet] .postbody ~ * { display: none; }
html[data-rr] table.tablebg[data-rr-quiet] .postbody ~ .rr-quiet-chip { display: inline-flex; }

/* Hides the other three rows of the post too — the header row is
   already gone in the modern layout, the footer is leftover Top/Profile
   chrome — otherwise a folded reply still cost 77px. */
html[data-rr] table.tablebg[data-rr-quiet] > tbody > tr:not(:has(.postbody)):not(:has(.rr-posthead)) {
    display: none;
}
html[data-rr] table.tablebg[data-rr-quiet] td > table { border-spacing: 0; margin: 0; }
html[data-rr] table.tablebg[data-rr-quiet] > tbody > tr > td { padding: 2px 4px; }

.rr-quiet-chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    margin-right: var(--rr-s2);
    padding: 2px 8px;
    background: var(--rr-surface-2);
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius-pill);
    color: var(--rr-faint);
    /* line-height 1.25, not 1.5 — 1.5 made the pill 24px against a
       20px line of text. */
    font: 600 var(--rr-fs-xs) / 1.25 var(--rr-font);
    cursor: pointer;
    vertical-align: middle;
}
/* Centred, not baseline-aligned — a bordered pill's baseline sits
   inside it, so baseline alignment hung it 2px above the line. */
.rr-quiet-chip { align-self: center; }
.rr-quiet-chip:hover { color: var(--rr-text); border-color: var(--rr-line-strong); }
.rr-quiet-chip svg { width: 11px; height: 11px; }
/* Once opened, the only remaining sign the post was folded. */
html[data-rr] table.tablebg:not([data-rr-quiet]) .rr-quiet-chip { opacity: .4; }
html[data-rr] table.tablebg:not([data-rr-quiet]) .rr-quiet-chip:hover { opacity: 1; }

/* ---- The donation link -------------------------------------------- */

/* Kept to the board's own link weight — it used to carry an outline
   and a heart; the palette still offers it from anywhere. */
html[data-rr] .rr-boardbar__donate { font-weight: 600; }

@media (max-width: 380px) {
    /* At 390px (the common phone width) the entries fit only once every
       link lost the word "View". Below 380px only "Unanswered posts" —
       the one link every guide tells people to bookmark — stays; the
       rest move behind More. */
    html[data-rr] .rr-boardbar:not([data-rr-open]) .rr-boardbar__main > :first-child > :nth-child(n+2) {
        display: none;
    }
}

/* ---- Steam preview ------------------------------------------------ */

.rr-steam-pop {
    position: absolute;
    z-index: 1200;
    width: 340px;
    max-width: calc(100vw - 24px);
    pointer-events: auto;
}
.rr-steam {
    display: flex;
    flex-direction: column;
    gap: var(--rr-s3);
    padding: var(--rr-card-pad);
    background: var(--rr-surface);
    border: 1px solid var(--rr-line-strong);
    border-radius: var(--rr-radius-lg);
    box-shadow: var(--rr-shadow-pop);
}
.rr-steam--quiet { gap: 0; }
.rr-steam__art {
    display: block;
    width: 100%;
    height: auto;
    border-radius: var(--rr-radius);
    background: var(--rr-surface-3);
}
.rr-steam__head { display: flex; align-items: baseline; gap: var(--rr-s2); }
.rr-steam__name {
    flex: 1;
    min-width: 0;
    font: 650 var(--rr-fs) / 1.3 var(--rr-font);
    color: var(--rr-text-strong);
}
.rr-steam__score {
    flex: none;
    padding: 1px 7px;
    border-radius: var(--rr-radius);
    font: 700 var(--rr-fs-xs) / 1.6 var(--rr-font-mono);
    background: var(--rr-surface-3);
    color: var(--rr-muted);
}
/* Text lifted toward strong text, not the raw token — the raw red read
   under 4:1 on dark themes. */
.rr-steam__score[data-band="good"]  { background: color-mix(in srgb, var(--rr-ok) 20%, transparent);     color: color-mix(in srgb, var(--rr-ok) 70%, var(--rr-text-strong)); }
.rr-steam__score[data-band="mixed"] { background: color-mix(in srgb, var(--rr-warn) 20%, transparent);   color: color-mix(in srgb, var(--rr-warn) 70%, var(--rr-text-strong)); }
.rr-steam__score[data-band="poor"]  { background: color-mix(in srgb, var(--rr-danger) 20%, transparent); color: var(--rr-danger); }

.rr-steam__facts {
    font: var(--rr-fs-xs) / var(--rr-lh-meta) var(--rr-font);
    color: var(--rr-faint);
}
.rr-steam__tags { display: flex; flex-wrap: wrap; gap: 4px; }
.rr-steam__tag {
    padding: 1px 7px;
    border-radius: var(--rr-radius-pill);
    background: var(--rr-surface-2);
    border: 1px solid var(--rr-line);
    color: var(--rr-muted);
    font: 600 var(--rr-fs-xs) / 1.6 var(--rr-font);
}
.rr-steam__blurb {
    margin: 0;
    font-size: var(--rr-fs-sm);
    line-height: 1.55;
    color: var(--rr-text);
    /* Three lines: enough to say what the game is without becoming
       the page. */
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
/* Sits with the bookkeeping, hairlined off the blurb — this is what
   the board's own tooltip drew over the card until steam.js removed
   the attribute. */
.rr-steam__posted {
    padding-top: var(--rr-s2);
    border-top: 1px solid var(--rr-line);
    font: var(--rr-fs-xs) / var(--rr-lh-meta) var(--rr-font);
    color: var(--rr-faint);
}
/* Placeholder has nothing above to separate from. */
.rr-steam--quiet .rr-steam__posted { padding-top: 0; border-top: 0; }
.rr-steam__links { display: flex; gap: 6px; }
.rr-steam__links .rr-btn { padding: 4px 8px; font-size: var(--rr-fs-xs); }

/* Only here so the retarget-to-first-unread is visible to a test and
   in the DOM — the board's own dot already marks the row unread. */
html[data-rr] tr[data-rr-unread] a.topictitle { text-underline-offset: 3px; }


/* ---- Category collapse ------------------------------------------- */

/* Two selectors: a bare class alone loses padding/border to the more
   specific \`html[data-rr] input[type=button]\` in forum.css, rendering
   a 34px slab. The arrow is boardindex.js's own \`value\` — it can't be
   a pseudo-element since <input> is a replaced element. */
html[data-rr] input.ccclose,
html[data-rr] input.ccopen,
html[data-rr] .ccclose,
html[data-rr] .ccopen {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    min-width: 0;
    padding: 0;
    background: none;
    background-image: none !important;
    border: 1px solid transparent;
    border-radius: var(--rr-radius);
    color: var(--rr-muted);
    font: 700 12px/1 var(--rr-font);
    text-align: center;
    cursor: pointer;
    vertical-align: middle;
    transition: background var(--rr-speed) ease, color var(--rr-speed) ease;
}
html[data-rr] input.ccclose:hover,
html[data-rr] input.ccopen:hover,
html[data-rr] .ccclose:hover,
html[data-rr] .ccopen:hover {
    background: var(--rr-surface-3);
    border-color: var(--rr-line);
    color: var(--rr-text-strong);
}


/* ---- Light theme, seen by eye ------------------------------------ */

/* Rest state at .78 opacity: on white a mid-tone chip nearly vanishes
   (Info/Tutorial stopped reading as words) while on dark surfaces it
   still reads; .78 lands both at the same visual weight on paper. */
html[data-rr][data-rr-theme="paper"] .rr-toolbar__tags .rr-tag,
html[data-rr][data-rr-theme="paper"] .rr-toolbar__quick .rr-tag { opacity: .78; }
/* An active chip stays full opacity in every theme, overriding the
   rest state above. */
html[data-rr][data-rr-theme="paper"] .rr-toolbar__tags .rr-tag:hover,
html[data-rr][data-rr-theme="paper"] .rr-toolbar__tags .rr-tag[aria-pressed="true"],
html[data-rr][data-rr-theme="paper"] .rr-toolbar__quick .rr-tag[aria-pressed="true"] { opacity: 1; }


/* ---- The board's masthead ---------------------------------------- */

/* Shown at the board's own size; the plate the art sits on is part of
   the image, so it keeps its own background on every theme rather than
   being tinted to match one. */
.rr-masthead {
    margin: 0 0 var(--rr-s4);
}

/* Art stays at its native 380x109 (own file, not scaled); the links
   take the width it leaves empty. Stacks again below 900px. */
.rr-header { display: block; }

@media (min-width: 900px) {
    .rr-header {
        display: flex;
        align-items: stretch;
        gap: var(--rr-s5);
        margin-bottom: var(--rr-s4);
    }
    .rr-header > .rr-masthead { flex: none; margin: 0; }
    .rr-header > .rr-boardbar {
        flex: 1;
        min-width: 0;
        margin: 0;
        padding-bottom: 0;
        border-bottom: 0;
        /* Aligned to the art's own baseline so the links read as a
           caption to it, not a line hanging mid-image. */
        align-content: flex-end;
        align-items: flex-end;
    }
}
/* Stands in for the board's own header when there's no top bar (art
   left, name centred, links full-width below); higher specificity
   than the two-column rules above wins wherever both apply. */
.rr-header[data-rr-stack] {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: var(--rr-s3) var(--rr-s5);
    margin-bottom: var(--rr-s4);
}
.rr-header[data-rr-stack] > .rr-masthead { grid-column: 1; margin: 0; }
.rr-header[data-rr-stack] > .rr-boardname { grid-column: 2; }
/* Full width; its own hairline, not a margin, separates the header
   from the page. */
.rr-header[data-rr-stack] > .rr-boardbar { grid-column: 1 / -1; margin: 0; }

/* Below the width where the art and a centred name still share a
   line, all three stack and the name centres over the art. */
@media (max-width: 760px) {
    .rr-header[data-rr-stack] { grid-template-columns: minmax(0, 1fr); justify-items: center; }
    .rr-header[data-rr-stack] > .rr-masthead,
    .rr-header[data-rr-stack] > .rr-boardname { grid-column: 1; }
}

.rr-boardname { min-width: 0; text-align: center; }
.rr-boardname__title {
    margin: 0;
    font-size: calc(var(--rr-fs) + 7px);
    font-weight: 700;
    line-height: var(--rr-lh-title);
    color: var(--rr-text-strong);
}
/* html[data-rr] needed: the reset's \`html[data-rr] p\` outranks a bare
   class (see csrin-css-cascade), which left this at full text weight. */
html[data-rr] p.rr-boardname__strap {
    margin: 3px 0 0;
    font-size: var(--rr-fs-sm);
    line-height: var(--rr-lh-meta);
    color: var(--rr-muted);
}

.rr-masthead__link {
    display: inline-block;
    border-radius: var(--rr-radius-lg);
    overflow: hidden;
    line-height: 0;
    transition: filter var(--rr-speed) ease;
}
.rr-masthead__link:hover { filter: brightness(1.12); }
.rr-masthead__art {
    display: block;
    width: auto;
    max-width: 100%;
    height: auto;
    border: 0;
}

@media (max-width: 560px) {
    /* 260px: keeps the wordmark legible and the emblem recognisable
       without eating a third of the screen. */
    .rr-masthead__art { width: 260px; }
    .rr-masthead { margin-bottom: var(--rr-s3); }
}


/* ---- An unsent reply --------------------------------------------- */

/* A dot, not a sentence — the button beside it already says "Finish
   your reply"; this only needs to read as waiting for you from across
   the page. */
.rr-reply[data-rr-draft] {
    border-color: color-mix(in srgb, var(--rr-accent) 40%, var(--rr-line));
}
.rr-reply[data-rr-draft] > .rr-btn::after {
    content: "";
    width: 6px;
    height: 6px;
    margin-left: 2px;
    border-radius: 50%;
    background: var(--rr-accent-text);
    opacity: .8;
}


/* ---- Releases ---------------------------------------------------- */

/* A table without a <table>: five columns on one line, the two that
   carry meaning (version, kind) leading, bookkeeping trailing where
   it can be ignored. */
.rr-releases {
    margin: 0 0 var(--rr-post-gap);
    background: var(--rr-surface);
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius-lg);
    overflow: hidden;
}
.rr-releases__head {
    display: flex;
    align-items: center;
    gap: var(--rr-s2);
    flex-wrap: wrap;
    padding: 10px var(--rr-card-pad);
    border-bottom: 1px solid var(--rr-line);
}
/* \`html[data-rr] h3\` outranks \`.rr-releases__head h3\` and kept its
   bottom margin, offsetting the title from the icon/count beside it. */
html[data-rr] .rr-releases__head h3 { margin: 0; font-size: var(--rr-fs); line-height: 1.2; }
html[data-rr] button.rr-releases__toggle {
    display: inline-flex;
    align-items: center;
    gap: var(--rr-s2);
    margin: -4px -6px;
    padding: 4px 6px;
    background: none;
    border: 0;
    border-radius: var(--rr-radius);
    color: inherit;
    font: inherit;
    cursor: pointer;
    transition: background var(--rr-speed) ease;
}
html[data-rr] button.rr-releases__toggle:hover { background: var(--rr-surface-2); }
html[data-rr] .rr-releases__toggle > svg:first-child { color: var(--rr-faint); flex: none; }
.rr-releases[data-rr-folded] .rr-releases__toggle > svg:first-child { transform: rotate(-90deg); }
.rr-releases[data-rr-folded] .rr-releases__controls { display: none; }
.rr-releases[data-rr-folded] .rr-releases__head { border-bottom: 0; }
.rr-releases__body[hidden] { display: none; }
/* Two controls answering the same question (how much of the topic is
   shown) sit together rather than at opposite ends of the card. */
.rr-releases__controls {
    display: flex;
    align-items: center;
    gap: var(--rr-s2);
    margin-left: auto;
    flex-wrap: wrap;
}
.rr-releases__only { padding: 4px 10px; font-size: var(--rr-fs-xs); }
.rr-releases__toggle > svg:nth-child(2) { color: var(--rr-accent); flex: none; }
.rr-releases__count { color: var(--rr-faint); font-size: var(--rr-fs-xs); }

/* This page / all N pages — the same segmented control the settings
   panel uses, for the same kind of choice. */
.rr-releases__scope {
    display: inline-flex;
    padding: 2px;
    gap: 2px;
    background: var(--rr-surface-2);
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius);
}
.rr-releases__tab {
    padding: 4px 10px;
    background: none;
    border: 0;
    border-radius: 4px;
    color: var(--rr-muted);
    font: 600 var(--rr-fs-xs) / 1.4 var(--rr-font);
    cursor: pointer;
    white-space: nowrap;
}
.rr-releases__tab:hover { color: var(--rr-text-strong); }
.rr-releases__tab[aria-selected="true"] { background: var(--rr-surface-3); color: var(--rr-text-strong); }
.rr-releases__tab[aria-busy] { color: var(--rr-accent); cursor: progress; }
.rr-releases__tab:disabled { cursor: progress; }
/* Disabled because there's nothing to page to, not because it's busy —
   still drawn as one of two options so it reads as a control even on
   a single-page topic. */
.rr-releases__tab[data-rr-why] {
    cursor: default;
    color: var(--rr-faint);
    opacity: .65;
}
.rr-releases__tab[data-rr-why]:hover { color: var(--rr-faint); }

.rr-releases__note {
    display: flex;
    align-items: center;
    gap: var(--rr-s3);
    flex-wrap: wrap;
    padding: var(--rr-s2) var(--rr-card-pad);
    background: var(--rr-surface-2);
    border-bottom: 1px solid var(--rr-line);
    font-size: var(--rr-fs-xs);
    color: var(--rr-faint);
}
.rr-releases__note .rr-spacer { flex: 1; }
.rr-releases__read {
    display: flex;
    align-items: center;
    gap: var(--rr-s2);
    flex-wrap: wrap;
}
.rr-releases__read .rr-btn { padding: 3px 8px; font-size: var(--rr-fs-xs); }
.rr-releases__latest {
    padding: 2px 8px;
    border-radius: var(--rr-radius-pill);
    background: color-mix(in srgb, var(--rr-accent) 16%, transparent);
    border: 1px solid color-mix(in srgb, var(--rr-accent) 40%, transparent);
    color: var(--rr-accent);
    font-weight: 700;
}

/* Board was queueing, so the walk paused — phrased as an explanation
   of the wait, not a problem with the answer. */
.rr-releases__eased {
    padding: 2px 8px;
    border-radius: var(--rr-radius-pill);
    border: 1px solid var(--rr-line);
    color: var(--rr-faint);
    font-weight: 600;
}

.rr-releases__stale {
    padding: 2px 8px;
    border-radius: var(--rr-radius-pill);
    background: color-mix(in srgb, var(--rr-warn) 16%, transparent);
    border: 1px solid color-mix(in srgb, var(--rr-warn) 40%, transparent);
    color: var(--rr-warn);
    font-weight: 700;
}

/* Chips (filter) and tags (rows) intentionally share words and colours
   — a flush strip with no edge made the filter row read as the list's
   own first entry, minus its version column. It now takes the head's
   ground and a full hairline instead. */
.rr-releases__filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
    padding: var(--rr-s2) var(--rr-card-pad) 9px;
    background: var(--rr-surface-2);
    border-bottom: 1px solid var(--rr-line-strong);
}
.rr-releases__chip {
    padding: 2px 9px;
    border-radius: var(--rr-radius-pill);
    /* Transparent on the strip's own ground — filled would be a third
       surface for a control that's off. */
    background: transparent;
    border: 1px solid var(--rr-line);
    color: var(--rr-muted);
    font: 600 var(--rr-fs-xs) / 1.6 var(--rr-font);
    cursor: pointer;
    transition: background var(--rr-speed) ease, color var(--rr-speed) ease;
}
/* Chips now take the family colour too (held back off, filled on) —
   they used to be grey while the same word in the rows was coloured,
   with no visible sign of which filter was active. */
.rr-releases__chip[data-family="game"]   { --rr-family: var(--rr-tag-release); }
.rr-releases__chip[data-family="run"]    { --rr-family: var(--rr-warn); }
.rr-releases__chip[data-family="change"] { --rr-family: var(--rr-tag-info); }
.rr-releases__chip[data-family="extra"]  { --rr-family: var(--rr-tag-tutorial); }
.rr-releases__chip[data-family="beside"] { --rr-family: var(--rr-tag-scs); }
.rr-releases__chip[data-family="block"]  { --rr-family: var(--rr-danger); }

.rr-releases__chip[data-family]:not([data-family="other"]) {
    color: color-mix(in srgb, var(--rr-family) 78%, var(--rr-muted));
    border-color: color-mix(in srgb, var(--rr-family) 26%, transparent);
}
.rr-releases__chip:hover { background: var(--rr-surface); color: var(--rr-text-strong); border-color: var(--rr-line-strong); }
.rr-releases__chip[aria-pressed="true"] {
    background: var(--rr-accent-soft);
    border-color: var(--rr-accent);
    color: var(--rr-accent-on-soft, var(--rr-accent));
}
.rr-releases__chip[data-family][aria-pressed="true"] {
    background: color-mix(in srgb, var(--rr-family) 22%, transparent);
    border-color: var(--rr-family);
    color: color-mix(in srgb, var(--rr-family) 84%, var(--rr-text-strong));
    font-weight: 700;
}

.rr-releases__list { margin: 0; padding: 0; list-style: none; max-height: 60vh; overflow-y: auto; }
.rr-releases__row + .rr-releases__row { border-top: 1px solid var(--rr-line); }
.rr-releases__row[hidden] { display: none; }
.rr-releases__link {
    display: flex;
    align-items: baseline;
    gap: var(--rr-s3);
    padding: 9px var(--rr-card-pad);
    color: var(--rr-text);
}
.rr-releases__link:hover { background: var(--rr-surface-2); text-decoration: none; }

/* Three different answers to "which one is this", drawn as three
   different things rather than variants on a version number. */
.rr-releases__version {
    flex: none;
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
    min-width: 9ch;
    font: 700 var(--rr-fs-sm) / 1.4 var(--rr-font-mono);
    color: var(--rr-muted);
    font-variant-numeric: tabular-nums;
}
.rr-releases__version[data-rr-latest] { color: var(--rr-accent); }

/* A build id is not a version and must never read as a bigger one: it
   is labelled, unbolded, and set back. */
.rr-releases__version[data-rr-kind="build"] { color: var(--rr-faint); font-weight: 400; }
.rr-releases__vkind {
    /* --rr-fs-xs, not 9px: 11px is this page's floor everywhere else,
       and a label saying "this is not a version" shouldn't go under it. */
    font: 600 var(--rr-fs-xs) / 1 var(--rr-font);
    letter-spacing: .04em;
    text-transform: uppercase;
    color: var(--rr-faint);
    opacity: .8;
}

/* Nothing at all is an empty state, not stray punctuation. */
.rr-releases__version[data-rr-kind="none"] { color: var(--rr-faint); font-weight: 400; }
.rr-releases__vnone { opacity: .45; }

.rr-releases__tags { display: flex; flex-wrap: wrap; gap: 4px; flex: 1; min-width: 0; }
.rr-releases__tag {
    padding: 0 7px;
    border-radius: var(--rr-radius-pill);
    background: var(--rr-surface-2);
    border: 1px solid var(--rr-line);
    color: var(--rr-muted);
    font: 600 var(--rr-fs-xs) / 1.7 var(--rr-font);
    white-space: nowrap;
}
/* Six families cover all eleven kinds finder.js knows; releases.js
   assigns the family and a test enforces every kind has one — five
   used to be coloured and six grey, which read as an incomplete
   taxonomy rather than a deliberate one. */
.rr-releases__tag[data-family="game"]   { --rr-family: var(--rr-tag-release); }
.rr-releases__tag[data-family="run"]    { --rr-family: var(--rr-warn); }
.rr-releases__tag[data-family="change"] { --rr-family: var(--rr-tag-info); }
.rr-releases__tag[data-family="extra"]  { --rr-family: var(--rr-tag-tutorial); }
.rr-releases__tag[data-family="beside"] { --rr-family: var(--rr-tag-scs); }
.rr-releases__tag[data-family="block"]  { --rr-family: var(--rr-danger); }

.rr-releases__tag[data-family]:not([data-family="other"]) {
    /* Ink lifted toward the theme's own extreme, like the topic prefix
       tags — the hue alone on a 14% tint is under 4.5:1 at 12px. */
    color: color-mix(in srgb, var(--rr-family) 84%, var(--rr-text-strong));
    background: color-mix(in srgb, var(--rr-family) 14%, transparent);
    border-color: color-mix(in srgb, var(--rr-family) 32%, transparent);
}

.rr-releases__who { flex: none; font-size: var(--rr-fs-xs); color: var(--rr-muted); max-width: 18ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rr-releases__when { flex: none; font-size: var(--rr-fs-xs); color: var(--rr-faint); white-space: nowrap; }
.rr-releases__page {
    flex: none;
    min-width: 4ch;
    text-align: right;
    font: 600 var(--rr-fs-xs) / 1.4 var(--rr-font-mono);
    color: var(--rr-faint);
}
.rr-releases__empty { margin: 0; padding: var(--rr-s3) var(--rr-card-pad); color: var(--rr-faint); font-size: var(--rr-fs-sm); }

@media (max-width: 720px) {
    /* Two lines: what it is, then who and where — the five-column row
       is 620px wide with no honest way to fit it. */
    .rr-releases__link { flex-wrap: wrap; row-gap: 4px; }
    .rr-releases__tags { flex-basis: 100%; order: 3; }
    .rr-releases__who { order: 4; }
    .rr-releases__when { order: 5; }
    .rr-releases__page { order: 6; margin-left: auto; }
    .rr-releases__controls { margin-left: 0; flex-basis: 100%; }
    /* Each segmented control gets its own full row — side by side,
       "Newest first" wrapped onto two lines and the row went ragged. */
    .rr-releases__scope,
    .rr-releases__order { flex: 1 1 100%; }
    .rr-releases__tab,
    .rr-releases__order button { flex: 1; }
    .rr-releases__read { flex-basis: 100%; }
}

/* "Only posts with links" (finder.js) reaches the panel's rows too. */
.rr-releases__row[data-rr-nolink] { display: none; }

/* ---- The archive password ----------------------------------------- */

/* Read off the post by finder.js, offered where the post's other
   controls are — where a reader is already looking. */
html[data-rr] button.rr-pass {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 25px;
    padding: 0 8px;
    background: var(--rr-accent-soft);
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius-pill);
    color: var(--rr-text-strong);
    cursor: pointer;
    font: 500 var(--rr-fs-xs) / 1 var(--rr-font);
}
html[data-rr] button.rr-pass:hover { border-color: var(--rr-accent); }
.rr-pass__label { color: var(--rr-muted); }
.rr-pass__value { font-family: var(--rr-font-mono); font-size: var(--rr-fs-xs); }

/* ---- New since your last visit ------------------------------------ */

/* The divider a mail client draws, in a thread that has none — this
   browser knows which post was newest here last time. */
.rr-since {
    display: flex;
    align-items: center;
    gap: var(--rr-s3);
    margin: var(--rr-post-gap) 0;
    color: var(--rr-accent);
    font: 600 var(--rr-fs-xs) / 1 var(--rr-font);
}
.rr-since::before,
.rr-since::after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--rr-accent);
    opacity: .45;
}
.rr-since__label { white-space: nowrap; }

/* ---- Which host a release is on ----------------------------------- */

.rr-releases__hosts { display: inline-flex; flex-wrap: wrap; gap: 4px; }
.rr-releases__host {
    padding: 1px 7px;
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius-pill);
    color: var(--rr-muted);
    font-size: var(--rr-fs-xs);
    white-space: nowrap;
}
.rr-releases__host--more { color: var(--rr-faint); }

/* ---- Looking inside a topic from the palette ---------------------- */

/* Lives in the overlay, not the panel — the panel clips its own
   corners, and a sibling there would push the list sideways the
   moment one opened. Anchored off the palette's own centre line and
   640px width; its top matches .rr-palette's margin-top so the two
   read as one object with a gap in it. */
html[data-rr] .rr-overlay > .rr-preview {
    position: absolute;
    top: 12vh;
    left: 50%;
    margin-left: calc(320px + var(--rr-s3));
    /* Can't be a fixed 340px: anchored off the centre line, a fixed
       width ran 150px past a 1040px window's edge. min() instead;
       344 not 332 because vw counts the scrollbar and the overlay's
       own 50% does not. */
    width: min(340px, calc(50vw - 344px));
    max-height: min(60vh, 520px);
    overflow-y: auto;
    box-sizing: border-box;
    padding: var(--rr-s4);
    background: var(--rr-surface);
    border: 1px solid var(--rr-line-strong);
    border-radius: var(--rr-radius-lg);
    box-shadow: var(--rr-shadow-pop);
    color: var(--rr-text);
    font-size: var(--rr-fs-sm);
    line-height: var(--rr-lh);
}
/* Below 1200px the formula above bottoms out under a usable column
   (~256px, still a title and four lines of a post), so the pane is
   hidden instead — preview.js checks the same width before fetching. */
@media (max-width: 1199px) {
    html[data-rr] .rr-overlay > .rr-preview { display: none; }
}

html[data-rr] .rr-preview__art {
    display: block;
    width: 100%;
    height: auto;
    max-height: 150px;
    object-fit: cover;
    margin-bottom: var(--rr-s3);
    border-radius: var(--rr-radius);
    background: var(--rr-surface-2);
}
html[data-rr] .rr-preview__title {
    color: var(--rr-text-strong);
    font-size: var(--rr-fs);
    font-weight: 650;
    line-height: 1.35;
}
html[data-rr] .rr-preview__meta,
html[data-rr] .rr-preview__by {
    margin-top: 3px;
    color: var(--rr-faint);
    font-size: var(--rr-fs-xs);
}
html[data-rr] .rr-preview__blurb {
    margin: var(--rr-s3) 0 0;
    color: var(--rr-muted);
}
html[data-rr] .rr-preview__foot {
    margin-top: var(--rr-s3);
    padding-top: var(--rr-s2);
    border-top: 1px solid var(--rr-line);
    color: var(--rr-faint);
    font-size: var(--rr-fs-xs);
}
/* Shown both while the page loads and if it never arrives. */
html[data-rr] .rr-preview__wait { color: var(--rr-faint); font-size: var(--rr-fs-xs); }

/* == responsive.css == */
/* Mobile. The forum ships no viewport meta and lays out in fixed tables,
   so on a phone it's a horizontal scroll of 11px text — the script
   injects the viewport tag and these rules unpack the tables. Layout
   modules tag cells with data-rr-col so rules below can target them
   directly instead of guessing at :nth-child. */

@media (max-width: 860px) {
    html[data-rr] .rr-topicbar .rr-opt { display: none; }

    /* A profile/control-panel form right-aligns labels against the value
       in the next cell; stacked, the label sat at the right edge above a
       left-aligned value — read as a column they belong on the same
       side. */
    html[data-rr] #wrapcentre td[align="right"]:not([data-rr-col]) { text-align: left; }

    /* A checkbox-then-words form row stacked into two lines; !important
       because the generic table rules above carry a class more than
       this attribute and would stack it again. */
    html[data-rr] #wrapcentre tr[data-rr-check-row] {
        display: flex !important;
        align-items: center;
        gap: 6px;
    }
    html[data-rr] #wrapcentre tr[data-rr-check-row] > td {
        display: block !important;
        width: auto !important;
        padding: 4px 0 !important;
    }

    html[data-rr] table[data-rr-palette] { width: auto; max-width: 100%; }

    /* Content width is a desktop setting; on a phone the window is the
       constraint regardless. */
    html[data-rr] { --rr-content-max: 100%; --rr-measure: none; }

    html[data-rr] #wrapcentre,
    html[data-rr] #wrapfooter { padding-left: var(--rr-s3); padding-right: var(--rr-s3); }
    html[data-rr] #wrapcentre { padding-top: var(--rr-s3); }

    html[data-rr] .rr-nav { padding: 0 var(--rr-s2); gap: var(--rr-s2); }
    /* The wordmark is 10x as wide as tall, so a couple px off its height
       is 20px of a 390px bar. */
    html[data-rr] .rr-nav__logo { height: 12px; }
    html[data-rr] .rr-nav__brand { height: 34px; padding-right: var(--rr-s2); }

    /* Prefix chips are a filter here, not a title label: 18px is a fine
       badge and a poor thumb target. */
    html[data-rr] .rr-toolbar__tags .rr-tag,
    html[data-rr] .rr-toolbar__quick .rr-tag { height: 26px; padding: 0 10px; }
    /* Collapsed to a bare glyph, this kept the desktop pill's bordered
       sunken frame, drawing as a boxed field beside two borderless icon
       buttons — three controls opening the same kind of thing in two
       different styles. Takes the icon button's look instead, sized to
       match the tap targets below. */
    html[data-rr] .rr-nav__search {
        min-width: 0;
        width: 34px;
        height: 34px;
        padding: 0;
        justify-content: center;
        box-sizing: border-box;
        background: transparent;
        border-color: transparent;
    }
    html[data-rr] .rr-nav__search:hover {
        background: var(--rr-surface-2);
        border-color: transparent;
        color: var(--rr-text-strong);
    }
    html[data-rr] .rr-nav__search svg { width: 16px; height: 16px; }
    html[data-rr] .rr-nav__search span,
    html[data-rr] .rr-nav__kbd { display: none; }

    /* subsilver2 nests unclassed layout tables inside the data tables
       (pagination strips, button rows, the profile block); each keeps a
       table's intrinsic minimum width, so these are unpacked too. */
    html[data-rr] #wrapcentre table:not(.tablebg):not(.forumline),
    html[data-rr] #wrapcentre table:not(.tablebg):not(.forumline) > tbody,
    html[data-rr] #wrapcentre table:not(.tablebg):not(.forumline) > tbody > tr,
    html[data-rr] #wrapcentre table:not(.tablebg):not(.forumline) > tbody > tr > td {
        display: block;
        width: auto !important;
        max-width: 100%;
    }

    /* Tables become stacked blocks. overflow stays visible: with rows as
       flex containers, hiding it clips any cell that wraps to a second
       line. */
    html[data-rr] table.tablebg,
    html[data-rr] table.forumline { display: block; overflow: visible; }
    html[data-rr] table.tablebg > tbody,
    html[data-rr] table.forumline > tbody { display: block; }
    html[data-rr] table.tablebg > tbody > tr,
    html[data-rr] table.forumline > tbody > tr {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 2px var(--rr-s2);
        padding: var(--rr-s3);
        border-bottom: 1px solid var(--rr-line);
    }
    html[data-rr] table.tablebg > tbody > tr > td,
    html[data-rr] table.forumline > tbody > tr > td {
        display: block;
        width: auto !important;
        /* Flex items default to min-width:auto, refusing to shrink below
           the widest word — a long list item would set the page width. */
        min-width: 0;
        max-width: 100%;
        /* The template pins cells with height="30": a minimum on a table
           cell, but the height on a block, so content simply overflows
           it — the index's Statistics block drew its last lines below
           its own card, over the next one. */
        height: auto;
        padding: 0;
        border: 0;
        background: none;
    }
    /* Column headers mean nothing once the columns are gone; the row
       goes with them or it leaves a padded empty band. */
    html[data-rr] table.tablebg > tbody > tr > th { display: none; }
    html[data-rr] table.tablebg > tbody > tr:has(> th):not(:has(> td)) { display: none; }

    /* Topic/forum rows as cards: marker and title share the first line
       (the marker used to sit alone with the title forced under it),
       the description sits under the title in the small muted face, the
       counters are one quiet line with no boxes, and last-post is a
       line of text rather than a full-width bar. */
    /* Written through table.tablebg > tbody > tr > td[...]: the generic
       cell rules above are that specific, and a plain td[data-rr-col]
       lost its min-width to their min-width:0. */
    html[data-rr] table.tablebg > tbody > tr > td[data-rr-col="icon"] {
        order: 0;
        flex: 0 0 auto;
        width: auto !important;
        display: flex !important;
        align-items: center;
        gap: 6px;
        padding: 0 !important;
        margin-top: 4px;
    }
    html[data-rr] table.tablebg > tbody > tr > td[data-rr-col="title"] {
        order: 0;
        /* Zero basis, not auto: auto is the title's own width, and a
           long title takes the whole row, putting it under the marker
           again. From zero it grows into whatever the marker leaves —
           at most 80%, so nothing else can share this line. */
        flex: 1 1 0%;
        min-width: 80%;
    }
    html[data-rr] td[data-rr-col="title"] a.topictitle,
    html[data-rr] td[data-rr-col="title"] a.forumlink { font-weight: 600; line-height: 1.35; }
    html[data-rr] td[data-rr-col="title"] p.forumdesc,
    html[data-rr] td[data-rr-col="title"] p.gensmall {
        display: block;
        margin: 3px 0 0;
        font-size: var(--rr-fs-xs);
        color: var(--rr-muted);
        line-height: 1.45;
    }
    html[data-rr] table.tablebg > tbody > tr > td[data-rr-col="replies"],
    html[data-rr] table.tablebg > tbody > tr > td[data-rr-col="views"],
    html[data-rr] table.tablebg > tbody > tr > td[data-rr-col="author"],
    html[data-rr] table.tablebg > tbody > tr > td[data-rr-col="topics"],
    html[data-rr] table.tablebg > tbody > tr > td[data-rr-col="posts"] {
        order: 2;
        flex: 0 0 auto;
        font-size: var(--rr-fs-xs);
        color: var(--rr-muted);
        background: none !important;
        padding: 0 !important;
        border-radius: 0;
        margin-top: 2px;
    }
    html[data-rr] table.tablebg > tbody > tr > td[data-rr-col="last"] {
        order: 3;
        flex: 1 1 100%;
        font-size: var(--rr-fs-xs);
        color: var(--rr-faint);
        background: none !important;
        padding: 0 !important;
        margin-top: 2px;
    }
    html[data-rr] td[data-rr-col="last"] .rr-lastpost { color: var(--rr-faint); }
    html[data-rr] td[data-rr-col] p { display: inline; margin: 0; }

    /* Category rows and one-link bands read as a header, not a card. The
       fold control goes to the far end; the accent mark is drawn inside
       the cell's padding on desktop, so here — where the cell has none —
       the row carries it instead. */
    html[data-rr] tr[data-rr-cat-row] { padding: 8px 14px !important; align-items: center !important; }
    html[data-rr] tr[data-rr-cat-row] > td.cat::before,
    html[data-rr] tr[data-rr-cat-row] > td.row3[data-rr-section]::before { display: none; }
    html[data-rr] tr[data-rr-cat-row] > td.cat,
    html[data-rr] tr[data-rr-cat-row] > td.row3[data-rr-section] { padding-left: 0 !important; }
    html[data-rr] tr[data-rr-cat-row=""],
    html[data-rr] tr[data-rr-cat-row="section"] { box-shadow: inset 3px 0 0 var(--rr-accent); }
    html[data-rr] tr[data-rr-cat-row] > td.catdiv { margin-left: auto; }
    html[data-rr] tr[data-rr-cat-row] > td.cat[data-rr-cat="plain"] { margin-left: auto; font-size: var(--rr-fs-xs); }
    /* A message folder's date and checkbox had no order and led the
       card, ahead of the subject. */
    html[data-rr] tr[data-rr-pm-row] > td[data-rr-col="date"] { order: 3; font-size: var(--rr-fs-xs); color: var(--rr-muted); }
    html[data-rr] td[data-rr-col="mark"] { order: 4; }

    /* The template (and its stylesheet) pins several cells nowrap; on a
       390px screen a single unbreakable "Wednesday, 02 Sep 2026, 23:04"
       is the whole horizontal scrollbar. */
    html[data-rr] #wrapcentre :where(td, th, p, span, div, li, ul, ol, dd, dt, b, strong, i, em, a),
    html[data-rr] [nowrap] { white-space: normal !important; }
    html[data-rr] #wrapcentre :where(pre, code, .code) { white-space: pre !important; }
    html[data-rr] p.forumdesc { display: block; }
    html[data-rr] td[data-rr-col="replies"]::before { content: "replies "; color: var(--rr-faint); }
    html[data-rr] td[data-rr-col="views"]::before { content: "views "; color: var(--rr-faint); }
    html[data-rr] td[data-rr-col="topics"]::before { content: "topics "; color: var(--rr-faint); }
    html[data-rr] td[data-rr-col="posts"]::before { content: "posts "; color: var(--rr-faint); }
    html[data-rr] td[data-rr-col="last"] br { display: none; }

    /* Posts: the 150px author column becomes a header strip, except
       where the post header already replaced it (forum.css hides it
       under data-rr-posts="modern") — the !important here was bringing
       it back under the header, with the two-language rank and weekday
       date the header already shows. */
    html[data-rr]:not([data-rr-posts="modern"]) td.profile { display: flex !important; align-items: center; gap: var(--rr-s2); }
    html[data-rr] td.profile table { width: auto !important; }
    html[data-rr] td.profile img[src*="/avatars/"],
    html[data-rr] td.profile img.avatar { width: 32px !important; height: 32px !important; border-radius: 50%; }
    html[data-rr] .postbody { max-width: none; }
    html[data-rr] .postbody img { max-width: 100% !important; height: auto !important; }

    /* Long unbreakable strings (links, hashes) must not widen the page. */
    html[data-rr] .postbody,
    html[data-rr] .code,
    html[data-rr] blockquote { overflow-wrap: anywhere; }
    html[data-rr] .code { max-width: 100%; }

    html[data-rr] .rr-game { grid-template-columns: 1fr; }
    html[data-rr] .rr-panel { width: 100vw; border-left: 0; }
    html[data-rr] .rr-palette { margin-top: 6vh; max-height: 76vh; }
    html[data-rr] .rr-sheet dl { grid-template-columns: 1fr; }
    html[data-rr] .rr-sheet dt { text-align: left; }
    html[data-rr] .rr-fab { right: var(--rr-s2); bottom: var(--rr-s2); }

    /* The print / previous-topic / next-topic strip is a nested table
       that doesn't survive the column collapse; the action bar above
       already covers moving around on a phone. */
    html[data-rr] tr:has(> td.cat > table) { display: none; }

    /* A folded reply stays one line: the blanket rules above unpack a
       post's cells into blocks that wrap anywhere, which undoes the
       fold. #wrapcentre appears in both selectors because an id
       outranks any number of classes even under !important — a
       class-only rule here silently lost to the blanket ones and the
       fold applied on neither phone case. */
    html[data-rr] #wrapcentre table.tablebg[data-rr-quiet] td:has(> .postbody) {
        display: flex !important;
        align-items: baseline;
        gap: var(--rr-s2);
    }
    html[data-rr] #wrapcentre table.tablebg[data-rr-quiet] .postbody {
        min-width: 0;
        overflow: hidden;
        /* !important against !important: the blanket rule above forces
           white-space:normal everywhere (stopping the board's own nowrap
           from widening a phone), and this is the deliberate exception
           for one state of one node. */
        white-space: nowrap !important;
        text-overflow: ellipsis;
    }

    /* "Sort by:" broke across two lines around its own select under the
       blanket nowrap-reset rule; #wrapcentre + !important beats it the
       same way the folded reply does, and a handful of words can't
       widen the page. */
    html[data-rr] #wrapcentre td.cat > span.gensmall { white-space: nowrap !important; }

    html[data-rr] .rr-icon-btn { width: 34px; height: 34px; }
    html[data-rr] td[data-rr-col="title"] a.topictitle { line-height: 1.45; }
}

@media (max-width: 480px) {
    html[data-rr] { --rr-fs: 15px; }

    /* Once the bar wraps, the divider before the board search separates
       nothing. */
    html[data-rr] .rr-toolbar__board {
        border-left: 0;
        padding-left: 0;
        flex: 1 1 100%;
        min-width: 0;
    }
    html[data-rr] .rr-toolbar__board .rr-search,
    html[data-rr] .rr-topicbar__search .rr-search { flex: 1; min-width: 0; width: 100%; }

    /* The search scope is printed inside the field on desktop; here the
       field is barely wide enough for the query, so the glyph stands
       alone and the scope name moves into its popover. */
    html[data-rr] .rr-search__where { display: none; }
    html[data-rr] button.rr-search__opts { padding: 0; min-width: 26px; }

    html[data-rr] .rr-nav__crumbs a:not(:last-child),
    html[data-rr] .rr-nav__sep { display: none; }
    html[data-rr] .rr-toolbar { padding: var(--rr-s3); }

    /* The topic bar's nine controls plus search box became five wrapped
       rows before the first post; the gap that separates them on one
       wide line is instead five gaps stacked, so it's tightened here
       only. */
    html[data-rr] .rr-topicbar { gap: var(--rr-s1) var(--rr-s2); }
    html[data-rr] .rr-topicbar .rr-btn { padding: 6px 10px; }
    html[data-rr] .rr-topicbar__search { flex: 1 1 100%; }
    html[data-rr] .rr-topicbar__search form { flex-wrap: wrap; }
}

/* Print: drop the script chrome entirely. */
@media print {
    /* The skip link too: fixed-position elements are drawn on every
       printed sheet, so a printed thread came out with an orange "Skip
       to content" tab at the head of each page. */
    .rr-nav, .rr-fab, .rr-toolbar, .rr-progress, .rr-toasts, .rr-posttools, .rr-skip,
    .rr-sig-toggle { display: none !important; }
    html[data-rr] body { background: #fff; color: #000; }

    /* A collapsed signature hides its content outright rather than
       clipping it, so it was the one fold still shut on paper. */
    html[data-rr] [data-rr-sig="collapsed"] { display: block !important; }

    /* Every other fold gets undone too: a clipped quote or short reply
       is an affordance ("there's more, click here") and paper has no
       click, so printing came out with quotes cut mid-sentence and
       replies clipped to one line, controls and all. */
    html[data-rr] [data-rr-quote="folded"] {
        max-height: none !important;
        -webkit-mask-image: none !important;
                mask-image: none !important;
    }
    /* Carries #wrapcentre for the same reason the narrow-screen rules
       do: printing from a phone-width window puts both media queries in
       play, and without the id this loses to the fold it's undoing. */
    html[data-rr] table.tablebg[data-rr-quiet] { opacity: 1 !important; }
    html[data-rr] table.tablebg[data-rr-quiet] > tbody > tr { display: table-row !important; }
    html[data-rr] #wrapcentre table.tablebg[data-rr-quiet] td:has(> .postbody) { display: table-cell !important; }
    html[data-rr] #wrapcentre table.tablebg[data-rr-quiet] .postbody {
        display: block !important;
        max-height: none !important;
        max-width: none !important;
        overflow: visible !important;
        white-space: normal !important;
        text-overflow: clip !important;
        font-size: inherit !important;
        color: inherit !important;
    }
    html[data-rr] table.tablebg[data-rr-quiet] .postbody br { display: inline !important; }
    .rr-quote-toggle, .rr-quiet-chip, .rr-sig-toggle, .rr-quote-bubble { display: none !important; }
}

/* The listing card's marker gutter. It holds the read/unread dot and, on
   a bookmarkable row, the star (lists.js, addBookmarkStar). Beside the
   dot the star's 34px tap target pushed the title under its own 80%
   minimum, dropping it to its own line under a line that was just a dot
   and a star — so the star moves to the card's top-right corner instead,
   out of the gutter's width. */
@media (max-width: 860px) {
    html[data-rr] table.tablebg > tbody > tr { position: relative; }

    /* forum.css floors this cell at 44px (right for a column, too wide
       for a card). Repeating the phone selector here — same specificity,
       later, so it wins — drops the floor to the dot's own width. The
       star, still a child of this cell, needs align-self/min-height so
       its absolutely positioned box stays inside this one; align-items
       then puts the dot at the top of that taller box, beside the
       title's first line rather than centred against a wrapped title. */
    html[data-rr] table.tablebg > tbody > tr > td[data-rr-col="icon"] {
        min-width: 0;
        align-self: flex-start;
        align-items: flex-start;
    }
    /* Only a row with a star needs the star's height; without one the
       34px pushed a message folder's second line 20px down. */
    html[data-rr] table.tablebg > tbody > tr[data-rr-star] > td[data-rr-col="icon"] { min-height: 34px; }
    /* The star's containing block is the row (made position:relative
       above), not this cell, so top/right are relative to the row's
       corner regardless of where the cell sits. */
    html[data-rr] table.tablebg > tbody > tr > td[data-rr-col="icon"] > .rr-star {
        position: absolute;
        top: 0;
        right: 0;
        margin: 0;
    }

    /* Room for the star's corner, on rows that carry one — matches the
       generic cell rule's specificity above, which otherwise sets this
       padding to 0. min-width drops the 80% title floor: that floor
       keeps counters off the marker's line, but 80% of 390px and of
       860px are different numbers, and at 390px it tipped the title
       itself onto its own line. The spacer below does that job instead. */
    html[data-rr] table.tablebg > tbody > tr[data-rr-star] > td[data-rr-col="title"] {
        min-width: 0;
        padding-right: 40px;
    }

    /* An invisible flex item between the marker/title group and the
       counters, whose own 100% basis always starts a fresh line — so
       counters land under the title regardless of either side's actual
       width. Sturdier than sizing the title to leave "enough" room,
       which is exactly the arithmetic that went stale at 390px. */
    html[data-rr] table.tablebg > tbody > tr[data-rr-star]::before {
        content: "";
        order: 1;
        flex-basis: 100%;
        width: 0;
        height: 0;
    }
}

/* The topic foot (search-this-topic / display-options strip, jump-to
   box, floating buttons) was left to inline flow — a <span> and a
   <select> as plain siblings — which reads differently per browser:
   Chrome stacked the search input full width with "Search" centred
   under it; Safari wrapped the label letter by letter in the sliver the
   input's own floor (forum.css, min-width: min(100%, 22em)) left beside
   it. An explicit flex row doesn't depend on the flow. */
@media (max-width: 860px) {
    /* The controls cell holds one or two forms: the search box on a
       topic page, and always the "Display posts / Sort by / Go" strip —
       direct children on a search-results page, wrapped in
       form[name=viewtopic] on a topic page. Flexing the cell lays out
       whichever shape is there; the search box takes the whole first
       line so the display form always starts fresh under it. */
    html[data-rr] td.cat[data-rr-cat="controls"] {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px 10px;
    }
    html[data-rr] td.cat[data-rr-cat="controls"] > #search-box_thread {
        flex: 1 1 100%;
    }
    html[data-rr] td.cat[data-rr-cat="controls"] #search-box_thread form {
        display: flex;
        gap: 6px;
    }
    /* Without this the search field's own floor takes the whole line
       and pushes its button under it — the Chrome half of the bug. */
    html[data-rr] td.cat[data-rr-cat="controls"] #search-box_thread input[type="text"] {
        flex: 1 1 auto;
        min-width: 0 !important;
    }
    html[data-rr] td.cat[data-rr-cat="controls"] #search-box_thread input[type="submit"] {
        flex: 0 0 auto;
    }
    html[data-rr] td.cat[data-rr-cat="controls"] > form[name="viewtopic"] {
        flex: 1 1 100%;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px 10px;
    }
    html[data-rr] td.cat[data-rr-cat="controls"] > span.gensmall,
    html[data-rr] td.cat[data-rr-cat="controls"] > form[name="viewtopic"] > span.gensmall {
        white-space: nowrap;
    }
    html[data-rr] td.cat[data-rr-cat="controls"] > select,
    html[data-rr] td.cat[data-rr-cat="controls"] > form[name="viewtopic"] > select {
        flex: 0 1 auto;
        min-width: 0;
    }
    html[data-rr] td.cat[data-rr-cat="controls"] > input[type="submit"],
    html[data-rr] td.cat[data-rr-cat="controls"] > form[name="viewtopic"] > input[type="submit"] {
        flex: 0 0 auto;
    }

    /* form[name=jumpbox]'s label/select/Go are inline content of one
       unclassed cell that the unpacking rules above turn into a block,
       wrapping on their own. The extra :not()s match the specificity of
       the rule they override (both carry #wrapcentre + !important, so
       the tie breaks on class count). wrap, not nowrap: on the
       search-results page this form sits beside an uncleared floated
       sibling, well under 342px — a select sizes to its longest option,
       so \`flex: 1 1 auto\` wrapped Go away alone; a 0% basis asks only
       for the 6em floor. */
    html[data-rr] #wrapcentre form[name="jumpbox"] table:not(.tablebg):not(.forumline) > tbody > tr > td {
        display: flex !important;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }
    html[data-rr] #wrapcentre form[name="jumpbox"] span.gensmall { white-space: nowrap; flex: 0 0 auto; }
    html[data-rr] #wrapcentre form[name="jumpbox"] select { flex: 1 1 0%; min-width: 6em; }
    html[data-rr] #wrapcentre form[name="jumpbox"] input[type="submit"] { flex: 0 0 auto; }

    /* The fixed back-to-top button sits over whatever is at the true
       bottom of the page — "Powered by phpBB", or Who's-online's corner
       — and it's meant to be reached, so the page gets extra room
       instead: enough for a 38px button 8px off the edge plus a hand's
       width of air. body.ltr carries a class the plain-body rule above
       doesn't, so it's the one that would otherwise win this tie. */
    html[data-rr] body,
    html[data-rr] body.ltr { padding-bottom: 64px; }
}

@media (max-width: 860px) {
    /* The sort strip ("Display posts / Sort by / Go") is the last row
       of the same table.tablebg the list renders in, so it inherited
       that table's rounded card and read as bolted onto the last
       result. lists.js (markShapes) now carries the cell's "controls"
       kind onto the row, so the clearing gap lives on the row instead of
       fighting the cell's own padding. #wrapcentre: beats the generic
       tr rule two blocks up on any shared property, kept as a habit
       since the tighter search-page rule below does set margin. */
    html[data-rr] #wrapcentre tr[data-rr-cat-row="controls"] {
        margin-top: var(--rr-s2);
    }

    /* The cell, and — on a topic page sharing its row with the topic
       search box — the sort form one level down. Flex items ignore
       float, which also stops that search box eating into the sort
       form's line, the other half of the old ragged wrap. */
    html[data-rr] #wrapcentre td.cat[data-rr-cat="controls"],
    html[data-rr] #wrapcentre td.cat[data-rr-cat="controls"] > form {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: var(--rr-s2) var(--rr-s3);
    }
    html[data-rr] #wrapcentre td.cat[data-rr-cat="controls"] > form { flex: 1 1 100%; }

    /* The message folder's export/mark controls: two floated divs in the
       same cell, spilling over the sort form under them — two full-width
       flex rows instead. */
    html[data-rr] #wrapcentre td.cat[data-rr-cat="controls"] > div[style*="float"] {
        float: none !important;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--rr-s2);
        flex: 1 1 100%;
    }
    html[data-rr] #wrapcentre td.cat[data-rr-cat="controls"] > div[style*="float"] > select { flex: 1 1 auto; min-width: 0; }
    /* The topic search box: a row of its own, input taking what the
       button leaves. */
    html[data-rr] #wrapcentre td.cat[data-rr-cat="controls"] > #search-box_thread { flex: 1 1 100%; margin: 0; }
    html[data-rr] #search-box_thread form { display: flex; }
    html[data-rr] #wrapcentre td.cat[data-rr-cat="controls"] #search-box_thread input[type="text"] {
        flex: 1 1 auto !important;
        width: auto !important;
        min-width: 0 !important;
    }

    /* The results footer's own inline float, meant to be cleared by a
       bare <br> — but #wrapcentre > br is dropped elsewhere as
       decorative spacing, silently undoing the one place clearing it
       mattered. Off the float, the match count is its own line and the
       jump box stops fighting the float for room. */
    html[data-rr] #wrapcentre > div.gensmall[style*="float"],
    html[data-rr] #wrapcentre > div.nav[style*="float"] {
        float: none !important;
        margin: 0 0 var(--rr-s2);
    }

    /* The jump-to box: label, forum <select> and Go in one unstyled
       <td>, unpacked into three stacked lines. !important twice: the
       table-unpacking rule above reaches this same td through one more
       attribute selector and would undo both the row and the width the
       select needs to flex. */
    html[data-rr] #wrapcentre form[name="jumpbox"] td {
        display: flex !important;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px var(--rr-s2);
        width: 100% !important;
    }
    html[data-rr] #wrapcentre form[name="jumpbox"] span.gensmall { white-space: nowrap; }
    /* flex-basis 0, not auto: auto reserves the select's own preferred
       width (Chromium sizes it to the widest option, not the one
       showing) before the row splits into a line at all, wider than the
       row and pushing Go onto its own line. From zero the select grows
       into whatever the label and Go leave it. */
    html[data-rr] #wrapcentre form[name="jumpbox"] select { flex: 1 1 0%; min-width: 0; }
    html[data-rr] #wrapcentre form[name="jumpbox"] input[type="submit"] { flex: none; }
}

@media (max-width: 860px) {
    /* Drawn flush with a hairline and the card's own footer tone, the
       sort strip reads as the card's foot rather than a panel dropped
       into the last result. */
    html[data-rr] #wrapcentre tr[data-rr-cat-row="controls"] {
        margin-top: var(--rr-s2);
        padding: 10px 12px !important;
        border-top: 1px solid var(--rr-line);
        background: var(--rr-surface-2);
    }
    html[data-rr] #wrapcentre tr[data-rr-cat-row="controls"] > td.cat[data-rr-cat="controls"] {
        background: transparent;
        padding: 0;
        margin: 0;
        border-radius: 0;
    }
}

/* The phone's rhythm: one system for spacing across the whole layout —
   12px between any two cards and 14px inside them, every menu a grid
   rather than wrapped soup, a table that's a menu drawn as a menu,
   controls sharing the corners of the box they sit in. */
@media (max-width: 860px) {
    /* Air between cards: two tables back to back, a form after a table,
       the reply box, Who's online — 12px, always. */
    html[data-rr] #wrapcentre > table.tablebg + table.tablebg,
    html[data-rr] #wrapcentre > table.tablebg + form,
    html[data-rr] #wrapcentre > form + table.tablebg,
    html[data-rr] #wrapcentre > .rr-online { margin-top: var(--rr-s3); }
    html[data-rr] .rr-reply { margin-bottom: var(--rr-s3); }
    /* The permissions notice sits straight after the jump-to form with
       no gap at all — the one seam on the page that measured 0px. */
    html[data-rr] #wrapcentre table[data-rr-after-jump] { margin-top: var(--rr-s3); }
    html[data-rr] .rr-game { padding: 14px; }
    /* "Delete all board cookies | The team" is a bare span between two
       cards; a line of its own, quiet. */
    html[data-rr] #wrapcentre > span.gensmall {
        display: block;
        margin: var(--rr-s3) var(--rr-s1);
        font-size: var(--rr-fs-xs);
        color: var(--rr-faint);
    }
    /* Air inside cards: a card's padding, not a table cell's. */
    html[data-rr] table.tablebg > tbody > tr,
    html[data-rr] table.forumline > tbody > tr { padding: 14px; gap: 4px var(--rr-s2); }

    /* A listing card's second line reads who, then how much; the author
       led the counters on the desktop table and here sat between them. */
    html[data-rr] table.tablebg > tbody > tr > td[data-rr-col="author"] { order: 2; }
    html[data-rr] table.tablebg > tbody > tr > td[data-rr-col="replies"],
    html[data-rr] table.tablebg > tbody > tr > td[data-rr-col="views"],
    html[data-rr] table.tablebg > tbody > tr > td[data-rr-col="topics"],
    html[data-rr] table.tablebg > tbody > tr > td[data-rr-col="posts"] { order: 3; }
    html[data-rr] table.tablebg > tbody > tr > td[data-rr-col="last"] { order: 4; }

    /* A roster card (member list, Who's online): name first in the
       reading face, then rank/join date/count as one quiet line, then
       controls on their own line. The running number goes — it counts
       nothing a phone shows — and the template's empty e-mail/website
       cells go with it. */
    html[data-rr] table.tablebg[data-rr-roster] > tbody > tr { align-items: center; gap: 2px var(--rr-s3); }
    html[data-rr] table.tablebg[data-rr-roster] > tbody > tr > td[data-rr-col="num"],
    html[data-rr] table.tablebg[data-rr-roster] > tbody > tr > td[data-rr-empty] { display: none !important; }
    html[data-rr] table.tablebg[data-rr-roster] > tbody > tr > td[data-rr-col="author"] {
        order: -1;
        flex: 0 1 auto;
        font-size: var(--rr-fs);
        font-weight: 600;
        color: var(--rr-text-strong);
    }
    /* The rank beside the name, then a break: the meta line starts under
       them regardless of name length. */
    html[data-rr] table.tablebg[data-rr-roster] > tbody > tr > td[data-rr-col="rank"] { order: -1; }
    html[data-rr] table.tablebg[data-rr-roster] > tbody > tr::before { content: ""; order: 0; flex-basis: 100%; height: 0; }
    /* A listing card never touches what stands above it. */
    html[data-rr] #wrapcentre table.tablebg[data-rr-list] { margin-top: var(--rr-s3); }
    html[data-rr] table.tablebg[data-rr-roster] > tbody > tr > td[data-rr-col="rank"],
    html[data-rr] table.tablebg[data-rr-roster] > tbody > tr > td[data-rr-col="date"],
    html[data-rr] table.tablebg[data-rr-roster] > tbody > tr > td[data-rr-col="posts"] {
        order: 1;
        margin: 0;
        font-size: var(--rr-fs-xs);
        color: var(--rr-muted);
        background: none !important;
        padding: 0 !important;
    }
    html[data-rr] table.tablebg[data-rr-roster] > tbody > tr > td[data-rr-col="rank"] { order: -1; color: var(--rr-muted); align-self: baseline; }
    html[data-rr] table.tablebg[data-rr-joined] > tbody > tr > td[data-rr-col="date"]::before { content: "joined "; color: var(--rr-faint); }
    /* Everything after the meta line starts a line of its own. */
    html[data-rr] table.tablebg[data-rr-roster] > tbody > tr::after { content: ""; order: 2; flex-basis: 100%; height: 0; }
    html[data-rr] table.tablebg[data-rr-roster] > tbody > tr > td[data-rr-col="action"],
    html[data-rr] table.tablebg[data-rr-roster] > tbody > tr > td:not([data-rr-col]) { order: 3; flex: 0 0 auto; margin-top: 2px; }
    html[data-rr] table.tablebg[data-rr-roster] a.rr-ctl { padding: 3px 10px; font-size: var(--rr-fs-xs); }

    /* A table that's a menu: control-panel Options, message folders, the
       message-colour legend. Rows, not cards — a link a line, no rule
       under each. */
    html[data-rr] table.tablebg[data-rr-navlist],
    html[data-rr] table.tablebg[data-rr-pm-legend] { padding: 6px 0; }
    html[data-rr] table.tablebg[data-rr-navlist] > tbody > tr,
    html[data-rr] table.tablebg[data-rr-pm-legend] > tbody > tr {
        padding: 5px 14px;
        border-bottom: 0;
        gap: 0;
    }
    html[data-rr] table.tablebg[data-rr-navlist] > tbody > tr > td { width: 100% !important; }
    html[data-rr] table.tablebg[data-rr-navlist] a.nav,
    html[data-rr] table.tablebg[data-rr-navlist] b.nav { font-size: var(--rr-fs-sm); line-height: 1.5; }
    html[data-rr] table.tablebg[data-rr-navlist] b.nav { display: block; margin-top: var(--rr-s2); color: var(--rr-text-strong); }
    html[data-rr] table.tablebg[data-rr-pm-legend] > tbody > tr {
        align-items: center;
        gap: var(--rr-s2);
        font-size: var(--rr-fs-xs);
        color: var(--rr-muted);
    }
    /* The colour class sits on the same cell as the words
       (\`<td class="row1 pm_marked_colour"><span>Marked message</span>\`),
       so it can't be squeezed into a swatch — at 12px it drew the label
       one character to a line. The leading-edge stripe carries the
       colour as it does on desktop; the row gives up its own padding so
       the stripe lands on the card's edge. */
    html[data-rr] table.tablebg[data-rr-pm-legend] > tbody > tr { padding: 3px 0; }
    html[data-rr] table.tablebg[data-rr-pm-legend] > tbody > tr > td[class*="pm_"] {
        width: 100% !important;
        padding: 3px 14px;
        box-shadow: inset 3px 0 0 var(--rr-pm);
    }
    html[data-rr] table.tablebg[data-rr-roster] > tbody > tr > td[data-rr-col="rank"]::before { content: none; }

    /* A post's tools: the number, the two copies and "Reply with quote"
       lead; the board's own Profile / Send private message / Report
       follow as quiet words, not a second row of buttons. */
    html[data-rr] .rr-posthead .rr-posttools {
        flex: 1 1 100%;
        justify-content: flex-start;
        margin-left: 0;
        gap: 2px 4px;
        padding-top: 4px;
    }
    html[data-rr] .rr-posttools a.rr-ctl {
        background: none;
        border-color: transparent;
        padding: 4px 6px;
        font-size: var(--rr-fs-xs);
        color: var(--rr-muted);
    }

    /* Leaving this topic: the two clusters wrap as two lines; a stray
       control outside one is a chip. */
    html[data-rr] .rr-topicbar__row[data-rr-row="away"] > .rr-btn {
        padding: 5px 11px;
        background: var(--rr-surface-2);
        border: 1px solid var(--rr-line);
        border-radius: var(--rr-radius-pill);
    }
    html[data-rr] .rr-topicbar__row[data-rr-row="away"] .rr-cluster { flex-wrap: wrap; }
    /* A control inside a rounded box takes the box's corner minus the
       gap between them, so the two curves are concentric rather than a
       square end butting a round one. */
    html[data-rr] input.rr-search__go { border-radius: calc(var(--rr-radius) - 3px); }
}

/* The board bar, open: a menu. Each group on its own rows, two links to
   a row, a hairline between groups, More pinned where it was tapped —
   the wrapped row it replaced read as a soup of links with no groups. */
@media (max-width: 720px) {
    html[data-rr] .rr-boardbar[data-rr-open] { padding-bottom: var(--rr-s2); }
    /* Both halves, not just the left: the account group sits at the
       right of the desktop row, and behind the fold it's a row of the
       menu like the two above it. */
    html[data-rr] .rr-boardbar[data-rr-open] .rr-boardbar__main,
    html[data-rr] .rr-boardbar[data-rr-open] .rr-boardbar__end {
        flex-direction: column;
        align-items: stretch;
        width: 100%;
        gap: 0;
        margin-left: 0;
    }
    html[data-rr] .rr-boardbar[data-rr-open] .rr-boardbar__group {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        align-items: center;
        gap: 0 var(--rr-s3);
        padding: var(--rr-s2) 0;
        margin: 0;
        /* The desktop's box round each group is a row rule here. */
        border: 0;
        border-top: 1px solid var(--rr-line);
        border-radius: 0;
        background: none;
    }
    html[data-rr] .rr-boardbar[data-rr-open] .rr-boardbar__group > .rr-boardbar__link { border-left: 0; border-radius: 0; }
    /* The fold control keeps the top line to itself; groups start under
       it at full width so no link wraps around it. Only the left half's
       first group — the account group is first in the right half and
       nowhere near the top. */
    html[data-rr] .rr-boardbar[data-rr-open] .rr-boardbar__main > .rr-boardbar__group:first-child {
        border-top: 0;
        padding-top: 38px;
        padding-right: 0;
    }
    html[data-rr] .rr-boardbar[data-rr-open] .rr-boardbar__link:not(.rr-boardbar__donate) {
        padding: 8px 0;
        white-space: normal;
        line-height: 1.3;
    }
    html[data-rr] .rr-boardbar[data-rr-open] .rr-boardbar__donate { justify-self: start; margin: 4px 0; }
    html[data-rr] .rr-boardbar[data-rr-open] .rr-boardbar__end { margin: 0; }
    /* Everything in the open menu is a full-width row; a control
       stretched across the screen stops reading as one. */
    html[data-rr] .rr-boardbar[data-rr-open] .rr-langswitch {
        align-self: flex-start;
        margin-top: var(--rr-s3);
    }
}

/* The settings panel on a phone: a sheet, not a two-column window. The
   category rail becomes a horizontally scrolling strip of tabs, each
   field stacks its control under its words, and the footer wraps. It
   was previously a 186px rail beside a column too narrow for its own
   labels, wrapping letter by letter. */
@media (max-width: 640px) {
    html[data-rr] .rr-panel__head { gap: var(--rr-s2); padding: var(--rr-s3); }
    html[data-rr] .rr-panel__search { flex: 1 1 100px; }
    html[data-rr] .rr-panel__body { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
    html[data-rr] .rr-panel__rail {
        flex-direction: row;
        gap: 4px;
        padding: var(--rr-s2) var(--rr-s3);
        overflow-x: auto;
        overflow-y: hidden;
        border-right: 0;
        border-bottom: 1px solid var(--rr-line);
        scrollbar-width: none;
    }
    html[data-rr] .rr-panel__rail::-webkit-scrollbar { display: none; }
    html[data-rr] .rr-panel__tab { width: auto; flex: none; padding: 7px 10px; white-space: nowrap; }
    html[data-rr] .rr-panel__pages { padding: var(--rr-s3) var(--rr-s4) var(--rr-s5); }
    html[data-rr] .rr-group__note { max-width: none; }
    html[data-rr] .rr-field {
        flex-direction: column;
        align-items: stretch;
        /* Both undo a desktop rule that means something else once the
           field is a column: \`space-between\` spread words/control to
           the row's top and bottom, and \`wrap\` laid an overflowing field
           into a second column beside the first — 695px inside 358. */
        flex-wrap: nowrap;
        justify-content: flex-start;
        gap: var(--rr-s2);
        padding: var(--rr-s3) 0;
    }
    /* A switch stays beside its words: on/off needs no room. */
    html[data-rr] .rr-field:has(> .rr-field__control > .rr-switch) {
        flex-direction: row;
        align-items: center;
        gap: var(--rr-s3);
    }
    /* The desktop row wraps a wide control off the line via a 16rem
       flex-basis on the words; down here the field is a column and that
       basis becomes a *height* — 256px of nothing between a label and
       its control. Same trap as the accent chips' 100%. It still has to
       shrink, or unshrinkable words push the row 300px past the sheet. */
    html[data-rr] .rr-field__text { flex: 0 1 auto; }
    html[data-rr] .rr-field__desc { max-width: none; }
    html[data-rr] .rr-field__control { flex-wrap: wrap; padding-top: 0; }
    html[data-rr] .rr-seg { flex-wrap: wrap; }
    html[data-rr] .rr-rangewrap { width: 100%; }
    html[data-rr] .rr-range { flex: 1; width: auto; }
    html[data-rr] .rr-panel__foot { flex-wrap: wrap; gap: var(--rr-s2); padding: var(--rr-s3); }
    html[data-rr] .rr-panel__foot .rr-spacer { display: none; }
}

@media (max-width: 860px) {
    /* A row hidden by the script stays hidden: the flex-row rule above
       was bringing a profile's empty rows back. */
    html[data-rr] #wrapcentre tr[data-rr-empty-row] { display: none !important; }
    /* A profile's label and value on one line, the label quiet. */
    html[data-rr] #wrapcentre tr[data-rr-pair] { display: flex !important; flex-wrap: nowrap !important; align-items: baseline !important; gap: var(--rr-s2); }
    html[data-rr] #wrapcentre tr[data-rr-pair] > td:first-child { flex: none; width: auto !important; color: var(--rr-muted); }
    html[data-rr] #wrapcentre tr[data-rr-pair] > td:last-child { flex: 1 1 auto; width: auto !important; min-width: 0; }

    /* Centred cells are a desktop table's idea; stacked, they left a
       radio row or heading floating mid-card. */
    html[data-rr] #wrapcentre td[align="center"]:not([data-rr-col]) { text-align: left; }

    /* The icon legend under a listing: dot beside its words, one pair a
       line, instead of each dot centred above its label. The two :not()
       classes outweigh the generic table-unpacking rule above, which
       carries the same two. */
    html[data-rr] #wrapcentre table[data-rr-legend]:not(.tablebg):not(.forumline) { margin: var(--rr-s3) 0; }
    /* A two-column grid: dots in the first column, words in the second,
       one pair per line at one spacing. The template's spacer cells
       between pairs go. */
    html[data-rr] #wrapcentre table[data-rr-legend]:not(.tablebg):not(.forumline) > tbody > tr {
        display: grid;
        grid-template-columns: 20px minmax(0, 1fr);
        gap: 6px var(--rr-s2);
        align-items: center;
        padding: 0;
        border: 0;
    }
    html[data-rr] #wrapcentre table[data-rr-legend]:not(.tablebg):not(.forumline) > tbody > tr + tr { margin-top: 6px; }
    html[data-rr] #wrapcentre table[data-rr-legend]:not(.tablebg):not(.forumline) > tbody > tr > td {
        display: block;
        padding: 0;
        font-size: var(--rr-fs-xs);
        color: var(--rr-muted);
        text-align: left;
    }
    html[data-rr] #wrapcentre table[data-rr-legend]:not(.tablebg):not(.forumline) > tbody > tr > td[data-rr-empty] { display: none; }
    html[data-rr] #wrapcentre table[data-rr-legend]:not(.tablebg):not(.forumline) > tbody > tr > td[data-rr-legend-dot] {
        display: inline-flex;
        justify-content: center;
        align-items: center;
    }

    /* A post's header on a phone: name/rank, then meta, then date — each
       its own line, all from the left. The spacer that pushes the date
       right on desktop put it right on some cards, left on others,
       depending on what wrapped. */
    html[data-rr] .rr-posthead__spacer { display: none; }
    /* The band reaches the card's edges here too, its padding moved from
       the cell to the row. Selector matches desktop's exactly, so the
       tie breaks on source order — this file is last in the build. */
    html[data-rr] table.tablebg[data-rr-post] { --rr-post-pad: 14px; --rr-post-pad-top: 14px; }
    html[data-rr] table.tablebg[data-rr-post]:not([data-rr-quiet]) > tbody > tr > td.row1,
    html[data-rr] table.tablebg[data-rr-post]:not([data-rr-quiet]) > tbody > tr > td.row2,
    html[data-rr] table.tablebg[data-rr-post]:not([data-rr-quiet]) > tbody > tr.row1 > td,
    html[data-rr] table.tablebg[data-rr-post]:not([data-rr-quiet]) > tbody > tr.row2 > td { padding: 0; }
    html[data-rr] .rr-posthead__meta,
    html[data-rr] .rr-posthead__date { flex: 1 1 100%; text-align: left; margin: 0; }

    html[data-rr] .rr-pager__input { width: 3.4em; }
    /* The jump-to-first-unread arrow beside a title: on a phone the
       title itself opens there, so the arrow read as a stray glyph. */
    html[data-rr] a.rr-unread-jump { display: none; }

    /* A multi-select as wide as its widest forum name overflowed the
       card; the message box at fifteen rows was a screen and a half. */
    html[data-rr] #wrapcentre select[multiple] { width: 100% !important; max-width: 100%; }
    html[data-rr] #wrapcentre textarea { max-height: 45vh; }

    /* The message folder's foot: a sort form in a bare table with a
       right-aligned, nowrap cell for desktop — full width and a wrapped
       row here. The listing's "Go to page" strip and "Page 1 of 5" line
       get the same treatment. */
    html[data-rr] #wrapcentre table[data-rr-sortfoot] > tbody > tr > td,
    html[data-rr] #wrapcentre table[data-rr-strip] > tbody > tr > td { width: 100% !important; text-align: left; white-space: normal !important; }
    html[data-rr] #wrapcentre table[data-rr-sortfoot] > tbody > tr > td:empty { display: none; }
    html[data-rr] #wrapcentre td[data-rr-cat="controls"] form { float: none !important; }
    html[data-rr] #wrapcentre form[name="sortmsg"] .rr-ctrl-group { flex: 0 0 auto; }
    html[data-rr] #wrapcentre form[name="sortmsg"] .rr-ctrl-group > span.gensmall { white-space: nowrap !important; }
    html[data-rr] #wrapcentre form[name="sortmsg"] { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-start; gap: var(--rr-s2) var(--rr-s3); margin: 0 !important; }
    html[data-rr] #wrapcentre table[data-rr-sortfoot] { margin: var(--rr-s3) 0 !important; }
    /* A profile's two columns stack instead of sitting side by side,
       where the second's form controls were squeezed to a few letters. */
    html[data-rr][data-rr-profile] #wrapcentre table.tablebg > tbody > tr > td.row1,
    html[data-rr][data-rr-profile] #wrapcentre table.tablebg > tbody > tr > td.row2 { flex: 1 1 100%; }
    /* The message folder's export/mark controls sit in their own table,
       not the list's, so the strip that reads as a card's foot elsewhere
       was a bare band here — given a card of its own. */
    html[data-rr] #wrapcentre table:not(.tablebg):not(.forumline) > tbody > tr[data-rr-cat-row="controls"] {
        margin-top: var(--rr-s3);
        border: 1px solid var(--rr-line);
        border-radius: var(--rr-radius-lg);
        padding: 12px 14px !important;
    }
    html[data-rr] #wrapcentre form[name="sortmsg"] select { flex: none; }
}

/* ---- The topic review, on a phone -------------------------------- */

@media (max-width: 860px) {
    /* The block above turns every row into a flex row, which put the
       author's name in a 46px column beside the subject with the card's
       edge drawn round it. Here the card belongs to the row, not the
       cells: the two rows of a post are the top and bottom of one box,
       everything inside its own line. */
    html[data-rr] #wrapcentre tr[data-rr-review-row="head"],
    html[data-rr] #wrapcentre tr[data-rr-review-row="body"] {
        display: block !important;
        background: var(--rr-surface-2);
        border: 1px solid var(--rr-line);
        padding: 0 var(--rr-s3);
    }
    html[data-rr] #wrapcentre tr[data-rr-review-row="head"] {
        border-bottom: 0;
        border-radius: var(--rr-radius) var(--rr-radius) 0 0;
        padding-top: var(--rr-s2);
    }
    html[data-rr] #wrapcentre tr[data-rr-review-row="body"] {
        border-top: 0;
        border-radius: 0 0 var(--rr-radius) var(--rr-radius);
        padding-bottom: var(--rr-s2);
    }
    html[data-rr] #wrapcentre tr[data-rr-review-row] > td {
        display: block !important;
        width: auto !important;
        background: none;
        border: 0;
        border-radius: 0;
        padding: 0 !important;
    }
    html[data-rr] #wrapcentre td[data-rr-review-cell="author"] { padding-bottom: 2px !important; }
    /* "Post subject: Re: <the topic> [Reply with quote]" is four cells
       of a nested table — stacked, that's four lines for a card whose
       message is three. One wrapped line, button pushed to its end. */
    html[data-rr] #wrapcentre tr[data-rr-review-row="head"] > td:not([data-rr-review-cell]) > table > tbody > tr {
        display: flex !important;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 2px var(--rr-s2);
    }
    html[data-rr] #wrapcentre tr[data-rr-review-row="head"] > td:not([data-rr-review-cell]) > table td:last-child { margin-left: auto; }
    /* The scroller keeps its own edge, so cards inside it need no second
       one against the window. */
    html[data-rr] [data-rr-review] { padding: var(--rr-s2); }
}`;

/* ================= src/core/store.js ================= */
/* Persistence: all settings live in one object under one GM key, so
   export/import is a single JSON blob and a corrupt value can't take down
   more than its own setting. GM_* is used when the userscript manager
   provides it, falling back to localStorage (console paste, restricted grants). */

const KEY = "rr:settings";
const DATA_KEY = "rr:data";
const KEY_PREFIX = "rr:";

const hasGM = typeof GM_getValue === "function" && typeof GM_setValue === "function";

function readRaw(key) {
    try {
        if (hasGM) return GM_getValue(key, null);
        return localStorage.getItem(key);
    } catch (err) {
        console.warn("[RIN Reforged] cannot read storage:", err);
        return null;
    }
}

function writeRaw(key, value) {
    try {
        if (hasGM) GM_setValue(key, value);
        else localStorage.setItem(key, value);
        return true;
    } catch (err) {
        console.warn("[RIN Reforged] cannot write storage:", err);
        return false;
    }
}

function parseJSON(raw, fallback) {
    if (raw === null || raw === undefined) return fallback;
    if (typeof raw === "object") return raw;
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch {
        return fallback;
    }
}

/* ---- Settings ---------------------------------------------------- */

const listeners = new Set();
let cache = null;

const settings = {
    /** Current value of one setting, falling back to the schema default. */
    get(id) {
        if (cache === null) cache = parseJSON(readRaw(KEY), {});
        if (Object.prototype.hasOwnProperty.call(cache, id)) return cache[id];
        return defaultFor(id);
    },

    /** All settings merged over the schema defaults. */
    all() {
        const out = {};
        for (const field of allFields()) out[field.id] = settings.get(field.id);
        return out;
    },

    set(id, value) {
        if (cache === null) cache = parseJSON(readRaw(KEY), {});
        const previous = settings.get(id);
        if (previous === value) return;
        cache[id] = value;
        writeRaw(KEY, JSON.stringify(cache));
        for (const fn of listeners) {
            try { fn(id, value, previous); } catch (err) { console.warn("[RIN Reforged] settings listener failed:", err); }
        }
    },

    /** Replace every stored setting at once (import, reset). */
    replace(next) {
        cache = {};
        for (const field of allFields()) {
            if (Object.prototype.hasOwnProperty.call(next, field.id)) cache[field.id] = next[field.id];
        }
        writeRaw(KEY, JSON.stringify(cache));
        for (const fn of listeners) {
            try { fn("*", null, null); } catch (err) { console.warn("[RIN Reforged] settings listener failed:", err); }
        }
    },

    reset() { settings.replace({}); },

    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};

let dataCache = null;

const store = {
    get(key, fallback) {
        if (dataCache === null) dataCache = parseJSON(readRaw(DATA_KEY), {});
        return Object.prototype.hasOwnProperty.call(dataCache, key) ? dataCache[key] : fallback;
    },
    set(key, value) {
        if (dataCache === null) dataCache = parseJSON(readRaw(DATA_KEY), {});
        dataCache[key] = value;
        writeRaw(DATA_KEY, JSON.stringify(dataCache));
    },
    all() {
        if (dataCache === null) dataCache = parseJSON(readRaw(DATA_KEY), {});
        return dataCache;
    },
    replace(next) {
        dataCache = next && typeof next === "object" ? next : {};
        writeRaw(DATA_KEY, JSON.stringify(dataCache));
    },
};

// Buckets: each on its own GM key, so a large or cache-like value (the
// palette's seen-topics index, currently hundreds of 136-byte entries)
// doesn't force a full re-save of rr:data on every write, and isn't
// exported with settings (cleared instead via settingsui.js clearData).
const bucketCache = new Map();

// Unlike parseJSON(), doesn't require an object back: a bucket can hold an
// array or a number, and parseJSON() would read either as "no value".
function parseAny(raw) {
    if (raw === null || raw === undefined) return undefined;
    if (typeof raw === "object") return raw;
    try {
        return JSON.parse(raw);
    } catch {
        return undefined;
    }
}

const bucket = {
    get(name, fallback) {
        if (!bucketCache.has(name)) bucketCache.set(name, parseAny(readRaw(KEY_PREFIX + name)));
        const held = bucketCache.get(name);
        return held === null || held === undefined ? fallback : held;
    },
    /** False when the write did not land — a full quota, mostly. */
    set(name, value) {
        bucketCache.set(name, value);
        return writeRaw(KEY_PREFIX + name, JSON.stringify(value));
    },
    drop(name) {
        bucketCache.delete(name);
        try {
            if (hasGM && typeof GM_deleteValue === "function") GM_deleteValue(KEY_PREFIX + name);
            else localStorage.removeItem(KEY_PREFIX + name);
        } catch (err) {
            console.warn("[RIN Reforged] cannot drop " + name + ":", err);
        }
    },
};

let schemaRef = [];
let defaults = null;

function registerSchema(groups) { schemaRef = groups; defaults = null; }
function schema() { return schemaRef; }

function allFields() {
    const out = [];
    for (const group of schemaRef) out.push(...group.fields);
    return out;
}

// Cached: settings.get() falls through to this on every uncustomized field,
// often a hundred times per listing page.
function defaultFor(id) {
    if (defaults === null) {
        defaults = new Map();
        for (const field of allFields()) defaults.set(field.id, field.default);
    }
    return defaults.get(id);
}

/* ================= src/core/schema.js ================= */
/* ------------------------------------------------------------------
   The settings catalogue.

   One declarative list drives three things: the defaults, the settings
   panel UI, and the export format. Adding a feature means adding a
   field here, never touching the panel code.

   Field shapes
     toggle   on/off
     seg      a small set of choices, rendered as a segmented control
     range    a number with min/max/step/unit
     text     free text
     swatch   a colour chosen from a fixed set
   `when` hides a field until another field is on, so the panel stays
   readable instead of showing sixty controls at once. `reload` marks
   the few whose effect is built once at load and cannot be undone in
   place — the panel reloads the page after those rather than leaving
   half of one applied.

   Groups carry an `icon` and a `short` label: the panel is a rail of
   categories beside the controls rather than one long scroll, and the
   rail needs a name that fits in 150px. Settings are stored flat by
   id, so moving a field between groups costs nothing and needs no
   migration.

   A setting is a question put to every reader who opens the panel, so
   anything with one sensible answer is not one: those are simply how
   the script behaves. A value stored for a field that has since gone
   is ignored, never an error.
   ------------------------------------------------------------------ */

const SETTINGS_SCHEMA = [
    {
        id: "look",
        title: "Appearance",
        short: "Appearance",
        icon: "sliders",
        note: "The forum ships one fixed 2003 stylesheet. These control the replacement.",
        fields: [
            {
                id: "theme", label: "Theme", type: "seg", default: "native",
                desc: "Native is the board's own palette — near-black, grey text, red links — on this layout. Slate is a quieter blue-leaning dark, Carbon drops the blue, Paper is a real light theme.",
                options: [
                    { value: "native", label: "Native" },
                    { value: "slate", label: "Slate" },
                    { value: "carbon", label: "Carbon" },
                    { value: "paper", label: "Paper" },
                    { value: "auto", label: "System" },
                ],
            },
            {
                id: "accent", label: "Accent colour", type: "swatch", default: "rin",
                desc: "Used for actions, active state and unread markers. RIN orange is the colour the board already uses for game titles.",
                options: [
                    { value: "brass", label: "Brass", color: "#e0a338" },
                    { value: "rin", label: "RIN orange", color: "#d46234" },
                    { value: "steam", label: "Steam", color: "#66c0f4" },
                    { value: "moss", label: "Moss", color: "#6bbd85" },
                    { value: "rose", label: "Rose", color: "#e0748c" },
                    { value: "violet", label: "Violet", color: "#a795d8" },
                ],
            },
            {
                id: "density", label: "Density", type: "seg", default: "cosy",
                desc: "How much air each row and post gets.",
                options: [
                    { value: "compact", label: "Compact" },
                    { value: "cosy", label: "Cosy" },
                    { value: "roomy", label: "Roomy" },
                ],
            },
            {
                id: "fontSize", label: "Text size", type: "range", default: 15,
                min: 12, max: 20, step: 1, unit: "px",
                desc: "The original is 11px Verdana.",
            },
            {
                id: "width", label: "Content width", type: "seg", default: "reading",
                desc: "Reading caps a post's lines at about 78 characters; Wide lets the frame grow further; Full lifts the frame's limit altogether.",
                options: [
                    { value: "reading", label: "Reading" },
                    { value: "wide", label: "Wide" },
                    { value: "full", label: "Full" },
                ],
            },
            {
                id: "modernIcons", label: "Replace legacy button images", type: "toggle", default: true,
                desc: "Swaps the GIF button set and read/unread checkboxes for vector icons. Off keeps the board's own 2003 imageset.",
            },
            {
                id: "masthead", label: "Show the board's masthead on the index", type: "toggle", default: true, reload: true,
                desc: "The crosshair emblem and the CS.RIN.RU wordmark, kept on the index only. Everywhere else the top bar carries the name.",
            },
        ],
    },
    {
        id: "nav",
        title: "Navigation",
        short: "Navigation",
        icon: "home",
        note: "The masthead takes 340px before any content appears. This replaces it.",
        fields: [
            {
                id: "navbar", label: "Compact top bar", type: "toggle", default: true, reload: true,
                desc: "A 48px sticky bar with the breadcrumb, search, private messages and settings.",
            },
            {
                id: "boardLinks", label: "Board links row", type: "toggle", default: true, reload: true,
                desc: "Unanswered and active topics, forum rules, FAQ, chat, donate, your account and the language switch, grouped on one line.",
            },
            {
                id: "quickPager", label: "Jump to last page", type: "toggle", default: true,
                desc: "First and last page controls beside every pager. phpBB never links the last page, which is where an update thread is read.",
            },
            {
                id: "backToTop", label: "Back to top button", type: "toggle", default: true,
                desc: "A pair of floating controls for the top and the foot of a long page.",
            },
            {
                id: "progress", label: "Reading progress bar", type: "toggle", default: true,
                desc: "A hairline under the top bar showing how far down the page you are.",
            },
        ],
    },
    {
        id: "find",
        title: "Search and finding",
        short: "Search",
        icon: "search",
        note: "Main Forum holds 61,000 topics across 615 pages, so finding matters more than paging. Where a search looks is chosen in the search box itself, which names the room it will search: the forum above the one a topic sits in, since a cracked game lives in a subforum and the thing you are looking for does not.",
        fields: [
            {
                id: "palette", label: "Command palette", type: "toggle", default: true,
                desc: "Ctrl+K opens search, forum jumps, bookmarks and every script action in one box.",
            },
            {
                id: "paletteTopics", label: "Topics in the palette", type: "toggle", default: true,
                desc: "Keeps the titles from every listing you open, so the palette can offer real topics as you type. The board allows one search about every half minute, which is why this looks in what you have already seen rather than asking it again.",
                when: "palette",
            },
            {
                id: "palettePreview", label: "Look inside a topic", type: "toggle", default: true,
                desc: "Resting on a topic in the palette reads its first page and shows the board, the length, who opened it and what they said. One request per topic, only when you stop on it, and only on a wide enough window.",
                when: "paletteTopics",
            },
            {
                id: "listFilter", label: "Filter box over a listing", type: "toggle", default: true,
                desc: "Filters the visible topic list as you type, without a page load.",
            },
            {
                id: "prefixTags", label: "Colour topic prefixes", type: "toggle", default: true,
                desc: "Turns [Info], [Release], [Problem] and the rest into coloured tags you can click to filter.",
            },
            {
                id: "finder", label: "Releases panel", type: "toggle", default: true,
                desc: "Lists the posts on the page that carry a release, an update or a reupload, with the version and the file host. A post that names an archive password offers it with a copy button.",
            },
            {
                id: "topicIndex", label: "Read the whole topic", type: "toggle", default: true,
                desc: "The panel can read a topic page by page and list everything posted in it — from the last page back by default, or from the first forward, sixty pages a click. Never runs on its own; Escape stops it and keeps what it read.",
                when: "finder",
            },
        ],
    },
    {
        id: "lists",
        title: "Topic lists",
        short: "Topic lists",
        icon: "filter",
        note: "Announcements, stickies and the topics fold on a click on their heading, and stay folded until you open them again.",
        fields: [
            {
                id: "unreadFromList", label: "Topic titles open at the first unread post", type: "toggle", default: true,
                desc: "On, a topic with unread posts opens at the first of them; off, a title opens the first page. Needs an account — logged out there is nothing to be unread.",
            },
            {
                id: "hideVisited", label: "Mark topics already opened", type: "toggle", default: true,
                desc: "Fills in the read/unread mark beside a topic this browser has been to, so it works while logged out too.",
            },
            {
                id: "bookmarks", label: "Bookmark topics", type: "toggle", default: true,
                desc: "A star on every topic. Bookmarks are listed in the command palette.",
            },
            {
                id: "rowClick", label: "The whole title cell opens the topic", type: "toggle", default: true,
                desc: "Not only the words of the title. Ctrl-click opens it in a new tab; selecting text does nothing.",
            },
            {
                id: "foldWhoIsOnline", label: "Fold Who is online", type: "toggle", default: true,
                desc: "Keeps the counts and hides the 500-odd names behind a control, on the index and under every forum and topic.",
            },
            {
                id: "stickyHeads", label: "Keep the column headings in view", type: "toggle", default: true,
                desc: "The headings stay at the top of the window while their listing is on screen.",
            },
            {
                id: "sortColumns", label: "Sort a listing by clicking a column", type: "toggle", default: true,
                desc: "Replies, Views, Author, Last post and the rest reorder the rows already on the page. Click again to reverse, a third time for the board's own order.",
            },
        ],
    },
    {
        id: "topic",
        title: "Reading a topic",
        short: "Reading",
        icon: "layers",
        note: "A game topic opens with a 4,000 word Steam description before the first useful reply.",
        fields: [
            {
                id: "gameCard", label: "Game info card", type: "toggle", default: true,
                desc: "Reads the first post and draws it as a card: store page, AppID, genres, languages, release date, with lookups to SteamDB, SteamCharts, ProtonDB and PCGamingWiki. The original post stays under it, with a control to fold it.",
            },
            {
                id: "postLayout", label: "Post layout", type: "seg", default: "modern",
                desc: "Modern puts the author on one line above the message. Classic keeps the original column beside it.",
                options: [
                    { value: "modern", label: "Modern" },
                    { value: "classic", label: "Classic" },
                ],
            },
            {
                id: "postTools", label: "Per-post actions", type: "toggle", default: true,
                desc: "Copy link, copy as a quote, reply with quote, and a post number you can link to.",
            },
            {
                id: "spoilersOpen", label: "Open spoilers", type: "toggle", default: true,
                desc: "Every spoiler on the page starts open, so a release post reads top to bottom. The topic bar closes them all again in one click.",
            },
            {
                id: "spoilerAll", label: "Open or close all spoilers button", type: "toggle", default: true,
                desc: "One control in the topic bar for a post that hides its links behind ten separate spoilers.",
            },
            {
                id: "foldQuotes", label: "Fold long quotes", type: "toggle", default: true,
                desc: "A quote longer than a few lines is clipped to its opening lines with a control to open it. The text is never taken out of the page.",
            },
            {
                id: "foldQuotesLines", label: "Fold a quote over", type: "range", default: 6,
                min: 3, max: 16, step: 1, unit: " lines",
                when: "foldQuotes",
            },
            {
                id: "quietPosts", label: "Fold short low-value replies", type: "toggle", default: true,
                desc: "\"thanks!\", \"+1\" and a lone emoji collapse to one dim line you can click open. Nothing is removed and nothing is decided from who wrote it — only from what the post says.",
            },
            {
                id: "quietLimit", label: "Fold replies shorter than", type: "range", default: 120,
                min: 40, max: 240, step: 10, unit: " chars",
                when: "quietPosts",
            },
            {
                id: "resumeReading", label: "Remember where you stopped reading", type: "toggle", default: true,
                desc: "A topic you have read before offers a control back to the page you were on, and the first post newer than your last visit is marked. Needs \"Remember topics you open\".",
                when: "history",
            },
            {
                id: "unreadJump", label: "Jump to the first unread post", type: "toggle", default: true,
                desc: "The board offers this from a topic list but not from inside a topic.",
            },
            {
                id: "collapseSigs", label: "Fold long signatures", type: "toggle", default: true,
                desc: "Signatures over a few lines collapse behind a toggle.",
            },
            {
                id: "lightbox", label: "Open images in a lightbox", type: "toggle", default: true,
                desc: "Replaces the click-to-resize behaviour.",
            },
            {
                id: "linkifyBare", label: "Mark off-site links", type: "toggle", default: true,
                desc: "Shows the destination host next to links that leave the forum.",
            },
        ],
    },
    {
        id: "write",
        title: "Posting and people",
        short: "Posting",
        icon: "reply",
        fields: [
            {
                id: "quickReply", label: "Reply from the bottom of the thread", type: "toggle", default: true,
                desc: "Loads the board's own reply form in place, so you keep your position in a long topic. Needs an account.",
            },
            {
                id: "saveDraft", label: "Keep an unsent reply", type: "toggle", default: true,
                desc: "What you have typed into the quick reply is kept in this browser against that topic. Cleared when the reply is sent, and never sent anywhere.",
                when: "quickReply",
            },
            {
                id: "selectionQuote", label: "Quote what you select", type: "toggle", default: true,
                desc: "Highlight text in a post and a Quote button appears. It goes straight into the reply box when one is open.",
            },
            {
                id: "postingMemory", label: "Remember the posting options", type: "toggle", default: true,
                desc: "Notify me, Attach a signature, Disable BBCode and the rest: whatever was ticked the last time is ticked again on the next post.",
            },
            {
                id: "hideUsers", label: "Hide posts by someone", type: "toggle", default: true,
                desc: "A control on every post. Hidden posts collapse to one line rather than vanishing, and the list stays in this browser.",
            },
        ],
    },
    {
        id: "steam",
        title: "Steam preview",
        short: "Steam",
        icon: "game",
        note: "Everything else in this script reads the page you are already on. This is the one part that can ask another server a question, so it is off until you turn it on.",
        fields: [
            {
                id: "steamPreview", label: "Preview a game on hover", type: "toggle", default: false,
                desc: "Hovering a topic title in a listing shows the cover, the review score, the tags, the release date and the opening lines of the store description. Escape closes it.",
            },
            {
                id: "steamLookup", label: "Ask Steam for games it has not seen", type: "toggle", default: true,
                desc: "Without this the preview only shows games this browser has already opened a topic for. With it, an unknown title is looked up on Steam's public store API and kept for a month. Nothing but the game name is ever sent, and never over the Tor mirror.",
                when: "steamPreview",
            },
        ],
    },
    {
        id: "a11y",
        title: "Accessibility",
        short: "Accessibility",
        icon: "keyboard",
        fields: [
            {
                id: "shortcuts", label: "Keyboard shortcuts", type: "toggle", default: true,
                desc: "j/k to move between posts, g then i for the index, ? for the full list.",
            },
            {
                id: "readableInk", label: "Make the board's own colours readable", type: "toggle", default: true,
                desc: "The board colours a username by its group, and several of those come out at about 2.5:1 against the page. This keeps the hue and lifts only the brightness, by the least it takes to be readable.",
            },
            {
                id: "reduceMotion", label: "Turn off animation", type: "toggle", default: false,
                desc: "Transitions and smooth scrolling are already dropped when the system asks for reduced motion. This forces it regardless.",
            },
        ],
    },
    {
        id: "privacy",
        title: "Behaviour",
        short: "Behaviour",
        icon: "settings",
        fields: [
            {
                id: "history", label: "Remember topics you open", type: "toggle", default: true,
                desc: "Stored in this browser and never sent anywhere. Powers Recent in the palette and the reading position.",
            },
            {
                id: "confirmExternal", label: "Confirm before leaving to another site", type: "toggle", default: false,
                desc: "Asks first, showing the full address, when a link in a post leads off the forum.",
            },
            {
                id: "coexist", label: "Stand down for CS.RIN.RU Enhanced", type: "toggle", default: true,
                desc: "If the Enhanced userscript is running, leave the Steam header on a game topic to it instead of drawing a second one.",
            },
        ],
    },
];

/* ================= src/core/dom.js ================= */
// DOM helpers and the icon set. Post content is only ever moved, cloned or
// read as textContent — never parsed as markup — so this keeps working
// under a Trusted Types policy, where innerHTML/DOMParser throw.

/**
 * Build an element.
 *   el("button.rr-btn", { onclick, "aria-pressed": "true" }, ["Save"])
 * Tag supports .class and #id shorthand. Children may be nodes or
 * strings; strings become text nodes, never markup.
 */
function el(tag, attrs = {}, children = []) {
    const [name, ...rest] = tag.split(/(?=[.#])/);
    const node = document.createElement(name || "div");
    for (const token of rest) {
        if (token[0] === ".") node.classList.add(token.slice(1));
        else if (token[0] === "#") node.id = token.slice(1);
    }
    for (const [key, value] of Object.entries(attrs)) {
        if (value === null || value === undefined || value === false) continue;
        if (key === "style" && typeof value === "object") Object.assign(node.style, value);
        else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value);
        else if (key === "text") node.textContent = value;
        else if (value === true) node.setAttribute(key, "");
        else node.setAttribute(key, value);
    }
    for (const child of [].concat(children)) {
        if (child === null || child === undefined || child === false) continue;
        node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return node;
}

function on(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    return () => target.removeEventListener(type, handler, options);
}

// At document-start the parser may not have produced documentElement yet.
function whenRoot(fn) {
    if (document.documentElement) { fn(); return; }
    const observer = new MutationObserver(() => {
        if (document.documentElement) { observer.disconnect(); fn(); }
    });
    observer.observe(document, { childList: true });
}

// Observes `document`, not documentElement — the latter isn't guaranteed to
// exist yet at document-start and isn't a valid observe target when absent.
function whenBody(fn) {
    if (document.body) { fn(); return; }
    const observer = new MutationObserver(() => {
        if (document.body) { observer.disconnect(); fn(); }
    });
    observer.observe(document, { childList: true, subtree: true });
}

function whenReady(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
}

// The scrim tells a mouse user nothing behind it is reachable; without this,
// Tab would still walk a keyboard user straight out into a page they can't
// see. Returns a teardown.
function trapFocus(container, restoreTo) {
    const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), ' +
        'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const onKey = (event) => {
        if (event.key !== "Tab") return;
        const items = Array.from(container.querySelectorAll(FOCUSABLE))
            .filter((node) => node.offsetParent !== null || node === document.activeElement);
        if (!items.length) { event.preventDefault(); container.focus(); return; }

        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    container.addEventListener("keydown", onKey);
    return () => {
        container.removeEventListener("keydown", onKey);
        if (restoreTo && document.contains(restoreTo)) restoreTo.focus();
    };
}

function debounce(fn, wait) {
    let timer = 0;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), wait);
    };
}

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

// The stylesheet already handles CSS transitions via media query + panel
// attribute, but a `behavior` option passed to scrollTo/scrollIntoView
// overrides CSS scroll-behavior — so scrolling needs this check separately.
function motionAllowed() {
    if (settings.get("reduceMotion")) return false;
    return !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

/** "smooth" or "auto", for a scroll option. */
function scrollBehaviour() { return motionAllowed() ? "smooth" : "auto"; }

// The quick reply and the releases walk both fetch and parse a page via
// DOMParser, which throws under a Trusted Types policy (not sent by the
// board today, but a video embed's player might trigger one). A policy is
// the escape hatch; where even that's refused, this returns null instead
// of throwing inside a click handler.
let htmlPolicy;

function trustedHtml(html) {
    if (typeof window.trustedTypes !== "object" || !window.trustedTypes) return html;
    if (htmlPolicy === undefined) {
        try {
            // Fetched same-origin and only ever read, never inserted —
            // nothing here needs sanitising beyond what the board already accepted.
            htmlPolicy = window.trustedTypes.createPolicy("rin-reforged-page", { createHTML: (input) => input });
        } catch (err) {
            console.warn("[RIN Reforged] no Trusted Types policy available:", err);
            htmlPolicy = null;
        }
    }
    return htmlPolicy ? htmlPolicy.createHTML(html) : html;
}

/** A fetched page as a document, or null if this browser will not let
    us make one. Never inserted into the page: only read. */
function parseDocument(html) {
    try {
        return new DOMParser().parseFromString(trustedHtml(html), "text/html");
    } catch (err) {
        console.warn("[RIN Reforged] cannot parse a fetched page:", err);
        return null;
    }
}

// The board paints usernames by group as an inline style, some as dark as
// 2.5:1 on a near-black page — below the 4.5 that 13px text needs. What
// follows keeps hue and saturation and moves only lightness, the smallest
// step that clears contrast: a red name stays a red name.
function parseColour(text) {
    const raw = String(text).trim();

    // A custom property comes back as the literal stylesheet value, not a
    // resolved rgb() — #f6f6f6 read digit-by-digit would give rgb(6,6,6).
    const hex = raw.match(/^#([0-9a-f]{3,8})$/i);
    if (hex) {
        const digits = hex[1].length <= 4
            ? hex[1].split("").map((c) => c + c).join("")
            : hex[1];
        const byte = (at) => parseInt(digits.slice(at, at + 2), 16);
        return {
            r: byte(0), g: byte(2), b: byte(4),
            a: digits.length >= 8 ? byte(6) / 255 : 1,
        };
    }

    // Signed and with exponents: oklab's a/b are routinely negative, and
    // Chrome writes tiny ones as 5.126e-6 — dropping either turns a green
    // into a magenta.
    const parts = (raw.match(/[+-]?\d*\.?\d+(?:e[+-]?\d+)?/gi) || []).map(Number);
    if (parts.length < 3) return null;
    const alpha = parts.length > 3 ? parts[3] : 1;

    // Chrome resolves color-mix() to *oklab*, not color(srgb ...) — reading
    // its 0-1 lightness and signed axes as sRGB bytes reads near-black
    // regardless of the real colour, which silently broke contrast fixes
    // on every color-mix background in the stylesheet.
    if (/^oklab\(/i.test(raw)) return { ...oklabToRgb(parts[0], parts[1], parts[2]), a: alpha };
    if (/^oklch\(/i.test(raw)) {
        const hue = (parts[2] || 0) * Math.PI / 180;
        return { ...oklabToRgb(parts[0], parts[1] * Math.cos(hue), parts[1] * Math.sin(hue)), a: alpha };
    }

    // color(srgb r g b / a) is 0-1 per channel; rgb() is already bytes.
    const scale = /^color\(/i.test(raw) ? 255 : 1;
    return {
        r: parts[0] * scale,
        g: parts[1] * scale,
        b: parts[2] * scale,
        a: alpha,
    };
}

// oklab to sRGB bytes via LMS cone responses then the sRGB transfer function;
// clamped since oklab's gamut exceeds sRGB's.
function oklabToRgb(L, a, b) {
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;

    const linear = [
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    ];
    const encode = (v) => {
        const shaped = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
        return Math.min(255, Math.max(0, shaped * 255));
    };
    return { r: encode(linear[0]), g: encode(linear[1]), b: encode(linear[2]) };
}

function relativeLuminance({ r, g, b }) {
    const channel = (value) => {
        const v = value / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(one, two) {
    const a = relativeLuminance(one);
    const b = relativeLuminance(two);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const INK_STEPS = 40;

// Mixes `colour` toward `toward` (the theme's text colour) a step at a time
// until it clears `target` contrast against `behind`, or returns null if it
// already clears or never does. Mixing rather than raising lightness alone:
// the latter kept saturation and turned the board's #BF0000 into a neon
// rgb(255,38,38) instead of a quieter, legible red.
function readableInk(colour, behind, target, toward) {
    if (!colour || !behind) return null;
    if (contrastRatio(colour, behind) >= target) return null;

    const auto = relativeLuminance(behind) > 0.5
        ? { r: 0, g: 0, b: 0, a: 1 }
        : { r: 255, g: 255, b: 255, a: 1 };
    const lifted = mixToward(colour, behind, target, toward || auto);
    // Mixing toward a light theme text colour can't reach a light box on a
    // dark background (e.g. a code block); try the other direction.
    if (!lifted && toward) return mixToward(colour, behind, target, auto);
    return lifted;
}

function mixToward(colour, behind, target, end) {
    for (let step = 1; step <= INK_STEPS; step += 1) {
        const mix = step / INK_STEPS;
        const blend = {
            r: colour.r + (end.r - colour.r) * mix,
            g: colour.g + (end.g - colour.g) * mix,
            b: colour.b + (end.b - colour.b) * mix,
            a: 1,
        };
        if (contrastRatio(blend, behind) < target) continue;
        // One step past the minimum: the same name also appears on a
        // differently-shaded striped row, so a small margin keeps it
        // passing there too.
        const over = Math.min(step + 1, INK_STEPS) / INK_STEPS;
        return {
            r: colour.r + (end.r - colour.r) * over,
            g: colour.g + (end.g - colour.g) * over,
            b: colour.b + (end.b - colour.b) * over,
            a: 1,
        };
    }
    return null;
}

/** One colour over another, both opaque afterwards. */
function overColour(top, bottom) {
    return {
        r: top.r * top.a + bottom.r * (1 - top.a),
        g: top.g * top.a + bottom.g * (1 - top.a),
        b: top.b * top.a + bottom.b * (1 - top.a),
        a: 1,
    };
}

// Composites the full ancestor chain rather than stopping at the first
// opaque one — a tag/chip/hovered row is a tint over something else, and
// stopping early would measure the wrong colour.
function backdropOf(node) {
    const chain = [];
    for (let at = node.parentElement; at; at = at.parentElement) {
        chain.push(at);
        const colour = parseColour(getComputedStyle(at).backgroundColor);
        if (colour && colour.a >= 1) break;
    }
    let stack = { r: 255, g: 255, b: 255, a: 1 };
    for (const at of chain.reverse()) {
        const colour = parseColour(getComputedStyle(at).backgroundColor);
        if (colour && colour.a > 0) stack = overColour(colour, stack);
    }
    return stack;
}

// A run like 3097072 reads as "long", not three million; this groups it.
// Separator is a narrow no-break space, not a comma — a comma is the decimal
// separator for half this board's readers, and no-break avoids stranding a
// digit at a line wrap. Regrouped, never rounded (a build id/AppID/post
// number is a name, so callers opt in rather than this sweeping a page).
const DIGIT_GROUP = "\u202f";

// 4 digits when the caller knows it's a count; 5 when it's only probably one
// (a 4-digit year is a name, not a quantity — grouping it would be wrong).
const GROUP_FROM_COUNT = 4;
const GROUP_FROM_GUESS = 5;

// 3097072 -> "3 097 072". Anything else, or short enough, is untouched.
function groupDigits(text, from) {
    const raw = String(text).trim();
    if (!/^\d+$/.test(raw)) return raw;
    if (raw.length < (from || GROUP_FROM_COUNT)) return raw;
    return raw.replace(/\B(?=(\d{3})+(?!\d))/g, DIGIT_GROUP);
}

// The board's original text is kept on the title attribute, so the
// unrounded digits can still be read off and copied.
function groupNumbersIn(node, from) {
    if (!node || node.hasAttribute("data-rr-grouped")) return;

    const least = from || GROUP_FROM_COUNT;
    const runs = new RegExp("\\d{" + least + ",}", "g");
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const changes = [];
    let text;
    while ((text = walker.nextNode())) {
        const grouped = text.textContent.replace(runs, (run) => groupDigits(run, least));
        if (grouped !== text.textContent) changes.push([text, grouped]);
    }
    if (!changes.length) return;

    const before = node.textContent.replace(/\s+/g, " ").trim();
    for (const [node_, grouped] of changes) node_.textContent = grouped;
    node.setAttribute("data-rr-grouped", "");
    if (!node.getAttribute("title")) node.setAttribute("title", before);
}

// For board markup (statistics line, profile counters) where a run of
// digits could as easily be a username, so only a whole-text match counts.
function groupCountElements(selector, root) {
    for (const node of (root || document).querySelectorAll(selector)) {
        if (!/^\s*\d{5,}\s*$/.test(node.textContent)) continue;
        groupNumbersIn(node, GROUP_FROM_GUESS);
    }
}

const ICON_PATHS = {
    search:    '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    settings:  '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    mail:      '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/>',
    user:      '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    star:      '<path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.8l6.5-.9z"/>',
    arrowUp:   '<path d="M12 20V5"/><path d="m5 12 7-7 7 7"/>',
    arrowDown: '<path d="M12 4v15"/><path d="m19 12-7 7-7-7"/>',
    link:      '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
    copy:      '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    quote:     '<path d="M7 15c-2 0-3-1.3-3-3.2C4 8.7 6 6.3 9 5l.8 1.7C7.9 7.6 7 8.8 7 10c1.7 0 3 1.1 3 2.6C10 14 8.8 15 7 15z"/><path d="M17 15c-2 0-3-1.3-3-3.2 0-3.1 2-5.5 5-6.8l.8 1.7C17.9 7.6 17 8.8 17 10c1.7 0 3 1.1 3 2.6 0 1.4-1.2 2.4-3 2.4z"/>',
    close:     '<path d="M6 6 18 18M18 6 6 18"/>',
    chevron:   '<path d="m9 6 6 6-6 6"/>',
    chevronL:  '<path d="m15 6-6 6 6 6"/>',
    pageFirst: '<path d="m17 6-6 6 6 6"/><path d="M8 5v14"/>',
    pageLast:  '<path d="m7 6 6 6-6 6"/><path d="M16 5v14"/>',
    chevronD:  '<path d="m6 9 6 6 6-6"/>',
    external:  '<path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    home:      '<path d="M4 10 12 3l8 7v10a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
    layers:    '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    clock:     '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    keyboard:  '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M8 14h8"/>',
    filter:    '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    game:      '<rect x="2" y="7" width="20" height="11" rx="4"/><path d="M7 11v3M5.5 12.5h3M16 12h.01M18.5 14h.01"/>',
    check:     '<path d="m5 12 5 5 9-10"/>',
    reply:     '<path d="M9 10 4 15l5 5"/><path d="M4 15h10a6 6 0 0 0 6-6V5"/>',
    heart:     '<path d="M12 20.3 4.6 13a4.7 4.7 0 0 1 0-6.7 4.7 4.7 0 0 1 6.7 0l.7.7.7-.7a4.7 4.7 0 0 1 6.7 0 4.7 4.7 0 0 1 0 6.7z"/>',
    sliders:   '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h10M18 18h2"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>',
    fold:      '<path d="m7 9 5 5 5-5"/><path d="M4 5h16"/><path d="M4 19h16"/>',
    // A topic: a sheet with lines, since boards already use layers and
    // bookmarks already use stars.
    topic:     '<path d="M5 4h9l5 5v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M14 4v5h5"/><path d="M8 13h7M8 17h5"/>',
    // The board's emblem redrawn: crosshair over a Steam valve, keeping just
    // the half that survives shrinking to 20px.
    crosshair: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2"/><path d="M12 1.5v5M12 17.5v5M1.5 12h5M17.5 12h5"/>',
    clip:      '<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',

    // Writing toolbar: plainest shape per action so it reads at 13px.
    code:      '<path d="M9 7 4 12l5 5M15 7l5 5-5 5"/>',
    list:      '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="18" r="1.2"/>',
    listnum:   '<path d="M10 6h10M10 12h10M10 18h10M4 5.5 5.5 5v4M3.6 15.2a1.4 1.4 0 1 1 2.5.9L3.6 19h3"/>',
    image:     '<rect x="3" y="4.5" width="18" height="15" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="m4 17 4.5-4.5 4 4L16 13l4 4"/>',
    play:      '<rect x="2.5" y="4.5" width="19" height="15" rx="4"/><path d="m10 8.8 5.2 3.2-5.2 3.2z"/>',
    hide:      '<path d="M2.5 12S6.4 5.8 12 5.8 21.5 12 21.5 12 17.6 18.2 12 18.2 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.7"/><path d="M4 20 20 4"/>',
};

// The markup above is easiest to read/edit as-is, but svg.innerHTML and
// DOMParser both throw under Trusted Types. Parsed here with two regexes and
// built with createElementNS instead, so no markup sink needs gating.
const SHAPE_RE = /<([a-z]+)\s+([^>]*?)\s*\/>/gi;
const ATTR_RE = /([\w-]+)="([^"]*)"/g;
const SVG_NS = "http://www.w3.org/2000/svg";

const ICON_CACHE = new Map();

function iconShapes(name) {
    if (ICON_CACHE.has(name)) return ICON_CACHE.get(name);

    const shapes = [];
    const markup = ICON_PATHS[name] || "";
    SHAPE_RE.lastIndex = 0;
    let shape;
    while ((shape = SHAPE_RE.exec(markup)) !== null) {
        const node = document.createElementNS(SVG_NS, shape[1]);
        ATTR_RE.lastIndex = 0;
        let attr;
        while ((attr = ATTR_RE.exec(shape[2])) !== null) {
            node.setAttribute(attr[1], attr[2]);
        }
        shapes.push(node);
    }

    ICON_CACHE.set(name, shapes);
    return shapes;
}

/** An inline SVG icon. The shapes are literals defined above, never
    user content. */
function icon(name, size) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    if (size) { svg.style.width = size + "px"; svg.style.height = size + "px"; }

    for (const shape of iconShapes(name)) svg.append(shape.cloneNode(true));
    return svg;
}

let toastHost = null;

function toast(message) {
    if (!toastHost) {
        // A live region so "Link copied" is said as well as shown.
        toastHost = el("div.rr-toasts", { role: "status", "aria-live": "polite" });
        document.body.append(toastHost);
    }
    const node = el("div.rr-toast", {}, [message]);
    toastHost.append(node);
    setTimeout(() => {
        node.style.transition = "opacity 200ms ease";
        node.style.opacity = "0";
        setTimeout(() => node.remove(), 220);
    }, 1800);
}

async function copyText(text, okMessage) {
    try {
        await navigator.clipboard.writeText(text);
        toast(okMessage || "Copied");
        return true;
    } catch {
        // Clipboard API needs a secure context and a user gesture; fall
        // back to a throwaway textarea so this still works over Tor.
        const box = el("textarea", { style: { position: "fixed", opacity: "0" } });
        box.value = text;
        document.body.append(box);
        box.select();
        let ok = false;
        try { ok = document.execCommand("copy"); } catch { ok = false; }
        box.remove();
        toast(ok ? (okMessage || "Copied") : "Could not copy");
        return ok;
    }
}

// Case, accents and apostrophes folded away, so "dragons" finds "Dragon's"
// and "denuvo" finds "DENUVO".
function foldText(text) {
    return String(text || "")
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        // Apostrophes go altogether: "clancys" finds "Clancy's", and so
        // does "clancy's" typed with either apostrophe.
        .replace(/['\u2019\u02bc]/g, "");
}

// Does text contain every word of query, in any order? A whole-string match
// used to make "cracks hypervisor" miss "Hypervisor cracks support".
function matchesWords(text, query) {
    const words = foldText(query).split(/\s+/).filter(Boolean);
    if (!words.length) return true;
    const hay = foldText(text);
    return words.every((word) => hay.includes(word));
}

/* ================= src/core/page.js ================= */
/* Every phpBB/subsilver2 selector this script relies on lives in this
   file — the one place to fix if the forum template changes:
     - post table    table.tablebg (one per post)
     - post anchor   a[name="p123456"]
     - author        b.postauthor
     - body          div.postbody (a second one is the signature,
                                   starting with the ____ rule)
     - topic rows    a.topictitle inside td.row1
     - forum rows    a.forumlink */

const PAGE = (() => {
    const path = location.pathname.split("/").pop() || "index.php";
    const params = new URLSearchParams(location.search);
    const num = (key) => {
        const value = parseInt(params.get(key) || "", 10);
        return Number.isFinite(value) ? value : null;
    };
    return {
        file: path,
        isIndex: path === "index.php" || path === "",
        isForum: path === "viewforum.php",
        isTopic: path === "viewtopic.php",
        isSearch: path === "search.php",
        isPosting: path === "posting.php",
        isUCP: path === "ucp.php",
        isProfile: path === "memberlist.php",
        forumId: num("f"),
        topicId: num("t"),
        postId: num("p"),
        start: num("start") || 0,
        params,
    };
})();

/** phpBB replaces the logout link with a placeholder for guests. */
function isLoggedIn() {
    return Boolean(document.querySelector('a[href*="mode=logout"]'));
}

function unreadMessages() {
    const link = Array.from(document.querySelectorAll('a[href*="ucp.php"]'))
        .find((a) => /new message/i.test(a.textContent));
    if (!link) return 0;
    const match = link.textContent.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

// Skips template spacer rows via the final filter(Boolean).
function topicRows() {
    return Array.from(document.querySelectorAll("a.topictitle"))
        .map((link) => {
            const cell = link.closest("td");
            const row = link.closest("tr");
            if (!cell || !row) return null;
            const href = link.getAttribute("href") || "";
            const idMatch = href.match(/[?&]t=(\d+)/);
            return {
                row,
                cell,
                link,
                id: idMatch ? idMatch[1] : null,
                title: link.textContent.trim(),
            };
        })
        .filter(Boolean);
}

function forumRows() {
    return Array.from(document.querySelectorAll("a.forumlink"))
        .map((link) => {
            const row = link.closest("tr");
            const href = link.getAttribute("href") || "";
            const match = href.match(/[?&]f=(\d+)/);
            return row && match ? { row, link, id: match[1], title: link.textContent.trim() } : null;
        })
        .filter(Boolean);
}

/**
 * Posts in document order: { table, id, anchor, author, head, headCell,
 * body, signature }. `root` defaults to this document but releases.js
 * passes a detached page fetched separately — nothing here mutates it.
 * `head` is read back live rather than cached, since topic.js may not
 * have built it yet for a given caller; skipping that once put a
 * "hide posts by" control on a row the modern layout hides.
 */
function posts(root = document) {
    const out = [];
    for (const anchor of root.querySelectorAll('a[name^="p"]')) {
        const id = (anchor.getAttribute("name") || "").slice(1);
        if (!/^\d+$/.test(id)) continue;
        const table = anchor.closest("table.tablebg");
        if (!table) continue;
        const bodies = Array.from(table.querySelectorAll("div.postbody"));
        if (!bodies.length) continue;
        // A trailing postbody starting with the ____ rule is the signature.
        let signature = null;
        if (bodies.length > 1) {
            const last = bodies[bodies.length - 1];
            if (/^\s*_{5,}/.test(last.textContent)) signature = last;
        }
        out.push({
            table,
            id,
            anchor,
            author: table.querySelector("b.postauthor"),
            head: table.querySelector(".rr-posthead"),
            headCell: anchor.closest("td")?.parentElement?.querySelector("td.gensmall") || null,
            body: bodies[0],
            signature,
        });
    }
    return out;
}

const STEAM_APP_RE = /(?:store_item_assets\/steam|steam(?:community)?cdn[^/]*)?\/apps?\/(\d{3,8})\//i;

// Reads the AppID from the header image, not the store link: the store
// link is replaced by a guest placeholder but the image URL stays intact.
function parseGameInfo(body) {
    if (!body) return null;

    const info = { appId: null, header: null, fields: {}, title: null };

    for (const img of body.querySelectorAll("img")) {
        const src = img.getAttribute("src") || "";
        const match = src.match(STEAM_APP_RE) || src.match(/\/apps\/(\d{3,8})\//);
        if (match && /header|capsule|library/i.test(src)) {
            info.appId = match[1];
            info.header = src;
            break;
        }
    }
    if (!info.appId) {
        const storeLink = body.querySelector('a[href*="store.steampowered.com/app/"]');
        const match = storeLink && storeLink.getAttribute("href").match(/\/app\/(\d{3,8})/);
        if (match) info.appId = match[1];
    }

    // The SteamInfo BBCode generator emits "<b>Label:</b> value" per line.
    const wanted = /^(Store Page|Genre\(s\)|Developer|Publisher|Release Date|Language\(s\)|Operating system\(s\)|Version|Steam AppID)\s*:?$/i;
    for (const node of body.querySelectorAll('span[style*="bold"], b, strong')) {
        const label = node.textContent.replace(/:\s*$/, "").trim();
        if (!wanted.test(label)) continue;
        const parts = [];
        let cursor = node.nextSibling;
        while (cursor && !(cursor.nodeType === 1 && cursor.tagName === "BR")) {
            parts.push(cursor.textContent || "");
            cursor = cursor.nextSibling;
        }
        const value = parts.join(" ").replace(/\s+/g, " ").trim();
        if (value) info.fields[label] = value;
    }

    const heading = body.querySelector('span[style*="150%"], span[style*="130%"]');
    if (heading) info.title = heading.textContent.trim();

    return info.appId || Object.keys(info.fields).length ? info : null;
}

// Node to fold the Steam boilerplate from, or null.
function steamBlurbStart(body) {
    for (const node of body.querySelectorAll('span[style*="bold"], b, strong')) {
        if (/^(About The Game|System Requirements|Screenshots)$/i.test(node.textContent.trim())) {
            return node.closest("span[style]") || node;
        }
    }
    return null;
}

const PREFIX_KINDS = {
    info: "info",
    release: "release",
    releases: "release",
    problem: "problem",
    problems: "problem",
    important: "important",
    tutorial: "tutorial",
    guide: "tutorial",
    request: "request",
    requests: "request",
    scs: "scs",
    poll: "neutral",
    news: "neutral",
    discussion: "neutral",
};

// Removes the first `count` characters node by node, preserving any
// child elements — unlike `link.textContent = rest`, which would
// silently eat an image or link if a title ever carried one.
function stripLeading(node, count) {
    let left = count;
    for (const child of Array.from(node.childNodes)) {
        if (left <= 0) break;
        const text = child.textContent || "";
        if (text.length <= left) { left -= text.length; child.remove(); continue; }
        if (child.nodeType === 3) { child.textContent = text.slice(left); }
        else { stripLeading(child, left); }
        left = 0;
    }
}

// Splits "[Info] Dragon's Dogma 2" into prefixes and title; topics often
// stack two, as in "[Release] [Userscript] ...".
function splitPrefix(title) {
    const prefixes = [];
    let rest = title.trim();

    while (prefixes.length < 3) {
        const match = rest.match(/^\[\s*([^\]]{1,20})\s*\]\s*(.*)$/s);
        if (!match) break;
        prefixes.push(match[1].trim());
        rest = match[2].trim();
    }

    if (!prefixes.length) return { prefix: null, prefixes: [], kind: null, rest };

    // First recognised prefix decides the colour; unknown stays neutral.
    const kind = prefixes
        .map((name) => PREFIX_KINDS[name.toLowerCase()])
        .find(Boolean) || "neutral";

    return { prefix: prefixes[0], prefixes, kind, rest };
}

/* ================= src/core/pagination.js ================= */
/* phpBB never links an arbitrary page ("1, 2, 3 ... 19, Next"), so jumping
   means deriving offsets: read the numbered anchors, work out the
   posts-per-page step from any two, then synthesise the href for the rest.
   Approach follows the wefalltomorrow fork of CS.RIN.RU Enhanced, no jQuery. */

/** Numbered page anchors on the page, as { page: {href, start} }. */
function pageLinkMap(root = document) {
    const map = new Map();
    for (const link of root.querySelectorAll("a[href]")) {
        const label = link.textContent.trim();
        if (!/^\d+$/.test(label)) continue;
        const href = link.getAttribute("href");
        if (!href || !/viewtopic|viewforum|search|memberlist|viewonline|ucp\.php/.test(href)) continue;

        const page = parseInt(label, 10);
        if (map.has(page)) continue;
        const match = href.match(/[?&]start=(\d+)/);
        map.set(page, { href, start: match ? parseInt(match[1], 10) : 0 });
    }
    return map;
}

/** Posts per page, derived from the offsets of two numbered links. */
function pageStep(map) {
    const entries = Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < entries.length - 1; i += 1) {
        const [page1, first] = entries[i];
        const [page2, second] = entries[i + 1];
        if (page2 <= page1) continue;
        const step = (second.start - first.start) / (page2 - page1);
        if (Number.isInteger(step) && step > 0) return step;
    }
    return null;
}

/** Total page count, from the "Page 1 of 19" the template prints. */
function totalPages() {
    let best = null;
    for (const cell of document.querySelectorAll("td.nav, .nav, .pagination")) {
        // Matches EN "Page 1 of 19" and RU "из 19"; no \b before "из" since \b is ASCII-only.
        const match = cell.textContent.match(/(?:^|\s)(?:of|из)\s+(\d+)(?!\d)/);
        if (!match) continue;
        const value = parseInt(match[1], 10);
        if (value > 0 && (best === null || value > best)) best = value;
    }
    return best;
}

/** The page being viewed, from the bold entry in the pagination strip. */
function currentPage() {
    const start = Number(PAGE.start) || 0;
    const map = pageLinkMap();
    const step = pageStep(map);
    if (step) return Math.floor(start / step) + 1;

    for (const strong of document.querySelectorAll("td.nav strong, .nav strong")) {
        const text = strong.textContent.trim();
        if (/^\d+$/.test(text)) return parseInt(text, 10);
    }
    return 1;
}

/** A URL for the given page: a real link if the template printed one, else start= rewritten. */
function pageHref(page) {
    if (page < 1) return null;

    const map = pageLinkMap();
    const known = map.get(page);
    if (known) return known.href;

    const step = pageStep(map);
    if (step === null) return null;

    const start = (page - 1) * step;
    const url = new URL(location.href);
    if (start === 0) url.searchParams.delete("start");
    else url.searchParams.set("start", String(start));
    return url.toString();
}

/** Everything a caller usually needs, in one read. */
function pagination() {
    const total = totalPages();
    const current = currentPage();
    return {
        current,
        total,
        step: pageStep(pageLinkMap()),
        hasNext: total !== null && current < total,
        hasPrevious: current > 1,
        first: pageHref(1),
        last: total ? pageHref(total) : null,
        next: pageHref(current + 1),
        previous: pageHref(current - 1),
    };
}

/* ================= src/core/i18n.js ================= */
/* The script's own UI strings, translated for the Russian half of this
   bilingual board (see lists.js/topic.js for reading the board's own RU
   text). `t(key, vars)` looks up `key` on a Russian page and fills `{vars}`;
   an entry may be a function because Russian plurals have three forms
   (1 спойлер, 3 спойлера, 5 спойлеров). */

/** Russian plural: one / few / many, by the last digits. */
function ruPlural(n, one, few, many) {
    const value = Math.abs(Number(n)) || 0;
    const tens = value % 100;
    const ones = value % 10;
    if (tens >= 11 && tens <= 14) return many;
    if (ones === 1) return one;
    if (ones >= 2 && ones <= 4) return few;
    return many;
}

const RU_WORDS = {
    "Reply": "Ответить",
    "New topic": "Новая тема",
    "Open all {n} spoilers": ({ n }) => "Раскрыть все " + n + " " + ruPlural(n, "спойлер", "спойлера", "спойлеров"),
    "First unread": "Первое непрочитанное",
    "Jump to the first post you have not read": "К первому непрочитанному сообщению",
    "Page {a} of {b}": "Страница {a} из {b}",
    "Page": "Страница",
    "of {n}": "из {n}",
    "First page": "Первая страница",
    "Previous page": "Предыдущая страница",
    "Next page": "Следующая страница",
    "Last page": "Последняя страница",
    "Go to page": "Перейти к странице",
    "Previous": "Назад",
    "Next": "Вперёд",
    "Pages of this topic": "Страницы темы",
    "Could not work out that page": "Не удалось определить страницу",
    "Previous topic": "Предыдущая тема",
    "Next topic": "Следующая тема",
    "Print view": "Версия для печати",

    "Copy link to this post": "Скопировать ссылку на сообщение",
    "Copy as a quote": "Скопировать как цитату",
    "Show signature": "Показать подпись",
    "Hide signature": "Скрыть подпись",
    "Show ": "Показать ",
    "Hide ": "Скрыть ",
    "Show": "Показать",
    "the original post": "исходное сообщение",
    "the full Steam description": "полное описание Steam",
    "this category": "этот раздел",
    "Close all {n} spoilers": ({ n }) => "Скрыть все " + n + " " + ruPlural(n, "спойлер", "спойлера", "спойлеров"),
    "Close the image": "Закрыть изображение",
    "Image": "Изображение",
    "Leave the forum for this address?": "Перейти с форума по этому адресу?",
    "Only posts with links": "Только сообщения со ссылками",
    "{n} posts shown": ({ n }) => "Показано " + n + " " + ruPlural(n, "сообщение", "сообщения", "сообщений"),
    "All posts shown": "Показаны все сообщения",
    "Post by {name} is hidden": "Сообщение {name} скрыто",
    "Show posts by {name}": "Показать сообщения {name}",
    "Hide posts by {name}": "Скрыть сообщения {name}",
    "Hide posts by this member": "Скрыть сообщения этого участника",

    "{n} on this page": "{n} на этой странице",
    "{a} of {b} on this page": "{a} из {b} на этой странице",
    "Filter this page by title": "Фильтр по названию",
    "Filter topics on this page": "Фильтр тем на этой странице",
    "Show only {x}": "Показать только {x}",
    "Forum rules": "Правила форума",
    "Read the forum rules": "Прочитать правила форума",
    "Hide the forum rules": "Скрыть правила форума",
    "Tag": "Метка",
    "Show only one kind of topic": "Показать только один вид тем",
    "Showing only {x} — pick another or clear": "Показаны только {x} — выберите другую или снимите",
    "Bookmark this topic": "В закладки",
    "{n} topics": ({ n }) => n + " " + ruPlural(n, "тема", "темы", "тем"),
    "Fold this section": "Свернуть раздел",
    "Show this section": "Показать раздел",
    "Subforums": "Подфорумы",

    "This topic": "Эта тема",
    "This forum": "Этот форум",
    "Whole board": "Весь форум",
    "Where": "Где",
    "Look in": "Искать в",
    "Titles": "Названия",
    "First post": "Первое сообщение",
    "Message text": "Текст сообщений",
    "All posts": "Все сообщения",
    "Terms": "Слова",
    "All words": "Все слова",
    "Any word": "Любое слово",
    "Posts": "Сообщения",
    "Author": "Автор",
    "Any member": "Любой участник",
    "Where to search": "Где искать",
    "What to search": "Что искать",
    "Search options": "Параметры поиска",
    "Search this topic": "Поиск в теме",
    "Search this forum": "Поиск в форуме",
    "Search the whole board": "Поиск по всему форуму",
    "Search {forum}": "Поиск в «{forum}»",
    "Search options — looking in {where}": "Параметры поиска — ищет в «{where}»",
    "That forum": "Тот форум",

    "{n} online": "{n} онлайн",
    "{n} browsing": "{n} просматривают",
    "{n} registered": "{n} зарегистрированных",
    "{n} hidden": "{n} скрытых",
    "{n} guests": ({ n }) => n + " " + ruPlural(n, "гость", "гостя", "гостей"),
    "Show all {n} names": ({ n }) => "Показать все " + n + " " + ruPlural(n, "имя", "имени", "имён"),
    "Hide the list": "Скрыть список",

    "Releases": "Релизы",
    "Fold the Releases panel": "Свернуть панель релизов",
    "Open the Releases panel": "Открыть панель релизов",
    "{n} release": "{n} релиз",
    "{n} releases": ({ n }) => n + " " + ruPlural(n, "релиз", "релиза", "релизов"),
    " on this page": " на этой странице",
    "This page": "Эта страница",
    "All {n} page": "Вся тема ({n} страница)",
    "All {n} pages": ({ n }) => "Все " + n + " " + ruPlural(n, "страница", "страницы", "страниц"),
    "Filter by kind": "Фильтр по типу",
    "Reading {a} of {b}…": "Читаю {a} из {b}…",
    "Which end to read from": "С какого конца читать",
    "Newest first": "Сначала новые",
    "Oldest first": "Сначала старые",
    "Start at the last page and work back": "Начать с последней страницы и идти назад",
    "Start at page one and work forward": "Начать с первой страницы и идти вперёд",
    "Could not read the whole topic": "Не удалось прочитать всю тему",
    "Stopped reading the topic": "Чтение темы остановлено",
    "Reading a whole topic is switched off in the settings": "Чтение всей темы отключено в настройках",
    "This topic is one page — you are looking at all of it": "В теме одна страница — вы видите её целиком",
    "No version given in this post": "Версия в сообщении не указана",
    "No version given": "Версия не указана",
    "Steam build {n}, which is not a version number": "Сборка Steam {n} — это не номер версии",
    "build": "сборка",
    "p.": "с.",
    "{n} link": "{n} ссылка",
    "{n} links": ({ n }) => n + " " + ruPlural(n, "ссылка", "ссылки", "ссылок"),
    "Read it again": "Прочитать заново",
    "1 page read": "Прочитана 1 страница",
    "{n} pages read": ({ n }) => "Прочитано " + n + " " + ruPlural(n, "страница", "страницы", "страниц"),
    "{n} pages have not been read yet": ({ n }) => n + " " + ruPlural(n, "страница", "страницы", "страниц") + " ещё не прочитано",
    "{n} left": "осталось {n}",
    "still reading": "чтение продолжается",
    "reading…": "читаю…",
    "Read {n} more": "Прочитать ещё {n}",
    "Keep going back through the topic, {n} pages at a time": "Читать тему дальше назад, по {n} страниц за раз",
    "stopped early": "остановлено раньше",
    "the board was busy, so this was read slowly": "форум был занят, поэтому чтение шло медленно",
    "The board was answering slowly, so this was read a couple of pages at a time": "Форум отвечал медленно, поэтому страницы читались по две",
    "The board asked for a slower pace, so the topic was only read this far": "Форум попросил сбавить темп, поэтому тема прочитана только досюда",
    "read gently": "читалось бережно",
    "read {ago}": "прочитано {ago}",
    "{n} new since": ({ n }) => n + " " + ruPlural(n, "новое", "новых", "новых") + " с тех пор",
    "1 newer post since": "1 новое сообщение с тех пор",
    "{n} newer posts since": ({ n }) => n + " " + ruPlural(n, "новое сообщение", "новых сообщения", "новых сообщений") + " с тех пор",
    "just now": "только что",
    "{n} minutes ago": ({ n }) => n + " " + ruPlural(n, "минуту", "минуты", "минут") + " назад",
    "1 hour ago": "1 час назад",
    "{n} hours ago": ({ n }) => n + " " + ruPlural(n, "час", "часа", "часов") + " назад",
    "{n} days ago": ({ n }) => n + " " + ruPlural(n, "день", "дня", "дней") + " назад",
    "Latest posted: version {v}": "Последняя версия в теме: {v}",
    "Latest posted: v{v}": "Последняя: v{v}",
    "Clean Steam files": "Чистые файлы Steam",
    "Repack": "Репак",
    "Crack": "Кряк",
    "Hypervisor": "Гипервизор",
    "Online fix": "Онлайн-фикс",
    "Update": "Обновление",
    "Reupload": "Перезалив",
    "Trainer": "Трейнер",
    "Language": "Локализация",
    "Tool": "Утилита",

    "Write a reply": "Написать ответ",
    "Finish your reply": "Закончить ответ",
    "Loading the reply form…": "Загрузка формы…",
    "Post reply": "Отправить",
    "Open the full editor": "Открыть полный редактор",
    "Preview, attachments and the full toolbar": "Предпросмотр, вложения и полная панель",
    "Could not load the reply form. Opening the full editor instead.": "Не удалось загрузить форму. Открываю полный редактор.",
    "Added to your reply": "Добавлено в ответ",
    "Formatting": "Форматирование",
    "Bold": "Жирный",
    "Italic": "Курсив",
    "Underline": "Подчёркнутый",
    "Quote": "Цитата",
    "Code": "Код",
    "Link": "Ссылка",
    "Spoiler": "Спойлер",

    // posting.php toolbar: captions are the button's own short label, tips describe the action.
    "B": "Ж",
    "i": "К",
    "u": "П",
    "S": "З",
    "Strikethrough": "Зачёркнутый",
    "Quote a post": "Цитата сообщения",
    "Code, kept as typed": "Код, как он набран",
    "List": "Список",
    "Bulleted list": "Маркированный список",
    "Numbered": "Нумерация",
    "Numbered list": "Нумерованный список",
    "Item": "Пункт",
    "An item in a list": "Пункт списка",
    "Image from a URL": "Изображение по адресу",
    "Link to a page": "Ссылка на страницу",
    "Named spoiler": "Спойлер с заголовком",
    "Hide text until clicked": "Скрыть текст до нажатия",
    "Spoiler with a title": "Спойлер со своим заголовком",
    "YouTube": "YouTube",
    "Embed a YouTube video": "Вставить видео с YouTube",
    "SteamInfo": "SteamInfo",
    "Game details from Steam": "Данные об игре из Steam",
    "Text size": "Размер текста",

    "More": "Ещё",
    "Less": "Свернуть",
    "Unread": "Новое",
    "Password": "Пароль",
    "Copy the password": "Скопировать пароль",
    "Password copied": "Пароль скопирован",
    "Copy every link in this post": "Скопировать все ссылки этого сообщения",
    "Copy this list": "Скопировать список",
    "Previous image": "Предыдущее изображение",
    "Next image": "Следующее изображение",
    "New since your last visit": "Новое с вашего последнего визита",
    "New since {when}": "Новое с {when}",
    "Back to page {n}": "Назад к странице {n}",
    "You were reading page {n} of this topic": "Вы читали страницу {n} этой темы",
    "{n} link copied": "{n} ссылка скопирована",
    "{n} links copied": "{n} ссылок скопировано",
    "{n} lines copied": "{n} строк скопировано",
    "Show only the topics with unread posts": "Показать только темы с новыми сообщениями",
    "Mark everything on this page": "Отметить всё на этой странице",
    "More board links": "Ещё ссылки",
    "Board links": "Ссылки форума",
    "Search or jump to": "Поиск или переход",
    "Search and jump (Ctrl+K)": "Поиск и переход (Ctrl+K)",
    "Private messages": "Личные сообщения",
    "Private messages — {n} unread": "Личные сообщения — {n} непрочитанных",
    "Your account": "Ваш профиль",
    "Log in": "Вход",
    "RIN Reforged settings": "Настройки RIN Reforged",
    "Skip to content": "К содержимому",

    // The Steam preview card replaces the board's own "Posted:" hover tooltip, so its date needs translating too.
    "Topic opened {when}": "Тема создана {when}",

    "Boards": "Разделы",
    "Recent": "Недавние",
    "Actions": "Действия",
    "Search the forum, or jump to a board": "Поиск по форуму или переход в раздел",
    "Search the forum for {q}": "Искать на форуме: {q}",
    "Search {forum} for {q}": "Искать в «{forum}»: {q}",
    "Search the forum for {q} by {who}": "Искать на форуме: {q} — от {who}",
    "Search {forum} for {q} by {who}": "Искать в «{forum}»: {q} — от {who}",
    "Everything {who} posted": "Все сообщения {who}",
    "Everything {who} posted in {forum}": "Все сообщения {who} в «{forum}»",
    "Releases in this topic": "Релизы в этой теме",
    "How much to look at": "Сколько смотреть",
    "Search": "Поиск",
    "Nothing matches that": "Ничего не найдено",
    "topic": "тема",
    "board": "раздел",

    "Topics": "Темы",
    "wait {n}s": "подождите {n} с",
    "Reading that topic…": "Читаю тему…",
    "this topic": "эта тема",
    "Opened by {who}": "Создал {who}",
    "Enter to open": "Enter — открыть",
    "{n} pages": (vars) => {
        // страница/страницы/страниц plural, with the teens as the exception.
        const n = Number(vars.n) || 0;
        const teens = n % 100 >= 11 && n % 100 <= 14;
        const last = n % 10;
        if (!teens && last === 1) return n + " страница";
        if (!teens && last >= 2 && last <= 4) return n + " страницы";
        return n + " страниц";
    },
};

/** Looks up `key` for the page's language (via `currentLanguage()`) and fills `{vars}` slots. */
function t(key, vars) {
    let text = key;
    if (currentLanguage() === "ru" && Object.prototype.hasOwnProperty.call(RU_WORDS, key)) {
        text = RU_WORDS[key];
        if (typeof text === "function") text = text(vars || {});
    }
    if (vars) {
        for (const [name, value] of Object.entries(vars)) {
            text = text.split("{" + name + "}").join(String(value));
        }
    }
    return text;
}

/* ================= src/modules/theme.js ================= */
// Theme application: runs at document-start (before the original stylesheet
// can flash) and again on every settings change.

const ACCENTS = {
    brass:  { accent: "#e0a338", soft: "#4a3a1c", text: "#0e1013", light: "#a5701a", lightSoft: "#f5e6c8", lightText: "#ffffff" },
    rin:    { accent: "#d46234", soft: "#40200f", text: "#120703", light: "#a8451d", lightSoft: "#f8e0d5", lightText: "#ffffff" },
    steam:  { accent: "#66c0f4", soft: "#173a52", text: "#0c1116", light: "#1c6ea4", lightSoft: "#d8ecf9", lightText: "#ffffff" },
    moss:   { accent: "#6bbd85", soft: "#1e3a28", text: "#0d1712", light: "#22754a", lightSoft: "#d9efe1", lightText: "#ffffff" },
    rose:   { accent: "#e0748c", soft: "#42212a", text: "#180d10", light: "#a83b58", lightSoft: "#f8dee5", lightText: "#ffffff" },
    violet: { accent: "#a795d8", soft: "#2e2842", text: "#120f1c", light: "#5f4a9c", lightSoft: "#e6e0f6", lightText: "#ffffff" },
};

function resolveTheme(choice) {
    if (choice !== "auto") return choice;
    const light = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    return light ? "paper" : "native";
}

function applyTheme() {
    const root = document.documentElement;
    if (!root) return;
    const theme = resolveTheme(settings.get("theme"));
    const isLight = theme === "paper";

    root.setAttribute("data-rr", "");
    root.setAttribute("data-rr-theme", theme);
    root.setAttribute("data-rr-density", settings.get("density"));
    root.setAttribute("data-rr-width", settings.get("width"));
    root.setAttribute("data-rr-page", PAGE.isTopic ? "topic" : PAGE.isForum ? "forum" : PAGE.isIndex ? "index" : PAGE.isSearch ? "search" : "other");
    root.setAttribute("data-rr-icons", settings.get("modernIcons") ? "on" : "off");
    root.setAttribute("data-rr-nav", settings.get("navbar") ? "on" : "off");
    // Distinct from the top-bar setting: board links or masthead alone also
    // replace the header. Set early to avoid a flash; navbar.js corrects it
    // if nothing was actually built.
    root.setAttribute("data-rr-header",
        settings.get("navbar") || settings.get("boardLinks") || settings.get("masthead") ? "rr" : "board");
    root.setAttribute("data-rr-sticky", settings.get("stickyHeads") ? "on" : "off");
    root.toggleAttribute("data-rr-still", Boolean(settings.get("reduceMotion")));

    root.style.setProperty("--rr-fs", settings.get("fontSize") + "px");

    const accent = ACCENTS[settings.get("accent")] || ACCENTS.brass;
    const ink = isLight ? accent.light : accent.accent;
    const soft = isLight ? accent.lightSoft : accent.soft;
    root.style.setProperty("--rr-accent", ink);
    root.style.setProperty("--rr-accent-soft", soft);
    root.style.setProperty("--rr-accent-text", isLight ? accent.lightText : accent.text);
    // Accent-as-text on its own soft wash (filter chip, tab count) read 3.3:1
    // on the light theme; lifted toward black/white until it clears 4.5.
    const lifted = readableInk(parseColour(ink), parseColour(soft), 4.5);
    root.style.setProperty("--rr-accent-on-soft", lifted ? rgbText(lifted) : ink);
    root.style.setProperty("color-scheme", isLight ? "light" : "dark");
}

/** The forum ships no viewport tag, so phones get the 1000px page scaled down unreadable. */
function ensureViewport() {
    // <head> may not exist yet at document-start; safe to wait since layout hasn't happened.
    const place = () => {
        if (!document.head) return false;
        let meta = document.querySelector('meta[name="viewport"]');
        if (!meta) {
            meta = document.createElement("meta");
            meta.name = "viewport";
            document.head.append(meta);
        }
        meta.content = "width=device-width, initial-scale=1, viewport-fit=cover";
        return true;
    };

    if (place()) return;
    const observer = new MutationObserver(() => { if (place()) observer.disconnect(); });
    observer.observe(document, { childList: true, subtree: true });
}

function initTheme() {
    applyTheme();
    ensureViewport();
    settings.onChange((id) => {
        if (["theme", "accent", "density", "fontSize", "width", "modernIcons", "navbar", "boardLinks", "masthead", "reduceMotion"].includes(id) || id === "*") {
            applyTheme();
        }
    });
    if (window.matchMedia) {
        const query = window.matchMedia("(prefers-color-scheme: light)");
        const listener = () => { if (settings.get("theme") === "auto") applyTheme(); };
        if (query.addEventListener) query.addEventListener("change", listener);
        else if (query.addListener) query.addListener(listener);
    }
}

// The board's own inline colours (group-coloured usernames at 2.5:1 dark /
// 1.9:1 light, the login-to-see-link marker at 3.1) are lifted in lightness
// only, by the smallest step that clears contrast against their actual
// backdrop; the original value is kept on the element. One shared threshold,
// slightly above the usual 4.5, so this pass and test/contrast.js can't disagree.
const INK_TARGET = 4.75;

function readableBoardInk() {
    if (!settings.get("readableInk")) return;

    // Lift toward the theme's own strongest text colour, so results land in-palette.
    const toward = parseColour(
        getComputedStyle(document.documentElement).getPropertyValue("--rr-text-strong").trim())
        || null;

    const behind = new Map();
    const backdropFor = (node) => {
        const parent = node.parentElement;
        if (!parent) return null;
        if (!behind.has(parent)) behind.set(parent, backdropOf(node));
        return behind.get(parent);
    };

    for (const node of document.querySelectorAll('#wrapcentre [style*="color"], .rr-nav [style*="color"]')) {
        const written = node.style.color;
        if (!written || node.hasAttribute("data-rr-ink")) continue;

        const colour = parseColour(getComputedStyle(node).color);
        const bg = backdropFor(node);
        if (!colour || !bg) continue;

        const lifted = readableInk(colour, bg, INK_TARGET, toward);
        if (!lifted) continue;

        node.setAttribute("data-rr-ink", written);
        node.style.color = rgbText(lifted);
    }
}

/** A parsed colour back as CSS. */
function rgbText(colour) {
    return "rgb(" + Math.round(colour.r) + ", " + Math.round(colour.g) + ", " + Math.round(colour.b) + ")";
}

/* ================= src/modules/icons.js ================= */
/* The board draws its interface with GIFs from 2003 (beveled checkboxes,
   image buttons, arrows). Hiding them in CSS would leave their alt text
   behind, so they're replaced here instead: original title kept for hover
   help, original node kept as display:none since other userscripts look for it. */

const STATUS_RE = /(global|announce|sticky|topic|forum)_(un)?read|topic_moved/;

// Pure decoration: menu bullets, the page-jump target, subsilver2's table-corner spacers.
const DECORATION_RE = /icon_mini_|icon_donate|spacer\.gif|icon_post_target|\/arrow_|subforum_|whosonline/;

function statusDot(img) {
    const src = img.getAttribute("src") || "";
    const unread = /_unread/.test(src);
    const locked = /locked/.test(src);
    const moved = /topic_moved/.test(src);

    const dot = el("span.rr-dot", {
        title: img.getAttribute("title") || img.getAttribute("alt") || "",
        "data-state": moved ? "moved" : unread ? "unread" : "read",
        "data-locked": locked ? "1" : null,
        "aria-hidden": "true",
    });
    img.after(dot);
    img.style.display = "none";
}

function latestPostArrow(img) {
    const link = img.closest("a");
    const replacement = icon("chevron", 13);
    replacement.classList.add("rr-latest");
    if (link) link.setAttribute("title", img.getAttribute("title") || "View the latest post");
    img.after(replacement);
    img.style.display = "none";
}

// "This topic has an attachment": the template draws its paperclip GIF ahead
// of the title and the [Release] tag; the glyph replaces it in the same spot
// because placing it after the title wraps to its own line on a full-width phone card.
function attachmentGlyph(img) {
    const label = img.getAttribute("title") || img.getAttribute("alt") || "Attachment(s)";
    const glyph = icon("clip", 12);
    glyph.classList.add("rr-attach");
    glyph.setAttribute("title", label);
    img.after(glyph);
    img.style.display = "none";
}

// A link whose only content is an image ("Reply with quote", "Profile",
// permalink): hiding the image would leave it with nothing marking it, so
// the alt text becomes a real label. Must run before the catch-all below.
function controlLink(img) {
    const link = img.closest("a");
    if (!link || link.textContent.trim()) return false;

    const label = (img.getAttribute("title") || img.getAttribute("alt") || "").trim();
    if (!label || label === "*") return false;

    if (unreadJump(link, img, label)) return true;

    link.classList.add("rr-ctl");
    link.setAttribute("title", label);
    link.append(el("span.rr-ctl__label", {}, [label]));
    img.style.display = "none";
    return true;
}

// "View first unread post" arrow: kept as a small arrow after the title rather
// than a labelled button, since as a button it was a loud 146px control repeated
// on every row of "View new posts". Hidden when unreadFromList already covers it.
function unreadJump(link, img, label) {
    if (!/view=unread/.test(link.getAttribute("href") || "")) return false;
    const row = link.closest("tr");
    // Watched-topics rows have no class on the title link, so pick whichever link
    // in the row isn't this arrow and isn't a page number.
    const title = row && (row.querySelector("a.topictitle, .topictitle a")
        || Array.from(row.querySelectorAll('a[href*="viewtopic.php"]'))
            .find((a) => a !== link && !/view=unread|[?&]p=\d|start=\d/.test(a.getAttribute("href") || "") && a.textContent.trim().length > 2));
    if (!title) return false;

    link.classList.add("rr-icon-btn", "rr-unread-jump");
    link.setAttribute("title", label);
    link.setAttribute("aria-label", label);
    link.append(icon("arrowDown", 12));
    img.style.display = "none";
    title.after(link);
    return true;
}

function imageButton(img) {
    const link = img.closest("a");
    if (!link) return;
    const label = (img.getAttribute("alt") || img.getAttribute("title") || "").trim();
    if (!label) return;

    const primary = /reply|new topic|post/i.test(label);
    link.classList.add("rr-btn");
    if (primary) link.setAttribute("data-variant", "primary");
    link.append(document.createTextNode(label));
    img.style.display = "none";
}

function initIcons() {
    if (!settings.get("modernIcons")) return;

    for (const img of document.querySelectorAll('img[src*="/imageset/"], img[src*="/theme/images/"]')) {
        const src = img.getAttribute("src") || "";

        // Skip the masthead logo: it's an <img>-only link like controlLink() targets,
        // which would otherwise turn it into a chip reading "Logo".
        if (/site_logo|imageset\/logo/i.test(src)) continue;

        if (STATUS_RE.test(src)) { statusDot(img); continue; }
        if (/icon_topic_latest/.test(src)) { latestPostArrow(img); continue; }
        if (/icon_topic_attach/.test(src)) { attachmentGlyph(img); continue; }
        if (/\/button_/.test(src)) { imageButton(img); continue; }
        if (controlLink(img)) continue;

        // Only known decoration is hidden; a catch-all here previously hid unrecognised
        // images too, which silently swallowed the SCS status tags in topic titles.
        if (DECORATION_RE.test(src)) { img.style.display = "none"; continue; }
        img.classList.add("rr-legacy-img");
    }

    // Marked for CSS: with its icon gone, "Go to page:" is left with a stray colon.
    for (const strip of document.querySelectorAll("p.gensmall")) {
        if (/Go to page/.test(strip.textContent)) strip.classList.add("rr-pagejump");
    }

    hideEmptyRows();
}

// subsilver2 draws table-corner rounding with rows holding a single &nbsp;;
// with those corner images gone they're just 30px of empty space.
function hideEmptyRows() {
    for (const row of document.querySelectorAll("table.tablebg > tbody > tr")) {
        if (row.querySelector("img, input, a, form, h4")) continue;
        if (row.textContent.trim() !== "") continue;
        row.style.display = "none";
    }
}

/* ================= src/modules/settingsui.js ================= */
/* Settings panel, generated entirely from schema.js — a new feature is just a
   new schema entry. Changes apply live (no Save button); fields marked
   `reload` in the schema are the exception, see applyField. A rail of
   categories beside the controls, searchable across all of them at once. */

let panelHost = null;

// Store a field's value; reload if the schema marks it `reload` (e.g. the
// top bar, built once from the board's own header markup at load, can't be
// un-toggled live without the board's header and the bar overlapping).
function applyField(field, value) {
    settings.set(field.id, value);
    if (!field.reload) return;
    toast(t("Applying. Reloading."));
    setTimeout(() => location.reload(), 600);
}

// Every control exposes sync() to reflect a setting changed elsewhere (palette
// theme switch, import) rather than only what was true when the panel opened.

function buildToggle(field) {
    const button = el("button.rr-switch", {
        type: "button",
        role: "switch",
        "aria-checked": settings.get(field.id) ? "true" : "false",
        "aria-label": field.label,
    });
    button.addEventListener("click", () => {
        const next = button.getAttribute("aria-checked") !== "true";
        button.setAttribute("aria-checked", next ? "true" : "false");
        applyField(field, next);
    });
    button.sync = () => button.setAttribute("aria-checked", settings.get(field.id) ? "true" : "false");
    return button;
}

function buildSegmented(field) {
    const group = el("div.rr-seg", { role: "group", "aria-label": field.label });
    const sync = () => {
        for (const button of group.children) {
            button.setAttribute("aria-pressed", button.dataset.value === String(settings.get(field.id)) ? "true" : "false");
        }
    };
    for (const option of field.options) {
        const button = el("button", { type: "button" }, [option.label]);
        button.dataset.value = option.value;
        button.addEventListener("click", () => { applyField(field, option.value); sync(); });
        group.append(button);
    }
    sync();
    group.sync = sync;
    return group;
}

function buildRange(field) {
    const readout = el("span.rr-range-val", {}, [settings.get(field.id) + (field.unit || "")]);
    const input = el("input.rr-range", {
        type: "range",
        min: String(field.min),
        max: String(field.max),
        step: String(field.step || 1),
        value: String(settings.get(field.id)),
        "aria-label": field.label,
    });
    input.addEventListener("input", () => {
        const value = Number(input.value);
        readout.textContent = value + (field.unit || "");
        applyField(field, value);
    });
    const wrap = el("div.rr-rangewrap", {}, [input, readout]);
    wrap.sync = () => {
        const value = settings.get(field.id);
        input.value = String(value);
        readout.textContent = value + (field.unit || "");
    };
    return wrap;
}

// Named chips (dot + label + tick), not unlabelled colour squares — those
// required hovering each one to tell which was which.
function buildSwatches(field) {
    const group = el("div.rr-swatches", { role: "radiogroup", "aria-label": field.label });
    const sync = () => {
        for (const button of group.children) {
            const on = button.dataset.value === settings.get(field.id);
            button.setAttribute("aria-pressed", on ? "true" : "false");
            button.setAttribute("aria-checked", on ? "true" : "false");
        }
    };
    for (const option of field.options) {
        const dot = el("span.rr-swatch__dot", {}, [icon("check", 13)]);
        // el()'s Object.assign onto style silently drops custom properties; setProperty is required.
        dot.style.setProperty("--rr-swatch", option.color);
        const button = el("button.rr-swatch", {
            type: "button",
            role: "radio",
            "aria-label": option.label,
        }, [dot, el("span.rr-swatch__name", {}, [option.label])]);
        button.dataset.value = option.value;
        button.addEventListener("click", () => { applyField(field, option.value); sync(); });
        group.append(button);
    }
    sync();
    group.sync = sync;
    return group;
}

function buildControl(field) {
    switch (field.type) {
        case "toggle": return buildToggle(field);
        case "seg": return buildSegmented(field);
        case "range": return buildRange(field);
        case "swatch": return buildSwatches(field);
        default: return el("span");
    }
}

function buildField(field) {
    const row = el("div.rr-field", { "data-field": field.id }, [
        el("div.rr-field__text", {}, [
            el("span.rr-field__label", {}, [field.label]),
            field.desc ? el("span.rr-field__desc", {}, [field.desc]) : null,
        ]),
        el("div.rr-field__control", {}, [buildControl(field)]),
    ]);
    // Searchable by label/desc, not just the id (which nobody types but an export shows).
    row.dataset.search = (field.label + " " + (field.desc || "") + " " + field.id).toLowerCase();
    if (field.when) row.setAttribute("data-rr-dep", field.when);
    return row;
}

function syncDependencies(body) {
    for (const row of body.querySelectorAll("[data-rr-dep]")) {
        row.toggleAttribute("data-rr-dep-off", !settings.get(row.getAttribute("data-rr-dep")));
    }
}

function syncControls(body) {
    for (const control of body.querySelectorAll(".rr-field__control > *")) {
        if (typeof control.sync === "function") control.sync();
    }
}

function exportSettings() {
    const payload = {
        script: "RIN Reforged",
        version: RR_VERSION,
        exported: new Date().toISOString(),
        settings: settings.all(),
        // Everything but drafts: an unsent reply has no business on a clipboard.
        data: Object.fromEntries(Object.entries(store.all()).filter(([key]) => key !== "drafts")),
    };
    copyText(JSON.stringify(payload, null, 2), "Settings and data copied as JSON");
}

// Wipes rr:data plus the topic-title index bucket by name (see forgetTopicIndex),
// since that one lives outside rr:data and store.replace({}) wouldn't reach it.
function clearData() {
    if (!window.confirm("Forget bookmarks, reading history, hidden members, remembered topic titles and the Releases cache? Your settings stay.")) return;
    store.replace({});
    forgetTopicIndex();
    toast("Data cleared");
    setTimeout(() => location.reload(), 1000);
}

async function importSettings() {
    let text = "";
    try {
        text = await navigator.clipboard.readText();
    } catch {
        text = window.prompt("Paste the exported JSON") || "";
    }
    if (!text.trim()) return;
    try {
        const payload = JSON.parse(text);
        if (payload.settings) settings.replace(payload.settings);
        if (payload.data) store.replace(payload.data);
        toast("Settings imported. Reloading.");
        setTimeout(() => location.reload(), 1000);
    } catch {
        toast("That is not valid exported JSON");
    }
}

// Tracks two independent hidden-states per row: dependency-off (stays hidden
// while searching) and search-no-match (so a category can say "no matches").
function buildPanelBody() {
    const rail = el("nav.rr-panel__rail", { "aria-label": "Settings categories" });
    const pages = el("div.rr-panel__pages");
    const groups = [];

    for (const group of SETTINGS_SCHEMA) {
        const section = el("section.rr-group", { "data-group": group.id, role: "tabpanel", "aria-label": group.title }, [
            el("h3.rr-group__title", {}, [group.title]),
            group.note ? el("p.rr-group__note", {}, [group.note]) : null,
        ]);
        for (const field of group.fields) section.append(buildField(field));

        const count = el("span.rr-panel__tabcount");
        const tab = el("button.rr-panel__tab", {
            type: "button",
            role: "tab",
            "aria-selected": "false",
            "data-group": group.id,
        }, [icon(group.icon || "settings", 15), el("span.rr-panel__tabname", {}, [group.short || group.title]), count]);

        pages.append(section);
        groups.push({ group, section, tab, count });
        rail.append(tab);
    }

    let current = groups[0].group.id;
    const select = (id) => {
        current = id;
        for (const entry of groups) {
            const on = entry.group.id === id;
            entry.tab.setAttribute("aria-selected", on ? "true" : "false");
            entry.section.toggleAttribute("data-rr-off", !on);
        }
        pages.scrollTop = 0;
    };
    for (const entry of groups) {
        entry.tab.addEventListener("click", () => select(entry.group.id));
    }

    rail.addEventListener("keydown", (event) => {
        const index = groups.findIndex((entry) => entry.group.id === current);
        let next = null;
        if (event.key === "ArrowDown" || event.key === "ArrowRight") next = index + 1;
        else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = index - 1;
        else return;
        event.preventDefault();
        const target = groups[clamp(next, 0, groups.length - 1)];
        select(target.group.id);
        target.tab.focus();
    });

    // Search shows every match across all categories at once, with a count per rail tab.
    const search = (needle) => {
        const query = needle.trim().toLowerCase();
        let total = 0;

        for (const entry of groups) {
            let shown = 0;
            for (const row of entry.section.querySelectorAll(".rr-field")) {
                const match = !query || row.dataset.search.includes(query);
                row.toggleAttribute("data-rr-nomatch", !match);
                if (match) shown += 1;
            }
            entry.count.textContent = query ? String(shown) : "";
            entry.tab.toggleAttribute("data-rr-empty", Boolean(query) && shown === 0);
            entry.section.toggleAttribute("data-rr-searching", Boolean(query));
            total += shown;
        }

        if (!query) { select(current); return total; }

        for (const entry of groups) {
            entry.section.toggleAttribute("data-rr-off", entry.tab.hasAttribute("data-rr-empty"));
        }
        return total;
    };

    select(current);
    return { rail, pages, search };
}

function openSettings() {
    if (panelHost) { panelHost(); return; }

    const { rail, pages, search: runSearch } = buildPanelBody();
    const body = el("div.rr-panel__body", {}, [rail, pages]);

    const empty = el("p.rr-panel__empty", { hidden: true }, ["No setting matches that."]);
    pages.append(empty);

    const search = el("input.rr-panel__search", {
        type: "search",
        placeholder: "Find a setting",
        "aria-label": "Find a setting",
    });
    search.addEventListener("input", debounce(() => {
        empty.hidden = runSearch(search.value) > 0;
    }, 90));

    let unsubscribe = () => {};
    let release = () => {};
    const previous = document.activeElement;
    const close = () => {
        panel.remove();
        overlay.remove();
        unsubscribe();
        release();
        panelHost = null;
        document.removeEventListener("keydown", onKey, true);
    };
    const onKey = (event) => { if (event.key === "Escape") close(); };

    const closeButton = el("button.rr-icon-btn", { type: "button", title: "Close settings" }, [icon("close")]);
    closeButton.addEventListener("click", close);

    const panel = el("aside.rr-panel", {
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "RIN Reforged settings",
        tabindex: "-1",
    }, [
        el("div.rr-panel__head", {}, [
            el("div.rr-panel__id", {}, [
                el("h2.rr-panel__title", {}, ["Reforged"]),
                el("span.rr-panel__ver", {}, ["v" + RR_VERSION]),
            ]),
            search,
            closeButton,
        ]),
        body,
        el("div.rr-panel__foot", {}, [
            // Renamed from "Export": it copies to the clipboard and includes bookmarks/history, unstated before.
            el("button.rr-btn", {
                type: "button", onclick: exportSettings,
                title: "Copies every setting, plus bookmarks, history and hidden members, as JSON. Unsent drafts stay here.",
            }, [icon("copy"), "Copy settings"]),
            el("button.rr-btn", {
                type: "button", onclick: importSettings,
                title: "Paste JSON copied from another browser",
            }, ["Paste settings"]),
            el("button.rr-btn", {
                type: "button", "data-variant": "quiet", onclick: clearData,
                title: "Forget bookmarks, reading history, hidden members, remembered topic titles and the Releases cache",
            }, ["Clear data"]),
            el("span.rr-spacer"),
            el("button.rr-btn", {
                type: "button",
                onclick: () => {
                    if (!window.confirm("Reset every RIN Reforged setting to its default?")) return;
                    settings.reset();
                    toast("Settings reset");
                    setTimeout(() => location.reload(), 1000);
                },
            }, ["Reset"]),
        ]),
    ]);

    // Light scrim, not the palette's full dim — the page stays visible behind the panel.
    const overlay = el("div.rr-overlay", { style: { background: "rgba(6, 8, 11, .25)", zIndex: "2050" } });
    overlay.addEventListener("mousedown", close);

    syncDependencies(body);
    unsubscribe = settings.onChange(() => { syncDependencies(body); syncControls(body); });

    document.body.append(overlay, panel);
    document.addEventListener("keydown", onKey, true);
    panelHost = close;
    release = trapFocus(panel, previous instanceof HTMLElement ? previous : null);
    search.focus();
}

function initSettingsUI() {
    if (typeof GM_registerMenuCommand === "function") {
        GM_registerMenuCommand("RIN Reforged settings", () => openSettings());
    }
}

/* ================= src/modules/navbar.js ================= */
// Top bar: links are lifted from the masthead rather than hardcoded, so a board-side menu change carries over.

function findHeaderLink(...needles) {
    const links = Array.from(document.querySelectorAll("#wrapheader a, #menubar a"));
    for (const needle of needles) {
        const hit = links.find((a) => (a.getAttribute("href") || "").includes(needle));
        if (hit) return hit.getAttribute("href");
    }
    return null;
}

function buildCrumbs() {
    const wrap = el("nav.rr-nav__crumbs", { "aria-label": "Breadcrumb" });
    const source = document.querySelector("p.breadcrumbs");

    if (source) {
        const links = Array.from(source.querySelectorAll("a"));
        links.forEach((link, index) => {
            if (index) wrap.append(el("span.rr-nav__sep", {}, ["/"]));
            wrap.append(el("a", { href: link.getAttribute("href") }, [link.textContent.trim()]));
        });
    }

    // Breadcrumb stops at the forum; append the topic title so it stays visible while scrolling a long thread.
    const heading = document.querySelector("#pageheader h2 a.titles, #pageheader h2");
    if (heading && PAGE.isTopic) {
        if (wrap.children.length) wrap.append(el("span.rr-nav__sep", {}, ["/"]));
        const { rest } = splitPrefix(heading.textContent.trim());
        wrap.append(el("a", { href: "#top", title: rest }, [rest]));
        return wrap;
    }

    // On pages where the breadcrumb is just "Board index" (UCP, member list, profile), parse the window title instead.
    if (wrap.querySelectorAll("a").length <= 1 && !PAGE.isIndex && !PAGE.isForum) {
        const parts = document.title.split(/\s+[•·]\s+/).slice(1)
            .map((part) => part.trim())
            .filter((part) => part && !/^index page$/i.test(part)
                && !Array.from(wrap.querySelectorAll("a")).some((a) => a.textContent.trim() === part));
        parts.forEach((part, index) => {
            if (wrap.children.length) wrap.append(el("span.rr-nav__sep", {}, ["/"]));
            const last = index === parts.length - 1;
            wrap.append(el("span.rr-nav__here", last ? { "aria-current": "page" } : {}, [part]));
        });
    }
    return wrap;
}

function findLogo() {
    return document.querySelector(
        '#logodesc img[src*="site_logo"], #wrapheader img[src*="site_logo"], #wrapheader img[src*="logo"]'
    );
}

// Board's wordmark as an inline <svg> path, not an <img>/CSS mask: the board's `img-src 'self'` CSP blocks data: URIs for both (confirmed live). Filled with currentColor so it inks per theme.
const BRAND_MARK = "M26 0h13v1h-13zM99 0h4v1h-4zM113 0h3v1h-3zM2 0h14v2h-14zM62 0h14v2h-14zM86 0h3v2h-3zM26 1h14v1h-14zM137 0h15v3h-15zM99 1h5v2h-5zM1 2h15v1h-15zM25 2h15v1h-15zM61 2h16v1h-16zM1 3h4v1h-4zM12 3h4v1h-4zM25 3h4v1h-4zM36 3h4v1h-4zM61 3h5v1h-5zM72 3h5v1h-5zM99 3h6v1h-6zM112 1h4v4h-4zM137 3h4v2h-4zM37 4h2v1h-2zM73 4h3v1h-3zM99 4h7v1h-7zM161 0h4v6h-4zM1 4h3v2h-3zM13 4h3v2h-3zM25 4h3v2h-3zM99 5h8v1h-8zM173 0h4v7h-4zM148 3h4v4h-4zM61 4h4v3h-4zM72 5h4v2h-4zM137 5h3v2h-3zM25 6h13v1h-13zM99 6h9v1h-9zM85 2h4v6h-4zM112 5h3v3h-3zM161 6h3v2h-3zM103 7h6v1h-6zM136 7h16v1h-16zM25 7h14v2h-14zM61 7h15v2h-15zM98 7h4v2h-4zM104 8h5v1h-5zM111 8h4v1h-4zM85 8h3v2h-3zM136 8h15v2h-15zM26 9h13v1h-13zM61 9h14v1h-14zM105 9h10v1h-10zM12 10h3v1h-3zM66 10h6v1h-6zM106 10h9v1h-9zM142 10h7v1h-7zM136 10h4v2h-4zM24 11h3v1h-3zM67 11h5v1h-5zM107 11h7v1h-7zM123 11h4v1h-4zM143 11h5v1h-5zM0 6h4v7h-4zM172 7h4v6h-4zM160 8h4v5h-4zM98 9h3v4h-3zM36 10h3v3h-3zM11 11h4v2h-4zM23 12h4v1h-4zM68 12h5v1h-5zM144 12h5v1h-5zM60 10h4v4h-4zM47 11h4v3h-4zM108 12h6v2h-6zM136 12h3v2h-3zM23 13h16v1h-16zM145 13h4v1h-4zM84 10h4v5h-4zM0 13h15v2h-15zM69 13h5v2h-5zM160 13h15v2h-15zM23 14h15v1h-15zM109 14h5v1h-5zM145 14h5v1h-5zM122 12h5v4h-5zM97 13h4v3h-4zM46 14h5v2h-5zM135 14h4v2h-4zM0 15h14v1h-14zM24 15h14v1h-14zM70 15h5v1h-5zM110 15h4v1h-4zM146 15h5v1h-5zM160 15h14v1h-14zM60 14h3v3h-3zM84 15h3v2h-3zM1 16h11v1h-11zM25 16h11v1h-11zM47 16h3v1h-3zM71 16h4v1h-4zM98 16h2v1h-2zM123 16h3v1h-3zM136 16h2v1h-2zM147 16h3v1h-3zM162 16h11v1h-11z";

function buildBrand() {
    const strapline = document.querySelector("#logodesc h1, #wrapheader h1");
    const brand = el("a.rr-nav__brand", {
        href: "./index.php",
        "aria-label": "CS.RIN.RU — board index",
        title: strapline ? strapline.textContent.replace(/\s+/g, " ").trim() : "CS RIN - Steam Underground",
    });

    const mark = document.createElementNS(SVG_NS, "svg");
    mark.setAttribute("viewBox", "0 0 177 17");
    mark.setAttribute("fill", "currentColor");
    mark.setAttribute("aria-hidden", "true");
    mark.classList.add("rr-nav__logo");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", BRAND_MARK);
    mark.append(path);

    brand.append(mark);
    return brand;
}

/* ---- One search shape ---------------------------------------------- */

// Wraps the board's own search form (moved, not rebuilt, so action/hidden inputs/session tokens survive) in the palette-trigger frame.
function adoptBoardSearch(form) {
    if (!form || form.closest(".rr-search")) return form;

    const field = form.querySelector('input[type="text"], input[type="search"], input.inputbox');
    const submit = form.querySelector('input[type="submit"], button[type="submit"]');

    if (field) {
        // Board fakes a placeholder via value + onclick/onblur; Tab-focus users submit that literal text. Use a real placeholder instead.
        const prompt = (field.getAttribute("value") || "").trim();
        const inline = (field.getAttribute("onclick") || "") + (field.getAttribute("onblur") || "");
        if (prompt && inline.includes(prompt.slice(0, 8))) {
            field.setAttribute("placeholder", prompt);
            field.value = "";
            field.removeAttribute("value");
            field.removeAttribute("onclick");
            field.removeAttribute("onblur");
        }
        if (!field.getAttribute("aria-label")) {
            field.setAttribute("aria-label", field.getAttribute("placeholder") || "Search");
        }
        field.classList.add("rr-search__input");
        field.removeAttribute("size");
        field.before(icon("search", 14));
    }

    if (submit) submit.classList.add("rr-search__go");
    form.classList.add("rr-search__form");
    const frame = el("div.rr-search", {}, [form]);
    addSearchOptions(frame, form, field, submit);
    return frame;
}

/* ---- Where a search looks ------------------------------------------ */

// Board's own boxes only offer a fixed search; these hidden-field combos let a click choose depth/scope instead. Preference persists in this browser.
const SEARCH_IN = [
    { value: "titleonly", label: "Titles" },
    { value: "firstpost", label: "First post" },
    { value: "msgonly", label: "Message text" },
    { value: "all", label: "All posts" },
];

// Rest of the full form's options, kept in sync so the box and the palette can't disagree.
const SEARCH_TERMS = [
    { value: "all", label: "All words" },
    { value: "any", label: "Any word" },
];

const SEARCH_SHOW = [
    { value: "topics", label: "Topics" },
    { value: "posts", label: "Posts" },
];

// PAGE.forumId is null on a topic reached from a listing (viewtopic.php?t=… carries no forum id) — read the forum from the breadcrumb trail instead. Trail comes back outermost first.
function forumTrail() {
    const out = [];
    const source = document.querySelector("p.breadcrumbs") || document.querySelector(".rr-nav__crumbs");
    for (const link of source ? source.querySelectorAll("a") : []) {
        const match = (link.getAttribute("href") || "").match(/viewforum\.php\?f=(\d+)/);
        if (!match) continue;
        if (out.some((entry) => entry.id === match[1])) continue;
        out.push({ id: match[1], name: link.textContent.trim() });
    }
    return out;
}

// Board moves topics into transient subforums (e.g. Temporarily Restricted); the parent forum is what "this forum" actually means. Needs depth >= 3 since the first crumb is a topic-less category.
function parentForum(trail) {
    return trail.length >= 3 ? trail[trail.length - 2] : null;
}

function shortForumName(name) {
    const said = String(name || "").trim();
    return said.length > 24 ? said.slice(0, 23).trimEnd() + "\u2026" : said;
}

const SEARCH_PREFS_KEY = "searchPrefs";

// `where` starts null (not "here") so "nobody chose" is distinguishable from "chose this forum" — each gets a different default.
function searchPrefs() {
    const kept = store.get(SEARCH_PREFS_KEY, null);
    return Object.assign({ sf: "titleonly", where: null, terms: "all", sr: "topics" },
        kept && typeof kept === "object" ? kept : {});
}

function searchChoice(key, options) {
    const kept = searchPrefs()[key];
    return options.some((option) => option.value === kept) ? kept : options[0].value;
}

function setSearchPref(key, value) {
    const next = searchPrefs();
    next[key] = value;
    store.set(SEARCH_PREFS_KEY, next);
}

function searchDepthChoice() {
    const sf = searchPrefs().sf;
    return SEARCH_IN.some((option) => option.value === sf) ? sf : "titleonly";
}

/* ---- The popover both search boxes share ---------------------------

   onChange(place, depth, first) fires on every choice and once at start with first=true — on a forum/topic it rewrites hidden fields for Search; on a results page (query already ran) it re-runs the search instead. */
function buildSearchPopover(frame, field, submit, config) {
    const places = config.places;
    let where = config.where;
    let depth = config.depth;

    const whereSeg = el("div.rr-seg", { role: "group", "aria-label": t("Where to search") });
    const inSeg = el("div.rr-seg", { role: "group", "aria-label": t("What to search") });
    const inRow = el("div.rr-search__row", {}, [el("span.rr-search__rowlabel", {}, [t("Look in")]), inSeg]);

    // Current room is printed on the trigger itself, visible without opening the popover.
    const whereNow = el("span.rr-search__where", { "aria-hidden": "true" });
    const opts = labelled(
        el("button.rr-search__opts", { type: "button", "aria-expanded": "false" }, [icon("sliders", 13), whereNow]),
        t("Search options"));

    const chosen = () => places.find((entry) => entry.value === where) || places[places.length - 1];

    const sync = (first) => {
        const place = chosen();
        inRow.hidden = place.value === "topic";
        for (const button of whereSeg.children) {
            button.setAttribute("aria-pressed", button.dataset.value === where ? "true" : "false");
        }
        for (const button of inSeg.children) {
            button.setAttribute("aria-pressed", button.dataset.value === depth ? "true" : "false");
        }
        whereNow.textContent = place.label;
        labelled(opts, t("Search options — looking in {where}", { where: place.full || place.label }));
        // Room name is on the trigger now; the active-dot marks only the other axis (search depth).
        opts.toggleAttribute("data-rr-active", place.value !== "topic" && depth !== "titleonly");
        config.onChange(place, depth, Boolean(first));
    };

    for (const place of places) {
        const button = el("button", { type: "button", title: place.full || null }, [place.label]);
        button.dataset.value = place.value;
        button.addEventListener("click", () => { where = place.value; sync(); });
        whereSeg.append(button);
    }
    for (const option of SEARCH_IN) {
        const button = el("button", { type: "button" }, [t(option.label)]);
        button.dataset.value = option.value;
        button.addEventListener("click", () => { depth = option.value; sync(); });
        inSeg.append(button);
    }

    const pop = el("div.rr-search__pop", { role: "group", "aria-label": t("Search options"), hidden: true }, [
        el("div.rr-search__row", {}, [el("span.rr-search__rowlabel", {}, [t("Where")]), whereSeg]),
        inRow,
    ]);

    const close = () => {
        pop.hidden = true;
        opts.setAttribute("aria-expanded", "false");
        document.removeEventListener("mousedown", onOutside, true);
        document.removeEventListener("keydown", onKey, true);
    };
    const onOutside = (event) => { if (!frame.contains(event.target)) close(); };
    const onKey = (event) => { if (event.key === "Escape") { close(); opts.focus(); } };
    const open = () => {
        if (!pop.hidden) return;
        pop.hidden = false;
        opts.setAttribute("aria-expanded", "true");
        document.addEventListener("mousedown", onOutside, true);
        document.addEventListener("keydown", onKey, true);
    };
    opts.addEventListener("click", () => { if (pop.hidden) open(); else close(); });

    // ArrowDown opens the popover like a combobox, without leaving the keyboard mid-query.
    if (field) {
        field.addEventListener("keydown", (event) => {
            if (event.key !== "ArrowDown" || event.altKey || event.ctrlKey || event.metaKey) return;
            event.preventDefault();
            open();
            const first = whereSeg.querySelector('button[aria-pressed="true"]') || whereSeg.firstElementChild;
            if (first) first.focus();
        });
    }

    if (submit) submit.before(opts);
    else (frame.querySelector("form") || frame).append(opts);
    frame.append(pop);
    sync(true);
    return { close: close };
}

/* ---- The box on a forum or a topic ---------------------------------- */

function addSearchOptions(frame, form, field, submit) {
    const hidden = (name) => form.querySelector('input[type="hidden"][name="' + name + '"]');
    const topicId = hidden("t") ? hidden("t").value : null;
    const trail = forumTrail();
    const here = trail.length ? trail[trail.length - 1] : null;
    const up = parentForum(trail);
    const forumId = (hidden("fid[]") && hidden("fid[]").value)
        || (here && here.id)
        || (PAGE.forumId ? String(PAGE.forumId) : null);

    // A results page refines rather than starts a new search; hand it to addResultOptions instead.
    if (PAGE.isSearch) return addResultOptions(frame, field, submit);
    if (!topicId && !forumId) return;

    const setHidden = (name, value) => {
        let input = hidden(name);
        if (value === null) { if (input) input.remove(); return; }
        if (!input) { input = el("input", { type: "hidden", name }); form.append(input); }
        input.value = value;
    };

    // Named rather than described ("Main Forum", not "This forum") — which room you're in matters on a board that moves topics.
    const places = [];
    if (topicId) places.push({ value: "topic", label: t("This topic") });
    if (here) places.push({ value: "here", label: shortForumName(here.name), full: here.name, forum: here.id });
    else if (forumId) places.push({ value: "here", label: t("This forum"), forum: forumId });
    if (up && here && up.id !== here.id) {
        places.push({ value: "up", label: shortForumName(up.name), full: up.name, forum: up.id });
    }
    places.push({ value: "board", label: t("Whole board") });

    const prefs = searchPrefs();
    const offered = new Set(places.map((place) => place.value));

    // Default: from a topic, the parent forum (people open this to find "what else is like this", not search within the thread); from a listing, the listing itself.
    const fallback = topicId && offered.has("up") ? "up" : (offered.has("here") ? "here" : "board");

    buildSearchPopover(frame, field, submit, {
        places: places,
        where: offered.has(prefs.where) ? prefs.where : fallback,
        depth: searchDepthChoice(),
        onChange: (place, depth, first) => {
            if (place.value === "topic") {
                setHidden("t", topicId);
                setHidden("fid[]", null);
                setHidden("sf", "msgonly");
                setHidden("sr", null);
            } else {
                setHidden("t", null);
                setHidden("fid[]", place.forum || null);
                setHidden("sf", depth);
                // Send the sr/terms the palette remembers, not the board box's own defaults.
                setHidden("sr", searchChoice("sr", SEARCH_SHOW));
                setHidden("terms", searchChoice("terms", SEARCH_TERMS));
            }
            if (!first) {
                setSearchPref("where", place.value);
                setSearchPref("sf", depth);
                if (field) field.focus();
            }
            if (field) {
                field.setAttribute("placeholder", place.value === "topic" ? t("Search this topic")
                    : place.value === "board" ? t("Search the whole board")
                    : t("Search {forum}", { forum: place.full || place.label }));
                field.setAttribute("aria-label", field.getAttribute("placeholder"));
                // Field's placeholder already names the room, so the trigger stops repeating it (data-rr-echo) until typed text covers it.
                frame.setAttribute("data-rr-echo", "");
            }
        },
    });
}

/* ---- Re-aiming a search you are already looking at ------------------

   Results page can only refine, not move, a search — phpBB keeps the whole query in the URL, so re-run it with one field (scope/depth) changed. */
function searchQuery() {
    const here = new URLSearchParams(location.search);
    if (here.get("keywords")) return here;
    // A POST search has the query in the form's action instead of the URL.
    const form = document.querySelector('#search-box form[action*="keywords="], form[action*="keywords="]');
    const action = form ? form.getAttribute("action") || "" : "";
    const at = action.indexOf("?");
    const fallback = new URLSearchParams(at > -1 ? action.slice(at + 1) : "");
    return fallback.get("keywords") ? fallback : here;
}

function knownForumName(id) {
    const hit = store.get("forums", []).find((entry) => String(entry.id) === String(id));
    if (hit) return hit.title;
    // Index only lists top boards; subforums live in the tree cached by palette.js (forumTree) — check there too.
    const room = forumTree().find((entry) => String(entry.id) === String(id));
    return room ? room.title : null;
}

function addResultOptions(frame, field, submit) {
    const query = searchQuery();
    const keywords = query.get("keywords");
    // "Active topics"/"unanswered" are keyword-less searches — nothing to re-aim.
    if (!keywords) return;

    const forumId = query.get("fid[]");
    const places = [];
    if (forumId) {
        const name = knownForumName(forumId);
        places.push(name
            ? { value: "here", label: shortForumName(name), full: name, forum: forumId }
            : { value: "here", label: t("That forum"), forum: forumId });
    }
    places.push({ value: "board", label: t("Whole board") });

    const depths = new Set(SEARCH_IN.map((option) => option.value));
    const sf = query.get("sf");

    buildSearchPopover(frame, field, submit, {
        places: places,
        where: forumId ? "here" : "board",
        depth: depths.has(sf) ? sf : "titleonly",
        onChange: (place, depth, first) => {
            // The first call is the page reporting where it looked.
            if (first) return;
            setSearchPref("sf", depth);
            const url = new URL("./search.php", location.href);
            url.searchParams.set("keywords", keywords);
            url.searchParams.set("terms", query.get("terms") || "all");
            url.searchParams.set("sr", query.get("sr") || "topics");
            url.searchParams.set("sf", depth);
            if (place.value === "here" && place.forum) url.searchParams.set("fid[]", place.forum);
            location.href = url.toString();
        },
    });
}


/** Frames a board search box in place, rather than moving it to the end of its cell. */
function frameBoardSearch(form) {
    if (!form || form.closest(".rr-search")) return null;
    const parent = form.parentElement;
    const after = form.nextSibling;
    const framed = adoptBoardSearch(form);
    if (framed === form || !parent) return null;
    parent.insertBefore(framed, after);
    return framed;
}

/**
 * Board writes #topic-search three times (breadcrumb x2 + sort strip); the sort-strip copy is the only one left in the template's own shape.
 * Runs after other modules so an already-moved box is skipped.
 */
function frameStraySearch() {
    for (const form of document.querySelectorAll(
        "#wrapcentre form#topic-search, #wrapcentre form#forum-search, #wrapcentre #search-box form")) {
        if (!form.getClientRects().length) continue;
        frameBoardSearch(form);
    }
}

/* ---- Board bar ---------------------------------------------------- */

// Masthead's remaining links (rules, FAQ, chat, donate, register, lang) get hidden with it by the stylesheet; rebuilt here as one row, in masthead order.

/* Destinations the navbar already offers as an icon of its own.

   Recorded as it builds them rather than guessed at with a pattern.
   The pattern that was here matched the inbox and the login link, and
   missed the one that mattered: signed in, the account icon points at
   `ucp.php`, and `ucp.php` is also the masthead's "User Control Panel"
   — so the row carried a 150px chip for a link already sitting three
   inches above it, and it carried it in the one place where width was
   short. What the bar actually took is not something to infer. */
const NAV_TOOK = new Set();

/** Same href with/without a session id (?sid=) is one destination. */
function linkKey(href) {
    return String(href || "").replace(/[?&]sid=[a-f0-9]+/, "").replace(/[?&]$/, "");
}

/** Board-bar link: the original anchor is moved (not copied), so its session id and any other userscript's attachments survive. */
// Donate link gets no special styling now, just a title naming its purpose — the palette still offers it from anywhere.
const DONATE_RE = /donat/i;

function isDonateLink(link) {
    return DONATE_RE.test(link.getAttribute("href") || "")
        || DONATE_RE.test(link.textContent || "");
}

function boardBarLink(link) {
    const label = link.textContent.replace(/\s+/g, " ").trim();
    const image = link.querySelector("img");

    link.classList.add("rr-boardbar__link");

    // Language switch links have no text; the flag image is treated as the label.
    if (!label && image) {
        image.classList.add("rr-boardbar__flag");
        image.style.display = "";
        return link;
    }

    // Everything else pairs an icon with a redundant label; keep just the label.
    link.textContent = label;
    if (isDonateLink(link)) {
        link.classList.add("rr-boardbar__donate");
        link.setAttribute("title", label + " — the board is hosted on donations");
    }
    return link;
}

/* Groups links as views/board/account, with account hard right beside the language switch (mirrors the masthead's own two-row split). Classified by href pattern, not label, since labels are translated: a "view" is a saved search (search_id=), not the search form itself. */
const BOARD_BAR_GROUPS = [
    { id: "views", label: "Threads", re: /search\.php\?[^#]*search_id=/ },
    { id: "board", label: "Board", re: null },      // whatever is neither of the others
    { id: "account", label: "Account", end: true,
        re: /ucp\.php|mode=(?:login|logout|register)|viewprofile|profile\.php/ },
];

/* Board's view links all start with "View" ("View unanswered posts", etc.) — dead weight that overflows a narrow window. Shared leading words are dropped from the visible label but kept in title/aria-label. */
function trimSharedPrefix(links) {
    if (links.length < 2) return;
    const words = links.map((link) => link.textContent.trim().split(/\s+/));
    let shared = 0;
    while (words.every((parts) => parts.length > shared + 1 && parts[shared] === words[0][shared])) shared++;
    if (!shared) return;

    for (const link of links) {
        const full = link.textContent.trim();
        const rest = full.split(/\s+/).slice(shared).join(" ");
        link.textContent = rest.charAt(0).toUpperCase() + rest.slice(1);
        link.setAttribute("title", full);
        link.setAttribute("aria-label", full);
    }
}

function boardBarGroup(href) {
    return BOARD_BAR_GROUPS.find((group) => group.re && group.re.test(href))
        || BOARD_BAR_GROUPS.find((group) => !group.re);
}

// Board's language switch is two unlabelled flags with no indication of the current one — rebuilt as a segmented control with codes, using the board's own anchors so hrefs/session ids survive.
function currentLanguage() {
    const lang = (document.documentElement.getAttribute("lang") || "").toLowerCase();
    return lang.startsWith("ru") ? "ru" : lang.startsWith("en") ? "en" : null;
}

function buildLanguageSwitch(links) {
    if (links.length < 2) return null;

    const here = currentLanguage();
    const group = el("div.rr-langswitch", { role: "group", "aria-label": "Board language" });

    for (const link of links) {
        const code = (link.getAttribute("href").match(/[?&]lang=([a-z-]+)/i) || [])[1];
        if (!code) return null;
        const short = code.slice(0, 2).toLowerCase();
        const image = link.querySelector("img");
        const name = image ? (image.getAttribute("alt") || short.toUpperCase()) : short.toUpperCase();

        link.classList.add("rr-langswitch__option");
        link.textContent = "";
        if (image) {
            image.classList.add("rr-boardbar__flag");
            image.style.display = "";
            link.append(image);
        }
        link.append(el("span.rr-langswitch__code", {}, [short.toUpperCase()]));
        link.setAttribute("title", name);
        link.setAttribute("aria-label", name);
        if (here && short === here) {
            // Still a real link (clicking it is harmless) but marked as current.
            link.setAttribute("aria-current", "true");
        }
        group.append(link);
    }
    return group;
}

/* A guest browsing in Russian gets lang=ru appended to *every* nav link, not just the language switch — so lang= alone misidentifies Rules/FAQ/Register as language pills. Require a flag image, a language-named label, or a bare index.php?lang=. */
function isLanguageLink(link, href) {
    if (!/[?&]lang=/.test(href)) return false;
    if (link.querySelector('img[src*="uk.png"], img[src*="ru.png"], img[src*="/flags/"], img[src*="lang_"]')) return true;
    if (/^\s*(?:english|русский|en|ru)\s*$/i.test(link.textContent)) return true;
    // Bare lang= only identifies the index — search.php?lang=ru is just the search page in Russian.
    const path = href.replace(/[?#].*$/, "");
    if (!/(?:^|\/)index\.php$|^\.?\/?$/.test(path)) return false;
    const query = href.replace(/^[^?]*\??/, "").replace(/&?sid=[a-f0-9]+/, "");
    return /^&?lang=[a-z_-]+&?$/i.test(query);
}

function buildBoardBar() {
    const groups = new Map();
    const languages = [];
    const seen = new Set();

    const groupNode = (id) => {
        if (!groups.has(id)) groups.set(id, el("div.rr-boardbar__group", { "data-rr-group": id }));
        return groups.get(id);
    };

    const take = (link) => {
        const href = link.getAttribute("href") || "";
        if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
        const key = linkKey(href);
        if (seen.has(key) || NAV_TOOK.has(key)) return;
        seen.add(key);
        if (isLanguageLink(link, href)) { languages.push(link); return; }
        const group = groupNode(boardBarGroup(href).id);
        group.append(boardBarLink(link));
    };

    // Board's own "unanswered/active" strip floats with nothing around it; folded in to lead the row.
    for (const strip of document.querySelectorAll("#wrapcentre p.searchbar")) {
        for (const link of Array.from(strip.querySelectorAll("a[href]"))) take(link);
        if (!strip.querySelector("a[href], form")) strip.remove();
    }

    for (const link of Array.from(document.querySelectorAll("#wrapheader a[href]"))) {
        if (link.querySelector('img[src*="site_logo"], img[src*="logo"]')) continue;
        take(link);
    }

    const views = groups.get("views");
    if (views) trimSharedPrefix(Array.from(views.querySelectorAll(".rr-boardbar__link")));

    // Groups render in declared order (empty ones skipped); `end`-marked groups go right, before the language switch.
    const main = el("div.rr-boardbar__main");
    const end = el("div.rr-boardbar__end");
    for (const group of BOARD_BAR_GROUPS) {
        const node = groups.get(group.id);
        if (node && node.children.length) (group.end ? end : main).append(node);
    }

    const language = buildLanguageSwitch(languages);
    if (language) end.append(language);
    else for (const link of languages) end.append(boardBarLink(link));

    if (!main.children.length && !end.children.length) return null;

    // On phone the full row wraps to 3 lines; "unanswered/active" (the links every guide tells people to bookmark) stay visible, the rest folds behind More.
    const more = el("button.rr-boardbar__more", {
        type: "button",
        "aria-expanded": "false",
        "aria-label": t("More board links"),
    }, [t("More"), icon("chevronD", 12)]);

    const bar = el("nav.rr-boardbar", { "aria-label": t("Board links") }, [main, end, more]);

    more.addEventListener("click", () => {
        const open = bar.toggleAttribute("data-rr-open");
        more.firstChild.textContent = t(open ? "Less" : "More");
        more.setAttribute("aria-expanded", open ? "true" : "false");
    });

    return bar;
}

/**
 * Names an icon-only control via aria-label + data-rr-tip (drawn on hover/focus). No `title`: the browser's native tooltip used to appear a beat after the drawn one, showing the same text twice.
 */
function labelled(node, text) {
    node.removeAttribute("title");
    node.setAttribute("aria-label", text);
    node.setAttribute("data-rr-tip", text);
    return node;
}

function buildNavbar() {
    const bar = el("header.rr-nav", { role: "banner" });
    // Bar spans edge-to-edge but its contents track the content column, so they line up with the board bar/listing below.
    const inner = el("div.rr-nav__inner");
    bar.append(inner);
    inner.append(buildBrand());

    inner.append(buildCrumbs());

    const actions = el("div.rr-nav__actions");

    if (settings.get("palette")) {
        const search = el("button.rr-nav__search", { type: "button", "aria-label": t("Search and jump (Ctrl+K)") }, [
            icon("search"),
            el("span", {}, [t("Search or jump to")]),
            el("span.rr-kbd.rr-nav__kbd", {}, [navigator.platform.startsWith("Mac") ? "⌘K" : "Ctrl K"]),
        ]);
        search.addEventListener("click", () => openPalette());
        inner.append(search);
    } else {
        const searchHref = findHeaderLink("search.php");
        if (searchHref) {
            NAV_TOOK.add(linkKey(searchHref));
            actions.append(labelled(el("a.rr-icon-btn", { href: searchHref }, [icon("search")]), t("Search")));
        }
    }

    const pmHref = findHeaderLink("i=pm", "ucp.php?i=pm");
    if (pmHref) {
        NAV_TOOK.add(linkKey(pmHref));
        const unread = unreadMessages();
        const label = unread > 0
            ? t("Private messages — {n} unread", { n: unread })
            : t("Private messages");
        const button = labelled(el("a.rr-icon-btn", { href: pmHref }, [icon("mail")]), label);
        if (unread > 0) button.append(el("span.rr-badge", {}, [String(unread)]));
        actions.append(button);
    }

    const ucpHref = findHeaderLink("mode=login", "ucp.php");
    if (ucpHref) {
        NAV_TOOK.add(linkKey(ucpHref));
        const label = t(isLoggedIn() ? "Your account" : "Log in");
        actions.append(labelled(el("a.rr-icon-btn", { href: ucpHref }, [icon("user")]), label));
    }

    // Hairline divider: distinguishes the script's settings icon from the board's own icons beside it, without becoming a second toolbar.
    actions.append(el("span.rr-nav__divide", { "aria-hidden": "true" }));

    const settingsButton = labelled(
        el("button.rr-icon-btn", { type: "button" }, [icon("settings")]),
        t("RIN Reforged settings"));
    settingsButton.addEventListener("click", () => openSettings());
    actions.append(settingsButton);

    inner.append(actions);
    return bar;
}

/* ---- The board's own masthead ------------------------------------- */

/**
 * Masthead art survives on the index at full size — it's the board's identity, not chrome. Rebuilt as a new <img> rather than moving the original, which stays hidden (not removed) since other userscripts read #wrapheader.
 */
function buildMasthead() {
    const source = findLogo();
    const src = source && source.getAttribute("src");
    if (!src) return null;

    const strapline = document.querySelector("#logodesc h1, #wrapheader h1");
    const art = el("img.rr-masthead__art", {
        src,
        alt: "CS.RIN.RU",
        decoding: "async",
    });

    const banner = el("div.rr-masthead", {}, [
        el("a.rr-masthead__link", {
            href: "./index.php",
            "aria-label": "Board index",
            title: strapline ? strapline.textContent.replace(/\s+/g, " ").trim() : "CS.RIN.RU",
        }, [art]),
    ]);

    // A broken image is worse than no banner at all.
    art.addEventListener("error", () => banner.remove(), { once: true });
    return banner;
}

/**
 * Board name + strapline, read (not moved) from #wrapheader, which stays hidden for other userscripts reading it. Needed once the top bar already carries the name elsewhere, so a bar-less page isn't just art with no label.
 */
function buildBoardName() {
    const heading = document.querySelector("#logodesc h1, #wrapheader h1");
    if (!heading) return null;

    const name = heading.textContent.replace(/\s+/g, " ").trim();
    if (!name) return null;

    const block = el("div.rr-boardname", {}, [el("h1.rr-boardname__title", {}, [name])]);

    const strapline = heading.parentElement
        && heading.parentElement.querySelector("span.gen, span.gensmall");
    const line = strapline ? strapline.textContent.replace(/\s+/g, " ").trim() : "";
    if (line) block.append(el("p.rr-boardname__strap", {}, [line]));

    return block;
}

/**
 * Skip-to-content link — the board has none, and the top bar puts several tab stops before the first topic. Target needs tabindex="-1" or the browser scrolls without moving focus.
 */
function addSkipLink() {
    const main = document.querySelector("#wrapcentre");
    if (!main || document.querySelector(".rr-skip")) return;

    if (!main.id) main.id = "rr-main";
    main.setAttribute("tabindex", "-1");

    const skip = el("a.rr-skip", { href: "#" + main.id }, [t("Skip to content")]);
    skip.addEventListener("click", (event) => {
        event.preventDefault();
        main.focus();
        main.scrollIntoView();
    });
    document.body.prepend(skip);
}

/** Script's own controls (search/settings) for pages with no top bar — otherwise switching the bar off removes the only way to reach them. */
function buildHeaderTools() {
    const tools = el("div.rr-headertools");

    if (settings.get("palette")) {
        const search = labelled(
            el("button.rr-icon-btn", { type: "button" }, [icon("search")]),
            t("Search and jump (Ctrl+K)"));
        search.addEventListener("click", () => openPalette());
        tools.append(search);
    }

    const panel = labelled(
        el("button.rr-icon-btn", { type: "button" }, [icon("settings")]),
        t("RIN Reforged settings"));
    panel.addEventListener("click", () => openSettings());
    tools.append(panel);

    return tools;
}

function initNavbar() {
    const bar = settings.get("navbar") ? buildNavbar() : null;
    if (bar) document.body.prepend(bar);
    addSkipLink();                 // prepended after, so it lands first

    const centre = document.querySelector("#wrapcentre");
    const board = settings.get("boardLinks") ? buildBoardBar() : null;
    // Masthead shows on the index (bar carries identity elsewhere) or on any page when there's no bar at all.
    const banner = settings.get("masthead") && (PAGE.isIndex || !bar) ? buildMasthead() : null;
    const name = banner && !bar ? buildBoardName() : null;

    if (board && !bar) (board.querySelector(".rr-boardbar__end") || board).append(buildHeaderTools());

    // Masthead art + name + board-bar combine into one header block: side by side when there's a top bar, stacked (data-rr-stack) when there isn't.
    const parts = [banner, name, board].filter(Boolean);
    if (centre && parts.length > 1) {
        centre.prepend(el("div.rr-header", { "data-rr-stack": bar ? null : "" }, parts));
    } else if (centre && parts.length) {
        centre.prepend(parts[0]);
    }

    // Reveal the board's own masthead only when nothing here replaced it; set optimistically in theme.js at document-start to avoid a flash, corrected here.
    document.documentElement.setAttribute("data-rr-header", bar || board || banner ? "rr" : "board");

    if (!bar) return;
    // #top now sits under the sticky bar; offset scroll so both "back to top" and post-link jumps (settleFragment) land below it, not behind it.
    document.documentElement.style.scrollPaddingTop = "calc(var(--rr-nav-h, 48px) + 14px)";
}

/**
 * subsilver2 spaces strips with bare <br> rather than margins; once a strip is folded into one of this script's bars, the <br> is left stranded as an empty band (a sibling combinator still sees a hidden element).
 * Runs after every module so late-inserted bars are covered too.
 */
function dropStrayBreaks() {
    const bars = ".rr-header, .rr-topicbar, .rr-toolbar, .rr-boardbar, .rr-releases, .rr-quickreply";
    for (const bar of document.querySelectorAll(bars)) {
        for (const side of ["previousElementSibling", "nextElementSibling"]) {
            let node = bar[side];
            while (node && node.tagName === "BR") {
                const next = node[side];
                node.remove();
                node = next;
            }
        }
    }
}

/* ---- Separators the template left behind --------------------------- */

/* subsilver2 hardcodes `|` separators beside conditional links rather than generating them between survivors, leaving orphaned or doubled bars when links are hidden (e.g. logged out). Same job as dropStrayBreaks() but for `|` instead of <br>.
   Matches a text node of nothing but spacing/bars, allowing several — a doubled separator is one text node in the DOM, so a single-bar-per-node rule would miss it. */
const SEPARATOR_TEXT = /^[\s |·•]*[|·•][\s |·•]*$/;
// Board's own spacing, so a strip doesn't line-break at the punctuation.
const SEPARATOR_KEPT = " | ";

function occupies(node) {
    if (node.nodeType === 3) return Boolean(node.textContent.replace(/[\s ]/g, ""));
    if (node.nodeType !== 1) return false;
    if (node.tagName === "BR") return false;
    return node.getClientRects().length > 0;
}

/**
 * Drops `|` separators with no visible content before, none after, or preceded by another separator — never touches real content. Returns true if the strip ends up with nothing visible.
 */
function tidySeparators(strip) {
    // A hidden strip is skipped entirely — nothing "occupies" it, so every separator would look orphaned and get stripped even though the cell may reappear.
    if (!strip.getClientRects().length) return false;

    const nodes = Array.from(strip.childNodes);
    let pendingSeparators = [];
    let seenContent = false;
    let content = 0;

    for (const node of nodes) {
        if (node.nodeType === 3 && SEPARATOR_TEXT.test(node.textContent)) {
            // Held, not removed yet — whether it belongs depends on what follows.
            if (!seenContent) node.remove();
            else pendingSeparators.push(node);
            continue;
        }
        if (!occupies(node)) continue;
        // First held separator earns its place (normalised, in case it carried two); any further ones were duplicates.
        for (const [i, held] of pendingSeparators.entries()) {
            if (i) held.remove();
            else held.textContent = SEPARATOR_KEPT;
        }
        pendingSeparators = [];
        seenContent = true;
        content += 1;
    }
    // Nothing came after them.
    for (const held of pendingSeparators) held.remove();
    return content === 0;
}

// Includes cells the script already emptied of links — that's exactly what strands their punctuation.
const SEPARATOR_STRIPS = "#wrapcentre td.gensmall, #wrapcentre td.nav, #wrapcentre td.cat,"
    + " #wrapcentre p.searchbar, #wrapcentre span.gensmall, #wrapcentre .postbody + .gensmall";

// Hiding a cell in a data-table row (not blanking it) shifts every later cell left, out from under its header — hit on the Team page's empty e-mail column.
function isGridCell(cell) {
    if (cell.tagName !== "TD") return false;
    const row = cell.parentElement;
    if (!row || row.children.length < 3) return false;
    const table = cell.closest("table");
    return Boolean(table && table.querySelector(":scope > tbody > tr > th"));
}

/**
 * Runs after every module (see dropStrayBreaks). A cell left with only punctuation is hidden, not emptied, so its column stops being reserved — was a `td` at 100% width holding one character.
 */
function dropStraySeparators() {
    for (const strip of document.querySelectorAll(SEPARATOR_STRIPS)) {
        const empty = tidySeparators(strip);
        if (!empty) continue;
        if (strip.querySelector("form, input, select, textarea, img")) continue;
        if (isGridCell(strip)) continue;
        if (strip.tagName === "TD") strip.style.display = "none";
    }
}

/**
 * Breadcrumb strip is its own full-width table; once the bar carries the breadcrumb and toolbars take the search box, it's an empty 18px band. Runs after the other modules so it can tell if anything still needs it.
 */
function tidyCrumbStrip() {
    if (document.documentElement.getAttribute("data-rr-header") !== "rr") return;

    for (const crumbs of document.querySelectorAll("#wrapcentre p.breadcrumbs")) {
        const strip = crumbs.closest("table.tablebg");
        if (!strip) continue;
        // No bar means this breadcrumb isn't duplicated elsewhere, so the strip earns its place regardless of what else is in it.
        if (crumbs.getClientRects().length) {
            strip.setAttribute("data-rr-crumbstrip", "");
            frameBoardSearch(strip.querySelector("#search-box form, form#forum-search, form#topic-search"));
            continue;
        }
        // A control still present but not drawn (see dedupeSearchBoxes for the hidden duplicate) doesn't count — measured via getClientRects, not assumed.
        const controls = Array.from(strip.querySelectorAll("form, input, select, textarea"));
        if (!controls.some((node) => node.getClientRects().length)) { strip.style.display = "none"; continue; }
        // Survives for its search box alone (profile, member list, UCP — no listing toolbar to move it into); styled as a plain row rather than a card, and the box gets the same frame as every other search box.
        strip.setAttribute("data-rr-crumbstrip", "");
        frameBoardSearch(strip.querySelector("#search-box form, form#forum-search, form#topic-search"));
    }
}

/* ================= src/modules/lists.js ================= */
// Forum and topic listings: column labels for mobile, prefix tags, and a client-side filter.

const COLUMN_NAMES = {
    forum: "title",
    topics: "topics",
    posts: "posts",
    "last post": "last",
    replies: "replies",
    author: "author",
    views: "views",
    // Member list, PM folders, control panel — same date/rank shapes as a listing.
    "#": "num",
    username: "author",
    joined: "date",
    sent: "date",
    "last updated": "date",
    rank: "rank",
    subject: "title",
    mark: "mark",
    message: "action",
    "e-mail": "action",
    website: "action",
    // Russian UI headers — half the board reads them; unmapped, nothing below got treated.
    "форум": "title",
    "темы": "topics",
    "сообщения": "posts",
    "последнее сообщение": "last",
    "ответы": "replies",
    "автор": "author",
    "просмотры": "views",
    "имя пользователя": "author",
    "зарегистрирован": "date",
    "отправлено": "date",
    "звание": "rank",
    "тема": "title",
    "отметить": "mark",
    "сообщение": "action",
    "сайт": "action",
};

// Tags cells with data-rr-col from the <th> row, so it survives a template that adds or drops a column.
function labelColumns(table) {
    const headRow = table.querySelector("tr:has(th)") || table.querySelector("th")?.parentElement;
    if (!headRow) return;
    // Not always the first row — a forum listing has a "Mark forums read" strip above it.
    headRow.setAttribute("data-rr-head", "");

    // Only a listing reads a spanning header as the title column — on a profile that
    // misread "Joined:" as an icon column and its date as a title.
    const listing = Boolean(table.querySelector("a.topictitle, a.forumlink, .topictitle a"));

    const columns = [];
    const heads = Array.from(headRow.querySelectorAll("th"));
    heads.forEach((th, index) => {
        const span = parseInt(th.getAttribute("colspan") || "1", 10);
        const text = th.textContent.trim().toLowerCase();

        // Empty header = read/unread marker column; search results give it its own header.
        if (!text) {
            columns.push("icon");
            for (let i = 1; i < span; i += 1) columns.push(null);
            return;
        }

        // Spanning header = title column, read by span not by word: "Topics" is also
        // a counting column, so word-matching on search results mislabeled titles as counts.
        if (span > 1) {
            if (!listing) {
                for (let i = 0; i < span; i += 1) columns.push(null);
                return;
            }
            for (let i = 1; i < span; i += 1) columns.push(index === 0 && i === 1 ? "icon" : null);
            columns.push("title");
            return;
        }

        // Member list's date column is a joining date — flagged for the phone card.
        if (text === "joined" || text === "зарегистрирован") table.setAttribute("data-rr-joined", "");
        columns.push(COLUMN_NAMES[text] || null);
    });
    if (!columns.length) return;

    for (const row of table.querySelectorAll("tr")) {
        const cells = row.children;
        if (cells.length !== columns.length) continue;   // category and spacer rows
        for (let i = 0; i < cells.length; i += 1) {
            if (columns[i]) cells[i].setAttribute("data-rr-col", columns[i]);
        }
    }

    // Headings get the same names as their cells, or heading and column alignment
    // disagree (Author sat left in the heading, centred in every row).
    let at = 0;
    for (const th of heads) {
        const span = parseInt(th.getAttribute("colspan") || "1", 10);
        // A heading spanning icon+title labels the title — the half with words in it.
        const name = columns[span > 1 ? at + span - 1 : at];
        if (name) th.setAttribute("data-rr-col", name);
        at += span;
    }
}

const COUNT_COLUMNS = ["topics", "posts", "replies", "views"];

function groupListingNumbers(table) {
    const selector = COUNT_COLUMNS.map((name) => 'td[data-rr-col="' + name + '"]').join(", ");
    for (const cell of table.querySelectorAll(selector)) groupNumbersIn(cell);
}

// Only cells this script built, or elements whose whole text is one number — never a
// page sweep, since AppIDs/post numbers/build ids are also just digits.
function groupBoardNumbers() {
    // Post header line excluded — it mixes a join year with the count and groups itself.
    for (const node of document.querySelectorAll(".rr-topicbar__count, .rr-online__summary")) {
        groupNumbersIn(node);
    }
    // "Total posts N | Total topics N" — each figure is already wrapped in its own
    // <strong>. Profile counters would fit too but are skipped: they're all behind
    // login, so no page here can reach one to test it.
    groupCountElements("#wrapcentre p.gensmall strong");
}

/* ---- Prefixes ---------------------------------------------------- */

function decorateTitle(entry, onTagClick) {
    const { prefix, kind, rest } = splitPrefix(entry.title);
    if (!prefix) return null;

    // Template renders the prefix as coloured spans in the link; rebuilt as a tag
    // beside it. With no filter behind it (a short listing) it's a label, not a
    // control that answers a click with nothing.
    const tag = onTagClick
        ? el("button.rr-tag", { type: "button", "data-tag": kind, title: t("Show only {x}", { x: prefix }) }, [prefix])
        : el("span.rr-tag", { "data-tag": kind }, [prefix]);
    if (onTagClick) {
        tag.addEventListener("click", (event) => {
            event.preventDefault();
            onTagClick(prefix.toLowerCase());
        });
    }

    // Only the prefix moves; the rest of the title stays put (see stripLeading()).
    const raw = entry.link.textContent;
    const at = raw.indexOf(rest);
    if (rest && at > 0) stripLeading(entry.link, at);
    else entry.link.textContent = rest;
    entry.link.before(tag);
    entry.row.setAttribute("data-rr-prefix", prefix.toLowerCase());
    return prefix.toLowerCase();
}

/* ---- Visited / bookmarked --------------------------------------- */

function visitedSet() {
    return new Set(store.get("visited", []));
}

function markVisited(topicId) {
    if (!topicId) return;
    const list = store.get("visited", []);
    const index = list.indexOf(topicId);
    if (index !== -1) list.splice(index, 1);
    list.unshift(topicId);
    store.set("visited", list.slice(0, 800));
}

function bookmarkList() { return store.get("bookmarks", []); }

function isBookmarked(topicId) {
    return bookmarkList().some((item) => item.id === topicId);
}

function toggleBookmark(topicId, title, href) {
    const list = bookmarkList();
    const index = list.findIndex((item) => item.id === topicId);
    if (index === -1) {
        list.unshift({ id: topicId, title, href, at: Date.now() });
        store.set("bookmarks", list.slice(0, 400));
        return true;
    }
    list.splice(index, 1);
    store.set("bookmarks", list);
    return false;
}

function addBookmarkStar(entry) {
    const star = el("button.rr-icon-btn.rr-star", {
        type: "button",
        title: t("Bookmark this topic"),
        "aria-label": "Bookmark " + entry.title,
        "aria-pressed": isBookmarked(entry.id) ? "true" : "false",
    }, [icon("star", 13)]);

    star.addEventListener("click", (event) => {
        event.preventDefault();
        const now = toggleBookmark(entry.id, entry.title, entry.link.getAttribute("href"));
        star.setAttribute("aria-pressed", now ? "true" : "false");
        toast(now ? "Bookmarked" : "Bookmark removed");
    });

    // In the marker gutter rather than after the title, which on a long topic name
    // pushed the star to a line of its own; the gutter never wraps.
    const gutter = entry.row.querySelector('td[data-rr-col="icon"]');
    if (gutter) gutter.append(star);
    else entry.link.after(star);

    // Named on the row, not just the cell: the phone card (responsive.css)
    // pulls the star out to the card's own corner and needs to know which
    // title cells must keep their text clear of it.
    entry.row.setAttribute("data-rr-star", "");
}

/* ---- First unread --------------------------------------------- */

/** Unread = status image in the _unread set, or alt "Unread posts" — either survives the icon pass. */
function rowIsUnread(row) {
    if (row.querySelector('.rr-dot[data-state="unread"]')) return true;
    for (const img of row.querySelectorAll("img")) {
        if (/_unread/.test(img.getAttribute("src") || "")) return true;
        if (/^unread posts/i.test(img.getAttribute("alt") || "")) return true;
    }
    return false;
}

/**
 * Points the title (not just the little arrow) at view=unread — phpBB's own route,
 * moved onto the control people actually click. Logged-in only: for a guest,
 * view=unread redirects to the last post instead.
 */
function retargetToUnread(entry) {
    if (!entry.id || !rowIsUnread(entry.row)) return false;

    const href = entry.link.getAttribute("href") || "";
    if (/view=unread/.test(href)) return true;

    let url;
    try { url = new URL(href, location.href); } catch { return false; }
    if (!/viewtopic\.php$/.test(url.pathname)) return false;

    url.searchParams.delete("start");
    url.searchParams.set("view", "unread");
    entry.link.setAttribute("href", url.pathname + url.search + "#unread");
    entry.link.setAttribute("title", "Opens at the first post you have not read");
    entry.row.setAttribute("data-rr-unread", "1");
    return true;
}

/* ---- Filter bar --------------------------------------------------- */

// Below this row count the filter is furniture (searches a list you can already see
// all of). The board's own refine box — a round trip — still gets a place regardless.
const FILTER_MIN_ROWS = 5;

/**
 * The board prints #search-box twice (top and bottom breadcrumb strips) plus a third
 * copy of its own on a search results page. Duplicates are hidden, not removed:
 * another script (CS.RIN.RU Enhanced) looks for the first #search-box, so that copy
 * is the one kept.
 */
function dedupeSearchBoxes() {
    const boxes = Array.from(document.querySelectorAll('[id="search-box"]'));
    for (const box of boxes.slice(1)) {
        box.setAttribute("data-rr-dupe", "");
        box.style.display = "none";
    }

    // Results header's own copy is a bare cell rather than a named block; dropped
    // only if a #search-box remains to take its place.
    if (!boxes.length) return;
    for (const field of document.querySelectorAll('input[name="add_keywords"]')) {
        if (field.closest('[id="search-box"]')) continue;
        const cell = field.closest("td");
        if (!cell) continue;
        cell.setAttribute("data-rr-dupe", "");
        cell.style.display = "none";
    }
}

/** Opens/closes the prefix menu with the same manners as the search box's options popover. */
function wireTagMenu(frame, trigger, field) {
    const pop = frame.querySelector(".rr-toolbar__tagpop");

    const close = () => {
        pop.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
        document.removeEventListener("mousedown", onOutside, true);
        document.removeEventListener("keydown", onKey, true);
    };
    const onOutside = (event) => { if (!frame.contains(event.target)) close(); };
    const onKey = (event) => { if (event.key === "Escape") { close(); trigger.focus(); } };
    const open = () => {
        if (!pop.hidden) return;
        pop.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
        document.addEventListener("mousedown", onOutside, true);
        document.addEventListener("keydown", onKey, true);
    };

    trigger.addEventListener("click", () => { if (pop.hidden) open(); else close(); });
    pop.addEventListener("click", (event) => { if (event.target.closest("button")) close(); });
    if (field) {
        field.addEventListener("keydown", (event) => {
            if (event.key !== "ArrowDown" || event.altKey || event.ctrlKey || event.metaKey) return;
            event.preventDefault();
            open();
            const first = pop.querySelector('button[aria-pressed="true"]') || pop.querySelector("button");
            if (first) first.focus();
        });
    }
}

/** `rich` builds the whole bar (filter box, prefix chips, count); otherwise it only
 *  hosts the board's own refine box — see FILTER_MIN_ROWS. */
function buildToolbar(entries, prefixes, rich) {
    const state = { text: "", tag: null, unread: false };

    const count = el("span.rr-toolbar__count");

    const apply = () => {
        let shown = 0;
        for (const entry of entries) {
            const matchesText = matchesWords(entry.title, state.text);
            const matchesTag = !state.tag || entry.row.getAttribute("data-rr-prefix") === state.tag;
            const matchesUnread = !state.unread || entry.unread;
            const visible = matchesText && matchesTag && matchesUnread;
            entry.row.toggleAttribute("data-rr-hidden", !visible);
            if (visible) shown += 1;
        }
        count.textContent = shown === entries.length
            ? t("{n} on this page", { n: entries.length })
            : t("{a} of {b} on this page", { a: shown, b: entries.length });
    };

    // Needs the rr- class: unclassed inputs inherit a 22em floor meant for a
    // size="25" field from 2003, refused to shrink, and pushed the prefix trigger off a phone.
    const input = el("input.rr-toolbar__input", {
        type: "search",
        placeholder: t("Filter this page by title"),
        "aria-label": t("Filter topics on this page"),
    });
    input.addEventListener("input", debounce(() => { state.text = input.value.trim(); apply(); }, 90));
    input.addEventListener("keydown", (event) => {
        if (event.key === "Escape") { input.value = ""; state.text = ""; apply(); }
    });

    // Nine chips side by side out-coloured the listing itself; collapsed behind one
    // trigger that shows the active prefix's name.
    const tagRow = el("div.rr-toolbar__tags");
    const tagName = el("span.rr-toolbar__tagname", { "aria-hidden": "true" });
    const tagBtn = el("button.rr-toolbar__tagbtn", { type: "button", "aria-expanded": "false" },
        [tagName, icon("chevronD", 12)]);

    const syncTags = () => {
        let on = null;
        for (const button of tagRow.children) {
            const pressed = button.dataset.value === state.tag;
            button.setAttribute("aria-pressed", pressed ? "true" : "false");
            if (pressed) on = button;
        }
        tagName.textContent = on ? on.textContent : t("Tag");
        tagBtn.toggleAttribute("data-rr-active", Boolean(on));
        // The trigger wears the colour of the prefix it is holding, so
        // the one chip that is on is still legible as itself.
        if (on && on.dataset.tag) tagBtn.setAttribute("data-tag", on.dataset.tag);
        else tagBtn.removeAttribute("data-tag");
        labelled(tagBtn, on
            ? t("Showing only {x} — pick another or clear", { x: on.textContent })
            : t("Show only one kind of topic"));
    };

    const setTag = (tag) => {
        state.tag = state.tag === tag ? null : tag;
        syncTags();
        apply();
    };
    // "Unread" gets a permanent chip (unlike prefixes): it's the question most
    // readers arrive with, and binary rather than one-of-nine.
    const quick = el("div.rr-toolbar__quick");
    const unreadCount = entries.filter((entry) => entry.unread).length;
    if (unreadCount && unreadCount < entries.length) {
        const unreadChip = el("button.rr-tag.rr-tag--unread", {
            type: "button",
            "aria-pressed": "false",
            title: t("Show only the topics with unread posts"),
        }, [t("Unread")]);
        unreadChip.addEventListener("click", () => {
            state.unread = !state.unread;
            unreadChip.setAttribute("aria-pressed", state.unread ? "true" : "false");
            apply();
        });
        quick.append(unreadChip);
    }

    for (const [name, kind] of prefixes) {
        const button = el("button.rr-tag", {
            type: "button",
            "data-tag": kind,
            "aria-pressed": "false",
            title: t("Show only {x}", { x: name }),
        }, [name]);
        button.dataset.value = name.toLowerCase();
        button.addEventListener("click", () => setTag(name.toLowerCase()));
        tagRow.append(button);
    }

    const bar = el("div.rr-toolbar", { role: "search" });
    if (rich) {
        const frame = el("div.rr-toolbar__filter", {}, [icon("filter"), input]);
        // Only worth a trigger once there's more than one chip to choose between.
        if (tagRow.children.length > 1) {
            frame.append(tagBtn, el("div.rr-toolbar__tagpop", {
                role: "group", "aria-label": t("Show only one kind of topic"), hidden: true,
            }, [tagRow]));
            wireTagMenu(frame, tagBtn, input);
            syncTags();
        }
        bar.append(frame);
        if (quick.children.length) bar.append(quick);
        bar.append(count);
    }

    // Board's own search box moves here to save a band of its own. Hidden when the
    // palette can search this forum instead — except with the palette off, or on a
    // results page, where it narrows results the palette can't reach.
    const boardSearch = document.querySelector("#search-box form, #topic-search");
    if (boardSearch) {
        const strip = boardSearch.closest("td.row5") || boardSearch.closest("table");
        const spare = settings.get("palette") && !PAGE.isSearch;
        // Parked on <body> rather than removed — CS.RIN.RU Enhanced looks for this
        // form, and an empty bar is never placed so isn't safe to park it in.
        if (spare) {
            boardSearch.setAttribute("data-rr-dupe", "");
            boardSearch.style.display = "none";
            document.body.append(boardSearch);
        } else {
            bar.append(el("div.rr-toolbar__board", {}, [adoptBoardSearch(boardSearch)]));
        }
        if (strip && !strip.textContent.trim()) {
            const holder = strip.closest("table");
            if (holder) holder.style.display = "none";
        }
    }

    apply();
    return { bar, setTag, tag: () => state.tag, empty: !bar.children.length };
}

/* ---- Forum action bar --------------------------------------------- */

/** Merges four separate header strips — a "Post new topic" button, "Page 1 of 615",
 *  "[ 61469 topics ]" and the numbered links — into one bar, matching the topic view. */
function buildForumBar() {
    const heading = document.querySelector("#wrapcentre > h2, #pageheader h2");
    if (!heading || document.querySelector(".rr-topicbar")) return null;

    const bar = el("div.rr-topicbar");
    const info = pagination();

    const post = document.querySelector('a[href*="mode=post"]');
    if (post) {
        bar.append(el("a.rr-btn", { href: post.getAttribute("href"), "data-variant": "primary" }, [t("New topic")]));
        const strip = post.closest("table");
        if (strip) strip.style.display = "none";
    }

    if (info.total && info.total > 1) {
        bar.append(buildPagerGroup(info));
    }

    heading.after(bar);
    // Lifts "Page X of Y" / "[ N topics ]" into the bar, same pass as the topic page.
    tidyBoardPagerStrip(bar, bar);

    // Subscribe/Mark-read links; members only, so a no-op on a logged-out page.
    adoptForumActions(bar);

    // Duplicate "Go to page" strip above the table — hidden here as the topic page
    // hides its own copy, keeping only the one below.
    if (settings.get("quickPager")) {
        const strip = Array.from(document.querySelectorAll("#wrapcentre td.gensmall"))
            .find((cell) => /^\s*(?:Go to page|На страницу)/.test(cell.textContent) && cell.querySelector('a[onclick*="jumpto"]'));
        if (strip) hideWithEmptyRow(strip);
    }

    // Forum name moved into the bar (was its own line above it, duplicating the
    // breadcrumb) — moved rather than rebuilt so its heading level and link survive.
    heading.classList.add("rr-topicbar__title");
    bar.prepend(heading);

    return bar;
}

/**
 * Subscribe-forum / Mark-topics-read: subsilver2 prints these members-only links
 * twice (above and below the listing) in a band of their own. Folded into the bar
 * here, the same move the topic page makes for its own actions.
 */
const FORUM_ACTION = 'a[href*="watch=forum"], a[href*="mark=topics"]';

// tr.nav (two cells, no class of their own) inside the listing's td.cat, top and
// bottom; td.nav / td.gensmall are the shapes the strip takes elsewhere on the board.
const FORUM_ACTION_CELLS = "#wrapcentre tr.nav > td, #wrapcentre td.nav, #wrapcentre td.gensmall";

function adoptForumActions(bar) {
    const cells = Array.from(document.querySelectorAll(FORUM_ACTION_CELLS))
        .filter((cell) => cell.querySelector(FORUM_ACTION) && !cell.closest(".rr-topicbar"));
    if (!cells.length) return;

    // Both copies are walked, because the board does not always print
    // the same pair top and bottom; the first of each kind wins.
    const seen = new Set();
    const actions = [];
    for (const cell of cells) {
        for (const link of cell.querySelectorAll(FORUM_ACTION)) {
            const kind = /mark=topics/.test(link.getAttribute("href") || "") ? "mark" : "watch";
            if (seen.has(kind)) continue;
            const label = link.textContent.replace(/\s+/g, " ").trim() || link.getAttribute("title") || "";
            if (!label) continue;
            seen.add(kind);
            link.classList.add("rr-btn", "rr-forumnav");
            link.setAttribute("data-variant", "quiet");
            link.setAttribute("title", label);
            actions.push(link);
        }
    }
    if (!actions.length) return;

    bar.append(el("span.rr-topicbar__spacer"));
    for (const link of actions) bar.append(link);

    // Emptying the cells isn't enough — markShapes gives the wrapping td.cat's row a
    // surface of its own, so the row must be hidden too or the empty band remains.
    for (const cell of cells) {
        hideWithEmptyRow(cell);
        const cat = cell.closest("td.cat");
        if (!cat || cat.querySelector("a[href], input, select, h4")) continue;
        const row = cat.parentElement;
        if (row && row.tagName === "TR") row.style.display = "none";
    }
}

/* ---- Last post ----------------------------------------------------- */

// Weekday ("Tuesday, ") dropped from the line (kept on the title) so the date and
// poster fit beside each other.
const WEEKDAY_RE = /^(\s*)(?:(?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day|Понедельник|Вторник|Среда|Четверг|Пятница|Суббота|Воскресенье),\s*/i;

/** Drops the weekday from text nodes under `node`; returns whether it changed anything,
 *  so the caller can keep the full date on the title. */
function dropWeekday(node, depth = 0) {
    let changed = false;
    for (const child of node.childNodes) {
        if (child.nodeType === 3 && WEEKDAY_RE.test(child.textContent)) {
            // "$1" keeps the space after the weekday: "Posted: 24 Jul", not "Posted:24 Jul".
            child.textContent = child.textContent.replace(WEEKDAY_RE, "$1");
            changed = true;
        } else if (child.nodeType === 1 && depth < 3 && /^(B|STRONG|SPAN|EM|DIV|P)$/.test(child.tagName)) {
            // A profile's "Joined:" value is one tag down: <b>Thursday, …</b>;
            // a search result's "Posted:" is in a floated <div> of its own.
            if (dropWeekday(child, depth + 1)) changed = true;
        }
    }
    return changed;
}

function hideWithEmptyRow(cell) {
    cell.style.display = "none";
    const row = cell.parentElement;
    if (!row || row.tagName !== "TR") return;
    const alive = Array.from(row.children).some((c) => c.style.display !== "none"
        && (c.textContent.trim() || c.querySelector("img, a, input, form, select")));
    if (alive) return;
    row.style.display = "none";
    const table = row.closest("table");
    if (table && !Array.from(table.querySelectorAll("tr")).some((r) => r.style.display !== "none")) {
        table.style.display = "none";
    }
}

// Lone date cells (Joined/Sent/announcement dates) get the same weekday-drop as
// Last post — on the message list a 144px cell wrapped the full date to two lines.
function tightenDateCells() {
    // td.gen/genmed: profile/control-panel date cells start with the weekday itself
    // (the label is in the previous cell); a post's date cell never does — the regex
    // anchor tells them apart.
    // td.gensmall: a search-result date, but not on a topic page, where that same
    // cell is the post's own date and the topic module reads it for its header.
    const cells = document.querySelectorAll(
        '#wrapcentre td[data-rr-col="date"], #wrapcentre p.topicdetails, #wrapcentre td.gen, #wrapcentre td.genmed, #wrapcentre b.gen, #wrapcentre b.genmed'
        + (PAGE.isTopic ? "" : ", #wrapcentre td.gensmall"),
    );
    for (const cell of cells) {
        if (cell.hasAttribute("data-rr-date")) continue;
        // Read before stripping, so the title can carry the whole date. The weekday
        // may follow a label ("Posted: Friday, …"), so each text node is checked, not the cell.
        const full = cell.textContent.replace(/\s+/g, " ").trim();
        if (!dropWeekday(cell)) continue;
        cell.setAttribute("data-rr-date", "");
        if (!cell.hasAttribute("title")) cell.setAttribute("title", full);
    }
}

// "Page 1 of 1" says nothing on a single-page folder or subscriptions list — dropped,
// unlike other pages where it's the only "Go to page" strip they have.
const LONE_PAGE_RE = /^\s*(?:Page\s+1\s+of\s+1|Страница\s+1\s+из\s+1)\s*$/;
const LEADING_LONE_PAGE_RE = /^\s*(?:Page\s+1\s+of\s+1|Страница\s+1\s+из\s+1)\s+/;

function dropLonePageCounters() {
    // td.gensmall and span.nav: the search results page prints its
    // counter in a span inside a floated div.
    for (const cell of document.querySelectorAll("#wrapcentre td.nav, #wrapcentre td.gensmall, #wrapcentre span.nav")) {
        if (cell.querySelector("a[href], form")) continue;
        const text = cell.textContent.replace(/\s+/g, " ");
        if (LONE_PAGE_RE.test(text)) { cell.style.display = "none"; continue; }

        // Counter may share a cell with "[ Search found N match ]" — only the run of
        // nodes up to the second number is removed.
        if (!LEADING_LONE_PAGE_RE.test(text)) continue;
        let seen = "";
        for (const node of Array.from(cell.childNodes)) {
            seen += node.textContent;
            node.remove();
            if (LONE_PAGE_RE.test(seen.replace(/\s+/g, " "))) break;
        }
        const first = cell.firstChild;
        if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, "");
    }
}

// PM folder marks messages with a 10px spacer gif (invisible here, the board's
// colours never load) that still shifted subjects 8px right on rows that had one.
// Redrawn as a coloured square; rows without one get an empty placeholder the same size.
const PM_MARK = 'span[class^="pm_"][class$="_colour"]';

function alignMessageMarkers() {
    const cells = Array.from(document.querySelectorAll('#wrapcentre td[data-rr-col="title"]'));
    if (!cells.some((cell) => cell.querySelector(PM_MARK))) return;
    for (const cell of cells) {
        const row = cell.parentElement;
        if (row) row.setAttribute("data-rr-pm-row", "");
        const mark = cell.querySelector(PM_MARK);
        if (mark) {
            mark.classList.add("rr-pm-mark");
            const kind = (mark.className.match(/pm_(\w+)_colour/) || [])[1];
            if (kind) mark.setAttribute("title", kind[0].toUpperCase() + kind.slice(1) + " message");
            continue;
        }
        // Board writes "&nbsp; " after its marker — matched here so unmarked rows align.
        cell.prepend(el("span.rr-pm-mark", { "aria-hidden": "true" }), "\u00a0 ");
    }
}

// Member list's Rank column is the same bilingual rank as a post's profile, but on a
// page the post module never reaches — Russian half moved to the title here.
function localiseRankCells() {
    // td.postdetails[align=center]: the rank under the name on a profile.
    const cells = document.querySelectorAll('td[data-rr-col="rank"], #wrapcentre td.postdetails[align="center"]');
    for (const cell of cells) {
        const full = cell.textContent.replace(/\s+/g, " ").trim();
        const short = localiseRank(full);
        // A rank with no Latin half is left as it is rather than emptied.
        if (!short || short === full) continue;
        for (const child of Array.from(cell.childNodes)) {
            if (child.nodeType === 3) child.remove();
        }
        cell.prepend(short);
        cell.setAttribute("title", full);
    }
}

/**
 * Folds the Last-post cell's two <p> lines (date, poster) into one — that stack was
 * the tallest thing in a listing row, setting the height of all 108 on a page. Nodes
 * are moved, not rewritten, so the poster's link, colour and jump-arrow survive intact.
 */
function tightenLastPost(cell) {
    const lines = Array.from(cell.children).filter((node) => node.tagName === "P");
    if (lines.length < 2) return;

    const first = lines[0];
    const full = cell.textContent.replace(/\s+/g, " ").trim();

    dropWeekday(first);

    for (const rest of lines.slice(1)) {
        if (!rest.textContent.trim() && !rest.querySelector("a, img")) { rest.remove(); continue; }
        first.append(el("span.rr-sep", { "aria-hidden": "true" }, ["·"]));
        while (rest.firstChild) first.append(rest.firstChild);
        rest.remove();
    }

    first.classList.add("rr-lastpost");
    first.setAttribute("title", full);
}

/* ---- Sections of a listing ---------------------------------------- */

// Section rows ("Announcements", "Topics") fold their run on click, remembered by
// name across listings. Rows stay in the DOM (filter/sort/find-in-page still see
// them), just hidden. The last section is never foldable — a listing that can fold
// away entirely reads as empty by accident.
const FOLDED_SECTIONS_KEY = "foldedSections";

function foldedSections() {
    const kept = store.get(FOLDED_SECTIONS_KEY, null);
    return kept && typeof kept === "object" ? kept : {};
}

// A section row is either td.cat+h4 (search results, the index), or a spanning
// td.row3 holding just a bold word (a forum listing's "Announcements", "Stickies").
// The second shape is tagged here so the stylesheet can draw it as a section head.
function sectionOf(row) {
    let cell = row.querySelector(":scope > td.cat");
    if (cell) {
        // Not the index's categories: the board folds those itself.
        if (row.getAttribute("data-rr-cat-row") !== "" || row.querySelector("td.catdiv, .ccopen, .ccclose")) return null;
        const heading = cell.querySelector("h4");
        return heading ? { cell, heading } : null;
    }
    if (row.children.length !== 1) return null;
    cell = row.firstElementChild;
    if (cell.tagName !== "TD" || !cell.classList.contains("row3") || !cell.hasAttribute("colspan")) return null;
    const heading = cell.querySelector(":scope > b, :scope > span > b, :scope > strong");
    if (!heading || cell.querySelector("a, input, select, img") || cell.textContent.trim().length > 60) return null;
    row.setAttribute("data-rr-cat-row", "section");
    cell.setAttribute("data-rr-section", "");
    return { cell, heading };
}

function initSectionFolds(table) {
    const rows = Array.from(table.querySelectorAll(":scope > tbody > tr"));
    // Section rows are all identified first — a run's end depends on knowing the next one.
    const heads = rows.map(sectionOf);
    const sections = [];
    rows.forEach((row, index) => {
        const found = heads[index];
        if (!found) return;
        const { cell, heading } = found;
        const run = [];
        for (let j = index + 1; j < rows.length; j += 1) {
            const next = rows[j];
            if (heads[j] || next.hasAttribute("data-rr-cat-row") || next.querySelector(":scope > th")) break;
            run.push(next);
        }
        const topics = run.filter((r) => r.querySelector("a.topictitle")).length;
        if (topics) sections.push({ row, cell, heading, run, topics });
    });
    if (sections.length < 2) return;

    const remembered = foldedSections();
    for (const section of sections.slice(0, -1)) {
        const name = section.heading.textContent.replace(/\s+/g, " ").trim();
        const key = name.toLowerCase();
        let folded = Boolean(remembered[key]);

        const countLabel = el("span.rr-section__count", {}, [t("{n} topics", { n: section.topics })]);
        section.cell.classList.add("rr-section");
        section.cell.prepend(icon("chevronD", 13));
        section.cell.append(countLabel);
        section.cell.setAttribute("role", "button");
        section.cell.setAttribute("tabindex", "0");

        const sync = () => {
            section.row.toggleAttribute("data-rr-folded", folded);
            for (const r of section.run) r.toggleAttribute("data-rr-section-folded", folded);
            section.cell.setAttribute("aria-expanded", folded ? "false" : "true");
            section.cell.setAttribute("title", t(folded ? "Show this section" : "Fold this section"));
        };
        const flip = () => {
            folded = !folded;
            const next = foldedSections();
            if (folded) next[key] = true;
            else delete next[key];
            store.set(FOLDED_SECTIONS_KEY, next);
            sync();
        };
        section.cell.addEventListener("click", (event) => {
            if (event.target instanceof Element && event.target.closest("a, input, select, button")) return;
            flip();
        });
        section.cell.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            flip();
        });
        sync();
    }
}

/* ---- The control panel's menu ------------------------------------- */

// Control panel's nav sections give no visual sign of which unfold — found only by
// clicking. Closed items get a chevron pointing at what they open, the open one a
// chevron pointing down at its pages, which step in under it.
function decorateNavLists() {
    for (const table of document.querySelectorAll("#wrapcentre table.tablebg[data-rr-navlist]")) {
        for (const cell of table.querySelectorAll(":scope > tbody > tr > td")) {
            const current = cell.querySelector(":scope > b.nav");
            const link = cell.querySelector(":scope > a.nav");
            if (current) {
                cell.setAttribute("data-rr-navitem", "open");
                current.prepend(icon("chevronD", 13));
                for (const marker of cell.querySelectorAll("ul.nav li > b")) {
                    if (/^[\s »]*$/.test(marker.textContent)) marker.remove();
                }
            } else if (link) {
                cell.setAttribute("data-rr-navitem", "closed");
                link.append(icon("chevron", 13));
            }
        }
    }
}

// Sub-forums table shares the index's "Forum" heading; relabeled "Subforums" so it
// doesn't read as a second, shorter index above the topics.
function labelSubforums() {
    if (!PAGE.isForum) return;
    for (const table of document.querySelectorAll("#wrapcentre table[data-rr-list]")) {
        if (!table.querySelector("a.forumlink") || table.querySelector("a.topictitle")) continue;
        const head = table.querySelector(':scope > tbody > tr[data-rr-head] > th[data-rr-col="title"]');
        if (!head) continue;
        // The words may already be inside the sort button (initColumnSort).
        const holder = head.querySelector("button") || head;
        const words = Array.from(holder.childNodes).find((node) => node.nodeType === 3 && node.textContent.trim());
        if (words) words.textContent = " " + t("Subforums") + " ";
    }
}

/* ---- Entry point --------------------------------------------------- */

// Replaces :has() selectors that cost 240ms of style work — re-checked on every DOM
// change, and this script touches ~600 cells per listing — with attributes set once.
function markShapes() {
    for (const cell of document.querySelectorAll("#wrapcentre td.cat")) {
        const row = cell.parentElement;
        // "controls" is set on the row too — the phone stylesheet pulls the sort
        // strip away from the card via a margin on the row, not the cell.
        let kind = cell.childNodes.length ? "" : "empty";
        if (cell.querySelector(':scope > table, select, input[type="submit"]')) {
            cell.setAttribute("data-rr-cat", "controls");
            kind = "controls";
        } else if (cell.getAttribute("align") === "right" && !cell.querySelector("h4")) {
            cell.setAttribute("data-rr-cat", "plain");
        }
        if (row && row.tagName === "TR") {
            row.setAttribute("data-rr-cat-row", kind);
        }
    }

    // The posting form's font colour palette: one table of swatches.
    const swatch = document.querySelector('td[bgcolor] > a[onclick*="bbfontstyle"]');
    if (swatch) {
        const table = swatch.closest("table");
        if (table) {
            table.setAttribute("data-rr-palette", "");
            for (const cell of table.querySelectorAll("td[bgcolor]")) cell.setAttribute("data-rr-swatch", "");
        }
    }

    // Link-list tables (control panel Options, message folders) and their
    // message-colour legend — otherwise each row becomes a phone card, and a
    // 9-item menu becomes a wall of them.
    for (const table of document.querySelectorAll("#wrapcentre table.tablebg")) {
        const cells = Array.from(table.querySelectorAll(":scope > tbody > tr > td"));
        if (!cells.length) continue;
        if (cells.every((cell) => cell.querySelector("a.nav, b.nav, span.nav") && !cell.querySelector("input, select, .postbody"))) {
            table.setAttribute("data-rr-navlist", "");
        }
        const swatch = (cell) => /(^|\s)pm_\w+_colour(\s|$)/.test(cell.className);
        if (cells.some(swatch) && cells.every((cell) => swatch(cell) || cell.children.length <= 1)) {
            table.setAttribute("data-rr-pm-legend", "");
        }
    }

    // Permissions notice ("You can post new topics…") is the table right after the
    // jump-to form's — tagged here so the stylesheet can gap it without a :has().
    const jump = document.querySelector('form[name="jumpbox"]');
    const jumpTable = jump && jump.closest("table");
    if (jumpTable && jumpTable.nextElementSibling && jumpTable.nextElementSibling.tagName === "TABLE") {
        jumpTable.nextElementSibling.setAttribute("data-rr-after-jump", "");
    }

    // A checkbox/radio alone in the first cell, with its label text in the next.
    for (const input of document.querySelectorAll(
        '#wrapcentre td:first-child > input[type="checkbox"]:only-child, #wrapcentre td:first-child > input[type="radio"]:only-child')) {
        const row = input.closest("tr");
        if (!row) continue;
        row.setAttribute("data-rr-check-row", "");
        // Template never marks these words as the control's label — clicking did
        // nothing, unlike every other form.
        const words = input.parentElement && input.parentElement.nextElementSibling;
        if (!words || words.querySelector("input, select, textarea, button")) continue;
        words.setAttribute("data-rr-check-label", "");
        words.addEventListener("click", (event) => {
            if (event.target instanceof Element && event.target.closest("a")) return;
            input.click();
        });
    }

    // "Top" row's link is already hidden (forum.css, replaced by the floating
    // button) — leaves an empty band the width of the post, worse as a padded card on a phone.
    for (const row of document.querySelectorAll("#wrapcentre table.tablebg > tbody > tr")) {
        const first = row.firstElementChild;
        if (!first || first.tagName !== "TD") continue;
        const links = first.querySelectorAll("a");
        if (links.length !== 1) continue;
        const href = links[0].getAttribute("href") || "";
        if (href !== "#wrapheader" && href !== "#top") continue;
        if (first.textContent.trim() !== links[0].textContent.trim()) continue;
        row.setAttribute("data-rr-top-row", "");
    }
}

/**
 * Member list / message folders / Who's online are listings too, but a post table
 * shares the same row1/row2 classes without being one — so the shape is checked
 * (a header row, 3+ striped rows, a member/message link, nothing post- or form-like).
 */
function isRoster(table) {
    if (PAGE.isTopic || profileView()) return false;
    if (!table.querySelector("th")) return false;
    if (table.querySelector(".postbody, textarea, table")) return false;
    // row1/row2 sits on the cells (message folder, Who's online) or on the <tr> itself (member list).
    const striped = (node) => Boolean(node) && /(^|\s)row[12](\s|$)/.test(node.className || "");
    const rows = Array.from(table.querySelectorAll(":scope > tbody > tr"))
        .filter((row) => striped(row) || striped(row.firstElementChild));
    if (rows.length < 3) return false;
    return Boolean(table.querySelector('a[href*="mode=viewprofile"], .topictitle a'));
}

/** Whole title cell opens the topic (the row highlights edge-to-edge on hover, but
 *  most of the cell was dead space under that light). Links, controls and text
 *  selections are left alone; Ctrl/⌘ opens a new tab. */
function initRowClick() {
    let any = false;
    for (const table of document.querySelectorAll("table[data-rr-list]")) {
        if (!table.querySelector('td[data-rr-col="title"] a.topictitle, td[data-rr-col="title"] a.forumlink')) continue;
        table.setAttribute("data-rr-rowclick", "");
        any = true;
    }
    if (!any) return;
    document.addEventListener("click", (event) => {
        if (event.button !== 0 || event.defaultPrevented) return;
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;
        const cell = target.closest('table[data-rr-rowclick] td[data-rr-col="title"]');
        if (!cell) return;
        if (target.closest("a, button, input, select, label, [role='button']")) return;
        if (window.getSelection && String(window.getSelection()).trim()) return;
        const link = cell.querySelector("a.topictitle, a.forumlink");
        if (!link) return;
        if (event.ctrlKey || event.metaKey) window.open(link.href, "_blank", "noopener");
        else location.href = link.href;
    });
}

/**
 * Profiles print every field the template knows (ICQ, AIM, Yahoo, MSN, Jabber,
 * Occupation, Interests…) blank on nearly every account. A row whose label ends in
 * a colon and whose value cell has no text, link or image is dropped — judged by
 * shape, not by field name, so a filled-in field of any name stays.
 */
// PAGE.isProfile covers all of memberlist.php (the roster as well as one member's
// page) — this checks for the latter.
function profileView() {
    return PAGE.isProfile && /mode=viewprofile/.test(location.search);
}

function hideEmptyProfileRows() {
    for (const row of document.querySelectorAll("#wrapcentre table.tablebg tr")) {
        const cells = Array.from(row.children).filter((node) => node.tagName === "TD");
        if (cells.length !== 2) continue;
        // "PM: [button]" beside "Groups: [select]" also look like label+value, but
        // they're two forms side by side — the phone stacks those instead.
        if (cells.some((cell) => cell.querySelector("table, form"))) continue;
        const label = cells[0].textContent.replace(/\s+/g, " ").trim();
        if (!/:$/.test(label)) continue;
        const value = cells[1];
        if (value.querySelector("a, img, input, select, button, textarea")
            || value.textContent.replace(/[\s\u00a0]+/g, "")) {
            // A label and its value: the phone keeps them on one line.
            row.setAttribute("data-rr-pair", "");
            continue;
        }
        row.hidden = true;
        row.setAttribute("data-rr-empty-row", "");
    }
}

// Turns page links into small chips (current page marked, "..." kept as a quiet
// mark). Two shapes come through here: "[ Go to page: 1 … 43 ]" under a long topic's
// title, and the "Go to page 1, 2, 3 … 615 Next" strip a listing ends with.
function chipPager(holder) {
    if (holder.hasAttribute("data-rr-minipager")) return;
    if (!holder.querySelector("a[href]") || !/(Go to page|На страницу)/.test(holder.textContent)) return;
    const russian = /На страницу/.test(holder.textContent);
    // Gathered in reading order before anything moves — a node's neighbours change once it does.
    const items = [];
    const walk = (node) => {
        for (const child of Array.from(node.childNodes)) {
            if (child.nodeType === 3) { if (/…|\.\.\./.test(child.textContent)) items.push("gap"); continue; }
            if (child.nodeType !== 1) continue;
            if (child.matches("a[href], strong")) items.push(child);
            else if (!child.querySelector("a") && /…|\.\.\./.test(child.textContent)) items.push("gap");
            else walk(child);
        }
    };
    walk(holder);
    const row = el("span.rr-minipager", { "aria-label": russian ? "На страницу" : "Go to page" });
    const jump = items.find((node) => node !== "gap" && /jumpto/.test(node.getAttribute("onclick") || ""));
    if (jump) {
        jump.classList.add("rr-minipager__label");
        row.append(jump);
    } else {
        row.append(el("span.rr-minipager__label", {}, [russian ? "На страницу" : "Go to page"]));
    }
    let last = null;
    for (const item of items) {
        if (item === jump) continue;
        if (item === "gap") {
            if (last && last !== "gap") row.append(el("span.rr-minipager__gap", { "aria-hidden": "true" }, ["…"]));
            last = "gap";
            continue;
        }
        const number = /^\d+$/.test(item.textContent.trim());
        if (item.tagName === "STRONG" && !number) continue;
        item.classList.add("rr-minipager__page");
        if (item.tagName === "STRONG") item.classList.add("rr-minipager__page--here");
        else if (!number) item.classList.add("rr-minipager__step");
        row.append(item);
        last = item;
    }
    holder.textContent = "";
    holder.append(row);
    holder.setAttribute("data-rr-minipager", "");
}

function tidyPagers() {
    for (const p of document.querySelectorAll('td[data-rr-col="title"] p.gensmall')) chipPager(p);
    // "[ Go to page: 1 … 263, 264, 265 ]" under a subscribed topic or a bookmark: the
    // same shape as under a listing title, in a cell this script does not label.
    for (const strip of document.querySelectorAll("#wrapcentre p.gensmall, #wrapcentre span.gensmall")) {
        if (strip.closest(".rr-topicbar, .rr-minipager, .rr-releases")) continue;
        if (!/(?:Go to page|На страницу)\s*:/.test(strip.textContent)) continue;
        chipPager(strip);
    }
    for (const jump of document.querySelectorAll('#wrapcentre a[onclick*="jumpto"]')) {
        if (jump.closest(".rr-topicbar, .rr-minipager")) continue;
        const holder = jump.closest("b") || jump.closest("td, p, span");
        if (!holder) continue;
        chipPager(holder);
        // The strip is a bare table dropped between two cards, with
        // nothing to hold them apart; named so the stylesheet can.
        const table = holder.closest("table");
        if (table && !table.matches(".tablebg, .forumline") && /^(wrapcentre|pagecontent)$/.test(table.parentElement.id)) {
            table.setAttribute("data-rr-strip", "");
        }
    }
}

// The board hides a missing-email cell with inline display:none, which removes it
// from a real table rather than blanking it — every later cell slides one column
// left. Restores the empty cell wherever the row and header still agree on the
// column count. Only the board's own inline hiding is undone, only before this
// script hides anything of its own.
function restoreGridCells(table) {
    const header = table.querySelector(":scope > tbody > tr[data-rr-head], :scope > tbody > tr:first-child");
    if (!header) return;
    const columns = header.querySelectorAll(":scope > th, :scope > td").length;
    if (columns < 3) return;
    for (const row of table.querySelectorAll(":scope > tbody > tr")) {
        const cells = row.querySelectorAll(":scope > td");
        if (cells.length !== columns) continue;
        for (const cell of cells) {
            if (cell.style.display === "none") cell.style.removeProperty("display");
        }
    }
}

// Roster headers align to match their (often centred) column, or a left-aligned
// header names nothing in particular over a centred one.
function alignRosterHeaders(table) {
    const header = table.querySelector(":scope > tbody > tr[data-rr-head], :scope > tbody > tr:first-child");
    if (!header) return;
    const heads = Array.from(header.querySelectorAll(":scope > th"));
    if (!heads.length) return;
    const rows = Array.from(table.querySelectorAll(":scope > tbody > tr"));
    const body = rows.slice(rows.indexOf(header) + 1)
        .find((row) => row.querySelectorAll(":scope > td").length === heads.length
            && !row.querySelector(":scope > td[colspan]"));
    if (!body) return;
    const cells = body.querySelectorAll(":scope > td");
    heads.forEach((head, index) => {
        if (head.hasAttribute("data-rr-col")) return;
        const align = (cells[index].getAttribute("align") || "").toLowerCase();
        if (align === "center" || align === "right") head.style.textAlign = align;
    });
}

// Roster's email/website cells are padded with &nbsp; even when empty — on phone
// that drew as an empty dark chip in the card.
function markEmptyCells(table) {
    for (const cell of table.querySelectorAll(":scope > tbody > tr > td")) {
        if (cell.textContent.replace(/[\s\u00a0]+/g, "")) continue;
        if (cell.querySelector("a, img, input, button, select, svg")) continue;
        cell.setAttribute("data-rr-empty", "");
    }
}

// Template writes link rows as bare text with punctuation between them
// ("Previous PM | Next PM", "[ Add friend | Add foe ]") — rendered as pipes at four
// different heights. Replaced with a row and a gap, which is what the punctuation
// was standing in for.
const LINK_STRIP_JUNK = /^[\s |:·,;\[\]()–—-]*$/;

function tidyLinkStrips() {
    const cells = document.querySelectorAll(
        "#wrapcentre td.gen, #wrapcentre td.gensmall, #wrapcentre td.genmed, #wrapcentre td.nav,"
        + " #wrapcentre p.gensmall, #wrapcentre span.gensmall, #wrapcentre div.gensmall",
    );
    for (const cell of cells) {
        if (cell.closest(".rr-topicbar, .rr-toolbar, .rr-releases, .postbody, table[data-rr-list]")) continue;
        if (cell.querySelector("img, input, select, textarea, table, .rr-minipager")) continue;
        const links = Array.from(cell.children).filter((node) => node.tagName === "A");
        if (links.length < 2 || links.length !== cell.children.length) continue;
        // Only punctuation between them, or this is a sentence with
        // links in it rather than a strip of controls.
        if (!Array.from(cell.childNodes).every((node) => node.nodeType !== 3 || LINK_STRIP_JUNK.test(node.textContent))) continue;
        for (const node of Array.from(cell.childNodes)) {
            if (node.nodeType === 3) node.remove();
        }
        const row = el("span.rr-linkrow");
        if ((cell.getAttribute("align") || "").toLowerCase() === "right") row.setAttribute("data-rr-align", "right");
        cell.append(row);
        for (const link of links) row.append(link);
    }
}

// Board's own broken images (e.g. an avatar box for a member with none) are hidden;
// a broken image inside a post is left as-is — that hole is honest, it's the poster's.
function dropBrokenImages() {
    for (const img of document.querySelectorAll("#wrapcentre img")) {
        if (img.closest(".postbody, .rr-game, .rr-lightbox")) continue;
        const drop = () => { img.style.display = "none"; };
        const src = img.getAttribute("src");
        // No source at all, or one the browser has already given up on.
        if (!src || (img.complete && img.naturalWidth === 0)) drop();
        else img.addEventListener("error", drop, { once: true });
    }
}

/* ---- Sorting the page you are on ---------------------------------- */

// Client-side sort only (phpBB has no server-side reorder for rows already sent).
// Sorted within each run between the template's own section rows, so a pinned
// announcement never lands among the topics.
const SORT_KIND = {
    replies: "number", views: "number", topics: "number", posts: "number", num: "number",
    date: "date", last: "date",
    title: "text", author: "text", rank: "text",
};

const SORT_MONTHS = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// Board's date format after the weekday is dropped. Relative times ("4 minutes
// ago", "Today") read from the title attribute set when they were shortened.
function boardTime(text) {
    const said = String(text || "");
    const match = /(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})(?:,\s*(\d{1,2}):(\d{2}))?/.exec(said);
    if (match) {
        const month = SORT_MONTHS[match[2].toLowerCase()];
        if (month !== undefined) {
            return Date.UTC(Number(match[3]), month, Number(match[1]), Number(match[4] || 0), Number(match[5] || 0));
        }
    }
    if (/^\s*(?:today|сегодня)/i.test(said) || /\bago\b|назад/i.test(said)) return Date.now();
    return null;
}

function sortKey(row, index, kind) {
    const cell = row.children[index];
    if (!cell) return kind === "text" ? "" : -Infinity;
    if (kind === "number") {
        const digits = cell.textContent.replace(/[\s\u00a0\u202f,]/g, "");
        const value = parseFloat(digits);
        return Number.isFinite(value) ? value : -Infinity;
    }
    if (kind === "date") {
        const dated = cell.hasAttribute("title") ? cell : cell.querySelector("[title]");
        const time = boardTime(dated ? dated.getAttribute("title") : "") ?? boardTime(cell.textContent);
        return time === null ? -Infinity : time;
    }
    return cell.textContent.replace(/\s+/g, " ").trim().toLowerCase();
}

// subsilver2 alternates row1/row2 *across columns*, not rows — a topic row comes out
// striped in vertical bands instead of by row. Shade is written to a separate
// attribute instead (the board's own classes are left alone, in case another script reads them).
function restripe(rows) {
    rows.forEach((row, index) => row.setAttribute("data-rr-stripe", index % 2 ? "b" : "a"));
}

/** Data rows split into runs by the template's own section rows — a run is the unit
 *  a sort reorders within, and it is what the stripe runs down. */
function listingRuns(table) {
    const head = table.querySelector(":scope > tbody > tr[data-rr-head]");
    if (!head || !head.querySelector("th")) return [];
    // Columns, not cells — the first heading spans the unread marker plus the title.
    const width = Array.from(head.children)
        .reduce((total, cell) => total + parseInt(cell.getAttribute("colspan") || "1", 10), 0);

    const all = Array.from(table.querySelectorAll(":scope > tbody > tr"));
    const runs = [];
    let run = null;
    for (const row of all.slice(all.indexOf(head) + 1)) {
        const data = row.children.length === width
            && !row.querySelector("th")
            && !row.hasAttribute("data-rr-cat-row")
            && !row.querySelector(":scope > td[colspan]");
        if (!data) { run = null; continue; }
        if (!run) { run = []; runs.push(run); }
        run.push(row);
    }
    return runs;
}

function initColumnSort(table) {
    const head = table.querySelector(":scope > tbody > tr[data-rr-head]");
    if (!head || !head.querySelector("th")) return;
    const sortable = listingRuns(table).filter((rows) => rows.length > 2);
    if (!sortable.length) return;
    const original = sortable.map((rows) => rows.slice());
    // Anchor read once, before any sort — re-reading it after a sort would give
    // whichever row had ended up last, scattering rows through their own run on restore.
    const anchors = sortable.map((rows) => rows[rows.length - 1].nextSibling);
    // "#" is a page position, not a row property — sorted rows keep the number in
    // place rather than carrying it with them.
    const numbers = sortable.map((rows) => rows.map((row) => {
        const cell = row.querySelector(':scope > td[data-rr-col="num"]');
        return cell ? cell.textContent : null;
    }));

    let current = null;

    const place = (rows, at) => {
        const parent = rows[0].parentElement;
        for (const row of rows) parent.insertBefore(row, anchors[at]);
        restripe(rows);
        rows.forEach((row, index) => {
            const text = numbers[at][index];
            if (text === null) return;
            const cell = row.querySelector(':scope > td[data-rr-col="num"]');
            if (cell) cell.textContent = text;
        });
    };

    const apply = (index, kind, direction) => {
        sortable.forEach((rows, at) => {
            const order = original[at];
            if (!direction) { place(order.slice(), at); return; }
            const decorated = order.map((row, position) => ({ row, position, key: sortKey(row, index, kind) }));
            decorated.sort((a, b) => {
                let side = 0;
                if (typeof a.key === "string" || typeof b.key === "string") {
                    side = String(a.key).localeCompare(String(b.key), undefined, { numeric: true, sensitivity: "base" });
                } else {
                    side = a.key === b.key ? 0 : (a.key < b.key ? -1 : 1);
                }
                // A stable tie: two rows with the same count keep the
                // order the board sent them in.
                return (direction === "asc" ? side : -side) || a.position - b.position;
            });
            place(decorated.map((entry) => entry.row), at);
        });
    };

    let at = 0;
    for (const th of head.children) {
        const span = parseInt(th.getAttribute("colspan") || "1", 10);
        // A spanning heading names the last of the columns it covers —
        // the title, where the ones before it are the marker gutter.
        const index = span > 1 ? at + span - 1 : at;
        at += span;
        if (th.tagName !== "TH") continue;
        const kind = SORT_KIND[th.getAttribute("data-rr-col")];
        if (!kind || !th.textContent.trim()) continue;

        const mark = el("span.rr-sortmark", { "aria-hidden": "true" });
        const button = el("button.rr-sortbtn", { type: "button" });
        while (th.firstChild) button.append(th.firstChild);
        button.append(mark);
        th.append(button);
        th.setAttribute("data-rr-sortable", "");

        button.addEventListener("click", () => {
            const same = current && current.th === th;
            const direction = !same ? "asc" : current.direction === "asc" ? "desc" : null;
            for (const other of head.children) {
                other.removeAttribute("data-rr-sorted");
                const otherMark = other.querySelector(".rr-sortmark");
                if (otherMark) otherMark.textContent = "";
            }
            apply(index, kind, direction);
            current = direction ? { th, direction } : null;
            if (direction) {
                th.setAttribute("data-rr-sorted", direction);
                mark.textContent = direction === "asc" ? "\u2191" : "\u2193";
                th.setAttribute("aria-sort", direction === "asc" ? "ascending" : "descending");
            } else {
                th.removeAttribute("aria-sort");
            }
        });
    }
}

/* ---- A folder's Mark column --------------------------------------- */

// No bulk-select existed — deleting a dozen messages was a dozen clicks. Adds a
// select-all in the heading and shift-click range select, like any mail client.
function initMarkColumn(table) {
    const boxes = Array.from(table.querySelectorAll(':scope > tbody > tr > td input[type="checkbox"]'));
    if (boxes.length < 3) return;
    const head = table.querySelector(':scope > tbody > tr[data-rr-head] > th[data-rr-col="mark"]');
    if (!head || head.querySelector("input")) return;

    const all = el("input.rr-markall", { type: "checkbox", title: t("Mark everything on this page") });
    all.addEventListener("change", () => {
        for (const box of boxes) {
            if (box.checked === all.checked) continue;
            box.checked = all.checked;
            box.dispatchEvent(new Event("change", { bubbles: true }));
        }
    });
    head.append(all);

    let anchor = null;
    for (const box of boxes) {
        box.addEventListener("click", (event) => {
            if (event.shiftKey && anchor && anchor !== box) {
                const from = boxes.indexOf(anchor);
                const to = boxes.indexOf(box);
                for (let i = Math.min(from, to); i <= Math.max(from, to); i += 1) {
                    boxes[i].checked = box.checked;
                }
            }
            anchor = box;
        });
    }
}

/* ---- The rules notice folds ---------------------------------------- */

// Identical 217-290px notice repeats above every topic in a restricted forum — worth
// reading once, a line after. Open on first sight (a reader who has never seen the
// rules needs to meet them), folded after. Keyed by the notice's own text, not the
// forum, so an edited notice is shown again.
const RULES_FOLD_KEY = "rulesFold";

function rulesFolds() {
    const kept = store.get(RULES_FOLD_KEY, null);
    return kept && typeof kept === "object" ? kept : {};
}

// djb2 hash of the normalised text — two forums sharing wording share a store key;
// an edited notice gets a new key and reappears.
function rulesKey(text) {
    const said = text.replace(/\s+/g, " ").trim().toLowerCase();
    let hash = 5381;
    for (let i = 0; i < said.length; i += 1) hash = (((hash << 5) + hash) ^ said.charCodeAt(i)) >>> 0;
    return hash.toString(36);
}

/** Folds one notice: `heading` (or null, when the board printed none) becomes the
 *  toggle button's label, `content` moves into a body the button hides — the card
 *  keeps its existing shape and colours. */
function foldRulesNotice(card, heading, content) {
    if (!content.length || card.querySelector(".rr-rules__toggle")) return;

    const body = el("div.rr-rules__body");
    for (const node of content) body.append(node);

    // Board's own heading moves into the button rather than being replaced — the
    // stylesheet, and anything else reading this card, already looks for that element.
    const label = heading || el("span.rr-rules__name", {}, [t("Forum rules")]);
    const toggle = el("button.rr-rules__toggle", { type: "button" }, [icon("chevronD", 13), label]);

    const key = rulesKey(body.textContent);
    const kept = rulesFolds();
    // First time: open, then immediately written closed — so opening it back up is
    // the only thing that keeps it open on the next page of the same forum.
    const first = !Object.prototype.hasOwnProperty.call(kept, key);
    let open = first || kept[key] === "open";
    if (first) {
        kept[key] = "closed";
        store.set(RULES_FOLD_KEY, kept);
    }

    const sync = () => {
        card.toggleAttribute("data-rr-folded", !open);
        body.hidden = !open;
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        labelled(toggle, open ? t("Hide the forum rules") : t("Read the forum rules"));
    };
    toggle.addEventListener("click", () => {
        open = !open;
        const now = rulesFolds();
        now[key] = open ? "open" : "closed";
        store.set(RULES_FOLD_KEY, now);
        sync();
    });

    card.prepend(toggle);
    toggle.after(body);
    sync();
}

// subsilver2's rules box (a lone td.row3) has two problems left alone: an inline
// `margin-bottom: 2px` beats any stylesheet rule and glues it to the topic title
// below, and it keeps listing-row styling (inset, hairline, same ground) so it reads
// as a slab of text with no edges. Tagged here; the stylesheet dresses it properly.
function markForumRules() {
    // Live board writes div.forumrules directly, not the td.row3 subsilver2 and the
    // fixtures ship — the td.row3 handling below never actually matched on cs.rin.ru.
    for (const box of document.querySelectorAll("#wrapcentre div.forumrules")) {
        if (box.hasAttribute("data-rr-rules")) continue;
        box.setAttribute("data-rr-rules", "");
        tameRulesEmphasis(box);
        // Template's <br> spacing (both sides plus one under the heading) is now
        // redundant — the card has its own margins.
        for (const side of ["previousElementSibling", "nextElementSibling"]) {
            const near = box[side];
            if (near && near.tagName === "BR") near.style.display = "none";
        }
        const heading = box.querySelector("h3, h4");
        if (heading && heading.nextElementSibling && heading.nextElementSibling.tagName === "BR") {
            heading.nextElementSibling.style.display = "none";
        }
        // Everything but the heading is the rules; the heading becomes
        // the control that shows them.
        const content = Array.from(box.childNodes).filter((node) => node !== heading);
        foldRulesNotice(box, heading, content);
    }

    for (const cell of document.querySelectorAll("#wrapcentre td.row3")) {
        const box = cell.closest("table.tablebg");
        if (!box || box.hasAttribute("data-rr-rules")) continue;

        // Checked by content (no header row, no topic links), not by nesting depth —
        // a cell-count check failed on the live board, where the rules are wrapped in
        // an extra table subsilver2 doesn't show in the fixtures.
        if (box.querySelector("th, a.topictitle, a.forumlink")) continue;
        if (!cell.querySelector("h4, p.rules, .postbody")) continue;

        box.setAttribute("data-rr-rules", "");
        if (box.style.marginBottom) box.style.marginBottom = "";
        tameRulesEmphasis(cell);

        // The cell (td.row3), not the table, is the card the stylesheet dresses —
        // toggle and body go inside it.
        const heading = cell.querySelector("h4, p.rules, h3");
        const content = Array.from(cell.childNodes).filter((node) => node !== heading);
        foldRulesNotice(cell, heading, content);
    }
}

// Board's [size=150] BBCode becomes inline font-size:150%, which beats the
// stylesheet — 22px shouting over three lines above a smaller topic title. Dropped
// rather than clamped: even 120% still overpowers, so emphasis has to come from the
// card/rail/colour instead. Inline colour (#FFBF00, not in this theme system) is
// cleared the same way so the stylesheet can paint its own per-theme warning colour.
const RULES_MAX_EMPHASIS = 100;

function tameRulesEmphasis(cell) {
    for (const node of cell.querySelectorAll('[style*="font-size"]')) {
        const written = /^\s*(\d+(?:\.\d+)?)\s*(%|em|rem)\s*$/.exec(node.style.fontSize);
        if (!written) continue;
        const percent = written[2] === "%" ? Number(written[1]) : Number(written[1]) * 100;
        if (percent <= RULES_MAX_EMPHASIS) continue;
        node.style.removeProperty("font-size");
        // Typed in beside it, and it fights the leading the card sets.
        node.style.removeProperty("line-height");
    }
    for (const node of cell.querySelectorAll('[style*="color"]')) node.style.removeProperty("color");
}

/** row1..row5, the classes subsilver2 bands a table with. */
const ROW_CLASS_RE = /\brow[1-5]\b/;
/** A label cell: "Message subject:", "From:" — the colon is the tell. */
const LABEL_RE = /:\s*$/;

// Field tables (e.g. a PM's "Subject:/From:/Sent:/To:" header) put the row1/row2
// class on the <tr>, not the <td> — so this stylesheet's td.row1 inset never applied,
// and labels sat at 4px padding while the panel below sat at 14px. Told apart by
// shape: two cells, a label ending in a colon, no header row, no topic links.
function markFieldTables() {
    for (const table of document.querySelectorAll("#wrapcentre table.tablebg")) {
        if (table.hasAttribute("data-rr-fields")) continue;
        if (table.querySelector("th, a.topictitle, a.forumlink, .postbody, textarea")) continue;

        const rows = Array.from(table.querySelectorAll(":scope > tbody > tr"));
        if (rows.length < 2) continue;

        const fields = rows.every((row) => {
            if (!ROW_CLASS_RE.test(row.className)) return false;
            const cells = Array.from(row.children).filter((cell) => cell.tagName === "TD");
            if (cells.length !== 2) return false;
            // The cell must not carry a row class of its own, or the
            // padding it already has is the one this would double.
            if (cells.some((cell) => ROW_CLASS_RE.test(cell.className))) return false;
            return LABEL_RE.test(cells[0].textContent);
        });
        if (!fields) continue;

        table.setAttribute("data-rr-fields", "");
        for (const row of rows) {
            const cells = Array.from(row.children).filter((cell) => cell.tagName === "TD");
            cells[0].setAttribute("data-rr-field", "label");
            cells[1].setAttribute("data-rr-field", "value");
        }
    }
}

function initLists() {
    markShapes();
    markForumRules();
    markFieldTables();
    groupSortControls();
    for (const table of document.querySelectorAll("table.tablebg")) {
        restoreGridCells(table);
        labelColumns(table);
        // row1/row2 alternate down a listing but wrap whole posts in a topic — same
        // classes, opposite meaning, so which kind of table this is has to be tagged.
        const roster = isRoster(table);
        if (table.querySelector("a.topictitle, a.forumlink") || roster) {
            table.setAttribute("data-rr-list", "");
            groupListingNumbers(table);
        }
        // Member roster (not a message folder) — the phone lays cards out name-first
        // and drops template-empty cells.
        if (roster && !table.querySelector(".topictitle a, a.topictitle, a.forumlink")) {
            table.setAttribute("data-rr-roster", "");
            alignRosterHeaders(table);
            markEmptyCells(table);
        }
        if (table.hasAttribute("data-rr-list")) {
            for (const run of listingRuns(table)) restripe(run);
            if (settings.get("sortColumns")) initColumnSort(table);
            initMarkColumn(table);
            if (table.querySelector("a.topictitle")) initSectionFolds(table);
        }
    }
    decorateNavLists();
    // After the sort buttons exist, so the words are found inside one.
    labelSubforums();
    if (settings.get("rowClick")) initRowClick();
    if (profileView()) {
        // Named on the root so the phone can stack the profile's two
        // columns without a :has() on the table.
        document.documentElement.setAttribute("data-rr-profile", "");
        hideEmptyProfileRows();
    }
    tidyPagers();
    // Icon legend: the index's table is class="legend", a listing's has no class at
    // all — dot cells and spacers are tagged so the phone can lay each dot beside its words.
    for (const table of document.querySelectorAll("#wrapcentre table.legend, #wrapcentre table:not([class])")) {
        if (table.hasAttribute("data-rr-legend") || table.querySelector("table, input, select, a")) continue;
        const cells = Array.from(table.querySelectorAll(":scope > tbody > tr > td"));
        const dot = (cell) => !cell.textContent.trim() && cell.querySelector(".rr-dot")
            && Array.from(cell.children).every((child) => child.matches("img, .rr-dot"));
        const words = (cell) => cell.textContent.replace(/[\s\u00a0]+/g, "") && !cell.querySelector("img, .rr-dot, b, table");
        const dots = cells.filter(dot);
        if (dots.length < 2) continue;
        if (!cells.every((cell) => dot(cell) || words(cell) || !cell.textContent.replace(/[\s\u00a0]+/g, ""))) continue;
        table.setAttribute("data-rr-legend", "");
        for (const cell of dots) cell.setAttribute("data-rr-legend-dot", "");
        markEmptyCells(table);
    }
    // The message folder's sort form sits in a bare table of its own
    // under the list; named so it can take a card's gap.
    const sortForm = document.querySelector('#wrapcentre form[name="sortmsg"]');
    const sortTable = sortForm && sortForm.closest("table");
    if (sortTable && !sortTable.matches(".tablebg, .forumline")) sortTable.setAttribute("data-rr-sortfoot", "");

    dedupeSearchBoxes();
    tidyLinkStrips();
    dropBrokenImages();

    // A PM's signature divider is a run of underscores in the body (no signature
    // node like a post has). Posts are left alone — there it's already a rule, not text.
    if (!PAGE.isTopic) {
        for (const body of document.querySelectorAll("#wrapcentre .postbody")) replaceUnderscoreRules(body);
    }

    // Before the page-kind gate — the member list, message folders and control panel
    // are none of those kinds and need this too.
    tightenDateCells();
    localiseRankCells();
    dropLonePageCounters();
    alignMessageMarkers();

    if (!PAGE.isForum && !PAGE.isIndex && !PAGE.isSearch) return;

    // Before topic rows are looked for — the index has none (it lists forums), so
    // this ran only on the forum page, leaving the same Last-post column one line
    // there and two lines on the index in front of it.
    for (const cell of document.querySelectorAll('td[data-rr-col="last"]')) tightenLastPost(cell);

    const entries = topicRows();
    if (!entries.length) return;

    if (PAGE.isForum || PAGE.isSearch) buildForumBar();

    const visited = settings.get("hideVisited") ? visitedSet() : null;
    const seenPrefixes = new Map();
    const unreadRouting = settings.get("unreadFromList") && !PAGE.isSearch && isLoggedIn();

    // Prefix becomes a clickable chip only when there are filter chips for it to drive.
    const filtering = settings.get("listFilter") && entries.length >= FILTER_MIN_ROWS;

    let setTag = () => {};
    for (const entry of entries) {
        // Read once, here: the chip that filters on it and the routing
        // below both want the answer and it does not change.
        entry.unread = rowIsUnread(entry.row);
        if (settings.get("prefixTags")) {
            const { prefix, kind } = splitPrefix(entry.title);
            const applied = decorateTitle(entry, filtering ? (value) => setTag(value) : null);
            if (applied && prefix) seenPrefixes.set(prefix, kind);
        }
        if (settings.get("bookmarks") && entry.id) addBookmarkStar(entry);
        if (unreadRouting) retargetToUnread(entry);
        if (visited && entry.id && visited.has(entry.id)) {
            entry.row.setAttribute("data-rr-visited", "1");
        }
    }

    if (settings.get("listFilter")) {
        const prefixes = Array.from(seenPrefixes.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(0, 8);
        const toolbar = buildToolbar(entries, prefixes, filtering);
        setTag = toolbar.setTag;

        // Action bar and filter bar merge into one (was 123px of chrome as two
        // stacked cards) — done in JS since they aren't siblings in the template.
        // An empty bar is never placed at all.
        const actions = document.querySelector(".rr-topicbar");
        if (toolbar.empty) {
            /* nothing to place */
        } else if (actions) {
            actions.append(toolbar.bar);
        } else {
            const table = entries[0].row.closest("table.tablebg");
            if (table) table.before(toolbar.bar);
        }
    }
}

// Sort strip's label+select pairs are flat siblings separated only by a space, which
// wraps like any other space — "Sort by:" broke onto its own line on a phone. Each
// label and its controls up to the next label are grouped into one span so a wrap
// only ever falls between pairs.
function groupSortControls() {
    for (const label of document.querySelectorAll(
        '#wrapcentre td.cat[data-rr-cat="controls"] span.gensmall, #wrapcentre form[name="sortmsg"] span.gensmall',
    )) {
        const group = el("span.rr-ctrl-group");
        label.before(group);
        group.append(label);
        let next = group.nextSibling;
        while (next && !(next.nodeType === 1
            && (next.matches("span.gensmall") || next.matches('input[type="submit"], input[type="button"]')))) {
            const node = next;
            next = next.nextSibling;
            // Template's &nbsp;/spaces are dropped — the group's own gap replaces
            // them (left in, they'd become empty flex items).
            if (node.nodeType === 3 && !node.textContent.trim()) { node.remove(); continue; }
            group.append(node);
        }
    }
}

/* ================= src/modules/boardindex.js ================= */
/* The board index: an online list of 500-odd names and a login form,
   both folded to a glance with the full version one click away. */

/** "In total there are 513 users online :: 326 registered, ..." */
function onlineSummary(text, names) {
    const total = text.match(/there are\s+(\d+)\s+users? online|всего\s+(\d+)\s+пользовател/i);
    const registered = text.match(/(\d+)\s+(?:registered|зарегистрированн)/i);
    const guests = text.match(/(\d+)\s+(?:guests?|гост)/i);
    const hidden = text.match(/(\d+)\s+(?:hidden|скрыт)/i);

    const parts = [];
    if (total) parts.push(t("{n} online", { n: total[1] || total[2] }));
    else if (names) parts.push(t("{n} browsing", { n: names }));   // a forum or topic foot: "Users browsing this forum: …"
    if (registered) parts.push(t("{n} registered", { n: registered[1] }));
    if (hidden) parts.push(t("{n} hidden", { n: hidden[1] }));
    if (guests) parts.push(t("{n} guests", { n: guests[1] }));
    return parts.join(" · ");
}

/** Found by content (30+ profile links), not the "Who is online" heading —
 *  that text differs on the Russian half and silently broke this before. */
function whoIsOnlineCell() {
    let best = null;
    let most = 0;
    for (const cell of document.querySelectorAll("#wrapcentre td.row1, #wrapcentre td.row2")) {
        // Skip the forum listing: a row there has at most a couple of profile links.
        if (cell.querySelector("a.forumlink, a.topictitle")) continue;
        const count = cell.querySelectorAll("a[href*='viewprofile']").length;
        if (count > most) { most = count; best = cell; }
    }
    return most >= 30 ? best : null;
}

function collapseWhoIsOnline(body) {
    const names = body.querySelectorAll("a[href*='viewprofile']");
    const summary = onlineSummary(body.textContent, names.length);

    // Moved, not rebuilt, so each name keeps its link, colour and listeners.
    const holder = el("div");
    while (body.firstChild) holder.append(body.firstChild);

    let open = store.get("whoIsOnlineOpen", false);
    holder.hidden = !open;

    const label = () => (open ? t("Hide the list") : t("Show all {n} names", { n: names.length }));
    const toggle = el("button.rr-btn", {
        type: "button",
        "data-variant": "quiet",
        "aria-expanded": open ? "true" : "false",
    }, [icon("chevronD"), label()]);

    toggle.addEventListener("click", () => {
        open = !open;
        holder.hidden = !open;
        toggle.lastChild.textContent = label();
        toggle.firstChild.style.transform = open ? "rotate(180deg)" : "";
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        store.set("whoIsOnlineOpen", open);
    });

    body.append(
        el("div.rr-online", {}, [
            el("span.rr-online__summary", {}, [summary || names.length + " people online"]),
            toggle,
        ]),
        holder,
    );
}

/** The index has this search box twice; with the top bar's search both are
 *  redundant, without it the first one stays. */
function dropDuplicateSearch() {
    const boxes = Array.from(document.querySelectorAll("#wrapcentre #search-box"));
    const keepFirst = !settings.get("navbar");

    boxes.forEach((box, index) => {
        if (keepFirst && index === 0) return;
        const strip = box.closest("table.tablebg");
        if (strip && !strip.querySelector("a.forumlink, a.topictitle")) strip.style.display = "none";
    });
}

/** The board's native toggle is an unlabeled 12x12 background-image button
 *  far from its heading and can't be restyled (replaced element, its own
 *  <style> wins) — so it's hidden and driven via its ccopen/ccclose class,
 *  with a chevron by the heading and the whole cell clickable instead. */
function tidyCategoryToggles() {
    for (const native of document.querySelectorAll("#wrapcentre .ccclose, #wrapcentre .ccopen")) {
        if (native.hasAttribute("data-rr-cc")) continue;
        native.setAttribute("data-rr-cc", "");

        // The heading lives in a sibling cell, so walk up to the row to reach it.
        const row = native.closest("tr");
        const cell = row && row.querySelector("td.cat");
        if (!cell) continue;
        const heading = cell.textContent.replace(/\s+/g, " ").trim().slice(0, 60);

        native.style.display = "none";

        const fold = el("button.rr-catfold", { type: "button" }, [icon("chevronD", 13)]);
        const sync = () => {
            const collapsed = native.classList.contains("ccopen");
            const name = t(collapsed ? "Show " : "Hide ") + (heading || t("this category"));
            row.toggleAttribute("data-rr-folded", collapsed);
            fold.setAttribute("aria-expanded", collapsed ? "false" : "true");
            fold.setAttribute("title", name);
            fold.setAttribute("aria-label", name);
        };
        // The board's handler swaps the class but fires no event, so re-read it after.
        const flip = () => {
            native.click();
            setTimeout(sync, 0);
        };

        fold.addEventListener("click", flip);
        // The heading text is still a link to its own page; only the rest of the cell folds.
        cell.addEventListener("click", (event) => {
            if (event.target instanceof Element && event.target.closest("a, input, select, button")) return;
            flip();
        });

        cell.classList.add("rr-catfold-cell");
        cell.prepend(fold);
        sync();
    }
}

function initBoardIndex() {
    // The same online-users list ends every forum and topic page too.
    const online = whoIsOnlineCell();
    if (online && settings.get("foldWhoIsOnline")) collapseWhoIsOnline(online);
    if (!PAGE.isIndex) return;
    dropDuplicateSearch();
    tidyCategoryToggles();
}

/* ================= src/modules/topic.js ================= */
/* A game thread opens with a Steam dump, thousands of words before the
   first reply. The card below keeps the details, folds the marketing
   copy, and puts SteamDB/PCGamingWiki one click away. */

const REPLY_LINK = 'a[href*="mode=reply"], a[href*="mode=post"]';

const HISTORY_LIMIT = 100; // palette's Recent list; was a setting, nobody tunes it

const EXTERNAL_LOOKUPS = [
    { id: "steamdb", label: "SteamDB", url: (appId) => "https://steamdb.info/app/" + appId + "/" },
    { id: "store", label: "Store page", url: (appId) => "https://store.steampowered.com/app/" + appId + "/" },
    { id: "charts", label: "SteamCharts", url: (appId) => "https://steamcharts.com/app/" + appId },
    { id: "protondb", label: "ProtonDB", url: (appId) => "https://www.protondb.com/app/" + appId },
];

function buildGameCard(info, body) {
    const card = el("section.rr-game", { "aria-label": "Game details" });

    if (info.header) {
        card.append(el("img.rr-game__art", {
            src: info.header,
            alt: "",
            loading: "lazy",
            referrerpolicy: "no-referrer",
        }));
    }

    const title = info.title || topicTitle() || "Game";

    const bodyCol = el("div.rr-game__body", {}, [
        el("h2.rr-game__title", {}, [title]),
    ]);

    if (info.appId) {
        bodyCol.append(el("div.rr-game__appid", {}, ["AppID " + info.appId]));
    }

    const wanted = ["Developer", "Publisher", "Release Date", "Genre(s)", "Language(s)", "Version"];
    const list = el("dl.rr-game__meta");
    let rows = 0;
    for (const label of wanted) {
        const value = info.fields[label];
        if (!value || /please login/i.test(value)) continue;
        list.append(el("dt", {}, [label.replace("(s)", "s")]));
        list.append(el("dd", {}, [value.length > 220 ? value.slice(0, 217) + "…" : value]));
        rows += 1;
    }
    if (rows) bodyCol.append(list);

    if (info.appId) {
        const links = el("div.rr-game__links");
        for (const lookup of EXTERNAL_LOOKUPS) {
            links.append(el("a.rr-btn", {
                href: lookup.url(info.appId),
                target: "_blank",
                rel: "noopener noreferrer",
            }, [lookup.label, icon("external", 12)]));
        }
        links.append(el("a.rr-btn", {
            href: "https://www.pcgamingwiki.com/api/appid.php?appid=" + info.appId,
            target: "_blank",
            rel: "noopener noreferrer",
        }, ["PCGamingWiki", icon("external", 12)]));
        bodyCol.append(links);
    }

    // Guests cannot see the store link; say so rather than an empty row.
    const store = info.fields["Store Page"];
    if (store && /please login/i.test(store) && !info.appId) {
        bodyCol.append(el("p.rr-field__desc", {}, ["Log in to see the store link in the post below."]));
    }

    card.append(bodyCol);
    body.before(card);

    // Already shown in the card; hide the duplicate rather than remove it
    // (another script may still be looking for that node).
    if (info.header) {
        for (const img of body.querySelectorAll("img")) {
            if (img.getAttribute("src") === info.header) {
                const line = img.nextElementSibling;
                img.style.display = "none";
                if (line && line.tagName === "BR") line.style.display = "none";
                break;
            }
        }
    }
    return card;
}

// Rewrite the topic heading the way listing rows are, so the prefix
// reads as the same tag in both places.
function decorateHeading() {
    const heading = document.querySelector("#pageheader h2");
    if (!heading || heading.querySelector(".rr-tag")) return;

    const link = heading.querySelector("a.titles") || heading;
    const { prefix, kind, rest } = splitPrefix(link.textContent.trim());
    if (!prefix) return;

    const raw = link.textContent;
    const at = raw.indexOf(rest);
    if (rest && at > 0) stripLeading(link, at);
    else link.textContent = rest;
    heading.prepend(el("span.rr-tag", { "data-tag": kind, style: { cursor: "default" } }, [prefix]));
    // Kept: reading the title back off the heading would pick the tag up again.
    heading.dataset.rrTitle = rest;
}

/** The topic title without its prefix, whether or not it had one. */
function topicTitle() {
    const heading = document.querySelector("#pageheader h2");
    if (!heading) return "";
    if (heading.dataset.rrTitle) return heading.dataset.rrTitle;
    const link = heading.querySelector("a.titles");
    return splitPrefix((link || heading).textContent.trim()).rest;
}

/* One action bar, replacing the four strips the template scatters. Row
   assignment is fixed, not fit-based, so the bar is the same shape on a
   1-page and a 33-page thread: row 1 is this topic (reply, on-screen
   actions, where you are); row 2 is everywhere else (prev/next, print,
   search). A row nothing landed in is not drawn. */
function topicBarRow(name) {
    return el("div.rr-topicbar__row", { "data-rr-row": name });
}

// `.rr-cluster > * + *` for the hairlines would end in a universal
// selector the engine tests against every element (measured 30ms on a
// big listing); a class costs nothing to match, so children get one.
function sealCluster(node) {
    for (const child of node.children) child.classList.add("rr-cluster__item");
    return node;
}

function buildTopicBar() {
    const header = document.querySelector("#pageheader");
    if (!header || header.querySelector(".rr-topicbar")) return;

    const bar = el("div.rr-topicbar", { "data-rr-rows": "" });
    const info = pagination();

    const here = topicBarRow("here");
    const away = topicBarRow("away");
    bar.append(here, away);

    const reply = document.querySelector(REPLY_LINK);
    if (reply) {
        const button = el("a.rr-btn", { href: reply.getAttribute("href"), "data-variant": "primary" }, [
            icon("reply", 13),
            t(/mode=post/.test(reply.getAttribute("href")) ? "New topic" : "Reply"),
        ]);
        here.append(button);
        // Hide the *cell*, not the table: subsilver2 packs the reply
        // button, the pager and the member's topic actions into one row
        // of one table, so hiding the table silently ate Unsubscribe/
        // Bookmark/E-mail too (members-only, which is why it went unnoticed).
        const cell = reply.closest("td");
        if (cell) cell.style.display = "none";
        else {
            const strip = reply.closest("table");
            if (strip) strip.style.display = "none";
        }
    }

    // Drawn as secondary — "Open all N spoilers" is not as loud as Reply.
    if (settings.get("spoilerAll")) {
        const inputs = spoilerInputs();
        if (inputs.length >= 2) {
            // Toggles rather than removing itself on press (that used to
            // take focus with it, leaving 30 open spoilers stuck open).
            // State is read off the page: if spoilers opened at load, it
            // starts as "close".
            const count = inputs.length;
            let open = spoilerInputs("hide").length === count;
            const control = el("button.rr-btn.rr-fold", { type: "button", "data-variant": "quiet" });
            const relabel = () => {
                control.replaceChildren(icon("chevronD", 13), t(open ? "Close all {n} spoilers" : "Open all {n} spoilers", { n: count }));
                control.setAttribute("aria-expanded", open ? "true" : "false");
                control.toggleAttribute("data-rr-open", open);
            };
            relabel();
            control.addEventListener("click", () => {
                for (const input of spoilerInputs(open ? "hide" : "show")) input.click();
                open = !open;
                relabel();
            });
            here.append(control);
        }
    }

    // The board's own "First unread post" (members only); people.js
    // builds its own version only when this one isn't found, so this
    // must be found. Descendant selector, not child: icons.js wraps the
    // link in a span.rr-linkrow first, so `td.nav > a` matched fixtures
    // but never the live board, leaving an empty strip and a duplicate.
    const unread = document.querySelector('#wrapcentre td.nav a[href*="view=unread"]');
    if (unread) {
        const cell = unread.closest("td");
        unread.classList.add("rr-btn");
        unread.setAttribute("data-variant", "quiet");
        unread.setAttribute("title", "Jump to the first post you have not read");
        unread.textContent = "";
        unread.append(icon("arrowDown", 13), "First unread");
        here.append(unread);
        if (cell) cell.style.display = "none";
    }

    // people.js drops "First unread" in here, in front of this.
    here.append(el("span.rr-topicbar__spacer"));

    // Not drawn on a 1-page topic: "Page 1 of 1" answers nothing.
    if (info.total && info.total > 1) {
        here.append(settings.get("quickPager")
            ? buildPagerGroup(info)
            : el("span.rr-topicbar__count", {}, [t("Page {a} of {b}", { a: info.current, b: info.total })]));
    }

    // Two clusters (where to go next / what a member can do here), not
    // six loose words, so the row reads as two things.
    const nav = el("div.rr-cluster.rr-topicbar__cluster");
    adoptTopicNav(nav);
    const member = el("div.rr-cluster.rr-topicbar__cluster");
    adoptMemberActions(member);
    for (const cluster of [nav, member]) if (cluster.children.length) away.append(sealCluster(cluster));
    away.append(el("span.rr-topicbar__spacer"));

    const form = document.querySelector("#topic-search, #search-box form");
    if (form) {
        const strip = form.closest("table.tablebg");
        away.append(el("div.rr-topicbar__search", {}, [adoptBoardSearch(form)]));
        // What is left of that strip is the breadcrumb, which the top
        // bar already carries.
        if (strip) strip.style.display = "none";
    }

    // A row nothing landed in but its own spacer is not drawn.
    for (const row of [here, away]) {
        if (!row.querySelector(":scope > :not(.rr-topicbar__spacer)")) row.remove();
    }

    header.after(bar);
    // Before the strips are tidied, so a strip this empties is one of
    // the empty ones hideEmptyBoardStrips() then takes away.
    dropPagerAbovePosts();
    tidyBoardPagerStrip(bar, here);
}

// Hides the board's "Go to page…" strip above the posts (the bar's own
// pager already says it); the copy under the posts stays for a reader
// who scrolled to the end. Two shapes carry it: a p.gensmall under the
// title, and the board strip's right-hand cell.
function dropPagerAbovePosts() {
    if (!settings.get("quickPager")) return;
    const first = posts()[0];
    const strips = document.querySelectorAll(
        "#wrapcentre p.gensmall, #wrapcentre span.gensmall, #wrapcentre td.gensmall");
    for (const strip of strips) {
        if (!/^\s*(?:Go to page|На страницу)/.test(strip.textContent)) continue;
        if (first && !(strip.compareDocumentPosition(first.table) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
        strip.style.display = "none";
    }
}

// phpBB repeats "Page 16 of 16" and "[ 239 posts ]" above and below the
// posts; the bar's pager already covers the first. Cell by cell, not
// strip by strip, because the member's own topic actions share that row.
// The post count is worth keeping — the first one found moves into the bar.
const PAGE_OF_RE = /^\s*(?:Page\s+\d+\s+of\s+\d+|Страница\s+\d+\s+из\s+\d+)\s*$/;
// Russian interface: "[ Сообщений: 239 ]" / "[ Тем: 61487 ]", word first.
const POST_COUNT_RE = /^\s*\[\s*(?:([\d\s]+)\s+(posts?|topics?)|(Сообщений|Тем):\s*([\d\s]+))\s*\]\s*$/i;

function postCount(text) {
    const m = text.match(POST_COUNT_RE);
    if (!m) return null;
    const digits = (m[1] || m[4]).replace(/\s+/g, "");
    const unit = (m[2] || m[3]).toLowerCase();
    return digits + " " + (unit === "сообщений" ? "сообщений" : unit === "тем" ? "тем" : unit);
}

function tidyBoardPagerStrip(bar, row) {
    // Start "already counted" if the listing bar lifted its own count
    // first — else the strip's second copy doubles it: "841 topics 841 topics".
    let counted = Boolean(bar.querySelector(".rr-topicbar__count"));

    for (const cell of document.querySelectorAll("#wrapcentre td.nav, #wrapcentre td.gensmall")) {
        if (cell.querySelector("a[href], form, input, select")) continue;
        const text = cell.textContent.replace(/\s+/g, " ");

        if (PAGE_OF_RE.test(text)) { cell.style.display = "none"; continue; }

        const count = postCount(text);
        if (!count) continue;
        if (!counted) {
            counted = true;
            row.append(el("span.rr-topicbar__count", {}, [count]));
        }
        cell.style.display = "none";
    }

    hideEmptyBoardStrips(bar);
}

// A cell inside a cell hidden by the emptying above is as gone as its parent.
function hiddenWithin(node, root) {
    for (let n = node; n && n !== root; n = n.parentElement) {
        if (n.style && n.style.display === "none") return true;
    }
    return false;
}

// A row with every cell hidden is still a 20px band with a border.
// textContent sees through display:none (a hidden "|" separator counted
// as life), so only the not-hidden text counts.
function boardStrips() {
    const out = new Set(document.querySelectorAll("#wrapcentre table.tablebg"));
    // The "First unread post" strip is a classless bare table, missed by
    // table.tablebg — a board strip by what it holds, not what it's called.
    for (const cell of document.querySelectorAll("#wrapcentre td.nav")) {
        const table = cell.closest("table");
        if (table && !table.querySelector(".postbody")) out.add(table);
    }
    return out;
}

function hideEmptyBoardStrips(bar) {
    for (const strip of boardStrips()) {
        if (bar && strip.contains(bar)) continue;
        if (strip.querySelector(".postbody, .rr-releases, form")) continue;
        const cells = Array.from(strip.querySelectorAll("td"));
        if (!cells.length) continue;
        const alive = cells.some((cell) => {
            if (hiddenWithin(cell, strip)) return false;
            const own = Array.from(cell.childNodes)
                .filter((n) => n.nodeType === 3).map((n) => n.textContent).join("")
                .replace(/[\s\u00a0|]+/g, "");
            if (own) return true;
            return Array.from(cell.querySelectorAll("img, a, input, select, button"))
                .some((node) => !hiddenWithin(node, strip));
        });
        if (!alive) strip.style.display = "none";
    }
}

// "Previous topic"/"Subscribe topic"/"E-mail friend" repeat their noun;
// mark it optional so narrow layout can drop it to "Previous · Next · Subscribe".
function labelWithOptionalTail(link, label) {
    const m = label.match(/^(.*\S)(\s+(?:topic|friend|тема|другу))$/i);
    link.textContent = "";
    // A word space, not a 6px flex gap — the noun keeps its own space.
    if (m) link.append(document.createTextNode(m[1]), el("span.rr-opt", {}, [m[2]]));
    else link.append(document.createTextNode(label));
}

// Print view, Previous topic, Next topic: pulled out of the template's
// own 40px-tall bar and joined with the other topic actions; that strip
// then goes if left empty.
function adoptTopicNav(bar) {
    const strip = Array.from(document.querySelectorAll("#wrapcentre table.tablebg"))
        .find((table) => table.querySelector('td.cat a[href*="view=print"], td.cat a[href*="view=next"]'));
    if (!strip) return;

    const wanted = [
        { match: /view=previous/, label: "Previous topic" },
        { match: /view=next/, label: "Next topic" },
        { match: /view=print/, label: "Print view", glyph: "external" }, // the one that really leaves the page
    ];

    for (const { match, label, glyph } of wanted) {
        const link = Array.from(strip.querySelectorAll("a[href]"))
            .find((a) => match.test(a.getAttribute("href") || ""));
        if (!link) continue;
        link.classList.add("rr-btn", "rr-topicnav");
        link.setAttribute("data-variant", "quiet");
        const shown = t(label);
        link.setAttribute("title", shown);
        labelWithOptionalTail(link, shown);
        if (glyph) link.append(icon(glyph, 12));
        bar.append(link);
    }

    if (!strip.querySelector("a[href], form, input")) strip.style.display = "none";
}

// Subscribe/Bookmark/E-mail friend: members-only, printed twice by
// subsilver2 (the reply strip and again under the posts — buildTopicBar
// hides that strip's cells precisely so these survive). Joined once here
// with the board's own wording ("Unsubscribe topic" when already watching).
const MEMBER_ACTION = 'a[href*="watch=topic"], a[href*="bookmark="], a[href*="mode=email"]';

function adoptMemberActions(bar) {
    // td.nav on the live board, td.gensmall in the strip's other shape.
    const cells = Array.from(document.querySelectorAll("#wrapcentre td.nav, #wrapcentre td.gensmall"))
        .filter((cell) => cell.querySelector(MEMBER_ACTION) && !cell.closest(".rr-topicbar"));
    if (!cells.length) return;

    for (const link of cells[0].querySelectorAll(MEMBER_ACTION)) {
        const label = link.textContent.replace(/\s+/g, " ").trim() || link.getAttribute("title") || "";
        if (!label) continue;
        link.classList.add("rr-btn", "rr-topicnav");
        link.setAttribute("data-variant", "quiet");
        link.setAttribute("title", label);
        labelWithOptionalTail(link, label);
        bar.append(link);
    }
    for (const cell of cells) cell.style.display = "none";
}

function buildPagerGroup(info) {
    const jump = el("input.rr-pager__input", {
        type: "number",
        min: "1",
        max: String(info.total),
        value: String(info.current),
        "aria-label": t("Go to page"),
    });
    const go = () => {
        const target = clamp(parseInt(jump.value, 10) || 1, 1, info.total);
        const href = pageHref(target);
        if (href) location.href = href;
        else toast(t("Could not work out that page"));
    };
    jump.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); go(); } });
    jump.addEventListener("change", go);

    // "Next"/"Last" used to look identical to "Next topic"/"Previous
    // topic" — different rows now, plus these say what they move (a page).
    // The four steps + page box are one boxed control; the end arrows draw
    // unlabelled and name themselves on hover so "⇥" is never a guess.
    // `word` is what's drawn, `label` is the full name (title/aria).
    const step = (href, label, glyph, word) => {
        const link = el("a.rr-pager__step", { href }, glyph === "pageFirst" || glyph === "chevronL"
            ? [icon(glyph, 13), word || null]
            : [word || null, icon(glyph, 13)]);
        if (!word) return labelled(link, label);
        link.setAttribute("title", label);
        link.setAttribute("aria-label", label);
        return link;
    };

    return sealCluster(el("div.rr-pager.rr-cluster", { role: "group", "aria-label": t("Pages of this topic") }, [
        info.hasPrevious ? step(info.first, t("First page"), "pageFirst") : null,
        info.hasPrevious ? step(info.previous, t("Previous page"), "chevronL", t("Previous")) : null,
        el("span.rr-pager__where", {}, [
            el("span.rr-pager__label", {}, [t("Page")]),
            jump,
            el("span.rr-pager__label", {}, [t("of {n}", { n: info.total })]),
        ]),
        info.hasNext ? step(info.next, t("Next page"), "chevron", t("Next")) : null,
        info.hasNext ? step(info.last, t("Last page"), "pageLast") : null,
    ]));
}

/* ---- What a rank line says, and in which language ------------------ */

// The board prints both language halves of a rank on every page — "I
// live here Три раза сломал клаву :)", "Beginner Без звания" (Russian
// for "no rank") — so an English forum shows Russian under most names.
// Page language decides which half to keep; a Latin-only rank is left
// alone (not a translation of anything, and dropping it on the Russian
// interface would blank every administrator's rank). Original text
// stays on the title attribute.
const CYRILLIC_RE = /[\u0400-\u04FF]/;

function localiseRank(text) {
    const clean = text.replace(/\s+/g, " ").trim();
    const lang = currentLanguage();
    if (!CYRILLIC_RE.test(clean) || !lang) return clean;

    // On English the Russian words go, on Russian the Latin ones do. A
    // word with no letters of either kind (":)", "<3") sides with
    // whichever half stays.
    const LATIN_RE = /[A-Za-z]/;
    const kept = lang === "en"
        ? clean.split(" ").filter((word) => !CYRILLIC_RE.test(word))
        : clean.split(" ").filter((word) => !LATIN_RE.test(word) || CYRILLIC_RE.test(word));
    // Trailing punctuation belonging to the half just dropped (e.g. a
    // smiley on the end of the Russian half) goes with it. A rank that
    // is only punctuation never reaches here — no Cyrillic, returned above.
    while (kept.length && !/[A-Za-z0-9\u0400-\u04FF]/.test(kept[kept.length - 1])) kept.pop();
    return kept.join(" ").replace(/[\s|·,;:/–—-]+$/, "").trim();
}

// "Joined: Thursday, 13 Feb 2020, 13:07 · Posts: 2180" doesn't fit its
// line; clipping put the ellipsis inside the time ("13 Feb 2020, 13:…").
// A join date has no use for a clock, so drop it — the line then fits
// without clipping at all.
const JOIN_TIME_RE = /(\d{4}),\s*\d{1,2}:\d{2}(?::\d{2})?/g;

function shortenPostMeta(text) {
    return text
        .replace(/(?:\b(?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day|Понедельник|Вторник|Среда|Четверг|Пятница|Суббота|Воскресенье),\s*/gi, "")
        .replace(JOIN_TIME_RE, "$1")
        // Group only the post count, not the year: a blind 4-digit group
        // would turn "2005" into "2 005".
        .replace(/((?:Posts|Сообщения):\s*)(\d+)/i, (all, label, count) => label + groupDigits(count))
        .replace(/\s+/g, " ")
        .trim();
}

// Rebuilds a post as a header strip over a full-width message, instead
// of the template's 150px author column that makes a two-line reply as
// tall as an avatar. Nodes are moved, not copied, so handlers survive;
// the original cell is hidden, not deleted.
function modernisePost(post) {
    const cell = post.table.querySelector("td.profile");
    if (!cell || cell.classList.contains("rr-profile")) return;
    cell.classList.add("rr-profile");

    const details = Array.from(cell.querySelectorAll(".postdetails"));
    const avatar = cell.querySelector('img[src*="avatar"], img[src*="file.php"]');

    // The first detail block is the rank line ("Administrator",
    // "I live here"); the ones after it are Joined and Posts.
    const META_RE = /joined|posts|зарегистрирован|сообщени/i;
    const rank = details.find((node) => !META_RE.test(node.textContent));
    const meta = details.filter((node) => META_RE.test(node.textContent));

    const head = el("div.rr-posthead");

    if (avatar) {
        avatar.classList.add("rr-posthead__avatar");
        avatar.removeAttribute("width");
        avatar.removeAttribute("height");
        head.append(avatar);
    }

    const identity = el("div.rr-posthead__who");
    if (post.author) {
        // The name is a <b> in the header row; a link to the profile is
        // more useful, when the template gives us one.
        const profileLink = cell.querySelector('a[href*="viewprofile"]')
            || post.table.querySelector('a[href*="viewprofile"]');
        const name = el("span.rr-posthead__name", {}, [post.author.textContent.trim()]);
        if (profileLink) {
            const wrapped = el("a", { href: profileLink.getAttribute("href") }, [name]);
            // Role colour is an inline style on the profile link.
            const colour = profileLink.style.color;
            if (colour) name.style.color = colour;
            identity.append(wrapped);
        } else {
            identity.append(name);
        }
    }
    if (rank) {
        const full = rank.textContent.replace(/\s+/g, " ").trim();
        const shown = localiseRank(full);
        if (shown) identity.append(el("span.rr-posthead__rank", { title: full }, [shown.slice(0, 60)]));
    }
    head.append(identity);

    if (meta.length) {
        // The template runs "Joined:...Posts: 2180Location: here"
        // together often enough to need separators put back before every label.
        const summary = meta
            .map((node) => node.textContent.replace(/\s+/g, " ").trim())
            .join(" · ")
            .replace(/(\S)\s*((?:Posts|Location|Gender|Age|Occupation|Interests|Website|Joined|Warnings|Rank|Сообщения|Откуда|Пол|Возраст|Род занятий|Интересы|Сайт|Зарегистрирован|Предупреждения):)/g, "$1 · $2");
        head.append(el("span.rr-posthead__meta", { title: summary }, [shortenPostMeta(summary)]));
    }

    head.append(el("span.rr-posthead__spacer"));

    // The posted date lives in its own row above the message; on one
    // line with the author it stops being a row of its own.
    if (post.headCell) {
        const posted = Array.from(post.headCell.querySelectorAll("b"))
            .find((node) => /^(?:Posted|Добавлено):/i.test(node.textContent));
        if (posted && posted.nextSibling) {
            const when = posted.nextSibling.textContent.trim();
            if (when) {
                // The weekday goes, as everywhere else; the full date
                // stays on the title.
                head.append(el("time.rr-posthead__date", { title: when }, [when.replace(WEEKDAY_RE, "")]));
                posted.parentElement.style.display = "none";
            }
        }
    }

    post.body.before(head);
    post.head = head;

    // The old header row (author, subject, date) is now empty padding.
    const originalRow = post.anchor.closest("tr");
    if (originalRow && !originalRow.querySelector(".postbody")) originalRow.style.display = "none";

    hideEmptyPostRows(post.table);
}

// subsilver2's edit/delete and "Top" rows are 90px of nothing for a
// reader without those permissions.
function hideEmptyPostRows(table) {
    for (const row of table.querySelectorAll("tr")) {
        if (row.querySelector(".postbody, .rr-posthead")) continue;
        if (row.querySelector("input, textarea, select")) continue;
        if (row.textContent.trim()) continue;
        row.style.display = "none";
    }
}

function foldSteamBlurb(body, fromTitle) {
    const start = fromTitle || steamBlurbStart(body);
    if (!start) return;

    const folded = [];
    let cursor = start;
    while (cursor) {
        const next = cursor.nextSibling;
        folded.push(cursor);
        cursor = next;
    }
    if (folded.length < 3) return;

    const holder = el("div");
    for (const node of folded) holder.append(node);

    // The original post starts open (it's what was actually written —
    // download notes, links, caveats); closing it is remembered. The
    // Steam description alone, with no card summarising it, starts folded.
    const label = t(fromTitle ? "the original post" : "the full Steam description");
    let open = fromTitle ? store.get("originalPostOpen", true) !== false : false;
    const toggle = el("button.rr-btn.rr-fold", { type: "button", "data-variant": "quiet" }, [
        icon("chevronD"),
        "",
    ]);
    const sync = () => {
        holder.hidden = !open;
        toggle.lastChild.textContent = t(open ? "Hide " : "Show ") + label;
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.toggleAttribute("data-rr-open", open);
    };
    toggle.addEventListener("click", () => {
        open = !open;
        sync();
        if (fromTitle) store.set("originalPostOpen", open);
    });
    sync();

    body.append(toggle, holder);
}

/* ---- Per-post tools ---------------------------------------------- */

function postUrl(postId) {
    return location.origin + location.pathname.replace(/[^/]*$/, "") +
        "viewtopic.php?p=" + postId + "#p" + postId;
}

// Fallback names for per-post controls, read off their href: icons.js
// names each from its image's alt text, which fails silently into a bare
// silhouette when the board ships an image without one.
const POST_CONTROL_NAMES = [
    { re: /mode=viewprofile/, label: "Profile" },
    { re: /[?&]i=pm|mode=post&[^"]*u=/, label: "Send private message" },
    { re: /mode=email/, label: "E-mail" },
    { re: /mode=report/, label: "Report this post" },
    { re: /mode=(?:edit|editpost)/, label: "Edit post" },
    { re: /mode=delete/, label: "Delete post" },
    { re: /mode=quote/, label: "Reply with quote" },
    { re: /[?&]p=\d+.*#p\d+$/, label: "Link to this post" },
];

/** Give a control a visible label, if it has not got one already. */
function nameControl(control) {
    if (control.querySelector(".rr-ctl__label") || control.textContent.trim()) return control;

    const href = control.getAttribute("href") || "";
    const known = POST_CONTROL_NAMES.find((entry) => entry.re.test(href));
    const label = known ? known.label
        : (control.getAttribute("title") || "").trim();
    if (!label) return control;

    control.setAttribute("title", label);
    control.append(el("span.rr-ctl__label", {}, [label]));
    return control;
}

// Named instantly, like the top bar's icons, rather than after hovering.
function labelPostTools(tools) {
    for (const control of tools.children) {
        if (control.classList.contains("rr-postnum")) continue;
        const name = (control.getAttribute("aria-label") || control.getAttribute("title") || "").trim();
        if (name) labelled(control, name);
        control.setAttribute("data-rr-tip-side", "above");
    }
}

function addPostTools(post, index) {
    if (!post.headCell) return;

    // "Post subject: Re: <the topic title>" is the default phpBB fills
    // in; it repeats the heading on every single post.
    for (const label of post.headCell.querySelectorAll("b")) {
        if (!/^Post subject:/i.test(label.textContent)) continue;
        const subject = (label.nextSibling && label.nextSibling.textContent || "").trim();
        if (/^Re:/i.test(subject) || !subject || subject === topicTitle()) {
            label.parentElement.style.display = "none";
        }
        break;
    }

    const tools = el("div.rr-posttools");

    // One control per destination: the board's own "Reply with quote"
    // and this row's icon used to both point at the same URL. Compared
    // with the session id stripped, since phpBB stamps a fresh one into
    // every link.
    const destinations = new Set();
    const wanted = (node) => {
        const href = (node.getAttribute("href") || "").replace(/[?&]sid=[a-f0-9]+/, "");
        if (!href) return true;
        if (destinations.has(href)) return false;
        destinations.add(href);
        return true;
    };

    // The board's own permalink icon labels itself "Post" (its alt
    // text) and goes exactly where the copy-link button beside it
    // copies — so the post number becomes the link instead, and the
    // board's control is hidden.
    const permalink = Array.from(post.table.querySelectorAll("a.rr-ctl")).find((control) => {
        const href = control.getAttribute("href") || "";
        return /[?&]p=\d+/.test(href) && /#p\d+$/.test(href);
    });
    if (permalink) permalink.style.display = "none";

    const numberLabel = "#" + (index + 1);
    const numberTitle = permalink
        ? "Post " + (index + 1) + " on this page — open it on its own"
        : "Post " + (index + 1) + " on this page";
    tools.append(permalink
        ? el("a.rr-postnum", { href: permalink.getAttribute("href"), title: numberTitle }, [numberLabel])
        : el("span.rr-postnum", { title: numberTitle }, [numberLabel]));

    const linkButton = labelled(
        el("button.rr-icon-btn", { type: "button" }, [icon("link")]), t("Copy link to this post"));
    linkButton.addEventListener("click", () => copyText(postUrl(post.id), "Post link copied"));
    tools.append(linkButton);

    // Every mirror in this post, one per line — a release post carries
    // 3-6 and queueing them meant opening each in turn.
    const own = ownContent(post.body);
    const mirrors = Array.from(own.querySelectorAll("a[href]"))
        .map((a) => a.getAttribute("href"))
        .filter((href) => href && isOffsite(href));
    const unique = mirrors.filter((href, at) => mirrors.indexOf(href) === at);
    if (unique.length > 1) {
        const linksButton = labelled(
            el("button.rr-icon-btn", { type: "button" }, [icon("layers")]),
            t("Copy every link in this post"));
        linksButton.addEventListener("click", () => {
            copyText(unique.map((href) => new URL(href, location.href).href).join("\n"),
                t(unique.length === 1 ? "{n} link copied" : "{n} links copied", { n: unique.length }));
        });
        tools.append(linksButton);
    }

    /* The archive password this post names, if it names one. */
    if (settings.get("finder")) {
        const password = passwordIn(own.textContent);
        if (password) {
            const chip = el("button.rr-pass", {
                type: "button",
                title: t("Copy the password"),
            }, [el("span.rr-pass__label", {}, [t("Password")]), el("code.rr-pass__value", {}, [password])]);
            chip.addEventListener("click", () => copyText(password, t("Password copied")));
            tools.append(chip);
        }
    }

    const quoteButton = labelled(
        el("button.rr-icon-btn", { type: "button" }, [icon("quote")]), t("Copy as a quote"));
    quoteButton.addEventListener("click", () => {
        const author = post.author ? post.author.textContent.trim() : "";
        const text = post.body.textContent.trim().replace(/\n{3,}/g, "\n\n");
        copyText("[quote=\"" + author + "\"]" + text + "[/quote]", "Quote copied");
    });
    tools.append(quoteButton);

    /* Deliberately not added when the board's own labelled control for
       the same URL is about to join the row below. */
    const replyLink = post.table.querySelector('a[href*="mode=quote"]');
    if (replyLink && !post.table.querySelector("a.rr-ctl[href*='mode=quote']")) {
        const reply = labelled(
            el("a.rr-icon-btn", { href: replyLink.getAttribute("href") }, [icon("reply")]),
            "Reply with quote");
        if (wanted(reply)) tools.append(reply);
    }

    // Controls the board drew as a bare GIF (relabelled by icons.js),
    // moved from their own footer strip into the other per-post actions.
    for (const control of post.table.querySelectorAll("a.rr-ctl")) {
        if (control === permalink) continue;
        const row = control.closest("tr");
        if (!wanted(control)) { control.style.display = "none"; continue; }
        tools.append(nameControl(control));
        if (row && !row.textContent.trim() && !row.querySelector("a[href], input")) {
            row.style.display = "none";
        }
    }

    // A bare-image control icons.js couldn't name from alt text — an
    // unnamed silhouette sat on the end of every post.
    for (const orphan of post.table.querySelectorAll("a > img.rr-legacy-img")) {
        const link = orphan.closest("a");
        if (!link || link.closest(".postbody") || link.closest(".rr-posttools")) continue;
        if (link.textContent.trim()) continue;
        link.classList.add("rr-ctl");
        nameControl(link);
        if (!link.querySelector(".rr-ctl__label")) continue;
        orphan.style.display = "none";
        tools.append(link);
    }

    const holder = post.head
        || post.headCell.querySelector('div[style*="right"]')
        || post.headCell;
    holder.append(tools);
    labelPostTools(tools);
}

/* ---- Where you stopped reading ------------------------------------ */

// phpBB marks unread only in listings, never inline in a thread. This
// draws the mail-client-style divider from what was newest last visit.
function markNewSince(all, seen) {
    if (!seen || !seen.lastPost || !seen.at) return;
    const fresh = all.find((post) => (Number(post.id) || 0) > seen.lastPost);
    if (!fresh || fresh === all[0]) return;
    // The board's language, not the browser's.
    const locale = /^ru/i.test(document.documentElement.lang || "") ? "ru-RU" : "en-GB";
    const when = new Date(seen.at);
    const label = Number.isFinite(when.getTime())
        ? t("New since {when}", { when: when.toLocaleDateString(locale, { day: "numeric", month: "short" }) })
        : t("New since your last visit");
    const rule = el("div.rr-since", { role: "separator", "aria-label": label }, [
        el("span.rr-since__label", {}, [label]),
    ]);
    fresh.table.before(rule);
}

/* The page this topic was left on. A forty page thread opens at page
   one however far in you were, and the board's own "first unread"
   needs an account. */
function offerResume(seen) {
    const here = pagination();
    if (!seen || !seen.page || !here.total || here.total < 2) return;
    if (seen.page === here.current || seen.page > here.total) return;
    const href = pageHref(seen.page);
    if (!href) return;
    const row = document.querySelector('.rr-topicbar__row[data-rr-row="here"]');
    if (!row) return;
    const link = el("a.rr-btn.rr-resume", {
        href,
        "data-variant": "quiet",
        title: t("You were reading page {n} of this topic", { n: seen.page }),
    }, [icon("clock", 13), t("Back to page {n}", { n: seen.page })]);
    const spacer = row.querySelector(".rr-topicbar__spacer");
    if (spacer) spacer.before(link);
    else row.append(link);
}

/* ---- Signatures --------------------------------------------------- */

// A private message keeps the board's underscore-run signature divider
// (collapseSignature drops it on posts, where the signature is its own
// node); turn any leftover run into the script's own rule.
function replaceUnderscoreRules(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const found = [];
    let node;
    while ((node = walker.nextNode())) {
        if (/^\s*_{5,}\s*$/.test(node.textContent)) found.push(node);
    }
    for (const text of found) {
        const rule = el("hr.rr-rule");
        text.replaceWith(rule);
        // The <br> the template puts on either side of it would leave
        // the rule floating in a band of its own.
        for (const side of ["previousSibling", "nextSibling"]) {
            const sibling = rule[side];
            if (sibling && sibling.nodeType === 1 && sibling.tagName === "BR") sibling.remove();
        }
    }
}


function collapseSignature(post) {
    if (!post.signature) return;

    // Every signature is styled the same (muted, a rule not underscores);
    // a short one used to be left untouched, so two posts in a row differed.
    post.signature.classList.add("rr-signature");
    for (const node of Array.from(post.signature.childNodes).slice(0, 3)) {
        if (node.nodeType === 3 && /^\s*_{5,}\s*$/.test(node.textContent)) node.remove();
        else if (node.nodeType === 1 && node.tagName === "BR" && !post.signature.textContent.trim()) node.remove();
    }

    // One text node broken by <br>, so <br> count + length is the
    // length signal, not newlines. Only a long one is folded.
    const breaks = post.signature.querySelectorAll("br").length;
    const length = post.signature.textContent.trim().length;
    if (breaks <= 4 && length <= 220) return;

    post.signature.setAttribute("data-rr-sig", "collapsed");
    const toggle = el("button.rr-sig-toggle", { type: "button" }, [t("Show signature")]);
    toggle.addEventListener("click", () => {
        const collapsed = post.signature.getAttribute("data-rr-sig") === "collapsed";
        if (collapsed) post.signature.removeAttribute("data-rr-sig");
        else post.signature.setAttribute("data-rr-sig", "collapsed");
        toggle.textContent = t(collapsed ? "Hide signature" : "Show signature");
    });
    post.signature.before(toggle);
}

/* ---- Spoilers ----------------------------------------------------- */

// Spoilers toggle via the board's own inline-onclick Show/Hide button,
// so this clicks that button rather than reimplementing the toggle.
function spoilerInputs(saying) {
    const all = Array.from(document.querySelectorAll('.spoiler input[type="button"]'))
        .filter((input) => /^(?:show|hide)$/i.test((input.value || "").trim()));
    if (!saying) return all;
    return all.filter((input) => (input.value || "").trim().toLowerCase() === saying);
}

// A release post hides mirrors, password and notes behind several
// spoilers; open them all at load via the board's own handler (so
// buttons still say Hide and still work) — the bar's "Close all" undoes it.
function openSpoilersAtLoad() {
    for (const input of spoilerInputs("show")) input.click();
}

// The board's spoiler buttons carry an inline `font-size: 10px`, missed
// by sweeps that check td/p/span/a but not input, and the board's own
// injected <style> beats a stylesheet rule — only an inline style here wins.
function liftSpoilerButtons() {
    for (const input of document.querySelectorAll('.spoiler input[type="button"]')) {
        input.style.fontSize = "var(--rr-fs-xs)";
        input.style.width = "auto";
        input.style.padding = "2px 8px";
    }
}

/* ---- Images -------------------------------------------------------- */

function initLightbox() {
    document.addEventListener("click", (event) => {
        const img = event.target;
        if (!(img instanceof HTMLImageElement)) return;
        if (!img.closest(".postbody") && !img.closest(".rr-game")) return;
        if (img.closest("a")) return;                  // a linked image keeps its link
        if (img.naturalWidth < 200) return;            // icons and smilies

        event.preventDefault();
        event.stopPropagation();

        const previous = document.activeElement;

        // Other pictures in the same post join the gallery — a repack's
        // screenshots used to mean closing the box between each.
        const holder = img.closest(".postbody, .rr-game") || document;
        const gallery = Array.from(holder.querySelectorAll("img")).filter((node) => {
            if (node.closest("a")) return false;
            return node === img || node.naturalWidth >= 200;
        });
        let at = Math.max(0, gallery.indexOf(img));

        const shown = el("img", { src: img.currentSrc || img.src, alt: img.alt || "" });
        const closeButton = el("button.rr-icon-btn.rr-lightbox__close", {
            type: "button",
            "aria-label": t("Close the image"),
        }, [icon("close")]);
        const counter = el("span.rr-lightbox__count");
        const back = el("button.rr-icon-btn.rr-lightbox__step", {
            type: "button", "aria-label": t("Previous image"),
        }, [icon("chevronL")]);
        const forward = el("button.rr-icon-btn.rr-lightbox__step.rr-lightbox__step--next", {
            type: "button", "aria-label": t("Next image"),
        }, [icon("chevron")]);
        const show = (index) => {
            at = (index + gallery.length) % gallery.length;
            const next = gallery[at];
            shown.src = next.currentSrc || next.src;
            shown.alt = next.alt || "";
            counter.textContent = (at + 1) + " / " + gallery.length;
        };

        const box = el("div.rr-lightbox", {
            role: "dialog",
            "aria-modal": "true",
            "aria-label": img.alt || t("Image"),
            tabindex: "-1",
        }, [shown, closeButton]);
        if (gallery.length > 1) {
            box.append(back, forward, counter);
            show(at);
        }

        let release = () => {};
        const close = () => { box.remove(); document.removeEventListener("keydown", onKey); release(); };
        const onKey = (e) => {
            if (e.key === "Escape") close();
            else if (gallery.length > 1 && e.key === "ArrowRight") { e.preventDefault(); show(at + 1); }
            else if (gallery.length > 1 && e.key === "ArrowLeft") { e.preventDefault(); show(at - 1); }
        };
        // A click on the picture or a control is not a click on the way
        // out; everything else closes it, as it did before.
        box.addEventListener("click", (e) => { if (e.target === box) close(); });
        shown.addEventListener("click", () => { if (gallery.length > 1) show(at + 1); else close(); });
        back.addEventListener("click", () => show(at - 1));
        forward.addEventListener("click", () => show(at + 1));
        document.addEventListener("keydown", onKey);
        document.body.append(box);
        release = trapFocus(box, previous instanceof HTMLElement ? previous : null);
        closeButton.focus();
    }, true);
}

/* ---- Off-site links ------------------------------------------------ */

function markExternalLinks() {
    const here = location.hostname;
    const confirmFirst = settings.get("confirmExternal");
    for (const link of document.querySelectorAll(".postbody a[href^='http']")) {
        let host;
        try { host = new URL(link.href).hostname; } catch { continue; }
        if (host === here || host.endsWith(".rin.ru")) continue;
        if (link.querySelector(".rr-host")) continue;
        // With this setting on, an off-site link asks first and shows
        // the whole address, which a disguised link otherwise never does.
        if (confirmFirst && !link.rrConfirms) {
            link.rrConfirms = true;
            link.addEventListener("click", (event) => {
                if (event.defaultPrevented) return;
                if (!window.confirm(t("Leave the forum for this address?") + "\n\n" + link.href)) event.preventDefault();
            });
        }
        // "https://store.steampowered.com/app/… store.steampowered.com":
        // a link whose text is the address already says where it goes.
        if (link.textContent.toLowerCase().includes(host.replace(/^www\./, "").toLowerCase())) continue;

        link.append(el("span.rr-host", {}, [host.replace(/^www\./, "")]));
        link.setAttribute("rel", "noopener noreferrer");
    }
}

/* ---- Landing on a post ---------------------------------------------- */

// #p123456 anchors to an <a name> in the author cell, which the modern
// layout hides — a browser can't scroll to an undrawn node, so the post's
// own table also carries the id. That fixes *where* the anchor is; the
// fragment is also honoured during parsing, before the bars/card are
// inserted above the posts, so scrolling is redone once they've landed.
function fragmentTarget(hash) {
    let name;
    try { name = decodeURIComponent((hash || "").replace(/^#/, "")); } catch { return null; }
    if (!/^(?:p\d+|unread|top)$/.test(name)) return null;
    const node = document.getElementById(name) || document.querySelector('a[name="' + name + '"]');
    if (!node) return null;
    return node.closest("table.tablebg") || node;
}

function landOn(target, smooth) {
    target.scrollIntoView({ block: "start", behavior: smooth ? scrollBehaviour() : "auto" });
    if (target.matches("table.tablebg")) flash(target);
}

/** Does this link point at a post on the page in front of us? */
function inPageTarget(link) {
    let url;
    try { url = new URL(link.getAttribute("href") || "", location.href); } catch { return null; }
    if (!url.hash || url.origin !== location.origin) return null;
    const target = fragmentTarget(url.hash);
    if (!target) return null;
    const strip = (u) => u.pathname + u.search.replace(/[?&]sid=[a-f0-9]+/g, "");
    if (strip(url) === strip(new URL(location.href))) return target;
    // viewtopic.php?p=123#p123 names the post rather than the page,
    // and the post is here.
    if (/viewtopic\.php$/.test(url.pathname) && /^#p\d+$/.test(url.hash)
        && url.searchParams.get("p") === url.hash.slice(2)) return target;
    return null;
}

function settleFragment() {
    if (!PAGE.isTopic) return;
    for (const post of posts()) {
        if (!document.getElementById("p" + post.id)) post.table.id = "p" + post.id;
    }

    const target = fragmentTarget(location.hash);
    let settled = null;
    if (target) {
        landOn(target, false);
        settled = window.scrollY;
    }
    // Images arriving above the post move it again. Settled once more
    // when the page has finished, unless the reader has scrolled since.
    if (target && document.readyState !== "complete") {
        window.addEventListener("load", () => {
            if (settled !== null && Math.abs(window.scrollY - settled) < 4) landOn(target, false);
        }, { once: true });
    }
    window.addEventListener("hashchange", () => {
        const next = fragmentTarget(location.hash);
        if (next) landOn(next, true);
    });
    // A link to a post on this page glides to it rather than reloading
    // the page to land on it.
    document.addEventListener("click", (event) => {
        if (event.button !== 0 || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
        if (!link || link.closest(".rr-releases")) return;
        const here = inPageTarget(link);
        if (!here) return;
        event.preventDefault();
        const hash = new URL(link.getAttribute("href"), location.href).hash;
        if (hash !== location.hash) history.replaceState(null, "", hash);
        landOn(here, true);
    });
}

/* ---- Entry point ---------------------------------------------------- */

function initTopic() {
    if (!PAGE.isTopic) return;

    /* Read before it is written over: where this topic was left, and
       which post was the newest here at the time. */
    let seen = null;
    if (settings.get("history") && PAGE.topicId) {
        seen = store.get("history", []).find((item) => item.id === String(PAGE.topicId)) || null;
    }

    const all = posts();

    if (settings.get("history") && PAGE.topicId) {
        markVisited(String(PAGE.topicId));
        const heading = document.querySelector("#pageheader h2 a.titles, #pageheader h2");
        if (heading) {
            const list = store.get("history", []).filter((item) => item.id !== String(PAGE.topicId));
            const here = pagination();
            const newest = all.reduce((top, post) => Math.max(top, Number(post.id) || 0), 0);
            list.unshift({
                id: String(PAGE.topicId),
                title: heading.textContent.trim(),
                href: "./viewtopic.php?t=" + PAGE.topicId,
                at: Date.now(),
                page: here.current || 1,
                // Never lower: coming back to page 1 of a topic already
                // read to the end does not un-read it.
                lastPost: Math.max(Number(seen && seen.lastPost) || 0, newest),
            });
            store.set("history", list.slice(0, HISTORY_LIMIT));
        }
    }

    // Marks the table that must not clip its controls' tooltips.
    for (const post of all) post.table.setAttribute("data-rr-post", "");

    const modern = settings.get("postLayout") === "modern";
    if (modern) {
        document.documentElement.setAttribute("data-rr-posts", "modern");
        // Before the card, so the card lands under the author line
        // rather than above it.
        all.forEach(modernisePost);
    }

    // The Enhanced script builds a Steam header of its own over the
    // first post; with it present and the setting on, this one stands
    // down (see detectEnhanced).
    const coexisting = document.documentElement.hasAttribute("data-rr-coexist");
    if (settings.get("gameCard") && !coexisting && all.length && PAGE.start === 0) {
        const info = parseGameInfo(all[0].body);
        if (info && (info.appId || Object.keys(info.fields).length >= 3)) {
            // Remembered regardless of whether the preview is on — see steam.js.
            if (info.appId && PAGE.topicId) steamRememberApp(PAGE.topicId, info.appId);
            buildGameCard(info, all[0].body);
            // The card already carries the title and the detail rows,
            // so the fold starts at the game heading rather than
            // further down at About The Game.
            const heading = all[0].body.querySelector('span[style*="150%"], span[style*="130%"]');
            const anchor = heading ? (heading.closest("span[style*=color]") || heading) : null;
            foldSteamBlurb(all[0].body, anchor);
        }
    }

    decorateHeading();
    liftSpoilerButtons();
    // Before the bar is built: its "Close all N spoilers" reads the
    // state off the page.
    if (settings.get("spoilersOpen")) openSpoilersAtLoad();
    buildTopicBar();

    all.forEach((post, index) => {
        if (settings.get("postTools")) addPostTools(post, index);
        if (settings.get("collapseSigs")) collapseSignature(post);
    });

    if (settings.get("lightbox")) initLightbox();
    if (settings.get("history") && settings.get("resumeReading")) {
        markNewSince(all, seen);
        offerResume(seen);
    }
    if (settings.get("linkifyBare")) markExternalLinks();
}

/* ================= src/modules/finder.js ================= */
// Reads what a post carries and says, and how much of that adds up to a
// release rather than a reply about one — releases.js is the half that
// shows it. Nothing here fetches anything; it only reads the loaded page.

// "emulator" used to be in this list; dropped because a post mentioning one
// is as likely about RPCS3/Yuzu/PS2 as a Steam stub. "goldberg"/"steam emu"
// say the same thing without the false positives.
const RELEASE_WORDS = [
    "clean steam files", "steam files", "reupload", "re-upload",
    "update", "updated", "patch", "hotfix", "repack", "crack",
    "build", "denuvo", "dlc unlocker", "goldberg", "steam emu",
    "online fix",
    // A hypervisor crack has its own how-to threads and requirements.
    "hypervisor", "title update",
];

// Three shapes: v1.4.2/ver. 2.0, a Steam build id (8 digits, kept separate
// so it's never mistaken for a huge version), and a labelled bare number
// ("Title Update 1.0.7", the commonest form here) — which must be followed
// by a *dotted* number so "update 2 of 3" doesn't count.

// A single trailing letter (1.4.2b) is allowed, but only where it's not the
// start of a word and not itself a digit — a plain `\b` let "1.0.7Learn"
// backtrack to "1.0".
const VERSION_SUFFIX = "(?:[a-z](?![a-z]))?(?!\\d)";

const VERSION_RE = new RegExp([
    "\\b(?:v(?:er(?:sion)?)?\\.?\\s?)(\\d+(?:\\.\\d+){1,3}" + VERSION_SUFFIX + ")",
    "\\bbuild\\s+(\\d{5,9})\\b",
    "\\b(?:title[\\s.]+update|update|patch|tu)d?[\\s.]+(?:to[\\s.]+)?v?(\\d+(?:\\.\\d+){1,3}" + VERSION_SUFFIX + ")",
    // A bare three-part number ("Deluxe Edition 1.2.3 GOG") — release
    // titles here carry one without a v more often than with. Two parts
    // alone is left to the labelled forms since 2.5 is also a price/score.
    "(?<![\\w.])(\\d{1,4}\\.\\d{1,3}\\.\\d{1,4}" + VERSION_SUFFIX + ")(?![\\w.])",
].join("|"), "i");

// A shape check, not a digit check: plausible year/month/[day]. Off the live
// board, "Updated.2026.09.02" would otherwise beat every real version this
// board will ever see. This also refuses genuine year-based versioning
// (2024.1.5), the right trade where every real version here is 1.x/2.x.
// The number still shows if the post carries nothing else; this only stops
// it being compared as a version.
function looksLikeDate(version) {
    const parts = version.split(".").map((part) => parseInt(part, 10));
    if (parts.length < 2 || parts.length > 3) return false;
    const year = (n) => n >= 1990 && n <= 2099;
    const month = (n) => n >= 1 && n <= 12;
    const day = (n) => n >= 1 && n <= 31;
    // 2026.09.02 / 2026.09
    if (year(parts[0]) && month(parts[1]) && (parts.length === 2 || day(parts[2]))) return true;
    // 12.09.2026 — the other order half this board uses.
    return parts.length === 3 && day(parts[0]) && month(parts[1]) && year(parts[2]);
}

// Every version-shaped match in order, not just the first — a post whose
// opening line is a build date needs the real version three lines down.
const VERSION_RE_ALL = new RegExp(VERSION_RE.source, "gi");

// "Peacock-v5.3.0.7z" would read as version 5.3.0.7z (extension mistaken for
// a 4th part + letter); blanked before matching so the number stays as written.
const ARCHIVE_SUFFIX_RE = /\.(?:7z|zip|rar|tar|gz|bz2|iso|exe|bin|torrent|part\d*)\b/gi;

// "The 'Casino Monarchique' Chip (1.000.000)" — a chip count — matched the
// bare three-part form as version one million. A thousands separator writes
// zero-padded groups of 3, which nothing versions itself as; only the bare
// form is checked, so "v1.000.000" typed on purpose still counts.
function looksLikeAThousand(version) {
    const parts = version.split(".");
    if (parts.length !== 3) return false;
    if (parts[1].length !== 3 || parts[2].length !== 3) return false;
    return /^0/.test(parts[1]) || /^0/.test(parts[2]);
}

// Companion software (Peacock, Goldberg, GreenLuma, an overlay) has its own
// version in the same sentence as the game's — "update the Peacock crack to
// v8.9.0" announced HITMAN 3 as v8.9.0 when the game was on 3.280. Checked
// only looking backward from the number: forward is "v3.190 + Peacock + ALL
// DLC", the game's real version followed by what comes with it.
const COMPANION_RE = /\b(?:peacock|goldberg|greenluma|smoke\s?api|cream\s?api|uplay\s?r2|achievement\s?overlay|reshade|dxvk|proton|lutris|vcredist|directx|cheat\s?engine|fling|steamtools|simple\s?mod\s?framework|winrar|7-?zip)\b/i;
const COMPANION_WINDOW = 32;

function versionsIn(said) {
    const text = String(said || "").replace(ARCHIVE_SUFFIX_RE, " ");
    const all = VERSION_RE_ALL;
    all.lastIndex = 0;
    const found = { version: null, build: null, named: false, theirs: false };
    let match;
    while ((match = all.exec(text)) !== null) {
        if (match[2]) {
            if (!found.build) found.build = match[2];
            continue;
        }
        const number = match[1] || match[3] || match[4];
        if (!number || looksLikeDate(number)) continue;
        if (!match[1] && !match[3] && looksLikeAThousand(number)) continue;
        // named = the post called it a version (v-prefixed or "Title
        // Update"/"updated to"); a bare three-part number is shown too but
        // isn't evidence about the game — "Updated ACBlackFlagFix to 2.8.3!"
        // is a mod's changelog, not the game's version.
        if (!found.version) {
            found.version = number;
            found.named = Boolean(match[1] || match[3]);
            found.theirs = COMPANION_RE.test(
                text.slice(Math.max(0, match.index - COMPANION_WINDOW), match.index));
        }
    }
    // "Updated from 1.0.5 to 1.0.7": the plain first match would be the
    // version left behind. Only this wording overrides it.
    const step = FROM_TO_RE.exec(text);
    if (step && !looksLikeDate(step[2]) && compareVersions(step[2], step[1]) > 0) {
        found.version = step[2];
        found.named = true;
        found.theirs = COMPANION_RE.test(
            text.slice(Math.max(0, step.index - COMPANION_WINDOW), step.index));
    }
    return found;
}

const FROM_TO_RE = /\bfrom\s+v?\.?\s?(\d+(?:\.\d+){1,3}[a-z]?)\s+to\s+v?\.?\s?(\d+(?:\.\d+){1,3}[a-z]?)\b/i;

/** Numeric, part by part: 1.0.10 is newer than 1.0.9. */
function compareVersions(a, b) {
    const left = String(a).split(/[.\-_]/).map((part) => parseInt(part, 10) || 0);
    const right = String(b).split(/[.\-_]/).map((part) => parseInt(part, 10) || 0);
    const length = Math.max(left.length, right.length);
    for (let index = 0; index < length; index += 1) {
        const diff = (left[index] || 0) - (right[index] || 0);
        if (diff) return diff;
    }
    return 0;
}

/** Hosts that are the forum itself rather than somewhere to download. */
function isOffsite(href) {
    try {
        const host = new URL(href, location.href).hostname;
        return host !== location.hostname && !host.endsWith(".rin.ru");
    } catch {
        return false;
    }
}

// Strips quoted content so a "thanks, link's dead" reply quoting a release
// doesn't score like the release itself (same version, words, and login-wall
// markers). The clone is detached, so nothing the reader sees is touched.
//
// A spoiler wears the same `.quotecontent` class as a quote body
// (`div.spoiler > div + div.quotecontent > div[hidden]`), and on this board
// the spoiler is *where the download links go* ("Download:" then a spoiler
// of mirrors) — stripping it like a quote silently zeroed out every
// ElAmigos/DODI/CharmKat/RIDDICK release post. A quote's `.quotecontent` has
// the post as parent; a spoiler's has `.spoiler` as parent. A quote nested
// inside a spoiler is still a quote and still goes.
function isSpoilerBody(node) {
    const parent = node.parentElement;
    return Boolean(parent && parent.classList && parent.classList.contains("spoiler"));
}

// The board wraps a distrusted filehost link in span.link_unsafe_overlay >
// a.link_unsafe_reveal (no href, so it survives anchor-stripping) + a
// link_unsafe_note warning — none of it typed by the poster, but it landed
// in the post's text as forty words of boilerplate ("buzzheavier.com link
// Malicious ads...") in front of every excerpt from those hosts.
const LINK_FURNITURE = "a.link_unsafe_reveal, .link_unsafe_note";

function ownContent(body) {
    const copy = body.cloneNode(true);
    for (const quote of copy.querySelectorAll(".quotecontent, .quotetitle, blockquote, cite")) {
        if (isSpoilerBody(quote)) continue;
        quote.remove();
    }
    for (const node of copy.querySelectorAll(LINK_FURNITURE)) node.remove();
    spaceOutLines(copy);
    return copy;
}

// Links removed before the English-reading rules (question/failure/reply/
// advice) run — a bare 60-80 char URL inline pushed the real sentence out of
// their reading window, e.g. "I finally got 'The Brothers' mod (i.e.
// https://nexusmods.com/.../431 ) working on Linux".
function proseContent(own) {
    const copy = own.cloneNode(true);
    for (const node of copy.querySelectorAll("a[href], .link_removed, " + CODE_BLOCKS)) node.remove();
    return copy.textContent;
}

/** The post's first lines, which is where it says what it is. */
function openingOf(text, chars) {
    return String(text || "").split("\n")
        .map((line) => line.replace(/\s+/g, " ").trim())
        .filter((line) => line && line !== "⚠")
        .join("\n")
        .slice(0, chars);
}

// A <br> contributes no text, so line-per-fact posts weld together:
// "Game version is Title Update 1.0.7Learn more here" — breaking both the
// version regex (no word boundary) and release-word matching. Fixed with a
// newline (not a space) per break on the detached copy, since passwordIn()
// reads one candidate per line via `[\n\r]+` and needs real line boundaries.
const LINE_BREAKS = "br, p, div, li, tr, h1, h2, h3, h4, blockquote, pre";

function spaceOutLines(copy) {
    for (const node of copy.querySelectorAll(LINE_BREAKS)) {
        node.before(document.createTextNode("\n"));
        node.after(document.createTextNode("\n"));
    }
}

// Almost every release post ends with one ("Password: cs.rin.ru", "unrar
// pass: something", "Пароль: ..."), often screens below the link or inside a
// spoiler. Read as label + separator + the token after it.
const PASSWORD_LABEL = "(?:archive\\s+|unrar\\s+|unzip\\s+|rar\\s+|zip\\s+|extraction\\s+)?(?:password|passwd|pass|pwd|pw|пароль)";
// What a post says instead of a password ("the standard password", "password
// required") — none of these is one, and reading it out is worse than nothing.
const NOT_A_PASSWORD = new Set([
    "standard", "usual", "same", "above", "below", "none", "forum", "default",
    "required", "needed", "protected", "correct", "wrong", "here", "link",
    "file", "archive", "yes", "no", "is", "the", "a", "unknown", "obvious",
]);
const PASSWORD_RE = new RegExp(
    // A separator is required (colon, equals, dash, or "is") — without one,
    // "password protected" reads as a password called "protected".
    "(^|[\\s>(\\[])" + PASSWORD_LABEL + "\\s*(?:is\\b\\s*|[:=\\-]\\s*)+([^\\s<>\\n\\r]{1,48})",
    "i",
);
const NO_PASSWORD_RE = new RegExp(
    "\\b(?:no|none|without|not?)\\s+(?:" + PASSWORD_LABEL + ")|" + PASSWORD_LABEL + "\\s*[:=\\-]?\\s*(?:none|no|n/a|нет)\\b",
    "i",
);

function passwordIn(text) {
    const said = String(text || "");
    for (const line of said.split(/[\n\r]+/)) {
        if (NO_PASSWORD_RE.test(line)) continue;
        const match = PASSWORD_RE.exec(line);
        if (!match) continue;
        const value = match[2]
            .replace(/^[\u0022\u0027`]+|[\u0022\u0027`,;:!?)\]]+$/g, "")
            .replace(/\.$/, "");
        if (value.length < 2 || NOT_A_PASSWORD.has(value.toLowerCase())) continue;
        // A password is a token (has a dot/dash/digit/underscore, or is a
        // long run of letters) — a word mid-sentence is neither.
        if (!/[.\-_@\d]/.test(value) && value.length < 6) continue;
        return value;
    }
    return null;
}

// Unrecognised hosts keep their own domain, without the suffix.
const HOST_NAMES = {
    "mega.nz": "MEGA", "mega.co.nz": "MEGA",
    "1fichier.com": "1fichier",
    "gofile.io": "GoFile",
    "pixeldrain.com": "PixelDrain",
    "buzzheavier.com": "Buzzheavier",
    "datanodes.to": "DataNodes",
    "mediafire.com": "MediaFire",
    "drive.google.com": "Drive",
    "dropbox.com": "Dropbox",
    "workupload.com": "WorkUpload",
    "krakenfiles.com": "KrakenFiles",
    "send.cm": "Send.cm",
    "qiwi.gg": "Qiwi",
    "multiup.io": "MultiUp", "multiup.org": "MultiUp",
    "torrent.rin.ru": "Torrent",
    "github.com": "GitHub",
    "archive.org": "Archive.org",
};

// Not a release host: stores, video, screenshots, articles, publishers and
// games press. The last two matter because "the patch is out, get it at
// store.epicgames.com" is the commonest thing a *reply* carries, and
// counting it as a download put a page of conversation in the panel.
const NOT_HOSTS = new RegExp([
    "steampowered|steamcommunity|steamdb|steamcharts|protondb|pcgamingwiki|pcgamebenchmark",
    // Stores. Somewhere to buy is not somewhere to download.
    "epicgames|gog\\.com|ubisoft\\.com|ubi\\.com|origin\\.com|ea\\.com|xbox\\.com|microsoft\\.com",
    "playstation\\.com|nintendo\\.|humblebundle|itch\\.io|greenmangaming|fanatical|gamesplanet",
    // Publishers and the games press, which announce rather than host.
    "ioi\\.dk|rockstargames|bethesda|square-enix|capcom|bandainamco|sega\\.com",
    "pcgamer|vg247|eurogamer|ign\\.com|gamespot|kotaku|rockpapershotgun|dsogaming|wccftech|videocardz",
    // Video, pictures, talk.
    "youtube|youtu\\.be|imgur|ibb\\.co|prnt\\.sc|gyazo|postimg|imageban|fastpic|pixhost|imgbox",
    "lensdump|imagizer|googleusercontent|twitch|twitter|x\\.com|reddit|wikipedia|discord|patreon|paypal",
    "google\\.[a-z]+|bing|duckduckgo|blockchair|mempool",
].join("|"), "i");

// co.uk, github.io etc.: the real label is one segment further left.
const HOST_SUFFIX_2 = /\.(?:co|com|net|org|gov|ac|edu)\.[a-z]{2,3}$|\.(?:github|gitlab)\.io$|\.(?:blogspot|netlify|vercel|pages|workers)\.(?:com|app|dev)$/i;

// Used to strip a fixed suffix list and take whatever came last, which
// misread rootz.so as "So", ioi.dk as "Dk". Taking the label before the
// public suffix instead gets the real name.
function hostLabel(host) {
    const bare = host.replace(HOST_SUFFIX_2, "").replace(/\.[a-z]{2,24}$/i, "");
    const label = bare.split(".").pop();
    if (!label || label.length < 2) return null;
    return label.charAt(0).toUpperCase() + label.slice(1);
}

function hostName(href) {
    let host;
    try { host = new URL(href, location.href).hostname.replace(/^www\./, ""); }
    catch { return null; }
    if (NOT_HOSTS.test(host)) return null;
    if (HOST_NAMES[host]) return HOST_NAMES[host];
    return hostLabel(host);
}

// Told apart because both a citing post ("read their website: [wiki]") and
// an offering one ("here's the gofile folder") carry one off-site link.
// `null` is the board itself, "read" is somewhere to read (store, patch
// note, wiki, repo, paste), "file" is somewhere to get the thing — the path
// matters as much as the host (github.com/x/y is a repo,
// github.com/x/y/releases is a download page). Unrecognised defaults to
// "file": uploaders use a new host every month and a stale list would lose
// real releases.
const READ_PATH_RE = /\/(?:wiki|blob|commits?|issues?|pull|tree|discussions?|patch-?notes?|news|roadmaps?|changelog|faq|about|profile|memberlist)(?:\/|\?|$)/i;

// Pastes/link lists hold real releases (a rentry of mirrors) as often as a
// pasted log or a guide, so one only counts as an offer when the post also
// sounds like it's handing something over (size, password, label, name).
const NOTE_HOST_RE = /^(?:rentry\.|privatebin|paste\.|pastebin|hastebin|justpaste|controlc|ghostbin|dpaste|termbin|textbin|telegra\.ph)/i;

const CODE_HOST_RE = /^(?:github|gitlab|codeberg|sourceforge)\.(?:com|net|org|io)$/i;
const CODE_FILE_PATH_RE = /\/(?:releases|releases\/download|raw|archive|downloads?|files)(?:\/|\?|$)/i;
const STATIC_SITE_RE = /\.(?:github|gitlab)\.io$/i;

function linkRole(href) {
    const raw = String(href || "");
    if (/^magnet:/i.test(raw)) return "file";
    let url;
    try { url = new URL(raw, location.href); }
    catch { return null; }
    if (!/^https?:$/.test(url.protocol)) return null;
    const host = url.hostname.replace(/^www\./, "");
    if (host === location.hostname || host.endsWith(".rin.ru")) return null;
    if (NOT_HOSTS.test(host)) return "read";
    if (STATIC_SITE_RE.test(host)) return "read";
    if (CODE_HOST_RE.test(host)) return CODE_FILE_PATH_RE.test(url.pathname) ? "file" : "read";
    if (READ_PATH_RE.test(url.pathname)) return "read";
    if (NOTE_HOST_RE.test(host)) return "note";
    return "file";
}

// Markers of intent (size, name, password/link label), used only to decide
// whether a paste link counts as an offer.
const OFFER_SIZE_RE = /\b\d{1,5}(?:[.,]\d+)?\s?(?:[KMGT]i?B)\b/i;
const OFFER_LABEL_RE = /\bdownloads?\s*(?:links?|mirrors?)?\s*[:\-–>]|\blinks?(?:\(s\))?\s*[:\-–]|\bmirrors?\s*\d*\s*[:\-–]|\bpass(?:word)?\s*[:\-–=]|\bпароль/i;
// A scene name (Foo.Bar.v1.0.2-GROUP) or a named archive file.
const OFFER_NAME_RE = /\b[A-Za-z0-9]+(?:\.[A-Za-z0-9]+){2,}-[A-Za-z0-9]{2,}\b|\b[\w.\-]{3,}\.(?:7z|rar|zip|iso|torrent)\b/i;

function saysItIsHandingSomethingOver(text, attached) {
    if (attached) return true;
    return OFFER_SIZE_RE.test(text) || OFFER_LABEL_RE.test(text) || OFFER_NAME_RE.test(text);
}

// Magnet links have no host of their own.
function linkHosts(links) {
    const out = [];
    for (const link of links) {
        const href = link.getAttribute("href") || "";
        const name = /^magnet:/i.test(href) ? "Torrent" : hostName(href);
        if (name && !out.includes(name)) out.push(name);
    }
    return out;
}

// subsilver2 on cs.rin.ru marks a code block .codebox > .codeheader +
// .codeholder, not phpBB3's .codetitle + .code — matching only the latter
// meant no code block was ever recognised on the live board, and release
// words got matched against pasted configs/magnets/error logs instead.
const CODE_BLOCKS = ".code, .codetitle, .codebox, .codeheader, .codeholder";

// What a post is *offering* vs. talking about: a file host link, a
// login-walled link, a magnet, a torrent, an attachment. Without this
// distinction a 429-page topic listed every question as a release, since
// the old rules just asked for a link or a version and a question has both.
const CARRIED_RE = /magnet:\?xt=|\.torrent\b/i;
const ATTACHED = ".attachtitle, .attachcontent, .attachrow";

// A guest sees a "@member" mention link replaced by the same
// "[[Please login to see this link.]]" placeholder as a filehost link, so a
// reply opening "@someone, AFAIK, not currently" counted as carrying a
// download. Signed-in the mention is an ordinary memberlist.php anchor,
// already refused by isOffsite() — this is the guest's half of that rule.
function hiddenLinks(own) {
    let count = 0;
    for (const node of own.querySelectorAll(".link_removed")) {
        const before = node.previousSibling;
        if (before && before.nodeType === 3 && /@\s*$/.test(before.textContent)) continue;
        count += 1;
    }
    return count;
}

// A question carrying a version and two release words ("Anyone know what
// version that torrent from April is?") used to be listed as a release.
// Only the opening sentence is checked, and it must both start and end like
// a question, so a release post closing "any problems, let me know?" is
// untouched. A full stop between two digits doesn't end the sentence early
// (so "...Peacock v8.8.1 from?" doesn't stop at "v8"). Bare `any` (not just
// anyone/anybody/anyway) is included: "Any news on the update? doesn't work
// at all" opened more questions here than the three compounds combined.
const ASKING_RE = /^(?:[^.!?]|\.(?=\S)){0,240}\?/;
const ASKING_OPENERS = /^[\s\W]*(?:@\S*[\s,]*)*(?:is|are|was|were|does|do|did|can|could|would|will|should|has|have|any(?:one|body|way|thing)?|some(?:one|body)|how|what|where|when|why|which|who|whose|hi|hello|hey|help|please|sorry|guys?)\b/i;

function looksLikeAQuestion(text) {
    const said = String(text || "").replace(/\s+/g, " ").trim();
    return ASKING_RE.test(said) && ASKING_OPENERS.test(said);
}

// "...the cracked one v6 from here, and they don't seem to work" has a
// version, a release word and a link but is somebody stuck, not a release.
// Requires a subject before the verb — a bare pattern read a release post's
// "Doesnt work on demo" (a caveat on the upload) as a failure report and
// dropped the whole thing. Only checked when the post hands nothing over
// (no attachment/password/size/name), so "if it doesn't work, verify your
// files" in a real release isn't caught.
const FAILED_RE = /\b(?:(?:it|they|this|that|these|those|mine|game|crack|patch|link|files?|version|copy|method|mod|emu|setup|nothing|none|i)\s+(?:do(?:es)?\s?n[o']?t|won'?t|can'?t|isn'?t|aren'?t|still\s+do(?:es)?\s?n[o']?t)\s+(?:\w+\s+){0,2}(?:work|launch|start|run|load|open)|can'?t\s+get\s+(?:it|this|that|them)\s+to\s+\w+|no\s+luck|stuck\s+(?:at|on)|keeps?\s+crashing|crashes?\s+(?:on|at|when|immediately)|fail(?:s|ed)?\s+to\s+(?:work|launch|start|run|install))\b/i;

function reportsAFailure(text) {
    return FAILED_RE.test(String(text || ""));
}

// With links stripped, a mention-reply opens "@, No problem, glad you got it
// working" (or "Response to wasdfghj" typed by hand) — both used to be
// listed as releases on the strength of a link further down. Only the
// opening is checked, and only when the post hands nothing over, so a reply
// that answers "@someone" and then attaches the file is still an upload.
const REPLYING_RE = /^[\s\W]{0,4}(?:@|re\s*:|response\s+to\b|reply\s+to\b|quote\s*:)/i;

function looksLikeAReply(text) {
    return REPLYING_RE.test(String(text || "").replace(/\s+/g, " ").trim());
}

// The rule a 429-page HITMAN topic needed most: half of it was one person
// answering everyone with a link to where the discussed thing already lives
// (an official tool, someone else's upload, a Nexus mod) — read by the rules
// above, each answer has an off-site download, a version and release words,
// and all 35 of that topic's 73 "release" rows were actually this. Told
// apart by the opening: a release opens with the thing itself ("Here is...",
// "I compiled..."), an answer opens with the reader's situation ("Assuming
// you are on...", "You can use..."). Only the opening is read, and only
// where the post isn't itself saying it's handing something over.
const ADVISING_OPEN = new RegExp([
    // A release post doesn't open with "Or"; nothing here opens a download
    // with "Yeah".
    "^\\W*(?:assuming|since\\s+you|if\\s+you|while\\s+i|in\\s+short|before\\s+you",
    "|okay|ok|yeah|yeh|yep|nope|nah|sure|well|anyway|also|or|and|but)\\b",
    // Announcing instructions follow.
    "|^\\W*(?:guide|tutorial|how\\s+to|instructions?|steps?\\s+to)\\b",
    // Telling the reader what to do about their copy.
    "|\\byou\\s+(?:can|could|should|need\\s+to|have\\s+to|must|might|may|want\\s+to|will\\s+need)\\b",
    "|\\bi\\s+(?:would|suggest|recommend|think|believe|guess)\\b",
    // Saying where the thing is (not offering it).
    "|\\b(?:is|are|it'?s)\\s+(?:already\\s+)?(?:in|on)\\s+(?:this|the)\\s+(?:thread|topic|post|page)\\b",
    "|\\buse\\s+the\\s+search\\b",
    "|\\b(?:has|have)\\s+(?:it|them|this)\\s+(?:in|on|here|there)\\b",
    // The apostrophe matters: without it, `\\w+s\\s+release` matched
    // "ElAmigos release" — a group announcing its own upload.
    "|\\b\\w+'s\\s+(?:stuff|setup|post|link|version|release|build|copy)\\b",
    // Reporting what the poster did with someone else's thing; PUBLISHING
    // below is checked separately and wins, so "tried to crack Peacock
    // v8.9.0" is a release but "tested it on Hitman v3.270.1" is not.
    "|\\bi\\s+(?:have\\s+)?(?:just\\s+|finally\\s+)?(?:tested|checked)\\b",
    // Not `[^.]`, which "i.e." would end early.
    "|\\bi\\s+(?:finally\\s+)?got\\s+[^\\n]{0,60}?\\bworking\\b",
    "|\\bi\\s+had\\s+th(?:is|e\\s+same)\\s+(?:problem|issue)\\b",
].join(""), "i");

// Read over the first few lines, not just the first: the publishing sentence
// is often the second ("Hiii" then "I compiled..."). Verbs mean *I made
// this*; "made"/"shared"/"posted" are excluded since each doubles as
// narrating something done in the past ("files I made a while ago").
const PUBLISHING_OPEN = /^\W*(?:here(?:'s| is| are| you go)\b|use\s+th(?:is|ese)\b)/i;
const PUBLISHING = new RegExp([
    "\\bhere\\s+you\\s+go\\b",
    "|\\bi(?:'ve|\\s+have)?\\s+(?:just\\s+|finally\\s+)?(?:re-?)?",
    "(?:uploaded|upped|compiled|built|patched|cracked|packed|repacked|ported|translated|created)\\b",
    "|\\bi\\s+(?:decided|tried|attempted|managed)\\s+to\\s+",
    "(?:make|crack|update|patch|build|compile|port|fix|translate|upload)\\b",
    "|\\bupon\\s+request\\b",
    // Third person only ("if anyone wants it"): "if you want" is the
    // commonest sentence in an answer, not an offer.
    "|\\bif\\s+(?:anyone|anybody|someone|somebody)\\s+(?:wants?|needs?)\\b",
    "|\\b(?:download|grab|get)\\s+(?:it|them|this)\\s+(?:here|below|from)\\b",
].join(""), "i");

// One line for what it's answering, ~3 for whether it's publishing — enough
// to reach the second sentence, short enough to exclude a release's own
// install notes ("you can now run the exe").
const ADVISING_CHARS = 200;
const PUBLISHING_CHARS = 340;

function soundsLikeAdvice(text) {
    return ADVISING_OPEN.test(openingOf(text, ADVISING_CHARS));
}

function saysItIsPublishing(text) {
    const opening = openingOf(text, PUBLISHING_CHARS);
    return PUBLISHING_OPEN.test(opening) || PUBLISHING.test(opening);
}

function describePost(post) {
    const own = ownContent(post.body);
    const text = own.textContent;
    // English-reading rules use `said` (links out); rules that read what a
    // post carries (version, size, name) use `text`, links still in.
    const said = proseContent(own);
    // Flattened so a release word split across a line break still matches.
    const lower = text.replace(/\s+/g, " ").toLowerCase();

    const links = Array.from(own.querySelectorAll("a[href]"))
        .filter((a) => isOffsite(a.getAttribute("href")));

    // Guests see "[[Please login to see this link.]]" instead of an
    // anchor, so those count as links too.
    const hidden = hiddenLinks(own);
    const attached = own.querySelectorAll(ATTACHED).length > 0;

    // A paste's role (file vs. read) is settled by whether the post sounds
    // like it's handing something over.
    const roles = links.map((a) => linkRole(a.getAttribute("href")));
    const handing = saysItIsHandingSomethingOver(text, attached);
    const files = links.filter((_, i) => roles[i] === "file" || (roles[i] === "note" && handing));
    const hosts = linkHosts(files);

    const words = RELEASE_WORDS.filter((word) => lower.includes(word));
    // Version and build id are matched separately and kept apart — an
    // 8-digit build like 24127279 once beat every real version and got
    // announced as the latest release of a game actually on 1.2.4.
    const named = versionsIn(text);

    const score =
        (links.length + hidden) * 3 +
        words.length * 2 +
        (named.version || named.build ? 3 : 0) +
        // `own`, not `post.body` — this term used to still read the quote,
        // so a "thanks" quoting a post with a code block scored for it.
        (own.querySelector(CODE_BLOCKS + ", .spoiler") ? 1 : 0);

    return {
        post,
        links: links.length + hidden,
        hosts,
        // Distinct hosts, not anchors, so 8 mirrors of one upload count once.
        offers: hosts.length + hidden + (attached ? 1 : 0) + (CARRIED_RE.test(text) ? 1 : 0),
        // A post whose every link is a citation has published nothing.
        cites: roles.filter((role) => role === "read").length,
        handing,
        attached,
        asking: looksLikeAQuestion(said),
        failed: reportsAFailure(said),
        replying: looksLikeAReply(said),
        advising: soundsLikeAdvice(said),
        publishing: saysItIsPublishing(said),
        password: passwordIn(text),
        words,
        version: named.version,
        versionNamed: named.named,
        // A companion-product version still shows on its row; it just
        // never sets the headline.
        versionTheirs: named.theirs,
        build: named.build,
        score,
        date: postDate(post),
    };
}

function postDate(post) {
    if (!post.headCell) return null;
    // "Posted:" or "Добавлено:" (Russian interface).
    const match = post.headCell.textContent.match(/(?:Posted|Добавлено):\s*(.+?)(?:\s{2,}|$)/);
    return match ? match[1].trim() : null;
}

function authorName(post) {
    return post.author ? post.author.textContent.trim() : "unknown";
}

function flash(node) {
    if (!motionAllowed()) {
        // No fade with reduced motion: the outline just stops, not dissolves.
        node.style.outline = "2px solid var(--rr-accent)";
        node.style.outlineOffset = "2px";
        setTimeout(() => { node.style.outline = ""; node.style.outlineOffset = ""; }, 1600);
        return;
    }
    node.style.transition = "outline-color 900ms ease";
    node.style.outline = "2px solid var(--rr-accent)";
    node.style.outlineOffset = "2px";
    setTimeout(() => {
        node.style.outlineColor = "transparent";
        setTimeout(() => {
            // Transition cleared too, or it'd animate any later outline.
            node.style.outline = "";
            node.style.outlineOffset = "";
            node.style.transition = "";
        }, 900);
    }, 700);
}

// The only thing in the script that hides with display:none rather than
// folding — a deliberate filter you switch on, off by default, that says
// how many posts it's showing and puts them all back when switched off.
function buildLinkFilter(all, rows) {
    const flagged = new Set(rows.map((row) => row.id));
    let on = false;

    const button = el("button.rr-btn", { type: "button", "aria-pressed": "false" }, [
        icon("filter", 13),
        t("Only posts with links"),
    ]);
    button.addEventListener("click", () => {
        on = !on;
        button.setAttribute("aria-pressed", on ? "true" : "false");
        for (const post of all) {
            const keep = !on || flagged.has(post.id);
            post.table.style.display = keep ? "" : "none";
        }
        // The whole-topic Releases list holds rows for posts off this page;
        // sync it too, or its rows stay stale when the filter is toggled.
        for (const row of document.querySelectorAll(".rr-releases__row")) {
            row.toggleAttribute("data-rr-nolink", on && row.getAttribute("data-links") === "0");
        }
        toast(on ? t("{n} posts shown", { n: rows.length }) : t("All posts shown"));
    });
    return button;
}

/* ================= src/modules/releases.js ================= */
// "This page" reads the DOM for free; "All N pages" walks the topic once per
// click and remembers what it found (never a page load, never twice in a
// row — Escape stops it). finder.js decides what a post is; this shows it,
// with quoted text excluded there so a reply quoting a release isn't one.

// Every matching word is kept ("Repack, Update, DLC" are three true things).
// Russian forums are closed to guests, so these terms aren't grounded in
// reading the board like the English ones — only unambiguous jargon
// (таблетка/лекарство = crack, русификатор = translation) made the list,
// nothing that's also ordinary Russian.
const RELEASE_KINDS = [
    { id: "steamfiles", label: "Clean Steam files", re: /\b(?:clean\s+steam\s+files?|steam\s+files?|scs\b)|чистые\s+файлы/i },
    { id: "repack", label: "Repack", re: /\brepack(?:ed|s)?\b|\bfitgirl\b|\bdodi\b|\belamigos\b|репак/i },
    // A build you unzip and run, not a repack (nothing recompressed) — its
    // own kind, named in title lines like "HITMAN 3 [PORTABLE]".
    { id: "preinstalled", label: "Pre-installed", re: /\bpre[\s-]?installed\b|\bportable\b|предустановленн|портатив/i },
    { id: "crack", label: "Crack", re: /\bcrack(?:ed|fix|s)?\b|\bcodex\b|\bempress\b|\bskidrow\b|\bplaza\b|\btenoke\b|\brune\b|\brazor\s?1911\b|кряк|таблетк|лекарств/i },
    // Its own kind here: its own how-to threads, own requirements, and the
    // posts say so ("Black Flag Resynced HYPERVISOR"). Must stand alone —
    // "hv" is short, but nothing else on this board is spelled that way.
    { id: "hypervisor", label: "Hypervisor", re: /\bhyper[\s-]?visor\b|\bhv\b|гипервизор/i },
    // Not every Steam emulator mention — that used to include bare
    // "emulator"/"goldberg", tagging a pre-installed single-player release
    // with a swapped Steam stub as Online fix. See STEAM_EMU_RE below.
    { id: "online", label: "Online fix", re: /\bonline[\s-]?fix(?:\.me)?\b|\bmultiplayer\s+fix\b|\bco-?op\s+fix\b|\blan\s+fix\b|онлайн[\s-]*фикс/i },
    { id: "dlc", label: "DLC", re: /\bdlcs?\b|\bunlocker\b|\bcream\s?api\b|\bsmart\s?steam\b|длс|разблокировщик/i },
    // "Updated" in a release name (FLiNG trainers: "...Updated.2026.09.02")
    // is a build stamp, not an update — a date right after excludes it.
    { id: "update", label: "Update", re: /\bupdate[ds]?\b(?!\.\d{4}\b)|\bpatch(?:ed|es)?\b|\bhotfix\b|\bupgrade\b|обновлени|обнова|патч/i },
    // "Mirror" also labels a second download link ("Mirror 1", "Mirror #2")
    // rather than meaning reupload — followed by a colon/hash/number, it's
    // excluded as a link label, not prose.
    { id: "reupload", label: "Reupload", re: /\bre-?upload(?:ed|s|ing)?\b|\bmirrors?\b(?!\s*[:#=]|\s*\d)|\breup\b|перезалив|зеркало/i },
    { id: "trainer", label: "Trainer", re: /\btrainer\b|\bcheat\s+(?:tables?|engines?)\b|трейнер/i },
    // Its own word, not Trainer: a save hands over finished progress rather
    // than unlocking the game as you play.
    { id: "save", label: "Savegame", re: /\bsave\s?(?:game|file|data)s?\b|\bstarter\s+saves?\b|сохранени/i },
    { id: "language", label: "Language", re: /\blanguage\s+(?:pack|files?)\b|\blocali[sz]ation\b|\btranslation\b|русификатор|локализаци/i },
    { id: "tool", label: "Tool", re: /\btool(?:s|kit)?\b|\bmod\s+manager\b|\binstaller\b|активатор|установщик/i },
    { id: "denuvo", label: "Denuvo", re: /\bdenuvo\b|денуво/i },
];

// The stylesheet paints by family so the same word is always the same
// colour; a test fails if a kind is added without one.
//   game what you install (Clean Steam files, Repack)   run what starts it
//   change what it does to a copy   extra what it adds   beside what sits
//   next to it   block what stops it
// Kept distinct per theme — the first mapping put `run` and `block` on the
// same red, so a Crack looked like a warning.
const RELEASE_FAMILY = {
    steamfiles: "game",
    repack: "game",
    preinstalled: "game",
    crack: "run",
    hypervisor: "run",
    online: "run",
    update: "change",
    reupload: "change",
    dlc: "extra",
    language: "extra",
    trainer: "beside",
    save: "beside",
    tool: "beside",
    denuvo: "block",
};

function releaseFamily(kind) {
    return RELEASE_FAMILY[kind] || "other";
}

const RELEASE_CACHE_KEY = "topicIndex";
const RELEASE_CACHE_TOPICS = 8;

// Used to be a hard cap (80 pages, oldest dropped forever); now a pass, so a
// click reads the newest unread pages and another click reads the next lot
// — the far end of a long topic stays reachable instead of impossible.
// 30 comes from measuring the board's own burst budget live: it answers
// ~30 requests fast (120-170ms each) then drops to one page per 1.8s
// regardless of concurrency — a pass this size is the whole fast part and
// none of the slow crawl. makePace() handles a walk that starts queueing
// mid-pass; this only decides how much to take on.
const RELEASE_PASS_PAGES = 30;

// "newest" reads backward from the last page (what's it on now); "oldest"
// reads forward from page one (what was posted, in order). Persisted per
// browser like the fold state.
const RELEASE_ORDER_KEY = "releaseOrder";

function releaseOrder() {
    return store.get(RELEASE_ORDER_KEY, "newest") === "oldest" ? "oldest" : "newest";
}

function inReadingOrder(rows, order) {
    const back = order === "oldest" ? -1 : 1;
    return rows.slice().sort((a, b) =>
        back * ((b.page - a.page) || (Number(b.id) - Number(a.id))));
}

// Bounded three ways: 3 requests in flight max, never two started closer
// than RELEASE_START_GAP, and a 429/503 stops the walk rather than retrying.
// The board never actually answers 429 though — it queues silently, so the
// walk also times its own answers and drops to one slow request once
// they're several times its own best. No conditional-request path exists
// (no ETag/Last-Modified), so the only saving is the page cache below.
const RELEASE_IN_FLIGHT = 3;
const RELEASE_START_GAP = 160;        /* between request starts, ms   */
// Measured: the board hands out one slot roughly every 2s regardless of
// load, so a wider single-request gap just adds wait on top of the queue's
// own. 2 in flight with a short gap holds the same queue position instead.
const RELEASE_EASY_IN_FLIGHT = 2;
const RELEASE_EASY_GAP = 300;
// Consecutive fast answers needed to call the queue drained — recovering
// too eagerly (e.g. after 1) let a walk crawl the rest of a long topic
// without ever un-easing.
const RELEASE_RECOVER_AFTER = 4;
// How much slower than its own best counts as the board asking for room,
// and the floor below which nothing counts as a queue at all.
const RELEASE_SLOW_FACTOR = 3;
const RELEASE_SLOW_FLOOR = 1500;      /* ms                            */
const RELEASE_BACK_OFF = [429, 503];

// One of these per walk. Starts at 3 in flight, gives that up the first
// time an answer is several times slower than its own best.
function makePace() {
    return {
        inFlight: RELEASE_IN_FLIGHT,
        gap: RELEASE_START_GAP,
        best: Infinity,
        eased: false,
        // Whether it ever eased — reported even after recovering, since the
        // reader still watched it go slowly for a while.
        everEased: false,
        quick: 0,
        slowest: 0,
    };
}

function notePace(pace, ms) {
    if (!Number.isFinite(ms) || ms <= 0) return;
    pace.slowest = Math.max(pace.slowest, ms);
    if (ms < pace.best) pace.best = ms;

    if (pace.eased) {
        // Recovery bar is lower than the one that eased it, so a walk
        // can't oscillate on one borderline page.
        if (ms < Math.max(pace.best * 2, RELEASE_SLOW_FLOOR)) pace.quick += 1;
        else pace.quick = 0;
        if (pace.quick >= RELEASE_RECOVER_AFTER) {
            pace.eased = false;
            pace.quick = 0;
            pace.inFlight = RELEASE_IN_FLIGHT;
            pace.gap = RELEASE_START_GAP;
        }
        return;
    }

    if (ms < RELEASE_SLOW_FLOOR) return;
    if (ms < pace.best * RELEASE_SLOW_FACTOR) return;
    pace.eased = true;
    pace.everEased = true;
    pace.quick = 0;
    pace.inFlight = RELEASE_EASY_IN_FLIGHT;
    pace.gap = RELEASE_EASY_GAP;
}

// Not the link-counting text: people label links "Mirror 1", "Mirror 2",
// and reading those as prose tagged every upload as a reupload — including
// the first, which by definition isn't one.
function releaseProse(body) {
    return proseContent(ownContent(body)).replace(/\s+/g, " ").trim();
}

// Goldberg is used both ways: half the board swaps it in as the crack
// (offline), the other half uses it to restore multiplayer (online fix).
// The word alone can't tell them apart — surrounding context decides.
const STEAM_EMU_RE = /\bgoldberg\b|\bsteam[\s_-]?emu(?:lator)?\b|\bsmart\s?steam\s?emu\b|голдберг|эмулятор\s+steam/i;
// Tight on purpose (a post saying "online fix" outright is already matched
// above): bare `online`/`server` used to be in here and mistagged
// "download from other download servers" under a single-player release.
const ONLINE_INTENT_RE = /\bmultiplayer\b|\bco-?op\b|\bcoop\b|\bmatchmaking\b|\blobb(?:y|ies)\b|\blan\s+(?:play|party|game)\b|\bplay(?:ing)?\s+(?:online|with\s+friends)\b|\bonline\s+(?:play|works?|working|mode|multiplayer|co-?op)\b|мультиплеер|кооп|по\s+сети/i;

// Release names run together (EpicCrack, ACBlackFlagFix) with no `\b` in the
// middle, so a modded EpicCrack post matched no kind at all. Split only on
// the copy kinds are matched against — the row still shows the name as
// written.
function splitRunTogether(text) {
    return text.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function releaseKinds(text) {
    const said = text + " " + splitRunTogether(text);
    const emulated = STEAM_EMU_RE.test(said)
        ? (ONLINE_INTENT_RE.test(said) ? "online" : "crack")
        : null;
    const found = [];
    for (const kind of RELEASE_KINDS) {
        if (kind.re.test(said) || kind.id === emulated) found.push(kind);
    }
    return found;
}

function describeRelease(post, page) {
    const scored = describePost(post);
    const text = releaseProse(post.body);
    const kinds = releaseKinds(text);

    // A release is a thing you can get (file host, login-walled link,
    // magnet, torrent, attachment). Replaces three rules that each tried a
    // different angle and still let through every question with a version
    // in it — "Is there any way to upgrade from v3.140 to v3.170.1?" has a
    // version and two release words but no file behind it.
    if (!scored.offers) return null;

    // A question or a failure report with a link/version/words still isn't
    // offered — unless the post also hands something over (attachment,
    // password, size, label, name), which a release is allowed to do while
    // opening with a question or a "doesn't work" note. A reply is held to
    // more: naming a file or size while answering somebody ("@Cybah: you
    // mentioned the TGBLR mod...") isn't itself an offer unless it carries
    // the thing or says it's the one publishing.
    if ((scored.asking || scored.failed) && !scored.password && !scored.handing) return null;
    if (scored.replying && !scored.password && !scored.attached && !scored.publishing) return null;

    // The commonest shape on a busy thread that the rule above misses:
    // someone explaining at length and linking to where the thing already
    // lives (an official tool, an older mirror, a Nexus mod). See
    // soundsLikeAdvice(). Exemptions are narrower here — `handing` doesn't
    // count, since half these posts name a file/size while explaining —
    // only a password, an attachment, or saying it's the one publishing.
    if (scored.advising && !scored.publishing && !scored.password && !scored.attached) return null;

    // An offer naming neither a kind nor a version is, in practice, mostly
    // conversation (a hosting tip, a thank-you). The score check below is
    // the older fallback for posts using none of the release words.
    if (!kinds.length && !scored.version && !scored.build) return null;
    if (scored.score < 4 && !kinds.length) return null;

    // A version alone still isn't enough when nothing says what kind of
    // thing it is — that's also the shape of an aside confirming a hash
    // ("they match SteamDB's file hashes for Hitman v3.270.1"). Without a
    // kind, the post must otherwise say it's handing something over.
    if (!kinds.length && !scored.handing && !scored.attached
        && !scored.password && !scored.publishing) return null;

    return {
        id: post.id,
        page,
        author: authorName(post),
        date: postDate(post),
        version: scored.version,
        versionNamed: scored.versionNamed,
        versionTheirs: scored.versionTheirs,
        build: scored.build,
        links: scored.links,
        hosts: scored.hosts,
        kinds: kinds.map((kind) => kind.id),
        labels: kinds.map((kind) => kind.label),
        excerpt: text.slice(0, 180),
        score: scored.score,
    };
}

// Catches the same person reposting a mirror of their own upload several
// times, which reads as one release to a person but three identical lines
// to a list (quote-exclusion already stops a reply inheriting one).
function dedupeReleases(rows) {
    const seen = new Set();
    return rows.filter((row) => {
        const key = [row.author, row.version || row.build || "", row.kinds.join("+"), row.links].join("|");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// phpBB hands out post ids in order, so the highest one is the newest.
function newestPostId(list) {
    let best = 0;
    for (const post of list) {
        const id = Number(post.id);
        if (Number.isFinite(id) && id > best) best = id;
    }
    return best;
}

function releasesOnThisPage(page) {
    return dedupeReleases(
        posts()
            .map((post) => describeRelease(post, page))
            .filter(Boolean)
            .reverse());
}

// The parsed copy is only ever read, never inserted — parseDocument()
// survives Trusted Types on that basis; where even it can't, this throws
// and the walk reports the lost page instead of dying inside a click handler.
async function fetchTopicPage(href, page) {
    const response = await fetch(href, { credentials: "same-origin" });
    if (!response.ok) {
        const err = new Error("page " + page + " returned " + response.status);
        err.status = response.status;
        throw err;
    }

    // The whole page is parsed rather than a slice cut out of it: measured
    // at 2.4ms full vs 1.5ms for just the posts block, against 417ms of
    // network per page — not a trade worth the fragility of a markup cut.
    const doc = parseDocument(await response.text());
    if (!doc) throw new Error("page " + page + " could not be parsed");
    return readTopicPage(posts(doc), page);
}

function readTopicPage(found, page) {
    const ids = found.map((post) => Number(post.id)).filter(Number.isFinite);
    return {
        page,
        rows: found.map((post) => describeRelease(post, page)).filter(Boolean),
        // Every post, not just releases — a page of pure chatter still
        // means the topic moved on.
        newest: ids.length ? Math.max.apply(null, ids) : 0,
        // Tells "gained replies" from "posts deleted, everything shifted a
        // page" on a later visit.
        first: ids.length ? Math.min.apply(null, ids) : 0,
        count: found.length,
    };
}

// phpBB paginates by post index, so a reply only changes the last page —
// reading a topic twice is nearly free, except a *deleted* post shifts
// every page after it. So each page is kept with the id it opens on; a
// rescan re-reads the last page (new replies) and the highest page below it
// as a canary — if its opening post hasn't changed, nothing moved.
// 4 topics kept was leaving a reader who checks five threads paying for the
// first one twice; raised to 8 after measuring the board's real cost: it
// queues rather than 429s, answering ~165ms/page at 3 in flight but only
// ~1.8s/page once its burst budget runs out regardless of concurrency — so
// there's no concurrency to win, only fewer requests, hence this cache. A
// whole topic's pages are a few tens of KB, well within either backing store.
const RELEASE_PAGES_KEY = "topicPages";
const RELEASE_PAGES_TOPICS = 8;

function pageCache(topicId) {
    const all = store.get(RELEASE_PAGES_KEY, {});
    const entry = all[String(topicId)];
    return entry && entry.pages ? entry : null;
}

function rememberPages(topicId, pages, total) {
    const all = store.get(RELEASE_PAGES_KEY, {});
    all[String(topicId)] = { at: Date.now(), total: total, pages: pages };

    const keys = Object.keys(all);
    if (keys.length > RELEASE_PAGES_TOPICS) {
        keys.sort((a, b) => (all[a].at || 0) - (all[b].at || 0));
        for (const key of keys.slice(0, keys.length - RELEASE_PAGES_TOPICS)) delete all[key];
    }
    store.set(RELEASE_PAGES_KEY, all);
}

// Returns the pages to fetch in reading order, plus the canary whose answer
// decides whether the kept pages may still be believed.
function planWalk(topicId, info, total, depth, order) {
    const current = info.current || 1;
    const kept = PAGE.topicId ? pageCache(topicId) : null;
    const known = kept && kept.pages ? kept.pages : {};

    const reusable = (page) => {
        if (page === current) return false;              // read from the DOM, free
        if (page === total) return false;                // where new replies land
        if (page === kept.total) return false;           // was the last page when kept
        return Boolean(known[String(page)]);
    };

    const reuse = [];
    let want = [];
    for (let page = 1; page <= total; page += 1) {
        if (page === current) continue;
        if (kept && reusable(page)) reuse.push(page);
        else want.push(page);
    }

    // The furthest-down reused page shows a deleted post's shift soonest.
    const canary = reuse.length ? reuse[reuse.length - 1] : null;
    if (canary !== null && !want.includes(canary)) want.push(canary);

    // Newest first by default — "which version is it on now" is answered at
    // the end of the topic, and reading forward would arrive there last (a
    // quarter hour late on a 429-page topic). Oldest first is the other real
    // question and a user choice, not a rule. Either way page 1 goes first:
    // it's the thread's index (current links live there) and costs one
    // request either way.
    want.sort(order === "oldest" ? (a, b) => a - b : (a, b) => b - a);
    const first = want.indexOf(1);
    if (first > 0) {
        want.splice(first, 1);
        want.unshift(1);
    }

    // One pass, not the whole topic — leftovers are offered, see
    // RELEASE_PASS_PAGES.
    let deferred = 0;
    if (want.length > depth) {
        const keep = want.slice(0, depth);
        if (canary !== null && !keep.includes(canary)) keep.push(canary);
        deferred = want.length - keep.length;
        want = keep;
    }

    return { reuse: reuse, fetch: want, known: known, canary: canary, deferred: deferred };
}

// At most pace.inFlight at once, never two started closer than pace.gap.
// The next slot is reserved before waiting, not measured after, so workers
// can't each independently decide it's their turn.
async function pacedPool(items, worker, state, pace) {
    const results = new Array(items.length);
    let next = 0;
    let slot = 0;
    let running = 0;

    const run = async () => {
        while (next < items.length && !state.cancelled && !state.stopped) {
            // A mid-walk back-off has to stand down already-running workers
            // too, not just ones not yet started.
            if (running > pace.inFlight) return;
            const index = next;
            next += 1;
            running += 1;
            const now = Date.now();
            const at = Math.max(now, slot);
            slot = at + pace.gap;
            if (at > now) await new Promise((done) => setTimeout(done, at - now));
            if (state.cancelled || state.stopped) { running -= 1; return; }

            const started = Date.now();
            try {
                results[index] = await worker(items[index], index);
            } finally {
                notePace(pace, Date.now() - started);
                running -= 1;
            }
        }
    };

    // A back-off or a recovery (raising the ceiling) both leave items
    // unclaimed; each loop turn re-launches workers at whatever the pace is
    // by then and claims at least one item, since nothing stands down while
    // none is running.
    while (next < items.length && !state.cancelled && !state.stopped) {
        const workers = Math.min(pace.inFlight, items.length - next);
        await Promise.all(Array.from({ length: workers }, run));
    }
    return results;
}

function rowsFromPages(pages, total) {
    const found = [];
    const seen = new Set();
    for (let page = total; page >= 1; page -= 1) {
        const entry = pages[String(page)];
        if (!entry) continue;
        for (const row of entry.rows) {
            if (seen.has(row.id)) continue;
            seen.add(row.id);
            found.push(row);
        }
    }
    found.sort((a, b) => (b.page - a.page) || (Number(b.id) - Number(a.id)));
    return dedupeReleases(found);
}

// The current page is never fetched, nor is anything already cached unless
// the canary says it moved. `onRows` fires on every page landed, not just at
// the end — a walk is minutes of work, and starting from the newest page
// means the first row appears on the first answer.
async function walkTopic(info, state, onProgress, onRows) {
    const total = info.total || 1;
    const current = info.current || 1;
    const plan = planWalk(PAGE.topicId, info, total, RELEASE_PASS_PAGES, state.order);
    const pace = makePace();
    const reused = new Set(plan.reuse);

    const read = new Map();
    read.set(current, readTopicPage(posts(), current));

    // Everything held right now: read this time, or believed from last.
    const gather = () => {
        const pages = {};
        for (let page = 1; page <= total; page += 1) {
            const fresh = read.get(page);
            const entry = fresh || (reused.has(page) ? plan.known[String(page)] : null);
            if (!entry) continue;
            pages[String(page)] = { rows: entry.rows, first: entry.first, newest: entry.newest, count: entry.count };
        }
        return pages;
    };

    let done = 0;
    const of = plan.fetch.length + plan.reuse.length + 1;
    const say = () => onProgress(Math.min(of, done + plan.reuse.length + 1), of);
    const show = () => { if (onRows) onRows(rowsFromPages(gather(), total)); };
    say();
    show();

    const fetchOne = async (page) => {
        const href = pageHref(page);
        if (!href) return null;
        try {
            const result = await fetchTopicPage(href, page);
            read.set(page, result);
            return result;
        } catch (err) {
            // Stop rather than retry into a "not so fast" from the board.
            if (RELEASE_BACK_OFF.includes(err.status)) state.stopped = err.status;
            console.warn("[RIN Reforged] topic index:", err);
            return null;
        } finally {
            done += 1;
            say();
            show();
        }
    };

    await pacedPool(plan.fetch, fetchOne, state, pace);

    // The canary was already fetched with everything else; if its opening
    // post changed, something above it was deleted and every page between
    // is off by one — drop the cache and read the topic again from scratch.
    let shifted = false;
    if (plan.canary !== null && !state.cancelled && !state.stopped) {
        const fresh = read.get(plan.canary);
        const held = plan.known[String(plan.canary)];
        shifted = Boolean(fresh && held && held.first && fresh.first !== held.first);
    }

    if (shifted) {
        if (PAGE.topicId) store.set(RELEASE_PAGES_KEY,
            Object.assign({}, store.get(RELEASE_PAGES_KEY, {}), { [String(PAGE.topicId)]: undefined }));
        const again = Object.assign({}, info);
        return walkTopic(again, Object.assign(state, { retried: true }), onProgress, onRows);
    }

    const pages = gather();
    let newest = 0;
    let scanned = 0;
    for (const key of Object.keys(pages)) {
        newest = Math.max(newest, pages[key].newest || 0);
        scanned += 1;
    }

    const pending = Math.max(0, total - scanned);
    const complete = !state.cancelled && !state.stopped && pending === 0;

    // Kept even on a partial walk — used to only save on completion, so a
    // walk stopped by Escape/503/pass-end kept nothing. Safe because the
    // canary already guards against a stale set; `scanned > 1` excludes
    // the always-present current page from counting as a save-worthy read.
    if (PAGE.topicId && scanned > 1) rememberPages(PAGE.topicId, pages, total);

    return {
        rows: rowsFromPages(pages, total),
        done: complete,
        scanned: scanned,
        pending: pending,
        newest: newest,
        // How much of this answer came from the cache rather than the
        // board — the whole point of keeping it.
        fetched: plan.fetch.length,
        reused: plan.reuse.length,
        refused: state.stopped || null,
        eased: pace.everEased,
    };
}

function releaseCache() { return store.get(RELEASE_CACHE_KEY, {}); }

function cachedIndex(topicId) {
    const entry = releaseCache()[String(topicId)];
    return entry && Array.isArray(entry.rows) ? entry : null;
}

function rememberIndex(topicId, payload) {
    const all = releaseCache();
    all[String(topicId)] = Object.assign({ at: Date.now() }, payload);

    const keys = Object.keys(all);
    if (keys.length > RELEASE_CACHE_TOPICS) {
        keys.sort((a, b) => (all[a].at || 0) - (all[b].at || 0));
        for (const key of keys.slice(0, keys.length - RELEASE_CACHE_TOPICS)) delete all[key];
    }
    store.set(RELEASE_CACHE_KEY, all);
}

function agoText(at) {
    const seconds = Math.max(0, Math.round((Date.now() - at) / 1000));
    if (seconds < 90) return t("just now");
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return t("{n} minutes ago", { n: minutes });
    const hours = Math.round(minutes / 60);
    if (hours < 36) return hours === 1 ? t("1 hour ago") : t("{n} hours ago", { n: hours });
    return t("{n} days ago", { n: Math.round(hours / 24) });
}

function pagesReadText(n) {
    return n === 1 ? t("1 page read") : t("{n} pages read", { n });
}

// Compared as numbers per part (1.10 after 1.9), except a 2-digit part with
// a leading zero (1.06) is split into two — the board writes the same
// release as both "1.0.6" and "1.06", and reading "1.06" as one number beat
// 1.0.7 on the second digit, announcing 1.06 as newest when 1.0.7 existed.
// 1.10 has no leading zero and stays ten. Comparison only — the row still
// shows what was written.
function versionRank(version) {
    if (!version) return null;
    const parts = [];
    for (const part of version.split(".")) {
        if (/^0\d$/.test(part)) parts.push(0, parseInt(part, 10));
        else parts.push(parseInt(part, 10) || 0);
    }
    return parts;
}

function versionNewer(a, b) {
    const left = versionRank(a);
    const right = versionRank(b);
    if (!left) return false;
    if (!right) return true;
    for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
        const x = left[i] || 0;
        const y = right[i] || 0;
        if (x !== y) return x > y;
    }
    return false;
}

// Not every version in a topic is the game's — "v1.6.0 or later
// AchievementOverlay" once beat 1.0.7 on the second digit and got announced
// as the game's version. Only rows whose kind is about the game (not
// beside it, like a trainer/cheat table/overlay) can set the headline.
const VERSION_EVIDENCE = new Set(["game", "run", "change", "extra", "block"]);

function saysGameVersion(row) {
    return row.kinds.some((kind) => VERSION_EVIDENCE.has(releaseFamily(kind)));
}

// Build ids are excluded (an 8-digit "build 24127279" beats every real
// version). VERSION_CROWD guards against one typo setting the headline: off
// the live board, "V270.1" (a dropped "3." from 3.270.1) beat everything on
// the first digit. Told apart from a real release by company — a first
// part used by only one row can't set the headline while another is used
// by several — but only once some first part has 3+ rows (an established
// thread), so a genuinely new major version isn't held back forever.
const VERSION_CROWD = 3;

// Black Flag's 1.0.x releases (17 rows) share a first part with a stray
// "v1.6.0" overlay recommendation that beats them on the second digit —
// invisible if only the first part is compared. So the crowd check runs
// twice: on the first part (throws out Peacock's 6.x/8.x in a 3.x topic)
// and the first two (throws out 1.6 in a 1.0 topic), both held to
// VERSION_CROWD so a small topic or a new major line is left alone.
function versionLine(version, parts) {
    return versionRank(version).slice(0, parts).join(".");
}

function commonest(counts) {
    let best = null;
    let most = 0;
    for (const [key, count] of counts) {
        if (count > most) { most = count; best = key; }
    }
    return { key: best, count: most };
}

function countLines(rows, parts) {
    const counts = new Map();
    for (const row of rows) {
        const line = versionLine(row.version, parts);
        counts.set(line, (counts.get(line) || 0) + 1);
    }
    return counts;
}

// How many of the newest rows must agree before a line nobody else is on
// becomes the answer — a move from 1.x to 2.0 is alone on its line by
// definition, so holding it back forever would be worse than the noise
// this guards against.
const VERSION_RECENT = 3;

function latestVersion(rows) {
    const candidates = rows.filter((row) =>
        // A bare/companion-product number is shown on its row but isn't
        // evidence about the game; see versionsIn().
        row.version && row.versionNamed !== false && !row.versionTheirs && saysGameVersion(row));
    if (!candidates.length) return null;

    // The thread's overall line, or the newest posts' line if enough agree
    // — letting a new major version through without waiting to outnumber
    // the old one.
    const newest = candidates.slice()
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, VERSION_RECENT);
    const recent = newest.length >= VERSION_RECENT && new Set(newest.map((row) => versionLine(row.version, 1))).size === 1
        ? versionLine(newest[0].version, 1)
        : null;

    const majors = countLines(candidates, 1);
    const lead = commonest(majors);
    const line = recent || (lead.count >= VERSION_CROWD ? lead.key : null);
    const online = line === null
        ? candidates
        : candidates.filter((row) => versionLine(row.version, 1) === line);

    // Same question one digit down, but only when the minor line holds most
    // of the rows on its major — Black Flag's 22 releases are all on 1.0
    // with one outlier on 1.6, but HITMAN 3 moves its minor every release
    // (3.11, 3.20, ... 3.260) and each is alone on its line; without the
    // majority test that second shape lost every version past 3.120.
    const minors = countLines(online, 2);
    const minor = commonest(minors);
    const kept = minor.count >= VERSION_CROWD && minor.count * 2 > online.length
        ? online.filter((row) => minors.get(versionLine(row.version, 2)) > 1)
        : online;

    let best = null;
    for (const row of (kept.length ? kept : online)) {
        if (versionNewer(row.version, best)) best = row.version;
    }
    return best;
}

// A version, a build id and nothing at all used to read as three variations
// of the same thing (v3.10.5, an unlabelled em dash, #24833802, same
// weight, same column). Now each says what it is: a build is labelled
// `build` so it's never mistaken for a bigger version, and nothing is an
// empty state rather than bare punctuation.
function releaseVersion(row, latest) {
    if (row.version) {
        const node = el("span.rr-releases__version", { "data-rr-kind": "version" }, ["v" + row.version]);
        if (row.version === latest) {
            node.setAttribute("data-rr-latest", "");
            node.setAttribute("title", "The highest version posted in this topic");
        }
        return node;
    }
    if (row.build) {
        return el("span.rr-releases__version", {
            "data-rr-kind": "build",
            title: t("Steam build {n}, which is not a version number", { n: row.build }),
        }, [
            el("span.rr-releases__vkind", {}, [t("build")]),
            row.build,
        ]);
    }
    return el("span.rr-releases__version", {
        "data-rr-kind": "none",
        title: t("No version given in this post"),
        "aria-label": t("No version given"),
    }, [el("span.rr-releases__vnone", { "aria-hidden": "true" }, ["\u2014"])]);
}

function releaseRow(row, latest) {
    const href = pageHref(row.page);
    const target = href ? href.replace(/#.*$/, "") + "#p" + row.id : "#p" + row.id;

    const tags = el("span.rr-releases__tags");
    for (const [i, text] of row.labels.entries()) {
        tags.append(el("span.rr-releases__tag", {
            "data-kind": row.kinds[i],
            "data-family": releaseFamily(row.kinds[i]),
        }, [t(text)]));
    }
    if (!row.labels.length && row.links) {
        tags.append(el("span.rr-releases__tag", { "data-kind": "link", "data-family": "other" }, [
            t(row.links === 1 ? "{n} link" : "{n} links", { n: row.links }),
        ]));
    }

    const hosts = el("span.rr-releases__hosts");
    for (const name of (row.hosts || []).slice(0, 3)) {
        hosts.append(el("span.rr-releases__host", {}, [name]));
    }
    if ((row.hosts || []).length > 3) {
        hosts.append(el("span.rr-releases__host.rr-releases__host--more", {
            title: row.hosts.join(", "),
        }, ["+" + (row.hosts.length - 3)]));
    }

    const when = row.date || "";
    const link = el("a.rr-releases__link", { href: target, title: row.excerpt }, [
        releaseVersion(row, latest),
        tags,
        hosts,
        el("span.rr-releases__who", {}, [row.author]),
        el("span.rr-releases__when", { title: when }, [shortenPostMeta(when)]),
        el("span.rr-releases__page", {}, [t("p.") + row.page]),
    ]);

    // On the current page, scrolls and flashes the post; otherwise it's an
    // ordinary link, middle-click and all.
    link.addEventListener("click", (event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.button) return;
        const anchor = document.querySelector('a[name="p' + row.id + '"]');
        const table = anchor && anchor.closest("table.tablebg");
        if (!table) return;
        event.preventDefault();
        table.scrollIntoView({ behavior: scrollBehaviour(), block: "start" });
        flash(table);
    });
    return el("li.rr-releases__row", { "data-kinds": row.kinds.join(" "), "data-links": String(row.links || 0) }, [link]);
}

// Only kinds actually present (not 11 chips where 9 match nothing) and only
// ones that narrow something — a single release tagged Crack/Hypervisor/
// DLC/Update once drew four chips above the one row they all matched, since
// a kind on every row (or a list of one) selects nothing.
function releaseFilters(rows, list, onCount) {
    const present = new Map();
    const matching = new Map();
    for (const row of rows) {
        // Rows, not mentions: a row that names a kind twice still only
        // counts once against "does this chip select the whole list".
        const seen = new Set();
        for (const [i, id] of row.kinds.entries()) {
            present.set(id, t(row.labels[i]));
            if (seen.has(id)) continue;
            seen.add(id);
            matching.set(id, (matching.get(id) || 0) + 1);
        }
    }
    for (const [id, count] of matching) {
        if (count >= rows.length) present.delete(id);
    }
    if (rows.length < 2 || present.size < 2) return null;

    const bar = el("div.rr-releases__filters", { role: "group", "aria-label": t("Filter by kind") });
    let active = null;

    const apply = () => {
        let shown = 0;
        for (const node of list.children) {
            const kinds = (node.getAttribute("data-kinds") || "").split(" ");
            const visible = !active || kinds.includes(active);
            node.hidden = !visible;
            if (visible) shown += 1;
        }
        onCount(shown, Boolean(active));
    };

    for (const [id, label] of Array.from(present.entries()).sort((a, b) => a[1].localeCompare(b[1]))) {
        // Same colour as the matching tag below — grey chips over coloured
        // tags would read as two vocabularies. Held back unpressed, filled
        // in pressed.
        const chip = el("button.rr-releases__chip", {
            type: "button",
            "data-kind": id,
            "data-family": releaseFamily(id),
            "aria-pressed": "false",
        }, [label]);
        chip.addEventListener("click", () => {
            active = active === id ? null : id;
            for (const other of bar.children) {
                other.setAttribute("aria-pressed", other.dataset.kind === active ? "true" : "false");
            }
            apply();
        });
        bar.append(chip);
    }
    return bar;
}

function initReleases() {
    if (!PAGE.isTopic || !settings.get("finder")) return;

    const all = posts();
    if (all.length < 3) return;

    const info = pagination();
    const page = info.current || 1;
    const total = info.total || 1;
    const pageRows = releasesOnThisPage(page);

    const canWalk = Boolean(settings.get("topicIndex"));
    const multi = total > 1;
    const kept = canWalk && PAGE.topicId ? cachedIndex(PAGE.topicId) : null;

    // No panel at all for a one-page topic with nothing to show — a card
    // saying "nothing here reads as a release" is noise. A multi-page topic
    // is different: the panel is the only way to read the rest of it, and
    // chatter on this page says nothing about page three.
    if (!pageRows.length && !kept && !(canWalk && multi)) return;

    // Page count changing used to be the only staleness signal, so a topic
    // that gained replies without gaining a page showed a stale index with
    // no hint. phpBB hands out post ids in order, so any post here past the
    // walk's highest seen id proves there are newer ones — a floor, not an
    // exact count, hence "at least".
    const hereNewest = newestPostId(all);
    const staleBy = kept && kept.newest
        ? all.filter((post) => Number(post.id) > kept.newest).length
        : 0;

    // Rebuilt on scope change rather than kept as two copies — a hidden
    // second list with its own rows/filters/counts is a second thing to
    // keep in step.
    const panel = el("section.rr-releases", { "aria-label": t("Releases in this topic") });
    const state = { cancelled: false, stopped: null, scope: "page", topic: kept, order: releaseOrder() };

    const count = el("span.rr-releases__count");
    const scope = el("div.rr-releases__scope", { role: "tablist", "aria-label": t("How much to look at") });

    // Both tabs always drawn — a single segment of a segmented control
    // reads as a label with a box around it, not a control. On a one-page
    // topic the second is disabled and says why, rather than not existing.
    const pageTab = el("button.rr-releases__tab", { type: "button", role: "tab" }, [t("This page")]);
    const topicLabel = t(total === 1 ? "All {n} page" : "All {n} pages", { n: total });
    const topicTab = el("button.rr-releases__tab", { type: "button", role: "tab" }, [topicLabel]);
    if (!canWalk || !multi) {
        topicTab.disabled = true;
        topicTab.setAttribute("data-rr-why", "");
        topicTab.setAttribute("title", !canWalk
            ? t("Reading a whole topic is switched off in the settings")
            : t("This topic is one page — you are looking at all of it"));
    }
    scope.append(pageTab, topicTab);

    // Beside the scope control since it qualifies it ("All 429 pages,
    // newest first" is one sentence). Only drawn where it decides
    // something — not on a one-page topic or with the walk switched off.
    const orderSeg = el("div.rr-seg.rr-releases__order", {
        role: "group", "aria-label": t("Which end to read from"),
    });
    const syncOrder = () => {
        for (const button of orderSeg.children) {
            button.setAttribute("aria-pressed", button.dataset.value === state.order ? "true" : "false");
        }
    };
    for (const option of [
        { value: "newest", label: t("Newest first"), hint: t("Start at the last page and work back") },
        { value: "oldest", label: t("Oldest first"), hint: t("Start at page one and work forward") },
    ]) {
        const button = el("button", { type: "button", title: option.hint }, [option.label]);
        button.dataset.value = option.value;
        button.addEventListener("click", () => {
            if (state.order === option.value) return;
            state.order = option.value;
            store.set(RELEASE_ORDER_KEY, option.value);
            syncOrder();
            render();
        });
        orderSeg.append(button);
    }
    syncOrder();

    // Used to sit in a strip at the bottom while the scope control was in
    // the head — the two things that decide what's shown are one group now.
    const linkFilter = buildLinkFilter(all, pageRows);
    linkFilter.classList.add("rr-releases__only");

    const copyList = labelled(
        el("button.rr-icon-btn.rr-releases__copy", { type: "button" }, [icon("copy", 14)]),
        t("Copy this list"));
    copyList.addEventListener("click", () => {
        const lines = Array.from(document.querySelectorAll(".rr-releases__list > li"))
            .filter((item) => !item.hasAttribute("data-rr-hidden") && item.getClientRects().length)
            .map((item) => {
                const link = item.querySelector("a");
                const cell = (name) => {
                    const node = item.querySelector(".rr-releases__" + name);
                    return node ? node.textContent.replace(/\s+/g, " ").trim() : "";
                };
                const parts = [cell("version") || "\u2014", cell("tags"), cell("hosts"), cell("who"), cell("when")]
                    .filter(Boolean);
                const href = link ? new URL(link.getAttribute("href"), location.href).href : "";
                return parts.join(" \u00b7 ") + (href ? "  " + href : "");
            });
        if (!lines.length) return;
        copyText(document.title.replace(/^.*?View topic - /, "") + "\n" + lines.join("\n"),
            t("{n} lines copied", { n: lines.length }));
    });

    const body = el("div.rr-releases__body");

    // Folded, the panel is one line saying how many releases there are —
    // for a topic read for the conversation, the unfolded card between the
    // bar and the first post says nothing the reader came for. Remembered
    // per browser, for every topic.
    let open = store.get("releasesOpen", true) !== false;
    const fold = el("button.rr-releases__toggle", { type: "button" }, [
        icon("chevronD", 14),
        icon("layers", 14),
        el("h3", {}, [t("Releases")]),
        count,
    ]);
    const syncFold = () => {
        panel.toggleAttribute("data-rr-folded", !open);
        fold.setAttribute("aria-expanded", open ? "true" : "false");
        fold.setAttribute("title", t(open ? "Fold the Releases panel" : "Open the Releases panel"));
        body.hidden = !open;
    };
    fold.addEventListener("click", () => {
        open = !open;
        store.set("releasesOpen", open);
        syncFold();
    });

    panel.append(
        el("div.rr-releases__head", {}, [
            fold,
            el("div.rr-releases__controls", {}, [scope, canWalk && multi ? orderSeg : null, linkFilter, copyList]),
        ]),
        body,
    );
    syncFold();

    const setCount = (shown, filtered, rows, scoped) => {
        count.textContent = filtered
            ? shown + " of " + rows.length
            : t(rows.length === 1 ? "{n} release" : "{n} releases", { n: rows.length }) + (scoped ? "" : t(" on this page"));
    };

    // Repainted as pages land, throttled to 3/sec so 60 pages isn't 60 full
    // repaints. A full render() redraws filter chips too, so a chip pressed
    // mid-walk comes back unpressed on the next page — a fair trade for not
    // keeping two list-drawing paths in sync.
    let painted = 0;
    const paint = (rows, force) => {
        state.topic = Object.assign(state.topic || {}, { rows: rows, total: total });
        const now = Date.now();
        if (!force && now - painted < 350) return;
        painted = now;
        state.scope = "topic";
        render();
    };

    const walk = () => {
        state.cancelled = false;
        state.stopped = null;
        topicTab.disabled = true;
        topicTab.setAttribute("aria-busy", "true");
        // Direction is locked mid-walk — changing it would only affect the
        // list, which would read as the walk turning round.
        for (const button of orderSeg.children) button.disabled = true;
        state.topic = {
            at: Date.now(), rows: (state.topic && state.topic.rows) || [],
            scanned: 0, done: false, total: total, live: true,
        };

        const finish = () => {
            topicTab.disabled = false;
            topicTab.removeAttribute("aria-busy");
            topicTab.textContent = topicLabel;
            for (const button of orderSeg.children) button.disabled = false;
            if (state.topic) state.topic.live = false;
        };

        walkTopic(info, state, (at, of) => {
            topicTab.textContent = t("Reading {a} of {b}…", { a: at, b: of });
            if (state.topic) state.topic.scanned = at;
        }, (rows) => paint(rows)).then((result) => {
            finish();
            state.topic = {
                at: Date.now(), rows: result.rows, scanned: result.scanned,
                done: result.done, total: total, pending: result.pending,
                newest: Math.max(result.newest || 0, hereNewest),
                fetched: result.fetched, reused: result.reused,
                eased: result.eased,
            };
            if (PAGE.topicId) rememberIndex(PAGE.topicId, state.topic);
            if (result.refused) toast(t("The board asked for a slower pace, so the topic was only read this far"));
            state.scope = "topic";
            render();
        }).catch((err) => {
            finish();
            console.warn("[RIN Reforged] topic index:", err);
            toast(t("Could not read the whole topic"));
            // Otherwise the panel is left saying "reading…" for good.
            render();
        });
    };

    const render = () => {
        body.textContent = "";
        pageTab.setAttribute("aria-selected", state.scope === "page" ? "true" : "false");
        topicTab.setAttribute("aria-selected", state.scope === "topic" ? "true" : "false");

        const scoped = state.scope === "topic";
        // Both scopes read in the panel's chosen direction, so the control
        // means one thing, not two.
        const rows = inReadingOrder(scoped ? (state.topic ? state.topic.rows : []) : pageRows, state.order);
        const latest = scoped ? latestVersion(rows) : null;

        if (scoped && state.topic) {
            const live = Boolean(state.topic.live);
            const pending = state.topic.pending || 0;

            const again = el("button.rr-btn", { type: "button", "data-variant": "quiet", disabled: live || null }, [
                icon("layers", 12), t("Read it again"),
            ]);
            again.addEventListener("click", walk);

            // Offered rather than dropped — used to just say "the oldest
            // 348 pages were not read" in small text and stop there.
            const more = pending && !live
                ? el("button.rr-btn", { type: "button", "data-variant": "quiet" }, [
                    icon("arrowDown", 12),
                    t("Read {n} more", { n: Math.min(pending, RELEASE_PASS_PAGES) }),
                ])
                : null;
            if (more) {
                more.setAttribute("title",
                    t("Keep going back through the topic, {n} pages at a time", { n: RELEASE_PASS_PAGES }));
                more.addEventListener("click", walk);
            }
            // One sentence, not three spans run together — read aloud those
            // came out as "Latest posted: v1.10.05 pages read".
            const said = [
                latest ? t("Latest posted: version {v}", { v: latest }) : null,
                pagesReadText(state.topic.scanned || 0),
                live ? t("still reading") : null,
                pending && !live ? t("{n} pages have not been read yet", { n: pending }) : null,
                live || pending || state.topic.done ? null : t("stopped early"),
                state.topic.eased ? t("the board was busy, so this was read slowly") : null,
                live ? null : t("read {ago}", { ago: agoText(state.topic.at || Date.now()) }),
                staleBy ? t("{n} new since", { n: staleBy }) : null,
            ].filter(Boolean).join(". ");

            // One group now — used to be opposite ends of the card, the
            // fact on the left and the button that changes it 900px away.
            body.append(el("div.rr-releases__note", { role: "status", "aria-label": said }, [
                latest ? el("span.rr-releases__latest", { "aria-hidden": "true" }, [t("Latest posted: v{v}", { v: latest })]) : null,
                el("span.rr-spacer"),
                el("div.rr-releases__read", {}, [
                    el("span", { "aria-hidden": "true" }, [
                        pagesReadText(state.topic.scanned || 0),
                        live ? " · " + t("reading…") : "",
                        pending && !live ? " · " + t("{n} left", { n: pending }) : "",
                        live || pending || state.topic.done ? "" : " · " + t("stopped early"),
                        live ? "" : " · " + agoText(state.topic.at || Date.now()),
                    ].join("")),
                    // Distinguishes an eased-off walk from one that hung.
                    state.topic.eased
                        ? el("span.rr-releases__eased", {
                            "aria-hidden": "true",
                            title: t("The board was answering slowly, so this was read a couple of pages at a time"),
                        }, [t("read gently")])
                        : null,
                    staleBy
                        ? el("span.rr-releases__stale", { "aria-hidden": "true" }, [
                            staleBy === 1 ? t("1 newer post since") : t("{n} newer posts since", { n: staleBy }),
                        ])
                        : null,
                    more,
                    again,
                ]),
            ]));
        }

        const list = el("ol.rr-releases__list");
        for (const row of rows) list.append(releaseRow(row, latest));

        const filters = releaseFilters(rows, list, (shown, filtered) => setCount(shown, filtered, rows, scoped));
        if (filters) body.append(filters);
        body.append(list);

        if (!rows.length) {
            body.append(el("p.rr-releases__empty", {}, [
                "Nothing here reads as a release. That is usually right for a discussion thread.",
            ]));
        }
        setCount(rows.length, false, rows, scoped);
    };

    pageTab.addEventListener("click", () => { state.scope = "page"; render(); });
    if (canWalk && multi) {
        topicTab.setAttribute("title",
            "Read all " + total + " pages once and list everything posted in this topic");
        topicTab.addEventListener("click", () => {
            if (topicTab.disabled) return;
            if (state.topic) { state.scope = "topic"; render(); return; }
            walk();
        });
    }

    // Stops a walk in progress rather than leaving it running.
    on(document, "keydown", (event) => {
        if (event.key === "Escape" && topicTab.disabled && topicTab.hasAttribute("aria-busy")) {
            state.cancelled = true;
            toast(t("Stopped reading the topic"));
        }
    });

    // An earlier index reopens on the whole topic (what was last asked
    // for); one from before the topic gained pages is dropped instead.
    if (kept && kept.total === total) state.scope = "topic";
    else if (kept) state.topic = null;
    render();

    const anchor = document.querySelector("#pagecontent") || document.querySelector("#wrapcentre");
    if (anchor) anchor.prepend(panel);
}

/* ================= src/modules/quotes.js ================= */
/* Folding quotes: other scripts fix long quoted replies by rebuilding the
   quote node, which loses links/nested quotes and breaks under Trusted
   Types. This only clips with overflow+mask, so the DOM, a11y tree and
   find-in-page stay intact. */

/** Quote blocks in post content, outermost first. Excludes spoilers, which
    also wear `.quotecontent` on this board and already fold themselves. */
function quoteBlocks(root = document) {
    return Array.from(root.querySelectorAll(".postbody .quotecontent, .postbody blockquote"))
        .filter((node) => !(node.parentElement && node.parentElement.classList.contains("spoiler")));
}

/** The heading above a quote ("Someone wrote:"): subsilver2's div.quotetitle,
    or a <blockquote>'s own <cite> — the toggle joins whichever exists. */
function quoteHeading(quote) {
    const previous = quote.previousElementSibling;
    if (previous && previous.classList.contains("quotetitle")) return previous;
    const cite = quote.firstElementChild;
    if (cite && cite.tagName === "CITE") return cite;
    return null;
}

/** Fold height for this quote, or null if it fits within `lines`. Reads
    only — see initQuotes for why reads and writes are kept apart. */
function measureQuote(quote, lines) {
    if (quote.hasAttribute("data-rr-quote")) return null;

    // scrollHeight includes padding but max-height (below) is content-box;
    // subtract padding here or a quote right at the limit gets folded to a
    // box it already fits.
    const style = getComputedStyle(quote);
    const lineHeight = parseFloat(style.lineHeight) || 20;
    const padding = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
    const content = quote.scrollHeight - padding;
    const limit = lineHeight * lines;
    if (content <= limit + lineHeight * 0.5) return null; // half a line of slack
    return limit;
}

/** Fold one quote to `limit` pixels, with the control to open it. Writes only. */
function foldQuote(quote, limit) {
    quote.setAttribute("data-rr-quote", "folded");
    quote.style.setProperty("--rr-quote-max", limit + "px");

    const label = () => (quote.getAttribute("data-rr-quote") === "folded" ? "Show the rest" : "Fold this quote");

    const toggle = el("button.rr-quote-toggle", {
        type: "button",
        "aria-expanded": "false",
    }, [icon("chevronD", 12), el("span", {}, [label()])]);

    const setOpen = (open) => {
        if (open) quote.removeAttribute("data-rr-quote");
        else quote.setAttribute("data-rr-quote", "folded");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.lastChild.textContent = label();
    };
    toggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        setOpen(quote.getAttribute("data-rr-quote") === "folded");
    });

    // Clicking the clipped body opens it too, not just the toggle; links stay links.
    quote.addEventListener("click", (event) => {
        if (quote.getAttribute("data-rr-quote") !== "folded") return;
        if (event.target.closest("a, button, input, textarea, select")) return;
        setOpen(true);
    });

    const heading = quoteHeading(quote);
    if (heading) heading.append(toggle);
    else quote.before(toggle);

    return true;
}

function initQuotes() {
    if (!PAGE.isTopic || !settings.get("foldQuotes")) return;

    const lines = clamp(Number(settings.get("foldQuotesLines")) || 6, 3, 16);

    // All quotes measured first, then folded — interleaving read/write forces a layout per quote.
    const plan = quoteBlocks().map((quote) => ({ quote, limit: measureQuote(quote, lines) }));

    let folded = 0;
    for (const { quote, limit } of plan) {
        if (limit === null) continue;
        // Skip quotes already hidden inside an outer fold (outermost fold first, in document order).
        if (quote.parentElement && quote.parentElement.closest('[data-rr-quote="folded"]')) continue;
        foldQuote(quote, limit);
        folded += 1;
    }
    return folded;
}

/* ================= src/modules/quiet.js ================= */
/* Folds short low-value replies ("thanks!", "+1") that make long release
   threads hard to scroll through. Judged by content, not author (unlike
   prior art that hid non-trusted uploaders, which ages badly): a post
   with a link, version, code, image, question mark, or problem report is
   never folded, however short. Folded means hidden visually only — still
   in the DOM, accessibility tree and find-in-page. */
const QUIET_EXCLUDE_RE =
    /\b(dead|down|broken|offline|expired|removed|missing|error|crash(?:es|ing)?|fail(?:s|ed|ing)?|bug|fix(?:ed|es)?|issue|problem|virus|malware|help|404|not work|doesn'?t work|does not work|won'?t (?:start|launch|run)|please)\b/i;

/** Is this reply short enough, and empty enough, to fold? Every check below is a reason not to. */
function isQuietPost(post, limit) {
    const own = ownContent(post.body);
    const text = own.textContent.replace(/\s+/g, " ").trim();

    if (text.length > limit) return false;

    // A link, hidden or otherwise, is the whole reason this board exists.
    if (own.querySelector(".link_removed")) return false;
    for (const link of own.querySelectorAll("a[href]")) {
        if (isOffsite(link.getAttribute("href"))) return false;
    }

    if (post.body.querySelector(CODE_BLOCKS + ", .spoiler, pre, .attachtitle")) return false;

    // A screenshot is an answer; a smiley is not.
    for (const img of post.body.querySelectorAll("img")) {
        const src = img.getAttribute("src") || "";
        if (!/smilies|images\/smil|imageset/i.test(src)) return false;
    }

    if (VERSION_RE.test(text)) return false;
    if (text.includes("?")) return false;
    if (QUIET_EXCLUDE_RE.test(text)) return false;

    return true;
}

function setQuiet(post, folded) {
    post.table.toggleAttribute("data-rr-quiet", folded);
    const chip = post.table.querySelector(".rr-quiet-chip");
    if (chip) {
        chip.setAttribute("aria-expanded", folded ? "false" : "true");
        chip.lastChild.textContent = folded ? "Show" : "Fold";
    }
}

function attachQuiet(post) {
    const chip = el("button.rr-quiet-chip", {
        type: "button",
        "aria-expanded": "false",
        title: "This reply was folded because it is short and carries no link, version, image or question",
    }, [icon("fold", 11), el("span", {}, ["Show"])]);

    chip.addEventListener("click", (event) => {
        event.preventDefault();
        setQuiet(post, !post.table.hasAttribute("data-rr-quiet"));
    });

    // Clicking the clipped line opens it too, like a folded quote; the chip stays for the keyboard.
    post.body.addEventListener("click", (event) => {
        if (!post.table.hasAttribute("data-rr-quiet")) return;
        if (event.target.closest("a, button, input, textarea, select")) return;
        setQuiet(post, false);
    });

    post.body.before(chip);
    setQuiet(post, true);
}

/** One control in the topic bar reverses the whole fold at once. */
function buildQuietToggle(quiet) {
    let folded = true;
    const button = el("button.rr-btn", {
        type: "button",
        "data-variant": "quiet",
        "aria-pressed": "true",
        title: "Short replies carrying no link, version, image or question",
    }, [icon("fold", 13), quiet.length + " short " + (quiet.length === 1 ? "reply" : "replies")]);

    button.addEventListener("click", () => {
        folded = !folded;
        button.setAttribute("aria-pressed", folded ? "true" : "false");
        for (const post of quiet) setQuiet(post, folded);
        toast(folded ? "Short replies folded" : "Every reply shown");
    });
    return button;
}

function initQuiet() {
    if (!PAGE.isTopic || !settings.get("quietPosts")) return;

    const all = posts();
    if (all.length < 4) return;

    const limit = clamp(Number(settings.get("quietLimit")) || 120, 40, 400);
    const quiet = all.filter((post, index) => {
        // The topic's opening post sets it up, however short — never fold it.
        if (index === 0 && PAGE.start === 0) return false;
        return isQuietPost(post, limit);
    });

    // One fold isn't worth a control; folding nearly everything means the heuristic is wrong.
    if (quiet.length < 2 || quiet.length > all.length - 1) return;

    for (const post of quiet) attachQuiet(post);

    const bar = document.querySelector(".rr-topicbar");
    if (bar) {
        const row = bar.querySelector('.rr-topicbar__row[data-rr-row="here"]') || bar;
        const spacer = row.querySelector(".rr-topicbar__spacer");
        const control = buildQuietToggle(quiet);
        if (spacer) row.insertBefore(control, spacer);
        else row.append(control);
    }
    return quiet.length;
}

/* ================= src/modules/steam.js ================= */
/* Steam preview on hover. The cheap half reads an AppID already found
   on the game card and is free. The expensive half asks Steam about a
   game this browser hasn't seen; it leaves the page, so it's off by
   default and refused outright on the Tor mirror. */

const STEAM_APPS_KEY = "steamApps";       /* topic id -> AppID          */
const STEAM_DATA_KEY = "steamData";       /* AppID    -> { at, game }   */
const STEAM_MISS_KEY = "steamMisses";     /* title    -> { at, id }     */

const STEAM_HOVER_DELAY = 320;
const STEAM_HIDE_DELAY = 180;

/** Why a lookup will not happen, or null if it can. Distinguishing the
 * reasons matters: without GM_xmlhttpRequest the CSP (connect-src
 * 'self') silently rejected every request, so every game read as
 * "Steam has nothing under that name" with no way to tell which case. */
function steamBlockedBecause() {
    if (!settings.get("steamLookup")) return "off";
    if (/\.onion$/i.test(location.hostname)) return "tor";
    // connect-src 'self' exempts GM_xmlhttpRequest but not fetch (except in the test harness).
    if (typeof GM_xmlhttpRequest !== "function") return "nogrant";
    return null;
}

function steamRememberApp(topicId, appId) {
    if (!topicId || !appId) return;
    const map = store.get(STEAM_APPS_KEY, {});
    if (map[topicId] === String(appId)) return;
    map[String(topicId)] = String(appId);
    store.set(STEAM_APPS_KEY, map);
}

function steamAppForTopic(topicId) {
    return store.get(STEAM_APPS_KEY, {})[String(topicId)] || null;
}

/* A month: a game's tags and score don't change at a rate worth tuning for. */
const STEAM_CACHE_DAYS = 30;

function steamCacheMs() {
    return STEAM_CACHE_DAYS * 86400000;
}

function steamCached(appId) {
    const entry = store.get(STEAM_DATA_KEY, {})[String(appId)];
    if (!entry || !entry.game) return null;
    if (Date.now() - (entry.at || 0) > steamCacheMs()) return null;
    return entry.game;
}

function steamRemember(appId, game) {
    const all = store.get(STEAM_DATA_KEY, {});
    all[String(appId)] = { at: Date.now(), game };
    // Bounded, oldest first: a convenience cache, not an archive.
    const keys = Object.keys(all);
    if (keys.length > 300) {
        keys.sort((a, b) => (all[a].at || 0) - (all[b].at || 0));
        for (const key of keys.slice(0, keys.length - 300)) delete all[key];
    }
    store.set(STEAM_DATA_KEY, all);
}

/* CSP blocks fetch/XHR from the page (connect-src 'self'); GM_xmlhttpRequest
   is exempt, so it's the primary route here. fetch stays as a fallback for
   a manager that grants access another way, or a CSP-free context. */
function steamGet(url) {
    if (typeof GM_xmlhttpRequest === "function") {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url,
                timeout: 8000,
                headers: { Accept: "application/json" },
                onload: (res) => {
                    if (res.status < 200 || res.status >= 300) { reject(new Error("HTTP " + res.status)); return; }
                    try { resolve(JSON.parse(res.responseText)); }
                    catch (err) { reject(err); }
                },
                onerror: () => reject(new Error("network")),
                ontimeout: () => reject(new Error("timeout")),
            });
        });
    }
    return fetch(url, { credentials: "omit", referrerPolicy: "no-referrer" })
        .then((res) => { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); });
}

/* One request at a time, spaced out, so dragging the pointer down a
   108-row listing doesn't fire a hundred requests. The queue holds one
   *request*, not a whole two-request lookup: queuing the pair as one job
   deadlocked it against itself. Queue the leaves, compose above them. */
let steamChain = Promise.resolve();
const steamInFlight = new Map();

function steamFetch(key, url) {
    if (steamInFlight.has(key)) return steamInFlight.get(key);
    const job = steamChain
        .then(() => new Promise((resolve) => setTimeout(resolve, 220)))
        .then(() => steamGet(url));
    steamChain = job.catch(() => {});
    const tracked = job.finally(() => steamInFlight.delete(key));
    steamInFlight.set(key, tracked);
    return tracked;
}

function steamShape(appId, data) {
    return {
        appId: String(appId),
        name: data.name || "",
        header: data.header_image || null,
        released: data.release_date && data.release_date.coming_soon
            ? "Coming soon"
            : (data.release_date && data.release_date.date) || null,
        score: data.metacritic && data.metacritic.score ? String(data.metacritic.score) : null,
        tags: (data.genres || []).map((g) => g.description).slice(0, 5),
        blurb: (data.short_description || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 260),
        free: Boolean(data.is_free),
        kind: data.type || "game",
    };
}

/* Every lookup resolves { game, why }: the game, or which of the four reasons it's missing. */
const steamNone = (why) => ({ game: null, why });

function steamDetails(appId) {
    const cached = steamCached(appId);
    if (cached) return Promise.resolve({ game: cached, why: "cache" });

    const blocked = steamBlockedBecause();
    if (blocked) return Promise.resolve(steamNone(blocked));

    return steamFetch("app:" + appId,
        "https://store.steampowered.com/api/appdetails?appids=" + encodeURIComponent(appId) + "&l=english")
        .then((payload) => {
            const entry = payload && payload[String(appId)];
            if (!entry || !entry.success || !entry.data) return steamNone("miss");
            const game = steamShape(appId, entry.data);
            steamRemember(appId, game);
            return { game, why: "fetched" };
        })
        .catch((err) => {
            console.warn("[RIN Reforged] Steam lookup failed:", err);
            return steamNone("failed");
        });
}

/** Reduces a title like "[Release] Elden Ring (v1.16 + 5 DLCs) [Repack]"
 * to a search term by stripping the board's own bookkeeping. */
function steamSearchTerm(title) {
    let name = splitPrefix(title).rest;
    name = name.replace(/[[(][^\])]*[\])]/g, " ");
    name = name.replace(/\bv?\d+(?:\.\d+){1,3}[a-z]?\b/gi, " ");
    name = name.replace(/\b(build|update|repack|goldberg|denuvo|dlc|multi\d*|steam files?)\b/gi, " ");
    name = name.replace(/[-–—:|]+\s*$/, " ");
    return name.replace(/\s+/g, " ").trim();
}

function steamResolveByName(title) {
    const term = steamSearchTerm(title);
    if (term.length < 2) return Promise.resolve(null);

    const misses = store.get(STEAM_MISS_KEY, {});
    const seen = misses[term.toLowerCase()];
    if (seen && Date.now() - seen.at < steamCacheMs()) {
        return seen.id ? steamDetails(seen.id) : Promise.resolve(steamNone("miss"));
    }

    const blocked = steamBlockedBecause();
    if (blocked) return Promise.resolve(steamNone(blocked));

    return steamFetch("term:" + term.toLowerCase(),
        "https://store.steampowered.com/api/storesearch/?term=" + encodeURIComponent(term) + "&l=english&cc=us")
        .then((payload) => {
            const hit = payload && Array.isArray(payload.items) ? payload.items[0] : null;
            // A miss is cached as firmly as a hit, or every pinned topic Steam has never heard of becomes a repeat request.
            const all = store.get(STEAM_MISS_KEY, {});
            all[term.toLowerCase()] = { at: Date.now(), id: hit ? String(hit.id) : null };
            store.set(STEAM_MISS_KEY, all);
            return hit ? steamDetails(hit.id) : steamNone("miss");
        })
        .catch((err) => {
            console.warn("[RIN Reforged] Steam search failed:", err);
            return steamNone("failed");
        });
}

function steamLookForTopic(topicId, title) {
    const known = topicId && steamAppForTopic(topicId);
    if (known) return steamDetails(known);
    return steamResolveByName(title).then((result) => {
        if (result.game && topicId) steamRememberApp(topicId, result.game.appId);
        return result;
    });
}

const STEAM_EXCUSES = {
    off: "Not in this browser's cache. Turn on Steam lookups in settings, or open the topic once.",
    tor: "Not looked up over Tor. Open the topic once and it will be cached.",
    nogrant: "Could not reach Steam: the forum only allows the page to talk to itself, and your userscript manager has not granted GM_xmlhttpRequest. Everything already cached still works.",
    failed: "Could not reach Steam just now.",
    miss: "Steam has nothing under that name.",
};

/* Every a.topictitle carries title="Posted: Wednesday, 15 May 2013,
 * 16:42", which drew the browser's own tooltip alongside this card. The
 * date moves onto the card instead and the attribute is removed; the
 * weekday is dropped too since nobody reads a thread by its day. */
const POSTED_RE = /^\s*(?:Posted|Добавлено)\s*:\s*/i;

function postedOn(link) {
    const said = link.getAttribute("title") || "";
    if (!POSTED_RE.test(said)) return null;
    return said.replace(POSTED_RE, "").replace(/^[^,]+,\s*/, "").trim() || null;
}

function steamCard(game, term, posted) {
    // Not role=tooltip: it holds interactive links, not just text.
    const card = el("div.rr-steam", { role: "group", "aria-label": game.name || "Steam" });

    if (game.header) {
        card.append(el("img.rr-steam__art", {
            src: game.header, alt: "", loading: "lazy", referrerpolicy: "no-referrer",
        }));
    }

    const head = el("div.rr-steam__head", {}, [
        el("span.rr-steam__name", {}, [game.name || term]),
    ]);
    if (game.score) {
        // Banded rather than shown as a bare number, since the band is what anyone reads.
        const band = Number(game.score) >= 75 ? "good" : Number(game.score) >= 50 ? "mixed" : "poor";
        head.append(el("span.rr-steam__score", { "data-band": band, title: "Metacritic" }, [game.score]));
    }
    card.append(head);

    const facts = [];
    if (game.released) facts.push(game.released);
    if (game.kind && game.kind !== "game") facts.push(game.kind.toUpperCase());
    if (game.free) facts.push("Free to play");
    facts.push("AppID " + game.appId);
    card.append(el("div.rr-steam__facts", {}, [facts.join(" · ")]));

    if (game.tags.length) {
        const tags = el("div.rr-steam__tags");
        for (const tag of game.tags) tags.append(el("span.rr-steam__tag", {}, [tag]));
        card.append(tags);
    }

    if (game.blurb) card.append(el("p.rr-steam__blurb", {}, [game.blurb]));

    if (posted) card.append(el("div.rr-steam__posted", {}, [t("Topic opened {when}", { when: posted })]));

    card.append(el("div.rr-steam__links", {}, [
        el("a.rr-btn", {
            href: "https://store.steampowered.com/app/" + game.appId + "/",
            target: "_blank", rel: "noopener noreferrer", "data-variant": "quiet",
        }, ["Store", icon("external", 11)]),
        el("a.rr-btn", {
            href: "https://steamdb.info/app/" + game.appId + "/",
            target: "_blank", rel: "noopener noreferrer", "data-variant": "quiet",
        }, ["SteamDB", icon("external", 11)]),
    ]));

    return card;
}

function steamPlaceholder(text, posted) {
    return el("div.rr-steam.rr-steam--quiet", { role: "tooltip" }, [
        posted ? el("div.rr-steam__posted", {}, [t("Topic opened {when}", { when: posted })]) : null,
        el("div.rr-steam__facts", {}, [text]),
    ]);
}

let steamPopover = null;
let steamShowTimer = 0;
let steamHideTimer = 0;
let steamAnchor = null;

function steamHide() {
    clearTimeout(steamShowTimer);
    clearTimeout(steamHideTimer);
    if (steamPopover) { steamPopover.remove(); steamPopover = null; }
    steamAnchor = null;
}

function steamPlace(node, link) {
    const box = link.getBoundingClientRect();
    const width = node.offsetWidth;
    const height = node.offsetHeight;
    const margin = 10;

    let left = box.left + window.scrollX;
    if (left + width > window.scrollX + document.documentElement.clientWidth - margin) {
        left = window.scrollX + document.documentElement.clientWidth - width - margin;
    }
    left = Math.max(window.scrollX + margin, left);

    let top = box.bottom + window.scrollY + 8;
    if (box.bottom + height + 18 > document.documentElement.clientHeight) {
        top = box.top + window.scrollY - height - 8;
    }
    top = Math.max(window.scrollY + margin, top);

    node.style.left = left + "px";
    node.style.top = top + "px";
}

function steamShow(link, entry) {
    if (steamAnchor === link) return;
    steamHide();
    steamAnchor = link;

    const shell = el("div.rr-steam-pop");
    shell.append(steamPlaceholder("Looking this one up…", entry.posted));
    document.body.append(shell);
    steamPopover = shell;
    steamPlace(shell, link);

    // Reachable by the pointer so its links don't vanish en route to them.
    shell.addEventListener("mouseenter", () => clearTimeout(steamHideTimer));
    shell.addEventListener("mouseleave", () => { steamHideTimer = setTimeout(steamHide, STEAM_HIDE_DELAY); });

    steamLookForTopic(entry.id, entry.title).then((result) => {
        if (steamPopover !== shell || !document.contains(shell)) return;
        shell.textContent = "";
        if (result.game) shell.append(steamCard(result.game, steamSearchTerm(entry.title), entry.posted));
        else shell.append(steamPlaceholder(STEAM_EXCUSES[result.why] || STEAM_EXCUSES.miss, entry.posted));
        steamPlace(shell, link);
    });
}

/** One delegated listener instead of one per row: 108 titles would otherwise be 216 handlers. */
function initSteamPreview() {
    if (!settings.get("steamPreview")) return;
    if (!PAGE.isForum && !PAGE.isIndex && !PAGE.isSearch) return;

    const byLink = new Map();
    for (const entry of topicRows()) {
        // Only when the preview is on; off, the board's own tooltip is what shows when a topic opened.
        entry.posted = postedOn(entry.link);
        if (entry.posted) entry.link.removeAttribute("title");
        byLink.set(entry.link, entry);
    }
    if (!byLink.size) return;

    const armed = (event) => {
        const link = event.target.closest && event.target.closest("a.topictitle");
        const entry = link && byLink.get(link);
        if (!entry) return null;
        // The script's own dialogs own the screen while they are open.
        if (document.querySelector(".rr-palette, .rr-panel, .rr-sheet, .rr-lightbox")) return null;
        return { link, entry };
    };

    document.addEventListener("pointerover", (event) => {
        const hit = armed(event);
        if (!hit) return;
        clearTimeout(steamHideTimer);
        clearTimeout(steamShowTimer);
        steamShowTimer = setTimeout(() => steamShow(hit.link, hit.entry), STEAM_HOVER_DELAY);
    });

    document.addEventListener("pointerout", (event) => {
        if (!event.target.closest || !event.target.closest("a.topictitle")) return;
        clearTimeout(steamShowTimer);
        steamHideTimer = setTimeout(steamHide, STEAM_HIDE_DELAY);
    });

    // Keyboard parity: Tab focus shows the card, Escape hides it.
    document.addEventListener("focusin", (event) => {
        const hit = armed(event);
        if (!hit) { if (steamPopover && !steamPopover.contains(event.target)) steamHide(); return; }
        steamShow(hit.link, hit.entry);
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && steamPopover) steamHide();
    });
    on(window, "scroll", () => { if (steamPopover && steamAnchor) steamPlace(steamPopover, steamAnchor); }, { passive: true });
}

/* ================= src/modules/compose.js ================= */
// Fetches the real posting.php reply form into the foot of the thread, so
// replying doesn't lose your place in a long topic. Submits the board's own
// form, tokens and all — nothing here forges a post or bypasses a restriction.

let quickReplyForm = null;

// Drafts are kept locally against the topic id, never sent anywhere, and
// dropped once the reply is submitted — following a link used to lose them.

const DRAFT_KEY = "drafts";
const DRAFT_MAX = 20000;
const DRAFT_TTL = 30 * 86400000;

/** Every kept draft, with anything a month old dropped on the way. */
function drafts() {
    const all = store.get(DRAFT_KEY, {});
    let stale = false;
    for (const [id, entry] of Object.entries(all)) {
        if (!entry || Date.now() - (entry.at || 0) > DRAFT_TTL) { delete all[id]; stale = true; }
    }
    if (stale) store.set(DRAFT_KEY, all);
    return all;
}

function draftFor(topicId) {
    const entry = drafts()[String(topicId)];
    return entry && entry.text ? entry.text : "";
}

function setDraft(topicId, text) {
    if (!topicId || !settings.get("saveDraft")) return;
    const all = drafts();
    const trimmed = (text || "").slice(0, DRAFT_MAX);
    if (trimmed.trim()) all[String(topicId)] = { at: Date.now(), text: trimmed };
    else delete all[String(topicId)];
    store.set(DRAFT_KEY, all);
}

function clearDraft(topicId) {
    const all = drafts();
    if (!(String(topicId) in all)) return;
    delete all[String(topicId)];
    store.set(DRAFT_KEY, all);
}

async function fetchReplyForm() {
    const url = new URL("./posting.php", location.href);
    url.searchParams.set("mode", "reply");
    if (PAGE.forumId) url.searchParams.set("f", String(PAGE.forumId));
    if (PAGE.topicId) url.searchParams.set("t", String(PAGE.topicId));

    const response = await fetch(url.toString(), { credentials: "same-origin" });
    if (!response.ok) throw new Error("reply form returned " + response.status);

    const doc = parseDocument(await response.text());
    if (!doc) throw new Error("the reply form could not be parsed");
    const form = doc.querySelector('form[action*="posting.php"]');
    if (!form) throw new Error("no reply form on the page");
    return form;
}

// Strips the form to what a quick reply needs: message box, hidden state, one
// submit button. Preview, polls and attachments stay on the full page.
function slimReplyForm(form) {
    const message = form.querySelector('textarea[name="message"]');
    if (!message) throw new Error("no message field");

    const slim = el("form", {
        method: "post",
        action: form.getAttribute("action"),
        class: "rr-reply__form",
    });

    for (const hidden of form.querySelectorAll('input[type="hidden"]')) {
        slim.append(hidden.cloneNode(true));
    }

    message.classList.add("rr-reply__text");
    message.setAttribute("rows", "6");
    // Template wires the box to editor.js handlers, which isn't loaded here —
    // every keystroke threw without stripping them.
    for (const handler of ["onselect", "onclick", "onkeyup", "onfocus", "onblur", "onchange"]) message.removeAttribute(handler);
    message.setAttribute("placeholder", t("Write a reply"));

    // The board's own form arrives empty, so a restored draft can only add.
    if (settings.get("saveDraft") && PAGE.topicId && !message.value.trim()) {
        const kept = draftFor(PAGE.topicId);
        if (kept) message.value = kept;
    }
    message.addEventListener("input", debounce(() => setDraft(PAGE.topicId, message.value), 400));

    // Submitted is the one thing that means "done with this".
    slim.addEventListener("submit", () => clearDraft(PAGE.topicId));

    slim.append(buildReplyTools(message));
    slim.append(message);

    const submit = form.querySelector('input[name="post"]');
    const actions = el("div.rr-reply__actions", {}, [
        el("button.rr-btn", { type: "submit", name: "post", value: submit ? submit.value : "Submit", "data-variant": "primary" }, [t("Post reply")]),
        el("a.rr-btn", {
            href: form.getAttribute("action"),
            "data-variant": "quiet",
            title: t("Preview, attachments and the full toolbar"),
        }, [t("Open the full editor")]),
    ]);
    slim.append(actions);
    return { slim, message };
}

// The tags a reply needs most often, one press each: face, name, open, close.
const REPLY_TOOLS = [
    ["B", "Bold", "[b]", "[/b]"],
    ["I", "Italic", "[i]", "[/i]"],
    ["U", "Underline", "[u]", "[/u]"],
    ["Quote", "Quote", "[quote]", "[/quote]"],
    ["Code", "Code", "[code]", "[/code]"],
    ["URL", "Link", "[url]", "[/url]"],
    ["Img", "Image", "[img]", "[/img]"],
    ["Spoiler", "Spoiler", "[spoiler]", "[/spoiler]"],
];

function buildReplyTools(message) {
    const bar = el("div.rr-reply__tools", { role: "toolbar", "aria-label": t("Formatting") });
    for (const [face, name, open, close] of REPLY_TOOLS) {
        const button = el("button.rr-btn", {
            type: "button",
            "data-variant": "quiet",
            "data-tool": open.slice(1, -1),
            "aria-label": t(name),
            "data-rr-tip": t(name),
        }, [face]);
        button.addEventListener("click", () => wrapSelection(message, open, close));
        bar.append(button);
    }
    return bar;
}

/** Wrap what is selected in the field, or leave the caret between the tags. */
function wrapSelection(field, open, close) {
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const inner = field.value.slice(start, end);
    field.setRangeText(open + inner + close, start, end, "end");
    if (!inner) field.setSelectionRange(start + open.length, start + open.length);
    field.focus();
    field.dispatchEvent(new Event("input", { bubbles: true }));
}

function buildQuickReply() {
    const holder = el("section.rr-reply", { "aria-label": "Quick reply" });
    const openButton = el("button.rr-btn", { type: "button", "data-variant": "primary" }, [
        icon("reply", 13),
        t("Write a reply"),
    ]);
    holder.append(openButton);

    // Flagged on the button itself, not only once opened, so a draft isn't forgotten.
    const kept = settings.get("saveDraft") && PAGE.topicId ? draftFor(PAGE.topicId) : "";
    if (kept) {
        openButton.lastChild.textContent = t("Finish your reply");
        openButton.setAttribute("title", kept.slice(0, 120));
        holder.setAttribute("data-rr-draft", "");
    }

    const setLabel = (text) => {
        // textContent would take the icon with it too.
        const label = openButton.lastChild;
        if (label && label.nodeType === 3) label.textContent = text;
        else openButton.append(document.createTextNode(text));
    };

    openButton.addEventListener("click", async () => {
        openButton.disabled = true;
        setLabel(t("Loading the reply form…"));
        try {
            const form = await fetchReplyForm();
            const { slim, message } = slimReplyForm(form);
            openButton.remove();
            holder.append(slim);
            quickReplyForm = message;
            message.focus();
            message.setSelectionRange(message.value.length, message.value.length);
        } catch (err) {
            console.warn("[RIN Reforged] quick reply:", err);
            openButton.disabled = false;
            setLabel(t("Write a reply"));
            toast(t("Could not load the reply form. Opening the full editor instead."));
            const link = document.querySelector('a[href*="mode=reply"]');
            if (link) location.href = link.getAttribute("href");
        }
    });

    return holder;
}

// Selecting text in a post offers a Quote button: into the quick reply if
// it's open, onto the clipboard if not.
function initSelectionQuote() {
    let bubble = null;

    const hide = () => { if (bubble) { bubble.remove(); bubble = null; } };

    document.addEventListener("mouseup", (event) => {
        if (event.target.closest && event.target.closest(".rr-quote-bubble")) return;
        setTimeout(() => {
            const selection = window.getSelection();
            const text = selection ? selection.toString().trim() : "";
            hide();
            if (!text || text.length < 8) return;

            const anchorNode = selection.anchorNode;
            const body = anchorNode && (anchorNode.nodeType === 1 ? anchorNode : anchorNode.parentElement)?.closest(".postbody");
            if (!body) return;

            const post = posts().find((entry) => entry.body === body || entry.body.contains(body));
            const author = post && post.author ? post.author.textContent.trim() : "";

            const range = selection.getRangeAt(0).getBoundingClientRect();
            bubble = el("button.rr-quote-bubble", { type: "button" }, [icon("quote", 13), "Quote"]);
            bubble.style.top = (range.bottom + window.scrollY + 8) + "px";
            bubble.style.left = (range.left + window.scrollX) + "px";

            bubble.addEventListener("click", () => {
                const quoted = "[quote=\"" + author + "\"]" + text + "[/quote]\n";
                if (quickReplyForm) {
                    quickReplyForm.value += (quickReplyForm.value ? "\n" : "") + quoted;
                    quickReplyForm.focus();
                    quickReplyForm.scrollIntoView({ behavior: scrollBehaviour(), block: "center" });
                    toast(t("Added to your reply"));
                } else if (settings.get("saveDraft") && settings.get("quickReply") && PAGE.topicId) {
                    // No box open: goes into the topic's draft so the reply finds it later.
                    const kept = draftFor(PAGE.topicId);
                    setDraft(PAGE.topicId, kept ? kept + "\n" + quoted : quoted);
                    copyText(quoted, "Quote copied, and kept for your reply");
                } else {
                    copyText(quoted, "Quote copied");
                }
                hide();
                selection.removeAllRanges();
            });
            document.body.append(bubble);
        }, 10);
    });

    document.addEventListener("scroll", hide, { passive: true });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") hide(); });
}

function initCompose() {
    if (!PAGE.isTopic) return;
    if (!isLoggedIn()) return;                 // both features need an account

    if (settings.get("quickReply")) {
        // The board's whole test for "can this person reply" is whether it
        // printed a reply link. A prior check matched on the padlock icon
        // instead, so locked topics got a reply box refused only on submit.
        const canReply = Boolean(document.querySelector('a[href*="mode=reply"]'));
        const anchor = document.querySelector("#pagecontent") || document.querySelector("#wrapcentre");
        if (anchor && canReply) {
            anchor.append(buildQuickReply());
            // Hides the board's own reply button (redundant with this card),
            // but keeps the link itself for the fallback below.
            for (const link of document.querySelectorAll('a[href*="mode=reply"]')) {
                if (link.closest(".rr-topicbar, .rr-reply")) continue;
                const cell = link.closest("td");
                if (cell) cell.style.display = "none";
            }
        }
    }

    if (settings.get("selectionQuote")) initSelectionQuote();
}

// The board resets these five checkboxes to its defaults every time; this
// remembers the last choice, but only for new posts — editing an existing
// one must keep loading that post's own saved options, not overwrite them.
const POSTING_OPTIONS = ["disable_bbcode", "disable_smilies", "disable_magic_url", "attach_sig", "notify"];

function initPostingMemory() {
    if (!PAGE.isPosting && !PAGE.isUCP) return;
    if (!settings.get("postingMemory")) return;
    if (/mode=edit|mode=delete|mode=quote_edit/.test(location.search)) return;

    const remembered = store.get("posting", null);
    for (const name of POSTING_OPTIONS) {
        const box = document.querySelector('#wrapcentre input[type="checkbox"][name="' + name + '"]');
        if (!box) continue;
        if (remembered && Object.prototype.hasOwnProperty.call(remembered, name)) {
            box.checked = Boolean(remembered[name]);
        }
        box.addEventListener("change", () => {
            const next = store.get("posting", {}) || {};
            next[name] = box.checked;
            store.set("posting", next);
        });
    }
}

// The board's own BBCode bar is unlabelled grey rectangles whose explanation
// sits in a separate full-width field below. This redresses each button with
// a caption/icon/tooltip instead, grouped — without touching bbstyle(),
// accesskeys or onclick, since those key off the `bbtags` array, not the face.
// The helpbox stays in the page (hidden): helpline() still writes to it on hover.

// Keyed by the input's name for tags phpBB numbers itself (stable, both languages).
const BB_BY_NAME = {
    addbbcode0:   { label: "B", face: "bold", tip: "Bold" },
    addbbcode2:   { label: "i", face: "italic", tip: "Italic" },
    addbbcode4:   { label: "u", face: "underline", tip: "Underline" },
    addbbcode6:   { label: "Quote", icon: "quote", tip: "Quote a post" },
    addbbcode8:   { label: "Code", icon: "code", tip: "Code, kept as typed" },
    addbbcode10:  { label: "List", icon: "list", tip: "Bulleted list" },
    addbbcode12:  { label: "Numbered", icon: "listnum", tip: "Numbered list" },
    addlistitem:  { label: "Item", tip: "An item in a list" },
    addbbcode14:  { label: "Image", icon: "image", tip: "Image from a URL" },
    addbbcode16:  { label: "Link", icon: "link", tip: "Link to a page" },
    addsteaminfo: { label: "SteamInfo", icon: "game", tip: "Game details from Steam" },
};

// Board-added BBCodes are numbered in admin-defined order, so keyed by tag.
const BB_BY_TAG = {
    "s":        { label: "S", face: "strike", tip: "Strikethrough" },
    "spoiler":  { label: "Spoiler", icon: "hide", tip: "Hide text until clicked" },
    "spoiler=": { label: "Named spoiler", icon: "hide", tip: "Spoiler with a title" },
    "youtube":  { label: "YouTube", icon: "play", tip: "Embed a YouTube video" },
};

// Grouping order: letter styles, blocks, fetched-elsewhere, hidden, generator.
// A key is a button name, or a tag written `tag:`.
const BB_GROUPS = [
    ["addbbcode0", "addbbcode2", "addbbcode4", "tag:s"],
    ["addbbcode6", "addbbcode8", "addbbcode10", "addbbcode12", "addlistitem"],
    ["addbbcode14", "addbbcode16", "tag:youtube"],
    ["tag:spoiler", "tag:spoiler="],
    ["addsteaminfo"],
];

// The board's help text from its inline `help_line` table, used only as a
// fallback for a BBCode this script has no entry for.
function boardHelpLines() {
    const table = {};
    for (const script of document.querySelectorAll("script:not([src])")) {
        const text = script.textContent || "";
        const at = text.indexOf("help_line");
        if (at < 0 || !/var\s+help_line\s*=/.test(text)) continue;
        // No value contains a brace, so the first one after it closes the literal.
        const body = text.slice(at, text.indexOf("}", at));
        const entry = /([A-Za-z_]\w*)\s*:\s*'((?:[^'\\]|\\.)*)'/g;
        let match;
        while ((match = entry.exec(body)) !== null) table[match[1]] = match[2].replace(/\\(.)/g, "$1");
    }
    return table;
}

/** The `helpline('q')` key on a button, if it has one. */
function helpKeyOf(input) {
    const call = input.getAttribute("onmouseover") || "";
    const match = call.match(/helpline\(\s*'([^']+)'/);
    return match ? match[1] : null;
}

// Tooltip goes on a wrapper, not the input: a replaced element draws no
// pseudo-elements, so `input::after` is nothing — the reason the board
// needed a separate field for this in the first place.
function dressTool(input, spec, fallbackTip) {
    const tip = spec ? t(spec.tip) : fallbackTip;
    const holder = el("span.rr-bbtool", { "data-rr-tip": tip, "data-rr-tip-side": "above" });

    if (spec) {
        // The template's inline width/text-decoration are wrong once the caption is a word.
        input.removeAttribute("style");
        input.value = t(spec.label);
        if (spec.face) input.setAttribute("data-rr-face", spec.face);
        if (spec.icon) holder.append(icon(spec.icon, 13));
    }
    input.setAttribute("aria-label", tip);
    input.removeAttribute("title");

    holder.append(input);
    return holder;
}

// Keeps the label inside the window on a narrow screen, where a centred
// tooltip on an edge button would hang off the page.
function clampTip(holder) {
    const box = holder.getBoundingClientRect();
    const room = 130;
    const side = box.left < room ? "above-left"
        : box.right > window.innerWidth - room ? "above-right"
        : "above";
    holder.setAttribute("data-rr-tip-side", side);
}

function initPostingToolbar() {
    const buttons = Array.from(document.querySelectorAll("#wrapcentre input.btnbbcode"));
    if (!buttons.length) return;

    // Read before any button moves: once in the new bar, closest("td") is the bar.
    const cells = new Set(buttons.map((input) => input.closest("td")).filter(Boolean));
    const home = buttons[0].closest("td");
    if (!home) return;

    const help = boardHelpLines();
    const pool = new Map();
    for (const input of buttons) {
        pool.set("name:" + (input.getAttribute("name") || ""), input);
        // First one wins, so a stray duplicate can't take a named button's place.
        const tag = "tag:" + input.value.trim();
        if (!pool.has(tag)) pool.set(tag, input);
    }

    const bar = el("div.rr-bbtools", { role: "toolbar", "aria-label": t("Formatting") });
    const taken = new Set();

    const take = (key) => {
        const byTag = key.startsWith("tag:");
        const input = pool.get(byTag ? key : "name:" + key);
        if (!input || taken.has(input)) return null;
        const spec = byTag ? BB_BY_TAG[key.slice(4)] : BB_BY_NAME[key];
        if (!spec) return null;
        taken.add(input);
        return dressTool(input, spec, "");
    };

    for (const keys of BB_GROUPS) {
        const group = el("div.rr-bbtools__group");
        for (const key of keys) {
            const tool = take(key);
            if (tool) group.append(tool);
        }
        // The font size menu is a letter style too, but the board leaves it
        // stranded at the end of the row with its own label.
        if (keys[0] === "addbbcode0") {
            const size = document.querySelector('#wrapcentre select[name="addbbcode20"]');
            const label = size && size.closest("span");
            if (label) group.append(el("span.rr-bbtool.rr-bbtool--menu", {
                "data-rr-tip": t("Text size"),
                "data-rr-tip-side": "above",
            }, [label]));
        }
        if (group.childElementCount) bar.append(group);
    }

    // A BBCode added since this was written: keeps its caption, gets the
    // board's help line as a tooltip, rather than being silently dropped.
    const strays = buttons.filter((input) => !taken.has(input));
    if (strays.length) {
        const group = el("div.rr-bbtools__group");
        for (const input of strays) {
            const key = helpKeyOf(input);
            group.append(dressTool(input, null, (key && help[key]) || input.value.trim()));
        }
        bar.append(group);
    }

    for (const holder of bar.querySelectorAll(".rr-bbtool")) {
        holder.addEventListener("pointerenter", () => clampTip(holder));
        holder.addEventListener("focusin", () => clampTip(holder));
    }

    // Buttons come from two table rows; `home` keeps the board's own inline
    // scripts, so the bar goes there. Any row left with no control is hidden.
    home.append(bar);
    for (const cell of cells) {
        if (cell !== home && !cell.querySelector("input, select, a, textarea")) {
            const row = cell.closest("tr");
            if (row) row.hidden = true;
        }
    }

    // Stays a field (only hidden): helpline() sets its value on every mouseover
    // and throws if it's been removed.
    const helpbox = document.querySelector('#wrapcentre input[name="helpbox"]');
    if (helpbox) {
        helpbox.setAttribute("data-rr-helpbox", "");
        helpbox.setAttribute("tabindex", "-1");
        helpbox.setAttribute("aria-hidden", "true");
        const row = helpbox.closest("tr");
        if (row) row.setAttribute("data-rr-helprow", "");
    }

    movePaletteHeading();
}

// "Font colour" reads correctly next to the board's own row only as a grid;
// on a phone the rows unpack and the heading strands above the message box.
// Moved by position (one row up, same column), not by its translated text.
function movePaletteHeading() {
    const palette = document.querySelector("#wrapcentre table[data-rr-palette]");
    const cell = palette && palette.closest("td");
    const row = cell && cell.closest("tr");
    const above = row && row.previousElementSibling;
    if (!above || above.tagName !== "TR") return;

    const heading = above.children[Array.prototype.indexOf.call(row.children, cell)];
    const words = heading && heading.textContent.replace(/\s+/g, " ").trim();
    if (!words || heading.querySelector("input, select, textarea, table, a")) return;

    palette.before(el("div.rr-palette-head", {}, [words]));
    heading.textContent = "";
    above.hidden = true;
}

/* ---- The topic review ----------------------------------------------

   Under the reply form the board reprints the last few posts of the
   thread, in a 300px box you scroll. They are drawn as one continuous
   table — a hairline of table background between two posts, and a
   zebra so faint that at a glance the five look like one long post
   with somebody's name in the middle of it.

   Each one becomes a card here: its own edge, its own corners, and a
   gap between it and the next. Nothing is added to the page; the rows
   the board already prints are named so the stylesheet can draw them.
   -------------------------------------------------------------------- */

function initTopicReview() {
    /* By shape, not by the heading: "Topic review" is one string in
       English and another in Russian, and the box is the only scroller
       on the page holding posts. */
    const scroller = Array.from(document.querySelectorAll("#wrapcentre div")).find((node) =>
        /auto|scroll/.test(node.style.overflow || "") && node.querySelector(".postbody"));
    if (!scroller) return;

    scroller.setAttribute("data-rr-review", "");
    const box = scroller.closest("table.tablebg");
    if (box) box.setAttribute("data-rr-reviewbox", "");

    const list = scroller.querySelector("table");
    if (!list) return;
    list.setAttribute("data-rr-review-list", "");

    /* Every post is two rows carrying the same row1/row2 class — the
       author cell spans both — and a `td.spacer` row between one post
       and the next. */
    for (const row of Array.from(list.rows)) {
        if (row.cells.length === 1 && row.cells[0].classList.contains("spacer")) {
            row.setAttribute("data-rr-review-row", "gap");
            continue;
        }
        if (!/\brow[12]\b/.test(row.className)) continue;

        /* The author's cell is the one that spans the pair, so it is
           on the first row of a post and on no other. It has to be
           picked off the row itself: the name is wrapped in a table of
           its own, and `closest("td")` from it lands on that table's
           cell rather than on the one that spans. */
        const author = row.querySelector(":scope > td[rowspan]");
        if (author && author.querySelector(".postauthor")) {
            row.setAttribute("data-rr-review-row", "head");
            author.setAttribute("data-rr-review-cell", "author");
        } else {
            row.setAttribute("data-rr-review-row", "body");
        }
    }
}

/* ================= src/modules/people.js ================= */
/* Local foe list: phpBB's own is four clicks deep and needs a reload.
   Hidden posts collapse to one line rather than vanish, so a thread
   doesn't silently lose replies people are answering. Entries key on
   the profile link's member id, not the display name, because this
   board renames and an earlier version lost entries when that happened;
   the name is kept alongside for a readable export and for posts with
   no profile link (deleted accounts, guests). */

/* Entries are { id, name }; an older version stored a bare string, read
 * here as a name-only entry rather than migrated, since it self-upgrades
 * the next time that person is hidden. */
function hiddenPeople() {
    return store.get("hiddenUsers", []).map((entry) =>
        (typeof entry === "string" ? { id: null, name: entry } : entry));
}

// Survives a rename, unlike the display name.
function personId(post) {
    const link = post.table && post.table.querySelector('a[href*="mode=viewprofile"]');
    const match = link && (link.getAttribute("href") || "").match(/[?&]u=(\d+)/);
    return match ? match[1] : null;
}

function personOf(post) {
    const name = post.author ? post.author.textContent.trim() : null;
    return name ? { id: personId(post), name } : null;
}

function isHidden(person) {
    if (!person) return false;
    return hiddenPeople().some((entry) => (
        person.id && entry.id
            ? entry.id === person.id
            : entry.name === person.name));
}

function setHidden(person, hidden) {
    const list = hiddenPeople().filter((entry) => !(
        (person.id && entry.id && entry.id === person.id) || entry.name === person.name));
    if (hidden) list.push({ id: person.id, name: person.name });
    store.set("hiddenUsers", list);
}

function applyHidden(post, name) {
    if (post.table.querySelector(".rr-hidden-note")) return;

    const cell = post.body.closest("td");
    if (!cell) return;

    const restore = el("button.rr-btn", { type: "button", "data-variant": "quiet" }, [t("Show")]);
    const note = el("div.rr-hidden-note", {}, [
        el("span", {}, [t("Post by {name} is hidden", { name })]),
        restore,
    ]);

    // Remembers what was already folded (a Steam description, a signature) so revealing the post doesn't unfold it too.
    const covered = Array.from(cell.children).filter((child) => !child.hidden);
    for (const child of covered) child.hidden = true;
    cell.prepend(note);

    const reveal = () => {
        for (const child of covered) child.hidden = false;
        note.remove();
        delete post.table.rrReveal;
        // The focused control is gone with the note; land the keyboard on the revealed post instead.
        cell.setAttribute("tabindex", "-1");
        cell.focus({ preventScroll: true });
    };
    restore.addEventListener("click", reveal);
    // Kept on the node, not a map: post objects are rebuilt each posts() pass, the DOM is not.
    post.table.rrReveal = reveal;
}

function postsBy(person) {
    return posts().filter((post) => {
        const other = personOf(post);
        if (!other) return false;
        return person.id && other.id ? person.id === other.id : other.name === person.name;
    });
}

function revealPerson(person) {
    for (const post of postsBy(person)) {
        if (typeof post.table.rrReveal === "function") post.table.rrReveal();
    }
}

function addHideControl(post) {
    if (!post.head && !post.headCell) return;
    const person = personOf(post);
    if (!person) return;

    const label = (hidden) => t(hidden ? "Show posts by {name}" : "Hide posts by {name}", { name: person.name });

    const button = el("button.rr-icon-btn", {
        type: "button",
        title: label(isHidden(person)),
        "aria-label": label(isHidden(person)),
        "aria-pressed": isHidden(person) ? "true" : "false",
    }, [icon("user")]);

    button.addEventListener("click", () => {
        const next = !isHidden(person);
        setHidden(person, next);
        toast(next ? "Posts by " + person.name + " hidden here" : "Showing " + person.name + " again");

        if (next) {
            for (const other of postsBy(person)) applyHidden(other, person.name);
        } else {
            // Reversed in place: reloading used to lose the reader's scroll position and any half-written reply.
            revealPerson(person);
        }

        // Every post by this person carries one of these buttons; keep them all in sync.
        for (const other of document.querySelectorAll('.rr-posttools [data-rr-hide="' + CSS.escape(person.name) + '"]')) {
            other.setAttribute("aria-pressed", next ? "true" : "false");
            other.setAttribute("title", label(next));
            other.setAttribute("aria-label", label(next));
        }
    });
    button.setAttribute("data-rr-hide", person.name);

    // Per-post actions (a separate setting) normally build this strip; make one if that setting is off.
    const holder = post.head || post.headCell;
    let tools = holder.querySelector(".rr-posttools");
    if (!tools) {
        tools = el("div.rr-posttools");
        holder.append(tools);
    }
    tools.append(button);
    labelled(button, button.getAttribute("title") || t("Hide posts by this member"));
    button.setAttribute("data-rr-tip-side", "above");
}

// phpBB links the first unread post only from the topic list; nothing gets back to it from inside the topic.
function addUnreadJump(bar) {
    if (!bar || !PAGE.topicId) return;
    // The board already printed one for this member.
    if (bar.querySelector('a[href*="view=unread"]')) return;

    const url = new URL("./viewtopic.php", location.href);
    if (PAGE.forumId) url.searchParams.set("f", String(PAGE.forumId));
    url.searchParams.set("t", String(PAGE.topicId));
    url.searchParams.set("view", "unread");

    const link = el("a.rr-btn", {
        href: url.toString() + "#unread",
        "data-variant": "quiet",
        title: t("Jump to the first post you have not read"),
    }, [icon("arrowDown", 13), t("First unread")]);

    // Belongs on the first row (actions on the topic itself); falls back to the bar if there is no row.
    const row = bar.querySelector('.rr-topicbar__row[data-rr-row="here"]') || bar;
    const spacer = row.querySelector(".rr-topicbar__spacer");
    if (spacer) row.insertBefore(link, spacer);
    else row.append(link);
}

function initPeople() {
    if (!PAGE.isTopic) return;

    const all = posts();

    if (settings.get("hideUsers")) {
        for (const post of all) {
            const person = personOf(post);
            if (person && isHidden(person)) applyHidden(post, person.name);
            addHideControl(post);
        }
    }

    if (settings.get("unreadJump") && isLoggedIn()) {
        addUnreadJump(document.querySelector(".rr-topicbar"));
    }
}

/* ================= src/modules/preview.js ================= */
/* Topics in the palette, and a look inside one. Filters titles this
   browser has already seen instead of searching the board (which has a
   ~30s flood interval); resting on a result fetches its first page once. */

// 800 topics is ~110 KB, well within localStorage and about 8 listings' worth.
const TOPIC_BUCKET = "topics";
const TOPIC_LIMIT = 800;

// Long enough to arrow past a few rows without firing a fetch on each.
const PREVIEW_DWELL = 260;

// Below this the pane has no room (features.css hides it here too) and a
// phone is the worst place to spend 110 KB on a fetch nobody can see.
const PREVIEW_MIN_WIDTH = 1200;

// Measured live: refused around 1s/8s/8s, answered at 20s. A warning, not a
// block — the board enforces its own flood interval regardless.
const SEARCH_INTERVAL = 30000;

// Session id, lang= and &start=/#unread all vary per link for the same
// topic; this collapses them to one id so they don't count as four.
function topicKey(href) {
    const id = String(href || "").match(/[?&]t=(\d+)/);
    return id ? id[1] : null;
}

function canonicalTopicHref(href) {
    const id = topicKey(href);
    if (!id) return null;
    const forum = String(href).match(/[?&]f=(\d+)/);
    return "./viewtopic.php?" + (forum ? "f=" + forum[1] + "&" : "") + "t=" + id;
}

function knownTopics() {
    const held = bucket.get(TOPIC_BUCKET, []);
    return Array.isArray(held) ? held : [];
}

/** The board a listing is showing, for the line under a title. */
function listingBoardName() {
    const crumbs = Array.from(document.querySelectorAll("#wrapcentre a.breadcrumbs, .rr-nav__crumbs a"));
    const last = crumbs[crumbs.length - 1];
    const name = last ? last.textContent.replace(/\s+/g, " ").trim() : "";
    return name && name.length <= 48 ? name : null;
}

// Runs on any page listing `a.topictitle` rows; writes once, at the end,
// only when something actually changed.
function harvestTopics() {
    if (!settings.get("paletteTopics")) return;

    const rows = topicRows();
    if (!rows.length) return;

    const board = listingBoardName();
    const now = Date.now();
    const held = knownTopics();
    const byId = new Map(held.map((entry) => [entry.i, entry]));
    let changed = false;

    for (const row of rows) {
        if (!row.id || !row.title) continue;
        const href = canonicalTopicHref(row.link.getAttribute("href"));
        if (!href) continue;
        const before = byId.get(row.id);
        // Re-read every time: a renamed topic is a different search target.
        const entry = {
            i: row.id,
            t: row.title.slice(0, 140),
            h: href,
            b: board || (before && before.b) || null,
            s: now,
        };
        if (!before || before.t !== entry.t || before.b !== entry.b) changed = true;
        byId.set(row.id, entry);
    }
    if (!changed && byId.size === held.length) return;

    // Newest sighting first, so the cap drops the oldest, not Map insertion order.
    const next = Array.from(byId.values()).sort((a, b) => b.s - a.s).slice(0, TOPIC_LIMIT);

    // If storage is full, half an index still answers most queries.
    if (!bucket.set(TOPIC_BUCKET, next) && next.length > 40) {
        bucket.set(TOPIC_BUCKET, next.slice(0, Math.floor(next.length / 2)));
    }
}

// Only ever called with a query — an empty box is answered by the
// palette's own bookmarks/recent groups instead.
function matchingTopics(needle, limit) {
    if (!needle || !settings.get("paletteTopics")) return [];

    const found = [];
    for (const entry of knownTopics()) {
        if (!matchesWords(entry.t, needle)) continue;
        found.push(entry);
        // A margin over `limit` for the sort below to choose from.
        if (found.length >= limit * 4) break;
    }

    // A title starting with the query ranks above one that merely
    // contains it; ties go to the most recently seen.
    const folded = foldText(needle);
    const rank = (entry) => (foldText(entry.t).startsWith(folded) ? 0 : 1);
    found.sort((a, b) => rank(a) - rank(b) || b.s - a.s);
    return found.slice(0, limit);
}

/** Palette rows for those, in the shape collectItems() builds. */
function topicPaletteItems(needle, limit) {
    return matchingTopics(needle, limit).map((entry) => ({
        label: entry.t,
        icon: "topic",
        hint: entry.b || t("topic"),
        href: entry.h,
        preview: entry.h,
    }));
}

// Choosing a search navigates away, so there's no response to read — only
// the time of the last request, enough to say "not yet" before the board does.
function noteBoardSearch() {
    bucket.set("lastSearch", Date.now());
}

/** Seconds still to wait, or 0 when a search is worth trying. */
function searchCooldown() {
    const last = Number(bucket.get("lastSearch", 0));
    if (!Number.isFinite(last) || !last) return 0;
    const left = SEARCH_INTERVAL - (Date.now() - last);
    // A stamp from a clock set back would otherwise read as hours of wait.
    if (left <= 0 || left > SEARCH_INTERVAL) return 0;
    return Math.ceil(left / 1000);
}

// In-memory only — a preview is a glance at 110 KB that has no business in
// storage; arrowing over the same topic again just reuses the promise.
const previewCache = new Map();

/** Trim a run of post text to something that fits a pane. */
function previewBlurb(body) {
    if (!body) return "";
    const text = body.textContent.replace(/\s+/g, " ").trim();
    if (text.length <= 260) return text;
    // On a word, so the cut does not land mid-title.
    const cut = text.slice(0, 260);
    const space = cut.lastIndexOf(" ");
    return (space > 180 ? cut.slice(0, space) : cut) + "…";
}

// The board's CSP (img-src 'self' https: data:) allows a post's own imgur/Steam
// art here too; smilies and template icons are excluded by path and size floor.
function previewImage(doc, body) {
    if (!body) return null;
    for (const img of body.querySelectorAll("img")) {
        const src = img.getAttribute("src") || "";
        if (!src || /\/(?:images|imageset|smilies)\//i.test(src)) continue;
        const width = parseInt(img.getAttribute("width") || "0", 10);
        if (width && width < 120) continue;
        try {
            return new URL(src, doc.baseURI || location.href).href;
        } catch {
            return null;
        }
    }
    return null;
}

/** What the topic's own page says about itself. */
function readTopicPage1(doc, href) {
    const found = posts(doc);
    const first = found[0] || null;
    const heading = doc.querySelector("#pageheader h2, a.titles");
    const crumbs = Array.from(doc.querySelectorAll("#wrapcentre a.breadcrumbs"));
    const pages = doc.body.textContent.match(/(?:Page|Страница)\s+\d+\s+(?:of|из)\s+(\d+)/i);

    // headCell not head: `head` is a band topic.js draws, and this document
    // never went near topic.js. Date matched by shape, not the label before it.
    const posted = first && first.headCell
        ? first.headCell.textContent.replace(/\s+/g, " ").trim()
        : "";
    const when = posted.match(/(\d{1,2}\s+[A-Za-zА-Яа-я]{3,}\s+\d{4}(?:,?\s+\d{1,2}:\d{2})?)/);

    return {
        href,
        title: heading ? heading.textContent.replace(/\s+/g, " ").trim() : null,
        board: crumbs.length ? crumbs[crumbs.length - 1].textContent.trim() : null,
        pages: pages ? Number(pages[1]) : 1,
        author: first && first.author ? first.author.textContent.trim() : null,
        when: when ? when[1].trim().slice(0, 40) : null,
        blurb: first ? previewBlurb(first.body) : "",
        image: first ? previewImage(doc, first.body) : null,
    };
}

// The promise itself is cached, so hovering the same topic again while the
// first fetch is still in flight waits on it instead of starting another.
function previewTopic(href) {
    const id = topicKey(href);
    if (!id) return Promise.reject(new Error("not a topic"));
    if (previewCache.has(id)) return previewCache.get(id);

    const job = (async () => {
        const response = await fetch(href, { credentials: "same-origin" });
        if (!response.ok) throw new Error("the board answered " + response.status);
        const doc = parseDocument(await response.text());
        if (!doc) throw new Error("that page could not be read");
        return readTopicPage1(doc, href);
    })();

    // Not kept on failure — the next hover should retry rather than repeat an
    // old error.
    job.catch(() => previewCache.delete(id));
    previewCache.set(id, job);
    return job;
}

function previewSkeleton() {
    return el("div.rr-preview__wait", {}, [t("Reading that topic…")]);
}

// Width isn't reliable in the markup, so this waits for the actual file and
// removes itself if it turns out too small or fails to load.
function previewArt(src) {
    const art = el("img.rr-preview__art", {
        src,
        alt: "",
        loading: "lazy",
        referrerpolicy: "no-referrer",
    });
    art.addEventListener("load", () => {
        if (art.naturalWidth && art.naturalWidth < 120) art.remove();
    });
    art.addEventListener("error", () => art.remove());
    return art;
}

function renderPreview(pane, info) {
    const meta = [
        info.board,
        info.pages > 1 ? t("{n} pages", { n: info.pages }) : null,
    ].filter(Boolean).join(" · ");

    // Filtered before append(): Node.append() renders a null child as the
    // text "null" (el() drops it, append() doesn't).
    const parts = [
        info.image ? previewArt(info.image) : null,
        el("div.rr-preview__title", {}, [info.title || t("this topic")]),
        meta ? el("div.rr-preview__meta", {}, [meta]) : null,
        info.author
            ? el("div.rr-preview__by", {}, [
                t("Opened by {who}", { who: info.author }) + (info.when ? " · " + info.when : ""),
            ])
            : null,
        info.blurb ? el("p.rr-preview__blurb", {}, [info.blurb]) : null,
        el("div.rr-preview__foot", {}, [t("Enter to open")]),
    ].filter(Boolean);

    pane.textContent = "";
    pane.append(...parts);
}

// Pane goes in the overlay, not the panel: the panel clips its own corners
// (cutting off a right-hung child), and a sibling in its centred row would
// shove the list 170px left on first open.
function attachTopicPreview(overlay, currentItem) {
    if (!settings.get("palettePreview")) return () => {};
    if (window.innerWidth < PREVIEW_MIN_WIDTH) return () => {};

    const pane = el("aside.rr-preview", { hidden: true, "aria-live": "polite" });
    overlay.append(pane);

    let timer = 0;
    let shown = null;

    const clear = () => {
        window.clearTimeout(timer);
        timer = 0;
    };

    const show = (href) => {
        const id = topicKey(href);
        if (!id || id === shown) return;
        // Re-checked here too, in case the window narrowed since the
        // palette opened — no fetch for a pane the stylesheet now hides.
        if (window.innerWidth < PREVIEW_MIN_WIDTH) return;
        shown = id;
        pane.hidden = false;
        pane.textContent = "";
        pane.append(previewSkeleton());
        previewTopic(href).then(
            (info) => { if (shown === id) renderPreview(pane, info); },
            (err) => {
                if (shown !== id) return;
                pane.textContent = "";
                pane.append(el("div.rr-preview__wait", {}, [String(err.message || err)]));
            },
        );
    };

    const settle = () => {
        clear();
        const item = currentItem();
        const href = item && item.preview;
        if (!href) return;
        // Already cached: skip the dwell, nothing to wait for.
        if (previewCache.has(topicKey(href))) { show(href); return; }
        timer = window.setTimeout(() => show(href), PREVIEW_DWELL);
    };

    return settle;
}

// This index is the largest of what "Clear data" forgets, and lives on its
// own key so store.replace({}) doesn't reach it — it has to be dropped by name.
function forgetTopicIndex() {
    bucket.drop(TOPIC_BUCKET);
    bucket.drop("lastSearch");
}

function initTopicIndex() {
    // Caught here (not navbar.js) so a rebuilt search box still counts
    // against the flood interval; capture since the board's handler may
    // stop the event.
    document.addEventListener("submit", (event) => {
        const form = event.target;
        if (!(form instanceof HTMLFormElement)) return;
        if (/search\.php/.test(form.getAttribute("action") || "")) noteBoardSearch();
    }, true);

    // After first paint: nothing reads the index until Ctrl+K.
    const later = window.requestIdleCallback || ((fn) => window.setTimeout(fn, 400));
    later(() => {
        try {
            harvestTopics();
        } catch (err) {
            console.warn("[RIN Reforged] topic index:", err);
        }
    });
}

/* ================= src/modules/palette.js ================= */
// Command palette (Ctrl+K): search, bookmarks, recent topics, script actions.
// Forum list is cached on first index visit so the jump list works anywhere.

let paletteHost = null;

// Unset, phpBB defaults to sr=posts/sf=all — a quoted post duplicates results
// per quote. Keyed by the board's own sf value (see navbar.js addSearchOptions).
const SEARCH_DEPTH = {
    titleonly: { sf: "titleonly", hint: "titles" },
    firstpost: { sf: "firstpost", hint: "titles + first post" },
    msgonly:   { sf: "msgonly",   hint: "post text" },
    all:       { sf: "all",       hint: "every post" },
};

// Author filter, kept only in memory — a persisted name would silently
// narrow every later search with no chip on screen to show it.
let searchAuthor = "";

// Which forum a search goes to (or null for the whole board) — mirrors the
// navbar box's own logic, since PAGE.forumId is null on listing-reached topics.
function paletteSearchPlace() {
    const kept = searchPrefs().where;
    // Named f:<id> so the navbar box (which only knows here/up/board) falls
    // back to its default instead of misreading a room it has no word for.
    if (kept && kept.slice(0, 2) === "f:") {
        const id = kept.slice(2);
        const name = knownForumName(id);
        return name ? { id: id, name: name } : null;
    }
    if (!(PAGE.isForum || PAGE.isTopic)) return null;
    const trail = forumTrail();
    if (!trail.length) return null;
    const here = trail[trail.length - 1];
    const up = parentForum(trail);
    if (kept === "board") return null;
    if (kept === "here") return here;
    if (kept === "up") return up || here;
    // Default: the topic's parent forum, or the forum itself on a listing.
    return PAGE.isTopic ? (up || here) : here;
}

function boardSearchUrl(query) {
    const depth = SEARCH_DEPTH[searchDepthChoice()] || SEARCH_DEPTH.titleonly;
    const place = paletteSearchPlace();
    const url = new URL("./search.php", location.href);
    // A query with no words is valid as long as an author is set (a member's
    // whole history in a room).
    if (query) url.searchParams.set("keywords", query);
    if (searchAuthor) url.searchParams.set("author", searchAuthor);
    url.searchParams.set("terms", searchChoice("terms", SEARCH_TERMS));
    url.searchParams.set("sf", depth.sf);
    url.searchParams.set("sr", searchChoice("sr", SEARCH_SHOW));
    if (place) url.searchParams.set("fid[]", place.id);
    return url.toString();
}

// The chooser at the head of the field lets a search be aimed (room, depth,
// terms, author) before it's sent, instead of inheriting whatever the navbar
// box was last set to. Sorting/date-range/excerpt length stay on the results page.

const FORUM_TREE_KEY = "forumTree";

// Forum list: the search form's <select> is complete (per-account visibility)
// but rarely visited; the index is seen by everyone but knows less. Index
// fills the list until the form has been opened once.
function storeForumTree(rooms, source) {
    if (!rooms.length) return;
    const kept = store.get(FORUM_TREE_KEY, null);
    if (source === "index" && kept && kept.source === "form") return;
    store.set(FORUM_TREE_KEY, { source: source, rooms: rooms });
}

function forumTree() {
    const kept = store.get(FORUM_TREE_KEY, null);
    return kept && Array.isArray(kept.rooms) ? kept.rooms : [];
}

// Depth = indent the template wrote ("&nbsp; &nbsp;" per level, 3 chars/level).
// A depth-0 row with deeper rows under it and none above is a category heading
// (e.g. "English Forums"), not a searchable room.
function cacheSearchFormForums() {
    const select = document.querySelector('select[name="fid[]"]');
    if (!select) return;

    const rooms = Array.from(select.options).map((option) => {
        const raw = option.textContent || "";
        const title = raw.replace(/[\s ]+/g, " ").trim();
        const lead = raw.length - raw.replace(/^[\s ]+/, "").length;
        return { id: option.value, title: title, depth: Math.min(Math.round(lead / 3), 3) };
    }).filter((room) => /^\d+$/.test(room.id) && room.title);

    rooms.forEach((room, index) => {
        const next = rooms[index + 1];
        if (!room.depth && next && next.depth > room.depth) room.cat = true;
    });
    storeForumTree(rooms, "form");
}

/** The same list off the index, which is poorer but always seen. */
function cacheIndexForums() {
    const rooms = [];
    for (const entry of forumRows()) {
        rooms.push({ id: entry.id, title: entry.title, depth: 0 });
        for (const link of entry.row.querySelectorAll("a.subforum")) {
            const match = (link.getAttribute("href") || "").match(/[?&]f=(\d+)/);
            if (match) rooms.push({ id: match[1], title: link.textContent.trim(), depth: 1 });
        }
    }
    storeForumTree(rooms, "index");
}

// `where` is shared with the navbar box, which only knows here/up/board — a
// picked room matching one of those is stored as that word, else as `f:<id>`.
function scopeValueFor(id) {
    const trail = forumTrail();
    const here = trail.length ? trail[trail.length - 1] : null;
    const up = parentForum(trail);
    if (here && String(here.id) === String(id)) return "here";
    if (up && String(up.id) === String(id)) return "up";
    return "f:" + id;
}

function paletteScopeRooms() {
    const tree = forumTree();
    if (tree.length) return tree;

    // No cache yet (index/search form never opened) — fall back to the breadcrumb.
    const trail = forumTrail();
    const here = trail.length ? trail[trail.length - 1] : null;
    const up = parentForum(trail);
    const rooms = [];
    if (up) rooms.push({ id: String(up.id), title: up.name, depth: 0 });
    if (here && (!up || up.id !== here.id)) rooms.push({ id: String(here.id), title: here.name, depth: up ? 1 : 0 });
    return rooms;
}

// `onPick` redraws the palette: the search row names room/depth/author, so a
// choice here that skipped the redraw would leave a stale answer showing.
function buildPaletteScope(onPick) {
    const rooms = el("div.rr-palette__rooms", { role: "group", "aria-label": t("Where to search") });
    const inSeg = el("div.rr-seg", { role: "group", "aria-label": t("What to search") });
    const termsSeg = el("div.rr-seg", { role: "group", "aria-label": t("Terms") });
    const showSeg = el("div.rr-seg", { role: "group", "aria-label": t("Show") });
    const author = el("input.rr-palette__author", {
        type: "text",
        placeholder: t("Any member"),
        "aria-label": t("Author"),
        autocomplete: "off",
        spellcheck: "false",
    });

    const where = el("span.rr-search__where");
    const button = labelled(
        el("button.rr-search__opts.rr-palette__scope", { type: "button", "aria-expanded": "false" }, [icon("sliders", 13), where]),
        t("Search options"));

    const pop = el("div.rr-palette__pop", { role: "group", "aria-label": t("Search options"), hidden: true }, [
        el("div.rr-palette__poprow", {}, [el("span.rr-search__rowlabel", {}, [t("Where")]), rooms]),
        el("div.rr-search__row", {}, [el("span.rr-search__rowlabel", {}, [t("Look in")]), inSeg]),
        el("div.rr-search__row", {}, [el("span.rr-search__rowlabel", {}, [t("Terms")]), termsSeg]),
        el("div.rr-search__row", {}, [el("span.rr-search__rowlabel", {}, [t("Show")]), showSeg]),
        el("div.rr-search__row", {}, [el("span.rr-search__rowlabel", {}, [t("Author")]), author]),
    ]);

    // Matched by forum id, not stored word — "here" and "f:10" can be the same room.
    const sync = () => {
        const place = paletteSearchPlace();
        const id = place ? String(place.id) : null;
        const depth = searchDepthChoice();
        where.textContent = place ? shortForumName(place.name) : t("Whole board");
        // Room is already shown on the chip; the accent flags the other options.
        button.toggleAttribute("data-rr-active", depth !== "titleonly"
            || Boolean(searchAuthor)
            || searchChoice("terms", SEARCH_TERMS) !== "all"
            || searchChoice("sr", SEARCH_SHOW) !== "topics");
        for (const node of rooms.querySelectorAll("button")) {
            node.setAttribute("aria-pressed", (node.dataset.forum || null) === id ? "true" : "false");
        }
        for (const node of inSeg.children) {
            node.setAttribute("aria-pressed", node.dataset.value === depth ? "true" : "false");
        }
        for (const node of termsSeg.children) {
            node.setAttribute("aria-pressed", node.dataset.value === searchChoice("terms", SEARCH_TERMS) ? "true" : "false");
        }
        for (const node of showSeg.children) {
            node.setAttribute("aria-pressed", node.dataset.value === searchChoice("sr", SEARCH_SHOW) ? "true" : "false");
        }
    };

    const choose = (key, value) => { setSearchPref(key, value); sync(); onPick(); };

    const room = (label, forum, depth) => {
        const node = el("button.rr-palette__room", { type: "button", title: label }, [label]);
        if (forum) node.dataset.forum = forum;
        node.style.paddingLeft = 8 + depth * 12 + "px";
        node.addEventListener("click", () => choose("where", forum ? scopeValueFor(forum) : "board"));
        return node;
    };

    rooms.append(room(t("Whole board"), null, 0));
    for (const entry of paletteScopeRooms()) {
        if (entry.cat) {
            rooms.append(el("div.rr-palette__roomcat", {}, [entry.title]));
            continue;
        }
        rooms.append(room(entry.title, String(entry.id), entry.depth || 0));
    }

    const segment = (seg, options, key) => {
        for (const option of options) {
            const node = el("button", { type: "button" }, [t(option.label)]);
            node.dataset.value = option.value;
            node.addEventListener("click", () => choose(key, option.value));
            seg.append(node);
        }
    };
    segment(inSeg, SEARCH_IN, "sf");
    segment(termsSeg, SEARCH_TERMS, "terms");
    segment(showSeg, SEARCH_SHOW, "sr");

    author.value = searchAuthor;
    author.addEventListener("input", debounce(() => {
        searchAuthor = author.value.trim();
        sync();
        onPick();
    }, 120));

    const close = () => {
        pop.hidden = true;
        button.setAttribute("aria-expanded", "false");
    };
    const open = () => {
        pop.hidden = false;
        button.setAttribute("aria-expanded", "true");
        // Focus the current selection so arrow keys have a starting point.
        const first = rooms.querySelector('button[aria-pressed="true"]') || rooms.firstElementChild;
        if (first) first.focus();
        if (first) first.scrollIntoView({ block: "nearest" });
    };
    button.addEventListener("click", () => {
        if (pop.hidden) open();
        else { close(); button.focus(); }
    });

    // Enter in the author field closes the popover and returns focus to the query.
    author.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        close();
        onPick("focus");
    });

    sync();
    return { button: button, pop: pop, sync: sync, close: close, isOpen: () => !pop.hidden };
}

function cacheForumList() {
    if (!PAGE.isIndex) return;

    const forums = forumRows().map((entry) => {
        // Topic count is the only ranking signal available; sorts busy boards first.
        const cell = entry.row.querySelector('td[data-rr-col="topics"]');
        const topics = cell ? parseInt(cell.textContent.replace(/\D/g, ""), 10) : 0;
        return {
            id: entry.id,
            title: entry.title,
            href: "./viewforum.php?f=" + entry.id,
            topics: Number.isFinite(topics) ? topics : 0,
        };
    });

    forums.sort((a, b) => b.topics - a.topics);
    if (forums.length) store.set("forums", forums);

    // Two lists for two questions: traffic order for "which board do I mean",
    // board order (with subforums) for "which board do I search".
    cacheIndexForums();
}

function donateHref() {
    const link = Array.from(document.querySelectorAll('#wrapheader a[href], .rr-boardbar a[href]'))
        .find((a) => /donat/i.test(a.getAttribute("href") || "") || /donat/i.test(a.textContent || ""));
    return link ? link.getAttribute("href") : null;
}

function paletteActions() {
    const actions = [
        { label: "Open settings", icon: "settings", run: () => openSettings() },
        { label: "Keyboard shortcuts", icon: "keyboard", run: () => openShortcutSheet() },
        { label: "Board index", icon: "home", href: "./index.php" },
        // Reuses the masthead's donation link so it's reachable without scrolling up.
        { label: "Donate to the board", icon: "heart", href: donateHref() || "./donate.php" },
        { label: "View active topics", icon: "clock", href: "./search.php?search_id=active_topics" },
        { label: "View unanswered posts", icon: "clock", href: "./search.php?search_id=unanswered" },
        {
            label: "Switch theme",
            icon: "layers",
            run: () => {
                const order = ["native", "slate", "carbon", "paper"];
                const next = order[(order.indexOf(settings.get("theme")) + 1) % order.length];
                settings.set("theme", next);
                toast("Theme: " + next);
            },
        },
    ];

    if (PAGE.isTopic) {
        actions.unshift({
            label: "Copy link to this topic",
            icon: "link",
            run: () => copyText(location.origin + location.pathname + "?t=" + PAGE.topicId, "Topic link copied"),
        });
        actions.unshift({
            label: "Jump to the last page",
            icon: "arrowDown",
            run: () => {
                const info = pagination();
                if (info.last && info.hasNext) location.href = info.last;
                else toast("Already on the last page");
            },
        });
    }
    return actions;
}

function collectItems() {
    const groups = [];

    // Bookmarks/recent topics get a preview pane (preview.js) via `preview`;
    // boards and actions have none.
    const bookmarks = store.get("bookmarks", []);
    if (bookmarks.length) {
        groups.push({
            title: "Bookmarks",
            items: bookmarks.map((item) => ({
                label: item.title, icon: "star", hint: t("topic"), href: item.href, preview: item.href,
            })),
        });
    }

    const forums = store.get("forums", []);
    if (forums.length) {
        groups.push({
            title: t("Boards"),
            items: forums.map((item) => ({
                label: item.title, icon: "layers", hint: t("board"), href: item.href,
            })),
        });
    }

    const history = store.get("history", []);
    if (history.length) {
        groups.push({
            title: t("Recent"),
            items: history.slice(0, 12).map((item) => ({
                label: item.title, icon: "clock", hint: t("topic"), href: item.href, preview: item.href,
            })),
        });
    }

    // On a topic page, put topic-specific actions first (used to be buried
    // below boards/recent topics).
    const actions = { title: t("Actions"), items: paletteActions() };
    if (PAGE.isTopic) groups.unshift(actions);
    else groups.push(actions);
    return groups;
}

function openPalette() {
    if (paletteHost) return;
    // Settings panel/shortcut sheet are modal; avoid stacking focus traps.
    if (document.querySelector(".rr-panel, .rr-sheet")) return;

    const groups = collectItems();
    const input = el("input.rr-palette__input", {
        type: "text",
        placeholder: t("Search the forum, or jump to a board"),
        "aria-label": "Search or jump to",
        autocomplete: "off",
        spellcheck: "false",
        role: "combobox",
        "aria-expanded": "true",
        "aria-controls": "rr-palette-list",
        "aria-autocomplete": "list",
    });
    // Focus stays on the input, so aria-activedescendant names the highlighted
    // option for screen readers.
    const list = el("ul.rr-palette__list", { role: "listbox", id: "rr-palette-list" });
    // bar is the positioning anchor for the scope popover.
    const bar = el("div.rr-palette__bar", {}, [input]);
    const panel = el("div.rr-palette", { role: "dialog", "aria-modal": "true", "aria-label": "Command palette" }, [bar, list]);
    const overlay = el("div.rr-overlay", {}, [panel]);

    let flat = [];
    let cursor = 0;

    const searchItem = (query) => {
        const place = paletteSearchPlace();
        const cooldown = searchCooldown();
        return {
            // Four full sentences rather than one assembled from bolted-together pieces.
            label: searchAuthor
                ? (query
                    ? (place
                        ? t("Search {forum} for {q} by {who}", { forum: place.name, q: query, who: searchAuthor })
                        : t("Search the forum for {q} by {who}", { q: query, who: searchAuthor }))
                    : (place
                        ? t("Everything {who} posted in {forum}", { who: searchAuthor, forum: place.name })
                        : t("Everything {who} posted", { who: searchAuthor })))
                : (place
                    ? t("Search {forum} for {q}", { forum: place.name, q: query })
                    : t("Search the forum for {q}", { q: query })),
            icon: "search",
            // Board rate-limits searches (~30s); hint shows the wait instead of a
            // wasted page load that just says no.
            hint: cooldown
                ? t("wait {n}s", { n: cooldown })
                : (SEARCH_DEPTH[searchDepthChoice()]?.hint || "Enter"),
            href: boardSearchUrl(query),
            run: () => {
                noteBoardSearch();
                location.href = boardSearchUrl(query);
            },
        };
    };

    const render = (query) => {
        list.textContent = "";
        flat = [];
        const needle = query.trim().toLowerCase();

        // An author alone is a valid search, with or without a query.
        if (needle || searchAuthor) list.append(renderGroup(t("Search"), [searchItem(query.trim())], flat));

        // Previously-seen topics (preview.js), shown above boards: a game name
        // most likely means an existing thread, not a new search.
        const seen = needle ? topicPaletteItems(needle, 8) : [];
        if (seen.length) list.append(renderGroup(t("Topics"), seen, flat));

        for (const group of groups) {
            const matches = needle
                ? group.items.filter((item) => matchesWords(item.label, needle)).slice(0, 8)
                : group.items.slice(0, group.title === t("Boards") ? 7 : 6);
            if (matches.length) list.append(renderGroup(group.title, matches, flat));
        }

        if (!flat.length) list.append(el("div.rr-palette__empty", {}, [t("Nothing matches that")]));
        cursor = 0;
        highlight();
    };

    const renderGroup = (title, items, sink) => {
        const fragment = document.createDocumentFragment();
        fragment.append(el("li.rr-palette__group", { role: "presentation" }, [title]));
        for (const item of items) {
            // data-href carries the URL since role="option" can't be an <a>;
            // handles middle-click/ctrl-click to open in a new tab.
            const node = el("li.rr-palette__item", {
                role: "option",
                id: "rr-palette-opt-" + sink.length,
                "aria-selected": "false",
                "data-href": item.href || null,
            }, [
                icon(item.icon || "chevron"),
                el("span.rr-palette__label", {}, [item.label]),
                item.hint ? el("span.rr-palette__hint", {}, [item.hint]) : null,
            ]);

            const go = item.run || (() => { location.href = item.href; });
            node.addEventListener("click", (event) => {
                if (item.href && (event.ctrlKey || event.metaKey || event.shiftKey)) {
                    window.open(item.href, "_blank", "noopener");
                    return;
                }
                close();
                go();
            });
            node.addEventListener("auxclick", (event) => {
                if (event.button === 1 && item.href) {
                    event.preventDefault();
                    window.open(item.href, "_blank", "noopener");
                }
            });
            node.addEventListener("mousemove", () => { cursor = sink.indexOf(node); highlight(); });
            sink.push(node);
            node._run = go;
            // What the preview pane reads off the cursor (preview.js).
            node._item = item;
            fragment.append(node);
        }
        return fragment;
    };

    // Preview pane beside the panel (preview.js); no-op when there's no room.
    const onCursor = attachTopicPreview(overlay, () => (flat[cursor] ? flat[cursor]._item : null));

    const highlight = () => {
        flat.forEach((node, index) => node.setAttribute("aria-selected", index === cursor ? "true" : "false"));
        const current = flat[cursor];
        if (current) {
            current.scrollIntoView({ block: "nearest" });
            input.setAttribute("aria-activedescendant", current.id);
        } else {
            input.removeAttribute("aria-activedescendant");
        }
        onCursor();
    };

    searchAuthor = "";
    const scope = buildPaletteScope((what) => {
        render(input.value);
        if (what === "focus") input.focus();
    });
    bar.prepend(scope.button);
    bar.append(scope.pop);

    const previous = document.activeElement;
    let release = () => {};
    const close = () => {
        overlay.remove();
        paletteHost = null;
        release();
        document.removeEventListener("keydown", onKey, true);
    };

    const onKey = (event) => {
        // Captures on document, so while the popover is open it must defer to
        // it — else Enter/Escape would hit the palette instead of the popover.
        if (scope.isOpen()) {
            if (event.key !== "Escape") return;
            event.preventDefault();
            event.stopPropagation();
            scope.close();
            scope.button.focus();
            return;
        }
        if (event.key === "Escape") { event.preventDefault(); close(); }
        else if (event.key === "ArrowDown") { event.preventDefault(); cursor = Math.min(cursor + 1, flat.length - 1); highlight(); }
        else if (event.key === "ArrowUp") { event.preventDefault(); cursor = Math.max(cursor - 1, 0); highlight(); }
        else if (event.key === "Home" && flat.length) { event.preventDefault(); cursor = 0; highlight(); }
        else if (event.key === "End" && flat.length) { event.preventDefault(); cursor = flat.length - 1; highlight(); }
        else if (event.key === "Enter") {
            event.preventDefault();
            const node = flat[cursor];
            if (!node) return;
            const href = node.getAttribute("data-href");
            if (href && (event.ctrlKey || event.metaKey)) {
                window.open(href, "_blank", "noopener");
                return;
            }
            if (node._run) { close(); node._run(); }
        }
    };

    input.addEventListener("input", debounce(() => render(input.value), 60));
    overlay.addEventListener("mousedown", (event) => { if (event.target === overlay) close(); });
    // Click anywhere else in the palette closes the scope popover.
    panel.addEventListener("mousedown", (event) => {
        if (scope.isOpen() && !scope.pop.contains(event.target) && !scope.button.contains(event.target)) scope.close();
    });
    document.addEventListener("keydown", onKey, true);

    document.body.append(overlay);
    paletteHost = overlay;
    render("");
    release = trapFocus(panel, previous instanceof HTMLElement ? previous : null);
    input.focus();
}

function initPalette() {
    cacheForumList();
    // Only the full search form's page prints the whole forum tree.
    cacheSearchFormForums();
    if (!settings.get("palette")) return;
    document.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            openPalette();
        }
    });
}

/* ================= src/modules/shortcuts.js ================= */
// Single-key bindings only fire when nothing is focused that would swallow them, so typing "j" in the reply box still types a j.

const SHORTCUTS = [
    { keys: "Ctrl K", what: "Search or jump to anything" },
    { keys: "j / k", what: "Next / previous post, or row of a listing" },
    { keys: "Enter", what: "Open the row under the cursor" },
    { keys: "n / p", what: "Next / previous page of the topic" },
    { keys: "g then i", what: "Board index" },
    { keys: "g then f", what: "The forum this topic is in" },
    { keys: "g then t", what: "Top of the page" },
    { keys: "g then b", what: "Bottom of the page" },
    { keys: "r", what: "Reply to this topic" },
    { keys: "s", what: "Focus the filter or search box" },
    { keys: ",", what: "Open settings" },
    { keys: "?", what: "This list" },
];

function typingInField(target) {
    if (!target) return false;
    if (target.isContentEditable) return true;
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function scrollToPost(direction) {
    const anchors = Array.from(document.querySelectorAll('a[name^="p"]'))
        .filter((node) => /^p\d+$/.test(node.getAttribute("name") || ""));
    if (!anchors.length) return;

    const top = window.scrollY + 70;
    const placed = anchors.map((node) => ({ node, at: node.getBoundingClientRect().top + window.scrollY }));
    let target = null;
    if (direction > 0) {
        target = placed.find((entry) => entry.at > top + 10);
    } else {
        for (const entry of placed) {
            if (entry.at < top - 10) target = entry;
        }
    }
    if (!target) target = direction > 0 ? placed[placed.length - 1] : placed[0];
    window.scrollTo({ top: target.at - 60, behavior: scrollBehaviour() });
}

// j/k walk listing rows the way they walk topic posts; Enter opens the focused row's link. Returns false with no listing, so the caller falls back to posts.
function moveListCursor(direction) {
    const pick = 'td[data-rr-col="title"] a.topictitle, td[data-rr-col="title"] a.forumlink';
    const rows = Array.from(document.querySelectorAll("table[data-rr-list] tr"))
        .filter((row) => row.querySelector(pick) && row.offsetParent !== null);
    if (!rows.length) return false;

    const at = rows.findIndex((row) => row.hasAttribute("data-rr-cursor"));
    let next;
    if (at < 0) next = direction > 0 ? 0 : rows.length - 1;
    else next = Math.min(rows.length - 1, Math.max(0, at + direction));
    if (at >= 0) rows[at].removeAttribute("data-rr-cursor");
    rows[next].setAttribute("data-rr-cursor", "");
    rows[next].scrollIntoView({ block: "nearest", behavior: scrollBehaviour() });
    const link = rows[next].querySelector(pick);
    if (link) link.focus({ preventScroll: true });
    return true;
}

function goPage(direction) {
    const info = pagination();
    const href = direction > 0 ? info.next : info.previous;
    if (href && (direction > 0 ? info.hasNext : info.hasPrevious)) location.href = href;
    else toast(direction > 0 ? "Last page" : "First page");
}

let shortcutSheet = null;

function openShortcutSheet() {
    // Pressing ? twice used to stack a second copy over the first.
    if (shortcutSheet) { shortcutSheet(); return; }

    const sheet = el("div.rr-sheet", {
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Keyboard shortcuts",
        tabindex: "-1",
    });

    const closeButton = el("button.rr-icon-btn.rr-sheet__close", {
        type: "button",
        title: "Close",
        "aria-label": "Close the shortcut list",
    }, [icon("close")]);

    sheet.append(el("div.rr-sheet__head", {}, [
        el("h2", {}, ["Keyboard shortcuts"]),
        closeButton,
    ]));

    const list = el("dl");
    for (const row of SHORTCUTS) {
        list.append(el("dt", {}, [el("span.rr-kbd", {}, [row.keys])]));
        list.append(el("dd", {}, [row.what]));
    }
    sheet.append(list);

    const overlay = el("div.rr-overlay", {}, [sheet]);
    const previous = document.activeElement;
    let release = () => {};

    const close = () => {
        overlay.remove();
        document.removeEventListener("keydown", onKey, true);
        release();
        shortcutSheet = null;
    };
    const onKey = (event) => { if (event.key === "Escape") { event.preventDefault(); close(); } };

    closeButton.addEventListener("click", close);
    overlay.addEventListener("mousedown", (event) => { if (event.target === overlay) close(); });
    document.addEventListener("keydown", onKey, true);
    document.body.append(overlay);

    release = trapFocus(sheet, previous instanceof HTMLElement ? previous : null);
    sheet.focus();
    shortcutSheet = close;
}

function initShortcuts() {
    if (!settings.get("shortcuts")) return;

    let awaitingG = false;
    let gTimer = 0;

    document.addEventListener("keydown", (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        if (typingInField(event.target)) return;
        if (document.querySelector(".rr-palette, .rr-sheet, .rr-panel, .rr-lightbox")) return;

        const key = event.key;

        if (awaitingG) {
            clearTimeout(gTimer);
            awaitingG = false;
            if (key === "i") { location.href = "./index.php"; return; }
            if (key === "f") {
                const crumb = Array.from(document.querySelectorAll("a.breadcrumbs, .rr-nav__crumbs a")).pop();
                if (crumb) crumb.click();
                return;
            }
            if (key === "t") { window.scrollTo({ top: 0, behavior: scrollBehaviour() }); return; }
            if (key === "b") { window.scrollTo({ top: document.body.scrollHeight, behavior: scrollBehaviour() }); return; }
            // Falls through rather than returning, so "g" then "j" still moves a post instead of being swallowed.
        }

        switch (key) {
            case "g":
                awaitingG = true;
                gTimer = setTimeout(() => { awaitingG = false; }, 900);
                break;
            case "j": event.preventDefault(); if (!moveListCursor(1)) scrollToPost(1); break;
            case "k": event.preventDefault(); if (!moveListCursor(-1)) scrollToPost(-1); break;
            case "n": goPage(1); break;
            case "p": goPage(-1); break;
            case "r": {
                // The quick reply first: "r" used to leave for the full posting page past the form already on this one.
                const quick = document.querySelector(".rr-reply textarea, .rr-reply > button.rr-btn");
                if (quick) {
                    event.preventDefault();
                    if (quick.tagName === "BUTTON") quick.click();
                    else quick.focus();
                    break;
                }
                const reply = document.querySelector('a[href*="mode=reply"]');
                if (reply) reply.click();
                break;
            }
            case "s": {
                event.preventDefault();
                const box = document.querySelector(".rr-toolbar__filter input")
                    || document.querySelector('input[name="keywords"]');
                if (box) { box.focus(); box.select(); }
                else if (settings.get("palette")) openPalette();
                break;
            }
            case ",": event.preventDefault(); openSettings(); break;
            case "?": event.preventDefault(); openShortcutSheet(); break;
            default: break;
        }
    });
}

/* ================= src/modules/chrome.js ================= */
/* Page furniture: reading progress and the floating jump buttons, both
   position:fixed and outside the forum markup so neither shifts the layout. */

/** A progress bar drawn part-filled at load reads as a stalled loading
 *  indicator (reported as a bug), so it sits on the sticky bar's bottom
 *  edge and stays hidden until the page has actually scrolled. */
function initProgress() {
    if (!settings.get("progress")) return;

    const bar = el("div.rr-progress", {
        role: "progressbar",
        "aria-label": "How far down this page you are",
        "aria-valuemin": "0",
        "aria-valuemax": "100",
        "aria-valuenow": "0",
        "data-rr-idle": "",
    });
    document.body.append(bar);

    let ticking = false;
    const update = () => {
        const doc = document.documentElement;
        const scrollable = doc.scrollHeight - doc.clientHeight;
        const percent = scrollable > 0 ? clamp((window.scrollY / scrollable) * 100, 0, 100) : 0;
        bar.style.width = percent.toFixed(2) + "%";
        bar.setAttribute("aria-valuenow", String(Math.round(percent)));
        bar.toggleAttribute("data-rr-idle", scrollable <= 0 || percent < 0.5);
        ticking = false;
    };
    on(window, "scroll", () => {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    // Re-measure when the page grows after load (images, a spoiler, the releases panel).
    // Not measured here up front: scrollHeight forces a full layout while the
    // stylesheet still holds the page hidden. ResizeObserver's first callback
    // arrives after that layout happens anyway, so it's free.
    if (window.ResizeObserver) new ResizeObserver(() => update()).observe(document.documentElement);
    else requestAnimationFrame(update);
}

// An unlabeled arrow button was reported as unidentifiable; a `title` tooltip
// wasn't enough, so both buttons get the same instant label the top bar icons use.
function initJumpButtons() {
    if (!settings.get("backToTop")) return;

    const tip = (node, text) => {
        labelled(node, text);
        node.setAttribute("data-rr-tip-side", "above");
        return node;
    };

    const up = tip(el("button", { type: "button", hidden: true }, [icon("arrowUp")]),
        "Back to top (g then t)");
    up.addEventListener("click", () => window.scrollTo({ top: 0, behavior: scrollBehaviour() }));

    const down = tip(el("button", { type: "button", hidden: true }, [icon("arrowDown")]),
        "Jump to the end (g then b)");
    down.addEventListener("click", () => window.scrollTo({ top: document.body.scrollHeight, behavior: scrollBehaviour() }));

    const fab = el("div.rr-fab", {}, [up, down]);
    document.body.append(fab);

    const update = () => {
        const doc = document.documentElement;
        up.hidden = window.scrollY < 400;
        down.hidden = window.scrollY > doc.scrollHeight - doc.clientHeight - 400;
    };
    on(window, "scroll", update, { passive: true });
    // Deferred one frame for the same layout-cost reason as the progress bar above.
    requestAnimationFrame(update);
}

/** Only makes the board's own donation overlay keyboard-closable (Escape); doesn't remove it. */
function fixOverlayFocus() {
    const overlay = document.getElementById("overlay");
    if (!overlay || overlay.style.display === "none") return;
    const close = document.getElementById("overlayconfirmbtn");
    if (!close) return;
    close.setAttribute("role", "button");
    close.setAttribute("tabindex", "0");
    on(document, "keydown", (event) => {
        if (event.key === "Escape" && overlay.style.display !== "none") close.click();
    });
}

function initChrome() {
    initProgress();
    initJumpButtons();
    fixOverlayFocus();
}

/* ================= src/main.js ================= */
/* Two boot phases: document-start (theme + stylesheet, before the old
   styling can flash) and DOM ready (everything touching markup, each
   module guarded so one failure can't blank the page). */

const RR_VERSION = "0.13.3";

function injectStyles() {
    const host = document.head || document.documentElement;
    if (!host || document.getElementById("rr-style")) return;
    const style = document.createElement("style");
    style.id = "rr-style";
    style.textContent = RR_CSS;
    host.append(style);
}

/** CS.RIN.RU Enhanced overlaps in places; when both run, it keeps the
    features it already owns. */
function detectEnhanced() {
    const present = Boolean(document.getElementById("configButton") || document.getElementById("ajaxload"));
    document.documentElement.toggleAttribute("data-rr-coexist", present && settings.get("coexist"));
    return present;
}

function guard(name, fn) {
    try {
        fn();
    } catch (err) {
        console.error("[RIN Reforged] " + name + " failed:", err);
    }
}

/* <body> stays hidden via CSS until data-rr-ready lands, avoiding a
   flash of the board's own layout before this script rebuilds it. It
   lands at the end of the late phase, on failure inside it, or via the
   watchdog below if the late phase never runs — never leave it unset. */
const READY_WATCHDOG = 4000;

function markReady() {
    const root = document.documentElement;
    if (root && !root.hasAttribute("data-rr-ready")) root.setAttribute("data-rr-ready", "");
}

function bootEarly() {
    registerSchema(SETTINGS_SCHEMA);
    guard("theme", initTheme);
    injectStyles();
}

/* Write-only inits run first; read-then-write ones (below the marker)
   run last. The board is nested tables, so a read-after-write forces a
   full layout — tens of ms each. Interleaved, that was 5 layouts per
   load instead of 1; measured live, folding quotes alone cost 36.7 ms
   and the breadcrumb strip 54.9 ms. Keep new modules on the correct
   side of the marker. */
function bootLate() {
    guard("coexistence", detectEnhanced);
    guard("icons", initIcons);
    guard("navbar", initNavbar);
    guard("lists", initLists);
    guard("topic index", initTopicIndex);
    guard("index", initBoardIndex);
    guard("topic", initTopic);
    guard("releases", initReleases);
    guard("quiet", initQuiet);
    guard("steam", initSteamPreview);
    guard("compose", initCompose);
    guard("posting", initPostingMemory);
    guard("toolbar", initPostingToolbar);
    guard("review", initTopicReview);
    guard("people", initPeople);
    guard("palette", initPalette);
    guard("shortcuts", initShortcuts);
    guard("spacing", dropStrayBreaks);
    guard("numbers", groupBoardNumbers);
    guard("chrome", initChrome);
    guard("menu", initSettingsUI);

    /* ---- reads the page back; nothing below writes for the ones
            after it to have to lay out again ---- */
    guard("crumbs", tidyCrumbStrip);
    guard("search", frameStraySearch);
    guard("separators", dropStraySeparators);
    guard("quotes", initQuotes);
    guard("ink", readableBoardInk);

    guard("anchor", settleFragment);
    markReady();

    // Enhanced loads at document-idle, so recheck after it may have arrived.
    setTimeout(() => guard("coexistence", detectEnhanced), 2000);
}

// documentElement can be missing at document-start, hence whenRoot; each
// phase is guarded separately so one failing doesn't stop the next.
guard("boot:early", () => whenRoot(bootEarly));
guard("boot:styles", () => whenBody(() => guard("styles", injectStyles)));
guard("boot:late", () => whenReady(() => { try { bootLate(); } finally { markReady(); } }));

// Last resort: a page held back forever is worse than the flash this avoids.
setTimeout(markReady, READY_WATCHDOG);

})();

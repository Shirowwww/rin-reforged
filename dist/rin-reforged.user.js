// ==UserScript==
// @name            RIN Reforged
// @name:fr         RIN Reforged
// @namespace       https://github.com/Shirowwww/rin-reforged
// @version         0.8.3
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
/* ------------------------------------------------------------------
   Design tokens.

   Every colour the redesign uses is declared here, once, on :root.
   Themes are attribute switches on <html>; nothing below this file
   ever writes a raw hex value.
   ------------------------------------------------------------------ */

html[data-rr] {
    /* Slate & Brass - the default. A blue-leaning slate rather than
       pure black: on OLED panels pure black behind light text causes
       halation, and this forum is read for hours at a time. */
    --rr-bg:            #0e1013;
    --rr-bg-sunken:     #08090b;
    --rr-surface:       #15181d;
    --rr-surface-2:     #1c2026;
    --rr-surface-3:     #252a31;
    /* The board draws its grid with a 1px gap showing the table's own
       light background through, which is most of what makes a listing
       readable at a glance. A hairline too faint to see turns the same
       listing into one undifferentiated block, so these are pitched to
       stay visible against --rr-surface rather than to disappear. */
    --rr-line:          #2f353e;
    --rr-line-strong:   #454e5a;

    --rr-text:          #dfe4ea;
    --rr-text-strong:   #f2f5f8;
    --rr-muted:         #8b95a3;
    /* Supporting detail: the rank under a name, the page label in the
       pager, the date on a release row, "108 on this page". Quiet, and
       quiet has a floor — every one of those measured between 3.1 and
       4.0 against the surface it sits on, and 12px text is held to
       4.5. The value on each theme is the smallest lift of the same
       hue that clears 4.6 against --rr-surface, --rr-surface-2 and
       --rr-bg-sunken, which is the field the palette trigger sits in.
       test/contrast.js measures all four and fails the run if one
       slips back. */
    --rr-faint:         #7f8997;

    /* One accent, spent on actions and active state only. */
    --rr-accent:        #e0a338;
    --rr-accent-soft:   #4a3a1c;
    --rr-accent-text:   #0e1013;
    --rr-link:          #7fb4de;
    --rr-link-visited:  #9d93cf;

    /* Taxonomy. These map to the forum's own topic prefixes, so the
       colour carries information rather than decoration. */
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
    --rr-mark:          #5a4a1e;

    /* Type */
    --rr-font: "Inter", "Inter var", ui-sans-serif, "Segoe UI Variable Text",
               "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
    --rr-font-mono: ui-monospace, "Cascadia Code", "JetBrains Mono", "SF Mono",
               Menlo, Consolas, "DejaVu Sans Mono", monospace;

    --rr-fs:            15px;   /* overridden by the font-size setting */
    /* Derived sizes have a floor: at the smallest setting the -2/-3
       steps would land on 10 and 9px, which is where the original
       stylesheet already was. */
    --rr-fs-sm:         max(12px, calc(var(--rr-fs) - 2px));
    --rr-fs-xs:         max(11px, calc(var(--rr-fs) - 3px));
    --rr-fs-lg:         calc(var(--rr-fs) + 3px);
    --rr-fs-h1:         calc(var(--rr-fs) + 9px);
    --rr-lh:            1.7;
    /* Leading for supporting detail — the author line under a topic
       title, the joined last-post line, the pagination strip. It was
       1.4 everywhere, written in eight places, which at 13px is 18.2px
       of box around a 13px line: a stack of text rather than two
       facts. */
    --rr-lh-meta:       1.55;
    /* And the title itself. 1.35 is fine on one line and tight on the
       two-line titles this board is full of. */
    --rr-lh-title:      1.45;
    --rr-measure:       78ch;

    /* Space - a 4px base, so densities stay on the same rhythm. */
    --rr-s1: 4px;
    --rr-s2: 8px;
    --rr-s3: 12px;
    --rr-s4: 16px;
    --rr-s5: 24px;
    --rr-s6: 32px;
    --rr-s7: 48px;

    /* The sticky top bar's height, so anything that has to sit on its
       edge does not carry its own copy of the number. */
    --rr-nav-h: 48px;

    --rr-radius:      7px;
    --rr-radius-lg:   12px;
    --rr-radius-pill: 999px;

    /* Only genuinely floating things cast a shadow. Surfaces separate
       by value and a hairline instead. */
    --rr-shadow-pop: 0 8px 24px -6px rgba(0, 0, 0, .55), 0 2px 6px rgba(0, 0, 0, .35);
    --rr-shadow-bar: 0 1px 0 var(--rr-line);

    /* Vertical padding on a listing cell.

       Two passes of tightening took this to 6px and then to 5, each of
       them defensible on its own and both of them measured against how
       many rows fit on a screen rather than against how the page reads.
       Together they made a listing a wall. 9px is where a row has a top
       and a bottom again; the original board fits a topic row in 34px
       and this one now fits it in about 60, which is the trade being
       made deliberately rather than drifted into.

       Compact is still the old number, for anyone who wants it. */
    --rr-row-pad:     9px;
    --rr-post-gap:    var(--rr-s5);

    /* How wide the page frame gets.

       This was a flat 1200px, and on a 1900px window that is 350px of
       nothing down each side — on every page, including the index,
       where it left the board's own masthead art stranded in the
       middle of a black field. A fixed column is the right answer for
       prose and the wrong one for a frame that also has to hold a
       listing with six columns, a pager, an action bar and the
       releases panel.

       So the frame is fluid with a ceiling, and the two jobs are split
       between two tokens: this one sizes the frame, --rr-measure still
       caps the line length of anything that is actually read as prose.
       Widening the frame therefore does not lengthen a line of a post.

       1560px is the ceiling and 95vw the slope, which lands the frame
       at the window's width up to about 1640px and holds it there
       above. */
    --rr-content-max: min(1560px, 95vw);

    /* The inside edge of a card the script draws. Two passes of
       tightening landed on 8px, which against a 10px corner radius
       reads as content pressed into the corner; the action bar and the
       filter row it now contains were both at 8, so their shared edge
       was the tightest place on the page. */
    --rr-card-pad:    14px;

    --rr-speed: 140ms;
}

/* Native - the board's own colours.

   Everything else here is a redesign that could be any forum, and put
   side by side with cs.rin.ru that is exactly what it looks like. The
   board is not a blue-leaning slate with blue links: it is near-black
   (#070707), grey text (#CCCCCC), and red — \`a:link { color: red }\` is
   in its stylesheet, its usernames are #BF0000, its [Important] tags
   are red, and that is most of what makes a screenshot of it
   recognisable at a glance.

   So this theme is the board's own palette on the redesign's layout:
   its colours, its contrast and its links, with the spacing, the type
   scale and the structure of everything else in this script. The red
   is pulled off pure #FF0000, which vibrates against black at any
   length, and no further — it has to still read as the board's red.

   It is the default. Slate and Carbon stay for anyone who wants the
   quieter version. */
html[data-rr][data-rr-theme="native"] {
    /* A shade off the board's own #070707 rather than on it. The
       reasoning at the top of this file has not changed — pure black
       behind light text halates on an OLED panel and this forum is
       read for hours — and the identity is not in the last three
       percent of the black anyway. It is in the neutral (no blue cast,
       unlike Slate), the grey text, and the red. */
    --rr-bg:            #101010;
    --rr-bg-sunken:     #0a0a0a;
    --rr-surface:       #171717;
    --rr-surface-2:     #1e1e1e;
    --rr-surface-3:     #292929;
    --rr-line:          #2e2e2e;
    --rr-line-strong:   #474747;

    --rr-text:          #cccccc;
    --rr-text-strong:   #ffffff;
    --rr-muted:         #aaaaaa;
    --rr-faint:         #878787;

    /* The board sets \`a:link { color: red }\`, and every link on the
       page takes its colour from this one token — the breadcrumb, the
       board links, the finder, the lookup buttons. At the board's own
       saturation that is a page shouting in red rather than a page
       with red links in it. Same hue, conversational volume. */
    --rr-link:          #d1786b;
    --rr-link-visited:  #a8807c;

    /* The board's own taxonomy colours, where it has one: [Important]
       is red on the real board and amber here, which is the single
       most visible place the redesign stopped looking like it. */
    --rr-tag-important: #cf6152;
    --rr-tag-problem:   #cf6152;
    --rr-tag-release:   #4faa60;
    --rr-tag-info:      #4088b3;
    --rr-tag-neutral:   #999999;

    --rr-ok:            #4faa60;
    --rr-danger:        #cf6152;

    --rr-selection:     #45211c;
    --rr-mark:          #4e0707;
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
    --rr-mark:          #fbeaae;
    --rr-shadow-pop: 0 8px 24px -8px rgba(20, 26, 34, .22), 0 2px 6px rgba(20, 26, 34, .10);
}

/* Density. Compact keeps the old forum's information-per-screen,
   Roomy is for long reading sessions. */
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

/* Wide keeps the same slope and lifts the ceiling; Full drops both.
   Reading is the fluid default above. */
html[data-rr][data-rr-width="wide"]  { --rr-content-max: min(1980px, 97vw); --rr-measure: 92ch; }
html[data-rr][data-rr-width="full"]  { --rr-content-max: none;              --rr-measure: none; }

/* No bar, no edge to sit on. */
html[data-rr][data-rr-nav="off"] { --rr-nav-h: 0px; }

@media (prefers-reduced-motion: reduce) {
    html[data-rr] { --rr-speed: 0ms; }
}
/* And the same, asked for explicitly rather than read off the system. */
html[data-rr][data-rr-still] { --rr-speed: 0ms; scroll-behavior: auto; }
html[data-rr][data-rr-still] *,
html[data-rr][data-rr-still] *::before,
html[data-rr][data-rr-still] *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
}

/* == forum.css == */
/* ------------------------------------------------------------------
   Reskin of the phpBB (subsilver2 / rinDark) markup.

   The forum is built from nested layout tables with inline widths and
   colours, so a handful of rules here need !important to win. Those
   are marked; everything else relies on the html[data-rr] prefix for
   specificity.
   ------------------------------------------------------------------ */

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

/* phpBB sets 62.5% on <body> and then sizes everything in em. Reset the
   descendants that relied on it so one font-size setting drives it all. */
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

/* ---- Page frame ------------------------------------------------- */

/* The whole page sits inside one layout table. Left as a table it
   computes a minimum width from its widest cell, which is what makes
   the board scroll sideways on a phone no matter what the cells do.
   Turning the wrapper into blocks removes that floor. */
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

/* subsilver2 spaces its blocks with bare <br> between them; every block
   this script draws carries a margin of its own, so each of those is a
   second gap on top of the first. dropStrayBreaks() takes the ones
   beside the script's own bars; these are the rest — between the page
   header and the content, between two tables — and a sweep of fifty
   live pages found one on every listing. */
html[data-rr] #wrapcentre > br,
html[data-rr] #pagecontent > br { display: none; }

/* The original 340px-tall masthead is replaced by rr-nav; the node stays
   in the DOM because other userscripts read it, but leaves the flow. */
html[data-rr][data-rr-nav="on"] #wrapheader { display: none; }

/* ---- Tables ----------------------------------------------------- */

/* The gap between one post and the next, and between one block and
   the next on a listing page. The token for it existed from the start
   and was never actually applied to anything: the only thing holding
   two posts apart was whatever <br> the template happened to leave
   between them, which is why a thread read as one continuous slab. */
html[data-rr] table.tablebg,
html[data-rr] table.forumline {
    margin-bottom: var(--rr-post-gap);
    background: var(--rr-line);
    border: 1px solid var(--rr-line-strong);
    border-radius: var(--rr-radius-lg);
    border-spacing: 0 !important;
    border-collapse: separate;
    overflow: hidden;
    width: 100%;
}

html[data-rr] th {
    background: var(--rr-surface-2);
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

/* Category bars are the one piece of phpBB furniture worth keeping:
   every board has them, and a tinted bar with an accent edge reads as
   a section head at a glance. Toned right down from the original. */
html[data-rr] td.cat,
html[data-rr] td.catHead,
html[data-rr] td.catBottom,
html[data-rr] th.thHead {
    background: linear-gradient(
        to right,
        color-mix(in srgb, var(--rr-accent) 10%, var(--rr-surface-2)),
        var(--rr-surface-2) 260px
    );
    color: var(--rr-text-strong);
    font-weight: 650;
    font-size: var(--rr-fs-sm);
    padding: var(--rr-s2) var(--rr-s3);
    border: 0;
    border-bottom: 1px solid var(--rr-line);
    box-shadow: inset 2px 0 0 var(--rr-accent);
    /* The board's own stylesheet pins these at \`height: 25px\`. One line
       of a section heading fits and nothing shows it — but the same
       class carries the "Display posts from previous / Sort by / Go"
       strip, and on a phone that wraps to two lines and spilled out of
       the box: three controls drawn below the card they belong to, on
       top of the pagination line under it. The heading row beside this
       one already had to say the same thing. */
    height: auto;
}
html[data-rr] td.cat h4,
html[data-rr] td.cat a { color: var(--rr-text-strong); margin: 0; font-size: var(--rr-fs-sm); }

/* A category row is one cell plus a few empty ones the table needs to
   keep its columns. Tinting the whole row stops it reading as a bar
   that runs out halfway across. */
html[data-rr] tr:has(> td.cat) > td {
    background: var(--rr-surface-2);
    border-bottom: 1px solid var(--rr-line);
}

/* The collapse control is an <input type="button"> the original theme
   dressed with a background image. Here it becomes a chevron that
   points the way the click will move things. */
html[data-rr] td.catdiv { text-align: right; }
html[data-rr] input.ccopen[type="button"],
html[data-rr] input.ccclose[type="button"] {
    width: 26px;
    height: 22px;
    padding: 0;
    font-size: 0;
    background: transparent no-repeat center / 13px 13px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b95a3' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    border: 1px solid transparent;
    border-radius: var(--rr-radius);
    cursor: pointer;
    transition: background-color var(--rr-speed) ease, transform var(--rr-speed) ease;
}
html[data-rr] input.ccopen[type="button"] { transform: rotate(-90deg); }
html[data-rr] input.ccopen[type="button"]:hover,
html[data-rr] input.ccclose[type="button"]:hover { background-color: var(--rr-surface-3); border-color: var(--rr-line); }

/* Some .cat cells are not section heads at all: they hold the print /
   previous / next strip, or the "Display posts from previous / Sort by
   / Go" controls a listing ends with. Those get the surface without
   the accent — the tinted edge marks a block of content, and a row of
   form controls is not one. */
html[data-rr] td.cat:has(> table),
html[data-rr] td.cat:has(select),
html[data-rr] td.cat:has(input[type="submit"]) {
    background: var(--rr-surface-2);
    box-shadow: none;
    font-weight: 400;
}
html[data-rr] td.cat:has(> table) a { color: var(--rr-muted); font-weight: 500; }
html[data-rr] td.cat:has(> table) a:hover { color: var(--rr-text-strong); }

/* The template puts these classes on <tr> as well as <td>, and the
   original stylesheet colours both. A row left uncovered keeps its
   near-black background, which is invisible on a dark theme and very
   visible on a light one. */
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

/* Alternating rows.

   The board alternates row1 and row2 down every listing, and that
   banding is how a reader tracks one topic's title across to its last
   post without losing the line. Painting both the same colour is what
   made a 108-topic page read as one undifferentiated block.

   Only listings get it: lists.js marks those tables, because in a topic
   the same two classes wrap whole posts and striping those would band
   the thread rather than the rows. */
html[data-rr] table[data-rr-list] td.row2 { background: var(--rr-surface-2); }

/* Whole-row hover, which the table markup cannot express by itself. */
html[data-rr] tr:hover > td.row1,
html[data-rr] tr:hover > td.row2 { background: var(--rr-surface-3); }

html[data-rr] tr:last-child > td { border-bottom: 0; }

/* The marker gutter: read/unread, and whether the topic is bookmarked.

   Scoped to listings on purpose. lists.js labels the columns of every
   table it can find a header row for, and "icon" only means a marker
   column in a listing — on the login page the same label lands on a
   cell holding a paragraph of prose, and a nowrap there stretched the
   page to 3275px. Every column rule below carries the same scope. */
html[data-rr] table[data-rr-list] td[data-rr-col="icon"] {
    /* min-width, not width: the title column asks for 100% and would
       otherwise squeeze this one down onto the marker. */
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
    /* Quiet until it means something, or until the row is under the
       pointer: a column of bright stars beside unstarred rows is
       noise, and this column is read at a glance or not at all. */
    opacity: .28;
}
html[data-rr] tr:hover .rr-star,
html[data-rr] .rr-star:focus-visible,
html[data-rr] .rr-star[aria-pressed="true"] { opacity: 1; }
html[data-rr] .rr-star[aria-pressed="true"] { color: var(--rr-accent); }

/* A listing cell holds one line of type; the description under a forum
   name is the exception and sets its own. */
html[data-rr] td.row1,
html[data-rr] td.row2 { line-height: var(--rr-lh-meta); }

/* Replies, views, author and last post are supporting detail beside the
   title, not four more columns of body text. The template wraps each in
   a <p>, which the reset above gave the reading line-height and the
   browser gives a margin: two of them stacked in the Last post cell is
   what set the height of every row in the listing. */
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

/* The joined Last post line. It wraps rather than clipping: two lines
   is where it started, and a truncated username is worse than both. */
html[data-rr] p.rr-lastpost { line-height: var(--rr-lh-meta); }
html[data-rr] p.rr-lastpost .rr-sep { color: var(--rr-faint); margin: 0 5px; }

/* The narrow columns.

   A listing is laid out by the browser's automatic algorithm, which
   sizes a column to the widest thing in it. Nothing here overrides
   that with pixel widths — under automatic layout a width on a cell is
   a hint the browser is free to ignore, and it does. What does work is
   telling it these columns never need to wrap: a count and a heading
   then claim exactly their own width, and everything left over goes to
   the title, which is the one column whose content has no natural
   width and the one whose wrapping sets the height of the row. */
html[data-rr] table[data-rr-list] th,
html[data-rr] table[data-rr-list] td[data-rr-col="replies"],
html[data-rr] table[data-rr-list] td[data-rr-col="views"],
html[data-rr] table[data-rr-list] td[data-rr-col="topics"],
html[data-rr] table[data-rr-list] td[data-rr-col="posts"] { white-space: nowrap; }

/* One alignment per column, heading and cells together.

   The template aligns each cell on its own with an align attribute, so
   a column could and did disagree with its own heading: Author left in
   the heading and centred in the rows, Views right in the rows under a
   heading asking to be centred. Both are keyed on the column name now,
   which labelColumns() puts on the <th> as well as the <td>.

   Counts are right aligned on tabular figures, so the digits of one row
   sit over the digits of the next and a column of numbers can be read
   down rather than across. Everything with words in it is left
   aligned. */
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
   on the element beats a stylesheet rule of equal weight. */
html[data-rr] table[data-rr-list] td[data-rr-col][align] { text-align: inherit; }
html[data-rr] table[data-rr-list] tr > td[data-rr-col="replies"][align],
html[data-rr] table[data-rr-list] tr > td[data-rr-col="views"][align],
html[data-rr] table[data-rr-list] tr > td[data-rr-col="topics"][align],
html[data-rr] table[data-rr-list] tr > td[data-rr-col="posts"][align] { text-align: right; }
html[data-rr] table[data-rr-list] tr > td[data-rr-col="author"][align],
html[data-rr] table[data-rr-list] tr > td[data-rr-col="last"][align] { text-align: left; }

/* And the title column claims what is left.
   Under automatic layout a cell asking for 100% is given every pixel
   the other columns do not need, which is the one width declaration the
   algorithm does honour. Without it, joining the last-post lines made
   that column wide enough to want a single line, and it took the room
   out of the titles: rows stopped stacking their date and started
   stacking their title instead, which is a worse trade.

   The heading is asked by name rather than by position. A forum listing
   heads the marker and the title with one spanned cell, so the first
   heading is the title's; a search results page heads the marker on its
   own, and there \`th:first-child\` handed the whole page to the marker
   gutter and left the titles in a 177px column against the right-hand
   edge. */
html[data-rr] table[data-rr-list] td[data-rr-col="title"],
html[data-rr] table[data-rr-list] th[data-rr-col="title"] { width: 100%; }

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
    /* The heading is a tag followed by the title. Laid out as a flex
       row with a baseline alignment the two share a baseline whatever
       the type sizes are, which line-box arithmetic on an inline-flex
       badge could only approximate. */
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0;
}
html[data-rr] #pageheader h2 > .rr-tag { align-self: center; }
html[data-rr] #pageheader h2 a.titles { color: var(--rr-text-strong); }

/* ---- Posts ------------------------------------------------------ */

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

/* The author column: quiet supporting detail beside the message, not a
   second column of equal weight. */
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
/* The inner table carries width="150"; giving it a real width is what
   stops the auto layout collapsing the column to 60px. */
html[data-rr] td.profile > table { width: 150px !important; }

/* ---- Modern post layout ------------------------------------------ */

/* With the author moved into a header strip, the column and the
   template's own subject row have nothing left to show. */
html[data-rr][data-rr-posts="modern"] td.profile { display: none; }
html[data-rr][data-rr-posts="modern"] table.tablebg > tbody > tr > td[valign="top"] { width: auto; }
html[data-rr][data-rr-posts="modern"] b.postauthor { display: none; }
html[data-rr][data-rr-posts="modern"] table.tablebg > tbody > tr > td[align="center"][valign="middle"] { display: none; }
html[data-rr][data-rr-posts="modern"] table.tablebg th { display: none; }

/* The template pads the space under a message with bare <br> tags that
   used to separate the signature and the edit controls. With those
   restyled, each post ends in 40px of empty line boxes. */
html[data-rr][data-rr-posts="modern"] .rr-posthead ~ br { display: none; }

/* Spoilers: the board draws them with an inline-styled button. */
html[data-rr] .spoiler {
    background: var(--rr-surface-2);
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius);
    padding: var(--rr-s3) var(--rr-s4);
    margin: var(--rr-s4) 0;
}
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

/* Quotes: a rule and a tint, not a boxed card. */
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
html[data-rr] blockquote blockquote { background: var(--rr-surface-3); }
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

html[data-rr] .username-coloured,
html[data-rr] .postauthor a { font-weight: 600; }

html[data-rr] hr { border: 0; border-top: 1px solid var(--rr-line); margin: var(--rr-s4) 0; }

/* ---- Forms ------------------------------------------------------ */

html[data-rr] input[type="text"],
html[data-rr] input[type="password"],
html[data-rr] input[type="search"],
html[data-rr] input[type="email"],
html[data-rr] select,
html[data-rr] textarea,
html[data-rr] .inputbox,
html[data-rr] .post {
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
html[data-rr] input:hover,
html[data-rr] select:hover,
html[data-rr] textarea:hover { border-color: var(--rr-faint); }
/* A field shows focus by colouring its own border, so the ring is not
   drawn twice. Only a field: a submit button matches \`input\` too, has
   no border to colour, and was left with no focus indicator at all —
   which a Tab through a live topic page found on the board's own
   Search button. Buttons keep the ring the rule above gives them. */
html[data-rr] input:not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]):focus,
html[data-rr] select:focus,
html[data-rr] textarea:focus { border-color: var(--rr-accent); outline: none; }
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

/* ---- Legacy imagery --------------------------------------------- */

/* The GIF interface is swapped out in JS (see icons.js); these are the
   styles for what replaces it. Read state becomes a dot, because the
   distinction is worth one glance, not a beveled checkbox. */

html[data-rr] img[src$="spacer.gif"] { display: none; }

/* Three states, one mark, and each of them legible on its own.

   Read used to be a filled dot in --rr-line-strong, which against the
   page is a smudge: on a listing where every row is read the whole
   column said nothing, and beside a title the mark was easy to miss
   entirely. It is a ring now, in the same grey as the meta text, so it
   reads as deliberately empty rather than as a dot that failed to
   paint. Unread stays a filled accent dot — the one state worth the
   board's accent colour — and a row this browser has already been to
   fills the ring in grey.

   The ring is a border rather than an inset shadow: the locked variant
   below owns box-shadow, and a mark can be both.

   This is also the *only* signal for read state. The topic title used
   to be greyed out as well on rows already opened, which put two faint
   marks on one fact and cost the title its contrast. */
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

/* "[ Go to page: 1 ... 41, 42, 43 ]" under a long topic's title.
   Two things were wrong with it. The size it asks for here never
   applied: \`td.row1 p\` above is one element more specific, so the
   strip rendered at the same 13px as the title's own meta line and
   competed with it. And the numbers are a run of touching 12px links
   with no box around any of them — the densest thing on the page and
   the one most often aimed at with a pointer.

   Both selectors below carry the cell, so they win where the old one
   lost; each number gets a real hit target, and the strip finally
   reads as the secondary thing it is. */
html[data-rr] td.row1 p.rr-pagejump,
html[data-rr] td.row2 p.rr-pagejump {
    margin: 5px 0 0;
    color: var(--rr-faint);
    font-size: var(--rr-fs-xs);
    line-height: 1.35;
}
/* The air this strip needed was sideways, and height is the one thing a
   108-row page cannot spend: seventy of those rows carry one of these,
   so a pixel here is seventy down the page.

   Padding on an inline box is exactly that trade — it widens the hit
   target without touching the line box, so each number gets something
   to aim at and the row is the height it was. A flex row was tried
   first and it also pulled the template's own commas out into flex
   items of their own, which put a space in front of every one of
   them: "41 , 42 , 43". */
html[data-rr] p.rr-pagejump a {
    /* The padding is the hit target; the negative margin gives the
       spacing back, so the template's own commas still hug the number
       in front of them instead of floating five pixels off it. */
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

/* ---- Duplicated chrome ------------------------------------------- */

/* The breadcrumb now lives in the top bar; the template's copy, its
   empty category strip and the wall of vertical space around the forum
   title are all redundant once it does. */
html[data-rr][data-rr-nav="on"] td.row5 > p.breadcrumbs { display: none; }
html[data-rr][data-rr-nav="on"] td.row5 {
    padding: var(--rr-s2) var(--rr-s3);
    border-radius: var(--rr-radius-lg);
}
html[data-rr][data-rr-nav="on"] td.row5:has(> #search-box) { display: flex; justify-content: flex-end; }

/* The template floats the links inside this paragraph, so without a
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
/* The template spaces its blocks with bare <br>. Once the strips
   around them are restyled or hidden, each one is a 19px band of
   nothing; the one directly under <body> is what put 25px between the
   top bar and the first line of content. */
html[data-rr] #pageheader br,
html[data-rr] body > br,
html[data-rr] #wrapcentre > br { display: none; }

/* The forum name renders as a bare <h2> outside #pageheader on listing
   pages, where the template relied on a 40px gap to separate it. */
/* The forum name. It was set at the page-title size with 24px above
   it, which on a listing page repeats what the breadcrumb two lines up
   already says, at twice the weight and a whole screen-band of its
   own. It reads as a heading at the section size. */
html[data-rr] #wrapcentre > h2,
html[data-rr] #wrapcentre > form > h2 {
    font-size: var(--rr-fs-lg);
    margin: var(--rr-s4) 0 var(--rr-s2);
}
html[data-rr] #wrapcentre > p.searchbar:first-child { margin-top: 0; }
html[data-rr][data-rr-nav="on"] #wrapcentre { padding-top: var(--rr-s4); }

/* Category strips the template leaves empty. */
html[data-rr] td.cat:empty,
html[data-rr] tr:has(> td.cat:empty) { display: none; }

/* ---- Donation overlay ------------------------------------------- */

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

/* == ui.css == */
/* ------------------------------------------------------------------
   Components the script injects. Everything here is prefixed .rr- and
   owns its own markup, so no specificity fights with phpBB.
   ------------------------------------------------------------------ */

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
.rr-btn[aria-pressed="true"] { background: var(--rr-accent-soft); border-color: var(--rr-accent); color: var(--rr-accent); }
.rr-btn svg { width: 14px; height: 14px; flex: none; }

.rr-icon-btn {
    display: inline-grid;
    place-items: center;
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

/* An icon button that happens to be a link is still an icon button.

   \`html[data-rr] a\` is (0,1,1) and .rr-icon-btn is (0,1,0), so every
   one of these built as an anchor — private messages, the account link
   — lost its colour to the link rule and came out in the board's red,
   while the two built as buttons stayed grey. Three controls sitting
   together in the top bar, two of them coloured as if they meant
   something different from the third. They do not. */
html[data-rr] a.rr-icon-btn { color: var(--rr-muted); }
html[data-rr] a.rr-icon-btn:hover { color: var(--rr-text-strong); text-decoration: none; }

/* ---- Skip link ---------------------------------------------------- */

/* Off screen until it is focused, which is the only time it is useful
   and the only time it must be impossible to miss. */
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
/* \`html[data-rr] a\` is (0,1,1) and \`.rr-skip\` is (0,1,0), so the one
   control on the page whose whole job is to be unmissable was drawing
   the board's link red on the accent — 1.2:1 — and only the :focus
   rule below was putting it right. It is only ever seen focused, so
   nobody saw it; a rule that is correct by luck is a rule waiting to
   be wrong. */
html[data-rr] a.rr-skip { color: var(--rr-accent-text); }
.rr-skip:focus {
    transform: none;
    color: var(--rr-accent-text);
    text-decoration: none;
}
/* The skip target must not keep a ring once it has been jumped to. */
html[data-rr] #wrapcentre:focus { outline: none; }

/* An imageset image the icon pass did not recognise. It is left alone
   rather than hidden, so a control the board adds later still shows;
   this only stops an oversized one stretching its row. */
html[data-rr] img.rr-legacy-img { max-width: 100%; height: auto; vertical-align: middle; }

/* ---- Top navigation --------------------------------------------- */

.rr-nav {
    position: sticky;
    top: 0;
    z-index: 900;
    display: flex;
    align-items: center;
    gap: var(--rr-s3);
    height: var(--rr-nav-h);
    padding: 0 var(--rr-s4);
    background: color-mix(in srgb, var(--rr-bg) 88%, transparent);
    backdrop-filter: blur(10px) saturate(140%);
    border-bottom: 1px solid var(--rr-line);
}
.rr-nav__brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font: 700 var(--rr-fs) / 1 var(--rr-font);
    letter-spacing: -.02em;
    color: var(--rr-text-strong);
    flex: none;
}
.rr-nav__brand:hover { text-decoration: none; color: var(--rr-accent); }
/* A window on to the board's own masthead art, sized and offset by the
   custom properties navbar.js measures. The art is light on a dark
   plate, which is how the board presents it, so it keeps that plate on
   every theme rather than being recoloured. */
.rr-nav__logo {
    position: relative;
    display: block;
    width: var(--rr-logo-w);
    height: var(--rr-logo-h);
    overflow: hidden;
    border-radius: 4px;
    flex: none;
}
.rr-nav__art {
    position: absolute;
    top: var(--rr-logo-y);
    left: var(--rr-logo-x);
    width: var(--rr-logo-img-w);
    height: var(--rr-logo-img-h);
    max-width: none;
    border: 0;
}
.rr-nav__brand:hover .rr-nav__logo { filter: brightness(1.15); }

/* The board sets its name in wide-tracked caps; that tracking is most
   of what makes the wordmark recognisable, so the fallback keeps it
   rather than the tight default the rest of the interface uses. */
.rr-nav__word {
    font-weight: 700;
    letter-spacing: .09em;
    font-size: var(--rr-fs-sm);
    text-transform: uppercase;
}
/* One or the other, never both. */
.rr-nav__brand[data-rr-logo="art"] .rr-nav__word { display: none; }

/* ---- Board links -------------------------------------------------- */

/* The row the masthead used to carry. Slim, quiet and above the
   content rather than inside it, which is where the board put it. */
.rr-boardbar {
    display: flex;
    align-items: center;
    gap: var(--rr-s2) var(--rr-s3);
    flex-wrap: wrap;
    margin: 0 0 var(--rr-s4);
    padding-bottom: var(--rr-s3);
    border-bottom: 1px solid var(--rr-line);
    font-size: var(--rr-fs-sm);
}
.rr-boardbar__main,
.rr-boardbar__end {
    display: flex;
    align-items: center;
    gap: var(--rr-s2) var(--rr-s5);
    flex-wrap: wrap;
    min-width: 0;
}
.rr-boardbar__end { margin-left: auto; gap: var(--rr-s2); }

/* Ways of looking at threads, then what the board is, then you.

   The grouping is carried by spacing and one hairline rather than by
   headings: the row is 22px tall and three labels in it would be a
   second row of text explaining the first. Inside a group the links
   sit at the ordinary gap; between groups they sit at twice it with a
   rule down the middle, which is enough to read as three things. */
.rr-boardbar__group {
    display: flex;
    align-items: center;
    gap: var(--rr-s3);
    flex-wrap: wrap;
    min-width: 0;
}
.rr-boardbar__group + .rr-boardbar__group {
    padding-left: var(--rr-s5);
    border-left: 1px solid var(--rr-line);
}
.rr-boardbar__link {
    color: var(--rr-muted);
    font-weight: 500;
    white-space: nowrap;
}
.rr-boardbar__link:hover { color: var(--rr-accent); text-decoration: none; }
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

/* Two flags with no words and no current state, made into the same
   segmented control the settings panel uses for a two-way choice. */
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
    .rr-boardbar { gap: var(--rr-s2); }
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

    /* Two entry points stay: "View unanswered posts" and "View active
       topics" are what every guide to this board says to bookmark, and
       they lead the views group. The third thing in that group is the
       board's plain Search, which the top bar already carries as its
       own control — so the group folds past two like everything else.
       What the board is, who you are and the language switch all wait
       behind the More control. */
    .rr-boardbar:not([data-rr-open]) .rr-boardbar__main > :not([data-rr-group="views"]),
    .rr-boardbar:not([data-rr-open]) [data-rr-group="views"] > :nth-child(n+3),
    .rr-boardbar:not([data-rr-open]) .rr-boardbar__end { display: none; }
    /* With the groups folded away there is nothing for the rule to
       divide, and the row is 366px wide with a More control to fit in
       it — so the grouping costs no width at all here. */
    .rr-boardbar__group + .rr-boardbar__group { padding-left: 0; border-left: 0; }
    .rr-boardbar__main, .rr-boardbar__end { gap: var(--rr-s2) var(--rr-s3); }

    .rr-boardbar[data-rr-open] { flex-wrap: wrap; }
    .rr-boardbar[data-rr-open] .rr-boardbar__end { margin-left: 0; flex-basis: 100%; }
}

/* ---- Restored board controls -------------------------------------- */

/* A control the board drew as a bare GIF inside a link. The image is
   hidden and this label takes its place, so the control keeps working
   and can now be seen. */
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

/* One search shape, used by the palette trigger here and by the
   board's own forms in the topic bar and the listing toolbar. It was a
   pill; a pill in this interface is a label, and this is a control. */
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

/* The board's form inside that frame. The input loses its own border
   and background — the frame is the border now — and the submit
   becomes the trailing affordance, where the Ctrl K chip sits in the
   palette trigger. */
.rr-search:focus-within { border-color: var(--rr-accent); }
.rr-search__form { display: flex; align-items: center; gap: 4px; flex: 1; min-width: 0; }
html[data-rr] .rr-search__input {
    flex: 1;
    min-width: 0;
    height: 26px;
    padding: 0;
    background: none;
    border: 0;
    border-radius: 0;
    color: var(--rr-text);
    font-size: var(--rr-fs-sm);
}
html[data-rr] .rr-search__input:focus-visible { outline: none; }
html[data-rr] .rr-search__go {
    flex: none;
    height: 22px;
    padding: 0 9px;
    background: var(--rr-surface-2);
    border: 1px solid var(--rr-line);
    border-radius: 4px;
    color: var(--rr-muted);
    font: 600 var(--rr-fs-xs) / 1 var(--rr-font);
    cursor: pointer;
}
html[data-rr] .rr-search__go:hover {
    background: var(--rr-surface-3);
    border-color: var(--rr-line-strong);
    color: var(--rr-text-strong);
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

/* An icon with no words next to it is a guess until you hover it for a
   second and the browser decides to help. This draws the name of the
   control straight away, on hover and on keyboard focus alike, from
   the same string that is on \`title\` and \`aria-label\`.

   Pointer events are off so the label can never sit between the cursor
   and the button it describes. */
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
    /* display, not visibility: a hidden-but-laid-out label on a control
       at the right edge of the window is 41px of horizontal overflow on
       every page of the board, which is exactly what it was. */
    display: none;
}
html[data-rr] [data-rr-tip]:hover::after,
html[data-rr] [data-rr-tip]:focus-visible::after { display: block; }
/* Near the right edge the label would still push the page sideways
   while it is up, so those hang off their own right edge instead. The
   last control in the top bar is against the window; so is the corner
   the jump buttons live in. */
html[data-rr] [data-rr-tip][data-rr-tip-side="right"]::after,
html[data-rr] .rr-nav__actions > :last-child[data-rr-tip]::after { left: auto; right: 0; transform: none; }
html[data-rr] [data-rr-tip][data-rr-tip-side="above"]::after { top: auto; bottom: calc(100% + 6px); }

/* ---- Reading progress ------------------------------------------- */

/* On the bottom edge of the sticky top bar, not floating at the top
   left of the window where a loading bar lives. --rr-nav-h is set by
   theme.js so this stays put when the bar is switched off. */
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
/* Nothing to report yet: at the top of the page, or on a page with
   nothing below the fold. */
.rr-progress[data-rr-idle] { opacity: 0; }

/* ---- Topic prefix tags ------------------------------------------ */

.rr-tag {
    display: inline-flex;
    align-items: center;
    /* An inline-flex box sits on the *bottom margin edge* of the line
       box by default, so in a heading two type sizes larger than the
       tag the badge hung below the words it labels. Aligning it to the
       middle of the surrounding text puts it back on the line. */
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
/* The same badge drawn as a label, on a listing too short to be worth
   filtering: it says what kind of topic the row is and answers no
   click, so it must not offer one. */
span.rr-tag { cursor: default; }

/* One tag, three colours off one token.

   A tag draws its own hue on a 15% tint of itself — which is a good
   way to draw a label, and lands several of them just under 4.5:1 at
   12px. Rather than move the palette (these hues are the board's
   taxonomy, and two of them are the board's own red), the *ink* is
   nudged toward whichever end of the theme it needs: lighter on a dark
   theme, darker on a light one, from a single rule that never has to
   know which it is on. The tint and the border stay on the pure
   token, so the label still reads as its own colour. */
.rr-tag[data-tag] {
    color: color-mix(in srgb, var(--rr-tag-ink) 84%, var(--rr-text-strong));
    background: color-mix(in srgb, var(--rr-tag-ink) 15%, transparent);
    border-color: color-mix(in srgb, var(--rr-tag-ink) 32%, transparent);
}
.rr-tag[data-tag="info"]      { --rr-tag-ink: var(--rr-tag-info); }
.rr-tag[data-tag="release"]   { --rr-tag-ink: var(--rr-tag-release); }
.rr-tag[data-tag="problem"]   { --rr-tag-ink: var(--rr-tag-problem); }
.rr-tag[data-tag="important"] { --rr-tag-ink: var(--rr-tag-important); }
.rr-tag[data-tag="tutorial"]  { --rr-tag-ink: var(--rr-tag-tutorial); }
.rr-tag[data-tag="request"]   { --rr-tag-ink: var(--rr-tag-request); }
.rr-tag[data-tag="scs"]       { --rr-tag-ink: var(--rr-tag-scs); }

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
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1 1 220px;
    min-width: 180px;
    height: 34px;
    padding: 0 12px;
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
   rule keeps "narrow what is here" and "search the whole board" from
   reading as one control. */
.rr-toolbar__board {
    display: flex;
    align-items: center;
    padding-left: var(--rr-s3);
    border-left: 1px solid var(--rr-line);
}
.rr-toolbar__board .rr-search { min-width: 200px; }
.rr-toolbar__tags { display: flex; gap: 4px; flex-wrap: wrap; }
.rr-toolbar__tags .rr-tag { margin: 0; opacity: .5; }
.rr-toolbar__tags .rr-tag[aria-pressed="true"] { opacity: 1; }

tr[data-rr-hidden] { display: none; }

/* ---- Quick reply -------------------------------------------------- */

.rr-reply {
    margin: var(--rr-post-gap) 0 0;
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
/* The filter, nested into the action bar as its second row: one card
   with a rule across it rather than two cards with a gap.

   Its own padding and the bar's cancelled each other out at the seam —
   the negative margin pulls it back to the card edge and the padding
   pushes it in again — so both have to move together or the second row
   sits at a different inset from the first. */
.rr-topicbar > .rr-toolbar {
    flex-basis: 100%;
    margin: var(--rr-card-pad) calc(-1 * var(--rr-card-pad)) calc(-1 * var(--rr-card-pad));
    padding: var(--rr-card-pad);
    background: transparent;
    border: 0;
    border-top: 1px solid var(--rr-line);
    border-radius: 0 0 calc(var(--rr-radius-lg) - 1px) calc(var(--rr-radius-lg) - 1px);
}

/* The forum name, moved into the bar it labels. */
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

/* Two rows, always. The first is this topic, the second is everywhere
   else; a hairline between them says so without a heading. */
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

/* Leaving this topic is quieter than acting on it. */
.rr-topicbar__row[data-rr-row="away"] .rr-btn {
    font-weight: 500;
    font-size: var(--rr-fs-xs);
    padding: 4px 8px;
}
.rr-topicbar__row[data-rr-row="away"] .rr-search { height: 28px; }

/* ---- Pager ------------------------------------------------------- */

.rr-pager {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: var(--rr-s3);
    flex-wrap: wrap;
}
.rr-pager__label { color: var(--rr-faint); font-size: var(--rr-fs-sm); }
/* The four page steps read as one control, which is most of what keeps
   "Next page" from being taken for "Next topic". */
.rr-pager__step { gap: 3px; padding: 5px 8px; }
.rr-pager__step svg { width: 13px; height: 13px; }
.rr-pager__input {
    width: 62px;
    height: 30px;
    padding: 0 8px;
    background: var(--rr-bg-sunken);
    border: 1px solid var(--rr-line-strong);
    border-radius: var(--rr-radius);
    color: var(--rr-text);
    font: var(--rr-fs-sm) / 1 var(--rr-font-mono);
    text-align: center;
}
.rr-pager [hidden] { display: none; }

/* ---- Game card --------------------------------------------------- */

.rr-game {
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: var(--rr-s5);
    margin: 0 0 var(--rr-post-gap);
    padding: var(--rr-s5);
    background: var(--rr-surface);
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius-lg);
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
    grid-template-columns: auto 1fr;
    gap: 6px var(--rr-s4);
    margin: var(--rr-s4) 0 0;
    font-size: var(--rr-fs-sm);
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

.rr-posthead {
    display: flex;
    align-items: center;
    gap: var(--rr-s2) var(--rr-s3);
    flex-wrap: wrap;
    margin: 0 0 var(--rr-s4);
    padding-bottom: var(--rr-s3);
    border-bottom: 1px solid var(--rr-line);
}
.rr-posthead__avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    object-fit: cover;
    flex: none;
    margin: 0;
    background: var(--rr-surface-3);
}
.rr-posthead__who { display: flex; align-items: baseline; gap: var(--rr-s2); min-width: 0; }
.rr-posthead__name { font-weight: 650; color: var(--rr-text-strong); font-size: var(--rr-fs-sm); }
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
       inside the clock and left "13:…" on the page. The line is
       shortened at the source now, so it fits — and where it still
       does not, it gives way to the things around it rather than to a
       number written here. */
    min-width: 0;
    flex: 0 1 auto;
}
/* Per-post actions.

   These were invisible until the post was hovered. The board showed its
   own Quote and Profile controls at all times, so hiding them outright
   is one step back from what it did: a control nobody can see is a
   control nobody uses. They rest dimmed instead — quiet enough not to
   compete with the message, present enough to be found. */
.rr-posttools {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    /* It wraps. On a phone at the largest text size the strip is a post
       number, three icon buttons and two labelled controls the board
       drew as GIFs, and one line of that is wider than the screen —
       which is how it came to push the page sideways the moment the
       "hide posts by someone" control joined it. */
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

/* The post number, which is also the link to the post: it took the
   job off the board's own "Post" control rather than sitting beside
   it saying the same thing without doing anything. */
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

/* The board draws the divider as a run of underscores. A rule reads
   better and does not wrap. */
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
    max-height: min(60vh, 520px);
    margin-top: 12vh;
    display: flex;
    flex-direction: column;
    background: var(--rr-surface);
    border: 1px solid var(--rr-line-strong);
    border-radius: var(--rr-radius-lg);
    box-shadow: var(--rr-shadow-pop);
    overflow: hidden;
}
.rr-palette__input {
    height: 48px;
    padding: 0 var(--rr-s4);
    background: none;
    border: 0;
    border-bottom: 1px solid var(--rr-line);
    color: var(--rr-text-strong);
    font: var(--rr-fs-lg) / 1 var(--rr-font);
    outline: none;
}
.rr-palette__list { overflow-y: auto; padding: var(--rr-s1); margin: 0; list-style: none; }
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
.rr-panel__head {
    display: flex;
    align-items: center;
    gap: var(--rr-s3);
    padding: var(--rr-s3) var(--rr-s4);
    border-bottom: 1px solid var(--rr-line);
}
.rr-panel__id { display: flex; align-items: baseline; gap: 6px; flex: none; }
.rr-panel__title { font: 650 var(--rr-fs-lg) / 1.2 var(--rr-font); color: var(--rr-text-strong); margin: 0; }
.rr-panel__ver { font: var(--rr-fs-xs) / 1 var(--rr-font-mono); color: var(--rr-faint); }
.rr-panel__search {
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
}

/* The rail and the page beside it. The rail scrolls on its own, so a
   long category cannot push the categories off the bottom. */
.rr-panel__body {
    display: grid;
    grid-template-columns: 186px 1fr;
    min-height: 0;
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
    color: var(--rr-accent);
    font: 700 var(--rr-fs-xs) / 1.5 var(--rr-font-mono);
    text-align: center;
}
/* A category with nothing matching the search is dimmed rather than
   removed: the rail keeps the same shape while typing. */
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

.rr-field {
    display: flex;
    align-items: flex-start;
    gap: var(--rr-s4);
    padding: var(--rr-s4) 0;
    border-top: 1px solid var(--rr-line);
}
.rr-field:first-of-type { border-top: 0; }
.rr-field__text { flex: 1; min-width: 0; }
.rr-field__label { display: block; font: 600 var(--rr-fs-sm) / var(--rr-lh-meta) var(--rr-font); color: var(--rr-text); }
.rr-field__desc { display: block; margin-top: 3px; font-size: var(--rr-fs-xs); line-height: 1.55; color: var(--rr-muted); max-width: 52ch; }
.rr-field__control { flex: none; display: flex; align-items: center; gap: var(--rr-s2); padding-top: 2px; }
.rr-field[hidden],
.rr-field[data-rr-dep-off],
.rr-field[data-rr-nomatch] { display: none; }
/* A field that depends on another is stepped in under it, so "off
   because the thing above is off" is visible rather than inferred. */
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

.rr-swatches { display: flex; gap: 6px; }
.rr-swatch {
    width: 26px; height: 26px;
    border-radius: var(--rr-radius);
    border: 2px solid transparent;
    cursor: pointer;
    padding: 0;
}
.rr-swatch[aria-pressed="true"] { border-color: var(--rr-text-strong); }

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

/* Only inside the script's own panels: the page keeps the browser's. */
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

/* == features.css == */
/* ------------------------------------------------------------------
   Styles for what v0.4 added: folded quotes, folded chatter, the Steam
   preview card, and the donation link.

   The two folds share one idea and it is worth saying once. Neither of
   them hides anything: \`display: none\` and \`visibility: hidden\` take a
   node out of the layout, out of the accessibility tree and out of the
   browser's own find-in-page, which is exactly what the previous
   attempt at folding quotes did wrong. What is below is \`max-height\`
   and a mask — the content is still laid out, still read aloud, still
   found by Ctrl+F, still visible to the finder. Only the box drawn
   around it is smaller.
   ------------------------------------------------------------------ */

/* ---- Folded quotes ------------------------------------------------ */

html[data-rr] .postbody [data-rr-quote="folded"] {
    max-height: var(--rr-quote-max, 7em);
    overflow: hidden;
    cursor: zoom-in;
    /* The fade is the affordance: a clipped block with a hard bottom
       edge reads as a short quote, one that fades reads as more. */
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

/* One dim line where a "thanks!" used to be a full post box. The
   original post is untouched underneath: the message is clipped to a
   single line of its own text, not replaced by a summary of it. */
html[data-rr] table.tablebg[data-rr-quiet] { opacity: .72; }
html[data-rr] table.tablebg[data-rr-quiet]:hover { opacity: 1; }

html[data-rr] table.tablebg[data-rr-quiet] > tbody > tr > td { padding-top: 4px; padding-bottom: 4px; }

html[data-rr] table.tablebg[data-rr-quiet] .rr-posthead {
    display: inline-flex;
    margin: 0 var(--rr-s2) 0 0;
    padding: 0;
    border: 0;
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

/* The author, the control and the message on one line.

   The message used to be \`display: inline\` so it would flow beside the
   name, and that quietly undid the fold: \`overflow\` and \`max-height\`
   do not apply to a non-replaced inline box at all, so a short reply
   looked folded only because it was short. A 300-character "thank you
   so much for taking the time" — well inside what this folds — laid
   itself out in full and nothing clipped it.

   A flex row on the cell puts the three on one line properly, and the
   message is then a flex item, which is a box that can be clipped. */
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
    /* One line, ending in an ellipsis rather than a hard edge. The
       text is all still there and still found by find-in-page; it is
       the box around it that stops. */
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: var(--rr-fs-sm);
    line-height: var(--rr-lh-meta);
    color: var(--rr-faint);
    cursor: zoom-in;
}
html[data-rr] table.tablebg[data-rr-quiet] .postbody br { display: none; }

/* Everything the template leaves after the message: the two <br> it
   uses as spacing and the empty strip that held the per-post controls.
   Folding the message and leaving 45px of that behind saves half of
   what the fold is for. A signature is a second .postbody, so it is
   covered by the same rule — a folded reply is one line, all in. */
html[data-rr] table.tablebg[data-rr-quiet] .postbody ~ * { display: none; }
html[data-rr] table.tablebg[data-rr-quiet] .postbody ~ .rr-quiet-chip { display: inline-flex; }

/* And the rows around it. A post is four table rows, and folding the
   message alone left three of them standing: 77px for a reply that now
   says "thx". The row holding the message is the only one a folded
   reply has anything to show in — the header row is already hidden by
   the modern layout, and the footer row is what is left of the Top and
   Profile controls after they moved into the post's own action strip.
   The template's cellspacing="5" is the last of it. */
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
    font: 600 var(--rr-fs-xs) / 1.5 var(--rr-font);
    cursor: pointer;
    vertical-align: middle;
}
.rr-quiet-chip:hover { color: var(--rr-text); border-color: var(--rr-line-strong); }
.rr-quiet-chip svg { width: 11px; height: 11px; }
/* Once opened, the post is an ordinary post again and the chip is the
   only thing left saying otherwise. */
html[data-rr] table.tablebg:not([data-rr-quiet]) .rr-quiet-chip { opacity: .4; }
html[data-rr] table.tablebg:not([data-rr-quiet]) .rr-quiet-chip:hover { opacity: 1; }

/* ---- The donation link -------------------------------------------- */

/* Present, not loud: an outline in the accent and a heart, in a row
   where everything else is grey text. The board is asking for money to
   stay hosted; this is one line of emphasis, not a banner. */
html[data-rr] .rr-boardbar__donate {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 9px;
    border: 1px solid color-mix(in srgb, var(--rr-accent) 45%, transparent);
    /* A control, so the button radius — not the pill it used to be,
       which put three different corner radii on one bar next to Reply
       and the search box. */
    border-radius: var(--rr-radius);
    background: color-mix(in srgb, var(--rr-accent) 12%, transparent);
    color: color-mix(in srgb, var(--rr-accent) 88%, var(--rr-text-strong));
    font-weight: 650;
}
html[data-rr] .rr-boardbar__donate:hover {
    background: color-mix(in srgb, var(--rr-accent) 22%, transparent);
    border-color: var(--rr-accent);
    color: var(--rr-accent);
}
html[data-rr] .rr-boardbar__donate svg {
    width: 12px;
    height: 12px;
    flex: none;
    fill: currentColor;
    stroke-width: 0;
}

@media (max-width: 720px) {
    /* Everything past the two entry points folds behind More. This one
       does not: it is the link the board is asking for, and it fits
       once it is the heart alone. */
    html[data-rr] .rr-boardbar:not([data-rr-open]) .rr-boardbar__main > [data-rr-donate] {
        display: flex;
    }
    /* Its group is shown for its sake alone, so nothing else in that
       group comes back with it. */
    html[data-rr] .rr-boardbar:not([data-rr-open]) [data-rr-donate] > :not(.rr-boardbar__donate) {
        display: none;
    }
    html[data-rr] .rr-boardbar:not([data-rr-open]) .rr-boardbar__donate-label {
        /* Off the screen rather than display:none, so the label still
           belongs to the link for anything reading it aloud. */
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
    }
    html[data-rr] .rr-boardbar:not([data-rr-open]) .rr-boardbar__donate { padding: 4px 8px; }
}

@media (max-width: 560px) {
    /* On a phone the row is 366px wide and the two entry points, the
       heart and the More control come to 389. Something has to fold,
       and the choice is between the second entry point and the word
       "More" — the second entry point, because it is one tap away
       behind a control that is still labelled, where a More button
       reduced to a bare chevron is a control that is not.

       "View unanswered posts" is the one every guide to this board
       tells people to bookmark, so it is the one that stays.

       Both selectors below read the row as groups, which is what it is
       now. Written against the flat row it used to be, the first one
       excluded .rr-boardbar__donate — the class on the *link* — while
       what sits in __main is the *group* around it, so it folded the
       group the heart lives in and left the link laid out at zero
       width inside. And nth-child(n+2) then meant "every group after
       the first", which on a row whose first group holds both entry
       points folds nothing at all: the two of them plus the heart plus
       More come to 357px in a 366px row, and More wrapped to a second
       line.

       So: every group after the first goes, except the one with the
       heart in it, and inside the first group only its opening link
       stays. */
    html[data-rr] .rr-boardbar:not([data-rr-open]) .rr-boardbar__main > :nth-child(n+2):not([data-rr-donate]) {
        display: none;
    }
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
.rr-steam__score[data-band="good"]  { background: color-mix(in srgb, var(--rr-ok) 20%, transparent);     color: var(--rr-ok); }
.rr-steam__score[data-band="mixed"] { background: color-mix(in srgb, var(--rr-warn) 20%, transparent);   color: var(--rr-warn); }
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
    /* Three lines is the length at which a store blurb still says what
       the game is and does not become the page. */
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.rr-steam__links { display: flex; gap: 6px; }
.rr-steam__links .rr-btn { padding: 4px 8px; font-size: var(--rr-fs-xs); }

/* A row whose title now opens at the first unread post. The board
   already marks the row unread with its dot; this is only here so the
   retarget is visible to a test and to anyone reading the DOM. */
html[data-rr] tr[data-rr-unread] a.topictitle { text-underline-offset: 3px; }


/* ---- Category collapse ------------------------------------------- */

/* The board draws this as a background image on an <input type=button>
   sized 12x12. Two selectors, not one: \`html[data-rr] input[type=button]\`
   in forum.css is one element more specific than a bare class would be,
   so a class-only rule loses the padding and the border to the generic
   button styling and the control comes out as a 34px slab.

   The arrow is the input's own \`value\`, written by boardindex.js. It
   cannot be a pseudo-element: an <input> is a replaced element and
   generates none. */
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

/* The prefix filters rest at half opacity so a row of bright chips
   does not compete with the listing behind them. Against a dark
   surface half of a mid-tone still reads; against white it is most of
   the way to gone, and Info and Tutorial in particular stopped being
   legible as words. They rest higher on Paper and land in the same
   place visually. */
html[data-rr][data-rr-theme="paper"] .rr-toolbar__tags .rr-tag { opacity: .72; }


/* ---- The board's masthead ---------------------------------------- */

/* Shown at the size the board draws it, on the one page where the
   board's name is the point. The plate the art sits on is part of the
   art — it is a dark rectangle with the emblem knocked out of it — so
   it keeps its own background on every theme rather than being tinted
   to match one. */
.rr-masthead {
    margin: 0 0 var(--rr-s4);
}

/* The masthead and the board links, side by side where there is room.

   The art is left at the size the board draws it — 380x109, its own
   file, not redrawn and not scaled — and the links take the width it
   was leaving empty. Below 900px they stack again, which is what they
   did everywhere before. */
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
        /* Beside a 109px block the links read as a line hanging in the
           middle of it; on the art's own baseline they read as a
           caption to it. */
        align-content: flex-end;
        align-items: flex-end;
    }
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
    /* Two thirds the size, which keeps the wordmark legible and the
       emblem recognisable without taking a third of the screen. */
    .rr-masthead__art { width: 260px; }
    .rr-masthead { margin-bottom: var(--rr-s3); }
}


/* ---- An unsent reply --------------------------------------------- */

/* The quick reply with something kept in it. A dot rather than a
   sentence: the button beside it already says "Finish your reply", and
   this is only there so the block reads as waiting for you from across
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

/* A table without a <table>: five columns on one line per row, with
   the two that carry meaning — the version and what kind of thing it
   is — leading, and the bookkeeping trailing off to the right where it
   can be ignored. */
.rr-releases {
    margin: 0 0 var(--rr-post-gap);
    background: var(--rr-surface);
    border: 1px solid var(--rr-line);
    border-left: 3px solid var(--rr-accent);
    border-radius: var(--rr-radius-lg);
    overflow: hidden;
}
.rr-releases__head {
    display: flex;
    align-items: center;
    gap: var(--rr-s2);
    flex-wrap: wrap;
    padding: var(--rr-card-pad);
    border-bottom: 1px solid var(--rr-line);
}
.rr-releases__head h3 { margin: 0; font-size: var(--rr-fs); }
/* What the panel is showing: how much of the topic, and whether the
   topic itself is filtered down to it. Two controls answering the same
   question, so they sit together rather than at opposite ends of the
   card. */
.rr-releases__controls {
    display: flex;
    align-items: center;
    gap: var(--rr-s2);
    margin-left: auto;
    flex-wrap: wrap;
}
.rr-releases__only { padding: 4px 10px; font-size: var(--rr-fs-xs); }
.rr-releases__head svg { color: var(--rr-accent); flex: none; }
.rr-releases__count { color: var(--rr-faint); font-size: var(--rr-fs-xs); }

/* This page / all N pages. The same segmented control the settings
   panel uses, because it is the same kind of choice. */
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
/* Disabled because there is nothing for it to do on this topic, not
   because it is busy. Still drawn as one of two options, so the
   control reads as a control on a one page topic too. */
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
/* When it was read, whether it has moved on, and the button that reads
   it again: one fact and the action on it, side by side. */
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

/* The board was queueing, so the walk stood down. Said quietly: it is
   an explanation of the wait, not a problem with the answer. */
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

.rr-releases__filters {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: var(--rr-s2) var(--rr-card-pad);
    border-bottom: 1px solid var(--rr-line);
}
.rr-releases__chip {
    padding: 2px 9px;
    border-radius: var(--rr-radius-pill);
    background: var(--rr-surface-2);
    border: 1px solid var(--rr-line);
    color: var(--rr-muted);
    font: 600 var(--rr-fs-xs) / 1.6 var(--rr-font);
    cursor: pointer;
    transition: background var(--rr-speed) ease, color var(--rr-speed) ease;
}
/* The chips were grey to a kind while the same word in the rows below
   was coloured: one filter, two vocabularies. They take the family
   colour too — held back while off, filled in while on, which is also
   what the row of chips was missing: any visible sign of which one is
   active. */
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
.rr-releases__chip:hover { color: var(--rr-text-strong); border-color: var(--rr-line-strong); }
.rr-releases__chip[aria-pressed="true"] {
    background: var(--rr-accent-soft);
    border-color: var(--rr-accent);
    color: var(--rr-accent);
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
   different things rather than as three variations on a version
   number. */
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

/* A build id is not a version and must never be read as a bigger one:
   it is labelled, unbolded and set back. */
.rr-releases__version[data-rr-kind="build"] { color: var(--rr-faint); font-weight: 400; }
.rr-releases__vkind {
    /* --rr-fs-xs, not 9px: 11px is the floor everything else on the
       page is held to, and a label that says "this is not a version"
       is not the place to go under it. */
    font: 600 var(--rr-fs-xs) / 1 var(--rr-font);
    letter-spacing: .04em;
    text-transform: uppercase;
    color: var(--rr-faint);
    opacity: .8;
}

/* And nothing at all is an empty state, not a piece of punctuation
   somebody left in the column. */
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
/* Six families, covering all eleven kinds the finder knows, painted
   once here and used by both the tags in the rows and the chips that
   filter them. releases.js decides which family a kind belongs to and
   a test fails if a kind is ever added without one — five of them used
   to be coloured and six grey, which looked like a taxonomy and was
   really a list of the ones somebody had got round to. */
.rr-releases__tag[data-family="game"]   { --rr-family: var(--rr-tag-release); }
.rr-releases__tag[data-family="run"]    { --rr-family: var(--rr-warn); }
.rr-releases__tag[data-family="change"] { --rr-family: var(--rr-tag-info); }
.rr-releases__tag[data-family="extra"]  { --rr-family: var(--rr-tag-tutorial); }
.rr-releases__tag[data-family="beside"] { --rr-family: var(--rr-tag-scs); }
.rr-releases__tag[data-family="block"]  { --rr-family: var(--rr-danger); }

.rr-releases__tag[data-family]:not([data-family="other"]) {
    /* The ink lifted toward the theme's own extreme, exactly as the
       topic prefix tags do it, and for the same reason: the hue on a
       14% tint of itself is under 4.5:1 at 12px. */
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
.rr-releases__empty { margin: 0; padding: var(--rr-s5) var(--rr-card-pad); color: var(--rr-faint); font-size: var(--rr-fs-sm); }

@media (max-width: 720px) {
    /* Two lines: what it is, then who and where. The five-column line
       is 620px of content and there is no honest way to fit it. */
    .rr-releases__link { flex-wrap: wrap; row-gap: 4px; }
    .rr-releases__tags { flex-basis: 100%; order: 3; }
    .rr-releases__who { order: 4; }
    .rr-releases__when { order: 5; }
    .rr-releases__page { order: 6; margin-left: auto; }
    .rr-releases__controls { margin-left: 0; flex-basis: 100%; }
    .rr-releases__scope { flex: 1; }
    .rr-releases__tab { flex: 1; }
    .rr-releases__read { flex-basis: 100%; }
}

/* == responsive.css == */
/* ------------------------------------------------------------------
   Mobile.

   The forum ships no viewport meta and lays everything out in fixed
   tables, so on a phone it is a horizontal scroll of 11px text. The
   script injects the viewport tag; these rules unpack the tables.

   Layout modules tag cells with data-rr-col so the rules below can be
   specific instead of guessing at :nth-child.
   ------------------------------------------------------------------ */

@media (max-width: 860px) {
    /* Content width is a desktop setting; on a phone the window is the
       constraint whatever it says. */
    html[data-rr] { --rr-content-max: 100%; --rr-measure: none; }

    html[data-rr] #wrapcentre,
    html[data-rr] #wrapfooter { padding-left: var(--rr-s3); padding-right: var(--rr-s3); }
    html[data-rr] #wrapcentre { padding-top: var(--rr-s3); }

    html[data-rr] .rr-nav { padding: 0 var(--rr-s2); gap: var(--rr-s2); }
    html[data-rr] .rr-nav__search { min-width: 0; width: 30px; padding: 0; justify-content: center; }
    html[data-rr] .rr-nav__search span,
    html[data-rr] .rr-nav__kbd { display: none; }

    /* subsilver2 nests unclassed layout tables inside the data tables:
       pagination strips, button rows, the profile block. Each one keeps
       a table's intrinsic minimum width, so they are unpacked too. */
    html[data-rr] #wrapcentre table:not(.tablebg):not(.forumline),
    html[data-rr] #wrapcentre table:not(.tablebg):not(.forumline) > tbody,
    html[data-rr] #wrapcentre table:not(.tablebg):not(.forumline) > tbody > tr,
    html[data-rr] #wrapcentre table:not(.tablebg):not(.forumline) > tbody > tr > td {
        display: block;
        width: auto !important;
        max-width: 100%;
    }

    /* Tables stop being grids and become stacked blocks. overflow is
       left visible: with the rows as flex containers, hiding it clips
       any cell that wraps to a second line. */
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
        /* Flex items default to min-width:auto, which refuses to shrink
           below the widest word — a long list item then sets the page
           width. */
        min-width: 0;
        max-width: 100%;
        /* The template pins cells with height="30". On a table cell that
           is a minimum and the row grows past it; on a block it is the
           height, and the content simply leaves: the Statistics block on
           the index drew its last two lines below its own card, over the
           next one. */
        height: auto;
        padding: 0;
        border: 0;
        background: none;
    }
    /* Column headers mean nothing once the columns are gone; the row
       has to go with them or it leaves a padded empty band. */
    html[data-rr] table.tablebg > tbody > tr > th { display: none; }
    html[data-rr] table.tablebg > tbody > tr:has(> th):not(:has(> td)) { display: none; }

    /* Topic and forum rows: the title takes the line, the counters
       become one muted meta line underneath. */
    html[data-rr] td[data-rr-col="title"] { flex: 1 1 100%; order: 1; }
    html[data-rr] td[data-rr-col="icon"] { order: 0; flex: none; }
    html[data-rr] td[data-rr-col="replies"],
    html[data-rr] td[data-rr-col="views"],
    html[data-rr] td[data-rr-col="author"],
    html[data-rr] td[data-rr-col="topics"],
    html[data-rr] td[data-rr-col="posts"],
    html[data-rr] td[data-rr-col="last"] {
        order: 2;
        font-size: var(--rr-fs-xs);
        color: var(--rr-muted);
    }
    html[data-rr] td[data-rr-col] p { display: inline; margin: 0; }

    /* The template pins several cells with nowrap="nowrap" and the
       original stylesheet adds more. On a 390px screen a single
       unbreakable "Wednesday, 02 Sep 2026, 23:04" is the whole
       horizontal scrollbar. */
    html[data-rr] #wrapcentre :where(td, th, p, span, div, li, ul, ol, dd, dt, b, strong, i, em, a),
    html[data-rr] [nowrap] { white-space: normal !important; }
    html[data-rr] #wrapcentre :where(pre, code, .code) { white-space: pre !important; }
    html[data-rr] p.forumdesc { display: block; }
    html[data-rr] td[data-rr-col="replies"]::before { content: "replies "; color: var(--rr-faint); }
    html[data-rr] td[data-rr-col="views"]::before { content: "views "; color: var(--rr-faint); }
    html[data-rr] td[data-rr-col="topics"]::before { content: "topics "; color: var(--rr-faint); }
    html[data-rr] td[data-rr-col="posts"]::before { content: "posts "; color: var(--rr-faint); }
    html[data-rr] td[data-rr-col="last"] { flex: 1 1 100%; }
    html[data-rr] td[data-rr-col="last"] br { display: none; }

    /* Posts: the 150px author column becomes a header strip. */
    html[data-rr] td.profile { display: flex !important; align-items: center; gap: var(--rr-s2); }
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
       that does not survive the column collapse, and on a phone the
       action bar above it already covers moving around. */
    html[data-rr] tr:has(> td.cat > table) { display: none; }

    /* A folded reply is still one line here.

       Everything above unpacks a post's table cells into blocks and
       lets its text wrap anywhere, which is right for a post and
       undoes the fold for a folded one: the message went back to
       laying itself out in full, on the screen where a wall of
       "thanks" costs the most. */
    /* #wrapcentre is in both selectors on purpose. The blanket rules
       above carry an id, and an id outranks any number of classes even
       when both sides are !important — so a class-only rule here loses
       to them silently, which is exactly what happened: the fold was
       written twice and applied on neither phone. */
    html[data-rr] #wrapcentre table.tablebg[data-rr-quiet] td:has(> .postbody) {
        display: flex !important;
        align-items: baseline;
        gap: var(--rr-s2);
    }
    html[data-rr] #wrapcentre table.tablebg[data-rr-quiet] .postbody {
        min-width: 0;
        overflow: hidden;
        /* !important against !important. The blanket rule further up
           this file forces white-space: normal on every td, p, span
           and div inside the content — it is what stops the board's
           own nowrap attributes widening a phone — and it is the one
           thing standing between a folded reply and one line. This is
           the deliberate exception to it, on one state of one node. */
        white-space: nowrap !important;
        text-overflow: ellipsis;
    }

    /* "Sort by:" is two words that label the control after them, and
       the blanket rule above broke it across two lines with a select
       in between. The exception carries #wrapcentre and !important for
       the same reason the folded reply above does: the blanket rule
       has both and would otherwise win. These labels are a handful of
       words, so holding them together cannot widen the page. */
    html[data-rr] #wrapcentre td.cat > span.gensmall { white-space: nowrap !important; }

    /* Tap targets. */
    html[data-rr] .rr-icon-btn { width: 34px; height: 34px; }
    html[data-rr] td[data-rr-col="title"] a.topictitle { line-height: 1.45; }
}

@media (max-width: 480px) {
    html[data-rr] { --rr-fs: 15px; --rr-fs-h1: calc(var(--rr-fs) + 5px); }

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

    html[data-rr] .rr-nav__crumbs a:not(:last-child),
    html[data-rr] .rr-nav__sep { display: none; }
    html[data-rr] .rr-toolbar { padding: var(--rr-s3); }

    /* The topic bar carries nine controls and a search box, and on a
       phone that is five wrapped rows before the first post. The air
       between them is what a wide screen wants — there they sit on one
       line and the gap is the only thing separating them — and here it
       is five gaps stacked on top of each other. So the row gap comes
       back down, and only here. */
    html[data-rr] .rr-topicbar { gap: var(--rr-s1) var(--rr-s2); }
    html[data-rr] .rr-topicbar .rr-btn { padding: 6px 10px; }
    html[data-rr] .rr-topicbar__search { flex: 1 1 100%; }
    html[data-rr] .rr-topicbar__search form { flex-wrap: wrap; }
}

/* Print: drop the script chrome entirely. */
@media print {
    /* The skip link too: it is position:fixed and translated off the
       top of the viewport, and a fixed element in print media is drawn
       on every sheet — a printed thread came out with an orange "Skip
       to content" tab at the head of each page. */
    .rr-nav, .rr-fab, .rr-toolbar, .rr-progress, .rr-toasts, .rr-posttools, .rr-skip,
    .rr-sig-toggle { display: none !important; }
    html[data-rr] body { background: #fff; color: #000; }

    /* A collapsed signature is the one fold that hides its content
       outright rather than clipping it, and it was the one fold that
       stayed shut on paper. It opens, and the control that would have
       opened it goes with the rest of the controls. */
    html[data-rr] [data-rr-sig="collapsed"] { display: block !important; }

    /* And unfold everything the screen folded.

       A fold is an affordance: a clipped quote says "there is more,
       click here". Paper has no click. Printing a thread came out with
       quotes cut off mid-sentence and every short reply clipped to its
       first line, with the controls that would have opened them
       printed alongside — the one place where folding really would
       have lost content. */
    html[data-rr] [data-rr-quote="folded"] {
        max-height: none !important;
        -webkit-mask-image: none !important;
                mask-image: none !important;
    }
    /* Carrying #wrapcentre for the same reason the narrow-screen rules
       above do: printing from a phone-width window puts both media
       queries in play at once, and without the id this loses to the
       fold it is supposed to undo. */
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
}`;

/* ================= src/core/store.js ================= */
/* ------------------------------------------------------------------
   Persistence.

   Everything the user changes lives in one object under one GM key, so
   export/import is a single JSON blob and a corrupt value can never
   take more than its own setting down.

   GM_* is used when the userscript manager provides it and localStorage
   is the fallback, which keeps the script working when it is pasted
   into a console or run through a manager with restricted grants.
   ------------------------------------------------------------------ */

const KEY = "rr:settings";
const DATA_KEY = "rr:data";

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

/* ---- Free-form data (bookmarks, history, hidden users) ------------ */

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

/* ---- Schema access ------------------------------------------------ */

let schemaRef = [];

function registerSchema(groups) { schemaRef = groups; }
function schema() { return schemaRef; }

function allFields() {
    const out = [];
    for (const group of schemaRef) out.push(...group.fields);
    return out;
}

function defaultFor(id) {
    const field = allFields().find((f) => f.id === id);
    return field ? field.default : undefined;
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
   readable instead of showing sixty controls at once.

   Groups carry an `icon` and a `short` label: the panel is a rail of
   categories beside the controls rather than one long scroll, and the
   rail needs a name that fits in 150px. Settings are stored flat by
   id, so moving a field between groups costs nothing and needs no
   migration.
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
                desc: "The frame follows the window either way. Reading also caps the line length of a post at about 78 characters, which is where long ones stop being tiring; Wide lets the frame grow further and Full removes both limits.",
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
                id: "masthead", label: "Show the board's masthead on the index", type: "toggle", default: true,
                desc: "The crosshair emblem and the CS.RIN.RU wordmark the board draws at the top of every page, kept on the index only. The top bar carries the wordmark everywhere else; this is the board's face, once, where you land.",
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
                id: "navbar", label: "Compact top bar", type: "toggle", default: true,
                desc: "A 48px sticky bar with the breadcrumb, search, private messages and settings.",
            },
            {
                id: "boardLinks", label: "Board links row", type: "toggle", default: true,
                desc: "Forum rules, FAQ, Chat, Donate and the language switch, which the masthead was the only route to.",
            },
            {
                id: "donateHighlight", label: "Mark the donation link", type: "toggle", default: true,
                desc: "The board runs on donations and is currently asking for them. This gives that one link an outline and a heart rather than leaving it fifth in a row of grey text.",
                when: "boardLinks",
            },
            {
                id: "quickPager", label: "Jump to last page", type: "toggle", default: true,
                desc: "Adds first / last page controls next to every pagination strip. phpBB never links the last page, which is where an update thread is read.",
            },
            {
                id: "backToTop", label: "Back to top button", type: "toggle", default: true,
                desc: "A pair of floating controls for the top and the foot of a long page.",
            },
            {
                id: "progress", label: "Reading progress bar", type: "toggle", default: true,
                desc: "A hairline at the top of the window showing position in the page.",
            },
        ],
    },
    {
        id: "find",
        title: "Search and finding",
        short: "Search",
        icon: "search",
        note: "Main Forum holds 61,000 topics across 615 pages, so finding matters more than paging.",
        fields: [
            {
                id: "palette", label: "Command palette", type: "toggle", default: true,
                desc: "Ctrl+K opens search, forum jumps, bookmarks and every script action in one box.",
            },
            {
                id: "searchDepth", label: "Search looks at", type: "seg", default: "titles",
                options: [
                    { value: "titles", label: "Titles" },
                    { value: "firstpost", label: "+ first post" },
                    { value: "everything", label: "Every post" },
                ],
                desc: "Applies to Ctrl+K. Results are always one row per topic, never one per matching post.",
                when: "palette",
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
                id: "finder", label: "Find files and updates in a topic", type: "toggle", default: true,
                desc: "Lists the posts on the page that carry links, a version number or a reupload, newest first. Answers \"where is the current version\" without reading 19 pages.",
            },
            {
                id: "topicIndex", label: "Index the whole topic", type: "toggle", default: true,
                desc: "Adds a control that reads every page of a topic once and lists everything posted in it — each release, update, repack, crack, reupload and tool — with its version, what kind of thing it is, who posted it, when, and which page. Never runs on its own: it is a click, the answer is kept per topic, and Escape stops it.",
                when: "finder",
            },
        ],
    },
    {
        id: "lists",
        title: "Topic lists",
        short: "Topic lists",
        icon: "filter",
        fields: [
            {
                id: "tightRows", label: "Last post on one line", type: "toggle", default: true,
                desc: "Joins the date and the poster, which the template stacks. Drops the weekday; the full date stays on hover.",
            },
            {
                id: "unreadFromList", label: "Topic titles open at the first unread post", type: "toggle", default: true,
                desc: "The board links the first unread post from a small arrow beside the row. This puts it on the title itself, for rows that actually have unread posts. Needs an account; nothing changes when logged out.",
            },
            {
                id: "hideVisited", label: "Mark topics already opened", type: "toggle", default: true,
                desc: "Fills in the read/unread mark beside a topic this browser has been to. Uses this browser only, so it works while logged out too.",
            },
            {
                id: "bookmarks", label: "Bookmark topics", type: "toggle", default: true,
                desc: "A star on every topic. Bookmarks are listed in the command palette.",
            },
            {
                id: "foldWhoIsOnline", label: "Fold Who is online", type: "toggle", default: true,
                desc: "The index lists all 500-odd names in full, which is most of the page. This keeps the counts and hides the list.",
            },
            {
                id: "hideAnnouncements", label: "Collapse global announcements", type: "toggle", default: false,
                desc: "Folds the pinned announcements at the head of a listing into one line.",
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
                desc: "Reads the first post and rebuilds it as a compact card: store page, AppID, genres, languages, release date.",
            },
            {
                id: "collapseFirst", label: "Fold the Steam description", type: "toggle", default: true,
                desc: "Keeps About the Game, system requirements and screenshots one click away.",
                when: "gameCard",
            },
            {
                id: "externalLinks", label: "External lookups", type: "toggle", default: true,
                desc: "SteamDB, SteamCharts, PCGamingWiki and ProtonDB buttons built from the AppID.",
                when: "gameCard",
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
                id: "foldQuotes", label: "Fold long quotes", type: "toggle", default: true,
                desc: "A quote longer than a few lines is clipped to its opening lines with a control to open it. The text is never taken out of the page: find-in-page, the finder and a screen reader all still read a folded quote in full.",
            },
            {
                id: "foldQuotesLines", label: "Fold a quote over", type: "range", default: 6,
                min: 3, max: 16, step: 1, unit: " lines",
                when: "foldQuotes",
            },
            {
                id: "quietPosts", label: "Fold short low-value replies", type: "toggle", default: false,
                desc: "\"thanks!\", \"+1\" and a lone emoji collapse to one dim line you can click open. Decided from what a post says — never from who wrote it. A post carrying a link, a version, code, an image or a problem report is never folded.",
            },
            {
                id: "quietLimit", label: "Fold replies shorter than", type: "range", default: 120,
                // 400 was a paragraph. At that setting the filter was
                // folding replies that say something, which is the one
                // thing it is built not to do — the tests for it all
                // run at the default and none of them noticed.
                min: 40, max: 240, step: 10, unit: " chars",
                when: "quietPosts",
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
                id: "spoilerAll", label: "Expand all spoilers button", type: "toggle", default: true,
                desc: "One control in the topic bar for a post that hides its links behind ten separate spoilers.",
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
                desc: "What you have typed into the quick reply is kept in this browser against that topic, so closing the tab or following a link and coming back does not lose it. Cleared when the reply is sent, and never sent anywhere.",
                when: "quickReply",
            },
            {
                id: "selectionQuote", label: "Quote what you select", type: "toggle", default: true,
                desc: "Highlight text in a post and a Quote button appears. It goes straight into the reply box when one is open.",
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
                desc: "Hovering a topic title in a listing shows the cover, the review score, the tags, the release date and the opening lines of the store description. Focusing the title with the keyboard does the same; Escape closes it.",
            },
            {
                id: "steamLookup", label: "Ask Steam for games it has not seen", type: "toggle", default: true,
                desc: "Without this the preview only shows games already in this browser's cache — every game topic you have opened, since the info card records its AppID. With it, an unknown title is looked up on Steam's public store API and cached. Nothing but the game name is ever sent, and never over the Tor mirror. Needs your userscript manager to allow GM_xmlhttpRequest: the forum only lets the page talk to itself, so without that grant the request never leaves and the card says so.",
                when: "steamPreview",
            },
            {
                id: "steamCacheDays", label: "Keep a looked-up game for", type: "range", default: 30,
                min: 1, max: 120, step: 1, unit: " days",
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
                desc: "The board colours a username by the group it is in, and several of those come out at about 2.5:1 against the page — well under what small text needs. This keeps the colour and the hue and lifts only its brightness, by the least it takes to be readable. Off leaves them exactly as the board wrote them.",
            },
            {
                id: "skipLink", label: "Skip to content link", type: "toggle", default: true,
                desc: "The first thing Tab reaches, so the top bar is not eight tabs in front of the first topic on every page.",
            },
            {
                id: "reduceMotion", label: "Turn off animation", type: "toggle", default: false,
                desc: "Transitions and smooth scrolling are already dropped when the system asks for reduced motion. This forces it regardless of the system setting.",
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
                desc: "Stored in this browser and never sent anywhere. Powers Recent in the palette.",
            },
            {
                id: "historyLimit", label: "Topics to remember", type: "range", default: 60,
                min: 10, max: 300, step: 10, unit: "",
                when: "history",
            },
            {
                id: "confirmExternal", label: "Confirm before leaving to a filehost", type: "toggle", default: false,
                desc: "Shows the full destination first. Off by default because it adds a click.",
            },
            {
                id: "coexist", label: "Stand down for CS.RIN.RU Enhanced", type: "toggle", default: true,
                desc: "If the Enhanced userscript is running, skip the features it already provides instead of doubling them up.",
            },
        ],
    },
];

/* ================= src/core/dom.js ================= */
/* ------------------------------------------------------------------
   DOM helpers and the icon set.

   Nothing in this script parses markup. Post content is only ever
   moved, cloned or read as textContent, and the icon set — the last
   place that did — is built with createElementNS. That keeps the
   interface working under a Trusted Types policy, where innerHTML and
   DOMParser both throw.
   ------------------------------------------------------------------ */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

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

/**
 * Run fn once <html> exists.
 *
 * At document-start the script can be running before the parser has
 * produced anything at all, so documentElement is not a given. Every
 * theme attribute and the stylesheet depend on it.
 */
function whenRoot(fn) {
    if (document.documentElement) { fn(); return; }
    const observer = new MutationObserver(() => {
        if (document.documentElement) { observer.disconnect(); fn(); }
    });
    observer.observe(document, { childList: true });
}

/**
 * Run fn once <body> exists.
 *
 * Observes `document` rather than documentElement, which is not
 * guaranteed to exist yet at document-start and is not a valid observe
 * target when it does not.
 */
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

/**
 * Keep Tab inside a dialog while it is open.
 *
 * Every overlay in this script draws a scrim over the page, which says
 * "nothing behind this is reachable" to anyone using a mouse and says
 * nothing at all to anyone using a keyboard: Tab walks straight out of
 * the dialog and into a page they cannot see. Returns a teardown.
 */
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

/**
 * May the interface animate?
 *
 * The stylesheet already answers this for transitions, twice: a media
 * query for the system setting and an attribute for the one in the
 * panel. Scrolling does not go through the stylesheet — a `behavior`
 * option passed to scrollTo or scrollIntoView beats the CSS
 * `scroll-behavior` property by design — so every one of the seven
 * places this script scrolls was gliding the page regardless of what
 * either setting said. Reading it back here is what makes the switch
 * mean what it says.
 */
function motionAllowed() {
    if (settings.get("reduceMotion")) return false;
    return !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

/** "smooth" or "auto", for a scroll option. */
function scrollBehaviour() { return motionAllowed() ? "smooth" : "auto"; }

/* ---- Parsing a page this script fetched --------------------------- */

/* Two features fetch a page of the board and read it: the quick reply
   lifts the real form out of posting.php, and the releases panel walks
   a topic. Both need HTML turned into a document, and there is exactly
   one way to do that — DOMParser.

   Under `require-trusted-types-for 'script'` DOMParser.parseFromString
   throws, verified rather than assumed: a page served with that header
   refuses parseFromString, innerHTML, and innerHTML on a document from
   createHTMLDocument, all three with "This document requires
   'TrustedHTML'". cs.rin.ru does not send it today. The embedded video
   players in a game thread do, and @noframes keeps this out of those,
   but a board can add a header any day.

   The escape hatch is the one Trusted Types is designed around: a
   policy. It works whenever the CSP does not also name an allow-list
   that excludes it — checked the same way, and `createPolicy` then
   returns a wrapper whose output parseFromString accepts. Where even
   that is refused, this returns null and the caller says so, which is
   the difference between a feature that reports it cannot run and one
   that throws inside a click handler. */
let htmlPolicy;

function trustedHtml(html) {
    if (typeof window.trustedTypes !== "object" || !window.trustedTypes) return html;
    if (htmlPolicy === undefined) {
        try {
            // The content is a page of the board this script is already
            // running on, fetched same-origin, and it is only ever read
            // — never inserted. There is nothing here to sanitise that
            // the document it came from had not already accepted.
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

/* ---- Colour ------------------------------------------------------- */

/* The board paints usernames from their group: administrators red,
   moderators green, the upload crew its own colour, each written as an
   inline style on the link. Several of those are #BF0000 and darker on
   a near-black page — 2.5:1, against the 4.5 that 13px text is held
   to — and they are on the header of every post and the last line of
   every listing row.
 *
 * Keeping them is not in question: those colours are how this board
 * tells you who is talking. What follows keeps the hue and the
 * saturation and moves only the lightness, by the smallest step that
 * makes the name readable on whatever is actually behind it. A red
 * name stays a red name. */

function parseColour(text) {
    const raw = String(text).trim();

    /* Hex, because a custom property read off the root comes back as
       whatever was typed into the stylesheet rather than as a resolved
       rgb(). Reading #f6f6f6 by pulling the digits out of it gives
       rgb(6, 6, 6) — which is not near-white, it is near-black, and a
       colour lifted toward it goes the wrong way on every theme whose
       text colour happens to contain a digit. */
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

    const parts = (raw.match(/[\d.]+/g) || []).map(Number);
    if (parts.length < 3) return null;
    // color-mix() resolves to color(srgb r g b / a), 0-1 per channel.
    const scale = /^color\(/.test(raw) ? 255 : 1;
    return {
        r: parts[0] * scale,
        g: parts[1] * scale,
        b: parts[2] * scale,
        a: parts.length > 3 ? parts[3] : 1,
    };
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

/**
 * The same colour, made readable against `behind`, by mixing it toward
 * `toward` — the theme's own strong text colour — a fortieth at a time
 * until it reaches `target`. Returns null when it already reads, and
 * when nothing on the way there does.
 *
 * Mixing rather than raising the lightness, and this is the second
 * attempt. Climbing the lightness axis keeps the saturation, so the
 * board's #BF0000 came out at pure rgb(255, 38, 38) — readable and
 * neon, on a board whose author has already said in as many words that
 * the red was too loud. Mixing toward the text colour desaturates as
 * it lightens and lands somewhere near the softened red this script
 * already chose for its links: the same colour, quieter and legible,
 * rather than the same colour turned up.
 */
function readableInk(colour, behind, target, toward) {
    if (!colour || !behind) return null;
    if (contrastRatio(colour, behind) >= target) return null;

    const end = toward || (relativeLuminance(behind) > 0.5
        ? { r: 0, g: 0, b: 0, a: 1 }
        : { r: 255, g: 255, b: 255, a: 1 });

    for (let step = 1; step <= INK_STEPS; step += 1) {
        const mix = step / INK_STEPS;
        const blend = {
            r: colour.r + (end.r - colour.r) * mix,
            g: colour.g + (end.g - colour.g) * mix,
            b: colour.b + (end.b - colour.b) * mix,
            a: 1,
        };
        if (contrastRatio(blend, behind) < target) continue;
        /* One step past the first that clears it: the same name appears
           on a plain row and on a striped one, and those are different
           backgrounds. A fortieth is not a visible difference in the
           colour and it is the difference between passing everywhere
           and passing where it was measured. */
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

/**
 * What is actually painted behind a node.
 *
 * Composited rather than "the first ancestor that is opaque enough":
 * a tag, a chip and a hovered row are all a tint over something else,
 * and stopping at the first one that happens to be solid measures the
 * wrong colour by however much the tints above it were worth.
 */
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

/* ---- Numbers ------------------------------------------------------ */

/* This board counts in the millions and prints the counts as one run of
   digits: 3097072 posts, 168938 views, 61469 topics. At that length a
   number stops being read and becomes a length — nobody reads 3097072,
   they see "long". Grouped, it is three million at a glance.

   The separator is a narrow no-break space (U+202F): the typographic
   one, and no-break, so it can never leave a lone digit at the end of a
   wrapped line. Not a comma — a comma is the decimal separator for half
   this board's readers, to whom 3,097,072 is a number with two decimal
   points in it.

   The digits are regrouped, never rounded or abbreviated: "3.1M" is a
   different fact from 3 097 072, and the exact figure is what a
   counting column is for. And only quantities — a Steam build id, an
   AppID or a post number is a name that happens to be spelled in
   digits, and grouping one would be like putting a comma in a
   postcode. Nothing here runs over a page; every caller names what it
   is handing in. */
const DIGIT_GROUP = "\u202f";

/* Where the grouping starts.

   Four digits, where the caller knows the number is a count: in a
   column, 2393 sitting between 545 and 16 736 is the only one that has
   to be counted rather than read.

   Five, where the caller only knows it is *probably* a count — a
   figure inside the board's own markup rather than a cell this script
   built. 2026 is a year, and a year is a name for a year; grouping one
   would be an error the reader has to undo. Nothing between 1000 and
   9999 is worth that risk when the element could be anything. */
const GROUP_FROM_COUNT = 4;
const GROUP_FROM_GUESS = 5;

/** 3097072 -> "3 097 072". Anything that is not a plain run of digits,
    or is short enough to read as it is, comes back untouched. */
function groupDigits(text, from) {
    const raw = String(text).trim();
    if (!/^\d+$/.test(raw)) return raw;
    if (raw.length < (from || GROUP_FROM_COUNT)) return raw;
    return raw.replace(/\B(?=(\d{3})+(?!\d))/g, DIGIT_GROUP);
}

/**
 * Regroup every long run of digits inside a node, once.
 *
 * The board's own text stays on the title attribute, so the run of
 * digits it printed can still be read off and copied.
 */
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

/**
 * The same, for anything whose *whole* text is one number.
 *
 * Used where the surrounding markup is the board's rather than this
 * script's — the statistics line, a profile's counters — and where a
 * run of digits could as easily be somebody's username.
 */
function groupCountElements(selector, root) {
    for (const node of (root || document).querySelectorAll(selector)) {
        if (!/^\s*\d{5,}\s*$/.test(node.textContent)) continue;
        groupNumbersIn(node, GROUP_FROM_GUESS);
    }
}

/* ---- Icons ------------------------------------------------------- */

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
    // The board's own emblem, redrawn: the masthead is a crosshair over
    // a Steam valve, and the crosshair is the half that survives being
    // shrunk to 20px.
    crosshair: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2"/><path d="M12 1.5v5M12 17.5v5M1.5 12h5M17.5 12h5"/>',
};

/* Each icon's shapes, built once as real nodes and cloned after.

   The definitions above are written as markup because that is how they
   are read and edited. Getting them into the page is another matter:
   under a Content Security Policy with require-trusted-types-for, both
   svg.innerHTML and DOMParser.parseFromString throw. This script draws
   its entire interface with these, and a throw inside icon() takes the
   whole calling module with it — the top bar included — so neither is
   a route worth depending on.

   The vocabulary here is three self-closing tags with plain attributes
   and nothing else, all of them written in this file. Reading that back
   with a pair of expressions and createElementNS is exact for what it
   has to handle, and there is no markup sink left to be gated.

   (Verified against the live board, where the video embeds in a game
   thread do enforce such a policy: the icons survive it.) */
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
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
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

/* ---- Feedback ---------------------------------------------------- */

let toastHost = null;

function toast(message) {
    if (!toastHost) {
        toastHost = el("div.rr-toasts");
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

/* ================= src/core/page.js ================= */
/* ------------------------------------------------------------------
   Reading the page.

   Everything that knows about phpBB markup lives here, so when the
   forum template changes there is one file to fix rather than ten.

   Structure this relies on (subsilver2 / rinDark, verified against the
   live board):
     - one <table class="tablebg"> per post
     - post anchor  a[name="p123456"]
     - author       b.postauthor
     - body         div.postbody   (a second one is the signature,
                                    it starts with the ____ rule)
     - topic rows   a.topictitle inside td.row1
   ------------------------------------------------------------------ */

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

/** The session id phpBB threads through every link, when present. */
function sessionId() {
    const link = document.querySelector('a[href*="sid="]');
    if (!link) return null;
    const match = link.getAttribute("href").match(/[?&]sid=([a-f0-9]+)/);
    return match ? match[1] : null;
}

/** phpBB hides links behind a placeholder for guests; several features
    only make sense once the reader is logged in. */
function isLoggedIn() {
    return Boolean(document.querySelector('a[href*="mode=logout"]'));
}

function currentUser() {
    const link = document.querySelector('a[href*="mode=logout"]');
    if (!link) return null;
    const profile = document.querySelector('a[href*="ucp.php"][href*="i=pm"], a[href*="mode=viewprofile"]');
    return { name: profile ? profile.textContent.trim() : null };
}

/** Unread private messages, read off the UCP link phpBB renders. */
function unreadMessages() {
    const link = Array.from(document.querySelectorAll('a[href*="ucp.php"]'))
        .find((a) => /new message/i.test(a.textContent));
    if (!link) return 0;
    const match = link.textContent.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

/* ---- Topic rows -------------------------------------------------- */

/**
 * Every topic row in a forum listing, with the pieces the list module
 * needs. Rows the template uses for spacing are skipped.
 */
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

/** Forum rows on the index page. */
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

/* ---- Posts ------------------------------------------------------- */

/**
 * Posts on the current topic page, in document order.
 * Returns { table, id, anchor, author, head, headCell, body, signature }.
 *
 * `root` is the document to read, which is this one unless something
 * has fetched another page of the same topic and wants the posts out
 * of it — see releases.js. Nothing in here touches the document it is
 * given, so a detached parse is as valid a subject as the live page.
 *
 * `head` is the header strip the modern layout builds, when one is
 * there. Reading it back off the page rather than only setting it when
 * this module builds it matters: every caller runs its own posts()
 * pass, so a module running after topic.js used to get objects with no
 * head at all and fall through to the template's own header row —
 * which the modern layout hides. That is how the "hide posts by
 * someone" control ended up appended to a row nobody could see.
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
        // A trailing postbody that opens with the ____ rule is the
        // signature, not part of the message.
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

/* ---- Steam metadata ---------------------------------------------- */

const STEAM_APP_RE = /(?:store_item_assets\/steam|steam(?:community)?cdn[^/]*)?\/apps?\/(\d{3,8})\//i;

/**
 * Pull the game details out of a first post written with the forum's
 * SteamInfo BBCode generator.
 *
 * The AppID is taken from the header image URL rather than the store
 * link, because the store link is replaced by a placeholder for guests
 * while the image URL stays intact.
 */
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

    // The generator emits "<b>Label:</b> value" pairs on one line each.
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

/**
 * Where the Steam boilerplate starts in a first post, so it can be
 * folded away. Returns the node to fold from, or null.
 */
function steamBlurbStart(body) {
    for (const node of body.querySelectorAll('span[style*="bold"], b, strong')) {
        if (/^(About The Game|System Requirements|Screenshots)$/i.test(node.textContent.trim())) {
            return node.closest("span[style]") || node;
        }
    }
    return null;
}

/* ---- Topic prefixes ---------------------------------------------- */

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

/**
 * Take the first `count` characters off an element, node by node.
 *
 * The alternative is `link.textContent = rest`, which is one line and
 * throws away every child the link had. On this board that happens to
 * be safe — 330 titles across four boards carry exactly one thing
 * inside them, the coloured spans the template wraps the prefix in,
 * and those are the characters being removed anyway. It is safe by
 * coincidence rather than by construction, and the day somebody's
 * title carries an image or a link, one line would silently eat it.
 *
 * This removes the prefix and nothing else.
 */
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

/**
 * Split "[Info] Dragon's Dogma 2" into its prefix and the real
 * title. Topics often carry two, as in "[Release] [Userscript] ...",
 * so every leading bracket group is taken.
 */
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

    // The first recognised prefix decides the colour; an unknown one
    // stays neutral rather than borrowing a meaning it does not have.
    const kind = prefixes
        .map((name) => PREFIX_KINDS[name.toLowerCase()])
        .find(Boolean) || "neutral";

    return { prefix: prefixes[0], prefixes, kind, rest };
}

/* ================= src/core/pagination.js ================= */
/* ------------------------------------------------------------------
   Pagination.

   phpBB prints "1, 2, 3 ... 19, Next" and never a link to an arbitrary
   page, so anything that wants to jump has to work the offsets out.

   The approach follows the one worked out in the wefalltomorrow fork of
   CS.RIN.RU Enhanced, rewritten without jQuery: read the numbered
   anchors, derive the posts-per-page step from any two of them, and
   synthesise the href for pages that have no link.
   ------------------------------------------------------------------ */

/** Numbered page anchors on the page, as { page: {href, start} }. */
function pageLinkMap(root = document) {
    const map = new Map();
    for (const link of root.querySelectorAll("a[href]")) {
        const label = link.textContent.trim();
        if (!/^\d+$/.test(label)) continue;              // skip Go, Next, Previous
        const href = link.getAttribute("href");
        if (!href || !/viewtopic|viewforum|search/.test(href)) continue;

        const page = parseInt(label, 10);
        if (map.has(page)) continue;                     // first occurrence wins
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
        const match = cell.textContent.match(/\bof\s+(\d+)\b/);
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

/**
 * A URL for the given page number: a real link when the template
 * printed one, otherwise the current URL with start= rewritten.
 */
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

/* ================= src/modules/theme.js ================= */
/* ------------------------------------------------------------------
   Theme application.

   Runs at document-start so the page never flashes the original
   stylesheet, and re-runs on every settings change.
   ------------------------------------------------------------------ */

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
    root.setAttribute("data-rr-icons", settings.get("modernIcons") ? "on" : "off");
    root.setAttribute("data-rr-nav", settings.get("navbar") ? "on" : "off");
    root.toggleAttribute("data-rr-still", Boolean(settings.get("reduceMotion")));

    root.style.setProperty("--rr-fs", settings.get("fontSize") + "px");

    const accent = ACCENTS[settings.get("accent")] || ACCENTS.brass;
    root.style.setProperty("--rr-accent", isLight ? accent.light : accent.accent);
    root.style.setProperty("--rr-accent-soft", isLight ? accent.lightSoft : accent.soft);
    root.style.setProperty("--rr-accent-text", isLight ? accent.lightText : accent.text);
    root.style.setProperty("color-scheme", isLight ? "light" : "dark");
}

/** The forum ships no viewport tag, which is why phones get a 1000px
    page scaled down to unreadable. */
function ensureViewport() {
    // <head> may not exist yet at document-start; the tag is only
    // needed before layout, so waiting for it is fine.
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
        if (["theme", "accent", "density", "fontSize", "width", "modernIcons", "navbar", "reduceMotion"].includes(id) || id === "*") {
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

/* ---- The board's own colours, kept and made readable --------------- */

/* Every colour the *script* paints is measured against WCAG AA by
   test/contrast.js and every one of them passes. The board's own are a
   different matter and not the script's to redesign — except that they
   are on the same page, in the same type sizes, and several of them
   are genuinely hard to read: group-coloured usernames come out at
   2.5:1 on the dark themes and 1.9:1 on the light one, and the
   "[[Please login to see this link.]]" marker at 3.1.
 *
 * So they are kept and lifted: same hue, same saturation, the smallest
 * change in lightness that reaches the threshold against whatever is
 * behind them. Only colours the board wrote inline, only where they
 * fail, and never more than they have to. The original is kept on the
 * element so nothing is lost.
 *
 * It has its own switch, because a board's colours are part of how it
 * looks and somebody may prefer them exactly as they are. */
/* 4.5 for everything, including the large text WCAG lets off at 3.
   Two thresholds meant the pass and test/contrast.js could disagree
   about one span in a signature and each be right, which is a bad way
   to spend an afternoon; and being stricter than the standard on
   somebody else's colours only ever makes them easier to read. */
const INK_TARGET = 4.75;

function readableBoardInk() {
    if (!settings.get("readableInk")) return;

    // The end of the mix: the theme's own strongest text colour, so a
    // lifted username lands in this palette rather than beside it.
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
        node.style.color = "rgb(" + [lifted.r, lifted.g, lifted.b]
            .map((v) => Math.round(v)).join(", ") + ")";
    }
}

/* ================= src/modules/icons.js ================= */
/* ------------------------------------------------------------------
   Legacy imagery.

   The board draws its interface with GIFs from 2003: beveled
   checkboxes for read state, image buttons for "Post reply", arrows
   for "view latest post". Hiding them in CSS leaves their alt text
   behind, which is worse than the image. They are replaced here.

   Each replacement keeps the original title so hover help survives,
   and the original node is kept (display:none) rather than removed,
   because other userscripts look for it.
   ------------------------------------------------------------------ */

const STATUS_RE = /(global|announce|sticky|topic|forum)_(un)?read/;

/* Images that sit beside a label saying the same thing, or that draw
   nothing at all: the 12px menu bullets, the page-jump target, the
   1px spacers subsilver2 uses for table corners. */
const DECORATION_RE = /icon_mini_|icon_donate|spacer\.gif|icon_post_target|\/arrow_|subforum_/;

function statusDot(img) {
    const src = img.getAttribute("src") || "";
    const unread = /_unread/.test(src);
    const locked = /locked/.test(src);

    const dot = el("span.rr-dot", {
        title: img.getAttribute("title") || img.getAttribute("alt") || "",
        "data-state": unread ? "unread" : "read",
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

/**
 * A control the board draws as an image inside a link and nothing else:
 * "Reply with quote", "Profile", the post permalink.
 *
 * Hiding the image leaves a link with no content: the control is still
 * in the page and still clickable, but nothing marks where it is. Every
 * one of them gets the alt text as a real label instead, which is why
 * this runs before the catch-all below rather than after it.
 */
function controlLink(img) {
    const link = img.closest("a");
    if (!link || link.textContent.trim()) return false;

    const label = (img.getAttribute("title") || img.getAttribute("alt") || "").trim();
    if (!label || label === "*") return false;

    link.classList.add("rr-ctl");
    link.setAttribute("title", label);
    link.append(el("span.rr-ctl__label", {}, [label]));
    img.style.display = "none";
    return true;
}

/**
 * Turn an image button ("Post reply", "New topic") into a real button.
 * The label comes from the image alt, which the template fills in.
 */
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

        if (STATUS_RE.test(src)) { statusDot(img); continue; }
        if (/icon_topic_latest/.test(src)) { latestPostArrow(img); continue; }
        if (/\/button_/.test(src)) { imageButton(img); continue; }
        if (controlLink(img)) continue;

        // Only what is known to be decoration is hidden. The catch-all
        // that used to sit here hid every image the loop did not
        // recognise, which is how a control ends up invisible the day
        // the board adds one — the SCS status tags this board draws
        // inside topic titles are exactly that shape.
        if (DECORATION_RE.test(src)) { img.style.display = "none"; continue; }
        img.classList.add("rr-legacy-img");
    }

    // The template writes "Go to page:" next to a target icon; with the
    // icon gone the stray colon reads better as a label.
    for (const strip of document.querySelectorAll("p.gensmall")) {
        if (/Go to page/.test(strip.textContent)) strip.classList.add("rr-pagejump");
    }

    hideEmptyRows();
}

/**
 * subsilver2 uses rows holding a single &nbsp; to draw the rounded
 * corners of a table. Without those corner images they are 30px of
 * nothing between every block.
 */
function hideEmptyRows() {
    for (const row of document.querySelectorAll("table.tablebg > tbody > tr")) {
        if (row.querySelector("img, input, a, form, h4")) continue;
        if (row.textContent.trim() !== "") continue;
        row.style.display = "none";
    }
}

/* ================= src/modules/settingsui.js ================= */
/* ------------------------------------------------------------------
   Settings panel.

   Generated entirely from the schema, so a new feature is a new entry
   in schema.js and nothing else. Changes apply live: there is no Save
   button because there is nothing to save at the end.

   The panel is a rail of categories beside the controls rather than
   one scroll of sixty rows. Picking a category shows that category;
   typing in the search box searches all of them at once and the rail
   then says how many each one holds, so a setting whose name you half
   remember is one glance rather than nine.
   ------------------------------------------------------------------ */

let panelHost = null;

/* Every control below exposes a sync() so the panel can be brought back
   in line with a setting that changed somewhere else — the palette's
   "Switch theme" action, or an import. Without it the panel goes on
   showing the value it had when it opened. */

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
        settings.set(field.id, next);
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
        button.addEventListener("click", () => { settings.set(field.id, option.value); sync(); });
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
        settings.set(field.id, value);
    });
    const wrap = el("div.rr-rangewrap", {}, [input, readout]);
    wrap.sync = () => {
        const value = settings.get(field.id);
        input.value = String(value);
        readout.textContent = value + (field.unit || "");
    };
    return wrap;
}

function buildSwatches(field) {
    const group = el("div.rr-swatches", { role: "group", "aria-label": field.label });
    const sync = () => {
        for (const button of group.children) {
            button.setAttribute("aria-pressed", button.dataset.value === settings.get(field.id) ? "true" : "false");
        }
    };
    for (const option of field.options) {
        const button = el("button.rr-swatch", {
            type: "button",
            title: option.label,
            "aria-label": option.label,
            style: { background: option.color },
        });
        button.dataset.value = option.value;
        button.addEventListener("click", () => { settings.set(field.id, option.value); sync(); });
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
    // Searched on the words a reader would use, not the id: nobody
    // looks for "linkifyBare". The id is in there anyway, for whoever
    // read it in an export.
    row.dataset.search = (field.label + " " + (field.desc || "") + " " + field.id).toLowerCase();
    // Two attributes for one fact, because the stylesheet reads the
    // prefixed one and dataset.dep would have written data-dep, which
    // matches nothing.
    if (field.when) {
        row.dataset.when = field.when;
        row.setAttribute("data-rr-dep", field.when);
    }
    return row;
}

/** A field is only shown when the field it depends on is on. */
function syncDependencies(body) {
    for (const row of body.querySelectorAll("[data-when]")) {
        row.toggleAttribute("data-rr-dep-off", !settings.get(row.dataset.when));
    }
}

/** Bring every control in the panel back in line with what is stored. */
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
        data: store.all(),
    };
    copyText(JSON.stringify(payload, null, 2), "Settings copied as JSON");
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
        setTimeout(() => location.reload(), 600);
    } catch {
        toast("That is not valid exported JSON");
    }
}

/* ---- The panel ---------------------------------------------------- */

/**
 * Which rows a category still shows, and which category is open.
 *
 * Two states rather than one, because they mean different things: a
 * row hidden because its parent setting is off must stay hidden while
 * searching, and a category with no matches must be sayable as "no
 * matches" rather than silently empty.
 */
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

    // Left and right walk the rail, which is what a tab list does.
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

    /* Searching cuts across the categories: the rail keeps a count per
       category and the pages show every match at once, because a
       reader who types "quote" does not know which of nine boxes it
       was filed under. */
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

        // Every category with a hit is on screen at once while
        // searching, so the answer is never behind a tab.
        for (const entry of groups) {
            entry.section.toggleAttribute("data-rr-off", entry.tab.hasAttribute("data-rr-empty"));
        }
        return total;
    };

    select(current);
    return { rail, pages, search, groups, select };
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
            el("button.rr-btn", { type: "button", onclick: exportSettings }, [icon("copy"), "Export"]),
            el("button.rr-btn", { type: "button", onclick: importSettings }, ["Import"]),
            el("span.rr-spacer"),
            el("button.rr-btn", {
                type: "button",
                onclick: () => {
                    if (!window.confirm("Reset every RIN Reforged setting to its default?")) return;
                    settings.reset();
                    toast("Settings reset");
                    setTimeout(() => location.reload(), 400);
                },
            }, ["Reset"]),
        ]),
    ]);

    // A light scrim rather than the palette's full dim: the panel is
    // for adjusting the page you can still see behind it.
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
/* ------------------------------------------------------------------
   The top bar.

   Replaces a 340px masthead with 48px. Links are lifted out of the
   original header rather than hardcoded, so a board-side change to the
   menu carries over instead of leaving a dead URL behind.
   ------------------------------------------------------------------ */

/** Find a link in the original masthead by what its href contains. */
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

    // On a topic page the breadcrumb stops at the forum, so the topic
    // title is appended: it is the one thing worth keeping on screen
    // while scrolling a 19 page thread.
    const heading = document.querySelector("#pageheader h2 a.titles, #pageheader h2");
    if (heading && PAGE.isTopic) {
        if (wrap.children.length) wrap.append(el("span.rr-nav__sep", {}, ["/"]));
        const { rest } = splitPrefix(heading.textContent.trim());
        wrap.append(el("a", { href: "#top", title: rest }, [rest]));
    }
    return wrap;
}

/* The board's own masthead art, and the window on to it.

   The masthead is 380x109 and mostly picture: an emblem on the left,
   CS.RIN.RU set in a squared face beside it, a strapline underneath.
   Shrunk whole to navbar height the wordmark lands at 7px, which is why
   an earlier version redrew it — and a redraw of a logo is a different
   logo.

   Cropping it keeps the board's actual art. The window is the wordmark
   alone: at 32px it stands 14px tall and reads exactly as the board
   sets it, where the emblem beside it is a dark shape on a dark plate
   that turns to a smudge at any size that fits in a bar.

   The board ships two of these and serves whichever the page asks for
   — site_logo-1 has a red crosshair over a Steam valve and the "Steam
   Underground Community" strapline, site_logo-2 a rifleman and
   "NonSteam Gaming Servers" — and the wordmark sits in a different
   place in each. One set of offsets framed the strapline on half the
   board's pages, so each file gets its own.

   These are pixel offsets into specific files. A file that is not one
   of them, or one whose dimensions have changed, falls back to the
   name set as type rather than showing a crop of the wrong thing. */
const LOGO_ART = {
    "site_logo-1": { natural: [380, 109], crop: [186, 6, 190, 42] },
    "site_logo-2": { natural: [380, 109], crop: [180, 18, 196, 32] },
};

const LOGO_HEIGHT = 26;

/** The crop for a logo URL, or null if it is not one this knows. */
function logoCrop(src) {
    for (const [name, art] of Object.entries(LOGO_ART)) {
        if (src.includes(name)) return art;
    }
    return null;
}

/** Where the template put the masthead art, whatever it is called. */
function findLogo() {
    return document.querySelector(
        '#logodesc img[src*="site_logo"], #wrapheader img[src*="site_logo"], #wrapheader img[src*="logo"]'
    );
}

function buildBrand() {
    const strapline = document.querySelector("#logodesc h1, #wrapheader h1");
    const source = findLogo();

    const brand = el("a.rr-nav__brand", {
        href: "./index.php",
        "aria-label": "Board index",
        title: strapline ? strapline.textContent.replace(/\s+/g, " ").trim() : "CS RIN - Steam Underground",
        // Until the art is measured the type wordmark is what shows, so
        // the bar is never briefly empty.
        "data-rr-logo": "type",
    });

    // The fallback, and what a board with different art gets: the name
    // in the wide tracking the wordmark uses.
    brand.append(el("span.rr-nav__word", {}, ["CS.RIN.RU"]));

    const src = source && source.getAttribute("src");
    const spec = src && logoCrop(src);
    if (!spec) return brand;

    const art = el("img.rr-nav__art", { src, alt: "CS.RIN.RU", decoding: "async" });
    const window_ = el("span.rr-nav__logo", { "aria-hidden": "true" }, [art]);

    const accept = () => {
        const [width, height] = spec.natural;
        if (art.naturalWidth !== width || art.naturalHeight !== height) {
            window_.remove();
            return;
        }
        for (const [name, value] of Object.entries(logoCropVars(spec))) {
            document.documentElement.style.setProperty(name, value);
        }
        brand.setAttribute("data-rr-logo", "art");
    };
    if (art.complete && art.naturalWidth) accept();
    else {
        art.addEventListener("load", accept, { once: true });
        art.addEventListener("error", () => window_.remove(), { once: true });
    }

    brand.prepend(window_);
    return brand;
}

/** One crop, as the custom properties the stylesheet reads. */
function logoCropVars(spec) {
    const [naturalW, naturalH] = spec.natural;
    const [x, y, cropW, cropH] = spec.crop;
    const scale = LOGO_HEIGHT / cropH;
    return {
        "--rr-logo-w": Math.round(cropW * scale) + "px",
        "--rr-logo-h": LOGO_HEIGHT + "px",
        "--rr-logo-img-w": Math.round(naturalW * scale) + "px",
        "--rr-logo-img-h": Math.round(naturalH * scale) + "px",
        "--rr-logo-x": "-" + Math.round(x * scale) + "px",
        "--rr-logo-y": "-" + Math.round(y * scale) + "px",
    };
}

/* ---- One search shape ---------------------------------------------- */

/* There were two.

   The palette trigger in the top bar was a fully rounded pill with a
   `Ctrl K` chip — the command-palette look every editor written since
   2020 has. The board's own search boxes, which this script moves into
   the topic bar and the listing toolbar, are a rectangular input beside
   a rectangular submit button. Both on screen at once, doing the same
   job, in two different visual languages, next to a `Reply` button with
   a third corner radius.

   The rule now is the one the rest of the interface already follows:
   **a control has the button radius; a pill is a label.** Tags, filter
   chips and the "latest version" badge stay pills because they are read
   rather than pressed. Everything you click is 7px.

   This is the second half: the board's form, given the same frame as
   the palette trigger — one field with the search glyph at its head and
   whatever it submits with tucked inside its right edge. The form is
   the board's own, moved, so its action, its hidden inputs and its
   tokens are untouched. */
function adoptBoardSearch(form) {
    if (!form || form.closest(".rr-search")) return form;

    const field = form.querySelector('input[type="text"], input[type="search"], input.inputbox');
    const submit = form.querySelector('input[type="submit"], button[type="submit"]');

    if (field) {
        /* The board fakes a placeholder: the prompt is the value, and
           two inline handlers clear it on click and put it back on
           blur. Anyone reaching the box with Tab therefore submits the
           words "Search this topic" as a query, and the box always
           looks filled in. A real placeholder does the same job
           correctly, so the value becomes one and the handlers that
           existed only to manage it go. */
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
    return el("div.rr-search", {}, [form]);
}

/* ---- Board bar ---------------------------------------------------- */

/* The masthead is the board's only route to its rules, its FAQ, the
   chat, the donation page, registration and the English/Russian
   switch. rr-nav lifts the search box, the inbox and the account link
   out of it and the stylesheet then hides the rest, which takes those
   six links with it. They come back here, as one slim row at the top of
   the content, in the order the masthead used. */

/** Destinations the navbar already offers as an icon of its own. */
const NAV_LIFTED = /[?&]i=pm|mode=login(?:&|$)/;

/**
 * One entry in the board bar.
 *
 * The original anchor is moved rather than copied, so the session id in
 * its href, and anything another userscript has attached to it, both
 * survive.
 */
/* The board runs on donations and is asking for them right now: the
   overlay it shows every visitor says so. The link to that page was
   one of six greys in the masthead, and this row inherited that. It
   gets an outline and a heart — enough to find at a glance, not
   enough to shout, and still the board's own link with the board's own
   wording. */
const DONATE_RE = /donat/i;

function isDonateLink(link) {
    return DONATE_RE.test(link.getAttribute("href") || "")
        || DONATE_RE.test(link.textContent || "");
}

function boardBarLink(link) {
    const label = link.textContent.replace(/\s+/g, " ").trim();
    const image = link.querySelector("img");
    const donate = settings.get("donateHighlight") && isDonateLink(link);

    link.classList.add("rr-boardbar__link");

    // The language switch is two flags with no text beside them: there
    // the image is the label, and it is the one the board's Russian
    // half looks for.
    if (!label && image) {
        image.classList.add("rr-boardbar__flag");
        image.style.display = "";
        return link;
    }

    // Everything else pairs a 12px GIF with a label that says the same
    // thing, so the label alone is enough.
    link.textContent = label;

    if (donate) {
        // The label goes in a span of its own so the narrow layout can
        // drop it and keep the heart. On a phone this row folds behind
        // a More control, and folding away the one link the board is
        // currently asking people to use — right after giving it an
        // outline — is emphasis nobody sees. As an icon it costs 26px
        // and stays on screen; the label it loses is on the link's
        // accessible name instead, so nothing is lost to a reader who
        // is not looking at it.
        link.textContent = "";
        link.classList.add("rr-boardbar__donate");
        link.append(icon("heart", 12), el("span.rr-boardbar__donate-label", {}, [label]));
        link.setAttribute("aria-label", label);
        link.setAttribute("title", label + " — the board is hosted on donations");
    }
    return link;
}

/* Twelve links in a row, in the order the masthead happened to print
   them, is a list of twelve things rather than a menu. They are three
   different kinds of thing and always were:

     views    — ways of looking at threads (unanswered, active, search)
     board    — what the board is (rules, FAQ, chat, donate, and
                anything else the masthead carries)
     account  — you (register, log in, log out, profile)

   Grouping them is also what stops `Logout [ name ]` landing alone on
   a second line: it was the twelfth item in one wrapping flex row, so
   it wrapped, and one word on its own line reads as a mistake. In the
   account group it sits with the two links it belongs with.

   Classified by destination, not by label, because the labels are
   translated and the hrefs are not. */
const BOARD_BAR_GROUPS = [
    { id: "views", label: "Threads", re: /search\.php/ },
    { id: "account", label: "Account", re: /ucp\.php|mode=(?:login|logout|register)|viewprofile|profile\.php/ },
    { id: "board", label: "Board", re: /(?:)/ },      // the rest
];

function boardBarGroup(href) {
    for (const group of BOARD_BAR_GROUPS) {
        if (group.re.test(href)) return group;
    }
    return BOARD_BAR_GROUPS[BOARD_BAR_GROUPS.length - 1];
}

/* The board is bilingual and its own switch is two 16px flags with no
   text, no label and no indication of which one you are on — the one
   piece of the masthead that was carried over unchanged because it
   already had no words to carry. Read as a control it says nothing:
   two small pictures, one of which is already true.

   So the same two links become a segmented control with the language
   codes beside the flags and the current one marked, which is what the
   rest of this interface uses for a two-way choice. The anchors are the
   board's own, moved rather than rebuilt, so the hrefs and any session
   id in them survive. */
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
            // Still a link — the board sets the cookie from it, and
            // clicking the language you are already on is harmless —
            // but marked as where you are.
            link.setAttribute("aria-current", "true");
        }
        group.append(link);
    }
    return group;
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
        const key = href.replace(/[?&]sid=[a-f0-9]+/, "").replace(/[?&]$/, "");
        if (seen.has(key)) return;
        seen.add(key);
        if (/[?&]lang=/.test(href)) { languages.push(link); return; }
        const group = groupNode(boardBarGroup(href).id);
        const node = boardBarLink(link);
        group.append(node);
        // Which group the donation link landed in, so the narrow layout
        // can keep that one showing while it folds the rest away.
        if (node.classList.contains("rr-boardbar__donate")) group.setAttribute("data-rr-donate", "");
    };

    // "View unanswered posts | View active topics" is the board's own
    // strip. It currently floats above the listing with nothing around
    // it; here it leads the row.
    for (const strip of document.querySelectorAll("#wrapcentre p.searchbar")) {
        for (const link of Array.from(strip.querySelectorAll("a[href]"))) take(link);
        if (!strip.querySelector("a[href], form")) strip.remove();
    }

    for (const link of Array.from(document.querySelectorAll("#wrapheader a[href]"))) {
        if (link.querySelector('img[src*="site_logo"], img[src*="logo"]')) continue;
        if (NAV_LIFTED.test(link.getAttribute("href") || "")) continue;
        take(link);
    }

    // In the order declared, not the order the masthead happened to
    // print them: a group that is empty on this page simply is not
    // drawn.
    const main = el("div.rr-boardbar__main");
    for (const group of BOARD_BAR_GROUPS) {
        const node = groups.get(group.id);
        if (node && node.children.length) main.append(node);
    }

    const end = el("div.rr-boardbar__end");
    const language = buildLanguageSwitch(languages);
    if (language) end.append(language);
    else for (const link of languages) end.append(boardBarLink(link));

    if (!main.children.length && !end.children.length) return null;

    // On a phone eight links and two flags wrap to three lines and take
    // 90px before any content. The two entry points people actually
    // start from stay put — every guide to this board says to bookmark
    // "View unanswered posts" — and the rest folds behind one control.
    // The stylesheet decides at what width; this is only the switch.
    const more = el("button.rr-boardbar__more", {
        type: "button",
        "aria-expanded": "false",
        "aria-label": "More board links",
    }, ["More", icon("chevronD", 12)]);

    const bar = el("nav.rr-boardbar", { "aria-label": "Board links" }, [main, end, more]);

    more.addEventListener("click", () => {
        const open = bar.toggleAttribute("data-rr-open");
        more.setAttribute("aria-expanded", open ? "true" : "false");
    });

    return bar;
}

/**
 * Give a control a name, said three ways.
 *
 * These are glyphs with nothing beside them. `title` is the browser's
 * own tooltip and takes about a second of hovering to appear, which is
 * a second of not knowing what a button does; `aria-label` is what a
 * screen reader announces; `data-rr-tip` is what the stylesheet draws
 * on hover and on focus, straight away. All three say the same words,
 * from one argument, so they cannot drift apart.
 */
function labelled(node, text) {
    node.setAttribute("title", text);
    node.setAttribute("aria-label", text);
    node.setAttribute("data-rr-tip", text);
    return node;
}

function buildNavbar() {
    const bar = el("header.rr-nav", { role: "banner" });
    bar.append(buildBrand());

    bar.append(buildCrumbs());

    const actions = el("div.rr-nav__actions");

    if (settings.get("palette")) {
        const search = el("button.rr-nav__search", { type: "button", "aria-label": "Search and jump (Ctrl+K)" }, [
            icon("search"),
            el("span", {}, ["Search or jump to"]),
            el("span.rr-kbd.rr-nav__kbd", {}, [navigator.platform.startsWith("Mac") ? "⌘K" : "Ctrl K"]),
        ]);
        search.addEventListener("click", () => openPalette());
        bar.append(search);
    } else {
        const searchHref = findHeaderLink("search.php");
        if (searchHref) {
            actions.append(el("a.rr-icon-btn", { href: searchHref, title: "Search" }, [icon("search")]));
        }
    }

    const pmHref = findHeaderLink("i=pm", "ucp.php?i=pm");
    if (pmHref) {
        const unread = unreadMessages();
        const label = unread > 0
            ? "Private messages — " + unread + " unread"
            : "Private messages";
        const button = labelled(el("a.rr-icon-btn", { href: pmHref }, [icon("mail")]), label);
        if (unread > 0) button.append(el("span.rr-badge", {}, [String(unread)]));
        actions.append(button);
    }

    const ucpHref = findHeaderLink("mode=login", "ucp.php");
    if (ucpHref) {
        const label = isLoggedIn() ? "Your account" : "Log in";
        actions.append(labelled(el("a.rr-icon-btn", { href: ucpHref }, [icon("user")]), label));
    }

    /* The board's controls end here and this script's begins.

       Three unlabelled glyphs in a row read as three of the same
       thing, and two of them belong to the forum while the third opens
       a panel the forum knows nothing about. A hairline is the whole
       distinction: enough that the cog is not read as a fourth board
       feature, not so much that it becomes a second toolbar. The
       tooltip says the rest — it names the script. */
    actions.append(el("span.rr-nav__divide", { "aria-hidden": "true" }));

    const settingsButton = labelled(
        el("button.rr-icon-btn", { type: "button" }, [icon("settings")]),
        "RIN Reforged settings");
    settingsButton.addEventListener("click", () => openSettings());
    actions.append(settingsButton);

    bar.append(actions);
    return bar;
}

/* ---- The board's own masthead ------------------------------------- */

/**
 * The board's face, kept.
 *
 * The 340px masthead is replaced by a 48px bar, and that trade is
 * worth making on every page of a thread. But the art in it is not
 * chrome: a crosshair over a Steam valve with CS.RIN.RU set beside it
 * is what the board looks like, and a redesign that shows a 26px crop
 * of the wordmark and nothing else looks like any forum at all.
 *
 * So it comes back once, on the index, at the size the board draws it.
 * One page, 109px, where you land — everywhere else the bar carries
 * the wordmark and the content starts at the top.
 *
 * The node is a new <img> pointing at the same file rather than the
 * original moved out of #wrapheader: that block is hidden rather than
 * removed precisely because other userscripts read it, and this must
 * not be the thing that breaks them.
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

    // A file that will not load leaves a broken image where the board's
    // name should be, which is worse than not showing it.
    art.addEventListener("error", () => banner.remove(), { once: true });
    return banner;
}

/**
 * A skip link, as the first thing Tab reaches.
 *
 * The board has none, and the top bar this script adds puts a brand, a
 * breadcrumb, a search box and four buttons in front of the content on
 * every single page. Without a way past them, reaching the first topic
 * from the keyboard is eight tabs, every time.
 *
 * The target needs to be focusable or the browser moves the scroll
 * position and leaves focus behind, so it is given tabindex="-1".
 */
function addSkipLink() {
    if (!settings.get("skipLink")) return;
    const main = document.querySelector("#wrapcentre");
    if (!main || document.querySelector(".rr-skip")) return;

    if (!main.id) main.id = "rr-main";
    main.setAttribute("tabindex", "-1");

    const skip = el("a.rr-skip", { href: "#" + main.id }, ["Skip to content"]);
    skip.addEventListener("click", (event) => {
        event.preventDefault();
        main.focus();
        main.scrollIntoView();
    });
    document.body.prepend(skip);
}

function initNavbar() {
    if (!settings.get("navbar")) return;

    const bar = buildNavbar();
    document.body.prepend(bar);
    addSkipLink();                 // prepended after, so it lands first

    const centre = document.querySelector("#wrapcentre");
    const board = settings.get("boardLinks") ? buildBoardBar() : null;
    const banner = PAGE.isIndex && settings.get("masthead") ? buildMasthead() : null;

    /* The board's own art and the row of links it used to sit above,
       as one header block.

       They were two blocks stacked: 380px of picture with a thousand
       pixels of nothing beside it, and the links on their own line
       underneath. Beside each other they compose — the art anchors the
       left, the links fill the space it was leaving empty, and the
       page you land on gets its first listing row a hundred pixels
       higher. The stylesheet drops back to stacking them below the
       width where that stops fitting.

       Only the index has a masthead; everywhere else this is the
       board bar on its own, exactly as before. */
    if (centre && banner && board) centre.prepend(el("div.rr-header", {}, [banner, board]));
    else if (centre && board) centre.prepend(board);
    else if (centre && banner) centre.prepend(banner);

    // The forum anchors "back to top" at <a name="top">, which now sits
    // under the sticky bar; offset it so jumps land in the right place.
    document.documentElement.style.scrollPaddingTop = "60px";
}

/**
 * <br> the template used as spacing, left stranded beside a block this
 * script injected.
 *
 * subsilver2 separates its strips with bare <br> rather than margins.
 * Where a strip has been folded into one of the script's own bars the
 * <br> stays behind as a 19px band: that is what sat between the action
 * bar and the filter bar, and what stopped the two being drawn as one
 * card, since a sibling combinator still sees a hidden element.
 *
 * Runs after every module, so a bar inserted late is covered too.
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

/* subsilver2 writes its little link strips as literal text:

       <a ...>Unsubscribe topic</a>&nbsp;|&nbsp;
       <a ...>Bookmark topic</a>&nbsp;|&nbsp;
       <a ...>E-mail friend</a>

   The links are conditional. The bars between them are not — they are
   typed into the template beside each link rather than generated
   between the ones that survive. So a reader who cannot see one of
   those links gets its separator anyway, and the strip reads
   "Unsubscribe topic | Bookmark topic | | E-mail friend"; where the
   missing link is the last one, the bar is left hanging on its own at
   the far end of a cell that is still 100% wide, which is the lone `|`
   floating in an acre of nothing.
   
   Both were reported from the live board and neither is visible logged
   out, which is why they survived this long.

   This is the same job dropStrayBreaks() does for the template's <br>
   spacing, on the other thing it uses as punctuation: a separator only
   belongs between two things that are actually there. */
/* A text node made of nothing but spacing and bars, holding at least
   one bar. It has to allow several: `</a>&nbsp;|&nbsp; &nbsp;|&nbsp;
   <a>` is a *single* text node in the DOM, so a rule written for one
   bar per node sees the doubled separator as ordinary text and leaves
   it exactly where it is. */
const SEPARATOR_TEXT = /^[\s |·•]*[|·•][\s |·•]*$/;
/* What one that earns its place is rewritten to. The board's own
   spacing, so a strip cannot break across lines at its punctuation. */
const SEPARATOR_KEPT = " | ";

/** Does this node take up room on the page? */
function occupies(node) {
    if (node.nodeType === 3) return Boolean(node.textContent.replace(/[\s ]/g, ""));
    if (node.nodeType !== 1) return false;
    if (node.tagName === "BR") return false;
    return node.getClientRects().length > 0;
}

/**
 * Drop the separators in one strip that separate nothing.
 *
 * Walks the strip's own child nodes in order. A separator is dropped
 * when there is no visible content before it, none after it, or the
 * thing before it was also a separator. Everything else is left
 * exactly as the board wrote it — this removes punctuation, never
 * content.
 *
 * Returns true if the strip has nothing visible left in it at all.
 */
function tidySeparators(strip) {
    /* Inside a strip that is not rendered at all, nothing "occupies"
       anything, so every separator would read as orphaned and the
       punctuation of a cell that may yet be shown again would be
       thrown away. A hidden strip is left exactly as it is. */
    if (!strip.getClientRects().length) return false;

    const nodes = Array.from(strip.childNodes);
    let pendingSeparators = [];
    let seenContent = false;
    let content = 0;

    for (const node of nodes) {
        if (node.nodeType === 3 && SEPARATOR_TEXT.test(node.textContent)) {
            // Held rather than kept: whether it belongs depends on
            // whether anything follows it.
            if (!seenContent) node.remove();
            else pendingSeparators.push(node);
            continue;
        }
        if (!occupies(node)) continue;
        // Something real: the first held separator earns its place —
        // normalised, in case it was carrying two — and any others
        // after it are duplicates.
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

/* Where the board writes those strips. Anything the script has already
   taken links out of is included: emptying a cell is exactly what
   leaves its punctuation stranded. */
const SEPARATOR_STRIPS = "#wrapcentre td.gensmall, #wrapcentre td.nav, #wrapcentre td.cat,"
    + " #wrapcentre p.searchbar, #wrapcentre span.gensmall, #wrapcentre .postbody + .gensmall";

/**
 * Runs after every module, for the same reason dropStrayBreaks() does:
 * a strip is only stranded once something has been moved out of it.
 *
 * A cell left with nothing but punctuation is hidden rather than
 * emptied, so the row it is in stops reserving a column for it — that
 * acre of nothing was a `td` at width 100% holding one character.
 */
function dropStraySeparators() {
    for (const strip of document.querySelectorAll(SEPARATOR_STRIPS)) {
        const empty = tidySeparators(strip);
        if (!empty) continue;
        if (strip.querySelector("form, input, select, textarea, img")) continue;
        if (strip.tagName === "TD") strip.style.display = "none";
    }
}

/**
 * The breadcrumb strip is a full-width table of its own. Once the top
 * bar carries the breadcrumb and the toolbars have taken the search
 * box, what is left is an empty 18px band.
 *
 * Runs after the other modules, so it can tell whether anything still
 * needs that strip.
 */
function tidyCrumbStrip() {
    if (!settings.get("navbar")) return;

    for (const crumbs of document.querySelectorAll("#wrapcentre p.breadcrumbs")) {
        const strip = crumbs.closest("table.tablebg");
        if (!strip) continue;
        // A control that is still in the strip but no longer drawn does
        // not earn it a place: the board writes its search box into the
        // strip at the top of the page and the one at the bottom, and
        // the second copy is hidden by then (see dedupeSearchBoxes).
        // Measured rather than assumed, so a control hidden by any
        // route counts the same.
        const controls = Array.from(strip.querySelectorAll("form, input, select, textarea"));
        if (controls.some((node) => node.getClientRects().length)) continue;
        strip.style.display = "none";
    }
}

/* ================= src/modules/lists.js ================= */
/* ------------------------------------------------------------------
   Forum and topic listings.

   Three jobs:
     - label the columns so the mobile stylesheet can restack them
     - turn [Info] / [Release] / [Problem] prefixes into a real,
       clickable taxonomy
     - filter 61,000 topics without a round trip
   ------------------------------------------------------------------ */

const COLUMN_NAMES = {
    forum: "title",
    topics: "topics",
    posts: "posts",
    "last post": "last",
    replies: "replies",
    author: "author",
    views: "views",
};

/**
 * Tag every cell with data-rr-col, derived from the <th> row so the
 * mapping survives a template that adds or drops a column.
 */
function labelColumns(table) {
    const headRow = table.querySelector("tr:has(th)") || table.querySelector("th")?.parentElement;
    if (!headRow) return;

    const columns = [];
    const heads = Array.from(headRow.querySelectorAll("th"));
    heads.forEach((th, index) => {
        const span = parseInt(th.getAttribute("colspan") || "1", 10);
        const text = th.textContent.trim().toLowerCase();

        /* A header with no words in it heads the read/unread marker. A
           search results page gives that column a header of its own,
           where a forum listing spans it together with the title. */
        if (!text) {
            columns.push("icon");
            for (let i = 1; i < span; i += 1) columns.push(null);
            return;
        }

        /* A header spanning more than one column heads the title,
           whatever the template calls it — "Forum" on the index,
           "Topics" in a listing. Read off the span rather than the
           word, because "Topics" is also the name of a counting column
           on the index: taking it at its word on a search results page
           labelled the topic titles a count, which took the marker
           gutter and the full-width title column off that page and put
           the number grouping through the titles.

           The columns before the last are the marker and the spacer
           the template keeps beside it. */
        if (span > 1) {
            for (let i = 1; i < span; i += 1) columns.push(index === 0 && i === 1 ? "icon" : null);
            columns.push("title");
            return;
        }

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

    /* The headings, by the same names as the cells under them.

       Without this a heading's alignment and its column's alignment
       were two decisions written in two places, and they disagreed:
       Author sat left in the heading and centred in every row of it. A
       column is one column. */
    let at = 0;
    for (const th of heads) {
        const span = parseInt(th.getAttribute("colspan") || "1", 10);
        // A heading that spans the status icon and the title labels the
        // title, which is the half of it with words in.
        const name = columns[span > 1 ? at + span - 1 : at];
        if (name) th.setAttribute("data-rr-col", name);
        at += span;
    }
}

/* The columns that hold a count rather than a word. */
const COUNT_COLUMNS = ["topics", "posts", "replies", "views"];

/** Regroup the digits in every counting column of one listing. */
function groupListingNumbers(table) {
    const selector = COUNT_COLUMNS.map((name) => 'td[data-rr-col="' + name + '"]').join(", ");
    for (const cell of table.querySelectorAll(selector)) groupNumbersIn(cell);
}

/* Where else on this board a long number is a quantity.

   Everything here is either a cell this script built and knows the
   contents of, or an element whose whole text is one number — never a
   sweep over the page, because an AppID, a post number and a Steam
   build id are all names that happen to be spelled in digits. */
function groupBoardNumbers() {
    /* Cells this script built and knows the contents of. The post
       header line is not here: it carries a join year beside its post
       count, and it groups the count itself where it is written. */
    for (const node of document.querySelectorAll(".rr-topicbar__count, .rr-online__summary")) {
        groupNumbersIn(node);
    }
    /* "Statistics :: Total posts 3097072 | Total topics 112579", and
       the activity line under it. The board wraps each figure in its
       own <strong>, which is exactly the shape this wants.

       A profile's own counters would suit it too, and they are not
       here: every profile and the member list are behind a login on
       this board, so nothing in the harness or on the open board can
       reach one. A selector no page can exercise is a selector nobody
       finds out about until it is wrong. */
    groupCountElements("#wrapcentre p.gensmall strong");
}

/* ---- Prefixes ---------------------------------------------------- */

function decorateTitle(entry, onTagClick) {
    const { prefix, kind, rest } = splitPrefix(entry.title);
    if (!prefix) return null;

    // The template renders the prefix as coloured spans inside the
    // link; drop them and rebuild it as a tag beside the link. With no
    // filter behind it — a listing too short to be worth filtering —
    // the same tag is drawn as a label rather than a button, because a
    // control that answers a click with nothing is worse than a word.
    const tag = onTagClick
        ? el("button.rr-tag", { type: "button", "data-tag": kind, title: "Show only " + prefix }, [prefix])
        : el("span.rr-tag", { "data-tag": kind }, [prefix]);
    if (onTagClick) {
        tag.addEventListener("click", (event) => {
            event.preventDefault();
            onTagClick(prefix.toLowerCase());
        });
    }

    // The prefix, and only the prefix: whatever else the title holds
    // stays where it is. See stripLeading().
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
        title: "Bookmark this topic",
        "aria-label": "Bookmark " + entry.title,
        "aria-pressed": isBookmarked(entry.id) ? "true" : "false",
    }, [icon("star", 13)]);

    star.addEventListener("click", (event) => {
        event.preventDefault();
        const now = toggleBookmark(entry.id, entry.title, entry.link.getAttribute("href"));
        star.setAttribute("aria-pressed", now ? "true" : "false");
        toast(now ? "Bookmarked" : "Bookmark removed");
    });

    // In the marker gutter rather than after the title.
    //
    // After the title it is one more inline box on the end of a line
    // that already wraps, so on a long topic name the star dropped to a
    // line of its own and took 20px of row with it. Beside the
    // read/unread dot it can never wrap, it lines up down the page, and
    // the two things it sits with are the other two facts about the row
    // rather than part of its name.
    const gutter = entry.row.querySelector('td[data-rr-col="icon"]');
    if (gutter) gutter.append(star);
    else entry.link.after(star);
}

/* ---- First unread --------------------------------------------- */

/**
 * Does this row have posts the reader has not seen?
 *
 * The board says so twice: the status image is one of the _unread set,
 * and its alt text reads "Unread posts". Either is enough, and both
 * survive the icon pass, which hides the image but keeps the node —
 * so this works whether or not the legacy imagery was replaced.
 */
function rowIsUnread(row) {
    if (row.querySelector('.rr-dot[data-state="unread"]')) return true;
    for (const img of row.querySelectorAll("img")) {
        if (/_unread/.test(img.getAttribute("src") || "")) return true;
        if (/^unread posts/i.test(img.getAttribute("alt") || "")) return true;
    }
    return false;
}

/**
 * Point a topic title at the first post the reader has not read.
 *
 * The board can already do this — it is what the little arrow beside
 * the row does — but the title, which is the thing anyone actually
 * clicks, drops you on page one of a thread you are on page nineteen
 * of. phpBB answers `view=unread` on viewtopic.php, so this is the
 * board's own route, moved on to the control people use.
 *
 * Only for rows that have unread posts, and only with an account:
 * unread state is per-account, and for a guest `view=unread` is a
 * redirect to the last post, which is not what the title should do.
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

/* Under this many rows the filter is furniture: a box that searches a
   list you can already see all of, a count that says "1 on this page"
   and a chip that filters one row down to one row. The board's own
   refine box still gets its place in the bar — that one is a round
   trip and works whatever the page holds. */
const FILTER_MIN_ROWS = 5;

/**
 * The board draws its refine box more than once.
 *
 * `#search-box` is written into the breadcrumb strip at the top of the
 * page *and* the one at the bottom — the same id, the same form, twice
 * — and a search results page adds a third copy of its own in the
 * results header, labelled "Search these results:" with a Go button
 * rather than a Search button. Three boxes, one job, two different
 * button captions.
 *
 * One survives. The duplicates are hidden rather than removed, because
 * the first `#search-box` is the one CS.RIN.RU Enhanced looks for and
 * that is the copy kept.
 */
function dedupeSearchBoxes() {
    const boxes = Array.from(document.querySelectorAll('[id="search-box"]'));
    for (const box of boxes.slice(1)) {
        box.setAttribute("data-rr-dupe", "");
        box.style.display = "none";
    }

    // The results header's own copy, which is a bare cell rather than a
    // named block. Only dropped when one of the boxes above is left to
    // take its place; the cell beside it carries "Search term used:"
    // and stays either way.
    if (!boxes.length) return;
    for (const field of document.querySelectorAll('input[name="add_keywords"]')) {
        if (field.closest('[id="search-box"]')) continue;
        const cell = field.closest("td");
        if (!cell) continue;
        cell.setAttribute("data-rr-dupe", "");
        cell.style.display = "none";
    }
}

/**
 * `rich` builds the whole bar: filter box, prefix chips, count. Without
 * it the bar is only a home for the board's own refine box — see
 * FILTER_MIN_ROWS.
 */
function buildToolbar(entries, prefixes, rich) {
    const state = { text: "", tag: null };

    const count = el("span.rr-toolbar__count");

    const apply = () => {
        let shown = 0;
        const needle = state.text.toLowerCase();
        for (const entry of entries) {
            const matchesText = !needle || entry.title.toLowerCase().includes(needle);
            const matchesTag = !state.tag || entry.row.getAttribute("data-rr-prefix") === state.tag;
            const visible = matchesText && matchesTag;
            entry.row.toggleAttribute("data-rr-hidden", !visible);
            if (visible) shown += 1;
        }
        count.textContent = shown === entries.length
            ? entries.length + " on this page"
            : shown + " of " + entries.length + " on this page";
    };

    const input = el("input", {
        type: "search",
        placeholder: "Filter this page by title",
        "aria-label": "Filter topics on this page",
    });
    input.addEventListener("input", debounce(() => { state.text = input.value.trim(); apply(); }, 90));
    input.addEventListener("keydown", (event) => {
        if (event.key === "Escape") { input.value = ""; state.text = ""; apply(); }
    });

    const tagRow = el("div.rr-toolbar__tags");
    const setTag = (tag) => {
        state.tag = state.tag === tag ? null : tag;
        for (const button of tagRow.children) {
            button.setAttribute("aria-pressed", button.dataset.value === state.tag ? "true" : "false");
        }
        apply();
    };
    for (const [name, kind] of prefixes) {
        const button = el("button.rr-tag", {
            type: "button",
            "data-tag": kind,
            "aria-pressed": "false",
            title: "Show only " + name,
        }, [name]);
        button.dataset.value = name.toLowerCase();
        button.addEventListener("click", () => setTag(name.toLowerCase()));
        tagRow.append(button);
    }

    const bar = el("div.rr-toolbar", { role: "search" });
    if (rich) {
        bar.append(el("div.rr-toolbar__filter", {}, [icon("filter"), input]));
        // One chip filters every row down to every row. Chips are worth
        // their line only once there is a choice to make between them.
        if (prefixes.length > 1) bar.append(tagRow);
        bar.append(count);
    }

    // The board's own "Search this forum" box sits in a strip of its
    // own above the listing. It belongs next to the filter, so it moves
    // here rather than being duplicated.
    const boardSearch = document.querySelector("#search-box form, #topic-search");
    if (boardSearch) {
        const strip = boardSearch.closest("td.row5") || boardSearch.closest("table");
        bar.append(el("div.rr-toolbar__board", {}, [adoptBoardSearch(boardSearch)]));
        if (strip && !strip.textContent.trim()) {
            const holder = strip.closest("table");
            if (holder) holder.style.display = "none";
        }
    }

    apply();
    return { bar, setTag, empty: !bar.children.length };
}

/* ---- Forum action bar --------------------------------------------- */

/**
 * The listing header is four separate strips: a "Post new topic" image
 * button, "Page 1 of 615", "[ 61469 topics ]" and the numbered links.
 * They become one bar, matching the topic view.
 */
function buildForumBar() {
    const heading = document.querySelector("#wrapcentre > h2, #pageheader h2");
    if (!heading || document.querySelector(".rr-topicbar")) return null;

    const bar = el("div.rr-topicbar");
    const info = pagination();

    const post = document.querySelector('a[href*="mode=post"]');
    if (post) {
        bar.append(el("a.rr-btn", { href: post.getAttribute("href"), "data-variant": "primary" }, ["New topic"]));
        const strip = post.closest("table");
        if (strip) strip.style.display = "none";
    }

    if (info.total && info.total > 1) {
        bar.append(buildPagerGroup(info));
    }

    // "[ 61469 topics ]" is worth keeping, but not on its own line.
    for (const cell of document.querySelectorAll("#wrapcentre td.gensmall, #wrapcentre span.gensmall")) {
        const match = cell.textContent.match(/\[\s*([\d\s]+)\s*(topics|posts)\s*\]/i);
        if (!match) continue;
        bar.append(el("span.rr-topicbar__count", {}, [match[1].trim() + " " + match[2].toLowerCase()]));
        cell.style.display = "none";
        break;
    }

    heading.after(bar);
    // The board's own "Page 1 of 615" and "[ 61469 topics ]" strips,
    // which the bar now carries. The topic page had this pass and the
    // listing did not, and the sweep found the band on every forum.
    tidyBoardPagerStrip(bar, bar);

    // The forum name led a line of its own directly above this bar,
    // repeating what the breadcrumb says two lines further up and
    // costing a band of the screen to do it. Inside the bar it labels
    // the controls that act on it, and the band is gone. The node is
    // moved, so its heading level and any link inside it survive.
    heading.classList.add("rr-topicbar__title");
    bar.prepend(heading);

    return bar;
}

/* ---- Last post ----------------------------------------------------- */

/* "Tuesday, 01 Sep 2026, 18:10" — the weekday is four words of a date
   nobody reads a weekday off. Kept on the title, dropped from the line
   so the date and the poster fit beside each other. */
const WEEKDAY_RE = /^\s*(Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day,\s*/i;

/**
 * Fold the Last post cell's two lines into one.
 *
 * The template prints the date in one <p> and the poster in another,
 * and that stack is the tallest thing in a listing row: it set the
 * height of all 108 rows on a page. Joined with a separator the same
 * two facts take one line, and the row loses a third of its height.
 *
 * Nodes are moved rather than rewritten, so the poster's link, its role
 * colour and the jump-to-post arrow all come across intact. If the pair
 * is too wide for the column it simply wraps back to two lines, which
 * is where it started.
 */
function tightenLastPost(cell) {
    const lines = Array.from(cell.children).filter((node) => node.tagName === "P");
    if (lines.length < 2) return;

    const first = lines[0];
    const full = cell.textContent.replace(/\s+/g, " ").trim();

    for (const node of first.childNodes) {
        if (node.nodeType === 3 && WEEKDAY_RE.test(node.textContent)) {
            node.textContent = node.textContent.replace(WEEKDAY_RE, "");
        }
    }

    for (const rest of lines.slice(1)) {
        if (!rest.textContent.trim() && !rest.querySelector("a, img")) { rest.remove(); continue; }
        first.append(el("span.rr-sep", { "aria-hidden": "true" }, ["·"]));
        while (rest.firstChild) first.append(rest.firstChild);
        rest.remove();
    }

    first.classList.add("rr-lastpost");
    first.setAttribute("title", full);
}

/* ---- Announcements ------------------------------------------------ */

function collapseAnnouncements(entries) {
    const pinned = entries.filter((entry) => entry.row.getAttribute("data-rr-prefix") === "important");
    if (pinned.length < 3) return;

    let open = false;
    const toggle = el("button.rr-btn", { type: "button", "data-variant": "quiet" }, [
        icon("chevronD"),
        pinned.length + " pinned announcements",
    ]);
    const setState = () => {
        for (const entry of pinned) entry.row.style.display = open ? "" : "none";
        toggle.firstChild.style.transform = open ? "rotate(180deg)" : "";
    };
    toggle.addEventListener("click", () => { open = !open; setState(); });
    setState();

    const firstRow = pinned[0].row;
    const holder = el("tr", {}, [
        el("td", { colspan: String(firstRow.children.length), style: { padding: "6px 12px" } }, [toggle]),
    ]);
    firstRow.before(holder);
}

/* ---- Entry point --------------------------------------------------- */

function initLists() {
    for (const table of document.querySelectorAll("table.tablebg")) {
        labelColumns(table);
        // A listing, as opposed to a post or a strip of chrome. The
        // stylesheet needs to know which is which: row1/row2 alternate
        // down a listing and wrap whole posts in a topic, so the same
        // two classes mean opposite things on the two kinds of page.
        if (table.querySelector("a.topictitle, a.forumlink")) {
            table.setAttribute("data-rr-list", "");
            groupListingNumbers(table);
        }
    }

    dedupeSearchBoxes();

    if (!PAGE.isForum && !PAGE.isIndex && !PAGE.isSearch) return;

    // Before the topic rows are looked for, not after. The index has no
    // topic rows at all — it lists forums — so everything below the
    // early return never ran there, and the Last post column read on
    // one line in a forum listing and on two on the page in front of
    // it. It is the same column.
    if (settings.get("tightRows")) {
        for (const cell of document.querySelectorAll('td[data-rr-col="last"]')) tightenLastPost(cell);
    }

    const entries = topicRows();
    if (!entries.length) return;

    if (PAGE.isForum || PAGE.isSearch) buildForumBar();

    const visited = settings.get("hideVisited") ? visitedSet() : null;
    const seenPrefixes = new Map();
    const unreadRouting = settings.get("unreadFromList") && !PAGE.isSearch && isLoggedIn();

    // A prefix in a title is a button that drives the filter chips. On
    // a page with no chips there is nothing for it to drive, so it is
    // drawn as a label instead of a control that does nothing.
    const filtering = settings.get("listFilter") && entries.length >= FILTER_MIN_ROWS;

    let setTag = () => {};
    for (const entry of entries) {
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

        // The action bar and the filter bar carry one job between them
        // and sat as two separate cards with a gap, one above the other:
        // 123px of chrome before the first topic on the page. The filter
        // becomes the action bar's second row instead. They are not
        // siblings in the template, so this cannot be done in CSS.
        //
        // A bar with nothing in it is not placed at all: on a short
        // listing with no board search box there is no filter left to
        // draw, and an empty card is worse than no card.
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

    if (settings.get("hideAnnouncements")) collapseAnnouncements(entries);
}

/* ================= src/modules/boardindex.js ================= */
/* ------------------------------------------------------------------
   The board index.

   Two things dominate it: a list of every one of the 500-odd people
   currently online, and a login form. Both are folded down to what a
   reader actually wants at a glance, with the full version one click
   away.
   ------------------------------------------------------------------ */

/** "In total there are 513 users online :: 326 registered, ..." */
function onlineSummary(text) {
    const total = text.match(/there are\s+(\d+)\s+users? online/i);
    const registered = text.match(/(\d+)\s+registered/i);
    const guests = text.match(/(\d+)\s+guests?/i);
    const hidden = text.match(/(\d+)\s+hidden/i);

    const parts = [];
    if (total) parts.push(total[1] + " online");
    if (registered) parts.push(registered[1] + " registered");
    if (hidden) parts.push(hidden[1] + " hidden");
    if (guests) parts.push(guests[1] + " guests");
    return parts.join(" · ");
}

/**
 * The cell holding the list of everyone online.
 *
 * Found by what it contains rather than by the heading above it. The
 * heading used to be the anchor — a cell whose text is exactly "Who is
 * online" — and this board is bilingual: on its Russian half that
 * heading is "Кто сейчас на конференции" and the whole feature silently
 * did nothing. A cell holding several hundred links to member profiles
 * is the same cell in either language.
 */
function whoIsOnlineCell() {
    let best = null;
    let most = 0;
    for (const cell of document.querySelectorAll("#wrapcentre td.row1, #wrapcentre td.row2")) {
        // Not the forum listing: a row there has one or two profile
        // links in it, never thirty.
        if (cell.querySelector("a.forumlink, a.topictitle")) continue;
        const count = cell.querySelectorAll("a[href*='viewprofile']").length;
        if (count > most) { most = count; best = cell; }
    }
    return most >= 30 ? best : null;      // a short list is fine as it is
}

function collapseWhoIsOnline() {
    const body = whoIsOnlineCell();
    if (!body) return;

    const names = body.querySelectorAll("a[href*='viewprofile']");
    const summary = onlineSummary(body.textContent);

    // Moved, not rebuilt: every name keeps its link, its role colour
    // and anything another script attached to it.
    const holder = el("div");
    while (body.firstChild) holder.append(body.firstChild);

    let open = store.get("whoIsOnlineOpen", false);
    holder.hidden = !open;

    const label = () => (open ? "Hide the list" : "Show all " + names.length + " names");
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

/**
 * The index prints the same search box twice, above and below the forum
 * list, each in a full-width strip of its own. With search in the top
 * bar both are redundant; without it, the first one stays.
 */
function dropDuplicateSearch() {
    const boxes = Array.from(document.querySelectorAll("#wrapcentre #search-box"));
    const keepFirst = !settings.get("navbar");

    boxes.forEach((box, index) => {
        if (keepFirst && index === 0) return;
        const strip = box.closest("table.tablebg");
        if (strip && !strip.querySelector("a.forumlink, a.topictitle")) strip.style.display = "none";
    });
}

/* ---- Category collapse ------------------------------------------- */

/**
 * The board's own "collapse this category" control.
 *
 * It is an `<input type="button">` carrying `value=" "` — a single
 * space — and drawn entirely by a 12x12 background image the board
 * injects in a <style> block. Two things follow, and neither was being
 * handled.
 *
 * It has no accessible name. `value` is what names an input button,
 * and a space is not a name: a screen reader reaches a button and can
 * say nothing about it, on the one control that folds a whole category
 * of the board away. The heading beside it is the name, so that is what
 * goes on it.
 *
 * And it cannot be redrawn from the stylesheet alone. An <input> is a
 * replaced element: `::before` and `::after` generate nothing on it, so
 * the chevron an earlier version of this drew that way rendered as an
 * empty box with a border — worse than the GIF it replaced, and on the
 * light theme invisible. The glyph therefore has to be the value, which
 * is where the board already puts one.
 *
 * The board's own handler is untouched: the click is still its click,
 * and `flipf()` reads the class rather than the value, so writing one
 * cannot confuse it.
 */
function tidyCategoryToggles() {
    for (const toggle of document.querySelectorAll("#wrapcentre .ccclose, #wrapcentre .ccopen")) {
        if (toggle.hasAttribute("data-rr-cc")) continue;
        toggle.setAttribute("data-rr-cc", "");

        // The heading is in a sibling cell — the control gets a cell to
        // itself — so the row is what has to be read.
        const heading = toggle.closest("tr")?.textContent.replace(/\s+/g, " ").trim().slice(0, 60);

        const sync = () => {
            const collapsed = toggle.classList.contains("ccopen");
            const name = (collapsed ? "Show " : "Hide ") + (heading || "this category");
            toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
            toggle.setAttribute("title", name);
            toggle.setAttribute("aria-label", name);
            // Decorative: aria-label above is what is read out.
            const glyph = collapsed ? "\u25BE" : "\u25B4";
            if (toggle.tagName === "INPUT") toggle.value = glyph;
            else toggle.textContent = glyph;
        };

        // An <input type="button"> is already a button and already a
        // tab stop. A <div> with an onclick, which other phpBB styles
        // use for the same control, is neither — so both are covered
        // rather than assuming which one this board ships.
        if (toggle.tagName !== "INPUT" && toggle.tagName !== "BUTTON") {
            toggle.setAttribute("role", "button");
            toggle.setAttribute("tabindex", "0");
            toggle.addEventListener("keydown", (event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                toggle.click();
            });
        }

        /* The box, set inline rather than from the stylesheet.

           The board sizes this control from a <style> block it writes
           into the body, and the generic input[type=button] styling in
           forum.css also matches it; between them a class rule loses
           the padding, the border and — measurably — the font size,
           which resolved to 0px and made the glyph invisible whatever
           it was. An inline style is what the icon pass already uses
           to take an imageset GIF out of the way, and it is the one
           thing neither of those can outrank. Colour and hover stay in
           the stylesheet, where they can follow the theme. */
        Object.assign(toggle.style, {
            width: "24px",
            height: "24px",
            minWidth: "0",
            padding: "0",
            fontSize: "12px",
            lineHeight: "1",
            backgroundImage: "none",
        });

        sync();
        // The board's handler swaps the class rather than telling
        // anyone, so the state is read back off it afterwards.
        toggle.addEventListener("click", () => setTimeout(sync, 0));
    }
}

function initBoardIndex() {
    if (!PAGE.isIndex) return;
    if (settings.get("foldWhoIsOnline")) collapseWhoIsOnline();
    dropDuplicateSearch();
    tidyCategoryToggles();
}

/* ================= src/modules/topic.js ================= */
/* ------------------------------------------------------------------
   Reading a topic.

   A game thread opens with a Steam dump: header art, details, the full
   store description, system requirements and screenshots. That is
   thousands of words before the first reply that anyone came for.

   The card below keeps the details, folds the marketing copy, and puts
   the lookups people actually leave for (SteamDB, PCGamingWiki) one
   click away instead of one search away.
   ------------------------------------------------------------------ */

const REPLY_LINK = 'a[href*="mode=reply"], a[href*="mode=post"]';

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

    if (info.appId && settings.get("externalLinks")) {
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

    // The store link is the one thing guests cannot see; say so rather
    // than showing an empty row.
    const store = info.fields["Store Page"];
    if (store && /please login/i.test(store) && !info.appId) {
        bodyCol.append(el("p.rr-field__desc", {}, ["Log in to see the store link in the post below."]));
    }

    card.append(bodyCol);
    body.before(card);

    // The header art is now in the card; leaving the original in the
    // post shows the same image twice, one above the other. Hidden
    // rather than removed — it is a node somebody else's post put
    // there, another script may be looking for it, and nothing here
    // needs it gone, only out of the way.
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

/**
 * Rewrite the topic heading the way listing rows are rewritten, so the
 * prefix reads as the same tag in both places.
 */
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
    // Kept for anything that needs the bare title afterwards: reading it
    // back off the heading would pick the tag up again.
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

/**
 * One action bar for the topic.
 *
 * The template scatters these across four strips: a search box in its
 * own full-width table, a reply image button, "Page 1 of 19", and the
 * numbered page links. They belong on one line.
 */
/* One card, two rows, and the rule is written down rather than left to
   whatever fits.

   What was here was a single wrapping flex row holding, in the order
   the template happened to print them: a filled Reply button, the
   words "Page 1 of 1", four bare links, an outlined button with the
   same weight as Reply, and a search box. Three kinds of control on
   one line with nothing saying which mattered, one flexible spacer
   opening an arbitrary gap in the middle of the links, and a layout
   that reacted to how many controls a topic happened to have: on a one
   page topic the search sat inline, on a thirty-three page one the
   pager pushed it on to a line of its own. Same interface, two shapes,
   for a reason no reader could name.

   The rule now:

     Row 1 - this topic. What you do here (Reply), what you can do to
             what is on screen (open the spoilers, jump to your first
             unread), and where in the topic you are (the pager).
     Row 2 - everywhere else. The topic before and after this one, the
             print view, and the box that searches inside it.

   Both rows exist on every topic, whatever its page count, so the bar
   is the same shape on a one page thread and a thirty-three page one.
   A row nothing landed in is not drawn - but nothing moves between
   rows to make that happen. */
function topicBarRow(name) {
    return el("div.rr-topicbar__row", { "data-rr-row": name });
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
            /mode=post/.test(reply.getAttribute("href")) ? "New topic" : "Reply",
        ]);
        here.append(button);
        /* The *cell* the reply button is in, not the table it is in.
           subsilver2 puts the reply button, "Page 16 of 16", the post
           count and the member's own topic actions in one row of one
           table, so hiding the table to get rid of the duplicated
           button took Unsubscribe topic, Bookmark topic and E-mail
           friend with it — silently, and only for members, which is
           why nothing here had noticed. */
        const cell = reply.closest("td");
        if (cell) cell.style.display = "none";
        else {
            const strip = reply.closest("table");
            if (strip) strip.style.display = "none";
        }
    }

    /* Secondary, and drawn as secondary. "Open all N spoilers" was an
       outlined button of exactly the same size and weight as Reply,
       which is the loudest thing this bar can say about a control that
       reveals text the page has already loaded. */
    if (settings.get("spoilerAll")) {
        const buttons = spoilerButtons();
        if (buttons.length >= 2) {
            const control = el("button.rr-btn", { type: "button", "data-variant": "quiet" }, [
                icon("chevronD", 13),
                "Open all " + buttons.length + " spoilers",
            ]);
            control.addEventListener("click", () => {
                for (const button of spoilerButtons()) button.click();
                control.remove();
            });
            here.append(control);
        }
    }

    // people.js drops "First unread" in here, in front of this.
    here.append(el("span.rr-topicbar__spacer"));

    /* Where in the topic you are. On a topic with one page that is not
       a fact worth a control, a label, or the space either takes:
       "Page 1 of 1" answered a question nobody with the whole thing in
       front of them was asking. */
    if (info.total && info.total > 1) {
        here.append(settings.get("quickPager")
            ? buildPagerGroup(info)
            : el("span.rr-topicbar__count", {}, ["Page " + info.current + " of " + info.total]));
    }

    adoptTopicNav(away);
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
    tidyBoardPagerStrip(bar, here);

    // The numbered strip under the title says the same thing as the
    // pager, less usefully.
    for (const strip of header.querySelectorAll("p.gensmall, span.gensmall")) {
        if (/Go to page/.test(strip.textContent)) strip.style.display = "none";
    }
}

/* What the board says about where you are, once this bar says it too.

   phpBB draws a strip above and below the posts carrying "Page 16 of
   16" and "[ 239 posts ]". The action bar now carries the first as a
   pager you can type into, so the board's copies are a band of the
   screen each, twice per page, saying something already on screen —
   and on a topic that fits on one page, "Page 1 of 1" twice.

   Cell by cell rather than strip by strip, because the member's own
   topic actions share that row and they are not a duplicate of
   anything. The post count is worth keeping, so the first one found
   moves into the bar; the rest go with the page counters. */
const PAGE_OF_RE = /^\s*Page\s+\d+\s+of\s+\d+\s*$/;
const POST_COUNT_RE = /^\s*\[\s*([\d\s]+)\s+(posts?|topics?)\s*\]\s*$/i;

function tidyBoardPagerStrip(bar, row) {
    let counted = false;

    for (const cell of document.querySelectorAll("#wrapcentre td.nav, #wrapcentre td.gensmall")) {
        if (cell.querySelector("a[href], form, input, select")) continue;
        const text = cell.textContent.replace(/\s+/g, " ");

        if (PAGE_OF_RE.test(text)) { cell.style.display = "none"; continue; }

        const count = text.match(POST_COUNT_RE);
        if (!count) continue;
        if (!counted) {
            counted = true;
            row.append(el("span.rr-topicbar__count", {}, [
                count[1].replace(/\s+/g, "") + " " + count[2].toLowerCase(),
            ]));
        }
        cell.style.display = "none";
    }

    // A row of a board strip with every cell hidden is still a row.
    for (const strip of document.querySelectorAll("#wrapcentre table.tablebg")) {
        if (strip.contains(bar)) continue;
        const cells = Array.from(strip.querySelectorAll("td"));
        if (!cells.length) continue;
        const alive = cells.some((cell) => cell.style.display !== "none"
            && (cell.textContent.trim() || cell.querySelector("img, a, input, form")));
        if (!alive) strip.style.display = "none";
    }
}

/* The board's forum-rules box, which subsilver2 writes with
   `style="margin-bottom: 2px"` typed into the tag. An inline style
   beats every rule in this stylesheet without a fight, so the box sat
   2px above the topic title: two blocks with nothing to do with each
   other, touching. Block spacing is a token here; this hands the box
   back to it. */
function spaceForumRules() {
    for (const cell of document.querySelectorAll("#wrapcentre td.row3")) {
        const box = cell.closest("table.tablebg");
        if (box && box.style.marginBottom) box.style.marginBottom = "";
    }
}

/**
 * Print view, Previous topic and Next topic.
 *
 * The template gives those three links a full-width bar of their own,
 * 40px tall and empty but for a word at each end. They are ordinary
 * topic actions, so they join the other ones; the strip they came from
 * is then empty and goes.
 */
function adoptTopicNav(bar) {
    const strip = Array.from(document.querySelectorAll("#wrapcentre table.tablebg"))
        .find((table) => table.querySelector('td.cat a[href*="view=print"], td.cat a[href*="view=next"]'));
    if (!strip) return;

    const wanted = [
        { match: /view=previous/, label: "Previous topic" },
        { match: /view=next/, label: "Next topic" },
        // The one of the three that really does leave the page.
        { match: /view=print/, label: "Print view", glyph: "external" },
    ];

    for (const { match, label, glyph } of wanted) {
        const link = Array.from(strip.querySelectorAll("a[href]"))
            .find((a) => match.test(a.getAttribute("href") || ""));
        if (!link) continue;
        link.classList.add("rr-btn", "rr-topicnav");
        link.setAttribute("data-variant", "quiet");
        link.setAttribute("title", label);
        link.textContent = "";
        link.append(document.createTextNode(label));
        if (glyph) link.append(icon(glyph, 12));
        bar.append(link);
    }

    if (!strip.querySelector("a[href], form, input")) strip.style.display = "none";
}

function buildPagerGroup(info) {
    const jump = el("input.rr-pager__input", {
        type: "number",
        min: "1",
        max: String(info.total),
        value: String(info.current),
        "aria-label": "Go to page",
    });
    const go = () => {
        const target = clamp(parseInt(jump.value, 10) || 1, 1, info.total);
        const href = pageHref(target);
        if (href) location.href = href;
        else toast("Could not work out that page");
    };
    jump.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); go(); } });
    jump.addEventListener("change", go);

    /* "Next" and "Last" sat three controls away from "Next topic" and
       "Previous topic" in the same weight and the same colour: two
       different journeys wearing one costume. Two things separate them
       now and either would do on its own — they are in different rows
       of the bar, and these say what they move. A page.

       The two ends are the arrows alone: they are the least used of
       the four and their names are on them for anything that reads
       names rather than pictures. */
    const step = (href, label, glyph, words) => el("a.rr-btn.rr-pager__step", {
        href,
        "data-variant": "quiet",
        title: label,
        "aria-label": label,
    }, glyph === "pageFirst" || glyph === "chevronL"
        ? [icon(glyph, 13), words ? label : null]
        : [words ? label : null, icon(glyph, 13)]);

    return el("div.rr-pager", { role: "group", "aria-label": "Pages of this topic" }, [
        info.hasPrevious ? step(info.first, "First page", "pageFirst", false) : null,
        info.hasPrevious ? step(info.previous, "Previous page", "chevronL", true) : null,
        el("span.rr-pager__label", {}, ["Page"]),
        jump,
        el("span.rr-pager__label", {}, ["of " + info.total]),
        info.hasNext ? step(info.next, "Next page", "chevron", true) : null,
        info.hasNext ? step(info.last, "Last page", "pageLast", false) : null,
    ]);
}

/* ---- What a rank line says, and in which language ------------------ */

/* This board prints both halves of a user's rank on every page,
   whichever language the page is in: "Super flooder Почетный
   графоман", "I live here Три раза сломал клаву :)", and — for anyone
   who has never been given one — "Beginner Без звания", which is
   Russian for "no rank". So an English forum shows a Russian phrase
   under a name, and for most posters the phrase means the field is
   empty.
   
   Where a rank carries both languages, the page's own language decides
   which half to show. Where it carries only one it is left alone: a
   rank that is Latin-only is not a translation of anything, and
   dropping it because the page is Russian would empty the line under
   every administrator on the board.

   The original stays on the title attribute, so nothing is actually
   taken away. */
const CYRILLIC_RE = /[\u0400-\u04FF]/;

function localiseRank(text) {
    const clean = text.replace(/\s+/g, " ").trim();
    if (!CYRILLIC_RE.test(clean) || currentLanguage() !== "en") return clean;

    const kept = clean.split(" ").filter((word) => !CYRILLIC_RE.test(word));
    /* Punctuation that belonged to the half that just went. "I live
       here Три раза сломал клаву :)" is one rank in two languages with
       the smiley on the end of the Russian half, and dropping the
       Russian words alone leaves "I live here :)" — the tail of a
       sentence that is no longer there. A trailing run with no letters
       in it goes with them. A rank that is *only* punctuation, like
       "Super-Donor <3", never reaches this: it has no Cyrillic in it
       and was returned untouched three lines ago. */
    while (kept.length && !/[A-Za-z0-9]/.test(kept[kept.length - 1])) kept.pop();
    return kept.join(" ").replace(/[\s|·,;:/–—-]+$/, "").trim();
}

/* "Joined: Thursday, 13 Feb 2020, 13:07 · Posts: 2180" does not fit
   the line it is on, and clipping it landed the ellipsis inside the
   time — "13 Feb 2020, 13:…" — which reads as a broken value rather
   than as a shortened sentence.

   The rest of the interface already shortens dates the same way: the
   weekday goes, the full thing stays on hover. A join *date* has no
   use for a clock either. Shortened, the line fits, so nothing is
   clipped at all — and the width cap that did the clipping is gone
   with it. */
const JOIN_TIME_RE = /(\d{4}),\s*\d{1,2}:\d{2}(?::\d{2})?/g;

function shortenPostMeta(text) {
    return text
        .replace(/\b(Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day,\s*/gi, "")
        .replace(JOIN_TIME_RE, "$1")
        /* The post count, and only the post count. This line is
           "Joined: 15 Nov 2005 · Posts: 12575", and a sweep over it
           that grouped from four digits would turn the year into
           "2 005". The count is named right there in the text; the
           year is not. */
        .replace(/(Posts:\s*)(\d+)/i, (all, label, count) => label + groupDigits(count))
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Rebuild a post as a header strip over a full-width message.
 *
 * The template puts the author in a 150px column beside the message,
 * so a two-line reply still occupies the height of an avatar, a rank,
 * a join date and a post count. Moving that into one line above the
 * message recovers the space and reads the way every forum written
 * this century reads.
 *
 * Nothing is deleted: the original cell is hidden, and the nodes are
 * moved rather than copied, so links and handlers survive.
 */
function modernisePost(post) {
    const cell = post.table.querySelector("td.profile");
    if (!cell || cell.classList.contains("rr-profile")) return;
    cell.classList.add("rr-profile");

    const details = Array.from(cell.querySelectorAll(".postdetails"));
    const avatar = cell.querySelector('img[src*="avatar"], img[src*="file.php"]');

    // The first detail block is the rank line ("Administrator",
    // "I live here"); the ones after it are Joined and Posts.
    const rank = details.find((node) => !/joined|posts/i.test(node.textContent));
    const meta = details.filter((node) => /joined|posts/i.test(node.textContent));

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
        // The template runs "Joined: ...Posts: 2180" together in one
        // block often enough that a separator has to be put back.
        const summary = meta
            .map((node) => node.textContent.replace(/\s+/g, " ").trim())
            .join(" · ")
            .replace(/(\S)\s*(Posts:)/g, "$1 · $2");
        head.append(el("span.rr-posthead__meta", { title: summary }, [shortenPostMeta(summary)]));
    }

    head.append(el("span.rr-posthead__spacer"));

    // The posted date lives in its own row above the message; on one
    // line with the author it stops being a row of its own.
    if (post.headCell) {
        const posted = Array.from(post.headCell.querySelectorAll("b"))
            .find((node) => /^Posted:/i.test(node.textContent));
        if (posted && posted.nextSibling) {
            const when = posted.nextSibling.textContent.trim();
            if (when) {
                head.append(el("time.rr-posthead__date", {}, [when]));
                posted.parentElement.style.display = "none";
            }
        }
    }

    post.body.before(head);
    post.head = head;

    // The template's own header row held the author name, the subject
    // and the date. All three are in the new header now, so the row is
    // an empty band with 12px of padding.
    const originalRow = post.anchor.closest("tr");
    if (originalRow && !originalRow.querySelector(".postbody")) originalRow.style.display = "none";

    hideEmptyPostRows(post.table);
}

/**
 * subsilver2 leaves a row for the edit / delete controls and another
 * for the "Top" link under every post. For a reader without those
 * permissions they are 90px of nothing.
 */
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

    const holder = el("div", { hidden: true });
    for (const node of folded) holder.append(node);

    const label = fromTitle ? "the original post" : "the full Steam description";
    let open = false;
    const toggle = el("button.rr-btn", { type: "button", "data-variant": "quiet" }, [
        icon("chevronD"),
        "Show " + label,
    ]);
    toggle.addEventListener("click", () => {
        open = !open;
        holder.hidden = !open;
        toggle.lastChild.textContent = (open ? "Hide " : "Show ") + label;
        toggle.firstChild.style.transform = open ? "rotate(180deg)" : "";
    });

    body.append(toggle, holder);
}

/* ---- Per-post tools ---------------------------------------------- */

function postUrl(postId) {
    return location.origin + location.pathname.replace(/[^/]*$/, "") +
        "viewtopic.php?p=" + postId + "#p" + postId;
}

/* What the board's per-post controls are, read off where they go.

   icons.js names each one from its image's alt text, which works until
   the board ships an image without one — and then the control is a
   bare 12px silhouette on the end of a row of labelled buttons, which
   is what was reported. The destination is the one thing that is
   always there, so it is what the fallback reads. */
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

/** Everything in a post's control row, named the way the top bar's
    icons are: instantly, rather than after a second of hovering. */
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

    /* One control per destination.

       The board draws its own "Reply with quote" under every post and
       this row added another, as an icon, pointing at the same URL:
       two controls, one address, side by side, one of them labelled
       and one of them not. Whichever arrives second is the one that
       goes.

       Compared by destination with the session id taken out, because
       phpBB stamps a different one into every link on the page. */
    const destinations = new Set();
    const wanted = (node) => {
        const href = (node.getAttribute("href") || "").replace(/[?&]sid=[a-f0-9]+/, "");
        if (!href) return true;
        if (destinations.has(href)) return false;
        destinations.add(href);
        return true;
    };

    /* The board's own permalink to this post is a 12px target icon in
       an anchor, which icons.js labels from its alt text — and its alt
       text is the single word "Post". Sat in a row of controls it
       reads as "post something", it is the only text button among the
       icons at the head of the row, and it goes to precisely where the
       copy-link button beside it copies. One address, two controls,
       one of them named after a verb it does not do.

       So the two become one: the post number, which was a decorative
       span, becomes the link, and the board's control is left in place
       and hidden. */
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
        el("button.rr-icon-btn", { type: "button" }, [icon("link")]), "Copy link to this post");
    linkButton.addEventListener("click", () => copyText(postUrl(post.id), "Post link copied"));
    tools.append(linkButton);

    const quoteButton = labelled(
        el("button.rr-icon-btn", { type: "button" }, [icon("quote")]), "Copy as a quote");
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

    // Controls the board drew as a bare GIF, relabelled by icons.js.
    // They sit in a footer strip of their own under every post; here
    // they join the other per-post actions, which is one place to look
    // instead of two and one row less per post.
    for (const control of post.table.querySelectorAll("a.rr-ctl")) {
        if (control === permalink) continue;
        const row = control.closest("tr");
        if (!wanted(control)) { control.style.display = "none"; continue; }
        tools.append(nameControl(control));
        if (row && !row.textContent.trim() && !row.querySelector("a[href], input")) {
            row.style.display = "none";
        }
    }

    // Anything else the board drew as a bare image in this post's
    // control rows and icons.js could not name from its alt text. A
    // silhouette with nothing beside it is not a control anybody can
    // use, and one of them was sitting on the end of every post.
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

/* ---- Signatures --------------------------------------------------- */

function collapseSignature(post) {
    if (!post.signature) return;

    // Signatures are one text node broken by <br>, so counting newlines
    // finds nothing; the line breaks and the length are the signal.
    const breaks = post.signature.querySelectorAll("br").length;
    const length = post.signature.textContent.trim().length;
    if (breaks <= 4 && length <= 220) return;

    post.signature.classList.add("rr-signature");
    post.signature.setAttribute("data-rr-sig", "collapsed");

    // Drop the row of underscores the board uses as a divider; the
    // stylesheet draws a rule instead.
    for (const node of Array.from(post.signature.childNodes).slice(0, 3)) {
        if (node.nodeType === 3 && /^\s*_{5,}\s*$/.test(node.textContent)) node.remove();
        else if (node.nodeType === 1 && node.tagName === "BR" && !post.signature.textContent.trim()) node.remove();
    }
    const toggle = el("button.rr-sig-toggle", { type: "button" }, ["Show signature"]);
    toggle.addEventListener("click", () => {
        const collapsed = post.signature.getAttribute("data-rr-sig") === "collapsed";
        if (collapsed) post.signature.removeAttribute("data-rr-sig");
        else post.signature.setAttribute("data-rr-sig", "collapsed");
        toggle.textContent = collapsed ? "Hide signature" : "Show signature";
    });
    post.signature.before(toggle);
}

/* ---- Spoilers ----------------------------------------------------- */

/** The board wraps spoilers in div.spoiler with an inline-onclick Show
    button, so the toggles are found by clicking their own buttons. */
function spoilerButtons() {
    return Array.from(document.querySelectorAll('.spoiler input[type="button"]'))
        .filter((input) => (input.value || "").trim().toLowerCase() === "show");
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

        const box = el("div.rr-lightbox", { role: "dialog", "aria-modal": "true" }, [
            el("img", { src: img.currentSrc || img.src, alt: img.alt || "" }),
        ]);
        const close = () => { box.remove(); document.removeEventListener("keydown", onKey); };
        const onKey = (e) => { if (e.key === "Escape") close(); };
        box.addEventListener("click", close);
        document.addEventListener("keydown", onKey);
        document.body.append(box);
    }, true);
}

/* ---- Off-site links ------------------------------------------------ */

function markExternalLinks() {
    const here = location.hostname;
    for (const link of document.querySelectorAll(".postbody a[href^='http']")) {
        let host;
        try { host = new URL(link.href).hostname; } catch { continue; }
        if (host === here || host.endsWith(".rin.ru")) continue;
        if (link.querySelector(".rr-host")) continue;

        link.append(el("span.rr-host", {
            style: {
                marginLeft: "5px",
                fontSize: "var(--rr-fs-xs)",
                color: "var(--rr-faint)",
                fontFamily: "var(--rr-font-mono)",
            },
        }, [host.replace(/^www\./, "")]));
        link.setAttribute("rel", "noopener noreferrer");
    }
}

/* ---- Pagination ---------------------------------------------------- */

/* ---- Entry point ---------------------------------------------------- */

function initTopic() {
    if (!PAGE.isTopic) return;

    if (settings.get("history") && PAGE.topicId) {
        markVisited(String(PAGE.topicId));
        const heading = document.querySelector("#pageheader h2 a.titles, #pageheader h2");
        if (heading) {
            const list = store.get("history", []).filter((item) => item.id !== String(PAGE.topicId));
            list.unshift({
                id: String(PAGE.topicId),
                title: heading.textContent.trim(),
                href: "./viewtopic.php?t=" + PAGE.topicId,
                at: Date.now(),
            });
            store.set("history", list.slice(0, settings.get("historyLimit")));
        }
    }

    const all = posts();

    const modern = settings.get("postLayout") === "modern";
    if (modern) {
        document.documentElement.setAttribute("data-rr-posts", "modern");
        // Before the card, so the card lands under the author line
        // rather than above it.
        all.forEach(modernisePost);
    }

    if (settings.get("gameCard") && all.length && PAGE.start === 0) {
        const info = parseGameInfo(all[0].body);
        if (info && (info.appId || Object.keys(info.fields).length >= 3)) {
            // Written down whether or not the preview is switched on:
            // it costs one key and it is what makes the preview
            // instant, and free, for a topic that has been opened
            // once. See steam.js.
            if (info.appId && PAGE.topicId) steamRememberApp(PAGE.topicId, info.appId);
            buildGameCard(info, all[0].body);
            if (settings.get("collapseFirst")) {
                // The card already carries the title and the detail
                // rows, so the fold starts at the game heading rather
                // than further down at About The Game.
                const heading = all[0].body.querySelector('span[style*="150%"], span[style*="130%"]');
                const anchor = heading ? (heading.closest("span[style*=color]") || heading) : null;
                foldSteamBlurb(all[0].body, anchor);
            }
        }
    }

    decorateHeading();
    buildTopicBar();
    spaceForumRules();

    all.forEach((post, index) => {
        if (settings.get("postTools")) addPostTools(post, index);
        if (settings.get("collapseSigs")) collapseSignature(post);
    });

    if (settings.get("lightbox")) initLightbox();
    if (settings.get("linkifyBare")) markExternalLinks();
}

/* ================= src/modules/finder.js ================= */
/* ------------------------------------------------------------------
   Reading a post as a release.

   The single hardest thing to do on this board is answer "where is the
   current version". A game thread runs to hundreds of posts, releases
   and reuploads are ordinary replies, and the search box returns whole
   posts rather than the line you wanted.

   This is the half that reads: what a post carries, what it says on
   its own, and how much of that adds up to a release rather than a
   reply about one. releases.js is the half that shows it — one panel,
   this page or the whole topic.

   Nothing here fetches anything. It reads the page that is already
   loaded and guesses at nothing beyond what a post says.
   ------------------------------------------------------------------ */

const RELEASE_WORDS = [
    "clean steam files", "steam files", "reupload", "re-upload",
    "update", "updated", "patch", "hotfix", "repack", "crack",
    "build", "denuvo", "dlc unlocker", "goldberg", "emulator",
    // A hypervisor crack is a release of its own kind on this board,
    // with its own how-to threads and its own requirements.
    "hypervisor", "title update",
];

/* Three ways a post names which one it is, and they are not the same
   thing.
 *
 * The first is a version with a v on it: v1.4.2, ver. 2.0, version
 * 1.10.
 *
 * The second is a Steam build id, which is eight digits and beats
 * every real version it is compared against — kept apart so nothing
 * downstream has to guess which it is holding.
 *
 * The third is the one this board actually uses for the games it cares
 * most about, and it has no v anywhere in it. Ubisoft ships **Title
 * Updates**, and the release posts say so in the publisher's words:
 * "Game version is Title Update 1.0.7",
 * "Assassins.Creed.Black.Flag.Resynced.Title.Update.1.0.4.zip",
 * "to make space for Title Update 1.0.5". Read by a pattern that
 * required a v, all thirty-three pages of that topic had no version in
 * them at all. The number after the label is the game's version — the
 * post says as much — so that is what it is read as, and it compares
 * with every other version the same way.
 *
 * The label has to be followed by a *dotted* number, so "update 2 of
 * 3" and "patch to 4 files" are not versions. */
/* What may follow the digits.

   A single letter — 1.4.2b is a version — but only one, and only where
   it is not the first letter of a word: "1.0.7Learn" is 1.0.7 with a
   sentence welded to it, not version 1.0.7L. And nothing that is
   itself a digit, so a partial match cannot be mistaken for the whole.

   This was a plain `\b`, which cannot tell those apart: against
   "1.0.7Learn" it refused the match and backtracked to "1.0". */
const VERSION_SUFFIX = "(?:[a-z](?![a-z]))?(?!\\d)";

const VERSION_RE = new RegExp([
    "\\b(?:v(?:er(?:sion)?)?\\.?\\s?)(\\d+(?:\\.\\d+){1,3}" + VERSION_SUFFIX + ")",
    "\\bbuild\\s+(\\d{5,9})\\b",
    "\\b(?:title[\\s.]+update|update|patch|tu)d?[\\s.]+(?:to[\\s.]+)?v?(\\d+(?:\\.\\d+){1,3}" + VERSION_SUFFIX + ")",
].join("|"), "i");

/* A date is not a version.

   Off the live board: "Assassins.Creed.Black.Flag.Resynced.v1.0-v1.0.x
   .Plus.30. Trainer.Updated.2026.09.02 -FLiNG". The pattern that reads
   "Updated 1.0.5" as a version reads "Updated.2026.09.02" the same
   way, and 2026.09.02 beats every real version this board will ever
   see — so one trainer post stamped with the day it was built would
   have announced the game as being on 2026.

   The shape is checked rather than the digits: a first part in a
   plausible year, a second that could be a month, and a third, if
   there is one, that could be a day. Software that genuinely versions
   by year — 2024.1.5 — is refused along with it, and that is the right
   trade on a board where every game version is 1.x or 2.x.

   The number is still shown if the post carries nothing else; this
   only stops it being read as a version to compare. */
function looksLikeDate(version) {
    const parts = version.split(".").map((part) => parseInt(part, 10));
    if (parts.length < 2 || parts.length > 3) return false;
    if (!(parts[0] >= 1990 && parts[0] <= 2099)) return false;
    if (!(parts[1] >= 1 && parts[1] <= 12)) return false;
    return parts.length === 2 || (parts[2] >= 1 && parts[2] <= 31);
}

/**
 * Every version-shaped thing a post says, in the order it says them.
 *
 * Reading only the first match was enough while anything matching was
 * a version. It stopped being enough once a date could match: the
 * first match had to be *taken*, so a post whose opening line was a
 * build date had no version at all rather than the one three lines
 * further down.
 */
function versionsIn(text) {
    const all = new RegExp(VERSION_RE.source, "gi");
    const found = { version: null, build: null };
    let match;
    while ((match = all.exec(text)) !== null) {
        if (match[2]) {
            if (!found.build) found.build = match[2];
            continue;
        }
        const number = match[1] || match[3];
        if (!number || looksLikeDate(number)) continue;
        if (!found.version) found.version = number;
    }
    return found;
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

/**
 * What a post says on its own, with everything it quotes removed.
 *
 * The board renders a quote as div.quotetitle + div.quotecontent inside
 * the postbody, so reading the postbody whole means reading every
 * earlier post anyone replied to. A "thanks, the link is dead" reply
 * that quotes a release then carries that release's version number, its
 * release words and its [[Please login to see this link.]] markers, and
 * scores exactly like the release itself — which is why one upload used
 * to appear once for the post that made it and again for every reply
 * quoting it.
 *
 * Scoring a post on its own words is what stops that. The clone is
 * detached, so nothing the reader sees is touched.
 */
function ownContent(body) {
    const copy = body.cloneNode(true);
    for (const quote of copy.querySelectorAll(".quotecontent, .quotetitle, blockquote, cite")) {
        quote.remove();
    }
    spaceOutLines(copy);
    return copy;
}

/* A <br> contributes no text.

   The board writes a release post as one line per fact separated by
   <br>, so `textContent` returns them welded together: "Game version
   is Title Update 1.0.7Learn more here on HV releases". Two things go
   wrong at every one of those seams, and both were live on the board.

   The version comes back short. `1.0.7` followed immediately by a
   letter has no word boundary after it, so the pattern backtracks to
   the longest ending that does have one — `1.0` — and the panel
   reported a game on 1.0 that was on 1.0.7.

   And release words stop matching. `\bupdate\b` needs a boundary in
   front of it, and there is none in the middle of "filesUpdate", so a
   post offering clean Steam files and an update came back as neither.

   One space per line break fixes both, on the detached copy only.
   Block elements get one at each end for the same reason. */
const LINE_BREAKS = "br, p, div, li, tr, h1, h2, h3, h4, blockquote, pre";

function spaceOutLines(copy) {
    for (const node of copy.querySelectorAll(LINE_BREAKS)) {
        node.before(document.createTextNode(" "));
        node.after(document.createTextNode(" "));
    }
}

/**
 * What a post looks like at a glance: how many off-site links it
 * carries, whether it names a version, and which release words it uses.
 */
function describePost(post) {
    const own = ownContent(post.body);
    const text = own.textContent;
    const lower = text.toLowerCase();

    const links = Array.from(own.querySelectorAll("a[href]"))
        .filter((a) => isOffsite(a.getAttribute("href")));

    // Guests see "[[Please login to see this link.]]" instead of an
    // anchor, so those count as links too.
    const hidden = own.querySelectorAll(".link_removed").length;

    const words = RELEASE_WORDS.filter((word) => lower.includes(word));
    /* A dotted version and a Steam build id are both matched by
       VERSION_RE and they are not the same thing. "build 24127279" is
       an eight digit number that beats every real version it is
       compared against — which is how the whole-topic index came to
       announce v24127279 as the latest release of a game whose actual
       latest was 1.2.4. They are kept apart here so nothing downstream
       has to guess which it is holding. */
    const named = versionsIn(text);

    const score =
        (links.length + hidden) * 3 +
        words.length * 2 +
        (named.version || named.build ? 3 : 0) +
        // `own`, not `post.body`. The whole module exists because a
        // reply that quotes a release is not a release, and this one
        // term was still reading the quote: a "thanks" quoting a post
        // with a code block scored for the code block.
        (own.querySelector(".code, .codetitle, .spoiler") ? 1 : 0);

    return {
        post,
        links: links.length + hidden,
        words,
        version: named.version,
        build: named.build,
        score,
        date: postDate(post),
    };
}

function postDate(post) {
    if (!post.headCell) return null;
    const match = post.headCell.textContent.match(/Posted:\s*(.+?)(?:\s{2,}|$)/);
    return match ? match[1].trim() : null;
}

function authorName(post) {
    return post.author ? post.author.textContent.trim() : "unknown";
}

function flash(node) {
    if (!motionAllowed()) {
        // No fade for anyone who asked for no motion: the outline still
        // says which post, it just stops rather than dissolves.
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
            // Including the transition. Left behind, it stayed on the
            // post for the rest of the page's life and animated any
            // outline anything else put there later.
            node.style.outline = "";
            node.style.outlineOffset = "";
            node.style.transition = "";
        }, 900);
    }, 700);
}

/**
 * Show only the posts that carry links.
 *
 * This one does hide, with `display: none`, and it is the only thing
 * in the script that does. That is deliberate and it is not a fold: a
 * fold is a smaller box around content you are still reading, and this
 * is a filter you switched on to make everything else go away. It is
 * off by default, it says how many posts it is showing when you use
 * it, and switching it off puts every post back.
 */
function buildLinkFilter(all, rows) {
    const flagged = new Set(rows.map((row) => row.id));
    let on = false;

    const button = el("button.rr-btn", { type: "button", "aria-pressed": "false" }, [
        icon("filter", 13),
        "Only posts with links",
    ]);
    button.addEventListener("click", () => {
        on = !on;
        button.setAttribute("aria-pressed", on ? "true" : "false");
        for (const post of all) {
            const keep = !on || flagged.has(post.id);
            post.table.style.display = keep ? "" : "none";
        }
        toast(on ? rows.length + " posts shown" : "All posts shown");
    });
    return button;
}

/* ================= src/modules/releases.js ================= */
/* ------------------------------------------------------------------
   Releases: one panel, two scopes.

   This started as two. "On this page" answered "is there a release in
   front of me", read straight out of the DOM and free. "Posted in this
   topic" walked every page and answered "what has been posted here, in
   what order, and which of it is current".

   They were two panels one under the other, listing the same kind of
   thing about the same posts in two different row shapes, and the
   second was strictly the first plus a page number. So there is one
   panel now, with a scope you switch: **This page**, instant and
   asking nobody anything, and **All N pages**, which reads the topic
   once, on a click, and remembers what it found.

   Everything either of them had is here. From the page half: the jump
   that scrolls to the post and flashes it, and the filter that hides
   every post without a link. From the topic half: the version, what
   kind of thing each post is, who posted it, when, which page, the
   highest version anybody posted, filters by kind, and the note saying
   when the topic was last read.

   How the walk behaves is the part worth stating plainly. The page you
   are on is never fetched — it is already parsed and in front of you.
   The rest are fetched one at a time, spaced out, and only when asked:
   a nineteen page topic is nineteen requests to a board that runs on
   donations, so it is a click, never a page load, and never twice in a
   row. Escape stops it. And nothing is guessed: a post is read for
   what it says, with quoted text excluded, because a reply quoting a
   release is not a release.
   ------------------------------------------------------------------ */

/* What the board's uploaders actually post, in the words they use.

   Every match is kept, because "Repack, Update, DLC" is three true
   things about one post and picking one of them would be throwing two
   away.

   The Russian terms are here because the board is bilingual, and they
   are the one part of this list that is not grounded in reading the
   board: its Russian forums are closed to guests, so 115 post bodies
   sampled across them came back as a single "you are not authorised to
   read this forum". They are therefore limited to terms that cannot
   mean anything else in a release post — таблетка and лекарство are
   idioms for a crack, русификатор is a translation pack — rather than
   to anything that would guess. A word that is ordinary Russian as
   well as jargon is not in here. */
const RELEASE_KINDS = [
    { id: "steamfiles", label: "Clean Steam files", re: /\b(?:clean\s+steam\s+files?|steam\s+files?|scs\b)|чистые\s+файлы/i },
    { id: "repack", label: "Repack", re: /\brepack(?:ed|s)?\b|\bfitgirl\b|\bdodi\b|\belamigos\b|репак/i },
    { id: "crack", label: "Crack", re: /\bcrack(?:ed|fix|s)?\b|\bcodex\b|\bempress\b|\bskidrow\b|\bplaza\b|\btenoke\b|\brune\b|\brazor\s?1911\b|кряк|таблетк|лекарств/i },
    /* A crack that runs the game under a hypervisor rather than
       patching it. On this board that is a release of its own kind: it
       has its own how-to threads, its own requirements and its own
       thing to know before downloading sixty gigabytes, and the posts
       say so in the title line — "Black Flag Resynced HYPERVISOR", and
       "Learn more here on HV releases" underneath. Two letters is a
       short word to match on, so it has to stand alone; nothing else on
       this board is spelled HV. */
    { id: "hypervisor", label: "Hypervisor", re: /\bhyper[\s-]?visor\b|\bhv\b|гипервизор/i },
    { id: "online", label: "Online fix", re: /\bonline[\s-]?fix\b|\bgoldberg\b|\bsteam\s?emu\b|\bmultiplayer\s+fix\b|\bco-?op\s+fix\b|\bemulator\b|онлайн\s*фикс|голдберг/i },
    { id: "dlc", label: "DLC", re: /\bdlcs?\b|\bunlocker\b|\bcream\s?api\b|\bsmart\s?steam\b|длс|разблокировщик/i },
    { id: "update", label: "Update", re: /\bupdate[ds]?\b|\bpatch(?:ed|es)?\b|\bhotfix\b|\bupgrade\b|обновлени|обнова|патч/i },
    { id: "reupload", label: "Reupload", re: /\bre-?upload(?:ed|s)?\b|\bmirror(?:s|ed)?\b|\breup\b|перезалив|зеркало/i },
    { id: "trainer", label: "Trainer", re: /\btrainer\b|\bcheat\s+(?:tables?|engines?)\b|\bsave\s?game\b|трейнер|сохранени/i },
    { id: "language", label: "Language", re: /\blanguage\s+(?:pack|files?)\b|\blocali[sz]ation\b|\btranslation\b|русификатор|локализаци/i },
    { id: "tool", label: "Tool", re: /\btool(?:s|kit)?\b|\bmod\s+manager\b|\binstaller\b|активатор|установщик/i },
    { id: "denuvo", label: "Denuvo", re: /\bdenuvo\b|денуво/i },
];

/* What each kind *is*, so the colour carries the same meaning
   everywhere it appears.

   Five of the eleven kinds were coloured and six were grey, which
   looked like a taxonomy and was actually a list of the ones somebody
   had got round to: a Trainer sat neutral in a row where Crack, Update
   and Clean Steam files were all coloured, and the filter chips above
   those rows were grey to a kind — the same word, twice on the same
   screen, in two different colours.

   So every kind belongs to a family, the families are what the
   stylesheet paints, and a test fails if a kind is ever added without
   one. Five families, and each answers a different question about a
   post:

     game    what you install          Clean Steam files, Repack
     run     what makes it start       Crack, Online fix
     change  what it does to a copy    Update, Reupload
     extra   what it adds              DLC, Language
     beside  what sits next to it      Trainer, Tool
     block   what stops it             Denuvo

   The tokens they map to are theme-wide, so Paper gets its own version
   of all six rather than a dark palette on a light page — and the six
   have to stay six on every theme. The first mapping put `run` on
   --rr-tag-important and `block` on --rr-tag-problem, which are the
   same red on the board's own palette: two families, one colour, and
   a Crack that looked like a warning. A check compares all six on
   every theme now. */
const RELEASE_FAMILY = {
    steamfiles: "game",
    repack: "game",
    crack: "run",
    hypervisor: "run",
    online: "run",
    update: "change",
    reupload: "change",
    dlc: "extra",
    language: "extra",
    trainer: "beside",
    tool: "beside",
    denuvo: "block",
};

/** The family a kind belongs to, or the neutral one. */
function releaseFamily(kind) {
    return RELEASE_FAMILY[kind] || "other";
}

const RELEASE_CACHE_KEY = "topicIndex";
const RELEASE_CACHE_TOPICS = 8;
const RELEASE_MAX_PAGES = 80;

/* ---- How the walk asks the board for pages -------------------------

   The board is one man's server paid for by donations, and it is
   asking for them right now. Reading a thirty-three page topic is
   thirty-two requests however it is arranged, so the only question is
   the shape of them; the answer here is bounded on three axes at once,
   and none of the three is negotiable for speed.

   **How many at a time.** Strictly one at a time with a gap is what
   this did, and on a thirty-four page topic that measured 21.8 seconds
   against the live board — because 95% of it was waiting: a page of
   that topic is 417 ms to first byte and 2.4 ms to parse. The
   published guidance for a host with no crawl-delay of its own is two
   to five connections; the conservative end of that is three, and
   three is what this uses. It is worth adding that the board answers
   HTTP/2 and advertises HTTP/3, so three requests in flight share one
   connection rather than opening three.

   **How fast they may start.** Concurrency alone still allows a burst:
   three requests leaving in the same millisecond, three more the
   moment they land. So no two requests may start closer together than
   RELEASE_START_GAP, which caps the rate at about six a second at the
   very worst and holds it near three in practice — against roughly one
   a second before, for a run that is over in seconds either way.

   **What happens when the board says no.** A 429 or a 503 stops the
   walk where it is rather than retrying into it, and the panel says
   the topic was only read as far as it got.

   **And what happens when it says no without saying so.** This board
   does not answer 429. It queues: after a few dozen requests in quick
   succession it starts serialising everything from that address, and
   six requests sent together come back at two, four, six, eight, ten
   and twelve seconds — a staircase, each step one slot in a queue.
   Measured, from a browser, with none of this script running.

   That is the important finding about this particular board, and it
   makes concurrency worth much less than it looks: against a server
   handing out one slot every two seconds, three requests in flight
   finish no sooner than one and leave three sitting in its queue
   instead of one. So the walk watches its own timings — the first few
   answers set what "prompt" means for today, and once answers are
   several times slower than that, it drops to a single request at a
   time with a much wider gap and stays there. Fast board: three at a
   time and done in seconds. Board under load: out of its way.

   There is no conditional-request path to take here, and that was
   checked rather than assumed: cs.rin.ru sends no ETag and no
   Last-Modified on viewtopic.php, and answers `Cache-Control: private,
   no-cache="set-cookie"` with `Expires: 0`. An If-None-Match round
   trip would cost exactly as much as the page. The saving has to come
   from not asking at all, which is what the page cache below does. */
const RELEASE_IN_FLIGHT = 3;
const RELEASE_START_GAP = 160;        /* between request starts, ms   */
/* Where it goes when the board starts queueing. */
const RELEASE_EASY_IN_FLIGHT = 1;
const RELEASE_EASY_GAP = 700;
/* How much slower than its own best an answer has to be before that
   counts as the board asking for room, and the floor below which it is
   never read as one — a page that took 900 ms after one that took 200
   is a slow page, not a queue. */
const RELEASE_SLOW_FACTOR = 3;
const RELEASE_SLOW_FLOOR = 1500;      /* ms                            */
/* Statuses that mean "stop", not "try again". */
const RELEASE_BACK_OFF = [429, 503];

/**
 * How hard the walk is currently pushing.
 *
 * One of these per walk. It starts at three in flight and gives that
 * up the first time the board answers several times slower than its
 * own best — which is what a queue looks like from the outside on a
 * server that never says 429.
 */
function makePace() {
    return {
        inFlight: RELEASE_IN_FLIGHT,
        gap: RELEASE_START_GAP,
        best: Infinity,
        eased: false,
        slowest: 0,
    };
}

/** Feed one answer's round trip back into the pace. */
function notePace(pace, ms) {
    if (!Number.isFinite(ms) || ms <= 0) return;
    pace.slowest = Math.max(pace.slowest, ms);
    if (ms < pace.best) pace.best = ms;
    if (pace.eased) return;
    if (ms < RELEASE_SLOW_FLOOR) return;
    if (ms < pace.best * RELEASE_SLOW_FACTOR) return;
    pace.eased = true;
    pace.inFlight = RELEASE_EASY_IN_FLIGHT;
    pace.gap = RELEASE_EASY_GAP;
}

/**
 * What the post *says*, with its links taken out.
 *
 * Not the same text as the one that counts links. People label a link
 * "Mirror 1", "Mirror 2", and reading those as prose tagged every
 * single upload in a topic as a reupload — including the first one,
 * which is by definition not. The words that say what a thing is are
 * the ones around the links, not the ones on them.
 */
function releaseProse(body) {
    const copy = ownContent(body);
    for (const link of copy.querySelectorAll("a[href], .link_removed, .codetitle, .code")) link.remove();
    return copy.textContent.replace(/\s+/g, " ").trim();
}

/** Which kinds a post's own words match. */
function releaseKinds(text) {
    const found = [];
    for (const kind of RELEASE_KINDS) {
        if (kind.re.test(text)) found.push(kind);
    }
    return found;
}

/** One row, or null if this post is not one. */
function describeRelease(post, page) {
    const scored = describePost(post);
    const text = releaseProse(post.body);
    const kinds = releaseKinds(text);

    /* Two ways in.

       The narrow bar — enough links, release words or a version to be
       a release rather than a reply about one. It would rather miss a
       release than list a conversation.

       Or one off-site link and one recognised kind, which is the case
       that bar was dropping: a language pack, a trainer, a mod tool.
       None of those carry a version or any of the fifteen release
       words, so a post offering one scored three against a threshold
       of four and never appeared — in a panel whose job is to list
       every kind of thing posted. */
    const known = kinds.length > 0 && scored.links > 0;
    if (scored.score < 4 && !known) return null;

    /* Words alone are never enough.
     *
     * The bar is a score, and a score can be reached by vocabulary: two
     * recognised words are four points and four points is the bar. That
     * was survivable while the vocabulary was narrow, and stopped being
     * so the moment "hypervisor" joined it — "Does the hypervisor crack
     * need Core Isolation off?" is two release words, no links, no
     * version, and it scored exactly like a release. On the live Black
     * Flag topic that shape is most of the thread.
     *
     * A thing that was posted has somewhere to get it or a number on
     * it. A post with neither is a post *about* a release. */
    if (!scored.links && !scored.version && !scored.build) return null;

    return {
        id: post.id,
        page,
        author: authorName(post),
        date: postDate(post),
        version: scored.version,
        build: scored.build,
        links: scored.links,
        kinds: kinds.map((kind) => kind.id),
        labels: kinds.map((kind) => kind.label),
        excerpt: text.slice(0, 180),
        score: scored.score,
    };
}

/**
 * Drop rows offering the same thing as one already kept.
 *
 * Excluding quotes stops a reply inheriting a release it only quoted;
 * this catches the rest — the same person posting a mirror of their own
 * upload three times in a row, which reads as one release to a person
 * and as three identical lines to a list.
 */
function dedupeReleases(rows) {
    const seen = new Set();
    return rows.filter((row) => {
        const key = [row.author, row.version || row.build || "", row.kinds.join("+"), row.links].join("|");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/** The highest post id anywhere in a set of posts. phpBB hands them
    out in order, so it is the newest thing that was there. */
function newestPostId(list) {
    let best = 0;
    for (const post of list) {
        const id = Number(post.id);
        if (Number.isFinite(id) && id > best) best = id;
    }
    return best;
}

/** Rows for the posts on screen, in thread order, newest first. */
function releasesOnThisPage(page) {
    return dedupeReleases(
        posts()
            .map((post) => describeRelease(post, page))
            .filter(Boolean)
            .reverse());
}

/* ---- Walking the topic -------------------------------------------- */

/**
 * Fetch one page of this topic and read the posts out of it.
 *
 * The parsed copy is only ever read, never inserted. parseDocument()
 * is what makes that survive a Trusted Types policy; where even it
 * cannot, this throws and the walk reports the page it lost rather
 * than dying inside a click handler.
 */
async function fetchTopicPage(href, page) {
    const response = await fetch(href, { credentials: "same-origin" });
    if (!response.ok) {
        const err = new Error("page " + page + " returned " + response.status);
        err.status = response.status;
        throw err;
    }

    /* The whole page is parsed rather than a fragment cut out of it,
       and that is a measurement rather than an oversight. On the live
       board one page of a thirty-four page topic is 89 KB and 417 ms
       to arrive; parsing all of it takes 2.4 ms, and parsing only the
       posts block takes 1.5. Slicing the markup first would save nine
       tenths of a millisecond a page — 29 ms across the whole topic,
       against fourteen seconds of network — in exchange for a cut that
       has to land in the right place on every page the board serves.
       Not a trade worth making. */
    const doc = parseDocument(await response.text());
    if (!doc) throw new Error("page " + page + " could not be parsed");
    return readTopicPage(posts(doc), page);
}

/** One page's posts, as the walk keeps them. */
function readTopicPage(found, page) {
    const ids = found.map((post) => Number(post.id)).filter(Number.isFinite);
    return {
        page,
        rows: found.map((post) => describeRelease(post, page)).filter(Boolean),
        // Every post on the page, not only the releases: what makes a
        // kept index stale is any new reply, and a topic whose last
        // twenty posts are chatter has still moved on.
        newest: ids.length ? Math.max.apply(null, ids) : 0,
        // The post this page opens with, which is how a later visit
        // tells "the topic gained replies" from "posts were deleted and
        // everything after them shifted a page".
        first: ids.length ? Math.min.apply(null, ids) : 0,
        count: found.length,
    };
}

/* ---- Pages this browser has already read --------------------------- */

/* A page of a phpBB topic is not a moving target. The board paginates
   by post index, so a reply lands on the last page and leaves every
   page before it byte-for-byte the same. That is what makes reading a
   topic a second time nearly free — as long as the assumption is
   checked rather than trusted, because a *deleted* post shifts every
   page after it back by one.

   So each page is kept with the id of the post it opens with, and a
   rescan re-reads two pages: the last one, which is where new replies
   are, and the highest page below it, whose opening post id is the
   canary. If that canary still opens with the post it opened with
   before, nothing has shifted and every page between them is still
   what it was. If it does not, the whole cache for the topic is
   dropped and the topic is read again from the start.

   Kept for fewer topics than the row index is: this holds every page
   of a topic rather than the answer. */
const RELEASE_PAGES_KEY = "topicPages";
const RELEASE_PAGES_TOPICS = 4;

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

/**
 * Which pages have to be asked for, and which are already known.
 *
 * Returns the pages to fetch in reading order, plus the canary whose
 * answer decides whether the kept pages may be believed at all.
 */
function planWalk(topicId, info, total) {
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
    const fetch_ = [];
    for (let page = 1; page <= total; page += 1) {
        if (page === current) continue;
        if (kept && reusable(page)) reuse.push(page);
        else fetch_.push(page);
    }

    /* The canary: the highest page being reused. A post deleted
       anywhere in the topic shifts every page after it, so the page
       furthest down the topic is the one that shows it. */
    const canary = reuse.length ? reuse[reuse.length - 1] : null;
    if (canary !== null) fetch_.push(canary);
    fetch_.sort((a, b) => a - b);

    return { reuse: reuse, fetch: fetch_, known: known, canary: canary };
}

/* ---- Asking, a few at a time -------------------------------------- */

/**
 * Run one job per item, at most RELEASE_IN_FLIGHT at once and never
 * two started closer together than RELEASE_START_GAP.
 *
 * The spacing is reserved before the wait rather than measured after
 * it, so three workers cannot each decide independently that it is
 * their turn.
 */
async function pacedPool(items, worker, state, pace) {
    const results = new Array(items.length);
    let next = 0;
    let slot = 0;
    let running = 0;

    const run = async () => {
        while (next < items.length && !state.cancelled && !state.stopped) {
            /* Backing off mid-walk means the workers already started
               have to stand down, not just the ones not started yet. */
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

    const workers = Math.min(pace.inFlight, items.length);
    await Promise.all(Array.from({ length: workers }, run));

    /* A back-off can leave items unclaimed, because the workers that
       stood down were the ones that would have taken them. Whatever is
       left is finished at the eased pace. */
    if (next < items.length && !state.cancelled && !state.stopped) {
        await Promise.all(Array.from({ length: Math.min(pace.inFlight, items.length - next) }, run));
    }
    return results;
}

/**
 * Read the whole topic and return every release in it.
 *
 * The page in front of you is never fetched; pages this browser has
 * already read are not fetched either unless the canary says they may
 * have moved. What is left goes to the pool above, a few at a time.
 */
async function walkTopic(info, state, onProgress) {
    const total = Math.min(info.total || 1, RELEASE_MAX_PAGES);
    const current = info.current || 1;
    const plan = planWalk(PAGE.topicId, info, total);
    const pace = makePace();

    const read = new Map();
    read.set(current, readTopicPage(posts(), current));

    let done = 0;
    const say = () => onProgress(Math.min(total, done + plan.reuse.length + 1), total);
    say();

    const fetchOne = async (page) => {
        const href = pageHref(page);
        if (!href) return null;
        try {
            const result = await fetchTopicPage(href, page);
            read.set(page, result);
            return result;
        } catch (err) {
            // A board saying "not so fast" is answered by stopping, not
            // by asking again.
            if (RELEASE_BACK_OFF.includes(err.status)) state.stopped = err.status;
            console.warn("[RIN Reforged] topic index:", err);
            return null;
        } finally {
            done += 1;
            say();
        }
    };

    await pacedPool(plan.fetch, fetchOne, state, pace);

    /* Did the pages held from last time move?

       The canary was fetched along with everything else, so this costs
       nothing extra — it is only read here. If its opening post is not
       the one it opened with when it was kept, posts have been removed
       somewhere above it and every page in between is a page number
       out. The cache is dropped and the topic is read again from
       scratch, which is the one case where a second scan costs more
       than a first. */
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
        return walkTopic(again, Object.assign(state, { retried: true }), onProgress);
    }

    /* Everything read this time, plus everything believed from last
       time, as one set of pages. */
    const pages = {};
    let newest = 0;
    let scanned = 0;
    for (let page = 1; page <= total; page += 1) {
        const fresh = read.get(page);
        const held = plan.known[String(page)];
        const entry = fresh || (plan.reuse.includes(page) ? held : null);
        if (!entry) continue;
        pages[String(page)] = { rows: entry.rows, first: entry.first, newest: entry.newest, count: entry.count };
        newest = Math.max(newest, entry.newest || 0);
        scanned += 1;
    }

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

    const complete = !state.cancelled && !state.stopped && scanned >= total;
    if (PAGE.topicId && complete) rememberPages(PAGE.topicId, pages, total);

    return {
        rows: dedupeReleases(found),
        done: complete,
        scanned: scanned,
        newest: newest,
        // How much of this answer came out of this browser rather than
        // off the board, which is the whole point of keeping it.
        fetched: plan.fetch.length,
        reused: plan.reuse.length,
        refused: state.stopped || null,
        // Whether the board asked for room, so the panel can say the
        // walk went slowly on purpose rather than looking stuck.
        eased: pace.eased,
    };
}

/* ---- Keeping the answer ------------------------------------------- */

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

/** "3 minutes ago", roughly, for the line under the heading. */
function agoText(at) {
    const seconds = Math.max(0, Math.round((Date.now() - at) / 1000));
    if (seconds < 90) return "just now";
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return minutes + " minutes ago";
    const hours = Math.round(minutes / 60);
    if (hours < 36) return hours + (hours === 1 ? " hour ago" : " hours ago");
    return Math.round(hours / 24) + " days ago";
}

/* ---- Versions ------------------------------------------------------ */

/* Versions compare as numbers per part, so 1.10 is after 1.9.

   And a part written with a leading zero is not one number, it is two.
   This board writes the same release both ways — 1.0.6 in one post and
   1.06 in the next, for the same Title Update — and read as two parts
   1.06 is one-point-six, which beats 1.0.7 on the second digit. That
   is how the thirty-three page Black Flag topic came to announce a
   game on 1.06 whose newest release was 1.0.7.

   Only an exactly two-digit part with a leading zero is split, which
   is the shape people mean as "point oh six". 1.10 has no leading zero
   and stays ten, so it stays after 1.9 and after 1.3.

   Comparison only: the row still shows what the poster wrote. */
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

/* Which rows are allowed to answer "what version is the game on".

   Not every version in a topic is the game's. Found on the live board,
   in the thirty-three page Black Flag Resynced thread: a post
   explaining how to get achievement popups says "Download v1.6.0 or
   later lightweight AchievementOverlay by Oleg Savelyev". That is the
   version of somebody else's utility, and read as the game's it beats
   1.0.7 on the second digit — so the panel's headline, the one line
   the whole thread exists to answer, said the game was on 1.6.0.

   The rule: a row may set the headline only if the finder could say
   what kind of thing it is, and only if that kind is about the game
   rather than beside it. A trainer, a cheat table and an overlay all
   carry their own version numbers and none of them is the game's;
   "cheat tables for 1.0.4" and "AchievementOverlay v1.6.0" are the
   same sentence about two different products. A crack, a repack, an
   update, clean Steam files, a DLC pack — those are versioned against
   the game, and they are what the question is about.

   Everything still appears in the list. This decides one line. */
const VERSION_EVIDENCE = new Set(["game", "run", "change", "extra", "block"]);

function saysGameVersion(row) {
    return row.kinds.some((kind) => VERSION_EVIDENCE.has(releaseFamily(kind)));
}

/** The highest version anybody posted *of the game* — the question the
    thread was opened with. Build ids are excluded: "build 24127279" is
    eight digits and beats every real version it is compared against. */
function latestVersion(rows) {
    let best = null;
    for (const row of rows) {
        if (!row.version || !saysGameVersion(row)) continue;
        if (versionNewer(row.version, best)) best = row.version;
    }
    return best;
}

/* ---- The panel ------------------------------------------------------ */

/* A version, a Steam build id and nothing at all are three different
   answers to "which one is this", and they read as three variations on
   the same one: v3.10.5, then a bare em dash with no legend, then
   #24833802, all in the same weight in the same column.

   Now each says what it is. A version keeps the v and the weight
   because it is the answer the thread was opened with. A build id is
   labelled `build`, because it is one — it is not a version and must
   never be read as a bigger one. And nothing at all is drawn as an
   empty state rather than as punctuation: dimmer than either, and with
   the reason on it. */
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
            title: "Steam build " + row.build + ", which is not a version number",
        }, [
            el("span.rr-releases__vkind", {}, ["build"]),
            row.build,
        ]);
    }
    return el("span.rr-releases__version", {
        "data-rr-kind": "none",
        title: "No version given in this post",
        "aria-label": "No version given",
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
        }, [text]));
    }
    if (!row.labels.length && row.links) {
        tags.append(el("span.rr-releases__tag", { "data-kind": "link", "data-family": "other" }, [
            row.links + (row.links === 1 ? " link" : " links"),
        ]));
    }

    /* The same date treatment the rest of the interface got: the
       weekday goes, the whole thing stays on hover. A panel that
       prints "Wednesday, 02 Sep 2026, 09:49" on every row while the
       listing two clicks away prints "02 Sep 2026" is two answers to
       one question. */
    const when = row.date || "";
    const link = el("a.rr-releases__link", { href: target, title: row.excerpt }, [
        releaseVersion(row, latest),
        tags,
        el("span.rr-releases__who", {}, [row.author]),
        el("span.rr-releases__when", { title: when }, [shortenPostMeta(when)]),
        el("span.rr-releases__page", {}, ["p." + row.page]),
    ]);

    // A row for a post on the page you are already on scrolls to it and
    // flashes it. One on another page is an ordinary link and behaves
    // like one, middle click and all.
    link.addEventListener("click", (event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.button) return;
        const anchor = document.querySelector('a[name="p' + row.id + '"]');
        const table = anchor && anchor.closest("table.tablebg");
        if (!table) return;
        event.preventDefault();
        table.scrollIntoView({ behavior: scrollBehaviour(), block: "start" });
        flash(table);
    });
    return el("li.rr-releases__row", { "data-kinds": row.kinds.join(" ") }, [link]);
}

/**
 * Chips that narrow the list to one kind of thing.
 *
 * Only kinds actually present: a row of eleven filters where nine
 * match nothing is a worse list than no filters at all.
 */
function releaseFilters(rows, list, onCount) {
    const present = new Map();
    for (const row of rows) {
        for (const [i, id] of row.kinds.entries()) present.set(id, row.labels[i]);
    }
    if (present.size < 2) return null;

    const bar = el("div.rr-releases__filters", { role: "group", "aria-label": "Filter by kind" });
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
        /* The chip is the same word as the tag in the rows below it, so
           it is the same colour: a row of grey chips over a list of
           coloured tags reads as two vocabularies rather than one
           filter. Unpressed it is the family colour held back; pressed
           it fills in. */
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

/* ---- Entry point ---------------------------------------------------- */

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

    /* When there is nothing to show.

       A one page topic with no release on it gets no panel: "nothing
       here reads as a release" is the whole answer and a card saying so
       is noise. A topic with more pages is different — the panel is the
       only way to read the rest of it, and the page in front of you
       being chatter says nothing about page three. That is exactly the
       shape a request thread has when the request gets answered, and
       four of them in a row on the live board had no panel at all. */
    if (!pageRows.length && !kept && !(canWalk && multi)) return;

    /* Has the topic moved on since the index was taken?
     *
     * The page count changing is the obvious signal and it was the only
     * one: a topic that gained four replies without gaining a page was
     * offered a stale index with no hint that it was one. phpBB hands
     * post ids out in order, so a post in front of us with an id past
     * the highest one the walk saw is proof there are newer ones, and
     * how many of those are on this page is a floor on how many there
     * are. It is a floor, not a count — hence "at least".
     */
    const hereNewest = newestPostId(all);
    const staleBy = kept && kept.newest
        ? all.filter((post) => Number(post.id) > kept.newest).length
        : 0;

    /* The list is rebuilt when the scope changes rather than kept in
       two copies: the rows, the filters and the counts all differ, and
       a hidden second list is a second thing to keep in step. */
    const panel = el("section.rr-releases", { "aria-label": "Releases in this topic" });
    const state = { cancelled: false, stopped: null, scope: "page", topic: kept };

    const count = el("span.rr-releases__count");
    const scope = el("div.rr-releases__scope", { role: "tablist", "aria-label": "How much to look at" });

    /* Both options, always.
     *
     * On a topic with one page only "This page" was drawn, and one
     * segment of a segmented control on its own does not read as a
     * control at all — it reads as a label that happens to have a box
     * around it. On a topic with several the second segment appeared
     * and the whole thing suddenly made sense. Same panel, two
     * meanings, decided by something about the topic rather than about
     * the interface.
     *
     * So the second option is always drawn, and on a one page topic it
     * is disabled and says why. */
    const pageTab = el("button.rr-releases__tab", { type: "button", role: "tab" }, ["This page"]);
    const topicLabel = "All " + total + (total === 1 ? " page" : " pages");
    const topicTab = el("button.rr-releases__tab", { type: "button", role: "tab" }, [topicLabel]);
    if (!canWalk || !multi) {
        topicTab.disabled = true;
        topicTab.setAttribute("data-rr-why", "");
        topicTab.setAttribute("title", !canWalk
            ? "Reading a whole topic is switched off in the settings"
            : "This topic is one page — you are looking at all of it");
    }
    scope.append(pageTab, topicTab);

    /* The board's own "only show me the drops" filter. It was in a
       strip along the bottom of the panel while the scope control was
       in the head, so the two things that decide what the panel is
       showing sat at opposite ends of it. They are one group now. */
    const linkFilter = buildLinkFilter(all, pageRows);
    linkFilter.classList.add("rr-releases__only");

    const body = el("div.rr-releases__body");
    panel.append(
        el("div.rr-releases__head", {}, [
            icon("layers", 14),
            el("h3", {}, ["Releases"]),
            count,
            el("div.rr-releases__controls", {}, [scope, linkFilter]),
        ]),
        body,
    );

    const setCount = (shown, filtered, rows, scoped) => {
        count.textContent = filtered
            ? shown + " of " + rows.length
            : rows.length + (rows.length === 1 ? " release" : " releases") + (scoped ? "" : " on this page");
    };

    const walk = () => {
        state.cancelled = false;
        state.stopped = null;
        topicTab.disabled = true;
        topicTab.setAttribute("aria-busy", "true");

        const finish = () => {
            topicTab.disabled = false;
            topicTab.removeAttribute("aria-busy");
            topicTab.textContent = topicLabel;
        };

        walkTopic(info, state, (at, of) => {
            topicTab.textContent = "Reading " + at + " of " + of + "…";
        }).then((result) => {
            finish();
            state.topic = {
                at: Date.now(), rows: result.rows, scanned: result.scanned,
                done: result.done, total: total,
                newest: Math.max(result.newest || 0, hereNewest),
                fetched: result.fetched, reused: result.reused,
                eased: result.eased,
            };
            if (PAGE.topicId) rememberIndex(PAGE.topicId, state.topic);
            if (result.refused) toast("The board asked for a slower pace, so the topic was only read this far");
            state.scope = "topic";
            render();
        }).catch((err) => {
            finish();
            console.warn("[RIN Reforged] topic index:", err);
            toast("Could not read the whole topic");
        });
    };

    const render = () => {
        body.textContent = "";
        pageTab.setAttribute("aria-selected", state.scope === "page" ? "true" : "false");
        topicTab.setAttribute("aria-selected", state.scope === "topic" ? "true" : "false");

        const scoped = state.scope === "topic";
        const rows = scoped ? (state.topic ? state.topic.rows : []) : pageRows;
        const latest = scoped ? latestVersion(rows) : null;

        if (scoped && state.topic) {
            const again = el("button.rr-btn", { type: "button", "data-variant": "quiet" }, [
                icon("layers", 12), "Read it again",
            ]);
            again.addEventListener("click", walk);
            /* One sentence, not three spans run together. Read by eye
               the gaps between them are the punctuation; read aloud
               they are nothing, and the line came out as
               "Latest posted: v1.10.05 pages read". */
            const said = [
                latest ? "Latest posted: version " + latest : null,
                state.topic.scanned + (state.topic.scanned === 1 ? " page" : " pages") + " read",
                state.topic.done ? null : "stopped early",
                state.topic.eased ? "the board was busy, so this was read slowly" : null,
                "read " + agoText(state.topic.at || Date.now()),
                staleBy ? staleBy + " new since" : null,
            ].filter(Boolean).join(". ");

            /* When it was read, whether it has moved on, and the
               control that acts on both — one group, at one end. They
               were at opposite ends of the card: the fact on the left,
               the button that changes it 900px away on the right. */
            body.append(el("div.rr-releases__note", { role: "status", "aria-label": said }, [
                latest ? el("span.rr-releases__latest", { "aria-hidden": "true" }, ["Latest posted: v" + latest]) : null,
                el("span.rr-spacer"),
                el("div.rr-releases__read", {}, [
                    el("span", { "aria-hidden": "true" }, [
                        state.topic.scanned + (state.topic.scanned === 1 ? " page" : " pages") + " read",
                        state.topic.done ? "" : " · stopped early",
                        " · " + agoText(state.topic.at || Date.now()),
                    ].join("")),
                    /* Why it took as long as it did. A walk that drops
                       to one request at a time because the board is
                       queueing looks exactly like a walk that has hung,
                       and the difference matters to whoever is watching
                       it. */
                    state.topic.eased
                        ? el("span.rr-releases__eased", {
                            "aria-hidden": "true",
                            title: "The board was answering slowly, so this was read one page at a time",
                        }, ["read gently"])
                        : null,
                    staleBy
                        ? el("span.rr-releases__stale", { "aria-hidden": "true" }, [
                            staleBy + (staleBy === 1 ? " newer post" : " newer posts") + " since",
                        ])
                        : null,
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

    // Escape stops a walk in progress: eighteen more requests are not
    // something to leave running because somebody changed their mind.
    on(document, "keydown", (event) => {
        if (event.key === "Escape" && topicTab.disabled && topicTab.hasAttribute("aria-busy")) {
            state.cancelled = true;
            toast("Stopped reading the topic");
        }
    });

    // An index taken earlier opens on the whole topic, because that is
    // what the reader last asked for and it costs nothing to show. A
    // topic that has since gained pages is not the same topic, so that
    // one is dropped rather than shown as if it were current.
    if (kept && kept.total === total) state.scope = "topic";
    else if (kept) state.topic = null;
    render();

    const anchor = document.querySelector("#pagecontent") || document.querySelector("#wrapcentre");
    if (anchor) anchor.prepend(panel);
}

/* ================= src/modules/quotes.js ================= */
/* ------------------------------------------------------------------
   Folding quotes.

   A reply that quotes three paragraphs to add one line reads as four
   paragraphs, and a page of those is most of what makes a long thread
   hard to skim. Every script that has tried to fix this on this board
   has done it by rebuilding the quote node — read the text out, throw
   the node away, put a new one back. That loses whatever was inside:
   the links, the nested quotes, the handlers another script attached,
   and, under a Trusted Types policy, it does not run at all.

   Nothing here removes anything. A folded quote is the same nodes in
   the same place with a smaller box drawn around them: `overflow` and
   a mask do the folding, so the text stays laid out, stays in the
   accessibility tree, stays findable by the browser's own find-in-page,
   and stays visible to the finder, which reads the DOM.

   That is the whole difference between "folded" and "gone", and it is
   the reason the earlier attempt was refused.
   ------------------------------------------------------------------ */

/** Quote blocks in post content, outermost first. */
function quoteBlocks(root = document) {
    return Array.from(root.querySelectorAll(".postbody .quotecontent, .postbody blockquote"));
}

/**
 * The heading the board prints above a quote ("Someone wrote:").
 *
 * subsilver2 emits div.quotetitle immediately before div.quotecontent.
 * A <blockquote> carries its own <cite> inside instead. Either is a
 * label already sitting where the control belongs, so the toggle joins
 * it rather than adding a strip of its own.
 */
function quoteHeading(quote) {
    const previous = quote.previousElementSibling;
    if (previous && previous.classList.contains("quotetitle")) return previous;
    const cite = quote.firstElementChild;
    if (cite && cite.tagName === "CITE") return cite;
    return null;
}

function foldQuote(quote, lines) {
    if (quote.hasAttribute("data-rr-quote")) return false;

    // Measured, not guessed: a quote of two long lines and a quote of
    // six short ones are the same number of characters and only one of
    // them is worth folding.
    //
    // Both numbers have to be content-box or the comparison is off by
    // the padding: max-height below sizes the content box, while
    // scrollHeight counts the padding too. Read together, a quote of
    // exactly the limit measured a line and a bit over it and got
    // folded to a box it already fitted — a control, a mask and a
    // click, for nothing hidden.
    const style = getComputedStyle(quote);
    const lineHeight = parseFloat(style.lineHeight) || 20;
    const padding = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
    const content = quote.scrollHeight - padding;
    const limit = lineHeight * lines;
    // Half a line of slack, so a quote that spills by a word is left
    // alone rather than folded to save four pixels.
    if (content <= limit + lineHeight * 0.5) return false;

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

    // Clicking the clipped body opens it too — the mask is an obvious
    // "there is more here" and a reader should not have to find the
    // control to act on it. Not on a link, which is still a link.
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
    let folded = 0;
    for (const quote of quoteBlocks()) {
        // A quote nested inside one that is already folded would draw a
        // control nobody can reach until the outer one opens, and the
        // outer fold already hides it.
        if (quote.parentElement && quote.parentElement.closest('[data-rr-quote="folded"]')) continue;
        if (foldQuote(quote, lines)) folded += 1;
    }
    return folded;
}

/* ================= src/modules/quiet.js ================= */
/* ------------------------------------------------------------------
   Folding low-value replies.

   A release thread on this board runs to hundreds of posts and a good
   half of them are "thanks!", "+1", or a single emoji. They are not
   spam and they are not worth deleting — people say thank you and that
   is fine — but scrolling past forty of them to reach the next mirror
   is the second-worst thing about reading a long topic here.

   The prior art for this is a script that hid every post except the
   ones by a hardcoded list of trusted uploaders. That gets the right
   page for the wrong reason: the list ages badly, it silently buries
   whoever is not on it, and the day a regular posts a working mirror
   it is invisible. Nothing here knows who anybody is.

   What it reads instead is what the post says. A post carrying a link,
   a version number, code, a real image, a question mark or a word that
   reports a problem is never folded, whatever its length. What is left
   is short, says nothing on its own, and folds to one dim line that
   opens on a click.

   Folded, not removed: the reply stays where it is, laid out, in the
   accessibility tree and findable by find-in-page. The box drawn
   around it is smaller. That is the whole of it.
   ------------------------------------------------------------------ */

/* A short post that still reports something. "Link is dead" is four
   words and it is the most useful thing on the page. */
const QUIET_EXCLUDE_RE =
    /\b(dead|down|broken|offline|expired|removed|missing|error|crash(?:es|ing)?|fail(?:s|ed|ing)?|bug|fix(?:ed|es)?|issue|problem|virus|malware|help|404|not work|doesn'?t work|does not work|won'?t (?:start|launch|run)|please)\b/i;

/** Everything the post says on its own, quotes excluded. */
function quietText(post) {
    return ownContent(post.body).textContent.replace(/\s+/g, " ").trim();
}

/**
 * Is this reply short enough, and empty enough, to fold?
 *
 * Every test below is a reason *not* to fold. Nothing on this list is
 * about the author.
 */
function isQuietPost(post, limit) {
    const own = ownContent(post.body);
    const text = own.textContent.replace(/\s+/g, " ").trim();

    if (text.length > limit) return false;

    // A link, hidden or otherwise, is the whole reason this board
    // exists.
    if (own.querySelector(".link_removed")) return false;
    for (const link of own.querySelectorAll("a[href]")) {
        if (isOffsite(link.getAttribute("href"))) return false;
    }

    // Code, a spoiler or an attachment is content by itself.
    if (post.body.querySelector(".code, .codetitle, .spoiler, pre, .attachtitle")) return false;

    // A screenshot is an answer. A smiley is not.
    for (const img of post.body.querySelectorAll("img")) {
        const src = img.getAttribute("src") || "";
        if (!/smilies|images\/smil|imageset/i.test(src)) return false;
    }

    if (VERSION_RE.test(text)) return false;
    if (text.includes("?")) return false;           // a question is not chatter
    if (QUIET_EXCLUDE_RE.test(text)) return false;

    return true;
}

/** The one line a folded reply shows. */
function quietPreview(post) {
    const text = quietText(post);
    if (!text) return "(no text)";
    return text.length > 90 ? text.slice(0, 87) + "…" : text;
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

    // Clicking the clipped line opens it, the way clicking a folded
    // quote does. The chip stays for the keyboard.
    post.body.addEventListener("click", (event) => {
        if (!post.table.hasAttribute("data-rr-quiet")) return;
        if (event.target.closest("a, button, input, textarea, select")) return;
        setQuiet(post, false);
    });

    post.body.before(chip);
    setQuiet(post, true);
}

/**
 * One control in the topic bar, so the whole fold is reversible
 * without hunting for forty separate chips.
 */
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
        // The opening post of the topic sets it up, however short.
        if (index === 0 && PAGE.start === 0) return false;
        return isQuietPost(post, limit);
    });

    // Folding one reply out of thirty is not worth a control, and
    // folding every reply on the page means the heuristic is wrong.
    if (quiet.length < 2 || quiet.length > all.length - 1) return;

    for (const post of quiet) attachQuiet(post);

    const bar = document.querySelector(".rr-topicbar");
    if (bar) {
        // Acting on what is on this page, so the bar's first row.
        const row = bar.querySelector('.rr-topicbar__row[data-rr-row="here"]') || bar;
        const spacer = row.querySelector(".rr-topicbar__spacer");
        const control = buildQuietToggle(quiet);
        if (spacer) row.insertBefore(control, spacer);
        else row.append(control);
    }
    return quiet.length;
}

/* ================= src/modules/steam.js ================= */
/* ------------------------------------------------------------------
   Steam preview on hover.

   Three separate community scripts exist for this board whose whole
   purpose is putting a game's cover, score and release date next to a
   topic title, which makes it the clearest thing the board's readers
   have asked for that this script did not do.

   Two things about the way it is done here.

   First, the cheap half comes free. The game info card already reads
   an AppID out of the first post of every game topic it opens; that
   AppID is now written down against the topic id. So a topic you have
   opened previews instantly, from this browser, with nothing asked of
   any server. That is most of what a regular reader hovers.

   Second, the expensive half is opt-in and says so. Everything else in
   this script reads the page you are already on — the README promises
   that in as many words — and looking a game up on Steam breaks that
   promise. So the feature is off by default, the network half has its
   own switch on top, the settings panel says what it contacts, and on
   the Tor mirror the network half is refused outright whatever the
   setting says: someone reading this board over Tor did not ask to
   open a connection to Valve.

   CS.RIN.RU Enhanced also has a `topic_preview`, and this does not
   stand down for it: that one previews the text of a post in the
   thread, this one previews the game. They answer different questions,
   and Enhanced ships its own switched off.
   ------------------------------------------------------------------ */

const STEAM_APPS_KEY = "steamApps";       /* topic id -> AppID          */
const STEAM_DATA_KEY = "steamData";       /* AppID    -> { at, game }   */
const STEAM_MISS_KEY = "steamMisses";     /* title    -> { at, id }     */

const STEAM_HOVER_DELAY = 320;
const STEAM_HIDE_DELAY = 180;

/**
 * Why a lookup will not happen, or null if it can.
 *
 * Four different situations used to arrive at the card as the same
 * sentence — "Steam has nothing under that name" — including the one
 * where nothing was ever asked. Running this against the live board
 * for the first time is what showed it: the board's CSP is
 * `connect-src 'self'`, so without GM_xmlhttpRequest the request is
 * refused by the browser before it leaves, the promise rejects, and a
 * reader is told the game does not exist. Every game. Forever. With
 * nothing anywhere saying which of the four it was.
 */
function steamBlockedBecause() {
    if (!settings.get("steamLookup")) return "off";
    if (/\.onion$/i.test(location.hostname)) return "tor";
    // The board sends connect-src 'self'. GM_xmlhttpRequest is the
    // manager making the request instead of the page, and is not
    // subject to it; fetch is, everywhere except the test harness.
    if (typeof GM_xmlhttpRequest !== "function") return "nogrant";
    return null;
}

function steamNetworkAllowed() { return steamBlockedBecause() === null; }

/* ---- The cache ---------------------------------------------------- */

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

function steamCacheMs() {
    return clamp(Number(settings.get("steamCacheDays")) || 30, 1, 120) * 86400000;
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
    // Bounded, oldest first: this is a convenience cache, not an
    // archive, and a reader who hovers a lot should not fill their
    // extension storage with store copy.
    const keys = Object.keys(all);
    if (keys.length > 300) {
        keys.sort((a, b) => (all[a].at || 0) - (all[b].at || 0));
        for (const key of keys.slice(0, keys.length - 300)) delete all[key];
    }
    store.set(STEAM_DATA_KEY, all);
}

/* ---- Talking to Steam --------------------------------------------- */

/* The board's CSP sets connect-src 'self', so fetch() and XHR from the
   page are refused before they leave — silently, from the page's point
   of view, as a rejected promise indistinguishable from "no such
   game". GM_xmlhttpRequest is the manager making the request instead
   of the page and is not subject to that, so it is the only route that
   works here; steamBlockedBecause() refuses to start a lookup without
   it rather than letting one fail in a way nobody can read.

   fetch stays underneath for a manager that hands the grant over some
   other way, and for anywhere this runs without a CSP. */
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

/* One request at a time, spaced out. A listing has 108 titles on it
   and a reader dragging the pointer down the page must not turn into a
   hundred requests.

   The queue holds one *request*, deliberately, and not the operation
   around it. Looking a game up by name is two requests — find the id,
   then fetch the details — and an earlier version put that whole pair
   in the queue as one job. The second request then joined the queue
   behind a job that could not finish until the second request had
   finished: a lookup by name never came back, and the card sat on
   "Looking this one up" forever. Queue the leaves, compose above them. */
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

/** What the store returns, cut down to what the card shows. */
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

/* Every lookup answers { game, why }: the game when there is one, and
   otherwise which of the four reasons there is not. */
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

/**
 * A topic title, reduced to something the store can be asked about.
 *
 * Titles here read "[Release] Elden Ring (v1.16 + 5 DLCs + Multiplayer)
 * [Repack]". The prefix, the bracketed tails and the version are the
 * board's own bookkeeping, not the game's name.
 */
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
            // A miss is written down as firmly as a hit. Without that,
            // every hover over a topic Steam has never heard of — every
            // pinned announcement on the board — is another request.
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

/** Everything the card needs for one topic row, cache first. */
function steamLookForTopic(topicId, title) {
    const known = topicId && steamAppForTopic(topicId);
    if (known) return steamDetails(known);
    return steamResolveByName(title).then((result) => {
        if (result.game && topicId) steamRememberApp(topicId, result.game.appId);
        return result;
    });
}

/** What to put on the card when there is no game to put on it. */
const STEAM_EXCUSES = {
    off: "Not in this browser's cache. Turn on Steam lookups in settings, or open the topic once.",
    tor: "Not looked up over Tor. Open the topic once and it will be cached.",
    nogrant: "Could not reach Steam: the forum only allows the page to talk to itself, and your userscript manager has not granted GM_xmlhttpRequest. Everything already cached still works.",
    failed: "Could not reach Steam just now.",
    miss: "Steam has nothing under that name.",
};

/* ---- The card ----------------------------------------------------- */

function steamCard(game, term) {
    const card = el("div.rr-steam", { role: "tooltip" });

    if (game.header) {
        card.append(el("img.rr-steam__art", {
            src: game.header, alt: "", loading: "lazy", referrerpolicy: "no-referrer",
        }));
    }

    const head = el("div.rr-steam__head", {}, [
        el("span.rr-steam__name", {}, [game.name || term]),
    ]);
    if (game.score) {
        // Sorted into three bands rather than shown as a bare number,
        // which is the only part of a Metacritic score anyone reads.
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

function steamPlaceholder(text) {
    return el("div.rr-steam.rr-steam--quiet", { role: "tooltip" }, [
        el("div.rr-steam__facts", {}, [text]),
    ]);
}

/* ---- The hover behaviour ------------------------------------------ */

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

/** Put the card beside its link, flipped away from whichever edge it
    would otherwise run off. */
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
    shell.append(steamPlaceholder("Looking this one up…"));
    document.body.append(shell);
    steamPopover = shell;
    steamPlace(shell, link);

    // A card the pointer can reach, so its Store and SteamDB links are
    // clickable rather than vanishing on the way there.
    shell.addEventListener("mouseenter", () => clearTimeout(steamHideTimer));
    shell.addEventListener("mouseleave", () => { steamHideTimer = setTimeout(steamHide, STEAM_HIDE_DELAY); });

    steamLookForTopic(entry.id, entry.title).then((result) => {
        if (steamPopover !== shell || !document.contains(shell)) return;
        shell.textContent = "";
        if (result.game) shell.append(steamCard(result.game, steamSearchTerm(entry.title)));
        else shell.append(steamPlaceholder(STEAM_EXCUSES[result.why] || STEAM_EXCUSES.miss));
        steamPlace(shell, link);
    });
}

/**
 * One listener on the listing rather than one per row.
 *
 * A forum page carries 108 topic titles, and pointerover on the table
 * costs one handler instead of 216.
 */
function initSteamPreview() {
    if (!settings.get("steamPreview")) return;
    if (!PAGE.isForum && !PAGE.isIndex && !PAGE.isSearch) return;

    const byLink = new Map();
    for (const entry of topicRows()) byLink.set(entry.link, entry);
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

    // The same thing from the keyboard: a title reached by Tab shows
    // its card, and Escape puts it away.
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
/* ------------------------------------------------------------------
   Writing a reply.

   Replying means leaving the thread for posting.php and coming back,
   which loses your place in a 19 page topic. This fetches the real
   reply form and puts it at the foot of the thread.

   The form that gets submitted is the board's own, tokens and all:
   nothing here forges a post or works around a restriction. If the
   board would refuse the post, it still refuses it.
   ------------------------------------------------------------------ */

let quickReplyForm = null;

/* ---- Drafts --------------------------------------------------------

   A quick reply is written in a box at the foot of a page that is full
   of links, and following one of them throws it away — which is the
   oldest complaint about writing anything in a browser. Kept here
   against the topic id, in this browser, never sent anywhere, and
   dropped the moment the reply is submitted.
   -------------------------------------------------------------------- */

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

/** Fetch the reply page and lift its form out of the response. */
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

/**
 * Strip the form down to what a quick reply needs: the message box,
 * the hidden state, and one submit button. Preview, poll options and
 * attachment panels stay on the full page where they belong.
 */
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
    message.setAttribute("placeholder", "Write a reply");

    // What was being written last time, if anything. The board's own
    // form arrives empty, so this can only ever add.
    if (settings.get("saveDraft") && PAGE.topicId && !message.value.trim()) {
        const kept = draftFor(PAGE.topicId);
        if (kept) message.value = kept;
    }
    message.addEventListener("input", debounce(() => setDraft(PAGE.topicId, message.value), 400));

    // Submitted is the one thing that means "done with this".
    slim.addEventListener("submit", () => clearDraft(PAGE.topicId));

    slim.append(message);

    const submit = form.querySelector('input[name="post"]');
    const actions = el("div.rr-reply__actions", {}, [
        el("button.rr-btn", { type: "submit", name: "post", value: submit ? submit.value : "Submit", "data-variant": "primary" }, ["Post reply"]),
        el("a.rr-btn", {
            href: form.getAttribute("action"),
            "data-variant": "quiet",
            title: "Preview, attachments and the full toolbar",
        }, ["Open the full editor"]),
    ]);
    slim.append(actions);
    return { slim, message };
}

function buildQuickReply() {
    const holder = el("section.rr-reply", { "aria-label": "Quick reply" });
    const openButton = el("button.rr-btn", { type: "button", "data-variant": "primary" }, [
        icon("reply", 13),
        "Write a reply",
    ]);
    holder.append(openButton);

    // Say so on the button rather than only revealing it once opened:
    // an unsent reply nobody is told about is an unsent reply nobody
    // comes back to.
    const kept = settings.get("saveDraft") && PAGE.topicId ? draftFor(PAGE.topicId) : "";
    if (kept) {
        openButton.lastChild.textContent = "Finish your reply";
        openButton.setAttribute("title", kept.slice(0, 120));
        holder.setAttribute("data-rr-draft", "");
    }

    const setLabel = (text) => {
        // textContent would take the icon with it, and the button comes
        // back without one after a failure.
        const label = openButton.lastChild;
        if (label && label.nodeType === 3) label.textContent = text;
        else openButton.append(document.createTextNode(text));
    };

    openButton.addEventListener("click", async () => {
        openButton.disabled = true;
        setLabel("Loading the reply form…");
        try {
            const form = await fetchReplyForm();
            const { slim, message } = slimReplyForm(form);
            openButton.remove();
            holder.append(slim);
            quickReplyForm = message;
            message.focus();
            // Caret at the end of what was already written, not in
            // front of it.
            message.setSelectionRange(message.value.length, message.value.length);
        } catch (err) {
            console.warn("[RIN Reforged] quick reply:", err);
            openButton.disabled = false;
            setLabel("Write a reply");
            toast("Could not load the reply form. Opening the full editor instead.");
            const link = document.querySelector('a[href*="mode=reply"]');
            if (link) location.href = link.getAttribute("href");
        }
    });

    return holder;
}

/* ---- Quote what is selected --------------------------------------- */

/**
 * Selecting text inside a post offers a Quote button. It goes into the
 * quick reply if it is open, and onto the clipboard if it is not.
 */
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
                    toast("Added to your reply");
                } else if (settings.get("saveDraft") && settings.get("quickReply") && PAGE.topicId) {
                    // No box open: it goes into the draft for this
                    // topic, so opening the reply later finds it there.
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

/* ---- Entry point ---------------------------------------------------- */

function initCompose() {
    if (!PAGE.isTopic) return;
    if (!isLoggedIn()) return;                 // both features need an account

    if (settings.get("quickReply")) {
        // The board answers "can this person reply here?" by printing a
        // reply link, or not printing one. That is the whole test.
        //
        // The previous check read `img[alt*=locked], a[mode=reply]` and
        // treated a match as "not locked" — so a locked topic, which
        // shows a padlock and no reply link, matched on the padlock and
        // got a reply box that could only ever be refused on submit.
        const canReply = Boolean(document.querySelector('a[href*="mode=reply"]'));
        const anchor = document.querySelector("#pagecontent") || document.querySelector("#wrapcentre");
        if (anchor && canReply) anchor.append(buildQuickReply());
    }

    if (settings.get("selectionQuote")) initSelectionQuote();
}

/* ================= src/modules/people.js ================= */
/* ------------------------------------------------------------------
   People.

   phpBB has a foe list, but it lives four clicks deep in the control
   panel and only takes effect on the next page load. This is the local
   version: a per-post control, applied immediately, stored in this
   browser, and never sent anywhere.

   Hidden posts are collapsed to one line rather than removed, so a
   thread does not silently lose replies people are answering.

   Entries key on the member id the board threads through every profile
   link, not on the display name, because a name is not a person: this
   board renames, and the first version of this lost the entry the day
   somebody did. The name is stored alongside so the list stays
   readable in an export, and so a post with no profile link — a
   deleted account, a guest — can still be matched on what it has.
   ------------------------------------------------------------------ */

/**
 * Entries are { id, name }. Anything an older version stored is a bare
 * string, read here as a name-only entry rather than migrated on read:
 * it upgrades itself the next time that person is hidden, and until
 * then it goes on working exactly as it did.
 */
function hiddenPeople() {
    return store.get("hiddenUsers", []).map((entry) =>
        (typeof entry === "string" ? { id: null, name: entry } : entry));
}

/** The member id in a profile link, which survives a rename. */
function personId(post) {
    const link = post.table && post.table.querySelector('a[href*="mode=viewprofile"]');
    const match = link && (link.getAttribute("href") || "").match(/[?&]u=(\d+)/);
    return match ? match[1] : null;
}

/** Who this post is by, as far as anything here is concerned. */
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

/** Collapse a post to a single line that says whose it is. */
function applyHidden(post, name) {
    if (post.table.querySelector(".rr-hidden-note")) return;

    const cell = post.body.closest("td");
    if (!cell) return;

    const restore = el("button.rr-btn", { type: "button", "data-variant": "quiet" }, ["Show"]);
    const note = el("div.rr-hidden-note", {}, [
        el("span", {}, ["Post by " + name + " is hidden"]),
        restore,
    ]);

    // Remember what was already hidden before this ran — a folded Steam
    // description, a collapsed signature — so bringing the post back
    // does not also unfold everything the reader had folded.
    const covered = Array.from(cell.children).filter((child) => !child.hidden);
    for (const child of covered) child.hidden = true;
    cell.prepend(note);

    const reveal = () => {
        for (const child of covered) child.hidden = false;
        note.remove();
        delete post.table.rrReveal;
    };
    restore.addEventListener("click", reveal);
    // Kept on the node rather than in a map: the post objects are
    // rebuilt by every caller's own posts() pass, the DOM is not.
    post.table.rrReveal = reveal;
}

/** Every post on this page by the same person. */
function postsBy(person) {
    return posts().filter((post) => {
        const other = personOf(post);
        if (!other) return false;
        return person.id && other.id ? person.id === other.id : other.name === person.name;
    });
}

/** Put every post by this person back, without a page load. */
function revealPerson(person) {
    for (const post of postsBy(person)) {
        if (typeof post.table.rrReveal === "function") post.table.rrReveal();
    }
}

function addHideControl(post) {
    if (!post.head && !post.headCell) return;
    const person = personOf(post);
    if (!person) return;

    const label = (hidden) => (hidden ? "Show posts by " : "Hide posts by ") + person.name;

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
            // Reversed in place. Reloading was the old answer and it
            // threw away the reader's position in a nineteen page
            // thread, and any reply they had half written, to undo a
            // click they had just made by mistake.
            revealPerson(person);
        }

        // Every post by this person carries one of these; they all say
        // the same thing, so they all have to be told.
        for (const other of document.querySelectorAll('.rr-posttools [data-rr-hide="' + CSS.escape(person.name) + '"]')) {
            other.setAttribute("aria-pressed", next ? "true" : "false");
            other.setAttribute("title", label(next));
            other.setAttribute("aria-label", label(next));
        }
    });
    button.setAttribute("data-rr-hide", person.name);

    // Per-post actions are a separate setting, and they build the strip
    // this control used to be appended to. With them off the control
    // silently never appeared, though its own switch said it was on —
    // so a strip is made here when there is not one already.
    const holder = post.head || post.headCell;
    let tools = holder.querySelector(".rr-posttools");
    if (!tools) {
        tools = el("div.rr-posttools");
        holder.append(tools);
    }
    tools.append(button);
    labelled(button, button.getAttribute("title") || "Hide posts by this member");
    button.setAttribute("data-rr-tip-side", "above");
}

/* ---- First unread --------------------------------------------------- */

/**
 * phpBB can jump to the first unread post, but only from a link in the
 * topic list. Inside a topic there is no way back to it.
 */
function addUnreadJump(bar) {
    if (!bar || !PAGE.topicId) return;

    const url = new URL("./viewtopic.php", location.href);
    if (PAGE.forumId) url.searchParams.set("f", String(PAGE.forumId));
    url.searchParams.set("t", String(PAGE.topicId));
    url.searchParams.set("view", "unread");

    const link = el("a.rr-btn", {
        href: url.toString() + "#unread",
        "data-variant": "quiet",
        title: "Jump to the first post you have not read",
    }, [icon("arrowDown", 13), "First unread"]);

    // The first row is what you do to the topic in front of you, which
    // is what this is. Without the row it falls back to the bar.
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

/* ================= src/modules/palette.js ================= */
/* ------------------------------------------------------------------
   Command palette.

   The forum has one search box that reloads the page, and no way to
   reach a board without going back to the index. Ctrl+K covers both,
   plus bookmarks, recent topics and every script action.

   The forum list is cached the first time the index is visited, so the
   jump list keeps working from any page.
   ------------------------------------------------------------------ */

let paletteHost = null;

/* ---- Searching the board ------------------------------------------ */

/* phpBB takes two parameters that decide whether a search answers with
   one row per topic or one row per matching post, and how deep in a
   post it looks. The board's own boxes set them: "Search this forum"
   ships sr=topics and sf=titleonly, and has done for years.

   This script's own search box did not. Left unset, phpBB falls back to
   sr=posts and sf=all, which searches the raw text of every post — and
   the raw text of a post includes the quote it opens with. A thread
   where twelve people quoted the same release came back as twelve
   results, all pointing at the same thread. Same duplication as the
   finder had, one layer down.

   sr=topics is the answer to that and costs nothing: a topic that
   matches is still a topic that matches. sf decides how deep to look,
   and that is a real choice, so it is a setting. */
const SEARCH_DEPTH = {
    titles:    { sf: "titleonly", hint: "titles" },
    firstpost: { sf: "firstpost", hint: "titles + first post" },
    everything:{ sf: "all",       hint: "every post" },
};

/**
 * The board's search URL for a query, from wherever the reader is.
 * Scoped to the current board when there is one, the way the board's
 * own "Search this forum" box is.
 */
function boardSearchUrl(query) {
    const depth = SEARCH_DEPTH[settings.get("searchDepth")] || SEARCH_DEPTH.titles;
    const url = new URL("./search.php", location.href);
    url.searchParams.set("keywords", query);
    url.searchParams.set("terms", "all");
    url.searchParams.set("sf", depth.sf);
    url.searchParams.set("sr", "topics");
    if ((PAGE.isForum || PAGE.isTopic) && PAGE.forumId) {
        url.searchParams.set("fid[]", String(PAGE.forumId));
    }
    return url.toString();
}

function cacheForumList() {
    if (!PAGE.isIndex) return;

    const forums = forumRows().map((entry) => {
        // The topic count sits in the cell the listing labels "topics";
        // it is the only ranking signal on the page, and it puts Main
        // Forum above boards nobody posts in.
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
}

/** The board's own donation link, wherever the template put it. */
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
        // The board is hosted on donations and is asking for them. The
        // masthead's own link is lifted into the board bar; this is the
        // same destination, reachable from anywhere without going back
        // to the top of the page.
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

    const bookmarks = store.get("bookmarks", []);
    if (bookmarks.length) {
        groups.push({
            title: "Bookmarks",
            items: bookmarks.map((item) => ({
                label: item.title, icon: "star", hint: "topic", href: item.href,
            })),
        });
    }

    const forums = store.get("forums", []);
    if (forums.length) {
        groups.push({
            title: "Boards",
            items: forums.map((item) => ({
                label: item.title, icon: "layers", hint: "board", href: item.href,
            })),
        });
    }

    const history = store.get("history", []);
    if (history.length) {
        groups.push({
            title: "Recent",
            items: history.slice(0, 12).map((item) => ({
                label: item.title, icon: "clock", hint: "topic", href: item.href,
            })),
        });
    }

    groups.push({ title: "Actions", items: paletteActions() });
    return groups;
}

function openPalette() {
    if (paletteHost) return;
    // The settings panel and the shortcut sheet are modal. Ctrl+K over
    // one of them used to draw the palette on top, with two focus traps
    // fighting over Tab and Escape closing whichever listener ran last.
    if (document.querySelector(".rr-panel, .rr-sheet")) return;

    const groups = collectItems();
    const input = el("input.rr-palette__input", {
        type: "text",
        placeholder: "Search the forum, or jump to a board",
        "aria-label": "Search or jump to",
        autocomplete: "off",
        spellcheck: "false",
        role: "combobox",
        "aria-expanded": "true",
        "aria-controls": "rr-palette-list",
        "aria-autocomplete": "list",
    });
    // A listbox nobody is told about. The input is what has focus, so
    // the highlighted option has to be named on the input — without
    // aria-activedescendant a screen reader reads the box and never
    // says what pressing Enter would do.
    const list = el("ul.rr-palette__list", { role: "listbox", id: "rr-palette-list" });
    const panel = el("div.rr-palette", { role: "dialog", "aria-modal": "true", "aria-label": "Command palette" }, [input, list]);
    const overlay = el("div.rr-overlay", {}, [panel]);

    let flat = [];
    let cursor = 0;

    const searchItem = (query) => ({
        label: "Search the forum for " + query,
        icon: "search",
        hint: SEARCH_DEPTH[settings.get("searchDepth")]?.hint || "Enter",
        href: boardSearchUrl(query),
    });

    const render = (query) => {
        list.textContent = "";
        flat = [];
        const needle = query.trim().toLowerCase();

        if (needle) list.append(renderGroup("Search", [searchItem(query.trim())], flat));

        for (const group of groups) {
            const matches = needle
                ? group.items.filter((item) => item.label.toLowerCase().includes(needle)).slice(0, 8)
                : group.items.slice(0, group.title === "Boards" ? 7 : 6);
            if (matches.length) list.append(renderGroup(group.title, matches, flat));
        }

        if (!flat.length) list.append(el("div.rr-palette__empty", {}, ["Nothing matches that"]));
        cursor = 0;
        highlight();
    };

    const renderGroup = (title, items, sink) => {
        const fragment = document.createDocumentFragment();
        fragment.append(el("li.rr-palette__group", { role: "presentation" }, [title]));
        for (const item of items) {
            // An entry that navigates carries its URL. A listbox option
            // cannot be an <a> without breaking the role, so the URL
            // rides on the element and middle-click and Ctrl+click are
            // handled here — opening a board or a bookmark in a new tab
            // is the first thing anyone tries.
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
            fragment.append(node);
        }
        return fragment;
    };

    const highlight = () => {
        flat.forEach((node, index) => node.setAttribute("aria-selected", index === cursor ? "true" : "false"));
        const current = flat[cursor];
        if (current) {
            current.scrollIntoView({ block: "nearest" });
            input.setAttribute("aria-activedescendant", current.id);
        } else {
            input.removeAttribute("aria-activedescendant");
        }
    };

    const previous = document.activeElement;
    let release = () => {};
    const close = () => {
        overlay.remove();
        paletteHost = null;
        release();
        document.removeEventListener("keydown", onKey, true);
    };

    const onKey = (event) => {
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
    document.addEventListener("keydown", onKey, true);

    document.body.append(overlay);
    paletteHost = overlay;
    render("");
    release = trapFocus(panel, previous instanceof HTMLElement ? previous : null);
    input.focus();
}

function initPalette() {
    cacheForumList();
    if (!settings.get("palette")) return;
    document.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            openPalette();
        }
    });
}

/* ================= src/modules/shortcuts.js ================= */
/* ------------------------------------------------------------------
   Keyboard navigation.

   Single-key bindings only fire when nothing is focused that would
   swallow them, so typing "j" in the reply box still types a j.
   ------------------------------------------------------------------ */

const SHORTCUTS = [
    { keys: "Ctrl K", what: "Search or jump to anything" },
    { keys: "j / k", what: "Next / previous post" },
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
    let target = null;
    if (direction > 0) {
        target = anchors.find((node) => node.getBoundingClientRect().top + window.scrollY > top + 10);
    } else {
        for (const node of anchors) {
            if (node.getBoundingClientRect().top + window.scrollY < top - 10) target = node;
        }
    }
    if (!target) target = direction > 0 ? anchors[anchors.length - 1] : anchors[0];
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 60, behavior: scrollBehaviour() });
}

function goPage(direction) {
    const info = pagination();
    const href = direction > 0 ? info.next : info.previous;
    if (href && (direction > 0 ? info.hasNext : info.hasPrevious)) location.href = href;
    else toast(direction > 0 ? "Last page" : "First page");
}

let shortcutSheet = null;

function openShortcutSheet() {
    // Pressing ? twice used to stack a second copy over the first, and
    // Escape only ever closed the top one.
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
        // Any of the script's own dialogs owns the keyboard while open.
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
            // Anything else was not a g-prefixed jump. Falling through
            // rather than returning means "g" then "j" still moves a
            // post, instead of being swallowed as a mistyped chord.
        }

        switch (key) {
            case "g":
                awaitingG = true;
                gTimer = setTimeout(() => { awaitingG = false; }, 900);
                break;
            case "j": event.preventDefault(); scrollToPost(1); break;
            case "k": event.preventDefault(); scrollToPost(-1); break;
            case "n": goPage(1); break;
            case "p": goPage(-1); break;
            case "r": {
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
/* ------------------------------------------------------------------
   Page furniture: reading progress and the floating jump buttons.

   Both are position:fixed and outside the forum markup, so neither can
   push the layout around.
   ------------------------------------------------------------------ */

/**
 * How far down the page you are.
 *
 * This is a *reading* indicator and it was drawn exactly like a
 * *loading* one: a thin accent-coloured bar pinned to the top left
 * corner of the window, which is where every browser and half the web
 * puts the thing that fills up while a page arrives. On a long topic
 * opened at a saved position it therefore appeared already part-filled
 * and then sat there, and read as a download that had stalled at 15%
 * and never finished — which is exactly what it was reported as.
 *
 * Nothing about the measurement was wrong. Three things about the
 * presentation were:
 *
 *  - it floated at y=0 rather than belonging to anything, so it now
 *    sits on the bottom edge of the sticky top bar and reads as that
 *    bar's own rule filling in;
 *  - it appeared at page load already part-way along, so it now stays
 *    out of the way until the page has actually been scrolled;
 *  - it said nothing about itself, so it is a real progressbar with a
 *    name and a value that can be read aloud and asserted in a test.
 */
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
        // A page with nothing below the fold has no progress to report,
        // and a page still at the top has not started.
        bar.toggleAttribute("data-rr-idle", scrollable <= 0 || percent < 0.5);
        ticking = false;
    };
    on(window, "scroll", () => {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    // A page that grows after load — images arriving, a spoiler opened,
    // the releases panel filling in — changes the denominator, and
    // without this the bar keeps answering the old question until the
    // next scroll.
    if (window.ResizeObserver) new ResizeObserver(() => update()).observe(document.documentElement);
    update();
}

/* The two floating buttons.

   A rounded square in the bottom right corner with a single downward
   arrow in it and no words anywhere near it is the least phpBB thing
   on the page, and it was reported as exactly that: an unidentifiable
   control. It had a `title`, which is a second of hovering away and
   invisible to anyone who never hovers it.

   So both get the same instant label the top bar's icons now get,
   drawn above and to the right so it stays inside the window in the
   one corner where a centred tooltip could not. */
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

    const down = tip(el("button", { type: "button" }, [icon("arrowDown")]),
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
    update();
}

/** The board renders a donation overlay on every visit until its cookie
    is set. Nothing here removes it; it is only made keyboard-closable,
    which the original markup is not. */
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
/* ------------------------------------------------------------------
   Boot.

   Two phases:
     document-start  theme attributes and the stylesheet, so the old
                     styling never flashes
     DOM ready       everything that needs the markup

   Each module is wrapped so one failure cannot take the rest of the
   script down with it; a broken feature should leave a readable forum,
   not a blank page.
   ------------------------------------------------------------------ */

const RR_VERSION = "0.8.3";

function injectStyles() {
    const host = document.head || document.documentElement;
    if (!host || document.getElementById("rr-style")) return;
    const style = document.createElement("style");
    style.id = "rr-style";
    style.textContent = RR_CSS;
    host.append(style);
}

/** CS.RIN.RU Enhanced is widely installed and overlaps in a few places.
    When both are running, the older script keeps the features it
    already owns. */
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

function bootEarly() {
    registerSchema(SETTINGS_SCHEMA);
    guard("theme", initTheme);
    injectStyles();
}

function bootLate() {
    guard("coexistence", detectEnhanced);
    guard("icons", initIcons);
    guard("navbar", initNavbar);
    guard("lists", initLists);
    guard("index", initBoardIndex);
    guard("topic", initTopic);
    guard("releases", initReleases);
    guard("quotes", initQuotes);
    guard("quiet", initQuiet);
    guard("steam", initSteamPreview);
    guard("compose", initCompose);
    guard("people", initPeople);
    guard("palette", initPalette);
    guard("shortcuts", initShortcuts);
    guard("crumbs", tidyCrumbStrip);
    guard("spacing", dropStrayBreaks);
    guard("separators", dropStraySeparators);
    guard("numbers", groupBoardNumbers);
    guard("ink", readableBoardInk);
    guard("chrome", initChrome);
    guard("menu", initSettingsUI);

    // Enhanced runs at document-idle, so a second look after the page
    // settles catches it when it loads after this script.
    setTimeout(() => guard("coexistence", detectEnhanced), 2000);
}

// documentElement can still be missing at document-start, so the early
// phase waits for it rather than assuming the parser got there first.
// Each phase is guarded on its own: one failing must not stop the next
// from being scheduled.
guard("boot:early", () => whenRoot(bootEarly));
guard("boot:styles", () => whenBody(() => guard("styles", injectStyles)));
guard("boot:late", () => whenReady(bootLate));

})();

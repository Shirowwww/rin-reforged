// ==UserScript==
// @name            RIN Reforged
// @name:fr         RIN Reforged
// @namespace       https://github.com/Shirowwww/rin-reforged
// @version         0.13.0
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

    /* The sticky top bar's height, so anything that has to sit on its
       edge does not carry its own copy of the number. */
    --rr-nav-h: 48px;

    /* Two radii, one for a control and one for a card, both a shade
       tighter than they were: 12px corners on every card down a page
       of cards is most of what made the page read as a template. */
    --rr-radius:      6px;
    --rr-radius-lg:   9px;
    --rr-radius-pill: 999px;

    /* Only genuinely floating things cast a shadow. Surfaces separate
       by value and a hairline instead. */
    --rr-shadow-pop: 0 8px 24px -6px rgba(0, 0, 0, .55), 0 2px 6px rgba(0, 0, 0, .35);

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

    /* How wide the page frame gets. Fluid with a ceiling, because a
       fixed column is right for prose and wrong for a frame that also
       holds a six-column listing, a pager and the releases panel.

       Two tokens, two jobs: this sizes the frame, --rr-measure caps
       the line length of anything read as prose, so widening one does
       not lengthen the other. */
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
    /* The ladder, spread.
     *
     * bg and surface were seven points apart, which on a page that is
     * a column of cards means the cards do not lift off it: the only
     * thing saying where one ends was a hairline barely lighter than
     * either. The ground goes down rather than the cards going up —
     * the cards are where the reading happens and their value is
     * measured (see --rr-faint) — which also lands this theme nearer
     * the board's own #070707 than it was, at no cost to the
     * anti-halation reasoning at the top of this file: #0b0b0b is
     * still off pure black, and nothing on this theme paints text
     * straight onto it. The hairlines come up to match. */
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
    /* "No blue cast" has to include the links, which stayed Slate's
       blue: a warm, desaturated tone for them. The tags keep their
       hues — Info is blue on every theme, and that is what makes it
       readable as Info. */
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
    /* The board writes its forum-rules notice in #FFCC00, typed into
       the tag. On the dark themes that is 10:1 and exactly the
       emphasis it was meant to carry, so they leave it alone; on this
       one it is 1.4:1. Same hue, dark enough to read on --rr-surface-2
       (forum.css, the forum-rules notice). */
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
/* Full lifts the frame's ceiling — a listing wants the whole window —
   but a post is still prose: 120ch is half again Wide's measure, and
   short of the 300-character lines \`none\` gave a 2560px screen. */
html[data-rr][data-rr-width="full"]  { --rr-content-max: none;              --rr-measure: 120ch; }

/* Reading, on a topic page: the frame closes in on the text. At 1560px
   a post card was 1180px wide around 730px of prose, a two-fifths dead
   strip beside every post on a 1920 or 2560 monitor. 1440 is the
   narrowest the board bar's two groups of links still share one line.
   A listing keeps the full frame; it has columns to fill it with. */
html[data-rr][data-rr-width="reading"][data-rr-page="topic"] { --rr-content-max: min(1440px, 95vw); }

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

/* A page short enough to need no scrollbar is 15px wider, and
   everything centred in it moves 8px between one page and the next.
   The gutter is reserved either way — on a desktop. The narrow layout
   is fluid and centres nothing, and a classic scrollbar's 15px is a
   quarter of a topic bar's spare room at 390px. */
@media (min-width: 861px) {
    html[data-rr] { scrollbar-gutter: stable; }
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

/* Held back until the script has rebuilt the page (main.js,
   markReady), so the board's own layout in these colours is never
   painted for a frame before everything jumps into place. The
   attribute lands whatever happens, on a watchdog if nothing else, so
   this can never leave a blank page.

   The root carries the page colour too: with the body hidden there is
   nothing else to paint the window the theme's own dark.

   \`opacity\`, not \`visibility\`, and the difference measured 44ms on a
   listing: \`visibility\` is inherited, so lifting the gate recalculates
   every element under <body>. \`opacity\` is not. */
html[data-rr] { background: var(--rr-bg); }
html[data-rr]:not([data-rr-ready]) body,
html[data-rr]:not([data-rr-ready]) body.ltr { opacity: 0; }

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
/* Replaced, not merely covered: the bar, the board links row and the
   masthead are all built out of what is in here. Keyed on whether
   anything replaced it rather than on the bar alone — with the bar
   off and the board links on, uncovering the original left the two
   headers stacked. */
html[data-rr][data-rr-header="rr"] #wrapheader { display: none; }

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
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius-lg);
    border-spacing: 0 !important;
    border-collapse: separate;
    overflow: hidden;
    width: 100%;
}
/* A listing clips its corners the same way, but \`clip\` does not make
   the table a scroll container — which \`hidden\` does, and a heading
   inside a scroll container that never scrolls can never stick. */
html[data-rr] table.tablebg[data-rr-list] { overflow: clip; }

/* A post's table clips nothing. Its controls draw their names above
   themselves on hover, and the header strip they sit in is the top of
   the table: with overflow hidden the tooltip was cut to a sliver
   along the post's top edge, which is what was reported as "the
   tooltips go behind the post". The table paints its own surface and
   the cells go transparent, so the corners stay rounded without the
   clip. */
html[data-rr] table.tablebg[data-rr-post] {
    overflow: visible;
    background: var(--rr-surface);
    /* The inside edge of a post, named once: the author band pulls
       itself back out to it (ui.css, .rr-posthead). */
    --rr-post-pad: 18px;
    --rr-post-pad-top: 12px;
}
html[data-rr] table.tablebg[data-rr-post] > tbody > tr,
html[data-rr] table.tablebg[data-rr-post] > tbody > tr > td.row1,
html[data-rr] table.tablebg[data-rr-post] > tbody > tr > td.row2 { background: transparent; }
/* And a little more room inside than a listing row gets: a post is
   read, a row is scanned. Not a folded reply, which owns its own
   padding (features.css) and is one line by design.

   \`tr.row1 > td\` as well as \`td.row1\`: this board writes the class on
   the row and leaves the cells bare, so the cell branch alone never
   matched a single post here. The inset was the 4px the original
   sheet pads a cell with, while the author band pulled itself out by
   the 18px it was promised — which is how the band came to draw wider
   than the card it heads. */
html[data-rr] table.tablebg[data-rr-post]:not([data-rr-quiet]) > tbody > tr > td.row1,
html[data-rr] table.tablebg[data-rr-post]:not([data-rr-quiet]) > tbody > tr > td.row2,
html[data-rr] table.tablebg[data-rr-post]:not([data-rr-quiet]) > tbody > tr.row1 > td,
html[data-rr] table.tablebg[data-rr-post]:not([data-rr-quiet]) > tbody > tr.row2 > td {
    padding: var(--rr-post-pad-top) var(--rr-post-pad) 14px;
}
/* subsilver2 wraps the message in one more table at cellspacing="5",
   and the original sheet pads every cell. That is 7px of chrome
   between the cell the band lives in and the cell that carries the
   post's own inset, and the band cleared the card by exactly that
   much. Flattened here so --rr-post-pad is the only inset there is.
   Direct children only: a quote or a code block is a table too, and
   deeper in. */
html[data-rr] table.tablebg[data-rr-post] > tbody > tr > td > table { border-spacing: 0; }
html[data-rr] table.tablebg[data-rr-post] > tbody > tr > td > table > tbody > tr > td { padding: 0; }

/* The original stylesheet paints \`th a\` #CCCCCC: on the light theme the
   member list's sortable headers were pale grey on paler grey while
   the two headers without a link read fine. */
/* The board's rule is \`th a, th a:visited { color: #CCCCCC !important }\`
   and its sheet loads after this one, so nothing short of the same
   flag reaches it. */
html[data-rr] th a,
html[data-rr] th a:visited { color: inherit !important; }
html[data-rr] th a:hover { color: var(--rr-text-strong) !important; text-decoration: none; }
/* The column headings: a darker strip, small muted caps. Darker than
   the rows rather than lighter, so it can never be taken for one of
   the section rows below it, which are the lighter, bolder kind of
   band. Two kinds of band, two tones, and they used to be one. */
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

/* Category bars are the one piece of phpBB furniture worth keeping:
   every board has them, and a tinted bar with an accent mark reads as
   a section head at a glance. Toned right down from the original.

   The mark is a short rounded bar drawn inside the cell, not a stripe
   down its left edge: the stripe ran into the table's rounded corner
   and came out cut at an angle on the first row of every card. */
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
    /* The board's own stylesheet pins these at \`height: 25px\`. One line
       of a section heading fits and nothing shows it — but the same
       class carries the "Display posts from previous / Sort by / Go"
       strip, and on a phone that wraps to two lines and spilled out of
       the box: three controls drawn below the card they belong to, on
       top of the pagination line under it. The heading row beside this
       one already had to say the same thing. */
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

/* A category row is one cell plus a few empty ones the table needs to
   keep its columns. Tinting the whole row stops it reading as a bar
   that runs out halfway across.

   And a stronger hairline than a listing row gets: the index stacks
   two category headings straight on top of each other — a collapsed
   category has nothing between them — and at --rr-line, a hair off the
   tint itself, the pair read as one slab with two titles in it. */
html[data-rr] tr[data-rr-cat-row] > td {
    background: color-mix(in srgb, var(--rr-accent) 5%, var(--rr-surface-2));
    border-bottom: 1px solid var(--rr-line-strong);
}
/* The strips that are not section heads — "Mark forums read" alone at
   the right, the sort controls — are plain. */
html[data-rr] tr[data-rr-cat-row="plain"] > td,
html[data-rr] tr[data-rr-cat-row="controls"] > td { background: var(--rr-surface-2); }

/* The collapse control (boardindex.js, tidyCategoryToggles). The
   board's own <input> is hidden and clicked from here: a chevron next
   to the words it folds, pointing the way the click will move things,
   on a cell that folds on a click of its own. The cell it used to sit
   in is empty now and keeps the columns lined up. */
html[data-rr] td.catdiv { text-align: right; }
html[data-rr] td.cat.rr-catfold-cell { cursor: pointer; user-select: none; }
html[data-rr] tr[data-rr-cat-row] > td.cat.rr-catfold-cell:hover {
    background: color-mix(in srgb, var(--rr-accent) 10%, var(--rr-surface-2));
}
/* The heading is a block, and the chevron would sit on a line of its
   own above it. */
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

/* Some .cat cells are not section heads at all: they hold the print /
   previous / next strip, or the "Display posts from previous / Sort by
   / Go" controls a listing ends with. Those get the surface without
   the accent — the tinted edge marks a block of content, and a row of
   form controls is not one. */
/* Named by lists.js (markShapes): "controls" for a cell holding a
   table, a select or a submit; "plain" for "Mark forums read" alone at
   the right of an otherwise empty band, which the index writes straight
   into the cell and the listing wraps in a table. Neither is a heading. */
html[data-rr] td.cat[data-rr-cat] {
    background: var(--rr-surface-2);
    padding-left: var(--rr-s3);
    font-weight: 400;
}
html[data-rr] td.cat[data-rr-cat="controls"] a { color: var(--rr-muted); font-weight: 500; }
html[data-rr] td.cat[data-rr-cat="controls"] a:hover { color: var(--rr-text-strong); }

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

   Banding is how a reader tracks one topic's title across to its last
   post without losing the line, and the board's own row1/row2 cannot
   draw it: it alternates them across the columns of a single row. So
   the shade is read off an attribute lists.js writes on the row
   (restripe), which covers every cell of it — the marker gutter the
   template gives a class of its own included.

   Only listings: in a topic the same classes wrap whole posts, and
   striping those would band the thread rather than the rows. */
/* Only while the table is still a grid. On a phone a row is a card,
   the shade is the card's, and the counters are painted out with
   !important — a stripe on the cells there would draw half a row. */
@media (min-width: 861px) {
    html[data-rr] table[data-rr-list] > tbody > tr[data-rr-stripe] > td { background: var(--rr-surface); }
    html[data-rr] table[data-rr-list] > tbody > tr[data-rr-stripe="b"] > td { background: var(--rr-surface-2); }
    html[data-rr] table[data-rr-list] > tbody > tr[data-rr-stripe]:hover > td { background: var(--rr-surface-3); }
}
/* Under that width, and on a listing this script could not read the
   shape of, the board's own banding is what is left. */
html[data-rr] table[data-rr-list] td.row2 { background: var(--rr-surface-2); }
/* On the member list the post count sits right-aligned against the
   rank's left edge — "147 Advanced forumer" read as one string. A
   gutter after the numbers, on the header too so they stay aligned. */
html[data-rr] table[data-rr-list] th[data-rr-col="posts"],
html[data-rr] table[data-rr-list] td[data-rr-col="posts"] { padding-right: 28px; }

/* The member list stripes its rows rather than its cells: <tr
   class="row2"> over plain td.gen. The same shade, read off the row. */
html[data-rr] table[data-rr-list] > tbody > tr.row2 > td { background: var(--rr-surface-2); }
html[data-rr] table[data-rr-list] > tbody > tr.row1:hover > td,
html[data-rr] table[data-rr-list] > tbody > tr.row2:hover > td { background: var(--rr-surface-3); }

/* Whole-row hover, which the table markup cannot express by itself.
   Only on a listing: the same two classes wrap the Who is online
   block, the login form and a profile's cells, and lighting a whole
   block up because the pointer crossed it promised a click that led
   nowhere. */
html[data-rr] table[data-rr-list] tr:hover > td.row1,
html[data-rr] table[data-rr-list] tr:hover > td.row2 { background: var(--rr-surface-3); }
/* And a whole-row click (lists.js): the title cell's empty three
   quarters open the topic too, so the hover is not a promise the row
   fails to keep. */
html[data-rr] table[data-rr-list][data-rr-rowclick] td[data-rr-col="title"] { cursor: pointer; }
html[data-rr] table[data-rr-list][data-rr-rowclick] td[data-rr-col="title"] a,
html[data-rr] table[data-rr-list][data-rr-rowclick] td[data-rr-col="title"] button { cursor: pointer; }
/* The words beside a lone checkbox toggle it (lists.js). */
html[data-rr] td[data-rr-check-label] { cursor: pointer; }

/* The last row of a card sits on the rounded bottom edge and wants no
   hairline over it. \`tr:last-child\` alone said that of the last row of
   every <tbody>, and the index opens one per category (\`flist26\`,
   \`flist27\`) so it can show and hide them: each category heading, being
   the last row of the tbody before it, lost its underline, and two
   headings in a row read as one slab with two titles in it. */
html[data-rr] table > tbody:last-child > tr:last-child > td { border-bottom: 0; }

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

/* The title column's 100% starves the Last post column on a search
   results page, where the titles are long: 108px wide and three lines
   tall on "View your posts". A floor wide enough for a date and a name
   keeps it on one line and hands the rest to the title. */
html[data-rr] table[data-rr-list] td[data-rr-col="last"] { min-width: 17ch; }
@media (min-width: 861px) {
    /* One line by construction; if the column is too narrow the table
       hands it width off the title rather than breaking the arrow onto
       a second line. */
    html[data-rr] table[data-rr-list] .rr-lastpost { white-space: nowrap; }
}

/* A date on its own — "Joined", "Sent" — never has a reason to wrap once
   the weekday is off it. */
html[data-rr] [data-rr-date] { white-space: nowrap; }

/* The control panel's section links carry .nav, which the size reset
   above paints as body text: Profile, Board preferences and the rest
   read as headings and nobody clicks a heading. They are links. */
html[data-rr] a.nav { color: var(--rr-link); }
html[data-rr] a.nav:hover { color: var(--rr-link); text-decoration: underline; }

/* The posting form's filehost warning sits at 10.4px, under the floor
   everything else in the interface keeps to. */
html[data-rr] .link_unsafe_note,
html[data-rr] .link_unsafe_note .tooltip { font-size: var(--rr-fs-xs); }

/* The posting form's BBCode buttons: the template types \`width: 30px\`,
   \`40px\`, \`50px\` into each tag, and the 16px of padding every button
   here gets left "Quote" an 8px box to be drawn in — "Quot", "Coc",
   "URI". Their width is their word's. */
html[data-rr] input.btnbbcode[type="button"] {
    width: auto !important;
    min-width: 2.4em;
    padding-left: 10px;
    padding-right: 10px;
}

/* The font colour palette beside the message box: 141 swatches, each
   a 7×6px link around a spacer gif — a click target smaller than a
   full stop. Twice the size on each side is four times the target,
   and the column it makes is still narrower than its label was. */
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
/* The template lays the swatches out six to a row, 25 rows deep — at
   14px that is taller than the message box beside it. Flowed nine to
   a row it is 16 rows and the same height as the box. The table is
   named by lists.js (markShapes); the !important on display is for the
   narrow layout, whose table rules carry #wrapcentre and would
   otherwise stack the swatches into a 1750px column again. */
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

/* The board's radios and checkboxes are 13px and typed flush against
   their word — "Yes" with the button touching the Y on one row and a
   space away on the next. One size, one gap, the accent for the mark. */
html[data-rr] input[type="radio"],
html[data-rr] input[type="checkbox"] {
    width: 15px;
    height: 15px;
    margin: 0 6px 0 0;
    vertical-align: -3px;
    accent-color: var(--rr-accent);
}

/* Private message markers: the coloured squares the folder's legend
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

/* ---- A table of fields ------------------------------------------- */

/* Marked by lists.js (markFieldTables): the header of a private
   message, and anything else the board writes as label/value rows.

   The template puts row1 on the \`<tr>\` and leaves the cells plain, so
   every inset in this sheet — all of it keyed to \`td.row1\` — missed
   them, and the labels sat on the card's own border while the message
   panel below started fourteen pixels in. Same inset as every other
   card, the label quiet and the value not, and no hairline under the
   last row of a card that ends there. */
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
/* The template bolds the label and leaves the value plain, which is
   the wrong way round: the label is the same four words on every
   message and the value is what was opened to be read. */
html[data-rr] table.tablebg[data-rr-fields] td[data-rr-field="label"] b { font-weight: 600; }
html[data-rr] table.tablebg[data-rr-fields] > tbody > tr > td[data-rr-field="value"] { color: var(--rr-text); }

/* ---- The forum-rules notice -------------------------------------- */

/* The shape the live board writes: a bare \`div.forumrules\` dropped
   straight into #wrapcentre, with the board's own black ground, its
   dark-red hairline and 4px of padding, immediately above the topic
   title. Same card as the table shape below, addressed separately
   because the two share no element between them. */
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
/* The notice's own voice, in the theme's colours rather than the
   board's #FFBF00. lists.js clears the inline colour so this reaches
   it; the weight is what carries the emphasis the size used to. */
html[data-rr] div.forumrules[data-rr-rules] > span,
html[data-rr] div.forumrules[data-rr-rules] > span span { color: var(--rr-warn); }
html[data-rr] div.forumrules[data-rr-rules] ul,
html[data-rr] div.forumrules[data-rr-rules] ol {
    margin: var(--rr-s2) 0 0;
    padding-left: var(--rr-s5);
    color: var(--rr-muted);
}
html[data-rr] div.forumrules[data-rr-rules] li { margin: 2px 0; }

/* Marked by lists.js (markForumRules). It is prose, not a listing row:
   the room a panel gets, a heading told apart from the rules under it,
   the tinted ground and the accent mark that say "this is a heading,
   what follows belongs to it" everywhere else on the board, and no
   hairline drawn along the bottom of a card with one row in it. */
html[data-rr] table.tablebg[data-rr-rules] > tbody > tr > td.row3 {
    position: relative;
    padding: var(--rr-s4) var(--rr-s5) var(--rr-s4) 26px;
    /* A plain token, not the accent wash the category heads use. The
       board writes this notice in its own colours, and the pass that
       lifts those to something readable has to measure what is behind
       them: a color-mix() ground resolves late enough that it was read
       as the previous theme's, and on the light theme that said
       #FFCC00 on white was fine. The accent is on the edge instead,
       where nothing has to measure it. */
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
/* subsilver2 wraps the rules in one more table on the pages where they
   are filled in, and the original sheet pads every cell it finds. Left
   alone that is a second inset inside the card's own, and the notice
   sits off-centre in its box. */
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
/* The colour the board typed into the tag, on the one theme where it
   cannot be read.
 *
 * !important because it is an inline style, and nothing else reaches
 * one. The pass that lifts the board's own colours (theme.js,
 * readableBoardInk) is the general answer to this and it does lift the
 * same #FFCC00 in an ordinary post — but not here: measured, this cell
 * still computes its background as the board's own #232323 at the
 * moment that pass runs, so it is told the yellow sits on near-black
 * and leaves it. The dark themes keep the board's colour untouched. */
html[data-rr][data-rr-theme="paper"] table.tablebg[data-rr-rules] .postbody [style*="color"] {
    color: var(--rr-notice-ink) !important;
}
/* The board writes its rules with <br><br> between paragraphs and a
   list under them, and a <ul> arrives with the browser's own 40px
   indent on top of the cell's. */
html[data-rr] table.tablebg[data-rr-rules] ul,
html[data-rr] table.tablebg[data-rr-rules] ol { margin: var(--rr-s2) 0; padding-left: var(--rr-s5); }
html[data-rr] table.tablebg[data-rr-rules] li { margin: 2px 0; }

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
/* The content box keeps its padding and its 16px margin when the
   board hides the text inside it: every closed spoiler was a header
   over 50px of nothing. The box goes with its text and comes back with
   it — the board toggles the inner div between inline and none. */
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
/* Where an off-site link goes, said after it (topic.js). A rule of its
   own rather than inherited from the link, so it stays quiet on hover
   too. */
html[data-rr] .rr-host {
    margin-left: 5px;
    font-size: var(--rr-fs-xs);
    font-family: var(--rr-font-mono);
    color: var(--rr-faint);
}

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

/* The board's other code block: the syntax-highlighter one, written as
   .codebox > .codeheader ("Code: Select all | Line number On/Off |
   Expand/Contract") > .codeholder > .text > ol > li.li1. Its own
   stylesheet paints it #c9c9c9 with #ccc lines — a light box in the
   middle of a dark post — and colours the tokens for that light box, so
   an olive link inside read at 1.9:1. The box takes the theme's sunken
   surface; the tokens take the theme's colours. */
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
    /* surface-2, not surface-3: on the light theme surface-3 and the
       sunken box are a shade apart and the header vanished into it. */
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
/* GeSHi's token classes, in the theme's palette rather than the light
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

/* ---- Forms ------------------------------------------------------ */

/* The board's own fields, brought up to date — and only the board's.
   \`input[type="text"]\` is one element more specific than a class, so
   this block reached the script's own fields too and won every tie
   against them: the command palette's search box came out as a
   rounded, bordered, sunken field whose corners stood outside the
   panel's own, and lit its border accent on focus. The exclusion is
   the one the sizing rule below already uses. */
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
/* The attachment field on the posting form. The board's sheet paints
   every \`input\` near-black, and this one was never in the list above:
   on the light themes it read as a black bar with the browser's own
   "Choose file" button sitting in it. */
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
/* The template sizes every text field with size="25", size="45": a
   fixed count of characters from 2003, cramped on a fluid frame. The
   board's own fields get a floor in ems and the room they have; the
   script's own controls size themselves. */
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
/* A field shows focus by colouring its own border, so the ring is not
   drawn twice. Only a field: a submit button matches \`input\` too, has
   no border to colour, and was left with no focus indicator at all —
   which a Tab through a live topic page found on the board's own
   Search button. Buttons keep the ring the rule above gives them.

   And only the board's fields, like the block above: four :not()s make
   this selector specific enough to beat anything the script's own
   stylesheet says about its own controls, which is how the command
   palette came to draw an accent-red rule under its search box for as
   long as it was open — which is always. */
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

/* The attachment glyph (icons.js): a fact about the topic, not a
   control, so it is muted and sits after the title rather than
   competing with the tag in front of it. */
.rr-attach { color: var(--rr-faint); vertical-align: -2px; margin-left: 4px; }

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
/* Keyed on whether this script drew the header rather than on the bar:
   with the bar off the strip is still the board's own, sitting under a
   header this script built, and it drew a full-width grey band with the
   breadcrumb jammed against the search field. Only the breadcrumb's own
   line above stays bar-only — nothing else carries it without one. */
html[data-rr][data-rr-header="rr"] td.row5 {
    padding: var(--rr-s2) var(--rr-s3);
    border-radius: var(--rr-radius-lg);
}
html[data-rr][data-rr-header="rr"] td.row5:has(> #search-box) {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    /* On a phone the breadcrumb and the box will not share a line, and
       without this the crumb was squeezed to one word a row. */
    flex-wrap: wrap;
    gap: var(--rr-s3);
}
/* \`:has()\` sees a search box the page has hidden, so this cell is a
   flex row on every listing — and with the bar off the breadcrumb is
   still in it and was pushed to the far right with the box. The two
   take an end each; where the box is hidden the crumb is the only item
   and lands where it belongs, at the start. */
html[data-rr][data-rr-nav="off"] td.row5:has(> #search-box) { justify-content: space-between; }

/* The strip that is left holding nothing but the board's search box
   (navbar.js, tidyCrumbStrip): on a profile or the member list there
   is no listing toolbar to move that box into, and the strip drew a
   full-width card around one field. No card, no fill, no border — a
   row with a search box at the end of it. */
html[data-rr] #wrapcentre table.tablebg[data-rr-crumbstrip] {
    background: none;
    border: 0;
    border-radius: 0;
    margin-bottom: var(--rr-s3);
}
html[data-rr] #wrapcentre table[data-rr-crumbstrip] td.row5 { background: none; padding: 0; }

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
html[data-rr] tr[data-rr-cat-row="empty"] { display: none; }

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

/* The control panel marks the current folder with <li class="row2">,
   which only the board's stylesheet coloured — #232323 on the light
   theme, a black bar with dark-blue text in it. */
html[data-rr] li.row1,
html[data-rr] li.row2 {
    background: var(--rr-surface-2);
    border-radius: 4px;
    padding: 1px 6px !important;
    margin: 0 -6px;
}

/* A multi-select drawn five rows tall for a list of thirty forums. */
html[data-rr] select[multiple] { min-height: 12em; }

/* "Top", a link back to the header under every post, hidden with the
   post footer on a desktop and back on a phone, where the footer row
   is a flex row. The floating button does this job on every width. */
html[data-rr] a[href="#wrapheader"] { display: none; }

/* The row that link lived in stayed behind: its own cell floats a
   profile-icon link the modernised post header already carries, and
   with the "Top" text gone the row reads as empty even though its
   text content is not, which is why it survived the general "empty
   post row" cleanup. Named by lists.js (markShapes): the row's first
   cell holds nothing but that one link. A table row with only a
   floated child collapses to nothing on a desktop, ~20px of it; on
   the phone layout the row is a padded flex card and the same cell
   is 49px of empty band under every post. */
/* !important: the phone layout's row rule (responsive.css,
   html[data-rr] #wrapcentre table.tablebg > tbody > tr) carries an id
   and three more type selectors than this one, so it wins on
   specificity whatever the source order; the tie is broken here. */
html[data-rr] tr[data-rr-top-row] { display: none !important; }

/* Search results mark the term with the board's \`.posthilit\`: pure
   yellow behind dark text, on every theme. A wash of the warning
   colour, and the text keeps its own. */
html[data-rr] .posthilit {
    background: color-mix(in srgb, var(--rr-warn) 32%, transparent);
    color: var(--rr-text-strong);
    border-radius: 3px;
    padding: 0 2px;
}

/* A YouTube embed is written as <iframe width="560" height="315">. On a
   phone the post is 340px wide; the frame was not. The box follows the
   width it has and keeps the picture's shape. */
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

/* A moved topic: the template's beveled GIF was the one marker the
   icon pass left as it was. A hollow diamond, the dot's size. */
html[data-rr] .rr-dot[data-state="moved"] {
    background: transparent;
    border: 2px solid var(--rr-faint);
    border-radius: 2px;
    transform: rotate(45deg) scale(.85);
}

/* A roster prints "Send private message" on every one of its forty
   rows; drawn as full buttons they were the loudest thing on the page.
   Smaller and quieter there, still a control. */
html[data-rr] table[data-rr-list] td .rr-ctl {
    padding: 1px 8px;
    font-size: var(--rr-fs-xs);
    background: transparent;
}


/* ---- What the template leaves between things --------------------- */

/* A 1px spacer row: an <img src="spacer.gif"> in a cell the board
   paints black. The image is dropped further up; the cell was still
   drawing a black band across a private message and between two
   search results. */
html[data-rr] td.spacer {
    background: none !important;
    height: 0;
    padding: 0;
    /* A zero line box, not a zero font: the size floor this stylesheet
       guarantees is measured on every cell, spacers included. */
    line-height: 0;
}

/* The rule that replaces the board's run of underscores (topic.js,
   replaceUnderscoreRules) — the same weight as a signature's. */
html[data-rr] hr.rr-rule {
    margin: var(--rr-s3) 0;
    border: 0;
    border-top: 1px solid var(--rr-line);
    background: none;
    height: 0;
}

/* ---- The topic review under the reply form ----------------------- */

/* The last few posts of the thread, reprinted in a box you scroll so
   you can answer them without leaving the form. The board draws them
   as one continuous table: a hairline of table background between two
   posts and a zebra a shade apart, which at a glance reads as one long
   post with somebody's name in the middle of it.

   Each is a card here — its own edge, its own corners, a gap to the
   next — out of the rows the board already prints, named by
   compose.js (initTopicReview). */

html[data-rr] [data-rr-review] {
    /* The template types the height into the element. Five cards and
       the air between them need a little more of it than five glued
       rows did. */
    height: 360px !important;
    padding: var(--rr-s3);
    background: var(--rr-surface);
    overscroll-behavior: contain;
}
html[data-rr] table[data-rr-reviewbox] > tbody > tr > td { padding: 0; }
/* The inner table is a \`tablebg\` too, so it arrives wearing the card
   the reskin gives every one of those — an edge, corners and a gap
   under it, inside the card it is already in. The cards are its rows
   now. */
html[data-rr] table[data-rr-review-list] {
    margin: 0;
    border: 0;
    border-radius: 0;
    background: none;
    overflow: visible;
}

/* The two headings the box opens with. They name the columns of a
   table nobody reads as a table; kept, quietly. */
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
/* The author cell spans the pair, so it draws the whole left side. */
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
/* The spacer row is a 1px image the reskin already hides; it is the
   air between two cards now. */
html[data-rr] tr[data-rr-review-row="gap"] > td.spacer {
    height: var(--rr-s3);
    padding: 0;
    background: none;
    border: 0;
}

/* Whose post it is, said once and plainly. The template wraps the name
   in a 150px table of its own. */
html[data-rr] td[data-rr-review-cell="author"] > table { width: auto !important; }
html[data-rr] td[data-rr-review-cell="author"] td { text-align: left !important; padding: 0; }

/* "Post subject: Re: <the topic>" on every one of the five, which is
   the thread's own title said five more times. Supporting detail, not
   a heading. */
html[data-rr] tr[data-rr-review-row="head"] .gensmall { color: var(--rr-faint); }
html[data-rr] tr[data-rr-review-row="head"] .gensmall b { color: var(--rr-faint); font-weight: 400; }
html[data-rr] tr[data-rr-review-row="body"] .gensmall b { color: var(--rr-muted); font-weight: 600; }

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
.rr-btn[aria-pressed="true"] { background: var(--rr-accent-soft); border-color: var(--rr-accent); color: var(--rr-accent-on-soft, var(--rr-accent)); }
/* A quiet control that is open — "Close all spoilers", "Hide the
   original post" — stays quiet: the turned chevron says the state. */
.rr-btn[data-variant="quiet"][data-rr-open] { background: transparent; border-color: transparent; color: var(--rr-text); }
.rr-btn[data-variant="quiet"][data-rr-open]:hover { background: var(--rr-surface-2); }
.rr-btn:disabled, .rr-btn[aria-busy="true"] { opacity: .6; cursor: progress; }
.rr-btn svg { width: 14px; height: 14px; flex: none; }

.rr-icon-btn {
    display: inline-grid;
    place-items: center;
    /* A <button> takes border-box from the UA sheet; an <a> stays
       content-box, so the same 30px (34px on a phone, see responsive.css)
       drew two different squares depending on which tag built it — the
       settings cog a couple of pixels smaller than mail and account
       beside it. */
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

/* An icon button that happens to be a link is still an icon button.

   \`html[data-rr] a\` is (0,1,1) and .rr-icon-btn is (0,1,0), so every
   one of these built as an anchor — private messages, the account link
   — lost its colour to the link rule and came out in the board's red,
   while the two built as buttons stayed grey. Three controls sitting
   together in the top bar, two of them coloured as if they meant
   something different from the third. They do not. */
html[data-rr] a.rr-icon-btn { color: var(--rr-muted); }

/* Three heights in one strip — an 18px number, 25px text buttons, 30px
   icon buttons — read as three different things. They are one row of
   tools. */
html[data-rr] .rr-posttools .rr-icon-btn { width: 26px; height: 26px; }

/* The first-unread arrow after a listing title (icons.js). */
html[data-rr] a.rr-unread-jump {
    width: 22px;
    height: 22px;
    margin-left: 2px;
    vertical-align: middle;
    /* --rr-accent-text is the ink for text *on* the accent: near-black
       on every dark theme, which is what this arrow was painted in. */
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
    /* --rr-nav-h is what a sticky column heading offsets itself by and
       what scroll-padding-top is worked out from, so it has to be the
       whole bar: border-box, or the rule under it makes the bar a
       pixel taller than everything measuring it believes. */
    box-sizing: border-box;
    height: var(--rr-nav-h);
    padding: 0 var(--rr-s4);
    background: color-mix(in srgb, var(--rr-bg) 88%, transparent);
    backdrop-filter: blur(10px) saturate(140%);
    border-bottom: 1px solid var(--rr-line);
}
/* The bar is full-bleed; what is in it follows the content column.
   Without this the brand sat at x=16 and the icons at the screen's
   edge while the board bar and the listing under them were indented
   half a metre on a 2560px monitor — two stacked header rows with a
   500px zig-zag between them. */
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
/* The wordmark, then a hairline: "whose board" separated from "where
   on it".

   The box is taller than the wordmark on purpose — a link 15px tall is
   a hard thing to hit — and the hairline is drawn rather than
   bordered, so growing the target does not grow the rule with it. 18px
   is the height .rr-nav__divide uses at the other end of the bar. */
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
/* \`html[data-rr] a\` outranks a bare class, and painted the name in
   the board's link red. */
html[data-rr] a.rr-nav__brand { color: var(--rr-text); }
html[data-rr] a.rr-nav__brand:hover { text-decoration: none; color: var(--rr-text-strong); }

/* The wordmark, built as an inline <svg> in navbar.js and filled with
   currentColor. Height is the only number to set — the viewBox gives
   the width. */
.rr-nav__logo {
    display: block;
    height: 15px;
    width: auto;
}

/* ---- Board links -------------------------------------------------- */

/* The row the masthead used to carry. Slim, quiet and above the
   content rather than inside it, which is where the board put it. */
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
/* The left half takes whatever the right half leaves and wraps inside
   itself; the right half keeps its own width and stays whole.

   The basis stays \`auto\` rather than 0. A left half that asks for
   nothing is always on the first line — which is what makes the row
   fold to one line where there is room for one — but on the index the
   bar shares its row with a 380px masthead, and asking for nothing
   there left it 190px wide with each group stacked one link to a line.
   Asking for what it wants, it takes the whole line when the two will
   not share one, and the right half drops below it intact. */
.rr-boardbar__main { flex: 1 1 auto; }
.rr-boardbar__end { flex: 0 0 auto; margin-left: auto; }

/* Ways of looking at threads, then what the board is, then you.

   Each group is one light box — a hairline round it, a hairline
   between its links — so the row reads as three things without a
   heading over any of them. The links inside are quiet text that
   lights up under the pointer; nothing in the row is louder than the
   rest, the donation link included. */
.rr-boardbar__group {
    display: inline-flex;
    align-items: stretch;
    /* A group whose links will not fit the window used to run off the
       side of the page — signed in, the five view links did exactly
       that at 1100px, with "View your posts" half off screen. The links
       themselves cannot break, so the ribbon does: it carries on on a
       second line, still one box. */
    flex-wrap: wrap;
    min-width: 0;
    border: 1px solid var(--rr-line);
    border-radius: var(--rr-radius);
    background: color-mix(in srgb, var(--rr-surface) 70%, transparent);
}
/* Keyed on the link's own class rather than on \`> :first-child\`, for
   the reason spelled out at .rr-cluster below: a universal rightmost
   part is tested against every element on the page. */
.rr-boardbar__link + .rr-boardbar__link { border-left: 1px solid var(--rr-line); }
.rr-boardbar__link:first-child { border-radius: calc(var(--rr-radius) - 1px) 0 0 calc(var(--rr-radius) - 1px); }
.rr-boardbar__link:last-child { border-radius: 0 calc(var(--rr-radius) - 1px) calc(var(--rr-radius) - 1px) 0; }
.rr-boardbar__link:only-child { border-radius: calc(var(--rr-radius) - 1px); }
/* Carrying \`html[data-rr] a\` for the same reason .rr-langswitch__option
   does: the generic link rule is (0,1,1) and a bare class is (0,1,0), so
   a whole row of quiet chips came out in link red — eleven of them,
   louder than anything under them, on the very page where the row is
   the header. */
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
/* Search and the settings panel, where there is no top bar to hold
   them. They belong to the reader rather than to the board, so a
   hairline sets them off from the board's own links — the same
   distinction the bar draws at its own right-hand end. */
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

    /* Two entry points stay: "Unanswered posts" and "Active topics"
       are what every guide to this board says to bookmark, and they
       lead the views group. Signed in, three more views follow them
       there — unread, new, your own — and those fold like everything
       else. What the board is, who you are and the language switch all
       wait behind the More control. */
    .rr-boardbar:not([data-rr-open]) .rr-boardbar__main > :not([data-rr-group="views"]),
    .rr-boardbar:not([data-rr-open]) [data-rr-group="views"] > :nth-child(n+3),
    .rr-boardbar:not([data-rr-open]) .rr-boardbar__end:not(:has(> .rr-headertools)) { display: none; }
    /* Except this script's own two. On a page with no top bar the row
       is the only place search and the settings panel are, and folding
       them away behind More put the panel two taps from a phone. The
       board's links in the same half still fold. */
    .rr-boardbar:not([data-rr-open]) .rr-boardbar__end > :not(.rr-headertools) { display: none; }
    .rr-boardbar__main, .rr-boardbar__end { gap: var(--rr-s2) var(--rr-s3); }

    /* The language switch used to be forced onto a full-width line of
       its own here, which pushed More — the next thing in flow — onto
       a line with nothing else on it, alone at the bar's far right and
       a full row below anything it folds. Left to wrap like everything
       above it, it shares whatever line still has room, and More lands
       beside it instead of under everything. */
    .rr-boardbar[data-rr-open] { flex-wrap: wrap; position: relative; }
    /* Signed in there is no language switch for More to share a line
       with, so it still fell to a line of its own at the bottom, a bar's
       height below the fold it controls. Pinned to the corner it stays
       where the thumb found it when the bar was folded; only the first
       group's lines make room for it, the rest run the full width. */
    .rr-boardbar[data-rr-open] .rr-boardbar__more { position: absolute; top: 2px; right: 4px; margin-left: 0; }
    .rr-boardbar[data-rr-open] .rr-boardbar__main > [data-rr-group="views"] { padding-right: 78px; }
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
/* input.rr-search__input, not the bare class: the board's own field
   reset (forum.css, "input[type=text], … .inputbox") matches this
   same input through its \`input[type="text"]\` branch, which is one
   element more specific than a class alone — at equal specificity
   that branch wins the tie regardless of which file loads last, so
   the board's padding and border rode along and the input never
   shrank to the pill's 26px. Matching the element ourselves puts both
   rules on equal footing, where this one loads later and wins. */
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
/* The submit, inside the frame. It had a border and a fill of its own,
   which made a boxed button inside a boxed field — a control inside a
   control. It is the word alone now, quiet, lit under the pointer, the
   way the Ctrl K chip sits in the palette trigger beside it.

   Matched by element (input.rr-search__go, not the bare class): the
   board's input.button1 rule is one element more specific than a
   class and its padding rode along otherwise. */
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

/* One small control at the end of the field opens the two choices the
   board's own box never offered: this forum or the whole board, titles
   or every post (navbar.js, addSearchOptions). Coloured in the accent
   while the box is set to look somewhere other than its default, so a
   reader can tell from across the bar that it will. */
.rr-search { position: relative; }
/* The trigger carries the name of the room it will search, so it is
   as wide as that name and no wider — a glyph on its own said there
   were options and nothing about what they were set to. */
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
/* The trigger's own hover label is drawn 6px under it, which is where
   the popover's first row is: click it and the answer — Main Forum /
   Whole board — is covered by a tip repeating the question. The button
   read as doing nothing at all. Once the choices are open they say
   what the tip said, so the tip stands down. */
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
/* Where the field's own prompt already names the room — "Search Main
   Forum" — the control does not say it a second time. It appears the
   moment there is a query in the way of the prompt, which is when
   knowing where the search is aimed starts to matter. */
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
/* Rooms are named now — "Temporarily Restricted Topics" is a segment
   in this row — so the row and the control inside it both wrap rather
   than pushing the popover off the side of the screen. */
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
html[data-rr] [data-rr-tip]:focus-visible::after,
/* A tip that hangs off a wrapper rather than off the control itself
   (the writing toolbar: an \`input\` draws no pseudo-element) has to
   answer to the control's focus, because the wrapper never takes any.
   Scoped to the wrapper's own children, so this costs nothing on the
   ancestors of a page full of them. */
html[data-rr] [data-rr-tip]:has(> :focus-visible)::after { display: block; }
/* A control that has opened something says what it does with the thing
   it opened. The label would land on top of it. */
html[data-rr] [data-rr-tip][aria-expanded="true"]::after { display: none; }
/* Near the right edge the label would still push the page sideways
   while it is up, so those hang off their own right edge instead. The
   last control in the top bar is against the window; so is the corner
   the jump buttons live in. */
html[data-rr] [data-rr-tip][data-rr-tip-side="right"]::after,
html[data-rr] .rr-nav__actions > :last-child[data-rr-tip]::after { left: auto; right: 0; transform: none; }
html[data-rr] [data-rr-tip][data-rr-tip-side="above"]::after,
html[data-rr] [data-rr-tip][data-rr-tip-side="above-left"]::after,
html[data-rr] [data-rr-tip][data-rr-tip-side="above-right"]::after { top: auto; bottom: calc(100% + 6px); }
/* A bar of buttons wraps, so which end of the window a given button
   sits at is only known once it is hovered; compose.js measures then
   and picks one of these. */
html[data-rr] [data-rr-tip][data-rr-tip-side="above-left"]::after { left: 0; right: auto; transform: none; }
html[data-rr] [data-rr-tip][data-rr-tip-side="above-right"]::after { left: auto; right: 0; transform: none; }

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
/* Declared on the attribute rather than on \`.rr-tag\`, because the
   filter's trigger wears the ink of the prefix it is holding and is
   not a tag. Nothing is painted here — only the token is named — so
   the pair of rules above stays the only thing that draws a chip. */
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
   rule keeps "narrow what is here" and "search the whole board" from
   reading as one control. */
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

/* The prefixes, behind one trigger at the end of the filter box. The
   hairline is the whole separation it needs: it is inside the control
   it narrows, not a control of its own. */
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
/* The board's field rules no longer reach the script's own controls
   (forum.css, "only the board's fields"), so the ones that do want an
   accent border on focus say so themselves. */
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

/* Acting on the forum or the topic rather than on what is in it:
   subscribing, bookmarking, marking read. Once each, at the far end of
   the bar, in the same quiet the topic page gives leaving a topic.

   \`html[data-rr] a.nav\` colours these accent — they arrive as the
   board's own nav links and keep the class — and it outranks the quiet
   variant by a whole class, so it takes this much selector to say that
   a link adopted into the bar is a control in the bar now. */
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

/* One boxed control: the steps and the page box with a hairline
   between each, which is most of what keeps "Next" from being taken
   for "Next topic" on the row below. The two ends are arrows alone;
   their names are drawn on hover (tooltips, below). */
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
   E-mail friend". One box says "these are one thing" where a row of
   loose buttons said "here are six things". No overflow clip: the
   tooltips on the controls inside draw outside it.
 *
 * Every child carries .rr-cluster__item, put there by the JS that
 * fills the cluster (topic.js, sealCluster). The obvious way to write
 * these rules is \`.rr-cluster > * + *\`, and that is a selector whose
 * rightmost part is the universal one: the engine has to test it
 * against every element on the page, and a listing here is four
 * thousand of them. Six such rules cost this page 30ms of style
 * recalculation, measured. Keyed on a class, they cost nothing. */
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
/* A button in a cluster is the cluster's: no frame of its own. */
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

/* A forum listing's own section rows — one spanning td.row3 with a
   bold word in it (lists.js, sectionOf) — drawn as the section heads
   they are: the tint and the mark a td.cat gets, at the same size. */
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

/* A listing's section head, which folds its run on a click (lists.js,
   initSectionFolds). The chevron points down at an open run and right
   at a folded one; the count says what is behind it. */
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

/* Each section of the control panel is a row that opens: the closed
   ones say so with a chevron at their end, the open one with a chevron
   turned down and its pages stepped in under it (lists.js,
   decorateNavLists). */
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
    /* Short values — a developer, a date — sat by their label with a
       metre of nothing to their right on a wide card. The grid is as
       wide as a long line needs and no wider. */
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

/* The author band.

   It was a line of text with a rule under it, floating at the same
   inset as the message: the name, the rank, the join date, the post
   count, the date and six controls, all the same size, all on the
   same ground. Which of them was the author took reading.

   Drawn as a band instead — pulled out to the post's own edges, on
   the quieter surface, with the message starting under it — the
   header is a header and the message is the message. The inset comes
   from the post's own token, so the two can never drift apart. */
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
/* The face beside the name: a size at which it is a face, centred on
   the line it belongs to, on a plate so an avatar that is mostly
   transparent still reads as a circle. */
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
    /* The overlay is a flex row, so without this the box stretches to
       the height it is allowed rather than to the height it needs, and
       a search with one answer drew 500px of empty panel under it. */
    align-self: flex-start;
    max-height: min(60vh, 520px);
    margin-top: 12vh;
    display: flex;
    flex-direction: column;
    background: var(--rr-surface);
    border: 1px solid var(--rr-line-strong);
    border-radius: var(--rr-radius-lg);
    box-shadow: var(--rr-shadow-pop);
    /* Not clipped: the scope popover hangs off the strip at the top and
       is taller than the strip, so \`overflow: hidden\` cut it off at the
       panel's own edge and swallowed the second row of choices whole.
       Nothing here paints into the corners — the strip and the list
       have no background of their own — so the radius holds without
       it, and the list rounds its own bottom corners. */
    overflow: visible;
}
/* input.rr-palette__input, not the bare class, for the reason
   input.rr-search__input carries the same shape above: the board's
   field rules reach this input through \`input[type="text"]:focus\` too,
   and a class alone loses that tie — which lit the divider under the
   box accent-red for as long as the palette was open, which is always.
   The box itself is the panel; the field draws nothing of its own. */
html[data-rr] input.rr-palette__input {
    /* The strip is a flex row and the field is what stretches in it;
       the strip itself is what does not shrink. The panel is a flex
       column against a max-height, and the field was a shrinkable item
       beside a list of forty boards: it gave up 13 of its 48px to
       them, and the palette opened on a field shorter than its own
       rows. The list scrolls; the field does not move. */
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
   which board, and how deep (palette.js, buildPaletteScope). The rule
   under the strip is the strip's now, so the field draws nothing at
   all — see the focus note below for why it has to say so twice. */
.rr-palette__bar {
    position: relative;
    flex: none;
    display: flex;
    align-items: center;
    padding-left: var(--rr-s3);
    border-bottom: 1px solid var(--rr-line);
}
/* Room names run long — "Temporarily Restricted Topics" — and this
   trigger sits in front of the field rather than at the end of a bar,
   so it is given a little more of the width than the one in the bar. */
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
/* The rooms are a column rather than a row of pills: twenty of them
   with subforums indented under their board is a tree, and a tree that
   wraps is a wall. It scrolls at about eight rows, which is where the
   popover stops being taller than the palette it hangs off. */
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
    /* Twenty rows in a scroller that stops at 208px: as flex items
       they shared the height out between them and drew twenty 10px
       slivers of text. The list scrolls; a row is the height it
       needs. */
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
/* A category holds no topics of its own, so it is a heading and not
   somewhere a search can be sent. */
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
/* The board's field rules colour a focused border accent, and four
   :not()s make that rule specific enough to win here. The palette's
   field is focused from the moment it opens, so the divider under it
   read as a red rule across the panel rather than as a divider. The
   divider belongs to the strip now and the field has no border of its
   own, which is exactly what this has to keep saying under :focus. */
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
/* Every row of the panel is a grid item, and a grid item's automatic
   minimum size is its content's — so a head whose title, search box
   and close button will not fit, or a page holding a control wider
   than the sheet, made the *panel* wider than the window it is
   pinned to and put a scrollbar across the whole thing. They may
   shrink; what is inside them wraps or scrolls on its own. */
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
/* Same shape as the palette's field, and for the same reason: this one
   is type="search", which the board's field rules also reach. */
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

/* The rail and the page beside it. The rail scrolls on its own, so a
   long category cannot push the categories off the bottom. */
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

/* A row is words on the left and a control on the right, until the
   control is wider than the room left over — and then it takes a line
   of its own rather than squeezing the words into a column.
 *
 * That squeeze was the panel's worst habit: five theme buttons and a
 * three-line sentence in the same row left the sentence wrapping at
 * about thirty characters beside three hundred pixels of nothing. A
 * min-width on the words and \`flex-wrap\` on the row is the general
 * form of what the accent chips already had as a special case. */
.rr-field {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    /* space-between rather than a margin on the control: on the line it
       shares with the words it is pushed to the right edge, and on a
       line of its own it starts at the left, under them. A margin
       would strand it at the right of an otherwise empty row. */
    justify-content: space-between;
    gap: var(--rr-s3) var(--rr-s5);
    padding: var(--rr-s4) 0;
    border-top: 1px solid var(--rr-line);
}
.rr-field:first-of-type { border-top: 0; }
/* The basis is the wrap threshold, not the width: the words grow into
   whatever the line has left. 16rem is where a sentence stops reading
   as a column of two-word lines, so a control wider than the rest of
   the row takes its own line rather than squeezing them into one. */
.rr-field__text { flex: 1 1 16rem; min-width: 0; }
.rr-field__label { display: block; font: 600 var(--rr-fs-sm) / var(--rr-lh-meta) var(--rr-font); color: var(--rr-text); }
.rr-field__desc { display: block; margin-top: 4px; font-size: var(--rr-fs-xs); line-height: 1.6; color: var(--rr-muted); max-width: 56ch; }
.rr-field__control { flex: 0 0 auto; display: flex; align-items: center; gap: var(--rr-s2); padding-top: 2px; }
.rr-field[hidden],
.rr-field[data-rr-dep-off],
.rr-field[data-rr-nomatch] { display: none; }
/* A search hit under a parent that is switched off is still a hit:
   shown, dimmed, rather than counted on the tab and then not there. */
.rr-group[data-rr-searching] .rr-field[data-rr-dep-off]:not([data-rr-nomatch]) { display: flex; opacity: .6; }
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

/* The accent, chosen from named chips rather than bare squares. Six
   named chips never share a line with anything, so they start at the
   left of their own one rather than being pushed to the right of it by
   the row's \`margin-left: auto\`. On a phone the field is already a
   column and needs none of it: \`flex-basis: 100%\` there is a *height*,
   which is how the chips came to overrun the sheet. */
@media (min-width: 641px) {
    .rr-field[data-field="accent"] > .rr-field__control { flex-basis: 100%; padding-top: 0; }
}
.rr-swatches { display: flex; flex-wrap: wrap; gap: 4px; max-width: 100%; }
.rr-swatch {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    /* Wide enough to line up, never narrower than its own name. A fixed
       62px cut "RIN orange" out of the pressed swatch's box on both
       sides — the label is nowrap, so it overflowed rather than
       wrapping, and the selected background stopped short of the word
       it belonged to. */
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

/* On a phone the groups stack and lose their hairline; the pull to the
   left that hides a desktop hairline then cut the first letters off
   "User Control Panel" and "Forum rules". */
@media (max-width: 720px) {
    .rr-boardbar__main { margin-left: 0; }
    .rr-boardbar__group { padding-left: 0; border-left: 0; margin-right: 0; }
}

/* The optional noun on a topic-bar link (" topic", " friend") is a flex
   item like the word before it, so the button's 6px gap sat between
   them on top of the noun's own space. The gap is taken back and the
   space kept, so "Previous topic" is spaced like two words. */
.rr-topicbar .rr-opt { margin-left: -6px; white-space: pre; }

/* A crumb that is a place, not a link: the control panel section the
   window title named. It sits in the same shrinking flex row as the
   linked crumbs before it, but had none of the treatment that lets
   them ellipsize — a flex item's automatic minimum width is its full
   nowrap content width unless overflow is something other than
   visible, so on a narrow phone this span refused to shrink, overran
   the crumbs bar's own clip, and read as a word guillotined mid-way
   with no "more to see" cue rather than a title trimmed with one. */
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
   under the cursor is marked the way a hovered row is, plus a hairline
   in the accent so a hovered row and the chosen one read differently. */
html[data-rr] table[data-rr-list] tr[data-rr-cursor] > td { background: var(--rr-surface-3); }
html[data-rr] table[data-rr-list] tr[data-rr-cursor] > td:first-child { box-shadow: inset 3px 0 0 var(--rr-accent); }

/* ---- The mini pager under a topic title ------------------------- */

/* "[ Go to page: 1 … 41, 42, 43 ]" as a label and a row of chips
   (lists.js, tidyMiniPagers). */
.rr-minipager { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 3px 4px; font-weight: 400; }
.rr-minipager__label { margin-right: 3px; font-size: var(--rr-fs-xs); color: var(--rr-faint); }
/* In a listing's strip the words are the board's own link that asks
   for a page number; it keeps that, quietly. */
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

/* The "Go to page" strip a listing ends with, the "Page 1 of 5" line
   over Who is online, the message folder's sort form: bare tables
   dropped between two cards, with nothing holding them apart. */
html[data-rr] #wrapcentre table[data-rr-strip],
html[data-rr] #wrapcentre table[data-rr-sortfoot] { margin: var(--rr-s3) 0; }
html[data-rr] #wrapcentre table[data-rr-strip] td.nav,
html[data-rr] #wrapcentre table[data-rr-strip] td.pagination { font-size: var(--rr-fs-sm); color: var(--rr-muted); }
/* "Delete all board cookies | The team" is a bare span dropped
   between two cards. A line of its own, quiet. */
html[data-rr] #wrapcentre > span.gensmall {
    display: block;
    margin: var(--rr-s2) var(--rr-s1) var(--rr-s3);
    font-size: var(--rr-fs-xs);
    color: var(--rr-faint);
}

/* ---- Sort controls --------------------------------------------- */

/* Each label and the select(s) it names, glued into one span by
   lists.js (groupSortControls). white-space: nowrap keeps a wrap from
   ever landing between a label and its own control — only between one
   pair and the next. */
html[data-rr] .rr-ctrl-group {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
}
html[data-rr] td.cat[data-rr-cat="controls"] > .rr-ctrl-group + .rr-ctrl-group,
html[data-rr] td.cat[data-rr-cat="controls"] > .rr-ctrl-group + input { margin-left: var(--rr-s3); }
/* The sort form itself: one wrapped row of pairs, the pairs apart. */
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
   One line, beside the sort form. */
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
/* The field carries the floor every board text field gets (a size="22"
   in ems); here that floor is wider than the line the box has, and the
   button went under it. A fixed width, no floor, no growing. */
html[data-rr] #wrapcentre td.cat[data-rr-cat="controls"] #search-box_thread input[type="text"],
html[data-rr] #wrapcentre #search-box:not([data-rr-dupe]) input[type="text"] {
    width: 14em !important;
    min-width: 0 !important;
    flex: 0 0 auto !important;
}

/* ---- A post's header, on a desktop ------------------------------- */

/* The strip is name, rank, meta, then the tools and the date. Left to
   wrap, the tools dropped to a second line while the date stayed alone
   at the right of the first — two lines saying what fits on one. The
   meta line is the part with something to give: it already ends in an
   ellipsis, and it is the only thing here that is not a control. */
@media (min-width: 861px) {
    html[data-rr] .rr-posthead { flex-wrap: nowrap; }
    /* The meta gives way first — it is the only thing here that is not
       a control, and it already ends in an ellipsis. The tools may
       still wrap inside themselves rather than push the page sideways,
       which is what a 1280px window with a long "Location:" did. */
    html[data-rr] .rr-posthead__meta { flex: 0 100 auto; }
    html[data-rr] .rr-posthead .rr-posttools { flex: 0 1 auto; }
}
/* Wide enough that the controls always fit once the meta has given way:
   they stop shrinking, so the last icon no longer drops to a line of
   its own. Below this the tools may still wrap inside themselves,
   which is the one thing that must never push the page sideways. */
@media (min-width: 1100px) {
    html[data-rr] .rr-posthead .rr-posttools { flex: 0 0 auto; }
}

/* ---- Strips of links the template joins with pipes ---------------- */

/* "Previous PM in history | Next PM | …", "[ Add friend | Add foe ]",
   "Mark all :: Unmark all": a row of links and the punctuation between
   them. The punctuation goes and the gap says the same thing. */
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

/* Kept in view while their own listing is on screen. The top bar is
   48px of sticky chrome above them when it is drawn. */
html[data-rr][data-rr-sticky="on"] table[data-rr-list] > tbody > tr[data-rr-head] > th {
    position: sticky;
    top: 0;
    z-index: 3;
    background: var(--rr-bg-sunken);
}
html[data-rr][data-rr-sticky="on"][data-rr-nav="on"] table[data-rr-list] > tbody > tr[data-rr-head] > th {
    top: var(--rr-nav-h, 48px);
}

/* A heading that sorts. It is a button, and reads as the heading it
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

/* Mark everything in a folder. */
html[data-rr] input.rr-markall { margin: 0; vertical-align: middle; accent-color: var(--rr-accent); }

/* The chip for rows with something new in them. */
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

/* The board's BBCode buttons, regrouped by compose.js. What was two
   undivided rows of grey rectangles is one bar in five groups: the
   letter styles, the blocks, what is fetched from elsewhere, what is
   hidden, and the board's own generator.

   The groups are told apart by the space between them and nothing
   else. A hairline would be read the same way, right up to the moment
   the bar wraps on a narrow window and a line opens with a divider
   against nothing — which is exactly what the board bar had to be
   rebuilt to avoid. */
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

/* The tooltip hangs off this wrapper rather than off the button: an
   \`input\` is a replaced element and draws no pseudo-element, so
   \`input::after\` is nothing at all. */
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

/* The font size menu, which the template leaves stranded at the end of
   the first row with a label of its own. */
.rr-bbtool--menu > span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: var(--rr-muted);
    font-size: var(--rr-fs-sm);
    white-space: nowrap;
}
html[data-rr] .rr-bbtool--menu select { height: 30px; padding: 0 6px; }

/* The read-only field the board wrote its explanations into. It stays
   in the page — \`helpline()\` sets its value on every mouseover of
   every button, and a removed one throws on all of them — and stops
   being a field the eye reads as a second Subject box. */
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

/* The author, the control and the message on one line.

   The message used to be \`display: inline\` so it would flow beside the
   name, and that quietly undid the fold: \`overflow\` and \`max-height\`
   do not apply to a non-replaced inline box at all, so a short reply
   looked folded only because it was short. A 300-character "thank you
   so much for taking the time" — well inside what this folds — laid
   itself out in full and nothing clipped it.

   A flex row on the cell puts the three on one line properly, and the
   message is then a flex item, which is a box that can be clipped. */
/* Blocks, not a table. The message is one nowrap line, and a table
   sizes itself to its content: on a desktop the folded post grew to
   2044px and pushed the whole page sideways. As blocks the row is the
   width it is given and the message is clipped inside it. */
/* The whole chain down to the message, not only the outermost rows:
   one table-cell left anywhere along it is enough. subsilver2 wraps a
   post in one more \`<table cellspacing="5">\` on the live board — the
   fixtures do not — and that table and the \`td\` holding it went on
   shrink-wrapping the nowrap line inside them: 2756px of it, 1401px of
   page pushed sideways, which is the same failure this rule was
   written for, two levels further in.
 *
 * Only cells on that chain. \`td\` on its own outranks the modern
 * layout's \`td.profile { display: none }\` and puts the author column
 * — rank, joined date, post count — back above every folded reply. */
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
    /* 1.5 made the pill 24px against a 20px line of text, so it stood
       proud of the row whatever it was aligned to. Tight enough now to
       be the same height as the line it sits in. */
    font: 600 var(--rr-fs-xs) / 1.25 var(--rr-font);
    cursor: pointer;
    vertical-align: middle;
}
/* The row aligns on the baseline, which is right for the name and the
   message and wrong for the chip: a bordered pill's baseline is the
   text inside it, so its box hung two pixels above the line it sits
   on. Centred in the line instead, the way a chip beside running text
   is set everywhere else. */
.rr-quiet-chip { align-self: center; }
.rr-quiet-chip:hover { color: var(--rr-text); border-color: var(--rr-line-strong); }
.rr-quiet-chip svg { width: 11px; height: 11px; }
/* Once opened, the post is an ordinary post again and the chip is the
   only thing left saying otherwise. */
html[data-rr] table.tablebg:not([data-rr-quiet]) .rr-quiet-chip { opacity: .4; }
html[data-rr] table.tablebg:not([data-rr-quiet]) .rr-quiet-chip:hover { opacity: 1; }

/* ---- The donation link -------------------------------------------- */

/* One of the board's links, in the board's row, at the row's own
   weight. It used to carry an outline and a heart; the palette still
   offers it from anywhere. */
html[data-rr] .rr-boardbar__donate { font-weight: 600; }

@media (max-width: 380px) {
    /* Both entry points and the More control come to 340px, so on a
       390px phone — the common one — they now fit the row, which they
       did not while every link opened with the word "View": only one
       used to survive here. Under 380px they stop fitting.
       "Unanswered posts" is the one every guide to this board tells
       people to bookmark, so it is the one that stays; the rest are
       one tap away behind More. */
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
/* The text is the status colour lifted toward the strong text, not
   the raw token: on the dark themes the raw red read at under 4:1 on
   its own wash. */
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
    /* Three lines is the length at which a store blurb still says what
       the game is and does not become the page. */
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
/* When the topic opened, which the store cannot say and the board's
   own tooltip used to — drawn over this card until steam.js took the
   attribute away. It belongs with the bookkeeping at the foot, above
   the two lookups, hairlined off the blurb so it does not read as the
   last line of it. */
.rr-steam__posted {
    padding-top: var(--rr-s2);
    border-top: 1px solid var(--rr-line);
    font: var(--rr-fs-xs) / var(--rr-lh-meta) var(--rr-font);
    color: var(--rr-faint);
}
/* On the placeholder there is nothing above it to be separated from. */
.rr-steam--quiet .rr-steam__posted { padding-top: 0; border-top: 0; }
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
html[data-rr][data-rr-theme="paper"] .rr-toolbar__tags .rr-tag,
html[data-rr][data-rr-theme="paper"] .rr-toolbar__quick .rr-tag { opacity: .78; }
/* The chip that is on is on in every theme: this outranks the rest
   state above, which it did not before. */
html[data-rr][data-rr-theme="paper"] .rr-toolbar__tags .rr-tag:hover,
html[data-rr][data-rr-theme="paper"] .rr-toolbar__tags .rr-tag[aria-pressed="true"],
html[data-rr][data-rr-theme="paper"] .rr-toolbar__quick .rr-tag[aria-pressed="true"] { opacity: 1; }


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
/* No top bar: this block stands in for the board's own header, so it
   is laid out the way the board lays that one out — the art on the
   left, the name centred in what is left of the line, the links across
   the full width underneath. Higher specificity than the two-column
   rules above, so it wins wherever both apply. */
.rr-header[data-rr-stack] {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: var(--rr-s3) var(--rr-s5);
    margin-bottom: var(--rr-s4);
}
.rr-header[data-rr-stack] > .rr-masthead { grid-column: 1; margin: 0; }
.rr-header[data-rr-stack] > .rr-boardname { grid-column: 2; }
/* Full width, and its own hairline is what separates the header from
   the page — so the margin goes and the border stays. */
.rr-header[data-rr-stack] > .rr-boardbar { grid-column: 1 / -1; margin: 0; }

/* Under the width where a 380px picture and a centred name share a
   line, the three stack and the name centres over the art. */
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
/* Carrying html[data-rr] for the reason csrin-css-cascade lists: the
   reset styles \`html[data-rr] p\` at (0,1,1) and a bare class loses to
   it, which left this line at full text weight instead of under the
   name it belongs to. */
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
   bottom margin, which centred the box 6px above the icon, the count
   and the controls beside it. */
html[data-rr] .rr-releases__head h3 { margin: 0; font-size: var(--rr-fs); line-height: 1.2; }
/* The title is the control that folds the panel. */
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
.rr-releases__toggle > svg:nth-child(2) { color: var(--rr-accent); flex: none; }
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

/* The chips filter the list; the tags in the rows below name what a
   release is. They are deliberately the same words in the same
   colours, which left them reading as a first row of the list with its
   version column missing — the strip sat flush on the first row, same
   ground, same chips, no edge between them.

   So the strip takes the head's ground rather than the list's, and a
   full hairline under it. Three bands: what the panel is, how it is
   filtered, what it found. */
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
    /* Transparent on the strip's own ground. A filled chip on a tinted
       strip is a third surface for a control that is off. */
    background: transparent;
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
.rr-releases__empty { margin: 0; padding: var(--rr-s3) var(--rr-card-pad); color: var(--rr-faint); font-size: var(--rr-fs-sm); }

@media (max-width: 720px) {
    /* Two lines: what it is, then who and where. The five-column line
       is 620px of content and there is no honest way to fit it. */
    .rr-releases__link { flex-wrap: wrap; row-gap: 4px; }
    .rr-releases__tags { flex-basis: 100%; order: 3; }
    .rr-releases__who { order: 4; }
    .rr-releases__when { order: 5; }
    .rr-releases__page { order: 6; margin-left: auto; }
    .rr-releases__controls { margin-left: 0; flex-basis: 100%; }
    /* Both segmented controls take a row of their own and all of it.
       Side by side, "Newest first" wraps onto two lines inside a
       segment and the row goes ragged; a control per row reads as a
       stack of choices, which is what it is. */
    .rr-releases__scope,
    .rr-releases__order { flex: 1 1 100%; }
    .rr-releases__tab,
    .rr-releases__order button { flex: 1; }
    .rr-releases__read { flex-basis: 100%; }
}

/* "Only posts with links" (finder.js) reaches the panel's rows too. */
.rr-releases__row[data-rr-nolink] { display: none; }

/* ---- The archive password ----------------------------------------- */

/* Read off the post by finder.js and offered where the post's other
   controls are, because that is where a reader is already looking. */
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

/* The divider a mail client draws, in a thread that has none: this
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

/* The pane lives in the overlay rather than in the panel — the panel
   clips its own corners, and a sibling in the overlay's centred row
   would push the list sideways the moment one opened. Anchored to the
   centre line and the palette's own 640px instead, so the list stays
   exactly where it was (preview.js, attachTopicPreview).

   The top matches .rr-palette's margin-top and the height its ceiling,
   so the two read as one object with a gap in it rather than as two
   boxes that happen to be near each other. */
html[data-rr] .rr-overlay > .rr-preview {
    position: absolute;
    top: 12vh;
    left: 50%;
    margin-left: calc(320px + var(--rr-s3));
    /* What is left of the half-window once the palette's own 320px and
       the gap are out of it, and never more than the 340px the pane
       wants. Written out rather than fixed at 340: the pane hangs off
       the centre line, so a fixed width ran 150px off the right edge
       of a 1040px window — wide enough to pass the check that opened
       it, too narrow to hold it. 344 rather than 332 because vw counts
       the scrollbar and the overlay's own 50% does not. */
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
/* 1200px is where the formula above bottoms out at 256px — a column
   that still holds a title and four lines of a post, which is the
   whole of what the pane is for — and below it there is not enough
   left of the half-window to be worth drawing. preview.js checks the
   same number before it fetches anything; this is what catches a
   window narrowed after the palette was opened. */
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
/* The one line the pane shows while the page is on its way, and the
   one it shows if the page never arrives. */
html[data-rr] .rr-preview__wait { color: var(--rr-faint); font-size: var(--rr-fs-xs); }

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
    /* The optional nouns on the topic bar's second row. */
    html[data-rr] .rr-topicbar .rr-opt { display: none; }

    /* A profile or control panel form puts its labels in cells aligned
       right, against the value in the next cell. Stacked, the label sat
       at the right edge above a value at the left: read as a column,
       they belong on the same side. */
    html[data-rr] #wrapcentre td[align="right"]:not([data-rr-col]) { text-align: left; }

    /* A form row that is a checkbox in one cell and its words in the
       next: stacked, the box sat on a line of its own above "Disable
       BBCode". The row stays a row. */
    /* !important: the generic table rules above carry a class more
       than this attribute does, and would stack the row again. */
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

    /* The colour palette flows to the width it has (forum.css lays it
       out as a wrapped row of squares). */
    html[data-rr] table[data-rr-palette] { width: auto; max-width: 100%; }

    /* Content width is a desktop setting; on a phone the window is the
       constraint whatever it says. */
    html[data-rr] { --rr-content-max: 100%; --rr-measure: none; }

    html[data-rr] #wrapcentre,
    html[data-rr] #wrapfooter { padding-left: var(--rr-s3); padding-right: var(--rr-s3); }
    html[data-rr] #wrapcentre { padding-top: var(--rr-s3); }

    html[data-rr] .rr-nav { padding: 0 var(--rr-s2); gap: var(--rr-s2); }
    /* The wordmark is 10 times as wide as it is tall, so a couple of
       pixels off its height is 20px of a 390px bar. */
    html[data-rr] .rr-nav__logo { height: 12px; }
    html[data-rr] .rr-nav__brand { height: 34px; padding-right: var(--rr-s2); }

    /* The prefix chips are a filter here, not a label on a title: 18px
       is a fine badge and a poor thing to hit with a thumb. */
    html[data-rr] .rr-toolbar__tags .rr-tag,
    html[data-rr] .rr-toolbar__quick .rr-tag { height: 26px; padding: 0 10px; }
    /* Collapsed to a bare glyph, this control kept the desktop pill's
       frame — a border and a sunken fill — so it sat in the bar as a
       boxed search field beside two borderless icon buttons: three
       controls that open the same kind of thing, drawn as two
       different kinds of control. It takes the icon button's own look
       here, sized to match the tap targets below. */
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

    /* Topic and forum rows as cards. The marker and the title share the
       first line — the marker used to sit alone on a line of its own,
       with the title forced under it — the description sits under the
       title in the small muted face, the counters make one quiet line
       with no boxes drawn around them, and the last post is a line of
       text rather than a full-width bar. */
    /* Written as table.tablebg > tbody > tr > td[...]: the generic cell
       rules above are that specific, and a plain td[data-rr-col] lost
       its min-width to their \`min-width: 0\`. */
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
        /* The rest of the marker's line, and only that line: at four
           fifths of the row nothing else fits beside it, so the counters
           wrap under it whatever the marker's width. */
        /* A zero basis, not auto: auto is the title's own width, and a
           long title is the whole row, which put it under the marker
           again. From zero it grows into what the marker leaves. */
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

    /* Category rows and the bands with one link in them: a header, not
       a card. The control that folds a category goes to the far end.
       The accent mark is drawn inside the cell's own padding on a
       desktop; here the cell has none, so the row carries it. */
    html[data-rr] tr[data-rr-cat-row] { padding: 8px 14px !important; align-items: center !important; }
    html[data-rr] tr[data-rr-cat-row] > td.cat::before,
    html[data-rr] tr[data-rr-cat-row] > td.row3[data-rr-section]::before { display: none; }
    html[data-rr] tr[data-rr-cat-row] > td.cat,
    html[data-rr] tr[data-rr-cat-row] > td.row3[data-rr-section] { padding-left: 0 !important; }
    html[data-rr] tr[data-rr-cat-row=""],
    html[data-rr] tr[data-rr-cat-row="section"] { box-shadow: inset 3px 0 0 var(--rr-accent); }
    html[data-rr] tr[data-rr-cat-row] > td.catdiv { margin-left: auto; }
    html[data-rr] tr[data-rr-cat-row] > td.cat[data-rr-cat="plain"] { margin-left: auto; font-size: var(--rr-fs-xs); }
    /* A message folder: the date and the checkbox had no order and led
       the card, before the subject. */
    html[data-rr] tr[data-rr-pm-row] > td[data-rr-col="date"] { order: 3; font-size: var(--rr-fs-xs); color: var(--rr-muted); }
    html[data-rr] td[data-rr-col="mark"] { order: 4; }

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
    html[data-rr] td[data-rr-col="last"] br { display: none; }

    /* Posts: the 150px author column becomes a header strip. */
    /* Only where the post header has not replaced it (forum.css hides
       it under data-rr-posts="modern"); the !important here was
       bringing it back under the header, with the two-language rank
       and the weekday date the header had already dealt with. */
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

    /* The room the search will look in is printed inside the field on
       a desktop. On a phone the field is barely wide enough for the
       query, so the glyph goes back to standing on its own and the
       name is in the popover the glyph opens. */
    html[data-rr] .rr-search__where { display: none; }
    html[data-rr] button.rr-search__opts { padding: 0; min-width: 26px; }

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
}

/* ------------------------------------------------------------------
   The listing card's marker gutter.

   The gutter cell holds the read/unread dot and, on a bookmarkable
   row, the star (lists.js appends it there on purpose — see
   addBookmarkStar). On a phone card the gutter and the title share the
   first line, and the star's 34px tap target beside the dot left the
   title under its own 80% minimum, so the title dropped to a line of
   its own under a line that was a dot and a star.

   The star moves to the card's top-right corner instead, out of the
   gutter's width, and the dot and the title share the first line
   again.
   ------------------------------------------------------------------ */
@media (max-width: 860px) {
    html[data-rr] table.tablebg > tbody > tr { position: relative; }

    /* forum.css floors this cell at 44px, which is right for a column
       and far too wide for a card. Repeating the phone selector here
       (same specificity, later, so it wins) drops the floor to the
       dot's own width and leaves the title its 80% beside it.

       The star is still a child of this cell, and its absolutely
       positioned box has to fit inside this one or it trips the "no
       cell draws outside itself" check — hence align-self and
       min-height. align-items then says where the *dot* sits in that
       taller box: at its top, beside the title's first line, rather
       than centred between a wrapped title's two lines. */
    html[data-rr] table.tablebg > tbody > tr > td[data-rr-col="icon"] {
        min-width: 0;
        align-self: flex-start;
        align-items: flex-start;
    }
    /* Only a row with a star needs the star's height; without one the
       34px pushed a message folder's second line 20px down. */
    html[data-rr] table.tablebg > tbody > tr[data-rr-star] > td[data-rr-col="icon"] { min-height: 34px; }
    /* The star's containing block is the row (tr, made position:relative
       above), not this cell, so top/right here are relative to the
       row's own corner and not to wherever the cell happens to sit. */
    html[data-rr] table.tablebg > tbody > tr > td[data-rr-col="icon"] > .rr-star {
        position: absolute;
        top: 0;
        right: 0;
        margin: 0;
    }

    /* Room for the star's corner, on the rows that carry one — the
       chain down through tr and td matches the generic cell rule's
       specificity above, which sets this same padding to 0.

       min-width drops the 80% floor the generic title rule sets. That
       floor keeps the counters off the marker's line, but a percentage
       of a 390px card and of an 860px one are different numbers, and
       at 390px it tipped the title itself onto a line of its own. The
       spacer below does that job instead. */
    html[data-rr] table.tablebg > tbody > tr[data-rr-star] > td[data-rr-col="title"] {
        min-width: 0;
        padding-right: 40px;
    }

    /* An invisible flex item, ordered between the marker/title group
       and the counters that follow them, whose own 100% flex-basis can
       never share a line with anything: it always starts a fresh one,
       so the counters always land under the title regardless of how
       widely either side's own width happens to divide the card.
       Sturdier than sizing the title to leave "enough" room, which is
       exactly the arithmetic that went stale at 390px. */
    html[data-rr] table.tablebg > tbody > tr[data-rr-star]::before {
        content: "";
        order: 1;
        flex-basis: 100%;
        width: 0;
        height: 0;
    }
}

/* ------------------------------------------------------------------
   The topic foot: the search-this-topic / display-options strip, the
   jump-to box, and the floating buttons that sit over both. All three
   were left to inline flow — a \`<span>\` label and a \`<select>\` as
   plain siblings, wrapping wherever the browser found room — which is
   the layout a form takes when nobody has laid it out, and it reads
   differently every time the flow changes: Chrome stacks the search
   input full width with "Search" centred alone under it; Safari puts
   the label in the sliver of a line the input's own floor (forum.css,
   min-width: min(100%, 22em)) leaves beside it, wrapping it letter by
   letter. An explicit flex row does not care what the flow would have
   done.
   ------------------------------------------------------------------ */
@media (max-width: 860px) {
    /* The controls cell holds one or two forms: the search box on a
       topic page, always the "Display posts from previous / Sort by /
       Go" strip — direct children of the cell on a search-results
       page, wrapped in form[name=viewtopic] on a topic page. Flexing
       the cell itself, wrapped, lays out whichever shape is there;
       the search box is given the whole first line so the display
       form always starts a line of its own under it. */
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
    /* The search field's own floor would otherwise take the whole
       line and push its button under it — the Chrome half of the bug
       photographed live. */
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

    /* form[name=jumpbox]: the label, the select and Go are inline
       content of one unclassed cell, which the unpacking rules above
       turn into a block, and the three then wrap on their own. The
       extra :not()s match the specificity of the rule being
       overridden — both sides carry #wrapcentre and !important, so the
       tie breaks on class count rather than source order.

       wrap, not nowrap: on the search results page this form sits
       beside a floated sibling the board never clears, so the row is
       well under 342px. A select sizes to its longest option, so
       \`flex: 1 1 auto\` counted a forum name's full width and wrapped
       Go away alone; a 0% basis asks with only the 6em floor. */
    html[data-rr] #wrapcentre form[name="jumpbox"] table:not(.tablebg):not(.forumline) > tbody > tr > td {
        display: flex !important;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }
    html[data-rr] #wrapcentre form[name="jumpbox"] span.gensmall { white-space: nowrap; flex: 0 0 auto; }
    html[data-rr] #wrapcentre form[name="jumpbox"] select { flex: 1 1 0%; min-width: 6em; }
    html[data-rr] #wrapcentre form[name="jumpbox"] input[type="submit"] { flex: 0 0 auto; }

    /* The floating back-to-top button is fixed in the corner, so it
       sits over whatever is at the true bottom of the page once a
       reader scrolls there — "Powered by phpBB", or the Who is online
       card's corner. It is meant to be reached, not avoided, so the
       page gets the extra room instead: enough to clear a button 38px
       tall sitting 8px (--rr-s2) off the edge, plus a hand's width of
       air above it. */
    /* body.ltr carries a class the plain-body rule above does not, so
       it is the one that would otherwise win this tie. */
    html[data-rr] body,
    html[data-rr] body.ltr { padding-bottom: 64px; }
}

@media (max-width: 860px) {
    /* The sort strip — "Display posts from previous / Sort by / Go" —
       is the last row of the same table.tablebg the list above it
       renders in, so it inherited that table's rounded card outright
       and read as bolted onto the last result rather than a strip of
       its own under the list. lists.js (markShapes) now carries the
       cell's "controls" kind onto the row, so the gap that pulls it
       clear can live on the row itself rather than fighting the row's
       own padding from inside the cell. #wrapcentre: an id beats the
       table.tablebg > tbody > tr rule two blocks up on any property it
       shares, and margin is not one it sets — but is one this page's
       tighter search-page rule below could, so the habit is kept up
       here too. */
    html[data-rr] #wrapcentre tr[data-rr-cat-row="controls"] {
        margin-top: var(--rr-s2);
    }

    /* The cell itself, and — on a topic page, where the same shape
       shares its row with the topic search box beside it — the sort
       form one level down. Flex items ignore float, so this also
       stops that search box eating into the sort form's line, which
       was the other half of the ragged wrap this shape used to
       produce there. */
    html[data-rr] #wrapcentre td.cat[data-rr-cat="controls"],
    html[data-rr] #wrapcentre td.cat[data-rr-cat="controls"] > form {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: var(--rr-s2) var(--rr-s3);
    }
    html[data-rr] #wrapcentre td.cat[data-rr-cat="controls"] > form { flex: 1 1 100%; }

    /* The message folder's export and mark controls: two floated divs
       in the same cell, which spilled over the sort form under them.
       Two full-width rows of the cell's own flex layout instead. */
    html[data-rr] #wrapcentre td.cat[data-rr-cat="controls"] > div[style*="float"] {
        float: none !important;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--rr-s2);
        flex: 1 1 100%;
    }
    html[data-rr] #wrapcentre td.cat[data-rr-cat="controls"] > div[style*="float"] > select { flex: 1 1 auto; min-width: 0; }
    /* The topic search box: a row of its own, the input taking the
       width the button leaves. */
    html[data-rr] #wrapcentre td.cat[data-rr-cat="controls"] > #search-box_thread { flex: 1 1 100%; margin: 0; }
    html[data-rr] #search-box_thread form { display: flex; }
    html[data-rr] #wrapcentre td.cat[data-rr-cat="controls"] #search-box_thread input[type="text"] {
        flex: 1 1 auto !important;
        width: auto !important;
        min-width: 0 !important;
    }

    /* The results footer's own float: the template sets it inline on
       the match count and an empty companion strip, meant to be
       cleared by a bare <br> — and #wrapcentre > br is dropped further
       up this file as decorative spacing on every other page, which
       silently undid the one place that clearing br was load-bearing.
       Off the float, the count is a line of its own and the jump box
       under it stops trying to fit "Jump to:" into whatever sliver of
       the row the float happened to leave beside it. */
    html[data-rr] #wrapcentre > div.gensmall[style*="float"],
    html[data-rr] #wrapcentre > div.nav[style*="float"] {
        float: none !important;
        margin: 0 0 var(--rr-s2);
    }

    /* The jump-to box: a label, a forum <select> and a Go button in
       one unstyled <td>, unpacked like any other nested table into
       three stacked lines for one control. !important twice: the
       table-unpacking rule above reaches this same td through one
       more attribute selector than this one and would undo both the
       row and the width this needs to make the select worth flexing. */
    html[data-rr] #wrapcentre form[name="jumpbox"] td {
        display: flex !important;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px var(--rr-s2);
        width: 100% !important;
    }
    html[data-rr] #wrapcentre form[name="jumpbox"] span.gensmall { white-space: nowrap; }
    /* flex-basis 0, not auto: auto reserves the select's own preferred
       width — which Chromium sizes to its widest *option*, not the one
       showing — before the row is split into a line at all, and that
       alone was wider than the row, pushing Go onto a line by itself.
       From a zero basis the select instead grows to fill whatever the
       label and Go leave it. */
    html[data-rr] #wrapcentre form[name="jumpbox"] select { flex: 1 1 0%; min-width: 0; }
    html[data-rr] #wrapcentre form[name="jumpbox"] input[type="submit"] { flex: none; }
}

@media (max-width: 860px) {
    /* The sort strip is the last row of the results card. Drawn as a
       dark box inset in the card it read as a panel dropped into the
       last result; drawn flush, with a hairline over it and the card's
       own footer tone, it reads as the card's foot. */
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

/* ------------------------------------------------------------------
   The phone's rhythm.

   What the screenshots said, in the author's words: not enough air,
   things glued together, the menus disorderly, the corners ugly. One
   system for the whole phone layout, then: 12px between any two cards
   and 14px inside them; every menu a list on a grid, not a wrapped
   soup; a table that is a menu drawn as a menu; controls with the
   corners of the box they sit in.
   ------------------------------------------------------------------ */
@media (max-width: 860px) {
    /* Air between cards. Two tables back to back, a form after a
       table, the reply box and Who is online: 12px, always. */
    html[data-rr] #wrapcentre > table.tablebg + table.tablebg,
    html[data-rr] #wrapcentre > table.tablebg + form,
    html[data-rr] #wrapcentre > form + table.tablebg,
    html[data-rr] #wrapcentre > .rr-online { margin-top: var(--rr-s3); }
    html[data-rr] .rr-reply { margin-bottom: var(--rr-s3); }
    /* The permissions notice ("You can post new topics…") is an
       unclassed table straight after the jump-to form, with nothing
       between them: the one seam on the page that measured 0px. */
    html[data-rr] #wrapcentre table[data-rr-after-jump] { margin-top: var(--rr-s3); }
    /* The game card is a card like the others: the same inset. */
    html[data-rr] .rr-game { padding: 14px; }
    /* "Delete all board cookies | The team" is a bare span dropped
       between two cards. A line of its own, quiet. */
    html[data-rr] #wrapcentre > span.gensmall {
        display: block;
        margin: var(--rr-s3) var(--rr-s1);
        font-size: var(--rr-fs-xs);
        color: var(--rr-faint);
    }
    /* Air inside them: a card's padding, not a table cell's. */
    html[data-rr] table.tablebg > tbody > tr,
    html[data-rr] table.forumline > tbody > tr { padding: 14px; gap: 4px var(--rr-s2); }

    /* A listing card's second line reads who, then how much: the
       author led the counters on the desktop table, and here sat
       between them. */
    html[data-rr] table.tablebg > tbody > tr > td[data-rr-col="author"] { order: 2; }
    html[data-rr] table.tablebg > tbody > tr > td[data-rr-col="replies"],
    html[data-rr] table.tablebg > tbody > tr > td[data-rr-col="views"],
    html[data-rr] table.tablebg > tbody > tr > td[data-rr-col="topics"],
    html[data-rr] table.tablebg > tbody > tr > td[data-rr-col="posts"] { order: 3; }
    html[data-rr] table.tablebg > tbody > tr > td[data-rr-col="last"] { order: 4; }

    /* A roster's card — the member list, Who is online — name first
       and in the reading face, then the rank, the joining date and the
       count as one quiet line, then the controls on a line of their
       own. The running number goes; it counts nothing a phone shows,
       and the template's empty e-mail and website cells go with it. */
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
       them whatever the name's length. */
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

    /* A table that is a menu: the control panel's Options, the message
       folders, the message-colour legend. Rows, not cards — a link a
       line, no rule under each. */
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
    /* The colour class is on the same cell as the words — phpBB writes
       \`<td class="row1 pm_marked_colour"><span>Marked message</span>\`
       — so the cell cannot be squeezed into a swatch: at 12px it drew
       the label one character to a line. The stripe down its leading
       edge carries the colour here exactly as it does on a wide
       screen, and the row gives up its own padding so the stripe lands
       on the card's edge rather than floating inside it. */
    html[data-rr] table.tablebg[data-rr-pm-legend] > tbody > tr { padding: 3px 0; }
    html[data-rr] table.tablebg[data-rr-pm-legend] > tbody > tr > td[class*="pm_"] {
        width: 100% !important;
        padding: 3px 14px;
        box-shadow: inset 3px 0 0 var(--rr-pm);
    }
    /* A roster's meta line: the rank after the count, with a dot. */
    html[data-rr] table.tablebg[data-rr-roster] > tbody > tr > td[data-rr-col="rank"]::before { content: none; }

    /* A post's tools: the number, the two copies and "Reply with
       quote" lead; the board's own Profile / Send private message /
       Report follow as quiet words, not as a second row of buttons. */
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

    /* Leaving this topic: the two clusters take the width they need
       and wrap as two lines; a stray control outside one is a chip. */
    html[data-rr] .rr-topicbar__row[data-rr-row="away"] > .rr-btn {
        padding: 5px 11px;
        background: var(--rr-surface-2);
        border: 1px solid var(--rr-line);
        border-radius: var(--rr-radius-pill);
    }
    html[data-rr] .rr-topicbar__row[data-rr-row="away"] .rr-cluster { flex-wrap: wrap; }
    /* A control inside a rounded box takes the box's corner minus the
       gap between them, so the two curves are concentric instead of a
       square end butting a round one. */
    html[data-rr] input.rr-search__go { border-radius: calc(var(--rr-radius) - 3px); }
}

/* The board bar, open: a menu. Each group on its own rows, two links
   to a row, a hairline between groups; More pinned where it was
   tapped. The wrapped row it used to be read as a soup of links with
   no groups at all. */
@media (max-width: 720px) {
    html[data-rr] .rr-boardbar[data-rr-open] { padding-bottom: var(--rr-s2); }
    /* Both halves, not just the left one: the account group sits at the
       right of the desktop row now, and behind the fold it is a row of
       the menu like the two above it. */
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
    /* The fold's control keeps the top line to itself; the groups
       start under it at full width, so no link has to wrap around it.
       Only the first group of the left half — the account group is
       first inside the right one, and it is nowhere near the top. */
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
    /* Everything in the open menu is a full-width row; the language
       switch is a control, and a control stretched across the screen
       stops reading as one. */
    html[data-rr] .rr-boardbar[data-rr-open] .rr-langswitch {
        align-self: flex-start;
        margin-top: var(--rr-s3);
    }
}

/* The settings panel on a phone: a sheet, not a two-column window.
   The rail of categories becomes a strip of tabs across the top that
   scrolls sideways, each field stacks its control under its words,
   and the footer wraps. It was the desktop's 186px rail beside a
   column too narrow for its own labels, which wrapped letter by
   letter down the screen. */
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
        /* Both of these undo a desktop rule that means something else
           once the field is a column rather than a row.
         *
         * \`space-between\` spreads the words and the control to the top
         * and bottom of whatever height the row is given, and \`wrap\`
         * lays a field too tall for its line out in a *second column*
         * beside the first — 695px of it inside 358. */
        flex-wrap: nowrap;
        justify-content: flex-start;
        gap: var(--rr-s2);
        padding: var(--rr-s3) 0;
    }
    /* A switch stays beside its words: on and off need no room. */
    html[data-rr] .rr-field:has(> .rr-field__control > .rr-switch) {
        flex-direction: row;
        align-items: center;
        gap: var(--rr-s3);
    }
    /* The desktop row wraps a wide control off the line by giving the
       words a 16rem flex-basis. Down here the field is a column and
       that basis is a *height*: 256px of nothing between a label and
       the control it labels. Same trap as the accent chips' 100%.
       It still has to shrink, though — a switch keeps its field a row
       down here, and words that cannot shrink take their max-content
       width and push the row 300px past the sheet. */
    html[data-rr] .rr-field__text { flex: 0 1 auto; }
    html[data-rr] .rr-field__desc { max-width: none; }
    html[data-rr] .rr-field__control { flex-wrap: wrap; padding-top: 0; }
    html[data-rr] .rr-seg { flex-wrap: wrap; }
    html[data-rr] .rr-rangewrap { width: 100%; }
    html[data-rr] .rr-range { flex: 1; width: auto; }
    html[data-rr] .rr-panel__foot { flex-wrap: wrap; gap: var(--rr-s2); padding: var(--rr-s3); }
    html[data-rr] .rr-panel__foot .rr-spacer { display: none; }
}

/* ------------------------------------------------------------------
   The second reading of the phone screenshots.
   ------------------------------------------------------------------ */
@media (max-width: 860px) {
    /* A row hidden by the script stays hidden: the flex-row rule above
       was bringing a profile's empty rows back. */
    html[data-rr] #wrapcentre tr[data-rr-empty-row] { display: none !important; }
    /* A profile's label and its value on one line, the label quiet. */
    html[data-rr] #wrapcentre tr[data-rr-pair] { display: flex !important; flex-wrap: nowrap !important; align-items: baseline !important; gap: var(--rr-s2); }
    html[data-rr] #wrapcentre tr[data-rr-pair] > td:first-child { flex: none; width: auto !important; color: var(--rr-muted); }
    html[data-rr] #wrapcentre tr[data-rr-pair] > td:last-child { flex: 1 1 auto; width: auto !important; min-width: 0; }

    /* Centred cells are a desktop table's idea; stacked, they left a
       radio row or a heading floating in the middle of the card. */
    html[data-rr] #wrapcentre td[align="center"]:not([data-rr-col]) { text-align: left; }

    /* The icon legend under a listing: the dot beside its words, one
       pair to a line, instead of each dot centred above its label. */
    /* The two :not() classes are there to outweigh the generic
       table-unpacking rule above, which carries the same two. */
    html[data-rr] #wrapcentre table[data-rr-legend]:not(.tablebg):not(.forumline) { margin: var(--rr-s3) 0; }
    /* A two-column grid: every dot in the first column, its words in
       the second, one pair to a line at one spacing. The template's
       spacer cells between pairs go. */
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

    /* A post's header on a phone: name and rank, then the meta line,
       then the date — each on its own line, all from the left. The
       spacer that pushes the date right on a desktop put it right on
       some cards and left on others, depending on what wrapped. */
    html[data-rr] .rr-posthead__spacer { display: none; }
    /* The band reaches the card's edges here too, and the card's
       padding lives on the row rather than on the cell. The selector
       matches the desktop's exactly, so the tie is broken on source
       order — this file is last in the build. */
    html[data-rr] table.tablebg[data-rr-post] { --rr-post-pad: 14px; --rr-post-pad-top: 14px; }
    html[data-rr] table.tablebg[data-rr-post]:not([data-rr-quiet]) > tbody > tr > td.row1,
    html[data-rr] table.tablebg[data-rr-post]:not([data-rr-quiet]) > tbody > tr > td.row2,
    html[data-rr] table.tablebg[data-rr-post]:not([data-rr-quiet]) > tbody > tr.row1 > td,
    html[data-rr] table.tablebg[data-rr-post]:not([data-rr-quiet]) > tbody > tr.row2 > td { padding: 0; }
    html[data-rr] .rr-posthead__meta,
    html[data-rr] .rr-posthead__date { flex: 1 1 100%; text-align: left; margin: 0; }

    /* The page box holds two digits; it does not need a hand's width. */
    html[data-rr] .rr-pager__input { width: 3.4em; }
    /* The arrow to the first unread post beside a title: on a phone the
       title itself opens there, and the arrow read as a stray glyph. */
    html[data-rr] a.rr-unread-jump { display: none; }

    /* Forms: a multi-select as wide as its widest forum name overflowed
       the card; the message box at fifteen rows was a screen and a half. */
    html[data-rr] #wrapcentre select[multiple] { width: 100% !important; max-width: 100%; }
    html[data-rr] #wrapcentre textarea { max-height: 45vh; }

    /* The message folder's foot: the sort form in a bare table of its
       own, its cell right-aligned and nowrap for a desktop. The cell
       the width of the card, the form a wrapped row. The listing's
       "Go to page" strip and the "Page 1 of 5" line, the same. */
    html[data-rr] #wrapcentre table[data-rr-sortfoot] > tbody > tr > td,
    html[data-rr] #wrapcentre table[data-rr-strip] > tbody > tr > td { width: 100% !important; text-align: left; white-space: normal !important; }
    html[data-rr] #wrapcentre table[data-rr-sortfoot] > tbody > tr > td:empty { display: none; }
    html[data-rr] #wrapcentre td[data-rr-cat="controls"] form { float: none !important; }
    html[data-rr] #wrapcentre form[name="sortmsg"] .rr-ctrl-group { flex: 0 0 auto; }
    html[data-rr] #wrapcentre form[name="sortmsg"] .rr-ctrl-group > span.gensmall { white-space: nowrap !important; }
    html[data-rr] #wrapcentre form[name="sortmsg"] { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-start; gap: var(--rr-s2) var(--rr-s3); margin: 0 !important; }
    html[data-rr] #wrapcentre table[data-rr-sortfoot] { margin: var(--rr-s3) 0 !important; }
    /* A profile's two columns — presence and statistics, contact and
       profile — one under the other; side by side, the second's form
       controls were squeezed to a few letters. */
    html[data-rr][data-rr-profile] #wrapcentre table.tablebg > tbody > tr > td.row1,
    html[data-rr][data-rr-profile] #wrapcentre table.tablebg > tbody > tr > td.row2 { flex: 1 1 100%; }
    /* The message folder's export and mark controls sit in a table of
       their own, not the list's, so the strip that reads as a card's
       foot elsewhere was a bare band here. A card of its own. */
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
    /* The block above turns every row of it into a flex row, which put
       the author's name in a 46px column beside the subject with the
       card's left edge drawn round it. The card belongs to the row
       here, not to the cells: the two rows of a post are the top and
       the bottom of one box, and everything inside them is a line of
       its own. */
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
       of a nested table, and stacked that is four lines of a card
       whose message is three. One wrapped line, with the button
       pushed to the end of it. */
    html[data-rr] #wrapcentre tr[data-rr-review-row="head"] > td:not([data-rr-review-cell]) > table > tbody > tr {
        display: flex !important;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 2px var(--rr-s2);
    }
    html[data-rr] #wrapcentre tr[data-rr-review-row="head"] > td:not([data-rr-review-cell]) > table td:last-child { margin-left: auto; }
    /* The scroller keeps its own edge, so the cards inside it need no
       second one against the window. */
    html[data-rr] [data-rr-review] { padding: var(--rr-s2); }
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

/* ---- Buckets: big things, kept on their own key ------------------- */

/* store.set() rewrites the whole of rr:data every time, which is the
   right trade for a dozen small values and the wrong one the moment
   something in there runs to six figures. The palette's index of the
   topics this browser has seen is 136 bytes a topic and holds
   hundreds; store.set("history", …) runs on every topic opened, and it
   would have re-serialised all of them each time.

   A bucket is not exported with the settings either, and that is the
   other half of the reason: a cache is not a preference, and nobody
   wants 80 KB of remembered titles in their backup. Clearing the
   script's data drops them (settingsui.js, clearData). */
const bucketCache = new Map();

/* Any JSON value, where parseJSON() above insists on an object.

   That insistence is right for the settings and for rr:data, which are
   both maps and where anything else means the value was corrupted. A
   bucket holds whatever it was given — the palette's index is an
   array and the last-search stamp is a number, and stamping it through
   parseJSON() read every one of them back as "no value at all". */
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

/* ---- Schema access ------------------------------------------------ */

let schemaRef = [];
let defaults = null;

function registerSchema(groups) { schemaRef = groups; defaults = null; }
function schema() { return schemaRef; }

function allFields() {
    const out = [];
    for (const group of schemaRef) out.push(...group.fields);
    return out;
}

/* settings.get() is asked about a hundred times on a listing page and
   most of those fall through to the default; rebuilding the flat field
   list and scanning it for each one was the whole of that cost. */
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
/* ------------------------------------------------------------------
   DOM helpers and the icon set.

   Nothing in this script parses markup. Post content is only ever
   moved, cloned or read as textContent, and the icon set — the last
   place that did — is built with createElementNS. That keeps the
   interface working under a Trusted Types policy, where innerHTML and
   DOMParser both throw.
   ------------------------------------------------------------------ */

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

/* Two features fetch a page of the board and read it — the quick
   reply, and the releases walk — and DOMParser is the only way to turn
   HTML into a document.

   Under `require-trusted-types-for 'script'` parseFromString throws,
   verified rather than assumed. cs.rin.ru does not send that header
   today; the video players a game thread embeds do, and a board can
   add one any day. The escape hatch is a policy, which works unless
   the CSP also names an allow-list that excludes it — and where even
   that is refused this returns null and the caller says so, rather
   than throwing inside a click handler. */
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

/* The board paints usernames from their group, as an inline style on
   the link, and several of those are #BF0000 or darker on a near-black
   page — 2.5:1, against the 4.5 that 13px text is held to.

   Those colours are how the board tells you who is talking, so what
   follows keeps the hue and the saturation and moves only the
   lightness, by the smallest step that makes the name readable on
   whatever is actually behind it. A red name stays a red name. */

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

    /* Signed, and with exponents: oklab's a and b are routinely
       negative and Chrome writes very small ones as 5.126e-6. The
       plain [\d.]+ this used to be dropped the minus and cut the
       exponent off, which turns a green into a magenta. */
    const parts = (raw.match(/[+-]?\d*\.?\d+(?:e[+-]?\d+)?/gi) || []).map(Number);
    if (parts.length < 3) return null;
    const alpha = parts.length > 3 ? parts[3] : 1;

    /* What color-mix() actually computes to.

       The comment here used to say color(srgb r g b / a) and the code
       scaled by 255 on that basis. Chrome resolves these to *oklab*,
       and oklab's three numbers are a lightness of 0-1 and two axes
       either side of zero — read as sRGB bytes they come out
       near-black whatever the real colour is. Every element sitting on
       one of this stylesheet's 29 color-mix backgrounds was therefore
       measured against black: on the light theme that says pale text
       on a pale ground is fine, and the pass that exists to lift the
       board's own colours never fired on any of them. */
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

/**
 * oklab to sRGB bytes.
 *
 * The standard two steps: oklab to linear-light sRGB through the LMS
 * cone responses, then the sRGB transfer function. Clamped, because a
 * colour that is in oklab's gamut need not be in sRGB's and a channel
 * outside 0-255 makes nonsense of a contrast ratio.
 */
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

    const auto = relativeLuminance(behind) > 0.5
        ? { r: 0, g: 0, b: 0, a: 1 }
        : { r: 255, g: 255, b: 255, a: 1 };
    const lifted = mixToward(colour, behind, target, toward || auto);
    /* The theme's text colour is light, and a light box inside a dark
       post — a code block the board paints #ccc — cannot be reached
       that way. The other direction can. */
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

   The separator is a narrow no-break space (U+202F) and not a comma: a
   comma is the decimal separator for half this board's readers, to
   whom 3,097,072 has two decimal points in it. No-break, so it cannot
   leave a lone digit at the end of a wrapped line.

   Regrouped, never rounded: "3.1M" is a different fact. And only
   quantities — a build id, an AppID or a post number is a name spelled
   in digits — so nothing here sweeps a page; every caller names what
   it is handing in. */
const DIGIT_GROUP = "\u202f";

/* Where the grouping starts. Four digits where the caller knows the
   number is a count; five where it only knows it probably is, because
   2026 is a year and a year is a name — grouping one is an error the
   reader has to undo. */
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
    /* A topic in the palette: a sheet with lines on it. Boards are
       layers and bookmarks are stars; this is the third thing in that
       list and had been borrowing one of the other two. */
    topic:     '<path d="M5 4h9l5 5v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M14 4v5h5"/><path d="M8 13h7M8 17h5"/>',
    // The board's own emblem, redrawn: the masthead is a crosshair over
    // a Steam valve, and the crosshair is the half that survives being
    // shrunk to 20px.
    crosshair: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2"/><path d="M12 1.5v5M12 17.5v5M1.5 12h5M17.5 12h5"/>',
    clip:      '<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',

    /* The writing toolbar. Each of these has to read at 13px against a
       word, so they are the plainest shape that says the thing: two
       angle brackets for code, bullets and rules for the two kinds of
       list, a frame with a sun in it for an image, a play triangle for
       the video embed, a struck-through eye for the spoiler. */
    code:      '<path d="M9 7 4 12l5 5M15 7l5 5-5 5"/>',
    list:      '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="18" r="1.2"/>',
    listnum:   '<path d="M10 6h10M10 12h10M10 18h10M4 5.5 5.5 5v4M3.6 15.2a1.4 1.4 0 1 1 2.5.9L3.6 19h3"/>',
    image:     '<rect x="3" y="4.5" width="18" height="15" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="m4 17 4.5-4.5 4 4L16 13l4 4"/>',
    play:      '<rect x="2.5" y="4.5" width="19" height="15" rx="4"/><path d="m10 8.8 5.2 3.2-5.2 3.2z"/>',
    hide:      '<path d="M2.5 12S6.4 5.8 12 5.8 21.5 12 21.5 12 17.6 18.2 12 18.2 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.7"/><path d="M4 20 20 4"/>',
};

/* Each icon's shapes, built once as real nodes and cloned after.

   The definitions above are written as markup because that is how they
   are read and edited, but neither svg.innerHTML nor DOMParser
   survives a require-trusted-types-for policy — and a throw inside
   icon() takes the whole calling module with it, top bar included. The
   vocabulary is three self-closing tags with plain attributes, all
   written in this file, so two expressions and createElementNS read it
   back exactly and leave no markup sink to be gated. */
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

/* ---- Feedback ---------------------------------------------------- */

let toastHost = null;

function toast(message) {
    if (!toastHost) {
        /* A live region, so "Link copied" is said as well as shown. */
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

/* ---- Matching what somebody typed ---------------------------------- */

/* Case, accents and apostrophes folded away, so "dragons" finds
   "Dragon's" and "denuvo" finds "DENUVO". */
function foldText(text) {
    return String(text || "")
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        // Apostrophes go altogether: "clancys" finds "Clancy's", and so
        // does "clancy's" typed with either apostrophe.
        .replace(/['\u2019\u02bc]/g, "");
}

/**
 * Does `text` contain every word of `query`, in any order?
 *
 * The filter box and the command palette used to look for the whole
 * query as one run of characters, so "cracks hypervisor" found nothing
 * in "Hypervisor cracks support" and a second word typed after the first
 * narrowed the list to nothing instead of narrowing it further. A
 * query is words; each one has to be somewhere in the title.
 */
function matchesWords(text, query) {
    const words = foldText(query).split(/\s+/).filter(Boolean);
    if (!words.length) return true;
    const hay = foldText(text);
    return words.every((word) => hay.includes(word));
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

/** phpBB hides links behind a placeholder for guests; several features
    only make sense once the reader is logged in. */
function isLoggedIn() {
    return Boolean(document.querySelector('a[href*="mode=logout"]'));
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
 * `head` is read back off the page rather than only set when topic.js
 * builds it: every caller runs its own posts() pass, and one running
 * afterwards would otherwise fall through to the template's header
 * row, which the modern layout hides. That is how the "hide posts by
 * someone" control ended up on a row nobody could see.
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
        if (!href || !/viewtopic|viewforum|search|memberlist|viewonline|ucp\.php/.test(href)) continue;

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
        // "Page 1 of 19", or "Страница 1 из 19" on the Russian interface.
        // No \b before "из": a JavaScript word boundary is ASCII-only and
        // never fires next to a Cyrillic letter.
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

/* ================= src/core/i18n.js ================= */
/* ------------------------------------------------------------------
   The script's own words, in the board's other language.

   The board is bilingual and the script reads both halves (column
   headers, page counters, weekdays — see lists.js and topic.js). What
   it *says* — Reply, First unread, Releases, Show all 300 names — was
   English on both. On the Russian interface that put a row of English
   controls over a Russian page. These are those words, once each, with
   the Russian beside them; the settings panel stays in English.

   `t("Open all {n} spoilers", { n })` looks the key up when the page is
   Russian and fills the braces either way. A Russian entry may be a
   function of the variables, because Russian counts in three forms:
   1 спойлер, 3 спойлера, 5 спойлеров.
   ------------------------------------------------------------------ */

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
    // The topic bar
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

    // Posts
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

    // Listings
    "{n} on this page": "{n} на этой странице",
    "{a} of {b} on this page": "{a} из {b} на этой странице",
    "Filter this page by title": "Фильтр по названию",
    "Filter topics on this page": "Фильтр тем на этой странице",
    "Show only {x}": "Показать только {x}",
    "Tag": "Метка",
    "Show only one kind of topic": "Показать только один вид тем",
    "Showing only {x} — pick another or clear": "Показаны только {x} — выберите другую или снимите",
    "Bookmark this topic": "В закладки",
    "{n} topics": ({ n }) => n + " " + ruPlural(n, "тема", "темы", "тем"),
    "Fold this section": "Свернуть раздел",
    "Show this section": "Показать раздел",
    "Subforums": "Подфорумы",

    // The search box
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

    // Who is online
    "{n} online": "{n} онлайн",
    "{n} browsing": "{n} просматривают",
    "{n} registered": "{n} зарегистрированных",
    "{n} hidden": "{n} скрытых",
    "{n} guests": ({ n }) => n + " " + ruPlural(n, "гость", "гостя", "гостей"),
    "Show all {n} names": ({ n }) => "Показать все " + n + " " + ruPlural(n, "имя", "имени", "имён"),
    "Hide the list": "Скрыть список",

    // The Releases panel
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

    // The quick reply
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

    /* The writing toolbar on posting.php. The captions are what the
       button says, so they are short; the tips are what it does. */
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

    // The top bar
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

    // The Steam preview card. The board's own "Posted:" tooltip is
    // taken off the title so this card can be the only thing that
    // answers on hover, so the date it carried has to speak Russian
    // here too.
    "Topic opened {when}": "Тема создана {when}",

    // The command palette
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

    // Topics in the palette, and the pane beside it
    "Topics": "Темы",
    "wait {n}s": "подождите {n} с",
    "Reading that topic…": "Читаю тему…",
    "this topic": "эта тема",
    "Opened by {who}": "Создал {who}",
    "Enter to open": "Enter — открыть",
    "{n} pages": (vars) => {
        // Страница / страницы / страниц: the count decides, and the
        // teens are the exception that catches every naive rule.
        const n = Number(vars.n) || 0;
        const teens = n % 100 >= 11 && n % 100 <= 14;
        const last = n % 10;
        if (!teens && last === 1) return n + " страница";
        if (!teens && last >= 2 && last <= 4) return n + " страницы";
        return n + " страниц";
    },
};

/**
 * The word for the page's language, with `{name}` slots filled.
 * `currentLanguage()` (navbar.js) reads <html lang>; anything but
 * Russian gets the English key as written.
 */
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
    root.setAttribute("data-rr-page", PAGE.isTopic ? "topic" : PAGE.isForum ? "forum" : PAGE.isIndex ? "index" : PAGE.isSearch ? "search" : "other");
    root.setAttribute("data-rr-icons", settings.get("modernIcons") ? "on" : "off");
    root.setAttribute("data-rr-nav", settings.get("navbar") ? "on" : "off");
    /* Whether the board's own header is replaced, which is not the
       same question as whether the top bar is on: with the bar off the
       board links row and the masthead still stand in for it. Set here
       so the original 340px header never flashes; navbar.js corrects
       it if nothing was actually built. */
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
    /* The accent used as text on its own soft wash — a pressed filter
       chip, the count on a settings tab. On the light theme the raw
       accent read at 3.3:1 there; it is lifted toward black or white
       until it clears 4.5, and left as it is where it already does. */
    const lifted = readableInk(parseColour(ink), parseColour(soft), 4.5);
    root.style.setProperty("--rr-accent-on-soft", lifted ? rgbText(lifted) : ink);
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

/* ---- The board's own colours, kept and made readable --------------- */

/* The board's own inline colours, kept and lifted.

   Group-coloured usernames come out at 2.5:1 on the dark themes and
   1.9:1 on the light one, and the "[[Please login to see this link.]]"
   marker at 3.1. Each keeps its hue and its saturation and moves only
   in lightness, by the smallest step that reads against whatever is
   actually behind it. Only colours the board wrote inline, only where
   they fail; the original stays on the element.

   One threshold for everything, a little over the 4.5 the rest of the
   web is held to and well over the 3 WCAG allows large text: two
   thresholds meant this pass and test/contrast.js could disagree about
   one span in a signature and both be right. */
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
        node.style.color = rgbText(lifted);
    }
}

/** A parsed colour back as CSS. */
function rgbText(colour) {
    return "rgb(" + Math.round(colour.r) + ", " + Math.round(colour.g) + ", " + Math.round(colour.b) + ")";
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

const STATUS_RE = /(global|announce|sticky|topic|forum)_(un)?read|topic_moved/;

/* Images that sit beside a label saying the same thing, or that draw
   nothing at all: the 12px menu bullets, the page-jump target, the
   1px spacers subsilver2 uses for table corners. */
const DECORATION_RE = /icon_mini_|icon_donate|spacer\.gif|icon_post_target|\/arrow_|subforum_|whosonline/;

function statusDot(img) {
    const src = img.getAttribute("src") || "";
    const unread = /_unread/.test(src);
    const locked = /locked/.test(src);
    /* The one GIF the first pass left behind: a moved topic's shadow
       row, which kept the template's beveled arrow beside rows that had
       all been redrawn. */
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

/**
 * "This topic has an attachment" — a beveled paperclip GIF the template
 * draws ahead of the title, in front of the [Release] tag rather than
 * beside the fact it is closest to. A muted vector glyph replaces it
 * after the title link instead, the way the latest-post arrow follows
 * rather than leads.
 */
function attachmentGlyph(img) {
    const label = img.getAttribute("title") || img.getAttribute("alt") || "Attachment(s)";
    const glyph = icon("clip", 12);
    glyph.classList.add("rr-attach");
    glyph.setAttribute("title", label);
    // Where the board put it, ahead of the tag and the title. Placed
    // after the title it wrapped to a line of its own on a phone the
    // moment the title filled the card's width.
    img.after(glyph);
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

    if (unreadJump(link, img, label)) return true;

    link.classList.add("rr-ctl");
    link.setAttribute("title", label);
    link.append(el("span.rr-ctl__label", {}, [label]));
    img.style.display = "none";
    return true;
}

/**
 * The little arrow beside an unread topic's title, "View first unread
 * post". As a labelled control it was a 146px button in front of every
 * title on "View new posts" — a hundred of them on the page, each
 * louder than the title it belonged to. It is an arrow; it stays one,
 * after the title, and the row that already sends its title to the
 * first unread post (the unreadFromList setting) hides it.
 */
function unreadJump(link, img, label) {
    if (!/view=unread/.test(link.getAttribute("href") || "")) return false;
    const row = link.closest("tr");
    // The control panel's watched-topics list names its titles with no
    // class at all; the topic link in the same row is the one that is
    // not this arrow and not a page number.
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

        /* The board's face, not one of its controls. It is an <img>
           alone inside a link to the index, which is the shape
           controlLink() is for — so the masthead came out as a chip
           reading "Logo", its own alt text. Invisible while the top bar
           covered the header; the whole header, with the bar off. */
        if (/site_logo|imageset\/logo/i.test(src)) continue;

        if (STATUS_RE.test(src)) { statusDot(img); continue; }
        if (/icon_topic_latest/.test(src)) { latestPostArrow(img); continue; }
        if (/icon_topic_attach/.test(src)) { attachmentGlyph(img); continue; }
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
   button because there is nothing to save at the end. The exception is
   the handful of fields the schema marks `reload` — see applyField.

   The panel is a rail of categories beside the controls rather than
   one scroll of sixty rows. Picking a category shows that category;
   typing in the search box searches all of them at once and the rail
   then says how many each one holds, so a setting whose name you half
   remember is one glance rather than nine.
   ------------------------------------------------------------------ */

let panelHost = null;

/**
 * Store a field's value, and reload where that is the only way to apply
 * it.
 *
 * Nearly everything here is a class or a custom property and lands the
 * moment it is set. The header is not: the top bar, the board links row
 * and the masthead are built once at load out of the board's own
 * markup, and the stylesheet uncovers the board's own 340px masthead
 * the moment the bar is switched off. Toggled live, that put the two on
 * top of each other — the board's header showing through, the script's
 * bar floating over it, the page under both with no room reserved for
 * either. A field that cannot be undone in place says so in the schema
 * and gets a reload; the rest still apply as you click them.
 */
function applyField(field, value) {
    settings.set(field.id, value);
    if (!field.reload) return;
    toast(t("Applying. Reloading."));
    setTimeout(() => location.reload(), 600);
}

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

/* Six unlabelled squares of colour, one of them with a ring round it,
   was the whole control: which was which took hovering each in turn,
   and the ring on the chosen one was easy to miss beside five others
   the same size. Each is a named chip now — the colour as a dot, its
   name under it, a tick on the one in use — and the chip lights up
   under the pointer, so the choice reads as a choice. */
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
        // A custom property has to go through setProperty; Object.assign
        // on style, which el() uses, silently drops it.
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
    // Searched on the words a reader would use, not the id: nobody
    // looks for "linkifyBare". The id is in there anyway, for whoever
    // read it in an export.
    row.dataset.search = (field.label + " " + (field.desc || "") + " " + field.id).toLowerCase();
    if (field.when) row.setAttribute("data-rr-dep", field.when);
    return row;
}

/** A field is only shown when the field it depends on is on. */
function syncDependencies(body) {
    for (const row of body.querySelectorAll("[data-rr-dep]")) {
        row.toggleAttribute("data-rr-dep-off", !settings.get(row.getAttribute("data-rr-dep")));
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
        // Bookmarks, history, hidden members — what a move to another
        // browser wants. Not the drafts: an unsent reply is not settings
        // and has no business on a clipboard.
        data: Object.fromEntries(Object.entries(store.all()).filter(([key]) => key !== "drafts")),
    };
    copyText(JSON.stringify(payload, null, 2), "Settings and data copied as JSON");
}

/* Bookmarks, history, hidden members, the Releases cache, the titles
   the palette remembers: the data the script keeps for itself, gone in
   one step. The settings stay.

   The last of those sits on a key of its own rather than in rr:data
   (store.js, buckets), so replacing rr:data does not reach it — it is
   dropped by name, by the module that owns the name. */
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
            /* "Export" copied to the clipboard and took bookmarks and
               history with it, and said neither. */
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
        return wrap;
    }

    /* The control panel, the member list, a profile: the board's
       breadcrumb on those is "Board index" and nothing else, but the
       window title knows where you are — "CS RIN • User Control Panel
       • View messages". The parts after the board's name are the rest
       of the trail. */
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

/** Where the template put the masthead art, whatever it is called. */
function findLogo() {
    return document.querySelector(
        '#logodesc img[src*="site_logo"], #wrapheader img[src*="site_logo"], #wrapheader img[src*="logo"]'
    );
}

/* The board's wordmark, traced off its own art into one path.

   Not an <img>, and not a CSS mask either: the board sends `img-src
   'self'`, so a data: URI is refused in both — checked on the live
   board, where the masked version drew a filled grey rectangle where
   the name should be. An inline <svg> is DOM rather than a fetched
   image and is not governed by that directive, which is what the icon
   set already relies on.

   Filled with currentColor, so the mark is the bar's own ink on every
   theme rather than the light grey the file is painted in, and there
   is no plate behind it. */
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

/* The board's own search form, given the frame the palette trigger
   has: one field with the search glyph at its head and whatever it
   submits with tucked inside its right edge. Two boxes doing the same
   job in two visual languages was the thing to fix; the rule the rest
   of the interface follows is that a control has the button radius and
   a pill is a label.

   The form is the board's own, moved, so its action, its hidden inputs
   and its tokens are untouched. */
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
    const frame = el("div.rr-search", {}, [form]);
    addSearchOptions(frame, form, field, submit);
    return frame;
}

/* ---- Where a search looks ------------------------------------------ */

/* The board's own boxes are fixed: "Search this forum" searches titles
   in this forum, "Search this topic" searches the text of this topic,
   and anything else is the full search form on another page. The
   choice people actually make — this forum or the whole board, titles
   or every post — is two hidden inputs away, so it is offered here, in
   the same box, behind one small control. The form that is submitted
   is still the board's own; only what its hidden fields say changes.

   The choice is kept in this browser, so a reader who always wants to
   search every post sets it once. */
/* The four the full search form offers, in the board's own order of
   reach. "Message text" is the one that finds a phrase somebody typed
   inside a thread whose title says nothing about it, which is most of
   what this board is; it was missing here because the board's own
   boxes never offer it. */
const SEARCH_IN = [
    { value: "titleonly", label: "Titles" },
    { value: "firstpost", label: "First post" },
    { value: "msgonly", label: "Message text" },
    { value: "all", label: "All posts" },
];

/* Two more from the full form, kept with the rest so the box and the
   palette cannot disagree about them either: every word or any word,
   and whether the answer is a list of threads or a list of posts. */
const SEARCH_TERMS = [
    { value: "all", label: "All words" },
    { value: "any", label: "Any word" },
];

const SEARCH_SHOW = [
    { value: "topics", label: "Topics" },
    { value: "posts", label: "Posts" },
];

/* ---- Which forum you are actually in -------------------------------

   The breadcrumb is the only thing on the page that knows. Half the
   links on this board are written `viewtopic.php?t=105454` with no
   forum id at all, so PAGE.forumId is null on any topic reached from
   a listing — and every search made from one went to the whole board
   while saying it was searching this one.

   The trail comes back outermost first: English Forums, Main Forum,
   Temporarily Restricted Topics. */
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

/* The forum above the one you are in, when there is one worth having.

   This board moves topics: a cracked game lives in Main Forum »
   Temporarily Restricted Topics, and searching Temporarily Restricted
   Topics finds the handful of topics that happen to be in that state
   today rather than the 61,000 the reader meant. The room above is
   the one people mean by "this forum".

   The first crumb after Board index is a category — English Forums —
   which holds no topics of its own, so a trail only two deep has
   nothing above it to offer. */
function parentForum(trail) {
    return trail.length >= 3 ? trail[trail.length - 2] : null;
}

/** A forum name that fits on a chip, with the whole of it on hover. */
function shortForumName(name) {
    const said = String(name || "").trim();
    return said.length > 24 ? said.slice(0, 23).trimEnd() + "\u2026" : said;
}

const SEARCH_PREFS_KEY = "searchPrefs";

/* `where` starts as null rather than "here" on purpose: it has to be
   possible to tell "nobody has chosen" from "somebody chose this
   forum", because the two get different defaults. Only a click writes
   it. */
function searchPrefs() {
    const kept = store.get(SEARCH_PREFS_KEY, null);
    return Object.assign({ sf: "titleonly", where: null, terms: "all", sr: "topics" },
        kept && typeof kept === "object" ? kept : {});
}

/** One of a list of {value,label}, or the first of them. */
function searchChoice(key, options) {
    const kept = searchPrefs()[key];
    return options.some((option) => option.value === kept) ? kept : options[0].value;
}

function setSearchPref(key, value) {
    const next = searchPrefs();
    next[key] = value;
    store.set(SEARCH_PREFS_KEY, next);
}

/** The depth the palette's own search asks for. */
function searchDepthChoice() {
    const sf = searchPrefs().sf;
    return SEARCH_IN.some((option) => option.value === sf) ? sf : "titleonly";
}

/* ---- The popover both search boxes share ---------------------------

   Where to look and how deep, drawn once. What a choice *means* is the
   caller's: on a forum or a topic it rewrites the form's hidden fields
   and the reader presses Search, and on a results page there is
   nothing left to submit — the query has already run — so choosing
   runs it again.

   `onChange(place, depth, first)` is called on every choice and once
   at the start with `first` true, which is how the results page tells
   "this is where the search went" from "take it somewhere else". */
function buildSearchPopover(frame, field, submit, config) {
    const places = config.places;
    let where = config.where;
    let depth = config.depth;

    const whereSeg = el("div.rr-seg", { role: "group", "aria-label": t("Where to search") });
    const inSeg = el("div.rr-seg", { role: "group", "aria-label": t("What to search") });
    const inRow = el("div.rr-search__row", {}, [el("span.rr-search__rowlabel", {}, [t("Look in")]), inSeg]);

    /* The trigger carries the answer. A box that searches somewhere
       other than the room named above it is the sort of thing you find
       out about from the results; the room is printed on the control
       that changes it, visible without opening anything. */
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
        /* The room is printed on the control now, so the accent is kept
           for the half that is not: how deep it looks. */
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

    /* Reachable from the field, mid-query, without leaving the
       keyboard: the down arrow opens the choices the way it opens a
       combobox everywhere else, and the current one takes focus.
       Typing a query and finding out afterwards that it went to the
       wrong room is the whole complaint this control answers. */
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

    // A results page refines rather than searches a place; its box gets
    // the control below instead.
    if (PAGE.isSearch) return addResultOptions(frame, field, submit);
    if (!topicId && !forumId) return;

    const setHidden = (name, value) => {
        let input = hidden(name);
        if (value === null) { if (input) input.remove(); return; }
        if (!input) { input = el("input", { type: "hidden", name }); form.append(input); }
        input.value = value;
    };

    /* The rooms are named rather than described. "This forum" is a
       word longer than "Main Forum" and says less: on a board that
       moves topics between rooms, which room you are in is exactly the
       thing worth printing. */
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

    /* Where it starts when nobody has said.
     *
     * From a topic, the forum above the one it sits in — see
     * parentForum(). The board's own box starts on the topic, which
     * answers "where in this thread did somebody say that" rather than
     * "what else is there like this", and the second is what people
     * open the box for. Both are one click apart and the choice
     * sticks.
     *
     * From a listing, the listing: you are already in the room you
     * meant. */
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
                // The palette offers these two and remembers them;
                // the box submits the same search, so it sends what
                // was chosen rather than its own idea of it.
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
                /* The prompt in the field says the room too, so the
                   control stops repeating it until a query covers the
                   prompt up. The results page has no such prompt and
                   is not marked. */
                frame.setAttribute("data-rr-echo", "");
            }
        },
    });
}

/* ---- Re-aiming a search you are already looking at ------------------

   The results page has one box and it refines: it adds words to the
   query that already ran. What it cannot do is move it. A search of
   titles in one forum that found nothing has to be retyped into the
   full search form to become a search of every post on the board,
   which is the second thing anybody wants after the first search
   misses — and until you have retyped it, nothing on the page says
   where the first one looked.

   phpBB keeps the whole query in the URL, so it can simply be run
   again with one field changed. */
function searchQuery() {
    const here = new URLSearchParams(location.search);
    if (here.get("keywords")) return here;
    // A search submitted as a POST lands on a page whose own form
    // action carries the query instead.
    const form = document.querySelector('#search-box form[action*="keywords="], form[action*="keywords="]');
    const action = form ? form.getAttribute("action") || "" : "";
    const at = action.indexOf("?");
    const fallback = new URLSearchParams(at > -1 ? action.slice(at + 1) : "");
    return fallback.get("keywords") ? fallback : here;
}

/** A forum's name from the list the palette cached off the index. */
function knownForumName(id) {
    const hit = store.get("forums", []).find((entry) => String(entry.id) === String(id));
    if (hit) return hit.title;
    // The index knows the boards it lists; the tree knows the
    // subforums under them, which is where a search picked from the
    // palette's chooser is most likely aimed (palette.js, forumTree).
    const room = forumTree().find((entry) => String(entry.id) === String(id));
    return room ? room.title : null;
}

function addResultOptions(frame, field, submit) {
    const query = searchQuery();
    const keywords = query.get("keywords");
    // "View active topics" and the unanswered list are searches with no
    // words in them; there is nothing to re-aim.
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


/** Frame one of the board's own search boxes where it stands, rather
    than at the end of whatever cell it was in. */
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
 * The board writes `#topic-search` three times on a topic page: into
 * the breadcrumb strip at each end, and into the sort strip under the
 * posts. The first goes to the topic bar and the last is hidden as a
 * duplicate; the one in the sort strip is left where it is, and it was
 * the only search box on the board still wearing the template's shape
 * — a bare field beside a bordered button, beside three select menus
 * that have been redrawn.
 *
 * Runs after every module, so a box another one has already moved is
 * left alone.
 */
function frameStraySearch() {
    for (const form of document.querySelectorAll(
        "#wrapcentre form#topic-search, #wrapcentre form#forum-search, #wrapcentre #search-box form")) {
        if (!form.getClientRects().length) continue;
        frameBoardSearch(form);
    }
}

/* ---- Board bar ---------------------------------------------------- */

/* The masthead is the board's only route to its rules, its FAQ, the
   chat, the donation page, registration and the English/Russian
   switch. rr-nav lifts the search box, the inbox and the account link
   out of it and the stylesheet then hides the rest, which takes those
   six links with it. They come back here, as one slim row at the top of
   the content, in the order the masthead used. */

/* Destinations the navbar already offers as an icon of its own.

   Recorded as it builds them rather than guessed at with a pattern.
   The pattern that was here matched the inbox and the login link, and
   missed the one that mattered: signed in, the account icon points at
   `ucp.php`, and `ucp.php` is also the masthead's "User Control Panel"
   — so the row carried a 150px chip for a link already sitting three
   inches above it, and it carried it in the one place where width was
   short. What the bar actually took is not something to infer. */
const NAV_TOOK = new Set();

/** The same href written twice — with a session id, without — is one
    destination. */
function linkKey(href) {
    return String(href || "").replace(/[?&]sid=[a-f0-9]+/, "").replace(/[?&]$/, "");
}

/**
 * One entry in the board bar.
 *
 * The original anchor is moved rather than copied, so the session id in
 * its href, and anything another userscript has attached to it, both
 * survive.
 */
/* The board runs on donations. The link to that page used to get an
   outline and a heart, which made it the one loud thing in a row of
   quiet ones; it is an ordinary link in the row now, named so the
   narrow layout can still keep it in view, and the palette still
   offers it from anywhere. */
const DONATE_RE = /donat/i;

function isDonateLink(link) {
    return DONATE_RE.test(link.getAttribute("href") || "")
        || DONATE_RE.test(link.textContent || "");
}

function boardBarLink(link) {
    const label = link.textContent.replace(/\s+/g, " ").trim();
    const image = link.querySelector("img");

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
    if (isDonateLink(link)) {
        link.classList.add("rr-boardbar__donate");
        link.setAttribute("title", label + " — the board is hosted on donations");
    }
    return link;
}

/* Twelve links in the order the masthead printed them is a list, not a
   menu. They are three kinds of thing:

     views    — ways of looking at threads (unanswered, active, unread)
     board    — what the board is (rules, FAQ, chat, members, search)
     account  — you (register, log in, log out, profile)

   The first two lead the row and the third ends it, hard against the
   language switch — which is where the board itself put them. Its
   masthead is two rows of two cells: the board on the left, you on the
   right, `Logout [ name ]` the last thing before the flags. That split
   is the one thing about those rows worth keeping, and the version
   that ran everything together on the left lost it. Grouping is also
   what stops `Logout [ name ]` wrapping alone onto a second line.

   Classified by destination, not by label: the labels are translated
   and the hrefs are not. A view is a saved search — `search.php`
   carrying a `search_id`; plain `search.php` is the board's search
   form, which is a tool like the FAQ rather than a way of reading. */
const BOARD_BAR_GROUPS = [
    { id: "views", label: "Threads", re: /search\.php\?[^#]*search_id=/ },
    { id: "board", label: "Board", re: null },      // whatever is neither of the others
    { id: "account", label: "Account", end: true,
        re: /ucp\.php|mode=(?:login|logout|register)|viewprofile|profile\.php/ },
];

/* The board opens every one of its view links with the same word:
   "View unanswered posts", "View active topics", "View unread posts",
   "View new posts", "View your posts". Five chips in a row, each
   starting with a word that says nothing about where it goes — and
   signed in, on a 1100px window, the row ran off the side of the page.

   The shared opening goes rather than being translated away: these
   words are the board's, and its Russian half writes its own. Whatever
   the links happen to start with, if they all start with it and each
   has something left afterwards, it is dropped; the board's full
   wording stays as the link's name for anyone hovering or listening. */
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

/* The board's two language links are `index.php?lang=en` and
   `index.php?lang=ru`, each with a flag. But a guest who has switched
   to Russian gets `lang=ru` stamped on *every* navigation link, and
   reading the parameter alone turned Rules, FAQ, Register and Search
   into a row of pills that all said "RU" while the bar behind them
   emptied. A language link carries a flag, or a language for a name,
   or nothing in its query but the language. */
function isLanguageLink(link, href) {
    if (!/[?&]lang=/.test(href)) return false;
    if (link.querySelector('img[src*="uk.png"], img[src*="ru.png"], img[src*="/flags/"], img[src*="lang_"]')) return true;
    if (/^\s*(?:english|русский|en|ru)\s*$/i.test(link.textContent)) return true;
    // Only the index takes a bare lang=: search.php?lang=ru&sid=… is the
    // search page, in Russian.
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

    // "View unanswered posts | View active topics" is the board's own
    // strip. It currently floats above the listing with nothing around
    // it; here it leads the row.
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

    // In the order declared, not the order the masthead happened to
    // print them: a group that is empty on this page simply is not
    // drawn, and the one marked `end` goes to the right of the row
    // rather than the left, in front of the language switch.
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

    // On a phone eight links and two flags wrap to three lines and take
    // 90px before any content. The two entry points people actually
    // start from stay put — every guide to this board says to bookmark
    // "View unanswered posts" — and the rest folds behind one control.
    // The stylesheet decides at what width; this is only the switch.
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
 * Give a control a name, said three ways.
 *
 * These are glyphs with nothing beside them. `aria-label` is what a
 * screen reader announces; `data-rr-tip` is what the stylesheet draws
 * on hover and on focus, straight away. Both say the same words, from
 * one argument, so they cannot drift apart. There is deliberately no
 * `title`: the browser's own tooltip arrived a second after the drawn
 * one and sat on top of it, the same words twice.
 */
function labelled(node, text) {
    node.removeAttribute("title");
    node.setAttribute("aria-label", text);
    node.setAttribute("data-rr-tip", text);
    return node;
}

function buildNavbar() {
    const bar = el("header.rr-nav", { role: "banner" });
    /* The bar runs edge to edge; its contents keep to the content
       column, so the brand and the icons line up with the board bar and
       the listing under them on a wide monitor instead of sitting at
       the screen's edges half a metre from either. */
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
        t("RIN Reforged settings"));
    settingsButton.addEventListener("click", () => openSettings());
    actions.append(settingsButton);

    inner.append(actions);
    return bar;
}

/* ---- The board's own masthead ------------------------------------- */

/**
 * The board's face, kept.
 *
 * The 340px masthead is traded for a 48px bar on every page of a
 * thread, but the art in it is not chrome — the crosshair over a Steam
 * valve is what the board looks like. So it comes back once, on the
 * index, at the size the board draws it.
 *
 * A new <img> at the same file rather than the original moved out of
 * #wrapheader: that block is hidden rather than removed precisely
 * because other userscripts read it.
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
 * The board's name and the line under it.
 *
 * The masthead is three things, not one: the art, the name centred
 * beside it, and the links underneath. With the top bar carrying the
 * name everywhere, the art alone was the whole of what was worth
 * keeping — without a bar it is a picture with a row of chips beside
 * it and nothing saying which board this is, which is the one thing
 * the board's own header never leaves out.
 *
 * Read out of the template rather than moved: #wrapheader is hidden and
 * kept because other userscripts read it, the same reason the art is a
 * new <img> rather than the original.
 */
function buildBoardName() {
    const heading = document.querySelector("#logodesc h1, #wrapheader h1");
    if (!heading) return null;

    const name = heading.textContent.replace(/\s+/g, " ").trim();
    if (!name) return null;

    const block = el("div.rr-boardname", {}, [el("h1.rr-boardname__title", {}, [name])]);

    // "cs.rin.ru | csrin.org | The password is usually one of these."
    const strapline = heading.parentElement
        && heading.parentElement.querySelector("span.gen, span.gensmall");
    const line = strapline ? strapline.textContent.replace(/\s+/g, " ").trim() : "";
    if (line) block.append(el("p.rr-boardname__strap", {}, [line]));

    return block;
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

/**
 * The script's own controls, for a page with no top bar to hold them.
 *
 * Search, the palette and the settings panel live on the bar and
 * nowhere else, so switching the bar off switched off the only way into
 * any of them. They are not the board's controls, so they end the board
 * links row past a hairline, exactly the way they end the bar.
 */
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
    /* On the index with the bar, and on every page without one. The
       masthead is the board's face and the bar is what carries it
       elsewhere; with no bar, nothing else on the page says which board
       this is, which is why the board itself prints it on every page. */
    const banner = settings.get("masthead") && (PAGE.isIndex || !bar) ? buildMasthead() : null;
    const name = banner && !bar ? buildBoardName() : null;

    if (board && !bar) (board.querySelector(".rr-boardbar__end") || board).append(buildHeaderTools());

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
    /* Beside each other with the bar, stacked without it: no bar means
       this block *is* the board's header, and the board's own is a
       picture with its name centred beside it and the links on a line
       of their own underneath. `data-rr-stack` is what the stylesheet
       reads to lay it out that way. */
    const parts = [banner, name, board].filter(Boolean);
    if (centre && parts.length > 1) {
        centre.prepend(el("div.rr-header", { "data-rr-stack": bar ? null : "" }, parts));
    } else if (centre && parts.length) {
        centre.prepend(parts[0]);
    }

    /* The board's own 340px masthead is worth uncovering only where
       nothing here replaced it — with the bar off and the board links
       off, the reader has asked for the board's own header and should
       get it. The attribute is set optimistically at document-start
       (theme.js) so the original never flashes; this is the correction
       for the page where neither was built. */
    document.documentElement.setAttribute("data-rr-header", bar || board || banner ? "rr" : "board");

    if (!bar) return;
    // The forum anchors "back to top" at <a name="top">, which now sits
    // under the sticky bar; offset it so jumps land in the right place.
    // The same padding is what lands a post under the bar rather than
    // behind it when a link to one is followed (see settleFragment).
    document.documentElement.style.scrollPaddingTop = "calc(var(--rr-nav-h, 48px) + 14px)";
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

/* subsilver2 types the bars between its link strips into the template
   beside each link rather than generating them between the links that
   survive, and the links are conditional. So a reader who cannot see
   one gets its separator anyway — "Unsubscribe topic | Bookmark topic
   | | E-mail friend", or a lone `|` at the end of a cell that is still
   100% wide. Neither is visible logged out, which is why they survived
   this long.

   Same job dropStrayBreaks() does for the template's <br> spacing: a
   separator only belongs between two things that are there. */
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

/* A cell that is one column of a data table.

   Hiding such a cell does not blank the column, it removes it: every
   cell after it in that row slides one place left, out from under its
   own header. The Team page, where the board leaves the e-mail cell of
   a member with no address holding one &nbsp;, drew four values under
   five headings because of it. */
function isGridCell(cell) {
    if (cell.tagName !== "TD") return false;
    const row = cell.parentElement;
    if (!row || row.children.length < 3) return false;
    const table = cell.closest("table");
    return Boolean(table && table.querySelector(":scope > tbody > tr > th"));
}

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
        if (isGridCell(strip)) continue;
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
    if (document.documentElement.getAttribute("data-rr-header") !== "rr") return;

    for (const crumbs of document.querySelectorAll("#wrapcentre p.breadcrumbs")) {
        const strip = crumbs.closest("table.tablebg");
        if (!strip) continue;
        /* Without the bar the breadcrumb is not duplicated anywhere —
           it is the only one on the page — so the strip has earned its
           place whatever else is in it. */
        if (crumbs.getClientRects().length) {
            strip.setAttribute("data-rr-crumbstrip", "");
            frameBoardSearch(strip.querySelector("#search-box form, form#forum-search, form#topic-search"));
            continue;
        }
        // A control that is still in the strip but no longer drawn does
        // not earn it a place: the board writes its search box into the
        // strip at the top of the page and the one at the bottom, and
        // the second copy is hidden by then (see dedupeSearchBoxes).
        // Measured rather than assumed, so a control hidden by any
        // route counts the same.
        const controls = Array.from(strip.querySelectorAll("form, input, select, textarea"));
        if (!controls.some((node) => node.getClientRects().length)) { strip.style.display = "none"; continue; }
        /* It survives for its search box alone — on a profile, the
           member list, the control panel, where there is no listing
           toolbar to move that box into. Drawn as a card it is a
           full-width grey band holding one field at its right-hand
           end; named here, the stylesheet draws it as a plain row.

           And the box itself gets the frame every other search box on
           this board now has, rather than staying the template's field
           beside a bordered button — which is the shape everything
           else was moved away from. */
        strip.setAttribute("data-rr-crumbstrip", "");
        frameBoardSearch(strip.querySelector("#search-box form, form#forum-search, form#topic-search"));
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
    /* The member list, the private message folders and the control
       panel's own tables. Named so the same treatment reaches them —
       a "Joined" or "Sent" column carries the same weekday date as a
       listing's Last post column, and the "Rank" column carries the
       same two-language rank as a post's profile. */
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
    /* The Russian interface. Half the board reads it, and with the
       headers unread nothing below them was: counts ungrouped, dates
       with their weekday, the last-post column on two lines. */
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

/**
 * Tag every cell with data-rr-col, derived from the <th> row so the
 * mapping survives a template that adds or drops a column.
 */
function labelColumns(table) {
    const headRow = table.querySelector("tr:has(th)") || table.querySelector("th")?.parentElement;
    if (!headRow) return;
    /* Named, because it is not always the table's first row: a forum
       listing opens with the "Mark forums read" strip above it. */
    headRow.setAttribute("data-rr-head", "");

    /* Only a listing reads a spanning header as the title column. A
       profile's "User statistics" spans its label and value cells, and
       read that way made the "Joined:" label an icon column and its
       date a title. A message folder's title is a span with the link
       inside, so that shape counts too. */
    const listing = Boolean(table.querySelector("a.topictitle, a.forumlink, .topictitle a"));

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
            if (!listing) {
                for (let i = 0; i < span; i += 1) columns.push(null);
                return;
            }
            for (let i = 1; i < span; i += 1) columns.push(index === 0 && i === 1 ? "icon" : null);
            columns.push("title");
            return;
        }

        // The member list is the one roster whose date column is a
        // joining date; the phone card says so in front of it.
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
        ? el("button.rr-tag", { type: "button", "data-tag": kind, title: t("Show only {x}", { x: prefix }) }, [prefix])
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

    // Named on the row, not just the cell: the phone card (responsive.css)
    // pulls the star out to the card's own corner and needs to know which
    // title cells must keep their text clear of it.
    entry.row.setAttribute("data-rr-star", "");
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
 * Open and close the prefix menu.
 *
 * The same manners as the search box's own options popover: outside
 * click and Escape close it, Escape puts focus back on the trigger,
 * and the down arrow opens it from the field without leaving the
 * keyboard. Choosing a prefix closes it — unlike the search options,
 * where a choice is a setting rather than an answer, one prefix is the
 * whole question the menu asks.
 */
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

/**
 * `rich` builds the whole bar: filter box, prefix chips, count. Without
 * it the bar is only a home for the board's own refine box — see
 * FILTER_MIN_ROWS.
 */
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

    /* Classed, and the class matters: the board's own text fields get a
       22em floor so a size="25" from 2003 is not cramped on a fluid
       frame, and that rule reaches any field without an `rr-` class.
       This one is the script's own and sizes itself — unclassed it
       refused to shrink, and pushed the prefix trigger off a phone. */
    const input = el("input.rr-toolbar__input", {
        type: "search",
        placeholder: t("Filter this page by title"),
        "aria-label": t("Filter topics on this page"),
    });
    input.addEventListener("input", debounce(() => { state.text = input.value.trim(); apply(); }, 90));
    input.addEventListener("keydown", (event) => {
        if (event.key === "Escape") { input.value = ""; state.text = ""; apply(); }
    });

    /* Nine coloured chips side by side made the densest line on the
       page out of the least important thing on it, and put a small
       rainbow above a listing whose own colours are the point. The
       prefixes move behind one trigger in the filter box; it carries
       the name of the one that is on, so nothing is hidden that was
       being read. */
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
    /* Everything on this page with something new in it. The board says
       so with a dot beside the row and gives no way to ask for only
       those. The one filter worth a permanent chip: it is the question
       most readers arrive with, and it is on or off rather than one of
       nine. */
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
        // One chip filters every row down to every row. Chips are worth
        // their trigger only once there is a choice to make between them.
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

    /* The board's own "Search this forum" box sat here, beside the
       filter, because the strip it came in cost a band of its own. The
       palette now aims a search at this forum without leaving the
       keyboard and says so on its trigger, which left three search
       boxes on one screen answering the same question. This one is the
       one that goes — except with the palette turned off, when it is
       the only one left, and on a results page, where the same box is
       not a third way to search a room but the only way to narrow a
       set of results the palette knows nothing about. */
    const boardSearch = document.querySelector("#search-box form, #topic-search");
    if (boardSearch) {
        const strip = boardSearch.closest("td.row5") || boardSearch.closest("table");
        const spare = settings.get("palette") && !PAGE.isSearch;
        // Moved out of the strip so the band can go, and parked on the
        // body rather than removed: CS.RIN.RU Enhanced looks for this
        // form, and a bar with nothing to draw is never placed, so the
        // bar is not a safe place to park it.
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
        bar.append(el("a.rr-btn", { href: post.getAttribute("href"), "data-variant": "primary" }, [t("New topic")]));
        const strip = post.closest("table");
        if (strip) strip.style.display = "none";
    }

    if (info.total && info.total > 1) {
        bar.append(buildPagerGroup(info));
    }

    heading.after(bar);
    /* "Page 1 of 615" and "[ 61469 topics ]", which the bar now
       carries: the same pass the topic page uses, so the count is
       lifted here in whichever language the board printed it. */
    tidyBoardPagerStrip(bar, bar);

    // Subscribe forum and Mark topics read, which the board gives a
    // band of their own. Only ever drawn for a member, so on a logged
    // out page this finds nothing and the bar is what it was.
    adoptForumActions(bar);

    /* "Go to page 1, 2, 3, 4, 5 … 137  Next", right-aligned above the
       table: the same journey as the pager in the bar, in a row of its
       own. The topic page hides its copy above the posts and keeps the
       one below; the listing does the same. */
    if (settings.get("quickPager")) {
        const strip = Array.from(document.querySelectorAll("#wrapcentre td.gensmall"))
            .find((cell) => /^\s*(?:Go to page|На страницу)/.test(cell.textContent) && cell.querySelector('a[onclick*="jumpto"]'));
        if (strip) hideWithEmptyRow(strip);
    }

    // The forum name led a line of its own directly above this bar,
    // repeating what the breadcrumb says two lines further up and
    // costing a band of the screen to do it. Inside the bar it labels
    // the controls that act on it, and the band is gone. The node is
    // moved, so its heading level and any link inside it survive.
    heading.classList.add("rr-topicbar__title");
    bar.prepend(heading);

    return bar;
}

/**
 * Subscribe forum and Mark topics read.
 *
 * The two things a member can do to a forum rather than to a topic in
 * it. subsilver2 prints them for members only, in cells of their own
 * above the listing and again below it — which is a whole band of the
 * screen, between the bar and the first topic, for two links pressed
 * once each. They are forum actions; they join the others in the bar
 * that already carries the forum's name, in the words the board gave
 * them ("Unsubscribe forum" when you already are).
 *
 * The same move the topic page makes with Subscribe, Bookmark and
 * E-mail friend, so the two pages answer the same way.
 */
const FORUM_ACTION = 'a[href*="watch=forum"], a[href*="mark=topics"]';

/* Where the board puts them: a `tr.nav` of two cells — one link at each
   end — nested inside the `td.cat` that caps the listing table, plus
   the same row again under it. The cells themselves carry no class, so
   the row is what identifies them; `td.nav` and `td.gensmall` are the
   shapes the strip takes elsewhere on the board. */
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

    /* The cells go, and so does what held them. The band is a `td.cat`
       wrapping a table of two cells, and markShapes reads that table
       as a strip of controls and gives the row a surface of its own —
       so emptying the cells is not enough: with the links gone the
       whole row has to go, or the band stays exactly where it was with
       nothing in it. */
    for (const cell of cells) {
        hideWithEmptyRow(cell);
        const cat = cell.closest("td.cat");
        if (!cat || cat.querySelector("a[href], input, select, h4")) continue;
        const row = cat.parentElement;
        if (row && row.tagName === "TR") row.style.display = "none";
    }
}

/* ---- Last post ----------------------------------------------------- */

/* "Tuesday, 01 Sep 2026, 18:10" — the weekday is four words of a date
   nobody reads a weekday off. Kept on the title, dropped from the line
   so the date and the poster fit beside each other. */
const WEEKDAY_RE = /^(\s*)(?:(?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day|Понедельник|Вторник|Среда|Четверг|Пятница|Суббота|Воскресенье),\s*/i;

/** Drop the weekday from the text nodes directly under `node`. Returns
 *  whether anything changed, so the caller can keep the full date on
 *  the title. */
function dropWeekday(node, depth = 0) {
    let changed = false;
    for (const child of node.childNodes) {
        if (child.nodeType === 3 && WEEKDAY_RE.test(child.textContent)) {
            // "$1" keeps the space the weekday followed: "Posted: Friday, 24 Jul"
            // is "Posted: 24 Jul", not "Posted:24 Jul".
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

/* Hide a cell, and the row and table it leaves empty. */
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

/* A date on its own in a cell — "Joined" on the member list, "Sent" in
   a message folder, the announcement dates in the control panel. Same
   weekday, same treatment as the Last post column; the cell is 144px
   wide on the message list and the full date wrapped onto two lines
   in every row. */
function tightenDateCells() {
    /* td.gen / td.genmed: "Joined:" in the control panel and on a
       profile puts its label in one cell and the date in the next, so
       the date cell's text starts with the weekday. A post's own date
       cell never does — it starts with "Posted:" or is the topic
       module's — and the anchor on the regex keeps them apart. */
    /* td.gensmall: "Posted: Friday, 24 Jul 2026" over a search result.
       Not on a topic page, where that cell is the post's own date and
       the topic module reads it, weekday and all, for the header. */
    const cells = document.querySelectorAll(
        '#wrapcentre td[data-rr-col="date"], #wrapcentre p.topicdetails, #wrapcentre td.gen, #wrapcentre td.genmed, #wrapcentre b.gen, #wrapcentre b.genmed'
        + (PAGE.isTopic ? "" : ", #wrapcentre td.gensmall"),
    );
    for (const cell of cells) {
        if (cell.hasAttribute("data-rr-date")) continue;
        // Read before the change, so the title can carry the whole date.
        // The weekday may follow a label — "Posted: Friday, …" on a
        // search result — so each text node is asked, not the cell.
        const full = cell.textContent.replace(/\s+/g, " ").trim();
        if (!dropWeekday(cell)) continue;
        cell.setAttribute("data-rr-date", "");
        if (!cell.hasAttribute("title")) cell.setAttribute("title", full);
    }
}

/* "Page 1 of 1" over a message folder or a subscriptions list: a page
   counter for one page, on pages with no action bar to fold it into.
   Nothing to navigate, nothing to say. Counters on other pages stay —
   beside them is the only "Go to page" strip those pages have. */
const LONE_PAGE_RE = /^\s*(?:Page\s+1\s+of\s+1|Страница\s+1\s+из\s+1)\s*$/;
const LEADING_LONE_PAGE_RE = /^\s*(?:Page\s+1\s+of\s+1|Страница\s+1\s+из\s+1)\s+/;

function dropLonePageCounters() {
    // td.gensmall and span.nav: the search results page prints its
    // counter in a span inside a floated div.
    for (const cell of document.querySelectorAll("#wrapcentre td.nav, #wrapcentre td.gensmall, #wrapcentre span.nav")) {
        if (cell.querySelector("a[href], form")) continue;
        const text = cell.textContent.replace(/\s+/g, " ");
        if (LONE_PAGE_RE.test(text)) { cell.style.display = "none"; continue; }

        /* "Page 1 of 1 [ Search found 1 match ]" — the counter shares
           its cell with a fact worth keeping. The counter is the run
           of nodes up to the second number; that run goes, the rest
           stays. */
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

/* A private message folder marks replied, marked, friend and foe
   messages with a 10px spacer gif floated in front of the subject.
   Invisible here — the board's colours never arrive — but still 10px
   and a space wide, so the subjects on the rows that had one started
   8px to the right of the others. The marker is drawn as a coloured
   square with its meaning on the title, and the rows without one get
   an empty one of the same size. */
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
        // The board writes "&nbsp; " after its marker; the rows without one
        // begin with whitespace the cell swallows, and a space here joins
        // it rather than adding to it.
        cell.prepend(el("span.rr-pm-mark", { "aria-hidden": "true" }), "\u00a0 ");
    }
}

/* "Advanced forumer Завсегдатай" in the member list's Rank column: the
   same bilingual rank a post's profile shows, on a page the post
   module never looks at. The Russian half went on to the title. */
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

/* "Global Announcements", "Announcements", "Topics": the template's own
   section rows, which head a run of topic rows and do nothing else.
   Each folds its run on a click now, and the fold is remembered by the
   section's name — fold the announcements once and every listing opens
   with them folded. The rows are still in the page (find-in-page, the
   filter, the sort and the keyboard cursor all still see them), only
   not drawn. The last section of a table is left as it is: a listing
   whose every topic can be folded away is a listing that reads as
   empty by accident. */
const FOLDED_SECTIONS_KEY = "foldedSections";

function foldedSections() {
    const kept = store.get(FOLDED_SECTIONS_KEY, null);
    return kept && typeof kept === "object" ? kept : {};
}

/* A listing's section row, in either of the two shapes the template
   uses: a td.cat with an h4 (search results, the index), or one
   spanning td.row3 holding a bold word and nothing else (a forum
   listing's "Global Announcements", "Announcements", "Stickies",
   "Topics"). The second is named here so the stylesheet can draw it
   as the section head it is rather than as a row. */
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
    // Every section row is named first, then the runs are read: a run
    // ends at the next section row, which has to be known as one by
    // then.
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

/* The left column of the control panel is a list of sections. The one
   you are in is bold with its pages under it; the others are links
   that open theirs. Nothing said so: each was a word on a row, and
   which words would unfold something was found by clicking. The
   closed ones carry a chevron pointing at what they open, the open one
   a chevron pointing down at its pages, and its pages step in under
   it. */
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

/* The table of sub-forums above a listing has the same "Forum" heading
   as the index and no name of its own; heading it "Subforums" is what
   keeps it from reading as a second, shorter, index above the topics. */
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

/* The shapes the stylesheet needs to know about, named once here.

   These were `:has()` selectors — `tr:has(> td.cat) > td`, `td.cat:has(
   select)`, `table:not(:has(table)):has(td[bgcolor] > a[onclick])` — and
   they cost the listing 240ms of style work: a `:has()` on a table or a
   row is re-checked every time anything inside changes, and this script
   changes six hundred cells on a listing. An attribute set once is
   free to match. */
function markShapes() {
    for (const cell of document.querySelectorAll("#wrapcentre td.cat")) {
        const row = cell.parentElement;
        // "controls" rides along onto the row too: the sort strip at
        // the foot of a listing is the last row of the same table the
        // results render in, and the phone stylesheet needs to pull it
        // away from that table's card on the row, not the cell — a
        // margin on the cell would sit inside the row's own padding.
        // A cell that matches the controls shape always has content (a
        // select, a table, a submit button), so kind starts as the
        // empty string for it every time — an "only override if kind
        // is already truthy" guard here would test a value that is
        // always falsy at this point and would never fire.
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

    // Tables that are lists of links rather than data — the control
    // panel's Options column, the message folders — and the
    // message-colour legend beside them. On a phone each row is a card
    // otherwise, and a menu of nine cards is a wall.
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

    // The permissions notice ("You can post new topics…") is the table
    // right after the one holding the jump-to form, with nothing between
    // them. Named here so the stylesheet can give it its gap without a
    // :has() on a table.
    const jump = document.querySelector('form[name="jumpbox"]');
    const jumpTable = jump && jump.closest("table");
    if (jumpTable && jumpTable.nextElementSibling && jumpTable.nextElementSibling.tagName === "TABLE") {
        jumpTable.nextElementSibling.setAttribute("data-rr-after-jump", "");
    }

    // A form row that is a checkbox or radio alone in its first cell,
    // with the words in the next.
    for (const input of document.querySelectorAll(
        '#wrapcentre td:first-child > input[type="checkbox"]:only-child, #wrapcentre td:first-child > input[type="radio"]:only-child')) {
        const row = input.closest("tr");
        if (!row) continue;
        row.setAttribute("data-rr-check-row", "");
        /* The words in the next cell are the control's label and the
           template never says so: clicking them did nothing, where on
           every other form it toggles the box. */
        const words = input.parentElement && input.parentElement.nextElementSibling;
        if (!words || words.querySelector("input, select, textarea, button")) continue;
        words.setAttribute("data-rr-check-label", "");
        words.addEventListener("click", (event) => {
            if (event.target instanceof Element && event.target.closest("a")) return;
            input.click();
        });
    }

    // The "Top" row under every post. The link back to the header is
    // already hidden (forum.css) — the floating button does that job
    // now — so a row whose first cell holds nothing else is a band of
    // empty space the width of the post, worse on a phone where the
    // row is padded like a card.
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
 * The member list, a message folder and Who is online are listings too
 * — rows of members or messages under a header row — and got none of a
 * listing's treatment: no zebra, numbers left ragged, the header as the
 * template set it. A post table wears the same row1/row2 classes and is
 * not a listing, so the shape is checked rather than the class: a
 * header row, three or more rows opening with a row cell, a member or
 * message link somewhere, and nothing that belongs to a post or a form.
 */
function isRoster(table) {
    if (PAGE.isTopic || profileView()) return false;
    if (!table.querySelector("th")) return false;
    if (table.querySelector(".postbody, textarea, table")) return false;
    /* The row class sits on the cells in a message folder and on Who is
       online, and on the <tr> itself in the member list. Either counts. */
    const striped = (node) => Boolean(node) && /(^|\s)row[12](\s|$)/.test(node.className || "");
    const rows = Array.from(table.querySelectorAll(":scope > tbody > tr"))
        .filter((row) => striped(row) || striped(row.firstElementChild));
    if (rows.length < 3) return false;
    return Boolean(table.querySelector('a[href*="mode=viewprofile"], .topictitle a'));
}

/**
 * The whole title cell opens the topic. The row lights up on hover
 * from edge to edge and three quarters of the title cell were dead
 * space under that light: a promise the row did not keep. A click on a
 * link, a control or a text selection is left alone; Ctrl or ⌘ opens
 * in a new tab the way it does on a link.
 */
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
 * A profile prints every field the template knows — ICQ, AIM, Yahoo,
 * MSN, Jabber, Occupation, Interests — with nothing after the colon on
 * nearly every account. A row whose label ends in a colon and whose
 * value cell holds no text, link or image is a row about nothing, and
 * goes. Judged by shape, not by name, so a filled-in field of any
 * name stays.
 */
/* PAGE.isProfile is true of all of memberlist.php — the roster as well
   as one member's page. This is the one member's page. */
function profileView() {
    return PAGE.isProfile && /mode=viewprofile/.test(location.search);
}

function hideEmptyProfileRows() {
    for (const row of document.querySelectorAll("#wrapcentre table.tablebg tr")) {
        const cells = Array.from(row.children).filter((node) => node.tagName === "TD");
        if (cells.length !== 2) continue;
        // The outer table's two columns — "PM: [button]" beside
        // "Groups: [select]" — read as a label and a value too; they are
        // two forms side by side, and the phone stacks those.
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

/* The template's page links as a row of small chips, the words kept
   as a label, the current page marked, the " ... " between two runs
   of pages kept as a quiet mark. Two shapes come through here: the
   "[ Go to page: 1 … 41, 42, 43 ]" under a long topic's title, bare
   text around the links, and the "Go to page 1, 2, 3 … 615  Next"
   strip a listing ends with, where the words are themselves a link
   that asks for a page number. */
function chipPager(holder) {
    if (holder.hasAttribute("data-rr-minipager")) return;
    if (!holder.querySelector("a[href]") || !/(Go to page|На страницу)/.test(holder.textContent)) return;
    const russian = /На страницу/.test(holder.textContent);
    // The links, the bold current page and the gaps, in reading order,
    // gathered before anything moves: a node's neighbours change once
    // it has.
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
    /* "[ Go to page: 1 … 263, 264, 265 ]" under a subscribed topic or a
       bookmark: the same shape as the one under a listing title, in a
       cell this script does not label. Matched by its words instead. */
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

/* A data table whose header says five columns and whose rows draw four.

   The board hides a cell outright — `style="display: none"` in the
   markup it sends — where a member has no e-mail address on the Team
   page. In a real table that does not blank the column, it removes it:
   every cell after it slides one column left and the row stops lining
   up with its own header. The cell is put back, empty, wherever the
   row and the header still agree on how many cells there are.

   Only the board's own inline hiding is undone, and only before this
   script hides anything of its own. */
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

/* A roster's header sits over cells the template centres. Left over a
   centred column, a header names nothing in particular. */
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

/* The template pads a roster's e-mail and website cells with &nbsp;
   whether or not the member has one; on a phone each of those became
   an empty dark chip in the card. */
function markEmptyCells(table) {
    for (const cell of table.querySelectorAll(":scope > tbody > tr > td")) {
        if (cell.textContent.replace(/[\s\u00a0]+/g, "")) continue;
        if (cell.querySelector("a, img, input, button, select, svg")) continue;
        cell.setAttribute("data-rr-empty", "");
    }
}

/* A cell that is a row of links and the punctuation between them.

   The template writes "Previous PM in history | Next PM in history |
   Previous PM | Next PM", "[ Add friend | Add foe ]" and "Mark all ::
   Unmark all" as bare text around the links. Read out, that punctuation
   is noise; on the page it is a row of pipes at four different heights.
   The links become a row with a gap, which is what the pipes were for. */
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

/* An image the board points at nothing — the avatar box of a member
   who has none — draws as the browser's broken-image mark. Only the
   board's own furniture is dropped; a picture inside a post is the
   poster's, and a hole where it was is the honest thing to show. */
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

/* phpBB offers no way to reorder the hundred rows it has already sent.
   The headings of a listing become controls that do — in this browser,
   on the rows that are here: nothing is fetched and nothing is sent.

   Rows are sorted inside each run of them, and the template's own
   section rows ("Global Announcements", "Announcements") end a run, so
   a pinned announcement never lands in the middle of the topics. */
const SORT_KIND = {
    replies: "number", views: "number", topics: "number", posts: "number", num: "number",
    date: "date", last: "date",
    title: "text", author: "text", rank: "text",
};

const SORT_MONTHS = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/* "02 Sep 2026, 09:49", which is what the board writes and what this
   script leaves after the weekday goes. A row that says "4 minutes
   ago" carries the whole date on its title, put there when it was
   shortened; a row that says "Today" is today. */
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

/* Which shade each row is drawn in.

   subsilver2 hands out row1 and row2 by hand and alternates them
   *across the columns* of one row: a topic row comes out as six
   vertical bands, and every row of the index is split in two at the
   counts. Banding is meant to carry the eye from a title across to its
   last post, and drawn that way it cuts the line up instead.

   So the shade is written on the row, in an attribute of this
   script's own — the board's classes are left exactly as they are,
   since they carry nothing but the shade and another script may be
   reading them — and a sort simply writes it again. */
function restripe(rows) {
    rows.forEach((row, index) => row.setAttribute("data-rr-stripe", index % 2 ? "b" : "a"));
}

/**
 * The data rows of a listing, in the runs the template separates with
 * its own section rows ("Global Announcements", "Topics").
 *
 * A run is what a sort reorders inside, so a pinned announcement never
 * lands among the topics, and it is what the stripe runs down.
 */
function listingRuns(table) {
    const head = table.querySelector(":scope > tbody > tr[data-rr-head]");
    if (!head || !head.querySelector("th")) return [];
    /* Columns, not cells: a listing spans its first heading over the
       unread marker and the title, so five headings sit over six
       cells. */
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
    /* Where the run ends, read once. Read again after a sort it would
       be whichever row had moved to the end, and putting the rows back
       in the board's order would scatter them through their own run. */
    const anchors = sortable.map((rows) => rows[rows.length - 1].nextSibling);
    /* The "#" column is the board's own count down the page, not a
       property of the row: reordered rows keep the numbers where they
       were rather than carrying them along. */
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

/* One checkbox a row, no way to take them all and no way to take a run
   of them: deleting a dozen old messages was a dozen clicks. A control
   in the heading takes the page, and shift-click takes a range, the
   way every mail client has since 1996. */
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

/* The forum-rules box.

   subsilver2 writes it as a table of one `td.row3` above everything
   else on a forum, a topic and the posting form, and this board fills
   it for members only — which is why it is easy to miss. Two things
   are wrong with it left alone.

   The template types `style="margin-bottom: 2px"` into the tag, and an
   inline style beats every rule in this stylesheet without a fight, so
   the box sat 2px above the topic title: two blocks with nothing to do
   with each other, touching. And the cell keeps the styling of a
   listing row — a row's inset, a hairline drawn along the bottom of a
   card that has no second row, the same ground as everything else —
   so the one block on the page that is a notice read as a slab of
   text with no edges and no heading.

   Tagged here; the stylesheet dresses it as the notice it is.  */
function markForumRules() {
    /* The shape the live board actually writes.
     *
     * Everything below reads the notice out of a `td.row3`, which is
     * what subsilver2 ships and what the fixtures carry — and on
     * cs.rin.ru it never matched once. The board writes a plain
     * `div.forumrules` straight into #wrapcentre instead, so a member
     * on a restricted forum got the notice exactly as the board draws
     * it: 25px yellow on pure black inside a dark red hairline, hard
     * against the topic title under it, in the middle of a page that
     * had been redrawn around it.
     */
    for (const box of document.querySelectorAll("#wrapcentre div.forumrules")) {
        if (box.hasAttribute("data-rr-rules")) continue;
        box.setAttribute("data-rr-rules", "");
        tameRulesEmphasis(box);
        /* The template writes `<br>` on either side of it and one more
           under its heading. They were the only spacing the notice had;
           it has margins of its own now, and three blank lines inside a
           card is not air, it is a gap. */
        for (const side of ["previousElementSibling", "nextElementSibling"]) {
            const near = box[side];
            if (near && near.tagName === "BR") near.style.display = "none";
        }
        const heading = box.querySelector("h3, h4");
        if (heading && heading.nextElementSibling && heading.nextElementSibling.tagName === "BR") {
            heading.nextElementSibling.style.display = "none";
        }
    }

    for (const cell of document.querySelectorAll("#wrapcentre td.row3")) {
        const box = cell.closest("table.tablebg");
        if (!box || box.hasAttribute("data-rr-rules")) continue;

        /* What the table is, not what shape it is.

           The test here counted the cells and wanted exactly one,
           which made the box's own nesting the thing that decided it:
           subsilver2 wraps the rules in one more table on the pages
           where they are actually filled in, so on the live board this
           never fired once and the notice kept the styling of a
           listing row. A listing is told apart by what it holds — a
           header row and topic links — and a rules box holds neither
           however many tables it is wrapped in. */
        if (box.querySelector("th, a.topictitle, a.forumlink")) continue;
        if (!cell.querySelector("h4, p.rules, .postbody")) continue;

        box.setAttribute("data-rr-rules", "");
        if (box.style.marginBottom) box.style.marginBottom = "";
        tameRulesEmphasis(cell);
    }
}



/* The board writes its notice with BBCode `[size=150]`, which lands as
   `font-size: 150%` typed into the tag: 22px on a 15px page, three
   lines of it, above a topic title set smaller than the notice above
   it. Inline beats every rule in the stylesheet, so the size is taken
   down here rather than fought there.

   Dropped rather than clamped. A step above the body text was the
   original reading, and 120% of a 15px page is still 18px of shouting
   over three lines above a topic title set at 24 — the emphasis has to
   come from the card, the rail and the colour, not from the type size.
   The notice sizes itself from the stylesheet once the inline value is
   gone.

   The colour goes the same way, and for the reason it was reported:
   the board writes #FFBF00 into the tag, which is not a colour this
   redesign has anywhere else on any of its four themes. Cleared here
   so the stylesheet can paint the notice in the theme's own warning
   colour — one notice colour per theme rather than the board's, which
   is also what makes the light theme's special case unnecessary. */
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

/* A table that is a list of fields rather than a list of rows.

   The private message a member opens is one: four rows of "Message
   subject: / From: / Sent: / To:", written as `<tr class="row1">` with
   the cells left plain. Every inset in this stylesheet hangs off
   `td.row1` — the class is on the row here, not on the cell — so the
   only padding those cells ever had was the template's own
   `cellpadding="4"`, and the labels sat four pixels off the card's
   edge while the message panel under them sat at fourteen.

   Told apart by shape, because nothing on the page names it: two cells
   a row, a label ending in a colon in the first, no header row, no
   topic links. That is the message header, and the same shape wherever
   else the board writes one. */
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
        // A listing, as opposed to a post or a strip of chrome. The
        // stylesheet needs to know which is which: row1/row2 alternate
        // down a listing and wrap whole posts in a topic, so the same
        // two classes mean opposite things on the two kinds of page.
        const roster = isRoster(table);
        if (table.querySelector("a.topictitle, a.forumlink") || roster) {
            table.setAttribute("data-rr-list", "");
            groupListingNumbers(table);
        }
        // A roster of members — the member list, Who is online — as
        // opposed to a folder of messages: the phone lays its cards out
        // name first, and drops the cells the template left empty.
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
    // The icon legend under a listing: the index names its table
    // "legend", a listing's has no class at all. The dot cells and the
    // spacer between pairs are named, so the phone can lay each dot
    // beside its words and break the line on the spacer.
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

    /* A private message draws its signature divider as a run of
       underscores in the body, with no signature node for the topic
       pass to find. Posts are left alone: there the divider is already
       a rule, and a run of underscores inside a message is the poster's
       own drawing. */
    if (!PAGE.isTopic) {
        for (const body of document.querySelectorAll("#wrapcentre .postbody")) replaceUnderscoreRules(body);
    }

    /* Before the page-kind gate: the member list, the message folders
       and the control panel are none of those kinds and were getting
       none of this. */
    tightenDateCells();
    localiseRankCells();
    dropLonePageCounters();
    alignMessageMarkers();

    if (!PAGE.isForum && !PAGE.isIndex && !PAGE.isSearch) return;

    // Before the topic rows are looked for, not after. The index has no
    // topic rows at all — it lists forums — so everything below the
    // early return never ran there, and the Last post column read on
    // one line in a forum listing and on two on the page in front of
    // it. It is the same column.
    for (const cell of document.querySelectorAll('td[data-rr-col="last"]')) tightenLastPost(cell);

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
}

/* The sort strip's controls are flat siblings — a label, the select
   it names, sometimes a second select, then the next label — with
   nothing but a space between one and the next. Wrapped at the
   browser's own discretion that space is a break point like any
   other, and a narrow phone card broke "Sort by:" onto one line and
   the select that names it onto the next. Each label and the
   controls up to the next label (or the row's own submit) become one
   span, so a wrap can only fall between one pair and the next, never
   inside one. Runs on both shapes this cell comes in: the search
   results page holds the label and its selects directly, a topic's
   holds them one level down in the sort form beside the search box —
   a descendant selector reaches either. */
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
            // The &nbsp; and bare spaces the template used to hold
            // these apart: the group's own gap replaces them, and left
            // in they would sit alongside it as an empty flex item.
            if (node.nodeType === 3 && !node.textContent.trim()) { node.remove(); continue; }
            group.append(node);
        }
    }
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

function collapseWhoIsOnline(body) {
    const names = body.querySelectorAll("a[href*='viewprofile']");
    const summary = onlineSummary(body.textContent, names.length);

    // Moved, not rebuilt: every name keeps its link, its role colour
    // and anything another script attached to it.
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
 * The board's own "collapse this category" control: an `<input
 * type="button">` carrying `value=" "`, drawn by a 12x12 background
 * image from a <style> block, alone at the right end of a cell that
 * spans three columns — a thousand pixels from the heading it belongs
 * to, with no accessible name, on a row that gives no other sign it
 * opens at all.
 *
 * Redrawing it where it stood was a losing fight: an <input> is a
 * replaced element, so `::before` generates nothing on it, and between
 * the board's own <style> and the generic input[type=button] rules a
 * class selector kept losing the size and the font — which is how the
 * control came to be a bare text triangle. So it is hidden and kept
 * for its handler, which is the part that matters: `flipf()` reads its
 * class, flips it, and shows or hides the category. A chevron beside
 * the heading clicks it, and the heading cell folds on a click of its
 * own, the way a listing's section heading already does.
 */
function tidyCategoryToggles() {
    for (const native of document.querySelectorAll("#wrapcentre .ccclose, #wrapcentre .ccopen")) {
        if (native.hasAttribute("data-rr-cc")) continue;
        native.setAttribute("data-rr-cc", "");

        // The heading is in a sibling cell — the control gets a cell to
        // itself — so the row is what has to be walked to reach it.
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
        // The board's handler swaps the class rather than telling
        // anyone, so the state is read back off it afterwards.
        const flip = () => {
            native.click();
            setTimeout(sync, 0);
        };

        fold.addEventListener("click", flip);
        // The heading itself is a link to the category's own page, so a
        // click on the words still goes there; the rest of the cell
        // folds.
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
    // The list of who is online ends every forum and every topic too —
    // 272 names and 360px under the last post — and the fold is the
    // same fold: it finds the cell by what is in it, not by page.
    const online = whoIsOnlineCell();
    if (online && settings.get("foldWhoIsOnline")) collapseWhoIsOnline(online);
    if (!PAGE.isIndex) return;
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

/* How many opened topics the palette's Recent list keeps. It was a
   setting; nobody needs to tune it. */
const HISTORY_LIMIT = 100;

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

/* One action bar for the topic, out of the four strips the template
   scatters: the search box in a full-width table of its own, the reply
   image button, "Page 1 of 19", and the numbered page links.

   Two rows, and which one a control lands in is fixed rather than left
   to what fits — so the bar is the same shape on a one page thread and
   a thirty-three page one:

     Row 1 - this topic. Reply, what you can do to what is on screen,
             and where in the topic you are.
     Row 2 - everywhere else. The topic before and after, the print
             view, and the box that searches inside it.

   A row nothing landed in is not drawn, but nothing moves between rows
   to make that happen. */
function topicBarRow(name) {
    return el("div.rr-topicbar__row", { "data-rr-row": name });
}

/* Every child of a cluster is named, once it is filled.

   The stylesheet draws the hairlines between them and rounds the two
   ends, and the obvious way to write that is `.rr-cluster > * + *` —
   a selector whose rightmost part is the universal one, which the
   engine then tests against every element on the page. On a listing
   that is four thousand elements and it measured 30ms of style work.
   A class costs nothing to match. */
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
        const inputs = spoilerInputs();
        if (inputs.length >= 2) {
            /* It stays, and closes them again on the second press. It
               used to remove itself once pressed, which took the focus
               with it and left a reader with thirty open spoilers and
               no way back. The state is read off the page rather than
               assumed: with spoilers opened at load, this starts as
               the control that closes them. */
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

    /* The board's own "First unread post", printed for members in the
       strip that also holds the reply button. It is the same journey
       people.js builds a link for when the board prints none, so it is
       taken as it is — the board's href carries the #unread anchor —
       and people.js leaves the bar alone when it finds one here.

       Descendant, not child: icons.js wraps every link in one of these
       strips in a `span.rr-linkrow` before this runs, so `td.nav > a`
       matched on the fixtures and never once on the live board. What a
       member actually got was the strip left standing with a single
       link in it — a full-width empty card saying "First unread post"
       between the releases panel and the first post — and a second
       copy of the same journey in the bar, built by people.js because
       it could not find this one either. */
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

    /* Where in the topic you are. On a topic with one page that is not
       a fact worth a control, a label, or the space either takes:
       "Page 1 of 1" answered a question nobody with the whole thing in
       front of them was asking. */
    if (info.total && info.total > 1) {
        here.append(settings.get("quickPager")
            ? buildPagerGroup(info)
            : el("span.rr-topicbar__count", {}, [t("Page {a} of {b}", { a: info.current, b: info.total })]));
    }

    /* Two clusters, not six loose words: where to go next, and what a
       member can do to this topic. Each is one light box with a
       hairline between its items, so the row reads as two things
       rather than a list of everything. */
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

/* The board's numbered "Go to page 1, 2, 3 … 19" strip, where it sits
   above the posts: the bar's own pager says the same thing two lines
   higher. The copy under the posts stays — that is where a reader who
   has reached the end of the page wants it — and so does everything,
   here or there, when the bar draws no pager of its own.

   Two shapes carry it: a p.gensmall under the title, and the
   right-hand cell of the board's own strip. */
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
const PAGE_OF_RE = /^\s*(?:Page\s+\d+\s+of\s+\d+|Страница\s+\d+\s+из\s+\d+)\s*$/;
/* "[ 239 posts ]" — or, on the Russian interface, "[ Сообщений: 239 ]"
   and "[ Тем: 61487 ]", the word first. */
const POST_COUNT_RE = /^\s*\[\s*(?:([\d\s]+)\s+(posts?|topics?)|(Сообщений|Тем):\s*([\d\s]+))\s*\]\s*$/i;

function postCount(text) {
    const m = text.match(POST_COUNT_RE);
    if (!m) return null;
    const digits = (m[1] || m[4]).replace(/\s+/g, "");
    const unit = (m[2] || m[3]).toLowerCase();
    return digits + " " + (unit === "сообщений" ? "сообщений" : unit === "тем" ? "тем" : unit);
}

function tidyBoardPagerStrip(bar, row) {
    // The listing bar lifts its own "[ N topics ]" before calling this,
    // and the board prints the strip twice, above and below the table.
    // Starting from "not yet counted" put a second count in the bar on
    // every forum listing — "841 topics  841 topics".
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

/* Is anything between `node` and `root` hidden inline? The strips are
   emptied cell by cell, and a cell inside a hidden cell is as gone as
   its parent. */
function hiddenWithin(node, root) {
    for (let n = node; n && n !== root; n = n.parentElement) {
        if (n.style && n.style.display === "none") return true;
    }
    return false;
}

/* A row of a board strip with every cell hidden is still a row: a 20px
   band with a border and nothing in it, between the Releases panel and
   the first post. textContent sees through display:none — the hidden
   cells' "|" separators and the reply link they still hold counted as
   life — so only what is not hidden counts. */
function boardStrips() {
    const out = new Set(document.querySelectorAll("#wrapcentre table.tablebg"));
    /* The strip holding "First unread post" is a bare `<table
       width="100%">` with no class at all, so a scan for table.tablebg
       walked straight past it and left the card standing. It is a
       board strip by what it holds, not by what it is called. */
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

/* "Previous topic", "Subscribe topic", "E-mail friend": on a phone the
   second row of the bar is three lines of these. The noun is the same
   on every one and the row says it already, so it is marked optional
   and the narrow layout drops it — "Previous · Next · Subscribe". */
function labelWithOptionalTail(link, label) {
    const m = label.match(/^(.*\S)(\s+(?:topic|friend|тема|другу))$/i);
    link.textContent = "";
    // The noun keeps its own space and the stylesheet takes the flex
    // gap off it: a word space, not a 6px slot.
    if (m) link.append(document.createTextNode(m[1]), el("span.rr-opt", {}, [m[2]]));
    else link.append(document.createTextNode(label));
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
        const shown = t(label);
        link.setAttribute("title", shown);
        labelWithOptionalTail(link, shown);
        if (glyph) link.append(icon(glyph, 12));
        bar.append(link);
    }

    if (!strip.querySelector("a[href], form, input")) strip.style.display = "none";
}

/**
 * Subscribe topic, Bookmark topic and E-mail friend.
 *
 * The three things a member can do to a topic besides answering it.
 * subsilver2 prints them for members only, in a `td.nav` of the same
 * strip as the reply button — which buildTopicBar hides cell by cell
 * precisely so these survive — and a second time under the posts. Left
 * where they were they made a grey band of their own between the bar
 * and the first post, with a "First unread post" at the far end that
 * the bar already carries. They are topic actions; they join the
 * others, once, with the words the board gave them ("Unsubscribe
 * topic" when you already are).
 */
const MEMBER_ACTION = 'a[href*="watch=topic"], a[href*="bookmark="], a[href*="mode=email"]';

function adoptMemberActions(bar) {
    // td.nav on the live board; a td.gensmall in the strip's other
    // shape. Either way it is the cell holding the three links.
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

    /* "Next" and "Last" sat three controls away from "Next topic" and
       "Previous topic" in the same weight and the same colour: two
       different journeys wearing one costume. Two things separate them
       now and either would do on its own — they are in different rows
       of the bar, and these say what they move. A page.

       The four steps and the page box are one boxed control, with a
       hairline between its parts. The two ends are the arrows alone,
       and their names are drawn the instant they are pointed at, so
       "⇥" is never a guess: it says "Last page". */
    /* `word` is what is drawn; `label` is the whole name, on the title
       and for a screen reader. The ends draw the arrow alone and say
       their name on hover. */
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
    const lang = currentLanguage();
    if (!CYRILLIC_RE.test(clean) || !lang) return clean;

    /* On the English interface the Russian words go; on the Russian
       one the Latin ones do — "I live here Три раза сломал клаву :)"
       reads "Три раза сломал клаву :)" there. A word with no letters
       of either kind (":)", "<3") sides with whichever half stays. */
    const LATIN_RE = /[A-Za-z]/;
    const kept = lang === "en"
        ? clean.split(" ").filter((word) => !CYRILLIC_RE.test(word))
        : clean.split(" ").filter((word) => !LATIN_RE.test(word) || CYRILLIC_RE.test(word));
    /* Punctuation that belonged to the half that just went. "I live
       here Три раза сломал клаву :)" is one rank in two languages with
       the smiley on the end of the Russian half, and dropping the
       Russian words alone leaves "I live here :)" — the tail of a
       sentence that is no longer there. A trailing run with no letters
       in it goes with them. A rank that is *only* punctuation, like
       "Super-Donor <3", never reaches this: it has no Cyrillic in it
       and was returned untouched three lines ago. */
    while (kept.length && !/[A-Za-z0-9\u0400-\u04FF]/.test(kept[kept.length - 1])) kept.pop();
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
        .replace(/(?:\b(?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day|Понедельник|Вторник|Среда|Четверг|Пятница|Суббота|Воскресенье),\s*/gi, "")
        .replace(JOIN_TIME_RE, "$1")
        /* The post count, and only the post count. This line is
           "Joined: 15 Nov 2005 · Posts: 12575", and a sweep over it
           that grouped from four digits would turn the year into
           "2 005". The count is named right there in the text; the
           year is not. */
        .replace(/((?:Posts|Сообщения):\s*)(\d+)/i, (all, label, count) => label + groupDigits(count))
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
        // The template runs "Joined: ...Posts: 2180Location: here"
        // together in one block often enough that the separators have
        // to be put back — before every label, not only Posts.
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

    const holder = el("div");
    for (const node of folded) holder.append(node);

    /* The original post is shown by default: the card above it is a
       summary, and the post is what was actually written — the
       download notes, the links, the caveats. The fold stays as a
       control, and a reader who closes it is remembered. The Steam
       description alone (no card to summarise it) still starts
       folded. */
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
        el("button.rr-icon-btn", { type: "button" }, [icon("link")]), t("Copy link to this post"));
    linkButton.addEventListener("click", () => copyText(postUrl(post.id), "Post link copied"));
    tools.append(linkButton);

    /* Every mirror in this post, one to a line. A release post carries
       three to six of them and queueing them in a download manager
       meant opening each in turn. */
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

/* ---- Where you stopped reading ------------------------------------ */

/* phpBB tracks unread posts for members and for nobody else, and even
   for a member it says so with a bold row in a listing rather than a
   line in the thread. This browser knows which post was the newest
   here the last time this topic was open; the first one after it gets
   the divider a mail client would draw. */
function markNewSince(all, seen) {
    if (!seen || !seen.lastPost || !seen.at) return;
    const fresh = all.find((post) => (Number(post.id) || 0) > seen.lastPost);
    if (!fresh || fresh === all[0]) return;
    /* The board's language, not the browser's: "New since 4 sept." in
       an English interface is one word in the wrong tongue. */
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

/* The board draws a signature's divider as a run of underscores in the
   message body. collapseSignature drops it on a post, where the
   signature is a node of its own; a private message has no such node
   and kept the underscores. Anywhere one is left, it becomes the rule
   the rest of the script draws. */
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

    // Every signature is set apart the same way — the small muted face,
    // a rule instead of the board's row of underscores. A short one
    // used to keep the underscores and the post's own type, so two
    // posts in a row ended in two different ways.
    post.signature.classList.add("rr-signature");
    for (const node of Array.from(post.signature.childNodes).slice(0, 3)) {
        if (node.nodeType === 3 && /^\s*_{5,}\s*$/.test(node.textContent)) node.remove();
        else if (node.nodeType === 1 && node.tagName === "BR" && !post.signature.textContent.trim()) node.remove();
    }

    // Signatures are one text node broken by <br>, so counting newlines
    // finds nothing; the line breaks and the length are the signal.
    // Only a long one is folded.
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

/** The board wraps spoilers in div.spoiler with an inline-onclick Show
    button, so the toggles are found by clicking their own buttons.
    With no state asked for, every spoiler button; with "show" or
    "hide", the ones currently saying that. */
function spoilerInputs(saying) {
    const all = Array.from(document.querySelectorAll('.spoiler input[type="button"]'))
        .filter((input) => /^(?:show|hide)$/i.test((input.value || "").trim()));
    if (!saying) return all;
    return all.filter((input) => (input.value || "").trim().toLowerCase() === saying);
}

/* Spoilers open at load.

   On this board a spoiler is where the links are: a release post
   hides its mirrors, its password and its notes behind five of them,
   and reading the post means clicking every one. Opened at load the
   post reads top to bottom, and the "Close all" control in the bar
   puts them back. The board's own handler does the opening, so the
   button still says Hide and still works. */
function openSpoilersAtLoad() {
    for (const input of spoilerInputs("show")) input.click();
}

/* The board draws every spoiler's Show button with `font-size: 10px`
   typed into the tag, under the 11px floor everything else on the page
   is held to — and it stayed there through four sweeps, because a sweep
   that asks about small text asks td, p, span and a, and this is an
   input. The board also injects a <style> for these controls, so a
   stylesheet rule loses; an inline style from here is the one thing
   that reliably wins (see csrin-css-cascade). */
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

        /* A dialog, not a backdrop with an image on it: a control that
           closes it, the keyboard kept inside while it is open, and the
           focus given back to the image's post when it goes. */
        const previous = document.activeElement;

        /* The other pictures in the same post: a repack's screenshots
           and a proof-it-works set are posted in a row, and opening
           them one at a time meant closing the box between each. */
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
        /* The setting that existed and did nothing: with it on, an
           off-site link asks first and shows the whole address, which
           a shortened or a disguised link otherwise never does. */
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

/* Every link to a post — the Releases panel, "View the latest post",
   a permalink somebody pasted, the board's own first-unread jump —
   ends in #p123456, and the board's anchor for that is an <a name>
   in the author cell beside the post. The modern layout hides that
   cell, and a browser cannot scroll to something that is not drawn:
   the page loaded, nothing moved, and a second click on the same link
   did nothing either. So every post's own table carries the id, which
   is what a fragment looks for first, and it is always on screen.

   That fixes where the anchor is. Where the page is by the time the
   browser looks for it is the other half: the fragment is honoured
   during parsing, before the top bar, the topic bar, the releases
   panel and the game card have been put above the posts, so the post
   the reader asked for ended up a screen below where the browser
   left them. Once everything is in place the page is walked to the
   fragment again, and the post is flashed so it is unmistakable. */
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

    // Named, so the stylesheet can tell a post's table from a listing's
    // and a strip's: it is the one that must not clip what floats
    // over its edge (the tooltips on its controls).
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
            // Written down whether or not the preview is switched on:
            // it costs one key and it is what makes the preview
            // instant, and free, for a topic that has been opened
            // once. See steam.js.
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

/* "emulator" is not in this list, and used to be.

   It is the one word here that is not about this board: a post
   mentioning an emulator is as likely to be about RPCS3, Yuzu or a
   PS2 thread as about a Steam stub, and every one of them collected
   two points towards being read as a release. "goldberg" and "steam
   emu" say the same thing without saying it about half the emulators
   ever written. */
const RELEASE_WORDS = [
    "clean steam files", "steam files", "reupload", "re-upload",
    "update", "updated", "patch", "hotfix", "repack", "crack",
    "build", "denuvo", "dlc unlocker", "goldberg", "steam emu",
    "online fix",
    // A hypervisor crack is a release of its own kind on this board,
    // with its own how-to threads and its own requirements.
    "hypervisor", "title update",
];

/* Three ways a post names which one it is, and they are not the same
   thing: a version with a v on it (v1.4.2, ver. 2.0), a Steam build id
   (eight digits, kept apart so nothing downstream mistakes it for a
   very large version), and a labelled number with no v anywhere — the
   form this board uses most, because Ubisoft ships "Title Update
   1.0.7" and the release posts say so in the publisher's words.

   A label has to be followed by a *dotted* number, so "update 2 of 3"
   and "patch to 4 files" are not versions. */
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
    /* A bare three-part number: "Deluxe Edition 1.2.3 GOG". Nothing but
       a version is written that way — a date has a year in front, an IP
       has four parts, a price has two — and release titles on this
       board carry one without a v more often than with. Two parts alone
       is left to the labelled forms: 2.5 is also a price and a score. */
    "(?<![\\w.])(\\d{1,4}\\.\\d{1,3}\\.\\d{1,4}" + VERSION_SUFFIX + ")(?![\\w.])",
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
    const year = (n) => n >= 1990 && n <= 2099;
    const month = (n) => n >= 1 && n <= 12;
    const day = (n) => n >= 1 && n <= 31;
    // 2026.09.02, and 2026.09
    if (year(parts[0]) && month(parts[1]) && (parts.length === 2 || day(parts[2]))) return true;
    // 12.09.2026 — the other way round, which is how half this board
    // writes a date and which the bare three-part form let straight
    // through as version twelve.
    return parts.length === 3 && day(parts[0]) && month(parts[1]) && year(parts[2]);
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
const VERSION_RE_ALL = new RegExp(VERSION_RE.source, "gi");

/* An archive extension is not part of the version.

   "Peacock-v5.3.0.7z" is version 5.3.0 in a 7-Zip file, and the
   pattern read it as 5.3.0.7z — a fourth part and a letter, both off
   the file name. Blanked before matching rather than trimmed after,
   so the number that comes out is the number that was written. */
const ARCHIVE_SUFFIX_RE = /\.(?:7z|zip|rar|tar|gz|bz2|iso|exe|bin|torrent|part\d*)\b/gi;

/* A price is not a version.

   "The 'Casino Monarchique' Chip (1.000.000)" — an in-game chip
   denomination in a post about a DLC item not showing up — matched the
   bare three-part form and read as version one million. Every other
   number on that board is written with the parts free to be any
   length; a thousands separator writes them in threes with the zeros
   kept, which nothing versions itself as. Only the bare form is
   checked: if a post says "v1.000.000" it means it. */
function looksLikeAThousand(version) {
    const parts = version.split(".");
    if (parts.length !== 3) return false;
    if (parts[1].length !== 3 || parts[2].length !== 3) return false;
    return /^0/.test(parts[1]) || /^0/.test(parts[2]);
}

/* Somebody else's product, and the version is theirs.
 *
 * A game topic on this board runs on companion software — Peacock,
 * Goldberg, GreenLuma, an achievement overlay — and every one of them
 * has its own version, written the same way, in the same sentence as
 * the game's. "I tried to update the Peacock crack to version v8.9.0"
 * announced HITMAN 3 as being on v8.9.0; the game was on 3.280.
 *
 * Read backwards from the number only. Forwards is where the game's
 * own extras are listed — "v3.190 + Peacock + ALL DLC" is the game's
 * version followed by what comes with it — and reading that direction
 * threw away real answers to catch this one. */
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
        /* Whether the post *called* it a version — a v in front, or
           "Title Update" / "updated to" leading in — or whether it is
           a bare three-part number read off the prose. Both go on the
           row. Only the first is evidence about the game: "Updated
           ACBlackFlagFix to 2.8.3!" is a mod's changelog, and off the
           live board 2.8.3 beat 1.0.7 to the headline the moment bare
           numbers started to count. */
        if (!found.version) {
            found.version = number;
            found.named = Boolean(match[1] || match[3]);
            found.theirs = COMPANION_RE.test(
                text.slice(Math.max(0, match.index - COMPANION_WINDOW), match.index));
        }
    }
    /* "Updated from 1.0.5 to 1.0.7": the first version in the post is
       the one it left behind. Only this wording moves the answer — a
       later "v2.8.3" on its own is still a mod's changelog. */
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
/* A spoiler is not a quote, and on this board it wears the same class.
 *
 * subsilver2 here writes a spoiler as
 *
 *     div.spoiler > div (the Show button) + div.quotecontent > div[hidden]
 *
 * — the body of a spoiler is a `.quotecontent`, exactly like the body
 * of a quote. So the line above threw away every spoiler in the topic,
 * and on this board the spoiler is *where the download links go*:
 * "Download:" then a spoiler holding the mirrors. Counted across the
 * 53 pages read for this: 779 `.quotecontent`, of which 608 are quotes
 * and 171 are spoilers.
 *
 * What that cost: every ElAmigos update post, every DODI repack, the
 * CharmKat clean-Steam-files posts and the RIDDICK releases came back
 * with no links, no version and no words — offers zero — and none of
 * them was ever listed. The most important rows in a game topic were
 * the ones this could not see.
 *
 * A quote is a `.quotecontent` whose parent is the post; a spoiler's
 * is a `.quotecontent` whose parent is the `.spoiler`. A quote *inside*
 * a spoiler is still a quote and still goes.
 */
function isSpoilerBody(node) {
    const parent = node.parentElement;
    return Boolean(parent && parent.classList && parent.classList.contains("spoiler"));
}

function ownContent(body) {
    const copy = body.cloneNode(true);
    for (const quote of copy.querySelectorAll(".quotecontent, .quotetitle, blockquote, cite")) {
        if (isSpoilerBody(quote)) continue;
        quote.remove();
    }
    spaceOutLines(copy);
    return copy;
}

/* A <br> contributes no text, so a release post written one fact per
   line comes back welded: "Game version is Title Update 1.0.7Learn
   more here on HV releases". Both halves of this module then fail at
   every seam — 1.0.7 followed by a letter has no word boundary and the
   pattern backtracks to 1.0, and a release word needs one in front of
   it and finds none in the middle of "filesUpdate".

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
/* The archive password.

   Almost every release post on this board ends with one — "Password:
   cs.rin.ru", "unrar pass: something", "Пароль: …" — and it is
   routinely three screens below the link or inside a spoiler with ten
   others. What is read here is the post's own words: a label, a
   separator, and the run of characters after it.

   "No password needed" is the other thing posts say, and it is not a
   password; a line that denies one is refused. */
const PASSWORD_LABEL = "(?:archive\\s+|unrar\\s+|unzip\\s+|rar\\s+|zip\\s+|extraction\\s+)?(?:password|passwd|pass|pwd|pw|пароль)";
/* What a post says instead of a password: "the standard password",
   "same as above", "password required". None of those is one, and
   reading one out as the password is worse than saying nothing. */
const NOT_A_PASSWORD = new Set([
    "standard", "usual", "same", "above", "below", "none", "forum", "default",
    "required", "needed", "protected", "correct", "wrong", "here", "link",
    "file", "archive", "yes", "no", "is", "the", "a", "unknown", "obvious",
]);
const PASSWORD_RE = new RegExp(
    /* A separator is required — a colon, an equals, a dash, or the
       word "is". Without one, "password protected" reads as a password
       called "protected". */
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
        /* A password is a token: something with a dot, a dash, a digit
           or an underscore in it, or one long run of letters. A word in
           the middle of a sentence is neither. */
        if (!/[.\-_@\d]/.test(value) && value.length < 6) continue;
        return value;
    }
    return null;
}

/* Which file host a link leads to, in the words the board uses for it.
   Anything unrecognised keeps its own domain, without the suffix. */
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

/* Where a release is not: a store page, a video, a screenshot, an
   article. Listing those beside the hosts would say a post is on five
   mirrors when it is on two.

   The publishers and the games press are in here for a second reason.
   A link to ioi.dk's patch notes or to store.epicgames.com is the
   commonest thing a *reply* carries — "the patch is out", "get the
   free demo here" — and counting it as somewhere to download is what
   put a page of conversation in the panel. */
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

/* Suffixes where the interesting label is one further left than the
   rule below would take: co.uk is not a name, and neither is the
   github.io a guide is published under. */
const HOST_SUFFIX_2 = /\.(?:co|com|net|org|gov|ac|edu)\.[a-z]{2,3}$|\.(?:github|gitlab)\.io$|\.(?:blogspot|netlify|vercel|pages|workers)\.(?:com|app|dev)$/i;

/* The label a reader would call the host by.
 *
 * This used to strip a fixed list of suffixes and take whatever label
 * came last, which on any domain outside that list handed back the
 * top-level domain: rootz.so read as "So", pearcrypt.lol as "Lol",
 * ioi.dk as "Dk", twitchdrops.app as "App". Taking the label before
 * the public suffix instead gets the name in every one of those. */
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

/* ---- What a link is for -------------------------------------------

   A post that offers something and a post that cites something both
   carry links, and until this told them apart the panel could not:
   "Yeah they don't support piracy, read their website for yourself:
   [wiki page]" and "Here is the gofile folder with the crack" both
   read as one off-site link and both were listed as releases.

   Three answers. `null` is the board itself. "read" is somewhere to
   read — a store, a patch note, a wiki page, a repository you would
   browse, a paste. "file" is somewhere to get the thing, which is
   what a release is.

   The path matters as much as the host. github.com/user/project is a
   repository to look at; github.com/user/project/releases is a
   download page, and the same host serves both. Anything unrecognised
   is "file": this board's uploaders use a new host every month, and
   the safe default is to trust an unknown one rather than lose a real
   release to a list that could never keep up. */
const READ_PATH_RE = /\/(?:wiki|blob|commits?|issues?|pull|tree|discussions?|patch-?notes?|news|roadmaps?|changelog|faq|about|profile|memberlist)(?:\/|\?|$)/i;

/* Pastes and link lists. On this board these hold real releases — a
   rentry with the mirrors on it, a privatebin with the link list —
   and they equally hold a log somebody pasted, a guide, a wiki dump.
   Neither reading counts on its own, so a link to one is an offer
   only where the post says it is offering something: a size, a
   password, a download label, a release name. */
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

/* What a post says when it is handing something over: how big it is,
   what it is called, where the link is, what the archive password is.
   Used to decide whether a paste counts, and nowhere else — these are
   markers of intent, not of quality. */
const OFFER_SIZE_RE = /\b\d{1,5}(?:[.,]\d+)?\s?(?:[KMGT]i?B)\b/i;
const OFFER_LABEL_RE = /\bdownloads?\s*(?:links?|mirrors?)?\s*[:\-–>]|\blinks?(?:\(s\))?\s*[:\-–]|\bmirrors?\s*\d*\s*[:\-–]|\bpass(?:word)?\s*[:\-–=]|\bпароль/i;
/* A scene release name — Foo.Bar.v1.0.2-GROUP — or an archive file
   somebody named. Either is a thing rather than a subject. */
const OFFER_NAME_RE = /\b[A-Za-z0-9]+(?:\.[A-Za-z0-9]+){2,}-[A-Za-z0-9]{2,}\b|\b[\w.\-]{3,}\.(?:7z|rar|zip|iso|torrent)\b/i;

function saysItIsHandingSomethingOver(text, attached) {
    if (attached) return true;
    return OFFER_SIZE_RE.test(text) || OFFER_LABEL_RE.test(text) || OFFER_NAME_RE.test(text);
}

/* Magnet links have no host at all. */
function linkHosts(links) {
    const out = [];
    for (const link of links) {
        const href = link.getAttribute("href") || "";
        const name = /^magnet:/i.test(href) ? "Torrent" : hostName(href);
        if (name && !out.includes(name)) out.push(name);
    }
    return out;
}

/* A code block, in the classes this board actually writes.

   phpBB3 marks one `.codetitle` + `.code`; subsilver2 on cs.rin.ru
   marks `.codebox > .codeheader + .codeholder`, and this module asked
   only for the first pair. So no code block on the live board was
   ever recognised: the score never gained its point for one, and
   releases.js went on matching release words against the contents of
   every pasted config file, magnet link and error log in the topic. */
const CODE_BLOCKS = ".code, .codetitle, .codebox, .codeheader, .codeholder";

/* What a post is *offering*, as against what it is talking about.

   A file host in a link, a login-walled link, a magnet, a torrent, an
   attachment. This is the distinction the panel had no word for, and
   the reason a 429 page topic listed a page of questions as releases:
   the entry rules asked for links, or a version, or a recognised word,
   and a question about a version has a version in it.

   Store pages, video links and image hosts are not offers — hostName()
   already refuses those — so a post linking a trailer and asking when
   the crack lands carries nothing. */
const CARRIED_RE = /magnet:\?xt=|\.torrent\b/i;
const ATTACHED = ".attachtitle, .attachcontent, .attachrow";

/**
 * Login-walled links, not counting the ones that are people.
 *
 * The board writes a mention as "@" followed by a link to the member,
 * and a guest sees that link replaced by
 * "[[Please login to see this link.]]" exactly like a link to a file
 * host. So every reply that opened by naming who it was answering
 * counted as a post carrying a download — which on a busy topic is
 * most replies, and is how "@someone, AFAIK, not currently" came to be
 * listed as a release with one link on it.
 *
 * Signed in the same mention is an ordinary anchor at memberlist.php,
 * which isOffsite() already refuses. This is the guest's half of the
 * same rule.
 */
function hiddenLinks(own) {
    let count = 0;
    for (const node of own.querySelectorAll(".link_removed")) {
        const before = node.previousSibling;
        if (before && before.nodeType === 3 && /@\s*$/.test(before.textContent)) continue;
        count += 1;
    }
    return count;
}

/* A post that asks is not a post that offers.

   Off the live board, all of these were rows in the Releases panel:
   "Is there any way to upgrade from v3.140 to v3.170.1?", "How can i
   access DLC with peacock v6.3?", "Anyone know what version that one
   torrent from April is?". Each carries a version and two release
   words because it is asking *about* a release.

   Only the opening sentence is read, and it has to both start like a
   question and end in one, so a release post that closes with "any
   problems, let me know?" is untouched. */
/* Where the first sentence ends. A full stop between two digits is
   part of a version number rather than the end of anything: without
   that, "What person did you use cracked Peacock v8.8.1 from?" has
   its first sentence end at "v8" and reads as a statement. */
/* `any` on its own, and not only anyone/anybody/anyway.

   "Any news on the updated inventory table? doesn't work at all." is
   the post this list was written against and the one it missed: a
   question, tagged Update, listed as a release. Bare `any` opens more
   questions on this board than all three compounds together — any
   news, any word, any chance, any idea, any fix. */
const ASKING_RE = /^(?:[^.!?]|\.(?=\S)){0,240}\?/;
const ASKING_OPENERS = /^[\s\W]*(?:@\S*[\s,]*)*(?:is|are|was|were|does|do|did|can|could|would|will|should|has|have|any(?:one|body|way|thing)?|some(?:one|body)|how|what|where|when|why|which|who|whose|hi|hello|hey|help|please|sorry|guys?)\b/i;

function looksLikeAQuestion(text) {
    const said = String(text || "").replace(/\s+/g, " ").trim();
    return ASKING_RE.test(said) && ASKING_OPENERS.test(said);
}

/* A post that says it did not work is not a post that published it.

   "I tried both Peacock stable version from their Discord/GitHub and
   also the cracked one v6 from here, and they don't seem to work" is
   the shape: a version, a release word, one link to where the thing
   came from, and nothing offered. Read as a release it is one; read
   as English it is somebody stuck.

   Only the failure is matched, and up to two words are allowed inside
   it ("don't seem to work", "does not appear to run"). A release post
   that says "if it doesn't work, verify your files" is not caught,
   because this is only ever asked of a post that is handing nothing
   over — no attachment, no password, no size, no release name.

   The failure has to have a subject, and that is not fussiness. A
   release post said "Doesnt work on demo" about the copy its upload
   is for — a caveat on what it is handing over — and a bare pattern
   read that as the poster reporting it broken and dropped the whole
   upload. "they don't seem to work" has somebody saying so; "doesn't
   work on demo" is a note on the label. */
const FAILED_RE = /\b(?:(?:it|they|this|that|these|those|mine|game|crack|patch|link|files?|version|copy|method|mod|emu|setup|nothing|none|i)\s+(?:do(?:es)?\s?n[o']?t|won'?t|can'?t|isn'?t|aren'?t|still\s+do(?:es)?\s?n[o']?t)\s+(?:\w+\s+){0,2}(?:work|launch|start|run|load|open)|no\s+luck|stuck\s+(?:at|on)|keeps?\s+crashing|crashes?\s+(?:on|at|when|immediately)|fail(?:s|ed)?\s+to\s+(?:work|launch|start|run|install))\b/i;

function reportsAFailure(text) {
    return FAILED_RE.test(String(text || ""));
}

/* A post that opens by answering somebody is a reply.
 *
 * The board writes a mention as an anchor, so once the links are out
 * the post begins "@, No problem, glad you got it working" — and
 * "Response to wasdfghj" is the same thing typed by hand. Both were
 * listed as releases on the strength of one link further down that
 * pointed at where somebody else's upload is.
 *
 * Only the opening, and only where the post hands nothing over: a
 * reply that answers "@someone" and then attaches the file is still
 * an upload. */
const REPLYING_RE = /^[\s\W]{0,4}(?:@|re\s*:|response\s+to\b|reply\s+to\b|quote\s*:)/i;

function looksLikeAReply(text) {
    return REPLYING_RE.test(String(text || "").replace(/\s+/g, " ").trim());
}

function describePost(post) {
    const own = ownContent(post.body);
    const text = own.textContent;
    const lower = text.toLowerCase();

    const links = Array.from(own.querySelectorAll("a[href]"))
        .filter((a) => isOffsite(a.getAttribute("href")));

    // Guests see "[[Please login to see this link.]]" instead of an
    // anchor, so those count as links too.
    const hidden = hiddenLinks(own);
    const attached = own.querySelectorAll(ATTACHED).length > 0;

    /* Which of those links are somewhere to get something, and which
       are somewhere to read. A paste sits in between and is settled by
       whether the post sounds like it is handing something over. */
    const roles = links.map((a) => linkRole(a.getAttribute("href")));
    const handing = saysItIsHandingSomethingOver(text, attached);
    const files = links.filter((_, i) => roles[i] === "file" || (roles[i] === "note" && handing));
    const hosts = linkHosts(files);

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
        (own.querySelector(CODE_BLOCKS + ", .spoiler") ? 1 : 0);

    return {
        post,
        links: links.length + hidden,
        hosts,
        // Somewhere to actually get the thing. Distinct hosts rather
        // than anchors, so eight mirrors of one upload are one offer,
        // and only the links that lead to a file — a store page, a
        // patch note and a repository you would browse are not offers
        // however many of them a reply carries.
        offers: hosts.length + hidden + (attached ? 1 : 0) + (CARRIED_RE.test(text) ? 1 : 0),
        // Whether anything the post carries is only a citation. A post
        // whose every link is one has not published anything.
        cites: roles.filter((role) => role === "read").length,
        handing,
        attached,
        asking: looksLikeAQuestion(text),
        failed: reportsAFailure(text),
        replying: looksLikeAReply(text),
        password: passwordIn(text),
        words,
        version: named.version,
        versionNamed: named.named,
        // Whose version it is. A number a companion product was named
        // right before is still shown on its row; it just never sets
        // the headline.
        versionTheirs: named.theirs,
        build: named.build,
        score,
        date: postDate(post),
    };
}

function postDate(post) {
    if (!post.headCell) return null;
    // "Posted:", or "Добавлено:" on the Russian interface.
    const match = post.headCell.textContent.match(/(?:Posted|Добавлено):\s*(.+?)(?:\s{2,}|$)/);
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
        t("Only posts with links"),
    ]);
    button.addEventListener("click", () => {
        on = !on;
        button.setAttribute("aria-pressed", on ? "true" : "false");
        for (const post of all) {
            const keep = !on || flagged.has(post.id);
            post.table.style.display = keep ? "" : "none";
        }
        /* The Releases list, when it is showing the whole topic, holds
           rows for posts that are not on this page; the filter used to
           hide the page's posts and leave that list as it was. */
        for (const row of document.querySelectorAll(".rr-releases__row")) {
            row.toggleAttribute("data-rr-nolink", on && row.getAttribute("data-links") === "0");
        }
        toast(on ? t("{n} posts shown", { n: rows.length }) : t("All posts shown"));
    });
    return button;
}

/* ================= src/modules/releases.js ================= */
/* ------------------------------------------------------------------
   Releases: one panel, two scopes.

   **This page** is read straight out of the DOM and costs nothing.
   **All N pages** walks the topic once, on a click, and remembers what
   it found — a nineteen page topic is nineteen requests to a board
   that runs on donations, so it is never a page load and never twice
   in a row. Escape stops it.

   finder.js decides what a post is; this file shows it. Quoted text is
   excluded there, because a reply quoting a release is not a release.
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
    /* An online fix restores multiplayer. It is not every Steam
       emulator ever posted, which is what this pattern used to say:
       `goldberg`, `steam emu` and a bare `emulator` were all in here,
       so "Goldberg emulator used for patching" — a pre-installed
       single-player release with the Steam stub swapped out — came
       back tagged Online fix, and so did every post in a topic that
       mentioned an emulator at all. Which emulator a post means, and
       what it wanted out of it, is decided below. */
    { id: "online", label: "Online fix", re: /\bonline[\s-]?fix(?:\.me)?\b|\bmultiplayer\s+fix\b|\bco-?op\s+fix\b|\blan\s+fix\b|онлайн[\s-]*фикс/i },
    { id: "dlc", label: "DLC", re: /\bdlcs?\b|\bunlocker\b|\bcream\s?api\b|\bsmart\s?steam\b|длс|разблокировщик/i },
    /* "Updated" in a release name is a build stamp, not an update.
       FLiNG names its trainers
       `…Plus.30.Trainer.Updated.2026.09.02-FLiNG`, and every one of
       them came back tagged both Trainer and Update — the second one
       saying something about the game that the post never said. A
       date immediately after the word is what tells them apart. */
    { id: "update", label: "Update", re: /\bupdate[ds]?\b(?!\.\d{4}\b)|\bpatch(?:ed|es)?\b|\bhotfix\b|\bupgrade\b|обновлени|обнова|патч/i },
    /* "Mirror" twice over: the word people write above a second
       download link, and the word for having uploaded something
       again. Only the second is a Reupload, and the first is how the
       board labels links — "DataNodes Mirror:", "Mirror 1", "Mirror
       #2" — so a mirror followed by a colon, a hash or a number is
       read as the label it is. Link labels being read as prose, one
       layer down. */
    { id: "reupload", label: "Reupload", re: /\bre-?upload(?:ed|s|ing)?\b|\bmirrors?\b(?!\s*[:#=]|\s*\d)|\breup\b|перезалив|зеркало/i },
    { id: "trainer", label: "Trainer", re: /\btrainer\b|\bcheat\s+(?:tables?|engines?)\b|\bsave\s?game\b|трейнер|сохранени/i },
    { id: "language", label: "Language", re: /\blanguage\s+(?:pack|files?)\b|\blocali[sz]ation\b|\btranslation\b|русификатор|локализаци/i },
    { id: "tool", label: "Tool", re: /\btool(?:s|kit)?\b|\bmod\s+manager\b|\binstaller\b|активатор|установщик/i },
    { id: "denuvo", label: "Denuvo", re: /\bdenuvo\b|денуво/i },
];

/* Every kind belongs to a family, and the families are what the
   stylesheet paints, so the same word is the same colour wherever it
   appears. A test fails if a kind is ever added without one.

     game    what you install          Clean Steam files, Repack
     run     what makes it start       Crack, Online fix
     change  what it does to a copy    Update, Reupload
     extra   what it adds              DLC, Language
     beside  what sits next to it      Trainer, Tool
     block   what stops it             Denuvo

   The six have to stay six on every theme: the first mapping put
   `run` and `block` on two tokens that are the same red on the
   board's own palette, and a Crack looked like a warning. A check
   compares all six per theme. */
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

/* How many pages one click reads.

   This used to be a cap: 80 pages, and a topic longer than that had
   its oldest pages dropped and never offered again. On the 429 page
   HITMAN topic that read 81 pages, said so in small text, and left
   the other 348 unreachable.

   It is a pass instead. The newest 60 unread pages are read on the
   first click, the panel says how many are left, and another click
   reads the next 60 — so the far end of a very long topic is a few
   clicks away rather than impossible, and no single click commits
   anyone to a quarter of an hour. */
const RELEASE_PASS_PAGES = 60;

/* Which end of the topic a walk starts from, kept in this browser for
   every topic like the fold state is. "newest" reads the last page
   first and works backwards, which answers "what is it on now";
   "oldest" reads from page one forwards, which answers "what was
   posted here, in order". Both the walk and the list follow it. */
const RELEASE_ORDER_KEY = "releaseOrder";

function releaseOrder() {
    return store.get(RELEASE_ORDER_KEY, "newest") === "oldest" ? "oldest" : "newest";
}

/** Rows in the reading direction: last page first, or page one first. */
function inReadingOrder(rows, order) {
    const back = order === "oldest" ? -1 : 1;
    return rows.slice().sort((a, b) =>
        back * ((b.page - a.page) || (Number(b.id) - Number(a.id))));
}

/* ---- How the walk asks the board for pages -------------------------

   The board runs on donations, so the walk is bounded three ways: at
   most three requests in flight, no two started closer together than
   RELEASE_START_GAP, and a 429 or 503 stops it where it is rather
   than retrying into it.

   The fourth bound is this board in particular. It never answers 429;
   it queues, and six requests sent together come back at two, four,
   six, eight, ten and twelve seconds — one slot at a time. So the
   walk times its own answers: the first few set what prompt means
   today, and once one is several times slower than that it drops to a
   single request with a much wider gap and stays there.

   No conditional-request path exists to take: viewtopic.php sends no
   ETag and no Last-Modified. The saving has to come from not asking
   at all, which is what the page cache below is for. */
const RELEASE_IN_FLIGHT = 3;
const RELEASE_START_GAP = 160;        /* between request starts, ms   */
/* Where it goes when the board starts queueing.

   Not to one request at a time with three quarters of a second
   between them, which is where this used to go. The board queues
   rather than refusing: measured, it hands out one slot roughly every
   two seconds however many requests are waiting. A gap on top of that
   is time spent waiting for a server that is already making you wait,
   and it made a long topic crawl. Two in flight with a short gap
   holds the same place in the same queue and gets a page every two
   seconds instead of every two and three quarters. */
const RELEASE_EASY_IN_FLIGHT = 2;
const RELEASE_EASY_GAP = 300;
/* How many prompt answers in a row mean the queue has drained. A walk
   that eased on page four of four hundred crawled the rest of the way
   because nothing ever put it back. */
const RELEASE_RECOVER_AFTER = 4;
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
        // Whether it ever eased, which is what the panel reports: a
        // walk that eased and recovered still went slowly for a while
        // and the reader watched it happen.
        everEased: false,
        quick: 0,
        slowest: 0,
    };
}

/** Feed one answer's round trip back into the pace. */
function notePace(pace, ms) {
    if (!Number.isFinite(ms) || ms <= 0) return;
    pace.slowest = Math.max(pace.slowest, ms);
    if (ms < pace.best) pace.best = ms;

    if (pace.eased) {
        // Back up again once the queue has drained. Held to a lower
        // bar than the one that eased it, so a walk cannot oscillate
        // on one borderline page.
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
    for (const node of copy.querySelectorAll("a[href], .link_removed, " + CODE_BLOCKS)) node.remove();
    return copy.textContent.replace(/\s+/g, " ").trim();
}

/* Goldberg is a Steam emulator, and a Steam emulator is two
   different releases depending on what the post wanted out of it.

   Half this board uses Goldberg as the crack: a pre-installed build
   with the Steam stub swapped for an emulator so it starts without
   Steam. The other half uses the same file to put multiplayer back,
   which is an online fix. The word alone cannot tell them apart, so
   what the post says around it decides — online, multiplayer, co-op,
   LAN, servers means the second, and nothing means the first.

   "Goldberg emulator used for patching. Thanks MR_Goldberg for the
   emulator." is a crack, and used to be tagged Online fix. */
const STEAM_EMU_RE = /\bgoldberg\b|\bsteam[\s_-]?emu(?:lator)?\b|\bsmart\s?steam\s?emu\b|голдберг|эмулятор\s+steam/i;
/* Tight on purpose. A post that says "online fix" in so many words
   is matched by the kind above and never reaches here; this only has
   to answer "does this Goldberg mention mean multiplayer", and the
   default when it cannot tell is a crack.

   Bare `online` and bare `server` were in here and both were wrong
   off the live board: "click on the All Links and download from other
   download servers", under a pre-installed single-player release,
   came back tagged Online fix. */
const ONLINE_INTENT_RE = /\bmultiplayer\b|\bco-?op\b|\bcoop\b|\bmatchmaking\b|\blobb(?:y|ies)\b|\blan\s+(?:play|party|game)\b|\bplay(?:ing)?\s+(?:online|with\s+friends)\b|\bonline\s+(?:play|works?|working|mode|multiplayer|co-?op)\b|мультиплеер|кооп|по\s+сети/i;

/** Which kinds a post's own words match. */
function releaseKinds(text) {
    const emulated = STEAM_EMU_RE.test(text)
        ? (ONLINE_INTENT_RE.test(text) ? "online" : "crack")
        : null;
    const found = [];
    for (const kind of RELEASE_KINDS) {
        if (kind.re.test(text) || kind.id === emulated) found.push(kind);
    }
    return found;
}

/** One row, or null if this post is not one. */
function describeRelease(post, page) {
    const scored = describePost(post);
    const text = releaseProse(post.body);
    const kinds = releaseKinds(text);

    /* Nothing was posted here.

       A release is a thing you can get: a file host, a login-walled
       link, a magnet, a torrent, an attachment. Every rule under this
       one is about telling apart two posts that offer something; this
       one is about the rest of the topic, which is most of it.

       It replaces three rules that each tried to reach the same
       answer from a different direction — a score, then "links alone
       are not enough", then "words alone are not enough" — and that
       between them still let through every question with a version
       number in it. On the 429 page HITMAN topic that was two rows in
       three: "Is there any way to upgrade from v3.140 to v3.170.1?"
       has a version, two release words and no file behind it.

       A store page, a video and an image host are not offers;
       hostName() already refuses those, so a post linking a trailer
       carries nothing. */
    if (!scored.offers) return null;

    /* Asked, or reported. Neither is offered.

       A question with a link in it clears the rule above — "does this
       work with 3.170.1? [screenshot]" — and is still a question. So
       is a post that says the thing did not work: on the two topics
       this was read against, both shapes carried a version, a release
       word and one link to wherever the thing came from, and both
       were listed as releases.

       A post handing something over is exempt whatever its first
       sentence looks like: an attachment, an archive password, a
       size, a download label, a release name. A release post is
       allowed to open with a question and allowed to say what to do
       when it does not work. */
    if ((scored.asking || scored.failed || scored.replying) && !scored.password && !scored.handing) return null;

    /* What kind of thing it is, or a number on it.

       An offer with neither is a link nobody said anything about, and
       across thirty topics eight of nine of those were conversation:
       a Reddit thread, a hosting recommendation, a thank-you. The
       narrow bar underneath is the older, score-shaped version of the
       same question, kept for the posts that use none of the words:
       one recognised kind is enough on its own, because a language
       pack and a trainer carry no version and none of them. */
    if (!kinds.length && !scored.version && !scored.build) return null;
    if (scored.score < 4 && !kinds.length) return null;

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

/* phpBB paginates by post index, so a reply lands on the last page and
   leaves every page before it byte-for-byte the same — which makes
   reading a topic twice nearly free. A *deleted* post breaks that: it
   shifts every page after it back by one.

   So each page is kept with the id of the post it opens with, and a
   rescan re-reads two: the last, where new replies are, and the
   highest page below it as a canary. If the canary still opens with
   the post it did, nothing between them has moved; if it does not, the
   topic's cache is dropped and it is read again from the start.

   Kept for fewer topics than the row index: this holds every page of a
   topic rather than the answer. */
/* How many topics keep their pages.
 *
 * Four, and a reader who looks at five game threads in an evening has
 * paid for the first one twice. Raised to eight after measuring what a
 * page actually costs on this board, which is the only thing that
 * makes a walk slow.
 *
 * The board does not answer 429; it queues. Timed live: three requests
 * in flight and it answers in 165 ms a page, four or five and it is
 * briefly faster — until a burst budget runs out, and from then on it
 * hands out one page every 1.8 seconds however many are asked for. At
 * eight in flight the same ten pages took 5.9 seconds instead of 0.9.
 * So there is no concurrency to win: the pace below is already at the
 * knee, and the only way to be faster is to ask for less. That is
 * this cache, and it is worth spending a little more of the browser's
 * storage on.
 *
 * A whole topic's pages are a few tens of kilobytes — the rows plus
 * one opening post id per page — so eight of them sit well inside what
 * either backing store will hold. */
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

/**
 * Which pages have to be asked for, and which are already known.
 *
 * Returns the pages to fetch in reading order, plus the canary whose
 * answer decides whether the kept pages may be believed at all.
 */
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

    /* The canary: the highest page being reused. A post deleted
       anywhere in the topic shifts every page after it, so the page
       furthest down the topic is the one that shows it. */
    const canary = reuse.length ? reuse[reuse.length - 1] : null;
    if (canary !== null && !want.includes(canary)) want.push(canary);

    /* Which end to start from.

       Newest first by default, because the question the panel exists
       to answer is "which version is this thread on now" and the
       answer is at the end of the topic. Read in page order it
       arrives last — on a 429 page topic, a quarter of an hour after
       the first row appears. Read backwards it is the first thing on
       screen, and the rest is detail the reader can watch fill in or
       stop with Escape.

       Oldest first is the other real question — what was posted here
       first, and in what order — so it is a choice rather than a
       rule, and the panel carries the control.

       Either way page 1 goes first. On this board the opening post of
       a game topic is the index: whoever owns the thread keeps the
       current links in it, so it is the single most useful page there
       is and it costs one request to have it. Reading backwards that
       has to be said; reading forwards it is where you start anyway. */
    want.sort(order === "oldest" ? (a, b) => a - b : (a, b) => b - a);
    const first = want.indexOf(1);
    if (first > 0) {
        want.splice(first, 1);
        want.unshift(1);
    }

    /* One pass, not the whole topic. What is left over is offered
       rather than dropped — see RELEASE_PASS_PAGES. */
    let deferred = 0;
    if (want.length > depth) {
        const keep = want.slice(0, depth);
        if (canary !== null && !keep.includes(canary)) keep.push(canary);
        deferred = want.length - keep.length;
        want = keep;
    }

    return { reuse: reuse, fetch: want, known: known, canary: canary, deferred: deferred };
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

    /* A back-off leaves items unclaimed, because the workers that
       stood down were the ones that would have taken them; so does a
       recovery, which raises the ceiling above the number of workers
       there are. Either way, whatever is left is picked up at
       whatever the pace is by then. Each turn of this loop claims at
       least one item, because nothing stands down while none is
       running. */
    while (next < items.length && !state.cancelled && !state.stopped) {
        const workers = Math.min(pace.inFlight, items.length - next);
        await Promise.all(Array.from({ length: workers }, run));
    }
    return results;
}

/** Every release across a set of pages, newest page first, deduped. */
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

/**
 * Read as much of the topic as this pass covers, and report as it goes.
 *
 * The page in front of you is never fetched; pages this browser has
 * already read are not fetched either unless the canary says they may
 * have moved. What is left goes to the pool above, a few at a time,
 * newest page first.
 *
 * `onRows` is called with the whole list every time a page lands. A
 * walk over a long topic is minutes of work, and a panel that shows
 * nothing until the last page is a panel that looks broken for all of
 * them; the first row now appears on the first answer, and it is the
 * newest one because that is the page the walk starts at.
 */
async function walkTopic(info, state, onProgress, onRows) {
    const total = info.total || 1;
    const current = info.current || 1;
    const plan = planWalk(PAGE.topicId, info, total, RELEASE_PASS_PAGES, state.order);
    const pace = makePace();
    const reused = new Set(plan.reuse);

    const read = new Map();
    read.set(current, readTopicPage(posts(), current));

    /* Everything held right now — read this time, believed from last
       time — as one set of pages. */
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
            // A board saying "not so fast" is answered by stopping, not
            // by asking again.
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

    /* Kept whether or not the pass finished.
     *
     * This used to be written only on a complete walk, so a topic
     * read to page thirty and then stopped — by Escape, by a 503, by
     * a pass ending — kept nothing and started again from nothing the
     * next time. What makes a partial set safe to keep is the canary
     * above: a page that was never read is simply absent, and one
     * that has moved throws the whole set away.
     *
     * `scanned > 1` because the page in front of the reader is always
     * in the set and is not worth a write on its own. */
    if (PAGE.topicId && scanned > 1) rememberPages(PAGE.topicId, pages, total);

    return {
        rows: rowsFromPages(pages, total),
        done: complete,
        scanned: scanned,
        // Pages of this topic still unread: the rest of a long topic
        // that this pass did not reach, plus anything that failed.
        // The panel offers them rather than dropping them.
        pending: pending,
        newest: newest,
        // How much of this answer came out of this browser rather than
        // off the board, which is the whole point of keeping it.
        fetched: plan.fetch.length,
        reused: plan.reuse.length,
        refused: state.stopped || null,
        // Whether the board asked for room, so the panel can say the
        // walk went slowly on purpose rather than looking stuck.
        eased: pace.everEased,
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
    if (seconds < 90) return t("just now");
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return t("{n} minutes ago", { n: minutes });
    const hours = Math.round(minutes / 60);
    if (hours < 36) return hours === 1 ? t("1 hour ago") : t("{n} hours ago", { n: hours });
    return t("{n} days ago", { n: Math.round(hours / 24) });
}

/** "12 pages read", in the page's language and number. */
function pagesReadText(n) {
    return n === 1 ? t("1 page read") : t("{n} pages read", { n });
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

/* Which rows may answer "what version is the game on".

   Not every version in a topic is the game's: a post recommending
   "v1.6.0 or later lightweight AchievementOverlay" beats 1.0.7 on the
   second digit, and that is how the headline once announced a game as
   being on 1.6.0. A trainer, a cheat table and an overlay all carry
   their own numbers; a crack, a repack, an update, clean Steam files
   and a DLC pack are versioned against the game.

   So a row sets the headline only if its kind is about the game rather
   than beside it. Everything still appears in the list; this decides
   one line. */
const VERSION_EVIDENCE = new Set(["game", "run", "change", "extra", "block"]);

function saysGameVersion(row) {
    return row.kinds.some((kind) => VERSION_EVIDENCE.has(releaseFamily(kind)));
}

/** The highest version anybody posted *of the game* — the question the
    thread was opened with. Build ids are excluded: "build 24127279" is
    eight digits and beats every real version it is compared against. */
/* One reply's slip is not the topic's version.
 *
 * Off the live board, one post in a 429 page thread reads "I had some
 * trouble getting V270.1 to work with Peacock" — the poster dropped
 * the 3. off 3.270.1 — and 270 beats every real version in the topic
 * on the first digit. The headline announced the game as being on
 * v270.1.
 *
 * What tells that apart from a release is company: every other
 * version in that topic shares a first part with several others, and
 * that one shared it with nothing. So a first part that exactly one
 * row uses is not allowed to set the headline while another first
 * part is used by more than one.
 *
 * The company has to be real company. In a topic with three releases
 * in it, one first part having two rows and another having one says
 * nothing, and the first release of a genuinely new major version is
 * alone on its first part by definition. So the rule only applies
 * where some first part has three rows or more — an established
 * thread — and even there it can hold a brand new major back until
 * the second post about it, which is the conservative half of a
 * trade whose other half was announcing a game as being on v270.
 */
const VERSION_CROWD = 3;

/* The line a version is on: its first part, and its first two.
 *
 * A game topic runs on one line and everything else in it runs on
 * another. Black Flag's releases are 1.0.2, 1.0.4, 1.0.5, 1.0.6,
 * 1.0.7 — seventeen rows on the line 1.0 — and one reply recommending
 * "v1.6.0 or later" of an achievement overlay is alone on 1.6 and
 * beats every one of them on the second digit. The first part alone
 * cannot see that: all eighteen are on 1.
 *
 * So the crowd is counted twice: once on the first part, which throws
 * out Peacock's 6.x and 8.x in a topic about a game on 3.x, and once
 * on the first two, which throws out 1.6 in a topic on 1.0. Both are
 * held to VERSION_CROWD, so a small topic and the first release of a
 * genuinely new line are left alone.
 */
function versionLine(version, parts) {
    return versionRank(version).slice(0, parts).join(".");
}

/** The value used by the most rows, or null if nothing leads. */
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

/* How many of the newest rows have to agree before a line nobody else
   is on becomes the answer. A game moving from 1.x to 2.0 is alone on
   its line by definition, and holding the headline back for ever
   would be worse than the noise this exists to stop; three release
   posts about it is a thread that has moved. */
const VERSION_RECENT = 3;

function latestVersion(rows) {
    const candidates = rows.filter((row) =>
        // A bare number read off the prose is shown on its row and is
        // not evidence about the game; see versionsIn(). Nor is a
        // number a companion product was named right before.
        row.version && row.versionNamed !== false && !row.versionTheirs && saysGameVersion(row));
    if (!candidates.length) return null;

    /* The thread's own line, and the line its newest posts are on. The
       second wins where enough of them agree, which is what lets a new
       major version through without waiting for it to outnumber the
       old one. */
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

    /* Same question one digit down, among what is left — but only
       where there is an answer to it.

       A minor line has to hold most of the rows on its major before a
       line with one row is read as an outlier. Black Flag's twenty-two
       releases are all on 1.0 and the odd one out is on 1.6, which is
       an outlier; HITMAN 3 moves its minor every release — 3.11, 3.20,
       3.40, 3.120, 3.130, 3.150, 3.190, 3.260 — and every one of those
       is alone on its line. Without the majority test the second topic
       lost every version above 3.120 to a rule written for the
       first. */
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

    /* The same date treatment the rest of the interface got: the
       weekday goes, the whole thing stays on hover. A panel that
       prints "Wednesday, 02 Sep 2026, 09:49" on every row while the
       listing two clicks away prints "02 Sep 2026" is two answers to
       one question. */
    /* Which host it is on is half the decision a reader makes about a
       release, and until now it took opening the post to find out. */
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
    return el("li.rr-releases__row", { "data-kinds": row.kinds.join(" "), "data-links": String(row.links || 0) }, [link]);
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
        for (const [i, id] of row.kinds.entries()) present.set(id, t(row.labels[i]));
    }
    if (present.size < 2) return null;

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
    const panel = el("section.rr-releases", { "aria-label": t("Releases in this topic") });
    const state = { cancelled: false, stopped: null, scope: "page", topic: kept, order: releaseOrder() };

    const count = el("span.rr-releases__count");
    const scope = el("div.rr-releases__scope", { role: "tablist", "aria-label": t("How much to look at") });

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

    /* Which end of the topic to read from.

       Beside the scope control because it qualifies it: "All 429
       pages, newest first" is one sentence. Only drawn where it
       decides something — a one page topic, or the whole-topic walk
       switched off, and there is no direction to choose. */
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

    /* The board's own "only show me the drops" filter. It was in a
       strip along the bottom of the panel while the scope control was
       in the head, so the two things that decide what the panel is
       showing sat at opposite ends of it. They are one group now. */
    const linkFilter = buildLinkFilter(all, pageRows);
    linkFilter.classList.add("rr-releases__only");

    /* What the panel says, as text. Passing "the current version is X,
       posted by Y on page Z" to somebody else meant retyping it. */
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

    /* The panel folds. On a topic read for the conversation rather
       than the files it is a card between the bar and the first post
       that says nothing the reader came for; folded it is one line
       that says how many releases there are, and opens on a click.
       Remembered in this browser, for every topic. */
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

    /* A walk over a long topic is minutes of work, so what it has
       found is drawn as it finds it rather than at the end. The list
       is repainted at most three times a second: sixty pages arriving
       is sixty repaints of a list that grows by a row or two, and the
       rows carry click handlers.

       A full render() is what repaints, filter chips and all. A chip
       pressed while the walk is running comes back unpressed on the
       next page, which is a fair trade for not keeping two ways of
       drawing the same list in step. */
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
        // The pass has its direction now; changing it mid-walk would
        // only change the list, which reads as the walk turning round.
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
        // Both scopes read in the direction the panel is set to, so
        // the control means one thing rather than two.
        const rows = inReadingOrder(scoped ? (state.topic ? state.topic.rows : []) : pageRows, state.order);
        const latest = scoped ? latestVersion(rows) : null;

        if (scoped && state.topic) {
            const live = Boolean(state.topic.live);
            const pending = state.topic.pending || 0;

            const again = el("button.rr-btn", { type: "button", "data-variant": "quiet", disabled: live || null }, [
                icon("layers", 12), t("Read it again"),
            ]);
            again.addEventListener("click", walk);

            /* The rest of a long topic, offered rather than dropped.
               The panel used to read the newest eighty pages of a 429
               page thread, say "the oldest 348 were not read" in small
               text, and that was the end of it. */
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
            /* One sentence, not three spans run together. Read by eye
               the gaps between them are the punctuation; read aloud
               they are nothing, and the line came out as
               "Latest posted: v1.10.05 pages read". */
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

            /* When it was read, whether it has moved on, and the
               control that acts on both — one group, at one end. They
               were at opposite ends of the card: the fact on the left,
               the button that changes it 900px away on the right. */
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
                    /* Why it took as long as it did. A walk that halves
                       its pace because the board is queueing looks
                       exactly like a walk that has hung, and the
                       difference matters to whoever is watching it. */
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

    // Escape stops a walk in progress: eighteen more requests are not
    // something to leave running because somebody changed their mind.
    on(document, "keydown", (event) => {
        if (event.key === "Escape" && topicTab.disabled && topicTab.hasAttribute("aria-busy")) {
            state.cancelled = true;
            toast(t("Stopped reading the topic"));
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

   A reply that quotes three paragraphs to add one line reads as four,
   and a page of those is most of what makes a long thread hard to
   skim. Every other script on this board fixes it by rebuilding the
   quote node, which loses the links, the nested quotes and whatever
   another script attached — and does not run at all under a Trusted
   Types policy.

   Nothing here removes anything: a folded quote is the same nodes with
   `overflow` and a mask drawing a smaller box around them, so the text
   stays laid out, in the accessibility tree, findable by find-in-page,
   and visible to the finder, which reads the DOM.
   ------------------------------------------------------------------ */

/** Quote blocks in post content, outermost first.

    A spoiler's body wears `.quotecontent` too on this board — the
    board reuses the class — so a spoiler somebody opened was measured
    as a quote and folded behind a "show more" of its own, one click
    after they had just asked to see it. A spoiler is the board's own
    fold and does not need a second one. */
function quoteBlocks(root = document) {
    return Array.from(root.querySelectorAll(".postbody .quotecontent, .postbody blockquote"))
        .filter((node) => !(node.parentElement && node.parentElement.classList.contains("spoiler")));
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

/**
 * How tall the fold would be for this quote, or null when it fits
 * within `lines` and is left alone. Reads only — see initQuotes for
 * why the reads and the writes are kept apart.
 */
function measureQuote(quote, lines) {
    if (quote.hasAttribute("data-rr-quote")) return null;

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
    if (content <= limit + lineHeight * 0.5) return null;
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

    /* Every quote is measured first and only then is any of them
       changed. Reading a height after writing to the page forces a
       layout, one per quote when the two are interleaved; read
       together they cost one. */
    const plan = quoteBlocks().map((quote) => ({ quote, limit: measureQuote(quote, lines) }));

    let folded = 0;
    for (const { quote, limit } of plan) {
        if (limit === null) continue;
        // A quote nested inside one that is already folded would draw a
        // control nobody can reach until the outer one opens, and the
        // outer fold already hides it. Outermost come first in document
        // order, so the outer fold is in place by the time the inner
        // one is asked about.
        if (quote.parentElement && quote.parentElement.closest('[data-rr-quote="folded"]')) continue;
        foldQuote(quote, limit);
        folded += 1;
    }
    return folded;
}

/* ================= src/modules/quiet.js ================= */
/* ------------------------------------------------------------------
   Folding low-value replies.

   Half a long release thread is "thanks!", "+1" and a lone emoji, and
   scrolling past forty of them to reach the next mirror is most of
   what makes one hard to read.

   What is read is what a post says, never who wrote it: a post
   carrying a link, a version, code, a real image, a question mark or a
   word that reports a problem is never folded, whatever its length.
   The prior art here is a script that hid everyone not on a list of
   trusted uploaders, which ages badly and buries the day's working
   mirror.

   Folded, not removed: the reply stays laid out, in the accessibility
   tree and findable by find-in-page, with a smaller box around it.
   ------------------------------------------------------------------ */

/* A short post that still reports something. "Link is dead" is four
   words and it is the most useful thing on the page. */
const QUIET_EXCLUDE_RE =
    /\b(dead|down|broken|offline|expired|removed|missing|error|crash(?:es|ing)?|fail(?:s|ed|ing)?|bug|fix(?:ed|es)?|issue|problem|virus|malware|help|404|not work|doesn'?t work|does not work|won'?t (?:start|launch|run)|please)\b/i;

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
    if (post.body.querySelector(CODE_BLOCKS + ", .spoiler, pre, .attachtitle")) return false;

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

   The cheap half is free: the game card already reads an AppID out of
   the first post of every game topic, and it is written down against
   the topic id, so a topic you have opened previews from this browser
   with nothing asked of anyone.

   The expensive half — asking Steam about a game this browser has not
   seen — is the one thing in the script that leaves the page you are
   on, so it is off by default, has its own switch on top, and is
   refused outright on the Tor mirror whatever the setting says.
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

/* A month. It was a setting; a looked-up game's tags and score do not
   change at a rate anybody needs to tune for. */
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

/* The board's own tooltip on a topic title.
 *
 * Every `a.topictitle` on this board carries `title="Posted: Wednesday,
 * 15 May 2013, 16:42"`, so resting on one with the preview switched on
 * drew two things at once: the browser's tooltip and this card, side by
 * side, saying different things about the same topic. The date is worth
 * keeping — it is the one fact the store cannot supply — so it moves on
 * to the card and the attribute goes.
 *
 * The weekday goes with it. "Wednesday" is four times the width of the
 * date it qualifies and nobody reads a 2013 thread by the day of the
 * week it opened on. */
const POSTED_RE = /^\s*(?:Posted|Добавлено)\s*:\s*/i;

function postedOn(link) {
    const said = link.getAttribute("title") || "";
    if (!POSTED_RE.test(said)) return null;
    return said.replace(POSTED_RE, "").replace(/^[^,]+,\s*/, "").trim() || null;
}

function steamCard(game, term, posted) {
    /* Not role=tooltip: a tooltip is text, and this holds the Store and
       SteamDB links. A group named after the game says what it is. */
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
    shell.append(steamPlaceholder("Looking this one up…", entry.posted));
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
        if (result.game) shell.append(steamCard(result.game, steamSearchTerm(entry.title), entry.posted));
        else shell.append(steamPlaceholder(STEAM_EXCUSES[result.why] || STEAM_EXCUSES.miss, entry.posted));
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
    for (const entry of topicRows()) {
        /* Only where a card will actually be drawn, and only once the
           preview is on: with it off the board's tooltip is the only
           thing saying when a topic opened, and it stays. */
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
    // The template wires the box to editor.js — storeCaret(this) on
    // select, click and keyup, initInsertions() on focus — and that
    // script is not loaded on a topic page. Every keystroke threw.
    for (const handler of ["onselect", "onclick", "onkeyup", "onfocus", "onblur", "onchange"]) message.removeAttribute(handler);
    message.setAttribute("placeholder", t("Write a reply"));

    // What was being written last time, if anything. The board's own
    // form arrives empty, so this can only ever add.
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

/* The tags a reply most often needs, one press each. The full editor
   has the whole toolbar; the quick reply had none, and a quote or a
   spoiler meant typing the tags by hand. Face, name, opening, closing. */
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

    // Say so on the button rather than only revealing it once opened:
    // an unsent reply nobody is told about is an unsent reply nobody
    // comes back to.
    const kept = settings.get("saveDraft") && PAGE.topicId ? draftFor(PAGE.topicId) : "";
    if (kept) {
        openButton.lastChild.textContent = t("Finish your reply");
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
        setLabel(t("Loading the reply form…"));
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
            setLabel(t("Write a reply"));
            toast(t("Could not load the reply form. Opening the full editor instead."));
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
                    toast(t("Added to your reply"));
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
        if (anchor && canReply) {
            anchor.append(buildQuickReply());
            /* The board's own "Reply to topic" button sits 40px above
               this card, and the bar at the top of the page has one
               too. Two orange buttons that say the same thing, one over
               the other. The cell goes; the link stays in the page for
               the fallback below. */
            for (const link of document.querySelectorAll('a[href*="mode=reply"]')) {
                if (link.closest(".rr-topicbar, .rr-reply")) continue;
                const cell = link.closest("td");
                if (cell) cell.style.display = "none";
            }
        }
    }

    if (settings.get("selectionQuote")) initSelectionQuote();
}

/* ---- The posting options ------------------------------------------ */

/* "Notify me when a reply is posted", "Attach a signature", "Disable
   BBCode": five checkboxes under every message box, reset to the
   board's defaults every single time. Whatever was ticked when a post
   was last written is ticked again on the next one.

   Only when writing something new. Editing an existing post loads that
   post's own options, and overwriting them would quietly change what
   is already published. */
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

/* ---- The writing toolbar -------------------------------------------

   The board's own BBCode bar is sixteen grey rectangles reading "s",
   "[*]", "List=" and "spoiler=", and what each one does is written
   nowhere on it: the explanation goes into a read-only field under the
   bar, full width, which reads as a second Subject box. So the caption
   says what the button makes, an icon repeats it, the bar is cut into
   groups, and the explanation becomes the same tooltip every other
   control here uses.

   Nothing about the button changes but its face: `bbstyle()` works off
   the `bbtags` array and never off a caption, the accesskeys and the
   onclick stay, and the helpbox stays in the page (hidden) because
   `helpline()` writes into it on every mouseover.
   -------------------------------------------------------------------- */

/* Keyed by the input's name for the tags phpBB numbers itself, which
   is stable and the same in both languages. */
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

/* The board's own added BBCodes are numbered in whatever order the
   admin defined them, so those are keyed by the tag itself — which is
   what the button already says. */
const BB_BY_TAG = {
    "s":        { label: "S", face: "strike", tip: "Strikethrough" },
    "spoiler":  { label: "Spoiler", icon: "hide", tip: "Hide text until clicked" },
    "spoiler=": { label: "Named spoiler", icon: "hide", tip: "Spoiler with a title" },
    "youtube":  { label: "YouTube", icon: "play", tip: "Embed a YouTube video" },
};

/* What belongs beside what: the letter styles, then the blocks, then
   what is fetched from somewhere else, then what is hidden, then the
   board's own generator. A key is a button name, or a tag written
   `tag:`. */
const BB_GROUPS = [
    ["addbbcode0", "addbbcode2", "addbbcode4", "tag:s"],
    ["addbbcode6", "addbbcode8", "addbbcode10", "addbbcode12", "addlistitem"],
    ["addbbcode14", "addbbcode16", "tag:youtube"],
    ["tag:spoiler", "tag:spoiler="],
    ["addsteaminfo"],
];

/**
 * The board's own help text, out of the inline `help_line` table it
 * writes beside the toolbar.
 *
 * Only ever used for a BBCode this script has no entry for — one the
 * board has added since — so that an unknown button still says
 * something rather than nothing.
 */
function boardHelpLines() {
    const table = {};
    for (const script of document.querySelectorAll("script:not([src])")) {
        const text = script.textContent || "";
        const at = text.indexOf("help_line");
        if (at < 0 || !/var\s+help_line\s*=/.test(text)) continue;
        // No value in that object contains a brace, so the first one
        // after it closes the literal.
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

/**
 * Draw one button as a tool: a caption that says what it makes, an
 * icon beside it, and its name on a label above it.
 *
 * The tooltip goes on a wrapper rather than on the input, because a
 * replaced element draws no pseudo-elements — `input::after` is
 * nothing at all, which is the reason the board needed a field for
 * this in the first place.
 */
function dressTool(input, spec, fallbackTip) {
    const tip = spec ? t(spec.tip) : fallbackTip;
    const holder = el("span.rr-bbtool", { "data-rr-tip": tip, "data-rr-tip-side": "above" });

    if (spec) {
        // The template types a width and a text-decoration into every
        // one of these; both are wrong once the caption is a word.
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

/** Above the button, and inside the window: a label centred on a
    button at either edge of a narrow screen hangs off the page. */
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

    /* Where the buttons came from, read before any of them is moved:
       once one is in the new bar its `closest("td")` is the bar. */
    const cells = new Set(buttons.map((input) => input.closest("td")).filter(Boolean));
    const home = buttons[0].closest("td");
    if (!home) return;

    const help = boardHelpLines();
    const pool = new Map();
    for (const input of buttons) {
        pool.set("name:" + (input.getAttribute("name") || ""), input);
        // First one wins: two BBCodes cannot share a tag, but a stray
        // duplicate must not take a named button's place.
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
        /* The font size menu is a letter style like the three beside
           it, and the board leaves it stranded at the end of the first
           row wearing a label of its own. */
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

    /* A BBCode the board has added since this was written: it keeps
       its own caption, and the board's own help line becomes its
       tooltip. Better an unfamiliar button that explains itself than
       one this script quietly drops. */
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

    /* The buttons come out of two table rows. The first takes the
       toolbar — it also holds the inline scripts the board runs there,
       which are left exactly where they are — and any row left with no
       control on it goes. */
    home.append(bar);
    for (const cell of cells) {
        if (cell !== home && !cell.querySelector("input, select, a, textarea")) {
            const row = cell.closest("tr");
            if (row) row.hidden = true;
        }
    }

    /* The field the board wrote the explanation into. It stays in the
       page and it stays a field: `helpline()` sets its value on every
       mouseover, and a removed one throws on all of them. */
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

/**
 * "Font colour" belongs to the swatches, so it goes in their cell.
 *
 * The board writes it in the cell above them — the row that also
 * carries the help field — which reads correctly only while the two
 * rows are drawn as a grid. On a phone the rows unpack and the heading
 * lands above the message box with its swatches a screen below it.
 *
 * Found by position rather than by its words, which are translated:
 * the cell in the same column, one row up. markShapes() (lists.js) has
 * named the palette by the time this runs.
 */
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
/* ------------------------------------------------------------------
   People.

   phpBB's foe list is four clicks deep in the control panel and only
   takes effect on the next page load. This is the local version: a
   per-post control, applied immediately, kept in this browser.

   Hidden posts collapse to one line rather than going, so a thread
   does not silently lose replies people are answering.

   Entries key on the member id in the profile link rather than on the
   display name, because this board renames and the first version lost
   the entry the day somebody did. The name is kept alongside so an
   export stays readable, and so a post with no profile link — a
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

    const restore = el("button.rr-btn", { type: "button", "data-variant": "quiet" }, [t("Show")]);
    const note = el("div.rr-hidden-note", {}, [
        el("span", {}, [t("Post by {name} is hidden", { name })]),
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
        /* The control that was focused is gone with the note; the
           keyboard lands on the post it revealed, not on the page. */
        cell.setAttribute("tabindex", "-1");
        cell.focus({ preventScroll: true });
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
    labelled(button, button.getAttribute("title") || t("Hide posts by this member"));
    button.setAttribute("data-rr-tip-side", "above");
}

/* ---- First unread --------------------------------------------------- */

/**
 * phpBB can jump to the first unread post, but only from a link in the
 * topic list. Inside a topic there is no way back to it.
 */
function addUnreadJump(bar) {
    if (!bar || !PAGE.topicId) return;
    // The board printed one for this member and the bar already took it.
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

/* ================= src/modules/preview.js ================= */
/* ------------------------------------------------------------------
   Topics in the palette, and a look inside one.

   Two features that only make sense together.

   The board has one search box and it reloads the page, so the palette
   offers a row that hands the query to search.php. That is the right
   escape hatch and the wrong first answer: you cannot see what you are
   choosing between until after a page load, and this board will not
   let you search twice in a row anyway — phpBB's flood interval on
   cs.rin.ru is about half a minute, measured, and a search typed one
   letter at a time would burn it on the prefixes and be refused on the
   word.

   So nothing here searches. Every listing this browser opens is
   already a hundred topic titles arriving for free; they are kept, and
   typing filters what has been seen. That is instant, costs no
   request, and cannot be rate limited.

   And resting on one fetches its first page, once, to show what is in
   it — the board it is in, how long it runs, who opened it and what
   they said. viewtopic.php has no flood interval; a page is 40-110 KB
   and about 350ms.
   ------------------------------------------------------------------ */

/* Eight hundred topics is 110 KB, which localStorage holds ten times
   over, and about eight listings' worth — far more than anyone types
   against in one sitting, and small enough that the write at the end
   of a listing is not felt. */
const TOPIC_BUCKET = "topics";
const TOPIC_LIMIT = 800;

/* How long the reader has to stay on a row before it is fetched.

   Long enough that arrowing from the top of the list to the fourth
   entry does not ask for four pages, short enough that stopping on
   one feels like it answered rather than like it thought about it. */
const PREVIEW_DWELL = 260;

/* The pane hangs off the centre line, past the palette's own 320px
   half and a 12px gap, so the room it has is what is left of the
   half-window after those. At 1200px that bottoms out at 256px, which
   still holds a title and four lines of a post; below it there is not
   enough left to read, and the fetch would be spent on something
   nobody can see. features.css hides the pane at the same width; this
   is what stops the request. A phone is also the worst place to spend
   110 KB. */
const PREVIEW_MIN_WIDTH = 1200;

/* Measured on the live board: one search, then refusals at +1s, +8s
   and +8s again, then an answer at +20s. "A few minutes" is what the
   board says and about half a minute is what it does, so this is a
   warning and never a block — the number is the board's to enforce. */
const SEARCH_INTERVAL = 30000;

/* ---- What this browser has seen ----------------------------------- */

/**
 * One canonical URL for a topic.
 *
 * The board hangs a session id on every link, stamps `lang=` on some,
 * and points a title at `&start=225` or `#unread` depending on where
 * it was picked up. All of those are the same topic, and left alone
 * they would be four entries in the index and four fetches for one
 * preview.
 */
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

/**
 * Keep the topics on this page.
 *
 * Runs on anything that lists topics — a forum, a search result, the
 * active-topics page — because all three are `a.topictitle` and the
 * reader does not care which one a title was picked up from.
 *
 * Written once per page, at the end, and only when something actually
 * changed: a listing revisited unchanged costs a read and no write.
 */
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
        // The title is re-read every time on purpose: a topic renamed
        // to "[Release] … v2.1" is a different thing to search for.
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

    // Newest sighting first, so the cap drops what has not been seen
    // in longest rather than whatever the Map happened to hold last.
    const next = Array.from(byId.values()).sort((a, b) => b.s - a.s).slice(0, TOPIC_LIMIT);

    /* A full quota is not a reason to lose the feature. Half of an
       index still answers most of what is typed at it, and the next
       listing fills it back up to whatever fits. */
    if (!bucket.set(TOPIC_BUCKET, next) && next.length > 40) {
        bucket.set(TOPIC_BUCKET, next.slice(0, Math.floor(next.length / 2)));
    }
}

/**
 * Topics matching what has been typed, best first.
 *
 * Only ever with a query: eight hundred titles in no order is not a
 * list anybody reads, and the palette's own groups — bookmarks, the
 * recent ones — are the answer to an empty box.
 */
function matchingTopics(needle, limit) {
    if (!needle || !settings.get("paletteTopics")) return [];

    const found = [];
    for (const entry of knownTopics()) {
        if (!matchesWords(entry.t, needle)) continue;
        found.push(entry);
        // Twice the limit, so the sort below has something to choose
        // from without walking the whole index into an array.
        if (found.length >= limit * 4) break;
    }

    /* A title that starts with the query is what was meant more often
       than one that merely contains it — "elden" should reach Elden
       Ring before "The Elden Ring of a longer name" — and after that
       the most recently seen wins, which on this board means the most
       recently active. */
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

/* ---- The board's flood interval ----------------------------------- */

/* The palette navigates away when a search is chosen, so there is no
   answer to read: what the board did with the request is only visible
   on the page that replaces this one. What can be known is when the
   last one was asked for, which is enough to say "not yet" before the
   board says "not at all". */
function noteBoardSearch() {
    bucket.set("lastSearch", Date.now());
}

/** Seconds still to wait, or 0 when a search is worth trying. */
function searchCooldown() {
    const last = Number(bucket.get("lastSearch", 0));
    if (!Number.isFinite(last) || !last) return 0;
    const left = SEARCH_INTERVAL - (Date.now() - last);
    // A stamp from the future — a clock put back, a machine restored
    // from a backup — would otherwise read as a wait of hours. Nothing
    // longer than the interval itself can be real.
    if (left <= 0 || left > SEARCH_INTERVAL) return 0;
    return Math.ceil(left / 1000);
}

/* ---- Looking inside one ------------------------------------------- */

/* Kept for as long as the tab is open, not written down: a preview is
   a glance at something that changes, and one page of one topic is
   110 KB that has no business in storage. Arrowing up and down a list
   of ten therefore asks for ten pages once and none of them again. */
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

/**
 * The first image of the opening post, if it is one worth showing.
 *
 * The board's CSP is `img-src 'self' https: data:`, so a post's own
 * imgur or Steam art loads here as well as it does on the page it came
 * from. Smilies and the template's own icons do not count as art: they
 * live under styles/ and are the reason for the size floor.
 */
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

    /* headCell, not head: `head` is the band topic.js draws, and this
       document was parsed out of a fetch and never went near topic.js.
       The template's own cell is what a detached page has, and it
       reads "Post subject: … Posted: Sunday, 12 Oct 2014, 22:49" —
       both halves in one run of text, in whichever of the board's two
       languages the reader is in. The date is picked out by its shape
       rather than by the word in front of it, which also drops the
       weekday nobody needs. */
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

/**
 * Fetch and read one topic's first page.
 *
 * One request per topic per tab, and one in flight per topic however
 * many times the cursor passes over it: the promise itself is what is
 * cached, so a second ask while the first is still out waits on it
 * rather than starting another.
 */
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

    // A failure is not kept: the next hover should be allowed to try
    // again rather than repeat an error from ten minutes ago.
    job.catch(() => previewCache.delete(id));
    previewCache.set(id, job);
    return job;
}

/* ---- The pane ------------------------------------------------------ */

function previewSkeleton() {
    return el("div.rr-preview__wait", {}, [t("Reading that topic…")]);
}

/**
 * The picture, on condition that it turns out to be one.
 *
 * Whether an image is worth showing cannot be settled from the markup:
 * the width attribute is optional and most posts leave it off, so the
 * only honest test is the file itself. Until it arrives the element is
 * there and empty; a 16px sprite blown up to the pane's full width, or
 * a host that refuses to serve it, takes itself back out rather than
 * standing at the top of the pane as a smear or a broken-image box.
 */
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

    /* Filtered, not passed straight to append(): el() drops a null
       child, and Node.append() turns one into the text "null" — which
       is what a topic whose opening post has no picture put above its
       own title. */
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

/**
 * Wire a palette's cursor to a pane beside it.
 *
 * Called by the palette once, with the overlay it just built and a way
 * to ask what the cursor is on.
 *
 * The pane goes in the overlay, not in the panel: the panel clips its
 * own corners, so a child hung off its right edge would be cut off at
 * it, and a sibling laid out beside it in the overlay's centred row
 * would shove the list 170px to the left the first time one opened.
 * Positioned against the centre line instead, the list never moves.
 */
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
        // Checked again here, not only when the palette opened: a
        // window narrowed since then has the stylesheet hiding the
        // pane, and a fetch for something nobody can see is the one
        // request this feature has no excuse for.
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
        // Already read: no reason to make the reader wait out a dwell
        // for something that is in memory.
        if (previewCache.has(topicKey(href))) { show(href); return; }
        timer = window.setTimeout(() => show(href), PREVIEW_DWELL);
    };

    return settle;
}

/* ---- Forgetting it ------------------------------------------------- */

/* "Clear data" in the settings panel says it forgets bookmarks, reading
   history, hidden members and the Releases cache — everything the
   script keeps for itself. The index of titles is that too, and it is
   the largest of them; it lives on its own key rather than in rr:data,
   so store.replace({}) does not reach it and it has to be named. */
function forgetTopicIndex() {
    bucket.drop(TOPIC_BUCKET);
    bucket.drop("lastSearch");
}

/* ---- Boot ---------------------------------------------------------- */

function initTopicIndex() {
    /* A search from the board's own box spends the same interval the
       palette's row does. Caught here rather than in navbar.js so the
       box can be rebuilt without anyone remembering to tell this.
       Capture, because the board's own handler may stop the event. */
    document.addEventListener("submit", (event) => {
        const form = event.target;
        if (!(form instanceof HTMLFormElement)) return;
        if (/search\.php/.test(form.getAttribute("action") || "")) noteBoardSearch();
    }, true);

    /* After the page is drawn. A hundred titles and one write is not
       worth a millisecond of the first paint, and nothing reads the
       index until Ctrl+K. */
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

/* Left unset, phpBB searches with sr=posts and sf=all — the raw text
   of every post, quotes included, so a thread twelve people quoted the
   same release in came back as twelve results pointing at it. The
   board's own boxes have shipped sr=topics for years; this asks for
   the same. How deep to look is a real choice, so sf is remembered.

   Keyed by the board's own sf value, which is what the search box's
   options (navbar.js, addSearchOptions) store. */
const SEARCH_DEPTH = {
    titleonly: { sf: "titleonly", hint: "titles" },
    firstpost: { sf: "firstpost", hint: "titles + first post" },
    msgonly:   { sf: "msgonly",   hint: "post text" },
    all:       { sf: "all",       hint: "every post" },
};

/* The author to search for, from the chooser's own field.
 *
 * Not stored with the rest: a remembered room narrows a search in a
 * way the chip prints on itself, and a remembered name would narrow
 * every later search to one member with nothing on screen saying so.
 * It lives as long as the palette is open. */
let searchAuthor = "";

/**
 * The board's search URL for a query, from wherever the reader is.
 * Scoped to the current board when there is one, the way the board's
 * own "Search this forum" box is.
 */
/**
 * Which forum a search from the palette goes to, or null for the board.
 *
 * The same answer the box in the bar gives, from the same two places:
 * the breadcrumb, because half the links on this board carry no forum
 * id and PAGE.forumId is null on any topic reached from a listing;
 * and the remembered choice, so the palette and the box cannot
 * disagree about where a search goes.
 */
function paletteSearchPlace() {
    const kept = searchPrefs().where;
    /* A board picked from the palette's own chooser, which offers the
       whole cached list rather than the two or three rooms the page
       you are on happens to sit in. It is named `f:<id>` so the box in
       the bar, which only knows "here", "up" and "board", falls back
       to its own default instead of trying to honour a room it has no
       segment for. */
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
    // Nobody has chosen: the forum above a topic, the forum itself on
    // a listing. See parentForum().
    return PAGE.isTopic ? (up || here) : here;
}

function boardSearchUrl(query) {
    const depth = SEARCH_DEPTH[searchDepthChoice()] || SEARCH_DEPTH.titleonly;
    const place = paletteSearchPlace();
    const url = new URL("./search.php", location.href);
    // The board takes a search with no words in it as long as there is
    // a name on it, which is what "everything this member posted in
    // Releases" is.
    if (query) url.searchParams.set("keywords", query);
    if (searchAuthor) url.searchParams.set("author", searchAuthor);
    url.searchParams.set("terms", searchChoice("terms", SEARCH_TERMS));
    url.searchParams.set("sf", depth.sf);
    url.searchParams.set("sr", searchChoice("sr", SEARCH_SHOW));
    if (place) url.searchParams.set("fid[]", place.id);
    return url.toString();
}

/* ---- The chooser at the head of the palette's field -----------------

   The palette hands its query to the board, and it did that with
   whatever the box in the bar had last been set to — chosen on another
   page, invisible from here. The row said where the search was going
   and there was no way to send it anywhere else without closing the
   palette and finding a search box.

   So what the full search form asks — which rooms, how deep, every
   word or any word, threads or posts, whose posts — is asked here
   instead, from one control at the head of the field. The form itself
   is a page load away and comes back as a page of results; this is the
   same query, aimed before it is sent.

   Not all of it: sorting, the date range and how many characters of a
   post to print back are choices about a page of results, and the
   place to make those is the page of results. */

const FORUM_TREE_KEY = "forumTree";

/**
 * Every room the reader may search, in the board's own order.
 *
 * Two sources, and the better one wins. The full search form prints
 * the whole tree in one <select> — categories, forums, subforums,
 * indented with non-breaking spaces — as the reader's own account sees
 * it, so a member with a restricted room gets it and everyone else
 * does not. The index knows less: top-level forums and the subforum
 * links under them, and no idea of what it cannot see. The index is
 * visited by everyone and the search form by almost nobody, so the
 * index fills the list until the form has been opened once.
 */
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

/* The search form's own list of rooms.
 *
 * Depth is the indent the template wrote: "&nbsp; &nbsp;" per level,
 * three characters once the entities are text. A row with something
 * deeper under it and nothing above it is a category — "English
 * Forums" holds no topics of its own — so it is a heading here rather
 * than somewhere a search can be sent. */
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

/**
 * The rooms the chooser offers, and what picking one is stored as.
 *
 * `where` is shared with the box in the bar, which knows three words:
 * the room you are in, the one above it, and the whole board. A room
 * picked from the tree that happens to be one of those is stored as
 * that word, so the box keeps honouring it; anything else is stored as
 * `f:<id>`, which the box does not recognise and falls back from. */
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

    // Nothing cached yet — this browser has opened neither the index
    // nor the search form. The breadcrumb still knows two rooms.
    const trail = forumTrail();
    const here = trail.length ? trail[trail.length - 1] : null;
    const up = parentForum(trail);
    const rooms = [];
    if (up) rooms.push({ id: String(up.id), title: up.name, depth: 0 });
    if (here && (!up || up.id !== here.id)) rooms.push({ id: String(here.id), title: here.name, depth: up ? 1 : 0 });
    return rooms;
}

/**
 * The control, its popover, and every pressed state kept in line with
 * what is stored.
 *
 * `onPick` redraws the palette behind it: the row that hands the query
 * to the board names the room, says how deep it will look and whose
 * posts it will look at, so a choice that did not redraw would leave
 * the answer to the question the reader just asked sitting one line
 * under the control.
 */
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

    /* Rooms are matched on the forum id rather than on the stored word:
       the same room is "here" from inside it and `f:10` from the tree,
       and both have to light the same row. */
    const sync = () => {
        const place = paletteSearchPlace();
        const id = place ? String(place.id) : null;
        const depth = searchDepthChoice();
        where.textContent = place ? shortForumName(place.name) : t("Whole board");
        // The room is printed on the chip, so the accent is kept for
        // everything that is not — how deep it looks, whose posts, any
        // word rather than all of them — the same way the box in the
        // bar spends it.
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
        // Somewhere to arrow from, and the answer to "where is it set"
        // under the cursor.
        const first = rooms.querySelector('button[aria-pressed="true"]') || rooms.firstElementChild;
        if (first) first.focus();
        if (first) first.scrollIntoView({ block: "nearest" });
    };
    button.addEventListener("click", () => {
        if (pop.hidden) open();
        else { close(); button.focus(); }
    });

    /* Enter in the author field is the reader saying they are done
       here, not asking for a member list: it puts the choices away and
       hands focus back to the query, where Enter runs the search. */
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

    /* Ranked by traffic for the jump list above; in the board's own
       order, subforums and all, for the chooser. Two lists because
       they answer different questions: "which board do I mean" wants
       Main Forum first, "which board do I search" wants Releases
       under it. */
    cacheIndexForums();
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

    /* A bookmark and a recent topic are topics, so they get the pane
       beside the palette too (preview.js): the palette opens on these
       two lists, and resting on one is the first thing anybody does
       with it. `preview` is the URL to read; a board or an action has
       none and gets no pane. */
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

    /* On a topic page the actions are about this topic — copy its
       link, jump to its last page — and were under seven boards and six
       recent topics, below the fold of the palette. First, there. */
    const actions = { title: t("Actions"), items: paletteActions() };
    if (PAGE.isTopic) groups.unshift(actions);
    else groups.push(actions);
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
        placeholder: t("Search the forum, or jump to a board"),
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
    // The field and the control that says where its query goes are one
    // strip; the popover hangs off it, so the strip is what it is
    // positioned against.
    const bar = el("div.rr-palette__bar", {}, [input]);
    const panel = el("div.rr-palette", { role: "dialog", "aria-modal": "true", "aria-label": "Command palette" }, [bar, list]);
    const overlay = el("div.rr-overlay", {}, [panel]);

    let flat = [];
    let cursor = 0;

    const searchItem = (query) => {
        /* It says where it will look. The row said "the forum" and
           searched the board the reader was in — and later named the
           last crumb, which on a topic page is the topic. */
        const place = paletteSearchPlace();
        const cooldown = searchCooldown();
        return {
            /* Four sentences rather than one with pieces bolted on: a
               name and no words is a whole search on this board — what
               did this member post in Releases — and reads as one. */
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
            /* The board allows one search about every half minute and
               answers the ones in between with "you cannot use search
               at this time" — a page load spent to be told no. The row
               still works; it says what it is about to cost. */
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

        // A name in the chooser is a search on its own, with or without
        // words to go with it.
        if (needle || searchAuthor) list.append(renderGroup(t("Search"), [searchItem(query.trim())], flat));

        /* Topics this browser has already walked past, filtered as you
           type (preview.js). Above the boards and below the search
           row: what someone typing a game name wants is the thread,
           and the row that hands the query to the board is the one
           thing that can find a thread nobody here has seen. */
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
            // What the preview pane reads off the cursor (preview.js).
            node._item = item;
            fragment.append(node);
        }
        return fragment;
    };

    // A pane beside the panel, fed by whatever the cursor is on
    // (preview.js). Returns a no-op where there is no room for it.
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
        /* This listener is on the document and captures, so with the
           choices open it would still be the one answering: Enter would
           run the highlighted row rather than press the button under
           the cursor, and Escape would take the whole palette down
           when the reader only meant to put the choices away. */
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
    // Anywhere else in the palette puts the choices away, the way
    // clicking off any other popover does.
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
    // The full search form, met on its own page. Nothing else on the
    // board prints the whole tree.
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
/* ------------------------------------------------------------------
   Keyboard navigation.

   Single-key bindings only fire when nothing is focused that would
   swallow them, so typing "j" in the reply box still types a j.
   ------------------------------------------------------------------ */

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
    // Each anchor's position is read once and kept with it.
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

/**
 * j and k on a listing: the cursor walks the rows the way it walks the
 * posts of a topic, and Enter opens the one it is on, because the row's
 * title link is what gets the focus. Returns false where there is no
 * listing, so the caller falls back to posts.
 */
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
            case "j": event.preventDefault(); if (!moveListCursor(1)) scrollToPost(1); break;
            case "k": event.preventDefault(); if (!moveListCursor(-1)) scrollToPost(-1); break;
            case "n": goPage(1); break;
            case "p": goPage(-1); break;
            case "r": {
                /* The quick reply first, when there is one: "r" used to
                   leave for the full posting page past the form that was
                   already on this one. */
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
/* ------------------------------------------------------------------
   Page furniture: reading progress and the floating jump buttons.

   Both are position:fixed and outside the forum markup, so neither can
   push the layout around.
   ------------------------------------------------------------------ */

/**
 * How far down the page you are.
 *
 * A reading indicator drawn at y=0 and part-filled at load is a
 * loading indicator that has stalled, which is how this one was
 * reported. So it sits on the bottom edge of the sticky bar rather
 * than floating, stays out of the way until the page has actually been
 * scrolled, and is a real progressbar with a name and a value.
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
    /* The first reading is not taken here.
     *
     * `scrollHeight` makes the browser lay the whole page out before it
     * can answer, and this runs while the stylesheet is still holding
     * the page back — so the reader waits for a number that says
     * "you are at the top", which is the state the bar is already
     * drawn in. A ResizeObserver's first callback arrives after the
     * layout the first paint needed anyway, so it costs nothing. */
    if (window.ResizeObserver) new ResizeObserver(() => update()).observe(document.documentElement);
    else requestAnimationFrame(update);
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

    // Hidden until the first reading says otherwise, so a page with
    // nothing below the fold never shows it at all.
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
    // Same reason as the progress bar: reading the page height here
    // costs a full layout inside the gate that holds the page back,
    // and the answer only decides whether a button in the corner is
    // drawn. One frame later it is free.
    requestAnimationFrame(update);
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

const RR_VERSION = "0.13.0";

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

/* The page is held back until the late phase has run.

   Everything that rebuilds the board — the top bar, the topic bar, the
   post headers, the releases panel — runs at DOM ready, and the
   browser paints before that: for a frame or two the reader saw the
   board's own layout in this script's colours, then everything jumped
   into place. The stylesheet keeps <body> invisible until this
   attribute lands, and it lands whatever happens: at the end of the
   late phase, on a failure inside it, and on a watchdog in case the
   late phase never runs at all. A blank page is the one outcome this
   must never produce. */
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

/* Two halves, and the order between them is the reason the page
   appears when it does.

   Everything above the line only writes. Everything below it has to
   read the page back — a quote's height, whether a strip is drawn at
   all, what colour is actually behind a username — and a read after a
   write makes the browser lay the whole page out before it can
   answer. The board is nested tables, so one of those is tens of
   milliseconds.

   Interleaved, that was five full layouts per page load, four of them
   thrown away by the next module's writes. Measured on the live
   board: folding quotes ran eighth and cost 36.7 ms on a topic, the
   breadcrumb strip ran eighteenth and cost 54.9 ms on a listing, and
   between them nine modules rewrote the page. The reader pays for
   every one of them, because the stylesheet holds the page back until
   this function returns — which is what makes the page you came from
   sit there a tenth of a second longer than it should. */
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
guard("boot:late", () => whenReady(() => { try { bootLate(); } finally { markReady(); } }));

/* Outside every guard, and scheduled whatever happened above: a page
   held back and never released is a page nobody can read, which is a
   far worse failure than the flash this avoids. */
setTimeout(markReady, READY_WATCHDOG);

})();

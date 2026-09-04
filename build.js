#!/usr/bin/env node
/* ------------------------------------------------------------------
   Bundler.

   Userscript managers install one file, so the sources are stitched
   into dist/rin-reforged.user.js. There is no transpiling and no
   dependency: the sources are plain scripts sharing one IIFE scope,
   concatenated in dependency order.

   Because the scope is shared, every top-level name in src/ has to be
   unique. The build fails loudly if two files declare the same one,
   which is the tradeoff for not shipping a bundler.
   ------------------------------------------------------------------ */

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PACKAGE = require("./package.json");
const VERSION = PACKAGE.version;

/* Where the script is published, so the header can point its update
   check at it. Read out of package.json rather than typed into the
   header twice, and overridable for a fork:

       RR_OWNER=someone RR_REPO=my-fork node build.js
*/
const REMOTE = (PACKAGE.repository && PACKAGE.repository.url) || "";
const SLUG = REMOTE.match(/github\.com[/:]([^/]+)\/([^/.]+)/) || [];
const OWNER = process.env.RR_OWNER || SLUG[1] || "OWNER";
const REPO = process.env.RR_REPO || SLUG[2] || "rin-reforged";

const CSS_FILES = [
    "src/styles/tokens.css",
    "src/styles/forum.css",
    "src/styles/ui.css",
    "src/styles/features.css",
    "src/styles/responsive.css",
];

// Dependency order, not alphabetical: store defines the settings API
// that every later module reads at load time.
const JS_FILES = [
    "src/core/store.js",
    "src/core/schema.js",
    "src/core/dom.js",
    "src/core/page.js",
    "src/core/pagination.js",
    "src/modules/theme.js",
    "src/modules/icons.js",
    "src/modules/settingsui.js",
    "src/modules/navbar.js",
    "src/modules/lists.js",
    "src/modules/boardindex.js",
    "src/modules/topic.js",
    "src/modules/finder.js",
    "src/modules/releases.js",
    "src/modules/quotes.js",
    "src/modules/quiet.js",
    "src/modules/steam.js",
    "src/modules/compose.js",
    "src/modules/people.js",
    "src/modules/palette.js",
    "src/modules/shortcuts.js",
    "src/modules/chrome.js",
    "src/main.js",
];

const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

/* ---- CSS --------------------------------------------------------- */

function buildCss() {
    return CSS_FILES.map((file) => {
        const body = read(file);
        return "/* == " + path.basename(file) + " == */\n" + body.trim();
    }).join("\n\n");
}

/** Embed the stylesheet as a template literal, escaping only what
    would end it early. */
function asTemplateLiteral(css) {
    return "`" + css.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${") + "`";
}

/* ---- JS ---------------------------------------------------------- */

const DECLARATION = /^(?:const|let|var|function|async function|class)\s+([A-Za-z_$][\w$]*)/gm;

/* Control characters that should never be in a source file.

   A backspace typed into a regular expression literal is invisible
   in an editor, invisible in `grep` output — the terminal obeys it
   and eats the character before it — and perfectly valid
   JavaScript. It cost an hour here: /\\b(Mon|...)/ lost its
   backslash to one, the pattern still compiled, and it then quietly
   matched nothing at all.

   Tab, newline and carriage return are the only ones with a job. */
const CONTROL_CHARS = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;

function collectControlChars(source, file, problems) {
    let match;
    CONTROL_CHARS.lastIndex = 0;
    while ((match = CONTROL_CHARS.exec(source)) !== null) {
        const line = source.slice(0, match.index).split("\n").length;
        const code = "U+" + match[0].charCodeAt(0).toString(16).toUpperCase().padStart(4, "0");
        problems.push(code + " at " + file + ":" + line);
    }
}

function collectNames(source, file, seen, problems) {
    let match;
    DECLARATION.lastIndex = 0;
    while ((match = DECLARATION.exec(source)) !== null) {
        const name = match[1];
        if (seen.has(name)) problems.push(name + " declared in both " + seen.get(name) + " and " + file);
        else seen.set(name, file);
    }
}

function buildJs() {
    const seen = new Map();
    const problems = [];
    const control = [];
    const parts = JS_FILES.map((file) => {
        const source = read(file);
        collectNames(source, file, seen, problems);
        collectControlChars(source, file, control);
        return "/* ================= " + file + " ================= */\n" + source.trim();
    });

    if (problems.length) {
        console.error("Duplicate top-level declarations:\n  " + problems.join("\n  "));
        process.exit(1);
    }
    if (control.length) {
        console.error("Control characters in source:\n  " + control.join("\n  "));
        process.exit(1);
    }
    return parts.join("\n\n");
}

/* ---- Output ------------------------------------------------------- */

function main() {
    const header = read("src/header.txt")
        .replace("__VERSION__", VERSION)
        .replace(/__OWNER__/g, OWNER)
        .replace(/__REPO__/g, REPO);
    const css = buildCss();
    const js = buildJs().replace(/__VERSION__/g, VERSION);

    const bundle = [
        header,
        "",
        "/* Built from src/ by build.js. Edit the sources, not this file. */",
        "",
        "(function () {",
        '"use strict";',
        "",
        "const RR_CSS = " + asTemplateLiteral(css) + ";",
        "",
        js,
        "",
        "})();",
        "",
    ].join("\n");

    const out = path.join(ROOT, "dist", "rin-reforged.user.js");
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, bundle, "utf8");

    const kb = (Buffer.byteLength(bundle, "utf8") / 1024).toFixed(1);
    console.log("dist/rin-reforged.user.js  " + kb + " KB  (v" + VERSION + ", " + JS_FILES.length + " modules)");
}

main();

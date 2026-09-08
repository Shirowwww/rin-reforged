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

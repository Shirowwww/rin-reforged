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

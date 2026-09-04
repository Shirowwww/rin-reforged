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

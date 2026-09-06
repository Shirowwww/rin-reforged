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
   "[*]", "List=", "spoiler=" and "Generate SteamInfo BBCode", laid out
   in two undivided rows. What each one does is written nowhere on it:
   the board puts the explanation in a read-only text field under the
   bar, the full width of the form, which sits exactly where a second
   Subject box would and reads as one. People fill in a form; they do
   not hover a field to be told things.

   So: the caption says what the button makes, an icon repeats it, the
   bar is cut into groups, and the explanation is a small label above
   the button that names it — the same tooltip every other control in
   this script already uses.

   Nothing about the button changes but its face. `bbstyle()` works off
   the `bbtags` array and never off a caption, the accesskeys stay, the
   onclick stays, and the helpbox stays in the page (hidden) because
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
    for (const script of $$("script:not([src])")) {
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
    const buttons = $$("#wrapcentre input.btnbbcode");
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
        /* Its row is shared with the "Font colour" heading over the
           palette, which has to stay where it is. Named, so the row
           can be closed up to the label rather than keeping the height
           a field used to need. */
        const row = helpbox.closest("tr");
        if (row) row.setAttribute("data-rr-helprow", "");
    }
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
    const scroller = $$("#wrapcentre div").find((node) =>
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

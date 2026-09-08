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

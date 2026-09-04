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

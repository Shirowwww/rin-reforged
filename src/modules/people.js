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

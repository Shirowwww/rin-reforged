/* Local foe list: phpBB's own is four clicks deep and needs a reload.
   Hidden posts collapse to one line rather than vanish, so a thread
   doesn't silently lose replies people are answering. Entries key on
   the profile link's member id, not the display name, because this
   board renames and an earlier version lost entries when that happened;
   the name is kept alongside for a readable export and for posts with
   no profile link (deleted accounts, guests). */

/* Entries are { id, name }; an older version stored a bare string, read
 * here as a name-only entry rather than migrated, since it self-upgrades
 * the next time that person is hidden. */
function hiddenPeople() {
    return store.get("hiddenUsers", []).map((entry) =>
        (typeof entry === "string" ? { id: null, name: entry } : entry));
}

// Survives a rename, unlike the display name.
function personId(post) {
    const link = post.table && post.table.querySelector('a[href*="mode=viewprofile"]');
    const match = link && (link.getAttribute("href") || "").match(/[?&]u=(\d+)/);
    return match ? match[1] : null;
}

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

function applyHidden(post, name) {
    if (post.table.querySelector(".rr-hidden-note")) return;

    const cell = post.body.closest("td");
    if (!cell) return;

    const restore = el("button.rr-btn", { type: "button", "data-variant": "quiet" }, [t("Show")]);
    const note = el("div.rr-hidden-note", {}, [
        el("span", {}, [t("Post by {name} is hidden", { name })]),
        restore,
    ]);

    // Remembers what was already folded (a Steam description, a signature) so revealing the post doesn't unfold it too.
    const covered = Array.from(cell.children).filter((child) => !child.hidden);
    for (const child of covered) child.hidden = true;
    cell.prepend(note);

    const reveal = () => {
        for (const child of covered) child.hidden = false;
        note.remove();
        delete post.table.rrReveal;
        // The focused control is gone with the note; land the keyboard on the revealed post instead.
        cell.setAttribute("tabindex", "-1");
        cell.focus({ preventScroll: true });
    };
    restore.addEventListener("click", reveal);
    // Kept on the node, not a map: post objects are rebuilt each posts() pass, the DOM is not.
    post.table.rrReveal = reveal;
}

function postsBy(person) {
    return posts().filter((post) => {
        const other = personOf(post);
        if (!other) return false;
        return person.id && other.id ? person.id === other.id : other.name === person.name;
    });
}

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
            // Reversed in place: reloading used to lose the reader's scroll position and any half-written reply.
            revealPerson(person);
        }

        // Every post by this person carries one of these buttons; keep them all in sync.
        for (const other of document.querySelectorAll('.rr-posttools [data-rr-hide="' + CSS.escape(person.name) + '"]')) {
            other.setAttribute("aria-pressed", next ? "true" : "false");
            other.setAttribute("title", label(next));
            other.setAttribute("aria-label", label(next));
        }
    });
    button.setAttribute("data-rr-hide", person.name);

    // Per-post actions (a separate setting) normally build this strip; make one if that setting is off.
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

// phpBB links the first unread post only from the topic list; nothing gets back to it from inside the topic.
function addUnreadJump(bar) {
    if (!bar || !PAGE.topicId) return;
    // The board already printed one for this member.
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

    // Belongs on the first row (actions on the topic itself); falls back to the bar if there is no row.
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

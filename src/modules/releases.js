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

/* ------------------------------------------------------------------
   Releases: one panel, two scopes.

   This started as two. "On this page" answered "is there a release in
   front of me", read straight out of the DOM and free. "Posted in this
   topic" walked every page and answered "what has been posted here, in
   what order, and which of it is current".

   They were two panels one under the other, listing the same kind of
   thing about the same posts in two different row shapes, and the
   second was strictly the first plus a page number. So there is one
   panel now, with a scope you switch: **This page**, instant and
   asking nobody anything, and **All N pages**, which reads the topic
   once, on a click, and remembers what it found.

   Everything either of them had is here. From the page half: the jump
   that scrolls to the post and flashes it, and the filter that hides
   every post without a link. From the topic half: the version, what
   kind of thing each post is, who posted it, when, which page, the
   highest version anybody posted, filters by kind, and the note saying
   when the topic was last read.

   How the walk behaves is the part worth stating plainly. The page you
   are on is never fetched — it is already parsed and in front of you.
   The rest are fetched one at a time, spaced out, and only when asked:
   a nineteen page topic is nineteen requests to a board that runs on
   donations, so it is a click, never a page load, and never twice in a
   row. Escape stops it. And nothing is guessed: a post is read for
   what it says, with quoted text excluded, because a reply quoting a
   release is not a release.
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
    { id: "online", label: "Online fix", re: /\bonline[\s-]?fix\b|\bgoldberg\b|\bsteam\s?emu\b|\bmultiplayer\s+fix\b|\bco-?op\s+fix\b|\bemulator\b|онлайн\s*фикс|голдберг/i },
    { id: "dlc", label: "DLC", re: /\bdlcs?\b|\bunlocker\b|\bcream\s?api\b|\bsmart\s?steam\b|длс|разблокировщик/i },
    { id: "update", label: "Update", re: /\bupdate[ds]?\b|\bpatch(?:ed|es)?\b|\bhotfix\b|\bupgrade\b|обновлени|обнова|патч/i },
    { id: "reupload", label: "Reupload", re: /\bre-?upload(?:ed|s)?\b|\bmirror(?:s|ed)?\b|\breup\b|перезалив|зеркало/i },
    { id: "trainer", label: "Trainer", re: /\btrainer\b|\bcheat\s+(?:tables?|engines?)\b|\bsave\s?game\b|трейнер|сохранени/i },
    { id: "language", label: "Language", re: /\blanguage\s+(?:pack|files?)\b|\blocali[sz]ation\b|\btranslation\b|русификатор|локализаци/i },
    { id: "tool", label: "Tool", re: /\btool(?:s|kit)?\b|\bmod\s+manager\b|\binstaller\b|активатор|установщик/i },
    { id: "denuvo", label: "Denuvo", re: /\bdenuvo\b|денуво/i },
];

/* What each kind *is*, so the colour carries the same meaning
   everywhere it appears.

   Five of the eleven kinds were coloured and six were grey, which
   looked like a taxonomy and was actually a list of the ones somebody
   had got round to: a Trainer sat neutral in a row where Crack, Update
   and Clean Steam files were all coloured, and the filter chips above
   those rows were grey to a kind — the same word, twice on the same
   screen, in two different colours.

   So every kind belongs to a family, the families are what the
   stylesheet paints, and a test fails if a kind is ever added without
   one. Five families, and each answers a different question about a
   post:

     game    what you install          Clean Steam files, Repack
     run     what makes it start       Crack, Online fix
     change  what it does to a copy    Update, Reupload
     extra   what it adds              DLC, Language
     beside  what sits next to it      Trainer, Tool
     block   what stops it             Denuvo

   The tokens they map to are theme-wide, so Paper gets its own version
   of all six rather than a dark palette on a light page — and the six
   have to stay six on every theme. The first mapping put `run` on
   --rr-tag-important and `block` on --rr-tag-problem, which are the
   same red on the board's own palette: two families, one colour, and
   a Crack that looked like a warning. A check compares all six on
   every theme now. */
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
const RELEASE_MAX_PAGES = 80;

/* ---- How the walk asks the board for pages -------------------------

   The board is one man's server paid for by donations, and it is
   asking for them right now. Reading a thirty-three page topic is
   thirty-two requests however it is arranged, so the only question is
   the shape of them; the answer here is bounded on three axes at once,
   and none of the three is negotiable for speed.

   **How many at a time.** Strictly one at a time with a gap is what
   this did, and on a thirty-four page topic that measured 21.8 seconds
   against the live board — because 95% of it was waiting: a page of
   that topic is 417 ms to first byte and 2.4 ms to parse. The
   published guidance for a host with no crawl-delay of its own is two
   to five connections; the conservative end of that is three, and
   three is what this uses. It is worth adding that the board answers
   HTTP/2 and advertises HTTP/3, so three requests in flight share one
   connection rather than opening three.

   **How fast they may start.** Concurrency alone still allows a burst:
   three requests leaving in the same millisecond, three more the
   moment they land. So no two requests may start closer together than
   RELEASE_START_GAP, which caps the rate at about six a second at the
   very worst and holds it near three in practice — against roughly one
   a second before, for a run that is over in seconds either way.

   **What happens when the board says no.** A 429 or a 503 stops the
   walk where it is rather than retrying into it, and the panel says
   the topic was only read as far as it got.

   **And what happens when it says no without saying so.** This board
   does not answer 429. It queues: after a few dozen requests in quick
   succession it starts serialising everything from that address, and
   six requests sent together come back at two, four, six, eight, ten
   and twelve seconds — a staircase, each step one slot in a queue.
   Measured, from a browser, with none of this script running.

   That is the important finding about this particular board, and it
   makes concurrency worth much less than it looks: against a server
   handing out one slot every two seconds, three requests in flight
   finish no sooner than one and leave three sitting in its queue
   instead of one. So the walk watches its own timings — the first few
   answers set what "prompt" means for today, and once answers are
   several times slower than that, it drops to a single request at a
   time with a much wider gap and stays there. Fast board: three at a
   time and done in seconds. Board under load: out of its way.

   There is no conditional-request path to take here, and that was
   checked rather than assumed: cs.rin.ru sends no ETag and no
   Last-Modified on viewtopic.php, and answers `Cache-Control: private,
   no-cache="set-cookie"` with `Expires: 0`. An If-None-Match round
   trip would cost exactly as much as the page. The saving has to come
   from not asking at all, which is what the page cache below does. */
const RELEASE_IN_FLIGHT = 3;
const RELEASE_START_GAP = 160;        /* between request starts, ms   */
/* Where it goes when the board starts queueing. */
const RELEASE_EASY_IN_FLIGHT = 1;
const RELEASE_EASY_GAP = 700;
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
        slowest: 0,
    };
}

/** Feed one answer's round trip back into the pace. */
function notePace(pace, ms) {
    if (!Number.isFinite(ms) || ms <= 0) return;
    pace.slowest = Math.max(pace.slowest, ms);
    if (ms < pace.best) pace.best = ms;
    if (pace.eased) return;
    if (ms < RELEASE_SLOW_FLOOR) return;
    if (ms < pace.best * RELEASE_SLOW_FACTOR) return;
    pace.eased = true;
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
    for (const link of copy.querySelectorAll("a[href], .link_removed, .codetitle, .code")) link.remove();
    return copy.textContent.replace(/\s+/g, " ").trim();
}

/** Which kinds a post's own words match. */
function releaseKinds(text) {
    const found = [];
    for (const kind of RELEASE_KINDS) {
        if (kind.re.test(text)) found.push(kind);
    }
    return found;
}

/** One row, or null if this post is not one. */
function describeRelease(post, page) {
    const scored = describePost(post);
    const text = releaseProse(post.body);
    const kinds = releaseKinds(text);

    /* Two ways in.

       The narrow bar — enough links, release words or a version to be
       a release rather than a reply about one. It would rather miss a
       release than list a conversation.

       Or one off-site link and one recognised kind, which is the case
       that bar was dropping: a language pack, a trainer, a mod tool.
       None of those carry a version or any of the fifteen release
       words, so a post offering one scored three against a threshold
       of four and never appeared — in a panel whose job is to list
       every kind of thing posted. */
    const known = kinds.length > 0 && scored.links > 0;
    if (scored.score < 4 && !known) return null;

    /* Words alone are never enough.
     *
     * The bar is a score, and a score can be reached by vocabulary: two
     * recognised words are four points and four points is the bar. That
     * was survivable while the vocabulary was narrow, and stopped being
     * so the moment "hypervisor" joined it — "Does the hypervisor crack
     * need Core Isolation off?" is two release words, no links, no
     * version, and it scored exactly like a release. On the live Black
     * Flag topic that shape is most of the thread.
     *
     * A thing that was posted has somewhere to get it or a number on
     * it. A post with neither is a post *about* a release. */
    if (!scored.links && !scored.version && !scored.build) return null;

    return {
        id: post.id,
        page,
        author: authorName(post),
        date: postDate(post),
        version: scored.version,
        build: scored.build,
        links: scored.links,
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

/* A page of a phpBB topic is not a moving target. The board paginates
   by post index, so a reply lands on the last page and leaves every
   page before it byte-for-byte the same. That is what makes reading a
   topic a second time nearly free — as long as the assumption is
   checked rather than trusted, because a *deleted* post shifts every
   page after it back by one.

   So each page is kept with the id of the post it opens with, and a
   rescan re-reads two pages: the last one, which is where new replies
   are, and the highest page below it, whose opening post id is the
   canary. If that canary still opens with the post it opened with
   before, nothing has shifted and every page between them is still
   what it was. If it does not, the whole cache for the topic is
   dropped and the topic is read again from the start.

   Kept for fewer topics than the row index is: this holds every page
   of a topic rather than the answer. */
const RELEASE_PAGES_KEY = "topicPages";
const RELEASE_PAGES_TOPICS = 4;

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
function planWalk(topicId, info, total) {
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
    const fetch_ = [];
    for (let page = 1; page <= total; page += 1) {
        if (page === current) continue;
        if (kept && reusable(page)) reuse.push(page);
        else fetch_.push(page);
    }

    /* The canary: the highest page being reused. A post deleted
       anywhere in the topic shifts every page after it, so the page
       furthest down the topic is the one that shows it. */
    const canary = reuse.length ? reuse[reuse.length - 1] : null;
    if (canary !== null) fetch_.push(canary);
    fetch_.sort((a, b) => a - b);

    return { reuse: reuse, fetch: fetch_, known: known, canary: canary };
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

    const workers = Math.min(pace.inFlight, items.length);
    await Promise.all(Array.from({ length: workers }, run));

    /* A back-off can leave items unclaimed, because the workers that
       stood down were the ones that would have taken them. Whatever is
       left is finished at the eased pace. */
    if (next < items.length && !state.cancelled && !state.stopped) {
        await Promise.all(Array.from({ length: Math.min(pace.inFlight, items.length - next) }, run));
    }
    return results;
}

/**
 * Read the whole topic and return every release in it.
 *
 * The page in front of you is never fetched; pages this browser has
 * already read are not fetched either unless the canary says they may
 * have moved. What is left goes to the pool above, a few at a time.
 */
async function walkTopic(info, state, onProgress) {
    const total = Math.min(info.total || 1, RELEASE_MAX_PAGES);
    const current = info.current || 1;
    const plan = planWalk(PAGE.topicId, info, total);
    const pace = makePace();

    const read = new Map();
    read.set(current, readTopicPage(posts(), current));

    let done = 0;
    const say = () => onProgress(Math.min(total, done + plan.reuse.length + 1), total);
    say();

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
        return walkTopic(again, Object.assign(state, { retried: true }), onProgress);
    }

    /* Everything read this time, plus everything believed from last
       time, as one set of pages. */
    const pages = {};
    let newest = 0;
    let scanned = 0;
    for (let page = 1; page <= total; page += 1) {
        const fresh = read.get(page);
        const held = plan.known[String(page)];
        const entry = fresh || (plan.reuse.includes(page) ? held : null);
        if (!entry) continue;
        pages[String(page)] = { rows: entry.rows, first: entry.first, newest: entry.newest, count: entry.count };
        newest = Math.max(newest, entry.newest || 0);
        scanned += 1;
    }

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

    const complete = !state.cancelled && !state.stopped && scanned >= total;
    if (PAGE.topicId && complete) rememberPages(PAGE.topicId, pages, total);

    return {
        rows: dedupeReleases(found),
        done: complete,
        scanned: scanned,
        newest: newest,
        // How much of this answer came out of this browser rather than
        // off the board, which is the whole point of keeping it.
        fetched: plan.fetch.length,
        reused: plan.reuse.length,
        refused: state.stopped || null,
        // Whether the board asked for room, so the panel can say the
        // walk went slowly on purpose rather than looking stuck.
        eased: pace.eased,
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
    if (seconds < 90) return "just now";
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return minutes + " minutes ago";
    const hours = Math.round(minutes / 60);
    if (hours < 36) return hours + (hours === 1 ? " hour ago" : " hours ago");
    return Math.round(hours / 24) + " days ago";
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

/* Which rows are allowed to answer "what version is the game on".

   Not every version in a topic is the game's. Found on the live board,
   in the thirty-three page Black Flag Resynced thread: a post
   explaining how to get achievement popups says "Download v1.6.0 or
   later lightweight AchievementOverlay by Oleg Savelyev". That is the
   version of somebody else's utility, and read as the game's it beats
   1.0.7 on the second digit — so the panel's headline, the one line
   the whole thread exists to answer, said the game was on 1.6.0.

   The rule: a row may set the headline only if the finder could say
   what kind of thing it is, and only if that kind is about the game
   rather than beside it. A trainer, a cheat table and an overlay all
   carry their own version numbers and none of them is the game's;
   "cheat tables for 1.0.4" and "AchievementOverlay v1.6.0" are the
   same sentence about two different products. A crack, a repack, an
   update, clean Steam files, a DLC pack — those are versioned against
   the game, and they are what the question is about.

   Everything still appears in the list. This decides one line. */
const VERSION_EVIDENCE = new Set(["game", "run", "change", "extra", "block"]);

function saysGameVersion(row) {
    return row.kinds.some((kind) => VERSION_EVIDENCE.has(releaseFamily(kind)));
}

/** The highest version anybody posted *of the game* — the question the
    thread was opened with. Build ids are excluded: "build 24127279" is
    eight digits and beats every real version it is compared against. */
function latestVersion(rows) {
    let best = null;
    for (const row of rows) {
        if (!row.version || !saysGameVersion(row)) continue;
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
            title: "Steam build " + row.build + ", which is not a version number",
        }, [
            el("span.rr-releases__vkind", {}, ["build"]),
            row.build,
        ]);
    }
    return el("span.rr-releases__version", {
        "data-rr-kind": "none",
        title: "No version given in this post",
        "aria-label": "No version given",
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
        }, [text]));
    }
    if (!row.labels.length && row.links) {
        tags.append(el("span.rr-releases__tag", { "data-kind": "link", "data-family": "other" }, [
            row.links + (row.links === 1 ? " link" : " links"),
        ]));
    }

    /* The same date treatment the rest of the interface got: the
       weekday goes, the whole thing stays on hover. A panel that
       prints "Wednesday, 02 Sep 2026, 09:49" on every row while the
       listing two clicks away prints "02 Sep 2026" is two answers to
       one question. */
    const when = row.date || "";
    const link = el("a.rr-releases__link", { href: target, title: row.excerpt }, [
        releaseVersion(row, latest),
        tags,
        el("span.rr-releases__who", {}, [row.author]),
        el("span.rr-releases__when", { title: when }, [shortenPostMeta(when)]),
        el("span.rr-releases__page", {}, ["p." + row.page]),
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
    return el("li.rr-releases__row", { "data-kinds": row.kinds.join(" ") }, [link]);
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
        for (const [i, id] of row.kinds.entries()) present.set(id, row.labels[i]);
    }
    if (present.size < 2) return null;

    const bar = el("div.rr-releases__filters", { role: "group", "aria-label": "Filter by kind" });
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
    const panel = el("section.rr-releases", { "aria-label": "Releases in this topic" });
    const state = { cancelled: false, stopped: null, scope: "page", topic: kept };

    const count = el("span.rr-releases__count");
    const scope = el("div.rr-releases__scope", { role: "tablist", "aria-label": "How much to look at" });

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
    const pageTab = el("button.rr-releases__tab", { type: "button", role: "tab" }, ["This page"]);
    const topicLabel = "All " + total + (total === 1 ? " page" : " pages");
    const topicTab = el("button.rr-releases__tab", { type: "button", role: "tab" }, [topicLabel]);
    if (!canWalk || !multi) {
        topicTab.disabled = true;
        topicTab.setAttribute("data-rr-why", "");
        topicTab.setAttribute("title", !canWalk
            ? "Reading a whole topic is switched off in the settings"
            : "This topic is one page — you are looking at all of it");
    }
    scope.append(pageTab, topicTab);

    /* The board's own "only show me the drops" filter. It was in a
       strip along the bottom of the panel while the scope control was
       in the head, so the two things that decide what the panel is
       showing sat at opposite ends of it. They are one group now. */
    const linkFilter = buildLinkFilter(all, pageRows);
    linkFilter.classList.add("rr-releases__only");

    const body = el("div.rr-releases__body");
    panel.append(
        el("div.rr-releases__head", {}, [
            icon("layers", 14),
            el("h3", {}, ["Releases"]),
            count,
            el("div.rr-releases__controls", {}, [scope, linkFilter]),
        ]),
        body,
    );

    const setCount = (shown, filtered, rows, scoped) => {
        count.textContent = filtered
            ? shown + " of " + rows.length
            : rows.length + (rows.length === 1 ? " release" : " releases") + (scoped ? "" : " on this page");
    };

    const walk = () => {
        state.cancelled = false;
        state.stopped = null;
        topicTab.disabled = true;
        topicTab.setAttribute("aria-busy", "true");

        const finish = () => {
            topicTab.disabled = false;
            topicTab.removeAttribute("aria-busy");
            topicTab.textContent = topicLabel;
        };

        walkTopic(info, state, (at, of) => {
            topicTab.textContent = "Reading " + at + " of " + of + "…";
        }).then((result) => {
            finish();
            state.topic = {
                at: Date.now(), rows: result.rows, scanned: result.scanned,
                done: result.done, total: total,
                newest: Math.max(result.newest || 0, hereNewest),
                fetched: result.fetched, reused: result.reused,
                eased: result.eased,
            };
            if (PAGE.topicId) rememberIndex(PAGE.topicId, state.topic);
            if (result.refused) toast("The board asked for a slower pace, so the topic was only read this far");
            state.scope = "topic";
            render();
        }).catch((err) => {
            finish();
            console.warn("[RIN Reforged] topic index:", err);
            toast("Could not read the whole topic");
        });
    };

    const render = () => {
        body.textContent = "";
        pageTab.setAttribute("aria-selected", state.scope === "page" ? "true" : "false");
        topicTab.setAttribute("aria-selected", state.scope === "topic" ? "true" : "false");

        const scoped = state.scope === "topic";
        const rows = scoped ? (state.topic ? state.topic.rows : []) : pageRows;
        const latest = scoped ? latestVersion(rows) : null;

        if (scoped && state.topic) {
            const again = el("button.rr-btn", { type: "button", "data-variant": "quiet" }, [
                icon("layers", 12), "Read it again",
            ]);
            again.addEventListener("click", walk);
            /* One sentence, not three spans run together. Read by eye
               the gaps between them are the punctuation; read aloud
               they are nothing, and the line came out as
               "Latest posted: v1.10.05 pages read". */
            const said = [
                latest ? "Latest posted: version " + latest : null,
                state.topic.scanned + (state.topic.scanned === 1 ? " page" : " pages") + " read",
                state.topic.done ? null : "stopped early",
                state.topic.eased ? "the board was busy, so this was read slowly" : null,
                "read " + agoText(state.topic.at || Date.now()),
                staleBy ? staleBy + " new since" : null,
            ].filter(Boolean).join(". ");

            /* When it was read, whether it has moved on, and the
               control that acts on both — one group, at one end. They
               were at opposite ends of the card: the fact on the left,
               the button that changes it 900px away on the right. */
            body.append(el("div.rr-releases__note", { role: "status", "aria-label": said }, [
                latest ? el("span.rr-releases__latest", { "aria-hidden": "true" }, ["Latest posted: v" + latest]) : null,
                el("span.rr-spacer"),
                el("div.rr-releases__read", {}, [
                    el("span", { "aria-hidden": "true" }, [
                        state.topic.scanned + (state.topic.scanned === 1 ? " page" : " pages") + " read",
                        state.topic.done ? "" : " · stopped early",
                        " · " + agoText(state.topic.at || Date.now()),
                    ].join("")),
                    /* Why it took as long as it did. A walk that drops
                       to one request at a time because the board is
                       queueing looks exactly like a walk that has hung,
                       and the difference matters to whoever is watching
                       it. */
                    state.topic.eased
                        ? el("span.rr-releases__eased", {
                            "aria-hidden": "true",
                            title: "The board was answering slowly, so this was read one page at a time",
                        }, ["read gently"])
                        : null,
                    staleBy
                        ? el("span.rr-releases__stale", { "aria-hidden": "true" }, [
                            staleBy + (staleBy === 1 ? " newer post" : " newer posts") + " since",
                        ])
                        : null,
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
            toast("Stopped reading the topic");
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

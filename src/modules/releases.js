// "This page" reads the DOM for free; "All N pages" walks the topic once per
// click and remembers what it found (never a page load, never twice in a
// row — Escape stops it). finder.js decides what a post is; this shows it,
// with quoted text excluded there so a reply quoting a release isn't one.

// Every matching word is kept ("Repack, Update, DLC" are three true things).
// Russian forums are closed to guests, so these terms aren't grounded in
// reading the board like the English ones — only unambiguous jargon
// (таблетка/лекарство = crack, русификатор = translation) made the list,
// nothing that's also ordinary Russian.
const RELEASE_KINDS = [
    { id: "steamfiles", label: "Clean Steam files", re: /\b(?:clean\s+steam\s+files?|steam\s+files?|scs\b)|чистые\s+файлы/i },
    { id: "repack", label: "Repack", re: /\brepack(?:ed|s)?\b|\bfitgirl\b|\bdodi\b|\belamigos\b|репак/i },
    // A build you unzip and run, not a repack (nothing recompressed) — its
    // own kind, named in title lines like "HITMAN 3 [PORTABLE]".
    { id: "preinstalled", label: "Pre-installed", re: /\bpre[\s-]?installed\b|\bportable\b|предустановленн|портатив/i },
    { id: "crack", label: "Crack", re: /\bcrack(?:ed|fix|s)?\b|\bcodex\b|\bempress\b|\bskidrow\b|\bplaza\b|\btenoke\b|\brune\b|\brazor\s?1911\b|кряк|таблетк|лекарств/i },
    // Its own kind here: its own how-to threads, own requirements, and the
    // posts say so ("Black Flag Resynced HYPERVISOR"). Must stand alone —
    // "hv" is short, but nothing else on this board is spelled that way.
    { id: "hypervisor", label: "Hypervisor", re: /\bhyper[\s-]?visor\b|\bhv\b|гипервизор/i },
    // Not every Steam emulator mention — that used to include bare
    // "emulator"/"goldberg", tagging a pre-installed single-player release
    // with a swapped Steam stub as Online fix. See STEAM_EMU_RE below.
    { id: "online", label: "Online fix", re: /\bonline[\s-]?fix(?:\.me)?\b|\bmultiplayer\s+fix\b|\bco-?op\s+fix\b|\blan\s+fix\b|онлайн[\s-]*фикс/i },
    { id: "dlc", label: "DLC", re: /\bdlcs?\b|\bunlocker\b|\bcream\s?api\b|\bsmart\s?steam\b|длс|разблокировщик/i },
    // "Updated" in a release name (FLiNG trainers: "...Updated.2026.09.02")
    // is a build stamp, not an update — a date right after excludes it.
    { id: "update", label: "Update", re: /\bupdate[ds]?\b(?!\.\d{4}\b)|\bpatch(?:ed|es)?\b|\bhotfix\b|\bupgrade\b|обновлени|обнова|патч/i },
    // "Mirror" also labels a second download link ("Mirror 1", "Mirror #2")
    // rather than meaning reupload — followed by a colon/hash/number, it's
    // excluded as a link label, not prose.
    { id: "reupload", label: "Reupload", re: /\bre-?upload(?:ed|s|ing)?\b|\bmirrors?\b(?!\s*[:#=]|\s*\d)|\breup\b|перезалив|зеркало/i },
    { id: "trainer", label: "Trainer", re: /\btrainer\b|\bcheat\s+(?:tables?|engines?)\b|трейнер/i },
    // Its own word, not Trainer: a save hands over finished progress rather
    // than unlocking the game as you play.
    { id: "save", label: "Savegame", re: /\bsave\s?(?:game|file|data)s?\b|\bstarter\s+saves?\b|сохранени/i },
    { id: "language", label: "Language", re: /\blanguage\s+(?:pack|files?)\b|\blocali[sz]ation\b|\btranslation\b|русификатор|локализаци/i },
    { id: "tool", label: "Tool", re: /\btool(?:s|kit)?\b|\bmod\s+manager\b|\binstaller\b|активатор|установщик/i },
    { id: "denuvo", label: "Denuvo", re: /\bdenuvo\b|денуво/i },
];

// The stylesheet paints by family so the same word is always the same
// colour; a test fails if a kind is added without one.
//   game what you install (Clean Steam files, Repack)   run what starts it
//   change what it does to a copy   extra what it adds   beside what sits
//   next to it   block what stops it
// Kept distinct per theme — the first mapping put `run` and `block` on the
// same red, so a Crack looked like a warning.
const RELEASE_FAMILY = {
    steamfiles: "game",
    repack: "game",
    preinstalled: "game",
    crack: "run",
    hypervisor: "run",
    online: "run",
    update: "change",
    reupload: "change",
    dlc: "extra",
    language: "extra",
    trainer: "beside",
    save: "beside",
    tool: "beside",
    denuvo: "block",
};

function releaseFamily(kind) {
    return RELEASE_FAMILY[kind] || "other";
}

const RELEASE_CACHE_KEY = "topicIndex";
const RELEASE_CACHE_TOPICS = 8;

// Used to be a hard cap (80 pages, oldest dropped forever); now a pass, so a
// click reads the newest unread pages and another click reads the next lot
// — the far end of a long topic stays reachable instead of impossible.
// 30 comes from measuring the board's own burst budget live: it answers
// ~30 requests fast (120-170ms each) then drops to one page per 1.8s
// regardless of concurrency — a pass this size is the whole fast part and
// none of the slow crawl. makePace() handles a walk that starts queueing
// mid-pass; this only decides how much to take on.
const RELEASE_PASS_PAGES = 30;

// "newest" reads backward from the last page (what's it on now); "oldest"
// reads forward from page one (what was posted, in order). Persisted per
// browser like the fold state.
const RELEASE_ORDER_KEY = "releaseOrder";

function releaseOrder() {
    return store.get(RELEASE_ORDER_KEY, "newest") === "oldest" ? "oldest" : "newest";
}

function inReadingOrder(rows, order) {
    const back = order === "oldest" ? -1 : 1;
    return rows.slice().sort((a, b) =>
        back * ((b.page - a.page) || (Number(b.id) - Number(a.id))));
}

// Bounded three ways: 3 requests in flight max, never two started closer
// than RELEASE_START_GAP, and a 429/503 stops the walk rather than retrying.
// The board never actually answers 429 though — it queues silently, so the
// walk also times its own answers and drops to one slow request once
// they're several times its own best. No conditional-request path exists
// (no ETag/Last-Modified), so the only saving is the page cache below.
const RELEASE_IN_FLIGHT = 3;
const RELEASE_START_GAP = 160;        /* between request starts, ms   */
// Measured: the board hands out one slot roughly every 2s regardless of
// load, so a wider single-request gap just adds wait on top of the queue's
// own. 2 in flight with a short gap holds the same queue position instead.
const RELEASE_EASY_IN_FLIGHT = 2;
const RELEASE_EASY_GAP = 300;
// Consecutive fast answers needed to call the queue drained — recovering
// too eagerly (e.g. after 1) let a walk crawl the rest of a long topic
// without ever un-easing.
const RELEASE_RECOVER_AFTER = 4;
// How much slower than its own best counts as the board asking for room,
// and the floor below which nothing counts as a queue at all.
const RELEASE_SLOW_FACTOR = 3;
const RELEASE_SLOW_FLOOR = 1500;      /* ms                            */
const RELEASE_BACK_OFF = [429, 503];

// One of these per walk. Starts at 3 in flight, gives that up the first
// time an answer is several times slower than its own best.
function makePace() {
    return {
        inFlight: RELEASE_IN_FLIGHT,
        gap: RELEASE_START_GAP,
        best: Infinity,
        eased: false,
        // Whether it ever eased — reported even after recovering, since the
        // reader still watched it go slowly for a while.
        everEased: false,
        quick: 0,
        slowest: 0,
    };
}

function notePace(pace, ms) {
    if (!Number.isFinite(ms) || ms <= 0) return;
    pace.slowest = Math.max(pace.slowest, ms);
    if (ms < pace.best) pace.best = ms;

    if (pace.eased) {
        // Recovery bar is lower than the one that eased it, so a walk
        // can't oscillate on one borderline page.
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

// Not the link-counting text: people label links "Mirror 1", "Mirror 2",
// and reading those as prose tagged every upload as a reupload — including
// the first, which by definition isn't one.
function releaseProse(body) {
    return proseContent(ownContent(body)).replace(/\s+/g, " ").trim();
}

// Goldberg is used both ways: half the board swaps it in as the crack
// (offline), the other half uses it to restore multiplayer (online fix).
// The word alone can't tell them apart — surrounding context decides.
const STEAM_EMU_RE = /\bgoldberg\b|\bsteam[\s_-]?emu(?:lator)?\b|\bsmart\s?steam\s?emu\b|голдберг|эмулятор\s+steam/i;
// Tight on purpose (a post saying "online fix" outright is already matched
// above): bare `online`/`server` used to be in here and mistagged
// "download from other download servers" under a single-player release.
const ONLINE_INTENT_RE = /\bmultiplayer\b|\bco-?op\b|\bcoop\b|\bmatchmaking\b|\blobb(?:y|ies)\b|\blan\s+(?:play|party|game)\b|\bplay(?:ing)?\s+(?:online|with\s+friends)\b|\bonline\s+(?:play|works?|working|mode|multiplayer|co-?op)\b|мультиплеер|кооп|по\s+сети/i;

// Release names run together (EpicCrack, ACBlackFlagFix) with no `\b` in the
// middle, so a modded EpicCrack post matched no kind at all. Split only on
// the copy kinds are matched against — the row still shows the name as
// written.
function splitRunTogether(text) {
    return text.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function releaseKinds(text) {
    const said = text + " " + splitRunTogether(text);
    const emulated = STEAM_EMU_RE.test(said)
        ? (ONLINE_INTENT_RE.test(said) ? "online" : "crack")
        : null;
    const found = [];
    for (const kind of RELEASE_KINDS) {
        if (kind.re.test(said) || kind.id === emulated) found.push(kind);
    }
    return found;
}

function describeRelease(post, page) {
    const scored = describePost(post);
    const text = releaseProse(post.body);
    const kinds = releaseKinds(text);

    // A release is a thing you can get (file host, login-walled link,
    // magnet, torrent, attachment). Replaces three rules that each tried a
    // different angle and still let through every question with a version
    // in it — "Is there any way to upgrade from v3.140 to v3.170.1?" has a
    // version and two release words but no file behind it.
    if (!scored.offers) return null;

    // A question or a failure report with a link/version/words still isn't
    // offered — unless the post also hands something over (attachment,
    // password, size, label, name), which a release is allowed to do while
    // opening with a question or a "doesn't work" note. A reply is held to
    // more: naming a file or size while answering somebody ("@Cybah: you
    // mentioned the TGBLR mod...") isn't itself an offer unless it carries
    // the thing or says it's the one publishing.
    if ((scored.asking || scored.failed) && !scored.password && !scored.handing) return null;
    if (scored.replying && !scored.password && !scored.attached && !scored.publishing) return null;

    // The commonest shape on a busy thread that the rule above misses:
    // someone explaining at length and linking to where the thing already
    // lives (an official tool, an older mirror, a Nexus mod). See
    // soundsLikeAdvice(). Exemptions are narrower here — `handing` doesn't
    // count, since half these posts name a file/size while explaining —
    // only a password, an attachment, or saying it's the one publishing.
    if (scored.advising && !scored.publishing && !scored.password && !scored.attached) return null;

    // An offer naming neither a kind nor a version is, in practice, mostly
    // conversation (a hosting tip, a thank-you). The score check below is
    // the older fallback for posts using none of the release words.
    if (!kinds.length && !scored.version && !scored.build) return null;
    if (scored.score < 4 && !kinds.length) return null;

    // A version alone still isn't enough when nothing says what kind of
    // thing it is — that's also the shape of an aside confirming a hash
    // ("they match SteamDB's file hashes for Hitman v3.270.1"). Without a
    // kind, the post must otherwise say it's handing something over.
    if (!kinds.length && !scored.handing && !scored.attached
        && !scored.password && !scored.publishing) return null;

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

// Catches the same person reposting a mirror of their own upload several
// times, which reads as one release to a person but three identical lines
// to a list (quote-exclusion already stops a reply inheriting one).
function dedupeReleases(rows) {
    const seen = new Set();
    return rows.filter((row) => {
        const key = [row.author, row.version || row.build || "", row.kinds.join("+"), row.links].join("|");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// phpBB hands out post ids in order, so the highest one is the newest.
function newestPostId(list) {
    let best = 0;
    for (const post of list) {
        const id = Number(post.id);
        if (Number.isFinite(id) && id > best) best = id;
    }
    return best;
}

function releasesOnThisPage(page) {
    return dedupeReleases(
        posts()
            .map((post) => describeRelease(post, page))
            .filter(Boolean)
            .reverse());
}

// The parsed copy is only ever read, never inserted — parseDocument()
// survives Trusted Types on that basis; where even it can't, this throws
// and the walk reports the lost page instead of dying inside a click handler.
async function fetchTopicPage(href, page) {
    const response = await fetch(href, { credentials: "same-origin" });
    if (!response.ok) {
        const err = new Error("page " + page + " returned " + response.status);
        err.status = response.status;
        throw err;
    }

    // The whole page is parsed rather than a slice cut out of it: measured
    // at 2.4ms full vs 1.5ms for just the posts block, against 417ms of
    // network per page — not a trade worth the fragility of a markup cut.
    const doc = parseDocument(await response.text());
    if (!doc) throw new Error("page " + page + " could not be parsed");
    return readTopicPage(posts(doc), page);
}

function readTopicPage(found, page) {
    const ids = found.map((post) => Number(post.id)).filter(Number.isFinite);
    return {
        page,
        rows: found.map((post) => describeRelease(post, page)).filter(Boolean),
        // Every post, not just releases — a page of pure chatter still
        // means the topic moved on.
        newest: ids.length ? Math.max.apply(null, ids) : 0,
        // Tells "gained replies" from "posts deleted, everything shifted a
        // page" on a later visit.
        first: ids.length ? Math.min.apply(null, ids) : 0,
        count: found.length,
    };
}

// phpBB paginates by post index, so a reply only changes the last page —
// reading a topic twice is nearly free, except a *deleted* post shifts
// every page after it. So each page is kept with the id it opens on; a
// rescan re-reads the last page (new replies) and the highest page below it
// as a canary — if its opening post hasn't changed, nothing moved.
// 4 topics kept was leaving a reader who checks five threads paying for the
// first one twice; raised to 8 after measuring the board's real cost: it
// queues rather than 429s, answering ~165ms/page at 3 in flight but only
// ~1.8s/page once its burst budget runs out regardless of concurrency — so
// there's no concurrency to win, only fewer requests, hence this cache. A
// whole topic's pages are a few tens of KB, well within either backing store.
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

// Returns the pages to fetch in reading order, plus the canary whose answer
// decides whether the kept pages may still be believed.
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

    // The furthest-down reused page shows a deleted post's shift soonest.
    const canary = reuse.length ? reuse[reuse.length - 1] : null;
    if (canary !== null && !want.includes(canary)) want.push(canary);

    // Newest first by default — "which version is it on now" is answered at
    // the end of the topic, and reading forward would arrive there last (a
    // quarter hour late on a 429-page topic). Oldest first is the other real
    // question and a user choice, not a rule. Either way page 1 goes first:
    // it's the thread's index (current links live there) and costs one
    // request either way.
    want.sort(order === "oldest" ? (a, b) => a - b : (a, b) => b - a);
    const first = want.indexOf(1);
    if (first > 0) {
        want.splice(first, 1);
        want.unshift(1);
    }

    // One pass, not the whole topic — leftovers are offered, see
    // RELEASE_PASS_PAGES.
    let deferred = 0;
    if (want.length > depth) {
        const keep = want.slice(0, depth);
        if (canary !== null && !keep.includes(canary)) keep.push(canary);
        deferred = want.length - keep.length;
        want = keep;
    }

    return { reuse: reuse, fetch: want, known: known, canary: canary, deferred: deferred };
}

// At most pace.inFlight at once, never two started closer than pace.gap.
// The next slot is reserved before waiting, not measured after, so workers
// can't each independently decide it's their turn.
async function pacedPool(items, worker, state, pace) {
    const results = new Array(items.length);
    let next = 0;
    let slot = 0;
    let running = 0;

    const run = async () => {
        while (next < items.length && !state.cancelled && !state.stopped) {
            // A mid-walk back-off has to stand down already-running workers
            // too, not just ones not yet started.
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

    // A back-off or a recovery (raising the ceiling) both leave items
    // unclaimed; each loop turn re-launches workers at whatever the pace is
    // by then and claims at least one item, since nothing stands down while
    // none is running.
    while (next < items.length && !state.cancelled && !state.stopped) {
        const workers = Math.min(pace.inFlight, items.length - next);
        await Promise.all(Array.from({ length: workers }, run));
    }
    return results;
}

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

// The current page is never fetched, nor is anything already cached unless
// the canary says it moved. `onRows` fires on every page landed, not just at
// the end — a walk is minutes of work, and starting from the newest page
// means the first row appears on the first answer.
async function walkTopic(info, state, onProgress, onRows) {
    const total = info.total || 1;
    const current = info.current || 1;
    const plan = planWalk(PAGE.topicId, info, total, RELEASE_PASS_PAGES, state.order);
    const pace = makePace();
    const reused = new Set(plan.reuse);

    const read = new Map();
    read.set(current, readTopicPage(posts(), current));

    // Everything held right now: read this time, or believed from last.
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
            // Stop rather than retry into a "not so fast" from the board.
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

    // The canary was already fetched with everything else; if its opening
    // post changed, something above it was deleted and every page between
    // is off by one — drop the cache and read the topic again from scratch.
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

    // Kept even on a partial walk — used to only save on completion, so a
    // walk stopped by Escape/503/pass-end kept nothing. Safe because the
    // canary already guards against a stale set; `scanned > 1` excludes
    // the always-present current page from counting as a save-worthy read.
    if (PAGE.topicId && scanned > 1) rememberPages(PAGE.topicId, pages, total);

    return {
        rows: rowsFromPages(pages, total),
        done: complete,
        scanned: scanned,
        pending: pending,
        newest: newest,
        // How much of this answer came from the cache rather than the
        // board — the whole point of keeping it.
        fetched: plan.fetch.length,
        reused: plan.reuse.length,
        refused: state.stopped || null,
        eased: pace.everEased,
    };
}

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

function agoText(at) {
    const seconds = Math.max(0, Math.round((Date.now() - at) / 1000));
    if (seconds < 90) return t("just now");
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return t("{n} minutes ago", { n: minutes });
    const hours = Math.round(minutes / 60);
    if (hours < 36) return hours === 1 ? t("1 hour ago") : t("{n} hours ago", { n: hours });
    return t("{n} days ago", { n: Math.round(hours / 24) });
}

function pagesReadText(n) {
    return n === 1 ? t("1 page read") : t("{n} pages read", { n });
}

// Compared as numbers per part (1.10 after 1.9), except a 2-digit part with
// a leading zero (1.06) is split into two — the board writes the same
// release as both "1.0.6" and "1.06", and reading "1.06" as one number beat
// 1.0.7 on the second digit, announcing 1.06 as newest when 1.0.7 existed.
// 1.10 has no leading zero and stays ten. Comparison only — the row still
// shows what was written.
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

// Not every version in a topic is the game's — "v1.6.0 or later
// AchievementOverlay" once beat 1.0.7 on the second digit and got announced
// as the game's version. Only rows whose kind is about the game (not
// beside it, like a trainer/cheat table/overlay) can set the headline.
const VERSION_EVIDENCE = new Set(["game", "run", "change", "extra", "block"]);

function saysGameVersion(row) {
    return row.kinds.some((kind) => VERSION_EVIDENCE.has(releaseFamily(kind)));
}

// Build ids are excluded (an 8-digit "build 24127279" beats every real
// version). VERSION_CROWD guards against one typo setting the headline: off
// the live board, "V270.1" (a dropped "3." from 3.270.1) beat everything on
// the first digit. Told apart from a real release by company — a first
// part used by only one row can't set the headline while another is used
// by several — but only once some first part has 3+ rows (an established
// thread), so a genuinely new major version isn't held back forever.
const VERSION_CROWD = 3;

// Black Flag's 1.0.x releases (17 rows) share a first part with a stray
// "v1.6.0" overlay recommendation that beats them on the second digit —
// invisible if only the first part is compared. So the crowd check runs
// twice: on the first part (throws out Peacock's 6.x/8.x in a 3.x topic)
// and the first two (throws out 1.6 in a 1.0 topic), both held to
// VERSION_CROWD so a small topic or a new major line is left alone.
function versionLine(version, parts) {
    return versionRank(version).slice(0, parts).join(".");
}

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

// How many of the newest rows must agree before a line nobody else is on
// becomes the answer — a move from 1.x to 2.0 is alone on its line by
// definition, so holding it back forever would be worse than the noise
// this guards against.
const VERSION_RECENT = 3;

function latestVersion(rows) {
    const candidates = rows.filter((row) =>
        // A bare/companion-product number is shown on its row but isn't
        // evidence about the game; see versionsIn().
        row.version && row.versionNamed !== false && !row.versionTheirs && saysGameVersion(row));
    if (!candidates.length) return null;

    // The thread's overall line, or the newest posts' line if enough agree
    // — letting a new major version through without waiting to outnumber
    // the old one.
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

    // Same question one digit down, but only when the minor line holds most
    // of the rows on its major — Black Flag's 22 releases are all on 1.0
    // with one outlier on 1.6, but HITMAN 3 moves its minor every release
    // (3.11, 3.20, ... 3.260) and each is alone on its line; without the
    // majority test that second shape lost every version past 3.120.
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

// A version, a build id and nothing at all used to read as three variations
// of the same thing (v3.10.5, an unlabelled em dash, #24833802, same
// weight, same column). Now each says what it is: a build is labelled
// `build` so it's never mistaken for a bigger version, and nothing is an
// empty state rather than bare punctuation.
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

    // On the current page, scrolls and flashes the post; otherwise it's an
    // ordinary link, middle-click and all.
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

// Only kinds actually present (not 11 chips where 9 match nothing) and only
// ones that narrow something — a single release tagged Crack/Hypervisor/
// DLC/Update once drew four chips above the one row they all matched, since
// a kind on every row (or a list of one) selects nothing.
function releaseFilters(rows, list, onCount) {
    const present = new Map();
    const matching = new Map();
    for (const row of rows) {
        // Rows, not mentions: a row that names a kind twice still only
        // counts once against "does this chip select the whole list".
        const seen = new Set();
        for (const [i, id] of row.kinds.entries()) {
            present.set(id, t(row.labels[i]));
            if (seen.has(id)) continue;
            seen.add(id);
            matching.set(id, (matching.get(id) || 0) + 1);
        }
    }
    for (const [id, count] of matching) {
        if (count >= rows.length) present.delete(id);
    }
    if (rows.length < 2 || present.size < 2) return null;

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
        // Same colour as the matching tag below — grey chips over coloured
        // tags would read as two vocabularies. Held back unpressed, filled
        // in pressed.
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

    // No panel at all for a one-page topic with nothing to show — a card
    // saying "nothing here reads as a release" is noise. A multi-page topic
    // is different: the panel is the only way to read the rest of it, and
    // chatter on this page says nothing about page three.
    if (!pageRows.length && !kept && !(canWalk && multi)) return;

    // Page count changing used to be the only staleness signal, so a topic
    // that gained replies without gaining a page showed a stale index with
    // no hint. phpBB hands out post ids in order, so any post here past the
    // walk's highest seen id proves there are newer ones — a floor, not an
    // exact count, hence "at least".
    const hereNewest = newestPostId(all);
    const staleBy = kept && kept.newest
        ? all.filter((post) => Number(post.id) > kept.newest).length
        : 0;

    // Rebuilt on scope change rather than kept as two copies — a hidden
    // second list with its own rows/filters/counts is a second thing to
    // keep in step.
    const panel = el("section.rr-releases", { "aria-label": t("Releases in this topic") });
    const state = { cancelled: false, stopped: null, scope: "page", topic: kept, order: releaseOrder() };

    const count = el("span.rr-releases__count");
    const scope = el("div.rr-releases__scope", { role: "tablist", "aria-label": t("How much to look at") });

    // Both tabs always drawn — a single segment of a segmented control
    // reads as a label with a box around it, not a control. On a one-page
    // topic the second is disabled and says why, rather than not existing.
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

    // Beside the scope control since it qualifies it ("All 429 pages,
    // newest first" is one sentence). Only drawn where it decides
    // something — not on a one-page topic or with the walk switched off.
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

    // Used to sit in a strip at the bottom while the scope control was in
    // the head — the two things that decide what's shown are one group now.
    const linkFilter = buildLinkFilter(all, pageRows);
    linkFilter.classList.add("rr-releases__only");

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

    // Folded, the panel is one line saying how many releases there are —
    // for a topic read for the conversation, the unfolded card between the
    // bar and the first post says nothing the reader came for. Remembered
    // per browser, for every topic.
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

    // Repainted as pages land, throttled to 3/sec so 60 pages isn't 60 full
    // repaints. A full render() redraws filter chips too, so a chip pressed
    // mid-walk comes back unpressed on the next page — a fair trade for not
    // keeping two list-drawing paths in sync.
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
        // Direction is locked mid-walk — changing it would only affect the
        // list, which would read as the walk turning round.
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
        // Both scopes read in the panel's chosen direction, so the control
        // means one thing, not two.
        const rows = inReadingOrder(scoped ? (state.topic ? state.topic.rows : []) : pageRows, state.order);
        const latest = scoped ? latestVersion(rows) : null;

        if (scoped && state.topic) {
            const live = Boolean(state.topic.live);
            const pending = state.topic.pending || 0;

            const again = el("button.rr-btn", { type: "button", "data-variant": "quiet", disabled: live || null }, [
                icon("layers", 12), t("Read it again"),
            ]);
            again.addEventListener("click", walk);

            // Offered rather than dropped — used to just say "the oldest
            // 348 pages were not read" in small text and stop there.
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
            // One sentence, not three spans run together — read aloud those
            // came out as "Latest posted: v1.10.05 pages read".
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

            // One group now — used to be opposite ends of the card, the
            // fact on the left and the button that changes it 900px away.
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
                    // Distinguishes an eased-off walk from one that hung.
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

    // Stops a walk in progress rather than leaving it running.
    on(document, "keydown", (event) => {
        if (event.key === "Escape" && topicTab.disabled && topicTab.hasAttribute("aria-busy")) {
            state.cancelled = true;
            toast(t("Stopped reading the topic"));
        }
    });

    // An earlier index reopens on the whole topic (what was last asked
    // for); one from before the topic gained pages is dropped instead.
    if (kept && kept.total === total) state.scope = "topic";
    else if (kept) state.topic = null;
    render();

    const anchor = document.querySelector("#pagecontent") || document.querySelector("#wrapcentre");
    if (anchor) anchor.prepend(panel);
}

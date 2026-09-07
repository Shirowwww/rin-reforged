/* ------------------------------------------------------------------
   Steam preview on hover.

   The cheap half is free: the game card already reads an AppID out of
   the first post of every game topic, and it is written down against
   the topic id, so a topic you have opened previews from this browser
   with nothing asked of anyone.

   The expensive half — asking Steam about a game this browser has not
   seen — is the one thing in the script that leaves the page you are
   on, so it is off by default, has its own switch on top, and is
   refused outright on the Tor mirror whatever the setting says.
   ------------------------------------------------------------------ */

const STEAM_APPS_KEY = "steamApps";       /* topic id -> AppID          */
const STEAM_DATA_KEY = "steamData";       /* AppID    -> { at, game }   */
const STEAM_MISS_KEY = "steamMisses";     /* title    -> { at, id }     */

const STEAM_HOVER_DELAY = 320;
const STEAM_HIDE_DELAY = 180;

/**
 * Why a lookup will not happen, or null if it can.
 *
 * Four different situations used to arrive at the card as the same
 * sentence — "Steam has nothing under that name" — including the one
 * where nothing was ever asked. Running this against the live board
 * for the first time is what showed it: the board's CSP is
 * `connect-src 'self'`, so without GM_xmlhttpRequest the request is
 * refused by the browser before it leaves, the promise rejects, and a
 * reader is told the game does not exist. Every game. Forever. With
 * nothing anywhere saying which of the four it was.
 */
function steamBlockedBecause() {
    if (!settings.get("steamLookup")) return "off";
    if (/\.onion$/i.test(location.hostname)) return "tor";
    // The board sends connect-src 'self'. GM_xmlhttpRequest is the
    // manager making the request instead of the page, and is not
    // subject to it; fetch is, everywhere except the test harness.
    if (typeof GM_xmlhttpRequest !== "function") return "nogrant";
    return null;
}

/* ---- The cache ---------------------------------------------------- */

function steamRememberApp(topicId, appId) {
    if (!topicId || !appId) return;
    const map = store.get(STEAM_APPS_KEY, {});
    if (map[topicId] === String(appId)) return;
    map[String(topicId)] = String(appId);
    store.set(STEAM_APPS_KEY, map);
}

function steamAppForTopic(topicId) {
    return store.get(STEAM_APPS_KEY, {})[String(topicId)] || null;
}

/* A month. It was a setting; a looked-up game's tags and score do not
   change at a rate anybody needs to tune for. */
const STEAM_CACHE_DAYS = 30;

function steamCacheMs() {
    return STEAM_CACHE_DAYS * 86400000;
}

function steamCached(appId) {
    const entry = store.get(STEAM_DATA_KEY, {})[String(appId)];
    if (!entry || !entry.game) return null;
    if (Date.now() - (entry.at || 0) > steamCacheMs()) return null;
    return entry.game;
}

function steamRemember(appId, game) {
    const all = store.get(STEAM_DATA_KEY, {});
    all[String(appId)] = { at: Date.now(), game };
    // Bounded, oldest first: this is a convenience cache, not an
    // archive, and a reader who hovers a lot should not fill their
    // extension storage with store copy.
    const keys = Object.keys(all);
    if (keys.length > 300) {
        keys.sort((a, b) => (all[a].at || 0) - (all[b].at || 0));
        for (const key of keys.slice(0, keys.length - 300)) delete all[key];
    }
    store.set(STEAM_DATA_KEY, all);
}

/* ---- Talking to Steam --------------------------------------------- */

/* The board's CSP sets connect-src 'self', so fetch() and XHR from the
   page are refused before they leave — silently, from the page's point
   of view, as a rejected promise indistinguishable from "no such
   game". GM_xmlhttpRequest is the manager making the request instead
   of the page and is not subject to that, so it is the only route that
   works here; steamBlockedBecause() refuses to start a lookup without
   it rather than letting one fail in a way nobody can read.

   fetch stays underneath for a manager that hands the grant over some
   other way, and for anywhere this runs without a CSP. */
function steamGet(url) {
    if (typeof GM_xmlhttpRequest === "function") {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url,
                timeout: 8000,
                headers: { Accept: "application/json" },
                onload: (res) => {
                    if (res.status < 200 || res.status >= 300) { reject(new Error("HTTP " + res.status)); return; }
                    try { resolve(JSON.parse(res.responseText)); }
                    catch (err) { reject(err); }
                },
                onerror: () => reject(new Error("network")),
                ontimeout: () => reject(new Error("timeout")),
            });
        });
    }
    return fetch(url, { credentials: "omit", referrerPolicy: "no-referrer" })
        .then((res) => { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); });
}

/* One request at a time, spaced out. A listing has 108 titles on it
   and a reader dragging the pointer down the page must not turn into a
   hundred requests.

   The queue holds one *request*, deliberately, and not the operation
   around it. Looking a game up by name is two requests — find the id,
   then fetch the details — and an earlier version put that whole pair
   in the queue as one job. The second request then joined the queue
   behind a job that could not finish until the second request had
   finished: a lookup by name never came back, and the card sat on
   "Looking this one up" forever. Queue the leaves, compose above them. */
let steamChain = Promise.resolve();
const steamInFlight = new Map();

function steamFetch(key, url) {
    if (steamInFlight.has(key)) return steamInFlight.get(key);
    const job = steamChain
        .then(() => new Promise((resolve) => setTimeout(resolve, 220)))
        .then(() => steamGet(url));
    steamChain = job.catch(() => {});
    const tracked = job.finally(() => steamInFlight.delete(key));
    steamInFlight.set(key, tracked);
    return tracked;
}

/** What the store returns, cut down to what the card shows. */
function steamShape(appId, data) {
    return {
        appId: String(appId),
        name: data.name || "",
        header: data.header_image || null,
        released: data.release_date && data.release_date.coming_soon
            ? "Coming soon"
            : (data.release_date && data.release_date.date) || null,
        score: data.metacritic && data.metacritic.score ? String(data.metacritic.score) : null,
        tags: (data.genres || []).map((g) => g.description).slice(0, 5),
        blurb: (data.short_description || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 260),
        free: Boolean(data.is_free),
        kind: data.type || "game",
    };
}

/* Every lookup answers { game, why }: the game when there is one, and
   otherwise which of the four reasons there is not. */
const steamNone = (why) => ({ game: null, why });

function steamDetails(appId) {
    const cached = steamCached(appId);
    if (cached) return Promise.resolve({ game: cached, why: "cache" });

    const blocked = steamBlockedBecause();
    if (blocked) return Promise.resolve(steamNone(blocked));

    return steamFetch("app:" + appId,
        "https://store.steampowered.com/api/appdetails?appids=" + encodeURIComponent(appId) + "&l=english")
        .then((payload) => {
            const entry = payload && payload[String(appId)];
            if (!entry || !entry.success || !entry.data) return steamNone("miss");
            const game = steamShape(appId, entry.data);
            steamRemember(appId, game);
            return { game, why: "fetched" };
        })
        .catch((err) => {
            console.warn("[RIN Reforged] Steam lookup failed:", err);
            return steamNone("failed");
        });
}

/**
 * A topic title, reduced to something the store can be asked about.
 *
 * Titles here read "[Release] Elden Ring (v1.16 + 5 DLCs + Multiplayer)
 * [Repack]". The prefix, the bracketed tails and the version are the
 * board's own bookkeeping, not the game's name.
 */
function steamSearchTerm(title) {
    let name = splitPrefix(title).rest;
    name = name.replace(/[[(][^\])]*[\])]/g, " ");
    name = name.replace(/\bv?\d+(?:\.\d+){1,3}[a-z]?\b/gi, " ");
    name = name.replace(/\b(build|update|repack|goldberg|denuvo|dlc|multi\d*|steam files?)\b/gi, " ");
    name = name.replace(/[-–—:|]+\s*$/, " ");
    return name.replace(/\s+/g, " ").trim();
}

function steamResolveByName(title) {
    const term = steamSearchTerm(title);
    if (term.length < 2) return Promise.resolve(null);

    const misses = store.get(STEAM_MISS_KEY, {});
    const seen = misses[term.toLowerCase()];
    if (seen && Date.now() - seen.at < steamCacheMs()) {
        return seen.id ? steamDetails(seen.id) : Promise.resolve(steamNone("miss"));
    }

    const blocked = steamBlockedBecause();
    if (blocked) return Promise.resolve(steamNone(blocked));

    return steamFetch("term:" + term.toLowerCase(),
        "https://store.steampowered.com/api/storesearch/?term=" + encodeURIComponent(term) + "&l=english&cc=us")
        .then((payload) => {
            const hit = payload && Array.isArray(payload.items) ? payload.items[0] : null;
            // A miss is written down as firmly as a hit. Without that,
            // every hover over a topic Steam has never heard of — every
            // pinned announcement on the board — is another request.
            const all = store.get(STEAM_MISS_KEY, {});
            all[term.toLowerCase()] = { at: Date.now(), id: hit ? String(hit.id) : null };
            store.set(STEAM_MISS_KEY, all);
            return hit ? steamDetails(hit.id) : steamNone("miss");
        })
        .catch((err) => {
            console.warn("[RIN Reforged] Steam search failed:", err);
            return steamNone("failed");
        });
}

/** Everything the card needs for one topic row, cache first. */
function steamLookForTopic(topicId, title) {
    const known = topicId && steamAppForTopic(topicId);
    if (known) return steamDetails(known);
    return steamResolveByName(title).then((result) => {
        if (result.game && topicId) steamRememberApp(topicId, result.game.appId);
        return result;
    });
}

/** What to put on the card when there is no game to put on it. */
const STEAM_EXCUSES = {
    off: "Not in this browser's cache. Turn on Steam lookups in settings, or open the topic once.",
    tor: "Not looked up over Tor. Open the topic once and it will be cached.",
    nogrant: "Could not reach Steam: the forum only allows the page to talk to itself, and your userscript manager has not granted GM_xmlhttpRequest. Everything already cached still works.",
    failed: "Could not reach Steam just now.",
    miss: "Steam has nothing under that name.",
};

/* ---- The card ----------------------------------------------------- */

/* The board's own tooltip on a topic title.
 *
 * Every `a.topictitle` on this board carries `title="Posted: Wednesday,
 * 15 May 2013, 16:42"`, so resting on one with the preview switched on
 * drew two things at once: the browser's tooltip and this card, side by
 * side, saying different things about the same topic. The date is worth
 * keeping — it is the one fact the store cannot supply — so it moves on
 * to the card and the attribute goes.
 *
 * The weekday goes with it. "Wednesday" is four times the width of the
 * date it qualifies and nobody reads a 2013 thread by the day of the
 * week it opened on. */
const POSTED_RE = /^\s*(?:Posted|Добавлено)\s*:\s*/i;

function postedOn(link) {
    const said = link.getAttribute("title") || "";
    if (!POSTED_RE.test(said)) return null;
    return said.replace(POSTED_RE, "").replace(/^[^,]+,\s*/, "").trim() || null;
}

function steamCard(game, term, posted) {
    /* Not role=tooltip: a tooltip is text, and this holds the Store and
       SteamDB links. A group named after the game says what it is. */
    const card = el("div.rr-steam", { role: "group", "aria-label": game.name || "Steam" });

    if (game.header) {
        card.append(el("img.rr-steam__art", {
            src: game.header, alt: "", loading: "lazy", referrerpolicy: "no-referrer",
        }));
    }

    const head = el("div.rr-steam__head", {}, [
        el("span.rr-steam__name", {}, [game.name || term]),
    ]);
    if (game.score) {
        // Sorted into three bands rather than shown as a bare number,
        // which is the only part of a Metacritic score anyone reads.
        const band = Number(game.score) >= 75 ? "good" : Number(game.score) >= 50 ? "mixed" : "poor";
        head.append(el("span.rr-steam__score", { "data-band": band, title: "Metacritic" }, [game.score]));
    }
    card.append(head);

    const facts = [];
    if (game.released) facts.push(game.released);
    if (game.kind && game.kind !== "game") facts.push(game.kind.toUpperCase());
    if (game.free) facts.push("Free to play");
    facts.push("AppID " + game.appId);
    card.append(el("div.rr-steam__facts", {}, [facts.join(" · ")]));

    if (game.tags.length) {
        const tags = el("div.rr-steam__tags");
        for (const tag of game.tags) tags.append(el("span.rr-steam__tag", {}, [tag]));
        card.append(tags);
    }

    if (game.blurb) card.append(el("p.rr-steam__blurb", {}, [game.blurb]));

    if (posted) card.append(el("div.rr-steam__posted", {}, [t("Topic opened {when}", { when: posted })]));

    card.append(el("div.rr-steam__links", {}, [
        el("a.rr-btn", {
            href: "https://store.steampowered.com/app/" + game.appId + "/",
            target: "_blank", rel: "noopener noreferrer", "data-variant": "quiet",
        }, ["Store", icon("external", 11)]),
        el("a.rr-btn", {
            href: "https://steamdb.info/app/" + game.appId + "/",
            target: "_blank", rel: "noopener noreferrer", "data-variant": "quiet",
        }, ["SteamDB", icon("external", 11)]),
    ]));

    return card;
}

function steamPlaceholder(text, posted) {
    return el("div.rr-steam.rr-steam--quiet", { role: "tooltip" }, [
        posted ? el("div.rr-steam__posted", {}, [t("Topic opened {when}", { when: posted })]) : null,
        el("div.rr-steam__facts", {}, [text]),
    ]);
}

/* ---- The hover behaviour ------------------------------------------ */

let steamPopover = null;
let steamShowTimer = 0;
let steamHideTimer = 0;
let steamAnchor = null;

function steamHide() {
    clearTimeout(steamShowTimer);
    clearTimeout(steamHideTimer);
    if (steamPopover) { steamPopover.remove(); steamPopover = null; }
    steamAnchor = null;
}

/** Put the card beside its link, flipped away from whichever edge it
    would otherwise run off. */
function steamPlace(node, link) {
    const box = link.getBoundingClientRect();
    const width = node.offsetWidth;
    const height = node.offsetHeight;
    const margin = 10;

    let left = box.left + window.scrollX;
    if (left + width > window.scrollX + document.documentElement.clientWidth - margin) {
        left = window.scrollX + document.documentElement.clientWidth - width - margin;
    }
    left = Math.max(window.scrollX + margin, left);

    let top = box.bottom + window.scrollY + 8;
    if (box.bottom + height + 18 > document.documentElement.clientHeight) {
        top = box.top + window.scrollY - height - 8;
    }
    top = Math.max(window.scrollY + margin, top);

    node.style.left = left + "px";
    node.style.top = top + "px";
}

function steamShow(link, entry) {
    if (steamAnchor === link) return;
    steamHide();
    steamAnchor = link;

    const shell = el("div.rr-steam-pop");
    shell.append(steamPlaceholder("Looking this one up…", entry.posted));
    document.body.append(shell);
    steamPopover = shell;
    steamPlace(shell, link);

    // A card the pointer can reach, so its Store and SteamDB links are
    // clickable rather than vanishing on the way there.
    shell.addEventListener("mouseenter", () => clearTimeout(steamHideTimer));
    shell.addEventListener("mouseleave", () => { steamHideTimer = setTimeout(steamHide, STEAM_HIDE_DELAY); });

    steamLookForTopic(entry.id, entry.title).then((result) => {
        if (steamPopover !== shell || !document.contains(shell)) return;
        shell.textContent = "";
        if (result.game) shell.append(steamCard(result.game, steamSearchTerm(entry.title), entry.posted));
        else shell.append(steamPlaceholder(STEAM_EXCUSES[result.why] || STEAM_EXCUSES.miss, entry.posted));
        steamPlace(shell, link);
    });
}

/**
 * One listener on the listing rather than one per row.
 *
 * A forum page carries 108 topic titles, and pointerover on the table
 * costs one handler instead of 216.
 */
function initSteamPreview() {
    if (!settings.get("steamPreview")) return;
    if (!PAGE.isForum && !PAGE.isIndex && !PAGE.isSearch) return;

    const byLink = new Map();
    for (const entry of topicRows()) {
        /* Only where a card will actually be drawn, and only once the
           preview is on: with it off the board's tooltip is the only
           thing saying when a topic opened, and it stays. */
        entry.posted = postedOn(entry.link);
        if (entry.posted) entry.link.removeAttribute("title");
        byLink.set(entry.link, entry);
    }
    if (!byLink.size) return;

    const armed = (event) => {
        const link = event.target.closest && event.target.closest("a.topictitle");
        const entry = link && byLink.get(link);
        if (!entry) return null;
        // The script's own dialogs own the screen while they are open.
        if (document.querySelector(".rr-palette, .rr-panel, .rr-sheet, .rr-lightbox")) return null;
        return { link, entry };
    };

    document.addEventListener("pointerover", (event) => {
        const hit = armed(event);
        if (!hit) return;
        clearTimeout(steamHideTimer);
        clearTimeout(steamShowTimer);
        steamShowTimer = setTimeout(() => steamShow(hit.link, hit.entry), STEAM_HOVER_DELAY);
    });

    document.addEventListener("pointerout", (event) => {
        if (!event.target.closest || !event.target.closest("a.topictitle")) return;
        clearTimeout(steamShowTimer);
        steamHideTimer = setTimeout(steamHide, STEAM_HIDE_DELAY);
    });

    // The same thing from the keyboard: a title reached by Tab shows
    // its card, and Escape puts it away.
    document.addEventListener("focusin", (event) => {
        const hit = armed(event);
        if (!hit) { if (steamPopover && !steamPopover.contains(event.target)) steamHide(); return; }
        steamShow(hit.link, hit.entry);
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && steamPopover) steamHide();
    });
    on(window, "scroll", () => { if (steamPopover && steamAnchor) steamPlace(steamPopover, steamAnchor); }, { passive: true });
}

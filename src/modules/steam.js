/* Steam preview on hover. The cheap half reads an AppID already found
   on the game card and is free. The expensive half asks Steam about a
   game this browser hasn't seen; it leaves the page, so it's off by
   default and refused outright on the Tor mirror. */

const STEAM_APPS_KEY = "steamApps";       /* topic id -> AppID          */
const STEAM_DATA_KEY = "steamData";       /* AppID    -> { at, game }   */
const STEAM_MISS_KEY = "steamMisses";     /* title    -> { at, id }     */

const STEAM_HOVER_DELAY = 320;
const STEAM_HIDE_DELAY = 180;

/** Why a lookup will not happen, or null if it can. Distinguishing the
 * reasons matters: without GM_xmlhttpRequest the CSP (connect-src
 * 'self') silently rejected every request, so every game read as
 * "Steam has nothing under that name" with no way to tell which case. */
function steamBlockedBecause() {
    if (!settings.get("steamLookup")) return "off";
    if (/\.onion$/i.test(location.hostname)) return "tor";
    // connect-src 'self' exempts GM_xmlhttpRequest but not fetch (except in the test harness).
    if (typeof GM_xmlhttpRequest !== "function") return "nogrant";
    return null;
}

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

/* A month: a game's tags and score don't change at a rate worth tuning for. */
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
    // Bounded, oldest first: a convenience cache, not an archive.
    const keys = Object.keys(all);
    if (keys.length > 300) {
        keys.sort((a, b) => (all[a].at || 0) - (all[b].at || 0));
        for (const key of keys.slice(0, keys.length - 300)) delete all[key];
    }
    store.set(STEAM_DATA_KEY, all);
}

/* CSP blocks fetch/XHR from the page (connect-src 'self'); GM_xmlhttpRequest
   is exempt, so it's the primary route here. fetch stays as a fallback for
   a manager that grants access another way, or a CSP-free context. */
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

/* One request at a time, spaced out, so dragging the pointer down a
   108-row listing doesn't fire a hundred requests. The queue holds one
   *request*, not a whole two-request lookup: queuing the pair as one job
   deadlocked it against itself. Queue the leaves, compose above them. */
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

/* Every lookup resolves { game, why }: the game, or which of the four reasons it's missing. */
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

/** Reduces a title like "[Release] Elden Ring (v1.16 + 5 DLCs) [Repack]"
 * to a search term by stripping the board's own bookkeeping. */
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
            // A miss is cached as firmly as a hit, or every pinned topic Steam has never heard of becomes a repeat request.
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

function steamLookForTopic(topicId, title) {
    const known = topicId && steamAppForTopic(topicId);
    if (known) return steamDetails(known);
    return steamResolveByName(title).then((result) => {
        if (result.game && topicId) steamRememberApp(topicId, result.game.appId);
        return result;
    });
}

const STEAM_EXCUSES = {
    off: "Not in this browser's cache. Turn on Steam lookups in settings, or open the topic once.",
    tor: "Not looked up over Tor. Open the topic once and it will be cached.",
    nogrant: "Could not reach Steam: the forum only allows the page to talk to itself, and your userscript manager has not granted GM_xmlhttpRequest. Everything already cached still works.",
    failed: "Could not reach Steam just now.",
    miss: "Steam has nothing under that name.",
};

/* Every a.topictitle carries title="Posted: Wednesday, 15 May 2013,
 * 16:42", which drew the browser's own tooltip alongside this card. The
 * date moves onto the card instead and the attribute is removed; the
 * weekday is dropped too since nobody reads a thread by its day. */
const POSTED_RE = /^\s*(?:Posted|Добавлено)\s*:\s*/i;

function postedOn(link) {
    const said = link.getAttribute("title") || "";
    if (!POSTED_RE.test(said)) return null;
    return said.replace(POSTED_RE, "").replace(/^[^,]+,\s*/, "").trim() || null;
}

function steamCard(game, term, posted) {
    // Not role=tooltip: it holds interactive links, not just text.
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
        // Banded rather than shown as a bare number, since the band is what anyone reads.
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

    // Reachable by the pointer so its links don't vanish en route to them.
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

/** One delegated listener instead of one per row: 108 titles would otherwise be 216 handlers. */
function initSteamPreview() {
    if (!settings.get("steamPreview")) return;
    if (!PAGE.isForum && !PAGE.isIndex && !PAGE.isSearch) return;

    const byLink = new Map();
    for (const entry of topicRows()) {
        // Only when the preview is on; off, the board's own tooltip is what shows when a topic opened.
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

    // Keyboard parity: Tab focus shows the card, Escape hides it.
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

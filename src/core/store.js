/* ------------------------------------------------------------------
   Persistence.

   Everything the user changes lives in one object under one GM key, so
   export/import is a single JSON blob and a corrupt value can never
   take more than its own setting down.

   GM_* is used when the userscript manager provides it and localStorage
   is the fallback, which keeps the script working when it is pasted
   into a console or run through a manager with restricted grants.
   ------------------------------------------------------------------ */

const KEY = "rr:settings";
const DATA_KEY = "rr:data";
const KEY_PREFIX = "rr:";

const hasGM = typeof GM_getValue === "function" && typeof GM_setValue === "function";

function readRaw(key) {
    try {
        if (hasGM) return GM_getValue(key, null);
        return localStorage.getItem(key);
    } catch (err) {
        console.warn("[RIN Reforged] cannot read storage:", err);
        return null;
    }
}

function writeRaw(key, value) {
    try {
        if (hasGM) GM_setValue(key, value);
        else localStorage.setItem(key, value);
        return true;
    } catch (err) {
        console.warn("[RIN Reforged] cannot write storage:", err);
        return false;
    }
}

function parseJSON(raw, fallback) {
    if (raw === null || raw === undefined) return fallback;
    if (typeof raw === "object") return raw;
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch {
        return fallback;
    }
}

/* ---- Settings ---------------------------------------------------- */

const listeners = new Set();
let cache = null;

const settings = {
    /** Current value of one setting, falling back to the schema default. */
    get(id) {
        if (cache === null) cache = parseJSON(readRaw(KEY), {});
        if (Object.prototype.hasOwnProperty.call(cache, id)) return cache[id];
        return defaultFor(id);
    },

    /** All settings merged over the schema defaults. */
    all() {
        const out = {};
        for (const field of allFields()) out[field.id] = settings.get(field.id);
        return out;
    },

    set(id, value) {
        if (cache === null) cache = parseJSON(readRaw(KEY), {});
        const previous = settings.get(id);
        if (previous === value) return;
        cache[id] = value;
        writeRaw(KEY, JSON.stringify(cache));
        for (const fn of listeners) {
            try { fn(id, value, previous); } catch (err) { console.warn("[RIN Reforged] settings listener failed:", err); }
        }
    },

    /** Replace every stored setting at once (import, reset). */
    replace(next) {
        cache = {};
        for (const field of allFields()) {
            if (Object.prototype.hasOwnProperty.call(next, field.id)) cache[field.id] = next[field.id];
        }
        writeRaw(KEY, JSON.stringify(cache));
        for (const fn of listeners) {
            try { fn("*", null, null); } catch (err) { console.warn("[RIN Reforged] settings listener failed:", err); }
        }
    },

    reset() { settings.replace({}); },

    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};

/* ---- Free-form data (bookmarks, history, hidden users) ------------ */

let dataCache = null;

const store = {
    get(key, fallback) {
        if (dataCache === null) dataCache = parseJSON(readRaw(DATA_KEY), {});
        return Object.prototype.hasOwnProperty.call(dataCache, key) ? dataCache[key] : fallback;
    },
    set(key, value) {
        if (dataCache === null) dataCache = parseJSON(readRaw(DATA_KEY), {});
        dataCache[key] = value;
        writeRaw(DATA_KEY, JSON.stringify(dataCache));
    },
    all() {
        if (dataCache === null) dataCache = parseJSON(readRaw(DATA_KEY), {});
        return dataCache;
    },
    replace(next) {
        dataCache = next && typeof next === "object" ? next : {};
        writeRaw(DATA_KEY, JSON.stringify(dataCache));
    },
};

/* ---- Buckets: big things, kept on their own key ------------------- */

/* store.set() rewrites the whole of rr:data every time, which is the
   right trade for a dozen small values and the wrong one the moment
   something in there runs to six figures. The palette's index of the
   topics this browser has seen is 136 bytes a topic and holds
   hundreds; store.set("history", …) runs on every topic opened, and it
   would have re-serialised all of them each time.

   A bucket is not exported with the settings either, and that is the
   other half of the reason: a cache is not a preference, and nobody
   wants 80 KB of remembered titles in their backup. Clearing the
   script's data drops them (settingsui.js, clearData). */
const bucketCache = new Map();

/* Any JSON value, where parseJSON() above insists on an object.

   That insistence is right for the settings and for rr:data, which are
   both maps and where anything else means the value was corrupted. A
   bucket holds whatever it was given — the palette's index is an
   array and the last-search stamp is a number, and stamping it through
   parseJSON() read every one of them back as "no value at all". */
function parseAny(raw) {
    if (raw === null || raw === undefined) return undefined;
    if (typeof raw === "object") return raw;
    try {
        return JSON.parse(raw);
    } catch {
        return undefined;
    }
}

const bucket = {
    get(name, fallback) {
        if (!bucketCache.has(name)) bucketCache.set(name, parseAny(readRaw(KEY_PREFIX + name)));
        const held = bucketCache.get(name);
        return held === null || held === undefined ? fallback : held;
    },
    /** False when the write did not land — a full quota, mostly. */
    set(name, value) {
        bucketCache.set(name, value);
        return writeRaw(KEY_PREFIX + name, JSON.stringify(value));
    },
    drop(name) {
        bucketCache.delete(name);
        try {
            if (hasGM && typeof GM_deleteValue === "function") GM_deleteValue(KEY_PREFIX + name);
            else localStorage.removeItem(KEY_PREFIX + name);
        } catch (err) {
            console.warn("[RIN Reforged] cannot drop " + name + ":", err);
        }
    },
};

/* ---- Schema access ------------------------------------------------ */

let schemaRef = [];
let defaults = null;

function registerSchema(groups) { schemaRef = groups; defaults = null; }
function schema() { return schemaRef; }

function allFields() {
    const out = [];
    for (const group of schemaRef) out.push(...group.fields);
    return out;
}

/* settings.get() is asked about a hundred times on a listing page and
   most of those fall through to the default; rebuilding the flat field
   list and scanning it for each one was the whole of that cost. */
function defaultFor(id) {
    if (defaults === null) {
        defaults = new Map();
        for (const field of allFields()) defaults.set(field.id, field.default);
    }
    return defaults.get(id);
}

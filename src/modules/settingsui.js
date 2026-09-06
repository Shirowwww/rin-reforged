/* ------------------------------------------------------------------
   Settings panel.

   Generated entirely from the schema, so a new feature is a new entry
   in schema.js and nothing else. Changes apply live: there is no Save
   button because there is nothing to save at the end.

   The panel is a rail of categories beside the controls rather than
   one scroll of sixty rows. Picking a category shows that category;
   typing in the search box searches all of them at once and the rail
   then says how many each one holds, so a setting whose name you half
   remember is one glance rather than nine.
   ------------------------------------------------------------------ */

let panelHost = null;

/* Every control below exposes a sync() so the panel can be brought back
   in line with a setting that changed somewhere else — the palette's
   "Switch theme" action, or an import. Without it the panel goes on
   showing the value it had when it opened. */

function buildToggle(field) {
    const button = el("button.rr-switch", {
        type: "button",
        role: "switch",
        "aria-checked": settings.get(field.id) ? "true" : "false",
        "aria-label": field.label,
    });
    button.addEventListener("click", () => {
        const next = button.getAttribute("aria-checked") !== "true";
        button.setAttribute("aria-checked", next ? "true" : "false");
        settings.set(field.id, next);
    });
    button.sync = () => button.setAttribute("aria-checked", settings.get(field.id) ? "true" : "false");
    return button;
}

function buildSegmented(field) {
    const group = el("div.rr-seg", { role: "group", "aria-label": field.label });
    const sync = () => {
        for (const button of group.children) {
            button.setAttribute("aria-pressed", button.dataset.value === String(settings.get(field.id)) ? "true" : "false");
        }
    };
    for (const option of field.options) {
        const button = el("button", { type: "button" }, [option.label]);
        button.dataset.value = option.value;
        button.addEventListener("click", () => { settings.set(field.id, option.value); sync(); });
        group.append(button);
    }
    sync();
    group.sync = sync;
    return group;
}

function buildRange(field) {
    const readout = el("span.rr-range-val", {}, [settings.get(field.id) + (field.unit || "")]);
    const input = el("input.rr-range", {
        type: "range",
        min: String(field.min),
        max: String(field.max),
        step: String(field.step || 1),
        value: String(settings.get(field.id)),
        "aria-label": field.label,
    });
    input.addEventListener("input", () => {
        const value = Number(input.value);
        readout.textContent = value + (field.unit || "");
        settings.set(field.id, value);
    });
    const wrap = el("div.rr-rangewrap", {}, [input, readout]);
    wrap.sync = () => {
        const value = settings.get(field.id);
        input.value = String(value);
        readout.textContent = value + (field.unit || "");
    };
    return wrap;
}

/* Six unlabelled squares of colour, one of them with a ring round it,
   was the whole control: which was which took hovering each in turn,
   and the ring on the chosen one was easy to miss beside five others
   the same size. Each is a named chip now — the colour as a dot, its
   name under it, a tick on the one in use — and the chip lights up
   under the pointer, so the choice reads as a choice. */
function buildSwatches(field) {
    const group = el("div.rr-swatches", { role: "radiogroup", "aria-label": field.label });
    const sync = () => {
        for (const button of group.children) {
            const on = button.dataset.value === settings.get(field.id);
            button.setAttribute("aria-pressed", on ? "true" : "false");
            button.setAttribute("aria-checked", on ? "true" : "false");
        }
    };
    for (const option of field.options) {
        const dot = el("span.rr-swatch__dot", {}, [icon("check", 13)]);
        // A custom property has to go through setProperty; Object.assign
        // on style, which el() uses, silently drops it.
        dot.style.setProperty("--rr-swatch", option.color);
        const button = el("button.rr-swatch", {
            type: "button",
            role: "radio",
            "aria-label": option.label,
        }, [dot, el("span.rr-swatch__name", {}, [option.label])]);
        button.dataset.value = option.value;
        button.addEventListener("click", () => { settings.set(field.id, option.value); sync(); });
        group.append(button);
    }
    sync();
    group.sync = sync;
    return group;
}

function buildControl(field) {
    switch (field.type) {
        case "toggle": return buildToggle(field);
        case "seg": return buildSegmented(field);
        case "range": return buildRange(field);
        case "swatch": return buildSwatches(field);
        default: return el("span");
    }
}

function buildField(field) {
    const row = el("div.rr-field", { "data-field": field.id }, [
        el("div.rr-field__text", {}, [
            el("span.rr-field__label", {}, [field.label]),
            field.desc ? el("span.rr-field__desc", {}, [field.desc]) : null,
        ]),
        el("div.rr-field__control", {}, [buildControl(field)]),
    ]);
    // Searched on the words a reader would use, not the id: nobody
    // looks for "linkifyBare". The id is in there anyway, for whoever
    // read it in an export.
    row.dataset.search = (field.label + " " + (field.desc || "") + " " + field.id).toLowerCase();
    // Two attributes for one fact, because the stylesheet reads the
    // prefixed one and dataset.dep would have written data-dep, which
    // matches nothing.
    if (field.when) {
        row.dataset.when = field.when;
        row.setAttribute("data-rr-dep", field.when);
    }
    return row;
}

/** A field is only shown when the field it depends on is on. */
function syncDependencies(body) {
    for (const row of body.querySelectorAll("[data-when]")) {
        row.toggleAttribute("data-rr-dep-off", !settings.get(row.dataset.when));
    }
}

/** Bring every control in the panel back in line with what is stored. */
function syncControls(body) {
    for (const control of body.querySelectorAll(".rr-field__control > *")) {
        if (typeof control.sync === "function") control.sync();
    }
}

function exportSettings() {
    const payload = {
        script: "RIN Reforged",
        version: RR_VERSION,
        exported: new Date().toISOString(),
        settings: settings.all(),
        // Bookmarks, history, hidden members — what a move to another
        // browser wants. Not the drafts: an unsent reply is not settings
        // and has no business on a clipboard.
        data: Object.fromEntries(Object.entries(store.all()).filter(([key]) => key !== "drafts")),
    };
    copyText(JSON.stringify(payload, null, 2), "Settings and data copied as JSON");
}

/* Bookmarks, history, hidden members, the Releases cache: the data the
   script keeps for itself, gone in one step. The settings stay. */
function clearData() {
    if (!window.confirm("Forget bookmarks, reading history, hidden members and the Releases cache? Your settings stay.")) return;
    store.replace({});
    toast("Data cleared");
    setTimeout(() => location.reload(), 1000);
}

async function importSettings() {
    let text = "";
    try {
        text = await navigator.clipboard.readText();
    } catch {
        text = window.prompt("Paste the exported JSON") || "";
    }
    if (!text.trim()) return;
    try {
        const payload = JSON.parse(text);
        if (payload.settings) settings.replace(payload.settings);
        if (payload.data) store.replace(payload.data);
        toast("Settings imported. Reloading.");
        setTimeout(() => location.reload(), 1000);
    } catch {
        toast("That is not valid exported JSON");
    }
}

/* ---- The panel ---------------------------------------------------- */

/**
 * Which rows a category still shows, and which category is open.
 *
 * Two states rather than one, because they mean different things: a
 * row hidden because its parent setting is off must stay hidden while
 * searching, and a category with no matches must be sayable as "no
 * matches" rather than silently empty.
 */
function buildPanelBody() {
    const rail = el("nav.rr-panel__rail", { "aria-label": "Settings categories" });
    const pages = el("div.rr-panel__pages");
    const groups = [];

    for (const group of SETTINGS_SCHEMA) {
        const section = el("section.rr-group", { "data-group": group.id, role: "tabpanel", "aria-label": group.title }, [
            el("h3.rr-group__title", {}, [group.title]),
            group.note ? el("p.rr-group__note", {}, [group.note]) : null,
        ]);
        for (const field of group.fields) section.append(buildField(field));

        const count = el("span.rr-panel__tabcount");
        const tab = el("button.rr-panel__tab", {
            type: "button",
            role: "tab",
            "aria-selected": "false",
            "data-group": group.id,
        }, [icon(group.icon || "settings", 15), el("span.rr-panel__tabname", {}, [group.short || group.title]), count]);

        pages.append(section);
        groups.push({ group, section, tab, count });
        rail.append(tab);
    }

    let current = groups[0].group.id;
    const select = (id) => {
        current = id;
        for (const entry of groups) {
            const on = entry.group.id === id;
            entry.tab.setAttribute("aria-selected", on ? "true" : "false");
            entry.section.toggleAttribute("data-rr-off", !on);
        }
        pages.scrollTop = 0;
    };
    for (const entry of groups) {
        entry.tab.addEventListener("click", () => select(entry.group.id));
    }

    // Left and right walk the rail, which is what a tab list does.
    rail.addEventListener("keydown", (event) => {
        const index = groups.findIndex((entry) => entry.group.id === current);
        let next = null;
        if (event.key === "ArrowDown" || event.key === "ArrowRight") next = index + 1;
        else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = index - 1;
        else return;
        event.preventDefault();
        const target = groups[clamp(next, 0, groups.length - 1)];
        select(target.group.id);
        target.tab.focus();
    });

    /* Searching cuts across the categories: the rail keeps a count per
       category and the pages show every match at once, because a
       reader who types "quote" does not know which of nine boxes it
       was filed under. */
    const search = (needle) => {
        const query = needle.trim().toLowerCase();
        let total = 0;

        for (const entry of groups) {
            let shown = 0;
            for (const row of entry.section.querySelectorAll(".rr-field")) {
                const match = !query || row.dataset.search.includes(query);
                row.toggleAttribute("data-rr-nomatch", !match);
                if (match) shown += 1;
            }
            entry.count.textContent = query ? String(shown) : "";
            entry.tab.toggleAttribute("data-rr-empty", Boolean(query) && shown === 0);
            entry.section.toggleAttribute("data-rr-searching", Boolean(query));
            total += shown;
        }

        if (!query) { select(current); return total; }

        // Every category with a hit is on screen at once while
        // searching, so the answer is never behind a tab.
        for (const entry of groups) {
            entry.section.toggleAttribute("data-rr-off", entry.tab.hasAttribute("data-rr-empty"));
        }
        return total;
    };

    select(current);
    return { rail, pages, search, groups, select };
}

function openSettings() {
    if (panelHost) { panelHost(); return; }

    const { rail, pages, search: runSearch } = buildPanelBody();
    const body = el("div.rr-panel__body", {}, [rail, pages]);

    const empty = el("p.rr-panel__empty", { hidden: true }, ["No setting matches that."]);
    pages.append(empty);

    const search = el("input.rr-panel__search", {
        type: "search",
        placeholder: "Find a setting",
        "aria-label": "Find a setting",
    });
    search.addEventListener("input", debounce(() => {
        empty.hidden = runSearch(search.value) > 0;
    }, 90));

    let unsubscribe = () => {};
    let release = () => {};
    const previous = document.activeElement;
    const close = () => {
        panel.remove();
        overlay.remove();
        unsubscribe();
        release();
        panelHost = null;
        document.removeEventListener("keydown", onKey, true);
    };
    const onKey = (event) => { if (event.key === "Escape") close(); };

    const closeButton = el("button.rr-icon-btn", { type: "button", title: "Close settings" }, [icon("close")]);
    closeButton.addEventListener("click", close);

    const panel = el("aside.rr-panel", {
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "RIN Reforged settings",
        tabindex: "-1",
    }, [
        el("div.rr-panel__head", {}, [
            el("div.rr-panel__id", {}, [
                el("h2.rr-panel__title", {}, ["Reforged"]),
                el("span.rr-panel__ver", {}, ["v" + RR_VERSION]),
            ]),
            search,
            closeButton,
        ]),
        body,
        el("div.rr-panel__foot", {}, [
            /* "Export" copied to the clipboard and took bookmarks and
               history with it, and said neither. */
            el("button.rr-btn", {
                type: "button", onclick: exportSettings,
                title: "Copies every setting, plus bookmarks, history and hidden members, as JSON. Unsent drafts stay here.",
            }, [icon("copy"), "Copy settings"]),
            el("button.rr-btn", {
                type: "button", onclick: importSettings,
                title: "Paste JSON copied from another browser",
            }, ["Paste settings"]),
            el("button.rr-btn", {
                type: "button", "data-variant": "quiet", onclick: clearData,
                title: "Forget bookmarks, reading history, hidden members and the Releases cache",
            }, ["Clear data"]),
            el("span.rr-spacer"),
            el("button.rr-btn", {
                type: "button",
                onclick: () => {
                    if (!window.confirm("Reset every RIN Reforged setting to its default?")) return;
                    settings.reset();
                    toast("Settings reset");
                    setTimeout(() => location.reload(), 1000);
                },
            }, ["Reset"]),
        ]),
    ]);

    // A light scrim rather than the palette's full dim: the panel is
    // for adjusting the page you can still see behind it.
    const overlay = el("div.rr-overlay", { style: { background: "rgba(6, 8, 11, .25)", zIndex: "2050" } });
    overlay.addEventListener("mousedown", close);

    syncDependencies(body);
    unsubscribe = settings.onChange(() => { syncDependencies(body); syncControls(body); });

    document.body.append(overlay, panel);
    document.addEventListener("keydown", onKey, true);
    panelHost = close;
    release = trapFocus(panel, previous instanceof HTMLElement ? previous : null);
    search.focus();
}

function initSettingsUI() {
    if (typeof GM_registerMenuCommand === "function") {
        GM_registerMenuCommand("RIN Reforged settings", () => openSettings());
    }
}

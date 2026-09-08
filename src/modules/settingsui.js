/* Settings panel, generated entirely from schema.js — a new feature is just a
   new schema entry. Changes apply live (no Save button); fields marked
   `reload` in the schema are the exception, see applyField. A rail of
   categories beside the controls, searchable across all of them at once. */

let panelHost = null;

// Store a field's value; reload if the schema marks it `reload` (e.g. the
// top bar, built once from the board's own header markup at load, can't be
// un-toggled live without the board's header and the bar overlapping).
function applyField(field, value) {
    settings.set(field.id, value);
    if (!field.reload) return;
    toast(t("Applying. Reloading."));
    setTimeout(() => location.reload(), 600);
}

// Every control exposes sync() to reflect a setting changed elsewhere (palette
// theme switch, import) rather than only what was true when the panel opened.

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
        applyField(field, next);
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
        button.addEventListener("click", () => { applyField(field, option.value); sync(); });
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
        applyField(field, value);
    });
    const wrap = el("div.rr-rangewrap", {}, [input, readout]);
    wrap.sync = () => {
        const value = settings.get(field.id);
        input.value = String(value);
        readout.textContent = value + (field.unit || "");
    };
    return wrap;
}

// Named chips (dot + label + tick), not unlabelled colour squares — those
// required hovering each one to tell which was which.
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
        // el()'s Object.assign onto style silently drops custom properties; setProperty is required.
        dot.style.setProperty("--rr-swatch", option.color);
        const button = el("button.rr-swatch", {
            type: "button",
            role: "radio",
            "aria-label": option.label,
        }, [dot, el("span.rr-swatch__name", {}, [option.label])]);
        button.dataset.value = option.value;
        button.addEventListener("click", () => { applyField(field, option.value); sync(); });
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
    // Searchable by label/desc, not just the id (which nobody types but an export shows).
    row.dataset.search = (field.label + " " + (field.desc || "") + " " + field.id).toLowerCase();
    if (field.when) row.setAttribute("data-rr-dep", field.when);
    return row;
}

function syncDependencies(body) {
    for (const row of body.querySelectorAll("[data-rr-dep]")) {
        row.toggleAttribute("data-rr-dep-off", !settings.get(row.getAttribute("data-rr-dep")));
    }
}

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
        // Everything but drafts: an unsent reply has no business on a clipboard.
        data: Object.fromEntries(Object.entries(store.all()).filter(([key]) => key !== "drafts")),
    };
    copyText(JSON.stringify(payload, null, 2), "Settings and data copied as JSON");
}

// Wipes rr:data plus the topic-title index bucket by name (see forgetTopicIndex),
// since that one lives outside rr:data and store.replace({}) wouldn't reach it.
function clearData() {
    if (!window.confirm("Forget bookmarks, reading history, hidden members, remembered topic titles and the Releases cache? Your settings stay.")) return;
    store.replace({});
    forgetTopicIndex();
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

// Tracks two independent hidden-states per row: dependency-off (stays hidden
// while searching) and search-no-match (so a category can say "no matches").
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

    // Search shows every match across all categories at once, with a count per rail tab.
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

        for (const entry of groups) {
            entry.section.toggleAttribute("data-rr-off", entry.tab.hasAttribute("data-rr-empty"));
        }
        return total;
    };

    select(current);
    return { rail, pages, search };
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
            // Renamed from "Export": it copies to the clipboard and includes bookmarks/history, unstated before.
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
                title: "Forget bookmarks, reading history, hidden members, remembered topic titles and the Releases cache",
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

    // Light scrim, not the palette's full dim — the page stays visible behind the panel.
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

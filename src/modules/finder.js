// Reads what a post carries and says, and how much of that adds up to a
// release rather than a reply about one — releases.js is the half that
// shows it. Nothing here fetches anything; it only reads the loaded page.

// "emulator" used to be in this list; dropped because a post mentioning one
// is as likely about RPCS3/Yuzu/PS2 as a Steam stub. "goldberg"/"steam emu"
// say the same thing without the false positives.
const RELEASE_WORDS = [
    "clean steam files", "steam files", "reupload", "re-upload",
    "update", "updated", "patch", "hotfix", "repack", "crack",
    "build", "denuvo", "dlc unlocker", "goldberg", "steam emu",
    "online fix",
    // A hypervisor crack has its own how-to threads and requirements.
    "hypervisor", "title update",
];

// Three shapes: v1.4.2/ver. 2.0, a Steam build id (8 digits, kept separate
// so it's never mistaken for a huge version), and a labelled bare number
// ("Title Update 1.0.7", the commonest form here) — which must be followed
// by a *dotted* number so "update 2 of 3" doesn't count.

// A single trailing letter (1.4.2b) is allowed, but only where it's not the
// start of a word and not itself a digit — a plain `\b` let "1.0.7Learn"
// backtrack to "1.0".
const VERSION_SUFFIX = "(?:[a-z](?![a-z]))?(?!\\d)";

const VERSION_RE = new RegExp([
    "\\b(?:v(?:er(?:sion)?)?\\.?\\s?)(\\d+(?:\\.\\d+){1,3}" + VERSION_SUFFIX + ")",
    "\\bbuild\\s+(\\d{5,9})\\b",
    "\\b(?:title[\\s.]+update|update|patch|tu)d?[\\s.]+(?:to[\\s.]+)?v?(\\d+(?:\\.\\d+){1,3}" + VERSION_SUFFIX + ")",
    // A bare three-part number ("Deluxe Edition 1.2.3 GOG") — release
    // titles here carry one without a v more often than with. Two parts
    // alone is left to the labelled forms since 2.5 is also a price/score.
    "(?<![\\w.])(\\d{1,4}\\.\\d{1,3}\\.\\d{1,4}" + VERSION_SUFFIX + ")(?![\\w.])",
].join("|"), "i");

// A shape check, not a digit check: plausible year/month/[day]. Off the live
// board, "Updated.2026.09.02" would otherwise beat every real version this
// board will ever see. This also refuses genuine year-based versioning
// (2024.1.5), the right trade where every real version here is 1.x/2.x.
// The number still shows if the post carries nothing else; this only stops
// it being compared as a version.
function looksLikeDate(version) {
    const parts = version.split(".").map((part) => parseInt(part, 10));
    if (parts.length < 2 || parts.length > 3) return false;
    const year = (n) => n >= 1990 && n <= 2099;
    const month = (n) => n >= 1 && n <= 12;
    const day = (n) => n >= 1 && n <= 31;
    // 2026.09.02 / 2026.09
    if (year(parts[0]) && month(parts[1]) && (parts.length === 2 || day(parts[2]))) return true;
    // 12.09.2026 — the other order half this board uses.
    return parts.length === 3 && day(parts[0]) && month(parts[1]) && year(parts[2]);
}

// Every version-shaped match in order, not just the first — a post whose
// opening line is a build date needs the real version three lines down.
const VERSION_RE_ALL = new RegExp(VERSION_RE.source, "gi");

// "Peacock-v5.3.0.7z" would read as version 5.3.0.7z (extension mistaken for
// a 4th part + letter); blanked before matching so the number stays as written.
const ARCHIVE_SUFFIX_RE = /\.(?:7z|zip|rar|tar|gz|bz2|iso|exe|bin|torrent|part\d*)\b/gi;

// "The 'Casino Monarchique' Chip (1.000.000)" — a chip count — matched the
// bare three-part form as version one million. A thousands separator writes
// zero-padded groups of 3, which nothing versions itself as; only the bare
// form is checked, so "v1.000.000" typed on purpose still counts.
function looksLikeAThousand(version) {
    const parts = version.split(".");
    if (parts.length !== 3) return false;
    if (parts[1].length !== 3 || parts[2].length !== 3) return false;
    return /^0/.test(parts[1]) || /^0/.test(parts[2]);
}

// Companion software (Peacock, Goldberg, GreenLuma, an overlay) has its own
// version in the same sentence as the game's — "update the Peacock crack to
// v8.9.0" announced HITMAN 3 as v8.9.0 when the game was on 3.280. Checked
// only looking backward from the number: forward is "v3.190 + Peacock + ALL
// DLC", the game's real version followed by what comes with it.
const COMPANION_RE = /\b(?:peacock|goldberg|greenluma|smoke\s?api|cream\s?api|uplay\s?r2|achievement\s?overlay|reshade|dxvk|proton|lutris|vcredist|directx|cheat\s?engine|fling|steamtools|simple\s?mod\s?framework|winrar|7-?zip)\b/i;
const COMPANION_WINDOW = 32;

function versionsIn(said) {
    const text = String(said || "").replace(ARCHIVE_SUFFIX_RE, " ");
    const all = VERSION_RE_ALL;
    all.lastIndex = 0;
    const found = { version: null, build: null, named: false, theirs: false };
    let match;
    while ((match = all.exec(text)) !== null) {
        if (match[2]) {
            if (!found.build) found.build = match[2];
            continue;
        }
        const number = match[1] || match[3] || match[4];
        if (!number || looksLikeDate(number)) continue;
        if (!match[1] && !match[3] && looksLikeAThousand(number)) continue;
        // named = the post called it a version (v-prefixed or "Title
        // Update"/"updated to"); a bare three-part number is shown too but
        // isn't evidence about the game — "Updated ACBlackFlagFix to 2.8.3!"
        // is a mod's changelog, not the game's version.
        if (!found.version) {
            found.version = number;
            found.named = Boolean(match[1] || match[3]);
            found.theirs = COMPANION_RE.test(
                text.slice(Math.max(0, match.index - COMPANION_WINDOW), match.index));
        }
    }
    // "Updated from 1.0.5 to 1.0.7": the plain first match would be the
    // version left behind. Only this wording overrides it.
    const step = FROM_TO_RE.exec(text);
    if (step && !looksLikeDate(step[2]) && compareVersions(step[2], step[1]) > 0) {
        found.version = step[2];
        found.named = true;
        found.theirs = COMPANION_RE.test(
            text.slice(Math.max(0, step.index - COMPANION_WINDOW), step.index));
    }
    return found;
}

const FROM_TO_RE = /\bfrom\s+v?\.?\s?(\d+(?:\.\d+){1,3}[a-z]?)\s+to\s+v?\.?\s?(\d+(?:\.\d+){1,3}[a-z]?)\b/i;

/** Numeric, part by part: 1.0.10 is newer than 1.0.9. */
function compareVersions(a, b) {
    const left = String(a).split(/[.\-_]/).map((part) => parseInt(part, 10) || 0);
    const right = String(b).split(/[.\-_]/).map((part) => parseInt(part, 10) || 0);
    const length = Math.max(left.length, right.length);
    for (let index = 0; index < length; index += 1) {
        const diff = (left[index] || 0) - (right[index] || 0);
        if (diff) return diff;
    }
    return 0;
}

/** Hosts that are the forum itself rather than somewhere to download. */
function isOffsite(href) {
    try {
        const host = new URL(href, location.href).hostname;
        return host !== location.hostname && !host.endsWith(".rin.ru");
    } catch {
        return false;
    }
}

// Strips quoted content so a "thanks, link's dead" reply quoting a release
// doesn't score like the release itself (same version, words, and login-wall
// markers). The clone is detached, so nothing the reader sees is touched.
//
// A spoiler wears the same `.quotecontent` class as a quote body
// (`div.spoiler > div + div.quotecontent > div[hidden]`), and on this board
// the spoiler is *where the download links go* ("Download:" then a spoiler
// of mirrors) — stripping it like a quote silently zeroed out every
// ElAmigos/DODI/CharmKat/RIDDICK release post. A quote's `.quotecontent` has
// the post as parent; a spoiler's has `.spoiler` as parent. A quote nested
// inside a spoiler is still a quote and still goes.
function isSpoilerBody(node) {
    const parent = node.parentElement;
    return Boolean(parent && parent.classList && parent.classList.contains("spoiler"));
}

// The board wraps a distrusted filehost link in span.link_unsafe_overlay >
// a.link_unsafe_reveal (no href, so it survives anchor-stripping) + a
// link_unsafe_note warning — none of it typed by the poster, but it landed
// in the post's text as forty words of boilerplate ("buzzheavier.com link
// Malicious ads...") in front of every excerpt from those hosts.
const LINK_FURNITURE = "a.link_unsafe_reveal, .link_unsafe_note";

function ownContent(body) {
    const copy = body.cloneNode(true);
    for (const quote of copy.querySelectorAll(".quotecontent, .quotetitle, blockquote, cite")) {
        if (isSpoilerBody(quote)) continue;
        quote.remove();
    }
    for (const node of copy.querySelectorAll(LINK_FURNITURE)) node.remove();
    spaceOutLines(copy);
    return copy;
}

// Links removed before the English-reading rules (question/failure/reply/
// advice) run — a bare 60-80 char URL inline pushed the real sentence out of
// their reading window, e.g. "I finally got 'The Brothers' mod (i.e.
// https://nexusmods.com/.../431 ) working on Linux".
function proseContent(own) {
    const copy = own.cloneNode(true);
    for (const node of copy.querySelectorAll("a[href], .link_removed, " + CODE_BLOCKS)) node.remove();
    return copy.textContent;
}

/** The post's first lines, which is where it says what it is. */
function openingOf(text, chars) {
    return String(text || "").split("\n")
        .map((line) => line.replace(/\s+/g, " ").trim())
        .filter((line) => line && line !== "⚠")
        .join("\n")
        .slice(0, chars);
}

// A <br> contributes no text, so line-per-fact posts weld together:
// "Game version is Title Update 1.0.7Learn more here" — breaking both the
// version regex (no word boundary) and release-word matching. Fixed with a
// newline (not a space) per break on the detached copy, since passwordIn()
// reads one candidate per line via `[\n\r]+` and needs real line boundaries.
const LINE_BREAKS = "br, p, div, li, tr, h1, h2, h3, h4, blockquote, pre";

function spaceOutLines(copy) {
    for (const node of copy.querySelectorAll(LINE_BREAKS)) {
        node.before(document.createTextNode("\n"));
        node.after(document.createTextNode("\n"));
    }
}

// Almost every release post ends with one ("Password: cs.rin.ru", "unrar
// pass: something", "Пароль: ..."), often screens below the link or inside a
// spoiler. Read as label + separator + the token after it.
const PASSWORD_LABEL = "(?:archive\\s+|unrar\\s+|unzip\\s+|rar\\s+|zip\\s+|extraction\\s+)?(?:password|passwd|pass|pwd|pw|пароль)";
// What a post says instead of a password ("the standard password", "password
// required") — none of these is one, and reading it out is worse than nothing.
const NOT_A_PASSWORD = new Set([
    "standard", "usual", "same", "above", "below", "none", "forum", "default",
    "required", "needed", "protected", "correct", "wrong", "here", "link",
    "file", "archive", "yes", "no", "is", "the", "a", "unknown", "obvious",
]);
const PASSWORD_RE = new RegExp(
    // A separator is required (colon, equals, dash, or "is") — without one,
    // "password protected" reads as a password called "protected".
    "(^|[\\s>(\\[])" + PASSWORD_LABEL + "\\s*(?:is\\b\\s*|[:=\\-]\\s*)+([^\\s<>\\n\\r]{1,48})",
    "i",
);
const NO_PASSWORD_RE = new RegExp(
    "\\b(?:no|none|without|not?)\\s+(?:" + PASSWORD_LABEL + ")|" + PASSWORD_LABEL + "\\s*[:=\\-]?\\s*(?:none|no|n/a|нет)\\b",
    "i",
);

function passwordIn(text) {
    const said = String(text || "");
    for (const line of said.split(/[\n\r]+/)) {
        if (NO_PASSWORD_RE.test(line)) continue;
        const match = PASSWORD_RE.exec(line);
        if (!match) continue;
        const value = match[2]
            .replace(/^[\u0022\u0027`]+|[\u0022\u0027`,;:!?)\]]+$/g, "")
            .replace(/\.$/, "");
        if (value.length < 2 || NOT_A_PASSWORD.has(value.toLowerCase())) continue;
        // A password is a token (has a dot/dash/digit/underscore, or is a
        // long run of letters) — a word mid-sentence is neither.
        if (!/[.\-_@\d]/.test(value) && value.length < 6) continue;
        return value;
    }
    return null;
}

// Unrecognised hosts keep their own domain, without the suffix.
const HOST_NAMES = {
    "mega.nz": "MEGA", "mega.co.nz": "MEGA",
    "1fichier.com": "1fichier",
    "gofile.io": "GoFile",
    "pixeldrain.com": "PixelDrain",
    "buzzheavier.com": "Buzzheavier",
    "datanodes.to": "DataNodes",
    "mediafire.com": "MediaFire",
    "drive.google.com": "Drive",
    "dropbox.com": "Dropbox",
    "workupload.com": "WorkUpload",
    "krakenfiles.com": "KrakenFiles",
    "send.cm": "Send.cm",
    "qiwi.gg": "Qiwi",
    "multiup.io": "MultiUp", "multiup.org": "MultiUp",
    "torrent.rin.ru": "Torrent",
    "github.com": "GitHub",
    "archive.org": "Archive.org",
};

// Not a release host: stores, video, screenshots, articles, publishers and
// games press. The last two matter because "the patch is out, get it at
// store.epicgames.com" is the commonest thing a *reply* carries, and
// counting it as a download put a page of conversation in the panel.
const NOT_HOSTS = new RegExp([
    "steampowered|steamcommunity|steamdb|steamcharts|protondb|pcgamingwiki|pcgamebenchmark",
    // Stores. Somewhere to buy is not somewhere to download.
    "epicgames|gog\\.com|ubisoft\\.com|ubi\\.com|origin\\.com|ea\\.com|xbox\\.com|microsoft\\.com",
    "playstation\\.com|nintendo\\.|humblebundle|itch\\.io|greenmangaming|fanatical|gamesplanet",
    // Publishers and the games press, which announce rather than host.
    "ioi\\.dk|rockstargames|bethesda|square-enix|capcom|bandainamco|sega\\.com",
    "pcgamer|vg247|eurogamer|ign\\.com|gamespot|kotaku|rockpapershotgun|dsogaming|wccftech|videocardz",
    // Video, pictures, talk.
    "youtube|youtu\\.be|imgur|ibb\\.co|prnt\\.sc|gyazo|postimg|imageban|fastpic|pixhost|imgbox",
    "lensdump|imagizer|googleusercontent|twitch|twitter|x\\.com|reddit|wikipedia|discord|patreon|paypal",
    "google\\.[a-z]+|bing|duckduckgo|blockchair|mempool",
].join("|"), "i");

// co.uk, github.io etc.: the real label is one segment further left.
const HOST_SUFFIX_2 = /\.(?:co|com|net|org|gov|ac|edu)\.[a-z]{2,3}$|\.(?:github|gitlab)\.io$|\.(?:blogspot|netlify|vercel|pages|workers)\.(?:com|app|dev)$/i;

// Used to strip a fixed suffix list and take whatever came last, which
// misread rootz.so as "So", ioi.dk as "Dk". Taking the label before the
// public suffix instead gets the real name.
function hostLabel(host) {
    const bare = host.replace(HOST_SUFFIX_2, "").replace(/\.[a-z]{2,24}$/i, "");
    const label = bare.split(".").pop();
    if (!label || label.length < 2) return null;
    return label.charAt(0).toUpperCase() + label.slice(1);
}

function hostName(href) {
    let host;
    try { host = new URL(href, location.href).hostname.replace(/^www\./, ""); }
    catch { return null; }
    if (NOT_HOSTS.test(host)) return null;
    if (HOST_NAMES[host]) return HOST_NAMES[host];
    return hostLabel(host);
}

// Told apart because both a citing post ("read their website: [wiki]") and
// an offering one ("here's the gofile folder") carry one off-site link.
// `null` is the board itself, "read" is somewhere to read (store, patch
// note, wiki, repo, paste), "file" is somewhere to get the thing — the path
// matters as much as the host (github.com/x/y is a repo,
// github.com/x/y/releases is a download page). Unrecognised defaults to
// "file": uploaders use a new host every month and a stale list would lose
// real releases.
const READ_PATH_RE = /\/(?:wiki|blob|commits?|issues?|pull|tree|discussions?|patch-?notes?|news|roadmaps?|changelog|faq|about|profile|memberlist)(?:\/|\?|$)/i;

// Pastes/link lists hold real releases (a rentry of mirrors) as often as a
// pasted log or a guide, so one only counts as an offer when the post also
// sounds like it's handing something over (size, password, label, name).
const NOTE_HOST_RE = /^(?:rentry\.|privatebin|paste\.|pastebin|hastebin|justpaste|controlc|ghostbin|dpaste|termbin|textbin|telegra\.ph)/i;

const CODE_HOST_RE = /^(?:github|gitlab|codeberg|sourceforge)\.(?:com|net|org|io)$/i;
const CODE_FILE_PATH_RE = /\/(?:releases|releases\/download|raw|archive|downloads?|files)(?:\/|\?|$)/i;
const STATIC_SITE_RE = /\.(?:github|gitlab)\.io$/i;

function linkRole(href) {
    const raw = String(href || "");
    if (/^magnet:/i.test(raw)) return "file";
    let url;
    try { url = new URL(raw, location.href); }
    catch { return null; }
    if (!/^https?:$/.test(url.protocol)) return null;
    const host = url.hostname.replace(/^www\./, "");
    if (host === location.hostname || host.endsWith(".rin.ru")) return null;
    if (NOT_HOSTS.test(host)) return "read";
    if (STATIC_SITE_RE.test(host)) return "read";
    if (CODE_HOST_RE.test(host)) return CODE_FILE_PATH_RE.test(url.pathname) ? "file" : "read";
    if (READ_PATH_RE.test(url.pathname)) return "read";
    if (NOTE_HOST_RE.test(host)) return "note";
    return "file";
}

// Markers of intent (size, name, password/link label), used only to decide
// whether a paste link counts as an offer.
const OFFER_SIZE_RE = /\b\d{1,5}(?:[.,]\d+)?\s?(?:[KMGT]i?B)\b/i;
const OFFER_LABEL_RE = /\bdownloads?\s*(?:links?|mirrors?)?\s*[:\-–>]|\blinks?(?:\(s\))?\s*[:\-–]|\bmirrors?\s*\d*\s*[:\-–]|\bpass(?:word)?\s*[:\-–=]|\bпароль/i;
// A scene name (Foo.Bar.v1.0.2-GROUP) or a named archive file.
const OFFER_NAME_RE = /\b[A-Za-z0-9]+(?:\.[A-Za-z0-9]+){2,}-[A-Za-z0-9]{2,}\b|\b[\w.\-]{3,}\.(?:7z|rar|zip|iso|torrent)\b/i;

function saysItIsHandingSomethingOver(text, attached) {
    if (attached) return true;
    return OFFER_SIZE_RE.test(text) || OFFER_LABEL_RE.test(text) || OFFER_NAME_RE.test(text);
}

// Magnet links have no host of their own.
function linkHosts(links) {
    const out = [];
    for (const link of links) {
        const href = link.getAttribute("href") || "";
        const name = /^magnet:/i.test(href) ? "Torrent" : hostName(href);
        if (name && !out.includes(name)) out.push(name);
    }
    return out;
}

// subsilver2 on cs.rin.ru marks a code block .codebox > .codeheader +
// .codeholder, not phpBB3's .codetitle + .code — matching only the latter
// meant no code block was ever recognised on the live board, and release
// words got matched against pasted configs/magnets/error logs instead.
const CODE_BLOCKS = ".code, .codetitle, .codebox, .codeheader, .codeholder";

// What a post is *offering* vs. talking about: a file host link, a
// login-walled link, a magnet, a torrent, an attachment. Without this
// distinction a 429-page topic listed every question as a release, since
// the old rules just asked for a link or a version and a question has both.
const CARRIED_RE = /magnet:\?xt=|\.torrent\b/i;
const ATTACHED = ".attachtitle, .attachcontent, .attachrow";

// A guest sees a "@member" mention link replaced by the same
// "[[Please login to see this link.]]" placeholder as a filehost link, so a
// reply opening "@someone, AFAIK, not currently" counted as carrying a
// download. Signed-in the mention is an ordinary memberlist.php anchor,
// already refused by isOffsite() — this is the guest's half of that rule.
function hiddenLinks(own) {
    let count = 0;
    for (const node of own.querySelectorAll(".link_removed")) {
        const before = node.previousSibling;
        if (before && before.nodeType === 3 && /@\s*$/.test(before.textContent)) continue;
        count += 1;
    }
    return count;
}

// A question carrying a version and two release words ("Anyone know what
// version that torrent from April is?") used to be listed as a release.
// Only the opening sentence is checked, and it must both start and end like
// a question, so a release post closing "any problems, let me know?" is
// untouched. A full stop between two digits doesn't end the sentence early
// (so "...Peacock v8.8.1 from?" doesn't stop at "v8"). Bare `any` (not just
// anyone/anybody/anyway) is included: "Any news on the update? doesn't work
// at all" opened more questions here than the three compounds combined.
const ASKING_RE = /^(?:[^.!?]|\.(?=\S)){0,240}\?/;
const ASKING_OPENERS = /^[\s\W]*(?:@\S*[\s,]*)*(?:is|are|was|were|does|do|did|can|could|would|will|should|has|have|any(?:one|body|way|thing)?|some(?:one|body)|how|what|where|when|why|which|who|whose|hi|hello|hey|help|please|sorry|guys?)\b/i;

function looksLikeAQuestion(text) {
    const said = String(text || "").replace(/\s+/g, " ").trim();
    return ASKING_RE.test(said) && ASKING_OPENERS.test(said);
}

// "...the cracked one v6 from here, and they don't seem to work" has a
// version, a release word and a link but is somebody stuck, not a release.
// Requires a subject before the verb — a bare pattern read a release post's
// "Doesnt work on demo" (a caveat on the upload) as a failure report and
// dropped the whole thing. Only checked when the post hands nothing over
// (no attachment/password/size/name), so "if it doesn't work, verify your
// files" in a real release isn't caught.
const FAILED_RE = /\b(?:(?:it|they|this|that|these|those|mine|game|crack|patch|link|files?|version|copy|method|mod|emu|setup|nothing|none|i)\s+(?:do(?:es)?\s?n[o']?t|won'?t|can'?t|isn'?t|aren'?t|still\s+do(?:es)?\s?n[o']?t)\s+(?:\w+\s+){0,2}(?:work|launch|start|run|load|open)|can'?t\s+get\s+(?:it|this|that|them)\s+to\s+\w+|no\s+luck|stuck\s+(?:at|on)|keeps?\s+crashing|crashes?\s+(?:on|at|when|immediately)|fail(?:s|ed)?\s+to\s+(?:work|launch|start|run|install))\b/i;

function reportsAFailure(text) {
    return FAILED_RE.test(String(text || ""));
}

// With links stripped, a mention-reply opens "@, No problem, glad you got it
// working" (or "Response to wasdfghj" typed by hand) — both used to be
// listed as releases on the strength of a link further down. Only the
// opening is checked, and only when the post hands nothing over, so a reply
// that answers "@someone" and then attaches the file is still an upload.
const REPLYING_RE = /^[\s\W]{0,4}(?:@|re\s*:|response\s+to\b|reply\s+to\b|quote\s*:)/i;

function looksLikeAReply(text) {
    return REPLYING_RE.test(String(text || "").replace(/\s+/g, " ").trim());
}

// The rule a 429-page HITMAN topic needed most: half of it was one person
// answering everyone with a link to where the discussed thing already lives
// (an official tool, someone else's upload, a Nexus mod) — read by the rules
// above, each answer has an off-site download, a version and release words,
// and all 35 of that topic's 73 "release" rows were actually this. Told
// apart by the opening: a release opens with the thing itself ("Here is...",
// "I compiled..."), an answer opens with the reader's situation ("Assuming
// you are on...", "You can use..."). Only the opening is read, and only
// where the post isn't itself saying it's handing something over.
const ADVISING_OPEN = new RegExp([
    // A release post doesn't open with "Or"; nothing here opens a download
    // with "Yeah".
    "^\\W*(?:assuming|since\\s+you|if\\s+you|while\\s+i|in\\s+short|before\\s+you",
    "|okay|ok|yeah|yeh|yep|nope|nah|sure|well|anyway|also|or|and|but)\\b",
    // Announcing instructions follow.
    "|^\\W*(?:guide|tutorial|how\\s+to|instructions?|steps?\\s+to)\\b",
    // Telling the reader what to do about their copy.
    "|\\byou\\s+(?:can|could|should|need\\s+to|have\\s+to|must|might|may|want\\s+to|will\\s+need)\\b",
    "|\\bi\\s+(?:would|suggest|recommend|think|believe|guess)\\b",
    // Saying where the thing is (not offering it).
    "|\\b(?:is|are|it'?s)\\s+(?:already\\s+)?(?:in|on)\\s+(?:this|the)\\s+(?:thread|topic|post|page)\\b",
    "|\\buse\\s+the\\s+search\\b",
    "|\\b(?:has|have)\\s+(?:it|them|this)\\s+(?:in|on|here|there)\\b",
    // The apostrophe matters: without it, `\\w+s\\s+release` matched
    // "ElAmigos release" — a group announcing its own upload.
    "|\\b\\w+'s\\s+(?:stuff|setup|post|link|version|release|build|copy)\\b",
    // Reporting what the poster did with someone else's thing; PUBLISHING
    // below is checked separately and wins, so "tried to crack Peacock
    // v8.9.0" is a release but "tested it on Hitman v3.270.1" is not.
    "|\\bi\\s+(?:have\\s+)?(?:just\\s+|finally\\s+)?(?:tested|checked)\\b",
    // Not `[^.]`, which "i.e." would end early.
    "|\\bi\\s+(?:finally\\s+)?got\\s+[^\\n]{0,60}?\\bworking\\b",
    "|\\bi\\s+had\\s+th(?:is|e\\s+same)\\s+(?:problem|issue)\\b",
].join(""), "i");

// Read over the first few lines, not just the first: the publishing sentence
// is often the second ("Hiii" then "I compiled..."). Verbs mean *I made
// this*; "made"/"shared"/"posted" are excluded since each doubles as
// narrating something done in the past ("files I made a while ago").
const PUBLISHING_OPEN = /^\W*(?:here(?:'s| is| are| you go)\b|use\s+th(?:is|ese)\b)/i;
const PUBLISHING = new RegExp([
    "\\bhere\\s+you\\s+go\\b",
    "|\\bi(?:'ve|\\s+have)?\\s+(?:just\\s+|finally\\s+)?(?:re-?)?",
    "(?:uploaded|upped|compiled|built|patched|cracked|packed|repacked|ported|translated|created)\\b",
    "|\\bi\\s+(?:decided|tried|attempted|managed)\\s+to\\s+",
    "(?:make|crack|update|patch|build|compile|port|fix|translate|upload)\\b",
    "|\\bupon\\s+request\\b",
    // Third person only ("if anyone wants it"): "if you want" is the
    // commonest sentence in an answer, not an offer.
    "|\\bif\\s+(?:anyone|anybody|someone|somebody)\\s+(?:wants?|needs?)\\b",
    "|\\b(?:download|grab|get)\\s+(?:it|them|this)\\s+(?:here|below|from)\\b",
].join(""), "i");

// One line for what it's answering, ~3 for whether it's publishing — enough
// to reach the second sentence, short enough to exclude a release's own
// install notes ("you can now run the exe").
const ADVISING_CHARS = 200;
const PUBLISHING_CHARS = 340;

function soundsLikeAdvice(text) {
    return ADVISING_OPEN.test(openingOf(text, ADVISING_CHARS));
}

function saysItIsPublishing(text) {
    const opening = openingOf(text, PUBLISHING_CHARS);
    return PUBLISHING_OPEN.test(opening) || PUBLISHING.test(opening);
}

function describePost(post) {
    const own = ownContent(post.body);
    const text = own.textContent;
    // English-reading rules use `said` (links out); rules that read what a
    // post carries (version, size, name) use `text`, links still in.
    const said = proseContent(own);
    // Flattened so a release word split across a line break still matches.
    const lower = text.replace(/\s+/g, " ").toLowerCase();

    const links = Array.from(own.querySelectorAll("a[href]"))
        .filter((a) => isOffsite(a.getAttribute("href")));

    // Guests see "[[Please login to see this link.]]" instead of an
    // anchor, so those count as links too.
    const hidden = hiddenLinks(own);
    const attached = own.querySelectorAll(ATTACHED).length > 0;

    // A paste's role (file vs. read) is settled by whether the post sounds
    // like it's handing something over.
    const roles = links.map((a) => linkRole(a.getAttribute("href")));
    const handing = saysItIsHandingSomethingOver(text, attached);
    const files = links.filter((_, i) => roles[i] === "file" || (roles[i] === "note" && handing));
    const hosts = linkHosts(files);

    const words = RELEASE_WORDS.filter((word) => lower.includes(word));
    // Version and build id are matched separately and kept apart — an
    // 8-digit build like 24127279 once beat every real version and got
    // announced as the latest release of a game actually on 1.2.4.
    const named = versionsIn(text);

    const score =
        (links.length + hidden) * 3 +
        words.length * 2 +
        (named.version || named.build ? 3 : 0) +
        // `own`, not `post.body` — this term used to still read the quote,
        // so a "thanks" quoting a post with a code block scored for it.
        (own.querySelector(CODE_BLOCKS + ", .spoiler") ? 1 : 0);

    return {
        post,
        links: links.length + hidden,
        hosts,
        // Distinct hosts, not anchors, so 8 mirrors of one upload count once.
        offers: hosts.length + hidden + (attached ? 1 : 0) + (CARRIED_RE.test(text) ? 1 : 0),
        // A post whose every link is a citation has published nothing.
        cites: roles.filter((role) => role === "read").length,
        handing,
        attached,
        asking: looksLikeAQuestion(said),
        failed: reportsAFailure(said),
        replying: looksLikeAReply(said),
        advising: soundsLikeAdvice(said),
        publishing: saysItIsPublishing(said),
        password: passwordIn(text),
        words,
        version: named.version,
        versionNamed: named.named,
        // A companion-product version still shows on its row; it just
        // never sets the headline.
        versionTheirs: named.theirs,
        build: named.build,
        score,
        date: postDate(post),
    };
}

function postDate(post) {
    if (!post.headCell) return null;
    // "Posted:" or "Добавлено:" (Russian interface).
    const match = post.headCell.textContent.match(/(?:Posted|Добавлено):\s*(.+?)(?:\s{2,}|$)/);
    return match ? match[1].trim() : null;
}

function authorName(post) {
    return post.author ? post.author.textContent.trim() : "unknown";
}

function flash(node) {
    if (!motionAllowed()) {
        // No fade with reduced motion: the outline just stops, not dissolves.
        node.style.outline = "2px solid var(--rr-accent)";
        node.style.outlineOffset = "2px";
        setTimeout(() => { node.style.outline = ""; node.style.outlineOffset = ""; }, 1600);
        return;
    }
    node.style.transition = "outline-color 900ms ease";
    node.style.outline = "2px solid var(--rr-accent)";
    node.style.outlineOffset = "2px";
    setTimeout(() => {
        node.style.outlineColor = "transparent";
        setTimeout(() => {
            // Transition cleared too, or it'd animate any later outline.
            node.style.outline = "";
            node.style.outlineOffset = "";
            node.style.transition = "";
        }, 900);
    }, 700);
}

// The only thing in the script that hides with display:none rather than
// folding — a deliberate filter you switch on, off by default, that says
// how many posts it's showing and puts them all back when switched off.
function buildLinkFilter(all, rows) {
    const flagged = new Set(rows.map((row) => row.id));
    let on = false;

    const button = el("button.rr-btn", { type: "button", "aria-pressed": "false" }, [
        icon("filter", 13),
        t("Only posts with links"),
    ]);
    button.addEventListener("click", () => {
        on = !on;
        button.setAttribute("aria-pressed", on ? "true" : "false");
        for (const post of all) {
            const keep = !on || flagged.has(post.id);
            post.table.style.display = keep ? "" : "none";
        }
        // The whole-topic Releases list holds rows for posts off this page;
        // sync it too, or its rows stay stale when the filter is toggled.
        for (const row of document.querySelectorAll(".rr-releases__row")) {
            row.toggleAttribute("data-rr-nolink", on && row.getAttribute("data-links") === "0");
        }
        toast(on ? t("{n} posts shown", { n: rows.length }) : t("All posts shown"));
    });
    return button;
}

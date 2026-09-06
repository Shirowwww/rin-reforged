/* ------------------------------------------------------------------
   The settings catalogue.

   One declarative list drives three things: the defaults, the settings
   panel UI, and the export format. Adding a feature means adding a
   field here, never touching the panel code.

   Field shapes
     toggle   on/off
     seg      a small set of choices, rendered as a segmented control
     range    a number with min/max/step/unit
     text     free text
     swatch   a colour chosen from a fixed set
   `when` hides a field until another field is on, so the panel stays
   readable instead of showing sixty controls at once.

   Groups carry an `icon` and a `short` label: the panel is a rail of
   categories beside the controls rather than one long scroll, and the
   rail needs a name that fits in 150px. Settings are stored flat by
   id, so moving a field between groups costs nothing and needs no
   migration.
   ------------------------------------------------------------------ */

const SETTINGS_SCHEMA = [
    {
        id: "look",
        title: "Appearance",
        short: "Appearance",
        icon: "sliders",
        note: "The forum ships one fixed 2003 stylesheet. These control the replacement.",
        fields: [
            {
                id: "theme", label: "Theme", type: "seg", default: "native",
                desc: "Native is the board's own palette — near-black, grey text, red links — on this layout. Slate is a quieter blue-leaning dark, Carbon drops the blue, Paper is a real light theme.",
                options: [
                    { value: "native", label: "Native" },
                    { value: "slate", label: "Slate" },
                    { value: "carbon", label: "Carbon" },
                    { value: "paper", label: "Paper" },
                    { value: "auto", label: "System" },
                ],
            },
            {
                id: "accent", label: "Accent colour", type: "swatch", default: "rin",
                desc: "Used for actions, active state and unread markers. RIN orange is the colour the board already uses for game titles.",
                options: [
                    { value: "brass", label: "Brass", color: "#e0a338" },
                    { value: "rin", label: "RIN orange", color: "#d46234" },
                    { value: "steam", label: "Steam", color: "#66c0f4" },
                    { value: "moss", label: "Moss", color: "#6bbd85" },
                    { value: "rose", label: "Rose", color: "#e0748c" },
                    { value: "violet", label: "Violet", color: "#a795d8" },
                ],
            },
            {
                id: "density", label: "Density", type: "seg", default: "cosy",
                desc: "How much air each row and post gets.",
                options: [
                    { value: "compact", label: "Compact" },
                    { value: "cosy", label: "Cosy" },
                    { value: "roomy", label: "Roomy" },
                ],
            },
            {
                id: "fontSize", label: "Text size", type: "range", default: 15,
                min: 12, max: 20, step: 1, unit: "px",
                desc: "The original is 11px Verdana.",
            },
            {
                id: "width", label: "Content width", type: "seg", default: "reading",
                desc: "The frame follows the window either way. Reading also caps the line length of a post at about 78 characters, which is where long ones stop being tiring; Wide lets the frame grow further and Full lifts the frame's limit altogether, keeping a post's lines under about 120 characters.",
                options: [
                    { value: "reading", label: "Reading" },
                    { value: "wide", label: "Wide" },
                    { value: "full", label: "Full" },
                ],
            },
            {
                id: "modernIcons", label: "Replace legacy button images", type: "toggle", default: true,
                desc: "Swaps the GIF button set and read/unread checkboxes for vector icons. Off keeps the board's own 2003 imageset.",
            },
            {
                id: "masthead", label: "Show the board's masthead on the index", type: "toggle", default: true,
                desc: "The crosshair emblem and the CS.RIN.RU wordmark the board draws at the top of every page, kept on the index only. The top bar carries the wordmark everywhere else; this is the board's face, once, where you land.",
            },
        ],
    },
    {
        id: "nav",
        title: "Navigation",
        short: "Navigation",
        icon: "home",
        note: "The masthead takes 340px before any content appears. This replaces it.",
        fields: [
            {
                id: "navbar", label: "Compact top bar", type: "toggle", default: true,
                desc: "A 48px sticky bar with the breadcrumb, search, private messages and settings.",
            },
            {
                id: "boardLinks", label: "Board links row", type: "toggle", default: true,
                desc: "Forum rules, FAQ, Chat, Donate and the language switch, which the masthead was the only route to.",
            },
            {
                id: "donateHighlight", label: "Mark the donation link", type: "toggle", default: true,
                desc: "The board runs on donations and is currently asking for them. This gives that one link an outline and a heart rather than leaving it fifth in a row of grey text.",
                when: "boardLinks",
            },
            {
                id: "quickPager", label: "Jump to last page", type: "toggle", default: true,
                desc: "Adds first / last page controls next to every pagination strip. phpBB never links the last page, which is where an update thread is read.",
            },
            {
                id: "backToTop", label: "Back to top button", type: "toggle", default: true,
                desc: "A pair of floating controls for the top and the foot of a long page.",
            },
            {
                id: "progress", label: "Reading progress bar", type: "toggle", default: true,
                desc: "A hairline at the top of the window showing position in the page.",
            },
        ],
    },
    {
        id: "find",
        title: "Search and finding",
        short: "Search",
        icon: "search",
        note: "Main Forum holds 61,000 topics across 615 pages, so finding matters more than paging.",
        fields: [
            {
                id: "palette", label: "Command palette", type: "toggle", default: true,
                desc: "Ctrl+K opens search, forum jumps, bookmarks and every script action in one box.",
            },
            {
                id: "searchDepth", label: "Search looks at", type: "seg", default: "titles",
                options: [
                    { value: "titles", label: "Titles" },
                    { value: "firstpost", label: "+ first post" },
                    { value: "everything", label: "Every post" },
                ],
                desc: "Applies to Ctrl+K. Results are always one row per topic, never one per matching post.",
                when: "palette",
            },
            {
                id: "listFilter", label: "Filter box over a listing", type: "toggle", default: true,
                desc: "Filters the visible topic list as you type, without a page load.",
            },
            {
                id: "prefixTags", label: "Colour topic prefixes", type: "toggle", default: true,
                desc: "Turns [Info], [Release], [Problem] and the rest into coloured tags you can click to filter.",
            },
            {
                id: "finder", label: "Find files and updates in a topic", type: "toggle", default: true,
                desc: "Lists the posts on the page that carry links, a version number or a reupload, newest first. Answers \"where is the current version\" without reading 19 pages.",
            },
            {
                id: "passwordFinder", label: "Find the archive password", type: "toggle", default: true,
                desc: "Almost every release post ends with \"Password: cs.rin.ru\" somewhere, often inside a spoiler. Where a post names one, it is offered beside that post's other controls, with a copy button.",
                when: "finder",
            },
            {
                id: "topicIndex", label: "Index the whole topic", type: "toggle", default: true,
                desc: "Adds a control that reads every page of a topic once and lists everything posted in it — each release, update, repack, crack, reupload and tool — with its version, what kind of thing it is, who posted it, when, and which page. Never runs on its own: it is a click, the answer is kept per topic, and Escape stops it.",
                when: "finder",
            },
        ],
    },
    {
        id: "lists",
        title: "Topic lists",
        short: "Topic lists",
        icon: "filter",
        fields: [
            {
                id: "tightRows", label: "Last post on one line", type: "toggle", default: true,
                desc: "Joins the date and the poster, which the template stacks. Drops the weekday; the full date stays on hover.",
            },
            {
                id: "unreadFromList", label: "Topic titles open at the first unread post", type: "toggle", default: true,
                desc: "The board links the first unread post from a small arrow beside the row. This puts it on the title itself, for rows that actually have unread posts. Needs an account; nothing changes when logged out.",
            },
            {
                id: "hideVisited", label: "Mark topics already opened", type: "toggle", default: true,
                desc: "Fills in the read/unread mark beside a topic this browser has been to. Uses this browser only, so it works while logged out too.",
            },
            {
                id: "bookmarks", label: "Bookmark topics", type: "toggle", default: true,
                desc: "A star on every topic. Bookmarks are listed in the command palette.",
            },
            {
                id: "rowClick", label: "The whole title cell opens the topic", type: "toggle", default: true,
                desc: "Not only the words of the title. Ctrl-click opens it in a new tab; selecting text does nothing.",
            },
            {
                id: "foldWhoIsOnline", label: "Fold Who is online", type: "toggle", default: true,
                desc: "The index lists all 500-odd names in full, which is most of the page, and every forum and topic ends with the list of who is browsing it. This keeps the counts and hides the names behind a control.",
            },
            {
                id: "hideAnnouncements", label: "Collapse global announcements", type: "toggle", default: false,
                desc: "Folds the pinned announcements at the head of a listing into one line.",
            },
            {
                id: "stickyHeads", label: "Keep the column headings in view", type: "toggle", default: true,
                desc: "A hundred rows scroll past the headings that name them. They stay at the top of the window while their own listing is on screen.",
            },
            {
                id: "sortColumns", label: "Sort a listing by clicking a column", type: "toggle", default: true,
                desc: "Replies, Views, Author, Last post and the rest. The rows already on the page are reordered here; nothing is fetched and nothing is sent. Announcements keep their own section. Click again to reverse, a third time for the board's own order.",
            },
            {
                id: "rememberFilter", label: "Remember the prefix filter per forum", type: "toggle", default: false,
                desc: "Coming back to a forum restores the [Release] or [Info] chip that was pressed there last time.",
            },
        ],
    },
    {
        id: "topic",
        title: "Reading a topic",
        short: "Reading",
        icon: "layers",
        note: "A game topic opens with a 4,000 word Steam description before the first useful reply.",
        fields: [
            {
                id: "gameCard", label: "Game info card", type: "toggle", default: true,
                desc: "Reads the first post and rebuilds it as a compact card: store page, AppID, genres, languages, release date.",
            },
            {
                id: "collapseFirst", label: "Fold the Steam description", type: "toggle", default: true,
                desc: "Keeps About the Game, system requirements and screenshots one click away.",
                when: "gameCard",
            },
            {
                id: "externalLinks", label: "External lookups", type: "toggle", default: true,
                desc: "SteamDB, SteamCharts, PCGamingWiki and ProtonDB buttons built from the AppID.",
                when: "gameCard",
            },
            {
                id: "postLayout", label: "Post layout", type: "seg", default: "modern",
                desc: "Modern puts the author on one line above the message. Classic keeps the original column beside it.",
                options: [
                    { value: "modern", label: "Modern" },
                    { value: "classic", label: "Classic" },
                ],
            },
            {
                id: "postTools", label: "Per-post actions", type: "toggle", default: true,
                desc: "Copy link, copy as a quote, reply with quote, and a post number you can link to.",
            },
            {
                id: "foldQuotes", label: "Fold long quotes", type: "toggle", default: true,
                desc: "A quote longer than a few lines is clipped to its opening lines with a control to open it. The text is never taken out of the page: find-in-page, the finder and a screen reader all still read a folded quote in full.",
            },
            {
                id: "foldQuotesLines", label: "Fold a quote over", type: "range", default: 6,
                min: 3, max: 16, step: 1, unit: " lines",
                when: "foldQuotes",
            },
            {
                id: "quietPosts", label: "Fold short low-value replies", type: "toggle", default: false,
                desc: "\"thanks!\", \"+1\" and a lone emoji collapse to one dim line you can click open. Decided from what a post says — never from who wrote it. A post carrying a link, a version, code, an image or a problem report is never folded.",
            },
            {
                id: "quietLimit", label: "Fold replies shorter than", type: "range", default: 120,
                // 400 was a paragraph. At that setting the filter was
                // folding replies that say something, which is the one
                // thing it is built not to do — the tests for it all
                // run at the default and none of them noticed.
                min: 40, max: 240, step: 10, unit: " chars",
                when: "quietPosts",
            },
            {
                id: "resumeReading", label: "Remember where you stopped reading", type: "toggle", default: true,
                desc: "A topic you have read before opens with a control back to the page you were on, and the first post newer than your last visit is marked. Kept in this browser, so it works logged out; needs \"Remember topics you open\".",
                when: "history",
            },
            {
                id: "unreadJump", label: "Jump to the first unread post", type: "toggle", default: true,
                desc: "The board offers this from a topic list but not from inside a topic.",
            },
            {
                id: "collapseSigs", label: "Fold long signatures", type: "toggle", default: true,
                desc: "Signatures over a few lines collapse behind a toggle.",
            },
            {
                id: "spoilerAll", label: "Expand all spoilers button", type: "toggle", default: true,
                desc: "One control in the topic bar for a post that hides its links behind ten separate spoilers.",
            },
            {
                id: "lightbox", label: "Open images in a lightbox", type: "toggle", default: true,
                desc: "Replaces the click-to-resize behaviour.",
            },
            {
                id: "linkifyBare", label: "Mark off-site links", type: "toggle", default: true,
                desc: "Shows the destination host next to links that leave the forum.",
            },
        ],
    },
    {
        id: "write",
        title: "Posting and people",
        short: "Posting",
        icon: "reply",
        fields: [
            {
                id: "quickReply", label: "Reply from the bottom of the thread", type: "toggle", default: true,
                desc: "Loads the board's own reply form in place, so you keep your position in a long topic. Needs an account.",
            },
            {
                id: "saveDraft", label: "Keep an unsent reply", type: "toggle", default: true,
                desc: "What you have typed into the quick reply is kept in this browser against that topic, so closing the tab or following a link and coming back does not lose it. Cleared when the reply is sent, and never sent anywhere.",
                when: "quickReply",
            },
            {
                id: "selectionQuote", label: "Quote what you select", type: "toggle", default: true,
                desc: "Highlight text in a post and a Quote button appears. It goes straight into the reply box when one is open.",
            },
            {
                id: "postingMemory", label: "Remember the posting options", type: "toggle", default: true,
                desc: "Notify me, Attach a signature, Disable BBCode and the rest: whatever was ticked the last time a post was written is ticked again on the next one. Editing an existing post is left alone.",
            },
            {
                id: "hideUsers", label: "Hide posts by someone", type: "toggle", default: true,
                desc: "A control on every post. Hidden posts collapse to one line rather than vanishing, and the list stays in this browser.",
            },
        ],
    },
    {
        id: "steam",
        title: "Steam preview",
        short: "Steam",
        icon: "game",
        note: "Everything else in this script reads the page you are already on. This is the one part that can ask another server a question, so it is off until you turn it on.",
        fields: [
            {
                id: "steamPreview", label: "Preview a game on hover", type: "toggle", default: false,
                desc: "Hovering a topic title in a listing shows the cover, the review score, the tags, the release date and the opening lines of the store description. Focusing the title with the keyboard does the same; Escape closes it.",
            },
            {
                id: "steamLookup", label: "Ask Steam for games it has not seen", type: "toggle", default: true,
                desc: "Without this the preview only shows games already in this browser's cache — every game topic you have opened, since the info card records its AppID. With it, an unknown title is looked up on Steam's public store API and cached. Nothing but the game name is ever sent, and never over the Tor mirror. Needs your userscript manager to allow GM_xmlhttpRequest: the forum only lets the page talk to itself, so without that grant the request never leaves and the card says so.",
                when: "steamPreview",
            },
            {
                id: "steamCacheDays", label: "Keep a looked-up game for", type: "range", default: 30,
                min: 1, max: 120, step: 1, unit: " days",
                when: "steamPreview",
            },
        ],
    },
    {
        id: "a11y",
        title: "Accessibility",
        short: "Accessibility",
        icon: "keyboard",
        fields: [
            {
                id: "shortcuts", label: "Keyboard shortcuts", type: "toggle", default: true,
                desc: "j/k to move between posts, g then i for the index, ? for the full list.",
            },
            {
                id: "readableInk", label: "Make the board's own colours readable", type: "toggle", default: true,
                desc: "The board colours a username by the group it is in, and several of those come out at about 2.5:1 against the page — well under what small text needs. This keeps the colour and the hue and lifts only its brightness, by the least it takes to be readable. Off leaves them exactly as the board wrote them.",
            },
            {
                id: "skipLink", label: "Skip to content link", type: "toggle", default: true,
                desc: "The first thing Tab reaches, so the top bar is not eight tabs in front of the first topic on every page.",
            },
            {
                id: "reduceMotion", label: "Turn off animation", type: "toggle", default: false,
                desc: "Transitions and smooth scrolling are already dropped when the system asks for reduced motion. This forces it regardless of the system setting.",
            },
        ],
    },
    {
        id: "privacy",
        title: "Behaviour",
        short: "Behaviour",
        icon: "settings",
        fields: [
            {
                id: "history", label: "Remember topics you open", type: "toggle", default: true,
                desc: "Stored in this browser and never sent anywhere. Powers Recent in the palette.",
            },
            {
                id: "historyLimit", label: "Topics to remember", type: "range", default: 60,
                min: 10, max: 300, step: 10, unit: "",
                when: "history",
            },
            {
                id: "confirmExternal", label: "Confirm before leaving to another site", type: "toggle", default: false,
                desc: "Asks first, showing the full address, when a link in a post leads off the forum. Off by default because it adds a click.",
            },
            {
                id: "coexist", label: "Stand down for CS.RIN.RU Enhanced", type: "toggle", default: true,
                desc: "If the Enhanced userscript is running, leave the Steam header on a game topic to it instead of drawing a second one. The hover preview stays: Enhanced's previews a post, this one previews the game.",
            },
        ],
    },
];

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

   A setting is a question put to every reader who opens the panel, so
   anything with one sensible answer is not one: those are simply how
   the script behaves. A value stored for a field that has since gone
   is ignored, never an error.
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
                desc: "Reading caps a post's lines at about 78 characters; Wide lets the frame grow further; Full lifts the frame's limit altogether.",
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
                desc: "The crosshair emblem and the CS.RIN.RU wordmark, kept on the index only. Everywhere else the top bar carries the name.",
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
                desc: "Unanswered and active topics, forum rules, FAQ, chat, donate, your account and the language switch, grouped on one line.",
            },
            {
                id: "quickPager", label: "Jump to last page", type: "toggle", default: true,
                desc: "First and last page controls beside every pager. phpBB never links the last page, which is where an update thread is read.",
            },
            {
                id: "backToTop", label: "Back to top button", type: "toggle", default: true,
                desc: "A pair of floating controls for the top and the foot of a long page.",
            },
            {
                id: "progress", label: "Reading progress bar", type: "toggle", default: true,
                desc: "A hairline under the top bar showing how far down the page you are.",
            },
        ],
    },
    {
        id: "find",
        title: "Search and finding",
        short: "Search",
        icon: "search",
        note: "Main Forum holds 61,000 topics across 615 pages, so finding matters more than paging. Where a search looks — this forum or the whole board, titles or every post — is chosen in the search box itself.",
        fields: [
            {
                id: "palette", label: "Command palette", type: "toggle", default: true,
                desc: "Ctrl+K opens search, forum jumps, bookmarks and every script action in one box.",
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
                id: "finder", label: "Releases panel", type: "toggle", default: true,
                desc: "Lists the posts on the page that carry a release, an update or a reupload, with the version and the file host. A post that names an archive password offers it with a copy button.",
            },
            {
                id: "topicIndex", label: "Read the whole topic", type: "toggle", default: true,
                desc: "The panel can read every page of a topic once, on a click, and list everything ever posted in it. Never runs on its own; Escape stops it.",
                when: "finder",
            },
        ],
    },
    {
        id: "lists",
        title: "Topic lists",
        short: "Topic lists",
        icon: "filter",
        note: "Announcements, stickies and the topics fold on a click on their heading, and stay folded until you open them again.",
        fields: [
            {
                id: "unreadFromList", label: "Topic titles open at the first unread post", type: "toggle", default: false,
                desc: "Off, a title opens the first page of its topic. On, a topic with unread posts opens at the first of them. Needs an account.",
            },
            {
                id: "hideVisited", label: "Mark topics already opened", type: "toggle", default: true,
                desc: "Fills in the read/unread mark beside a topic this browser has been to, so it works while logged out too.",
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
                desc: "Keeps the counts and hides the 500-odd names behind a control, on the index and under every forum and topic.",
            },
            {
                id: "stickyHeads", label: "Keep the column headings in view", type: "toggle", default: true,
                desc: "The headings stay at the top of the window while their listing is on screen.",
            },
            {
                id: "sortColumns", label: "Sort a listing by clicking a column", type: "toggle", default: true,
                desc: "Replies, Views, Author, Last post and the rest reorder the rows already on the page. Click again to reverse, a third time for the board's own order.",
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
                desc: "Reads the first post and draws it as a card: store page, AppID, genres, languages, release date, with lookups to SteamDB, SteamCharts, ProtonDB and PCGamingWiki. The original post stays under it, with a control to fold it.",
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
                id: "spoilersOpen", label: "Open spoilers", type: "toggle", default: true,
                desc: "Every spoiler on the page starts open, so a release post reads top to bottom. The topic bar closes them all again in one click.",
            },
            {
                id: "spoilerAll", label: "Open or close all spoilers button", type: "toggle", default: true,
                desc: "One control in the topic bar for a post that hides its links behind ten separate spoilers.",
            },
            {
                id: "foldQuotes", label: "Fold long quotes", type: "toggle", default: true,
                desc: "A quote longer than a few lines is clipped to its opening lines with a control to open it. The text is never taken out of the page.",
            },
            {
                id: "foldQuotesLines", label: "Fold a quote over", type: "range", default: 6,
                min: 3, max: 16, step: 1, unit: " lines",
                when: "foldQuotes",
            },
            {
                id: "quietPosts", label: "Fold short low-value replies", type: "toggle", default: false,
                desc: "\"thanks!\", \"+1\" and a lone emoji collapse to one dim line you can click open. Decided from what a post says — never from who wrote it.",
            },
            {
                id: "quietLimit", label: "Fold replies shorter than", type: "range", default: 120,
                min: 40, max: 240, step: 10, unit: " chars",
                when: "quietPosts",
            },
            {
                id: "resumeReading", label: "Remember where you stopped reading", type: "toggle", default: true,
                desc: "A topic you have read before offers a control back to the page you were on, and the first post newer than your last visit is marked. Needs \"Remember topics you open\".",
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
                desc: "What you have typed into the quick reply is kept in this browser against that topic. Cleared when the reply is sent, and never sent anywhere.",
                when: "quickReply",
            },
            {
                id: "selectionQuote", label: "Quote what you select", type: "toggle", default: true,
                desc: "Highlight text in a post and a Quote button appears. It goes straight into the reply box when one is open.",
            },
            {
                id: "postingMemory", label: "Remember the posting options", type: "toggle", default: true,
                desc: "Notify me, Attach a signature, Disable BBCode and the rest: whatever was ticked the last time is ticked again on the next post.",
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
                desc: "Hovering a topic title in a listing shows the cover, the review score, the tags, the release date and the opening lines of the store description. Escape closes it.",
            },
            {
                id: "steamLookup", label: "Ask Steam for games it has not seen", type: "toggle", default: true,
                desc: "Without this the preview only shows games this browser has already opened a topic for. With it, an unknown title is looked up on Steam's public store API and kept for a month. Nothing but the game name is ever sent, and never over the Tor mirror.",
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
                desc: "The board colours a username by its group, and several of those come out at about 2.5:1 against the page. This keeps the hue and lifts only the brightness, by the least it takes to be readable.",
            },
            {
                id: "reduceMotion", label: "Turn off animation", type: "toggle", default: false,
                desc: "Transitions and smooth scrolling are already dropped when the system asks for reduced motion. This forces it regardless.",
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
                desc: "Stored in this browser and never sent anywhere. Powers Recent in the palette and the reading position.",
            },
            {
                id: "confirmExternal", label: "Confirm before leaving to another site", type: "toggle", default: false,
                desc: "Asks first, showing the full address, when a link in a post leads off the forum.",
            },
            {
                id: "coexist", label: "Stand down for CS.RIN.RU Enhanced", type: "toggle", default: true,
                desc: "If the Enhanced userscript is running, leave the Steam header on a game topic to it instead of drawing a second one.",
            },
        ],
    },
];

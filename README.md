# RIN Reforged

A userscript that rebuilds the [CS.RIN.RU](https://cs.rin.ru/forum/) forum:
modern themes, real mobile support, a game info card, a releases finder, a
command palette and a settings panel — without changing anything on the board
itself.

| Before | After |
| --- | --- |
| ![The forum as it ships](docs/screenshots/viewforum-1440.png) | ![The same page with RIN Reforged](docs/screenshots/forum-dark.png) |

## Install

1. Install a userscript manager:
   [Violentmonkey](https://violentmonkey.github.io/) or
   [Tampermonkey](https://www.tampermonkey.net/).
2. **[Click here to install RIN Reforged](https://raw.githubusercontent.com/Shirowwww/rin-reforged/main/dist/rin-reforged.user.js)** —
   the manager will open an install prompt.
3. Open <https://cs.rin.ru/forum/>. You should see a slim dark bar at the top
   with the board name on the left and a search box on the right. Press `?` for
   the shortcut list, or click the cog for settings.

**Updates are automatic.** The script declares an update URL, so your manager
checks this repository and offers new versions on its own.

> **Chrome / Edge with Tampermonkey** need Developer Mode switched on at
> `chrome://extensions` before any userscript runs. Violentmonkey does not.

## What it does

- **Sorts a listing where the board cannot.** Click Replies, Views, Author or
  Last post to reorder the rows already on the page; the headings stay in view
  as you scroll, and an **Unread** chip narrows a hundred rows to the ones with
  something new in them. **Global Announcements, Announcements, Stickies and
  Topics fold** on a click on their heading, and stay folded next time.
- **Remembers where you stopped.** A topic you have read before opens with a
  control back to the page you were on and a divider before the first post
  newer than your last visit — in this browser, so it works logged out too.
- **Reads the release for you.** The Releases panel names the file host behind
  every entry and copies the list as text; a post that states an archive
  password offers it with a copy button, and a post with several mirrors copies
  them all at once. The panel folds away on a topic you are reading for the
  conversation. Spoilers open at load — on this board they are where the links
  are — and one control in the topic bar closes them all again.
- **Four themes** — Native (the board's own black/grey/red, the default),
  Slate, Carbon and a real light theme — six accent colours, three densities
  and an adjustable text size.
- **Works on a phone.** The board ships no viewport tag and lays everything out
  in fixed tables; the script injects the tag and unpacks them into stacked
  blocks.
- **Finds the current version.** A **Releases** panel lists everything ever
  posted in a topic — release, update, repack, crack, hypervisor crack, clean
  Steam files, online fix, DLC unlocker, trainer, language pack, tool — with
  its version, who posted it, when, and which page it is on. It lists what a
  post is *offering*: a question about a release, a link to a store page or a
  patch note, and a pasted log are not releases, and a release that hides its
  mirrors inside a spoiler is. The highest version anybody posted **of the
  game** is called out at the top — not the trainer's, not the emulator's, not
  the number in a reply that dropped a digit.
- **Game info card** on the first post of a game thread: header art, AppID,
  developer, publisher, release date, genres and languages, with the Steam
  marketing copy folded away and lookups to SteamDB, the store, SteamCharts,
  ProtonDB and PCGamingWiki.
- **Gets you around** — `Ctrl+K` command palette, keyboard shortcuts (`j`/`k`
  walk the posts of a topic or the rows of a listing), a real pager that
  links the last page, filter-as-you-type over a listing (every word you
  type has to match, in any order), coloured topic tags, a whole title cell
  that opens its topic, bookmarks and history kept in your browser. The
  board's search box says where it looks: this topic, this forum or the
  whole board, titles or every post, chosen in the box itself.
- **Topics in the palette, and a look inside one.** The board allows one
  search about every half minute and answers the ones in between with
  "you cannot use search at this time", so `Ctrl+K` does not search as you
  type — it filters the titles from every listing you have opened, which
  costs nothing and cannot be refused. Rest on one and a pane beside the
  palette reads its first page: the board it is in, how long it runs, who
  opened it, what they said and the first picture they posted. One request
  per topic, only when you stop on it, and the row that hands the query to
  the board is still there for a thread nobody here has seen.
- **Optional Steam preview** on hover over a topic title: cover, review score,
  tags and the opening lines of the store description. This is the only thing
  in the script that talks to a server other than the forum, so it is **off
  until you turn it on**, and refused outright on the Tor mirror.
- **Better posting** — quick reply from the foot of the thread with a small
  BBCode toolbar, quote what you select, an unsent reply kept in your
  browser, long quotes and low-value replies folded (never removed), images
  in a lightbox you can close and leave by keyboard.
- **A writing toolbar you can read.** On the reply form the board's sixteen
  grey rectangles — `s`, `[*]`, `List=`, `spoiler=`, `Generate SteamInfo
  BBCode` — say what they make, with an icon each and the bar cut into
  groups. What a button does is a small label above it on hover and on
  keyboard focus, instead of the read-only field under the bar that looked
  like a second Subject box. Under the form, the last posts of the thread
  are cards with air between them rather than one continuous slab.
- **Signed in, too.** The member list, the message folders, Who is online,
  the control panel, the posting form and profiles get the same treatment:
  they are listings, with labelled and aligned columns, striped rows,
  grouped numbers, one-line dates, English ranks, a colour palette you can
  actually hit, profile rows that say nothing hidden, Subscribe /
  Bookmark / E-mail friend in the topic bar rather than in a strip of their
  own, and every "Go to page" strip as a row of chips.
- **On a phone** the same pages are cards with one rhythm — the board
  bar folds into a real menu, the member list and the control panel are
  lists rather than stacks of cards, and the settings panel is a sheet
  with its categories as tabs.
- **Works on the Russian interface too.** Half the board reads it. Column
  names, page counters, weekdays, "Joined / Posts" and "Posted" are read in
  both languages, so a Russian page gets the same grouped numbers, one-line
  dates, pager and post headers as an English one — and the script's own
  controls speak Russian there: Ответить, Первое непрочитанное, Релизы,
  Показать все 300 имён. Only the settings panel stays in English.
- **Readable, and measured.** Every colour this script paints meets WCAG AA on
  all four themes — 7 688 pieces of text checked across six pages, and the
  check fails the build if one slips. The board's own group-coloured usernames
  are kept and lifted too: same hue, the least change in brightness that makes
  them readable, and a switch to leave them exactly as the board wrote them.

Every feature that is a real choice has a switch, with a sentence saying what
it does. Open the settings panel with the cog in the top bar.

![The releases panel](docs/screenshots/releases.png)

## Notes

- **Nothing is written to the board.** Disabling the script leaves no trace.
- **It does not bypass anything.** Links behind "Please login to see this link"
  stay hidden, the reply form is the board's own.
- **The Tor mirror works** — the `@match` covers the `.onion` address.
- **Running alongside [CS.RIN.RU Enhanced](https://github.com/SubZeroPL/cs-rin-ru-enhanced-mod)**
  is fine. The two overlap in a couple of places; RIN Reforged detects it and
  stands down on those by default (*Behaviour → Stand down for CS.RIN.RU
  Enhanced*).
- **Private or container windows** get their own storage, so bookmarks, history
  and settings do not follow you into one.

## Building

No dependencies, no transpiling — the sources in `src/` are plain scripts
stitched into one userscript.

```sh
node build.js                  # -> dist/rin-reforged.user.js
node --check dist/rin-reforged.user.js
```

`dist/rin-reforged.user.js` is committed, because that is the file people
install. CI rebuilds it and fails if it does not match `src/`.

## Testing

`test/` renders saved copies of real board pages with the built script
attached, so changes are checked against the actual markup.

```sh
npm i -D playwright-core
node test/make-quotes-fixture.js   # regenerate the synthesised fixtures
node test/make-member-fixtures.js  # the pages only a member sees, made up
node test/make-posting-fixture.js  # the reply form, toolbar and topic review
node test/prepare.js               # build test/pages from test/fixtures
python test/serve.py &             # http://localhost:8731
export RR_CHROME=/path/to/chrome

node test/check.js                 # every page, 7 widths, 9 settings combinations
node test/features.js              # does each feature still do its job
node test/live.js                  # the same, against cs.rin.ru itself
node test/sweep.js                 # fifty real pages, twenty questions each
node test/contrast.js              # every colour, every theme, against WCAG AA
node test/scan.js --local --repeat # what reading a whole topic costs
node test/perf.js                  # what the script costs to run
```

More in [docs/DESIGN.md](docs/DESIGN.md): why each feature works the way it
does, and what the tests are actually proving.

## Credits

- The board, and the staff who keep it running.
- [CS.RIN.RU Enhanced](https://github.com/SubZeroPL/cs-rin-ru-enhanced-mod) by
  RoyalGamer06, SubZeroPL, Reddiepoint and Altansar69 — the prior art here.
- [Revereor](https://github.com/ltguillaume/phpbb-revereor) and
  [damaio](https://github.com/cabot/damaio), two modern phpBB styles.

## License

[Unlicense](UNLICENSE.txt) — public domain.

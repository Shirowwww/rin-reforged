#!/usr/bin/env node
/* ------------------------------------------------------------------
   Builds test/fixtures/viewtopic-quotes.html.

   The saved board pages are real threads, and none of them happens to
   contain the case the finder used to get wrong: a release post
   followed by replies that quote it and say nothing of their own. That
   case is what made one upload appear four times in "On this page", so
   it needs a page of its own.

   The skeleton is the real replies fixture — same template, same
   classes, same surrounding chrome — with the run of post tables
   swapped for a set that isolates the case:

     p900001  a release: a version, a release word, two hidden links
     p900002  a reply quoting it whole, adding "thank you"
     p900003  a reply quoting it whole, adding "link is dead"
     p900004  a reply quoting only the quote of it
     p900005  a second, genuine release by someone else
     p900006  ordinary chatter

   The finder must list 900001 and 900005, and nothing else.

       node test/make-quotes-fixture.js
   ------------------------------------------------------------------ */

const fs = require("fs");
const path = require("path");

const FIXTURES = path.join(__dirname, "fixtures");
const SOURCE = path.join(FIXTURES, "viewtopic-replies.html");
const TARGET = path.join(FIXTURES, "viewtopic-quotes.html");
const MEMBER = path.join(FIXTURES, "viewtopic-member.html");
const LOCKED = path.join(FIXTURES, "viewtopic-locked.html");
const CHATTER = path.join(FIXTURES, "viewtopic-chatter.html");
const LISTING = path.join(FIXTURES, "viewforum-unread.html");
const FORUM_SOURCE = path.join(FIXTURES, "viewforum.html");
const POSTING = path.join(FIXTURES, "posting.html");
const SINGLE = path.join(FIXTURES, "viewtopic-single.html");
const HYPERVISOR_PAGES = 2;
const HYPERVISOR_PER_PAGE = 4;
const THREAD_PAGES = 5;
const LONG_PAGES = 20;
const THREAD_PER_PAGE = 6;

const SID = "58ea12208ff859b805cc1a28ecf51e8a";
const STYLES = "./styles/rinDark";

const HIDDEN_LINK = (label) =>
    '<span class="link_removed">' + label +
    ' <span style="font-style: italic; color: #96964C">[[Please login to see this link.]]</span></span>';

const QUOTE = (who, what) =>
    '<div class="quotetitle">' + who + ' wrote:</div>' +
    '<div class="quotecontent">' + what + "</div>";

/* The release everyone quotes. Held as a string so the replies can
   quote it verbatim, which is what the board does. */
const RELEASE_BODY =
    "Update to v1.4.2 is up. Repack and clean steam files, crack included.<br />" +
    HIDDEN_LINK("Mirror 1") + "<br />" + HIDDEN_LINK("Mirror 2");

const POSTS = [
    {
        id: "900001",
        author: "Rogue",
        colour: "#BF0000",
        rank: "Advanced Member",
        posted: "Monday, 04 May 2026, 09:15",
        subject: "Re: [Release] Test Game",
        body: RELEASE_BODY,
    },
    {
        id: "900002",
        author: "Grateful",
        colour: "#5C8FBF",
        rank: "Junior Member",
        posted: "Monday, 04 May 2026, 09:40",
        subject: "Re: [Release] Test Game",
        body: QUOTE("Rogue", RELEASE_BODY) + "<br />Thank you very much!",
    },
    {
        id: "900003",
        author: "Passerby",
        colour: "#5C8FBF",
        rank: "Junior Member",
        posted: "Monday, 04 May 2026, 11:02",
        subject: "Re: [Release] Test Game",
        body: QUOTE("Rogue", RELEASE_BODY) + "<br />Works for me, thanks.",
    },
    {
        id: "900004",
        author: "Latecomer",
        colour: "#5C8FBF",
        rank: "Junior Member",
        posted: "Monday, 04 May 2026, 14:20",
        subject: "Re: [Release] Test Game",
        body: QUOTE("Grateful", QUOTE("Rogue", RELEASE_BODY) + "<br />Thank you very much!") +
              "<br />Same here.",
    },
    {
        id: "900005",
        author: "Mirrorman",
        colour: "#BF0000",
        rank: "Advanced Member",
        posted: "Tuesday, 05 May 2026, 08:00",
        subject: "Re: [Release] Test Game",
        body: "Reupload of v1.4.2 on a different host, plus the DLC unlocker.<br />" +
              HIDDEN_LINK("Alternative mirror"),
    },
    {
        id: "900006",
        author: "Chatter",
        colour: "#5C8FBF",
        rank: "Junior Member",
        posted: "Tuesday, 05 May 2026, 09:30",
        subject: "Re: [Release] Test Game",
        body: "Does anyone know if this runs on Linux?",
    },
];

/* ------------------------------------------------------------------
   The cast for the noise filter.

   Every post here is short. Five of them say nothing on their own and
   should fold; five say something and must not, each for a different
   reason - a question, a problem report, a link, a version number, and
   plain length. A test that only proved the folding works would pass
   just as well on a filter that folded everything.
   ------------------------------------------------------------------ */
const CHATTER_POSTS = [
    { id: "910001", author: "Grateful",  quiet: true,  body: "Thanks a lot!" },
    { id: "910002", author: "Brief",     quiet: true,  body: "thx" },
    { id: "910003", author: "Emoji",     quiet: true,  body: "\ud83d\ude4f\ud83d\ude4f" },
    { id: "910004", author: "Waiting",   quiet: true,  body: "+1, been waiting for this one" },
    { id: "910005", author: "Reporter",  quiet: false, body: "Link is dead, can someone reupload?" },
    { id: "910006", author: "Asker",     quiet: false, body: "Does this include the DLC?" },
    { id: "910007", author: "Mirrorman", quiet: false, body: "Mirror: " + HIDDEN_LINK("here") },
    { id: "910008", author: "Uploader",  quiet: false, body: "Updated to v2.1.0" },
    { id: "910009", author: "Pleased",   quiet: true,  body: "Works great, thank you!" },
    // Chatter, but long enough to wrap. Every other quiet post here
    // fits on one line, and a fold that clips to one line clips
    // nothing off them — which is a test that cannot fail.
    {
        id: "910011", author: "Effusive", quiet: true,
        body: "Thank you so very much for taking the time to put this up, " +
              "I have been waiting on it for months and months and months.",
    },
    {
        id: "910010", author: "Detailed", quiet: false,
        body: "For anyone on Windows 10 the launcher needs to be started as administrator " +
              "the first time, otherwise the save directory is created under a path the game " +
              "cannot write to afterwards and every session starts from scratch.",
    },
].map((post) => Object.assign({
    colour: "#5C8FBF",
    rank: "Junior Member",
    posted: "Wednesday, 06 May 2026, 10:00",
    subject: "Re: [Release] Test Game",
}, post));

/** One post, in the board's own markup: the header strip with the
    permalink and the quote control, the profile column, the message,
    and the footer strip with the profile link. */
function renderPost(post, index) {
    const row = index % 2 === 0 ? "row1" : "row2";
    return `<table class="tablebg" width="100%" cellspacing="1">
	<tr class="${row}">
			<td align="center" valign="middle">
				<a name="p${post.id}"></a>
				<b class="postauthor" style="color: ${post.colour}">${post.author}</b>
			</td>
			<td width="100%" height="25">
				<table width="100%" cellspacing="0">
				<tr>
					<td class="gensmall" width="100%"><div style="float: left;"><br><a href="./viewtopic.php?p=${post.id}&amp;sid=${SID}#p${post.id}"><img src="${STYLES}/imageset/icon_post_target.gif" width="12" height="9" alt="Post" title="Post" /></a>&nbsp;<b>Post subject:</b> ${post.subject}&nbsp;&nbsp;&nbsp;</div><div style="float: right;"><b>Posted:</b> ${post.posted}&nbsp;&nbsp;&nbsp;<a href="./posting.php?mode=quote&amp;f=14&amp;p=${post.id}&amp;sid=${SID}"><img src="${STYLES}/imageset/en/icon_post_quote.gif" alt="Reply with quote" title="Reply with quote" /></a> </div></td>
				</tr>
				</table>
			</td>
		</tr>

		<tr class="${row}">
			<td valign="top" class="profile">
				<table cellspacing="4" align="center" width="150">
				<tr>
					<td class="postdetails">${post.rank}</td>
				</tr>
				</table>
				<span class="postdetails">
					<b>Joined:</b> Tuesday, 15 Nov 2005, 17:09<br /><b>Posts:</b> 1200
				</span>
			</td>
			<td valign="top">
				<table width="100%" cellspacing="5">
				<tr>
					<td>
						<div class="postbody">${post.body}</div>
					<br clear="all" /><br />
						<table width="100%" cellspacing="0">
						<tr valign="middle">
							<td class="gensmall" align="right">
							</td>
						</tr>
						</table>
					</td>
				</tr>
				</table>
			</td>
		</tr>

		<tr class="${row}">
			<td class="profile"><strong><a href="#wrapheader">Top</a></strong></td>
			<td><div class="gensmall" style="float: left;">&nbsp;<a href="./memberlist.php?mode=viewprofile&amp;u=${900000 + index}&amp;sid=${SID}"><img src="${STYLES}/imageset/en/icon_user_profile.gif" alt="Profile" title="Profile" /></a> &nbsp;</div> <div class="gensmall" style="float: right;">  <span style="vertical-align: 4px;"></span>  </div></td>
		</tr>

	<tr>
		<td class="spacer" colspan="2" height="1"><img src="images/spacer.gif" alt="" width="1" height="1" /></td>
	</tr>
	</table>`;
}

/* ------------------------------------------------------------------
   Two more variants, for the features that only exist once someone is
   logged in.

   Every saved page is a logged-out view, so the quick reply — which
   needs an account and needs the topic to be open — could not be tested
   at all. These give it the two cases that matter: a member on a topic
   they may reply to, and a member on a locked one.
   ------------------------------------------------------------------ */

/* The strip of topic actions the board only prints for a member.

   subsilver2 types the bars between these links into the template
   beside each link rather than generating them between the ones that
   survive, so a link the reader is not offered still leaves its
   separator behind. Two shapes of that were reported off the live
   board and neither can be seen logged out:

     - a link missing from the middle, leaving `Bookmark topic | |
       E-mail friend`;
     - a link missing from the end, leaving a lone `|` hanging at the
       right-hand edge of a cell that is still 100% wide, with the rest
       of the strip an acre away on the left.

   Both are reproduced here, in one strip, in the exact cell the board
   puts them in. The doubled pair is deliberately written as one run of
   text — `&nbsp;|&nbsp;&nbsp;|&nbsp;` is a single text node once the
   browser has parsed it, which is the case a fix written for one bar
   per node walks straight past. */
const MEMBER_TOPIC_ACTIONS =
    '<a href="./viewtopic.php?f=14&amp;t=75717&amp;unwatch=topic">Unsubscribe topic</a>&nbsp;|&nbsp;' +
    '<a href="./viewtopic.php?f=14&amp;t=75717&amp;bookmark=1">Bookmark topic</a>&nbsp;|&nbsp;&nbsp;|&nbsp;' +
    '<a href="./memberlist.php?mode=email&amp;t=75717">E-mail friend</a>&nbsp;|&nbsp;';

/* And the third shape: a post's own controls row, where every link was
   conditional and none of them applied, leaving the cell holding one
   bar and nothing else. The cell is right-aligned inside a full-width
   table, so what shows is a single character floating at the far edge
   of the post with an acre of nothing beside it. */
const MEMBER_POST_CONTROLS = '&nbsp;|&nbsp;';

/** Swap the masthead's Login link for a Logout one, and print the
    member-only topic actions. isLoggedIn() reads the first exactly
    that way, as the board's own template does. */
function asMember(html) {
    return html.replace(/mode=login/g, () => "mode=logout")
               .replace(/> Login</g, () => "> Logout<")
               .replace(/(<td class="gensmall" width="100%" align="right" nowrap="nowrap">)(<\/td>)/,
                   (_all, open, close) => open + MEMBER_TOPIC_ACTIONS + close)
               .replace(/(<td class="gensmall" align="right">)(\s*)(<\/td>)/,
                   (_all, open, gap, close) => open + MEMBER_POST_CONTROLS + gap + close);
}

/** Strip what the board omits on a locked topic: the reply route. A
    padlock takes its place, which is what misled the old check. */
function asLocked(html) {
    return html
        .replace(/<a href="\.\/posting\.php\?mode=reply[^"]*">[\s\S]*?<\/a>/g, () =>
            '<img src="./styles/rinDark/imageset/en/button_topic_locked.gif" ' +
            'alt="Topic is locked" title="Topic is locked" />')
        .replace(/mode=reply/g, () => "mode=locked");
}

/* A topic with one page.

   Every saved page in this harness is a page of a long thread, so the
   short case — which is most of the board, and the case the panel and
   the action bar were both reported as getting wrong — could not be
   tested at all. "Page 1 of 1" was still being drawn and no check
   noticed, because no check had a one page topic to look at.

   The pager strip is rewritten rather than removed: what the board
   prints for a topic that fits on one page is the strip with no page
   links in it, which is exactly the markup that has to be read
   correctly. */
function asSinglePage(html) {
    const strip = '<table class="tablebg" width="100%" cellspacing="1"><tr><td class="cat">' +
        '<table width="100%" cellspacing="0"><tr>' +
        '<td class="nav" valign="middle" nowrap="nowrap">&nbsp;Page <strong>1</strong> of <strong>1</strong><br /></td>' +
        '<td class="gensmall" nowrap="nowrap">&nbsp;[ 6 posts ]&nbsp;</td>' +
        '<td class="gensmall" width="100%" align="right" nowrap="nowrap"></td>' +
        "</tr></table></td></tr></table>";
    return html
        .replace(/<table class="tablebg" width="100%" cellspacing="1">\s*<tr>\s*<td class="cat">[\s\S]*?<\/table>\s*<\/td>\s*<\/tr>\s*<\/table>/,
            () => strip)
        .replace(/Page <strong>\d+<\/strong> of <strong>\d+<\/strong>/g,
            () => "Page <strong>1</strong> of <strong>1</strong>")
        // The "Go to page 1, 2, 3 ..." strip under the title goes with
        // them: a one page topic has none.
        .replace(/<p class="gensmall">\s*<b>Go to page<\/b>[\s\S]*?<\/p>/g, () => "");
}

/* ------------------------------------------------------------------
   A hypervisor release thread, in the words the board actually uses.

   Every phrase below is taken off a real topic — Assassin's Creed
   Black Flag Resynced, f=41 t=157669, thirty-three pages — because
   three things about it were wrong when it was read with the patterns
   that came from the other saved threads, and none of the three could
   be reproduced from them:

   1. **The version has no v in it.** Ubisoft ships Title Updates and
      the release posts say so in the publisher's words: "Game version
      is Title Update 1.0.7". Read by a pattern that wanted a v, all
      thirty-three pages had no version anywhere in them.

   2. **A hypervisor crack is its own kind of release**, with its own
      how-to threads on this board, and the posts announce it in the
      title line — "…Resynced HYPERVISOR - DenuvOwO", "Learn more here
      on HV releases". It came back as an ordinary crack.

   3. **Not every version in a topic is the game's.** A post about
      achievement popups says "Download v1.6.0 or later lightweight
      AchievementOverlay by Oleg Savelyev"; 1.6.0 beats 1.0.7 on the
      second digit, so the panel's headline said the game was on 1.6.0.
      The version here is 9.9.9 rather than 1.6.0 only so that a test
      failing on it cannot be read as an off-by-one somewhere else.
   ------------------------------------------------------------------ */
const HYPERVISOR_POSTS = [
    {
        id: "940001",
        author: "DenuvOwO",
        colour: "#BF0000",
        rank: "Upload Crew",
        posted: "Monday, 04 May 2026, 09:15",
        subject: "Re: [Info] Test Game Resynced [CRACKED]",
        body: "Test Game Resynced HYPERVISOR - DenuvOwO<br />" +
            "Crack: " + HIDDEN_LINK("here") + "<br />" +
            "Ubisoft exe: " + HIDDEN_LINK("here") + "<br /><br />" +
            "Game version is Title Update 1.0.7<br /><br />" +
            "Learn more here on HV releases",
    },
    {
        id: "940002",
        author: "LikeAG6",
        colour: "#5C8FBF",
        rank: "Advanced Member",
        posted: "Monday, 04 May 2026, 10:02",
        subject: "Re: [Info] Test Game Resynced [CRACKED]",
        // The other spelling, and the only one in this post: the board
        // shortens it once it has said it in full once.
        body: "Both Test.Game.Resynced.zip (65.9GB) and " +
            "Test.Game.Resynced.Title.Update.1.0.4.zip (67.8GB) by DenuvOwO will be " +
            "deleted shortly to make space for Title Update 1.0.5.<br />" +
            "Mirror of the HV build: " + HIDDEN_LINK("here"),
    },
    {
        id: "940003",
        author: "ant_sh",
        colour: "#5C8FBF",
        rank: "Junior Member",
        posted: "Monday, 04 May 2026, 11:40",
        subject: "Re: [Info] Test Game Resynced [CRACKED]",
        body: "New inventory cheat tables for 1.0.4 on Fearless.<br />" +
            "Configure a 3rd party program to monitor changes and display the " +
            "achievement notification popups.<br />" +
            "Download v9.9.9 or later lightweight AchievementOverlay by Oleg Savelyev " +
            HIDDEN_LINK("here") + "<br />" + HIDDEN_LINK("table"),
    },
    {
        id: "940004",
        author: "kanggg",
        colour: "#5C8FBF",
        rank: "Advanced Member",
        posted: "Monday, 04 May 2026, 11:55",
        subject: "Re: [Info] Test Game Resynced [CRACKED]",
        /* A scene trainer, named the way FLiNG names them: the game
           versions it covers, then the day the trainer was built. The
           rule that reads "Updated 1.0.5" as a version reads
           "Updated.2026.09.02" the same way, and that date beats every
           real version this board will ever see. */
        body: "Test.Game.Resynced.v1.0-v1.0.x.Plus.30. Trainer.Updated.2026.09.02 -FLiNG<br />" +
            HIDDEN_LINK("Download"),
    },
    {
        id: "940008",
        author: "Lumi_",
        colour: "#5C8FBF",
        rank: "Advanced Member",
        posted: "Monday, 04 May 2026, 12:10",
        subject: "Re: [Info] Test Game Resynced [CRACKED]",
        /* A mod's changelog, in a post that also talks about the
           hypervisor crack. "Updated ACBlackFlagFix to 2.8.3!" on the
           live board: a product name between the label and the number,
           so no labelled form matches and the bare one does — and
           2.8.3 beat 1.0.7 to the headline. A bare number is shown on
           its row and never sets the line. */
        body: "Updated TestGameFix to 2.8.3!<br />Changelog: new AimTransitionDurationMs option; " +
            "works with the hypervisor crack.<br />" + HIDDEN_LINK("Download"),
    },
    {
        id: "940005",
        author: "Ordas_Farkas",
        colour: "#5C8FBF",
        rank: "Advanced Member",
        posted: "Monday, 04 May 2026, 12:20",
        subject: "Re: [Info] Test Game Resynced [CRACKED]",
        /* The short spelling of the same Title Update, which is how
           half this board writes it. Read as two parts it is
           one-point-six and beats 1.0.7. */
        body: "Clean Steam Files, updated to TU 1.06.<br />" + HIDDEN_LINK("Download"),
    },
    {
        id: "940006",
        author: "Grateful",
        colour: "#5C8FBF",
        rank: "Beginner",
        posted: "Monday, 04 May 2026, 12:41",
        subject: "Re: [Info] Test Game Resynced [CRACKED]",
        body: "Thank you very much!",
    },
    {
        id: "940007",
        author: "Curious",
        colour: "#5C8FBF",
        rank: "Beginner",
        posted: "Monday, 04 May 2026, 13:03",
        subject: "Re: [Info] Test Game Resynced [CRACKED]",
        /* Two release words, no link and no version — which used to
           be exactly four points and exactly the bar. A question about
           a release is not one. */
        body: "Does the hypervisor crack need Core Isolation off" + "?",
    },
];

/* ------------------------------------------------------------------
   A five page release thread.

   The index reads every page of a topic, and every saved page here is
   one page of one topic — so until this existed there was no way to
   test the thing at all, and no way to be sure a version posted on
   page 2 turns up in a list built on page 5.

   Thirty posts across five pages: eleven of them releases with known
   versions and known kinds, the rest chatter, a duplicate mirror, and
   a reply that only quotes a release. What the index must produce from
   it is written down in the checks rather than derived here, so the
   two can disagree.
   ------------------------------------------------------------------ */
const THREAD_CAST = [
    /* page 1 */
    { v: "1.0.0", kind: "Clean Steam files", body: "Initial release. Clean steam files for v1.0.0.", links: 2 },
    { chat: "Thanks, downloading now." },
    { v: "1.0.0", kind: "Repack", body: "Repack of v1.0.0, 12 GB down to 6.", links: 1, who: "Packer" },
    { chat: "Does it include the soundtrack" + "?" },
    { v: "1.0.1", kind: "Update", body: "Update to v1.0.1, patch only.", links: 1 },
    { chat: "Works perfectly, thank you." },

    /* page 2 */
    { v: "1.1.0", kind: "Clean Steam files", body: "Clean steam files updated to v1.1.0.", links: 2 },
    { quote: true },
    { v: "1.1.0", kind: "Crack", body: "Crack for v1.1.0, tested offline.", links: 1, who: "Cracker" },
    { chat: "Anyone got a mirror" + "?" },
    { v: null, kind: "Reupload", body: "Reupload of the v1.1.0 files on another host.", links: 1, who: "Mirrorman" },
    { chat: "thx" },

    /* page 3 */
    { v: "1.2.0", kind: "Update", body: "Update v1.2.0 is out, patch and clean steam files both.", links: 2 },
    { chat: "Great, grabbing it." },
    { v: null, kind: "Online fix", body: "Goldberg online fix for the current build, co-op works.", links: 1, who: "Fixer" },
    { chat: "Link is dead for me." },
    { v: null, kind: "DLC", body: "DLC unlocker for all the season pass content.", links: 1, who: "Unlocker" },
    { chat: "Nice one." },

    /* page 4 */
    { v: "1.3.0", kind: "Clean Steam files", body: "Clean steam files for v1.3.0.", links: 2 },
    { chat: "Cheers." },
    { v: null, kind: "Trainer", body: "Trainer for the latest build, infinite stamina.", links: 1, who: "Trainerman" },
    { chat: "Perfect timing." },
    { v: "1.3.0", kind: "Reupload", body: "Mirror of the v1.3.0 clean steam files.", links: 1, who: "Mirrorman" },
    { chat: "Working here." },

    /* page 5 */
    { v: "1.10.0", kind: "Clean Steam files", body: "Clean steam files for v1.10.0, this supersedes everything above.", links: 2 },
    { chat: "Finally." },
    { v: "1.10.0", kind: "Repack", body: "Repack of v1.10.0.", links: 1, who: "Packer" },
    // Described the way half this board would describe it. Replaces a
    // chatter line rather than adding one, so the page still holds six
    // posts and only the release count moves.
    { v: null, kind: "Russian", who: "Perevodchik", links: 1,
      body: "Репак с таблеткой и русификатором." },
    { v: null, kind: "Language", body: "Language pack with the missing translation files.", links: 1, who: "Translator" },
    // A Steam build id, which is eight digits and is not a version.
    // Compared as one it beats every real version in the topic.
    { v: null, kind: "Clean Steam files", body: "Clean steam files, build 24127279.", links: 1, who: "Builder" },
];

const HIDDEN_LINKS = (n) =>
    Array.from({ length: n }, (_, i) => HIDDEN_LINK("Mirror " + (i + 1))).join("<br />");

function threadPost(entry, index) {
    const id = String(920001 + index);
    const day = String(1 + index).padStart(2, "0");     // 30 posts, 30 days
    const base = {
        id,
        colour: "#5C8FBF",
        rank: "Junior Member",
        posted: "Monday, " + day + " Jan 2026, 10:00",
        subject: "Re: [Release] Fixture Game",
    };
    if (entry.chat) return Object.assign(base, { author: "Reader", body: entry.chat });
    if (entry.quote) {
        return Object.assign(base, {
            author: "Quoter",
            body: QUOTE("Uploader", "Clean steam files updated to v1.1.0.<br />" + HIDDEN_LINKS(2)) +
                  "<br />Same here, works.",
        });
    }
    return Object.assign(base, {
        author: entry.who || "Uploader",
        colour: "#BF0000",
        rank: "Advanced Member",
        body: entry.body + "<br />" + HIDDEN_LINKS(entry.links || 1),
    });
}

/** The board's own pagination strip, for a topic of a known size. */
function threadNav(page, total, perPage, topic) {
    const id = topic || "14&amp;t=920000";
    const link = (n) =>
        '<a href="./viewtopic.php?f=' + id +
        (n === 1 ? "" : "&amp;start=" + ((n - 1) * perPage)) + '">' + n + "</a>";
    const numbers = Array.from({ length: total }, (_, i) => link(i + 1)).join(", ");
    return '<table class="tablebg" width="100%" cellspacing="1"><tr><td class="cat">' +
        '<table width="100%" cellspacing="0"><tr>' +
        '<td class="nav" valign="middle" nowrap="nowrap">&nbsp;Page <strong>' + page +
        "</strong> of <strong>" + total + "</strong><br /></td>" +
        '<td class="gensmall" nowrap="nowrap">&nbsp;[ ' + (total * perPage) + " posts ]&nbsp;</td>" +
        '<td class="gensmall" width="100%" align="right" nowrap="nowrap">' +
        "<b>Go to page</b> " + numbers + "</td>" +
        "</tr></table></td></tr></table>";
}

/* ------------------------------------------------------------------
   Twenty pages of one topic.

   The five page thread is the correctness fixture: real board shell,
   hand-checked expectations, one of every kind. This one is for scale
   — nineteen fetches, which is what a real release thread costs, and
   which nothing had ever exercised. It is built on a minimal shell
   rather than the 70KB saved page, because twenty copies of that is a
   megabyte and a half of repository for a test about arithmetic.

   One release per page, versions 1 to 20, so the row count, the page
   spread and the newest version are all things a check can state
   exactly.
   ------------------------------------------------------------------ */
function longPage(page, total) {
    const id = 930000 + page;
    const link = (n) =>
        '<a href="./viewtopic.php?f=14&amp;t=930000' +
        (n === 1 ? "" : "&amp;start=" + ((n - 1) * 2)) + '">' + n + "</a>";

    const post = (postId, author, body) => `<table class="tablebg" width="100%" cellspacing="1">
<tr class="row1"><td align="center" valign="middle"><a name="p${postId}"></a><b class="postauthor">${author}</b></td>
<td width="100%"><table width="100%" cellspacing="0"><tr><td class="gensmall">
<div style="float: right;"><b>Posted:</b> Monday, ${String(1 + (page % 28)).padStart(2, "0")} Jun 2026, 09:00</div></td></tr></table></td></tr>
<tr class="row1"><td valign="top" class="profile"><span class="postdetails">Advanced Member</span></td>
<td valign="top"><table width="100%" cellspacing="5"><tr><td><div class="postbody">${body}</div></td></tr></table></td></tr>
</table>`;

    return `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>Long thread</title>
<link rel="stylesheet" href="./styles/forum.css" type="text/css" /></head><body>
<div id="wrapheader"><a href="./ucp.php?mode=logout">Logout</a></div>
<div id="wrapcentre">
<table class="tablebg" width="100%" cellspacing="1" style="margin-bottom: 2px"><tr><td class="row3">
<h4>Forum rules</h4><div class="postbody">Read the rules before posting.</div></td></tr></table>
<div id="pageheader"><h2><a class="titles" href="./viewtopic.php?f=14&amp;t=930000">[Release] Long Thread</a></h2></div>
<table class="tablebg" width="100%" cellspacing="1"><tr><td class="cat"><table width="100%" cellspacing="0"><tr>
<td class="nav" valign="middle" nowrap="nowrap">&nbsp;Page <strong>${page}</strong> of <strong>${total}</strong><br /></td>
<td class="gensmall" width="100%" align="right" nowrap="nowrap"><b>Go to page</b> ${
        Array.from({ length: total }, (_, i) => link(i + 1)).join(", ")}</td>
</tr></table></td></tr></table>
<div id="search-box"><form method="post" id="topic-search" action="./search.php">
<input class="inputbox search tiny" type="text" name="keywords" id="search_keywords" size="22" value="Search this topic…" onclick="if(this.value=='Search this topic…')this.value='';" onblur="if(this.value=='')this.value='Search this topic…';" />
<input class="button1" type="submit" value="Search" />
<input type="hidden" value="930000" name="t" /></form></div>
<table class="tablebg" width="100%" cellspacing="1"><tr><td class="cat"><table width="100%" cellspacing="0"><tr>
<td class="nav" nowrap="nowrap">&nbsp;<a href="./viewtopic.php?f=14&amp;t=930000&amp;view=print" title="Print view">Print view</a></td>
<td class="nav" align="right" nowrap="nowrap"><a href="./viewtopic.php?f=14&amp;t=930000&amp;view=previous">Previous topic</a> | <a href="./viewtopic.php?f=14&amp;t=930000&amp;view=next">Next topic</a>&nbsp;</td>
</tr></table></td></tr></table>
<div id="pagecontent">
${post(id, "Uploader", "Clean steam files for v" + page + ".0.0.<br />" + HIDDEN_LINK("Download"))}
${post(id + 500, "Reader", "Thanks for this one.")}
${post(id + 900, "Reader2", "Working here too.")}
</div>
</div></body></html>`;
}

/** Swap the run of post tables in the replies fixture for another one,
    keeping every piece of chrome around it. */
function withPosts(source, cast) {
    // From the table that holds the first post anchor, to the end of
    // the one holding the last.
    const firstAnchor = source.indexOf('<a name="p');
    const start = source.lastIndexOf('<table class="tablebg"', firstAnchor);

    const lastAnchor = source.lastIndexOf('<a name="p');
    const lastTable = source.lastIndexOf('<table class="tablebg"', lastAnchor);
    const end = source.indexOf("</table>", source.indexOf('class="spacer"', lastTable)) + "</table>".length;

    if (start < 0 || end < start) throw new Error("could not find the post tables in " + SOURCE);

    return source.slice(0, start) + cast.map(renderPost).join("\n\n\t") + source.slice(end);
}

/* The listing, seen by someone with an account and with the first four
   topics carrying posts they have not read.

   Every saved page is a logged-out view, where every row is read and
   phpBB's own unread routing does not apply - so nothing about "titles
   open at the first unread post" could be tested at all. The swap
   below is the board's own markup for an unread row: the imageset file
   and the alt text both change, and the script reads either. */
const READ_ICON = 'imageset/topic_read.png" width="31" height="27" alt="No unread posts" title="No unread posts"';
const UNREAD_ICON = 'imageset/topic_unread.png" width="31" height="27" alt="Unread posts" title="Unread posts"';

function withUnreadRows(html, count) {
    let left = count;
    return html.split(READ_ICON).reduce((out, part, index) => {
        if (index === 0) return part;
        return out + (left-- > 0 ? UNREAD_ICON : READ_ICON) + part;
    }, "");
}

/* ------------------------------------------------------------------
   The board's reply form.

   The quick reply fetches posting.php and lifts the real form out of
   the response — the whole point being that what gets submitted is the
   board's own form, with its own tokens. Nothing in test/pages served
   that, so the box could never actually open here and everything
   downstream of it, the kept draft included, was tested by poking at
   storage instead of by using the thing.

   This is posting.php cut down to what slimReplyForm reads: the form,
   the message box, the hidden state and the submit button. The token
   values are nonsense on purpose — they are copied through, never
   inspected.
   ------------------------------------------------------------------ */
function replyForm() {
    return `<!DOCTYPE html>
<html><head><title>Post a reply</title>
<link rel="stylesheet" href="./styles/forum.css" type="text/css" />
</head><body>
<div id="wrapcentre">
<form action="./posting.php?mode=reply&amp;f=14&amp;t=75717&amp;sid=${SID}" method="post" name="postform">
<input type="hidden" name="lastclick" value="1767225600" />
<input type="hidden" name="creation_time" value="1767225600" />
<input type="hidden" name="form_token" value="0123456789abcdef0123456789abcdef01234567" />
<input type="hidden" name="topic_cur_post_id" value="900006" />
<textarea name="message" rows="15" cols="76" class="post"></textarea>
<input type="submit" name="preview" value="Preview" class="button2" />
<input type="submit" name="post" value="Submit" class="button1" />
</form>
</div>
</body></html>`;
}

function main() {
    const source = fs.readFileSync(SOURCE, "utf8");
    fs.writeFileSync(POSTING, replyForm(), "utf8");
    console.log("test/fixtures/posting.html                (the board's reply form)");

    fs.writeFileSync(TARGET, withPosts(source, POSTS), "utf8");
    console.log("test/fixtures/viewtopic-quotes.html   (" + POSTS.length + " posts: a release and the replies quoting it)");

    fs.writeFileSync(CHATTER, asMember(withPosts(source, CHATTER_POSTS)), "utf8");
    console.log("test/fixtures/viewtopic-chatter.html  (" + CHATTER_POSTS.length + " short posts, " +
        CHATTER_POSTS.filter((post) => post.quiet).length + " of them chatter)");

    fs.writeFileSync(SINGLE, asSinglePage(withPosts(source, POSTS)), "utf8");
    console.log("test/fixtures/viewtopic-single.html   (a topic that fits on one page)");

    /* Two pages rather than one, because the line this fixture exists
       to protect — "Latest posted" — is only drawn when the panel is
       reading the whole topic. */
    for (let page = 1; page <= HYPERVISOR_PAGES; page += 1) {
        const slice = HYPERVISOR_POSTS.slice((page - 1) * HYPERVISOR_PER_PAGE, page * HYPERVISOR_PER_PAGE);
        let html = withPosts(source, slice);
        html = html.replace(/<table class="tablebg" width="100%" cellspacing="1">\s*<tr>\s*<td class="cat">[\s\S]*?<\/table>\s*<\/td>\s*<\/tr>\s*<\/table>/,
            () => threadNav(page, HYPERVISOR_PAGES, HYPERVISOR_PER_PAGE, "41&amp;t=940000"));
        html = html.replace(/Page <strong>\d+<\/strong> of <strong>\d+<\/strong>/g,
            () => "Page <strong>" + page + "</strong> of <strong>" + HYPERVISOR_PAGES + "</strong>");
        const name = "viewtopic-hypervisor-" + page + ".html";
        fs.writeFileSync(path.join(FIXTURES, name), html, "utf8");
        console.log("test/fixtures/" + name + "  (a hypervisor release, page " + page + " of " + HYPERVISOR_PAGES + ")");
    }

    fs.writeFileSync(MEMBER, asMember(source), "utf8");
    console.log("test/fixtures/viewtopic-member.html   (logged in, topic open)");

    fs.writeFileSync(LOCKED, asLocked(asMember(source)), "utf8");
    console.log("test/fixtures/viewtopic-locked.html   (logged in, topic locked)");

    const listing = fs.readFileSync(FORUM_SOURCE, "utf8");
    // One title with something inside it that is not the prefix. No
    // real title on this board has one — 330 were checked — so the
    // only way to find out whether taking the prefix off would eat it
    // is to put one there.
    const BADGED_TITLE =
        '<a href="./viewtopic.php?f=10&amp;t=999001" class="topictitle">' +
        '<span style="color:#BF0000;">[</span><span style="color:#BF0000;">Release</span>' +
        '<span style="color:#BF0000;">]</span> Marked Game ' +
        '<img src="./styles/rinDark/imageset/icon_topic_latest.gif" alt="SCS" class="rr-fixture-badge" />' +
        "</a> ";
    // Put it in front of the first real title rather than over it: the
    // rows already there are what other checks read.
    const decorated = listing.replace(
        /<a[^>]*class="topictitle"[^>]*>/,
        (opening) => BADGED_TITLE + opening);
    fs.writeFileSync(LISTING, withUnreadRows(asMember(decorated), 4), "utf8");
    console.log("test/fixtures/viewforum-unread.html   (logged in, 4 rows unread)");

    for (let page = 1; page <= LONG_PAGES; page += 1) {
        fs.writeFileSync(path.join(FIXTURES, "viewtopic-long-" + page + ".html"),
            longPage(page, LONG_PAGES), "utf8");
    }
    console.log("test/fixtures/viewtopic-long-1..20.html      (" + LONG_PAGES + " pages, one release each)");

    // Five pages of one topic, each a whole page of its own, so the
    // index has a topic to walk.
    for (let page = 1; page <= THREAD_PAGES; page += 1) {
        const slice = THREAD_CAST.slice((page - 1) * THREAD_PER_PAGE, page * THREAD_PER_PAGE);
        const cast = slice.map((entry, i) => threadPost(entry, (page - 1) * THREAD_PER_PAGE + i));
        let html = withPosts(source, cast);
        // Every nav strip in the shell says "16 of 16"; this topic is
        // five pages and the index has to be able to read that.
        html = html.replace(/<table class="tablebg" width="100%" cellspacing="1">\s*<tr>\s*<td class="cat">[\s\S]*?<\/table>\s*<\/td>\s*<\/tr>\s*<\/table>/,
            () => threadNav(page, THREAD_PAGES, THREAD_PER_PAGE));
        html = html.replace(/Page <strong>16<\/strong> of <strong>16<\/strong>/g,
            () => "Page <strong>" + page + "</strong> of <strong>" + THREAD_PAGES + "</strong>");
        const name = "viewtopic-thread-" + page + ".html";
        fs.writeFileSync(path.join(FIXTURES, name), html, "utf8");
        console.log("test/fixtures/" + name + "  (page " + page + " of " + THREAD_PAGES + ")");
    }
}

main();

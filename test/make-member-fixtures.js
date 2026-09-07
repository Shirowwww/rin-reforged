#!/usr/bin/env node
/* ------------------------------------------------------------------
   Builds the pages only a member sees, out of the listing's chrome.

   The member list, a private message folder and a profile exist only
   for an account, so no saved page and no sweep has one, and the first
   pass over them (0.8.6, with a real session) found a run of things the
   fixtures could never have shown: a Rank column in two languages, a
   Sent column wrapping on its weekday, subjects 8px apart depending on
   an invisible marker, a profile's spanning header read as a listing's
   title column. These three pages carry those shapes, and nothing of
   anybody's account — the names and dates are made up.

     memberlist.html      # Username, Joined, Posts, Rank, Message …
     ucp-pm.html          Subject (spanning the marker), Author, Sent, Mark
     ucp-pm-read.html     One message: the label/value header, the body
     profile-member.html  User statistics: Joined / Total posts, a rank
     viewtopic-rules.html A topic as a member: the forum-rules notice
                          above the title, and the strip the board puts
                          "First unread post" in

   The last two are the shapes reported at 0.12 — the message header's
   inset, the notice the board writes as a bare div.forumrules rather
   than the td.row3 subsilver2 ships, and a nav strip left standing
   with one link in it.

   The skeleton is the saved listing — same masthead, same footer — as
   a member (Logout where Login was), with the page content swapped.

       node test/make-member-fixtures.js
   ------------------------------------------------------------------ */

const fs = require("fs");
const path = require("path");

const FIXTURES = path.join(__dirname, "fixtures");
const SOURCE = path.join(FIXTURES, "viewforum.html");

const PM_ICON = '<img src="./styles/rinDark/imageset/icon_contact_pm.gif" width="72" height="20" alt="Send private message" title="Send private message" />';
const SPACER = '<img src="images/spacer.gif" width="10" height="10" alt="" />';

/* The listing page, cut at the page header and at the footer, as a
   member. Everything between is the caller's. */
function shell(content) {
    const source = fs.readFileSync(SOURCE, "utf8");
    /* The listing's #wrapcentre opens with the breadcrumb strip, which
       every page has, and then the forum's own sub-forum table, which
       these pages must not carry: it has a Forum header and forumlinks,
       and the script would rightly read it as a listing. Cut before it. */
    const wrapStart = source.indexOf('<div id="wrapcentre">');
    const headEnd = source.indexOf('<table class="tablebg" cellspacing="1" width="100%">', wrapStart);
    const tailStart = source.indexOf('<div id="wrapfooter">');
    if (wrapStart < 0 || headEnd < 0 || tailStart < 0) throw new Error("viewforum.html has changed shape");

    const head = source.slice(0, headEnd)
        .replace(/mode=login/g, () => "mode=logout")
        .replace(/> Login</g, () => "> Logout<");
    const tail = source.slice(tailStart);

    return head
        + '<div id="pagecontent">\n' + content + '\n</div>\n\n\t<br clear="all" />\n</div>\n\n'
        + tail;
}

/* ---- The member list ---------------------------------------------- */

const MEMBERS = [
    { n: 1, name: "Tim*", joined: "Friday, 15 Aug 2003, 05:06", posts: "147", rank: "Advanced forumer Завсегдатай" },
    { n: 2, name: "baksik*", joined: "Friday, 15 Aug 2003, 05:30", posts: "44", rank: "User Редкий гость" },
    { n: 3, name: "nupo)I(ok", joined: "Saturday, 16 Aug 2003, 09:34", posts: "1716", rank: "Super flooder Почетный графоман" },
    // A rank with no Russian half and nothing but punctuation after
    // the word: must come through untouched.
    { n: 4, name: "C-Corpse", joined: "Monday, 18 Aug 2003, 17:13", posts: "12034", rank: "Super-Donor <3" },
];

// As the live board prints it (checked 2026-09-06): the row class is on
// the <tr>, the cells are plain gen/genmed, the username cell is the one
// aligned left and every value is padded with &nbsp;.
function memberRow(m, index) {
    const row = index % 2 ? "row2" : "row1";
    return `<tr class="${row}">
\t<td class="gen" align="center">&nbsp;${m.n}&nbsp;</td>
\t<td class="genmed" align="left"><a href="./memberlist.php?mode=viewprofile&amp;u=${100 + m.n}">${m.name}</a>&nbsp;</td>
\t<td class="genmed" align="center" nowrap="nowrap">&nbsp;${m.joined}&nbsp;</td>
\t<td class="gen" align="center">${m.posts}</td>
\t<td class="gen" align="center">${m.rank}</td>
\t<td class="gen" align="center">&nbsp;<a href="./ucp.php?i=pm&amp;mode=compose&amp;u=${100 + m.n}">${PM_ICON}</a>&nbsp;</td>
\t<td class="gen" align="center">&nbsp;&nbsp;</td>
\t<td class="gen" align="center">&nbsp;&nbsp;</td>
</tr>`;
}

function memberList() {
    return `<form method="post" name="charsearch" action="./memberlist.php">
<table class="tablebg" width="100%" cellspacing="1">
<tr>
\t<td class="cat" colspan="8"><span class="gensmall">Username begins with:</span> <select name="first_char"><option value="" selected="selected">All</option><option value="a">A</option></select>&nbsp;<input type="submit" class="btnlite" name="char" value="Display" /></td>
</tr>
<tr>
\t<th>#</th>
\t<th>Username</th>
\t<th>Joined</th>
\t<th>Posts</th>
\t<th>Rank</th>
\t<th>Message</th>
\t<th>E-mail</th>
\t<th>Website</th>
</tr>
${MEMBERS.map(memberRow).join("\n")}
<tr>
\t<td class="cat" colspan="8" align="center"><span class="gensmall">Select sort method:</span> <select name="sk"><option value="c" selected="selected">Joined</option></select></td>
</tr>
</table>
</form>

<br clear="all" />

<table width="100%" cellspacing="1">
<tr>
\t<td class="nav" valign="middle" nowrap="nowrap">&nbsp;Page <strong>1</strong> of <strong>1</strong><br /></td>
\t<td class="gensmall" width="100%" align="right" nowrap="nowrap">&nbsp;</td>
</tr>
</table>`;
}

/* ---- A private message folder ------------------------------------ */

const MESSAGES = [
    { subject: "Re: Topic removed", from: "Valentine", sent: "Wednesday, 02 Sep 2026, 16:21", mark: "replied" },
    { subject: "AUTO REPLY", from: "dead_bot", sent: "Friday, 20 Oct 2023, 09:44", mark: null },
    { subject: "AUTO REPLY", from: "dead_bot", sent: "Wednesday, 18 Oct 2023, 21:14", mark: null },
    { subject: "About that repack", from: "someone", sent: "Tuesday, 17 Oct 2023, 21:00", mark: "marked" },
];

function messageRow(m, index) {
    const row = index % 2 ? "row2" : "row1";
    const marker = m.mark
        ? `<span class="pm_${m.mark}_colour" style="float: left;">${SPACER}</span>&nbsp; `
        : "";
    return `<tr>
\t<td class="${row}" width="25" align="center"><img src="./styles/rinDark/imageset/topic_read.gif" width="19" height="18" alt="No new messages" title="No new messages" /></td>
\t<td class="${row}">${marker}<span class="topictitle"><a href="./ucp.php?i=pm&amp;mode=view&amp;f=0&amp;p=${900 + index}">${m.subject}</a></span></td>
\t<td class="${row}" width="130" align="center"><p class="topicauthor"><a href="./memberlist.php?mode=viewprofile&amp;u=${300 + index}">${m.from}</a></p></td>
\t<td class="${row}" width="130" align="center"><p class="topicdetails">${m.sent}</p></td>
\t<td class="${row}" width="45" align="center"><input type="checkbox" class="radio" name="marked_msg_id[]" value="${900 + index}" /></td>
</tr>`;
}

function messageFolder() {
    return `<table width="100%" cellspacing="0" cellpadding="0" border="0">
<tr>
\t<td width="20%" valign="top">
\t\t<table class="tablebg" width="100%" cellspacing="1">
\t\t<tr><th>Options</th></tr>
\t\t<tr><td class="row1"><a class="nav" href="./ucp.php?i=163">Overview</a></td></tr>
\t\t<tr><td class="row2"><a class="nav" href="./ucp.php?i=164">Profile</a></td></tr>
\t\t<tr><td class="row1"><a class="nav" href="./ucp.php?i=165">Board preferences</a></td></tr>
\t\t<tr><td class="row2"><b class="nav">Private messages</b>
\t\t\t<ul class="nav" style="margin: 0; padding: 0;">
\t\t\t\t<li><b>&#187; </b><a href="./ucp.php?i=pm&amp;folder=inbox" style="font-weight: bold;">Inbox</a></li>
\t\t\t\t<li><b>&#187; </b><a href="./ucp.php?i=pm&amp;folder=outbox">Outbox</a></li>
\t\t\t</ul></td></tr>
\t\t</table>
\t\t<br />
\t\t<table class="tablebg" width="100%" cellspacing="1">
\t\t<tr><th>Message colours</th></tr>
\t\t<tr><td class="row1 pm_marked_colour"><span class="genmed">Marked message</span></td></tr>
\t\t<tr><td class="row1 pm_replied_colour"><span class="genmed">Replied to message</span></td></tr>
\t\t<tr><td class="row1 pm_friend_colour"><span class="genmed">Message from friend</span></td></tr>
\t\t<tr><td class="row1 pm_foe_colour"><span class="genmed">Message from foe</span></td></tr>
\t\t</table>
\t</td>
\t<td width="4">&nbsp;</td>
\t<td valign="top">
\t\t<form id="viewfolder" method="post" action="./ucp.php?i=pm&amp;folder=inbox">
\t\t<table class="tablebg" width="100%" cellspacing="1">
\t\t<tr><td class="cat"><span class="gensmall">[ <b>${MESSAGES.length}</b> Messages ]</span></td></tr>
\t\t</table>
\t\t<br clear="all" />
\t\t<table class="tablebg" width="100%" cellspacing="1">
\t\t<tr>
\t\t\t<th colspan="2">Subject</th>
\t\t\t<th>Author</th>
\t\t\t<th>Sent</th>
\t\t\t<th>Mark</th>
\t\t</tr>
${MESSAGES.map(messageRow).join("\n")}
\t\t</table>
\t\t<table width="100%" cellspacing="1">
\t\t<tr>
\t\t\t<td class="nav" valign="middle" nowrap="nowrap">&nbsp;Page <strong>1</strong> of <strong>1</strong><br /></td>
\t\t\t<td class="gensmall" width="100%" align="right" nowrap="nowrap">&nbsp;</td>
\t\t</tr>
\t\t</table>
\t\t</form>
\t</td>
</tr>
</table>`;
}

/* ---- A member's profile ------------------------------------------- */

function profile() {
    return `<table class="tablebg" width="100%" cellspacing="1">
<tr>
\t<td class="cat" colspan="2"><h4>Viewing profile - Shirow</h4></td>
</tr>
<tr>
\t<th width="40%">Board presence</th>
\t<th colspan="2">User statistics</th>
</tr>
<tr>
\t<td class="row1" align="center" valign="top">
\t\t<table cellspacing="1" cellpadding="2" border="0">
\t\t<tr><td class="gen" align="center"><b>Shirow</b></td></tr>
\t\t<tr><td class="postdetails" align="center">Beginner Без звания</td></tr>
\t\t</table>
\t</td>
\t<td class="row1" colspan="2" valign="top">
\t\t<table width="100%" cellspacing="1" cellpadding="2" border="0">
\t\t<tr>
\t\t\t<td class="gen" align="right" nowrap="nowrap">Joined: </td>
\t\t\t<td width="100%"><b class="gen">Thursday, 13 Feb 2020, 13:38</b></td>
\t\t</tr>
\t\t<tr>
\t\t\t<td class="gen" align="right" nowrap="nowrap">Total posts: </td>
\t\t\t<td><b class="gen">2</b><br /><span class="genmed">[0.00% of all posts / 0.00 posts per day]</span><br /><a class="genmed" href="./search.php?author_id=1">Search user&rsquo;s posts</a></td>
\t\t</tr>
\t\t</table>
\t</td>
</tr>
</table>`;
}

/* ---- One private message -------------------------------------------

   The header is four label/value rows, and the shape that made them
   worth a fixture is where the class sits: `<tr class="row1">` with the
   cells left plain, so every inset keyed to `td.row1` misses them and
   the labels sit on the card's own border. Copied off the live board;
   the names, the subject and the body are made up. */

function messageRead() {
    const row = (label, value) => '<tr class="row1">\n'
        + '\t<td class="genmed" nowrap="nowrap" width="150"><b>' + label + ':</b></td>\n'
        + '\t<td class="gen">' + value + '</td>\n'
        + '</tr>';

    return [
        '<table class="tablebg" width="100%" cellspacing="1" cellpadding="0">',
        '<tr>',
        '\t<td class="row1">',
        '\t\t<table border="0" cellspacing="0" cellpadding="0" width="100%">',
        '\t\t<tr>',
        '\t\t\t<td align="left"><span class="gensmall"><a href="./ucp.php?i=pm&amp;f=0&amp;p=612329&amp;view=previous">Previous PM</a> | <a href="./ucp.php?i=pm&amp;f=0&amp;p=612329&amp;view=next">Next PM</a>&nbsp;</span></td>',
        '\t\t\t<td align="right"></td>',
        '\t\t</tr>',
        '\t\t</table>',
        '\t</td>',
        '</tr>',
        '</table>',
        '<div style="padding: 2px;"></div>',
        '',
        '<table class="tablebg" width="100%" cellspacing="1" cellpadding="4">',
        row("Message subject", "Re: Topic removed"),
        row("From", '<a href="./memberlist.php?mode=viewprofile&amp;u=1311679" style="color: #BF9F00;" class="username-coloured">Valentine</a>'),
        row("Sent", "Wednesday, 02 Sep 2026, 16:21"),
        row("To", '<a href="./memberlist.php?mode=viewprofile&amp;u=1144815">Shirow</a>&nbsp;'),
        '</table>',
        '',
        '<div style="padding: 2px;"></div>',
        '',
        '<table class="tablebg" width="100%" cellspacing="1" cellpadding="0">',
        '<tr>',
        '\t<th nowrap="nowrap">Message</th>',
        '</tr>',
        '<tr>',
        '\t<td class="spacer" height="1"><img src="images/spacer.gif" alt="" width="1" height="1" /></td>',
        '</tr>',
        '<tr class="row1">',
        '\t<td valign="top">',
        '\t\t<table width="100%" cellspacing="5">',
        '\t\t<tr>',
        '\t\t\t<td>',
        '\t\t\t\t<div class="postbody">Hello,<br />Because your account does not have many posts, anything you post requires moderator approval at first, even edits<br /><br />Your thread should show up now</div>',
        '\t\t\t</td>',
        '\t\t</tr>',
        '\t\t</table>',
        '\t</td>',
        '</tr>',
        '</table>',
    ].join("\n");
}

/* ---- A topic, as a member ------------------------------------------

   The saved single-page topic with two things put back that only a
   member is shown: the forum-rules notice the board writes straight
   into #wrapcentre, and the strip carrying Subscribe / Bookmark /
   E-mail friend with "First unread post" at its far end.

   Both are the live board's markup with the words left alone. The
   notice is why this page exists: subsilver2 ships the rules in a
   `td.row3` and this board writes a bare `div.forumrules`, so the page
   being styled and the page that exists were never the same page. */

const RULES_NOTICE = [
    '<div class="forumrules">',
    '\t\t',
    '\t\t\t<h3>Forum rules</h3><br />',
    '\t\t\t<span style="color: #FFBF00"><span style="font-size: 150%; line-height: normal">Notice: Posting is temporarily restricted here to prevent spam and keep discussions organized.<br /><br />For this reason, before posting or sending private messages, make sure that<br /><ul><li>you have searched and read existing posts (rule &sect; 3.4),</li><li>your post adds value to the topic (rule &sect; 4.1),</li><li>your private message is necessary (rule &sect; 3.9).</li></ul></span></span>',
    '\t\t',
    '\t</div>',
].join("\n");

const MEMBER_STRIP = [
    '<table width="100%" cellspacing="0">',
    '<tr>',
    '\t<td class="nav" nowrap="nowrap"><a href="./viewtopic.php?f=14&amp;t=75717&amp;watch=topic">Subscribe topic</a> | <a href="./viewtopic.php?f=14&amp;t=75717&amp;bookmark=1">Bookmark topic</a> | <a href="./memberlist.php?mode=email&amp;t=75717">E-mail friend</a></td>',
    '\t<td class="nav" align="right" nowrap="nowrap"><a href="./viewtopic.php?f=14&amp;t=75717&amp;view=unread#unread">First unread post</a></td>',
    '</tr>',
    '</table>',
].join("\n");

function memberTopic() {
    const source = fs.readFileSync(path.join(FIXTURES, "viewtopic-single.html"), "utf8");
    const OPEN = '<div id="pagecontent">';
    const header = source.indexOf('<div id="pageheader">');
    const content = source.indexOf(OPEN);
    if (header < 0 || content < 0) throw new Error("viewtopic-single.html has changed shape");

    return source.slice(0, header)
        + "<br />\n" + RULES_NOTICE + "\n<br />\n"
        + source.slice(header, content)
        + OPEN + "\n" + MEMBER_STRIP + "\n"
        + source.slice(content + OPEN.length)
            .replace(/mode=login/g, () => "mode=logout")
            .replace(/> Login</g, () => "> Logout<");
}

function main() {
    if (!fs.existsSync(SOURCE)) {
        console.error("missing " + path.relative(process.cwd(), SOURCE) + " — the saved listing this page borrows its chrome from");
        process.exit(1);
    }
    const pages = [
        ["memberlist.html", memberList()],
        ["ucp-pm.html", messageFolder()],
        ["ucp-pm-read.html", messageRead()],
        ["profile-member.html", profile()],
    ];
    for (const [name, content] of pages) {
        fs.writeFileSync(path.join(FIXTURES, name), shell(content), "utf8");
        console.log("wrote test/fixtures/" + name);
    }
    // Not built out of the listing's chrome: a real topic page with the
    // two member-only pieces put back into it.
    fs.writeFileSync(path.join(FIXTURES, "viewtopic-rules.html"), memberTopic(), "utf8");
    console.log("wrote test/fixtures/viewtopic-rules.html");
}

main();

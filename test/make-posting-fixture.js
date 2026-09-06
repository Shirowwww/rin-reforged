#!/usr/bin/env node
/* ------------------------------------------------------------------
   Builds the reply form, which only a member ever sees.

   posting.php is where the BBCode buttons, the helpbox and the topic
   review live, and the saved fixture for it was a textarea and two
   submit buttons — enough to test that the quick reply's form can be
   parsed, and nothing at all like the page a member writes on. This
   reproduces the real one, checked against the live board on
   2026-09-06:

     - two rows of `input.btnbbcode`, with the board's own `helpline()`
       calls on mouseover and the `helpbox` field they write into
     - the `help_line` table and `bbtags` array the board defines inline
     - the font colour palette `colorPalette('v', 7, 6)` writes out
     - the topic review: a 300px scroller holding five posts, each two
       rows and a `td.spacer` between them

   The names, subjects and text are made up; nothing here is anybody's
   post.

       node test/make-posting-fixture.js
   ------------------------------------------------------------------ */

const fs = require("fs");
const path = require("path");

const FIXTURES = path.join(__dirname, "fixtures");
const SOURCE = path.join(FIXTURES, "viewforum.html");

/* The listing page's chrome, cut before its sub-forum table and after
   the content — the same skeleton make-member-fixtures.js borrows, and
   for the same reason: every member page wears it. */
function shell(content) {
    const source = fs.readFileSync(SOURCE, "utf8");
    const wrapStart = source.indexOf('<div id="wrapcentre">');
    const headEnd = source.indexOf('<table class="tablebg" cellspacing="1" width="100%">', wrapStart);
    const tailStart = source.indexOf('<div id="wrapfooter">');
    if (wrapStart < 0 || headEnd < 0 || tailStart < 0) throw new Error("viewforum.html has changed shape");

    const head = source.slice(0, headEnd)
        .replace(/mode=login/g, () => "mode=logout")
        .replace(/> Login</g, () => "> Logout<")
        .replace(/<title>[^<]*/, () => "<title>CS RIN - Steam Underground &bull; Post a reply");
    const tail = source.slice(tailStart);

    return head
        + '<div id="pagecontent">\n' + content + '\n</div>\n\n\t<br clear="all" />\n</div>\n\n'
        + tail;
}

/* ---- The BBCode buttons -------------------------------------------

   Copied attribute for attribute off the live page: the widths typed
   into the style attribute, the accesskeys, and the helpline keys.
   ------------------------------------------------------------------- */

const BUTTONS_ROW1 = `
\t\t<input type="button" class="btnbbcode" accesskey="b" name="addbbcode0" value=" B " style="font-weight:bold; width: 30px;" onclick="bbstyle(0)" onmouseover="helpline('b')" onmouseout="helpline('tip')" />
\t\t<input type="button" class="btnbbcode" accesskey="i" name="addbbcode2" value=" i " style="font-style:italic; width: 30px;" onclick="bbstyle(2)" onmouseover="helpline('i')" onmouseout="helpline('tip')" />
\t\t<input type="button" class="btnbbcode" accesskey="u" name="addbbcode4" value=" u " style="text-decoration: underline; width: 30px;" onclick="bbstyle(4)" onmouseover="helpline('u')" onmouseout="helpline('tip')" />
\t\t<input type="button" class="btnbbcode" accesskey="q" name="addbbcode6" value="Quote" style="width: 50px" onclick="bbstyle(6)" onmouseover="helpline('q')" onmouseout="helpline('tip')" />
\t\t<input type="button" class="btnbbcode" accesskey="c" name="addbbcode8" value="Code" style="width: 40px" onclick="bbstyle(8)" onmouseover="helpline('c')" onmouseout="helpline('tip')" />
\t\t<input type="button" class="btnbbcode" accesskey="l" name="addbbcode10" value="List" style="width: 40px" onclick="bbstyle(10)" onmouseover="helpline('l')" onmouseout="helpline('tip')" />
\t\t<input type="button" class="btnbbcode" accesskey="o" name="addbbcode12" value="List=" style="width: 40px" onclick="bbstyle(12)" onmouseover="helpline('o')" onmouseout="helpline('tip')" />
\t\t<input type="button" class="btnbbcode" accesskey="y" name="addlistitem" value="[*]" style="width: 40px" onclick="bbstyle(-1)" onmouseover="helpline('e')" onmouseout="helpline('tip')" />
\t\t<input type="button" class="btnbbcode" accesskey="p" name="addbbcode14" value="Img" style="width: 40px" onclick="bbstyle(14)" onmouseover="helpline('p')" onmouseout="helpline('tip')" />
\t\t<input type="button" class="btnbbcode" accesskey="w" name="addbbcode16" value="URL" style="text-decoration: underline; width: 40px" onclick="bbstyle(16)" onmouseover="helpline('w')" onmouseout="helpline('tip')" />
\t\t<span class="genmed nowrap">Font size: <select class="gensmall" name="addbbcode20" onchange="bbfontstyle('[size=' + this.form.addbbcode20.options[this.form.addbbcode20.selectedIndex].value + ']', '[/size]');this.form.addbbcode20.selectedIndex = 2;" onmouseover="helpline('f')" onmouseout="helpline('tip')">
\t\t\t<option value="50">Tiny</option>
\t\t\t<option value="85">Small</option>
\t\t\t<option value="100" selected="selected">Normal</option>
\t\t\t<option value="150">Large</option>
\t\t\t<option value="200">Huge</option>
\t\t</select></span>`;

const BUTTONS_ROW2 = `
\t\t<input type="button" class="btnbbcode" name="addbbcode22" value="s" onclick="bbstyle(22)" onmouseover="helpline('cb_22')" onmouseout="helpline('tip')" />
\t\t<input type="button" class="btnbbcode" name="addbbcode24" value="spoiler" onclick="bbstyle(24)" onmouseover="helpline('cb_24')" onmouseout="helpline('tip')" />
\t\t<input type="button" class="btnbbcode" name="addbbcode26" value="spoiler=" onclick="bbstyle(26)" onmouseover="helpline('cb_26')" onmouseout="helpline('tip')" />
\t\t<input type="button" class="btnbbcode" name="addbbcode28" value="youtube" onclick="bbstyle(28)" onmouseover="helpline('cb_28')" onmouseout="helpline('tip')" />
\t\t<!-- RIN SteamInfo Generator -->
\t\t<input type="button" class="btnbbcode" name="addsteaminfo" value="Generate SteamInfo BBCode" onclick="SteamInfoBBCode.generatePrompt(SteamInfoBBCode.process);" />`;

/* The board's inline editor state, plus the two functions the buttons
   call. editor.js itself is not served here, so `bbstyle` and
   `helpline` are the parts of it the buttons touch — enough that a
   click inserts the tag and a hover still writes into the helpbox,
   which is the behaviour under test. */
const EDITOR = `<script type="text/javascript">
// <![CDATA[
\tvar form_name = 'postform';
\tvar text_name = 'message';

\tvar bbtags = new Array('[b]','[/b]','[i]','[/i]','[u]','[/u]','[quote]','[/quote]','[code]','[/code]','[list]','[/list]','[list=]','[/list]','[img]','[/img]','[url]','[/url]','[flash=]', '[/flash]','[size=]','[/size]', '[s]', '[/s]', '[spoiler]', '[/spoiler]', '[spoiler=]', '[/spoiler]', '[youtube]', '[/youtube]');

\tvar help_line = {
\t\tb: 'Bold text: [b]text[/b]',
\t\ti: 'Italic text: [i]text[/i]',
\t\tu: 'Underline text: [u]text[/u]',
\t\tq: 'Quote text: [quote]text[/quote]',
\t\tc: 'Code display: [code]code[/code]',
\t\tl: 'List: [list][*]text[/list]',
\t\te: 'List item: [*]text',
\t\to: 'Ordered list: e.g. [list=1][*]First point[/list] or [list=a][*]Point a[/list]',
\t\tp: 'Insert image: [img]http://image_url[/img]',
\t\tw: 'Insert URL: [url]http://url[/url] or [url=http://url]URL text[/url]',
\t\ta: 'Inline uploaded attachment: [attachment=]filename.ext[/attachment]',
\t\ts: 'Font colour: [color=red]text[/color]  Tip: you can also use color=#FF0000',
\t\tf: 'Font size: [size=85]small text[/size]',
\t\ty: 'List: Add list element',
\t\td: 'Flash: [flash=width,height]http://url[/flash]',
\t\ttip: 'Tip: Styles can be applied quickly to selected text.'
\t\t,cb_22: 'Strikethrough text: [s]this sentence is false[/s]'
\t\t,cb_24: 'Hidden text: [spoiler]hidden text here[/spoiler]'
\t\t,cb_26: 'Hidden text: [spoiler="description"]hidden text here[/spoiler]'
\t\t,cb_28: 'YouTube video: [youtube]http://www.youtube.com/watch?v=dQw4w9WgXcQ[/youtube]'
\t}

\tfunction helpline(help) { document.forms[form_name].helpbox.value = help_line[help]; }

\tfunction bbfontstyle(open, close) {
\t\tvar box = document.forms[form_name].elements[text_name];
\t\tvar start = box.selectionStart, end = box.selectionEnd;
\t\tbox.setRangeText(open + box.value.slice(start, end) + close, start, end, 'end');
\t\tbox.focus();
\t}
\tfunction bbstyle(n) { if (n != -1) { bbfontstyle(bbtags[n], bbtags[n + 1]); } else { bbfontstyle('[*]', ''); } }
// ]]>
</script>`;

/* What colorPalette('v', 7, 6) writes: 5×5×5 web-safe colours, one row
   of five cells per green step. Written out rather than run, so the
   fixture needs no document.write. */
function palette() {
    const steps = ["00", "40", "80", "BF", "FF"];
    const rows = [];
    for (const r of steps) {
        for (const g of steps) {
            const cells = steps.map((b) => {
                const colour = r + g + b;
                return `<td bgcolor="#${colour}" style="width: 7px; height: 6px;">`
                    + `<a href="#" onclick="bbfontstyle('[color=#${colour}]', '[/color]'); return false;">`
                    + `<img src="images/spacer.gif" width="7" height="6" alt="#${colour}" title="#${colour}" /></a></td>`;
            });
            rows.push("<tr>" + cells.join("") + "</tr>");
        }
    }
    return '<table cellspacing="1" cellpadding="0" border="0">\n' + rows.join("\n") + "\n</table>";
}

const SMILIES = [
    [":arrow:", "icon_arrow.gif", "Arrow"],
    [":mrgreen:", "icon_mrgreen.gif", "Mr. Green"],
    [":-|", "icon_neutral.gif", "Neutral"],
    [":idea:", "icon_idea.gif", "Idea"],
    [":?:", "icon_question.gif", "Question"],
    [":!:", "icon_exclaim.gif", "Exclamation"],
    [":roll:", "icon_rolleyes.gif", "Rolling Eyes"],
    [":twisted:", "icon_twisted.gif", "Twisted Evil"],
    [":evil:", "icon_evil.gif", "Evil or Very Mad"],
    [":cry:", "icon_cry.gif", "Crying or Very Sad"],
    [":-)", "icon_smile.gif", "Smile"],
    [":-D", "icon_biggrin.gif", "Very Happy"],
];

function smilies() {
    const links = SMILIES.map(([code, file, title]) =>
        `<a href="#" onclick="insert_text('${code}', true); return false;" style="line-height: 20px;">`
        + `<img src="./images/smilies/${file}" width="15" height="17" alt="${code}" title="${title}" hspace="2" vspace="2" /></a>`
    ).join("\n\t\t\t\t");
    return `<table width="100%" cellspacing="5" cellpadding="0" border="0" align="center">
\t\t<tr>
\t\t\t<td class="gensmall" align="center"><b>Smilies</b></td>
\t\t</tr>
\t\t<tr>
\t\t\t<td align="center">
\t\t\t\t${links}
\t\t\t</td>
\t\t</tr>
\t\t<tr>
\t\t\t<td align="center"><a class="nav" href="./posting.php?mode=smilies&amp;f=10" onclick="popup(this.href, 578, 370, '_phpbbsmilies'); return false;">View more smilies</a></td>
\t\t</tr>
\t\t</table>`;
}

/* ---- The topic review ---------------------------------------------

   Five posts in a 300px scroller. Each is two rows — the author cell
   spanning both, the subject and quote link, then the body and the
   posted date — with a `td.spacer` row between them.
   ------------------------------------------------------------------- */

const REVIEW = [
    {
        id: 900012, author: "Rogue", posted: "Today, 19:40",
        body: "Anyone managed to get the game to work with the co-op mod while the overlay is on? It launches fine on its own but the second player never connects.",
    },
    {
        id: 900011, author: "dangwoot", posted: "Today, 05:00",
        body: "Update installed cleanly over the previous build, no reinstall needed. Saves carried over.",
    },
    {
        id: 900010, author: "UltraShaggy", posted: "Yesterday, 22:14",
        body: "Is there a way to get gyro controls to work? The controller is recognised as a generic pad and the stick deadzone is enormous.",
    },
    {
        id: 900009, author: "joy7", posted: "Yesterday, 18:02",
        body: "Mirror is up again. Same hash as the one in the first post, so nothing to redownload if you already have it.",
    },
    {
        id: 900008, author: "Zøg", posted: "Sunday, 30 Aug 2026, 11:47",
        body: "Reminder that the trainer from two pages back is flagged by the anti-cheat in online mode. Offline only.",
    },
];

function reviewPost(post, index) {
    const row = index % 2 ? "row2" : "row1";
    const spacer = index === REVIEW.length - 1 ? "" : `
\t\t\t<tr>
\t\t\t\t<td class="spacer" colspan="2"><img src="images/spacer.gif" alt="" width="1" height="1" /></td>
\t\t\t</tr>`;
    return `\t\t<tr class="${row}">
\t\t\t\t<td rowspan="2" align="left" valign="top"><a id="pr${post.id}"></a>
\t\t\t\t\t<table width="150" cellspacing="0">
\t\t\t\t\t<tr>
\t\t\t\t\t\t<td align="center"><b class="postauthor">${post.author}</b></td>
\t\t\t\t\t</tr>
\t\t\t\t\t</table>
\t\t\t\t</td>
\t\t\t\t<td width="100%">
\t\t\t\t\t<table width="100%" cellspacing="0">
\t\t\t\t\t<tr>
\t\t\t\t\t\t<td>&nbsp;</td>
\t\t\t\t\t\t<td class="gensmall" valign="middle" nowrap="nowrap"><b>Post subject:</b>&nbsp;</td>
\t\t\t\t\t\t<td class="gensmall" width="100%" valign="middle">Re: Dragon's Dogma 2</td>
\t\t\t\t\t\t<td valign="top" nowrap="nowrap">&nbsp;<a href="#" onclick="addquote(${post.id},'${post.author}', 'wrote'); return false;"><img src="./styles/rinDark/imageset/en/icon_post_quote.gif" alt="Reply with quote" title="Reply with quote" /></a></td>
\t\t\t\t\t</tr>
\t\t\t\t\t</table>
\t\t\t\t</td>
\t\t\t</tr>

\t\t\t<tr class="${row}">
\t\t\t\t<td valign="top">
\t\t\t\t\t<table width="100%" cellspacing="0">
\t\t\t\t\t<tr>
\t\t\t\t\t\t<td valign="top">
\t\t\t\t\t\t\t<table width="100%" cellspacing="0" cellpadding="2">
\t\t\t\t\t\t\t<tr>
\t\t\t\t\t\t\t\t<td>
\t\t\t\t\t\t\t\t\t<div class="postbody">${post.body}</div>
\t\t\t\t\t\t\t\t\t<div id="message_${post.id}" style="display: none;">${post.body}</div>
\t\t\t\t\t\t\t\t</td>
\t\t\t\t\t\t\t</tr>
\t\t\t\t\t\t\t</table>
\t\t\t\t\t\t</td>
\t\t\t\t\t</tr>
\t\t\t\t\t<tr>
\t\t\t\t\t\t<td>
\t\t\t\t\t\t\t<table width="100%" cellspacing="0">
\t\t\t\t\t\t\t<tr valign="middle">
\t\t\t\t\t\t\t\t<td width="100%" align="left"><span class="gensmall"></span></td>
\t\t\t\t\t\t\t\t<td width="10" nowrap="nowrap"><a href="./viewtopic.php?p=${post.id}#p${post.id}"><img src="./styles/rinDark/imageset/icon_post_target.gif" width="12" height="9" alt="Post" title="Post" /></a></td>
\t\t\t\t\t\t\t\t<td class="gensmall" nowrap="nowrap"><b>Posted:</b> ${post.posted}</td>
\t\t\t\t\t\t\t</tr>
\t\t\t\t\t\t\t</table>
\t\t\t\t\t\t</td>
\t\t\t\t\t</tr>
\t\t\t\t\t</table>
\t\t\t\t</td>
\t\t\t</tr>${spacer}`;
}

function review() {
    return `<table class="tablebg" width="100%" cellspacing="1">
<tr>
\t<th align="center">Topic review - Dragon's Dogma 2</th>
</tr>
<tr>
\t<td class="row1"><div style="overflow: auto; width: 100%; height: 300px;">

\t\t<table class="tablebg" width="100%" cellspacing="1">
\t\t<tr>
\t\t\t<th width="22%">Author</th>
\t\t\t<th>Message</th>
\t\t</tr>
${REVIEW.map(reviewPost).join("\n")}
\t\t</table>
\t</div></td>
</tr>
</table>`;
}

/* ---- The page ------------------------------------------------------ */

function postingPage() {
    return `<form action="./posting.php?mode=reply&amp;f=10&amp;t=133316" method="post" name="postform" enctype="multipart/form-data">

<table class="tablebg" width="100%" cellspacing="1">
<tr>
\t<th colspan="2"><b>Post a reply</b></th>
</tr>

<tr>
\t<td class="row1" width="22%"><b class="genmed">Subject:</b></td>
\t<td class="row2" width="78%"><input class="post" style="width:450px" type="text" name="subject" size="45" maxlength="64" tabindex="2" value="Re: Dragon's Dogma 2" /></td>
</tr>

<tr>
\t<td class="row1" valign="top"><b class="genmed">Message body:</b><br /><span class="gensmall">Enter your message here, it may contain no more than <strong>300000</strong> characters.&nbsp;</span><br /><br />
\t\t${smilies()}
\t</td>
\t<td class="row2" valign="top">
\t\t${EDITOR}

\t\t<table width="100%" cellspacing="0" cellpadding="0" border="0">
\t\t<tr valign="middle" align="left">
\t<td colspan="2">${BUTTONS_ROW1}
\t</td>
</tr>

\t<tr valign="middle" align="left">
\t\t<td colspan="2">${BUTTONS_ROW2}
\t\t</td>
\t</tr>

<tr>
\t<td><input type="text" readonly="readonly" name="helpbox" style="width:100%" class="helpline" value="Tip: Styles can be applied quickly to selected text." /></td>
\t<td class="genmed" align="center">Font colour</td>
</tr>

\t\t<tr>
\t\t\t<td valign="top" style="width: 100%;"><textarea name="message" rows="15" cols="76" tabindex="3" onselect="storeCaret(this);" onclick="storeCaret(this);" onkeyup="storeCaret(this);" onfocus="initInsertions();" style="width: 700px; height: 270px; min-width: 98%; max-width: 98%;"></textarea></td>
\t\t\t<td width="80" align="center" valign="top">
${palette()}
\t\t\t</td>
\t\t</tr>
\t\t</table>
\t</td>
</tr>

<tr>
\t<td class="row1" valign="top"><b class="genmed">Options:</b><br />
\t\t<table cellspacing="2" cellpadding="0" border="0">
\t\t<tr><td class="gensmall"><a href="./faq.php?mode=bbcode">BBCode</a> is <em>ON</em></td></tr>
\t\t<tr><td class="gensmall">[img] is <em>ON</em></td></tr>
\t\t<tr><td class="gensmall">[flash] is <em>OFF</em></td></tr>
\t\t<tr><td class="gensmall">[url] is <em>ON</em></td></tr>
\t\t<tr><td class="gensmall">Smilies are <em>ON</em></td></tr>
\t\t</table>
\t</td>
\t<td class="row2">
\t\t<table cellpadding="1">
\t\t<tr>
\t\t\t<td><input type="checkbox" class="radio" name="disable_bbcode" /></td>
\t\t\t<td class="gen">Disable BBCode</td>
\t\t</tr>
\t\t<tr>
\t\t\t<td><input type="checkbox" class="radio" name="disable_smilies" /></td>
\t\t\t<td class="gen">Disable smilies</td>
\t\t</tr>
\t\t<tr>
\t\t\t<td><input type="checkbox" class="radio" name="disable_magic_url" /></td>
\t\t\t<td class="gen">Do not automatically parse URLs</td>
\t\t</tr>
\t\t<tr>
\t\t\t<td><input type="checkbox" class="radio" name="attach_sig" checked="checked" /></td>
\t\t\t<td class="gen">Attach a signature (signatures can be altered via the UCP)</td>
\t\t</tr>
\t\t<tr>
\t\t\t<td><input type="checkbox" class="radio" name="notify" /></td>
\t\t\t<td class="gen">Notify me when a reply is posted</td>
\t\t</tr>
\t\t</table>
\t</td>
</tr>

<tr>
\t<td class="cat" colspan="2" align="center">
\t\t<input class="btnlite" type="submit" tabindex="5" name="preview" value="Preview" />
\t\t&nbsp; <input class="btnmain" type="submit" accesskey="s" tabindex="6" name="post" value="Submit" />
\t\t&nbsp; <input class="btnlite" type="submit" accesskey="k" tabindex="7" name="save" value="Save draft" />
\t\t&nbsp; <input class="btnlite" type="submit" accesskey="c" tabindex="9" name="cancel" value="Cancel" />
\t</td>
</tr>

<tr>
\t<th colspan="2">Upload attachment</th>
</tr>
<tr>
\t<td class="row1" colspan="2"><span class="gensmall">If you wish to attach one or more files enter the details below.</span></td>
</tr>
<tr>
\t<td class="row1" width="22%"><b class="genmed">Filename</b></td>
\t<td class="row2"><input type="file" name="fileupload" size="40" /></td>
</tr>
<tr>
\t<td class="row1" width="22%"><b class="genmed">File comment</b></td>
\t<td class="row2">
\t\t<table border="0" cellspacing="4" cellpadding="0">
\t\t<tr>
\t\t\t<td><textarea class="post" name="filecomment" rows="3" cols="35"></textarea>&nbsp;</td>
\t\t\t<td valign="top"><input class="btnlite" type="submit" style="width:150px" name="add_file" value="Add the file" /></td>
\t\t</tr>
\t\t</table>
\t</td>
</tr>

<tr>
\t<td class="cat" colspan="2" align="center"><input type="hidden" name="topic_cur_post_id" value="900012" /><input type="hidden" name="lastclick" value="1767225600" />
\t\t<input class="btnlite" type="submit" tabindex="10" name="preview" value="Preview" />
\t\t&nbsp; <input class="btnmain" type="submit" accesskey="s" tabindex="11" name="post" value="Submit" />
\t\t&nbsp; <input class="btnlite" type="submit" accesskey="c" tabindex="14" name="cancel" value="Cancel" />
\t</td>
</tr>
</table>

\t<input type="hidden" name="creation_time" value="1767225600" />
<input type="hidden" name="form_token" value="0123456789abcdef0123456789abcdef01234567" />

\t</form>

<br clear="all" />

${review()}`;
}

fs.writeFileSync(path.join(FIXTURES, "posting.html"), shell(postingPage()));
console.log("wrote posting.html");

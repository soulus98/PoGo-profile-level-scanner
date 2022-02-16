/* eslint quotes: ["error", "backtick"]*/

/* Who even uses config files, just use pure code. lol

	You can use `backticks` to create what is called a called a "template literal"
	Template literal strings can stretch over multiple lines, but include white space charaters,
	so please be careful with formatting spaces, tabs, indents, newlines, etc
	This whole file is one big object, so like JSON, you need commas at the end of strings and whatnot

	My custom auto-replace options here are:
		<prefix>
		<targetLevel>
		<screenshotChannel>
		<profileChannel>
		<logsChannel>
		<targetLevelRole>
		<level40Role>
		<level50Role>
		<modRole> (this will show as @deleted-role in dms)
		<member>
		<level>
	Check error logs when including <member> and <level>, sometimes they aren't available
	The rest should work
	Here's hoping
*/

module.exports = {
	// Bot load message
	load: `The bot has awoken, Hello :wave:`,
	// DM when someone joins the server
	newMember:`Hey <member>, welcome to Pokémon GO Raids!

:small_blue_diamond: We require trainers to be level <targetLevel> to enter the main server. To gain full access to our server we need to validate your trainer level.

:small_blue_diamond: Please post your screenshot in: <screenshotChannel> or reply to this message.

:small_blue_diamond: If you are under <targetLevel>, feel free to join our sister server, linked in <screenshotChannel>.

:small_blue_diamond: If you have any issues or questions, just send a message here and it will be forwarded to the server staff.

Good luck, trainer!`,
	// DM when someone is denied because of the blacklist.
	denyBlacklist:`Hey, <member>.
We are sorry, but you are currently prohibited from using the automated system due to a recent screenshot that was scanned under level <targetLevel>.
If you have surpassed level <targetLevel>, respond to this message to speak to the staff team.
Otherwise, keep leveling up, and post your screenshot when you have reached that point.
Hope to raid with you soon! :wave:`,
	// DM when someone is scanned/confirmed as under tagetLevel (aka under 30)
	underLevel:`Hey <member>!
Thank you so much for your interest in joining our raid server.
Unfortunately we have a level requirement of <targetLevel> to gain full access, and your screenshot was scanned at <level>.
If this level is incorrect, please reply to this message to speak to the staff.
Gaining xp is very easy to do now with friendships, events, lucky eggs and so much more! Please stay and hang out with us here.
You can use <#733418314222534826> to add other trainers and get the xp you need to hit level <targetLevel>!
Once you've reached that point, please repost your screenshot, or message this bot to alert the staff team, if you need to be let in manually.

In the meantime please join our sister server with this link.
Hope to raid with you soon! :slight_smile:
https://discord.gg/bTJxQNKJH2`,
	// DM Part 1 when someone is above targetLevel, but already has targetLevelRole.
	rrPossessed:`You already have the Remote Raids role`,
	// DM Part 1 when someone is above targetLevel
	successDM:`Hey, <member>. Thanks for the screenshot confirming you are level <level> - if this level is incorrect, please reply to this message.

:small_blue_diamond: The final step to give full raid access is to verify your trainer information

:small_blue_diamond: Please type \`$verify\` in <profileChannel>. You might be asked for your Trainer Code (so have it ready) and trainer name.

:small_blue_diamond: Extra commands such as \`$team <team-name>\` and \`$level <35>\` are pinned in <profileChannel>.

:small_blue_diamond: Instructions for joining and hosting raids are over at #how-to-remote-raid. Please also be familiar with the rules in #start

:small_blue_diamond: Feel free to ask any questions in #help-and-feedback or you can DM here at any time to send a message to the staff team.

Have fun raiding. :wave:`,
	// In regard to the previous two messages, there is a potential Part 2 and Part 3 added before the DM is sent
	// example: however/also we congratulate you on achieving such a high level. For this you have been given the level40 and level 50 vanity roles
	// Due to their logic, it is impossible to add it here. You can find it in approve.js line 229, but I doubt it would be neccesary to change it

	// Message posted in profileChannel when someone is above targetLevel
	successProfile:`Hey, <member>. Welcome to the server. :partying_face:

:small_blue_diamond: Start by typing \`$verify\` in this channel. You might be asked for your Trainer Code (so have it ready).

:small_blue_diamond: Extra commands such as \`$team <team-name>\` and \`$level 35\` are pinned and posted in this channel.

:small_blue_diamond: Instructions for joining and hosting raids are over at <#733418554283655250>. Please also be familiar with the rules in <#747656566559473715>.

Feel free to ask any questions you have over in <#733706705560666275>.
Have fun raiding. :wave:`,
	// Message posted in screenshotChannel when someone is above targetLevel. This is the 5-sec delete message
	successSS:`Hey, <member>. Welcome to the server. :partying_face:

:small_blue_diamond: Start by typing \`$verify\` in <profileChannel>. You might be asked for your Trainer Code (so have it ready).`,
	// DM after using ]r to revert someone's role
	revert:`Hey <member>!
Please do not try to trick the screenshot bot.
As I am sure you are aware, we have a level requirement of <targetLevel> to gain full access.
Gaining xp is very easy to do now with friendships, events, lucky eggs and so much more! Please stay and hang out with us here.
You can use <#733418314222534826> to connect with other trainers and get the xp you need to hit level <targetLevel>!
Once you've reached that point, please repost your screenshot, or message <@575252669443211264> if you have to be let in manually.

In the meantime please join our sister server with this link.
Hope to raid with you soon! :slight_smile:
https://discord.gg/bTJxQNKJH2`,
		// reply in PYS after a fail
    fail:`I was unable to find your level in this profile screenshot.
Please standby and wait for a <modRole> to manually approve you. :slight_smile:`,
    // DM after a failed image
    failDm:`Sorry, <member>, but there was an issue scanning your profile screenshot.
Make sure you follow the example at the top of <screenshotChannel>.
If part of your buddy is close to the level number (such as gyarados whiskers or giratina feet), try rotating it out of the way.
If there was a different cause, please explain to the staff team by responding to this message.`,
		// dmMail mode setActivity
		activity:`DM to Contact Staff`,
		// dmMail mode close message
		dmClose:`Thank you for contacting us, this ticket is now closed.
Please only reply if you want to create a new ticket.`,
		// dmMail mode open message
		dmOpen:`Thank you for your message.
A staff member will reply to you here as soon as possible.`,
		// dmMail mode hostOpen message		In this one, <member> refers to the mod instanciating the ticket, and is the only one that can access <server>
		dmHostOpen:`Staff member <member> from <server> would like to speak to you.
Their message will follow shortly.`,
		// message sent after Pokenav says ":white_check_mark: Complete" in channels that aren't filtered
		respondVerify:`<member>, you are now ready to host and join raids!
:small_blue_diamond: If no questions were asked, pokenav might have pulled your information from another server if you were already verified there.
:small_blue_diamond: Please read through <#733418554283655250> to understand the raiding process used in this server.
:small_blue_diamond: Also head to <#757750580641923072> to sign up for notifications when certain raid bosses are posted. Welcome to the server!
`,
};

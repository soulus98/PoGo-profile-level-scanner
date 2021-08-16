const {saveStats} = require("../func/saveStats.js");
const {dateToTime} = require("../func/dateToTime.js")
const {saveBlacklist} = require("../func/saveBlacklist.js");

module.exports = {
	name: "revert-screenshot-role",
	description: "Will revert one member from having the Remote Raids role. ATM this is in development, and is most likely not needed.",
	aliases: ["r","revert", "revert-role"],
	usage: `\`${prefix}revert [@mention]\``,
	guildOnly: true,
	args: true,
	permissions: "MANAGE_ROLES",
	execute(message, args) {
		execTime = dateToTime(new Date());
		return new Promise(function(resolve, reject) {
			if (args[0].charAt(0) == "<") {
				id = args[0].slice(3,-1);
			} else {
				id = args[0];
			}
			const member = server.members.cache.get(id);
			if (member == null){
				if (member === null) {
					message.lineReply("That member has just left the server, and can not be processed.");
					resolve(`, but it failed, since the member, #${id}, left the server before they could be processed.`);
				} else if (member === undefined) { //this should not be accessable unless using a command
					message.lineReply("There is a typo, or some other issue, which causes me to not be able to find that member.");
					resolve(`, but it failed, due to a typo or some other issue. Id: ${id}`);
				} else {
					message.lineReply("Oops impossible error. Tell Soul please.");
					console.error(`[${execTime}]: Error: Member is nullish without being null or undefined... Impossible error? Tell Soul pls`);
					resolve(`, but it failed, due to an impossible error regarding member nullishness.`);
				}
				return;
			}
			const logggString = ` and tagged ${member.user.username}${member.user}`;
			let had30 = new Promise(function(had) {
				if(level30Role && member.roles.cache.has(level30Role)){
						member.roles.remove(level30Role).then(()=>{
							had(true);
						}).catch((err)=>{
							console.error(`[${execTime}]: Error: Could not take RR from ${member.user.username}. Error: ${err}`);
							resolve(logggString + `, but an error occured.`);
						});
				} else had(false);
			});
			let had40 = new Promise(function(had) {
				if(level40Role && member.roles.cache.has(level40Role)){
						member.roles.remove(level40Role).then(()=>{
							had(true);
						}).catch((err)=>{
							console.error(`[${execTime}]: Error: Could not take Level 40 from ${member.user.username}. Error: ${err}`);
							resolve(logggString + `, but an error occured.`);
						});
				} else had(false);
			});
			let had50 = new Promise(function(had) {
				if(level50Role && member.roles.cache.has(level50Role)){
						member.roles.remove(level50Role).then(()=>{
							had(true);
						}).catch((err)=>{
							console.error(`[${execTime}]: Error: Could not take Level 50 from ${member.user.username}. Error: ${err}`);
							resolve(logggString + `, but an error occured.`);
						});
				} else had(false);
			});
			Promise.all([had30,had40,had50]).then((vals) =>{
				var took30 = vals[0];
				var took40 = vals[1];
				var took50 = vals[2];
				if (took30 || took40 || took50) { //dave, reversion dm.
					member.send(`Hey ${member}!
Please do not try to trick the screenshot bot.
As I am sure you are aware, we have a level requirement of 30 to gain full access.
Gaining xp is very easy to do now with friendships, events, lucky eggs and so much more! Please stay and hang out with us here.
You can use <#733418314222534826> to connect with other trainers and get the xp you need to hit level 30!
Once you've reached that point, please repost your screenshot, or message <@575252669443211264> if you have to be let in manually.

In the meantime please join our sister server with this link.
Hope to raid with you soon! :slight_smile:
https://discord.gg/bTJxQNKJH2`);
					blacklist.set(id,Date.now());
					saveBlacklist();
					saveStats("revert");
					resolve(logggString + `. I removed ${(took30?"RR":"")}${(took40?`${took30?", ":""}Level 40`:"")}${(took50?`${took30||took40?", ":""}Level 50`:"")}`);
				} else {
					message.lineReply(`That member had none of the roles that \`${prefix}revert\` can remove. Perhaps you wanted \`${prefix}c\` aka \`${prefix}confirm\``);
					resolve(logggString + `, but that member had none of the roles that I can remove.`);
				}
			});
		});
	},
};

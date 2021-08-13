const {saveStats} = require("../func/saveStats.js");
const {dateToTime} = require("../func/dateToTime.js")
const {saveBlacklist} = require("../func/saveBlacklist.js");

module.exports = {
	name: "approve",
	description: "Manually approves a user. Can include level for vanity roles/stats purposes, or a level under 30 to reject/dm.",
  aliases: ["a","app","reject"],
  usage: `\`${prefix}a <@mention/ID> [level]\``,
	guildOnly:true,
  args: true,
	permissions: "MANAGE_ROLES",
	execute(input, args) {
		execTime = dateToTime(new Date());
		let prom = new Promise(function(resolve, reject) {
			server = input.guild;
			if (input[1] == undefined) {
				inCommand = true;
				message = input;
				image = message.attachments.first();
				logimg = false;
				if (args[0].charAt(0) == "<") {
					id = args[0].slice(3,-1);
				} else {
					id = args[0];
				}
				level = args[1] || "missing";
				resolve(server.members.cache.get(id));
				//id, level
			} else {
				inCommand = false;
				message = input[0];
				image = message.attachments.first();
				logimg = input[1];
				id = args[0];
				level = args[1];
				server = message.guild;
				resolve(message.member);
			}
		});

		//member leaves midway === null
		//role id === undefined
		//any other mistype === undefined
		return prom.then(function(member) {
			if (member == null){
				if (member === null) {
					console.error(`[${execTime}]: Error: #${id} left the server before they could be processed.`);
					if (inCommand) {
						message.lineReply("That member has just left the server, and can not be processed.");
						return `, but it failed, since the member, #${id}, left the server before they could be processed.`;
					} else {
						logimg.edit(`User: ${message.author}\nLeft the server. No roles added.`,image);
					}
				} else if (member === undefined) { //this should not be accessable unless using a command
					message.lineReply("There is a typo, or some other issue, causing me to not be able to find that member.");
					return `, but it failed, due to a typo or some other issue. Id: ${id}`;
				} else {
					console.error(`[${execTime}]: Error: Member is nullish without being null or undefined... Impossible error? Tell Soul pls`);
					return `, but it failed, due to an impossible error regarding member nullishness.`;
				}
				return;
			};
			logString = `, and tagged ${member.user.username}`;
			if (!(level == "missing") && (isNaN(level) || level >50 || level <1)){
				console.error(`[${execTime}]: Error: Level - ${level} - is NaN, >50, or <1 despite being checked already... Impossible error? Tell Soul pls`);
				return `, but it failed, due to an impossible error regarding level checking.`;
			}
			const msgtxt = [];
			const give30 = (level>29)?true:false;
			const give40 = (level>39)?true:false;
			const give50 = (level==50)?true:false;
			let given30 = given40 = given50 = false;
			if (!give30) {
				if (!inCommand && !deleteScreens && !message.deleted) message.react("👎").catch(()=>{
					console.error(`[${execTime}]: Error: Could not react 👎 (thumbsdown) to message: ${message.url}\nContent of mesage: "${message.content}"`);
				});
				member.send(`Hey ${member}!
Thank you so much for your interest in joining our raid server.
Unfortunately we have a level requirement of 30 to gain full access, and your screenshot was scanned at ${level}.
Gaining xp is very easy to do now with friendships, events, lucky eggs and so much more! Please stay and hang out with us here.
You can use <#733418314222534826> to connect with other trainers and get the xp you need to hit level 30!
Once you've reached that point, please repost your screenshot, or message <@575252669443211264> if you have to be let in manually.

In the meantime please join our sister server with this link.
Hope to raid with you soon! :slight_smile:
https://discord.gg/bTJxQNKJH2`).catch(() => {
					console.error(`[${execTime}]: Error: Could not send DM to ${member.user.username}${member}`);
				});
				blacklist.set(id,Date.now());
				saveBlacklist();
				console.log(`[${execTime}]: User ${member.user.username}${member} was added to the blacklist`);
				if (!inCommand) {
					logimg.edit(`User: ${member}\nResult: \`${level}\`\nBlacklisted for ${config.numbers.blacklistTime} day${(config.numbers.blacklistTime==1)?"":"s"}`,image);
				}
				saveStats(level);
				return;
			} else {
				g30 = new Promise(function(resolve) {
					if(member.roles.cache.has(level30Role)){
						msgtxt.push("You already have the Remote Raids role");
						resolve(false);
					} else {

						channel.send(`Hey, ${member}. Welcome to the server. :partying_face:

 • Start by typing \`$verify\` in <#740262255584739391>. The bot will then ask for your Trainer Code, so have it ready.`).then(msg => {
							setTimeout(()=>{
								msg.delete().catch(()=>{
									console.error(`[${execTime}]: Error: Could not delete message: ${msg.url}\nContent of mesage: "${msg.content}"`);
								});
							},5000);
						});
						setTimeout(()=>{
							member.roles.add(server.roles.cache.get(level30Role)).catch(console.error);
						},250);
						resolve(true);
						setTimeout(()=>{
							profile.send(`Hey, ${member}. Welcome to the server. :partying_face:

 • Start by typing \`$verify\` in this channel. The bot will then ask for your Trainer Code, so have it ready.

 • Extra commands such as \`$team <team-name>\` and \`$level 35\` are pinned and posted in this channel. Just ask if you can't find them.

 • Instructions for joining and hosting raids are over at <#733418554283655250>. Please also be familiar with the rules in <#747656566559473715>.

Feel free to ask any questions you have over in <#733706705560666275>.
Have fun raiding. :wave:`);
						}, 3000);
						msgtxt.push(`Hey, ${member}. Welcome to the server. :partying_face:

 • Start by typing \`$verify\` in <#740262255584739391>. The bot will then ask for your Trainer Code, so have it ready.

 • Extra commands such as \`$team <team-name>\` and \`$level <no>\` are pinned in that channel. Just ask if you can't find them.

 • Instructions for joining and hosting raids are over at <#733418554283655250>. Please also be familiar with the rules in <#747656566559473715>

Feel free to ask any questions you have over in <#733706705560666275>.
Have fun raiding. :wave:`);
					}
				}).then((given30)=>{
					g40 = new Promise((resolve) => {
						if (give40) {
							if (!(level40Role == "0")) {
								if (!member.roles.cache.has(level40Role)) {
									member.roles.add(server.roles.cache.get(level40Role)).catch(console.error);
									resolve(true);
								} else {
									resolve(false);
								}
							} else {
								resolve(false);
							}
						} else {
							resolve(false);
						}
					});
					g50 = new Promise((resolve) => {
						if (give50) {
							if (!(level50Role == "0")) {
								if (!member.roles.cache.has(level50Role)) {
									member.roles.add(server.roles.cache.get(level50Role)).catch(console.error);
									resolve(true);
								} else {
									resolve(false);
								}
							} else {
								resolve(false);
							}
						} else {
							resolve(false);
						}
					});
					Promise.all([g40, g50]).then((vals) => {
						given40 = vals[0];
						given50 = vals[1];
						if (given30 || given40 || given50){
							if (!inCommand && !deleteScreens && !message.deleted) message.react("👍").catch(()=>{
								console.error(`[${execTime}]: Error: Could not react 👍 (thumbsup) to message: ${message.url}\nContent of mesage: "${message.content}"`);
							});
						}
					});
				});
			}
		});
	},
};

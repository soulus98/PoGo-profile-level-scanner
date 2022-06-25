const { saveStats } = require("../func/stats.js"),
			{ dateToTime } = require("../func/misc.js"),
			{ saveBlacklist } = require("../func/saveBlacklist.js"),
			messagetxt = require("../server/messagetxt.js"),
			{ messagetxtReplace } = require("../func/misc.js");

module.exports = {
	name: "revert-screenshot-role",
	description: "Will revert one member from having the Remote Raids role and both vanity roles. Will also dm and add to blacklist",
	aliases: ["re", "revert", "revert-role"],
	usage: `\`${ops.prefix}re <@mention/ID>\``,
	guildOnly: true,
	args: true,
	scanningOnly: true,
	type:"Screenshots",
	execute(message, args) {
		const server = (ops.serverID) ? message.client.guilds.cache.get(ops.serverID) : undefined;
		const channel = (ops.screenshotScanning && ops.screenshotChannel) ? message.client.channels.cache.get(ops.screenshotChannel) : undefined;
		const badges = (ops.badgeChannel) ? message.client.channels.cache.get(ops.badgeChannel) : undefined;
		return new Promise(function(bigResolve) {
		if (args[1]){
			message.reply(`Please provide only one user in the format \`${ops.prefix}r <@mention/ID>\``);
			bigResolve(", but it failed, since the format was wrong.");
			return;
		}
		let id = "";
		const execTime = dateToTime(new Date());
		const mentions = message.mentions.users;
			if (mentions.size > 1) {
				message.reply("Sorry, but I cannot revert more than one user at a time.");
				bigResolve(", but it failed, since they tagged two people in the command.");
				return;
			}
			const idProm = new Promise(function(resolve) {
				if (args[0].startsWith("<@") && args[0].endsWith(">")) {
					id = args[0].slice(2, -1);
					if (id.startsWith("!")){
						id = id.slice(1);
					}
				} else {
					id = args[0];
				}
				server.members.fetch(id).then((memb) => {
					resolve(memb);
				}).catch((err) => {
					if (err.name == "DiscordAPIError"){
						if (mentions.size == 1) {
							const memb = mentions.first();
							if (memb === undefined){
								message.reply("I could not find this member, they may have left the server.");
								bigResolve(`, but it failed, since I couldn't fetch member ${id}.`);
								return;
							} else {
								server.members.fetch(memb.id).then((mem) => {
									resolve(mem);
									return;
								}).catch((err) => {
									message.reply("I could not find this member for an exceptionally unexpected reason. Tell the developer please.");
									console.error(`[${execTime}]: Error: An (exceptionally!) unexpected error occured when trying to fetch ${id}. Err:${err}`);
									bigResolve(`, but it failed, due to an unexpected error when trying to fetch ${id}.`);
									return;
								});
							}
						} else {
							message.reply("There may be a typo, or some other issue, which causes me to not be able to find this member.");
							bigResolve(`, but it failed, due to a typo or some other issue. Id: ${id}.`);
							return;
						}
					} else {
						message.reply("I could not find this member for an unexpected reason. Tell the developer please.");
						console.error(`[${execTime}]: Error: An unexpected error occured when trying to fetch ${id}.  Err:${err}`);
						bigResolve(`, but it failed, due to an unexpected error when trying to fetch ${id}.`);
						return;
					}
				});
			});
			idProm.then((member) => {
				const logggString = ` and tagged ${member.user.username}${member.user}`;
				const had30 = new Promise((had) => {
					if (ops.targetLevelRole && member.roles.cache.has(ops.targetLevelRole)){
							member.roles.remove(ops.targetLevelRole).then(() => {
								if (ops.targetLevelBadge){
									if (ops.badgeChannel){
										badges.send(`<@428187007965986826> rb ${ops.targetLevelBadge} ${id}`);
									} else console.error(`[${execTime}]: Error. badgeChannel is not set.`);
								}
								had(true);
							}).catch((err) => {
								console.error(`[${execTime}]: Error: Could not take RR role from ${member.user.username}. Error: ${err}`);
								bigResolve(logggString + ", but an error occured.");
							});
					} else had(false);
				});
				const had40 = new Promise((had) => {
					if (ops.level40Role && member.roles.cache.has(ops.level40Role)){
							member.roles.remove(ops.level40Role).then(() => {
								if (ops.level40Badge){
									if (ops.badgeChannel){
										badges.send(`<@428187007965986826> rb ${ops.level40Badge} ${id}`);
									} else console.error(`[${execTime}]: Error. badgeChannel is not set.`);
								}
								had(true);
							}).catch((err) => {
								console.error(`[${execTime}]: Error: Could not take Level 40 role from ${member.user.username}. Error: ${err}`);
								bigResolve(logggString + ", but an error occured.");
							});
					} else had(false);
				});
				const had50 = new Promise((had) => {
					if (ops.level50Role && member.roles.cache.has(ops.level50Role)){
							member.roles.remove(ops.level50Role).then(() => {
								if (ops.level50Badge){
									if (ops.badgeChannel){
										badges.send(`<@428187007965986826> rb ${ops.level50Badge} ${id}`);
									} else console.error(`[${execTime}]: Error. badgeChannel is not set.`);
								}
								had(true);
							}).catch((err) => {
								console.error(`[${execTime}]: Error: Could not take Level 50 role from ${member.user.username}. Error: ${err}`);
								bigResolve(logggString + ", but an error occured.");
							});
					} else had(false);
				});
				const hadVH = new Promise((had) => {
					if (ops.verifiedRole && member.roles.cache.has(ops.verifiedRole)){
							member.roles.remove(ops.verifiedRole).then(() => {
								had(true);
							}).catch((err) => {
								console.error(`[${execTime}]: Error: Could not take verified host role from ${member.user.username}. Error: ${err}`);
								bigResolve(logggString + ", but an error occured.");
							});
					} else had(false);
				});
				Promise.all([had30, had40, had50, hadVH]).then((vals) => {
					const took30 = vals[0];
					const took40 = vals[1];
					const took50 = vals[2];
					const tookVH = vals[3];
					if (took30 || took40 || took50 || tookVH) { // dave, reversion dm.
						message.react("👍").catch(() => {
							console.error(`[${execTime}]: Error: Could not react 👍 (thumbsup) to message: ${message.url}\nContent of mesage: "${message.content}"`);
						});
						member.send(messagetxtReplace(messagetxt.revert, member)).catch(() => {
							console.error(`[${execTime}]: Error: Could not send DM to ${member.user.username}${member}`);
						});
						blacklist.set(id, Date.now());
						saveBlacklist(blacklist);
						saveStats("revert");
						const logs = (ops.logsChannel) ? message.client.channels.cache.get(ops.logsChannel) : undefined;
						logs.send({ content: `${message.author.username}#${message.author.id} used \`${ops.prefix}revert\` and tagged ${member}. I removed ${(took30 ? "RR" : "")}${(took40 ? `${took30 ? ", " : ""}Level 40` : "")}${(took50 ? `${took30 || took40 ? ", " : ""}Level 50` : "")}${(tookVH ? `${took30 || took40 || took50 ? ", " : ""}VH` : "")}.` });
						bigResolve(logggString + `. I removed ${(took30 ? "RR" : "")}${(took40 ? `${took30 ? ", " : ""}Level 40` : "")}${(took50 ? `${took30 || took40 ? ", " : ""}Level 50` : "")}${(tookVH ? `${took30 || took40 || took50 ? ", " : ""}VH` : "")}.`);
						if (ops.msgDeleteTime && !(message.channel.parent && message.channel.parentId == ops.mailCategory)){
							setTimeout(function() {
								message.delete().catch(() => {
									console.error(`[${execTime}]: Error: Could not delete message: ${message.url}\nContent of mesage: "${message.content}"`);
								});
							}, ops.msgDeleteTime);
						}
						channel.messages.fetch({ limit:10 }).then(msgs => {
							const selfMsgs = msgs.filter(msg =>
								((msg.author == message.client.user) && (msg.mentions.members.has(id)) && !msg.pinned && msg.content.slice(0, 4) != "Hey,") // bot messages
								|| ((msg.author.id == id) && !msg.pinned)); // member messages
							channel.bulkDelete(selfMsgs).catch((err) => {
								console.error(`[${execTime}]: Error: Could not bulk delete ${selfMsgs.size} messages. Error message: ${err}`);
							});
						});
					} else {
						message.reply(`That member had none of the roles that \`${ops.prefix}revert\` can remove. Perhaps you wanted \`${ops.prefix}c\` aka \`${ops.prefix}confirm\``);
						bigResolve(logggString + ", but that member had none of the roles that I can remove.");
					}
				});
			});
		});
	},
};

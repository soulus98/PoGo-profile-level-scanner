const { saveStats } = require("../func/stats.js"),
	{ dateToTime, performanceLogger } = require("../func/misc.js"),
	{ saveBlacklist } = require("../func/saveBlacklist.js"),
	mail = require("../handlers/dm.js"),
	messagetxt = require("../server/messagetxt.js"),
	{ messagetxtReplace } = require("../func/misc.js");
const { deleteScreenshotReviews } = require("../func/screenshotReview.js");

// const server = (ops.serverID) ? client.guilds.cache.get(ops.serverID) : undefined;
// const logs = (ops.logsChannel) ? client.channels.cache.get(ops.logsChannel) : undefined;
// const channel = (ops.screenshotScanning && ops.screenshotChannel) ? client.channels.cache.get(ops.screenshotChannel) : undefined;
// const profile = (ops.profileChannel) ? client.channels.cache.get(ops.profileChannel) : undefined;

module.exports = {
	name: "confirm-screenshot",
	description: "Manually approve/reject a user by telling the bot the user's level. `level` can be omitted, the bot will still approve.",
	aliases: ["c", "con", "confirm"],
	usage: `\`${ops.prefix}c <@mention/ID> [level]\``,
	guildOnly: true,
	args: true,
	scanningOnly: true,
	type: "Screenshots",
	execute(input, args, button) {
		// This command uses input rather than message, since it can be called via a command OR by the main screenshot process
		return new Promise(function(bigResolve) {
			const execTime = dateToTime(new Date());
			const prom = new Promise(function(resolve) {
				if (input[1] == undefined) {
					const inCommand = true;
					const message = (button) ? input.message : input; // If called by command, message = input, if by button, input.message
					const server = (ops.serverID) ? message.client.guilds.cache.get(ops.serverID) : undefined;
					if (args[2]) {
							message.reply("Use `@Bot admin scan confirm <@mention/ID> [level]`.");
						bigResolve(", but it failed, since the format was wrong.");
						return;
					}
						const mentions = message.mentions.users.filter(user => user.id != message.client.user.id);
					if (mentions.size > 1) {
						message.reply("Sorry, but I cannot confirm more than one user at a time.");
						bigResolve(", but it failed, since they tagged two people in the command.");
						return;
					}
					const isMailTicket = message.channel.parentId == ops.mailCategory;
					const firstArgLooksLikeLevel = args[0] && /^\d+$/.test(args[0]) && args[0] >= 1 && args[0] <= 80;
					const useMailFallback = isMailTicket && (!args[0] || (firstArgLooksLikeLevel && !args[1]));
					let level = "missing";
					let id = 0;

					if (useMailFallback) {
						if (args[0]) level = args[0];
						getUserIdFromFirstTicketMessage(message.channel).then((ticketId) => {
							if (!ticketId) {
								message.reply("I could not determine the ticket user from the first message in this channel. Please provide a user mention/ID.");
								bigResolve(", but it failed, since no user ID was supplied and the ticket user could not be resolved.");
								return;
							}
							id = ticketId;
							if (!(level == "missing") && (isNaN(level) || level > 80 || level < 1)) {
								message.reply("Please provide a level between 1 and 80.");
								bigResolve(", but it failed, since the level was outside the allowed range.");
								return;
							}
							server.members.fetch(id).then((memb) => {
								const info = [inCommand, message, false, false, level, id, memb];
								resolve(info);
							}).catch((err) => {
								if (err.name == "DiscordAPIError") {
									message.reply("I could not find this member, they may have left the server.");
									bigResolve(`, but it failed, since I couldn't fetch member ${id}.`);
									return;
								}
								message.reply("I could not find this member for an unexpected reason. Tell the developer please.");
								console.error(`[${execTime}]: Error: An unexpected error occured when trying to fetch ${id}.  Err:${err}`);
								bigResolve(`, but it failed, due to an unexpected error when trying to fetch ${id}.`);
							});
						}).catch((err) => {
							message.reply("I could not inspect the ticket history to determine the member ID. Please provide a mention/ID.");
							console.error(`[${execTime}]: Error: Could not resolve ticket user id in ${message.channel}. Err:${err}`);
							bigResolve(", but it failed, since the ticket history could not be read.");
						});
						return;
					}

					if (args[1] > 80 || args[1] < 1 || (args[1] && isNaN(args[1]))) {
						message.reply("Please provide a level between 1 and 80.");
						bigResolve(", but it failed, since the level was outside the allowed range.");
						return;
					}
					level = args[1] || "missing";
					if (args[0].startsWith("<@") && args[0].endsWith(">")) {
						id = args[0].slice(2, -1);
						if (id.startsWith("!")) id = id.slice(1);
					} else {
						id = args[0];
					}
					server.members.fetch(id).then((memb) => {
						const info = [inCommand, message, false, false, level, id, memb];
						resolve(info);
					}).catch((err) => {
						if (err.name == "DiscordAPIError") {
							if (mentions.size == 1) {
								const memb = mentions.first();
								if (memb === undefined) {
									message.reply("I could not find this member, they may have left the server.");
									bigResolve(`, but it failed, since I couldn't fetch member ${id}.`);
									return;
								} else {
									server.members.fetch(memb.id).then((mem) => {
										const info = [inCommand, message, false, false, level, id, mem];
										resolve(info);
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

					// id, level
				} else {
					const inCommand = false;
					const message = input[0]; // If called from a screenshot, input is [message, postedTime]
					const postedTime = input[1];
					const image = message.attachments.first();
					const level = args[1];
					const id = args[0];
					const memb = message.memb;
					const info = [inCommand, message, postedTime, image, level, id, memb];
					resolve(info);
				}
			});

			// member leaves midway === null
			// role id === undefined
			// any other mistype === undefined
			prom.then(function([inCommand, message, postedTime, image, level, id, member]) {
				const server = (ops.serverID) ? message.client.guilds.cache.get(ops.serverID) : undefined;
				const logs = (ops.logsChannel) ? message.client.channels.cache.get(ops.logsChannel) : undefined;
				const channel = (ops.screenshotScanning && ops.screenshotChannel) ? message.client.channels.cache.get(ops.screenshotChannel) : undefined;
				const profile = (ops.profileChannel) ? message.client.channels.cache.get(ops.profileChannel) : undefined;
				const badges = (ops.badgeChannel) ? message.client.channels.cache.get(ops.badgeChannel) : undefined;
				const dm = (message.channel.type == require("discord.js").ChannelType.DM) ? true : false;
				if (member === null) {
					console.error(`[${execTime}]: Error: #${id} left the server before they could be processed.`);
					if (inCommand) {
						message.reply("That member has *just* left the server, and can not be processed.");
						bigResolve(`, but it failed, since the member, #${id}, left the server before they could be processed.`);
					} else {
						logs.send({ content: `${(dm) ? "Sent in a DM\n" : ""}User: ${message.author}\nLeft the server. No roles added.`, files: [image] });
					}
					return;
				} else if (member === undefined) { // this should not be accessable unless using a command
					if (!inCommand) console.error(`[${execTime}]: Error: member is undefined without being in a command. Impossible error? Tell Soul pls`);
					message.reply("This member may have left the server. If not, then there is a typo, or some other issue, which causes me to not be able to find them.");
					bigResolve(`, but it failed, due to a typo or some other issue. (This might be an impossible error...? not sure) Id: ${id}.`);
					return;
				}
				let logString;
				if (inCommand) logString = ` and tagged ${member.user.username}${member.user}`;
				if (!(level == "missing") && (isNaN(level) || level > 80 || level < 1)) {
					console.error(`[${execTime}]: Error: Level - ${level} - is NaN, >80, or <1 despite being checked already... Impossible error? Tell Soul pls`);
					message.reply("Impossible error. Please tell the developer");
					bigResolve((logString || "") + ", but it failed, due to an impossible error regarding level checking.");
					return;
				}
				const msgtxt = [];
				const give30 = (level >= (ops.targetLevel || 30) || level == "missing") ? true : false;
				const give40 = (level >= 40) ? true : false;
				const give50 = (ops.level50Role !== "0" && level >= 80) ? true : false;
				if (!give30) {
					if (member.roles.cache.has(ops.targetLevelRole)) {
						if (ops.dmMail && dm) return mail.mailDM(message, "already", level);
						else if (!inCommand) member.send(`I'll be honest, this is weird.
Why would you send a screenshot of an account under level when you already have the role that means you are above the gate level...???
I am honestly curious as to why, so please shoot me a dm at <@146186496448135168>. It is soulus#3935 if that tag doesn't work.`);
							else message.reply("They already have the target role. You may want `@Bot admin scan revert <user>`.");
						if (!inCommand) logs.send({ content: `${(dm) ? "Sent in a DM\n" : ""}User: ${member}\nResult: \`${level}\`\nAlready had RR, no action taken.`, files: [image] });
						bigResolve((logString || "") + `, but it failed. They already have RR, so cannot be rejected${(!inCommand) ? ` for level ${level}` : ""}.`);
						return;
					}
					if (button) message.react("👎").catch(() => {
						console.error(`[${execTime}]: Error: Could not react 👎 (thumbsdown) to message: ${message.url}\nContent of mesage: "${message.content}"`);
					});
					else if (inCommand) message.react("👍").catch(() => {
						console.error(`[${execTime}]: Error: Could not react 👍 (thumbsup) to message: ${message.url}\nContent of mesage: "${message.content}"`);
					});
					else if (!dm && !ops.deleteScreens) message.react("👎").catch(() => {
						console.error(`[${execTime}]: Error: Could not react 👎 (thumbsdown) to message: ${message.url}\nContent of mesage: "${message.content}"`);
					});
					if (level < ops.targetLevel - 1 || ops.blacklistOneOff) {
						member.send(messagetxtReplace(messagetxt.underLevel, member, level)).catch(() => {
							console.error(`[${execTime}]: Error: Could not send DM to ${member.user.username}${member}`);
						});
						blacklist.set(id, Date.now());
						saveBlacklist(blacklist);
						bigResolve((logString || "") + `. Blacklisted for ${ops.blacklistTime / 86400000} day${(ops.blacklistTime / 86400000 == 1) ? "" : "s"}. Level ${level}.`);
						if (ops.dmMail) mail.alertMsg(message.author, "under", level);
						if (!inCommand) logs.send({ content: `${(dm) ? "Sent in a DM\n" : ""}User: ${member}\nResult: \`${level}\`\nBlacklisted for ${ops.blacklistTime / 86400000} day${(ops.blacklistTime / 86400000 == 1) ? "" : "s"}`, files: [image] });
						else logs.send({ content: `${message.author.username}#${message.author.id} used \`${ops.prefix}confirm\` and tagged ${member}, who was rejected and blacklisted for ${ops.blacklistTime / 86400000} day${(ops.blacklistTime / 86400000 == 1) ? "" : "s"}, for being under ${ops.targetLevel}.` });
					} else { // Due to the if logic, this block is only accessable if level is one less than targetLevel AND blacklistOneOff is false
						bigResolve((logString || "") + `. No action taken. Level ${level}.`);
						if (!dm || (dm && !ops.dmMail)) member.send(messagetxtReplace(messagetxt.underLevel, member, level)).catch(() => {
							console.error(`[${execTime}]: Error: Could not send DM to ${member.user.username}${member}`);
						});
						if (!inCommand) {
							const Discord = require("discord.js");
							const appButton = new Discord.ButtonBuilder().setCustomId("app").setLabel("Approve").setStyle(Discord.ButtonStyle.Success);
							const rejButton = new Discord.ButtonBuilder().setCustomId("rej").setLabel("Reject").setStyle(Discord.ButtonStyle.Danger);
							const canButton = new Discord.ButtonBuilder().setCustomId("canc").setLabel("Cancel").setStyle(Discord.ButtonStyle.Danger);
							const row1 = new Discord.ActionRowBuilder()
								.addComponents([appButton, rejButton]);
							const row2 = new Discord.ActionRowBuilder()
								.addComponents([appButton, canButton]);
							if (ops.dmMail && dm) {
								setTimeout(async () => {
									const mailResult = await mail.mailDM(message, "off-by-one", level, row1);
									let messageContent = `Sent in a DM\nUser: ${member}\nResult: \`${level}\`\nNo action taken.`;
									const messsageData = { files: [image] };
									if (mailResult == "sent") {
										messageContent = messageContent + "\nManual review via mail ticket";
									} else if (mailResult == "unsent" && ops.tagModOneOff) {
										messageContent = messageContent + `\nManual review, <@&${ops.modRole}>?`;
										messsageData.components = [row2];
									}
									messsageData.content = messageContent;
									logs.send(messsageData);
								}, 500);
							} else {
								const messageContent = `${(dm) ? "Sent in a DM\n" : ""}User: ${member}\nResult: \`${level}\`\nNo action taken.${(ops.tagModOneOff && !dm) ? `\nManual review, <@&${ops.modRole}>?` : ""}`;
								logs.send({ files: [image], content: messageContent, components: [row2] });
							}
						}
					}
					if (inCommand && !button) deleteStuff(message, execTime, id);
					saveStats(level);
					return;
				} else {
					new Promise(function(resolve) {
						if (member.roles.cache.has(ops.targetLevelRole)) {
							if (inCommand) {
								resolve(false);
							} else {
								msgtxt.push(messagetxtReplace(messagetxt.rrPossessed, member, level));
								resolve(false);
							}
						} else {
							if (!dm) channel.send(messagetxtReplace(messagetxt.successSS, member, (level == "missing") ? `${ops.targetLevel}+` : level)).then(msg => {
								setTimeout(() => {
									msg.delete().catch(() => {
										console.error(`[${execTime}]: Error: Could not delete message: ${msg.url}\nContent of mesage: "${msg.content}"`);
									});
								}, ops.msgDeleteTime);
							});
							setTimeout(() => {
								member.roles.add(server.roles.cache.get(ops.targetLevelRole)).catch(console.error);
							}, 250);
							if (ops.targetLevelBadge) {
								if (ops.badgeChannel && badges) {
									badges.send(`<@428187007965986826> gb ${ops.targetLevelBadge} ${id}`);
								} else console.error(`[${execTime}]: Error. badgeChannel is not set.`);
							}
							setTimeout(() => {
								profile.send(messagetxtReplace(messagetxt.successProfile, member, (level == "missing") ? `${ops.targetLevel}+` : level));
							}, 3000);
							msgtxt.push(messagetxtReplace(messagetxt.successDM, member, (level == "missing") ? `${ops.targetLevel}+` : level));
							resolve(true);
						}
					}).then((given30) => {
						const g40 = new Promise((resolve) => {
							if (give40) {
								if (!(ops.level40Role == "0")) {
									if (!member.roles.cache.has(ops.level40Role)) {
										member.roles.add(server.roles.cache.get(ops.level40Role)).catch(console.error);
										resolve(true);
										if (ops.level40Badge) {
											if (ops.badgeChannel) {
												badges.send(`<@428187007965986826> gb ${ops.level40Badge} ${id}`);
											} else console.error(`[${execTime}]: Error. badgeChannel is not set.`);
										}
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
						const g50 = new Promise((resolve) => {
							if (give50) {
								if (!(ops.level50Role == "0")) {
									if (!member.roles.cache.has(ops.level50Role)) {
										member.roles.add(server.roles.cache.get(ops.level50Role)).catch(console.error);
										resolve(true);
										if (ops.level50Badge) {
											if (ops.badgeChannel) {
												badges.send(`<@428187007965986826> gb ${ops.level50Badge} ${id}`);
											} else console.error(`[${execTime}]: Error. badgeChannel is not set.`);
										}
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
							const given40 = vals[0];
							const given50 = vals[1];
							if ((given30 || given40 || given50)) {
								if (given40 || given50) msgtxt.push(`${(msgtxt.length == 0) ? `Hey ${member}, ` : (!given30) ? ", however," : "\nAlso,"} we congratulate you on achieving such a high level.\nFor this you have been given the ${(given40) ? "\"Level 40\" " : ""}${(given50) ? (given40) ? "and the \"Level 80\" " : "\"Level 80\" " : ""}vanity role${(given40 && given50) ? "s" : ""}`);
								member.send(msgtxt.join("")).catch((err) => {
									if (err.httpStatus == "403") {
										console.error(`[${execTime}]: Error: Could not send msgtxt DM to ${member.user.username}${member.user}.`);
									} else {
										console.error(`[${execTime}]: Error: Could not send msgtxt DM to ${member.user.username}${member.user}. Msgtxt: ${msgtxt}. g30, g40, g50: ${given30}, ${given40}, ${given50}`);
										console.log(err);
									}
								});
								if ((!ops.deleteScreens || inCommand)) message.react("👍").catch(() => {
									console.error(`[${execTime}]: Error: Could not react 👍 (thumbsup) to message: ${message.url}\nContent of mesage: "${message.content}"`);
								});
							}
							if (!(given30 || given40 || given50) && inCommand) {
								message.react("🤷").catch(() => {
									console.error(`[${execTime}]: Error: Could not react 🤷 (person_shrugging) to message: ${message.url}\nContent of mesage: "${message.content}"`);
								});
								message.reply("That person already had the roles you asked me to give them. Check the command or the user and try again.").then((msg) => {
									setTimeout(() => {
										if (ops.msgDeleteTime) {
											msg.delete().catch(() => {
												console.error(`[${execTime}]: Error: Could not delete message: ${msg.url}\nContent of mesage: "${msg.content}"`);
											});
										}
									}, ops.msgDeleteTime);
								}).catch(() => {
									console.error(`[${execTime}]: Error: Could not reply to message: ${message.url}\nContent of mesage: "${message.content}"`);
								});
							}
							if (!inCommand) {
								if (!given30 && !given40 && !given50) {
									if (ops.dmMail && dm) {
										mail.mailDM(message, "already", level);
										return;
									} else {
										logs.send({ content: `${(dm) ? "Sent in a DM\n" : ""}User: ${message.author}\nResult: \`${level}\`\nRoles: RR already possessed. None added.`, files: [image] }).then(() => {
											if (ops.performanceMode) performanceLogger(`#${imgStats.imageLogCount}: Log img posted\t`, postedTime.getTime()); // testo?
										});
									}
								} else {
									if (ops.dmMail) mail.alertMsg(message.author, "given", level, given30, given40, given50);
									logs.send({ content: `${(dm) ? "Sent in a DM\n" : ""}User: ${member}\nResult: \`${level}\`\nRoles given: ${(given30 ? "RR" : "")}${(given40 ? `${given30 ? ", " : ""}Level 40` : "")}${(given50 ? `${given30 || given40 ? ", " : ""}Level 80` : "")}`, files: [image] }).then(() => {
										if (ops.performanceMode) performanceLogger(`#${imgStats.imageLogCount}: Log img posted\t`, postedTime.getTime()); // testo?
									});
								}
							} else if (!button) {
								logs.send({ content: `${message.author.username}#${message.author.id} used \`${ops.prefix}confirm\` and tagged ${member}, who was given ${(!given30 && !given40 && !given50) ? "no roles" : ""}${(given30 ? "RR" : "")}${(given40 ? `${given30 ? ", " : ""}Level 40` : "")}${(given50 ? `${given30 || given40 ? ", " : ""}Level 80` : "")}` });
							} else {
								logs.send({ content: `${input.user.username}#${input.user.id} used \`${ops.prefix}confirm\` and tagged ${member}, who was given ${(!given30 && !given40 && !given50) ? "no roles" : ""}${(given30 ? "RR" : "")}${(given40 ? `${given30 ? ", " : ""}Level 40` : "")}${(given50 ? `${given30 || given40 ? ", " : ""}Level 80` : "")}` });
							}
							saveStats(level);
							bigResolve((logString || "") + `. Given ${(!given30 && !given40 && !given50) ? "no roles" : ""}${(given30 ? "RR" : "")}${(given40 ? `${given30 ? ", " : ""}Level 40` : "")}${(given50 ? `${given30 || given40 ? ", " : ""}Level 80` : "")}. ${(!inCommand) ? `Level ${level}` : ""}.`);
							if (inCommand && !button) deleteStuff(message, execTime, id);
						});
					});
				}
			});
		});
	},
};

function deleteStuff(message, execTime, id) {
	if (ops.msgDeleteTime && !(message.channel.parent && message.channel.parentId == ops.mailCategory)) {
		setTimeout(function() {
			message.delete().catch(() => {
				console.error(`[${execTime}]: Error: Could not delete message: ${message.url}\nContent of mesage: "${message.content}"`);
			});
		}, ops.msgDeleteTime);
	}
	deleteScreenshotReviews(message.client, id).then((deleted) => {
		if (deleted) console.log(`[${execTime}]: Deleted ${deleted} screenshot review post${deleted == 1 ? "" : "s"} for user ${id}.`);
	}).catch((err) => {
		console.error(`[${execTime}]: Error deleting screenshot review posts for ${id}: ${err}`);
	});
}

function getUserIdFromFirstTicketMessage(channel) {
	return new Promise((resolve, reject) => {
		let oldestMessage = null;
		let before;

		function scanBatch() {
			const fetchOpts = { limit: 100 };
			if (before) fetchOpts.before = before;
			channel.messages.fetch(fetchOpts).then((msgs) => {
				if (msgs.size == 0) {
					resolve(oldestMessage ? extractTicketUserId(oldestMessage) : false);
					return;
				}

				const sorted = msgs.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
				oldestMessage = sorted.first();
				before = sorted.firstKey();

				if (msgs.size < 100) {
					resolve(extractTicketUserId(oldestMessage));
					return;
				}
				scanBatch();
			}).catch(reject);
		}

		scanBatch();
	});
}

function extractTicketUserId(msg) {
	if (!msg) return false;

	const idFromContentBracket = msg.content && msg.content.match(/\((\d{17,20})\)/);
	if (idFromContentBracket) return idFromContentBracket[1];

	const idFromMention = msg.content && msg.content.match(/<@!?(\d{17,20})>/);
	if (idFromMention) return idFromMention[1];

	if (msg.embeds && msg.embeds.length > 0) {
		for (const emb of msg.embeds) {
			const footerText = emb.footer && emb.footer.text;
			const idFromFooter = footerText && footerText.match(/(\d{17,20})$/);
			if (idFromFooter) return idFromFooter[1];

			if (emb.fields && emb.fields.length > 0) {
				for (const field of emb.fields) {
					if (!field || !field.value) continue;
					const idFromField = field.value.match(/(\d{17,20})/);
					if (idFromField) return idFromField[1];
				}
			}
		}
	}

	return false;
}

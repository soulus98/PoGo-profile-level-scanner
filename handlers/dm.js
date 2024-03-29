const Discord = require("discord.js"),
			{ dateToTime } = require("../func/misc.js"),
			messagetxt = require("../server/messagetxt.js"),
			{ messagetxtReplace } = require("../func/misc.js"),
			fs = require("fs"),
			path = require("path");
let queue = new Discord.Collection();
const tempQueue = [],
trapEmbed = new Discord.MessageEmbed(),
closeList = new Discord.Collection(),
trapRow = new Discord.MessageActionRow()
	.addComponents([
	new Discord.MessageButton()
	.setCustomId("mailSend").setLabel("Send").setStyle("SUCCESS"),
	new Discord.MessageButton()
	.setCustomId("mailCancel").setLabel("Cancel").setStyle("DANGER"),
]);


module.exports = {
	loadMailQueue() {
		return new Promise(function(resolve, reject) {
			queue = new Discord.Collection();
			new Promise((res) => {
				try {
					delete require.cache[require.resolve("../server/mailQueue.json")];
					res();
				} catch (e){
					if (e.code == "MODULE_NOT_FOUND") {
						// do nothing
						res();
					} else {
						reject("Error thrown when loading mail queue. Error:", e);
						return;
					}
				}
			}).then(() => {
				let queueJson = "";
				new Promise((res) => {
					try {
						queueJson = require("../server/mailQueue.json");
						res();
					} catch (e) {
						if (e.code == "MODULE_NOT_FOUND") {
							fs.writeFile(path.resolve(__dirname, "../server/mailQueue.json"), "[]", (err) => {
								if (err){
									reject("Error thrown when writing mail queue. Error: ", err);
									return;
								}
								console.log("Could not find mailQueue.json. Making a new one...");
								queueJson = require("../server/mailQueue.json");
								res();
							});
						}	else {
							reject("Error thrown when loading mail queue (2). Error: ", e);
							return;
						}
					}
				}).then(() => {
					for (const item of queueJson){
						queue.set(item[0], item[1]);
					}
					console.log("\nMail queue loaded");
					resolve(queue);
				});
			});
		});
	},
	// Function when a message is sent in the mailCategory
	channelMsg(message) {
		if (ops.dmAutoReply) {
			module.exports.reply(message, false);
		}
	},
	// function when a dm comes in
	async mailDM(message, status, level) {
		// if (message.attachments.first() && message.attachments.first().size / 1048576 > 50){ // size checking
		// 	message.reply("I cannot handle such a large file.\nThe limit is 50MB.\nPlease reduce the file size using paint or something similar.");
		// 	return;
		// }
		const server = (ops.serverID) ? message.client.guilds.cache.get(ops.serverID) : undefined;
		const member = await server.members.fetch(message.author.id).catch(() => {
			message.reply(`I can't seem to find you in my server, ${server.name}. Please make sure you've joined before sending a message here.`);
			console.error(`[${dateToTime(new Date())}]: Error: ${message.author.username}${message.author} could not be found in the guild, despite being able to DM the bot... Impossible bug?`);
		});
		let wasTemp = false;
		if (tempQueue.includes(member.id)) {
			wasTemp = true;
		}
		if (queue.has(member.id) || wasTemp){
			const p = new Promise((res, rej) => {
				if (wasTemp){
					setTimeout(async () => {
						const chId = queue.get(member.id);
						if (chId) {
							const ch = await server.channels.fetch(queue.get(member.id));
							res(ch);
						} else {
							message.reply("This message will not be forwarded to the staff.\nPlease answer the previous question before attempting to send more messages.");
							rej("unsent");
						}
					}, 1000);
				} else {
					server.channels.fetch(queue.get(member.id)).then((ch) => {
						res(ch);
					}).catch((err) => {
						if (err.code == 10003){
							queue.delete(member.id);
							saveQueue();
							message.reply("An error occured. Please try again.");
							console.error(`[${dateToTime(new Date())}]: Could not find a mail ticket for ${member.user.username}#${member.id}. Cleared the mailQueue.`);
						} else console.error(err);
							rej("unsent");
						});
					}
				}).then(async (channel) => {
					const embedIn = await newEmbed(message, "userReply");
					const embedOut = new Discord.MessageEmbed(embedIn);
					embedIn.setFooter({ text: (member.nickname || member.user.tag) + " | " + member.id, iconURL: member.user.avatarURL({ dynamic:true }) })
					.setTitle("Message Received");
					embedOut.setFooter({ text: server.name, iconURL: server.iconURL() })
					.setTitle("Message Sent");
					if (status && ops.dmScanning) await checkStatus(status, message, channel, level);
					await sendWithImg(message, channel, [embedIn]);
					const logs = (ops.mailLogChannel) ? message.client.channels.cache.get(ops.mailLogChannel) : undefined;
					logs.send({ embeds: [embedIn] });
					member.send({ embeds: [embedOut] });
					const msg = await module.exports.deleteAndClearTimer(channel.id);
					if (msg == "not found") return;
					else channel.send("Close timer cancelled");
				}).catch((e) => {
					if (e == "unsent") return "unsent";
				});
			if (p == "unsent") return "unsent";
		} else {
			if (message.content.length < 10 && !message.attachments.first()) {
				message.reply("This message is too short to be forwarded to the server staff. Please explain your issue more elaborately.");
				return "unsent";
			}
			tempQueue.push(member.id);
			trapEmbed.setTimestamp();
			const trapMessage = await message.reply({ components: [trapRow], embeds: [trapEmbed] });
			console.log(`[${dateToTime(new Date())}]: Pending mail ticket from ${message.author.username}`);
			let toggle = true;
			const filter = (interaction) => {
				if ((interaction.customId == "mailSend" || interaction.customId == "mailCancel")
				&& interaction.user.id == message.author.id
				&& toggle) return true;
			};
			const interaction = await trapMessage.awaitMessageComponent({ filter, time: 60 * 1000 }).catch(() => {
				console.log(`[${dateToTime(new Date())}]: Pending ticket from ${member.user.username} expired`);
				trapMessage.delete().catch((err) => console.error("Failed to delete dm trap:", err));
				tempQueue.splice(tempQueue.indexOf(member.id));
				message.reply("Message not sent.\nPlease send another message if you need support.");
				return "unsent";
			});
			if (interaction == "unsent") return "unsent";
			toggle = false;
			if (interaction.customId == "mailSend") {
				const [channel, embedStart] = await newChannel(message, member);
				console.log(`[${dateToTime(new Date())}]: ${member.user.username}${member} opened a new ticket via DM`);
				const embedIn = await newEmbed(message, "userReply");
				const embedOut = new Discord.MessageEmbed(embedIn);
				embedIn.setFooter({ text: (member.nickname || member.user.tag) + " | " + member.id, iconURL: member.user.avatarURL({ dynamic:true }) })
				.setTitle("Message Received");
				embedOut.setFooter({ text: server.name, iconURL: server.iconURL() })
				.setTitle("New Ticket Created")
				.addField("\u200b", `**${messagetxtReplace(messagetxt.dmOpen, member.user)}**`);
				await channel.send({ content: `${member} (${member.id})`, embeds: [embedStart] });
				if (status && ops.dmScanning) {
					await checkStatus(status, message, channel, level);
				}
				await sendWithImg(message, channel, [embedIn]);
				embedIn.setTitle("New Ticket Created");
				const logs = (ops.mailLogChannel) ? message.client.channels.cache.get(ops.mailLogChannel) : undefined;
				logs.send({ embeds: [embedIn] });
				await member.send({ embeds: [embedOut] });
				trapMessage.delete();
				return "sent";
			} else if (interaction.customId == "mailCancel") {
				console.log(`[${dateToTime(new Date())}]: Pending ticket from ${member.user.username} cancelled`);
				trapMessage.delete().catch((err) => console.error("Failed to delete dm trap:", err));
				tempQueue.splice(tempQueue.indexOf(member.id));
				message.reply("Message not sent.\nPlease send another message if you need support.");
				return "unsent";
			} else console.error("Impossible error involving mail toggle");
		}
	},
	hostOpen(message, args) {
		return new Promise((resolve, reject) => {
			if (message.content.length < 7) message.reply("You must supply a user or an ID to open a new ticket.");
			let id = 0;
			if (args.startsWith("<@") && args.endsWith(">")) {
				id = args.slice(2, -1);
				if (id.startsWith("!")) id = id.slice(1);
			} else {
				id = args;
			}
			if (queue.get(id)) {
				message.reply(`A channel already exists for that user: <#${queue.get(id)}>`);
				reject(`, but it failed, as a channel already existed for user: ${id}. Channel: ${queue.get(id)}`);
				return;
			}
			const server = (ops.serverID) ? message.client.guilds.cache.get(ops.serverID) : undefined;
			server.members.fetch(id).then(async (member) => {
				const embedIn = await newEmbed(message, "hostOpen");
				embedIn.setTitle("New Ticket");
				const embedOut = new Discord.MessageEmbed(embedIn);
				embedOut.setDescription(messagetxtReplace(messagetxt.dmHostOpen, message.author).replace(/<server>/g, `**${server.name}**`))
				.setFooter({ text: server.name, iconURL: server.iconURL() });
				member.send({ embeds: [embedOut] }).then(() => {
					newChannel(message, member).then(async ([channel, embedStart]) => {
						console.log(`[${dateToTime(new Date())}]: ${message.author.username}${message.author.toString()} opened a new ticket with ${member.user.username}${member.user.toString()}`);
						embedIn.setDescription(`Ticket opened with: ${member.user.toString()}\n${channel.toString()}\nOpened by: ${message.author.toString()}`)
						.setFooter({ text: (member.nickname || member.user.tag) + " | " + member.user.id, iconURL: member.user.avatarURL({ dynamic:true }) });
						embedStart.addField("Ticket opened by:", message.author.toString());
						await channel.send({ content: `${member.user} (${member.user.id})`, embeds: [embedStart] });
						const logs = (ops.mailLogChannel) ? message.client.channels.cache.get(ops.mailLogChannel) : undefined;
						logs.send({ embeds: [embedIn] }).then(() => {
							message.delete().catch(() => console.error(`[${dateToTime(new Date())}]: Error: Could not delete message: ${message.url}\nContent of mesage: "${message.content}"`)); // eslint-disable-line max-nested-callbacks
							resolve();
						});
					});
				}).catch(() => {
					message.reply("I can not message that member. They may have blocked me or turned off DMs.");
					reject(`, but it failed, as I could not message ${member.user.name}${member.user}`);
				});
			}).catch(() => {
				message.reply("There may be a typo, or some other issue, which causes me to not be able to find this member.");
				reject(`, but it failed, as I could not fetch member <@${id}>`);
			});
		});
	},
	async close(message, args) {
		return new Promise(function(resolve, reject) {
			if (!message.channel) return console.error(`[${dateToTime(new Date())}]: Error: I can not close <#${message.channelId}> as it no longer exists.`);
			getUser(message).then(async ([member, user]) => {
				const embedIn = await newEmbed(message, "close");
				embedIn.setTitle("Ticket closed");
				if (args == "") embedIn.setDescription("No reason provided.");
				else embedIn.setDescription(args);
				const embedOut = new Discord.MessageEmbed(embedIn);
				if (member) {
					embedIn.setFooter({ text: (member.nickname || member.user.tag) + " | " + member.user.id, iconURL: member.user.avatarURL({ dynamic:true }) });
				} else {
					embedIn.setFooter({ text: user.tag + " | " + user.id, iconURL: user.avatarURL({ dynamic:true }) });
				}
				embedOut.setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
				.addField("\u200b", `**${messagetxtReplace(messagetxt.dmClose, member.user)}**`);
				if (member) {
					member.send({ embeds: [embedOut] }).catch(() => {
						console.error(`[${dateToTime(new Date())}]: Error: I can not send a close DM to ${member.user.username}${member.user.id}`);
						return;
					});
					queue.delete(member.user.id);
				} else {
					user.send({ embeds: [embedOut] }).catch(() => {
						console.error(`[${dateToTime(new Date())}]: Error: I can not send a close DM to ${user.username}${user.id}`);
						return;
					});
					queue.delete(user.id);
				}
				const logs = (ops.mailLogChannel) ? message.client.channels.cache.get(ops.mailLogChannel) : undefined;
				logs.send({ embeds: [embedIn] });
				message.channel.delete().catch(() => {
					console.error(`[${dateToTime(new Date())}]: Error: Could not delete channel: ${message.channel.url}\nI likely need "Manage Channels" permission."`);
					message.reply(`I can not delete the channel, I may need the \`MANAGE_CHANNELS\` permission in <#${ops.mailCategory}>`);
				});
				saveQueue();
				if (member) {
					console.log(`[${dateToTime(new Date())}]: ${message.author.username}${message.author.toString()} closed the ticket with ${member.user.username}${member.user.toString()}`);
				} else {
					console.log(`[${dateToTime(new Date())}]: ${message.author.username}${message.author.toString()} closed the ticket with ${user.username}${user.toString()}`);
				}
				resolve();
			}).catch(() => {
				reject(`, but it failed, as channel ${message.channel.name}${message.channel} is not linked to a user.`);
			});
		});
	},
	reply(message, content) {
		return new Promise(function(resolve, reject) {
			getUser(message).then(async ([member, user]) => {
				if (message.content.startsWith("?") || message.content.startsWith("$") || message.content.startsWith("!") || message.content.startsWith(".")) return;
				if (!member) {
					console.error(`[${dateToTime(new Date())}]: Error: I can not send a mail DM to ${user.username}${user}`);
					message.reply("I can no longer reply to this member. They may have left the server, blocked me, or turned off DMs.");
					if (content) reject(`, but it failed, as ${user.name}${user} was not found in the server, and is therefore unmessageable.`);
					return;
				}
				const embedIn = await newEmbed(message, "hostReply", content || false);
				const embedOut = new Discord.MessageEmbed(embedIn);
				embedIn.setFooter({ text: (member.nickname || member.user.tag) + " | " + member.user.id, iconURL: member.user.avatarURL({ dynamic:true }) })
				.setTitle("Message Sent");
				embedOut.setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
				.setTitle("Message Received");
				sendWithImg(message, member.user, [embedOut]).then(() => {
					const logs = (ops.mailLogChannel) ? message.client.channels.cache.get(ops.mailLogChannel) : undefined;
					logs.send({ embeds: [embedIn] });
					sendWithImg(message, message.channel, [embedIn]).then(() => message.delete());
					resolve();
					module.exports.deleteAndClearTimer(message.channel.id).then((msg) => {
						if (msg == "not found") return;
						else message.channel.send("Close timer cancelled");
					});
				});
			}).catch(() => {
				if (content) reject(`, but it failed, as channel ${message.channel.name}${message.channel} is not linked to a user.`);
			});
		});
	},
	sync(message, args) {
		return new Promise(function(resolve, reject) {
			let id = 0;
			if (args.startsWith("<@") && args.endsWith(">")) {
				id = args.slice(2, -1);
				if (id.startsWith("!")) id = id.slice(1);
			} else {
				id = args;
			}
			if (queue.get(id)) {
				message.reply(`A channel already exists for that user: <#${queue.get(id)}>`);
				reject(`, but it failed, as a channel already existed for user: ${id}. Channel: ${queue.get(id)}`);
				return;
			}
			getUser(message, id).then(([member, user]) => {
				if (user) {
					message.reply("This user is not a member of the server, I cannot DM them.");
					reject(`, but it failed, as I could not find ${user} in the server.`);
				} else {
					queue.set(id, message.channel.id);
					saveQueue();
					message.react("👍");
					resolve(`, tagging ${member.user}. And it was successful.`);
				}
			}).catch((err) => {
				if (err == 1) {
					message.reply("There may be a typo, or some other issue, which causes me to not be able to find this user.");
					reject(", but it failed, perhaps due to a typo.");
				} else {
					console.error(`[${dateToTime(new Date())}]: Error: User: ${id} was false while syncing.`);
					message.reply("An error occured, I can not fetch this user. Impossible error? Please tell Soul");
				}
			});
		});
	},
	alertMsg(user, status, level, given30, given40, given50) {
		return new Promise((resolve) => {
			if (queue.has(user.id)) {
				let sendMsg;
				switch (status) {
					case "under":
					sendMsg = `This user was just automatically scanned at level ${level} and was added to the blacklist.`;
					break;
					case "given":
					sendMsg = `This user was just automatically scanned at level ${level} and was given: ${(given30 ? "RR" : "")}${(given40 ? `${given30 ? ", " : ""}Level 40` : "")}${(given50 ? `${given30 || given40 ? ", " : ""}Level 50` : "")}`;
					break;
					case "left":
					sendMsg = "This user was either banned, or just left the server. Messages now won't work.";
					break;
					default:
					sendMsg = "Impossible error alertMsg status switch broke. Please tell soul";
					console.error(`[${dateToTime(new Date())}]: Error: alertMsg status switch broke. Impossible bug? Status: ${status}`);
				}
				const server = (ops.serverID) ? user.client.guilds.cache.get(ops.serverID) : undefined;
				server.channels.fetch(queue.get(user.id)).then((channel) => {
					channel.send(`**==================================================================
Bot note:** ${sendMsg}
**==================================================================**`);
					resolve();
				});
			} else {
				resolve();
			}
		});
	},
	addToCloseList(t, ch, date) {
		module.exports.deleteAndClearTimer(ch);
		closeList.set(ch, { timeout: t, timeoutTime: date });
	},
	printCloseList() {
		if (closeList.size == 0) {
			return "There are no current timers";
		}
		const listArr = [];
		for (const t of closeList) {
			listArr.push(`<#${t[0]}>: ${((t[1].timeoutTime - Date.now()) / 3600000).toFixed(2)}hrs`);
		}
		return listArr.join("\n");
	},
	deleteAndClearTimer(ch) {
		return new Promise(function(resolve) {
			if (!closeList.get(ch)) return resolve("not found");
			clearTimeout(closeList.get(ch).timeout);
			closeList.delete(ch);
			resolve();
		});
	},
	passServ(name, icon) {
		return new Promise((res) => {
			trapEmbed.setTitle("Server Staff Mail")
			.setDescription(`Would you like to make a new support ticket by sending that message to the staff at ${name}?
Or would you like to cancel. (This will last 60 seconds)`)
			.setColor("#4B85FF")
			.setFooter({ text: name, iconURL: icon });
			res();
		});
	},
};


function saveQueue() {
	fs.writeFile(path.resolve(__dirname, "../server/mailQueue.json"), JSON.stringify(Array.from(queue)), (err) => {
		if (err){
			console.error(`[${dateToTime(new Date())}]: Error: An error occured while saving the the mail queue. Err:${err}`);
			return;
		}
	});
}
// function when a new ticket has to be created
function newChannel(message, member) {
	const user = member.user;
	return new Promise((resolve) => {
		const ticketName = `${user.username}-${user.discriminator}`;
		const server = (ops.serverID) ? message.client.guilds.cache.get(ops.serverID) : undefined;
		server.channels.create(ticketName, {
			parent:ops.mailCategory,
		}).then((channel) => {
			queue.set(user.id, channel.id);
			saveQueue();
			tempQueue.splice(tempQueue.indexOf(user.id));
			const embedStart = new Discord.MessageEmbed()
			.setColor("#4B85FF")
			.setTitle("New Ticket")
			.setFooter({ text: (member.nickname || user.tag) + " | " + user.id, iconURL: user.avatarURL({ dynamic:true }) })
			.addField("User", user.toString() + "\n" + user.id, true);
			if (ops.dmAutoReply) {
				embedStart.setDescription("Type a message in this channel to reply. Messages starting with the mail prefix '=' are ignored, and can be used for staff discussion. Use the command `=close [reason]` to close this ticket.");
			} else {
				embedStart.setDescription("Type `=r <message>` in this channel to reply. All other messages are ignored, and can be used for staff discussion. Use the command `=close [reason]` to close this ticket.");
			}
			server.members.fetch(user.id, true).then((m) => {
				const membRoles = m.roles.cache.map(r => `${r.toString()} `);
				if (membRoles.length > 1) {
					embedStart.addField("Roles", membRoles.slice(0, -1).join(""), true);
				} else {
					embedStart.addField("Roles", "No roles possessed", true);
				}
				embedStart.addField("Joined the server at:", m.joinedAt.toUTCString(), true);
				embedStart.addField("Account created at:", m.user.createdAt.toUTCString(), true);
				if (m.premiumSince) {
					embedStart.addField("Supported with Nitro at:", m.premiumSince.toUTCString(), true);
				}
				resolve([channel, embedStart]);
			});
		}).catch((err) => {
			console.error("An error occured creating a new channel for modmail: ", err);
			message.reply("I can not create a channel. Could be a permissions issue");
		});
	});
}
																							// green, orange, orange, 		green, 			red
function newEmbed(message, status, content){ // open, hostOpen, hostReply, userReply, close
	return new Promise((resolve) => {
		const embed = new Discord.MessageEmbed();
		if (status == "close") {
			embed.setColor("#FF0000")
			.setAuthor({ name: message.member.nickname || message.author.tag, iconURL: message.author.avatarURL({ dynamic:true }), url: `https://discord.com/users/${message.author.id}` });
		} else if (status == "hostOpen") {
			embed.setColor("#F94819")
			.setAuthor({ name: message.member.nickname || message.author.tag, iconURL: message.author.avatarURL({ dynamic:true }), url: `https://discord.com/users/${message.author.id}` });
		} else {
			let stickers;
			if (message.stickers.size > 0) {
				let i = 0;
				stickers = message.stickers.map((s) => {
					i++;
					return `**Sticker #${i}:** ${s.name}#${s.id}`;
				});
			}
			if (content == "emptyMessageLongStringToAvoidPotentialAccidentLol") content = "";
			else if (!content) content = message.content;
			if (ops.attachmentURLs && message.attachments.size > 0) {
				let i = 0;
				const files = message.attachments.map((a) => {
					i++;
					return `**Attachment #${i}:** ${a.url}`;
				});
				embed.setDescription(`${content}\n\n${files.join("\n")}${(stickers) ? `\n\n${stickers}` : ""}`);
			} else {
				embed.setDescription(`${content}${(stickers) ? `\n\n${stickers}` : ""}`);
			}
			if (status == "open"){
				embed.setColor("#00FF0A");
			} else if (status == "hostReply") {
				embed.setColor("#F94819")
				.setAuthor({ name: message.member.nickname || message.author.tag, iconURL: message.author.avatarURL({ dynamic:true }), url: `https://discord.com/users/${message.author.id}` });
			} else if (status == "userReply") {
				embed.setColor("#00FF0A");
			}
		}
		embed.setTimestamp();
		resolve(embed);
	});
}
function sendWithImg(message, target, embArr) { // hostReply
	return new Promise((resolve) => {
		let filesArr;
		if (message.attachments.size > 0) {
			filesArr = message.attachments.map(a => a);
		}
		const msgOpts = (filesArr) ? { embeds: embArr, files: filesArr } : { embeds: embArr };
		target.send(msgOpts).then(() => resolve()).catch((err) => {
			if (target instanceof Discord.User && err.httpStatus == 403) {
				console.error(`[${dateToTime(new Date())}]: Error: I can not send a mail DM to ${target.username}${target}.`);
				message.reply("I can no longer reply to this member. They may have left the server, blocked me, or turned off DMs.");
			} else if (err.code == 40005) {
				message.reply("That image was too large to send.\nThe limit is 50MB (8MB for staff)\nPlease reduce the file size using paint or something similar.");
			} else if (err.code == 500) {
				message.reply("That image took over 15 seconds to send, and was timed out by Discord\nPlease reduce the file size using paint or something similar.");
			} else {
				console.error(`[${dateToTime(new Date())}]: An error occured when sendWithImg... Error:`);
				console.error(err);
				console.error("message:");
				console.error(message);
				console.error("target");
				console.error(target);
				message.reply("An error occured... please tell a moderator that `sendWithImg` failed.");
			}
		});
	});
}

const statuses = ["tiny", "wrong", "left", "man-black", "all", "black", "already", "off-by-one"];

function checkStatus(status, message, channel, level) {
	return new Promise((resolve) => {
		switch (status) {
			case "tiny":
			channel.send("**Bot note:** I refused to scan the following image due to it being too small or missing the neccesary size metadata.").then(() => resolve());
			break;
			case "wrong":
			channel.send(`**Bot note:** I refused to scan the following image due to it being an invalid file type: \`.${message.attachments.first().url.split(".").pop().toLowerCase()}\``).then(() => resolve());
			break;
			case "left":
			channel.send("**Bot note:** I refused to scan the following image due to not being able to find the member. Could be that they have left the server.").then(() => resolve());
			break;
			case "man-black":
			channel.send(`**Bot note:** I refused to scan the following image due to the member possessing the manual blacklist role : <@&${ops.blacklistRole}>`).then(() => resolve());
			break;
			case "all":
			channel.send("**Bot note:** I refused to scan the following image due to the member already possessing all 3 roles.").then(() => resolve());
			break;
			case "black":
			channel.send(`**Bot note:** I refused to scan the following image due to the member being in the automatic blacklist. (i.e. they've been scanned under ${ops.targetLevel} before)
			Please review the <#${ops.logsChannel}> or ask them to add you in-game to determine their authenticity.`).then(() => resolve());
			break;
			// case "failed":
			// 	await channel.send("**Bot note:** This image failed to scan correctly. Please action it using `]c ${user.id} [level]`");
			// 	break;
			case "already":
			channel.send(`**Bot note:** This image was scanned at ${level}, but they already possessed the corresponsing role(s), so no action was taken.`).then(() => resolve());
			break;
			case "off-by-one":
			channel.send({ components : [
				new Discord.MessageActionRow()
				.addComponents([
					new Discord.MessageButton()
					.setCustomId("app").setLabel("Approve").setStyle("SUCCESS"),
					new Discord.MessageButton()
					.setCustomId("rej").setLabel("Reject").setStyle("DANGER"),
				]),
			], content : `**Bot note:** This image was scanned at ${level}, no action was taken.
User: ${message.author}` }).then(() => resolve());
				break;
				default:
				channel.send("**Bot note:** The status switch in dm.js broke... Impossible error. Please tell Soul.");
				console.error("The status switch in dm.js broke... Impossible error");
				resolve();
		}
	});
}

// reverse lookups the queue collection to find a user from a channel ID
// Alternatively, finds them using a userID
function getUser(message, id){
	return new Promise(function(resolve, reject) {
		new Promise((res) => {
			if (id) return res(id);
			const channelId = message.channel.id;
			let i = 0;
			for (const [k, v] of queue){
				i++;
				if (v == channelId)	return res(k);
				else if (queue.size == i) return res(false);
			}
			return;
		}).then(userId => {
			if (!userId) reject();
			else {
				const server = (ops.serverID) ? message.client.guilds.cache.get(ops.serverID) : undefined;
				server.members.fetch(userId).then((m) => {
					resolve([m, false]);
				}).catch((err) => {
					if (err.httpStatus != 404) console.error(`[${dateToTime(new Date())}]: Error: member not found yet not 404. err: ${err}`);
					message.client.users.fetch(userId).then((u) => {
						resolve([false, u]);
					}).catch((err) => {
						if (id) {
							reject(1);
						} else {
							console.error(`[${dateToTime(new Date())}]: Error: I can not find user ${userId} from a mail category. Error: ${err}`);
							message.reply("An error occured, I can not fetch this user. Please tell Soul");
						}
					});
				});
			}
		});
	});
}

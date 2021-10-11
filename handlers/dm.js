const Discord = require("discord.js"),
			{ dateToTime } = require("../func/misc.js"),
			messagetxt = require("../server/messagetxt.js"),
			{ messagetxtReplace } = require("../func/misc.js"),
			fs = require("fs"),
			path = require("path");
let queue = new Discord.Collection(),
		ignoreMail,
		server = {},
		logs = {};
const tempQueue = [],
trapEmbed = new Discord.MessageEmbed();

function loadMailQueue() {
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
}

function saveQueue() {
	fs.writeFile(path.resolve(__dirname, "../server/mailQueue.json"), JSON.stringify(Array.from(queue)), (err) => {
		if (err){
			console.error(`[${dateToTime(new Date())}]: Error: An error occured while saving the the mail queue. Err:${err}`);
			return;
		}
	});
}

// Function when a message is sent in the mailCategory
function channelMsg(message) {
	if (message.content.toLowerCase().startsWith("=open")){
		if (message.content.length < 7) message.reply("You must supply a user or an ID to open a new ticket.");
		const args = message.content.slice(6);
		let id = 0;
		if (args.startsWith("<@") && args.endsWith(">")) {
			id = args.slice(2, -1);
			if (id.startsWith("!")) id = id.slice(1);
		} else {
			id = args;
		}
		server.members.fetch(id).then(async (member) => {
			const embedIn = await newEmbed(message, "hostOpen");
			embedIn.setTitle("New Ticket");
			const embedOut = new Discord.MessageEmbed(embedIn);
			embedOut.setDescription(messagetxtReplace(messagetxt.dmHostOpen, message.author).replace(/<server>/g, `**${server.name}**`))
			.setFooter(server.name, server.iconURL());
			member.send({ embeds: [embedOut] }).then(() => {
				newChannel(message, member).then(async ([channel, embedStart]) => {
					console.log(`[${dateToTime(new Date())}]: ${message.author.username}${message.author.toString()} opened a new ticket with ${member.user.username}${member.user.toString()}`);
					embedIn.setDescription(`Ticket opened with: ${member.user.toString()}\n${channel.toString()}\nOpened by: ${message.author.toString()}`)
					.setFooter((member.nickname || member.user.tag) + " | " + member.user.id, member.user.avatarURL({ dynamic:true }));
					embedStart.addField("Ticket opened by:", message.author.toString());
					await channel.send({ content: `${member.user} (${member.user.id})`, embeds: [embedStart] });
					logs.send({ embeds: [embedIn] }).then(() => {
						message.delete();
					});
				});
			}).catch(() => {
				message.reply("I can not message that member. They may have blocked me or turned off DMs.");
			});
		}).catch(() => {
			message.reply("There may be a typo, or some other issue, which causes me to not be able to find this member.");
		});
	} else {
		const channelId = message.channel.id;
		getUser(channelId).then((userId) => {
			if (!userId) return;
			else {
				server.members.fetch(userId).then(async (member) => {
					if (message.content.startsWith("=") || message.content.startsWith("?") || message.content.startsWith("$")) {
						if (message.content.toLowerCase().startsWith("=close")) { // Close ticket. Todo:embed
							const args = message.content.slice(7);
							const embedIn = await newEmbed(message, "close");
							embedIn.setTitle("Ticket closed");
							if (args == "") embedIn.setDescription("No reason provided.");
							else embedIn.setDescription(args);
							const embedOut = new Discord.MessageEmbed(embedIn);
							embedIn.setFooter((member.nickname || member.user.tag) + " | " + member.user.id, member.user.avatarURL({ dynamic:true }));
							embedOut.setFooter(message.guild.name, message.guild.iconURL())
							.addField("\u200b", `**${messagetxtReplace(messagetxt.dmClose, member.user)}**`);
							member.send({ embeds: [embedOut] }).catch(() => {
								console.error(`[${dateToTime(new Date())}]: Error: I can not send a mail DM to ${member.user.username}${member.user.id}`);
								return;
							});
							logs.send({ embeds: [embedIn] });
							message.channel.delete();
							queue.delete(userId);
							saveQueue();
							console.log(`[${dateToTime(new Date())}]: ${message.author.username}${message.author.toString()} closed the ticket with ${member.user.username}${member.user.toString()}`);
						} else return;
					} else {
						const embedIn = await newEmbed(message, "hostReply");
						const embedOut = new Discord.MessageEmbed(embedIn);
						embedIn.setFooter((member.nickname || member.user.tag) + " | " + member.user.id, member.user.avatarURL({ dynamic:true }))
						.setTitle("Message Sent");
						embedOut.setFooter(message.guild.name, message.guild.iconURL())
						.setTitle("Message Received");
						sendWithImg(message, member.user, [embedOut]).then(() => {
							logs.send({ embeds: [embedIn] });
							sendWithImg(message, message.channel, [embedIn]).then(() => {
								message.delete();
							}).catch((err) => {
								console.error(`[${dateToTime(new Date())}]: Error occured when sending an embed in the mail logs. Err:${err}`);
							});
						}).catch(() => {
							console.error(`[${dateToTime(new Date())}]: Error: I can not send a mail DM to ${member.user.username}#${member.user.id}`);
							message.reply("I can no longer reply to this member. They may have blocked me or turned off DMs.");
							return;
						});
					}
				});
			}
		});
	}
}

// function when a dm comes in
async function mailDM(message, status, level) {
  server.members.fetch(message.author.id).then((member) => {
		let wasTemp = false;
		if (tempQueue.includes(member.id)) {
			wasTemp = true;
		}
		if (queue.has(member.id) || wasTemp){
			new Promise((res) => {
				if (wasTemp){
					setTimeout(async () => {
						const ch = await server.channels.fetch(queue.get(member.id));
						res(ch);
					}, 5000);
				} else {
					server.channels.fetch(queue.get(member.id)).then((ch) => {
						res(ch);
					});
				}
			}).then(async (channel) => {
				const embedIn = await newEmbed(message, "userReply");
				const embedOut = new Discord.MessageEmbed(embedIn);
				embedIn.setFooter((member.nickname || member.user.tag) + " | " + member.id, member.user.avatarURL({ dynamic:true }))
				.setTitle("Message Received");
				embedOut.setFooter(server.name, server.iconURL())
				.setTitle("Message Sent");
				if (status && ops.dmScanning) {
					await checkStatus(status, message, channel, level);
					sendWithImg(message, channel, [embedIn]);
				} else {
					sendWithImg(message, channel, [embedIn]);
				}
				logs.send({ embeds: [embedIn] });
				member.send({ embeds: [embedOut] });
			});
		} else {
			if (ignoreMail.includes(message.content.toLowerCase())) {
				return;
			}
			tempQueue.push(member.id);
			message.reply({ embeds: [trapEmbed] }).then((msg) => {
				msg.react("👍").then(() => msg.react("👎"));
				const filter = (reaction, usr) => {
					return ["👍", "👎"].includes(reaction.emoji.name) && usr.id === message.author.id;
				};
				msg.awaitReactions({ filter, max: 1, time: 60000, errors: ["time"] }).then((collected) => {
					if (collected.first().emoji.name === "👍") {
						newChannel(message, member).then(async ([channel, embedStart]) => {
							console.log(`[${dateToTime(new Date())}]: ${member.user.username}${member} opened a new ticket via DM`);
							const embedIn = await newEmbed(message, "userReply");
							const embedOut = new Discord.MessageEmbed(embedIn);
							embedIn.setFooter((member.nickname || member.user.tag) + " | " + member.id, member.user.avatarURL({ dynamic:true }))
							.setTitle("Message Received");
							embedOut.setFooter(server.name, server.iconURL())
							.setTitle("New Ticket Created")
							.addField("\u200b", `**${messagetxtReplace(messagetxt.dmOpen, member.user)}**`);
							await channel.send({ content: `${member} (${member.id})`, embeds: [embedStart] });
							if (status && ops.dmScanning) {
								await checkStatus(status, message, channel, level);
								sendWithImg(message, channel, [embedIn]);
							} else {
								sendWithImg(message, channel, [embedIn]);
							}
							embedIn.setTitle("New Ticket Created");
							logs.send({ embeds: [embedIn] });
							member.send({ embeds: [embedOut] });
						});
					} else {
						tempQueue.splice(tempQueue.indexOf(member.id));
						member.send("Message not sent. Please send another message if you need support.");
					}
				})
				.catch(() => {
					tempQueue.splice(tempQueue.indexOf(member.id));
					msg.delete()
					.catch((err) => console.error("Failed to delete:", err));
				});
			});
		}
	}).catch(() => {
		message.reply(`I can't seem to find you in my server, ${server.name}. Please make sure you've joined before sending a message here.`);
		console.error(`[${dateToTime(new Date())}]: Error: ${message.author.username}${message.author} could not be found in the guild, despite being able to DM the bot... Impossible bug?`);
	});
}

// function when a new ticket has to be created
function newChannel(message, member) {
	const user = member.user;
	return new Promise((resolve) => {
		const ticketName = `${user.username}-${user.discriminator}`;
		server.channels.create(ticketName, {
			parent:ops.mailCategory,
		}).then((channel) => {
			queue.set(user.id, channel.id);
			saveQueue();
			tempQueue.splice(tempQueue.indexOf(user.id));
			const embedStart = new Discord.MessageEmbed()
			.setColor("#4B85FF")
			.setTitle("New Ticket")
			.setDescription("Type a message in this channel to reply. Messages starting with the mail prefix '=' are ignored, and can be used for staff discussion. Use the command `=close [reason]` to close this ticket.")
			.setFooter((member.nickname || user.tag) + " | " + user.id, user.avatarURL({ dynamic:true }))
			.addField("User", user.toString() + "\n" + user.id, true);
			server.members.fetch(user.id).then((m) => {
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
function newEmbed(message, status){ // open, hostOpen, hostReply, userReply, close
	return new Promise((resolve) => {
		const embed = new Discord.MessageEmbed();
		if (status == "close") {
			embed.setColor("#FF0000")
			.setAuthor(message.member.nickname || message.author.tag, message.author.avatarURL({ dynamic:true }));
		} else if (status == "hostOpen") {
			embed.setColor("#F94819")
			.setAuthor(message.member.nickname || message.author.tag, message.author.avatarURL({ dynamic:true }));
		} else {
			let stickers;
			if (message.stickers.size > 0) {
				let i = 0;
				stickers = message.stickers.map((s) => {
					i++;
					return `**Sticker #${i}:** ${s.name}#${s.id}`;
				});
			}
			if (ops.attachmentURLs && message.attachments.size > 0) {
				let i = 0;
				const files = message.attachments.map((a) => {
					i++;
					return `**Attachment #${i}:** ${a.url}`;
				});
				embed.setDescription(`${message.content}\n\n${files.join("\n")}${(stickers) ? `\n\n${stickers}` : ""}`);
			} else {
				embed.setDescription(`${message.content}${(stickers) ? `\n\n${stickers}` : ""}`);
			}
			if (status == "open"){
				embed.setColor("#00FF0A");
			} else if (status == "hostReply") {
				embed.setColor("#F94819")
				.setAuthor(message.member.nickname || message.author.tag, message.author.avatarURL({ dynamic:true }));
			} else if (status == "userReply") {
				embed.setColor("#00FF0A");
			}
		}
		embed.setTimestamp();
		resolve(embed);
	});
}

function sendWithImg(message, target, embArr) { // hostReply
	return new Promise((resolve, reject) => {
		let filesArr;
		if (message.attachments.size > 0) {
			filesArr = message.attachments.map(a => a);
		}
		if (filesArr){
			target.send({ embeds: embArr, files: filesArr }).then(() => resolve()).catch(() => reject());
		} else {
			target.send({ embeds: embArr }).then(() => resolve()).catch(() => reject());
		}
	});
}

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
				channel.send(`**Bot note:** This image was scanned at ${level}, no action was taken.
Please action it using \`]c ${message.author.id}\` if they are over halfway to ${ops.targetLevel}, or \`]c ${message.author.id} ${ops.targetLevel - 1}\` if they are not.`).then(() => resolve());
				break;
			default:
				channel.send("**Bot note:** The status switch in dm.js broke... Impossible error. Please tell Soul.");
				console.error("The status switch in dm.js broke... Impossible error");
				resolve();
		}
	});
}
// reverse lookups the queue collection to find a user from a channel ID
function getUser(channelId){
	return new Promise((resolve) => {
	for (const [k, v] of queue){
		if (v == channelId) resolve(k);
	}
	resolve(false);
});
}

function alertMsg(user, status, level, given30, given40, given50) {
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
}


function passServ(s) {
	return new Promise((res) => {
		server = s;
		trapEmbed.setTitle("Server Staff Mail")
		.setDescription(`Would you like to make a new support ticket by sending that message to the staff at ${server.name}?
	React with 👍 for yes and 👎 for no. (This will last 60 seconds)`)
		.setColor("#4B85FF")
		.setFooter(server.name, server.iconURL());
		ignoreMail = require("../server/ignoreMail.js");
		res();
	});
}

function refreshMailLog() {
	server.client.channels.fetch(ops.mailLogChannel).then((l) => {
		logs = l;
	});
}

module.exports = { mailDM, channelMsg, passServ, refreshMailLog, loadMailQueue, alertMsg };

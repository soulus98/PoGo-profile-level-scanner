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
				newChannel(message, member.user).then(async ([channel, embedStart]) => {
					console.log(`[${dateToTime(new Date())}]: ${message.author.username}${message.author.toString()} opened a new ticket with ${member.user.username}${member.user.toString()}`);
					embedIn.setDescription(`Ticket opened with: ${member.user.toString()}\n${channel.toString()}\nOpened by: ${message.author.toString()}`)
					.setFooter(member.user.tag + " | " + member.user.id, member.user.avatarURL({ dynamic:true }));
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
				message.client.users.fetch(userId).then(async (user) => {
					if (message.content.startsWith("=") || message.content.startsWith("?") || message.content.startsWith("$")) {
						if (message.content.toLowerCase().startsWith("=close")) { // Close ticket. Todo:embed
							const args = message.content.slice(7);
							const embedIn = await newEmbed(message, "close");
							embedIn.setTitle("Ticket closed");
							if (args == "") embedIn.setDescription("No reason provided.");
							else embedIn.setDescription(args);
							const embedOut = new Discord.MessageEmbed(embedIn);
							embedIn.setFooter(user.tag + " | " + user.id, user.avatarURL({ dynamic:true }));
							embedOut.setFooter(message.guild.name, message.guild.iconURL())
							.addField("\u200b", `**${messagetxtReplace(messagetxt.dmClose, user)}**`);
							user.send({ embeds: [embedOut] }).catch(() => {
								console.error(`[${dateToTime(new Date())}]: Error: I can not send a mail DM to ${user.username}${user.id}`);
								return;
							});
							logs.send({ embeds: [embedIn] });
							message.channel.delete();
							queue.delete(userId);
							saveQueue();
							console.log(`[${dateToTime(new Date())}]: ${message.author.username}${message.author.toString()} closed the ticket with ${user.username}${user.toString()}`);
						} else return;
					} else {
						const embedIn = await newEmbed(message, "hostReply");
						const embedOut = new Discord.MessageEmbed(embedIn);
						embedIn.setFooter(user.tag + " | " + user.id, user.avatarURL({ dynamic:true }))
						.setTitle("Message Sent");
						embedOut.setFooter(message.guild.name, message.guild.iconURL())
						.setTitle("Message Received");
						sendWithImg(message, user, [embedOut]).then(() => {
							logs.send({ embeds: [embedIn] });
							sendWithImg(message, message.channel, [embedIn]).then(() => {
								message.delete();
							}).catch((err) => {
								console.error(`[${dateToTime(new Date())}]: Error occured when sending an embed in the mail logs. Err:${err}`);
							});
						}).catch(() => {
							console.error(`[${dateToTime(new Date())}]: Error: I can not send a mail DM to ${user.username}#${user.id}`);
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
async function mailDM(message) {
  const user = message.author;
	let wasTemp = false;
	if (tempQueue.includes(user.id)) {
		wasTemp = true;
	}
  if (queue.has(user.id) || wasTemp){
		new Promise((res) => {
			if (wasTemp){
				setTimeout(async () => {
					const ch = await server.channels.fetch(queue.get(user.id));
					res(ch);
				}, 5000);
			} else {
				server.channels.fetch(queue.get(user.id)).then((ch) => {
					res(ch);
				});
			}
		}).then(async (channel) => {
			const embedIn = await newEmbed(message, "userReply");
			const embedOut = new Discord.MessageEmbed(embedIn);
			embedIn.setFooter(user.tag + " | " + user.id, user.avatarURL({ dynamic:true }))
			.setTitle("Message Received");
			embedOut.setFooter(server.name, server.iconURL())
			.setTitle("Message Sent");
			sendWithImg(message, channel, [embedIn]);
			logs.send({ embeds: [embedIn] });
			user.send({ embeds: [embedOut] });
		});
  } else {
		if (ignoreMail.includes(message.content.toLowerCase())) {
			return;
		}
		tempQueue.push(user.id);
		message.reply({ embeds: [trapEmbed] }).then((msg) => {
			msg.react("👍").then(() => msg.react("👎"));
			const filter = (reaction, usr) => {
				return ["👍", "👎"].includes(reaction.emoji.name) && usr.id === message.author.id;
			};
			msg.awaitReactions({ filter, max: 1, time: 60000, errors: ["time"] }).then((collected) => {
				if (collected.first().emoji.name === "👍") {
					newChannel(message, user).then(async ([channel, embedStart]) => {
						console.log(`[${dateToTime(new Date())}]: ${user.username}${user.toString()} opened a new ticket via DM`);
						const embedIn = await newEmbed(message, "userReply");
						const embedOut = new Discord.MessageEmbed(embedIn);
						embedIn.setFooter(user.tag + " | " + user.id, user.avatarURL({ dynamic:true }))
						.setTitle("Message Received");
						embedOut.setFooter(server.name, server.iconURL())
						.setTitle("New Ticket Created")
						.addField("\u200b", `**${messagetxtReplace(messagetxt.dmOpen, user)}**`);
						await channel.send({ content: `${user} (${user.id})`, embeds: [embedStart] });
						sendWithImg(message, channel, [embedIn]);
						embedIn.setTitle("New Ticket Created");
						logs.send({ embeds: [embedIn] });
						user.send({ embeds: [embedOut] });
					});
				} else {
					tempQueue.splice(tempQueue.indexOf(user.id));
					user.send("Message not sent. Please send another message if you need support.");
				}
			})
			.catch(() => {
				tempQueue.splice(tempQueue.indexOf(user.id));
				msg.delete()
				.catch((err) => console.error("Failed to delete:", err));
			});
		});
  }
}

// function when a new ticket has to be created
function newChannel(message, user) {
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
			.setFooter(user.tag + " | " + user.id, user.avatarURL({ dynamic:true }))
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
			.setAuthor(message.author.tag, message.author.avatarURL({ dynamic:true }));
		} else if (status == "hostOpen") {
			embed.setColor("#F94819")
			.setAuthor(message.author.tag, message.author.avatarURL({ dynamic:true }));
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
				.setAuthor(message.author.tag, message.author.avatarURL({ dynamic:true }));
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

// reverse lookups the queue collection to find a nuser from a channel ID
function getUser(channelId){
	return new Promise((resolve) => {
	for (const [k, v] of queue){
		if (v == channelId) resolve(k);
	}
	resolve(false);
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

module.exports = { mailDM, channelMsg, passServ, refreshMailLog, loadMailQueue };

const { token } = require("./server/keys.json"),
			fs = require("fs"),
			path = require("path"),
			Discord = require("discord.js"),
			messagetxt = require("./server/messagetxt.js"),
			{ messagetxtReplace, dev } = require("./func/misc.js"),
			{ handleCommand } = require("./handlers/commands.js"),
			{ handleImage } = require("./handlers/images.js"),
			{ dateToTime, performanceLogger, replyNoMention, errorMessage } = require("./func/misc.js"),
			{ saveStats, loadStats } = require("./func/stats.js"),
			{ saveBlacklist } = require("./func/saveBlacklist.js"),
			{ cacheOps, sweeperOps } = require("./func/clientOptions.js"),
			mail = require("./handlers/dm.js"),
			ver = require("./package.json").version,
			dmMailTog = require("./server/config.json").toggles.dmMail,
			cooldowns = new Discord.Collection(),
			launchDate = new Date(),
			act = (dmMailTog) ? messagetxtReplace(messagetxt.activity) : ver,
client = new Discord.Client({
	makeCache: (require("./server/config.json").toggles.strictCache) ? Discord.Options.cacheWithLimits(cacheOps) : Discord.Options.cacheEverything(),
	sweepers: sweeperOps,
	intents: [
		Discord.Intents.FLAGS.GUILDS,
		Discord.Intents.FLAGS.GUILD_MEMBERS,
		Discord.Intents.FLAGS.GUILD_MESSAGES,
		Discord.Intents.FLAGS.DIRECT_MESSAGES,
		Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
	],
	partials: [
		"CHANNEL",
		"GUILD_MEMBER",
	],
	presence: {
		status: "online",
		activities: [{
			name: act,
			type: "PLAYING",
		}],
	},
});
imgStats = {
	imageAttempts : 0,
	imageLogCount : 0,
	currentlyImage : 0,
};
blacklist = new Discord.Collection();
let loaded = false,
		config = {},
		screensFolder = `./screens/Auto/${launchDate.toDateString()}`;
ops = {};
module.exports = { loadConfigs, clearBlacklist, cooldowns, screensFolder };
// Loads all the variables at program launch
async function load(){
		console.log("======================================================================================\n");
		console.log("Server starting...");
		await loadConfigs();
		await checkDateFolder(launchDate).catch((err) => { console.error(`[${dateToTime(new Date())}]: `, err);});
		await loadCommands();
		await loadBlacklist().catch((err) => { console.error(`[${dateToTime(new Date())}]: `, err);});
		await mail.loadMailQueue().catch((err) => {
			console.error(`[${dateToTime(new Date())}]: `, err);
		});
		await loadStats().then((s) => {
			const { passStats } = require("./commands/stats.js");
			passStats(s);
		}).catch((err) => { console.error(`[${dateToTime(new Date())}]: `, err);});
		client.login(token);
}
// Loads (or re-loads) the bot settings
function loadConfigs(){
	return new Promise((resolve) => {
		config = {};
		delete require.cache[require.resolve("./server/config.json")];
		config = require("./server/config.json");
		for (const cat in config) for (const item in config[cat]) ops[item] = config[cat][item]; // This makes all the options
		ops.blacklistTime = config.numbers.blacklistTime * 86400000;
		ops.msgDeleteTime = config.numbers.msgDeleteTime * 1000;
		if (!loaded){
			console.log("\nLoading configs...");
			console.log("\nConfigs:", config);
			resolve();
		} else {
			(async () => {
				// if (ops.serverID) server = await client.guilds.fetch(ops.serverID);
				// if (ops.profileChannel) profile = await client.channels.fetch(ops.profileChannel);
				// if (ops.screenshotScanning) {
				// 	if (ops.screenshotChannel)  channel = await client.channels.fetch(ops.screenshotChannel);
				// 	if (ops.logsChannel) logs = await client.channels.fetch(ops.logsChannel);
				// 	const { passAppServ } = require("./commands/approve.js");
				// 	const { passRevServ } = require("./commands/revert.js");
				// 	const { passImgServ } = require("./handlers/images.js");
				// 	passAppServ([channel, profile, server, logs]);
				// 	passRevServ([channel, server]);
				// 	passImgServ(logs);
				// }
				if (ops.dmMail) {
					const server = (ops.serverID) ? await client.guilds.fetch(ops.serverID) : undefined;
					await mail.passServ(server.name, server.iconURL());
				}
				console.log("\nReloaded configs\n");
				resolve();
			})();
		}
	});
}
// Checks whether the date folder exists for the images to be saved to and creates it if not.
function checkDateFolder(checkDate){
	return new Promise((resolve, reject) => {
		if (ops.saveLocalCopy) {
			const folder = path.resolve(__dirname, `./screens/Auto/${checkDate.toDateString()}`),
						folderParent = path.dirname(folder),
						folderParentParent = path.dirname(folderParent);
			console.log(`\nChecking for ${folder}...`);
			fs.access(folder, (err) => {
				if (err){
					fs.mkdir(folderParentParent, { recursive: true }, (err) => {
						if (err) reject(`Error occured when making/checking ${folderParentParent}. Error: ${err}`);
						else {
							console.log(`Created/checked Folder: ${folderParentParent}`);
							fs.mkdir(folderParent, { recursive: true }, (err) => {
								if (err) reject(`Error occured when making/checking ${folderParent}. Error: ${err}`);
								else {
									console.log(`Created/checked Folder: ${folderParent}`);
									fs.mkdir(folder, { recursive: true }, (err) => {
										if (err) reject(`Error occured when making/checking "${folder}". Error: ${err}`);
										else {
											console.log(`Created/checked Folder: ${folder}.`);
											resolve();
										}
									});
								}
							});
						}
					});
				} else {
					console.log(`Folder: ${folder} already existed.`);
					resolve();
				}
			});
			return;
		} else resolve();
	});
}
// Loads the command files. This was standard in the discord.js guide
function loadCommands(){
	return new Promise((resolve) => {
		client.commands = new Discord.Collection();
		const commandFiles = fs.readdirSync(path.resolve(__dirname, "./commands")).filter(file => file.endsWith(".js"));
		let commandFilesNames = "\nThe currently loaded commands and cooldowns are:\n";
		for (const file of commandFiles) {		// Loads commands
			const command = require(`./commands/${file}`);
			if (!(command.scanningOnly && !ops.screenshotScanning || command.mailOnly && !ops.dmMail)){
				commandFilesNames = commandFilesNames + ops.prefix + command.name;
				if (command.cooldown){
					commandFilesNames = commandFilesNames + ":\t" + command.cooldown + " seconds \n";
				} else {
					commandFilesNames = commandFilesNames + "\n";
				}
				client.commands.set(command.name, command);
			}
		}
		console.log(commandFilesNames);
		resolve();
	});
}
// Loads the blacklist from file
function loadBlacklist(){
	return new Promise((resolve, reject) => {
		blacklist = new Discord.Collection();
		new Promise((res) => {
			try {
				delete require.cache[require.resolve("./server/blacklist.json")];
				res();
			} catch (e){
				if (e.code == "MODULE_NOT_FOUND") {
					// do nothing
					res();
				} else {
					reject(`Error thrown when loading blacklist. Error: ${e}`);
					return;
				}
			}
		}).then(() => {
			let blackJson = "";
			new Promise((res) => {
				try {
					blackJson = require("./server/blacklist.json");
					res();
				} catch (e) {
					if (e.code == "MODULE_NOT_FOUND") {
						fs.writeFile(path.resolve(__dirname, "./server/blacklist.json"), "[]", (err) => {
							if (err){
								reject(`Error thrown when writing new blacklist file. Error: ${err}`);
								return;
							}
							console.log("Could not find blacklist.json. Making a new one...");
							blackJson = require("./server/blacklist.json");
							res();
						});
					}	else {
						reject(`Error thrown when loading blacklist (2). Error: ${e}`);
						return;
					}
				}
			}).then(() => {
				if (!blackJson[0]) {
					console.log("Blacklist loaded (empty).");
					resolve(blacklist);
					return;
				}
				let x = 0;
				for (const item of blackJson){
					if (Date.now() - item[1] > ops.blacklistTime){
						x = x + 1;
					} else {
						blacklist.set(item[0], item[1]);
					}
				}
				resolve(blacklist);
				if (x){
					console.log(`Blacklist loaded, and removed ${x} users from it due to time expiration.`);
					saveBlacklist(blacklist);
				} else {
					const y = blacklist.size;
					console.log(`Blacklist loaded from file. It contains ${y} user${(y == 1) ? "" : "s"}`);
				}
			});
		});
	});
}

load();

if (ops.dmMail) {
	client.on("guildMemberRemove", member => {
		mail.alertMsg(member.user, "left");
	});
}

// Called from clear-blacklist.js to clear the blacklist when requested
function clearBlacklist(message, idToDelete){
	if (idToDelete){
		if (blacklist.has(idToDelete)) {
			blacklist.delete(idToDelete);
			replyNoMention(message, `Removed <@${idToDelete}>${idToDelete} from the blacklist.`).catch(() => {
				console.error(`[${dateToTime(new Date())}]: Error: I can not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
				message.channel.send(`Removed <@${idToDelete}>${idToDelete} from the blacklist.`);
			});
			console.log(`[${dateToTime(new Date())}]: Deleted ${idToDelete} from the blacklist.`);
			saveBlacklist(blacklist);
		} else {
			message.reply("I can not find that user's ID in the blacklist. Please try again");
		}
	} else {
		fs.writeFile(path.resolve(__dirname, "./server/blacklist.json"), "[]", (err) => {
			if (err){
				console.error(`[${dateToTime(new Date())}]: Error: An error occured while saving the blacklist. Err:${err}`);
				return;
			}
			loadBlacklist();
			replyNoMention(message, "Blacklist cleared.").catch(() => {
				console.error(`[${dateToTime(new Date())}]: Error: I can not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
				message.channel.send("Blacklist cleared.");
			});
		});
	}
	return;
}

// TODO: figure out the fucking launch queue checker
function processImage(message, postedTime, wasDelayed){
	handleImage(message, postedTime, wasDelayed).then(() => { // This runs after the recognition is finished
		imgStats.imageLogCount++;
		imgStats.currentlyImage--;
		if (imgStats.imageLogCount > 0 && imgStats.imageLogCount % 30 === 0) loadBlacklist();
		if (ops.processInfoMode) process.emit("logCurrentMemoryUsage", 1);
		// Potential future queue optimisation here. Currently not neccesary
		// todo: check queue
		// todo: fetch message from queue id
		// processImage(newMessage, newMessage.createdTimestamp, true);
	}).catch((err) => {
			imgStats.imageLogCount++;
			imgStats.currentlyImage--;
			if (err == "Fail") saveStats("Failure");
			if (ops.processInfoMode) process.emit("logCurrentMemoryUsage", 1);
	});
}

client.once("ready", async () => {
	const server = (ops.serverID) ? await client.guilds.fetch(ops.serverID) : undefined;
	const logs = (ops.logsChannel) ? await client.channels.fetch(ops.logsChannel) : undefined;
	const channel = (ops.screenshotScanning && ops.screenshotChannel) ? await client.channels.fetch(ops.screenshotChannel) : undefined;
	if (ops.badgeChannel > 0) await client.channels.fetch(ops.badgeChannel);
	// if (ops.profileChannel) profile = await client.channels.fetch(ops.profileChannel);
	// if (ops.screenshotScanning) {
	// 	if (ops.screenshotChannel) channel = await client.channels.fetch(ops.screenshotChannel);
	// 	const { passAppServ } = require("./commands/approve.js");
	// 	const { passRevServ } = require("./commands/revert.js");
	// 	const { passImgServ } = require("./handlers/images.js");
	// 	passAppServ([channel, profile, server, logs]);
	// 	passRevServ([channel, server]);
	// 	passImgServ(logs);
	// }
	if (ops.dmMail) {
		await mail.passServ(server.name, server.iconURL());
	}
	const soul = await client.users.fetch(dev, false, true);
	if (ops.serverID == "0" || server == undefined){
		console.log("\nOops the server is broken. Set \"serverID\" in the config.json");
		return;
	}
	if (ops.screenshotScanning && (ops.screenshotChannel == "0" || channel == undefined)){
		console.log("\nOops the screenshot channel is broken. Set \"screenshotChannel\" in the config.json");
		return;
	}
	if (ops.logsChannel == "0" || logs == undefined){
		console.log("\nOops the logs channel is broken. Set \"logsChannel\" in the config.json. It is neccesary for permission reasons.");
		return;
	}
	if (ops.screenshotScanning){
		channel.send(messagetxtReplace(messagetxt.load)).then(msg => {
			if (ops.msgDeleteTime){
				setTimeout(() => {
					msg.delete().catch(() => {
						console.error(`[${dateToTime(new Date())}]: Error: Could not delete message: ${msg.url}\nContent of mesage: "${msg.content}"`);
					});
				}, ops.msgDeleteTime);
			}
		});
		channel.messages.fetch({ limit:20 }).then(msgs => {
			const closeMsg = msgs.filter(msg => (msg.author == client.user) && (msg.content.startsWith("The bot") || msg.content == "Restarting..."));
			closeMsg.each((msg) => {
				msg.delete().catch(() => {
					console.error(`[${dateToTime(new Date())}]: Error: Could not delete message: ${closeMsg.url}\nContent of mesage: "${closeMsg.content}"`);
				});
			});
		});
	}
	logs.send(messagetxtReplace(messagetxt.load));
	loaded = true;
	const activeServers = client.guilds.cache;
	const activeServerList = [];
	activeServers.each(serv => activeServerList.push(`"${serv.name}" aka #${serv.id}`));
	soul.send(`**Dev message:** Active in:\n${activeServerList.join("\n")}`).catch(console.error);
	soul.send(`**Dev message:** Loaded in guild: "${server.name}"#${server.id} in channel <#${channel.id}>#${channel.id}`).catch(console.error);
	console.log(`\nActive in:\n${activeServerList.join("\n")}`);
	console.log(`\nServer started at: ${launchDate.toLocaleString()}. Loaded in guild: "${server.name}"#${server.id} ${(ops.screenshotScanning) ? `in channel: "${channel.name}"#${channel.id}` : ""}`);
	console.log("\n======================================================================================\n");
})
.on("guildMemberAdd", member => {
	// console.log(`[${dateToTime(new Date())}]: New member ${member.user.username}${member} joined the server.`);
  if (!ops.welcomeMsg) return;
  member.send(messagetxtReplace(messagetxt.newMember, member)).catch(() => {
		console.error(`[${dateToTime(new Date())}]: Error: Could not send welcomeMsg DM to ${member.user.username}${member}`);
	});
})
.on("guildMemberUpdate", async (oldMember, newMember) => {
	const audit = await newMember.guild.fetchAuditLogs({
		limit:1,
		type: "MEMBER_ROLE_UPDATE",
	});
	const entry = audit.entries.first();
	const entTime = entry.createdTimestamp,
				entRoleId = entry.changes[0].new[0].id,
				entKey = entry.changes[0].key,
				entTargetId = entry.target.id;
	if (
		entTime > Date.now() - 5000
		&& entRoleId == ops.verifiedRole
		&& entKey == "$add"
		&& entTargetId == newMember.id
	) {
		newMember.send(messagetxtReplace(messagetxt.respondVerify, newMember.user)).catch(() => {
			errorMessage(new Date(), false, `Error: I can not send a Verify DM message to ${newMember.user.username}#${newMember.user.id}`);
		});
	}
})
.on("interactionCreate", (interaction) => {
	if (!interaction.isButton()) return;
	let level;
	if (interaction.customId == "mailSend" || interaction.customId == "mailCancel") return;
	else {
		let id;
		try {
			id = interaction.message.mentions.members.first().id;
		} catch {
			interaction.update({ components : [], content: `${interaction.message.content}\nEdit: Member Left Server` });
			interaction.message.react("👋");
			return;
		}
		if (interaction.customId == "canc") {
			const originalContent = interaction.message.content.split("\n");
			originalContent.pop();
			const newContent = originalContent.join("\n") + `\nEdit: buttons cancelled <t:${Math.round(Date.now() / 1000)}:R>`;
			console.log(`[${dateToTime(new Date())}]: ${interaction.user.username}${interaction.user} cancelled buttons for user ${id}`);
			interaction.update({ components : [], content: newContent });
			return;
		} else if (interaction.customId == "app") level = undefined;
		else if (interaction.customId == "rej") level = ops.targetLevel - 1;
		else return console.error(errorMessage(Date.now(), false, "Impossible error: button customId is wrong"), interaction.customId);
		client.commands.get("confirm-screenshot").execute(interaction, [id, level], "button").then((logString) => {
			const originalContent = interaction.message.content.split("\n");
			originalContent.pop();
			const newContent = originalContent.join("\n") + `\nEdit: Action Completed <t:${Math.round(Date.now() / 1000)}:R>`;
			console.log(`[${dateToTime(new Date())}]: ${interaction.user.username}${interaction.user} used a button${logString} for user ${id}`);
			interaction.update({ components : [], content: newContent });
		});
	}
})
.on("messageCreate", async message => {
	const profile = (ops.profileChannel) ? client.channels.cache.get(ops.profileChannel) : undefined;
	if (message.channel == profile) return; // Profile channel? Cancel
	if (message.author.bot && message.author.id != "155149108183695360" && message.author.id != "470722245824610306") return; // Bot? Cancel
	if (message.content == `${client.user.toString().slice(0, 2) + "!" + client.user.toString().slice(2, client.user.toString().length)} wassup` || message.content == `${client.user} wassup`) return message.reply("nm, you?");
	if (message.content == `${client.user.toString().slice(0, 2) + "!" + client.user.toString().slice(2, client.user.toString().length)} prefix` || message.content == `${client.user} prefix`) return message.reply(`\`${ops.prefix}\`${(ops.prefix2) ? ` or \`${ops.prefix2}\`` : ""}`);
	const postedTime = new Date();
	let dm = false;
	if (message.channel.type == "DM") dm = true;
	if (!dm && ops.serverID && message.guild.id != ops.serverID){ // If we are in the wrong server
		return;
	}
	let wasDelayed = false;
	const prefix = (ops.prefix.length == 0) ? undefined : ops.prefix;
	const prefix2 = (ops.prefix2.length == 0) ? undefined : ops.prefix2;
	if (ops.dmMail && !message.content.startsWith(prefix) && !message.content.startsWith(prefix2) && message.channel.parent && message.channel.parentId == ops.mailCategory) {
		mail.channelMsg(message);
		return;
	} else {
		const server = client.guilds.cache.get(ops.serverID);
		if ((message.content.startsWith(prefix) || message.content.startsWith(prefix2)) && message.guild == server) handleCommand(message, postedTime); // command handler
		// image handler
		else if (ops.screenshotScanning && (message.attachments.size > 0 && (!dm || (dm && ops.dmScanning)))) { // checks for an attachment.
			if (ops.performanceMode) performanceLogger(`\n\n\n#${imgStats.imageLogCount + 1}: Image received\t`, postedTime.getTime());
			if (dm) {
				message.memb = await server.members.fetch(message.author.id);
				saveStats("dm");
			} else {
				message.memb = message.member;
			}
			const channel = (ops.screenshotScanning && ops.screenshotChannel) ? client.channels.cache.get(ops.screenshotChannel) : undefined;
			if (!dm && channel == undefined){
				message.reply(`The screenshot channel could not be found. Please set it correctly using \`${prefix || prefix2}set screenshotChannel <id>\``).catch(() => {
					errorMessage(postedTime, dm, `Error: I can not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
					message.channel.send(`The screenshot channel could not be found. Please set it correctly using \`${prefix || prefix2}set screenshotChannel <id>\``);
				});
				return;
			}
			if (ops.saveLocalCopy && screensFolder != `./screens/Auto/${postedTime.toDateString()}`) {
				screensFolder = `./screens/Auto/${postedTime.toDateString()}`;
				await checkDateFolder(postedTime);
			}
			if (!dm && message.channel != channel) {

	// Some mail-ticket handling code should go here in the future

	// This is no longer necessary, especially since other channels might be mail channels. Still should stress the importance of security
	// 			console.log(`[${dateToTime(postedTime)}]: ${message.author.username}${message.author} sent an image, but it was not scanned, since the channel ${message.channel.name}${message.channel} is not the correct channel. My access to this channel should be removed.`);
	// 			message.reply(`I cannot scan an image in this channel. Please send it in ${channel}.
	// <@&${ops.modRole}>, perhaps you should prohibit my access from this (and all other) channels except for ${channel}.`).catch(()=>{
	// 				errorMessage(postedTime, dm, `Error: I can not send a message in ${message.channel.name}${message.channel}`);
	// 			});
				return;
			}
			const image = message.attachments.first();
			const fileType = image.url.split(".").pop().toLowerCase();
			const acceptedFileTypes = ["png", "jpg", "jpeg", "jfif", "tiff", "bmp"];
			const logs = (ops.logsChannel) ? client.channels.cache.get(ops.logsChannel) : undefined;
			if (!acceptedFileTypes.includes(fileType) && !(image.contentType.split("/")[0] == "image")){
				if (ops.dmMail && dm) return mail.mailDM(message, "wrong");
				errorMessage(postedTime, dm, `${message.author.username}${message.author} sent an image, which was refused as ${fileType} is an invalid file type: `);
				message.reply(`I cannot scan this filetype: \`.${fileType}\`.\nIf you think this is in error, please tell a moderator.`).catch(() => {
					errorMessage(postedTime, dm, `Error: I can not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
					message.channel.send(`I cannot scan this filetype: \`.${fileType}\`.\nIf you think this is in error, please tell a moderator.`);
				});
				logs.send({ content: `${(dm) ? "Sent in a DM\n" : ""}User: ${message.author}\nFile is not an image. Not scanned.\n`, files: [image] });
				saveStats("wrong");
				return;
			}
			if (image.height < 50 || image.width < 50 || fileType.length > 6){
				if (ops.dmMail && dm) return mail.mailDM(message, "tiny");
				errorMessage(postedTime, dm, `${message.author.username}${message.author} sent an image, which was refused for being Empty/Tiny`);
				message.reply("I cannot scan tiny images or images with no size information.\nIf you think this is in error, please tell a moderator.").catch(() => {
					errorMessage(postedTime, dm, `Error: I can not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
					message.channel.send("I cannot scan tiny or blank images.\nIf you think this is in error, please tell a moderator.");
				});
				logs.send({ content: `${(dm) ? "Sent in a DM\n" : ""}User: ${message.author}\nEmpty/Tiny image file. Not scanned.\n`, files: [image] });
				saveStats("wrong");
				return;
			}
			if (image.size / 1048576 > 15){ //
				errorMessage(postedTime, dm, `${message.author.username}${message.author} sent an image, which was refused for being over 15mb: ${(image.size / 1048576).toFixed(2)}MB.`);
				message.reply("I cannot handle such a large file.\nIf you think this is in error, please tell a moderator.").catch(() => {
					errorMessage(postedTime, dm, `Error: I can not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
					message.channel.send("I cannot handle such a large file.\nIf you think this is in error, please tell a moderator.");
				});
				logs.send({ content: `${(dm) ? "Sent in a DM\n" : ""}User: ${message.author}\nLarge file over 15MB: ${(image.size / 1048576).toFixed(2)}MB. Not scanned.\nFile url: ${image.url}` });
				saveStats("wrong");
				return;
			}
			if (message.memb == null){
				if (ops.dmMail && dm) return mail.mailDM(message, "left");
				errorMessage(postedTime, dm, `${message.author.username}${message.author} sent an image, but left the server.`);
				logs.send({ content: `${(dm) ? "Sent in a DM\n" : ""}User: ${message.author}\nLeft the server. Not scanned.\n`, files: [image] });
				saveStats("left");
				return;
			}
			if (message.memb.roles.cache.has(ops.blacklistRole) && ops.blacklistRole){
				if (ops.dmMail && dm) return mail.mailDM(message, "man-black");
				message.reply(`<@&${ops.modRole}> This message was not scanned due to the manual blacklist.`).catch(() => {
					errorMessage(postedTime, dm, `Error: I can not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
					message.channel.send(`<@&${ops.modRole}> This message was not scanned due to the manual blacklist.`);
				});
				logs.send({ content: `${(dm) ? "Sent in a DM\n" : ""}User: ${message.author}\nNot scanned due to manual blacklist:\n<@&${ops.blacklistRole}>`, files: [image] });
				console.log(`[${dateToTime(postedTime)}]: ${message.author.username}${message.author} sent an image, which was refused due to the manual blacklist`);
				saveStats("black");
				return;
			}
			if (message.memb.roles.cache.has(ops.level50Role) && message.memb.roles.cache.has(ops.level40Role) && message.memb.roles.cache.has(ops.targetLevelRole)){
				if (ops.dmMail && dm) return mail.mailDM(message, "all");
				message.author.send("You already have all available roles.").catch(() => {
					errorMessage(postedTime, dm, `Error: Could not send DM to ${message.author.username}${message.author}`);
				});
				logs.send({ content: `${(dm) ? "Sent in a DM\n" : ""}User: ${message.author}\nRoles: All 3 already possessed`, files: [image] });
				console.log(`[${dateToTime(postedTime)}]: ${message.author.username}${message.author} sent an image, but already possessed all 3 roles.`);
				if (!dm && ops.deleteScreens) message.delete().catch(() => {
					errorMessage(postedTime, dm, `Error: Could not delete message: ${message.url}\nContent of mesage: "${message.content}"`);
				});
				saveStats("all");
				return;
			}
			if (ops.blacklistTime > 0 && blacklist.has(message.author.id)){ // The blacklist is intended to prevent people from instantly bypassing the bot when their first screenshot fails
				if (postedTime.getTime() - blacklist.get(message.author.id) < ops.blacklistTime){
					if (ops.dmMail && dm) return mail.mailDM(message, "black");
					saveStats("black");
					message.author.send(messagetxtReplace(messagetxt.denyBlacklist, message.author)).catch(() => {
						errorMessage(postedTime, dm, `Error: Could not send DM to ${message.author.username}${message.author}`);
					});
					logs.send({ content: `${(dm) ? "Sent in a DM\n" : ""}User: ${message.author}\nNot scanned due to automatic blacklist. \nTime left: ${((ops.blacklistTime - (postedTime.getTime() - blacklist.get(message.author.id))) / 3600000).toFixed(1)} hours`, files: [image] });
					if (!dm && ops.deleteScreens) message.delete().catch(() => {
						errorMessage(postedTime, dm, `Error: Could not delete message: ${message.url}\nContent of mesage: "${message.content}"`);
					});
					console.log(`[${dateToTime(postedTime)}]: ${message.author.username}${message.author} sent an image, which was refused due to the auto blacklist`);
					return;
				} else {
					blacklist.delete(message.author.id);
					console.log(`[${dateToTime(postedTime)}]: Removed ${message.author.username}${message.author} from the blacklist.`);
				}
			}
			if (ops.performanceMode) performanceLogger(`#${imgStats.imageLogCount + 1}: Checks complete\t`, postedTime.getTime());
	// This checks whether a new image can be processed every second
	// It checks the current instance against the total amount of images completed so far
	// That way, only the next image in row can be processed
	// It is probably the most janky part of the bot
	// If the instance and the imageLogCount fall out of sync somehow, It breaks
	// an error should be handled properly (as uncaughtException iterates imageLogCount)
	// but would break if for example, 2 errors are caused by the same image
	// a better queue system might involve adding the image to a collection. not sure how I would do that
	// anyway, this definitely caused half of my issues when developing
	// hopefully it is bodged well enough to be stable
			imgStats.imageAttempts++;
			imgStats.currentlyImage++;
			const instance = imgStats.imageAttempts;
			new Promise((res) => {
				if (imgStats.imageLogCount + 1 == instance){
					res();
				} else {
					wasDelayed = true;
					const intervalID = setInterval(function() {
						if (imgStats.imageLogCount + 1 == instance){
							res();
							clearInterval(intervalID);
						}
					}, 250);
				}
			}).then(() => {
				if (ops.processInfoMode) process.emit("logCurrentMemoryUsage", 0);
				if (ops.performanceMode) performanceLogger(`#${imgStats.imageLogCount + 1}: Queue passed\t`, postedTime.getTime());
				processImage(message, postedTime, wasDelayed); // handles the image, then checks the queue for more images
			});
		} else if (dm) {
			if (ops.dmSymbolDenial) {
				if (message.content.startsWith("$")) {
					message.reply(`Commands starting with \`$\` are for a different bot (Pokénav).
	You can use them in <#${ops.profileChannel}> once you show you are above level ${ops.targetLevel}.`).catch(() => {
						errorMessage(postedTime, dm, `Error: I can not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
						message.author.send(`Commands starting with \`$\` are for a different bot (Pokénav).\nYou can use them in <#${ops.profileChannel}> once you show you are above level ${ops.targetLevel}.`);
					});
					return;
				} else if (message.content.startsWith("/") || message.content.startsWith("!") || message.content.startsWith("?")) {
					message.reply(`That command is likely for a different bot.${(ops.dmMail) ? "\nIf you need any help just reply to this message to talk to the staff." : ""}`).catch(() => {
						errorMessage(postedTime, dm, `Error: I can not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
						message.author.send(`That command is likely for a different bot.${(ops.dmMail) ? "\nIf you need any help just reply to this message to talk to the staff." : ""}`);
					});
					return;
				}
			}
			if (ops.dmMail){
				mail.mailDM(message);
			} else {
				message.reply(`This bot does not currently work in dms.\nPlease send your profile screenshot in <#${ops.screenshotChannel}>.`).catch(() => {
					errorMessage(postedTime, dm, `Error: I can not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
					message.author.send(`This bot does not currently work in dms.\nPlease send your profile screenshot in <#${ops.screenshotChannel}>.`);
				});
			}
			return;
		} else return;
	}
});

if (ops.debugMode) {
	client.on("debug", (info) => {
		const d = new Date();
		const dateTime = `${d.getFullYear()}-${(d.getMonth() + 1 < 10) ? `0${d.getMonth() + 1}` : d.getMonth() + 1}-${(d.getDate() < 10) ? `0${d.getDate()}` : d.getDate()} ${(d.getHours() < 10) ? `0${d.getHours()}` : d.getHours()}:${(d.getMinutes() < 10) ? `0${d.getMinutes()}` : d.getMinutes()}:${(d.getSeconds() < 10) ? `0${d.getSeconds()}` : d.getSeconds()}.${(d.getMilliseconds() < 10) ? `00${d.getMilliseconds()}` : `${(d.getMilliseconds() < 100) ? `0${d.getMilliseconds()}` : `${d.getMilliseconds()}`}`}`;
		console.error(`[${dateTime}]: Debug info:.`, info);
	}).on("rateLimit", (data) => {
		console.error(`[${dateToTime(new Date())}]: Ratelimit hit:`, data);
	});
}

if (ops.processInfoMode) {
	process.on("beforeExit", (code) => {
		console.log(`[${dateToTime(new Date())}]: Process beforeExit event with code:`, code);
	})
	.on("disconnect", () => {
		console.log(`[${dateToTime(new Date())}]: Process disconnect`);
	})
	.on("exit", (code) => {
		console.log(`[${dateToTime(new Date())}]: Process exited with code:`, code);
	})
	.on("message", (message, sendHandle) => {
		console.log(`[${dateToTime(new Date())}]: Process emitted a message:`, message, "\nsendHandle:", sendHandle);
	})
	.on("multipleResolves", (type, promise, value) => {
		console.log(`[${dateToTime(new Date())}]: Process had a multipleResolves event with type:`, type, "\nPromise:", promise, "\nValue:", value);
	})
	.on("rejectionHandled", (promise) => {
		console.log(`[${dateToTime(new Date())}]: Process handled a rejection. Promise:`, promise);
	})
	.on("warning", (warning) => {
		console.log(`[${dateToTime(new Date())}]: Process warning: `, warning);
	})
	.on("worker", (worker) => {
		console.log(`[${dateToTime(new Date())}]: Process made a new worker: `, worker);
	});
	let memBeforeScan = process.memoryUsage();
	let memAfterScan = memBeforeScan;
	let memNow = memBeforeScan;
	logMemory("Start", memNow);
	process.on("logCurrentMemoryUsage", (state) => {
		if (state == 1) {
			memAfterScan = process.memoryUsage();
			logMemory("After", memAfterScan);
		} else if (state.id > 0) {
			memNow = process.memoryUsage();
			const memArr = [];
			for (const v in memNow) {
				memArr.push(`\n ${v}: ${Math.round(memNow[v] / 1024 / 1024 * 100) / 100} MB`);
			}
			const memDiff = [];
			for (const v in memBeforeScan) {
				memDiff.push(`\n ${v}: ${Math.round((memNow[v] - memBeforeScan[v]) / 1024 / 1024 * 100) / 100} MB`);
			}
			state.reply(`Current memory usage:${memArr} \n\nDifferences from last scan:${memDiff}`);
		} else {
			memBeforeScan = process.memoryUsage();
			logMemory("Before", memBeforeScan);
		}
	});
}

async function logMemory(state, mem) {
	const rss = Math.round(mem.rss / 1024 / 1024);
	const heapTot = Math.round(mem.heapTotal / 1024 / 1024);
	const heapUsed = Math.round(mem.heapUsed / 1024 / 1024);
	const external = Math.round(mem.external / 1024 / 1024 * 100) / 100;
	const arrayBuffers = Math.round(mem.arrayBuffers / 1024 / 1024 * 100) / 100;
	const memPath = path.resolve(__dirname, "./server/memory.txt");
	try {
		await fs.promises.access(memPath, fs.constants.W_OK);
		const d = new Date();
		const memString = `\n${d.toLocaleDateString()} ${d.toLocaleTimeString()}, ${state}, ${(state == "Before") ? imgStats.imageLogCount + 1 : imgStats.imageLogCount}, ${rss}, ${heapUsed}, ${heapTot}, ${external}, ${arrayBuffers}`;
		await fs.promises.appendFile(memPath,	memString);
	} catch (e) {
		if (e.code == "ENOENT") {
			const memString = "timestamp, state, count, rss, heapUsed, heapTot, external, arrayBuffers";
			await fs.promises.appendFile(memPath,	memString);
		} else console.error(e);
	}
}

client.on("error", (error) => {
	console.error(`[${dateToTime(new Date())}]: Client Error: ${error}`);
})
.on("warn", (info) => {
	console.error(`[${dateToTime(new Date())}]: Client Waring: ${info}`);
})
.on("shardError", (error, id) => {
	console.error(`[${dateToTime(new Date())}]: Websocket disconnect: ${error}. ID: ${id}`);
})
.on("shardResume", () => {
	if (imgStats.currentlyImage > 0){
		imgStats.imageLogCount++;
		imgStats.currentlyImage--;
		console.error(`[${dateToTime(new Date())}]: Balancing imageLogCount`);
	}
	if (loaded) {
		console.error(`[${dateToTime(new Date())}]: Resumed! Refreshing Activity...`);
		client.user.setActivity(act, { type: "PLAYING" });
	}
})
.on("shardDisconnect", (evt, id) => {
	console.error(`[${dateToTime(new Date())}]: Disconnected!`);
	console.log(evt, id);
})
.on("shardReady", (id, una) => {
	if (imgStats.currentlyImage > 0){
		imgStats.imageLogCount++;
		imgStats.currentlyImage--;
		console.error(`[${dateToTime(new Date())}]: Balancing imageLogCount`);
	}
	if (loaded) {
		console.error(`[${dateToTime(new Date())}]: Reconnected! Refreshing Activity...`);
		console.error(id, una);
		client.user.setActivity(act, { type: "PLAYING" });
	}
})
.on("shardReconnecting", (id) => {
	if (loaded) {
		console.error(`[${dateToTime(new Date())}]: Reconnecting... [${id}]`);
	}
});

process.on("uncaughtException", (err) => {
	if (imgStats.currentlyImage > 0){
		imgStats.imageLogCount++;
		imgStats.currentlyImage--;
	}
	if (err != null) {
		const channel = (ops.screenshotScanning && ops.screenshotChannel) ? client.channels.cache.get(ops.screenshotChannel) : undefined;
		if (err.message.substr(0, 35) == "Error: UNKNOWN: unknown error, open"){
			console.error(`[${dateToTime(new Date())}]: Error: Known imageWrite crash. Consider turning off saveLocalCopy. This error should be handled correctly.`);
			if (ops.screenshotChannel) channel.send("An internal error occured. Please retry sending the screenshot(s) that failed.").then((errorMsg) => {
				setTimeout(() => {
					if (ops.msgDeleteTime > 0){
						errorMsg.delete().catch(() => {
							console.error(`[${dateToTime(new Date())}]: Error: Could not delete message: ${errorMsg.url}\nContent of mesage: "${errorMsg.content}"`);
						});
					}
				}, ops.msgDeleteTime);
			});
		} else {
			console.error(`Uncaught Exception: ${err}${err.stack}`);
			if (ops.screenshotChannel) channel.send(`<@&${ops.modRole}> An unexpected internal error occured. Please give the developer this information:\n${err}${err.stack}`);
    }
	} else {
		console.error(err);
  }
 })
.on("unhandledRejection", (err, promise) => {
	try {
		if (err.substr(0, 35) == "Error: UNKNOWN: unknown error, open"){
			// do nothing
		} else {
			console.error(`[${dateToTime(new Date())}]: Unhandled rejection at `, promise, `reason: ${err}`);
		}
	} catch (e) {
		console.error(`[${dateToTime(new Date())}]: Unhandled rejection at `, promise, `reason: ${err}`);
	}
})
.on("SIGINT", () => {
  console.log(`Process ${process.pid} has been interrupted`);
	const channel = (ops.screenshotScanning && ops.screenshotChannel) ? client.channels.cache.get(ops.screenshotChannel) : undefined;
	if (ops.screenshotChannel) channel.send("The bot is sleeping now. Goodbye :wave:").then(() => {
		process.exit(1);
	});
	else process.exit(1);
});

const { token } = require("./server/keys.json"),
			fs = require("fs"),
			path = require("path"),
			Discord = require("discord.js"),
			messagetxt = require("./server/messagetxt.js"),
			{ handleCommand } = require("./handlers/commands.js"),
			{ handleImage } = require("./handlers/images.js"),
			{ dateToTime, performanceLogger, replyNoMention } = require("./func/misc.js"),
			{ saveStats, loadStats } = require("./func/stats.js"),
			{ saveBlacklist } = require("./func/saveBlacklist.js"),
			{ messagetxtReplace } = require("./func/messagetxtReplace.js"),
			ver = require("./package.json").version;

const client = new Discord.Client({ intents: [
				Discord.Intents.FLAGS.GUILDS,
				Discord.Intents.FLAGS.GUILD_MEMBERS,
				Discord.Intents.FLAGS.GUILD_MESSAGES,
				Discord.Intents.FLAGS.DIRECT_MESSAGES,
			] }),
			cooldowns = new Discord.Collection(),
			launchDate = new Date();
imgStats = {
				imageAttempts : 0,
				imageLogCount : 0,
				currentlyImage : 0,
			};
blacklist = new Discord.Collection();
let loaded = false,
		config = {},
		channel = {},
		logs = {},
		profile = {},
		server = {},
		screensFolder = `./screens/Auto/${launchDate.toDateString()}`;
ops = {};
module.exports = { loadConfigs, clearBlacklist, cooldowns, screensFolder };

// Loads all the variables at program launch
async function load(){
	console.log("======================================================================================");
	console.log("Server starting...");
		await loadConfigs();
		await checkDateFolder(launchDate).catch((err) => { console.error(`[${dateToTime(new Date())}]: `, err);});
		await loadCommands();
		await loadBlacklist().catch((err) => { console.error(`[${dateToTime(new Date())}]: `, err);});
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
			loaded = true;
			resolve();
		} else {
			(async () => {
				channel = await client.channels.fetch(ops.screenshotChannel);
				logs = await client.channels.fetch(ops.logsChannel);
				profile = await client.channels.fetch(ops.profileChannel);
				server = await client.guilds.fetch(ops.serverID);
				const { passAppServ } = require("./commands/approve.js");
				const { passRevServ } = require("./commands/revert.js");
				const { passImgServ } = require("./handlers/images.js");
				passAppServ([channel, profile, server, logs]);
				passRevServ([channel, server]);
				passImgServ(logs);
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
			let newFolder = `./screens/Auto/${checkDate.toDateString()}`; // eslint-disable-line prefer-const
			console.log(`\nChecking for ${newFolder}...`);
			fs.access(newFolder, (err) => {
				if (err){
					fs.mkdir("./screens", { recursive: true }, (err) => {
						if (err) return reject(`Error occured when making/checking "./screens". Error: ${err}`);
						else {
							console.log("Created/checked Folder: \"screens\"");
							fs.mkdir("./screens/Auto", { recursive: true }, (err) => {
								if (err) return reject(`Error occured when making/checking "./screens/Auto". Error: ${err}`);
								else {
									console.log("Created/checked Folder: \"Auto\"");
									fs.mkdir(newFolder, { recursive: true }, (err) => {
										if (err) return reject(`Error occured when making/checking "${newFolder}". Error: ${err}`);
										else {
											console.log(`Created/checked Folder: ${checkDate.toDateString()}.`);
											resolve();
										}
									});
								}
							});
						}
					});
				} else {
					console.log(`Folder: ${checkDate.toDateString()} already existed.`);
					resolve();
				}
			});
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
			commandFilesNames = commandFilesNames + ops.prefix + command.name;
			if (command.cooldown){
				commandFilesNames = commandFilesNames + ":\t" + command.cooldown + " seconds \n";
			} else {
				commandFilesNames = commandFilesNames + "\n";
			}
			client.commands.set(command.name, command);
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
						fs.writeFile("./server/blacklist.json", "[]", (err) => {
							if (err){
								reject(`Error thrown when writing stats file. Error: ${err}`);
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

// Checks all the bot guilds and leaves them if they aren't the intended server
// If it is called from the main event, it sends a reply message
// This is vital, else someone could change the settings by simply inviting the bot to their server and being admin
// TODO: Make different settings for different servers. It is not necessary, but would be good practice
async function checkServer(message){
	const dev = await client.users.fetch("146186496448135168", false, true);
	// 216412752120381441
	if (ops.serverID === undefined) return;
	if (message){
		await message.reply("This is not the intended server. Goodbye forever :wave:").catch(() => {
				console.error(`[${dateToTime(new Date())}]: Error: I can not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
				message.channel.send("This is not the intended server. Goodbye forever :wave:");
			});
		message.guild.leave().then(s => {
			console.log(`Left: ${s}#${s.id}, as it is not the intended server.`);
			dev.send(`**Dev message: **Left: ${s}#${s.id}`).catch(console.error);
		}).catch(console.error);
	}
	const activeServers = client.guilds.cache;
	activeServers.each(serv => {
		if (serv.id != ops.serverID){
			serv.leave().then(s => {
				console.log(`Left: ${s}, as it is not the intended server.`);
				dev.send(`**Dev message: **Left: ${s}#${s.id}`).catch(console.error);
			}).catch(console.error);
		}
	});
}

load();

client.once("ready", async () => {
	channel = await client.channels.fetch(ops.screenshotChannel);
	logs = await client.channels.fetch(ops.logsChannel);
	profile = await client.channels.fetch(ops.profileChannel);
	server = await client.guilds.fetch(ops.serverID);
	const { passAppServ } = require("./commands/approve.js");
	const { passRevServ } = require("./commands/revert.js");
	const { passImgServ } = require("./handlers/images.js");
	passAppServ([channel, profile, server, logs]);
	passRevServ([channel, server]);
	passImgServ(logs);
	const dev = await client.users.fetch("146186496448135168", false, true);
	checkServer();
	client.user.setActivity(`${ver}`);
	if (server == undefined){
		console.log("\nOops the screenshot server is broken.");
		return;
	}
	if (channel == undefined){
		console.log("\nOops the screenshot channel is broken.");
		return;
	}
	if (logs == undefined){
		console.log("\nOops the logs channel is broken.");
		return;
	}
	if (profile == undefined){
		console.log("\nOops the profile setup channel is broken.");
		return;
	}
	channel.send(messagetxtReplace(messagetxt.load)).then(msg => {
		if (ops.msgDeleteTime && !msg.deleted){
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
	dev.send(`**Dev message: **Loaded in guild: "${server.name}"#${server.id} in channel <#${channel.id}>#${channel.id}`);
	console.log(`\nServer started at: ${launchDate.toLocaleString()}. Loaded in guild: "${server.name}"#${server.id} in channel: "${channel.name}"#${channel.id}`);
	console.log("\n======================================================================================");
});


client.on("guildMemberAdd", member => {
	// console.log(`[${dateToTime(new Date())}]: New member ${member.user.username}${member} joined the server.`);
  if (!ops.welcomeMsg) return;
  member.send(messagetxtReplace(messagetxt.newMember, member)).catch(() => {
		console.error(`[${dateToTime(new Date())}]: Error: Could not send welcomeMsg DM to ${member.user.username}${member}`);
	});
});

// Called from clear-blacklist.js to clear the blacklist when requested
function clearBlacklist(message, idToDelete){
	if (idToDelete){
		blacklist.delete(idToDelete[0]);
		replyNoMention(message, `Removed <@${idToDelete[0]}>${idToDelete[0]} from the blacklist.`).catch(() => {
				console.error(`[${dateToTime(new Date())}]: Error: I can not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
				message.channel.send(`Removed <@${idToDelete[0]}>${idToDelete[0]} from the blacklist.`);
			});
		console.log(`[${dateToTime(new Date())}]: Deleted ${idToDelete[0]} from the blacklist.`);
		saveBlacklist(blacklist);
	} else {
		fs.writeFile("./server/blacklist.json", "[]", (err) => {
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

		// Potential future queue optimisation here. Currently not neccesary
		// todo: check queue
		// todo: fetch message from queue id
		// processImage(message, message.createdTimestamp, true);
	}).catch((err) => {
			imgStats.imageLogCount++;
			imgStats.currentlyImage--;
			if (err == "Fail") saveStats("Failure");
	});
}

client.on("messageCreate", message => {
	if (message.channel == profile) return;
	if (message.author.bot) return; // Bot? Cancel
	const postedTime = new Date();
	if (message.channel.type === "DM") { // This section may be mail code, one day
		console.log(`[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} sent a message in a dm for some reason.${(message.attachments.size > 0) ? "\nMessage contained a file" : ""}${(message.content) ? `\nMessage content: ${message.content}` : ""}`);
		if (message.content.startsWith("$")) {
			message.reply(`Commands starting with \`$\` are for a different bot (Pokénav).\nYou can use them in <#${ops.profileChannel}> once you have confirmed you are above level 30 by sending a screenshot in <#${ops.screenshotChannel}>.`).catch(() => {
				console.error(`[${dateToTime(postedTime)}]: Error: I can not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
				message.author.send(`Commands starting with \`$\` are for a different bot (Pokénav).\nYou can use them in <#${ops.profileChannel}> once you have confirmed you are above level 30 by sending a screenshot in <#${ops.screenshotChannel}>.`);
			});
		} else {
			message.reply(`This bot does not currently work in dms.\nPlease send your profile screenshot in <#${ops.screenshotChannel}>.`).catch(() => {
				console.error(`[${dateToTime(postedTime)}]: Error: I can not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
				message.author.send(`This bot does not currently work in dms.\nPlease send your profile screenshot in <#${ops.screenshotChannel}>.`);
			});
		}
		return;
	}
	if (message.channel.type !== "DM" && message.guild.id != ops.serverID && ops.serverID){ // If we are in the wrong server
		checkServer(message); // It passes message so that it can respond to the message that triggered it
		return;
	}
	let wasDelayed = false;
	// image handler
	if (message.attachments.size > 0) { // checks for an attachment
		if (ops.performanceMode) performanceLogger(`\n\n\n#${imgStats.imageLogCount + 1}: Image received\t`, postedTime.getTime());
		if (channel == undefined){
			message.reply(`The screenshot channel could not be found. Please set it correctly using \`${ops.prefix}set screenshotChannel <id>\``).catch(() => {
				console.error(`[${dateToTime(postedTime)}]: Error: I can not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
				message.channel.send(`The screenshot channel could not be found. Please set it correctly using \`${ops.prefix}set screenshotChannel <id>\``);
			});
		}
		if (message.channel == logs) {
			return;
		}
		if (ops.saveLocalCopy && screensFolder != `./screens/Auto/${postedTime.toDateString()}`) {
			screensFolder = `./screens/Auto/${postedTime.toDateString()}`;
			checkDateFolder(postedTime);
		}
		if (message.channel != channel) {

// Some mail-ticket handling code should go here in the future

// This is no longer necessary, especially since other channels might be mail channels. Still should stress the importance of security
// 			console.log(`[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} sent an image, but it was not scanned, since the channel ${message.channel.name}${message.channel} is not the correct channel. My access to this channel should be removed.`);
// 			message.reply(`I cannot scan an image in this channel. Please send it in ${channel}.
// <@&${ops.modRole}>, perhaps you should prohibit my access from this (and all other) channels except for ${channel}.`).catch(()=>{
// 				console.error(`[${dateToTime(postedTime)}]: Error: I can not send a message in ${message.channel.name}${message.channel}`);
// 			});
			return;
		}
		const image = message.attachments.first();
		const fileType = image.url.split(".").pop().toLowerCase();
		if (image.height < 50 || image.width < 50 || fileType.length > 6){ //
			console.error(`[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} sent an image, but could not be processed, since it is an Empty/Tiny image file`);
			message.reply("I cannot scan tiny images or images with no size information.\nIf you think this is in error, please tell a moderator.").catch(() => {
				console.error(`[${dateToTime(postedTime)}]: Error: I can not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
				message.channel.send("I cannot scan tiny or blank images.\nIf you think this is in error, please tell a moderator.");
			});
			logs.send({ content : `User: ${message.author}\nEmpty/Tiny image file. Not scanned.\n`, files: [image] });
			saveStats("wrong");
			return;
		}
		if (image.size / 1048576 > 15){ //
			console.error(`[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} sent an image, but could not be processed, since it is over 15mb`);
			message.reply("I cannot handle such a large file.\nIf you think this is in error, please tell a moderator.").catch(() => {
				console.error(`[${dateToTime(postedTime)}]: Error: I can not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
				message.channel.send("I cannot handle such a large file.\nIf you think this is in error, please tell a moderator.");
			});
			logs.send({ content : `User: ${message.author}\nLarge file over 15MB: ${(image.size / 1048576).toFixed(2)}MB. Not scanned.\nFile url: ${image.url}` });
			saveStats("wrong");
			return;
		}
		const acceptedFileTypes = ["png", "jpg", "jpeg", "jfif", "tiff", "bmp"];
		if (!acceptedFileTypes.includes(fileType) && !(image.contentType.split("/")[0] == "image")){
			console.error(`[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} sent an image, but could not be processed, due to an Invalid file type: ${fileType}`);
			message.reply(`I cannot scan this filetype: \`.${fileType}\`.\nIf you think this is in error, please tell a moderator.`).catch(() => {
				console.error(`[${dateToTime(postedTime)}]: Error: I can not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
				message.channel.send(`I cannot scan this filetype: \`.${fileType}\`.\nIf you think this is in error, please tell a moderator.`);
			});
			logs.send({ content : `User: ${message.author}\nFile is not an image. Not scanned.\n`, files: [image] });
			saveStats("wrong");
			return;
		}
		if (message.member == null){
			console.error(`[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} sent an image, but could not be processed, since they left the server.`);
			logs.send({ content : `User: ${message.author}\nLeft the server. Not scanned.\n`, files: [image] });
			saveStats("left");
			return;
		}
		if (message.member.roles.cache.has(ops.blacklistRole) && ops.blacklistRole){
			message.reply(`<@&${ops.modRole}> This message was not scanned due to the manual blacklist.`).catch(() => {
				console.error(`[${dateToTime(postedTime)}]: Error: I can not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
				message.channel.send(`<@&${ops.modRole}> This message was not scanned due to the manual blacklist.`);
			});
			logs.send({ content : `User: ${message.author}\nNot scanned due to manual blacklist:\n<@&${ops.blacklistRole}>`, files: [image] });
			console.error(`[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} sent an image, but it was declined, due to the manual blacklist`);
			saveStats("black");
			return;
		}
		if (message.member.roles.cache.has(ops.level50Role) && message.member.roles.cache.has(ops.level40Role) && message.member.roles.cache.has(ops.targetLevelRole)){
			message.author.send("You already have all available roles.").catch(() => {
				console.error(`[${dateToTime(postedTime)}]: Error: Could not send DM to ${message.author.username}${message.author}`);
			});
			logs.send({ content : `User: ${message.author}\nRoles: All 3 already possessed`, files: [image] });
			console.log(`[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} sent an image, but already possessed all 3 roles.`);
			if (ops.deleteScreens && !message.deleted) message.delete().catch(() => {
				console.error(`[${dateToTime(postedTime)}]: Error: Could not delete message: ${message.url}\nContent of mesage: "${message.content}"`);
			});
			saveStats("all");
			return;
		}
		if (ops.blacklistTime > 0){ // The blacklist is intended to prevent people from instantly bypassing the bot when their first screenshot fails
			if (blacklist.has(message.author.id)){
				if (postedTime.getTime() - blacklist.get(message.author.id) < ops.blacklistTime){
					saveStats("black");
					message.author.send(messagetxtReplace(messagetxt.denyBlacklist, message.author)).catch(() => {
						console.error(`[${dateToTime(postedTime)}]: Error: Could not send DM to ${message.author.username}${message.author}`);
					});
					logs.send({ content : `User: ${message.author}\nNot scanned due to automatic blacklist. \nTime left: ${((ops.blacklistTime - (postedTime.getTime() - blacklist.get(message.author.id))) / 3600000).toFixed(1)} hours`, files: [image] });
					if (ops.deleteScreens && !message.deleted) message.delete().catch(() => {
						console.error(`[${dateToTime(postedTime)}]: Error: Could not delete message: ${message.url}\nContent of mesage: "${message.content}"`);
					});
					console.log(`[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} sent an image, but it was declined, due to the auto blacklist`);
					return;
				} else {
					blacklist.delete(message.author.id);
					console.log(`[${dateToTime(postedTime)}]: Removed ${message.author.username}${message.author} from the blacklist.`);
				}
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
			if (ops.performanceMode) performanceLogger(`#${imgStats.imageLogCount + 1}: Queue passed\t`, postedTime.getTime());

			processImage(message, postedTime, wasDelayed); // handles the image, then checks the queue for more images
		});
	} else {
		handleCommand(message, postedTime); // command handler
	}
});

process.on("uncaughtException", (err) => {
	if (imgStats.currentlyImage > 0){
		imgStats.imageLogCount++;
		imgStats.currentlyImage--;
	}
	if (err != null) {
		if (err.message.substr(0, 35) == "Error: UNKNOWN: unknown error, open"){
			console.error(`[${dateToTime(new Date())}]: Error: Known imageWrite crash. Consider turning off saveLocalCopy. This error should be handled correctly.`);
			channel.send("An internal error occured. Please retry sending the screenshot(s) that failed.").then((errorMessage) => {
				setTimeout(() => {
					if (errorMessage && ops.msgDeleteTime > 0){
						errorMessage.delete().catch(() => {
							console.error(`[${dateToTime(new Date())}]: Error: Could not delete message: ${errorMessage.url}\nContent of mesage: "${errorMessage.content}"`);
						});
					}
				}, ops.msgDeleteTime);
			});
		} else {
			console.error(`Uncaught Exception: ${err}${err.stack}`);
			channel.send(`<@&${ops.modRole}> An unexpected internal error occured. Please give the developer this information:\n${err}${err.stack}`);
    }
	} else {
		console.error(err);
  }
 });

process.on("unhandledRejection", (err, promise) => {
	try {
		if (err.substr(0, 35) == "Error: UNKNOWN: unknown error, open"){
			// do nothing
		} else {
			console.error(`[${dateToTime(new Date())}]: Unhandled rejection at `, promise, `reason: ${err}`);
		}
	} catch (e) {
		console.error(`[${dateToTime(new Date())}]: Unhandled rejection at `, promise, `reason: ${err}`);
	}
});

process.on("SIGINT", () => {
  console.log(`Process ${process.pid} has been interrupted`);
	channel.send("The bot is sleeping now. Goodbye :wave:").then(() => {
		process.exit(1);
	});
});

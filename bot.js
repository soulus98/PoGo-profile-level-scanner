const { createWorker, PSM } = require("tesseract.js");
const { token } = require("./server/keys.json");
const fs = require("fs");
const Discord = require("discord.js");
const { crop } = require("./func/crop.js");
const { saveFile } = require("./func/saveFile.js");
const { handleCommand } = require("./handlers/commands.js");
const { dateToTime } = require("./func/dateToTime.js");
const { saveStats, loadStats } = require("./func/stats.js");
const { saveBlacklist } = require("./func/saveBlacklist.js");
const { performanceLogger } = require("./func/performanceLogger.js");
const ver = require("./package.json").version;
require("discord-reply");

const client = new Discord.Client();
const cooldowns = new Discord.Collection();
let blacklist = new Discord.Collection();
const launchDate = new Date();
let lastImageTimestamp = Date.now(),
		imageAttempts = 0,
		imageLogCount = 0,
		loaded = false,
		currentlyImage = 0,
		config = {},
		channel = {},
		logs = {},
		profile = {},
		server = {};
let screensFolder = `./screens/Auto/${launchDate.toDateString()}`;
ops = {};
module.exports = { loadConfigs, clearBlacklist, cooldowns, blacklist, screensFolder };

// Loads all the variables at program launch
async function load(){
	console.log("======================================================================================");
	console.log("Server starting...");
		await loadConfigs();
		await checkDateFolder(launchDate).catch((err) => { console.error(`[${dateToTime(new Date())}]: `, err);});
		await loadCommands();
		await loadBlacklist().then((b) => {
			const { passAppBlack } = require("./commands/approve.js");
			const { passRevBlack } = require("./commands/revert.js");
			passAppBlack(b);
			passRevBlack(b);
		}).catch((err) => { console.error(`[${dateToTime(new Date())}]: `, err);});
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
		ops.timeDelay = config.numbers.timeDelay * 1000;
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
				passAppServ([channel, profile, server, logs]);
				passRevServ([channel, profile, server]);
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
		const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
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
					if (lastImageTimestamp - item[1] > ops.blacklistTime){
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
		await message.lineReply("This is not the intended server. Goodbye forever :wave:").catch(console.error);
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
	passAppServ([channel, profile, server, logs]);
	passRevServ([channel, profile, server]);
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
	channel.send("The bot has awoken, Hello :wave:").then(msg => {
		if (ops.msgDeleteTime && !msg.deleted){
			setTimeout(() => {
				msg.delete().catch(() => {
					console.error(`[${dateToTime(new Date())}]: Error: Could not delete message: ${msg.url}\nContent of mesage: "${msg.content}"`);
				});
			}, ops.msgDeleteTime);
		}
	});
	channel.messages.fetch({ limit:20 }).then(msgs => {
		const closeMsg = msgs.find(msg => msg.content == "The bot is sleeping now. Goodbye :wave:" || msg.content == "Restarting..." || msg.content == "The bot has awoken, Hello :wave:");
		if (closeMsg) closeMsg.delete().catch(() => {
			console.error(`[${dateToTime(new Date())}]: Error: Could not delete message: ${closeMsg.url}\nContent of mesage: "${closeMsg.content}"`);
		});
	});
	dev.send(`**Dev message: **Loaded in guild: "${server.name}"#${server.id} in channel <#${channel.id}>#${channel.id}`);
	console.log(`\nServer started at: ${launchDate.toLocaleString()}. Loaded in guild: "${server.name}"#${server.id} in channel: "${channel.name}"#${channel.id}`);
	console.log("======================================================================================");
});


client.on("guildMemberAdd", member => { // dave, dm when a member joins
	// console.log(`[${dateToTime(new Date())}]: New member ${member.user.username}${member} joined the server.`);
  if (!ops.welcomeMsg) return;
  member.send(`Hey ${member}, welcome to Pokémon GO Raids!

In order to gain access to our server we kindly ask you to post a screenshot of your trainer page that shows your trainer level.

Please post your screenshot in: <#${ops.screenshotChannel}>

You’ll then be given the required roles.

Then type \`$verify\` in <#${ops.profileChannel}> and follow the instructions, please.

Good luck, trainer!

We will only grant access to our server to trainers level 30 and up!
If you are under 30, you will be direct messaged with a link to our sister server, with no level requirement.`).catch(() => {
		console.error(`[${dateToTime(new Date())}]: Error: Could not send welcomeMsg DM to ${member.user.username}${member}`);
	});
});

// Called from clear-blacklist.js to clear the blacklist when requested
function clearBlacklist(message, idToDelete){
	if (idToDelete){
		blacklist.delete(idToDelete[0]);
		message.lineReplyNoMention(`Removed <@${idToDelete[0]}>${idToDelete[0]} from the blacklist.`);
		console.log(`[${dateToTime(new Date())}]: Deleted ${idToDelete[0]} from the blacklist.`);
		saveBlacklist(blacklist);
	} else {
		fs.writeFile("./server/blacklist.json", "[]", (err) => {
			if (err){
				console.error(`[${dateToTime(new Date())}]: Error: An error occured while saving the blacklist. Err:${err}`);
				return;
			}
			loadBlacklist();
			message.lineReplyNoMention("Blacklist cleared.");
		});
	}
	return;
}

client.on("message", message => {
	let logMsg = {}; // testo
	if (message.channel == profile) return;
	if (message.author.bot) return; // Bot? Cancel
	const postedTime = new Date();
	if (message.channel.type === "dm") { // This section may be mail code, one day
		console.log(`[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} sent a message in a dm for some reason.${(message.attachments.size > 0) ? "\nMessage contained a file" : ""}${(message.content) ? `\nMessage content: ${message.content}` : ""}`);
		if (message.content.startsWith("$")) {
			message.lineReply(`Commands starting with \`$\` are for a different bot (Pokénav).\nYou can use them in <#${ops.profileChannel}> once you have confirmed you are above level 30 by sending a screenshot in <#${ops.screenshotChannel}>.`);
		} else {
			message.lineReply(`This bot does not currently work in dms.\nPlease send your profile screenshot in <#${ops.screenshotChannel}>.`);
		}
		return;
	}
	if (message.channel.type !== "dm" && message.guild.id != ops.serverID && ops.serverID){ // If we are in the wrong server
		checkServer(message); // It passes message so that it can respond to the message that triggered it
		return;
	}
	let wasDelayed = false;
	let currentTime = Date.now();
	// image handler
	if (message.attachments.size > 0) { // checks for an attachment
		if (ops.performanceMode) performanceLogger("\n\n\nImage received\t", postedTime.getTime(), Date.now());
		if (channel == undefined){
			message.channel.send(`The screenshot channel could not be found. Please set it correctly using \`${ops.prefix}set screenshotChannel <id>\``);
		}
		if (message.channel == logs) {
			return;
		}
		if (ops.saveLocalCopy && screensFolder != `./screens/Auto/${postedTime.toDateString()}`) {
			screensFolder = `./screens/Auto/${(postedTime + 86400000).toDateString()}`;
			checkDateFolder(postedTime);
		}
		if (message.channel != channel) {

// Some mail-ticket handling code should go here in the future

// This is no longer necessary, especially since other channels might be mail channels. Still should stress the importance of security
// 			console.log(`[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} sent an image, but it was not scanned, since the channel ${message.channel.name}${message.channel} is not the correct channel. My access to this channel should be removed.`);
// 			message.lineReply(`I cannot scan an image in this channel. Please send it in ${channel}.
// <@&${ops.modRole}>, perhaps you should prohibit my access from this (and all other) channels except for ${channel}.`).catch(()=>{
// 				console.error(`[${dateToTime(postedTime)}]: Error: I can not send a message in ${message.channel.name}${message.channel}`);
// 			});
			return;
		}
		const image = message.attachments.first();
		const fileType = image.url.split(".").pop().toLowerCase();
		if (image.height < 50 || image.width < 50 || fileType.length > 6){ //
			console.error(`[${dateToTime(postedTime)}]: Error: Empty/Tiny image file`);
			message.lineReply("I cannot scan tiny or blank images.\nIf you think this is in error, please tell a moderator.");
			logs.send(`User: ${message.author}\nEmpty/Tiny image file. Not scanned.\n`, image);
			saveStats("wrong");
			return;
		}
		const acceptedFileTypes = ["png", "jpg", "jpeg", "jfif", "tiff", "bmp"];
		if (!acceptedFileTypes.includes(fileType)){
			console.error(`[${dateToTime(postedTime)}]: Error: Invalid file type: ${fileType}`);
			message.lineReply(`I cannot scan this filetype: \`.${fileType}\`.\nIf you think this is in error, please tell a moderator.`);
			logs.send(`User: ${message.author}\nFile is not an image. Not scanned.\n`, image);
			saveStats("wrong");
			return;
		}
		if (message.member == null){
			console.error(`[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} sent an image, but could not be processed, since they left the server.`);
			logs.send(`User: ${message.author}\nLeft the server. Not scanned.\n`, image);
			saveStats("left");
			return;
		}
		if (message.member.roles.cache.has(ops.blacklistRole) && ops.blacklistRole){
			message.lineReplyNoMention(`<@&${ops.modRole}> This message was not scanned due to the manual blacklist.`).catch(() => {
				console.error(`[${dateToTime(postedTime)}]: Error: I can not send a message in ${message.channel.name}${message.channel}`);
			});
			logs.send(`User: ${message.author}\nNot scanned due to manual blacklist:\n<@&${ops.blacklistRole}>`, image);
			console.error(`[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} sent an image, but it was declined, due to the auto blacklist`);
			saveStats("black");
			return;
		}
		if (message.member.roles.cache.has(ops.level50Role) && message.member.roles.cache.has(ops.level40Role) && message.member.roles.cache.has(ops.level30Role)){
			message.author.send("You already have all available roles.").catch(() => {
				console.error(`[${dateToTime(postedTime)}]: Error: Could not send DM to ${message.author.username}${message.author}`);
			});
			logs.send(`User: ${message.author}\nRoles: All 3 already possessed`, image);
			console.log(`[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} sent an image, but already possessed all 3 roles.`);
			if (ops.deleteScreens && !message.deleted) message.delete().catch(() => {
				console.error(`[${dateToTime(postedTime)}]: Error: Could not delete message: ${message.url}\nContent of mesage: "${message.content}"`);
			});
			saveStats("all");
			return;
		}
		if (ops.blacklistTime > 0){ // The blacklist is intended to prevent people from instantly bypassing the bot when their first screenshot fails
			if (blacklist.has(message.author.id)){
				if (currentTime - blacklist.get(message.author.id) < ops.blacklistTime){
					saveStats("black"); // dave, dm when a member is blacklisted
					message.author.send(`Hey, ${message.author}.
We are sorry, but you are currently prohibited from using the automated system due to a recent screenshot that was scanned under level 30.
If you have surpassed level 30, tag @moderator or message <@575252669443211264> to ask to be let in manually.
Otherwise, keep leveling up, and post your screenshot when you have reached that point.
Hope to raid with you soon! :wave:`).catch(() => {
						console.error(`[${dateToTime(postedTime)}]: Error: Could not send DM to ${message.author.username}${message.author}`);
					});
					logs.send(`User: ${message.author}\nNot scanned due to automatic blacklist. \nTime left: ${((ops.blacklistTime - (currentTime - blacklist.get(message.author.id))) / 3600000).toFixed(1)} hours`, image);
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
		if (ops.performanceMode) performanceLogger("Checks complete\t", postedTime.getTime(), Date.now());

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
		imageAttempts++;
		currentlyImage++;
		const instance = imageAttempts;
		new Promise((res) => {
			if (imageLogCount + 1 == instance){
				res();
			} else {
				wasDelayed = true;
				const intervalID = setInterval(function() {
					if (imageLogCount + 1 == instance){
						currentTime = Date.now();
						res();
						clearInterval(intervalID);
					}
				}, 250);
			}
		}).then(async () => {
			if (ops.performanceMode) performanceLogger("Queue passed\t", postedTime.getTime(), Date.now());
			lastImageTimestamp = Date.now(); // Setting lastImageTimestamp for the next time it runs
			let logString = `[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} sent image#${instance}`;
			try {
				await logs.send(`User: ${message.author} \n Loading...`).then((l) => {
					if (ops.performanceMode) performanceLogger("Log msg sent\t", postedTime.getTime(), Date.now());
					logMsg = l;
				}).catch((err) => {
					console.error(`[${dateToTime(postedTime)}]: Error: Could not send a message in the logs channel. Err: ${err}`);
				});
				const writeFile = new Promise((res) => {
					if (ops.saveLocalCopy){
						saveFile(image).then(() => {
							if (ops.performanceMode) performanceLogger("Written to disk\t", postedTime.getTime(), Date.now());
							res();
						}).catch((err) => {
							console.error(`[${dateToTime(postedTime)}]: Error: ${err}`);
						});
					} else res();
				});
				writeFile.then(() => {
					if (ops.performanceMode) performanceLogger("Crop start\t", postedTime.getTime(), Date.now());
					crop(message).then((imgBuff) => {
						if (ops.performanceMode) performanceLogger("Crop finished\t", postedTime.getTime(), Date.now());
						const logAdd = new Promise((res) => {
							if (wasDelayed == true){
								const delayAmount = Math.round((currentTime - postedTime) / 1000);
								logString = logString + `. It was delayed for ${delayAmount}s. There ${(currentlyImage - 1 == 1) ? "is" : "are"} ${currentlyImage - 1} more image${(currentlyImage - 1 == 1) ? "" : "s"} to process`;
								res();
							} else res();
						});
						const testSend = new Promise(function(res) {
							if (ops.testMode){
								const imgAttach = new Discord.MessageAttachment(imgBuff, image.url);
								channel.send("Test mode. This is the image fed to the OCR system:", imgAttach).then(() => {
									if (ops.performanceMode) performanceLogger("Test msg posted\t", postedTime.getTime(), Date.now());
									res();
								});
							} else {
								res();
							}
						});
						const saveCropped = new Promise(function(res) {
							if (ops.saveLocalCopy) {
								saveFile([image, imgBuff]).then(() => {
									if (ops.performanceMode) performanceLogger("Cropped written\t", postedTime.getTime(), Date.now());
									res();
								}).catch((err) => {
									console.error(`[${dateToTime(postedTime)}]: ${err}`);
								});
							} else {
								res();
							}
						});
						Promise.all([testSend, saveCropped, logAdd]).then(() => {
							if (ops.performanceMode) performanceLogger("Recog starting\t", postedTime.getTime(), Date.now());
							if (!message.deleted) message.react("👀").catch(() => {
								console.error(`[${dateToTime(postedTime)}]: Error: Could not react 👀 (eyes) to message: ${message.url}\nContent of mesage: "${message.content}"`);
							});
							const worker = createWorker({
								// logger: m => console.log(m)
							});
							(async () => {
								await worker.load();
								// console.log(`Recognising: i#${instance}. iLC: ${imageLogCount}.`); //testo??
								await worker.loadLanguage("eng");
								await worker.initialize("eng");
								await worker.setParameters({
									tessedit_pageseg_mode: PSM.AUTO,
								});
								const { data: { text } } = await worker.recognize(imgBuff);
								await worker.terminate();
								// console.log("Image recognised. Result:" + text);
								let failed = false;
								let level = 0;
								try {
									level = text.match(/(\d\d)/)[0];
								} catch (err){
									failed = true;
									level = "Failure";
								}
								if (ops.testMode){
									message.lineReplyNoMention(`Test mode. This image ${(failed) ? "failed." : `was scanned at level: ${level}.`} `).catch(() => {
										message.channel.send(`Test mode. This image ${(failed) ? "failed." : `was scanned at level: ${level}.`} `);
									});
								}
								if (failed || level > 50 || level < 1){
									logs.send(`User: ${message.author}\nResult: Failed\nScanned text: \`${text}\``, image);
									logMsg.delete().catch(() => {
										console.error(`[${dateToTime(postedTime)}]: Error: Could not delete log message: ${logMsg.url}\nContent of mesage: "${logMsg.content}"`);
									});
									message.lineReply(`<@&${ops.modRole}> There was an issue scanning this image.`).catch(() => {
										console.error(`[${dateToTime(postedTime)}]: Error: Could not reply to message: ${message.url}\nContent of mesage: "${message.content}"`);
										message.channel.send(`<@&${ops.modRole}> There was an issue scanning this image.`);
									});
									message.react("❌").catch(() => {
										console.error(`[${dateToTime(postedTime)}]: Error: Could not react ❌ (red_cross) to message: ${message.url}\nContent of mesage: "${message.content}"`);
									}); // dave, dm when image fails to scan
									message.author.send(`Sorry, ${message.author}, but there was an issue scanning your profile screenshot.
				Make sure you follow the example at the top of <#${ops.screenshotChannel}>.
				If part of your buddy is close to the level number, try rotating it out of the way.
				If there was a different cause, a moderator will be able to help manually approve you.`).catch(() => {
										console.error(`[${dateToTime(postedTime)}]: Error: Could not send DM to ${message.author.username}${message.author}`);
									});
									console.log(logString + `. I failed to find a number. Scanned text: ${text}.`);
									imageLogCount++;
									currentlyImage--;
									saveStats("Failure");
									return;
								} else { // this is the handler for role adding. It looks messy but is fine
									if (ops.performanceMode) performanceLogger("Recog finished\t", postedTime.getTime(), Date.now());
									client.commands.get("confirm").execute([message, postedTime], [message.author.id, level]).then((addToLogString) => {
										if (ops.performanceMode) performanceLogger("Roles confirmed. Total time:", postedTime.getTime(), Date.now());
										console.log(logString + addToLogString);
										logMsg.delete().catch(() => {
											console.error(`[${dateToTime(postedTime)}]: Error: Could not delete log message: ${logMsg.url}\nContent of mesage: "${logMsg.content}"`);
										});
									});
									imageLogCount++;
									currentlyImage--;
									if (imageLogCount > 0 && imageLogCount % 30 === 0) loadBlacklist();
									if (ops.deleteScreens && !message.deleted) message.delete().catch(() => {
										console.error(`[${dateToTime(postedTime)}]: Error: Could not delete message: ${message.url}\nContent of mesage: "${message.content}"`);
									});
									// for (const key in global) // testo
									// 	if (!(key == "global" || key == "clearInterval" || key == "clearTimeout" || key == "setInterval" || key == "setTimeout" || key == "queueMicrotask" || key == "clearImmediate" || key == "setImmediate" || key == "regeneratorRuntime"))
									// 		console.log("   ", key);
								}
							})();
						});
					}).catch((err) => {
						if (err == "crash"){
							console.error(`[${dateToTime(postedTime)}]: Error: An error occured while buffering "imgTwo".`);
							console.error(`[${dateToTime(postedTime)}]: Some info for soul:`);
							console.error("\nimage: ");
							console.error(image);
							logs.send(`User: ${message.author}\nThis image was posted during a crash...`, image);
							logMsg.delete().catch(() => {
								console.error(`[${dateToTime(postedTime)}]: Error: Could not delete log message: ${logMsg.url}\nContent of mesage: "${logMsg.content}"`);
							});
							return;
						} else {
							console.error(`[${dateToTime(postedTime)}]: Error occured while cropping image: ${err}`);
						}
					});
				});
			} catch (error){ // this catch block rarely fires
				logString = logString + `, but an uncaught error occured. Error: ${error}`;
				console.log(logString);
				message.react("❌").catch(() => {
					console.error(`[${dateToTime(postedTime)}]: Error: Could not react ❌ (red_cross) to message: ${message.url}\nContent of mesage: "${message.content}"`);
				});
				message.lineReply(`<@&${ops.modRole}> I can not scan this image due to an uncaught error. Err: ${error}`);
				imageLogCount++;
				currentlyImage--;
				return;
			}
		});
	} else {
		handleCommand(message, postedTime);
	}
});

process.on("uncaughtException", (err) => {
	if (currentlyImage > 0){
		imageLogCount++;
		currentlyImage--;
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

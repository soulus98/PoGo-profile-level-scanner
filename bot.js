const { createWorker, PSM } = require("tesseract.js");
const { token } = require("./server/keys.json");
const fs = require("fs");
const https = require("https");
const Discord = require("discord.js");
const { crop } = require("./func/crop.js");
const { saveBuff } = require("./func/saveBuff.js");
const { handleCommand } = require("./handlers/commands.js");
const { dateToTime } = require("./func/dateToTime.js");
const { saveStats, loadStats } = require("./func/stats.js");
const { saveBlacklist } = require("./func/saveBlacklist.js");
const ver = require("./package.json").version;
require("discord-reply");

const client = new Discord.Client();
const cooldowns = new Discord.Collection();
let blacklist = new Discord.Collection();
let lastImageTimestamp = Date.now(),
		imageAttempts = 0,
		imageLogCount = 0,
		launchDate = new Date(),
		loaded = false,
		currentlyImage = 0,
		config = {};
let screensFolder = `./screens/Auto/${launchDate.toDateString()}`;
ops = {};
module.exports = { loadConfigs, clearBlacklist, cooldowns, blacklist, screensFolder};

// Loads all the variables at program launch
async function load(){
	console.log("======================================================================================");
	console.log("Server starting...");
		await loadConfigs();
		checkDateFolder(launchDate);
		loadCommands();
		loadBlacklist();
		loadStats().then((s) => {
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
		channel = client.channels.cache.get(ops.screenshotChannel);
		logs = client.channels.cache.get(ops.logsChannel);
		profile = client.channels.cache.get(ops.profileChannel);
		let server = client.guilds.cache.get(ops.serverID);
		if (!loaded){
			console.log("\nLoading configs...");
			console.log("\nConfigs:", config);
			loaded = true;
		} else { // This saves some console spam when reloading
			console.log("\nReloaded configs\n");
		}
		resolve();
	});
}

// Checks whether the date folder exists for the images to be saved to and creates it if not.
function checkDateFolder(checkDate){
	if (ops.saveLocalCopy) {
		let newFolder = `./screens/Auto/${checkDate.toDateString()}`;
		console.log(`\nChecking for ${newFolder}...`);
		fs.access(newFolder, (err) => {
			if (err){
				fs.mkdir("./screens", { recursive: true }, (err) => {
					if (err) console.error(err);
					else {
						console.log("Created/checked Folder: \"screens\"");
						fs.mkdir("./screens/Auto", { recursive: true }, (err) => {
							if (err) console.error(err);
							else {
								console.log("Created/checked Folder: \"Auto\"");
								fs.mkdir(newFolder, { recursive: true }, (err) => {
									if (err) console.error(err);
									else {
										console.log(`Created/checked Folder: ${checkDate.toDateString()}.\n`);
									}
								});
							}
						});
					}
				});
			} else {
				console.log(`Folder: ${checkDate.toDateString()} already existed.\n`);
			}
		});
	}
}

// Loads the command files. This was standard in the discord.js guide
function loadCommands(){
	client.commands = new Discord.Collection();
	const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
	let commandFilesNames = "\nThe currently loaded commands and cooldowns are: \n";
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
}

// Loads the blacklist from file
function loadBlacklist(){
	blacklist = new Discord.Collection();
	try {
		delete require.cache[require.resolve("./server/blacklist.json")];
	} catch (e){
		if (e.code == "MODULE_NOT_FOUND") {
			// do nothing
		} else {
			console.error(`[${dateToTime(new Date())}]: Error thrown when loading blacklist. Error: ${e}`);
		}
	} finally {
		let blackJson = "";
		try {
			blackJson = require("./server/blacklist.json");
		} catch (e) {
			if (e.code == "MODULE_NOT_FOUND") {
				fs.writeFile("./server/blacklist.json", "[]", () => {
					console.log("Could not find blacklist.json. Making a new one...");
					blackJson = require("./server/blacklist.json");
				});
			}	else {
				console.error(`[${dateToTime(new Date())}]: Error thrown when loading blacklist (2). Error: ${e}`);
			}
		} finally {
			setTimeout(() => {
				if (!blackJson[0]) return console.log("Blacklist loaded (empty).");
				let x = 0;
				for (const item of blackJson){
					if (lastImageTimestamp - item[1] > ops.blacklistTime){
						x = x + 1;
					} else {
						blacklist.set(item[0], item[1]);
					}
				}
				if (x){
					console.log(`Blacklist loaded, and removed ${x} users from it due to time expiration.`);
					saveBlacklist();
				} else {
					const y = blacklist.size;
					console.log(`Blacklist loaded from file. It contains ${y} user${(y==1)?"":"s"}`);
				}
			},500);
		}
	}
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
	channel = await client.channels.cache.get(ops.screenshotChannel);
	logs = await client.channels.cache.get(ops.logsChannel);
	profile = await client.channels.cache.get(ops.profileChannel);
	server = await client.guilds.cache.get(ops.serverID);
	const dev = await client.users.fetch("146186496448135168", false, true);
	checkServer();
	client.user.setActivity(`${ver}`);
	if (server == undefined){
		console.log("\nOops the screenshot server is broken.");
		return;
	};
	if (channel == undefined){
		console.log("\nOops the screenshot channel is broken.");
		return;
	};
	if (logs == undefined){
		console.log("\nOops the logs channel is broken.");
		return;
	};
	if (profile == undefined){
		console.log("\nOops the profile setup channel is broken.");
		return;
	};
	setTimeout(() => {
		console.log("\nTesto. These are the global variables we need to cut down on:");
		for (const key in global)
			if (!(key == "global" || key == "clearInterval" || key == "clearTimeout" || key == "setInterval" || key == "setTimeout" || key == "queueMicrotask" || key == "clearImmediate" || key == "setImmediate" || key == "regeneratorRuntime"))
				console.log("   ", key);
		channel.send("The bot has awoken, Hello :wave:").then(msg => {
			if (ops.msgDeleteTime && !msg.deleted){
				setTimeout(() => {
					msg.delete().catch(()=>{
						console.error(`[${dateToTime(new Date())}]: Error: Could not delete message: ${msg.url}\nContent of mesage: "${msg.content}"`);
					});
				},ops.msgDeleteTime);
			}
		});
		channel.messages.fetch({limit:20}).then(msgs => {
			let closeMsg = msgs.find(msg => msg.content == "The bot is sleeping now. Goodbye :wave:" || msg.content == "Restarting..." || msg.content == "The bot has awoken, Hello :wave:");
			if (closeMsg) closeMsg.delete().catch(()=>{
				console.error(`[${dateToTime(new Date())}]: Error: Could not delete message: ${closeMsg.url}\nContent of mesage: "${closeMsg.content}"`);
			});
		});
		dev.send(`**Dev message: **Loaded in guild: "${server.name}"#${server.id} in channel <#${channel.id}>#${channel.id}`);
		console.log(`\nServer started at: ${launchDate.toLocaleString()}. Loaded in guild: "${server.name}"#${server.id} in channel: "${channel.name}"#${channel.id}`);
		console.log("======================================================================================");
	}, ops.timeDelay);
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
		saveBlacklist();
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
	if(message.channel == profile) {
		return;
	}
	if (message.author.bot) return; // Bot? Cancel
	const postedTime = new Date();
	if (message.channel.type === "dm") { // This section may be mail code, one day
		console.log(`[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} sent a message in a dm for some reason.${(message.attachments.size > 0)?"\nMessage contained a file":""}${(message.content)?`\nMessage content: ${message.content}`:""}`);
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
	var wasDelayed = false;
	currentTime = Date.now();
	if (ops.saveLocalCopy && screensFolder != `./screens/Auto/${postedTime.toDateString()}`) {
		screensFolder = `./screens/Auto/${(postedTime+86400000).toDateString()}`;
		checkDateFolder(postedTime);
	}
	//image handler
	if (message.attachments.size > 0) { //checks for an attachment TODO: Check that the attachment is actually an image... how...? idk lol
		if (channel == undefined){
			message.channel.send(`The screenshot channel could not be found. Please set it correctly using \`${ops.prefix}set screenshotChannel <id>\``);
		};
		if (message.channel == logs) {
			return;
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
		const acceptedFileTypes = ["png","jpg","jpeg","jfif","tiff","bmp"];
		if(image.height < 50 || image.width < 50 || fileType.length > 6){
			console.error(`[${dateToTime(postedTime)}]: Error: Empty/Tiny image file`);
			message.lineReply(`I cannot scan tiny or blank images.\nIf you think this is in error, please tell a moderator.`);
			logs.send(`User: ${message.author}\nEmpty/Tiny image file. Not scanned.\n`,image);
			saveStats("wrong");
			return;
		}
		if(!acceptedFileTypes.includes(fileType)){
			console.error(`[${dateToTime(postedTime)}]: Error: Invalid file type: ${fileType}`);
			message.lineReply(`I cannot scan this filetype: \`.${fileType}\`.\nIf you think this is in error, please tell a moderator.`);
			logs.send(`User: ${message.author}\nFile is not an image. Not scanned.\n`,image);
			saveStats("wrong");
			return;
		}
		if (message.member == null){
			console.error(`[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} sent an image, but could not be processed, since they left the server.`);
			logs.send(`User: ${message.author}\nLeft the server. Not scanned.\n`,image);
			saveStats("left");
			return;
		}
		if (message.member.roles.cache.has(ops.blacklistRole) && ops.blacklistRole){
			message.lineReplyNoMention(`<@&${ops.modRole}> This message was not scanned due to the manual blacklist.`).catch(()=>{
				console.error(`[${dateToTime(postedTime)}]: Error: I can not send a message in ${message.channel.name}${message.channel}`);
			});
			logs.send(`User: ${message.author}\nNot scanned due to manual blacklist:\n<@&${ops.blacklistRole}>`,image);
			console.error(`[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} sent an image, but it was declined, due to the auto blacklist`);
			saveStats("black");
			return;
		}
		if (message.member.roles.cache.has(ops.level50Role) && message.member.roles.cache.has(ops.level40Role) && message.member.roles.cache.has(ops.level30Role)){
			message.author.send("You already have all available roles.").catch(() => {
				console.error(`[${dateToTime(postedTime)}]: Error: Could not send DM to ${message.author.username}${message.author}`);
			});
			logs.send(`User: ${message.author}\nRoles: All 3 already possessed`,image);
			console.log(`[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} sent an image, but already possessed all 3 roles.`);
			if (ops.deleteScreens && !message.deleted) message.delete().catch(()=>{
				console.error(`[${dateToTime(postedTime)}]: Error: Could not delete message: ${message.url}\nContent of mesage: "${message.content}"`);
			});
			saveStats("all");
			return;
		}
		if (ops.blacklistTime>0){ // The blacklist is intended to prevent people from instantly bypassing the bot when their first screenshot fails
			if (blacklist.has(message.author.id)){
				if (currentTime-blacklist.get(message.author.id)<ops.blacklistTime){
					saveStats("black"); //dave, dm when a member is blacklisted
					message.author.send(`Hey, ${message.author}.
We are sorry, but you are currently prohibited from using the automated system due to a recent screenshot that was scanned under level 30.
If you have surpassed level 30, tag @moderator or message <@575252669443211264> to ask to be let in manually.
Otherwise, keep leveling up, and post your screenshot when you have reached that point.
Hope to raid with you soon! :wave:`).catch(() => {
						console.error(`[${dateToTime(postedTime)}]: Error: Could not send DM to ${message.author.username}${message.author}`);
					});
					logs.send(`User: ${message.author}\nNot scanned due to automatic blacklist. \nTime left: ${((ops.blacklistTime-(currentTime-blacklist.get(message.author.id)))/3600000).toFixed(1)} hours`,image);
					if (ops.deleteScreens && !message.deleted) message.delete().catch(()=>{
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
		imageAttempts++;															// This checks whether a new image can be processed every second
		currentlyImage++;															// It checks the current instance against the total amount of images completed so far
		const instance = imageAttempts;									// That way, only the next image in row can be processed
		if (imageLogCount + 1 == instance){							// It is probably the most janky part of the bot
			imageWrite();																// If the instance and the imageLogCount fall out of sync somehow, It breaks
		} else {																			// an error should be handled properly (as uncaughtException iterates imageLogCount)
			wasDelayed = true;													// but would break if for example, 2 errors are caused by the same image
			const intervalID = setInterval(function() {
				if(imageLogCount+1 == instance){					// a better queue system might involve adding the image to a collection. not sure how I would do that
					currentTime = Date.now();								// anyway, this definitely caused half of my issues when developing
					setTimeout(imageWrite,ops.timeDelay*(1/5));	// hopefully it is bodged well enough to be stable
					clearInterval(intervalID);
				}
			}, ops.timeDelay);
		}
		async function imageWrite(){ // this is just the next step in processing. I should make the write stream - and most of these functions - different modules
			lastImageTimestamp = Date.now(); //Setting lastImageTimestamp for the next time it runs
			logString = `[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} sent image#${instance}`;
			try{
				const logimg = await logs.send(`User: ${message.author}`, image);
				if(ops.saveLocalCopy){ 															// this seems to be the cause of the unknown error
					const imageName = image.id + "." + fileType;	// if saveLocalCopy is off, the error is very rare
					const imageDL = fs.createWriteStream(screensFolder + "/" + imageName); // it must be tesseract not being able to deal
					const request = https.get(image.url, function(response) {							 // with muliple things happening at once
						response.pipe(imageDL);
					});
				}
				crop(message).then((imgBuff)=>{
					const testSend = new Promise(function(res) {
						if (ops.testMode){
							const imgAttach = new Discord.MessageAttachment(imgBuff, image.url);
							channel.send("Test mode. This is the image fed to the OCR system:", imgAttach).then(() => {
								res();
							});
						} else {
							res();
						}
					});
					const saveCropped = new Promise(function(res) {
						if (ops.saveLocalCopy) {
							saveBuff(image, imgBuff).then(() => {
								res();
							}).catch((err) => {
								console.error(`[${dateToTime(postedTime)}]: ${err}`);
							});
						} else {
							res();
						};
					});
					Promise.all([testSend,saveCropped]).then(() => {
						recog(imgBuff, image, logimg);
					});
				}).catch((err)=>{
					if (err == "crash"){
						console.error(`[${dateToTime(postedTime)}]: Error: An error occured while buffering "imgTwo".`);
						console.error(`[${dateToTime(postedTime)}]: Some info for soul:`);
						console.error("\nimage: ");
						console.error(image);
						logimg.edit(`User: ${message.author}\nThis image was posted during a crash...`,image);
						return;
					} else {
						console.error(`[${dateToTime(postedTime)}]: Error occured while cropping image: ${err}`);
					}
				});
				if (wasDelayed == true){
					delayAmount = Math.round((currentTime - postedTime)/1000);
					logString = logString + `. It was delayed for ${delayAmount}s. There ${(currentlyImage-1 == 1)?"is":"are"} ${currentlyImage-1} more image${(currentlyImage-1 ==1)?"":"s"} to process`;
				}
			}catch (error){ // this catch block rarely fires, as there are tonnes more catch cases under crop();
				logString = logString + `, but an uncaught error occured. Error: ${error}`;
				console.log(logString);
				message.react("❌").catch(()=>{
					console.error(`[${dateToTime(postedTime)}]: Error: Could not react ❌ (red_cross) to message: ${message.url}\nContent of mesage: "${message.content}"`);
				});
				message.lineReply(`<@&${ops.modRole}> I can not scan this image due to an uncaught error. Err: ${error}`);
				imageLogCount++;
				currentlyImage--;
				return;
			}
		}
		async function recog(imgBuff, image, logimg){
			if (!message.deleted) message.react("👀").catch(()=>{
				console.error(`[${dateToTime(postedTime)}]: Error: Could not react 👀 (eyes) to message: ${message.url}\nContent of mesage: "${message.content}"`);
			});
			const worker = createWorker({
				//logger: m => console.log(m)
			});
			(async () => {
				await worker.load();
				//console.log(`Recognising: i#${instance}. iLC: ${imageLogCount}.`); //testo??
				await worker.loadLanguage("eng");
				await worker.initialize("eng");
				await worker.setParameters({
					tessedit_pageseg_mode: PSM.AUTO,
				});
				const { data: { text } } = await worker.recognize(imgBuff);
				await worker.terminate();
				//console.log("Image recognised. Result:" + text);
				let failed = false;
				try{
					level = text.match(/(\d\d)/)[0];
				} catch (err){
					failed = true;
					level = "Failure";
				}
				if (ops.testMode){
					message.lineReplyNoMention(`Test mode. This image ${(failed) ? "failed." : `was scanned at level: ${level}.`} `).catch(()=>{
						message.channel.send(`Test mode. This image ${(failed) ? "failed." : `was scanned at level: ${level}.`} `);
					});
				}
				if (isNaN(level) || level >50 || level <1){
					logimg.edit(`User: ${message.author}\nResult: Failed\nScanned text: \`${text}\``,image);
					message.lineReply(`<@&${ops.modRole}> There was an issue scanning this image.`);
					message.react("❌").catch(()=>{
						console.error(`[${dateToTime(postedTime)}]: Error: Could not react ❌ (red_cross) to message: ${message.url}\nContent of mesage: "${message.content}"`);
					}); //dave, dm when image fails to scan
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
					client.commands.get("confirm").execute([message,logimg], [message.author.id,level]).then((addToLogString)=>{
						console.log(logString + addToLogString);
					});
					imageLogCount++;
					currentlyImage--;
					if (imageLogCount>0 && imageLogCount % 30 === 0) loadBlacklist();
					if (ops.deleteScreens && !message.deleted) message.delete().catch(()=>{
						console.error(`[${dateToTime(postedTime)}]: Error: Could not delete message: ${message.url}\nContent of mesage: "${message.content}"`);
					});
				}
			})();
		}
	}
	else {
		handleCommand(message,postedTime);
	}
});

process.on("uncaughtException", (err) => {
	if (currentlyImage > 0){
		imageLogCount++;
		currentlyImage--;
	}
	 if (err != null) {
		 if (err.message.substr(0,35) == "Error: UNKNOWN: unknown error, open"){
			 console.error(`[${dateToTime(new Date())}]: Error: Known imageWrite crash. Consider turning off saveLocalCopy. This error should be handled correctly.`);
			 const errorMessage = channel.send(`An internal error occured. Please retry sending the screenshot(s) that failed.`);
			 errorMessage.then((errorMessage)=>{setTimeout(()=>{
				 if (errorMessage && ops.msgDeleteTime>0){
					 errorMessage.delete().catch(()=>{
						 console.error(`[${dateToTime(new Date())}]: Error: Could not delete message: ${errorMessage.url}\nContent of mesage: "${errorMessage.content}"`);
					 });
				 }
			 },ops.msgDeleteTime);});
		 }
	 } else {
		 if (err != null) {
			 console.error(`Uncaught Exception: ${err}${err.stack}`);
			 channel.send(`<@&${ops.modRole}> An unexpected internal error occured. Please give the developer this information:\n${err}${err.stack}`);
		 } else {
			 console.error(err);
		 }
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

process.on("SIGINT", (signal) => {
  console.log(`Process ${process.pid} has been interrupted`);
	channel.send("The bot is sleeping now. Goodbye :wave:").then(() => {
		process.exit(1);
	});
});

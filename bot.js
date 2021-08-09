const { createWorker , PSM } = require("tesseract.js");
const gm = require("gm");
const {token} = require("./server/keys.json");
const fs = require("fs");
const https = require("https");
const Discord = require("discord.js");
const {rect} = require("./fun/rect.js");
const {handleCommand} = require("./handlers/commands.js");
const {dateToTime} = require("./fun/dateToTime.js");
require('discord-reply');
const ver = require('./package.json').version;

const client = new Discord.Client();
const cooldowns = new Discord.Collection();
blacklist = new Discord.Collection();
stats = new Discord.Collection();
lastImageTimestamp = Date.now();
imageAttempts = 0;
imageLogCount = 0;
launchDate = new Date();
loaded = false;
currentlyImage = 0;
screensFolder = `./screens/Auto/${launchDate.toDateString()}`;
config = {};
module.exports = {loadConfigs, clearBlacklist, cooldowns};

// Loads all the variables at program launch
function load(){
	console.log("======================================================================================");
	console.log(`Server starting...`);
		loadConfigs();
		checkDateFolder(launchDate);
		loadCommands();
		loadBlacklist();
		loadStats();
		client.login(token);
}

// Loads (or re-loads) the bot settings
function loadConfigs(){
	config = {};
	delete require.cache[require.resolve("./server/config.json")];
	config = require("./server/config.json");
	prefix = config.chars.prefix;
	timeDelay = config.numbers.timeDelay*1000;
	threshold = config.numbers.threshold;
	blacklistTime = config.numbers.blacklistTime*86400000;
	msgDeleteTime = config.numbers.msgDeleteTime*1000;
	saveLocalCopy = config.toggles.saveLocalCopy;
	deleteScreens = config.toggles.deleteScreens;
	welcomeMsg = config.toggles.welcomeMsg;
	testMode = config.toggles.testMode;
	screenshotChannel = config.ids.screenshotChannel;
	logsChannel = config.ids.logsChannel;
	profileChannel = config.ids.profileChannel;
	level30Role = config.ids.level30Role;
	level40Role = config.ids.level40Role;
	level50Role = config.ids.level50Role;
	modRole = config.ids.modRole;
	serverID = config.ids.serverID;
	blacklistRole = config.ids.blacklistRole;
	channel = client.channels.cache.get(screenshotChannel);
	logs = client.channels.cache.get(logsChannel);
	profile = client.channels.cache.get(profileChannel);
	server = client.guilds.cache.get(serverID);
	if (!loaded){
		console.log("\nLoading configs...");
		console.log("\nConfigs:",config);
		loaded = true;
	} else { // This saves some console spam when reloading
		console.log("\nReloaded configs\n");
	}
}

// Checks whether the date folder exists for the images to be saved to and creates it if not.
// This should probably not run if "saveLocalCopy" is off, but I'm too worried to change it.
function checkDateFolder(checkDate){
	setTimeout(function () {
		if (saveLocalCopy) {
			newFolder = `./screens/Auto/${checkDate.toDateString()}`
			console.log(`\nChecking for ${newFolder}...`);
			fs.access(newFolder, error => {
				if (!error) {
					console.log(`Folder ${checkDate.toDateString()} already existed.\n`);
				} else {
					fs.mkdirSync(newFolder);
					console.log(`Folder ${checkDate.toDateString()} created.\n`);
				}
			});
		}
	}, 350);
}

// Loads the command files. This was standard in the discord.js guide
function loadCommands(){
	client.commands = new Discord.Collection();
	const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
	commandFilesNames = "\nThe currently loaded commands and cooldowns are: \n";
	for (const file of commandFiles) {		//Loads commands
		const command = require(`./commands/${file}`);
		commandFilesNames = commandFilesNames + prefix + command.name;
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
			//do nothing
		} else {
			console.error(`[${dateToTime(new Date())}]: Error thrown when loading blacklist. Error: ${e}`);
		}
	} finally {
		var blackJson = "";
		try {
			blackJson = require("./server/blacklist.json");
		} catch (e) {
			if (e.code == "MODULE_NOT_FOUND") {
				fs.writeFile("./server/blacklist.json","[]",()=>{
					console.log("Could not find blacklist.json. Making a new one...");
					blackJson = require("./server/blacklist.json");
				});
			}	else {
				console.error(`[${dateToTime(new Date())}]: Error thrown when loading blacklist (2). Error: ${e}`);
			}
		} finally {
			setTimeout(()=>{
				if (!blackJson[0]) return console.log(`Blacklist loaded (empty).`);
				let x = 0;
				for (item of blackJson){
					if (lastImageTimestamp-item[1]>blacklistTime){
						x = x+1;
					} else {
						blacklist.set(item[0],item[1]);
					}
				}
				if (x){
					console.log(`Blacklist loaded, and removed ${x} users from it due to time expiration.`);
					saveBlacklist();
				} else {
					let y = blacklist.size;
					console.log(`Blacklist loaded from file. It contains ${y} user${(y==1)?"":"s"}`);
				}
			},500);
		}
	}
}

// Loads the stats from file
function loadStats() {
	stats = new Discord.Collection();
	try {
		delete require.cache[require.resolve("./server/stats.json")];
	} catch (e){
		if (e.code == "MODULE_NOT_FOUND") {
			//do nothing
		} else {
			console.error(`[${dateToTime(new Date())}]: Error thrown when loading stats. Error: ${e}`);
		}
	} finally {
		var statsJson = "";
		try {
			statsJson = require("./server/stats.json");
		} catch (e) {
			if (e.code == "MODULE_NOT_FOUND") {
				fs.writeFile("./server/stats.json","[[\"Attempts\",0],[\"Declined-Blacklist\",0],[\"Declined-Left-Server\",0],[\"Declined-All-Roles\",0],[\"Declined-Wrong-Type\",0],[\"Fails\",0],[\"Under-30\",0],[30,0],[31,0],[32,0],[33,0],[34,0],[35,0],[36,0],[37,0],[38,0],[39,0],[40,0],[41,0],[42,0],[43,0],[44,0],[45,0],[46,0],[47,0],[48,0],[49,0],[50,0]]",()=>{
					console.log("Could not find stats.json. Making a new one...");
					statsJson = require("./server/stats.json");
				});
			}	else {
				console.error(`[${dateToTime(new Date())}]: Error thrown when loading stats (2). Error: ${e}`);
			}
		} finally {
			setTimeout(()=>{
				for (item of statsJson){
					stats.set(item[0],item[1]);
				}
				console.log("Stats loaded");
			},750);
		}
	}
}

// Checks all the bot guilds and leaves them if they aren't the intended server
// If it is called from the main event, it sends a reply message
// This is vital, else someone could change the settings by simply inviting the bot to their server and being admin
// TODO: Make different settings for different servers. It is not necessary, but would be good practice
function checkServer(message){
	// 216412752120381441
	if (serverID === undefined) return;
	if (message){
		message.lineReply("This is not the intended server. Goodbye forever :wave:").then(()=>{
			message.guild.leave().then(s => {
				console.log(`Left: ${s}#${s.id}, as it is not the intended server.`);
				dev.send(`**Dev message: **Left: ${s}#${s.id}`);
			}).catch(console.error);
		}).catch(console.error);
		return;
	}
	activeServers = client.guilds.cache;
	activeServers.each(serv => {
		if(serv.id != serverID){
			serv.leave().then(s => {
				console.log(`Left: ${s}, as it is not the intended server.`);
				dev.send(`**Dev message: **Left: ${s}#${s.id}`).catch(console.error);
			}).catch(console.error);
		}
	});
}

load();

client.once("ready", async () => {
	channel = await client.channels.cache.get(screenshotChannel);
	logs = await client.channels.cache.get(logsChannel);
	profile = await client.channels.cache.get(profileChannel);
	server = await client.guilds.cache.get(serverID);
	dev = await client.users.fetch("146186496448135168",false,true);
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
		channel.send("The bot has awoken, Hello :wave:").then(msg => {
			if (msgDeleteTime && !msg.deleted){
				setTimeout(() => {
					msg.delete().catch(()=>{
						console.error(`[${dateToTime(new Date())}]: Error: Could not delete message: ${msg.url}\nContent of mesage: "${msg.content}"`);
					});
				},msgDeleteTime);
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
	},timeDelay);
});


client.on("guildMemberAdd", member => {
	//console.log(`[${dateToTime(new Date())}]: New member ${member.user.username}${member} joined the server.`);
  if (!welcomeMsg) return;
  member.send(`Hey ${member}, welcome to Pokémon GO Raids!

In order to gain access to our server we kindly ask you to post a screenshot of your trainer page that shows your trainer level.

Please post your screenshot in: <#740670778516963339>

You’ll then be given the required roles.

Then type \`$verify\` in <#740262255584739391> and follow the instructions, please.

Good luck, trainer!

We will only grant access to our server to trainers level 30 and up!
If you are under 30, you will be direct messaged with a link to our sister server, with no level requirement.`).catch(()=>{
		console.error(`[${dateToTime(new Date())}]: Error: Could not send welcomeMsg DM to ${member.user.username}${member}`);
	});
});


// Saves the under-30 blacklist to file
function saveBlacklist() {
	fs.writeFile("./server/blacklist.json",JSON.stringify(Array.from(blacklist)),()=>{
		let x = blacklist.size;
		console.log(`[${dateToTime(new Date())}]: Updated blacklist. There ${(x!=1)?"are":"is"} now ${x} user${(x!=1)?"s":""} blacklisted.`); //testo
	});
}

// Called from clear-blacklist.js to clear the blacklist when requested
function clearBlacklist(message, idToDelete){
	if (idToDelete){
		blacklist.delete(idToDelete[0]);
		message.lineReplyNoMention(`Removed <@${idToDelete[0]}>${idToDelete[0]} from the blacklist.`);
		console.log(`[${dateToTime(new Date())}]: Deleted ${idToDelete[0]} from the blacklist.`);
		saveBlacklist();
	} else {
		fs.writeFile("./server/blacklist.json","[]",(err)=>{
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

// Turns a date object into a readable time format


// Saves the stats to file
function saveStats(level) {
	if(isNaN(level) || level >50 || level <1){
		if(level == "Failure" || level >50 || level <1){
			stats.set("Attempts",stats.get("Attempts")+1);
			stats.set("Fails",stats.get("Fails")+1);
		} else if (level == "black") {
			stats.set("Attempts",stats.get("Attempts")+1);
			stats.set("Declined-Blacklist",stats.get("Declined-Blacklist")+1);
		} else if (level == "all") {
			stats.set("Attempts",stats.get("Attempts")+1);
			stats.set("Declined-All-Roles",stats.get("Declined-All-Roles")+1);
		} else if (level == "left") {
			stats.set("Attempts",stats.get("Attempts")+1);
			stats.set("Declined-Left-Server",stats.get("Declined-Left-Server")+1);
		} else if (level == "wrong") {
			stats.set("Attempts",stats.get("Attempts")+1);
			stats.set("Declined-Wrong-Type",stats.get("Declined-Wrong-Type")+1||1);
		} else {
			console.error(`[${dateToTime(new Date())}]: Error while saving the stats. Literally impossible to get to this, so if we have, something weird has happened.`);
		}
	} else if (level < 30) {
		stats.set("Attempts",stats.get("Attempts")+1);
		stats.set("Under-30",stats.get("Under-30")+1);
	} else {
		stats.set("Attempts",stats.get("Attempts")+1);
		stats.set(parseFloat(level),stats.get(parseFloat(level))+1);
	}
	fs.writeFile("./server/stats.json",JSON.stringify(Array.from(stats)),(err)=>{
		if (err){
			console.error(`[${dateToTime(new Date())}]: Error: An error occured while saving the blacklist. Err:${err}`);
			return;
		}
	});
}

client.on("message", message => {
	if(message.channel == profile) {
		return;
	}
	if (message.author.bot) return; // Bot? Cancel
	if (message.channel.type !== "dm" && message.guild.id != serverID && serverID){ // If we are in the wrong server
		checkServer(message); // It passes message so that it can respond to the message that triggered it
		return;
	}
	var wasDelayed = false;
	const postedTime = new Date();
	currentTime = Date.now();
	if (saveLocalCopy && screensFolder != `./screens/Auto/${postedTime.toDateString()}`) {
		screensFolder = `./screens/Auto/${postedTime.toDateString()}`;
		checkDateFolder(postedTime);
	}
	//image handler
	if (message.attachments.size > 0) { //checks for an attachment TODO: Check that the attachment is actually an image... how...? idk lol
		if (channel == undefined){
			message.channel.send(`The screenshot channel could not be found. Please set it correctly using \`${prefix}set screenshotChannel <id>\``);
		};
		if (message.channel == logs) {
			return;
		}
		if (message.channel.type === "dm") {
			message.lineReply(`I cannot scan an image in a dm. Please send it in ${channel}`);
			return;
		}
		if (message.channel != channel) {

// Some mail-ticket handling code should go here in the future

// This is no longer necessary, especially since other channels might be mail channels. Still should stress the importance of security
// 			console.log(`[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} sent an image, but it was not scanned, since the channel ${message.channel.name}${message.channel} is not the correct channel. My access to this channel should be removed.`);
// 			message.lineReply(`I cannot scan an image in this channel. Please send it in ${channel}.
// <@&${modRole}>, perhaps you should prohibit my access from this (and all other) channels except for ${channel}.`).catch(()=>{
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
		if (message.member.roles.cache.has(blacklistRole) && blacklistRole){
			message.lineReplyNoMention(`<@&${modRole}> This message was not scanned due to the manual blacklist.`).catch(()=>{
				console.error(`[${dateToTime(postedTime)}]: Error: I can not send a message in ${message.channel.name}${message.channel}`);
			});
			logs.send(`User: ${message.author}\nNot scanned due to manual blacklist:\n<@&${blacklistRole}>`,image);
			console.error(`[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} sent an image, but it was declined, due to the auto blacklist`);
			saveStats("black");
			return;
		}
		if (message.member.roles.cache.has(level50Role) && message.member.roles.cache.has(level40Role) && message.member.roles.cache.has(level30Role)){
			message.author.send("You already have all available roles.").catch(()=>{
				console.error(`[${dateToTime(postedTime)}]: Error: Could not send DM to ${message.author.username}${message.author}`);
			});
			logs.send(`User: ${message.author}\nRoles: All 3 already possessed`,image);
			console.log(`[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} sent an image, but already possessed all 3 roles.`);
			if (deleteScreens && !message.deleted) message.delete().catch(()=>{
				console.error(`[${dateToTime(postedTime)}]: Error: Could not delete message: ${message.url}\nContent of mesage: "${message.content}"`);
			});
			saveStats("all");
			return;
		}
		if (blacklistTime>0){ // The blacklist is intended to prevent people from instantly bypassing the bot when their first screenshot fails
			if (blacklist.has(message.author.id)){
				if (currentTime-blacklist.get(message.author.id)<blacklistTime){
					saveStats("black");
					message.author.send(`Hey, ${message.author}.
We are sorry, but you are currently prohibited from using the automated system due to a recent screenshot that was scanned under level 30.
If you have surpassed level 30, tag @moderator or message <@575252669443211264> to ask to be let in manually.
Otherwise, keep leveling up, and post your screenshot when you have reached that point.
Hope to raid with you soon! :wave:`).catch(() => {
						console.error(`[${dateToTime(postedTime)}]: Error: Could not send DM to ${message.author.username}${message.author}`);
					});
					logs.send(`User: ${message.author}\nNot scanned due to automatic blacklist. \nTime left: ${((blacklistTime-(currentTime-blacklist.get(message.author.id)))/3600000).toFixed(1)} hours`,image);
					if (deleteScreens && !message.deleted) message.delete().catch(()=>{
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
		var instance = imageAttempts;									// That way, only the next image in row can be processed
		if (imageLogCount+1 == instance){							// It is probably the most janky part of the bot
			imageWrite();																// If the instance and the imageLogCount fall out of sync somehow, It breaks
		} else {																			// an error should be handled properly (as uncaughtException iterates imageLogCount)
			wasDelayed = true;													// but would break if for example, 2 errors are caused by the same image
			const intervalID = setInterval(function () {
				if(imageLogCount+1 == instance){					// a better queue system might involve adding the image to a collection. not sure how I would do that
					currentTime = Date.now();								// anyway, this definitely caused half of my issues when developing
					setTimeout(imageWrite,timeDelay*(1/5));	// hopefully it is bodged well enough to be stable
					clearInterval(intervalID);
				}
			}, timeDelay);
		}
		async function imageWrite(){ // this is just the next step in processing. I should make the write stream - and most of these functions - different modules
			lastImageTimestamp = Date.now(); //Setting lastImageTimestamp for the next time it runs
			logString = `[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} sent image#${instance}`;
			try{
				const logimg = await logs.send(`User: ${message.author}`, image);
				if(saveLocalCopy){ 																				// this seems to be the cause of the unknown error
					const imageName = image.id + "." + fileType;	// if saveLocalCopy is off, the error is very rare
					const imageDL = fs.createWriteStream(screensFolder + "/" + imageName); // it must be tesseract not being able to deal
					const request = https.get(image.url, function(response) {							 // with muliple things happening at once
						response.pipe(imageDL);
					});
				}
				crop(image, logimg);
				if (wasDelayed == true){
					delayAmount = Math.round((currentTime - postedTime)/1000);
					console.log(logString + `, and it was delayed for ${delayAmount}s. There are ${currentlyImage} more images to process.`);
				} else { console.log(logString); }
			}catch (error){ // this catch block rarely fires, as there are tonnes more catch cases under crop();
				logString = logString + `, but an uncaught error occured. Error: ${error}`;
				console.log(logString);
				message.react("❌").catch(()=>{
					console.error(`[${dateToTime(postedTime)}]: Error: Could not react ❌ (red_cross) to message: ${message.url}\nContent of mesage: "${message.content}"`);
				});
				imageLogCount++;
				currentlyImage--;
				return;
			}
		}
		function crop(image, logimg){ // this is another badly named function which should be a seperate module // TODO: Make all these functions modules
			https.get(image.url, function(response){
				img = gm(response);
				img
				.size((err,size) => {
					if (err){ // this error has only ever fired once, not sure why
						console.error(`[${dateToTime(postedTime)}]: Error while sizing.`,image);
						return;
					}
					const cropSize = rect(size); 			// a module that returns a crop size case.
					cropper(image, logimg, cropSize);	//250 random images were supported so hopefuly that covers most common phone resolutions
				});
			});
			function cropper(image, logimg, cropSize) { // I don't know why, but I can't use img twice. I have to call https.get each time. annoying
				https.get(image.url, function(response){
					imgTwo = gm(response);
					imgTwo
					.blackThreshold(threshold)
					.whiteThreshold(threshold+1)
					.crop(cropSize.wid,cropSize.hei,cropSize.x,cropSize.y)
					.flatten()
					.toBuffer((err, imgBuff) => {
						if (err){
							console.error(`[${dateToTime(postedTime)}]: Error: An error occured while buffering "imgTwo".`);
							console.error(`[${dateToTime(postedTime)}]: Some info for soul:`);
							console.error("\nimage: ");
							console.error(image);
							console.error("imgBuff: ");
							console.error(imgBuff); 			//testo
							console.error("imgTwo: ");
							console.error(imgTwo); 			//testo
							logimg.edit(`User: ${message.author}\nThis image was posted during a crash...`,image);
							throw err;
							return;
						}
						if (testMode){
							const imgAttach = new Discord.MessageAttachment(imgBuff, image.url);
							message.channel.send("Test mode. This is the image fed to the OCR system:", imgAttach);
						}

						//This is for seeing the cropped version
						if (saveLocalCopy) {
							const imageName = image.id + "crop." + image.url.split(".").pop();
							fs.writeFile(`${screensFolder}/${imageName}`,imgBuff, (err) =>{
								if (err){
									console.error(`[${dateToTime(postedTime)}]: Error: An error occured while writing "imgTwo".`);
									throw err;
									return;
								}
								//console.log("Written"); //testo ??
							});
						}
						setTimeout(()=>{recog(imgBuff, image, logimg);},timeDelay*(4/5));
						//recog(imgBuff);
					});
				});
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
				console.log(`[${dateToTime(postedTime)}]: Image#${instance} ${(failed) ? `failed. Scanned text: ${text}` : `was scanned at level: ${level}.`}`);
				if (testMode){
					message.lineReplyNoMention(`Test mode. This image ${(failed) ? "failed." : `was scanned at level: ${level}.`} `).catch(()=>{
						message.channel.send(`Test mode. This image ${(failed) ? "failed." : `was scanned at level: ${level}.`} `);
					});
				}
				if (isNaN(level) || level >50 || level <1){
					logimg.edit(`User: ${message.author}\nResult: Failed\nScanned text: \`${text}\``,image);
					message.lineReplyNoMention(`<@&${modRole}> There was an issue scanning this image.`);
					message.react("❌").catch(()=>{
						console.error(`[${dateToTime(postedTime)}]: Error: Could not react ❌ (red_cross) to message: ${message.url}\nContent of mesage: "${message.content}"`);
					});
					message.author.send(`Sorry, ${message.author}, but there was an issue scanning your profile screenshot.
Make sure you follow the example at the top of <#740670778516963339>.
If part of your buddy is close to the level number, try rotating it out of the way.
If there was a different cause, a moderator will be able to help manually approve you.`).catch(() => {
						console.error(`[${dateToTime(postedTime)}]: Error: Could not send DM to ${message.author.username}${message.author}`);
					});
					imageLogCount++;
					currentlyImage--;
					saveStats(level);
					return;
				} else {
					roleGrant(level, image, logimg);
					imageLogCount++;
					currentlyImage--;
					//console.log(`Remaining images: ${currentlyImage}`);//testo
					if (deleteScreens && !message.deleted) message.delete().catch(()=>{
						console.error(`[${dateToTime(postedTime)}]: Error: Could not delete message: ${message.url}\nContent of mesage: "${message.content}"`);
					});
				}
			})();
		}
		function roleGrant(level, image, logimg){
			if (message.member == null){
				console.log(`[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} sent an image, but could not be scanned, since the member left the server.`);
				logimg.edit(`User: ${message.author}\nLeft the server. No roles added.`,image);
				saveStats("left");
				return;
			} else {
				const msgtxt = [];
				let given30 = false;
				let given40 = false;
				let given50 = false;
				try {
					if(message.member.roles.cache.has(level30Role)){
						msgtxt.push("You already have the Remote Raids role");
					}
					else if (level<30 && message.author){
						if (!deleteScreens && !message.deleted) message.react("👎").catch(()=>{
							console.error(`[${dateToTime(postedTime)}]: Error: Could not react 👎 (thumbsdown) to message: ${message.url}\nContent of mesage: "${message.content}"`);
						});
						message.author.send(`Hey ${message.author}!
Thank you so much for your interest in joining our raid server.
Unfortunately we have a level requirement of 30 to gain full access, and your screenshot was scanned at ${level}.
Gaining xp is very easy to do now with friendships, events, lucky eggs and so much more! Please stay and hang out with us here.
You can use <#733418314222534826> to connect with other trainers and get the xp you need to hit level 30!
Once you've reached that point, please repost your screenshot, or message <@575252669443211264> if you have to be let in manually.

In the meantime please join our sister server with this link.
Hope to raid with you soon! :slight_smile:
https://discord.gg/bTJxQNKJH2`).catch(() => {
							console.error(`[${dateToTime(postedTime)}]: Error: Could not send DM to ${message.author.username}${message.author}`);
						});
						blacklist.set(message.author.id,currentTime);
						saveBlacklist();
						console.log(`[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} was added to the blacklist`);
						logimg.edit(`User: ${message.author}\nResult: \`${level}\`\nBlacklisted for ${config.numbers.blacklistTime} day${(config.numbers.blacklistTime==1)?"":"s"}`,image);
						saveStats(level);
						return;
					}
					else if (level>29){
						channel.send(`Hey, ${message.author}. Welcome to the server. :partying_face:

 • Start by typing \`$verify\` in <#740262255584739391>. The bot will then ask for your Trainer Code, so have it ready.`).then(msg => {
							setTimeout(()=>{
								msg.delete().catch(()=>{
									console.error(`[${dateToTime(postedTime)}]: Error: Could not delete message: ${msg.url}\nContent of mesage: "${msg.content}"`);
								});
							},5000);
						});
						given30 = true;
						setTimeout(()=>{
							message.member.roles.add(message.guild.roles.cache.get(level30Role)).catch(console.error);
						},250);
						setTimeout(()=>{
							profile.send(`Hey, ${message.author}. Welcome to the server. :partying_face:

 • Start by typing \`$verify\` in this channel. The bot will then ask for your Trainer Code, so have it ready.

 • Extra commands such as \`$team <team-name>\` and \`$level 35\` are pinned and posted in this channel. Just ask if you can't find them.

 • Instructions for joining and hosting raids are over at <#733418554283655250>. Please also be familiar with the rules in <#747656566559473715>.

Feel free to ask any questions you have over in <#733706705560666275>.
Have fun raiding. :wave:`);
						}, 3000);
						if (!deleteScreens && !message.deleted) message.react("👍").catch(()=>{
							console.error(`[${dateToTime(postedTime)}]: Error: Could not react 👍 (thumbsup) to message: ${message.url}\nContent of mesage: "${message.content}"`);
						});
						msgtxt.push(`Hey, ${message.author}. Welcome to the server. :partying_face:

 • Start by typing \`$verify\` in <#740262255584739391>. The bot will then ask for your Trainer Code, so have it ready.

 • Extra commands such as \`$team <team-name>\` and \`$level <no>\` are pinned in that channel. Just ask if you can't find them.

 • Instructions for joining and hosting raids are over at <#733418554283655250>. Please also be familiar with the rules in <#747656566559473715>

Feel free to ask any questions you have over in <#733706705560666275>.
Have fun raiding. :wave:`);
					}
					if ((level>39 && level40Role && !message.member.roles.cache.has(level40Role)) || level>49 && level50Role){
						message.member.roles.add(message.guild.roles.cache.get(level40Role)).catch(console.error);
						given40 = true;
						if (!deleteScreens && !message.deleted) message.react("👍").catch(()=>{
							console.error(`[${dateToTime(postedTime)}]: Error: Could not react 👍 (thumbsup) to message: ${message.url}\nContent of mesage: "${message.content}"`);
						});
						msgtxt.push(`${(message.member.roles.cache.has(level30Role)) ? ", however,":"\nAlso,"} we congratulate you on achieving such a high level.\nFor this you have been given the Level 40`);
						if (level>49 && level50Role){
							message.member.roles.add(message.guild.roles.cache.get(level50Role)).catch(console.error);
							given50 = true;
							if (!deleteScreens && !message.deleted) message.react("👍").catch(()=>{
								console.error(`[${dateToTime(postedTime)}]: Error: Could not react 👍 (thumbsup) to message: ${message.url}\nContent of mesage: "${message.content}"`);
							});
							msgtxt.push(` and the Level 50`);
						}
						msgtxt.push(` vanity role${(level>49 && level50Role) ? "s":""}.`);
					}
				} catch (e) {
					console.error(`[${dateToTime(postedTime)}]: Error: thrown while giving rolls. Error: ${e}`);
				}
				if (!given30 && !given40 && !given50){
					logimg.edit(`User: ${message.author}\nResult: \`${level}\`\nRoles: RR possessed. None added.`, image);
				}
				else {
					logimg.edit(`User: ${message.author}\nResult: \`${level}\`\nRoles given: ${(given30?"RR":"")}${(given40?`${given30?", ":""}Level 40`:"")}${(given50?`${given30||given40?", ":""}Level 50`:"")}`, image);
				}
				message.author.send(msgtxt.join(""), {split:true}).catch(() => {
					console.error(`[${dateToTime(postedTime)}]: Error: Could not send DM to ${message.author.username}${message.author}`);
				});
				if (imageLogCount>0 && imageLogCount % 30 === 0) loadBlacklist();
				saveStats(level);
			}
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
				 if (errorMessage && msgDeleteTime>0){
					 errorMessage.delete().catch(()=>{
						 console.error(`[${dateToTime(new Date())}]: Error: Could not delete message: ${errorMessage.url}\nContent of mesage: "${errorMessage.content}"`);
					 });
				 }
			 },msgDeleteTime);});
		 }
	 } else {
		 if (err != null) {
			 console.error(`Uncaught Exception: ${err}${err.stack}`);
			 channel.send(`<@&${modRole}> An unexpected internal error occured. Please give the developer this information:\n${err}${err.stack}`);
		 } else {
			 console.error(err);
		 }
	 }
 });

process.on("unhandledRejection", (err, promise) => {
	try {
		if (err.substr(0,35) == "Error: UNKNOWN: unknown error, open"){
			// do nothing
		} else {
			console.error(`[${dateToTime(new Date())}]: Unhandled rejection at ${promise} reason: ${err}`);
		}
	} catch (e) {
		console.error(`[${dateToTime(new Date())}]: Unhandled rejection at ${promise} reason: ${err}`);
	}
});

process.on("SIGINT", signal => {
  console.log(`Process ${process.pid} has been interrupted`);
	channel.send("The bot is sleeping now. Goodbye :wave:").then(()=>{
		process.exit(1);
	});
});

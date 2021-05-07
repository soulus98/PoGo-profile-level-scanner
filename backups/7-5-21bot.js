const { createWorker , PSM } = require("tesseract.js");
const gm = require("gm");
const {token} = require("./keys/keys.json");
const fs = require("fs");
const https = require("https");
const Discord = require("discord.js");
const {rect} = require("./rect.js");
const client = new Discord.Client();
const cooldowns = new Discord.Collection();
blacklist = new Discord.Collection();
lastImageTimestamp = Date.now();
imageAttempts = 0;
imageLogCount = 0;
launchDate = new Date();
currentlyImage = 0;
screensFolder = `./screens/Auto/${launchDate.toDateString()}`;
config = {};
module.exports = {loadConfigs, clearBlacklist};

function saveBlacklist() {
	fs.writeFile("./blacklist.json",JSON.stringify(Array.from(blacklist)),()=>{
		// console.log(JSON.stringify(Array.from(blacklist))); //test
	});
}
function loadBlacklist(){
	const blackJson = require("./blacklist.json");
	if (!blackJson[0]) return;
	let x;
	for (item of blackJson){
		if (lastImageTimestamp-item[1]<blacklistTime){
			let x = x+1 || 0;
		}
		blacklist.set(item[0],item[1]);
	}
	if (x){
		console.log(`Blacklist loaded, and removed ${x} users from it due to time expiration.`);
	} else {
		console.log(`Blacklist loaded from file.`); //test ??
	}
}
function clearBlacklist(message, idToDelete){
	if (idToDelete){
		blacklist.delete(idToDelete[0]);
		message.reply(`Removed <@${idToDelete[0]}>${idToDelete[0]} from the blacklist.`);
		console.log(`Deleted ${idToDelete[0]} from the blacklist.`);
		saveBlacklist();
	} else {
		fs.writeFile("./blacklist.json","{}",()=>{
		});
		for (const userid of blacklist.keys()){
			blacklist.delete(userid);
			message.reply("Blacklist cleared.");
			console.log(`Cleared the blacklist.`);
			saveBlacklist();
		}
	}
	return;
}
function loadConfigs(){
	config = {};
	delete require.cache[require.resolve("./config.json")];
	config = require("./config.json");
	prefix = config.chars.prefix;
	timeDelay = config.numbers.timeDelay;
	threshold = config.numbers.threshold;
	blacklistTime = config.numbers.blacklistTime;
	msgDeleteTime = config.numbers.msgDeleteTime;
	saveLocalCopy = config.toggles.saveLocalCopy;
	deleteScreens = config.toggles.deleteScreens;
	welcomeMsg = config.toggles.welcomeMsg;
	testMode = config.toggles.testMode;
	screenshotChannel = config.ids.screenshotChannel;
	level30Role = config.ids.level30Role;
	level40Role = config.ids.level40Role;
	level50Role = config.ids.level50Role;
	modRole = config.ids.modRole;
	console.log("Loading configs...");
	console.log(config);
}
function checkDateFolder(checkDate){
	newFolder = `./screens/Auto/${checkDate.toDateString()}`
	console.log(`Checking for ${newFolder}`);
	fs.access(newFolder, error => {
	    if (!error) {
				console.log(`Folder ${checkDate.toDateString()} already existed.`);
	    } else {
				fs.mkdirSync(newFolder);
				console.log(`Folder ${checkDate.toDateString()} created.`);
	    }
	});
}
function loadCommands(){
	client.commands = new Discord.Collection();
	const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
	console.log(commandFiles);
	commandFilesNames = "The currently loaded commands and cooldowns are: \n";
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
function load(){
		loadConfigs();
		checkDateFolder(launchDate);
		loadCommands();
		loadBlacklist();
		client.login(token);
}
load();
client.once("ready", () => {
	channel = client.channels.cache.get(screenshotChannel);
	client.user.setActivity(`Use ${prefix}help for help.`);
	if (channel == undefined){
		console.log("Oops the screenshot channel is broken.");
	};
	setTimeout(() => {
		channel.send("Loaded!");
		console.log(`Ready! Loaded in channel #${channel.id} aka "${channel.name}"`);
	},timeDelay);
});

client.on("guildMemberAdd", member => {
	joinTime = new Date();
	console.log(`New member ${member.user.username}${member} joined the server at ${joinTime.toLocaleString()}`);
  if (!channel || !welcomeMsg) return;
  channel.send(`Hey ${member},

Welcome to the server!
To confirm that you are at least level 30, we need you to send a screenshot of your Pokémon GO profile.
Please do so in this channel.

Thank you. `);
});

client.on("message", message => {

	if (message.author.bot) return; // Bot? Cancel
	wasDelayed = false;
	postedTime = new Date();
	currentTime = Date.now();
	if (screensFolder != `./screens/Auto/${postedTime.toDateString()}`) {
		screensFolder = `./screens/Auto/${postedTime.toDateString()}`;
		checkDateFolder(postedTime);
	}
	//image handler
	if (message.attachments.size > 0) { //checks for an attachment TODO: Check that the attachment is actually an image... how...? idk lol
		//
		if (channel == undefined){
			message.channel.send(`The screenshot channel could not be found. Please set it correctly using \`${prefix}set screenshotChannel <id>\``);
		};
		if (message.channel.type === "dm") {
			message.reply(`I cannot scan an image in a dm. Please send it in ${channel}`);
			return;
		}
		if (message.channel != channel) {
			message.reply(`I cannot scan an image in this channel. Please send it in ${channel}.
<@&${modRole}>, perhaps you should prohibit my access from this (and all other) channels except for ${channel}.`);
			return;
		}
		if (blacklistTime>0){
			if (blacklist.has(message.author.id)){
				if (currentTime-blacklist.get(message.author.id)<blacklistTime){
					message.author.send(`We are sorry, but you are currently prohibited from using the automated system due to a recent screenshot that was scanned under level 30.
If you have surpassed level 30, tag @moderator and someone will let you in manually.
Otherwise, keep leveling up, and we will be raiding with you shortly. :wave:`);
						message.delete();
						console.log(`User ${message.author.username}${message.author} sent an image, but it was declined, due to the blacklist`);
						return;
				} else {
					blacklist.delete(message.author.id);
					console.log(`Removed ${message.author.username}${message.author} from the blacklist.`);
				}
			}
		}
		imageAttempts++;
		currentlyImage++;
		var instance = imageAttempts;
		//console.log(`inst: ${instance}. iLC: ${imageLogCount}. time difference: ${currentTime-lastImageTimestamp-timeDelay}`);
		//console.log("Compared seconds: " + (postedTime-lastImageTimestamp)/1000);
		if (imageLogCount+1 == instance){
			//console.log(`test step A: i#${instance}. iLC: ${imageLogCount}.`);
			imageWrite();
		} else {
			wasDelayed = true;
			const intervalID = setInterval(function () {
				if(imageLogCount+1 == instance){
					currentTime = Date.now();
					setTimeout(imageWrite,timeDelay*(1/5));
					clearInterval(intervalID);
				}
			}, 2000);
		}


		// if (lastImageTimestamp+timeDelay<currentTime && instance-1==imageLogCount){
		// 	console.log(`test step A: i#${instance}`);
		// 	imageWrite();
		// } else {
		// 	console.log(`test step B: i#${instance}`);
		// 	wasDelayed = true;
		// 	function slowCheck(){
		// 		console.log(`test step C: i#${instance}`);
		// 		if (lastImageTimestamp+timeDelay>=currentTime){
		// 			currentTime = Date.now();
		// 			if (lastImageTimestamp+timeDelay<currentTime && instance-1==imageLogCount){
		// 				console.log(`test step D: i#${instance}`);
		// 				imageWrite();
		// 				return;
		// 			}
		// 			console.log(`Loop i#${instance}`);
		// 			setTimeout(slowCheck, (timeDelay/2)+5);
		// 			return;
		// 		}
		// 	}
		// 	slowCheck();
		// }
		/*while(lastImageTimestamp+timeDelay>=currentTime){ //comparing lastImageTimestamp which is set either on server launch or on previous command execution
			wasDelayed = true;
			currentTime = Date.now(); //Keep updating the time while comparing... This is probably very laggy...
		}														//I'd rather compare every second or so. I'll figure that later
		*/
		function imageWrite(){
			lastImageTimestamp = Date.now(); //Setting lastImageTimestamp for the next time it runs
			logString = `User ${message.author.username}${message.author} sent image#${instance} at ${postedTime.toLocaleString()}`;
			try{
				image = message.attachments.first();
				if(saveLocalCopy){
					const imageName = image.id + "." + image.url.split(".").pop();
					const imageDL = fs.createWriteStream(screensFolder + "/" + imageName);
					const request = https.get(image.url, function(response) {
						response.pipe(imageDL);
					});
				}
				crop(image);
				if (wasDelayed == true){
					delayAmount = Math.round((currentTime - postedTime)/1000);
					console.log(logString + `, and it was delayed for ${delayAmount}s`);
				} else { console.log(logString); }
			}catch (error){
				logString = logString + `, but an error occured. Error code: ${error}`;
				console.log(logString);
				message.react("❌");
				imageLogCount++;
				currentlyImage--;
				return;
			}
		}
		function crop(image){
				https.get(image.url, function(response){
					img = gm(response);
					img
				  .size((err,size) => {
				    if (err){
				      console.log(`An error occured while sizing "img": ${err}`);
							throw err;
							return;
				    }
						cropSize = rect(size);
						cropper();
					});
				});
				function cropper() {
					https.get(image.url, function(response){
						const imageName = image.id + "crop." + image.url.split(".").pop();
						imgTwo = gm(response);
						imgTwo
						.blackThreshold(threshold)
						.whiteThreshold(threshold+1)
						.crop(cropSize.wid,cropSize.hei,cropSize.x,cropSize.y)
						.flatten()
						.toBuffer((err, imgBuff) => {
							if (err){
								console.log(`An error occured while buffering "imgTwo": ${err}`);
								throw err;
								return;
							}

							//This is for seeing the cropped version
							if (saveLocalCopy) {
								fs.writeFile(`${screensFolder}/${imageName}`,imgBuff, (err) =>{
									if (err){
										console.log(`An error occured while writing "imgTwo": ${err}`);
										return;
									}
									//console.log("Written"); //test ??
								});
							}
							if (testMode){
								const imgAttach = new Discord.MessageAttachment(imgBuff, image.url);
				  			message.channel.send("Test mode. This is the image fed to the OCR system:", imgAttach);
							}
							setTimeout(()=>{recog(imgBuff);},timeDelay*(4/5));
							//recog(imgBuff);
						});
					});
				}
					/*
						.write(`${screensFolder}/cropped${imageName}`, (err) => {
							if (err){
								console.log(`An error occured while writing "img": ${err}`);
								return;
							}
							console.log("Successfully written");
						});
						/*.toBuffer((err, imgBuff) => {
							if (err){
								console.log(`An error occured while buffering "img": ${err}`);
								return;
							}
							recog(imgBuff);
						});*/
		}
		async function recog(imgBuff){
			message.react("👀"); //test
			const worker = createWorker({
				//logger: m => console.log(m)
			});
			(async () => {
				await worker.load();
				//console.log(`Recognising: i#${instance}. iLC: ${imageLogCount}.`); //test??
				await worker.loadLanguage("eng");
				await worker.initialize("eng");
				await worker.setParameters({
					tessedit_pageseg_mode: PSM.AUTO,
				});
				const { data: { text } } = await worker.recognize(imgBuff);
				//console.log("Image recognised. Result:" + text);
				await worker.terminate();
				try{
					level = text.match(/(\d\d)/)[0];
				} catch (err){
					console.log(`Could not find a two digit number in ${text}`);
					level = "Failure";
				}
				//console.log(`Recognised image: #${instance}. Level: ${level}. `); //test
				if (testMode){
					message.reply(`Test mode. This image ${isNaN(level) ? "failed.":`was scanned at level: ${level}.`} `);
				}
				if (isNaN(level) || level >50){
					message.channel.send(`<@&${modRole}> There was an issue scanning this image.`);
					message.react("❌");
					message.author.send(`Hold on there trainer, there was an issue scanning your profile screenshot.
Make sure you follow the example at the top of <#740670778516963339>.
If there was a different cause, a moderator will be able to help manually approve you.`);
					imageLogCount++;
					currentlyImage--;
					return;
				} else {
					//message.reply("Test. Your level was scanned at " + level);
					roleGrant(level);
					imageLogCount++;
					currentlyImage--;
					//console.log(`Remaining images: ${currentlyImage}`);//test
					if (deleteScreens) {
						if (message){
							message.delete();
						}
					}
				}
			})();
		}
		function roleGrant(level){
			const msgtxt = [];
			try {
				role30 = message.guild.roles.cache.get(level30Role);
				role40 = message.guild.roles.cache.get(level40Role);
				role50 = message.guild.roles.cache.get(level50Role);
				if (message.member.roles.cache.has(level50Role) && message.member.roles.cache.has(level40Role) && message.member.roles.cache.has(level30Role)){
					message.author.send("You already have all available roles.");
					return;
				}
				if(message.member.roles.cache.has(level30Role)){
					msgtxt.push("You already have the Remote Raids role");
				}
				else if (level<30 && message.author){
					message.react("👎");
					message.author.send(`Hey trainer!
Thank you so much for your interest in joining our raid server.
Unfortunately we have a level requirement of 30 to gain full access, and your screenshot was scanned at ${level}.
Gaining xp is very easy to do now with friendships, events, lucky eggs and so much more! Please stay and hang out with us here.
You can use <#733418314222534826> to connect with other trainers and get the xp you need to hit level 30!
Once you've reached that point, please repost your screenshot.

In the meantime please join our sister server with this link.
Hope to raid with you soon! :slight_smile:
https://discord.gg/tNUXgXC`);
				blacklist.set(message.author.id,currentTime);
				saveBlacklist();
				console.log(`User ${message.author.username}${message.author} was scanned at level ${level} and was added to the blacklist`);
					//TODO: blacklist & mention server staff DM
					return;
				}
				else if (level>29){
					message.member.roles.add(message.guild.roles.cache.get(level30Role)).catch(console.error);
					message.react("👍");
					msgtxt.push(`Hey trainer, welcome to the server. :partying_face:
To get started type \`$verify\` in <#740262255584739391> to start setting up your profile. Extra commands are pinned in that channel.
Instructions for joining and hosting raids are over at <#733418554283655250>.
Feel free to ask any questions you have over in <#733706705560666275>.
Have fun raiding. :wave:`);
				}
				if (level>39 && level40Role){
					message.member.roles.add(message.guild.roles.cache.get(level40Role)).catch(console.error);
					message.react("👍");
					msgtxt.push(`${(message.member.roles.cache.has(level30Role)) ? " however,":"\nAlso,"} we congratulate you on achieving such a high level.\nFor this you have been given the Level 40`);
					if (level>49 && level50Role){
						message.member.roles.add(message.guild.roles.cache.get(level50Role)).catch(console.error);
						message.react("👍");
						msgtxt.push(`and the Level 50`);
					}
					msgtxt.push(`vanity role${(message.member.roles.cache.has(level50Role)) ? "s":""}.`);
				}
			} catch (e) {
				console.log(`an error occured. Error: ${e}`);
			}
			console.log(msgtxt);
			console.log(msgtxt.toString());
			message.author.send(msgtxt.toString(" "), {split:true});
		}
	}

	//command handler
  if (!message.content.startsWith(prefix) || message.author.bot) return; //No prefix? Bot? Cancel
	//finangling the command and argument vars
	const args = message.content.slice(prefix.length).trim().split(" ");
  const commandName = args.shift().toLowerCase();
	const command = client.commands.get(commandName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName)); //this searches aliases
	//a bunch of checking
	if (!command) return; 																						//is it a command
	logString = `User: ${message.author.username}${message.author} used ${prefix}${commandName} at ${postedTime.toLocaleString()}`;
	if (command.guildOnly && message.channel.type === "dm") { 				//dm checking
		logString = logString + `, but it failed, as ${prefix}${commandName} cannot be used in a DM`;
		console.log(logString);
		return message.reply("This command cannot be used in a DM");
	}
	if (command.permissions) {																				//Permission checking
		const authorPerms = message.channel.permissionsFor(message.author);
		if (!authorPerms || !authorPerms.has(command.permissions)) {
			logString = logString + `, but it failed, as ${prefix}${commandName} requires ${command.permissions}, and the user does not possess it.`;
			console.log(logString);
			return message.reply(`You must possess the ${command.permissions} permission to execute \`${prefix}${commandName}\``);
		}
	}
	if (command.args && !args.length) {																//Checking for arguments if an argument is required
		let reply = `You didn't provide any arguments, ${message.author}!`;
		if (command.usage) {
			reply += `\nThe proper usage would be: ${command.usage}`;
		}
		logString = logString + `, but it failed, as it requires arguments, and none were provided.`;
		console.log(logString);
		return message.channel.send(reply);
	}
	if(command.cooldown){																							//per-author cooldown checking
		if (!cooldowns.has(command.name)) {
			cooldowns.set(command.name, new Discord.Collection());
		}
		const timestamps = cooldowns.get(command.name);
		const cooldownAmount = (command.cooldown || 3) * 1000;
		if (timestamps.has(message.author.id)) {
			const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
			if (currentTime < expirationTime) {
				const timeLeft = (expirationTime - currentTime) / 1000;
				logString = logString + `, but it failed, as ${prefix}${commandName} was on cooldown from this user at the time.`;
				console.log(logString);
				return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${prefix}${command.name}\` command.`);
			}
		}
		timestamps.set(message.author.id, currentTime);
		setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
	}
	//command execution
	try {
		addToLogString = command.execute(message, args);
		if (addToLogString == undefined) {
			console.log(logString);
		} else {
			console.log(logString + addToLogString);
		}
	} catch (error) {
		console.error(error);
		message.reply("An error occured while trying to run that command");
	}
});

 process.on("uncaughtException", (err) => {
   console.log(`Uncaught Exception: ${err}`);
	 if (currentlyImage > 0){
		 imageLogCount++;
		 currentlyImage--;
	 }
	 errorMessage = channel.send(`<@&${modRole}> An internal error occured. Please retry sending the screenshot(s) that failed.`);
	  errorMessage.then((errorMessage)=>{setTimeout(()=>{
		 	 if (errorMessage && msgDeleteTime>0){
			 	 	errorMessage.delete();
			 }
		},msgDeleteTime);});
 });

process.on("unhandledRejection", (err, promise) => {
  console.log("Unhandled rejection at ", promise, `reason: ${err.message}`);
});

process.on("SIGINT", signal => {
  console.log(`Process ${process.pid} has been interrupted`);
	channel.send("Server forcibly closed. Goodbye :wave:").then(()=>{
		process.exit(0);
	});
});

const { createWorker } = require('tesseract.js');
const Canvas = require("canvas");
const {token} = require("./keys/keys.json");
const fs = require("fs");
const https = require("https");
const Discord = require("discord.js");
const client = new Discord.Client();
const cooldowns = new Discord.Collection();
lastImageTimestamp = Date.now();
imageAttempts = 0;
imageLogCount = 0;
postDate = new Date();
var screensFolder = `./screens/Auto/${postDate.toDateString()}`;
config = {};
module.exports = {loadConfigs};


function loadConfigs(){
	config = {};
	delete require.cache[require.resolve("./config.json")];
	config = require("./config.json");
	prefix = config.chars.prefix;
	timeDelay = config.numbers.timeDelay;
	saveLocalCopy = config.toggles.saveLocalCopy;
	deleteScreens = config.toggles.deleteScreens;
	welcomeMsg = config.toggles.welcomeMsg;
	screenshotChannel = config.ids.screenshotChannel;
	level30Role = config.ids.level30Role;
	level40Role = config.ids.level40Role;
	level50Role = config.ids.level50Role;
	modRole = config.ids.modRole;
	console.log("Loading configs...");
	console.log(config);
}
function checkDateFolder(checkDate){
	fs.access(screensFolder, error => {
	    if (!error) {
				console.log(`Folder ${checkDate.toDateString()} already existed.`);
	    } else {
				fs.mkdirSync(screensFolder);
				console.log(`Folder ${checkDate.toDateString()} created.`);
	    }
	});
}
function loadCommands(){
	client.commands = new Discord.Collection();
	const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
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
		checkDateFolder(postDate);
		loadCommands();
}
load();
client.once("ready", () => {
	channel = client.channels.cache.get(screenshotChannel);
	if (channel == undefined){
		console.log("Oops the screenshot channel is broken.");
	};
	console.log(`Ready! Loaded in channel #${channel.id} aka "${channel.name}"`);
	channel.send("Loaded!");
});

client.on("guildMemberAdd", member => {
	joinTime = new Date();
	console.log(`New member ${member.user.username}${member} joined the server at ${joinTime.toLocaleString()}`);
  if (!channel || !welcomeMsg) return;
  channel.send(`Hey, ${member}.
To confirm that you are at least level 30, we need you to send a screenshot of your Pokemon Go profile.
Please do so in this channel.
Thankyou.`);
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
		if (message.channel != channel) return;
		imageAttempts++;
		var instance = imageAttempts;
		console.log(`instance: ${instance}\ncurrentTime: ${currentTime}\nimageLogCount: ${imageLogCount}\nlastImageTimestamp + timeDelay: ${lastImageTimestamp+timeDelay}`);
		console.log("Compared seconds: " + (postedTime-lastImageTimestamp)/1000);
		if (lastImageTimestamp+timeDelay<currentTime && instance-1==imageLogCount){
			imageWrite(message);
		} else {
			wasDelayed = true;
			function slowCheck(){
				if (lastImageTimestamp+timeDelay>=currentTime){
					currentTime = Date.now();
					if (lastImageTimestamp+timeDelay<currentTime && instance-1==imageLogCount){
						if(saveLocalCopy){
							imageWrite(message);
							return;
						} else {
							crop();
						}
					}
					setTimeout(slowCheck, timeDelay+9);
					return;
				}
			}
			slowCheck();
		}
		/*while(lastImageTimestamp+timeDelay>=currentTime){ //comparing lastImageTimestamp which is set either on server launch or on previous command execution
			wasDelayed = true;
			currentTime = Date.now(); //Keep updating the time while comparing... This is probably very laggy...
		}														//I'd rather compare every second or so. I'll figure that later
		*/

		function imageWrite(message){
			imageLogCount++;
			lastImageTimestamp = Date.now(); //Setting lastImageTimestamp for the next time it runs
			logString = `User ${message.author.username}${message.author} sent image#${imageLogCount} at ${postedTime.toLocaleString()}`;
			try{
				image = message.attachments.first();
				imageName = image.id + "." + image.url.split(".").pop();
				const imageDL = fs.createWriteStream(screensFolder + "/" + imageName);
				const request = https.get(image.url, function(response) {
					response.pipe(imageDL);
				});
				crop();
				if (wasDelayed == true){
					delayAmount = (currentTime - postedTime)/1000;
					console.log(logString + `, and it was delayed for ${delayAmount}`);
				} else {
					console.log(logString);
				}
				message.react("👌");
			}catch (error){
				logString = logString + `, but an error occured. Error code: ${error}`;
				console.log(logString);
				message.react("👎");
			}
		}
		async function crop(){

			const imgCanv = Canvas.createCanvas(image.width,image.height);	//size of canvas
			const ctx = imgCanv.getContext("2d");
			const img = Canvas.loadImage(image.url);
			img.then((img) => {
				ctx.drawImage(img,0,0,imgCanv.width,imgCanv.height);

			/*const imgCanv = Canvas.createCanvas((image.width/7),(image.height/5));	//size of canvas
			const ctx = imgCanv.getContext("2d");
			const img = Canvas.loadImage(image.url);
			img.then((img) => {
				ctx.drawImage(img, 	//img (source image)
					image.width/28,image.height/2.2,	//sx, sy (where to start clipping)
					imgCanv.width,imgCanv.height,		//swidth, sheight (clip size)
					0,0,														//x, y (where to draw in the Canvas)
					imgCanv.width,imgCanv.height		//width, height (size of canvas again)
				);
				*/
				const imgData = ctx.getImageData(0, 0, imgCanv.width, imgCanv.height);
				newData = greyScale(imgData);
				ctx.putImageData(newData,0,0);
				try{
	  			const imgAttach = new Discord.MessageAttachment(imgCanv.toBuffer(), image.url);
	  			message.channel.send("Reeeeee", imgAttach);
	      } catch (err){
	        console.log(`There was an error:  ${err}`);
	      }
				//.catch(err => console.log(`An error occured. Error: ${err}`));
		});

			function greyScale(imgData){
				for (i = 0; i < imgData.data.length; i += 4) {
					let count = imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2];
					let colour = 0;
					if (count > 650) colour = 255;
					imgData.data[i] = colour;
					imgData.data[i + 1] = colour;
					imgData.data[i + 2] = colour;
					imgData.data[i + 3] = 255;
				}
				return imgData;
			}

			try{
				const worker = createWorker({
					logger: m => console.log(m),
				});
				(async () => {
					await worker.load();
					await worker.loadLanguage('eng');
					await worker.initialize('eng');
					const { data: { text } } = await worker.recognize(imgCanv.toBuffer());
					console.log(text);
					await worker.terminate();
				})();
			}catch (err){
				console.log(`An error occured while recognising. Error: ${err}`);
			}
			level = 50;
			if (isNaN(level)){
				message.reply(`<@&${modRole}> There was an issue scanning this image. It may not be a Pokemon Go profile screenshot, or there may be an internal bot issue.`);
			}
			else{
				roleGrant(level);
				if (deleteScreens) {
					message.delete();
				}
			}
		} //ocr end
		function roleGrant(level){
			const msgtxt = [];
			try {
				if (level<30 && message.author){
					msgtxt.push(`Hey trainer!
Thanks so much for your interest in joining our raid server.
Unfortunately we have a level requirement of 30 to gain full access, and your screenshot was scanned at ${level}.
Gaining xp is very easy to do now with friendships, events, lucky eggs and so much more! Please stay and hang out with us here.
You can use <#733418314222534826> to connect with other trainers and get the xp you need to hit level 30!
Once you've reached that point, please repost your screenshot.

In the meantime please join our sister server with this link.
Hope to raid with you soon! :slight_smile:
https://discord.gg/tNUXgXC`);
					//TODO: blacklist & mention server staff DM
					return;
				}
				else if (level>29){
					msgtxt.push(`Hey, welcome to the server. :partying_face:
To get started type \`$verify\` in <#740262255584739391> to start setting up your profile. Extra commands are pinned in said channel.
Instructions for joining and hosting raids are over at <#733418554283655250>.
Feel free to ask any questions you have over in <#733706705560666275>.
Have fun raiding. :wave:
	`);
					message.member.roles.add(message.guild.roles.cache.get(level30Role)).catch(console.error);
					message.react("👍");
				}
				if (level>39 && level40Role){
					message.member.roles.add(message.guild.roles.cache.get(level40Role)).catch(console.error);
					msgtxt.push(`Also, congratulations on achieving such a high level.
You have been given roles based on reaching:
Level 30
Level 40`);
				}
				if (level>49 && level50Role){
					message.member.roles.add(message.guild.roles.cache.get(level50Role)).catch(console.error);
					msgtxt.push(`Level 50`);
				}
			} catch (e) {
				console.log(`an error occured. Error: ${e}`);
			}
			message.author.send(msgtxt, { split: true });
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
	if (command.guildOnly && message.channel.type === 'dm') { 				//dm checking
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

client.login(token);

const {prefix , timeDelay} = require("./config.json");
const {token} = require("./keys/keys.json");
const fs = require("fs");
const https = require("https");
const Discord = require("discord.js");
const client = new Discord.Client();
const cooldowns = new Discord.Collection();
lastImageTimestamp = Date.now();
const ocr = require("./ocr.js");
imageAttempts = 0;
imageLogCount = 0;

client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
commandFilesNames = "The currently loaded commands and cooldowns are: \n";
for (const file of commandFiles) {
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

client.once("ready", () => {console.log("Ready!");});

client.on("guildMemberAdd", member => {
  const channel = member.guild.channels.cache.find(ch => ch.name === "ocr-bot-test");
  if (!channel) return;
  channel.send(`Hey, ${member}. \n
								To confirm that you are at least level 30, we need you to send a screenshot of your Pokemon Go profile. \n
								You can do so in this channel. \n
								Thankyou.`);
});

client.on("message", message => {	//image handler

	wasDelayed = false;
	postedTime = new Date();
	currentTime = new Date();						//This is current time
	if (message.attachments.size > 0) { //checks for an attachment TODO: Check that the attachment is actually an image... how...? idk lol
		imageAttempts++;
		var instance = imageAttempts;
		console.log(`instance: ${instance}`);
		console.log("Compared seconds: " + (postedTime-lastImageTimestamp)/1000 + "\ntimeDelay:" + timeDelay);
		if (lastImageTimestamp+timeDelay<currentTime && instance-1==imageLogCount){
			imageWrite();
		}
		else {
			wasDelayed = true;
			function slowCheck(){
				if (lastImageTimestamp+timeDelay>=currentTime){
					currentTime = Date.now();
					if (lastImageTimestamp+timeDelay<currentTime && instance-1==imageLogCount){
						imageWrite();
						return;
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
		function imageWrite(){
			imageLogCount++;
			lastImageTimestamp = Date.now(); //Setting lastImageTimestamp for the next time it runs
			try{
				image = message.attachments.first();
				imageName = image.id + "." + image.url.split(".").pop();
				const imageDL = fs.createWriteStream("./screens/Auto/" + imageName);
				const request = https.get(image.url, function(response) {
	  			response.pipe(imageDL);
				});
				ocr.execute(message, image.url);
				logString = `User ${message.author.username}${message.author} sent image#${imageLogCount} at ${postedTime.toLocaleString()}`;
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
	}

  if (!message.content.startsWith(prefix) || message.author.bot) return; //No prefix? Bot? Cancel
	//finangling the command and argument vars
	const args = message.content.slice(prefix.length).trim().split(" ");
  const commandName = args.shift().toLowerCase();
	const command = client.commands.get(commandName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName)); //this searches aliases
	//a bunch of checking
	if (!command) return; 																						//is it a command
	logString = `User: ${message.author.username}${message.author} used ${prefix}${commandName} at ${currentTime.toLocaleString()}`;
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
			reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
		}
		logString = logString + `, but it failed, as ${prefix}${commandName} requires arguments, and none were provided.`;
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

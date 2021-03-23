const { createWorker } = require('tesseract.js');
const Canvas = require("canvas");
const {prefix , timeDelay, saveLocalCopy} = require("./config.json");
const {token} = require("./keys/keys.json");
const fs = require("fs");
const https = require("https");
const Discord = require("discord.js");
const client = new Discord.Client();
const cooldowns = new Discord.Collection();
lastImageTimestamp = Date.now();
imageAttempts = 0;
imageLogCount = 0;

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

client.once("ready", () => {console.log("Ready!");});

client.on("guildMemberAdd", member => {
	console.log("Join test 2");
  const channel = member.guild.channels.cache.find(ch => ch.name === "ocr-bot-test");
  if (!channel) return;
  channel.send(`Hey, ${member}.
To confirm that you are at least level 30, we need you to send a screenshot of your Pokemon Go profile.
Please do so in this channel.
Thankyou.`);
});

client.on("message", message => {
	if (message.author.bot) return; // Bot? Cancel
	wasDelayed = false;
	postedTime = new Date();
	currentTime = new Date();

	//image handler
	if (message.attachments.size > 0) { //checks for an attachment TODO: Check that the attachment is actually an image... how...? idk lol
		imageAttempts++;
		var instance = imageAttempts;
		console.log(`instance: ${instance}`);
		console.log("Compared seconds: " + (postedTime-lastImageTimestamp)/1000 + "\ntimeDelay:" + timeDelay);
		if (lastImageTimestamp+timeDelay<currentTime && instance-1==imageLogCount){
			imageWrite(message);
		}
		else {
			wasDelayed = true;
			function slowCheck(){
				if (lastImageTimestamp+timeDelay>=currentTime){
					currentTime = Date.now();
					if (lastImageTimestamp+timeDelay<currentTime && instance-1==imageLogCount){
						if(saveLocalCopy){
							imageWrite(message);
							return;
						} else {

							ocr();
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
				const imageDL = fs.createWriteStream("./screens/Auto/" + imageName);
				const request = https.get(image.url, function(response) {
					response.pipe(imageDL);
				});
				ocr();
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

		async function ocr(){
			const imgCanv = Canvas.createCanvas(image.width,image.height);	//size of canvas
			const ctx = imgCanv.getContext("2d");
			const background = await Canvas.loadImage(image.url);
			ctx.drawImage(background,0,0,imgCanv.width,imgCanv.height);

			/*
			big = 3;
			const imgCanv = Canvas.createCanvas((image.width/7)*big,(image.height/5)*big);	//size of canvas
			const ctx = imgCanv.getContext("2d");
			const background = await Canvas.loadImage(image.url);
			await ctx.drawImage(background, 	//img (source image)
				image.width/28,image.height/2.2,	//sx, sy (where to start clipping)
				imgCanv.width/big,imgCanv.height/big,		//swidth, sheight (clip size)
				0,0,														//x, y (where to draw in the Canvas)
				imgCanv.width,imgCanv.height		//width, height (size of canvas again)
			);
			*/
      try{
  			const imgAttach = new Discord.MessageAttachment(imgCanv.toBuffer(), image.url);
  			console.log("Test 2");
  			message.channel.send("Reeeeee", imgAttach);
  			console.log("Test 3");
      } catch (err){
        console.log("there was an error: " + err);
      }
			/*
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
			}catch (error){
				console.log(`An error occured while recognising. Error: ${error}`);
			}*/
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

const {prefix} = require("./config.json");
const {token} = require("./keys/keys.json");
const fs = require("fs");
const Discord = require("discord.js");
const client = new Discord.Client();
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const cooldowns = new Discord.Collection();

commandFilesNames = "The currently loaded commands and cooldowns are: \n"
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

client.once("ready", () => {
	console.log("Ready!");
});

client.on("guildMemberAdd", member => {
  const channel = member.guild.channels.cache.find(ch => ch.name === "ocr-bot-test");
  if (!channel) return;
  channel.send(`Hey, ${member}. \n
								To confirm that you are at least level 30, we need you to send a screenshot of your Pokemon Go profile. \n
								You can do so in this channel. \n
								Thankyou.`);
});

client.on("message", message => {
	if (message.attachments.size > 0) {
		message.channel.send("test");
		message.channel.send(message.attachments.size);
		message.channel.send(message.attachments.name);
		return;
	}
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  const args = message.content.slice(prefix.length).trim().split(" ");
  const commandName = args.shift().toLowerCase();
	if (!client.commands.has(commandName)) return;
	const command = client.commands.get(commandName);
	if (command.guildOnly && message.channel.type === 'dm') {
		return message.reply("This command cannot be used in a DM");
	}
	if (command.args && !args.length) {
		let reply = `You didn't provide any arguments, ${message.author}!`;
		if (command.usage) {
			reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
		}
		return message.channel.send(reply);
	}
	if (!cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Discord.Collection());
	}
	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || 3) * 1000;

	if (timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
		if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000;
			return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${prefix}${command.name}\` command.`);
		}
	}
	timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
	try {
		command.execute(message, args);
	} catch (error) {
		console.error(error);
		message.reply("An error occured while trying to run that command");
	}
});

client.login(token);

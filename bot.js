const {prefix} = require("./config.json");
const {token} = require("./keys/keys.json");
const fs = require("fs");
const Discord = require("discord.js");
const client = new Discord.Client();
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

commandFilesNames = "The currently loaded command files are: "
for (const file of commandFiles) {
	commandFilesNames = commandFilesNames + file +", ";
}
console.log(commandFilesNames);

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

client.once("ready", () => {
	console.log("Ready!");
});

client.on("guildMemberAdd", member => {
  const channel = member.guild.channels.cache.find(ch => ch.name === "ocr-bot-test");
  if (!channel) return;
  channel.send(`Hey, ${member}. \n To confirm that you are at least level 30,
    we need you to send a screenshot of your Pokemon Go profile. \n You can do so in this channel. \n Thankyou.`);
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
	if (command.args && !args.length) {
		let reply = `You didn't provide any arguments, ${message.author}!`;
		if (command.usage) {
			reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
		}
		return message.channel.send(reply);
	}
	try {
		command.execute(message, args);
	} catch (error) {
		console.error(error);
		message.reply("An error occured while trying to run that command");
	}


/*else if (command === "prune") {
    let replyMessage = message.reply("All messages in this channel will be deleted. Type "yes" to confirm. This will last 10 seconds.");
    let filter = msg => msg.author.id == message.author.id && msg.content.toLowerCase() == "yes";
    message.channel.awaitMessages(filter, {max: 1, time: 20000}).then(collected => {
    if (!replyMessage.deleted) replyMessage.delete();
    if (!collected.first().deteled) collected.first().delete();
    message.channel.bulkDelete(10)
    .then(messages => message.channel.send(`Pruned ${messages.size} messages`))
    .catch(console.error);
    message.reply("Confirmed!");
    });
  }*/
});
client.login(token);

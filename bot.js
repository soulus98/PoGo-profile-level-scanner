const Discord = require("discord.js");
const client = new Discord.Client();
const {prefix} = require("./config.json");
const {token} = require("./keys/keys.json");

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
	}
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  const args = message.content.slice(prefix.length).trim().split(" ");
  const command = args.shift().toLowerCase();
  if (command === "ping") {
    msgdelay = message.createdTimestamp - new Date().getTime();
  	message.channel.send("Pong. Message delay of: " + msgdelay + " ms");
  } else if (command === "bing") {
  	message.channel.send("Bong.");
  } else if (command === "revert") {
		if (!message.mentions.users.size) {
			return message.reply("you must tag at least one user.");
		}
		const taggedUsers = message.mentions.users.map(user => {
		return `${user.username}`;
	});
		message.channel.send("You wanted to revert: " + taggedUsers + "\n Todo: make this work");

//todo: make this work...



}/* else if (command === "prune"){
	const amount = parseInt(args[0]);

	if (isNaN(amount)){
		return message.reply("You must supply a number of messages to prune.");
	}
		
	*/

} /*else if (command === "prune") {
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

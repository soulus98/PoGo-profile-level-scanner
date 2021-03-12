const { prefix } = require("../config.json");
module.exports = {
	name: "prune-messages",
	aliases: ["prune", "clear", "purge"],
	description: "Automatically deletes a specified amount of messages, after a verification.",
	args: true,
	usage: `\`${prefix}prune-messages <number>\` (between 1 and 99)`,
	guildOnly:true,
	cooldown: 0.1,
	execute(message, args) {
    const amount = parseInt(args[0]) +1;

    if (isNaN(amount)){
      return message.reply("You must supply a number of messages to prune.");
    } else if (amount < 1 || amount > 99) {
      return message.reply("You must input a number between 1 and 99.");
    }
    message.channel.bulkDelete(amount);
	},
};


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

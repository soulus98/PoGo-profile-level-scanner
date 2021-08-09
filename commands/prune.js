const config = require("../server/config.json");
const prefix = config.chars.prefix;
module.exports = {
	name: "prune-messages",
	aliases: ["prune", "clear", "purge"],
	description: "Automatically deletes a specified amount of messages, after a verification.",
	args: true,
	usage: `\`${prefix}prune <number>\` (between 1 and 99)`,
	guildOnly:true,
	permissions: "MANAGE_MESSAGES",
	execute(message, args) {
		const amount = parseInt(args[0]) +1;
		if (isNaN(amount)){
			message.lineReply("You must supply a number of messages to prune.");
			return `, but it failed, as a number was not provided.`;
		} else if (amount < 2 || amount > 100) {
		 	message.lineReply("You must input a number between 1 and 99.");
		 	return `, but it failed, as the number provided was outside the usable range.`;
		 } else {
			message.channel.messages.fetch({limit:amount}).then(allMessages =>{
				message.lineReply(`${args[0]} messages will be deleted. Type \`yes\` to confirm. This will last 5 seconds.`).then(replyMessage =>{
					let filter = msg => msg.author.id == message.author.id && msg.content.toLowerCase() == "yes";
					message.channel.awaitMessages(filter, {max: 1, time: 5000}).then(collectMessages => {
						replyMessage.delete();
						if(collectMessages.size == 0){
							return;
						}
						collectMessages.first().delete();
						const messagesToDelete = allMessages.filter(msg => !msg.pinned);
						message.channel.bulkDelete(messagesToDelete, true);
					});
				});
			});
		}
	},
};




// message.reply("All messages in this channel will be deleted. Type \"yes\" to confirm. This will last 10 seconds.").then(replyMessage =>{
// 	let filter = msg => msg.author.id == message.author.id && msg.content.toLowerCase() == "yes";
// 	message.channel.awaitMessages(filter, {max: 1, time: 20000}).then(collected => {
// 		console.log(replyMessage.deleted,collected.first().deteled);
// 		if (!replyMessage.deleted) replyMessage.delete();
// 		if (!collected.first().deteled) collected.first().delete();
// 		message.channel.bulkDelete(10)
// 		.then(messages => message.channel.send(`Pruned ${messages.size} messages`))
// 		.catch(console.error);
// 		message.reply("Confirmed!");
// 	});
// });


	// const amount = parseInt(args[0]) +1;
	// if (isNaN(amount)){
	// 	message.reply("You must supply a number of messages to prune.");
	// 	return `, but it failed, as a number was not provided.`;
	// } else if (amount < 2 || amount > 100) {
	// 	message.reply("You must input a number between 1 and 99.");
	// 	return `, but it failed, as the number provided was outside the usable range.`;
	// }
	// try{
	// 	message.channel.bulkDelete(amount);
	// 	return `, and it was successful.`;
	// }catch(err){
	// 	return `, but it failed, due to an unexpected error. Error: ${err}`;
	// }

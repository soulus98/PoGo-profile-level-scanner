module.exports = {
	name: "restart",
	description: "Restarts the bot. I haven't (can't) thoroughly tested this, so sorry if t doesn't work",
  aliases: ["rs"],
  usage: `\`${ops.prefix}rs\``,
	guildOnly:true,
	permissions: "MANAGE_GUILD",
	execute(message) {
		return new Promise(function(resolve) {
			console.log(`${message.author.username}${message.author} force quit the server at ${message.createdAt.toLocaleString()}.`);
			message.lineReplyNoMention("Restarting...").then(() => {
				resolve();
				setTimeout(() => {
					process.exit(0);
				}, 10);
			});
		});
	},
};

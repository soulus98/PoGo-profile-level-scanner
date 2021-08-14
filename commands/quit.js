module.exports = {
	name: "force-quit",
	description: "Forcibly quit the bot server. IDK why you'd need to do this but I've included it just in case.",
  aliases: ["quit","end"],
  usage: `\`${prefix}quit\``,
	guildOnly:true,
	permissions: "MANAGE_GUILD",
	execute(message, args) {
		return new Promise(function(resolve, reject) {
			message.lineReplyNoMention("The bot is sleeping now. Goodbye :wave:").then( () => {
				resolve();
				setTimeout(function () {
					process.exit(1);
				}, 10);
			});
		});
	},
};

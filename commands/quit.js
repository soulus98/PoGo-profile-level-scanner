const { replyNoMention } = require("../func/misc.js");

module.exports = {
	name: "force-quit",
	description: "Forcibly quit the bot server. IDK why you'd need to do this but I've included it just in case.",
  aliases: ["quit", "end"],
  usage: `\`${ops.prefix}quit\``,
	guildOnly:true,
	execute(message) {
		return new Promise(function(resolve) {
			replyNoMention(message, "The bot is sleeping now. Goodbye :wave:").then(() => {
				resolve();
				setTimeout(() => {
					process.exit(1);
				}, 10);
			});
		});
	},
};

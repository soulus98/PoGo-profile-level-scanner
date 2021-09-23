const { clearBlacklist } = require("../bot.js");

module.exports = {
	name: "clear-blacklist",
	description: "Removes people from the blacklist. Use alone to clear all users or with a discord user ID to clear a specific user.",
  aliases: ["clear-bl", "cbl"],
  usage: `\`${ops.prefix}cbl [user-id]\``,
  cooldown: 5,
	guildOnly:true,
	execute(message, args) {
		return new Promise(function(resolve) {
			if (args[0]){
				clearBlacklist(message, args);
				resolve();
			} else {
				clearBlacklist(message);
				resolve();
			}
		});
	},
};

const { clearBlacklist } = require("../bot.js");

module.exports = {
	name: "clear-blacklist",
	description: "Removes people from the blacklist. Use with `all` to clear all users or with a discord user ID to clear a specific user.",
  aliases: ["clear-bl", "cbl"],
  usage: `\`${ops.prefix}cbl [user-id]\` or \`${ops.prefix}cbl all\``,
  cooldown: 5,
	guildOnly:true,
	args: true,
	scanningOnly: true,
	execute(message, args) {
		return new Promise(function(resolve) {
			if (args[0] == "all"){
				clearBlacklist(message);
				resolve();
			} else {
				clearBlacklist(message, args);
				resolve();
			}
		});
	},
};

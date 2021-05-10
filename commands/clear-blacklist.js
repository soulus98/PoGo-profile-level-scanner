const config = require("../config.json");
const prefix = config.chars.prefix;
const {clearBlacklist} = require("../bot.js");

module.exports = {
	name: "clear-blacklist",
	description: "Removes people from the blacklist. Use alone to clear all users or with a discord user ID to clear a specific user.",
  aliases: ["clear-bl","cbl"],
  usage: `\`${prefix}cbl [user-id]\``,
  cooldown: 5,
	guildOnly:true,
	permissions: "ADMINISTRATOR",
	execute(message, args) {
    if (args[0]){
      clearBlacklist(message, args);
    } else {
      clearBlacklist(message);
    }
	},
};

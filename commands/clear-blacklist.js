const config = require("../config.json");
const prefix = config.chars.prefix;
const {clearBlacklist} = require("../bot.js");

module.exports = {
	name: "clear-blacklist",
	description: "Removes all people from the 24hr blacklist.",
  aliases: ["clear-bl","cbl"],
  usage: `${prefix}cbl`,
  cooldown: 5,
	guildOnly:true,
	permissions: "ADMINISTRATOR",
	execute(message, args) {
    if (args){
      clearBlacklist(message, args);
    } else {
      clearBlacklist(message);
    }
	},
};

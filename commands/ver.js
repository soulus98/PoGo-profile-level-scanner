const config = require("../config.json");
const prefix = config.chars.prefix;
const {ver} = require("../bot.js");

module.exports = {
	name: "version",
	description: "Tells you the current version of the bot. (If I have remembered to update it)",
  aliases: ["ver"],
  usage: `\`${prefix}ver\``,
	execute(message, args) {
    message.lineReplyNoMention(`Current version: ${ver}`);
    return;
	},
};

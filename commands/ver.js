const ver = require("../package.json").version;
const { replyNoMention } = require("../func/misc.js");

module.exports = {
	name: "version",
	description: `Tells you the current version of the bot. (If I have remembered to update it). Current version is \`${ver}\``,
  aliases: ["ver"],
  usage: `\`${ops.prefix}ver\``,
	execute(message) {
    return new Promise(function(resolve) {
			replyNoMention(message, `Current version: \`${ver}\``);
			resolve();
    });
	},
};

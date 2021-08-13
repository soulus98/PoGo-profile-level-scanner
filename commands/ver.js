module.exports = {
	name: "version",
	description: `Tells you the current version of the bot. (If I have remembered to update it). Current version is \`${ver}\``,
  aliases: ["ver"],
  usage: `\`${prefix}ver\``,
	execute(message, args) {
    message.lineReplyNoMention(`Current version: \`${ver}\``);
    return;
	},
};

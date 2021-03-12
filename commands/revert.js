const { prefix } = require("../config.json");
module.exports = {
	name: "revert-screenshot-role",
	aliases: ["revert", "revert-role"],
	cooldown: 5,
	description: "Will revert one member from having the Remote Raids role. ATM this is in development, and is most likely not needed.",
	usage: `\`${prefix}revert [@mention]\``,
	guildOnly: true,
	execute(message, args) {
    if (!message.mentions.users.size) {
			return message.reply("you must tag at least one user.");
		}
		const taggedUsers = message.mentions.users.map(user => {
		return `${user.username}`;
	});
		message.channel.send("You wanted to revert: " + taggedUsers + "\n Todo: make this work");
	},
};

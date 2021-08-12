const config = require("../server/config.json");
const prefix = config.chars.prefix;

module.exports = {
	name: "revert-screenshot-role",
	description: "Will revert one member from having the Remote Raids role. ATM this is in development, and is most likely not needed.",
	aliases: ["revert", "revert-role"],
	usage: `\`${prefix}revert [@mention]\``,
	guildOnly: true,
	execute(message, args) {
    if (!message.mentions.users.size) {
			message.lineReply("you must tag at least one user.");
			return `, but it failed, as a user was not mentioned.`;
		}
		const taggedUsers = message.mentions.users.map(user => {
			return `${user.username}`;
		});
		loggString = `, tagging ${taggedUsers}`;
		try {
			message.lineReplyNoMention("You wanted to revert: " + taggedUsers + "\n Todo: make this work");
			return `${loggString}, and it was successful.`;
		} catch(err){
			return `, but it failed, due to an unexpected error. Error: ${err}`;
		}
	},
};

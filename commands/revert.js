module.exports = {
	name: "revert-screenshot-role",
	description: "Will revert one member from having the Remote Raids role. ATM this is in development, and is most likely not needed.",
	aliases: ["revert", "revert-role"],
	usage: `\`${prefix}revert [@mention]\``,
	guildOnly: true,
	args: true,
	permissions: "MANAGE_ROLES",
	execute(message, args) {
		return new Promise(function(resolve, reject) {
			if (!message.mentions.users.size) {
				message.lineReply("you must tag at least one user.");
				resolve(`, but it failed, as a user was not mentioned.`);
				return;
			}
			const taggedUsers = message.mentions.users.map(user => {
				resolve(`${user.username}`);
				return;
			});
			loggString = `, tagging ${taggedUsers}`;
			try {
				message.lineReplyNoMention("You wanted to revert: " + taggedUsers + "\n Todo: make this work");
				resolve(`${loggString}, and it was successful.`);
				return;
			} catch(err){
				resolve(`, but it failed, due to an unexpected error. Error: ${err}`);
				return;
			}
		});
	},
};

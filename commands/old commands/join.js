module.exports = {
	name: "join",
	description: "new person test",
  aliases: [""],
  usage: `${ops.prefix}join`,
  cooldown: 5,
	execute(message, args) {
		return new Promise(function(resolve) {
			try {
				message.client.emit("guildMemberAdd", message.member);
				resolve(`, and it was successful.`);
				return;
			} catch(err){
				resolve(`, but it failed, due to an unexpected error. Error: ${err}`);
				return;
			}
		});
	},
};

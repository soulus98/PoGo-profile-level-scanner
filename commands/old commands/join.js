const config = require("../config.json");
const prefix = config.chars.prefix;
module.exports = {
	name: "join",
	description: "new person test",
  aliases: [""],
  usage: `${prefix}join`,
  cooldown: 5,
	execute(message, args) {
		try {
			message.client.emit("guildMemberAdd", message.member);
			return `, and it was successful.`;
		} catch(err){
			return `, but it failed, due to an unexpected error. Error: ${err}`;
		}
	},
};

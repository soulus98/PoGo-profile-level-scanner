const { prefix } = require("../config.json");

module.exports = {
	name: "join",
	description: "new person test",
  aliases: [""],
  usage: `${prefix}join`,
  cooldown: 5,
	execute(message, args) {
		console.log("Join test 1");
    message.client.emit("guildMemberAdd", message.member);
	},
};

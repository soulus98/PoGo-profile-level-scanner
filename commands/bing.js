const { prefix } = require("../config.json");
module.exports = {
	name: "bing",
	description: "Bing!",
	cooldown: 5,
	execute(message, args) {
		setTimeout(() => message.channel.send("Bong."),10000);
	},
};

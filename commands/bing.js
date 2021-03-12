const { prefix } = require("../config.json");
module.exports = {
	name: "bing",
	description: "Bing!",
	cooldown: 5,
	execute(message, args) {
    message.channel.send("Bong.");
	},
};
